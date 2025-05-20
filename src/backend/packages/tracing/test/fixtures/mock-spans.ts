import { SpanStatusCode } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';

/**
 * Mock spans for testing tracing functionality across different journey contexts.
 * These spans represent common operations with realistic timing and attributes.
 * 
 * Requirements:
 * - Distributed tracing must include custom span annotations for business-relevant operations
 * - Tracing must support end-to-end request visualization
 * - Performance metrics need to be measured with <50ms per event processing time (95th percentile)
 */

// Base timestamp for all spans (January 1, 2023)
const BASE_TIMESTAMP = 1672531200000000;

// Common span attributes
const COMMON_ATTRIBUTES = {
  'service.name': 'austa-service',
  'service.version': '1.0.0',
  'deployment.environment': 'test',
};

/**
 * Creates a mock span with the given parameters
 */
export function createMockSpan({
  name,
  traceId,
  spanId,
  parentSpanId,
  startTime = BASE_TIMESTAMP,
  endTime,
  attributes = {},
  events = [],
  status = SpanStatusCode.OK,
  kind = 0, // INTERNAL
}: {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime?: number;
  endTime?: number;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; time: number; attributes?: Record<string, any> }>;
  status?: SpanStatusCode;
  kind?: number;
}): ReadableSpan {
  const duration = endTime ? endTime - startTime : 0;
  
  return {
    name,
    kind,
    spanContext: () => ({
      traceId,
      spanId,
      traceFlags: 1, // SAMPLED
      isRemote: false,
      traceState: {
        get: () => undefined,
        set: () => ({ get: () => undefined, set: () => ({ get: () => undefined }) }),
        unset: () => ({ get: () => undefined, set: () => ({ get: () => undefined }) }),
        serialize: () => '',
      },
    }),
    parentSpanId,
    startTime: [Math.floor(startTime / 1000000), startTime % 1000000],
    endTime: endTime ? [Math.floor(endTime / 1000000), endTime % 1000000] : undefined,
    status: { code: status },
    attributes: { ...COMMON_ATTRIBUTES, ...attributes },
    links: [],
    events: events.map(event => ({
      name: event.name,
      time: [Math.floor(event.time / 1000000), event.time % 1000000],
      attributes: event.attributes || {},
    })),
    duration: [Math.floor(duration / 1000000), duration % 1000000],
    ended: !!endTime,
    resource: {
      attributes: {},
    },
    instrumentationLibrary: {
      name: '@austa/tracing',
      version: '1.0.0',
    },
  } as unknown as ReadableSpan;
}

/**
 * Creates a mock span for the Health Journey context
 */
export function createHealthJourneySpan({
  name,
  traceId,
  spanId,
  parentSpanId,
  startTime = BASE_TIMESTAMP,
  duration = 45000, // 45ms in microseconds
  attributes = {},
  events = [],
  status = SpanStatusCode.OK,
}: {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime?: number;
  duration?: number;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; time: number; attributes?: Record<string, any> }>;
  status?: SpanStatusCode;
}): ReadableSpan {
  const endTime = startTime + duration;
  
  return createMockSpan({
    name,
    traceId,
    spanId,
    parentSpanId,
    startTime,
    endTime,
    attributes: {
      'journey.context': 'health',
      'journey.operation': name,
      ...attributes,
    },
    events,
    status,
  });
}

/**
 * Creates a mock span for the Care Journey context
 */
export function createCareJourneySpan({
  name,
  traceId,
  spanId,
  parentSpanId,
  startTime = BASE_TIMESTAMP,
  duration = 65000, // 65ms in microseconds
  attributes = {},
  events = [],
  status = SpanStatusCode.OK,
}: {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime?: number;
  duration?: number;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; time: number; attributes?: Record<string, any> }>;
  status?: SpanStatusCode;
}): ReadableSpan {
  const endTime = startTime + duration;
  
  return createMockSpan({
    name,
    traceId,
    spanId,
    parentSpanId,
    startTime,
    endTime,
    attributes: {
      'journey.context': 'care',
      'journey.operation': name,
      ...attributes,
    },
    events,
    status,
  });
}

/**
 * Creates a mock span for the Plan Journey context
 */
export function createPlanJourneySpan({
  name,
  traceId,
  spanId,
  parentSpanId,
  startTime = BASE_TIMESTAMP,
  duration = 55000, // 55ms in microseconds
  attributes = {},
  events = [],
  status = SpanStatusCode.OK,
}: {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime?: number;
  duration?: number;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; time: number; attributes?: Record<string, any> }>;
  status?: SpanStatusCode;
}): ReadableSpan {
  const endTime = startTime + duration;
  
  return createMockSpan({
    name,
    traceId,
    spanId,
    parentSpanId,
    startTime,
    endTime,
    attributes: {
      'journey.context': 'plan',
      'journey.operation': name,
      ...attributes,
    },
    events,
    status,
  });
}

/**
 * Creates a mock span for the Gamification Engine
 */
export function createGamificationSpan({
  name,
  traceId,
  spanId,
  parentSpanId,
  startTime = BASE_TIMESTAMP,
  duration = 35000, // 35ms in microseconds (below the 50ms requirement)
  attributes = {},
  events = [],
  status = SpanStatusCode.OK,
}: {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime?: number;
  duration?: number;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; time: number; attributes?: Record<string, any> }>;
  status?: SpanStatusCode;
}): ReadableSpan {
  const endTime = startTime + duration;
  
  return createMockSpan({
    name,
    traceId,
    spanId,
    parentSpanId,
    startTime,
    endTime,
    attributes: {
      'journey.context': 'gamification',
      'journey.operation': name,
      ...attributes,
    },
    events,
    status,
  });
}

// Sample trace ID and span IDs for testing
export const SAMPLE_TRACE_ID = '0af7651916cd43dd8448eb211c80319c';
export const SAMPLE_SPAN_ID_1 = 'b7ad6b7169203331';
export const SAMPLE_SPAN_ID_2 = 'c9c4b7f5b8615f08';
export const SAMPLE_SPAN_ID_3 = 'a4b3c2d1e5f67890';
export const SAMPLE_SPAN_ID_4 = '1a2b3c4d5e6f7890';

// Sample mock spans for Health Journey
export const HEALTH_API_SPAN = createHealthJourneySpan({
  name: 'health.api.getMetrics',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_1,
  duration: 120000, // 120ms
  attributes: {
    'http.method': 'GET',
    'http.url': '/api/health/metrics',
    'http.status_code': 200,
    'http.flavor': '1.1',
    'net.peer.ip': '192.168.1.1',
    'user.id': 'user-123',
  },
  events: [
    {
      name: 'request.received',
      time: BASE_TIMESTAMP + 1000,
      attributes: { 'request.size': 1024 },
    },
    {
      name: 'response.sent',
      time: BASE_TIMESTAMP + 119000,
      attributes: { 'response.size': 2048 },
    },
  ],
});

export const HEALTH_DB_SPAN = createHealthJourneySpan({
  name: 'health.db.query',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_2,
  parentSpanId: SAMPLE_SPAN_ID_1,
  startTime: BASE_TIMESTAMP + 10000,
  duration: 45000, // 45ms
  attributes: {
    'db.system': 'postgresql',
    'db.name': 'health_metrics',
    'db.user': 'health_service',
    'db.statement': 'SELECT * FROM health_metrics WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
    'db.operation': 'SELECT',
    'db.postgresql.table': 'health_metrics',
  },
});

export const HEALTH_DEVICE_SPAN = createHealthJourneySpan({
  name: 'health.device.sync',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_3,
  parentSpanId: SAMPLE_SPAN_ID_1,
  startTime: BASE_TIMESTAMP + 60000,
  duration: 30000, // 30ms
  attributes: {
    'device.type': 'smartwatch',
    'device.id': 'device-456',
    'sync.records': 15,
    'sync.operation': 'pull',
  },
});

// Sample mock spans for Care Journey
export const CARE_API_SPAN = createCareJourneySpan({
  name: 'care.api.bookAppointment',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_1,
  duration: 180000, // 180ms
  attributes: {
    'http.method': 'POST',
    'http.url': '/api/care/appointments',
    'http.status_code': 201,
    'http.flavor': '1.1',
    'net.peer.ip': '192.168.1.2',
    'user.id': 'user-456',
  },
  events: [
    {
      name: 'request.received',
      time: BASE_TIMESTAMP + 1000,
      attributes: { 'request.size': 2048 },
    },
    {
      name: 'appointment.validated',
      time: BASE_TIMESTAMP + 50000,
      attributes: { 'validation.result': 'success' },
    },
    {
      name: 'response.sent',
      time: BASE_TIMESTAMP + 179000,
      attributes: { 'response.size': 1024 },
    },
  ],
});

export const CARE_DB_SPAN = createCareJourneySpan({
  name: 'care.db.insert',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_2,
  parentSpanId: SAMPLE_SPAN_ID_1,
  startTime: BASE_TIMESTAMP + 60000,
  duration: 65000, // 65ms
  attributes: {
    'db.system': 'postgresql',
    'db.name': 'care_appointments',
    'db.user': 'care_service',
    'db.statement': 'INSERT INTO appointments (user_id, provider_id, date, time, type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    'db.operation': 'INSERT',
    'db.postgresql.table': 'appointments',
  },
});

export const CARE_NOTIFICATION_SPAN = createCareJourneySpan({
  name: 'care.notification.send',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_3,
  parentSpanId: SAMPLE_SPAN_ID_1,
  startTime: BASE_TIMESTAMP + 130000,
  duration: 40000, // 40ms
  attributes: {
    'notification.type': 'appointment_confirmation',
    'notification.channel': 'push',
    'notification.recipient': 'user-456',
    'notification.template': 'appointment_booked',
  },
});

// Sample mock spans for Plan Journey
export const PLAN_API_SPAN = createPlanJourneySpan({
  name: 'plan.api.submitClaim',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_1,
  duration: 150000, // 150ms
  attributes: {
    'http.method': 'POST',
    'http.url': '/api/plan/claims',
    'http.status_code': 202,
    'http.flavor': '1.1',
    'net.peer.ip': '192.168.1.3',
    'user.id': 'user-789',
  },
  events: [
    {
      name: 'request.received',
      time: BASE_TIMESTAMP + 1000,
      attributes: { 'request.size': 4096 },
    },
    {
      name: 'claim.validated',
      time: BASE_TIMESTAMP + 40000,
      attributes: { 'validation.result': 'success' },
    },
    {
      name: 'documents.processed',
      time: BASE_TIMESTAMP + 100000,
      attributes: { 'document.count': 3 },
    },
    {
      name: 'response.sent',
      time: BASE_TIMESTAMP + 149000,
      attributes: { 'response.size': 1024 },
    },
  ],
});

export const PLAN_DB_SPAN = createPlanJourneySpan({
  name: 'plan.db.insert',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_2,
  parentSpanId: SAMPLE_SPAN_ID_1,
  startTime: BASE_TIMESTAMP + 50000,
  duration: 55000, // 55ms
  attributes: {
    'db.system': 'postgresql',
    'db.name': 'plan_claims',
    'db.user': 'plan_service',
    'db.statement': 'INSERT INTO claims (user_id, plan_id, amount, service_date, provider, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    'db.operation': 'INSERT',
    'db.postgresql.table': 'claims',
  },
});

export const PLAN_EXTERNAL_API_SPAN = createPlanJourneySpan({
  name: 'plan.external.insuranceApi',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_3,
  parentSpanId: SAMPLE_SPAN_ID_1,
  startTime: BASE_TIMESTAMP + 110000,
  duration: 35000, // 35ms
  attributes: {
    'http.method': 'POST',
    'http.url': 'https://insurance-api.example.com/claims',
    'http.status_code': 200,
    'peer.service': 'insurance-api',
    'claim.id': 'claim-123',
    'claim.status': 'submitted',
  },
});

// Sample mock spans for Gamification Engine
export const GAMIFICATION_EVENT_SPAN = createGamificationSpan({
  name: 'gamification.event.process',
  traceId: SAMPLE_TRACE_ID,
  spanId: SAMPLE_SPAN_ID_4,
  duration: 35000, // 35ms (below the 50ms requirement)
  attributes: {
    'event.type': 'achievement_progress',
    'event.source': 'health_journey',
    'user.id': 'user-123',
    'achievement.id': 'daily_steps_goal',
    'achievement.progress': 75,
  },
  events: [
    {
      name: 'event.received',
      time: BASE_TIMESTAMP + 1000,
      attributes: { 'event.size': 512 },
    },
    {
      name: 'rules.evaluated',
      time: BASE_TIMESTAMP + 15000,
      attributes: { 'rules.count': 3, 'rules.matched': 2 },
    },
    {
      name: 'points.awarded',
      time: BASE_TIMESTAMP + 25000,
      attributes: { 'points.amount': 50 },
    },
    {
      name: 'event.processed',
      time: BASE_TIMESTAMP + 34000,
      attributes: { 'processing.result': 'success' },
    },
  ],
});

// Export all mock spans for easy access
export const MOCK_SPANS = {
  health: {
    api: HEALTH_API_SPAN,
    db: HEALTH_DB_SPAN,
    device: HEALTH_DEVICE_SPAN,
  },
  care: {
    api: CARE_API_SPAN,
    db: CARE_DB_SPAN,
    notification: CARE_NOTIFICATION_SPAN,
  },
  plan: {
    api: PLAN_API_SPAN,
    db: PLAN_DB_SPAN,
    externalApi: PLAN_EXTERNAL_API_SPAN,
  },
  gamification: {
    event: GAMIFICATION_EVENT_SPAN,
  },
};