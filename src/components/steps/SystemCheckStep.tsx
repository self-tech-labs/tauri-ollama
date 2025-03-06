import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Button, Spinner } from '@chakra-ui/react';
import { useTutorial } from '../../context/TutorialContext';
import { invoke } from '@tauri-apps/api/core';

const SystemCheckStep: React.FC = () => {
  const { nextStep, systemInfo, setSystemInfo } = useTutorial();
  const [isChecking, setIsChecking] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const performSystemCheck = async () => {
    setIsChecking(true);
    try {
      // Call the Rust command to get system information
      const info = await invoke<{
        os: string;
        arch: string;
        ollama_installed: boolean;
        ollama_running: boolean;
      }>('get_system_info');
      
      // Check if Ollama API is accessible
      const ollamaApiRunning = await invoke<boolean>('check_ollama_api');
      
      // Update the system info in the context
      setSystemInfo({
        os: info.os,
        arch: info.arch,
        ollamaInstalled: info.ollama_installed,
        ollamaRunning: info.ollama_running || ollamaApiRunning
      });
      
      setCheckComplete(true);
    } catch (error) {
      console.error('Error checking system:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    performSystemCheck();
  }, []);

  const getOsName = (os: string): string => {
    switch (os) {
      case 'macos':
        return 'macOS';
      case 'windows':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return os;
    }
  };

  const getArchName = (arch: string): string => {
    switch (arch) {
      case 'x86_64':
        return 'Intel/AMD 64-bit';
      case 'aarch64':
        return 'ARM 64-bit';
      default:
        return arch;
    }
  };

  const getStatusIcon = (condition: boolean): React.ReactNode => {
    return condition ? 
      <Text as="span" color="green.500" mr={2}>✓</Text> : 
      <Text as="span" color="red.500" mr={2}>✗</Text>;
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
        Vérification de Compatibilité du Système
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        Vérifions si votre système est compatible avec Ollama et prêt pour l'anonymisation de documents.
      </Text>
      
      {isChecking ? (
        <Box textAlign="center" my={10}>
          <Spinner size="xl" />
          <Text mt={4}>Vérification de votre système...</Text>
        </Box>
      ) : checkComplete ? (
        <Box>
          <Box p={4} bg="blue.50" borderRadius="md" mb={6}>
            <Heading as="h3" size="md" mb={4}>
              Informations Système
            </Heading>
            <Box mb={3}>
              <Text><strong>Système d'exploitation :</strong> {getOsName(systemInfo.os)}</Text>
            </Box>
            <Box mb={3}>
              <Text><strong>Architecture :</strong> {getArchName(systemInfo.arch)}</Text>
            </Box>
            <Box mb={3}>
              {getStatusIcon(systemInfo.ollamaInstalled)}
              <Text display="inline">
                <strong>Ollama installé :</strong> {systemInfo.ollamaInstalled ? 'Oui' : 'Non'}
              </Text>
            </Box>
            <Box mb={3}>
              {getStatusIcon(systemInfo.ollamaRunning)}
              <Text display="inline">
                <strong>Ollama en cours d'exécution :</strong> {systemInfo.ollamaRunning ? 'Oui' : 'Non'}
              </Text>
            </Box>
          </Box>
          
          <Box textAlign="center" mb={6}>
            {systemInfo.ollamaInstalled && systemInfo.ollamaRunning ? (
              <Text color="green.600" fontWeight="bold">
                Votre système est prêt à utiliser Ollama pour l'anonymisation de documents !
              </Text>
            ) : (
              <Text color="orange.600" fontWeight="bold">
                Certains composants doivent être installés ou démarrés. Nous allons vous guider dans le processus.
              </Text>
            )}
          </Box>
          
          <Box textAlign="center">
            <Button 
              colorScheme="blue" 
              size="lg" 
              onClick={nextStep}
            >
              Continuer
            </Button>
          </Box>
        </Box>
      ) : (
        <Box textAlign="center" my={10}>
          <Text color="red.500">La vérification du système a échoué. Veuillez réessayer.</Text>
          <Button 
            mt={4}
            colorScheme="blue" 
            onClick={performSystemCheck}
          >
            Réessayer
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SystemCheckStep; 