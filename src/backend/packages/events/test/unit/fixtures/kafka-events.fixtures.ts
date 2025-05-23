/**
 * @file kafka-events.fixtures.ts
 * @description Provides specialized fixtures for testing Kafka integration in the events package.
 * Includes mock Kafka messages, consumer records, and producer payloads that simulate the
 * Kafka message structure for different event types.
 */

import { KafkaMessage, KafkaHeaders, KafkaProducerRecord, KafkaEventMessage, KafkaDeadLetterQueueMessage } from '../../../src/kafka/kafka.types';
import { IKafkaMessage, IKafkaHeaders, IKafkaProducerRecord } from '../../../src/kafka/kafka.interfaces';
import { BaseEvent, EventMetadata } from '../../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { KAFKA_HEADERS, JOURNEY_EVENT_TOPICS, HEALTH_EVENT_TOPICS, CARE_EVENT_TOPICS, PLAN_EVENT_TOPICS, GAMIFICATION_TOPICS, DLQ_TOPICS } from '../../../src/kafka/kafka.constants';

// ===================================================
// Helper Functions
// ===================================================

/**
 * Creates a mock event ID for testing
 * @returns A mock event ID
 */
export function createMockEventId(): string {
  return `event-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Creates a mock correlation ID for testing
 * @returns A mock correlation ID
 */
export function createMockCorrelationId(): string {
  return `corr-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Creates a mock user ID for testing
 * @returns A mock user ID
 */
export function createMockUserId(): string {
  return `user-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Creates a mock timestamp for testing
 * @returns A mock ISO timestamp
 */
export function createMockTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Creates standard event metadata for testing
 * @param overrides Optional overrides for specific metadata fields
 * @returns Event metadata object
 */
export function createMockEventMetadata(overrides: Partial<EventMetadata> = {}): EventMetadata {
  return {
    correlationId: createMockCorrelationId(),
    traceId: `trace-${Math.random().toString(36).substring(2, 15)}`,
    spanId: `span-${Math.random().toString(36).substring(2, 15)}`,
    priority: 'medium',
    ...overrides
  };
}

/**
 * Creates standard Kafka headers for testing
 * @param event The event to create headers for
 * @returns Kafka headers object
 */
export function createMockKafkaHeaders(event: BaseEvent): KafkaHeaders {
  return {
    [KAFKA_HEADERS.CORRELATION_ID]: Buffer.from(event.metadata?.correlationId || createMockCorrelationId()),
    [KAFKA_HEADERS.SOURCE_SERVICE]: Buffer.from(event.source),
    [KAFKA_HEADERS.EVENT_TYPE]: Buffer.from(event.type),
    [KAFKA_HEADERS.EVENT_VERSION]: Buffer.from(event.version),
    [KAFKA_HEADERS.USER_ID]: event.userId ? Buffer.from(event.userId) : undefined,
    [KAFKA_HEADERS.JOURNEY]: event.journey ? Buffer.from(event.journey) : undefined,
    [KAFKA_HEADERS.TIMESTAMP]: Buffer.from(event.timestamp)
  };
}

// ===================================================
// Base Event Fixtures
// ===================================================

/**
 * Creates a base event fixture for testing
 * @param type Event type
 * @param source Source service
 * @param payload Event payload
 * @param options Additional options
 * @returns A base event fixture
 */
export function createMockBaseEvent<T = any>(
  type: string,
  source: string,
  payload: T,
  options: {
    userId?: string;
    journey?: JourneyType;
    metadata?: EventMetadata;
    eventId?: string;
    timestamp?: string;
    version?: string;
  } = {}
): BaseEvent<T> {
  return {
    eventId: options.eventId || createMockEventId(),
    type,
    timestamp: options.timestamp || createMockTimestamp(),
    version: options.version || '1.0.0',
    source,
    journey: options.journey,
    userId: options.userId || createMockUserId(),
    payload,
    metadata: options.metadata || createMockEventMetadata()
  };
}

/**
 * Creates a malformed base event for testing error scenarios
 * @param missingFields Fields to omit from the event
 * @returns A malformed base event
 */
export function createMalformedBaseEvent(missingFields: string[] = []): any {
  const baseEvent = createMockBaseEvent('TEST_EVENT', 'test-service', { data: 'test' });
  
  const malformedEvent = { ...baseEvent };
  
  for (const field of missingFields) {
    delete malformedEvent[field];
  }
  
  return malformedEvent;
}

// ===================================================
// Journey-Specific Event Fixtures
// ===================================================

/**
 * Health journey event fixtures
 */
export const healthEventFixtures = {
  /**
   * Health metric recorded event
   */
  metricRecorded: createMockBaseEvent(
    'HEALTH_METRIC_RECORDED',
    'health-service',
    {
      userId: createMockUserId(),
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: createMockTimestamp(),
      deviceId: 'device-123'
    },
    { journey: 'HEALTH' }
  ),
  
  /**
   * Health goal achieved event
   */
  goalAchieved: createMockBaseEvent(
    'HEALTH_GOAL_ACHIEVED',
    'health-service',
    {
      userId: createMockUserId(),
      goalId: 'goal-123',
      goalType: 'STEPS',
      targetValue: 10000,
      achievedValue: 10250,
      achievedAt: createMockTimestamp()
    },
    { journey: 'HEALTH' }
  ),
  
  /**
   * Device connected event
   */
  deviceConnected: createMockBaseEvent(
    'DEVICE_CONNECTED',
    'health-service',
    {
      userId: createMockUserId(),
      deviceId: 'device-123',
      deviceType: 'Smartwatch',
      manufacturer: 'Apple',
      model: 'Watch Series 7',
      connectedAt: createMockTimestamp()
    },
    { journey: 'HEALTH' }
  )
};

/**
 * Care journey event fixtures
 */
export const careEventFixtures = {
  /**
   * Appointment booked event
   */
  appointmentBooked: createMockBaseEvent(
    'APPOINTMENT_BOOKED',
    'care-service',
    {
      userId: createMockUserId(),
      appointmentId: 'appt-123',
      providerId: 'provider-456',
      specialtyId: 'specialty-789',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      bookedAt: createMockTimestamp(),
      appointmentType: 'IN_PERSON'
    },
    { journey: 'CARE' }
  ),
  
  /**
   * Medication adherence event
   */
  medicationTaken: createMockBaseEvent(
    'MEDICATION_TAKEN',
    'care-service',
    {
      userId: createMockUserId(),
      medicationId: 'med-123',
      medicationName: 'Aspirin',
      dosage: '100mg',
      takenAt: createMockTimestamp(),
      scheduledFor: createMockTimestamp()
    },
    { journey: 'CARE' }
  ),
  
  /**
   * Telemedicine session completed event
   */
  telemedicineCompleted: createMockBaseEvent(
    'TELEMEDICINE_COMPLETED',
    'care-service',
    {
      userId: createMockUserId(),
      sessionId: 'session-123',
      providerId: 'provider-456',
      startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      endedAt: createMockTimestamp(),
      duration: 1800, // 30 minutes in seconds
      rating: 4
    },
    { journey: 'CARE' }
  )
};

/**
 * Plan journey event fixtures
 */
export const planEventFixtures = {
  /**
   * Claim submitted event
   */
  claimSubmitted: createMockBaseEvent(
    'CLAIM_SUBMITTED',
    'plan-service',
    {
      userId: createMockUserId(),
      claimId: 'claim-123',
      claimType: 'MEDICAL',
      amount: 150.75,
      serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      submittedAt: createMockTimestamp(),
      providerId: 'provider-456'
    },
    { journey: 'PLAN' }
  ),
  
  /**
   * Benefit used event
   */
  benefitUsed: createMockBaseEvent(
    'BENEFIT_USED',
    'plan-service',
    {
      userId: createMockUserId(),
      benefitId: 'benefit-123',
      benefitType: 'DENTAL',
      usedAt: createMockTimestamp(),
      providerId: 'provider-456',
      amountUsed: 75.50
    },
    { journey: 'PLAN' }
  ),
  
  /**
   * Plan selected event
   */
  planSelected: createMockBaseEvent(
    'PLAN_SELECTED',
    'plan-service',
    {
      userId: createMockUserId(),
      planId: 'plan-123',
      planType: 'PREMIUM',
      startDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      selectedAt: createMockTimestamp(),
      annualCost: 3600.00
    },
    { journey: 'PLAN' }
  )
};

/**
 * Gamification event fixtures
 */
export const gamificationEventFixtures = {
  /**
   * Achievement unlocked event
   */
  achievementUnlocked: createMockBaseEvent(
    'ACHIEVEMENT_UNLOCKED',
    'gamification-engine',
    {
      userId: createMockUserId(),
      achievementId: 'achievement-123',
      achievementType: 'health-check-streak',
      level: 2,
      title: 'Monitor de Saúde',
      description: 'Registre suas métricas de saúde por 7 dias consecutivos',
      xpAwarded: 150,
      unlockedAt: createMockTimestamp()
    },
    { journey: 'HEALTH' }
  ),
  
  /**
   * Quest completed event
   */
  questCompleted: createMockBaseEvent(
    'QUEST_COMPLETED',
    'gamification-engine',
    {
      userId: createMockUserId(),
      questId: 'quest-123',
      questTitle: 'Semana Saudável',
      xpAwarded: 300,
      rewardId: 'reward-456',
      completedAt: createMockTimestamp(),
      startedAt: new Date(Date.now() - 604800000).toISOString() // 1 week ago
    },
    { journey: 'HEALTH' }
  ),
  
  /**
   * Level up event
   */
  levelUp: createMockBaseEvent(
    'LEVEL_UP',
    'gamification-engine',
    {
      userId: createMockUserId(),
      previousLevel: 3,
      newLevel: 4,
      totalXp: 2500,
      xpForNextLevel: 3000,
      achievedAt: createMockTimestamp(),
      unlockedRewards: ['reward-123', 'reward-456']
    },
    { journey: 'HEALTH' }
  )
};

// ===================================================
// Kafka Message Fixtures
// ===================================================

/**
 * Creates a Kafka message fixture for testing
 * @param event The event to create a message for
 * @param topic The Kafka topic
 * @param partition Optional partition number
 * @param offset Optional offset in the partition
 * @returns A Kafka message fixture
 */
export function createMockKafkaMessage<T extends BaseEvent>(
  event: T,
  topic: string,
  partition: number = 0,
  offset: string = '0'
): KafkaEventMessage<T> {
  return {
    topic,
    partition,
    offset,
    key: event.userId ? Buffer.from(event.userId) : null,
    value: event,
    headers: createMockKafkaHeaders(event),
    timestamp: event.timestamp
  };
}

/**
 * Creates a Kafka message with a string value instead of an object
 * @param event The event to serialize
 * @param topic The Kafka topic
 * @returns A Kafka message with serialized event
 */
export function createMockSerializedKafkaMessage<T extends BaseEvent>(
  event: T,
  topic: string
): KafkaMessage {
  return {
    topic,
    partition: 0,
    offset: '0',
    key: event.userId ? Buffer.from(event.userId) : null,
    value: Buffer.from(JSON.stringify(event)),
    headers: createMockKafkaHeaders(event),
    timestamp: event.timestamp
  };
}

/**
 * Creates a malformed Kafka message for testing error scenarios
 * @param topic The Kafka topic
 * @param errorType Type of malformation to create
 * @returns A malformed Kafka message
 */
export function createMalformedKafkaMessage(
  topic: string,
  errorType: 'null-value' | 'invalid-json' | 'missing-headers' | 'wrong-schema'
): KafkaMessage {
  const baseEvent = createMockBaseEvent('TEST_EVENT', 'test-service', { data: 'test' });
  
  switch (errorType) {
    case 'null-value':
      return {
        topic,
        partition: 0,
        offset: '0',
        key: Buffer.from('test-key'),
        value: null,
        headers: createMockKafkaHeaders(baseEvent),
        timestamp: createMockTimestamp()
      };
    
    case 'invalid-json':
      return {
        topic,
        partition: 0,
        offset: '0',
        key: Buffer.from('test-key'),
        value: Buffer.from('{"this":"is not valid JSON'),
        headers: createMockKafkaHeaders(baseEvent),
        timestamp: createMockTimestamp()
      };
    
    case 'missing-headers':
      return {
        topic,
        partition: 0,
        offset: '0',
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify(baseEvent)),
        headers: {},
        timestamp: createMockTimestamp()
      };
    
    case 'wrong-schema':
      const wrongSchema = {
        id: 'not-an-event-id',
        message: 'This is not a valid event',
        data: { random: 'data' }
      };
      
      return {
        topic,
        partition: 0,
        offset: '0',
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify(wrongSchema)),
        headers: createMockKafkaHeaders(baseEvent),
        timestamp: createMockTimestamp()
      };
  }
}

// ===================================================
// Kafka Consumer Record Fixtures
// ===================================================

/**
 * Health journey Kafka message fixtures
 */
export const healthKafkaMessageFixtures = {
  metricRecorded: createMockKafkaMessage(
    healthEventFixtures.metricRecorded,
    HEALTH_EVENT_TOPICS.METRICS,
    0,
    '1000'
  ),
  
  goalAchieved: createMockKafkaMessage(
    healthEventFixtures.goalAchieved,
    HEALTH_EVENT_TOPICS.GOALS,
    1,
    '2000'
  ),
  
  deviceConnected: createMockKafkaMessage(
    healthEventFixtures.deviceConnected,
    HEALTH_EVENT_TOPICS.DEVICES,
    2,
    '3000'
  )
};

/**
 * Care journey Kafka message fixtures
 */
export const careKafkaMessageFixtures = {
  appointmentBooked: createMockKafkaMessage(
    careEventFixtures.appointmentBooked,
    CARE_EVENT_TOPICS.APPOINTMENTS,
    0,
    '1000'
  ),
  
  medicationTaken: createMockKafkaMessage(
    careEventFixtures.medicationTaken,
    CARE_EVENT_TOPICS.MEDICATIONS,
    1,
    '2000'
  ),
  
  telemedicineCompleted: createMockKafkaMessage(
    careEventFixtures.telemedicineCompleted,
    CARE_EVENT_TOPICS.TELEMEDICINE,
    2,
    '3000'
  )
};

/**
 * Plan journey Kafka message fixtures
 */
export const planKafkaMessageFixtures = {
  claimSubmitted: createMockKafkaMessage(
    planEventFixtures.claimSubmitted,
    PLAN_EVENT_TOPICS.CLAIMS,
    0,
    '1000'
  ),
  
  benefitUsed: createMockKafkaMessage(
    planEventFixtures.benefitUsed,
    PLAN_EVENT_TOPICS.BENEFITS,
    1,
    '2000'
  ),
  
  planSelected: createMockKafkaMessage(
    planEventFixtures.planSelected,
    PLAN_EVENT_TOPICS.PLANS,
    2,
    '3000'
  )
};

/**
 * Gamification Kafka message fixtures
 */
export const gamificationKafkaMessageFixtures = {
  achievementUnlocked: createMockKafkaMessage(
    gamificationEventFixtures.achievementUnlocked,
    GAMIFICATION_TOPICS.ACHIEVEMENT,
    0,
    '1000'
  ),
  
  questCompleted: createMockKafkaMessage(
    gamificationEventFixtures.questCompleted,
    GAMIFICATION_TOPICS.QUEST,
    1,
    '2000'
  ),
  
  levelUp: createMockKafkaMessage(
    gamificationEventFixtures.levelUp,
    GAMIFICATION_TOPICS.PROFILE,
    2,
    '3000'
  )
};

/**
 * Serialized Kafka message fixtures (with Buffer values)
 */
export const serializedKafkaMessageFixtures = {
  healthMetricRecorded: createMockSerializedKafkaMessage(
    healthEventFixtures.metricRecorded,
    HEALTH_EVENT_TOPICS.METRICS
  ),
  
  appointmentBooked: createMockSerializedKafkaMessage(
    careEventFixtures.appointmentBooked,
    CARE_EVENT_TOPICS.APPOINTMENTS
  ),
  
  claimSubmitted: createMockSerializedKafkaMessage(
    planEventFixtures.claimSubmitted,
    PLAN_EVENT_TOPICS.CLAIMS
  ),
  
  achievementUnlocked: createMockSerializedKafkaMessage(
    gamificationEventFixtures.achievementUnlocked,
    GAMIFICATION_TOPICS.ACHIEVEMENT
  )
};

/**
 * Malformed Kafka message fixtures for testing error scenarios
 */
export const malformedKafkaMessageFixtures = {
  nullValue: createMalformedKafkaMessage(HEALTH_EVENT_TOPICS.METRICS, 'null-value'),
  invalidJson: createMalformedKafkaMessage(CARE_EVENT_TOPICS.APPOINTMENTS, 'invalid-json'),
  missingHeaders: createMalformedKafkaMessage(PLAN_EVENT_TOPICS.CLAIMS, 'missing-headers'),
  wrongSchema: createMalformedKafkaMessage(GAMIFICATION_TOPICS.ACHIEVEMENT, 'wrong-schema')
};

// ===================================================
// Kafka Producer Record Fixtures
// ===================================================

/**
 * Creates a Kafka producer record fixture for testing
 * @param event The event to create a producer record for
 * @param topic The Kafka topic
 * @returns A Kafka producer record fixture
 */
export function createMockKafkaProducerRecord<T extends BaseEvent>(
  event: T,
  topic: string
): KafkaProducerRecord<T> {
  return {
    topic,
    messages: [
      {
        key: event.userId ? event.userId : undefined,
        value: event,
        headers: createMockKafkaHeaders(event),
        timestamp: event.timestamp
      }
    ],
    acks: 1,
    timeout: 30000
  };
}

/**
 * Health journey Kafka producer record fixtures
 */
export const healthProducerRecordFixtures = {
  metricRecorded: createMockKafkaProducerRecord(
    healthEventFixtures.metricRecorded,
    HEALTH_EVENT_TOPICS.METRICS
  ),
  
  goalAchieved: createMockKafkaProducerRecord(
    healthEventFixtures.goalAchieved,
    HEALTH_EVENT_TOPICS.GOALS
  ),
  
  deviceConnected: createMockKafkaProducerRecord(
    healthEventFixtures.deviceConnected,
    HEALTH_EVENT_TOPICS.DEVICES
  )
};

/**
 * Care journey Kafka producer record fixtures
 */
export const careProducerRecordFixtures = {
  appointmentBooked: createMockKafkaProducerRecord(
    careEventFixtures.appointmentBooked,
    CARE_EVENT_TOPICS.APPOINTMENTS
  ),
  
  medicationTaken: createMockKafkaProducerRecord(
    careEventFixtures.medicationTaken,
    CARE_EVENT_TOPICS.MEDICATIONS
  ),
  
  telemedicineCompleted: createMockKafkaProducerRecord(
    careEventFixtures.telemedicineCompleted,
    CARE_EVENT_TOPICS.TELEMEDICINE
  )
};

/**
 * Plan journey Kafka producer record fixtures
 */
export const planProducerRecordFixtures = {
  claimSubmitted: createMockKafkaProducerRecord(
    planEventFixtures.claimSubmitted,
    PLAN_EVENT_TOPICS.CLAIMS
  ),
  
  benefitUsed: createMockKafkaProducerRecord(
    planEventFixtures.benefitUsed,
    PLAN_EVENT_TOPICS.BENEFITS
  ),
  
  planSelected: createMockKafkaProducerRecord(
    planEventFixtures.planSelected,
    PLAN_EVENT_TOPICS.PLANS
  )
};

/**
 * Gamification Kafka producer record fixtures
 */
export const gamificationProducerRecordFixtures = {
  achievementUnlocked: createMockKafkaProducerRecord(
    gamificationEventFixtures.achievementUnlocked,
    GAMIFICATION_TOPICS.ACHIEVEMENT
  ),
  
  questCompleted: createMockKafkaProducerRecord(
    gamificationEventFixtures.questCompleted,
    GAMIFICATION_TOPICS.QUEST
  ),
  
  levelUp: createMockKafkaProducerRecord(
    gamificationEventFixtures.levelUp,
    GAMIFICATION_TOPICS.PROFILE
  )
};

// ===================================================
// Dead Letter Queue Fixtures
// ===================================================

/**
 * Creates a dead letter queue message fixture for testing
 * @param originalMessage The original message that failed processing
 * @param error The error that caused the failure
 * @param attempts Number of processing attempts made
 * @returns A dead letter queue message fixture
 */
export function createMockDLQMessage<T extends BaseEvent>(
  originalMessage: KafkaEventMessage<T>,
  error: Error,
  attempts: number = 3
): KafkaDeadLetterQueueMessage<T> {
  return {
    originalMessage,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: 'ERR_PROCESSING_FAILED',
      details: {
        eventType: originalMessage.value.type,
        eventId: originalMessage.value.eventId
      }
    },
    attempts,
    timestamp: new Date().toISOString(),
    consumerGroup: 'test-consumer-group',
    metadata: {
      originalTopic: originalMessage.topic,
      retryable: false
    }
  };
}

/**
 * Dead letter queue message fixtures
 */
export const dlqMessageFixtures = {
  healthMetricFailed: createMockDLQMessage(
    healthKafkaMessageFixtures.metricRecorded,
    new Error('Failed to process health metric: Invalid value'),
    3
  ),
  
  appointmentFailed: createMockDLQMessage(
    careKafkaMessageFixtures.appointmentBooked,
    new Error('Failed to process appointment: Provider not found'),
    3
  ),
  
  claimFailed: createMockDLQMessage(
    planKafkaMessageFixtures.claimSubmitted,
    new Error('Failed to process claim: Invalid claim amount'),
    3
  ),
  
  achievementFailed: createMockDLQMessage(
    gamificationKafkaMessageFixtures.achievementUnlocked,
    new Error('Failed to process achievement: Achievement already unlocked'),
    3
  )
};

/**
 * Creates a Kafka message for a dead letter queue topic
 * @param originalMessage The original message that failed processing
 * @param error The error that caused the failure
 * @param attempts Number of processing attempts made
 * @returns A Kafka message for a DLQ topic
 */
export function createMockDLQKafkaMessage<T extends BaseEvent>(
  originalMessage: KafkaEventMessage<T>,
  error: Error,
  attempts: number = 3
): KafkaMessage {
  const dlqMessage = createMockDLQMessage(originalMessage, error, attempts);
  const dlqTopic = `${DLQ_TOPICS.HEALTH_EVENTS}`;
  
  // Add error information to headers
  const dlqHeaders = {
    ...originalMessage.headers,
    [KAFKA_HEADERS.ERROR_MESSAGE]: Buffer.from(error.message),
    [KAFKA_HEADERS.ERROR_CODE]: Buffer.from('ERR_PROCESSING_FAILED'),
    [KAFKA_HEADERS.ORIGINAL_TOPIC]: Buffer.from(originalMessage.topic),
    [KAFKA_HEADERS.RETRY_COUNT]: Buffer.from(attempts.toString()),
    [KAFKA_HEADERS.TIMESTAMP]: Buffer.from(new Date().toISOString())
  };
  
  return {
    topic: dlqTopic,
    partition: 0,
    offset: '0',
    key: originalMessage.key,
    value: Buffer.from(JSON.stringify(dlqMessage)),
    headers: dlqHeaders,
    timestamp: new Date().toISOString()
  };
}

/**
 * Dead letter queue Kafka message fixtures
 */
export const dlqKafkaMessageFixtures = {
  healthMetricFailed: createMockDLQKafkaMessage(
    healthKafkaMessageFixtures.metricRecorded,
    new Error('Failed to process health metric: Invalid value'),
    3
  ),
  
  appointmentFailed: createMockDLQKafkaMessage(
    careKafkaMessageFixtures.appointmentBooked,
    new Error('Failed to process appointment: Provider not found'),
    3
  ),
  
  claimFailed: createMockDLQKafkaMessage(
    planKafkaMessageFixtures.claimSubmitted,
    new Error('Failed to process claim: Invalid claim amount'),
    3
  ),
  
  achievementFailed: createMockDLQKafkaMessage(
    gamificationKafkaMessageFixtures.achievementUnlocked,
    new Error('Failed to process achievement: Achievement already unlocked'),
    3
  )
};