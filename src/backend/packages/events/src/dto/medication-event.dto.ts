import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Enum representing the possible medication adherence states
 */
export enum MedicationAdherenceState {
  TAKEN = 'TAKEN',       // Medication was taken as prescribed
  SKIPPED = 'SKIPPED',   // Medication was intentionally skipped
  MISSED = 'MISSED',     // Medication was unintentionally missed
  SCHEDULED = 'SCHEDULED' // Medication is scheduled but not yet taken
}

/**
 * Enum representing the possible medication dosage units
 */
export enum MedicationDosageUnit {
  MG = 'MG',       // Milligrams
  MCG = 'MCG',     // Micrograms
  G = 'G',         // Grams
  ML = 'ML',       // Milliliters
  TABLET = 'TABLET', // Tablets
  CAPSULE = 'CAPSULE', // Capsules
  DROP = 'DROP',   // Drops
  PATCH = 'PATCH', // Patches
  SPRAY = 'SPRAY', // Sprays
  IU = 'IU',       // International Units
  OTHER = 'OTHER'  // Other units
}

/**
 * Enum representing the possible medication frequency types
 */
export enum MedicationFrequencyType {
  DAILY = 'DAILY',           // Once per day
  TWICE_DAILY = 'TWICE_DAILY', // Twice per day
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY', // Three times per day
  FOUR_TIMES_DAILY = 'FOUR_TIMES_DAILY', // Four times per day
  WEEKLY = 'WEEKLY',         // Once per week
  BIWEEKLY = 'BIWEEKLY',     // Twice per week
  MONTHLY = 'MONTHLY',       // Once per month
  AS_NEEDED = 'AS_NEEDED',   // As needed (PRN)
  CUSTOM = 'CUSTOM'          // Custom schedule
}

/**
 * DTO for medication dosage information
 */
export class MedicationDosageDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsEnum(MedicationDosageUnit)
  unit: MedicationDosageUnit;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instructions?: string;
}

/**
 * DTO for medication schedule information
 */
export class MedicationScheduleDto {
  @IsNotEmpty()
  @IsEnum(MedicationFrequencyType)
  frequencyType: MedicationFrequencyType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  frequencyValue?: number;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customSchedule?: string;
}

/**
 * DTO for medication identification information
 */
export class MedicationIdentificationDto {
  @IsNotEmpty()
  @IsUUID()
  medicationId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  genericName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ndc?: string; // National Drug Code
}

/**
 * DTO for medication event data
 * Used for tracking medication adherence, dosage information, and schedule compliance
 */
export class MedicationEventDto {
  @IsNotEmpty()
  @IsEnum(MedicationAdherenceState)
  adherenceState: MedicationAdherenceState;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MedicationIdentificationDto)
  medication: MedicationIdentificationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MedicationDosageDto)
  dosage: MedicationDosageDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MedicationScheduleDto)
  schedule: MedicationScheduleDto;

  @IsNotEmpty()
  @IsDate()
  scheduledDateTime: Date;

  @IsOptional()
  @IsDate()
  actualDateTime?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRescheduled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reasonForSkippingOrMissing?: string;

  @IsOptional()
  @IsBoolean()
  requiresAttention?: boolean;
}