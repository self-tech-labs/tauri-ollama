import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useTutorial } from '../../context/TutorialContext';
import { downloadModel, isModelDownloaded } from '../../api/ollama';

const DownloadModelStep: React.FC = () => {
  const { nextStep, selectedModel, setSelectedModel } = useTutorial();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the model is already downloaded
  useEffect(() => {
    const checkModelStatus = async () => {
      if (selectedModel) {
        try {
          const downloaded = await isModelDownloaded(selectedModel.id);
          setIsDownloaded(downloaded);
          
          if (downloaded) {
            setSelectedModel({
              ...selectedModel,
              downloaded: true
            });
          }
        } catch (error) {
          console.error('Error checking model status:', error);
          setError('Failed to check if the model is already downloaded.');
        }
      }
    };
    
    checkModelStatus();
  }, [selectedModel, setSelectedModel]);

  const handleDownload = async () => {
    if (!selectedModel) return;
    
    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);
    
    try {
      const success = await downloadModel(selectedModel.id, (progress) => {
        setDownloadProgress(progress);
      });
      
      if (success) {
        setIsDownloaded(true);
        setSelectedModel({
          ...selectedModel,
          downloaded: true
        });
      } else {
        setError('Failed to download the model. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      setError('An error occurred while downloading the model.');
    } finally {
      setIsDownloading(false);
    }
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
        Télécharger le Modèle d'IA
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        {isDownloaded 
          ? 'Le modèle sélectionné est prêt à être utilisé !' 
          : 'Téléchargez le modèle d\'IA sélectionné sur votre ordinateur pour le traitement local.'}
      </Text>
      
      {selectedModel ? (
        <Box>
          <Box p={4} bg="blue.50" borderRadius="md" mb={6}>
            <Heading as="h3" size="md" mb={2}>
              Modèle Sélectionné: {selectedModel.name}
            </Heading>
            <Text mb={2}>Taille: {selectedModel.size}</Text>
            <Text mb={2}>Quantification: {selectedModel.quantization}</Text>
            
            {isDownloading && (
              <Box mt={4}>
                <Text mb={2}>Téléchargement: {downloadProgress}%</Text>
                <Box 
                  w="100%" 
                  h="8px" 
                  bg="blue.100" 
                  borderRadius="full" 
                  overflow="hidden"
                >
                  <Box 
                    h="100%" 
                    w={`${downloadProgress}%`} 
                    bg="blue.500" 
                    transition="width 0.3s ease-in-out"
                  />
                </Box>
              </Box>
            )}
            
            {error && (
              <Box mt={4} p={3} bg="red.50" color="red.600" borderRadius="md">
                {error}
              </Box>
            )}
          </Box>
          
          <Box textAlign="center" mb={6}>
            {!isDownloaded && !isDownloading && (
              <Button 
                colorScheme="blue" 
                size="lg" 
                onClick={handleDownload}
                mb={4}
              >
                Télécharger le Modèle
              </Button>
            )}
            
            {isDownloaded && (
              <Text color="green.600" fontWeight="bold" mb={4}>
                Le modèle est prêt à être utilisé !
              </Text>
            )}
          </Box>
          
          <Box textAlign="center">
            <Button 
              colorScheme="blue" 
              size="lg" 
              onClick={nextStep}
              disabled={!isDownloaded || isDownloading}
            >
              Continuer
            </Button>
          </Box>
        </Box>
      ) : (
        <Box textAlign="center" p={4} bg="orange.50" borderRadius="md">
          <Text color="orange.600" fontWeight="bold">
            No model selected. Please go back and select a model.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default DownloadModelStep; 