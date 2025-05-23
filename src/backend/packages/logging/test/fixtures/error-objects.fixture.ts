import { ErrorType, AppException } from '@austa/errors';
import { JourneyType } from '../../src/interfaces/log-entry.interface';

/**
 * Collection of error objects for testing error logging functionality.
 * Provides a variety of error types and structures to verify proper error serialization,
 * stack trace handling, and error context enrichment in the logging system.
 */

/**
 * Standard JavaScript errors with stack traces
 */
export const standardErrors = {
  /**
   * Basic Error instance
   */
  basicError: new Error('Basic error message'),

  /**
   * TypeError instance
   */
  typeError: new TypeError('Invalid type provided'),

  /**
   * RangeError instance
   */
  rangeError: new RangeError('Value out of acceptable range'),

  /**
   * ReferenceError instance
   */
  referenceError: new ReferenceError('Reference to undefined variable'),

  /**
   * SyntaxError instance
   */
  syntaxError: new SyntaxError('Invalid syntax in dynamic code'),

  /**
   * Error with custom properties
   */
  customPropertiesError: Object.assign(new Error('Error with custom properties'), {
    statusCode: 500,
    errorId: 'ERR_CUSTOM_1',
    timestamp: new Date(),
    requestPath: '/api/health/metrics'
  })
};

/**
 * Custom application exceptions with error codes and metadata
 */
export const applicationExceptions = {
  /**
   * Validation error with field-level details
   */
  validationException: new AppException(
    'Validation failed for user registration',
    ErrorType.VALIDATION,
    'AUTH_001',
    {
      fields: [
        { field: 'email', message: 'Must be a valid email address' },
        { field: 'password', message: 'Must be at least 8 characters long' },
        { field: 'birthDate', message: 'Must be a valid date in the past' }
      ],
      requestId: '123e4567-e89b-12d3-a456-426614174000'
    }
  ),

  /**
   * Business logic error
   */
  businessException: new AppException(
    'Cannot schedule appointment outside of business hours',
    ErrorType.BUSINESS,
    'CARE_101',
    {
      providedTime: '2023-05-15T20:30:00Z',
      availableHours: '08:00-18:00',
      providerName: 'Dr. Smith',
      providerSpecialty: 'Cardiology'
    }
  ),

  /**
   * Technical error
   */
  technicalException: new AppException(
    'Database connection failed',
    ErrorType.TECHNICAL,
    'DB_500',
    {
      database: 'health_metrics',
      host: 'health-db.austa.internal',
      retryAttempts: 3,
      lastError: 'ETIMEDOUT'
    }
  ),

  /**
   * External system error
   */
  externalException: new AppException(
    'Failed to fetch data from FHIR API',
    ErrorType.EXTERNAL,
    'EXT_302',
    {
      endpoint: '/Patient/12345',
      statusCode: 503,
      responseTime: 5023,
      retryable: true
    }
  )
};

/**
 * Validation errors with structured field-level details
 */
export const validationErrors = {
  /**
   * Simple field validation error
   */
  simpleValidationError: Object.assign(new Error('Validation failed'), {
    name: 'ValidationError',
    fields: [
      { field: 'username', message: 'Required field' }
    ]
  }),

  /**
   * Complex validation error with nested fields
   */
  complexValidationError: Object.assign(new Error('Multiple validation errors'), {
    name: 'ValidationError',
    fields: [
      { field: 'email', message: 'Invalid format', code: 'FORMAT_ERROR' },
      { field: 'address.zipCode', message: 'Invalid zip code', code: 'INVALID_ZIP' },
      { field: 'address.country', message: 'Country not supported', code: 'UNSUPPORTED_COUNTRY' },
      { field: 'phoneNumbers[0].number', message: 'Invalid phone number', code: 'INVALID_PHONE' }
    ],
    validationContext: 'user-registration',
    timestamp: new Date().toISOString()
  }),

  /**
   * Class-validator style validation error
   */
  classValidatorError: Object.assign(new Error('Validation failed'), {
    name: 'BadRequestException',
    response: {
      statusCode: 400,
      message: [
        'email must be an email',
        'password must be longer than or equal to 8 characters',
        'birthDate must be a valid ISO 8601 date string'
      ],
      error: 'Bad Request'
    }
  }),

  /**
   * Zod validation error
   */
  zodValidationError: Object.assign(new Error('Validation failed'), {
    name: 'ZodError',
    errors: [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: ['email'],
        message: 'Required'
      },
      {
        code: 'too_small',
        minimum: 8,
        type: 'string',
        inclusive: true,
        path: ['password'],
        message: 'String must contain at least 8 character(s)'
      }
    ]
  })
};

/**
 * Nested error chains to test cause tracking
 */
export const nestedErrors = {
  /**
   * Simple nested error with cause
   */
  simpleNestedError: (() => {
    const cause = new Error('Original database error');
    return new Error('Failed to fetch user data', { cause });
  })(),

  /**
   * Deep nested error chain
   */
  deepNestedError: (() => {
    const level3 = new Error('Network timeout');
    const level2 = new Error('Failed to connect to API', { cause: level3 });
    const level1 = new Error('Error fetching external data', { cause: level2 });
    return new Error('Failed to process user request', { cause: level1 });
  })(),

  /**
   * Mixed error types in chain
   */
  mixedTypeNestedError: (() => {
    const dbError = new Error('Database query failed');
    const timeoutError = new TypeError('Operation timed out', { cause: dbError });
    return new AppException(
      'Failed to retrieve health metrics',
      ErrorType.TECHNICAL,
      'HEALTH_503',
      { operation: 'getHealthMetrics', userId: 'user-123' },
      timeoutError
    );
  })()
};

/**
 * Journey-specific error types for testing domain error handling
 */
export const journeyErrors = {
  /**
   * Health journey error
   */
  healthJourneyError: Object.assign(
    new AppException(
      'Failed to sync health data from wearable device',
      ErrorType.TECHNICAL,
      'HEALTH_DEVICE_001',
      {
        deviceId: 'fitbit-12345',
        lastSyncTime: '2023-05-10T15:30:00Z',
        metrics: ['steps', 'heartRate', 'sleep']
      }
    ),
    { journey: JourneyType.HEALTH }
  ),

  /**
   * Care journey error
   */
  careJourneyError: Object.assign(
    new AppException(
      'Telemedicine session failed to initialize',
      ErrorType.TECHNICAL,
      'CARE_TELEMEDICINE_002',
      {
        appointmentId: 'appt-789012',
        provider: 'Dr. Johnson',
        scheduledTime: '2023-05-15T14:00:00Z',
        platform: 'WebRTC'
      }
    ),
    { journey: JourneyType.CARE }
  ),

  /**
   * Plan journey error
   */
  planJourneyError: Object.assign(
    new AppException(
      'Insurance claim submission failed',
      ErrorType.BUSINESS,
      'PLAN_CLAIM_003',
      {
        claimId: 'claim-456789',
        policyNumber: 'POL-123-456-789',
        serviceDate: '2023-04-20',
        amount: 250.75,
        rejectionReason: 'Service not covered under current plan'
      }
    ),
    { journey: JourneyType.PLAN }
  )
};

/**
 * Errors with additional metadata for context enrichment testing
 */
export const contextualErrors = {
  /**
   * Error with user context
   */
  userContextError: Object.assign(new Error('User permission denied'), {
    userId: 'user-456789',
    userName: 'johndoe',
    userEmail: 'john.doe@example.com',
    userRole: 'patient',
    requestedResource: '/api/health/records/789',
    requiredPermission: 'health:records:read'
  }),

  /**
   * Error with request context
   */
  requestContextError: Object.assign(new Error('Request failed'), {
    requestId: 'req-123456789',
    path: '/api/care/appointments',
    method: 'POST',
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    timestamp: new Date().toISOString()
  }),

  /**
   * Error with performance metrics
   */
  performanceContextError: Object.assign(new Error('Operation timed out'), {
    operationName: 'fetchUserHealthMetrics',
    durationMs: 5032,
    threshold: 3000,
    resourceUtilization: {
      cpu: 85,
      memory: 72,
      connections: 423
    },
    timestamp: new Date().toISOString()
  })
};

/**
 * Export all error collections for easy access
 */
export const allErrors = {
  ...standardErrors,
  ...applicationExceptions,
  ...validationErrors,
  ...nestedErrors,
  ...journeyErrors,
  ...contextualErrors
};