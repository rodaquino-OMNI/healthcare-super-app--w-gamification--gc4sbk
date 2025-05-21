import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { NotificationType } from '@austa/interfaces/notification';
import { INotificationMetadata } from '@austa/interfaces/common';
import { IJourneySpecificPayload } from '../../interfaces/notification-payload.interface';
import { DeliveryStatusType, DeliveryChannel } from '../../interfaces/delivery-tracking.interface';

/**
 * DTO for validating device token requests
 * Used when registering or updating device tokens
 */
export class DeviceTokenDto {
  /**
   * The device token for push notifications
   * This is the FCM token for Firebase Cloud Messaging
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * The user ID associated with this device token
   */
  @IsString()
  @IsNotEmpty()
  userId: string;

  /**
   * The device type (ios, android, web)
   */
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  deviceType: string;

  /**
   * Optional device name for user-friendly identification
   */
  @IsString()
  @IsOptional()
  deviceName?: string;

  /**
   * Whether this device should receive push notifications
   * Defaults to true if not provided
   */
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

/**
 * DTO for platform-specific Android notification options
 */
export class AndroidConfigDto {
  /**
   * The notification channel ID (required for Android O and above)
   */
  @IsString()
  @IsOptional()
  channelId?: string;

  /**
   * Priority of the notification
   * 'default' - Default notification priority
   * 'high' - Higher notification priority
   * 'max' - Highest notification priority
   */
  @IsString()
  @IsIn(['default', 'high', 'max'])
  @IsOptional()
  priority?: 'default' | 'high' | 'max';

  /**
   * Whether to play sound when the notification is received
   */
  @IsBoolean()
  @IsOptional()
  sound?: boolean;

  /**
   * Whether the notification is visible on the lock screen
   */
  @IsBoolean()
  @IsOptional()
  visibility?: boolean;

  /**
   * Additional data for the notification
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for platform-specific iOS notification options
 */
export class ApnsConfigDto {
  /**
   * The category for the notification (used for actionable notifications)
   */
  @IsString()
  @IsOptional()
  category?: string;

  /**
   * The sound to play when the notification is received
   */
  @IsString()
  @IsOptional()
  sound?: string;

  /**
   * The badge count to display on the app icon
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  badge?: number;

  /**
   * Whether the notification is a background notification
   */
  @IsBoolean()
  @IsOptional()
  contentAvailable?: boolean;

  /**
   * Whether the notification should be muted
   */
  @IsBoolean()
  @IsOptional()
  mutableContent?: boolean;

  /**
   * Additional data for the notification
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for platform-specific web notification options
 */
export class WebpushConfigDto {
  /**
   * The notification icon URL
   */
  @IsString()
  @IsOptional()
  icon?: string;

  /**
   * The action buttons for the notification
   */
  @IsArray()
  @IsOptional()
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;

  /**
   * Additional data for the notification
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * DTO for journey-specific notification data
 */
export class JourneySpecificPayloadDto implements Partial<IJourneySpecificPayload> {
  /**
   * The journey context (health, care, plan, gamification, system)
   */
  @IsString()
  @IsIn(['health', 'care', 'plan', 'gamification', 'system'])
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'system';

  /**
   * The notification type specific to the journey
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * Action to perform when the notification is tapped
   */
  @IsObject()
  @IsOptional()
  action?: {
    type: 'navigate' | 'open-url' | 'custom';
    target: string;
    params?: Record<string, any>;
  };

  /**
   * Additional journey-specific data
   * This will vary based on the journey and notification type
   */
  @IsObject()
  @IsOptional()
  [key: string]: any;
}

/**
 * DTO for push notification requests
 * Used when sending push notifications through the service
 */
export class PushNotificationDto {
  /**
   * The title of the notification
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * The body content of the notification
   */
  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Additional data to include with the notification
   * This can be any JSON-serializable object
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  /**
   * Journey-specific payload for the notification
   */
  @ValidateNested()
  @Type(() => JourneySpecificPayloadDto)
  @IsOptional()
  journeyData?: JourneySpecificPayloadDto;

  /**
   * The badge count to display on the app icon (iOS)
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  badge?: number;

  /**
   * The sound to play when the notification is received
   */
  @IsString()
  @IsOptional()
  sound?: string;

  /**
   * Android-specific configuration
   */
  @ValidateNested()
  @Type(() => AndroidConfigDto)
  @IsOptional()
  android?: AndroidConfigDto;

  /**
   * iOS-specific configuration
   */
  @ValidateNested()
  @Type(() => ApnsConfigDto)
  @IsOptional()
  apns?: ApnsConfigDto;

  /**
   * Web-specific configuration
   */
  @ValidateNested()
  @Type(() => WebpushConfigDto)
  @IsOptional()
  webpush?: WebpushConfigDto;

  /**
   * The notification type
   */
  @IsString()
  @IsOptional()
  type?: NotificationType;

  /**
   * The journey context (health, care, plan, gamification, system)
   */
  @IsString()
  @IsIn(['health', 'care', 'plan', 'gamification', 'system'])
  @IsOptional()
  journey?: 'health' | 'care' | 'plan' | 'gamification' | 'system';

  /**
   * Optional metadata for the notification
   */
  @IsObject()
  @IsOptional()
  metadata?: INotificationMetadata;
}

/**
 * DTO for bulk push notification requests
 * Used when sending multiple push notifications at once
 */
export class BulkPushNotificationDto {
  /**
   * Array of device tokens to send the notification to
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tokens: string[];

  /**
   * The notification payload to send to all tokens
   */
  @ValidateNested()
  @Type(() => PushNotificationDto)
  notification: PushNotificationDto;
}

/**
 * DTO for push notification delivery status
 * Used for tracking the delivery status of push notifications
 */
export class PushDeliveryStatusDto {
  /**
   * The notification ID
   */
  @IsString()
  @IsNotEmpty()
  notificationId: string;

  /**
   * The device token
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * The current delivery status
   */
  @IsEnum(DeliveryStatusType)
  status: DeliveryStatusType;

  /**
   * The delivery channel
   */
  @IsEnum(DeliveryChannel)
  channel: DeliveryChannel;

  /**
   * The timestamp of the delivery attempt
   */
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  /**
   * The provider response code (if available)
   */
  @IsString()
  @IsOptional()
  providerResponseCode?: string;

  /**
   * The provider response message (if available)
   */
  @IsString()
  @IsOptional()
  providerResponseMessage?: string;

  /**
   * Error information if the delivery failed
   */
  @IsObject()
  @IsOptional()
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * DTO for push notification delivery attempt
 * Used for tracking individual delivery attempts
 */
export class PushDeliveryAttemptDto {
  /**
   * The attempt ID
   */
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  /**
   * The notification ID
   */
  @IsString()
  @IsNotEmpty()
  notificationId: string;

  /**
   * The device token
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * The current status of this attempt
   */
  @IsEnum(DeliveryStatusType)
  status: DeliveryStatusType;

  /**
   * The delivery channel
   */
  @IsEnum(DeliveryChannel)
  channel: DeliveryChannel;

  /**
   * The timestamp of the attempt
   */
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  /**
   * Retry information if this is a retry attempt
   */
  @IsObject()
  @IsOptional()
  retry?: {
    attemptNumber: number;
    delayMs: number;
    strategy: string;
  };

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
}