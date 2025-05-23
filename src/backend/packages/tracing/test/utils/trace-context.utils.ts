/**
 * @file trace-context.utils.ts
 * @description Provides utilities for creating and manipulating trace contexts with journey-specific information for testing.
 * Includes functions to generate Health, Care, and Plan journey trace contexts with appropriate span attributes,
 * user information, correlation IDs, and parent spans. Essential for testing distributed tracing across service boundaries
 * and verifying context propagation.
 *
 * @module @austa/tracing/test/utils
 */

import { Context, SpanContext, SpanKind, trace, context, ROOT_CONTEXT, SpanStatusCode } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { v4 as uuidv4 } from 'uuid';

import {
  JourneyType,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
  GamificationContext,
  HealthJourneyWithGamification,
  CareJourneyWithGamification,
  PlanJourneyWithGamification
} from '../../src/interfaces/journey-context.interface';
import {
  TraceContext,
  PropagationFormat,
  HttpTraceContextCarrier,
  KafkaTraceContextCarrier,
  TRACE_CONTEXT_KEYS,
  TRACE_CONTEXT_ATTRIBUTES
} from '../../src/interfaces/trace-context.interface';
import {
  COMMON_ATTRIBUTES,
  HEALTH_JOURNEY_ATTRIBUTES,
  CARE_JOURNEY_ATTRIBUTES,
  PLAN_JOURNEY_ATTRIBUTES,
  GAMIFICATION_ATTRIBUTES
} from '../../src/constants/span-attributes';

/**
 * Interface for trace context generation options
 */
export interface TraceContextOptions {
  /** User ID to associate with the trace context */
  userId?: string;
  
  /** Correlation ID for connecting logs, traces, and metrics */
  correlationId?: string;
  
  /** Session ID for the user session */
  sessionId?: string;
  
  /** Parent context to create a child context from */
  parentContext?: Context;
  
  /** Additional attributes to add to the trace context */
  attributes?: Record<string, string | number | boolean | string[]>;
  
  /** Whether to include gamification context */
  includeGamification?: boolean;
  
  /** Service name for the trace context */
  serviceName?: string;
}

/**
 * Interface for HTTP headers with trace context
 */
export interface TraceContextHeaders extends Record<string, string> {
  traceparent?: string;
  tracestate?: string;
  'x-correlation-id'?: string;
  'x-journey-id'?: string;
  'x-journey-type'?: string;
  'x-user-id'?: string;
  'x-session-id'?: string;
}

/**
 * Interface for gRPC metadata with trace context
 */
export interface TraceContextMetadata {
  get(key: string): string | Buffer | undefined;
  set(key: string, value: string | Buffer): void;
}

/**
 * W3C Trace Context propagator for injecting and extracting trace context
 */
const propagator = new W3CTraceContextPropagator();

/**
 * Generates a random trace ID for testing
 * @returns A 32-character hex string representing a trace ID
 */
export function generateTraceId(): string {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Generates a random span ID for testing
 * @returns A 16-character hex string representing a span ID
 */
export function generateSpanId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Generates a correlation ID for connecting logs, traces, and metrics
 * @returns A UUID string to use as correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Creates a mock span context for testing
 * @param traceId Optional trace ID (generated if not provided)
 * @param spanId Optional span ID (generated if not provided)
 * @returns A SpanContext object
 */
export function createMockSpanContext(traceId?: string, spanId?: string): SpanContext {
  return {
    traceId: traceId || generateTraceId(),
    spanId: spanId || generateSpanId(),
    traceFlags: 1, // Sampled
    isRemote: false,
    traceState: undefined
  };
}

/**
 * Creates a mock context with span for testing
 * @param spanContext Optional span context (created if not provided)
 * @returns A Context object with the span context
 */
export function createMockContext(spanContext?: SpanContext): Context {
  const mockSpanContext = spanContext || createMockSpanContext();
  return trace.setSpanContext(ROOT_CONTEXT, mockSpanContext);
}

/**
 * Creates a Health journey trace context for testing
 * @param options Options for creating the trace context
 * @returns A Context object with Health journey attributes
 */
export function createHealthJourneyContext(options: TraceContextOptions = {}): Context {
  const {
    userId = `user-${uuidv4()}`,
    correlationId = generateCorrelationId(),
    sessionId = `session-${uuidv4()}`,
    parentContext = createMockContext(),
    attributes = {},
    includeGamification = false,
    serviceName = 'health-service'
  } = options;

  // Create journey context
  const journeyId = `health-journey-${uuidv4()}`;
  const healthContext: HealthJourneyContext = {
    journeyId,
    journeyType: JourneyType.HEALTH,
    userId,
    sessionId,
    startedAt: new Date().toISOString(),
    currentStep: 'view-health-metrics',
    metricType: 'blood-pressure',
    dataSource: 'manual',
    deviceId: attributes.deviceId as string,
    goalId: attributes.goalId as string,
    medicalEventId: attributes.medicalEventId as string,
    integrationId: attributes.integrationId as string,
    fhirResourceType: attributes.fhirResourceType as string,
    isCritical: attributes.isCritical as boolean
  };

  // Add gamification context if requested
  let contextWithJourney = parentContext;
  if (includeGamification) {
    const gamificationContext: GamificationContext = {
      eventId: `event-${uuidv4()}`,
      eventType: 'health-metric-recorded',
      achievementId: attributes.achievementId as string,
      questId: attributes.questId as string,
      rewardId: attributes.rewardId as string,
      pointsEarned: attributes.pointsEarned as number || 10,
      userLevel: attributes.userLevel as number || 3,
      isLevelUp: attributes.isLevelUp as boolean || false,
      isCrossJourney: attributes.isCrossJourney as boolean || false,
      involvedJourneys: attributes.involvedJourneys as JourneyType[] || [JourneyType.HEALTH]
    };

    const healthWithGamification: HealthJourneyWithGamification = {
      ...healthContext,
      ...gamificationContext
    };

    // Add journey and gamification attributes to context
    contextWithJourney = addJourneyAttributesToContext(parentContext, healthWithGamification);
  } else {
    // Add only journey attributes to context
    contextWithJourney = addJourneyAttributesToContext(parentContext, healthContext);
  }

  // Add correlation ID and service attributes
  return context.with(
    context.setValues(contextWithJourney, {
      [TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID]: correlationId,
      [TRACE_CONTEXT_ATTRIBUTES.SERVICE_NAME]: serviceName,
      [SemanticAttributes.SERVICE_NAME]: serviceName
    }),
    () => {}
  );
}

/**
 * Creates a Care journey trace context for testing
 * @param options Options for creating the trace context
 * @returns A Context object with Care journey attributes
 */
export function createCareJourneyContext(options: TraceContextOptions = {}): Context {
  const {
    userId = `user-${uuidv4()}`,
    correlationId = generateCorrelationId(),
    sessionId = `session-${uuidv4()}`,
    parentContext = createMockContext(),
    attributes = {},
    includeGamification = false,
    serviceName = 'care-service'
  } = options;

  // Create journey context
  const journeyId = `care-journey-${uuidv4()}`;
  const careContext: CareJourneyContext = {
    journeyId,
    journeyType: JourneyType.CARE,
    userId,
    sessionId,
    startedAt: new Date().toISOString(),
    currentStep: 'schedule-appointment',
    appointmentId: attributes.appointmentId as string,
    providerId: attributes.providerId as string,
    telemedicineSessionId: attributes.telemedicineSessionId as string,
    medicationId: attributes.medicationId as string,
    treatmentPlanId: attributes.treatmentPlanId as string,
    symptomCheckerSessionId: attributes.symptomCheckerSessionId as string,
    urgencyLevel: attributes.urgencyLevel as string || 'normal',
    isFollowUp: attributes.isFollowUp as boolean || false
  };

  // Add gamification context if requested
  let contextWithJourney = parentContext;
  if (includeGamification) {
    const gamificationContext: GamificationContext = {
      eventId: `event-${uuidv4()}`,
      eventType: 'appointment-scheduled',
      achievementId: attributes.achievementId as string,
      questId: attributes.questId as string,
      rewardId: attributes.rewardId as string,
      pointsEarned: attributes.pointsEarned as number || 15,
      userLevel: attributes.userLevel as number || 2,
      isLevelUp: attributes.isLevelUp as boolean || false,
      isCrossJourney: attributes.isCrossJourney as boolean || false,
      involvedJourneys: attributes.involvedJourneys as JourneyType[] || [JourneyType.CARE]
    };

    const careWithGamification: CareJourneyWithGamification = {
      ...careContext,
      ...gamificationContext
    };

    // Add journey and gamification attributes to context
    contextWithJourney = addJourneyAttributesToContext(parentContext, careWithGamification);
  } else {
    // Add only journey attributes to context
    contextWithJourney = addJourneyAttributesToContext(parentContext, careContext);
  }

  // Add correlation ID and service attributes
  return context.with(
    context.setValues(contextWithJourney, {
      [TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID]: correlationId,
      [TRACE_CONTEXT_ATTRIBUTES.SERVICE_NAME]: serviceName,
      [SemanticAttributes.SERVICE_NAME]: serviceName
    }),
    () => {}
  );
}

/**
 * Creates a Plan journey trace context for testing
 * @param options Options for creating the trace context
 * @returns A Context object with Plan journey attributes
 */
export function createPlanJourneyContext(options: TraceContextOptions = {}): Context {
  const {
    userId = `user-${uuidv4()}`,
    correlationId = generateCorrelationId(),
    sessionId = `session-${uuidv4()}`,
    parentContext = createMockContext(),
    attributes = {},
    includeGamification = false,
    serviceName = 'plan-service'
  } = options;

  // Create journey context
  const journeyId = `plan-journey-${uuidv4()}`;
  const planContext: PlanJourneyContext = {
    journeyId,
    journeyType: JourneyType.PLAN,
    userId,
    sessionId,
    startedAt: new Date().toISOString(),
    currentStep: 'submit-claim',
    planId: attributes.planId as string,
    claimId: attributes.claimId as string,
    benefitId: attributes.benefitId as string,
    documentId: attributes.documentId as string,
    coverageId: attributes.coverageId as string,
    transactionId: attributes.transactionId as string,
    verificationStatus: attributes.verificationStatus as string || 'pending',
    isHighValue: attributes.isHighValue as boolean || false
  };

  // Add gamification context if requested
  let contextWithJourney = parentContext;
  if (includeGamification) {
    const gamificationContext: GamificationContext = {
      eventId: `event-${uuidv4()}`,
      eventType: 'claim-submitted',
      achievementId: attributes.achievementId as string,
      questId: attributes.questId as string,
      rewardId: attributes.rewardId as string,
      pointsEarned: attributes.pointsEarned as number || 20,
      userLevel: attributes.userLevel as number || 4,
      isLevelUp: attributes.isLevelUp as boolean || false,
      isCrossJourney: attributes.isCrossJourney as boolean || false,
      involvedJourneys: attributes.involvedJourneys as JourneyType[] || [JourneyType.PLAN]
    };

    const planWithGamification: PlanJourneyWithGamification = {
      ...planContext,
      ...gamificationContext
    };

    // Add journey and gamification attributes to context
    contextWithJourney = addJourneyAttributesToContext(parentContext, planWithGamification);
  } else {
    // Add only journey attributes to context
    contextWithJourney = addJourneyAttributesToContext(parentContext, planContext);
  }

  // Add correlation ID and service attributes
  return context.with(
    context.setValues(contextWithJourney, {
      [TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID]: correlationId,
      [TRACE_CONTEXT_ATTRIBUTES.SERVICE_NAME]: serviceName,
      [SemanticAttributes.SERVICE_NAME]: serviceName
    }),
    () => {}
  );
}

/**
 * Creates a cross-journey trace context for testing
 * @param journeyTypes Array of journey types to include
 * @param options Options for creating the trace context
 * @returns A Context object with multiple journey attributes
 */
export function createCrossJourneyContext(
  journeyTypes: JourneyType[],
  options: TraceContextOptions = {}
): Context {
  const {
    userId = `user-${uuidv4()}`,
    correlationId = generateCorrelationId(),
    sessionId = `session-${uuidv4()}`,
    parentContext = createMockContext(),
    includeGamification = true,
    serviceName = 'gamification-engine'
  } = options;

  // Start with parent context
  let resultContext = parentContext;

  // Add each journey type
  for (const journeyType of journeyTypes) {
    switch (journeyType) {
      case JourneyType.HEALTH:
        resultContext = createHealthJourneyContext({
          userId,
          correlationId,
          sessionId,
          parentContext: resultContext,
          includeGamification,
          serviceName,
          attributes: {
            ...options.attributes,
            isCrossJourney: true,
            involvedJourneys: journeyTypes
          }
        });
        break;
      case JourneyType.CARE:
        resultContext = createCareJourneyContext({
          userId,
          correlationId,
          sessionId,
          parentContext: resultContext,
          includeGamification,
          serviceName,
          attributes: {
            ...options.attributes,
            isCrossJourney: true,
            involvedJourneys: journeyTypes
          }
        });
        break;
      case JourneyType.PLAN:
        resultContext = createPlanJourneyContext({
          userId,
          correlationId,
          sessionId,
          parentContext: resultContext,
          includeGamification,
          serviceName,
          attributes: {
            ...options.attributes,
            isCrossJourney: true,
            involvedJourneys: journeyTypes
          }
        });
        break;
    }
  }

  return resultContext;
}

/**
 * Creates a child context from a parent context for testing parent-child relationships
 * @param parentContext The parent context
 * @param operationName Name of the operation for the child span
 * @param attributes Additional attributes for the child span
 * @returns A child Context object
 */
export function createChildContext(
  parentContext: Context,
  operationName: string,
  attributes: Record<string, string | number | boolean | string[]> = {}
): Context {
  // Extract parent span context
  const parentSpanContext = trace.getSpanContext(parentContext);
  if (!parentSpanContext) {
    throw new Error('Parent context does not contain a valid span context');
  }

  // Create child span context with same trace ID but new span ID
  const childSpanContext: SpanContext = {
    traceId: parentSpanContext.traceId,
    spanId: generateSpanId(),
    traceFlags: parentSpanContext.traceFlags,
    isRemote: false,
    traceState: parentSpanContext.traceState
  };

  // Create child context with operation name and attributes
  const childContext = trace.setSpanContext(parentContext, childSpanContext);
  return context.with(
    context.setValues(childContext, {
      [COMMON_ATTRIBUTES.OPERATION_NAME]: operationName,
      ...attributes
    }),
    () => {}
  );
}

/**
 * Injects trace context into HTTP headers for cross-service testing
 * @param ctx The context to inject
 * @returns HTTP headers with the trace context
 */
export function injectTraceContextIntoHeaders(ctx: Context): TraceContextHeaders {
  const headers: TraceContextHeaders = {};
  propagator.inject(ctx, headers);

  // Add correlation ID if present
  const correlationId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID);
  if (correlationId) {
    headers[TRACE_CONTEXT_KEYS.CORRELATION_ID] = correlationId;
  }

  // Add journey context if present
  const journeyId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.JOURNEY_ID);
  if (journeyId) {
    headers[TRACE_CONTEXT_KEYS.JOURNEY_ID] = journeyId;
  }

  const journeyType = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE);
  if (journeyType) {
    headers[TRACE_CONTEXT_KEYS.JOURNEY_TYPE] = journeyType;
  }

  const userId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.USER_ID);
  if (userId) {
    headers[TRACE_CONTEXT_KEYS.USER_ID] = userId;
  }

  const sessionId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.SESSION_ID);
  if (sessionId) {
    headers[TRACE_CONTEXT_KEYS.SESSION_ID] = sessionId;
  }

  // Add trace and span IDs explicitly for easier access in tests
  const spanContext = trace.getSpanContext(ctx);
  if (spanContext) {
    headers[TRACE_CONTEXT_KEYS.TRACE_ID] = spanContext.traceId;
    headers[TRACE_CONTEXT_KEYS.SPAN_ID] = spanContext.spanId;
  }

  return headers;
}

/**
 * Extracts trace context from HTTP headers for cross-service testing
 * @param headers HTTP headers containing the trace context
 * @returns A Context object with the extracted trace context
 */
export function extractTraceContextFromHeaders(headers: TraceContextHeaders): Context {
  // Extract the basic W3C trace context
  let ctx = propagator.extract(ROOT_CONTEXT, headers);

  // Add correlation ID if present
  if (headers[TRACE_CONTEXT_KEYS.CORRELATION_ID]) {
    ctx = context.with(
      context.setValue(
        ctx,
        TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID,
        headers[TRACE_CONTEXT_KEYS.CORRELATION_ID]
      ),
      () => {}
    );
  }

  // Add journey context if present
  if (headers[TRACE_CONTEXT_KEYS.JOURNEY_ID]) {
    ctx = context.with(
      context.setValue(
        ctx,
        TRACE_CONTEXT_ATTRIBUTES.JOURNEY_ID,
        headers[TRACE_CONTEXT_KEYS.JOURNEY_ID]
      ),
      () => {}
    );
  }

  if (headers[TRACE_CONTEXT_KEYS.JOURNEY_TYPE]) {
    ctx = context.with(
      context.setValue(
        ctx,
        TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE,
        headers[TRACE_CONTEXT_KEYS.JOURNEY_TYPE]
      ),
      () => {}
    );
  }

  if (headers[TRACE_CONTEXT_KEYS.USER_ID]) {
    ctx = context.with(
      context.setValue(
        ctx,
        TRACE_CONTEXT_ATTRIBUTES.USER_ID,
        headers[TRACE_CONTEXT_KEYS.USER_ID]
      ),
      () => {}
    );
  }

  if (headers[TRACE_CONTEXT_KEYS.SESSION_ID]) {
    ctx = context.with(
      context.setValue(
        ctx,
        TRACE_CONTEXT_ATTRIBUTES.SESSION_ID,
        headers[TRACE_CONTEXT_KEYS.SESSION_ID]
      ),
      () => {}
    );
  }

  return ctx;
}

/**
 * Injects trace context into gRPC metadata for cross-service testing
 * @param ctx The context to inject
 * @param metadata The gRPC metadata object to inject into
 */
export function injectTraceContextIntoMetadata(ctx: Context, metadata: TraceContextMetadata): void {
  // Convert context to headers first
  const headers = injectTraceContextIntoHeaders(ctx);

  // Add headers to metadata
  Object.entries(headers).forEach(([key, value]) => {
    metadata.set(key, value);
  });
}

/**
 * Extracts trace context from gRPC metadata for cross-service testing
 * @param metadata The gRPC metadata containing the trace context
 * @returns A Context object with the extracted trace context
 */
export function extractTraceContextFromMetadata(metadata: TraceContextMetadata): Context {
  // Convert metadata to headers
  const headers: TraceContextHeaders = {};

  // Extract W3C trace context headers
  const traceparent = metadata.get('traceparent');
  if (traceparent) {
    headers.traceparent = traceparent.toString();
  }

  const tracestate = metadata.get('tracestate');
  if (tracestate) {
    headers.tracestate = tracestate.toString();
  }

  // Extract custom headers
  const correlationId = metadata.get(TRACE_CONTEXT_KEYS.CORRELATION_ID);
  if (correlationId) {
    headers[TRACE_CONTEXT_KEYS.CORRELATION_ID] = correlationId.toString();
  }

  const journeyId = metadata.get(TRACE_CONTEXT_KEYS.JOURNEY_ID);
  if (journeyId) {
    headers[TRACE_CONTEXT_KEYS.JOURNEY_ID] = journeyId.toString();
  }

  const journeyType = metadata.get(TRACE_CONTEXT_KEYS.JOURNEY_TYPE);
  if (journeyType) {
    headers[TRACE_CONTEXT_KEYS.JOURNEY_TYPE] = journeyType.toString();
  }

  const userId = metadata.get(TRACE_CONTEXT_KEYS.USER_ID);
  if (userId) {
    headers[TRACE_CONTEXT_KEYS.USER_ID] = userId.toString();
  }

  const sessionId = metadata.get(TRACE_CONTEXT_KEYS.SESSION_ID);
  if (sessionId) {
    headers[TRACE_CONTEXT_KEYS.SESSION_ID] = sessionId.toString();
  }

  return extractTraceContextFromHeaders(headers);
}

/**
 * Creates a mock HTTP request with trace context headers
 * @param ctx The context to include in the request
 * @returns A mock HTTP request object with headers
 */
export function createMockHttpRequest(ctx: Context): { headers: TraceContextHeaders } {
  return {
    headers: injectTraceContextIntoHeaders(ctx)
  };
}

/**
 * Creates a mock HTTP response with trace context headers
 * @param ctx The context to include in the response
 * @returns A mock HTTP response object with headers
 */
export function createMockHttpResponse(ctx: Context): { headers: TraceContextHeaders; setHeader: (key: string, value: string) => void } {
  const headers: TraceContextHeaders = {};
  
  return {
    headers,
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    }
  };
}

/**
 * Simulates a request-scoped context for testing NestJS request-scoped providers
 * @param ctx The context to use for the request scope
 * @param fn The function to execute within the request scope
 * @returns The result of the function execution
 */
export function withRequestScope<T>(ctx: Context, fn: () => T): T {
  return context.with(ctx, fn);
}

/**
 * Verifies that a context contains the expected trace and span IDs
 * @param ctx The context to verify
 * @param expectedTraceId The expected trace ID (optional)
 * @param expectedSpanId The expected span ID (optional)
 * @returns True if the context contains the expected IDs, false otherwise
 */
export function verifyTraceContext(
  ctx: Context,
  expectedTraceId?: string,
  expectedSpanId?: string
): boolean {
  const spanContext = trace.getSpanContext(ctx);
  if (!spanContext) {
    return false;
  }

  if (expectedTraceId && spanContext.traceId !== expectedTraceId) {
    return false;
  }

  if (expectedSpanId && spanContext.spanId !== expectedSpanId) {
    return false;
  }

  return true;
}

/**
 * Verifies that a context contains the expected correlation ID
 * @param ctx The context to verify
 * @param expectedCorrelationId The expected correlation ID
 * @returns True if the context contains the expected correlation ID, false otherwise
 */
export function verifyCorrelationId(ctx: Context, expectedCorrelationId: string): boolean {
  const correlationId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID);
  return correlationId === expectedCorrelationId;
}

/**
 * Verifies that a context contains the expected journey context
 * @param ctx The context to verify
 * @param journeyType The expected journey type
 * @param journeyId The expected journey ID (optional)
 * @returns True if the context contains the expected journey context, false otherwise
 */
export function verifyJourneyContext(
  ctx: Context,
  journeyType: JourneyType,
  journeyId?: string
): boolean {
  const contextJourneyType = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE);
  if (contextJourneyType !== journeyType) {
    return false;
  }

  if (journeyId) {
    const contextJourneyId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.JOURNEY_ID);
    if (contextJourneyId !== journeyId) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a log context object with trace information for testing log correlation
 * @param ctx The trace context to extract information from
 * @returns A log context object with trace and span IDs
 */
export function createLogContext(ctx: Context): Record<string, string> {
  const spanContext = trace.getSpanContext(ctx);
  if (!spanContext) {
    return {};
  }

  const logContext: Record<string, string> = {
    'trace.id': spanContext.traceId,
    'span.id': spanContext.spanId
  };

  // Add correlation ID if present
  const correlationId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.CORRELATION_ID);
  if (correlationId) {
    logContext['correlation.id'] = correlationId;
  }

  // Add journey context if present
  const journeyId = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.JOURNEY_ID);
  if (journeyId) {
    logContext['journey.id'] = journeyId;
  }

  const journeyType = getContextValue(ctx, TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE);
  if (journeyType) {
    logContext['journey.type'] = journeyType;
  }

  return logContext;
}

/**
 * Helper function to add journey attributes to a context
 * @param ctx The context to add attributes to
 * @param journeyContext The journey context to add
 * @returns A new context with the journey attributes added
 */
function addJourneyAttributesToContext(
  ctx: Context,
  journeyContext: JourneyContext | HealthJourneyWithGamification | CareJourneyWithGamification | PlanJourneyWithGamification
): Context {
  let newContext = ctx;

  // Add base journey attributes
  newContext = context.with(
    context.setValues(newContext, {
      [TRACE_CONTEXT_ATTRIBUTES.JOURNEY_ID]: journeyContext.journeyId,
      [TRACE_CONTEXT_ATTRIBUTES.JOURNEY_TYPE]: journeyContext.journeyType,
      [TRACE_CONTEXT_ATTRIBUTES.USER_ID]: journeyContext.userId,
      [COMMON_ATTRIBUTES.JOURNEY_TYPE]: journeyContext.journeyType,
      [COMMON_ATTRIBUTES.JOURNEY_CONTEXT_ID]: journeyContext.journeyId,
      [COMMON_ATTRIBUTES.USER_ID]: journeyContext.userId
    }),
    () => {}
  );

  // Add session ID if present
  if (journeyContext.sessionId) {
    newContext = context.with(
      context.setValues(newContext, {
        [TRACE_CONTEXT_ATTRIBUTES.SESSION_ID]: journeyContext.sessionId,
        [COMMON_ATTRIBUTES.SESSION_ID]: journeyContext.sessionId
      }),
      () => {}
    );
  }

  // Add journey step if present
  if (journeyContext.currentStep) {
    newContext = context.with(
      context.setValue(newContext, COMMON_ATTRIBUTES.JOURNEY_STEP, journeyContext.currentStep),
      () => {}
    );
  }

  // Add journey-specific attributes based on journey type
  switch (journeyContext.journeyType) {
    case JourneyType.HEALTH:
      newContext = addHealthJourneyAttributes(newContext, journeyContext as HealthJourneyContext);
      break;
    case JourneyType.CARE:
      newContext = addCareJourneyAttributes(newContext, journeyContext as CareJourneyContext);
      break;
    case JourneyType.PLAN:
      newContext = addPlanJourneyAttributes(newContext, journeyContext as PlanJourneyContext);
      break;
  }

  // Add gamification attributes if present
  const gamificationContext = journeyContext as unknown as GamificationContext;
  if (gamificationContext.eventId) {
    newContext = addGamificationAttributes(newContext, gamificationContext);
  }

  return newContext;
}

/**
 * Helper function to add Health journey attributes to a context
 * @param ctx The context to add attributes to
 * @param healthContext The Health journey context to add
 * @returns A new context with the Health journey attributes added
 */
function addHealthJourneyAttributes(ctx: Context, healthContext: HealthJourneyContext): Context {
  const attributes: Record<string, string | boolean> = {};

  if (healthContext.metricType) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_TYPE] = healthContext.metricType;
  }

  if (healthContext.dataSource) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.DEVICE_CONNECTION_STATUS] = healthContext.dataSource;
  }

  if (healthContext.deviceId) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.DEVICE_ID] = healthContext.deviceId;
  }

  if (healthContext.goalId) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_ID] = healthContext.goalId;
  }

  if (healthContext.medicalEventId) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.HEALTH_PROFILE_ID] = healthContext.medicalEventId;
  }

  if (healthContext.integrationId) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.FHIR_RESOURCE_ID] = healthContext.integrationId;
  }

  if (healthContext.fhirResourceType) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.FHIR_RESOURCE_TYPE] = healthContext.fhirResourceType;
  }

  if (healthContext.isCritical !== undefined) {
    attributes[HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_VALUE] = healthContext.isCritical;
  }

  return context.with(context.setValues(ctx, attributes), () => {});
}

/**
 * Helper function to add Care journey attributes to a context
 * @param ctx The context to add attributes to
 * @param careContext The Care journey context to add
 * @returns A new context with the Care journey attributes added
 */
function addCareJourneyAttributes(ctx: Context, careContext: CareJourneyContext): Context {
  const attributes: Record<string, string | boolean> = {};

  if (careContext.appointmentId) {
    attributes[CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID] = careContext.appointmentId;
  }

  if (careContext.providerId) {
    attributes[CARE_JOURNEY_ATTRIBUTES.PROVIDER_ID] = careContext.providerId;
  }

  if (careContext.telemedicineSessionId) {
    attributes[CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_ID] = careContext.telemedicineSessionId;
  }

  if (careContext.medicationId) {
    attributes[CARE_JOURNEY_ATTRIBUTES.MEDICATION_ID] = careContext.medicationId;
  }

  if (careContext.treatmentPlanId) {
    attributes[CARE_JOURNEY_ATTRIBUTES.TREATMENT_ID] = careContext.treatmentPlanId;
  }

  if (careContext.symptomCheckerSessionId) {
    attributes[CARE_JOURNEY_ATTRIBUTES.SYMPTOM_CHECKER_SESSION_ID] = careContext.symptomCheckerSessionId;
  }

  if (careContext.urgencyLevel) {
    attributes[CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_STATUS] = careContext.urgencyLevel;
  }

  if (careContext.isFollowUp !== undefined) {
    attributes[CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_TYPE] = careContext.isFollowUp ? 'follow-up' : 'initial';
  }

  return context.with(context.setValues(ctx, attributes), () => {});
}

/**
 * Helper function to add Plan journey attributes to a context
 * @param ctx The context to add attributes to
 * @param planContext The Plan journey context to add
 * @returns A new context with the Plan journey attributes added
 */
function addPlanJourneyAttributes(ctx: Context, planContext: PlanJourneyContext): Context {
  const attributes: Record<string, string | boolean> = {};

  if (planContext.planId) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.PLAN_ID] = planContext.planId;
  }

  if (planContext.claimId) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.CLAIM_ID] = planContext.claimId;
  }

  if (planContext.benefitId) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.BENEFIT_ID] = planContext.benefitId;
  }

  if (planContext.documentId) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_ID] = planContext.documentId;
  }

  if (planContext.coverageId) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.COVERAGE_ID] = planContext.coverageId;
  }

  if (planContext.transactionId) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.CLAIM_TYPE] = planContext.transactionId;
  }

  if (planContext.verificationStatus) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.CLAIM_STATUS] = planContext.verificationStatus;
  }

  if (planContext.isHighValue !== undefined) {
    attributes[PLAN_JOURNEY_ATTRIBUTES.CLAIM_AMOUNT] = planContext.isHighValue ? 'high' : 'normal';
  }

  return context.with(context.setValues(ctx, attributes), () => {});
}

/**
 * Helper function to add Gamification attributes to a context
 * @param ctx The context to add attributes to
 * @param gamificationContext The Gamification context to add
 * @returns A new context with the Gamification attributes added
 */
function addGamificationAttributes(ctx: Context, gamificationContext: GamificationContext): Context {
  const attributes: Record<string, string | number | boolean | string[]> = {};

  if (gamificationContext.eventId) {
    attributes[GAMIFICATION_ATTRIBUTES.EVENT_ID] = gamificationContext.eventId;
  }

  if (gamificationContext.eventType) {
    attributes[GAMIFICATION_ATTRIBUTES.EVENT_TYPE] = gamificationContext.eventType;
  }

  if (gamificationContext.achievementId) {
    attributes[GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_ID] = gamificationContext.achievementId;
  }

  if (gamificationContext.questId) {
    attributes[GAMIFICATION_ATTRIBUTES.QUEST_ID] = gamificationContext.questId;
  }

  if (gamificationContext.rewardId) {
    attributes[GAMIFICATION_ATTRIBUTES.REWARD_ID] = gamificationContext.rewardId;
  }

  if (gamificationContext.pointsEarned !== undefined) {
    attributes[GAMIFICATION_ATTRIBUTES.GAMIFICATION_XP] = gamificationContext.pointsEarned;
  }

  if (gamificationContext.userLevel !== undefined) {
    attributes[GAMIFICATION_ATTRIBUTES.GAMIFICATION_LEVEL] = gamificationContext.userLevel;
  }

  if (gamificationContext.isLevelUp !== undefined) {
    attributes[GAMIFICATION_ATTRIBUTES.EVENT_TYPE] = gamificationContext.isLevelUp ? 'level-up' : 'regular';
  }

  if (gamificationContext.isCrossJourney !== undefined) {
    attributes[GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_TYPE] = gamificationContext.isCrossJourney ? 'cross-journey' : 'single-journey';
  }

  if (gamificationContext.involvedJourneys && gamificationContext.involvedJourneys.length > 0) {
    attributes[GAMIFICATION_ATTRIBUTES.EVENT_SOURCE] = gamificationContext.involvedJourneys.join(',');
  }

  return context.with(context.setValues(ctx, attributes), () => {});
}

/**
 * Helper function to get a value from a context
 * @param ctx The context to get the value from
 * @param key The key of the value to get
 * @returns The value if found, undefined otherwise
 */
function getContextValue(ctx: Context, key: string): string | undefined {
  return context.getValue(ctx, key) as string | undefined;
}