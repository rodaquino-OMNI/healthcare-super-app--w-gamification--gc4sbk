/**
 * Core enum types for the Care journey in the AUSTA SuperApp.
 * These enums provide type-safe categorization for appointments and their statuses.
 */

/**
 * Defines the types of appointments available in the Care journey.
 * 
 * @enum {string}
 */
export enum AppointmentType {
  /**
   * In-person appointment at a healthcare provider's location.
   * Requires physical presence of the patient.
   */
  IN_PERSON = 'IN_PERSON',
  
  /**
   * Virtual appointment conducted via video consultation.
   * Can be accessed from any location with internet connection.
   */
  VIRTUAL = 'VIRTUAL',
}

/**
 * Defines the possible statuses of an appointment in the Care journey.
 * 
 * @enum {string}
 */
export enum AppointmentStatus {
  /**
   * Appointment has been scheduled but has not yet occurred.
   * Appears in upcoming appointments list.
   */
  SCHEDULED = 'SCHEDULED',
  
  /**
   * Appointment is currently in progress.
   * Only one appointment can be in this status at a time.
   */
  IN_PROGRESS = 'IN_PROGRESS',
  
  /**
   * Appointment has been successfully completed.
   * Appears in appointment history.
   */
  COMPLETED = 'COMPLETED',
  
  /**
   * Appointment has been cancelled by either the patient or provider.
   * Requires cancellation reason to be recorded.
   */
  CANCELLED = 'CANCELLED',
  
  /**
   * Patient did not attend the scheduled appointment.
   * May affect future appointment scheduling privileges.
   */
  NO_SHOW = 'NO_SHOW',
}