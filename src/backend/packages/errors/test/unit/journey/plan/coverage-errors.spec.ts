import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the BaseError class and related types
import { BaseError, ErrorType } from '../../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';

// Import the coverage-specific error classes
import {
  CoverageNotFoundError,
  ServiceNotCoveredError,
  OutOfNetworkError,
  CoverageVerificationError,
  CoveragePersistenceError,
  CoverageApiIntegrationError
} from '../../../../src/journey/plan/coverage-errors';

/**
 * Test suite for Plan journey's coverage-specific error classes
 * Verifies error inheritance, classification, HTTP status code mapping, and context handling
 */
describe('Plan Journey Coverage Errors', () => {
  // Common test data
  const coverageId = 'coverage-123';
  const userId = 'user-456';
  const planId = 'plan-789';
  const providerId = 'provider-101';
  const serviceCode = 'service-202';
  
  describe('CoverageNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new CoverageNotFoundError(coverageId);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new CoverageNotFoundError(coverageId);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include coverage ID in error details', () => {
      const error = new CoverageNotFoundError(coverageId);
      expect(error.details).toBeDefined();
      expect(error.details.coverageId).toBe(coverageId);
    });

    it('should map to correct HTTP status code', () => {
      const error = new CoverageNotFoundError(coverageId);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should serialize with proper context', () => {
      const error = new CoverageNotFoundError(coverageId, {
        userId,
        planId
      });

      const json = error.toJSON();
      expect(json.error.details.coverageId).toBe(coverageId);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
    });
  });

  describe('ServiceNotCoveredError', () => {
    it('should extend BaseError', () => {
      const error = new ServiceNotCoveredError(coverageId, serviceCode);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new ServiceNotCoveredError(coverageId, serviceCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include coverage and service details in error details', () => {
      const error = new ServiceNotCoveredError(coverageId, serviceCode);
      expect(error.details).toBeDefined();
      expect(error.details.coverageId).toBe(coverageId);
      expect(error.details.serviceCode).toBe(serviceCode);
    });

    it('should map to correct HTTP status code', () => {
      const error = new ServiceNotCoveredError(coverageId, serviceCode);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should serialize with proper context', () => {
      const error = new ServiceNotCoveredError(coverageId, serviceCode, {
        userId,
        planId,
        serviceName: 'Specialized Consultation'
      });

      const json = error.toJSON();
      expect(json.error.details.coverageId).toBe(coverageId);
      expect(json.error.details.serviceCode).toBe(serviceCode);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
      expect(json.error.context.serviceName).toBe('Specialized Consultation');
    });
  });

  describe('OutOfNetworkError', () => {
    it('should extend BaseError', () => {
      const error = new OutOfNetworkError(coverageId, providerId);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new OutOfNetworkError(coverageId, providerId);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include coverage and provider details in error details', () => {
      const error = new OutOfNetworkError(coverageId, providerId);
      expect(error.details).toBeDefined();
      expect(error.details.coverageId).toBe(coverageId);
      expect(error.details.providerId).toBe(providerId);
    });

    it('should map to correct HTTP status code', () => {
      const error = new OutOfNetworkError(coverageId, providerId);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should serialize with proper context', () => {
      const error = new OutOfNetworkError(coverageId, providerId, {
        userId,
        planId,
        providerName: 'Dr. Smith Clinic',
        networkName: 'Premium Provider Network'
      });

      const json = error.toJSON();
      expect(json.error.details.coverageId).toBe(coverageId);
      expect(json.error.details.providerId).toBe(providerId);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
      expect(json.error.context.providerName).toBe('Dr. Smith Clinic');
      expect(json.error.context.networkName).toBe('Premium Provider Network');
    });
  });

  describe('CoverageVerificationError', () => {
    const verificationSystem = 'insurance-verification-api';
    const originalError = new Error('Verification system unavailable');

    it('should extend BaseError', () => {
      const error = new CoverageVerificationError(coverageId, verificationSystem, originalError);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have EXTERNAL error type', () => {
      const error = new CoverageVerificationError(coverageId, verificationSystem, originalError);
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include verification details in error details', () => {
      const error = new CoverageVerificationError(coverageId, verificationSystem, originalError);
      expect(error.details).toBeDefined();
      expect(error.details.coverageId).toBe(coverageId);
      expect(error.details.verificationSystem).toBe(verificationSystem);
    });

    it('should preserve original error as cause', () => {
      const error = new CoverageVerificationError(coverageId, verificationSystem, originalError);
      expect(error.cause).toBe(originalError);
    });

    it('should map to correct HTTP status code', () => {
      const error = new CoverageVerificationError(coverageId, verificationSystem, originalError);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
    });

    it('should serialize with proper context', () => {
      const error = new CoverageVerificationError(coverageId, verificationSystem, originalError, {
        userId,
        planId,
        serviceCode,
        verificationAttempt: 2
      });

      const json = error.toJSON();
      expect(json.error.details.coverageId).toBe(coverageId);
      expect(json.error.details.verificationSystem).toBe(verificationSystem);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
      expect(json.error.context.serviceCode).toBe(serviceCode);
      expect(json.error.context.verificationAttempt).toBe(2);
    });
  });

  describe('CoveragePersistenceError', () => {
    const originalError = new Error('Database connection failed');

    it('should extend BaseError', () => {
      const error = new CoveragePersistenceError(coverageId, originalError);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have TECHNICAL error type', () => {
      const error = new CoveragePersistenceError(coverageId, originalError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include coverage ID in error details', () => {
      const error = new CoveragePersistenceError(coverageId, originalError);
      expect(error.details).toBeDefined();
      expect(error.details.coverageId).toBe(coverageId);
    });

    it('should preserve original error as cause', () => {
      const error = new CoveragePersistenceError(coverageId, originalError);
      expect(error.cause).toBe(originalError);
    });

    it('should map to correct HTTP status code', () => {
      const error = new CoveragePersistenceError(coverageId, originalError);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should serialize with proper context', () => {
      const error = new CoveragePersistenceError(coverageId, originalError, {
        userId,
        planId,
        operation: 'update',
        databaseInstance: 'plan-service-db'
      });

      const json = error.toJSON();
      expect(json.error.details.coverageId).toBe(coverageId);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
      expect(json.error.context.operation).toBe('update');
      expect(json.error.context.databaseInstance).toBe('plan-service-db');
    });
  });

  describe('CoverageApiIntegrationError', () => {
    const apiSystem = 'insurance-provider-api';
    const originalError = new Error('API request failed');

    it('should extend BaseError', () => {
      const error = new CoverageApiIntegrationError(coverageId, apiSystem, originalError);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have EXTERNAL error type', () => {
      const error = new CoverageApiIntegrationError(coverageId, apiSystem, originalError);
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include API system details in error details', () => {
      const error = new CoverageApiIntegrationError(coverageId, apiSystem, originalError);
      expect(error.details).toBeDefined();
      expect(error.details.coverageId).toBe(coverageId);
      expect(error.details.apiSystem).toBe(apiSystem);
    });

    it('should preserve original error as cause', () => {
      const error = new CoverageApiIntegrationError(coverageId, apiSystem, originalError);
      expect(error.cause).toBe(originalError);
    });

    it('should map to correct HTTP status code', () => {
      const error = new CoverageApiIntegrationError(coverageId, apiSystem, originalError);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
    });

    it('should serialize with proper context', () => {
      const error = new CoverageApiIntegrationError(coverageId, apiSystem, originalError, {
        userId,
        planId,
        endpoint: '/api/coverage/verify',
        requestId: 'req-abc-123',
        statusCode: 503
      });

      const json = error.toJSON();
      expect(json.error.details.coverageId).toBe(coverageId);
      expect(json.error.details.apiSystem).toBe(apiSystem);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
      expect(json.error.context.endpoint).toBe('/api/coverage/verify');
      expect(json.error.context.requestId).toBe('req-abc-123');
      expect(json.error.context.statusCode).toBe(503);
    });
  });

  describe('Error Integration', () => {
    it('should support error chaining for coverage verification workflow', () => {
      // Simulate a chain of errors in coverage verification
      const apiError = new Error('API timeout');
      const coverageApiError = new CoverageApiIntegrationError('coverage-123', 'insurance-api', apiError, {
        endpoint: '/api/coverage/verify',
        statusCode: 504
      });
      
      const verificationError = new CoverageVerificationError(
        'coverage-123',
        'verification-service',
        coverageApiError,
        { verificationAttempt: 3 }
      );

      // Verify error chain
      expect(verificationError.cause).toBe(coverageApiError);
      expect(coverageApiError.cause).toBe(apiError);
      
      // Verify root cause extraction
      expect(verificationError.getRootCause()).toBe(apiError);
      
      // Verify error chain formatting
      const chainString = verificationError.formatErrorChain();
      expect(chainString).toContain('verification-service');
      expect(chainString).toContain('insurance-api');
      expect(chainString).toContain('API timeout');
    });

    it('should support context propagation through error chain', () => {
      // Create a chain of errors with context
      const apiError = new CoverageApiIntegrationError(
        'coverage-123',
        'insurance-api',
        new Error('API error'),
        { requestId: 'req-123', planId: 'plan-456' }
      );
      
      const verificationError = new CoverageVerificationError(
        'coverage-123',
        'verification-service',
        apiError,
        { userId: 'user-789', serviceCode: 'service-101' }
      );

      // Context from both errors should be merged
      expect(verificationError.context.requestId).toBe('req-123');
      expect(verificationError.context.planId).toBe('plan-456');
      expect(verificationError.context.userId).toBe('user-789');
      expect(verificationError.context.serviceCode).toBe('service-101');
    });

    it('should handle complex coverage verification scenarios', () => {
      // First, try to verify coverage with external API
      const apiError = new CoverageApiIntegrationError(
        'coverage-123',
        'insurance-api',
        new Error('API unavailable'),
        { endpoint: '/api/coverage/verify' }
      );
      
      // Then, determine the service is not covered
      const serviceNotCoveredError = new ServiceNotCoveredError(
        'coverage-123',
        'service-202',
        { cause: apiError, serviceName: 'Specialized Consultation' }
      );

      // Verify error details
      expect(serviceNotCoveredError.details.serviceCode).toBe('service-202');
      expect(serviceNotCoveredError.context.serviceName).toBe('Specialized Consultation');
      
      // Verify cause chain
      expect(serviceNotCoveredError.cause).toBe(apiError);
      expect(serviceNotCoveredError.getRootCause().message).toBe('API unavailable');
    });
  });
});