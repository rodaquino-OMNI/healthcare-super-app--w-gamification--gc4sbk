import { NotificationTemplate, NotificationType, NotificationChannel } from '@austa/interfaces/notification';
import { IRetryOptions } from '../../retry/interfaces/retry-options.interface';

/**
 * Enum representing the possible error types that can occur during email delivery.
 * Used for detailed error classification and appropriate retry strategies.
 */
export enum EmailErrorTypes {
  /** Connection to SMTP server failed */
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  /** Authentication with SMTP server failed */
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  /** Email address format is invalid */
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  /** Email content is invalid or malformed */
  INVALID_CONTENT = 'INVALID_CONTENT',
  /** Email size exceeds limits */
  SIZE_LIMIT_EXCEEDED = 'SIZE_LIMIT_EXCEEDED',
  /** Rate limit reached for sending emails */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  /** Recipient's mailbox is full */
  MAILBOX_FULL = 'MAILBOX_FULL',
  /** Recipient's email address doesn't exist */
  RECIPIENT_NOT_FOUND = 'RECIPIENT_NOT_FOUND',
  /** Email was rejected by recipient server */
  REJECTED = 'REJECTED',
  /** Temporary server error */
  TEMPORARY_ERROR = 'TEMPORARY_ERROR',
  /** Unknown or unclassified error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for email-specific retry options.
 * Extends the base retry options with email-specific configurations.
 */
export interface EmailRetryOptions extends IRetryOptions {
  /** Maximum number of retry attempts for email delivery */
  maxRetries: number;
  /** Initial delay between retry attempts in milliseconds */
  initialDelay: number;
  /** Maximum delay between retry attempts in milliseconds */
  maxDelay?: number;
  /** Factor by which to increase delay between retries (for exponential backoff) */
  backoffFactor?: number;
  /** Whether to add random jitter to retry delays to prevent thundering herd */
  jitter?: boolean;
  /** Error types that should trigger a retry attempt */
  retryableErrors?: EmailErrorTypes[];
  /** Error types that should not trigger a retry attempt */
  nonRetryableErrors?: EmailErrorTypes[];
}

/**
 * Interface representing the result of an email delivery attempt.
 * Used for tracking delivery status and handling retries.
 */
export interface EmailDeliveryResult {
  /** Whether the email was successfully delivered */
  success: boolean;
  /** The message ID if delivery was successful */
  messageId?: string;
  /** Timestamp when the delivery attempt was made */
  timestamp: Date;
  /** Error information if delivery failed */
  error?: {
    /** The type of error that occurred */
    type: EmailErrorTypes;
    /** Error message */
    message: string;
    /** Original error object */
    originalError?: Error;
    /** Whether this error is considered retryable */
    isRetryable: boolean;
  };
  /** Retry information */
  retry?: {
    /** Number of retry attempts made so far */
    attemptCount: number;
    /** Whether more retries will be attempted */
    willRetry: boolean;
    /** When the next retry will be attempted */
    nextRetryAt?: Date;
  };
  /** Delivery metrics for observability */
  metrics?: {
    /** Time taken to connect to SMTP server in milliseconds */
    connectionTime?: number;
    /** Time taken to send the email in milliseconds */
    deliveryTime?: number;
    /** Total size of the email in bytes */
    messageSize?: number;
  };
}

/**
 * Interface for email template configuration.
 * Integrates with the NotificationTemplate from @austa/interfaces.
 */
export interface EmailTemplate extends NotificationTemplate {
  /** The email subject line */
  subject: string;
  /** The HTML content of the email */
  htmlContent: string;
  /** Optional plain text version of the email */
  textContent?: string;
  /** Email-specific template configuration */
  emailConfig?: {
    /** From address to use for this template */
    from?: string;
    /** Reply-to address for this template */
    replyTo?: string;
    /** CC recipients for this template */
    cc?: string[];
    /** BCC recipients for this template */
    bcc?: string[];
    /** Email attachments configuration */
    attachments?: EmailAttachment[];
    /** Custom headers for the email */
    headers?: Record<string, string>;
  };
  /** Styling configuration for the email */
  styling: EmailStyling;
}

/**
 * Interface for email attachment configuration.
 */
export interface EmailAttachment {
  /** Filename of the attachment */
  filename: string;
  /** Content of the attachment (can be Buffer, Stream, or path to file) */
  content?: Buffer | NodeJS.ReadableStream | string;
  /** Path to the attachment file (alternative to content) */
  path?: string;
  /** Content type of the attachment */
  contentType?: string;
  /** Content disposition of the attachment */
  contentDisposition?: 'attachment' | 'inline';
  /** Content ID for inline attachments */
  cid?: string;
  /** Encoding of the attachment */
  encoding?: string;
}

/**
 * Interface for email styling configuration.
 * Supports journey-specific styling for consistent branding.
 */
export interface EmailStyling {
  /** Base styling for all emails */
  base: {
    /** Font family for the email */
    fontFamily: string;
    /** Base font size in pixels */
    fontSize: number;
    /** Text color (hex or rgba) */
    textColor: string;
    /** Background color (hex or rgba) */
    backgroundColor: string;
    /** Width of the email content in pixels */
    contentWidth: number;
    /** Padding around the email content in pixels */
    contentPadding: number;
  };
  /** Header styling */
  header?: {
    /** Background color for the header */
    backgroundColor: string;
    /** Logo URL */
    logoUrl: string;
    /** Logo width in pixels */
    logoWidth: number;
    /** Logo height in pixels */
    logoHeight: number;
    /** Padding around the header in pixels */
    padding: number;
  };
  /** Footer styling */
  footer?: {
    /** Background color for the footer */
    backgroundColor: string;
    /** Text color for the footer */
    textColor: string;
    /** Font size for the footer in pixels */
    fontSize: number;
    /** Padding around the footer in pixels */
    padding: number;
  };
  /** Button styling */
  button?: {
    /** Background color for buttons */
    backgroundColor: string;
    /** Text color for buttons */
    textColor: string;
    /** Border radius for buttons in pixels */
    borderRadius: number;
    /** Padding inside buttons in pixels */
    padding: string;
    /** Font weight for button text */
    fontWeight: string;
  };
  /** Journey-specific styling overrides */
  journeyOverrides?: {
    /** Health journey styling */
    health?: Partial<JourneyEmailStyling>;
    /** Care journey styling */
    care?: Partial<JourneyEmailStyling>;
    /** Plan journey styling */
    plan?: Partial<JourneyEmailStyling>;
  };
}

/**
 * Interface for journey-specific email styling.
 * Allows each journey to have its own branding in emails.
 */
export interface JourneyEmailStyling {
  /** Primary color for the journey */
  primaryColor: string;
  /** Secondary color for the journey */
  secondaryColor: string;
  /** Accent color for the journey */
  accentColor: string;
  /** Background color for the journey */
  backgroundColor: string;
  /** Header background color for the journey */
  headerBackgroundColor: string;
  /** Footer background color for the journey */
  footerBackgroundColor: string;
  /** Button background color for the journey */
  buttonBackgroundColor: string;
  /** Button text color for the journey */
  buttonTextColor: string;
}

/**
 * Interface for email options used when sending an email.
 * Configures delivery attempts and retry behavior.
 */
export interface EmailOptions {
  /** Email recipient address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML content of the email */
  html: string;
  /** Optional plain text version of the email */
  text?: string;
  /** From address (overrides default) */
  from?: string;
  /** Reply-to address */
  replyTo?: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
  /** Email attachments */
  attachments?: EmailAttachment[];
  /** Custom headers */
  headers?: Record<string, string>;
  /** Priority of the email */
  priority?: 'high' | 'normal' | 'low';
  /** Retry options for this specific email */
  retryOptions?: EmailRetryOptions;
  /** Related notification type */
  notificationType?: NotificationType;
  /** Notification channel (should be EMAIL for this service) */
  notificationChannel: NotificationChannel.EMAIL;
  /** User ID of the recipient */
  userId: string;
  /** Journey context for the email */
  journeyContext?: 'health' | 'care' | 'plan';
  /** Tracking parameters for analytics */
  tracking?: {
    /** Campaign ID */
    campaignId?: string;
    /** Source of the notification */
    source?: string;
    /** Custom tracking parameters */
    customParams?: Record<string, string>;
  };
}