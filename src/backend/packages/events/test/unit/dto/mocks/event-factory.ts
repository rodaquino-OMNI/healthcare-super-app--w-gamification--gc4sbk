/**
 * @file event-factory.ts
 * @description Provides utility functions that generate customizable mock event data for testing purposes.
 * This factory module enables test writers to quickly create standard-compliant events with controlled
 * variations, supporting both valid and invalid scenarios while maintaining structural consistency.
 *
 * @module events/test/unit/dto/mocks
 */

import { v4 as uuidv4 } from 'uuid';
import { EventType, JourneyEvents } from '../../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto, createEventMetadata } from '../../../../src/dto/event-metadata.dto';
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
 * Base interface for all event data in the system.
 */
export interface BaseEventData {
  [key: string]: any;
}

/**
 * Interface for a generic event structure used in testing.
 */
export interface MockEvent<T extends BaseEventData = BaseEventData> {
  type: string;
  userId: string;
  journey: string;
  data: T;
  metadata?: EventMetadataDto;
}

/**
 * Options for customizing generated mock events.
 */
export interface EventFactoryOptions<T extends BaseEventData = BaseEventData> {
  type?: string;
  userId?: string;
  journey?: string;
  data?: Partial<T>;
  metadata?: Partial<EventMetadataDto>;
  isValid?: boolean;
}

/**
 * Creates a basic mock event with default values.
 * 
 * @param options Options to customize the generated event
 * @returns A mock event with the specified options
 */
export function createMockEvent<T extends BaseEventData = BaseEventData>(
  options: EventFactoryOptions<T> = {}
): MockEvent<T> {
  const {
    type = EventType.USER_LOGIN,
    userId = uuidv4(),
    journey = 'user',
    data = {} as T,
    metadata,
    isValid = true
  } = options;

  // Create default metadata if not provided
  const defaultMetadata = createEventMetadata('test-service', {
    correlationId: uuidv4(),
    timestamp: new Date(),
    ...(metadata || {})
  });

  // For invalid events, we might want to create incomplete metadata
  const eventMetadata = isValid ? defaultMetadata : {
    ...defaultMetadata,
    ...(metadata || {})
  };

  return {
    type,
    userId: isValid ? userId : (userId || ''),
    journey,
    data: data as T,
    metadata: eventMetadata
  };
}

/**
 * Creates an invalid mock event by omitting required fields or using invalid values.
 * 
 * @param options Options to customize the generated invalid event
 * @returns An invalid mock event for testing validation logic
 */
export function createInvalidMockEvent<T extends BaseEventData = BaseEventData>(
  options: EventFactoryOptions<T> = {}
): MockEvent<T> {
  return createMockEvent({
    ...options,
    isValid: false
  });
}

/**
 * Creates a mock event with a specific event type.
 * 
 * @param eventType The event type to use
 * @param options Additional options to customize the event
 * @returns A mock event with the specified event type
 */
export function createMockEventWithType<T extends BaseEventData = BaseEventData>(
  eventType: EventType,
  options: EventFactoryOptions<T> = {}
): MockEvent<T> {
  return createMockEvent({
    ...options,
    type: eventType
  });
}

/**
 * Creates a mock event for a specific journey.
 * 
 * @param journey The journey to create the event for ('health', 'care', 'plan', etc.)
 * @param options Additional options to customize the event
 * @returns A mock event for the specified journey
 */
export function createMockEventForJourney<T extends BaseEventData = BaseEventData>(
  journey: string,
  options: EventFactoryOptions<T> = {}
): MockEvent<T> {
  return createMockEvent({
    ...options,
    journey
  });
}

// Health Journey Event Factories

/**
 * Creates a mock health metric recorded event.
 * 
 * @param options Options to customize the health metric event
 * @returns A mock health metric recorded event
 */
export function createHealthMetricEvent(
  options: EventFactoryOptions<HealthMetricData> = {}
): MockEvent<HealthMetricData> {
  const defaultData: HealthMetricData = {
    metricType: HealthMetricType.HEART_RATE,
    value: 75,
    unit: 'bpm',
    recordedAt: new Date().toISOString(),
    notes: 'Recorded after light exercise',
    deviceId: uuidv4()
  };

  return createMockEvent({
    type: EventType.HEALTH_METRIC_RECORDED,
    journey: 'health',
    data: { ...defaultData, ...(options.data || {}) } as HealthMetricData,
    ...options
  });
}

/**
 * Creates a mock health goal achieved event.
 * 
 * @param options Options to customize the health goal event
 * @returns A mock health goal achieved event
 */
export function createHealthGoalEvent(
  options: EventFactoryOptions<HealthGoalData> = {}
): MockEvent<HealthGoalData> {
  const defaultData: HealthGoalData = {
    goalId: uuidv4(),
    goalType: HealthGoalType.STEPS_TARGET,
    description: 'Daily step goal',
    targetValue: 10000,
    unit: 'steps',
    achievedAt: new Date().toISOString(),
    progressPercentage: 100,
    isAchieved: () => true,
    markAsAchieved: () => {}
  };

  return createMockEvent({
    type: EventType.HEALTH_GOAL_ACHIEVED,
    journey: 'health',
    data: { ...defaultData, ...(options.data || {}) } as HealthGoalData,
    ...options
  });
}

/**
 * Creates a mock device synchronized event.
 * 
 * @param options Options to customize the device sync event
 * @returns A mock device synchronized event
 */
export function createDeviceSyncEvent(
  options: EventFactoryOptions<DeviceSyncData> = {}
): MockEvent<DeviceSyncData> {
  const defaultData: DeviceSyncData = {
    deviceId: uuidv4(),
    deviceType: DeviceType.FITNESS_TRACKER,
    deviceName: 'Fitbit Charge 5',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    dataPointsCount: 24,
    metricTypes: [HealthMetricType.HEART_RATE, HealthMetricType.STEPS],
    markAsFailed: (errorMessage: string) => {},
    markAsSuccessful: (dataPointsCount: number, metricTypes: HealthMetricType[]) => {}
  };

  return createMockEvent({
    type: EventType.HEALTH_DEVICE_CONNECTED,
    journey: 'health',
    data: { ...defaultData, ...(options.data || {}) } as DeviceSyncData,
    ...options
  });
}

/**
 * Creates a mock health insight generated event.
 * 
 * @param options Options to customize the health insight event
 * @returns A mock health insight generated event
 */
export function createHealthInsightEvent(
  options: EventFactoryOptions<HealthInsightData> = {}
): MockEvent<HealthInsightData> {
  const defaultData: HealthInsightData = {
    insightId: uuidv4(),
    insightType: HealthInsightType.TREND_ANALYSIS,
    title: 'Improving Sleep Pattern',
    description: 'Your sleep duration has improved by 15% over the last week.',
    relatedMetricTypes: [HealthMetricType.SLEEP],
    confidenceScore: 85,
    generatedAt: new Date().toISOString(),
    userAcknowledged: false,
    acknowledgeByUser: () => {},
    isHighPriority: () => false
  };

  return createMockEvent({
    type: EventType.HEALTH_INSIGHT_GENERATED,
    journey: 'health',
    data: { ...defaultData, ...(options.data || {}) } as HealthInsightData,
    ...options
  });
}

// Care Journey Event Factories

/**
 * Interface for appointment event data.
 */
export interface AppointmentEventData extends BaseEventData {
  appointmentId: string;
  providerId: string;
  specialtyType: string;
  appointmentType: string;
  scheduledAt: string;
  bookedAt?: string;
  completedAt?: string;
  duration?: number;
}

/**
 * Creates a mock appointment booked event.
 * 
 * @param options Options to customize the appointment event
 * @returns A mock appointment booked event
 */
export function createAppointmentBookedEvent(
  options: EventFactoryOptions<AppointmentEventData> = {}
): MockEvent<AppointmentEventData> {
  const defaultData: AppointmentEventData = {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    bookedAt: new Date().toISOString()
  };

  return createMockEvent({
    type: EventType.CARE_APPOINTMENT_BOOKED,
    journey: 'care',
    data: { ...defaultData, ...(options.data || {}) } as AppointmentEventData,
    ...options
  });
}

/**
 * Creates a mock appointment completed event.
 * 
 * @param options Options to customize the appointment event
 * @returns A mock appointment completed event
 */
export function createAppointmentCompletedEvent(
  options: EventFactoryOptions<AppointmentEventData> = {}
): MockEvent<AppointmentEventData> {
  const defaultData: AppointmentEventData = {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    completedAt: new Date().toISOString(),
    duration: 30 // 30 minutes
  };

  return createMockEvent({
    type: EventType.CARE_APPOINTMENT_COMPLETED,
    journey: 'care',
    data: { ...defaultData, ...(options.data || {}) } as AppointmentEventData,
    ...options
  });
}

/**
 * Interface for medication event data.
 */
export interface MedicationEventData extends BaseEventData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  takenAt: string;
  adherence: string;
}

/**
 * Creates a mock medication taken event.
 * 
 * @param options Options to customize the medication event
 * @returns A mock medication taken event
 */
export function createMedicationTakenEvent(
  options: EventFactoryOptions<MedicationEventData> = {}
): MockEvent<MedicationEventData> {
  const defaultData: MedicationEventData = {
    medicationId: uuidv4(),
    medicationName: 'Atorvastatina',
    dosage: '20mg',
    takenAt: new Date().toISOString(),
    adherence: 'on_time'
  };

  return createMockEvent({
    type: EventType.CARE_MEDICATION_TAKEN,
    journey: 'care',
    data: { ...defaultData, ...(options.data || {}) } as MedicationEventData,
    ...options
  });
}

// Plan Journey Event Factories

/**
 * Interface for claim event data.
 */
export interface ClaimEventData extends BaseEventData {
  claimId: string;
  claimType: string;
  providerId: string;
  serviceDate: string;
  amount: number;
  submittedAt?: string;
  status?: string;
  coveredAmount?: number;
  processedAt?: string;
}

/**
 * Creates a mock claim submitted event.
 * 
 * @param options Options to customize the claim event
 * @returns A mock claim submitted event
 */
export function createClaimSubmittedEvent(
  options: EventFactoryOptions<ClaimEventData> = {}
): MockEvent<ClaimEventData> {
  const defaultData: ClaimEventData = {
    claimId: uuidv4(),
    claimType: 'Consulta Médica',
    providerId: uuidv4(),
    serviceDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    amount: 250.00,
    submittedAt: new Date().toISOString()
  };

  return createMockEvent({
    type: EventType.PLAN_CLAIM_SUBMITTED,
    journey: 'plan',
    data: { ...defaultData, ...(options.data || {}) } as ClaimEventData,
    ...options
  });
}

/**
 * Creates a mock claim processed event.
 * 
 * @param options Options to customize the claim event
 * @returns A mock claim processed event
 */
export function createClaimProcessedEvent(
  options: EventFactoryOptions<ClaimEventData> = {}
): MockEvent<ClaimEventData> {
  const defaultData: ClaimEventData = {
    claimId: uuidv4(),
    claimType: 'Consulta Médica',
    providerId: uuidv4(),
    serviceDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    amount: 250.00,
    status: 'approved',
    coveredAmount: 200.00,
    processedAt: new Date().toISOString()
  };

  return createMockEvent({
    type: EventType.PLAN_CLAIM_PROCESSED,
    journey: 'plan',
    data: { ...defaultData, ...(options.data || {}) } as ClaimEventData,
    ...options
  });
}

/**
 * Interface for benefit event data.
 */
export interface BenefitEventData extends BaseEventData {
  benefitId: string;
  benefitType: string;
  providerId?: string;
  utilizationDate: string;
  savingsAmount?: number;
}

/**
 * Creates a mock benefit utilized event.
 * 
 * @param options Options to customize the benefit event
 * @returns A mock benefit utilized event
 */
export function createBenefitUtilizedEvent(
  options: EventFactoryOptions<BenefitEventData> = {}
): MockEvent<BenefitEventData> {
  const defaultData: BenefitEventData = {
    benefitId: uuidv4(),
    benefitType: 'wellness',
    providerId: uuidv4(),
    utilizationDate: new Date().toISOString(),
    savingsAmount: 75.00
  };

  return createMockEvent({
    type: EventType.PLAN_BENEFIT_UTILIZED,
    journey: 'plan',
    data: { ...defaultData, ...(options.data || {}) } as BenefitEventData,
    ...options
  });
}

// Gamification Event Factories

/**
 * Interface for points earned event data.
 */
export interface PointsEarnedEventData extends BaseEventData {
  achievementId?: string;
  sourceType: string;
  sourceId: string;
  points: number;
  reason: string;
  earnedAt: string;
}

/**
 * Creates a mock points earned event.
 * 
 * @param options Options to customize the points event
 * @returns A mock points earned event
 */
export function createPointsEarnedEvent(
  options: EventFactoryOptions<PointsEarnedEventData> = {}
): MockEvent<PointsEarnedEventData> {
  const defaultData: PointsEarnedEventData = {
    sourceType: 'health',
    sourceId: uuidv4(),
    points: 50,
    reason: 'Daily step goal achieved',
    earnedAt: new Date().toISOString()
  };

  return createMockEvent({
    type: EventType.GAMIFICATION_POINTS_EARNED,
    journey: 'gamification',
    data: { ...defaultData, ...(options.data || {}) } as PointsEarnedEventData,
    ...options
  });
}

/**
 * Interface for achievement unlocked event data.
 */
export interface AchievementUnlockedEventData extends BaseEventData {
  achievementId: string;
  achievementType: string;
  tier: string;
  points: number;
  unlockedAt: string;
}

/**
 * Creates a mock achievement unlocked event.
 * 
 * @param options Options to customize the achievement event
 * @returns A mock achievement unlocked event
 */
export function createAchievementUnlockedEvent(
  options: EventFactoryOptions<AchievementUnlockedEventData> = {}
): MockEvent<AchievementUnlockedEventData> {
  const defaultData: AchievementUnlockedEventData = {
    achievementId: uuidv4(),
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 100,
    unlockedAt: new Date().toISOString()
  };

  return createMockEvent({
    type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    journey: 'gamification',
    data: { ...defaultData, ...(options.data || {}) } as AchievementUnlockedEventData,
    ...options
  });
}

/**
 * Utility function to generate a random event for testing.
 * 
 * @returns A random mock event from any journey
 */
export function createRandomEvent(): MockEvent {
  const eventTypes = Object.values(EventType);
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  // Determine journey based on event type prefix
  let journey = 'user';
  if (randomType.startsWith('HEALTH_')) journey = 'health';
  if (randomType.startsWith('CARE_')) journey = 'care';
  if (randomType.startsWith('PLAN_')) journey = 'plan';
  if (randomType.startsWith('GAMIFICATION_')) journey = 'gamification';
  
  return createMockEventWithType(randomType as EventType, { journey });
}

/**
 * Creates a batch of mock events for testing.
 * 
 * @param count Number of events to create
 * @param options Options to customize the events
 * @returns An array of mock events
 */
export function createMockEventBatch(
  count: number,
  options: EventFactoryOptions = {}
): MockEvent[] {
  return Array.from({ length: count }, () => createMockEvent(options));
}

/**
 * Creates a batch of random events for testing.
 * 
 * @param count Number of random events to create
 * @returns An array of random mock events
 */
export function createRandomEventBatch(count: number): MockEvent[] {
  return Array.from({ length: count }, () => createRandomEvent());
}