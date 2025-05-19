import { LogEntry, LogLevel, JourneyType, ErrorObject, JourneyContext } from '../../src/interfaces/log-entry.interface';

/**
 * Standard error object for testing error logging
 */
export const standardErrorObject: ErrorObject = {
  name: 'TestError',
  message: 'This is a test error',
  stack: 'Error: This is a test error\n    at TestFunction (/src/test/example.ts:123:45)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)',
  code: 'TEST_ERROR',
  statusCode: 500,
  isOperational: true,
  details: {
    additionalInfo: 'Some additional error context',
    component: 'TestComponent',
  },
};

/**
 * Nested error object for testing error cause chains
 */
export const nestedErrorObject: ErrorObject = {
  name: 'ParentError',
  message: 'Parent error that wraps a child error',
  stack: 'Error: Parent error that wraps a child error\n    at WrapperFunction (/src/test/example.ts:234:56)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)',
  code: 'PARENT_ERROR',
  statusCode: 500,
  isOperational: true,
  details: {
    operation: 'database.query',
    sql: 'SELECT * FROM users WHERE id = ?',
  },
  cause: {
    name: 'ChildError',
    message: 'Database connection failed',
    stack: 'Error: Database connection failed\n    at ConnectFunction (/src/database/connection.ts:45:12)\n    at WrapperFunction (/src/test/example.ts:234:30)',
    code: 'CONNECTION_ERROR',
    isOperational: false,
    details: {
      host: 'database.example.com',
      port: 5432,
    },
  },
};

/**
 * Standard journey contexts for each journey type
 */
export const journeyContexts: Record<JourneyType, JourneyContext> = {
  [JourneyType.HEALTH]: {
    journeyId: 'health-journey-123',
    step: 'record-metrics',
    health: {
      metricType: 'blood-pressure',
      deviceId: 'device-456',
      goalId: 'goal-789',
    },
  },
  [JourneyType.CARE]: {
    journeyId: 'care-journey-456',
    step: 'schedule-appointment',
    care: {
      appointmentId: 'appointment-123',
      providerId: 'provider-456',
      sessionId: 'telemedicine-789',
      medicationId: 'medication-012',
    },
  },
  [JourneyType.PLAN]: {
    journeyId: 'plan-journey-789',
    step: 'submit-claim',
    plan: {
      planId: 'plan-123',
      claimId: 'claim-456',
      benefitId: 'benefit-789',
    },
  },
  [JourneyType.CROSS_JOURNEY]: {
    journeyId: 'cross-journey-012',
    step: 'achievement-unlocked',
  },
};

/**
 * Base log entry for extending with specific test cases
 */
const baseLogEntry: Partial<LogEntry> = {
  timestamp: new Date('2023-06-15T12:00:00Z'),
  service: 'test-service',
  requestId: 'req-123456789',
  userId: 'user-987654321',
  traceId: 'trace-abcdef123456',
  spanId: 'span-123456abcdef',
  parentSpanId: 'span-parent987654',
};

/**
 * Creates a standard log entry with the specified level and journey type
 * @param level The log level
 * @param journey The journey type
 * @returns A complete log entry for testing
 */
const createStandardLogEntry = (
  level: LogLevel,
  journey?: JourneyType,
): LogEntry => {
  const entry: LogEntry = {
    ...baseLogEntry,
    message: `Standard ${LogLevel[level].toLowerCase()} message for testing`,
    level,
  } as LogEntry;

  if (journey) {
    entry.journey = journey;
    entry.journeyContext = journeyContexts[journey];
  }

  return entry;
};

/**
 * Debug level log entries for testing
 */
export const debugLogEntries: LogEntry[] = [
  createStandardLogEntry(LogLevel.DEBUG),
  {
    ...createStandardLogEntry(LogLevel.DEBUG, JourneyType.HEALTH),
    message: 'Debug log with health journey context',
    context: {
      debugInfo: 'Additional debug information',
      component: 'HealthMetricsComponent',
      duration: 123.45,
    },
  },
  {
    ...createStandardLogEntry(LogLevel.DEBUG, JourneyType.CARE),
    message: 'Debug log with care journey context',
    context: {
      debugInfo: 'Care journey debug details',
      component: 'AppointmentScheduler',
      params: { date: '2023-06-20', providerId: 'provider-456' },
    },
  },
  {
    ...createStandardLogEntry(LogLevel.DEBUG, JourneyType.PLAN),
    message: 'Debug log with plan journey context',
    context: {
      debugInfo: 'Plan journey debug details',
      component: 'ClaimSubmissionForm',
      formData: { claimType: 'medical', amount: 250.00 },
    },
  },
];

/**
 * Info level log entries for testing
 */
export const infoLogEntries: LogEntry[] = [
  createStandardLogEntry(LogLevel.INFO),
  {
    ...createStandardLogEntry(LogLevel.INFO, JourneyType.HEALTH),
    message: 'Health metric recorded successfully',
    context: {
      metricType: 'heart-rate',
      value: 72,
      unit: 'bpm',
      source: 'manual-entry',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.INFO, JourneyType.CARE),
    message: 'Appointment scheduled successfully',
    context: {
      appointmentType: 'check-up',
      scheduledTime: '2023-06-20T14:30:00Z',
      provider: 'Dr. Smith',
      location: 'Main Clinic',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.INFO, JourneyType.PLAN),
    message: 'Claim submitted successfully',
    context: {
      claimType: 'prescription',
      amount: 75.50,
      submissionDate: '2023-06-15T12:30:45Z',
      status: 'pending-review',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.INFO, JourneyType.CROSS_JOURNEY),
    message: 'User completed onboarding',
    context: {
      completedSteps: ['profile', 'preferences', 'initial-assessment'],
      duration: 345.67,
      deviceType: 'mobile-ios',
    },
  },
];

/**
 * Warning level log entries for testing
 */
export const warnLogEntries: LogEntry[] = [
  createStandardLogEntry(LogLevel.WARN),
  {
    ...createStandardLogEntry(LogLevel.WARN, JourneyType.HEALTH),
    message: 'Unusual health metric detected',
    context: {
      metricType: 'blood-pressure',
      value: '160/100',
      threshold: '140/90',
      action: 'user-notified',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.WARN, JourneyType.CARE),
    message: 'Appointment rescheduled multiple times',
    context: {
      appointmentId: 'appointment-123',
      rescheduleCount: 3,
      originalDate: '2023-06-10T10:00:00Z',
      currentDate: '2023-06-20T14:30:00Z',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.WARN, JourneyType.PLAN),
    message: 'Claim processing delayed',
    context: {
      claimId: 'claim-456',
      submissionDate: '2023-05-15T09:45:30Z',
      expectedProcessingTime: '5 days',
      actualProcessingTime: '15 days',
      reason: 'additional-documentation-required',
    },
  },
];

/**
 * Error level log entries for testing
 */
export const errorLogEntries: LogEntry[] = [
  createStandardLogEntry(LogLevel.ERROR),
  {
    ...createStandardLogEntry(LogLevel.ERROR, JourneyType.HEALTH),
    message: 'Failed to sync health data with device',
    error: {
      name: 'DeviceSyncError',
      message: 'Connection to device timed out',
      code: 'DEVICE_TIMEOUT',
      statusCode: 408,
      isOperational: true,
      details: {
        deviceId: 'device-456',
        deviceType: 'smartwatch',
        attemptCount: 3,
      },
    },
    context: {
      syncOperation: 'pull-metrics',
      lastSuccessfulSync: '2023-06-10T08:15:22Z',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.ERROR, JourneyType.CARE),
    message: 'Telemedicine session failed to initialize',
    error: {
      name: 'SessionInitializationError',
      message: 'Failed to establish WebRTC connection',
      code: 'WEBRTC_FAILURE',
      statusCode: 500,
      isOperational: true,
      details: {
        sessionId: 'telemedicine-789',
        iceServers: ['stun:stun.example.com', 'turn:turn.example.com'],
        browserInfo: 'Chrome 92.0.4515.131',
      },
    },
    context: {
      appointmentId: 'appointment-123',
      providerId: 'provider-456',
      clientIp: '192.168.1.1',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.ERROR, JourneyType.PLAN),
    message: 'Failed to submit claim to insurance provider',
    error: nestedErrorObject,
    context: {
      claimId: 'claim-456',
      insuranceProvider: 'ExampleHealth',
      apiEndpoint: 'https://api.examplehealth.com/claims',
      retryCount: 3,
    },
  },
];

/**
 * Fatal level log entries for testing
 */
export const fatalLogEntries: LogEntry[] = [
  createStandardLogEntry(LogLevel.FATAL),
  {
    ...createStandardLogEntry(LogLevel.FATAL, JourneyType.CROSS_JOURNEY),
    message: 'Database connection pool exhausted',
    error: {
      name: 'ConnectionPoolError',
      message: 'Failed to acquire connection from pool',
      stack: 'Error: Failed to acquire connection from pool\n    at Pool.acquire (/src/database/pool.ts:67:12)\n    at Repository.findById (/src/repositories/base.repository.ts:45:23)',
      code: 'CONNECTION_POOL_EXHAUSTED',
      statusCode: 503,
      isOperational: false,
      details: {
        poolSize: 20,
        activeConnections: 20,
        waitingRequests: 15,
        timeout: 5000,
      },
    },
    context: {
      service: 'user-service',
      operation: 'getUserProfile',
      affectedJourneys: ['health', 'care', 'plan'],
      impact: 'all-users',
    },
  },
  {
    ...createStandardLogEntry(LogLevel.FATAL, JourneyType.HEALTH),
    message: 'Critical security vulnerability detected',
    error: {
      name: 'SecurityVulnerabilityError',
      message: 'Potential data breach detected',
      code: 'SECURITY_BREACH',
      statusCode: 500,
      isOperational: false,
      details: {
        vulnerabilityType: 'unauthorized-access',
        affectedData: 'health-metrics',
        detectionTime: '2023-06-15T12:30:45Z',
        sourceIp: '203.0.113.42',
      },
    },
    context: {
      securityAlert: true,
      severity: 'critical',
      mitigationStatus: 'in-progress',
    },
  },
];

/**
 * Log entries with special formatting edge cases
 */
export const edgeCaseLogEntries: LogEntry[] = [
  {
    ...createStandardLogEntry(LogLevel.INFO),
    message: 'Log entry with empty context',
    context: {},
  },
  {
    ...createStandardLogEntry(LogLevel.INFO),
    message: 'Log entry with null values',
    context: {
      nullValue: null,
      undefinedValue: undefined,
      emptyString: '',
      zero: 0,
      false: false,
    },
  },
  {
    ...createStandardLogEntry(LogLevel.INFO),
    message: 'Log entry with circular reference',
    context: (() => {
      const circular: any = {
        name: 'circular-object',
        level1: {
          level2: {
            level3: {}
          }
        }
      };
      circular.level1.level2.level3.circular = circular;
      return circular;
    })(),
  },
  {
    ...createStandardLogEntry(LogLevel.ERROR),
    message: 'Log entry with very long message that might cause formatting issues in some log viewers or might be truncated in certain contexts',
    error: {
      name: 'VeryLongErrorNameThatMightCauseFormattingIssuesInSomeLogViewersOrMightBeTruncatedInCertainContexts',
      message: 'This is a very long error message that contains a lot of details and might span multiple lines when formatted or displayed in a log viewer. It contains enough text to test how the formatter handles wrapping, truncation, or other formatting concerns.',
      stack: 'Error: This is a very long error message\n    at VeryLongFunctionNameThatMightCauseFormattingIssues (/src/very/long/path/to/some/file/that/might/cause/formatting/issues/in/some/log/viewers/or/might/be/truncated/in/certain/contexts.ts:1234:5678)\n    at AnotherVeryLongFunctionName (/src/another/very/long/path.ts:8765:4321)',
      code: 'VERY_LONG_ERROR_CODE_THAT_MIGHT_CAUSE_FORMATTING_ISSUES',
      statusCode: 500,
      details: {
        veryLongPropertyName: 'This is a very long property value that might cause formatting issues',
        deeplyNestedObject: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: 'Deeply nested value'
                }
              }
            }
          }
        },
        arrayWithManyItems: Array.from({ length: 100 }, (_, i) => `Item ${i}`),
      },
    },
  },
  {
    ...createStandardLogEntry(LogLevel.INFO),
    message: 'Log entry with special characters: 你好，世界! مرحبا بالعالم! Привет, мир! αβγδε',
    context: {
      specialChars: '你好，世界! مرحبا بالعالم! Привет, мир! αβγδε',
      emoji: '😀🚀🌍🔥💯',
      mixedContent: 'Regular text with 特殊字符 and more regular text',
    },
  },
];

/**
 * Log entries with different environment-specific context
 */
export const environmentSpecificLogEntries: Record<string, LogEntry[]> = {
  development: [
    {
      ...createStandardLogEntry(LogLevel.DEBUG),
      message: 'Development-specific debug information',
      context: {
        devServerUrl: 'http://localhost:3000',
        mockEnabled: true,
        debugFlags: ['verbose-api', 'trace-redux', 'mock-auth'],
        localDbConnection: 'postgres://localhost:5432/austa_dev',
      },
    },
  ],
  staging: [
    {
      ...createStandardLogEntry(LogLevel.INFO),
      message: 'Staging environment health check',
      context: {
        environment: 'staging',
        region: 'us-west-2',
        deploymentId: 'deploy-789-staging',
        healthChecks: {
          database: 'healthy',
          redis: 'healthy',
          kafka: 'degraded',
          s3: 'healthy',
        },
      },
    },
  ],
  production: [
    {
      ...createStandardLogEntry(LogLevel.ERROR),
      message: 'Production error with sensitive information',
      context: {
        environment: 'production',
        region: 'us-east-1',
        availabilityZone: 'us-east-1a',
        instanceId: 'i-1234567890abcdef0',
        sensitiveDataRemoved: true,
      },
      error: {
        name: 'ApiRateLimitExceeded',
        message: 'External API rate limit exceeded',
        code: 'RATE_LIMIT',
        statusCode: 429,
        isOperational: true,
        details: {
          api: 'payment-processor',
          limitPeriod: '1 minute',
          limitValue: 100,
          currentUsage: 120,
          retryAfter: 30,
        },
      },
    },
  ],
};

/**
 * All log entries combined for comprehensive testing
 */
export const allLogEntries: LogEntry[] = [
  ...debugLogEntries,
  ...infoLogEntries,
  ...warnLogEntries,
  ...errorLogEntries,
  ...fatalLogEntries,
  ...edgeCaseLogEntries,
  ...environmentSpecificLogEntries.development,
  ...environmentSpecificLogEntries.staging,
  ...environmentSpecificLogEntries.production,
];