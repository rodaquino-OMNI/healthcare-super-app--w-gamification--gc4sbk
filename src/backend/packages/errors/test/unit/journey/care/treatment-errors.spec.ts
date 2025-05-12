import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/types';
import {
  TreatmentPlanNotFoundError,
  TreatmentStepInvalidError,
  TreatmentPlanConflictError,
  TreatmentProgressError,
  TreatmentPersistenceError,
  ClinicalGuidelinesError
} from '../../../../src/journey/care/treatment-errors';

describe('Care Journey Treatment Errors', () => {
  describe('TreatmentPlanNotFoundError', () => {
    it('should create an error with BUSINESS type', () => {
      const planId = 'plan-123';
      const error = new TreatmentPlanNotFoundError(planId);

      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toMatch(/^CARE_TREATMENT_/);
      expect(error.message).toContain(planId);
      expect(error.details).toEqual({ planId });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentPlanNotFoundError('plan-123');
      const httpException = error.toHttpException();

      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON with error details', () => {
      const planId = 'plan-123';
      const error = new TreatmentPlanNotFoundError(planId);
      const json = error.toJSON();

      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code');
      expect(json.error.code).toMatch(/^CARE_TREATMENT_/);
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('planId', planId);
    });
  });

  describe('TreatmentStepInvalidError', () => {
    it('should create an error with VALIDATION type', () => {
      const planId = 'plan-123';
      const stepId = 'step-456';
      const reason = 'Invalid step configuration';
      const error = new TreatmentStepInvalidError(planId, stepId, reason);

      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toMatch(/^CARE_TREATMENT_/);
      expect(error.message).toContain(reason);
      expect(error.details).toEqual({ planId, stepId, reason });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentStepInvalidError('plan-123', 'step-456', 'Invalid step');
      const httpException = error.toHttpException();

      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('TreatmentPlanConflictError', () => {
    it('should create an error with BUSINESS type', () => {
      const planId = 'plan-123';
      const conflictingPlanId = 'plan-456';
      const error = new TreatmentPlanConflictError(planId, conflictingPlanId);

      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toMatch(/^CARE_TREATMENT_/);
      expect(error.message).toContain('conflict');
      expect(error.details).toEqual({ planId, conflictingPlanId });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentPlanConflictError('plan-123', 'plan-456');
      const httpException = error.toHttpException();

      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentProgressError', () => {
    it('should create an error with BUSINESS type', () => {
      const planId = 'plan-123';
      const stepId = 'step-456';
      const currentProgress = 50;
      const error = new TreatmentProgressError(planId, stepId, currentProgress);

      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toMatch(/^CARE_TREATMENT_/);
      expect(error.message).toContain('progress');
      expect(error.details).toEqual({ planId, stepId, currentProgress });
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentProgressError('plan-123', 'step-456', 50);
      const httpException = error.toHttpException();

      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TreatmentPersistenceError', () => {
    it('should create an error with TECHNICAL type', () => {
      const planId = 'plan-123';
      const operation = 'update';
      const cause = new Error('Database connection failed');
      const error = new TreatmentPersistenceError(planId, operation, cause);

      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toMatch(/^CARE_TREATMENT_/);
      expect(error.message).toContain(operation);
      expect(error.details).toEqual({ planId, operation });
      expect(error.cause).toBe(cause);
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new TreatmentPersistenceError('plan-123', 'update', new Error());
      const httpException = error.toHttpException();

      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('ClinicalGuidelinesError', () => {
    it('should create an error with EXTERNAL type', () => {
      const planId = 'plan-123';
      const guidelineId = 'guideline-789';
      const cause = new Error('External service unavailable');
      const error = new ClinicalGuidelinesError(planId, guidelineId, cause);

      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toMatch(/^CARE_TREATMENT_/);
      expect(error.message).toContain('clinical guidelines');
      expect(error.details).toEqual({ planId, guidelineId });
      expect(error.cause).toBe(cause);
    });

    it('should convert to HTTP exception with correct status code', () => {
      const error = new ClinicalGuidelinesError('plan-123', 'guideline-789', new Error());
      const httpException = error.toHttpException();

      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include recovery suggestions in error details', () => {
      const error = new ClinicalGuidelinesError('plan-123', 'guideline-789', new Error());
      const json = error.toJSON();

      expect(json.error.details).toHaveProperty('recoverySuggestions');
      expect(Array.isArray(json.error.details.recoverySuggestions)).toBe(true);
      expect(json.error.details.recoverySuggestions.length).toBeGreaterThan(0);
    });
  });
});