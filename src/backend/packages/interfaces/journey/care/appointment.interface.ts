import { User } from '@austa/interfaces/auth/user.interface';
import { IProvider } from './provider.interface';

/**
 * Enum defining the possible types of appointments.
 */
export enum AppointmentType {
  IN_PERSON = 'in-person',
  TELEMEDICINE = 'telemedicine'
}

/**
 * Enum defining the possible statuses of appointments.
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Represents an appointment interface in the care journey.
 * This interface is used for tracking scheduled appointments
 * between users and healthcare providers.
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
   */
  user: User;

  /**
   * ID of the healthcare provider for the appointment.
   */
  providerId: string;

  /**
   * The healthcare provider for the appointment.
   */
  provider: IProvider;

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
  notes: string;
}