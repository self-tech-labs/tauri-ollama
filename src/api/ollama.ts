import axios from 'axios';

const OLLAMA_API_URL = 'http://localhost:11434/api';

// Interface for model information
export interface OllamaModel {
  id: string;
  name: string;
  size: number;
  quantization_level?: string;
  modified_at: string;
  digest: string;
}

// Interface for model list response
interface ListModelsResponse {
  models: OllamaModel[];
}

// Interface for generation request
export interface GenerationRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

// Interface for generation response
export interface GenerationResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  error?: string;
}

export interface AnonymizationOptions {
  temperature?: number;
  top_p?: number;
  num_predict?: number;
  stop?: string[];
}

export interface AnonymizationResult {
  success: boolean;
  error?: string;
  stats?: {
    totalTokens: number;
    processingTime: number;
    confidenceScore: number;
  };
}

// Add this new interface for the transformed response
interface TransformedGenerationResponse {
  text: string;
  stats: {
    totalTokens: number;
    processingTime: number;
    confidenceScore: number;
  };
}

// Function to list available models
export async function listModels(): Promise<OllamaModel[]> {
  try {
    const response = await axios.get<ListModelsResponse>(`${OLLAMA_API_URL}/tags`);
    return response.data.models;
  } catch (error) {
    console.error('Error listing models:', error);
    return [];
  }
}

// Function to check if a model is downloaded
export async function isModelDownloaded(modelName: string): Promise<boolean> {
  try {
    const models = await listModels();
    return models.some(model => model.name === modelName);
  } catch (error) {
    console.error('Error checking if model is downloaded:', error);
    return false;
  }
}

// Function to download a model
export async function downloadModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
  try {
    onProgress?.(0);
    
    // Start the download
    const downloadPromise = axios.post(`${OLLAMA_API_URL}/pull`, {
      name: modelName,
    }, {
      // Set a longer timeout since downloads can take a while
      timeout: 3600000 // 1 hour
    });

    // Initialize progress tracking
    let lastProgress = 0;
    let isCompleted = false;

    // Progress checking function
    const checkProgress = async () => {
      if (isCompleted) return;

      try {
        const models = await listModels();
        const model = models.find(m => m.name === modelName);
        
        if (model) {
          isCompleted = true;
          onProgress?.(100);
        } else {
          // Increment progress slowly to show activity
          lastProgress = Math.min(90, lastProgress + 5); // Cap at 90% until complete
          onProgress?.(lastProgress);
          
          // Continue polling
          setTimeout(checkProgress, 2000);
        }
      } catch (error) {
        console.error('Error checking download progress:', error);
        // Continue polling even on error
        setTimeout(checkProgress, 2000);
      }
    };

    // Start progress polling
    checkProgress();

    // Wait for download to complete
    const response = await downloadPromise;
    isCompleted = true;
    onProgress?.(100);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error downloading model:', error);
    return false;
  }
}

// Function to generate text for anonymization
export async function anonymizeText(
  modelName: string,
  text: string,
  onProgress?: (text: string, progress: number) => void,
  options?: AnonymizationOptions
): Promise<AnonymizationResult> {
  try {
    const startTime = Date.now();
    
    const systemPrompt = `
      You are a document anonymization assistant. Your task is to identify and replace all entities in the text that are either persons, institutions, or places with unique identifiers.

      Strict rules to follow:
      1. Identify all entities classified as persons, institutions, or places
      2. Assign a unique identifier (ENTITY_1, ENTITY_2, etc.) to each entity
      3. Replace both full names and partial occurrences with the same identifier
      4. Maintain the original document structure and formatting
      5. Be consistent with replacements (same entity = same identifier)
      6. Start the response with <anonymized> and end with </anonymized>
      7. Keep all non-confidential words unchanged
      8. The output text must be in French
      9. After the anonymized text, include a JSON list of all replacements in this format:
         [
           {"entity": "Original Name", "identifier": "ENTITY_X"},
           {"entity": "Partial Name", "identifier": "ENTITY_X"}
         ]

      Respond only with the anonymized text followed by the JSON list, without explanations or comments.
    `;

    const response = await axios.post<TransformedGenerationResponse>(
      `${OLLAMA_API_URL}/generate`,
      {
        model: modelName,
        prompt: text,
        system: systemPrompt,
        options: {
          temperature: options?.temperature ?? 0.1,
          top_p: options?.top_p ?? 0.95,
          num_predict: options?.num_predict ?? 2048,
          stop: options?.stop ?? ['</anonymized>'],
        },
      },
      {
        responseType: 'text',
        transformResponse: (data: string) => {
          const lines = data.split('\n').filter(line => line.trim());
          let fullResponse = '';
          let totalTokens = 0;
          
          for (const line of lines) {
            try {
              const parsedLine = JSON.parse(line) as GenerationResponse;
              
              if (parsedLine.error?.toLowerCase().includes('context length exceeded')) {
                throw new Error('CONTEXT_LENGTH_ERROR');
              }
              if (parsedLine.error?.toLowerCase().includes('out of memory') ||
                  parsedLine.error?.toLowerCase().includes('capacity')) {
                throw new Error('MODEL_CAPACITY_ERROR');
              }
              
              fullResponse += parsedLine.response;
              totalTokens += parsedLine.eval_duration ? 1 : 0;
              
              // Calculate progress based on response length relative to input length
              const progress = Math.min(
                100,
                Math.round((fullResponse.length / text.length) * 100)
              );
              onProgress?.(fullResponse, progress);
            } catch (e) {
              if ((e as Error).message === 'MODEL_CAPACITY_ERROR' ||
                  (e as Error).message === 'CONTEXT_LENGTH_ERROR') {
                throw e;
              }
              throw new Error('PARSING_ERROR');
            }
          }
          
          return {
            text: fullResponse,
            stats: {
              totalTokens,
              processingTime: Date.now() - startTime,
              confidenceScore: calculateConfidenceScore(text, fullResponse)
            }
          };
        },
      }
    );

    return {
      success: true,
      stats: response.data.stats
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'API_ERROR'
    };
  }
}

// Helper function to calculate confidence score based on various heuristics
function calculateConfidenceScore(original: string, anonymized: string): number {
  let score = 1.0;
  
  // Check if length is reasonably similar (allowing for marker replacements)
  const lengthRatio = anonymized.length / original.length;
  if (lengthRatio < 0.5 || lengthRatio > 2.0) {
    score *= 0.7;
  }
  
  // Check for presence of expected markers
  const expectedMarkers = ['[PERSONNE', '[ADRESSE', '[DATE', '[FINANCIER'];
  const hasMarkers = expectedMarkers.some(marker => anonymized.includes(marker));
  if (!hasMarkers) {
    score *= 0.5;
  }
  
  // Check for consistent formatting
  const originalLines = original.split('\n').length;
  const anonymizedLines = anonymized.split('\n').length;
  if (originalLines !== anonymizedLines) {
    score *= 0.8;
  }
  
  return Math.max(0.1, score);
}

// Add a new function to suggest a larger model
export function suggestLargerModel(currentModelId: string): string | null {
  const modelSizes = {
    'phi3:mini': 0,
    'phi3:small': 1,
    'phi3:base': 2,
    'mistral': 3,
    'llama2': 4
  };
  
  const currentSize = modelSizes[currentModelId as keyof typeof modelSizes];
  if (currentSize === undefined) return null;
  
  // Find the next larger model
  const nextModels = Object.entries(modelSizes)
    .filter(([_, size]) => size > currentSize)
    .sort(([_, a], [__, b]) => a - b);
    
  return nextModels.length > 0 ? nextModels[0][0] : null;
} 