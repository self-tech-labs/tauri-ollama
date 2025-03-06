import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import Footer from './components/common/Footer';

// Import step components
import WelcomeStep from './components/steps/WelcomeStep';
import SystemCheckStep from './components/steps/SystemCheckStep';
import InstallOllamaStep from './components/steps/InstallOllamaStep';
import ChooseModelStep from './components/steps/ChooseModelStep';
import DownloadModelStep from './components/steps/DownloadModelStep';
import TestAnonymizationStep from './components/steps/TestAnonymizationStep';
import CompleteStep from './components/steps/CompleteStep';

// Import context provider
import { TutorialProvider } from './context/TutorialContext';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <TutorialProvider>
        <Flex direction="column" minH="100vh">
          <Box flex="1" p={5}>
            <Routes>
              <Route path="/" element={<WelcomeStep />} />
              <Route path="/system-check" element={<SystemCheckStep />} />
              <Route path="/install-ollama" element={<InstallOllamaStep />} />
              <Route path="/choose-model" element={<ChooseModelStep />} />
              <Route path="/download-model" element={<DownloadModelStep />} />
              <Route path="/test-anonymization" element={<TestAnonymizationStep />} />
              <Route path="/complete" element={<CompleteStep />} />
            </Routes>
          </Box>
          <Navigation />
          <Footer />
        </Flex>
      </TutorialProvider>
    </Router>
  );
}

export default App; 