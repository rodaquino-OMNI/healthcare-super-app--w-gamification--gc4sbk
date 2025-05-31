import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for login requests.
 * 
 * This DTO validates login requests to ensure they contain properly formatted
 * email and password fields. It is used by authentication endpoints to validate
 * incoming login attempts before processing them.
 * 
 * The validation rules enforce:
 * - Valid email format
 * - Password with minimum length and complexity requirements
 * 
 * This standardized DTO ensures consistent validation across all authentication
 * services that implement login functionality.
 */
export class LoginDto {
  /**
   * Email address used for authentication.
   * Must be a valid email format.
   * 
   * @example "user@example.com"
   */
  @ApiProperty({
    description: 'Email address used for authentication',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  /**
   * Password for authentication.
   * Must meet minimum length and complexity requirements.
   * 
   * @example "SecureP@ssw0rd"
   */
  @ApiProperty({
    description: 'Password for authentication',
    example: 'SecureP@ssw0rd',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}