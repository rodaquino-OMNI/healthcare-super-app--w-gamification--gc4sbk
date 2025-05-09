/**
 * @file plans-errors.spec.ts
 * @description Unit tests for the Plan journey's plan-specific error classes.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../../src/base';
import {
  PlanNotFoundError,
  PlanNotAvailableInRegionError,
  PlanSelectionValidationError,
  PlanComparisonError,
  PlanPersistenceError,
  PlanProviderApiError,
  createPlanNotFoundError,
  createPlanNotAvailableInRegionError,
  createPlanSelectionValidationError,
  createPlanComparisonError,
  createPlanPersistenceError,
  createPlanProviderApiError
} from '../../../../src/journey/plan/plans-errors';
import {
  PLAN_PLAN_BUSINESS_ERRORS,
  PLAN_PLAN_VALIDATION_ERRORS,
  PLAN_PLAN_TECHNICAL_ERRORS,
  PLAN_PLAN_EXTERNAL_ERRORS
} from '../../../../src/journey/plan/error-codes';

describe('Plan Journey - Plans Error Classes', () => {
  // Test data
  const planId = 'plan-123';
  const region = 'northeast';
  const validationErrors = ['Invalid plan type', 'Missing coverage details'];
  const planIds = ['plan-123', 'plan-456'];
  const reason = 'Plans have incompatible coverage types';
  const operation = 'update';
  const providerName = 'BlueCross';
  const endpoint = '/api/plans/verify';
  const customMessage = 'Custom error message';
  const cause = new Error('Original error');
  
  describe('PlanNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new PlanNotFoundError(planId);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use the correct error code', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.code).toBe(PLAN_PLAN_BUSINESS_ERRORS.PLAN_NOT_FOUND);
    });

    it('should map to HTTP 422 Unprocessable Entity', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include planId in context', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.context.planId).toBe(planId);
    });

    it('should include timestamp in context', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.context.timestamp).toBeDefined();
    });

    it('should use default message when not provided', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.message).toBe(`Plan with ID ${planId} not found`);
    });

    it('should use custom message when provided', () => {
      const error = new PlanNotFoundError(planId, customMessage);
      expect(error.message).toBe(customMessage);
    });

    it('should include additional details when provided', () => {
      const details = { userId: 'user-123' };
      const error = new PlanNotFoundError(planId, undefined, details);
      expect(error.context.userId).toBe(details.userId);
    });

    it('should include cause when provided', () => {
      const error = new PlanNotFoundError(planId, undefined, undefined, cause);
      expect(error.cause).toBe(cause);
    });

    it('should serialize to JSON correctly', () => {
      const error = new PlanNotFoundError(planId);
      const json = error.toJSON();
      
      expect(json.error).toBeDefined();
      expect(json.error.type).toBe(ErrorType.BUSINESS);
      expect(json.error.code).toBe(PLAN_PLAN_BUSINESS_ERRORS.PLAN_NOT_FOUND);
      expect(json.error.message).toBe(`Plan with ID ${planId} not found`);
    });

    it('should create proper log entry', () => {
      const error = new PlanNotFoundError(planId);
      const logEntry = error.toLogEntry();
      
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.name).toBe('PlanNotFoundError');
      expect(logEntry.error.type).toBe(ErrorType.BUSINESS);
      expect(logEntry.error.code).toBe(PLAN_PLAN_BUSINESS_ERRORS.PLAN_NOT_FOUND);
      expect(logEntry.httpStatus).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should be created correctly using helper function', () => {
      const error = createPlanNotFoundError(planId, customMessage);
      
      expect(error).toBeInstanceOf(PlanNotFoundError);
      expect(error.context.planId).toBe(planId);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('PlanNotAvailableInRegionError', () => {
    it('should extend BaseError', () => {
      const error = new PlanNotAvailableInRegionError(planId, region);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new PlanNotAvailableInRegionError(planId, region);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use the correct error code', () => {
      const error = new PlanNotAvailableInRegionError(planId, region);
      expect(error.code).toBe(PLAN_PLAN_BUSINESS_ERRORS.PLAN_NOT_AVAILABLE);
    });

    it('should map to HTTP 422 Unprocessable Entity', () => {
      const error = new PlanNotAvailableInRegionError(planId, region);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include planId and region in context', () => {
      const error = new PlanNotAvailableInRegionError(planId, region);
      expect(error.context.planId).toBe(planId);
      expect(error.context.region).toBe(region);
    });

    it('should use default message when not provided', () => {
      const error = new PlanNotAvailableInRegionError(planId, region);
      expect(error.message).toBe(`Plan with ID ${planId} is not available in region ${region}`);
    });

    it('should be created correctly using helper function', () => {
      const error = createPlanNotAvailableInRegionError(planId, region, customMessage);
      
      expect(error).toBeInstanceOf(PlanNotAvailableInRegionError);
      expect(error.context.planId).toBe(planId);
      expect(error.context.region).toBe(region);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('PlanSelectionValidationError', () => {
    it('should extend BaseError', () => {
      const error = new PlanSelectionValidationError(planId, validationErrors);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have VALIDATION error type', () => {
      const error = new PlanSelectionValidationError(planId, validationErrors);
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should use the correct error code', () => {
      const error = new PlanSelectionValidationError(planId, validationErrors);
      expect(error.code).toBe(PLAN_PLAN_VALIDATION_ERRORS.INVALID_PLAN_TYPE);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new PlanSelectionValidationError(planId, validationErrors);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should include planId and validationErrors in context', () => {
      const error = new PlanSelectionValidationError(planId, validationErrors);
      expect(error.context.planId).toBe(planId);
      expect(error.context.validationErrors).toEqual(validationErrors);
    });

    it('should be created correctly using helper function', () => {
      const error = createPlanSelectionValidationError(planId, validationErrors, customMessage);
      
      expect(error).toBeInstanceOf(PlanSelectionValidationError);
      expect(error.context.planId).toBe(planId);
      expect(error.context.validationErrors).toEqual(validationErrors);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('PlanComparisonError', () => {
    it('should extend BaseError', () => {
      const error = new PlanComparisonError(planIds, reason);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new PlanComparisonError(planIds, reason);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use the correct error code', () => {
      const error = new PlanComparisonError(planIds, reason);
      expect(error.code).toBe(PLAN_PLAN_BUSINESS_ERRORS.COMPARISON_FAILED);
    });

    it('should map to HTTP 422 Unprocessable Entity', () => {
      const error = new PlanComparisonError(planIds, reason);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include planIds and reason in context', () => {
      const error = new PlanComparisonError(planIds, reason);
      expect(error.context.planIds).toEqual(planIds);
      expect(error.context.reason).toBe(reason);
    });

    it('should be created correctly using helper function', () => {
      const error = createPlanComparisonError(planIds, reason, customMessage);
      
      expect(error).toBeInstanceOf(PlanComparisonError);
      expect(error.context.planIds).toEqual(planIds);
      expect(error.context.reason).toBe(reason);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('PlanPersistenceError', () => {
    it('should extend BaseError', () => {
      const error = new PlanPersistenceError(planId, operation);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have TECHNICAL error type', () => {
      const error = new PlanPersistenceError(planId, operation);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should use the correct error code for non-retrieve operations', () => {
      const error = new PlanPersistenceError(planId, 'update');
      expect(error.code).toBe(PLAN_PLAN_TECHNICAL_ERRORS.DATABASE_SAVE_ERROR);
    });

    it('should use the correct error code for retrieve operations', () => {
      const error = new PlanPersistenceError(planId, 'retrieve');
      expect(error.code).toBe(PLAN_PLAN_TECHNICAL_ERRORS.DATABASE_RETRIEVAL_ERROR);
    });

    it('should map to HTTP 500 Internal Server Error', () => {
      const error = new PlanPersistenceError(planId, operation);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include planId and operation in context', () => {
      const error = new PlanPersistenceError(planId, operation);
      expect(error.context.planId).toBe(planId);
      expect(error.context.operation).toBe(operation);
    });

    it('should be created correctly using helper function', () => {
      const error = createPlanPersistenceError(planId, operation, customMessage);
      
      expect(error).toBeInstanceOf(PlanPersistenceError);
      expect(error.context.planId).toBe(planId);
      expect(error.context.operation).toBe(operation);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('PlanProviderApiError', () => {
    it('should extend BaseError', () => {
      const error = new PlanProviderApiError(providerName, endpoint);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have EXTERNAL error type', () => {
      const error = new PlanProviderApiError(providerName, endpoint);
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should use the correct error code', () => {
      const error = new PlanProviderApiError(providerName, endpoint);
      expect(error.code).toBe(PLAN_PLAN_EXTERNAL_ERRORS.PROVIDER_API_ERROR);
    });

    it('should map to HTTP 502 Bad Gateway', () => {
      const error = new PlanProviderApiError(providerName, endpoint);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include providerName and endpoint in context', () => {
      const error = new PlanProviderApiError(providerName, endpoint);
      expect(error.context.providerName).toBe(providerName);
      expect(error.context.endpoint).toBe(endpoint);
    });

    it('should be created correctly using helper function', () => {
      const error = createPlanProviderApiError(providerName, endpoint, customMessage);
      
      expect(error).toBeInstanceOf(PlanProviderApiError);
      expect(error.context.providerName).toBe(providerName);
      expect(error.context.endpoint).toBe(endpoint);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('Error context and journey integration', () => {
    it('should allow adding journey context', () => {
      const error = new PlanNotFoundError(planId);
      const withJourney = error.withContext({ journey: JourneyContext.PLAN });
      
      expect(withJourney.context.journey).toBe(JourneyContext.PLAN);
    });

    it('should allow adding request ID for tracking', () => {
      const requestId = 'req-123-456';
      const error = new PlanNotFoundError(planId);
      const withRequestId = error.withContext({ requestId });
      
      expect(withRequestId.context.requestId).toBe(requestId);
    });

    it('should include journey context in serialized output', () => {
      const error = new PlanNotFoundError(planId);
      const withJourney = error.withContext({ journey: JourneyContext.PLAN });
      const json = withJourney.toJSON();
      
      expect(json.error.journey).toBe(JourneyContext.PLAN);
    });

    it('should include journey context in log entry', () => {
      const error = new PlanNotFoundError(planId);
      const withJourney = error.withContext({ journey: JourneyContext.PLAN });
      const logEntry = withJourney.toLogEntry();
      
      expect(logEntry.context.journey).toBe(JourneyContext.PLAN);
    });
  });

  describe('Error classification and handling', () => {
    it('should classify PlanNotFoundError as a client error', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.isClientError()).toBe(true);
      expect(error.isServerError()).toBe(false);
    });

    it('should classify PlanPersistenceError as a server error', () => {
      const error = new PlanPersistenceError(planId, operation);
      expect(error.isClientError()).toBe(false);
      expect(error.isServerError()).toBe(true);
    });

    it('should classify PlanProviderApiError as retryable', () => {
      const error = new PlanProviderApiError(providerName, endpoint);
      expect(error.isRetryable()).toBe(true);
    });

    it('should not classify PlanNotFoundError as retryable', () => {
      const error = new PlanNotFoundError(planId);
      expect(error.isRetryable()).toBe(false);
    });
  });
});