import { 
  ErrorType, 
  HealthErrorType, 
  CareErrorType, 
  PlanErrorType, 
  ErrorRecoveryStrategy,
  ErrorMetadata,
  ErrorContext,
  SerializedError,
  ErrorSeverity
} from '../../src/types';

/**
 * This file provides standardized test fixtures for error metadata, context, and serialization.
 * It centralizes all test data related to error handling, ensuring consistent testing across the application.
 */

// ==========================================
// USER CONTEXT SAMPLES
// ==========================================

/**
 * Sample user contexts for testing error enrichment with user information
 */
export const USER_CONTEXTS = {
  /**
   * Authenticated patient user context
   */
  AUTHENTICATED_PATIENT: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'patient@example.com',
    role: 'patient',
    isAuthenticated: true,
    sessionId: 'sess_12345',
    deviceId: 'dev_abcdef',
    permissions: ['read:health', 'write:health', 'read:care', 'write:care', 'read:plan']
  },

  /**
   * Authenticated provider user context
   */
  AUTHENTICATED_PROVIDER: {
    userId: '223e4567-e89b-12d3-a456-426614174001',
    email: 'doctor@example.com',
    role: 'provider',
    isAuthenticated: true,
    sessionId: 'sess_67890',
    deviceId: 'dev_ghijkl',
    permissions: ['read:health', 'write:health', 'read:care', 'write:care', 'manage:appointments']
  },

  /**
   * Authenticated admin user context
   */
  AUTHENTICATED_ADMIN: {
    userId: '323e4567-e89b-12d3-a456-426614174002',
    email: 'admin@example.com',
    role: 'admin',
    isAuthenticated: true,
    sessionId: 'sess_admin123',
    deviceId: 'dev_mnopqr',
    permissions: ['admin:all']
  },

  /**
   * Anonymous user context
   */
  ANONYMOUS: {
    userId: undefined,
    email: undefined,
    role: 'anonymous',
    isAuthenticated: false,
    sessionId: undefined,
    deviceId: 'dev_unknown',
    permissions: []
  },

  /**
   * User with expired session
   */
  EXPIRED_SESSION: {
    userId: '423e4567-e89b-12d3-a456-426614174003',
    email: 'expired@example.com',
    role: 'patient',
    isAuthenticated: false,
    sessionId: 'sess_expired',
    deviceId: 'dev_stuvwx',
    permissions: [],
    sessionExpired: true
  }
};

// ==========================================
// REQUEST METADATA SAMPLES
// ==========================================

/**
 * Sample request metadata for testing error enrichment with request information
 */
export const REQUEST_METADATA = {
  /**
   * Health journey API request
   */
  HEALTH_API_REQUEST: {
    method: 'GET',
    path: '/api/health/metrics',
    headers: {
      'x-request-id': 'req_health_123',
      'x-correlation-id': 'corr_456',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      'content-type': 'application/json',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    query: { period: 'week' },
    ip: '192.168.1.1',
    timestamp: new Date('2023-05-15T10:30:00Z')
  },

  /**
   * Care journey API request
   */
  CARE_API_REQUEST: {
    method: 'POST',
    path: '/api/care/appointments',
    headers: {
      'x-request-id': 'req_care_456',
      'x-correlation-id': 'corr_789',
      'user-agent': 'Mozilla/5.0 (Linux; Android 11; SM-G998B)',
      'content-type': 'application/json',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    body: {
      providerId: 'prov_123',
      date: '2023-06-01',
      time: '14:30',
      type: 'consultation'
    },
    ip: '192.168.1.2',
    timestamp: new Date('2023-05-16T14:45:00Z')
  },

  /**
   * Plan journey API request
   */
  PLAN_API_REQUEST: {
    method: 'POST',
    path: '/api/plan/claims',
    headers: {
      'x-request-id': 'req_plan_789',
      'x-correlation-id': 'corr_012',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'content-type': 'application/json',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    body: {
      serviceDate: '2023-04-15',
      providerId: 'prov_456',
      amount: 150.75,
      description: 'Annual physical exam'
    },
    ip: '192.168.1.3',
    timestamp: new Date('2023-05-17T09:15:00Z')
  },

  /**
   * Authentication request
   */
  AUTH_REQUEST: {
    method: 'POST',
    path: '/api/auth/login',
    headers: {
      'x-request-id': 'req_auth_012',
      'x-correlation-id': 'corr_345',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'content-type': 'application/json'
    },
    body: {
      email: 'user@example.com',
      password: '[REDACTED]'
    },
    ip: '192.168.1.4',
    timestamp: new Date('2023-05-18T16:20:00Z')
  },

  /**
   * GraphQL API request
   */
  GRAPHQL_REQUEST: {
    method: 'POST',
    path: '/graphql',
    headers: {
      'x-request-id': 'req_gql_345',
      'x-correlation-id': 'corr_678',
      'user-agent': 'Apollo GraphQL Client',
      'content-type': 'application/json',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    body: {
      query: `query GetUserProfile($userId: ID!) {
        userProfile(userId: $userId) {
          id
          name
          email
        }
      }`,
      variables: { userId: '123e4567-e89b-12d3-a456-426614174000' }
    },
    ip: '192.168.1.5',
    timestamp: new Date('2023-05-19T11:10:00Z')
  }
};

// ==========================================
// ERROR CONTEXT SAMPLES
// ==========================================

/**
 * Sample error contexts for testing error enrichment with contextual information
 */
export const ERROR_CONTEXTS: Record<string, ErrorContext> = {
  /**
   * Health journey error context
   */
  HEALTH_CONTEXT: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    requestId: 'req_health_123',
    traceId: 'trace_health_abc',
    journey: 'health',
    operation: 'getHealthMetrics',
    resource: 'healthMetric',
    data: {
      metricType: 'bloodPressure',
      period: 'week',
      deviceId: 'dev_fitbit_123'
    }
  },

  /**
   * Care journey error context
   */
  CARE_CONTEXT: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    requestId: 'req_care_456',
    traceId: 'trace_care_def',
    journey: 'care',
    operation: 'bookAppointment',
    resource: 'appointment',
    data: {
      providerId: 'prov_123',
      appointmentDate: '2023-06-01',
      appointmentTime: '14:30',
      appointmentType: 'consultation'
    }
  },

  /**
   * Plan journey error context
   */
  PLAN_CONTEXT: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    requestId: 'req_plan_789',
    traceId: 'trace_plan_ghi',
    journey: 'plan',
    operation: 'submitClaim',
    resource: 'claim',
    data: {
      claimId: 'claim_123',
      serviceDate: '2023-04-15',
      amount: 150.75
    }
  },

  /**
   * Authentication error context
   */
  AUTH_CONTEXT: {
    requestId: 'req_auth_012',
    traceId: 'trace_auth_jkl',
    operation: 'login',
    data: {
      email: 'user@example.com',
      attemptCount: 3
    }
  },

  /**
   * Database operation error context
   */
  DATABASE_CONTEXT: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    requestId: 'req_db_678',
    traceId: 'trace_db_mno',
    operation: 'databaseQuery',
    resource: 'user',
    data: {
      query: 'SELECT * FROM users WHERE id = ?',
      parameters: ['123e4567-e89b-12d3-a456-426614174000'],
      databaseName: 'austa_users'
    }
  },

  /**
   * External API error context
   */
  EXTERNAL_API_CONTEXT: {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    requestId: 'req_ext_901',
    traceId: 'trace_ext_pqr',
    operation: 'fetchExternalData',
    resource: 'fhirPatient',
    data: {
      externalApiUrl: 'https://fhir-api.example.com/patients/123',
      method: 'GET',
      statusCode: 503,
      responseTime: 5432
    }
  }
};

// ==========================================
// ERROR METADATA SAMPLES
// ==========================================

/**
 * Sample error metadata for testing error classification and handling
 */
export const ERROR_METADATA: Record<string, ErrorMetadata> = {
  /**
   * Validation error metadata
   */
  VALIDATION_ERROR: {
    code: 'HEALTH_001',
    type: ErrorType.VALIDATION,
    journeyType: HealthErrorType.METRIC_RECORDING,
    recoveryStrategy: ErrorRecoveryStrategy.DEFAULT_BEHAVIOR,
    retryable: false,
    loggable: true,
    alertable: false,
    source: 'health-service',
    timestamp: new Date('2023-05-15T10:30:15Z')
  },

  /**
   * Authentication error metadata
   */
  AUTHENTICATION_ERROR: {
    code: 'AUTH_001',
    type: ErrorType.AUTHENTICATION,
    retryable: false,
    loggable: true,
    alertable: false,
    source: 'auth-service',
    timestamp: new Date('2023-05-18T16:20:30Z')
  },

  /**
   * Authorization error metadata
   */
  AUTHORIZATION_ERROR: {
    code: 'CARE_001',
    type: ErrorType.AUTHORIZATION,
    journeyType: CareErrorType.APPOINTMENT_BOOKING,
    retryable: false,
    loggable: true,
    alertable: true,
    source: 'care-service',
    timestamp: new Date('2023-05-16T14:45:30Z')
  },

  /**
   * Not found error metadata
   */
  NOT_FOUND_ERROR: {
    code: 'PLAN_001',
    type: ErrorType.NOT_FOUND,
    journeyType: PlanErrorType.CLAIM_SUBMISSION,
    recoveryStrategy: ErrorRecoveryStrategy.DEFAULT_BEHAVIOR,
    retryable: false,
    loggable: true,
    alertable: false,
    source: 'plan-service',
    timestamp: new Date('2023-05-17T09:15:45Z')
  },

  /**
   * Business logic error metadata
   */
  BUSINESS_ERROR: {
    code: 'CARE_002',
    type: ErrorType.BUSINESS,
    journeyType: CareErrorType.PROVIDER_AVAILABILITY,
    recoveryStrategy: ErrorRecoveryStrategy.DEFAULT_BEHAVIOR,
    retryable: false,
    loggable: true,
    alertable: false,
    source: 'care-service',
    timestamp: new Date('2023-05-16T14:46:00Z')
  },

  /**
   * Technical error metadata
   */
  TECHNICAL_ERROR: {
    code: 'SYSTEM_001',
    type: ErrorType.TECHNICAL,
    recoveryStrategy: ErrorRecoveryStrategy.RETRY,
    retryable: true,
    loggable: true,
    alertable: true,
    source: 'api-gateway',
    timestamp: new Date('2023-05-19T11:10:30Z')
  },

  /**
   * External system error metadata
   */
  EXTERNAL_ERROR: {
    code: 'HEALTH_002',
    type: ErrorType.EXTERNAL,
    journeyType: HealthErrorType.FHIR_INTEGRATION,
    recoveryStrategy: ErrorRecoveryStrategy.CIRCUIT_BREAKER,
    retryable: true,
    loggable: true,
    alertable: true,
    source: 'health-service',
    timestamp: new Date('2023-05-15T10:31:00Z')
  },

  /**
   * Timeout error metadata
   */
  TIMEOUT_ERROR: {
    code: 'PLAN_002',
    type: ErrorType.TIMEOUT,
    journeyType: PlanErrorType.INSURANCE_INTEGRATION,
    recoveryStrategy: ErrorRecoveryStrategy.RETRY,
    retryable: true,
    loggable: true,
    alertable: true,
    source: 'plan-service',
    timestamp: new Date('2023-05-17T09:16:30Z')
  },

  /**
   * Rate limit error metadata
   */
  RATE_LIMIT_ERROR: {
    code: 'SYSTEM_002',
    type: ErrorType.RATE_LIMIT,
    recoveryStrategy: ErrorRecoveryStrategy.GRACEFUL_DEGRADATION,
    retryable: true,
    loggable: true,
    alertable: false,
    source: 'api-gateway',
    timestamp: new Date('2023-05-19T11:11:00Z')
  }
};

// ==========================================
// SERIALIZED ERROR SAMPLES
// ==========================================

/**
 * Sample serialized errors for testing error serialization and client responses
 */
export const SERIALIZED_ERRORS: Record<string, SerializedError> = {
  /**
   * Serialized validation error
   */
  VALIDATION_ERROR: {
    error: {
      type: ErrorType.VALIDATION,
      code: 'HEALTH_001',
      message: 'Invalid blood pressure value. Systolic pressure must be a number between 70 and 190.',
      journey: 'health',
      details: {
        field: 'systolicPressure',
        value: 'abc',
        constraint: 'number between 70 and 190'
      },
      requestId: 'req_health_123',
      timestamp: '2023-05-15T10:30:15Z'
    }
  },

  /**
   * Serialized authentication error
   */
  AUTHENTICATION_ERROR: {
    error: {
      type: ErrorType.AUTHENTICATION,
      code: 'AUTH_001',
      message: 'Authentication failed. Invalid credentials provided.',
      details: {
        reason: 'invalid_credentials',
        attemptCount: 3
      },
      requestId: 'req_auth_012',
      timestamp: '2023-05-18T16:20:30Z'
    }
  },

  /**
   * Serialized authorization error
   */
  AUTHORIZATION_ERROR: {
    error: {
      type: ErrorType.AUTHORIZATION,
      code: 'CARE_001',
      message: 'You do not have permission to book appointments for this provider.',
      journey: 'care',
      details: {
        requiredPermission: 'book:appointment:provider:prov_123',
        userPermissions: ['book:appointment:provider:prov_456']
      },
      requestId: 'req_care_456',
      timestamp: '2023-05-16T14:45:30Z'
    }
  },

  /**
   * Serialized not found error
   */
  NOT_FOUND_ERROR: {
    error: {
      type: ErrorType.NOT_FOUND,
      code: 'PLAN_001',
      message: 'Claim with ID claim_789 not found.',
      journey: 'plan',
      details: {
        resourceType: 'claim',
        resourceId: 'claim_789'
      },
      requestId: 'req_plan_789',
      timestamp: '2023-05-17T09:15:45Z'
    }
  },

  /**
   * Serialized business logic error
   */
  BUSINESS_ERROR: {
    error: {
      type: ErrorType.BUSINESS,
      code: 'CARE_002',
      message: 'Provider is not available at the requested time.',
      journey: 'care',
      details: {
        providerId: 'prov_123',
        requestedDate: '2023-06-01',
        requestedTime: '14:30',
        availableTimes: ['09:00', '10:30', '16:00']
      },
      requestId: 'req_care_456',
      timestamp: '2023-05-16T14:46:00Z'
    }
  },

  /**
   * Serialized technical error
   */
  TECHNICAL_ERROR: {
    error: {
      type: ErrorType.TECHNICAL,
      code: 'SYSTEM_001',
      message: 'An unexpected error occurred while processing your request.',
      details: {
        retryable: true,
        suggestedAction: 'Please try again later.'
      },
      requestId: 'req_gql_345',
      timestamp: '2023-05-19T11:10:30Z'
    }
  },

  /**
   * Serialized external system error
   */
  EXTERNAL_ERROR: {
    error: {
      type: ErrorType.EXTERNAL,
      code: 'HEALTH_002',
      message: 'Unable to connect to FHIR API.',
      journey: 'health',
      details: {
        externalSystem: 'FHIR API',
        statusCode: 503,
        retryable: true,
        suggestedAction: 'Please try again later.'
      },
      requestId: 'req_health_123',
      timestamp: '2023-05-15T10:31:00Z'
    }
  },

  /**
   * Serialized timeout error
   */
  TIMEOUT_ERROR: {
    error: {
      type: ErrorType.TIMEOUT,
      code: 'PLAN_002',
      message: 'Request to insurance provider timed out.',
      journey: 'plan',
      details: {
        operation: 'verifyClaimEligibility',
        timeoutAfter: '5000ms',
        retryable: true,
        suggestedAction: 'Please try again later.'
      },
      requestId: 'req_plan_789',
      timestamp: '2023-05-17T09:16:30Z'
    }
  },

  /**
   * Serialized rate limit error
   */
  RATE_LIMIT_ERROR: {
    error: {
      type: ErrorType.RATE_LIMIT,
      code: 'SYSTEM_002',
      message: 'Too many requests. Please try again later.',
      details: {
        rateLimit: '100 requests per minute',
        retryAfter: '30 seconds',
        suggestedAction: 'Please reduce request frequency.'
      },
      requestId: 'req_gql_345',
      timestamp: '2023-05-19T11:11:00Z'
    }
  }
};

// ==========================================
// ERROR CLASSIFICATION SAMPLES
// ==========================================

/**
 * Sample error classifications for testing error categorization and reporting
 */
export const ERROR_CLASSIFICATIONS = {
  /**
   * Validation error classification
   */
  VALIDATION_ERROR: {
    type: ErrorType.VALIDATION,
    journeyType: HealthErrorType.METRIC_RECORDING,
    severity: 'LOW' as ErrorSeverity,
    expected: true,
    requiresAttention: false,
    category: 'input_validation'
  },

  /**
   * Authentication error classification
   */
  AUTHENTICATION_ERROR: {
    type: ErrorType.AUTHENTICATION,
    severity: 'MEDIUM' as ErrorSeverity,
    expected: true,
    requiresAttention: false,
    category: 'security'
  },

  /**
   * Authorization error classification
   */
  AUTHORIZATION_ERROR: {
    type: ErrorType.AUTHORIZATION,
    journeyType: CareErrorType.APPOINTMENT_BOOKING,
    severity: 'MEDIUM' as ErrorSeverity,
    expected: true,
    requiresAttention: true,
    category: 'security'
  },

  /**
   * Not found error classification
   */
  NOT_FOUND_ERROR: {
    type: ErrorType.NOT_FOUND,
    journeyType: PlanErrorType.CLAIM_SUBMISSION,
    severity: 'LOW' as ErrorSeverity,
    expected: true,
    requiresAttention: false,
    category: 'resource_access'
  },

  /**
   * Business logic error classification
   */
  BUSINESS_ERROR: {
    type: ErrorType.BUSINESS,
    journeyType: CareErrorType.PROVIDER_AVAILABILITY,
    severity: 'LOW' as ErrorSeverity,
    expected: true,
    requiresAttention: false,
    category: 'business_rule'
  },

  /**
   * Technical error classification
   */
  TECHNICAL_ERROR: {
    type: ErrorType.TECHNICAL,
    severity: 'HIGH' as ErrorSeverity,
    expected: false,
    requiresAttention: true,
    category: 'system_error'
  },

  /**
   * External system error classification
   */
  EXTERNAL_ERROR: {
    type: ErrorType.EXTERNAL,
    journeyType: HealthErrorType.FHIR_INTEGRATION,
    severity: 'HIGH' as ErrorSeverity,
    expected: false,
    requiresAttention: true,
    category: 'external_dependency'
  },

  /**
   * Timeout error classification
   */
  TIMEOUT_ERROR: {
    type: ErrorType.TIMEOUT,
    journeyType: PlanErrorType.INSURANCE_INTEGRATION,
    severity: 'HIGH' as ErrorSeverity,
    expected: false,
    requiresAttention: true,
    category: 'performance'
  },

  /**
   * Rate limit error classification
   */
  RATE_LIMIT_ERROR: {
    type: ErrorType.RATE_LIMIT,
    severity: 'MEDIUM' as ErrorSeverity,
    expected: true,
    requiresAttention: false,
    category: 'throttling'
  }
};

// ==========================================
// JOURNEY-SPECIFIC ERROR SAMPLES
// ==========================================

/**
 * Health journey specific error samples
 */
export const HEALTH_ERRORS = {
  /**
   * Device connection error
   */
  DEVICE_CONNECTION_ERROR: {
    context: {
      ...ERROR_CONTEXTS.HEALTH_CONTEXT,
      data: {
        ...ERROR_CONTEXTS.HEALTH_CONTEXT.data,
        deviceType: 'fitbit',
        connectionAttempts: 3,
        lastError: 'BLUETOOTH_UNAVAILABLE'
      }
    },
    metadata: {
      ...ERROR_METADATA.EXTERNAL_ERROR,
      code: 'HEALTH_003',
      journeyType: HealthErrorType.DEVICE_CONNECTION
    },
    serialized: {
      error: {
        type: ErrorType.EXTERNAL,
        code: 'HEALTH_003',
        message: 'Unable to connect to Fitbit device.',
        journey: 'health',
        details: {
          deviceType: 'fitbit',
          connectionAttempts: 3,
          lastError: 'BLUETOOTH_UNAVAILABLE',
          suggestedAction: 'Please ensure Bluetooth is enabled and try again.'
        },
        requestId: 'req_health_123',
        timestamp: '2023-05-15T10:31:00Z'
      }
    }
  },

  /**
   * Health goal tracking error
   */
  GOAL_TRACKING_ERROR: {
    context: {
      ...ERROR_CONTEXTS.HEALTH_CONTEXT,
      operation: 'updateGoalProgress',
      resource: 'healthGoal',
      data: {
        goalId: 'goal_123',
        goalType: 'steps',
        currentValue: 'invalid',
        targetValue: 10000
      }
    },
    metadata: {
      ...ERROR_METADATA.VALIDATION_ERROR,
      code: 'HEALTH_004',
      journeyType: HealthErrorType.GOAL_TRACKING
    },
    serialized: {
      error: {
        type: ErrorType.VALIDATION,
        code: 'HEALTH_004',
        message: 'Invalid step count value. Steps must be a positive number.',
        journey: 'health',
        details: {
          field: 'currentValue',
          value: 'invalid',
          constraint: 'positive number'
        },
        requestId: 'req_health_123',
        timestamp: '2023-05-15T10:30:15Z'
      }
    }
  }
};

/**
 * Care journey specific error samples
 */
export const CARE_ERRORS = {
  /**
   * Telemedicine session error
   */
  TELEMEDICINE_SESSION_ERROR: {
    context: {
      ...ERROR_CONTEXTS.CARE_CONTEXT,
      operation: 'joinTelemedicineSession',
      resource: 'telemedicineSession',
      data: {
        sessionId: 'tele_123',
        providerId: 'prov_123',
        mediaPermissions: { camera: false, microphone: true }
      }
    },
    metadata: {
      ...ERROR_METADATA.TECHNICAL_ERROR,
      code: 'CARE_003',
      journeyType: CareErrorType.TELEMEDICINE_SESSION
    },
    serialized: {
      error: {
        type: ErrorType.TECHNICAL,
        code: 'CARE_003',
        message: 'Unable to join telemedicine session. Camera access is required.',
        journey: 'care',
        details: {
          sessionId: 'tele_123',
          missingPermissions: ['camera'],
          suggestedAction: 'Please allow camera access and try again.'
        },
        requestId: 'req_care_456',
        timestamp: '2023-05-16T14:45:30Z'
      }
    }
  },

  /**
   * Medication tracking error
   */
  MEDICATION_TRACKING_ERROR: {
    context: {
      ...ERROR_CONTEXTS.CARE_CONTEXT,
      operation: 'recordMedicationIntake',
      resource: 'medication',
      data: {
        medicationId: 'med_123',
        dosage: '10mg',
        timestamp: '2023-05-16T08:00:00Z'
      }
    },
    metadata: {
      ...ERROR_METADATA.BUSINESS_ERROR,
      code: 'CARE_004',
      journeyType: CareErrorType.MEDICATION_TRACKING
    },
    serialized: {
      error: {
        type: ErrorType.BUSINESS,
        code: 'CARE_004',
        message: 'Medication intake already recorded for this time.',
        journey: 'care',
        details: {
          medicationId: 'med_123',
          dosage: '10mg',
          timestamp: '2023-05-16T08:00:00Z',
          previousRecord: '2023-05-16T07:58:30Z'
        },
        requestId: 'req_care_456',
        timestamp: '2023-05-16T14:46:00Z'
      }
    }
  }
};

/**
 * Plan journey specific error samples
 */
export const PLAN_ERRORS = {
  /**
   * Claim submission error
   */
  CLAIM_SUBMISSION_ERROR: {
    context: {
      ...ERROR_CONTEXTS.PLAN_CONTEXT,
      data: {
        claimId: 'claim_123',
        serviceDate: '2023-04-15',
        amount: -150.75
      }
    },
    metadata: {
      ...ERROR_METADATA.VALIDATION_ERROR,
      code: 'PLAN_003',
      journeyType: PlanErrorType.CLAIM_SUBMISSION
    },
    serialized: {
      error: {
        type: ErrorType.VALIDATION,
        code: 'PLAN_003',
        message: 'Invalid claim amount. Amount must be a positive number.',
        journey: 'plan',
        details: {
          field: 'amount',
          value: -150.75,
          constraint: 'positive number'
        },
        requestId: 'req_plan_789',
        timestamp: '2023-05-17T09:15:45Z'
      }
    }
  },

  /**
   * Document upload error
   */
  DOCUMENT_UPLOAD_ERROR: {
    context: {
      ...ERROR_CONTEXTS.PLAN_CONTEXT,
      operation: 'uploadClaimDocument',
      resource: 'document',
      data: {
        claimId: 'claim_123',
        documentType: 'receipt',
        fileSize: 15000000,
        fileType: 'image/jpeg'
      }
    },
    metadata: {
      ...ERROR_METADATA.VALIDATION_ERROR,
      code: 'PLAN_004',
      journeyType: PlanErrorType.DOCUMENT_UPLOAD
    },
    serialized: {
      error: {
        type: ErrorType.VALIDATION,
        code: 'PLAN_004',
        message: 'File size exceeds the maximum allowed limit of 10MB.',
        journey: 'plan',
        details: {
          field: 'fileSize',
          value: 15000000,
          constraint: 'maximum 10MB (10000000 bytes)',
          suggestedAction: 'Please reduce the file size and try again.'
        },
        requestId: 'req_plan_789',
        timestamp: '2023-05-17T09:15:45Z'
      }
    }
  }
};