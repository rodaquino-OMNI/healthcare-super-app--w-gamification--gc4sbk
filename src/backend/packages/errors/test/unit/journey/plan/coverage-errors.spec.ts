import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../src/base';
import {
  CoverageNotFoundError,
  ServiceNotCoveredError,
  OutOfNetworkError,
  CoverageVerificationError,
  CoveragePersistenceError,
  CoverageApiIntegrationError
} from '../../../../../../src/journey/plan/coverage-errors';
import {
  PLAN_COVER_BUSINESS_ERRORS,
  PLAN_COVER_TECHNICAL_ERRORS,
  PLAN_COVER_EXTERNAL_ERRORS
} from '../../../../../../src/journey/plan/error-codes';
import { PlanErrorType, CoverageErrorCategory } from '../../../../../../src/journey/plan/types';

describe('Plan Journey Coverage Errors', () => {
  describe('CoverageNotFoundError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const coverageId = 'cov-123';
      const error = new CoverageNotFoundError(coverageId);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(PLAN_COVER_BUSINESS_ERRORS.COVERAGE_NOT_FOUND);
      expect(error.message).toBe(`Coverage with ID ${coverageId} not found`);
      expect(error.details).toHaveProperty('coverageId', coverageId);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
      expect(error.details).toHaveProperty('errorCategory', CoverageErrorCategory.NOT_FOUND);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const coverageId = 'cov-123';
      const customMessage = 'Custom coverage not found message';
      const context = { userId: 'user-456' };
      const error = new CoverageNotFoundError(coverageId, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('coverageId', coverageId);
      expect(error.details).toHaveProperty('userId', 'user-456');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new CoverageNotFoundError('cov-123');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const coverageId = 'cov-123';
      const error = new CoverageNotFoundError(coverageId);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', PLAN_COVER_BUSINESS_ERRORS.COVERAGE_NOT_FOUND);
      expect(json.error).toHaveProperty('message', `Coverage with ID ${coverageId} not found`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('coverageId', coverageId);
      expect(json.error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
    });
  });

  describe('ServiceNotCoveredError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const serviceCode = 'SVC001';
      const planId = 'plan-456';
      const error = new ServiceNotCoveredError(serviceCode, planId);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(PLAN_COVER_BUSINESS_ERRORS.SERVICE_NOT_COVERED);
      expect(error.message).toBe(`Service ${serviceCode} is not covered by plan ${planId}`);
      expect(error.details).toHaveProperty('planId', planId);
      expect(error.details).toHaveProperty('procedureCode', serviceCode);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
      expect(error.details).toHaveProperty('errorCategory', CoverageErrorCategory.NOT_COVERED);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const serviceCode = 'SVC001';
      const planId = 'plan-456';
      const customMessage = 'Custom service not covered message';
      const context = { serviceName: 'Dental Cleaning' };
      const error = new ServiceNotCoveredError(serviceCode, planId, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('planId', planId);
      expect(error.details).toHaveProperty('procedureCode', serviceCode);
      expect(error.details).toHaveProperty('serviceName', 'Dental Cleaning');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new ServiceNotCoveredError('SVC001', 'plan-456');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const serviceCode = 'SVC001';
      const planId = 'plan-456';
      const error = new ServiceNotCoveredError(serviceCode, planId);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', PLAN_COVER_BUSINESS_ERRORS.SERVICE_NOT_COVERED);
      expect(json.error).toHaveProperty('message', `Service ${serviceCode} is not covered by plan ${planId}`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('planId', planId);
      expect(json.error.details).toHaveProperty('procedureCode', serviceCode);
    });
  });

  describe('OutOfNetworkError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const providerId = 'prov-789';
      const planId = 'plan-456';
      const error = new OutOfNetworkError(providerId, planId);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(PLAN_COVER_BUSINESS_ERRORS.OUT_OF_NETWORK);
      expect(error.message).toBe(`Provider ${providerId} is out of network for plan ${planId}`);
      expect(error.details).toHaveProperty('planId', planId);
      expect(error.details).toHaveProperty('providerId', providerId);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
      expect(error.details).toHaveProperty('errorCategory', CoverageErrorCategory.NOT_COVERED);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const providerId = 'prov-789';
      const planId = 'plan-456';
      const customMessage = 'Custom out of network message';
      const context = { providerName: 'Dr. Smith Clinic' };
      const error = new OutOfNetworkError(providerId, planId, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('planId', planId);
      expect(error.details).toHaveProperty('providerId', providerId);
      expect(error.details).toHaveProperty('providerName', 'Dr. Smith Clinic');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new OutOfNetworkError('prov-789', 'plan-456');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const providerId = 'prov-789';
      const planId = 'plan-456';
      const error = new OutOfNetworkError(providerId, planId);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', PLAN_COVER_BUSINESS_ERRORS.OUT_OF_NETWORK);
      expect(json.error).toHaveProperty('message', `Provider ${providerId} is out of network for plan ${planId}`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('planId', planId);
      expect(json.error.details).toHaveProperty('providerId', providerId);
    });
  });

  describe('CoverageVerificationError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const coverageId = 'cov-123';
      const reason = 'Coverage expired';
      const error = new CoverageVerificationError(coverageId, reason);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(PLAN_COVER_BUSINESS_ERRORS.VERIFICATION_FAILED);
      expect(error.message).toBe(`Coverage verification failed for ID ${coverageId}: ${reason}`);
      expect(error.details).toHaveProperty('coverageId', coverageId);
      expect(error.details).toHaveProperty('reason', reason);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
      expect(error.details).toHaveProperty('errorCategory', CoverageErrorCategory.NOT_COVERED);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const coverageId = 'cov-123';
      const reason = 'Coverage expired';
      const customMessage = 'Custom verification error message';
      const context = { verificationDate: '2023-05-15' };
      const error = new CoverageVerificationError(coverageId, reason, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('coverageId', coverageId);
      expect(error.details).toHaveProperty('reason', reason);
      expect(error.details).toHaveProperty('verificationDate', '2023-05-15');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new CoverageVerificationError('cov-123', 'Coverage expired');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const coverageId = 'cov-123';
      const reason = 'Coverage expired';
      const error = new CoverageVerificationError(coverageId, reason);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', PLAN_COVER_BUSINESS_ERRORS.VERIFICATION_FAILED);
      expect(json.error).toHaveProperty('message', `Coverage verification failed for ID ${coverageId}: ${reason}`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('coverageId', coverageId);
      expect(json.error.details).toHaveProperty('reason', reason);
    });
  });

  describe('CoveragePersistenceError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const operation = 'create';
      const coverageId = 'cov-123';
      const error = new CoveragePersistenceError(operation, coverageId);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(PLAN_COVER_TECHNICAL_ERRORS.DATABASE_RETRIEVAL_ERROR);
      expect(error.message).toBe(`Database operation '${operation}' failed for coverage ID ${coverageId}`);
      expect(error.details).toHaveProperty('coverageId', coverageId);
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
      expect(error.details).toHaveProperty('errorCategory', 'persistence_error');
    });

    it('should handle missing coverageId', () => {
      // Arrange & Act
      const operation = 'create';
      const error = new CoveragePersistenceError(operation);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(PLAN_COVER_TECHNICAL_ERRORS.DATABASE_RETRIEVAL_ERROR);
      expect(error.message).toBe(`Database operation '${operation}' failed`);
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const operation = 'create';
      const coverageId = 'cov-123';
      const customMessage = 'Custom persistence error message';
      const context = { databaseName: 'coverage_db' };
      const error = new CoveragePersistenceError(operation, coverageId, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('coverageId', coverageId);
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('databaseName', 'coverage_db');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new CoveragePersistenceError('create', 'cov-123');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR); // 500 for TECHNICAL errors
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const operation = 'create';
      const coverageId = 'cov-123';
      const error = new CoveragePersistenceError(operation, coverageId);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(json.error).toHaveProperty('code', PLAN_COVER_TECHNICAL_ERRORS.DATABASE_RETRIEVAL_ERROR);
      expect(json.error).toHaveProperty('message', `Database operation '${operation}' failed for coverage ID ${coverageId}`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('coverageId', coverageId);
      expect(json.error.details).toHaveProperty('operation', operation);
    });
  });

  describe('CoverageApiIntegrationError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const apiName = 'InsuranceAPI';
      const operation = 'verifyCoverage';
      const error = new CoverageApiIntegrationError(apiName, operation);

      // Assert
      expect(error).toBeDefined();
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(PLAN_COVER_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR);
      expect(error.message).toBe(`External API '${apiName}' failed during operation '${operation}'`);
      expect(error.details).toHaveProperty('apiName', apiName);
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('errorType', PlanErrorType.COVERAGE);
      expect(error.details).toHaveProperty('errorCategory', 'external_api_error');
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const apiName = 'InsuranceAPI';
      const operation = 'verifyCoverage';
      const customMessage = 'Custom API integration error message';
      const context = { statusCode: 503, retryAfter: 30 };
      const error = new CoverageApiIntegrationError(apiName, operation, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('apiName', apiName);
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('statusCode', 503);
      expect(error.details).toHaveProperty('retryAfter', 30);
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new CoverageApiIntegrationError('InsuranceAPI', 'verifyCoverage');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY); // 502 for EXTERNAL errors
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const apiName = 'InsuranceAPI';
      const operation = 'verifyCoverage';
      const error = new CoverageApiIntegrationError(apiName, operation);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(json.error).toHaveProperty('code', PLAN_COVER_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR);
      expect(json.error).toHaveProperty('message', `External API '${apiName}' failed during operation '${operation}'`);
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('apiName', apiName);
      expect(json.error.details).toHaveProperty('operation', operation);
    });
  });

  describe('Coverage namespace', () => {
    it('should export all coverage error classes', () => {
      // Import the Coverage namespace
      const { Coverage } = require('../../../../../../src/journey/plan/coverage-errors');

      // Assert that all error classes are exported
      expect(Coverage.CoverageNotFoundError).toBeDefined();
      expect(Coverage.ServiceNotCoveredError).toBeDefined();
      expect(Coverage.OutOfNetworkError).toBeDefined();
      expect(Coverage.CoverageVerificationError).toBeDefined();
      expect(Coverage.CoveragePersistenceError).toBeDefined();
      expect(Coverage.CoverageApiIntegrationError).toBeDefined();
    });
  });
});