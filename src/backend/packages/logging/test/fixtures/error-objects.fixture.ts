import { ErrorType, AppException } from '@austa/shared/exceptions';

/**
 * Collection of error objects for testing error logging functionality.
 * Provides a variety of error types and structures to verify proper error
 * serialization, stack trace handling, and error context enrichment.
 */

/**
 * Standard JavaScript errors with stack traces
 */
export const standardErrors = {
  // Basic Error object
  basicError: new Error('Basic error message'),
  
  // TypeError for invalid operations
  typeError: new TypeError('Invalid type operation'),
  
  // RangeError for values outside acceptable range
  rangeError: new RangeError('Value out of acceptable range'),
  
  // ReferenceError for invalid references
  referenceError: new ReferenceError('Invalid reference used'),
  
  // SyntaxError for parsing errors
  syntaxError: new SyntaxError('Invalid syntax in operation'),
  
  // URIError for URI encoding/decoding errors
  uriError: new URIError('Invalid URI encoding or decoding')
};

/**
 * Custom application exceptions with error codes and metadata
 */
export const applicationExceptions = {
  // Validation error (400 Bad Request)
  validationError: new AppException(
    'Invalid input data provided',
    ErrorType.VALIDATION,
    'VAL_001',
    {
      fields: {
        email: 'Invalid email format',
        password: 'Password must be at least 8 characters'
      }
    }
  ),
  
  // Business logic error (422 Unprocessable Entity)
  businessError: new AppException(
    'Cannot complete the requested operation',
    ErrorType.BUSINESS,
    'BUS_101',
    {
      reason: 'Insufficient account balance',
      currentBalance: 50,
      requiredBalance: 100
    }
  ),
  
  // Technical error (500 Internal Server Error)
  technicalError: new AppException(
    'Unexpected error occurred during processing',
    ErrorType.TECHNICAL,
    'TECH_500',
    {
      component: 'PaymentProcessor',
      operation: 'processTransaction',
      timestamp: new Date().toISOString()
    }
  ),
  
  // External system error (502 Bad Gateway)
  externalError: new AppException(
    'External service unavailable',
    ErrorType.EXTERNAL,
    'EXT_502',
    {
      service: 'PaymentGateway',
      endpoint: '/api/v1/payments',
      statusCode: 503,
      retryAfter: 30
    }
  )
};

/**
 * Journey-specific error types for testing domain error handling
 */
export const journeyErrors = {
  // Health journey error
  healthJourneyError: new AppException(
    'Unable to sync health data',
    ErrorType.TECHNICAL,
    'HEALTH_001',
    {
      deviceType: 'FitbitWatch',
      lastSyncTime: new Date(Date.now() - 86400000).toISOString(),
      metrics: ['steps', 'heartRate', 'sleep']
    }
  ),
  
  // Care journey error
  careJourneyError: new AppException(
    'Appointment scheduling failed',
    ErrorType.BUSINESS,
    'CARE_101',
    {
      doctorId: 'dr-smith-123',
      requestedDate: new Date().toISOString(),
      reason: 'No available slots for the requested time'
    }
  ),
  
  // Plan journey error
  planJourneyError: new AppException(
    'Claim processing error',
    ErrorType.EXTERNAL,
    'PLAN_201',
    {
      claimId: 'CLM-2023-12345',
      insuranceProvider: 'HealthPlus',
      status: 'REJECTED',
      reason: 'Missing documentation'
    }
  )
};

/**
 * Validation errors with structured field-level details
 */
export const validationErrors = {
  // Simple field validation error
  simpleValidation: new AppException(
    'Validation failed',
    ErrorType.VALIDATION,
    'VAL_100',
    {
      fields: {
        username: 'Username is required',
        email: 'Email format is invalid'
      }
    }
  ),
  
  // Complex nested validation error
  complexValidation: new AppException(
    'Form validation failed',
    ErrorType.VALIDATION,
    'VAL_200',
    {
      fields: {
        personalInfo: {
          firstName: 'First name is required',
          lastName: 'Last name is required',
          contact: {
            email: 'Email format is invalid',
            phone: 'Phone number must be 10 digits'
          }
        },
        address: {
          street: 'Street is required',
          zipCode: 'Invalid zip code format'
        }
      },
      formId: 'user-registration',
      attemptCount: 3
    }
  ),
  
  // Array validation error
  arrayValidation: new AppException(
    'Invalid items in collection',
    ErrorType.VALIDATION,
    'VAL_300',
    {
      fields: {
        'items[0].name': 'Name is required',
        'items[0].price': 'Price must be positive',
        'items[2].quantity': 'Quantity must be at least 1'
      },
      totalItems: 3,
      validItems: 1
    }
  )
};

/**
 * Nested error chains to test cause tracking
 */
export const nestedErrors = {
  // Two-level nested error
  twoLevelError: (() => {
    const cause = new Error('Original database connection error');
    return new AppException(
      'Failed to fetch user data',
      ErrorType.TECHNICAL,
      'DB_ERROR',
      { userId: 'user-123', operation: 'findById' },
      cause
    );
  })(),
  
  // Three-level nested error with mixed types
  threeLevelError: (() => {
    const level1 = new TypeError('Invalid parameter type');
    const level2 = new AppException(
      'Data processing failed',
      ErrorType.TECHNICAL,
      'PROC_ERROR',
      { step: 'transformation', dataType: 'user-profile' },
      level1
    );
    return new AppException(
      'User profile update failed',
      ErrorType.BUSINESS,
      'PROFILE_ERROR',
      { userId: 'user-456', fields: ['name', 'email', 'preferences'] },
      level2
    );
  })(),
  
  // Deep nested error chain with journey context
  deepNestedError: (() => {
    const dbError = new Error('Database query timeout');
    const repoError = new AppException(
      'Repository operation failed',
      ErrorType.TECHNICAL,
      'REPO_ERROR',
      { repository: 'UserRepository', method: 'findByEmail' },
      dbError
    );
    const serviceError = new AppException(
      'Service operation failed',
      ErrorType.TECHNICAL,
      'SERVICE_ERROR',
      { service: 'AuthService', method: 'validateCredentials' },
      repoError
    );
    const journeyError = new AppException(
      'Health journey authentication failed',
      ErrorType.BUSINESS,
      'HEALTH_AUTH_ERROR',
      { journey: 'health', action: 'viewMedicalRecords' },
      serviceError
    );
    return journeyError;
  })()
};

/**
 * Errors with additional context for testing context enrichment
 */
export const contextualErrors = {
  // Error with request context
  requestError: Object.assign(new Error('Failed to process request'), {
    request: {
      url: '/api/health/metrics',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0'
      },
      body: { metric: 'blood-pressure', value: '120/80' }
    },
    statusCode: 500
  }),
  
  // Error with user context
  userContextError: Object.assign(new AppException(
    'User operation failed',
    ErrorType.BUSINESS,
    'USER_OP_ERROR',
    { operation: 'updatePreferences' }
  ), {
    userContext: {
      userId: 'user-789',
      email: 'user@example.com',
      roles: ['patient'],
      journeys: ['health', 'care']
    }
  }),
  
  // Error with transaction context
  transactionError: Object.assign(new AppException(
    'Transaction failed',
    ErrorType.TECHNICAL,
    'TRANSACTION_ERROR',
    { status: 'FAILED' }
  ), {
    transactionContext: {
      transactionId: 'tx-12345',
      startTime: new Date(Date.now() - 5000).toISOString(),
      endTime: new Date().toISOString(),
      steps: [
        { name: 'validation', status: 'SUCCESS', duration: 45 },
        { name: 'processing', status: 'SUCCESS', duration: 130 },
        { name: 'persistence', status: 'FAILED', duration: 200 }
      ]
    }
  })
};

/**
 * Export all error objects as a single collection
 */
export const allErrors = {
  ...standardErrors,
  ...applicationExceptions,
  ...journeyErrors,
  ...validationErrors,
  ...nestedErrors,
  ...contextualErrors
};