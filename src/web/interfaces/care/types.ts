/**
 * @file types.ts
 * @description Core enum types for the Care journey in the AUSTA SuperApp.
 * This file defines the fundamental type definitions used throughout the Care journey
 * for appointment management and scheduling.
 */

/**
 * Enum defining the possible types of appointments in the Care journey.
 * Used to categorize appointments based on their delivery method.
 */
export enum AppointmentType {
  /**
   * Represents a traditional in-person appointment that occurs at a physical
   * healthcare facility or provider's office. The patient must be physically
   * present at the specified location for the appointment.
   */
  IN_PERSON = 'in-person',
  
  /**
   * Represents a virtual appointment conducted via video conferencing technology.
   * The patient connects remotely with the healthcare provider without the need
   * for physical travel to a facility. This type of appointment is conducted
   * through the app's telemedicine interface.
   */
  TELEMEDICINE = 'telemedicine'
}

/**
 * Enum defining the possible statuses of appointments in the Care journey.
 * Used to track the lifecycle state of an appointment.
 */
export enum AppointmentStatus {
  /**
   * Indicates that an appointment has been successfully booked and confirmed,
   * but has not yet occurred. This is the initial status of a newly created
   * appointment.
   */
  SCHEDULED = 'scheduled',
  
  /**
   * Indicates that an appointment has occurred and been marked as complete
   * by the healthcare provider. This status is applied after the appointment
   * time has passed and the provider has submitted any required documentation.
   */
  COMPLETED = 'completed',
  
  /**
   * Indicates that an appointment has been cancelled and will not occur.
   * This status can be applied either by the patient or the provider, and
   * may trigger notification workflows depending on cancellation timing.
   */
  CANCELLED = 'cancelled'
}