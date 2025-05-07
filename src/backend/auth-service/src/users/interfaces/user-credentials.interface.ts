import { LoginRequestDto } from '@austa/interfaces/auth';

/**
 * Interface defining user credentials used for authentication operations.
 * This interface is used for login requests and credential validation.
 * It ensures type safety for authentication flows across the auth service.
 */
export interface UserCredentials {
  /**
   * User's email address used as the primary identifier for authentication.
   * Must be a valid email format and match an existing user account.
   */
  email: string;

  /**
   * User's password for authentication.
   * Should be provided in plain text for login requests,
   * but will be hashed before storage or comparison.
   */
  password: string;

  /**
   * Optional remember me flag to extend token expiration.
   * When true, refresh tokens will have a longer lifespan.
   */
  rememberMe?: boolean;
}

/**
 * Type guard to check if an object conforms to the UserCredentials interface.
 * Useful for runtime validation of credential objects.
 * 
 * @param obj - The object to check
 * @returns True if the object is a valid UserCredentials object
 */
export function isUserCredentials(obj: any): obj is UserCredentials {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.email === 'string' &&
    typeof obj.password === 'string' &&
    (obj.rememberMe === undefined || typeof obj.rememberMe === 'boolean')
  );
}

/**
 * Converts a LoginRequestDto from @austa/interfaces to UserCredentials.
 * Ensures compatibility between shared interfaces and internal service interfaces.
 * 
 * @param loginDto - The login request DTO from shared interfaces
 * @returns UserCredentials object for internal service use
 */
export function toUserCredentials(loginDto: LoginRequestDto): UserCredentials {
  return {
    email: loginDto.email,
    password: loginDto.password,
    rememberMe: loginDto.rememberMe
  };
}