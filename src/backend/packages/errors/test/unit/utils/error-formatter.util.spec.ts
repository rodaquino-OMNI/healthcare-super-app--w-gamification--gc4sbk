import { formatError, formatErrorWithContext, ErrorFormatterOptions } from '../../../src/utils/format';
import { BaseError } from '../../../src/base';
import { ErrorType } from '../../../src/constants';
import { BusinessRuleViolationError } from '../../../src/categories/business.errors';
import { DatabaseError } from '../../../src/categories/technical.errors';
import { InvalidParameterError } from '../../../src/categories/validation.errors';
import { ExternalApiError } from '../../../src/categories/external.errors';
import { HealthJourneyError } from '../../../src/journey/health';
import { CareJourneyError } from '../../../src/journey/care';
import { PlanJourneyError } from '../../../src/journey/plan';

// Mock the environment
const originalNodeEnv = process.env.NODE_ENV;

// Mock i18n service
jest.mock('../../../src/utils/i18n', () => ({
  translate: jest.fn((key, params) => {
    if (key === 'errors.business.resource_not_found') {
      return `Resource ${params.resource} not found`;
    }
    if (key === 'errors.validation.invalid_parameter') {
      return `Invalid parameter: ${params.param}`;
    }
    if (key === 'errors.technical.database') {
      return 'A database error occurred';
    }
    if (key === 'errors.external.api') {
      return `External API error: ${params.service}`;
    }
    if (key === 'errors.journey.health.metric_invalid') {
      return `Invalid health metric: ${params.metric}`;
    }
    if (key === 'errors.journey.care.appointment_unavailable') {
      return `Appointment unavailable at ${params.time}`;
    }
    if (key === 'errors.journey.plan.benefit_not_covered') {
      return `Benefit ${params.benefit} not covered in your plan`;
    }
    return key;
  }),
}));

describe('Error Formatter Utility', () => {
  // Reset environment after each test
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('formatError', () => {
    it('should format a standard Error with consistent structure', () => {
      // Arrange
      const error = new Error('Something went wrong');
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Something went wrong');
      expect(formatted).toHaveProperty('code', 'INTERNAL_ERROR');
      expect(formatted).toHaveProperty('timestamp');
      expect(formatted).toHaveProperty('path');
      expect(formatted).toHaveProperty('statusCode', 500);
    });

    it('should format a BaseError with proper error code and status', () => {
      // Arrange
      const error = new BaseError('Base error message', {
        code: 'TEST_ERROR',
        type: ErrorType.BUSINESS,
        statusCode: 400
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Base error message');
      expect(formatted).toHaveProperty('code', 'TEST_ERROR');
      expect(formatted).toHaveProperty('statusCode', 400);
      expect(formatted).toHaveProperty('type', ErrorType.BUSINESS);
    });

    it('should include stack trace in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Development error');
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('stack');
      expect(formatted.stack).toContain('Error: Development error');
    });

    it('should exclude stack trace in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).not.toHaveProperty('stack');
    });

    it('should include cause chain in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const rootCause = new Error('Root cause');
      const intermediateError = new Error('Intermediate error', { cause: rootCause });
      const error = new Error('Top level error', { cause: intermediateError });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('cause');
      expect(formatted.cause).toHaveProperty('message', 'Intermediate error');
      expect(formatted.cause).toHaveProperty('cause');
      expect(formatted.cause.cause).toHaveProperty('message', 'Root cause');
    });

    it('should exclude cause chain in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const rootCause = new Error('Root cause');
      const error = new Error('Top level error', { cause: rootCause });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).not.toHaveProperty('cause');
    });

    it('should include metadata in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new BaseError('Error with metadata', {
        code: 'META_ERROR',
        type: ErrorType.BUSINESS,
        metadata: {
          userId: '12345',
          requestId: 'req-abc-123',
          timestamp: new Date().toISOString()
        }
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('metadata');
      expect(formatted.metadata).toHaveProperty('userId', '12345');
      expect(formatted.metadata).toHaveProperty('requestId', 'req-abc-123');
    });

    it('should exclude sensitive metadata in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new BaseError('Error with sensitive metadata', {
        code: 'META_ERROR',
        type: ErrorType.BUSINESS,
        metadata: {
          userId: '12345',  // Should be excluded in production
          requestId: 'req-abc-123',  // Should be included in production
          password: 'secret',  // Should be excluded in production
          email: 'user@example.com'  // Should be excluded in production
        }
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('metadata');
      expect(formatted.metadata).not.toHaveProperty('userId');
      expect(formatted.metadata).toHaveProperty('requestId', 'req-abc-123');
      expect(formatted.metadata).not.toHaveProperty('password');
      expect(formatted.metadata).not.toHaveProperty('email');
    });
  });

  describe('formatErrorWithContext', () => {
    it('should include journey context when available', () => {
      // Arrange
      const error = new HealthJourneyError('Health metric validation failed', {
        code: 'HEALTH_METRIC_INVALID',
        params: { metric: 'blood_pressure' }
      });
      
      // Act
      const formatted = formatErrorWithContext(error, { journey: 'health' });
      
      // Assert
      expect(formatted).toHaveProperty('journey', 'health');
      expect(formatted).toHaveProperty('message', 'Invalid health metric: blood_pressure');
      expect(formatted).toHaveProperty('code', 'HEALTH_METRIC_INVALID');
    });

    it('should include request context when available', () => {
      // Arrange
      const error = new BusinessRuleViolationError('Business rule violated');
      const context = {
        request: {
          url: '/api/health/metrics',
          method: 'POST',
          id: 'req-123'
        }
      };
      
      // Act
      const formatted = formatErrorWithContext(error, context);
      
      // Assert
      expect(formatted).toHaveProperty('request');
      expect(formatted.request).toHaveProperty('url', '/api/health/metrics');
      expect(formatted.request).toHaveProperty('method', 'POST');
      expect(formatted.request).toHaveProperty('id', 'req-123');
    });

    it('should include user context when available', () => {
      // Arrange
      const error = new BusinessRuleViolationError('Permission denied');
      const context = {
        user: {
          id: 'user-123',
          roles: ['patient']
        }
      };
      
      // Act
      const formatted = formatErrorWithContext(error, context);
      
      // Assert
      expect(formatted).toHaveProperty('user');
      expect(formatted.user).toHaveProperty('id', 'user-123');
      expect(formatted.user).toHaveProperty('roles');
      expect(formatted.user.roles).toContain('patient');
    });

    it('should sanitize user context in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new BusinessRuleViolationError('Permission denied');
      const context = {
        user: {
          id: 'user-123',
          email: 'user@example.com',  // Should be excluded in production
          roles: ['patient']
        }
      };
      
      // Act
      const formatted = formatErrorWithContext(error, context);
      
      // Assert
      expect(formatted).toHaveProperty('user');
      expect(formatted.user).toHaveProperty('id', 'user-123');
      expect(formatted.user).not.toHaveProperty('email');
      expect(formatted.user).toHaveProperty('roles');
    });
  });

  describe('Error Type Specific Formatting', () => {
    it('should format business errors with user-friendly messages', () => {
      // Arrange
      const error = new BusinessRuleViolationError('Resource not found', {
        params: { resource: 'appointment' }
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Resource appointment not found');
      expect(formatted).toHaveProperty('type', ErrorType.BUSINESS);
      expect(formatted).toHaveProperty('statusCode', 400);
    });

    it('should format validation errors with field information', () => {
      // Arrange
      const error = new InvalidParameterError('date', 'Invalid date format', {
        params: { param: 'date' }
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Invalid parameter: date');
      expect(formatted).toHaveProperty('type', ErrorType.VALIDATION);
      expect(formatted).toHaveProperty('statusCode', 400);
      expect(formatted).toHaveProperty('field', 'date');
    });

    it('should format technical errors with appropriate level of detail', () => {
      // Arrange
      const dbError = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed');
      const error = new DatabaseError('Database constraint violation', {
        cause: dbError,
        operation: 'INSERT'
      });
      
      // Act
      process.env.NODE_ENV = 'production';
      const productionFormatted = formatError(error);
      
      process.env.NODE_ENV = 'development';
      const developmentFormatted = formatError(error);
      
      // Assert
      expect(productionFormatted).toHaveProperty('message', 'A database error occurred');
      expect(productionFormatted).not.toHaveProperty('cause');
      
      expect(developmentFormatted).toHaveProperty('message', 'A database error occurred');
      expect(developmentFormatted).toHaveProperty('cause');
      expect(developmentFormatted).toHaveProperty('metadata');
      expect(developmentFormatted.metadata).toHaveProperty('operation', 'INSERT');
    });

    it('should format external errors with service information', () => {
      // Arrange
      const error = new ExternalApiError('Failed to fetch data from payment service', {
        service: 'payment-api',
        statusCode: 503,
        params: { service: 'payment-api' }
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'External API error: payment-api');
      expect(formatted).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(formatted).toHaveProperty('statusCode', 503);
      expect(formatted).toHaveProperty('service', 'payment-api');
    });
  });

  describe('Journey-Specific Error Formatting', () => {
    it('should format Health journey errors with appropriate context', () => {
      // Arrange
      const error = new HealthJourneyError('Invalid health metric value', {
        code: 'HEALTH_METRIC_INVALID',
        params: { metric: 'heart_rate' }
      });
      
      // Act
      const formatted = formatErrorWithContext(error, { journey: 'health' });
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Invalid health metric: heart_rate');
      expect(formatted).toHaveProperty('journey', 'health');
      expect(formatted).toHaveProperty('code', 'HEALTH_METRIC_INVALID');
    });

    it('should format Care journey errors with appropriate context', () => {
      // Arrange
      const error = new CareJourneyError('Appointment slot not available', {
        code: 'CARE_APPOINTMENT_UNAVAILABLE',
        params: { time: '2023-05-15T14:30:00Z' }
      });
      
      // Act
      const formatted = formatErrorWithContext(error, { journey: 'care' });
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Appointment unavailable at 2023-05-15T14:30:00Z');
      expect(formatted).toHaveProperty('journey', 'care');
      expect(formatted).toHaveProperty('code', 'CARE_APPOINTMENT_UNAVAILABLE');
    });

    it('should format Plan journey errors with appropriate context', () => {
      // Arrange
      const error = new PlanJourneyError('Benefit not covered by plan', {
        code: 'PLAN_BENEFIT_NOT_COVERED',
        params: { benefit: 'dental' }
      });
      
      // Act
      const formatted = formatErrorWithContext(error, { journey: 'plan' });
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Benefit dental not covered in your plan');
      expect(formatted).toHaveProperty('journey', 'plan');
      expect(formatted).toHaveProperty('code', 'PLAN_BENEFIT_NOT_COVERED');
    });
  });

  describe('Internationalization Support', () => {
    it('should translate error messages based on provided locale', () => {
      // Arrange
      const error = new BusinessRuleViolationError('Resource not found', {
        params: { resource: 'appointment' }
      });
      const options: ErrorFormatterOptions = {
        locale: 'pt-BR'
      };
      
      // Mock the translate function to handle locale
      const i18n = require('../../../src/utils/i18n');
      i18n.translate.mockImplementationOnce((key, params, locale) => {
        if (key === 'errors.business.resource_not_found' && locale === 'pt-BR') {
          return `Recurso ${params.resource} não encontrado`;
        }
        return `Resource ${params.resource} not found`;
      });
      
      // Act
      const formatted = formatError(error, options);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Recurso appointment não encontrado');
      expect(i18n.translate).toHaveBeenCalledWith(
        'errors.business.resource_not_found',
        { resource: 'appointment' },
        'pt-BR'
      );
    });

    it('should fall back to default locale when translation is not available', () => {
      // Arrange
      const error = new BusinessRuleViolationError('Resource not found', {
        params: { resource: 'appointment' }
      });
      const options: ErrorFormatterOptions = {
        locale: 'fr-FR'  // Unsupported locale
      };
      
      // Mock the translate function to handle locale fallback
      const i18n = require('../../../src/utils/i18n');
      i18n.translate.mockImplementationOnce((key, params, locale) => {
        // Simulate missing translation for fr-FR
        if (locale === 'fr-FR') {
          // Fall back to default locale
          return `Resource ${params.resource} not found`;
        }
        return `Resource ${params.resource} not found`;
      });
      
      // Act
      const formatted = formatError(error, options);
      
      // Assert
      expect(formatted).toHaveProperty('message', 'Resource appointment not found');
    });
  });

  describe('Error Code Mapping', () => {
    it('should map internal error codes to standardized API error codes', () => {
      // Arrange
      const error = new BaseError('Custom error with internal code', {
        code: 'INTERNAL_DB_CONSTRAINT_VIOLATION',
        type: ErrorType.TECHNICAL,
        apiErrorCode: 'DATABASE_ERROR'
      });
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('code', 'DATABASE_ERROR');
      expect(formatted).toHaveProperty('internalCode', 'INTERNAL_DB_CONSTRAINT_VIOLATION');
    });

    it('should generate consistent error codes for standard errors', () => {
      // Arrange
      const error = new Error('Standard JavaScript error');
      
      // Act
      const formatted = formatError(error);
      
      // Assert
      expect(formatted).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });
});