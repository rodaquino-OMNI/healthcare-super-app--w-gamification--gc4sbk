import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { FilterDto } from '@app/shared';
import { JourneyType } from '@austa/interfaces';

/**
 * Enum representing the possible event types that rules can listen for
 * Used for filtering rules by event type
 */
export enum EventType {
  STEPS_RECORDED = 'STEPS_RECORDED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  BENEFIT_USED = 'BENEFIT_USED',
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED'
}

/**
 * RuleFilterDto - Extends the shared FilterDto with rule-specific filter criteria
 * 
 * This DTO enables API consumers to efficiently search for rules with specific 
 * characteristics, improving the usability of rule management endpoints and 
 * performance of rule-related queries.
 */
export class RuleFilterDto extends FilterDto {
  /**
   * Filter rules by the type of event they listen for
   * @example 'STEPS_RECORDED'
   */
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  /**
   * Filter rules by the journey they belong to (health, care, plan)
   * Allows for journey-specific rule management
   * @example 'health'
   */
  @IsOptional()
  @IsEnum(JourneyType)
  journey?: JourneyType;

  /**
   * Filter rules by their enabled/disabled status
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /**
   * Filter rules by name using partial text matching
   * @example 'daily'
   */
  @IsOptional()
  @IsString()
  name?: string;
}