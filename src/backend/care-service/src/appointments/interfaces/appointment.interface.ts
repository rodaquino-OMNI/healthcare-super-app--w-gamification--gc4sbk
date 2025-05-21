import { IUser } from '@austa/interfaces/auth';
import { IProvider } from '@app/providers/interfaces/provider.interface';

/**
 * Enum defining the possible types of appointments.
 * Used across the Care Journey for consistent appointment type representation.
 */
export enum AppointmentType {
  IN_PERSON = 'in-person',
  TELEMEDICINE = 'telemedicine'
}

/**
 * Enum defining the possible statuses of appointments.
 * Used across the Care Journey for consistent appointment status representation.
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Interface representing an appointment in the Care Journey.
 * This interface is used for type-safe data exchange between services
 * and ensures consistency in the appointment data model throughout the application.
 */
export interface IAppointment {
  /**
   * Unique identifier for the appointment.
   */
  id: string;

  /**
   * ID of the user scheduling the appointment.
   */
  userId: string;

  /**
   * The user scheduling the appointment.
   * This is a reference to the user entity from the auth service.
   */
  user?: IUser;

  /**
   * ID of the healthcare provider for the appointment.
   */
  providerId: string;

  /**
   * The healthcare provider for the appointment.
   * This is a reference to the provider entity from the care service.
   */
  provider?: IProvider;

  /**
   * Date and time of the appointment.
   */
  dateTime: Date;

  /**
   * Type of appointment (e.g., in-person, telemedicine).
   */
  type: AppointmentType;

  /**
   * Status of the appointment (e.g., scheduled, completed, cancelled).
   */
  status: AppointmentStatus;

  /**
   * Optional notes or comments about the appointment.
   */
  notes?: string;

  /**
   * Optional reason for the appointment.
   */
  reason?: string;
}