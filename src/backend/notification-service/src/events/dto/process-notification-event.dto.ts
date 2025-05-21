import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsEnum, ValidateNested, IsISO8601 } from 'class-validator'; // class-validator v0.14.0
import { Type } from 'class-transformer'; // class-transformer v0.5.1

// Import interfaces from @austa/interfaces package for type consistency
import { NotificationEventType as InterfaceNotificationEventType } from '@austa/interfaces/notification';
import { JourneyType } from '@austa/interfaces/common';
import { AchievementDto } from '@austa/interfaces/gamification';
import { AppointmentDto } from '@austa/interfaces/care';
import { MedicationDto } from '@austa/interfaces/care';
import { HealthGoalDto } from '@austa/interfaces/health';
import { ClaimDto } from '@austa/interfaces/plan';
import { BenefitDto } from '@austa/interfaces/plan';

/**
 * Enum defining all possible notification event types
 * Used for discriminated union type pattern in notification events
 */
export enum NotificationEventType {
  // User-facing notification events
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  APPOINTMENT_REMINDER = 'appointment.reminder',
  MEDICATION_REMINDER = 'medication.reminder',
  HEALTH_GOAL_ACHIEVED = 'health.goal.achieved',
  CLAIM_STATUS_UPDATED = 'claim.status.updated',
  BENEFIT_UNLOCKED = 'benefit.unlocked',
  
  // System notification events
  DELIVERY_STATUS = 'notification.delivery.status',
  PREFERENCE_UPDATED = 'notification.preference.updated',
  TEMPLATE_UPDATED = 'notification.template.updated'
}

/**
 * Enum defining the source journey of a notification event
 * Aligned with JourneyType from @austa/interfaces/common
 */
export enum NotificationJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  SYSTEM = 'system'
}

/**
 * Base metadata for all notification events
 * Contains common properties for tracking and processing
 */
export class NotificationEventMetadata {
  /**
   * Unique identifier for correlation across services
   */
  @IsString()
  @IsOptional()
  correlationId?: string;
  
  /**
   * Service that originated the event
   */
  @IsString()
  @IsOptional()
  sourceService?: string;
  
  /**
   * Schema version for backward compatibility
   * Following semantic versioning (major.minor.patch)
   */
  @IsString()
  @IsOptional()
  version?: string;
  
  /**
   * Timestamp when the event was created
   * ISO-8601 format
   */
  @IsISO8601()
  @IsOptional()
  timestamp?: string;
}

/**
 * Base class for all notification events
 * Contains common properties required for all notification events
 */
export class BaseNotificationEventDto {
  /**
   * Unique identifier for the user receiving the notification
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;
  
  /**
   * Type of notification event
   * Used for routing and processing logic
   */
  @IsEnum(NotificationEventType)
  @IsNotEmpty()
  type: NotificationEventType;
  
  /**
   * Source journey that generated the notification
   */
  @IsEnum(NotificationJourney)
  @IsNotEmpty()
  journey: NotificationJourney;
  
  /**
   * Timestamp of when the event occurred
   * ISO-8601 format
   */
  @IsISO8601()
  @IsNotEmpty()
  timestamp: string;
  
  /**
   * Additional metadata for tracking and processing
   */
  @ValidateNested()
  @Type(() => NotificationEventMetadata)
  @IsOptional()
  metadata?: NotificationEventMetadata;
}

/**
 * Achievement notification event DTO
 * Used for gamification achievement notifications
 */
export class AchievementNotificationEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.ACHIEVEMENT_UNLOCKED;
  journey: NotificationJourney.GAMIFICATION;
  
  /**
   * Achievement data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    achievement: AchievementDto;
    xpEarned: number;
    title: string;
    description: string;
    imageUrl?: string;
  };
}

/**
 * Appointment reminder notification event DTO
 * Used for care journey appointment reminders
 */
export class AppointmentReminderEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.APPOINTMENT_REMINDER;
  journey: NotificationJourney.CARE;
  
  /**
   * Appointment data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    appointment: AppointmentDto;
    title: string;
    body: string;
    reminderTime: string; // ISO-8601 format
    appointmentTime: string; // ISO-8601 format
  };
}

/**
 * Medication reminder notification event DTO
 * Used for care journey medication reminders
 */
export class MedicationReminderEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.MEDICATION_REMINDER;
  journey: NotificationJourney.CARE;
  
  /**
   * Medication data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    medication: MedicationDto;
    title: string;
    body: string;
    dosage: string;
    scheduledTime: string; // ISO-8601 format
  };
}

/**
 * Health goal achieved notification event DTO
 * Used for health journey goal achievement notifications
 */
export class HealthGoalAchievedEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.HEALTH_GOAL_ACHIEVED;
  journey: NotificationJourney.HEALTH;
  
  /**
   * Health goal data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    goal: HealthGoalDto;
    title: string;
    body: string;
    achievedValue: number;
    targetValue: number;
    metricType: string;
    achievedDate: string; // ISO-8601 format
  };
}

/**
 * Claim status updated notification event DTO
 * Used for plan journey claim status notifications
 */
export class ClaimStatusUpdatedEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.CLAIM_STATUS_UPDATED;
  journey: NotificationJourney.PLAN;
  
  /**
   * Claim data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    claim: ClaimDto;
    title: string;
    body: string;
    previousStatus: string;
    newStatus: string;
    updateDate: string; // ISO-8601 format
    amount?: number;
    currency?: string;
  };
}

/**
 * Benefit unlocked notification event DTO
 * Used for plan journey benefit notifications
 */
export class BenefitUnlockedEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.BENEFIT_UNLOCKED;
  journey: NotificationJourney.PLAN;
  
  /**
   * Benefit data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    benefit: BenefitDto;
    title: string;
    body: string;
    unlockDate: string; // ISO-8601 format
    expiryDate?: string; // ISO-8601 format
    value?: number;
    category?: string;
  };
}

/**
 * System notification event DTOs
 */

/**
 * Delivery status notification event DTO
 * Used for tracking notification delivery status
 */
export class DeliveryStatusEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.DELIVERY_STATUS;
  journey: NotificationJourney.SYSTEM;
  
  /**
   * Delivery status data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    notificationId: string;
    status: 'delivered' | 'failed' | 'pending';
    channel: 'email' | 'push' | 'sms' | 'in-app';
    deliveryTime?: string; // ISO-8601 format
    errorMessage?: string;
    retryCount?: number;
    deviceInfo?: Record<string, any>;
  };
}

/**
 * Preference updated notification event DTO
 * Used for tracking user notification preference changes
 */
export class PreferenceUpdatedEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.PREFERENCE_UPDATED;
  journey: NotificationJourney.SYSTEM;
  
  /**
   * Preference data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    preferences: Record<string, boolean>;
    channels: Record<string, boolean>;
    updateTime: string; // ISO-8601 format
  };
}

/**
 * Template updated notification event DTO
 * Used for tracking notification template changes
 */
export class TemplateUpdatedEventDto extends BaseNotificationEventDto {
  type: NotificationEventType.TEMPLATE_UPDATED;
  journey: NotificationJourney.SYSTEM;
  
  /**
   * Template data
   */
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  data: {
    templateId: string;
    templateName: string;
    version: string;
    updateTime: string; // ISO-8601 format
  };
}

/**
 * Union type of all notification event DTOs
 * Used for discriminated union pattern in event processing
 */
export type NotificationEventDto =
  | AchievementNotificationEventDto
  | AppointmentReminderEventDto
  | MedicationReminderEventDto
  | HealthGoalAchievedEventDto
  | ClaimStatusUpdatedEventDto
  | BenefitUnlockedEventDto
  | DeliveryStatusEventDto
  | PreferenceUpdatedEventDto
  | TemplateUpdatedEventDto;

/**
 * Main DTO for processing notification events from Kafka
 * This is the primary entry point for all notification events
 */
export class ProcessNotificationEventDto {
  /**
   * The notification event to process
   */
  @ValidateNested()
  @Type(() => BaseNotificationEventDto, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AchievementNotificationEventDto, name: NotificationEventType.ACHIEVEMENT_UNLOCKED },
        { value: AppointmentReminderEventDto, name: NotificationEventType.APPOINTMENT_REMINDER },
        { value: MedicationReminderEventDto, name: NotificationEventType.MEDICATION_REMINDER },
        { value: HealthGoalAchievedEventDto, name: NotificationEventType.HEALTH_GOAL_ACHIEVED },
        { value: ClaimStatusUpdatedEventDto, name: NotificationEventType.CLAIM_STATUS_UPDATED },
        { value: BenefitUnlockedEventDto, name: NotificationEventType.BENEFIT_UNLOCKED },
        { value: DeliveryStatusEventDto, name: NotificationEventType.DELIVERY_STATUS },
        { value: PreferenceUpdatedEventDto, name: NotificationEventType.PREFERENCE_UPDATED },
        { value: TemplateUpdatedEventDto, name: NotificationEventType.TEMPLATE_UPDATED },
      ],
    },
  })
  @IsNotEmpty()
  event: NotificationEventDto;
  
  /**
   * Helper method to get the event with the correct type
   * Uses discriminated union pattern based on event type
   */
  getTypedEvent(): NotificationEventDto {
    return this.event;
  }
  
  /**
   * Helper method to check if the event is of a specific type
   * @param type The notification event type to check
   */
  isEventType(type: NotificationEventType): boolean {
    return this.event.type === type;
  }
  
  /**
   * Helper method to check if the event is from a specific journey
   * @param journey The journey to check
   */
  isFromJourney(journey: NotificationJourney): boolean {
    return this.event.journey === journey;
  }
}