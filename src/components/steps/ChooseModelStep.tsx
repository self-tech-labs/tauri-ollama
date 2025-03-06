import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Button, Spinner, Stack } from '@chakra-ui/react';
import { Radio, RadioGroup } from '../../components/ui/radio';
import { useTutorial } from '../../context/TutorialContext';
import { listModels } from '../../api/ollama';

// Define the available models
const AVAILABLE_MODELS = [
  {
    id: 'llama3:8b',
    name: 'Llama 3 8B',
    size: '4.7 GB',
    quantization: 'Q4_0',
    description: 'Un modèle léger adapté à la plupart des systèmes avec au moins 8 Go de RAM.'
  },
  {
    id: 'llama3:8b-instruct',
    name: 'Llama 3 8B Instruct',
    size: '4.7 GB',
    quantization: 'Q4_0',
    description: 'Version instruite de Llama 3 8B, optimisée pour suivre les instructions.'
  },
  {
    id: 'mistral:7b-instruct-v0.2',
    name: 'Mistral 7B Instruct',
    size: '4.1 GB',
    quantization: 'Q4_0',
    description: 'Un modèle puissant suivant les instructions avec de bonnes performances pour le traitement des documents.'
  },
  {
    id: 'phi3:mini',
    name: 'Phi-3 Mini',
    size: '1.8 GB',
    quantization: 'Q4_0',
    description: 'Le plus petit modèle Phi-3 de Microsoft, excellent pour les systèmes à faibles ressources.'
  }
];

const ChooseModelStep: React.FC = () => {
  const { nextStep, systemInfo, setSelectedModel, setAvailableModels } = useTutorial();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);

  // Check which models are already downloaded
  useEffect(() => {
    const checkDownloadedModels = async () => {
      setIsLoading(true);
      try {
        // Get the list of models from Ollama
        const ollamaModels = await listModels();
        
        // Check which of our predefined models are already downloaded
        const downloaded: string[] = [];
        for (const model of AVAILABLE_MODELS) {
          const isDownloaded = ollamaModels.some(m => m.name === model.id);
          if (isDownloaded) {
            downloaded.push(model.id);
          }
        }
        
        setDownloadedModels(downloaded);
        
        // If there's a downloaded model, select it by default
        if (downloaded.length > 0) {
          setSelectedModelId(downloaded[0]);
          const defaultModel = AVAILABLE_MODELS.find(m => m.id === downloaded[0]);
          if (defaultModel) {
            setSelectedModel({
              ...defaultModel,
              downloaded: true
            });
          }
        } else {
          // Otherwise, select the smallest model by default
          const smallestModel = AVAILABLE_MODELS.find(m => m.id === 'phi3:mini');
          if (smallestModel) {
            setSelectedModelId(smallestModel.id);
            setSelectedModel({
              ...smallestModel,
              downloaded: false
            });
          }
        }
        
        // Set the available models in the context
        setAvailableModels(AVAILABLE_MODELS.map(model => ({
          ...model,
          downloaded: downloaded.includes(model.id)
        })));
      } catch (error) {
        console.error('Error checking downloaded models:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (systemInfo.ollamaInstalled && systemInfo.ollamaRunning) {
      checkDownloadedModels();
    } else {
      setIsLoading(false);
    }
  }, [systemInfo, setSelectedModel, setAvailableModels]);

  const handleModelChange = (event: { value: string }) => {
    const modelId = event.value;
    setSelectedModelId(modelId);
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
      setSelectedModel({
        ...model,
        downloaded: downloadedModels.includes(modelId)
      });
    }
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <Box 
      p={8} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg="white" 
      borderColor="gray.200"
      shadow="md"
    >
      <Heading as="h1" size="xl" textAlign="center" mb={6}>
        Choisir un Modèle d'IA
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        Sélectionnez un modèle d'IA pour l'anonymisation des documents. Le modèle sera téléchargé sur votre ordinateur et exécuté localement.
      </Text>
      
      {isLoading ? (
        <Box textAlign="center" my={10}>
          <Spinner size="xl" />
          <Text mt={4}>Vérification des modèles disponibles...</Text>
        </Box>
      ) : !systemInfo.ollamaRunning ? (
        <Box p={4} bg="orange.50" borderRadius="md" mb={6}>
          <Text color="orange.600" fontWeight="bold" textAlign="center">
            Ollama n'est pas en cours d'exécution. Veuillez démarrer Ollama et revenir à cette étape.
          </Text>
        </Box>
      ) : (
        <Box>
          <Box p={4} bg="blue.50" borderRadius="md" mb={6}>
            <Text mb={4}>
              Choisissez un modèle en fonction des capacités de votre système :
            </Text>
            <RadioGroup onValueChange={handleModelChange} value={selectedModelId}>
              <Stack direction="column" gap={4}>
                {AVAILABLE_MODELS.map(model => (
                  <Box 
                    key={model.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={selectedModelId === model.id ? "blue.500" : "gray.200"}
                    bg={selectedModelId === model.id ? "blue.50" : "white"}
                  >
                    <Radio value={model.id}>
                      <Box>
                        <Text fontWeight="bold">{model.name}</Text>
                        <Text fontSize="sm">Taille : {model.size} • {downloadedModels.includes(model.id) ? 
                          <Text as="span" color="green.500">Déjà Téléchargé</Text> : 
                          <Text as="span">Nécessite un Téléchargement</Text>
                        }</Text>
                        <Text fontSize="sm" mt={1}>{model.description}</Text>
                      </Box>
                    </Radio>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </Box>
          
          <Box textAlign="center">
            <Button 
              colorScheme="blue" 
              size="lg" 
              onClick={handleContinue}
              disabled={!selectedModelId}
            >
              Continuer
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ChooseModelStep; 