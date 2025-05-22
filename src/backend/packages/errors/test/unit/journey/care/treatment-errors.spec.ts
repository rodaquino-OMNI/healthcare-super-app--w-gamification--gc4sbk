import { HttpStatus } from '@nestjs/common';
import {
  TreatmentPlanNotFoundError,
  TreatmentStepInvalidError,
  TreatmentPlanConflictError,
  TreatmentProgressError,
  TreatmentPersistenceError,
  ClinicalGuidelinesError
} from '../../../../src/journey/care/treatment-errors';
import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

describe('Care Journey Treatment Errors', () => {
  const ERROR_CODE_PREFIX = 'CARE_TREATMENT';

  describe('TreatmentPlanNotFoundError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Treatment plan not found';
      const details = { planId: '12345' };
      const error = new TreatmentPlanNotFoundError(message, details);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TreatmentPlanNotFoundError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toContain(ERROR_CODE_PREFIX);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_001`);
      expect(error.details).toEqual(details);
    });

    it('should capture treatment plan context data', () => {
      const details = { 
        planId: '12345',
        userId: 'user-123',
        treatmentType: 'physical-therapy'
      };
      const error = new TreatmentPlanNotFoundError('Treatment plan not found', details);

      expect(error.details).toEqual(details);
      expect(error.details.planId).toBe('12345');
      expect(error.details.userId).toBe('user-123');
      expect(error.details.treatmentType).toBe('physical-therapy');
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentPlanNotFoundError('Treatment plan not found');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include original cause if provided', () => {
      const cause = new Error('Original database error');
      const error = new TreatmentPlanNotFoundError('Treatment plan not found', {}, cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('TreatmentStepInvalidError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Invalid treatment step data';
      const details = { 
        stepId: '12345',
        validationErrors: ['duration is required', 'frequency must be a positive number']
      };
      const error = new TreatmentStepInvalidError(message, details);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TreatmentStepInvalidError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toContain(ERROR_CODE_PREFIX);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_002`);
      expect(error.details).toEqual(details);
    });

    it('should capture validation context data', () => {
      const details = { 
        stepId: '12345',
        planId: 'plan-123',
        validationErrors: ['duration is required', 'frequency must be a positive number']
      };
      const error = new TreatmentStepInvalidError('Invalid treatment step data', details);

      expect(error.details).toEqual(details);
      expect(error.details.stepId).toBe('12345');
      expect(error.details.planId).toBe('plan-123');
      expect(error.details.validationErrors).toHaveLength(2);
      expect(error.details.validationErrors).toContain('duration is required');
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentStepInvalidError('Invalid treatment step data');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('TreatmentPlanConflictError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Treatment plan conflicts with existing treatments';
      const details = {
        planId: '12345',
        conflictingPlanIds: ['67890', '54321'],
        conflictReason: 'Incompatible therapy types'
      };
      const error = new TreatmentPlanConflictError(message, details);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TreatmentPlanConflictError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toContain(ERROR_CODE_PREFIX);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_003`);
      expect(error.details).toEqual(details);
    });

    it('should capture conflict context data', () => {
      const details = {
        planId: '12345',
        conflictingPlanIds: ['67890', '54321'],
        conflictReason: 'Incompatible therapy types'
      };
      const error = new TreatmentPlanConflictError('Treatment plan conflicts', details);

      expect(error.details).toEqual(details);
      expect(error.details.planId).toBe('12345');
      expect(error.details.conflictingPlanIds).toHaveLength(2);
      expect(error.details.conflictReason).toBe('Incompatible therapy types');
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentPlanConflictError('Treatment plan conflicts');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentProgressError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Cannot update treatment progress';
      const details = {
        planId: '12345',
        stepId: '67890',
        reason: 'Step prerequisites not completed'
      };
      const error = new TreatmentProgressError(message, details);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TreatmentProgressError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toContain(ERROR_CODE_PREFIX);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_004`);
      expect(error.details).toEqual(details);
    });

    it('should capture progress context data', () => {
      const details = {
        planId: '12345',
        stepId: '67890',
        currentProgress: 30,
        requiredProgress: 50,
        reason: 'Step prerequisites not completed'
      };
      const error = new TreatmentProgressError('Cannot update treatment progress', details);

      expect(error.details).toEqual(details);
      expect(error.details.planId).toBe('12345');
      expect(error.details.stepId).toBe('67890');
      expect(error.details.currentProgress).toBe(30);
      expect(error.details.requiredProgress).toBe(50);
      expect(error.details.reason).toBe('Step prerequisites not completed');
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentProgressError('Cannot update treatment progress');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPersistenceError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Failed to save treatment plan';
      const details = {
        planId: '12345',
        operation: 'create'
      };
      const cause = new Error('Database connection error');
      const error = new TreatmentPersistenceError(message, details, cause);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TreatmentPersistenceError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toContain(ERROR_CODE_PREFIX);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_005`);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should capture persistence operation context', () => {
      const details = {
        planId: '12345',
        operation: 'update',
        entityType: 'TreatmentPlan',
        databaseTable: 'treatment_plans'
      };
      const error = new TreatmentPersistenceError('Failed to save treatment plan', details);

      expect(error.details).toEqual(details);
      expect(error.details.planId).toBe('12345');
      expect(error.details.operation).toBe('update');
      expect(error.details.entityType).toBe('TreatmentPlan');
      expect(error.details.databaseTable).toBe('treatment_plans');
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentPersistenceError('Failed to save treatment plan');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('ClinicalGuidelinesError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Failed to retrieve clinical guidelines';
      const details = {
        conditionCode: 'J45.909', // Asthma, unspecified
        guidelineSystem: 'NICE',
        requestId: '12345'
      };
      const cause = new Error('External API timeout');
      const error = new ClinicalGuidelinesError(message, details, cause);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ClinicalGuidelinesError);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toContain(ERROR_CODE_PREFIX);
      expect(error.code).toBe(`${ERROR_CODE_PREFIX}_006`);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should capture external system context data', () => {
      const details = {
        conditionCode: 'J45.909', // Asthma, unspecified
        guidelineSystem: 'NICE',
        requestId: '12345',
        endpoint: '/api/guidelines/condition',
        statusCode: 503
      };
      const error = new ClinicalGuidelinesError('Failed to retrieve clinical guidelines', details);

      expect(error.details).toEqual(details);
      expect(error.details.conditionCode).toBe('J45.909');
      expect(error.details.guidelineSystem).toBe('NICE');
      expect(error.details.requestId).toBe('12345');
      expect(error.details.endpoint).toBe('/api/guidelines/condition');
      expect(error.details.statusCode).toBe(503);
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ClinicalGuidelinesError('Failed to retrieve clinical guidelines');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON with correct structure', () => {
      const message = 'Treatment plan not found';
      const details = { planId: '12345' };
      const error = new TreatmentPlanNotFoundError(message, details);
      const jsonResult = error.toJSON();

      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(jsonResult.error).toHaveProperty('code', `${ERROR_CODE_PREFIX}_001`);
      expect(jsonResult.error).toHaveProperty('message', message);
      expect(jsonResult.error).toHaveProperty('details', details);
    });

    it('should include treatment-specific context in serialized output', () => {
      const details = {
        planId: '12345',
        stepId: '67890',
        treatmentType: 'physical-therapy',
        provider: 'provider-123'
      };
      const error = new TreatmentProgressError('Cannot update treatment progress', details);
      const jsonResult = error.toJSON();

      expect(jsonResult.error.details).toEqual(details);
      expect(jsonResult.error.details.planId).toBe('12345');
      expect(jsonResult.error.details.stepId).toBe('67890');
      expect(jsonResult.error.details.treatmentType).toBe('physical-therapy');
      expect(jsonResult.error.details.provider).toBe('provider-123');
    });
  });
});