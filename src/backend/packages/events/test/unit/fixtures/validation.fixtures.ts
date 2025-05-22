/**
 * @file Validation test fixtures for event validation testing
 * 
 * This file contains fixtures for testing event validation logic, including edge cases,
 * boundary values, and invalid data patterns. These fixtures provide comprehensive test
 * scenarios for validating the event DTOs and ensuring proper error handling for invalid events.
 */

import { 
  EventType, 
  EventJourney, 
  GamificationEvent,
  EventVersion,
  HealthMetricRecordedPayload,
  HealthGoalPayload,
  HealthGoalAchievedPayload,
  HealthGoalStreakPayload,
  DeviceEventPayload,
  AppointmentEventPayload,
  MedicationEventPayload,
  TelemedicineEventPayload,
  TreatmentPlanEventPayload,
  ClaimEventPayload,
  BenefitUtilizedPayload,
  PlanEventPayload,
  AchievementUnlockedPayload,
  QuestCompletedPayload,
  XpEarnedPayload,
  LevelUpPayload
} from '@austa/interfaces/gamification';

// ==========================================
// Base Event Validation Fixtures
// ==========================================

/**
 * A minimal valid event that passes all validation checks
 */
export const validBaseEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  type: EventType.HEALTH_METRIC_RECORDED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.HEALTH,
  payload: {
    timestamp: new Date().toISOString(),
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    source: 'manual'
  },
  version: {
    major: 1,
    minor: 0,
    patch: 0
  },
  createdAt: new Date().toISOString(),
  source: 'health-service'
};

/**
 * Collection of invalid base events for testing validation failures
 */
export const invalidBaseEvents = {
  // Missing required fields
  missingEventId: {
    ...validBaseEvent,
    eventId: undefined
  },
  missingType: {
    ...validBaseEvent,
    type: undefined
  },
  missingUserId: {
    ...validBaseEvent,
    userId: undefined
  },
  missingJourney: {
    ...validBaseEvent,
    journey: undefined
  },
  missingPayload: {
    ...validBaseEvent,
    payload: undefined
  },
  missingVersion: {
    ...validBaseEvent,
    version: undefined
  },
  missingCreatedAt: {
    ...validBaseEvent,
    createdAt: undefined
  },
  missingSource: {
    ...validBaseEvent,
    source: undefined
  },
  
  // Invalid field types
  invalidEventIdType: {
    ...validBaseEvent,
    eventId: 12345 // Should be string
  },
  invalidTypeEnum: {
    ...validBaseEvent,
    type: 'INVALID_TYPE' // Not in EventType enum
  },
  invalidUserIdType: {
    ...validBaseEvent,
    userId: 12345 // Should be string
  },
  invalidJourneyEnum: {
    ...validBaseEvent,
    journey: 'invalid-journey' // Not in EventJourney enum
  },
  invalidPayloadType: {
    ...validBaseEvent,
    payload: 'not-an-object' // Should be object
  },
  invalidVersionType: {
    ...validBaseEvent,
    version: 'not-an-object' // Should be object
  },
  invalidCreatedAtType: {
    ...validBaseEvent,
    createdAt: 12345 // Should be ISO string
  },
  invalidSourceType: {
    ...validBaseEvent,
    source: 12345 // Should be string
  },
  
  // Malformed values
  invalidEventIdFormat: {
    ...validBaseEvent,
    eventId: 'not-a-uuid'
  },
  invalidCreatedAtFormat: {
    ...validBaseEvent,
    createdAt: '2023-13-45T25:70:99Z' // Invalid date format
  },
  emptyUserId: {
    ...validBaseEvent,
    userId: ''
  },
  emptySource: {
    ...validBaseEvent,
    source: ''
  },
  
  // Version validation
  invalidVersionStructure: {
    ...validBaseEvent,
    version: {
      major: '1', // Should be number
      minor: 0,
      patch: 0
    }
  },
  negativeVersionNumbers: {
    ...validBaseEvent,
    version: {
      major: -1, // Should be non-negative
      minor: -2,
      patch: -3
    }
  },
  missingVersionFields: {
    ...validBaseEvent,
    version: {
      major: 1,
      // missing minor and patch
    }
  },
  
  // Payload/type mismatch
  typeMismatchPayload: {
    ...validBaseEvent,
    type: EventType.APPOINTMENT_BOOKED,
    // Payload is still for HEALTH_METRIC_RECORDED
  },
  journeyMismatchType: {
    ...validBaseEvent,
    journey: EventJourney.CARE,
    type: EventType.HEALTH_METRIC_RECORDED // Type from HEALTH journey
  }
};

// ==========================================
// Health Journey Validation Fixtures
// ==========================================

/**
 * Valid health metric recorded event
 */
export const validHealthMetricEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174002',
  type: EventType.HEALTH_METRIC_RECORDED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.HEALTH,
  payload: {
    timestamp: new Date().toISOString(),
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    source: 'manual',
    isWithinHealthyRange: true
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'health-service'
};

/**
 * Collection of invalid health metric events for testing validation failures
 */
export const invalidHealthMetricEvents = {
  // Missing required fields in payload
  missingMetricType: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      metricType: undefined
    }
  },
  missingValue: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      value: undefined
    }
  },
  missingUnit: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      unit: undefined
    }
  },
  missingSource: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      source: undefined
    }
  },
  
  // Invalid field types in payload
  invalidMetricTypeType: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      metricType: 12345 // Should be string
    }
  },
  invalidValueType: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      value: 'not-a-number' // Should be number
    }
  },
  invalidUnitType: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      unit: 12345 // Should be string
    }
  },
  invalidSourceType: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      source: 12345 // Should be string
    }
  },
  
  // Boundary value testing
  negativeMetricValue: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      value: -10 // Negative value for metric that should be positive
    }
  },
  extremelyHighMetricValue: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      value: 999999 // Unrealistically high value
    }
  },
  emptyMetricType: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      metricType: ''
    }
  },
  emptyUnit: {
    ...validHealthMetricEvent,
    payload: {
      ...validHealthMetricEvent.payload as HealthMetricRecordedPayload,
      unit: ''
    }
  }
};

/**
 * Valid health goal event
 */
export const validHealthGoalEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174003',
  type: EventType.HEALTH_GOAL_CREATED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.HEALTH,
  payload: {
    timestamp: new Date().toISOString(),
    goalId: '123e4567-e89b-12d3-a456-426614174010',
    goalType: 'STEPS',
    targetValue: 10000,
    unit: 'steps',
    period: 'daily'
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'health-service'
};

/**
 * Collection of invalid health goal events for testing validation failures
 */
export const invalidHealthGoalEvents = {
  // Missing required fields in payload
  missingGoalId: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      goalId: undefined
    }
  },
  missingGoalType: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      goalType: undefined
    }
  },
  missingTargetValue: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      targetValue: undefined
    }
  },
  missingUnit: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      unit: undefined
    }
  },
  
  // Invalid field types in payload
  invalidGoalIdType: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      goalId: 12345 // Should be string
    }
  },
  invalidGoalTypeType: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      goalType: 12345 // Should be string
    }
  },
  invalidTargetValueType: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      targetValue: 'not-a-number' // Should be number
    }
  },
  invalidUnitType: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      unit: 12345 // Should be string
    }
  },
  
  // Boundary value testing
  negativeTargetValue: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      targetValue: -100 // Negative value for target that should be positive
    }
  },
  zeroTargetValue: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      targetValue: 0 // Zero value for target that should be positive
    }
  },
  extremelyHighTargetValue: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      targetValue: 9999999 // Unrealistically high value
    }
  },
  invalidPeriodValue: {
    ...validHealthGoalEvent,
    payload: {
      ...validHealthGoalEvent.payload as HealthGoalPayload,
      period: 'invalid-period' // Not a valid period
    }
  }
};

// ==========================================
// Care Journey Validation Fixtures
// ==========================================

/**
 * Valid appointment event
 */
export const validAppointmentEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174004',
  type: EventType.APPOINTMENT_BOOKED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.CARE,
  payload: {
    timestamp: new Date().toISOString(),
    appointmentId: '123e4567-e89b-12d3-a456-426614174020',
    appointmentType: 'CONSULTATION',
    providerId: '123e4567-e89b-12d3-a456-426614174021',
    isFirstAppointment: true
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'care-service'
};

/**
 * Collection of invalid appointment events for testing validation failures
 */
export const invalidAppointmentEvents = {
  // Missing required fields in payload
  missingAppointmentId: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      appointmentId: undefined
    }
  },
  missingAppointmentType: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      appointmentType: undefined
    }
  },
  missingProviderId: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      providerId: undefined
    }
  },
  
  // Invalid field types in payload
  invalidAppointmentIdType: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      appointmentId: 12345 // Should be string
    }
  },
  invalidAppointmentTypeType: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      appointmentType: 12345 // Should be string
    }
  },
  invalidProviderIdType: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      providerId: 12345 // Should be string
    }
  },
  invalidIsFirstAppointmentType: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      isFirstAppointment: 'not-a-boolean' // Should be boolean
    }
  },
  
  // Logical inconsistencies
  cancelledWithoutReason: {
    ...validAppointmentEvent,
    type: EventType.APPOINTMENT_CANCELLED,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      // Missing cancellationReason for APPOINTMENT_CANCELLED event
    }
  },
  emptyAppointmentType: {
    ...validAppointmentEvent,
    payload: {
      ...validAppointmentEvent.payload as AppointmentEventPayload,
      appointmentType: ''
    }
  }
};

/**
 * Valid medication event
 */
export const validMedicationEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174005',
  type: EventType.MEDICATION_TAKEN,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.CARE,
  payload: {
    timestamp: new Date().toISOString(),
    medicationId: '123e4567-e89b-12d3-a456-426614174030',
    medicationName: 'Medication Name',
    takenOnTime: true
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'care-service'
};

/**
 * Collection of invalid medication events for testing validation failures
 */
export const invalidMedicationEvents = {
  // Missing required fields in payload
  missingMedicationId: {
    ...validMedicationEvent,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      medicationId: undefined
    }
  },
  missingMedicationName: {
    ...validMedicationEvent,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      medicationName: undefined
    }
  },
  
  // Invalid field types in payload
  invalidMedicationIdType: {
    ...validMedicationEvent,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      medicationId: 12345 // Should be string
    }
  },
  invalidMedicationNameType: {
    ...validMedicationEvent,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      medicationName: 12345 // Should be string
    }
  },
  invalidTakenOnTimeType: {
    ...validMedicationEvent,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      takenOnTime: 'not-a-boolean' // Should be boolean
    }
  },
  
  // Logical inconsistencies
  streakWithoutCount: {
    ...validMedicationEvent,
    type: EventType.MEDICATION_ADHERENCE_STREAK,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      // Missing streakCount for MEDICATION_ADHERENCE_STREAK event
    }
  },
  negativeStreakCount: {
    ...validMedicationEvent,
    type: EventType.MEDICATION_ADHERENCE_STREAK,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      streakCount: -5 // Should be positive
    }
  },
  emptyMedicationName: {
    ...validMedicationEvent,
    payload: {
      ...validMedicationEvent.payload as MedicationEventPayload,
      medicationName: ''
    }
  }
};

// ==========================================
// Plan Journey Validation Fixtures
// ==========================================

/**
 * Valid claim event
 */
export const validClaimEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174006',
  type: EventType.CLAIM_SUBMITTED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.PLAN,
  payload: {
    timestamp: new Date().toISOString(),
    claimId: '123e4567-e89b-12d3-a456-426614174040',
    claimType: 'MEDICAL',
    amount: 150.75
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'plan-service'
};

/**
 * Collection of invalid claim events for testing validation failures
 */
export const invalidClaimEvents = {
  // Missing required fields in payload
  missingClaimId: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      claimId: undefined
    }
  },
  missingClaimType: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      claimType: undefined
    }
  },
  
  // Invalid field types in payload
  invalidClaimIdType: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      claimId: 12345 // Should be string
    }
  },
  invalidClaimTypeType: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      claimType: 12345 // Should be string
    }
  },
  invalidAmountType: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      amount: 'not-a-number' // Should be number
    }
  },
  
  // Boundary value testing
  negativeAmount: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      amount: -50.25 // Should be positive
    }
  },
  zeroAmount: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      amount: 0 // Zero amount claim
    }
  },
  extremelyHighAmount: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      amount: 9999999999.99 // Unrealistically high value
    }
  },
  
  // Logical inconsistencies
  documentUploadedWithoutCount: {
    ...validClaimEvent,
    type: EventType.CLAIM_DOCUMENT_UPLOADED,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      // Missing documentCount for CLAIM_DOCUMENT_UPLOADED event
    }
  },
  negativeDocumentCount: {
    ...validClaimEvent,
    type: EventType.CLAIM_DOCUMENT_UPLOADED,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      documentCount: -3 // Should be positive
    }
  },
  emptyClaimType: {
    ...validClaimEvent,
    payload: {
      ...validClaimEvent.payload as ClaimEventPayload,
      claimType: ''
    }
  }
};

/**
 * Valid benefit utilized event
 */
export const validBenefitEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174007',
  type: EventType.BENEFIT_UTILIZED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.PLAN,
  payload: {
    timestamp: new Date().toISOString(),
    benefitId: '123e4567-e89b-12d3-a456-426614174050',
    benefitType: 'WELLNESS',
    value: 75.50
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'plan-service'
};

/**
 * Collection of invalid benefit events for testing validation failures
 */
export const invalidBenefitEvents = {
  // Missing required fields in payload
  missingBenefitId: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      benefitId: undefined
    }
  },
  missingBenefitType: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      benefitType: undefined
    }
  },
  
  // Invalid field types in payload
  invalidBenefitIdType: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      benefitId: 12345 // Should be string
    }
  },
  invalidBenefitTypeType: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      benefitType: 12345 // Should be string
    }
  },
  invalidValueType: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      value: 'not-a-number' // Should be number
    }
  },
  
  // Boundary value testing
  negativeValue: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      value: -25.75 // Should be positive
    }
  },
  zeroValue: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      value: 0 // Zero value benefit
    }
  },
  extremelyHighValue: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      value: 9999999999.99 // Unrealistically high value
    }
  },
  emptyBenefitType: {
    ...validBenefitEvent,
    payload: {
      ...validBenefitEvent.payload as BenefitUtilizedPayload,
      benefitType: ''
    }
  }
};

// ==========================================
// Cross-Journey Validation Fixtures
// ==========================================

/**
 * Valid achievement unlocked event
 */
export const validAchievementEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174008',
  type: EventType.ACHIEVEMENT_UNLOCKED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.CROSS_JOURNEY,
  payload: {
    timestamp: new Date().toISOString(),
    achievementId: '123e4567-e89b-12d3-a456-426614174060',
    achievementTitle: 'Achievement Title',
    achievementDescription: 'Achievement Description',
    xpEarned: 100,
    relatedJourney: EventJourney.HEALTH
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'gamification-engine'
};

/**
 * Collection of invalid achievement events for testing validation failures
 */
export const invalidAchievementEvents = {
  // Missing required fields in payload
  missingAchievementId: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementId: undefined
    }
  },
  missingAchievementTitle: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementTitle: undefined
    }
  },
  missingAchievementDescription: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementDescription: undefined
    }
  },
  missingXpEarned: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      xpEarned: undefined
    }
  },
  
  // Invalid field types in payload
  invalidAchievementIdType: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementId: 12345 // Should be string
    }
  },
  invalidAchievementTitleType: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementTitle: 12345 // Should be string
    }
  },
  invalidAchievementDescriptionType: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementDescription: 12345 // Should be string
    }
  },
  invalidXpEarnedType: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      xpEarned: 'not-a-number' // Should be number
    }
  },
  invalidRelatedJourneyType: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      relatedJourney: 'invalid-journey' // Should be EventJourney enum
    }
  },
  
  // Boundary value testing
  negativeXpEarned: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      xpEarned: -50 // Should be positive
    }
  },
  zeroXpEarned: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      xpEarned: 0 // Zero XP earned
    }
  },
  extremelyHighXpEarned: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      xpEarned: 9999999 // Unrealistically high value
    }
  },
  emptyAchievementTitle: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementTitle: ''
    }
  },
  emptyAchievementDescription: {
    ...validAchievementEvent,
    payload: {
      ...validAchievementEvent.payload as AchievementUnlockedPayload,
      achievementDescription: ''
    }
  }
};

/**
 * Valid XP earned event
 */
export const validXpEvent: GamificationEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174009',
  type: EventType.XP_EARNED,
  userId: '123e4567-e89b-12d3-a456-426614174001',
  journey: EventJourney.CROSS_JOURNEY,
  payload: {
    timestamp: new Date().toISOString(),
    amount: 50,
    source: 'daily-login',
    description: 'Daily login bonus',
    relatedJourney: EventJourney.CROSS_JOURNEY
  },
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'gamification-engine'
};

/**
 * Collection of invalid XP events for testing validation failures
 */
export const invalidXpEvents = {
  // Missing required fields in payload
  missingAmount: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      amount: undefined
    }
  },
  missingSource: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      source: undefined
    }
  },
  missingDescription: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      description: undefined
    }
  },
  
  // Invalid field types in payload
  invalidAmountType: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      amount: 'not-a-number' // Should be number
    }
  },
  invalidSourceType: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      source: 12345 // Should be string
    }
  },
  invalidDescriptionType: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      description: 12345 // Should be string
    }
  },
  invalidRelatedJourneyType: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      relatedJourney: 'invalid-journey' // Should be EventJourney enum
    }
  },
  
  // Boundary value testing
  negativeAmount: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      amount: -25 // Should be positive
    }
  },
  zeroAmount: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      amount: 0 // Zero XP earned
    }
  },
  extremelyHighAmount: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      amount: 9999999 // Unrealistically high value
    }
  },
  emptySource: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      source: ''
    }
  },
  emptyDescription: {
    ...validXpEvent,
    payload: {
      ...validXpEvent.payload as XpEarnedPayload,
      description: ''
    }
  }
};

// ==========================================
// Complex Validation Scenarios
// ==========================================

/**
 * Collection of complex validation scenarios that test multiple validation rules simultaneously
 */
export const complexValidationScenarios = {
  // Event with mismatched journey and type
  journeyTypeMismatch: {
    ...validBaseEvent,
    journey: EventJourney.CARE,
    type: EventType.HEALTH_METRIC_RECORDED // Health event type with Care journey
  },
  
  // Event with invalid nested objects
  nestedInvalidObjects: {
    ...validBaseEvent,
    payload: {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 'not-a-number', // Invalid type
      unit: 12345, // Invalid type
      source: '', // Empty string
      metadata: {
        device: 12345, // Should be string
        readings: ['not-a-number'], // Should be array of numbers
        validUntil: 'not-a-date' // Should be date string
      }
    }
  },
  
  // Event with invalid version format but valid event data
  validEventInvalidVersion: {
    ...validBaseEvent,
    version: {
      major: '1', // Should be number
      minor: -1, // Should be non-negative
      patch: 'latest' // Should be number
    }
  },
  
  // Event with valid version but invalid event data
  invalidEventValidVersion: {
    ...validBaseEvent,
    type: 'INVALID_TYPE', // Not in EventType enum
    payload: null, // Should be object
    version: { major: 1, minor: 0, patch: 0 } // Valid version
  },
  
  // Event with timestamp in the future
  futureTimestamp: {
    ...validBaseEvent,
    payload: {
      ...validBaseEvent.payload,
      timestamp: new Date(Date.now() + 86400000).toISOString() // 1 day in the future
    },
    createdAt: new Date(Date.now() + 86400000).toISOString() // 1 day in the future
  },
  
  // Event with logical inconsistency in date ranges
  inconsistentDateRanges: {
    ...validBaseEvent,
    type: EventType.HEALTH_GOAL_CREATED,
    payload: {
      timestamp: new Date().toISOString(),
      goalId: '123e4567-e89b-12d3-a456-426614174010',
      goalType: 'WEIGHT',
      targetValue: 70,
      unit: 'kg',
      startDate: new Date(Date.now() + 86400000).toISOString(), // Start date in the future
      endDate: new Date().toISOString() // End date before start date
    }
  },
  
  // Event with mixed valid and invalid fields
  mixedValidInvalidFields: {
    ...validBaseEvent,
    eventId: '123e4567-e89b-12d3-a456-426614174000', // Valid
    type: EventType.HEALTH_METRIC_RECORDED, // Valid
    userId: '', // Invalid (empty)
    journey: 'invalid-journey', // Invalid (not in enum)
    payload: {
      timestamp: new Date().toISOString(), // Valid
      metricType: 'HEART_RATE', // Valid
      value: -75, // Invalid (negative)
      unit: 'bpm', // Valid
      source: 12345 // Invalid (wrong type)
    },
    version: { major: 1, minor: 0, patch: 0 }, // Valid
    createdAt: 'not-a-date', // Invalid
    source: 'health-service' // Valid
  },
  
  // Event with payload that doesn't match the event type
  payloadTypeMismatch: {
    ...validBaseEvent,
    type: EventType.APPOINTMENT_BOOKED,
    journey: EventJourney.CARE,
    payload: {
      // This is a health metric payload, not an appointment payload
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      source: 'manual'
    }
  }
};

// ==========================================
// Export all fixtures
// ==========================================

export const validationFixtures = {
  // Base event fixtures
  validBaseEvent,
  invalidBaseEvents,
  
  // Health journey fixtures
  validHealthMetricEvent,
  invalidHealthMetricEvents,
  validHealthGoalEvent,
  invalidHealthGoalEvents,
  
  // Care journey fixtures
  validAppointmentEvent,
  invalidAppointmentEvents,
  validMedicationEvent,
  invalidMedicationEvents,
  
  // Plan journey fixtures
  validClaimEvent,
  invalidClaimEvents,
  validBenefitEvent,
  invalidBenefitEvents,
  
  // Cross-journey fixtures
  validAchievementEvent,
  invalidAchievementEvents,
  validXpEvent,
  invalidXpEvents,
  
  // Complex validation scenarios
  complexValidationScenarios
};

export default validationFixtures;