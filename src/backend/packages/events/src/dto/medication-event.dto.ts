import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsISO8601, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  Min, 
  Max, 
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { CareEventType } from '../interfaces/journey-events.interface';

/**
 * Enum representing the possible adherence states for a medication
 */
export enum MedicationAdherenceStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  SKIPPED = 'skipped',
  DELAYED = 'delayed'
}

/**
 * Enum representing the possible units for medication dosage
 */
export enum MedicationDosageUnit {
  MG = 'mg',
  MCG = 'mcg',
  G = 'g',
  ML = 'ml',
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  PILL = 'pill',
  DROP = 'drop',
  SPRAY = 'spray',
  PATCH = 'patch',
  INJECTION = 'injection',
  OTHER = 'other'
}

/**
 * DTO for medication dosage information
 */
export class MedicationDosageDto {
  /**
   * The amount of medication taken
   * @example 500
   */
  @IsNumber()
  @Min(0)
  amount: number;

  /**
   * The unit of measurement for the dosage
   * @example MedicationDosageUnit.MG
   */
  @IsEnum(MedicationDosageUnit)
  unit: MedicationDosageUnit;

  /**
   * Optional additional information about the dosage
   * @example 'Take with food'
   */
  @IsOptional()
  @IsString()
  instructions?: string;
}

/**
 * DTO for medication identification
 */
export class MedicationIdentifierDto {
  /**
   * Unique identifier for the medication
   */
  @IsUUID()
  @IsNotEmpty()
  id: string;

  /**
   * Name of the medication
   * @example 'Lisinopril'
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Optional medication code (NDC, RxNorm, etc.)
   * @example '12345-6789-01'
   */
  @IsOptional()
  @IsString()
  code?: string;

  /**
   * Optional medication type or category
   * @example 'antihypertensive'
   */
  @IsOptional()
  @IsString()
  type?: string;
}

/**
 * Base DTO for medication events
 */
export class MedicationEventDto {
  /**
   * The type of medication event
   */
  @IsEnum(CareEventType)
  @IsNotEmpty()
  type: CareEventType;

  /**
   * The ID of the user associated with the medication
   */
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  /**
   * The medication information
   */
  @IsObject()
  @ValidateNested()
  @Type(() => MedicationIdentifierDto)
  medication: MedicationIdentifierDto;

  /**
   * The timestamp of the event in ISO 8601 format
   */
  @IsISO8601()
  @IsNotEmpty()
  timestamp: string;

  /**
   * Optional correlation ID for tracking related events
   */
  @IsOptional()
  @IsString()
  correlationId?: string;
}

/**
 * DTO for medication taken events
 * Used when a user records taking their medication
 */
export class MedicationTakenEventDto extends MedicationEventDto {
  /**
   * The type of medication event - must be MEDICATION_TAKEN
   */
  @IsEnum(CareEventType)
  @IsNotEmpty()
  type: CareEventType.MEDICATION_TAKEN;

  /**
   * The dosage information for the medication taken
   */
  @ValidateNested()
  @Type(() => MedicationDosageDto)
  dosage: MedicationDosageDto;

  /**
   * The scheduled time when the medication should have been taken
   */
  @IsISO8601()
  scheduledTime: string;

  /**
   * Whether the medication was taken on time according to the schedule
   */
  @IsBoolean()
  takenOnTime: boolean;

  /**
   * The number of minutes delayed from the scheduled time (if not taken on time)
   * Only required if takenOnTime is false
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  delayMinutes?: number;

  /**
   * Optional notes provided by the user
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for medication missed events
 * Used when a user misses taking their medication
 */
export class MedicationMissedEventDto extends MedicationEventDto {
  /**
   * The type of medication event - must be MEDICATION_MISSED
   */
  @IsEnum(CareEventType)
  @IsNotEmpty()
  type: CareEventType.MEDICATION_MISSED;

  /**
   * The scheduled time when the medication should have been taken
   */
  @IsISO8601()
  scheduledTime: string;

  /**
   * The reason why the medication was missed
   */
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * The number of reminders sent before marking as missed
   */
  @IsNumber()
  @Min(0)
  remindersSent: number;

  /**
   * Whether this medication is critical and missing it requires attention
   */
  @IsBoolean()
  isCritical: boolean;
}

/**
 * DTO for medication added events
 * Used when a new medication is added to a user's regimen
 */
export class MedicationAddedEventDto extends MedicationEventDto {
  /**
   * The type of medication event - must be MEDICATION_ADDED
   */
  @IsEnum(CareEventType)
  @IsNotEmpty()
  type: CareEventType.MEDICATION_ADDED;

  /**
   * The date when the medication was prescribed
   */
  @IsISO8601()
  prescriptionDate: string;

  /**
   * The dosage information for the medication
   */
  @ValidateNested()
  @Type(() => MedicationDosageDto)
  dosage: MedicationDosageDto;

  /**
   * The frequency of the medication (e.g., 'daily', 'twice daily', 'every 8 hours')
   */
  @IsString()
  @IsNotEmpty()
  frequency: string;

  /**
   * The duration of the medication regimen in days
   */
  @IsNumber()
  @Min(1)
  duration: number;

  /**
   * The start date of the medication regimen
   */
  @IsISO8601()
  startDate: string;

  /**
   * The optional end date of the medication regimen
   */
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  /**
   * Whether reminders are enabled for this medication
   */
  @IsBoolean()
  remindersEnabled: boolean;

  /**
   * Optional provider who prescribed the medication
   */
  @IsOptional()
  @IsString()
  provider?: string;
}

/**
 * DTO for medication refilled events
 * Used when a medication is refilled
 */
export class MedicationRefilledEventDto extends MedicationEventDto {
  /**
   * The type of medication event - must be MEDICATION_REFILLED
   */
  @IsEnum(CareEventType)
  @IsNotEmpty()
  type: CareEventType.MEDICATION_REFILLED;

  /**
   * The date when the medication was refilled
   */
  @IsISO8601()
  refillDate: string;

  /**
   * The quantity of medication refilled
   */
  @IsNumber()
  @Min(1)
  quantity: number;

  /**
   * The number of days the refill will last
   */
  @IsNumber()
  @Min(1)
  daysSupply: number;

  /**
   * Optional pharmacy where the refill was obtained
   */
  @IsOptional()
  @IsString()
  pharmacy?: string;

  /**
   * Whether this was an automatic refill
   */
  @IsBoolean()
  isAutoRefill: boolean;

  /**
   * The number of refills remaining
   */
  @IsNumber()
  @Min(0)
  remainingRefills: number;
}

/**
 * DTO for tracking medication adherence status
 * Used for gamification and achievement tracking
 */
export class MedicationAdherenceStatusDto {
  /**
   * The user ID associated with the adherence status
   */
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  /**
   * The medication identifier
   */
  @ValidateNested()
  @Type(() => MedicationIdentifierDto)
  medication: MedicationIdentifierDto;

  /**
   * The current adherence status
   */
  @IsEnum(MedicationAdherenceStatus)
  status: MedicationAdherenceStatus;

  /**
   * The adherence rate as a percentage (0-100)
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  adherenceRate: number;

  /**
   * The number of doses taken on time
   */
  @IsNumber()
  @Min(0)
  dosesTakenOnTime: number;

  /**
   * The number of doses taken late
   */
  @IsNumber()
  @Min(0)
  dosesTakenLate: number;

  /**
   * The number of doses missed
   */
  @IsNumber()
  @Min(0)
  dosesMissed: number;

  /**
   * The current streak of consecutive doses taken
   */
  @IsNumber()
  @Min(0)
  currentStreak: number;

  /**
   * The longest streak achieved
   */
  @IsNumber()
  @Min(0)
  longestStreak: number;

  /**
   * The timestamp when the status was last updated
   */
  @IsISO8601()
  lastUpdated: string;
}

/**
 * Union type for all medication event DTOs
 */
export type MedicationEvent = 
  | MedicationTakenEventDto
  | MedicationMissedEventDto
  | MedicationAddedEventDto
  | MedicationRefilledEventDto;