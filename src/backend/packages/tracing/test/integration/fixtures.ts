/**
 * @file Test fixtures for integration testing of the tracing package
 * 
 * This file provides test fixtures and mock data for integration testing of the tracing package.
 * It contains sample span definitions, trace context objects, and configuration options for
 * testing tracing functionality across different components.
 */

import { Context, SpanContext, SpanKind, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Sample trace IDs for testing
 */
export const TRACE_IDS = {
  VALID: '0af7651916cd43dd8448eb211c80319c',
  INVALID: '00000000000000000000000000000000',
  HEALTH_JOURNEY: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  CARE_JOURNEY: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
  PLAN_JOURNEY: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
};

/**
 * Sample span IDs for testing
 */
export const SPAN_IDS = {
  VALID: 'ff000000000000ff',
  INVALID: '0000000000000000',
  ROOT: 'abcdef0123456789',
  CHILD: '0123456789abcdef',
  HEALTH_JOURNEY: 'a1b2c3d4e5f6a1b2',
  CARE_JOURNEY: 'b2c3d4e5f6a1b2c3',
  PLAN_JOURNEY: 'c3d4e5f6a1b2c3d4',
};

/**
 * Sample span contexts for testing
 */
export const SPAN_CONTEXTS: Record<string, SpanContext> = {
  VALID: {
    traceId: TRACE_IDS.VALID,
    spanId: SPAN_IDS.VALID,
    traceFlags: 1, // Sampled
    isRemote: false,
    traceState: trace.createTraceState('austa=journey-context'),
  },
  INVALID: {
    traceId: TRACE_IDS.INVALID,
    spanId: SPAN_IDS.INVALID,
    traceFlags: 0, // Not sampled
    isRemote: false,
    traceState: undefined,
  },
  REMOTE: {
    traceId: TRACE_IDS.VALID,
    spanId: SPAN_IDS.VALID,
    traceFlags: 1, // Sampled
    isRemote: true,
    traceState: trace.createTraceState('austa=remote-context'),
  },
  HEALTH_JOURNEY: {
    traceId: TRACE_IDS.HEALTH_JOURNEY,
    spanId: SPAN_IDS.HEALTH_JOURNEY,
    traceFlags: 1, // Sampled
    isRemote: false,
    traceState: trace.createTraceState('austa=health-journey'),
  },
  CARE_JOURNEY: {
    traceId: TRACE_IDS.CARE_JOURNEY,
    spanId: SPAN_IDS.CARE_JOURNEY,
    traceFlags: 1, // Sampled
    isRemote: false,
    traceState: trace.createTraceState('austa=care-journey'),
  },
  PLAN_JOURNEY: {
    traceId: TRACE_IDS.PLAN_JOURNEY,
    spanId: SPAN_IDS.PLAN_JOURNEY,
    traceFlags: 1, // Sampled
    isRemote: false,
    traceState: trace.createTraceState('austa=plan-journey'),
  },
};

/**
 * Sample trace contexts for testing
 */
export const TRACE_CONTEXTS: Record<string, Context> = {
  // These will be initialized in the mockTraceContexts function
  ROOT: {} as Context,
  CHILD: {} as Context,
  HEALTH_JOURNEY: {} as Context,
  CARE_JOURNEY: {} as Context,
  PLAN_JOURNEY: {} as Context,
  REMOTE: {} as Context,
};

/**
 * Sample span attributes for testing
 */
export const SPAN_ATTRIBUTES = {
  COMMON: {
    'service.name': 'austa-service',
    'service.version': '1.0.0',
    'deployment.environment': 'test',
  },
  HTTP: {
    'http.method': 'GET',
    'http.url': 'https://api.austa.health/v1/users',
    'http.status_code': 200,
    'http.flavor': '2.0',
    'http.user_agent': 'AUSTA-SuperApp/1.0',
  },
  DATABASE: {
    'db.system': 'postgresql',
    'db.name': 'austa_db',
    'db.user': 'austa_user',
    'db.statement': 'SELECT * FROM users WHERE id = $1',
    'db.operation': 'SELECT',
  },
  HEALTH_JOURNEY: {
    'journey.type': 'health',
    'journey.operation': 'fetch_metrics',
    'health.metric_type': 'steps',
    'health.device_id': 'fitbit-123456',
    'health.user_id': 'user-789012',
  },
  CARE_JOURNEY: {
    'journey.type': 'care',
    'journey.operation': 'book_appointment',
    'care.provider_id': 'provider-123456',
    'care.appointment_type': 'consultation',
    'care.user_id': 'user-789012',
  },
  PLAN_JOURNEY: {
    'journey.type': 'plan',
    'journey.operation': 'submit_claim',
    'plan.claim_id': 'claim-123456',
    'plan.coverage_type': 'medical',
    'plan.user_id': 'user-789012',
  },
};

/**
 * Sample span events for testing
 */
export const SPAN_EVENTS = {
  COMMON: [
    { name: 'start_processing', attributes: { 'process.id': '12345' } },
    { name: 'end_processing', attributes: { 'process.duration_ms': 150 } },
  ],
  ERROR: [
    { name: 'error', attributes: { 'error.type': 'ConnectionError', 'error.message': 'Failed to connect to database' } },
  ],
  HEALTH_JOURNEY: [
    { name: 'health_metrics_requested', attributes: { 'health.metric_type': 'steps', 'health.time_range': 'daily' } },
    { name: 'device_connected', attributes: { 'health.device_id': 'fitbit-123456', 'health.connection_type': 'bluetooth' } },
  ],
  CARE_JOURNEY: [
    { name: 'appointment_requested', attributes: { 'care.provider_id': 'provider-123456', 'care.appointment_type': 'consultation' } },
    { name: 'slot_availability_checked', attributes: { 'care.available_slots': 5, 'care.date': '2023-06-15' } },
  ],
  PLAN_JOURNEY: [
    { name: 'claim_submitted', attributes: { 'plan.claim_id': 'claim-123456', 'plan.amount': 150.75 } },
    { name: 'coverage_verified', attributes: { 'plan.coverage_type': 'medical', 'plan.is_covered': true } },
  ],
};

/**
 * Sample error objects for testing error handling
 */
export const ERROR_OBJECTS = {
  GENERIC: new Error('An unexpected error occurred'),
  DATABASE: new Error('Database connection failed: timeout after 30s'),
  HTTP: new Error('HTTP request failed with status 500'),
  VALIDATION: new Error('Invalid input: required field missing'),
  HEALTH_JOURNEY: new Error('Failed to retrieve health metrics: device not connected'),
  CARE_JOURNEY: new Error('Failed to book appointment: no available slots'),
  PLAN_JOURNEY: new Error('Failed to submit claim: missing documentation'),
};

/**
 * Sample configuration options for different tracing environments
 */
export const TRACING_CONFIG_OPTIONS = {
  DEVELOPMENT: {
    serviceName: 'austa-service-dev',
    environment: 'development',
    logLevel: 'debug',
    sampleRate: 1.0, // Sample all traces
    exporterOptions: {
      url: 'http://localhost:4318/v1/traces',
      headers: {},
    },
  },
  TESTING: {
    serviceName: 'austa-service-test',
    environment: 'testing',
    logLevel: 'info',
    sampleRate: 1.0, // Sample all traces
    exporterOptions: {
      url: 'http://otel-collector:4318/v1/traces',
      headers: {},
    },
  },
  PRODUCTION: {
    serviceName: 'austa-service',
    environment: 'production',
    logLevel: 'warn',
    sampleRate: 0.1, // Sample 10% of traces
    exporterOptions: {
      url: 'https://otel-collector.austa.health/v1/traces',
      headers: {
        'X-API-Key': 'placeholder-api-key',
      },
    },
  },
  HEALTH_JOURNEY: {
    serviceName: 'austa-health-journey',
    environment: 'production',
    logLevel: 'info',
    sampleRate: 0.5, // Sample 50% of traces
    exporterOptions: {
      url: 'https://otel-collector.austa.health/v1/traces',
      headers: {
        'X-API-Key': 'placeholder-api-key',
        'X-Journey-Type': 'health',
      },
    },
  },
  CARE_JOURNEY: {
    serviceName: 'austa-care-journey',
    environment: 'production',
    logLevel: 'info',
    sampleRate: 0.5, // Sample 50% of traces
    exporterOptions: {
      url: 'https://otel-collector.austa.health/v1/traces',
      headers: {
        'X-API-Key': 'placeholder-api-key',
        'X-Journey-Type': 'care',
      },
    },
  },
  PLAN_JOURNEY: {
    serviceName: 'austa-plan-journey',
    environment: 'production',
    logLevel: 'info',
    sampleRate: 0.5, // Sample 50% of traces
    exporterOptions: {
      url: 'https://otel-collector.austa.health/v1/traces',
      headers: {
        'X-API-Key': 'placeholder-api-key',
        'X-Journey-Type': 'plan',
      },
    },
  },
};

/**
 * Sample resources for testing
 */
export const RESOURCES = {
  DEFAULT: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'austa-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'test',
  }),
  HEALTH_JOURNEY: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'austa-health-journey',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'test',
    'journey.type': 'health',
  }),
  CARE_JOURNEY: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'austa-care-journey',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'test',
    'journey.type': 'care',
  }),
  PLAN_JOURNEY: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'austa-plan-journey',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'test',
    'journey.type': 'plan',
  }),
};

/**
 * Mock span factory for creating test spans
 */
export interface MockSpan {
  name: string;
  kind: SpanKind;
  context: SpanContext;
  parentContext?: SpanContext;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; attributes?: Record<string, unknown>; timestamp?: number }>;
  status: { code: SpanStatusCode; message?: string };
  isRecording: () => boolean;
  recordException: (exception: Error) => void;
  end: (endTime?: number) => void;
}

/**
 * Creates a mock span for testing
 */
export function createMockSpan(options: {
  name: string;
  kind?: SpanKind;
  context?: SpanContext;
  parentContext?: SpanContext;
  attributes?: Record<string, unknown>;
  startTime?: number;
  status?: { code: SpanStatusCode; message?: string };
}): MockSpan {
  const startTime = options.startTime || Date.now();
  const context = options.context || SPAN_CONTEXTS.VALID;
  
  const span: MockSpan = {
    name: options.name,
    kind: options.kind || SpanKind.INTERNAL,
    context,
    parentContext: options.parentContext,
    startTime,
    attributes: options.attributes || {},
    events: [],
    status: options.status || { code: SpanStatusCode.UNSET },
    isRecording: () => true,
    recordException: (exception: Error) => {
      span.events.push({
        name: 'exception',
        attributes: {
          'exception.type': exception.name,
          'exception.message': exception.message,
          'exception.stacktrace': exception.stack,
        },
        timestamp: Date.now(),
      });
      span.status = { code: SpanStatusCode.ERROR, message: exception.message };
    },
    end: (endTime?: number) => {
      span.endTime = endTime || Date.now();
    },
  };
  
  return span;
}

/**
 * Creates journey-specific mock spans for testing
 */
export function createJourneySpans(): Record<string, MockSpan> {
  return {
    HEALTH_ROOT: createMockSpan({
      name: 'health.journey.start',
      kind: SpanKind.SERVER,
      context: SPAN_CONTEXTS.HEALTH_JOURNEY,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.HEALTH_JOURNEY },
    }),
    HEALTH_CHILD: createMockSpan({
      name: 'health.metrics.fetch',
      kind: SpanKind.CLIENT,
      context: { ...SPAN_CONTEXTS.HEALTH_JOURNEY, spanId: '1a2b3c4d5e6f7a8b' },
      parentContext: SPAN_CONTEXTS.HEALTH_JOURNEY,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.HEALTH_JOURNEY, 'health.metric_type': 'heart_rate' },
    }),
    CARE_ROOT: createMockSpan({
      name: 'care.journey.start',
      kind: SpanKind.SERVER,
      context: SPAN_CONTEXTS.CARE_JOURNEY,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.CARE_JOURNEY },
    }),
    CARE_CHILD: createMockSpan({
      name: 'care.appointment.book',
      kind: SpanKind.CLIENT,
      context: { ...SPAN_CONTEXTS.CARE_JOURNEY, spanId: '2b3c4d5e6f7a8b9c' },
      parentContext: SPAN_CONTEXTS.CARE_JOURNEY,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.CARE_JOURNEY, 'care.appointment_date': '2023-06-15T10:00:00Z' },
    }),
    PLAN_ROOT: createMockSpan({
      name: 'plan.journey.start',
      kind: SpanKind.SERVER,
      context: SPAN_CONTEXTS.PLAN_JOURNEY,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.PLAN_JOURNEY },
    }),
    PLAN_CHILD: createMockSpan({
      name: 'plan.claim.submit',
      kind: SpanKind.CLIENT,
      context: { ...SPAN_CONTEXTS.PLAN_JOURNEY, spanId: '3c4d5e6f7a8b9c0d' },
      parentContext: SPAN_CONTEXTS.PLAN_JOURNEY,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, ...SPAN_ATTRIBUTES.PLAN_JOURNEY, 'plan.claim_amount': 250.75 },
    }),
    ERROR_SPAN: createMockSpan({
      name: 'error.operation',
      kind: SpanKind.INTERNAL,
      context: SPAN_CONTEXTS.VALID,
      attributes: { ...SPAN_ATTRIBUTES.COMMON, 'error.expected': true },
      status: { code: SpanStatusCode.ERROR, message: 'Operation failed with an expected error' },
    }),
  };
}

/**
 * Creates a mock tracer for testing
 */
export function createMockTracer(name: string = 'test-tracer'): Tracer {
  return {
    startSpan: (name, options) => createMockSpan({ name, ...options }),
    startActiveSpan: (name, options, fn) => {
      // Handle different function signature overloads
      let spanOptions = {};
      let callback: Function;
      
      if (typeof options === 'function') {
        callback = options;
      } else {
        spanOptions = options || {};
        callback = fn as Function;
      }
      
      const span = createMockSpan({ name, ...spanOptions });
      try {
        return callback(span);
      } finally {
        span.end();
      }
    },
  } as unknown as Tracer;
}

/**
 * Initializes mock trace contexts for testing
 */
export function mockTraceContexts(): void {
  // This function would normally use the actual Context API to create contexts
  // For testing purposes, we're just creating objects with the necessary properties
  
  // In a real implementation, this would use something like:
  // const rootContext = trace.setSpan(context.active(), rootSpan);
  
  TRACE_CONTEXTS.ROOT = { spanContext: SPAN_CONTEXTS.VALID } as unknown as Context;
  TRACE_CONTEXTS.CHILD = { spanContext: { ...SPAN_CONTEXTS.VALID, spanId: SPAN_IDS.CHILD } } as unknown as Context;
  TRACE_CONTEXTS.HEALTH_JOURNEY = { spanContext: SPAN_CONTEXTS.HEALTH_JOURNEY } as unknown as Context;
  TRACE_CONTEXTS.CARE_JOURNEY = { spanContext: SPAN_CONTEXTS.CARE_JOURNEY } as unknown as Context;
  TRACE_CONTEXTS.PLAN_JOURNEY = { spanContext: SPAN_CONTEXTS.PLAN_JOURNEY } as unknown as Context;
  TRACE_CONTEXTS.REMOTE = { spanContext: SPAN_CONTEXTS.REMOTE } as unknown as Context;
}

/**
 * Initialize mock contexts when this module is imported
 */
mockTraceContexts();