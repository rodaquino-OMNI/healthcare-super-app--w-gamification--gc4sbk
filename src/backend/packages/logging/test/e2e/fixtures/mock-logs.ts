/**
 * Mock log entries for e2e testing of the logging package.
 * Provides standardized log entries with different log levels and various context parameters.
 */

// Standard timestamp for consistent testing
const TEST_TIMESTAMP = '2023-04-15T14:30:00.000Z';

// Mock error with stack trace for error log testing
const mockError = new Error('Test error message');
mockError.stack = `Error: Test error message
    at Object.<anonymous> (/src/backend/packages/logging/test/e2e/fixtures/mock-logs.ts:10:20)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
    at Module.load (internal/modules/cjs/loader.js:950:32)
    at Function.Module._load (internal/modules/cjs/loader.js:790:12)`;

/**
 * Base log entry interface with common fields
 */
export interface MockLogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  correlationId: string;
  service: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    type?: string;
  };
  journey?: 'health' | 'care' | 'plan' | null;
  user?: {
    id: string;
    role?: string;
  };
  request?: {
    id: string;
    method: string;
    path: string;
    ip?: string;
    userAgent?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Debug level log entry with minimal context
 */
export const debugLogEntry: MockLogEntry = {
  timestamp: TEST_TIMESTAMP,
  level: 'DEBUG',
  message: 'Processing user preferences',
  correlationId: 'corr-1234-5678-90ab-cdef',
  service: 'user-service',
  context: {
    preferences: { notifications: true, language: 'pt-BR' },
    processingTime: 5,
  },
  journey: null,
};

/**
 * Info level log entry with health journey context
 */
export const infoLogEntry: MockLogEntry = {
  timestamp: TEST_TIMESTAMP,
  level: 'INFO',
  message: 'Health metric recorded successfully',
  correlationId: 'corr-2345-6789-01cd-efgh',
  service: 'health-service',
  journey: 'health',
  user: {
    id: 'user-1234',
    role: 'patient',
  },
  context: {
    metricType: 'blood_pressure',
    value: { systolic: 120, diastolic: 80 },
    source: 'manual_entry',
  },
  request: {
    id: 'req-abcd-1234',
    method: 'POST',
    path: '/api/health/metrics',
    ip: '192.168.1.1',
    userAgent: 'AUSTA-App/1.0.0 (iPhone; iOS 15.0)',
  },
  metadata: {
    processingTimeMs: 45,
    cacheMiss: true,
  },
};

/**
 * Warning level log entry with care journey context
 */
export const warnLogEntry: MockLogEntry = {
  timestamp: TEST_TIMESTAMP,
  level: 'WARN',
  message: 'Appointment rescheduling attempted with short notice',
  correlationId: 'corr-3456-7890-12ef-ghij',
  service: 'care-service',
  journey: 'care',
  user: {
    id: 'user-5678',
    role: 'patient',
  },
  context: {
    appointmentId: 'appt-9876',
    originalTime: '2023-04-16T10:00:00Z',
    requestedTime: '2023-04-16T15:30:00Z',
    noticeHours: 22,
    minimumRequired: 24,
  },
  request: {
    id: 'req-efgh-5678',
    method: 'PUT',
    path: '/api/care/appointments/appt-9876',
  },
  metadata: {
    policyReference: 'appointment-reschedule-policy-v2',
  },
};

/**
 * Error level log entry with plan journey context and error details
 */
export const errorLogEntry: MockLogEntry = {
  timestamp: TEST_TIMESTAMP,
  level: 'ERROR',
  message: 'Failed to process insurance claim',
  correlationId: 'corr-4567-8901-23gh-ijkl',
  service: 'plan-service',
  journey: 'plan',
  user: {
    id: 'user-9012',
    role: 'patient',
  },
  error: {
    message: 'Invalid claim document format',
    stack: mockError.stack,
    code: 'INVALID_DOCUMENT_FORMAT',
    type: 'ValidationError',
  },
  context: {
    claimId: 'claim-1234',
    documentId: 'doc-5678',
    validationErrors: [
      { field: 'receiptDate', error: 'Invalid date format' },
      { field: 'amount', error: 'Amount exceeds maximum allowed' },
    ],
    attemptCount: 2,
  },
  request: {
    id: 'req-ijkl-9012',
    method: 'POST',
    path: '/api/plan/claims',
    ip: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  metadata: {
    processingTimeMs: 234,
  },
};

/**
 * Fatal level log entry with system-wide impact and detailed error
 */
export const fatalLogEntry: MockLogEntry = {
  timestamp: TEST_TIMESTAMP,
  level: 'FATAL',
  message: 'Database connection pool exhausted',
  correlationId: 'corr-5678-9012-34ij-klmn',
  service: 'database-service',
  error: {
    message: 'Connection limit reached',
    stack: mockError.stack,
    code: 'CONNECTION_LIMIT_ERROR',
    type: 'SystemError',
  },
  context: {
    poolSize: 100,
    activeConnections: 100,
    waitingConnections: 25,
    timeout: 30000,
    databaseHost: 'primary-db-cluster.internal',
  },
  metadata: {
    alertSent: true,
    impactedServices: ['health-service', 'care-service', 'plan-service'],
    incidentId: 'INC-2023-04-15-001',
  },
};

/**
 * Collection of all mock log entries for batch testing
 */
export const allLogEntries: MockLogEntry[] = [
  debugLogEntry,
  infoLogEntry,
  warnLogEntry,
  errorLogEntry,
  fatalLogEntry,
];

/**
 * Generates a custom log entry with specified properties
 */
export function createCustomLogEntry(overrides: Partial<MockLogEntry>): MockLogEntry {
  return {
    timestamp: TEST_TIMESTAMP,
    level: 'INFO',
    message: 'Custom log message',
    correlationId: 'corr-custom-id',
    service: 'test-service',
    ...overrides,
  };
}

/**
 * Creates a batch of log entries with sequential correlation IDs
 */
export function createLogBatch(count: number, baseLevel: MockLogEntry['level'] = 'INFO'): MockLogEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    timestamp: TEST_TIMESTAMP,
    level: baseLevel,
    message: `Batch log message ${index + 1}`,
    correlationId: `corr-batch-${index.toString().padStart(4, '0')}`,
    service: 'batch-service',
    context: { batchId: 'batch-test', itemIndex: index },
  }));
}

/**
 * Creates a sequence of related logs with the same correlation ID
 * to test tracing of a request through multiple services
 */
export function createTraceableLogSequence(): MockLogEntry[] {
  const correlationId = 'corr-trace-abcd-1234';
  const requestId = 'req-trace-5678';
  const userId = 'user-trace-9012';
  
  return [
    {
      timestamp: '2023-04-15T14:30:00.000Z',
      level: 'INFO',
      message: 'API request received',
      correlationId,
      service: 'api-gateway',
      request: {
        id: requestId,
        method: 'POST',
        path: '/api/health/sync-device',
      },
      user: { id: userId },
    },
    {
      timestamp: '2023-04-15T14:30:00.050Z',
      level: 'DEBUG',
      message: 'Request authenticated',
      correlationId,
      service: 'auth-service',
      request: { id: requestId },
      user: { id: userId },
    },
    {
      timestamp: '2023-04-15T14:30:00.150Z',
      level: 'INFO',
      message: 'Processing device sync request',
      correlationId,
      service: 'health-service',
      journey: 'health',
      request: { id: requestId },
      user: { id: userId },
      context: { deviceId: 'device-5678', syncType: 'full' },
    },
    {
      timestamp: '2023-04-15T14:30:00.350Z',
      level: 'INFO',
      message: 'Device data synchronized',
      correlationId,
      service: 'health-service',
      journey: 'health',
      request: { id: requestId },
      user: { id: userId },
      context: { deviceId: 'device-5678', metricsCount: 24, newMetrics: 5 },
    },
    {
      timestamp: '2023-04-15T14:30:00.400Z',
      level: 'INFO',
      message: 'Sending achievement event',
      correlationId,
      service: 'health-service',
      journey: 'health',
      request: { id: requestId },
      user: { id: userId },
      context: { eventType: 'device_sync_completed', deviceId: 'device-5678' },
    },
    {
      timestamp: '2023-04-15T14:30:00.500Z',
      level: 'INFO',
      message: 'Processing achievement event',
      correlationId,
      service: 'gamification-engine',
      request: { id: requestId },
      user: { id: userId },
      context: { eventType: 'device_sync_completed', achievementId: 'achievement-regular-sync' },
    },
    {
      timestamp: '2023-04-15T14:30:00.600Z',
      level: 'INFO',
      message: 'Achievement unlocked',
      correlationId,
      service: 'gamification-engine',
      request: { id: requestId },
      user: { id: userId },
      context: { achievementId: 'achievement-regular-sync', points: 50 },
    },
    {
      timestamp: '2023-04-15T14:30:00.650Z',
      level: 'INFO',
      message: 'Sending notification',
      correlationId,
      service: 'notification-service',
      request: { id: requestId },
      user: { id: userId },
      context: { notificationType: 'achievement', achievementId: 'achievement-regular-sync' },
    },
    {
      timestamp: '2023-04-15T14:30:00.750Z',
      level: 'INFO',
      message: 'API response sent',
      correlationId,
      service: 'api-gateway',
      request: { id: requestId },
      user: { id: userId },
      context: { statusCode: 200, responseTimeMs: 750 },
    },
  ];
}