/**
 * @file User interfaces for authentication and user management
 * @description Defines TypeScript interfaces for User entities and related data transfer objects (DTOs)
 * used across the AUSTA SuperApp backend. Standardizes the shape of user data for authentication,
 * user management, and profile operations.
 *
 * These interfaces ensure consistent user representation across all services that consume user data,
 * and are compatible with Prisma schema definitions.
 */

/**
 * Represents a user entity in the system.
 * Stores core user information required for authentication and profile management.
 */
export interface IUser {
  /**
   * Unique identifier for the user.
   */
  id: string;

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
   * Hashed password of the user.
   * Never stored in plain text.
   */
  password: string;

  /**
   * Timestamp of when the user was created.
   */
  createdAt: Date;

  /**
   * Timestamp of when the user was last updated.
   */
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new user.
 * Contains all required fields to register a user in the AUSTA SuperApp.
 */
export interface ICreateUserDto {
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
   * Password for the user account.
   * Should meet minimum security requirements.
   */
  password: string;
}

/**
 * Data transfer object for updating user information.
 * Used for partial updates of user profile data in the AUSTA SuperApp.
 * All fields are optional as this DTO is used for PATCH operations.
 */
export interface IUpdateUserDto {
  /**
   * The updated name of the user.
   */
  name?: string;

  /**
   * The updated email address of the user.
   */
  email?: string;

  /**
   * The updated phone number of the user.
   */
  phone?: string;

  /**
   * The updated CPF (Brazilian national ID) of the user.
   * Must be exactly 11 characters.
   */
  cpf?: string;

  /**
   * The updated password for the user account.
   * Should meet minimum security requirements.
   */
  password?: string;
}

/**
 * Data transfer object for user responses.
 * Contains user information that is safe to return to clients.
 * Excludes sensitive information like passwords.
 */
export interface IUserResponseDto {
  /**
   * Unique identifier for the user.
   */
  id: string;

  /**
   * Full name of the user.
   */
  name: string;

  /**
   * Email address of the user.
   */
  email: string;

  /**
   * Phone number of the user (if provided).
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (if provided).
   */
  cpf?: string;

  /**
   * Timestamp of when the user was created.
   */
  createdAt: Date;

  /**
   * Timestamp of when the user was last updated.
   */
  updatedAt: Date;
}

/**
 * Data transfer object for user login requests.
 * Contains credentials required for authentication.
 */
export interface ILoginDto {
  /**
   * Email address of the user.
   * Used as the primary identifier for authentication.
   */
  email: string;

  /**
   * Password for the user account.
   */
  password: string;

  /**
   * Optional remember me flag for extended session duration.
   */
  rememberMe?: boolean;
}

/**
 * Data transfer object for authentication token responses.
 * Contains tokens and related information returned after successful authentication.
 */
export interface ITokenResponseDto {
  /**
   * JWT access token for API authorization.
   */
  accessToken: string;

  /**
   * JWT refresh token for obtaining new access tokens.
   */
  refreshToken: string;

  /**
   * Type of token (typically "Bearer").
   */
  tokenType: string;

  /**
   * Expiration time of the access token in seconds.
   */
  expiresIn: number;

  /**
   * Basic user information included with the token response.
   */
  user: IUserResponseDto;
}

/**
 * Extended user profile information that may be used across different journeys.
 * Contains additional user details beyond the basic authentication information.
 */
export interface IUserProfile extends IUserResponseDto {
  /**
   * User's preferred language for the application.
   */
  preferredLanguage?: string;
  
  /**
   * User's date of birth, important for health-related features.
   */
  dateOfBirth?: Date;
  
  /**
   * User's gender, important for health-related features.
   */
  gender?: string;
  
  /**
   * User's address information.
   */
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  /**
   * User's emergency contact information.
   */
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  /**
   * User's notification preferences.
   */
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
}