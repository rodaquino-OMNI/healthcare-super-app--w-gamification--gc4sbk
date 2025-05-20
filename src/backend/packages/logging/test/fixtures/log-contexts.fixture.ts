/**
 * @file Log Contexts Fixture
 * @description Provides sample logging context objects for testing context-aware logging capabilities.
 * Includes request contexts, user contexts, transaction contexts, and journey contexts for comprehensive testing.
 */

import { LoggingContext } from '../../src/context/context.interface';
import { 
  HttpMethod, 
  RequestContext, 
  SanitizedHeaders, 
  ResponseInfo 
} from '../../src/context/request-context.interface';
import { 
  AuthenticationStatus, 
  UserContext, 
  UserRole, 
  UserPermission, 
  UserPreferences 
} from '../../src/context/user-context.interface';
import { 
  JourneyContext, 
  JourneyType, 
  JourneyState, 
  CrossJourneyContext 
} from '../../src/context/journey-context.interface';

// Common base context properties used across all context types
const baseContext: LoggingContext = {
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2023-04-15T14:30:45.123Z',
  serviceName: 'api-gateway',
  applicationName: 'austa-superapp',
  environment: 'test',
  version: '1.2.3',
  traceId: 'trace-550e8400-e29b-41d4-a716-446655440000',
  spanId: 'span-550e8400-e29b-41d4-a716-446655440000',
};

/**
 * Request Context Fixtures
 * Sample HTTP request contexts for testing request-specific logging.
 */
export const requestContexts = {
  /**
   * Basic GET request context with minimal information
   */
  basicGetRequest: {
    ...baseContext,
    requestId: 'req-550e8400-e29b-41d4-a716-446655440000',
    method: HttpMethod.GET,
    path: '/api/health/metrics',
    ipAddress: '192.168.1.100',
  } as RequestContext,

  /**
   * Comprehensive POST request context with detailed information
   */
  detailedPostRequest: {
    ...baseContext,
    requestId: 'req-550e8400-e29b-41d4-a716-446655440001',
    method: HttpMethod.POST,
    url: 'https://api.austa.health/api/health/metrics',
    path: '/api/health/metrics',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'authorization': 'Bearer [REDACTED]',
    } as SanitizedHeaders,
    body: {
      metricType: 'heart-rate',
      value: 72,
      timestamp: '2023-04-15T14:30:40.000Z',
    },
    query: {
      includeHistory: 'true',
    },
    params: {
      userId: '123456',
    },
    apiVersion: 'v1',
    endpoint: 'HealthMetricsController',
    operation: 'recordMetric',
    timing: {
      receivedAt: '2023-04-15T14:30:44.000Z',
      middlewareDuration: 15,
      handlerDuration: 85,
      totalDuration: 100,
    },
    client: {
      type: 'mobile-app',
      appId: 'com.austa.health.mobile',
      version: '2.1.0',
      device: {
        type: 'mobile',
        os: 'iOS 14.4',
        browser: 'Safari',
      },
    },
    journeyInfo: {
      journeyType: 'health',
      journeyAction: 'record-metric',
      journeyContext: {
        metricType: 'heart-rate',
        goalId: 'goal-123',
      },
    },
    transaction: {
      transactionId: 'tx-550e8400-e29b-41d4-a716-446655440000',
      transactionType: 'health-metric-recording',
      transactionStep: 'validation',
    },
  } as RequestContext,

  /**
   * Failed request context with error response
   */
  failedRequest: {
    ...baseContext,
    requestId: 'req-550e8400-e29b-41d4-a716-446655440002',
    method: HttpMethod.PUT,
    path: '/api/health/goals/invalid-id',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    response: {
      statusCode: 404,
      statusMessage: 'Not Found',
      contentType: 'application/json',
      contentLength: 102,
      responseTime: 45,
    } as ResponseInfo,
    timing: {
      receivedAt: '2023-04-15T14:31:00.000Z',
      middlewareDuration: 10,
      handlerDuration: 35,
      totalDuration: 45,
    },
  } as RequestContext,

  /**
   * API Gateway request context with routing information
   */
  apiGatewayRequest: {
    ...baseContext,
    requestId: 'req-550e8400-e29b-41d4-a716-446655440003',
    method: HttpMethod.GET,
    path: '/api/care/appointments',
    ipAddress: '192.168.1.103',
    userAgent: 'PostmanRuntime/7.28.0',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'user-agent': 'PostmanRuntime/7.28.0',
      'x-api-key': '[REDACTED]',
    } as SanitizedHeaders,
    apiVersion: 'v1',
    endpoint: 'ApiGateway',
    operation: 'routeRequest',
    rateLimit: {
      limit: 100,
      remaining: 95,
      reset: 1618495845,
    },
  } as RequestContext,
};

/**
 * User Context Fixtures
 * Sample user contexts for testing user-specific logging.
 */
export const userContexts = {
  /**
   * Basic authenticated user context
   */
  basicAuthenticatedUser: {
    ...baseContext,
    userId: 'user-123456',
    authStatus: AuthenticationStatus.AUTHENTICATED,
    lastAuthenticatedAt: '2023-04-15T12:30:45.123Z',
  } as UserContext,

  /**
   * Comprehensive user context with detailed information
   */
  detailedUserContext: {
    ...baseContext,
    userId: 'user-789012',
    authStatus: AuthenticationStatus.AUTHENTICATED,
    lastAuthenticatedAt: '2023-04-15T13:45:22.456Z',
    authMethod: 'password',
    roles: [
      {
        id: 'role-1',
        name: 'patient',
        description: 'Regular patient user',
        assignedAt: '2023-01-10T10:00:00.000Z',
      },
      {
        id: 'role-2',
        name: 'premium-member',
        description: 'Premium membership user',
        assignedAt: '2023-03-15T14:30:00.000Z',
      },
    ] as UserRole[],
    permissions: [
      {
        id: 'perm-1',
        resource: 'health-metrics',
        action: 'read',
      },
      {
        id: 'perm-2',
        resource: 'health-metrics',
        action: 'write',
      },
      {
        id: 'perm-3',
        resource: 'appointments',
        action: 'read',
      },
      {
        id: 'perm-4',
        resource: 'appointments',
        action: 'write',
      },
    ] as UserPermission[],
    preferences: {
      language: 'pt-BR',
      theme: 'light',
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        subscribedTypes: ['appointment-reminder', 'health-alert', 'achievement'],
      },
      privacy: {
        dataSharingEnabled: true,
        analyticsEnabled: true,
        personalizationEnabled: true,
      },
      journeyPreferences: {
        health: {
          defaultMetricView: 'weekly',
          preferredDevices: ['fitbit', 'apple-health'],
        },
        care: {
          preferredAppointmentType: 'video',
          reminderTime: 60, // minutes before appointment
        },
      },
    } as UserPreferences,
    session: {
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440000',
      startedAt: '2023-04-15T13:45:00.000Z',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      device: {
        type: 'mobile',
        os: 'iOS 14.4',
        browser: 'Safari',
      },
    },
    account: {
      type: 'premium',
      status: 'active',
      createdAt: '2022-10-15T09:30:00.000Z',
      isVerified: true,
    },
    journeyHistory: {
      lastJourney: 'health',
      lastJourneyTimestamp: '2023-04-15T14:15:30.000Z',
      journeyInteractionCount: 12,
    },
    gamification: {
      level: 5,
      xp: 1250,
      achievements: ['first-metric', 'weekly-streak', 'appointment-master'],
      activeChallenges: ['daily-steps', 'meditation-week'],
    },
  } as UserContext,

  /**
   * Unauthenticated user context
   */
  unauthenticatedUser: {
    ...baseContext,
    userId: 'anonymous',
    authStatus: AuthenticationStatus.UNAUTHENTICATED,
    session: {
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440001',
      startedAt: '2023-04-15T14:20:00.000Z',
      ipAddress: '192.168.1.106',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  } as UserContext,

  /**
   * User with failed authentication
   */
  failedAuthUser: {
    ...baseContext,
    userId: 'user-345678',
    authStatus: AuthenticationStatus.FAILED,
    lastAuthenticatedAt: '2023-04-14T18:30:45.123Z', // Last successful auth was yesterday
    authMethod: 'password',
    session: {
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440002',
      startedAt: '2023-04-15T14:25:00.000Z',
      ipAddress: '192.168.1.107',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  } as UserContext,
};

/**
 * Transaction Context Fixtures
 * Sample transaction contexts for testing business transaction tracking.
 */
export interface TransactionContext extends LoggingContext {
  transactionId: string;
  operationId?: string;
  transactionType: string;
  transactionStatus: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  sourceSystem?: string;
  targetSystem?: string;
  businessProcessId?: string;
  businessProcessName?: string;
  businessProcessStep?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
  parentTransactionId?: string;
  childTransactions?: string[];
  relatedTransactions?: string[];
  journeyType?: JourneyType;
}

export const transactionContexts = {
  /**
   * Basic transaction context
   */
  basicTransaction: {
    ...baseContext,
    transactionId: 'tx-550e8400-e29b-41d4-a716-446655440000',
    transactionType: 'health-metric-recording',
    transactionStatus: 'completed',
    startTime: '2023-04-15T14:30:40.000Z',
    endTime: '2023-04-15T14:30:45.123Z',
    duration: 5123, // milliseconds
  } as TransactionContext,

  /**
   * Comprehensive transaction context with detailed information
   */
  detailedTransaction: {
    ...baseContext,
    transactionId: 'tx-550e8400-e29b-41d4-a716-446655440001',
    operationId: 'op-550e8400-e29b-41d4-a716-446655440001',
    transactionType: 'appointment-booking',
    transactionStatus: 'completed',
    startTime: '2023-04-15T14:35:00.000Z',
    endTime: '2023-04-15T14:35:10.456Z',
    duration: 10456, // milliseconds
    sourceSystem: 'mobile-app',
    targetSystem: 'care-service',
    businessProcessId: 'bp-550e8400-e29b-41d4-a716-446655440001',
    businessProcessName: 'telemedicine-appointment-booking',
    businessProcessStep: 'provider-selection',
    priority: 'high',
    retryCount: 0,
    maxRetries: 3,
    metadata: {
      appointmentId: 'appt-123456',
      providerId: 'provider-789',
      appointmentType: 'video',
      appointmentTime: '2023-04-20T10:00:00.000Z',
      specialtyId: 'cardiology',
    },
    journeyType: JourneyType.CARE,
  } as TransactionContext,

  /**
   * Failed transaction context
   */
  failedTransaction: {
    ...baseContext,
    transactionId: 'tx-550e8400-e29b-41d4-a716-446655440002',
    transactionType: 'claim-submission',
    transactionStatus: 'failed',
    startTime: '2023-04-15T14:40:00.000Z',
    endTime: '2023-04-15T14:40:05.789Z',
    duration: 5789, // milliseconds
    sourceSystem: 'web-app',
    targetSystem: 'plan-service',
    businessProcessId: 'bp-550e8400-e29b-41d4-a716-446655440002',
    businessProcessName: 'insurance-claim-submission',
    businessProcessStep: 'document-validation',
    priority: 'medium',
    retryCount: 3,
    maxRetries: 3,
    metadata: {
      claimId: 'claim-123456',
      errorCode: 'INVALID_DOCUMENT',
      errorMessage: 'The submitted document is not valid or is missing required information',
      documentIds: ['doc-123', 'doc-456'],
    },
    journeyType: JourneyType.PLAN,
  } as TransactionContext,

  /**
   * Parent-child transaction context
   */
  parentTransaction: {
    ...baseContext,
    transactionId: 'tx-550e8400-e29b-41d4-a716-446655440003',
    transactionType: 'health-assessment',
    transactionStatus: 'in-progress',
    startTime: '2023-04-15T14:45:00.000Z',
    sourceSystem: 'mobile-app',
    targetSystem: 'health-service',
    businessProcessId: 'bp-550e8400-e29b-41d4-a716-446655440003',
    businessProcessName: 'comprehensive-health-assessment',
    businessProcessStep: 'data-collection',
    priority: 'medium',
    childTransactions: [
      'tx-550e8400-e29b-41d4-a716-446655440004',
      'tx-550e8400-e29b-41d4-a716-446655440005',
      'tx-550e8400-e29b-41d4-a716-446655440006',
    ],
    journeyType: JourneyType.HEALTH,
  } as TransactionContext,

  /**
   * Child transaction context
   */
  childTransaction: {
    ...baseContext,
    transactionId: 'tx-550e8400-e29b-41d4-a716-446655440004',
    transactionType: 'health-metric-retrieval',
    transactionStatus: 'completed',
    startTime: '2023-04-15T14:45:05.000Z',
    endTime: '2023-04-15T14:45:07.123Z',
    duration: 2123, // milliseconds
    sourceSystem: 'health-service',
    targetSystem: 'health-metrics-db',
    businessProcessId: 'bp-550e8400-e29b-41d4-a716-446655440003',
    businessProcessName: 'comprehensive-health-assessment',
    businessProcessStep: 'retrieve-metrics',
    priority: 'medium',
    parentTransactionId: 'tx-550e8400-e29b-41d4-a716-446655440003',
    metadata: {
      metricTypes: ['heart-rate', 'blood-pressure', 'weight', 'steps'],
      timeRange: 'last-30-days',
    },
    journeyType: JourneyType.HEALTH,
  } as TransactionContext,
};

/**
 * Journey Context Fixtures
 * Sample journey contexts for testing journey-specific logging.
 */
export const journeyContexts = {
  /**
   * Health journey context
   */
  healthJourney: {
    ...baseContext,
    journeyType: JourneyType.HEALTH,
    journeyState: {
      journeySessionId: 'journey-550e8400-e29b-41d4-a716-446655440000',
      currentStep: 'metrics-dashboard',
      previousStep: 'login',
      stepDuration: 15000, // milliseconds
      metricType: 'heart-rate',
      viewMode: 'weekly',
    } as JourneyState,
    journeyFeatureFlags: {
      enableMetricGoals: true,
      enableDeviceSync: true,
      enableInsights: true,
    },
    journeyPerformance: {
      timeToInteractive: 1200, // milliseconds
      actionDuration: 350, // milliseconds
      apiCallCount: 3,
    },
    userInteraction: {
      interactionType: 'tab-selection',
      interactionTarget: 'heart-rate-tab',
      interactionResult: 'success',
      interactionDuration: 150, // milliseconds
    },
  } as JourneyContext,

  /**
   * Care journey context
   */
  careJourney: {
    ...baseContext,
    journeyType: JourneyType.CARE,
    journeyState: {
      journeySessionId: 'journey-550e8400-e29b-41d4-a716-446655440001',
      currentStep: 'provider-selection',
      previousStep: 'specialty-selection',
      stepDuration: 25000, // milliseconds
      specialtyId: 'cardiology',
      appointmentType: 'video',
    } as JourneyState,
    journeyFeatureFlags: {
      enableProviderRatings: true,
      enableVideoConsultation: true,
      enableInstantBooking: false,
    },
    businessTransaction: {
      transactionId: 'tx-550e8400-e29b-41d4-a716-446655440001',
      transactionType: 'appointment-booking',
      status: 'in-progress',
      startedAt: '2023-04-15T14:35:00.000Z',
      updatedAt: '2023-04-15T14:35:30.000Z',
      metadata: {
        specialtyId: 'cardiology',
        appointmentType: 'video',
      },
    },
  } as JourneyContext,

  /**
   * Plan journey context
   */
  planJourney: {
    ...baseContext,
    journeyType: JourneyType.PLAN,
    journeyState: {
      journeySessionId: 'journey-550e8400-e29b-41d4-a716-446655440002',
      currentStep: 'claim-submission',
      previousStep: 'claim-form',
      stepDuration: 45000, // milliseconds
      claimType: 'medical',
      claimAmount: 250.75,
    } as JourneyState,
    journeyFeatureFlags: {
      enableDigitalClaimSubmission: true,
      enableClaimTracking: true,
      enableReimbursementEstimation: true,
    },
    businessTransaction: {
      transactionId: 'tx-550e8400-e29b-41d4-a716-446655440002',
      transactionType: 'claim-submission',
      status: 'validation',
      startedAt: '2023-04-15T14:40:00.000Z',
      metadata: {
        claimId: 'claim-123456',
        claimType: 'medical',
        claimAmount: 250.75,
      },
    },
  } as JourneyContext,

  /**
   * Cross-journey context
   */
  crossJourney: {
    ...baseContext,
    journeyType: JourneyType.HEALTH,
    crossJourneyContext: {
      sourceJourney: JourneyType.HEALTH,
      targetJourney: JourneyType.CARE,
      flowId: 'flow-550e8400-e29b-41d4-a716-446655440000',
      startedAt: '2023-04-15T14:50:00.000Z',
      metadata: {
        reason: 'abnormal-heart-rate',
        metricId: 'metric-123456',
        recommendedSpecialty: 'cardiology',
      },
    } as CrossJourneyContext,
    journeyState: {
      journeySessionId: 'journey-550e8400-e29b-41d4-a716-446655440003',
      currentStep: 'health-alert-details',
      previousStep: 'metrics-dashboard',
      stepDuration: 10000, // milliseconds
      alertId: 'alert-123456',
      alertSeverity: 'medium',
    } as JourneyState,
  } as JourneyContext,
};

/**
 * Combined Context Fixtures
 * Sample combined contexts for testing context merging.
 */
export const combinedContexts = {
  /**
   * Request + User context
   */
  requestWithUser: {
    ...requestContexts.detailedPostRequest,
    ...userContexts.detailedUserContext,
    // Override any conflicting properties
    correlationId: '550e8400-e29b-41d4-a716-446655440010',
  } as RequestContext & UserContext,

  /**
   * Request + Transaction context
   */
  requestWithTransaction: {
    ...requestContexts.detailedPostRequest,
    ...transactionContexts.detailedTransaction,
    // Override any conflicting properties
    correlationId: '550e8400-e29b-41d4-a716-446655440011',
  } as RequestContext & TransactionContext,

  /**
   * User + Journey context
   */
  userWithJourney: {
    ...userContexts.detailedUserContext,
    ...journeyContexts.healthJourney,
    // Override any conflicting properties
    correlationId: '550e8400-e29b-41d4-a716-446655440012',
  } as UserContext & JourneyContext,

  /**
   * Complete context with all types
   */
  completeContext: {
    ...requestContexts.detailedPostRequest,
    ...userContexts.detailedUserContext,
    ...transactionContexts.detailedTransaction,
    ...journeyContexts.healthJourney,
    // Override any conflicting properties
    correlationId: '550e8400-e29b-41d4-a716-446655440013',
    journeyType: JourneyType.HEALTH,
  } as RequestContext & UserContext & TransactionContext & JourneyContext,
};

/**
 * Context Serialization Test Cases
 * Sample contexts with special cases for testing serialization.
 */
export const serializationTestCases = {
  /**
   * Context with circular references
   */
  circularReference: (() => {
    const context: any = {
      ...baseContext,
      correlationId: '550e8400-e29b-41d4-a716-446655440020',
      metadata: {
        name: 'circular-test',
        value: 42,
      },
    };
    // Create circular reference
    context.metadata.parent = context;
    return context;
  })(),

  /**
   * Context with nested objects and arrays
   */
  deeplyNested: {
    ...baseContext,
    correlationId: '550e8400-e29b-41d4-a716-446655440021',
    metadata: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deeply-nested-value',
                array: [1, 2, [3, 4, [5, 6, [7, 8]]]],
              },
            },
          },
        },
      },
    },
  } as LoggingContext,

  /**
   * Context with special characters and non-ASCII text
   */
  specialCharacters: {
    ...baseContext,
    correlationId: '550e8400-e29b-41d4-a716-446655440022',
    metadata: {
      specialChars: '!@#$%^&*()_+{}|:<>?~`-=[]\\;\\\',./',
      emoji: '😀🚀🔥💯',
      nonAscii: 'áéíóúñÁÉÍÓÚÑ',
      html: '<script>alert("test");</script>',
      json: '{"key": "value"}',
    },
  } as LoggingContext,

  /**
   * Context with very large values
   */
  largeValues: {
    ...baseContext,
    correlationId: '550e8400-e29b-41d4-a716-446655440023',
    metadata: {
      largeString: 'A'.repeat(10000),
      largeArray: Array.from({ length: 1000 }, (_, i) => i),
      largeObject: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])),
    },
  } as LoggingContext,
};