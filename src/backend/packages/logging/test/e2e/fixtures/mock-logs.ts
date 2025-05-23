import { LogEntry, LogLevel, JourneyType } from '../../../src/interfaces/log-entry.interface';

/**
 * Mock log entries for e2e testing of the logging package.
 * Provides standardized log entries with different log levels and various context parameters.
 */

/**
 * Creates a timestamp for testing that is consistent and predictable.
 * @param minutesAgo Number of minutes to subtract from the base time
 * @returns Date object with a consistent test timestamp
 */
const createTestTimestamp = (minutesAgo = 0): Date => {
  // Use a fixed date for consistent testing
  const baseTime = new Date('2023-05-15T10:00:00.000Z');
  baseTime.setMinutes(baseTime.getMinutes() - minutesAgo);
  return baseTime;
};

/**
 * Basic debug log entry with minimal context
 */
export const DEBUG_LOG: LogEntry = {
  message: 'Debug message for detailed troubleshooting',
  level: LogLevel.DEBUG,
  timestamp: createTestTimestamp(),
  serviceName: 'health-service',
  context: 'HealthMetricsController',
  contextData: {
    operation: 'fetchMetrics',
    parameters: { userId: '12345', metricType: 'heart-rate' }
  },
  requestId: 'req-debug-123456',
  traceId: 'trace-debug-abcdef',
  spanId: 'span-debug-123456',
  journey: {
    type: JourneyType.HEALTH,
    resourceId: 'health-metric-789',
    action: 'fetch',
    data: { metricType: 'heart-rate' }
  },
  metadata: {
    debugInfo: 'Additional debug information',
    environment: 'development'
  }
};

/**
 * Standard info log entry with user context
 */
export const INFO_LOG: LogEntry = {
  message: 'User profile updated successfully',
  level: LogLevel.INFO,
  timestamp: createTestTimestamp(5),
  serviceName: 'auth-service',
  context: 'UserProfileService',
  contextData: {
    operation: 'updateProfile',
    changes: ['email', 'preferences']
  },
  requestId: 'req-info-789012',
  userId: 'user-456789',
  sessionId: 'session-info-123456',
  clientIp: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  traceId: 'trace-info-defghi',
  spanId: 'span-info-789012',
  journey: {
    type: JourneyType.HEALTH,
    action: 'update-profile'
  }
};

/**
 * Warning log entry with plan journey context
 */
export const WARN_LOG: LogEntry = {
  message: 'Claim processing delayed due to missing documentation',
  level: LogLevel.WARN,
  timestamp: createTestTimestamp(15),
  serviceName: 'plan-service',
  context: 'ClaimsProcessor',
  contextData: {
    operation: 'processClaim',
    claimId: 'claim-123456',
    missingDocuments: ['receipt', 'medical-report']
  },
  requestId: 'req-warn-345678',
  userId: 'user-789012',
  traceId: 'trace-warn-ghijkl',
  spanId: 'span-warn-345678',
  journey: {
    type: JourneyType.PLAN,
    resourceId: 'claim-123456',
    action: 'process-claim',
    data: {
      claimType: 'medical',
      claimAmount: 1250.75,
      submissionDate: '2023-05-10T14:30:00.000Z'
    }
  },
  metadata: {
    retryCount: 2,
    nextRetryAt: '2023-05-15T10:30:00.000Z'
  }
};

/**
 * Error log entry with care journey context and error object
 */
export const ERROR_LOG: LogEntry = {
  message: 'Failed to schedule appointment with provider',
  level: LogLevel.ERROR,
  timestamp: createTestTimestamp(30),
  serviceName: 'care-service',
  context: 'AppointmentController',
  contextData: {
    operation: 'scheduleAppointment',
    providerId: 'provider-456789',
    appointmentTime: '2023-05-20T15:00:00.000Z'
  },
  requestId: 'req-error-901234',
  userId: 'user-123456',
  sessionId: 'session-error-789012',
  clientIp: '192.168.1.101',
  traceId: 'trace-error-klmnop',
  spanId: 'span-error-901234',
  parentSpanId: 'span-parent-567890',
  journey: {
    type: JourneyType.CARE,
    resourceId: 'appointment-456789',
    action: 'schedule',
    data: {
      providerId: 'provider-456789',
      specialtyId: 'cardiology',
      appointmentType: 'video-consultation'
    }
  },
  error: {
    message: 'Provider calendar unavailable',
    name: 'ProviderUnavailableError',
    code: 'PROVIDER_UNAVAILABLE',
    stack: `ProviderUnavailableError: Provider calendar unavailable
    at ProviderService.checkAvailability (/src/services/provider.service.ts:125:23)
    at AppointmentService.scheduleAppointment (/src/services/appointment.service.ts:67:45)
    at AppointmentController.createAppointment (/src/controllers/appointment.controller.ts:42:19)
    at processRequest (/src/middleware/request-handler.ts:28:11)`,
    isTransient: true,
    isClientError: false,
    isExternalError: true
  },
  metadata: {
    failedAttempts: 3,
    suggestedAction: 'retry-with-different-time'
  }
};

/**
 * Fatal log entry with system-level error
 */
export const FATAL_LOG: LogEntry = {
  message: 'Database connection failed - system unable to process requests',
  level: LogLevel.FATAL,
  timestamp: createTestTimestamp(45),
  serviceName: 'api-gateway',
  context: 'DatabaseConnectionManager',
  contextData: {
    operation: 'establishConnection',
    databaseHost: 'primary-db-cluster.austa.internal',
    connectionPool: 'main'
  },
  requestId: 'req-fatal-567890',
  traceId: 'trace-fatal-qrstuv',
  spanId: 'span-fatal-567890',
  error: {
    message: 'Connection timeout after 30000ms',
    name: 'ConnectionTimeoutError',
    code: 'ETIMEDOUT',
    stack: `ConnectionTimeoutError: Connection timeout after 30000ms
    at ConnectionPool.acquire (/src/database/connection-pool.ts:87:11)
    at DatabaseService.connect (/src/database/database.service.ts:42:35)
    at ApiGatewayService.handleRequest (/src/services/api-gateway.service.ts:28:22)
    at processRequest (/src/middleware/request-handler.ts:15:7)`,
    isTransient: true,
    isClientError: false,
    isExternalError: false
  },
  metadata: {
    systemStatus: 'degraded',
    affectedServices: ['all'],
    failoverInitiated: true,
    alertSent: true,
    incidentId: 'incident-123456'
  }
};

/**
 * Log entry with gamification context
 */
export const GAMIFICATION_LOG: LogEntry = {
  message: 'Achievement unlocked for user',
  level: LogLevel.INFO,
  timestamp: createTestTimestamp(10),
  serviceName: 'gamification-engine',
  context: 'AchievementProcessor',
  contextData: {
    operation: 'processAchievement',
    achievementId: 'achievement-123456',
    achievementName: 'Health Enthusiast',
    pointsAwarded: 500
  },
  requestId: 'req-gamification-123456',
  userId: 'user-234567',
  traceId: 'trace-gamification-wxyz12',
  spanId: 'span-gamification-123456',
  journey: {
    type: JourneyType.HEALTH,
    resourceId: 'achievement-123456',
    action: 'unlock-achievement',
    data: {
      achievementType: 'streak',
      streakDays: 7,
      category: 'exercise'
    }
  },
  metadata: {
    totalUserPoints: 2500,
    userLevel: 5,
    nextLevelAt: 3000
  }
};

/**
 * Log entry with notification context
 */
export const NOTIFICATION_LOG: LogEntry = {
  message: 'Push notification sent to user',
  level: LogLevel.INFO,
  timestamp: createTestTimestamp(20),
  serviceName: 'notification-service',
  context: 'PushNotificationSender',
  contextData: {
    operation: 'sendPushNotification',
    notificationId: 'notification-123456',
    notificationType: 'appointment-reminder',
    deviceToken: 'device-token-123456'
  },
  requestId: 'req-notification-123456',
  userId: 'user-345678',
  traceId: 'trace-notification-345678',
  spanId: 'span-notification-123456',
  journey: {
    type: JourneyType.CARE,
    resourceId: 'appointment-789012',
    action: 'send-reminder',
    data: {
      appointmentTime: '2023-05-16T14:00:00.000Z',
      providerName: 'Dr. Maria Silva',
      appointmentType: 'in-person'
    }
  },
  metadata: {
    deliveryStatus: 'sent',
    notificationChannel: 'push',
    priority: 'high'
  }
};

/**
 * Collection of all mock logs for easy import
 */
export const ALL_MOCK_LOGS: LogEntry[] = [
  DEBUG_LOG,
  INFO_LOG,
  WARN_LOG,
  ERROR_LOG,
  FATAL_LOG,
  GAMIFICATION_LOG,
  NOTIFICATION_LOG
];

/**
 * Mock logs grouped by log level for testing level-specific filtering
 */
export const MOCK_LOGS_BY_LEVEL: Record<string, LogEntry[]> = {
  debug: [DEBUG_LOG],
  info: [INFO_LOG, GAMIFICATION_LOG, NOTIFICATION_LOG],
  warn: [WARN_LOG],
  error: [ERROR_LOG],
  fatal: [FATAL_LOG]
};

/**
 * Mock logs grouped by journey type for testing journey-specific filtering
 */
export const MOCK_LOGS_BY_JOURNEY: Record<string, LogEntry[]> = {
  health: [DEBUG_LOG, INFO_LOG, GAMIFICATION_LOG],
  care: [ERROR_LOG, NOTIFICATION_LOG],
  plan: [WARN_LOG]
};

/**
 * Mock logs with errors for testing error handling and formatting
 */
export const ERROR_LOGS: LogEntry[] = [ERROR_LOG, FATAL_LOG];

/**
 * Creates a custom log entry with specified properties
 * @param overrides Properties to override in the base log entry
 * @returns Custom log entry with specified overrides
 */
export const createCustomLogEntry = (overrides: Partial<LogEntry>): LogEntry => {
  const baseLog: LogEntry = {
    message: 'Custom log message',
    level: LogLevel.INFO,
    timestamp: createTestTimestamp(),
    serviceName: 'custom-service',
    context: 'CustomContext',
    requestId: 'req-custom-123456',
    traceId: 'trace-custom-123456',
    spanId: 'span-custom-123456'
  };

  return { ...baseLog, ...overrides };
};