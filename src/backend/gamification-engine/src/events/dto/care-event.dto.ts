/**
 * @file care-event.dto.ts
 * @description Data Transfer Objects for Care Journey specific events in the gamification engine.
 * 
 * This file defines the DTOs used for validating and processing Care Journey events
 * such as appointment bookings, medication tracking, and telemedicine sessions.
 * These DTOs extend the base ProcessEventDto with care-specific properties and validation rules.
 * 
 * The CareEventDto and related data DTOs enable proper typing and validation for
 * care-related gamification events, ensuring that only valid events are processed
 * by the gamification engine.
 */

import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from './process-event.dto';

// Import interfaces from @austa/interfaces package
import { AppointmentType } from '@austa/interfaces/journey/care';

/**
 * Enum for Care Journey event types in the gamification system.
 * These event types represent specific actions users can take in the Care Journey
 * that may trigger gamification rules, achievements, or rewards.
 */
export enum CareEventType {
  /** User has booked a medical appointment */
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  /** User has marked a medication as taken */
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  /** User has completed a telemedicine session */
  TELEMEDICINE_COMPLETED = 'TELEMEDICINE_COMPLETED',
  /** User has created a new medication reminder */
  MEDICATION_REMINDER_CREATED = 'MEDICATION_REMINDER_CREATED',
  /** User has completed a treatment plan step */
  TREATMENT_STEP_COMPLETED = 'TREATMENT_STEP_COMPLETED',
  /** User has rated a provider after an appointment */
  PROVIDER_RATED = 'PROVIDER_RATED',
  /** User has rescheduled an appointment */
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  /** User has cancelled an appointment */
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  /** User has checked in for an appointment */
  APPOINTMENT_CHECKIN = 'APPOINTMENT_CHECKIN',
}

/**
 * Base DTO for all journey-specific events in the gamification system.
 * Extends the ProcessEventDto with additional validation and typing.
 */
export class BaseEventDto extends ProcessEventDto {
  /**
   * The timestamp when the event occurred.
   * This is used for tracking when actions happened and for time-based achievements.
   */
  @IsOptional()
  @IsDate()
  timestamp?: Date;

  /**
   * The journey associated with the event.
   * For CareEventDto, this will always be 'care'.
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'care';
}

/**
 * DTO for appointment data validation in care events.
 * This validates the data structure for appointment-related events like
 * APPOINTMENT_BOOKED, APPOINTMENT_RESCHEDULED, and APPOINTMENT_CANCELLED.
 */
export class AppointmentEventDataDto {
  /**
   * The ID of the appointment.
   * Must be a valid UUID that corresponds to an appointment in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  /**
   * The ID of the provider for the appointment.
   * Must be a valid UUID that corresponds to a healthcare provider in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * The type of appointment (in-person, virtual).
   * Should match the AppointmentType enum from @austa/interfaces.
   */
  @IsNotEmpty()
  @IsString()
  appointmentType: string;

  /**
   * The scheduled date and time for the appointment.
   */
  @IsNotEmpty()
  @IsDate()
  scheduledAt: Date;

  /**
   * The expected duration of the appointment in minutes.
   */
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  /**
   * Optional notes or details about the appointment.
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for medication data validation in care events.
 * This validates the data structure for medication-related events like
 * MEDICATION_TAKEN and MEDICATION_REMINDER_CREATED.
 */
export class MedicationEventDataDto {
  /**
   * The ID of the medication.
   * Must be a valid UUID that corresponds to a medication in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  medicationId: string;

  /**
   * The name of the medication.
   * This is included for easier readability in logs and event processing.
   */
  @IsNotEmpty()
  @IsString()
  medicationName: string;

  /**
   * The dosage of the medication taken.
   * Format should be a string like "10mg" or "1 tablet".
   */
  @IsNotEmpty()
  @IsString()
  dosage: string;

  /**
   * The time when the medication was taken.
   * For MEDICATION_TAKEN events, this should be the actual time.
   * For MEDICATION_REMINDER_CREATED events, this should be the scheduled time.
   */
  @IsNotEmpty()
  @IsDate()
  takenAt: Date;

  /**
   * Whether the medication was taken on schedule.
   * This is used for adherence tracking and related achievements.
   */
  @IsOptional()
  @IsString()
  adherenceStatus?: 'on_time' | 'late' | 'missed';

  /**
   * Optional notes about taking the medication.
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for telemedicine session data validation in care events.
 * This validates the data structure for telemedicine-related events like
 * TELEMEDICINE_COMPLETED.
 */
export class TelemedicineEventDataDto {
  /**
   * The ID of the telemedicine session.
   * Must be a valid UUID that corresponds to a telemedicine session in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  /**
   * The ID of the provider for the telemedicine session.
   * Must be a valid UUID that corresponds to a healthcare provider in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * The ID of the related appointment, if any.
   * Some telemedicine sessions may be scheduled as appointments.
   */
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  /**
   * The duration of the telemedicine session in minutes.
   * Used for tracking engagement and for time-based achievements.
   */
  @IsNotEmpty()
  @IsNumber()
  durationMinutes: number;

  /**
   * The start time of the telemedicine session.
   */
  @IsNotEmpty()
  @IsDate()
  startedAt: Date;

  /**
   * The end time of the telemedicine session.
   */
  @IsNotEmpty()
  @IsDate()
  endedAt: Date;

  /**
   * Whether the session was completed successfully.
   * This is used for tracking successful telemedicine engagements.
   */
  @IsNotEmpty()
  @IsString()
  status: 'completed' | 'interrupted' | 'cancelled';

  /**
   * Optional notes or details about the telemedicine session.
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for treatment plan step data validation in care events.
 * This validates the data structure for treatment-related events like
 * TREATMENT_STEP_COMPLETED.
 */
export class TreatmentEventDataDto {
  /**
   * The ID of the treatment plan.
   * Must be a valid UUID that corresponds to a treatment plan in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  treatmentPlanId: string;

  /**
   * The ID of the specific step within the treatment plan.
   */
  @IsNotEmpty()
  @IsUUID()
  stepId: string;

  /**
   * The name or title of the treatment step.
   * Included for easier readability in logs and event processing.
   */
  @IsNotEmpty()
  @IsString()
  stepName: string;

  /**
   * The time when the treatment step was completed.
   */
  @IsNotEmpty()
  @IsDate()
  completedAt: Date;

  /**
   * The progress percentage of the overall treatment plan after this step.
   * Used for tracking overall treatment plan progress.
   */
  @IsNotEmpty()
  @IsNumber()
  overallProgress: number;

  /**
   * Optional notes about the treatment step completion.
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for provider rating data validation in care events.
 * This validates the data structure for provider-related events like
 * PROVIDER_RATED.
 */
export class ProviderRatingEventDataDto {
  /**
   * The ID of the provider being rated.
   * Must be a valid UUID that corresponds to a healthcare provider in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * The ID of the appointment associated with this rating, if any.
   */
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  /**
   * The rating value given by the user.
   * Typically on a scale of 1-5.
   */
  @IsNotEmpty()
  @IsNumber()
  rating: number;

  /**
   * Optional feedback or comments provided with the rating.
   */
  @IsOptional()
  @IsString()
  feedback?: string;

  /**
   * The time when the rating was submitted.
   */
  @IsNotEmpty()
  @IsDate()
  ratedAt: Date;
}

/**
 * Data Transfer Object for Care Journey specific events in the gamification engine.
 * This DTO extends BaseEventDto with care-specific properties and validation rules.
 * It enables proper typing and validation for care-related gamification events like
 * appointment booking, medication tracking, and telemedicine sessions.
 */
export class CareEventDto extends BaseEventDto {
  /**
   * The type of care event.
   * Must be one of the defined CareEventType enum values.
   */
  @IsEnum(CareEventType)
  type: CareEventType;

  /**
   * The data associated with the care event.
   * This will be validated based on the event type.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  data: AppointmentEventDataDto | MedicationEventDataDto | TelemedicineEventDataDto | TreatmentEventDataDto | ProviderRatingEventDataDto;

  /**
   * Validates that the data object matches the expected type based on the event type.
   * This method should be called after the basic validation is complete.
   * 
   * @returns boolean indicating if the data is valid for the event type
   */
  validateEventData(): boolean {
    switch (this.type) {
      case CareEventType.APPOINTMENT_BOOKED:
      case CareEventType.APPOINTMENT_RESCHEDULED:
      case CareEventType.APPOINTMENT_CANCELLED:
      case CareEventType.APPOINTMENT_CHECKIN:
        return this.data instanceof AppointmentEventDataDto;
      
      case CareEventType.MEDICATION_TAKEN:
      case CareEventType.MEDICATION_REMINDER_CREATED:
        return this.data instanceof MedicationEventDataDto;
      
      case CareEventType.TELEMEDICINE_COMPLETED:
        return this.data instanceof TelemedicineEventDataDto;
      
      case CareEventType.TREATMENT_STEP_COMPLETED:
        return this.data instanceof TreatmentEventDataDto;
      
      case CareEventType.PROVIDER_RATED:
        return this.data instanceof ProviderRatingEventDataDto;
      
      default:
        return true; // For other event types, no specific validation
    }
  }
}