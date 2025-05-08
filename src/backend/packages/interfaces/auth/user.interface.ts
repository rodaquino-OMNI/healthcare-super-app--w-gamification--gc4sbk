/**
 * @file Base user interface for the AUSTA SuperApp
 * @module @austa/interfaces/auth/user
 * 
 * This file defines the base user interface that is shared across all services
 * in the AUSTA SuperApp. It provides a standardized structure for user data
 * that can be extended by service-specific user interfaces.
 */

/**
 * Represents the base user data structure shared across all services.
 * Contains only essential user properties that are common to all contexts.
 * 
 * This interface supports the journey-centered architecture by providing
 * a consistent user data structure that can be used across all three user journeys
 * ("Minha Sau00fade", "Cuidar-me Agora", and "Meu Plano & Benefu00edcios").
 */
export interface IBaseUser {
  /**
   * Unique identifier for the user.
   * This property is immutable after creation.
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
   * This property is immutable after creation.
   */
  readonly createdAt: Date;

  /**
   * Timestamp of when the user was last updated.
   */
  updatedAt: Date;

  /**
   * Indicates if the user's email has been verified.
   * Used for security and access control purposes.
   */
  isEmailVerified?: boolean;

  /**
   * Indicates if the user account is currently active.
   * Inactive accounts cannot authenticate or access the system.
   */
  isActive?: boolean;

  /**
   * Last successful login timestamp.
   * Used for security monitoring and session management.
   */
  lastLoginAt?: Date;
  
  /**
   * User's preferred language for the application.
   * Used for localization and content personalization.
   */
  preferredLanguage?: string;
  
  /**
   * User's profile picture URL (optional).
   * Used for UI personalization.
   */
  profilePictureUrl?: string;
  
  /**
   * List of role names assigned to the user.
   * Used for role-based access control.
   */
  roles?: string[];
  
  /**
   * Journey-specific preferences for each user journey.
   * Keyed by journey identifier with journey-specific settings as values.
   */
  journeyPreferences?: Record<string, unknown>;
}