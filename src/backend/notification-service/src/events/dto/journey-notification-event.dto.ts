import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Import journey-specific interfaces
import { MetricType } from '@austa/interfaces/journey/health';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Base class for all notification events
 * This serves as the foundation for journey-specific notification events
 */
export class BaseNotificationEventDto {
  /**
   * Unique identifier for the event
   */
  @IsUUID(4)
  @IsNotEmpty()
  eventId: string;

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
  @IsString()
  @IsNotEmpty()
  type: string;

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
   * Timestamp when the event was created
   */
  @IsNotEmpty()
  timestamp: Date;

  /**
   * Version of the event schema
   * Used for backward compatibility during schema evolution
   */
  @IsString()
  @IsNotEmpty()
  version: string = '1.0.0';

  /**
   * Journey context for the notification
   * Identifies which journey (health, care, plan) the notification belongs to
   */
  @IsEnum(['health', 'care', 'plan'])
  @IsNotEmpty()
  journeyContext: 'health' | 'care' | 'plan';

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
}

/**
 * Health journey specific notification data
 */
export class HealthNotificationDataDto {
  /**
   * Type of health metric (if applicable)
   * Used for health-related notifications like goal achievements or abnormal readings
   */
  @IsEnum(MetricType)
  @IsOptional()
  metricType?: MetricType;

  /**
   * Value of the health metric (if applicable)
   */
  @IsOptional()
  metricValue?: number;

  /**
   * Unit of the health metric (if applicable)
   */
  @IsString()
  @IsOptional()
  metricUnit?: string;

  /**
   * Goal ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  goalId?: string;

  /**
   * Device ID related to the notification (if applicable)
   * Used for device connection or synchronization notifications
   */
  @IsString()
  @IsOptional()
  deviceId?: string;

  /**
   * Additional health-specific data
   */
  @IsObject()
  @IsOptional()
  additionalData?: Record<string, any>;
}

/**
 * Care journey specific notification data
 */
export class CareNotificationDataDto {
  /**
   * Appointment ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  appointmentId?: string;

  /**
   * Appointment type (if applicable)
   */
  @IsEnum(AppointmentType)
  @IsOptional()
  appointmentType?: AppointmentType;

  /**
   * Appointment status (if applicable)
   */
  @IsEnum(AppointmentStatus)
  @IsOptional()
  appointmentStatus?: AppointmentStatus;

  /**
   * Provider ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  providerId?: string;

  /**
   * Medication ID related to the notification (if applicable)
   * Used for medication reminders or adherence notifications
   */
  @IsUUID(4)
  @IsOptional()
  medicationId?: string;

  /**
   * Telemedicine session ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  telemedicineSessionId?: string;

  /**
   * Additional care-specific data
   */
  @IsObject()
  @IsOptional()
  additionalData?: Record<string, any>;
}

/**
 * Plan journey specific notification data
 */
export class PlanNotificationDataDto {
  /**
   * Claim ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  claimId?: string;

  /**
   * Claim status (if applicable)
   */
  @IsEnum(ClaimStatus)
  @IsOptional()
  claimStatus?: ClaimStatus;

  /**
   * Plan ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  planId?: string;

  /**
   * Benefit ID related to the notification (if applicable)
   */
  @IsUUID(4)
  @IsOptional()
  benefitId?: string;

  /**
   * Document ID related to the notification (if applicable)
   * Used for document upload or processing notifications
   */
  @IsUUID(4)
  @IsOptional()
  documentId?: string;

  /**
   * Additional plan-specific data
   */
  @IsObject()
  @IsOptional()
  additionalData?: Record<string, any>;
}

/**
 * Health journey specific notification event
 * Extends the base notification event with health-specific data
 */
export class HealthJourneyNotificationEventDto extends BaseNotificationEventDto {
  /**
   * Journey context is always 'health' for health journey notifications
   */
  @IsEnum(['health'])
  @IsNotEmpty()
  journeyContext: 'health' = 'health';

  /**
   * Health-specific data for the notification
   */
  @IsObject()
  @ValidateNested()
  @Type(() => HealthNotificationDataDto)
  data: HealthNotificationDataDto;
}

/**
 * Care journey specific notification event
 * Extends the base notification event with care-specific data
 */
export class CareJourneyNotificationEventDto extends BaseNotificationEventDto {
  /**
   * Journey context is always 'care' for care journey notifications
   */
  @IsEnum(['care'])
  @IsNotEmpty()
  journeyContext: 'care' = 'care';

  /**
   * Care-specific data for the notification
   */
  @IsObject()
  @ValidateNested()
  @Type(() => CareNotificationDataDto)
  data: CareNotificationDataDto;
}

/**
 * Plan journey specific notification event
 * Extends the base notification event with plan-specific data
 */
export class PlanJourneyNotificationEventDto extends BaseNotificationEventDto {
  /**
   * Journey context is always 'plan' for plan journey notifications
   */
  @IsEnum(['plan'])
  @IsNotEmpty()
  journeyContext: 'plan' = 'plan';

  /**
   * Plan-specific data for the notification
   */
  @IsObject()
  @ValidateNested()
  @Type(() => PlanNotificationDataDto)
  data: PlanNotificationDataDto;
}

/**
 * Type guard to check if a notification event is a health journey notification
 * @param event The notification event to check
 * @returns True if the event is a health journey notification
 */
export function isHealthJourneyNotification(
  event: BaseNotificationEventDto,
): event is HealthJourneyNotificationEventDto {
  return event.journeyContext === 'health';
}

/**
 * Type guard to check if a notification event is a care journey notification
 * @param event The notification event to check
 * @returns True if the event is a care journey notification
 */
export function isCareJourneyNotification(
  event: BaseNotificationEventDto,
): event is CareJourneyNotificationEventDto {
  return event.journeyContext === 'care';
}

/**
 * Type guard to check if a notification event is a plan journey notification
 * @param event The notification event to check
 * @returns True if the event is a plan journey notification
 */
export function isPlanJourneyNotification(
  event: BaseNotificationEventDto,
): event is PlanJourneyNotificationEventDto {
  return event.journeyContext === 'plan';
}