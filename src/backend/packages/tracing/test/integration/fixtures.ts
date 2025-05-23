import { SpanStatusCode, SpanKind, Context, Span, Tracer } from '@opentelemetry/api';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingOptions } from '../../src/interfaces/tracing-options.interface';
import { SpanOptions } from '../../src/interfaces/span-options.interface';
import { TraceContext } from '../../src/interfaces/trace-context.interface';
import { JourneyHealthContext, JourneyCareContext, JourneyPlanContext } from '../../src/interfaces/journey-context.interface';

/**
 * Mock trace ID for testing
 */
export const MOCK_TRACE_ID = '0af7651916cd43dd8448eb211c80319c';

/**
 * Mock span ID for testing
 */
export const MOCK_SPAN_ID = 'b7ad6b7169203331';

/**
 * Mock parent span ID for testing parent-child relationships
 */
export const MOCK_PARENT_SPAN_ID = 'c8be5de1a2104222';

/**
 * Mock correlation ID for connecting logs, traces, and metrics
 */
export const MOCK_CORRELATION_ID = 'corr-1234-5678-9abc-def0';

/**
 * Mock user ID for testing user-specific traces
 */
export const MOCK_USER_ID = 'user-1234-5678-9abc-def0';

/**
 * Mock request ID for testing HTTP request traces
 */
export const MOCK_REQUEST_ID = 'req-1234-5678-9abc-def0';

/**
 * Mock service name for testing service-specific traces
 */
export const MOCK_SERVICE_NAME = 'test-service';

/**
 * Mock span name for testing span creation
 */
export const MOCK_SPAN_NAME = 'test-operation';

/**
 * Creates a mock span for testing
 * @param name The name of the span
 * @param kind The kind of span (default: SpanKind.INTERNAL)
 * @returns A mock span object
 */
export const createMockSpan = (name: string = MOCK_SPAN_NAME, kind: SpanKind = SpanKind.INTERNAL): Span => {
  return {
    name,
    spanContext: () => ({
      traceId: MOCK_TRACE_ID,
      spanId: MOCK_SPAN_ID,
      traceFlags: 1,
      isRemote: false,
    }),
    setAttribute: jest.fn().mockReturnThis(),
    setAttributes: jest.fn().mockReturnThis(),
    addEvent: jest.fn().mockReturnThis(),
    setStatus: jest.fn().mockReturnThis(),
    updateName: jest.fn().mockReturnThis(),
    end: jest.fn(),
    isRecording: jest.fn().mockReturnValue(true),
    recordException: jest.fn().mockReturnThis(),
  } as unknown as Span;
};

/**
 * Creates a mock parent span for testing parent-child relationships
 * @param name The name of the parent span
 * @returns A mock parent span object
 */
export const createMockParentSpan = (name: string = 'parent-operation'): Span => {
  const span = createMockSpan(name);
  // Override the spanContext to use the parent span ID
  (span.spanContext as jest.Mock) = jest.fn().mockReturnValue({
    traceId: MOCK_TRACE_ID,
    spanId: MOCK_PARENT_SPAN_ID,
    traceFlags: 1,
    isRemote: false,
  });
  return span;
};

/**
 * Creates a mock tracer for testing
 * @returns A mock tracer object
 */
export const createMockTracer = (): Tracer => {
  return {
    startSpan: jest.fn().mockImplementation((name, options) => createMockSpan(name)),
    startActiveSpan: jest.fn().mockImplementation((name, options, context, fn) => {
      const span = createMockSpan(name);
      try {
        return fn(span);
      } finally {
        span.end();
      }
    }),
  } as unknown as Tracer;
};

/**
 * Creates a mock context for testing
 * @param spanId Optional span ID to include in the context
 * @returns A mock context object
 */
export const createMockContext = (spanId: string = MOCK_SPAN_ID): Context => {
  return {} as Context;
};

/**
 * Creates a mock trace context for testing context propagation
 * @param traceId Optional trace ID to include in the context
 * @param spanId Optional span ID to include in the context
 * @returns A mock trace context object
 */
export const createMockTraceContext = (traceId: string = MOCK_TRACE_ID, spanId: string = MOCK_SPAN_ID): TraceContext => {
  return {
    traceId,
    spanId,
    traceFlags: 1,
    isRemote: false,
    extract: jest.fn(),
    inject: jest.fn(),
    serialize: jest.fn().mockReturnValue(JSON.stringify({ traceId, spanId, traceFlags: 1 })),
    deserialize: jest.fn(),
  };
};

/**
 * Creates mock HTTP headers with trace context for testing context propagation
 * @param traceId Optional trace ID to include in the headers
 * @param spanId Optional span ID to include in the headers
 * @returns Mock HTTP headers with trace context
 */
export const createMockHttpHeadersWithTraceContext = (traceId: string = MOCK_TRACE_ID, spanId: string = MOCK_SPAN_ID): Record<string, string> => {
  return {
    'traceparent': `00-${traceId}-${spanId}-01`,
    'x-correlation-id': MOCK_CORRELATION_ID,
    'x-request-id': MOCK_REQUEST_ID,
  };
};

/**
 * Creates a mock Kafka message with trace context for testing context propagation
 * @param traceId Optional trace ID to include in the message
 * @param spanId Optional span ID to include in the message
 * @returns Mock Kafka message with trace context
 */
export const createMockKafkaMessageWithTraceContext = (traceId: string = MOCK_TRACE_ID, spanId: string = MOCK_SPAN_ID): Record<string, any> => {
  return {
    headers: {
      'traceparent': Buffer.from(`00-${traceId}-${spanId}-01`),
      'x-correlation-id': Buffer.from(MOCK_CORRELATION_ID),
      'x-request-id': Buffer.from(MOCK_REQUEST_ID),
    },
    key: 'test-key',
    value: Buffer.from(JSON.stringify({ eventType: 'test-event', payload: { test: 'data' } })),
    topic: 'test-topic',
    partition: 0,
    timestamp: Date.now(),
    offset: '0',
  };
};

/**
 * Creates mock span options for testing span creation
 * @param name Optional name for the span
 * @param kind Optional kind for the span
 * @returns Mock span options
 */
export const createMockSpanOptions = (name: string = MOCK_SPAN_NAME, kind: SpanKind = SpanKind.INTERNAL): SpanOptions => {
  return {
    name,
    kind,
    attributes: {
      'service.name': MOCK_SERVICE_NAME,
      'user.id': MOCK_USER_ID,
      'request.id': MOCK_REQUEST_ID,
      'correlation.id': MOCK_CORRELATION_ID,
    },
  };
};

/**
 * Creates mock tracing options for testing tracing configuration
 * @param serviceName Optional service name for the tracing configuration
 * @returns Mock tracing options
 */
export const createMockTracingOptions = (serviceName: string = MOCK_SERVICE_NAME): TracingOptions => {
  return {
    serviceName,
    enabled: true,
    exporterType: 'console',
    samplingRatio: 1.0,
    logSpans: true,
  };
};

/**
 * Creates a mock config service for testing
 * @param serviceName Optional service name to include in the configuration
 * @returns A mock config service
 */
export const createMockConfigService = (serviceName: string = MOCK_SERVICE_NAME): ConfigService => {
  return {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'service.name') {
        return serviceName;
      }
      if (key === 'tracing.enabled') {
        return true;
      }
      if (key === 'tracing.exporterType') {
        return 'console';
      }
      if (key === 'tracing.samplingRatio') {
        return 1.0;
      }
      if (key === 'tracing.logSpans') {
        return true;
      }
      return defaultValue;
    }),
  } as unknown as ConfigService;
};

/**
 * Creates a mock logger service for testing
 * @returns A mock logger service
 */
export const createMockLoggerService = (): LoggerService => {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as LoggerService;
};

/**
 * Creates a mock error for testing error handling
 * @param message Optional error message
 * @param code Optional error code
 * @returns A mock error object
 */
export const createMockError = (message: string = 'Test error', code: string = 'TEST_ERROR'): Error => {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).statusCode = 500;
  return error;
};

/**
 * Creates a mock database error for testing error handling
 * @param message Optional error message
 * @returns A mock database error object
 */
export const createMockDatabaseError = (message: string = 'Database connection error'): Error => {
  const error = createMockError(message, 'DB_ERROR');
  (error as any).sqlState = '08006';
  (error as any).table = 'users';
  return error;
};

/**
 * Creates a mock HTTP error for testing error handling
 * @param message Optional error message
 * @param statusCode Optional HTTP status code
 * @returns A mock HTTP error object
 */
export const createMockHttpError = (message: string = 'HTTP request failed', statusCode: number = 500): Error => {
  const error = createMockError(message, 'HTTP_ERROR');
  (error as any).statusCode = statusCode;
  (error as any).response = {
    status: statusCode,
    data: { message },
  };
  return error;
};

/**
 * Creates a mock validation error for testing error handling
 * @param message Optional error message
 * @param field Optional field name that failed validation
 * @returns A mock validation error object
 */
export const createMockValidationError = (message: string = 'Validation failed', field: string = 'email'): Error => {
  const error = createMockError(message, 'VALIDATION_ERROR');
  (error as any).statusCode = 400;
  (error as any).errors = [{
    field,
    message: `${field} ${message.toLowerCase()}`,
  }];
  return error;
};

/**
 * Creates a mock health journey context for testing health journey spans
 * @param userId Optional user ID for the context
 * @returns A mock health journey context
 */
export const createMockHealthJourneyContext = (userId: string = MOCK_USER_ID): JourneyHealthContext => {
  return {
    userId,
    journeyType: 'health',
    metricType: 'blood_pressure',
    deviceId: 'device-1234',
    goalId: 'goal-5678',
    insightId: 'insight-9abc',
  };
};

/**
 * Creates a mock care journey context for testing care journey spans
 * @param userId Optional user ID for the context
 * @returns A mock care journey context
 */
export const createMockCareJourneyContext = (userId: string = MOCK_USER_ID): JourneyCareContext => {
  return {
    userId,
    journeyType: 'care',
    appointmentId: 'appointment-1234',
    providerId: 'provider-5678',
    medicationId: 'medication-9abc',
    telemedicineSessionId: 'telemedicine-def0',
  };
};

/**
 * Creates a mock plan journey context for testing plan journey spans
 * @param userId Optional user ID for the context
 * @returns A mock plan journey context
 */
export const createMockPlanJourneyContext = (userId: string = MOCK_USER_ID): JourneyPlanContext => {
  return {
    userId,
    journeyType: 'plan',
    planId: 'plan-1234',
    benefitId: 'benefit-5678',
    claimId: 'claim-9abc',
    documentId: 'document-def0',
  };
};

/**
 * Creates a mock span with health journey attributes for testing
 * @param name Optional name for the span
 * @returns A mock span with health journey attributes
 */
export const createMockHealthJourneySpan = (name: string = 'health-operation'): Span => {
  const span = createMockSpan(name);
  const healthContext = createMockHealthJourneyContext();
  
  // Add health journey specific attributes
  span.setAttribute('journey.type', 'health');
  span.setAttribute('journey.health.metric_type', healthContext.metricType);
  span.setAttribute('journey.health.device_id', healthContext.deviceId);
  span.setAttribute('journey.health.goal_id', healthContext.goalId);
  span.setAttribute('journey.health.insight_id', healthContext.insightId);
  
  return span;
};

/**
 * Creates a mock span with care journey attributes for testing
 * @param name Optional name for the span
 * @returns A mock span with care journey attributes
 */
export const createMockCareJourneySpan = (name: string = 'care-operation'): Span => {
  const span = createMockSpan(name);
  const careContext = createMockCareJourneyContext();
  
  // Add care journey specific attributes
  span.setAttribute('journey.type', 'care');
  span.setAttribute('journey.care.appointment_id', careContext.appointmentId);
  span.setAttribute('journey.care.provider_id', careContext.providerId);
  span.setAttribute('journey.care.medication_id', careContext.medicationId);
  span.setAttribute('journey.care.telemedicine_session_id', careContext.telemedicineSessionId);
  
  return span;
};

/**
 * Creates a mock span with plan journey attributes for testing
 * @param name Optional name for the span
 * @returns A mock span with plan journey attributes
 */
export const createMockPlanJourneySpan = (name: string = 'plan-operation'): Span => {
  const span = createMockSpan(name);
  const planContext = createMockPlanJourneyContext();
  
  // Add plan journey specific attributes
  span.setAttribute('journey.type', 'plan');
  span.setAttribute('journey.plan.plan_id', planContext.planId);
  span.setAttribute('journey.plan.benefit_id', planContext.benefitId);
  span.setAttribute('journey.plan.claim_id', planContext.claimId);
  span.setAttribute('journey.plan.document_id', planContext.documentId);
  
  return span;
};

/**
 * Creates a mock span with error attributes for testing error handling
 * @param name Optional name for the span
 * @param error Optional error to include in the span
 * @returns A mock span with error attributes
 */
export const createMockErrorSpan = (name: string = 'error-operation', error: Error = createMockError()): Span => {
  const span = createMockSpan(name);
  
  // Add error attributes
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.setAttribute('error', true);
  span.setAttribute('error.type', error.constructor.name);
  span.setAttribute('error.message', error.message);
  span.setAttribute('error.stack', error.stack || '');
  
  if ((error as any).code) {
    span.setAttribute('error.code', (error as any).code);
  }
  
  if ((error as any).statusCode) {
    span.setAttribute('error.status_code', (error as any).statusCode);
  }
  
  span.recordException(error);
  
  return span;
};

/**
 * Creates a mock span with database operation attributes for testing
 * @param name Optional name for the span
 * @param operation Optional database operation type
 * @param table Optional database table name
 * @returns A mock span with database operation attributes
 */
export const createMockDatabaseSpan = (name: string = 'db-operation', operation: string = 'query', table: string = 'users'): Span => {
  const span = createMockSpan(name);
  
  // Add database attributes
  span.setAttribute('db.system', 'postgresql');
  span.setAttribute('db.operation', operation);
  span.setAttribute('db.name', 'austa_db');
  span.setAttribute('db.table', table);
  span.setAttribute('db.statement', `SELECT * FROM ${table} WHERE id = $1`);
  span.setAttribute('db.user', 'austa_user');
  
  return span;
};

/**
 * Creates a mock span with HTTP request attributes for testing
 * @param name Optional name for the span
 * @param method Optional HTTP method
 * @param url Optional HTTP URL
 * @param statusCode Optional HTTP status code
 * @returns A mock span with HTTP request attributes
 */
export const createMockHttpSpan = (name: string = 'http-operation', method: string = 'GET', url: string = 'https://api.example.com/users', statusCode: number = 200): Span => {
  const span = createMockSpan(name);
  
  // Add HTTP attributes
  span.setAttribute('http.method', method);
  span.setAttribute('http.url', url);
  span.setAttribute('http.status_code', statusCode);
  span.setAttribute('http.request.headers.user_agent', 'AUSTA-SuperApp/1.0');
  span.setAttribute('http.response.headers.content_length', '1024');
  
  return span;
};

/**
 * Creates a mock span with Kafka message attributes for testing
 * @param name Optional name for the span
 * @param topic Optional Kafka topic
 * @param eventType Optional event type
 * @returns A mock span with Kafka message attributes
 */
export const createMockKafkaSpan = (name: string = 'kafka-operation', topic: string = 'user-events', eventType: string = 'user.created'): Span => {
  const span = createMockSpan(name);
  
  // Add Kafka attributes
  span.setAttribute('messaging.system', 'kafka');
  span.setAttribute('messaging.destination', topic);
  span.setAttribute('messaging.destination_kind', 'topic');
  span.setAttribute('messaging.operation', 'process');
  span.setAttribute('messaging.kafka.consumer_group', 'austa-consumer-group');
  span.setAttribute('messaging.kafka.client_id', 'austa-client');
  span.setAttribute('messaging.kafka.partition', 0);
  span.setAttribute('event.type', eventType);
  
  return span;
};

/**
 * Creates a mock span with gamification event attributes for testing
 * @param name Optional name for the span
 * @param achievementId Optional achievement ID
 * @param userId Optional user ID
 * @returns A mock span with gamification event attributes
 */
export const createMockGamificationSpan = (name: string = 'gamification-operation', achievementId: string = 'achievement-1234', userId: string = MOCK_USER_ID): Span => {
  const span = createMockSpan(name);
  
  // Add gamification attributes
  span.setAttribute('gamification.achievement_id', achievementId);
  span.setAttribute('gamification.user_id', userId);
  span.setAttribute('gamification.points', 100);
  span.setAttribute('gamification.level', 5);
  span.setAttribute('gamification.journey_type', 'health');
  span.setAttribute('gamification.event_type', 'achievement.unlocked');
  
  return span;
};