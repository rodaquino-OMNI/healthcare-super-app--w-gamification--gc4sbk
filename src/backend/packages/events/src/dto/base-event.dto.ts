import { IsNotEmpty, IsString, IsObject, IsUUID, IsIn, IsISO8601 } from 'class-validator';

/**
 * Base data transfer object for all events in the AUSTA SuperApp.
 * This defines the core structure and validation rules for events across all journeys.
 * All journey-specific event DTOs should extend this base class.
 */
export class BaseEventDto {
  /**
   * The type of the event.
   * Examples: 
   * - 'HEALTH_METRIC_RECORDED' - User recorded a health metric
   * - 'APPOINTMENT_BOOKED' - User booked a medical appointment
   * - 'CLAIM_SUBMITTED' - User submitted an insurance claim
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsString({ message: 'Event type must be a string' })
  type: string;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  userId: string;

  /**
   * The journey associated with the event.
   * Possible values: 
   * - 'health' - My Health journey
   * - 'care' - Care Now journey
   * - 'plan' - My Plan & Benefits journey
   */
  @IsNotEmpty({ message: 'Journey is required' })
  @IsString({ message: 'Journey must be a string' })
  @IsIn(['health', 'care', 'plan'], { message: 'Journey must be one of: health, care, plan' })
  journey: string;

  /**
   * The timestamp when the event occurred.
   * Must be a valid ISO 8601 date string.
   */
  @IsNotEmpty({ message: 'Timestamp is required' })
  @IsISO8601({}, { message: 'Timestamp must be a valid ISO 8601 date string' })
  timestamp: string;

  /**
   * The data associated with the event.
   * This contains journey-specific details about the event, such as:
   * - Health journey: metric type, value, unit
   * - Care journey: appointment details, provider information
   * - Plan journey: claim amount, claim type
   */
  @IsNotEmpty({ message: 'Event data is required' })
  @IsObject({ message: 'Event data must be an object' })
  data: Record<string, any>;
}