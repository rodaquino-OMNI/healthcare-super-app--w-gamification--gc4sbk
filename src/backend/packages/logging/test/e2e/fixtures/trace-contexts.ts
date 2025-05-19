/**
 * Mock trace context objects for testing integration between logging and distributed tracing.
 * These fixtures simulate trace propagation across service boundaries and are used in
 * tracing-integration.e2e-spec.ts tests.
 */

/**
 * Base interface for trace context objects used in tests
 */
export interface MockTraceContext {
  traceId: string;          // 32-character hex string (16 bytes)
  spanId: string;           // 16-character hex string (8 bytes)
  parentSpanId?: string;    // 16-character hex string (8 bytes) or undefined for root spans
  traceFlags: string;       // 2-character hex string (1 byte), typically '01' for sampled
  traceState?: string;      // W3C trace state string (vendor-specific key-value pairs)
  isRemote: boolean;        // Whether the context was received from another service
  serviceName: string;      // Name of the service that created this span
  operationName: string;    // Name of the operation this span represents
  startTimeMs: number;      // Start time in milliseconds since epoch
  endTimeMs?: number;       // End time in milliseconds since epoch (undefined if span is ongoing)
  attributes?: Record<string, string | number | boolean>; // Span attributes
}

/**
 * Helper function to create a W3C traceparent header value from trace context
 */
export function createTraceParentHeader(context: MockTraceContext): string {
  const parentId = context.parentSpanId || '0000000000000000';
  return `00-${context.traceId}-${context.spanId}-${context.traceFlags}`;
}

/**
 * Helper function to create a W3C tracestate header value from trace context
 */
export function createTraceStateHeader(context: MockTraceContext): string {
  if (!context.traceState) {
    return `austa=${context.serviceName},journey=${getJourneyFromService(context.serviceName)}`;
  }
  return context.traceState;
}

/**
 * Helper function to extract journey type from service name
 */
function getJourneyFromService(serviceName: string): string {
  if (serviceName.includes('health')) return 'health';
  if (serviceName.includes('care')) return 'care';
  if (serviceName.includes('plan')) return 'plan';
  return 'common';
}

/**
 * Root trace context for an API Gateway request
 * This represents the entry point for a distributed trace
 */
export const apiGatewayRootContext: MockTraceContext = {
  traceId: '5b8aa5a2d2c872e8321cf37308d69df2',
  spanId: '051581bf3cb55c13',
  traceFlags: '01',
  isRemote: false,
  serviceName: 'api-gateway',
  operationName: 'HTTP GET /api/v1/health/metrics',
  startTimeMs: Date.now() - 500, // Started 500ms ago
  attributes: {
    'http.method': 'GET',
    'http.url': '/api/v1/health/metrics',
    'http.status_code': 200,
    'http.flavor': '1.1',
    'net.peer.ip': '192.168.1.5'
  }
};

/**
 * Health journey trace context - child of API Gateway context
 * Represents a span in the health-service handling the request
 */
export const healthServiceContext: MockTraceContext = {
  traceId: apiGatewayRootContext.traceId, // Same trace ID as parent
  spanId: 'b7ad6b7169203331',
  parentSpanId: apiGatewayRootContext.spanId, // Points to API Gateway span
  traceFlags: '01',
  isRemote: true, // Received from API Gateway
  serviceName: 'health-service',
  operationName: 'getHealthMetrics',
  startTimeMs: apiGatewayRootContext.startTimeMs + 50, // Started 50ms after API Gateway
  endTimeMs: apiGatewayRootContext.startTimeMs + 300, // Ended 300ms after API Gateway started
  attributes: {
    'journey.type': 'health',
    'journey.operation': 'metrics.retrieve',
    'db.system': 'postgresql',
    'db.name': 'health_metrics',
    'db.operation': 'SELECT'
  }
};

/**
 * Database operation trace context - child of Health Service context
 * Represents a database query span within the health service
 */
export const healthDbContext: MockTraceContext = {
  traceId: apiGatewayRootContext.traceId, // Same trace ID as parent
  spanId: '93564f51e1abe1c2',
  parentSpanId: healthServiceContext.spanId, // Points to Health Service span
  traceFlags: '01',
  isRemote: false,
  serviceName: 'health-service',
  operationName: 'db.query',
  startTimeMs: healthServiceContext.startTimeMs + 20, // Started 20ms after Health Service
  endTimeMs: healthServiceContext.startTimeMs + 120, // Took 100ms to complete
  attributes: {
    'db.system': 'postgresql',
    'db.statement': 'SELECT * FROM health_metrics WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 10',
    'db.operation': 'SELECT',
    'net.peer.name': 'health-db.austa.internal',
    'net.peer.port': 5432
  }
};

/**
 * Gamification event trace context - child of Health Service context
 * Represents an event sent to the gamification engine
 */
export const gamificationEventContext: MockTraceContext = {
  traceId: apiGatewayRootContext.traceId, // Same trace ID as parent
  spanId: 'a9f5b8c3d7e1246f',
  parentSpanId: healthServiceContext.spanId, // Points to Health Service span
  traceFlags: '01',
  isRemote: false,
  serviceName: 'health-service',
  operationName: 'sendGamificationEvent',
  startTimeMs: healthServiceContext.startTimeMs + 150, // Started 150ms after Health Service
  endTimeMs: healthServiceContext.startTimeMs + 180, // Took 30ms to complete
  attributes: {
    'messaging.system': 'kafka',
    'messaging.destination': 'health-events',
    'messaging.destination_kind': 'topic',
    'messaging.operation': 'publish',
    'event.name': 'HealthMetricRecorded',
    'event.domain': 'health'
  }
};

/**
 * Gamification engine trace context - child of the event context
 * Represents the gamification engine processing the event
 */
export const gamificationEngineContext: MockTraceContext = {
  traceId: apiGatewayRootContext.traceId, // Same trace ID as parent
  spanId: 'c7d8e9f1a2b3c4d5',
  parentSpanId: gamificationEventContext.spanId, // Points to Gamification Event span
  traceFlags: '01',
  isRemote: true, // Received from Kafka
  serviceName: 'gamification-engine',
  operationName: 'processHealthEvent',
  startTimeMs: gamificationEventContext.endTimeMs + 50, // Started 50ms after event was sent
  endTimeMs: gamificationEventContext.endTimeMs + 150, // Took 100ms to complete
  attributes: {
    'messaging.system': 'kafka',
    'messaging.operation': 'process',
    'messaging.destination': 'health-events',
    'event.name': 'HealthMetricRecorded',
    'achievement.eligible': true,
    'achievement.id': 'daily-steps-goal'
  }
};

/**
 * Notification service trace context - child of gamification engine context
 * Represents sending a notification about an achievement
 */
export const notificationServiceContext: MockTraceContext = {
  traceId: apiGatewayRootContext.traceId, // Same trace ID as parent
  spanId: 'e1f2g3h4i5j6k7l8',
  parentSpanId: gamificationEngineContext.spanId, // Points to Gamification Engine span
  traceFlags: '01',
  isRemote: true, // Received from Gamification Engine
  serviceName: 'notification-service',
  operationName: 'sendAchievementNotification',
  startTimeMs: gamificationEngineContext.endTimeMs + 20, // Started 20ms after gamification processing
  endTimeMs: gamificationEngineContext.endTimeMs + 120, // Took 100ms to complete
  attributes: {
    'notification.type': 'achievement',
    'notification.channel': 'push',
    'notification.priority': 'normal',
    'achievement.id': 'daily-steps-goal',
    'achievement.name': 'Step Master',
    'user.id': 'user-123'
  }
};

/**
 * Care journey trace context - root of a different trace
 * Represents a telemedicine appointment booking
 */
export const careServiceRootContext: MockTraceContext = {
  traceId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  spanId: 'a1b2c3d4e5f6g7h8',
  traceFlags: '01',
  isRemote: false,
  serviceName: 'care-service',
  operationName: 'bookTelemedicineAppointment',
  startTimeMs: Date.now() - 1000, // Started 1 second ago
  endTimeMs: Date.now() - 200, // Ended 200ms ago
  attributes: {
    'journey.type': 'care',
    'journey.operation': 'appointment.create',
    'appointment.type': 'telemedicine',
    'provider.specialty': 'cardiology',
    'user.id': 'user-456'
  }
};

/**
 * Plan journey trace context - root of a different trace
 * Represents checking insurance coverage for a procedure
 */
export const planServiceRootContext: MockTraceContext = {
  traceId: 'q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6',
  spanId: 'q1w2e3r4t5y6u7i8',
  traceFlags: '01',
  isRemote: false,
  serviceName: 'plan-service',
  operationName: 'checkProcedureCoverage',
  startTimeMs: Date.now() - 1500, // Started 1.5 seconds ago
  endTimeMs: Date.now() - 1300, // Ended 1.3 seconds ago
  attributes: {
    'journey.type': 'plan',
    'journey.operation': 'coverage.check',
    'procedure.code': 'CPT-12345',
    'procedure.name': 'Cardiac Stress Test',
    'plan.id': 'premium-family-2023',
    'user.id': 'user-789'
  }
};

/**
 * Cross-journey trace context - represents a flow that spans multiple journeys
 * Starting with a care appointment that leads to checking plan coverage
 */
export const crossJourneyRootContext: MockTraceContext = {
  traceId: 'x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6',
  spanId: 'x1y2z3a4b5c6d7e8',
  traceFlags: '01',
  isRemote: false,
  serviceName: 'api-gateway',
  operationName: 'HTTP POST /api/v1/care/appointments',
  startTimeMs: Date.now() - 2000, // Started 2 seconds ago
  attributes: {
    'http.method': 'POST',
    'http.url': '/api/v1/care/appointments',
    'http.status_code': 200,
    'user.id': 'user-101'
  }
};

/**
 * Care service span in cross-journey trace
 */
export const crossJourneyCareContext: MockTraceContext = {
  traceId: crossJourneyRootContext.traceId,
  spanId: 'c1a2r3e4s5p6a7n8',
  parentSpanId: crossJourneyRootContext.spanId,
  traceFlags: '01',
  isRemote: true,
  serviceName: 'care-service',
  operationName: 'createAppointment',
  startTimeMs: crossJourneyRootContext.startTimeMs + 50,
  endTimeMs: crossJourneyRootContext.startTimeMs + 500,
  attributes: {
    'journey.type': 'care',
    'journey.operation': 'appointment.create',
    'appointment.type': 'specialist',
    'appointment.procedure': 'CPT-54321',
    'user.id': 'user-101'
  }
};

/**
 * Plan service span in cross-journey trace - checking coverage for the appointment
 */
export const crossJourneyPlanContext: MockTraceContext = {
  traceId: crossJourneyRootContext.traceId,
  spanId: 'p1l2a3n4s5p6a7n8',
  parentSpanId: crossJourneyCareContext.spanId,
  traceFlags: '01',
  isRemote: true,
  serviceName: 'plan-service',
  operationName: 'checkProcedureCoverage',
  startTimeMs: crossJourneyCareContext.startTimeMs + 200,
  endTimeMs: crossJourneyCareContext.startTimeMs + 400,
  attributes: {
    'journey.type': 'plan',
    'journey.operation': 'coverage.check',
    'procedure.code': 'CPT-54321',
    'procedure.name': 'Specialist Consultation',
    'coverage.percentage': 80,
    'user.id': 'user-101'
  }
};

/**
 * Error trace context - represents a trace with an error
 */
export const errorTraceContext: MockTraceContext = {
  traceId: 'e1r2r3o4r5t6r7a8c9e0a1b2c3d4e5f6',
  spanId: 'e1r2r3o4r5s6p7a8',
  traceFlags: '01',
  isRemote: false,
  serviceName: 'health-service',
  operationName: 'syncWearableData',
  startTimeMs: Date.now() - 300,
  endTimeMs: Date.now() - 200,
  attributes: {
    'journey.type': 'health',
    'journey.operation': 'wearable.sync',
    'error': true,
    'error.type': 'ConnectionError',
    'error.message': 'Failed to connect to wearable device API',
    'wearable.type': 'fitbit',
    'user.id': 'user-202'
  }
};

/**
 * Collection of related trace contexts that form a complete request flow
 */
export const healthMetricsFlow = {
  apiGateway: apiGatewayRootContext,
  healthService: healthServiceContext,
  database: healthDbContext,
  gamificationEvent: gamificationEventContext,
  gamificationEngine: gamificationEngineContext,
  notification: notificationServiceContext
};

/**
 * Collection of trace contexts for cross-journey flow
 */
export const appointmentWithCoverageFlow = {
  apiGateway: crossJourneyRootContext,
  careService: crossJourneyCareContext,
  planService: crossJourneyPlanContext
};

/**
 * Collection of all trace contexts by journey type
 */
export const traceContextsByJourney = {
  health: [healthServiceContext, healthDbContext, gamificationEventContext, errorTraceContext],
  care: [careServiceRootContext, crossJourneyCareContext],
  plan: [planServiceRootContext, crossJourneyPlanContext],
  common: [apiGatewayRootContext, gamificationEngineContext, notificationServiceContext, crossJourneyRootContext]
};