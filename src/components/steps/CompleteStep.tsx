import React from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useTutorial } from '../../context/TutorialContext';
import { openUrl } from '@tauri-apps/plugin-opener';

const CompleteStep: React.FC = () => {
  const { goToStep } = useTutorial();

  const handleTryAgain = () => {
    goToStep('test-anonymization');
  };

  const handleStartOver = () => {
    goToStep('welcome');
  };

  const openOllamaWebsite = async () => {
    try {
      await openUrl('https://ollama.com');
    } catch (error) {
      console.error('Error opening Ollama website:', error);
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
        Félicitations !
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        Vous avez réussi à configurer Ollama et testé l'anonymisation de documents.
      </Text>
      
      <Box mb={6}>
        <Heading as="h2" size="md" mb={3}>
          Ce Que Vous Avez Accompli
        </Heading>
        <Box as="ul" pl={5} mb={4}>
          <Box as="li" mb={2}>Installation d'Ollama sur votre système</Box>
          <Box as="li" mb={2}>Téléchargement d'un puissant modèle d'IA</Box>
          <Box as="li" mb={2}>Test d'anonymisation de documents avec une IA locale préservant la confidentialité</Box>
        </Box>
      </Box>
      
      <Box mb={6}>
        <Heading as="h2" size="md" mb={3}>
          Prochaines Étapes
        </Heading>
        <Box as="ul" pl={5} mb={4}>
          <Box as="li" mb={2}>Utilisez Ollama pour vos besoins réels d'anonymisation de documents</Box>
          <Box as="li" mb={2}>Explorez d'autres modèles disponibles via Ollama</Box>
          <Box as="li" mb={2}>En savoir plus sur les capacités d'Ollama sur <Text as="span" color="blue.500" textDecoration="underline" cursor="pointer" onClick={openOllamaWebsite}>ollama.com</Text></Box>
        </Box>
      </Box>
      
      <Box display="flex" justifyContent="center" gap={4}>
        <Button 
          colorScheme="blue" 
          onClick={handleTryAgain}
        >
          Réessayer
        </Button>
        <Button 
          variant="outline" 
          onClick={handleStartOver}
        >
          Recommencer
        </Button>
      </Box>
    </Box>
  );
};

export default CompleteStep; 