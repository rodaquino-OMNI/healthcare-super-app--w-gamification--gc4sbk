import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsEnum, IsInt, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import {
  GamificationEvent,
  EventType,
  JourneyType,
  HealthEventData,
  CareEventData,
  PlanEventData,
  EventVersion
} from '@austa/interfaces/gamification';

/**
 * Base DTO class for processing events within the gamification engine.
 * This defines the common structure and validation rules for all events received from 
 * various journeys in the AUSTA SuperApp.
 */
export class BaseProcessEventDto implements GamificationEvent {
  /**
   * The type of the event.
   * @example 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_BOOKED', 'CLAIM_SUBMITTED'
   */
  @IsNotEmpty()
  @IsEnum(EventType)
  type: EventType;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The journey associated with the event.
   * @example 'health', 'care', 'plan'
   */
  @IsNotEmpty()
  @IsEnum(JourneyType)
  journey: JourneyType;

  /**
   * The version of the event schema.
   * Used for backward compatibility as the event schema evolves.
   * @default 1
   */
  @IsOptional()
  @IsInt()
  @IsIn([1, 2])
  version: EventVersion = 1;
}

/**
 * DTO for processing health journey events.
 * Contains health-specific data validation.
 */
export class HealthProcessEventDto extends BaseProcessEventDto {
  @IsNotEmpty()
  @IsEnum(JourneyType)
  journey: JourneyType.HEALTH = JourneyType.HEALTH;

  /**
   * Health-specific event data.
   * Contains details like metric type, value, unit, goal progress, etc.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  data: HealthEventData;
}

/**
 * DTO for processing care journey events.
 * Contains care-specific data validation.
 */
export class CareProcessEventDto extends BaseProcessEventDto {
  @IsNotEmpty()
  @IsEnum(JourneyType)
  journey: JourneyType.CARE = JourneyType.CARE;

  /**
   * Care-specific event data.
   * Contains details like appointment info, provider details, medication adherence, etc.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  data: CareEventData;
}

/**
 * DTO for processing plan journey events.
 * Contains plan-specific data validation.
 */
export class PlanProcessEventDto extends BaseProcessEventDto {
  @IsNotEmpty()
  @IsEnum(JourneyType)
  journey: JourneyType.PLAN = JourneyType.PLAN;

  /**
   * Plan-specific event data.
   * Contains details like claim amount, benefit usage, plan selection, etc.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  data: PlanEventData;
}

/**
 * Primary DTO for processing events within the gamification engine.
 * This defines the structure and validation rules for events received from 
 * various journeys in the AUSTA SuperApp. Events are used to award points,
 * track achievements, and trigger gamification elements.
 * 
 * This DTO uses a discriminated union type to ensure type safety for journey-specific
 * event data, while providing runtime validation through class-validator decorators.
 * 
 * The versioning support allows for backward compatibility as the event schema evolves,
 * ensuring that older events can still be processed correctly while new features are added.
 * 
 * @example
 * // Health journey event
 * {
 *   type: EventType.HEALTH_METRIC_RECORDED,
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   journey: JourneyType.HEALTH,
 *   data: {
 *     metricType: 'HEART_RATE',
 *     value: 75,
 *     unit: 'bpm'
 *   },
 *   version: 1
 * }
 * 
 * // Care journey event
 * {
 *   type: EventType.APPOINTMENT_BOOKED,
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   journey: JourneyType.CARE,
 *   data: {
 *     appointmentId: '123',
 *     providerId: '456',
 *     appointmentType: 'VIRTUAL'
 *   },
 *   version: 1
 * }
 * 
 * // Plan journey event
 * {
 *   type: EventType.CLAIM_SUBMITTED,
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   journey: JourneyType.PLAN,
 *   data: {
 *     claimId: '789',
 *     amount: 150.00,
 *     claimType: 'MEDICAL'
 *   },
 *   version: 1
 * }
 */
export type ProcessEventDto = HealthProcessEventDto | CareProcessEventDto | PlanProcessEventDto;