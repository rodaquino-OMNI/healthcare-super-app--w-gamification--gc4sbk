import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, NotificationChannel, NotificationPriority } from '@austa/interfaces/notification/types';
import { IRetryOptions } from '@austa/interfaces/common/retry';

/**
 * Configuration for notification retry behavior
 * Defines how failed notification deliveries should be retried
 */
export class RetryConfigDto implements IRetryOptions {
  /**
   * Maximum number of retry attempts before moving to dead-letter queue
   * Default is 3 attempts
   */
  @IsOptional()
  readonly maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry attempt
   * Default is 1000ms (1 second)
   */
  @IsOptional()
  readonly initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retry attempts
   * Default is 60000ms (1 minute)
   */
  @IsOptional()
  readonly maxDelay?: number;

  /**
   * Factor by which the delay increases with each retry attempt
   * Default is 2 (exponential backoff)
   */
  @IsOptional()
  readonly backoffFactor?: number;

  /**
   * Whether to add random jitter to retry delays to prevent thundering herd
   * Default is true
   */
  @IsOptional()
  readonly jitter?: boolean;
}

/**
 * Configuration for notification channel preferences
 * Defines the priority and fallback strategy for delivery channels
 */
export class ChannelPreferencesDto {
  /**
   * Ordered list of preferred notification channels
   * The first channel will be attempted first, followed by others in order if delivery fails
   */
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  readonly preferredChannels?: NotificationChannel[];

  /**
   * Whether to attempt delivery on all channels regardless of success on any channel
   * Default is false (stop after first successful delivery)
   */
  @IsOptional()
  readonly deliverToAllChannels?: boolean;

  /**
   * Maximum time in milliseconds to wait for delivery across all channels
   * Default is 30000ms (30 seconds)
   */
  @IsOptional()
  readonly deliveryTimeout?: number;
}

/**
 * Configuration for tracking notification delivery status
 * Enables detailed monitoring of notification delivery across channels
 */
export class DeliveryTrackingDto {
  /**
   * Whether to track detailed delivery status for this notification
   * Default is true
   */
  @IsOptional()
  readonly enabled?: boolean;

  /**
   * Whether to persist delivery events to the database
   * Default is true for high priority notifications, false for others
   */
  @IsOptional()
  readonly persistEvents?: boolean;

  /**
   * External correlation ID for tracking this notification in other systems
   */
  @IsOptional()
  @IsString()
  readonly correlationId?: string;
}

/**
 * Data transfer object for sending notifications.
 * This DTO defines the structure and validation rules for notification requests
 * throughout the AUSTA SuperApp.
 */
export class SendNotificationDto {
  /**
   * The ID of the user to receive the notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   * Used for categorizing and routing notifications
   */
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  /**
   * Title displayed in the notification
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Main content of the notification
   */
  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Additional structured data for the notification
   * Can include journey-specific context, actions, or metadata
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  /**
   * ID of the notification template to use (if applicable)
   * References a pre-defined template in the notification service
   */
  @IsString()
  @IsOptional()
  templateId?: string;

  /**
   * Language code for the notification content
   * Defaults to user's preferred language if not specified
   */
  @IsString()
  @IsOptional()
  language?: string;

  /**
   * Priority level of the notification
   * Affects delivery urgency and retry behavior
   */
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  /**
   * Configuration for retry behavior if notification delivery fails
   * Defines retry attempts, backoff strategy, and DLQ handling
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  retryConfig?: RetryConfigDto;

  /**
   * Configuration for notification channel preferences
   * Defines preferred channels and fallback strategy
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  channelPreferences?: ChannelPreferencesDto;

  /**
   * Configuration for tracking notification delivery status
   * Enables detailed monitoring of notification delivery
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryTrackingDto)
  deliveryTracking?: DeliveryTrackingDto;

  /**
   * Journey context for the notification
   * Identifies which journey (Health, Care, Plan) the notification belongs to
   */
  @IsString()
  @IsOptional()
  journeyContext?: string;
}