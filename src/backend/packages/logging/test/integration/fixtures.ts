/**
 * Integration Test Fixtures for the Logging Package
 * 
 * This file provides test fixtures and mock data for integration testing of the logging package.
 * It contains sample log entries, context objects, configuration options, and expected output formats
 * that represent realistic use cases for the logging system.
 */

import { LogLevel } from '../../src/interfaces/log-level.enum';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { LogEntry } from '../../src/formatters/formatter.interface';

// ==============================
// Sample Log Entries
// ==============================

/**
 * Sample log entries for different log levels and scenarios
 */
export const sampleLogEntries: Record<string, LogEntry> = {
  /**
   * Basic log entry with minimal information
   */
  basic: {
    level: LogLevel.INFO,
    message: 'Application started successfully',
    timestamp: new Date('2023-06-15T08:00:00.000Z'),
    context: {
      service: 'api-gateway',
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      applicationName: 'austa-superapp'
    }
  },

  /**
   * Debug log entry with detailed information
   */
  debug: {
    level: LogLevel.DEBUG,
    message: 'Processing user authentication request',
    timestamp: new Date('2023-06-15T08:01:15.432Z'),
    context: {
      service: 'auth-service',
      correlationId: '550e8400-e29b-41d4-a716-446655440001',
      applicationName: 'austa-superapp',
      method: 'UserService.authenticate',
      params: { username: 'user@example.com', rememberMe: true }
    }
  },

  /**
   * Info log entry with journey context
   */
  journeyInfo: {
    level: LogLevel.INFO,
    message: 'User completed health assessment',
    timestamp: new Date('2023-06-15T08:05:30.123Z'),
    context: {
      service: 'health-service',
      correlationId: '550e8400-e29b-41d4-a716-446655440002',
      applicationName: 'austa-superapp',
      journeyType: 'Health',
      journeyId: 'health-assessment-123',
      userId: 'user-789',
      completionTime: 180, // seconds
      assessmentScore: 85
    }
  },

  /**
   * Warning log entry with request context
   */
  warning: {
    level: LogLevel.WARN,
    message: 'Rate limit threshold exceeded',
    timestamp: new Date('2023-06-15T08:10:45.789Z'),
    context: {
      service: 'api-gateway',
      correlationId: '550e8400-e29b-41d4-a716-446655440003',
      applicationName: 'austa-superapp',
      requestId: 'req-456',
      ipAddress: '192.168.1.1',
      method: 'GET',
      path: '/api/health/metrics',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      userId: 'user-789',
      requestsPerMinute: 120,
      threshold: 100
    }
  },

  /**
   * Error log entry with error details
   */
  error: {
    level: LogLevel.ERROR,
    message: 'Failed to process payment',
    timestamp: new Date('2023-06-15T08:15:22.456Z'),
    error: new Error('Payment gateway timeout'),
    context: {
      service: 'payment-service',
      correlationId: '550e8400-e29b-41d4-a716-446655440004',
      applicationName: 'austa-superapp',
      requestId: 'req-789',
      userId: 'user-456',
      paymentId: 'pmt-123',
      paymentAmount: 99.99,
      paymentMethod: 'credit_card',
      attemptNumber: 2,
      errorCode: 'GATEWAY_TIMEOUT'
    }
  },

  /**
   * Fatal log entry with critical system error
   */
  fatal: {
    level: LogLevel.FATAL,
    message: 'Database connection pool exhausted',
    timestamp: new Date('2023-06-15T08:20:10.111Z'),
    error: new Error('Connection limit exceeded'),
    context: {
      service: 'database-service',
      correlationId: '550e8400-e29b-41d4-a716-446655440005',
      applicationName: 'austa-superapp',
      databaseHost: 'primary-db-cluster.example.com',
      connectionPoolSize: 100,
      activeConnections: 100,
      waitingConnections: 50,
      errorCode: 'CONNECTION_LIMIT_EXCEEDED'
    }
  },

  /**
   * Log entry with gamification event
   */
  gamification: {
    level: LogLevel.INFO,
    message: 'Achievement unlocked',
    timestamp: new Date('2023-06-15T08:25:45.789Z'),
    context: {
      service: 'gamification-engine',
      correlationId: '550e8400-e29b-41d4-a716-446655440006',
      applicationName: 'austa-superapp',
      userId: 'user-123',
      achievementId: 'first-appointment-completed',
      achievementName: 'First Appointment Completed',
      pointsAwarded: 50,
      currentLevel: 2,
      progressToNextLevel: 0.45,
      journeyType: 'Care'
    }
  }
};

// ==============================
// Context Objects
// ==============================

/**
 * Base logging context with common fields
 */
export const baseContext: LoggingContext = {
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  service: 'api-gateway',
  applicationName: 'austa-superapp',
  environment: 'production',
  version: '1.5.0',
  instanceId: 'i-1234567890abcdef0',
  region: 'us-east-1'
};

/**
 * Sample journey contexts for different journey types
 */
export const journeyContexts: Record<string, JourneyContext> = {
  health: {
    ...baseContext,
    journeyType: 'Health',
    journeyId: 'health-assessment-123',
    journeyName: 'Health Assessment',
    journeyStep: 'metrics-collection',
    journeyStepIndex: 2,
    totalJourneySteps: 5,
    startedAt: new Date('2023-06-15T07:55:00.000Z')
  },
  care: {
    ...baseContext,
    journeyType: 'Care',
    journeyId: 'appointment-booking-456',
    journeyName: 'Appointment Booking',
    journeyStep: 'doctor-selection',
    journeyStepIndex: 3,
    totalJourneySteps: 6,
    startedAt: new Date('2023-06-15T08:10:00.000Z'),
    specialtySelected: 'Cardiology',
    appointmentType: 'Video Consultation'
  },
  plan: {
    ...baseContext,
    journeyType: 'Plan',
    journeyId: 'claim-submission-789',
    journeyName: 'Claim Submission',
    journeyStep: 'document-upload',
    journeyStepIndex: 4,
    totalJourneySteps: 7,
    startedAt: new Date('2023-06-15T08:30:00.000Z'),
    claimType: 'Medical',
    claimAmount: 250.75,
    documentCount: 3
  }
};

/**
 * Sample user contexts for different user types
 */
export const userContexts: Record<string, UserContext> = {
  standard: {
    ...baseContext,
    userId: 'user-123',
    username: 'john.doe@example.com',
    isAuthenticated: true,
    roles: ['user'],
    lastLoginAt: new Date('2023-06-14T18:30:00.000Z'),
    deviceId: 'device-abc-123',
    preferredLanguage: 'en-US'
  },
  premium: {
    ...baseContext,
    userId: 'user-456',
    username: 'jane.smith@example.com',
    isAuthenticated: true,
    roles: ['user', 'premium'],
    lastLoginAt: new Date('2023-06-15T07:45:00.000Z'),
    deviceId: 'device-def-456',
    preferredLanguage: 'pt-BR',
    subscriptionTier: 'premium',
    subscriptionExpiresAt: new Date('2024-06-15T00:00:00.000Z')
  },
  admin: {
    ...baseContext,
    userId: 'admin-789',
    username: 'admin@austa.com',
    isAuthenticated: true,
    roles: ['user', 'admin'],
    lastLoginAt: new Date('2023-06-15T08:00:00.000Z'),
    deviceId: 'device-ghi-789',
    preferredLanguage: 'en-US',
    adminPermissions: ['user_management', 'content_management', 'analytics']
  },
  unauthenticated: {
    ...baseContext,
    userId: undefined,
    username: undefined,
    isAuthenticated: false,
    roles: [],
    deviceId: 'device-jkl-012',
    preferredLanguage: 'en-US'
  }
};

/**
 * Sample request contexts for different HTTP requests
 */
export const requestContexts: Record<string, RequestContext> = {
  getHealth: {
    ...baseContext,
    requestId: 'req-123',
    ipAddress: '192.168.1.1',
    method: 'GET',
    url: 'https://api.austa.com/health/metrics',
    path: '/health/metrics',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    startTime: new Date('2023-06-15T08:05:00.000Z'),
    queryParams: { period: '7d', metrics: 'steps,heart_rate,sleep' },
    headers: {
      'accept-language': 'en-US,en;q=0.9',
      'x-request-id': 'req-123',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    }
  },
  postAppointment: {
    ...baseContext,
    requestId: 'req-456',
    ipAddress: '192.168.1.2',
    method: 'POST',
    url: 'https://api.austa.com/care/appointments',
    path: '/care/appointments',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    startTime: new Date('2023-06-15T08:15:00.000Z'),
    body: {
      doctorId: 'doc-123',
      appointmentType: 'video',
      date: '2023-06-20',
      time: '14:30',
      reason: 'Follow-up consultation'
    },
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-456',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  },
  putClaim: {
    ...baseContext,
    requestId: 'req-789',
    ipAddress: '192.168.1.3',
    method: 'PUT',
    url: 'https://api.austa.com/plan/claims/claim-123',
    path: '/plan/claims/claim-123',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    startTime: new Date('2023-06-15T08:25:00.000Z'),
    body: {
      status: 'submitted',
      documents: ['doc-1', 'doc-2', 'doc-3'],
      additionalInfo: 'Updated claim with all required documents'
    },
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-789',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    }
  },
  deleteAppointment: {
    ...baseContext,
    requestId: 'req-012',
    ipAddress: '192.168.1.4',
    method: 'DELETE',
    url: 'https://api.austa.com/care/appointments/apt-456',
    path: '/care/appointments/apt-456',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    startTime: new Date('2023-06-15T08:35:00.000Z'),
    queryParams: { reason: 'reschedule' },
    headers: {
      'x-request-id': 'req-012',
      'user-agent': 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    }
  }
};

// ==============================
// Configuration Objects
// ==============================

/**
 * Sample logger configurations for different environments
 */
export const loggerConfigs: Record<string, LoggerConfig> = {
  development: {
    level: LogLevel.DEBUG,
    formatter: 'text',
    transports: [
      {
        type: 'console',
        options: {
          colorize: true
        }
      },
      {
        type: 'file',
        options: {
          filename: './logs/austa-dev.log',
          maxSize: '10m',
          maxFiles: 5
        }
      }
    ],
    context: {
      service: 'api-gateway',
      applicationName: 'austa-superapp',
      environment: 'development'
    }
  },
  testing: {
    level: LogLevel.DEBUG,
    formatter: 'json',
    transports: [
      {
        type: 'console',
        options: {
          colorize: false
        }
      }
    ],
    context: {
      service: 'api-gateway',
      applicationName: 'austa-superapp',
      environment: 'testing'
    }
  },
  staging: {
    level: LogLevel.INFO,
    formatter: 'json',
    transports: [
      {
        type: 'console',
        options: {
          colorize: false
        }
      },
      {
        type: 'cloudwatch',
        options: {
          logGroupName: '/austa/staging',
          logStreamName: 'api-gateway',
          region: 'us-east-1',
          retentionInDays: 14
        }
      }
    ],
    context: {
      service: 'api-gateway',
      applicationName: 'austa-superapp',
      environment: 'staging'
    }
  },
  production: {
    level: LogLevel.INFO,
    formatter: 'cloudwatch',
    transports: [
      {
        type: 'cloudwatch',
        options: {
          logGroupName: '/austa/production',
          logStreamName: 'api-gateway',
          region: 'us-east-1',
          retentionInDays: 30,
          batchSize: 100,
          maxRetries: 3,
          retryDelay: 100
        }
      }
    ],
    context: {
      service: 'api-gateway',
      applicationName: 'austa-superapp',
      environment: 'production'
    }
  },
  healthJourney: {
    level: LogLevel.INFO,
    formatter: 'json',
    transports: [
      {
        type: 'console',
        options: {
          colorize: false
        }
      },
      {
        type: 'cloudwatch',
        options: {
          logGroupName: '/austa/production/health-journey',
          logStreamName: 'health-service',
          region: 'us-east-1',
          retentionInDays: 30
        }
      }
    ],
    context: {
      service: 'health-service',
      applicationName: 'austa-superapp',
      environment: 'production',
      journeyType: 'Health'
    }
  },
  careJourney: {
    level: LogLevel.INFO,
    formatter: 'json',
    transports: [
      {
        type: 'console',
        options: {
          colorize: false
        }
      },
      {
        type: 'cloudwatch',
        options: {
          logGroupName: '/austa/production/care-journey',
          logStreamName: 'care-service',
          region: 'us-east-1',
          retentionInDays: 30
        }
      }
    ],
    context: {
      service: 'care-service',
      applicationName: 'austa-superapp',
      environment: 'production',
      journeyType: 'Care'
    }
  },
  planJourney: {
    level: LogLevel.INFO,
    formatter: 'json',
    transports: [
      {
        type: 'console',
        options: {
          colorize: false
        }
      },
      {
        type: 'cloudwatch',
        options: {
          logGroupName: '/austa/production/plan-journey',
          logStreamName: 'plan-service',
          region: 'us-east-1',
          retentionInDays: 30
        }
      }
    ],
    context: {
      service: 'plan-service',
      applicationName: 'austa-superapp',
      environment: 'production',
      journeyType: 'Plan'
    }
  }
};

// ==============================
// Expected Output Fixtures
// ==============================

/**
 * Expected formatted outputs for different formatters
 */
export const expectedOutputs: Record<string, Record<string, string>> = {
  /**
   * Expected outputs for the JSON formatter
   */
  json: {
    basic: JSON.stringify({
      level: 'INFO',
      message: 'Application started successfully',
      timestamp: '2023-06-15T08:00:00.000Z',
      context: {
        service: 'api-gateway',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        applicationName: 'austa-superapp'
      }
    }),
    error: JSON.stringify({
      level: 'ERROR',
      message: 'Failed to process payment',
      timestamp: '2023-06-15T08:15:22.456Z',
      error: {
        name: 'Error',
        message: 'Payment gateway timeout',
        stack: expect.any(String)
      },
      context: {
        service: 'payment-service',
        correlationId: '550e8400-e29b-41d4-a716-446655440004',
        applicationName: 'austa-superapp',
        requestId: 'req-789',
        userId: 'user-456',
        paymentId: 'pmt-123',
        paymentAmount: 99.99,
        paymentMethod: 'credit_card',
        attemptNumber: 2,
        errorCode: 'GATEWAY_TIMEOUT'
      }
    }),
    journeyInfo: JSON.stringify({
      level: 'INFO',
      message: 'User completed health assessment',
      timestamp: '2023-06-15T08:05:30.123Z',
      context: {
        service: 'health-service',
        correlationId: '550e8400-e29b-41d4-a716-446655440002',
        applicationName: 'austa-superapp',
        journeyType: 'Health',
        journeyId: 'health-assessment-123',
        userId: 'user-789',
        completionTime: 180,
        assessmentScore: 85
      }
    })
  },

  /**
   * Expected outputs for the CloudWatch formatter
   */
  cloudwatch: {
    basic: JSON.stringify({
      level: 'INFO',
      message: 'Application started successfully',
      timestamp: '2023-06-15T08:00:00.000Z',
      context: {
        service: 'api-gateway',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        applicationName: 'austa-superapp'
      },
      aws: {
        logGroup: '/austa/production',
        logStream: 'api-gateway',
        region: 'us-east-1'
      }
    }),
    error: JSON.stringify({
      level: 'ERROR',
      message: 'Failed to process payment',
      timestamp: '2023-06-15T08:15:22.456Z',
      error: {
        name: 'Error',
        message: 'Payment gateway timeout',
        stack: expect.any(String)
      },
      context: {
        service: 'payment-service',
        correlationId: '550e8400-e29b-41d4-a716-446655440004',
        applicationName: 'austa-superapp',
        requestId: 'req-789',
        userId: 'user-456',
        paymentId: 'pmt-123',
        paymentAmount: 99.99,
        paymentMethod: 'credit_card',
        attemptNumber: 2,
        errorCode: 'GATEWAY_TIMEOUT'
      },
      aws: {
        logGroup: '/austa/production',
        logStream: 'payment-service',
        region: 'us-east-1'
      }
    }),
    journeyInfo: JSON.stringify({
      level: 'INFO',
      message: 'User completed health assessment',
      timestamp: '2023-06-15T08:05:30.123Z',
      context: {
        service: 'health-service',
        correlationId: '550e8400-e29b-41d4-a716-446655440002',
        applicationName: 'austa-superapp',
        journeyType: 'Health',
        journeyId: 'health-assessment-123',
        userId: 'user-789',
        completionTime: 180,
        assessmentScore: 85
      },
      aws: {
        logGroup: '/austa/production/health-journey',
        logStream: 'health-service',
        region: 'us-east-1'
      }
    })
  }
};

// ==============================
// Error Objects and Stack Traces
// ==============================

/**
 * Sample error objects with realistic stack traces
 */
export const errorFixtures: Record<string, Error> = {
  /**
   * Basic error with simple message
   */
  basic: new Error('Something went wrong'),

  /**
   * Database connection error
   */
  database: (() => {
    const error = new Error('Database connection failed: ECONNREFUSED');
    error.name = 'ConnectionError';
    Object.defineProperty(error, 'code', { value: 'ECONNREFUSED' });
    return error;
  })(),

  /**
   * API timeout error
   */
  timeout: (() => {
    const error = new Error('Request timed out after 30000ms');
    error.name = 'TimeoutError';
    Object.defineProperty(error, 'code', { value: 'ETIMEDOUT' });
    return error;
  })(),

  /**
   * Validation error
   */
  validation: (() => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    Object.defineProperty(error, 'details', {
      value: [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' }
      ]
    });
    return error;
  })(),

  /**
   * Authentication error
   */
  authentication: (() => {
    const error = new Error('Invalid credentials');
    error.name = 'AuthenticationError';
    Object.defineProperty(error, 'code', { value: 'INVALID_CREDENTIALS' });
    return error;
  })(),

  /**
   * Authorization error
   */
  authorization: (() => {
    const error = new Error('Insufficient permissions');
    error.name = 'AuthorizationError';
    Object.defineProperty(error, 'code', { value: 'INSUFFICIENT_PERMISSIONS' });
    Object.defineProperty(error, 'requiredPermissions', {
      value: ['admin', 'content_management']
    });
    return error;
  })(),

  /**
   * External API error
   */
  externalApi: (() => {
    const error = new Error('External API returned status 500');
    error.name = 'ExternalApiError';
    Object.defineProperty(error, 'response', {
      value: {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
          requestId: 'ext-req-123'
        }
      }
    });
    return error;
  })(),

  /**
   * Journey-specific error
   */
  journeyError: (() => {
    const error = new Error('Failed to complete health journey step');
    error.name = 'JourneyError';
    Object.defineProperty(error, 'journeyType', { value: 'Health' });
    Object.defineProperty(error, 'journeyId', { value: 'health-assessment-123' });
    Object.defineProperty(error, 'stepId', { value: 'metrics-collection' });
    Object.defineProperty(error, 'reason', { value: 'Missing required health metrics' });
    return error;
  })()
};

/**
 * Sample stack traces for different error scenarios
 */
export const stackTraceFixtures: Record<string, string> = {
  basic: `Error: Something went wrong
    at Object.<anonymous> (/app/src/backend/packages/logging/test/integration/logger.spec.ts:42:19)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
    at Module.load (internal/modules/cjs/loader.js:950:32)
    at Function.Module._load (internal/modules/cjs/loader.js:790:12)
    at Module.require (internal/modules/cjs/loader.js:974:19)
    at require (internal/modules/cjs/helpers.js:101:18)
    at /app/node_modules/jest/bin/jest.js:27:1`,

  database: `ConnectionError: Database connection failed: ECONNREFUSED
    at Connection.connectToDatabase (/app/src/backend/packages/database/src/connection.ts:78:11)
    at PrismaClient.connect (/app/src/backend/packages/database/src/prisma-client.ts:45:23)
    at HealthService.getMetrics (/app/src/backend/health-service/src/health/health.service.ts:112:28)
    at HealthController.getMetrics (/app/src/backend/health-service/src/health/health.controller.ts:54:35)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
    at async NestFactory.create (/app/node_modules/@nestjs/core/nest-factory.js:51:31)`,

  apiGateway: `Error: Failed to route request
    at ApiGatewayService.routeRequest (/app/src/backend/api-gateway/src/gateway/gateway.service.ts:156:13)
    at ApiGatewayController.handleRequest (/app/src/backend/api-gateway/src/gateway/gateway.controller.ts:87:42)
    at RouteHandler.handle (/app/node_modules/@nestjs/core/router/route-handler.js:98:23)
    at /app/node_modules/@nestjs/core/router/router-execution-context.js:134:25
    at /app/node_modules/@nestjs/core/router/router-proxy.js:9:23`,

  journeyContext: `JourneyError: Failed to complete health journey step
    at HealthJourneyService.completeStep (/app/src/backend/health-service/src/journey/health-journey.service.ts:203:15)
    at HealthJourneyController.completeStep (/app/src/backend/health-service/src/journey/health-journey.controller.ts:78:42)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
    at async JourneyContextInterceptor.intercept (/app/src/backend/packages/logging/src/context/journey-context.interceptor.ts:34:7)`
};

// ==============================
// Transport Test Fixtures
// ==============================

/**
 * Mock transport configurations for testing
 */
export const transportConfigs = {
  console: {
    type: 'console',
    options: {
      colorize: true
    }
  },
  file: {
    type: 'file',
    options: {
      filename: './logs/test.log',
      maxSize: '10m',
      maxFiles: 5
    }
  },
  cloudwatch: {
    type: 'cloudwatch',
    options: {
      logGroupName: '/austa/test',
      logStreamName: 'test-service',
      region: 'us-east-1',
      retentionInDays: 7
    }
  }
};

/**
 * Mock transport write results for testing
 */
export const transportResults = {
  console: { success: true, destination: 'console' },
  file: { success: true, destination: './logs/test.log' },
  cloudwatch: { success: true, destination: '/austa/test/test-service' }
};