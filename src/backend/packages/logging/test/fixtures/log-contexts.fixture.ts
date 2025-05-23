import { JourneyType } from '../../src/interfaces/log-entry.interface';

/**
 * Sample request context objects for testing context-aware logging capabilities.
 * These objects contain HTTP metadata, IP addresses, and user agents.
 */
export const requestContexts = {
  /**
   * Basic request context with minimal information
   */
  basic: {
    requestId: '123e4567-e89b-12d3-a456-426614174000',
    clientIp: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },

  /**
   * Mobile app request context
   */
  mobileApp: {
    requestId: '123e4567-e89b-12d3-a456-426614174001',
    clientIp: '10.0.0.1',
    userAgent: 'AUSTA-SuperApp/1.0.0 (iPhone; iOS 15.0; Scale/3.00)',
    appVersion: '1.0.0',
    deviceModel: 'iPhone 13',
    osVersion: 'iOS 15.0'
  },

  /**
   * Web app request context
   */
  webApp: {
    requestId: '123e4567-e89b-12d3-a456-426614174002',
    clientIp: '172.16.254.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36',
    referrer: 'https://austa-superapp.com/health/dashboard',
    language: 'pt-BR'
  },

  /**
   * API request context
   */
  apiRequest: {
    requestId: '123e4567-e89b-12d3-a456-426614174003',
    clientIp: '54.240.196.186',
    userAgent: 'PostmanRuntime/7.28.0',
    method: 'POST',
    path: '/api/v1/health/metrics',
    contentType: 'application/json'
  },

  /**
   * GraphQL request context
   */
  graphqlRequest: {
    requestId: '123e4567-e89b-12d3-a456-426614174004',
    clientIp: '54.240.196.187',
    userAgent: 'Apollo-Client/3.3.0',
    operationName: 'GetHealthMetrics',
    operationType: 'query',
    variables: { userId: '1234', metricType: 'HEART_RATE' }
  }
};

/**
 * Sample user context objects for testing context-aware logging capabilities.
 * These objects contain user IDs, roles, and permissions.
 */
export const userContexts = {
  /**
   * Basic user context with minimal information
   */
  basic: {
    userId: 'usr_123456789',
    sessionId: 'sess_abcdef123456'
  },

  /**
   * Patient user context
   */
  patient: {
    userId: 'usr_123456790',
    sessionId: 'sess_abcdef123457',
    roles: ['patient'],
    permissions: ['read:health', 'write:health', 'read:care', 'write:care', 'read:plan'],
    accountType: 'standard',
    accountCreatedAt: '2023-01-15T12:00:00Z'
  },

  /**
   * Healthcare provider user context
   */
  provider: {
    userId: 'usr_123456791',
    sessionId: 'sess_abcdef123458',
    roles: ['provider'],
    permissions: ['read:health', 'write:health', 'read:care', 'write:care', 'manage:appointments'],
    providerType: 'physician',
    specialization: 'cardiology',
    accountType: 'professional'
  },

  /**
   * Administrator user context
   */
  admin: {
    userId: 'usr_123456792',
    sessionId: 'sess_abcdef123459',
    roles: ['admin'],
    permissions: ['admin:health', 'admin:care', 'admin:plan', 'admin:system'],
    adminLevel: 'system',
    departmentId: 'dept_123'
  },

  /**
   * Anonymous user context
   */
  anonymous: {
    sessionId: 'sess_abcdef123460',
    isAnonymous: true,
    deviceFingerprint: 'fp_789xyz'
  }
};

/**
 * Sample transaction context objects for testing context-aware logging capabilities.
 * These objects contain operation IDs and correlation IDs for tracing business operations.
 */
export const transactionContexts = {
  /**
   * Basic transaction context with minimal information
   */
  basic: {
    traceId: 'trace_123456789',
    spanId: 'span_123456789',
    parentSpanId: 'span_123456780'
  },

  /**
   * Health metric recording transaction context
   */
  healthMetricRecording: {
    traceId: 'trace_123456790',
    spanId: 'span_123456791',
    parentSpanId: 'span_123456781',
    operationName: 'RecordHealthMetric',
    startTime: '2023-06-15T08:30:00Z',
    metricType: 'BLOOD_PRESSURE',
    sourceDevice: 'wearable_123'
  },

  /**
   * Appointment booking transaction context
   */
  appointmentBooking: {
    traceId: 'trace_123456791',
    spanId: 'span_123456792',
    parentSpanId: 'span_123456782',
    operationName: 'BookAppointment',
    startTime: '2023-06-15T09:15:00Z',
    providerId: 'provider_456',
    appointmentType: 'CONSULTATION'
  },

  /**
   * Insurance claim submission transaction context
   */
  claimSubmission: {
    traceId: 'trace_123456792',
    spanId: 'span_123456793',
    parentSpanId: 'span_123456783',
    operationName: 'SubmitClaim',
    startTime: '2023-06-15T10:00:00Z',
    claimType: 'MEDICAL',
    insuranceProvider: 'provider_789'
  },

  /**
   * Achievement unlocked transaction context
   */
  achievementUnlocked: {
    traceId: 'trace_123456793',
    spanId: 'span_123456794',
    parentSpanId: 'span_123456784',
    operationName: 'UnlockAchievement',
    startTime: '2023-06-15T11:30:00Z',
    achievementId: 'achievement_123',
    pointsAwarded: 50
  }
};

/**
 * Sample journey context objects for testing context-aware logging capabilities.
 * These objects contain journey-specific information for the three main journeys.
 */
export const journeyContexts = {
  /**
   * Health journey context - "Minha Saúde"
   */
  health: {
    type: JourneyType.HEALTH,
    resourceId: 'health_record_123',
    action: 'VIEW_METRICS',
    data: {
      metricType: 'HEART_RATE',
      timeRange: 'LAST_WEEK',
      includeGoals: true
    }
  },

  /**
   * Care journey context - "Cuidar-me Agora"
   */
  care: {
    type: JourneyType.CARE,
    resourceId: 'appointment_456',
    action: 'SCHEDULE_APPOINTMENT',
    data: {
      providerId: 'provider_789',
      appointmentType: 'VIDEO_CONSULTATION',
      scheduledTime: '2023-06-20T14:30:00Z'
    }
  },

  /**
   * Plan journey context - "Meu Plano & Benefícios"
   */
  plan: {
    type: JourneyType.PLAN,
    resourceId: 'claim_789',
    action: 'SUBMIT_CLAIM',
    data: {
      claimType: 'MEDICATION',
      amount: 125.50,
      receiptId: 'receipt_123',
      coverageId: 'coverage_456'
    }
  },

  /**
   * Gamification context (cross-journey)
   */
  gamification: {
    type: JourneyType.HEALTH, // Primary journey type
    resourceId: 'achievement_123',
    action: 'UNLOCK_ACHIEVEMENT',
    data: {
      achievementName: 'Health Tracker',
      pointsAwarded: 50,
      relatedJourneys: [JourneyType.HEALTH, JourneyType.CARE],
      level: 2
    }
  }
};

/**
 * Sample combined context objects for testing context merging capabilities.
 * These objects combine request, user, transaction, and journey contexts.
 */
export const combinedContexts = {
  /**
   * Health journey combined context
   */
  healthJourney: {
    ...requestContexts.mobileApp,
    ...userContexts.patient,
    ...transactionContexts.healthMetricRecording,
    journey: journeyContexts.health,
    metadata: {
      featureFlag: 'enhanced_health_metrics',
      abTestGroup: 'A',
      appSection: 'health_dashboard'
    }
  },

  /**
   * Care journey combined context
   */
  careJourney: {
    ...requestContexts.webApp,
    ...userContexts.patient,
    ...transactionContexts.appointmentBooking,
    journey: journeyContexts.care,
    metadata: {
      featureFlag: 'telemedicine_v2',
      abTestGroup: 'B',
      appSection: 'appointment_booking'
    }
  },

  /**
   * Plan journey combined context
   */
  planJourney: {
    ...requestContexts.apiRequest,
    ...userContexts.patient,
    ...transactionContexts.claimSubmission,
    journey: journeyContexts.plan,
    metadata: {
      featureFlag: 'enhanced_claims',
      abTestGroup: 'A',
      appSection: 'claims_submission'
    }
  },

  /**
   * Provider context in care journey
   */
  providerCareJourney: {
    ...requestContexts.webApp,
    ...userContexts.provider,
    ...transactionContexts.appointmentBooking,
    journey: journeyContexts.care,
    metadata: {
      featureFlag: 'provider_dashboard_v2',
      abTestGroup: 'C',
      appSection: 'appointment_management'
    }
  },

  /**
   * Admin context with system operations
   */
  adminSystemOperations: {
    ...requestContexts.apiRequest,
    ...userContexts.admin,
    ...transactionContexts.basic,
    metadata: {
      operationType: 'SYSTEM_CONFIGURATION',
      targetService: 'auth-service',
      changeType: 'UPDATE_ROLES'
    }
  },

  /**
   * Cross-journey gamification context
   */
  gamificationContext: {
    ...requestContexts.mobileApp,
    ...userContexts.patient,
    ...transactionContexts.achievementUnlocked,
    journey: journeyContexts.gamification,
    metadata: {
      featureFlag: 'gamification_v2',
      abTestGroup: 'A',
      appSection: 'achievements'
    }
  }
};

/**
 * Sample error context objects for testing error logging capabilities.
 * These objects contain structured error information for different scenarios.
 */
export const errorContexts = {
  /**
   * Basic error context
   */
  basic: {
    message: 'An error occurred',
    name: 'Error',
    stack: 'Error: An error occurred\n    at Function.Module._load (module.js:271:25)\n    at Module.require (module.js:353:17)\n    at require (internal/module.js:12:17)'
  },

  /**
   * Database error context
   */
  database: {
    message: 'Database connection failed',
    name: 'DatabaseError',
    code: 'ECONNREFUSED',
    isTransient: true,
    isClientError: false,
    isExternalError: false,
    stack: 'DatabaseError: Database connection failed\n    at PrismaClient.connect (prisma.js:125:23)\n    at HealthService.getMetrics (health.service.ts:45:12)'
  },

  /**
   * External API error context
   */
  externalApi: {
    message: 'Failed to fetch data from external API',
    name: 'ExternalApiError',
    code: 500,
    isTransient: true,
    isClientError: false,
    isExternalError: true,
    originalError: {
      status: 500,
      statusText: 'Internal Server Error',
      data: { error: 'Service temporarily unavailable' }
    },
    stack: 'ExternalApiError: Failed to fetch data from external API\n    at FhirService.fetchPatientData (fhir.service.ts:78:19)\n    at HealthService.getPatientRecord (health.service.ts:102:22)'
  },

  /**
   * Validation error context
   */
  validation: {
    message: 'Invalid input data',
    name: 'ValidationError',
    code: 'INVALID_INPUT',
    isTransient: false,
    isClientError: true,
    isExternalError: false,
    details: [
      { field: 'email', message: 'Must be a valid email address' },
      { field: 'password', message: 'Must be at least 8 characters long' }
    ],
    stack: 'ValidationError: Invalid input data\n    at validateUserInput (validation.ts:34:11)\n    at AuthService.registerUser (auth.service.ts:56:18)'
  },

  /**
   * Authorization error context
   */
  authorization: {
    message: 'Insufficient permissions',
    name: 'AuthorizationError',
    code: 'FORBIDDEN',
    isTransient: false,
    isClientError: true,
    isExternalError: false,
    requiredPermissions: ['admin:health'],
    userPermissions: ['read:health', 'write:health'],
    stack: 'AuthorizationError: Insufficient permissions\n    at AuthGuard.canActivate (auth.guard.ts:45:15)\n    at HealthController.updateHealthSettings (health.controller.ts:89:23)'
  }
};