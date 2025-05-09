import * as CareErrors from '../../../../src/journey/care';

describe('Care Journey Errors', () => {
  describe('Export Structure', () => {
    it('should export all appointment error classes', () => {
      // Verify appointment error classes are exported
      expect(CareErrors.AppointmentNotFoundError).toBeDefined();
      expect(CareErrors.AppointmentDateInPastError).toBeDefined();
      expect(CareErrors.AppointmentOverlapError).toBeDefined();
      expect(CareErrors.AppointmentProviderUnavailableError).toBeDefined();
      expect(CareErrors.AppointmentPersistenceError).toBeDefined();
      expect(CareErrors.AppointmentCalendarSyncError).toBeDefined();
    });

    it('should export all provider error classes', () => {
      // Verify provider error classes are exported
      expect(CareErrors.ProviderNotFoundError).toBeDefined();
      expect(CareErrors.ProviderUnavailableError).toBeDefined();
      expect(CareErrors.ProviderSpecialtyMismatchError).toBeDefined();
      expect(CareErrors.ProviderCredentialsError).toBeDefined();
      expect(CareErrors.ProviderDirectoryError).toBeDefined();
    });

    it('should export all telemedicine error classes', () => {
      // Verify telemedicine error classes are exported
      expect(CareErrors.TelemedicineSessionNotFoundError).toBeDefined();
      expect(CareErrors.TelemedicineConnectionError).toBeDefined();
      expect(CareErrors.TelemedicineDeviceError).toBeDefined();
      expect(CareErrors.TelemedicineProviderOfflineError).toBeDefined();
      expect(CareErrors.TelemedicineRecordingError).toBeDefined();
      expect(CareErrors.TelemedicineServiceError).toBeDefined();
    });

    it('should export all medication error classes', () => {
      // Verify medication error classes are exported
      expect(CareErrors.MedicationNotFoundError).toBeDefined();
      expect(CareErrors.MedicationInteractionError).toBeDefined();
      expect(CareErrors.MedicationDosageError).toBeDefined();
      expect(CareErrors.MedicationAdherenceError).toBeDefined();
      expect(CareErrors.MedicationPersistenceError).toBeDefined();
      expect(CareErrors.MedicationExternalLookupError).toBeDefined();
      expect(CareErrors.PharmacyIntegrationError).toBeDefined();
    });

    it('should export all symptom error classes', () => {
      // Verify symptom error classes are exported
      expect(CareErrors.SymptomNotFoundError).toBeDefined();
      expect(CareErrors.SymptomAssessmentIncompleteError).toBeDefined();
      expect(CareErrors.SymptomEngineFunctionError).toBeDefined();
      expect(CareErrors.UrgentCareRecommendationError).toBeDefined();
      expect(CareErrors.SymptomPersistenceError).toBeDefined();
      expect(CareErrors.MedicalKnowledgeBaseError).toBeDefined();
    });

    it('should export all treatment error classes', () => {
      // Verify treatment error classes are exported
      expect(CareErrors.TreatmentPlanNotFoundError).toBeDefined();
      expect(CareErrors.TreatmentStepInvalidError).toBeDefined();
      expect(CareErrors.TreatmentPlanConflictError).toBeDefined();
      expect(CareErrors.TreatmentProgressError).toBeDefined();
      expect(CareErrors.TreatmentPersistenceError).toBeDefined();
      expect(CareErrors.ClinicalGuidelinesError).toBeDefined();
    });

    it('should export error codes', () => {
      // Verify error codes are exported
      expect(CareErrors.CARE_ERROR_CODES).toBeDefined();
      expect(CareErrors.CARE_ERROR_CODES.APPOINTMENT).toBeDefined();
      expect(CareErrors.CARE_ERROR_CODES.PROVIDER).toBeDefined();
      expect(CareErrors.CARE_ERROR_CODES.TELEMEDICINE).toBeDefined();
      expect(CareErrors.CARE_ERROR_CODES.MEDICATION).toBeDefined();
      expect(CareErrors.CARE_ERROR_CODES.SYMPTOM).toBeDefined();
      expect(CareErrors.CARE_ERROR_CODES.TREATMENT).toBeDefined();
    });
  });

  describe('Error Classification', () => {
    it('should classify appointment errors correctly', () => {
      // Verify error classification for appointment errors
      const notFoundError = new CareErrors.AppointmentNotFoundError('Appointment not found');
      const persistenceError = new CareErrors.AppointmentPersistenceError('Database error');
      const syncError = new CareErrors.AppointmentCalendarSyncError('Calendar sync failed');
      
      expect(notFoundError.type).toBe('BUSINESS');
      expect(persistenceError.type).toBe('TECHNICAL');
      expect(syncError.type).toBe('EXTERNAL');
    });

    it('should classify provider errors correctly', () => {
      // Verify error classification for provider errors
      const notFoundError = new CareErrors.ProviderNotFoundError('Provider not found');
      const directoryError = new CareErrors.ProviderDirectoryError('Provider directory unavailable');
      
      expect(notFoundError.type).toBe('BUSINESS');
      expect(directoryError.type).toBe('EXTERNAL');
    });

    it('should classify telemedicine errors correctly', () => {
      // Verify error classification for telemedicine errors
      const sessionError = new CareErrors.TelemedicineSessionNotFoundError('Session not found');
      const connectionError = new CareErrors.TelemedicineConnectionError('Connection failed');
      const serviceError = new CareErrors.TelemedicineServiceError('External service unavailable');
      
      expect(sessionError.type).toBe('BUSINESS');
      expect(connectionError.type).toBe('TECHNICAL');
      expect(serviceError.type).toBe('EXTERNAL');
    });
  });

  describe('Error Codes', () => {
    it('should use correct error code prefixes for appointment errors', () => {
      // Verify error code prefixes for appointment errors
      const notFoundError = new CareErrors.AppointmentNotFoundError('Appointment not found');
      const dateError = new CareErrors.AppointmentDateInPastError('Cannot book in the past');
      
      expect(notFoundError.code).toMatch(/^CARE_APPOINTMENT_/);
      expect(dateError.code).toMatch(/^CARE_APPOINTMENT_/);
    });

    it('should use correct error code prefixes for provider errors', () => {
      // Verify error code prefixes for provider errors
      const notFoundError = new CareErrors.ProviderNotFoundError('Provider not found');
      const unavailableError = new CareErrors.ProviderUnavailableError('Provider is unavailable');
      
      expect(notFoundError.code).toMatch(/^CARE_PROVIDER_/);
      expect(unavailableError.code).toMatch(/^CARE_PROVIDER_/);
    });

    it('should use correct error code prefixes for medication errors', () => {
      // Verify error code prefixes for medication errors
      const notFoundError = new CareErrors.MedicationNotFoundError('Medication not found');
      const interactionError = new CareErrors.MedicationInteractionError('Drug interaction detected');
      
      expect(notFoundError.code).toMatch(/^CARE_MEDICATION_/);
      expect(interactionError.code).toMatch(/^CARE_MEDICATION_/);
    });
  });

  describe('Error Context', () => {
    it('should include context data in appointment errors', () => {
      // Verify context data in appointment errors
      const appointmentId = '12345';
      const notFoundError = new CareErrors.AppointmentNotFoundError(
        'Appointment not found',
        { appointmentId }
      );
      
      expect(notFoundError.context).toBeDefined();
      expect(notFoundError.context.appointmentId).toBe(appointmentId);
    });

    it('should include context data in medication errors', () => {
      // Verify context data in medication errors
      const medicationId = '12345';
      const interactingMedication = '67890';
      const interactionError = new CareErrors.MedicationInteractionError(
        'Drug interaction detected',
        { medicationId, interactingMedication }
      );
      
      expect(interactionError.context).toBeDefined();
      expect(interactionError.context.medicationId).toBe(medicationId);
      expect(interactionError.context.interactingMedication).toBe(interactingMedication);
    });

    it('should include context data in telemedicine errors', () => {
      // Verify context data in telemedicine errors
      const sessionId = '12345';
      const deviceInfo = { type: 'webcam', status: 'disconnected' };
      const deviceError = new CareErrors.TelemedicineDeviceError(
        'Device error',
        { sessionId, deviceInfo }
      );
      
      expect(deviceError.context).toBeDefined();
      expect(deviceError.context.sessionId).toBe(sessionId);
      expect(deviceError.context.deviceInfo).toEqual(deviceInfo);
    });
  });
});