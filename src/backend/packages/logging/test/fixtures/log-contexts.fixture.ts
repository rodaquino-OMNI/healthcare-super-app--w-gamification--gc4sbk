import { JourneyType } from '../../src/interfaces/log-entry.interface';
import { LoggingContext } from '../../src/context/context.interface';
import { RequestContext } from '../../src/context/request-context.interface';
import { UserContext } from '../../src/context/user-context.interface';
import { JourneyContext } from '../../src/context/journey-context.interface';

/**
 * Sample logging context fixtures for testing context-aware logging capabilities.
 * These fixtures provide standardized test data for request contexts, user contexts,
 * transaction contexts, and combined contexts to ensure consistent and comprehensive
 * testing of the logging system's context enrichment features.
 */

// Base context with common fields
export const baseContext: LoggingContext = {
  requestId: '123e4567-e89b-12d3-a456-426614174000',
  traceId: '0af7651916cd43dd8448eb211c80319c',
  spanId: 'b7ad6b7169203331',
  parentSpanId: 'a7ad6b7169203331',
  timestamp: new Date('2023-06-15T14:30:45.123Z'),
  service: 'test-service',
  environment: 'test',
  version: '1.0.0',
  hostname: 'test-host-01',
};

// Request contexts
export const requestContexts = {
  /**
   * Basic HTTP GET request context
   */
  basicGet: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174001',
    ip: '192.168.1.1',
    method: 'GET',
    url: 'https://api.austa.health/health/metrics',
    path: '/health/metrics',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    parameters: { userId: '12345', metricType: 'steps' },
    headers: {
      'accept': 'application/json',
      'x-request-id': '123e4567-e89b-12d3-a456-426614174001',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    statusCode: 200,
    responseTime: 45,
    responseSize: 1024,
    referrer: 'https://app.austa.health/dashboard',
    journeyId: 'health-journey-123',
  } as RequestContext,

  /**
   * HTTP POST request context with form data
   */
  postWithFormData: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174002',
    ip: '192.168.1.2',
    method: 'POST',
    url: 'https://api.austa.health/care/appointments',
    path: '/care/appointments',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    parameters: { providerId: 'provider-123', date: '2023-06-20', time: '14:30' },
    headers: {
      'accept': 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      'x-request-id': '123e4567-e89b-12d3-a456-426614174002',
    },
    statusCode: 201,
    responseTime: 120,
    responseSize: 512,
    journeyId: 'care-journey-456',
  } as RequestContext,

  /**
   * HTTP PUT request context with JSON data
   */
  putWithJsonData: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174003',
    ip: '192.168.1.3',
    method: 'PUT',
    url: 'https://api.austa.health/plan/claims/claim-789',
    path: '/plan/claims/claim-789',
    userAgent: 'AustaHealthApp/1.2.3 (Android 11; Pixel 4)',
    parameters: { status: 'submitted', documents: ['doc-123', 'doc-456'] },
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'x-request-id': '123e4567-e89b-12d3-a456-426614174003',
      'authorization': '[REDACTED]',
    },
    statusCode: 200,
    responseTime: 85,
    responseSize: 768,
    journeyId: 'plan-journey-789',
  } as RequestContext,

  /**
   * HTTP request context with error response
   */
  requestWithError: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174004',
    ip: '192.168.1.4',
    method: 'DELETE',
    url: 'https://api.austa.health/health/devices/device-456',
    path: '/health/devices/device-456',
    userAgent: 'AustaHealthApp/1.2.3 (iOS 15.0; iPhone12,1)',
    parameters: {},
    headers: {
      'accept': 'application/json',
      'x-request-id': '123e4567-e89b-12d3-a456-426614174004',
    },
    statusCode: 404,
    responseTime: 30,
    responseSize: 256,
    journeyId: 'health-journey-456',
  } as RequestContext,
};

// User contexts
export const userContexts = {
  /**
   * Authenticated user with basic roles
   */
  authenticatedBasicUser: {
    ...baseContext,
    userId: 'user-12345',
    isAuthenticated: true,
    roles: ['user'],
    permissions: ['read:health', 'write:health', 'read:care'],
    preferences: {
      language: 'en-US',
      notificationChannels: ['email', 'push'],
      theme: 'light',
    },
    session: {
      sessionId: 'session-12345',
      startedAt: new Date('2023-06-15T14:00:00.000Z'),
      device: {
        type: 'mobile',
        os: 'iOS 15.0',
        client: 'AustaHealthApp/1.2.3',
      },
    },
    journeyContext: {
      currentJourney: 'health',
      journeyState: {
        lastViewedMetric: 'steps',
        activeGoals: 2,
      },
    },
  } as UserContext,

  /**
   * Authenticated user with admin roles
   */
  authenticatedAdminUser: {
    ...baseContext,
    userId: 'user-67890',
    isAuthenticated: true,
    roles: ['user', 'admin'],
    permissions: ['read:*', 'write:*', 'admin:*'],
    preferences: {
      language: 'pt-BR',
      notificationChannels: ['email', 'sms', 'push'],
      theme: 'dark',
    },
    session: {
      sessionId: 'session-67890',
      startedAt: new Date('2023-06-15T13:30:00.000Z'),
      device: {
        type: 'desktop',
        os: 'Windows 10',
        client: 'Chrome/91.0.4472.124',
      },
    },
    journeyContext: {
      currentJourney: 'cross_journey',
      journeyState: {
        adminDashboard: true,
        userManagement: true,
      },
    },
  } as UserContext,

  /**
   * Authenticated provider user
   */
  authenticatedProviderUser: {
    ...baseContext,
    userId: 'provider-12345',
    isAuthenticated: true,
    roles: ['provider'],
    permissions: ['read:care', 'write:care', 'provider:appointments'],
    preferences: {
      language: 'en-US',
      notificationChannels: ['email', 'sms'],
      availabilityHours: '9-17',
    },
    session: {
      sessionId: 'session-provider-12345',
      startedAt: new Date('2023-06-15T09:00:00.000Z'),
      device: {
        type: 'tablet',
        os: 'iPadOS 14.6',
        client: 'Safari/605.1.15',
      },
    },
    journeyContext: {
      currentJourney: 'care',
      journeyState: {
        activeAppointments: 5,
        pendingMessages: 2,
      },
    },
  } as UserContext,

  /**
   * Unauthenticated guest user
   */
  unauthenticatedUser: {
    ...baseContext,
    userId: 'anonymous',
    isAuthenticated: false,
    roles: ['guest'],
    permissions: ['read:public'],
    session: {
      sessionId: 'session-guest-12345',
      startedAt: new Date('2023-06-15T14:25:00.000Z'),
      device: {
        type: 'mobile',
        os: 'Android 11',
        client: 'Chrome/91.0.4472.124',
      },
    },
    journeyContext: {
      currentJourney: 'plan',
      journeyState: {
        viewingPublicPlans: true,
      },
    },
  } as UserContext,
};

// Transaction contexts
export const transactionContexts = {
  /**
   * Health journey transaction context
   */
  healthMetricRecording: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174005',
    userId: 'user-12345',
    journey: JourneyType.HEALTH,
    transactionId: 'tx-health-12345',
    operationName: 'recordHealthMetric',
    operationId: 'op-12345',
    correlationId: 'corr-12345',
    startTime: new Date('2023-06-15T14:30:00.000Z'),
    endTime: new Date('2023-06-15T14:30:01.500Z'),
    duration: 1500, // milliseconds
    status: 'success',
    journeyContext: {
      journeyId: 'health-journey-123',
      journeyStep: 'record-metric',
      metricType: 'steps',
      metricValue: 8500,
      deviceId: 'device-123',
      goalId: 'goal-456',
    },
  } as LoggingContext,

  /**
   * Care journey transaction context
   */
  careAppointmentBooking: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174006',
    userId: 'user-12345',
    journey: JourneyType.CARE,
    transactionId: 'tx-care-67890',
    operationName: 'bookAppointment',
    operationId: 'op-67890',
    correlationId: 'corr-67890',
    startTime: new Date('2023-06-15T14:35:00.000Z'),
    endTime: new Date('2023-06-15T14:35:02.200Z'),
    duration: 2200, // milliseconds
    status: 'success',
    journeyContext: {
      journeyId: 'care-journey-456',
      journeyStep: 'book-appointment',
      appointmentId: 'appt-123',
      providerId: 'provider-456',
      appointmentDate: '2023-06-20T14:30:00.000Z',
      appointmentType: 'virtual',
    },
  } as LoggingContext,

  /**
   * Plan journey transaction context
   */
  planClaimSubmission: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174007',
    userId: 'user-12345',
    journey: JourneyType.PLAN,
    transactionId: 'tx-plan-13579',
    operationName: 'submitClaim',
    operationId: 'op-13579',
    correlationId: 'corr-13579',
    startTime: new Date('2023-06-15T14:40:00.000Z'),
    endTime: new Date('2023-06-15T14:40:03.800Z'),
    duration: 3800, // milliseconds
    status: 'success',
    journeyContext: {
      journeyId: 'plan-journey-789',
      journeyStep: 'submit-claim',
      claimId: 'claim-789',
      planId: 'plan-123',
      claimAmount: 150.75,
      claimType: 'medical',
      documentIds: ['doc-123', 'doc-456'],
    },
  } as LoggingContext,

  /**
   * Cross-journey transaction context (gamification)
   */
  gamificationAchievementUnlocked: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174008',
    userId: 'user-12345',
    journey: JourneyType.CROSS_JOURNEY,
    transactionId: 'tx-gamification-24680',
    operationName: 'unlockAchievement',
    operationId: 'op-24680',
    correlationId: 'corr-24680',
    startTime: new Date('2023-06-15T14:45:00.000Z'),
    endTime: new Date('2023-06-15T14:45:00.500Z'),
    duration: 500, // milliseconds
    status: 'success',
    journeyContext: {
      journeyId: 'gamification-journey-123',
      journeyStep: 'unlock-achievement',
      achievementId: 'achievement-123',
      achievementName: 'Health Enthusiast',
      achievementPoints: 50,
      triggeringJourney: JourneyType.HEALTH,
      triggeringEvent: 'complete-health-goal',
    },
  } as LoggingContext,

  /**
   * Failed transaction context
   */
  failedTransaction: {
    ...baseContext,
    requestId: '123e4567-e89b-12d3-a456-426614174009',
    userId: 'user-12345',
    journey: JourneyType.CARE,
    transactionId: 'tx-care-97531',
    operationName: 'scheduleTeleconsultation',
    operationId: 'op-97531',
    correlationId: 'corr-97531',
    startTime: new Date('2023-06-15T14:50:00.000Z'),
    endTime: new Date('2023-06-15T14:50:01.200Z'),
    duration: 1200, // milliseconds
    status: 'failed',
    error: {
      code: 'PROVIDER_UNAVAILABLE',
      message: 'The selected provider is not available at the requested time',
      details: {
        providerId: 'provider-789',
        requestedTime: '2023-06-21T10:00:00.000Z',
      },
    },
    journeyContext: {
      journeyId: 'care-journey-789',
      journeyStep: 'schedule-teleconsultation',
      providerId: 'provider-789',
      appointmentDate: '2023-06-21T10:00:00.000Z',
      appointmentType: 'teleconsultation',
    },
  } as LoggingContext,
};

// Combined contexts (merging multiple context types)
export const combinedContexts = {
  /**
   * Combined request and user context
   */
  requestWithUserContext: {
    ...requestContexts.basicGet,
    ...userContexts.authenticatedBasicUser,
    requestId: '123e4567-e89b-12d3-a456-426614174010', // Ensure unique requestId
  } as LoggingContext,

  /**
   * Combined request, user, and transaction context for health journey
   */
  healthJourneyFullContext: {
    ...requestContexts.basicGet,
    ...userContexts.authenticatedBasicUser,
    ...transactionContexts.healthMetricRecording,
    requestId: '123e4567-e89b-12d3-a456-426614174011', // Ensure unique requestId
    journey: JourneyType.HEALTH,
    journeyContext: {
      journeyId: 'health-journey-123',
      journeyStep: 'record-metric',
      metricType: 'steps',
      metricValue: 8500,
      deviceId: 'device-123',
      goalId: 'goal-456',
      currentJourney: 'health',
      journeyState: {
        lastViewedMetric: 'steps',
        activeGoals: 2,
      },
    },
  } as LoggingContext,

  /**
   * Combined request, user, and transaction context for care journey
   */
  careJourneyFullContext: {
    ...requestContexts.postWithFormData,
    ...userContexts.authenticatedBasicUser,
    ...transactionContexts.careAppointmentBooking,
    requestId: '123e4567-e89b-12d3-a456-426614174012', // Ensure unique requestId
    journey: JourneyType.CARE,
    journeyContext: {
      journeyId: 'care-journey-456',
      journeyStep: 'book-appointment',
      appointmentId: 'appt-123',
      providerId: 'provider-456',
      appointmentDate: '2023-06-20T14:30:00.000Z',
      appointmentType: 'virtual',
      currentJourney: 'care',
    },
  } as LoggingContext,

  /**
   * Combined request, user, and transaction context for plan journey
   */
  planJourneyFullContext: {
    ...requestContexts.putWithJsonData,
    ...userContexts.authenticatedBasicUser,
    ...transactionContexts.planClaimSubmission,
    requestId: '123e4567-e89b-12d3-a456-426614174013', // Ensure unique requestId
    journey: JourneyType.PLAN,
    journeyContext: {
      journeyId: 'plan-journey-789',
      journeyStep: 'submit-claim',
      claimId: 'claim-789',
      planId: 'plan-123',
      claimAmount: 150.75,
      claimType: 'medical',
      documentIds: ['doc-123', 'doc-456'],
      currentJourney: 'plan',
    },
  } as LoggingContext,

  /**
   * Combined request, user, and transaction context for cross-journey (gamification)
   */
  gamificationFullContext: {
    ...requestContexts.basicGet,
    ...userContexts.authenticatedBasicUser,
    ...transactionContexts.gamificationAchievementUnlocked,
    requestId: '123e4567-e89b-12d3-a456-426614174014', // Ensure unique requestId
    journey: JourneyType.CROSS_JOURNEY,
    journeyContext: {
      journeyId: 'gamification-journey-123',
      journeyStep: 'unlock-achievement',
      achievementId: 'achievement-123',
      achievementName: 'Health Enthusiast',
      achievementPoints: 50,
      triggeringJourney: JourneyType.HEALTH,
      triggeringEvent: 'complete-health-goal',
      currentJourney: 'cross_journey',
    },
  } as LoggingContext,

  /**
   * Combined context with error information
   */
  errorContext: {
    ...requestContexts.requestWithError,
    ...userContexts.authenticatedBasicUser,
    ...transactionContexts.failedTransaction,
    requestId: '123e4567-e89b-12d3-a456-426614174015', // Ensure unique requestId
    journey: JourneyType.CARE,
    error: {
      name: 'ProviderUnavailableError',
      message: 'The selected provider is not available at the requested time',
      code: 'PROVIDER_UNAVAILABLE',
      statusCode: 400,
      isOperational: true,
      details: {
        providerId: 'provider-789',
        requestedTime: '2023-06-21T10:00:00.000Z',
        availableTimes: [
          '2023-06-21T11:00:00.000Z',
          '2023-06-21T14:00:00.000Z',
          '2023-06-22T10:00:00.000Z',
        ],
      },
      stack: 'Error: The selected provider is not available at the requested time\n    at ProviderService.checkAvailability (/src/services/provider.service.ts:125:11)\n    at AppointmentService.createAppointment (/src/services/appointment.service.ts:67:23)',
    },
    journeyContext: {
      journeyId: 'care-journey-789',
      journeyStep: 'schedule-teleconsultation',
      providerId: 'provider-789',
      appointmentDate: '2023-06-21T10:00:00.000Z',
      appointmentType: 'teleconsultation',
      currentJourney: 'care',
      error: true,
    },
  } as LoggingContext,
};

// Journey-specific context objects
export const journeyContexts = {
  /**
   * Health journey context
   */
  health: {
    journeyType: JourneyType.HEALTH,
    journeyId: 'health-journey-123',
    journeyStep: 'view-health-metrics',
    journeyState: 'active',
    transactionId: 'tx-health-12345',
    sessionId: 'session-12345',
    health: {
      metricType: 'steps',
      deviceId: 'device-123',
      goalId: 'goal-456',
      insightId: 'insight-789',
      fhirResourceType: 'Observation',
      fhirResourceId: 'obs-12345',
    },
    journeyMetadata: {
      lastSync: '2023-06-15T14:00:00.000Z',
      dataSource: 'wearable',
    },
  } as JourneyContext,

  /**
   * Care journey context
   */
  care: {
    journeyType: JourneyType.CARE,
    journeyId: 'care-journey-456',
    journeyStep: 'book-appointment',
    journeyState: 'active',
    transactionId: 'tx-care-67890',
    sessionId: 'session-12345',
    care: {
      appointmentId: 'appt-123',
      providerId: 'provider-456',
      sessionId: 'telemedicine-789',
      medicationId: 'med-123',
      treatmentPlanId: 'treatment-456',
      symptomCheckerSessionId: 'symptom-789',
    },
    journeyMetadata: {
      specialtyRequested: 'cardiology',
      urgencyLevel: 'routine',
    },
  } as JourneyContext,

  /**
   * Plan journey context
   */
  plan: {
    journeyType: JourneyType.PLAN,
    journeyId: 'plan-journey-789',
    journeyStep: 'submit-claim',
    journeyState: 'active',
    transactionId: 'tx-plan-13579',
    sessionId: 'session-12345',
    plan: {
      planId: 'plan-123',
      claimId: 'claim-789',
      benefitId: 'benefit-456',
      coverageId: 'coverage-123',
      documentId: 'document-456',
    },
    journeyMetadata: {
      claimType: 'medical',
      claimAmount: 150.75,
      submissionMethod: 'mobile',
    },
  } as JourneyContext,

  /**
   * Cross-journey context
   */
  crossJourney: {
    journeyType: JourneyType.CROSS_JOURNEY,
    journeyId: 'cross-journey-123',
    journeyStep: 'gamification-event',
    journeyState: 'active',
    transactionId: 'tx-cross-24680',
    sessionId: 'session-12345',
    crossJourney: {
      eventType: 'achievement_unlocked',
      achievementId: 'achievement-123',
      questId: 'quest-456',
      rewardId: 'reward-789',
      profileId: 'profile-123',
      leaderboardId: 'leaderboard-456',
    },
    journeyMetadata: {
      points: 50,
      level: 3,
      triggeringJourney: JourneyType.HEALTH,
    },
  } as JourneyContext,
};

// Context serialization test cases
export const serializationTestCases = {
  /**
   * Simple context with primitive values
   */
  simpleContext: {
    requestId: '123e4567-e89b-12d3-a456-426614174016',
    userId: 'user-12345',
    service: 'test-service',
    timestamp: new Date('2023-06-15T15:00:00.000Z'),
  } as LoggingContext,

  /**
   * Context with nested objects
   */
  nestedContext: {
    requestId: '123e4567-e89b-12d3-a456-426614174017',
    userId: 'user-12345',
    service: 'test-service',
    timestamp: new Date('2023-06-15T15:00:00.000Z'),
    metadata: {
      device: {
        type: 'mobile',
        os: 'iOS 15.0',
        version: '1.2.3',
      },
      location: {
        country: 'Brazil',
        region: 'São Paulo',
        timezone: 'America/Sao_Paulo',
      },
    },
  } as LoggingContext,

  /**
   * Context with arrays
   */
  arrayContext: {
    requestId: '123e4567-e89b-12d3-a456-426614174018',
    userId: 'user-12345',
    service: 'test-service',
    timestamp: new Date('2023-06-15T15:00:00.000Z'),
    tags: ['health', 'metric', 'steps'],
    metrics: [
      { name: 'steps', value: 8500, unit: 'count' },
      { name: 'distance', value: 6.2, unit: 'km' },
      { name: 'calories', value: 350, unit: 'kcal' },
    ],
  } as LoggingContext,

  /**
   * Context with circular references (for testing serialization handling)
   */
  circularContext: (() => {
    const context: any = {
      requestId: '123e4567-e89b-12d3-a456-426614174019',
      userId: 'user-12345',
      service: 'test-service',
      timestamp: new Date('2023-06-15T15:00:00.000Z'),
    };
    context.self = context; // Create circular reference
    context.nested = {
      parent: context, // Another circular reference
      name: 'nested',
    };
    return context as LoggingContext;
  })(),

  /**
   * Context with special types (Date, RegExp, etc.)
   */
  specialTypesContext: {
    requestId: '123e4567-e89b-12d3-a456-426614174020',
    userId: 'user-12345',
    service: 'test-service',
    timestamp: new Date('2023-06-15T15:00:00.000Z'),
    created: new Date('2023-06-15T14:00:00.000Z'),
    updated: new Date('2023-06-15T14:30:00.000Z'),
    pattern: /^user-\d+$/,
    buffer: Buffer.from('test data'),
    set: new Set(['value1', 'value2', 'value3']),
    map: new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]),
  } as any as LoggingContext,
};