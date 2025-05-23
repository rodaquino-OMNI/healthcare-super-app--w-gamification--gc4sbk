/**
 * Test utilities for creating and manipulating logging contexts with journey-specific information.
 * These utilities are essential for testing that logging properly incorporates journey context
 * into log entries across the AUSTA SuperApp's three distinct user journeys.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  JourneyContext,
  JourneyType,
  LoggingContext,
  RequestContext,
  UserContext,
} from '../../src/context';

/**
 * Creates a base logging context with common fields.
 * 
 * @param overrides Optional properties to override default values
 * @returns A LoggingContext object with default and overridden values
 */
export function createBaseContext(overrides: Partial<LoggingContext> = {}): LoggingContext {
  return {
    correlationId: uuidv4(),
    requestId: uuidv4(),
    serviceName: 'test-service',
    component: 'test-component',
    environment: 'test',
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Creates a Health journey context for testing.
 * 
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object for the Health journey
 */
export function createHealthJourneyContext(overrides: Partial<JourneyContext> = {}): JourneyContext {
  return {
    ...createBaseContext(),
    journeyType: JourneyType.HEALTH,
    resourceId: `health-record-${uuidv4()}`,
    action: 'view-health-metrics',
    step: 'metrics-dashboard',
    flowId: `health-flow-${uuidv4()}`,
    journeyData: {
      metricType: 'blood-pressure',
      deviceConnected: true,
      goalProgress: 75,
    },
    journeyMetadata: {
      version: '1.0',
      isNewUser: false,
      journeyStartTime: new Date(),
      featureFlags: {
        enableHealthInsights: true,
        enableDeviceSync: true,
      },
    },
    ...overrides,
  };
}

/**
 * Creates a Care journey context for testing.
 * 
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object for the Care journey
 */
export function createCareJourneyContext(overrides: Partial<JourneyContext> = {}): JourneyContext {
  return {
    ...createBaseContext(),
    journeyType: JourneyType.CARE,
    resourceId: `appointment-${uuidv4()}`,
    action: 'schedule-appointment',
    step: 'provider-selection',
    flowId: `appointment-flow-${uuidv4()}`,
    journeyData: {
      specialtyId: 'cardiology',
      providerPreference: 'nearest',
      urgency: 'routine',
    },
    journeyMetadata: {
      version: '1.0',
      isNewUser: false,
      journeyStartTime: new Date(),
      featureFlags: {
        enableTelemedicine: true,
        enableProviderRatings: true,
      },
    },
    ...overrides,
  };
}

/**
 * Creates a Plan journey context for testing.
 * 
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object for the Plan journey
 */
export function createPlanJourneyContext(overrides: Partial<JourneyContext> = {}): JourneyContext {
  return {
    ...createBaseContext(),
    journeyType: JourneyType.PLAN,
    resourceId: `claim-${uuidv4()}`,
    action: 'submit-claim',
    step: 'document-upload',
    flowId: `claim-flow-${uuidv4()}`,
    journeyData: {
      claimType: 'medical',
      providerName: 'Hospital São Paulo',
      claimAmount: 750.0,
    },
    journeyMetadata: {
      version: '1.0',
      isNewUser: false,
      journeyStartTime: new Date(),
      featureFlags: {
        enableDigitalCards: true,
        enableClaimTracking: true,
      },
    },
    ...overrides,
  };
}

/**
 * Creates a cross-journey context that spans multiple journeys.
 * 
 * @param primaryJourney The primary journey type
 * @param relatedJourneys Array of related journey types
 * @param overrides Optional properties to override default values
 * @returns A JourneyContext object that spans multiple journeys
 */
export function createCrossJourneyContext(
  primaryJourney: JourneyType,
  relatedJourneys: JourneyType[],
  overrides: Partial<JourneyContext> = {}
): JourneyContext {
  // Get the base context for the primary journey
  let baseContext: JourneyContext;
  
  switch (primaryJourney) {
    case JourneyType.HEALTH:
      baseContext = createHealthJourneyContext();
      break;
    case JourneyType.CARE:
      baseContext = createCareJourneyContext();
      break;
    case JourneyType.PLAN:
      baseContext = createPlanJourneyContext();
      break;
    default:
      baseContext = createHealthJourneyContext();
  }
  
  return {
    ...baseContext,
    isCrossJourney: true,
    relatedJourneys,
    transactionId: `cross-journey-${uuidv4()}`,
    journeyData: {
      ...baseContext.journeyData,
      crossJourneyReason: 'integrated-experience',
    },
    ...overrides,
  };
}

/**
 * Creates a user context for testing.
 * 
 * @param overrides Optional properties to override default values
 * @returns A UserContext object
 */
export function createUserContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    ...createBaseContext(),
    userId: `user-${uuidv4()}`,
    isAuthenticated: true,
    authMethod: 'jwt',
    authTimestamp: new Date(),
    roles: ['user'],
    permissions: ['read:health', 'write:health', 'read:care', 'read:plan'],
    preferredLanguage: 'pt-BR',
    preferredJourney: JourneyType.HEALTH,
    preferences: {
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
      },
      display: {
        theme: 'light',
        accessibility: {
          fontScale: 1.0,
          highContrast: false,
          screenReaderOptimized: false,
        },
      },
      privacy: {
        allowAnalytics: true,
        allowPersonalization: true,
        allowDataSharing: false,
      },
    },
    profile: {
      displayName: 'Test User',
      email: 'test.user@example.com',
      accountType: 'standard',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      onboardingCompleted: true,
    },
    device: {
      type: 'mobile',
      os: 'iOS 15.0',
      appVersion: '1.0.0',
      deviceId: `device-${uuidv4()}`,
    },
    ...overrides,
  };
}

/**
 * Creates a request context for testing.
 * 
 * @param overrides Optional properties to override default values
 * @returns A RequestContext object
 */
export function createRequestContext(overrides: Partial<RequestContext> = {}): RequestContext {
  const requestId = uuidv4();
  return {
    ...createBaseContext({ requestId }),
    requestId,
    ipAddress: '192.168.1.1',
    method: 'GET',
    url: 'https://api.austa.health/health/metrics',
    path: '/health/metrics',
    query: { limit: 10, sort: 'desc' },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    statusCode: 200,
    duration: 120,
    requestSize: 1024,
    responseSize: 8192,
    headers: {
      'content-type': 'application/json',
      'accept-language': 'pt-BR',
      'user-agent': 'AUSTA SuperApp/1.0.0',
    },
    routePattern: '/health/metrics',
    controller: 'HealthMetricsController',
    action: 'getMetrics',
    isApi: true,
    isMobile: true,
    referrer: 'https://app.austa.health/dashboard',
    performance: {
      dbTime: 45,
      externalApiTime: 30,
      processingTime: 25,
      renderTime: 20,
    },
    ...overrides,
  };
}

/**
 * Creates a combined context with journey, user, and request information.
 * 
 * @param journeyType The journey type to create context for
 * @param userOverrides Optional properties to override default user context values
 * @param requestOverrides Optional properties to override default request context values
 * @param journeyOverrides Optional properties to override default journey context values
 * @returns A combined context object with journey, user, and request information
 */
export function createCombinedContext(
  journeyType: JourneyType,
  userOverrides: Partial<UserContext> = {},
  requestOverrides: Partial<RequestContext> = {},
  journeyOverrides: Partial<JourneyContext> = {}
): LoggingContext {
  // Generate consistent IDs across all contexts
  const correlationId = uuidv4();
  const requestId = uuidv4();
  const userId = `user-${uuidv4()}`;
  const transactionId = `transaction-${uuidv4()}`;
  
  // Create the individual contexts with shared IDs
  let journeyContext: JourneyContext;
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyContext = createHealthJourneyContext({
        correlationId,
        requestId,
        userId,
        transactionId,
        ...journeyOverrides,
      });
      break;
    case JourneyType.CARE:
      journeyContext = createCareJourneyContext({
        correlationId,
        requestId,
        userId,
        transactionId,
        ...journeyOverrides,
      });
      break;
    case JourneyType.PLAN:
      journeyContext = createPlanJourneyContext({
        correlationId,
        requestId,
        userId,
        transactionId,
        ...journeyOverrides,
      });
      break;
    default:
      journeyContext = createHealthJourneyContext({
        correlationId,
        requestId,
        userId,
        transactionId,
        ...journeyOverrides,
      });
  }
  
  const userContext = createUserContext({
    correlationId,
    requestId,
    userId,
    transactionId,
    ...userOverrides,
  });
  
  const requestContext = createRequestContext({
    correlationId,
    requestId,
    userId,
    transactionId,
    ...requestOverrides,
  });
  
  // Merge all contexts, with journey context taking precedence
  return {
    ...requestContext,
    ...userContext,
    ...journeyContext,
  };
}

/**
 * Creates a trace context for testing distributed tracing.
 * 
 * @param overrides Optional properties to override default values
 * @returns A LoggingContext object with trace information
 */
export function createTraceContext(overrides: Partial<LoggingContext> = {}): LoggingContext {
  return {
    ...createBaseContext(),
    traceId: uuidv4(),
    spanId: uuidv4(),
    traceSampled: true,
    ...overrides,
  };
}

/**
 * Simulates context propagation across service boundaries.
 * 
 * @param sourceContext The original context from the source service
 * @param targetServiceName The name of the target service
 * @param targetComponent The component in the target service
 * @returns A new context for the target service with propagated correlation information
 */
export function propagateContext(
  sourceContext: LoggingContext,
  targetServiceName: string,
  targetComponent: string
): LoggingContext {
  return {
    ...createBaseContext(),
    correlationId: sourceContext.correlationId,
    requestId: sourceContext.requestId,
    userId: sourceContext.userId,
    transactionId: sourceContext.transactionId,
    traceId: sourceContext.traceId,
    spanId: uuidv4(), // New span ID for the target service
    parentSpanId: sourceContext.spanId, // Link to the source service's span
    serviceName: targetServiceName,
    component: targetComponent,
    // Preserve journey information if available
    ...(sourceContext as JourneyContext).journeyType ? {
      journeyType: (sourceContext as JourneyContext).journeyType,
      resourceId: (sourceContext as JourneyContext).resourceId,
      action: (sourceContext as JourneyContext).action,
    } : {},
  };
}

/**
 * Creates a context with error information for testing error logging.
 * 
 * @param error The error object or message
 * @param baseContext Optional base context to extend
 * @returns A LoggingContext object with error information
 */
export function createErrorContext(
  error: Error | string,
  baseContext: LoggingContext = createBaseContext()
): LoggingContext {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  return {
    ...baseContext,
    metadata: {
      ...baseContext.metadata,
      error: {
        message: errorObj.message,
        name: errorObj.name,
        stack: errorObj.stack,
        code: (errorObj as any).code,
        isTransient: false,
        isClientError: false,
        isExternalError: false,
      },
    },
  };
}