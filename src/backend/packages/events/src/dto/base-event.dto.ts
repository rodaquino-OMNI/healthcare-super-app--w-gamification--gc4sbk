import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Event Data Transfer Object
 * 
 * This DTO serves as the foundation for all event types in the AUSTA SuperApp.
 * It standardizes the structure and validation rules for events across all journeys
 * (Health, Care, Plan) and ensures consistent event processing in the gamification
 * engine and notification service.
 * 
 * @template T - The type of data payload carried by the event
 */
export class BaseEventDto<T = unknown> {
  /**
   * The type of the event.
   * 
   * Examples: 
   * - 'HEALTH_METRIC_RECORDED' - User recorded a health metric
   * - 'APPOINTMENT_BOOKED' - User booked a medical appointment
   * - 'CLAIM_SUBMITTED' - User submitted an insurance claim
   * - 'MEDICATION_TAKEN' - User logged taking medication
   * - 'GOAL_ACHIEVED' - User achieved a health goal
   */
  @ApiProperty({
    description: 'The type of the event',
    example: 'HEALTH_METRIC_RECORDED',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @ApiProperty({
    description: 'The ID of the user associated with the event',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The data associated with the event.
   * This contains journey-specific details about the event.
   * 
   * The type parameter T allows for strongly-typed event data
   * specific to each event type.
   */
  @ApiProperty({
    description: 'The data associated with the event',
    required: true
  })
  @IsNotEmpty()
  @IsObject()
  data: T;

  /**
   * The journey associated with the event.
   * 
   * Possible values: 
   * - 'health' - My Health journey
   * - 'care' - Care Now journey
   * - 'plan' - My Plan & Benefits journey
   */
  @ApiProperty({
    description: 'The journey associated with the event',
    example: 'health',
    enum: ['health', 'care', 'plan'],
    required: false
  })
  @IsOptional()
  @IsString()
  journey?: string;

  /**
   * The timestamp when the event occurred.
   * Must be a valid ISO-8601 formatted date-time string.
   * 
   * Example: '2023-04-01T12:00:00Z'
   */
  @ApiProperty({
    description: 'The timestamp when the event occurred (ISO-8601 format)',
    example: '2023-04-01T12:00:00Z',
    required: true
  })
  @IsNotEmpty()
  @IsISO8601()
  timestamp: string;

  /**
   * Creates a new BaseEventDto instance.
   * 
   * @param partial - Partial data to initialize the DTO
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