import { IUserSettings } from '@austa/interfaces/auth';

/**
 * Represents user settings and preferences specific to the auth-service.
 * Extends the base user settings interface from @austa/interfaces.
 */
export interface UserSettings extends IUserSettings {
  /**
   * Determines whether the user receives email notifications for security events
   * such as password changes, login attempts, etc.
   */
  securityNotificationsEnabled: boolean;

  /**
   * Determines whether the user receives email notifications for account updates
   * such as profile changes, role assignments, etc.
   */
  accountNotificationsEnabled: boolean;

  /**
   * Preferred method for two-factor authentication.
   * Options include: 'email', 'sms', 'authenticator_app', 'none'
   */
  preferredTwoFactorMethod: 'email' | 'sms' | 'authenticator_app' | 'none';

  /**
   * Determines whether two-factor authentication is enabled for the user.
   */
  twoFactorEnabled: boolean;

  /**
   * Maximum number of failed login attempts before account lockout.
   * Default is 5 attempts.
   */
  maxFailedLoginAttempts: number;

  /**
   * Duration in minutes for which the account remains locked after
   * exceeding maximum failed login attempts.
   * Default is 30 minutes.
   */
  accountLockoutDuration: number;

  /**
   * Determines whether the user's session should be remembered across browser sessions.
   */
  rememberSession: boolean;

  /**
   * Session timeout in minutes. After this period of inactivity,
   * the user will be automatically logged out.
   * Default is 60 minutes (1 hour).
   */
  sessionTimeout: number;

  /**
   * Determines whether the user should be notified before their session expires.
   */
  sessionTimeoutWarningEnabled: boolean;

  /**
   * Time in minutes before session expiration when the warning should be shown.
   * Default is 5 minutes.
   */
  sessionTimeoutWarningTime: number;

  /**
   * List of trusted devices that have been used to log in to the account.
   * Each device contains a unique identifier and a friendly name.
   */
  trustedDevices: Array<{
    id: string;
    name: string;
    lastUsed: Date;
    ipAddress: string;
    userAgent: string;
  }>;

  /**
   * Determines whether login from new devices requires additional verification.
   */
  newDeviceVerificationEnabled: boolean;

  /**
   * Language preference for authentication-related communications.
   * Default is 'pt-BR' (Brazilian Portuguese).
   */
  languagePreference: 'pt-BR' | 'en-US';

  /**
   * Determines whether the user's activity should be logged for security auditing.
   */
  activityLoggingEnabled: boolean;

  /**
   * Determines whether the user should be notified of suspicious login attempts.
   */
  suspiciousLoginNotificationsEnabled: boolean;

  /**
   * Date when the user's password was last changed.
   */
  passwordLastChangedAt: Date;

  /**
   * Number of days after which the user will be prompted to change their password.
   * Default is 90 days.
   */
  passwordExpirationDays: number;

  /**
   * Determines whether the user should be prompted to change their password periodically.
   */
  passwordExpirationEnabled: boolean;

  /**
   * Determines whether the user can use previously used passwords when changing their password.
   */
  preventPasswordReuse: boolean;

  /**
   * Number of previous passwords to check against when changing password.
   * Default is 5 passwords.
   */
  passwordHistoryCount: number;
}