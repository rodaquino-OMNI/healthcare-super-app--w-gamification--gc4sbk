import { NotificationTemplate, NotificationType, NotificationChannel } from '@austa/interfaces/notification';
import { IRetryOptions } from '../../retry/interfaces/retry-options.interface';

/**
 * Enum representing the different types of errors that can occur during email delivery.
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
  /** SMTP server rejected the email */
  DELIVERY_REJECTED = 'DELIVERY_REJECTED',
  /** SMTP server timeout */
  TIMEOUT = 'TIMEOUT',
  /** Rate limit exceeded */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Unknown or unexpected error */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface for email-specific retry options that extends the base retry options.
 * Provides configuration for email delivery retry behavior.
 */
export interface EmailRetryOptions extends IRetryOptions {
  /** Maximum number of retries for specific email error types */
  maxRetriesByErrorType?: Partial<Record<EmailErrorTypes, number>>;
  /** Whether to attempt delivery through alternative channels on failure */
  fallbackToAlternativeChannels?: boolean;
  /** Priority order of alternative channels to try */
  alternativeChannelPriority?: NotificationChannel[];
}

/**
 * Interface representing the result of an email delivery attempt.
 * Used for tracking delivery status and handling retries.
 */
export interface EmailDeliveryResult {
  /** Whether the delivery was successful */
  success: boolean;
  /** The message ID if delivery was successful */
  messageId?: string;
  /** Timestamp when the delivery was attempted */
  timestamp: Date;
  /** Error information if delivery failed */
  error?: {
    /** Type of error that occurred */
    type: EmailErrorTypes;
    /** Error message */
    message: string;
    /** Original error object */
    originalError?: Error;
    /** Whether this error is considered transient and can be retried */
    isTransient: boolean;
  };
  /** Delivery attempt metadata */
  metadata?: {
    /** Time taken for delivery attempt in milliseconds */
    deliveryTimeMs?: number;
    /** SMTP server response */
    smtpResponse?: string;
    /** IP address of SMTP server */
    serverIp?: string;
    /** Whether TLS was used */
    tlsUsed?: boolean;
  };
}

/**
 * Interface for journey-specific email styling options.
 * Allows customization of email appearance based on journey context.
 */
export interface JourneyEmailStyling {
  /** Primary color for the email */
  primaryColor: string;
  /** Secondary color for the email */
  secondaryColor: string;
  /** Background color for the email */
  backgroundColor: string;
  /** Text color for the email */
  textColor: string;
  /** Header image URL */
  headerImageUrl?: string;
  /** Footer content */
  footerContent?: string;
  /** Custom CSS styles */
  customCss?: string;
}

/**
 * Map of journey types to their specific email styling options.
 */
export interface JourneyEmailStylingMap {
  /** Health journey styling */
  health: JourneyEmailStyling;
  /** Care journey styling */
  care: JourneyEmailStyling;
  /** Plan journey styling */
  plan: JourneyEmailStyling;
  /** Default styling for non-journey specific emails */
  default: JourneyEmailStyling;
}

/**
 * Interface for email templates that integrates with @austa/interfaces.
 * Provides type-safe template handling for email notifications.
 */
export interface EmailTemplate extends NotificationTemplate {
  /** The channel this template is for */
  channel: NotificationChannel.EMAIL;
  /** HTML content of the email with placeholders */
  htmlContent: string;
  /** Plain text fallback content with placeholders */
  textContent: string;
  /** Subject line with optional placeholders */
  subject: string;
  /** Styling options based on journey context */
  styling?: Partial<JourneyEmailStylingMap>;
  /** Whether to track email opens */
  trackOpens?: boolean;
  /** Whether to track link clicks */
  trackClicks?: boolean;
  /** List of attachments to include */
  attachments?: EmailAttachment[];
  /** Email-specific metadata */
  metadata?: {
    /** Sender name to display */
    senderName?: string;
    /** Reply-to address */
    replyTo?: string;
    /** CC recipients */
    cc?: string[];
    /** BCC recipients */
    bcc?: string[];
    /** Email priority */
    priority?: 'high' | 'normal' | 'low';
  };
}

/**
 * Interface for email attachments.
 */
export interface EmailAttachment {
  /** Filename of the attachment */
  filename: string;
  /** Content of the attachment */
  content: Buffer | string;
  /** MIME type of the attachment */
  contentType: string;
  /** Content ID for inline attachments */
  cid?: string;
}

/**
 * Interface for email options used when sending emails.
 * Configures delivery attempts and tracking.
 */
export interface EmailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject */
  subject: string;
  /** HTML content of the email */
  html: string;
  /** Plain text fallback content */
  text?: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
  /** Reply-to address */
  replyTo?: string;
  /** Sender name to display */
  from?: string;
  /** List of attachments */
  attachments?: EmailAttachment[];
  /** Whether to track email opens */
  trackOpens?: boolean;
  /** Whether to track link clicks */
  trackClicks?: boolean;
  /** Retry options for this specific email */
  retryOptions?: EmailRetryOptions;
  /** Associated notification type */
  notificationType?: NotificationType;
  /** Journey context for the email */
  journeyContext?: 'health' | 'care' | 'plan';
  /** Unique identifier for tracking this email */
  trackingId?: string;
}