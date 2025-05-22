/**
 * @file Telemedicine Session Interface
 * @description Defines the interface for telemedicine sessions in the Care Journey.
 */

/**
 * Interface for telemedicine session data in the Care Journey.
 * Represents virtual healthcare appointments between patients and providers.
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
   * ID of the patient participating in the telemedicine session.
   */
  patientId: string;

  /**
   * ID of the healthcare provider conducting the telemedicine session.
   */
  providerId: string;

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