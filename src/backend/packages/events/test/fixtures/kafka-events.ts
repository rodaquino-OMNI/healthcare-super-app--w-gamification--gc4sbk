/**
 * @file kafka-events.ts
 * @description Test fixtures for Kafka-specific event testing, including message envelope structures,
 * headers, offsets, and topics. These fixtures enable testing of the Kafka event infrastructure
 * without requiring a running Kafka instance.
 */

import { randomUUID } from 'crypto';

import {
  KafkaEvent,
  KafkaHeaders,
  KafkaProducerOptions,
  KafkaConsumerOptions,
} from '../../src/interfaces/kafka-event.interface';

import {
  IBaseEvent,
  EventMetadata,
} from '../../src/interfaces/base-event.interface';

import {
  JourneyType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  JourneyEvent,
} from '../../src/interfaces/journey-events.interface';

// ===== HELPER FUNCTIONS =====

/**
 * Creates a base event with default values
 * @param overrides Properties to override in the base event
 * @returns A base event object
 */
export function createBaseEvent<T = any>(overrides: Partial<IBaseEvent<T>> = {}): IBaseEvent<T> {
  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    type: 'test.event',
    payload: {} as T,
    metadata: {
      correlationId: `corr-${Date.now()}`,
      traceId: `trace-${randomUUID()}`,
    },
    ...overrides,
  };
}

/**
 * Creates a Kafka event with default values
 * @param overrides Properties to override in the Kafka event
 * @returns A Kafka event object
 */
export function createKafkaEvent<T = any>(overrides: Partial<KafkaEvent<T>> = {}): KafkaEvent<T> {
  const baseEvent = createBaseEvent<T>(overrides);
  
  return {
    ...baseEvent,
    topic: 'test-topic',
    partition: 0,
    offset: '0',
    key: `key-${Date.now()}`,
    headers: {
      'content-type': 'application/json',
      'event-type': baseEvent.type,
      'event-source': baseEvent.source,
      'correlation-id': baseEvent.metadata?.correlationId || '',
      'trace-id': baseEvent.metadata?.traceId || '',
    },
    ...overrides,
  };
}

/**
 * Creates Kafka headers with default values
 * @param overrides Headers to override
 * @returns Kafka headers object
 */
export function createKafkaHeaders(overrides: Partial<KafkaHeaders> = {}): KafkaHeaders {
  return {
    'content-type': 'application/json',
    'event-type': 'test.event',
    'event-source': 'test-service',
    'correlation-id': `corr-${Date.now()}`,
    'trace-id': `trace-${randomUUID()}`,
    ...overrides,
  };
}

// ===== KAFKA MESSAGE ENVELOPE FIXTURES =====

/**
 * Basic Kafka message envelope fixture
 */
export const basicKafkaMessage: KafkaEvent = createKafkaEvent({
  topic: 'basic-topic',
  partition: 0,
  offset: '100',
  key: 'basic-key',
  payload: { data: 'basic-data' },
  type: 'basic.event',
});

/**
 * Kafka message with custom headers
 */
export const kafkaMessageWithCustomHeaders: KafkaEvent = createKafkaEvent({
  topic: 'custom-headers-topic',
  partition: 1,
  offset: '200',
  key: 'custom-headers-key',
  payload: { data: 'custom-headers-data' },
  type: 'custom.headers.event',
  headers: {
    'content-type': 'application/json',
    'event-type': 'custom.headers.event',
    'event-source': 'test-service',
    'correlation-id': 'custom-correlation-id',
    'trace-id': 'custom-trace-id',
    'custom-header': 'custom-value',
    'x-retry-count': '0',
  },
});

/**
 * Kafka message with retry headers
 */
export const kafkaMessageWithRetryHeaders: KafkaEvent = createKafkaEvent({
  topic: 'retry-topic',
  partition: 2,
  offset: '300',
  key: 'retry-key',
  payload: { data: 'retry-data' },
  type: 'retry.event',
  headers: {
    'content-type': 'application/json',
    'event-type': 'retry.event',
    'event-source': 'test-service',
    'correlation-id': 'retry-correlation-id',
    'trace-id': 'retry-trace-id',
    'x-retry-count': '2',
    'x-original-topic': 'original-topic',
    'x-original-partition': '0',
    'x-original-offset': '150',
    'x-retry-reason': 'connection-timeout',
    'x-retry-timestamp': Date.now().toString(),
  },
});

/**
 * Kafka message with dead letter queue headers
 */
export const kafkaMessageWithDLQHeaders: KafkaEvent = createKafkaEvent({
  topic: 'dlq-topic',
  partition: 3,
  offset: '400',
  key: 'dlq-key',
  payload: { data: 'dlq-data' },
  type: 'dlq.event',
  headers: {
    'content-type': 'application/json',
    'event-type': 'dlq.event',
    'event-source': 'test-service',
    'correlation-id': 'dlq-correlation-id',
    'trace-id': 'dlq-trace-id',
    'x-original-topic': 'original-topic',
    'x-original-partition': '0',
    'x-original-offset': '150',
    'x-error-message': 'Failed to process message after 3 retries',
    'x-error-code': 'PROCESSING_ERROR',
    'x-error-timestamp': Date.now().toString(),
    'x-retry-count': '3',
  },
});

// ===== JOURNEY-SPECIFIC EVENT FIXTURES =====

/**
 * Health journey event - Metric recorded
 */
export const healthMetricRecordedKafkaEvent: KafkaEvent = createKafkaEvent({
  topic: 'health-events',
  partition: 0,
  offset: '500',
  key: 'user-123',
  type: HealthEventType.METRIC_RECORDED,
  source: 'health-service',
  payload: {
    metric: {
      id: 'metric-123',
      userId: 'user-123',
      type: 'HEART_RATE',
    },
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    source: 'manual',
  },
  metadata: {
    correlationId: 'health-correlation-id',
    traceId: 'health-trace-id',
    userId: 'user-123',
    journey: 'health',
  },
});

/**
 * Health journey event - Goal achieved
 */
export const healthGoalAchievedKafkaEvent: KafkaEvent = createKafkaEvent({
  topic: 'health-events',
  partition: 0,
  offset: '501',
  key: 'user-123',
  type: HealthEventType.GOAL_ACHIEVED,
  source: 'health-service',
  payload: {
    goal: {
      id: 'goal-123',
      userId: 'user-123',
      type: 'STEPS',
    },
    achievedValue: 10000,
    targetValue: 8000,
    achievedDate: new Date().toISOString(),
    daysToAchieve: 1,
    streakCount: 5,
  },
  metadata: {
    correlationId: 'health-correlation-id',
    traceId: 'health-trace-id',
    userId: 'user-123',
    journey: 'health',
  },
});

/**
 * Care journey event - Appointment booked
 */
export const careAppointmentBookedKafkaEvent: KafkaEvent = createKafkaEvent({
  topic: 'care-events',
  partition: 0,
  offset: '600',
  key: 'user-123',
  type: CareEventType.APPOINTMENT_BOOKED,
  source: 'care-service',
  payload: {
    appointment: {
      id: 'appointment-123',
      userId: 'user-123',
      providerId: 'provider-123',
      status: 'SCHEDULED',
    },
    provider: 'Dr. Smith',
    appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    appointmentType: 'CONSULTATION',
    isFirstAppointment: true,
    isUrgent: false,
  },
  metadata: {
    correlationId: 'care-correlation-id',
    traceId: 'care-trace-id',
    userId: 'user-123',
    journey: 'care',
  },
});

/**
 * Care journey event - Medication taken
 */
export const careMedicationTakenKafkaEvent: KafkaEvent = createKafkaEvent({
  topic: 'care-events',
  partition: 0,
  offset: '601',
  key: 'user-123',
  type: CareEventType.MEDICATION_TAKEN,
  source: 'care-service',
  payload: {
    medication: {
      id: 'medication-123',
      userId: 'user-123',
      name: 'Medication A',
    },
    takenDate: new Date().toISOString(),
    scheduledTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    takenOnTime: true,
    dosageTaken: '10mg',
    notes: 'Taken with water',
  },
  metadata: {
    correlationId: 'care-correlation-id',
    traceId: 'care-trace-id',
    userId: 'user-123',
    journey: 'care',
  },
});

/**
 * Plan journey event - Claim submitted
 */
export const planClaimSubmittedKafkaEvent: KafkaEvent = createKafkaEvent({
  topic: 'plan-events',
  partition: 0,
  offset: '700',
  key: 'user-123',
  type: PlanEventType.CLAIM_SUBMITTED,
  source: 'plan-service',
  payload: {
    claim: {
      id: 'claim-123',
      userId: 'user-123',
      status: 'SUBMITTED',
    },
    submissionDate: new Date().toISOString(),
    amount: 150.75,
    serviceDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    provider: 'Medical Clinic XYZ',
    hasDocuments: true,
    documentCount: 2,
    isFirstClaim: false,
  },
  metadata: {
    correlationId: 'plan-correlation-id',
    traceId: 'plan-trace-id',
    userId: 'user-123',
    journey: 'plan',
  },
});

/**
 * Plan journey event - Benefit used
 */
export const planBenefitUsedKafkaEvent: KafkaEvent = createKafkaEvent({
  topic: 'plan-events',
  partition: 0,
  offset: '701',
  key: 'user-123',
  type: PlanEventType.BENEFIT_USED,
  source: 'plan-service',
  payload: {
    benefit: {
      id: 'benefit-123',
      userId: 'user-123',
      type: 'DENTAL',
    },
    usageDate: new Date().toISOString(),
    provider: 'Dental Clinic ABC',
    serviceDescription: 'Routine cleaning',
    amountUsed: 75.0,
    remainingAmount: 425.0,
    remainingPercentage: 85,
    isFirstUse: false,
  },
  metadata: {
    correlationId: 'plan-correlation-id',
    traceId: 'plan-trace-id',
    userId: 'user-123',
    journey: 'plan',
  },
});

// ===== CONSUMER GROUP AND OFFSET FIXTURES =====

/**
 * Consumer group configuration fixture
 */
export const consumerGroupConfig: KafkaConsumerOptions = {
  topic: 'test-topic',
  groupId: 'test-consumer-group',
  fromBeginning: false,
  autoCommit: true,
  autoCommitInterval: 5000,
  sessionTimeout: 30000,
};

/**
 * Consumer group with multiple topics configuration fixture
 */
export const multiTopicConsumerGroupConfig: KafkaConsumerOptions = {
  topic: 'test-topic-multi',
  groupId: 'test-multi-topic-consumer-group',
  fromBeginning: true,
  partition: 0,
  autoCommit: false,
};

/**
 * Consumer group offset fixture
 */
export const consumerGroupOffset = {
  topic: 'test-topic',
  partition: 0,
  offset: '1000',
  metadata: 'test-metadata',
  highWatermark: '1500',
};

/**
 * Consumer group with multiple partitions offset fixture
 */
export const multiPartitionConsumerGroupOffset = [
  {
    topic: 'test-topic',
    partition: 0,
    offset: '1000',
    metadata: 'test-metadata-0',
    highWatermark: '1500',
  },
  {
    topic: 'test-topic',
    partition: 1,
    offset: '2000',
    metadata: 'test-metadata-1',
    highWatermark: '2500',
  },
  {
    topic: 'test-topic',
    partition: 2,
    offset: '3000',
    metadata: 'test-metadata-2',
    highWatermark: '3500',
  },
];

// ===== SERIALIZED MESSAGE FIXTURES =====

/**
 * Serialized Kafka message fixture (JSON string)
 */
export const serializedKafkaMessage = JSON.stringify({
  topic: 'serialized-topic',
  partition: 0,
  offset: '800',
  key: 'serialized-key',
  value: {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-service',
    type: 'serialized.event',
    payload: { data: 'serialized-data' },
    metadata: {
      correlationId: 'serialized-correlation-id',
      traceId: 'serialized-trace-id',
    },
  },
  headers: {
    'content-type': 'application/json',
    'event-type': 'serialized.event',
    'event-source': 'test-service',
    'correlation-id': 'serialized-correlation-id',
    'trace-id': 'serialized-trace-id',
  },
});

/**
 * Binary serialized Kafka message fixture (Buffer)
 */
export const binarySerializedKafkaMessage = Buffer.from(serializedKafkaMessage);

/**
 * Malformed serialized Kafka message fixture (invalid JSON)
 */
export const malformedSerializedKafkaMessage = '{"topic":"malformed-topic","partition":0,"offset":"900","key":"malformed-key","value":{"eventId":"';

// ===== DEAD LETTER QUEUE AND RETRY FIXTURES =====

/**
 * Dead letter queue topic configuration
 */
export const deadLetterQueueConfig = {
  topic: 'dlq-topic',
  originalTopic: 'original-topic',
  maxRetries: 3,
  retryBackoffMs: 1000, // Initial retry delay in milliseconds
};

/**
 * Retry configuration with exponential backoff
 */
export const retryConfig = {
  maxRetries: 3,
  initialRetryDelayMs: 1000, // 1 second
  maxRetryDelayMs: 60000, // 1 minute
  backoffFactor: 2, // Exponential backoff factor
  retryableErrors: ['CONNECTION_ERROR', 'TIMEOUT_ERROR', 'RETRIABLE_ERROR'],
};

/**
 * Retry attempt fixture
 */
export const retryAttempt = {
  attemptNumber: 1,
  originalMessage: basicKafkaMessage,
  error: new Error('Connection timeout'),
  errorCode: 'CONNECTION_ERROR',
  timestamp: Date.now(),
  nextRetryTimestamp: Date.now() + 1000, // 1 second later
};

/**
 * Retry attempts with exponential backoff fixture
 */
export const retryAttemptsWithBackoff = [
  {
    attemptNumber: 1,
    originalMessage: basicKafkaMessage,
    error: new Error('Connection timeout'),
    errorCode: 'CONNECTION_ERROR',
    timestamp: Date.now() - 5000, // 5 seconds ago
    nextRetryTimestamp: Date.now() - 4000, // 4 seconds ago
    retryDelayMs: 1000, // 1 second
  },
  {
    attemptNumber: 2,
    originalMessage: basicKafkaMessage,
    error: new Error('Connection timeout'),
    errorCode: 'CONNECTION_ERROR',
    timestamp: Date.now() - 3000, // 3 seconds ago
    nextRetryTimestamp: Date.now() - 1000, // 1 second ago
    retryDelayMs: 2000, // 2 seconds
  },
  {
    attemptNumber: 3,
    originalMessage: basicKafkaMessage,
    error: new Error('Connection timeout'),
    errorCode: 'CONNECTION_ERROR',
    timestamp: Date.now(),
    nextRetryTimestamp: Date.now() + 4000, // 4 seconds in the future
    retryDelayMs: 4000, // 4 seconds
  },
];

/**
 * Failed message for dead letter queue fixture
 */
export const failedMessageForDLQ = {
  originalMessage: basicKafkaMessage,
  error: new Error('Failed to process message after 3 retries'),
  errorCode: 'PROCESSING_ERROR',
  retryCount: 3,
  firstErrorTimestamp: Date.now() - 7000, // 7 seconds ago
  lastErrorTimestamp: Date.now(),
  retryAttempts: retryAttemptsWithBackoff,
};

// ===== CIRCUIT BREAKER FIXTURES =====

/**
 * Circuit breaker configuration fixture
 */
export const circuitBreakerConfig = {
  failureThreshold: 5, // Number of failures before opening the circuit
  successThreshold: 2, // Number of successes before closing the circuit
  resetTimeoutMs: 30000, // 30 seconds timeout before attempting to half-open the circuit
};

/**
 * Circuit breaker state transitions fixture
 */
export const circuitBreakerStateTransitions = [
  {
    fromState: 'CLOSED',
    toState: 'OPEN',
    reason: 'Failure threshold reached',
    timestamp: Date.now() - 60000, // 1 minute ago
    failureCount: 5,
  },
  {
    fromState: 'OPEN',
    toState: 'HALF_OPEN',
    reason: 'Reset timeout elapsed',
    timestamp: Date.now() - 30000, // 30 seconds ago
  },
  {
    fromState: 'HALF_OPEN',
    toState: 'CLOSED',
    reason: 'Success threshold reached',
    timestamp: Date.now() - 15000, // 15 seconds ago
    successCount: 2,
  },
];

// ===== BATCH PROCESSING FIXTURES =====

/**
 * Batch processing configuration fixture
 */
export const batchProcessingConfig = {
  batchSize: 100,
  batchTimeoutMs: 1000,
  maxBatchBytes: 1048576, // 1MB
};

/**
 * Batch of Kafka messages fixture
 */
export const kafkaMessageBatch = {
  topic: 'batch-topic',
  partition: 0,
  messages: [
    createKafkaEvent({
      topic: 'batch-topic',
      partition: 0,
      offset: '1000',
      key: 'batch-key-1',
      payload: { data: 'batch-data-1' },
      type: 'batch.event',
    }),
    createKafkaEvent({
      topic: 'batch-topic',
      partition: 0,
      offset: '1001',
      key: 'batch-key-2',
      payload: { data: 'batch-data-2' },
      type: 'batch.event',
    }),
    createKafkaEvent({
      topic: 'batch-topic',
      partition: 0,
      offset: '1002',
      key: 'batch-key-3',
      payload: { data: 'batch-data-3' },
      type: 'batch.event',
    }),
  ],
  highWatermark: '1500',
  isEmpty: false,
};

// ===== PRODUCER FIXTURES =====

/**
 * Kafka producer options fixture
 */
export const producerOptions: KafkaProducerOptions = {
  topic: 'producer-topic',
  key: 'producer-key',
  headers: {
    'content-type': 'application/json',
    'event-type': 'producer.event',
    'event-source': 'test-service',
  },
  acks: -1, // Wait for all replicas
  compression: 'gzip',
};

/**
 * Kafka producer message fixture
 */
export const producerMessage = {
  topic: 'producer-topic',
  messages: [
    {
      key: 'producer-key-1',
      value: JSON.stringify({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'producer.event',
        payload: { data: 'producer-data-1' },
      }),
      headers: {
        'content-type': 'application/json',
        'event-type': 'producer.event',
        'event-source': 'test-service',
        'correlation-id': 'producer-correlation-id-1',
        'trace-id': 'producer-trace-id-1',
      },
    },
  ],
};

/**
 * Kafka producer batch message fixture
 */
export const producerBatchMessage = {
  topic: 'producer-batch-topic',
  messages: [
    {
      key: 'producer-key-1',
      value: JSON.stringify({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'producer.batch.event',
        payload: { data: 'producer-batch-data-1' },
      }),
      headers: {
        'content-type': 'application/json',
        'event-type': 'producer.batch.event',
        'event-source': 'test-service',
        'correlation-id': 'producer-batch-correlation-id-1',
        'trace-id': 'producer-batch-trace-id-1',
      },
    },
    {
      key: 'producer-key-2',
      value: JSON.stringify({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'producer.batch.event',
        payload: { data: 'producer-batch-data-2' },
      }),
      headers: {
        'content-type': 'application/json',
        'event-type': 'producer.batch.event',
        'event-source': 'test-service',
        'correlation-id': 'producer-batch-correlation-id-2',
        'trace-id': 'producer-batch-trace-id-2',
      },
    },
  ],
};

// ===== EXPORT ALL FIXTURES =====

/**
 * All Kafka event test fixtures
 */
export const kafkaEventFixtures = {
  // Message envelope fixtures
  basicKafkaMessage,
  kafkaMessageWithCustomHeaders,
  kafkaMessageWithRetryHeaders,
  kafkaMessageWithDLQHeaders,
  
  // Journey-specific event fixtures
  healthMetricRecordedKafkaEvent,
  healthGoalAchievedKafkaEvent,
  careAppointmentBookedKafkaEvent,
  careMedicationTakenKafkaEvent,
  planClaimSubmittedKafkaEvent,
  planBenefitUsedKafkaEvent,
  
  // Consumer group and offset fixtures
  consumerGroupConfig,
  multiTopicConsumerGroupConfig,
  consumerGroupOffset,
  multiPartitionConsumerGroupOffset,
  
  // Serialized message fixtures
  serializedKafkaMessage,
  binarySerializedKafkaMessage,
  malformedSerializedKafkaMessage,
  
  // Dead letter queue and retry fixtures
  deadLetterQueueConfig,
  retryConfig,
  retryAttempt,
  retryAttemptsWithBackoff,
  failedMessageForDLQ,
  
  // Circuit breaker fixtures
  circuitBreakerConfig,
  circuitBreakerStateTransitions,
  
  // Batch processing fixtures
  batchProcessingConfig,
  kafkaMessageBatch,
  
  // Producer fixtures
  producerOptions,
  producerMessage,
  producerBatchMessage,
};

export default kafkaEventFixtures;