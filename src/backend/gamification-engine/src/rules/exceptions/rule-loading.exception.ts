import { HttpStatus } from '@nestjs/common';
import { BaseError } from '@austa/errors/base';
import { ErrorType } from '@austa/errors/types';

/**
 * Error types specific to rule loading operations
 */
export enum RuleLoadingErrorType {
  /**
   * Database connection or query error when loading rules
   */
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  /**
   * Schema inconsistency or validation error in rule data
   */
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  
  /**
   * Configuration error when initializing rules
   */
  CONFIG_ERROR = 'CONFIG_ERROR',
  
  /**
   * Timeout when loading rules from database
   */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  /**
   * General initialization failure
   */
  INIT_ERROR = 'INIT_ERROR'
}

/**
 * Interface for rule loading error context
 */
export interface RuleLoadingErrorContext {
  /**
   * Specific type of rule loading error
   */
  ruleLoadingErrorType: RuleLoadingErrorType;
  
  /**
   * Whether this error is transient and can be retried
   */
  isTransient: boolean;
  
  /**
   * Rule ID if applicable
   */
  ruleId?: string;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
}

/**
 * Exception thrown when errors occur during rule loading from database or configuration sources.
 * 
 * This exception handles various rule loading scenarios including:
 * - Database connectivity issues
 * - Schema inconsistencies in rule data
 * - Configuration errors during rule initialization
 * - Timeout errors when loading rules
 * 
 * The exception integrates with the application's retry mechanisms by classifying
 * errors as either transient (can be retried) or permanent (system failures).
 */
export class RuleLoadingException extends BaseError {
  /**
   * The specific type of rule loading error
   */
  public readonly ruleLoadingErrorType: RuleLoadingErrorType;
  
  /**
   * Whether this error is transient and can be retried
   */
  public readonly isTransient: boolean;
  
  /**
   * Rule ID if applicable
   */
  public readonly ruleId?: string;
  
  /**
   * Creates a new RuleLoadingException
   * 
   * @param message Human-readable error message
   * @param ruleLoadingErrorType Specific type of rule loading error
   * @param isTransient Whether this error is transient and can be retried
   * @param ruleId Optional rule ID if applicable
   * @param details Additional error details
   * @param cause Original error that caused this exception
   */
  constructor(
    message: string,
    ruleLoadingErrorType: RuleLoadingErrorType,
    isTransient: boolean = false,
    ruleId?: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    // All rule loading errors are technical errors at the system level
    super(
      message,
      ErrorType.TECHNICAL,
      'GAME_RULE_LOAD_001',
      { ruleLoadingErrorType, isTransient, ruleId, ...details },
      cause
    );
    
    this.ruleLoadingErrorType = ruleLoadingErrorType;
    this.isTransient = isTransient;
    this.ruleId = ruleId;
    
    // Set appropriate HTTP status code based on error type
    this.statusCode = this.determineStatusCode();
  }
  
  /**
   * Determines the appropriate HTTP status code based on the error type
   */
  private determineStatusCode(): number {
    switch (this.ruleLoadingErrorType) {
      case RuleLoadingErrorType.TIMEOUT_ERROR:
        return HttpStatus.GATEWAY_TIMEOUT;
      case RuleLoadingErrorType.CONFIG_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case RuleLoadingErrorType.DATABASE_ERROR:
        return this.isTransient ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;
      case RuleLoadingErrorType.SCHEMA_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case RuleLoadingErrorType.INIT_ERROR:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
  
  /**
   * Creates a database error instance
   * 
   * @param message Error message
   * @param isTransient Whether this is a transient error that can be retried
   * @param ruleId Optional rule ID
   * @param details Additional error details
   * @param cause Original error
   */
  static databaseError(
    message: string,
    isTransient: boolean = true,
    ruleId?: string,
    details?: Record<string, any>,
    cause?: Error
  ): RuleLoadingException {
    return new RuleLoadingException(
      message,
      RuleLoadingErrorType.DATABASE_ERROR,
      isTransient,
      ruleId,
      details,
      cause
    );
  }
  
  /**
   * Creates a schema error instance
   * 
   * @param message Error message
   * @param ruleId Optional rule ID
   * @param details Additional error details
   * @param cause Original error
   */
  static schemaError(
    message: string,
    ruleId?: string,
    details?: Record<string, any>,
    cause?: Error
  ): RuleLoadingException {
    // Schema errors are not transient - they require data fixes
    return new RuleLoadingException(
      message,
      RuleLoadingErrorType.SCHEMA_ERROR,
      false,
      ruleId,
      details,
      cause
    );
  }
  
  /**
   * Creates a configuration error instance
   * 
   * @param message Error message
   * @param details Additional error details
   * @param cause Original error
   */
  static configError(
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ): RuleLoadingException {
    // Configuration errors are not transient - they require config changes
    return new RuleLoadingException(
      message,
      RuleLoadingErrorType.CONFIG_ERROR,
      false,
      undefined,
      details,
      cause
    );
  }
  
  /**
   * Creates a timeout error instance
   * 
   * @param message Error message
   * @param ruleId Optional rule ID
   * @param details Additional error details
   * @param cause Original error
   */
  static timeoutError(
    message: string,
    ruleId?: string,
    details?: Record<string, any>,
    cause?: Error
  ): RuleLoadingException {
    // Timeout errors are transient and can be retried
    return new RuleLoadingException(
      message,
      RuleLoadingErrorType.TIMEOUT_ERROR,
      true,
      ruleId,
      details,
      cause
    );
  }
  
  /**
   * Creates a general initialization error instance
   * 
   * @param message Error message
   * @param isTransient Whether this is a transient error that can be retried
   * @param details Additional error details
   * @param cause Original error
   */
  static initError(
    message: string,
    isTransient: boolean = false,
    details?: Record<string, any>,
    cause?: Error
  ): RuleLoadingException {
    return new RuleLoadingException(
      message,
      RuleLoadingErrorType.INIT_ERROR,
      isTransient,
      undefined,
      details,
      cause
    );
  }
  
  /**
   * Determines if this error should trigger an alert
   * Non-transient errors and repeated transient errors should trigger alerts
   */
  shouldAlert(): boolean {
    // Non-transient errors always trigger alerts
    if (!this.isTransient) {
      return true;
    }
    
    // For transient errors, we could implement logic to only alert
    // after multiple occurrences, but for now we'll alert on all
    // rule loading errors as they're critical to system function
    return true;
  }
  
  /**
   * Returns a serialized version of this error suitable for logging
   */
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      ruleLoadingErrorType: this.ruleLoadingErrorType,
      isTransient: this.isTransient,
      ruleId: this.ruleId,
      shouldAlert: this.shouldAlert()
    };
  }
}