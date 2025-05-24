/**
 * Entry point for the AUSTA SuperApp mobile application.
 * This file registers the main App component with React Native's AppRegistry and initializes essential services
 * like internationalization before rendering the app.
 *
 * @version 1.0.0
 * @package React Native 0.73.4
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { i18n } from './src/i18n';
import { initializeServices, setupErrorHandling } from '@austa/journey-context';
import { setupPerformanceMonitoring } from '@austa/interfaces';

/**
 * Initialize application services in the correct order
 * This ensures all required services are properly loaded before the app starts
 */
const initializeApp = async () => {
  try {
    // Step 1: Initialize i18n for internationalization
    await i18n;
    
    // Step 2: Setup error handling early to catch initialization errors
    setupErrorHandling();
    
    // Step 3: Initialize journey-specific services
    await initializeServices();
    
    // Step 4: Setup performance monitoring
    if (!__DEV__) {
      setupPerformanceMonitoring();
    }
    
    // Step 5: Configure environment-specific settings
    if (__DEV__) {
      // Development-specific configuration
      configureDevEnvironment();
    } else {
      // Production-specific configuration
      configureProductionEnvironment();
    }
    
    // Step 6: Register the App component with AppRegistry
    // This is the entry point for React Native to render our app
    AppRegistry.registerComponent(appName, () => App);
    
    console.log('AUSTA SuperApp initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Fallback registration in case of initialization failure
    // This ensures the app can still launch even if some services fail
    AppRegistry.registerComponent(appName, () => App);
  }
};

/**
 * Configure development environment settings
 * These settings are only applied in development mode
 */
const configureDevEnvironment = () => {
  // Ignore specific LogBox warnings for development
  LogBox.ignoreLogs([
    // React Native internal warnings
    'Require cycle:',
    'Remote debugger',
    'RCTBridge',
    'new NativeEventEmitter',
    
    // Library-specific warnings
    '[mobx]',
    'Sending `onAnimatedValueUpdate`',
    
    // New dependency warnings
    'NativeAnimated: Animations',
    'ViewPropTypes will be removed',
    'AsyncStorage has been extracted',
    'Animated: `useNativeDriver`',
    
    // Journey-specific warnings
    'Non-serializable values were found in the navigation state',
    'Overriding previous layout animation',
    
    // React Native 0.73.4 specific warnings
    'EventEmitter.removeListener',
    'Module AppRegistry requires',
  ]);
  
  // Enable more verbose console logging in development
  console.log('AUSTA SuperApp running in development mode');
};

/**
 * Configure production environment settings
 * These settings are only applied in production mode
 */
const configureProductionEnvironment = () => {
  // Disable all console logs in production for security and performance
  if (!__DEV__) {
    // Preserve original console methods for critical errors
    const originalConsoleError = console.error;
    
    // Override console methods
    console.log = () => {};
    console.warn = () => {};
    console.error = (error) => {
      // Only log critical errors that need attention
      if (error && typeof error === 'object' && error.isCritical) {
        // Use original console.error for critical errors
        originalConsoleError(error);
      }
    };
  }
};

// Start the application initialization process
initializeApp().catch(error => {
  console.error('Critical initialization error:', error);
});