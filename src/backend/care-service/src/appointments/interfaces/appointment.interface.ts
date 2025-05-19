import { IUser } from '@austa/interfaces/auth';
import { IProvider } from '@app/providers/interfaces/provider.interface';
import { AppointmentType, AppointmentStatus } from '@app/appointments/entities/appointment.entity';

/**
 * Re-export appointment enums for use in other modules
 */
export { AppointmentType, AppointmentStatus };

/**
 * Interface defining the structure of an appointment.
 * This interface is part of the Care Journey and is used for type-safe
 * data exchange between services and client applications.
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
   * @see AppointmentType
   */
  type: AppointmentType;

  /**
   * Status of the appointment (e.g., scheduled, completed, cancelled).
   * @see AppointmentStatus
   */
  status: AppointmentStatus;

  /**
   * Optional notes or comments about the appointment.
   */
  notes?: string;
}

/**
 * Interface for appointment creation data.
 * Used when creating a new appointment in the system.
 */
export interface ICreateAppointment {
  /**
   * ID of the user scheduling the appointment.
   */
  userId: string;

  /**
   * ID of the healthcare provider for the appointment.
   */
  providerId: string;

  /**
   * Date and time of the appointment.
   */
  dateTime: Date;

  /**
   * Type of appointment (e.g., in-person, telemedicine).
   * @see AppointmentType
   */
  type: AppointmentType;

  /**
   * Optional reason for the appointment.
   */
  reason?: string;
}

/**
 * Interface for appointment update data.
 * Used when updating an existing appointment in the system.
 */
export interface IUpdateAppointment {
  /**
   * Optional notes or additional information about the appointment.
   */
  notes?: string;

  /**
   * Optional appointment type (e.g. IN_PERSON, TELEMEDICINE).
   * @see AppointmentType
   */
  type?: AppointmentType;

  /**
   * Optional appointment status (e.g. SCHEDULED, CANCELLED, COMPLETED).
   * @see AppointmentStatus
   */
  status?: AppointmentStatus;

  /**
   * Optional date and time of the appointment.
   */
  dateTime?: Date;
}