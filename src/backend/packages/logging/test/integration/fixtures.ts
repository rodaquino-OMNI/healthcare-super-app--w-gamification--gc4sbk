/**
 * Test fixtures for integration testing of the logging package.
 * Provides sample log entries, context objects, configuration options, and expected output formats.
 */

import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogEntry } from '../../src/interfaces/log-entry.interface';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { JourneyType } from '../../src/context/context.constants';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';

// ==========================================
// Sample Log Entries
// ==========================================

/**
 * Sample log entries for different log levels and contexts
 */
export const sampleLogEntries: Record<string, LogEntry> = {
  /**
   * Basic log entry with minimal information
   */
  basic: {
    message: 'This is a basic log message',
    level: LogLevel.INFO,
    timestamp: new Date('2023-05-15T10:30:45.123Z'),
    context: {
      service: 'test-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174000',
    },
  },

  /**
   * Debug log entry with detailed context
   */
  debug: {
    message: 'Debug information for troubleshooting',
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-05-15T10:31:22.456Z'),
    context: {
      service: 'test-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174001',
      module: 'UserService',
      function: 'validateUserCredentials',
      additionalInfo: {
        attemptNumber: 1,
        clientIp: '192.168.1.1',
      },
    },
  },

  /**
   * Info log entry with user context
   */
  infoWithUser: {
    message: 'User logged in successfully',
    level: LogLevel.INFO,
    timestamp: new Date('2023-05-15T10:32:15.789Z'),
    context: {
      service: 'auth-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174002',
      userId: 'user-123',
      userEmail: 'user@example.com',
      authMethod: 'password',
    },
  },

  /**
   * Warning log entry with journey context (Health)
   */
  warningWithHealthJourney: {
    message: 'Health metric outside normal range',
    level: LogLevel.WARN,
    timestamp: new Date('2023-05-15T10:33:45.123Z'),
    context: {
      service: 'health-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174003',
      userId: 'user-456',
      journey: JourneyType.HEALTH,
      metricType: 'blood-pressure',
      metricValue: '160/95',
      normalRange: '90-140/60-90',
    },
  },

  /**
   * Warning log entry with journey context (Care)
   */
  warningWithCareJourney: {
    message: 'Appointment rescheduled multiple times',
    level: LogLevel.WARN,
    timestamp: new Date('2023-05-15T10:34:12.456Z'),
    context: {
      service: 'care-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174004',
      userId: 'user-789',
      journey: JourneyType.CARE,
      appointmentId: 'appt-123',
      rescheduleCount: 3,
      originalDate: '2023-05-10T14:00:00Z',
      newDate: '2023-05-17T15:30:00Z',
    },
  },

  /**
   * Warning log entry with journey context (Plan)
   */
  warningWithPlanJourney: {
    message: 'Claim processing delayed',
    level: LogLevel.WARN,
    timestamp: new Date('2023-05-15T10:35:22.789Z'),
    context: {
      service: 'plan-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174005',
      userId: 'user-101',
      journey: JourneyType.PLAN,
      claimId: 'claim-456',
      expectedProcessingTime: '48h',
      actualProcessingTime: '72h',
      reason: 'additional-documentation-required',
    },
  },

  /**
   * Error log entry with error object
   */
  errorWithStack: {
    message: 'Failed to process payment',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-05-15T10:36:33.123Z'),
    context: {
      service: 'payment-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174006',
      userId: 'user-202',
      journey: JourneyType.PLAN,
      paymentId: 'payment-789',
      amount: 150.75,
      currency: 'BRL',
    },
    error: new Error('Payment gateway timeout'),
    stack: `Error: Payment gateway timeout
    at PaymentProcessor.processPayment (/app/src/services/payment/processor.ts:45:23)
    at PaymentController.makePayment (/app/src/controllers/payment.controller.ts:32:41)
    at processRequest (/app/node_modules/express/lib/router/index.js:271:32)
    at next (/app/node_modules/express/lib/router/index.js:232:10)
    at /app/node_modules/express/lib/router/index.js:277:10
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:189:7)`,
  },

  /**
   * Fatal log entry with system error
   */
  fatal: {
    message: 'Database connection lost',
    level: LogLevel.FATAL,
    timestamp: new Date('2023-05-15T10:37:45.456Z'),
    context: {
      service: 'database-service',
      correlationId: '123e4567-e89b-12d3-a456-426614174007',
      databaseHost: 'db-primary-01',
      connectionPool: 'main',
      reconnectAttempts: 5,
    },
    error: new Error('ECONNREFUSED: Connection refused'),
    stack: `Error: ECONNREFUSED: Connection refused
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1191:14)
    at PrismaClient.connect (/app/node_modules/@prisma/client/index.js:121:31)
    at DatabaseService.establishConnection (/app/src/services/database.service.ts:78:22)
    at DatabaseService.reconnect (/app/src/services/database.service.ts:142:18)
    at ConnectionManager.handleDisconnect (/app/src/database/connection-manager.ts:56:27)
    at ConnectionEventEmitter.emit (events.js:315:20)
    at Socket.<anonymous> (/app/src/database/connection-monitor.ts:35:12)
    at Socket.emit (events.js:315:20)`,
  },

  /**
   * Log entry with request context
   */
  requestInfo: {
    message: 'Incoming API request',
    level: LogLevel.INFO,
    timestamp: new Date('2023-05-15T10:38:22.789Z'),
    context: {
      service: 'api-gateway',
      correlationId: '123e4567-e89b-12d3-a456-426614174008',
      requestId: 'req-12345',
      method: 'POST',
      path: '/api/v1/health/metrics',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      ip: '203.0.113.195',
      contentLength: 1256,
      responseTime: 235,
      statusCode: 201,
    },
  },

  /**
   * Log entry with gamification event
   */
  gamificationEvent: {
    message: 'Achievement unlocked',
    level: LogLevel.INFO,
    timestamp: new Date('2023-05-15T10:39:15.123Z'),
    context: {
      service: 'gamification-engine',
      correlationId: '123e4567-e89b-12d3-a456-426614174009',
      userId: 'user-303',
      journey: JourneyType.HEALTH,
      achievementId: 'achievement-123',
      achievementName: 'Consistent Tracker',
      xpAwarded: 50,
      totalXp: 1250,
      level: 5,
      triggeredBy: 'health-metric-logged',
    },
  },
};

// ==========================================
// Mock Context Objects
// ==========================================

/**
 * Sample base logging context
 */
export const baseLoggingContext: LoggingContext = {
  correlationId: '123e4567-e89b-12d3-a456-426614174010',
  timestamp: new Date('2023-05-15T10:40:00.000Z'),
  service: 'test-service',
  environment: 'test',
  version: '1.0.0',
};

/**
 * Sample journey contexts for each journey type
 */
export const journeyContexts: Record<JourneyType, JourneyContext> = {
  [JourneyType.HEALTH]: {
    ...baseLoggingContext,
    journey: JourneyType.HEALTH,
    journeyState: {
      currentSection: 'metrics',
      activeGoalId: 'goal-123',
      lastMetricType: 'weight',
      connectedDevices: ['fitbit-123', 'scale-456'],
    },
  },
  [JourneyType.CARE]: {
    ...baseLoggingContext,
    journey: JourneyType.CARE,
    journeyState: {
      currentSection: 'appointments',
      upcomingAppointmentId: 'appt-789',
      preferredProviderId: 'provider-101',
      medicationRemindersEnabled: true,
    },
  },
  [JourneyType.PLAN]: {
    ...baseLoggingContext,
    journey: JourneyType.PLAN,
    journeyState: {
      currentSection: 'claims',
      activePlanId: 'plan-202',
      pendingClaimIds: ['claim-303', 'claim-404'],
      coverageLevel: 'premium',
    },
  },
};

/**
 * Sample user contexts for different user types
 */
export const userContexts: Record<string, UserContext> = {
  anonymous: {
    ...baseLoggingContext,
    userId: undefined,
    authenticated: false,
  },
  authenticated: {
    ...baseLoggingContext,
    userId: 'user-505',
    authenticated: true,
    roles: ['user'],
    email: 'user@example.com',
    preferences: {
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
  admin: {
    ...baseLoggingContext,
    userId: 'admin-606',
    authenticated: true,
    roles: ['user', 'admin'],
    email: 'admin@austa.health',
    preferences: {
      language: 'en-US',
      notifications: {
        email: true,
        push: true,
        sms: true,
      },
    },
  },
};

/**
 * Sample request contexts for different API requests
 */
export const requestContexts: Record<string, RequestContext> = {
  getRequest: {
    ...baseLoggingContext,
    requestId: 'req-707',
    method: 'GET',
    path: '/api/v1/health/metrics/recent',
    query: { limit: '10', type: 'weight' },
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'x-request-id': 'req-707',
    },
    ip: '203.0.113.100',
    startTime: new Date('2023-05-15T10:41:15.123Z'),
  },
  postRequest: {
    ...baseLoggingContext,
    requestId: 'req-808',
    method: 'POST',
    path: '/api/v1/care/appointments',
    body: {
      providerId: 'provider-909',
      date: '2023-06-01',
      time: '14:30',
      reason: 'Annual checkup',
    },
    headers: {
      'user-agent': 'AUSTA-Mobile-App/1.2.3 (iPhone; iOS 15.4.1)',
      'content-type': 'application/json',
      'x-request-id': 'req-808',
    },
    ip: '203.0.113.101',
    startTime: new Date('2023-05-15T10:42:30.456Z'),
  },
  errorRequest: {
    ...baseLoggingContext,
    requestId: 'req-909',
    method: 'PUT',
    path: '/api/v1/plan/claims/claim-404',
    body: {
      status: 'approved',
      amount: 250.75,
    },
    headers: {
      'user-agent': 'PostmanRuntime/7.28.4',
      'content-type': 'application/json',
      'x-request-id': 'req-909',
    },
    ip: '203.0.113.102',
    startTime: new Date('2023-05-15T10:43:45.789Z'),
    error: new Error('Claim not found'),
    statusCode: 404,
  },
};

// ==========================================
// Sample Configuration Objects
// ==========================================

/**
 * Sample logger configurations for different environments
 */
export const loggerConfigs: Record<string, LoggerConfig> = {
  development: {
    level: LogLevel.DEBUG,
    format: 'text',
    transports: [
      {
        type: 'console',
        level: LogLevel.DEBUG,
      },
    ],
    context: {
      service: 'austa-superapp',
      environment: 'development',
      version: '1.0.0-dev',
    },
  },
  test: {
    level: LogLevel.DEBUG,
    format: 'json',
    transports: [
      {
        type: 'console',
        level: LogLevel.DEBUG,
      },
      {
        type: 'file',
        level: LogLevel.INFO,
        filename: 'logs/test.log',
        maxFiles: 5,
        maxSize: '10m',
      },
    ],
    context: {
      service: 'austa-superapp',
      environment: 'test',
      version: '1.0.0-test',
    },
  },
  staging: {
    level: LogLevel.INFO,
    format: 'json',
    transports: [
      {
        type: 'console',
        level: LogLevel.INFO,
      },
      {
        type: 'file',
        level: LogLevel.INFO,
        filename: 'logs/app.log',
        maxFiles: 10,
        maxSize: '100m',
        compress: true,
      },
      {
        type: 'cloudwatch',
        level: LogLevel.INFO,
        logGroup: '/austa/staging',
        logStream: 'app-logs',
        region: 'us-east-1',
      },
    ],
    context: {
      service: 'austa-superapp',
      environment: 'staging',
      version: '1.0.0-rc.1',
    },
  },
  production: {
    level: LogLevel.INFO,
    format: 'cloudwatch',
    transports: [
      {
        type: 'console',
        level: LogLevel.WARN,
      },
      {
        type: 'cloudwatch',
        level: LogLevel.INFO,
        logGroup: '/austa/production',
        logStream: '{service}-{date}',
        region: 'us-east-1',
        batchSize: 100,
        retentionInDays: 90,
      },
    ],
    context: {
      service: 'austa-superapp',
      environment: 'production',
      version: '1.0.0',
    },
  },
};

// ==========================================
// Expected Output Fixtures
// ==========================================

/**
 * Expected JSON output for sample log entries
 */
export const expectedJsonOutput: Record<string, string> = {
  basic: JSON.stringify({
    message: 'This is a basic log message',
    level: 'INFO',
    timestamp: '2023-05-15T10:30:45.123Z',
    service: 'test-service',
    correlationId: '123e4567-e89b-12d3-a456-426614174000',
  }),
  errorWithStack: JSON.stringify({
    message: 'Failed to process payment',
    level: 'ERROR',
    timestamp: '2023-05-15T10:36:33.123Z',
    service: 'payment-service',
    correlationId: '123e4567-e89b-12d3-a456-426614174006',
    userId: 'user-202',
    journey: 'PLAN',
    paymentId: 'payment-789',
    amount: 150.75,
    currency: 'BRL',
    error: {
      name: 'Error',
      message: 'Payment gateway timeout',
      stack: `Error: Payment gateway timeout
    at PaymentProcessor.processPayment (/app/src/services/payment/processor.ts:45:23)
    at PaymentController.makePayment (/app/src/controllers/payment.controller.ts:32:41)
    at processRequest (/app/node_modules/express/lib/router/index.js:271:32)
    at next (/app/node_modules/express/lib/router/index.js:232:10)
    at /app/node_modules/express/lib/router/index.js:277:10
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:189:7)`,
    },
  }),
  healthJourney: JSON.stringify({
    message: 'Health metric outside normal range',
    level: 'WARN',
    timestamp: '2023-05-15T10:33:45.123Z',
    service: 'health-service',
    correlationId: '123e4567-e89b-12d3-a456-426614174003',
    userId: 'user-456',
    journey: 'HEALTH',
    metricType: 'blood-pressure',
    metricValue: '160/95',
    normalRange: '90-140/60-90',
  }),
};

/**
 * Expected CloudWatch output for sample log entries
 */
export const expectedCloudWatchOutput: Record<string, string> = {
  basic: JSON.stringify({
    message: 'This is a basic log message',
    level: 'INFO',
    timestamp: '2023-05-15T10:30:45.123Z',
    service: 'test-service',
    correlationId: '123e4567-e89b-12d3-a456-426614174000',
    aws: {
      logGroup: '/austa/production',
      logStream: 'test-service-20230515',
      region: 'us-east-1',
    },
  }),
  errorWithStack: JSON.stringify({
    message: 'Failed to process payment',
    level: 'ERROR',
    timestamp: '2023-05-15T10:36:33.123Z',
    service: 'payment-service',
    correlationId: '123e4567-e89b-12d3-a456-426614174006',
    userId: 'user-202',
    journey: 'PLAN',
    paymentId: 'payment-789',
    amount: 150.75,
    currency: 'BRL',
    error: {
      name: 'Error',
      message: 'Payment gateway timeout',
      stack: `Error: Payment gateway timeout
    at PaymentProcessor.processPayment (/app/src/services/payment/processor.ts:45:23)
    at PaymentController.makePayment (/app/src/controllers/payment.controller.ts:32:41)
    at processRequest (/app/node_modules/express/lib/router/index.js:271:32)
    at next (/app/node_modules/express/lib/router/index.js:232:10)
    at /app/node_modules/express/lib/router/index.js:277:10
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:189:7)`,
    },
    aws: {
      logGroup: '/austa/production',
      logStream: 'payment-service-20230515',
      region: 'us-east-1',
    },
  }),
};

// ==========================================
// Error Objects and Stack Traces
// ==========================================

/**
 * Sample error objects for testing error logging
 */
export const sampleErrors: Record<string, Error> = {
  basic: new Error('Basic error message'),
  validation: new Error('Validation failed: Email is required'),
  database: new Error('Database query failed: Table "users" does not exist'),
  network: new Error('Network request failed: ETIMEDOUT'),
  auth: new Error('Authentication failed: Invalid credentials'),
  notFound: new Error('Resource not found: User with ID user-999 does not exist'),
};

/**
 * Creates a custom error with a specific name and message
 * @param name Error name
 * @param message Error message
 * @returns Custom error object
 */
export function createCustomError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * Sample custom errors for testing error logging
 */
export const customErrors: Record<string, Error> = {
  validationError: createCustomError('ValidationError', 'Invalid input data'),
  databaseError: createCustomError('DatabaseError', 'Connection pool exhausted'),
  authError: createCustomError('AuthenticationError', 'Token expired'),
  apiError: createCustomError('ApiError', 'External API returned 500 status'),
  businessError: createCustomError('BusinessError', 'Operation not allowed for current user'),
};

/**
 * Sample stack traces for testing error formatting
 */
export const sampleStackTraces: Record<string, string> = {
  validation: `ValidationError: Invalid input data
    at validateUserInput (/app/src/utils/validation.ts:45:23)
    at UserController.createUser (/app/src/controllers/user.controller.ts:32:41)
    at processRequest (/app/node_modules/express/lib/router/index.js:271:32)
    at next (/app/node_modules/express/lib/router/index.js:232:10)`,
  database: `DatabaseError: Connection pool exhausted
    at PrismaClient.query (/app/node_modules/@prisma/client/index.js:121:31)
    at DatabaseService.executeQuery (/app/src/services/database.service.ts:78:22)
    at UserRepository.findById (/app/src/repositories/user.repository.ts:45:23)
    at UserService.getUserById (/app/src/services/user.service.ts:32:41)
    at UserController.getUser (/app/src/controllers/user.controller.ts:65:45)
    at processRequest (/app/node_modules/express/lib/router/index.js:271:32)`,
  api: `ApiError: External API returned 500 status
    at HttpClient.request (/app/src/utils/http-client.ts:87:23)
    at ExternalApiService.fetchData (/app/src/services/external-api.service.ts:45:23)
    at HealthService.syncExternalData (/app/src/services/health.service.ts:123:45)
    at HealthController.syncData (/app/src/controllers/health.controller.ts:78:41)
    at processRequest (/app/node_modules/express/lib/router/index.js:271:32)`,
};

// ==========================================
// Journey-Specific Test Data
// ==========================================

/**
 * Health journey test data
 */
export const healthJourneyTestData = {
  metrics: [
    { type: 'weight', value: 75.5, unit: 'kg', timestamp: new Date('2023-05-15T08:00:00Z') },
    { type: 'blood-pressure', value: '120/80', unit: 'mmHg', timestamp: new Date('2023-05-15T08:05:00Z') },
    { type: 'heart-rate', value: 72, unit: 'bpm', timestamp: new Date('2023-05-15T08:10:00Z') },
    { type: 'blood-glucose', value: 95, unit: 'mg/dL', timestamp: new Date('2023-05-15T08:15:00Z') },
  ],
  devices: [
    { id: 'device-123', type: 'smartwatch', brand: 'Fitbit', model: 'Versa 3', lastSync: new Date('2023-05-15T08:30:00Z') },
    { id: 'device-456', type: 'scale', brand: 'Withings', model: 'Body+', lastSync: new Date('2023-05-15T08:00:00Z') },
    { id: 'device-789', type: 'blood-pressure-monitor', brand: 'Omron', model: 'M7', lastSync: new Date('2023-05-15T08:05:00Z') },
  ],
  goals: [
    { id: 'goal-123', type: 'weight', target: 70, unit: 'kg', deadline: new Date('2023-06-15T00:00:00Z'), progress: 0.7 },
    { id: 'goal-456', type: 'steps', target: 10000, unit: 'steps/day', deadline: new Date('2023-05-31T00:00:00Z'), progress: 0.85 },
  ],
};

/**
 * Care journey test data
 */
export const careJourneyTestData = {
  appointments: [
    { id: 'appt-123', providerId: 'provider-123', date: new Date('2023-05-20T14:30:00Z'), status: 'confirmed', type: 'checkup' },
    { id: 'appt-456', providerId: 'provider-456', date: new Date('2023-05-25T10:15:00Z'), status: 'pending', type: 'specialist' },
  ],
  medications: [
    { id: 'med-123', name: 'Atorvastatin', dosage: '20mg', frequency: 'daily', time: '20:00', refillDate: new Date('2023-06-01T00:00:00Z') },
    { id: 'med-456', name: 'Metformin', dosage: '500mg', frequency: 'twice-daily', time: '08:00,20:00', refillDate: new Date('2023-06-15T00:00:00Z') },
  ],
  providers: [
    { id: 'provider-123', name: 'Dr. Ana Silva', specialty: 'General Practitioner', rating: 4.8 },
    { id: 'provider-456', name: 'Dr. Carlos Mendes', specialty: 'Cardiologist', rating: 4.9 },
  ],
};

/**
 * Plan journey test data
 */
export const planJourneyTestData = {
  plans: [
    { id: 'plan-123', name: 'AUSTA Premium', type: 'health-insurance', coverage: 'comprehensive', monthlyPremium: 450.00 },
    { id: 'plan-456', name: 'AUSTA Dental', type: 'dental-insurance', coverage: 'standard', monthlyPremium: 75.00 },
  ],
  claims: [
    { id: 'claim-123', planId: 'plan-123', serviceDate: new Date('2023-05-01T00:00:00Z'), amount: 350.00, status: 'approved', reimbursementDate: new Date('2023-05-10T00:00:00Z') },
    { id: 'claim-456', planId: 'plan-123', serviceDate: new Date('2023-05-05T00:00:00Z'), amount: 1200.00, status: 'pending', submissionDate: new Date('2023-05-07T00:00:00Z') },
  ],
  benefits: [
    { id: 'benefit-123', planId: 'plan-123', name: 'Annual Checkup', coveragePercentage: 100, limitPerYear: 1 },
    { id: 'benefit-456', planId: 'plan-123', name: 'Specialist Consultation', coveragePercentage: 80, limitPerYear: 10 },
    { id: 'benefit-789', planId: 'plan-456', name: 'Dental Cleaning', coveragePercentage: 100, limitPerYear: 2 },
  ],
};

/**
 * Gamification test data
 */
export const gamificationTestData = {
  achievements: [
    { id: 'achievement-123', name: 'Consistent Tracker', description: 'Log health metrics for 7 consecutive days', xpValue: 50, journey: JourneyType.HEALTH },
    { id: 'achievement-456', name: 'Appointment Keeper', description: 'Attend 5 appointments without rescheduling', xpValue: 75, journey: JourneyType.CARE },
    { id: 'achievement-789', name: 'Claim Master', description: 'Successfully submit 3 claims with all required documentation', xpValue: 100, journey: JourneyType.PLAN },
  ],
  levels: [
    { level: 1, xpRequired: 0, title: 'Beginner' },
    { level: 2, xpRequired: 100, title: 'Novice' },
    { level: 3, xpRequired: 250, title: 'Enthusiast' },
    { level: 4, xpRequired: 500, title: 'Advanced' },
    { level: 5, xpRequired: 1000, title: 'Expert' },
  ],
  userProgress: {
    userId: 'user-123',
    currentXp: 1250,
    level: 5,
    achievements: ['achievement-123', 'achievement-456', 'achievement-789'],
    journeyProgress: {
      [JourneyType.HEALTH]: 0.75,
      [JourneyType.CARE]: 0.60,
      [JourneyType.PLAN]: 0.40,
    },
  },
};