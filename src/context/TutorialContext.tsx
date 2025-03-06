import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the steps in our tutorial
export const STEPS = [
  { id: 'welcome', path: '/', label: 'Bienvenue' },
  { id: 'system-check', path: '/system-check', label: 'Vérification du Système' },
  { id: 'install-ollama', path: '/install-ollama', label: 'Installation d\'Ollama' },
  { id: 'choose-model', path: '/choose-model', label: 'Choix du Modèle' },
  { id: 'download-model', path: '/download-model', label: 'Téléchargement du Modèle' },
  { id: 'test-anonymization', path: '/test-anonymization', label: 'Test d\'Anonymisation' },
  { id: 'complete', path: '/complete', label: 'Terminé' },
];

// Define the system information interface
interface SystemInfo {
  os: string;
  arch: string;
  ollamaInstalled: boolean;
  ollamaRunning: boolean;
}

// Define the model information interface
interface ModelInfo {
  id: string;
  name: string;
  size: string;
  quantization: string;
  downloaded: boolean;
}

// Define the tutorial context interface
interface TutorialContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepId: string) => void;
  systemInfo: SystemInfo;
  setSystemInfo: (info: SystemInfo) => void;
  selectedModel: ModelInfo | null;
  setSelectedModel: (model: ModelInfo | null) => void;
  availableModels: ModelInfo[];
  setAvailableModels: (models: ModelInfo[]) => void;
  originalText: string;
  setOriginalText: (text: string) => void;
  anonymizedText: string;
  setAnonymizedText: (text: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

// Create the context with default values
const TutorialContext = createContext<TutorialContextType>({
  currentStep: 0,
  setCurrentStep: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  systemInfo: { os: '', arch: '', ollamaInstalled: false, ollamaRunning: false },
  setSystemInfo: () => {},
  selectedModel: null,
  setSelectedModel: () => {},
  availableModels: [],
  setAvailableModels: () => {},
  originalText: '',
  setOriginalText: () => {},
  anonymizedText: '',
  setAnonymizedText: () => {},
  isProcessing: false,
  setIsProcessing: () => {},
});

// Create the provider component
export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({ 
    os: '', 
    arch: '', 
    ollamaInstalled: false, 
    ollamaRunning: false 
  });
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [originalText, setOriginalText] = useState('');
  const [anonymizedText, setAnonymizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      navigate(STEPS[nextStepIndex].path);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      navigate(STEPS[prevStepIndex].path);
    }
  };

  const goToStep = (stepId: string) => {
    const stepIndex = STEPS.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      navigate(STEPS[stepIndex].path);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        goToStep,
        systemInfo,
        setSystemInfo,
        selectedModel,
        setSelectedModel,
        availableModels,
        setAvailableModels,
        originalText,
        setOriginalText,
        anonymizedText,
        setAnonymizedText,
        isProcessing,
        setIsProcessing,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

// Create a custom hook to use the tutorial context
export const useTutorial = () => useContext(TutorialContext); 