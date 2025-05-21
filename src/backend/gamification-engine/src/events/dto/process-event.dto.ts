import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  GamificationEvent, 
  EventType, 
  HealthEventPayload, 
  CareEventPayload, 
  PlanEventPayload,
  EventVersion
} from '@austa/interfaces/gamification/events';

/**
 * Data transfer object for processing gamification events across all journeys.
 * This is the main entry point for event handling in the system and is used by
 * the EventsService.processEvent method.
 *
 * @implements {GamificationEvent} from @austa/interfaces package
 */
export class ProcessEventDto implements GamificationEvent {
  /**
   * The type of event being processed
   * @example 'HEALTH_GOAL_COMPLETED', 'APPOINTMENT_BOOKED', 'CLAIM_SUBMITTED'
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be a valid EventType' })
  type: EventType;

  /**
   * The unique identifier of the user who triggered the event
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /**
   * The journey from which the event originated
   * @example 'health', 'care', 'plan'
   */
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  journey?: string;

  /**
   * The version of the event schema being used
   * Used for backward compatibility during schema evolution
   * @default '1.0'
   */
  @IsOptional()
  @IsEnum(EventVersion, { message: 'Event version must be a valid version' })
  version: EventVersion = EventVersion.V1_0;

  /**
   * The timestamp when the event occurred
   * @default current ISO timestamp
   */
  @IsOptional()
  @IsString({ message: 'Timestamp must be a string' })
  timestamp: string = new Date().toISOString();

  /**
   * The payload data associated with the event
   * Type varies based on the event type and journey
   */
  @IsNotEmpty({ message: 'Event data is required' })
  @IsObject({ message: 'Event data must be an object' })
  @ValidateNested()
  @Type(() => Object)
  data: HealthEventPayload | CareEventPayload | PlanEventPayload;
}

/**
 * Health journey specific event DTO with strongly typed payload
 */
export class HealthProcessEventDto extends ProcessEventDto {
  @ValidateNested()
  @Type(() => Object)
  declare data: HealthEventPayload;
}

/**
 * Care journey specific event DTO with strongly typed payload
 */
export class CareProcessEventDto extends ProcessEventDto {
  @ValidateNested()
  @Type(() => Object)
  declare data: CareEventPayload;
}

/**
 * Plan journey specific event DTO with strongly typed payload
 */
export class PlanProcessEventDto extends ProcessEventDto {
  @ValidateNested()
  @Type(() => Object)
  declare data: PlanEventPayload;
}