import { IsEnum, IsNotEmpty, IsString, IsUUID, Length, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum representing the different types of multi-factor authentication methods
 * supported by the AUSTA SuperApp authentication system.
 */
export enum MfaMethodType {
  /** Time-based One-Time Password authentication */
  TOTP = 'totp',
  /** SMS-based verification code authentication */
  SMS = 'sms',
  /** Email-based verification code authentication */
  EMAIL = 'email',
}

/**
 * Enum representing the different types of tokens that can be verified
 * through the multi-factor authentication process.
 */
export enum MfaTokenType {
  /** Authentication for accessing sensitive user data */
  ACCESS = 'access',
  /** Authentication for performing high-risk operations */
  OPERATION = 'operation',
  /** Authentication for journey-specific sensitive actions */
  JOURNEY = 'journey',
}

/**
 * Data Transfer Object (DTO) for multi-factor authentication verification requests.
 * 
 * This DTO validates incoming MFA verification requests to ensure they contain
 * all required fields with proper formatting. It supports multiple verification
 * methods (TOTP, SMS, email) and different token types for various security contexts.
 */
export class MfaVerifyDto {
  @ApiProperty({
    description: 'The verification code provided by the user',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Verification code is required' })
  @IsString({ message: 'Verification code must be a string' })
  @Length(6, 8, { message: 'Verification code must be between 6 and 8 characters' })
  @Matches(/^[0-9]+$/, { message: 'Verification code must contain only digits' })
  verificationCode: string;

  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID(4, { message: 'User ID must be a valid UUID v4' })
  userId: string;

  @ApiProperty({
    description: 'The type of MFA method being used for verification',
    enum: MfaMethodType,
    example: MfaMethodType.TOTP,
  })
  @IsNotEmpty({ message: 'MFA method type is required' })
  @IsEnum(MfaMethodType, { message: 'MFA method must be one of: totp, sms, email' })
  methodType: MfaMethodType;

  @ApiProperty({
    description: 'The type of token being verified',
    enum: MfaTokenType,
    example: MfaTokenType.ACCESS,
  })
  @IsNotEmpty({ message: 'Token type is required' })
  @IsEnum(MfaTokenType, { message: 'Token type must be one of: access, operation, journey' })
  tokenType: MfaTokenType;

  @ApiProperty({
    description: 'Journey identifier for journey-specific MFA verification',
    example: 'health',
    required: false,
  })
  @ValidateIf(o => o.tokenType === MfaTokenType.JOURNEY)
  @IsNotEmpty({ message: 'Journey identifier is required for journey token type' })
  @IsString({ message: 'Journey identifier must be a string' })
  @Matches(/^(health|care|plan)$/, { 
    message: 'Journey identifier must be one of: health, care, plan' 
  })
  journeyId?: string;

  @ApiProperty({
    description: 'Session identifier for operation verification',
    example: 'sess_123456789',
    required: false,
  })
  @ValidateIf(o => o.tokenType === MfaTokenType.OPERATION)
  @IsNotEmpty({ message: 'Session ID is required for operation token type' })
  @IsString({ message: 'Session ID must be a string' })
  @Matches(/^sess_[a-zA-Z0-9]{9,}$/, { 
    message: 'Session ID must start with "sess_" followed by at least 9 alphanumeric characters' 
  })
  sessionId?: string;
}