/**
 * @file Test Context Utilities
 * @description Provides utilities for creating and manipulating test contexts with journey-specific information.
 * These utilities are essential for testing that logging properly incorporates journey context into log entries.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  LoggingContext,
  JourneyContext,
  JourneyType,
  JourneyState,
  CrossJourneyContext,
  UserContext,
  AuthenticationStatus,
  UserRole,
  UserPermission,
  RequestContext,
  HttpMethod,
} from '../../src/context';

/**
 * Generates a random UUID for test contexts
 * @returns A random UUID string
 */
export const generateTestId = (): string => uuidv4();

/**
 * Generates an ISO 8601 timestamp for test contexts
 * @param offsetMinutes Optional minutes to offset from current time
 * @returns ISO 8601 timestamp string
 */
export const generateTestTimestamp = (offsetMinutes = 0): string => {
  const date = new Date();
  if (offsetMinutes) {
    date.setMinutes(date.getMinutes() + offsetMinutes);
  }
  return date.toISOString();
};

/**
 * Creates a base logging context with common properties
 * @returns A base LoggingContext object
 */
export const createBaseTestContext = (): LoggingContext => {
  return {
    correlationId: generateTestId(),
    timestamp: generateTestTimestamp(),
    serviceName: 'test-service',
    serviceInstanceId: `instance-${generateTestId().substring(0, 8)}`,
    applicationName: 'austa-superapp',
    environment: 'test',
    version: '1.0.0',
    traceId: generateTestId(),
    spanId: generateTestId().substring(0, 16),
  };
};

/**
 * Creates a test user context for testing user-specific logging
 * @param userId Optional user ID (generates random ID if not provided)
 * @param authStatus Optional authentication status
 * @param baseContext Optional base context to extend
 * @returns A UserContext object for testing
 */
export const createTestUserContext = (
  userId?: string,
  authStatus: AuthenticationStatus = AuthenticationStatus.AUTHENTICATED,
  baseContext?: Partial<LoggingContext>
): UserContext => {
  const base = { ...createBaseTestContext(), ...baseContext };
  const testUserId = userId || `user-${generateTestId().substring(0, 8)}`;
  
  const userRole: UserRole = {
    id: 'role-patient',
    name: 'Patient',
    description: 'Regular patient user with standard permissions',
    assignedAt: generateTestTimestamp(-60), // Assigned 1 hour ago
  };
  
  const userPermission: UserPermission = {
    id: 'perm-health-read',
    resource: 'health-data',
    action: 'read',
    conditions: { ownData: true },
  };
  
  return {
    ...base,
    userId: testUserId,
    authStatus,
    lastAuthenticatedAt: generateTestTimestamp(-5), // 5 minutes ago
    authMethod: 'password',
    roles: [userRole],
    permissions: [userPermission],
    preferences: {
      language: 'pt-BR',
      theme: 'light',
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        subscribedTypes: ['appointment', 'medication', 'achievement'],
      },
      privacy: {
        dataSharingEnabled: true,
        analyticsEnabled: true,
        personalizationEnabled: true,
      },
    },
    session: {
      sessionId: `session-${generateTestId().substring(0, 8)}`,
      startedAt: generateTestTimestamp(-30), // 30 minutes ago
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      device: {
        type: 'mobile',
        os: 'iOS 14.7.1',
        browser: 'Safari',
      },
    },
    account: {
      type: 'premium',
      status: 'active',
      createdAt: generateTestTimestamp(-90 * 24 * 60), // 90 days ago
      isVerified: true,
    },
    gamification: {
      level: 5,
      xp: 1250,
      achievements: ['first-login', 'complete-profile', 'first-appointment'],
      activeChallenges: ['daily-steps', 'medication-adherence'],
    },
  };
};

/**
 * Creates a test request context for testing request-specific logging
 * @param requestId Optional request ID (generates random ID if not provided)
 * @param method Optional HTTP method
 * @param path Optional request path
 * @param baseContext Optional base context to extend
 * @returns A RequestContext object for testing
 */
export const createTestRequestContext = (
  requestId?: string,
  method: HttpMethod = HttpMethod.GET,
  path = '/api/v1/health/metrics',
  baseContext?: Partial<LoggingContext>
): RequestContext => {
  const base = { ...createBaseTestContext(), ...baseContext };
  const testRequestId = requestId || `req-${generateTestId().substring(0, 8)}`;
  
  return {
    ...base,
    requestId: testRequestId,
    ipAddress: '192.168.1.100',
    method,
    url: `https://api.austa.health${path}`,
    path,
    query: { limit: '10', offset: '0' },
    params: { userId: 'current' },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      authorization: '[REDACTED]',
    },
    apiVersion: 'v1',
    endpoint: 'HealthMetricsController',
    operation: 'getMetrics',
    timing: {
      receivedAt: generateTestTimestamp(-0.1), // 100ms ago
      middlewareDuration: 5,
      handlerDuration: 45,
      totalDuration: 50,
    },
    client: {
      type: 'mobile-app',
      appId: 'com.austa.superapp',
      version: '1.5.0',
      device: {
        type: 'mobile',
        os: 'iOS 14.7.1',
        browser: 'Safari',
      },
    },
  };
};

/**
 * Creates a test journey state for the Health journey
 * @returns A JourneyState object for the Health journey
 */
export const createTestHealthJourneyState = (): JourneyState => {
  return {
    journeySessionId: `health-session-${generateTestId().substring(0, 8)}`,
    currentStep: 'health-dashboard',
    previousStep: 'app-home',
    stepDuration: 45000, // 45 seconds
    activeMetrics: ['steps', 'heart-rate', 'sleep'],
    lastSyncedDevice: 'apple-watch',
    lastSyncTime: generateTestTimestamp(-5), // 5 minutes ago
    goalProgress: {
      steps: 0.75, // 75% complete
      sleep: 0.6, // 60% complete
      water: 0.4, // 40% complete
    },
  };
};

/**
 * Creates a test journey state for the Care journey
 * @returns A JourneyState object for the Care journey
 */
export const createTestCareJourneyState = (): JourneyState => {
  return {
    journeySessionId: `care-session-${generateTestId().substring(0, 8)}`,
    currentStep: 'appointment-booking',
    previousStep: 'doctor-search',
    stepDuration: 120000, // 2 minutes
    selectedSpecialty: 'cardiology',
    selectedDoctor: 'dr-silva',
    appointmentType: 'video-consultation',
    availableDates: ['2023-06-15', '2023-06-16', '2023-06-17'],
    selectedTimeSlot: '2023-06-15T14:30:00Z',
  };
};

/**
 * Creates a test journey state for the Plan journey
 * @returns A JourneyState object for the Plan journey
 */
export const createTestPlanJourneyState = (): JourneyState => {
  return {
    journeySessionId: `plan-session-${generateTestId().substring(0, 8)}`,
    currentStep: 'coverage-details',
    previousStep: 'plan-summary',
    stepDuration: 60000, // 1 minute
    currentPlan: 'premium-family',
    coverageLevel: 'comprehensive',
    monthlyPremium: 450.00,
    dependents: 2,
    nextPaymentDate: '2023-07-01',
    recentClaims: 3,
    pendingApprovals: 1,
  };
};

/**
 * Creates a test cross-journey context for testing flows that span multiple journeys
 * @param sourceJourney Source journey type
 * @param targetJourney Target journey type
 * @returns A CrossJourneyContext object
 */
export const createTestCrossJourneyContext = (
  sourceJourney: JourneyType,
  targetJourney: JourneyType
): CrossJourneyContext => {
  return {
    sourceJourney,
    targetJourney,
    flowId: `flow-${generateTestId().substring(0, 8)}`,
    startedAt: generateTestTimestamp(-1), // 1 minute ago
    metadata: {
      reason: 'user-initiated',
      entryPoint: `${sourceJourney}-dashboard`,
      targetAction: `view-${targetJourney}-details`,
    },
  };
};

/**
 * Creates a test journey context for the Health journey
 * @param userId Optional user ID
 * @param baseContext Optional base context to extend
 * @returns A JourneyContext object for the Health journey
 */
export const createTestHealthJourneyContext = (
  userId?: string,
  baseContext?: Partial<LoggingContext>
): JourneyContext => {
  const base = { ...createBaseTestContext(), ...baseContext };
  const userContext = createTestUserContext(userId, AuthenticationStatus.AUTHENTICATED, base);
  
  return {
    ...userContext,
    journeyType: JourneyType.HEALTH,
    journeyState: createTestHealthJourneyState(),
    journeyFeatureFlags: {
      enableHealthInsights: true,
      enableDeviceIntegration: true,
      enableSocialSharing: false,
    },
    journeyPerformance: {
      timeToInteractive: 850, // 850ms
      actionDuration: 350, // 350ms
      apiCallCount: 3,
      renderTime: 250, // 250ms
    },
    businessTransaction: {
      transactionId: `health-tx-${generateTestId().substring(0, 8)}`,
      transactionType: 'health-data-sync',
      status: 'in-progress',
      startedAt: generateTestTimestamp(-0.5), // 30 seconds ago
      updatedAt: generateTestTimestamp(),
      metadata: {
        dataSource: 'apple-health',
        metrics: ['steps', 'heart-rate', 'sleep'],
        dataPoints: 24,
      },
    },
    userInteraction: {
      interactionType: 'swipe',
      interactionTarget: 'health-metrics-carousel',
      interactionResult: 'navigate-to-heart-rate',
      interactionDuration: 250, // 250ms
    },
  };
};

/**
 * Creates a test journey context for the Care journey
 * @param userId Optional user ID
 * @param baseContext Optional base context to extend
 * @returns A JourneyContext object for the Care journey
 */
export const createTestCareJourneyContext = (
  userId?: string,
  baseContext?: Partial<LoggingContext>
): JourneyContext => {
  const base = { ...createBaseTestContext(), ...baseContext };
  const userContext = createTestUserContext(userId, AuthenticationStatus.AUTHENTICATED, base);
  
  return {
    ...userContext,
    journeyType: JourneyType.CARE,
    journeyState: createTestCareJourneyState(),
    journeyFeatureFlags: {
      enableVideoConsultation: true,
      enablePrescriptionRenewal: true,
      enableInsuranceCoverage: true,
    },
    journeyPerformance: {
      timeToInteractive: 950, // 950ms
      actionDuration: 450, // 450ms
      apiCallCount: 5,
      renderTime: 300, // 300ms
    },
    businessTransaction: {
      transactionId: `care-tx-${generateTestId().substring(0, 8)}`,
      transactionType: 'appointment-booking',
      status: 'in-progress',
      startedAt: generateTestTimestamp(-2), // 2 minutes ago
      updatedAt: generateTestTimestamp(),
      metadata: {
        doctorId: 'dr-silva',
        specialty: 'cardiology',
        appointmentType: 'video-consultation',
        proposedDateTime: '2023-06-15T14:30:00Z',
      },
    },
    userInteraction: {
      interactionType: 'click',
      interactionTarget: 'book-appointment-button',
      interactionResult: 'navigate-to-confirmation',
      interactionDuration: 150, // 150ms
    },
  };
};

/**
 * Creates a test journey context for the Plan journey
 * @param userId Optional user ID
 * @param baseContext Optional base context to extend
 * @returns A JourneyContext object for the Plan journey
 */
export const createTestPlanJourneyContext = (
  userId?: string,
  baseContext?: Partial<LoggingContext>
): JourneyContext => {
  const base = { ...createBaseTestContext(), ...baseContext };
  const userContext = createTestUserContext(userId, AuthenticationStatus.AUTHENTICATED, base);
  
  return {
    ...userContext,
    journeyType: JourneyType.PLAN,
    journeyState: createTestPlanJourneyState(),
    journeyFeatureFlags: {
      enableClaimSubmission: true,
      enableCoverageCalculator: true,
      enableDependentManagement: true,
    },
    journeyPerformance: {
      timeToInteractive: 750, // 750ms
      actionDuration: 400, // 400ms
      apiCallCount: 4,
      renderTime: 200, // 200ms
    },
    businessTransaction: {
      transactionId: `plan-tx-${generateTestId().substring(0, 8)}`,
      transactionType: 'coverage-check',
      status: 'completed',
      startedAt: generateTestTimestamp(-1), // 1 minute ago
      updatedAt: generateTestTimestamp(),
      metadata: {
        procedureCode: 'PROC123',
        providerNetwork: 'in-network',
        estimatedCoverage: 0.8, // 80% coverage
        estimatedOutOfPocket: 120.00,
      },
    },
    userInteraction: {
      interactionType: 'form-submit',
      interactionTarget: 'coverage-calculator-form',
      interactionResult: 'display-coverage-estimate',
      interactionDuration: 350, // 350ms
    },
  };
};

/**
 * Creates a test context with cross-journey information
 * @param sourceJourney Source journey type
 * @param targetJourney Target journey type
 * @param userId Optional user ID
 * @returns A JourneyContext object with cross-journey information
 */
export const createTestCrossJourneyContext = (
  sourceJourney: JourneyType,
  targetJourney: JourneyType,
  userId?: string
): JourneyContext => {
  // Select the appropriate source journey context based on the journey type
  let journeyContext: JourneyContext;
  switch (sourceJourney) {
    case JourneyType.HEALTH:
      journeyContext = createTestHealthJourneyContext(userId);
      break;
    case JourneyType.CARE:
      journeyContext = createTestCareJourneyContext(userId);
      break;
    case JourneyType.PLAN:
      journeyContext = createTestPlanJourneyContext(userId);
      break;
    default:
      journeyContext = createTestHealthJourneyContext(userId);
  }
  
  // Add cross-journey context
  return {
    ...journeyContext,
    journeyType: sourceJourney,
    crossJourneyContext: createTestCrossJourneyContext(sourceJourney, targetJourney),
  };
};

/**
 * Merges multiple test contexts into a single context
 * @param contexts Array of contexts to merge
 * @returns A merged context object
 */
export const mergeTestContexts = (...contexts: Record<string, any>[]): Record<string, any> => {
  return contexts.reduce((merged, context) => {
    return { ...merged, ...context };
  }, {});
};

/**
 * Creates a complete test context with user, request, and journey information
 * @param journeyType Journey type
 * @param userId Optional user ID
 * @param requestId Optional request ID
 * @returns A complete context object for testing
 */
export const createCompleteTestContext = (
  journeyType: JourneyType,
  userId?: string,
  requestId?: string
): Record<string, any> => {
  const baseContext = createBaseTestContext();
  const userContext = createTestUserContext(userId, AuthenticationStatus.AUTHENTICATED, baseContext);
  const requestContext = createTestRequestContext(requestId, HttpMethod.GET, `/api/v1/${journeyType}/dashboard`, baseContext);
  
  let journeyContext: JourneyContext;
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyContext = createTestHealthJourneyContext(userId, baseContext);
      break;
    case JourneyType.CARE:
      journeyContext = createTestCareJourneyContext(userId, baseContext);
      break;
    case JourneyType.PLAN:
      journeyContext = createTestPlanJourneyContext(userId, baseContext);
      break;
    default:
      journeyContext = createTestHealthJourneyContext(userId, baseContext);
  }
  
  return mergeTestContexts(baseContext, userContext, requestContext, journeyContext);
};