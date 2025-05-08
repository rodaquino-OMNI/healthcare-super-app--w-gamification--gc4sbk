import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDate, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Import shared interfaces from @austa/interfaces package
import { JourneyType as SharedJourneyType } from '@austa/interfaces/journey';
import { EventBase } from '@austa/interfaces/gamification/events';

/**
 * Re-export the JourneyType enum from @austa/interfaces/journey
 * to maintain consistency across the application.
 */
export { SharedJourneyType as JourneyType };

/**
 * Base Data Transfer Object for all gamification events.
 * 
 * This DTO defines common properties and validation rules that apply to all
 * gamification events across the AUSTA SuperApp. It serves as the foundation
 * for journey-specific event DTOs and ensures consistent validation and
 * type safety throughout the event processing pipeline.
 *
 * All journey-specific event DTOs should extend this base class and add their
 * own specific properties and validation rules. This ensures a standardized
 * approach to event processing across all journeys while allowing for
 * journey-specific customization.
 *
 * This class implements the EventBase interface from @austa/interfaces/gamification/events
 * to ensure consistency with the shared type definitions used across the application.
 *
 * @example
 * ```typescript
 * export class HealthMetricRecordedEvent extends BaseEventDto {
 *   @IsNotEmpty()
 *   @IsString()
 *   metricType: string;
 *
 *   @IsNotEmpty()
 *   @IsNumber()
 *   value: number;
 *
 *   @IsNotEmpty()
 *   @IsString()
 *   unit: string;
 * }
 * ```
 *
 * @abstract This class is meant to be extended by specific event DTOs
 */
export abstract class BaseEventDto implements EventBase {
  /**
   * The type of the event.
   * This field identifies the specific event type and is used for routing and processing.
   * 
   * Each derived class must provide a specific event type value.
   * Examples include: 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_BOOKED', 'CLAIM_SUBMITTED'
   */
  @ApiProperty({
    description: 'The type of the event',
    example: 'HEALTH_METRIC_RECORDED',
    required: true
  })
  @IsNotEmpty({ message: 'Event type is required' })
  @IsString({ message: 'Event type must be a string' })
  abstract type: string;

  /**
   * The unique identifier of the user who triggered the event.
   * Must be a valid UUID that corresponds to a registered user in the system.
   */
  @ApiProperty({
    description: 'The unique identifier of the user who triggered the event',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID(4, { message: 'User ID must be a valid UUID v4' })
  userId: string;

  /**
   * The timestamp when the event occurred.
   * Automatically converted to a Date object during validation.
   * 
   * This field is crucial for time-based gamification features like streaks,
   * daily challenges, and time-limited quests.
   */
  @ApiProperty({
    description: 'The timestamp when the event occurred',
    example: '2023-04-15T14:30:00Z',
    required: true
  })
  @IsNotEmpty({ message: 'Timestamp is required' })
  @IsDate({ message: 'Timestamp must be a valid date' })
  @Type(() => Date)
  timestamp: Date;

  /**
   * The journey associated with the event.
   * Must be one of the predefined journey types: health, care, or plan.
   * 
   * This field is used to categorize events and apply journey-specific
   * gamification rules, achievements, and rewards.
   */
  @ApiProperty({
    description: 'The journey associated with the event',
    enum: JourneyType,
    example: JourneyType.HEALTH,
    required: true
  })
  @IsNotEmpty({ message: 'Journey is required' })
  @IsEnum(JourneyType, { 
    message: `Journey must be one of the following values: ${Object.values(JourneyType).join(', ')}`
  })
  journey: JourneyType;

  /**
   * The schema version of the event.
   * Used for backward compatibility and schema evolution.
   * 
   * This field enables the gamification engine to handle different versions
   * of the same event type, allowing for schema changes over time without
   * breaking existing event processing logic.
   * 
   * Defaults to 1 if not provided.
   */
  @ApiProperty({
    description: 'The schema version of the event',
    example: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsInt({ message: 'Version must be an integer' })
  @Min(1, { message: 'Version must be at least 1' })
  version: number = 1;
  
  /**
   * The data associated with the event.
   * This contains journey-specific details about the event.
   * 
   * Each derived class must implement this with appropriate validation
   * for the specific event type.
   * 
   * Examples:
   * - Health journey: metric type, value, unit
   * - Care journey: appointment details, provider information
   * - Plan journey: claim amount, claim type
   */
  @ApiProperty({
    description: 'The data associated with the event',
    required: true
  })
  @IsNotEmpty({ message: 'Event data is required' })
  abstract data: Record<string, any>;
  
  /**
   * Returns the specific type of the event as a string.
   * 
   * This method provides a standardized way to access the event type
   * without directly accessing the type property, which may be implemented
   * differently in derived classes.
   * 
   * @returns The event type as a string
   */
  getEventType(): string {
    return this.type;
  }
}