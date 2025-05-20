import { ErrorType, AppException } from '@austa/shared/exceptions';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Comprehensive set of mock error scenarios for testing error logging.
 * Provides different error types (client errors, system errors, transient errors, external dependency errors)
 * with various contextual information for testing how different error conditions are logged, formatted,
 * and categorized by the logging system across all journeys.
 */

/**
 * Client error scenarios (4xx status codes)
 * These represent errors caused by invalid client requests or input.
 * Typically logged at DEBUG or INFO level as they are expected errors.
 */
export const clientErrorScenarios = {
  // Basic validation error (400 Bad Request)
  basicValidationError: {
    error: new AppException(
      'Invalid input data',
      ErrorType.VALIDATION,
      'VAL_400_001',
      { fields: ['username', 'email'] }
    ),
    expectedStatusCode: 400,
    expectedLogLevel: LogLevel.DEBUG,
    expectedLogMessage: 'Validation error: Invalid input data',
    userFriendlyMessage: 'Please check your input and try again.',
    journeyContext: null // Generic error not specific to any journey
  },

  // Authentication error (401 Unauthorized)
  authenticationError: {
    error: new AppException(
      'Invalid credentials',
      ErrorType.AUTHENTICATION,
      'AUTH_401_001',
      { attemptCount: 3 }
    ),
    expectedStatusCode: 401,
    expectedLogLevel: LogLevel.INFO,
    expectedLogMessage: 'Authentication error: Invalid credentials',
    userFriendlyMessage: 'Your login information is incorrect. Please try again.',
    journeyContext: null // Generic error not specific to any journey
  },

  // Authorization error (403 Forbidden)
  authorizationError: {
    error: new AppException(
      'Insufficient permissions',
      ErrorType.AUTHORIZATION,
      'AUTH_403_001',
      { 
        requiredPermissions: ['health:read', 'health:write'],
        userPermissions: ['health:read']
      }
    ),
    expectedStatusCode: 403,
    expectedLogLevel: LogLevel.INFO,
    expectedLogMessage: 'Authorization error: Insufficient permissions',
    userFriendlyMessage: 'You do not have permission to perform this action.',
    journeyContext: {
      journeyId: 'health',
      journeyName: 'Minha Saúde',
      section: 'medical-records'
    }
  },

  // Resource not found error (404 Not Found)
  notFoundError: {
    error: new AppException(
      'Resource not found',
      ErrorType.NOT_FOUND,
      'NF_404_001',
      { resourceType: 'Appointment', resourceId: 'appt-12345' }
    ),
    expectedStatusCode: 404,
    expectedLogLevel: LogLevel.DEBUG,
    expectedLogMessage: 'Resource not found: Appointment with ID appt-12345',
    userFriendlyMessage: 'The requested appointment could not be found.',
    journeyContext: {
      journeyId: 'care',
      journeyName: 'Cuidar-me Agora',
      section: 'appointments'
    }
  },

  // Conflict error (409 Conflict)
  conflictError: {
    error: new AppException(
      'Resource already exists',
      ErrorType.CONFLICT,
      'CONF_409_001',
      { resourceType: 'User', identifier: 'user@example.com' }
    ),
    expectedStatusCode: 409,
    expectedLogLevel: LogLevel.INFO,
    expectedLogMessage: 'Conflict error: Resource already exists',
    userFriendlyMessage: 'An account with this email already exists.',
    journeyContext: null // Generic error not specific to any journey
  },

  // Complex validation error with field details (400 Bad Request)
  complexValidationError: {
    error: new AppException(
      'Form validation failed',
      ErrorType.VALIDATION,
      'VAL_400_002',
      {
        fields: {
          'personalInfo.firstName': 'First name is required',
          'personalInfo.lastName': 'Last name is required',
          'contact.email': 'Invalid email format',
          'contact.phone': 'Phone number must be 10 digits',
          'address.zipCode': 'Invalid zip code format'
        },
        formId: 'user-registration'
      }
    ),
    expectedStatusCode: 400,
    expectedLogLevel: LogLevel.DEBUG,
    expectedLogMessage: 'Validation error: Form validation failed',
    userFriendlyMessage: 'Please correct the highlighted fields and try again.',
    journeyContext: {
      journeyId: 'plan',
      journeyName: 'Meu Plano & Benefícios',
      section: 'registration'
    }
  },

  // Rate limit exceeded error (429 Too Many Requests)
  rateLimitError: {
    error: new AppException(
      'Rate limit exceeded',
      ErrorType.RATE_LIMIT,
      'RL_429_001',
      { 
        limit: 100,
        period: '1 hour',
        retryAfter: 300 // seconds
      }
    ),
    expectedStatusCode: 429,
    expectedLogLevel: LogLevel.WARN,
    expectedLogMessage: 'Rate limit exceeded: 100 requests per 1 hour',
    userFriendlyMessage: 'You have made too many requests. Please try again in 5 minutes.',
    journeyContext: null // Generic error not specific to any journey
  }
};

/**
 * System error scenarios (5xx status codes)
 * These represent unexpected errors in the server's internal logic or infrastructure.
 * Typically logged at ERROR or FATAL level as they require investigation.
 */
export const systemErrorScenarios = {
  // Basic internal server error (500 Internal Server Error)
  basicInternalError: {
    error: new AppException(
      'Unexpected error occurred',
      ErrorType.TECHNICAL,
      'SYS_500_001',
      { component: 'UserService', method: 'createUser' }
    ),
    expectedStatusCode: 500,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Technical error: Unexpected error occurred in UserService.createUser',
    userFriendlyMessage: 'An unexpected error occurred. Please try again later.',
    journeyContext: null, // Generic error not specific to any journey
    stackTrace: new Error('Unexpected error in user creation').stack
  },

  // Database error (500 Internal Server Error)
  databaseError: {
    error: new AppException(
      'Database operation failed',
      ErrorType.TECHNICAL,
      'DB_500_001',
      { 
        operation: 'INSERT',
        table: 'users',
        errorCode: 'ER_DUP_ENTRY'
      }
    ),
    expectedStatusCode: 500,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Database error: Database operation failed - ER_DUP_ENTRY',
    userFriendlyMessage: 'We encountered a problem saving your information. Please try again later.',
    journeyContext: null, // Generic error not specific to any journey
    stackTrace: new Error('ER_DUP_ENTRY: Duplicate entry for key PRIMARY').stack
  },

  // Memory limit exceeded (500 Internal Server Error)
  memoryLimitError: {
    error: new AppException(
      'Memory limit exceeded',
      ErrorType.TECHNICAL,
      'SYS_500_002',
      { 
        allocatedMemory: '512MB',
        usedMemory: '510MB',
        operation: 'image-processing'
      }
    ),
    expectedStatusCode: 500,
    expectedLogLevel: LogLevel.FATAL,
    expectedLogMessage: 'System resource error: Memory limit exceeded during image-processing',
    userFriendlyMessage: 'The system is currently experiencing high load. Please try again later.',
    journeyContext: {
      journeyId: 'health',
      journeyName: 'Minha Saúde',
      section: 'medical-images'
    },
    stackTrace: new Error('JavaScript heap out of memory').stack
  },

  // Unhandled exception (500 Internal Server Error)
  unhandledExceptionError: {
    error: new Error('Uncaught TypeError: Cannot read property \'id\' of undefined'),
    expectedStatusCode: 500,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Unhandled exception: TypeError: Cannot read property \'id\' of undefined',
    userFriendlyMessage: 'An unexpected error occurred. Our team has been notified.',
    journeyContext: {
      journeyId: 'care',
      journeyName: 'Cuidar-me Agora',
      section: 'doctor-profile'
    },
    stackTrace: new TypeError('Cannot read property \'id\' of undefined').stack
  },

  // Service unavailable error (503 Service Unavailable)
  serviceUnavailableError: {
    error: new AppException(
      'Service temporarily unavailable',
      ErrorType.TECHNICAL,
      'SYS_503_001',
      { 
        service: 'NotificationService',
        reason: 'scheduled-maintenance',
        estimatedResolution: '2023-04-15T15:00:00Z'
      }
    ),
    expectedStatusCode: 503,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Service unavailable: NotificationService - scheduled-maintenance',
    userFriendlyMessage: 'This service is temporarily unavailable due to scheduled maintenance. Please try again after 3:00 PM.',
    journeyContext: null, // Generic error not specific to any journey
    stackTrace: new Error('Service connection refused').stack
  },

  // Timeout error (504 Gateway Timeout)
  timeoutError: {
    error: new AppException(
      'Request processing timed out',
      ErrorType.TECHNICAL,
      'SYS_504_001',
      { 
        timeout: '30s',
        operation: 'generate-report',
        resourceType: 'HealthSummary'
      }
    ),
    expectedStatusCode: 504,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Timeout error: Request processing timed out after 30s',
    userFriendlyMessage: 'Your request is taking longer than expected. Please try again or request a smaller report.',
    journeyContext: {
      journeyId: 'health',
      journeyName: 'Minha Saúde',
      section: 'reports'
    },
    stackTrace: new Error('Request timed out after 30000ms').stack
  }
};

/**
 * Transient error scenarios
 * These represent temporary failures that might resolve on retry.
 * Typically logged at WARN level and often include retry information.
 */
export const transientErrorScenarios = {
  // Network connectivity error
  networkConnectivityError: {
    error: new AppException(
      'Network connectivity issue',
      ErrorType.TRANSIENT,
      'TRANS_001',
      { 
        host: 'api.payment-gateway.com',
        errorCode: 'ECONNRESET',
        retryCount: 1,
        maxRetries: 3
      }
    ),
    expectedStatusCode: 503,
    expectedLogLevel: LogLevel.WARN,
    expectedLogMessage: 'Transient error: Network connectivity issue - ECONNRESET',
    userFriendlyMessage: 'We\'re having trouble connecting to our payment service. Your request will be retried automatically.',
    journeyContext: {
      journeyId: 'plan',
      journeyName: 'Meu Plano & Benefícios',
      section: 'payment'
    },
    retryable: true,
    retryDelay: 2000, // ms
    stackTrace: new Error('ECONNRESET: Connection reset by peer').stack
  },

  // Database connection pool exhausted
  connectionPoolError: {
    error: new AppException(
      'Database connection pool exhausted',
      ErrorType.TRANSIENT,
      'TRANS_002',
      { 
        poolSize: 20,
        waitingConnections: 15,
        timeout: 5000 // ms
      }
    ),
    expectedStatusCode: 503,
    expectedLogLevel: LogLevel.WARN,
    expectedLogMessage: 'Transient error: Database connection pool exhausted',
    userFriendlyMessage: 'Our system is experiencing high demand. Please try again in a moment.',
    journeyContext: null, // Generic error not specific to any journey
    retryable: true,
    retryDelay: 5000, // ms
    stackTrace: new Error('TimeoutError: Connection acquisition timeout').stack
  },

  // Rate limiting with retry-after
  rateLimitWithRetryError: {
    error: new AppException(
      'External API rate limit reached',
      ErrorType.TRANSIENT,
      'TRANS_003',
      { 
        api: 'FitbitAPI',
        limit: '150 requests per hour',
        retryAfter: 120 // seconds
      }
    ),
    expectedStatusCode: 429,
    expectedLogLevel: LogLevel.WARN,
    expectedLogMessage: 'Transient error: External API rate limit reached - FitbitAPI',
    userFriendlyMessage: 'We\'ve reached our limit for fitness data updates. Your data will be updated automatically in a few minutes.',
    journeyContext: {
      journeyId: 'health',
      journeyName: 'Minha Saúde',
      section: 'fitness-tracking'
    },
    retryable: true,
    retryDelay: 120000, // ms
    stackTrace: new Error('Rate limit exceeded').stack
  },

  // Temporary service degradation
  serviceDegradationError: {
    error: new AppException(
      'Service experiencing degraded performance',
      ErrorType.TRANSIENT,
      'TRANS_004',
      { 
        service: 'AppointmentBooking',
        currentLatency: '5000ms',
        normalLatency: '200ms',
        estimatedResolution: '15 minutes'
      }
    ),
    expectedStatusCode: 503,
    expectedLogLevel: LogLevel.WARN,
    expectedLogMessage: 'Transient error: Service experiencing degraded performance - AppointmentBooking',
    userFriendlyMessage: 'Our appointment booking system is running slower than usual. Please try again in 15 minutes.',
    journeyContext: {
      journeyId: 'care',
      journeyName: 'Cuidar-me Agora',
      section: 'appointment-booking'
    },
    retryable: true,
    retryDelay: 900000, // 15 minutes in ms
    stackTrace: new Error('Request timed out due to service degradation').stack
  },

  // Temporary authentication token expiration
  tokenExpirationError: {
    error: new AppException(
      'Authentication token expired',
      ErrorType.TRANSIENT,
      'TRANS_005',
      { 
        tokenType: 'access',
        expiredAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        canRefresh: true
      }
    ),
    expectedStatusCode: 401,
    expectedLogLevel: LogLevel.DEBUG, // Common and expected
    expectedLogMessage: 'Transient error: Authentication token expired',
    userFriendlyMessage: 'Your session has expired. We\'re reconnecting you automatically.',
    journeyContext: null, // Generic error not specific to any journey
    retryable: true,
    retryDelay: 0, // Immediate retry after token refresh
    stackTrace: new Error('JWT expired at 2023-04-15T10:30:00Z').stack
  }
};

/**
 * External dependency error scenarios
 * These represent failures in external systems or third-party services.
 * Typically logged at ERROR level with detailed context about the external system.
 */
export const externalDependencyErrorScenarios = {
  // Payment gateway error
  paymentGatewayError: {
    error: new AppException(
      'Payment processing failed',
      ErrorType.EXTERNAL,
      'EXT_001',
      { 
        gateway: 'Stripe',
        errorCode: 'card_declined',
        errorMessage: 'Your card was declined',
        transactionId: 'tx_12345'
      }
    ),
    expectedStatusCode: 502,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'External dependency error: Payment processing failed - Stripe (card_declined)',
    userFriendlyMessage: 'Your payment could not be processed. Please check your payment details and try again.',
    journeyContext: {
      journeyId: 'plan',
      journeyName: 'Meu Plano & Benefícios',
      section: 'payment'
    },
    externalSystem: {
      name: 'Stripe',
      endpoint: 'https://api.stripe.com/v1/charges',
      responseTime: 1250, // ms
      statusCode: 402
    },
    stackTrace: new Error('Stripe API Error: card_declined').stack
  },

  // Health data provider error
  healthDataProviderError: {
    error: new AppException(
      'Health data synchronization failed',
      ErrorType.EXTERNAL,
      'EXT_002',
      { 
        provider: 'Fitbit',
        errorCode: 'invalid_grant',
        scope: ['activity', 'heartrate', 'sleep'],
        userId: 'user-12345'
      }
    ),
    expectedStatusCode: 502,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'External dependency error: Health data synchronization failed - Fitbit (invalid_grant)',
    userFriendlyMessage: 'We couldn\'t connect to your Fitbit account. Please reconnect your account in settings.',
    journeyContext: {
      journeyId: 'health',
      journeyName: 'Minha Saúde',
      section: 'connected-devices'
    },
    externalSystem: {
      name: 'Fitbit API',
      endpoint: 'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json',
      responseTime: 850, // ms
      statusCode: 401
    },
    stackTrace: new Error('Fitbit API Error: invalid_grant').stack
  },

  // Telemedicine provider error
  telemedicineProviderError: {
    error: new AppException(
      'Telemedicine session initialization failed',
      ErrorType.EXTERNAL,
      'EXT_003',
      { 
        provider: 'Zoom',
        errorCode: 'meeting_creation_failed',
        appointmentId: 'appt-6789',
        doctorId: 'dr-smith'
      }
    ),
    expectedStatusCode: 502,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'External dependency error: Telemedicine session initialization failed - Zoom (meeting_creation_failed)',
    userFriendlyMessage: 'We couldn\'t set up your virtual appointment. Please try again or contact support.',
    journeyContext: {
      journeyId: 'care',
      journeyName: 'Cuidar-me Agora',
      section: 'telemedicine'
    },
    externalSystem: {
      name: 'Zoom API',
      endpoint: 'https://api.zoom.us/v2/users/me/meetings',
      responseTime: 1500, // ms
      statusCode: 400
    },
    stackTrace: new Error('Zoom API Error: meeting_creation_failed').stack
  },

  // Insurance provider error
  insuranceProviderError: {
    error: new AppException(
      'Insurance eligibility check failed',
      ErrorType.EXTERNAL,
      'EXT_004',
      { 
        provider: 'BlueCross',
        errorCode: 'member_not_found',
        memberId: 'BC123456789',
        service: 'eligibility'
      }
    ),
    expectedStatusCode: 502,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'External dependency error: Insurance eligibility check failed - BlueCross (member_not_found)',
    userFriendlyMessage: 'We couldn\'t verify your insurance information. Please check your member ID and try again.',
    journeyContext: {
      journeyId: 'plan',
      journeyName: 'Meu Plano & Benefícios',
      section: 'coverage-verification'
    },
    externalSystem: {
      name: 'BlueCross API',
      endpoint: 'https://api.bluecross.com/v2/eligibility',
      responseTime: 2200, // ms
      statusCode: 404
    },
    stackTrace: new Error('BlueCross API Error: member_not_found').stack
  },

  // Notification service error
  notificationServiceError: {
    error: new AppException(
      'Push notification delivery failed',
      ErrorType.EXTERNAL,
      'EXT_005',
      { 
        service: 'Firebase Cloud Messaging',
        errorCode: 'invalid_token',
        deviceToken: 'fcm-token-12345',
        notificationType: 'appointment-reminder'
      }
    ),
    expectedStatusCode: 502,
    expectedLogLevel: LogLevel.WARN, // Less critical than other external errors
    expectedLogMessage: 'External dependency error: Push notification delivery failed - Firebase Cloud Messaging (invalid_token)',
    userFriendlyMessage: 'We couldn\'t send a notification to your device. Please check your notification settings.',
    journeyContext: null, // Cross-journey functionality
    externalSystem: {
      name: 'Firebase Cloud Messaging',
      endpoint: 'https://fcm.googleapis.com/fcm/send',
      responseTime: 450, // ms
      statusCode: 400
    },
    stackTrace: new Error('FCM Error: invalid_token').stack
  }
};

/**
 * Journey-specific error scenarios
 * These represent errors that are specific to each journey in the AUSTA SuperApp.
 * They combine various error types but are organized by the journey they affect.
 */
export const journeySpecificErrorScenarios = {
  // Health Journey Errors
  health: {
    // Device connection error
    deviceConnectionError: {
      error: new AppException(
        'Health device connection failed',
        ErrorType.EXTERNAL,
        'HEALTH_001',
        { 
          deviceType: 'Glucose Monitor',
          deviceId: 'GC-12345',
          connectionMethod: 'Bluetooth',
          lastSyncTime: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ),
      expectedStatusCode: 502,
      expectedLogLevel: LogLevel.ERROR,
      expectedLogMessage: 'Health journey error: Health device connection failed - Glucose Monitor',
      userFriendlyMessage: 'We couldn\'t connect to your glucose monitor. Please ensure it\'s turned on and within range.',
      journeyContext: {
        journeyId: 'health',
        journeyName: 'Minha Saúde',
        section: 'devices'
      },
      stackTrace: new Error('Bluetooth connection timeout').stack
    },

    // Health data validation error
    healthDataValidationError: {
      error: new AppException(
        'Invalid health metric data',
        ErrorType.VALIDATION,
        'HEALTH_002',
        { 
          metric: 'blood-glucose',
          value: '-10',
          validRange: '0-500',
          unit: 'mg/dL'
        }
      ),
      expectedStatusCode: 400,
      expectedLogLevel: LogLevel.DEBUG,
      expectedLogMessage: 'Health journey error: Invalid health metric data - blood-glucose',
      userFriendlyMessage: 'The blood glucose value you entered is outside the valid range (0-500 mg/dL).',
      journeyContext: {
        journeyId: 'health',
        journeyName: 'Minha Saúde',
        section: 'metrics'
      }
    },

    // Health goal processing error
    healthGoalProcessingError: {
      error: new AppException(
        'Failed to process health goal achievement',
        ErrorType.TECHNICAL,
        'HEALTH_003',
        { 
          goalId: 'goal-12345',
          goalType: 'steps',
          targetValue: 10000,
          actualValue: 10500,
          userId: 'user-12345'
        }
      ),
      expectedStatusCode: 500,
      expectedLogLevel: LogLevel.ERROR,
      expectedLogMessage: 'Health journey error: Failed to process health goal achievement',
      userFriendlyMessage: 'We couldn\'t update your goal progress. Your achievement will be processed later.',
      journeyContext: {
        journeyId: 'health',
        journeyName: 'Minha Saúde',
        section: 'goals'
      },
      stackTrace: new Error('Failed to emit goal achievement event').stack
    }
  },

  // Care Journey Errors
  care: {
    // Appointment booking error
    appointmentBookingError: {
      error: new AppException(
        'Failed to book appointment',
        ErrorType.BUSINESS,
        'CARE_001',
        { 
          doctorId: 'dr-smith',
          specialtyId: 'cardiology',
          requestedDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          reason: 'no-availability'
        }
      ),
      expectedStatusCode: 422,
      expectedLogLevel: LogLevel.INFO,
      expectedLogMessage: 'Care journey error: Failed to book appointment - no-availability',
      userFriendlyMessage: 'This doctor doesn\'t have any available appointments for the selected date. Please try another date or doctor.',
      journeyContext: {
        journeyId: 'care',
        journeyName: 'Cuidar-me Agora',
        section: 'appointment-booking'
      }
    },

    // Prescription renewal error
    prescriptionRenewalError: {
      error: new AppException(
        'Prescription renewal request failed',
        ErrorType.BUSINESS,
        'CARE_002',
        { 
          prescriptionId: 'rx-12345',
          medication: 'Lisinopril 10mg',
          reason: 'requires-visit',
          lastVisitDate: new Date(Date.now() - 7776000000).toISOString() // 90 days ago
        }
      ),
      expectedStatusCode: 422,
      expectedLogLevel: LogLevel.INFO,
      expectedLogMessage: 'Care journey error: Prescription renewal request failed - requires-visit',
      userFriendlyMessage: 'This medication requires a doctor visit before renewal. Please schedule an appointment.',
      journeyContext: {
        journeyId: 'care',
        journeyName: 'Cuidar-me Agora',
        section: 'prescriptions'
      }
    },

    // Doctor search error
    doctorSearchError: {
      error: new AppException(
        'Doctor search failed',
        ErrorType.TECHNICAL,
        'CARE_003',
        { 
          searchParams: {
            specialty: 'neurology',
            location: 'São Paulo',
            insurance: 'HealthPlus'
          },
          errorDetail: 'search-index-unavailable'
        }
      ),
      expectedStatusCode: 500,
      expectedLogLevel: LogLevel.ERROR,
      expectedLogMessage: 'Care journey error: Doctor search failed - search-index-unavailable',
      userFriendlyMessage: 'We\'re having trouble with our doctor search. Please try again in a few minutes.',
      journeyContext: {
        journeyId: 'care',
        journeyName: 'Cuidar-me Agora',
        section: 'find-doctor'
      },
      stackTrace: new Error('Elasticsearch cluster unavailable').stack
    }
  },

  // Plan Journey Errors
  plan: {
    // Claim submission error
    claimSubmissionError: {
      error: new AppException(
        'Claim submission failed',
        ErrorType.VALIDATION,
        'PLAN_001',
        { 
          claimType: 'medical',
          missingDocuments: ['receipt', 'medical-report'],
          providerId: 'provider-12345',
          serviceDate: new Date(Date.now() - 604800000).toISOString() // 7 days ago
        }
      ),
      expectedStatusCode: 400,
      expectedLogLevel: LogLevel.DEBUG,
      expectedLogMessage: 'Plan journey error: Claim submission failed - missing documents',
      userFriendlyMessage: 'Your claim is missing required documents. Please upload a receipt and medical report.',
      journeyContext: {
        journeyId: 'plan',
        journeyName: 'Meu Plano & Benefícios',
        section: 'claims'
      }
    },

    // Coverage verification error
    coverageVerificationError: {
      error: new AppException(
        'Service not covered by plan',
        ErrorType.BUSINESS,
        'PLAN_002',
        { 
          serviceCode: 'PT-12345',
          serviceName: 'Physical Therapy - Specialized',
          planId: 'premium-health-2023',
          coverageDetail: 'excluded-service'
        }
      ),
      expectedStatusCode: 422,
      expectedLogLevel: LogLevel.INFO,
      expectedLogMessage: 'Plan journey error: Service not covered by plan - excluded-service',
      userFriendlyMessage: 'This service is not covered by your current health plan. Please contact customer service for options.',
      journeyContext: {
        journeyId: 'plan',
        journeyName: 'Meu Plano & Benefícios',
        section: 'coverage'
      }
    },

    // Plan upgrade error
    planUpgradeError: {
      error: new AppException(
        'Plan upgrade failed',
        ErrorType.EXTERNAL,
        'PLAN_003',
        { 
          currentPlan: 'basic-health-2023',
          targetPlan: 'premium-health-2023',
          reason: 'payment-processing-failed',
          paymentMethod: 'credit-card-ending-1234'
        }
      ),
      expectedStatusCode: 502,
      expectedLogLevel: LogLevel.ERROR,
      expectedLogMessage: 'Plan journey error: Plan upgrade failed - payment-processing-failed',
      userFriendlyMessage: 'We couldn\'t process your payment for the plan upgrade. Please check your payment method and try again.',
      journeyContext: {
        journeyId: 'plan',
        journeyName: 'Meu Plano & Benefícios',
        section: 'plan-management'
      },
      stackTrace: new Error('Payment gateway timeout').stack
    }
  }
};

/**
 * Gamification-related error scenarios
 * These represent errors that occur in the gamification engine or during gamification events.
 * They are cross-journey in nature as the gamification system spans all journeys.
 */
export const gamificationErrorScenarios = {
  // Achievement processing error
  achievementProcessingError: {
    error: new AppException(
      'Failed to process achievement',
      ErrorType.TECHNICAL,
      'GAMIF_001',
      { 
        achievementId: 'achievement-12345',
        achievementType: 'streak',
        userId: 'user-12345',
        journeyId: 'health',
        points: 100
      }
    ),
    expectedStatusCode: 500,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Gamification error: Failed to process achievement',
    userFriendlyMessage: 'We couldn\'t update your achievements. Your progress has been saved and will be updated soon.',
    journeyContext: {
      journeyId: 'health', // The journey where the achievement was triggered
      journeyName: 'Minha Saúde',
      section: 'achievements'
    },
    stackTrace: new Error('Failed to emit achievement event').stack
  },

  // Reward redemption error
  rewardRedemptionError: {
    error: new AppException(
      'Reward redemption failed',
      ErrorType.BUSINESS,
      'GAMIF_002',
      { 
        rewardId: 'reward-12345',
        rewardType: 'discount',
        rewardValue: '10%',
        requiredPoints: 500,
        userPoints: 450,
        reason: 'insufficient-points'
      }
    ),
    expectedStatusCode: 422,
    expectedLogLevel: LogLevel.INFO,
    expectedLogMessage: 'Gamification error: Reward redemption failed - insufficient-points',
    userFriendlyMessage: 'You don\'t have enough points to redeem this reward. You need 50 more points.',
    journeyContext: {
      journeyId: 'plan', // The journey where the reward was being redeemed
      journeyName: 'Meu Plano & Benefícios',
      section: 'rewards'
    }
  },

  // Leaderboard update error
  leaderboardUpdateError: {
    error: new AppException(
      'Failed to update leaderboard',
      ErrorType.TECHNICAL,
      'GAMIF_003',
      { 
        leaderboardId: 'weekly-steps',
        userId: 'user-12345',
        score: 12500,
        previousRank: 10,
        errorDetail: 'database-timeout'
      }
    ),
    expectedStatusCode: 500,
    expectedLogLevel: LogLevel.ERROR,
    expectedLogMessage: 'Gamification error: Failed to update leaderboard - database-timeout',
    userFriendlyMessage: 'We couldn\'t update the leaderboard. Your score has been recorded and will be updated soon.',
    journeyContext: {
      journeyId: 'health', // The journey where the leaderboard was being updated
      journeyName: 'Minha Saúde',
      section: 'leaderboards'
    },
    stackTrace: new Error('Database operation timed out').stack
  }
};

/**
 * Export all error scenarios as a single collection
 */
export const allErrorScenarios = {
  client: clientErrorScenarios,
  system: systemErrorScenarios,
  transient: transientErrorScenarios,
  external: externalDependencyErrorScenarios,
  journey: journeySpecificErrorScenarios,
  gamification: gamificationErrorScenarios
};