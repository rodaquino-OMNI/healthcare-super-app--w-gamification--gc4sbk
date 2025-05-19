import { IUserProfile } from '@austa/interfaces/auth/user.types';

/**
 * Extended user profile interface for the auth service.
 * Extends the shared IUserProfile interface from @austa/interfaces with
 * auth-service specific properties.
 */
export interface UserProfile extends IUserProfile {
  /**
   * Unique identifier for the user.
   * This property is readonly to ensure immutability.
   */
  readonly id: string;

  /**
   * Full name of the user.
   */
  name: string;

  /**
   * Email address of the user (must be unique).
   * Used as the primary identifier for authentication.
   */
  email: string;

  /**
   * Phone number of the user (optional).
   * Can be used for MFA and notifications.
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional).
   * Used for identity verification in Brazilian healthcare context.
   */
  cpf?: string;

  /**
   * Timestamp of when the user was created.
   * This property is readonly to ensure immutability.
   */
  readonly createdAt: Date;

  /**
   * Timestamp of when the user was last updated.
   */
  updatedAt: Date;

  /**
   * Flag indicating if the user's email has been verified.
   * Required for security compliance.
   */
  emailVerified: boolean;

  /**
   * Flag indicating if the user's phone has been verified.
   * Required for MFA and security compliance.
   */
  phoneVerified: boolean;

  /**
   * User's preferred language for the application.
   * Supports 'pt-BR' (Portuguese) and 'en-US' (English).
   */
  preferredLanguage: 'pt-BR' | 'en-US';

  /**
   * User's preferred notification channels.
   * Can include multiple channels for different notification types.
   */
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };

  /**
   * Last successful login timestamp.
   * Used for security monitoring and session management.
   */
  lastLoginAt?: Date;

  /**
   * Last password change timestamp.
   * Used for security compliance and password expiration policies.
   */
  lastPasswordChangeAt?: Date;

  /**
   * Security settings for the user's account.
   */
  securitySettings: {
    /**
     * Whether multi-factor authentication is enabled for this user.
     */
    mfaEnabled: boolean;
    
    /**
     * Preferred MFA method when enabled.
     */
    mfaMethod?: 'sms' | 'email' | 'authenticator';
    
    /**
     * Whether to require password reset on next login.
     */
    requirePasswordReset: boolean;
  };

  /**
   * Journey-specific access permissions.
   * Determines which journeys the user has access to.
   */
  journeyAccess: {
    health: boolean;
    care: boolean;
    plan: boolean;
  };
}