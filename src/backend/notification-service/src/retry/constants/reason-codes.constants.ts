/**
 * Reason codes for notification delivery failures.
 * 
 * These codes provide detailed insight into specific failure modes for each notification channel
 * and support targeted improvements to reliability. They are used for error tracking, analytics,
 * and to determine appropriate retry policies.
 * 
 * Codes are grouped by notification channel (push, email, SMS, in-app) and mapped to error
 * classifications for proper retry policy selection.
 */

/**
 * Error classification types used to determine appropriate retry behavior.
 */
export enum ErrorClassification {
  /**
   * Temporary errors that are likely to resolve on retry (network issues, timeouts)
   */
  TRANSIENT = 'TRANSIENT',
  
  /**
   * Errors caused by invalid client input or configuration (invalid token, malformed payload)
   */
  CLIENT = 'CLIENT',
  
  /**
   * Internal system errors within our application (database errors, internal exceptions)
   */
  SYSTEM = 'SYSTEM',
  
  /**
   * Errors from external dependencies (provider outage, API changes, rate limiting)
   */
  EXTERNAL = 'EXTERNAL'
}

/**
 * Interface for reason code metadata
 */
export interface ReasonCodeMetadata {
  /**
   * Human-readable description of the error
   */
  description: string;
  
  /**
   * Error classification to determine retry behavior
   */
  classification: ErrorClassification;
  
  /**
   * Whether this error should be retried (some errors should never be retried)
   */
  isRetryable: boolean;
  
  /**
   * Suggested maximum retry attempts for this specific error
   * (overrides default if specified)
   */
  maxRetries?: number;
}

/**
 * Type for mapping reason codes to their metadata
 */
export type ReasonCodeMap = Record<string, ReasonCodeMetadata>;

/**
 * Push notification reason codes
 */
export const PUSH_REASON_CODES = {
  // Device/token issues
  PUSH_INVALID_TOKEN: 'PUSH_INVALID_TOKEN',
  PUSH_TOKEN_NOT_REGISTERED: 'PUSH_TOKEN_NOT_REGISTERED',
  PUSH_TOKEN_CHANGED: 'PUSH_TOKEN_CHANGED',
  PUSH_DEVICE_NOT_FOUND: 'PUSH_DEVICE_NOT_FOUND',
  
  // Message issues
  PUSH_PAYLOAD_TOO_LARGE: 'PUSH_PAYLOAD_TOO_LARGE',
  PUSH_INVALID_DATA_FORMAT: 'PUSH_INVALID_DATA_FORMAT',
  PUSH_INVALID_NOTIFICATION_STRUCTURE: 'PUSH_INVALID_NOTIFICATION_STRUCTURE',
  
  // Provider issues
  PUSH_PROVIDER_ERROR: 'PUSH_PROVIDER_ERROR',
  PUSH_PROVIDER_UNAVAILABLE: 'PUSH_PROVIDER_UNAVAILABLE',
  PUSH_RATE_LIMITED: 'PUSH_RATE_LIMITED',
  PUSH_AUTHENTICATION_ERROR: 'PUSH_AUTHENTICATION_ERROR',
  
  // Connection issues
  PUSH_CONNECTION_ERROR: 'PUSH_CONNECTION_ERROR',
  PUSH_TIMEOUT: 'PUSH_TIMEOUT',
  
  // User/app issues
  PUSH_USER_HAS_LOGGED_OUT: 'PUSH_USER_HAS_LOGGED_OUT',
  PUSH_APP_UNINSTALLED: 'PUSH_APP_UNINSTALLED',
  PUSH_NOTIFICATIONS_DISABLED: 'PUSH_NOTIFICATIONS_DISABLED',
  
  // Unknown
  PUSH_UNKNOWN_ERROR: 'PUSH_UNKNOWN_ERROR'
};

/**
 * Email notification reason codes
 */
export const EMAIL_REASON_CODES = {
  // Address issues
  EMAIL_INVALID_ADDRESS: 'EMAIL_INVALID_ADDRESS',
  EMAIL_MAILBOX_FULL: 'EMAIL_MAILBOX_FULL',
  EMAIL_MAILBOX_NOT_FOUND: 'EMAIL_MAILBOX_NOT_FOUND',
  EMAIL_DOMAIN_NOT_FOUND: 'EMAIL_DOMAIN_NOT_FOUND',
  
  // Content issues
  EMAIL_CONTENT_REJECTED: 'EMAIL_CONTENT_REJECTED',
  EMAIL_ATTACHMENT_TOO_LARGE: 'EMAIL_ATTACHMENT_TOO_LARGE',
  EMAIL_INVALID_TEMPLATE: 'EMAIL_INVALID_TEMPLATE',
  EMAIL_TEMPLATE_RENDERING_ERROR: 'EMAIL_TEMPLATE_RENDERING_ERROR',
  
  // Provider issues
  EMAIL_PROVIDER_ERROR: 'EMAIL_PROVIDER_ERROR',
  EMAIL_PROVIDER_UNAVAILABLE: 'EMAIL_PROVIDER_UNAVAILABLE',
  EMAIL_RATE_LIMITED: 'EMAIL_RATE_LIMITED',
  EMAIL_AUTHENTICATION_ERROR: 'EMAIL_AUTHENTICATION_ERROR',
  EMAIL_ACCOUNT_SUSPENDED: 'EMAIL_ACCOUNT_SUSPENDED',
  
  // Delivery issues
  EMAIL_DELIVERY_DELAYED: 'EMAIL_DELIVERY_DELAYED',
  EMAIL_SOFT_BOUNCE: 'EMAIL_SOFT_BOUNCE',
  EMAIL_HARD_BOUNCE: 'EMAIL_HARD_BOUNCE',
  EMAIL_SPAM_COMPLAINT: 'EMAIL_SPAM_COMPLAINT',
  EMAIL_BLOCKED: 'EMAIL_BLOCKED',
  
  // Connection issues
  EMAIL_CONNECTION_ERROR: 'EMAIL_CONNECTION_ERROR',
  EMAIL_TIMEOUT: 'EMAIL_TIMEOUT',
  
  // Unknown
  EMAIL_UNKNOWN_ERROR: 'EMAIL_UNKNOWN_ERROR'
};

/**
 * SMS notification reason codes
 */
export const SMS_REASON_CODES = {
  // Number issues
  SMS_INVALID_NUMBER: 'SMS_INVALID_NUMBER',
  SMS_NUMBER_NOT_FOUND: 'SMS_NUMBER_NOT_FOUND',
  SMS_NUMBER_CHANGED: 'SMS_NUMBER_CHANGED',
  SMS_LANDLINE_NUMBER: 'SMS_LANDLINE_NUMBER',
  
  // Content issues
  SMS_CONTENT_TOO_LONG: 'SMS_CONTENT_TOO_LONG',
  SMS_CONTENT_REJECTED: 'SMS_CONTENT_REJECTED',
  SMS_INVALID_TEMPLATE: 'SMS_INVALID_TEMPLATE',
  SMS_TEMPLATE_RENDERING_ERROR: 'SMS_TEMPLATE_RENDERING_ERROR',
  
  // Provider issues
  SMS_PROVIDER_ERROR: 'SMS_PROVIDER_ERROR',
  SMS_PROVIDER_UNAVAILABLE: 'SMS_PROVIDER_UNAVAILABLE',
  SMS_RATE_LIMITED: 'SMS_RATE_LIMITED',
  SMS_AUTHENTICATION_ERROR: 'SMS_AUTHENTICATION_ERROR',
  SMS_ACCOUNT_SUSPENDED: 'SMS_ACCOUNT_SUSPENDED',
  SMS_INSUFFICIENT_FUNDS: 'SMS_INSUFFICIENT_FUNDS',
  
  // Delivery issues
  SMS_DELIVERY_DELAYED: 'SMS_DELIVERY_DELAYED',
  SMS_DELIVERY_FAILED: 'SMS_DELIVERY_FAILED',
  SMS_CARRIER_REJECTED: 'SMS_CARRIER_REJECTED',
  SMS_BLOCKED: 'SMS_BLOCKED',
  
  // Connection issues
  SMS_CONNECTION_ERROR: 'SMS_CONNECTION_ERROR',
  SMS_TIMEOUT: 'SMS_TIMEOUT',
  
  // Unknown
  SMS_UNKNOWN_ERROR: 'SMS_UNKNOWN_ERROR'
};

/**
 * In-app notification reason codes
 */
export const IN_APP_REASON_CODES = {
  // User issues
  IN_APP_USER_NOT_FOUND: 'IN_APP_USER_NOT_FOUND',
  IN_APP_USER_LOGGED_OUT: 'IN_APP_USER_LOGGED_OUT',
  IN_APP_USER_INACTIVE: 'IN_APP_USER_INACTIVE',
  
  // Content issues
  IN_APP_INVALID_CONTENT: 'IN_APP_INVALID_CONTENT',
  IN_APP_CONTENT_TOO_LARGE: 'IN_APP_CONTENT_TOO_LARGE',
  IN_APP_INVALID_TEMPLATE: 'IN_APP_INVALID_TEMPLATE',
  IN_APP_TEMPLATE_RENDERING_ERROR: 'IN_APP_TEMPLATE_RENDERING_ERROR',
  
  // Storage issues
  IN_APP_STORAGE_ERROR: 'IN_APP_STORAGE_ERROR',
  IN_APP_REDIS_ERROR: 'IN_APP_REDIS_ERROR',
  IN_APP_DATABASE_ERROR: 'IN_APP_DATABASE_ERROR',
  
  // WebSocket issues
  IN_APP_WEBSOCKET_ERROR: 'IN_APP_WEBSOCKET_ERROR',
  IN_APP_WEBSOCKET_DISCONNECTED: 'IN_APP_WEBSOCKET_DISCONNECTED',
  IN_APP_DELIVERY_TIMEOUT: 'IN_APP_DELIVERY_TIMEOUT',
  
  // Unknown
  IN_APP_UNKNOWN_ERROR: 'IN_APP_UNKNOWN_ERROR'
};

/**
 * Metadata for push notification reason codes
 */
export const PUSH_REASON_CODE_MAP: ReasonCodeMap = {
  [PUSH_REASON_CODES.PUSH_INVALID_TOKEN]: {
    description: 'The device token is invalid or malformed',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_TOKEN_NOT_REGISTERED]: {
    description: 'The device token is not registered with the push service',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_TOKEN_CHANGED]: {
    description: 'The device token has changed and needs to be updated',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_DEVICE_NOT_FOUND]: {
    description: 'The device was not found',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_PAYLOAD_TOO_LARGE]: {
    description: 'The notification payload exceeds the size limit',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_INVALID_DATA_FORMAT]: {
    description: 'The notification data format is invalid',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_INVALID_NOTIFICATION_STRUCTURE]: {
    description: 'The notification structure is invalid',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_PROVIDER_ERROR]: {
    description: 'The push provider returned an error',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 5
  },
  [PUSH_REASON_CODES.PUSH_PROVIDER_UNAVAILABLE]: {
    description: 'The push provider is temporarily unavailable',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 8
  },
  [PUSH_REASON_CODES.PUSH_RATE_LIMITED]: {
    description: 'The push provider is rate limiting requests',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 5
  },
  [PUSH_REASON_CODES.PUSH_AUTHENTICATION_ERROR]: {
    description: 'Authentication with the push provider failed',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  },
  [PUSH_REASON_CODES.PUSH_CONNECTION_ERROR]: {
    description: 'Connection to the push provider failed',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 8
  },
  [PUSH_REASON_CODES.PUSH_TIMEOUT]: {
    description: 'The request to the push provider timed out',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 5
  },
  [PUSH_REASON_CODES.PUSH_USER_HAS_LOGGED_OUT]: {
    description: 'The user has logged out',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_APP_UNINSTALLED]: {
    description: 'The app has been uninstalled',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_NOTIFICATIONS_DISABLED]: {
    description: 'Push notifications are disabled for this user',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [PUSH_REASON_CODES.PUSH_UNKNOWN_ERROR]: {
    description: 'An unknown error occurred while sending the push notification',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  }
};

/**
 * Metadata for email notification reason codes
 */
export const EMAIL_REASON_CODE_MAP: ReasonCodeMap = {
  [EMAIL_REASON_CODES.EMAIL_INVALID_ADDRESS]: {
    description: 'The email address is invalid or malformed',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_MAILBOX_FULL]: {
    description: 'The recipient\'s mailbox is full',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 8
  },
  [EMAIL_REASON_CODES.EMAIL_MAILBOX_NOT_FOUND]: {
    description: 'The recipient\'s mailbox was not found',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_DOMAIN_NOT_FOUND]: {
    description: 'The recipient\'s domain was not found',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_CONTENT_REJECTED]: {
    description: 'The email content was rejected by the recipient server',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_ATTACHMENT_TOO_LARGE]: {
    description: 'The email attachment is too large',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_INVALID_TEMPLATE]: {
    description: 'The email template is invalid or not found',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_TEMPLATE_RENDERING_ERROR]: {
    description: 'An error occurred while rendering the email template',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_PROVIDER_ERROR]: {
    description: 'The email provider returned an error',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 5
  },
  [EMAIL_REASON_CODES.EMAIL_PROVIDER_UNAVAILABLE]: {
    description: 'The email provider is temporarily unavailable',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 8
  },
  [EMAIL_REASON_CODES.EMAIL_RATE_LIMITED]: {
    description: 'The email provider is rate limiting requests',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 10
  },
  [EMAIL_REASON_CODES.EMAIL_AUTHENTICATION_ERROR]: {
    description: 'Authentication with the email provider failed',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  },
  [EMAIL_REASON_CODES.EMAIL_ACCOUNT_SUSPENDED]: {
    description: 'The email account has been suspended',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_DELIVERY_DELAYED]: {
    description: 'Email delivery has been delayed',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 5
  },
  [EMAIL_REASON_CODES.EMAIL_SOFT_BOUNCE]: {
    description: 'The email soft bounced (temporary issue)',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 8
  },
  [EMAIL_REASON_CODES.EMAIL_HARD_BOUNCE]: {
    description: 'The email hard bounced (permanent issue)',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_SPAM_COMPLAINT]: {
    description: 'The recipient marked the email as spam',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_BLOCKED]: {
    description: 'The email was blocked by the recipient server',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: false
  },
  [EMAIL_REASON_CODES.EMAIL_CONNECTION_ERROR]: {
    description: 'Connection to the email provider failed',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 8
  },
  [EMAIL_REASON_CODES.EMAIL_TIMEOUT]: {
    description: 'The request to the email provider timed out',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 5
  },
  [EMAIL_REASON_CODES.EMAIL_UNKNOWN_ERROR]: {
    description: 'An unknown error occurred while sending the email',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  }
};

/**
 * Metadata for SMS notification reason codes
 */
export const SMS_REASON_CODE_MAP: ReasonCodeMap = {
  [SMS_REASON_CODES.SMS_INVALID_NUMBER]: {
    description: 'The phone number is invalid or malformed',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_NUMBER_NOT_FOUND]: {
    description: 'The phone number was not found',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_NUMBER_CHANGED]: {
    description: 'The phone number has changed',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_LANDLINE_NUMBER]: {
    description: 'The phone number is a landline that cannot receive SMS',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_CONTENT_TOO_LONG]: {
    description: 'The SMS content exceeds the character limit',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_CONTENT_REJECTED]: {
    description: 'The SMS content was rejected by the provider',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_INVALID_TEMPLATE]: {
    description: 'The SMS template is invalid or not found',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_TEMPLATE_RENDERING_ERROR]: {
    description: 'An error occurred while rendering the SMS template',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_PROVIDER_ERROR]: {
    description: 'The SMS provider returned an error',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 5
  },
  [SMS_REASON_CODES.SMS_PROVIDER_UNAVAILABLE]: {
    description: 'The SMS provider is temporarily unavailable',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 8
  },
  [SMS_REASON_CODES.SMS_RATE_LIMITED]: {
    description: 'The SMS provider is rate limiting requests',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 10
  },
  [SMS_REASON_CODES.SMS_AUTHENTICATION_ERROR]: {
    description: 'Authentication with the SMS provider failed',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  },
  [SMS_REASON_CODES.SMS_ACCOUNT_SUSPENDED]: {
    description: 'The SMS account has been suspended',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_INSUFFICIENT_FUNDS]: {
    description: 'Insufficient funds to send SMS',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_DELIVERY_DELAYED]: {
    description: 'SMS delivery has been delayed',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 5
  },
  [SMS_REASON_CODES.SMS_DELIVERY_FAILED]: {
    description: 'SMS delivery failed',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: true,
    maxRetries: 3
  },
  [SMS_REASON_CODES.SMS_CARRIER_REJECTED]: {
    description: 'The SMS was rejected by the carrier',
    classification: ErrorClassification.EXTERNAL,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_BLOCKED]: {
    description: 'The SMS was blocked by the recipient',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [SMS_REASON_CODES.SMS_CONNECTION_ERROR]: {
    description: 'Connection to the SMS provider failed',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 8
  },
  [SMS_REASON_CODES.SMS_TIMEOUT]: {
    description: 'The request to the SMS provider timed out',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 5
  },
  [SMS_REASON_CODES.SMS_UNKNOWN_ERROR]: {
    description: 'An unknown error occurred while sending the SMS',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  }
};

/**
 * Metadata for in-app notification reason codes
 */
export const IN_APP_REASON_CODE_MAP: ReasonCodeMap = {
  [IN_APP_REASON_CODES.IN_APP_USER_NOT_FOUND]: {
    description: 'The user was not found',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [IN_APP_REASON_CODES.IN_APP_USER_LOGGED_OUT]: {
    description: 'The user is logged out',
    classification: ErrorClassification.CLIENT,
    isRetryable: true,
    maxRetries: 3
  },
  [IN_APP_REASON_CODES.IN_APP_USER_INACTIVE]: {
    description: 'The user account is inactive',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [IN_APP_REASON_CODES.IN_APP_INVALID_CONTENT]: {
    description: 'The notification content is invalid',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [IN_APP_REASON_CODES.IN_APP_CONTENT_TOO_LARGE]: {
    description: 'The notification content is too large',
    classification: ErrorClassification.CLIENT,
    isRetryable: false
  },
  [IN_APP_REASON_CODES.IN_APP_INVALID_TEMPLATE]: {
    description: 'The notification template is invalid or not found',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [IN_APP_REASON_CODES.IN_APP_TEMPLATE_RENDERING_ERROR]: {
    description: 'An error occurred while rendering the notification template',
    classification: ErrorClassification.SYSTEM,
    isRetryable: false
  },
  [IN_APP_REASON_CODES.IN_APP_STORAGE_ERROR]: {
    description: 'An error occurred while storing the notification',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 5
  },
  [IN_APP_REASON_CODES.IN_APP_REDIS_ERROR]: {
    description: 'An error occurred with Redis while processing the notification',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 5
  },
  [IN_APP_REASON_CODES.IN_APP_DATABASE_ERROR]: {
    description: 'A database error occurred while processing the notification',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 5
  },
  [IN_APP_REASON_CODES.IN_APP_WEBSOCKET_ERROR]: {
    description: 'An error occurred with the WebSocket connection',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 8
  },
  [IN_APP_REASON_CODES.IN_APP_WEBSOCKET_DISCONNECTED]: {
    description: 'The WebSocket connection is disconnected',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 8
  },
  [IN_APP_REASON_CODES.IN_APP_DELIVERY_TIMEOUT]: {
    description: 'The notification delivery timed out',
    classification: ErrorClassification.TRANSIENT,
    isRetryable: true,
    maxRetries: 5
  },
  [IN_APP_REASON_CODES.IN_APP_UNKNOWN_ERROR]: {
    description: 'An unknown error occurred while sending the in-app notification',
    classification: ErrorClassification.SYSTEM,
    isRetryable: true,
    maxRetries: 3
  }
};

/**
 * Combined map of all reason codes
 */
export const ALL_REASON_CODE_MAP: ReasonCodeMap = {
  ...PUSH_REASON_CODE_MAP,
  ...EMAIL_REASON_CODE_MAP,
  ...SMS_REASON_CODE_MAP,
  ...IN_APP_REASON_CODE_MAP
};

/**
 * Helper function to get reason code metadata
 * 
 * @param reasonCode The reason code to look up
 * @returns The metadata for the reason code, or undefined if not found
 */
export function getReasonCodeMetadata(reasonCode: string): ReasonCodeMetadata | undefined {
  return ALL_REASON_CODE_MAP[reasonCode];
}

/**
 * Helper function to determine if a reason code is retryable
 * 
 * @param reasonCode The reason code to check
 * @returns True if the reason code is retryable, false otherwise
 */
export function isReasonCodeRetryable(reasonCode: string): boolean {
  const metadata = getReasonCodeMetadata(reasonCode);
  return metadata ? metadata.isRetryable : false;
}

/**
 * Helper function to get the maximum retry attempts for a reason code
 * 
 * @param reasonCode The reason code to check
 * @param defaultMaxRetries The default maximum retry attempts to use if not specified in the metadata
 * @returns The maximum retry attempts for the reason code
 */
export function getMaxRetriesForReasonCode(reasonCode: string, defaultMaxRetries: number = 3): number {
  const metadata = getReasonCodeMetadata(reasonCode);
  return metadata && metadata.maxRetries !== undefined ? metadata.maxRetries : defaultMaxRetries;
}

/**
 * Helper function to get the error classification for a reason code
 * 
 * @param reasonCode The reason code to check
 * @returns The error classification for the reason code, or SYSTEM if not found
 */
export function getErrorClassificationForReasonCode(reasonCode: string): ErrorClassification {
  const metadata = getReasonCodeMetadata(reasonCode);
  return metadata ? metadata.classification : ErrorClassification.SYSTEM;
}