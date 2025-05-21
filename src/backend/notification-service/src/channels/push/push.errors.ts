import { BaseError } from '@austa/errors/base';
import { ErrorType } from '@austa/errors/types';
import { FailureClassification } from '../../interfaces/notification-channel.interface';

/**
 * Error codes specific to push notification errors
 */
export enum PushErrorCode {
  // Initialization errors
  FCM_INITIALIZATION_FAILED = 'NOTIFICATION_PUSH_001',
  FCM_NOT_INITIALIZED = 'NOTIFICATION_PUSH_002',
  
  // Token errors
  INVALID_TOKEN = 'NOTIFICATION_PUSH_101',
  TOKEN_NOT_REGISTERED = 'NOTIFICATION_PUSH_102',
  
  // Delivery errors
  FCM_DELIVERY_FAILED = 'NOTIFICATION_PUSH_201',
  MESSAGE_RATE_EXCEEDED = 'NOTIFICATION_PUSH_202',
  PAYLOAD_TOO_LARGE = 'NOTIFICATION_PUSH_203',
  DEVICE_MESSAGE_RATE_EXCEEDED = 'NOTIFICATION_PUSH_204',
  
  // Authentication errors
  FCM_AUTHENTICATION_ERROR = 'NOTIFICATION_PUSH_301',
  FCM_SERVER_UNAVAILABLE = 'NOTIFICATION_PUSH_302',
  
  // Unknown errors
  UNKNOWN_ERROR = 'NOTIFICATION_PUSH_999'
}

/**
 * Base class for all push notification errors
 */
export abstract class PushNotificationError extends BaseError {
  constructor(
    code: PushErrorCode,
    message: string,
    errorType: ErrorType = ErrorType.TECHNICAL,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super({
      code,
      message,
      errorType,
      cause,
      metadata: {
        channel: 'push',
        ...metadata
      }
    });
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  abstract getFailureClassification(): FailureClassification;
}

/**
 * Base class for errors that can be retried
 */
export abstract class RetryableError extends PushNotificationError {
  constructor(
    code: PushErrorCode,
    message: string,
    errorType: ErrorType = ErrorType.TECHNICAL,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(code, message, errorType, cause, {
      retryable: true,
      ...metadata
    });
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.TRANSIENT;
  }
}

/**
 * Base class for errors that should not be retried
 */
export abstract class NonRetryableError extends PushNotificationError {
  constructor(
    code: PushErrorCode,
    message: string,
    errorType: ErrorType = ErrorType.TECHNICAL,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(code, message, errorType, cause, {
      retryable: false,
      ...metadata
    });
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.PERMANENT;
  }
}

/**
 * Error thrown when Firebase Cloud Messaging initialization fails
 */
export class FCMInitializationError extends NonRetryableError {
  constructor(message: string = 'Failed to initialize Firebase Cloud Messaging', cause?: Error) {
    super(
      PushErrorCode.FCM_INITIALIZATION_FAILED,
      message,
      ErrorType.TECHNICAL,
      cause,
      { component: 'FCM' }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.SERVICE_UNAVAILABLE;
  }
}

/**
 * Error thrown when FCM is not initialized
 */
export class FCMNotInitializedError extends NonRetryableError {
  constructor(message: string = 'Firebase Cloud Messaging not initialized', cause?: Error) {
    super(
      PushErrorCode.FCM_NOT_INITIALIZED,
      message,
      ErrorType.TECHNICAL,
      cause,
      { component: 'FCM' }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.SERVICE_UNAVAILABLE;
  }
}

/**
 * Error thrown when a device token is invalid
 */
export class InvalidTokenError extends NonRetryableError {
  constructor(token: string, message: string = 'Invalid device token', cause?: Error) {
    super(
      PushErrorCode.INVALID_TOKEN,
      message,
      ErrorType.VALIDATION,
      cause,
      { 
        tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined',
        component: 'FCM'
      }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.INVALID_REQUEST;
  }
}

/**
 * Error thrown when a device token is not registered
 */
export class TokenNotRegisteredError extends NonRetryableError {
  constructor(token: string, message: string = 'Device token is no longer registered', cause?: Error) {
    super(
      PushErrorCode.TOKEN_NOT_REGISTERED,
      message,
      ErrorType.BUSINESS,
      cause,
      { 
        tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined',
        component: 'FCM'
      }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.PERMANENT;
  }
}

/**
 * Error thrown when FCM delivery fails
 */
export class FCMDeliveryError extends RetryableError {
  constructor(message: string = 'Failed to deliver push notification', cause?: Error, metadata?: Record<string, any>) {
    super(
      PushErrorCode.FCM_DELIVERY_FAILED,
      message,
      ErrorType.TECHNICAL,
      cause,
      { 
        component: 'FCM',
        ...metadata
      }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.TRANSIENT;
  }
}

/**
 * Error thrown when FCM rate limit is exceeded
 */
export class MessageRateExceededError extends RetryableError {
  constructor(message: string = 'Message rate limit exceeded', cause?: Error, retryAfter?: number) {
    super(
      PushErrorCode.MESSAGE_RATE_EXCEEDED,
      message,
      ErrorType.EXTERNAL,
      cause,
      { 
        component: 'FCM',
        retryAfter: retryAfter || 60 // Default to 60 seconds if not specified
      }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.RATE_LIMITED;
  }
}

/**
 * Error thrown when device message rate limit is exceeded
 */
export class DeviceMessageRateExceededError extends RetryableError {
  constructor(token: string, message: string = 'Device message rate limit exceeded', cause?: Error, retryAfter?: number) {
    super(
      PushErrorCode.DEVICE_MESSAGE_RATE_EXCEEDED,
      message,
      ErrorType.EXTERNAL,
      cause,
      { 
        tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined',
        component: 'FCM',
        retryAfter: retryAfter || 60 // Default to 60 seconds if not specified
      }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.RATE_LIMITED;
  }
}

/**
 * Error thrown when payload is too large
 */
export class PayloadTooLargeError extends NonRetryableError {
  constructor(payloadSize: number, maxSize: number, message?: string, cause?: Error) {
    super(
      PushErrorCode.PAYLOAD_TOO_LARGE,
      message || `Payload size (${payloadSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
      ErrorType.VALIDATION,
      cause,
      { 
        component: 'FCM',
        payloadSize,
        maxSize
      }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.INVALID_REQUEST;
  }
}

/**
 * Error thrown when FCM authentication fails
 */
export class FCMAuthenticationError extends RetryableError {
  constructor(message: string = 'FCM authentication failed', cause?: Error) {
    super(
      PushErrorCode.FCM_AUTHENTICATION_ERROR,
      message,
      ErrorType.EXTERNAL,
      cause,
      { component: 'FCM' }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.AUTH_ERROR;
  }
}

/**
 * Error thrown when FCM server is unavailable
 */
export class FCMServerUnavailableError extends RetryableError {
  constructor(message: string = 'FCM server is unavailable', cause?: Error) {
    super(
      PushErrorCode.FCM_SERVER_UNAVAILABLE,
      message,
      ErrorType.EXTERNAL,
      cause,
      { component: 'FCM' }
    );
  }

  /**
   * Gets the failure classification for retry decisions
   * @returns The failure classification
   */
  getFailureClassification(): FailureClassification {
    return FailureClassification.SERVICE_UNAVAILABLE;
  }
}

/**
 * Maps FCM error codes to appropriate error classes
 * @param errorCode The FCM error code
 * @param message The error message
 * @param token The device token (if applicable)
 * @param cause The original error
 * @returns An instance of the appropriate error class
 */
export function mapFCMErrorToCustomError(
  errorCode: string,
  message: string,
  token?: string,
  cause?: Error
): PushNotificationError {
  switch (errorCode) {
    case 'messaging/invalid-argument':
    case 'messaging/invalid-recipient':
      return new InvalidTokenError(token || '', message, cause);
    
    case 'messaging/registration-token-not-registered':
      return new TokenNotRegisteredError(token || '', message, cause);
    
    case 'messaging/message-rate-exceeded':
      return new MessageRateExceededError(message, cause);
    
    case 'messaging/device-message-rate-exceeded':
      return new DeviceMessageRateExceededError(token || '', message, cause);
    
    case 'messaging/payload-size-limit-exceeded':
      return new PayloadTooLargeError(0, 4096, message, cause); // FCM limit is 4KB
    
    case 'messaging/authentication-error':
    case 'messaging/invalid-credential':
      return new FCMAuthenticationError(message, cause);
    
    case 'messaging/server-unavailable':
    case 'messaging/internal-error':
    case 'messaging/unavailable':
      return new FCMServerUnavailableError(message, cause);
    
    default:
      return new FCMDeliveryError(message || 'Unknown FCM error', cause, { errorCode });
  }
}