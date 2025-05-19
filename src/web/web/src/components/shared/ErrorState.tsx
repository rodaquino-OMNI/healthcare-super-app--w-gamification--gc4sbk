import React from 'react';
import { Button } from '@austa/design-system/components/Button';
import { Text } from '@design-system/primitives/components/Text';
import { Box } from '@design-system/primitives/components/Box';
import { useJourney } from '@austa/journey-context/hooks/useJourney';
import { ErrorStateProps } from '@austa/interfaces/components/core.types';

/**
 * A reusable component that displays an error message and provides a retry button.
 * This component is designed to be used throughout the application when an error
 * occurs during data fetching, form submission, or other operations.
 * 
 * The component supports journey-specific theming via the useJourney hook,
 * ensuring that error states maintain the visual identity of the current journey.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  // Get the current journey for theming
  const { journey } = useJourney();
  
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      padding="lg"
      journey={journey}
      data-testid="error-state"
    >
      <Box marginBottom="lg">
        <Text 
          fontSize="lg" 
          fontWeight="medium" 
          textAlign="center" 
          journey={journey}
        >
          {message}
        </Text>
      </Box>
      
      <Button 
        variant="primary" 
        onPress={onRetry}
        journey={journey}
        accessibilityLabel="Tentar novamente"
      >
        Tentar novamente
      </Button>
    </Box>
  );
};