import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';

import { CareEventType } from '../interfaces/journey-events.interface';

/**
 * Enum for medication dosage units
 */
export enum MedicationDosageUnit {
  MG = 'mg',
  MCG = 'mcg',
  G = 'g',
  ML = 'ml',
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  DROP = 'drop',
  PATCH = 'patch',
  SPRAY = 'spray',
  UNIT = 'unit'
}

/**
 * Enum for medication adherence status
 */
export enum MedicationAdherenceStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  SKIPPED = 'skipped',
  DELAYED = 'delayed'
}

/**
 * Enum for medication frequency
 */
export enum MedicationFrequency {
  ONCE_DAILY = 'once_daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  EVERY_MORNING = 'every_morning',
  EVERY_EVENING = 'every_evening',
  EVERY_NIGHT = 'every_night',
  EVERY_OTHER_DAY = 'every_other_day',
  WEEKLY = 'weekly',
  AS_NEEDED = 'as_needed',
  CUSTOM = 'custom'
}

/**
 * DTO for medication identification
 */
export class MedicationIdentificationDto {
  /**
   * Unique identifier for the medication record
   */
  @IsUUID(4)
  @IsNotEmpty()
  id: string;

  /**
   * Name of the medication
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  /**
   * Dosage amount (numeric value)
   */
  @IsNumber()
  @IsPositive()
  dosage: number;

  /**
   * Unit of the dosage (mg, ml, tablet, etc.)
   */
  @IsEnum(MedicationDosageUnit)
  dosageUnit: MedicationDosageUnit;

  /**
   * Frequency of medication intake
   */
  @IsEnum(MedicationFrequency)
  frequency: MedicationFrequency;

  /**
   * Custom frequency description (when frequency is CUSTOM)
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customFrequency?: string;
}

/**
 * Base DTO for medication events
 */
export class MedicationEventDto {
  /**
   * Type of the medication event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_ADDED | 
        CareEventType.MEDICATION_UPDATED | 
        CareEventType.MEDICATION_REMOVED | 
        CareEventType.MEDICATION_TAKEN | 
        CareEventType.MEDICATION_MISSED | 
        CareEventType.MEDICATION_REMINDER;

  /**
   * ID of the user associated with the medication
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Medication identification information
   */
  @IsObject()
  @ValidateNested()
  @Type(() => MedicationIdentificationDto)
  medication: MedicationIdentificationDto;

  /**
   * Timestamp of the event
   */
  @IsISO8601()
  timestamp: string;

  /**
   * Optional correlation ID for tracking related events
   */
  @IsOptional()
  @IsString()
  @IsUUID(4)
  correlationId?: string;
}

/**
 * DTO for medication adherence events (taken, missed, skipped)
 */
export class MedicationAdherenceEventDto extends MedicationEventDto {
  /**
   * Type of the medication adherence event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_TAKEN | 
        CareEventType.MEDICATION_MISSED;

  /**
   * Status of medication adherence
   */
  @IsEnum(MedicationAdherenceStatus)
  adherenceStatus: MedicationAdherenceStatus;

  /**
   * Timestamp when the medication was taken or missed
   */
  @IsDate()
  @Type(() => Date)
  adherenceTimestamp: Date;

  /**
   * Scheduled time when the medication was supposed to be taken
   */
  @IsDate()
  @Type(() => Date)
  scheduledTime: Date;

  /**
   * Time difference in minutes between scheduled and actual time
   * Positive values indicate the medication was taken later than scheduled
   * Negative values indicate the medication was taken earlier than scheduled
   * Only applicable when adherenceStatus is TAKEN or DELAYED
   */
  @IsOptional()
  @IsNumber()
  timeDifferenceMinutes?: number;

  /**
   * Current streak of consecutive days with proper adherence
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  adherenceStreak?: number;

  /**
   * Optional reason for missing or skipping medication
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for medication taken events
 */
export class MedicationTakenEventDto extends MedicationAdherenceEventDto {
  /**
   * Type of the medication taken event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_TAKEN;

  /**
   * Status is always TAKEN for this event
   */
  @IsEnum(MedicationAdherenceStatus)
  adherenceStatus: MedicationAdherenceStatus.TAKEN;

  /**
   * Whether the full dosage was taken
   */
  @IsBoolean()
  fullDosage: boolean;

  /**
   * Actual dosage taken if different from prescribed
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  actualDosage?: number;
}

/**
 * DTO for medication missed events
 */
export class MedicationMissedEventDto extends MedicationAdherenceEventDto {
  /**
   * Type of the medication missed event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_MISSED;

  /**
   * Status is always MISSED for this event
   */
  @IsEnum(MedicationAdherenceStatus)
  adherenceStatus: MedicationAdherenceStatus.MISSED;

  /**
   * Whether the missed dose should be taken late or skipped entirely
   */
  @IsBoolean()
  shouldTakeLate: boolean;

  /**
   * Whether a notification was sent about the missed medication
   */
  @IsBoolean()
  notificationSent: boolean;
}

/**
 * DTO for medication reminder events
 */
export class MedicationReminderEventDto extends MedicationEventDto {
  /**
   * Type of the medication reminder event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_REMINDER;

  /**
   * Scheduled time for taking the medication
   */
  @IsDate()
  @Type(() => Date)
  scheduledTime: Date;

  /**
   * Type of reminder (initial, follow-up, final)
   */
  @IsString()
  @IsEnum(['initial', 'follow-up', 'final'])
  reminderType: 'initial' | 'follow-up' | 'final';

  /**
   * Whether the user has acknowledged the reminder
   */
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;

  /**
   * Timestamp when the reminder was acknowledged
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  acknowledgedAt?: Date;
}

/**
 * DTO for medication added events
 */
export class MedicationAddedEventDto extends MedicationEventDto {
  /**
   * Type of the medication added event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_ADDED;

  /**
   * Start date of the medication regimen
   */
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  /**
   * Optional end date of the medication regimen
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  /**
   * Whether reminders are enabled for this medication
   */
  @IsBoolean()
  reminderEnabled: boolean;

  /**
   * Optional notes or instructions for the medication
   */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /**
   * Optional ID of the healthcare provider who prescribed the medication
   */
  @IsOptional()
  @IsUUID(4)
  providerId?: string;

  /**
   * Optional ID of the prescription associated with this medication
   */
  @IsOptional()
  @IsString()
  prescriptionId?: string;
}

/**
 * DTO for medication updated events
 */
export class MedicationUpdatedEventDto extends MedicationAddedEventDto {
  /**
   * Type of the medication updated event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_UPDATED;

  /**
   * Previous medication details before the update
   */
  @IsObject()
  @ValidateNested()
  @Type(() => MedicationIdentificationDto)
  previousMedication: MedicationIdentificationDto;

  /**
   * Fields that were updated
   */
  @IsString({ each: true })
  updatedFields: string[];
}

/**
 * DTO for medication removed events
 */
export class MedicationRemovedEventDto extends MedicationEventDto {
  /**
   * Type of the medication removed event
   */
  @IsEnum(CareEventType)
  type: CareEventType.MEDICATION_REMOVED;

  /**
   * Reason for removing the medication
   */
  @IsString()
  @MaxLength(500)
  reason: string;

  /**
   * Whether the medication was completed as prescribed
   */
  @IsBoolean()
  completedAsPrescibed: boolean;

  /**
   * Date when the medication was actually stopped
   */
  @IsDate()
  @Type(() => Date)
  stoppedDate: Date;
}