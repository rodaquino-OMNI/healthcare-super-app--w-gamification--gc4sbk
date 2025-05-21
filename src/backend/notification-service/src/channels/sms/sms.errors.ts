import { Injectable } from '@nestjs/common';

/**
 * Error classification for SMS errors
 * Used to determine whether an error is transient (can be retried) or permanent (should not be retried)
 */
export enum SmsErrorType {
  /** Transient errors that can be retried */
  TRANSIENT = 'transient',
  /** Permanent errors that should not be retried */
  PERMANENT = 'permanent',
}

/**
 * Base SMS error class that all SMS-specific errors extend from
 */
export class SmsError extends Error {
  /** Error code for the SMS error */
  code: string;
  /** Error type classification (transient or permanent) */
  type: SmsErrorType;
  /** Original error that caused this SMS error */
  originalError?: Error;
  /** HTTP status code associated with the error */
  statusCode?: number;
  /** User-friendly message for client responses */
  clientMessage: string;

  /**
   * Creates a new SMS error
   * 
   * @param message - Technical error message for logging
   * @param code - Error code for the SMS error
   * @param type - Error type classification (transient or permanent)
   * @param clientMessage - User-friendly message for client responses
   * @param originalError - Original error that caused this SMS error
   * @param statusCode - HTTP status code associated with the error
   */
  constructor(
    message: string,
    code: string,
    type: SmsErrorType,
    clientMessage: string,
    originalError?: Error,
    statusCode?: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.type = type;
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.clientMessage = clientMessage;
    
    // Ensures proper stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Determines if the error is transient and can be retried
   * @returns True if the error is transient, false otherwise
   */
  isTransient(): boolean {
    return this.type === SmsErrorType.TRANSIENT;
  }

  /**
   * Determines if the error is permanent and should not be retried
   * @returns True if the error is permanent, false otherwise
   */
  isPermanent(): boolean {
    return this.type === SmsErrorType.PERMANENT;
  }

  /**
   * Creates a standardized error response for client-facing APIs
   * @returns Object with error details formatted for client consumption
   */
  toClientResponse(): Record<string, any> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.clientMessage,
      },
    };
  }
}

/**
 * Error thrown when there's a network or connectivity issue with the SMS provider
 */
export class SmsNetworkError extends SmsError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'SMS_NETWORK_ERROR',
      SmsErrorType.TRANSIENT,
      'Unable to send SMS due to a temporary network issue. Please try again later.',
      originalError,
      503, // Service Unavailable
    );
  }
}

/**
 * Error thrown when the SMS provider rate limits the request
 */
export class SmsRateLimitError extends SmsError {
  /** Time in milliseconds to wait before retrying */
  retryAfter?: number;

  constructor(message: string, retryAfter?: number, originalError?: Error) {
    super(
      message,
      'SMS_RATE_LIMIT_EXCEEDED',
      SmsErrorType.TRANSIENT,
      'SMS sending rate limit exceeded. Please try again later.',
      originalError,
      429, // Too Many Requests
    );
    this.retryAfter = retryAfter;
  }

  /**
   * Gets the recommended retry time in milliseconds
   * @returns Time in milliseconds to wait before retrying, or 60000 (1 minute) if not specified
   */
  getRetryAfterMs(): number {
    return this.retryAfter || 60000; // Default to 1 minute if not specified
  }
}

/**
 * Error thrown when the SMS provider rejects the message due to an invalid phone number
 */
export class SmsInvalidNumberError extends SmsError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'SMS_INVALID_NUMBER',
      SmsErrorType.PERMANENT,
      'The phone number provided is invalid or not in service.',
      originalError,
      400, // Bad Request
    );
  }
}

/**
 * Error thrown when the SMS provider rejects the message due to a blocked phone number
 */
export class SmsBlockedNumberError extends SmsError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'SMS_BLOCKED_NUMBER',
      SmsErrorType.PERMANENT,
      'This phone number has opted out of receiving SMS messages from this service.',
      originalError,
      403, // Forbidden
    );
  }
}

/**
 * Error thrown when the SMS provider rejects the message due to account or authentication issues
 */
export class SmsAccountError extends SmsError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'SMS_ACCOUNT_ERROR',
      SmsErrorType.PERMANENT,
      'Unable to send SMS due to an account configuration issue.',
      originalError,
      401, // Unauthorized
    );
  }
}

/**
 * Error thrown when the SMS provider rejects the message due to content filtering
 */
export class SmsContentFilterError extends SmsError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'SMS_CONTENT_FILTERED',
      SmsErrorType.PERMANENT,
      'The SMS message was rejected due to content filtering rules.',
      originalError,
      400, // Bad Request
    );
  }
}

/**
 * Error thrown when the SMS provider returns an unknown or unexpected error
 */
export class SmsUnknownError extends SmsError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'SMS_UNKNOWN_ERROR',
      SmsErrorType.TRANSIENT, // Default to transient to allow retries for unknown errors
      'An unexpected error occurred while sending the SMS. Please try again later.',
      originalError,
      500, // Internal Server Error
    );
  }
}

/**
 * Service that maps Twilio error codes to application-specific SMS errors
 */
@Injectable()
export class SmsErrorMapper {
  /**
   * Maps a Twilio error to an application-specific SMS error
   * 
   * @param error - The original Twilio error
   * @returns An application-specific SMS error
   */
  mapTwilioError(error: Error & { code?: string | number; status?: number }): SmsError {
    // Extract error code from Twilio error
    const errorCode = error.code ? String(error.code) : '';
    const statusCode = error.status;
    const errorMessage = error.message;

    // Network and connectivity errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      return new SmsNetworkError(errorMessage, error);
    }

    // Rate limiting errors
    if (
      errorCode === '429' ||
      statusCode === 429 ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('rate limit') ||
      errorCode === '20429' // Twilio rate limit error
    ) {
      // Extract retry-after header if available
      const retryAfter = typeof error['retryAfter'] === 'number' 
        ? error['retryAfter'] * 1000 // Convert seconds to milliseconds
        : undefined;
      
      return new SmsRateLimitError(errorMessage, retryAfter, error);
    }

    // Map specific Twilio error codes to application errors
    switch (errorCode) {
      // Invalid number errors
      case '21211': // Invalid 'To' phone number
      case '21214': // 'To' phone number cannot receive SMS
      case '21219': // 'To' phone number not valid
      case '21401': // Invalid phone number format
      case '21407': // Number incapable of receiving SMS
      case '21408': // Non-mobile number
      case '21614': // 'To' number is not a valid mobile number
        return new SmsInvalidNumberError(errorMessage, error);

      // Blocked number errors
      case '21610': // Message blocked
      case '21612': // Recipient has opted out
      case '21611': // Message contains unsubscribe keyword
      case '21606': // Message blocked to unsubscribed recipient
      case '21608': // Blacklisted recipient
        return new SmsBlockedNumberError(errorMessage, error);

      // Account errors
      case '20003': // Authentication error
      case '20404': // Resource not found
      case '20429': // Too many requests
      case '30001': // Queue overflow
      case '30002': // Account suspended
      case '30003': // Unreachable destination handset
      case '30004': // Message blocked
      case '30005': // Unknown destination handset
      case '30006': // Landline or unreachable carrier
      case '30007': // Carrier violation
      case '30009': // Missing segment
      case '30010': // Message price exceeds max price
        return new SmsAccountError(errorMessage, error);

      // Content filtering errors
      case '30021': // Gateway error - content filtering
      case '30022': // Gateway error - message blocked
      case '30023': // Gateway error - blocked by carrier
        return new SmsContentFilterError(errorMessage, error);

      // Transient errors that should be retried
      case '30008': // Unknown error
      case '30026': // Destination queue full
      case '30034': // Message delivery - network error
      case '30035': // Message delivery - carrier error
      case '30036': // Message delivery - unknown error
      case '30046': // Message delivery - unroutable
      case '30047': // Message delivery - carrier unreachable
      case '30048': // Message delivery - carrier circuit congestion
      case '30049': // Message delivery - carrier system error
        return new SmsNetworkError(errorMessage, error);

      // Default to unknown error for any other error codes
      default:
        return new SmsUnknownError(errorMessage, error);
    }
  }

  /**
   * Determines if a Twilio error is transient and can be retried
   * 
   * @param error - The original Twilio error
   * @returns True if the error is transient, false otherwise
   */
  isTransientError(error: Error & { code?: string | number }): boolean {
    const smsError = this.mapTwilioError(error);
    return smsError.isTransient();
  }

  /**
   * Gets the recommended retry delay for a Twilio error
   * 
   * @param error - The original Twilio error
   * @returns Recommended retry delay in milliseconds, or undefined if the error is not retryable
   */
  getRetryDelay(error: Error & { code?: string | number }): number | undefined {
    const smsError = this.mapTwilioError(error);
    
    if (!smsError.isTransient()) {
      return undefined; // Don't retry permanent errors
    }
    
    if (smsError instanceof SmsRateLimitError) {
      return smsError.getRetryAfterMs();
    }
    
    // Default retry delays based on error type
    if (smsError instanceof SmsNetworkError) {
      return 5000; // 5 seconds for network errors
    }
    
    return 30000; // 30 seconds default for other transient errors
  }
}