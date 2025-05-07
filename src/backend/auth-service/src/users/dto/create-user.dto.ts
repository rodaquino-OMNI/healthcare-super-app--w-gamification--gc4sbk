import { 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  Matches, 
  IsNotEmpty
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ICreateUserDto } from '@austa/interfaces/auth';

/**
 * Data transfer object for creating a new user in the AUSTA SuperApp.
 * Contains all necessary information required for user registration.
 * Implements the ICreateUserDto interface from @austa/interfaces for cross-service consistency.
 */
export class CreateUserDto implements ICreateUserDto {
  /**
   * Full name of the user.
   * Must not be empty and have a maximum length of 255 characters.
   */
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  /**
   * Email address of the user.
   * Must be a valid email format and unique in the system.
   */
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  /**
   * Password of the user.
   * Must be at least 8 characters long and include at least one uppercase letter,
   * one lowercase letter, one number, and one special character for security.
   */
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password must not exceed 255 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  /**
   * Phone number of the user (optional).
   * Used for SMS notifications and multi-factor authentication.
   * Must be in a valid international format if provided.
   */
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  @Matches(
    /^\+?[1-9]\d{1,14}$/,
    { message: 'Phone number must be in a valid international format (e.g., +5511999999999)' }
  )
  @Transform(({ value }) => value?.trim())
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional).
   * Used for identity verification as required by Brazilian regulations.
   * Must be a valid CPF format if provided (11 digits).
   */
  @IsString({ message: 'CPF must be a string' })
  @IsOptional()
  @MaxLength(11, { message: 'CPF must not exceed 11 characters' })
  @Matches(
    /^\d{11}$/,
    { message: 'CPF must contain exactly 11 digits without separators' }
  )
  @Transform(({ value }) => value?.replace(/[^0-9]/g, ''))
  cpf?: string;
}