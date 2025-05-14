import { ErrorType } from '../../../errors/src/categories';
import { AppException } from '../../../errors/src/base-error';
import { JourneyType } from '../../src/interfaces/log-entry.interface';

/**
 * Collection of error objects for testing error logging functionality across different scenarios.
 * Includes standard JavaScript errors, custom application exceptions with metadata,
 * validation errors with structured details, and nested error chains.
 */

/**
 * Standard JavaScript errors with stack traces
 */
export const standardErrors = {
  /**
   * Basic Error instance
   */
  basicError: new Error('A basic error occurred'),

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
    code: 'CUSTOM_ERROR_001',
    statusCode: 500,
    details: { source: 'test-fixture', timestamp: new Date().toISOString() }
  })
};

/**
 * Custom application exceptions with error codes and metadata
 */
export const applicationExceptions = {
  /**
   * Validation error
   */
  validationException: new AppException(
    'Invalid input parameters',
    ErrorType.VALIDATION,
    'VAL_001',
    { fields: ['email', 'password'], reason: 'missing_required_fields' }
  ),

  /**
   * Business logic error
   */
  businessException: new AppException(
    'Operation not allowed in current state',
    ErrorType.BUSINESS,
    'BUS_101',
    { currentState: 'pending', allowedTransitions: ['approved', 'rejected'] }
  ),

  /**
   * Technical error
   */
  technicalException: new AppException(
    'Database connection failed',
    ErrorType.TECHNICAL,
    'TECH_201',
    { service: 'postgres', operation: 'connect', retryCount: 3 }
  ),

  /**
   * External system error
   */
  externalException: new AppException(
    'External API request failed',
    ErrorType.EXTERNAL,
    'EXT_301',
    { service: 'payment-gateway', statusCode: 503, endpoint: '/api/v1/process' }
  )
};

/**
 * Validation errors with structured field-level details
 */
export const validationErrors = {
  /**
   * Field validation error
   */
  fieldValidationError: new AppException(
    'Validation failed for submitted data',
    ErrorType.VALIDATION,
    'VAL_002',
    {
      fields: [
        { name: 'email', errors: ['must be a valid email address'] },
        { name: 'age', errors: ['must be a number', 'must be at least 18'] },
        { name: 'password', errors: ['must be at least 8 characters', 'must contain at least one number'] }
      ]
    }
  ),

  /**
   * Schema validation error
   */
  schemaValidationError: new AppException(
    'Request body failed schema validation',
    ErrorType.VALIDATION,
    'VAL_003',
    {
      schemaName: 'UserRegistration',
      errors: [
        { path: 'user.profile.firstName', message: 'Required field missing' },
        { path: 'user.contact.phoneNumber', message: 'Invalid phone number format' }
      ]
    }
  ),

  /**
   * Zod validation error simulation
   */
  zodLikeValidationError: new AppException(
    'Zod validation failed',
    ErrorType.VALIDATION,
    'VAL_004',
    {
      issues: [
        { code: 'invalid_type', expected: 'string', received: 'undefined', path: ['name'] },
        { code: 'too_small', minimum: 3, type: 'string', path: ['username'], inclusive: true },
        { code: 'invalid_string', validation: 'email', path: ['email'] }
      ]
    }
  )
};

/**
 * Nested error chains to test cause tracking
 */
export const nestedErrors = {
  /**
   * Simple nested error
   */
  simpleNestedError: new AppException(
    'Failed to process user request',
    ErrorType.TECHNICAL,
    'TECH_401',
    { operation: 'processUserRequest' },
    new Error('Internal processing error')
  ),

  /**
   * Deeply nested error chain
   */
  deeplyNestedError: new AppException(
    'Failed to complete payment transaction',
    ErrorType.BUSINESS,
    'BUS_501',
    { transactionId: 'tx_12345' },
    new AppException(
      'Payment gateway error',
      ErrorType.EXTERNAL,
      'EXT_302',
      { gateway: 'stripe' },
      new AppException(
        'Network request failed',
        ErrorType.TECHNICAL,
        'TECH_202',
        { timeout: 30000 },
        new Error('ETIMEDOUT: Connection timed out')
      )
    )
  ),

  /**
   * Mixed error types in chain
   */
  mixedErrorChain: new AppException(
    'User registration failed',
    ErrorType.BUSINESS,
    'BUS_601',
    { userId: 'user_12345' },
    Object.assign(new TypeError('Expected string but got object'), {
      code: 'TYPE_MISMATCH',
      field: 'email',
      cause: new Error('Invalid input data')
    })
  )
};

/**
 * Journey-specific error types for testing domain error handling
 */
export const journeyErrors = {
  /**
   * Health journey error
   */
  healthJourneyError: new AppException(
    'Failed to sync health metrics from device',
    ErrorType.TECHNICAL,
    'HEALTH_001',
    {
      journey: JourneyType.HEALTH,
      deviceId: 'device_12345',
      metricType: 'heart_rate',
      lastSyncTime: new Date().toISOString()
    }
  ),

  /**
   * Care journey error
   */
  careJourneyError: new AppException(
    'Appointment scheduling failed',
    ErrorType.BUSINESS,
    'CARE_001',
    {
      journey: JourneyType.CARE,
      providerId: 'provider_12345',
      requestedTime: new Date().toISOString(),
      reason: 'no_availability'
    }
  ),

  /**
   * Plan journey error
   */
  planJourneyError: new AppException(
    'Claim submission rejected',
    ErrorType.VALIDATION,
    'PLAN_001',
    {
      journey: JourneyType.PLAN,
      claimId: 'claim_12345',
      rejectionReason: 'missing_documentation',
      requiredDocuments: ['receipt', 'medical_report']
    }
  ),

  /**
   * Cross-journey error
   */
  crossJourneyError: new AppException(
    'Failed to process cross-journey event',
    ErrorType.TECHNICAL,
    'CROSS_001',
    {
      journey: JourneyType.CROSS_JOURNEY,
      sourceJourney: JourneyType.HEALTH,
      targetJourney: JourneyType.CARE,
      eventType: 'abnormal_metric_detected',
      metricType: 'blood_pressure'
    }
  )
};

/**
 * Error objects with non-standard properties to test serialization edge cases
 */
export const edgeCaseErrors = {
  /**
   * Error with circular reference
   */
  circularReferenceError: (() => {
    const error = new Error('Error with circular reference');
    const details = { name: 'circular-error' };
    details['self'] = details; // Create circular reference
    (error as any).details = details;
    return error;
  })(),

  /**
   * Error with function properties
   */
  functionPropertyError: Object.assign(new Error('Error with function properties'), {
    calculator: (a: number, b: number) => a + b,
    formatter: function(msg: string) { return `Error: ${msg}`; }
  }),

  /**
   * Error with non-serializable properties
   */
  nonSerializableError: Object.assign(new Error('Error with non-serializable properties'), {
    symbol: Symbol('error-symbol'),
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3]),
    date: new Date()
  }),

  /**
   * Error with very large stack trace
   */
  largeStackError: (() => {
    const generateNestedError = (depth: number): Error => {
      if (depth <= 0) return new Error('Base error');
      try {
        throw generateNestedError(depth - 1);
      } catch (e) {
        return new Error(`Nested error level ${depth}`, { cause: e });
      }
    };
    return generateNestedError(10);
  })()
};

/**
 * Complete collection of all error objects for testing
 */
export const allErrors = {
  ...standardErrors,
  ...applicationExceptions,
  ...validationErrors,
  ...nestedErrors,
  ...journeyErrors,
  ...edgeCaseErrors
};