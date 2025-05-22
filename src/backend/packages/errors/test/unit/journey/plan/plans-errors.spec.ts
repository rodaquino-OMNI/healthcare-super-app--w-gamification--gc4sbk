import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyType } from '../../../../src/base';
import {
  PlanNotFoundError,
  PlanNotAvailableInRegionError,
  PlanSelectionValidationError,
  PlanComparisonError,
  PlanPersistenceError,
  PlanProviderApiError,
  PlanEnrollmentError,
  PlanSearchError
} from '../../../../src/journey/plan/plans-errors';
import { PlanErrorCodes } from '../../../../src/journey/plan/error-codes';
import { PlanErrorDomain } from '../../../../src/journey/plan/types';

describe('Plan Journey - Plans Domain Error Classes', () => {
  describe('PlanNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new PlanNotFoundError('Plan not found');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanNotFoundError('Plan not found');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use correct error code', () => {
      const error = new PlanNotFoundError('Plan not found');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_BUS_NOT_FOUND);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanNotFoundError('Plan not found');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanNotFoundError('Plan not found');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('getPlan');
    });

    it('should include payload in error details', () => {
      const payload = { planId: 'PLAN-123', userId: 'USER-456' };
      const error = new PlanNotFoundError('Plan not found', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
    });

    it('should support error cause chains', () => {
      const cause = new Error('Original error');
      const error = new PlanNotFoundError('Plan not found', undefined, cause);
      expect(error.cause).toBe(cause);
    });

    it('should serialize to JSON with correct structure', () => {
      const message = 'Plan not found';
      const payload = { planId: 'PLAN-123', userId: 'USER-456' };
      const error = new PlanNotFoundError(message, payload);
      const jsonResult = error.toJSON();

      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(jsonResult.error).toHaveProperty('code', PlanErrorCodes.PLAN_PLAN_BUS_NOT_FOUND);
      expect(jsonResult.error).toHaveProperty('message', message);
      expect(jsonResult.error).toHaveProperty('details', payload);
      expect(jsonResult.error).toHaveProperty('journey', JourneyType.PLAN);
    });
  });

  describe('PlanNotAvailableInRegionError', () => {
    it('should extend BaseError', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use correct error code', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_BUS_NOT_ELIGIBLE);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanNotAvailableInRegionError('Plan not available in region');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('checkPlanAvailability');
    });

    it('should include region-specific payload in error details', () => {
      const payload = { 
        planId: 'PLAN-123', 
        userId: 'USER-456', 
        region: 'Northeast', 
        userRegion: 'Southwest' 
      };
      const error = new PlanNotAvailableInRegionError('Plan not available in region', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
    });
  });

  describe('PlanSelectionValidationError', () => {
    it('should extend BaseError', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection');
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should use correct error code', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_VAL_INVALID_DETAILS);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanSelectionValidationError('Invalid plan selection');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('validatePlanSelection');
    });

    it('should include validation errors in payload', () => {
      const payload = { 
        planId: 'PLAN-123', 
        userId: 'USER-456', 
        validationErrors: ['Age requirement not met', 'Income threshold exceeded'] 
      };
      const error = new PlanSelectionValidationError('Invalid plan selection', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
      expect(error.details.validationErrors).toEqual(payload.validationErrors);
    });
  });

  describe('PlanComparisonError', () => {
    it('should extend BaseError', () => {
      const error = new PlanComparisonError('Plan comparison failed');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanComparisonError('Plan comparison failed');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should use correct error code', () => {
      const error = new PlanComparisonError('Plan comparison failed');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_TECH_RETRIEVAL_FAILURE);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanComparisonError('Plan comparison failed');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanComparisonError('Plan comparison failed');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('comparePlans');
    });

    it('should include comparison-specific payload in error details', () => {
      const payload = { 
        planIds: ['PLAN-123', 'PLAN-456'], 
        userId: 'USER-789', 
        comparisonCriteria: ['premium', 'deductible', 'coverage'] 
      };
      const error = new PlanComparisonError('Plan comparison failed', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
      expect(error.details.planIds).toEqual(payload.planIds);
      expect(error.details.comparisonCriteria).toEqual(payload.comparisonCriteria);
    });
  });

  describe('PlanPersistenceError', () => {
    it('should extend BaseError', () => {
      const error = new PlanPersistenceError('Plan persistence failed');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanPersistenceError('Plan persistence failed');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should use correct error code', () => {
      const error = new PlanPersistenceError('Plan persistence failed');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_TECH_PERSISTENCE_FAILURE);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanPersistenceError('Plan persistence failed');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanPersistenceError('Plan persistence failed');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('persistPlan');
    });

    it('should include operation-specific context in error details', () => {
      const payload = { 
        planId: 'PLAN-123', 
        userId: 'USER-456', 
        operation: 'create' 
      };
      const error = new PlanPersistenceError('Plan persistence failed', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
      expect(error.context.operation).toBe('createPlan');
    });

    it('should mark error as transient with retry strategy', () => {
      const error = new PlanPersistenceError('Plan persistence failed');
      expect(error.context.isTransient).toBe(true);
      expect(error.context.retryStrategy).toBeDefined();
      expect(error.context.retryStrategy?.maxAttempts).toBe(3);
      expect(error.context.retryStrategy?.baseDelayMs).toBe(1000);
      expect(error.context.retryStrategy?.useExponentialBackoff).toBe(true);
    });
  });

  describe('PlanProviderApiError', () => {
    it('should extend BaseError', () => {
      const error = new PlanProviderApiError('Provider API error');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanProviderApiError('Provider API error');
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should use correct error code', () => {
      const error = new PlanProviderApiError('Provider API error');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_EXT_PROVIDER_UNAVAILABLE);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanProviderApiError('Provider API error');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanProviderApiError('Provider API error');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('callProviderApi');
    });

    it('should include provider-specific payload in error details', () => {
      const payload = { 
        planId: 'PLAN-123', 
        providerId: 'PROVIDER-789', 
        endpoint: '/api/plans/details', 
        statusCode: 503 
      };
      const error = new PlanProviderApiError('Provider API error', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
    });

    it('should mark error as transient with retry strategy', () => {
      const error = new PlanProviderApiError('Provider API error');
      expect(error.context.isTransient).toBe(true);
      expect(error.context.retryStrategy).toBeDefined();
      expect(error.context.retryStrategy?.maxAttempts).toBe(3);
      expect(error.context.retryStrategy?.baseDelayMs).toBe(2000);
      expect(error.context.retryStrategy?.useExponentialBackoff).toBe(true);
    });

    it('should determine transient status based on status code', () => {
      // Transient status codes
      const transientCodes = [502, 503, 504];
      for (const statusCode of transientCodes) {
        const error = new PlanProviderApiError('Provider API error', { statusCode });
        expect(error.context.isTransient).toBe(true);
      }

      // Non-transient status code
      const error = new PlanProviderApiError('Provider API error', { statusCode: 400 });
      expect(error.context.isTransient).toBe(false);
    });
  });

  describe('PlanEnrollmentError', () => {
    it('should extend BaseError', () => {
      const error = new PlanEnrollmentError('Plan enrollment failed');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanEnrollmentError('Plan enrollment failed');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use correct error code', () => {
      const error = new PlanEnrollmentError('Plan enrollment failed');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_BUS_ENROLLMENT_CLOSED);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanEnrollmentError('Plan enrollment failed');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanEnrollmentError('Plan enrollment failed');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('enrollInPlan');
    });

    it('should include enrollment-specific payload in error details', () => {
      const payload = { 
        planId: 'PLAN-123', 
        userId: 'USER-456', 
        enrollmentPeriod: { start: '2023-01-01', end: '2023-03-31' },
        reason: 'Enrollment period has ended'
      };
      const error = new PlanEnrollmentError('Plan enrollment failed', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
      expect(error.details.enrollmentPeriod).toEqual(payload.enrollmentPeriod);
      expect(error.details.reason).toEqual(payload.reason);
    });
  });

  describe('PlanSearchError', () => {
    it('should extend BaseError', () => {
      const error = new PlanSearchError('Plan search failed');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type classification', () => {
      const error = new PlanSearchError('Plan search failed');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should use correct error code', () => {
      const error = new PlanSearchError('Plan search failed');
      expect(error.code).toBe(PlanErrorCodes.PLAN_PLAN_TECH_RETRIEVAL_FAILURE);
    });

    it('should map to correct HTTP status code', () => {
      const error = new PlanSearchError('Plan search failed');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include journey and domain in context', () => {
      const error = new PlanSearchError('Plan search failed');
      expect(error.context.journey).toBe(JourneyType.PLAN);
      expect(error.context.domain).toBe(PlanErrorDomain.PLANS);
      expect(error.context.operation).toBe('searchPlans');
    });

    it('should include search-specific payload in error details', () => {
      const payload = { 
        searchCriteria: { type: 'HMO', maxPremium: 500 }, 
        userId: 'USER-456' 
      };
      const error = new PlanSearchError('Plan search failed', payload);
      expect(error.details).toEqual(payload);
      expect(error.context.data).toEqual(payload);
      expect(error.details.searchCriteria).toEqual(payload.searchCriteria);
    });
  });
});