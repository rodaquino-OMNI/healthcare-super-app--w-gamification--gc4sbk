/**
 * Data Transfer Object for user creation
 * 
 * @module dto
 */

import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO for creating a new user
 * 
 * This class defines the structure and validation rules for user registration data.
 * It uses class-validator decorators to enforce validation rules.
 */
export class CreateUserDto {
  /**
   * User's email address
   * Must be a valid email format
   */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * User's full name
   * Must be a string with at least 2 characters
   */
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  /**
   * User's password
   * Must be at least 8 characters long and include at least one uppercase letter,
   * one lowercase letter, one number, and one special character
   */
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    { message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  /**
   * User's phone number (optional)
   * If provided, must be a string
   */
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  /**
   * User's CPF (Brazilian tax ID) (optional)
   * If provided, must be a string
   */
  @IsOptional()
  @IsString({ message: 'CPF must be a string' })
  cpf?: string;
}