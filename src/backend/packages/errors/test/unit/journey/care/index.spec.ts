import * as CareErrors from '../../../../src/journey/care';
import * as AppointmentErrors from '../../../../src/journey/care/appointment-errors';
import * as ProviderErrors from '../../../../src/journey/care/provider-errors';
import * as TelemedicineErrors from '../../../../src/journey/care/telemedicine-errors';
import * as MedicationErrors from '../../../../src/journey/care/medication-errors';
import * as SymptomErrors from '../../../../src/journey/care/symptom-errors';
import * as TreatmentErrors from '../../../../src/journey/care/treatment-errors';
import * as ErrorCodes from '../../../../src/journey/care/error-codes';

describe('Care Journey Errors Barrel File', () => {
  describe('Export Structure', () => {
    it('should export all appointment errors', () => {
      // Get all exported members from appointment-errors.ts
      const appointmentErrorNames = Object.keys(AppointmentErrors);
      
      // Verify each error is exported through the barrel file
      appointmentErrorNames.forEach(errorName => {
        expect(CareErrors).toHaveProperty(errorName);
        expect(CareErrors[errorName]).toBe(AppointmentErrors[errorName]);
      });
    });

    it('should export all provider errors', () => {
      const providerErrorNames = Object.keys(ProviderErrors);
      
      providerErrorNames.forEach(errorName => {
        expect(CareErrors).toHaveProperty(errorName);
        expect(CareErrors[errorName]).toBe(ProviderErrors[errorName]);
      });
    });

    it('should export all telemedicine errors', () => {
      const telemedicineErrorNames = Object.keys(TelemedicineErrors);
      
      telemedicineErrorNames.forEach(errorName => {
        expect(CareErrors).toHaveProperty(errorName);
        expect(CareErrors[errorName]).toBe(TelemedicineErrors[errorName]);
      });
    });

    it('should export all medication errors', () => {
      const medicationErrorNames = Object.keys(MedicationErrors);
      
      medicationErrorNames.forEach(errorName => {
        expect(CareErrors).toHaveProperty(errorName);
        expect(CareErrors[errorName]).toBe(MedicationErrors[errorName]);
      });
    });

    it('should export all symptom errors', () => {
      const symptomErrorNames = Object.keys(SymptomErrors);
      
      symptomErrorNames.forEach(errorName => {
        expect(CareErrors).toHaveProperty(errorName);
        expect(CareErrors[errorName]).toBe(SymptomErrors[errorName]);
      });
    });

    it('should export all treatment errors', () => {
      const treatmentErrorNames = Object.keys(TreatmentErrors);
      
      treatmentErrorNames.forEach(errorName => {
        expect(CareErrors).toHaveProperty(errorName);
        expect(CareErrors[errorName]).toBe(TreatmentErrors[errorName]);
      });
    });

    it('should export error codes', () => {
      const errorCodeNames = Object.keys(ErrorCodes);
      
      errorCodeNames.forEach(codeName => {
        expect(CareErrors).toHaveProperty(codeName);
        expect(CareErrors[codeName]).toBe(ErrorCodes[codeName]);
      });
    });
  });

  describe('Namespaced Exports', () => {
    it('should provide namespaced access to appointment errors', () => {
      expect(CareErrors.Appointment).toBeDefined();
      
      const appointmentErrorNames = Object.keys(AppointmentErrors);
      appointmentErrorNames.forEach(errorName => {
        expect(CareErrors.Appointment).toHaveProperty(errorName);
        expect(CareErrors.Appointment[errorName]).toBe(AppointmentErrors[errorName]);
      });
    });

    it('should provide namespaced access to provider errors', () => {
      expect(CareErrors.Provider).toBeDefined();
      
      const providerErrorNames = Object.keys(ProviderErrors);
      providerErrorNames.forEach(errorName => {
        expect(CareErrors.Provider).toHaveProperty(errorName);
        expect(CareErrors.Provider[errorName]).toBe(ProviderErrors[errorName]);
      });
    });

    it('should provide namespaced access to telemedicine errors', () => {
      expect(CareErrors.Telemedicine).toBeDefined();
      
      const telemedicineErrorNames = Object.keys(TelemedicineErrors);
      telemedicineErrorNames.forEach(errorName => {
        expect(CareErrors.Telemedicine).toHaveProperty(errorName);
        expect(CareErrors.Telemedicine[errorName]).toBe(TelemedicineErrors[errorName]);
      });
    });

    it('should provide namespaced access to medication errors', () => {
      expect(CareErrors.Medication).toBeDefined();
      
      const medicationErrorNames = Object.keys(MedicationErrors);
      medicationErrorNames.forEach(errorName => {
        expect(CareErrors.Medication).toHaveProperty(errorName);
        expect(CareErrors.Medication[errorName]).toBe(MedicationErrors[errorName]);
      });
    });

    it('should provide namespaced access to symptom errors', () => {
      expect(CareErrors.Symptom).toBeDefined();
      
      const symptomErrorNames = Object.keys(SymptomErrors);
      symptomErrorNames.forEach(errorName => {
        expect(CareErrors.Symptom).toHaveProperty(errorName);
        expect(CareErrors.Symptom[errorName]).toBe(SymptomErrors[errorName]);
      });
    });

    it('should provide namespaced access to treatment errors', () => {
      expect(CareErrors.Treatment).toBeDefined();
      
      const treatmentErrorNames = Object.keys(TreatmentErrors);
      treatmentErrorNames.forEach(errorName => {
        expect(CareErrors.Treatment).toHaveProperty(errorName);
        expect(CareErrors.Treatment[errorName]).toBe(TreatmentErrors[errorName]);
      });
    });
  });

  describe('Error Class Verification', () => {
    it('should export specific appointment error classes', () => {
      expect(CareErrors.AppointmentNotFoundError).toBeDefined();
      expect(CareErrors.AppointmentDateInPastError).toBeDefined();
      expect(CareErrors.AppointmentOverlapError).toBeDefined();
      expect(CareErrors.AppointmentProviderUnavailableError).toBeDefined();
      expect(CareErrors.AppointmentPersistenceError).toBeDefined();
      expect(CareErrors.AppointmentCalendarSyncError).toBeDefined();
    });

    it('should export specific provider error classes', () => {
      expect(CareErrors.ProviderNotFoundError).toBeDefined();
      expect(CareErrors.ProviderUnavailableError).toBeDefined();
      expect(CareErrors.ProviderSpecialtyMismatchError).toBeDefined();
      expect(CareErrors.ProviderCredentialsError).toBeDefined();
      expect(CareErrors.ProviderDirectoryError).toBeDefined();
    });

    it('should export specific telemedicine error classes', () => {
      expect(CareErrors.TelemedicineSessionNotFoundError).toBeDefined();
      expect(CareErrors.TelemedicineConnectionError).toBeDefined();
      expect(CareErrors.TelemedicineDeviceError).toBeDefined();
      expect(CareErrors.TelemedicineProviderOfflineError).toBeDefined();
      expect(CareErrors.TelemedicineRecordingError).toBeDefined();
      expect(CareErrors.TelemedicineServiceError).toBeDefined();
    });

    it('should export specific medication error classes', () => {
      expect(CareErrors.MedicationNotFoundError).toBeDefined();
      expect(CareErrors.MedicationInteractionError).toBeDefined();
      expect(CareErrors.MedicationDosageError).toBeDefined();
      expect(CareErrors.MedicationAdherenceError).toBeDefined();
      expect(CareErrors.MedicationPersistenceError).toBeDefined();
      expect(CareErrors.MedicationExternalLookupError).toBeDefined();
      expect(CareErrors.PharmacyIntegrationError).toBeDefined();
    });

    it('should export specific symptom error classes', () => {
      expect(CareErrors.SymptomNotFoundError).toBeDefined();
      expect(CareErrors.SymptomAssessmentIncompleteError).toBeDefined();
      expect(CareErrors.SymptomEngineFunctionError).toBeDefined();
      expect(CareErrors.UrgentCareRecommendationError).toBeDefined();
      expect(CareErrors.SymptomPersistenceError).toBeDefined();
      expect(CareErrors.MedicalKnowledgeBaseError).toBeDefined();
    });

    it('should export specific treatment error classes', () => {
      expect(CareErrors.TreatmentPlanNotFoundError).toBeDefined();
      expect(CareErrors.TreatmentStepInvalidError).toBeDefined();
      expect(CareErrors.TreatmentPlanConflictError).toBeDefined();
      expect(CareErrors.TreatmentProgressError).toBeDefined();
      expect(CareErrors.TreatmentPersistenceError).toBeDefined();
      expect(CareErrors.ClinicalGuidelinesError).toBeDefined();
    });
  });

  describe('Import Pattern Consistency', () => {
    it('should allow importing specific errors directly', () => {
      const { AppointmentNotFoundError, ProviderNotFoundError } = CareErrors;
      expect(AppointmentNotFoundError).toBe(AppointmentErrors.AppointmentNotFoundError);
      expect(ProviderNotFoundError).toBe(ProviderErrors.ProviderNotFoundError);
    });

    it('should allow importing errors through namespaces', () => {
      const { Appointment, Provider, Telemedicine, Medication, Symptom, Treatment } = CareErrors;
      
      expect(Appointment.AppointmentNotFoundError).toBe(AppointmentErrors.AppointmentNotFoundError);
      expect(Provider.ProviderNotFoundError).toBe(ProviderErrors.ProviderNotFoundError);
      expect(Telemedicine.TelemedicineSessionNotFoundError).toBe(TelemedicineErrors.TelemedicineSessionNotFoundError);
      expect(Medication.MedicationNotFoundError).toBe(MedicationErrors.MedicationNotFoundError);
      expect(Symptom.SymptomNotFoundError).toBe(SymptomErrors.SymptomNotFoundError);
      expect(Treatment.TreatmentPlanNotFoundError).toBe(TreatmentErrors.TreatmentPlanNotFoundError);
    });
  });
});