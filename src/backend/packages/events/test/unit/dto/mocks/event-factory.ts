/**
 * @file Event Factory for Testing
 * 
 * Provides utility functions that generate customizable mock event data for testing purposes.
 * This factory enables test writers to quickly create standard-compliant events with controlled
 * variations, supporting both valid and invalid scenarios while maintaining structural consistency.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GamificationEvent,
  EventType,
  EventJourney,
  EventVersion,
  EventPayload,
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
} from '@austa/interfaces/gamification/events';

/**
 * Options for creating a mock event
 */
export interface EventFactoryOptions {
  /** Override the event ID */
  eventId?: string;
  /** Override the event type */
  type?: EventType;
  /** Override the user ID */
  userId?: string;
  /** Override the journey */
  journey?: EventJourney;
  /** Override the payload */
  payload?: Partial<EventPayload>;
  /** Override the version */
  version?: Partial<EventVersion>;
  /** Override the created timestamp */
  createdAt?: string;
  /** Override the source */
  source?: string;
  /** Override the correlation ID */
  correlationId?: string;
}

/**
 * Default version for events
 */
const DEFAULT_VERSION: EventVersion = {
  major: 1,
  minor: 0,
  patch: 0
};

/**
 * Creates a random ISO timestamp within the last 30 days
 */
const createRandomTimestamp = (): string => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const hoursAgo = Math.floor(Math.random() * 24);
  const minutesAgo = Math.floor(Math.random() * 60);
  
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  now.setMinutes(now.getMinutes() - minutesAgo);
  
  return now.toISOString();
};

/**
 * Creates a base event with default values
 * 
 * @param options - Optional overrides for event properties
 * @returns A complete event object with default values for unspecified properties
 */
export const createMockEvent = (options: EventFactoryOptions = {}): GamificationEvent => {
  const timestamp = createRandomTimestamp();
  
  return {
    eventId: options.eventId || uuidv4(),
    type: options.type || EventType.HEALTH_METRIC_RECORDED,
    userId: options.userId || uuidv4(),
    journey: options.journey || EventJourney.HEALTH,
    payload: options.payload || createDefaultPayload(options.type || EventType.HEALTH_METRIC_RECORDED, timestamp),
    version: {
      ...DEFAULT_VERSION,
      ...options.version
    },
    createdAt: options.createdAt || timestamp,
    source: options.source || 'test',
    correlationId: options.correlationId || uuidv4()
  };
};

/**
 * Creates a default payload based on the event type
 * 
 * @param type - The event type
 * @param timestamp - The timestamp to use in the payload
 * @returns A default payload for the specified event type
 */
const createDefaultPayload = (type: EventType, timestamp: string): EventPayload => {
  const basePayload = {
    timestamp,
    metadata: { source: 'test' }
  };
  
  // Health Journey Events
  if (type === EventType.HEALTH_METRIC_RECORDED) {
    return {
      ...basePayload,
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      source: 'manual',
      isWithinHealthyRange: true
    } as HealthMetricRecordedPayload;
  }
  
  if (type === EventType.HEALTH_GOAL_CREATED || type === EventType.HEALTH_GOAL_UPDATED) {
    return {
      ...basePayload,
      goalId: uuidv4(),
      goalType: 'STEPS',
      targetValue: 10000,
      unit: 'steps',
      period: 'daily'
    } as HealthGoalPayload;
  }
  
  if (type === EventType.HEALTH_GOAL_ACHIEVED) {
    return {
      ...basePayload,
      goalId: uuidv4(),
      goalType: 'STEPS',
      targetValue: 10000,
      unit: 'steps',
      period: 'daily',
      completionPercentage: 100,
      isFirstTimeAchievement: Math.random() > 0.5
    } as HealthGoalAchievedPayload;
  }
  
  if (type === EventType.HEALTH_GOAL_STREAK_MAINTAINED) {
    return {
      ...basePayload,
      goalId: uuidv4(),
      goalType: 'STEPS',
      streakCount: Math.floor(Math.random() * 30) + 1
    } as HealthGoalStreakPayload;
  }
  
  if (type === EventType.DEVICE_CONNECTED || type === EventType.DEVICE_SYNCED) {
    return {
      ...basePayload,
      deviceId: uuidv4(),
      deviceType: 'Smartwatch',
      manufacturer: 'Apple',
      metricCount: type === EventType.DEVICE_SYNCED ? Math.floor(Math.random() * 100) + 1 : undefined
    } as DeviceEventPayload;
  }
  
  // Care Journey Events
  if (type === EventType.APPOINTMENT_BOOKED || type === EventType.APPOINTMENT_ATTENDED || type === EventType.APPOINTMENT_CANCELLED) {
    return {
      ...basePayload,
      appointmentId: uuidv4(),
      appointmentType: 'Consultation',
      providerId: uuidv4(),
      isFirstAppointment: Math.random() > 0.8,
      cancellationReason: type === EventType.APPOINTMENT_CANCELLED ? 'Schedule conflict' : undefined
    } as AppointmentEventPayload;
  }
  
  if (type === EventType.MEDICATION_ADDED || type === EventType.MEDICATION_TAKEN || type === EventType.MEDICATION_ADHERENCE_STREAK) {
    return {
      ...basePayload,
      medicationId: uuidv4(),
      medicationName: 'Medication Test',
      streakCount: type === EventType.MEDICATION_ADHERENCE_STREAK ? Math.floor(Math.random() * 30) + 1 : undefined,
      takenOnTime: type === EventType.MEDICATION_TAKEN ? Math.random() > 0.2 : undefined
    } as MedicationEventPayload;
  }
  
  if (type === EventType.TELEMEDICINE_SESSION_STARTED || type === EventType.TELEMEDICINE_SESSION_COMPLETED) {
    return {
      ...basePayload,
      sessionId: uuidv4(),
      providerId: uuidv4(),
      durationMinutes: type === EventType.TELEMEDICINE_SESSION_COMPLETED ? Math.floor(Math.random() * 30) + 10 : undefined,
      isFirstSession: Math.random() > 0.8
    } as TelemedicineEventPayload;
  }
  
  if (type === EventType.TREATMENT_PLAN_CREATED || type === EventType.TREATMENT_PLAN_PROGRESS || type === EventType.TREATMENT_PLAN_COMPLETED) {
    return {
      ...basePayload,
      planId: uuidv4(),
      planType: 'Rehabilitation',
      progressPercentage: type === EventType.TREATMENT_PLAN_PROGRESS ? Math.floor(Math.random() * 100) + 1 : undefined,
      completedOnSchedule: type === EventType.TREATMENT_PLAN_COMPLETED ? Math.random() > 0.3 : undefined
    } as TreatmentPlanEventPayload;
  }
  
  // Plan Journey Events
  if (type === EventType.CLAIM_SUBMITTED || type === EventType.CLAIM_APPROVED || type === EventType.CLAIM_DOCUMENT_UPLOADED) {
    return {
      ...basePayload,
      claimId: uuidv4(),
      claimType: 'Medical',
      amount: type !== EventType.CLAIM_DOCUMENT_UPLOADED ? Math.floor(Math.random() * 1000) + 100 : undefined,
      documentCount: type === EventType.CLAIM_DOCUMENT_UPLOADED ? Math.floor(Math.random() * 5) + 1 : undefined
    } as ClaimEventPayload;
  }
  
  if (type === EventType.BENEFIT_UTILIZED) {
    return {
      ...basePayload,
      benefitId: uuidv4(),
      benefitType: 'Wellness',
      value: Math.floor(Math.random() * 500) + 50
    } as BenefitUtilizedPayload;
  }
  
  if (type === EventType.PLAN_SELECTED || type === EventType.PLAN_COMPARED || type === EventType.PLAN_RENEWED) {
    return {
      ...basePayload,
      planId: uuidv4(),
      planType: 'Premium',
      comparedPlanIds: type === EventType.PLAN_COMPARED ? [uuidv4(), uuidv4()] : undefined,
      isUpgrade: type === EventType.PLAN_SELECTED || type === EventType.PLAN_RENEWED ? Math.random() > 0.5 : undefined
    } as PlanEventPayload;
  }
  
  // Cross-Journey Events
  if (type === EventType.ACHIEVEMENT_UNLOCKED) {
    return {
      ...basePayload,
      achievementId: uuidv4(),
      achievementTitle: 'Test Achievement',
      achievementDescription: 'This is a test achievement',
      xpEarned: Math.floor(Math.random() * 100) + 10,
      relatedJourney: Math.random() > 0.25 ? 
        (Math.random() > 0.5 ? EventJourney.HEALTH : 
          (Math.random() > 0.5 ? EventJourney.CARE : EventJourney.PLAN)) : 
        undefined
    } as AchievementUnlockedPayload;
  }
  
  if (type === EventType.QUEST_COMPLETED) {
    return {
      ...basePayload,
      questId: uuidv4(),
      questTitle: 'Test Quest',
      xpEarned: Math.floor(Math.random() * 200) + 50,
      rewards: Math.random() > 0.3 ? [
        {
          rewardId: uuidv4(),
          rewardType: 'Badge',
          rewardValue: Math.floor(Math.random() * 100) + 1
        }
      ] : undefined
    } as QuestCompletedPayload;
  }
  
  if (type === EventType.XP_EARNED) {
    return {
      ...basePayload,
      amount: Math.floor(Math.random() * 50) + 5,
      source: 'daily_activity',
      description: 'Earned XP for daily activity',
      relatedJourney: Math.random() > 0.25 ? 
        (Math.random() > 0.5 ? EventJourney.HEALTH : 
          (Math.random() > 0.5 ? EventJourney.CARE : EventJourney.PLAN)) : 
        undefined
    } as XpEarnedPayload;
  }
  
  if (type === EventType.LEVEL_UP) {
    const newLevel = Math.floor(Math.random() * 10) + 2;
    return {
      ...basePayload,
      newLevel,
      previousLevel: newLevel - 1,
      totalXp: newLevel * 100,
      unlockedRewards: Math.random() > 0.3 ? [
        {
          rewardId: uuidv4(),
          rewardType: 'Badge',
          rewardDescription: 'New badge unlocked'
        }
      ] : undefined
    } as LevelUpPayload;
  }
  
  // Default fallback
  return basePayload as EventPayload;
};

/**
 * Creates an invalid event for testing error handling
 * 
 * @param invalidField - The field to make invalid
 * @param options - Optional overrides for event properties
 * @returns An event with an invalid field
 */
export const createInvalidEvent = (invalidField: keyof GamificationEvent, options: EventFactoryOptions = {}): Partial<GamificationEvent> => {
  const validEvent = createMockEvent(options);
  
  switch (invalidField) {
    case 'eventId':
      return { ...validEvent, eventId: 'invalid-uuid' };
    case 'type':
      return { ...validEvent, type: 'INVALID_EVENT_TYPE' as EventType };
    case 'userId':
      return { ...validEvent, userId: 'invalid-user-id' };
    case 'journey':
      return { ...validEvent, journey: 'invalid-journey' as EventJourney };
    case 'payload':
      return { ...validEvent, payload: null as unknown as EventPayload };
    case 'version':
      return { ...validEvent, version: null as unknown as EventVersion };
    case 'createdAt':
      return { ...validEvent, createdAt: 'invalid-date' };
    case 'source':
      return { ...validEvent, source: '' };
    default:
      return validEvent;
  }
};

/**
 * Creates a health journey event
 * 
 * @param type - The specific health event type
 * @param options - Optional overrides for event properties
 * @returns A health journey event
 */
export const createHealthEvent = (type: EventType, options: EventFactoryOptions = {}): GamificationEvent => {
  return createMockEvent({
    ...options,
    type,
    journey: EventJourney.HEALTH
  });
};

/**
 * Creates a care journey event
 * 
 * @param type - The specific care event type
 * @param options - Optional overrides for event properties
 * @returns A care journey event
 */
export const createCareEvent = (type: EventType, options: EventFactoryOptions = {}): GamificationEvent => {
  return createMockEvent({
    ...options,
    type,
    journey: EventJourney.CARE
  });
};

/**
 * Creates a plan journey event
 * 
 * @param type - The specific plan event type
 * @param options - Optional overrides for event properties
 * @returns A plan journey event
 */
export const createPlanEvent = (type: EventType, options: EventFactoryOptions = {}): GamificationEvent => {
  return createMockEvent({
    ...options,
    type,
    journey: EventJourney.PLAN
  });
};

/**
 * Creates a cross-journey event
 * 
 * @param type - The specific cross-journey event type
 * @param options - Optional overrides for event properties
 * @returns A cross-journey event
 */
export const createCrossJourneyEvent = (type: EventType, options: EventFactoryOptions = {}): GamificationEvent => {
  return createMockEvent({
    ...options,
    type,
    journey: EventJourney.CROSS_JOURNEY
  });
};

/**
 * Creates a batch of random events for testing
 * 
 * @param count - The number of events to create
 * @returns An array of random events
 */
export const createRandomEvents = (count: number): GamificationEvent[] => {
  const events: GamificationEvent[] = [];
  const eventTypes = Object.values(EventType);
  
  for (let i = 0; i < count; i++) {
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    let journey: EventJourney;
    
    // Determine journey based on event type prefix
    if (randomType.startsWith('HEALTH_')) {
      journey = EventJourney.HEALTH;
    } else if (randomType.startsWith('CARE_') || 
               randomType === EventType.APPOINTMENT_BOOKED || 
               randomType === EventType.APPOINTMENT_ATTENDED || 
               randomType === EventType.APPOINTMENT_CANCELLED || 
               randomType === EventType.MEDICATION_ADDED || 
               randomType === EventType.MEDICATION_TAKEN || 
               randomType === EventType.MEDICATION_ADHERENCE_STREAK || 
               randomType === EventType.TELEMEDICINE_SESSION_STARTED || 
               randomType === EventType.TELEMEDICINE_SESSION_COMPLETED || 
               randomType === EventType.TREATMENT_PLAN_CREATED || 
               randomType === EventType.TREATMENT_PLAN_PROGRESS || 
               randomType === EventType.TREATMENT_PLAN_COMPLETED) {
      journey = EventJourney.CARE;
    } else if (randomType.startsWith('PLAN_') || 
               randomType === EventType.CLAIM_SUBMITTED || 
               randomType === EventType.CLAIM_APPROVED || 
               randomType === EventType.CLAIM_DOCUMENT_UPLOADED || 
               randomType === EventType.BENEFIT_UTILIZED) {
      journey = EventJourney.PLAN;
    } else {
      journey = EventJourney.CROSS_JOURNEY;
    }
    
    events.push(createMockEvent({
      type: randomType,
      journey
    }));
  }
  
  return events;
};

/**
 * Creates a health metric recorded event
 * 
 * @param options - Optional overrides for event properties
 * @returns A health metric recorded event
 */
export const createHealthMetricEvent = (options: EventFactoryOptions & Partial<HealthMetricRecordedPayload> = {}): GamificationEvent => {
  const { metricType, value, unit, source, isWithinHealthyRange, ...eventOptions } = options;
  
  return createHealthEvent(EventType.HEALTH_METRIC_RECORDED, {
    ...eventOptions,
    payload: {
      timestamp: options.createdAt || createRandomTimestamp(),
      metricType: metricType || 'HEART_RATE',
      value: value !== undefined ? value : 75,
      unit: unit || 'bpm',
      source: source || 'manual',
      isWithinHealthyRange: isWithinHealthyRange !== undefined ? isWithinHealthyRange : true,
      metadata: { source: 'test' }
    } as HealthMetricRecordedPayload
  });
};

/**
 * Creates an appointment event
 * 
 * @param type - The specific appointment event type
 * @param options - Optional overrides for event properties
 * @returns An appointment event
 */
export const createAppointmentEvent = (
  type: EventType.APPOINTMENT_BOOKED | EventType.APPOINTMENT_ATTENDED | EventType.APPOINTMENT_CANCELLED,
  options: EventFactoryOptions & Partial<AppointmentEventPayload> = {}
): GamificationEvent => {
  const { appointmentId, appointmentType, providerId, isFirstAppointment, cancellationReason, ...eventOptions } = options;
  
  return createCareEvent(type, {
    ...eventOptions,
    payload: {
      timestamp: options.createdAt || createRandomTimestamp(),
      appointmentId: appointmentId || uuidv4(),
      appointmentType: appointmentType || 'Consultation',
      providerId: providerId || uuidv4(),
      isFirstAppointment: isFirstAppointment !== undefined ? isFirstAppointment : Math.random() > 0.8,
      cancellationReason: type === EventType.APPOINTMENT_CANCELLED ? (cancellationReason || 'Schedule conflict') : undefined,
      metadata: { source: 'test' }
    } as AppointmentEventPayload
  });
};

/**
 * Creates a claim event
 * 
 * @param type - The specific claim event type
 * @param options - Optional overrides for event properties
 * @returns A claim event
 */
export const createClaimEvent = (
  type: EventType.CLAIM_SUBMITTED | EventType.CLAIM_APPROVED | EventType.CLAIM_DOCUMENT_UPLOADED,
  options: EventFactoryOptions & Partial<ClaimEventPayload> = {}
): GamificationEvent => {
  const { claimId, claimType, amount, documentCount, ...eventOptions } = options;
  
  return createPlanEvent(type, {
    ...eventOptions,
    payload: {
      timestamp: options.createdAt || createRandomTimestamp(),
      claimId: claimId || uuidv4(),
      claimType: claimType || 'Medical',
      amount: type !== EventType.CLAIM_DOCUMENT_UPLOADED ? (amount !== undefined ? amount : Math.floor(Math.random() * 1000) + 100) : undefined,
      documentCount: type === EventType.CLAIM_DOCUMENT_UPLOADED ? (documentCount !== undefined ? documentCount : Math.floor(Math.random() * 5) + 1) : undefined,
      metadata: { source: 'test' }
    } as ClaimEventPayload
  });
};

/**
 * Creates an achievement unlocked event
 * 
 * @param options - Optional overrides for event properties
 * @returns An achievement unlocked event
 */
export const createAchievementUnlockedEvent = (options: EventFactoryOptions & Partial<AchievementUnlockedPayload> = {}): GamificationEvent => {
  const { achievementId, achievementTitle, achievementDescription, xpEarned, relatedJourney, ...eventOptions } = options;
  
  return createCrossJourneyEvent(EventType.ACHIEVEMENT_UNLOCKED, {
    ...eventOptions,
    payload: {
      timestamp: options.createdAt || createRandomTimestamp(),
      achievementId: achievementId || uuidv4(),
      achievementTitle: achievementTitle || 'Test Achievement',
      achievementDescription: achievementDescription || 'This is a test achievement',
      xpEarned: xpEarned !== undefined ? xpEarned : Math.floor(Math.random() * 100) + 10,
      relatedJourney,
      metadata: { source: 'test' }
    } as AchievementUnlockedPayload
  });
};