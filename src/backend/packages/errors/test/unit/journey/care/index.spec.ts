import { describe, expect, it } from '@jest/globals';
import * as CareErrors from '../../../../../../src/journey/care';

describe('Care Journey Errors Barrel File', () => {
  describe('Direct exports', () => {
    it('should export all appointment error classes', () => {
      expect(CareErrors.AppointmentNotFoundError).toBeDefined();
      expect(CareErrors.AppointmentDateInPastError).toBeDefined();
      expect(CareErrors.AppointmentOverlapError).toBeDefined();
      expect(CareErrors.AppointmentProviderUnavailableError).toBeDefined();
      expect(CareErrors.AppointmentPersistenceError).toBeDefined();
      expect(CareErrors.AppointmentCalendarSyncError).toBeDefined();
    });

    it('should export all provider error classes', () => {
      expect(CareErrors.ProviderNotFoundError).toBeDefined();
      expect(CareErrors.ProviderUnavailableError).toBeDefined();
      expect(CareErrors.ProviderSpecialtyMismatchError).toBeDefined();
      expect(CareErrors.ProviderCredentialsError).toBeDefined();
      expect(CareErrors.ProviderDirectoryError).toBeDefined();
    });

    it('should export all telemedicine error classes', () => {
      expect(CareErrors.TelemedicineSessionNotFoundError).toBeDefined();
      expect(CareErrors.TelemedicineConnectionError).toBeDefined();
      expect(CareErrors.TelemedicineDeviceError).toBeDefined();
      expect(CareErrors.TelemedicineProviderOfflineError).toBeDefined();
      expect(CareErrors.TelemedicineRecordingError).toBeDefined();
      expect(CareErrors.TelemedicineServiceError).toBeDefined();
    });

    it('should export all medication error classes', () => {
      expect(CareErrors.MedicationNotFoundError).toBeDefined();
      expect(CareErrors.MedicationInteractionError).toBeDefined();
      expect(CareErrors.MedicationDosageError).toBeDefined();
      expect(CareErrors.MedicationAdherenceError).toBeDefined();
      expect(CareErrors.MedicationPersistenceError).toBeDefined();
      expect(CareErrors.MedicationExternalLookupError).toBeDefined();
      expect(CareErrors.PharmacyIntegrationError).toBeDefined();
    });

    it('should export all symptom error classes', () => {
      expect(CareErrors.SymptomNotFoundError).toBeDefined();
      expect(CareErrors.SymptomAssessmentIncompleteError).toBeDefined();
      expect(CareErrors.SymptomEngineFunctionError).toBeDefined();
      expect(CareErrors.UrgentCareRecommendationError).toBeDefined();
      expect(CareErrors.SymptomPersistenceError).toBeDefined();
      expect(CareErrors.MedicalKnowledgeBaseError).toBeDefined();
    });

    it('should export all treatment error classes', () => {
      expect(CareErrors.TreatmentPlanNotFoundError).toBeDefined();
      expect(CareErrors.TreatmentStepInvalidError).toBeDefined();
      expect(CareErrors.TreatmentPlanConflictError).toBeDefined();
      expect(CareErrors.TreatmentProgressError).toBeDefined();
      expect(CareErrors.TreatmentPersistenceError).toBeDefined();
      expect(CareErrors.ClinicalGuidelinesError).toBeDefined();
    });
  });

  describe('Namespace exports', () => {
    it('should export the Appointments namespace with all appointment error classes', () => {
      expect(CareErrors.Appointments).toBeDefined();
      expect(CareErrors.Appointments.AppointmentNotFoundError).toBeDefined();
      expect(CareErrors.Appointments.AppointmentDateInPastError).toBeDefined();
      expect(CareErrors.Appointments.AppointmentOverlapError).toBeDefined();
      expect(CareErrors.Appointments.AppointmentProviderUnavailableError).toBeDefined();
      expect(CareErrors.Appointments.AppointmentPersistenceError).toBeDefined();
      expect(CareErrors.Appointments.AppointmentCalendarSyncError).toBeDefined();
    });

    it('should export the Providers namespace with all provider error classes', () => {
      expect(CareErrors.Providers).toBeDefined();
      expect(CareErrors.Providers.ProviderNotFoundError).toBeDefined();
      expect(CareErrors.Providers.ProviderUnavailableError).toBeDefined();
      expect(CareErrors.Providers.ProviderSpecialtyMismatchError).toBeDefined();
      expect(CareErrors.Providers.ProviderCredentialsError).toBeDefined();
      expect(CareErrors.Providers.ProviderDirectoryError).toBeDefined();
    });

    it('should export the Telemedicine namespace with all telemedicine error classes', () => {
      expect(CareErrors.Telemedicine).toBeDefined();
      expect(CareErrors.Telemedicine.TelemedicineSessionNotFoundError).toBeDefined();
      expect(CareErrors.Telemedicine.TelemedicineConnectionError).toBeDefined();
      expect(CareErrors.Telemedicine.TelemedicineDeviceError).toBeDefined();
      expect(CareErrors.Telemedicine.TelemedicineProviderOfflineError).toBeDefined();
      expect(CareErrors.Telemedicine.TelemedicineRecordingError).toBeDefined();
      expect(CareErrors.Telemedicine.TelemedicineServiceError).toBeDefined();
    });

    it('should export the Medications namespace with all medication error classes', () => {
      expect(CareErrors.Medications).toBeDefined();
      expect(CareErrors.Medications.MedicationNotFoundError).toBeDefined();
      expect(CareErrors.Medications.MedicationInteractionError).toBeDefined();
      expect(CareErrors.Medications.MedicationDosageError).toBeDefined();
      expect(CareErrors.Medications.MedicationAdherenceError).toBeDefined();
      expect(CareErrors.Medications.MedicationPersistenceError).toBeDefined();
      expect(CareErrors.Medications.MedicationExternalLookupError).toBeDefined();
      expect(CareErrors.Medications.PharmacyIntegrationError).toBeDefined();
    });

    it('should export the Symptoms namespace with all symptom error classes', () => {
      expect(CareErrors.Symptoms).toBeDefined();
      expect(CareErrors.Symptoms.SymptomNotFoundError).toBeDefined();
      expect(CareErrors.Symptoms.SymptomAssessmentIncompleteError).toBeDefined();
      expect(CareErrors.Symptoms.SymptomEngineFunctionError).toBeDefined();
      expect(CareErrors.Symptoms.UrgentCareRecommendationError).toBeDefined();
      expect(CareErrors.Symptoms.SymptomPersistenceError).toBeDefined();
      expect(CareErrors.Symptoms.MedicalKnowledgeBaseError).toBeDefined();
    });

    it('should export the Treatments namespace with all treatment error classes', () => {
      expect(CareErrors.Treatments).toBeDefined();
      expect(CareErrors.Treatments.TreatmentPlanNotFoundError).toBeDefined();
      expect(CareErrors.Treatments.TreatmentStepInvalidError).toBeDefined();
      expect(CareErrors.Treatments.TreatmentPlanConflictError).toBeDefined();
      expect(CareErrors.Treatments.TreatmentProgressError).toBeDefined();
      expect(CareErrors.Treatments.TreatmentPersistenceError).toBeDefined();
      expect(CareErrors.Treatments.ClinicalGuidelinesError).toBeDefined();
    });
  });

  describe('Error codes', () => {
    it('should export all appointment error codes', () => {
      expect(CareErrors.CARE_APPOINTMENT_VALIDATION_INVALID_DATE).toBeDefined();
      expect(CareErrors.CARE_APPOINTMENT_BUSINESS_SLOT_UNAVAILABLE).toBeDefined();
      expect(CareErrors.CARE_APPOINTMENT_TECHNICAL_CALENDAR_SYNC_FAILED).toBeDefined();
      expect(CareErrors.CARE_APPOINTMENT_EXTERNAL_PROVIDER_SYSTEM_UNAVAILABLE).toBeDefined();
    });

    it('should export all provider error codes', () => {
      expect(CareErrors.CARE_PROVIDER_VALIDATION_INVALID_SPECIALTY).toBeDefined();
      expect(CareErrors.CARE_PROVIDER_BUSINESS_NOT_FOUND).toBeDefined();
      expect(CareErrors.CARE_PROVIDER_TECHNICAL_DIRECTORY_ERROR).toBeDefined();
      expect(CareErrors.CARE_PROVIDER_EXTERNAL_DIRECTORY_API_ERROR).toBeDefined();
    });

    it('should export all telemedicine error codes', () => {
      expect(CareErrors.CARE_TELEMEDICINE_VALIDATION_INVALID_SESSION).toBeDefined();
      expect(CareErrors.CARE_TELEMEDICINE_BUSINESS_SESSION_NOT_FOUND).toBeDefined();
      expect(CareErrors.CARE_TELEMEDICINE_TECHNICAL_VIDEO_SERVICE_ERROR).toBeDefined();
      expect(CareErrors.CARE_TELEMEDICINE_EXTERNAL_VIDEO_PROVIDER_ERROR).toBeDefined();
    });

    it('should export all medication error codes', () => {
      expect(CareErrors.CARE_MEDICATION_VALIDATION_INVALID_NAME).toBeDefined();
      expect(CareErrors.CARE_MEDICATION_BUSINESS_NOT_FOUND).toBeDefined();
      expect(CareErrors.CARE_MEDICATION_TECHNICAL_DATABASE_ERROR).toBeDefined();
      expect(CareErrors.CARE_MEDICATION_EXTERNAL_PHARMACY_API_ERROR).toBeDefined();
    });

    it('should export all symptom error codes', () => {
      expect(CareErrors.CARE_SYMPTOM_VALIDATION_INVALID_DESCRIPTION).toBeDefined();
      expect(CareErrors.CARE_SYMPTOM_BUSINESS_NOT_FOUND).toBeDefined();
      expect(CareErrors.CARE_SYMPTOM_TECHNICAL_CHECKER_ENGINE_ERROR).toBeDefined();
      expect(CareErrors.CARE_SYMPTOM_EXTERNAL_MEDICAL_DATABASE_ERROR).toBeDefined();
    });

    it('should export all treatment error codes', () => {
      expect(CareErrors.CARE_TREATMENT_VALIDATION_INVALID_TYPE).toBeDefined();
      expect(CareErrors.CARE_TREATMENT_BUSINESS_NOT_FOUND).toBeDefined();
      expect(CareErrors.CARE_TREATMENT_TECHNICAL_PLAN_GENERATION_ERROR).toBeDefined();
      expect(CareErrors.CARE_TREATMENT_EXTERNAL_PROTOCOL_DATABASE_ERROR).toBeDefined();
    });
  });

  describe('Error class instantiation', () => {
    it('should be able to instantiate appointment error classes', () => {
      const error = new CareErrors.AppointmentNotFoundError('appointment-123');
      expect(error).toBeInstanceOf(CareErrors.AppointmentNotFoundError);
      expect(error.message).toContain('appointment-123');
    });

    it('should be able to instantiate provider error classes', () => {
      const error = new CareErrors.ProviderNotFoundError('provider-123');
      expect(error).toBeInstanceOf(CareErrors.ProviderNotFoundError);
      expect(error.message).toContain('provider-123');
    });

    it('should be able to instantiate telemedicine error classes', () => {
      const error = new CareErrors.TelemedicineSessionNotFoundError('session-123');
      expect(error).toBeInstanceOf(CareErrors.TelemedicineSessionNotFoundError);
      expect(error.message).toContain('session-123');
    });

    it('should be able to instantiate medication error classes', () => {
      const error = new CareErrors.MedicationNotFoundError('medication-123');
      expect(error).toBeInstanceOf(CareErrors.MedicationNotFoundError);
      expect(error.message).toContain('medication-123');
    });

    it('should be able to instantiate symptom error classes', () => {
      const error = new CareErrors.SymptomNotFoundError('symptom-123');
      expect(error).toBeInstanceOf(CareErrors.SymptomNotFoundError);
      expect(error.message).toContain('symptom-123');
    });

    it('should be able to instantiate treatment error classes', () => {
      const error = new CareErrors.TreatmentPlanNotFoundError('treatment-123');
      expect(error).toBeInstanceOf(CareErrors.TreatmentPlanNotFoundError);
      expect(error.message).toContain('treatment-123');
    });
  });

  describe('Namespace error class instantiation', () => {
    it('should be able to instantiate appointment error classes from namespace', () => {
      const error = new CareErrors.Appointments.AppointmentNotFoundError('appointment-123');
      expect(error).toBeInstanceOf(CareErrors.AppointmentNotFoundError);
      expect(error.message).toContain('appointment-123');
    });

    it('should be able to instantiate provider error classes from namespace', () => {
      const error = new CareErrors.Providers.ProviderNotFoundError('provider-123');
      expect(error).toBeInstanceOf(CareErrors.ProviderNotFoundError);
      expect(error.message).toContain('provider-123');
    });

    it('should be able to instantiate telemedicine error classes from namespace', () => {
      const error = new CareErrors.Telemedicine.TelemedicineSessionNotFoundError('session-123');
      expect(error).toBeInstanceOf(CareErrors.TelemedicineSessionNotFoundError);
      expect(error.message).toContain('session-123');
    });

    it('should be able to instantiate medication error classes from namespace', () => {
      const error = new CareErrors.Medications.MedicationNotFoundError('medication-123');
      expect(error).toBeInstanceOf(CareErrors.MedicationNotFoundError);
      expect(error.message).toContain('medication-123');
    });

    it('should be able to instantiate symptom error classes from namespace', () => {
      const error = new CareErrors.Symptoms.SymptomNotFoundError('symptom-123');
      expect(error).toBeInstanceOf(CareErrors.SymptomNotFoundError);
      expect(error.message).toContain('symptom-123');
    });

    it('should be able to instantiate treatment error classes from namespace', () => {
      const error = new CareErrors.Treatments.TreatmentPlanNotFoundError('treatment-123');
      expect(error).toBeInstanceOf(CareErrors.TreatmentPlanNotFoundError);
      expect(error.message).toContain('treatment-123');
    });
  });
});