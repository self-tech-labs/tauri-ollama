import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useTutorial } from '../../context/TutorialContext';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

const InstallOllamaStep: React.FC = () => {
  const { nextStep, systemInfo, setSystemInfo } = useTutorial();
  const [isChecking, setIsChecking] = useState(false);

  const checkOllamaStatus = async () => {
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
    } catch (error) {
      console.error('Error checking Ollama status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const getOllamaDownloadLink = (): string => {
    switch (systemInfo.os) {
      case 'macos':
        return 'https://ollama.com/download/mac';
      case 'windows':
        return 'https://ollama.com/download/windows';
      case 'linux':
        return 'https://ollama.com/download/linux';
      default:
        return 'https://ollama.com/download';
    }
  };

  const openOllamaDownloadPage = async () => {
    try {
      await openUrl(getOllamaDownloadLink());
    } catch (error) {
      console.error('Error opening Ollama download page:', error);
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
        Installer Ollama
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        Ollama est un outil qui vous permet d'exécuter des modèles d'IA localement sur votre ordinateur, garantissant que vos données ne quittent jamais votre appareil.
      </Text>
      
      <Box mb={6} p={4} bg="blue.50" borderRadius="md">
        {systemInfo.ollamaInstalled && systemInfo.ollamaRunning ? (
          <Text color="green.600" fontWeight="bold" textAlign="center">
            Ollama est installé et en cours d'exécution sur votre système !
          </Text>
        ) : systemInfo.ollamaInstalled && !systemInfo.ollamaRunning ? (
          <Text color="orange.600" fontWeight="bold" textAlign="center">
            Ollama est installé mais pas en cours d'exécution. Veuillez démarrer Ollama et cliquer sur "Vérifier à nouveau".
          </Text>
        ) : (
          <Text color="blue.600" fontWeight="bold" textAlign="center">
            Ollama doit être installé sur votre système.
          </Text>
        )}
      </Box>
      
      <Box textAlign="center" mb={6}>
        {!systemInfo.ollamaInstalled && (
          <Button 
            colorScheme="blue" 
            size="lg" 
            onClick={openOllamaDownloadPage}
            mb={4}
          >
            Télécharger Ollama
          </Button>
        )}
        
        <Button 
          colorScheme="green" 
          size="lg" 
          onClick={checkOllamaStatus}
          disabled={isChecking}
          mb={4}
        >
          Vérifier à Nouveau
        </Button>
      </Box>
      
      <Box textAlign="center">
        <Button 
          colorScheme="blue" 
          size="lg" 
          onClick={nextStep}
          disabled={!systemInfo.ollamaInstalled || !systemInfo.ollamaRunning}
        >
          Continuer
        </Button>
      </Box>
    </Box>
  );
};

export default InstallOllamaStep; 