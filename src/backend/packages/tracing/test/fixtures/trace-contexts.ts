/**
 * Trace Context Fixtures
 * 
 * This file contains sample trace context objects for testing trace propagation
 * across service boundaries. It provides standardized context objects for each
 * journey type (health, care, plan) and cross-journey scenarios to ensure
 * consistent context propagation throughout the application.
 */

import { Context, SpanContext, TraceFlags } from '@opentelemetry/api';

/**
 * Generates a random 16-byte trace ID as a hex string
 * @returns A 32-character hex string representing a trace ID
 */
export function generateTraceId(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generates a random 8-byte span ID as a hex string
 * @returns A 16-character hex string representing a span ID
 */
export function generateSpanId(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Creates a span context with the given trace ID and span ID
 * @param traceId The trace ID to use (generated if not provided)
 * @param spanId The span ID to use (generated if not provided)
 * @param traceFlags Optional trace flags (defaults to SAMPLED)
 * @returns A SpanContext object
 */
export function createSpanContext(
  traceId: string = generateTraceId(),
  spanId: string = generateSpanId(),
  traceFlags: number = TraceFlags.SAMPLED
): SpanContext {
  return {
    traceId,
    spanId,
    traceFlags,
    isRemote: true,
    traceState: undefined
  };
}

/**
 * Creates a trace context with the given span context
 * @param spanContext The span context to use
 * @returns A Context object
 */
export function createTraceContext(spanContext: SpanContext): Context {
  // In a real implementation, this would use the OpenTelemetry API to create a context
  // For testing purposes, we're creating a simple object that mimics the structure
  return {
    spanContext,
    getValue: (key: symbol) => {
      if (key.toString() === 'Symbol(OpenTelemetry Context Key SPAN)') {
        return {
          spanContext
        };
      }
      return undefined;
    },
    setValue: () => ({ spanContext }),
    deleteValue: () => ({ spanContext })
  } as unknown as Context;
}

/**
 * Creates a trace context with journey-specific attributes
 * @param journeyType The type of journey (health, care, plan)
 * @param userId The user ID associated with the trace
 * @param additionalAttributes Additional attributes to include in the context
 * @returns A Context object with journey-specific attributes
 */
export function createJourneyTraceContext(
  journeyType: 'health' | 'care' | 'plan',
  userId: string,
  additionalAttributes: Record<string, string> = {}
): Context {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const spanContext = createSpanContext(traceId, spanId);
  
  // Add journey-specific attributes to the context
  const context = createTraceContext(spanContext);
  
  // In a real implementation, these attributes would be added to the span
  // For testing purposes, we're adding them to the context object directly
  (context as any).attributes = {
    'journey.type': journeyType,
    'user.id': userId,
    'service.name': `austa-${journeyType}-service`,
    'correlation.id': `corr-${traceId.substring(0, 8)}`,
    ...additionalAttributes
  };
  
  return context;
}

// Sample trace contexts for each journey type

/**
 * Sample trace context for the Health journey
 */
export const healthJourneyContext = createJourneyTraceContext(
  'health',
  'user-123456',
  {
    'health.metric.type': 'blood_pressure',
    'health.device.id': 'device-789',
    'business.transaction': 'record_health_metric'
  }
);

/**
 * Sample trace context for the Care journey
 */
export const careJourneyContext = createJourneyTraceContext(
  'care',
  'user-123456',
  {
    'care.appointment.id': 'appt-456',
    'care.provider.id': 'provider-789',
    'business.transaction': 'schedule_appointment'
  }
);

/**
 * Sample trace context for the Plan journey
 */
export const planJourneyContext = createJourneyTraceContext(
  'plan',
  'user-123456',
  {
    'plan.id': 'plan-456',
    'plan.benefit.id': 'benefit-789',
    'business.transaction': 'view_coverage_details'
  }
);

// Cross-journey trace contexts

/**
 * Sample trace context for a cross-journey flow from Health to Care
 * (e.g., abnormal health metric triggering a care appointment recommendation)
 */
export const healthToCareJourneyContext = createJourneyTraceContext(
  'health',
  'user-123456',
  {
    'health.metric.type': 'blood_pressure',
    'health.metric.value': '160/95',
    'health.metric.status': 'abnormal',
    'care.recommendation.type': 'appointment',
    'business.transaction': 'health_metric_to_care_recommendation',
    'cross.journey': 'true',
    'source.journey': 'health',
    'target.journey': 'care'
  }
);

/**
 * Sample trace context for a cross-journey flow from Care to Plan
 * (e.g., appointment booking checking insurance coverage)
 */
export const careToPlanJourneyContext = createJourneyTraceContext(
  'care',
  'user-123456',
  {
    'care.appointment.id': 'appt-456',
    'care.provider.id': 'provider-789',
    'plan.coverage.check': 'true',
    'plan.id': 'plan-456',
    'business.transaction': 'appointment_coverage_verification',
    'cross.journey': 'true',
    'source.journey': 'care',
    'target.journey': 'plan'
  }
);

/**
 * Sample trace context for a gamification event triggered by a health journey action
 */
export const healthToGamificationJourneyContext = createJourneyTraceContext(
  'health',
  'user-123456',
  {
    'health.goal.id': 'goal-123',
    'health.goal.progress': '100',
    'health.goal.status': 'completed',
    'gamification.event.type': 'goal_completed',
    'gamification.achievement.id': 'achievement-456',
    'business.transaction': 'health_goal_achievement_unlock',
    'cross.journey': 'true',
    'source.journey': 'health',
    'target.journey': 'gamification'
  }
);

/**
 * Sample trace context for a complex multi-journey flow
 * (health metric → care recommendation → plan coverage → gamification reward)
 */
export const complexMultiJourneyContext = createJourneyTraceContext(
  'health',
  'user-123456',
  {
    'health.metric.type': 'blood_glucose',
    'health.metric.status': 'abnormal',
    'care.recommendation.type': 'appointment',
    'care.appointment.id': 'appt-789',
    'plan.coverage.status': 'verified',
    'plan.coverage.percentage': '80',
    'gamification.event.type': 'appointment_booked',
    'gamification.xp.earned': '50',
    'business.transaction': 'health_metric_to_appointment_flow',
    'cross.journey': 'true',
    'journey.flow': 'health→care→plan→gamification',
    'flow.step': '1/4'
  }
);

/**
 * Sample trace contexts with different trace flags
 */
export const sampledTraceContext = createTraceContext(
  createSpanContext(generateTraceId(), generateSpanId(), TraceFlags.SAMPLED)
);

export const notSampledTraceContext = createTraceContext(
  createSpanContext(generateTraceId(), generateSpanId(), TraceFlags.NONE)
);

/**
 * Predefined trace contexts with fixed IDs for deterministic testing
 */
export const fixedTraceContext = createTraceContext(
  createSpanContext(
    '0af7651916cd43dd8448eb211c80319c',
    'b7ad6b7169203331',
    TraceFlags.SAMPLED
  )
);

/**
 * Creates a child span context from a parent context
 * @param parentContext The parent context
 * @returns A new span context with the same trace ID but a new span ID
 */
export function createChildSpanContext(parentContext: Context): SpanContext {
  const parentSpanContext = (parentContext as any).spanContext;
  return createSpanContext(
    parentSpanContext.traceId,
    generateSpanId(),
    parentSpanContext.traceFlags
  );
}

/**
 * Creates a child trace context from a parent context
 * @param parentContext The parent context
 * @param additionalAttributes Additional attributes to include in the child context
 * @returns A new context with the same trace ID but a new span ID
 */
export function createChildTraceContext(
  parentContext: Context,
  additionalAttributes: Record<string, string> = {}
): Context {
  const childSpanContext = createChildSpanContext(parentContext);
  const childContext = createTraceContext(childSpanContext);
  
  // Copy attributes from parent and add new ones
  const parentAttributes = (parentContext as any).attributes || {};
  (childContext as any).attributes = {
    ...parentAttributes,
    ...additionalAttributes
  };
  
  return childContext;
}