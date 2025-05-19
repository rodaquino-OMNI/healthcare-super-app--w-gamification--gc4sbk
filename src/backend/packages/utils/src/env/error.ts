/**
 * Environment configuration error classes and utilities.
 * 
 * This module provides specialized error classes and utilities for handling
 * environment variable configuration issues across all services.
 */

/**
 * Base error class for all environment variable related errors.
 * Provides context about the environment variable that caused the error.
 */
export class EnvironmentVariableError extends Error {
  /**
   * The name of the environment variable that caused the error
   */
  public readonly variableName: string;

  /**
   * Creates a new EnvironmentVariableError
   * 
   * @param variableName - The name of the environment variable that caused the error
   * @param message - The error message
   */
  constructor(variableName: string, message: string) {
    super(formatErrorMessage(variableName, message));
    this.name = this.constructor.name;
    this.variableName = variableName;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when a required environment variable is missing.
 */
export class MissingEnvironmentVariableError extends EnvironmentVariableError {
  /**
   * Creates a new MissingEnvironmentVariableError
   * 
   * @param variableName - The name of the missing environment variable
   * @param additionalContext - Optional additional context about why this variable is required
   */
  constructor(variableName: string, additionalContext?: string) {
    const message = additionalContext
      ? `Required environment variable is missing. ${additionalContext}`
      : 'Required environment variable is missing.';
    super(variableName, message);
  }
}

/**
 * Error thrown when an environment variable has an invalid value.
 */
export class InvalidEnvironmentVariableError extends EnvironmentVariableError {
  /**
   * The invalid value that was provided
   */
  public readonly providedValue: string | undefined;

  /**
   * Creates a new InvalidEnvironmentVariableError
   * 
   * @param variableName - The name of the environment variable with an invalid value
   * @param providedValue - The invalid value that was provided
   * @param expectedFormat - Description of the expected format or constraints
   */
  constructor(
    variableName: string, 
    providedValue: string | undefined, 
    expectedFormat: string
  ) {
    const valueStr = providedValue === undefined ? 'undefined' : 
                    providedValue === '' ? 'empty string' : 
                    `"${providedValue}"`;
    
    const message = `Invalid value ${valueStr}. Expected ${expectedFormat}.`;
    super(variableName, message);
    this.providedValue = providedValue;
  }
}

/**
 * Error thrown when an environment variable fails validation rules.
 */
export class ValidationEnvironmentVariableError extends EnvironmentVariableError {
  /**
   * The validation errors that occurred
   */
  public readonly validationErrors: string[];

  /**
   * Creates a new ValidationEnvironmentVariableError
   * 
   * @param variableName - The name of the environment variable that failed validation
   * @param validationErrors - The validation errors that occurred
   */
  constructor(variableName: string, validationErrors: string[]) {
    const message = validationErrors.length === 1
      ? `Validation failed: ${validationErrors[0]}`
      : `Multiple validation errors: ${validationErrors.join(', ')}`;
    
    super(variableName, message);
    this.validationErrors = validationErrors;
  }
}

/**
 * Error thrown when an environment variable cannot be transformed to the required type.
 */
export class TransformEnvironmentVariableError extends EnvironmentVariableError {
  /**
   * The value that could not be transformed
   */
  public readonly providedValue: string | undefined;
  
  /**
   * The target type that was requested
   */
  public readonly targetType: string;

  /**
   * Creates a new TransformEnvironmentVariableError
   * 
   * @param variableName - The name of the environment variable that couldn't be transformed
   * @param providedValue - The value that couldn't be transformed
   * @param targetType - The target type that was requested
   * @param reason - The reason the transformation failed
   */
  constructor(
    variableName: string, 
    providedValue: string | undefined, 
    targetType: string, 
    reason?: string
  ) {
    const valueStr = providedValue === undefined ? 'undefined' : 
                    providedValue === '' ? 'empty string' : 
                    `"${providedValue}"`;
    
    const message = reason
      ? `Could not transform ${valueStr} to ${targetType}: ${reason}`
      : `Could not transform ${valueStr} to ${targetType}`;
    
    super(variableName, message);
    this.providedValue = providedValue;
    this.targetType = targetType;
  }
}

/**
 * Error for aggregating multiple environment variable validation errors.
 * Useful for batch validation of related environment variables.
 */
export class BatchEnvironmentValidationError extends Error {
  /**
   * The individual environment variable errors that occurred
   */
  public readonly errors: EnvironmentVariableError[];

  /**
   * Creates a new BatchEnvironmentValidationError
   * 
   * @param errors - The individual environment variable errors
   * @param contextMessage - Optional context message explaining the validation scope
   */
  constructor(errors: EnvironmentVariableError[], contextMessage?: string) {
    const prefix = contextMessage ? `${contextMessage}: ` : '';
    const message = `${prefix}${errors.length} environment variable validation errors occurred`;
    
    super(message);
    this.name = this.constructor.name;
    this.errors = errors;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a detailed string representation of all the validation errors
   */
  public getDetailedMessage(): string {
    return this.errors.map((error, index) => {
      return `${index + 1}. ${error.message}`;
    }).join('\n');
  }
}

/**
 * Formats an error message with the environment variable name for consistency.
 * 
 * @param variableName - The name of the environment variable
 * @param message - The error message
 * @returns Formatted error message with variable name context
 */
export function formatErrorMessage(variableName: string, message: string): string {
  return `Environment variable ${variableName}: ${message}`;
}

/**
 * Attempts to execute a function that accesses an environment variable,
 * falling back to a default value if an error occurs.
 * 
 * @param fn - The function that may throw an environment variable error
 * @param defaultValue - The default value to return if an error occurs
 * @param errorHandler - Optional handler for the error
 * @returns The result of the function or the default value
 */
export function withEnvErrorFallback<T>(
  fn: () => T, 
  defaultValue: T, 
  errorHandler?: (error: Error) => void
): T {
  try {
    return fn();
  } catch (error) {
    if (errorHandler && error instanceof Error) {
      errorHandler(error);
    }
    return defaultValue;
  }
}

/**
 * Aggregates multiple environment variable errors into a single BatchEnvironmentValidationError.
 * 
 * @param validationFns - Functions that validate environment variables and may throw errors
 * @param contextMessage - Optional context message explaining the validation scope
 * @throws BatchEnvironmentValidationError if any validations fail
 */
export function validateEnvironmentBatch(
  validationFns: (() => void)[], 
  contextMessage?: string
): void {
  const errors: EnvironmentVariableError[] = [];
  
  for (const validateFn of validationFns) {
    try {
      validateFn();
    } catch (error) {
      if (error instanceof EnvironmentVariableError) {
        errors.push(error);
      } else if (error instanceof Error) {
        // Wrap non-environment errors to maintain consistent error handling
        errors.push(new EnvironmentVariableError('UNKNOWN', error.message));
      }
    }
  }
  
  if (errors.length > 0) {
    throw new BatchEnvironmentValidationError(errors, contextMessage);
  }
}

/**
 * Creates a validation function that ensures a required environment variable exists.
 * 
 * @param variableName - The name of the environment variable to check
 * @param additionalContext - Optional additional context about why this variable is required
 * @returns A function that throws MissingEnvironmentVariableError if the variable is missing
 */
export function createRequiredEnvValidator(
  variableName: string, 
  additionalContext?: string
): () => void {
  return () => {
    const value = process.env[variableName];
    if (value === undefined || value === '') {
      throw new MissingEnvironmentVariableError(variableName, additionalContext);
    }
  };
}

/**
 * Categorizes an error related to environment variables.
 * Useful for determining appropriate handling strategies.
 * 
 * @param error - The error to categorize
 * @returns The error category
 */
export enum EnvironmentErrorCategory {
  MISSING = 'MISSING',
  INVALID = 'INVALID',
  VALIDATION = 'VALIDATION',
  TRANSFORM = 'TRANSFORM',
  BATCH = 'BATCH',
  OTHER = 'OTHER'
}

/**
 * Categorizes an error related to environment variables.
 * 
 * @param error - The error to categorize
 * @returns The error category
 */
export function categorizeEnvironmentError(error: Error): EnvironmentErrorCategory {
  if (error instanceof MissingEnvironmentVariableError) {
    return EnvironmentErrorCategory.MISSING;
  } else if (error instanceof InvalidEnvironmentVariableError) {
    return EnvironmentErrorCategory.INVALID;
  } else if (error instanceof ValidationEnvironmentVariableError) {
    return EnvironmentErrorCategory.VALIDATION;
  } else if (error instanceof TransformEnvironmentVariableError) {
    return EnvironmentErrorCategory.TRANSFORM;
  } else if (error instanceof BatchEnvironmentValidationError) {
    return EnvironmentErrorCategory.BATCH;
  } else {
    return EnvironmentErrorCategory.OTHER;
  }
}