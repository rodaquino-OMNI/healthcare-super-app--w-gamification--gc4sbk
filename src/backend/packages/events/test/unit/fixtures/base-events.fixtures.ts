/**
 * @file base-events.fixtures.ts
 * @description Provides foundational event fixtures that serve as the base for all event types
 * across journeys. Contains mock events with minimal valid properties, edge cases, and common
 * patterns used throughout event testing. These fixtures enable consistent testing of the core
 * event processing pipeline independent of journey-specific logic.
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto, createEventMetadata } from '../../../src/dto/event-metadata.dto';

/**
 * UUID generator for test fixtures
 * @returns A UUID v4 string
 */
export function generateTestUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Base event fixture with minimal valid properties
 */
export const baseEventFixture = {
  type: EventType.USER_LOGIN,
  userId: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for consistent testing
  data: {
    loginMethod: 'password',
    deviceType: 'web',
    loginAt: new Date().toISOString()
  },
  journey: 'user'
};

/**
 * Base event fixture with metadata
 */
export const baseEventWithMetadataFixture = {
  ...baseEventFixture,
  metadata: createEventMetadata('auth-service', {
    correlationId: '550e8400-e29b-41d4-a716-446655440001',
    timestamp: new Date(),
    eventId: '550e8400-e29b-41d4-a716-446655440002'
  })
};

/**
 * Malformed event fixture missing required properties
 */
export const malformedEventFixture = {
  type: EventType.USER_LOGIN,
  // Missing userId (required)
  data: {
    // Missing required fields
    deviceType: 'web'
  }
  // Missing journey
};

/**
 * Event fixture with invalid userId format
 */
export const invalidUserIdEventFixture = {
  ...baseEventFixture,
  userId: 'not-a-valid-uuid'
};

/**
 * Event fixture with invalid event type
 */
export const invalidEventTypeFixture = {
  ...baseEventFixture,
  type: 'INVALID_EVENT_TYPE' as EventType
};

/**
 * Event fixture with mismatched journey and event type
 */
export const mismatchedJourneyEventFixture = {
  ...baseEventFixture,
  type: EventType.HEALTH_METRIC_RECORDED,
  journey: 'care' // Mismatched journey for the event type
};

/**
 * Event fixture with complex metadata
 */
export const complexMetadataEventFixture = {
  ...baseEventFixture,
  metadata: (() => {
    const metadata = new EventMetadataDto();
    metadata.eventId = '550e8400-e29b-41d4-a716-446655440003';
    metadata.correlationId = '550e8400-e29b-41d4-a716-446655440004';
    metadata.sessionId = '550e8400-e29b-41d4-a716-446655440005';
    metadata.requestId = '550e8400-e29b-41d4-a716-446655440006';
    metadata.timestamp = new Date();
    
    const origin = new EventOriginDto();
    origin.service = 'auth-service';
    origin.instance = 'auth-service-pod-1234';
    origin.component = 'login-processor';
    origin.context = 'user-initiated';
    metadata.origin = origin;
    
    const version = new EventVersionDto();
    version.major = '2';
    version.minor = '1';
    version.patch = '3';
    metadata.version = version;
    
    metadata.context = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'pt-BR'
    };
    
    return metadata;
  })()
};

// ===== HEALTH JOURNEY EVENT FIXTURES =====

/**
 * Health metric recorded event fixture
 */
export const healthMetricRecordedEventFixture = {
  type: EventType.HEALTH_METRIC_RECORDED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: new Date().toISOString(),
    source: 'manual'
  },
  journey: 'health'
};

/**
 * Health goal achieved event fixture
 */
export const healthGoalAchievedEventFixture = {
  type: EventType.HEALTH_GOAL_ACHIEVED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    goalId: '550e8400-e29b-41d4-a716-446655440010',
    goalType: 'STEPS_TARGET',
    targetValue: 10000,
    achievedValue: 10250,
    completedAt: new Date().toISOString()
  },
  journey: 'health'
};

/**
 * Health device connected event fixture
 */
export const healthDeviceConnectedEventFixture = {
  type: EventType.HEALTH_DEVICE_CONNECTED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    deviceId: '550e8400-e29b-41d4-a716-446655440011',
    deviceType: 'SMARTWATCH',
    connectionMethod: 'bluetooth',
    connectedAt: new Date().toISOString()
  },
  journey: 'health'
};

// ===== CARE JOURNEY EVENT FIXTURES =====

/**
 * Care appointment booked event fixture
 */
export const careAppointmentBookedEventFixture = {
  type: EventType.CARE_APPOINTMENT_BOOKED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    appointmentId: '550e8400-e29b-41d4-a716-446655440020',
    providerId: '550e8400-e29b-41d4-a716-446655440021',
    specialtyType: 'Cardiologia',
    appointmentType: 'in_person',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    bookedAt: new Date().toISOString()
  },
  journey: 'care'
};

/**
 * Care medication taken event fixture
 */
export const careMedicationTakenEventFixture = {
  type: EventType.CARE_MEDICATION_TAKEN,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    medicationId: '550e8400-e29b-41d4-a716-446655440022',
    medicationName: 'Atorvastatina',
    dosage: '20mg',
    takenAt: new Date().toISOString(),
    adherence: 'on_time'
  },
  journey: 'care'
};

// ===== PLAN JOURNEY EVENT FIXTURES =====

/**
 * Plan claim submitted event fixture
 */
export const planClaimSubmittedEventFixture = {
  type: EventType.PLAN_CLAIM_SUBMITTED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    claimId: '550e8400-e29b-41d4-a716-446655440030',
    claimType: 'medical',
    providerId: '550e8400-e29b-41d4-a716-446655440031',
    serviceDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    amount: 250.0,
    submittedAt: new Date().toISOString()
  },
  journey: 'plan'
};

/**
 * Plan benefit utilized event fixture
 */
export const planBenefitUtilizedEventFixture = {
  type: EventType.PLAN_BENEFIT_UTILIZED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    benefitId: '550e8400-e29b-41d4-a716-446655440032',
    benefitType: 'wellness',
    providerId: '550e8400-e29b-41d4-a716-446655440033',
    utilizationDate: new Date().toISOString(),
    savingsAmount: 75.0
  },
  journey: 'plan'
};

// ===== GAMIFICATION EVENT FIXTURES =====

/**
 * Gamification points earned event fixture
 */
export const gamificationPointsEarnedEventFixture = {
  type: EventType.GAMIFICATION_POINTS_EARNED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    sourceType: 'health',
    sourceId: '550e8400-e29b-41d4-a716-446655440040',
    points: 50,
    reason: 'Recorded health metrics for 7 consecutive days',
    earnedAt: new Date().toISOString()
  },
  journey: 'gamification'
};

/**
 * Gamification achievement unlocked event fixture
 */
export const gamificationAchievementUnlockedEventFixture = {
  type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  data: {
    achievementId: '550e8400-e29b-41d4-a716-446655440041',
    achievementType: 'health-check-streak',
    tier: 'silver',
    points: 100,
    unlockedAt: new Date().toISOString()
  },
  journey: 'gamification'
};

/**
 * Factory function to create a base event with custom properties
 * @param overrides Properties to override in the base event
 * @returns A new event object with the specified overrides
 */
export function createTestEvent(overrides: Partial<typeof baseEventFixture> = {}): typeof baseEventFixture {
  return {
    ...baseEventFixture,
    ...overrides,
    // Generate a new userId if not provided in overrides
    userId: overrides.userId || generateTestUUID(),
    // Deep merge data if provided in overrides
    data: overrides.data ? { ...baseEventFixture.data, ...overrides.data } : baseEventFixture.data
  };
}

/**
 * Factory function to create a health metric recorded event with custom properties
 * @param overrides Properties to override in the health metric event
 * @returns A new health metric event with the specified overrides
 */
export function createHealthMetricEvent(overrides: Partial<typeof healthMetricRecordedEventFixture> = {}): typeof healthMetricRecordedEventFixture {
  return {
    ...healthMetricRecordedEventFixture,
    ...overrides,
    // Generate a new userId if not provided in overrides
    userId: overrides.userId || generateTestUUID(),
    // Deep merge data if provided in overrides
    data: overrides.data ? { ...healthMetricRecordedEventFixture.data, ...overrides.data } : healthMetricRecordedEventFixture.data
  };
}

/**
 * Factory function to create an event with metadata
 * @param event Base event to add metadata to
 * @param metadataOverrides Properties to override in the metadata
 * @returns A new event with the specified metadata
 */
export function addMetadataToEvent<T extends Record<string, any>>(event: T, metadataOverrides: Partial<EventMetadataDto> = {}): T & { metadata: EventMetadataDto } {
  const service = event.journey ? `${event.journey}-service` : 'unknown-service';
  const metadata = createEventMetadata(service, {
    correlationId: generateTestUUID(),
    eventId: generateTestUUID(),
    timestamp: new Date(),
    ...metadataOverrides
  });
  
  return {
    ...event,
    metadata
  };
}

/**
 * Creates a batch of test events with sequential timestamps
 * @param count Number of events to create
 * @param baseEvent Base event template to use
 * @param intervalMs Time interval between events in milliseconds
 * @returns Array of test events
 */
export function createEventBatch(
  count: number,
  baseEvent: Record<string, any> = baseEventFixture,
  intervalMs: number = 1000
): Array<Record<string, any>> {
  const events = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now + (i * intervalMs));
    const event = {
      ...baseEvent,
      userId: generateTestUUID(),
      data: {
        ...baseEvent.data,
        timestamp: timestamp.toISOString()
      }
    };
    
    // Add metadata if the base event has it
    if (baseEvent.metadata) {
      event.metadata = {
        ...baseEvent.metadata,
        timestamp,
        eventId: generateTestUUID(),
        correlationId: baseEvent.metadata.correlationId || generateTestUUID()
      };
    }
    
    events.push(event);
  }
  
  return events;
}

/**
 * Creates an event with a specific journey and type
 * @param journey The journey for the event
 * @param eventType The type of event
 * @param data Custom data for the event
 * @returns A new event with the specified journey and type
 */
export function createJourneyEvent(
  journey: 'health' | 'care' | 'plan' | 'user' | 'gamification',
  eventType: EventType,
  data: Record<string, any> = {}
): Record<string, any> {
  // Select a base fixture based on the journey
  let baseFixture;
  switch (journey) {
    case 'health':
      baseFixture = healthMetricRecordedEventFixture;
      break;
    case 'care':
      baseFixture = careAppointmentBookedEventFixture;
      break;
    case 'plan':
      baseFixture = planClaimSubmittedEventFixture;
      break;
    case 'gamification':
      baseFixture = gamificationPointsEarnedEventFixture;
      break;
    case 'user':
    default:
      baseFixture = baseEventFixture;
      break;
  }
  
  return {
    ...baseFixture,
    type: eventType,
    journey,
    userId: generateTestUUID(),
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  };
}