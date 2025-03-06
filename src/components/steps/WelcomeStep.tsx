import React from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useTutorial } from '../../context/TutorialContext';

const WelcomeStep: React.FC = () => {
  const { nextStep } = useTutorial();

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
        Bienvenue sur l'Anonymisation de Documents avec Ollama
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        Cette application vous guidera dans l'utilisation d'Ollama pour anonymiser des documents juridiques tout en garantissant la confidentialité des données.
      </Text>
      
      <Box p={4} bg="blue.50" borderRadius="md" width="100%" mb={6}>
        <Heading as="h3" size="md" mb={2} color="blue.700">
          Avantages Clés
        </Heading>
        <Box>
          <Text mb={2}>✓ <strong>Confidentialité Totale :</strong> Tout le traitement se fait localement sur votre ordinateur</Text>
          <Text mb={2}>✓ <strong>Aucun Partage de Données :</strong> Vos documents ne quittent jamais votre appareil</Text>
          <Text mb={2}>✓ <strong>IA Avancée :</strong> Utilise des modèles de langage de pointe pour une anonymisation précise</Text>
          <Text mb={2}>✓ <strong>Facile à Utiliser :</strong> Guide étape par étape pour les utilisateurs non techniques</Text>
        </Box>
      </Box>

      <Box p={4} bg="orange.50" borderRadius="md" width="100%" mb={6}>
        <Heading as="h3" size="md" mb={2} color="orange.700">
          Conditions d'Utilisation
        </Heading>
        <Text fontSize="sm" mb={2}>
          En tant que professionnel du droit, vous demeurez entièrement responsable de la vérification et de la validation des documents anonymisés. Bien que cette application traite toutes les données localement et n'envoie aucune information à l'extérieur, il est de votre responsabilité de :
        </Text>
        <Box pl={4}>
          <Text fontSize="sm" mb={1}>• Vérifier minutieusement chaque document après anonymisation</Text>
          <Text fontSize="sm" mb={1}>• Vous assurer qu'aucune information sensible ne subsiste</Text>
          <Text fontSize="sm" mb={1}>• Valider que l'anonymisation est conforme aux exigences légales en vigueur</Text>
        </Box>
      </Box>
      
      <Text fontSize="md" textAlign="center" fontStyle="italic" mb={6}>
        Cette application est conçue pour les professionnels du droit qui doivent anonymiser des documents sensibles tout en gardant un contrôle total sur leurs données.
      </Text>
      
      <Box textAlign="center">
        <Button 
          colorScheme="blue" 
          size="lg" 
          onClick={nextStep}
          mb={6}
        >
          Commencer
        </Button>
      </Box>
    </Box>
  );
};

export default WelcomeStep; 