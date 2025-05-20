/**
 * Mock trace contexts for e2e testing of logging and tracing integration.
 * 
 * These fixtures simulate distributed trace contexts that would be generated
 * during request processing across multiple services. They are used to verify
 * that logs properly include trace information and maintain correlation.
 */

/**
 * Base interface for trace context objects used in tests
 */
export interface MockTraceContext {
  traceId: string;          // 16-byte hex string (32 characters)
  spanId: string;           // 8-byte hex string (16 characters)
  parentSpanId?: string;    // 8-byte hex string for parent span (if applicable)
  serviceName: string;      // Name of the service generating the span
  operationName: string;    // Name of the operation being traced
  startTime: number;        // Timestamp when the span started (milliseconds since epoch)
  endTime?: number;         // Timestamp when the span ended (if applicable)
  attributes?: Record<string, string | number | boolean>; // Additional context as key-value pairs
}

/**
 * Simple trace context with a single span
 */
export const singleSpanContext: MockTraceContext = {
  traceId: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  spanId: 'a1b2c3d4e5f6a7b8',
  serviceName: 'api-gateway',
  operationName: 'GET /health',
  startTime: Date.now() - 50,
  endTime: Date.now(),
  attributes: {
    'http.method': 'GET',
    'http.url': '/health',
    'http.status_code': 200
  }
};

/**
 * Parent span context for a multi-span trace
 */
export const parentSpanContext: MockTraceContext = {
  traceId: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
  spanId: 'b2c3d4e5f6a7b8c9',
  serviceName: 'api-gateway',
  operationName: 'POST /auth/login',
  startTime: Date.now() - 150,
  attributes: {
    'http.method': 'POST',
    'http.url': '/auth/login',
    'http.request_content_length': 256
  }
};

/**
 * Child span context that references the parent span
 */
export const childSpanContext: MockTraceContext = {
  traceId: parentSpanContext.traceId, // Same trace ID as parent
  spanId: 'c3d4e5f6a7b8c9d0',
  parentSpanId: parentSpanContext.spanId, // Reference to parent span
  serviceName: 'auth-service',
  operationName: 'validateCredentials',
  startTime: parentSpanContext.startTime + 10, // Started after parent
  endTime: parentSpanContext.startTime + 100,  // Ended before parent ends
  attributes: {
    'db.system': 'postgresql',
    'db.operation': 'SELECT',
    'db.statement': 'SELECT * FROM users WHERE email = $1',
    'auth.user_id': '12345'
  }
};

/**
 * Complete request flow across multiple services
 * This simulates a user accessing their health metrics, which requires:
 * 1. API Gateway receiving the request
 * 2. Auth Service validating the token
 * 3. Health Service retrieving the metrics
 * 4. Health Service processing the metrics
 */
export const multiServiceTraceContexts: MockTraceContext[] = [
  // Root span in API Gateway
  {
    traceId: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    spanId: 'd4e5f6a7b8c9d0e1',
    serviceName: 'api-gateway',
    operationName: 'GET /health/metrics',
    startTime: Date.now() - 300,
    endTime: Date.now(),
    attributes: {
      'http.method': 'GET',
      'http.url': '/health/metrics',
      'http.status_code': 200,
      'user.id': 'user-789',
      'journey': 'health'
    }
  },
  // Auth validation span
  {
    traceId: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    spanId: 'e5f6a7b8c9d0e1f2',
    parentSpanId: 'd4e5f6a7b8c9d0e1',
    serviceName: 'auth-service',
    operationName: 'validateToken',
    startTime: Date.now() - 280,
    endTime: Date.now() - 260,
    attributes: {
      'auth.token_type': 'JWT',
      'auth.user_id': 'user-789',
      'auth.scopes': 'health:read'
    }
  },
  // Health service database query
  {
    traceId: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    spanId: 'f6a7b8c9d0e1f2a3',
    parentSpanId: 'd4e5f6a7b8c9d0e1',
    serviceName: 'health-service',
    operationName: 'getHealthMetrics',
    startTime: Date.now() - 250,
    endTime: Date.now() - 150,
    attributes: {
      'db.system': 'postgresql',
      'db.operation': 'SELECT',
      'db.statement': 'SELECT * FROM health_metrics WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 10',
      'user.id': 'user-789',
      'journey': 'health'
    }
  },
  // Health service metrics processing
  {
    traceId: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    spanId: 'a7b8c9d0e1f2a3b4',
    parentSpanId: 'f6a7b8c9d0e1f2a3',
    serviceName: 'health-service',
    operationName: 'processMetrics',
    startTime: Date.now() - 140,
    endTime: Date.now() - 50,
    attributes: {
      'metrics.count': 10,
      'metrics.type': 'heart_rate,steps,sleep',
      'processing.algorithm': 'trend_analysis',
      'user.id': 'user-789',
      'journey': 'health'
    }
  }
];

/**
 * Trace context with error condition
 */
export const errorTraceContext: MockTraceContext = {
  traceId: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  spanId: 'e5f6a7b8c9d0e1f2',
  serviceName: 'care-service',
  operationName: 'scheduleAppointment',
  startTime: Date.now() - 200,
  endTime: Date.now() - 150,
  attributes: {
    'http.method': 'POST',
    'http.url': '/care/appointments',
    'http.status_code': 500,
    'error': true,
    'error.type': 'DatabaseConnectionError',
    'error.message': 'Failed to connect to database after 3 retries',
    'journey': 'care'
  }
};

/**
 * Trace context for gamification event processing
 */
export const gamificationTraceContext: MockTraceContext = {
  traceId: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
  spanId: 'f6a7b8c9d0e1f2a3',
  serviceName: 'gamification-engine',
  operationName: 'processAchievementEvent',
  startTime: Date.now() - 75,
  endTime: Date.now() - 30,
  attributes: {
    'event.type': 'achievement_unlocked',
    'event.source': 'health-service',
    'achievement.id': 'first_workout_complete',
    'user.id': 'user-456',
    'points.awarded': 50,
    'journey': 'health'
  }
};

/**
 * Trace context for plan journey operations
 */
export const planJourneyTraceContext: MockTraceContext = {
  traceId: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
  spanId: 'a7b8c9d0e1f2a3b4',
  serviceName: 'plan-service',
  operationName: 'getCoverageDetails',
  startTime: Date.now() - 120,
  endTime: Date.now() - 80,
  attributes: {
    'http.method': 'GET',
    'http.url': '/plan/coverage/details',
    'http.status_code': 200,
    'user.id': 'user-123',
    'plan.id': 'premium-family-2023',
    'journey': 'plan'
  }
};