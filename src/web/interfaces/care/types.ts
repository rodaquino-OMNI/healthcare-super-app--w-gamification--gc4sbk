/**
 * Core enum types for the Care journey in the AUSTA SuperApp
 * 
 * These enums provide type-safe categorization for appointments and their statuses
 * throughout the Care journey, ensuring consistent data structures between frontend
 * and backend systems.
 */

/**
 * Defines the type of healthcare appointment
 * 
 * Used to differentiate between appointments that require physical presence
 * and those that can be conducted remotely through the telemedicine platform.
 */
export enum AppointmentType {
  /**
   * Appointment that requires physical presence at a healthcare facility
   * Examples: Physical examinations, procedures, lab tests
   */
  IN_PERSON = 'IN_PERSON',
  
  /**
   * Remote appointment conducted through the telemedicine platform
   * Examples: Follow-up consultations, prescription renewals, quick assessments
   */
  VIRTUAL = 'VIRTUAL',
}

/**
 * Defines the current status of a healthcare appointment
 * 
 * Used to track the lifecycle of an appointment from creation to completion
 * or cancellation, enabling proper UI state management and notifications.
 */
export enum AppointmentStatus {
  /**
   * Appointment has been requested but not yet confirmed by the provider
   * UI should indicate pending confirmation and allow cancellation
   */
  REQUESTED = 'REQUESTED',
  
  /**
   * Appointment has been confirmed and scheduled
   * UI should display date/time prominently and enable reminders
   */
  SCHEDULED = 'SCHEDULED',
  
  /**
   * Appointment is currently in progress
   * UI should provide access to telemedicine session or check-in options
   */
  IN_PROGRESS = 'IN_PROGRESS',
  
  /**
   * Appointment has been completed
   * UI should offer options for feedback, follow-up booking, and treatment plan access
   */
  COMPLETED = 'COMPLETED',
  
  /**
   * Appointment was cancelled by either the patient or provider
   * UI should offer rebooking options and display cancellation reason if available
   */
  CANCELLED = 'CANCELLED',
  
  /**
   * Patient did not attend the scheduled appointment
   * UI should offer rebooking options and potentially display missed appointment policies
   */
  NO_SHOW = 'NO_SHOW',
}