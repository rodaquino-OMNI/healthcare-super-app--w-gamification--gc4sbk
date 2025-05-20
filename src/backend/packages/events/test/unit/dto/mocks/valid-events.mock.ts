/**
 * @file valid-events.mock.ts
 * @description Consolidates a comprehensive collection of valid event mock data from all journeys
 * to support positive test scenarios. This file aggregates well-formed events that pass all validation
 * rules, providing a reliable reference for testing the happy path of event processing pipelines.
 *
 * These mock events can be used for:
 * - Unit testing event validation logic
 * - Testing event processing pipelines
 * - Providing examples for documentation
 * - Verifying schema compatibility during version migrations
 *
 * @module events/test/unit/dto/mocks
 */

import { v4 as uuidv4 } from 'uuid';
import { EventType, JourneyEvents } from '../../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto, createEventMetadata } from '../../../../src/dto/event-metadata.dto';
import { VersionedEventDto } from '../../../../src/dto/version.dto';
import { 
  HealthMetricType, 
  HealthGoalType, 
  DeviceType, 
  HealthInsightType,
  HealthMetricData,
  HealthGoalData,
  DeviceSyncData,
  HealthInsightData
} from '../../../../src/dto/health-event.dto';

/**
 * Creates a standard event metadata object with consistent values for testing.
 * 
 * @param service The service that generated the event
 * @param component Optional component within the service
 * @returns A valid EventMetadataDto instance
 */
export function createTestEventMetadata(service: string, component?: string): EventMetadataDto {
  const metadata = new EventMetadataDto();
  metadata.eventId = uuidv4();
  metadata.correlationId = uuidv4();
  metadata.timestamp = new Date();
  
  const origin = new EventOriginDto();
  origin.service = service;
  if (component) {
    origin.component = component;
  }
  origin.instance = `${service}-instance-1`;
  
  metadata.origin = origin;
  metadata.version = new EventVersionDto();
  
  return metadata;
}

/**
 * Creates a versioned event with the specified type and payload.
 * 
 * @param eventType The type of the event
 * @param payload The event payload
 * @returns A valid VersionedEventDto instance
 */
export function createTestVersionedEvent<T>(eventType: string, payload: T): VersionedEventDto<T> {
  const version = new EventVersionDto();
  version.major = '1';
  version.minor = '0';
  version.patch = '0';
  
  return new VersionedEventDto(eventType, payload, version);
}

// ===== HEALTH JOURNEY MOCK EVENTS =====

/**
 * Valid health metric recorded event for heart rate.
 */
export const validHealthMetricRecordedEvent = {
  type: EventType.HEALTH_METRIC_RECORDED,
  journey: 'health',
  data: {
    metricType: HealthMetricType.HEART_RATE,
    value: 75,
    unit: 'bpm',
    recordedAt: new Date().toISOString(),
    notes: 'Resting heart rate',
    deviceId: uuidv4()
  },
  metadata: createTestEventMetadata('health-service', 'metric-processor')
};

/**
 * Valid health metric recorded event for blood glucose.
 */
export const validBloodGlucoseRecordedEvent = {
  type: EventType.HEALTH_METRIC_RECORDED,
  journey: 'health',
  data: {
    metricType: HealthMetricType.BLOOD_GLUCOSE,
    value: 95,
    unit: 'mg/dL',
    recordedAt: new Date().toISOString(),
    notes: 'Fasting blood glucose',
    deviceId: uuidv4()
  },
  metadata: createTestEventMetadata('health-service', 'metric-processor')
};

/**
 * Valid health metric recorded event for steps.
 */
export const validStepsRecordedEvent = {
  type: EventType.HEALTH_METRIC_RECORDED,
  journey: 'health',
  data: {
    metricType: HealthMetricType.STEPS,
    value: 8500,
    unit: 'steps',
    recordedAt: new Date().toISOString(),
    deviceId: uuidv4()
  },
  metadata: createTestEventMetadata('health-service', 'metric-processor')
};

/**
 * Valid health goal achieved event.
 */
export const validHealthGoalAchievedEvent = {
  type: EventType.HEALTH_GOAL_ACHIEVED,
  journey: 'health',
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.STEPS_TARGET,
    description: 'Daily step goal',
    targetValue: 10000,
    unit: 'steps',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100
  },
  metadata: createTestEventMetadata('health-service', 'goal-processor')
};

/**
 * Valid health goal created event.
 */
export const validHealthGoalCreatedEvent = {
  type: EventType.HEALTH_GOAL_CREATED,
  journey: 'health',
  data: {
    goalId: uuidv4(),
    goalType: HealthGoalType.WEIGHT_TARGET,
    description: 'Weight loss goal',
    targetValue: 75,
    unit: 'kg',
    progressPercentage: 0
  },
  metadata: createTestEventMetadata('health-service', 'goal-processor')
};

/**
 * Valid device connected event.
 */
export const validDeviceConnectedEvent = {
  type: EventType.HEALTH_DEVICE_CONNECTED,
  journey: 'health',
  data: {
    deviceId: uuidv4(),
    deviceType: DeviceType.SMARTWATCH,
    deviceName: 'Apple Watch Series 7',
    connectionMethod: 'bluetooth',
    connectedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('health-service', 'device-manager')
};

/**
 * Valid health insight generated event.
 */
export const validHealthInsightGeneratedEvent = {
  type: EventType.HEALTH_INSIGHT_GENERATED,
  journey: 'health',
  data: {
    insightId: uuidv4(),
    insightType: HealthInsightType.TREND_ANALYSIS,
    title: 'Improving Sleep Pattern',
    description: 'Your sleep duration has improved by 15% over the past week.',
    relatedMetricTypes: [HealthMetricType.SLEEP],
    confidenceScore: 85,
    generatedAt: new Date().toISOString(),
    userAcknowledged: false
  },
  metadata: createTestEventMetadata('health-service', 'insight-generator')
};

/**
 * Valid health assessment completed event.
 */
export const validHealthAssessmentCompletedEvent = {
  type: EventType.HEALTH_ASSESSMENT_COMPLETED,
  journey: 'health',
  data: {
    assessmentId: uuidv4(),
    assessmentType: 'general_health',
    score: 85,
    completedAt: new Date().toISOString(),
    duration: 300 // seconds
  },
  metadata: createTestEventMetadata('health-service', 'assessment-processor')
};

// ===== CARE JOURNEY MOCK EVENTS =====

/**
 * Valid appointment booked event.
 */
export const validAppointmentBookedEvent = {
  type: EventType.CARE_APPOINTMENT_BOOKED,
  journey: 'care',
  data: {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    bookedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('care-service', 'appointment-scheduler')
};

/**
 * Valid appointment completed event.
 */
export const validAppointmentCompletedEvent = {
  type: EventType.CARE_APPOINTMENT_COMPLETED,
  journey: 'care',
  data: {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    appointmentType: 'in_person',
    scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    completedAt: new Date().toISOString(),
    duration: 30 // minutes
  },
  metadata: createTestEventMetadata('care-service', 'appointment-processor')
};

/**
 * Valid medication taken event.
 */
export const validMedicationTakenEvent = {
  type: EventType.CARE_MEDICATION_TAKEN,
  journey: 'care',
  data: {
    medicationId: uuidv4(),
    medicationName: 'Atorvastatina',
    dosage: '20mg',
    takenAt: new Date().toISOString(),
    adherence: 'on_time'
  },
  metadata: createTestEventMetadata('care-service', 'medication-tracker')
};

/**
 * Valid telemedicine started event.
 */
export const validTelemedicineStartedEvent = {
  type: EventType.CARE_TELEMEDICINE_STARTED,
  journey: 'care',
  data: {
    sessionId: uuidv4(),
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    startedAt: new Date().toISOString(),
    deviceType: 'mobile'
  },
  metadata: createTestEventMetadata('care-service', 'telemedicine-service')
};

/**
 * Valid telemedicine completed event.
 */
export const validTelemedicineCompletedEvent = {
  type: EventType.CARE_TELEMEDICINE_COMPLETED,
  journey: 'care',
  data: {
    sessionId: uuidv4(),
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    endedAt: new Date().toISOString(),
    duration: 30, // minutes
    quality: 'good'
  },
  metadata: createTestEventMetadata('care-service', 'telemedicine-service')
};

/**
 * Valid care plan created event.
 */
export const validCarePlanCreatedEvent = {
  type: EventType.CARE_PLAN_CREATED,
  journey: 'care',
  data: {
    planId: uuidv4(),
    providerId: uuidv4(),
    planType: 'chronic_condition',
    condition: 'Hipertensão',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    createdAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('care-service', 'care-plan-manager')
};

/**
 * Valid care plan task completed event.
 */
export const validCarePlanTaskCompletedEvent = {
  type: EventType.CARE_PLAN_TASK_COMPLETED,
  journey: 'care',
  data: {
    taskId: uuidv4(),
    planId: uuidv4(),
    taskType: 'medication',
    completedAt: new Date().toISOString(),
    status: 'completed'
  },
  metadata: createTestEventMetadata('care-service', 'care-plan-manager')
};

// ===== PLAN JOURNEY MOCK EVENTS =====

/**
 * Valid claim submitted event.
 */
export const validClaimSubmittedEvent = {
  type: EventType.PLAN_CLAIM_SUBMITTED,
  journey: 'plan',
  data: {
    claimId: uuidv4(),
    claimType: 'medical',
    providerId: uuidv4(),
    serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    amount: 250.0,
    submittedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('plan-service', 'claim-processor')
};

/**
 * Valid claim processed event.
 */
export const validClaimProcessedEvent = {
  type: EventType.PLAN_CLAIM_PROCESSED,
  journey: 'plan',
  data: {
    claimId: uuidv4(),
    status: 'approved',
    amount: 250.0,
    coveredAmount: 200.0,
    processedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('plan-service', 'claim-processor')
};

/**
 * Valid plan selected event.
 */
export const validPlanSelectedEvent = {
  type: EventType.PLAN_SELECTED,
  journey: 'plan',
  data: {
    planId: uuidv4(),
    planType: 'health',
    coverageLevel: 'family',
    premium: 450.0,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    selectedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('plan-service', 'enrollment-processor')
};

/**
 * Valid benefit utilized event.
 */
export const validBenefitUtilizedEvent = {
  type: EventType.PLAN_BENEFIT_UTILIZED,
  journey: 'plan',
  data: {
    benefitId: uuidv4(),
    benefitType: 'wellness',
    providerId: uuidv4(),
    utilizationDate: new Date().toISOString(),
    savingsAmount: 75.0
  },
  metadata: createTestEventMetadata('plan-service', 'benefit-processor')
};

/**
 * Valid reward redeemed event.
 */
export const validRewardRedeemedEvent = {
  type: EventType.PLAN_REWARD_REDEEMED,
  journey: 'plan',
  data: {
    rewardId: uuidv4(),
    rewardType: 'gift_card',
    pointsRedeemed: 1000,
    value: 50.0,
    redeemedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('plan-service', 'reward-processor')
};

/**
 * Valid document completed event.
 */
export const validDocumentCompletedEvent = {
  type: EventType.PLAN_DOCUMENT_COMPLETED,
  journey: 'plan',
  data: {
    documentId: uuidv4(),
    documentType: 'enrollment',
    completedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('plan-service', 'document-processor')
};

// ===== GAMIFICATION JOURNEY MOCK EVENTS =====

/**
 * Valid points earned event.
 */
export const validPointsEarnedEvent = {
  type: EventType.GAMIFICATION_POINTS_EARNED,
  journey: 'gamification',
  data: {
    sourceType: 'health',
    sourceId: uuidv4(),
    points: 50,
    reason: 'Daily step goal achieved',
    earnedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('gamification-engine', 'points-processor')
};

/**
 * Valid achievement unlocked event.
 */
export const validAchievementUnlockedEvent = {
  type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
  journey: 'gamification',
  data: {
    achievementId: uuidv4(),
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 100,
    unlockedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('gamification-engine', 'achievement-processor')
};

/**
 * Valid level up event.
 */
export const validLevelUpEvent = {
  type: EventType.GAMIFICATION_LEVEL_UP,
  journey: 'gamification',
  data: {
    previousLevel: 2,
    newLevel: 3,
    totalPoints: 1500,
    leveledUpAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('gamification-engine', 'level-processor')
};

/**
 * Valid quest completed event.
 */
export const validQuestCompletedEvent = {
  type: EventType.GAMIFICATION_QUEST_COMPLETED,
  journey: 'gamification',
  data: {
    questId: uuidv4(),
    questType: 'weekly_challenge',
    difficulty: 'medium',
    points: 200,
    completedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('gamification-engine', 'quest-processor')
};

// ===== USER JOURNEY MOCK EVENTS =====

/**
 * Valid profile completed event.
 */
export const validProfileCompletedEvent = {
  type: EventType.USER_PROFILE_COMPLETED,
  journey: 'user',
  data: {
    completionPercentage: 100,
    completedSections: ['personal', 'contact', 'health', 'preferences'],
    completedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('user-service', 'profile-processor')
};

/**
 * Valid login event.
 */
export const validLoginEvent = {
  type: EventType.USER_LOGIN,
  journey: 'user',
  data: {
    loginMethod: 'password',
    deviceType: 'mobile',
    loginAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('auth-service', 'auth-processor')
};

/**
 * Valid onboarding completed event.
 */
export const validOnboardingCompletedEvent = {
  type: EventType.USER_ONBOARDING_COMPLETED,
  journey: 'user',
  data: {
    completedSteps: ['welcome', 'profile', 'preferences', 'journeys'],
    selectedJourneys: ['health', 'care', 'plan'],
    duration: 450, // seconds
    completedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('user-service', 'onboarding-processor')
};

/**
 * Valid feedback submitted event.
 */
export const validFeedbackSubmittedEvent = {
  type: EventType.USER_FEEDBACK_SUBMITTED,
  journey: 'user',
  data: {
    feedbackType: 'app',
    rating: 4,
    comments: 'Great app, but could use more health tracking features',
    submittedAt: new Date().toISOString()
  },
  metadata: createTestEventMetadata('user-service', 'feedback-processor')
};

/**
 * Collection of all valid health journey events.
 */
export const validHealthEvents = {
  metricRecorded: validHealthMetricRecordedEvent,
  bloodGlucoseRecorded: validBloodGlucoseRecordedEvent,
  stepsRecorded: validStepsRecordedEvent,
  goalAchieved: validHealthGoalAchievedEvent,
  goalCreated: validHealthGoalCreatedEvent,
  deviceConnected: validDeviceConnectedEvent,
  insightGenerated: validHealthInsightGeneratedEvent,
  assessmentCompleted: validHealthAssessmentCompletedEvent
};

/**
 * Collection of all valid care journey events.
 */
export const validCareEvents = {
  appointmentBooked: validAppointmentBookedEvent,
  appointmentCompleted: validAppointmentCompletedEvent,
  medicationTaken: validMedicationTakenEvent,
  telemedicineStarted: validTelemedicineStartedEvent,
  telemedicineCompleted: validTelemedicineCompletedEvent,
  planCreated: validCarePlanCreatedEvent,
  planTaskCompleted: validCarePlanTaskCompletedEvent
};

/**
 * Collection of all valid plan journey events.
 */
export const validPlanEvents = {
  claimSubmitted: validClaimSubmittedEvent,
  claimProcessed: validClaimProcessedEvent,
  planSelected: validPlanSelectedEvent,
  benefitUtilized: validBenefitUtilizedEvent,
  rewardRedeemed: validRewardRedeemedEvent,
  documentCompleted: validDocumentCompletedEvent
};

/**
 * Collection of all valid gamification journey events.
 */
export const validGamificationEvents = {
  pointsEarned: validPointsEarnedEvent,
  achievementUnlocked: validAchievementUnlockedEvent,
  levelUp: validLevelUpEvent,
  questCompleted: validQuestCompletedEvent
};

/**
 * Collection of all valid user journey events.
 */
export const validUserEvents = {
  profileCompleted: validProfileCompletedEvent,
  login: validLoginEvent,
  onboardingCompleted: validOnboardingCompletedEvent,
  feedbackSubmitted: validFeedbackSubmittedEvent
};

/**
 * Collection of all valid events across all journeys.
 */
export const validEvents = {
  health: validHealthEvents,
  care: validCareEvents,
  plan: validPlanEvents,
  gamification: validGamificationEvents,
  user: validUserEvents
};

/**
 * Creates a valid event with the specified type and journey.
 * 
 * @param eventType The type of event to create
 * @param journey The journey the event belongs to
 * @returns A valid event object or undefined if the event type is not supported
 */
export function createValidEvent(eventType: EventType, journey: string): any {
  // Find the event in the validEvents collection
  switch (journey) {
    case 'health':
      return Object.values(validHealthEvents).find(event => event.type === eventType);
    case 'care':
      return Object.values(validCareEvents).find(event => event.type === eventType);
    case 'plan':
      return Object.values(validPlanEvents).find(event => event.type === eventType);
    case 'gamification':
      return Object.values(validGamificationEvents).find(event => event.type === eventType);
    case 'user':
      return Object.values(validUserEvents).find(event => event.type === eventType);
    default:
      return undefined;
  }
}

/**
 * Creates a valid event with a specific version.
 * 
 * @param eventType The type of event to create
 * @param journey The journey the event belongs to
 * @param version The version to set for the event
 * @returns A valid versioned event object or undefined if the event type is not supported
 */
export function createValidVersionedEvent(eventType: EventType, journey: string, version: string): VersionedEventDto<any> | undefined {
  const event = createValidEvent(eventType, journey);
  
  if (!event) {
    return undefined;
  }
  
  const versionParts = version.split('.');
  const versionDto = new EventVersionDto();
  versionDto.major = versionParts[0] || '1';
  versionDto.minor = versionParts[1] || '0';
  versionDto.patch = versionParts[2] || '0';
  
  // Update the event metadata with the specified version
  const updatedMetadata = { ...event.metadata, version: versionDto };
  const eventWithVersion = { ...event, metadata: updatedMetadata };
  
  return createTestVersionedEvent(eventType, eventWithVersion);
}

/**
 * Creates a collection of valid events for a specific journey.
 * 
 * @param journey The journey to create events for
 * @returns An array of valid events for the specified journey
 */
export function createValidEventsForJourney(journey: string): any[] {
  switch (journey) {
    case 'health':
      return Object.values(validHealthEvents);
    case 'care':
      return Object.values(validCareEvents);
    case 'plan':
      return Object.values(validPlanEvents);
    case 'gamification':
      return Object.values(validGamificationEvents);
    case 'user':
      return Object.values(validUserEvents);
    default:
      return [];
  }
}

/**
 * Creates a collection of all valid events across all journeys.
 * 
 * @returns An array of all valid events
 */
export function createAllValidEvents(): any[] {
  return [
    ...Object.values(validHealthEvents),
    ...Object.values(validCareEvents),
    ...Object.values(validPlanEvents),
    ...Object.values(validGamificationEvents),
    ...Object.values(validUserEvents)
  ];
}