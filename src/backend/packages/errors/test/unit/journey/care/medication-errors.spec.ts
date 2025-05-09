import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/base';
import {
  MedicationNotFoundError,
  MedicationInteractionError,
  MedicationDosageError,
  MedicationAdherenceError,
  MedicationPersistenceError,
  MedicationExternalLookupError,
  PharmacyIntegrationError
} from '../../../../src/journey/care/medication-errors';

describe('Care Journey Medication Errors', () => {
  const ERROR_CODE_PREFIX = 'CARE_MED';

  describe('MedicationNotFoundError', () => {
    it('should create error with correct properties', () => {
      const medicationId = 'med-123';
      
      const error = new MedicationNotFoundError(medicationId);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Medication with ID ${medicationId} not found`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_001`);
      expect(error.medicationId).toBe(medicationId);
    });

    it('should accept custom message', () => {
      const medicationId = 'med-123';
      const customMessage = 'Custom medication not found message';
      
      const error = new MedicationNotFoundError(medicationId, customMessage);
      
      expect(error.message).toBe(customMessage);
    });

    it('should accept cause', () => {
      const medicationId = 'med-123';
      const cause = new Error('Original error');
      
      const error = new MedicationNotFoundError(medicationId, undefined, cause);
      
      expect(error.cause).toBe(cause);
    });

    it('should return correct HTTP status code', () => {
      const error = new MedicationNotFoundError('med-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON with correct structure', () => {
      const medicationId = 'med-123';
      const error = new MedicationNotFoundError(medicationId);
      
      const json = error.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', `${ERROR_CODE_PREFIX}_001`);
      expect(json.error).toHaveProperty('message', `Medication with ID ${medicationId} not found`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('medicationId', medicationId);
    });
  });

  describe('MedicationInteractionError', () => {
    it('should create error with correct properties', () => {
      const medications = ['med-123', 'med-456'];
      const interactionType = 'contraindication';
      const interactionDescription = 'Severe interaction between medications';
      
      const error = new MedicationInteractionError(medications, interactionType, interactionDescription);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Medication interaction detected: ${interactionDescription}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_002`);
      expect(error.medications).toEqual(medications);
      expect(error.interactionType).toBe(interactionType);
      expect(error.interactionDescription).toBe(interactionDescription);
    });

    it('should accept custom message', () => {
      const medications = ['med-123', 'med-456'];
      const interactionType = 'contraindication';
      const interactionDescription = 'Severe interaction';
      const customMessage = 'Custom interaction message';
      
      const error = new MedicationInteractionError(
        medications, 
        interactionType, 
        interactionDescription, 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should return correct HTTP status code', () => {
      const error = new MedicationInteractionError(
        ['med-123', 'med-456'], 
        'contraindication', 
        'Severe interaction'
      );
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('MedicationDosageError', () => {
    it('should create error with correct properties', () => {
      const medicationId = 'med-123';
      const providedDosage = '100mg';
      const validationDetails = { 
        minDosage: '50mg', 
        maxDosage: '75mg', 
        recommendedDosage: '60mg' 
      };
      
      const error = new MedicationDosageError(medicationId, providedDosage, validationDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Invalid medication dosage: ${providedDosage}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_003`);
      expect(error.medicationId).toBe(medicationId);
      expect(error.providedDosage).toBe(providedDosage);
      expect(error.validationDetails).toEqual(validationDetails);
    });

    it('should accept custom message', () => {
      const medicationId = 'med-123';
      const providedDosage = '100mg';
      const validationDetails = { minDosage: '50mg', maxDosage: '75mg' };
      const customMessage = 'Custom dosage error message';
      
      const error = new MedicationDosageError(
        medicationId, 
        providedDosage, 
        validationDetails, 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should return correct HTTP status code', () => {
      const error = new MedicationDosageError(
        'med-123', 
        '100mg', 
        { minDosage: '50mg', maxDosage: '75mg' }
      );
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('MedicationAdherenceError', () => {
    it('should create error with correct properties', () => {
      const userId = 'user-123';
      const medicationId = 'med-456';
      const adherenceIssue = 'Missed 3 consecutive doses';
      
      const error = new MedicationAdherenceError(userId, medicationId, adherenceIssue);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Medication adherence issue: ${adherenceIssue}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_004`);
      expect(error.userId).toBe(userId);
      expect(error.medicationId).toBe(medicationId);
      expect(error.adherenceIssue).toBe(adherenceIssue);
    });

    it('should accept custom message', () => {
      const userId = 'user-123';
      const medicationId = 'med-456';
      const adherenceIssue = 'Missed doses';
      const customMessage = 'Custom adherence error message';
      
      const error = new MedicationAdherenceError(
        userId, 
        medicationId, 
        adherenceIssue, 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should return correct HTTP status code', () => {
      const error = new MedicationAdherenceError(
        'user-123', 
        'med-456', 
        'Missed doses'
      );
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('MedicationPersistenceError', () => {
    it('should create error with correct properties', () => {
      const operation = 'update';
      const medicationId = 'med-123';
      const details = { retryCount: 3, lastError: 'Connection timeout' };
      
      const error = new MedicationPersistenceError(operation, medicationId, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to ${operation} medication data`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_005`);
      expect(error.operation).toBe(operation);
      expect(error.medicationId).toBe(medicationId);
      expect(error.details).toEqual(details);
    });

    it('should handle undefined medicationId', () => {
      const operation = 'create';
      
      const error = new MedicationPersistenceError(operation);
      
      expect(error.message).toBe(`Failed to ${operation} medication data`);
      expect(error.medicationId).toBeUndefined();
    });

    it('should accept custom message', () => {
      const operation = 'update';
      const medicationId = 'med-123';
      const details = { retryCount: 3 };
      const customMessage = 'Custom persistence error message';
      
      const error = new MedicationPersistenceError(
        operation, 
        medicationId, 
        details, 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should accept cause', () => {
      const operation = 'update';
      const medicationId = 'med-123';
      const details = { retryCount: 3 };
      const customMessage = 'Custom message';
      const cause = new Error('Database error');
      
      const error = new MedicationPersistenceError(
        operation, 
        medicationId, 
        details, 
        customMessage, 
        cause
      );
      
      expect(error.cause).toBe(cause);
    });

    it('should return correct HTTP status code', () => {
      const error = new MedicationPersistenceError('update', 'med-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('MedicationExternalLookupError', () => {
    it('should create error with correct properties', () => {
      const externalSystem = 'drugDatabase';
      const lookupParameters = { drugName: 'Aspirin', dosage: '100mg' };
      
      const error = new MedicationExternalLookupError(externalSystem, lookupParameters);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to lookup medication information from ${externalSystem}`);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_006`);
      expect(error.externalSystem).toBe(externalSystem);
      expect(error.lookupParameters).toEqual(lookupParameters);
    });

    it('should accept custom message', () => {
      const externalSystem = 'drugDatabase';
      const lookupParameters = { drugName: 'Aspirin' };
      const customMessage = 'Custom lookup error message';
      
      const error = new MedicationExternalLookupError(
        externalSystem, 
        lookupParameters, 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should accept cause', () => {
      const externalSystem = 'drugDatabase';
      const lookupParameters = { drugName: 'Aspirin' };
      const customMessage = 'Custom message';
      const cause = new Error('API error');
      
      const error = new MedicationExternalLookupError(
        externalSystem, 
        lookupParameters, 
        customMessage, 
        cause
      );
      
      expect(error.cause).toBe(cause);
    });

    it('should return correct HTTP status code', () => {
      const error = new MedicationExternalLookupError(
        'drugDatabase', 
        { drugName: 'Aspirin' }
      );
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('PharmacyIntegrationError', () => {
    it('should create error with correct properties', () => {
      const pharmacyId = 'pharm-123';
      const prescriptionId = 'presc-456';
      const operationType = 'submit';
      const details = { attemptCount: 2, lastError: 'Connection refused' };
      
      const error = new PharmacyIntegrationError(pharmacyId, prescriptionId, operationType, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Pharmacy integration error for operation: ${operationType}`);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_007`);
      expect(error.pharmacyId).toBe(pharmacyId);
      expect(error.prescriptionId).toBe(prescriptionId);
      expect(error.operationType).toBe(operationType);
      expect(error.details).toEqual(details);
    });

    it('should handle undefined details', () => {
      const pharmacyId = 'pharm-123';
      const prescriptionId = 'presc-456';
      const operationType = 'submit';
      
      const error = new PharmacyIntegrationError(pharmacyId, prescriptionId, operationType);
      
      expect(error.details).toBeUndefined();
    });

    it('should accept custom message', () => {
      const pharmacyId = 'pharm-123';
      const prescriptionId = 'presc-456';
      const operationType = 'submit';
      const details = { attemptCount: 2 };
      const customMessage = 'Custom pharmacy integration error message';
      
      const error = new PharmacyIntegrationError(
        pharmacyId, 
        prescriptionId, 
        operationType, 
        details, 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should accept cause', () => {
      const pharmacyId = 'pharm-123';
      const prescriptionId = 'presc-456';
      const operationType = 'submit';
      const details = { attemptCount: 2 };
      const customMessage = 'Custom message';
      const cause = new Error('API error');
      
      const error = new PharmacyIntegrationError(
        pharmacyId, 
        prescriptionId, 
        operationType, 
        details, 
        customMessage, 
        cause
      );
      
      expect(error.cause).toBe(cause);
    });

    it('should return correct HTTP status code', () => {
      const error = new PharmacyIntegrationError(
        'pharm-123', 
        'presc-456', 
        'submit'
      );
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error code prefixing', () => {
    it('should use CARE_MED_ prefix for all error codes', () => {
      const errors = [
        new MedicationNotFoundError('med-123'),
        new MedicationInteractionError(['med-123', 'med-456'], 'contraindication', 'Severe interaction'),
        new MedicationDosageError('med-123', '100mg', { minDosage: '50mg', maxDosage: '75mg' }),
        new MedicationAdherenceError('user-123', 'med-456', 'Missed doses'),
        new MedicationPersistenceError('update', 'med-123'),
        new MedicationExternalLookupError('drugDatabase', { drugName: 'Aspirin' }),
        new PharmacyIntegrationError('pharm-123', 'presc-456', 'submit')
      ];

      errors.forEach(error => {
        expect(error.code).toMatch(new RegExp(`^${ERROR_CODE_PREFIX}_\d+$`));
      });
    });
  });

  describe('Error classification', () => {
    it('should classify validation errors correctly', () => {
      const validationErrors = [
        new MedicationDosageError('med-123', '100mg', { minDosage: '50mg', maxDosage: '75mg' })
      ];

      validationErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    it('should classify business errors correctly', () => {
      const businessErrors = [
        new MedicationNotFoundError('med-123'),
        new MedicationInteractionError(['med-123', 'med-456'], 'contraindication', 'Severe interaction'),
        new MedicationAdherenceError('user-123', 'med-456', 'Missed doses')
      ];

      businessErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });

    it('should classify technical errors correctly', () => {
      const technicalErrors = [
        new MedicationPersistenceError('update', 'med-123')
      ];

      technicalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });

    it('should classify external errors correctly', () => {
      const externalErrors = [
        new MedicationExternalLookupError('drugDatabase', { drugName: 'Aspirin' }),
        new PharmacyIntegrationError('pharm-123', 'presc-456', 'submit')
      ];

      externalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });
  });

  describe('Error context data', () => {
    it('should include medication-specific context in error details', () => {
      const medicationId = 'med-123';
      const error = new MedicationNotFoundError(medicationId);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('medicationId', medicationId);
    });

    it('should include interaction context in error details', () => {
      const medications = ['med-123', 'med-456'];
      const interactionType = 'contraindication';
      const interactionDescription = 'Severe interaction';
      
      const error = new MedicationInteractionError(medications, interactionType, interactionDescription);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('medications', medications);
      expect(json.error.details).toHaveProperty('interactionType', interactionType);
      expect(json.error.details).toHaveProperty('interactionDescription', interactionDescription);
    });

    it('should include dosage validation context in error details', () => {
      const medicationId = 'med-123';
      const providedDosage = '100mg';
      const validationDetails = { minDosage: '50mg', maxDosage: '75mg' };
      
      const error = new MedicationDosageError(medicationId, providedDosage, validationDetails);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('medicationId', medicationId);
      expect(json.error.details).toHaveProperty('providedDosage', providedDosage);
      expect(json.error.details).toHaveProperty('validationDetails', validationDetails);
    });

    it('should include pharmacy integration context in error details', () => {
      const pharmacyId = 'pharm-123';
      const prescriptionId = 'presc-456';
      const operationType = 'submit';
      const details = { attemptCount: 2 };
      
      const error = new PharmacyIntegrationError(pharmacyId, prescriptionId, operationType, details);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('pharmacyId', pharmacyId);
      expect(json.error.details).toHaveProperty('prescriptionId', prescriptionId);
      expect(json.error.details).toHaveProperty('operationType', operationType);
      expect(json.error.details).toHaveProperty('details', details);
    });
  });
});