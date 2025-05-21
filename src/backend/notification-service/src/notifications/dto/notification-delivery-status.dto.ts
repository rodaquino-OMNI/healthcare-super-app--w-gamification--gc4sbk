import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsObject, 
  IsEnum, 
  IsBoolean, 
  IsArray, 
  ValidateNested, 
  IsNumber,
  Min,
  IsDate,
  IsUUID,
  ArrayMinSize
} from 'class-validator'; // class-validator v0.14.0
import { Type } from 'class-transformer'; // class-transformer v0.5.1

// Import from @austa/interfaces for standardized payload schemas
import { NotificationType } from '@austa/interfaces/notification';

/**
 * Enum representing the delivery channel for a notification
 */
export enum DeliveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in-app'
}

/**
 * Enum representing the current status of a notification delivery
 */
export enum DeliveryStatusType {
  PENDING = 'pending',      // Initial state, not yet attempted
  PROCESSING = 'processing', // Currently being processed
  SENT = 'sent',           // Successfully sent to the delivery provider
  DELIVERED = 'delivered',  // Confirmed delivered to the recipient
  FAILED = 'failed',        // Failed to deliver
  RETRYING = 'retrying',    // Failed but will be retried
  DROPPED = 'dropped',      // Permanently failed, will not be retried
  QUEUED_DLQ = 'queued_dlq' // Moved to dead letter queue for manual processing
}

/**
 * DTO for tracking a single delivery attempt
 */
export class DeliveryAttemptDto {
  /**
   * Unique identifier for this delivery attempt
   */
  @IsUUID(4)
  @IsNotEmpty()
  attemptId: string;
  
  /**
   * Timestamp when this attempt was initiated
   */
  @IsDate()
  @IsNotEmpty()
  timestamp: Date;
  
  /**
   * Current status of this attempt
   */
  @IsEnum(DeliveryStatusType)
  @IsNotEmpty()
  status: DeliveryStatusType;
  
  /**
   * The channel used for this attempt
   */
  @IsEnum(DeliveryChannel)
  @IsNotEmpty()
  channel: DeliveryChannel;
  
  /**
   * Provider-specific response code (if available)
   */
  @IsString()
  @IsOptional()
  providerResponseCode?: string;
  
  /**
   * Provider-specific response message (if available)
   */
  @IsString()
  @IsOptional()
  providerResponseMessage?: string;
  
  /**
   * Error information if the attempt failed
   */
  @IsObject()
  @IsOptional()
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  
  /**
   * Retry information if this is a retry attempt
   */
  @IsObject()
  @IsOptional()
  retry?: {
    /**
     * Number of this attempt (1-based)
     */
    attemptNumber: number;
    
    /**
     * Delay before this retry in milliseconds
     */
    delayMs: number;
    
    /**
     * Strategy used for this retry (e.g., 'exponential', 'linear', 'fixed')
     */
    strategy: string;
  };
}

/**
 * DTO for tracking channel-specific delivery status
 */
export class ChannelStatusDto {
  /**
   * Current status of delivery for this channel
   */
  @IsEnum(DeliveryStatusType)
  @IsNotEmpty()
  status: DeliveryStatusType;
  
  /**
   * Timestamp of the last delivery attempt for this channel
   */
  @IsDate()
  @IsOptional()
  lastAttemptAt?: Date;
  
  /**
   * Number of delivery attempts made for this channel
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  attemptCount: number;
}

/**
 * DTO for dead letter queue information
 */
export class DlqInfoDto {
  /**
   * Timestamp when the notification was moved to DLQ
   */
  @IsDate()
  @IsNotEmpty()
  queuedAt: Date;
  
  /**
   * Reason for moving to DLQ
   */
  @IsString()
  @IsNotEmpty()
  reason: string;
  
  /**
   * Queue name where the notification was moved
   */
  @IsString()
  @IsNotEmpty()
  queueName: string;
}

/**
 * DTO for retry policy configuration
 */
export class RetryPolicyDto {
  /**
   * Maximum number of retry attempts
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  maxRetries: number;
  
  /**
   * Base delay between retries in milliseconds
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  baseDelayMs: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  maxDelayMs: number;
  
  /**
   * Retry strategy (e.g., 'exponential', 'linear', 'fixed')
   */
  @IsString()
  @IsNotEmpty()
  strategy: string;
  
  /**
   * Factor for exponential backoff (if using exponential strategy)
   */
  @IsNumber()
  @IsOptional()
  backoffFactor?: number;
}

/**
 * DTO for tracking the current delivery status of a notification
 */
export class DeliveryStatusDto {
  /**
   * Current overall status of the notification delivery
   */
  @IsEnum(DeliveryStatusType)
  @IsNotEmpty()
  status: DeliveryStatusType;
  
  /**
   * Timestamp when the notification was created
   */
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
  
  /**
   * Timestamp when the notification was last updated
   */
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
  
  /**
   * Timestamp when the notification was successfully delivered (if applicable)
   */
  @IsDate()
  @IsOptional()
  deliveredAt?: Date;
  
  /**
   * Timestamp when the notification was marked as failed (if applicable)
   */
  @IsDate()
  @IsOptional()
  failedAt?: Date;
  
  /**
   * Number of delivery attempts made so far
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  attemptCount: number;
  
  /**
   * Maximum number of attempts allowed before giving up
   */
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  maxAttempts: number;
  
  /**
   * Channel-specific delivery statuses
   */
  @IsObject()
  @ValidateNested()
  @Type(() => ChannelStatusDto)
  channelStatus: {
    [channel in DeliveryChannel]?: ChannelStatusDto;
  };
  
  /**
   * Dead letter queue information if the notification was moved to DLQ
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DlqInfoDto)
  dlq?: DlqInfoDto;
}

/**
 * Data transfer object for notification delivery status.
 * 
 * This DTO defines the data structure for tracking notification delivery status
 * across multiple channels (in-app, push, email, SMS) throughout the delivery lifecycle.
 * It captures channel-specific delivery attempts, success or failure reasons, timestamps,
 * and provider-specific response details, enabling comprehensive monitoring and
 * troubleshooting of notification delivery.
 */
export class NotificationDeliveryStatusDto {
  /**
   * Unique identifier for the notification
   */
  @IsNumber()
  @IsNotEmpty()
  notificationId: number;
  
  /**
   * Transaction ID for cross-service correlation
   * Used to track the notification across different services and systems
   */
  @IsUUID(4)
  @IsNotEmpty()
  transactionId: string;
  
  /**
   * ID of the user who will receive this notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;
  
  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   */
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;
  
  /**
   * Journey context for this notification (health, care, plan, game)
   * Used to apply journey-specific handling and policies
   */
  @IsString()
  @IsNotEmpty()
  journeyContext: string;
  
  /**
   * Current delivery status
   */
  @ValidateNested()
  @Type(() => DeliveryStatusDto)
  @IsNotEmpty()
  status: DeliveryStatusDto;
  
  /**
   * History of all delivery attempts
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryAttemptDto)
  @ArrayMinSize(0)
  attempts: DeliveryAttemptDto[];
  
  /**
   * Fallback channels to try if primary channel fails
   * Listed in order of preference
   */
  @IsArray()
  @IsEnum(DeliveryChannel, { each: true })
  @IsOptional()
  fallbackChannels?: DeliveryChannel[];
  
  /**
   * Retry policy configuration
   */
  @ValidateNested()
  @Type(() => RetryPolicyDto)
  @IsNotEmpty()
  retryPolicy: RetryPolicyDto;
  
  /**
   * Additional metadata for the notification
   * Can include journey-specific context, actions, or debugging information
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
  
  /**
   * Performance metrics for SLA monitoring
   * Tracks timing information for delivery performance analysis
   */
  @IsObject()
  @IsOptional()
  performanceMetrics?: {
    /**
     * Time from creation to first delivery attempt in milliseconds
     */
    timeToFirstAttemptMs?: number;
    
    /**
     * Time from creation to successful delivery in milliseconds
     */
    timeToDeliveryMs?: number;
    
    /**
     * Time spent in retry cycles in milliseconds
     */
    timeInRetryMs?: number;
    
    /**
     * Channel-specific timing metrics
     */
    channelMetrics?: {
      [channel in DeliveryChannel]?: {
        attemptCount: number;
        deliveryTimeMs?: number;
        success: boolean;
      };
    };
  };
}