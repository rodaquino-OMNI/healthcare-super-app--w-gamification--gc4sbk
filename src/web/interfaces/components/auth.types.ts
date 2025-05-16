/**
 * Authentication Component Interfaces
 * 
 * This file defines TypeScript interfaces for authentication-related UI components
 * in the AUSTA SuperApp, including Login, Register, ForgotPassword, and MFA screens.
 * These interfaces ensure consistent prop structures for authentication components
 * while providing type safety for form data, validation states, and authentication callbacks.
 */

import { AuthSession } from '../auth/session.types';
import { AuthState } from '../auth/state.types';

/**
 * Common validation state interface for authentication forms
 */
export interface AuthValidationState {
  /**
   * Whether the form has been submitted and validated
   */
  isValidated: boolean;
  
  /**
   * Whether the form is currently being submitted
   */
  isSubmitting: boolean;
  
  /**
   * General error message for the form
   */
  generalError?: string;
  
  /**
   * Field-specific error messages
   */
  fieldErrors: Record<string, string>;
}

/**
 * Common authentication callback interface
 */
export interface AuthCallbacks {
  /**
   * Callback for successful authentication
   */
  onSuccess: (session: AuthSession) => void;
  
  /**
   * Callback for authentication failure
   */
  onError: (error: Error) => void;
  
  /**
   * Callback for canceling the authentication process
   */
  onCancel?: () => void;
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  /**
   * User email address
   */
  email: string;
  
  /**
   * User password
   */
  password: string;
  
  /**
   * Whether to remember the user's session
   */
  rememberMe?: boolean;
}

/**
 * Login component props interface
 */
export interface LoginComponentProps {
  /**
   * Initial form data
   */
  initialValues?: Partial<LoginFormData>;
  
  /**
   * Current validation state
   */
  validationState?: AuthValidationState;
  
  /**
   * Authentication callbacks
   */
  callbacks: AuthCallbacks;
  
  /**
   * Whether to show social login options
   */
  showSocialLogin?: boolean;
  
  /**
   * Navigation callback to registration screen
   */
  onRegisterClick?: () => void;
  
  /**
   * Navigation callback to forgot password screen
   */
  onForgotPasswordClick?: () => void;
  
  /**
   * Journey-specific theme to apply
   */
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Registration form data interface
 */
export interface RegisterFormData {
  /**
   * User email address
   */
  email: string;
  
  /**
   * User password
   */
  password: string;
  
  /**
   * Password confirmation
   */
  passwordConfirmation: string;
  
  /**
   * User's first name
   */
  firstName: string;
  
  /**
   * User's last name
   */
  lastName: string;
  
  /**
   * User's date of birth
   */
  dateOfBirth?: string;
  
  /**
   * User's phone number
   */
  phoneNumber?: string;
  
  /**
   * Whether the user accepts the terms and conditions
   */
  acceptTerms: boolean;
}

/**
 * Register component props interface
 */
export interface RegisterComponentProps {
  /**
   * Initial form data
   */
  initialValues?: Partial<RegisterFormData>;
  
  /**
   * Current validation state
   */
  validationState?: AuthValidationState;
  
  /**
   * Authentication callbacks
   */
  callbacks: AuthCallbacks;
  
  /**
   * Whether to show social registration options
   */
  showSocialRegistration?: boolean;
  
  /**
   * Navigation callback to login screen
   */
  onLoginClick?: () => void;
  
  /**
   * Journey-specific theme to apply
   */
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Forgot password form data interface
 */
export interface ForgotPasswordFormData {
  /**
   * User email address
   */
  email: string;
}

/**
 * Reset password form data interface
 */
export interface ResetPasswordFormData {
  /**
   * New password
   */
  password: string;
  
  /**
   * Password confirmation
   */
  passwordConfirmation: string;
  
  /**
   * Reset token received via email
   */
  token: string;
}

/**
 * Forgot password component props interface
 */
export interface ForgotPasswordComponentProps {
  /**
   * Initial form data
   */
  initialValues?: Partial<ForgotPasswordFormData>;
  
  /**
   * Current validation state
   */
  validationState?: AuthValidationState;
  
  /**
   * Callback for successful password reset request
   */
  onRequestSuccess: () => void;
  
  /**
   * Callback for password reset request failure
   */
  onRequestError: (error: Error) => void;
  
  /**
   * Navigation callback to login screen
   */
  onLoginClick?: () => void;
  
  /**
   * Journey-specific theme to apply
   */
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Reset password component props interface
 */
export interface ResetPasswordComponentProps {
  /**
   * Initial form data
   */
  initialValues?: Partial<ResetPasswordFormData>;
  
  /**
   * Current validation state
   */
  validationState?: AuthValidationState;
  
  /**
   * Callback for successful password reset
   */
  onResetSuccess: () => void;
  
  /**
   * Callback for password reset failure
   */
  onResetError: (error: Error) => void;
  
  /**
   * Navigation callback to login screen
   */
  onLoginClick?: () => void;
  
  /**
   * Journey-specific theme to apply
   */
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Multi-factor authentication method type
 */
export type MFAMethod = 'sms' | 'email' | 'authenticator';

/**
 * Multi-factor authentication form data interface
 */
export interface MFAFormData {
  /**
   * Verification code entered by the user
   */
  code: string;
  
  /**
   * Selected MFA method
   */
  method: MFAMethod;
}

/**
 * Multi-factor authentication component props interface
 */
export interface MFAComponentProps {
  /**
   * Initial form data
   */
  initialValues?: Partial<MFAFormData>;
  
  /**
   * Current validation state
   */
  validationState?: AuthValidationState;
  
  /**
   * Authentication callbacks
   */
  callbacks: AuthCallbacks;
  
  /**
   * Available MFA methods for the user
   */
  availableMethods: MFAMethod[];
  
  /**
   * Callback to resend verification code
   */
  onResendCode: (method: MFAMethod) => Promise<void>;
  
  /**
   * Callback to change MFA method
   */
  onChangeMethod: (method: MFAMethod) => void;
  
  /**
   * Journey-specific theme to apply
   */
  journeyTheme?: 'health' | 'care' | 'plan';
}

/**
 * Authentication container component props interface
 */
export interface AuthContainerProps {
  /**
   * Current authentication state
   */
  authState: AuthState;
  
  /**
   * Children components
   */
  children: React.ReactNode;
  
  /**
   * Whether to show the loading state
   */
  showLoading?: boolean;
  
  /**
   * Journey-specific theme to apply
   */
  journeyTheme?: 'health' | 'care' | 'plan';
}