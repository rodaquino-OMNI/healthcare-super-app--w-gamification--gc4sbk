import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDate,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus, DeliveryErrorCategory } from '../../interfaces/delivery-tracking.interface';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';
import { NotificationChannel } from '../entities/notification.entity';

/**
 * DTO for a single delivery attempt of a notification
 * 
 * Captures detailed information about each individual attempt to deliver
 * a notification, including timestamps, error details, and provider-specific
 * response information.
 */
export class DeliveryAttemptDto {
  /**
   * Unique identifier for this delivery attempt
   */
  @ApiProperty({
    description: 'Unique identifier for this delivery attempt',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4)
  @IsNotEmpty()
  attemptId: string;

  /**
   * Timestamp when the delivery attempt started
   */
  @ApiProperty({
    description: 'Timestamp when the delivery attempt started',
    example: '2023-04-15T14:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  /**
   * Duration of the delivery attempt in milliseconds
   */
  @ApiPropertyOptional({
    description: 'Duration of the delivery attempt in milliseconds',
    example: 245,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  /**
   * Status of this delivery attempt
   */
  @ApiProperty({
    description: 'Status of this delivery attempt',
    enum: DeliveryStatus,
    example: DeliveryStatus.DELIVERED,
  })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  /**
   * Error message if the delivery attempt failed
   */
  @ApiPropertyOptional({
    description: 'Error message if the delivery attempt failed',
    example: 'Failed to deliver email: recipient address rejected',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  /**
   * Error code from the delivery provider if available
   */
  @ApiPropertyOptional({
    description: 'Error code from the delivery provider if available',
    example: 'INVALID_RECIPIENT',
  })
  @IsOptional()
  @IsString()
  errorCode?: string;

  /**
   * Category of the error for classification and analytics
   */
  @ApiPropertyOptional({
    description: 'Category of the error for classification and analytics',
    enum: DeliveryErrorCategory,
    example: DeliveryErrorCategory.RECIPIENT_ERROR,
  })
  @IsOptional()
  @IsEnum(DeliveryErrorCategory)
  errorCategory?: DeliveryErrorCategory;

  /**
   * Provider-specific response data
   */
  @ApiPropertyOptional({
    description: 'Provider-specific response data',
    example: { messageId: '12345', status: 'delivered', providerReference: 'abc-123' },
  })
  @IsOptional()
  @IsObject()
  providerResponse?: Record<string, any>;

  /**
   * Retry information if this attempt is a retry
   */
  @ApiPropertyOptional({
    description: 'Retry information if this attempt is a retry',
    example: { attemptNumber: 2, delayMs: 5000, policyName: 'exponential-backoff' },
  })
  @IsOptional()
  @IsObject()
  retryInfo?: {
    /**
     * Number of this attempt (1-based)
     */
    attemptNumber: number;
    
    /**
     * Delay before this retry in milliseconds
     */
    delayMs: number;
    
    /**
     * Name of the retry policy used
     */
    policyName: string;
  };
}

/**
 * DTO for channel-specific delivery status
 * 
 * Captures the delivery status for a specific channel, including
 * provider-specific status codes and messages.
 */
export class ChannelStatusDto {
  /**
   * Provider-specific status code
   */
  @ApiPropertyOptional({
    description: 'Provider-specific status code',
    example: 'DELIVERED',
  })
  @IsOptional()
  @IsString()
  providerStatusCode?: string;

  /**
   * Provider-specific status message
   */
  @ApiPropertyOptional({
    description: 'Provider-specific status message',
    example: 'Message delivered to recipient',
  })
  @IsOptional()
  @IsString()
  providerStatusMessage?: string;

  /**
   * Additional channel-specific status details
   */
  @ApiPropertyOptional({
    description: 'Additional channel-specific status details',
    example: { deviceType: 'iOS', appVersion: '2.1.0' },
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}

/**
 * DTO for the current delivery status of a notification
 * 
 * Provides a snapshot of the current delivery state, including status,
 * timestamps, retry information, and channel-specific details.
 */
export class DeliveryStatusDto {
  /**
   * Current status of the notification delivery
   */
  @ApiProperty({
    description: 'Current status of the notification delivery',
    enum: DeliveryStatus,
    example: DeliveryStatus.DELIVERED,
  })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  /**
   * Timestamp when the status was last updated
   */
  @ApiProperty({
    description: 'Timestamp when the status was last updated',
    example: '2023-04-15T14:32:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  /**
   * Timestamp when the notification was successfully delivered (if applicable)
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the notification was successfully delivered (if applicable)',
    example: '2023-04-15T14:32:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveredAt?: Date;

  /**
   * Timestamp when the notification was read by the recipient (if applicable and tracked)
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the notification was read by the recipient (if applicable and tracked)',
    example: '2023-04-15T14:35:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readAt?: Date;

  /**
   * Number of delivery attempts made so far
   */
  @ApiProperty({
    description: 'Number of delivery attempts made so far',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  attemptCount: number;

  /**
   * Maximum number of delivery attempts allowed
   */
  @ApiProperty({
    description: 'Maximum number of delivery attempts allowed',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  maxAttempts: number;

  /**
   * Timestamp when the next retry is scheduled (if applicable)
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the next retry is scheduled (if applicable)',
    example: '2023-04-15T14:40:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextRetryAt?: Date;

  /**
   * Status of the retry process
   */
  @ApiProperty({
    description: 'Status of the retry process',
    enum: RetryStatus,
    example: RetryStatus.SUCCEEDED,
  })
  @IsEnum(RetryStatus)
  retryStatus: RetryStatus;

  /**
   * Reason for the current status (especially for failures)
   */
  @ApiPropertyOptional({
    description: 'Reason for the current status (especially for failures)',
    example: 'Recipient mailbox is full',
  })
  @IsOptional()
  @IsString()
  statusReason?: string;

  /**
   * Channel-specific delivery status information
   */
  @ApiPropertyOptional({
    description: 'Channel-specific delivery status information',
    type: ChannelStatusDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelStatusDto)
  channelStatus?: ChannelStatusDto;
}

/**
 * DTO for notification delivery status across all channels
 * 
 * This DTO captures the complete delivery status of a notification across
 * all channels, including all attempts, current status, and metadata.
 * It provides comprehensive tracking of the notification delivery lifecycle
 * and supports monitoring, troubleshooting, and analytics requirements.
 */
export class NotificationDeliveryStatusDto {
  /**
   * Unique identifier for the notification
   */
  @ApiProperty({
    description: 'Unique identifier for the notification',
    example: 12345,
  })
  @IsNumber()
  @IsNotEmpty()
  notificationId: number;

  /**
   * Unique transaction ID for cross-service correlation
   */
  @ApiProperty({
    description: 'Unique transaction ID for cross-service correlation',
    example: 'notif-550e8400-e29b-41d4-a716-446655440000-1681567800000',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  /**
   * ID of the user who will receive this notification
   */
  @ApiProperty({
    description: 'ID of the user who will receive this notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Delivery channel
   */
  @ApiProperty({
    description: 'Delivery channel',
    enum: NotificationChannel,
    example: NotificationChannel.PUSH,
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  /**
   * Current delivery status
   */
  @ApiProperty({
    description: 'Current delivery status',
    type: DeliveryStatusDto,
  })
  @ValidateNested()
  @Type(() => DeliveryStatusDto)
  currentStatus: DeliveryStatusDto;

  /**
   * History of all delivery attempts
   */
  @ApiProperty({
    description: 'History of all delivery attempts',
    type: [DeliveryAttemptDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryAttemptDto)
  attempts: DeliveryAttemptDto[];

  /**
   * Timestamp when the notification was created
   */
  @ApiProperty({
    description: 'Timestamp when the notification was created',
    example: '2023-04-15T14:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  /**
   * Timestamp when the notification expires and should no longer be delivered
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the notification expires and should no longer be delivered',
    example: '2023-04-16T14:30:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  /**
   * Priority of the notification (higher priority may affect retry behavior)
   */
  @ApiPropertyOptional({
    description: 'Priority of the notification',
    enum: ['low', 'normal', 'high', 'critical'],
    example: 'high',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'critical'])
  priority?: 'low' | 'normal' | 'high' | 'critical';

  /**
   * Journey context for the notification (e.g., 'health', 'care', 'plan', 'game')
   */
  @ApiPropertyOptional({
    description: 'Journey context for the notification',
    example: 'health',
  })
  @IsOptional()
  @IsString()
  journeyContext?: string;

  /**
   * Flag indicating if this notification has been moved to the dead letter queue
   */
  @ApiProperty({
    description: 'Flag indicating if this notification has been moved to the dead letter queue',
    example: false,
  })
  @IsBoolean()
  inDeadLetterQueue: boolean;

  /**
   * Timestamp when the notification was moved to the dead letter queue (if applicable)
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the notification was moved to the dead letter queue (if applicable)',
    example: '2023-04-15T15:30:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deadLetterQueuedAt?: Date;

  /**
   * Reason for moving to the dead letter queue (if applicable)
   */
  @ApiPropertyOptional({
    description: 'Reason for moving to the dead letter queue (if applicable)',
    example: 'Maximum retry attempts exceeded',
  })
  @IsOptional()
  @IsString()
  deadLetterReason?: string;

  /**
   * Fallback channels that were attempted if the primary channel failed
   */
  @ApiPropertyOptional({
    description: 'Fallback channels that were attempted if the primary channel failed',
    type: [String],
    enum: NotificationChannel,
    example: [NotificationChannel.EMAIL, NotificationChannel.SMS],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  fallbackChannelsAttempted?: NotificationChannel[];

  /**
   * Metadata for the notification delivery
   */
  @ApiPropertyOptional({
    description: 'Metadata for the notification delivery',
    example: { deviceId: 'iPhone12-ABCD', appVersion: '2.1.0', campaign: 'health-reminders' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  /**
   * Total delivery time in milliseconds (from creation to final status)
   * Used for SLA monitoring and performance tracking
   */
  @ApiPropertyOptional({
    description: 'Total delivery time in milliseconds (from creation to final status)',
    example: 2500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDeliveryTimeMs?: number;

  /**
   * Time to first attempt in milliseconds (from creation to first attempt)
   * Used for SLA monitoring and performance tracking
   */
  @ApiPropertyOptional({
    description: 'Time to first attempt in milliseconds (from creation to first attempt)',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeToFirstAttemptMs?: number;

  /**
   * SLA compliance status
   * Indicates whether the notification was delivered within the required SLA timeframe
   */
  @ApiPropertyOptional({
    description: 'SLA compliance status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  withinSla?: boolean;

  /**
   * SLA target in milliseconds
   * The target delivery time for this notification based on its priority and type
   */
  @ApiPropertyOptional({
    description: 'SLA target in milliseconds',
    example: 30000, // 30 seconds
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  slaTargetMs?: number;
}

/**
 * DTO for updating the delivery status of a notification
 * 
 * Used when updating the delivery status of a notification, either from
 * internal processes or from external delivery providers that support
 * delivery receipts or webhooks.
 */
export class UpdateDeliveryStatusDto {
  /**
   * New status to set
   */
  @ApiProperty({
    description: 'New status to set',
    enum: DeliveryStatus,
    example: DeliveryStatus.DELIVERED,
  })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  /**
   * Reason for the status update
   */
  @ApiPropertyOptional({
    description: 'Reason for the status update',
    example: 'Delivery confirmed by provider webhook',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * Provider-specific status details
   */
  @ApiPropertyOptional({
    description: 'Provider-specific status details',
    example: { messageId: '12345', deliveryTime: '2023-04-15T14:32:00.000Z' },
  })
  @IsOptional()
  @IsObject()
  providerDetails?: Record<string, any>;

  /**
   * Timestamp when the status change occurred
   */
  @ApiProperty({
    description: 'Timestamp when the status change occurred',
    example: '2023-04-15T14:32:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  /**
   * Information about the delivery attempt that triggered this update
   */
  @ApiPropertyOptional({
    description: 'Information about the delivery attempt that triggered this update',
    type: DeliveryAttemptDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAttemptDto)
  attemptInfo?: Partial<DeliveryAttemptDto>;
}

/**
 * DTO for delivery metrics used in reporting and analytics
 * 
 * Captures metrics about notification delivery performance for monitoring,
 * reporting, and improving the notification delivery system.
 */
export class DeliveryMetricsDto {
  /**
   * Unique identifier for the notification
   */
  @ApiProperty({
    description: 'Unique identifier for the notification',
    example: 12345,
  })
  @IsNumber()
  @IsNotEmpty()
  notificationId: number;

  /**
   * Delivery channel
   */
  @ApiProperty({
    description: 'Delivery channel',
    enum: NotificationChannel,
    example: NotificationChannel.PUSH,
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  /**
   * Total time from creation to final delivery status (success or permanent failure)
   */
  @ApiProperty({
    description: 'Total time from creation to final delivery status in milliseconds',
    example: 2500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalDeliveryTimeMs: number;

  /**
   * Time from creation to first delivery attempt
   */
  @ApiProperty({
    description: 'Time from creation to first delivery attempt in milliseconds',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  timeToFirstAttemptMs: number;

  /**
   * Number of delivery attempts made
   */
  @ApiProperty({
    description: 'Number of delivery attempts made',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  attemptCount: number;

  /**
   * Final delivery status
   */
  @ApiProperty({
    description: 'Final delivery status',
    enum: DeliveryStatus,
    example: DeliveryStatus.DELIVERED,
  })
  @IsEnum(DeliveryStatus)
  finalStatus: DeliveryStatus;

  /**
   * Whether fallback channels were used
   */
  @ApiProperty({
    description: 'Whether fallback channels were used',
    example: false,
  })
  @IsBoolean()
  usedFallbackChannels: boolean;

  /**
   * Journey context for the notification
   */
  @ApiPropertyOptional({
    description: 'Journey context for the notification',
    example: 'health',
  })
  @IsOptional()
  @IsString()
  journeyContext?: string;

  /**
   * Notification type
   */
  @ApiProperty({
    description: 'Notification type',
    example: 'appointment_reminder',
  })
  @IsString()
  @IsNotEmpty()
  notificationType: string;

  /**
   * Notification priority
   */
  @ApiPropertyOptional({
    description: 'Notification priority',
    enum: ['low', 'normal', 'high', 'critical'],
    example: 'high',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'critical'])
  priority?: 'low' | 'normal' | 'high' | 'critical';

  /**
   * Error category if delivery failed
   */
  @ApiPropertyOptional({
    description: 'Error category if delivery failed',
    enum: DeliveryErrorCategory,
    example: DeliveryErrorCategory.RECIPIENT_ERROR,
  })
  @IsOptional()
  @IsEnum(DeliveryErrorCategory)
  errorCategory?: DeliveryErrorCategory;

  /**
   * Timestamp when metrics were collected
   */
  @ApiProperty({
    description: 'Timestamp when metrics were collected',
    example: '2023-04-15T14:35:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  collectedAt: Date;

  /**
   * Channel-specific metrics
   */
  @ApiPropertyOptional({
    description: 'Channel-specific metrics',
    example: { deliveryRate: 0.98, openRate: 0.75 },
  })
  @IsOptional()
  @IsObject()
  channelMetrics?: Record<string, any>;

  /**
   * SLA compliance status
   * Indicates whether the notification was delivered within the required SLA timeframe
   */
  @ApiPropertyOptional({
    description: 'SLA compliance status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  withinSla?: boolean;

  /**
   * SLA target in milliseconds
   * The target delivery time for this notification based on its priority and type
   */
  @ApiPropertyOptional({
    description: 'SLA target in milliseconds',
    example: 30000, // 30 seconds
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  slaTargetMs?: number;
}