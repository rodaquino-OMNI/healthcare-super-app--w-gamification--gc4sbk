import { JourneyType } from '../../src/interfaces/log-entry.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { JourneyContext, HealthJourneyContext, CareJourneyContext, PlanJourneyContext } from '../../src/context/journey-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { RequestContext } from '../../src/context/request-context.interface';

/**
 * Generates a random UUID v4 string for use in test contexts
 * @returns A random UUID v4 string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a base logging context with common fields for testing
 * @param overrides Optional properties to override default values
 * @returns A LoggingContext object with test values
 */
export function createBaseContext(overrides: Partial<LoggingContext> = {}): LoggingContext {
  return {
    requestId: generateUUID(),
    userId: generateUUID(),
    traceId: generateUUID(),
    spanId: generateUUID(),
    parentSpanId: generateUUID(),
    timestamp: new Date(),
    service: 'test-service',
    environment: 'test',
    version: '1.0.0',
    hostname: 'test-host',
    ...overrides
  };
}

/**
 * Creates a health journey context for testing
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object with health journey test values
 */
export function createHealthJourneyContext(overrides: Partial<JourneyContext> = {}): JourneyContext {
  const healthContext: HealthJourneyContext = {
    metricType: 'heart_rate',
    deviceId: generateUUID(),
    goalId: generateUUID(),
    insightId: generateUUID(),
    fhirResourceType: 'Observation',
    fhirResourceId: generateUUID(),
    ...overrides.health
  };

  return {
    ...createBaseContext({ journey: JourneyType.HEALTH }),
    journeyType: JourneyType.HEALTH,
    journeyId: generateUUID(),
    journeyStep: 'record_metric',
    journeyState: 'active',
    transactionId: generateUUID(),
    sessionId: generateUUID(),
    health: healthContext,
    journeyMetadata: {
      lastSyncTime: new Date().toISOString(),
      metricCount: 5,
      deviceType: 'smartwatch'
    },
    ...overrides
  };
}

/**
 * Creates a care journey context for testing
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object with care journey test values
 */
export function createCareJourneyContext(overrides: Partial<JourneyContext> = {}): JourneyContext {
  const careContext: CareJourneyContext = {
    appointmentId: generateUUID(),
    providerId: generateUUID(),
    sessionId: generateUUID(),
    medicationId: generateUUID(),
    treatmentPlanId: generateUUID(),
    symptomCheckerSessionId: generateUUID(),
    ...overrides.care
  };

  return {
    ...createBaseContext({ journey: JourneyType.CARE }),
    journeyType: JourneyType.CARE,
    journeyId: generateUUID(),
    journeyStep: 'schedule_appointment',
    journeyState: 'in_progress',
    transactionId: generateUUID(),
    sessionId: generateUUID(),
    care: careContext,
    journeyMetadata: {
      appointmentType: 'virtual',
      specialtyType: 'cardiology',
      urgency: 'routine'
    },
    ...overrides
  };
}

/**
 * Creates a plan journey context for testing
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object with plan journey test values
 */
export function createPlanJourneyContext(overrides: Partial<JourneyContext> = {}): JourneyContext {
  const planContext: PlanJourneyContext = {
    planId: generateUUID(),
    claimId: generateUUID(),
    benefitId: generateUUID(),
    coverageId: generateUUID(),
    documentId: generateUUID(),
    ...overrides.plan
  };

  return {
    ...createBaseContext({ journey: JourneyType.PLAN }),
    journeyType: JourneyType.PLAN,
    journeyId: generateUUID(),
    journeyStep: 'submit_claim',
    journeyState: 'pending',
    transactionId: generateUUID(),
    sessionId: generateUUID(),
    plan: planContext,
    journeyMetadata: {
      claimType: 'medical',
      claimAmount: 250.50,
      coveragePercentage: 80
    },
    ...overrides
  };
}

/**
 * Creates a user context for testing
 * @param overrides Optional properties to override default values
 * @returns A UserContext object with test values
 */
export function createUserContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    ...createBaseContext(),
    userId: overrides.userId || generateUUID(),
    isAuthenticated: true,
    roles: ['user', 'member'],
    permissions: ['read:health', 'write:health', 'read:care', 'read:plan'],
    preferences: {
      language: 'pt-BR',
      notificationChannels: ['email', 'push'],
      theme: 'light'
    },
    session: {
      sessionId: generateUUID(),
      startedAt: new Date(),
      device: {
        type: 'mobile',
        os: 'iOS',
        client: 'AUSTA SuperApp/1.0.0'
      }
    },
    journeyContext: {
      currentJourney: 'health',
      journeyState: {
        health: { activeGoals: 3 },
        care: { upcomingAppointments: 1 },
        plan: { pendingClaims: 2 }
      }
    },
    ...overrides
  };
}

/**
 * Creates a request context for testing
 * @param overrides Optional properties to override default values
 * @returns A RequestContext object with test values
 */
export function createRequestContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    ...createBaseContext(),
    requestId: overrides.requestId || generateUUID(),
    ip: '192.168.1.1',
    method: 'GET',
    url: 'https://api.austa.health/health/metrics',
    path: '/health/metrics',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    parameters: {
      userId: 'user-123',
      metricType: 'heart_rate',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    },
    headers: {
      'content-type': 'application/json',
      'accept-language': 'pt-BR',
      'x-request-id': generateUUID()
    },
    statusCode: 200,
    responseTime: 125,
    responseSize: 1024,
    referrer: 'https://app.austa.health/dashboard',
    journeyId: generateUUID(),
    ...overrides
  };
}

/**
 * Creates a context with trace correlation IDs for testing distributed tracing
 * @param overrides Optional properties to override default values
 * @returns A LoggingContext object with trace correlation test values
 */
export function createTraceContext(overrides: Partial<LoggingContext> = {}): LoggingContext {
  const traceId = overrides.traceId || generateUUID();
  const parentSpanId = overrides.parentSpanId || generateUUID();
  const spanId = overrides.spanId || generateUUID();
  
  return {
    ...createBaseContext(),
    traceId,
    parentSpanId,
    spanId,
    ...overrides
  };
}

/**
 * Creates a combined context with journey, user, and request information for comprehensive testing
 * @param journeyType The type of journey to create context for
 * @param overrides Optional properties to override default values
 * @returns A combined context object with journey, user, and request test values
 */
export function createCombinedContext(journeyType: JourneyType, overrides: Record<string, any> = {}): Record<string, any> {
  const userId = generateUUID();
  const requestId = generateUUID();
  const traceId = generateUUID();
  const spanId = generateUUID();
  
  let journeyContext: JourneyContext;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyContext = createHealthJourneyContext({
        userId,
        requestId,
        traceId,
        spanId,
        ...overrides.journey
      });
      break;
    case JourneyType.CARE:
      journeyContext = createCareJourneyContext({
        userId,
        requestId,
        traceId,
        spanId,
        ...overrides.journey
      });
      break;
    case JourneyType.PLAN:
      journeyContext = createPlanJourneyContext({
        userId,
        requestId,
        traceId,
        spanId,
        ...overrides.journey
      });
      break;
    default:
      journeyContext = createHealthJourneyContext({
        userId,
        requestId,
        traceId,
        spanId,
        ...overrides.journey
      });
  }
  
  const userContext = createUserContext({
    userId,
    requestId,
    traceId,
    spanId,
    ...overrides.user
  });
  
  const requestContext = createRequestContext({
    userId,
    requestId,
    traceId,
    spanId,
    ...overrides.request
  });
  
  return {
    journey: journeyContext,
    user: userContext,
    request: requestContext,
    ...overrides
  };
}

/**
 * Simulates context propagation across services for testing distributed logging
 * @param sourceContext The source context to propagate
 * @param targetService The name of the target service
 * @param overrides Optional properties to override in the propagated context
 * @returns A new context with propagated correlation IDs and updated service information
 */
export function propagateContext(
  sourceContext: LoggingContext,
  targetService: string,
  overrides: Partial<LoggingContext> = {}
): LoggingContext {
  // Generate a new span ID while keeping the same trace ID for proper trace correlation
  const newSpanId = generateUUID();
  
  return {
    ...sourceContext,
    service: targetService,
    parentSpanId: sourceContext.spanId,
    spanId: newSpanId,
    timestamp: new Date(),
    ...overrides
  };
}