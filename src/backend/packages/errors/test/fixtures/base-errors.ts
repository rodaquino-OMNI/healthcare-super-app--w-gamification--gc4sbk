/**
 * @file base-errors.ts
 * @description Test fixtures for base error functionality
 * 
 * This file provides standard sample error instances for testing the base error
 * functionality. It contains pre-configured BaseError, ValidationError, BusinessError,
 * TechnicalError, ExternalSystemError, and NotFoundError instances with consistent
 * test properties to ensure predictable test scenarios.
 */

import { HttpStatus } from '@nestjs/common';
import { 
  BaseError, 
  ErrorType, 
  JourneyType,
  ErrorContext 
} from '../../src/base';
import { 
  ValidationError, 
  MissingParameterError, 
  InvalidParameterError,
  SchemaValidationError,
  FieldValidationError
} from '../../src/categories/validation.errors';
import { 
  BusinessError, 
  ResourceNotFoundError, 
  BusinessRuleViolationError,
  ResourceExistsError,
  ConflictError,
  InvalidStateError
} from '../../src/categories/business.errors';
import { 
  TechnicalError, 
  DatabaseError, 
  ConfigurationError,
  TimeoutError,
  DataProcessingError,
  ServiceUnavailableError
} from '../../src/categories/technical.errors';
import { 
  ExternalError, 
  ExternalApiError, 
  IntegrationError,
  ExternalDependencyUnavailableError,
  ExternalAuthenticationError,
  ExternalResponseFormatError,
  ExternalRateLimitError
} from '../../src/categories/external.errors';
import { COMMON_ERROR_CODES } from '../../src/constants';

// Standard test context for consistent testing
const TEST_CONTEXT: Partial<ErrorContext> = {
  requestId: 'test-request-123',
  userId: 'test-user-456',
  component: 'test-component',
  operation: 'test-operation',
  metadata: {
    testKey: 'testValue',
    environment: 'test'
  }
};

// Standard test details for consistent testing
const TEST_DETAILS = {
  additionalInfo: 'Test additional information',
  testProperty: true,
  testCount: 42
};

// Standard test cause for consistent testing
const TEST_CAUSE = new Error('Original test error cause');

/**
 * Base Error Test Fixtures
 */
export const baseErrorFixtures = {
  // Basic BaseError with minimal properties
  basic: new BaseError(
    'Basic test error',
    ErrorType.TECHNICAL,
    'TEST_ERROR_001'
  ),

  // Complete BaseError with all properties
  complete: new BaseError(
    'Complete test error with all properties',
    ErrorType.TECHNICAL,
    'TEST_ERROR_002',
    TEST_CONTEXT,
    TEST_DETAILS,
    TEST_CAUSE
  ),

  // Journey-specific BaseError
  journeySpecific: new BaseError(
    'Journey-specific test error',
    ErrorType.BUSINESS,
    'TEST_ERROR_003',
    {
      ...TEST_CONTEXT,
      journey: JourneyType.HEALTH
    }
  ),

  // Transient BaseError for retry testing
  transient: new BaseError(
    'Transient test error that can be retried',
    ErrorType.TECHNICAL,
    'TEST_ERROR_004',
    {
      ...TEST_CONTEXT,
      isTransient: true,
      retryStrategy: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        useExponentialBackoff: true
      }
    }
  ),

  // BaseError with different error types for HTTP status code testing
  validationType: new BaseError(
    'Validation test error',
    ErrorType.VALIDATION,
    'TEST_ERROR_005'
  ),
  businessType: new BaseError(
    'Business test error',
    ErrorType.BUSINESS,
    'TEST_ERROR_006'
  ),
  externalType: new BaseError(
    'External test error',
    ErrorType.EXTERNAL,
    'TEST_ERROR_007'
  ),
  notFoundType: new BaseError(
    'Not found test error',
    ErrorType.NOT_FOUND,
    'TEST_ERROR_008'
  ),
  authType: new BaseError(
    'Authentication test error',
    ErrorType.AUTHENTICATION,
    'TEST_ERROR_009'
  ),

  // Factory methods
  createWithContext: (context: Partial<ErrorContext>): BaseError => {
    return new BaseError(
      'Test error with custom context',
      ErrorType.TECHNICAL,
      'TEST_ERROR_010',
      context
    );
  },

  createWithType: (type: ErrorType): BaseError => {
    return new BaseError(
      `Test error with ${type} type`,
      type,
      `TEST_${type.toUpperCase()}_ERROR`
    );
  }
};

/**
 * Validation Error Test Fixtures
 */
export const validationErrorFixtures = {
  // Basic validation error
  basic: new ValidationError(
    'Basic validation test error',
    'VALIDATION_TEST_001',
    TEST_DETAILS
  ),

  // Missing parameter error
  missingParameter: new MissingParameterError(
    'testParam',
    JourneyType.HEALTH
  ),

  // Invalid parameter error
  invalidParameter: new InvalidParameterError(
    'testParam',
    'Value must be a positive number',
    JourneyType.CARE
  ),

  // Schema validation error with field errors
  schemaValidation: new SchemaValidationError(
    [
      {
        field: 'email',
        message: 'Invalid email format',
        constraint: 'isEmail',
        expected: 'valid email address',
        received: 'invalid-email'
      },
      {
        field: 'age',
        message: 'Age must be a positive number',
        constraint: 'min',
        expected: 1,
        received: -5
      }
    ] as FieldValidationError[],
    'UserSchema',
    JourneyType.PLAN
  ),

  // Factory methods
  createMissingParameter: (paramName: string, journey?: JourneyType): MissingParameterError => {
    return new MissingParameterError(paramName, journey);
  },

  createInvalidParameter: (paramName: string, reason: string, journey?: JourneyType): InvalidParameterError => {
    return new InvalidParameterError(paramName, reason, journey);
  },

  createSchemaValidation: (fieldErrors: FieldValidationError[], schemaName?: string, journey?: JourneyType): SchemaValidationError => {
    return new SchemaValidationError(fieldErrors, schemaName, journey);
  }
};

/**
 * Business Error Test Fixtures
 */
export const businessErrorFixtures = {
  // Basic business error
  basic: new BusinessError(
    'Basic business test error',
    'BUSINESS_TEST_001',
    TEST_DETAILS
  ),

  // Resource not found error
  resourceNotFound: new ResourceNotFoundError(
    'User',
    '12345',
    'auth'
  ),

  // Business rule violation error
  businessRuleViolation: new BusinessRuleViolationError(
    'MaxAppointmentsPerDay',
    'User cannot book more than 3 appointments per day',
    'care'
  ),

  // Resource exists error
  resourceExists: new ResourceExistsError(
    'HealthGoal',
    'type',
    'daily-steps',
    'health'
  ),

  // Conflict error
  conflict: new ConflictError(
    'Appointment',
    'time_overlap',
    'The requested appointment time overlaps with an existing appointment',
    'care'
  ),

  // Invalid state error
  invalidState: new InvalidStateError(
    'Claim',
    'submitted',
    'cancel',
    ['draft', 'pending'],
    'plan'
  ),

  // Factory methods
  createResourceNotFound: (resourceType: string, resourceId: string | number, journey?: string): ResourceNotFoundError => {
    return new ResourceNotFoundError(resourceType, resourceId, journey);
  },

  createBusinessRuleViolation: (ruleName: string, message: string, journey?: string): BusinessRuleViolationError => {
    return new BusinessRuleViolationError(ruleName, message, journey);
  }
};

/**
 * Technical Error Test Fixtures
 */
export const technicalErrorFixtures = {
  // Basic technical error
  basic: new TechnicalError(
    'Basic technical test error',
    'TECHNICAL_TEST_001',
    TEST_DETAILS
  ),

  // Database error
  database: new DatabaseError(
    'Test database error',
    'DATABASE_TEST_001',
    'query',
    { query: 'SELECT * FROM users' }
  ),

  // Configuration error
  configuration: new ConfigurationError(
    'Missing required configuration',
    'CONFIG_TEST_001',
    'DATABASE_URL'
  ),

  // Timeout error
  timeout: new TimeoutError(
    'Operation timed out',
    'TIMEOUT_TEST_001',
    'database_query',
    5000,
    3000
  ),

  // Data processing error
  dataProcessing: new DataProcessingError(
    'Failed to process data',
    'DATA_PROCESSING_TEST_001',
    'transformation'
  ),

  // Service unavailable error
  serviceUnavailable: new ServiceUnavailableError(
    'Service is currently unavailable',
    'SERVICE_UNAVAILABLE_TEST_001',
    'health-service'
  ),

  // Factory methods
  createDatabaseError: (message: string, operation: string): DatabaseError => {
    return new DatabaseError(message, 'DATABASE_TEST_002', operation);
  },

  createTimeoutError: (operation: string, durationMs: number, thresholdMs: number): TimeoutError => {
    return new TimeoutError(
      `Operation '${operation}' timed out after ${durationMs}ms (threshold: ${thresholdMs}ms)`,
      'TIMEOUT_TEST_002',
      operation,
      durationMs,
      thresholdMs
    );
  }
};

/**
 * External Error Test Fixtures
 */
export const externalErrorFixtures = {
  // Basic external error
  basic: new ExternalApiError(
    'Basic external API test error',
    'EXTERNAL_TEST_001'
  ),

  // External API error with status code
  apiError: new ExternalApiError(
    'External API request failed',
    'EXTERNAL_API_TEST_001',
    TEST_CONTEXT,
    { endpoint: '/api/v1/users' },
    new Error('Network error'),
    HttpStatus.BAD_GATEWAY
  ),

  // Integration error
  integration: new IntegrationError(
    'Failed to integrate with external system',
    'INTEGRATION_TEST_001',
    'payment-gateway'
  ),

  // External dependency unavailable error
  dependencyUnavailable: new ExternalDependencyUnavailableError(
    'fhir-service',
    'FHIR service is currently unavailable'
  ),

  // External authentication error
  authentication: new ExternalAuthenticationError(
    'oauth-provider',
    'Failed to authenticate with OAuth provider'
  ),

  // External response format error
  responseFormat: new ExternalResponseFormatError(
    'Invalid response format from external API',
    { status: 'error' },
    'Expected { data: any, status: string }'
  ),

  // External rate limit error
  rateLimit: new ExternalRateLimitError(
    'Rate limit exceeded for external API',
    60000 // retry after 60 seconds
  ),

  // Factory methods
  createApiError: (message: string, statusCode: number): ExternalApiError => {
    return new ExternalApiError(
      message,
      'EXTERNAL_API_TEST_002',
      undefined,
      undefined,
      undefined,
      statusCode
    );
  },

  createFromResponse: (response: { status: number; statusText?: string; data?: any }): ExternalApiError => {
    return ExternalApiError.fromResponse(response);
  }
};

/**
 * Serialized Error Test Fixtures
 * These represent the JSON structure of errors after serialization
 */
export const serializedErrorFixtures = {
  // Basic serialized error
  basic: {
    error: {
      type: ErrorType.TECHNICAL,
      code: 'TEST_ERROR_001',
      message: 'Basic test error'
    }
  },

  // Complete serialized error with all properties
  complete: {
    error: {
      type: ErrorType.TECHNICAL,
      code: 'TEST_ERROR_002',
      message: 'Complete test error with all properties',
      details: TEST_DETAILS,
      requestId: 'test-request-123',
      timestamp: expect.any(String)
    }
  },

  // Validation error serialized
  validation: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'VALIDATION_TEST_001',
      message: 'Basic validation test error',
      details: TEST_DETAILS
    }
  },

  // Business error serialized
  business: {
    error: {
      type: ErrorType.BUSINESS,
      code: 'BUSINESS_TEST_001',
      message: 'Basic business test error',
      details: TEST_DETAILS
    }
  },

  // Technical error serialized
  technical: {
    error: {
      type: ErrorType.TECHNICAL,
      code: 'TECHNICAL_TEST_001',
      message: 'Basic technical test error',
      details: TEST_DETAILS
    }
  },

  // External error serialized
  external: {
    error: {
      type: ErrorType.EXTERNAL,
      code: 'EXTERNAL_TEST_001',
      message: 'Basic external API test error'
    }
  }
};

/**
 * HTTP Exception Test Fixtures
 * These represent the expected HTTP exceptions created from errors
 */
export const httpExceptionFixtures = {
  // Validation error HTTP exception
  validation: {
    status: HttpStatus.BAD_REQUEST,
    response: serializedErrorFixtures.validation
  },

  // Business error HTTP exception
  business: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    response: serializedErrorFixtures.business
  },

  // Technical error HTTP exception
  technical: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    response: serializedErrorFixtures.technical
  },

  // External error HTTP exception
  external: {
    status: HttpStatus.BAD_GATEWAY,
    response: serializedErrorFixtures.external
  },

  // Not found error HTTP exception
  notFound: {
    status: HttpStatus.NOT_FOUND,
    response: {
      error: {
        type: ErrorType.NOT_FOUND,
        code: 'TEST_ERROR_008',
        message: 'Not found test error'
      }
    }
  },

  // Authentication error HTTP exception
  authentication: {
    status: HttpStatus.UNAUTHORIZED,
    response: {
      error: {
        type: ErrorType.AUTHENTICATION,
        code: 'TEST_ERROR_009',
        message: 'Authentication test error'
      }
    }
  }
};

/**
 * Combined export of all error fixtures
 */
export const errorFixtures = {
  base: baseErrorFixtures,
  validation: validationErrorFixtures,
  business: businessErrorFixtures,
  technical: technicalErrorFixtures,
  external: externalErrorFixtures,
  serialized: serializedErrorFixtures,
  httpException: httpExceptionFixtures
};

export default errorFixtures;