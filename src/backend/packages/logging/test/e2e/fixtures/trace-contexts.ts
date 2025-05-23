/**
 * Mock Trace Contexts for E2E Testing
 * 
 * This file provides mock trace context objects used in the tracing-integration.e2e-spec.ts tests
 * to verify proper integration between logging and distributed tracing.
 * 
 * These fixtures simulate trace contexts that would be present in a distributed system,
 * allowing tests to verify that trace context is properly propagated and included in logs.
 */

import { SpanKind, TraceFlags } from '@opentelemetry/api';

/**
 * Collection of mock trace contexts for testing various tracing scenarios.
 */
export const TraceContexts = {
  /**
   * Basic trace context with a single span
   */
  basic: {
    traceId: 'abcdef0123456789abcdef0123456789',
    spanId: '0123456789abcdef',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'test-service',
    operationName: 'test-operation',
    startTime: [1619712000, 123000000], // [seconds, nanoseconds]
    endTime: [1619712001, 234000000],
    attributes: {
      'service.name': 'test-service',
      'operation.name': 'test-operation',
    },
  },

  /**
   * Parent span context for testing parent-child relationships
   */
  parent: {
    traceId: 'bbcdef0123456789abcdef0123456789',
    spanId: 'bbbb456789abcdef',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'parent-service',
    operationName: 'parent-operation',
    startTime: [1619712000, 100000000],
    endTime: [1619712002, 300000000],
    attributes: {
      'service.name': 'parent-service',
      'operation.name': 'parent-operation',
    },
  },

  /**
   * Child span context that is a child of the parent context
   */
  child: {
    traceId: 'bbcdef0123456789abcdef0123456789', // Same trace ID as parent
    spanId: 'cccc456789abcdef',
    parentSpanId: 'bbbb456789abcdef', // References parent span ID
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'child-service',
    operationName: 'child-operation',
    startTime: [1619712000, 200000000],
    endTime: [1619712001, 800000000],
    attributes: {
      'service.name': 'child-service',
      'operation.name': 'child-operation',
      'parent.service': 'parent-service',
    },
  },

  /**
   * Trace context for cross-service tracing
   */
  crossServiceTrace: {
    traceId: 'ccccef0123456789abcdef0123456789',
    spanId: 'dddd456789abcdef',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: true,
    serviceName: 'api-gateway',
    operationName: 'http-request',
    startTime: [1619712010, 100000000],
    endTime: [1619712012, 900000000],
    attributes: {
      'service.name': 'api-gateway',
      'operation.name': 'http-request',
      'http.method': 'POST',
      'http.url': '/api/v1/health/metrics',
      'http.status_code': 200,
    },
  },

  /**
   * Trace context for a span in the health journey service
   */
  healthJourney: {
    traceId: 'ddcdef0123456789abcdef0123456789',
    spanId: 'eeee456789abcdef',
    parentSpanId: 'dddd456789abcdef', // References cross-service trace
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'health-service',
    operationName: 'update-health-metrics',
    startTime: [1619712010, 200000000],
    endTime: [1619712011, 500000000],
    attributes: {
      'service.name': 'health-service',
      'operation.name': 'update-health-metrics',
      'journey.type': 'health',
      'journey.resource_id': 'health-record-123',
      'user.id': 'user-456',
    },
  },

  /**
   * Trace context for a span in the care journey service
   */
  careJourney: {
    traceId: 'eecdef0123456789abcdef0123456789',
    spanId: 'ffff456789abcdef',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'care-service',
    operationName: 'book-appointment',
    startTime: [1619712020, 100000000],
    endTime: [1619712022, 800000000],
    attributes: {
      'service.name': 'care-service',
      'operation.name': 'book-appointment',
      'journey.type': 'care',
      'journey.resource_id': 'appointment-789',
      'user.id': 'user-456',
      'provider.id': 'provider-123',
    },
  },

  /**
   * Trace context for a span in the plan journey service
   */
  planJourney: {
    traceId: 'ffcdef0123456789abcdef0123456789',
    spanId: 'aaaa456789abcdef',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'plan-service',
    operationName: 'submit-claim',
    startTime: [1619712030, 100000000],
    endTime: [1619712033, 900000000],
    attributes: {
      'service.name': 'plan-service',
      'operation.name': 'submit-claim',
      'journey.type': 'plan',
      'journey.resource_id': 'claim-456',
      'user.id': 'user-456',
      'plan.id': 'plan-789',
    },
  },

  /**
   * Trace context for an error scenario
   */
  errorTrace: {
    traceId: 'aacdef0123456789abcdef0123456789',
    spanId: 'eeee456789abcdef',
    traceFlags: TraceFlags.SAMPLED,
    isRemote: false,
    serviceName: 'health-service',
    operationName: 'process-health-data',
    startTime: [1619712040, 100000000],
    endTime: [1619712040, 500000000],
    attributes: {
      'service.name': 'health-service',
      'operation.name': 'process-health-data',
      'journey.type': 'health',
      'error': true,
      'error.type': 'ValidationError',
      'error.message': 'Invalid health metric data',
    },
  },

  /**
   * Complete request flow across multiple services
   * Simulates a user submitting health data that triggers gamification events
   */
  completeFlow: {
    // Initial request through API Gateway
    apiGateway: {
      traceId: 'aaaaef0123456789abcdef0123456789',
      spanId: '1111456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
      serviceName: 'api-gateway',
      operationName: 'http-request',
      spanKind: SpanKind.SERVER,
      startTime: [1619712050, 100000000],
      endTime: [1619712055, 900000000],
      attributes: {
        'service.name': 'api-gateway',
        'operation.name': 'http-request',
        'http.method': 'POST',
        'http.url': '/api/v1/health/metrics',
        'http.status_code': 200,
      },
    },
    
    // Health service processing the request
    healthService: {
      traceId: 'aaaaef0123456789abcdef0123456789',
      spanId: '2222456789abcdef',
      parentSpanId: '1111456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
      serviceName: 'health-service',
      operationName: 'save-health-metrics',
      spanKind: SpanKind.INTERNAL,
      startTime: [1619712050, 200000000],
      endTime: [1619712051, 500000000],
      attributes: {
        'service.name': 'health-service',
        'operation.name': 'save-health-metrics',
        'journey.type': 'health',
        'journey.resource_id': 'health-record-789',
        'user.id': 'user-123',
        'metric.type': 'steps',
        'metric.value': '10000',
      },
    },
    
    // Health service publishing event
    healthServiceEvent: {
      traceId: 'aaaaef0123456789abcdef0123456789',
      spanId: '3333456789abcdef',
      parentSpanId: '2222456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
      serviceName: 'health-service',
      operationName: 'publish-metric-event',
      spanKind: SpanKind.PRODUCER,
      startTime: [1619712051, 500000000],
      endTime: [1619712051, 700000000],
      attributes: {
        'service.name': 'health-service',
        'operation.name': 'publish-metric-event',
        'messaging.system': 'kafka',
        'messaging.destination': 'health-metrics',
        'messaging.destination_kind': 'topic',
      },
    },
    
    // Gamification engine consuming the event
    gamificationConsumer: {
      traceId: 'aaaaef0123456789abcdef0123456789',
      spanId: '4444456789abcdef',
      parentSpanId: '3333456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
      serviceName: 'gamification-engine',
      operationName: 'consume-metric-event',
      spanKind: SpanKind.CONSUMER,
      startTime: [1619712051, 800000000],
      endTime: [1619712052, 100000000],
      attributes: {
        'service.name': 'gamification-engine',
        'operation.name': 'consume-metric-event',
        'messaging.system': 'kafka',
        'messaging.destination': 'health-metrics',
        'messaging.destination_kind': 'topic',
        'messaging.operation': 'receive',
      },
    },
    
    // Gamification engine processing achievement
    gamificationProcessing: {
      traceId: 'aaaaef0123456789abcdef0123456789',
      spanId: '5555456789abcdef',
      parentSpanId: '4444456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
      serviceName: 'gamification-engine',
      operationName: 'process-achievement',
      spanKind: SpanKind.INTERNAL,
      startTime: [1619712052, 100000000],
      endTime: [1619712052, 500000000],
      attributes: {
        'service.name': 'gamification-engine',
        'operation.name': 'process-achievement',
        'achievement.id': 'daily-steps-goal',
        'achievement.type': 'milestone',
        'user.id': 'user-123',
        'points.earned': 100,
      },
    },
    
    // Notification service sending achievement notification
    notificationService: {
      traceId: 'aaaaef0123456789abcdef0123456789',
      spanId: '6666456789abcdef',
      parentSpanId: '5555456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
      serviceName: 'notification-service',
      operationName: 'send-achievement-notification',
      spanKind: SpanKind.INTERNAL,
      startTime: [1619712052, 600000000],
      endTime: [1619712053, 100000000],
      attributes: {
        'service.name': 'notification-service',
        'operation.name': 'send-achievement-notification',
        'notification.type': 'achievement',
        'notification.channel': 'push',
        'user.id': 'user-123',
      },
    },
  },

  /**
   * Trace context for testing with different trace flags
   */
  traceFlags: {
    // Sampled trace (normal case)
    sampled: {
      traceId: 'bbbbef0123456789abcdef0123456789',
      spanId: '7777456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
      serviceName: 'test-service',
      operationName: 'sampled-operation',
    },
    
    // Not sampled trace (for testing sampling behavior)
    notSampled: {
      traceId: 'ccccef0123456789abcdef0123456789',
      spanId: '8888456789abcdef',
      traceFlags: TraceFlags.NONE,
      isRemote: false,
      serviceName: 'test-service',
      operationName: 'not-sampled-operation',
    },
  },

  /**
   * Trace contexts for testing different span kinds
   */
  spanKinds: {
    // Server span (incoming request)
    server: {
      traceId: 'dddddf0123456789abcdef0123456789',
      spanId: '9999456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
      serviceName: 'test-service',
      operationName: 'handle-request',
      spanKind: SpanKind.SERVER,
    },
    
    // Client span (outgoing request)
    client: {
      traceId: 'eeeeef0123456789abcdef0123456789',
      spanId: 'aaaa456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
      serviceName: 'test-service',
      operationName: 'make-request',
      spanKind: SpanKind.CLIENT,
    },
    
    // Producer span (sending to message broker)
    producer: {
      traceId: 'ffffef0123456789abcdef0123456789',
      spanId: 'bbbb456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: false,
      serviceName: 'test-service',
      operationName: 'send-message',
      spanKind: SpanKind.PRODUCER,
    },
    
    // Consumer span (receiving from message broker)
    consumer: {
      traceId: '11111f0123456789abcdef0123456789',
      spanId: 'cccc456789abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
      serviceName: 'test-service',
      operationName: 'process-message',
      spanKind: SpanKind.CONSUMER,
    },
  },
};