/**
 * @file Care Journey Error Classes
 * @description Exports all error classes specific to the Care journey in the AUSTA SuperApp.
 * This barrel file serves as the single entry point for all error types related to the
 * Care journey, enabling consumers to import specific error classes with a clean syntax.
 * 
 * @example
 * // Import specific error classes
 * import { AppointmentNotFoundError } from '@austa/errors/journey/care';
 * 
 * // Import domain-specific error namespaces
 * import { Appointments } from '@austa/errors/journey/care';
 * 
 * try {
 *   // Application code
 * } catch (error) {
 *   if (error instanceof AppointmentNotFoundError) {
 *     // Handle appointment not found
 *   } else if (error instanceof Appointments.AppointmentOverlapError) {
 *     // Handle appointment overlap
 *   }
 * }
 */

// Import all error classes from domain-specific files
import * as AppointmentErrors from './appointment-errors';
import * as ProviderErrors from './provider-errors';
import * as TelemedicineErrors from './telemedicine-errors';
import * as MedicationErrors from './medication-errors';
import * as SymptomErrors from './symptom-errors';
import * as TreatmentErrors from './treatment-errors';

// Re-export all error codes
export * from './error-codes';

// Export individual error classes for direct import

// Appointment errors
export const {
  AppointmentNotFoundError,
  AppointmentDateInPastError,
  AppointmentOverlapError,
  AppointmentProviderUnavailableError,
  AppointmentPersistenceError,
  AppointmentCalendarSyncError
} = AppointmentErrors;

// Provider errors
export const {
  ProviderNotFoundError,
  ProviderUnavailableError,
  ProviderSpecialtyMismatchError,
  ProviderCredentialsError,
  ProviderDirectoryError
} = ProviderErrors;

// Telemedicine errors
export const {
  TelemedicineSessionNotFoundError,
  TelemedicineConnectionError,
  TelemedicineDeviceError,
  TelemedicineProviderOfflineError,
  TelemedicineRecordingError,
  TelemedicineServiceError
} = TelemedicineErrors;

// Medication errors
export const {
  MedicationNotFoundError,
  MedicationInteractionError,
  MedicationDosageError,
  MedicationAdherenceError,
  MedicationPersistenceError,
  MedicationExternalLookupError,
  PharmacyIntegrationError
} = MedicationErrors;

// Symptom errors
export const {
  SymptomNotFoundError,
  SymptomAssessmentIncompleteError,
  SymptomEngineFunctionError,
  UrgentCareRecommendationError,
  SymptomPersistenceError,
  MedicalKnowledgeBaseError
} = SymptomErrors;

// Treatment errors
export const {
  TreatmentPlanNotFoundError,
  TreatmentStepInvalidError,
  TreatmentPlanConflictError,
  TreatmentProgressError,
  TreatmentPersistenceError,
  ClinicalGuidelinesError
} = TreatmentErrors;

/**
 * Namespace containing all Appointment-related error classes.
 * Use this namespace to access all errors related to appointment scheduling,
 * booking, and management in the Care journey.
 */
export namespace Appointments {
  export const {
    AppointmentNotFoundError,
    AppointmentDateInPastError,
    AppointmentOverlapError,
    AppointmentProviderUnavailableError,
    AppointmentPersistenceError,
    AppointmentCalendarSyncError
  } = AppointmentErrors;
}

/**
 * Namespace containing all Provider-related error classes.
 * Use this namespace to access all errors related to healthcare providers
 * in the Care journey.
 */
export namespace Providers {
  export const {
    ProviderNotFoundError,
    ProviderUnavailableError,
    ProviderSpecialtyMismatchError,
    ProviderCredentialsError,
    ProviderDirectoryError
  } = ProviderErrors;
}

/**
 * Namespace containing all Telemedicine-related error classes.
 * Use this namespace to access all errors related to virtual consultations
 * and telemedicine sessions in the Care journey.
 */
export namespace Telemedicine {
  export const {
    TelemedicineSessionNotFoundError,
    TelemedicineConnectionError,
    TelemedicineDeviceError,
    TelemedicineProviderOfflineError,
    TelemedicineRecordingError,
    TelemedicineServiceError
  } = TelemedicineErrors;
}

/**
 * Namespace containing all Medication-related error classes.
 * Use this namespace to access all errors related to medication management,
 * adherence tracking, and pharmacy integration in the Care journey.
 */
export namespace Medications {
  export const {
    MedicationNotFoundError,
    MedicationInteractionError,
    MedicationDosageError,
    MedicationAdherenceError,
    MedicationPersistenceError,
    MedicationExternalLookupError,
    PharmacyIntegrationError
  } = MedicationErrors;
}

/**
 * Namespace containing all Symptom Checker-related error classes.
 * Use this namespace to access all errors related to symptom assessment
 * and care recommendations in the Care journey.
 */
export namespace Symptoms {
  export const {
    SymptomNotFoundError,
    SymptomAssessmentIncompleteError,
    SymptomEngineFunctionError,
    UrgentCareRecommendationError,
    SymptomPersistenceError,
    MedicalKnowledgeBaseError
  } = SymptomErrors;
}

/**
 * Namespace containing all Treatment-related error classes.
 * Use this namespace to access all errors related to treatment plans,
 * progress tracking, and clinical guidelines in the Care journey.
 */
export namespace Treatments {
  export const {
    TreatmentPlanNotFoundError,
    TreatmentStepInvalidError,
    TreatmentPlanConflictError,
    TreatmentProgressError,
    TreatmentPersistenceError,
    ClinicalGuidelinesError
  } = TreatmentErrors;
}