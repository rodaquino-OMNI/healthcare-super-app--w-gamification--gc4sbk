import { BaseError } from '@austa/errors/base';
import { ErrorType } from '@austa/errors/types';
import { HttpStatus } from '@nestjs/common';

/**
 * @file push.errors.ts
 * @description Defines custom error classes for push notification scenarios.
 * 
 * This file implements a comprehensive error handling system for push notifications
 * using Firebase Cloud Messaging (FCM). It provides:
 * 
 * 1. A hierarchy of error classes for different FCM error scenarios
 * 2. Classification of errors as retryable or non-retryable
 * 3. Mapping of FCM error codes to appropriate error classes
 * 4. Integration with the centralized error handling framework
 * 5. Support for error tracking and observability
 */

/**
 * Base class for all push notification-related errors.
 * Extends the BaseError from the centralized error framework.
 */
export abstract class PushNotificationError extends BaseError {
  constructor(
    message: string,
    errorCode: string,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(message, {
      errorCode,
      errorType: ErrorType.TECHNICAL, // Default to TECHNICAL error type
      httpStatus,
      cause,
      metadata: {
        channel: 'push',
        ...metadata,
      },
    });
  }

  /**
   * Determines if this error should be retried.
   * Override in subclasses to provide specific retry logic.
   */
  public abstract isRetryable(): boolean;
}

/**
 * Base class for errors that should be retried.
 * These are typically transient errors like network issues or temporary service unavailability.
 */
export abstract class RetryableError extends PushNotificationError {
  constructor(
    message: string,
    errorCode: string,
    httpStatus: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(message, errorCode, httpStatus, cause, {
      retryable: true,
      ...metadata,
    });
  }

  public isRetryable(): boolean {
    return true;
  }
}

/**
 * Base class for errors that should not be retried.
 * These are typically permanent errors like invalid configuration or authentication failures.
 */
export abstract class NonRetryableError extends PushNotificationError {
  constructor(
    message: string,
    errorCode: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(message, errorCode, httpStatus, cause, {
      retryable: false,
      ...metadata,
    });
  }

  public isRetryable(): boolean {
    return false;
  }
}

/**
 * Error thrown when Firebase Cloud Messaging (FCM) initialization fails.
 * This is typically due to invalid credentials or configuration issues.
 */
export class FCMInitializationError extends NonRetryableError {
  constructor(message: string = 'Failed to initialize Firebase Cloud Messaging', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_FCM_INIT_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
      cause,
      metadata
    );
  }
}

/**
 * Error thrown when a device token is invalid or has been revoked.
 * This is a non-retryable error as retrying with the same token will continue to fail.
 */
export class InvalidTokenError extends NonRetryableError {
  constructor(token: string, message: string = 'Invalid or revoked device token', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_INVALID_TOKEN',
      HttpStatus.BAD_REQUEST,
      cause,
      {
        tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined',
        ...metadata,
      }
    );
  }
}

/**
 * Error thrown when FCM delivery fails due to a transient issue.
 * These errors are retryable as they may succeed on subsequent attempts.
 */
export class FCMDeliveryError extends RetryableError {
  constructor(message: string = 'Failed to deliver push notification', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_DELIVERY_ERROR',
      HttpStatus.SERVICE_UNAVAILABLE,
      cause,
      metadata
    );
  }
}

/**
 * Error thrown when FCM rate limits are exceeded.
 * This is retryable with appropriate backoff.
 */
export class FCMRateLimitError extends RetryableError {
  constructor(message: string = 'FCM rate limit exceeded', retryAfter?: number, cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_RATE_LIMIT',
      HttpStatus.TOO_MANY_REQUESTS,
      cause,
      {
        retryAfter,
        ...metadata,
      }
    );
  }
}

/**
 * Error thrown when the FCM service is unavailable.
 * This is a retryable error as the service may become available later.
 */
export class FCMServiceUnavailableError extends RetryableError {
  constructor(message: string = 'FCM service is currently unavailable', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_SERVICE_UNAVAILABLE',
      HttpStatus.SERVICE_UNAVAILABLE,
      cause,
      metadata
    );
  }
}

/**
 * Error thrown when the message payload exceeds FCM size limits.
 * This is a non-retryable error as the payload needs to be modified.
 */
export class MessageTooLargeError extends NonRetryableError {
  constructor(message: string = 'Push notification payload exceeds size limit', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_MESSAGE_TOO_LARGE',
      HttpStatus.PAYLOAD_TOO_LARGE,
      cause,
      metadata
    );
  }
}

/**
 * Error thrown when the device is not registered for push notifications.
 * This is a non-retryable error as the device needs to be re-registered.
 */
export class DeviceNotRegisteredError extends NonRetryableError {
  constructor(token: string, message: string = 'Device is not registered for push notifications', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_DEVICE_NOT_REGISTERED',
      HttpStatus.GONE,
      cause,
      {
        tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined',
        ...metadata,
      }
    );
  }
}

/**
 * Error thrown when there's an authentication failure with FCM.
 * This is a non-retryable error as credentials need to be corrected.
 */
export class FCMAuthenticationError extends NonRetryableError {
  constructor(message: string = 'Authentication failed with FCM', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_AUTHENTICATION_ERROR',
      HttpStatus.UNAUTHORIZED,
      cause,
      metadata
    );
  }
}

/**
 * Error thrown when a network error occurs while communicating with FCM.
 * This is a retryable error as network conditions may improve.
 */
export class FCMNetworkError extends RetryableError {
  constructor(message: string = 'Network error while communicating with FCM', cause?: Error, metadata?: Record<string, any>) {
    super(
      message,
      'NOTIFICATION_PUSH_NETWORK_ERROR',
      HttpStatus.SERVICE_UNAVAILABLE,
      cause,
      metadata
    );
  }
}

/**
 * Utility function to check if an error is a PushNotificationError and if it's retryable.
 * 
 * @param error Any error that might be a PushNotificationError
 * @returns boolean indicating if the error is retryable
 */
export function isPushErrorRetryable(error: unknown): boolean {
  if (error instanceof PushNotificationError) {
    return error.isRetryable();
  }
  
  // For non-PushNotificationError types, default to true to allow retry
  // This can be adjusted based on specific requirements
  return true;
}

/**
 * Extracts retry information from a push notification error.
 * This is useful for configuring retry policies based on the error.
 * 
 * @param error Any error that might be a PushNotificationError
 * @returns Object containing retry information or null if not applicable
 */
export function extractRetryInfo(error: unknown): { retryable: boolean; retryAfter?: number } | null {
  if (!(error instanceof PushNotificationError)) {
    return null;
  }
  
  const retryable = error.isRetryable();
  let retryAfter: number | undefined;
  
  // Extract retry-after information if available
  if (error instanceof FCMRateLimitError && error.metadata?.retryAfter) {
    retryAfter = Number(error.metadata.retryAfter);
  }
  
  return { retryable, retryAfter };
}

/**
 * Utility function to determine if an error from FCM should be retried.
 * Maps FCM error codes to appropriate error classes.
 * 
 * @param error The error from FCM
 * @param token The device token that was used
 * @param metadata Additional metadata to include in the error
 * @returns A properly typed PushNotificationError
 */
export function mapFCMErrorToCustomError(error: any, token: string, metadata?: Record<string, any>): PushNotificationError {
  // Extract the error code if it exists
  const errorCode = error?.code || error?.errorInfo?.code;
  const errorMessage = error?.message || 'Unknown FCM error';
  
  // Check for network errors first (they might not have FCM error codes)
  if (error instanceof Error && (
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT')
  )) {
    return new FCMNetworkError(errorMessage, error, metadata);
  }
  
  // Map FCM error codes to our custom error types
  switch (errorCode) {
    // Non-retryable errors
    case 'messaging/invalid-argument':
    case 'messaging/invalid-recipient':
    case 'messaging/invalid-registration-token':
    case 'messaging/registration-token-not-registered':
      return new InvalidTokenError(token, errorMessage, error, metadata);
    
    case 'messaging/message-too-big':
    case 'messaging/payload-size-limit-exceeded':
      return new MessageTooLargeError(errorMessage, error, metadata);
    
    case 'messaging/unregistered':
    case 'messaging/missing-registration':
      return new DeviceNotRegisteredError(token, errorMessage, error, metadata);
    
    case 'messaging/authentication-error':
    case 'messaging/invalid-credential':
    case 'messaging/invalid-api-key':
      return new FCMAuthenticationError(errorMessage, error, metadata);
    
    // Retryable errors
    case 'messaging/server-unavailable':
    case 'messaging/internal-error':
    case 'messaging/unavailable':
      return new FCMServiceUnavailableError(errorMessage, error, metadata);
    
    case 'messaging/quota-exceeded':
    case 'messaging/too-many-messages':
      // Extract retry-after header if available
      const retryAfter = error?.errorInfo?.retryAfter || 
                         (error?.response?.headers && error.response.headers['retry-after']) || 
                         undefined;
      return new FCMRateLimitError(errorMessage, retryAfter, error, metadata);
    
    // Default to a retryable delivery error for unknown error codes
    default:
      return new FCMDeliveryError(errorMessage, error, metadata);
  }
}