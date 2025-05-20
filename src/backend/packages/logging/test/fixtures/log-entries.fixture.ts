/**
 * @file Log Entries Fixture
 * @description Provides a comprehensive set of sample log entry objects for testing LoggerService and formatter implementations.
 * Contains standardized log entries at different levels (DEBUG, INFO, WARN, ERROR, FATAL) with various context objects,
 * metadata, and payload structures.
 */

import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JourneyType } from '../../src/context/journey-context.interface';
import { requestContexts, userContexts, transactionContexts, journeyContexts, combinedContexts } from './log-contexts.fixture';
import { standardErrors, applicationExceptions, journeyErrors, validationErrors, nestedErrors, contextualErrors } from './error-objects.fixture';

/**
 * Interface representing a log entry for testing purposes.
 * This structure mirrors the expected format of log entries in the system.
 */
export interface LogEntry {
  /** Log level indicating severity */
  level: LogLevel;
  /** String representation of the log level */
  levelName: string;
  /** Timestamp when the log entry was created */
  timestamp: string;
  /** Log message */
  message: string;
  /** Service or component that generated the log */
  service?: string;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** Trace ID for distributed tracing */
  traceId?: string;
  /** Span ID for distributed tracing */
  spanId?: string;
  /** Request ID for HTTP request tracking */
  requestId?: string;
  /** User ID for user-specific logging */
  userId?: string;
  /** Journey type (health, care, plan) */
  journeyType?: JourneyType;
  /** Context object with additional information */
  context?: Record<string, any>;
  /** Error object for ERROR and FATAL levels */
  error?: Error | Record<string, any>;
  /** Stack trace for error logs */
  stack?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Application version */
  version?: string;
}

/**
 * Helper function to create a basic log entry with default values
 */
const createBaseLogEntry = (level: LogLevel, message: string): LogEntry => ({
  level,
  levelName: LogLevel[level],
  timestamp: new Date().toISOString(),
  message,
  service: 'test-service',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  traceId: 'trace-550e8400-e29b-41d4-a716-446655440000',
  spanId: 'span-550e8400-e29b-41d4-a716-446655440000',
  environment: 'test',
  version: '1.0.0',
});

/**
 * Debug level log entries for testing debug logging functionality
 */
export const debugLogEntries = {
  /**
   * Basic debug log with minimal information
   */
  basicDebug: createBaseLogEntry(
    LogLevel.DEBUG,
    'Debug message for testing basic debug logging'
  ),

  /**
   * Debug log with detailed context information
   */
  detailedDebug: {
    ...createBaseLogEntry(LogLevel.DEBUG, 'Detailed debug log with context'),
    context: {
      function: 'processHealthMetric',
      params: {
        metricType: 'heart-rate',
        value: 72,
        timestamp: '2023-04-15T14:30:40.000Z',
      },
      duration: 45, // milliseconds
    },
    metadata: {
      debugMode: true,
      verbosityLevel: 3,
      source: 'health-service',
    },
  },

  /**
   * Debug log with journey context for health journey
   */
  healthJourneyDebug: {
    ...createBaseLogEntry(LogLevel.DEBUG, 'Health journey metric processing'),
    journeyType: JourneyType.HEALTH,
    context: journeyContexts.healthJourney,
    metadata: {
      metricType: 'heart-rate',
      metricValue: 72,
      metricUnit: 'bpm',
      deviceId: 'fitbit-123456',
    },
  },

  /**
   * Debug log with request context
   */
  requestDebug: {
    ...createBaseLogEntry(LogLevel.DEBUG, 'Processing API request'),
    requestId: requestContexts.detailedPostRequest.requestId,
    context: requestContexts.detailedPostRequest,
  },

  /**
   * Debug log with performance metrics
   */
  performanceDebug: {
    ...createBaseLogEntry(LogLevel.DEBUG, 'Performance metrics'),
    context: {
      operation: 'fetchHealthMetrics',
      metrics: {
        dbQueryTime: 25, // milliseconds
        processingTime: 15, // milliseconds
        totalTime: 40, // milliseconds
        cacheHit: false,
        recordCount: 10,
      },
    },
  },
};

/**
 * Info level log entries for testing info logging functionality
 */
export const infoLogEntries = {
  /**
   * Basic info log with minimal information
   */
  basicInfo: createBaseLogEntry(
    LogLevel.INFO,
    'Info message for testing basic info logging'
  ),

  /**
   * Info log with user context
   */
  userInfo: {
    ...createBaseLogEntry(LogLevel.INFO, 'User logged in successfully'),
    userId: userContexts.detailedUserContext.userId,
    context: userContexts.detailedUserContext,
    metadata: {
      loginMethod: 'password',
      deviceType: 'mobile',
      ipAddress: '192.168.1.101',
    },
  },

  /**
   * Info log with care journey context
   */
  careJourneyInfo: {
    ...createBaseLogEntry(LogLevel.INFO, 'Appointment booked successfully'),
    journeyType: JourneyType.CARE,
    userId: userContexts.detailedUserContext.userId,
    context: {
      ...journeyContexts.careJourney,
      appointment: {
        appointmentId: 'appt-123456',
        providerId: 'provider-789',
        appointmentType: 'video',
        appointmentTime: '2023-04-20T10:00:00.000Z',
        specialtyId: 'cardiology',
      },
    },
  },

  /**
   * Info log with transaction context
   */
  transactionInfo: {
    ...createBaseLogEntry(LogLevel.INFO, 'Transaction completed successfully'),
    context: transactionContexts.detailedTransaction,
  },

  /**
   * Info log with cross-journey context
   */
  crossJourneyInfo: {
    ...createBaseLogEntry(LogLevel.INFO, 'Cross-journey flow initiated'),
    journeyType: JourneyType.HEALTH,
    context: journeyContexts.crossJourney,
  },
};

/**
 * Warning level log entries for testing warning logging functionality
 */
export const warnLogEntries = {
  /**
   * Basic warning log with minimal information
   */
  basicWarn: createBaseLogEntry(
    LogLevel.WARN,
    'Warning message for testing basic warning logging'
  ),

  /**
   * Warning log with detailed context
   */
  detailedWarn: {
    ...createBaseLogEntry(LogLevel.WARN, 'Resource usage approaching limit'),
    context: {
      resourceType: 'database-connections',
      currentUsage: 85,
      limit: 100,
      service: 'health-service',
    },
    metadata: {
      alertThreshold: 80,
      criticalThreshold: 90,
      monitoringSince: '2023-04-15T12:00:00.000Z',
    },
  },

  /**
   * Warning log with plan journey context
   */
  planJourneyWarn: {
    ...createBaseLogEntry(LogLevel.WARN, 'Claim submission missing recommended documentation'),
    journeyType: JourneyType.PLAN,
    userId: userContexts.detailedUserContext.userId,
    context: {
      ...journeyContexts.planJourney,
      claim: {
        claimId: 'claim-123456',
        claimType: 'medical',
        claimAmount: 250.75,
        missingDocuments: ['receipt', 'medical-report'],
        requiredDocuments: ['receipt', 'medical-report', 'prescription'],
        submittedDocuments: ['prescription'],
      },
    },
  },

  /**
   * Warning log with retry information
   */
  retryWarn: {
    ...createBaseLogEntry(LogLevel.WARN, 'Operation retry required'),
    context: {
      operation: 'syncHealthData',
      attempt: 2,
      maxAttempts: 3,
      reason: 'Temporary network issue',
      nextRetryAt: new Date(Date.now() + 5000).toISOString(),
    },
  },

  /**
   * Warning log with deprecated feature usage
   */
  deprecationWarn: {
    ...createBaseLogEntry(LogLevel.WARN, 'Deprecated API endpoint used'),
    requestId: requestContexts.apiGatewayRequest.requestId,
    context: {
      ...requestContexts.apiGatewayRequest,
      deprecation: {
        feature: 'legacy-health-metrics-api',
        deprecatedSince: '2023-01-15',
        sunsetDate: '2023-07-15',
        alternativeEndpoint: '/api/v2/health/metrics',
      },
    },
  },
};

/**
 * Error level log entries for testing error logging functionality
 */
export const errorLogEntries = {
  /**
   * Basic error log with minimal information
   */
  basicError: {
    ...createBaseLogEntry(LogLevel.ERROR, 'Error occurred during operation'),
    error: standardErrors.basicError,
    stack: standardErrors.basicError.stack,
  },

  /**
   * Error log with application exception
   */
  applicationError: {
    ...createBaseLogEntry(LogLevel.ERROR, 'Application error occurred'),
    error: applicationExceptions.technicalError,
    stack: applicationExceptions.technicalError.stack,
    context: {
      component: 'PaymentProcessor',
      operation: 'processTransaction',
      timestamp: new Date().toISOString(),
    },
  },

  /**
   * Error log with validation exception
   */
  validationError: {
    ...createBaseLogEntry(LogLevel.ERROR, 'Validation error occurred'),
    error: validationErrors.complexValidation,
    stack: validationErrors.complexValidation.stack,
    requestId: requestContexts.detailedPostRequest.requestId,
    context: {
      ...requestContexts.detailedPostRequest,
      validation: {
        formId: 'user-registration',
        fields: validationErrors.complexValidation.metadata.fields,
        attemptCount: 3,
      },
    },
  },

  /**
   * Error log with health journey context
   */
  healthJourneyError: {
    ...createBaseLogEntry(LogLevel.ERROR, 'Health journey error occurred'),
    journeyType: JourneyType.HEALTH,
    error: journeyErrors.healthJourneyError,
    stack: journeyErrors.healthJourneyError.stack,
    context: {
      ...journeyContexts.healthJourney,
      device: {
        deviceType: 'FitbitWatch',
        lastSyncTime: new Date(Date.now() - 86400000).toISOString(),
        metrics: ['steps', 'heartRate', 'sleep'],
      },
    },
  },

  /**
   * Error log with nested error chain
   */
  nestedError: {
    ...createBaseLogEntry(LogLevel.ERROR, 'Nested error occurred'),
    error: nestedErrors.threeLevelError,
    stack: nestedErrors.threeLevelError.stack,
    context: {
      errorChain: [
        {
          message: nestedErrors.threeLevelError.message,
          type: nestedErrors.threeLevelError.type,
          code: nestedErrors.threeLevelError.code,
        },
        {
          message: nestedErrors.threeLevelError.cause.message,
          type: nestedErrors.threeLevelError.cause.type,
          code: nestedErrors.threeLevelError.cause.code,
        },
        {
          message: nestedErrors.threeLevelError.cause.cause.message,
          type: 'TypeError',
        },
      ],
    },
  },

  /**
   * Error log with external system error
   */
  externalError: {
    ...createBaseLogEntry(LogLevel.ERROR, 'External system error occurred'),
    error: applicationExceptions.externalError,
    stack: applicationExceptions.externalError.stack,
    context: {
      externalSystem: {
        name: 'PaymentGateway',
        endpoint: '/api/v1/payments',
        statusCode: 503,
        responseBody: {
          error: 'Service Unavailable',
          message: 'The service is temporarily unavailable',
          retryAfter: 30,
        },
        requestId: 'ext-req-12345',
      },
    },
  },
};

/**
 * Fatal level log entries for testing fatal logging functionality
 */
export const fatalLogEntries = {
  /**
   * Basic fatal log with minimal information
   */
  basicFatal: {
    ...createBaseLogEntry(LogLevel.FATAL, 'Fatal error occurred'),
    error: new Error('Unrecoverable system error'),
    stack: new Error('Unrecoverable system error').stack,
  },

  /**
   * Fatal log with detailed system information
   */
  detailedFatal: {
    ...createBaseLogEntry(LogLevel.FATAL, 'Critical system failure'),
    error: new Error('Database connection pool exhausted'),
    stack: new Error('Database connection pool exhausted').stack,
    context: {
      system: {
        component: 'DatabaseConnectionPool',
        maxConnections: 100,
        activeConnections: 100,
        waitingConnections: 50,
        uptime: 86400, // seconds
        lastRestartAt: new Date(Date.now() - 86400000).toISOString(),
      },
      resource: {
        cpuUsage: 95, // percent
        memoryUsage: 90, // percent
        diskUsage: 85, // percent
      },
    },
  },

  /**
   * Fatal log with care journey context
   */
  careJourneyFatal: {
    ...createBaseLogEntry(LogLevel.FATAL, 'Care journey critical failure'),
    journeyType: JourneyType.CARE,
    error: journeyErrors.careJourneyError,
    stack: journeyErrors.careJourneyError.stack,
    context: {
      ...journeyContexts.careJourney,
      criticalOperation: {
        name: 'EmergencyAppointmentBooking',
        priority: 'critical',
        affectedUsers: 150,
        startedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        failedAt: new Date().toISOString(),
      },
    },
  },

  /**
   * Fatal log with security breach information
   */
  securityFatal: {
    ...createBaseLogEntry(LogLevel.FATAL, 'Security breach detected'),
    error: new Error('Unauthorized access to protected resources'),
    stack: new Error('Unauthorized access to protected resources').stack,
    context: {
      security: {
        breachType: 'unauthorized-access',
        targetResource: 'patient-records',
        sourceIp: '203.0.113.100',
        detectedAt: new Date().toISOString(),
        suspiciousActivity: [
          'multiple-failed-logins',
          'unusual-access-pattern',
          'data-exfiltration-attempt',
        ],
      },
    },
    metadata: {
      alertId: 'SEC-12345',
      alertSeverity: 'critical',
      mitigationApplied: 'ip-blocking',
      reportedToAuthorities: true,
    },
  },

  /**
   * Fatal log with infrastructure failure
   */
  infrastructureFatal: {
    ...createBaseLogEntry(LogLevel.FATAL, 'Infrastructure failure'),
    error: new Error('Kubernetes node failure'),
    stack: new Error('Kubernetes node failure').stack,
    context: {
      infrastructure: {
        component: 'kubernetes-node',
        nodeId: 'node-123456',
        region: 'us-east-1',
        zone: 'us-east-1a',
        affectedPods: 25,
        affectedServices: [
          'health-service',
          'care-service',
          'notification-service',
        ],
      },
    },
  },
};

/**
 * Special test cases for log formatting edge cases
 */
export const specialLogEntries = {
  /**
   * Log entry with circular references
   */
  circularReferenceLog: (() => {
    const entry = createBaseLogEntry(
      LogLevel.INFO,
      'Log with circular reference'
    );
    const circular: any = {
      name: 'circular-object',
      value: 42,
    };
    circular.self = circular;
    entry.context = { circular };
    return entry;
  })(),

  /**
   * Log entry with deeply nested objects
   */
  deeplyNestedLog: {
    ...createBaseLogEntry(LogLevel.INFO, 'Log with deeply nested objects'),
    context: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deeply-nested-value',
                array: [1, 2, [3, 4, [5, 6, [7, 8]]]],
              },
            },
          },
        },
      },
    },
  },

  /**
   * Log entry with very large payload
   */
  largePayloadLog: {
    ...createBaseLogEntry(LogLevel.INFO, 'Log with large payload'),
    context: {
      largeString: 'A'.repeat(10000),
      largeArray: Array.from({ length: 1000 }, (_, i) => i),
      largeObject: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
      ),
    },
  },

  /**
   * Log entry with special characters and non-ASCII text
   */
  specialCharactersLog: {
    ...createBaseLogEntry(LogLevel.INFO, 'Log with special characters'),
    context: {
      specialChars: '!@#$%^&*()_+{}|:<>?~`-=[]\\;\\\',./',
      emoji: '😀🚀🔥💯',
      nonAscii: 'áéíóúñÁÉÍÓÚÑ',
      html: '<script>alert("test");</script>',
      json: '{"key": "value"}',
    },
  },

  /**
   * Log entry with binary data
   */
  binaryDataLog: {
    ...createBaseLogEntry(LogLevel.INFO, 'Log with binary data'),
    context: {
      base64Data: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
      hexData: '48656C6C6F20576F726C64', // "Hello World" in hex
      binaryString: '\x48\x65\x6C\x6C\x6F\x20\x57\x6F\x72\x6C\x64', // "Hello World" in escaped hex
    },
  },
};

/**
 * Combined log entries for comprehensive testing
 */
export const combinedLogEntries = {
  /**
   * Complete log entry with all context types
   */
  completeLog: {
    ...createBaseLogEntry(LogLevel.INFO, 'Complete log entry with all contexts'),
    userId: userContexts.detailedUserContext.userId,
    requestId: requestContexts.detailedPostRequest.requestId,
    journeyType: JourneyType.HEALTH,
    context: {
      ...combinedContexts.completeContext,
      additionalInfo: {
        feature: 'health-dashboard',
        action: 'view-metrics',
        result: 'success',
      },
    },
  },

  /**
   * Error log with complete context
   */
  completeErrorLog: {
    ...createBaseLogEntry(LogLevel.ERROR, 'Complete error log with all contexts'),
    userId: userContexts.detailedUserContext.userId,
    requestId: requestContexts.detailedPostRequest.requestId,
    journeyType: JourneyType.HEALTH,
    error: journeyErrors.healthJourneyError,
    stack: journeyErrors.healthJourneyError.stack,
    context: {
      ...combinedContexts.completeContext,
      error: {
        code: journeyErrors.healthJourneyError.code,
        type: journeyErrors.healthJourneyError.type,
        metadata: journeyErrors.healthJourneyError.metadata,
      },
    },
  },
};

/**
 * Export all log entries as a single collection
 */
export const allLogEntries = {
  ...debugLogEntries,
  ...infoLogEntries,
  ...warnLogEntries,
  ...errorLogEntries,
  ...fatalLogEntries,
  ...specialLogEntries,
  ...combinedLogEntries,
};