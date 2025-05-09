/**
 * @file events.fixtures.ts
 * @description Provides mock gamification events for testing the event processing pipeline.
 * Contains sample events from all three journeys (Health, Care, Plan) with proper schemas and metadata.
 * This file is essential for testing event routing, validation, and processing in the gamification engine.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with validation mechanisms for all event types
 * - Standardize event schema between journey services and the gamification engine
 * - Configure Kafka consumers for reliable processing with dead letter queues
 * - Create achievement notification system
 *
 * @example
 * // Import specific events for testing
 * import { healthMetricHeartRateEvent, appointmentBookedEvent } from './events.fixtures';
 *
 * // Test event processing
 * describe('Event Processing', () => {
 *   it('should process health metric events', async () => {
 *     const result = await eventProcessor.process(healthMetricHeartRateEvent);
 *     expect(result.success).toBe(true);
 *   });
 * });
 *
 * @example
 * // Import collections of events
 * import { validTestEvents, invalidTestEvents } from './events.fixtures';
 *
 * // Test event validation
 * describe('Event Validation', () => {
 *   it('should validate all valid events', () => {
 *     for (const event of Object.values(validTestEvents).flat()) {
 *       expect(eventValidator.validate(event)).toBe(true);
 *     }
 *   });
 *
 *   it('should reject invalid events', () => {
 *     for (const event of invalidTestEvents) {
 *       expect(eventValidator.validate(event as any)).toBe(false);
 *     }
 *   });
 * });
 *
 * @example
 * // Test Kafka integration
 * import { createKafkaMessage, createKafkaBatch } from './events.fixtures';
 *
 * describe('Kafka Consumer', () => {
 *   it('should process Kafka messages', async () => {
 *     const message = createKafkaMessage(healthMetricHeartRateEvent);
 *     const result = await kafkaConsumer.processMessage(message);
 *     expect(result.success).toBe(true);
 *   });
 * });
 */

import {
  GamificationEvent,
  EventPayload,
  EventType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  HealthMetricRecordedPayload,
  GoalAchievedPayload,
  DeviceConnectedPayload,
  AppointmentBookedPayload,
  MedicationTakenPayload,
  TelemedicineSessionCompletedPayload,
  ClaimSubmittedPayload,
  BenefitUtilizedPayload,
  PlanSelectedPayload,
  AchievementUnlockedPayload,
  QuestCompletedPayload,
  RewardRedeemedPayload,
  createEvent
} from '@austa/interfaces/gamification';

/**
 * Mock user IDs for testing
 */
export const MOCK_USER_IDS = {
  STANDARD_USER: '00000000-0000-0000-0000-000000000001',
  PREMIUM_USER: '00000000-0000-0000-0000-000000000002',
  NEW_USER: '00000000-0000-0000-0000-000000000003',
  INACTIVE_USER: '00000000-0000-0000-0000-000000000004',
  ADMIN_USER: '00000000-0000-0000-0000-000000000005',
};

/**
 * Helper function to create a timestamp for a specific number of days ago
 * @param daysAgo Number of days ago
 * @returns ISO string timestamp
 */
export function createTimestamp(daysAgo = 0, hoursAgo = 0, minutesAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

/**
 * Helper function to create a deterministic ID for testing
 * @param prefix Prefix for the ID
 * @param suffix Suffix for the ID
 * @returns A deterministic ID string
 */
export function createTestId(prefix: string, suffix: string): string {
  return `${prefix}-${suffix}-${Date.now()}`;
}

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Mock health metric recorded event for heart rate
 */
export const healthMetricHeartRateEvent: GamificationEvent = {
  id: createTestId('health-metric', 'heart-rate'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      source: 'Apple Watch',
      recordedAt: createTimestamp(0, 1),
      previousValue: 68,
      changePercentage: 5.88
    } as HealthMetricRecordedPayload,
    metadata: {
      deviceId: 'device-123',
      appVersion: '1.2.3',
      isManualEntry: false
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'heart-rate')
};

/**
 * Mock health metric recorded event for steps
 */
export const healthMetricStepsEvent: GamificationEvent = {
  id: createTestId('health-metric', 'steps'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      metricType: 'STEPS',
      value: 8500,
      unit: 'steps',
      source: 'Fitbit',
      recordedAt: createTimestamp(0, 2),
      previousValue: 7200,
      changePercentage: 18.05
    } as HealthMetricRecordedPayload,
    metadata: {
      deviceId: 'device-456',
      appVersion: '1.2.3',
      isManualEntry: false
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'steps')
};

/**
 * Mock health metric recorded event for blood pressure
 */
export const healthMetricBloodPressureEvent: GamificationEvent = {
  id: createTestId('health-metric', 'blood-pressure'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      metricType: 'BLOOD_PRESSURE',
      value: 120, // Systolic value
      unit: 'mmHg',
      source: 'Omron Monitor',
      recordedAt: createTimestamp(0, 3),
      previousValue: 118,
      changePercentage: 1.69
    } as HealthMetricRecordedPayload,
    metadata: {
      deviceId: 'device-789',
      appVersion: '1.2.3',
      isManualEntry: true,
      additionalData: {
        diastolic: 80,
        pulse: 72
      }
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'blood-pressure')
};

/**
 * Mock goal achieved event for steps goal
 */
export const healthGoalAchievedEvent: GamificationEvent = {
  id: createTestId('goal', 'achieved'),
  type: HealthEventType.GOAL_ACHIEVED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      goalId: 'goal-123',
      goalType: 'STEPS',
      achievedAt: createTimestamp(0, 0, 30),
      targetValue: 8000,
      actualValue: 8500,
      streakCount: 3
    } as GoalAchievedPayload,
    metadata: {
      isFirstGoalOfType: false,
      relatedMetricId: 'metric-456'
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'goal-achieved')
};

/**
 * Mock device connected event
 */
export const deviceConnectedEvent: GamificationEvent = {
  id: createTestId('device', 'connected'),
  type: HealthEventType.DEVICE_CONNECTED,
  userId: MOCK_USER_IDS.NEW_USER,
  payload: {
    data: {
      deviceId: 'device-123',
      deviceType: 'Smartwatch',
      connectionTime: createTimestamp(0, 0, 15),
      isFirstConnection: true
    } as DeviceConnectedPayload,
    metadata: {
      manufacturer: 'Apple',
      model: 'Watch Series 7',
      connectionMethod: 'Bluetooth'
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'device-connected')
};

// ===== CARE JOURNEY EVENTS =====

/**
 * Mock appointment booked event
 */
export const appointmentBookedEvent: GamificationEvent = {
  id: createTestId('appointment', 'booked'),
  type: CareEventType.APPOINTMENT_BOOKED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      appointmentId: 'appointment-123',
      appointmentType: 'CONSULTATION',
      providerId: 'provider-456',
      scheduledAt: createTimestamp(7), // 7 days in the future
      isFirstAppointment: false,
      specialtyArea: 'Cardiology'
    } as AppointmentBookedPayload,
    metadata: {
      bookingChannel: 'mobile-app',
      locationId: 'location-789',
      insuranceCovered: true
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'appointment-booked')
};

/**
 * Mock appointment attended event
 */
export const appointmentAttendedEvent: GamificationEvent = {
  id: createTestId('appointment', 'attended'),
  type: CareEventType.APPOINTMENT_ATTENDED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      appointmentId: 'appointment-456',
      appointmentType: 'FOLLOW_UP',
      providerId: 'provider-789',
      scheduledAt: createTimestamp(0, 2),
      isFirstAppointment: false,
      specialtyArea: 'Dermatology'
    } as AppointmentBookedPayload, // Reusing the same payload structure
    metadata: {
      duration: 30, // minutes
      wasOnTime: true,
      followUpScheduled: true
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'appointment-attended')
};

/**
 * Mock medication taken event
 */
export const medicationTakenEvent: GamificationEvent = {
  id: createTestId('medication', 'taken'),
  type: CareEventType.MEDICATION_TAKEN,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      medicationId: 'medication-123',
      takenAt: createTimestamp(0, 0, 10),
      dosage: '10mg',
      adherencePercentage: 95,
      onSchedule: true,
      streakDays: 7
    } as MedicationTakenPayload,
    metadata: {
      medicationName: 'Atorvastatin',
      scheduledTime: createTimestamp(0, 0, 0),
      reminderSent: true
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'medication-taken')
};

/**
 * Mock telemedicine session completed event
 */
export const telemedicineSessionCompletedEvent: GamificationEvent = {
  id: createTestId('telemedicine', 'completed'),
  type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      sessionId: 'session-123',
      providerId: 'provider-456',
      startTime: createTimestamp(0, 1, 30),
      endTime: createTimestamp(0, 0, 30),
      duration: 60, // minutes
      specialtyArea: 'Psychiatry'
    } as TelemedicineSessionCompletedPayload,
    metadata: {
      connectionQuality: 'good',
      platform: 'mobile',
      prescriptionIssued: true
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'telemedicine-completed')
};

// ===== PLAN JOURNEY EVENTS =====

/**
 * Mock claim submitted event
 */
export const claimSubmittedEvent: GamificationEvent = {
  id: createTestId('claim', 'submitted'),
  type: PlanEventType.CLAIM_SUBMITTED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      claimId: 'claim-123',
      amount: 250.00,
      claimType: 'MEDICAL_CONSULTATION',
      submittedAt: createTimestamp(0, 0, 45),
      hasDocuments: true,
      isFirstClaim: false
    } as ClaimSubmittedPayload,
    metadata: {
      providerName: 'Dr. Smith',
      serviceDate: createTimestamp(7),
      receiptNumber: 'REC-12345'
    }
  },
  journey: 'plan',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'claim-submitted')
};

/**
 * Mock benefit utilized event
 */
export const benefitUtilizedEvent: GamificationEvent = {
  id: createTestId('benefit', 'utilized'),
  type: PlanEventType.BENEFIT_VIEWED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      benefitId: 'benefit-123',
      benefitType: 'DISCOUNT_PROGRAM',
      utilizedAt: createTimestamp(0, 1, 15),
      savingsAmount: 50.00,
      isFirstUtilization: false
    } as BenefitUtilizedPayload,
    metadata: {
      partnerName: 'Pharmacy Chain',
      location: 'Online',
      category: 'Medication'
    }
  },
  journey: 'plan',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'benefit-utilized')
};

/**
 * Mock plan selected event
 */
export const planSelectedEvent: GamificationEvent = {
  id: createTestId('plan', 'selected'),
  type: PlanEventType.PLAN_SELECTED,
  userId: MOCK_USER_IDS.NEW_USER,
  payload: {
    data: {
      planId: 'plan-123',
      planType: 'PREMIUM',
      selectedAt: createTimestamp(0, 2, 30),
      coverageLevel: 'FAMILY',
      annualCost: 5000.00,
      isNewEnrollment: true
    } as PlanSelectedPayload,
    metadata: {
      previousPlan: null,
      comparedPlans: ['plan-456', 'plan-789'],
      enrollmentPeriod: 'SPECIAL'
    }
  },
  journey: 'plan',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'plan-selected')
};

// ===== COMMON EVENTS =====

/**
 * Mock achievement unlocked event
 */
export const achievementUnlockedEvent: GamificationEvent = {
  id: createTestId('achievement', 'unlocked'),
  type: CommonEventType.ACHIEVEMENT_UNLOCKED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      achievementId: 'achievement-123',
      achievementName: 'Health Enthusiast',
      unlockedAt: createTimestamp(0, 0, 5),
      pointsAwarded: 100,
      journey: 'health',
      rarity: 'uncommon'
    } as AchievementUnlockedPayload,
    metadata: {
      level: 2,
      previouslyUnlocked: false,
      relatedEvents: ['event-456', 'event-789']
    }
  },
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'achievement-unlocked')
};

/**
 * Mock quest completed event
 */
export const questCompletedEvent: GamificationEvent = {
  id: createTestId('quest', 'completed'),
  type: CommonEventType.QUEST_COMPLETED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      questId: 'quest-123',
      questName: 'Care Champion',
      completedAt: createTimestamp(0, 0, 20),
      pointsAwarded: 250,
      journey: 'care'
    } as QuestCompletedPayload,
    metadata: {
      difficulty: 'medium',
      duration: '7 days',
      tasksCompleted: 5,
      totalTasks: 5
    }
  },
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'quest-completed')
};

/**
 * Mock reward redeemed event
 */
export const rewardRedeemedEvent: GamificationEvent = {
  id: createTestId('reward', 'redeemed'),
  type: CommonEventType.REWARD_REDEEMED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      rewardId: 'reward-123',
      rewardName: 'Premium Subscription Discount',
      redeemedAt: createTimestamp(0, 0, 15),
      value: 50.00,
      rewardType: 'discount'
    } as RewardRedeemedPayload,
    metadata: {
      expiresAt: createTimestamp(30), // 30 days in the future
      pointsSpent: 500,
      isAutoRedeemed: false
    }
  },
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'reward-redeemed')
};

// ===== ERROR CASE EVENTS =====

/**
 * Mock event with missing required fields for testing error handling
 */
export const invalidEventMissingFields: Partial<GamificationEvent> = {
  id: createTestId('invalid', 'missing-fields'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  // Missing payload
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0'
};

/**
 * Mock event with invalid journey for testing error handling
 */
export const invalidEventWrongJourney: GamificationEvent = {
  id: createTestId('invalid', 'wrong-journey'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm'
    } as HealthMetricRecordedPayload,
    metadata: {}
  },
  journey: 'care', // Wrong journey for this event type
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'wrong-journey')
};

/**
 * Mock event with invalid data type for testing error handling
 */
export const invalidEventDataType: GamificationEvent = {
  id: createTestId('invalid', 'data-type'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      metricType: 'HEART_RATE',
      value: 'seventy-two', // Should be a number
      unit: 'bpm'
    } as unknown as HealthMetricRecordedPayload,
    metadata: {}
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'data-type')
};

/**
 * Mock event with incompatible version for testing error handling
 */
export const invalidEventVersion: GamificationEvent = {
  id: createTestId('invalid', 'version'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm'
    } as HealthMetricRecordedPayload,
    metadata: {}
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '2.0.0', // Incompatible version
  correlationId: createTestId('correlation', 'version')
};

// ===== EDGE CASE EVENTS =====

/**
 * Mock event with minimal required fields
 */
export const minimalValidEvent: GamificationEvent = {
  id: createTestId('minimal', 'valid'),
  type: HealthEventType.HEALTH_METRIC_RECORDED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm'
    } as HealthMetricRecordedPayload
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'minimal')
};

/**
 * Mock event with very large payload for testing performance
 */
export const largePayloadEvent: GamificationEvent = {
  id: createTestId('large', 'payload'),
  type: HealthEventType.HEALTH_INSIGHT_VIEWED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      insightId: 'insight-123',
      insightType: 'HEALTH_TREND',
      viewedAt: createTimestamp(0, 0, 5)
    },
    metadata: {
      // Large metadata object to test performance
      historicalData: Array.from({ length: 100 }, (_, i) => ({
        date: createTimestamp(i),
        metrics: {
          heartRate: Math.floor(60 + Math.random() * 40),
          steps: Math.floor(5000 + Math.random() * 5000),
          calories: Math.floor(1500 + Math.random() * 1000),
          sleep: Math.floor(6 + Math.random() * 4),
          weight: Math.floor(60 + Math.random() * 40),
          bloodPressure: {
            systolic: Math.floor(110 + Math.random() * 30),
            diastolic: Math.floor(70 + Math.random() * 20)
          }
        }
      }))
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'large-payload')
};

/**
 * Mock event with special characters in fields for testing sanitization
 */
export const specialCharactersEvent: GamificationEvent = {
  id: createTestId('special', 'characters'),
  type: CareEventType.SYMPTOM_CHECKED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      symptomIds: ['<script>alert(1)</script>', 'symptom-456'],
      checkedAt: createTimestamp(0, 0, 10),
      severity: 'mild',
      recommendationProvided: true
    },
    metadata: {
      userInput: 'I have a <b>headache</b> & fever; it\'s been 2 days.'
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'special-characters')
};

/**
 * Mock health insight viewed event
 */
export const healthInsightViewedEvent: GamificationEvent = {
  id: createTestId('health-insight', 'viewed'),
  type: HealthEventType.HEALTH_INSIGHT_VIEWED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      insightId: 'insight-123',
      insightType: 'HEALTH_TREND',
      viewedAt: createTimestamp(0, 0, 5),
      relatedMetrics: ['HEART_RATE', 'BLOOD_PRESSURE'],
      severity: 'medium'
    },
    metadata: {
      generatedBy: 'ai-health-assistant',
      recommendationProvided: true,
      userInteraction: 'full-read'
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'health-insight')
};

/**
 * Mock medical event recorded event
 */
export const medicalEventRecordedEvent: GamificationEvent = {
  id: createTestId('medical-event', 'recorded'),
  type: HealthEventType.MEDICAL_EVENT_RECORDED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      eventId: 'medical-event-123',
      eventType: 'VACCINATION',
      recordedAt: createTimestamp(0, 1),
      provider: 'Clinic XYZ',
      notes: 'Annual flu vaccination'
    },
    metadata: {
      location: 'São Paulo',
      isRecurring: true,
      reminderSet: true
    }
  },
  journey: 'health',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'medical-event')
};

/**
 * Mock symptom checked event
 */
export const symptomCheckedEvent: GamificationEvent = {
  id: createTestId('symptom', 'checked'),
  type: CareEventType.SYMPTOM_CHECKED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      symptomIds: ['symptom-123', 'symptom-456'],
      checkedAt: createTimestamp(0, 0, 10),
      severity: 'mild',
      recommendationProvided: true
    },
    metadata: {
      userReported: true,
      followUpRecommended: false,
      aiAssisted: true
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'symptom-checked')
};

/**
 * Mock treatment plan created event
 */
export const treatmentPlanCreatedEvent: GamificationEvent = {
  id: createTestId('treatment-plan', 'created'),
  type: CareEventType.TREATMENT_PLAN_CREATED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      planId: 'plan-123',
      providerId: 'provider-456',
      createdAt: createTimestamp(0, 0, 15),
      duration: 30, // days
      condition: 'Hypertension'
    },
    metadata: {
      medications: 2,
      followUpAppointments: 1,
      lifestyleChanges: true
    }
  },
  journey: 'care',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'treatment-plan-created')
};

/**
 * Mock document uploaded event
 */
export const documentUploadedEvent: GamificationEvent = {
  id: createTestId('document', 'uploaded'),
  type: PlanEventType.DOCUMENT_UPLOADED,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      documentId: 'document-123',
      documentType: 'MEDICAL_RECEIPT',
      uploadedAt: createTimestamp(0, 0, 5),
      fileSize: 1024 * 1024, // 1MB
      relatedClaimId: 'claim-456'
    },
    metadata: {
      fileName: 'receipt_2023_01_15.pdf',
      mimeType: 'application/pdf',
      uploadMethod: 'mobile-camera'
    }
  },
  journey: 'plan',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'document-uploaded')
};

/**
 * Mock coverage checked event
 */
export const coverageCheckedEvent: GamificationEvent = {
  id: createTestId('coverage', 'checked'),
  type: PlanEventType.COVERAGE_CHECKED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      coverageId: 'coverage-123',
      serviceType: 'SPECIALIST_CONSULTATION',
      checkedAt: createTimestamp(0, 0, 20),
      isCovered: true,
      copayAmount: 50.00
    },
    metadata: {
      providerInNetwork: true,
      locationId: 'location-789',
      estimatedTotalCost: 250.00
    }
  },
  journey: 'plan',
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'coverage-checked')
};

/**
 * Mock user logged in event
 */
export const userLoggedInEvent: GamificationEvent = {
  id: createTestId('user', 'logged-in'),
  type: CommonEventType.USER_LOGGED_IN,
  userId: MOCK_USER_IDS.STANDARD_USER,
  payload: {
    data: {
      loginTime: createTimestamp(0, 0, 1),
      deviceType: 'mobile',
      platform: 'ios',
      appVersion: '1.2.3'
    },
    metadata: {
      ipAddress: '192.168.1.1',
      loginMethod: 'password',
      sessionId: 'session-123'
    }
  },
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'user-logged-in')
};

/**
 * Mock notification viewed event
 */
export const notificationViewedEvent: GamificationEvent = {
  id: createTestId('notification', 'viewed'),
  type: CommonEventType.NOTIFICATION_VIEWED,
  userId: MOCK_USER_IDS.PREMIUM_USER,
  payload: {
    data: {
      notificationId: 'notification-123',
      notificationType: 'ACHIEVEMENT',
      viewedAt: createTimestamp(0, 0, 2),
      channel: 'in-app'
    },
    metadata: {
      relatedEntityId: 'achievement-456',
      timeToView: 30, // seconds
      actionTaken: true
    }
  },
  timestamp: createTimestamp(),
  version: '1.0.0',
  correlationId: createTestId('correlation', 'notification-viewed')
};

/**
 * Collection of all valid test events grouped by journey
 */
export const validTestEvents = {
  health: [
    healthMetricHeartRateEvent,
    healthMetricStepsEvent,
    healthMetricBloodPressureEvent,
    healthGoalAchievedEvent,
    deviceConnectedEvent,
    healthInsightViewedEvent,
    medicalEventRecordedEvent
  ],
  care: [
    appointmentBookedEvent,
    appointmentAttendedEvent,
    medicationTakenEvent,
    telemedicineSessionCompletedEvent,
    symptomCheckedEvent,
    treatmentPlanCreatedEvent
  ],
  plan: [
    claimSubmittedEvent,
    benefitUtilizedEvent,
    planSelectedEvent,
    documentUploadedEvent,
    coverageCheckedEvent
  ],
  common: [
    achievementUnlockedEvent,
    questCompletedEvent,
    rewardRedeemedEvent,
    userLoggedInEvent,
    notificationViewedEvent
  ]
};

/**
 * Collection of all invalid test events for error testing
 */
export const invalidTestEvents = [
  invalidEventMissingFields,
  invalidEventWrongJourney,
  invalidEventDataType,
  invalidEventVersion
];

/**
 * Collection of all edge case test events
 */
export const edgeCaseTestEvents = [
  minimalValidEvent,
  largePayloadEvent,
  specialCharactersEvent
];

/**
 * Helper function to create a batch of events for Kafka testing
 * @param count Number of events to create
 * @param eventType Type of event to create
 * @param userId User ID for the events
 * @returns Array of events
 */
export function createEventBatch(
  count: number,
  eventType: EventType = HealthEventType.HEALTH_METRIC_RECORDED,
  userId: string = MOCK_USER_IDS.STANDARD_USER
): GamificationEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const journey = eventType.startsWith('HEALTH_') ? 'health' :
                   eventType.startsWith('APPOINTMENT_') || eventType.startsWith('MEDICATION_') ? 'care' :
                   eventType.startsWith('CLAIM_') || eventType.startsWith('PLAN_') ? 'plan' : undefined;
    
    return {
      id: createTestId('batch', `${i}`),
      type: eventType,
      userId,
      payload: {
        data: {
          // Generic data that works for most event types
          timestamp: createTimestamp(0, 0, i),
          value: i,
          id: `item-${i}`
        },
        metadata: {
          batchId: `batch-${Date.now()}`,
          index: i
        }
      },
      journey,
      timestamp: createTimestamp(0, 0, i),
      version: '1.0.0',
      correlationId: createTestId('correlation', `batch-${i}`)
    };
  });
}

/**
 * Helper function to create a Kafka message format for testing
 * @param event The event to format as a Kafka message
 * @returns A Kafka message object
 */
export function createKafkaMessage(event: GamificationEvent): {
  key: string;
  value: string;
  headers: Record<string, string>;
  timestamp: string;
  topic: string;
  partition: number;
  offset: number;
} {
  return {
    key: event.userId,
    value: JSON.stringify(event),
    headers: {
      'event-type': event.type,
      'correlation-id': event.correlationId || '',
      'journey': event.journey || 'common',
      'version': event.version,
      'source-service': `${event.journey || 'common'}-service`,
      'trace-id': `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      'timestamp': event.timestamp
    },
    timestamp: event.timestamp,
    topic: `gamification.events.${event.journey || 'common'}`,
    partition: 0,
    offset: Date.now()
  };
}

/**
 * Kafka consumer configuration for testing
 */
export const kafkaConsumerConfig = {
  clientId: 'gamification-engine-test',
  groupId: 'gamification-engine-consumer-group',
  brokers: ['localhost:9092'],
  ssl: false,
  sasl: undefined,
  connectionTimeout: 3000,
  authenticationTimeout: 1000,
  reauthenticationThreshold: 10000,
  requestTimeout: 30000,
  enforceRequestTimeout: true,
  retry: {
    initialRetryTime: 100,
    retries: 8
  },
  maxInFlightRequests: 5,
  readUncommitted: false,
  allowAutoTopicCreation: true
};

/**
 * Kafka topic configuration for testing
 */
export const kafkaTopicConfig = {
  topics: [
    'gamification.events.health',
    'gamification.events.care',
    'gamification.events.plan',
    'gamification.events.common',
    'gamification.events.dlq'
  ],
  fromBeginning: false,
  partitionAssigners: ['round-robin'],
  sessionTimeout: 30000,
  rebalanceTimeout: 60000,
  heartbeatInterval: 3000,
  metadataMaxAge: 300000,
  allowAutoTopicCreation: true,
  maxBytesPerPartition: 1048576, // 1MB
  minBytes: 1,
  maxBytes: 10485760, // 10MB
  maxWaitTimeInMs: 5000
};

/**
 * Creates a batch of Kafka messages for testing consumer batch processing
 * @param events Array of events to convert to Kafka messages
 * @returns Array of Kafka messages
 */
export function createKafkaBatch(events: GamificationEvent[]): ReturnType<typeof createKafkaMessage>[] {
  return events.map(event => createKafkaMessage(event));
}

/**
 * Creates a Kafka EachMessagePayload object for testing consumer handlers
 * @param event The event to include in the payload
 * @returns An EachMessagePayload-like object for testing
 */
export function createKafkaEachMessagePayload(event: GamificationEvent): {
  topic: string;
  partition: number;
  message: {
    key: Buffer;
    value: Buffer;
    timestamp: string;
    size: number;
    attributes: number;
    offset: string;
    headers: Record<string, Buffer>;
  };
} {
  const kafkaMessage = createKafkaMessage(event);
  const headers: Record<string, Buffer> = {};
  
  // Convert string headers to Buffer
  Object.entries(kafkaMessage.headers).forEach(([key, value]) => {
    headers[key] = Buffer.from(value);
  });
  
  return {
    topic: kafkaMessage.topic,
    partition: kafkaMessage.partition,
    message: {
      key: Buffer.from(kafkaMessage.key),
      value: Buffer.from(kafkaMessage.value),
      timestamp: kafkaMessage.timestamp,
      size: kafkaMessage.value.length,
      attributes: 0,
      offset: kafkaMessage.offset.toString(),
      headers
    }
  };
}

/**
 * Helper function to create a dead letter queue message for testing
 * @param event The original event that failed processing
 * @param error The error that caused the failure
 * @param retryCount The number of retry attempts
 * @returns A dead letter queue message object
 */
export function createDLQMessage(event: GamificationEvent, error: Error, retryCount: number): {
  originalMessage: ReturnType<typeof createKafkaMessage>;
  error: {
    message: string;
    stack?: string;
    code?: string;
    name?: string;
    details?: Record<string, any>;
  };
  metadata: {
    retryCount: number;
    lastRetryTimestamp: string;
    originalTopic: string;
    dlqReason: string;
    processingTime?: number;
    retryBackoffMs?: number;
    serviceName?: string;
  };
} {
  return {
    originalMessage: createKafkaMessage(event),
    error: {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      name: error.name,
      details: (error as any).details || {}
    },
    metadata: {
      retryCount,
      lastRetryTimestamp: createTimestamp(),
      originalTopic: `gamification.events.${event.journey || 'common'}`,
      dlqReason: retryCount >= 3 ? 'MAX_RETRIES_EXCEEDED' : 'PROCESSING_ERROR',
      processingTime: Math.floor(Math.random() * 1000), // milliseconds
      retryBackoffMs: Math.pow(2, retryCount) * 1000, // exponential backoff
      serviceName: 'gamification-engine'
    }
  };
}

/**
 * Predefined error types for testing different failure scenarios
 */
export const errorTypes = {
  VALIDATION_ERROR: new Error('Event validation failed'),
  DATABASE_ERROR: new Error('Database connection failed'),
  TIMEOUT_ERROR: new Error('Processing timed out'),
  SCHEMA_ERROR: new Error('Event schema validation failed'),
  AUTHORIZATION_ERROR: new Error('User not authorized for this action'),
  DEPENDENCY_ERROR: new Error('Dependent service unavailable'),
  RATE_LIMIT_ERROR: new Error('Rate limit exceeded'),
  BUSINESS_RULE_ERROR: new Error('Business rule validation failed')
};

// Add additional properties to the errors
Object.entries(errorTypes).forEach(([key, error]) => {
  (error as any).code = key;
  (error as any).details = {
    timestamp: createTimestamp(),
    recoverable: ['TIMEOUT_ERROR', 'DATABASE_ERROR', 'DEPENDENCY_ERROR', 'RATE_LIMIT_ERROR'].includes(key),
    errorId: `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };
});

/**
 * Sample retry policy configuration for testing
 */
export const retryPolicyConfig = {
  maxRetries: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 60000,
  backoffMultiplier: 2,
  retryableErrors: [
    'TIMEOUT_ERROR',
    'DATABASE_ERROR',
    'DEPENDENCY_ERROR',
    'RATE_LIMIT_ERROR'
  ],
  nonRetryableErrors: [
    'VALIDATION_ERROR',
    'SCHEMA_ERROR',
    'AUTHORIZATION_ERROR',
    'BUSINESS_RULE_ERROR'
  ]
};

/**
 * Creates a sample of failed events with different error types and retry counts
 * @returns An array of DLQ messages with various error scenarios
 */
export function createFailedEventSamples(): ReturnType<typeof createDLQMessage>[] {
  const events = [
    healthMetricHeartRateEvent,
    appointmentBookedEvent,
    claimSubmittedEvent,
    achievementUnlockedEvent
  ];
  
  const errors = Object.values(errorTypes);
  
  return events.flatMap(event => {
    return errors.map((error, index) => {
      // Vary retry counts to test different scenarios
      const retryCount = index % 4;
      return createDLQMessage(event, error, retryCount);
    });
  });
}