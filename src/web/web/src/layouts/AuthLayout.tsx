import React from 'react';
import { Box } from '@design-system/primitives';
import { Text } from '@design-system/primitives';
import { LayoutProps } from '@austa/interfaces/components';

/**
 * Interface for AuthLayout component props
 * @extends LayoutProps from @austa/interfaces/components
 */
export interface AuthLayoutProps extends LayoutProps {
  /**
   * The content to be rendered inside the authentication layout
   * (typically authentication forms like login, register, forgot password)
   */
  children: React.ReactNode;

  /**
   * Optional title to display in the header
   * @default 'AUSTA'
   */
  title?: string;
}

/**
 * Provides a consistent layout for authentication pages in the AUSTA SuperApp.
 * This component creates a centered container with appropriate styling for auth forms.
 * 
 * @param props - The component props
 * @param props.children - The authentication form or content to be displayed
 * @param props.title - Optional title to display in the header (defaults to 'AUSTA')
 * @returns A styled authentication layout component
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title = 'AUSTA' 
}) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      backgroundColor="gray.100"
      padding={{ base: 'sm', md: 'md', lg: 'lg' }}
      role="main"
      aria-labelledby="auth-title"
    >
      <Box
        backgroundColor="white"
        borderRadius="lg"
        boxShadow="md"
        padding={{ base: 'lg', md: 'xl' }}
        width="100%"
        maxWidth={{ base: '90%', sm: '450px' }}
        aria-label="Authentication form container"
      >
        <Box
          display="flex"
          justifyContent="center"
          marginBottom="xl"
        >
          <Text
            as="h1"
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            color="brand.primary"
            id="auth-title"
            textAlign="center"
          >
            {title}
          </Text>
        </Box>
        
        {children}
      </Box>
    </Box>
  );
};

export default AuthLayout;