import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { JourneyId, JOURNEY_IDS } from '@austa/journey-context';
import { BaseNotificationEventDto } from './base-notification-event.dto';

// Import journey-specific interfaces
import {
  IHealthMetric,
  IHealthGoal,
  MetricType,
  GoalType,
} from '@austa/interfaces/journey/health';
import {
  IAppointment,
  AppointmentStatus,
  IMedication,
} from '@austa/interfaces/journey/care';
import {
  IClaim,
  ClaimStatus,
  IBenefit,
} from '@austa/interfaces/journey/plan';

/**
 * Base class for all journey-specific notification events
 * Extends the base notification event with journey context
 */
export class JourneyNotificationEventDto extends BaseNotificationEventDto {
  /**
   * The journey ID this notification belongs to
   * Must be one of the valid journey IDs: 'health', 'care', 'plan'
   */
  @IsEnum(JOURNEY_IDS)
  @IsNotEmpty()
  journeyId: JourneyId;

  /**
   * Journey-specific theme color to use for the notification
   * This allows notifications to maintain journey branding
   */
  @IsString()
  @IsOptional()
  themeColor?: string;

  /**
   * Deep link path for the notification
   * Should point to a specific screen within the journey
   */
  @IsString()
  @IsOptional()
  deepLink?: string;
}

/**
 * Health journey notification event DTO
 * Used for notifications related to health metrics, goals, and insights
 */
export class HealthJourneyNotificationEventDto extends JourneyNotificationEventDto {
  constructor() {
    super();
    this.journeyId = 'health';
  }

  /**
   * Health-specific notification data
   * Can include metrics, goals, or other health-related information
   */
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => HealthNotificationData)
  data: HealthNotificationData;
}

/**
 * Care journey notification event DTO
 * Used for notifications related to appointments, medications, and treatments
 */
export class CareJourneyNotificationEventDto extends JourneyNotificationEventDto {
  constructor() {
    super();
    this.journeyId = 'care';
  }

  /**
   * Care-specific notification data
   * Can include appointment reminders, medication alerts, or provider information
   */
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CareNotificationData)
  data: CareNotificationData;
}

/**
 * Plan journey notification event DTO
 * Used for notifications related to insurance plans, claims, and benefits
 */
export class PlanJourneyNotificationEventDto extends JourneyNotificationEventDto {
  constructor() {
    super();
    this.journeyId = 'plan';
  }

  /**
   * Plan-specific notification data
   * Can include claim status updates, benefit information, or coverage alerts
   */
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PlanNotificationData)
  data: PlanNotificationData;
}

/**
 * Health journey notification data
 * Contains specific data structures for health-related notifications
 */
export class HealthNotificationData {
  /**
   * Health metric data for notifications about new measurements or alerts
   */
  @IsObject()
  @IsOptional()
  metric?: Partial<IHealthMetric>;

  /**
   * Type of health metric if metric data is included
   */
  @IsEnum(MetricType)
  @IsOptional()
  metricType?: MetricType;

  /**
   * Health goal data for notifications about goal progress or completion
   */
  @IsObject()
  @IsOptional()
  goal?: Partial<IHealthGoal>;

  /**
   * Type of health goal if goal data is included
   */
  @IsEnum(GoalType)
  @IsOptional()
  goalType?: GoalType;

  /**
   * Additional context information for the health notification
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

/**
 * Care journey notification data
 * Contains specific data structures for care-related notifications
 */
export class CareNotificationData {
  /**
   * Appointment data for notifications about upcoming or changed appointments
   */
  @IsObject()
  @IsOptional()
  appointment?: Partial<IAppointment>;

  /**
   * Appointment status if appointment data is included
   */
  @IsEnum(AppointmentStatus)
  @IsOptional()
  appointmentStatus?: AppointmentStatus;

  /**
   * Medication data for notifications about medication reminders or refills
   */
  @IsObject()
  @IsOptional()
  medication?: Partial<IMedication>;

  /**
   * Additional context information for the care notification
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

/**
 * Plan journey notification data
 * Contains specific data structures for plan-related notifications
 */
export class PlanNotificationData {
  /**
   * Claim data for notifications about claim status updates
   */
  @IsObject()
  @IsOptional()
  claim?: Partial<IClaim>;

  /**
   * Claim status if claim data is included
   */
  @IsEnum(ClaimStatus)
  @IsOptional()
  claimStatus?: ClaimStatus;

  /**
   * Benefit data for notifications about benefit usage or changes
   */
  @IsObject()
  @IsOptional()
  benefit?: Partial<IBenefit>;

  /**
   * Additional context information for the plan notification
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

/**
 * Type guard to check if a notification event is a health journey notification
 * @param event The notification event to check
 * @returns True if the event is a health journey notification
 */
export function isHealthJourneyNotification(
  event: JourneyNotificationEventDto,
): event is HealthJourneyNotificationEventDto {
  return event.journeyId === 'health';
}

/**
 * Type guard to check if a notification event is a care journey notification
 * @param event The notification event to check
 * @returns True if the event is a care journey notification
 */
export function isCareJourneyNotification(
  event: JourneyNotificationEventDto,
): event is CareJourneyNotificationEventDto {
  return event.journeyId === 'care';
}

/**
 * Type guard to check if a notification event is a plan journey notification
 * @param event The notification event to check
 * @returns True if the event is a plan journey notification
 */
export function isPlanJourneyNotification(
  event: JourneyNotificationEventDto,
): event is PlanJourneyNotificationEventDto {
  return event.journeyId === 'plan';
}