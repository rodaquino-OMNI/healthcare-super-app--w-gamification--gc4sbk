import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Enum representing the type of error that occurred
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',   // Input validation errors
  BUSINESS = 'BUSINESS',       // Business rule violations
  TECHNICAL = 'TECHNICAL',     // System/technical errors
  EXTERNAL = 'EXTERNAL',       // External system failures
  SECURITY = 'SECURITY',       // Security-related errors
  TRANSIENT = 'TRANSIENT',     // Temporary errors that may resolve with retry
}

/**
 * Enum representing the severity of the error
 */
export enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues, non-critical
  MEDIUM = 'MEDIUM',     // Important issues that should be addressed
  HIGH = 'HIGH',         // Critical issues requiring immediate attention
  FATAL = 'FATAL',       // Catastrophic failures
}

/**
 * Enum representing the source of the error within the gamification engine
 */
export enum ErrorSource {
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  EVENTS = 'EVENTS',
  PROFILES = 'PROFILES',
  QUESTS = 'QUESTS',
  REWARDS = 'REWARDS',
  RULES = 'RULES',
  LEADERBOARD = 'LEADERBOARD',
  COMMON = 'COMMON',
}

/**
 * Data Transfer Object for standardized error responses throughout the gamification engine.
 * Provides detailed error information including code, message, details, and stack trace (in dev mode).
 */
export class ErrorResponseDto {
  /**
   * Unique error code that identifies the specific error
   * Format: [SOURCE]_[TYPE]_[SPECIFIC_CODE]
   * Example: EVENTS_VALIDATION_001
   */
  @ApiProperty({
    description: 'Unique error code that identifies the specific error',
    example: 'EVENTS_VALIDATION_001',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * Human-readable error message
   */
  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Invalid event type provided',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Type of error that occurred
   */
  @ApiProperty({
    description: 'Type of error that occurred',
    enum: ErrorType,
    example: ErrorType.VALIDATION,
  })
  @IsEnum(ErrorType)
  type: ErrorType;

  /**
   * Severity level of the error
   */
  @ApiProperty({
    description: 'Severity level of the error',
    enum: ErrorSeverity,
    example: ErrorSeverity.MEDIUM,
  })
  @IsEnum(ErrorSeverity)
  severity: ErrorSeverity;

  /**
   * Source module within the gamification engine that generated the error
   */
  @ApiProperty({
    description: 'Source module within the gamification engine that generated the error',
    enum: ErrorSource,
    example: ErrorSource.EVENTS,
  })
  @IsEnum(ErrorSource)
  source: ErrorSource;

  /**
   * Timestamp when the error occurred
   */
  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: new Date().toISOString(),
  })
  timestamp: string;

  /**
   * Correlation ID for tracing the request through the system
   */
  @ApiProperty({
    description: 'Correlation ID for tracing the request through the system',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  correlationId: string;

  /**
   * Additional details about the error (optional)
   * Can include field-specific validation errors, context information, etc.
   */
  @ApiPropertyOptional({
    description: 'Additional details about the error',
    example: { field: 'eventType', constraint: 'must be one of the allowed values' },
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  /**
   * Journey context information (optional)
   * Provides information about which journey (Health, Care, Plan) the error is related to
   */
  @ApiPropertyOptional({
    description: 'Journey context information',
    example: { journeyType: 'HEALTH', journeyId: '123', journeyStep: 'GOAL_TRACKING' },
  })
  @IsObject()
  @IsOptional()
  journeyContext?: {
    journeyType?: 'HEALTH' | 'CARE' | 'PLAN';
    journeyId?: string;
    journeyStep?: string;
    [key: string]: any;
  };

  /**
   * Stack trace (only included in development environment)
   */
  @ApiPropertyOptional({
    description: 'Stack trace (only included in development environment)',
    example: 'Error: Invalid event type\n    at validateEventType (/app/src/events/validators.ts:45:11)\n    at processEvent (/app/src/events/processor.ts:28:22)',
  })
  @IsString()
  @IsOptional()
  stack?: string;

  /**
   * Helper method to create an error response from an Error object
   */
  static fromError(
    error: Error,
    options: {
      code: string;
      type: ErrorType;
      severity: ErrorSeverity;
      source: ErrorSource;
      correlationId: string;
      details?: Record<string, any>;
      journeyContext?: Record<string, any>;
    },
  ): ErrorResponseDto {
    const response = new ErrorResponseDto();
    response.code = options.code;
    response.message = error.message;
    response.type = options.type;
    response.severity = options.severity;
    response.source = options.source;
    response.timestamp = new Date().toISOString();
    response.correlationId = options.correlationId;
    response.details = options.details;
    response.journeyContext = options.journeyContext;
    
    // Only include stack trace in development environment
    if (process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }
    
    return response;
  }

  /**
   * Helper method to create a validation error response
   */
  static validationError(
    message: string,
    options: {
      code: string;
      source: ErrorSource;
      correlationId: string;
      details: Record<string, any>;
      journeyContext?: Record<string, any>;
    },
  ): ErrorResponseDto {
    const response = new ErrorResponseDto();
    response.code = options.code;
    response.message = message;
    response.type = ErrorType.VALIDATION;
    response.severity = ErrorSeverity.MEDIUM;
    response.source = options.source;
    response.timestamp = new Date().toISOString();
    response.correlationId = options.correlationId;
    response.details = options.details;
    response.journeyContext = options.journeyContext;
    return response;
  }

  /**
   * Helper method to create a business error response
   */
  static businessError(
    message: string,
    options: {
      code: string;
      source: ErrorSource;
      correlationId: string;
      severity?: ErrorSeverity;
      details?: Record<string, any>;
      journeyContext?: Record<string, any>;
    },
  ): ErrorResponseDto {
    const response = new ErrorResponseDto();
    response.code = options.code;
    response.message = message;
    response.type = ErrorType.BUSINESS;
    response.severity = options.severity || ErrorSeverity.MEDIUM;
    response.source = options.source;
    response.timestamp = new Date().toISOString();
    response.correlationId = options.correlationId;
    response.details = options.details;
    response.journeyContext = options.journeyContext;
    return response;
  }

  /**
   * Helper method to create a technical error response
   */
  static technicalError(
    error: Error,
    options: {
      code: string;
      source: ErrorSource;
      correlationId: string;
      severity?: ErrorSeverity;
      details?: Record<string, any>;
      journeyContext?: Record<string, any>;
    },
  ): ErrorResponseDto {
    const response = new ErrorResponseDto();
    response.code = options.code;
    response.message = error.message;
    response.type = ErrorType.TECHNICAL;
    response.severity = options.severity || ErrorSeverity.HIGH;
    response.source = options.source;
    response.timestamp = new Date().toISOString();
    response.correlationId = options.correlationId;
    response.details = options.details;
    response.journeyContext = options.journeyContext;
    
    // Only include stack trace in development environment
    if (process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }
    
    return response;
  }

  /**
   * Helper method to create an external error response
   */
  static externalError(
    message: string,
    options: {
      code: string;
      source: ErrorSource;
      correlationId: string;
      severity?: ErrorSeverity;
      details?: Record<string, any>;
      journeyContext?: Record<string, any>;
      originalError?: Error;
    },
  ): ErrorResponseDto {
    const response = new ErrorResponseDto();
    response.code = options.code;
    response.message = message;
    response.type = ErrorType.EXTERNAL;
    response.severity = options.severity || ErrorSeverity.HIGH;
    response.source = options.source;
    response.timestamp = new Date().toISOString();
    response.correlationId = options.correlationId;
    response.details = options.details;
    response.journeyContext = options.journeyContext;
    
    // Only include stack trace in development environment
    if (process.env.NODE_ENV !== 'production' && options.originalError) {
      response.stack = options.originalError.stack;
    }
    
    return response;
  }
}