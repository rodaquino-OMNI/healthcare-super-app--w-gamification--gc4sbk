import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { LoginRequestDto } from '@austa/interfaces/auth';

/**
 * Data transfer object for user login requests in the AUSTA SuperApp.
 * Implements validation rules for email and password fields.
 * 
 * This DTO integrates with the shared @austa/interfaces package to ensure
 * consistent validation across all services that handle authentication.
 */
export class LoginDto implements LoginRequestDto {
  /**
   * Email address of the user.
   * Must be a valid email format and is used as the primary identifier for login.
   * 
   * @example 'user@example.com'
   */
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  /**
   * Password of the user.
   * Must meet complexity requirements for security.
   * 
   * Password requirements:
   * - Minimum 8 characters
   * - Maximum 255 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password cannot exceed 255 characters' })
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, 
    { message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character' }
  )
  password: string;
}