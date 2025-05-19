import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the error classes and related types
import {
  MedicationNotFoundError,
  MedicationInteractionError,
  MedicationDosageError,
  MedicationAdherenceError,
  MedicationPersistenceError,
  MedicationExternalLookupError,
  PharmacyIntegrationError
} from '../../../../src/journey/care/medication-errors';
import { ErrorType } from '../../../../src/base';
import { CARE_MEDICATION_ERROR_CODES } from '../../../../src/journey/care/error-codes';

/**
 * Test suite for Care journey medication error classes
 * Verifies error classification, code prefixing, context capture, and HTTP status code mapping
 */
describe('Care Journey Medication Errors', () => {
  // Common test data
  const medicationId = 'med-123';
  const userId = 'user-456';
  const dosage = '10mg twice daily';
  const interactingMedications = ['med-456', 'med-789'];
  const requestId = 'req-abc123';

  describe('MedicationNotFoundError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new MedicationNotFoundError({
        medicationId,
        message: `Medication with ID ${medicationId} not found`,
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.MEDICATION_NOT_FOUND);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture medication-specific context', () => {
      const error = new MedicationNotFoundError({
        medicationId,
        message: `Medication with ID ${medicationId} not found`,
        context: { requestId, userId }
      });

      expect(error.details).toEqual({ medicationId });
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new MedicationNotFoundError({
        medicationId,
        message: `Medication with ID ${medicationId} not found`,
      });

      const httpException = error.toHttpException();
      
      // Business errors map to 422 Unprocessable Entity
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('MedicationInteractionError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new MedicationInteractionError({
        medicationId,
        interactingMedications,
        message: 'Potential dangerous interaction detected',
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.MEDICATION_INTERACTION);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture interaction-specific context', () => {
      const error = new MedicationInteractionError({
        medicationId,
        interactingMedications,
        interactionSeverity: 'high',
        message: 'Potential dangerous interaction detected',
        context: { requestId, userId }
      });

      expect(error.details).toEqual({
        medicationId,
        interactingMedications,
        interactionSeverity: 'high'
      });
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new MedicationInteractionError({
        medicationId,
        interactingMedications,
        message: 'Potential dangerous interaction detected',
      });

      const httpException = error.toHttpException();
      
      // Business errors map to 422 Unprocessable Entity
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('MedicationDosageError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new MedicationDosageError({
        medicationId,
        dosage,
        message: 'Invalid medication dosage',
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.INVALID_DOSAGE);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture dosage-specific context', () => {
      const recommendedDosage = '5mg once daily';
      const error = new MedicationDosageError({
        medicationId,
        dosage,
        recommendedDosage,
        message: 'Invalid medication dosage',
        context: { requestId, userId }
      });

      expect(error.details).toEqual({
        medicationId,
        dosage,
        recommendedDosage
      });
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new MedicationDosageError({
        medicationId,
        dosage,
        message: 'Invalid medication dosage',
      });

      const httpException = error.toHttpException();
      
      // Validation errors map to 400 Bad Request
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('MedicationAdherenceError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new MedicationAdherenceError({
        medicationId,
        adherenceRate: 0.65,
        message: 'Low medication adherence detected',
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.ADHERENCE_ISSUE);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture adherence-specific context', () => {
      const error = new MedicationAdherenceError({
        medicationId,
        adherenceRate: 0.65,
        expectedAdherenceRate: 0.9,
        missedDoses: 3,
        message: 'Low medication adherence detected',
        context: { requestId, userId }
      });

      expect(error.details).toEqual({
        medicationId,
        adherenceRate: 0.65,
        expectedAdherenceRate: 0.9,
        missedDoses: 3
      });
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new MedicationAdherenceError({
        medicationId,
        adherenceRate: 0.65,
        message: 'Low medication adherence detected',
      });

      const httpException = error.toHttpException();
      
      // Business errors map to 422 Unprocessable Entity
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('MedicationPersistenceError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new MedicationPersistenceError({
        medicationId,
        operation: 'create',
        message: 'Failed to persist medication data',
        cause: new Error('Database connection error'),
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.PERSISTENCE_FAILURE);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture persistence-specific context', () => {
      const error = new MedicationPersistenceError({
        medicationId,
        operation: 'create',
        message: 'Failed to persist medication data',
        cause: new Error('Database connection error'),
        context: { requestId, userId }
      });

      expect(error.details).toEqual({
        medicationId,
        operation: 'create'
      });
      expect(error.cause).toBeDefined();
      expect(error.cause.message).toBe('Database connection error');
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new MedicationPersistenceError({
        medicationId,
        operation: 'create',
        message: 'Failed to persist medication data',
        cause: new Error('Database connection error')
      });

      const httpException = error.toHttpException();
      
      // Technical errors map to 500 Internal Server Error
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('MedicationExternalLookupError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new MedicationExternalLookupError({
        medicationId,
        externalSystem: 'DrugInfoAPI',
        message: 'Failed to retrieve medication information from external system',
        cause: new Error('API timeout'),
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.EXTERNAL_LOOKUP_FAILURE);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture external lookup-specific context', () => {
      const error = new MedicationExternalLookupError({
        medicationId,
        externalSystem: 'DrugInfoAPI',
        externalReference: 'DI-456',
        message: 'Failed to retrieve medication information from external system',
        cause: new Error('API timeout'),
        context: { requestId, userId }
      });

      expect(error.details).toEqual({
        medicationId,
        externalSystem: 'DrugInfoAPI',
        externalReference: 'DI-456'
      });
      expect(error.cause).toBeDefined();
      expect(error.cause.message).toBe('API timeout');
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new MedicationExternalLookupError({
        medicationId,
        externalSystem: 'DrugInfoAPI',
        message: 'Failed to retrieve medication information from external system',
        cause: new Error('API timeout')
      });

      const httpException = error.toHttpException();
      
      // External errors map to 502 Bad Gateway
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('PharmacyIntegrationError', () => {
    it('should create error with correct type and code prefix', () => {
      const error = new PharmacyIntegrationError({
        medicationId,
        pharmacyId: 'pharm-123',
        message: 'Failed to send prescription to pharmacy',
        cause: new Error('Integration service unavailable'),
        context: { requestId, userId }
      });

      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(CARE_MEDICATION_ERROR_CODES.PHARMACY_INTEGRATION_FAILURE);
      expect(error.code.startsWith('CARE_MEDICATION_')).toBe(true);
    });

    it('should capture pharmacy-specific context', () => {
      const error = new PharmacyIntegrationError({
        medicationId,
        pharmacyId: 'pharm-123',
        prescriptionId: 'rx-789',
        message: 'Failed to send prescription to pharmacy',
        cause: new Error('Integration service unavailable'),
        context: { requestId, userId }
      });

      expect(error.details).toEqual({
        medicationId,
        pharmacyId: 'pharm-123',
        prescriptionId: 'rx-789'
      });
      expect(error.cause).toBeDefined();
      expect(error.cause.message).toBe('Integration service unavailable');
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new PharmacyIntegrationError({
        medicationId,
        pharmacyId: 'pharm-123',
        message: 'Failed to send prescription to pharmacy',
        cause: new Error('Integration service unavailable')
      });

      const httpException = error.toHttpException();
      
      // External errors map to 502 Bad Gateway
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error Serialization', () => {
    it('should properly serialize medication errors to JSON', () => {
      const error = new MedicationInteractionError({
        medicationId,
        interactingMedications,
        interactionSeverity: 'high',
        message: 'Potential dangerous interaction detected',
        context: { requestId, userId }
      });

      const json = error.toJSON();

      // Verify JSON structure
      expect(json.error).toBeDefined();
      expect(json.error.type).toBe(ErrorType.BUSINESS);
      expect(json.error.code).toBe(CARE_MEDICATION_ERROR_CODES.MEDICATION_INTERACTION);
      expect(json.error.message).toBe('Potential dangerous interaction detected');
      expect(json.error.details).toEqual({
        medicationId,
        interactingMedications,
        interactionSeverity: 'high'
      });
      expect(json.error.context).toBeDefined();
      expect(json.error.context.requestId).toBe(requestId);
      expect(json.error.context.userId).toBe(userId);
    });

    it('should include stack trace and cause when requested', () => {
      const cause = new Error('Original database error');
      const error = new MedicationPersistenceError({
        medicationId,
        operation: 'update',
        message: 'Failed to update medication record',
        cause,
        context: { requestId, userId }
      });

      const json = error.toJSON({ includeStack: true });

      // Verify stack and cause are included
      expect(json.error.stack).toBeDefined();
      expect(json.error.cause).toBeDefined();
      expect(json.error.cause.message).toBe('Original database error');
    });
  });

  describe('Error Context Propagation', () => {
    it('should propagate context from cause error', () => {
      // Create a cause error with context
      const causeError = new MedicationNotFoundError({
        medicationId,
        message: 'Medication not found',
        context: {
          requestId,
          userId,
          journeyContext: 'care'
        }
      });

      // Create a new error with the cause
      const error = new MedicationPersistenceError({
        medicationId,
        operation: 'read',
        message: 'Failed to read medication data',
        cause: causeError
      });

      // Context should be propagated from cause
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
      expect(error.context.journeyContext).toBe('care');
    });
  });
});