import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../../shared/src/exceptions/exceptions.types';
import {
  MedicationNotFoundError,
  MedicationInteractionError,
  MedicationDosageError,
  MedicationAdherenceError,
  MedicationPersistenceError,
  MedicationExternalLookupError,
  PharmacyIntegrationError
} from '../../../../../src/journey/care/medication-errors';

describe('Care Journey Medication Errors', () => {
  const ERROR_CODE_PREFIX = 'CARE_MED_';

  describe('MedicationNotFoundError', () => {
    const medicationId = 'med-123';
    const details = { userId: 'user-456' };
    let error: MedicationNotFoundError;

    beforeEach(() => {
      error = new MedicationNotFoundError(medicationId, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Medication with ID ${medicationId} not found`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}001`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: `${ERROR_CODE_PREFIX}001`,
          message: `Medication with ID ${medicationId} not found`,
          details
        }
      });
    });
  });

  describe('MedicationInteractionError', () => {
    const medicationName = 'Aspirin';
    const interactingWith = 'Warfarin';
    const details = { severity: 'high', recommendation: 'avoid combination' };
    let error: MedicationInteractionError;

    beforeEach(() => {
      error = new MedicationInteractionError(medicationName, interactingWith, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Potential interaction detected between ${medicationName} and ${interactingWith}`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}002`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: `${ERROR_CODE_PREFIX}002`,
          message: `Potential interaction detected between ${medicationName} and ${interactingWith}`,
          details
        }
      });
    });
  });

  describe('MedicationDosageError', () => {
    const medicationName = 'Metformin';
    const message = 'Exceeds maximum daily dose';
    const details = { prescribed: '3000mg', maximum: '2500mg' };
    let error: MedicationDosageError;

    beforeEach(() => {
      error = new MedicationDosageError(medicationName, message, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Invalid dosage for ${medicationName}: ${message}`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}003`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: `${ERROR_CODE_PREFIX}003`,
          message: `Invalid dosage for ${medicationName}: ${message}`,
          details
        }
      });
    });
  });

  describe('MedicationAdherenceError', () => {
    const medicationName = 'Lisinopril';
    const message = 'Missed 3 consecutive doses';
    const details = { missedDoses: 3, lastTaken: '2023-05-15T10:30:00Z' };
    let error: MedicationAdherenceError;

    beforeEach(() => {
      error = new MedicationAdherenceError(medicationName, message, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Medication adherence issue for ${medicationName}: ${message}`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}004`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: `${ERROR_CODE_PREFIX}004`,
          message: `Medication adherence issue for ${medicationName}: ${message}`,
          details
        }
      });
    });
  });

  describe('MedicationPersistenceError', () => {
    const operation = 'save';
    const cause = new Error('Database connection failed');
    const details = { medicationId: 'med-789', attempt: 2 };
    let error: MedicationPersistenceError;

    beforeEach(() => {
      error = new MedicationPersistenceError(operation, cause, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Failed to ${operation} medication data`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}005`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the cause error', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: `${ERROR_CODE_PREFIX}005`,
          message: `Failed to ${operation} medication data`,
          details
        }
      });
    });
  });

  describe('MedicationExternalLookupError', () => {
    const medicationName = 'Atorvastatin';
    const service = 'DrugBank API';
    const cause = new Error('API request timeout');
    const details = { requestId: 'req-123', timeout: 30000 };
    let error: MedicationExternalLookupError;

    beforeEach(() => {
      error = new MedicationExternalLookupError(medicationName, service, cause, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Failed to retrieve information for ${medicationName} from ${service}`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}006`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the cause error', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: `${ERROR_CODE_PREFIX}006`,
          message: `Failed to retrieve information for ${medicationName} from ${service}`,
          details
        }
      });
    });
  });

  describe('PharmacyIntegrationError', () => {
    const pharmacyName = 'MedExpress Pharmacy';
    const operation = 'transmit prescription';
    const cause = new Error('Connection refused');
    const details = { prescriptionId: 'rx-456', retryCount: 3 };
    let error: PharmacyIntegrationError;

    beforeEach(() => {
      error = new PharmacyIntegrationError(pharmacyName, operation, cause, details);
    });

    it('should have the correct error message', () => {
      expect(error.message).toBe(`Failed to ${operation} with pharmacy ${pharmacyName}`);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have the correct error code with prefix', () => {
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}007`);
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the cause error', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should have the correct JSON representation', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: `${ERROR_CODE_PREFIX}007`,
          message: `Failed to ${operation} with pharmacy ${pharmacyName}`,
          details
        }
      });
    });
  });
});