import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsObject, 
  IsUUID, 
  IsEnum, 
  ValidateNested,
  IsBoolean,
  IsDateString,
  IsArray
} from 'class-validator'; // class-validator v0.14.0
import { Type } from 'class-transformer'; // class-transformer v0.5.1
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority 
} from '@austa/interfaces/notification/types';

/**
 * Configuration for retry policies when sending notifications
 * Supports different retry strategies with configurable parameters
 */
export class RetryConfigDto {
  /**
   * Type of retry policy to use
   * - EXPONENTIAL_BACKOFF: Increases delay between retries exponentially
   * - FIXED: Uses a constant delay between retries
   * - LINEAR: Increases delay linearly between retries
   */
  @IsString()
  @IsNotEmpty()
  policyType: 'EXPONENTIAL_BACKOFF' | 'FIXED' | 'LINEAR';

  /**
   * Maximum number of retry attempts before giving up
   * Must be a positive integer
   */
  @IsNotEmpty()
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry
   * Must be a positive integer
   */
  @IsNotEmpty()
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retries
   * Used to cap exponential growth in EXPONENTIAL_BACKOFF policy
   */
  @IsOptional()
  maxDelay?: number;

  /**
   * Factor by which to increase delay in EXPONENTIAL_BACKOFF policy
   * Typically a value like 2.0 for doubling the delay each time
   */
  @IsOptional()
  backoffFactor?: number;

  /**
   * Whether to add random jitter to retry timing to prevent thundering herd
   */
  @IsOptional()
  @IsBoolean()
  jitter?: boolean;
}

/**
 * Configuration for channel preferences when sending notifications
 * Allows specifying which channels to use and in what order
 */
export class ChannelPreferenceDto {
  /**
   * Ordered list of channels to try when sending the notification
   * The service will attempt delivery in this order until successful
   */
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  /**
   * Whether to override the user's default channel preferences
   * If true, the channels array will be used regardless of user settings
   */
  @IsOptional()
  @IsBoolean()
  overrideUserPreferences?: boolean;

  /**
   * Whether to fall back to the next channel if the current one fails
   * If false, delivery will stop after the first channel failure
   */
  @IsOptional()
  @IsBoolean()
  enableFallback?: boolean;
}

/**
 * Configuration for tracking notification delivery and read status
 */
export class DeliveryTrackingDto {
  /**
   * Whether to track when the notification is read by the user
   */
  @IsBoolean()
  trackRead: boolean;

  /**
   * Whether to track when the notification is delivered to the device
   */
  @IsBoolean()
  trackDelivery: boolean;

  /**
   * When the notification should expire and no longer be shown to the user
   * ISO 8601 date string format
   */
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/**
 * Data transfer object for sending notifications.
 * This DTO defines the structure and validation rules for notification requests
 * throughout the AUSTA SuperApp.
 * 
 * Enhanced features include:
 * - Integration with @austa/interfaces for standardized notification payload schemas
 * - Support for retry policies with configurable exponential backoff
 * - Channel preferences for prioritization and fallback strategies
 * - Delivery tracking for status monitoring across channels
 * - Journey-specific context and validation
 * 
 * This DTO is used by all services that need to send notifications through the
 * notification service, ensuring consistent validation and processing of notification
 * requests across the platform.
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
   * 
   * Standard types include:
   * - SYSTEM: System-level notifications about the platform
   * - ACHIEVEMENT: Gamification achievements and rewards
   * - APPOINTMENT: Care journey appointment reminders and updates
   * - MEDICATION: Care journey medication reminders
   * - HEALTH_GOAL: Health journey goal updates and reminders
   * - CLAIM_STATUS: Plan journey insurance claim status updates
   * - BENEFIT: Plan journey benefit information and updates
   */
  @IsEnum(NotificationType, {
    message: 'type must be a valid NotificationType from @austa/interfaces'
  })
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
   * 
   * Common data structures include:
   * - For ACHIEVEMENT: { achievementId, points, level, badgeUrl }
   * - For APPOINTMENT: { appointmentId, providerId, dateTime, location }
   * - For MEDICATION: { medicationId, dosage, instructions }
   * - For HEALTH_GOAL: { goalId, progress, target, metric }
   * - For CLAIM_STATUS: { claimId, status, amount, details }
   * - For BENEFIT: { benefitId, description, expiryDate }
   * 
   * The structure should match the corresponding interface in @austa/interfaces/notification/data
   * based on the notification type.
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  /**
   * ID of the notification template to use (if applicable)
   * References a pre-defined template in the notification service
   * 
   * When a template is specified:
   * - The template's structure will be used to format the notification
   * - The data field must contain all variables required by the template
   * - The title and body fields may be overridden by the template
   * - The language field determines which translation of the template to use
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
   * Configuration for retry behavior if notification delivery fails
   * Includes policy type, max retries, delays, and backoff strategy
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  retryConfig?: RetryConfigDto;

  /**
   * Configuration for which channels to use for this notification
   * Allows specifying channel order and fallback behavior
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  channelPreferences?: ChannelPreferenceDto;

  /**
   * Configuration for tracking notification delivery and read status
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryTrackingDto)
  deliveryTracking?: DeliveryTrackingDto;

  /**
   * Priority level of the notification
   * Affects delivery urgency and user experience
   * 
   * Available priorities:
   * - LOW: Informational notifications with no time sensitivity
   * - MEDIUM: Standard notifications (default if not specified)
   * - HIGH: Important notifications that should be highlighted
   * - CRITICAL: Urgent notifications requiring immediate attention
   */
  @IsOptional()
  @IsEnum(NotificationPriority, {
    message: 'priority must be a valid NotificationPriority from @austa/interfaces'
  })
  priority?: NotificationPriority;

  /**
   * Journey context for the notification (health, care, plan)
   * Used for journey-specific styling and handling
   * 
   * Valid journey contexts:
   * - health: Notifications related to the "Minha Saúde" journey
   * - care: Notifications related to the "Cuidar-me Agora" journey
   * - plan: Notifications related to the "Meu Plano & Benefícios" journey
   * - global: Notifications that apply across all journeys
   */
  @IsOptional()
  @IsString()
  @IsEnum(['health', 'care', 'plan', 'global'], {
    message: 'journeyContext must be one of: health, care, plan, global'
  })
  journeyContext?: 'health' | 'care' | 'plan' | 'global';
}