/**
 * Base Error Test Fixtures
 * 
 * This file provides standard sample error instances for testing the base error functionality.
 * Contains pre-configured BaseError, ValidationError, BusinessError, TechnicalError, 
 * ExternalSystemError, and NotFoundError instances with consistent test properties to ensure 
 * predictable test scenarios.
 */

import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';
import { BaseError } from '../../src/base';
import { ValidationError } from '../../src/categories/validation.errors';
import { BusinessError } from '../../src/categories/business.errors';
import { TechnicalError } from '../../src/categories/technical.errors';
import { ExternalError } from '../../src/categories/external.errors';
import { NotFoundError } from '../../src/categories/not-found.errors';

// Import error codes from constants
import {
  VALIDATION_ERROR,
  BUSINESS_LOGIC_ERROR,
  TECHNICAL_ERROR,
  EXTERNAL_SYSTEM_ERROR,
  RESOURCE_NOT_FOUND,
  SYSTEM_ERROR,
} from '../../../shared/src/constants/error-codes.constants';

/**
 * Standard context for test errors
 */
const standardErrorContext = {
  requestId: 'test-request-123',
  timestamp: '2023-04-15T10:30:45Z',
  userId: 'test-user-456',
  sessionId: 'test-session-789',
  correlationId: 'test-correlation-abc',
};

/**
 * Base Error instance for testing the core error functionality
 */
export const baseError = new BaseError({
  message: 'Generic base error for testing',
  code: SYSTEM_ERROR,
  context: standardErrorContext,
});

/**
 * Validation Error instance for testing validation error handling
 */
export const validationError = new ValidationError({
  message: 'Invalid input data provided',
  code: VALIDATION_ERROR,
  context: {
    ...standardErrorContext,
    validationErrors: [
      { field: 'email', message: 'Must be a valid email address' },
      { field: 'password', message: 'Must be at least 8 characters long' },
    ],
    requestBody: {
      email: 'invalid-email',
      password: '123',
    },
  },
});

/**
 * Business Error instance for testing business logic error handling
 */
export const businessError = new BusinessError({
  message: 'Operation cannot be completed due to business rules',
  code: BUSINESS_LOGIC_ERROR,
  context: {
    ...standardErrorContext,
    operation: 'createSubscription',
    reason: 'User already has an active subscription',
    subscriptionId: 'sub-123',
    subscriptionStatus: 'active',
  },
});

/**
 * Technical Error instance for testing system error handling
 */
export const technicalError = new TechnicalError({
  message: 'An unexpected system error occurred',
  code: TECHNICAL_ERROR,
  context: {
    ...standardErrorContext,
    component: 'DatabaseService',
    operation: 'executeQuery',
    errorCode: 'DB_CONNECTION_FAILED',
  },
  cause: new Error('Connection refused to database host'),
});

/**
 * External System Error instance for testing external dependency error handling
 */
export const externalSystemError = new ExternalError({
  message: 'Failed to communicate with external service',
  code: EXTERNAL_SYSTEM_ERROR,
  context: {
    ...standardErrorContext,
    externalSystem: 'PaymentGateway',
    operation: 'processPayment',
    statusCode: 503,
    responseBody: { error: 'Service temporarily unavailable' },
  },
});

/**
 * Not Found Error instance for testing resource not found error handling
 */
export const notFoundError = new NotFoundError({
  message: 'The requested resource was not found',
  code: RESOURCE_NOT_FOUND,
  context: {
    ...standardErrorContext,
    resourceType: 'User',
    resourceId: 'missing-user-123',
    operation: 'getUserProfile',
  },
});

/**
 * Serialized versions of errors for testing response formatting
 */
export const serializedErrors = {
  /**
   * Serialized validation error
   */
  validation: {
    statusCode: HttpStatus.BAD_REQUEST,
    error: {
      type: ErrorType.VALIDATION,
      code: VALIDATION_ERROR,
      message: 'Invalid input data provided',
      details: {
        validationErrors: [
          { field: 'email', message: 'Must be a valid email address' },
          { field: 'password', message: 'Must be at least 8 characters long' },
        ],
      },
      context: {
        requestId: 'test-request-123',
        timestamp: '2023-04-15T10:30:45Z',
      },
    },
  },

  /**
   * Serialized business error
   */
  business: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    error: {
      type: ErrorType.BUSINESS,
      code: BUSINESS_LOGIC_ERROR,
      message: 'Operation cannot be completed due to business rules',
      details: {
        reason: 'User already has an active subscription',
      },
      context: {
        requestId: 'test-request-123',
        timestamp: '2023-04-15T10:30:45Z',
      },
    },
  },

  /**
   * Serialized technical error
   */
  technical: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: {
      type: ErrorType.TECHNICAL,
      code: TECHNICAL_ERROR,
      message: 'An unexpected system error occurred',
      context: {
        requestId: 'test-request-123',
        timestamp: '2023-04-15T10:30:45Z',
      },
    },
  },

  /**
   * Serialized external system error
   */
  external: {
    statusCode: HttpStatus.BAD_GATEWAY,
    error: {
      type: ErrorType.EXTERNAL,
      code: EXTERNAL_SYSTEM_ERROR,
      message: 'Failed to communicate with external service',
      details: {
        externalSystem: 'PaymentGateway',
        statusCode: 503,
      },
      context: {
        requestId: 'test-request-123',
        timestamp: '2023-04-15T10:30:45Z',
      },
    },
  },

  /**
   * Serialized not found error
   */
  notFound: {
    statusCode: HttpStatus.NOT_FOUND,
    error: {
      type: 'not_found',
      code: RESOURCE_NOT_FOUND,
      message: 'The requested resource was not found',
      details: {
        resourceType: 'User',
        resourceId: 'missing-user-123',
      },
      context: {
        requestId: 'test-request-123',
        timestamp: '2023-04-15T10:30:45Z',
      },
    },
  },
};

/**
 * Error factory functions for creating customized test errors
 */

/**
 * Creates a validation error with custom field errors
 * 
 * @param fieldErrors - Array of field validation errors
 * @param requestBody - The request body that failed validation
 * @returns A ValidationError instance with the specified errors
 */
export function createValidationError(
  fieldErrors: Array<{ field: string; message: string }>,
  requestBody: Record<string, any> = {}
): ValidationError {
  return new ValidationError({
    message: 'Validation failed for the provided input',
    code: VALIDATION_ERROR,
    context: {
      ...standardErrorContext,
      validationErrors: fieldErrors,
      requestBody,
    },
  });
}

/**
 * Creates a business error with custom reason and operation
 * 
 * @param reason - The business reason for the error
 * @param operation - The operation that failed
 * @param additionalContext - Any additional context to include
 * @returns A BusinessError instance with the specified details
 */
export function createBusinessError(
  reason: string,
  operation: string,
  additionalContext: Record<string, any> = {}
): BusinessError {
  return new BusinessError({
    message: `Operation ${operation} failed: ${reason}`,
    code: BUSINESS_LOGIC_ERROR,
    context: {
      ...standardErrorContext,
      operation,
      reason,
      ...additionalContext,
    },
  });
}

/**
 * Creates a technical error with custom component and operation
 * 
 * @param component - The system component that failed
 * @param operation - The operation that failed
 * @param cause - The underlying cause of the error
 * @returns A TechnicalError instance with the specified details
 */
export function createTechnicalError(
  component: string,
  operation: string,
  cause?: Error
): TechnicalError {
  return new TechnicalError({
    message: `A technical error occurred in ${component} during ${operation}`,
    code: TECHNICAL_ERROR,
    context: {
      ...standardErrorContext,
      component,
      operation,
    },
    cause,
  });
}

/**
 * Creates an external system error with custom external system details
 * 
 * @param externalSystem - The external system that failed
 * @param operation - The operation that failed
 * @param statusCode - The HTTP status code returned by the external system
 * @param responseBody - The response body from the external system
 * @returns An ExternalError instance with the specified details
 */
export function createExternalSystemError(
  externalSystem: string,
  operation: string,
  statusCode: number,
  responseBody: Record<string, any> = {}
): ExternalError {
  return new ExternalError({
    message: `Failed to communicate with ${externalSystem} during ${operation}`,
    code: EXTERNAL_SYSTEM_ERROR,
    context: {
      ...standardErrorContext,
      externalSystem,
      operation,
      statusCode,
      responseBody,
    },
  });
}

/**
 * Creates a not found error with custom resource details
 * 
 * @param resourceType - The type of resource that was not found
 * @param resourceId - The ID of the resource that was not found
 * @param operation - The operation that failed
 * @returns A NotFoundError instance with the specified details
 */
export function createNotFoundError(
  resourceType: string,
  resourceId: string,
  operation: string
): NotFoundError {
  return new NotFoundError({
    message: `The requested ${resourceType} with ID ${resourceId} was not found`,
    code: RESOURCE_NOT_FOUND,
    context: {
      ...standardErrorContext,
      resourceType,
      resourceId,
      operation,
    },
  });
}

/**
 * Error instances with different levels of context for testing context propagation
 */
export const errorContextLevels = {
  /**
   * Error with minimal context
   */
  minimal: new BaseError({
    message: 'Error with minimal context',
    code: SYSTEM_ERROR,
    context: {
      requestId: 'test-request-123',
    },
  }),

  /**
   * Error with request context only
   */
  request: new BaseError({
    message: 'Error with request context',
    code: SYSTEM_ERROR,
    context: {
      requestId: 'test-request-123',
      timestamp: '2023-04-15T10:30:45Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      path: '/api/test',
      method: 'GET',
    },
  }),

  /**
   * Error with request and user context
   */
  user: new BaseError({
    message: 'Error with user context',
    code: SYSTEM_ERROR,
    context: {
      requestId: 'test-request-123',
      timestamp: '2023-04-15T10:30:45Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      path: '/api/test',
      method: 'GET',
      userId: 'test-user-456',
      email: 'test@example.com',
      roles: ['user'],
    },
  }),

  /**
   * Error with full context including journey information
   */
  full: new BaseError({
    message: 'Error with full context',
    code: SYSTEM_ERROR,
    context: {
      requestId: 'test-request-123',
      timestamp: '2023-04-15T10:30:45Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      path: '/api/test',
      method: 'GET',
      userId: 'test-user-456',
      email: 'test@example.com',
      roles: ['user'],
      journey: 'health',
      feature: 'metrics',
      operation: 'recordMetric',
      correlationId: 'test-correlation-abc',
      traceId: 'test-trace-xyz',
    },
  }),
};

/**
 * Combined export of all base errors
 */
export const baseErrors = {
  baseError,
  validationError,
  businessError,
  technicalError,
  externalSystemError,
  notFoundError,
};

export default baseErrors;