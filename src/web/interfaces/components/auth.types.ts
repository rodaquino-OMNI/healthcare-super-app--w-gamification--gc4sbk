/**
 * Authentication Component Interfaces
 * 
 * Defines TypeScript interfaces for authentication-related UI components in the AUSTA SuperApp,
 * including Login, Register, ForgotPassword, and MFA screens. These interfaces ensure consistent
 * prop structures for authentication components while providing type safety for form data,
 * validation states, and authentication callbacks.
 */

import { ReactNode } from 'react';

/**
 * Common validation state for authentication forms
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
  fieldErrors: {
    [fieldName: string]: string;
  };
}

/**
 * Common authentication callback interface
 */
export interface AuthCallbacks {
  /**
   * Callback for successful authentication
   */
  onSuccess?: () => void;
  
  /**
   * Callback for authentication failure
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback for form cancellation
   */
  onCancel?: () => void;
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  /**
   * User email or username
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
export interface LoginProps extends AuthCallbacks {
  /**
   * Initial form data
   */
  initialValues?: Partial<LoginFormData>;
  
  /**
   * Validation state for the login form
   */
  validationState?: AuthValidationState;
  
  /**
   * Whether to show social login options
   */
  showSocialLogin?: boolean;
  
  /**
   * Custom login form header
   */
  header?: ReactNode;
  
  /**
   * Custom login form footer
   */
  footer?: ReactNode;
  
  /**
   * Callback for form submission
   */
  onSubmit: (data: LoginFormData) => Promise<void>;
  
  /**
   * Callback for navigating to registration
   */
  onRegisterClick?: () => void;
  
  /**
   * Callback for navigating to forgot password
   */
  onForgotPasswordClick?: () => void;
}

/**
 * Registration form data interface
 */
export interface RegisterFormData {
  /**
   * User email
   */
  email: string;
  
  /**
   * User password
   */
  password: string;
  
  /**
   * Password confirmation
   */
  confirmPassword: string;
  
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
   * Whether the user accepts the terms and conditions
   */
  acceptTerms: boolean;
}

/**
 * Registration component props interface
 */
export interface RegisterProps extends AuthCallbacks {
  /**
   * Initial form data
   */
  initialValues?: Partial<RegisterFormData>;
  
  /**
   * Validation state for the registration form
   */
  validationState?: AuthValidationState;
  
  /**
   * Whether to show social registration options
   */
  showSocialRegistration?: boolean;
  
  /**
   * Custom registration form header
   */
  header?: ReactNode;
  
  /**
   * Custom registration form footer
   */
  footer?: ReactNode;
  
  /**
   * Callback for form submission
   */
  onSubmit: (data: RegisterFormData) => Promise<void>;
  
  /**
   * Callback for navigating to login
   */
  onLoginClick?: () => void;
  
  /**
   * URL to terms and conditions
   */
  termsUrl?: string;
  
  /**
   * URL to privacy policy
   */
  privacyUrl?: string;
}

/**
 * Forgot password form data interface
 */
export interface ForgotPasswordFormData {
  /**
   * User email
   */
  email: string;
}

/**
 * Forgot password component props interface
 */
export interface ForgotPasswordProps extends AuthCallbacks {
  /**
   * Initial form data
   */
  initialValues?: Partial<ForgotPasswordFormData>;
  
  /**
   * Validation state for the forgot password form
   */
  validationState?: AuthValidationState;
  
  /**
   * Custom forgot password form header
   */
  header?: ReactNode;
  
  /**
   * Custom forgot password form footer
   */
  footer?: ReactNode;
  
  /**
   * Callback for form submission
   */
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  
  /**
   * Callback for navigating to login
   */
  onLoginClick?: () => void;
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
  confirmPassword: string;
  
  /**
   * Reset token from email
   */
  token: string;
}

/**
 * Reset password component props interface
 */
export interface ResetPasswordProps extends AuthCallbacks {
  /**
   * Initial form data
   */
  initialValues?: Partial<ResetPasswordFormData>;
  
  /**
   * Validation state for the reset password form
   */
  validationState?: AuthValidationState;
  
  /**
   * Custom reset password form header
   */
  header?: ReactNode;
  
  /**
   * Custom reset password form footer
   */
  footer?: ReactNode;
  
  /**
   * Callback for form submission
   */
  onSubmit: (data: ResetPasswordFormData) => Promise<void>;
  
  /**
   * Callback for navigating to login
   */
  onLoginClick?: () => void;
}

/**
 * MFA verification method types
 */
export enum MFAMethod {
  SMS = 'sms',
  EMAIL = 'email',
  AUTHENTICATOR = 'authenticator',
  RECOVERY_CODE = 'recovery_code'
}

/**
 * MFA verification form data interface
 */
export interface MFAFormData {
  /**
   * Verification code entered by the user
   */
  code: string;
  
  /**
   * Selected verification method
   */
  method: MFAMethod;
  
  /**
   * Whether to remember this device
   */
  rememberDevice?: boolean;
}

/**
 * MFA verification component props interface
 */
export interface MFAProps extends AuthCallbacks {
  /**
   * Initial form data
   */
  initialValues?: Partial<MFAFormData>;
  
  /**
   * Validation state for the MFA form
   */
  validationState?: AuthValidationState;
  
  /**
   * Available MFA methods for the user
   */
  availableMethods: MFAMethod[];
  
  /**
   * Custom MFA form header
   */
  header?: ReactNode;
  
  /**
   * Custom MFA form footer
   */
  footer?: ReactNode;
  
  /**
   * Callback for form submission
   */
  onSubmit: (data: MFAFormData) => Promise<void>;
  
  /**
   * Callback for requesting a new verification code
   */
  onResendCode?: (method: MFAMethod) => Promise<void>;
  
  /**
   * Callback for changing the verification method
   */
  onChangeMethod?: (method: MFAMethod) => void;
  
  /**
   * Callback for navigating to login
   */
  onLoginClick?: () => void;
  
  /**
   * Time remaining for the current verification code (in seconds)
   */
  codeExpiresIn?: number;
}

/**
 * MFA setup form data interface
 */
export interface MFASetupFormData {
  /**
   * Verification code entered by the user
   */
  code: string;
  
  /**
   * Selected verification method to set up
   */
  method: MFAMethod;
  
  /**
   * Phone number for SMS verification
   */
  phoneNumber?: string;
  
  /**
   * Email for email verification
   */
  email?: string;
}

/**
 * MFA setup component props interface
 */
export interface MFASetupProps extends AuthCallbacks {
  /**
   * Initial form data
   */
  initialValues?: Partial<MFASetupFormData>;
  
  /**
   * Validation state for the MFA setup form
   */
  validationState?: AuthValidationState;
  
  /**
   * Available MFA methods for setup
   */
  availableMethods: MFAMethod[];
  
  /**
   * Custom MFA setup form header
   */
  header?: ReactNode;
  
  /**
   * Custom MFA setup form footer
   */
  footer?: ReactNode;
  
  /**
   * Callback for form submission
   */
  onSubmit: (data: MFASetupFormData) => Promise<void>;
  
  /**
   * Callback for requesting a new verification code
   */
  onResendCode?: (method: MFAMethod) => Promise<void>;
  
  /**
   * Callback for changing the verification method
   */
  onChangeMethod?: (method: MFAMethod) => void;
  
  /**
   * QR code data URL for authenticator app setup
   */
  authenticatorQrCode?: string;
  
  /**
   * Secret key for manual authenticator app setup
   */
  authenticatorSecret?: string;
  
  /**
   * Recovery codes for the user
   */
  recoveryCodes?: string[];
  
  /**
   * Callback for skipping MFA setup
   */
  onSkip?: () => void;
}