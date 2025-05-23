import { LogEntry, JourneyType, ErrorInfo } from '../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';

/**
 * Provides a comprehensive set of sample log entry objects for testing LoggerService
 * and formatter implementations. Contains standardized log entries at different levels
 * with various context objects, metadata, and payload structures.
 */

// Basic log entries for each log level
export const basicLogEntries: Record<string, LogEntry> = {
  debug: {
    message: 'Debug message for testing',
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-06-15T10:00:00Z'),
    serviceName: 'test-service',
    context: 'TestContext'
  },
  info: {
    message: 'Info message for testing',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T10:01:00Z'),
    serviceName: 'test-service',
    context: 'TestContext'
  },
  warn: {
    message: 'Warning message for testing',
    level: LogLevel.WARN,
    timestamp: new Date('2023-06-15T10:02:00Z'),
    serviceName: 'test-service',
    context: 'TestContext'
  },
  error: {
    message: 'Error message for testing',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T10:03:00Z'),
    serviceName: 'test-service',
    context: 'TestContext'
  },
  fatal: {
    message: 'Fatal message for testing',
    level: LogLevel.FATAL,
    timestamp: new Date('2023-06-15T10:04:00Z'),
    serviceName: 'test-service',
    context: 'TestContext'
  }
};

// Log entries with request context
export const requestContextLogEntries: Record<string, LogEntry> = {
  withRequestId: {
    message: 'Log with request ID',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T11:00:00Z'),
    serviceName: 'api-gateway',
    context: 'RequestHandler',
    requestId: '123e4567-e89b-12d3-a456-426614174000'
  },
  withUserContext: {
    message: 'Log with user context',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T11:01:00Z'),
    serviceName: 'auth-service',
    context: 'AuthController',
    requestId: '123e4567-e89b-12d3-a456-426614174001',
    userId: 'user-123',
    sessionId: 'session-456',
    clientIp: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  withFullContext: {
    message: 'Log with full request context',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T11:02:00Z'),
    serviceName: 'api-gateway',
    context: 'GraphQLResolver',
    requestId: '123e4567-e89b-12d3-a456-426614174002',
    userId: 'user-456',
    sessionId: 'session-789',
    clientIp: '10.0.0.1',
    userAgent: 'AUSTA-Mobile-App/1.0.0',
    contextData: {
      endpoint: '/graphql',
      method: 'POST',
      duration: 120,
      statusCode: 200
    }
  }
};

// Log entries with journey context
export const journeyContextLogEntries: Record<string, LogEntry> = {
  healthJourney: {
    message: 'Health metric recorded',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T12:00:00Z'),
    serviceName: 'health-service',
    context: 'HealthMetricsController',
    requestId: '123e4567-e89b-12d3-a456-426614174003',
    userId: 'user-789',
    journey: {
      type: JourneyType.HEALTH,
      resourceId: 'health-record-123',
      action: 'record-metric',
      data: {
        metricType: 'blood-pressure',
        systolic: 120,
        diastolic: 80,
        deviceId: 'device-456'
      }
    }
  },
  careJourney: {
    message: 'Appointment scheduled',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T12:01:00Z'),
    serviceName: 'care-service',
    context: 'AppointmentController',
    requestId: '123e4567-e89b-12d3-a456-426614174004',
    userId: 'user-101',
    journey: {
      type: JourneyType.CARE,
      resourceId: 'appointment-456',
      action: 'schedule',
      data: {
        providerId: 'provider-789',
        specialtyId: 'specialty-101',
        dateTime: '2023-07-01T14:30:00Z',
        location: 'virtual'
      }
    }
  },
  planJourney: {
    message: 'Claim submitted',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T12:02:00Z'),
    serviceName: 'plan-service',
    context: 'ClaimController',
    requestId: '123e4567-e89b-12d3-a456-426614174005',
    userId: 'user-202',
    journey: {
      type: JourneyType.PLAN,
      resourceId: 'claim-303',
      action: 'submit',
      data: {
        planId: 'plan-404',
        providerId: 'provider-505',
        serviceDate: '2023-06-10',
        amount: 150.75,
        serviceType: 'consultation'
      }
    }
  }
};

// Error log entries with different error types
export const errorLogEntries: Record<string, LogEntry> = {
  basicError: {
    message: 'Basic error occurred',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T13:00:00Z'),
    serviceName: 'auth-service',
    context: 'AuthService',
    requestId: '123e4567-e89b-12d3-a456-426614174006',
    userId: 'user-606',
    error: {
      message: 'Authentication failed',
      name: 'AuthenticationError',
      code: 'AUTH_001'
    }
  },
  withStackTrace: {
    message: 'Error with stack trace',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T13:01:00Z'),
    serviceName: 'health-service',
    context: 'HealthMetricsService',
    requestId: '123e4567-e89b-12d3-a456-426614174007',
    userId: 'user-707',
    error: {
      message: 'Failed to save health metric',
      name: 'DatabaseError',
      code: 'DB_001',
      stack: `Error: Failed to save health metric\n    at HealthMetricsService.saveMetric (/app/src/health-metrics/health-metrics.service.ts:45:23)\n    at HealthMetricsController.recordMetric (/app/src/health-metrics/health-metrics.controller.ts:32:35)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`
    }
  },
  transientError: {
    message: 'Transient error occurred',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T13:02:00Z'),
    serviceName: 'care-service',
    context: 'AppointmentService',
    requestId: '123e4567-e89b-12d3-a456-426614174008',
    userId: 'user-808',
    error: {
      message: 'Failed to connect to provider calendar service',
      name: 'ConnectionError',
      code: 'CONN_001',
      isTransient: true,
      stack: `Error: Failed to connect to provider calendar service\n    at AppointmentService.scheduleAppointment (/app/src/appointments/appointment.service.ts:78:12)\n    at AppointmentController.createAppointment (/app/src/appointments/appointment.controller.ts:54:22)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`
    }
  },
  clientError: {
    message: 'Client error occurred',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T13:03:00Z'),
    serviceName: 'plan-service',
    context: 'ClaimValidator',
    requestId: '123e4567-e89b-12d3-a456-426614174009',
    userId: 'user-909',
    error: {
      message: 'Invalid claim data provided',
      name: 'ValidationError',
      code: 'VAL_001',
      isClientError: true,
      stack: `Error: Invalid claim data provided\n    at ClaimValidator.validate (/app/src/claims/claim.validator.ts:32:11)\n    at ClaimService.submitClaim (/app/src/claims/claim.service.ts:45:23)\n    at ClaimController.createClaim (/app/src/claims/claim.controller.ts:38:19)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`
    }
  },
  externalError: {
    message: 'External system error',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T13:04:00Z'),
    serviceName: 'health-service',
    context: 'FHIRIntegrationService',
    requestId: '123e4567-e89b-12d3-a456-426614174010',
    userId: 'user-1010',
    error: {
      message: 'FHIR server returned error response',
      name: 'ExternalAPIError',
      code: 'EXT_001',
      isExternalError: true,
      originalError: {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'processing',
            diagnostics: 'Internal server error occurred while processing request'
          }]
        }
      }
    }
  },
  fatalError: {
    message: 'Critical system failure',
    level: LogLevel.FATAL,
    timestamp: new Date('2023-06-15T13:05:00Z'),
    serviceName: 'api-gateway',
    context: 'SystemMonitor',
    error: {
      message: 'Database connection pool exhausted',
      name: 'SystemError',
      code: 'SYS_001',
      stack: `Error: Database connection pool exhausted\n    at DatabaseService.getConnection (/app/src/database/database.service.ts:112:11)\n    at ConnectionPoolMonitor.checkHealth (/app/src/monitoring/connection-pool.monitor.ts:45:23)\n    at SystemMonitor.runHealthChecks (/app/src/monitoring/system.monitor.ts:67:35)\n    at Timeout._onTimeout (/app/src/monitoring/system.monitor.ts:32:19)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/timers:502:7)`
    }
  }
};

// Log entries with distributed tracing context
export const tracingLogEntries: Record<string, LogEntry> = {
  withTraceId: {
    message: 'Request received with trace ID',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T14:00:00Z'),
    serviceName: 'api-gateway',
    context: 'TracingMiddleware',
    requestId: '123e4567-e89b-12d3-a456-426614174011',
    traceId: 'trace-abc-123-xyz-789'
  },
  withSpanId: {
    message: 'Processing request with span ID',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T14:00:01Z'),
    serviceName: 'api-gateway',
    context: 'AuthMiddleware',
    requestId: '123e4567-e89b-12d3-a456-426614174011',
    traceId: 'trace-abc-123-xyz-789',
    spanId: 'span-def-456',
    parentSpanId: 'span-abc-123'
  },
  serviceA: {
    message: 'Service A processing request',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T14:00:02Z'),
    serviceName: 'auth-service',
    context: 'AuthController',
    requestId: '123e4567-e89b-12d3-a456-426614174011',
    userId: 'user-1111',
    traceId: 'trace-abc-123-xyz-789',
    spanId: 'span-ghi-789',
    parentSpanId: 'span-def-456'
  },
  serviceB: {
    message: 'Service B processing request',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T14:00:03Z'),
    serviceName: 'health-service',
    context: 'HealthController',
    requestId: '123e4567-e89b-12d3-a456-426614174011',
    userId: 'user-1111',
    traceId: 'trace-abc-123-xyz-789',
    spanId: 'span-jkl-012',
    parentSpanId: 'span-def-456'
  },
  errorWithTrace: {
    message: 'Error occurred in traced request',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T14:00:04Z'),
    serviceName: 'health-service',
    context: 'HealthService',
    requestId: '123e4567-e89b-12d3-a456-426614174011',
    userId: 'user-1111',
    traceId: 'trace-abc-123-xyz-789',
    spanId: 'span-mno-345',
    parentSpanId: 'span-jkl-012',
    error: {
      message: 'Failed to retrieve health data',
      name: 'DataAccessError',
      code: 'DATA_001',
      stack: `Error: Failed to retrieve health data\n    at HealthService.getUserData (/app/src/health/health.service.ts:67:19)\n    at HealthController.getUserHealth (/app/src/health/health.controller.ts:42:23)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`
    }
  }
};

// Log entries with various metadata combinations
export const metadataLogEntries: Record<string, LogEntry> = {
  withPerformanceMetrics: {
    message: 'Request completed',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T15:00:00Z'),
    serviceName: 'api-gateway',
    context: 'PerformanceInterceptor',
    requestId: '123e4567-e89b-12d3-a456-426614174012',
    metadata: {
      duration: 145.32,
      endpoint: '/api/v1/health/metrics',
      method: 'GET',
      statusCode: 200,
      responseSize: 1024,
      cacheHit: false
    }
  },
  withDatabaseMetrics: {
    message: 'Database query executed',
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-06-15T15:01:00Z'),
    serviceName: 'health-service',
    context: 'DatabaseInterceptor',
    requestId: '123e4567-e89b-12d3-a456-426614174013',
    metadata: {
      queryType: 'SELECT',
      table: 'health_metrics',
      duration: 12.45,
      rowCount: 5,
      cached: false,
      indexUsed: 'idx_user_id_metric_type'
    }
  },
  withAuthMetadata: {
    message: 'User authenticated',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T15:02:00Z'),
    serviceName: 'auth-service',
    context: 'AuthService',
    requestId: '123e4567-e89b-12d3-a456-426614174014',
    userId: 'user-1212',
    metadata: {
      authMethod: 'password',
      mfaUsed: true,
      mfaType: 'totp',
      deviceTrusted: true,
      ipLocationChanged: false,
      lastLogin: '2023-06-14T10:23:45Z'
    }
  },
  withFeatureFlags: {
    message: 'Feature flags evaluated',
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-06-15T15:03:00Z'),
    serviceName: 'api-gateway',
    context: 'FeatureFlagMiddleware',
    requestId: '123e4567-e89b-12d3-a456-426614174015',
    userId: 'user-1313',
    metadata: {
      flags: {
        'new-health-dashboard': true,
        'enhanced-appointment-booking': false,
        'ai-symptom-checker': true,
        'claim-auto-processing': false
      },
      source: 'redis',
      evaluationTime: 3.21
    }
  },
  withBusinessMetrics: {
    message: 'Business event recorded',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T15:04:00Z'),
    serviceName: 'gamification-engine',
    context: 'AchievementService',
    requestId: '123e4567-e89b-12d3-a456-426614174016',
    userId: 'user-1414',
    journey: {
      type: JourneyType.HEALTH,
      resourceId: 'achievement-123',
      action: 'unlock'
    },
    metadata: {
      achievementType: 'streak',
      achievementName: '7-day Activity Streak',
      pointsAwarded: 50,
      userLevel: 3,
      totalPoints: 750,
      nextLevelAt: 1000,
      isFirstTimeUnlock: true
    }
  }
};

// Environment-specific log entries for testing formatters
export const environmentSpecificLogEntries: Record<string, LogEntry> = {
  development: {
    message: 'Development environment log',
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-06-15T16:00:00Z'),
    serviceName: 'api-gateway',
    context: 'DevController',
    requestId: '123e4567-e89b-12d3-a456-426614174017',
    userId: 'dev-user',
    metadata: {
      environment: 'development',
      debugMode: true,
      mockServices: ['payment-service', 'notification-service'],
      localOverrides: {
        'feature.new-dashboard': true,
        'api.timeout': 30000
      }
    }
  },
  staging: {
    message: 'Staging environment log',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T16:01:00Z'),
    serviceName: 'health-service',
    context: 'StagingController',
    requestId: '123e4567-e89b-12d3-a456-426614174018',
    userId: 'test-user',
    metadata: {
      environment: 'staging',
      testSuite: 'integration',
      testCase: 'health-metrics-sync',
      testData: {
        userId: 'test-user',
        deviceId: 'test-device-123'
      }
    }
  },
  production: {
    message: 'Production environment log',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T16:02:00Z'),
    serviceName: 'care-service',
    context: 'AppointmentController',
    requestId: '123e4567-e89b-12d3-a456-426614174019',
    userId: 'user-1515',
    metadata: {
      environment: 'production',
      region: 'us-east-1',
      instanceId: 'i-1234567890abcdef0',
      deploymentId: 'deploy-20230614-001'
    }
  }
};

// Combined collection of all log entries for easy access
export const allLogEntries = {
  ...basicLogEntries,
  ...requestContextLogEntries,
  ...journeyContextLogEntries,
  ...errorLogEntries,
  ...tracingLogEntries,
  ...metadataLogEntries,
  ...environmentSpecificLogEntries
};

// Helper function to create a custom log entry by extending an existing one
export function createCustomLogEntry(baseName: string, overrides: Partial<LogEntry>): LogEntry {
  const base = allLogEntries[baseName] || basicLogEntries.info;
  return {
    ...base,
    ...overrides,
    timestamp: overrides.timestamp || new Date(),
    // Deep merge for nested objects if needed
    metadata: overrides.metadata ? { ...base.metadata, ...overrides.metadata } : base.metadata,
    error: overrides.error ? { ...base.error, ...overrides.error } : base.error,
    journey: overrides.journey ? { ...base.journey, ...overrides.journey } : base.journey
  };
}