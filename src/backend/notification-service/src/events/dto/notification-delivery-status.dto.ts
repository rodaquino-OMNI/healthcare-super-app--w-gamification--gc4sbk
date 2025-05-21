import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsEnum, IsNumber, IsDate, Min, Max, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';
import { ErrorType } from '../../retry/constants/error-types.constants';
import { RetryPolicyType } from '../../retry/constants/policy-types.constants';

/**
 * Data transfer object for structured error information in notification delivery status events.
 * This provides detailed information about errors that occurred during notification delivery.
 */
export class DeliveryErrorDto {
  /**
   * The error message describing what went wrong
   */
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * Error code for programmatic error handling
   * Can be used for client-side error handling and localization
   */
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * The type of error for retry classification
   */
  @IsEnum(ErrorType)
  @IsNotEmpty()
  type: ErrorType;

  /**
   * HTTP status code if the error occurred during an HTTP request
   */
  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(599)
  statusCode?: number;

  /**
   * Timestamp when the error occurred
   */
  @IsDate()
  @IsOptional()
  timestamp?: Date;

  /**
   * Additional context about the error
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  /**
   * Whether this error is considered retryable
   */
  @IsBoolean()
  @IsOptional()
  isRetryable?: boolean;
}

/**
 * Data transfer object for channel-specific delivery status information.
 * Each notification channel (email, SMS, push, in-app) has its own status tracking.
 */
export class ChannelDeliveryStatusDto {
  /**
   * The status of delivery for this channel
   */
  @IsEnum(RetryStatus)
  @IsNotEmpty()
  status: RetryStatus;

  /**
   * Provider-specific status code (if available)
   */
  @IsString()
  @IsOptional()
  providerStatusCode?: string;

  /**
   * Provider-specific status message (if available)
   */
  @IsString()
  @IsOptional()
  providerStatusMessage?: string;

  /**
   * Timestamp when the notification was sent to the provider
   */
  @IsDate()
  @IsOptional()
  sentAt?: Date;

  /**
   * Timestamp when the notification was delivered to the recipient
   */
  @IsDate()
  @IsOptional()
  deliveredAt?: Date;

  /**
   * Timestamp when the notification was opened/read by the recipient
   */
  @IsDate()
  @IsOptional()
  readAt?: Date;

  /**
   * Number of retry attempts made for this channel
   */
  @IsNumber()
  @IsOptional()
  @Min(0)
  retryCount?: number;

  /**
   * Maximum number of retry attempts allowed for this channel
   */
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxRetries?: number;

  /**
   * The retry policy type used for this channel
   */
  @IsEnum(RetryPolicyType)
  @IsOptional()
  retryPolicyType?: RetryPolicyType;

  /**
   * Timestamp for the next scheduled retry attempt
   */
  @IsDate()
  @IsOptional()
  nextRetryAt?: Date;

  /**
   * Error information if delivery failed
   */
  @ValidateNested()
  @Type(() => DeliveryErrorDto)
  @IsOptional()
  error?: DeliveryErrorDto;

  /**
   * Provider-specific metadata for this delivery
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data transfer object for notification delivery status events.
 * 
 * This DTO enables reliable status tracking, reporting, and dead letter queue processing
 * for notifications across various channels (email, SMS, push, in-app). It provides
 * comprehensive information about the delivery lifecycle of notifications, including
 * retry attempts, error details, and channel-specific status information.
 */
export class NotificationDeliveryStatusDto {
  /**
   * Unique identifier for the notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  notificationId: string;

  /**
   * Unique identifier for the user receiving the notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * Overall status of the notification delivery across all channels
   */
  @IsEnum(RetryStatus)
  @IsNotEmpty()
  status: RetryStatus;

  /**
   * Timestamp when the notification was created
   */
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  /**
   * Timestamp when the notification status was last updated
   */
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  /**
   * Journey context (health, care, plan) for this notification
   */
  @IsString()
  @IsOptional()
  journeyContext?: string;

  /**
   * Email channel delivery status
   */
  @ValidateNested()
  @Type(() => ChannelDeliveryStatusDto)
  @IsOptional()
  email?: ChannelDeliveryStatusDto;

  /**
   * SMS channel delivery status
   */
  @ValidateNested()
  @Type(() => ChannelDeliveryStatusDto)
  @IsOptional()
  sms?: ChannelDeliveryStatusDto;

  /**
   * Push notification channel delivery status
   */
  @ValidateNested()
  @Type(() => ChannelDeliveryStatusDto)
  @IsOptional()
  push?: ChannelDeliveryStatusDto;

  /**
   * In-app notification channel delivery status
   */
  @ValidateNested()
  @Type(() => ChannelDeliveryStatusDto)
  @IsOptional()
  inApp?: ChannelDeliveryStatusDto;

  /**
   * Total number of retry attempts across all channels
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalRetryCount?: number;

  /**
   * Whether this notification has been moved to the dead letter queue
   */
  @IsBoolean()
  @IsOptional()
  isInDeadLetterQueue?: boolean;

  /**
   * Timestamp when the notification was moved to the dead letter queue
   */
  @IsDate()
  @IsOptional()
  deadLetterQueuedAt?: Date;

  /**
   * Reason why the notification was moved to the dead letter queue
   */
  @IsString()
  @IsOptional()
  deadLetterReason?: string;

  /**
   * Additional metadata for this notification delivery
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}