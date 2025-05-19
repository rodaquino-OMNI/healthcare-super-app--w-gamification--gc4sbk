/**
 * Core Type Definitions for Care Journey
 * 
 * This file defines the fundamental enum types used throughout the Care journey
 * in the AUSTA SuperApp. These enums provide type safety and standardization
 * for appointment management and care-related features.
 * 
 * @module care
 */

/**
 * Defines the possible types of healthcare appointments in the system.
 * Used to categorize appointments based on their delivery method.
 */
export enum AppointmentType {
  /**
   * In-person appointment that occurs at a physical healthcare facility.
   * Requires the patient to travel to the provider's location.
   * Associated with location information including address and room number.
   */
  IN_PERSON = 'in-person',
  
  /**
   * Virtual appointment conducted via video conferencing technology.
   * Allows patients to consult with healthcare providers remotely.
   * Associated with a telemedicine session ID for connecting to the virtual meeting.
   */
  TELEMEDICINE = 'telemedicine'
}

/**
 * Defines the possible statuses of healthcare appointments in the system.
 * Used to track the lifecycle of an appointment from creation to completion.
 */
export enum AppointmentStatus {
  /**
   * Appointment has been booked and confirmed but has not yet occurred.
   * The default status when an appointment is first created.
   * Appointments in this status can be cancelled or rescheduled.
   */
  SCHEDULED = 'scheduled',
  
  /**
   * Appointment has successfully taken place.
   * Indicates that the patient and provider have met and the consultation is finished.
   * Appointments in this status cannot be modified or cancelled.
   */
  COMPLETED = 'completed',
  
  /**
   * Appointment has been cancelled and will not take place as scheduled.
   * Can be cancelled by either the patient, provider, or system.
   * Cancelled appointments may include a reason for cancellation.
   */
  CANCELLED = 'cancelled'
}