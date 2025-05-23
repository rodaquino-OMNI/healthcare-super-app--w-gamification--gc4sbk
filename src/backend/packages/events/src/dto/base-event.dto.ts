import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base Event Data Transfer Object
 * 
 * This DTO serves as the foundation for all event types in the AUSTA SuperApp.
 * It enforces strict runtime validation for common event properties and ensures
 * consistent event processing across the gamification engine and notification service.
 * 
 * All journey-specific events should extend this base class and provide their own
 * type-safe data structure through the generic parameter.
 * 
 * @template T - The type of the event data payload
 */
export class BaseEventDto<T extends Record<string, any> = Record<string, any>> {
  /**
   * The type of the event.
   * 
   * This identifies the specific action or occurrence that triggered the event.
   * Event types should follow a consistent naming convention:
   * - Format: `{JOURNEY}_{ENTITY}_{ACTION}`
   * - Examples: 
   *   - `HEALTH_METRIC_RECORDED` - User recorded a health metric
   *   - `CARE_APPOINTMENT_BOOKED` - User booked a medical appointment
   *   - `PLAN_CLAIM_SUBMITTED` - User submitted an insurance claim
   *   - `HEALTH_GOAL_ACHIEVED` - User achieved a health goal
   *   - `CARE_MEDICATION_TAKEN` - User logged taking medication
   * 
   * @example "HEALTH_METRIC_RECORDED"
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsString({ message: 'Event type must be a string' })
  type: string;

  /**
   * The ID of the user associated with the event.
   * 
   * This must be a valid UUID and identify a registered user in the system.
   * For system-generated events that don't relate to a specific user,
   * a system user ID should be used.
   * 
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  userId: string;

  /**
   * The journey associated with the event.
   * 
   * Identifies which journey context the event belongs to.
   * This enables proper routing and processing of events within the system.
   * 
   * Possible values: 
   * - 'health' - My Health journey
   * - 'care' - Care Now journey
   * - 'plan' - My Plan & Benefits journey
   * 
   * @example "health"
   */
  @IsNotEmpty({ message: 'Journey is required' })
  @IsString({ message: 'Journey must be a string' })
  journey: string;

  /**
   * The timestamp when the event occurred.
   * 
   * Must be a valid ISO-8601 formatted date-time string.
   * This enables proper chronological processing and analysis of events.
   * 
   * @example "2023-04-15T14:32:17.123Z"
   */
  @IsNotEmpty({ message: 'Timestamp is required' })
  @IsISO8601({ strict: true }, { message: 'Timestamp must be a valid ISO-8601 date string' })
  timestamp: string;

  /**
   * The data payload associated with the event.
   * 
   * Contains journey-specific details about the event. The structure varies
   * based on the event type and is defined by the generic parameter T.
   * 
   * Examples:
   * - Health journey: metric type, value, unit
   * - Care journey: appointment details, provider information
   * - Plan journey: claim amount, claim type
   */
  @IsNotEmpty({ message: 'Event data is required' })
  @IsObject({ message: 'Event data must be an object' })
  @ValidateNested()
  @Type(() => Object)
  data: T;

  /**
   * Creates a new BaseEventDto instance.
   * 
   * @param partial - Partial event data to initialize the instance
   */
  constructor(partial?: Partial<BaseEventDto<T>>) {
    if (partial) {
      Object.assign(this, partial);
    }
    
    // Set default timestamp to current time if not provided
    if (!this.timestamp) {
      this.timestamp = new Date().toISOString();
    }
  }
}