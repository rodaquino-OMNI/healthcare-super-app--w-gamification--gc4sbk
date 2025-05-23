/**
 * Test fixtures for integration testing of the logging package.
 * Provides sample log entries, context objects, configuration options, and expected output formats.
 */

import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LogContext } from '../../src/interfaces/log-context.interface';
import { LoggerConfig } from '../../src/interfaces/logger-config.interface';
import { TransportConfig } from '../../src/interfaces/transport-config.interface';

/**
 * Sample log entries for different log levels
 */
export const sampleLogEntries = {
  info: {
    level: LogLevel.INFO,
    message: 'User profile updated successfully',
    timestamp: new Date('2023-05-15T14:30:00Z'),
    context: { userId: '12345', service: 'user-service' }
  },
  error: {
    level: LogLevel.ERROR,
    message: 'Failed to process payment',
    timestamp: new Date('2023-05-15T14:35:00Z'),
    context: { userId: '12345', service: 'payment-service' },
    error: new Error('Payment gateway timeout')
  },
  warn: {
    level: LogLevel.WARN,
    message: 'Rate limit approaching threshold',
    timestamp: new Date('2023-05-15T14:32:00Z'),
    context: { service: 'api-gateway', endpoint: '/api/v1/users' }
  },
  debug: {
    level: LogLevel.DEBUG,
    message: 'Processing request payload',
    timestamp: new Date('2023-05-15T14:31:00Z'),
    context: { requestId: 'req-123', method: 'POST' }
  },
  verbose: {
    level: LogLevel.VERBOSE,
    message: 'Cache hit for user preferences',
    timestamp: new Date('2023-05-15T14:29:00Z'),
    context: { userId: '12345', cacheKey: 'user:12345:prefs' }
  }
};

/**
 * Journey-specific context objects
 */
export const journeyContexts = {
  health: {
    journey: 'health',
    userId: 'user-123',
    action: 'record-health-metric',
    metricType: 'blood-pressure',
    deviceId: 'device-456',
    correlationId: 'corr-789'
  },
  care: {
    journey: 'care',
    userId: 'user-123',
    action: 'schedule-appointment',
    providerId: 'provider-456',
    appointmentType: 'consultation',
    correlationId: 'corr-789'
  },
  plan: {
    journey: 'plan',
    userId: 'user-123',
    action: 'submit-claim',
    claimId: 'claim-456',
    benefitType: 'dental',
    correlationId: 'corr-789'
  }
};

/**
 * User context objects
 */
export const userContexts = {
  authenticated: {
    userId: 'user-123',
    username: 'johndoe',
    email: 'john.doe@example.com',
    roles: ['user'],
    sessionId: 'session-456'
  },
  admin: {
    userId: 'admin-123',
    username: 'adminuser',
    email: 'admin@example.com',
    roles: ['admin', 'user'],
    sessionId: 'session-789'
  },
  anonymous: {
    sessionId: 'session-anonymous-123'
  }
};

/**
 * Request context objects
 */
export const requestContexts = {
  httpGet: {
    requestId: 'req-123',
    method: 'GET',
    path: '/api/v1/users/profile',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    duration: 45 // ms
  },
  httpPost: {
    requestId: 'req-456',
    method: 'POST',
    path: '/api/v1/appointments',
    ip: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X)',
    duration: 120 // ms
  },
  graphql: {
    requestId: 'req-789',
    operation: 'getUserProfile',
    variables: { userId: 'user-123' },
    ip: '192.168.1.3',
    userAgent: 'Apollo Client',
    duration: 78 // ms
  }
};

/**
 * Combined context objects for realistic scenarios
 */
export const combinedContexts: Record<string, LogContext> = {
  healthMetricRecording: {
    ...journeyContexts.health,
    ...userContexts.authenticated,
    requestId: requestContexts.httpPost.requestId,
    traceId: 'trace-123',
    spanId: 'span-456',
    environment: 'production'
  },
  careAppointmentScheduling: {
    ...journeyContexts.care,
    ...userContexts.authenticated,
    requestId: requestContexts.graphql.requestId,
    traceId: 'trace-456',
    spanId: 'span-789',
    environment: 'production'
  },
  planClaimSubmission: {
    ...journeyContexts.plan,
    ...userContexts.authenticated,
    requestId: requestContexts.httpPost.requestId,
    traceId: 'trace-789',
    spanId: 'span-123',
    environment: 'production'
  },
  adminUserManagement: {
    journey: 'admin',
    action: 'update-user-roles',
    targetUserId: 'user-123',
    ...userContexts.admin,
    requestId: requestContexts.httpPost.requestId,
    traceId: 'trace-321',
    spanId: 'span-654',
    environment: 'production'
  }
};

/**
 * Sample configuration objects for different environments
 */
export const loggerConfigs: Record<string, LoggerConfig> = {
  development: {
    level: LogLevel.DEBUG,
    service: 'austa-superapp',
    transports: [
      {
        type: 'console',
        format: 'pretty',
        level: LogLevel.DEBUG
      }
    ],
    context: {
      environment: 'development'
    }
  },
  testing: {
    level: LogLevel.VERBOSE,
    service: 'austa-superapp',
    transports: [
      {
        type: 'console',
        format: 'json',
        level: LogLevel.VERBOSE
      },
      {
        type: 'file',
        format: 'json',
        level: LogLevel.DEBUG,
        filename: './logs/test.log'
      }
    ],
    context: {
      environment: 'testing'
    }
  },
  production: {
    level: LogLevel.INFO,
    service: 'austa-superapp',
    transports: [
      {
        type: 'console',
        format: 'json',
        level: LogLevel.INFO
      },
      {
        type: 'file',
        format: 'json',
        level: LogLevel.INFO,
        filename: './logs/app.log'
      },
      {
        type: 'cloudwatch',
        format: 'json',
        level: LogLevel.ERROR,
        options: {
          logGroupName: '/austa/superapp',
          logStreamName: 'application',
          region: 'us-east-1'
        }
      }
    ],
    context: {
      environment: 'production'
    }
  },
  journeySpecific: {
    level: LogLevel.INFO,
    service: 'health-journey',
    transports: [
      {
        type: 'console',
        format: 'json',
        level: LogLevel.INFO
      },
      {
        type: 'elasticsearch',
        format: 'json',
        level: LogLevel.INFO,
        options: {
          node: 'http://elasticsearch:9200',
          index: 'health-journey-logs'
        }
      }
    ],
    context: {
      journey: 'health',
      environment: 'production'
    }
  }
};

/**
 * Transport configuration samples
 */
export const transportConfigs: Record<string, TransportConfig> = {
  console: {
    type: 'console',
    format: 'pretty',
    level: LogLevel.DEBUG
  },
  file: {
    type: 'file',
    format: 'json',
    level: LogLevel.INFO,
    filename: './logs/app.log'
  },
  cloudwatch: {
    type: 'cloudwatch',
    format: 'json',
    level: LogLevel.ERROR,
    options: {
      logGroupName: '/austa/superapp',
      logStreamName: 'application',
      region: 'us-east-1'
    }
  },
  elasticsearch: {
    type: 'elasticsearch',
    format: 'json',
    level: LogLevel.INFO,
    options: {
      node: 'http://elasticsearch:9200',
      index: 'austa-logs'
    }
  }
};

/**
 * Expected output formats for different formatters
 */
export const expectedOutputFormats = {
  prettyConsole: {
    info: '[2023-05-15T14:30:00Z] [INFO] User profile updated successfully {"userId":"12345","service":"user-service"}',
    error: '[2023-05-15T14:35:00Z] [ERROR] Failed to process payment {"userId":"12345","service":"payment-service"} Error: Payment gateway timeout\n    at Object.<anonymous> (/path/to/file.js:10:20)\n    at Module._compile (internal/modules/cjs/loader.js:1138:30)',
    warn: '[2023-05-15T14:32:00Z] [WARN] Rate limit approaching threshold {"service":"api-gateway","endpoint":"/api/v1/users"}',
    debug: '[2023-05-15T14:31:00Z] [DEBUG] Processing request payload {"requestId":"req-123","method":"POST"}',
    verbose: '[2023-05-15T14:29:00Z] [VERBOSE] Cache hit for user preferences {"userId":"12345","cacheKey":"user:12345:prefs"}'
  },
  jsonFormat: {
    info: '{"level":"info","message":"User profile updated successfully","timestamp":"2023-05-15T14:30:00.000Z","context":{"userId":"12345","service":"user-service"}}',
    error: '{"level":"error","message":"Failed to process payment","timestamp":"2023-05-15T14:35:00.000Z","context":{"userId":"12345","service":"payment-service"},"error":{"message":"Payment gateway timeout","stack":"Error: Payment gateway timeout\n    at Object.<anonymous> (/path/to/file.js:10:20)\n    at Module._compile (internal/modules/cjs/loader.js:1138:30)"}}',
    warn: '{"level":"warn","message":"Rate limit approaching threshold","timestamp":"2023-05-15T14:32:00.000Z","context":{"service":"api-gateway","endpoint":"/api/v1/users"}}',
    debug: '{"level":"debug","message":"Processing request payload","timestamp":"2023-05-15T14:31:00.000Z","context":{"requestId":"req-123","method":"POST"}}',
    verbose: '{"level":"verbose","message":"Cache hit for user preferences","timestamp":"2023-05-15T14:29:00.000Z","context":{"userId":"12345","cacheKey":"user:12345:prefs"}}'
  },
  cloudwatchFormat: {
    info: '{"level":"info","message":"User profile updated successfully","timestamp":"2023-05-15T14:30:00.000Z","context":{"userId":"12345","service":"user-service","awsRequestId":"aws-req-123"}}',
    error: '{"level":"error","message":"Failed to process payment","timestamp":"2023-05-15T14:35:00.000Z","context":{"userId":"12345","service":"payment-service","awsRequestId":"aws-req-123"},"error":{"message":"Payment gateway timeout","stack":"Error: Payment gateway timeout\n    at Object.<anonymous> (/path/to/file.js:10:20)\n    at Module._compile (internal/modules/cjs/loader.js:1138:30)"},"@timestamp":"2023-05-15T14:35:00.000Z"}'
  }
};

/**
 * Error objects with stack traces for error logging tests
 */
export const errorFixtures = {
  simpleError: (() => {
    const error = new Error('Simple error message');
    error.stack = 'Error: Simple error message\n    at Object.<anonymous> (/path/to/file.js:10:20)\n    at Module._compile (internal/modules/cjs/loader.js:1138:30)';
    return error;
  })(),
  validationError: (() => {
    const error = new Error('Validation failed: Email is invalid');
    error.name = 'ValidationError';
    error.stack = 'ValidationError: Validation failed: Email is invalid\n    at validate (/path/to/validator.js:25:11)\n    at processInput (/path/to/processor.js:42:15)';
    return error;
  })(),
  databaseError: (() => {
    const error = new Error('Database connection failed');
    error.name = 'DatabaseError';
    error.stack = 'DatabaseError: Database connection failed\n    at connectToDatabase (/path/to/db.js:30:18)\n    at initializeApp (/path/to/app.js:15:12)';
    return error;
  })(),
  nestedError: (() => {
    const originalError = new Error('Original error');
    originalError.stack = 'Error: Original error\n    at someFunction (/path/to/original.js:5:10)\n    at anotherFunction (/path/to/another.js:15:20)';
    
    const wrappedError = new Error('Wrapped error');
    wrappedError.stack = 'Error: Wrapped error\n    at wrapError (/path/to/wrapper.js:10:15)\n    at handleRequest (/path/to/handler.js:25:30)';
    wrappedError.cause = originalError;
    
    return wrappedError;
  })()
};

/**
 * Journey-specific error objects
 */
export const journeyErrors = {
  health: (() => {
    const error = new Error('Failed to sync health data from device');
    error.name = 'HealthSyncError';
    error.stack = 'HealthSyncError: Failed to sync health data from device\n    at syncHealthData (/path/to/health-service.js:45:12)\n    at processDeviceData (/path/to/device-handler.js:30:18)';
    return error;
  })(),
  care: (() => {
    const error = new Error('Provider not available for selected time slot');
    error.name = 'AppointmentError';
    error.stack = 'AppointmentError: Provider not available for selected time slot\n    at checkAvailability (/path/to/appointment-service.js:78:15)\n    at scheduleAppointment (/path/to/scheduler.js:42:20)';
    return error;
  })(),
  plan: (() => {
    const error = new Error('Claim submission failed: Missing documentation');
    error.name = 'ClaimError';
    error.stack = 'ClaimError: Claim submission failed: Missing documentation\n    at validateClaim (/path/to/claim-service.js:112:22)\n    at submitClaim (/path/to/claim-processor.js:55:18)';
    return error;
  })()
};

/**
 * Mock trace context for distributed tracing integration
 */
export const traceContexts = {
  simple: {
    traceId: 'trace-123456789',
    spanId: 'span-987654321',
    parentSpanId: null,
    sampled: true
  },
  withParent: {
    traceId: 'trace-abcdef123',
    spanId: 'span-456789abc',
    parentSpanId: 'span-parent123',
    sampled: true
  },
  notSampled: {
    traceId: 'trace-notsampled',
    spanId: 'span-notsampled',
    parentSpanId: null,
    sampled: false
  }
};

/**
 * Sample structured log data for testing formatters
 */
export const structuredLogData = {
  userActivity: {
    user: {
      id: 'user-123',
      email: 'user@example.com'
    },
    activity: {
      type: 'login',
      timestamp: new Date('2023-05-15T10:30:00Z'),
      device: {
        type: 'mobile',
        os: 'iOS',
        version: '15.4'
      }
    },
    metadata: {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X)'
    }
  },
  healthMetric: {
    user: {
      id: 'user-456',
      email: 'health@example.com'
    },
    metric: {
      type: 'blood_pressure',
      systolic: 120,
      diastolic: 80,
      timestamp: new Date('2023-05-15T08:45:00Z')
    },
    device: {
      id: 'device-789',
      type: 'blood_pressure_monitor',
      manufacturer: 'Omron'
    }
  },
  apiRequest: {
    request: {
      id: 'req-abc123',
      method: 'POST',
      path: '/api/v1/appointments',
      body: {
        providerId: 'provider-123',
        date: '2023-06-01',
        time: '14:30',
        type: 'consultation'
      }
    },
    response: {
      statusCode: 201,
      body: {
        appointmentId: 'appt-456',
        status: 'scheduled'
      }
    },
    performance: {
      duration: 120,
      dbQueries: 3,
      cacheHits: 1
    }
  }
};