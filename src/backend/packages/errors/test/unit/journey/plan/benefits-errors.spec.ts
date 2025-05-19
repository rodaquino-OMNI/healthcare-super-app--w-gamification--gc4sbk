import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the BaseError class and related types
import { BaseError, ErrorType } from '../../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';

// Import the benefit-specific error classes
import {
  BenefitNotFoundError,
  BenefitNotCoveredError,
  BenefitEligibilityError,
  BenefitLimitExceededError,
  BenefitPersistenceError,
  BenefitVerificationApiError
} from '../../../../src/journey/plan/benefits-errors';

// Import error codes and types
import { PLAN_BENEFITS_ERROR_CODES } from '../../../../src/journey/plan/error-codes';
import { PlanBenefitErrorType } from '../../../../src/journey/plan/types';

/**
 * Test suite for the Plan journey's benefit-specific error classes
 * Verifies error inheritance, classification, HTTP status code mapping, and context handling
 */
describe('Plan Journey Benefit Errors', () => {
  // Common test data
  const benefitId = 'benefit-123';
  const planId = 'plan-456';
  const userId = 'user-789';
  const requestId = 'req-abc';
  
  describe('BenefitNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new BenefitNotFoundError(benefitId);
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof BenefitNotFoundError).toBe(true);
    });
    
    it('should have correct error type classification', () => {
      const error = new BenefitNotFoundError(benefitId);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should have correct error code', () => {
      const error = new BenefitNotFoundError(benefitId);
      
      expect(error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_NOT_FOUND);
    });
    
    it('should include benefit ID in error details', () => {
      const error = new BenefitNotFoundError(benefitId);
      
      expect(error.details).toBeDefined();
      expect(error.details.benefitId).toBe(benefitId);
    });
    
    it('should map to correct HTTP status code', () => {
      const error = new BenefitNotFoundError(benefitId);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
    
    it('should serialize with proper structure', () => {
      const error = new BenefitNotFoundError(benefitId);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_NOT_FOUND);
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.details.benefitId).toBe(benefitId);
    });
    
    it('should accept and store context data', () => {
      const context = { requestId, userId, journeyContext: 'plan' };
      const error = new BenefitNotFoundError(benefitId, { context });
      
      expect(error.context).toBeDefined();
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.userId).toBe(userId);
      expect(error.context.journeyContext).toBe('plan');
    });
  });
  
  describe('BenefitNotCoveredError', () => {
    it('should extend BaseError', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof BenefitNotCoveredError).toBe(true);
    });
    
    it('should have correct error type classification', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should have correct error code', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      
      expect(error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_NOT_COVERED);
    });
    
    it('should include benefit ID and plan ID in error details', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      
      expect(error.details).toBeDefined();
      expect(error.details.benefitId).toBe(benefitId);
      expect(error.details.planId).toBe(planId);
    });
    
    it('should map to correct HTTP status code', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
    
    it('should serialize with proper structure', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_NOT_COVERED);
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.details.benefitId).toBe(benefitId);
      expect(serialized.error.details.planId).toBe(planId);
    });
  });
  
  describe('BenefitEligibilityError', () => {
    const reason = 'waiting period not satisfied';
    
    it('should extend BaseError', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof BenefitEligibilityError).toBe(true);
    });
    
    it('should have correct error type classification', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should have correct error code', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      
      expect(error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_ELIGIBILITY);
    });
    
    it('should include benefit ID, user ID, and reason in error details', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      
      expect(error.details).toBeDefined();
      expect(error.details.benefitId).toBe(benefitId);
      expect(error.details.userId).toBe(userId);
      expect(error.details.reason).toBe(reason);
    });
    
    it('should map to correct HTTP status code', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
  });
  
  describe('BenefitLimitExceededError', () => {
    const currentUsage = 5;
    const maxLimit = 3;
    
    it('should extend BaseError', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, maxLimit);
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof BenefitLimitExceededError).toBe(true);
    });
    
    it('should have correct error type classification', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, maxLimit);
      
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should have correct error code', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, maxLimit);
      
      expect(error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_LIMIT_EXCEEDED);
    });
    
    it('should include usage details in error details', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, maxLimit);
      
      expect(error.details).toBeDefined();
      expect(error.details.benefitId).toBe(benefitId);
      expect(error.details.userId).toBe(userId);
      expect(error.details.currentUsage).toBe(currentUsage);
      expect(error.details.maxLimit).toBe(maxLimit);
    });
    
    it('should map to correct HTTP status code', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, maxLimit);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
    
    it('should serialize with proper structure', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, maxLimit);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_LIMIT_EXCEEDED);
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.details.benefitId).toBe(benefitId);
      expect(serialized.error.details.userId).toBe(userId);
      expect(serialized.error.details.currentUsage).toBe(currentUsage);
      expect(serialized.error.details.maxLimit).toBe(maxLimit);
    });
  });
  
  describe('BenefitPersistenceError', () => {
    const operation = 'update';
    const originalError = new Error('Database connection failed');
    
    it('should extend BaseError', () => {
      const error = new BenefitPersistenceError(benefitId, operation, originalError);
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof BenefitPersistenceError).toBe(true);
    });
    
    it('should have correct error type classification', () => {
      const error = new BenefitPersistenceError(benefitId, operation, originalError);
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });
    
    it('should have correct error code', () => {
      const error = new BenefitPersistenceError(benefitId, operation, originalError);
      
      expect(error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_PERSISTENCE);
    });
    
    it('should include operation details in error details', () => {
      const error = new BenefitPersistenceError(benefitId, operation, originalError);
      
      expect(error.details).toBeDefined();
      expect(error.details.benefitId).toBe(benefitId);
      expect(error.details.operation).toBe(operation);
    });
    
    it('should store original error as cause', () => {
      const error = new BenefitPersistenceError(benefitId, operation, originalError);
      
      expect(error.cause).toBe(originalError);
    });
    
    it('should map to correct HTTP status code', () => {
      const error = new BenefitPersistenceError(benefitId, operation, originalError);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });
  });
  
  describe('BenefitVerificationApiError', () => {
    const apiName = 'external-benefits-api';
    const statusCode = 503;
    const apiResponse = { error: 'Service Unavailable' };
    
    it('should extend BaseError', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof BenefitVerificationApiError).toBe(true);
    });
    
    it('should have correct error type classification', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });
    
    it('should have correct error code', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      
      expect(error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_VERIFICATION_API);
    });
    
    it('should include API details in error details', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      
      expect(error.details).toBeDefined();
      expect(error.details.benefitId).toBe(benefitId);
      expect(error.details.apiName).toBe(apiName);
      expect(error.details.statusCode).toBe(statusCode);
      expect(error.details.apiResponse).toBe(apiResponse);
    });
    
    it('should map to correct HTTP status code', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
    });
    
    it('should serialize with proper structure', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      const serialized = error.toJSON();
      
      expect(serialized.error).toBeDefined();
      expect(serialized.error.code).toBe(PLAN_BENEFITS_ERROR_CODES.BENEFIT_VERIFICATION_API);
      expect(serialized.error.type).toBe(ErrorType.EXTERNAL);
      expect(serialized.error.details.benefitId).toBe(benefitId);
      expect(serialized.error.details.apiName).toBe(apiName);
      expect(serialized.error.details.statusCode).toBe(statusCode);
    });
    
    it('should not include sensitive API response data in serialized output by default', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      const serialized = error.toJSON();
      
      expect(serialized.error.details.apiResponse).toBeUndefined();
    });
    
    it('should include API response when debug option is enabled', () => {
      const error = new BenefitVerificationApiError(benefitId, apiName, statusCode, apiResponse);
      const serialized = error.toJSON({ debug: true });
      
      expect(serialized.error.details.apiResponse).toBe(apiResponse);
    });
  });
  
  describe('Error Type Classification', () => {
    it('should classify all benefit errors with correct error types', () => {
      // Business errors
      expect(new BenefitNotFoundError('test-id').type).toBe(ErrorType.BUSINESS);
      expect(new BenefitNotCoveredError('test-id', 'plan-id').type).toBe(ErrorType.BUSINESS);
      expect(new BenefitEligibilityError('test-id', 'user-id', 'reason').type).toBe(ErrorType.BUSINESS);
      expect(new BenefitLimitExceededError('test-id', 'user-id', 5, 3).type).toBe(ErrorType.BUSINESS);
      
      // Technical errors
      expect(new BenefitPersistenceError('test-id', 'create', new Error()).type).toBe(ErrorType.TECHNICAL);
      
      // External errors
      expect(new BenefitVerificationApiError('test-id', 'api', 500, {}).type).toBe(ErrorType.EXTERNAL);
    });
  });
  
  describe('HTTP Status Code Mapping', () => {
    it('should map all benefit errors to correct HTTP status codes', () => {
      // Business errors -> 400 range
      expect(new BenefitNotFoundError('test-id').toHttpException().getStatus())
        .toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
      expect(new BenefitNotCoveredError('test-id', 'plan-id').toHttpException().getStatus())
        .toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
      expect(new BenefitEligibilityError('test-id', 'user-id', 'reason').toHttpException().getStatus())
        .toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
      expect(new BenefitLimitExceededError('test-id', 'user-id', 5, 3).toHttpException().getStatus())
        .toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
      
      // Technical errors -> 500 range
      expect(new BenefitPersistenceError('test-id', 'create', new Error()).toHttpException().getStatus())
        .toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
      
      // External errors -> 502/503/504 range
      expect(new BenefitVerificationApiError('test-id', 'api', 500, {}).toHttpException().getStatus())
        .toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
    });
  });
});