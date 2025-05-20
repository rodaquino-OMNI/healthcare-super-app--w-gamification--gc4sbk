/**
 * @file kafka-events.fixtures.ts
 * @description Provides specialized fixtures for unit testing Kafka integration in the events package.
 * Includes mock Kafka messages, consumer records, and producer payloads that simulate the Kafka
 * message structure for different event types. These fixtures are essential for testing the events
 * package's Kafka producers, consumers, and message transformers.
 *
 * @module events/test/unit/fixtures
 */

import { EventType } from '../../../src/dto/event-types.enum';
import { TOPICS } from '../../../src/constants/topics.constants';
import { ERROR_CODES } from '../../../src/constants/errors.constants';

// Import from the main fixtures to avoid duplication
import {
  KafkaHeader,
  KafkaMessage,
  KafkaMessageWithError,
  KafkaConsumerGroupOffset,
  createBuffer,
  createKafkaHeader,
  createKafkaMessage,
  createKafkaMessageWithError,
  createConsumerGroupOffset,
} from '../../../test/fixtures/kafka-events';

/**
 * Interface representing a Kafka consumer record as received by a consumer.
 */
export interface KafkaConsumerRecord {
  topic: string;
  partition: number;
  message: KafkaMessage;
  heartbeat?: () => Promise<void>;
  pause?: () => void;
  resume?: () => void;
  commitOffset?: () => Promise<void>;
  uncommittedOffset?: () => number;
}

/**
 * Interface representing a Kafka producer payload for sending messages.
 */
export interface KafkaProducerPayload {
  topic: string;
  messages: {
    key?: Buffer | string | null;
    value: Buffer | string | object;
    headers?: Record<string, string | Buffer | null>;
    partition?: number;
    timestamp?: string;
  }[];
  acks?: number;
  timeout?: number;
  compression?: number;
}

/**
 * Interface representing a malformed Kafka message for testing error handling.
 */
export interface MalformedKafkaMessage extends Omit<KafkaMessage, 'value'> {
  value: Buffer | null;
  malformedReason: string;
  expectedError: string;
}

/**
 * Creates a Kafka consumer record for testing consumer functionality.
 * 
 * @param message The Kafka message
 * @param options Additional options for the consumer record
 * @returns A KafkaConsumerRecord object
 */
export function createConsumerRecord(
  message: KafkaMessage,
  options: {
    heartbeatFn?: () => Promise<void>;
    pauseFn?: () => void;
    resumeFn?: () => void;
    commitOffsetFn?: () => Promise<void>;
    uncommittedOffsetFn?: () => number;
  } = {}
): KafkaConsumerRecord {
  return {
    topic: message.topic,
    partition: message.partition,
    message,
    heartbeat: options.heartbeatFn || (() => Promise.resolve()),
    pause: options.pauseFn || (() => {}),
    resume: options.resumeFn || (() => {}),
    commitOffset: options.commitOffsetFn || (() => Promise.resolve()),
    uncommittedOffset: options.uncommittedOffsetFn || (() => parseInt(message.offset, 10)),
  };
}

/**
 * Creates a Kafka producer payload for testing producer functionality.
 * 
 * @param topic The Kafka topic
 * @param messages The messages to send
 * @param options Additional options for the producer payload
 * @returns A KafkaProducerPayload object
 */
export function createProducerPayload(
  topic: string,
  messages: Array<{
    key?: string | null;
    value: object;
    headers?: Record<string, string | object | null>;
    partition?: number;
    timestamp?: string;
  }>,
  options: {
    acks?: number;
    timeout?: number;
    compression?: number;
  } = {}
): KafkaProducerPayload {
  return {
    topic,
    messages: messages.map(msg => ({
      key: msg.key ? (typeof msg.key === 'string' ? msg.key : createBuffer(msg.key)) : null,
      value: typeof msg.value === 'string' ? msg.value : createBuffer(msg.value),
      headers: msg.headers,
      partition: msg.partition,
      timestamp: msg.timestamp,
    })),
    acks: options.acks !== undefined ? options.acks : 1,
    timeout: options.timeout || 30000,
    compression: options.compression || 0,
  };
}

/**
 * Creates a malformed Kafka message for testing error handling.
 * 
 * @param basedOn The base Kafka message to modify
 * @param malformedReason The reason the message is malformed
 * @param expectedError The expected error code
 * @returns A MalformedKafkaMessage object
 */
export function createMalformedMessage(
  basedOn: KafkaMessage,
  malformedReason: string,
  expectedError: string
): MalformedKafkaMessage {
  return {
    ...basedOn,
    malformedReason,
    expectedError,
  };
}

// ===== CONSUMER RECORD FIXTURES =====

/**
 * Collection of consumer record fixtures for health events.
 */
export const healthConsumerRecords = {
  /**
   * Consumer record for a health metric event.
   */
  metricRecorded: createConsumerRecord(
    createKafkaMessage(
      TOPICS.HEALTH.METRICS,
      'user-123',
      {
        type: EventType.HEALTH_METRIC_RECORDED,
        payload: {
          metricType: 'HEART_RATE',
          value: 72,
          unit: 'bpm',
          timestamp: '2023-04-15T10:30:00Z',
          source: 'manual',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          correlationId: '550e8400-e29b-41d4-a716-446655440001',
          timestamp: '2023-04-15T10:30:00Z',
          origin: {
            service: 'health-service',
            instance: 'health-service-pod-1234',
            component: 'metric-processor',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      },
      {
        headers: {
          'event-type': EventType.HEALTH_METRIC_RECORDED,
          'user-id': 'user-123',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
        },
      }
    ),
    {
      heartbeatFn: jest.fn().mockResolvedValue(undefined),
      commitOffsetFn: jest.fn().mockResolvedValue(undefined),
      uncommittedOffsetFn: jest.fn().mockReturnValue(0),
    }
  ),

  /**
   * Consumer record for a health goal achieved event.
   */
  goalAchieved: createConsumerRecord(
    createKafkaMessage(
      TOPICS.HEALTH.GOALS,
      'user-123',
      {
        type: EventType.HEALTH_GOAL_ACHIEVED,
        payload: {
          goalId: 'goal-123',
          goalType: 'steps',
          targetValue: 10000,
          achievedValue: 10250,
          completedAt: '2023-04-15T20:00:00Z',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440007',
          correlationId: '550e8400-e29b-41d4-a716-446655440008',
          timestamp: '2023-04-15T20:00:00Z',
          origin: {
            service: 'health-service',
            instance: 'health-service-pod-1234',
            component: 'goal-tracker',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      },
      {
        headers: {
          'event-type': EventType.HEALTH_GOAL_ACHIEVED,
          'user-id': 'user-123',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440008',
        },
      }
    ),
    {
      heartbeatFn: jest.fn().mockResolvedValue(undefined),
      commitOffsetFn: jest.fn().mockResolvedValue(undefined),
      uncommittedOffsetFn: jest.fn().mockReturnValue(0),
    }
  ),
};

/**
 * Collection of consumer record fixtures for care events.
 */
export const careConsumerRecords = {
  /**
   * Consumer record for a care appointment booked event.
   */
  appointmentBooked: createConsumerRecord(
    createKafkaMessage(
      TOPICS.CARE.APPOINTMENTS,
      'user-456',
      {
        type: EventType.CARE_APPOINTMENT_BOOKED,
        payload: {
          appointmentId: 'appt-789',
          providerId: 'provider-123',
          specialtyType: 'Cardiologia',
          appointmentType: 'in_person',
          scheduledAt: '2023-05-20T14:00:00Z',
          bookedAt: '2023-04-15T11:45:00Z',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440002',
          correlationId: '550e8400-e29b-41d4-a716-446655440003',
          timestamp: '2023-04-15T11:45:00Z',
          origin: {
            service: 'care-service',
            instance: 'care-service-pod-5678',
            component: 'appointment-scheduler',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      },
      {
        headers: {
          'event-type': EventType.CARE_APPOINTMENT_BOOKED,
          'user-id': 'user-456',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440003',
        },
      }
    ),
    {
      heartbeatFn: jest.fn().mockResolvedValue(undefined),
      commitOffsetFn: jest.fn().mockResolvedValue(undefined),
      uncommittedOffsetFn: jest.fn().mockReturnValue(0),
    }
  ),

  /**
   * Consumer record for a care medication taken event.
   */
  medicationTaken: createConsumerRecord(
    createKafkaMessage(
      TOPICS.CARE.MEDICATIONS,
      'user-456',
      {
        type: EventType.CARE_MEDICATION_TAKEN,
        payload: {
          medicationId: 'med-123',
          medicationName: 'Atorvastatina',
          dosage: '20mg',
          takenAt: '2023-04-15T08:00:00Z',
          adherence: 'on_time',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440012',
          correlationId: '550e8400-e29b-41d4-a716-446655440013',
          timestamp: '2023-04-15T08:00:00Z',
          origin: {
            service: 'care-service',
            instance: 'care-service-pod-5678',
            component: 'medication-tracker',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      },
      {
        headers: {
          'event-type': EventType.CARE_MEDICATION_TAKEN,
          'user-id': 'user-456',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440013',
        },
      }
    ),
    {
      heartbeatFn: jest.fn().mockResolvedValue(undefined),
      commitOffsetFn: jest.fn().mockResolvedValue(undefined),
      uncommittedOffsetFn: jest.fn().mockReturnValue(0),
    }
  ),
};

/**
 * Collection of consumer record fixtures for plan events.
 */
export const planConsumerRecords = {
  /**
   * Consumer record for a plan claim submitted event.
   */
  claimSubmitted: createConsumerRecord(
    createKafkaMessage(
      TOPICS.PLAN.CLAIMS,
      'user-789',
      {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        payload: {
          claimId: 'claim-456',
          claimType: 'medical',
          providerId: 'provider-789',
          serviceDate: '2023-04-10T09:30:00Z',
          amount: 150.75,
          submittedAt: '2023-04-15T13:20:00Z',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440004',
          correlationId: '550e8400-e29b-41d4-a716-446655440005',
          timestamp: '2023-04-15T13:20:00Z',
          origin: {
            service: 'plan-service',
            instance: 'plan-service-pod-9012',
            component: 'claim-processor',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      },
      {
        headers: {
          'event-type': EventType.PLAN_CLAIM_SUBMITTED,
          'user-id': 'user-789',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440005',
        },
      }
    ),
    {
      heartbeatFn: jest.fn().mockResolvedValue(undefined),
      commitOffsetFn: jest.fn().mockResolvedValue(undefined),
      uncommittedOffsetFn: jest.fn().mockReturnValue(0),
    }
  ),

  /**
   * Consumer record for a plan benefit utilized event.
   */
  benefitUtilized: createConsumerRecord(
    createKafkaMessage(
      TOPICS.PLAN.BENEFITS,
      'user-789',
      {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        payload: {
          benefitId: 'benefit-123',
          benefitType: 'wellness',
          providerId: 'provider-456',
          utilizationDate: '2023-04-15T15:30:00Z',
          savingsAmount: 50.00,
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440015',
          correlationId: '550e8400-e29b-41d4-a716-446655440016',
          timestamp: '2023-04-15T15:30:00Z',
          origin: {
            service: 'plan-service',
            instance: 'plan-service-pod-9012',
            component: 'benefit-tracker',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      },
      {
        headers: {
          'event-type': EventType.PLAN_BENEFIT_UTILIZED,
          'user-id': 'user-789',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440016',
        },
      }
    ),
    {
      heartbeatFn: jest.fn().mockResolvedValue(undefined),
      commitOffsetFn: jest.fn().mockResolvedValue(undefined),
      uncommittedOffsetFn: jest.fn().mockReturnValue(0),
    }
  ),
};

// ===== PRODUCER PAYLOAD FIXTURES =====

/**
 * Collection of producer payload fixtures for health events.
 */
export const healthProducerPayloads = {
  /**
   * Producer payload for a health metric event.
   */
  metricRecorded: createProducerPayload(
    TOPICS.HEALTH.METRICS,
    [
      {
        key: 'user-123',
        value: {
          type: EventType.HEALTH_METRIC_RECORDED,
          payload: {
            metricType: 'HEART_RATE',
            value: 72,
            unit: 'bpm',
            timestamp: '2023-04-15T10:30:00Z',
            source: 'manual',
          },
          metadata: {
            eventId: '550e8400-e29b-41d4-a716-446655440000',
            correlationId: '550e8400-e29b-41d4-a716-446655440001',
            timestamp: '2023-04-15T10:30:00Z',
            origin: {
              service: 'health-service',
              instance: 'health-service-pod-1234',
              component: 'metric-processor',
            },
            version: {
              major: '1',
              minor: '0',
              patch: '0',
            },
          },
        },
        headers: {
          'event-type': EventType.HEALTH_METRIC_RECORDED,
          'user-id': 'user-123',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
        },
      },
    ],
    { acks: -1 } // Require acknowledgment from all replicas
  ),

  /**
   * Producer payload for a health goal achieved event.
   */
  goalAchieved: createProducerPayload(
    TOPICS.HEALTH.GOALS,
    [
      {
        key: 'user-123',
        value: {
          type: EventType.HEALTH_GOAL_ACHIEVED,
          payload: {
            goalId: 'goal-123',
            goalType: 'steps',
            targetValue: 10000,
            achievedValue: 10250,
            completedAt: '2023-04-15T20:00:00Z',
          },
          metadata: {
            eventId: '550e8400-e29b-41d4-a716-446655440007',
            correlationId: '550e8400-e29b-41d4-a716-446655440008',
            timestamp: '2023-04-15T20:00:00Z',
            origin: {
              service: 'health-service',
              instance: 'health-service-pod-1234',
              component: 'goal-tracker',
            },
            version: {
              major: '1',
              minor: '0',
              patch: '0',
            },
          },
        },
        headers: {
          'event-type': EventType.HEALTH_GOAL_ACHIEVED,
          'user-id': 'user-123',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440008',
        },
      },
    ],
    { acks: -1 }
  ),
};

/**
 * Collection of producer payload fixtures for care events.
 */
export const careProducerPayloads = {
  /**
   * Producer payload for a care appointment booked event.
   */
  appointmentBooked: createProducerPayload(
    TOPICS.CARE.APPOINTMENTS,
    [
      {
        key: 'user-456',
        value: {
          type: EventType.CARE_APPOINTMENT_BOOKED,
          payload: {
            appointmentId: 'appt-789',
            providerId: 'provider-123',
            specialtyType: 'Cardiologia',
            appointmentType: 'in_person',
            scheduledAt: '2023-05-20T14:00:00Z',
            bookedAt: '2023-04-15T11:45:00Z',
          },
          metadata: {
            eventId: '550e8400-e29b-41d4-a716-446655440002',
            correlationId: '550e8400-e29b-41d4-a716-446655440003',
            timestamp: '2023-04-15T11:45:00Z',
            origin: {
              service: 'care-service',
              instance: 'care-service-pod-5678',
              component: 'appointment-scheduler',
            },
            version: {
              major: '1',
              minor: '0',
              patch: '0',
            },
          },
        },
        headers: {
          'event-type': EventType.CARE_APPOINTMENT_BOOKED,
          'user-id': 'user-456',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440003',
        },
      },
    ],
    { acks: -1 }
  ),

  /**
   * Producer payload for a care medication taken event.
   */
  medicationTaken: createProducerPayload(
    TOPICS.CARE.MEDICATIONS,
    [
      {
        key: 'user-456',
        value: {
          type: EventType.CARE_MEDICATION_TAKEN,
          payload: {
            medicationId: 'med-123',
            medicationName: 'Atorvastatina',
            dosage: '20mg',
            takenAt: '2023-04-15T08:00:00Z',
            adherence: 'on_time',
          },
          metadata: {
            eventId: '550e8400-e29b-41d4-a716-446655440012',
            correlationId: '550e8400-e29b-41d4-a716-446655440013',
            timestamp: '2023-04-15T08:00:00Z',
            origin: {
              service: 'care-service',
              instance: 'care-service-pod-5678',
              component: 'medication-tracker',
            },
            version: {
              major: '1',
              minor: '0',
              patch: '0',
            },
          },
        },
        headers: {
          'event-type': EventType.CARE_MEDICATION_TAKEN,
          'user-id': 'user-456',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440013',
        },
      },
    ],
    { acks: -1 }
  ),
};

/**
 * Collection of producer payload fixtures for plan events.
 */
export const planProducerPayloads = {
  /**
   * Producer payload for a plan claim submitted event.
   */
  claimSubmitted: createProducerPayload(
    TOPICS.PLAN.CLAIMS,
    [
      {
        key: 'user-789',
        value: {
          type: EventType.PLAN_CLAIM_SUBMITTED,
          payload: {
            claimId: 'claim-456',
            claimType: 'medical',
            providerId: 'provider-789',
            serviceDate: '2023-04-10T09:30:00Z',
            amount: 150.75,
            submittedAt: '2023-04-15T13:20:00Z',
          },
          metadata: {
            eventId: '550e8400-e29b-41d4-a716-446655440004',
            correlationId: '550e8400-e29b-41d4-a716-446655440005',
            timestamp: '2023-04-15T13:20:00Z',
            origin: {
              service: 'plan-service',
              instance: 'plan-service-pod-9012',
              component: 'claim-processor',
            },
            version: {
              major: '1',
              minor: '0',
              patch: '0',
            },
          },
        },
        headers: {
          'event-type': EventType.PLAN_CLAIM_SUBMITTED,
          'user-id': 'user-789',
          'correlation-id': '550e8400-e29b-41d4-a716-446655440005',
        },
      },
    ],
    { acks: -1 }
  ),
};

// ===== ERROR SCENARIO FIXTURES =====

/**
 * Collection of malformed message fixtures for testing error handling.
 */
export const malformedMessages = {
  /**
   * Malformed health metric event with invalid JSON.
   */
  invalidJson: createMalformedMessage(
    {
      ...healthConsumerRecords.metricRecorded.message,
      value: Buffer.from('{"type":"HEALTH_METRIC_RECORDED","payload":{"metricType":"HEART_RATE","value":72,"unit":"bpm","timestamp":"2023-04-15T10:30:00Z","source":"manual"},"metadata":{'),
    },
    'Incomplete JSON string',
    ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED
  ),

  /**
   * Malformed health metric event with missing required fields.
   */
  missingRequiredFields: createMalformedMessage(
    {
      ...healthConsumerRecords.metricRecorded.message,
      value: Buffer.from(JSON.stringify({
        type: EventType.HEALTH_METRIC_RECORDED,
        payload: {
          // Missing metricType
          value: 72,
          unit: 'bpm',
          timestamp: '2023-04-15T10:30:00Z',
          source: 'manual',
        },
        // Missing metadata
      })),
    },
    'Missing required fields: metricType in payload, metadata',
    ERROR_CODES.SCHEMA_VALIDATION_FAILED
  ),

  /**
   * Malformed health metric event with invalid field types.
   */
  invalidFieldTypes: createMalformedMessage(
    {
      ...healthConsumerRecords.metricRecorded.message,
      value: Buffer.from(JSON.stringify({
        type: EventType.HEALTH_METRIC_RECORDED,
        payload: {
          metricType: 'HEART_RATE',
          value: 'seventy-two', // Should be a number
          unit: 'bpm',
          timestamp: '2023-04-15T10:30:00Z',
          source: 'manual',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          correlationId: '550e8400-e29b-41d4-a716-446655440001',
          timestamp: '2023-04-15T10:30:00Z',
          origin: {
            service: 'health-service',
            instance: 'health-service-pod-1234',
            component: 'metric-processor',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      })),
    },
    'Invalid field type: value should be a number',
    ERROR_CODES.SCHEMA_VALIDATION_FAILED
  ),

  /**
   * Malformed care appointment event with invalid date format.
   */
  invalidDateFormat: createMalformedMessage(
    {
      ...careConsumerRecords.appointmentBooked.message,
      value: Buffer.from(JSON.stringify({
        type: EventType.CARE_APPOINTMENT_BOOKED,
        payload: {
          appointmentId: 'appt-789',
          providerId: 'provider-123',
          specialtyType: 'Cardiologia',
          appointmentType: 'in_person',
          scheduledAt: '20/05/2023', // Invalid ISO date format
          bookedAt: '2023-04-15T11:45:00Z',
        },
        metadata: {
          eventId: '550e8400-e29b-41d4-a716-446655440002',
          correlationId: '550e8400-e29b-41d4-a716-446655440003',
          timestamp: '2023-04-15T11:45:00Z',
          origin: {
            service: 'care-service',
            instance: 'care-service-pod-5678',
            component: 'appointment-scheduler',
          },
          version: {
            major: '1',
            minor: '0',
            patch: '0',
          },
        },
      })),
    },
    'Invalid date format: scheduledAt should be ISO 8601',
    ERROR_CODES.SCHEMA_VALIDATION_FAILED
  ),
};

/**
 * Collection of serialization failure fixtures for testing error handling.
 */
export const serializationFailures = {
  /**
   * Circular reference that cannot be serialized to JSON.
   */
  circularReference: (() => {
    const obj: any = {
      type: EventType.HEALTH_METRIC_RECORDED,
      payload: {
        metricType: 'HEART_RATE',
        value: 72,
        unit: 'bpm',
        timestamp: '2023-04-15T10:30:00Z',
        source: 'manual',
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        correlationId: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2023-04-15T10:30:00Z',
      },
    };
    // Create circular reference
    obj.metadata.circular = obj;
    return obj;
  })(),

  /**
   * Object with functions that cannot be serialized to JSON.
   */
  objectWithFunctions: {
    type: EventType.HEALTH_METRIC_RECORDED,
    payload: {
      metricType: 'HEART_RATE',
      value: 72,
      unit: 'bpm',
      timestamp: '2023-04-15T10:30:00Z',
      source: 'manual',
      calculate: function() { return this.value * 2; }, // Function cannot be serialized
    },
    metadata: {
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      correlationId: '550e8400-e29b-41d4-a716-446655440001',
      timestamp: '2023-04-15T10:30:00Z',
    },
  },
};

// ===== RETRY MECHANISM FIXTURES =====

/**
 * Collection of retry mechanism fixtures for testing exponential backoff.
 */
export const retryMechanismFixtures = {
  /**
   * Retry configuration with exponential backoff.
   */
  retryConfig: {
    initialRetryMs: 100,
    maxRetryMs: 10000,
    factor: 2,
    retries: 5,
    randomizationFactor: 0.2,
  },

  /**
   * Expected retry delays with exponential backoff.
   */
  expectedRetryDelays: [
    { attempt: 1, minDelayMs: 80, maxDelayMs: 120 },    // 100ms ± 20%
    { attempt: 2, minDelayMs: 160, maxDelayMs: 240 },   // 200ms ± 20%
    { attempt: 3, minDelayMs: 320, maxDelayMs: 480 },   // 400ms ± 20%
    { attempt: 4, minDelayMs: 640, maxDelayMs: 960 },   // 800ms ± 20%
    { attempt: 5, minDelayMs: 1280, maxDelayMs: 1920 }, // 1600ms ± 20%
  ],

  /**
   * Retry attempts with different error types.
   */
  retryAttemptsByErrorType: {
    // Network errors should be retried with full backoff
    networkError: [
      { errorCode: ERROR_CODES.BROKER_CONNECTION_ERROR, attempt: 1, delayMs: 100 },
      { errorCode: ERROR_CODES.BROKER_CONNECTION_ERROR, attempt: 2, delayMs: 200 },
      { errorCode: ERROR_CODES.BROKER_CONNECTION_ERROR, attempt: 3, delayMs: 400 },
      { errorCode: ERROR_CODES.BROKER_CONNECTION_ERROR, attempt: 4, delayMs: 800 },
      { errorCode: ERROR_CODES.BROKER_CONNECTION_ERROR, attempt: 5, delayMs: 1600 },
    ],

    // Validation errors should not be retried
    validationError: [
      { errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED, attempt: 1, delayMs: 0, shouldRetry: false },
    ],

    // Processing errors should be retried with limited attempts
    processingError: [
      { errorCode: ERROR_CODES.CONSUMER_PROCESSING_FAILED, attempt: 1, delayMs: 100 },
      { errorCode: ERROR_CODES.CONSUMER_PROCESSING_FAILED, attempt: 2, delayMs: 200 },
      { errorCode: ERROR_CODES.CONSUMER_PROCESSING_FAILED, attempt: 3, delayMs: 400, shouldRetry: false },
    ],
  },

  /**
   * Kafka message with retry metadata in headers.
   */
  messageWithRetryHeaders: createKafkaMessage(
    TOPICS.HEALTH.METRICS,
    'user-123',
    {
      type: EventType.HEALTH_METRIC_RECORDED,
      payload: {
        metricType: 'HEART_RATE',
        value: 72,
        unit: 'bpm',
        timestamp: '2023-04-15T10:30:00Z',
        source: 'manual',
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        correlationId: '550e8400-e29b-41d4-a716-446655440001',
        timestamp: '2023-04-15T10:30:00Z',
        origin: {
          service: 'health-service',
          instance: 'health-service-pod-1234',
          component: 'metric-processor',
        },
        version: {
          major: '1',
          minor: '0',
          patch: '0',
        },
        context: {
          retry: {
            count: 2,
            maxRetries: 5,
            reason: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
            originalTimestamp: '2023-04-15T10:29:50Z',
          },
        },
      },
    },
    {
      headers: {
        'event-type': EventType.HEALTH_METRIC_RECORDED,
        'user-id': 'user-123',
        'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
        'retry-count': '2',
        'retry-reason': ERROR_CODES.CONSUMER_PROCESSING_FAILED,
        'original-timestamp': '2023-04-15T10:29:50Z',
      },
    }
  ),
};

// ===== DEAD LETTER QUEUE FIXTURES =====

/**
 * Collection of dead letter queue fixtures for testing failed event handling.
 */
export const deadLetterQueueFixtures = {
  /**
   * Dead letter queue topic names.
   */
  topics: {
    health: `${TOPICS.HEALTH.EVENTS}.dlq`,
    care: `${TOPICS.CARE.EVENTS}.dlq`,
    plan: `${TOPICS.PLAN.EVENTS}.dlq`,
    gamification: `${TOPICS.GAMIFICATION.EVENTS}.dlq`,
  },

  /**
   * Failed health metric event due to schema validation.
   */
  failedHealthMetric: createKafkaMessageWithError(
    healthConsumerRecords.metricRecorded.message,
    ERROR_CODES.SCHEMA_VALIDATION_FAILED,
    'Invalid metric value: must be a positive number',
    3,
    3
  ),

  /**
   * Failed care appointment event due to processing error.
   */
  failedCareAppointment: createKafkaMessageWithError(
    careConsumerRecords.appointmentBooked.message,
    ERROR_CODES.CONSUMER_PROCESSING_FAILED,
    'Provider not found: provider-123',
    2,
    3
  ),

  /**
   * Failed plan claim event due to deserialization error.
   */
  failedPlanClaim: createKafkaMessageWithError(
    planConsumerRecords.claimSubmitted.message,
    ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
    'Invalid JSON format in message payload',
    1,
    3
  ),

  /**
   * Producer payload for sending a message to the dead letter queue.
   */
  dlqProducerPayload: createProducerPayload(
    `${TOPICS.HEALTH.EVENTS}.dlq`,
    [
      {
        key: 'user-123',
        value: {
          originalMessage: {
            topic: TOPICS.HEALTH.METRICS,
            partition: 0,
            offset: '0',
            timestamp: '2023-04-15T10:30:00Z',
            headers: {
              'event-type': EventType.HEALTH_METRIC_RECORDED,
              'user-id': 'user-123',
              'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
            },
          },
          error: {
            code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: 'Invalid metric value: must be a positive number',
            retriesAttempted: 3,
            maxRetries: 3,
            timestamp: '2023-04-15T10:30:05Z',
          },
        },
        headers: {
          'original-topic': TOPICS.HEALTH.METRICS,
          'error-code': ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          'retry-exhausted': 'true',
          'user-id': 'user-123',
        },
      },
    ],
    { acks: -1 }
  ),
};

// ===== AUDIT AND LOGGING FIXTURES =====

/**
 * Collection of audit and logging fixtures for testing the event audit system.
 */
export const auditAndLoggingFixtures = {
  /**
   * Audit log entry for a successful event processing.
   */
  successfulEventAudit: {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    correlationId: '550e8400-e29b-41d4-a716-446655440001',
    eventType: EventType.HEALTH_METRIC_RECORDED,
    topic: TOPICS.HEALTH.METRICS,
    partition: 0,
    offset: '0',
    timestamp: '2023-04-15T10:30:00Z',
    processingStartedAt: '2023-04-15T10:30:01Z',
    processingCompletedAt: '2023-04-15T10:30:01.050Z',
    processingDurationMs: 50,
    userId: 'user-123',
    status: 'SUCCESS',
    origin: {
      service: 'health-service',
      instance: 'health-service-pod-1234',
      component: 'metric-processor',
    },
  },

  /**
   * Audit log entry for a failed event processing.
   */
  failedEventAudit: {
    eventId: '550e8400-e29b-41d4-a716-446655440004',
    correlationId: '550e8400-e29b-41d4-a716-446655440005',
    eventType: EventType.PLAN_CLAIM_SUBMITTED,
    topic: TOPICS.PLAN.CLAIMS,
    partition: 0,
    offset: '0',
    timestamp: '2023-04-15T13:20:00Z',
    processingStartedAt: '2023-04-15T13:20:01Z',
    processingCompletedAt: '2023-04-15T13:20:01.150Z',
    processingDurationMs: 150,
    userId: 'user-789',
    status: 'FAILED',
    error: {
      code: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
      message: 'Provider not found: provider-789',
      retriesAttempted: 0,
      maxRetries: 3,
    },
    origin: {
      service: 'plan-service',
      instance: 'plan-service-pod-9012',
      component: 'claim-processor',
    },
  },

  /**
   * Audit log entry for a retried event processing.
   */
  retriedEventAudit: {
    eventId: '550e8400-e29b-41d4-a716-446655440012',
    correlationId: '550e8400-e29b-41d4-a716-446655440013',
    eventType: EventType.CARE_MEDICATION_TAKEN,
    topic: TOPICS.CARE.MEDICATIONS,
    partition: 0,
    offset: '0',
    timestamp: '2023-04-15T08:00:00Z',
    processingStartedAt: '2023-04-15T08:00:01Z',
    processingCompletedAt: '2023-04-15T08:00:01.200Z',
    processingDurationMs: 200,
    userId: 'user-456',
    status: 'RETRIED',
    error: {
      code: ERROR_CODES.CONSUMER_PROCESSING_FAILED,
      message: 'Database connection timeout',
      retriesAttempted: 1,
      maxRetries: 3,
      nextRetryAt: '2023-04-15T08:00:11Z', // 10 seconds later
    },
    origin: {
      service: 'care-service',
      instance: 'care-service-pod-5678',
      component: 'medication-tracker',
    },
  },

  /**
   * Audit log entry for a dead-lettered event processing.
   */
  deadLetteredEventAudit: {
    eventId: '550e8400-e29b-41d4-a716-446655440007',
    correlationId: '550e8400-e29b-41d4-a716-446655440008',
    eventType: EventType.HEALTH_GOAL_ACHIEVED,
    topic: TOPICS.HEALTH.GOALS,
    partition: 0,
    offset: '0',
    timestamp: '2023-04-15T20:00:00Z',
    processingStartedAt: '2023-04-15T20:00:01Z',
    processingCompletedAt: '2023-04-15T20:00:01.100Z',
    processingDurationMs: 100,
    userId: 'user-123',
    status: 'DEAD_LETTERED',
    error: {
      code: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      message: 'Invalid goal type: must be one of [steps, weight, sleep, heart_rate]',
      retriesAttempted: 0,
      maxRetries: 0, // No retries for validation errors
      deadLetterQueueTopic: `${TOPICS.HEALTH.GOALS}.dlq`,
    },
    origin: {
      service: 'health-service',
      instance: 'health-service-pod-1234',
      component: 'goal-tracker',
    },
  },
};

// Export all fixtures
export default {
  // Consumer record fixtures
  healthConsumerRecords,
  careConsumerRecords,
  planConsumerRecords,
  
  // Producer payload fixtures
  healthProducerPayloads,
  careProducerPayloads,
  planProducerPayloads,
  
  // Error scenario fixtures
  malformedMessages,
  serializationFailures,
  
  // Retry mechanism fixtures
  retryMechanismFixtures,
  
  // Dead letter queue fixtures
  deadLetterQueueFixtures,
  
  // Audit and logging fixtures
  auditAndLoggingFixtures,
  
  // Helper functions
  createConsumerRecord,
  createProducerPayload,
  createMalformedMessage,
};