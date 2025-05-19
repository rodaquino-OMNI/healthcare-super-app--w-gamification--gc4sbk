import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';

// Import from @austa/design-system for theming
import { baseTheme, useJourneyTheme } from '@austa/design-system/themes';

// Import from @austa/journey-context for journey-based state management
import { JourneyProvider, AuthProvider, useAuth, useJourney } from '@austa/journey-context/providers';

// Import from @austa/interfaces for shared TypeScript models
import { JourneyKey } from '@austa/interfaces/themes';
import { MOBILE_AUTH_ROUTES } from '@austa/interfaces/common';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

/**
 * Root navigator component that serves as the entry point for all app navigation.
 * It determines whether to show the authentication flow or the main app based on
 * the user's authentication status. It also provides theme and journey context
 * to all child components.
 * 
 * @returns {JSX.Element} The root navigation structure with appropriate providers
 */
export const RootNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <RootNavigatorWithAuth />
    </AuthProvider>
  );
};

/**
 * Internal component that uses authentication state to determine navigation flow.
 * This component is wrapped with AuthProvider in the parent component.
 * 
 * @returns {JSX.Element} Either the AuthNavigator or MainNavigator based on authentication status
 */
const RootNavigatorWithAuth: React.FC = () => {
  // Use the authentication state from journey-context
  const { isAuthenticated, session } = useAuth();

  return (
    <JourneyProvider defaultJourney="health">
      <ThemedNavigator isAuthenticated={isAuthenticated} />
    </JourneyProvider>
  );
};

/**
 * Component that applies the appropriate theme based on the current journey
 * and renders the navigation structure.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @returns {JSX.Element} Themed navigation container with appropriate navigator
 */
const ThemedNavigator: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  // Get the current journey to apply the appropriate theme
  const { currentJourney } = useJourney();
  const journeyTheme = useJourneyTheme(currentJourney as JourneyKey);

  return (
    <ThemeProvider theme={journeyTheme || baseTheme}>
      <NavigationContainer>
        {!isAuthenticated ? (
          // Render the AuthNavigator if the user is not authenticated
          <AuthNavigator />
        ) : (
          // Render the MainNavigator if the user is authenticated
          <MainNavigator />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
};