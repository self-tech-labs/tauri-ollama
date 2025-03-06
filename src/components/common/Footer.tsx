import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const Footer: React.FC = () => {
  return (
    <Box 
      borderTopWidth="1px" 
      borderColor="gray.200" 
      pt={4} 
      mt={6}
      textAlign="center"
    >
      <Text fontSize="sm" color="gray.600">
        Développé par RITSL, Suisse
      </Text>
      <Text fontSize="sm" color="blue.600">
        <a href="https://ritsl.com" target="_blank" rel="noopener noreferrer">
          ritsl.com
        </a>
      </Text>
    </Box>
  );
};

export default Footer; 