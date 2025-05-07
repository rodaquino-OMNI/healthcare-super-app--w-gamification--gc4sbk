import { BaseError } from '../../base';
import { ErrorType } from '../../types';
import { HealthErrorCodes, HealthErrorMessages } from './constants';

/**
 * Custom error class for Health journey-specific errors.
 * Extends the BaseError class with Health journey context.
 */
export class HealthError extends BaseError {
  /**
   * Creates a new HealthError instance.
   * 
   * @param code - The error code from HealthErrorCodes
   * @param message - Custom error message (optional, will use default if not provided)
   * @param context - Additional context for the error
   * @param cause - The original error that caused this error (optional)
   */
  constructor(
    code: string,
    message?: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    // Determine the error type based on the error code
    let errorType = ErrorType.TECHNICAL;
    
    if (code.startsWith('HEALTH_9')) {
      errorType = ErrorType.VALIDATION;
    } else if (code.startsWith('HEALTH_0') || code.startsWith('HEALTH_2')) {
      errorType = ErrorType.EXTERNAL;
    } else if (code.startsWith('HEALTH_1') || code.startsWith('HEALTH_3')) {
      errorType = ErrorType.BUSINESS;
    }
    
    // Use the provided message or get the default message for the error code
    const errorMessage = message || HealthErrorMessages[code] || 'An error occurred in the Health journey';
    
    // Add journey information to the context
    const enrichedContext = {
      ...context,
      journey: 'health',
      errorCode: code
    };
    
    super(code, errorMessage, errorType, enrichedContext, cause);
    
    // Set the name for better error identification
    this.name = 'HealthError';
  }
}

/**
 * Creates a new HealthError for connection failures.
 * 
 * @param message - Custom error message
 * @param context - Additional context for the error
 * @param cause - The original error that caused this error
 * @returns A new HealthError instance
 */
export function createConnectionError(
  message?: string,
  context?: Record<string, any>,
  cause?: Error
): HealthError {
  return new HealthError(
    HealthErrorCodes.HEALTH_CONNECTION_FAILED,
    message,
    context,
    cause
  );
}

/**
 * Creates a new HealthError for metrics retrieval failures.
 * 
 * @param message - Custom error message
 * @param context - Additional context for the error
 * @param cause - The original error that caused this error
 * @returns A new HealthError instance
 */
export function createMetricsError(
  message?: string,
  context?: Record<string, any>,
  cause?: Error
): HealthError {
  return new HealthError(
    HealthErrorCodes.HEALTH_METRICS_RETRIEVAL_FAILED,
    message,
    context,
    cause
  );
}

/**
 * Creates a new HealthError for device-related failures.
 * 
 * @param message - Custom error message
 * @param context - Additional context for the error
 * @param cause - The original error that caused this error
 * @returns A new HealthError instance
 */
export function createDeviceError(
  message?: string,
  context?: Record<string, any>,
  cause?: Error
): HealthError {
  return new HealthError(
    HealthErrorCodes.HEALTH_DEVICE_NOT_FOUND,
    message,
    context,
    cause
  );
}