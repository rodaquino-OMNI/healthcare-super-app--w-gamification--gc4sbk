import { IsString, IsNotEmpty, IsUUID, IsDate, IsOptional, IsObject, IsEnum, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IBaseEvent } from '@austa/interfaces/events/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/journey.types';
import { NotificationType } from '@austa/interfaces/notification/types';

/**
 * Base Data Transfer Object for notification events consumed from Kafka.
 * This DTO ensures that all notification events have a consistent structure
 * with required fields and validation rules.
 *
 * It integrates with @austa/interfaces for cross-platform type safety and
 * implements the event versioning strategy for backward compatibility.
 */
export class BaseNotificationEventDto implements IBaseEvent {
  /**
   * Unique identifier for the event
   */
  @IsUUID(4)
  @IsNotEmpty()
  id: string;

  /**
   * Type of the event
   * Used for routing and processing logic
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * User ID of the recipient
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Timestamp when the event was created
   */
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  timestamp: Date;

  /**
   * Schema version for backward compatibility
   * Format: "major.minor.patch" (e.g., "1.0.0")
   */
  @IsString()
  @IsNotEmpty()
  version: string;

  /**
   * Optional correlation ID for event tracking
   * Used to correlate related events across services
   */
  @IsString()
  @IsOptional()
  correlationId?: string;

  /**
   * Optional trace ID for distributed tracing
   */
  @IsString()
  @IsOptional()
  traceId?: string;

  /**
   * Retry count for failed events
   * Incremented each time the event is retried
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  retryCount?: number;

  /**
   * Maximum number of retries allowed
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxRetries?: number;
}

/**
 * DTO for notification events with journey context
 * Extends the base notification event with journey-specific information
 */
export class JourneyNotificationEventDto extends BaseNotificationEventDto {
  /**
   * Type of journey that generated the notification
   */
  @IsEnum(JourneyType)
  @IsNotEmpty()
  journeyType: JourneyType;

  /**
   * Journey-specific context data
   * Contains additional information relevant to the journey
   */
  @IsObject()
  @IsOptional()
  journeyContext?: Record<string, any>;
}

/**
 * DTO for notification events with payload
 * Extends the base notification event with notification payload
 */
export class NotificationEventWithPayloadDto extends BaseNotificationEventDto {
  /**
   * Notification type
   */
  @IsEnum(NotificationType)
  @IsNotEmpty()
  notificationType: NotificationType;

  /**
   * Notification payload
   * Contains the content and configuration for the notification
   */
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NotificationPayloadDto)
  payload: NotificationPayloadDto;
}

/**
 * DTO for notification payload
 * Contains the content and configuration for a notification
 */
export class NotificationPayloadDto {
  /**
   * Title of the notification
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Body content of the notification
   */
  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Optional data specific to the notification type
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  /**
   * Optional template ID to use for formatting
   */
  @IsString()
  @IsOptional()
  templateId?: string;

  /**
   * Optional template variables for substitution
   */
  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, any>;

  /**
   * Optional deep link URL for the notification
   */
  @IsString()
  @IsOptional()
  deepLink?: string;

  /**
   * Optional expiration date for the notification
   */
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  /**
   * Optional metadata for tracking and analytics
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for journey notification events with payload
 * Combines journey context and notification payload
 */
export class JourneyNotificationEventWithPayloadDto extends JourneyNotificationEventDto {
  /**
   * Notification type
   */
  @IsEnum(NotificationType)
  @IsNotEmpty()
  notificationType: NotificationType;

  /**
   * Notification payload
   * Contains the content and configuration for the notification
   */
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NotificationPayloadDto)
  payload: NotificationPayloadDto;
}