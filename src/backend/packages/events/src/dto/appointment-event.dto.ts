/**
 * @file appointment-event.dto.ts
 * @description
 * This file defines Data Transfer Objects (DTOs) for appointment events in the AUSTA SuperApp.
 * These DTOs are used to validate and structure appointment-related events from the Care journey
 * before they are processed by the gamification engine and notification service.
 *
 * The DTOs in this file support various appointment events including:
 * - Appointment booking
 * - Check-in
 * - Completion
 * - Cancellation
 * - Rescheduling
 * - No-show
 *
 * Each DTO includes validation rules using class-validator decorators to ensure data integrity
 * and proper structure. The validation ensures that events contain all required information
 * for proper processing by the gamification engine, which awards points and achievements
 * based on appointment activities.
 *
 * @example
 * // Example of creating an appointment booked event
 * const appointmentEvent = new AppointmentBookedEventDto();
 * appointmentEvent.appointmentId = '123e4567-e89b-12d3-a456-426614174000';
 * appointmentEvent.dateTime = new Date('2023-05-15T10:30:00Z');
 * appointmentEvent.type = AppointmentType.IN_PERSON;
 * appointmentEvent.status = AppointmentStatus.SCHEDULED;
 * appointmentEvent.provider = {
 *   id: '123e4567-e89b-12d3-a456-426614174001',
 *   name: 'Dr. Jane Smith',
 *   specialty: 'Cardiology',
 *   location: 'Main Hospital',
 *   telemedicineAvailable: true
 * };
 */

import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EventType } from './event-types.enum';

/**
 * Enum defining the possible types of appointments.
 */
export enum AppointmentType {
  IN_PERSON = 'in-person',
  TELEMEDICINE = 'telemedicine',
}

/**
 * Enum defining the possible statuses of appointments.
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked-in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no-show',
}

/**
 * DTO for provider information in appointment events
 */
export class ProviderInfoDto {
  /**
   * Unique identifier for the provider
   */
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /**
   * Name of the provider
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Medical specialty of the provider
   */
  @IsNotEmpty()
  @IsString()
  specialty: string;

  /**
   * Location of the provider's practice
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * Indicates whether the provider offers telemedicine services
   */
  @IsOptional()
  telemedicineAvailable?: boolean;
}

/**
 * DTO for location information in appointment events
 */
export class LocationInfoDto {
  /**
   * Name of the location
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Address of the location
   */
  @IsNotEmpty()
  @IsString()
  address: string;

  /**
   * Optional additional information about the location
   */
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

/**
 * Base DTO for appointment events
 */
export class AppointmentEventBaseDto {
  /**
   * Unique identifier for the appointment
   */
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  /**
   * Date and time of the appointment
   */
  @IsNotEmpty()
  @IsDate()
  dateTime: Date;

  /**
   * Type of appointment (e.g., in-person, telemedicine)
   */
  @IsNotEmpty()
  @IsEnum(AppointmentType)
  type: AppointmentType;

  /**
   * Status of the appointment
   */
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  /**
   * Provider information for the appointment
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => ProviderInfoDto)
  provider: ProviderInfoDto;

  /**
   * Optional location information for the appointment
   * Required for IN_PERSON appointments
   */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationInfoDto)
  location?: LocationInfoDto;

  /**
   * Optional notes or comments about the appointment
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for appointment booking events
 */
export class AppointmentBookedEventDto extends AppointmentEventBaseDto {
  /**
   * Reason for the appointment
   */
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * Indicates if this is a first-time visit with this provider
   */
  @IsOptional()
  firstVisit?: boolean;
}

/**
 * DTO for appointment check-in events
 */
export class AppointmentCheckedInEventDto extends AppointmentEventBaseDto {
  /**
   * Time when the patient checked in
   */
  @IsNotEmpty()
  @IsDate()
  checkedInAt: Date;

  /**
   * Optional check-in method (e.g., 'kiosk', 'mobile', 'reception')
   */
  @IsOptional()
  @IsString()
  checkInMethod?: string;
}

/**
 * DTO for appointment completion events
 */
export class AppointmentCompletedEventDto extends AppointmentEventBaseDto {
  /**
   * Time when the appointment was completed
   */
  @IsNotEmpty()
  @IsDate()
  completedAt: Date;

  /**
   * Duration of the appointment in minutes
   */
  @IsOptional()
  duration?: number;

  /**
   * Indicates if a follow-up appointment is recommended
   */
  @IsOptional()
  followUpRecommended?: boolean;
}

/**
 * DTO for appointment cancellation events
 */
export class AppointmentCancelledEventDto extends AppointmentEventBaseDto {
  /**
   * Time when the appointment was cancelled
   */
  @IsNotEmpty()
  @IsDate()
  cancelledAt: Date;

  /**
   * Reason for cancellation
   */
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  /**
   * Indicates if the appointment was cancelled by the provider
   */
  @IsOptional()
  cancelledByProvider?: boolean;
}

/**
 * DTO for appointment rescheduling events
 */
export class AppointmentRescheduledEventDto extends AppointmentEventBaseDto {
  /**
   * Original date and time of the appointment before rescheduling
   */
  @IsNotEmpty()
  @IsDate()
  originalDateTime: Date;

  /**
   * Time when the appointment was rescheduled
   */
  @IsNotEmpty()
  @IsDate()
  rescheduledAt: Date;

  /**
   * Reason for rescheduling
   */
  @IsOptional()
  @IsString()
  reschedulingReason?: string;

  /**
   * Indicates if the appointment was rescheduled by the provider
   */
  @IsOptional()
  rescheduledByProvider?: boolean;
}

/**
 * DTO for appointment no-show events
 */
export class AppointmentNoShowEventDto extends AppointmentEventBaseDto {
  /**
   * Time when the no-show was recorded
   */
  @IsNotEmpty()
  @IsDate()
  recordedAt: Date;

  /**
   * Optional notes about the no-show
   */
  @IsOptional()
  @IsString()
  noShowNotes?: string;

  /**
   * Indicates if a follow-up action is required
   */
  @IsOptional()
  followUpRequired?: boolean;
}

/**
 * Maps appointment event types to their corresponding EventType enum values
 * This mapping is used by the event processing system to determine the correct
 * event type based on the appointment status.
 */
export const APPOINTMENT_EVENT_TYPE_MAP = {
  [AppointmentStatus.SCHEDULED]: EventType.CARE_APPOINTMENT_BOOKED,
  [AppointmentStatus.CHECKED_IN]: EventType.CARE_APPOINTMENT_CHECKED_IN,
  [AppointmentStatus.COMPLETED]: EventType.CARE_APPOINTMENT_COMPLETED,
  [AppointmentStatus.CANCELLED]: EventType.CARE_APPOINTMENT_CANCELLED,
  [AppointmentStatus.RESCHEDULED]: EventType.CARE_APPOINTMENT_RESCHEDULED,
  [AppointmentStatus.NO_SHOW]: EventType.CARE_APPOINTMENT_NO_SHOW,
};

/**
 * Type guard to check if an object is a valid appointment event
 * @param obj The object to check
 * @returns True if the object is a valid appointment event
 */
export function isAppointmentEvent(obj: any): obj is AppointmentEventBaseDto {
  return (
    obj &&
    typeof obj === 'object' &&
    'appointmentId' in obj &&
    'dateTime' in obj &&
    'type' in obj &&
    'status' in obj &&
    'provider' in obj
  );
}

/**
 * Factory function to create the appropriate appointment event DTO based on status
 * @param status The appointment status
 * @returns The corresponding event DTO class
 */
export function getAppointmentEventDtoByStatus(status: AppointmentStatus): any {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return AppointmentBookedEventDto;
    case AppointmentStatus.CHECKED_IN:
      return AppointmentCheckedInEventDto;
    case AppointmentStatus.COMPLETED:
      return AppointmentCompletedEventDto;
    case AppointmentStatus.CANCELLED:
      return AppointmentCancelledEventDto;
    case AppointmentStatus.RESCHEDULED:
      return AppointmentRescheduledEventDto;
    case AppointmentStatus.NO_SHOW:
      return AppointmentNoShowEventDto;
    default:
      return AppointmentEventBaseDto;
  }
}