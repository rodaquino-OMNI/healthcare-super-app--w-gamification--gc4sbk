/**
 * @file Gamification Event Fixtures
 * @description Provides mock gamification events for testing the event processing pipeline.
 * Contains sample events from all three journeys (Health, Care, Plan) with proper schemas and metadata.
 * This file is essential for testing event routing, validation, and processing in the gamification engine.
 */

import { 
  EventType, 
  EventJourney, 
  GamificationEvent,
  EventVersion,
  ProcessGamificationEventDto
} from '@austa/interfaces/gamification/events';

/**
 * Standard event version for test fixtures
 */
export const STANDARD_EVENT_VERSION: EventVersion = {
  major: 1,
  minor: 0,
  patch: 0
};

/**
 * Creates a base gamification event with common properties
 * 
 * @param type - The event type
 * @param userId - The user ID
 * @param journey - The journey source
 * @param payload - The event payload
 * @returns A gamification event with standard properties
 */
export const createBaseEvent = (
  type: EventType,
  userId: string,
  journey: EventJourney,
  payload: Record<string, any>
): GamificationEvent => ({
  eventId: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  type,
  userId,
  journey,
  payload,
  version: STANDARD_EVENT_VERSION,
  createdAt: new Date().toISOString(),
  source: `${journey}-service`,
  correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
});

/**
 * Health Journey Event Fixtures
 */
export const healthEvents = {
  /**
   * Mock event for recording a health metric
   */
  metricRecorded: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.HEALTH_METRIC_RECORDED,
    userId,
    EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      source: 'manual',
      isWithinHealthyRange: true,
      metadata: {
        deviceId: null,
        location: 'home'
      }
    }
  ),

  /**
   * Mock event for achieving a health goal
   */
  goalAchieved: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.HEALTH_GOAL_ACHIEVED,
    userId,
    EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      goalId: 'goal_456',
      goalType: 'STEPS',
      targetValue: 10000,
      unit: 'steps',
      period: 'daily',
      completionPercentage: 100,
      isFirstTimeAchievement: true,
      metadata: {
        streakCount: 3,
        previousBest: 9500
      }
    }
  ),

  /**
   * Mock event for maintaining a health goal streak
   */
  goalStreakMaintained: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.HEALTH_GOAL_STREAK_MAINTAINED,
    userId,
    EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      goalId: 'goal_456',
      streakCount: 7,
      goalType: 'STEPS',
      metadata: {
        goalName: 'Daily Steps',
        milestone: true
      }
    }
  ),

  /**
   * Mock event for connecting a health device
   */
  deviceConnected: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.DEVICE_CONNECTED,
    userId,
    EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      deviceId: 'device_789',
      deviceType: 'Smartwatch',
      manufacturer: 'FitBit',
      metadata: {
        model: 'Versa 3',
        isFirstDevice: true
      }
    }
  ),

  /**
   * Mock event for completing a health assessment
   */
  assessmentCompleted: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.HEALTH_ASSESSMENT_COMPLETED,
    userId,
    EventJourney.HEALTH,
    {
      timestamp: new Date().toISOString(),
      assessmentId: 'assessment_101',
      assessmentType: 'Annual Health Check',
      completionTime: 720, // seconds
      metadata: {
        questionCount: 25,
        riskLevel: 'low'
      }
    }
  )
};

/**
 * Care Journey Event Fixtures
 */
export const careEvents = {
  /**
   * Mock event for booking an appointment
   */
  appointmentBooked: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.APPOINTMENT_BOOKED,
    userId,
    EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      appointmentId: 'appointment_101',
      appointmentType: 'Consultation',
      providerId: 'provider_202',
      isFirstAppointment: false,
      metadata: {
        specialtyId: 'specialty_303',
        specialtyName: 'Cardiologia',
        scheduledDate: new Date(Date.now() + 86400000).toISOString() // tomorrow
      }
    }
  ),

  /**
   * Mock event for attending an appointment
   */
  appointmentAttended: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.APPOINTMENT_ATTENDED,
    userId,
    EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      appointmentId: 'appointment_101',
      appointmentType: 'Consultation',
      providerId: 'provider_202',
      isFirstAppointment: false,
      metadata: {
        duration: 30, // minutes
        followUpRequired: true,
        followUpTimeframe: '2 weeks'
      }
    }
  ),

  /**
   * Mock event for taking medication
   */
  medicationTaken: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.MEDICATION_TAKEN,
    userId,
    EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      medicationId: 'medication_505',
      medicationName: 'Atorvastatina',
      takenOnTime: true,
      metadata: {
        dosage: '20mg',
        scheduledTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        remainingDoses: 25
      }
    }
  ),

  /**
   * Mock event for medication adherence streak
   */
  medicationAdherenceStreak: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.MEDICATION_ADHERENCE_STREAK,
    userId,
    EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      medicationId: 'medication_505',
      medicationName: 'Atorvastatina',
      streakCount: 30,
      metadata: {
        milestone: true,
        adherencePercentage: 100
      }
    }
  ),

  /**
   * Mock event for completing a telemedicine session
   */
  telemedicineCompleted: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.TELEMEDICINE_SESSION_COMPLETED,
    userId,
    EventJourney.CARE,
    {
      timestamp: new Date().toISOString(),
      sessionId: 'telemedicine_606',
      providerId: 'provider_202',
      durationMinutes: 15,
      isFirstSession: false,
      metadata: {
        specialtyName: 'Dermatologia',
        connectionQuality: 'good',
        prescriptionIssued: true
      }
    }
  )
};

/**
 * Plan Journey Event Fixtures
 */
export const planEvents = {
  /**
   * Mock event for submitting a claim
   */
  claimSubmitted: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.CLAIM_SUBMITTED,
    userId,
    EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      claimId: 'claim_707',
      claimType: 'Consulta Médica',
      amount: 250.00,
      metadata: {
        providerId: 'provider_202',
        serviceDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        documentCount: 3,
        isComplete: true
      }
    }
  ),

  /**
   * Mock event for claim approval
   */
  claimApproved: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.CLAIM_APPROVED,
    userId,
    EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      claimId: 'claim_707',
      claimType: 'Consulta Médica',
      amount: 250.00,
      metadata: {
        approvalDate: new Date().toISOString(),
        reimbursementAmount: 200.00,
        processingTime: 48, // hours
        paymentMethod: 'bank_transfer'
      }
    }
  ),

  /**
   * Mock event for uploading a claim document
   */
  claimDocumentUploaded: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.CLAIM_DOCUMENT_UPLOADED,
    userId,
    EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      claimId: 'claim_707',
      claimType: 'Consulta Médica',
      documentCount: 1,
      metadata: {
        documentType: 'receipt',
        fileSize: 1024 * 1024 * 2, // 2MB
        fileFormat: 'pdf',
        uploadComplete: true
      }
    }
  ),

  /**
   * Mock event for utilizing a benefit
   */
  benefitUtilized: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.BENEFIT_UTILIZED,
    userId,
    EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      benefitId: 'benefit_808',
      benefitType: 'Desconto em Farmácia',
      value: 45.50,
      metadata: {
        location: 'Farmácia Popular',
        productCategory: 'Medication',
        savingsPercentage: 15
      }
    }
  ),

  /**
   * Mock event for reviewing coverage
   */
  coverageReviewed: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.COVERAGE_REVIEWED,
    userId,
    EventJourney.PLAN,
    {
      timestamp: new Date().toISOString(),
      planId: 'plan_909',
      metadata: {
        coverageType: 'medical',
        reviewDuration: 300, // seconds
        detailsViewed: ['deductibles', 'copays', 'network']
      }
    }
  )
};

/**
 * Cross-Journey Event Fixtures
 */
export const crossJourneyEvents = {
  /**
   * Mock event for unlocking an achievement
   */
  achievementUnlocked: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.ACHIEVEMENT_UNLOCKED,
    userId,
    EventJourney.CROSS_JOURNEY,
    {
      timestamp: new Date().toISOString(),
      achievementId: 'achievement_101',
      achievementTitle: 'Monitor de Saúde',
      achievementDescription: 'Registre suas métricas de saúde por 7 dias consecutivos',
      xpEarned: 100,
      relatedJourney: EventJourney.HEALTH,
      metadata: {
        level: 1,
        badgeUrl: 'https://assets.austa.com.br/badges/health-monitor-1.png',
        isFirstAchievement: false
      }
    }
  ),

  /**
   * Mock event for completing a quest
   */
  questCompleted: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.QUEST_COMPLETED,
    userId,
    EventJourney.CROSS_JOURNEY,
    {
      timestamp: new Date().toISOString(),
      questId: 'quest_202',
      questTitle: 'Semana da Prevenção',
      xpEarned: 250,
      rewards: [
        {
          rewardId: 'reward_303',
          rewardType: 'discount',
          rewardValue: 15
        }
      ],
      metadata: {
        duration: '7 days',
        difficulty: 'medium',
        completedTasks: 5,
        totalTasks: 5
      }
    }
  ),

  /**
   * Mock event for earning XP
   */
  xpEarned: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.XP_EARNED,
    userId,
    EventJourney.CROSS_JOURNEY,
    {
      timestamp: new Date().toISOString(),
      amount: 50,
      source: 'daily_login',
      description: 'Login diário no aplicativo',
      relatedJourney: null,
      metadata: {
        consecutiveLogins: 3,
        platform: 'mobile'
      }
    }
  ),

  /**
   * Mock event for leveling up
   */
  levelUp: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.LEVEL_UP,
    userId,
    EventJourney.CROSS_JOURNEY,
    {
      timestamp: new Date().toISOString(),
      newLevel: 5,
      previousLevel: 4,
      totalXp: 1250,
      unlockedRewards: [
        {
          rewardId: 'reward_404',
          rewardType: 'badge',
          rewardDescription: 'Distintivo de Nível 5'
        },
        {
          rewardId: 'reward_405',
          rewardType: 'discount',
          rewardDescription: 'Desconto de 10% em consultas'
        }
      ],
      metadata: {
        xpToNextLevel: 500,
        milestoneLevel: false
      }
    }
  ),

  /**
   * Mock event for daily login
   */
  dailyLogin: (userId: string = 'user_123'): GamificationEvent => createBaseEvent(
    EventType.DAILY_LOGIN,
    userId,
    EventJourney.CROSS_JOURNEY,
    {
      timestamp: new Date().toISOString(),
      metadata: {
        consecutiveLogins: 5,
        platform: 'mobile',
        deviceType: 'Android',
        appVersion: '2.3.1'
      }
    }
  )
};

/**
 * Error Case Event Fixtures
 * These events are intentionally malformed to test error handling and retry mechanisms
 */
export const errorCaseEvents = {
  /**
   * Event with missing required fields
   */
  missingRequiredFields: (): Partial<GamificationEvent> => ({
    eventId: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: EventType.HEALTH_METRIC_RECORDED,
    // Missing userId
    journey: EventJourney.HEALTH,
    payload: {
      timestamp: new Date().toISOString(),
      // Missing metricType
      value: 72,
      unit: 'bpm'
    },
    version: STANDARD_EVENT_VERSION,
    createdAt: new Date().toISOString(),
    source: 'health-service'
  }),

  /**
   * Event with invalid enum values
   */
  invalidEnumValues: (): GamificationEvent => ({
    eventId: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'INVALID_EVENT_TYPE' as EventType,
    userId: 'user_123',
    journey: 'INVALID_JOURNEY' as EventJourney,
    payload: {
      timestamp: new Date().toISOString(),
      metricType: 'INVALID_METRIC',
      value: 72,
      unit: 'bpm'
    },
    version: STANDARD_EVENT_VERSION,
    createdAt: new Date().toISOString(),
    source: 'health-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Event with invalid data types
   */
  invalidDataTypes: (): GamificationEvent => ({
    eventId: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: 'user_123',
    journey: EventJourney.HEALTH,
    payload: {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 'seventy-two' as unknown as number, // Should be a number
      unit: 72 as unknown as string // Should be a string
    },
    version: STANDARD_EVENT_VERSION,
    createdAt: 'not-a-date' as unknown as string, // Should be ISO date string
    source: 'health-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Event with invalid version format
   */
  invalidVersionFormat: (): GamificationEvent => ({
    eventId: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: 'user_123',
    journey: EventJourney.HEALTH,
    payload: {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm'
    },
    version: {
      major: '1' as unknown as number, // Should be a number
      minor: -1, // Should be non-negative
      patch: 'a' as unknown as number // Should be a number
    },
    createdAt: new Date().toISOString(),
    source: 'health-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Event with excessive payload size
   */
  excessivePayloadSize: (): GamificationEvent => {
    // Create a large payload to test size limits
    const largePayload: Record<string, any> = {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      largeData: {}
    };

    // Add a lot of nested data to exceed typical payload size limits
    let current = largePayload.largeData;
    for (let i = 0; i < 100; i++) {
      current.nestedData = {
        id: `id_${i}`,
        name: `name_${i}`,
        description: `A very long description for item ${i} that contains a lot of text to increase the payload size significantly. This is used to test how the system handles large payloads and if it properly implements size limits and truncation.`,
        timestamp: new Date().toISOString(),
        values: Array.from({ length: 100 }, (_, j) => ({ key: `key_${j}`, value: `value_${j}` }))
      };
      current = current.nestedData;
    }

    return {
      eventId: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: EventType.HEALTH_METRIC_RECORDED,
      userId: 'user_123',
      journey: EventJourney.HEALTH,
      payload: largePayload,
      version: STANDARD_EVENT_VERSION,
      createdAt: new Date().toISOString(),
      source: 'health-service',
      correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }
};

/**
 * Kafka Consumer Compatible Event Fixtures
 * These fixtures are formatted to match the expected input format for Kafka consumers
 */
export const kafkaConsumerEvents = {
  /**
   * Health metric event in Kafka consumer format
   */
  healthMetricKafkaEvent: (): ProcessGamificationEventDto => ({
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: 'user_123',
    data: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      source: 'manual',
      isWithinHealthyRange: true
    },
    journey: EventJourney.HEALTH,
    version: STANDARD_EVENT_VERSION,
    source: 'health-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Appointment event in Kafka consumer format
   */
  appointmentKafkaEvent: (): ProcessGamificationEventDto => ({
    type: EventType.APPOINTMENT_ATTENDED,
    userId: 'user_123',
    data: {
      appointmentId: 'appointment_101',
      appointmentType: 'Consultation',
      providerId: 'provider_202',
      isFirstAppointment: false,
      duration: 30
    },
    journey: EventJourney.CARE,
    version: STANDARD_EVENT_VERSION,
    source: 'care-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Claim event in Kafka consumer format
   */
  claimKafkaEvent: (): ProcessGamificationEventDto => ({
    type: EventType.CLAIM_SUBMITTED,
    userId: 'user_123',
    data: {
      claimId: 'claim_707',
      claimType: 'Consulta Médica',
      amount: 250.00,
      providerId: 'provider_202',
      serviceDate: new Date(Date.now() - 172800000).toISOString(),
      documentCount: 3,
      isComplete: true
    },
    journey: EventJourney.PLAN,
    version: STANDARD_EVENT_VERSION,
    source: 'plan-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Achievement event in Kafka consumer format
   */
  achievementKafkaEvent: (): ProcessGamificationEventDto => ({
    type: EventType.ACHIEVEMENT_UNLOCKED,
    userId: 'user_123',
    data: {
      achievementId: 'achievement_101',
      achievementTitle: 'Monitor de Saúde',
      achievementDescription: 'Registre suas métricas de saúde por 7 dias consecutivos',
      xpEarned: 100,
      relatedJourney: EventJourney.HEALTH,
      level: 1,
      badgeUrl: 'https://assets.austa.com.br/badges/health-monitor-1.png',
      isFirstAchievement: false
    },
    journey: EventJourney.CROSS_JOURNEY,
    version: STANDARD_EVENT_VERSION,
    source: 'gamification-engine',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }),

  /**
   * Dead letter queue event in Kafka consumer format
   * This represents an event that failed processing and was sent to a DLQ
   */
  deadLetterQueueEvent: (): ProcessGamificationEventDto & { error: any } => ({
    type: EventType.HEALTH_METRIC_RECORDED,
    userId: 'user_123',
    data: {
      metricType: 'HEART_RATE',
      value: 'invalid-value', // This caused the error
      unit: 'bpm'
    },
    journey: EventJourney.HEALTH,
    version: STANDARD_EVENT_VERSION,
    source: 'health-service',
    correlationId: `corr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    error: {
      message: 'Invalid data type for metric value',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      attemptCount: 3,
      stackTrace: 'Error: Invalid data type for metric value\n    at validateEvent (/app/src/events/validators/event.validator.ts:45:11)\n    at processEvent (/app/src/events/processors/event.processor.ts:28:22)'
    }
  })
};

/**
 * All event fixtures combined for easy access
 */
export const eventFixtures = {
  health: healthEvents,
  care: careEvents,
  plan: planEvents,
  crossJourney: crossJourneyEvents,
  errorCases: errorCaseEvents,
  kafka: kafkaConsumerEvents
};

export default eventFixtures;