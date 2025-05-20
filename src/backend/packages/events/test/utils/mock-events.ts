/**
 * @file mock-events.ts
 * @description Provides a comprehensive mock event generation library for creating test events with correct schemas
 * for all journey types (health, care, plan). It includes factory functions for each event type with configurable
 * parameters to support various testing scenarios.
 * 
 * This utility helps ensure test consistency and reduces test code duplication when validating event processing,
 * schema validation, and integration across services.
 *
 * @module events/test/utils
 */

import { v4 as uuidv4 } from 'uuid';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { 
  HealthMetricType, 
  HealthGoalType, 
  DeviceType, 
  HealthInsightType,
  HealthMetricData,
  HealthGoalData,
  DeviceSyncData,
  HealthInsightData
} from '../../src/dto/health-event.dto';
import { EventMetadataDto, createEventMetadata } from '../../src/dto/event-metadata.dto';
import { VersionedEventDto, createVersionedEvent } from '../../src/dto/version.dto';

// ===== COMMON INTERFACES AND TYPES =====

/**
 * Base interface for all event data in the AUSTA SuperApp.
 * All journey-specific event data interfaces extend this base interface.
 */
export interface BaseEventData {
  userId: string;
  timestamp: string;
}

/**
 * Base interface for all events in the AUSTA SuperApp.
 * Provides the common structure for all events across all journeys.
 */
export interface BaseEvent<T extends BaseEventData> {
  type: string;
  journey: string;
  data: T;
  metadata: EventMetadataDto;
}

/**
 * Options for creating mock events.
 * Allows customization of common event properties.
 */
export interface MockEventOptions {
  userId?: string;
  timestamp?: string | Date;
  metadata?: Partial<EventMetadataDto>;
  service?: string;
}

// ===== HEALTH JOURNEY EVENT INTERFACES =====

/**
 * Interface for health metric recorded event data.
 */
export interface HealthMetricRecordedData extends BaseEventData {
  metricType: HealthMetricType;
  value: number;
  unit: string;
  source?: string;
}

/**
 * Interface for health goal achieved event data.
 */
export interface HealthGoalAchievedData extends BaseEventData {
  goalId: string;
  goalType: HealthGoalType;
  targetValue: number;
  achievedValue: number;
  completedAt: string;
}

/**
 * Interface for health device connected event data.
 */
export interface HealthDeviceConnectedData extends BaseEventData {
  deviceId: string;
  deviceType: DeviceType;
  connectionMethod: string;
  connectedAt: string;
}

/**
 * Interface for health insight generated event data.
 */
export interface HealthInsightGeneratedData extends BaseEventData {
  insightId: string;
  insightType: HealthInsightType;
  metricType: HealthMetricType;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  generatedAt: string;
}

// ===== CARE JOURNEY EVENT INTERFACES =====

/**
 * Interface for care appointment booked event data.
 */
export interface CareAppointmentBookedData extends BaseEventData {
  appointmentId: string;
  providerId: string;
  specialtyType: string;
  appointmentType: 'in_person' | 'telemedicine';
  scheduledAt: string;
  bookedAt: string;
}

/**
 * Interface for care medication taken event data.
 */
export interface CareMedicationTakenData extends BaseEventData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  takenAt: string;
  adherence: 'on_time' | 'late' | 'missed';
}

/**
 * Interface for care telemedicine completed event data.
 */
export interface CareTelemedicineCompletedData extends BaseEventData {
  sessionId: string;
  appointmentId: string;
  providerId: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Interface for care plan task completed event data.
 */
export interface CarePlanTaskCompletedData extends BaseEventData {
  taskId: string;
  planId: string;
  taskType: string;
  completedAt: string;
  status: 'completed' | 'partially_completed';
}

// ===== PLAN JOURNEY EVENT INTERFACES =====

/**
 * Interface for plan claim submitted event data.
 */
export interface PlanClaimSubmittedData extends BaseEventData {
  claimId: string;
  claimType: string;
  providerId: string;
  serviceDate: string;
  amount: number;
  submittedAt: string;
}

/**
 * Interface for plan benefit utilized event data.
 */
export interface PlanBenefitUtilizedData extends BaseEventData {
  benefitId: string;
  benefitType: string;
  providerId?: string;
  utilizationDate: string;
  savingsAmount?: number;
}

/**
 * Interface for plan coverage checked event data.
 */
export interface PlanCoverageCheckedData extends BaseEventData {
  coverageId: string;
  serviceType: string;
  providerId?: string;
  checkedAt: string;
  isCovered: boolean;
  estimatedCoverage?: number;
}

// ===== GAMIFICATION EVENT INTERFACES =====

/**
 * Interface for gamification points earned event data.
 */
export interface GamificationPointsEarnedData extends BaseEventData {
  achievementId?: string;
  sourceType: 'health' | 'care' | 'plan';
  sourceId: string;
  points: number;
  reason: string;
  earnedAt: string;
}

/**
 * Interface for gamification achievement unlocked event data.
 */
export interface GamificationAchievementUnlockedData extends BaseEventData {
  achievementId: string;
  achievementType: string;
  tier: 'bronze' | 'silver' | 'gold';
  points: number;
  unlockedAt: string;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Normalizes a timestamp to ISO string format.
 * If a Date object is provided, it is converted to ISO string.
 * If a string is provided, it is returned as is.
 * If no timestamp is provided, the current date is used.
 * 
 * @param timestamp The timestamp to normalize
 * @returns The normalized timestamp as an ISO string
 */
export function normalizeTimestamp(timestamp?: string | Date): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  return timestamp;
}

/**
 * Creates a base event with common properties.
 * 
 * @param type The event type
 * @param journey The journey name
 * @param data The event data
 * @param options Options for customizing the event
 * @returns A base event object
 */
export function createBaseEvent<T extends BaseEventData>(
  type: string,
  journey: string,
  data: Omit<T, 'userId' | 'timestamp'>,
  options: MockEventOptions = {}
): BaseEvent<T> {
  const timestamp = normalizeTimestamp(options.timestamp);
  const userId = options.userId || 'test-user-id';
  const service = options.service || `${journey}-service`;
  
  const eventData = {
    ...data,
    userId,
    timestamp,
  } as T;
  
  const metadata = createEventMetadata(service, {
    ...options.metadata,
    eventId: options.metadata?.eventId || uuidv4(),
    timestamp: options.metadata?.timestamp ? new Date(options.metadata.timestamp) : new Date(timestamp),
  });
  
  return {
    type,
    journey,
    data: eventData,
    metadata,
  };
}

/**
 * Creates a versioned event with the specified version.
 * 
 * @param event The base event to version
 * @param version The version string in 'major.minor.patch' format
 * @returns A versioned event object
 */
export function createVersionedEventFromBase<T extends BaseEventData>(
  event: BaseEvent<T>,
  version: string = '1.0.0'
): VersionedEventDto<BaseEvent<T>> {
  return createVersionedEvent(event.type, event);
}

// ===== HEALTH JOURNEY EVENT FACTORIES =====

/**
 * Creates a mock health metric recorded event.
 * 
 * @param data The health metric data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A health metric recorded event
 */
export function createHealthMetricRecordedEvent(
  data: Partial<Omit<HealthMetricRecordedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<HealthMetricRecordedData> {
  const defaults: Omit<HealthMetricRecordedData, 'userId' | 'timestamp'> = {
    metricType: HealthMetricType.HEART_RATE,
    value: 75,
    unit: 'bpm',
    source: 'manual',
  };
  
  return createBaseEvent<HealthMetricRecordedData>(
    EventType.HEALTH_METRIC_RECORDED,
    'health',
    { ...defaults, ...data },
    { ...options, service: options.service || 'health-service' }
  );
}

/**
 * Creates a mock health goal achieved event.
 * 
 * @param data The health goal data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A health goal achieved event
 */
export function createHealthGoalAchievedEvent(
  data: Partial<Omit<HealthGoalAchievedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<HealthGoalAchievedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<HealthGoalAchievedData, 'userId' | 'timestamp'> = {
    goalId: uuidv4(),
    goalType: HealthGoalType.STEPS_TARGET,
    targetValue: 10000,
    achievedValue: 10500,
    completedAt: timestamp,
  };
  
  return createBaseEvent<HealthGoalAchievedData>(
    EventType.HEALTH_GOAL_ACHIEVED,
    'health',
    { ...defaults, ...data },
    { ...options, service: options.service || 'health-service' }
  );
}

/**
 * Creates a mock health device connected event.
 * 
 * @param data The device connection data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A health device connected event
 */
export function createHealthDeviceConnectedEvent(
  data: Partial<Omit<HealthDeviceConnectedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<HealthDeviceConnectedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<HealthDeviceConnectedData, 'userId' | 'timestamp'> = {
    deviceId: uuidv4(),
    deviceType: DeviceType.FITNESS_TRACKER,
    connectionMethod: 'bluetooth',
    connectedAt: timestamp,
  };
  
  return createBaseEvent<HealthDeviceConnectedData>(
    EventType.HEALTH_DEVICE_CONNECTED,
    'health',
    { ...defaults, ...data },
    { ...options, service: options.service || 'health-service' }
  );
}

/**
 * Creates a mock health insight generated event.
 * 
 * @param data The health insight data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A health insight generated event
 */
export function createHealthInsightGeneratedEvent(
  data: Partial<Omit<HealthInsightGeneratedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<HealthInsightGeneratedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<HealthInsightGeneratedData, 'userId' | 'timestamp'> = {
    insightId: uuidv4(),
    insightType: HealthInsightType.TREND_ANALYSIS,
    metricType: HealthMetricType.HEART_RATE,
    description: 'Your heart rate has been consistently higher than usual this week.',
    severity: 'info',
    generatedAt: timestamp,
  };
  
  return createBaseEvent<HealthInsightGeneratedData>(
    EventType.HEALTH_INSIGHT_GENERATED,
    'health',
    { ...defaults, ...data },
    { ...options, service: options.service || 'health-service' }
  );
}

// ===== CARE JOURNEY EVENT FACTORIES =====

/**
 * Creates a mock care appointment booked event.
 * 
 * @param data The appointment data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A care appointment booked event
 */
export function createCareAppointmentBookedEvent(
  data: Partial<Omit<CareAppointmentBookedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<CareAppointmentBookedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  // Schedule appointment for tomorrow by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const defaults: Omit<CareAppointmentBookedData, 'userId' | 'timestamp'> = {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: tomorrow.toISOString(),
    bookedAt: timestamp,
  };
  
  return createBaseEvent<CareAppointmentBookedData>(
    EventType.CARE_APPOINTMENT_BOOKED,
    'care',
    { ...defaults, ...data },
    { ...options, service: options.service || 'care-service' }
  );
}

/**
 * Creates a mock care medication taken event.
 * 
 * @param data The medication data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A care medication taken event
 */
export function createCareMedicationTakenEvent(
  data: Partial<Omit<CareMedicationTakenData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<CareMedicationTakenData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<CareMedicationTakenData, 'userId' | 'timestamp'> = {
    medicationId: uuidv4(),
    medicationName: 'Atorvastatina',
    dosage: '20mg',
    takenAt: timestamp,
    adherence: 'on_time',
  };
  
  return createBaseEvent<CareMedicationTakenData>(
    EventType.CARE_MEDICATION_TAKEN,
    'care',
    { ...defaults, ...data },
    { ...options, service: options.service || 'care-service' }
  );
}

/**
 * Creates a mock care telemedicine completed event.
 * 
 * @param data The telemedicine session data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A care telemedicine completed event
 */
export function createCareTelemedicineCompletedEvent(
  data: Partial<Omit<CareTelemedicineCompletedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<CareTelemedicineCompletedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  // Session started 30 minutes ago by default
  const startedAt = new Date(new Date(timestamp).getTime() - 30 * 60 * 1000);
  
  const defaults: Omit<CareTelemedicineCompletedData, 'userId' | 'timestamp'> = {
    sessionId: uuidv4(),
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    startedAt: startedAt.toISOString(),
    endedAt: timestamp,
    duration: 30, // minutes
    quality: 'good',
  };
  
  return createBaseEvent<CareTelemedicineCompletedData>(
    EventType.CARE_TELEMEDICINE_COMPLETED,
    'care',
    { ...defaults, ...data },
    { ...options, service: options.service || 'care-service' }
  );
}

/**
 * Creates a mock care plan task completed event.
 * 
 * @param data The care plan task data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A care plan task completed event
 */
export function createCarePlanTaskCompletedEvent(
  data: Partial<Omit<CarePlanTaskCompletedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<CarePlanTaskCompletedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<CarePlanTaskCompletedData, 'userId' | 'timestamp'> = {
    taskId: uuidv4(),
    planId: uuidv4(),
    taskType: 'medication',
    completedAt: timestamp,
    status: 'completed',
  };
  
  return createBaseEvent<CarePlanTaskCompletedData>(
    EventType.CARE_PLAN_TASK_COMPLETED,
    'care',
    { ...defaults, ...data },
    { ...options, service: options.service || 'care-service' }
  );
}

// ===== PLAN JOURNEY EVENT FACTORIES =====

/**
 * Creates a mock plan claim submitted event.
 * 
 * @param data The claim data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A plan claim submitted event
 */
export function createPlanClaimSubmittedEvent(
  data: Partial<Omit<PlanClaimSubmittedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<PlanClaimSubmittedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  // Service date was yesterday by default
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 30, 0, 0);
  
  const defaults: Omit<PlanClaimSubmittedData, 'userId' | 'timestamp'> = {
    claimId: uuidv4(),
    claimType: 'Consulta Médica',
    providerId: uuidv4(),
    serviceDate: yesterday.toISOString(),
    amount: 250.0,
    submittedAt: timestamp,
  };
  
  return createBaseEvent<PlanClaimSubmittedData>(
    EventType.PLAN_CLAIM_SUBMITTED,
    'plan',
    { ...defaults, ...data },
    { ...options, service: options.service || 'plan-service' }
  );
}

/**
 * Creates a mock plan benefit utilized event.
 * 
 * @param data The benefit utilization data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A plan benefit utilized event
 */
export function createPlanBenefitUtilizedEvent(
  data: Partial<Omit<PlanBenefitUtilizedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<PlanBenefitUtilizedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<PlanBenefitUtilizedData, 'userId' | 'timestamp'> = {
    benefitId: uuidv4(),
    benefitType: 'wellness',
    providerId: uuidv4(),
    utilizationDate: timestamp,
    savingsAmount: 100.0,
  };
  
  return createBaseEvent<PlanBenefitUtilizedData>(
    EventType.PLAN_BENEFIT_UTILIZED,
    'plan',
    { ...defaults, ...data },
    { ...options, service: options.service || 'plan-service' }
  );
}

/**
 * Creates a mock plan coverage checked event.
 * 
 * @param data The coverage check data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A plan coverage checked event
 */
export function createPlanCoverageCheckedEvent(
  data: Partial<Omit<PlanCoverageCheckedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<PlanCoverageCheckedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<PlanCoverageCheckedData, 'userId' | 'timestamp'> = {
    coverageId: uuidv4(),
    serviceType: 'Consulta Médica',
    providerId: uuidv4(),
    checkedAt: timestamp,
    isCovered: true,
    estimatedCoverage: 80.0, // percentage
  };
  
  return createBaseEvent<PlanCoverageCheckedData>(
    'PLAN_COVERAGE_CHECKED', // Custom event type not in the enum
    'plan',
    { ...defaults, ...data },
    { ...options, service: options.service || 'plan-service' }
  );
}

// ===== GAMIFICATION EVENT FACTORIES =====

/**
 * Creates a mock gamification points earned event.
 * 
 * @param data The points earned data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A gamification points earned event
 */
export function createGamificationPointsEarnedEvent(
  data: Partial<Omit<GamificationPointsEarnedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<GamificationPointsEarnedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<GamificationPointsEarnedData, 'userId' | 'timestamp'> = {
    sourceType: 'health',
    sourceId: uuidv4(),
    points: 50,
    reason: 'Recorded health metrics for 7 consecutive days',
    earnedAt: timestamp,
  };
  
  return createBaseEvent<GamificationPointsEarnedData>(
    EventType.GAMIFICATION_POINTS_EARNED,
    'gamification',
    { ...defaults, ...data },
    { ...options, service: options.service || 'gamification-engine' }
  );
}

/**
 * Creates a mock gamification achievement unlocked event.
 * 
 * @param data The achievement data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A gamification achievement unlocked event
 */
export function createGamificationAchievementUnlockedEvent(
  data: Partial<Omit<GamificationAchievementUnlockedData, 'userId' | 'timestamp'>>,
  options: MockEventOptions = {}
): BaseEvent<GamificationAchievementUnlockedData> {
  const timestamp = normalizeTimestamp(options.timestamp);
  
  const defaults: Omit<GamificationAchievementUnlockedData, 'userId' | 'timestamp'> = {
    achievementId: uuidv4(),
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 100,
    unlockedAt: timestamp,
  };
  
  return createBaseEvent<GamificationAchievementUnlockedData>(
    EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    'gamification',
    { ...defaults, ...data },
    { ...options, service: options.service || 'gamification-engine' }
  );
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Creates a batch of mock events for testing.
 * 
 * @param count The number of events to create
 * @param factory The factory function to use for creating events
 * @param baseData Base data to use for all events
 * @param options Options for customizing the events
 * @returns An array of events
 */
export function createEventBatch<T extends BaseEventData, D extends Partial<Omit<T, 'userId' | 'timestamp'>>>(
  count: number,
  factory: (data: D, options: MockEventOptions) => BaseEvent<T>,
  baseData: D = {} as D,
  options: MockEventOptions = {}
): BaseEvent<T>[] {
  const events: BaseEvent<T>[] = [];
  
  for (let i = 0; i < count; i++) {
    events.push(factory(baseData, options));
  }
  
  return events;
}

/**
 * Creates a sequence of events with timestamps spread over a time period.
 * Useful for testing time-based event processing.
 * 
 * @param count The number of events to create
 * @param factory The factory function to use for creating events
 * @param startTime The start time for the sequence
 * @param intervalMs The interval between events in milliseconds
 * @param baseData Base data to use for all events
 * @param options Options for customizing the events
 * @returns An array of events with sequential timestamps
 */
export function createEventSequence<T extends BaseEventData, D extends Partial<Omit<T, 'userId' | 'timestamp'>>>(
  count: number,
  factory: (data: D, options: MockEventOptions) => BaseEvent<T>,
  startTime: Date | string = new Date(),
  intervalMs: number = 60000, // 1 minute by default
  baseData: D = {} as D,
  options: MockEventOptions = {}
): BaseEvent<T>[] {
  const events: BaseEvent<T>[] = [];
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  
  for (let i = 0; i < count; i++) {
    const eventTime = new Date(start.getTime() + (i * intervalMs));
    events.push(factory(
      baseData,
      { ...options, timestamp: eventTime }
    ));
  }
  
  return events;
}

/**
 * Creates a complete user journey with events from multiple journeys.
 * Useful for testing cross-journey event processing and gamification.
 * 
 * @param userId The user ID for all events
 * @param options Options for customizing the events
 * @returns An object containing events from all journeys
 */
export function createUserJourneyEvents(
  userId: string = uuidv4(),
  options: MockEventOptions = {}
): {
  health: BaseEvent<any>[];
  care: BaseEvent<any>[];
  plan: BaseEvent<any>[];
  gamification: BaseEvent<any>[];
  all: BaseEvent<any>[];
} {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  // Create health journey events
  const healthEvents = [
    createHealthMetricRecordedEvent(
      { metricType: HealthMetricType.HEART_RATE, value: 72 },
      { userId, timestamp: threeDaysAgo }
    ),
    createHealthMetricRecordedEvent(
      { metricType: HealthMetricType.STEPS, value: 8500 },
      { userId, timestamp: twoDaysAgo }
    ),
    createHealthMetricRecordedEvent(
      { metricType: HealthMetricType.WEIGHT, value: 70.5 },
      { userId, timestamp: yesterday }
    ),
    createHealthGoalAchievedEvent(
      { goalType: HealthGoalType.STEPS_TARGET },
      { userId, timestamp: now }
    ),
  ];
  
  // Create care journey events
  const careEvents = [
    createCareAppointmentBookedEvent(
      { specialtyType: 'Cardiologia' },
      { userId, timestamp: threeDaysAgo }
    ),
    createCareMedicationTakenEvent(
      { medicationName: 'Atorvastatina' },
      { userId, timestamp: twoDaysAgo }
    ),
    createCareMedicationTakenEvent(
      { medicationName: 'Atorvastatina' },
      { userId, timestamp: yesterday }
    ),
    createCareTelemedicineCompletedEvent(
      { quality: 'excellent' },
      { userId, timestamp: now }
    ),
  ];
  
  // Create plan journey events
  const planEvents = [
    createPlanCoverageCheckedEvent(
      { serviceType: 'Consulta Médica' },
      { userId, timestamp: threeDaysAgo }
    ),
    createPlanClaimSubmittedEvent(
      { claimType: 'Consulta Médica' },
      { userId, timestamp: twoDaysAgo }
    ),
    createPlanBenefitUtilizedEvent(
      { benefitType: 'wellness' },
      { userId, timestamp: yesterday }
    ),
  ];
  
  // Create gamification events
  const gamificationEvents = [
    createGamificationPointsEarnedEvent(
      { sourceType: 'health', points: 50 },
      { userId, timestamp: twoDaysAgo }
    ),
    createGamificationPointsEarnedEvent(
      { sourceType: 'care', points: 75 },
      { userId, timestamp: yesterday }
    ),
    createGamificationAchievementUnlockedEvent(
      { achievementType: 'health-check-streak', tier: 'bronze' },
      { userId, timestamp: now }
    ),
  ];
  
  // Combine all events
  const allEvents = [
    ...healthEvents,
    ...careEvents,
    ...planEvents,
    ...gamificationEvents,
  ];
  
  // Sort events by timestamp
  allEvents.sort((a, b) => {
    const aTime = new Date(a.data.timestamp).getTime();
    const bTime = new Date(b.data.timestamp).getTime();
    return aTime - bTime;
  });
  
  return {
    health: healthEvents,
    care: careEvents,
    plan: planEvents,
    gamification: gamificationEvents,
    all: allEvents,
  };
}

/**
 * Creates a mock event based on the event type.
 * This is a convenience function that delegates to the appropriate factory function.
 * 
 * @param eventType The type of event to create
 * @param data The event data (partial, will be merged with defaults)
 * @param options Options for customizing the event
 * @returns A mock event of the specified type
 */
export function createMockEvent(
  eventType: EventType | string,
  data: Partial<any> = {},
  options: MockEventOptions = {}
): BaseEvent<any> {
  switch (eventType) {
    // Health journey events
    case EventType.HEALTH_METRIC_RECORDED:
      return createHealthMetricRecordedEvent(data, options);
    case EventType.HEALTH_GOAL_ACHIEVED:
      return createHealthGoalAchievedEvent(data, options);
    case EventType.HEALTH_DEVICE_CONNECTED:
      return createHealthDeviceConnectedEvent(data, options);
    case EventType.HEALTH_INSIGHT_GENERATED:
      return createHealthInsightGeneratedEvent(data, options);
      
    // Care journey events
    case EventType.CARE_APPOINTMENT_BOOKED:
      return createCareAppointmentBookedEvent(data, options);
    case EventType.CARE_MEDICATION_TAKEN:
      return createCareMedicationTakenEvent(data, options);
    case EventType.CARE_TELEMEDICINE_COMPLETED:
      return createCareTelemedicineCompletedEvent(data, options);
    case EventType.CARE_PLAN_TASK_COMPLETED:
      return createCarePlanTaskCompletedEvent(data, options);
      
    // Plan journey events
    case EventType.PLAN_CLAIM_SUBMITTED:
      return createPlanClaimSubmittedEvent(data, options);
    case EventType.PLAN_BENEFIT_UTILIZED:
      return createPlanBenefitUtilizedEvent(data, options);
    case 'PLAN_COVERAGE_CHECKED': // Custom event type not in the enum
      return createPlanCoverageCheckedEvent(data, options);
      
    // Gamification events
    case EventType.GAMIFICATION_POINTS_EARNED:
      return createGamificationPointsEarnedEvent(data, options);
    case EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED:
      return createGamificationAchievementUnlockedEvent(data, options);
      
    default:
      throw new Error(`Unsupported event type: ${eventType}`);
  }
}