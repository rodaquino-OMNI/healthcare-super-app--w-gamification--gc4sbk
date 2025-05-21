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
  Max,
  ArrayMinSize
} from 'class-validator'; // class-validator v0.14.0
import { Type } from 'class-transformer'; // class-transformer v0.5.1

// Import from @austa/interfaces for standardized payload schemas
import { NotificationChannel } from '@austa/interfaces/notification/types';

/**
 * Enum defining notification criticality levels
 * Used to determine channel escalation patterns
 */

/**
 * Enum defining notification criticality levels
 * Used to determine channel escalation patterns
 */
export enum NotificationCriticality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * DTO for channel-specific content customization
 * Allows different content formatting for each channel
 */
export class ChannelContentDto {
  /**
   * Custom title for this specific channel
   * If not provided, falls back to the main notification title
   */
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * Custom body content for this specific channel
   * If not provided, falls back to the main notification body
   */
  @IsString()
  @IsOptional()
  body?: string;

  /**
   * Channel-specific metadata or formatting options
   * Can include HTML for email, markdown for in-app, etc.
   */
  @IsObject()
  @IsOptional()
  formatOptions?: Record<string, any>;
}

/**
 * DTO for time-sensitive delivery rules
 * Enables scheduling and time zone aware delivery
 */
export class TimeDeliveryRuleDto {
  /**
   * Start hour for allowed delivery window (0-23)
   * Used to respect quiet hours and time zone preferences
   */
  @IsNumber()
  @Min(0)
  @Max(23)
  startHour: number;

  /**
   * End hour for allowed delivery window (0-23)
   * Used to respect quiet hours and time zone preferences
   */
  @IsNumber()
  @Min(0)
  @Max(23)
  endHour: number;

  /**
   * Whether to use the user's local time zone
   * If false, uses the system default time zone
   */
  @IsBoolean()
  @IsOptional()
  useUserTimeZone?: boolean = true;

  /**
   * Maximum delay allowed for delivery (in minutes)
   * After this time, the notification will be sent regardless of time rules
   * Used for time-sensitive notifications that shouldn't be delayed indefinitely
   */
  @IsNumber()
  @IsOptional()
  maxDelayMinutes?: number;
}

/**
 * Data transfer object for notification channel preferences.
 * This DTO defines the structure for specifying notification channel
 * priorities and fallback strategies on a per-notification basis.
 */
export class NotificationChannelPreferenceDto {
  /**
   * Primary notification channel to attempt first
   * This is the preferred channel for delivery
   */
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  primaryChannel: NotificationChannel;

  /**
   * Ordered list of fallback channels to try if primary fails
   * Will be attempted in sequence until successful delivery
   */
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @ArrayMinSize(0)
  @IsOptional()
  fallbackChannels?: NotificationChannel[];

  /**
   * Criticality level of the notification
   * Affects channel escalation patterns and override behavior
   */
  @IsEnum(NotificationCriticality)
  @IsOptional()
  criticality?: NotificationCriticality = NotificationCriticality.MEDIUM;

  /**
   * Whether to override user channel preferences
   * Used for critical notifications that must be delivered
   * regardless of user preference settings
   */
  @IsBoolean()
  @IsOptional()
  overrideUserPreferences?: boolean = false;

  /**
   * Channel-specific content customization
   * Allows different content formatting for each channel
   */
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelContentDto)
  channelContent?: Record<NotificationChannel, ChannelContentDto>;

  /**
   * Time-sensitive delivery rules
   * Controls when notifications can be delivered based on time of day
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeDeliveryRuleDto)
  timeDeliveryRule?: TimeDeliveryRuleDto;

  /**
   * Whether to attempt all channels simultaneously
   * Used for urgent notifications where immediate delivery is critical
   * If true, ignores primaryChannel and fallbackChannels order
   */
  @IsBoolean()
  @IsOptional()
  deliverToAllChannels?: boolean = false;

  /**
   * Maximum number of delivery attempts per channel
   * Controls retry behavior for failed deliveries
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAttemptsPerChannel?: number = 3;

  /**
   * Delay between retry attempts in seconds
   * Implements exponential backoff when combined with attempt count
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  retryDelaySeconds?: number = 60;
}