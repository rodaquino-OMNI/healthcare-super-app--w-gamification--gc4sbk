import { IsOptional, IsString, IsDate, IsEnum } from 'class-validator'; // class-validator@0.14.1
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/journey/care';

/**
 * Data Transfer Object for updating an appointment.
 * Used to receive and validate data for appointment updates in the Care journey.
 * Addresses requirement F-102-RQ-002: Appointment Booking and Management
 * 
 * This DTO ensures that update requests contain valid data before processing,
 * preventing inconsistent or malformed appointments when users make changes.
 */
export class UpdateAppointmentDto {
  /**
   * Optional notes or additional information about the appointment
   * Can be used for patient instructions or special requirements
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Optional appointment type (e.g. IN_PERSON, TELEMEDICINE)
   * Determines the appointment delivery method and associated resources
   */
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  /**
   * Optional appointment status (e.g. SCHEDULED, CANCELLED, COMPLETED)
   * Tracks the current state of the appointment in its lifecycle
   */
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  /**
   * Optional date and time of the appointment
   * Must be a valid Date object for proper scheduling
   */
  @IsOptional()
  @IsDate()
  dateTime?: Date;
}