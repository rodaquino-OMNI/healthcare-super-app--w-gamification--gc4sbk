/**
 * Test constants for the tracing package
 * 
 * This file contains constants and fixtures used throughout the tracing package tests,
 * including sample span names, trace IDs, service names, attributes, and error cases.
 * These constants ensure consistent test data across different test files and allow
 * tests to share important reference values.
 */

import { SpanStatusCode } from '@opentelemetry/api';

/**
 * Sample service names for testing
 */
export const TEST_SERVICE_NAMES = {
  API_GATEWAY: 'austa-api-gateway',
  AUTH_SERVICE: 'austa-auth-service',
  HEALTH_SERVICE: 'austa-health-service',
  CARE_SERVICE: 'austa-care-service',
  PLAN_SERVICE: 'austa-plan-service',
  GAMIFICATION_ENGINE: 'austa-gamification-engine',
  NOTIFICATION_SERVICE: 'austa-notification-service',
};

/**
 * Sample span names for different operations
 */
export const TEST_SPAN_NAMES = {
  // Common operations
  HTTP_REQUEST: 'http.request',
  DATABASE_QUERY: 'db.query',
  KAFKA_PRODUCE: 'kafka.produce',
  KAFKA_CONSUME: 'kafka.consume',
  REDIS_OPERATION: 'redis.operation',
  
  // Health journey operations
  HEALTH_METRIC_RECORD: 'health.metric.record',
  HEALTH_GOAL_CREATE: 'health.goal.create',
  HEALTH_GOAL_UPDATE: 'health.goal.update',
  HEALTH_DEVICE_CONNECT: 'health.device.connect',
  HEALTH_DEVICE_SYNC: 'health.device.sync',
  
  // Care journey operations
  CARE_APPOINTMENT_SCHEDULE: 'care.appointment.schedule',
  CARE_APPOINTMENT_CANCEL: 'care.appointment.cancel',
  CARE_MEDICATION_REMINDER: 'care.medication.reminder',
  CARE_TELEMEDICINE_SESSION: 'care.telemedicine.session',
  CARE_PROVIDER_SEARCH: 'care.provider.search',
  
  // Plan journey operations
  PLAN_BENEFIT_CHECK: 'plan.benefit.check',
  PLAN_CLAIM_SUBMIT: 'plan.claim.submit',
  PLAN_CLAIM_STATUS: 'plan.claim.status',
  PLAN_COVERAGE_VERIFY: 'plan.coverage.verify',
  PLAN_DOCUMENT_DOWNLOAD: 'plan.document.download',
  
  // Gamification operations
  GAMIFICATION_EVENT_PROCESS: 'gamification.event.process',
  GAMIFICATION_ACHIEVEMENT_UNLOCK: 'gamification.achievement.unlock',
  GAMIFICATION_REWARD_GRANT: 'gamification.reward.grant',
  GAMIFICATION_QUEST_PROGRESS: 'gamification.quest.progress',
  GAMIFICATION_QUEST_COMPLETE: 'gamification.quest.complete',
  
  // Authentication operations
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_TOKEN_VALIDATE: 'auth.token.validate',
  AUTH_TOKEN_REFRESH: 'auth.token.refresh',
  AUTH_PERMISSION_CHECK: 'auth.permission.check',
};

/**
 * Sample trace IDs for testing
 */
export const TEST_TRACE_IDS = {
  HEALTH_JOURNEY: '1234567890abcdef1234567890abcdef',
  CARE_JOURNEY: 'abcdef1234567890abcdef1234567890',
  PLAN_JOURNEY: '9876543210abcdef9876543210abcdef',
  CROSS_JOURNEY: 'fedcba0987654321fedcba0987654321',
  ERROR_CASE: 'ffffffffffffffffffffffffffffffff',
};

/**
 * Sample span IDs for testing
 */
export const TEST_SPAN_IDS = {
  PARENT_SPAN: '1234567890abcdef',
  CHILD_SPAN_1: 'abcdef1234567890',
  CHILD_SPAN_2: '9876543210abcdef',
  ERROR_SPAN: 'ffffffffffffffff',
};

/**
 * Sample trace context objects for different journey types
 */
export const TEST_TRACE_CONTEXTS = {
  HEALTH_JOURNEY: {
    traceId: TEST_TRACE_IDS.HEALTH_JOURNEY,
    spanId: TEST_SPAN_IDS.PARENT_SPAN,
    traceFlags: 1, // Sampled
    traceState: '',
  },
  CARE_JOURNEY: {
    traceId: TEST_TRACE_IDS.CARE_JOURNEY,
    spanId: TEST_SPAN_IDS.PARENT_SPAN,
    traceFlags: 1, // Sampled
    traceState: '',
  },
  PLAN_JOURNEY: {
    traceId: TEST_TRACE_IDS.PLAN_JOURNEY,
    spanId: TEST_SPAN_IDS.PARENT_SPAN,
    traceFlags: 1, // Sampled
    traceState: '',
  },
  CROSS_JOURNEY: {
    traceId: TEST_TRACE_IDS.CROSS_JOURNEY,
    spanId: TEST_SPAN_IDS.PARENT_SPAN,
    traceFlags: 1, // Sampled
    traceState: '',
  },
  ERROR_CASE: {
    traceId: TEST_TRACE_IDS.ERROR_CASE,
    spanId: TEST_SPAN_IDS.ERROR_SPAN,
    traceFlags: 1, // Sampled
    traceState: '',
  },
};

/**
 * Common span attributes for testing
 */
export const TEST_COMMON_ATTRIBUTES = {
  'service.name': TEST_SERVICE_NAMES.API_GATEWAY,
  'service.version': '1.0.0',
  'deployment.environment': 'test',
};

/**
 * Journey-specific span attributes for testing
 */
export const TEST_JOURNEY_ATTRIBUTES = {
  // Health journey attributes
  HEALTH: {
    'journey.type': 'health',
    'journey.name': 'Minha Saúde',
    'user.id': 'user-123',
    'metric.type': 'steps',
    'metric.value': '10000',
    'device.id': 'device-456',
    'device.type': 'fitbit',
    'goal.id': 'goal-789',
    'goal.type': 'daily_steps',
  },
  
  // Care journey attributes
  CARE: {
    'journey.type': 'care',
    'journey.name': 'Cuidar-me Agora',
    'user.id': 'user-456',
    'appointment.id': 'appointment-123',
    'provider.id': 'provider-456',
    'provider.specialty': 'cardiology',
    'medication.id': 'medication-789',
    'telemedicine.session.id': 'session-101',
  },
  
  // Plan journey attributes
  PLAN: {
    'journey.type': 'plan',
    'journey.name': 'Meu Plano & Benefícios',
    'user.id': 'user-789',
    'plan.id': 'plan-123',
    'benefit.id': 'benefit-456',
    'claim.id': 'claim-789',
    'document.id': 'document-101',
    'coverage.type': 'medical',
  },
  
  // Gamification attributes (cross-journey)
  GAMIFICATION: {
    'journey.type': 'cross-journey',
    'journey.name': 'Gamification',
    'user.id': 'user-123',
    'event.type': 'achievement_unlocked',
    'achievement.id': 'achievement-456',
    'reward.id': 'reward-789',
    'quest.id': 'quest-101',
    'points.earned': '100',
  },
};

/**
 * Sample error scenarios with expected trace annotations
 */
export const TEST_ERROR_SCENARIOS = {
  DATABASE_CONNECTION: {
    name: 'DatabaseConnectionError',
    message: 'Failed to connect to database',
    code: 'DB_CONNECTION_ERROR',
    expectedStatus: SpanStatusCode.ERROR,
    attributes: {
      'error.type': 'connection',
      'error.code': 'DB_CONNECTION_ERROR',
      'db.system': 'postgresql',
      'db.name': 'austa_health',
      'retry.attempted': 'true',
    },
  },
  AUTHENTICATION_FAILED: {
    name: 'AuthenticationError',
    message: 'Invalid credentials provided',
    code: 'AUTH_INVALID_CREDENTIALS',
    expectedStatus: SpanStatusCode.ERROR,
    attributes: {
      'error.type': 'authentication',
      'error.code': 'AUTH_INVALID_CREDENTIALS',
      'security.category': 'authentication',
      'user.id': 'anonymous',
    },
  },
  EXTERNAL_API_TIMEOUT: {
    name: 'ExternalApiTimeoutError',
    message: 'Request to external API timed out',
    code: 'API_TIMEOUT',
    expectedStatus: SpanStatusCode.ERROR,
    attributes: {
      'error.type': 'timeout',
      'error.code': 'API_TIMEOUT',
      'http.url': 'https://external-api.example.com/data',
      'http.method': 'GET',
      'http.status_code': '504',
    },
  },
  VALIDATION_ERROR: {
    name: 'ValidationError',
    message: 'Invalid input data provided',
    code: 'VALIDATION_ERROR',
    expectedStatus: SpanStatusCode.ERROR,
    attributes: {
      'error.type': 'validation',
      'error.code': 'VALIDATION_ERROR',
      'validation.field': 'email',
      'validation.constraint': 'format',
    },
  },
  JOURNEY_SPECIFIC_ERROR: {
    name: 'JourneyError',
    message: 'Failed to process journey-specific operation',
    code: 'JOURNEY_ERROR',
    expectedStatus: SpanStatusCode.ERROR,
    attributes: {
      'error.type': 'business_logic',
      'error.code': 'JOURNEY_ERROR',
      'journey.type': 'health',
      'operation.name': 'record_metric',
    },
  },
};

/**
 * Mock trace propagation headers for cross-service testing
 */
export const TEST_PROPAGATION_HEADERS = {
  // W3C Trace Context format
  W3C: {
    'traceparent': `00-${TEST_TRACE_IDS.HEALTH_JOURNEY}-${TEST_SPAN_IDS.PARENT_SPAN}-01`,
    'tracestate': 'austa=service:health-service',
  },
  // B3 Single Header format
  B3_SINGLE: {
    'b3': `${TEST_TRACE_IDS.CARE_JOURNEY}-${TEST_SPAN_IDS.PARENT_SPAN}-1`,
  },
  // B3 Multi Header format
  B3_MULTI: {
    'X-B3-TraceId': TEST_TRACE_IDS.PLAN_JOURNEY,
    'X-B3-SpanId': TEST_SPAN_IDS.PARENT_SPAN,
    'X-B3-Sampled': '1',
  },
};

/**
 * Sample span creation parameters for testing
 */
export const TEST_SPAN_CREATION = {
  HEALTH_METRIC: {
    name: TEST_SPAN_NAMES.HEALTH_METRIC_RECORD,
    attributes: {
      ...TEST_COMMON_ATTRIBUTES,
      ...TEST_JOURNEY_ATTRIBUTES.HEALTH,
      'operation.name': 'recordHealthMetric',
    },
  },
  CARE_APPOINTMENT: {
    name: TEST_SPAN_NAMES.CARE_APPOINTMENT_SCHEDULE,
    attributes: {
      ...TEST_COMMON_ATTRIBUTES,
      ...TEST_JOURNEY_ATTRIBUTES.CARE,
      'operation.name': 'scheduleAppointment',
    },
  },
  PLAN_CLAIM: {
    name: TEST_SPAN_NAMES.PLAN_CLAIM_SUBMIT,
    attributes: {
      ...TEST_COMMON_ATTRIBUTES,
      ...TEST_JOURNEY_ATTRIBUTES.PLAN,
      'operation.name': 'submitClaim',
    },
  },
  GAMIFICATION_EVENT: {
    name: TEST_SPAN_NAMES.GAMIFICATION_EVENT_PROCESS,
    attributes: {
      ...TEST_COMMON_ATTRIBUTES,
      ...TEST_JOURNEY_ATTRIBUTES.GAMIFICATION,
      'operation.name': 'processGamificationEvent',
    },
  },
};

/**
 * Mock trace context for testing context propagation
 */
export const TEST_CONTEXT_PROPAGATION = {
  // Parent context in service A
  SERVICE_A_PARENT: {
    traceId: TEST_TRACE_IDS.CROSS_JOURNEY,
    spanId: TEST_SPAN_IDS.PARENT_SPAN,
    service: TEST_SERVICE_NAMES.API_GATEWAY,
  },
  // Child context in service B
  SERVICE_B_CHILD: {
    traceId: TEST_TRACE_IDS.CROSS_JOURNEY, // Same trace ID
    spanId: TEST_SPAN_IDS.CHILD_SPAN_1, // Different span ID
    parentSpanId: TEST_SPAN_IDS.PARENT_SPAN, // Reference to parent
    service: TEST_SERVICE_NAMES.HEALTH_SERVICE,
  },
  // Child context in service C
  SERVICE_C_CHILD: {
    traceId: TEST_TRACE_IDS.CROSS_JOURNEY, // Same trace ID
    spanId: TEST_SPAN_IDS.CHILD_SPAN_2, // Different span ID
    parentSpanId: TEST_SPAN_IDS.PARENT_SPAN, // Reference to parent
    service: TEST_SERVICE_NAMES.GAMIFICATION_ENGINE,
  },
};