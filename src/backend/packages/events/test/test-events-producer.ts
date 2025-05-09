/**
 * @file test-events-producer.ts
 * @description Utility for generating test events for all supported event types across journey services.
 * This file provides factory methods for creating standardized, valid test events with customizable
 * payloads for each journey (Health, Care, Plan). It ensures tests have consistent, properly
 * structured events for Kafka producer and consumer testing.
 * 
 * @example
 * // Import the default test event producer
 * import testEvents from './test-events-producer';
 * 
 * // Generate a single event
 * const healthEvent = testEvents.health.generateMetricRecorded();
 * 
 * // Generate a batch of events
 * const randomEvents = testEvents.generateRandomBatch(5);
 * 
 * // Generate events for a specific journey
 * const careEvents = testEvents.generateJourneyBatch('care', 3);
 * 
 * // Create a sequence of events that simulate a user journey
 * const userJourney = testEvents.createUserJourneySequence('user-123', 'health');
 * 
 * // Validate events
 * testEvents.validate(healthEvent);
 * const batchValidation = testEvents.validateBatch(randomEvents);
 * 
 * @example
 * // Using with Kafka tests
 * import testEvents from './test-events-producer';
 * import { KafkaProducer } from '../src/kafka/kafka-producer';
 * 
 * describe('Kafka Producer Tests', () => {
 *   let producer: KafkaProducer;
 *   
 *   beforeEach(() => {
 *     producer = new KafkaProducer({ clientId: 'test-client' });
 *   });
 *   
 *   it('should produce a health event', async () => {
 *     const event = testEvents.health.generateMetricRecorded();
 *     await producer.produce('health-events', event);
 *     // Assert event was produced correctly
 *   });
 * });
 */

// Import event types and interfaces from the gamification package
import {
  GamificationEvent,
  EventPayload,
  EventType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
  createEvent,
  parseVersion,
  compareVersions,
  // Health journey payload interfaces
  HealthMetricRecordedPayload,
  GoalAchievedPayload,
  DeviceConnectedPayload,
  // Care journey payload interfaces
  AppointmentBookedPayload,
  MedicationTakenPayload,
  TelemedicineSessionCompletedPayload,
  // Plan journey payload interfaces
  ClaimSubmittedPayload,
  BenefitUtilizedPayload,
  PlanSelectedPayload,
  // Common event payload interfaces
  AchievementUnlockedPayload,
  QuestCompletedPayload,
  RewardRedeemedPayload,
} from '@austa/interfaces/gamification';

// Import common types
import { JourneyType } from '@austa/interfaces/common/types';

/**
 * Options for generating test events
 */
export interface TestEventOptions {
  /**
   * Custom user ID to use for the event
   * @default 'test-user-id'
   */
  userId?: string;

  /**
   * Custom timestamp to use for the event
   * @default current time in ISO format
   */
  timestamp?: string;

  /**
   * Custom version to use for the event
   * @default '1.0.0'
   */
  version?: string;

  /**
   * Custom correlation ID to use for the event
   * @default randomly generated UUID
   */
  correlationId?: string;

  /**
   * Custom event ID to use for the event
   * @default randomly generated UUID
   */
  id?: string;

  /**
   * Custom journey to use for the event
   * If not provided, will be inferred from the event type
   */
  journey?: JourneyType;

  /**
   * Custom payload data to merge with the default payload
   */
  payloadData?: Record<string, any>;

  /**
   * Custom metadata to include in the payload
   */
  metadata?: Record<string, any>;
}

/**
 * Generates a random UUID for use in test events
 * @returns A random UUID string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Base function to generate a test event with default values
 * @param type The event type
 * @param defaultPayload The default payload for this event type
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateTestEvent<T>(
  type: EventType,
  defaultPayload: T,
  options: TestEventOptions = {}
): GamificationEvent {
  const {
    userId = 'test-user-id',
    timestamp = new Date().toISOString(),
    version = '1.0.0',
    correlationId = generateUUID(),
    id = generateUUID(),
    journey,
    payloadData = {},
    metadata = {},
  } = options;

  // Merge default payload with custom payload data
  const mergedPayloadData = { ...defaultPayload, ...payloadData };

  // Create the event payload
  const payload: EventPayload<T> = {
    data: mergedPayloadData,
    metadata,
  };

  // Determine the journey if not provided
  let eventJourney = journey;
  if (!eventJourney) {
    if (Object.values(HealthEventType).includes(type as HealthEventType)) {
      eventJourney = 'health';
    } else if (Object.values(CareEventType).includes(type as CareEventType)) {
      eventJourney = 'care';
    } else if (Object.values(PlanEventType).includes(type as PlanEventType)) {
      eventJourney = 'plan';
    }
    // Common events don't have a specific journey
  }

  // Create and return the event
  return {
    id,
    type,
    userId,
    payload,
    journey: eventJourney,
    timestamp,
    version,
    correlationId,
  };
}

// ===== HEALTH JOURNEY EVENT GENERATORS =====

/**
 * Generates a test HEALTH_METRIC_RECORDED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateHealthMetricRecordedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: HealthMetricRecordedPayload = {
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    source: 'test-device',
    recordedAt: new Date().toISOString(),
    previousValue: 72,
    changePercentage: 4.17,
  };

  return generateTestEvent(
    HealthEventType.HEALTH_METRIC_RECORDED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test GOAL_ACHIEVED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateGoalAchievedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: GoalAchievedPayload = {
    goalId: generateUUID(),
    goalType: 'STEPS',
    achievedAt: new Date().toISOString(),
    targetValue: 10000,
    actualValue: 10250,
    streakCount: 3,
  };

  return generateTestEvent(
    HealthEventType.GOAL_ACHIEVED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test DEVICE_CONNECTED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateDeviceConnectedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: DeviceConnectedPayload = {
    deviceId: generateUUID(),
    deviceType: 'Smartwatch',
    connectionTime: new Date().toISOString(),
    isFirstConnection: false,
  };

  return generateTestEvent(
    HealthEventType.DEVICE_CONNECTED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test GOAL_CREATED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateGoalCreatedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload = {
    goalId: generateUUID(),
    goalType: 'STEPS',
    targetValue: 10000,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    recurrence: 'DAILY',
  };

  return generateTestEvent(
    HealthEventType.GOAL_CREATED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test HEALTH_INSIGHT_VIEWED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateHealthInsightViewedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload = {
    insightId: generateUUID(),
    insightType: 'TREND',
    metricType: 'HEART_RATE',
    viewedAt: new Date().toISOString(),
  };

  return generateTestEvent(
    HealthEventType.HEALTH_INSIGHT_VIEWED,
    defaultPayload,
    options
  );
}

// ===== CARE JOURNEY EVENT GENERATORS =====

/**
 * Generates a test APPOINTMENT_BOOKED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateAppointmentBookedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: AppointmentBookedPayload = {
    appointmentId: generateUUID(),
    appointmentType: 'CONSULTATION',
    providerId: generateUUID(),
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    isFirstAppointment: false,
    specialtyArea: 'Cardiologia',
  };

  return generateTestEvent(
    CareEventType.APPOINTMENT_BOOKED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test APPOINTMENT_ATTENDED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateAppointmentAttendedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload = {
    appointmentId: generateUUID(),
    appointmentType: 'CONSULTATION',
    providerId: generateUUID(),
    attendedAt: new Date().toISOString(),
    duration: 30, // minutes
    notes: 'Test appointment notes',
  };

  return generateTestEvent(
    CareEventType.APPOINTMENT_ATTENDED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test MEDICATION_TAKEN event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateMedicationTakenEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: MedicationTakenPayload = {
    medicationId: generateUUID(),
    takenAt: new Date().toISOString(),
    dosage: '10mg',
    adherencePercentage: 95,
    onSchedule: true,
    streakDays: 7,
  };

  return generateTestEvent(
    CareEventType.MEDICATION_TAKEN,
    defaultPayload,
    options
  );
}

/**
 * Generates a test TELEMEDICINE_SESSION_COMPLETED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateTelemedicineSessionCompletedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: TelemedicineSessionCompletedPayload = {
    sessionId: generateUUID(),
    providerId: generateUUID(),
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    endTime: new Date().toISOString(),
    duration: 30,
    specialtyArea: 'Dermatologia',
  };

  return generateTestEvent(
    CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test TREATMENT_PLAN_CREATED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateTreatmentPlanCreatedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload = {
    planId: generateUUID(),
    providerId: generateUUID(),
    createdAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    condition: 'Test condition',
    medications: [
      {
        medicationId: generateUUID(),
        name: 'Test Medication',
        dosage: '10mg',
        frequency: 'DAILY',
      },
    ],
  };

  return generateTestEvent(
    CareEventType.TREATMENT_PLAN_CREATED,
    defaultPayload,
    options
  );
}

// ===== PLAN JOURNEY EVENT GENERATORS =====

/**
 * Generates a test CLAIM_SUBMITTED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateClaimSubmittedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: ClaimSubmittedPayload = {
    claimId: generateUUID(),
    amount: 150.0,
    claimType: 'Consulta Médica',
    submittedAt: new Date().toISOString(),
    hasDocuments: true,
    isFirstClaim: false,
  };

  return generateTestEvent(
    PlanEventType.CLAIM_SUBMITTED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test BENEFIT_VIEWED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateBenefitViewedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: BenefitUtilizedPayload = {
    benefitId: generateUUID(),
    benefitType: 'DISCOUNT',
    utilizedAt: new Date().toISOString(),
    savingsAmount: 50.0,
    isFirstUtilization: false,
  };

  return generateTestEvent(
    PlanEventType.BENEFIT_VIEWED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test PLAN_SELECTED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generatePlanSelectedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: PlanSelectedPayload = {
    planId: generateUUID(),
    planType: 'Premium',
    selectedAt: new Date().toISOString(),
    coverageLevel: 'COMPREHENSIVE',
    annualCost: 5000.0,
    isNewEnrollment: true,
  };

  return generateTestEvent(
    PlanEventType.PLAN_SELECTED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test CLAIM_APPROVED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateClaimApprovedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload = {
    claimId: generateUUID(),
    amount: 150.0,
    approvedAt: new Date().toISOString(),
    paymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    paymentMethod: 'BANK_TRANSFER',
  };

  return generateTestEvent(
    PlanEventType.CLAIM_APPROVED,
    defaultPayload,
    options
  );
}

// ===== COMMON EVENT GENERATORS =====

/**
 * Generates a test ACHIEVEMENT_UNLOCKED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateAchievementUnlockedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: AchievementUnlockedPayload = {
    achievementId: generateUUID(),
    achievementName: 'Test Achievement',
    unlockedAt: new Date().toISOString(),
    pointsAwarded: 100,
    journey: 'health',
    rarity: 'uncommon',
  };

  return generateTestEvent(
    CommonEventType.ACHIEVEMENT_UNLOCKED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test QUEST_COMPLETED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateQuestCompletedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: QuestCompletedPayload = {
    questId: generateUUID(),
    questName: 'Test Quest',
    completedAt: new Date().toISOString(),
    pointsAwarded: 250,
    journey: 'care',
  };

  return generateTestEvent(
    CommonEventType.QUEST_COMPLETED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test REWARD_REDEEMED event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateRewardRedeemedEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload: RewardRedeemedPayload = {
    rewardId: generateUUID(),
    rewardName: 'Test Reward',
    redeemedAt: new Date().toISOString(),
    value: 500,
    rewardType: 'discount',
  };

  return generateTestEvent(
    CommonEventType.REWARD_REDEEMED,
    defaultPayload,
    options
  );
}

/**
 * Generates a test USER_LOGGED_IN event
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateUserLoggedInEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const defaultPayload = {
    loginTime: new Date().toISOString(),
    platform: 'MOBILE',
    deviceType: 'Android',
    loginMethod: 'PASSWORD',
  };

  return generateTestEvent(
    CommonEventType.USER_LOGGED_IN,
    defaultPayload,
    options
  );
}

// ===== UTILITY FUNCTIONS =====

/**
 * Map of event types to their generator functions
 */
const eventGenerators: Record<EventType, (options?: TestEventOptions) => GamificationEvent> = {
  // Health journey events
  [HealthEventType.HEALTH_METRIC_RECORDED]: generateHealthMetricRecordedEvent,
  [HealthEventType.GOAL_ACHIEVED]: generateGoalAchievedEvent,
  [HealthEventType.DEVICE_CONNECTED]: generateDeviceConnectedEvent,
  [HealthEventType.GOAL_CREATED]: generateGoalCreatedEvent,
  [HealthEventType.HEALTH_INSIGHT_VIEWED]: generateHealthInsightViewedEvent,
  [HealthEventType.GOAL_UPDATED]: (options) => generateTestEvent(HealthEventType.GOAL_UPDATED, { goalId: generateUUID(), updatedFields: ['targetValue'] }, options),
  [HealthEventType.DEVICE_SYNCED]: (options) => generateTestEvent(HealthEventType.DEVICE_SYNCED, { deviceId: generateUUID(), syncTime: new Date().toISOString() }, options),
  [HealthEventType.MEDICAL_EVENT_RECORDED]: (options) => generateTestEvent(HealthEventType.MEDICAL_EVENT_RECORDED, { eventId: generateUUID(), eventType: 'VACCINATION', recordedAt: new Date().toISOString() }, options),
  
  // Care journey events
  [CareEventType.APPOINTMENT_BOOKED]: generateAppointmentBookedEvent,
  [CareEventType.APPOINTMENT_ATTENDED]: generateAppointmentAttendedEvent,
  [CareEventType.MEDICATION_TAKEN]: generateMedicationTakenEvent,
  [CareEventType.TELEMEDICINE_SESSION_COMPLETED]: generateTelemedicineSessionCompletedEvent,
  [CareEventType.TREATMENT_PLAN_CREATED]: generateTreatmentPlanCreatedEvent,
  [CareEventType.APPOINTMENT_CANCELLED]: (options) => generateTestEvent(CareEventType.APPOINTMENT_CANCELLED, { appointmentId: generateUUID(), cancelledAt: new Date().toISOString(), reason: 'TEST_CANCELLATION' }, options),
  [CareEventType.MEDICATION_ADDED]: (options) => generateTestEvent(CareEventType.MEDICATION_ADDED, { medicationId: generateUUID(), name: 'Test Medication', dosage: '10mg', frequency: 'DAILY' }, options),
  [CareEventType.MEDICATION_SKIPPED]: (options) => generateTestEvent(CareEventType.MEDICATION_SKIPPED, { medicationId: generateUUID(), skippedAt: new Date().toISOString(), reason: 'FORGOT' }, options),
  [CareEventType.TELEMEDICINE_SESSION_STARTED]: (options) => generateTestEvent(CareEventType.TELEMEDICINE_SESSION_STARTED, { sessionId: generateUUID(), providerId: generateUUID(), startTime: new Date().toISOString() }, options),
  [CareEventType.SYMPTOM_CHECKED]: (options) => generateTestEvent(CareEventType.SYMPTOM_CHECKED, { symptomId: generateUUID(), symptomName: 'Test Symptom', checkedAt: new Date().toISOString() }, options),
  [CareEventType.TREATMENT_PLAN_COMPLETED]: (options) => generateTestEvent(CareEventType.TREATMENT_PLAN_COMPLETED, { planId: generateUUID(), completedAt: new Date().toISOString(), success: true }, options),
  
  // Plan journey events
  [PlanEventType.CLAIM_SUBMITTED]: generateClaimSubmittedEvent,
  [PlanEventType.BENEFIT_VIEWED]: generateBenefitViewedEvent,
  [PlanEventType.PLAN_SELECTED]: generatePlanSelectedEvent,
  [PlanEventType.CLAIM_APPROVED]: generateClaimApprovedEvent,
  [PlanEventType.PLAN_VIEWED]: (options) => generateTestEvent(PlanEventType.PLAN_VIEWED, { planId: generateUUID(), viewedAt: new Date().toISOString() }, options),
  [PlanEventType.CLAIM_REJECTED]: (options) => generateTestEvent(PlanEventType.CLAIM_REJECTED, { claimId: generateUUID(), rejectedAt: new Date().toISOString(), reason: 'TEST_REJECTION' }, options),
  [PlanEventType.DOCUMENT_UPLOADED]: (options) => generateTestEvent(PlanEventType.DOCUMENT_UPLOADED, { documentId: generateUUID(), documentType: 'RECEIPT', uploadedAt: new Date().toISOString() }, options),
  [PlanEventType.COVERAGE_CHECKED]: (options) => generateTestEvent(PlanEventType.COVERAGE_CHECKED, { serviceId: generateUUID(), serviceName: 'Test Service', checkedAt: new Date().toISOString(), isCovered: true }, options),
  [PlanEventType.PLAN_COMPARED]: (options) => generateTestEvent(PlanEventType.PLAN_COMPARED, { planIds: [generateUUID(), generateUUID()], comparedAt: new Date().toISOString() }, options),
  
  // Common events
  [CommonEventType.ACHIEVEMENT_UNLOCKED]: generateAchievementUnlockedEvent,
  [CommonEventType.QUEST_COMPLETED]: generateQuestCompletedEvent,
  [CommonEventType.REWARD_REDEEMED]: generateRewardRedeemedEvent,
  [CommonEventType.USER_LOGGED_IN]: generateUserLoggedInEvent,
  [CommonEventType.USER_REGISTERED]: (options) => generateTestEvent(CommonEventType.USER_REGISTERED, { registrationTime: new Date().toISOString(), platform: 'WEB' }, options),
  [CommonEventType.PROFILE_UPDATED]: (options) => generateTestEvent(CommonEventType.PROFILE_UPDATED, { updatedAt: new Date().toISOString(), updatedFields: ['name', 'email'] }, options),
  [CommonEventType.NOTIFICATION_VIEWED]: (options) => generateTestEvent(CommonEventType.NOTIFICATION_VIEWED, { notificationId: generateUUID(), viewedAt: new Date().toISOString() }, options),
  [CommonEventType.FEEDBACK_SUBMITTED]: (options) => generateTestEvent(CommonEventType.FEEDBACK_SUBMITTED, { feedbackId: generateUUID(), submittedAt: new Date().toISOString(), rating: 5 }, options),
};

/**
 * Generates a test event for the specified event type
 * @param eventType The type of event to generate
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent
 */
export function generateEventByType(
  eventType: EventType,
  options: TestEventOptions = {}
): GamificationEvent {
  const generator = eventGenerators[eventType];
  if (!generator) {
    throw new Error(`No generator found for event type: ${eventType}`);
  }
  return generator(options);
}

/**
 * Generates a batch of test events for the specified event types
 * @param eventTypes Array of event types to generate
 * @param options Custom options for the events
 * @returns Array of properly formatted GamificationEvents
 */
export function generateEventBatch(
  eventTypes: EventType[],
  options: TestEventOptions = {}
): GamificationEvent[] {
  return eventTypes.map((type) => generateEventByType(type, options));
}

/**
 * Generates a random event of any type
 * @param options Custom options for the event
 * @returns A properly formatted GamificationEvent of a random type
 */
export function generateRandomEvent(
  options: TestEventOptions = {}
): GamificationEvent {
  const allEventTypes = [
    ...Object.values(HealthEventType),
    ...Object.values(CareEventType),
    ...Object.values(PlanEventType),
    ...Object.values(CommonEventType),
  ];
  
  const randomType = allEventTypes[
    Math.floor(Math.random() * allEventTypes.length)
  ] as EventType;
  
  return generateEventByType(randomType, options);
}

/**
 * Generates a batch of random events
 * @param count Number of events to generate
 * @param options Custom options for the events
 * @returns Array of properly formatted GamificationEvents of random types
 */
export function generateRandomEventBatch(
  count: number,
  options: TestEventOptions = {}
): GamificationEvent[] {
  return Array.from({ length: count }, () => generateRandomEvent(options));
}

/**
 * Generates a batch of events for a specific journey
 * @param journey The journey to generate events for
 * @param count Number of events to generate
 * @param options Custom options for the events
 * @returns Array of properly formatted GamificationEvents for the specified journey
 */
export function generateJourneyEventBatch(
  journey: JourneyType,
  count: number,
  options: TestEventOptions = {}
): GamificationEvent[] {
  let eventTypes: EventType[] = [];
  
  switch (journey) {
    case 'health':
      eventTypes = Object.values(HealthEventType);
      break;
    case 'care':
      eventTypes = Object.values(CareEventType);
      break;
    case 'plan':
      eventTypes = Object.values(PlanEventType);
      break;
    default:
      throw new Error(`Invalid journey type: ${journey}`);
  }
  
  // Generate random events from the journey's event types
  return Array.from({ length: count }, () => {
    const randomType = eventTypes[
      Math.floor(Math.random() * eventTypes.length)
    ] as EventType;
    return generateEventByType(randomType, { ...options, journey });
  });
}

/**
 * Validates that an event matches the expected schema
 * @param event The event to validate
 * @param options Validation options
 * @returns True if the event is valid, throws an error otherwise
 */
export function validateEvent(event: GamificationEvent, options: { throwError?: boolean } = { throwError: true }): boolean {
  const errors: string[] = [];
  
  // Check required fields
  if (!event.type) {
    errors.push('Event is missing required field: type');
  }
  if (!event.userId) {
    errors.push('Event is missing required field: userId');
  }
  if (!event.payload) {
    errors.push('Event is missing required field: payload');
  }
  if (!event.timestamp) {
    errors.push('Event is missing required field: timestamp');
  }
  if (!event.version) {
    errors.push('Event is missing required field: version');
  }
  
  // Check that the event type is valid
  const allEventTypes = [
    ...Object.values(HealthEventType),
    ...Object.values(CareEventType),
    ...Object.values(PlanEventType),
    ...Object.values(CommonEventType),
  ];
  
  if (!allEventTypes.includes(event.type as any)) {
    errors.push(`Invalid event type: ${event.type}`);
  }
  
  // Check that the journey is valid if provided
  if (event.journey && !['health', 'care', 'plan'].includes(event.journey)) {
    errors.push(`Invalid journey: ${event.journey}`);
  }
  
  // Check that the version is valid
  try {
    parseVersion(event.version);
  } catch (error) {
    errors.push(`Invalid version format: ${event.version}`);
  }
  
  // Check that the timestamp is a valid ISO date
  if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
    errors.push(`Invalid timestamp format: ${event.timestamp}`);
  }
  
  // Check that the payload has data
  if (!event.payload?.data) {
    errors.push('Event payload is missing data property');
  }
  
  // If there are errors and throwError is true, throw the first error
  if (errors.length > 0 && options.throwError) {
    throw new Error(`Event validation failed: ${errors[0]}`);
  }
  
  return errors.length === 0;
}

/**
 * Validates a batch of events
 * @param events The events to validate
 * @param options Validation options
 * @returns An object with validation results
 */
export function validateEventBatch(events: GamificationEvent[], options: { throwError?: boolean } = { throwError: false }): { valid: boolean; invalidEvents: { event: GamificationEvent; errors: string[] }[] } {
  const invalidEvents: { event: GamificationEvent; errors: string[] }[] = [];
  
  for (const event of events) {
    const errors: string[] = [];
    
    // Check required fields
    if (!event.type) {
      errors.push('Event is missing required field: type');
    }
    if (!event.userId) {
      errors.push('Event is missing required field: userId');
    }
    if (!event.payload) {
      errors.push('Event is missing required field: payload');
    }
    if (!event.timestamp) {
      errors.push('Event is missing required field: timestamp');
    }
    if (!event.version) {
      errors.push('Event is missing required field: version');
    }
    
    // Check that the event type is valid
    const allEventTypes = [
      ...Object.values(HealthEventType),
      ...Object.values(CareEventType),
      ...Object.values(PlanEventType),
      ...Object.values(CommonEventType),
    ];
    
    if (!allEventTypes.includes(event.type as any)) {
      errors.push(`Invalid event type: ${event.type}`);
    }
    
    // Check that the journey is valid if provided
    if (event.journey && !['health', 'care', 'plan'].includes(event.journey)) {
      errors.push(`Invalid journey: ${event.journey}`);
    }
    
    // Check that the version is valid
    try {
      parseVersion(event.version);
    } catch (error) {
      errors.push(`Invalid version format: ${event.version}`);
    }
    
    // Check that the timestamp is a valid ISO date
    if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
      errors.push(`Invalid timestamp format: ${event.timestamp}`);
    }
    
    // Check that the payload has data
    if (!event.payload?.data) {
      errors.push('Event payload is missing data property');
    }
    
    if (errors.length > 0) {
      invalidEvents.push({ event, errors });
    }
  }
  
  // If there are invalid events and throwError is true, throw an error
  if (invalidEvents.length > 0 && options.throwError) {
    throw new Error(`Event batch validation failed: ${invalidEvents.length} invalid events`);
  }
  
  return { valid: invalidEvents.length === 0, invalidEvents };
}

/**
 * Interface for the test event producer
 */
export interface TestEventProducer {
  /**
   * Generates a test event for the specified event type
   */
  generateEvent: typeof generateEventByType;
  
  /**
   * Generates a batch of test events for the specified event types
   */
  generateBatch: typeof generateEventBatch;
  
  /**
   * Generates a random event of any type
   */
  generateRandom: typeof generateRandomEvent;
  
  /**
   * Generates a batch of random events
   */
  generateRandomBatch: typeof generateRandomEventBatch;
  
  /**
   * Generates a batch of events for a specific journey
   */
  generateJourneyBatch: typeof generateJourneyEventBatch;
  
  /**
   * Validates that an event matches the expected schema
   */
  validate: typeof validateEvent;
  
  /**
   * Validates a batch of events
   */
  validateBatch: typeof validateEventBatch;
  
  /**
   * Creates a sequence of events that simulate a user journey
   * @param userId The user ID for the events
   * @param journey The journey to simulate
   * @param options Additional options for the events
   */
  createUserJourneySequence(userId: string, journey: JourneyType, options?: Partial<TestEventOptions>): GamificationEvent[];
  
  /**
   * Health journey event generators
   */
  health: {
    generateMetricRecorded: typeof generateHealthMetricRecordedEvent;
    generateGoalAchieved: typeof generateGoalAchievedEvent;
    generateDeviceConnected: typeof generateDeviceConnectedEvent;
    generateGoalCreated: typeof generateGoalCreatedEvent;
    generateHealthInsightViewed: typeof generateHealthInsightViewedEvent;
  };
  
  /**
   * Care journey event generators
   */
  care: {
    generateAppointmentBooked: typeof generateAppointmentBookedEvent;
    generateAppointmentAttended: typeof generateAppointmentAttendedEvent;
    generateMedicationTaken: typeof generateMedicationTakenEvent;
    generateTelemedicineSessionCompleted: typeof generateTelemedicineSessionCompletedEvent;
    generateTreatmentPlanCreated: typeof generateTreatmentPlanCreatedEvent;
  };
  
  /**
   * Plan journey event generators
   */
  plan: {
    generateClaimSubmitted: typeof generateClaimSubmittedEvent;
    generateBenefitViewed: typeof generateBenefitViewedEvent;
    generatePlanSelected: typeof generatePlanSelectedEvent;
    generateClaimApproved: typeof generateClaimApprovedEvent;
  };
  
  /**
   * Common event generators
   */
  common: {
    generateAchievementUnlocked: typeof generateAchievementUnlockedEvent;
    generateQuestCompleted: typeof generateQuestCompletedEvent;
    generateRewardRedeemed: typeof generateRewardRedeemedEvent;
    generateUserLoggedIn: typeof generateUserLoggedInEvent;
  };
}

/**
 * Creates a test event producer that can be used to generate events for testing
 * @returns An object with methods for generating events
 */
export function createTestEventProducer(): TestEventProducer {
  /**
   * Creates a sequence of events that simulate a user journey
   * @param userId The user ID for the events
   * @param journey The journey to simulate
   * @param options Additional options for the events
   */
  function createUserJourneySequence(
    userId: string,
    journey: JourneyType,
    options: Partial<TestEventOptions> = {}
  ): GamificationEvent[] {
    const baseOptions: TestEventOptions = {
      userId,
      journey,
      ...options,
    };
    
    // Create a timestamp base that we'll increment for each event
    const now = Date.now();
    const events: GamificationEvent[] = [];
    
    switch (journey) {
      case 'health': {
        // Simulate a health journey: connect device -> record metrics -> create goal -> achieve goal
        const deviceConnectedEvent = generateDeviceConnectedEvent({
          ...baseOptions,
          timestamp: new Date(now - 3600000).toISOString(), // 1 hour ago
        });
        
        const metricRecordedEvent = generateHealthMetricRecordedEvent({
          ...baseOptions,
          timestamp: new Date(now - 1800000).toISOString(), // 30 minutes ago
        });
        
        const goalCreatedEvent = generateGoalCreatedEvent({
          ...baseOptions,
          timestamp: new Date(now - 900000).toISOString(), // 15 minutes ago
        });
        
        const goalAchievedEvent = generateGoalAchievedEvent({
          ...baseOptions,
          timestamp: new Date(now).toISOString(), // now
          payloadData: {
            goalId: (goalCreatedEvent.payload.data as any).goalId,
          },
        });
        
        events.push(
          deviceConnectedEvent,
          metricRecordedEvent,
          goalCreatedEvent,
          goalAchievedEvent
        );
        break;
      }
      
      case 'care': {
        // Simulate a care journey: book appointment -> attend appointment -> create treatment plan -> take medication
        const appointmentBookedEvent = generateAppointmentBookedEvent({
          ...baseOptions,
          timestamp: new Date(now - 86400000).toISOString(), // 1 day ago
        });
        
        const appointmentAttendedEvent = generateAppointmentAttendedEvent({
          ...baseOptions,
          timestamp: new Date(now - 3600000).toISOString(), // 1 hour ago
          payloadData: {
            appointmentId: (appointmentBookedEvent.payload.data as any).appointmentId,
          },
        });
        
        const treatmentPlanCreatedEvent = generateTreatmentPlanCreatedEvent({
          ...baseOptions,
          timestamp: new Date(now - 1800000).toISOString(), // 30 minutes ago
        });
        
        const medicationTakenEvent = generateMedicationTakenEvent({
          ...baseOptions,
          timestamp: new Date(now).toISOString(), // now
          payloadData: {
            medicationId: (treatmentPlanCreatedEvent.payload.data as any).medications[0].medicationId,
          },
        });
        
        events.push(
          appointmentBookedEvent,
          appointmentAttendedEvent,
          treatmentPlanCreatedEvent,
          medicationTakenEvent
        );
        break;
      }
      
      case 'plan': {
        // Simulate a plan journey: select plan -> view benefit -> submit claim -> get claim approved
        const planSelectedEvent = generatePlanSelectedEvent({
          ...baseOptions,
          timestamp: new Date(now - 604800000).toISOString(), // 1 week ago
        });
        
        const benefitViewedEvent = generateBenefitViewedEvent({
          ...baseOptions,
          timestamp: new Date(now - 86400000).toISOString(), // 1 day ago
        });
        
        const claimSubmittedEvent = generateClaimSubmittedEvent({
          ...baseOptions,
          timestamp: new Date(now - 43200000).toISOString(), // 12 hours ago
        });
        
        const claimApprovedEvent = generateClaimApprovedEvent({
          ...baseOptions,
          timestamp: new Date(now).toISOString(), // now
          payloadData: {
            claimId: (claimSubmittedEvent.payload.data as any).claimId,
          },
        });
        
        events.push(
          planSelectedEvent,
          benefitViewedEvent,
          claimSubmittedEvent,
          claimApprovedEvent
        );
        break;
      }
      
      default:
        throw new Error(`Invalid journey type: ${journey}`);
    }
    
    return events;
  }
  
  return {
    generateEvent: generateEventByType,
    generateBatch: generateEventBatch,
    generateRandom: generateRandomEvent,
    generateRandomBatch: generateRandomEventBatch,
    generateJourneyBatch: generateJourneyEventBatch,
    validate: validateEvent,
    validateBatch: validateEventBatch,
    createUserJourneySequence,
    
    // Journey-specific event generators
    health: {
      generateMetricRecorded: generateHealthMetricRecordedEvent,
      generateGoalAchieved: generateGoalAchievedEvent,
      generateDeviceConnected: generateDeviceConnectedEvent,
      generateGoalCreated: generateGoalCreatedEvent,
      generateHealthInsightViewed: generateHealthInsightViewedEvent,
    },
    care: {
      generateAppointmentBooked: generateAppointmentBookedEvent,
      generateAppointmentAttended: generateAppointmentAttendedEvent,
      generateMedicationTaken: generateMedicationTakenEvent,
      generateTelemedicineSessionCompleted: generateTelemedicineSessionCompletedEvent,
      generateTreatmentPlanCreated: generateTreatmentPlanCreatedEvent,
    },
    plan: {
      generateClaimSubmitted: generateClaimSubmittedEvent,
      generateBenefitViewed: generateBenefitViewedEvent,
      generatePlanSelected: generatePlanSelectedEvent,
      generateClaimApproved: generateClaimApprovedEvent,
    },
    common: {
      generateAchievementUnlocked: generateAchievementUnlockedEvent,
      generateQuestCompleted: generateQuestCompletedEvent,
      generateRewardRedeemed: generateRewardRedeemedEvent,
      generateUserLoggedIn: generateUserLoggedInEvent,
    },
  };
}

// Export a default instance of the test event producer
export default createTestEventProducer();