import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from 'styled-components/native';

// Import screens
import Login from '../screens/auth/Login';
import RegisterScreen from '../screens/auth/Register';
import ForgotPasswordScreen from '../screens/auth/ForgotPassword';

// Import from @austa/interfaces for type definitions
import { AuthRoutes } from '@austa/interfaces/auth';

// Import from design system for theming
import { baseTheme } from '@austa/design-system/src/themes';
import { Text } from '@design-system/primitives/src/components/Text';
import { Box } from '@design-system/primitives/src/components/Box';

// Create a stack navigator
const Stack = createStackNavigator();

/**
 * Custom header component that uses design system components
 */
const AuthHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <Box 
      backgroundColor={baseTheme.colors.neutral.white}
      paddingVertical={baseTheme.spacing.sm}
      paddingHorizontal={baseTheme.spacing.md}
      borderBottomWidth={1}
      borderBottomColor={baseTheme.colors.neutral.gray200}
    >
      <Text 
        fontSize="lg" 
        fontWeight="bold"
        color={baseTheme.colors.brand.primary}
        textAlign="center"
      >
        {title}
      </Text>
    </Box>
  );
};

/**
 * A React component that defines the navigation stack for the authentication flow.
 */
const AuthStack = () => {
  return (
    <ThemeProvider theme={baseTheme}>
      <Stack.Navigator
        initialRouteName={AuthRoutes.LOGIN}
        screenOptions={{
          headerShown: true,
          header: ({ scene }) => (
            <AuthHeader title={scene.route.name === AuthRoutes.LOGIN ? 'Login' : 
                        scene.route.name === AuthRoutes.REGISTER ? 'Register' : 'Forgot Password'} />
          ),
          cardStyle: { backgroundColor: baseTheme.colors.neutral.white },
        }}
      >
        <Stack.Screen name={AuthRoutes.LOGIN} component={Login} />
        <Stack.Screen name={AuthRoutes.REGISTER} component={RegisterScreen} />
        <Stack.Screen name={AuthRoutes.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </ThemeProvider>
  );
};

/**
 * A React component that renders the navigation stack for the authentication flow.
 * Uses the design system theming for consistent styling across the application.
 */
export const AuthNavigator: React.FC = () => {
  return (
    <AuthStack />
  );
};