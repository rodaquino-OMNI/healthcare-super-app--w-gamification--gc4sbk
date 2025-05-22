import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/base';
import {
  BaseBenefitError,
  BenefitNotFoundError,
  BenefitNotCoveredError,
  BenefitEligibilityError,
  BenefitLimitExceededError,
  BenefitPersistenceError,
  BenefitVerificationApiError,
  BenefitRetrievalError,
  BenefitValidationError,
  BenefitCalculationError,
  BenefitWaitingPeriodError
} from '../../../../src/journey/plan/benefits-errors';
import { BenefitErrorCodes } from '../../../../src/journey/plan/error-codes';
import { PlanErrorDomain } from '../../../../src/journey/plan/types';

describe('Plan Journey Benefit Errors', () => {
  describe('BaseBenefitError', () => {
    it('should extend BaseError', () => {
      // Create a concrete implementation of the abstract class for testing
      class ConcreteBenefitError extends BaseBenefitError {
        constructor() {
          super('Test error', ErrorType.BUSINESS, 'TEST_CODE');
        }
      }

      const error = new ConcreteBenefitError();
      
      // Verify error properties
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('TEST_CODE');
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
    });
  });

  describe('BenefitNotFoundError', () => {
    const benefitId = 'benefit-123';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Original error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitNotFoundError(benefitId, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitNotFoundError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Benefit with ID ${benefitId} not found`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_BUS_NOT_FOUND);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        benefitId,
        operation: 'findBenefit'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitNotFoundError(benefitId);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_BUS_NOT_FOUND);
      expect(serialized.error).toHaveProperty('message', `Benefit with ID ${benefitId} not found`);
      expect(serialized.error).toHaveProperty('details');
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitNotFoundError(benefitId);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('BenefitNotCoveredError', () => {
    const benefitId = 'benefit-123';
    const planId = 'plan-456';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Original error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitNotCoveredError(benefitId, planId, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitNotCoveredError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Benefit ${benefitId} is not covered by plan ${planId}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_BUS_NOT_COVERED);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        benefitId,
        planId,
        operation: 'checkBenefitCoverage'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_BUS_NOT_COVERED);
      expect(serialized.error).toHaveProperty('message', `Benefit ${benefitId} is not covered by plan ${planId}`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitNotCoveredError(benefitId, planId);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('BenefitEligibilityError', () => {
    const benefitId = 'benefit-123';
    const userId = 'user-456';
    const reason = 'Waiting period not satisfied';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Original error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitEligibilityError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`User ${userId} is not eligible for benefit ${benefitId}: ${reason}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_BUS_REQUIRES_PREAUTHORIZATION);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        benefitId,
        userId,
        reason,
        operation: 'checkBenefitEligibility'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_BUS_REQUIRES_PREAUTHORIZATION);
      expect(serialized.error).toHaveProperty('message', `User ${userId} is not eligible for benefit ${benefitId}: ${reason}`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitEligibilityError(benefitId, userId, reason);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('BenefitLimitExceededError', () => {
    const benefitId = 'benefit-123';
    const userId = 'user-456';
    const currentUsage = 5;
    const limit = 3;
    const details = { additionalInfo: 'test' };
    const cause = new Error('Original error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, limit, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitLimitExceededError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`User ${userId} has exceeded the limit for benefit ${benefitId}: ${currentUsage}/${limit}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_BUS_LIMIT_EXCEEDED);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        benefitId,
        userId,
        currentUsage,
        limit,
        operation: 'checkBenefitLimit'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, limit);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_BUS_LIMIT_EXCEEDED);
      expect(serialized.error).toHaveProperty('message', `User ${userId} has exceeded the limit for benefit ${benefitId}: ${currentUsage}/${limit}`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitLimitExceededError(benefitId, userId, currentUsage, limit);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('BenefitPersistenceError', () => {
    const operation = 'createBenefit';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Database connection error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitPersistenceError(operation, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitPersistenceError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Failed to perform database operation '${operation}' for benefit`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_TECH_PERSISTENCE_FAILURE);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        operation
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitPersistenceError(operation);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_TECH_PERSISTENCE_FAILURE);
      expect(serialized.error).toHaveProperty('message', `Failed to perform database operation '${operation}' for benefit`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitPersistenceError(operation);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('BenefitVerificationApiError', () => {
    const apiName = 'InsuranceVerificationAPI';
    const details = { additionalInfo: 'test' };
    const cause = new Error('API connection timeout');
    
    it('should create error with correct properties', () => {
      const error = new BenefitVerificationApiError(apiName, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitVerificationApiError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Failed to verify benefit with external API: ${apiName}`);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_EXT_AUTHORIZATION_SERVICE_FAILURE);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        apiName,
        operation: 'verifyBenefitWithExternalApi'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitVerificationApiError(apiName);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_EXT_AUTHORIZATION_SERVICE_FAILURE);
      expect(serialized.error).toHaveProperty('message', `Failed to verify benefit with external API: ${apiName}`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitVerificationApiError(apiName);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('BenefitRetrievalError', () => {
    const operation = 'getBenefitDetails';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Data retrieval error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitRetrievalError(operation, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitRetrievalError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Failed to retrieve benefit data during operation '${operation}'`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_TECH_RETRIEVAL_FAILURE);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        operation
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitRetrievalError(operation);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_TECH_RETRIEVAL_FAILURE);
      expect(serialized.error).toHaveProperty('message', `Failed to retrieve benefit data during operation '${operation}'`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitRetrievalError(operation);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('BenefitValidationError', () => {
    const field = 'coveragePercentage';
    const value = -10;
    const constraint = 'must be a positive number';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Validation error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitValidationError(field, value, constraint, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitValidationError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Benefit validation failed for field '${field}': ${constraint}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_VAL_INVALID_COVERAGE);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        field,
        value,
        constraint,
        operation: 'validateBenefit'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitValidationError(field, value, constraint);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_VAL_INVALID_COVERAGE);
      expect(serialized.error).toHaveProperty('message', `Benefit validation failed for field '${field}': ${constraint}`);
      expect(serialized.error).toHaveProperty('details');
      expect(serialized.error.details).toEqual({
        field,
        value,
        constraint,
        operation: 'validateBenefit'
      });
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitValidationError(field, value, constraint);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('BenefitCalculationError', () => {
    const benefitId = 'benefit-123';
    const calculationType = 'copayAmount';
    const details = { additionalInfo: 'test' };
    const cause = new Error('Calculation error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitCalculationError(benefitId, calculationType, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitCalculationError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Failed to calculate ${calculationType} for benefit ${benefitId}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_TECH_CALCULATION_FAILURE);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        benefitId,
        calculationType,
        operation: 'calculateBenefit'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitCalculationError(benefitId, calculationType);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_TECH_CALCULATION_FAILURE);
      expect(serialized.error).toHaveProperty('message', `Failed to calculate ${calculationType} for benefit ${benefitId}`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitCalculationError(benefitId, calculationType);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('BenefitWaitingPeriodError', () => {
    const benefitId = 'benefit-123';
    const userId = 'user-456';
    const waitingPeriodDays = 30;
    const effectiveDate = new Date('2023-06-01');
    const details = { additionalInfo: 'test' };
    const cause = new Error('Waiting period error');
    
    it('should create error with correct properties', () => {
      const error = new BenefitWaitingPeriodError(benefitId, userId, waitingPeriodDays, effectiveDate, details, cause);
      
      // Verify error properties
      expect(error).toBeInstanceOf(BenefitWaitingPeriodError);
      expect(error).toBeInstanceOf(BaseBenefitError);
      expect(error.message).toBe(`Benefit ${benefitId} requires a waiting period of ${waitingPeriodDays} days. Available from ${effectiveDate.toISOString().split('T')[0]}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(BenefitErrorCodes.PLAN_BENEFIT_BUS_WAITING_PERIOD);
      expect(error.cause).toBe(cause);
      
      // Verify context
      expect(error.context).toBeDefined();
      expect(error.context.domain).toBe(PlanErrorDomain.BENEFITS);
      expect(error.context.data).toEqual({
        ...details,
        benefitId,
        userId,
        waitingPeriodDays,
        effectiveDate: effectiveDate.toISOString(),
        operation: 'checkBenefitWaitingPeriod'
      });
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new BenefitWaitingPeriodError(benefitId, userId, waitingPeriodDays, effectiveDate);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', BenefitErrorCodes.PLAN_BENEFIT_BUS_WAITING_PERIOD);
      expect(serialized.error).toHaveProperty('message', `Benefit ${benefitId} requires a waiting period of ${waitingPeriodDays} days. Available from ${effectiveDate.toISOString().split('T')[0]}`);
    });
    
    it('should convert to HttpException with correct status code', () => {
      const error = new BenefitWaitingPeriodError(benefitId, userId, waitingPeriodDays, effectiveDate);
      const httpException = error.toHttpException();
      
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });
});