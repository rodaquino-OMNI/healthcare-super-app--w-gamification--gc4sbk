import type { NextPage } from 'next';
import React from 'react';
import { Box } from '@design-system/primitives';
import { Text, Button } from '@austa/design-system';
import { useRouter } from 'next/router';
import { routes } from '@austa/journey-context';

/**
 * ServerErrorPage - 500 error page component
 * 
 * Displays a user-friendly server error message with retry and home navigation options.
 * Uses components from @austa/design-system for consistent styling and imports
 * navigation constants from @austa/journey-context for reliable routing.
 */
const ServerErrorPage: NextPage = () => {
  const router = useRouter();
  // Care journey color - used for error pages to signal attention and care
  const careJourneyColor = '#FF8C42';

  const handleGoHome = () => {
    router.push(routes.HOME);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      padding="16px"
      backgroundColor="#FFF8F0" // Care journey background
    >
      <Box
        maxWidth="600px"
        padding="24px"
        backgroundColor="white"
        borderRadius="8px"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        borderLeft={`4px solid ${careJourneyColor}`}
        textAlign="center"
      >
        <Box
          display="flex"
          justifyContent="center"
          marginBottom="16px"
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={careJourneyColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke={careJourneyColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke={careJourneyColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>
        
        <Text variant="heading2" color="#212121" marginBottom="16px">
          Encontramos um problema
        </Text>
        
        <Text variant="body" color="#616161" marginBottom="8px">
          Desculpe pelo inconveniente. Nosso servidor encontrou um erro inesperado.
        </Text>
        
        <Text variant="body" color="#616161" marginBottom="8px">
          Nossa equipe técnica foi notificada e estamos trabalhando para resolver o problema.
        </Text>
        
        <Box
          display="flex"
          flexDirection={['column', 'column', 'row']} // Responsive: column on mobile, row on desktop
          justifyContent="center"
          gap={['8px', '8px', '16px']} // Responsive gap
          marginTop="24px"
        >
          <Button 
            variant="primary" 
            color="care" 
            onClick={handleGoHome}
            fullWidth
          >
            Voltar para a página inicial
          </Button>
          
          <Button 
            variant="secondary" 
            color="care" 
            onClick={handleRetry}
            fullWidth
          >
            Tentar novamente
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ServerErrorPage;