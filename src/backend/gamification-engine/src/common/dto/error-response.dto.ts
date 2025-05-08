import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Enum representing the severity level of an error
 * Used for categorizing errors by their impact and urgency
 */
export enum ErrorSeverity {
  /** Critical errors that require immediate attention */
  CRITICAL = 'critical',
  /** Serious errors that affect functionality but don't require immediate action */
  ERROR = 'error',
  /** Less severe issues that should be addressed but don't break functionality */
  WARNING = 'warning',
  /** Informational issues that don't affect functionality */
  INFO = 'info',
}

/**
 * Enum representing the source of an error
 * Used for categorizing errors by their origin within the system
 */
export enum ErrorSource {
  /** Errors originating from client input */
  CLIENT = 'client',
  /** Errors originating from internal system issues */
  SYSTEM = 'system',
  /** Errors originating from external dependencies */
  EXTERNAL = 'external',
  /** Errors that are temporary and may resolve with retry */
  TRANSIENT = 'transient',
}

/**
 * Standardized error response DTO used throughout the gamification engine
 * Provides a consistent structure for error reporting to clients
 */
export class ErrorResponseDto {
  /**
   * Unique error code that identifies the specific error
   * Format: DOMAIN_ERROR_TYPE (e.g., GAMIFICATION_ACHIEVEMENT_NOT_FOUND)
   */
  @ApiProperty({
    description: 'Unique error code identifying the specific error',
    example: 'GAMIFICATION_ACHIEVEMENT_NOT_FOUND',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * Human-readable error message suitable for display to end users
   */
  @ApiProperty({
    description: 'Human-readable error message',
    example: 'The requested achievement could not be found',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Severity level of the error
   */
  @ApiProperty({
    description: 'Severity level of the error',
    enum: ErrorSeverity,
    example: ErrorSeverity.ERROR,
  })
  @IsEnum(ErrorSeverity)
  severity: ErrorSeverity;

  /**
   * Source category of the error
   */
  @ApiProperty({
    description: 'Source category of the error',
    enum: ErrorSource,
    example: ErrorSource.CLIENT,
  })
  @IsEnum(ErrorSource)
  source: ErrorSource;

  /**
   * Timestamp when the error occurred
   */
  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2023-04-15T14:32:21.432Z',
  })
  @IsString()
  timestamp: string;

  /**
   * Additional details about the error
   * May include field-specific validation errors, context information, etc.
   */
  @ApiPropertyOptional({
    description: 'Additional details about the error',
    example: { field: 'achievementId', constraint: 'invalid format' },
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  /**
   * Journey context information related to the error
   * Helps identify which journey and feature was affected
   */
  @ApiPropertyOptional({
    description: 'Journey context information',
    example: { journey: 'gamification', feature: 'achievements' },
  })
  @IsObject()
  @IsOptional()
  journeyContext?: {
    journey: string;
    feature?: string;
    action?: string;
  };

  /**
   * Stack trace for debugging (only included in development environments)
   */
  @ApiPropertyOptional({
    description: 'Stack trace (only included in development environments)',
    example: 'Error: Achievement not found\n    at AchievementService.findById (/app/src/achievements/achievement.service.ts:42:11)',
  })
  @IsString()
  @IsOptional()
  stack?: string;

  /**
   * Creates an instance of ErrorResponseDto from an error object
   * @param error The error object to convert
   * @param options Additional options for customizing the response
   * @returns A new ErrorResponseDto instance
   */
  static fromError(
    error: any,
    options?: {
      includeStack?: boolean;
      journeyContext?: { journey: string; feature?: string; action?: string };
    },
  ): ErrorResponseDto {
    const response = new ErrorResponseDto();
    
    // Set basic properties
    response.code = error.code || 'GAMIFICATION_INTERNAL_ERROR';
    response.message = error.message || 'An unexpected error occurred';
    response.timestamp = new Date().toISOString();
    
    // Set severity and source based on error type or defaults
    response.severity = error.severity || ErrorSeverity.ERROR;
    response.source = error.source || ErrorSource.SYSTEM;
    
    // Include details if available
    if (error.details) {
      response.details = error.details;
    }
    
    // Include journey context if provided
    if (options?.journeyContext) {
      response.journeyContext = options.journeyContext;
    } else if (error.journeyContext) {
      response.journeyContext = error.journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    // Include stack trace only in development and if explicitly requested
    if (options?.includeStack && process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }
    
    return response;
  }
}

/**
 * DTO for validation errors with field-specific details
 * Extends the standard error response with validation-specific information
 */
export class ValidationErrorResponseDto extends ErrorResponseDto {
  /**
   * Validation errors by field
   */
  @ApiProperty({
    description: 'Validation errors by field',
    example: {
      username: ['must be at least 3 characters', 'must not contain special characters'],
      email: ['must be a valid email address'],
    },
  })
  @IsObject()
  validationErrors: Record<string, string[]>;

  /**
   * Creates a ValidationErrorResponseDto from validation errors
   * @param validationErrors The validation errors by field
   * @param options Additional options for customizing the response
   * @returns A new ValidationErrorResponseDto instance
   */
  static fromValidationErrors(
    validationErrors: Record<string, string[]>,
    options?: {
      code?: string;
      message?: string;
      includeStack?: boolean;
      journeyContext?: { journey: string; feature?: string; action?: string };
    },
  ): ValidationErrorResponseDto {
    const response = new ValidationErrorResponseDto();
    
    // Set basic properties
    response.code = options?.code || 'GAMIFICATION_VALIDATION_ERROR';
    response.message = options?.message || 'Validation failed';
    response.timestamp = new Date().toISOString();
    response.severity = ErrorSeverity.WARNING;
    response.source = ErrorSource.CLIENT;
    response.validationErrors = validationErrors;
    
    // Include journey context if provided
    if (options?.journeyContext) {
      response.journeyContext = options.journeyContext;
    } else {
      // Default journey context for gamification engine
      response.journeyContext = { journey: 'gamification' };
    }
    
    // Include stack trace only in development and if explicitly requested
    if (options?.includeStack && process.env.NODE_ENV !== 'production') {
      response.stack = new Error().stack;
    }
    
    return response;
  }
}