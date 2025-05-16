/**
 * Appointment Interface
 * 
 * Defines the structure for healthcare appointments in the AUSTA SuperApp Care journey.
 * This interface represents scheduled healthcare appointments, including properties for
 * identification, appointment type (in-person/virtual), status, timing, provider information,
 * and associated notes.
 * 
 * @module care
 */

import { AppointmentType, AppointmentStatus } from './types';

/**
 * Represents basic provider information for appointment display
 * Contains a subset of the full Provider interface properties
 */
export interface AppointmentProviderInfo {
  /** Provider's unique identifier */
  id: string;
  /** Provider's full name */
  name: string;
  /** Provider's professional credentials (e.g., MD, RN) */
  credentials: string;
  /** Provider's specialty */
  specialty: string;
  /** URL to provider's profile image */
  profileImageUrl?: string;
}

/**
 * Represents location information for in-person appointments
 */
export interface AppointmentLocation {
  /** Name of the facility or clinic */
  facilityName: string;
  /** Street address including building/suite number */
  street: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal code */
  zipCode: string;
  /** Country */
  country: string;
  /** Room or suite number within the facility */
  roomNumber?: string;
  /** Special instructions for finding the location */
  instructions?: string;
}

/**
 * Represents a healthcare appointment in the AUSTA SuperApp Care journey
 * 
 * Used throughout the Care journey for scheduling, displaying, and managing
 * healthcare appointments. This interface supports both in-person and virtual
 * appointments with appropriate properties for each type.
 */
export interface Appointment {
  /** Unique identifier for the appointment */
  id: string;
  
  /** Type of appointment (in-person or virtual) */
  type: AppointmentType;
  
  /** Current status of the appointment */
  status: AppointmentStatus;
  
  /** ID of the patient who has the appointment */
  patientId: string;
  
  /** ID of the healthcare provider for the appointment */
  providerId: string;
  
  /** Basic provider information for display purposes */
  providerInfo: AppointmentProviderInfo;
  
  /** Date and time of the appointment in ISO format */
  dateTime: string;
  
  /** Duration of the appointment in minutes */
  duration: number;
  
  /** Location information for in-person appointments */
  location?: AppointmentLocation;
  
  /** Primary reason for the appointment */
  reason: string;
  
  /** Additional notes about the appointment */
  notes?: string;
  
  /** ID of the associated telemedicine session (for virtual appointments) */
  telemedicineSessionId?: string;
  
  /** Whether the appointment requires preparation (e.g., fasting) */
  requiresPreparation?: boolean;
  
  /** Preparation instructions for the patient */
  preparationInstructions?: string;
  
  /** Whether the patient has checked in for the appointment */
  checkedIn?: boolean;
  
  /** Time when the patient checked in */
  checkInTime?: string;
  
  /** Whether the appointment is covered by insurance */
  coveredByInsurance?: boolean;
  
  /** Estimated copay amount for the appointment */
  estimatedCopay?: number;
  
  /** Whether the appointment is a follow-up to a previous appointment */
  isFollowUp?: boolean;
  
  /** ID of the previous appointment if this is a follow-up */
  previousAppointmentId?: string;
  
  /** Whether reminders have been sent for this appointment */
  remindersSent?: boolean;
  
  /** User's confirmation status for the appointment */
  userConfirmed?: boolean;
  
  /** Time when the appointment was created */
  createdAt: string;
  
  /** Time when the appointment was last updated */
  updatedAt: string;
  
  /** Time when the appointment was cancelled (if applicable) */
  cancelledAt?: string;
  
  /** Reason for cancellation (if applicable) */
  cancellationReason?: string;
  
  /** Who cancelled the appointment (patient, provider, system) */
  cancelledBy?: string;
}