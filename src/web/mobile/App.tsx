import React, { useEffect, useState } from 'react'; // v18.2.0
import { StatusBar, Platform, View } from 'react-native'; // v0.71.8
import { ThemeProvider } from 'styled-components'; // v5.3.x compatible with RN 0.71.8
import { SafeAreaProvider } from 'react-native-safe-area-context'; // v4.5.0 compatible with RN 0.71.8

// Import from @austa/design-system package instead of direct imports
import { baseTheme } from '@austa/design-system/themes';
import { Box } from '@design-system/primitives/components/Box';

// Import from @austa/journey-context package
import { 
  AuthProvider, 
  JourneyProvider, 
  NotificationProvider,
  GamificationProvider
} from '@austa/journey-context/providers';

// Import from @austa/interfaces package
import { AppTheme, AppError } from '@austa/interfaces/common';

// Local imports
import { RootNavigator } from './src/navigation/RootNavigator';
import { config } from './src/constants/config';
import { ErrorBoundary } from './src/components/shared/ErrorBoundary';

/**
 * The root component of the AUSTA SuperApp mobile application.
 * It sets up the authentication, journey, gamification, and notification contexts,
 * and renders the root navigator within a safe area provider.
 *
 * Requirements Addressed:
 * - Journey-Centered Architecture: Preserves the three distinct user journeys through the JourneyProvider
 * - Cross-Journey Gamification: Maintains the centralized gamification engine through the GamificationProvider
 * - Platform Independence: Ensures consistent functionality through shared design system and context providers
 */
const App: React.FC = () => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  // Configure status bar based on platform
  useEffect(() => {
    try {
      // Enhanced platform-specific status bar configuration
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('light-content', true);
      } else if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(baseTheme.colors.background.primary);
        StatusBar.setBarStyle('light-content');
        StatusBar.setTranslucent(true);
      }
      
      // Mark app as ready after initial setup
      setIsReady(true);
    } catch (err) {
      setError({
        code: 'APP_INITIALIZATION_ERROR',
        message: 'Failed to initialize application',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  // Handle initialization error
  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="background.error">
        <ErrorBoundary error={error} />
      </Box>
    );
  }

  // Show loading state while initializing
  if (!isReady) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="background.primary">
        {/* Loading indicator would be rendered here */}
      </Box>
    );
  }

  // Optimized provider nesting for better performance
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={baseTheme as AppTheme}>
        <ErrorBoundary>
          <AuthProvider>
            <JourneyProvider>
              <GamificationProvider>
                <NotificationProvider>
                  <RootNavigator />
                </NotificationProvider>
              </GamificationProvider>
            </JourneyProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;