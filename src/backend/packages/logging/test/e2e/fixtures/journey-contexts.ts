/**
 * Test fixtures for journey contexts used in E2E tests.
 * Contains sample journey context objects for the three main journeys
 * (Health, Care, and Plan) with realistic metadata and identifiers.
 */

import { JourneyType } from '../../../src/context/context.constants';
import { JourneyContext } from '../../../src/context/journey-context.interface';
import { UserContext } from '../../../src/context/user-context.interface';
import { LoggingContext } from '../../../src/context/context.interface';

/**
 * Base context with common properties used by all journey contexts
 */
const baseContext: LoggingContext = {
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
  requestId: 'req_b3d9b8b0-3a1d-4b5e-9c1a-8a7d5b6a8b7d',
  userId: 'usr_a7d5b6a8-b7d9-4b5e-9c1a-3a1d8a7d5b6a',
  sessionId: 'sess_9c1a3a1d-8a7d-5b6a-8b7d-9b5e4b5e9c1a',
  serviceName: 'test-service',
  component: 'JourneyContextTest',
  environment: 'test',
  timestamp: new Date('2023-06-15T10:30:00Z'),
  traceId: 'trace_e29b41d4-a716-4466-5544-b3d9b8b03a1d',
  spanId: 'span_5544b3d9-b8b0-3a1d-4b5e-9c1a8a7d5b6a',
  traceSampled: true,
  tags: ['test', 'e2e', 'journey-context'],
  metadata: {
    testRun: 'journey-context-e2e',
    testSuite: 'logging-context'
  }
};

/**
 * Base user context with authentication information
 */
const baseUserContext: UserContext = {
  ...baseContext,
  userId: 'usr_a7d5b6a8-b7d9-4b5e-9c1a-3a1d8a7d5b6a',
  isAuthenticated: true,
  authMethod: 'jwt',
  authTimestamp: new Date('2023-06-15T10:15:00Z'),
  roles: ['user', 'patient'],
  permissions: ['read:health', 'write:health', 'read:care', 'read:plan'],
  preferredLanguage: 'pt-BR',
  profile: {
    displayName: 'João Silva',
    email: 'joao.silva@example.com',
    accountType: 'standard',
    createdAt: new Date('2023-01-10T08:30:00Z'),
    onboardingCompleted: true
  },
  device: {
    type: 'mobile',
    os: 'Android 13',
    appVersion: '2.5.0',
    deviceId: 'android-a7d5b6a8b7d9'
  }
};

/**
 * Health Journey Context
 * Represents a user tracking health metrics and goals in the "Minha Saúde" journey
 */
export const healthJourneyContext: JourneyContext = {
  ...baseUserContext,
  journeyType: JourneyType.HEALTH,
  resourceId: 'health_metric_550e8400e29b',
  action: 'record-health-metric',
  step: 'metric-input',
  flowId: 'health-tracking-flow',
  transactionId: 'tx_health_550e8400e29b41d4',
  journeyData: {
    metricType: 'blood_pressure',
    metricValue: {
      systolic: 120,
      diastolic: 80
    },
    metricUnit: 'mmHg',
    recordedAt: new Date('2023-06-15T10:25:00Z'),
    source: 'manual_entry',
    relatedGoalId: 'goal_bp_normal_range',
    previousMetrics: [
      {
        date: new Date('2023-06-14T10:00:00Z'),
        systolic: 122,
        diastolic: 82
      },
      {
        date: new Date('2023-06-13T09:30:00Z'),
        systolic: 125,
        diastolic: 85
      }
    ],
    connectedDevices: [
      {
        deviceId: 'dev_bp_monitor_123',
        deviceType: 'blood_pressure_monitor',
        manufacturer: 'Omron',
        lastSyncDate: new Date('2023-06-14T18:30:00Z')
      }
    ]
  },
  journeyMetadata: {
    version: '2.3.0',
    isNewUser: false,
    journeyStartTime: new Date('2023-06-15T10:20:00Z'),
    featureFlags: {
      enableHealthInsights: true,
      enableDeviceSync: true,
      showTrends: true
    },
    healthProfile: {
      age: 42,
      gender: 'male',
      hasChronicConditions: true,
      activeGoals: 3,
      preferredMetrics: ['blood_pressure', 'weight', 'steps']
    }
  }
};

/**
 * Care Journey Context
 * Represents a user booking a medical appointment in the "Cuidar-me Agora" journey
 */
export const careJourneyContext: JourneyContext = {
  ...baseUserContext,
  journeyType: JourneyType.CARE,
  resourceId: 'appointment_a716446655440000',
  action: 'book-appointment',
  step: 'provider-selection',
  flowId: 'appointment-booking-flow',
  transactionId: 'tx_care_a716446655440000',
  journeyData: {
    appointmentType: 'consultation',
    specialtyId: 'specialty_cardiology',
    specialtyName: 'Cardiologia',
    providerId: 'provider_550e8400e29b41d4',
    providerName: 'Dr. Carlos Mendes',
    appointmentDate: new Date('2023-06-20T14:30:00Z'),
    appointmentDuration: 30,
    appointmentMode: 'in_person',
    facilityId: 'facility_hospital_austa',
    facilityName: 'Hospital AUSTA',
    facilityAddress: 'Av. Murchid Homsi, 1385 - Vila Toninho, São José do Rio Preto - SP',
    insuranceCoverage: true,
    patientSymptoms: ['chest_pain', 'shortness_of_breath'],
    previousAppointments: [
      {
        date: new Date('2023-03-15T10:00:00Z'),
        providerId: 'provider_550e8400e29b41d4',
        providerName: 'Dr. Carlos Mendes',
        specialtyName: 'Cardiologia',
        status: 'completed'
      }
    ]
  },
  journeyMetadata: {
    version: '2.1.0',
    isNewUser: false,
    journeyStartTime: new Date('2023-06-15T10:22:00Z'),
    featureFlags: {
      enableTelemedicine: true,
      showProviderRatings: true,
      enableFastBooking: true
    },
    careProfile: {
      preferredProviders: ['provider_550e8400e29b41d4'],
      preferredFacilities: ['facility_hospital_austa'],
      preferredAppointmentTimes: 'afternoon',
      hasActiveTreatmentPlan: true,
      medicationRemindersEnabled: true
    }
  }
};

/**
 * Plan Journey Context
 * Represents a user submitting an insurance claim in the "Meu Plano & Benefícios" journey
 */
export const planJourneyContext: JourneyContext = {
  ...baseUserContext,
  journeyType: JourneyType.PLAN,
  resourceId: 'claim_41d4a716446655440000',
  action: 'submit-claim',
  step: 'document-upload',
  flowId: 'claim-submission-flow',
  transactionId: 'tx_plan_41d4a716446655440000',
  journeyData: {
    claimType: 'medical_reimbursement',
    claimAmount: 350.75,
    claimCurrency: 'BRL',
    serviceDate: new Date('2023-06-10T15:45:00Z'),
    serviceProvider: 'Clínica São Lucas',
    serviceDescription: 'Consulta Dermatológica',
    receiptNumber: 'REC-2023-06-10-1234',
    documentCount: 2,
    documents: [
      {
        documentId: 'doc_receipt_550e8400e29b',
        documentType: 'receipt',
        fileName: 'recibo_clinica_sao_lucas.pdf',
        uploadStatus: 'completed'
      },
      {
        documentId: 'doc_prescription_a716446655',
        documentType: 'prescription',
        fileName: 'receita_medica.jpg',
        uploadStatus: 'in_progress'
      }
    ],
    insurancePlan: {
      planId: 'plan_premium_550e8400',
      planName: 'AUSTA Premium',
      memberNumber: 'MBR-123456789',
      coverageLevel: 'comprehensive'
    },
    previousClaims: [
      {
        claimId: 'claim_e29b41d4a71644665544',
        submissionDate: new Date('2023-04-05T09:15:00Z'),
        amount: 275.50,
        status: 'approved'
      }
    ]
  },
  journeyMetadata: {
    version: '2.2.0',
    isNewUser: false,
    journeyStartTime: new Date('2023-06-15T10:25:00Z'),
    featureFlags: {
      enableDigitalCard: true,
      enableClaimTracking: true,
      showCoverageDetails: true
    },
    planProfile: {
      planType: 'premium',
      renewalDate: new Date('2023-12-31T23:59:59Z'),
      dependents: 2,
      hasPendingClaims: true,
      preferredReimbursementMethod: 'bank_transfer'
    }
  }
};

/**
 * Cross-Journey Context
 * Represents a scenario that spans multiple journeys
 * (e.g., a health metric triggering a care recommendation)
 */
export const crossJourneyContext: JourneyContext = {
  ...baseUserContext,
  journeyType: JourneyType.HEALTH, // Primary journey
  resourceId: 'health_alert_550e8400e29b',
  action: 'health-alert-care-recommendation',
  flowId: 'health-to-care-flow',
  isCrossJourney: true,
  relatedJourneys: [JourneyType.CARE],
  transactionId: 'tx_cross_550e8400e29b41d4',
  journeyData: {
    alertType: 'abnormal_metric',
    metricType: 'blood_pressure',
    metricValue: {
      systolic: 160,
      diastolic: 100
    },
    alertSeverity: 'high',
    recommendationType: 'schedule_appointment',
    recommendedSpecialty: 'cardiology',
    recommendedTimeframe: 'within_7_days',
    relatedHealthMetricId: 'health_metric_550e8400e29b',
    relatedCareAppointmentId: 'appointment_recommendation_550e',
    userAction: 'viewed_recommendation'
  },
  journeyMetadata: {
    version: '2.4.0',
    isNewUser: false,
    journeyStartTime: new Date('2023-06-15T10:28:00Z'),
    featureFlags: {
      enableCrossJourneyRecommendations: true,
      enableHealthAlerts: true,
      enableOneClickAppointment: true
    },
    crossJourneyData: {
      originJourney: JourneyType.HEALTH,
      targetJourney: JourneyType.CARE,
      transitionTrigger: 'automatic_alert',
      previousCrossJourneyEvents: 2
    }
  }
};

/**
 * Gamification Context
 * Represents a user earning an achievement that spans multiple journeys
 */
export const gamificationContext: JourneyContext = {
  ...baseUserContext,
  journeyType: JourneyType.HEALTH, // Achievement earned in health journey
  resourceId: 'achievement_consistent_tracker',
  action: 'earn-achievement',
  flowId: 'gamification-flow',
  isCrossJourney: true,
  relatedJourneys: [JourneyType.CARE, JourneyType.PLAN],
  transactionId: 'tx_gamification_550e8400e29b41d4',
  journeyData: {
    achievementId: 'achievement_consistent_tracker',
    achievementName: 'Rastreador Consistente',
    achievementDescription: 'Registrou métricas de saúde por 7 dias consecutivos',
    pointsEarned: 150,
    currentLevel: 3,
    progressToNextLevel: 0.65,
    unlockedRewards: [
      {
        rewardId: 'reward_health_article_premium',
        rewardType: 'content_access',
        rewardName: 'Acesso a artigos premium sobre saúde'
      }
    ],
    relatedActivities: [
      {
        activityId: 'health_metric_20230609',
        journeyType: JourneyType.HEALTH,
        timestamp: new Date('2023-06-09T08:30:00Z')
      },
      {
        activityId: 'health_metric_20230610',
        journeyType: JourneyType.HEALTH,
        timestamp: new Date('2023-06-10T09:15:00Z')
      },
      {
        activityId: 'appointment_20230611',
        journeyType: JourneyType.CARE,
        timestamp: new Date('2023-06-11T14:00:00Z')
      },
      // Additional days omitted for brevity
    ]
  },
  journeyMetadata: {
    version: '2.5.0',
    isNewUser: false,
    journeyStartTime: new Date('2023-06-15T10:29:00Z'),
    featureFlags: {
      enableAchievementNotifications: true,
      showLeaderboard: true,
      enableRewards: true
    },
    gamificationProfile: {
      totalPoints: 2750,
      achievementsEarned: 12,
      currentStreak: 7,
      longestStreak: 14,
      leaderboardRank: 42
    }
  }
};

/**
 * Collection of all journey contexts for easy export
 */
export const journeyContexts = {
  health: healthJourneyContext,
  care: careJourneyContext,
  plan: planJourneyContext,
  cross: crossJourneyContext,
  gamification: gamificationContext
};

/**
 * Default export for convenience
 */
export default journeyContexts;