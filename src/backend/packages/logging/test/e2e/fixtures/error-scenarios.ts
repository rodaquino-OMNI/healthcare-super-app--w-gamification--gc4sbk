/**
 * Error scenarios for testing error logging in the AUSTA SuperApp.
 * 
 * This file provides a comprehensive set of mock error scenarios for testing error logging
 * in the exceptions-integration.e2e-spec.ts tests. It includes different error types
 * (client errors, system errors, transient errors, external dependency errors) with various
 * contextual information.
 * 
 * These fixtures allow testing how different error conditions are logged, formatted, and
 * categorized by the logging system across all journeys.
 */

import { HttpStatus } from '@nestjs/common';

// ===== COMMON ERROR SCENARIOS =====

/**
 * Common error scenarios that apply across all journeys
 */
export const commonErrorScenarios = {
  /**
   * Client errors (4xx) - Validation and business logic errors
   */
  clientErrors: {
    /**
     * Validation error for missing required field
     */
    missingRequiredField: {
      name: 'MissingParameterError',
      message: 'Required parameter \'email\' is missing',
      code: 'VALIDATION_MISSING_PARAMETER',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'MissingParameterError: Required parameter \'email\' is missing\n    at validateUserInput (/src/backend/auth-service/src/auth/auth.service.ts:45:11)\n    at AuthService.login (/src/backend/auth-service/src/auth/auth.service.ts:78:5)\n    at AuthController.login (/src/backend/auth-service/src/auth/auth.controller.ts:32:36)',
      context: {
        parameter: 'email',
        location: 'body',
        resourceType: 'User',
        requestId: '8f7b-4432-a921-b6cd48a1f72c'
      }
    },

    /**
     * Validation error for invalid parameter format
     */
    invalidParameterFormat: {
      name: 'InvalidParameterError',
      message: 'Parameter \'email\' has invalid format',
      code: 'VALIDATION_INVALID_PARAMETER',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'InvalidParameterError: Parameter \'email\' has invalid format\n    at validateUserInput (/src/backend/auth-service/src/auth/auth.service.ts:52:11)\n    at AuthService.login (/src/backend/auth-service/src/auth/auth.service.ts:78:5)\n    at AuthController.login (/src/backend/auth-service/src/auth/auth.controller.ts:32:36)',
      context: {
        parameter: 'email',
        providedValue: 'invalid-email',
        expectedFormat: 'valid email address',
        location: 'body',
        resourceType: 'User',
        requestId: '7a3c-4432-b921-c6cd48a1f72d'
      }
    },

    /**
     * Validation error for schema validation failure with multiple fields
     */
    schemaValidationFailure: {
      name: 'SchemaValidationError',
      message: 'Request validation failed',
      code: 'VALIDATION_SCHEMA_ERROR',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'SchemaValidationError: Request validation failed\n    at validateDto (/src/backend/shared/src/validation/validate-dto.ts:25:11)\n    at UserController.createUser (/src/backend/auth-service/src/users/users.controller.ts:42:5)',
      context: {
        errors: [
          {
            field: 'password',
            message: 'password must be at least 8 characters long',
            value: '123'
          },
          {
            field: 'age',
            message: 'age must be a positive number',
            value: -5
          }
        ],
        resourceType: 'User',
        requestId: '9a3c-5532-c921-d6cd48a1f72e'
      }
    },

    /**
     * Business error for resource not found
     */
    resourceNotFound: {
      name: 'ResourceNotFoundError',
      message: 'User with ID \'123e4567-e89b-12d3-a456-426614174000\' not found',
      code: 'BUSINESS_RESOURCE_NOT_FOUND',
      type: 'BUSINESS',
      status: HttpStatus.NOT_FOUND,
      stack: 'ResourceNotFoundError: User with ID \'123e4567-e89b-12d3-a456-426614174000\' not found\n    at UserService.findById (/src/backend/auth-service/src/users/users.service.ts:87:11)\n    at UserController.getUser (/src/backend/auth-service/src/users/users.controller.ts:65:36)',
      context: {
        resourceType: 'User',
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
        requestId: '6b3c-5532-d921-e6cd48a1f72f'
      }
    },

    /**
     * Business error for insufficient permissions
     */
    insufficientPermissions: {
      name: 'InsufficientPermissionsError',
      message: 'User does not have permission to access this resource',
      code: 'BUSINESS_INSUFFICIENT_PERMISSIONS',
      type: 'BUSINESS',
      status: HttpStatus.FORBIDDEN,
      stack: 'InsufficientPermissionsError: User does not have permission to access this resource\n    at PermissionGuard.canActivate (/src/backend/auth-service/src/permissions/guards/permission.guard.ts:32:11)\n    at PermissionGuard.canActivate (/src/backend/auth-service/src/permissions/guards/permission.guard.ts:15:14)',
      context: {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        requiredPermission: 'user:update',
        userPermissions: ['user:read'],
        resourceId: '123e4567-e89b-12d3-a456-426614174002',
        requestId: '5b3c-5532-e921-f6cd48a1f72g'
      }
    },

    /**
     * Business error for conflict
     */
    resourceConflict: {
      name: 'ConflictError',
      message: 'User with email \'user@example.com\' already exists',
      code: 'BUSINESS_RESOURCE_EXISTS',
      type: 'BUSINESS',
      status: HttpStatus.CONFLICT,
      stack: 'ConflictError: User with email \'user@example.com\' already exists\n    at UserService.create (/src/backend/auth-service/src/users/users.service.ts:45:11)\n    at UserController.createUser (/src/backend/auth-service/src/users/users.controller.ts:42:36)',
      context: {
        resourceType: 'User',
        conflictField: 'email',
        conflictValue: 'user@example.com',
        requestId: '4b3c-5532-f921-g6cd48a1f72h'
      }
    }
  },

  /**
   * System errors (5xx) - Technical and internal errors
   */
  systemErrors: {
    /**
     * Internal server error
     */
    internalServerError: {
      name: 'InternalServerError',
      message: 'An unexpected error occurred while processing the request',
      code: 'TECHNICAL_INTERNAL_SERVER_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'InternalServerError: An unexpected error occurred while processing the request\n    at UserService.updateProfile (/src/backend/auth-service/src/users/users.service.ts:112:11)\n    at UserController.updateUser (/src/backend/auth-service/src/users/users.controller.ts:87:36)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
      context: {
        requestId: '3b3c-5532-g921-h6cd48a1f72i',
        userId: '123e4567-e89b-12d3-a456-426614174003',
        operation: 'updateProfile'
      }
    },

    /**
     * Database error
     */
    databaseError: {
      name: 'DatabaseError',
      message: 'Failed to execute database query',
      code: 'TECHNICAL_DATABASE_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'DatabaseError: Failed to execute database query\n    at PrismaService.executeQuery (/src/backend/shared/src/database/prisma.service.ts:78:11)\n    at UserRepository.findById (/src/backend/auth-service/src/users/users.repository.ts:45:36)\n    at UserService.findById (/src/backend/auth-service/src/users/users.service.ts:87:42)',
      context: {
        requestId: '2b3c-5532-h921-i6cd48a1f72j',
        query: 'SELECT * FROM users WHERE id = $1',
        errorCode: 'P2002',
        errorMessage: 'Unique constraint failed on the fields: (`email`)',
        databaseName: 'postgres'
      }
    },

    /**
     * Configuration error
     */
    configurationError: {
      name: 'ConfigurationError',
      message: 'Missing required environment variable: JWT_SECRET',
      code: 'TECHNICAL_CONFIGURATION_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'ConfigurationError: Missing required environment variable: JWT_SECRET\n    at ConfigService.validateConfig (/src/backend/auth-service/src/config/config.service.ts:32:11)\n    at ConfigService.getJwtConfig (/src/backend/auth-service/src/config/config.service.ts:87:14)\n    at AuthService.generateToken (/src/backend/auth-service/src/auth/auth.service.ts:112:42)',
      context: {
        requestId: '1b3c-5532-i921-j6cd48a1f72k',
        missingVariable: 'JWT_SECRET',
        service: 'auth-service',
        environment: 'development'
      }
    },

    /**
     * Service unavailable error
     */
    serviceUnavailableError: {
      name: 'ServiceUnavailableError',
      message: 'Service is temporarily unavailable',
      code: 'TECHNICAL_SERVICE_UNAVAILABLE',
      type: 'TECHNICAL',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      stack: 'ServiceUnavailableError: Service is temporarily unavailable\n    at HealthCheckService.check (/src/backend/api-gateway/src/health/health.service.ts:45:11)\n    at HealthController.check (/src/backend/api-gateway/src/health/health.controller.ts:32:36)',
      context: {
        requestId: '0b3c-5532-j921-k6cd48a1f72l',
        service: 'auth-service',
        reason: 'Circuit breaker open',
        failedChecks: ['database', 'redis'],
        retryAfter: 30
      }
    }
  },

  /**
   * Transient errors - Temporary failures that can be retried
   */
  transientErrors: {
    /**
     * Timeout error
     */
    timeoutError: {
      name: 'TimeoutError',
      message: 'Request timed out after 30000ms',
      code: 'TECHNICAL_TIMEOUT',
      type: 'TECHNICAL',
      status: HttpStatus.GATEWAY_TIMEOUT,
      stack: 'TimeoutError: Request timed out after 30000ms\n    at timeout (/src/backend/shared/src/utils/timeout.ts:15:11)\n    at UserService.findById (/src/backend/auth-service/src/users/users.service.ts:87:42)',
      context: {
        requestId: 'ab3c-5532-k921-l6cd48a1f72m',
        operation: 'findUserById',
        timeoutMs: 30000,
        isRetryable: true
      }
    },

    /**
     * Rate limit exceeded error
     */
    rateLimitExceededError: {
      name: 'RateLimitExceededError',
      message: 'Rate limit exceeded: 100 requests per minute',
      code: 'TECHNICAL_RATE_LIMIT_EXCEEDED',
      type: 'TECHNICAL',
      status: HttpStatus.TOO_MANY_REQUESTS,
      stack: 'RateLimitExceededError: Rate limit exceeded: 100 requests per minute\n    at RateLimitGuard.canActivate (/src/backend/api-gateway/src/guards/rate-limit.guard.ts:32:11)\n    at RateLimitGuard.canActivate (/src/backend/api-gateway/src/guards/rate-limit.guard.ts:15:14)',
      context: {
        requestId: 'bb3c-5532-l921-m6cd48a1f72n',
        clientIp: '192.168.1.1',
        limit: 100,
        period: 60,
        currentUsage: 101,
        retryAfter: 45,
        isRetryable: true
      }
    },

    /**
     * Connection reset error
     */
    connectionResetError: {
      name: 'ConnectionResetError',
      message: 'Connection reset by peer',
      code: 'TECHNICAL_CONNECTION_RESET',
      type: 'TECHNICAL',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      stack: 'ConnectionResetError: Connection reset by peer\n    at Socket.onSocketError (/src/backend/shared/src/utils/http-client.ts:87:11)\n    at Socket.emit (node:events:513:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)',
      context: {
        requestId: 'cb3c-5532-m921-n6cd48a1f72o',
        host: 'auth-service',
        port: 3000,
        operation: 'validateToken',
        attempt: 1,
        maxAttempts: 3,
        isRetryable: true
      }
    }
  },

  /**
   * External dependency errors - Failures in third-party systems
   */
  externalErrors: {
    /**
     * External API error
     */
    externalApiError: {
      name: 'ExternalApiError',
      message: 'Failed to communicate with external API',
      code: 'EXTERNAL_API_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.BAD_GATEWAY,
      stack: 'ExternalApiError: Failed to communicate with external API\n    at HttpService.request (/src/backend/shared/src/utils/http-client.ts:112:11)\n    at NotificationService.sendSms (/src/backend/notification-service/src/channels/sms/sms.service.ts:45:36)',
      context: {
        requestId: 'db3c-5532-n921-o6cd48a1f72p',
        externalSystem: 'Twilio SMS API',
        endpoint: '/api/v1/sms/send',
        statusCode: 502,
        errorResponse: '{"error":"Bad Gateway","message":"Failed to connect to upstream server"}',
        isRetryable: true
      }
    },

    /**
     * External authentication error
     */
    externalAuthenticationError: {
      name: 'ExternalAuthenticationError',
      message: 'Failed to authenticate with external service',
      code: 'EXTERNAL_AUTHENTICATION_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.UNAUTHORIZED,
      stack: 'ExternalAuthenticationError: Failed to authenticate with external service\n    at HttpService.request (/src/backend/shared/src/utils/http-client.ts:125:11)\n    at NotificationService.sendEmail (/src/backend/notification-service/src/channels/email/email.service.ts:52:36)',
      context: {
        requestId: 'eb3c-5532-o921-p6cd48a1f72q',
        externalSystem: 'SendGrid Email API',
        endpoint: '/api/v3/mail/send',
        statusCode: 401,
        errorResponse: '{"errors":[{"message":"API key invalid or expired","field":"Authorization","help":"https://sendgrid.com/docs/api-reference/"}]}',
        isRetryable: false
      }
    },

    /**
     * External dependency unavailable error
     */
    externalDependencyUnavailableError: {
      name: 'ExternalDependencyUnavailableError',
      message: 'External dependency is currently unavailable',
      code: 'EXTERNAL_DEPENDENCY_UNAVAILABLE',
      type: 'EXTERNAL',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      stack: 'ExternalDependencyUnavailableError: External dependency is currently unavailable\n    at HttpService.request (/src/backend/shared/src/utils/http-client.ts:138:11)\n    at PaymentService.processPayment (/src/backend/plan-service/src/payment/payment.service.ts:67:36)',
      context: {
        requestId: 'fb3c-5532-p921-q6cd48a1f72r',
        externalSystem: 'Stripe Payment API',
        endpoint: '/v1/payment_intents',
        statusCode: 503,
        errorResponse: '{"error":{"type":"api_error","message":"The API is currently unavailable. Please retry your request later."}}',
        isRetryable: true,
        retryAfter: 60
      }
    }
  }
};

// ===== HEALTH JOURNEY ERROR SCENARIOS =====

/**
 * Health journey specific error scenarios
 */
export const healthErrorScenarios = {
  /**
   * Health metrics errors
   */
  metrics: {
    /**
     * Invalid metric value error
     */
    invalidMetricValue: {
      name: 'InvalidMetricValueError',
      message: 'Invalid value for health metric: Blood Pressure',
      code: 'HEALTH_METRICS_VALIDATION_INVALID_VALUE',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'InvalidMetricValueError: Invalid value for health metric: Blood Pressure\n    at MetricsService.recordMetric (/src/backend/health-service/src/health/metrics.service.ts:78:11)\n    at MetricsController.recordMetric (/src/backend/health-service/src/health/metrics.controller.ts:45:36)',
      context: {
        requestId: 'gb3c-5532-q921-r6cd48a1f72s',
        metricType: 'BloodPressure',
        providedValue: '180/abc',
        expectedFormat: 'systolic/diastolic (e.g., 120/80)',
        userId: '123e4567-e89b-12d3-a456-426614174004',
        journeyContext: 'health'
      }
    },

    /**
     * Metric threshold exceeded error
     */
    metricThresholdExceeded: {
      name: 'MetricThresholdExceededError',
      message: 'Health metric exceeds critical threshold: Blood Pressure 180/110',
      code: 'HEALTH_METRICS_BUSINESS_THRESHOLD_EXCEEDED',
      type: 'BUSINESS',
      status: HttpStatus.OK, // This is a business event, not an error response
      stack: 'MetricThresholdExceededError: Health metric exceeds critical threshold: Blood Pressure 180/110\n    at MetricsService.validateThresholds (/src/backend/health-service/src/health/metrics.service.ts:112:11)\n    at MetricsService.recordMetric (/src/backend/health-service/src/health/metrics.service.ts:82:14)',
      context: {
        requestId: 'hb3c-5532-r921-s6cd48a1f72t',
        metricType: 'BloodPressure',
        value: '180/110',
        threshold: '140/90',
        severity: 'critical',
        userId: '123e4567-e89b-12d3-a456-426614174004',
        recommendedAction: 'Seek immediate medical attention',
        journeyContext: 'health'
      }
    },

    /**
     * Metric persistence error
     */
    metricPersistenceError: {
      name: 'MetricPersistenceError',
      message: 'Failed to save health metric data',
      code: 'HEALTH_METRICS_TECHNICAL_PERSISTENCE_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'MetricPersistenceError: Failed to save health metric data\n    at MetricsRepository.save (/src/backend/health-service/src/health/metrics.repository.ts:67:11)\n    at MetricsService.recordMetric (/src/backend/health-service/src/health/metrics.service.ts:85:36)',
      context: {
        requestId: 'ib3c-5532-s921-t6cd48a1f72u',
        metricType: 'BloodPressure',
        userId: '123e4567-e89b-12d3-a456-426614174004',
        databaseError: 'Connection timeout',
        journeyContext: 'health'
      }
    }
  },

  /**
   * Health goals errors
   */
  goals: {
    /**
     * Invalid goal parameters error
     */
    invalidGoalParameters: {
      name: 'InvalidGoalParametersError',
      message: 'Invalid parameters for health goal',
      code: 'HEALTH_GOALS_VALIDATION_INVALID_PARAMETERS',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'InvalidGoalParametersError: Invalid parameters for health goal\n    at GoalsService.createGoal (/src/backend/health-service/src/health/goals.service.ts:56:11)\n    at GoalsController.createGoal (/src/backend/health-service/src/health/goals.controller.ts:38:36)',
      context: {
        requestId: 'jb3c-5532-t921-u6cd48a1f72v',
        goalType: 'WeightLoss',
        errors: [
          {
            field: 'targetValue',
            message: 'Target weight must be greater than 0',
            value: -5
          },
          {
            field: 'deadline',
            message: 'Deadline must be in the future',
            value: '2020-01-01'
          }
        ],
        userId: '123e4567-e89b-12d3-a456-426614174005',
        journeyContext: 'health'
      }
    },

    /**
     * Conflicting goals error
     */
    conflictingGoals: {
      name: 'ConflictingGoalsError',
      message: 'New goal conflicts with existing health goals',
      code: 'HEALTH_GOALS_BUSINESS_CONFLICTING_GOALS',
      type: 'BUSINESS',
      status: HttpStatus.CONFLICT,
      stack: 'ConflictingGoalsError: New goal conflicts with existing health goals\n    at GoalsService.validateGoalConsistency (/src/backend/health-service/src/health/goals.service.ts:112:11)\n    at GoalsService.createGoal (/src/backend/health-service/src/health/goals.service.ts:62:14)',
      context: {
        requestId: 'kb3c-5532-u921-v6cd48a1f72w',
        newGoal: {
          type: 'WeightGain',
          targetValue: 75,
          deadline: '2023-12-31'
        },
        conflictingGoal: {
          id: '123e4567-e89b-12d3-a456-426614174006',
          type: 'WeightLoss',
          targetValue: 65,
          deadline: '2023-12-31'
        },
        userId: '123e4567-e89b-12d3-a456-426614174005',
        journeyContext: 'health'
      }
    }
  },

  /**
   * Health devices errors
   */
  devices: {
    /**
     * Device connection failure error
     */
    deviceConnectionFailure: {
      name: 'DeviceConnectionFailureError',
      message: 'Failed to connect to health device',
      code: 'HEALTH_DEVICES_TECHNICAL_CONNECTION_FAILURE',
      type: 'TECHNICAL',
      status: HttpStatus.BAD_GATEWAY,
      stack: 'DeviceConnectionFailureError: Failed to connect to health device\n    at DevicesService.connectDevice (/src/backend/health-service/src/devices/devices.service.ts:78:11)\n    at DevicesController.connectDevice (/src/backend/health-service/src/devices/devices.controller.ts:45:36)',
      context: {
        requestId: 'lb3c-5532-v921-w6cd48a1f72x',
        deviceType: 'Fitbit',
        deviceModel: 'Charge 5',
        errorCode: 'CONNECTION_TIMEOUT',
        userId: '123e4567-e89b-12d3-a456-426614174007',
        isRetryable: true,
        journeyContext: 'health'
      }
    },

    /**
     * Synchronization failed error
     */
    synchronizationFailed: {
      name: 'SynchronizationFailedError',
      message: 'Failed to synchronize data from health device',
      code: 'HEALTH_DEVICES_EXTERNAL_SYNC_FAILED',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'SynchronizationFailedError: Failed to synchronize data from health device\n    at DevicesService.synchronizeData (/src/backend/health-service/src/devices/devices.service.ts:112:11)\n    at DevicesController.synchronizeDevice (/src/backend/health-service/src/devices/devices.controller.ts:67:36)',
      context: {
        requestId: 'mb3c-5532-w921-x6cd48a1f72y',
        deviceType: 'Fitbit',
        deviceId: 'FB12345678',
        lastSyncTime: '2023-05-15T10:30:00Z',
        externalApiResponse: '{"error":"Rate limit exceeded","type":"rate_limit_exceeded"}',
        userId: '123e4567-e89b-12d3-a456-426614174007',
        isRetryable: true,
        retryAfter: 3600,
        journeyContext: 'health'
      }
    }
  },

  /**
   * FHIR integration errors
   */
  fhir: {
    /**
     * Invalid FHIR resource error
     */
    invalidResource: {
      name: 'InvalidResourceError',
      message: 'Invalid FHIR resource format',
      code: 'HEALTH_FHIR_VALIDATION_INVALID_RESOURCE',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'InvalidResourceError: Invalid FHIR resource format\n    at FhirService.validateResource (/src/backend/health-service/src/integrations/fhir/fhir.service.ts:78:11)\n    at FhirService.createResource (/src/backend/health-service/src/integrations/fhir/fhir.service.ts:45:14)',
      context: {
        requestId: 'nb3c-5532-x921-y6cd48a1f72z',
        resourceType: 'Observation',
        validationErrors: [
          'Missing required field: status',
          'Invalid code system: http://invalid-system'
        ],
        userId: '123e4567-e89b-12d3-a456-426614174008',
        journeyContext: 'health'
      }
    },

    /**
     * FHIR connection failure error
     */
    fhirConnectionFailure: {
      name: 'FhirConnectionFailureError',
      message: 'Failed to connect to FHIR server',
      code: 'HEALTH_FHIR_EXTERNAL_CONNECTION_FAILURE',
      type: 'EXTERNAL',
      status: HttpStatus.BAD_GATEWAY,
      stack: 'FhirConnectionFailureError: Failed to connect to FHIR server\n    at FhirService.executeRequest (/src/backend/health-service/src/integrations/fhir/fhir.service.ts:178:11)\n    at FhirService.searchResources (/src/backend/health-service/src/integrations/fhir/fhir.service.ts:112:36)',
      context: {
        requestId: 'ob3c-5532-y921-z6cd48a1f72a',
        endpoint: 'https://fhir.example.org/api/v4',
        operation: 'search',
        resourceType: 'Patient',
        statusCode: 502,
        errorResponse: '{"resourceType":"OperationOutcome","issue":[{"severity":"error","code":"processing","diagnostics":"The server is currently unavailable"}]}',
        userId: '123e4567-e89b-12d3-a456-426614174008',
        isRetryable: true,
        journeyContext: 'health'
      }
    }
  },

  /**
   * Health insights errors
   */
  insights: {
    /**
     * Insufficient data error
     */
    insufficientData: {
      name: 'InsufficientDataError',
      message: 'Insufficient data to generate health insights',
      code: 'HEALTH_INSIGHTS_BUSINESS_INSUFFICIENT_DATA',
      type: 'BUSINESS',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: 'InsufficientDataError: Insufficient data to generate health insights\n    at InsightsService.generateInsights (/src/backend/health-service/src/insights/insights.service.ts:78:11)\n    at InsightsController.generateInsights (/src/backend/health-service/src/insights/insights.controller.ts:45:36)',
      context: {
        requestId: 'pb3c-5532-z921-a6cd48a1f72b',
        insightType: 'SleepPattern',
        requiredDataPoints: 7,
        availableDataPoints: 2,
        userId: '123e4567-e89b-12d3-a456-426614174009',
        recommendedAction: 'Continue tracking sleep for at least 5 more days',
        journeyContext: 'health'
      }
    },

    /**
     * Insight generation error
     */
    insightGenerationError: {
      name: 'InsightGenerationError',
      message: 'Failed to generate health insights',
      code: 'HEALTH_INSIGHTS_TECHNICAL_GENERATION_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'InsightGenerationError: Failed to generate health insights\n    at InsightsService.analyzeData (/src/backend/health-service/src/insights/insights.service.ts:112:11)\n    at InsightsService.generateInsights (/src/backend/health-service/src/insights/insights.service.ts:82:36)',
      context: {
        requestId: 'qb3c-5532-a921-b6cd48a1f72c',
        insightType: 'ActivityCorrelation',
        algorithm: 'pearson-correlation',
        errorDetails: 'Division by zero in correlation calculation',
        userId: '123e4567-e89b-12d3-a456-426614174009',
        journeyContext: 'health'
      }
    }
  }
};

// ===== CARE JOURNEY ERROR SCENARIOS =====

/**
 * Care journey specific error scenarios
 */
export const careErrorScenarios = {
  /**
   * Appointment errors
   */
  appointments: {
    /**
     * Appointment date in past error
     */
    appointmentDateInPast: {
      name: 'AppointmentDateInPastError',
      message: 'Cannot schedule appointment in the past',
      code: 'CARE_APPOINTMENT_BUSINESS_PAST_DATE',
      type: 'BUSINESS',
      status: HttpStatus.BAD_REQUEST,
      stack: 'AppointmentDateInPastError: Cannot schedule appointment in the past\n    at AppointmentService.validateAppointmentDate (/src/backend/care-service/src/appointments/appointments.service.ts:78:11)\n    at AppointmentService.createAppointment (/src/backend/care-service/src/appointments/appointments.service.ts:45:14)',
      context: {
        requestId: 'rb3c-5532-b921-c6cd48a1f72d',
        appointmentDate: '2023-01-01T10:00:00Z',
        currentDate: '2023-05-15T14:30:00Z',
        userId: '123e4567-e89b-12d3-a456-426614174010',
        providerId: '123e4567-e89b-12d3-a456-426614174020',
        journeyContext: 'care'
      }
    },

    /**
     * Appointment overlap error
     */
    appointmentOverlap: {
      name: 'AppointmentOverlapError',
      message: 'Appointment overlaps with existing appointment',
      code: 'CARE_APPOINTMENT_BUSINESS_DOUBLE_BOOKING',
      type: 'BUSINESS',
      status: HttpStatus.CONFLICT,
      stack: 'AppointmentOverlapError: Appointment overlaps with existing appointment\n    at AppointmentService.checkForOverlaps (/src/backend/care-service/src/appointments/appointments.service.ts:112:11)\n    at AppointmentService.createAppointment (/src/backend/care-service/src/appointments/appointments.service.ts:48:14)',
      context: {
        requestId: 'sb3c-5532-c921-d6cd48a1f72e',
        newAppointment: {
          date: '2023-06-15T14:00:00Z',
          duration: 30
        },
        existingAppointment: {
          id: '123e4567-e89b-12d3-a456-426614174030',
          date: '2023-06-15T14:15:00Z',
          duration: 30
        },
        userId: '123e4567-e89b-12d3-a456-426614174010',
        providerId: '123e4567-e89b-12d3-a456-426614174020',
        journeyContext: 'care'
      }
    },

    /**
     * Provider unavailable error
     */
    providerUnavailable: {
      name: 'AppointmentProviderUnavailableError',
      message: 'Provider is not available at the requested time',
      code: 'CARE_APPOINTMENT_BUSINESS_PROVIDER_UNAVAILABLE',
      type: 'BUSINESS',
      status: HttpStatus.CONFLICT,
      stack: 'AppointmentProviderUnavailableError: Provider is not available at the requested time\n    at AppointmentService.checkProviderAvailability (/src/backend/care-service/src/appointments/appointments.service.ts:145:11)\n    at AppointmentService.createAppointment (/src/backend/care-service/src/appointments/appointments.service.ts:52:14)',
      context: {
        requestId: 'tb3c-5532-d921-e6cd48a1f72f',
        appointmentDate: '2023-06-15T16:00:00Z',
        providerId: '123e4567-e89b-12d3-a456-426614174020',
        providerAvailability: [
          { start: '2023-06-15T09:00:00Z', end: '2023-06-15T12:00:00Z' },
          { start: '2023-06-15T13:00:00Z', end: '2023-06-15T15:00:00Z' }
        ],
        userId: '123e4567-e89b-12d3-a456-426614174010',
        journeyContext: 'care'
      }
    },

    /**
     * Calendar sync error
     */
    calendarSyncError: {
      name: 'AppointmentCalendarSyncError',
      message: 'Failed to sync appointment with external calendar',
      code: 'CARE_APPOINTMENT_EXTERNAL_CALENDAR_API_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'AppointmentCalendarSyncError: Failed to sync appointment with external calendar\n    at CalendarService.syncAppointment (/src/backend/care-service/src/appointments/calendar.service.ts:67:11)\n    at AppointmentService.createAppointment (/src/backend/care-service/src/appointments/appointments.service.ts:65:36)',
      context: {
        requestId: 'ub3c-5532-e921-f6cd48a1f72g',
        appointmentId: '123e4567-e89b-12d3-a456-426614174031',
        calendarProvider: 'Google Calendar',
        errorResponse: '{"error":"invalid_grant","error_description":"Token has expired"}',
        userId: '123e4567-e89b-12d3-a456-426614174010',
        isRetryable: true,
        journeyContext: 'care'
      }
    }
  },

  /**
   * Telemedicine errors
   */
  telemedicine: {
    /**
     * Telemedicine connection error
     */
    connectionError: {
      name: 'TelemedicineConnectionError',
      message: 'Failed to establish telemedicine connection',
      code: 'CARE_TELEMEDICINE_TECHNICAL_CONNECTION_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'TelemedicineConnectionError: Failed to establish telemedicine connection\n    at TelemedicineService.establishConnection (/src/backend/care-service/src/telemedicine/telemedicine.service.ts:78:11)\n    at TelemedicineController.startSession (/src/backend/care-service/src/telemedicine/telemedicine.controller.ts:45:36)',
      context: {
        requestId: 'vb3c-5532-f921-g6cd48a1f72h',
        sessionId: '123e4567-e89b-12d3-a456-426614174032',
        errorCode: 'ICE_CONNECTION_FAILED',
        webRtcDiagnostics: {
          iceConnectionState: 'failed',
          signalingState: 'stable'
        },
        userId: '123e4567-e89b-12d3-a456-426614174011',
        providerId: '123e4567-e89b-12d3-a456-426614174021',
        isRetryable: true,
        journeyContext: 'care'
      }
    },

    /**
     * Device error
     */
    deviceError: {
      name: 'TelemedicineDeviceError',
      message: 'Failed to access camera or microphone',
      code: 'CARE_TELEMEDICINE_TECHNICAL_AUDIO_SERVICE_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'TelemedicineDeviceError: Failed to access camera or microphone\n    at TelemedicineService.initializeMediaDevices (/src/backend/care-service/src/telemedicine/telemedicine.service.ts:112:11)\n    at TelemedicineService.establishConnection (/src/backend/care-service/src/telemedicine/telemedicine.service.ts:75:14)',
      context: {
        requestId: 'wb3c-5532-g921-h6cd48a1f72i',
        sessionId: '123e4567-e89b-12d3-a456-426614174032',
        deviceType: 'camera',
        errorName: 'NotAllowedError',
        errorMessage: 'Permission denied',
        userId: '123e4567-e89b-12d3-a456-426614174011',
        browserInfo: 'Chrome 112.0.5615.121',
        journeyContext: 'care'
      }
    },

    /**
     * Provider offline error
     */
    providerOfflineError: {
      name: 'TelemedicineProviderOfflineError',
      message: 'Provider is offline and cannot join the session',
      code: 'CARE_TELEMEDICINE_BUSINESS_PROVIDER_NOT_AVAILABLE',
      type: 'BUSINESS',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      stack: 'TelemedicineProviderOfflineError: Provider is offline and cannot join the session\n    at TelemedicineService.checkProviderStatus (/src/backend/care-service/src/telemedicine/telemedicine.service.ts:145:11)\n    at TelemedicineService.establishConnection (/src/backend/care-service/src/telemedicine/telemedicine.service.ts:72:14)',
      context: {
        requestId: 'xb3c-5532-h921-i6cd48a1f72j',
        sessionId: '123e4567-e89b-12d3-a456-426614174032',
        providerId: '123e4567-e89b-12d3-a456-426614174021',
        providerLastSeen: '2023-05-15T13:45:00Z',
        currentTime: '2023-05-15T14:30:00Z',
        userId: '123e4567-e89b-12d3-a456-426614174011',
        journeyContext: 'care'
      }
    }
  },

  /**
   * Medication errors
   */
  medications: {
    /**
     * Medication interaction error
     */
    medicationInteraction: {
      name: 'MedicationInteractionError',
      message: 'Potential interaction detected between medications',
      code: 'CARE_MEDICATION_BUSINESS_INTERACTION_DETECTED',
      type: 'BUSINESS',
      status: HttpStatus.CONFLICT,
      stack: 'MedicationInteractionError: Potential interaction detected between medications\n    at MedicationService.checkInteractions (/src/backend/care-service/src/medications/medications.service.ts:112:11)\n    at MedicationService.addMedication (/src/backend/care-service/src/medications/medications.service.ts:52:14)',
      context: {
        requestId: 'yb3c-5532-i921-j6cd48a1f72k',
        newMedication: {
          name: 'Warfarin',
          dosage: '5mg',
          frequency: 'daily'
        },
        existingMedication: {
          id: '123e4567-e89b-12d3-a456-426614174033',
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'daily'
        },
        interactionSeverity: 'high',
        interactionDescription: 'Increased risk of bleeding',
        userId: '123e4567-e89b-12d3-a456-426614174012',
        journeyContext: 'care'
      }
    },

    /**
     * Medication dosage error
     */
    medicationDosage: {
      name: 'MedicationDosageError',
      message: 'Invalid medication dosage',
      code: 'CARE_MEDICATION_VALIDATION_INVALID_DOSAGE',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'MedicationDosageError: Invalid medication dosage\n    at MedicationService.validateDosage (/src/backend/care-service/src/medications/medications.service.ts:145:11)\n    at MedicationService.addMedication (/src/backend/care-service/src/medications/medications.service.ts:48:14)',
      context: {
        requestId: 'zb3c-5532-j921-k6cd48a1f72l',
        medication: 'Metformin',
        providedDosage: '5000mg',
        maximumRecommendedDosage: '2500mg',
        userId: '123e4567-e89b-12d3-a456-426614174012',
        journeyContext: 'care'
      }
    },

    /**
     * External drug database error
     */
    drugDatabaseError: {
      name: 'MedicationExternalLookupError',
      message: 'Failed to retrieve medication information from drug database',
      code: 'CARE_MEDICATION_EXTERNAL_DRUG_DATABASE_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'MedicationExternalLookupError: Failed to retrieve medication information from drug database\n    at DrugDatabaseService.lookupMedication (/src/backend/care-service/src/medications/drug-database.service.ts:67:11)\n    at MedicationService.addMedication (/src/backend/care-service/src/medications/medications.service.ts:45:36)',
      context: {
        requestId: 'ac3c-5532-k921-l6cd48a1f72m',
        medication: 'Atorvastatin',
        databaseProvider: 'RxNorm',
        errorResponse: '{"error":"service_unavailable","message":"Database maintenance in progress"}',
        userId: '123e4567-e89b-12d3-a456-426614174012',
        isRetryable: true,
        retryAfter: 1800,
        journeyContext: 'care'
      }
    }
  },

  /**
   * Symptom checker errors
   */
  symptoms: {
    /**
     * Emergency detected error
     */
    emergencyDetected: {
      name: 'SymptomEmergencyDetectedError',
      message: 'Emergency medical condition detected',
      code: 'CARE_SYMPTOM_BUSINESS_EMERGENCY_DETECTED',
      type: 'BUSINESS',
      status: HttpStatus.OK, // This is a business event, not an error response
      stack: 'SymptomEmergencyDetectedError: Emergency medical condition detected\n    at SymptomCheckerService.analyzeSymptoms (/src/backend/care-service/src/symptom-checker/symptom-checker.service.ts:112:11)\n    at SymptomCheckerService.checkSymptoms (/src/backend/care-service/src/symptom-checker/symptom-checker.service.ts:52:36)',
      context: {
        requestId: 'bc3c-5532-l921-m6cd48a1f72n',
        symptoms: ['chest pain', 'shortness of breath', 'left arm pain'],
        emergencyLevel: 'high',
        recommendedAction: 'Call emergency services immediately',
        userId: '123e4567-e89b-12d3-a456-426614174013',
        journeyContext: 'care'
      }
    },

    /**
     * Symptom assessment incomplete error
     */
    assessmentIncomplete: {
      name: 'SymptomAssessmentIncompleteError',
      message: 'Symptom assessment is incomplete',
      code: 'CARE_SYMPTOM_VALIDATION_INVALID_DESCRIPTION',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'SymptomAssessmentIncompleteError: Symptom assessment is incomplete\n    at SymptomCheckerService.validateAssessment (/src/backend/care-service/src/symptom-checker/symptom-checker.service.ts:145:11)\n    at SymptomCheckerService.checkSymptoms (/src/backend/care-service/src/symptom-checker/symptom-checker.service.ts:48:14)',
      context: {
        requestId: 'cc3c-5532-m921-n6cd48a1f72o',
        missingInformation: ['symptom duration', 'symptom severity'],
        providedSymptoms: ['headache'],
        userId: '123e4567-e89b-12d3-a456-426614174013',
        journeyContext: 'care'
      }
    },

    /**
     * Diagnostic API error
     */
    diagnosticApiError: {
      name: 'SymptomEngineFunctionError',
      message: 'Failed to process symptoms through diagnostic engine',
      code: 'CARE_SYMPTOM_EXTERNAL_DIAGNOSTIC_API_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'SymptomEngineFunctionError: Failed to process symptoms through diagnostic engine\n    at DiagnosticEngineService.processSymptoms (/src/backend/care-service/src/symptom-checker/diagnostic-engine.service.ts:67:11)\n    at SymptomCheckerService.checkSymptoms (/src/backend/care-service/src/symptom-checker/symptom-checker.service.ts:55:36)',
      context: {
        requestId: 'dc3c-5532-n921-o6cd48a1f72p',
        symptoms: ['fever', 'cough', 'fatigue'],
        diagnosticEngine: 'Infermedica API',
        errorResponse: '{"error":"processing_error","message":"Failed to process request due to internal error"}',
        userId: '123e4567-e89b-12d3-a456-426614174013',
        isRetryable: true,
        journeyContext: 'care'
      }
    }
  },

  /**
   * Treatment errors
   */
  treatments: {
    /**
     * Treatment plan not found error
     */
    treatmentPlanNotFound: {
      name: 'TreatmentPlanNotFoundError',
      message: 'Treatment plan not found',
      code: 'CARE_TREATMENT_BUSINESS_NOT_FOUND',
      type: 'BUSINESS',
      status: HttpStatus.NOT_FOUND,
      stack: 'TreatmentPlanNotFoundError: Treatment plan not found\n    at TreatmentService.getTreatmentPlan (/src/backend/care-service/src/treatments/treatments.service.ts:78:11)\n    at TreatmentController.getTreatmentPlan (/src/backend/care-service/src/treatments/treatments.controller.ts:45:36)',
      context: {
        requestId: 'ec3c-5532-o921-p6cd48a1f72q',
        treatmentPlanId: '123e4567-e89b-12d3-a456-426614174034',
        userId: '123e4567-e89b-12d3-a456-426614174014',
        journeyContext: 'care'
      }
    },

    /**
     * Treatment step invalid error
     */
    treatmentStepInvalid: {
      name: 'TreatmentStepInvalidError',
      message: 'Invalid treatment step configuration',
      code: 'CARE_TREATMENT_VALIDATION_INVALID_PROTOCOL',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'TreatmentStepInvalidError: Invalid treatment step configuration\n    at TreatmentService.validateTreatmentStep (/src/backend/care-service/src/treatments/treatments.service.ts:112:11)\n    at TreatmentService.createTreatmentPlan (/src/backend/care-service/src/treatments/treatments.service.ts:48:14)',
      context: {
        requestId: 'fc3c-5532-p921-q6cd48a1f72r',
        treatmentType: 'PhysicalTherapy',
        errors: [
          {
            field: 'frequency',
            message: 'Frequency must be specified for physical therapy',
            value: null
          },
          {
            field: 'duration',
            message: 'Duration must be a positive number',
            value: -1
          }
        ],
        userId: '123e4567-e89b-12d3-a456-426614174014',
        journeyContext: 'care'
      }
    },

    /**
     * Clinical guidelines error
     */
    clinicalGuidelinesError: {
      name: 'ClinicalGuidelinesError',
      message: 'Failed to retrieve clinical guidelines for treatment',
      code: 'CARE_TREATMENT_EXTERNAL_PROTOCOL_DATABASE_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'ClinicalGuidelinesError: Failed to retrieve clinical guidelines for treatment\n    at ClinicalGuidelinesService.getGuidelines (/src/backend/care-service/src/treatments/clinical-guidelines.service.ts:67:11)\n    at TreatmentService.createTreatmentPlan (/src/backend/care-service/src/treatments/treatments.service.ts:45:36)',
      context: {
        requestId: 'gc3c-5532-q921-r6cd48a1f72s',
        condition: 'Type 2 Diabetes',
        treatmentType: 'Lifestyle Modification',
        guidelinesProvider: 'ADA Clinical Guidelines',
        errorResponse: '{"error":"not_found","message":"Guidelines not found for the specified condition and treatment type"}',
        userId: '123e4567-e89b-12d3-a456-426614174014',
        isRetryable: false,
        journeyContext: 'care'
      }
    }
  }
};

// ===== PLAN JOURNEY ERROR SCENARIOS =====

/**
 * Plan journey specific error scenarios
 */
export const planErrorScenarios = {
  /**
   * Plans errors
   */
  plans: {
    /**
     * Plan not found error
     */
    planNotFound: {
      name: 'PlanNotFoundError',
      message: 'Insurance plan not found',
      code: 'PLAN_PLANS_BUSINESS_NOT_FOUND',
      type: 'BUSINESS',
      status: HttpStatus.NOT_FOUND,
      stack: 'PlanNotFoundError: Insurance plan not found\n    at PlanService.getPlan (/src/backend/plan-service/src/plans/plans.service.ts:78:11)\n    at PlanController.getPlan (/src/backend/plan-service/src/plans/plans.controller.ts:45:36)',
      context: {
        requestId: 'hc3c-5532-r921-s6cd48a1f72t',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Plan not available in region error
     */
    planNotAvailableInRegion: {
      name: 'PlanNotAvailableInRegionError',
      message: 'Insurance plan is not available in your region',
      code: 'PLAN_PLANS_BUSINESS_NOT_AVAILABLE_IN_REGION',
      type: 'BUSINESS',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: 'PlanNotAvailableInRegionError: Insurance plan is not available in your region\n    at PlanService.validatePlanAvailability (/src/backend/plan-service/src/plans/plans.service.ts:112:11)\n    at PlanService.selectPlan (/src/backend/plan-service/src/plans/plans.service.ts:52:14)',
      context: {
        requestId: 'ic3c-5532-s921-t6cd48a1f72u',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        planName: 'Premium Health Plus',
        userRegion: 'CA',
        availableRegions: ['NY', 'TX', 'FL'],
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Plan provider API error
     */
    planProviderApiError: {
      name: 'PlanProviderApiError',
      message: 'Failed to retrieve plan information from provider',
      code: 'PLAN_PLANS_EXTERNAL_PROVIDER_API_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'PlanProviderApiError: Failed to retrieve plan information from provider\n    at InsuranceProviderService.getPlanDetails (/src/backend/plan-service/src/plans/insurance-provider.service.ts:67:11)\n    at PlanService.getPlan (/src/backend/plan-service/src/plans/plans.service.ts:75:36)',
      context: {
        requestId: 'jc3c-5532-t921-u6cd48a1f72v',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        providerName: 'Blue Cross Blue Shield',
        errorResponse: '{"error":"service_unavailable","message":"The plan information service is currently unavailable"}',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        isRetryable: true,
        journeyContext: 'plan'
      }
    }
  },

  /**
   * Benefits errors
   */
  benefits: {
    /**
     * Benefit not covered error
     */
    benefitNotCovered: {
      name: 'BenefitNotCoveredError',
      message: 'Benefit is not covered by the plan',
      code: 'PLAN_BENEFITS_BUSINESS_NOT_COVERED',
      type: 'BUSINESS',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: 'BenefitNotCoveredError: Benefit is not covered by the plan\n    at BenefitService.checkCoverage (/src/backend/plan-service/src/benefits/benefits.service.ts:112:11)\n    at BenefitService.getBenefitDetails (/src/backend/plan-service/src/benefits/benefits.service.ts:52:14)',
      context: {
        requestId: 'kc3c-5532-u921-v6cd48a1f72w',
        benefitType: 'Dental',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        planName: 'Basic Health Plan',
        coveredBenefits: ['Medical', 'Pharmacy', 'Vision'],
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Benefit limit exceeded error
     */
    benefitLimitExceeded: {
      name: 'BenefitLimitExceededError',
      message: 'Benefit usage limit has been exceeded',
      code: 'PLAN_BENEFITS_BUSINESS_LIMIT_EXCEEDED',
      type: 'BUSINESS',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: 'BenefitLimitExceededError: Benefit usage limit has been exceeded\n    at BenefitService.checkUsageLimits (/src/backend/plan-service/src/benefits/benefits.service.ts:145:11)\n    at BenefitService.useBenefit (/src/backend/plan-service/src/benefits/benefits.service.ts:78:14)',
      context: {
        requestId: 'lc3c-5532-v921-w6cd48a1f72x',
        benefitType: 'Physical Therapy',
        currentUsage: 30,
        maxAllowed: 30,
        period: 'calendar year',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Benefit verification API error
     */
    benefitVerificationApiError: {
      name: 'BenefitVerificationApiError',
      message: 'Failed to verify benefit eligibility with provider',
      code: 'PLAN_BENEFITS_EXTERNAL_VERIFICATION_API_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'BenefitVerificationApiError: Failed to verify benefit eligibility with provider\n    at BenefitVerificationService.verifyEligibility (/src/backend/plan-service/src/benefits/benefit-verification.service.ts:67:11)\n    at BenefitService.checkEligibility (/src/backend/plan-service/src/benefits/benefits.service.ts:95:36)',
      context: {
        requestId: 'mc3c-5532-w921-x6cd48a1f72y',
        benefitType: 'Specialist Visit',
        providerName: 'Aetna',
        errorResponse: '{"error":"timeout","message":"Request timed out while waiting for response"}',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        isRetryable: true,
        journeyContext: 'plan'
      }
    }
  },

  /**
   * Coverage errors
   */
  coverage: {
    /**
     * Service not covered error
     */
    serviceNotCovered: {
      name: 'ServiceNotCoveredError',
      message: 'Service is not covered by the insurance plan',
      code: 'PLAN_COVERAGE_BUSINESS_SERVICE_NOT_COVERED',
      type: 'BUSINESS',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: 'ServiceNotCoveredError: Service is not covered by the insurance plan\n    at CoverageService.checkServiceCoverage (/src/backend/plan-service/src/coverage/coverage.service.ts:112:11)\n    at CoverageService.verifyCoverage (/src/backend/plan-service/src/coverage/coverage.service.ts:52:14)',
      context: {
        requestId: 'nc3c-5532-x921-y6cd48a1f72z',
        serviceCode: 'CPT-90853',
        serviceDescription: 'Group psychotherapy',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        planName: 'Basic Health Plan',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Out of network error
     */
    outOfNetworkError: {
      name: 'OutOfNetworkError',
      message: 'Provider is out of network for the insurance plan',
      code: 'PLAN_COVERAGE_BUSINESS_OUT_OF_NETWORK',
      type: 'BUSINESS',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      stack: 'OutOfNetworkError: Provider is out of network for the insurance plan\n    at CoverageService.checkNetworkStatus (/src/backend/plan-service/src/coverage/coverage.service.ts:145:11)\n    at CoverageService.verifyCoverage (/src/backend/plan-service/src/coverage/coverage.service.ts:55:14)',
      context: {
        requestId: 'oc3c-5532-y921-z6cd48a1f72a',
        providerId: '123e4567-e89b-12d3-a456-426614174022',
        providerName: 'Dr. Jane Smith',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        planName: 'HMO Basic',
        outOfNetworkCoverage: '50% after deductible',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Coverage API integration error
     */
    coverageApiIntegrationError: {
      name: 'CoverageApiIntegrationError',
      message: 'Failed to verify coverage with insurance provider',
      code: 'PLAN_COVERAGE_EXTERNAL_API_INTEGRATION_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'CoverageApiIntegrationError: Failed to verify coverage with insurance provider\n    at CoverageVerificationService.verifyCoverage (/src/backend/plan-service/src/coverage/coverage-verification.service.ts:67:11)\n    at CoverageService.verifyCoverage (/src/backend/plan-service/src/coverage/coverage.service.ts:58:36)',
      context: {
        requestId: 'pc3c-5532-z921-a6cd48a1f72b',
        serviceCode: 'CPT-99213',
        providerId: '123e4567-e89b-12d3-a456-426614174022',
        insuranceProvider: 'United Healthcare',
        errorResponse: '{"error":"integration_error","message":"Failed to connect to coverage verification service"}',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        isRetryable: true,
        journeyContext: 'plan'
      }
    }
  },

  /**
   * Claims errors
   */
  claims: {
    /**
     * Duplicate claim error
     */
    duplicateClaim: {
      name: 'DuplicateClaimError',
      message: 'Duplicate claim submission detected',
      code: 'PLAN_CLAIMS_BUSINESS_DUPLICATE',
      type: 'BUSINESS',
      status: HttpStatus.CONFLICT,
      stack: 'DuplicateClaimError: Duplicate claim submission detected\n    at ClaimService.checkForDuplicates (/src/backend/plan-service/src/claims/claims.service.ts:112:11)\n    at ClaimService.submitClaim (/src/backend/plan-service/src/claims/claims.service.ts:52:14)',
      context: {
        requestId: 'qc3c-5532-a921-b6cd48a1f72c',
        newClaimDetails: {
          serviceDate: '2023-05-01',
          providerName: 'Dr. John Doe',
          serviceCode: 'CPT-99214'
        },
        existingClaimId: '123e4567-e89b-12d3-a456-426614174036',
        existingClaimStatus: 'processing',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Claim validation error
     */
    claimValidationError: {
      name: 'ClaimValidationError',
      message: 'Invalid claim submission data',
      code: 'PLAN_CLAIMS_VALIDATION_INVALID_DATA',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'ClaimValidationError: Invalid claim submission data\n    at ClaimService.validateClaimData (/src/backend/plan-service/src/claims/claims.service.ts:145:11)\n    at ClaimService.submitClaim (/src/backend/plan-service/src/claims/claims.service.ts:48:14)',
      context: {
        requestId: 'rc3c-5532-b921-c6cd48a1f72d',
        errors: [
          {
            field: 'serviceDate',
            message: 'Service date cannot be in the future',
            value: '2024-01-01'
          },
          {
            field: 'amount',
            message: 'Amount must be greater than zero',
            value: 0
          }
        ],
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Claim processing API error
     */
    claimProcessingApiError: {
      name: 'ClaimProcessingApiError',
      message: 'Failed to submit claim to insurance provider',
      code: 'PLAN_CLAIMS_EXTERNAL_PROCESSING_API_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'ClaimProcessingApiError: Failed to submit claim to insurance provider\n    at ClaimProcessingService.submitClaim (/src/backend/plan-service/src/claims/claim-processing.service.ts:67:11)\n    at ClaimService.submitClaim (/src/backend/plan-service/src/claims/claims.service.ts:65:36)',
      context: {
        requestId: 'sc3c-5532-c921-d6cd48a1f72e',
        claimId: '123e4567-e89b-12d3-a456-426614174037',
        insuranceProvider: 'Cigna',
        errorResponse: '{"error":"processing_error","message":"Unable to process claim at this time"}',
        planId: '123e4567-e89b-12d3-a456-426614174035',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        isRetryable: true,
        journeyContext: 'plan'
      }
    }
  },

  /**
   * Documents errors
   */
  documents: {
    /**
     * Document format error
     */
    documentFormatError: {
      name: 'DocumentFormatError',
      message: 'Invalid document format',
      code: 'PLAN_DOCUMENTS_VALIDATION_INVALID_FORMAT',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'DocumentFormatError: Invalid document format\n    at DocumentService.validateFormat (/src/backend/plan-service/src/documents/documents.service.ts:112:11)\n    at DocumentService.uploadDocument (/src/backend/plan-service/src/documents/documents.service.ts:48:14)',
      context: {
        requestId: 'tc3c-5532-d921-e6cd48a1f72f',
        documentType: 'Insurance Card',
        providedFormat: 'bmp',
        allowedFormats: ['jpg', 'png', 'pdf'],
        fileName: 'insurance_card.bmp',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Document size exceeded error
     */
    documentSizeExceeded: {
      name: 'DocumentSizeExceededError',
      message: 'Document size exceeds maximum allowed limit',
      code: 'PLAN_DOCUMENTS_VALIDATION_SIZE_EXCEEDED',
      type: 'VALIDATION',
      status: HttpStatus.BAD_REQUEST,
      stack: 'DocumentSizeExceededError: Document size exceeds maximum allowed limit\n    at DocumentService.validateSize (/src/backend/plan-service/src/documents/documents.service.ts:145:11)\n    at DocumentService.uploadDocument (/src/backend/plan-service/src/documents/documents.service.ts:52:14)',
      context: {
        requestId: 'uc3c-5532-e921-f6cd48a1f72g',
        documentType: 'Medical Record',
        fileSize: 15728640, // 15MB
        maxAllowedSize: 10485760, // 10MB
        fileName: 'medical_record.pdf',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        journeyContext: 'plan'
      }
    },

    /**
     * Document storage error
     */
    documentStorageError: {
      name: 'DocumentStorageError',
      message: 'Failed to store document',
      code: 'PLAN_DOCUMENTS_TECHNICAL_STORAGE_ERROR',
      type: 'TECHNICAL',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      stack: 'DocumentStorageError: Failed to store document\n    at DocumentStorageService.storeDocument (/src/backend/plan-service/src/documents/document-storage.service.ts:67:11)\n    at DocumentService.uploadDocument (/src/backend/plan-service/src/documents/documents.service.ts:65:36)',
      context: {
        requestId: 'vc3c-5532-f921-g6cd48a1f72h',
        documentType: 'Explanation of Benefits',
        storageProvider: 'AWS S3',
        errorCode: 'InternalError',
        errorMessage: 'We encountered an internal error. Please try again.',
        fileName: 'eob_2023-05-15.pdf',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        isRetryable: true,
        journeyContext: 'plan'
      }
    },

    /**
     * Document verification error
     */
    documentVerificationError: {
      name: 'DocumentVerificationError',
      message: 'Failed to verify document authenticity',
      code: 'PLAN_DOCUMENTS_EXTERNAL_VERIFICATION_ERROR',
      type: 'EXTERNAL',
      status: HttpStatus.FAILED_DEPENDENCY,
      stack: 'DocumentVerificationError: Failed to verify document authenticity\n    at DocumentVerificationService.verifyDocument (/src/backend/plan-service/src/documents/document-verification.service.ts:67:11)\n    at DocumentService.uploadDocument (/src/backend/plan-service/src/documents/documents.service.ts:68:36)',
      context: {
        requestId: 'wc3c-5532-g921-h6cd48a1f72i',
        documentType: 'Insurance Card',
        verificationProvider: 'ID Verify API',
        errorResponse: '{"error":"verification_failed","message":"Unable to verify document authenticity"}',
        fileName: 'insurance_card.jpg',
        userId: '123e4567-e89b-12d3-a456-426614174015',
        isRetryable: true,
        journeyContext: 'plan'
      }
    }
  }
};