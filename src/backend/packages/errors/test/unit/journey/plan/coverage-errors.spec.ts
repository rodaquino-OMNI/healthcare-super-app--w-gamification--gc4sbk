/**
 * @file coverage-errors.spec.ts
 * @description Unit tests for Plan journey's coverage-specific error classes
 * 
 * These tests validate that coverage-related error classes properly extend BaseError,
 * include appropriate context data, map to correct HTTP status codes, and serialize
 * consistently. This ensures consistent error handling for coverage verification features.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyType } from '../../../../src/base';
import { PLAN_ERROR_CODES } from '../../../../src/constants';
import {
  CoverageNotFoundError,
  ServiceNotCoveredError,
  OutOfNetworkError,
  CoverageVerificationError,
  CoveragePersistenceError,
  CoverageApiIntegrationError
} from '../../../../src/journey/plan/coverage-errors';

describe('Plan Journey Coverage Errors', () => {
  describe('CoverageNotFoundError', () => {
    const coverageId = 'cov-12345';
    const details = { additionalInfo: 'Test details' };
    const cause = new Error('Original error');
    let error: CoverageNotFoundError;

    beforeEach(() => {
      error = new CoverageNotFoundError(coverageId, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have correct error code', () => {
      expect(error.code).toBe(PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED);
    });

    it('should include coverageId in the error message', () => {
      expect(error.message).toContain(coverageId);
    });

    it('should include coverageId in the context metadata', () => {
      expect(error.context.metadata).toEqual({ coverageId });
    });

    it('should set the journey context to PLAN', () => {
      expect(error.context.journey).toBe(JourneyType.PLAN);
    });

    it('should set the operation context', () => {
      expect(error.context.operation).toBe('coverage-verification');
    });

    it('should set the component context', () => {
      expect(error.context.component).toBe('coverage-service');
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the provided cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
          message: `Coverage with ID ${coverageId} not found`,
          details,
          journey: JourneyType.PLAN,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should include detailed information in detailed JSON', () => {
      const detailedJson = error.toDetailedJSON();
      expect(detailedJson).toEqual({
        name: 'CoverageNotFoundError',
        message: `Coverage with ID ${coverageId} not found`,
        type: ErrorType.BUSINESS,
        code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
        details,
        context: {
          journey: JourneyType.PLAN,
          operation: 'coverage-verification',
          component: 'coverage-service',
          metadata: { coverageId },
          timestamp: expect.any(String),
          stack: expect.any(String)
        },
        cause: {
          name: 'Error',
          message: 'Original error',
          stack: expect.any(String)
        }
      });
    });
  });

  describe('ServiceNotCoveredError', () => {
    const serviceCode = 'SVC-001';
    const planId = 'plan-12345';
    const memberId = 'mem-12345';
    const details = { additionalInfo: 'Test details' };
    const cause = new Error('Original error');
    let error: ServiceNotCoveredError;

    beforeEach(() => {
      error = new ServiceNotCoveredError(serviceCode, planId, memberId, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have correct error code', () => {
      expect(error.code).toBe(PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED);
    });

    it('should include serviceCode and planId in the error message', () => {
      expect(error.message).toContain(serviceCode);
      expect(error.message).toContain(planId);
    });

    it('should include serviceCode, planId, and memberId in the context metadata', () => {
      expect(error.context.metadata).toEqual({ serviceCode, planId, memberId });
    });

    it('should set the journey context to PLAN', () => {
      expect(error.context.journey).toBe(JourneyType.PLAN);
    });

    it('should set the operation context', () => {
      expect(error.context.operation).toBe('service-coverage-check');
    });

    it('should set the component context', () => {
      expect(error.context.component).toBe('coverage-service');
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the provided cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
          message: `Service ${serviceCode} is not covered by plan ${planId}`,
          details,
          journey: JourneyType.PLAN,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should include detailed information in detailed JSON', () => {
      const detailedJson = error.toDetailedJSON();
      expect(detailedJson).toEqual({
        name: 'ServiceNotCoveredError',
        message: `Service ${serviceCode} is not covered by plan ${planId}`,
        type: ErrorType.BUSINESS,
        code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
        details,
        context: {
          journey: JourneyType.PLAN,
          operation: 'service-coverage-check',
          component: 'coverage-service',
          metadata: { serviceCode, planId, memberId },
          timestamp: expect.any(String),
          stack: expect.any(String)
        },
        cause: {
          name: 'Error',
          message: 'Original error',
          stack: expect.any(String)
        }
      });
    });
  });

  describe('OutOfNetworkError', () => {
    const providerId = 'prov-12345';
    const networkId = 'net-12345';
    const planId = 'plan-12345';
    const details = { additionalInfo: 'Test details' };
    const cause = new Error('Original error');
    let error: OutOfNetworkError;

    beforeEach(() => {
      error = new OutOfNetworkError(providerId, networkId, planId, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have correct error code', () => {
      expect(error.code).toBe(PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED);
    });

    it('should include providerId and planId in the error message', () => {
      expect(error.message).toContain(providerId);
      expect(error.message).toContain(planId);
    });

    it('should include providerId, networkId, and planId in the context metadata', () => {
      expect(error.context.metadata).toEqual({ providerId, networkId, planId });
    });

    it('should set the journey context to PLAN', () => {
      expect(error.context.journey).toBe(JourneyType.PLAN);
    });

    it('should set the operation context', () => {
      expect(error.context.operation).toBe('network-provider-check');
    });

    it('should set the component context', () => {
      expect(error.context.component).toBe('coverage-service');
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the provided cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
          message: `Provider ${providerId} is out of network for plan ${planId}`,
          details,
          journey: JourneyType.PLAN,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should include detailed information in detailed JSON', () => {
      const detailedJson = error.toDetailedJSON();
      expect(detailedJson).toEqual({
        name: 'OutOfNetworkError',
        message: `Provider ${providerId} is out of network for plan ${planId}`,
        type: ErrorType.BUSINESS,
        code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
        details,
        context: {
          journey: JourneyType.PLAN,
          operation: 'network-provider-check',
          component: 'coverage-service',
          metadata: { providerId, networkId, planId },
          timestamp: expect.any(String),
          stack: expect.any(String)
        },
        cause: {
          name: 'Error',
          message: 'Original error',
          stack: expect.any(String)
        }
      });
    });
  });

  describe('CoverageVerificationError', () => {
    const memberId = 'mem-12345';
    const planId = 'plan-12345';
    const details = { additionalInfo: 'Test details' };
    const cause = new Error('Original error');
    let error: CoverageVerificationError;

    beforeEach(() => {
      error = new CoverageVerificationError(memberId, planId, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have correct error code', () => {
      expect(error.code).toBe(PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED);
    });

    it('should include memberId and planId in the error message', () => {
      expect(error.message).toContain(memberId);
      expect(error.message).toContain(planId);
    });

    it('should include memberId and planId in the context metadata', () => {
      expect(error.context.metadata).toEqual({ memberId, planId });
    });

    it('should set the journey context to PLAN', () => {
      expect(error.context.journey).toBe(JourneyType.PLAN);
    });

    it('should set the operation context', () => {
      expect(error.context.operation).toBe('coverage-verification');
    });

    it('should set the component context', () => {
      expect(error.context.component).toBe('coverage-service');
    });

    it('should mark the error as transient', () => {
      expect(error.context.isTransient).toBe(true);
    });

    it('should include retry strategy', () => {
      expect(error.context.retryStrategy).toEqual({
        maxAttempts: 3,
        baseDelayMs: 500,
        useExponentialBackoff: true
      });
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the provided cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
          message: `Failed to verify coverage for member ${memberId} with plan ${planId}`,
          details,
          journey: JourneyType.PLAN,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should include detailed information in detailed JSON', () => {
      const detailedJson = error.toDetailedJSON();
      expect(detailedJson).toEqual({
        name: 'CoverageVerificationError',
        message: `Failed to verify coverage for member ${memberId} with plan ${planId}`,
        type: ErrorType.TECHNICAL,
        code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
        details,
        context: {
          journey: JourneyType.PLAN,
          operation: 'coverage-verification',
          component: 'coverage-service',
          isTransient: true,
          retryStrategy: {
            maxAttempts: 3,
            baseDelayMs: 500,
            useExponentialBackoff: true
          },
          metadata: { memberId, planId },
          timestamp: expect.any(String),
          stack: expect.any(String)
        },
        cause: {
          name: 'Error',
          message: 'Original error',
          stack: expect.any(String)
        }
      });
    });
  });

  describe('CoveragePersistenceError', () => {
    const operation = 'update' as const;
    const coverageId = 'cov-12345';
    const details = { additionalInfo: 'Test details' };
    const cause = new Error('Original error');
    let error: CoveragePersistenceError;

    beforeEach(() => {
      error = new CoveragePersistenceError(operation, coverageId, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have correct error code', () => {
      expect(error.code).toBe(PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED);
    });

    it('should include operation and coverageId in the error message', () => {
      expect(error.message).toContain(operation);
      expect(error.message).toContain(coverageId);
    });

    it('should include operation and coverageId in the context metadata', () => {
      expect(error.context.metadata).toEqual({ operation, coverageId });
    });

    it('should set the journey context to PLAN', () => {
      expect(error.context.journey).toBe(JourneyType.PLAN);
    });

    it('should set the operation context', () => {
      expect(error.context.operation).toBe(`${operation}-coverage`);
    });

    it('should set the component context', () => {
      expect(error.context.component).toBe('coverage-service');
    });

    it('should mark the error as transient', () => {
      expect(error.context.isTransient).toBe(true);
    });

    it('should include retry strategy', () => {
      expect(error.context.retryStrategy).toEqual({
        maxAttempts: 5,
        baseDelayMs: 200,
        useExponentialBackoff: true
      });
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the provided cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
          message: `Failed to ${operation} coverage ${coverageId} in database`,
          details,
          journey: JourneyType.PLAN,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should include detailed information in detailed JSON', () => {
      const detailedJson = error.toDetailedJSON();
      expect(detailedJson).toEqual({
        name: 'CoveragePersistenceError',
        message: `Failed to ${operation} coverage ${coverageId} in database`,
        type: ErrorType.TECHNICAL,
        code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
        details,
        context: {
          journey: JourneyType.PLAN,
          operation: `${operation}-coverage`,
          component: 'coverage-service',
          isTransient: true,
          retryStrategy: {
            maxAttempts: 5,
            baseDelayMs: 200,
            useExponentialBackoff: true
          },
          metadata: { operation, coverageId },
          timestamp: expect.any(String),
          stack: expect.any(String)
        },
        cause: {
          name: 'Error',
          message: 'Original error',
          stack: expect.any(String)
        }
      });
    });

    it('should handle missing coverageId', () => {
      const errorWithoutId = new CoveragePersistenceError('create');
      expect(errorWithoutId.message).toBe('Failed to create coverage record in database');
      expect(errorWithoutId.context.metadata).toEqual({ operation: 'create' });
    });
  });

  describe('CoverageApiIntegrationError', () => {
    const apiName = 'InsuranceAPI';
    const errorCode = 'API-500';
    const details = { additionalInfo: 'Test details' };
    const cause = new Error('Original error');
    let error: CoverageApiIntegrationError;

    beforeEach(() => {
      error = new CoverageApiIntegrationError(apiName, errorCode, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have correct error code', () => {
      expect(error.code).toBe(PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED);
    });

    it('should include apiName and errorCode in the error message', () => {
      expect(error.message).toContain(apiName);
      expect(error.message).toContain(errorCode);
    });

    it('should include apiName and errorCode in the context metadata', () => {
      expect(error.context.metadata).toEqual({ apiName, errorCode });
    });

    it('should set the journey context to PLAN', () => {
      expect(error.context.journey).toBe(JourneyType.PLAN);
    });

    it('should set the operation context', () => {
      expect(error.context.operation).toBe('external-coverage-verification');
    });

    it('should set the component context', () => {
      expect(error.context.component).toBe('coverage-service');
    });

    it('should mark the error as transient', () => {
      expect(error.context.isTransient).toBe(true);
    });

    it('should include retry strategy', () => {
      expect(error.context.retryStrategy).toEqual({
        maxAttempts: 3,
        baseDelayMs: 500,
        useExponentialBackoff: true
      });
    });

    it('should include the provided details', () => {
      expect(error.details).toEqual(details);
    });

    it('should include the provided cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
          message: `Failed to communicate with external coverage API ${apiName} (error code: ${errorCode})`,
          details,
          journey: JourneyType.PLAN,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should include detailed information in detailed JSON', () => {
      const detailedJson = error.toDetailedJSON();
      expect(detailedJson).toEqual({
        name: 'CoverageApiIntegrationError',
        message: `Failed to communicate with external coverage API ${apiName} (error code: ${errorCode})`,
        type: ErrorType.EXTERNAL,
        code: PLAN_ERROR_CODES.COVERAGE_VERIFICATION_FAILED,
        details,
        context: {
          journey: JourneyType.PLAN,
          operation: 'external-coverage-verification',
          component: 'coverage-service',
          isTransient: true,
          retryStrategy: {
            maxAttempts: 3,
            baseDelayMs: 500,
            useExponentialBackoff: true
          },
          metadata: { apiName, errorCode },
          timestamp: expect.any(String),
          stack: expect.any(String)
        },
        cause: {
          name: 'Error',
          message: 'Original error',
          stack: expect.any(String)
        }
      });
    });

    it('should handle missing errorCode', () => {
      const errorWithoutCode = new CoverageApiIntegrationError('InsuranceAPI');
      expect(errorWithoutCode.message).toBe('Failed to communicate with external coverage API InsuranceAPI');
      expect(errorWithoutCode.context.metadata).toEqual({ apiName: 'InsuranceAPI' });
    });
  });
});