import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JourneyType } from '@austa/interfaces/common/types';
import { 
  NotificationEventVersion, 
  JourneyContext, 
  NotificationType, 
  NotificationPriority 
} from '@austa/interfaces/notification/types';
import {
  AchievementNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData
} from '@austa/interfaces/notification/data';

/**
 * Base Data Transfer Object for all notification events consumed from Kafka
 * 
 * This DTO defines the core properties common to all notification events
 * and provides validation rules using class-validator decorators.
 * 
 * All notification events in the system should extend this base class
 * to ensure consistent structure and validation.
 */
export class BaseNotificationEventDto {
  /**
   * The unique identifier of the user to receive the notification
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /**
   * The type of notification
   * @example NotificationType.ACHIEVEMENT, NotificationType.APPOINTMENT_REMINDER
   */
  @IsNotEmpty({ message: 'Notification type is required' })
  @IsEnum(NotificationType, { message: 'Notification type must be a valid NotificationType' })
  notificationType: NotificationType;

  /**
   * The timestamp when the event occurred
   * @default current ISO timestamp
   */
  @IsOptional()
  @IsString({ message: 'Timestamp must be a string' })
  timestamp: string = new Date().toISOString();

  /**
   * The version of the event schema being used
   * Used for backward compatibility during schema evolution
   * @default '1.0'
   */
  @IsOptional()
  @IsEnum(NotificationEventVersion, { message: 'Event version must be a valid version' })
  version: NotificationEventVersion = NotificationEventVersion.V1_0;

  /**
   * The priority level of the notification
   * @default NotificationPriority.MEDIUM
   */
  @IsOptional()
  @IsEnum(NotificationPriority, { message: 'Priority must be a valid NotificationPriority' })
  priority: NotificationPriority = NotificationPriority.MEDIUM;

  /**
   * Journey context information for journey-specific notifications
   * Contains the journey type and optional metadata
   */
  @IsOptional()
  @IsObject({ message: 'Journey context must be an object' })
  @ValidateNested()
  @Type(() => Object)
  journeyContext?: JourneyContext;

  /**
   * The payload data associated with the notification
   * Type varies based on the notification type and journey
   */
  @IsNotEmpty({ message: 'Notification data is required' })
  @IsObject({ message: 'Notification data must be an object' })
  @ValidateNested()
  @Type(() => Object)
  data: Record<string, any>;
}

/**
 * Achievement notification event DTO with strongly typed payload
 * Used for gamification achievement notifications across all journeys
 */
export class AchievementNotificationEventDto extends BaseNotificationEventDto {
  /**
   * Override notificationType to ensure it's always ACHIEVEMENT
   */
  @IsEnum(NotificationType, { message: 'Notification type must be ACHIEVEMENT' })
  notificationType: NotificationType = NotificationType.ACHIEVEMENT;

  /**
   * Strongly typed achievement notification data
   */
  @ValidateNested()
  @Type(() => Object)
  declare data: AchievementNotificationData;

  /**
   * Default priority for achievement notifications
   */
  @IsEnum(NotificationPriority)
  priority: NotificationPriority = NotificationPriority.HIGH;
}

/**
 * Appointment reminder notification event DTO with strongly typed payload
 * Used for care journey appointment reminders
 */
export class AppointmentReminderEventDto extends BaseNotificationEventDto {
  /**
   * Override notificationType to ensure it's always APPOINTMENT_REMINDER
   */
  @IsEnum(NotificationType, { message: 'Notification type must be APPOINTMENT_REMINDER' })
  notificationType: NotificationType = NotificationType.APPOINTMENT_REMINDER;

  /**
   * Strongly typed appointment reminder data
   */
  @ValidateNested()
  @Type(() => Object)
  declare data: AppointmentReminderData;

  /**
   * Journey context for care journey
   */
  @ValidateNested()
  @Type(() => Object)
  journeyContext: JourneyContext = {
    type: JourneyType.CARE
  };
}

/**
 * Claim status update notification event DTO with strongly typed payload
 * Used for plan journey insurance claim updates
 */
export class ClaimStatusUpdateEventDto extends BaseNotificationEventDto {
  /**
   * Override notificationType to ensure it's always CLAIM_STATUS_UPDATE
   */
  @IsEnum(NotificationType, { message: 'Notification type must be CLAIM_STATUS_UPDATE' })
  notificationType: NotificationType = NotificationType.CLAIM_STATUS_UPDATE;

  /**
   * Strongly typed claim status update data
   */
  @ValidateNested()
  @Type(() => Object)
  declare data: ClaimStatusUpdateData;

  /**
   * Journey context for plan journey
   */
  @ValidateNested()
  @Type(() => Object)
  journeyContext: JourneyContext = {
    type: JourneyType.PLAN
  };
}