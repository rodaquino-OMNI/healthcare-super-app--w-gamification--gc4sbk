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

/**
 * Enum defining the possible types of appointments.
 * Matches the AppointmentType enum in the Care service.
 */
export enum AppointmentType {
  IN_PERSON = 'in-person',
  TELEMEDICINE = 'telemedicine',
}

/**
 * Enum defining the possible statuses of appointments.
 * Matches the AppointmentStatus enum in the Care service.
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CHECKED_IN = 'checked-in', // Additional status for check-in events
}

/**
 * DTO for provider information in appointment events.
 */
export class AppointmentProviderDto {
  /**
   * Unique identifier for the provider.
   */
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /**
   * Name of the provider.
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Medical specialty of the provider.
   */
  @IsNotEmpty()
  @IsString()
  specialty: string;

  /**
   * Location of the provider's practice.
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * Indicates whether the provider offers telemedicine services.
   */
  @IsOptional()
  telemedicineAvailable?: boolean;
}

/**
 * DTO for location information in appointment events.
 */
export class AppointmentLocationDto {
  /**
   * Name of the location (e.g., clinic name, hospital name).
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Address of the location.
   */
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Additional instructions for finding the location.
   */
  @IsOptional()
  @IsString()
  instructions?: string;
}

/**
 * Base DTO for appointment events.
 * Contains common properties for all appointment-related events.
 */
export class AppointmentEventBaseDto {
  /**
   * Unique identifier for the appointment.
   */
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  /**
   * Date and time of the appointment.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateTime: Date;

  /**
   * Type of appointment (e.g., in-person, telemedicine).
   */
  @IsNotEmpty()
  @IsEnum(AppointmentType)
  type: AppointmentType;

  /**
   * Status of the appointment.
   */
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  /**
   * Provider information for the appointment.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => AppointmentProviderDto)
  provider: AppointmentProviderDto;

  /**
   * Location information for the appointment.
   * Required for IN_PERSON appointments, optional for TELEMEDICINE.
   */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AppointmentLocationDto)
  location?: AppointmentLocationDto;

  /**
   * Optional notes or comments about the appointment.
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for appointment booking events.
 * Used when a user books a new appointment.
 */
export class AppointmentBookedEventDto extends AppointmentEventBaseDto {
  /**
   * Reason for the appointment.
   */
  @IsNotEmpty()
  @IsString()
  reason: string;

  /**
   * Estimated duration of the appointment in minutes.
   */
  @IsOptional()
  duration?: number;

  /**
   * Whether this is a first-time visit with this provider.
   */
  @IsOptional()
  isFirstVisit?: boolean;
}

/**
 * DTO for appointment check-in events.
 * Used when a user checks in for an appointment.
 */
export class AppointmentCheckedInEventDto extends AppointmentEventBaseDto {
  /**
   * Timestamp when the user checked in.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  checkedInAt: Date;

  /**
   * Whether the check-in was done remotely or in-person.
   */
  @IsOptional()
  @IsString()
  checkInMethod?: string;
}

/**
 * DTO for appointment completion events.
 * Used when an appointment is marked as completed.
 */
export class AppointmentCompletedEventDto extends AppointmentEventBaseDto {
  /**
   * Timestamp when the appointment was completed.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  completedAt: Date;

  /**
   * Duration of the actual appointment in minutes.
   */
  @IsOptional()
  actualDuration?: number;

  /**
   * Whether a follow-up appointment is recommended.
   */
  @IsOptional()
  followUpRecommended?: boolean;
}

/**
 * DTO for appointment cancellation events.
 * Used when an appointment is cancelled.
 */
export class AppointmentCancelledEventDto extends AppointmentEventBaseDto {
  /**
   * Timestamp when the appointment was cancelled.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  cancelledAt: Date;

  /**
   * Reason for cancellation.
   */
  @IsNotEmpty()
  @IsString()
  cancellationReason: string;

  /**
   * Whether the appointment was cancelled by the provider or the user.
   */
  @IsNotEmpty()
  @IsString()
  cancelledBy: 'user' | 'provider';

  /**
   * Whether the appointment was rescheduled.
   */
  @IsOptional()
  rescheduled?: boolean;

  /**
   * ID of the new appointment if rescheduled.
   */
  @IsOptional()
  @IsUUID()
  newAppointmentId?: string;
}

/**
 * DTO for appointment rescheduling events.
 * Used when an appointment is rescheduled.
 */
export class AppointmentRescheduledEventDto extends AppointmentEventBaseDto {
  /**
   * Timestamp when the appointment was rescheduled.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  rescheduledAt: Date;

  /**
   * Original date and time of the appointment before rescheduling.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  originalDateTime: Date;

  /**
   * Reason for rescheduling.
   */
  @IsOptional()
  @IsString()
  reschedulingReason?: string;

  /**
   * Whether the appointment was rescheduled by the provider or the user.
   */
  @IsNotEmpty()
  @IsString()
  rescheduledBy: 'user' | 'provider';
}

/**
 * DTO for appointment reminder events.
 * Used when a reminder is sent for an upcoming appointment.
 */
export class AppointmentReminderEventDto extends AppointmentEventBaseDto {
  /**
   * Timestamp when the reminder was sent.
   */
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  reminderSentAt: Date;

  /**
   * Type of reminder (e.g., 'day-before', 'hour-before').
   */
  @IsNotEmpty()
  @IsString()
  reminderType: string;

  /**
   * Channel through which the reminder was sent (e.g., 'email', 'sms', 'push').
   */
  @IsNotEmpty()
  @IsString()
  reminderChannel: string;
}