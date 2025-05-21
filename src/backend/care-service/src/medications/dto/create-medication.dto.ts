import { IsString, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';

/**
 * Data Transfer Object for creating a new medication record in the Care Journey.
 * This DTO defines the structure and validation rules for medication data
 * to ensure consistency and integrity when creating medication records.
 * 
 * @description Used in the Medication Tracking feature (F-114) to validate medication creation requests
 * @see MedicationsController.create method for usage
 */
export class CreateMedicationDto {
  /**
   * Name of the medication (generic or brand name)
   * @example "Amoxicillin"
   * @example "Tylenol"
   */
  @IsString()
  name: string;

  /**
   * Dosage amount in appropriate units (e.g., mg, ml)
   * @example 500 // For 500mg
   * @example 10 // For 10ml
   */
  @IsNumber()
  dosage: number;

  /**
   * How often the medication should be taken
   * @example "Twice daily"
   * @example "Every 8 hours"
   * @example "As needed for pain"
   */
  @IsString()
  frequency: string;

  /**
   * Date when the medication regimen starts (ISO format)
   * @example "2023-04-15"
   */
  @IsDateString()
  startDate: string;

  /**
   * Optional date when the medication regimen ends (ISO format)
   * If not provided, the medication is considered ongoing
   * @example "2023-04-30"
   */
  @IsOptional()
  @IsDateString()
  endDate: string;

  /**
   * Whether reminders should be enabled for this medication
   * When true, the notification service will send reminders based on frequency
   * @example true
   */
  @IsBoolean()
  reminderEnabled: boolean;

  /**
   * Optional additional notes about the medication
   * Can include administration instructions, side effects to watch for, etc.
   * @example "Take with food to reduce stomach upset"
   * @example "Avoid alcohol while taking this medication"
   */
  @IsOptional()
  @IsString()
  notes: string;
}