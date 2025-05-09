/**
 * Care journey error types
 */
export enum CareErrorType {
  APPOINTMENT = 'APPOINTMENT',
  PROVIDER = 'PROVIDER',
  TELEMEDICINE = 'TELEMEDICINE',
  MEDICATION = 'MEDICATION',
  TREATMENT = 'TREATMENT',
  SYMPTOM_CHECKER = 'SYMPTOM_CHECKER'
}

/**
 * Appointment status
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  MISSED = 'missed'
}

/**
 * Provider availability status
 */
export enum ProviderAvailabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  LIMITED = 'limited'
}

/**
 * Telemedicine session status
 */
export enum TelemedicineSessionStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

/**
 * Medication adherence status
 */
export enum MedicationAdherenceStatus {
  ADHERENT = 'adherent',
  NON_ADHERENT = 'non_adherent',
  PARTIALLY_ADHERENT = 'partially_adherent'
}