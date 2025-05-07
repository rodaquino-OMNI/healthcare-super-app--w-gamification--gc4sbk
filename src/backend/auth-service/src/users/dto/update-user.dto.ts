import { PartialType } from '@nestjs/mapped-types'; // @nestjs/mapped-types@1.2.2
import { IsString, IsEmail, MinLength, MaxLength, IsOptional, Matches } from 'class-validator'; // class-validator@0.14.0
import { Transform } from 'class-transformer'; // class-transformer@0.5.1
import { CreateUserDto } from './create-user.dto';

/**
 * Data transfer object for updating an existing user in the AUSTA SuperApp.
 * Extends CreateUserDto but makes all fields optional to support partial updates.
 * Maintains validation rules from CreateUserDto while adding additional sanitization.
 * 
 * @remarks
 * This DTO integrates with @austa/interfaces for shared type definitions
 * and ensures consistent validation between create and update operations.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  /**
   * Updated name of the user (optional).
   * Trims whitespace from both ends of the string.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name?: string;

  /**
   * Updated email address of the user (optional).
   * Must be a valid email format and unique in the system.
   * Converts to lowercase for consistency.
   */
  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email?: string;

  /**
   * Updated password of the user (optional).
   * Must be at least 8 characters long and include at least one uppercase letter,
   * one lowercase letter, one number, and one special character for security.
   */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password?: string;

  /**
   * Updated phone number of the user (optional).
   * Used for SMS notifications and multi-factor authentication.
   * Removes non-numeric characters for consistent storage.
   */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove non-numeric characters except for the plus sign at the beginning
      return value.replace(/^\+/, '00').replace(/[^0-9]/g, '');
    }
    return value;
  })
  phone?: string;

  /**
   * Updated CPF (Brazilian national ID) of the user (optional).
   * Used for identity verification as required by Brazilian regulations.
   * Removes non-numeric characters for consistent storage.
   */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove non-numeric characters
      return value.replace(/[^0-9]/g, '');
    }
    return value;
  })
  cpf?: string;
}