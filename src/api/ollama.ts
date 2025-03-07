import axios from 'axios';

export const OLLAMA_API_URL = 'http://localhost:11434/api';

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

// Add these specific marker types to improve consistency
const MARKER_TYPES = {
  PERSON: 'PERSONNE',
  LOCATION: 'LIEU',
  ORGANIZATION: 'ORGANISATION',
  FINANCIAL: 'MONTANT'
} as const;

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
    
    // First check if the model is already downloaded
    const alreadyDownloaded = await isModelDownloaded(modelName);
    if (alreadyDownloaded) {
      onProgress?.(100);
      return true;
    }
    
    // Create a controller to abort the request if needed
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Make the request with raw response type to handle streaming
    console.log(`Starting download of model: ${modelName}`);
    const response = await fetch(`${OLLAMA_API_URL}/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      signal,
    });
    
    if (!response.ok) {
      console.error(`Failed to start download: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to start download: ${response.statusText}`);
    }
    
    if (!response.body) {
      console.error('Response body is null');
      throw new Error('Response body is null');
    }
    
    // Set up a reader for the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Variables to track progress
    let lastProgressUpdate = Date.now();
    let progressCounter = 0;
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Download stream completed');
        break;
      }
      
      // Process the chunk
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
      
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          console.log('Parsed data:', data);
          
          // Check for progress information
          if (data.status === 'downloading') {
            if (data.completed !== undefined && data.total !== undefined) {
              const progress = Math.round((data.completed / data.total) * 100);
              onProgress?.(progress);
              console.log(`Download progress: ${progress}%`);
            } else {
              // If we don't have completed/total, update progress periodically
              const now = Date.now();
              if (now - lastProgressUpdate > 1000) { // Update every second
                progressCounter = Math.min(95, progressCounter + 5);
                onProgress?.(progressCounter);
                lastProgressUpdate = now;
                console.log(`Estimated progress: ${progressCounter}%`);
              }
            }
          }
          
          // Check for completion
          if (data.status === 'success') {
            console.log('Download completed successfully');
            onProgress?.(100);
            return true;
          }
          
          // Check for errors
          if (data.error) {
            console.error('Error in download response:', data.error);
            throw new Error(data.error);
          }
        } catch (e) {
          // Only log if it's not a JSON parse error for incomplete lines
          if (line.trim().length > 0 && line.trim() !== '{' && !line.includes('}')) {
            console.warn('Failed to parse line:', line, e);
          }
        }
      }
    }
    
    // Verify the model was downloaded successfully
    console.log('Verifying model download...');
    const isDownloaded = await isModelDownloaded(modelName);
    if (isDownloaded) {
      console.log('Model verified as downloaded');
      onProgress?.(100);
      return true;
    }
    
    console.log('Model verification failed');
    return false;
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
You are an anonymization assistant. Replace all sensitive entities in the text with identifiers.

Rules:
1. Replace persons, institutions, and places with ENTITY_N (N=1,2,...)
2. Use consistent identifiers (same entity gets same number)
3. Keep document structure and non-sensitive text unchanged
4. Output in French
5. Start with <anonymized> and end with </anonymized>
6. After text, list replacements as JSON:
[{"entity": "Original", "identifier": "ENTITY_N"}]
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

// Improve the confidence score calculation
function calculateConfidenceScore(original: string, anonymized: string): number {
  let score = 1.0;
  
  // Check for required wrapper tags
  if (!anonymized.startsWith('<anonymized>') || !anonymized.endsWith('</anonymized>')) {
    score *= 0.5;
  }
  
  // Check for JSON replacements section
  if (!anonymized.includes('"entities":')) {
    score *= 0.6;
  }
  
  // Check for proper French markers
  const expectedMarkers = Object.values(MARKER_TYPES);
  const markersFound = expectedMarkers.filter(marker => 
    anonymized.includes(`[${marker}_`)
  ).length;
  score *= (markersFound / expectedMarkers.length) * 0.8 + 0.2;
  
  // Verify JSON structure
  try {
    const jsonStart = anonymized.lastIndexOf('{');
    const jsonEnd = anonymized.lastIndexOf('}');
    if (jsonStart > -1 && jsonEnd > -1) {
      JSON.parse(anonymized.substring(jsonStart, jsonEnd + 1));
    } else {
      score *= 0.7;
    }
  } catch {
    score *= 0.5;
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