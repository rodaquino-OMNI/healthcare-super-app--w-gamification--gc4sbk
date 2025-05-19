/**
 * @file Authentication Screens Barrel File
 * @description Exports all authentication screen components from the auth folder,
 * providing a centralized import point for authentication-related screens.
 * This simplifies imports elsewhere in the application and ensures consistent
 * component naming across the codebase.
 * 
 * @module @austa/mobile/screens/auth
 */

// Import screen components with their types
import LoginScreen from './Login';
import { RegisterScreen } from './Register';
import { ForgotPasswordScreen } from './ForgotPassword';
import MFAScreen from './MFA';

// Import component interfaces for type annotations
import type { 
  LoginScreenProps, 
  RegisterScreenProps, 
  ForgotPasswordScreenProps, 
  MFAScreenProps 
} from 'src/web/interfaces/components/auth.types';

// Re-export all authentication screen components with type annotations
export {
  /**
   * Screen component for user login functionality.
   * Provides email/password form with validation and authentication.
   */
  LoginScreen,
  
  /**
   * Screen component for new user registration.
   * Handles account creation with validation and terms acceptance.
   */
  RegisterScreen,
  
  /**
   * Screen component for password reset requests.
   * Allows users to request a password reset link via email.
   */
  ForgotPasswordScreen,
  
  /**
   * Screen component for multi-factor authentication.
   * Handles verification code entry for enhanced security.
   */
  MFAScreen
};

// Export component types for consumers
export type {
  LoginScreenProps,
  RegisterScreenProps,
  ForgotPasswordScreenProps,
  MFAScreenProps
};