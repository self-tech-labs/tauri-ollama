import React from 'react';
import { Flex, Button, Box, Text } from '@chakra-ui/react';
import { useTutorial, STEPS } from '../context/TutorialContext';

const Navigation: React.FC = () => {
  const { currentStep, nextStep, prevStep, isProcessing } = useTutorial();
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;
  
  return (
    <Box borderTopWidth="1px" p={4} bg="white">
      <Box h="4px" w="100%" bg="gray.100" mb={4}>
        <Box h="100%" w={`${progressPercentage}%`} bg="blue.500" />
      </Box>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="sm" color="gray.600">
          Étape {currentStep + 1} sur {STEPS.length}: {STEPS[currentStep].label}
        </Text>
        <Flex>
          <Button
            variant="outline"
            mr={3}
            onClick={prevStep}
            disabled={currentStep === 0 || isProcessing}
          >
            Précédent
          </Button>
          <Button
            colorScheme="blue"
            onClick={nextStep}
            disabled={currentStep === STEPS.length - 1 || isProcessing}
            loading={isProcessing}
            loadingText="Traitement en cours"
          >
            {currentStep === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navigation; 