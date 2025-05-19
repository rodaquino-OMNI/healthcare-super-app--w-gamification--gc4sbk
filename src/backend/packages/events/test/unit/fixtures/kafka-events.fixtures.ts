/**
 * @file kafka-events.fixtures.ts
 * @description Provides specialized fixtures for testing Kafka integration in the events package.
 * Includes mock Kafka messages, consumer records, and producer payloads that simulate the
 * Kafka message structure for different event types.
 */

import { KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { EventJourney, EventProcessingStatus, KafkaErrorType, KafkaHeaders, TypedKafkaMessage } from '../../../src/kafka/kafka.types';
import { KafkaEvent, KafkaProducerOptions } from '../../../src/interfaces/kafka-event.interface';
import { IBaseEvent, EventMetadata } from '../../../src/interfaces/base-event.interface';

// Helper function to create a timestamp
const createTimestamp = (): string => new Date().toISOString();

// Helper function to create a base event
const createBaseEvent = <T>(type: string, payload: T, source: string = 'test-service'): IBaseEvent<T> => ({
  eventId: uuidv4(),
  timestamp: createTimestamp(),
  version: '1.0.0',
  source,
  type,
  payload,
  metadata: {
    correlationId: uuidv4(),
    traceId: uuidv4().replace(/-/g, ''),
    userId: 'user-123',
    journey: 'health' as 'health' | 'care' | 'plan',
    context: {}
  }
});

// Helper function to create Kafka headers
const createKafkaHeaders = (event: IBaseEvent<any>, additionalHeaders: Record<string, string> = {}): KafkaHeaders => ({
  'event-id': event.eventId,
  'correlation-id': event.metadata?.correlationId || uuidv4(),
  'trace-id': event.metadata?.traceId || uuidv4().replace(/-/g, ''),
  'user-id': event.metadata?.userId || 'user-123',
  'event-type': event.type,
  'event-version': event.version,
  'event-journey': event.metadata?.journey || EventJourney.HEALTH,
  'event-source': event.source,
  'event-timestamp': event.timestamp,
  ...additionalHeaders
});

// Helper function to convert headers to Buffer format for KafkaJS
const convertHeadersToBuffer = (headers: KafkaHeaders): Record<string, Buffer> => {
  const result: Record<string, Buffer> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) {
      result[key] = Buffer.from(value);
    }
  }
  
  return result;
};

/**
 * Creates a mock Kafka message with the specified payload and headers.
 * 
 * @param payload - The message payload
 * @param headers - Optional Kafka headers
 * @param key - Optional message key
 * @param partition - Optional partition number
 * @param offset - Optional offset number
 * @returns A KafkaMessage object
 */
export const createKafkaMessage = <T>(
  payload: T,
  headers: KafkaHeaders = {},
  key: string | null = null,
  partition: number = 0,
  offset: string = '0'
): KafkaMessage => ({
  key: key ? Buffer.from(key) : null,
  value: Buffer.from(JSON.stringify(payload)),
  timestamp: createTimestamp(),
  size: 0,
  attributes: 0,
  offset,
  headers: convertHeadersToBuffer(headers)
});

/**
 * Creates a typed Kafka message with the specified payload and headers.
 * 
 * @param payload - The message payload
 * @param headers - Optional Kafka headers
 * @param key - Optional message key
 * @param partition - Optional partition number
 * @param offset - Optional offset number
 * @returns A TypedKafkaMessage object
 */
export const createTypedKafkaMessage = <T>(
  payload: T,
  headers: KafkaHeaders = {},
  key: string | null = null,
  partition: number = 0,
  offset: string = '0'
): TypedKafkaMessage<T> => ({
  key: key ? Buffer.from(key) : null,
  value: payload,
  timestamp: createTimestamp(),
  size: 0,
  attributes: 0,
  offset,
  headers,
  parsedValue: payload
});

/**
 * Creates a Kafka event from a base event.
 * 
 * @param baseEvent - The base event to convert
 * @param topic - The Kafka topic
 * @param partition - Optional partition number
 * @param offset - Optional offset number
 * @param key - Optional message key
 * @returns A KafkaEvent object
 */
export const createKafkaEvent = <T>(
  baseEvent: IBaseEvent<T>,
  topic: string,
  partition: number = 0,
  offset: number = 0,
  key?: string
): KafkaEvent<T> => ({
  ...baseEvent,
  topic,
  partition,
  offset,
  key,
  headers: createKafkaHeaders(baseEvent)
});

/**
 * Creates a Kafka producer options object.
 * 
 * @param topic - The Kafka topic
 * @param partition - Optional partition number
 * @param key - Optional message key
 * @param headers - Optional Kafka headers
 * @returns A KafkaProducerOptions object
 */
export const createKafkaProducerOptions = (
  topic: string,
  partition?: number,
  key?: string,
  headers?: KafkaHeaders
): KafkaProducerOptions => ({
  topic,
  partition,
  key,
  headers,
  acks: -1,
  compression: 'gzip'
});

// ===== HEALTH JOURNEY FIXTURES =====

/**
 * Health metric event payload fixture
 */
export const healthMetricPayload = {
  metricType: 'HEART_RATE',
  value: 75,
  unit: 'bpm',
  recordedAt: createTimestamp(),
  source: 'manual',
  deviceId: null
};

/**
 * Health goal event payload fixture
 */
export const healthGoalPayload = {
  goalType: 'STEPS',
  targetValue: 10000,
  currentValue: 8500,
  unit: 'steps',
  startDate: createTimestamp(),
  endDate: new Date(Date.now() + 86400000).toISOString(),
  status: 'IN_PROGRESS'
};

/**
 * Device connection event payload fixture
 */
export const deviceConnectionPayload = {
  deviceId: 'device-123',
  deviceType: 'Smartwatch',
  manufacturer: 'FitBit',
  model: 'Versa 3',
  connectionStatus: 'CONNECTED',
  lastSyncTime: createTimestamp()
};

/**
 * Health metric recorded event fixture
 */
export const healthMetricRecordedEvent = createBaseEvent(
  'health.metric.recorded',
  healthMetricPayload,
  'health-service'
);

/**
 * Health goal achieved event fixture
 */
export const healthGoalAchievedEvent = createBaseEvent(
  'health.goal.achieved',
  healthGoalPayload,
  'health-service'
);

/**
 * Device connected event fixture
 */
export const deviceConnectedEvent = createBaseEvent(
  'health.device.connected',
  deviceConnectionPayload,
  'health-service'
);

/**
 * Health metric Kafka message fixture
 */
export const healthMetricKafkaMessage = createKafkaMessage(
  healthMetricRecordedEvent,
  createKafkaHeaders(healthMetricRecordedEvent),
  'user-123',
  0,
  '100'
);

/**
 * Health goal Kafka message fixture
 */
export const healthGoalKafkaMessage = createKafkaMessage(
  healthGoalAchievedEvent,
  createKafkaHeaders(healthGoalAchievedEvent),
  'user-123',
  0,
  '101'
);

/**
 * Device connection Kafka message fixture
 */
export const deviceConnectionKafkaMessage = createKafkaMessage(
  deviceConnectedEvent,
  createKafkaHeaders(deviceConnectedEvent),
  'user-123',
  0,
  '102'
);

/**
 * Health metric Kafka event fixture
 */
export const healthMetricKafkaEvent = createKafkaEvent(
  healthMetricRecordedEvent,
  'health-metrics',
  0,
  100,
  'user-123'
);

/**
 * Health goal Kafka event fixture
 */
export const healthGoalKafkaEvent = createKafkaEvent(
  healthGoalAchievedEvent,
  'health-goals',
  0,
  101,
  'user-123'
);

/**
 * Device connection Kafka event fixture
 */
export const deviceConnectionKafkaEvent = createKafkaEvent(
  deviceConnectedEvent,
  'health-devices',
  0,
  102,
  'user-123'
);

// ===== CARE JOURNEY FIXTURES =====

/**
 * Appointment event payload fixture
 */
export const appointmentPayload = {
  appointmentId: 'appt-123',
  providerId: 'provider-456',
  specialtyId: 'specialty-789',
  dateTime: new Date(Date.now() + 172800000).toISOString(), // 2 days in the future
  duration: 30,
  status: 'SCHEDULED',
  location: 'Virtual',
  notes: 'Follow-up appointment'
};

/**
 * Medication event payload fixture
 */
export const medicationPayload = {
  medicationId: 'med-123',
  name: 'Lisinopril',
  dosage: '10mg',
  frequency: 'DAILY',
  startDate: createTimestamp(),
  endDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days in the future
  status: 'ACTIVE',
  adherenceStatus: 'TAKEN',
  scheduledTime: createTimestamp()
};

/**
 * Telemedicine event payload fixture
 */
export const telemedicinePayload = {
  sessionId: 'session-123',
  appointmentId: 'appt-123',
  providerId: 'provider-456',
  startTime: createTimestamp(),
  endTime: new Date(Date.now() + 1800000).toISOString(), // 30 minutes in the future
  status: 'IN_PROGRESS',
  connectionQuality: 'GOOD'
};

/**
 * Appointment booked event fixture
 */
export const appointmentBookedEvent = createBaseEvent(
  'care.appointment.booked',
  appointmentPayload,
  'care-service'
);

/**
 * Medication taken event fixture
 */
export const medicationTakenEvent = createBaseEvent(
  'care.medication.taken',
  medicationPayload,
  'care-service'
);

/**
 * Telemedicine session started event fixture
 */
export const telemedicineSessionStartedEvent = createBaseEvent(
  'care.telemedicine.started',
  telemedicinePayload,
  'care-service'
);

/**
 * Appointment Kafka message fixture
 */
export const appointmentKafkaMessage = createKafkaMessage(
  appointmentBookedEvent,
  createKafkaHeaders(appointmentBookedEvent),
  'user-123',
  0,
  '200'
);

/**
 * Medication Kafka message fixture
 */
export const medicationKafkaMessage = createKafkaMessage(
  medicationTakenEvent,
  createKafkaHeaders(medicationTakenEvent),
  'user-123',
  0,
  '201'
);

/**
 * Telemedicine Kafka message fixture
 */
export const telemedicineKafkaMessage = createKafkaMessage(
  telemedicineSessionStartedEvent,
  createKafkaHeaders(telemedicineSessionStartedEvent),
  'user-123',
  0,
  '202'
);

/**
 * Appointment Kafka event fixture
 */
export const appointmentKafkaEvent = createKafkaEvent(
  appointmentBookedEvent,
  'care-appointments',
  0,
  200,
  'user-123'
);

/**
 * Medication Kafka event fixture
 */
export const medicationKafkaEvent = createKafkaEvent(
  medicationTakenEvent,
  'care-medications',
  0,
  201,
  'user-123'
);

/**
 * Telemedicine Kafka event fixture
 */
export const telemedicineKafkaEvent = createKafkaEvent(
  telemedicineSessionStartedEvent,
  'care-telemedicine',
  0,
  202,
  'user-123'
);

// ===== PLAN JOURNEY FIXTURES =====

/**
 * Claim event payload fixture
 */
export const claimPayload = {
  claimId: 'claim-123',
  claimType: 'MEDICAL',
  amount: 150.75,
  currency: 'BRL',
  serviceDate: createTimestamp(),
  submissionDate: createTimestamp(),
  status: 'SUBMITTED',
  documentIds: ['doc-123', 'doc-456'],
  providerName: 'Clínica São Paulo'
};

/**
 * Benefit event payload fixture
 */
export const benefitPayload = {
  benefitId: 'benefit-123',
  benefitType: 'WELLNESS',
  name: 'Gym Membership',
  description: 'Monthly gym membership reimbursement',
  value: 100.00,
  currency: 'BRL',
  usageDate: createTimestamp(),
  status: 'USED'
};

/**
 * Plan selection event payload fixture
 */
export const planSelectionPayload = {
  planId: 'plan-123',
  planType: 'PREMIUM',
  startDate: createTimestamp(),
  endDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year in the future
  monthlyPremium: 350.00,
  currency: 'BRL',
  coverageLevel: 'FAMILY',
  dependents: 2
};

/**
 * Claim submitted event fixture
 */
export const claimSubmittedEvent = createBaseEvent(
  'plan.claim.submitted',
  claimPayload,
  'plan-service'
);

/**
 * Benefit used event fixture
 */
export const benefitUsedEvent = createBaseEvent(
  'plan.benefit.used',
  benefitPayload,
  'plan-service'
);

/**
 * Plan selected event fixture
 */
export const planSelectedEvent = createBaseEvent(
  'plan.plan.selected',
  planSelectionPayload,
  'plan-service'
);

/**
 * Claim Kafka message fixture
 */
export const claimKafkaMessage = createKafkaMessage(
  claimSubmittedEvent,
  createKafkaHeaders(claimSubmittedEvent),
  'user-123',
  0,
  '300'
);

/**
 * Benefit Kafka message fixture
 */
export const benefitKafkaMessage = createKafkaMessage(
  benefitUsedEvent,
  createKafkaHeaders(benefitUsedEvent),
  'user-123',
  0,
  '301'
);

/**
 * Plan selection Kafka message fixture
 */
export const planSelectionKafkaMessage = createKafkaMessage(
  planSelectedEvent,
  createKafkaHeaders(planSelectedEvent),
  'user-123',
  0,
  '302'
);

/**
 * Claim Kafka event fixture
 */
export const claimKafkaEvent = createKafkaEvent(
  claimSubmittedEvent,
  'plan-claims',
  0,
  300,
  'user-123'
);

/**
 * Benefit Kafka event fixture
 */
export const benefitKafkaEvent = createKafkaEvent(
  benefitUsedEvent,
  'plan-benefits',
  0,
  301,
  'user-123'
);

/**
 * Plan selection Kafka event fixture
 */
export const planSelectionKafkaEvent = createKafkaEvent(
  planSelectedEvent,
  'plan-selections',
  0,
  302,
  'user-123'
);

// ===== ERROR SCENARIO FIXTURES =====

/**
 * Malformed Kafka message fixture (invalid JSON)
 */
export const malformedKafkaMessage: KafkaMessage = {
  key: Buffer.from('user-123'),
  value: Buffer.from('{"invalid JSON": true,}'),
  timestamp: createTimestamp(),
  size: 0,
  attributes: 0,
  offset: '400',
  headers: convertHeadersToBuffer({
    'event-type': 'health.metric.recorded',
    'event-journey': EventJourney.HEALTH
  })
};

/**
 * Missing required fields Kafka message fixture
 */
export const missingFieldsKafkaMessage = createKafkaMessage(
  {
    // Missing required fields like eventId, timestamp, etc.
    type: 'health.metric.recorded',
    payload: healthMetricPayload
  },
  {
    'event-type': 'health.metric.recorded',
    'event-journey': EventJourney.HEALTH
  },
  'user-123',
  0,
  '401'
);

/**
 * Invalid schema Kafka message fixture
 */
export const invalidSchemaKafkaMessage = createKafkaMessage(
  {
    ...healthMetricRecordedEvent,
    payload: {
      ...healthMetricPayload,
      value: 'not-a-number', // Should be a number
      metricType: 'INVALID_TYPE' // Invalid enum value
    }
  },
  createKafkaHeaders(healthMetricRecordedEvent),
  'user-123',
  0,
  '402'
);

/**
 * Retry Kafka message fixture
 */
export const retryKafkaMessage = createKafkaMessage(
  healthMetricRecordedEvent,
  {
    ...createKafkaHeaders(healthMetricRecordedEvent),
    'retry-count': '2',
    'original-topic': 'health-metrics',
    'error-type': KafkaErrorType.PROCESSING,
    'error-message': 'Processing failed, retrying'
  },
  'user-123',
  0,
  '403'
);

/**
 * Dead letter queue Kafka message fixture
 */
export const deadLetterKafkaMessage = createKafkaMessage(
  healthMetricRecordedEvent,
  {
    ...createKafkaHeaders(healthMetricRecordedEvent),
    'retry-count': '5',
    'original-topic': 'health-metrics',
    'error-type': KafkaErrorType.PROCESSING,
    'error-message': 'Max retries exceeded',
    'dead-letter': 'true',
    'failed-at': createTimestamp()
  },
  'user-123',
  0,
  '404'
);

/**
 * Batch Kafka messages fixture
 */
export const batchKafkaMessages = [
  healthMetricKafkaMessage,
  healthGoalKafkaMessage,
  deviceConnectionKafkaMessage,
  appointmentKafkaMessage,
  medicationKafkaMessage
];

/**
 * Batch Kafka events fixture
 */
export const batchKafkaEvents = [
  healthMetricKafkaEvent,
  healthGoalKafkaEvent,
  deviceConnectionKafkaEvent,
  appointmentKafkaEvent,
  medicationKafkaEvent
];

/**
 * Kafka producer options fixtures
 */
export const producerOptionsFixtures = {
  healthMetrics: createKafkaProducerOptions('health-metrics', 0, 'user-123'),
  healthGoals: createKafkaProducerOptions('health-goals', 0, 'user-123'),
  careAppointments: createKafkaProducerOptions('care-appointments', 0, 'user-123'),
  planClaims: createKafkaProducerOptions('plan-claims', 0, 'user-123'),
  deadLetterQueue: createKafkaProducerOptions('dead-letter-queue', 0, 'user-123', {
    'original-topic': 'health-metrics',
    'error-type': KafkaErrorType.PROCESSING,
    'error-message': 'Processing failed'
  })
};

/**
 * Kafka consumer record fixtures
 */
export const consumerRecordFixtures = {
  healthMetric: {
    topic: 'health-metrics',
    partition: 0,
    message: healthMetricKafkaMessage
  },
  careAppointment: {
    topic: 'care-appointments',
    partition: 0,
    message: appointmentKafkaMessage
  },
  planClaim: {
    topic: 'plan-claims',
    partition: 0,
    message: claimKafkaMessage
  },
  malformed: {
    topic: 'health-metrics',
    partition: 0,
    message: malformedKafkaMessage
  },
  retry: {
    topic: 'retry-topic',
    partition: 0,
    message: retryKafkaMessage
  },
  deadLetter: {
    topic: 'dead-letter-queue',
    partition: 0,
    message: deadLetterKafkaMessage
  }
};

/**
 * Kafka batch consumer record fixtures
 */
export const batchConsumerRecordFixture = {
  topic: 'health-metrics',
  partition: 0,
  messages: [
    healthMetricKafkaMessage,
    healthGoalKafkaMessage,
    deviceConnectionKafkaMessage
  ]
};

/**
 * Kafka message processing status fixtures
 */
export const processingStatusFixtures = {
  pending: EventProcessingStatus.PENDING,
  processing: EventProcessingStatus.PROCESSING,
  completed: EventProcessingStatus.COMPLETED,
  failed: EventProcessingStatus.FAILED,
  retrying: EventProcessingStatus.RETRYING,
  deadLettered: EventProcessingStatus.DEAD_LETTERED
};

/**
 * Kafka error type fixtures
 */
export const errorTypeFixtures = {
  connection: KafkaErrorType.CONNECTION,
  authentication: KafkaErrorType.AUTHENTICATION,
  authorization: KafkaErrorType.AUTHORIZATION,
  broker: KafkaErrorType.BROKER,
  timeout: KafkaErrorType.TIMEOUT,
  serialization: KafkaErrorType.SERIALIZATION,
  validation: KafkaErrorType.VALIDATION,
  processing: KafkaErrorType.PROCESSING,
  unknown: KafkaErrorType.UNKNOWN
};