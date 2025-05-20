/**
 * @file kafka-events.ts
 * @description Provides specialized test fixtures for Kafka-specific event testing, including
 * message envelope structures, headers, offsets, and topics. This file contains test data for
 * verifying Kafka integration, message serialization/deserialization, and event routing.
 *
 * These fixtures enable testing of the Kafka event infrastructure without requiring a running
 * Kafka instance, ensuring reliable event processing via Kafka.
 *
 * @module events/test/fixtures
 */

import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../src/dto/event-metadata.dto';
import { TOPICS } from '../../src/constants/topics.constants';
import { ERROR_CODES } from '../../src/constants/errors.constants';

/**
 * Interface representing a Kafka message header.
 */
export interface KafkaHeader {
  key: string;
  value: Buffer | null;
}

/**
 * Interface representing a Kafka message.
 */
export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  size: number;
  attributes: number;
  key: Buffer | null;
  value: Buffer | null;
  headers: KafkaHeader[];
}

/**
 * Interface representing a Kafka message with error context.
 */
export interface KafkaMessageWithError extends KafkaMessage {
  error: {
    code: string;
    message: string;
    retriesAttempted: number;
    maxRetries: number;
  };
}

/**
 * Interface representing a Kafka consumer group offset.
 */
export interface KafkaConsumerGroupOffset {
  topic: string;
  partition: number;
  offset: string;
  metadata: string | null;
  highWaterOffset: string;
  lowWaterOffset: string;
}

/**
 * Creates a Buffer from a string or object.
 * 
 * @param value The value to convert to a Buffer
 * @returns A Buffer containing the serialized value
 */
export function createBuffer(value: string | object): Buffer {
  if (typeof value === 'string') {
    return Buffer.from(value);
  }
  return Buffer.from(JSON.stringify(value));
}

/**
 * Creates a Kafka header with the given key and value.
 * 
 * @param key The header key
 * @param value The header value
 * @returns A KafkaHeader object
 */
export function createKafkaHeader(key: string, value: string | object | null): KafkaHeader {
  return {
    key,
    value: value === null ? null : createBuffer(value),
  };
}

/**
 * Creates a basic Kafka message with the given topic, key, and value.
 * 
 * @param topic The Kafka topic
 * @param key The message key (optional)
 * @param value The message value
 * @param options Additional options for the message
 * @returns A KafkaMessage object
 */
export function createKafkaMessage(
  topic: string,
  key: string | null,
  value: object,
  options: {
    partition?: number;
    offset?: string;
    timestamp?: string;
    headers?: Record<string, string | object | null>;
  } = {}
): KafkaMessage {
  const headers: KafkaHeader[] = [];
  
  // Add default headers
  headers.push(createKafkaHeader('content-type', 'application/json'));
  
  // Add custom headers
  if (options.headers) {
    for (const [headerKey, headerValue] of Object.entries(options.headers)) {
      headers.push(createKafkaHeader(headerKey, headerValue));
    }
  }
  
  const serializedValue = createBuffer(value);
  
  return {
    topic,
    partition: options.partition ?? 0,
    offset: options.offset ?? '0',
    timestamp: options.timestamp ?? new Date().toISOString(),
    size: serializedValue.length,
    attributes: 0,
    key: key ? createBuffer(key) : null,
    value: serializedValue,
    headers,
  };
}

/**
 * Creates a Kafka message with error context for testing error handling and retries.
 * 
 * @param message The base Kafka message
 * @param errorCode The error code
 * @param errorMessage The error message
 * @param retriesAttempted The number of retries attempted
 * @param maxRetries The maximum number of retries
 * @returns A KafkaMessageWithError object
 */
export function createKafkaMessageWithError(
  message: KafkaMessage,
  errorCode: string,
  errorMessage: string,
  retriesAttempted: number = 0,
  maxRetries: number = 3
): KafkaMessageWithError {
  return {
    ...message,
    error: {
      code: errorCode,
      message: errorMessage,
      retriesAttempted,
      maxRetries,
    },
  };
}

/**
 * Creates a Kafka consumer group offset for testing consumer group functionality.
 * 
 * @param topic The Kafka topic
 * @param partition The partition number
 * @param offset The current offset
 * @param highWaterOffset The high water mark offset
 * @param lowWaterOffset The low water mark offset
 * @param metadata Additional metadata
 * @returns A KafkaConsumerGroupOffset object
 */
export function createConsumerGroupOffset(
  topic: string,
  partition: number = 0,
  offset: string = '0',
  highWaterOffset: string = '100',
  lowWaterOffset: string = '0',
  metadata: string | null = null
): KafkaConsumerGroupOffset {
  return {
    topic,
    partition,
    offset,
    metadata,
    highWaterOffset,
    lowWaterOffset,
  };
}

// ===== KAFKA MESSAGE ENVELOPE FIXTURES =====

/**
 * Standard Kafka message envelope for a health metric event.
 */
export const healthMetricKafkaMessage = createKafkaMessage(
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
);

/**
 * Standard Kafka message envelope for a care appointment event.
 */
export const careAppointmentKafkaMessage = createKafkaMessage(
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
);

/**
 * Standard Kafka message envelope for a plan claim event.
 */
export const planClaimKafkaMessage = createKafkaMessage(
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
);

/**
 * Standard Kafka message envelope for a gamification achievement event.
 */
export const gamificationAchievementKafkaMessage = createKafkaMessage(
  TOPICS.GAMIFICATION.ACHIEVEMENTS,
  'user-123',
  {
    type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
    payload: {
      achievementId: 'achievement-123',
      achievementType: 'health-check-streak',
      tier: 'silver',
      points: 50,
      unlockedAt: '2023-04-15T14:30:00Z',
    },
    metadata: {
      eventId: '550e8400-e29b-41d4-a716-446655440006',
      correlationId: '550e8400-e29b-41d4-a716-446655440001', // Same as health metric event
      parentEventId: '550e8400-e29b-41d4-a716-446655440000', // Health metric event ID
      timestamp: '2023-04-15T14:30:00Z',
      origin: {
        service: 'gamification-engine',
        instance: 'gamification-engine-pod-3456',
        component: 'achievement-processor',
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
      'event-type': EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
      'user-id': 'user-123',
      'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
      'parent-event-id': '550e8400-e29b-41d4-a716-446655440000',
    },
  }
);

// ===== TOPIC-SPECIFIC EVENT EXAMPLES =====

/**
 * Collection of health journey event examples.
 */
export const healthEvents = {
  /**
   * Health metric recorded event.
   */
  metricRecorded: healthMetricKafkaMessage,
  
  /**
   * Health goal achieved event.
   */
  goalAchieved: createKafkaMessage(
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
  
  /**
   * Health device connected event.
   */
  deviceConnected: createKafkaMessage(
    TOPICS.HEALTH.DEVICES,
    'user-123',
    {
      type: EventType.HEALTH_DEVICE_CONNECTED,
      payload: {
        deviceId: 'device-123',
        deviceType: 'fitbit',
        connectionMethod: 'oauth',
        connectedAt: '2023-04-15T09:15:00Z',
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440009',
        correlationId: '550e8400-e29b-41d4-a716-446655440010',
        timestamp: '2023-04-15T09:15:00Z',
        origin: {
          service: 'health-service',
          instance: 'health-service-pod-1234',
          component: 'device-manager',
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
        'event-type': EventType.HEALTH_DEVICE_CONNECTED,
        'user-id': 'user-123',
        'correlation-id': '550e8400-e29b-41d4-a716-446655440010',
      },
    }
  ),
};

/**
 * Collection of care journey event examples.
 */
export const careEvents = {
  /**
   * Care appointment booked event.
   */
  appointmentBooked: careAppointmentKafkaMessage,
  
  /**
   * Care appointment completed event.
   */
  appointmentCompleted: createKafkaMessage(
    TOPICS.CARE.APPOINTMENTS,
    'user-456',
    {
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      payload: {
        appointmentId: 'appt-789',
        providerId: 'provider-123',
        appointmentType: 'in_person',
        scheduledAt: '2023-05-20T14:00:00Z',
        completedAt: '2023-05-20T14:45:00Z',
        duration: 45,
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440011',
        correlationId: '550e8400-e29b-41d4-a716-446655440003', // Same as appointment booked
        parentEventId: '550e8400-e29b-41d4-a716-446655440002', // Appointment booked event ID
        timestamp: '2023-05-20T14:45:00Z',
        origin: {
          service: 'care-service',
          instance: 'care-service-pod-5678',
          component: 'appointment-manager',
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
        'event-type': EventType.CARE_APPOINTMENT_COMPLETED,
        'user-id': 'user-456',
        'correlation-id': '550e8400-e29b-41d4-a716-446655440003',
        'parent-event-id': '550e8400-e29b-41d4-a716-446655440002',
      },
    }
  ),
  
  /**
   * Care medication taken event.
   */
  medicationTaken: createKafkaMessage(
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
};

/**
 * Collection of plan journey event examples.
 */
export const planEvents = {
  /**
   * Plan claim submitted event.
   */
  claimSubmitted: planClaimKafkaMessage,
  
  /**
   * Plan claim processed event.
   */
  claimProcessed: createKafkaMessage(
    TOPICS.PLAN.CLAIMS,
    'user-789',
    {
      type: EventType.PLAN_CLAIM_PROCESSED,
      payload: {
        claimId: 'claim-456',
        status: 'approved',
        amount: 150.75,
        coveredAmount: 120.60,
        processedAt: '2023-04-17T10:30:00Z',
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440014',
        correlationId: '550e8400-e29b-41d4-a716-446655440005', // Same as claim submitted
        parentEventId: '550e8400-e29b-41d4-a716-446655440004', // Claim submitted event ID
        timestamp: '2023-04-17T10:30:00Z',
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
        'event-type': EventType.PLAN_CLAIM_PROCESSED,
        'user-id': 'user-789',
        'correlation-id': '550e8400-e29b-41d4-a716-446655440005',
        'parent-event-id': '550e8400-e29b-41d4-a716-446655440004',
      },
    }
  ),
  
  /**
   * Plan benefit utilized event.
   */
  benefitUtilized: createKafkaMessage(
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
};

/**
 * Collection of gamification event examples.
 */
export const gamificationEvents = {
  /**
   * Gamification achievement unlocked event.
   */
  achievementUnlocked: gamificationAchievementKafkaMessage,
  
  /**
   * Gamification points earned event.
   */
  pointsEarned: createKafkaMessage(
    TOPICS.GAMIFICATION.EVENTS,
    'user-123',
    {
      type: EventType.GAMIFICATION_POINTS_EARNED,
      payload: {
        sourceType: 'health',
        sourceId: '550e8400-e29b-41d4-a716-446655440000', // Health metric event ID
        points: 10,
        reason: 'Recorded daily heart rate',
        earnedAt: '2023-04-15T10:30:05Z',
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440017',
        correlationId: '550e8400-e29b-41d4-a716-446655440001', // Same as health metric event
        parentEventId: '550e8400-e29b-41d4-a716-446655440000', // Health metric event ID
        timestamp: '2023-04-15T10:30:05Z',
        origin: {
          service: 'gamification-engine',
          instance: 'gamification-engine-pod-3456',
          component: 'point-calculator',
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
        'event-type': EventType.GAMIFICATION_POINTS_EARNED,
        'user-id': 'user-123',
        'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
        'parent-event-id': '550e8400-e29b-41d4-a716-446655440000',
      },
    }
  ),
  
  /**
   * Gamification level up event.
   */
  levelUp: createKafkaMessage(
    TOPICS.GAMIFICATION.EVENTS,
    'user-123',
    {
      type: EventType.GAMIFICATION_LEVEL_UP,
      payload: {
        previousLevel: 2,
        newLevel: 3,
        totalPoints: 1000,
        leveledUpAt: '2023-04-15T14:35:00Z',
      },
      metadata: {
        eventId: '550e8400-e29b-41d4-a716-446655440018',
        correlationId: '550e8400-e29b-41d4-a716-446655440001', // Same as health metric event
        parentEventId: '550e8400-e29b-41d4-a716-446655440006', // Achievement unlocked event ID
        timestamp: '2023-04-15T14:35:00Z',
        origin: {
          service: 'gamification-engine',
          instance: 'gamification-engine-pod-3456',
          component: 'level-manager',
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
        'event-type': EventType.GAMIFICATION_LEVEL_UP,
        'user-id': 'user-123',
        'correlation-id': '550e8400-e29b-41d4-a716-446655440001',
        'parent-event-id': '550e8400-e29b-41d4-a716-446655440006',
      },
    }
  ),
};

// ===== CONSUMER GROUP OFFSET EXAMPLES =====

/**
 * Collection of consumer group offset examples.
 */
export const consumerGroupOffsets = {
  /**
   * Health events consumer group offsets.
   */
  health: [
    createConsumerGroupOffset(TOPICS.HEALTH.EVENTS, 0, '100', '150', '0'),
    createConsumerGroupOffset(TOPICS.HEALTH.EVENTS, 1, '95', '120', '0'),
    createConsumerGroupOffset(TOPICS.HEALTH.EVENTS, 2, '110', '130', '0'),
  ],
  
  /**
   * Care events consumer group offsets.
   */
  care: [
    createConsumerGroupOffset(TOPICS.CARE.EVENTS, 0, '80', '100', '0'),
    createConsumerGroupOffset(TOPICS.CARE.EVENTS, 1, '75', '90', '0'),
    createConsumerGroupOffset(TOPICS.CARE.EVENTS, 2, '85', '95', '0'),
  ],
  
  /**
   * Plan events consumer group offsets.
   */
  plan: [
    createConsumerGroupOffset(TOPICS.PLAN.EVENTS, 0, '60', '80', '0'),
    createConsumerGroupOffset(TOPICS.PLAN.EVENTS, 1, '55', '70', '0'),
    createConsumerGroupOffset(TOPICS.PLAN.EVENTS, 2, '65', '75', '0'),
  ],
  
  /**
   * Gamification events consumer group offsets.
   */
  gamification: [
    createConsumerGroupOffset(TOPICS.GAMIFICATION.EVENTS, 0, '200', '250', '0'),
    createConsumerGroupOffset(TOPICS.GAMIFICATION.EVENTS, 1, '190', '230', '0'),
    createConsumerGroupOffset(TOPICS.GAMIFICATION.EVENTS, 2, '210', '240', '0'),
  ],
};

// ===== SERIALIZED MESSAGE EXAMPLES =====

/**
 * Collection of serialized message examples for testing marshaling/unmarshaling.
 */
export const serializedMessages = {
  /**
   * Serialized health metric event.
   */
  healthMetric: {
    buffer: healthMetricKafkaMessage.value,
    string: healthMetricKafkaMessage.value?.toString('utf8'),
    parsed: JSON.parse(healthMetricKafkaMessage.value?.toString('utf8') || '{}'),
  },
  
  /**
   * Serialized care appointment event.
   */
  careAppointment: {
    buffer: careAppointmentKafkaMessage.value,
    string: careAppointmentKafkaMessage.value?.toString('utf8'),
    parsed: JSON.parse(careAppointmentKafkaMessage.value?.toString('utf8') || '{}'),
  },
  
  /**
   * Serialized plan claim event.
   */
  planClaim: {
    buffer: planClaimKafkaMessage.value,
    string: planClaimKafkaMessage.value?.toString('utf8'),
    parsed: JSON.parse(planClaimKafkaMessage.value?.toString('utf8') || '{}'),
  },
  
  /**
   * Serialized gamification achievement event.
   */
  gamificationAchievement: {
    buffer: gamificationAchievementKafkaMessage.value,
    string: gamificationAchievementKafkaMessage.value?.toString('utf8'),
    parsed: JSON.parse(gamificationAchievementKafkaMessage.value?.toString('utf8') || '{}'),
  },
};

// ===== DEAD LETTER QUEUE EXAMPLES =====

/**
 * Collection of dead letter queue message examples.
 */
export const deadLetterQueueMessages = {
  /**
   * Failed health metric event due to schema validation.
   */
  failedHealthMetric: createKafkaMessageWithError(
    healthMetricKafkaMessage,
    ERROR_CODES.SCHEMA_VALIDATION_FAILED,
    'Invalid metric value: must be a positive number',
    3,
    3
  ),
  
  /**
   * Failed care appointment event due to processing error.
   */
  failedCareAppointment: createKafkaMessageWithError(
    careAppointmentKafkaMessage,
    ERROR_CODES.CONSUMER_PROCESSING_FAILED,
    'Provider not found: provider-123',
    2,
    3
  ),
  
  /**
   * Failed plan claim event due to deserialization error.
   */
  failedPlanClaim: createKafkaMessageWithError(
    planClaimKafkaMessage,
    ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED,
    'Invalid JSON format in message payload',
    1,
    3
  ),
};

// ===== RETRY MECHANISM EXAMPLES =====

/**
 * Collection of retry mechanism examples with exponential backoff.
 */
export const retryExamples = {
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
   * Retry attempts with exponential backoff intervals.
   */
  retryAttempts: [
    { attempt: 1, delayMs: 100 },
    { attempt: 2, delayMs: 200 },
    { attempt: 3, delayMs: 400 },
    { attempt: 4, delayMs: 800 },
    { attempt: 5, delayMs: 1600 },
  ],
  
  /**
   * Health metric event with retry metadata.
   */
  healthMetricWithRetry: createKafkaMessage(
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
      },
    }
  ),
};

// Export all fixtures
export default {
  // Message envelope fixtures
  healthMetricKafkaMessage,
  careAppointmentKafkaMessage,
  planClaimKafkaMessage,
  gamificationAchievementKafkaMessage,
  
  // Journey-specific event examples
  healthEvents,
  careEvents,
  planEvents,
  gamificationEvents,
  
  // Consumer group offset examples
  consumerGroupOffsets,
  
  // Serialized message examples
  serializedMessages,
  
  // Dead letter queue examples
  deadLetterQueueMessages,
  
  // Retry mechanism examples
  retryExamples,
  
  // Helper functions
  createKafkaMessage,
  createKafkaHeader,
  createBuffer,
  createKafkaMessageWithError,
  createConsumerGroupOffset,
};