/**
 * Journey context fixtures for e2e testing of journey-specific log enrichment.
 * Contains sample journey context objects for the three main journeys (Health, Care, and Plan)
 * with realistic metadata and identifiers.
 */

import { JourneyType } from '../../../src/context/context.constants';

/**
 * Health journey context fixture with realistic health-specific attributes.
 * Used for testing health journey log enrichment.
 */
export const healthJourneyContext = {
  journeyType: JourneyType.HEALTH,
  journeyId: 'health-journey-123',
  correlationId: 'corr-id-health-9876543210',
  timestamp: new Date().toISOString(),
  serviceName: 'health-service',
  serviceVersion: '1.0.0',
  environment: 'test',
  user: {
    userId: 'user-12345',
    username: 'healthuser',
    roles: ['patient'],
    isAuthenticated: true,
    sessionId: 'session-health-67890'
  },
  request: {
    requestId: 'req-health-12345',
    method: 'GET',
    path: '/api/health/metrics',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
  },
  // Health journey specific attributes
  healthMetrics: {
    lastUpdated: new Date().toISOString(),
    metricTypes: ['weight', 'bloodPressure', 'heartRate', 'steps'],
    deviceConnected: true,
    deviceId: 'fitbit-device-789'
  },
  healthGoals: {
    activeGoals: 3,
    completedToday: 1,
    streakDays: 5
  },
  insights: {
    availableCount: 2,
    lastGeneratedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }
};

/**
 * Care journey context fixture with realistic care-specific attributes.
 * Used for testing care journey log enrichment.
 */
export const careJourneyContext = {
  journeyType: JourneyType.CARE,
  journeyId: 'care-journey-456',
  correlationId: 'corr-id-care-1234567890',
  timestamp: new Date().toISOString(),
  serviceName: 'care-service',
  serviceVersion: '1.0.0',
  environment: 'test',
  user: {
    userId: 'user-12345',
    username: 'careuser',
    roles: ['patient'],
    isAuthenticated: true,
    sessionId: 'session-care-67890'
  },
  request: {
    requestId: 'req-care-67890',
    method: 'POST',
    path: '/api/care/appointments',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
  },
  // Care journey specific attributes
  appointments: {
    upcoming: 2,
    pastCount: 5,
    nextAppointmentId: 'appt-123',
    nextAppointmentDate: new Date(Date.now() + 172800000).toISOString() // 2 days from now
  },
  medications: {
    active: 3,
    adherenceRate: 0.85,
    nextDoseDue: new Date(Date.now() + 14400000).toISOString() // 4 hours from now
  },
  providers: {
    primaryCareId: 'provider-789',
    recentlyVisited: ['provider-789', 'provider-456'],
    favoriteCount: 2
  },
  telemedicine: {
    eligibleForConsult: true,
    lastConsultDate: new Date(Date.now() - 604800000).toISOString() // 1 week ago
  }
};

/**
 * Plan journey context fixture with realistic plan-specific attributes.
 * Used for testing plan journey log enrichment.
 */
export const planJourneyContext = {
  journeyType: JourneyType.PLAN,
  journeyId: 'plan-journey-789',
  correlationId: 'corr-id-plan-0123456789',
  timestamp: new Date().toISOString(),
  serviceName: 'plan-service',
  serviceVersion: '1.0.0',
  environment: 'test',
  user: {
    userId: 'user-12345',
    username: 'planuser',
    roles: ['subscriber'],
    isAuthenticated: true,
    sessionId: 'session-plan-67890'
  },
  request: {
    requestId: 'req-plan-54321',
    method: 'GET',
    path: '/api/plan/benefits',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
  },
  // Plan journey specific attributes
  plan: {
    planId: 'premium-family-plan',
    coverageLevel: 'family',
    effectiveDate: '2023-01-01',
    expirationDate: '2023-12-31',
    status: 'active'
  },
  benefits: {
    totalAvailable: 12,
    recentlyUsed: 3,
    favoriteCount: 2
  },
  claims: {
    pendingCount: 2,
    approvedCount: 8,
    deniedCount: 1,
    recentClaimId: 'claim-456',
    recentClaimDate: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  documents: {
    totalCount: 15,
    recentlyViewed: ['doc-123', 'doc-456'],
    pendingSignature: 1
  }
};

/**
 * Cross-journey context fixture that combines elements from multiple journeys.
 * Used for testing logging in scenarios that span multiple journeys.
 */
export const crossJourneyContext = {
  journeyType: 'cross-journey',
  primaryJourney: JourneyType.HEALTH,
  secondaryJourneys: [JourneyType.CARE, JourneyType.PLAN],
  journeyId: 'cross-journey-123',
  correlationId: 'corr-id-cross-9876543210',
  timestamp: new Date().toISOString(),
  serviceName: 'api-gateway',
  serviceVersion: '1.0.0',
  environment: 'test',
  user: {
    userId: 'user-12345',
    username: 'crossuser',
    roles: ['patient', 'subscriber'],
    isAuthenticated: true,
    sessionId: 'session-cross-67890'
  },
  request: {
    requestId: 'req-cross-12345',
    method: 'GET',
    path: '/api/dashboard',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
  },
  // Cross-journey specific attributes
  journeyTransition: {
    fromJourney: JourneyType.HEALTH,
    toJourney: JourneyType.CARE,
    transitionReason: 'appointment_scheduling_from_health_insight',
    previousPath: '/health/metrics',
    destinationPath: '/care/appointments/new'
  },
  gamification: {
    eventType: 'cross_journey_achievement',
    achievementId: 'health_care_combo_1',
    pointsEarned: 50,
    currentLevel: 3
  }
};

/**
 * Collection of all journey contexts for easy import in tests.
 */
export const journeyContexts = {
  health: healthJourneyContext,
  care: careJourneyContext,
  plan: planJourneyContext,
  cross: crossJourneyContext
};