/**
 * Error scenarios for testing error logging in e2e tests.
 * 
 * This file provides a comprehensive set of mock error scenarios for testing
 * how different error conditions are logged, formatted, and categorized by the
 * logging system across all journeys.
 */

import { 
  ValidationError, 
  BusinessError, 
  TechnicalError, 
  ExternalError,
  ResourceNotFoundError,
  InvalidParameterError,
  DatabaseError,
  ExternalApiError,
  TimeoutError,
  ConflictError,
  SchemaValidationError,
  ExternalDependencyUnavailableError
} from '@austa/errors/categories';

import { Health } from '@austa/errors/journey';
import { Care } from '@austa/errors/journey';
import { Plan } from '@austa/errors/journey';

// Mock stack trace for testing error logging
const createMockStackTrace = (errorName: string): string => {
  return `Error: ${errorName}\n` +
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
    '    at async ExceptionsService.handleError (/src/backend/packages/errors/src/exceptions.service.ts:42:3)\n' +
    '    at async errorHandler (/src/backend/packages/errors/src/middleware/error-handler.middleware.ts:28:5)\n' +
    '    at async /src/backend/api-gateway/src/middleware/error.middleware.ts:24:7';
};

/**
 * Client Error Scenarios (4xx)
 * 
 * These errors represent client-side issues such as validation failures,
 * business rule violations, and resource not found conditions.
 */
export const clientErrorScenarios = {
  // Basic validation errors
  validation: {
    missingParameter: new ValidationError('Required parameter "userId" is missing', {
      code: 'VALIDATION_ERROR',
      status: 400,
      context: {
        parameter: 'userId',
        location: 'query'
      },
      stack: createMockStackTrace('ValidationError')
    }),
    
    invalidParameter: new InvalidParameterError('Parameter "email" must be a valid email address', {
      code: 'INVALID_PARAMETER',
      status: 400,
      context: {
        parameter: 'email',
        providedValue: 'not-an-email',
        expectedFormat: 'valid email address'
      },
      stack: createMockStackTrace('InvalidParameterError')
    }),
    
    schemaValidation: new SchemaValidationError('Request body failed validation', {
      code: 'SCHEMA_VALIDATION_ERROR',
      status: 400,
      context: {
        fields: [
          { field: 'name', message: 'Name is required' },
          { field: 'age', message: 'Age must be a positive number' },
          { field: 'email', message: 'Email must be a valid email address' }
        ]
      },
      stack: createMockStackTrace('SchemaValidationError')
    })
  },
  
  // Business logic errors
  business: {
    resourceNotFound: new ResourceNotFoundError('User with ID "123456" not found', {
      code: 'RESOURCE_NOT_FOUND',
      status: 404,
      context: {
        resourceType: 'User',
        resourceId: '123456'
      },
      stack: createMockStackTrace('ResourceNotFoundError')
    }),
    
    conflict: new ConflictError('User with email "user@example.com" already exists', {
      code: 'RESOURCE_CONFLICT',
      status: 409,
      context: {
        resourceType: 'User',
        conflictField: 'email',
        conflictValue: 'user@example.com'
      },
      stack: createMockStackTrace('ConflictError')
    }),
    
    insufficientPermissions: new BusinessError('User does not have permission to access this resource', {
      code: 'INSUFFICIENT_PERMISSIONS',
      status: 403,
      context: {
        requiredPermission: 'ADMIN',
        userPermissions: ['USER', 'VIEWER']
      },
      stack: createMockStackTrace('BusinessError')
    })
  }
};

/**
 * System Error Scenarios (5xx)
 * 
 * These errors represent server-side issues such as database failures,
 * unhandled exceptions, and internal service errors.
 */
export const systemErrorScenarios = {
  database: {
    connectionFailed: new DatabaseError('Failed to connect to database', {
      code: 'DATABASE_CONNECTION_ERROR',
      status: 500,
      context: {
        database: 'postgres',
        host: 'db.example.com',
        port: 5432,
        retryCount: 3
      },
      stack: createMockStackTrace('DatabaseError')
    }),
    
    queryFailed: new DatabaseError('Database query failed', {
      code: 'DATABASE_QUERY_ERROR',
      status: 500,
      context: {
        operation: 'SELECT',
        table: 'users',
        errorCode: 'SQLITE_CONSTRAINT'
      },
      stack: createMockStackTrace('DatabaseError')
    }),
    
    transactionFailed: new DatabaseError('Database transaction failed', {
      code: 'DATABASE_TRANSACTION_ERROR',
      status: 500,
      context: {
        transactionId: 'tx_12345',
        operation: 'COMMIT',
        tables: ['users', 'profiles']
      },
      stack: createMockStackTrace('DatabaseError')
    })
  },
  
  unhandled: {
    nullPointer: new TechnicalError('Cannot read property "id" of undefined', {
      code: 'UNHANDLED_ERROR',
      status: 500,
      context: {
        source: 'UserService.getUserById',
        path: '/api/users/123'
      },
      stack: createMockStackTrace('TypeError')
    }),
    
    memoryLimit: new TechnicalError('JavaScript heap out of memory', {
      code: 'MEMORY_LIMIT_EXCEEDED',
      status: 500,
      context: {
        memoryUsage: {
          rss: '1.2GB',
          heapTotal: '800MB',
          heapUsed: '750MB'
        }
      },
      stack: createMockStackTrace('Error')
    })
  },
  
  timeout: {
    requestTimeout: new TimeoutError('Request processing timed out', {
      code: 'REQUEST_TIMEOUT',
      status: 504,
      context: {
        timeoutMs: 30000,
        operation: 'ProcessLargeDataset',
        requestId: 'req_abcdef123456'
      },
      stack: createMockStackTrace('TimeoutError')
    }),
    
    databaseTimeout: new TimeoutError('Database query timed out', {
      code: 'DATABASE_TIMEOUT',
      status: 504,
      context: {
        timeoutMs: 5000,
        query: 'SELECT * FROM large_table WHERE complex_condition = true',
        database: 'postgres'
      },
      stack: createMockStackTrace('TimeoutError')
    })
  }
};

/**
 * Transient Error Scenarios
 * 
 * These errors represent temporary issues that may resolve on retry,
 * such as network connectivity problems or resource contention.
 */
export const transientErrorScenarios = {
  network: {
    connectionReset: new TechnicalError('Connection reset by peer', {
      code: 'NETWORK_ERROR',
      status: 500,
      context: {
        host: 'api.example.com',
        port: 443,
        protocol: 'https',
        retryable: true
      },
      stack: createMockStackTrace('Error')
    }),
    
    dnsResolutionFailed: new TechnicalError('DNS resolution failed', {
      code: 'DNS_RESOLUTION_ERROR',
      status: 500,
      context: {
        hostname: 'api.example.com',
        retryable: true,
        lastResolved: '2023-05-15T10:30:00Z'
      },
      stack: createMockStackTrace('Error')
    })
  },
  
  resourceContention: {
    databaseLockTimeout: new DatabaseError('Failed to acquire database lock', {
      code: 'DATABASE_LOCK_TIMEOUT',
      status: 500,
      context: {
        table: 'users',
        lockType: 'EXCLUSIVE',
        timeoutMs: 5000,
        retryable: true
      },
      stack: createMockStackTrace('DatabaseError')
    }),
    
    rateLimit: new TechnicalError('Rate limit exceeded', {
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      context: {
        limit: 100,
        period: '1 minute',
        retryAfter: 30,
        retryable: true
      },
      stack: createMockStackTrace('Error')
    })
  }
};

/**
 * External Dependency Error Scenarios
 * 
 * These errors represent failures in external systems and third-party services
 * that the application depends on.
 */
export const externalDependencyErrorScenarios = {
  api: {
    externalApiUnavailable: new ExternalDependencyUnavailableError('External payment API is unavailable', {
      code: 'EXTERNAL_API_UNAVAILABLE',
      status: 503,
      context: {
        service: 'PaymentGateway',
        endpoint: 'https://api.payment.example.com/v1/transactions',
        statusCode: 503,
        retryable: true
      },
      stack: createMockStackTrace('ExternalDependencyUnavailableError')
    }),
    
    externalApiError: new ExternalApiError('External API returned an error', {
      code: 'EXTERNAL_API_ERROR',
      status: 502,
      context: {
        service: 'UserProfileService',
        endpoint: 'https://api.profiles.example.com/v1/users/123',
        statusCode: 400,
        responseBody: '{"error":"Invalid user ID format"}'
      },
      stack: createMockStackTrace('ExternalApiError')
    }),
    
    externalApiTimeout: new TimeoutError('External API request timed out', {
      code: 'EXTERNAL_API_TIMEOUT',
      status: 504,
      context: {
        service: 'NotificationService',
        endpoint: 'https://api.notifications.example.com/v1/send',
        timeoutMs: 10000,
        retryable: true
      },
      stack: createMockStackTrace('TimeoutError')
    })
  },
  
  authentication: {
    externalAuthFailure: new ExternalError('Failed to authenticate with external service', {
      code: 'EXTERNAL_AUTH_FAILURE',
      status: 401,
      context: {
        service: 'IdentityProvider',
        endpoint: 'https://auth.example.com/oauth/token',
        errorCode: 'invalid_client'
      },
      stack: createMockStackTrace('ExternalError')
    })
  }
};

/**
 * Health Journey Error Scenarios
 * 
 * These errors are specific to the Health journey and include errors related to
 * health metrics, goals, insights, devices, and FHIR integration.
 */
export const healthJourneyErrorScenarios = {
  metrics: {
    invalidMetricValue: new Health.Metrics.InvalidMetricValueError('Blood pressure reading is outside valid range', {
      code: 'HEALTH_METRICS_INVALID_VALUE',
      status: 400,
      context: {
        metricType: 'BLOOD_PRESSURE',
        providedValue: { systolic: 300, diastolic: 200 },
        validRange: { systolic: [90, 180], diastolic: [60, 120] }
      },
      stack: createMockStackTrace('InvalidMetricValueError')
    }),
    
    metricStorageFailed: new Health.Metrics.MetricPersistenceError('Failed to store health metric', {
      code: 'HEALTH_METRICS_STORAGE_FAILED',
      status: 500,
      context: {
        metricType: 'HEART_RATE',
        userId: 'user_12345',
        operation: 'INSERT'
      },
      stack: createMockStackTrace('MetricPersistenceError')
    })
  },
  
  goals: {
    goalNotFound: new Health.Goals.GoalNotFoundError('Health goal not found', {
      code: 'HEALTH_GOALS_NOT_FOUND',
      status: 404,
      context: {
        goalId: 'goal_12345',
        userId: 'user_12345',
        goalType: 'STEPS'
      },
      stack: createMockStackTrace('GoalNotFoundError')
    }),
    
    invalidGoalParameters: new Health.Goals.InvalidGoalParametersError('Invalid goal parameters', {
      code: 'HEALTH_GOALS_INVALID_PARAMETERS',
      status: 400,
      context: {
        goalType: 'WEIGHT_LOSS',
        targetValue: -10,
        timeframe: '1 week',
        reason: 'Target weight loss exceeds safe weekly limit'
      },
      stack: createMockStackTrace('InvalidGoalParametersError')
    })
  },
  
  devices: {
    deviceConnectionFailed: new Health.Devices.DeviceConnectionFailureError('Failed to connect to fitness tracker', {
      code: 'HEALTH_DEVICES_CONNECTION_FAILED',
      status: 500,
      context: {
        deviceType: 'FITBIT',
        deviceId: 'fb_12345',
        userId: 'user_12345',
        errorCode: 'AUTH_EXPIRED'
      },
      stack: createMockStackTrace('DeviceConnectionFailureError')
    }),
    
    synchronizationFailed: new Health.Devices.SynchronizationFailedError('Failed to synchronize data from device', {
      code: 'HEALTH_DEVICES_SYNC_FAILED',
      status: 500,
      context: {
        deviceType: 'APPLE_WATCH',
        deviceId: 'aw_12345',
        userId: 'user_12345',
        lastSyncTime: '2023-05-15T10:30:00Z',
        dataTypes: ['STEPS', 'HEART_RATE', 'SLEEP']
      },
      stack: createMockStackTrace('SynchronizationFailedError')
    })
  },
  
  fhir: {
    fhirConnectionFailure: new Health.Fhir.FhirConnectionFailureError('Failed to connect to FHIR server', {
      code: 'HEALTH_FHIR_CONNECTION_FAILED',
      status: 503,
      context: {
        endpoint: 'https://fhir.hospital.example.com/api/fhir/r4',
        operation: 'GET',
        resourceType: 'Patient',
        statusCode: 503
      },
      stack: createMockStackTrace('FhirConnectionFailureError')
    }),
    
    invalidResource: new Health.Fhir.InvalidResourceError('Invalid FHIR resource', {
      code: 'HEALTH_FHIR_INVALID_RESOURCE',
      status: 400,
      context: {
        resourceType: 'Observation',
        validationErrors: [
          'Missing required field: status',
          'Invalid code system: http://invalid-system.org'
        ]
      },
      stack: createMockStackTrace('InvalidResourceError')
    })
  }
};

/**
 * Care Journey Error Scenarios
 * 
 * These errors are specific to the Care journey and include errors related to
 * appointments, providers, telemedicine, medications, symptoms, and treatments.
 */
export const careJourneyErrorScenarios = {
  appointments: {
    appointmentNotFound: new Care.AppointmentNotFoundError('Appointment not found', {
      code: 'CARE_APPOINTMENT_NOT_FOUND',
      status: 404,
      context: {
        appointmentId: 'appt_12345',
        userId: 'user_12345'
      },
      stack: createMockStackTrace('AppointmentNotFoundError')
    }),
    
    appointmentOverlap: new Care.AppointmentOverlapError('Appointment overlaps with existing appointment', {
      code: 'CARE_APPOINTMENT_OVERLAP',
      status: 409,
      context: {
        requestedTime: '2023-06-15T14:00:00Z',
        existingAppointmentId: 'appt_67890',
        existingAppointmentTime: '2023-06-15T13:30:00Z',
        duration: 60
      },
      stack: createMockStackTrace('AppointmentOverlapError')
    }),
    
    appointmentPersistenceError: new Care.AppointmentPersistenceError('Failed to save appointment', {
      code: 'CARE_APPOINTMENT_PERSISTENCE_ERROR',
      status: 500,
      context: {
        appointmentId: 'appt_12345',
        operation: 'INSERT',
        databaseError: 'Unique constraint violation'
      },
      stack: createMockStackTrace('AppointmentPersistenceError')
    })
  },
  
  providers: {
    providerNotFound: new Care.ProviderNotFoundError('Provider not found', {
      code: 'CARE_PROVIDER_NOT_FOUND',
      status: 404,
      context: {
        providerId: 'provider_12345',
        specialtyRequested: 'CARDIOLOGY'
      },
      stack: createMockStackTrace('ProviderNotFoundError')
    }),
    
    providerUnavailable: new Care.ProviderUnavailableError('Provider is not available at requested time', {
      code: 'CARE_PROVIDER_UNAVAILABLE',
      status: 409,
      context: {
        providerId: 'provider_12345',
        requestedTime: '2023-06-15T14:00:00Z',
        nextAvailableTime: '2023-06-16T10:00:00Z'
      },
      stack: createMockStackTrace('ProviderUnavailableError')
    })
  },
  
  telemedicine: {
    connectionError: new Care.TelemedicineConnectionError('Failed to establish telemedicine connection', {
      code: 'CARE_TELEMEDICINE_CONNECTION_ERROR',
      status: 500,
      context: {
        sessionId: 'session_12345',
        errorCode: 'ICE_NEGOTIATION_FAILED',
        browser: 'Chrome 90.0.4430.212',
        networkType: 'wifi'
      },
      stack: createMockStackTrace('TelemedicineConnectionError')
    }),
    
    deviceError: new Care.TelemedicineDeviceError('Failed to access media devices', {
      code: 'CARE_TELEMEDICINE_DEVICE_ERROR',
      status: 400,
      context: {
        deviceType: 'CAMERA',
        errorName: 'NotAllowedError',
        errorMessage: 'Permission denied'
      },
      stack: createMockStackTrace('TelemedicineDeviceError')
    })
  },
  
  medications: {
    medicationNotFound: new Care.MedicationNotFoundError('Medication not found', {
      code: 'CARE_MEDICATION_NOT_FOUND',
      status: 404,
      context: {
        medicationId: 'med_12345',
        userId: 'user_12345'
      },
      stack: createMockStackTrace('MedicationNotFoundError')
    }),
    
    medicationInteractionError: new Care.MedicationInteractionError('Potential medication interaction detected', {
      code: 'CARE_MEDICATION_INTERACTION',
      status: 409,
      context: {
        medications: ['Warfarin', 'Aspirin'],
        interactionSeverity: 'HIGH',
        interactionDescription: 'Increased risk of bleeding'
      },
      stack: createMockStackTrace('MedicationInteractionError')
    })
  }
};

/**
 * Plan Journey Error Scenarios
 * 
 * These errors are specific to the Plan journey and include errors related to
 * plans, benefits, coverage, claims, and documents.
 */
export const planJourneyErrorScenarios = {
  plans: {
    planNotFound: new Plan.Plans.PlanNotFoundError('Insurance plan not found', {
      code: 'PLAN_NOT_FOUND',
      status: 404,
      context: {
        planId: 'plan_12345',
        userId: 'user_12345'
      },
      stack: createMockStackTrace('PlanNotFoundError')
    }),
    
    planNotAvailableInRegion: new Plan.Plans.PlanNotAvailableInRegionError('Plan not available in user\'s region', {
      code: 'PLAN_NOT_AVAILABLE_IN_REGION',
      status: 400,
      context: {
        planId: 'plan_12345',
        userRegion: 'CA',
        availableRegions: ['NY', 'TX', 'FL']
      },
      stack: createMockStackTrace('PlanNotAvailableInRegionError')
    })
  },
  
  benefits: {
    benefitNotFound: new Plan.Benefits.BenefitNotFoundError('Benefit not found', {
      code: 'BENEFIT_NOT_FOUND',
      status: 404,
      context: {
        benefitId: 'benefit_12345',
        planId: 'plan_12345'
      },
      stack: createMockStackTrace('BenefitNotFoundError')
    }),
    
    benefitLimitExceeded: new Plan.Benefits.BenefitLimitExceededError('Benefit limit exceeded', {
      code: 'BENEFIT_LIMIT_EXCEEDED',
      status: 400,
      context: {
        benefitId: 'benefit_12345',
        benefitType: 'PHYSICAL_THERAPY',
        limit: 20,
        used: 20,
        remaining: 0
      },
      stack: createMockStackTrace('BenefitLimitExceededError')
    })
  },
  
  claims: {
    claimNotFound: new Plan.Claims.ClaimNotFoundError('Claim not found', {
      code: 'CLAIM_NOT_FOUND',
      status: 404,
      context: {
        claimId: 'claim_12345',
        userId: 'user_12345'
      },
      stack: createMockStackTrace('ClaimNotFoundError')
    }),
    
    claimDenied: new Plan.Claims.ClaimDeniedError('Claim was denied', {
      code: 'CLAIM_DENIED',
      status: 400,
      context: {
        claimId: 'claim_12345',
        denialReason: 'SERVICE_NOT_COVERED',
        denialCode: 'NC001',
        appealDeadline: '2023-07-15T00:00:00Z'
      },
      stack: createMockStackTrace('ClaimDeniedError')
    }),
    
    duplicateClaim: new Plan.Claims.DuplicateClaimError('Duplicate claim submission detected', {
      code: 'DUPLICATE_CLAIM',
      status: 409,
      context: {
        claimId: 'claim_12345',
        existingClaimId: 'claim_67890',
        serviceDate: '2023-05-10T00:00:00Z',
        providerId: 'provider_12345'
      },
      stack: createMockStackTrace('DuplicateClaimError')
    })
  },
  
  documents: {
    documentNotFound: new Plan.Documents.DocumentNotFoundError('Document not found', {
      code: 'DOCUMENT_NOT_FOUND',
      status: 404,
      context: {
        documentId: 'doc_12345',
        userId: 'user_12345'
      },
      stack: createMockStackTrace('DocumentNotFoundError')
    }),
    
    documentFormatError: new Plan.Documents.DocumentFormatError('Invalid document format', {
      code: 'DOCUMENT_FORMAT_ERROR',
      status: 400,
      context: {
        documentId: 'doc_12345',
        providedFormat: 'bmp',
        supportedFormats: ['pdf', 'jpg', 'png']
      },
      stack: createMockStackTrace('DocumentFormatError')
    })
  }
};

/**
 * Combined error scenarios for easy access in tests
 */
export const allErrorScenarios = {
  client: clientErrorScenarios,
  system: systemErrorScenarios,
  transient: transientErrorScenarios,
  external: externalDependencyErrorScenarios,
  health: healthJourneyErrorScenarios,
  care: careJourneyErrorScenarios,
  plan: planJourneyErrorScenarios
};