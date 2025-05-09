/**
 * @file base-errors.ts
 * @description Provides standard sample error instances for testing the base error functionality.
 * Contains pre-configured BaseError, ValidationError, BusinessError, TechnicalError, ExternalSystemError,
 * and NotFoundError instances with consistent test properties to ensure predictable test scenarios.
 */

import { HttpStatus } from '@nestjs/common';
import {
  BaseError,
  ErrorType,
  JourneyContext,
  ErrorContext,
  SerializedError
} from '../../src/base';
import { MissingParameterError, InvalidParameterError, SchemaValidationError, ValidationErrorDetail } from '../../src/categories/validation.errors';
import { BusinessError, ResourceNotFoundError, BusinessRuleViolationError } from '../../src/categories/business.errors';
import { TechnicalError, DatabaseError, ConfigurationError } from '../../src/categories/technical.errors';
import { ExternalError, ExternalApiError, ExternalDependencyUnavailableError } from '../../src/categories/external.errors';

// Standard test context values
const TEST_USER_ID = '12345';
const TEST_REQUEST_ID = 'req-abcdef-123456';
const TEST_TRACE_ID = 'trace-123456-abcdef';

/**
 * Creates a standard error context for testing.
 * 
 * @param journey - Optional journey context to include
 * @param additionalContext - Additional context properties to include
 * @returns A standard error context for testing
 */
export function createTestErrorContext(
  journey?: JourneyContext,
  additionalContext: Record<string, any> = {}
): ErrorContext {
  return {
    userId: TEST_USER_ID,
    requestId: TEST_REQUEST_ID,
    traceId: TEST_TRACE_ID,
    timestamp: new Date('2023-01-01T12:00:00Z'),
    ...(journey ? { journey } : {}),
    ...additionalContext
  };
}

// ===== BASE ERROR FIXTURES =====

/**
 * Standard BaseError instance for testing.
 */
export const standardBaseError = new BaseError(
  'Standard test error message',
  ErrorType.TECHNICAL,
  'TEST_001',
  createTestErrorContext(JourneyContext.SYSTEM),
  { additionalInfo: 'test details' },
  'Try reloading the page'
);

/**
 * Creates a customized BaseError instance for testing.
 * 
 * @param message - Custom error message
 * @param type - Error type
 * @param code - Error code
 * @param journey - Journey context
 * @param details - Additional error details
 * @param suggestion - Error resolution suggestion
 * @returns A customized BaseError instance
 */
export function createBaseError(
  message: string = 'Test error message',
  type: ErrorType = ErrorType.TECHNICAL,
  code: string = 'TEST_001',
  journey: JourneyContext = JourneyContext.SYSTEM,
  details: any = { test: true },
  suggestion: string = 'Test suggestion'
): BaseError {
  return new BaseError(
    message,
    type,
    code,
    createTestErrorContext(journey),
    details,
    suggestion
  );
}

/**
 * Serialized version of the standard BaseError for response testing.
 */
export const serializedBaseError: SerializedError = standardBaseError.toJSON();

// ===== VALIDATION ERROR FIXTURES =====

/**
 * Standard MissingParameterError instance for testing.
 */
export const standardMissingParameterError = new MissingParameterError(
  'email',
  createTestErrorContext(JourneyContext.AUTH)
);

/**
 * Standard InvalidParameterError instance for testing.
 */
export const standardInvalidParameterError = new InvalidParameterError(
  'email',
  'invalid-email',
  createTestErrorContext(JourneyContext.AUTH)
);

/**
 * Sample validation error details for testing SchemaValidationError.
 */
export const sampleValidationErrorDetails: ValidationErrorDetail[] = [
  {
    field: 'email',
    message: 'Email must be a valid email address',
    rule: 'email',
    actual: 'invalid-email'
  },
  {
    field: 'password',
    message: 'Password must be at least 8 characters long',
    rule: 'minLength',
    expected: 8,
    actual: 'pass'
  }
];

/**
 * Standard SchemaValidationError instance for testing.
 */
export const standardSchemaValidationError = new SchemaValidationError(
  sampleValidationErrorDetails,
  'UserDTO',
  createTestErrorContext(JourneyContext.AUTH)
);

/**
 * Creates a customized validation error for testing.
 * 
 * @param errorType - Type of validation error to create
 * @param field - Field name for the error
 * @param value - Invalid value (for InvalidParameterError)
 * @param journey - Journey context
 * @returns A customized validation error instance
 */
export function createValidationError(
  errorType: 'missing' | 'invalid' | 'schema' = 'invalid',
  field: string = 'testField',
  value: any = 'invalidValue',
  journey: JourneyContext = JourneyContext.AUTH
): BaseError {
  const context = createTestErrorContext(journey);
  
  switch (errorType) {
    case 'missing':
      return new MissingParameterError(field, context);
    case 'schema':
      return new SchemaValidationError(
        [{ field, message: `Invalid ${field}`, rule: 'validation', actual: value }],
        'TestDTO',
        context
      );
    case 'invalid':
    default:
      return new InvalidParameterError(field, value, context);
  }
}

// ===== BUSINESS ERROR FIXTURES =====

/**
 * Standard BusinessError instance for testing.
 */
export const standardBusinessError = new BusinessError(
  'Standard business rule violation',
  'BIZ_TEST_001',
  createTestErrorContext(JourneyContext.HEALTH),
  { businessInfo: 'test business details' },
  'Follow the business rules'
);

/**
 * Standard ResourceNotFoundError instance for testing.
 */
export const standardNotFoundError = new ResourceNotFoundError(
  'user',
  '12345',
  JourneyContext.AUTH
);

/**
 * Standard BusinessRuleViolationError instance for testing.
 */
export const standardBusinessRuleViolationError = new BusinessRuleViolationError(
  'Cannot schedule more than 3 appointments per day',
  JourneyContext.CARE
);

/**
 * Creates a customized business error for testing.
 * 
 * @param errorType - Type of business error to create
 * @param message - Custom error message
 * @param resourceType - Resource type (for ResourceNotFoundError)
 * @param resourceId - Resource ID (for ResourceNotFoundError)
 * @param journey - Journey context
 * @returns A customized business error instance
 */
export function createBusinessError(
  errorType: 'general' | 'notFound' | 'ruleViolation' = 'general',
  message: string = 'Test business error',
  resourceType: string = 'testResource',
  resourceId: string | number = '12345',
  journey: JourneyContext = JourneyContext.HEALTH
): BaseError {
  const context = createTestErrorContext(journey);
  
  switch (errorType) {
    case 'notFound':
      return new ResourceNotFoundError(resourceType, resourceId, journey);
    case 'ruleViolation':
      return new BusinessRuleViolationError(message, journey);
    case 'general':
    default:
      return new BusinessError(message, 'BIZ_TEST_002', context);
  }
}

// ===== TECHNICAL ERROR FIXTURES =====

/**
 * Standard TechnicalError instance for testing.
 */
export const standardTechnicalError = new TechnicalError(
  'Standard technical error',
  'TECH_TEST_001',
  createTestErrorContext(JourneyContext.SYSTEM),
  { technicalInfo: 'test technical details' },
  'Contact system administrator'
);

/**
 * Standard DatabaseError instance for testing.
 */
export const standardDatabaseError = new DatabaseError(
  'Database query failed',
  'SELECT',
  { query: 'SELECT * FROM users WHERE id = ?' },
  createTestErrorContext(JourneyContext.SYSTEM),
  new Error('SQL syntax error')
);

/**
 * Standard ConfigurationError instance for testing.
 */
export const standardConfigurationError = new ConfigurationError(
  'Missing required configuration',
  'DATABASE_URL',
  { severity: 'critical' },
  createTestErrorContext(JourneyContext.SYSTEM)
);

/**
 * Creates a customized technical error for testing.
 * 
 * @param errorType - Type of technical error to create
 * @param message - Custom error message
 * @param code - Error code
 * @param journey - Journey context
 * @param cause - Original error that caused this exception
 * @returns A customized technical error instance
 */
export function createTechnicalError(
  errorType: 'general' | 'database' | 'configuration' = 'general',
  message: string = 'Test technical error',
  code: string = 'TECH_TEST_002',
  journey: JourneyContext = JourneyContext.SYSTEM,
  cause: Error | null = null
): BaseError {
  const context = createTestErrorContext(journey);
  
  switch (errorType) {
    case 'database':
      return new DatabaseError(
        message,
        'query',
        { operation: 'test' },
        context,
        cause || undefined
      );
    case 'configuration':
      return new ConfigurationError(
        message,
        'TEST_CONFIG',
        { severity: 'medium' },
        context,
        cause || undefined
      );
    case 'general':
    default:
      return new TechnicalError(
        message,
        code,
        context,
        { test: true },
        'Contact support',
        cause || undefined
      );
  }
}

// ===== EXTERNAL ERROR FIXTURES =====

/**
 * Standard ExternalError instance for testing.
 */
export const standardExternalError = new ExternalError(
  'Standard external system error',
  'EXT_TEST_001',
  'test-service',
  createTestErrorContext(JourneyContext.SYSTEM),
  HttpStatus.BAD_GATEWAY,
  { error: 'Service unavailable' },
  { externalInfo: 'test external details' },
  'Check external service status'
);

/**
 * Standard ExternalApiError instance for testing.
 */
export const standardExternalApiError = new ExternalApiError(
  'External API request failed',
  'test-api',
  createTestErrorContext(JourneyContext.HEALTH),
  HttpStatus.INTERNAL_SERVER_ERROR,
  'GET',
  'https://api.test-service.com/users',
  { error: 'Internal server error' }
);

/**
 * Standard ExternalDependencyUnavailableError instance for testing.
 */
export const standardExternalDependencyError = new ExternalDependencyUnavailableError(
  'External dependency is unavailable',
  'payment-gateway',
  'api',
  createTestErrorContext(JourneyContext.PLAN),
  HttpStatus.SERVICE_UNAVAILABLE,
  { error: 'Service temporarily unavailable' }
);

/**
 * Creates a customized external error for testing.
 * 
 * @param errorType - Type of external error to create
 * @param message - Custom error message
 * @param serviceName - Name of the external service
 * @param statusCode - HTTP status code from the external service
 * @param journey - Journey context
 * @returns A customized external error instance
 */
export function createExternalError(
  errorType: 'general' | 'api' | 'dependency' = 'general',
  message: string = 'Test external error',
  serviceName: string = 'test-external-service',
  statusCode: HttpStatus = HttpStatus.BAD_GATEWAY,
  journey: JourneyContext = JourneyContext.SYSTEM
): BaseError {
  const context = createTestErrorContext(journey);
  
  switch (errorType) {
    case 'api':
      return new ExternalApiError(
        message,
        serviceName,
        context,
        statusCode,
        'GET',
        `https://api.${serviceName}.com/resource`
      );
    case 'dependency':
      return new ExternalDependencyUnavailableError(
        message,
        serviceName,
        'service',
        context,
        statusCode
      );
    case 'general':
    default:
      return new ExternalError(
        message,
        'EXT_TEST_002',
        serviceName,
        context,
        statusCode
      );
  }
}

// ===== ERROR WITH CONTEXT FIXTURES =====

/**
 * BaseError with health journey context for testing.
 */
export const healthJourneyError = createBaseError(
  'Health journey error',
  ErrorType.BUSINESS,
  'HEALTH_001',
  JourneyContext.HEALTH
);

/**
 * BaseError with care journey context for testing.
 */
export const careJourneyError = createBaseError(
  'Care journey error',
  ErrorType.BUSINESS,
  'CARE_001',
  JourneyContext.CARE
);

/**
 * BaseError with plan journey context for testing.
 */
export const planJourneyError = createBaseError(
  'Plan journey error',
  ErrorType.BUSINESS,
  'PLAN_001',
  JourneyContext.PLAN
);

/**
 * BaseError with auth journey context for testing.
 */
export const authJourneyError = createBaseError(
  'Auth journey error',
  ErrorType.VALIDATION,
  'AUTH_001',
  JourneyContext.AUTH
);

/**
 * BaseError with gamification journey context for testing.
 */
export const gamificationJourneyError = createBaseError(
  'Gamification journey error',
  ErrorType.BUSINESS,
  'GAMIFICATION_001',
  JourneyContext.GAMIFICATION
);

// ===== HTTP STATUS CODE TESTING FIXTURES =====

/**
 * Map of error types to sample errors for HTTP status code testing.
 */
export const httpStatusTestErrors: Record<ErrorType, BaseError> = {
  [ErrorType.VALIDATION]: createBaseError('Validation error', ErrorType.VALIDATION),
  [ErrorType.AUTHENTICATION]: createBaseError('Authentication error', ErrorType.AUTHENTICATION),
  [ErrorType.AUTHORIZATION]: createBaseError('Authorization error', ErrorType.AUTHORIZATION),
  [ErrorType.NOT_FOUND]: createBaseError('Not found error', ErrorType.NOT_FOUND),
  [ErrorType.CONFLICT]: createBaseError('Conflict error', ErrorType.CONFLICT),
  [ErrorType.BUSINESS]: createBaseError('Business error', ErrorType.BUSINESS),
  [ErrorType.RATE_LIMIT]: createBaseError('Rate limit error', ErrorType.RATE_LIMIT),
  [ErrorType.TECHNICAL]: createBaseError('Technical error', ErrorType.TECHNICAL),
  [ErrorType.EXTERNAL]: createBaseError('External error', ErrorType.EXTERNAL),
  [ErrorType.UNAVAILABLE]: createBaseError('Unavailable error', ErrorType.UNAVAILABLE),
  [ErrorType.TIMEOUT]: createBaseError('Timeout error', ErrorType.TIMEOUT)
};

/**
 * Map of HTTP status codes to expected error types for testing.
 */
export const httpStatusToErrorTypeMap: Record<HttpStatus, ErrorType> = {
  [HttpStatus.BAD_REQUEST]: ErrorType.VALIDATION,
  [HttpStatus.UNAUTHORIZED]: ErrorType.AUTHENTICATION,
  [HttpStatus.FORBIDDEN]: ErrorType.AUTHORIZATION,
  [HttpStatus.NOT_FOUND]: ErrorType.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorType.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorType.BUSINESS,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorType.RATE_LIMIT,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorType.TECHNICAL,
  [HttpStatus.BAD_GATEWAY]: ErrorType.EXTERNAL,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorType.UNAVAILABLE,
  [HttpStatus.GATEWAY_TIMEOUT]: ErrorType.TIMEOUT
};