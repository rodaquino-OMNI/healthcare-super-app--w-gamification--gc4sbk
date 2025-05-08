import { IUser } from '../../../auth/interfaces';
import { IAppointment } from './appointment.interface';

/**
 * Interface representing a telemedicine session in the Care Journey.
 * This interface defines the structure for virtual healthcare consultations
 * between patients and providers within the AUSTA SuperApp.
 */
export interface ITelemedicineSession {
  /**
   * Unique identifier for the telemedicine session.
   */
  id: string;

  /**
   * ID of the appointment associated with the telemedicine session.
   */
  appointmentId: string;

  /**
   * The appointment associated with the telemedicine session.
   */
  appointment?: IAppointment;

  /**
   * ID of the patient participating in the telemedicine session.
   */
  patientId: string;

  /**
   * The patient participating in the telemedicine session.
   */
  patient?: IUser;

  /**
   * ID of the healthcare provider conducting the telemedicine session.
   */
  providerId: string;

  /**
   * The healthcare provider conducting the telemedicine session.
   */
  provider?: IUser;

  /**
   * Start time of the telemedicine session.
   */
  startTime: Date;

  /**
   * End time of the telemedicine session (nullable if the session is ongoing).
   */
  endTime?: Date;

  /**
   * Status of the telemedicine session (e.g., scheduled, ongoing, completed, cancelled).
   */
  status: string;

  /**
   * Timestamp of when the telemedicine session was created.
   */
  createdAt: Date;

  /**
   * Timestamp of when the telemedicine session was last updated.
   */
  updatedAt: Date;
}