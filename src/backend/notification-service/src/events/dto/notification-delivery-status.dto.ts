import { IsString, IsNotEmpty, IsEnum, IsUUID, IsDate, IsNumber, IsOptional, IsObject, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Import from local interfaces
import { DeliveryStatus, DeliveryErrorCategory } from '../../interfaces/delivery-tracking.interface';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';

// Import from @austa/interfaces for standardized error type definitions
import { IErrorContext } from '@austa/interfaces';

/**
 * DTO for channel-specific delivery status information
 * 
 * This class captures provider-specific status details for a notification
 * delivery attempt on a specific channel.
 */
export class ChannelStatusDto {
  /**
   * Provider-specific status code
   * Examples: "200" for successful email delivery, "DELIVERED" for SMS
   */
  @IsString()
  @IsOptional()
  providerStatusCode?: string;
  
  /**
   * Provider-specific status message
   * Examples: "Message delivered to recipient", "Email bounced"
   */
  @IsString()
  @IsOptional()
  providerStatusMessage?: string;
  
  /**
   * Additional channel-specific status details
   * This can include provider-specific metadata or extended status information
   */
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

/**
 * DTO for retry information associated with a delivery attempt
 * 
 * This class captures information about retry attempts for a notification,
 * including attempt counts and policy information.
 */
export class RetryInfoDto {
  /**
   * Number of this attempt (1-based)
   * First attempt is 1, subsequent retries increment this value
   */
  @IsNumber()
  @Min(1)
  attemptNumber: number;
  
  /**
   * Delay before this retry in milliseconds
   * Used for implementing exponential backoff and other retry strategies
   */
  @IsNumber()
  @Min(0)
  delayMs: number;
  
  /**
   * Name of the retry policy used
   * Examples: "exponential-backoff", "fixed-interval", "progressive"
   */
  @IsString()
  @IsNotEmpty()
  policyName: string;
}

/**
 * DTO for error context information
 * 
 * This class captures detailed error information for failed delivery attempts,
 * including error codes, messages, and contextual information.
 */
export class ErrorContextDto implements IErrorContext {
  /**
   * Error code identifying the specific error
   * Examples: "INVALID_RECIPIENT", "PROVIDER_UNAVAILABLE"
   */
  @IsString()
  @IsNotEmpty()
  code: string;
  
  /**
   * Human-readable error message
   */
  @IsString()
  @IsNotEmpty()
  message: string;
  
  /**
   * Category of the error for classification and analytics
   */
  @IsEnum(DeliveryErrorCategory)
  category: DeliveryErrorCategory;
  
  /**
   * Additional error details for debugging
   * This can include stack traces, request IDs, or other diagnostic information
   */
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
  
  /**
   * Whether this error is retryable
   * Used to determine if the notification should be retried
   */
  @IsBoolean()
  @IsOptional()
  retryable?: boolean;
  
  /**
   * Suggested delay before retry in milliseconds
   * Used for implementing provider-specific retry recommendations
   */
  @IsNumber()
  @IsOptional()
  suggestedRetryDelayMs?: number;
}

/**
 * DTO for a single delivery attempt
 * 
 * This class captures detailed information about a single attempt to deliver
 * a notification, including timestamps, status, and error information.
 */
export class DeliveryAttemptDto {
  /**
   * Unique identifier for this delivery attempt
   */
  @IsUUID(4)
  @IsNotEmpty()
  attemptId: string;
  
  /**
   * Timestamp when the delivery attempt started
   */
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
  
  /**
   * Duration of the delivery attempt in milliseconds
   */
  @IsNumber()
  @IsOptional()
  @Min(0)
  duration?: number;
  
  /**
   * Status of this delivery attempt
   */
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
  
  /**
   * Error message if the delivery attempt failed
   */
  @IsString()
  @IsOptional()
  errorMessage?: string;
  
  /**
   * Error code from the delivery provider if available
   */
  @IsString()
  @IsOptional()
  errorCode?: string;
  
  /**
   * Category of the error for classification and analytics
   */
  @IsEnum(DeliveryErrorCategory)
  @IsOptional()
  errorCategory?: DeliveryErrorCategory;
  
  /**
   * Detailed error context for debugging and analysis
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ErrorContextDto)
  errorContext?: ErrorContextDto;
  
  /**
   * Provider-specific response data
   */
  @IsObject()
  @IsOptional()
  providerResponse?: Record<string, any>;
  
  /**
   * Retry information if this attempt is a retry
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryInfoDto)
  retryInfo?: RetryInfoDto;
}

/**
 * DTO for the current delivery status of a notification
 * 
 * This class provides a snapshot of the current delivery state,
 * including status, timestamps, and retry information.
 */
export class DeliveryStatusDto {
  /**
   * Current status of the notification delivery
   */
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
  
  /**
   * Timestamp when the status was last updated
   */
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
  
  /**
   * Timestamp when the notification was successfully delivered (if applicable)
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deliveredAt?: Date;
  
  /**
   * Timestamp when the notification was read by the recipient (if applicable and tracked)
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  readAt?: Date;
  
  /**
   * Number of delivery attempts made so far
   */
  @IsNumber()
  @Min(0)
  attemptCount: number;
  
  /**
   * Maximum number of delivery attempts allowed
   */
  @IsNumber()
  @Min(1)
  maxAttempts: number;
  
  /**
   * Timestamp when the next retry is scheduled (if applicable)
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  nextRetryAt?: Date;
  
  /**
   * Status of the retry process
   */
  @IsEnum(RetryStatus)
  retryStatus: RetryStatus;
  
  /**
   * Reason for the current status (especially for failures)
   */
  @IsString()
  @IsOptional()
  statusReason?: string;
  
  /**
   * Channel-specific delivery status information
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelStatusDto)
  channelStatus?: ChannelStatusDto;
}

/**
 * DTO for notification delivery status events
 * 
 * This is the main DTO for tracking the lifecycle of notifications across
 * various channels (email, SMS, push, in-app). It enables reliable status
 * tracking, reporting, and dead letter queue processing for failed notifications.
 * 
 * Key features:
 * - Comprehensive status tracking with validated fields
 * - Channel-specific status fields and metadata
 * - Support for structured error information with error codes and retry counts
 * - Integration with @austa/interfaces for consistent error type definitions
 */
export class NotificationDeliveryStatusDto {
  /**
   * Unique identifier for the notification
   */
  @IsString()
  @IsNotEmpty()
  notificationId: string;
  
  /**
   * Unique transaction ID for cross-service correlation
   * 
   * This ID is used to track the notification across different services and
   * enables correlation of logs, metrics, and events related to this notification.
   * It follows the format: `notif-{uuid}-{timestamp}`
   */
  @IsString()
  @IsNotEmpty()
  transactionId: string;
  
  /**
   * ID of the user who will receive this notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;
  
  /**
   * Delivery channel (e.g., 'push', 'email', 'sms', 'in-app')
   */
  @IsString()
  @IsNotEmpty()
  channel: string;
  
  /**
   * Current delivery status
   */
  @ValidateNested()
  @Type(() => DeliveryStatusDto)
  currentStatus: DeliveryStatusDto;
  
  /**
   * Latest delivery attempt
   * This represents the most recent attempt to deliver the notification
   */
  @ValidateNested()
  @Type(() => DeliveryAttemptDto)
  latestAttempt: DeliveryAttemptDto;
  
  /**
   * Timestamp when the notification was created
   */
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
  
  /**
   * Timestamp when the notification expires and should no longer be delivered
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;
  
  /**
   * Priority of the notification (higher priority may affect retry behavior)
   */
  @IsString()
  @IsOptional()
  priority?: 'low' | 'normal' | 'high' | 'critical';
  
  /**
   * Journey context for the notification (e.g., 'health', 'care', 'plan', 'game')
   */
  @IsString()
  @IsOptional()
  journeyContext?: string;
  
  /**
   * Flag indicating if this notification has been moved to the dead letter queue
   */
  @IsBoolean()
  inDeadLetterQueue: boolean;
  
  /**
   * Timestamp when the notification was moved to the dead letter queue (if applicable)
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deadLetterQueuedAt?: Date;
  
  /**
   * Reason for moving to the dead letter queue (if applicable)
   */
  @IsString()
  @IsOptional()
  deadLetterReason?: string;
  
  /**
   * Fallback channels that were attempted if the primary channel failed
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fallbackChannelsAttempted?: string[];
  
  /**
   * Metadata for the notification delivery
   * This can include journey-specific data, device information,
   * or other contextual information relevant to the notification
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for updating the delivery status of a notification
 * 
 * This DTO is used when updating the delivery status of a notification,
 * either from internal processes or from external delivery providers that
 * support delivery receipts or webhooks.
 */
export class UpdateDeliveryStatusDto {
  /**
   * New status to set
   */
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
  
  /**
   * Reason for the status update
   */
  @IsString()
  @IsOptional()
  reason?: string;
  
  /**
   * Provider-specific status details
   */
  @IsObject()
  @IsOptional()
  providerDetails?: Record<string, any>;
  
  /**
   * Timestamp when the status change occurred
   */
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
  
  /**
   * Information about the delivery attempt that triggered this update
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAttemptDto)
  attemptInfo?: Partial<DeliveryAttemptDto>;
}

/**
 * DTO for delivery metrics collected about notification delivery performance
 * 
 * This DTO is used for monitoring, reporting, and improving the notification
 * delivery system. It provides insights into delivery performance, error rates,
 * and patterns across different channels and notification types.
 */
export class DeliveryMetricsDto {
  /**
   * Unique identifier for the notification
   */
  @IsString()
  @IsNotEmpty()
  notificationId: string;
  
  /**
   * Delivery channel
   */
  @IsString()
  @IsNotEmpty()
  channel: string;
  
  /**
   * Total time from creation to final delivery status (success or permanent failure)
   */
  @IsNumber()
  @Min(0)
  totalDeliveryTimeMs: number;
  
  /**
   * Time from creation to first delivery attempt
   */
  @IsNumber()
  @Min(0)
  timeToFirstAttemptMs: number;
  
  /**
   * Number of delivery attempts made
   */
  @IsNumber()
  @Min(1)
  attemptCount: number;
  
  /**
   * Final delivery status
   */
  @IsEnum(DeliveryStatus)
  finalStatus: DeliveryStatus;
  
  /**
   * Whether fallback channels were used
   */
  @IsBoolean()
  usedFallbackChannels: boolean;
  
  /**
   * Journey context for the notification
   */
  @IsString()
  @IsOptional()
  journeyContext?: string;
  
  /**
   * Notification type
   */
  @IsString()
  @IsNotEmpty()
  notificationType: string;
  
  /**
   * Notification priority
   */
  @IsString()
  @IsOptional()
  priority?: 'low' | 'normal' | 'high' | 'critical';
  
  /**
   * Error category if delivery failed
   */
  @IsEnum(DeliveryErrorCategory)
  @IsOptional()
  errorCategory?: DeliveryErrorCategory;
  
  /**
   * Timestamp when metrics were collected
   */
  @IsDate()
  @Type(() => Date)
  collectedAt: Date;
  
  /**
   * Channel-specific metrics
   */
  @IsObject()
  @IsOptional()
  channelMetrics?: Record<string, any>;
}