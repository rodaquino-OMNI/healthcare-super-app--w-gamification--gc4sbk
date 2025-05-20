/**
 * Journey Data Fixture
 * 
 * This file provides sample journey-specific data for testing logging integration
 * with the journey-centered architecture. It contains journey identifiers, context objects,
 * events, and metadata for the three core journeys (Health, Care, Plan).
 * 
 * This fixture is essential for verifying that the logging system properly handles
 * journey-specific context and provides appropriate journey-aware logging capabilities.
 */

import { JOURNEY_IDS, JOURNEY_NAMES, JOURNEY_COLORS } from '../../../../shared/src/constants/journey.constants';

/**
 * Sample user IDs for testing different user contexts
 */
export const SAMPLE_USER_IDS = {
  STANDARD: '550e8400-e29b-41d4-a716-446655440000',
  ADMIN: '38a52be4-9352-453e-af97-5c3b448652b0',
  PROVIDER: 'c2d10e1a-0d1f-4b1d-9e3a-c8d3b2f2d1b2',
  ANONYMOUS: 'anonymous',
};

/**
 * Sample request IDs for testing request context and correlation
 */
export const SAMPLE_REQUEST_IDS = {
  HEALTH_JOURNEY: '7b15e8d7-95a1-4d13-89ca-c78b6abcdef1',
  CARE_JOURNEY: '9c24f7e8-6b3a-4d12-87fb-d45e2abcdef2',
  PLAN_JOURNEY: '5a31d9c6-7e2b-4f15-9d8a-e67f3abcdef3',
  CROSS_JOURNEY: 'f8e7d6c5-b4a3-42d1-9e8f-765a4abcdef4',
};

/**
 * Sample correlation IDs for tracking business transactions across services
 */
export const SAMPLE_CORRELATION_IDS = {
  HEALTH_METRIC_SYNC: 'health-metric-sync-12345',
  APPOINTMENT_BOOKING: 'appointment-booking-67890',
  CLAIM_SUBMISSION: 'claim-submission-24680',
  ACHIEVEMENT_UNLOCK: 'achievement-unlock-13579',
};

/**
 * Sample trace IDs for distributed tracing integration
 */
export const SAMPLE_TRACE_IDS = {
  HEALTH_JOURNEY: '0af7651916cd43dd8448eb211c80319c',
  CARE_JOURNEY: '1bf8762027de54ee9559fc322d91420d',
  PLAN_JOURNEY: '2cf9873138ef65ff0660fd433ea2531e',
  CROSS_JOURNEY: '3da0984249fg76gg1771ge544fb3642f',
};

/**
 * Sample session IDs for user session tracking
 */
export const SAMPLE_SESSION_IDS = {
  WEB_SESSION: 'web-session-abcdef123456',
  MOBILE_SESSION: 'mobile-session-fedcba654321',
  EXPIRED_SESSION: 'expired-session-123abc456def',
};

/**
 * Journey-specific context objects for the Health journey
 */
export const HEALTH_JOURNEY_CONTEXTS = {
  /**
   * Basic context with essential journey information
   */
  BASIC: {
    journeyId: JOURNEY_IDS.HEALTH,
    journeyName: JOURNEY_NAMES.HEALTH,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
  },

  /**
   * Context for health metric recording
   */
  METRIC_RECORDING: {
    journeyId: JOURNEY_IDS.HEALTH,
    journeyName: JOURNEY_NAMES.HEALTH,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.HEALTH_METRIC_SYNC,
    metricType: 'blood_pressure',
    deviceId: 'device-123456',
    timestamp: new Date('2023-06-15T10:30:00Z').toISOString(),
  },

  /**
   * Context for health goal tracking
   */
  GOAL_TRACKING: {
    journeyId: JOURNEY_IDS.HEALTH,
    journeyName: JOURNEY_NAMES.HEALTH,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    goalId: 'goal-789012',
    goalType: 'steps',
    targetValue: 10000,
    currentValue: 8500,
    progressPercentage: 85,
  },

  /**
   * Context for device synchronization
   */
  DEVICE_SYNC: {
    journeyId: JOURNEY_IDS.HEALTH,
    journeyName: JOURNEY_NAMES.HEALTH,
    requestId: SAMPLE_REQUEST_IDS.HEALTH_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.HEALTH_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.HEALTH_METRIC_SYNC,
    deviceId: 'device-123456',
    deviceType: 'smartwatch',
    deviceModel: 'HealthTracker Pro',
    syncStartTime: new Date('2023-06-15T10:25:00Z').toISOString(),
    syncEndTime: new Date('2023-06-15T10:30:00Z').toISOString(),
    syncStatus: 'success',
    recordsProcessed: 42,
  },
};

/**
 * Journey-specific context objects for the Care journey
 */
export const CARE_JOURNEY_CONTEXTS = {
  /**
   * Basic context with essential journey information
   */
  BASIC: {
    journeyId: JOURNEY_IDS.CARE,
    journeyName: JOURNEY_NAMES.CARE,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
  },

  /**
   * Context for appointment booking
   */
  APPOINTMENT_BOOKING: {
    journeyId: JOURNEY_IDS.CARE,
    journeyName: JOURNEY_NAMES.CARE,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.APPOINTMENT_BOOKING,
    providerId: 'provider-456789',
    specialtyId: 'specialty-123',
    appointmentType: 'video_consultation',
    appointmentDate: new Date('2023-06-20T14:00:00Z').toISOString(),
    appointmentDuration: 30, // minutes
    appointmentStatus: 'confirmed',
  },

  /**
   * Context for medication tracking
   */
  MEDICATION_TRACKING: {
    journeyId: JOURNEY_IDS.CARE,
    journeyName: JOURNEY_NAMES.CARE,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    medicationId: 'medication-345678',
    medicationName: 'Medication XYZ',
    dosage: '10mg',
    frequency: 'twice_daily',
    adherenceRate: 92, // percentage
    lastTaken: new Date('2023-06-15T08:00:00Z').toISOString(),
  },

  /**
   * Context for telemedicine session
   */
  TELEMEDICINE_SESSION: {
    journeyId: JOURNEY_IDS.CARE,
    journeyName: JOURNEY_NAMES.CARE,
    requestId: SAMPLE_REQUEST_IDS.CARE_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.CARE_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.APPOINTMENT_BOOKING,
    providerId: 'provider-456789',
    providerName: 'Dr. Smith',
    callId: 'call-987654',
    callStartTime: new Date('2023-06-15T14:00:00Z').toISOString(),
    callEndTime: new Date('2023-06-15T14:25:00Z').toISOString(),
    callDuration: 1500, // seconds
    callQuality: 'good',
    callStatus: 'completed',
  },
};

/**
 * Journey-specific context objects for the Plan journey
 */
export const PLAN_JOURNEY_CONTEXTS = {
  /**
   * Basic context with essential journey information
   */
  BASIC: {
    journeyId: JOURNEY_IDS.PLAN,
    journeyName: JOURNEY_NAMES.PLAN,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
  },

  /**
   * Context for claim submission
   */
  CLAIM_SUBMISSION: {
    journeyId: JOURNEY_IDS.PLAN,
    journeyName: JOURNEY_NAMES.PLAN,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.CLAIM_SUBMISSION,
    claimId: 'claim-234567',
    claimType: 'medical',
    claimAmount: 150.75,
    claimDate: new Date('2023-06-10T09:15:00Z').toISOString(),
    providerName: 'Medical Center ABC',
    claimStatus: 'submitted',
    attachmentCount: 3,
  },

  /**
   * Context for benefit utilization
   */
  BENEFIT_UTILIZATION: {
    journeyId: JOURNEY_IDS.PLAN,
    journeyName: JOURNEY_NAMES.PLAN,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    benefitId: 'benefit-567890',
    benefitType: 'dental',
    benefitName: 'Annual Dental Checkup',
    utilizationDate: new Date('2023-06-05T11:30:00Z').toISOString(),
    utilizationPercentage: 50,
    remainingAmount: 500.00,
    totalAmount: 1000.00,
  },

  /**
   * Context for plan selection
   */
  PLAN_SELECTION: {
    journeyId: JOURNEY_IDS.PLAN,
    journeyName: JOURNEY_NAMES.PLAN,
    requestId: SAMPLE_REQUEST_IDS.PLAN_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.PLAN_JOURNEY,
    currentPlanId: 'plan-123456',
    newPlanId: 'plan-789012',
    comparisonId: 'comparison-345678',
    selectionDate: new Date('2023-06-01T15:45:00Z').toISOString(),
    effectiveDate: new Date('2023-07-01T00:00:00Z').toISOString(),
    annualSavings: 1200.00,
  },
};

/**
 * Cross-journey context objects for testing interactions between journeys
 */
export const CROSS_JOURNEY_CONTEXTS = {
  /**
   * Context for gamification achievement unlocked across journeys
   */
  ACHIEVEMENT_UNLOCK: {
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    correlationId: SAMPLE_CORRELATION_IDS.ACHIEVEMENT_UNLOCK,
    achievementId: 'achievement-123456',
    achievementName: 'Health and Wellness Master',
    achievementDescription: 'Complete health goals and attend medical appointments',
    xpEarned: 500,
    unlockedAt: new Date('2023-06-15T16:30:00Z').toISOString(),
    sourceJourneys: [
      {
        journeyId: JOURNEY_IDS.HEALTH,
        journeyName: JOURNEY_NAMES.HEALTH,
        contribution: 'Completed 5 health goals',
      },
      {
        journeyId: JOURNEY_IDS.CARE,
        journeyName: JOURNEY_NAMES.CARE,
        contribution: 'Attended 2 medical appointments',
      },
    ],
  },

  /**
   * Context for user journey transition
   */
  JOURNEY_TRANSITION: {
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.WEB_SESSION,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    sourceJourney: {
      journeyId: JOURNEY_IDS.HEALTH,
      journeyName: JOURNEY_NAMES.HEALTH,
      context: 'Viewing health metrics',
    },
    destinationJourney: {
      journeyId: JOURNEY_IDS.CARE,
      journeyName: JOURNEY_NAMES.CARE,
      context: 'Scheduling appointment based on health metrics',
    },
    transitionReason: 'health_metric_threshold_exceeded',
    transitionTimestamp: new Date('2023-06-15T10:45:00Z').toISOString(),
  },

  /**
   * Context for cross-journey data sharing
   */
  DATA_SHARING: {
    requestId: SAMPLE_REQUEST_IDS.CROSS_JOURNEY,
    userId: SAMPLE_USER_IDS.STANDARD,
    sessionId: SAMPLE_SESSION_IDS.MOBILE_SESSION,
    traceId: SAMPLE_TRACE_IDS.CROSS_JOURNEY,
    sourceJourney: {
      journeyId: JOURNEY_IDS.CARE,
      journeyName: JOURNEY_NAMES.CARE,
      dataType: 'appointment_summary',
      dataId: 'appointment-123456',
    },
    destinationJourney: {
      journeyId: JOURNEY_IDS.PLAN,
      journeyName: JOURNEY_NAMES.PLAN,
      dataType: 'claim_submission',
      dataId: 'claim-234567',
    },
    sharingTimestamp: new Date('2023-06-16T09:30:00Z').toISOString(),
    sharingReason: 'auto_claim_submission',
  },
};

/**
 * Sample journey events that trigger logging
 */
export const JOURNEY_EVENTS = {
  /**
   * Health journey events
   */
  HEALTH: {
    METRIC_RECORDED: {
      type: 'HEALTH_METRIC_RECORDED',
      journeyId: JOURNEY_IDS.HEALTH,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T10:30:00Z').toISOString(),
      data: {
        metricType: 'blood_pressure',
        metricValue: {
          systolic: 120,
          diastolic: 80,
        },
        deviceId: 'device-123456',
        recordedAt: new Date('2023-06-15T10:28:00Z').toISOString(),
      },
    },
    GOAL_ACHIEVED: {
      type: 'HEALTH_GOAL_ACHIEVED',
      journeyId: JOURNEY_IDS.HEALTH,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T18:45:00Z').toISOString(),
      data: {
        goalId: 'goal-789012',
        goalType: 'steps',
        targetValue: 10000,
        achievedValue: 10250,
        achievedAt: new Date('2023-06-15T18:43:00Z').toISOString(),
      },
    },
    DEVICE_CONNECTED: {
      type: 'HEALTH_DEVICE_CONNECTED',
      journeyId: JOURNEY_IDS.HEALTH,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T10:25:00Z').toISOString(),
      data: {
        deviceId: 'device-123456',
        deviceType: 'smartwatch',
        deviceModel: 'HealthTracker Pro',
        connectionMethod: 'bluetooth',
        connectedAt: new Date('2023-06-15T10:25:00Z').toISOString(),
      },
    },
  },

  /**
   * Care journey events
   */
  CARE: {
    APPOINTMENT_BOOKED: {
      type: 'CARE_APPOINTMENT_BOOKED',
      journeyId: JOURNEY_IDS.CARE,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T11:15:00Z').toISOString(),
      data: {
        appointmentId: 'appointment-123456',
        providerId: 'provider-456789',
        specialtyId: 'specialty-123',
        appointmentType: 'video_consultation',
        appointmentDate: new Date('2023-06-20T14:00:00Z').toISOString(),
        appointmentDuration: 30, // minutes
        bookedAt: new Date('2023-06-15T11:15:00Z').toISOString(),
      },
    },
    MEDICATION_TAKEN: {
      type: 'CARE_MEDICATION_TAKEN',
      journeyId: JOURNEY_IDS.CARE,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T08:00:00Z').toISOString(),
      data: {
        medicationId: 'medication-345678',
        medicationName: 'Medication XYZ',
        dosage: '10mg',
        takenAt: new Date('2023-06-15T08:00:00Z').toISOString(),
        scheduledFor: new Date('2023-06-15T08:00:00Z').toISOString(),
        adherenceStatus: 'on_time',
      },
    },
    TELEMEDICINE_COMPLETED: {
      type: 'CARE_TELEMEDICINE_COMPLETED',
      journeyId: JOURNEY_IDS.CARE,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T14:25:00Z').toISOString(),
      data: {
        appointmentId: 'appointment-123456',
        providerId: 'provider-456789',
        callId: 'call-987654',
        callStartTime: new Date('2023-06-15T14:00:00Z').toISOString(),
        callEndTime: new Date('2023-06-15T14:25:00Z').toISOString(),
        callDuration: 1500, // seconds
        callQuality: 'good',
        callStatus: 'completed',
      },
    },
  },

  /**
   * Plan journey events
   */
  PLAN: {
    CLAIM_SUBMITTED: {
      type: 'PLAN_CLAIM_SUBMITTED',
      journeyId: JOURNEY_IDS.PLAN,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T09:30:00Z').toISOString(),
      data: {
        claimId: 'claim-234567',
        claimType: 'medical',
        claimAmount: 150.75,
        claimDate: new Date('2023-06-10T09:15:00Z').toISOString(),
        providerName: 'Medical Center ABC',
        submittedAt: new Date('2023-06-15T09:30:00Z').toISOString(),
        attachmentCount: 3,
      },
    },
    BENEFIT_UTILIZED: {
      type: 'PLAN_BENEFIT_UTILIZED',
      journeyId: JOURNEY_IDS.PLAN,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T11:30:00Z').toISOString(),
      data: {
        benefitId: 'benefit-567890',
        benefitType: 'dental',
        benefitName: 'Annual Dental Checkup',
        utilizationAmount: 500.00,
        utilizationDate: new Date('2023-06-05T11:30:00Z').toISOString(),
        remainingAmount: 500.00,
        totalAmount: 1000.00,
      },
    },
    PLAN_SELECTED: {
      type: 'PLAN_SELECTED',
      journeyId: JOURNEY_IDS.PLAN,
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T15:45:00Z').toISOString(),
      data: {
        currentPlanId: 'plan-123456',
        newPlanId: 'plan-789012',
        selectionDate: new Date('2023-06-01T15:45:00Z').toISOString(),
        effectiveDate: new Date('2023-07-01T00:00:00Z').toISOString(),
        annualSavings: 1200.00,
      },
    },
  },

  /**
   * Cross-journey events
   */
  CROSS_JOURNEY: {
    ACHIEVEMENT_UNLOCKED: {
      type: 'GAMIFICATION_ACHIEVEMENT_UNLOCKED',
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T16:30:00Z').toISOString(),
      data: {
        achievementId: 'achievement-123456',
        achievementName: 'Health and Wellness Master',
        achievementDescription: 'Complete health goals and attend medical appointments',
        xpEarned: 500,
        unlockedAt: new Date('2023-06-15T16:30:00Z').toISOString(),
        sourceJourneys: [
          {
            journeyId: JOURNEY_IDS.HEALTH,
            journeyName: JOURNEY_NAMES.HEALTH,
            contribution: 'Completed 5 health goals',
          },
          {
            journeyId: JOURNEY_IDS.CARE,
            journeyName: JOURNEY_NAMES.CARE,
            contribution: 'Attended 2 medical appointments',
          },
        ],
      },
    },
    JOURNEY_TRANSITIONED: {
      type: 'USER_JOURNEY_TRANSITIONED',
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-15T10:45:00Z').toISOString(),
      data: {
        sourceJourney: {
          journeyId: JOURNEY_IDS.HEALTH,
          journeyName: JOURNEY_NAMES.HEALTH,
          context: 'Viewing health metrics',
        },
        destinationJourney: {
          journeyId: JOURNEY_IDS.CARE,
          journeyName: JOURNEY_NAMES.CARE,
          context: 'Scheduling appointment based on health metrics',
        },
        transitionReason: 'health_metric_threshold_exceeded',
        transitionTimestamp: new Date('2023-06-15T10:45:00Z').toISOString(),
      },
    },
    DATA_SHARED: {
      type: 'CROSS_JOURNEY_DATA_SHARED',
      userId: SAMPLE_USER_IDS.STANDARD,
      timestamp: new Date('2023-06-16T09:30:00Z').toISOString(),
      data: {
        sourceJourney: {
          journeyId: JOURNEY_IDS.CARE,
          journeyName: JOURNEY_NAMES.CARE,
          dataType: 'appointment_summary',
          dataId: 'appointment-123456',
        },
        destinationJourney: {
          journeyId: JOURNEY_IDS.PLAN,
          journeyName: JOURNEY_NAMES.PLAN,
          dataType: 'claim_submission',
          dataId: 'claim-234567',
        },
        sharingTimestamp: new Date('2023-06-16T09:30:00Z').toISOString(),
        sharingReason: 'auto_claim_submission',
      },
    },
  },
};

/**
 * Journey-specific metadata structures for enriching logs
 */
export const JOURNEY_METADATA = {
  /**
   * Health journey metadata
   */
  HEALTH: {
    color: JOURNEY_COLORS.HEALTH.primary,
    metrics: ['steps', 'heart_rate', 'blood_pressure', 'sleep', 'weight'],
    devices: ['smartwatch', 'scale', 'blood_pressure_monitor', 'glucose_meter'],
    goals: ['steps', 'active_minutes', 'sleep_duration', 'weight_loss'],
    insights: ['activity_trends', 'sleep_quality', 'health_score'],
  },

  /**
   * Care journey metadata
   */
  CARE: {
    color: JOURNEY_COLORS.CARE.primary,
    appointmentTypes: ['video_consultation', 'in_person', 'chat', 'phone_call'],
    specialties: ['general_practice', 'cardiology', 'dermatology', 'orthopedics'],
    medicationCategories: ['prescription', 'over_the_counter', 'supplement'],
    careServices: ['telemedicine', 'lab_tests', 'imaging', 'specialist_referral'],
  },

  /**
   * Plan journey metadata
   */
  PLAN: {
    color: JOURNEY_COLORS.PLAN.primary,
    claimTypes: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
    benefitCategories: ['preventive', 'emergency', 'hospitalization', 'outpatient'],
    planTypes: ['individual', 'family', 'employer', 'government'],
    paymentMethods: ['credit_card', 'bank_transfer', 'payroll_deduction'],
  },

  /**
   * Cross-journey metadata
   */
  CROSS_JOURNEY: {
    achievementTypes: ['milestone', 'streak', 'collection', 'challenge'],
    rewardTypes: ['points', 'badge', 'discount', 'premium_feature'],
    transitionTypes: ['user_initiated', 'system_suggested', 'automated'],
    dataShareTypes: ['user_authorized', 'automatic', 'temporary'],
  },
};

/**
 * Sample log entry objects for testing log formatting and serialization
 */
export const SAMPLE_LOG_ENTRIES = {
  /**
   * Health journey log entries
   */
  HEALTH: {
    INFO: {
      level: 'INFO',
      message: 'Health metric recorded successfully',
      timestamp: new Date('2023-06-15T10:30:00Z').toISOString(),
      context: HEALTH_JOURNEY_CONTEXTS.METRIC_RECORDING,
      metadata: {
        journeyColor: JOURNEY_METADATA.HEALTH.color,
        metricType: 'blood_pressure',
        metricValue: {
          systolic: 120,
          diastolic: 80,
        },
      },
    },
    ERROR: {
      level: 'ERROR',
      message: 'Failed to sync health device data',
      timestamp: new Date('2023-06-15T10:32:00Z').toISOString(),
      context: HEALTH_JOURNEY_CONTEXTS.DEVICE_SYNC,
      error: {
        name: 'DeviceSyncError',
        message: 'Connection timeout while syncing device data',
        code: 'DEVICE_SYNC_TIMEOUT',
        stack: 'DeviceSyncError: Connection timeout while syncing device data\n    at DeviceSyncService.syncData (/src/services/device-sync.service.ts:42:11)\n    at HealthController.syncDevice (/src/controllers/health.controller.ts:87:23)',
      },
      metadata: {
        journeyColor: JOURNEY_METADATA.HEALTH.color,
        deviceId: 'device-123456',
        deviceType: 'smartwatch',
        retryCount: 2,
      },
    },
  },

  /**
   * Care journey log entries
   */
  CARE: {
    INFO: {
      level: 'INFO',
      message: 'Appointment booked successfully',
      timestamp: new Date('2023-06-15T11:15:00Z').toISOString(),
      context: CARE_JOURNEY_CONTEXTS.APPOINTMENT_BOOKING,
      metadata: {
        journeyColor: JOURNEY_METADATA.CARE.color,
        appointmentId: 'appointment-123456',
        appointmentType: 'video_consultation',
        appointmentDate: new Date('2023-06-20T14:00:00Z').toISOString(),
      },
    },
    ERROR: {
      level: 'ERROR',
      message: 'Failed to start telemedicine session',
      timestamp: new Date('2023-06-15T14:00:30Z').toISOString(),
      context: CARE_JOURNEY_CONTEXTS.TELEMEDICINE_SESSION,
      error: {
        name: 'TelemedicineError',
        message: 'Failed to establish video connection',
        code: 'VIDEO_CONNECTION_FAILED',
        stack: 'TelemedicineError: Failed to establish video connection\n    at TelemedicineService.startSession (/src/services/telemedicine.service.ts:78:15)\n    at CareController.startVideoCall (/src/controllers/care.controller.ts:124:28)',
      },
      metadata: {
        journeyColor: JOURNEY_METADATA.CARE.color,
        callId: 'call-987654',
        providerId: 'provider-456789',
        browserInfo: 'Chrome 114.0.5735.106',
        networkStatus: 'unstable',
      },
    },
  },

  /**
   * Plan journey log entries
   */
  PLAN: {
    INFO: {
      level: 'INFO',
      message: 'Claim submitted successfully',
      timestamp: new Date('2023-06-15T09:30:00Z').toISOString(),
      context: PLAN_JOURNEY_CONTEXTS.CLAIM_SUBMISSION,
      metadata: {
        journeyColor: JOURNEY_METADATA.PLAN.color,
        claimId: 'claim-234567',
        claimType: 'medical',
        claimAmount: 150.75,
        processingTime: 2.3, // seconds
      },
    },
    ERROR: {
      level: 'ERROR',
      message: 'Failed to process plan selection',
      timestamp: new Date('2023-06-15T15:46:00Z').toISOString(),
      context: PLAN_JOURNEY_CONTEXTS.PLAN_SELECTION,
      error: {
        name: 'PlanSelectionError',
        message: 'Invalid plan transition during enrollment period',
        code: 'INVALID_PLAN_TRANSITION',
        stack: 'PlanSelectionError: Invalid plan transition during enrollment period\n    at PlanService.selectPlan (/src/services/plan.service.ts:156:18)\n    at PlanController.updatePlan (/src/controllers/plan.controller.ts:92:25)',
      },
      metadata: {
        journeyColor: JOURNEY_METADATA.PLAN.color,
        currentPlanId: 'plan-123456',
        newPlanId: 'plan-789012',
        enrollmentPeriod: 'special',
        validationErrors: ['PLAN_TRANSITION_RESTRICTED'],
      },
    },
  },

  /**
   * Cross-journey log entries
   */
  CROSS_JOURNEY: {
    INFO: {
      level: 'INFO',
      message: 'Achievement unlocked across multiple journeys',
      timestamp: new Date('2023-06-15T16:30:00Z').toISOString(),
      context: CROSS_JOURNEY_CONTEXTS.ACHIEVEMENT_UNLOCK,
      metadata: {
        achievementId: 'achievement-123456',
        achievementName: 'Health and Wellness Master',
        xpEarned: 500,
        journeyContributions: [
          { journeyId: JOURNEY_IDS.HEALTH, contribution: 'Completed 5 health goals' },
          { journeyId: JOURNEY_IDS.CARE, contribution: 'Attended 2 medical appointments' },
        ],
      },
    },
    ERROR: {
      level: 'ERROR',
      message: 'Failed to share data between journeys',
      timestamp: new Date('2023-06-16T09:31:00Z').toISOString(),
      context: CROSS_JOURNEY_CONTEXTS.DATA_SHARING,
      error: {
        name: 'DataSharingError',
        message: 'Insufficient permissions for cross-journey data access',
        code: 'INSUFFICIENT_PERMISSIONS',
        stack: 'DataSharingError: Insufficient permissions for cross-journey data access\n    at DataSharingService.shareData (/src/services/data-sharing.service.ts:89:14)\n    at JourneyController.shareJourneyData (/src/controllers/journey.controller.ts:67:22)',
      },
      metadata: {
        sourceJourneyId: JOURNEY_IDS.CARE,
        destinationJourneyId: JOURNEY_IDS.PLAN,
        dataType: 'appointment_summary',
        requiredPermissions: ['CARE_READ', 'PLAN_WRITE'],
        missingPermissions: ['PLAN_WRITE'],
      },
    },
  },
};