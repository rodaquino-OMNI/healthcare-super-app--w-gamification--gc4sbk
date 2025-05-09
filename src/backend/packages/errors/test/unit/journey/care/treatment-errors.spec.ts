import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/base';
import {
  TreatmentPlanNotFoundError,
  TreatmentStepInvalidError,
  TreatmentPlanConflictError,
  TreatmentProgressError,
  TreatmentPersistenceError,
  ClinicalGuidelinesError,
  TreatmentStepCompletionError,
  TreatmentPlanUpdateError,
  TreatmentPlanCreationError,
  TreatmentPlanValidationError,
  TreatmentAdherenceError,
  TreatmentPlanAlreadyCompletedError
} from '../../../../src/journey/care/treatment-errors';

describe('Care Journey Treatment Errors', () => {
  const ERROR_CODE_PREFIX = 'CARE_TREATMENT';

  describe('TreatmentPlanNotFoundError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const userId = 'user-456';
      const details = { referringProvider: 'provider-789' };
      
      const error = new TreatmentPlanNotFoundError(planId, userId, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Treatment plan with ID ${planId} not found for user ${userId}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_001`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPlanNotFoundError('plan-123', 'user-456');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON with correct structure', () => {
      const planId = 'plan-123';
      const userId = 'user-456';
      const error = new TreatmentPlanNotFoundError(planId, userId);
      
      const json = error.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', `${ERROR_CODE_PREFIX}_001`);
      expect(json.error).toHaveProperty('message', `Treatment plan with ID ${planId} not found for user ${userId}`);
    });
  });

  describe('TreatmentStepInvalidError', () => {
    it('should create error with correct properties', () => {
      const stepId = 'step-123';
      const planId = 'plan-456';
      const reason = 'Step duration exceeds plan timeline';
      const details = { maxDuration: 30, stepDuration: 45 };
      
      const error = new TreatmentStepInvalidError(stepId, planId, reason, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Invalid treatment step ${stepId} in plan ${planId}: ${reason}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_002`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentStepInvalidError('step-123', 'plan-456', 'Invalid step');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('TreatmentPlanConflictError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const conflictingPlanId = 'plan-789';
      const conflictReason = 'Incompatible medication regimens';
      const details = { medications: ['med-1', 'med-2'] };
      
      const error = new TreatmentPlanConflictError(planId, conflictingPlanId, conflictReason, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Treatment plan ${planId} conflicts with plan ${conflictingPlanId}: ${conflictReason}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_003`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPlanConflictError('plan-123', 'plan-789', 'Conflict');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentProgressError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const userId = 'user-456';
      const reason = 'Missing completion data for previous steps';
      const details = { incompleteSteps: ['step-1', 'step-3'] };
      
      const error = new TreatmentProgressError(planId, userId, reason, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to track progress for treatment plan ${planId} for user ${userId}: ${reason}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_004`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentProgressError('plan-123', 'user-456', 'Progress error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPersistenceError', () => {
    it('should create error with correct properties', () => {
      const operation = 'update';
      const entityType = 'treatment plan';
      const entityId = 'plan-123';
      const cause = new Error('Database connection failed');
      const details = { retryCount: 3 };
      
      const error = new TreatmentPersistenceError(operation, entityType, entityId, cause, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to ${operation} ${entityType} with ID ${entityId}: ${cause.message}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_005`);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should handle null entityId', () => {
      const operation = 'create';
      const entityType = 'treatment plan';
      const cause = new Error('Database connection failed');
      
      const error = new TreatmentPersistenceError(operation, entityType, null, cause);
      
      expect(error.message).toBe(`Failed to ${operation} ${entityType}: ${cause.message}`);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPersistenceError(
        'update', 'treatment plan', 'plan-123', new Error('Database error')
      );
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('ClinicalGuidelinesError', () => {
    it('should create error with correct properties', () => {
      const operation = 'validate';
      const guidelineSystem = 'NICE Guidelines';
      const errorCode = 'API-404';
      const cause = new Error('Resource not found');
      const details = { treatmentType: 'physical-therapy' };
      
      const error = new ClinicalGuidelinesError(operation, guidelineSystem, errorCode, cause, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Clinical guidelines ${operation} operation failed with ${guidelineSystem} (code: ${errorCode})`);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_006`);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should handle null errorCode', () => {
      const operation = 'lookup';
      const guidelineSystem = 'NICE Guidelines';
      
      const error = new ClinicalGuidelinesError(operation, guidelineSystem, null);
      
      expect(error.message).toBe(`Clinical guidelines ${operation} operation failed with ${guidelineSystem}`);
    });

    it('should return correct HTTP status code', () => {
      const error = new ClinicalGuidelinesError('validate', 'NICE Guidelines', 'API-404');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('TreatmentStepCompletionError', () => {
    it('should create error with correct properties', () => {
      const stepId = 'step-123';
      const planId = 'plan-456';
      const reason = 'Prerequisites not met';
      const details = { requiredSteps: ['step-1', 'step-2'] };
      
      const error = new TreatmentStepCompletionError(stepId, planId, reason, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Cannot complete treatment step ${stepId} in plan ${planId}: ${reason}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_007`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentStepCompletionError('step-123', 'plan-456', 'Completion error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPlanUpdateError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const reason = 'Plan is locked for editing';
      const details = { lockedBy: 'provider-789', lockedAt: new Date() };
      
      const error = new TreatmentPlanUpdateError(planId, reason, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Cannot update treatment plan ${planId}: ${reason}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_008`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPlanUpdateError('plan-123', 'Update error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPlanCreationError', () => {
    it('should create error with correct properties', () => {
      const userId = 'user-123';
      const reason = 'User already has active treatment plan';
      const details = { activePlanId: 'plan-456' };
      
      const error = new TreatmentPlanCreationError(userId, reason, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Cannot create treatment plan for user ${userId}: ${reason}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_009`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPlanCreationError('user-123', 'Creation error');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPlanValidationError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const validationErrors = ['Missing required field: duration', 'Invalid treatment type'];
      const details = { fields: { duration: null, treatmentType: 'invalid-type' } };
      
      const error = new TreatmentPlanValidationError(planId, validationErrors, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Treatment plan ${planId} validation failed: ${validationErrors.join(', ')}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_010`);
      expect(error.details).toEqual(details);
    });

    it('should handle null planId', () => {
      const validationErrors = ['Missing required field: duration'];
      
      const error = new TreatmentPlanValidationError(null, validationErrors);
      
      expect(error.message).toBe(`Treatment plan validation failed: ${validationErrors.join(', ')}`);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPlanValidationError('plan-123', ['Validation error']);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('TreatmentAdherenceError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const userId = 'user-456';
      const adherenceRate = 65;
      const threshold = 80;
      const details = { missedSteps: ['step-2', 'step-4'] };
      
      const error = new TreatmentAdherenceError(planId, userId, adherenceRate, threshold, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Treatment adherence below threshold for plan ${planId} (user ${userId}): ${adherenceRate}% < ${threshold}%`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_011`);
      expect(error.details).toEqual(details);
    });

    it('should handle null adherenceRate', () => {
      const planId = 'plan-123';
      const userId = 'user-456';
      const threshold = 80;
      
      const error = new TreatmentAdherenceError(planId, userId, null, threshold);
      
      expect(error.message).toBe(`Treatment adherence below threshold for plan ${planId} (user ${userId}): unknown < ${threshold}%`);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentAdherenceError('plan-123', 'user-456', 65, 80);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPlanAlreadyCompletedError', () => {
    it('should create error with correct properties', () => {
      const planId = 'plan-123';
      const completionDate = new Date('2023-05-15T10:30:00Z');
      const details = { completedBy: 'provider-789' };
      
      const error = new TreatmentPlanAlreadyCompletedError(planId, completionDate, details);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Treatment plan ${planId} is already completed (completed on ${completionDate.toISOString()})`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_012`);
      expect(error.details).toEqual(details);
    });

    it('should return correct HTTP status code', () => {
      const error = new TreatmentPlanAlreadyCompletedError('plan-123', new Date());
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Error code prefixing', () => {
    it('should use CARE_TREATMENT_ prefix for all error codes', () => {
      const errors = [
        new TreatmentPlanNotFoundError('plan-123', 'user-456'),
        new TreatmentStepInvalidError('step-123', 'plan-456', 'Invalid step'),
        new TreatmentPlanConflictError('plan-123', 'plan-789', 'Conflict'),
        new TreatmentProgressError('plan-123', 'user-456', 'Progress error'),
        new TreatmentPersistenceError('update', 'plan', 'plan-123', new Error()),
        new ClinicalGuidelinesError('validate', 'NICE', 'API-404'),
        new TreatmentStepCompletionError('step-123', 'plan-456', 'Completion error'),
        new TreatmentPlanUpdateError('plan-123', 'Update error'),
        new TreatmentPlanCreationError('user-123', 'Creation error'),
        new TreatmentPlanValidationError('plan-123', ['Validation error']),
        new TreatmentAdherenceError('plan-123', 'user-456', 65, 80),
        new TreatmentPlanAlreadyCompletedError('plan-123', new Date())
      ];

      errors.forEach(error => {
        expect(error.code).toMatch(new RegExp(`^${ERROR_CODE_PREFIX}_\d+$`));
      });
    });
  });

  describe('Error classification', () => {
    it('should classify validation errors correctly', () => {
      const validationErrors = [
        new TreatmentStepInvalidError('step-123', 'plan-456', 'Invalid step'),
        new TreatmentPlanValidationError('plan-123', ['Validation error'])
      ];

      validationErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    it('should classify business errors correctly', () => {
      const businessErrors = [
        new TreatmentPlanNotFoundError('plan-123', 'user-456'),
        new TreatmentPlanConflictError('plan-123', 'plan-789', 'Conflict'),
        new TreatmentProgressError('plan-123', 'user-456', 'Progress error'),
        new TreatmentStepCompletionError('step-123', 'plan-456', 'Completion error'),
        new TreatmentPlanUpdateError('plan-123', 'Update error'),
        new TreatmentPlanCreationError('user-123', 'Creation error'),
        new TreatmentAdherenceError('plan-123', 'user-456', 65, 80),
        new TreatmentPlanAlreadyCompletedError('plan-123', new Date())
      ];

      businessErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });

    it('should classify technical errors correctly', () => {
      const technicalErrors = [
        new TreatmentPersistenceError('update', 'plan', 'plan-123', new Error())
      ];

      technicalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });

    it('should classify external errors correctly', () => {
      const externalErrors = [
        new ClinicalGuidelinesError('validate', 'NICE', 'API-404')
      ];

      externalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });
  });
});