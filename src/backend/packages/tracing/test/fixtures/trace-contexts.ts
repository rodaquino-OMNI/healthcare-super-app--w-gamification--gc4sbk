/**
 * @file trace-contexts.ts
 * @description Sample trace context objects for testing trace propagation across service boundaries.
 * Contains standardized context objects for each journey type and cross-journey scenarios.
 */

import { Context, SpanContext, SpanKind, TraceFlags } from '@opentelemetry/api';

/**
 * Interface for a complete trace context including trace ID, span ID, flags, and tracestate
 */
export interface TraceContextData {
  traceId: string;        // 32-character hex string (16 bytes)
  spanId: string;         // 16-character hex string (8 bytes)
  traceFlags: TraceFlags; // Typically TraceFlags.SAMPLED (1) or TraceFlags.NONE (0)
  traceState?: string;    // Optional W3C tracestate header value
  isRemote: boolean;      // Whether the context was received from a remote source
  spanKind?: SpanKind;    // The kind of span (client, server, internal, etc.)
  serviceName?: string;   // The name of the service that created the span
  correlationId?: string; // Business correlation ID for connecting logs, traces, and metrics
}

/**
 * Generates a valid hexadecimal trace ID (32 characters)
 * @returns A 32-character hex string representing a trace ID
 */
export function generateTraceId(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generates a valid hexadecimal span ID (16 characters)
 * @returns A 16-character hex string representing a span ID
 */
export function generateSpanId(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Creates a trace context object with the specified parameters
 * @param options Optional parameters to customize the trace context
 * @returns A TraceContextData object with the specified or generated values
 */
export function createTraceContext(options?: Partial<TraceContextData>): TraceContextData {
  return {
    traceId: options?.traceId || generateTraceId(),
    spanId: options?.spanId || generateSpanId(),
    traceFlags: options?.traceFlags !== undefined ? options.traceFlags : TraceFlags.SAMPLED,
    traceState: options?.traceState,
    isRemote: options?.isRemote !== undefined ? options.isRemote : false,
    spanKind: options?.spanKind,
    serviceName: options?.serviceName,
    correlationId: options?.correlationId,
  };
}

/**
 * Creates a W3C-compliant traceparent header value from a trace context
 * @param context The trace context to convert
 * @returns A string in the format '00-traceId-spanId-flags'
 */
export function createTraceparentHeader(context: TraceContextData): string {
  // Format: 00-traceId-spanId-flags
  // 00 is the version, flags is a 2-character hex representation of traceFlags
  return `00-${context.traceId}-${context.spanId}-0${context.traceFlags}`;
}

/**
 * Creates an OpenTelemetry SpanContext from a trace context
 * @param context The trace context to convert
 * @returns An OpenTelemetry SpanContext object
 */
export function createSpanContext(context: TraceContextData): SpanContext {
  return {
    traceId: context.traceId,
    spanId: context.spanId,
    traceFlags: context.traceFlags,
    traceState: context.traceState ? { get: () => context.traceState, set: () => null, delete: () => null, forEach: () => null } : undefined,
    isRemote: context.isRemote,
  };
}

// ===== Health Journey Trace Contexts =====

/**
 * Trace context for health metric recording flow
 */
export const HEALTH_METRIC_TRACE_CONTEXT: TraceContextData = {
  traceId: '7fa8f9a23c4b1d6e5f8a9c0b1d2e3f4a',
  spanId: '8a7b6c5d4e3f2a1b',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-health=metric-recording',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'health-service',
  correlationId: 'health-metric-123456',
};

/**
 * Trace context for health goal achievement flow
 */
export const HEALTH_GOAL_TRACE_CONTEXT: TraceContextData = {
  traceId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
  spanId: '1b2c3d4e5f6a7b8c',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-health=goal-achievement',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'health-service',
  correlationId: 'health-goal-789012',
};

/**
 * Trace context for device synchronization flow
 */
export const HEALTH_DEVICE_SYNC_TRACE_CONTEXT: TraceContextData = {
  traceId: '2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
  spanId: '3c4d5e6f7a8b9c0d',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-health=device-sync',
  isRemote: true,
  spanKind: SpanKind.CLIENT,
  serviceName: 'health-service',
  correlationId: 'device-sync-345678',
};

// ===== Care Journey Trace Contexts =====

/**
 * Trace context for appointment booking flow
 */
export const CARE_APPOINTMENT_TRACE_CONTEXT: TraceContextData = {
  traceId: '3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
  spanId: '4d5e6f7a8b9c0d1e',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-care=appointment-booking',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'care-service',
  correlationId: 'appointment-901234',
};

/**
 * Trace context for telemedicine session flow
 */
export const CARE_TELEMEDICINE_TRACE_CONTEXT: TraceContextData = {
  traceId: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
  spanId: '5e6f7a8b9c0d1e2f',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-care=telemedicine-session',
  isRemote: true,
  spanKind: SpanKind.CLIENT,
  serviceName: 'care-service',
  correlationId: 'telemedicine-567890',
};

/**
 * Trace context for medication adherence flow
 */
export const CARE_MEDICATION_TRACE_CONTEXT: TraceContextData = {
  traceId: '5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
  spanId: '6f7a8b9c0d1e2f3a',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-care=medication-adherence',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'care-service',
  correlationId: 'medication-123456',
};

// ===== Plan Journey Trace Contexts =====

/**
 * Trace context for claim submission flow
 */
export const PLAN_CLAIM_TRACE_CONTEXT: TraceContextData = {
  traceId: '6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
  spanId: '7a8b9c0d1e2f3a4b',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-plan=claim-submission',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'plan-service',
  correlationId: 'claim-789012',
};

/**
 * Trace context for benefit utilization flow
 */
export const PLAN_BENEFIT_TRACE_CONTEXT: TraceContextData = {
  traceId: '7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
  spanId: '8b9c0d1e2f3a4b5c',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-plan=benefit-utilization',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'plan-service',
  correlationId: 'benefit-345678',
};

/**
 * Trace context for reward redemption flow
 */
export const PLAN_REWARD_TRACE_CONTEXT: TraceContextData = {
  traceId: '8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
  spanId: '9c0d1e2f3a4b5c6d',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-plan=reward-redemption',
  isRemote: false,
  spanKind: SpanKind.INTERNAL,
  serviceName: 'plan-service',
  correlationId: 'reward-901234',
};

// ===== Cross-Journey Trace Contexts =====

/**
 * Trace context for health-to-gamification flow (achievement unlocked)
 */
export const HEALTH_TO_GAMIFICATION_TRACE_CONTEXT: TraceContextData = {
  traceId: '9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
  spanId: '0d1e2f3a4b5c6d7e',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-health=goal-achievement,austa-gamification=achievement-unlocked',
  isRemote: true,
  spanKind: SpanKind.PRODUCER,
  serviceName: 'health-service',
  correlationId: 'health-achievement-567890',
};

/**
 * Trace context for care-to-gamification flow (appointment completed)
 */
export const CARE_TO_GAMIFICATION_TRACE_CONTEXT: TraceContextData = {
  traceId: 'a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
  spanId: '1e2f3a4b5c6d7e8f',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-care=appointment-completed,austa-gamification=xp-awarded',
  isRemote: true,
  spanKind: SpanKind.PRODUCER,
  serviceName: 'care-service',
  correlationId: 'care-appointment-123456',
};

/**
 * Trace context for plan-to-gamification flow (claim processed)
 */
export const PLAN_TO_GAMIFICATION_TRACE_CONTEXT: TraceContextData = {
  traceId: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
  spanId: '2f3a4b5c6d7e8f9a',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-plan=claim-processed,austa-gamification=quest-progress',
  isRemote: true,
  spanKind: SpanKind.PRODUCER,
  serviceName: 'plan-service',
  correlationId: 'plan-claim-789012',
};

/**
 * Trace context for gamification-to-notification flow (achievement notification)
 */
export const GAMIFICATION_TO_NOTIFICATION_TRACE_CONTEXT: TraceContextData = {
  traceId: 'c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
  spanId: '3a4b5c6d7e8f9a0b',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-gamification=achievement-unlocked,austa-notification=push-notification',
  isRemote: true,
  spanKind: SpanKind.PRODUCER,
  serviceName: 'gamification-engine',
  correlationId: 'achievement-notification-345678',
};

/**
 * Trace context for complex multi-journey flow (health metric → achievement → notification)
 */
export const COMPLEX_MULTI_JOURNEY_TRACE_CONTEXT: TraceContextData = {
  traceId: 'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
  spanId: '4b5c6d7e8f9a0b1c',
  traceFlags: TraceFlags.SAMPLED,
  traceState: 'austa-health=metric-recorded,austa-gamification=achievement-unlocked,austa-notification=push-notification',
  isRemote: true,
  spanKind: SpanKind.CONSUMER,
  serviceName: 'notification-service',
  correlationId: 'complex-flow-901234',
};

/**
 * Creates a mock trace context for testing with a specific journey
 * @param journey The journey type ('health', 'care', 'plan', 'gamification', 'notification')
 * @param operation The specific operation being performed
 * @param options Additional options to customize the trace context
 * @returns A TraceContextData object for the specified journey and operation
 */
export function createJourneyTraceContext(
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'notification',
  operation: string,
  options?: Partial<TraceContextData>
): TraceContextData {
  const baseContext = createTraceContext(options);
  
  return {
    ...baseContext,
    traceState: options?.traceState || `austa-${journey}=${operation}`,
    serviceName: options?.serviceName || `${journey}-service`,
    correlationId: options?.correlationId || `${journey}-${operation}-${Math.floor(Math.random() * 1000000)}`,
  };
}

/**
 * Creates a mock trace context for testing cross-journey scenarios
 * @param sourceJourney The source journey type
 * @param targetJourney The target journey type
 * @param sourceOperation The operation in the source journey
 * @param targetOperation The operation in the target journey
 * @param options Additional options to customize the trace context
 * @returns A TraceContextData object for the cross-journey scenario
 */
export function createCrossJourneyTraceContext(
  sourceJourney: 'health' | 'care' | 'plan' | 'gamification' | 'notification',
  targetJourney: 'health' | 'care' | 'plan' | 'gamification' | 'notification',
  sourceOperation: string,
  targetOperation: string,
  options?: Partial<TraceContextData>
): TraceContextData {
  const baseContext = createTraceContext(options);
  
  return {
    ...baseContext,
    traceState: options?.traceState || `austa-${sourceJourney}=${sourceOperation},austa-${targetJourney}=${targetOperation}`,
    serviceName: options?.serviceName || `${sourceJourney}-service`,
    isRemote: options?.isRemote !== undefined ? options.isRemote : true,
    spanKind: options?.spanKind || SpanKind.PRODUCER,
    correlationId: options?.correlationId || `${sourceJourney}-${targetJourney}-${Math.floor(Math.random() * 1000000)}`,
  };
}