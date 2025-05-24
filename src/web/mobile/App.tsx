import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, SafeAreaView, LogBox, AppState, AppStateStatus } from 'react-native';
import { ThemeProvider } from 'styled-components';
import { ErrorBoundary } from 'react-error-boundary';

// Import from the new design system packages
import { baseTheme } from '@austa/design-system/themes';
import { Box, Text } from '@design-system/primitives';
import { AppError, JourneyType } from '@austa/interfaces/common';
import {
  AuthProvider,
  JourneyProvider,
  NotificationProvider,
  GamificationProvider
} from '@austa/journey-context/providers';

import { RootNavigator } from './src/navigation/RootNavigator';
import { config } from './src/constants/config';

/**
 * The root component of the AUSTA SuperApp mobile application.
 * It sets up the authentication, journey, notification, and gamification contexts,
 * and renders the root navigator within a properly themed environment.
 *
 * Requirements Addressed:
 * - Journey-Centered Architecture: Preserves the three distinct user journeys ("Minha Saúde", 
 *   "Cuidar-me Agora", and "Meu Plano & Benefícios") through the JourneyProvider
 * - Cross-Journey Gamification: Maintains the centralized gamification engine that processes 
 *   events from all journeys through the GamificationProvider
 * - Platform Independence: Ensures consistent functionality across platforms through 
 *   shared code and design systems
 * - Component Boundaries: Establishes proper package exposure patterns with clear public APIs
 *   by using the standardized imports from the design system packages
 *
 * Technical Implementation:
 * - Uses @austa/design-system for theming and UI components
 * - Implements @design-system/primitives for foundational UI elements
 * - Leverages @austa/interfaces for type safety and data contracts
 * - Integrates @austa/journey-context for journey-specific state management
 * - Implements comprehensive error handling and recovery mechanisms
 * - Optimizes provider nesting for better performance and maintainability
 */
const App: React.FC = () => {
  // Track app state for proper status bar configuration
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Configure status bar based on platform with improved error handling
  useEffect(() => {
    try {
      // Configure status bar based on platform
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('light-content', true);
      } else if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#000000');
        StatusBar.setBarStyle('light-content');
      }

      // Handle app state changes to ensure status bar remains properly configured
      const subscription = AppState.addEventListener('change', nextAppState => {
        setAppState(nextAppState);
        if (nextAppState === 'active') {
          // Re-apply status bar settings when app becomes active
          if (Platform.OS === 'ios') {
            StatusBar.setBarStyle('light-content', true);
          } else if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor('#000000');
            StatusBar.setBarStyle('light-content');
          }
        }
      });

      // Ignore specific warnings that are known issues with dependencies
      LogBox.ignoreLogs([
        'ViewPropTypes will be removed',
        'ColorPropType will be removed',
      ]);

      return () => {
        // Clean up the subscription when component unmounts
        subscription.remove();
      };
    } catch (error) {
      console.error('Failed to configure status bar:', error);
      // Fallback to basic configuration
      StatusBar.setBarStyle('dark-content');
    }
  }, []);

  // Error handler for context initialization
  const handleContextError = (contextName: string, error: Error): void => {
    console.error(`Error initializing ${contextName} context:`, error);
    // Log error to monitoring service
    // This would connect to a monitoring service in production
  };

  // Fallback UI for critical errors
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <Box flex={1} justifyContent="center" alignItems="center" padding={4} backgroundColor="neutral.100">
      <Text variant="heading" color="error.500" marginBottom={4}>Something went wrong</Text>
      <Text variant="body" color="neutral.800" marginBottom={4}>{error.message}</Text>
      <Box 
        padding={3} 
        backgroundColor="primary.500"
        borderRadius="md"
        onPress={resetErrorBoundary}
      >
        <Text color="white">Try again</Text>
      </Box>
    </Box>
  );

  return (
    // ErrorBoundary wraps the entire app to catch any unhandled errors
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error('App Error:', error)}>
      {/* ThemeProvider with theme from @austa/design-system */}
      <ThemeProvider theme={baseTheme}>
        {/* Use Box from primitives for the root container with proper styling */}
        <Box flex={1} backgroundColor="neutral.50">
          <SafeAreaView style={{ flex: 1 }}>
            {/* Optimized provider nesting for better performance and error handling */}
            <AuthProvider 
              onError={(error) => handleContextError('Auth', error)}
              initializing={<Box flex={1} justifyContent="center" alignItems="center"><Text>Loading auth...</Text></Box>}
            >
              <JourneyProvider 
                onError={(error) => handleContextError('Journey', error)}
                supportedJourneys={[JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN]}
              >
                <GamificationProvider 
                  onError={(error) => handleContextError('Gamification', error)}
                  enabledByDefault={true}
                >
                  <NotificationProvider 
                    onError={(error) => handleContextError('Notification', error)}
                    requestPermissionsOnMount={true}
                  >
                    {/* Root navigator handles the main navigation logic */}
                    <RootNavigator />
                  </NotificationProvider>
                </GamificationProvider>
              </JourneyProvider>
            </AuthProvider>
          </SafeAreaView>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;