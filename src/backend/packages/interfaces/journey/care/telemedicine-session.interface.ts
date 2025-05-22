/**
 * @file Telemedicine Session Interface
 * @description Defines the interface for telemedicine video consultation sessions in the Care Journey.
 */

import { IAppointment } from './appointment.interface';
import { User } from '../../../auth/user.interface';

/**
 * Interface for telemedicine session data in the Care Journey.
 * Represents video consultation sessions between patients and healthcare providers.
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
  appointment: IAppointment;

  /**
   * ID of the patient participating in the telemedicine session.
   */
  patientId: string;

  /**
   * The patient participating in the telemedicine session.
   */
  patient: User;

  /**
   * ID of the healthcare provider conducting the telemedicine session.
   */
  providerId: string;

  /**
   * The healthcare provider conducting the telemedicine session.
   */
  provider: User;

  /**
   * Start time of the telemedicine session.
   */
  startTime: Date;

  /**
   * End time of the telemedicine session (optional if the session is ongoing).
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