/**
 * @file kafka-events.ts
 * @description Test fixtures for Kafka-specific event testing, including message envelope structures,
 * headers, offsets, and topics. This file contains test data for verifying Kafka integration,
 * message serialization/deserialization, and event routing.
 */

import { KafkaEvent, KafkaHeaders } from '../../src/interfaces/kafka-event.interface';
import { BaseEvent, EventMetadata } from '../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import {
  JOURNEY_EVENT_TOPICS,
  HEALTH_EVENT_TOPICS,
  CARE_EVENT_TOPICS,
  PLAN_EVENT_TOPICS,
  GAMIFICATION_TOPICS,
  NOTIFICATION_TOPICS,
  DLQ_TOPICS,
  CONSUMER_GROUPS,
  KAFKA_HEADERS
} from '../../src/kafka/kafka.constants';
import {
  HealthEventType,
  CareEventType,
  PlanEventType,
  IHealthMetricRecordedPayload,
  ICareAppointmentBookedPayload,
  IPlanClaimSubmittedPayload
} from '../../src/interfaces/journey-events.interface';

// ===== HELPER FUNCTIONS =====

/**
 * Creates a Kafka message header object with standard fields
 * @param options Optional header values to override defaults
 * @returns KafkaHeaders object
 */
export function createKafkaHeaders(options?: Partial<Record<keyof typeof KAFKA_HEADERS, string>>): KafkaHeaders {
  const headers: KafkaHeaders = {
    [KAFKA_HEADERS.CORRELATION_ID]: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    [KAFKA_HEADERS.SOURCE_SERVICE]: 'test-service',
    [KAFKA_HEADERS.EVENT_TYPE]: 'TEST_EVENT',
    [KAFKA_HEADERS.EVENT_VERSION]: '1.0.0',
    [KAFKA_HEADERS.TIMESTAMP]: new Date().toISOString(),
    [KAFKA_HEADERS.USER_ID]: 'test-user-123',
    [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
  };

  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      headers[key] = value;
    });
  }

  return headers;
}

/**
 * Creates a Kafka event with the specified payload and options
 * @param payload Event payload
 * @param options Optional event properties to override defaults
 * @returns KafkaEvent object
 */
export function createKafkaEvent<T = any>(payload: T, options?: {
  eventId?: string;
  type?: string;
  source?: string;
  topic?: string;
  partition?: number;
  offset?: string;
  key?: string;
  headers?: KafkaHeaders;
  journey?: JourneyType;
  userId?: string;
  metadata?: EventMetadata;
  version?: string;
}): KafkaEvent<T> {
  return {
    eventId: options?.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: options?.type || 'TEST_EVENT',
    timestamp: new Date().toISOString(),
    version: options?.version || '1.0.0',
    source: options?.source || 'test-service',
    journey: options?.journey || JourneyType.HEALTH,
    userId: options?.userId || 'test-user-123',
    payload,
    metadata: options?.metadata || {
      correlationId: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    },
    topic: options?.topic || JOURNEY_EVENT_TOPICS.HEALTH,
    partition: options?.partition || 0,
    offset: options?.offset || '0',
    key: options?.key || 'test-key',
    headers: options?.headers || createKafkaHeaders(),
  };
}

/**
 * Creates a serialized Kafka message for testing deserialization
 * @param event The event to serialize
 * @returns Serialized JSON string
 */
export function serializeKafkaEvent<T>(event: KafkaEvent<T>): string {
  return JSON.stringify(event);
}

// ===== BASE KAFKA MESSAGE FIXTURES =====

/**
 * Basic Kafka message fixture with minimal properties
 */
export const basicKafkaMessage: KafkaEvent = {
  eventId: 'evt-basic-123456789',
  type: 'TEST_EVENT',
  timestamp: '2023-05-15T10:30:00.000Z',
  version: '1.0.0',
  source: 'test-service',
  payload: { message: 'Test message' },
  topic: JOURNEY_EVENT_TOPICS.HEALTH,
  partition: 0,
  offset: '0',
  key: 'test-key',
  headers: createKafkaHeaders(),
};

/**
 * Complete Kafka message fixture with all properties
 */
export const completeKafkaMessage: KafkaEvent = {
  eventId: 'evt-complete-123456789',
  type: 'TEST_EVENT',
  timestamp: '2023-05-15T10:30:00.000Z',
  version: '1.0.0',
  source: 'test-service',
  journey: JourneyType.HEALTH,
  userId: 'test-user-123',
  payload: { message: 'Test message with complete properties' },
  metadata: {
    correlationId: 'corr-123456789',
    traceId: 'trace-123456789',
    spanId: 'span-123456789',
    priority: 'high',
    isRetry: false,
    retryCount: 0,
    originalTimestamp: '2023-05-15T10:30:00.000Z',
    customProperty: 'custom-value',
  },
  topic: JOURNEY_EVENT_TOPICS.HEALTH,
  partition: 0,
  offset: '0',
  key: 'test-key',
  headers: createKafkaHeaders({
    [KAFKA_HEADERS.CORRELATION_ID]: 'corr-123456789',
    [KAFKA_HEADERS.SOURCE_SERVICE]: 'test-service',
    [KAFKA_HEADERS.EVENT_TYPE]: 'TEST_EVENT',
    [KAFKA_HEADERS.EVENT_VERSION]: '1.0.0',
    [KAFKA_HEADERS.TIMESTAMP]: '2023-05-15T10:30:00.000Z',
    [KAFKA_HEADERS.USER_ID]: 'test-user-123',
    [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
  }),
};

/**
 * Kafka message with invalid properties for testing validation
 */
export const invalidKafkaMessage: Partial<KafkaEvent> = {
  // Missing required eventId
  type: 'TEST_EVENT',
  timestamp: '2023-05-15T10:30:00.000Z',
  version: '1.0.0',
  source: 'test-service',
  payload: { message: 'Test message with invalid properties' },
  topic: JOURNEY_EVENT_TOPICS.HEALTH,
  // Invalid partition type
  partition: 'invalid' as unknown as number,
  offset: '0',
  key: 'test-key',
  headers: createKafkaHeaders(),
};

// ===== JOURNEY-SPECIFIC KAFKA EVENT FIXTURES =====

// Health Journey Events

/**
 * Health metric recorded event fixture
 */
export const healthMetricRecordedEvent: KafkaEvent<IHealthMetricRecordedPayload> = createKafkaEvent<IHealthMetricRecordedPayload>(
  {
    metric: {
      id: 'metric-123',
      userId: 'test-user-123',
      type: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-05-15T10:30:00.000Z',
      source: 'smartwatch',
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: '2023-05-15T10:30:00.000Z',
    source: 'smartwatch',
    previousValue: 72,
    change: 3,
    isImprovement: false,
  },
  {
    type: HealthEventType.METRIC_RECORDED,
    topic: HEALTH_EVENT_TOPICS.METRICS,
    journey: JourneyType.HEALTH,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.METRIC_RECORDED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
    }),
  }
);

/**
 * Health goal achieved event fixture
 */
export const healthGoalAchievedEvent: KafkaEvent = createKafkaEvent(
  {
    goal: {
      id: 'goal-123',
      userId: 'test-user-123',
      type: 'STEPS',
      targetValue: 10000,
      currentValue: 10250,
      unit: 'steps',
      startDate: '2023-05-10T00:00:00.000Z',
      endDate: '2023-05-15T23:59:59.999Z',
      status: 'ACHIEVED',
    },
    goalType: 'STEPS',
    achievedValue: 10250,
    targetValue: 10000,
    daysToAchieve: 5,
    isEarlyCompletion: true,
  },
  {
    type: HealthEventType.GOAL_ACHIEVED,
    topic: HEALTH_EVENT_TOPICS.GOALS,
    journey: JourneyType.HEALTH,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.GOAL_ACHIEVED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
    }),
  }
);

/**
 * Health device synced event fixture
 */
export const healthDeviceSyncedEvent: KafkaEvent = createKafkaEvent(
  {
    deviceConnection: {
      id: 'device-conn-123',
      userId: 'test-user-123',
      deviceId: 'device-123',
      deviceType: 'Smartwatch',
      connectionDate: '2023-05-01T10:30:00.000Z',
      lastSyncDate: '2023-05-15T10:30:00.000Z',
      status: 'CONNECTED',
    },
    deviceId: 'device-123',
    deviceType: 'Smartwatch',
    syncDate: '2023-05-15T10:30:00.000Z',
    metricsCount: 5,
    metricTypes: ['HEART_RATE', 'STEPS', 'SLEEP', 'CALORIES', 'DISTANCE'],
    syncSuccessful: true,
  },
  {
    type: HealthEventType.DEVICE_SYNCED,
    topic: HEALTH_EVENT_TOPICS.DEVICES,
    journey: JourneyType.HEALTH,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.DEVICE_SYNCED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
    }),
  }
);

// Care Journey Events

/**
 * Care appointment booked event fixture
 */
export const careAppointmentBookedEvent: KafkaEvent<ICareAppointmentBookedPayload> = createKafkaEvent<ICareAppointmentBookedPayload>(
  {
    appointment: {
      id: 'appointment-123',
      userId: 'test-user-123',
      providerId: 'provider-123',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      scheduledDate: '2023-05-20T14:00:00.000Z',
      createdAt: '2023-05-15T10:30:00.000Z',
    },
    appointmentType: 'CONSULTATION',
    providerId: 'provider-123',
    scheduledDate: '2023-05-20T14:00:00.000Z',
    isFirstAppointment: false,
    isUrgent: false,
  },
  {
    type: CareEventType.APPOINTMENT_BOOKED,
    topic: CARE_EVENT_TOPICS.APPOINTMENTS,
    journey: JourneyType.CARE,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: CareEventType.APPOINTMENT_BOOKED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.CARE,
    }),
  }
);

/**
 * Care medication adherence streak event fixture
 */
export const careMedicationAdherenceStreakEvent: KafkaEvent = createKafkaEvent(
  {
    medicationId: 'medication-123',
    medicationName: 'Medication A',
    streakDays: 7,
    adherencePercentage: 100,
    startDate: '2023-05-08T00:00:00.000Z',
    endDate: '2023-05-14T23:59:59.999Z',
  },
  {
    type: CareEventType.MEDICATION_ADHERENCE_STREAK,
    topic: CARE_EVENT_TOPICS.MEDICATIONS,
    journey: JourneyType.CARE,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: CareEventType.MEDICATION_ADHERENCE_STREAK,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.CARE,
    }),
  }
);

/**
 * Care telemedicine session completed event fixture
 */
export const careTelemedicineSessionCompletedEvent: KafkaEvent = createKafkaEvent(
  {
    session: {
      id: 'session-123',
      userId: 'test-user-123',
      providerId: 'provider-123',
      appointmentId: 'appointment-123',
      startTime: '2023-05-15T14:00:00.000Z',
      endTime: '2023-05-15T14:30:00.000Z',
      status: 'COMPLETED',
    },
    sessionId: 'session-123',
    providerId: 'provider-123',
    startTime: '2023-05-15T14:00:00.000Z',
    endTime: '2023-05-15T14:30:00.000Z',
    duration: 30,
    appointmentId: 'appointment-123',
    technicalIssues: false,
  },
  {
    type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    topic: CARE_EVENT_TOPICS.TELEMEDICINE,
    journey: JourneyType.CARE,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.CARE,
    }),
  }
);

// Plan Journey Events

/**
 * Plan claim submitted event fixture
 */
export const planClaimSubmittedEvent: KafkaEvent<IPlanClaimSubmittedPayload> = createKafkaEvent<IPlanClaimSubmittedPayload>(
  {
    claim: {
      id: 'claim-123',
      userId: 'test-user-123',
      type: 'MEDICAL_CONSULTATION',
      status: 'SUBMITTED',
      amount: 150.0,
      submissionDate: '2023-05-15T10:30:00.000Z',
    },
    submissionDate: '2023-05-15T10:30:00.000Z',
    amount: 150.0,
    claimType: 'MEDICAL_CONSULTATION',
    hasDocuments: true,
    isComplete: true,
  },
  {
    type: PlanEventType.CLAIM_SUBMITTED,
    topic: PLAN_EVENT_TOPICS.CLAIMS,
    journey: JourneyType.PLAN,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: PlanEventType.CLAIM_SUBMITTED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.PLAN,
    }),
  }
);

/**
 * Plan benefit utilized event fixture
 */
export const planBenefitUtilizedEvent: KafkaEvent = createKafkaEvent(
  {
    benefit: {
      id: 'benefit-123',
      userId: 'test-user-123',
      type: 'MEDICAL_CONSULTATION',
      coverageLimit: 1000.0,
      usedAmount: 150.0,
      remainingAmount: 850.0,
    },
    utilizationDate: '2023-05-15T10:30:00.000Z',
    serviceProvider: 'Provider A',
    amount: 150.0,
    remainingCoverage: 850.0,
    isFirstUtilization: false,
  },
  {
    type: PlanEventType.BENEFIT_UTILIZED,
    topic: PLAN_EVENT_TOPICS.BENEFITS,
    journey: JourneyType.PLAN,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: PlanEventType.BENEFIT_UTILIZED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.PLAN,
    }),
  }
);

/**
 * Plan reward redeemed event fixture
 */
export const planRewardRedeemedEvent: KafkaEvent = createKafkaEvent(
  {
    rewardId: 'reward-123',
    rewardName: 'Discount Voucher',
    redemptionDate: '2023-05-15T10:30:00.000Z',
    pointValue: 500,
    monetaryValue: 50.0,
    rewardType: 'VOUCHER',
    isPremiumReward: false,
  },
  {
    type: PlanEventType.REWARD_REDEEMED,
    topic: PLAN_EVENT_TOPICS.REWARDS,
    journey: JourneyType.PLAN,
    headers: createKafkaHeaders({
      [KAFKA_HEADERS.EVENT_TYPE]: PlanEventType.REWARD_REDEEMED,
      [KAFKA_HEADERS.JOURNEY]: JourneyType.PLAN,
    }),
  }
);

// ===== CONSUMER GROUP AND OFFSET FIXTURES =====

/**
 * Consumer group offset information fixtures
 */
export const consumerGroupOffsets = {
  /**
   * Health service consumer group offsets
   */
  healthService: {
    groupId: CONSUMER_GROUPS.HEALTH_SERVICE,
    topics: [
      {
        topic: JOURNEY_EVENT_TOPICS.HEALTH,
        partitions: [
          { partition: 0, offset: '100', lag: 0 },
          { partition: 1, offset: '95', lag: 5 },
          { partition: 2, offset: '110', lag: 0 },
        ],
      },
      {
        topic: HEALTH_EVENT_TOPICS.METRICS,
        partitions: [
          { partition: 0, offset: '500', lag: 0 },
          { partition: 1, offset: '480', lag: 20 },
          { partition: 2, offset: '510', lag: 0 },
        ],
      },
    ],
  },

  /**
   * Care service consumer group offsets
   */
  careService: {
    groupId: CONSUMER_GROUPS.CARE_SERVICE,
    topics: [
      {
        topic: JOURNEY_EVENT_TOPICS.CARE,
        partitions: [
          { partition: 0, offset: '200', lag: 0 },
          { partition: 1, offset: '195', lag: 5 },
          { partition: 2, offset: '210', lag: 0 },
        ],
      },
      {
        topic: CARE_EVENT_TOPICS.APPOINTMENTS,
        partitions: [
          { partition: 0, offset: '150', lag: 0 },
          { partition: 1, offset: '145', lag: 5 },
          { partition: 2, offset: '155', lag: 0 },
        ],
      },
    ],
  },

  /**
   * Plan service consumer group offsets
   */
  planService: {
    groupId: CONSUMER_GROUPS.PLAN_SERVICE,
    topics: [
      {
        topic: JOURNEY_EVENT_TOPICS.PLAN,
        partitions: [
          { partition: 0, offset: '300', lag: 0 },
          { partition: 1, offset: '295', lag: 5 },
          { partition: 2, offset: '310', lag: 0 },
        ],
      },
      {
        topic: PLAN_EVENT_TOPICS.CLAIMS,
        partitions: [
          { partition: 0, offset: '120', lag: 0 },
          { partition: 1, offset: '115', lag: 5 },
          { partition: 2, offset: '125', lag: 0 },
        ],
      },
    ],
  },

  /**
   * Gamification engine consumer group offsets
   */
  gamificationEngine: {
    groupId: CONSUMER_GROUPS.GAMIFICATION_ENGINE,
    topics: [
      {
        topic: JOURNEY_EVENT_TOPICS.HEALTH,
        partitions: [
          { partition: 0, offset: '100', lag: 0 },
          { partition: 1, offset: '90', lag: 10 },
          { partition: 2, offset: '110', lag: 0 },
        ],
      },
      {
        topic: JOURNEY_EVENT_TOPICS.CARE,
        partitions: [
          { partition: 0, offset: '200', lag: 0 },
          { partition: 1, offset: '190', lag: 10 },
          { partition: 2, offset: '210', lag: 0 },
        ],
      },
      {
        topic: JOURNEY_EVENT_TOPICS.PLAN,
        partitions: [
          { partition: 0, offset: '300', lag: 0 },
          { partition: 1, offset: '290', lag: 10 },
          { partition: 2, offset: '310', lag: 0 },
        ],
      },
    ],
  },

  /**
   * Notification service consumer group offsets
   */
  notificationService: {
    groupId: CONSUMER_GROUPS.NOTIFICATION_SERVICE,
    topics: [
      {
        topic: NOTIFICATION_TOPICS.REQUEST,
        partitions: [
          { partition: 0, offset: '400', lag: 0 },
          { partition: 1, offset: '395', lag: 5 },
          { partition: 2, offset: '410', lag: 0 },
        ],
      },
    ],
  },

  /**
   * Dead letter queue processor consumer group offsets
   */
  dlqProcessor: {
    groupId: CONSUMER_GROUPS.DLQ_PROCESSOR,
    topics: [
      {
        topic: DLQ_TOPICS.HEALTH_EVENTS,
        partitions: [
          { partition: 0, offset: '10', lag: 0 },
          { partition: 1, offset: '5', lag: 0 },
          { partition: 2, offset: '15', lag: 0 },
        ],
      },
      {
        topic: DLQ_TOPICS.CARE_EVENTS,
        partitions: [
          { partition: 0, offset: '8', lag: 0 },
          { partition: 1, offset: '3', lag: 0 },
          { partition: 2, offset: '12', lag: 0 },
        ],
      },
      {
        topic: DLQ_TOPICS.PLAN_EVENTS,
        partitions: [
          { partition: 0, offset: '5', lag: 0 },
          { partition: 1, offset: '2', lag: 0 },
          { partition: 2, offset: '7', lag: 0 },
        ],
      },
    ],
  },
};

// ===== SERIALIZED MESSAGE EXAMPLES =====

/**
 * Serialized Kafka message examples for testing deserialization
 */
export const serializedMessages = {
  /**
   * Serialized health metric recorded event
   */
  healthMetricRecorded: serializeKafkaEvent(healthMetricRecordedEvent),

  /**
   * Serialized care appointment booked event
   */
  careAppointmentBooked: serializeKafkaEvent(careAppointmentBookedEvent),

  /**
   * Serialized plan claim submitted event
   */
  planClaimSubmitted: serializeKafkaEvent(planClaimSubmittedEvent),

  /**
   * Serialized invalid message (missing required fields)
   */
  invalidMessage: JSON.stringify(invalidKafkaMessage),

  /**
   * Malformed JSON string (not valid JSON)
   */
  malformedJson: '{"eventId":"evt-malformed-123","type":"TEST_EVENT","timestamp":"2023-05-15T10:30:00.000Z","version":"1.0.0","source":"test-service","payload":{"message":"Malformed JSON message"},"topic":"austa.health.events","partition":0,"offset":"0","key":"test-key"',
};

// ===== DEAD LETTER QUEUE AND RETRY EXAMPLES =====

/**
 * Dead letter queue message examples
 */
export const dlqMessages = {
  /**
   * Health event in DLQ due to processing error
   */
  healthEventProcessingError: createKafkaEvent(
    {
      metric: {
        id: 'metric-123',
        userId: 'test-user-123',
        type: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: '2023-05-15T10:30:00.000Z',
        source: 'smartwatch',
      },
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-05-15T10:30:00.000Z',
    },
    {
      type: HealthEventType.METRIC_RECORDED,
      topic: DLQ_TOPICS.HEALTH_EVENTS,
      journey: JourneyType.HEALTH,
      metadata: {
        correlationId: 'corr-123456789',
        isRetry: true,
        retryCount: 3,
        originalTimestamp: '2023-05-15T10:25:00.000Z',
      },
      headers: createKafkaHeaders({
        [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.METRIC_RECORDED,
        [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
        [KAFKA_HEADERS.RETRY_COUNT]: '3',
        [KAFKA_HEADERS.ORIGINAL_TOPIC]: HEALTH_EVENT_TOPICS.METRICS,
        [KAFKA_HEADERS.ERROR_MESSAGE]: 'Database connection error',
        [KAFKA_HEADERS.ERROR_CODE]: 'DB_CONNECTION_ERROR',
      }),
    }
  ),

  /**
   * Care event in DLQ due to validation error
   */
  careEventValidationError: createKafkaEvent(
    {
      appointment: {
        id: 'appointment-123',
        userId: 'test-user-123',
        providerId: 'provider-123',
        type: 'CONSULTATION',
        status: 'SCHEDULED',
        // Missing required scheduledDate
        createdAt: '2023-05-15T10:30:00.000Z',
      },
      appointmentType: 'CONSULTATION',
      providerId: 'provider-123',
      // Missing required scheduledDate
    },
    {
      type: CareEventType.APPOINTMENT_BOOKED,
      topic: DLQ_TOPICS.CARE_EVENTS,
      journey: JourneyType.CARE,
      metadata: {
        correlationId: 'corr-123456789',
        isRetry: true,
        retryCount: 1,
        originalTimestamp: '2023-05-15T10:28:00.000Z',
      },
      headers: createKafkaHeaders({
        [KAFKA_HEADERS.EVENT_TYPE]: CareEventType.APPOINTMENT_BOOKED,
        [KAFKA_HEADERS.JOURNEY]: JourneyType.CARE,
        [KAFKA_HEADERS.RETRY_COUNT]: '1',
        [KAFKA_HEADERS.ORIGINAL_TOPIC]: CARE_EVENT_TOPICS.APPOINTMENTS,
        [KAFKA_HEADERS.ERROR_MESSAGE]: 'Missing required field: scheduledDate',
        [KAFKA_HEADERS.ERROR_CODE]: 'VALIDATION_ERROR',
      }),
    }
  ),

  /**
   * Plan event in DLQ due to deserialization error
   */
  planEventDeserializationError: createKafkaEvent(
    {
      // Original payload was corrupted or malformed
      _originalPayload: '{"claim":{"id":"claim-123","userId":"test-user-123","type":"MEDICAL_CONSULTATION","status":"SUBMITTED","amount":150.0,"submissionDate":"2023-05-15T10:30:00.000Z"},"submissionDate":"2023-05-15T10:30:00.000Z","amount":150.0,"claimType":"MEDICAL_CONSULTATION","hasDocuments":true,"isComplete":true',
      errorDetails: 'Unexpected end of JSON input',
    },
    {
      type: PlanEventType.CLAIM_SUBMITTED,
      topic: DLQ_TOPICS.PLAN_EVENTS,
      journey: JourneyType.PLAN,
      metadata: {
        correlationId: 'corr-123456789',
        isRetry: false,
        retryCount: 0,
        originalTimestamp: '2023-05-15T10:29:00.000Z',
      },
      headers: createKafkaHeaders({
        [KAFKA_HEADERS.EVENT_TYPE]: PlanEventType.CLAIM_SUBMITTED,
        [KAFKA_HEADERS.JOURNEY]: JourneyType.PLAN,
        [KAFKA_HEADERS.RETRY_COUNT]: '0',
        [KAFKA_HEADERS.ORIGINAL_TOPIC]: PLAN_EVENT_TOPICS.CLAIMS,
        [KAFKA_HEADERS.ERROR_MESSAGE]: 'Unexpected end of JSON input',
        [KAFKA_HEADERS.ERROR_CODE]: 'DESERIALIZATION_ERROR',
      }),
    }
  ),
};

/**
 * Retry message examples with exponential backoff
 */
export const retryMessages = {
  /**
   * First retry attempt (initial delay)
   */
  firstRetry: createKafkaEvent(
    {
      metric: {
        id: 'metric-123',
        userId: 'test-user-123',
        type: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: '2023-05-15T10:30:00.000Z',
        source: 'smartwatch',
      },
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-05-15T10:30:00.000Z',
    },
    {
      type: HealthEventType.METRIC_RECORDED,
      topic: HEALTH_EVENT_TOPICS.METRICS,
      journey: JourneyType.HEALTH,
      metadata: {
        correlationId: 'corr-123456789',
        isRetry: true,
        retryCount: 1,
        originalTimestamp: '2023-05-15T10:29:00.000Z',
      },
      headers: createKafkaHeaders({
        [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.METRIC_RECORDED,
        [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
        [KAFKA_HEADERS.RETRY_COUNT]: '1',
      }),
    }
  ),

  /**
   * Second retry attempt (exponential backoff)
   */
  secondRetry: createKafkaEvent(
    {
      metric: {
        id: 'metric-123',
        userId: 'test-user-123',
        type: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: '2023-05-15T10:30:00.000Z',
        source: 'smartwatch',
      },
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-05-15T10:30:00.000Z',
    },
    {
      type: HealthEventType.METRIC_RECORDED,
      topic: HEALTH_EVENT_TOPICS.METRICS,
      journey: JourneyType.HEALTH,
      metadata: {
        correlationId: 'corr-123456789',
        isRetry: true,
        retryCount: 2,
        originalTimestamp: '2023-05-15T10:28:00.000Z',
      },
      headers: createKafkaHeaders({
        [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.METRIC_RECORDED,
        [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
        [KAFKA_HEADERS.RETRY_COUNT]: '2',
      }),
    }
  ),

  /**
   * Third retry attempt (max retries before DLQ)
   */
  thirdRetry: createKafkaEvent(
    {
      metric: {
        id: 'metric-123',
        userId: 'test-user-123',
        type: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: '2023-05-15T10:30:00.000Z',
        source: 'smartwatch',
      },
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-05-15T10:30:00.000Z',
    },
    {
      type: HealthEventType.METRIC_RECORDED,
      topic: HEALTH_EVENT_TOPICS.METRICS,
      journey: JourneyType.HEALTH,
      metadata: {
        correlationId: 'corr-123456789',
        isRetry: true,
        retryCount: 3,
        originalTimestamp: '2023-05-15T10:27:00.000Z',
      },
      headers: createKafkaHeaders({
        [KAFKA_HEADERS.EVENT_TYPE]: HealthEventType.METRIC_RECORDED,
        [KAFKA_HEADERS.JOURNEY]: JourneyType.HEALTH,
        [KAFKA_HEADERS.RETRY_COUNT]: '3',
      }),
    }
  ),
};

/**
 * Retry configuration examples for different scenarios
 */
export const retryConfigurations = {
  /**
   * Default retry configuration with exponential backoff
   */
  defaultRetry: {
    maxRetries: 3,
    initialRetryTime: 1000, // 1 second
    backoffFactor: 2, // Exponential backoff factor
    // Retry delays: 1s, 2s, 4s
  },

  /**
   * Aggressive retry configuration for critical events
   */
  criticalEventRetry: {
    maxRetries: 5,
    initialRetryTime: 500, // 0.5 seconds
    backoffFactor: 1.5, // Slower exponential growth
    // Retry delays: 0.5s, 0.75s, 1.125s, 1.69s, 2.53s
  },

  /**
   * Conservative retry configuration for non-critical events
   */
  nonCriticalEventRetry: {
    maxRetries: 2,
    initialRetryTime: 2000, // 2 seconds
    backoffFactor: 3, // Faster exponential growth
    // Retry delays: 2s, 6s
  },

  /**
   * Long-term retry configuration for persistent issues
   */
  persistentIssueRetry: {
    maxRetries: 10,
    initialRetryTime: 5000, // 5 seconds
    backoffFactor: 1.2, // Slow exponential growth
    // Retry delays gradually increasing from 5s to ~31s
  },
};