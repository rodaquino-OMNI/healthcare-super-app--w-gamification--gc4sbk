/**
 * Constants related to email notification delivery
 * Includes retry configuration, error codes, timeout settings, and journey-specific styling
 */

// Retry Configuration Constants
export const EMAIL_RETRY = {
  /**
   * Maximum number of retry attempts for email delivery
   * After this many failures, the notification will be moved to the dead-letter queue
   */
  MAX_ATTEMPTS: 5,
  
  /**
   * Initial delay in milliseconds before the first retry attempt
   */
  INITIAL_DELAY_MS: 1000, // 1 second
  
  /**
   * Maximum delay in milliseconds between retry attempts
   * Used to cap the exponential backoff to prevent excessive delays
   */
  MAX_DELAY_MS: 60000, // 1 minute
  
  /**
   * Exponential backoff factor
   * Each retry will wait previous_delay * BACKOFF_FACTOR milliseconds
   */
  BACKOFF_FACTOR: 2,
  
  /**
   * Jitter factor (0-1) to add randomness to retry delays
   * Helps prevent thundering herd problem when many retries happen simultaneously
   */
  JITTER_FACTOR: 0.2
};

// Error Code Constants
export enum EMAIL_ERROR_CODE {
  // Transient errors (temporary, should retry)
  SMTP_CONNECTION_ERROR = 'EMAIL_SMTP_CONNECTION_ERROR',
  SMTP_TIMEOUT = 'EMAIL_SMTP_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'EMAIL_RATE_LIMIT_EXCEEDED',
  TEMPORARY_FAILURE = 'EMAIL_TEMPORARY_FAILURE',
  SERVER_BUSY = 'EMAIL_SERVER_BUSY',
  
  // Client errors (permanent, should not retry)
  INVALID_RECIPIENT = 'EMAIL_INVALID_RECIPIENT',
  INVALID_SENDER = 'EMAIL_INVALID_SENDER',
  INVALID_CONTENT = 'EMAIL_INVALID_CONTENT',
  MAILBOX_FULL = 'EMAIL_MAILBOX_FULL',
  MAILBOX_DISABLED = 'EMAIL_MAILBOX_DISABLED',
  SPAM_REJECTED = 'EMAIL_SPAM_REJECTED',
  
  // System errors (internal, may retry depending on context)
  TEMPLATE_ERROR = 'EMAIL_TEMPLATE_ERROR',
  RENDERING_ERROR = 'EMAIL_RENDERING_ERROR',
  CONFIGURATION_ERROR = 'EMAIL_CONFIGURATION_ERROR',
  
  // External dependency errors (third-party, may retry depending on provider)
  PROVIDER_ERROR = 'EMAIL_PROVIDER_ERROR',
  AUTHENTICATION_ERROR = 'EMAIL_AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'EMAIL_QUOTA_EXCEEDED'
}

// Error Type Classification
export const EMAIL_ERROR_TYPES = {
  // Errors that should be retried with backoff
  TRANSIENT: [
    EMAIL_ERROR_CODE.SMTP_CONNECTION_ERROR,
    EMAIL_ERROR_CODE.SMTP_TIMEOUT,
    EMAIL_ERROR_CODE.RATE_LIMIT_EXCEEDED,
    EMAIL_ERROR_CODE.TEMPORARY_FAILURE,
    EMAIL_ERROR_CODE.SERVER_BUSY
  ],
  
  // Errors that should not be retried
  CLIENT: [
    EMAIL_ERROR_CODE.INVALID_RECIPIENT,
    EMAIL_ERROR_CODE.INVALID_SENDER,
    EMAIL_ERROR_CODE.INVALID_CONTENT,
    EMAIL_ERROR_CODE.MAILBOX_FULL,
    EMAIL_ERROR_CODE.MAILBOX_DISABLED,
    EMAIL_ERROR_CODE.SPAM_REJECTED
  ],
  
  // Internal system errors
  SYSTEM: [
    EMAIL_ERROR_CODE.TEMPLATE_ERROR,
    EMAIL_ERROR_CODE.RENDERING_ERROR,
    EMAIL_ERROR_CODE.CONFIGURATION_ERROR
  ],
  
  // External provider errors
  EXTERNAL: [
    EMAIL_ERROR_CODE.PROVIDER_ERROR,
    EMAIL_ERROR_CODE.AUTHENTICATION_ERROR,
    EMAIL_ERROR_CODE.QUOTA_EXCEEDED
  ]
};

// Journey-specific Styling Constants
export const EMAIL_JOURNEY_STYLING = {
  // Health journey styling (green-based)
  HEALTH: {
    PRIMARY_COLOR: '#2E7D32', // Dark green
    SECONDARY_COLOR: '#4CAF50', // Medium green
    ACCENT_COLOR: '#8BC34A', // Light green
    HEADER_BACKGROUND: '#E8F5E9', // Very light green
    BUTTON_COLOR: '#2E7D32',
    LOGO_URL: 'https://assets.austa.app/logos/health-journey-logo.png',
    FONT_FAMILY: '"Roboto", "Helvetica", "Arial", sans-serif'
  },
  
  // Care journey styling (orange-based)
  CARE: {
    PRIMARY_COLOR: '#E65100', // Dark orange
    SECONDARY_COLOR: '#FF9800', // Medium orange
    ACCENT_COLOR: '#FFB74D', // Light orange
    HEADER_BACKGROUND: '#FFF3E0', // Very light orange
    BUTTON_COLOR: '#E65100',
    LOGO_URL: 'https://assets.austa.app/logos/care-journey-logo.png',
    FONT_FAMILY: '"Roboto", "Helvetica", "Arial", sans-serif'
  },
  
  // Plan journey styling (blue-based)
  PLAN: {
    PRIMARY_COLOR: '#1565C0', // Dark blue
    SECONDARY_COLOR: '#2196F3', // Medium blue
    ACCENT_COLOR: '#64B5F6', // Light blue
    HEADER_BACKGROUND: '#E3F2FD', // Very light blue
    BUTTON_COLOR: '#1565C0',
    LOGO_URL: 'https://assets.austa.app/logos/plan-journey-logo.png',
    FONT_FAMILY: '"Roboto", "Helvetica", "Arial", sans-serif'
  },
  
  // Default styling (brand-based)
  DEFAULT: {
    PRIMARY_COLOR: '#5B39F3', // AUSTA primary purple
    SECONDARY_COLOR: '#7E66F5', // Medium purple
    ACCENT_COLOR: '#9D8DF7', // Light purple
    HEADER_BACKGROUND: '#F5F2FF', // Very light purple
    BUTTON_COLOR: '#5B39F3',
    LOGO_URL: 'https://assets.austa.app/logos/austa-logo.png',
    FONT_FAMILY: '"Roboto", "Helvetica", "Arial", sans-serif'
  }
};

// Timeout and Performance Constants
export const EMAIL_TIMEOUTS = {
  /**
   * Connection timeout in milliseconds
   * Maximum time to wait when establishing connection to SMTP server
   */
  CONNECTION_TIMEOUT_MS: 10000, // 10 seconds
  
  /**
   * Socket timeout in milliseconds
   * Maximum time to wait for socket operations
   */
  SOCKET_TIMEOUT_MS: 30000, // 30 seconds
  
  /**
   * Total timeout in milliseconds
   * Maximum time for the entire email sending operation
   */
  TOTAL_TIMEOUT_MS: 60000, // 60 seconds
  
  /**
   * Rate limit for emails per minute
   * Used to prevent triggering provider rate limits
   */
  RATE_LIMIT_PER_MINUTE: 100,
  
  /**
   * Batch size for bulk email operations
   */
  BATCH_SIZE: 50
};

// Dead-letter Queue Constants
export const EMAIL_DLQ = {
  /**
   * Topic name for the email dead-letter queue
   */
  TOPIC_NAME: 'notification.email.dlq',
  
  /**
   * Whether to enable the dead-letter queue
   */
  ENABLED: true,
  
  /**
   * Maximum retention period in days for DLQ messages
   */
  RETENTION_DAYS: 7,
  
  /**
   * Maximum number of processing attempts for DLQ messages
   */
  MAX_PROCESSING_ATTEMPTS: 3
};

// Email Template Constants
export const EMAIL_TEMPLATES = {
  /**
   * Base path for email templates
   */
  BASE_PATH: 'templates/email',
  
  /**
   * Default template engine
   */
  DEFAULT_ENGINE: 'handlebars',
  
  /**
   * Cache TTL in milliseconds
   */
  CACHE_TTL_MS: 3600000, // 1 hour
  
  /**
   * Maximum template size in bytes
   */
  MAX_TEMPLATE_SIZE_BYTES: 1024 * 100 // 100 KB
};