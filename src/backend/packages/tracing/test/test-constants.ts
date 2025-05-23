/**
 * Test Constants for Tracing Package
 * 
 * This file contains constants and fixtures used throughout the tracing package tests.
 * It provides sample span names, trace IDs, service names, attributes, and error cases
 * to ensure consistent test data across different test files.
 */

import { SpanStatusCode, TraceFlags } from '@opentelemetry/api';

// Basic tracing constants
export const TEST_TRACE_ID = '0af7651916cd43dd8448eb211c80319c';
export const TEST_SPAN_ID = 'b7ad6b7169203331';
export const TEST_PARENT_SPAN_ID = 'a7ad6b7169203332';
export const TEST_TRACE_FLAGS = TraceFlags.SAMPLED;

// Service names for different components
export const SERVICE_NAMES = {
  API_GATEWAY: 'austa-api-gateway',
  AUTH_SERVICE: 'austa-auth-service',
  HEALTH_SERVICE: 'austa-health-service',
  CARE_SERVICE: 'austa-care-service',
  PLAN_SERVICE: 'austa-plan-service',
  GAMIFICATION_ENGINE: 'austa-gamification-engine',
  NOTIFICATION_SERVICE: 'austa-notification-service',
};

// Common span names used across services
export const SPAN_NAMES = {
  // API Gateway spans
  HTTP_REQUEST: 'http.request',
  GRAPHQL_RESOLVE: 'graphql.resolve',
  AUTH_VALIDATE: 'auth.validate_token',
  
  // Database operations
  DB_QUERY: 'db.query',
  PRISMA_QUERY: 'prisma.query',
  TRANSACTION_BEGIN: 'db.transaction.begin',
  TRANSACTION_COMMIT: 'db.transaction.commit',
  TRANSACTION_ROLLBACK: 'db.transaction.rollback',
  
  // External service calls
  HTTP_CLIENT: 'http.client',
  KAFKA_PRODUCE: 'kafka.produce',
  KAFKA_CONSUME: 'kafka.consume',
  
  // Journey-specific operations
  HEALTH_METRIC_RECORD: 'health.metric.record',
  HEALTH_GOAL_UPDATE: 'health.goal.update',
  CARE_APPOINTMENT_SCHEDULE: 'care.appointment.schedule',
  CARE_MEDICATION_REMINDER: 'care.medication.reminder',
  PLAN_CLAIM_SUBMIT: 'plan.claim.submit',
  PLAN_BENEFIT_CHECK: 'plan.benefit.check',
  
  // Gamification spans
  GAMIFICATION_EVENT_PROCESS: 'gamification.event.process',
  ACHIEVEMENT_UNLOCK: 'gamification.achievement.unlock',
  REWARD_GRANT: 'gamification.reward.grant',
};

// Sample trace context objects for different scenarios
export const TRACE_CONTEXTS = {
  // Basic trace context
  BASIC: {
    traceId: TEST_TRACE_ID,
    spanId: TEST_SPAN_ID,
    traceFlags: TEST_TRACE_FLAGS,
  },
  
  // Trace context with parent span
  WITH_PARENT: {
    traceId: TEST_TRACE_ID,
    spanId: TEST_SPAN_ID,
    traceFlags: TEST_TRACE_FLAGS,
    parentSpanId: TEST_PARENT_SPAN_ID,
  },
  
  // Journey-specific trace contexts
  HEALTH_JOURNEY: {
    traceId: '1af7651916cd43dd8448eb211c80319c',
    spanId: 'c7ad6b7169203331',
    traceFlags: TEST_TRACE_FLAGS,
    attributes: {
      'journey.type': 'health',
      'journey.operation': 'metric.record',
    },
  },
  
  CARE_JOURNEY: {
    traceId: '2af7651916cd43dd8448eb211c80319c',
    spanId: 'd7ad6b7169203331',
    traceFlags: TEST_TRACE_FLAGS,
    attributes: {
      'journey.type': 'care',
      'journey.operation': 'appointment.schedule',
    },
  },
  
  PLAN_JOURNEY: {
    traceId: '3af7651916cd43dd8448eb211c80319c',
    spanId: 'e7ad6b7169203331',
    traceFlags: TEST_TRACE_FLAGS,
    attributes: {
      'journey.type': 'plan',
      'journey.operation': 'claim.submit',
    },
  },
};

// Sample span attributes for different journeys
export const SPAN_ATTRIBUTES = {
  // Common attributes
  COMMON: {
    'service.name': SERVICE_NAMES.API_GATEWAY,
    'service.version': '1.0.0',
    'deployment.environment': 'test',
  },
  
  // Health journey attributes
  HEALTH: {
    'journey.type': 'health',
    'user.id': 'test-user-123',
    'metric.type': 'blood_pressure',
    'metric.value': '120/80',
    'metric.unit': 'mmHg',
    'device.id': 'test-device-456',
    'device.type': 'smartwatch',
  },
  
  // Care journey attributes
  CARE: {
    'journey.type': 'care',
    'user.id': 'test-user-123',
    'provider.id': 'test-provider-789',
    'appointment.id': 'test-appointment-101',
    'appointment.type': 'telemedicine',
    'appointment.status': 'scheduled',
  },
  
  // Plan journey attributes
  PLAN: {
    'journey.type': 'plan',
    'user.id': 'test-user-123',
    'plan.id': 'test-plan-202',
    'claim.id': 'test-claim-303',
    'claim.type': 'medical',
    'claim.status': 'submitted',
    'claim.amount': '250.00',
  },
  
  // Gamification attributes
  GAMIFICATION: {
    'journey.type': 'gamification',
    'user.id': 'test-user-123',
    'event.type': 'achievement.unlock',
    'achievement.id': 'test-achievement-404',
    'achievement.name': 'First Steps',
    'points.earned': '50',
  },
};

// Sample error scenarios with expected trace annotations
export const ERROR_SCENARIOS = {
  // Database connection error
  DB_CONNECTION_ERROR: {
    error: new Error('Failed to connect to database'),
    spanName: SPAN_NAMES.DB_QUERY,
    expectedStatus: { code: SpanStatusCode.ERROR },
    expectedAttributes: {
      'error.type': 'DatabaseConnectionError',
      'error.message': 'Failed to connect to database',
    },
  },
  
  // Authentication error
  AUTH_ERROR: {
    error: new Error('Invalid authentication token'),
    spanName: SPAN_NAMES.AUTH_VALIDATE,
    expectedStatus: { code: SpanStatusCode.ERROR },
    expectedAttributes: {
      'error.type': 'AuthenticationError',
      'error.message': 'Invalid authentication token',
    },
  },
  
  // Health journey error
  HEALTH_METRIC_ERROR: {
    error: new Error('Invalid health metric value'),
    spanName: SPAN_NAMES.HEALTH_METRIC_RECORD,
    expectedStatus: { code: SpanStatusCode.ERROR },
    expectedAttributes: {
      'error.type': 'ValidationError',
      'error.message': 'Invalid health metric value',
      'journey.type': 'health',
    },
  },
  
  // Care journey error
  CARE_APPOINTMENT_ERROR: {
    error: new Error('Provider not available for appointment'),
    spanName: SPAN_NAMES.CARE_APPOINTMENT_SCHEDULE,
    expectedStatus: { code: SpanStatusCode.ERROR },
    expectedAttributes: {
      'error.type': 'ResourceUnavailableError',
      'error.message': 'Provider not available for appointment',
      'journey.type': 'care',
    },
  },
  
  // Plan journey error
  PLAN_CLAIM_ERROR: {
    error: new Error('Claim amount exceeds coverage limit'),
    spanName: SPAN_NAMES.PLAN_CLAIM_SUBMIT,
    expectedStatus: { code: SpanStatusCode.ERROR },
    expectedAttributes: {
      'error.type': 'ValidationError',
      'error.message': 'Claim amount exceeds coverage limit',
      'journey.type': 'plan',
    },
  },
};

// Mock trace propagation headers for cross-service testing
export const TRACE_HEADERS = {
  // Standard W3C Trace Context headers
  W3C: {
    'traceparent': `00-${TEST_TRACE_ID}-${TEST_SPAN_ID}-01`,
    'tracestate': 'austa=service:api-gateway',
  },
  
  // Health journey headers
  HEALTH: {
    'traceparent': `00-${TRACE_CONTEXTS.HEALTH_JOURNEY.traceId}-${TRACE_CONTEXTS.HEALTH_JOURNEY.spanId}-01`,
    'tracestate': 'austa=journey:health,service:health-service',
  },
  
  // Care journey headers
  CARE: {
    'traceparent': `00-${TRACE_CONTEXTS.CARE_JOURNEY.traceId}-${TRACE_CONTEXTS.CARE_JOURNEY.spanId}-01`,
    'tracestate': 'austa=journey:care,service:care-service',
  },
  
  // Plan journey headers
  PLAN: {
    'traceparent': `00-${TRACE_CONTEXTS.PLAN_JOURNEY.traceId}-${TRACE_CONTEXTS.PLAN_JOURNEY.spanId}-01`,
    'tracestate': 'austa=journey:plan,service:plan-service',
  },
};

// Sample span creation parameters for testing
export const SPAN_CREATION_PARAMS = {
  // Basic span
  BASIC: {
    name: SPAN_NAMES.HTTP_REQUEST,
    attributes: SPAN_ATTRIBUTES.COMMON,
  },
  
  // Health journey span
  HEALTH: {
    name: SPAN_NAMES.HEALTH_METRIC_RECORD,
    attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.HEALTH },
  },
  
  // Care journey span
  CARE: {
    name: SPAN_NAMES.CARE_APPOINTMENT_SCHEDULE,
    attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.CARE },
  },
  
  // Plan journey span
  PLAN: {
    name: SPAN_NAMES.PLAN_CLAIM_SUBMIT,
    attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.PLAN },
  },
  
  // Gamification span
  GAMIFICATION: {
    name: SPAN_NAMES.ACHIEVEMENT_UNLOCK,
    attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.GAMIFICATION },
  },
};

// Mock span factory functions for testing
export const createMockSpan = (params = SPAN_CREATION_PARAMS.BASIC) => ({
  name: params.name,
  attributes: params.attributes || {},
  status: { code: SpanStatusCode.UNSET },
  isRecording: jest.fn().mockReturnValue(true),
  setStatus: jest.fn(),
  setAttribute: jest.fn(),
  setAttributes: jest.fn(),
  recordException: jest.fn(),
  end: jest.fn(),
});

// Mock tracer factory for testing
export const createMockTracer = () => ({
  startSpan: jest.fn().mockImplementation((name) => createMockSpan({ name, attributes: {} })),
  startActiveSpan: jest.fn(),
});