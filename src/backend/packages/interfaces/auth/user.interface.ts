/**
 * @file User interfaces for authentication and user management
 * @description Defines TypeScript interfaces for User entities and related DTOs used across the AUSTA SuperApp backend
 */

/**
 * Base User interface representing a user in the system
 * Used for authentication, user management, and profile operations
 * Compatible with Prisma schema definitions
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * Full name of the user
   */
  name: string;

  /**
   * Email address of the user (must be unique)
   * Used as the primary identifier for authentication
   */
  email: string;

  /**
   * Phone number of the user (optional)
   * Can be used for MFA and notifications
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional)
   * Used for identity verification in Brazilian healthcare context
   */
  cpf?: string;

  /**
   * Hashed password of the user
   * Never stored in plain text
   */
  password: string;

  /**
   * Timestamp of when the user was created
   */
  createdAt: Date;

  /**
   * Timestamp of when the user was last updated
   */
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new user
 * Contains all required fields for user creation
 */
export interface CreateUserDto {
  /**
   * Full name of the user
   * @maxLength 255
   */
  name: string;

  /**
   * Email address of the user (must be unique)
   * Used as the primary identifier for authentication
   * @maxLength 255
   */
  email: string;

  /**
   * Phone number of the user (optional)
   * Can be used for MFA and notifications
   * @maxLength 20
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional)
   * Used for identity verification in Brazilian healthcare context
   * @minLength 11
   * @maxLength 11
   */
  cpf?: string;

  /**
   * Password for the user account
   * Will be hashed before storage
   * @minLength 8
   */
  password: string;
}

/**
 * Data transfer object for updating user information
 * Used for partial updates of user profile data
 * All fields are optional as this DTO is used for PATCH operations
 */
export interface UpdateUserDto {
  /**
   * The updated name of the user
   * @maxLength 255
   */
  name?: string;

  /**
   * The updated email address of the user
   * @maxLength 255
   */
  email?: string;

  /**
   * The updated phone number of the user
   * @maxLength 20
   */
  phone?: string;

  /**
   * The updated CPF (Brazilian national ID) of the user
   * @minLength 11
   * @maxLength 11
   */
  cpf?: string;
}

/**
 * Data transfer object for user responses
 * Contains user data safe to return to clients (excludes password)
 * Used for API responses in authentication and user management endpoints
 */
export interface UserResponseDto {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * Full name of the user
   */
  name: string;

  /**
   * Email address of the user
   */
  email: string;

  /**
   * Phone number of the user (if provided)
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (if provided)
   */
  cpf?: string;

  /**
   * Timestamp of when the user was created
   */
  createdAt: Date;

  /**
   * Timestamp of when the user was last updated
   */
  updatedAt: Date;
}