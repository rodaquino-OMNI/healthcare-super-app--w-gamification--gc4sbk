import React from 'react';
import { Box } from '@design-system/primitives/components/Box';
import { Stack } from '@design-system/primitives/components/Stack';
import { Text } from '@design-system/primitives/components/Text';
import { Button } from '@austa/design-system/components/Button';
import { useAuth } from 'src/web/web/src/hooks/useAuth';
import { AuthSession } from 'src/web/shared/types/auth.types';

/**
 * A top navigation bar component that displays the application title, 
 * user profile information, and a settings button.
 * Only visible on mobile viewports (< 992px).
 */
export const TopBar: React.FC = () => {
  // Retrieves the authentication status and session from the useAuth hook.
  const { session, isAuthenticated } = useAuth();

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      backgroundColor="white"
      borderBottomWidth={1}
      borderBottomColor="neutral.200"
      alignItems="center"
      justifyContent="space-between"
      padding="16px 24px"
      display={{
        base: 'flex',
        lg: 'none'
      }}
    >
      <Text fontSize="xl" fontWeight="medium">AUSTA</Text>
      
      {isAuthenticated && session ? (
        <Stack direction="row" alignItems="center" spacing="md">
          <Text fontSize="md" fontWeight="medium">{session.accessToken}</Text>
          <Button variant="secondary" size="sm">Settings</Button>
        </Stack>
      ) : (
        <Button variant="primary" size="sm">Login</Button>
      )}
    </Box>
  );
};