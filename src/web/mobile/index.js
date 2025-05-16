/**
 * Entry point for the AUSTA SuperApp mobile application.
 * This file registers the main App component with React Native's AppRegistry and initializes essential services
 * like internationalization, journey context, and design system before rendering the app.
 *
 * @package react-native v0.73.4
 * @package @austa/design-system
 * @package @design-system/primitives
 * @package @austa/interfaces
 * @package @austa/journey-context
 */

import { AppRegistry, LogBox, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { i18n } from './src/i18n';
import { initJourneyContext } from '@austa/journey-context';
import { initDesignSystem } from '@austa/design-system';

// Environment-specific configuration
const isDevEnv = __DEV__;

/**
 * Initialize all required services before rendering the app
 * This ensures proper initialization order and better startup performance
 */
async function initializeApp() {
  try {
    // Initialize internationalization
    await i18n;
    console.log('i18n initialized successfully');

    // Initialize journey context
    await initJourneyContext();
    console.log('Journey context initialized successfully');

    // Initialize design system
    await initDesignSystem();
    console.log('Design system initialized successfully');

    // Configure LogBox to ignore specific warnings
    // These warnings are related to dependencies and don't affect functionality
    LogBox.ignoreLogs([
      'Require cycle:',
      'Remote debugger',
      'RCTBridge',
      'new NativeEventEmitter',
      '[mobx]',
      // New warnings to suppress related to the new dependencies
      'Sending `onAnimatedValueUpdate` with no listeners registered',
      'Non-serializable values were found in the navigation state',
      'ViewPropTypes will be removed from React Native',
      'Animated: `useNativeDriver` was not specified',
      'componentWillReceiveProps has been renamed',
      'componentWillMount has been renamed',
    ]);

    // Development-only warnings and configurations
    if (isDevEnv) {
      // Add additional development-specific logging
      console.log(`Running in development mode on ${Platform.OS}`);
      
      // Enable more verbose logging in development
      if (Platform.OS === 'android') {
        // Android-specific development settings
        console.log('Android development mode enabled');
      } else if (Platform.OS === 'ios') {
        // iOS-specific development settings
        console.log('iOS development mode enabled');
      }
    } else {
      // Production-specific configurations
      // Disable all console logs in production
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }

    // Register the App component with AppRegistry
    // Using a function to ensure proper component instantiation for React Native 0.73.4
    AppRegistry.registerComponent(appName, () => App);
  } catch (error) {
    // Enhanced error handling for initialization failures
    console.error('Failed to initialize application:', error);
    
    // Log additional diagnostic information
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    
    // Attempt to register the App component anyway to show an error screen
    AppRegistry.registerComponent(appName, () => App);
  }
}

// Start the initialization process
initializeApp();