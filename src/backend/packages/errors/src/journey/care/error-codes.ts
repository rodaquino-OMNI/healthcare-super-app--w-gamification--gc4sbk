/**
 * @file Defines all error codes used throughout the Care journey.
 * This file provides a centralized definition of error codes to ensure consistency
 * across all Care journey services and components.
 */

/**
 * Domain prefixes for Care journey error codes
 */
export enum CareDomain {
  APPOINTMENT = 'CARE_APPOINTMENT',
  PROVIDER = 'CARE_PROVIDER',
  TELEMEDICINE = 'CARE_TELEMEDICINE',
  MEDICATION = 'CARE_MEDICATION',
  SYMPTOM = 'CARE_SYMPTOM',
  TREATMENT = 'CARE_TREATMENT'
}

/**
 * Provider domain error codes
 */
export enum ProviderErrorCode {
  // Business errors (001-099)
  NOT_FOUND = `${CareDomain.PROVIDER}_001`,
  UNAVAILABLE = `${CareDomain.PROVIDER}_002`,
  SPECIALTY_MISMATCH = `${CareDomain.PROVIDER}_003`,
  
  // Validation errors (100-199)
  INVALID_CREDENTIALS = `${CareDomain.PROVIDER}_004`,
  
  // External errors (200-299)
  DIRECTORY_ERROR = `${CareDomain.PROVIDER}_005`,
  
  // Technical errors (300-399)
  PERSISTENCE_ERROR = `${CareDomain.PROVIDER}_006`
}

/**
 * Appointment domain error codes
 */
export enum AppointmentErrorCode {
  // Business errors (001-099)
  NOT_FOUND = `${CareDomain.APPOINTMENT}_001`,
  DATE_IN_PAST = `${CareDomain.APPOINTMENT}_002`,
  OVERLAP = `${CareDomain.APPOINTMENT}_003`,
  PROVIDER_UNAVAILABLE = `${CareDomain.APPOINTMENT}_004`,
  CANCELLATION_WINDOW_EXPIRED = `${CareDomain.APPOINTMENT}_005`,
  
  // Validation errors (100-199)
  INVALID_DATE_FORMAT = `${CareDomain.APPOINTMENT}_100`,
  INVALID_DURATION = `${CareDomain.APPOINTMENT}_101`,
  MISSING_REQUIRED_FIELDS = `${CareDomain.APPOINTMENT}_102`,
  
  // External errors (200-299)
  CALENDAR_SYNC_ERROR = `${CareDomain.APPOINTMENT}_200`,
  NOTIFICATION_DELIVERY_ERROR = `${CareDomain.APPOINTMENT}_201`,
  
  // Technical errors (300-399)
  PERSISTENCE_ERROR = `${CareDomain.APPOINTMENT}_300`,
  SCHEDULING_ENGINE_ERROR = `${CareDomain.APPOINTMENT}_301`
}

/**
 * Telemedicine domain error codes
 */
export enum TelemedicineErrorCode {
  // Business errors (001-099)
  SESSION_NOT_FOUND = `${CareDomain.TELEMEDICINE}_001`,
  PROVIDER_OFFLINE = `${CareDomain.TELEMEDICINE}_002`,
  SESSION_EXPIRED = `${CareDomain.TELEMEDICINE}_003`,
  SESSION_IN_PROGRESS = `${CareDomain.TELEMEDICINE}_004`,
  
  // Validation errors (100-199)
  DEVICE_ERROR = `${CareDomain.TELEMEDICINE}_100`,
  BROWSER_UNSUPPORTED = `${CareDomain.TELEMEDICINE}_101`,
  PERMISSION_DENIED = `${CareDomain.TELEMEDICINE}_102`,
  
  // External errors (200-299)
  CONNECTION_ERROR = `${CareDomain.TELEMEDICINE}_200`,
  SERVICE_ERROR = `${CareDomain.TELEMEDICINE}_201`,
  
  // Technical errors (300-399)
  RECORDING_ERROR = `${CareDomain.TELEMEDICINE}_300`,
  SIGNALING_ERROR = `${CareDomain.TELEMEDICINE}_301`,
  PERSISTENCE_ERROR = `${CareDomain.TELEMEDICINE}_302`
}

/**
 * Medication domain error codes
 */
export enum MedicationErrorCode {
  // Business errors (001-099)
  NOT_FOUND = `${CareDomain.MEDICATION}_001`,
  INTERACTION_DETECTED = `${CareDomain.MEDICATION}_002`,
  ADHERENCE_ERROR = `${CareDomain.MEDICATION}_003`,
  REFILL_LIMIT_REACHED = `${CareDomain.MEDICATION}_004`,
  
  // Validation errors (100-199)
  INVALID_DOSAGE = `${CareDomain.MEDICATION}_100`,
  INVALID_FREQUENCY = `${CareDomain.MEDICATION}_101`,
  INVALID_DURATION = `${CareDomain.MEDICATION}_102`,
  
  // External errors (200-299)
  EXTERNAL_LOOKUP_ERROR = `${CareDomain.MEDICATION}_200`,
  PHARMACY_INTEGRATION_ERROR = `${CareDomain.MEDICATION}_201`,
  
  // Technical errors (300-399)
  PERSISTENCE_ERROR = `${CareDomain.MEDICATION}_300`,
  REMINDER_SCHEDULING_ERROR = `${CareDomain.MEDICATION}_301`
}

/**
 * Symptom domain error codes
 */
export enum SymptomErrorCode {
  // Business errors (001-099)
  NOT_FOUND = `${CareDomain.SYMPTOM}_001`,
  ASSESSMENT_INCOMPLETE = `${CareDomain.SYMPTOM}_002`,
  URGENT_CARE_RECOMMENDED = `${CareDomain.SYMPTOM}_003`,
  
  // Validation errors (100-199)
  INVALID_SYMPTOM_DATA = `${CareDomain.SYMPTOM}_100`,
  MISSING_REQUIRED_INFORMATION = `${CareDomain.SYMPTOM}_101`,
  
  // External errors (200-299)
  KNOWLEDGE_BASE_ERROR = `${CareDomain.SYMPTOM}_200`,
  
  // Technical errors (300-399)
  ENGINE_FUNCTION_ERROR = `${CareDomain.SYMPTOM}_300`,
  PERSISTENCE_ERROR = `${CareDomain.SYMPTOM}_301`
}

/**
 * Treatment domain error codes
 */
export enum TreatmentErrorCode {
  // Business errors (001-099)
  PLAN_NOT_FOUND = `${CareDomain.TREATMENT}_001`,
  STEP_INVALID = `${CareDomain.TREATMENT}_002`,
  PLAN_CONFLICT = `${CareDomain.TREATMENT}_003`,
  PROGRESS_ERROR = `${CareDomain.TREATMENT}_004`,
  
  // Validation errors (100-199)
  INVALID_PLAN_DATA = `${CareDomain.TREATMENT}_100`,
  MISSING_REQUIRED_STEPS = `${CareDomain.TREATMENT}_101`,
  
  // External errors (200-299)
  CLINICAL_GUIDELINES_ERROR = `${CareDomain.TREATMENT}_200`,
  
  // Technical errors (300-399)
  PERSISTENCE_ERROR = `${CareDomain.TREATMENT}_300`,
  SCHEDULING_ERROR = `${CareDomain.TREATMENT}_301`
}

/**
 * All Care journey error codes combined
 */
export const CareErrorCodes = {
  Provider: ProviderErrorCode,
  Appointment: AppointmentErrorCode,
  Telemedicine: TelemedicineErrorCode,
  Medication: MedicationErrorCode,
  Symptom: SymptomErrorCode,
  Treatment: TreatmentErrorCode
};