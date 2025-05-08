/**
 * @file sms.errors.ts
 * @description Implements SMS-specific error types, error classification, and error codes
 * aligned with the system's error handling strategy. Provides detailed error mapping from
 * Twilio API errors to application-specific error codes with user-friendly messages.
 */

import { ErrorType, JourneyErrorCategory } from '@austa/errors';
import { NOTIFICATION_DELIVERY_FAILED } from '../../../shared/src/constants/error-codes.constants';

/**
 * SMS-specific error codes for more granular error handling
 */
export enum SmsErrorCode {
  // Provider errors
  INVALID_PHONE_NUMBER = 'SMS_001',
  UNROUTABLE_DESTINATION = 'SMS_002',
  MESSAGE_BLOCKED = 'SMS_003',
  ACCOUNT_SUSPENDED = 'SMS_004',
  INSUFFICIENT_FUNDS = 'SMS_005',
  RATE_LIMITED = 'SMS_006',
  INVALID_FROM_NUMBER = 'SMS_007',
  MESSAGE_TOO_LONG = 'SMS_008',
  
  // System errors
  CONFIGURATION_ERROR = 'SMS_101',
  AUTHENTICATION_ERROR = 'SMS_102',
  PROVIDER_UNAVAILABLE = 'SMS_103',
  NETWORK_ERROR = 'SMS_104',
  UNEXPECTED_ERROR = 'SMS_999'
}

/**
 * Maps Twilio error codes to application-specific error codes
 * This mapping helps standardize error handling across the application
 */
export const twilioErrorCodeMap: Record<string, SmsErrorCode> = {
  // Invalid phone number errors
  '21211': SmsErrorCode.INVALID_PHONE_NUMBER, // Invalid 'To' Phone Number
  '21214': SmsErrorCode.INVALID_PHONE_NUMBER, // 'To' phone number cannot be reached
  '21219': SmsErrorCode.INVALID_PHONE_NUMBER, // 'To' phone number not valid
  
  // Unroutable destination errors
  '21612': SmsErrorCode.UNROUTABLE_DESTINATION, // The 'To' phone number is not currently reachable via SMS
  '21408': SmsErrorCode.UNROUTABLE_DESTINATION, // Geographic permission not enabled
  '21614': SmsErrorCode.UNROUTABLE_DESTINATION, // 'To' number is not a valid mobile number
  
  // Message blocked errors
  '21610': SmsErrorCode.MESSAGE_BLOCKED, // Message blocked
  '21611': SmsErrorCode.MESSAGE_BLOCKED, // This number may not be used to send SMS messages to wireless carriers in this area
  
  // Account issues
  '20003': SmsErrorCode.ACCOUNT_SUSPENDED, // Permission to send an SMS has not been enabled for the region
  '20429': SmsErrorCode.RATE_LIMITED, // Too many requests
  '20404': SmsErrorCode.AUTHENTICATION_ERROR, // Authentication Error
  
  // Insufficient funds
  '20006': SmsErrorCode.INSUFFICIENT_FUNDS, // Insufficient funds
  
  // From number issues
  '21606': SmsErrorCode.INVALID_FROM_NUMBER, // The 'From' phone number provided is not a valid, SMS-capable Twilio phone number
  '21602': SmsErrorCode.INVALID_FROM_NUMBER, // The 'From' phone number is not a valid, SMS-capable Twilio phone number
  
  // Message content issues
  '21605': SmsErrorCode.MESSAGE_TOO_LONG, // The message body exceeds the 1600 character limit
  
  // Network errors
  '50001': SmsErrorCode.NETWORK_ERROR, // Twilio internal server error
};

/**
 * Maps SMS error codes to user-friendly error messages
 * These messages can be displayed to users or logged for debugging
 */
export const smsErrorMessages: Record<SmsErrorCode, string> = {
  [SmsErrorCode.INVALID_PHONE_NUMBER]: 'The phone number provided is invalid or cannot receive SMS messages',
  [SmsErrorCode.UNROUTABLE_DESTINATION]: 'The phone number cannot be reached via SMS at this time',
  [SmsErrorCode.MESSAGE_BLOCKED]: 'The message was blocked by the carrier or recipient settings',
  [SmsErrorCode.ACCOUNT_SUSPENDED]: 'The SMS service account is suspended or not enabled for this region',
  [SmsErrorCode.INSUFFICIENT_FUNDS]: 'The SMS service account has insufficient funds to send messages',
  [SmsErrorCode.RATE_LIMITED]: 'Too many messages sent in a short period. Please try again later',
  [SmsErrorCode.INVALID_FROM_NUMBER]: 'The sender phone number is invalid or not capable of sending SMS',
  [SmsErrorCode.MESSAGE_TOO_LONG]: 'The message exceeds the maximum allowed length',
  [SmsErrorCode.CONFIGURATION_ERROR]: 'SMS service is not properly configured',
  [SmsErrorCode.AUTHENTICATION_ERROR]: 'Authentication failed with the SMS provider',
  [SmsErrorCode.PROVIDER_UNAVAILABLE]: 'The SMS service provider is currently unavailable',
  [SmsErrorCode.NETWORK_ERROR]: 'A network error occurred while sending the SMS',
  [SmsErrorCode.UNEXPECTED_ERROR]: 'An unexpected error occurred while sending the SMS'
};

/**
 * Maps SMS error codes to error types for classification
 * This helps determine if an error is transient (should be retried) or permanent
 */
export const smsErrorTypeMap: Record<SmsErrorCode, ErrorType> = {
  // Permanent errors (don't retry)
  [SmsErrorCode.INVALID_PHONE_NUMBER]: ErrorType.PERMANENT,
  [SmsErrorCode.UNROUTABLE_DESTINATION]: ErrorType.PERMANENT,
  [SmsErrorCode.MESSAGE_BLOCKED]: ErrorType.PERMANENT,
  [SmsErrorCode.ACCOUNT_SUSPENDED]: ErrorType.CONFIGURATION,
  [SmsErrorCode.INSUFFICIENT_FUNDS]: ErrorType.CONFIGURATION,
  [SmsErrorCode.INVALID_FROM_NUMBER]: ErrorType.CONFIGURATION,
  [SmsErrorCode.MESSAGE_TOO_LONG]: ErrorType.PERMANENT,
  [SmsErrorCode.CONFIGURATION_ERROR]: ErrorType.CONFIGURATION,
  [SmsErrorCode.AUTHENTICATION_ERROR]: ErrorType.CONFIGURATION,
  
  // Transient errors (can retry)
  [SmsErrorCode.RATE_LIMITED]: ErrorType.RATE_LIMIT,
  [SmsErrorCode.PROVIDER_UNAVAILABLE]: ErrorType.TRANSIENT,
  [SmsErrorCode.NETWORK_ERROR]: ErrorType.TRANSIENT,
  [SmsErrorCode.UNEXPECTED_ERROR]: ErrorType.EXTERNAL
};

/**
 * Interface for SMS error details
 */
export interface ISmsErrorDetails {
  code: SmsErrorCode;
  message: string;
  errorType: ErrorType;
  twilioErrorCode?: string;
  twilioErrorMessage?: string;
  isTransient: boolean;
  shouldRetry: boolean;
  retryAfterMs?: number;
}

/**
 * Classifies an SMS delivery error to determine if it's retryable
 * 
 * @param error - The error to classify
 * @returns The error details with classification information
 */
export function classifySmsError(error: any): ISmsErrorDetails {
  let errorCode = SmsErrorCode.UNEXPECTED_ERROR;
  let twilioErrorCode: string | undefined;
  
  // Extract Twilio error code if available
  if (error.code) {
    twilioErrorCode = error.code;
    errorCode = twilioErrorCodeMap[error.code] || SmsErrorCode.UNEXPECTED_ERROR;
  } else if (error.message) {
    // Try to extract error code from message
    const codeMatch = error.message.match(/\[(\d+)\]/);
    if (codeMatch && codeMatch[1]) {
      twilioErrorCode = codeMatch[1];
      errorCode = twilioErrorCodeMap[codeMatch[1]] || SmsErrorCode.UNEXPECTED_ERROR;
    }
  }
  
  // Network or connection errors are typically transient
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ENETUNREACH' ||
    error.code === 'EHOSTUNREACH' ||
    error.code === 'ESOCKET'
  ) {
    errorCode = SmsErrorCode.NETWORK_ERROR;
  }
  
  // Authentication errors
  if (
    error.code === 'EAUTH' ||
    error.message?.includes('authentication') ||
    error.message?.includes('credentials') ||
    error.message?.includes('unauthorized')
  ) {
    errorCode = SmsErrorCode.AUTHENTICATION_ERROR;
  }
  
  // Rate limiting
  if (
    error.message?.includes('rate limit') ||
    error.message?.includes('too many') ||
    error.code === '429'
  ) {
    errorCode = SmsErrorCode.RATE_LIMITED;
  }
  
  const errorType = smsErrorTypeMap[errorCode] || ErrorType.EXTERNAL;
  const isTransient = errorType === ErrorType.TRANSIENT || errorType === ErrorType.RATE_LIMIT;
  
  // Determine retry delay for rate limiting
  let retryAfterMs: number | undefined;
  if (errorCode === SmsErrorCode.RATE_LIMITED) {
    // Check for Retry-After header or use default
    const retryAfter = error.retryAfter || error.headers?.['retry-after'];
    if (retryAfter) {
      retryAfterMs = parseInt(retryAfter, 10) * 1000; // Convert to milliseconds
    } else {
      retryAfterMs = 60000; // Default to 1 minute
    }
  }
  
  return {
    code: errorCode,
    message: smsErrorMessages[errorCode],
    errorType,
    twilioErrorCode,
    twilioErrorMessage: error.message,
    isTransient,
    shouldRetry: isTransient,
    retryAfterMs
  };
}

/**
 * Creates a standardized error object for SMS delivery failures
 * 
 * @param error - The original error
 * @param phoneNumber - The recipient's phone number
 * @returns A standardized error object with classification
 */
export function createSmsError(error: any, phoneNumber?: string): Error & { errorDetails: ISmsErrorDetails } {
  const errorDetails = classifySmsError(error);
  
  // Create a new error with standardized format
  const standardError = new Error(
    `${NOTIFICATION_DELIVERY_FAILED}: ${errorDetails.message}${phoneNumber ? ` (to: ${phoneNumber})` : ''}`
  ) as Error & { errorDetails: ISmsErrorDetails };
  
  // Add error details for better handling
  standardError.errorDetails = errorDetails;
  
  // Add original error properties
  standardError.stack = error.stack;
  standardError.name = 'SmsDeliveryError';
  
  return standardError;
}

/**
 * Determines if an SMS error should be retried based on its classification
 * 
 * @param error - The error to check
 * @returns True if the error is transient and should be retried
 */
export function shouldRetrySmsError(error: any): boolean {
  if (!error) return false;
  
  // If error already has errorDetails from createSmsError
  if (error.errorDetails?.shouldRetry !== undefined) {
    return error.errorDetails.shouldRetry;
  }
  
  // Otherwise classify the error
  const errorDetails = classifySmsError(error);
  return errorDetails.shouldRetry;
}

/**
 * Gets the recommended retry delay for an SMS error
 * 
 * @param error - The error to check
 * @param defaultDelayMs - Default delay in milliseconds if not specified by the error
 * @returns The recommended delay before retrying in milliseconds
 */
export function getSmsErrorRetryDelay(error: any, defaultDelayMs = 5000): number {
  if (!error) return defaultDelayMs;
  
  // If error already has errorDetails from createSmsError
  if (error.errorDetails?.retryAfterMs) {
    return error.errorDetails.retryAfterMs;
  }
  
  // Otherwise classify the error
  const errorDetails = classifySmsError(error);
  return errorDetails.retryAfterMs || defaultDelayMs;
}

/**
 * Gets a user-friendly error message for an SMS error
 * 
 * @param error - The error to get a message for
 * @returns A user-friendly error message
 */
export function getSmsErrorMessage(error: any): string {
  if (!error) return 'Unknown SMS error';
  
  // If error already has errorDetails from createSmsError
  if (error.errorDetails?.message) {
    return error.errorDetails.message;
  }
  
  // Otherwise classify the error
  const errorDetails = classifySmsError(error);
  return errorDetails.message;
}

/**
 * Gets the journey error category for an SMS error
 * Always returns NOTIFICATION for SMS errors
 * 
 * @returns The journey error category
 */
export function getSmsErrorCategory(): JourneyErrorCategory {
  return JourneyErrorCategory.NOTIFICATION;
}