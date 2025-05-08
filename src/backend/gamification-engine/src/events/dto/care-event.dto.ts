/**
 * @file care-event.dto.ts
 * @description Data Transfer Object for Care Journey specific events.
 * Extends BaseEventDto with care-specific properties and validation rules.
 * Enables proper typing and validation for care-related gamification events.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Support journey-specific event types (Care Journey events)
 * - Develop validation mechanisms for all event types
 * - Integrate with @austa/interfaces package for consistent type definitions across the platform
 */

import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsObject,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
  ValidateNested,
  IsIn,
  Min,
  Max,
  IsISO8601,
  ValidateIf
} from 'class-validator';

import { CareEventType } from '@austa/interfaces/gamification/events';
import { AppointmentType } from '@austa/interfaces/journey/care';

/**
 * Base DTO for all Care Journey events
 * Extends the ProcessEventDto with care-specific validation
 */
export class CareEventDto {
  /**
   * The type of care event
   * @example 'APPOINTMENT_BOOKED', 'MEDICATION_TAKEN', 'TELEMEDICINE_COMPLETED'
   */
  @IsNotEmpty()
  @IsEnum(CareEventType, {
    message: 'Event type must be a valid Care Journey event type'
  })
  type: CareEventType;

  /**
   * The ID of the user associated with the event
   * This must be a valid UUID and identify a registered user in the system
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'User ID must be a valid UUID v4' })
  userId: string;

  /**
   * The data associated with the event
   * Contains care-specific details about the event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => CareEventDataDto)
  data: CareEventDataDto;

  /**
   * The journey associated with the event
   * For care events, this should always be 'care'
   */
  @IsOptional()
  @IsString()
  @IsIn(['care'], { message: 'Journey must be "care" for care events' })
  journey: string = 'care';
}

/**
 * DTO for validating care event data
 */
export class CareEventDataDto {
  /**
   * Appointment data for appointment-related events
   * Required for APPOINTMENT_BOOKED and APPOINTMENT_COMPLETED events
   */
  @ValidateIf(o => [
    CareEventType.APPOINTMENT_BOOKED,
    CareEventType.APPOINTMENT_COMPLETED
  ].includes(o.type as CareEventType))
  @ValidateNested()
  @Type(() => AppointmentDataDto)
  appointment?: AppointmentDataDto;

  /**
   * Medication data for medication-related events
   * Required for MEDICATION_TAKEN and MEDICATION_ADHERENCE_STREAK events
   */
  @ValidateIf(o => [
    CareEventType.MEDICATION_TAKEN,
    CareEventType.MEDICATION_ADHERENCE_STREAK
  ].includes(o.type as CareEventType))
  @ValidateNested()
  @Type(() => MedicationDataDto)
  medication?: MedicationDataDto;

  /**
   * Telemedicine data for telemedicine-related events
   * Required for TELEMEDICINE_SESSION_COMPLETED events
   */
  @ValidateIf(o => [
    CareEventType.TELEMEDICINE_SESSION_COMPLETED
  ].includes(o.type as CareEventType))
  @ValidateNested()
  @Type(() => TelemedicineDataDto)
  telemedicine?: TelemedicineDataDto;

  /**
   * Symptom checker data for symptom-related events
   * Required for SYMPTOM_CHECKED events
   */
  @ValidateIf(o => [
    CareEventType.SYMPTOM_CHECKED
  ].includes(o.type as CareEventType))
  @ValidateNested()
  @Type(() => SymptomCheckerDataDto)
  symptomChecker?: SymptomCheckerDataDto;
}

/**
 * DTO for validating appointment data
 */
export class AppointmentDataDto {
  /**
   * The ID of the appointment
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Appointment ID must be a valid UUID v4' })
  id: string;

  /**
   * The type of appointment
   * @example 'IN_PERSON', 'VIRTUAL', 'HOME_VISIT'
   */
  @IsNotEmpty()
  @IsEnum(AppointmentType, {
    message: 'Appointment type must be a valid appointment type'
  })
  type: AppointmentType;

  /**
   * The status of the appointment
   * @example 'scheduled', 'completed', 'cancelled'
   */
  @IsNotEmpty()
  @IsString()
  @IsIn(['scheduled', 'completed', 'cancelled'], {
    message: 'Appointment status must be one of: scheduled, completed, cancelled'
  })
  status: string;

  /**
   * The ID of the healthcare provider
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Provider ID must be a valid UUID v4' })
  providerId: string;

  /**
   * The date and time the appointment is scheduled for
   * Required for APPOINTMENT_BOOKED events
   */
  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;

  /**
   * The date and time the appointment was completed
   * Required for APPOINTMENT_COMPLETED events
   */
  @IsOptional()
  @IsISO8601()
  completedAt?: string;

  /**
   * The duration of the appointment in minutes
   * Required for APPOINTMENT_COMPLETED events
   */
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(480, { message: 'Duration cannot exceed 8 hours (480 minutes)' })
  duration?: number;

  /**
   * Whether this is the first appointment for the user
   */
  @IsOptional()
  @IsBoolean()
  isFirstAppointment?: boolean;

  /**
   * The specialty area of the appointment
   * @example 'Cardiology', 'Dermatology', 'General Practice'
   */
  @IsOptional()
  @IsString()
  specialtyArea?: string;

  /**
   * Whether a follow-up appointment was scheduled
   * Relevant for APPOINTMENT_COMPLETED events
   */
  @IsOptional()
  @IsBoolean()
  followUpScheduled?: boolean;
}

/**
 * DTO for validating medication data
 */
export class MedicationDataDto {
  /**
   * The ID of the medication
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Medication ID must be a valid UUID v4' })
  id: string;

  /**
   * The action performed with the medication
   * @example 'taken', 'skipped', 'scheduled'
   */
  @IsNotEmpty()
  @IsString()
  @IsIn(['taken', 'skipped', 'scheduled'], {
    message: 'Medication action must be one of: taken, skipped, scheduled'
  })
  action: string;

  /**
   * The date and time the medication was taken
   * Required for MEDICATION_TAKEN events
   */
  @IsOptional()
  @IsISO8601()
  takenAt?: string;

  /**
   * The dosage of the medication
   * @example '10mg', '1 tablet', '2 pills'
   */
  @IsOptional()
  @IsString()
  dosage?: string;

  /**
   * The adherence percentage for the medication
   * Value between 0 and 100
   */
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Adherence percentage must be at least 0' })
  @Max(100, { message: 'Adherence percentage cannot exceed 100' })
  adherencePercentage?: number;

  /**
   * Whether the medication was taken on schedule
   */
  @IsOptional()
  @IsBoolean()
  onSchedule?: boolean;

  /**
   * The number of consecutive days the medication has been taken
   * Required for MEDICATION_ADHERENCE_STREAK events
   */
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Streak days must be at least 1' })
  streakDays?: number;
}

/**
 * DTO for validating telemedicine data
 */
export class TelemedicineDataDto {
  /**
   * The ID of the telemedicine session
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Telemedicine session ID must be a valid UUID v4' })
  id: string;

  /**
   * The ID of the healthcare provider
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Provider ID must be a valid UUID v4' })
  providerId: string;

  /**
   * The start time of the telemedicine session
   */
  @IsNotEmpty()
  @IsISO8601()
  startTime: string;

  /**
   * The end time of the telemedicine session
   */
  @IsNotEmpty()
  @IsISO8601()
  endTime: string;

  /**
   * The duration of the telemedicine session in minutes
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(480, { message: 'Duration cannot exceed 8 hours (480 minutes)' })
  duration: number;

  /**
   * The status of the telemedicine session
   * @example 'completed', 'cancelled', 'missed'
   */
  @IsNotEmpty()
  @IsString()
  @IsIn(['completed', 'cancelled', 'missed'], {
    message: 'Telemedicine status must be one of: completed, cancelled, missed'
  })
  status: string;

  /**
   * The specialty area of the telemedicine session
   * @example 'Cardiology', 'Dermatology', 'General Practice'
   */
  @IsOptional()
  @IsString()
  specialtyArea?: string;
}

/**
 * DTO for validating symptom checker data
 */
export class SymptomCheckerDataDto {
  /**
   * The IDs of the symptoms checked
   */
  @IsNotEmpty()
  @IsUUID(4, { each: true, message: 'Symptom IDs must be valid UUID v4' })
  symptomIds: string[];

  /**
   * The date and time the symptoms were checked
   */
  @IsNotEmpty()
  @IsISO8601()
  checkedAt: string;

  /**
   * The severity of the symptoms
   * @example 'mild', 'moderate', 'severe'
   */
  @IsNotEmpty()
  @IsString()
  @IsIn(['mild', 'moderate', 'severe'], {
    message: 'Symptom severity must be one of: mild, moderate, severe'
  })
  severity: string;

  /**
   * Whether a recommendation was provided
   */
  @IsNotEmpty()
  @IsBoolean()
  recommendationProvided: boolean;
}