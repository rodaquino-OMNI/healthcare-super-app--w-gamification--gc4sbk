import { IsNotEmpty, IsString, IsUUID, IsISO8601, IsEnum, IsOptional, ValidateNested, IsObject, IsBoolean, IsArray, ArrayMinSize, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum representing the possible states of an appointment.
 */
export enum AppointmentState {
  BOOKED = 'booked',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show'
}

/**
 * Enum representing the possible types of appointments.
 */
export enum AppointmentType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home_visit'
}

/**
 * DTO for provider information in appointment events.
 */
export class ProviderInfoDto {
  /**
   * The unique identifier of the healthcare provider.
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * The name of the healthcare provider.
   */
  @IsNotEmpty()
  @IsString()
  providerName: string;

  /**
   * The specialization of the healthcare provider.
   */
  @IsNotEmpty()
  @IsString()
  specialization: string;

  /**
   * Optional provider rating (1-5).
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

/**
 * DTO for location information in appointment events.
 */
export class LocationInfoDto {
  /**
   * The name of the location (clinic, hospital, etc.).
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The address of the location.
   */
  @IsNotEmpty()
  @IsString()
  address: string;

  /**
   * Optional coordinates for the location.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  coordinates?: [number, number]; // [latitude, longitude]

  /**
   * Optional additional information about the location.
   */
  @IsOptional()
  @IsObject()
  additionalInfo?: Record<string, any>;
}

/**
 * Base DTO for appointment events.
 */
export class AppointmentEventBaseDto {
  /**
   * The unique identifier of the appointment.
   */
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  /**
   * The current state of the appointment.
   */
  @IsNotEmpty()
  @IsEnum(AppointmentState)
  state: AppointmentState;

  /**
   * The type of the appointment.
   */
  @IsNotEmpty()
  @IsEnum(AppointmentType)
  type: AppointmentType;

  /**
   * The scheduled date and time of the appointment in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  scheduledAt: string;

  /**
   * The duration of the appointment in minutes.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(5)
  durationMinutes: number;

  /**
   * Information about the healthcare provider.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProviderInfoDto)
  provider: ProviderInfoDto;

  /**
   * Information about the appointment location.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationInfoDto)
  location: LocationInfoDto;

  /**
   * The reason for the appointment.
   */
  @IsNotEmpty()
  @IsString()
  reason: string;

  /**
   * Whether this is a first-time visit with this provider.
   */
  @IsOptional()
  @IsBoolean()
  isFirstVisit?: boolean;

  /**
   * Optional notes about the appointment.
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Optional previous state for tracking state transitions.
   */
  @IsOptional()
  @IsEnum(AppointmentState)
  previousState?: AppointmentState;
}

/**
 * DTO for appointment booking events.
 */
export class AppointmentBookedEventDto extends AppointmentEventBaseDto {
  /**
   * Whether the appointment was booked by the patient or on behalf of the patient.
   */
  @IsNotEmpty()
  @IsBoolean()
  bookedByPatient: boolean;

  /**
   * Whether the appointment requires any preparation.
   */
  @IsOptional()
  @IsBoolean()
  requiresPreparation?: boolean;

  /**
   * Optional preparation instructions.
   */
  @IsOptional()
  @IsString()
  preparationInstructions?: string;
}

/**
 * DTO for appointment check-in events.
 */
export class AppointmentCheckedInEventDto extends AppointmentEventBaseDto {
  /**
   * The time when the patient checked in, in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  checkedInAt: string;

  /**
   * Whether the patient arrived on time.
   */
  @IsNotEmpty()
  @IsBoolean()
  onTime: boolean;

  /**
   * Optional check-in notes.
   */
  @IsOptional()
  @IsString()
  checkInNotes?: string;
}

/**
 * DTO for appointment completion events.
 */
export class AppointmentCompletedEventDto extends AppointmentEventBaseDto {
  /**
   * The time when the appointment was completed, in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  completedAt: string;

  /**
   * Whether a follow-up appointment is recommended.
   */
  @IsNotEmpty()
  @IsBoolean()
  followUpRecommended: boolean;

  /**
   * Optional follow-up timeframe in days.
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  followUpTimeframeDays?: number;

  /**
   * Optional summary of the appointment.
   */
  @IsOptional()
  @IsString()
  summary?: string;
}

/**
 * DTO for appointment cancellation events.
 */
export class AppointmentCancelledEventDto extends AppointmentEventBaseDto {
  /**
   * The time when the appointment was cancelled, in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  cancelledAt: string;

  /**
   * The reason for cancellation.
   */
  @IsNotEmpty()
  @IsString()
  cancellationReason: string;

  /**
   * Whether the appointment was cancelled by the patient or the provider.
   */
  @IsNotEmpty()
  @IsBoolean()
  cancelledByPatient: boolean;

  /**
   * Whether a cancellation fee applies.
   */
  @IsNotEmpty()
  @IsBoolean()
  cancellationFeeApplies: boolean;
}

/**
 * DTO for appointment rescheduling events.
 */
export class AppointmentRescheduledEventDto extends AppointmentEventBaseDto {
  /**
   * The time when the appointment was rescheduled, in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  rescheduledAt: string;

  /**
   * The previous scheduled date and time in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  previousScheduledAt: string;

  /**
   * The reason for rescheduling.
   */
  @IsNotEmpty()
  @IsString()
  reschedulingReason: string;

  /**
   * Whether the appointment was rescheduled by the patient or the provider.
   */
  @IsNotEmpty()
  @IsBoolean()
  rescheduledByPatient: boolean;
}

/**
 * DTO for appointment no-show events.
 */
export class AppointmentNoShowEventDto extends AppointmentEventBaseDto {
  /**
   * The time when the no-show was recorded, in ISO 8601 format.
   */
  @IsNotEmpty()
  @IsISO8601()
  recordedAt: string;

  /**
   * Whether a no-show fee applies.
   */
  @IsNotEmpty()
  @IsBoolean()
  noShowFeeApplies: boolean;

  /**
   * Optional notes about the no-show.
   */
  @IsOptional()
  @IsString()
  noShowNotes?: string;
}

/**
 * Type representing all possible appointment event DTOs.
 */
export type AppointmentEventDto =
  | AppointmentBookedEventDto
  | AppointmentCheckedInEventDto
  | AppointmentCompletedEventDto
  | AppointmentCancelledEventDto
  | AppointmentRescheduledEventDto
  | AppointmentNoShowEventDto;