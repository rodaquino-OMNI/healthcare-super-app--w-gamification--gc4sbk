import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

/**
 * Data transfer object for user login authentication.
 * Validates login requests to ensure proper data format before authentication attempts.
 * Used by authentication endpoints across all services implementing login functionality.
 */
export class LoginDto {
  /**
   * Email address of the user attempting to log in.
   * Must be a valid email format.
   */
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email: string;

  /**
   * Password of the user attempting to log in.
   * Must be at least 8 characters long for security.
   */
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password cannot exceed 255 characters' })
  password: string;
}