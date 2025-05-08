/**
 * Constants related to email notification delivery.
 * Includes retry configuration, error codes, timeout settings, and journey-specific styling.
 * 
 * This file defines all constants used by the EmailService to determine retry behavior,
 * error handling strategies, and to apply appropriate styling to email templates based on
 * the user's journey context.
 */

/**
 * Retry Configuration
 * -------------------
 * These constants define the retry behavior for email delivery attempts.
 * The notification service implements exponential backoff with configurable
 * parameters based on message priority.
 */

// Default retry configuration constants
export const EMAIL_MAX_RETRY_ATTEMPTS = 5;
export const EMAIL_INITIAL_RETRY_DELAY_MS = 1000; // 1 second
export const EMAIL_RETRY_BACKOFF_FACTOR = 2; // Exponential backoff multiplier
export const EMAIL_MAX_RETRY_DELAY_MS = 60000; // 1 minute maximum delay between retries

/**
 * Priority-based retry configuration
 * Different retry strategies based on notification priority.
 * - HIGH: Critical notifications (e.g., security alerts, appointment reminders)
 * - MEDIUM: Important but non-critical notifications (e.g., achievement unlocks)
 * - LOW: Informational notifications (e.g., weekly summaries, marketing)
 */
export const EMAIL_RETRY_CONFIG = {
  HIGH: {
    maxAttempts: 7,
    initialDelayMs: 500,
    backoffFactor: 1.5,
    maxDelayMs: 30000, // 30 seconds
  },
  MEDIUM: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    backoffFactor: 2,
    maxDelayMs: 60000, // 1 minute
  },
  LOW: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    backoffFactor: 2.5,
    maxDelayMs: 120000, // 2 minutes
  },
};

/**
 * Error Codes
 * -----------
 * Standardized error codes for email delivery failures.
 * These codes are used for error tracking, analytics, and determining retry behavior.
 */
export const EMAIL_ERROR_CODES = {
  // SMTP connection errors
  CONNECTION_ERROR: 'EMAIL_001', // Failed to connect to SMTP server
  AUTHENTICATION_ERROR: 'EMAIL_002', // Failed to authenticate with SMTP server
  TIMEOUT_ERROR: 'EMAIL_003', // SMTP operation timed out
  
  // Message errors
  INVALID_RECIPIENT: 'EMAIL_004', // Invalid recipient email address
  INVALID_SENDER: 'EMAIL_005', // Invalid sender email address
  INVALID_CONTENT: 'EMAIL_006', // Invalid email content (e.g., malformed HTML)
  MESSAGE_SIZE_EXCEEDED: 'EMAIL_007', // Email size exceeds SMTP server limits
  
  // Server response errors
  SERVER_REJECT: 'EMAIL_008', // SMTP server rejected the message
  RATE_LIMIT_EXCEEDED: 'EMAIL_009', // Rate limit exceeded for SMTP server
  MAILBOX_FULL: 'EMAIL_010', // Recipient mailbox is full
  MAILBOX_UNAVAILABLE: 'EMAIL_011', // Recipient mailbox is temporarily unavailable
  
  // Template errors
  TEMPLATE_NOT_FOUND: 'EMAIL_012', // Email template not found
  TEMPLATE_RENDERING_ERROR: 'EMAIL_013', // Error rendering email template
  
  // General errors
  UNKNOWN_ERROR: 'EMAIL_999', // Unknown or unclassified error
};

/**
 * Error Classification
 * -------------------
 * Groups error codes by type to determine appropriate retry behavior.
 * - TRANSIENT: Temporary errors that should be retried
 * - CLIENT: Client-side errors that should not be retried
 * - SERVER: Server-side errors that should be retried with caution
 */
export const EMAIL_ERROR_CLASSIFICATIONS = {
  // Transient errors that should be retried
  TRANSIENT: [
    EMAIL_ERROR_CODES.CONNECTION_ERROR,
    EMAIL_ERROR_CODES.TIMEOUT_ERROR,
    EMAIL_ERROR_CODES.SERVER_REJECT,
    EMAIL_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    EMAIL_ERROR_CODES.MAILBOX_UNAVAILABLE,
  ],
  
  // Client errors that should not be retried
  CLIENT: [
    EMAIL_ERROR_CODES.INVALID_RECIPIENT,
    EMAIL_ERROR_CODES.INVALID_SENDER,
    EMAIL_ERROR_CODES.INVALID_CONTENT,
    EMAIL_ERROR_CODES.MESSAGE_SIZE_EXCEEDED,
    EMAIL_ERROR_CODES.TEMPLATE_NOT_FOUND,
    EMAIL_ERROR_CODES.TEMPLATE_RENDERING_ERROR,
  ],
  
  // Server errors that should be retried with caution
  SERVER: [
    EMAIL_ERROR_CODES.AUTHENTICATION_ERROR,
    EMAIL_ERROR_CODES.MAILBOX_FULL,
  ],
};

/**
 * Timeout Settings
 * ---------------
 * Defines timeout values for various email operations to prevent
 * long-running operations and ensure responsiveness.
 */
export const EMAIL_TIMEOUT_MS = 10000; // 10 seconds for SMTP operations
export const EMAIL_CONNECTION_TIMEOUT_MS = 5000; // 5 seconds for initial connection
export const EMAIL_TEMPLATE_RENDER_TIMEOUT_MS = 3000; // 3 seconds for template rendering

/**
 * Dead-Letter Queue Configuration
 * ------------------------------
 * Settings for the dead-letter queue (DLQ) that stores failed email delivery attempts
 * for later processing, analysis, or manual intervention.
 */
export const EMAIL_DLQ_CONFIG = {
  enabled: true, // Whether the DLQ is enabled
  maxSize: 1000, // Maximum number of failed emails to store in DLQ
  retentionPeriodHours: 72, // Store failed emails for 3 days
  processingIntervalMinutes: 60, // Process DLQ every hour
  alertThreshold: 100, // Alert when DLQ size exceeds this threshold
  batchSize: 50, // Number of messages to process in each DLQ batch
};

/**
 * Journey-Specific Styling
 * -----------------------
 * Defines styling constants for email templates based on the user's journey context.
 * These values are used to apply consistent journey-specific branding across all
 * email communications.
 * 
 * Each journey has a distinct color palette:
 * - Health: Green-based palette
 * - Care: Orange-based palette
 * - Plan: Blue-based palette
 * - Default: Brand purple-based palette (used when journey is unknown)
 */
export const EMAIL_JOURNEY_STYLING = {
  // Health journey styling (green-based)
  HEALTH: {
    primaryColor: '#2ECC71', // Green
    secondaryColor: '#27AE60',
    accentColor: '#1E8449',
    backgroundColor: '#F1FFF7',
    headerBackgroundColor: '#D5F5E3',
    footerBackgroundColor: '#D5F5E3',
    buttonBackgroundColor: '#2ECC71',
    buttonTextColor: '#FFFFFF',
    linkColor: '#27AE60',
    borderColor: '#A3E4D7',
    logoVariant: 'health',
    fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
    headingFontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
    fontSize: '16px',
    headingColor: '#1E8449',
    textColor: '#333333',
  },
  
  // Care journey styling (orange-based)
  CARE: {
    primaryColor: '#FF8C42', // Orange
    secondaryColor: '#E67E22',
    accentColor: '#D35400',
    backgroundColor: '#FFF4EA',
    headerBackgroundColor: '#FDEBD0',
    footerBackgroundColor: '#FDEBD0',
    buttonBackgroundColor: '#FF8C42',
    buttonTextColor: '#FFFFFF',
    linkColor: '#E67E22',
    borderColor: '#FAD7A0',
    logoVariant: 'care',
    fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
    headingFontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
    fontSize: '16px',
    headingColor: '#D35400',
    textColor: '#333333',
  },
  
  // Plan journey styling (blue-based)
  PLAN: {
    primaryColor: '#3498DB', // Blue
    secondaryColor: '#2980B9',
    accentColor: '#1F618D',
    backgroundColor: '#EBF5FB',
    headerBackgroundColor: '#D4E6F1',
    footerBackgroundColor: '#D4E6F1',
    buttonBackgroundColor: '#3498DB',
    buttonTextColor: '#FFFFFF',
    linkColor: '#2980B9',
    borderColor: '#AED6F1',
    logoVariant: 'plan',
    fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
    headingFontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
    fontSize: '16px',
    headingColor: '#1F618D',
    textColor: '#333333',
  },
  
  // Default styling (brand-based)
  DEFAULT: {
    primaryColor: '#6C5CE7', // Brand purple
    secondaryColor: '#5B39F3',
    accentColor: '#4A29D3',
    backgroundColor: '#F5F3FF',
    headerBackgroundColor: '#E4E0FF',
    footerBackgroundColor: '#E4E0FF',
    buttonBackgroundColor: '#6C5CE7',
    buttonTextColor: '#FFFFFF',
    linkColor: '#5B39F3',
    borderColor: '#D1C4E9',
    logoVariant: 'default',
    fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
    headingFontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
    fontSize: '16px',
    headingColor: '#4A29D3',
    textColor: '#333333',
  },
};

/**
 * Email Template Components
 * -----------------------
 * Defines styling for specific email template components to ensure
 * consistent appearance across all email communications.
 */
export const EMAIL_COMPONENT_STYLING = {
  // Button styling
  BUTTON: {
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '16px 0',
  },
  
  // Card styling
  CARD: {
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  // Header styling
  HEADER: {
    padding: '24px',
    textAlign: 'center',
  },
  
  // Footer styling
  FOOTER: {
    padding: '16px',
    textAlign: 'center',
    fontSize: '14px',
  },
};

/**
 * Performance Metrics
 * ------------------
 * Defines target performance metrics for email operations to ensure
 * the notification service meets its SLAs.
 */
export const EMAIL_PERFORMANCE_METRICS = {
  targetRenderTimeMs: 100, // Target time for template rendering
  targetSendTimeMs: 500, // Target time for email sending
  targetTotalDeliveryTimeMs: 30000, // Target time for end-to-end delivery (30 seconds)
  logPerformanceMetrics: true, // Whether to log performance metrics
  alertOnSlowDelivery: true, // Whether to alert on slow delivery
  slowDeliveryThresholdMs: 10000, // Threshold for slow delivery alerts (10 seconds)
};

/**
 * Email Content Constants
 * ----------------------
 * Defines constants related to email content, such as maximum lengths,
 * default text, and formatting options.
 */
export const EMAIL_CONTENT_CONSTANTS = {
  maxSubjectLength: 100, // Maximum length for email subjects
  defaultSenderName: 'AUSTA SuperApp', // Default sender name
  defaultFooterText: '© AUSTA SuperApp. All rights reserved.', // Default footer text
  unsubscribeText: 'To unsubscribe from these emails, click here', // Unsubscribe text
  maxBodySizeKb: 100, // Maximum size for email body in KB
  supportEmail: 'support@austa-superapp.com', // Support email address
  defaultCharset: 'utf-8', // Default character set
  defaultContentType: 'text/html', // Default content type
};

/**
 * Email Template Types
 * -------------------
 * Defines the types of email templates available in the system.
 * Used for template selection and validation.
 */
export const EMAIL_TEMPLATE_TYPES = {
  // Notification templates
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  REMINDER: 'reminder',
  
  // Journey-specific templates
  HEALTH_REPORT: 'health-report',
  CARE_APPOINTMENT: 'care-appointment',
  PLAN_CLAIM_STATUS: 'plan-claim-status',
  
  // Gamification templates
  ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
  LEVEL_UP: 'level-up',
  QUEST_COMPLETED: 'quest-completed',
  
  // System templates
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
};