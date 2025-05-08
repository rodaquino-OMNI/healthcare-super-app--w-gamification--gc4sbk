/**
 * Defines detailed failure reason codes for notification delivery attempts.
 * These codes provide insight into specific failure modes for each notification channel
 * and support targeted improvements to reliability.
 *
 * The codes are grouped by notification channel (push, email, SMS, in-app) and
 * mapped to error classifications for proper retry policy selection.
 */

/**
 * Error type classifications used for determining retry behavior
 * These align with the error classification system defined in the technical specification
 */
export enum ErrorType {
  /** Temporary errors that may resolve with retries (network issues, timeouts) */
  TRANSIENT = 'TRANSIENT',
  /** Client-side errors that won't be resolved with retries (invalid input, authentication) */
  CLIENT = 'CLIENT',
  /** Internal system errors that may or may not resolve with retries */
  SYSTEM = 'SYSTEM',
  /** Errors from external dependencies that may resolve with retries */
  EXTERNAL = 'EXTERNAL'
}

/**
 * Push notification failure reason codes
 */
export enum PushReasonCode {
  /** Device token is invalid or not registered */
  INVALID_TOKEN = 'PUSH_001',
  /** Device token has expired */
  TOKEN_EXPIRED = 'PUSH_002',
  /** User has uninstalled the app or revoked permissions */
  TOKEN_UNREGISTERED = 'PUSH_003',
  /** Push notification payload exceeds size limits */
  PAYLOAD_TOO_LARGE = 'PUSH_004',
  /** Push service (FCM, APNs) is temporarily unavailable */
  SERVICE_UNAVAILABLE = 'PUSH_005',
  /** Push service returned a rate limit error */
  RATE_LIMITED = 'PUSH_006',
  /** Authentication with push service failed */
  AUTH_ERROR = 'PUSH_007',
  /** Network error while connecting to push service */
  NETWORK_ERROR = 'PUSH_008',
  /** Push notification contained invalid data format */
  INVALID_DATA = 'PUSH_009',
  /** Device is not registered for push notifications */
  NOT_REGISTERED = 'PUSH_010',
  /** Push service returned an unknown error */
  UNKNOWN_ERROR = 'PUSH_011',
  /** Topic-based messaging error */
  TOPIC_ERROR = 'PUSH_012',
  /** Push certificate or key is invalid */
  CERTIFICATE_ERROR = 'PUSH_013',
  /** Push service account has been suspended or revoked */
  ACCOUNT_ERROR = 'PUSH_014',
  /** Push notification was rejected by the service */
  REJECTED = 'PUSH_015'
}

/**
 * Email notification failure reason codes
 */
export enum EmailReasonCode {
  /** Recipient email address is invalid */
  INVALID_RECIPIENT = 'EMAIL_001',
  /** Sender email address is invalid or not verified */
  INVALID_SENDER = 'EMAIL_002',
  /** Email content is invalid or contains prohibited content */
  INVALID_CONTENT = 'EMAIL_003',
  /** Email service provider is temporarily unavailable */
  SERVICE_UNAVAILABLE = 'EMAIL_004',
  /** Email service returned a rate limit error */
  RATE_LIMITED = 'EMAIL_005',
  /** Authentication with email service failed */
  AUTH_ERROR = 'EMAIL_006',
  /** Network error while connecting to email service */
  NETWORK_ERROR = 'EMAIL_007',
  /** Email bounced due to recipient mailbox issues */
  BOUNCED = 'EMAIL_008',
  /** Email was rejected by recipient server */
  REJECTED = 'EMAIL_009',
  /** Email was marked as spam by recipient server */
  SPAM_REJECTION = 'EMAIL_010',
  /** Email service account has been suspended */
  ACCOUNT_ERROR = 'EMAIL_011',
  /** Email template rendering failed */
  TEMPLATE_ERROR = 'EMAIL_012',
  /** Email attachment is invalid or too large */
  ATTACHMENT_ERROR = 'EMAIL_013',
  /** Email service returned an unknown error */
  UNKNOWN_ERROR = 'EMAIL_014',
  /** Email delivery was deferred by recipient server */
  DEFERRED = 'EMAIL_015',
  /** Email contained invalid headers */
  INVALID_HEADERS = 'EMAIL_016'
}

/**
 * SMS notification failure reason codes
 */
export enum SmsReasonCode {
  /** Recipient phone number is invalid */
  INVALID_RECIPIENT = 'SMS_001',
  /** SMS content is invalid or too long */
  INVALID_CONTENT = 'SMS_002',
  /** SMS service provider is temporarily unavailable */
  SERVICE_UNAVAILABLE = 'SMS_003',
  /** SMS service returned a rate limit error */
  RATE_LIMITED = 'SMS_004',
  /** Authentication with SMS service failed */
  AUTH_ERROR = 'SMS_005',
  /** Network error while connecting to SMS service */
  NETWORK_ERROR = 'SMS_006',
  /** Recipient opted out of SMS messages */
  OPTED_OUT = 'SMS_007',
  /** SMS was rejected by carrier */
  CARRIER_REJECTED = 'SMS_008',
  /** Recipient number is unreachable */
  UNREACHABLE = 'SMS_009',
  /** SMS service account has insufficient funds */
  INSUFFICIENT_FUNDS = 'SMS_010',
  /** SMS service account has been suspended */
  ACCOUNT_ERROR = 'SMS_011',
  /** SMS template rendering failed */
  TEMPLATE_ERROR = 'SMS_012',
  /** SMS service returned an unknown error */
  UNKNOWN_ERROR = 'SMS_013',
  /** SMS delivery was delayed by carrier */
  DELAYED = 'SMS_014',
  /** SMS contained invalid sender ID */
  INVALID_SENDER_ID = 'SMS_015',
  /** SMS delivery failed due to regulatory compliance issues */
  REGULATORY_ERROR = 'SMS_016'
}

/**
 * In-app notification failure reason codes
 */
export enum InAppReasonCode {
  /** User session is invalid or expired */
  INVALID_SESSION = 'INAPP_001',
  /** User is not connected to WebSocket */
  NOT_CONNECTED = 'INAPP_002',
  /** Redis publish operation failed */
  REDIS_PUBLISH_ERROR = 'INAPP_003',
  /** Redis connection error */
  REDIS_CONNECTION_ERROR = 'INAPP_004',
  /** Notification payload is invalid */
  INVALID_PAYLOAD = 'INAPP_005',
  /** User ID is invalid or not found */
  INVALID_USER = 'INAPP_006',
  /** WebSocket server is temporarily unavailable */
  SERVICE_UNAVAILABLE = 'INAPP_007',
  /** WebSocket message delivery timed out */
  DELIVERY_TIMEOUT = 'INAPP_008',
  /** Notification storage operation failed */
  STORAGE_ERROR = 'INAPP_009',
  /** Notification template rendering failed */
  TEMPLATE_ERROR = 'INAPP_010',
  /** WebSocket server returned an unknown error */
  UNKNOWN_ERROR = 'INAPP_011',
  /** WebSocket connection limit exceeded */
  CONNECTION_LIMIT_EXCEEDED = 'INAPP_012',
  /** User has too many stored notifications */
  STORAGE_LIMIT_EXCEEDED = 'INAPP_013',
  /** Journey context validation failed */
  INVALID_JOURNEY_CONTEXT = 'INAPP_014'
}

/**
 * Maps push notification reason codes to error types for retry policy selection
 */
export const pushReasonCodeToErrorType: Record<PushReasonCode, ErrorType> = {
  [PushReasonCode.INVALID_TOKEN]: ErrorType.CLIENT,
  [PushReasonCode.TOKEN_EXPIRED]: ErrorType.CLIENT,
  [PushReasonCode.TOKEN_UNREGISTERED]: ErrorType.CLIENT,
  [PushReasonCode.PAYLOAD_TOO_LARGE]: ErrorType.CLIENT,
  [PushReasonCode.SERVICE_UNAVAILABLE]: ErrorType.EXTERNAL,
  [PushReasonCode.RATE_LIMITED]: ErrorType.TRANSIENT,
  [PushReasonCode.AUTH_ERROR]: ErrorType.SYSTEM,
  [PushReasonCode.NETWORK_ERROR]: ErrorType.TRANSIENT,
  [PushReasonCode.INVALID_DATA]: ErrorType.CLIENT,
  [PushReasonCode.NOT_REGISTERED]: ErrorType.CLIENT,
  [PushReasonCode.UNKNOWN_ERROR]: ErrorType.SYSTEM,
  [PushReasonCode.TOPIC_ERROR]: ErrorType.CLIENT,
  [PushReasonCode.CERTIFICATE_ERROR]: ErrorType.SYSTEM,
  [PushReasonCode.ACCOUNT_ERROR]: ErrorType.SYSTEM,
  [PushReasonCode.REJECTED]: ErrorType.EXTERNAL
};

/**
 * Maps email notification reason codes to error types for retry policy selection
 */
export const emailReasonCodeToErrorType: Record<EmailReasonCode, ErrorType> = {
  [EmailReasonCode.INVALID_RECIPIENT]: ErrorType.CLIENT,
  [EmailReasonCode.INVALID_SENDER]: ErrorType.SYSTEM,
  [EmailReasonCode.INVALID_CONTENT]: ErrorType.CLIENT,
  [EmailReasonCode.SERVICE_UNAVAILABLE]: ErrorType.EXTERNAL,
  [EmailReasonCode.RATE_LIMITED]: ErrorType.TRANSIENT,
  [EmailReasonCode.AUTH_ERROR]: ErrorType.SYSTEM,
  [EmailReasonCode.NETWORK_ERROR]: ErrorType.TRANSIENT,
  [EmailReasonCode.BOUNCED]: ErrorType.CLIENT,
  [EmailReasonCode.REJECTED]: ErrorType.CLIENT,
  [EmailReasonCode.SPAM_REJECTION]: ErrorType.CLIENT,
  [EmailReasonCode.ACCOUNT_ERROR]: ErrorType.SYSTEM,
  [EmailReasonCode.TEMPLATE_ERROR]: ErrorType.SYSTEM,
  [EmailReasonCode.ATTACHMENT_ERROR]: ErrorType.CLIENT,
  [EmailReasonCode.UNKNOWN_ERROR]: ErrorType.SYSTEM,
  [EmailReasonCode.DEFERRED]: ErrorType.TRANSIENT,
  [EmailReasonCode.INVALID_HEADERS]: ErrorType.CLIENT
};

/**
 * Maps SMS notification reason codes to error types for retry policy selection
 */
export const smsReasonCodeToErrorType: Record<SmsReasonCode, ErrorType> = {
  [SmsReasonCode.INVALID_RECIPIENT]: ErrorType.CLIENT,
  [SmsReasonCode.INVALID_CONTENT]: ErrorType.CLIENT,
  [SmsReasonCode.SERVICE_UNAVAILABLE]: ErrorType.EXTERNAL,
  [SmsReasonCode.RATE_LIMITED]: ErrorType.TRANSIENT,
  [SmsReasonCode.AUTH_ERROR]: ErrorType.SYSTEM,
  [SmsReasonCode.NETWORK_ERROR]: ErrorType.TRANSIENT,
  [SmsReasonCode.OPTED_OUT]: ErrorType.CLIENT,
  [SmsReasonCode.CARRIER_REJECTED]: ErrorType.EXTERNAL,
  [SmsReasonCode.UNREACHABLE]: ErrorType.CLIENT,
  [SmsReasonCode.INSUFFICIENT_FUNDS]: ErrorType.SYSTEM,
  [SmsReasonCode.ACCOUNT_ERROR]: ErrorType.SYSTEM,
  [SmsReasonCode.TEMPLATE_ERROR]: ErrorType.SYSTEM,
  [SmsReasonCode.UNKNOWN_ERROR]: ErrorType.SYSTEM,
  [SmsReasonCode.DELAYED]: ErrorType.TRANSIENT,
  [SmsReasonCode.INVALID_SENDER_ID]: ErrorType.SYSTEM,
  [SmsReasonCode.REGULATORY_ERROR]: ErrorType.SYSTEM
};

/**
 * Maps in-app notification reason codes to error types for retry policy selection
 */
export const inAppReasonCodeToErrorType: Record<InAppReasonCode, ErrorType> = {
  [InAppReasonCode.INVALID_SESSION]: ErrorType.CLIENT,
  [InAppReasonCode.NOT_CONNECTED]: ErrorType.CLIENT,
  [InAppReasonCode.REDIS_PUBLISH_ERROR]: ErrorType.SYSTEM,
  [InAppReasonCode.REDIS_CONNECTION_ERROR]: ErrorType.TRANSIENT,
  [InAppReasonCode.INVALID_PAYLOAD]: ErrorType.CLIENT,
  [InAppReasonCode.INVALID_USER]: ErrorType.CLIENT,
  [InAppReasonCode.SERVICE_UNAVAILABLE]: ErrorType.SYSTEM,
  [InAppReasonCode.DELIVERY_TIMEOUT]: ErrorType.TRANSIENT,
  [InAppReasonCode.STORAGE_ERROR]: ErrorType.SYSTEM,
  [InAppReasonCode.TEMPLATE_ERROR]: ErrorType.SYSTEM,
  [InAppReasonCode.UNKNOWN_ERROR]: ErrorType.SYSTEM,
  [InAppReasonCode.CONNECTION_LIMIT_EXCEEDED]: ErrorType.TRANSIENT,
  [InAppReasonCode.STORAGE_LIMIT_EXCEEDED]: ErrorType.CLIENT,
  [InAppReasonCode.INVALID_JOURNEY_CONTEXT]: ErrorType.CLIENT
};

/**
 * Maps a reason code to its corresponding error type based on the notification channel
 * @param channel The notification channel (push, email, sms, in-app)
 * @param reasonCode The specific reason code for the failure
 * @returns The error type classification or SYSTEM as fallback
 */
export function getErrorTypeForReasonCode(
  channel: string,
  reasonCode: string
): ErrorType {
  switch (channel) {
    case 'push':
      return pushReasonCodeToErrorType[reasonCode as PushReasonCode] || ErrorType.SYSTEM;
    case 'email':
      return emailReasonCodeToErrorType[reasonCode as EmailReasonCode] || ErrorType.SYSTEM;
    case 'sms':
      return smsReasonCodeToErrorType[reasonCode as SmsReasonCode] || ErrorType.SYSTEM;
    case 'in-app':
      return inAppReasonCodeToErrorType[reasonCode as InAppReasonCode] || ErrorType.SYSTEM;
    default:
      return ErrorType.SYSTEM;
  }
}

/**
 * Gets a human-readable description for a reason code
 * @param reasonCode The specific reason code
 * @returns A human-readable description of the error
 */
export function getReasonCodeDescription(reasonCode: string): string {
  const descriptions: Record<string, string> = {
    // Push notification reason code descriptions
    [PushReasonCode.INVALID_TOKEN]: 'The device token is invalid or not properly formatted',
    [PushReasonCode.TOKEN_EXPIRED]: 'The device token has expired and needs to be refreshed',
    [PushReasonCode.TOKEN_UNREGISTERED]: 'The device token is no longer registered with the push service',
    [PushReasonCode.PAYLOAD_TOO_LARGE]: 'The push notification payload exceeds the size limit',
    [PushReasonCode.SERVICE_UNAVAILABLE]: 'The push notification service is temporarily unavailable',
    [PushReasonCode.RATE_LIMITED]: 'The push notification request was rate limited by the service',
    [PushReasonCode.AUTH_ERROR]: 'Authentication with the push notification service failed',
    [PushReasonCode.NETWORK_ERROR]: 'A network error occurred while connecting to the push service',
    [PushReasonCode.INVALID_DATA]: 'The push notification contained invalid data',
    [PushReasonCode.NOT_REGISTERED]: 'The device is not registered for push notifications',
    [PushReasonCode.UNKNOWN_ERROR]: 'An unknown error occurred with the push notification service',
    [PushReasonCode.TOPIC_ERROR]: 'An error occurred with the push notification topic',
    [PushReasonCode.CERTIFICATE_ERROR]: 'The push certificate or key is invalid',
    [PushReasonCode.ACCOUNT_ERROR]: 'The push service account has been suspended or revoked',
    [PushReasonCode.REJECTED]: 'The push notification was rejected by the service',
    
    // Email notification reason code descriptions
    [EmailReasonCode.INVALID_RECIPIENT]: 'The recipient email address is invalid',
    [EmailReasonCode.INVALID_SENDER]: 'The sender email address is invalid or not verified',
    [EmailReasonCode.INVALID_CONTENT]: 'The email content is invalid or contains prohibited content',
    [EmailReasonCode.SERVICE_UNAVAILABLE]: 'The email service is temporarily unavailable',
    [EmailReasonCode.RATE_LIMITED]: 'The email request was rate limited by the service',
    [EmailReasonCode.AUTH_ERROR]: 'Authentication with the email service failed',
    [EmailReasonCode.NETWORK_ERROR]: 'A network error occurred while connecting to the email service',
    [EmailReasonCode.BOUNCED]: 'The email bounced due to recipient mailbox issues',
    [EmailReasonCode.REJECTED]: 'The email was rejected by the recipient server',
    [EmailReasonCode.SPAM_REJECTION]: 'The email was marked as spam by the recipient server',
    [EmailReasonCode.ACCOUNT_ERROR]: 'The email service account has been suspended',
    [EmailReasonCode.TEMPLATE_ERROR]: 'The email template rendering failed',
    [EmailReasonCode.ATTACHMENT_ERROR]: 'The email attachment is invalid or too large',
    [EmailReasonCode.UNKNOWN_ERROR]: 'An unknown error occurred with the email service',
    [EmailReasonCode.DEFERRED]: 'The email delivery was deferred by the recipient server',
    [EmailReasonCode.INVALID_HEADERS]: 'The email contained invalid headers',
    
    // SMS notification reason code descriptions
    [SmsReasonCode.INVALID_RECIPIENT]: 'The recipient phone number is invalid',
    [SmsReasonCode.INVALID_CONTENT]: 'The SMS content is invalid or too long',
    [SmsReasonCode.SERVICE_UNAVAILABLE]: 'The SMS service is temporarily unavailable',
    [SmsReasonCode.RATE_LIMITED]: 'The SMS request was rate limited by the service',
    [SmsReasonCode.AUTH_ERROR]: 'Authentication with the SMS service failed',
    [SmsReasonCode.NETWORK_ERROR]: 'A network error occurred while connecting to the SMS service',
    [SmsReasonCode.OPTED_OUT]: 'The recipient has opted out of SMS messages',
    [SmsReasonCode.CARRIER_REJECTED]: 'The SMS was rejected by the carrier',
    [SmsReasonCode.UNREACHABLE]: 'The recipient phone number is unreachable',
    [SmsReasonCode.INSUFFICIENT_FUNDS]: 'The SMS service account has insufficient funds',
    [SmsReasonCode.ACCOUNT_ERROR]: 'The SMS service account has been suspended',
    [SmsReasonCode.TEMPLATE_ERROR]: 'The SMS template rendering failed',
    [SmsReasonCode.UNKNOWN_ERROR]: 'An unknown error occurred with the SMS service',
    [SmsReasonCode.DELAYED]: 'The SMS delivery was delayed by the carrier',
    [SmsReasonCode.INVALID_SENDER_ID]: 'The SMS contained an invalid sender ID',
    [SmsReasonCode.REGULATORY_ERROR]: 'The SMS delivery failed due to regulatory compliance issues',
    
    // In-app notification reason code descriptions
    [InAppReasonCode.INVALID_SESSION]: 'The user session is invalid or expired',
    [InAppReasonCode.NOT_CONNECTED]: 'The user is not connected to the WebSocket',
    [InAppReasonCode.REDIS_PUBLISH_ERROR]: 'The Redis publish operation failed',
    [InAppReasonCode.REDIS_CONNECTION_ERROR]: 'A Redis connection error occurred',
    [InAppReasonCode.INVALID_PAYLOAD]: 'The notification payload is invalid',
    [InAppReasonCode.INVALID_USER]: 'The user ID is invalid or not found',
    [InAppReasonCode.SERVICE_UNAVAILABLE]: 'The WebSocket server is temporarily unavailable',
    [InAppReasonCode.DELIVERY_TIMEOUT]: 'The WebSocket message delivery timed out',
    [InAppReasonCode.STORAGE_ERROR]: 'The notification storage operation failed',
    [InAppReasonCode.TEMPLATE_ERROR]: 'The notification template rendering failed',
    [InAppReasonCode.UNKNOWN_ERROR]: 'An unknown error occurred with the WebSocket server',
    [InAppReasonCode.CONNECTION_LIMIT_EXCEEDED]: 'The WebSocket connection limit was exceeded',
    [InAppReasonCode.STORAGE_LIMIT_EXCEEDED]: 'The user has too many stored notifications',
    [InAppReasonCode.INVALID_JOURNEY_CONTEXT]: 'The journey context validation failed'
  };
  
  return descriptions[reasonCode] || 'Unknown error reason code';
}

/**
 * Determines if a reason code should trigger a retry based on its error type
 * @param channel The notification channel
 * @param reasonCode The specific reason code
 * @returns True if the error should be retried, false otherwise
 */
export function shouldRetryForReasonCode(channel: string, reasonCode: string): boolean {
  const errorType = getErrorTypeForReasonCode(channel, reasonCode);
  
  // Only retry transient errors and external dependency errors
  return errorType === ErrorType.TRANSIENT || errorType === ErrorType.EXTERNAL;
}

/**
 * Gets all reason codes for a specific notification channel
 * @param channel The notification channel (push, email, sms, in-app)
 * @returns Array of reason codes for the specified channel
 */
export function getReasonCodesForChannel(channel: string): string[] {
  switch (channel) {
    case 'push':
      return Object.values(PushReasonCode);
    case 'email':
      return Object.values(EmailReasonCode);
    case 'sms':
      return Object.values(SmsReasonCode);
    case 'in-app':
      return Object.values(InAppReasonCode);
    default:
      return [];
  }
}