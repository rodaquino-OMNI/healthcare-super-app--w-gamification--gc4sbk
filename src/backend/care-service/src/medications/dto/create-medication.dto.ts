import { IsString, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { IMedication } from '@austa/interfaces/care';

/**
 * Data Transfer Object for creating a new medication record in the Care journey.
 * 
 * This DTO defines the structure and validation rules for medication data
 * to ensure consistency and integrity when creating medication records.
 * It implements validation using class-validator decorators and aligns with
 * the IMedication interface from the shared interfaces package.
 *
 * @see IMedication - The shared interface definition for medication data
 */
export class CreateMedicationDto implements Pick<IMedication, 'name' | 'dosage' | 'frequency' | 'startDate' | 'endDate' | 'reminderEnabled' | 'notes'> {
  /**
   * Name of the medication as prescribed
   * 
   * @example "Amoxicillin"
   * @example "Lisinopril"
   */
  @IsString()
  name: string;

  /**
   * Dosage amount in appropriate units (e.g., mg, ml)
   * 
   * @example 500 - For 500mg
   * @example 10 - For 10ml
   */
  @IsNumber()
  dosage: number;

  /**
   * How often the medication should be taken
   * 
   * @example "Twice daily"
   * @example "Every 8 hours"
   * @example "Once daily with food"
   */
  @IsString()
  frequency: string;

  /**
   * Date when the medication regimen starts
   * Must be in ISO format (YYYY-MM-DD)
   * 
   * @example "2023-04-15"
   */
  @IsDateString()
  startDate: string;

  /**
   * Optional date when the medication regimen ends
   * Must be in ISO format (YYYY-MM-DD) when provided
   * 
   * @example "2023-04-30"
   */
  @IsOptional()
  @IsDateString()
  endDate: string;

  /**
   * Whether reminders should be enabled for this medication
   * When true, the notification service will send reminders based on frequency
   * 
   * @example true
   */
  @IsBoolean()
  reminderEnabled: boolean;

  /**
   * Optional additional notes about the medication
   * Can include special instructions, side effects to watch for, etc.
   * 
   * @example "Take with food to reduce stomach upset"
   * @example "Avoid grapefruit juice while taking this medication"
   */
  @IsOptional()
  @IsString()
  notes: string;
}