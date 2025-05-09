import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../../src/base';
import {
  BenefitError,
  BenefitNotFoundError,
  BenefitNotCoveredError,
  BenefitEligibilityError,
  BenefitLimitExceededError,
  BenefitPersistenceError,
  BenefitVerificationApiError,
  BenefitExpiredError,
  BenefitAuthorizationRequiredError,
  BenefitWaitingPeriodError,
  BenefitPreExistingConditionError
} from '../../../../src/journey/plan/benefits-errors';
import { PLAN_BENEF_BUSINESS_ERRORS, PLAN_BENEF_TECHNICAL_ERRORS, PLAN_BENEF_EXTERNAL_ERRORS } from '../../../../src/journey/plan/error-codes';
import { PlanErrorType } from '../../../../src/journey/plan/types';

/**
 * Test suite for Plan journey's benefit-specific error classes.
 * These tests verify proper error inheritance, error type classification,
 * HTTP status code mapping, context data inclusion, and error serialization.
 */
describe('Plan Journey Benefit Errors', () => {
  // Common test values
  const benefitId = 'benefit-123';
  const benefitType = 'Dental';
  const planId = 'plan-456';
  const userId = 'user-789';
  const requestId = 'req-abc123';

  /**
   * Helper function to verify common properties of all benefit errors
   */
  const verifyCommonErrorProperties = (error: BenefitError) => {
    // Verify inheritance
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(BenefitError);

    // Verify journey context
    expect(error.context.journey).toBe(JourneyContext.PLAN);

    // Verify plan error type in details
    expect(error.details).toBeDefined();
    expect(error.details.planErrorType).toBe(PlanErrorType.BENEFIT);

    // Verify error can be serialized
    const serialized = error.toJSON();
    expect(serialized).toBeDefined();
    expect(serialized.error).toBeDefined();
    expect(serialized.error.journey).toBe(JourneyContext.PLAN);
    expect(serialized.error.message).toBe(error.message);
    expect(serialized.error.code).toBe(error.code);
    expect(serialized.error.type).toBe(error.type);
  };

  /**
   * Helper function to verify HTTP status code mapping based on error type
   */
  const verifyHttpStatusCode = (error: BenefitError, expectedType: ErrorType, expectedStatus: HttpStatus) => {
    expect(error.type).toBe(expectedType);
    expect(error.getHttpStatusCode()).toBe(expectedStatus);
    
    // Verify HTTP exception
    const httpException = error.toHttpException();
    expect(httpException).toBeDefined();
    expect(httpException.getStatus()).toBe(expectedStatus);
  };

  describe('BenefitNotFoundError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const error = new BenefitNotFoundError(benefitId);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain('not found');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_NOT_FOUND);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.suggestion).toContain('verify the benefit ID');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const context = { userId, requestId };
      const error = new BenefitNotFoundError(benefitId, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
    });

    it('should include cause when provided', () => {
      // Create error with cause
      const cause = new Error('Database error');
      const error = new BenefitNotFoundError(benefitId, {}, cause);
      
      // Verify cause is included
      expect(error.cause).toBe(cause);
    });
  });

  describe('BenefitNotCoveredError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const error = new BenefitNotCoveredError(benefitId, benefitType, planId);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain(planId);
      expect(error.message).toContain('not covered');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_NOT_COVERED);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.planId).toBe(planId);
      expect(error.suggestion).toContain('check your plan coverage');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const context = { userId, requestId };
      const error = new BenefitNotCoveredError(benefitId, benefitType, planId, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.planId).toBe(planId);
    });
  });

  describe('BenefitEligibilityError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const reason = 'Waiting period not satisfied';
      const error = new BenefitEligibilityError(benefitId, benefitType, reason);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain(reason);
      expect(error.message).toContain('Not eligible');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.VERIFICATION_FAILED);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.eligibilityReason).toBe(reason);
      expect(error.suggestion).toContain('review the eligibility requirements');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const reason = 'Waiting period not satisfied';
      const context = { userId, requestId };
      const error = new BenefitEligibilityError(benefitId, benefitType, reason, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.eligibilityReason).toBe(reason);
    });
  });

  describe('BenefitLimitExceededError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const currentUsage = 10;
      const limitValue = 5;
      const error = new BenefitLimitExceededError(benefitId, benefitType, currentUsage, limitValue);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain(currentUsage.toString());
      expect(error.message).toContain(limitValue.toString());
      expect(error.message).toContain('limit exceeded');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_LIMIT_REACHED);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.currentUsage).toBe(currentUsage);
      expect(error.context.limitValue).toBe(limitValue);
      expect(error.suggestion).toContain('reached the maximum allowed usage');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const currentUsage = 10;
      const limitValue = 5;
      const context = { userId, requestId };
      const error = new BenefitLimitExceededError(benefitId, benefitType, currentUsage, limitValue, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.currentUsage).toBe(currentUsage);
      expect(error.context.limitValue).toBe(limitValue);
    });
  });

  describe('BenefitPersistenceError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const operation = 'create';
      const error = new BenefitPersistenceError(operation, benefitId);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(operation);
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain('failed');
      expect(error.code).toBe(PLAN_BENEF_TECHNICAL_ERRORS.DATABASE_SAVE_ERROR);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.operation).toBe(operation);
      expect(error.suggestion).toContain('try again later');
      
      // Verify HTTP status code (TECHNICAL -> 500 Internal Server Error)
      verifyHttpStatusCode(error, ErrorType.TECHNICAL, HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should handle missing benefitId', () => {
      // Create error without benefitId
      const operation = 'create';
      const error = new BenefitPersistenceError(operation);
      
      // Verify message doesn't contain benefitId
      expect(error.message).not.toContain('benefit ID');
      expect(error.message).toContain(operation);
      expect(error.message).toContain('failed');
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const operation = 'create';
      const context = { userId, requestId };
      const error = new BenefitPersistenceError(operation, benefitId, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.operation).toBe(operation);
    });
  });

  describe('BenefitVerificationApiError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const statusCode = 503;
      const apiResponse = { error: 'Service Unavailable' };
      const error = new BenefitVerificationApiError(benefitId, statusCode, apiResponse);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(statusCode.toString());
      expect(error.message).toContain('API error');
      expect(error.code).toBe(PLAN_BENEF_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.statusCode).toBe(statusCode);
      expect(error.context.apiResponse).toBe(apiResponse);
      expect(error.suggestion).toContain('try again later');
      
      // Verify HTTP status code (EXTERNAL -> 502 Bad Gateway)
      verifyHttpStatusCode(error, ErrorType.EXTERNAL, HttpStatus.BAD_GATEWAY);
    });

    it('should handle missing parameters', () => {
      // Create error without optional parameters
      const error = new BenefitVerificationApiError();
      
      // Verify message doesn't contain benefitId or statusCode
      expect(error.message).not.toContain('benefit ID');
      expect(error.message).not.toContain('Status:');
      expect(error.message).toContain('API error');
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const statusCode = 503;
      const apiResponse = { error: 'Service Unavailable' };
      const context = { userId, requestId };
      const error = new BenefitVerificationApiError(benefitId, statusCode, apiResponse, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.statusCode).toBe(statusCode);
      expect(error.context.apiResponse).toBe(apiResponse);
    });
  });

  describe('BenefitExpiredError', () => {
    it('should create error with correct properties using Date object', () => {
      // Create error with Date object
      const expirationDate = new Date('2023-01-01');
      const error = new BenefitExpiredError(benefitId, benefitType, expirationDate);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain('2023-01-01');
      expect(error.message).toContain('expired');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_PERIOD_EXPIRED);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.expirationDate).toBe('2023-01-01');
      expect(error.suggestion).toContain('check your current plan benefits');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create error with correct properties using string date', () => {
      // Create error with string date
      const expirationDate = '2023-01-01';
      const error = new BenefitExpiredError(benefitId, benefitType, expirationDate);
      
      // Verify specific properties
      expect(error.message).toContain('2023-01-01');
      expect(error.context.expirationDate).toBe('2023-01-01');
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const expirationDate = '2023-01-01';
      const context = { userId, requestId };
      const error = new BenefitExpiredError(benefitId, benefitType, expirationDate, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.expirationDate).toBe(expirationDate);
    });
  });

  describe('BenefitAuthorizationRequiredError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const error = new BenefitAuthorizationRequiredError(benefitId, benefitType);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain('requires prior authorization');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.AUTHORIZATION_REQUIRED);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.suggestion).toContain('contact your healthcare provider');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const context = { userId, requestId };
      const error = new BenefitAuthorizationRequiredError(benefitId, benefitType, context);
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
    });
  });

  describe('BenefitWaitingPeriodError', () => {
    it('should create error with correct properties using Date object', () => {
      // Create error with Date object
      const waitingPeriodDays = 90;
      const daysRemaining = 30;
      const availableDate = new Date('2023-04-01');
      const error = new BenefitWaitingPeriodError(
        benefitId, 
        benefitType, 
        waitingPeriodDays, 
        daysRemaining, 
        availableDate
      );
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain(waitingPeriodDays.toString());
      expect(error.message).toContain(daysRemaining.toString());
      expect(error.message).toContain('2023-04-01');
      expect(error.message).toContain('waiting period');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.WAITING_PERIOD_ACTIVE);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.waitingPeriodDays).toBe(waitingPeriodDays);
      expect(error.context.daysRemaining).toBe(daysRemaining);
      expect(error.context.availableDate).toBe('2023-04-01');
      expect(error.suggestion).toContain('waiting period has elapsed');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create error with correct properties using string date', () => {
      // Create error with string date
      const waitingPeriodDays = 90;
      const daysRemaining = 30;
      const availableDate = '2023-04-01';
      const error = new BenefitWaitingPeriodError(
        benefitId, 
        benefitType, 
        waitingPeriodDays, 
        daysRemaining, 
        availableDate
      );
      
      // Verify specific properties
      expect(error.message).toContain('2023-04-01');
      expect(error.context.availableDate).toBe('2023-04-01');
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const waitingPeriodDays = 90;
      const daysRemaining = 30;
      const availableDate = '2023-04-01';
      const context = { userId, requestId };
      const error = new BenefitWaitingPeriodError(
        benefitId, 
        benefitType, 
        waitingPeriodDays, 
        daysRemaining, 
        availableDate,
        context
      );
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.waitingPeriodDays).toBe(waitingPeriodDays);
      expect(error.context.daysRemaining).toBe(daysRemaining);
      expect(error.context.availableDate).toBe(availableDate);
    });
  });

  describe('BenefitPreExistingConditionError', () => {
    it('should create error with correct properties', () => {
      // Create error with minimal parameters
      const conditionCode = 'J45.909';
      const conditionName = 'Asthma';
      const error = new BenefitPreExistingConditionError(benefitId, benefitType, conditionCode, conditionName);
      
      // Verify common properties
      verifyCommonErrorProperties(error);
      
      // Verify specific properties
      expect(error.message).toContain(benefitId);
      expect(error.message).toContain(benefitType);
      expect(error.message).toContain(conditionCode);
      expect(error.message).toContain(conditionName);
      expect(error.message).toContain('pre-existing condition');
      expect(error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.PREEXISTING_CONDITION);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.conditionCode).toBe(conditionCode);
      expect(error.context.conditionName).toBe(conditionName);
      expect(error.suggestion).toContain('contact customer support');
      
      // Verify HTTP status code (BUSINESS -> 422 Unprocessable Entity)
      verifyHttpStatusCode(error, ErrorType.BUSINESS, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include additional context when provided', () => {
      // Create error with additional context
      const conditionCode = 'J45.909';
      const conditionName = 'Asthma';
      const context = { userId, requestId };
      const error = new BenefitPreExistingConditionError(
        benefitId, 
        benefitType, 
        conditionCode, 
        conditionName, 
        context
      );
      
      // Verify context is included
      expect(error.context.userId).toBe(userId);
      expect(error.context.requestId).toBe(requestId);
      expect(error.context.benefitId).toBe(benefitId);
      expect(error.context.benefitType).toBe(benefitType);
      expect(error.context.conditionCode).toBe(conditionCode);
      expect(error.context.conditionName).toBe(conditionName);
    });
  });

  describe('Error utility methods', () => {
    it('should correctly identify client vs server errors', () => {
      // Business errors are client errors (422)
      const businessError = new BenefitNotFoundError(benefitId);
      expect(businessError.isClientError()).toBe(true);
      expect(businessError.isServerError()).toBe(false);
      
      // Technical errors are server errors (500)
      const technicalError = new BenefitPersistenceError('create');
      expect(technicalError.isClientError()).toBe(false);
      expect(technicalError.isServerError()).toBe(true);
      
      // External errors are server errors (502)
      const externalError = new BenefitVerificationApiError();
      expect(externalError.isClientError()).toBe(false);
      expect(externalError.isServerError()).toBe(true);
    });

    it('should correctly identify retryable errors', () => {
      // Business errors are not retryable
      const businessError = new BenefitNotFoundError(benefitId);
      expect(businessError.isRetryable()).toBe(false);
      
      // Technical errors are retryable
      const technicalError = new BenefitPersistenceError('create');
      expect(technicalError.isRetryable()).toBe(true);
      
      // External errors are retryable
      const externalError = new BenefitVerificationApiError();
      expect(externalError.isRetryable()).toBe(true);
    });

    it('should create proper log entries', () => {
      // Create error with cause
      const cause = new Error('Database error');
      const error = new BenefitNotFoundError(benefitId, { userId, requestId }, cause);
      
      // Get log entry
      const logEntry = error.toLogEntry();
      
      // Verify log entry structure
      expect(logEntry).toBeDefined();
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.name).toBe('BenefitNotFoundError');
      expect(logEntry.error.type).toBe(ErrorType.BUSINESS);
      expect(logEntry.error.code).toBe(PLAN_BENEF_BUSINESS_ERRORS.BENEFIT_NOT_FOUND);
      expect(logEntry.error.message).toContain(benefitId);
      expect(logEntry.error.stack).toBeDefined();
      expect(logEntry.error.cause).toBeDefined();
      expect(logEntry.error.cause.name).toBe('Error');
      expect(logEntry.error.cause.message).toBe('Database error');
      expect(logEntry.context).toBeDefined();
      expect(logEntry.context.userId).toBe(userId);
      expect(logEntry.context.requestId).toBe(requestId);
      expect(logEntry.context.benefitId).toBe(benefitId);
      expect(logEntry.context.journey).toBe(JourneyContext.PLAN);
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.httpStatus).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });
});