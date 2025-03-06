import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import App from './App';
import './styles.css';
import ErrorBoundary from './ErrorBoundary';

// Create theme using the new v3 approach
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f7ff' },
          100: { value: '#b3e0ff' },
          200: { value: '#80caff' },
          300: { value: '#4db3ff' },
          400: { value: '#1a9dff' },
          500: { value: '#0080ff' },
          600: { value: '#0066cc' },
          700: { value: '#004d99' },
          800: { value: '#003366' },
          900: { value: '#001a33' },
        },
      },
      fonts: {
        heading: { value: 'Inter, system-ui, sans-serif' },
        body: { value: 'Inter, system-ui, sans-serif' },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ChakraProvider value={system}>
        <App />
      </ChakraProvider>
    </ErrorBoundary>
  </React.StrictMode>
); 