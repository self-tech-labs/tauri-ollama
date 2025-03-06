import React, { useState } from 'react';
import { Box, Heading, Text, Button, Textarea, Flex, Spinner } from '@chakra-ui/react';
import { useTutorial } from '../../context/TutorialContext';
import { anonymizeText, suggestLargerModel, downloadModel } from '../../api/ollama';

// Sample legal text for testing
const SAMPLE_TEXT = `ACCORD DE RÈGLEMENT ET DE LIBÉRATION

Cet Accord de Règlement et de Libération ("Accord") est conclu en date du 15 juin 2023, entre Pierre Dubois, résidant au 25 Avenue de la Gare, 1003 Lausanne, Suisse ("Demandeur"), et ABC Corporation, dont les bureaux sont situés au 456 Business Avenue, Suite 789, New York, NY 10002 ("Défendeur").

CONSIDÉRANT QUE le Demandeur a déposé une plainte contre le Défendeur auprès du Tribunal de District des États-Unis pour le District Sud de New York, Affaire n° 1:23-cv-12345-JD (le "Procès"), alléguant une discrimination à l'emploi;

CONSIDÉRANT QUE le Défendeur a nié et continue de nier toute faute ou responsabilité envers le Demandeur;

CONSIDÉRANT QUE le Demandeur et le Défendeur (collectivement, les "Parties") souhaitent régler pleinement et définitivement tous les différends entre eux, y compris, mais sans s'y limiter, tous les différends découlant du Procès;

PAR CONSÉQUENT, en considération des engagements et promesses mutuels contenus dans les présentes, et d'autres contreparties valables et valides, dont la réception et la suffisance sont reconnues par les présentes, les Parties conviennent de ce qui suit:

1. Paiement du Règlement. Le Défendeur versera au Demandeur la somme totale de Soixante-Quinze Mille Dollars (75 000,00 $) (le "Montant du Règlement") dans les trente (30) jours suivant la signature de cet Accord. Le paiement sera effectué par chèque à l'ordre de "Pierre Dubois" et remis à l'avocat du Demandeur, Marie Martin, au cabinet Martin & Associés, 10 Rue du Tribunal, 1003 Lausanne, Suisse.

2. Libération par le Demandeur. Le Demandeur libère et décharge définitivement le Défendeur, ses dirigeants, administrateurs, employés, agents, successeurs et ayants droit, de toutes réclamations, demandes, actions, causes d'action, obligations, dommages et responsabilités de toute nature, connues ou inconnues, que le Demandeur avait, a maintenant ou pourrait avoir à l'avenir contre le Défendeur découlant de ou liées à l'emploi du Demandeur auprès du Défendeur ou à sa cessation, y compris mais sans s'y limiter aux réclamations formulées dans le Procès.

3. Confidentialité. Les Parties s'engagent à garder strictement confidentiels les termes et conditions de cet Accord. Le Demandeur ne divulguera aucune information concernant cet Accord à quiconque autre que son avocat, son conseiller fiscal ou son conjoint, sauf si la loi l'exige.

4. Non-Admission. Cet Accord ne doit en aucun cas être interprété comme une admission par le Défendeur d'un acte répréhensible envers le Demandeur ou toute autre personne.

EN FOI DE QUOI, les Parties ont signé cet Accord à la date indiquée ci-dessus.

________________________
Pierre Dubois
Date: 15 juin 2023

________________________
Pour: ABC Corporation
Par: Robert Johnson, PDG
Date: 15 juin 2023`;

// Add new error type enum
enum AnonymizationError {
  MODEL_CAPACITY = 'MODEL_CAPACITY_ERROR',
  CONTEXT_LENGTH = 'CONTEXT_LENGTH_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// Add interface for anonymization stats
interface AnonymizationStats {
  totalTokens: number;
  processingTime: number;
  confidenceScore: number;
}

const TestAnonymizationStep: React.FC = () => {
  const { 
    nextStep, 
    selectedModel, 
    originalText, 
    setOriginalText, 
    anonymizedText, 
    setAnonymizedText, 
    isProcessing, 
    setIsProcessing,
    setSelectedModel 
  } = useTutorial();
  const [error, setError] = useState<string | null>(null);
  const [showModelUpgrade, setShowModelUpgrade] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [stats, setStats] = useState<AnonymizationStats | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value);
  };

  const handleUseSample = () => {
    setOriginalText(SAMPLE_TEXT);
  };

  const handleUpgradeModel = async () => {
    if (!selectedModel) return;
    
    const largerModel = suggestLargerModel(selectedModel.id);
    if (!largerModel) {
      setError("Désolé, il n'y a pas de modèle plus puissant disponible.");
      setShowModelUpgrade(false);
      return;
    }

    setIsUpgrading(true);
    setUpgradeProgress(0);
    
    try {
      const success = await downloadModel(largerModel, (progress) => {
        setUpgradeProgress(progress);
      });
      
      if (success) {
        // Update the selected model
        setSelectedModel({
          id: largerModel,
          name: largerModel.split(':')[0].toUpperCase(),
          size: "Plus grand modèle",
          quantization: "Optimisé",
          downloaded: true
        });
        setShowModelUpgrade(false);
        setError(null);
      } else {
        setError("Échec du téléchargement du modèle plus puissant. Veuillez réessayer.");
      }
    } catch (error) {
      setError("Une erreur s'est produite lors de la mise à niveau du modèle.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const getErrorMessage = (error: AnonymizationError): string => {
    switch (error) {
      case AnonymizationError.MODEL_CAPACITY:
        return 'Le modèle actuel ne semble pas assez puissant pour traiter ce document. Voulez-vous essayer avec un modèle plus puissant ?';
      case AnonymizationError.CONTEXT_LENGTH:
        return 'Le document est trop long pour être traité en une seule fois. Voulez-vous le diviser en sections plus petites ?';
      case AnonymizationError.PARSING_ERROR:
        return 'Une erreur est survenue lors de l\'analyse du document. Vérifiez le format du texte.';
      case AnonymizationError.API_ERROR:
        return 'Erreur de communication avec Ollama. Vérifiez que le service est bien en cours d\'exécution.';
      case AnonymizationError.TIMEOUT_ERROR:
        return 'Le traitement a pris trop de temps. Voulez-vous réessayer avec un modèle plus rapide ?';
      default:
        return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  };

  const handleAnonymize = async () => {
    if (!selectedModel || !originalText.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setAnonymizedText('');
    setShowModelUpgrade(false);
    setStats(null);
    setProcessingProgress(0);
    
    try {
      // Add system prompt with more precise instructions
      const result = await anonymizeText(
        selectedModel.id,
        originalText,
        (progressText, progress) => {
          setAnonymizedText(progressText);
          setProcessingProgress(progress);
        },
        {
          temperature: 0.1, // Lower temperature for more consistent results
          top_p: 0.95,
          num_predict: 2048,
          stop: ['</anonymized>'], // Add stop token for better control
        }
      );
      
      if (!result.success) {
        if (result.error === AnonymizationError.MODEL_CAPACITY) {
          setError(getErrorMessage(AnonymizationError.MODEL_CAPACITY));
          setShowModelUpgrade(true);
          
          // Suggest specific model based on document size
          const documentSize = new Blob([originalText]).size;
          const suggestedModel = getSuggestedModel(documentSize, selectedModel.id);
          if (suggestedModel) {
            setError(prev => `${prev}\n\nModèle recommandé : ${suggestedModel}`);
          }
        } else {
          setError(getErrorMessage(result.error as AnonymizationError));
        }
      } else if (result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error anonymizing text:', error);
      setError(getErrorMessage(AnonymizationError.API_ERROR));
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to suggest appropriate model based on document size
  const getSuggestedModel = (documentSize: number, currentModel: string): string | null => {
    const sizeThresholds = {
      'phi3:mini': 10000,    // 10KB
      'phi3:small': 50000,   // 50KB
      'phi3:base': 200000,   // 200KB
      'mistral': 500000,     // 500KB
      'llama2': 1000000      // 1MB
    };
    
    const modelHierarchy = ['phi3:mini', 'phi3:small', 'phi3:base', 'mistral', 'llama2'];
    const currentIndex = modelHierarchy.indexOf(currentModel);
    
    for (let i = currentIndex + 1; i < modelHierarchy.length; i++) {
      const model = modelHierarchy[i];
      if (documentSize <= sizeThresholds[model as keyof typeof sizeThresholds]) {
        return model;
      }
    }
    
    return null;
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
        Test d'Anonymisation de Document
      </Heading>
      
      <Text fontSize="lg" textAlign="center" mb={6}>
        Testez les capacités d'anonymisation en saisissant un document juridique ou en utilisant notre texte d'exemple.
      </Text>
      
      {selectedModel ? (
        <Box>
          <Box mb={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="bold">Document Original</Text>
              <Button size="sm" onClick={handleUseSample} disabled={isProcessing}>
                Utiliser le Texte d'Exemple
              </Button>
            </Flex>
            <Textarea
              value={originalText}
              onChange={handleTextChange}
              placeholder="Entrez ou collez votre document juridique ici..."
              height="200px"
              disabled={isProcessing}
            />
          </Box>
          
          <Box mb={6}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="bold">Résultat Anonymisé</Text>
              {isProcessing && <Spinner size="sm" />}
            </Flex>
            <Textarea
              value={anonymizedText}
              placeholder="Le texte anonymisé apparaîtra ici..."
              height="200px"
              readOnly
            />
          </Box>
          
          {error && (
            <Box p={3} bg="red.50" color="red.600" borderRadius="md" mb={6}>
              {error}
              {showModelUpgrade && (
                <Box mt={3}>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={handleUpgradeModel}
                    loading={isUpgrading}
                    loadingText="Téléchargement du modèle"
                  >
                    Télécharger un modèle plus puissant
                  </Button>
                  {isUpgrading && (
                    <Box mt={2}>
                      <Text fontSize="sm">Progression: {upgradeProgress}%</Text>
                      <Box w="100%" h="2px" bg="blue.100" mt={1}>
                        <Box
                          h="100%"
                          w={`${upgradeProgress}%`}
                          bg="blue.500"
                          transition="width 0.3s ease-in-out"
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
          
          {/* Add stats display */}
          {stats && (
            <Box mb={6} p={4} bg="blue.50" borderRadius="md">
              <Heading as="h3" size="sm" mb={3}>
                Statistiques d'Anonymisation
              </Heading>
              <Text>Temps de traitement : {stats.processingTime}ms</Text>
              <Text>Tokens traités : {stats.totalTokens}</Text>
              <Text>Score de confiance : {Math.round(stats.confidenceScore * 100)}%</Text>
            </Box>
          )}
          
          {/* Add progress bar */}
          {isProcessing && (
            <Box mb={6}>
              <Text fontSize="sm" mb={2}>Progression : {processingProgress}%</Text>
              <Box w="100%" h="2px" bg="blue.100">
                <Box
                  h="100%"
                  w={`${processingProgress}%`}
                  bg="blue.500"
                  transition="width 0.3s ease-in-out"
                />
              </Box>
            </Box>
          )}
          
          <Box textAlign="center" mb={6}>
            <Button 
              colorScheme="blue" 
              size="lg" 
              onClick={handleAnonymize}
              disabled={!originalText.trim() || isProcessing}
              loading={isProcessing}
              loadingText="Anonymisation"
            >
              Anonymiser le Document
            </Button>
          </Box>
          
          <Box textAlign="center">
            <Button 
              colorScheme="blue" 
              size="lg" 
              onClick={nextStep}
              disabled={!anonymizedText.trim() || isProcessing}
            >
              Continuer
            </Button>
          </Box>
        </Box>
      ) : (
        <Box textAlign="center" p={4} bg="orange.50" borderRadius="md">
          <Text color="orange.600" fontWeight="bold">
            Aucun modèle sélectionné. Veuillez revenir en arrière et sélectionner un modèle.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TestAnonymizationStep; 