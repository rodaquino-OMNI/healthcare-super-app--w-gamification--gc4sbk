/**
 * @file Invalid event mock data for testing validation and error handling.
 * 
 * This file provides a collection of intentionally malformed event objects that
 * violate validation rules. These mocks are used to test error handling, validation
 * logic, dead letter queues, and retry mechanisms throughout the event processing
 * pipeline.
 * 
 * Each mock is designed to test a specific validation failure scenario, such as
 * missing required fields, incorrect data types, or invalid values. The mocks
 * cover all three journeys (health, care, plan) to ensure comprehensive test
 * coverage across the entire system.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventType, EventJourney } from '../../../../../../../backend/packages/interfaces/gamification/events';

/**
 * Base event with all required fields for reference.
 * This is a valid event structure that can be modified to create invalid events.
 */
const validBaseEvent = {
  eventId: uuidv4(),
  type: EventType.HEALTH_METRIC_RECORDED,
  userId: uuidv4(),
  journey: EventJourney.HEALTH,
  payload: {
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'test'
    }
  },
  version: {
    major: 1,
    minor: 0,
    patch: 0
  },
  createdAt: new Date().toISOString(),
  source: 'test-service',
  correlationId: uuidv4()
};

// ===== MISSING REQUIRED FIELDS =====

/**
 * Collection of events with missing required fields.
 * These events should fail validation because they're missing fields that are
 * required by the event schema.
 */
export const missingRequiredFieldEvents = {
  /**
   * Event missing the eventId field.
   * Should fail validation with a "required" constraint violation.
   */
  missingEventId: (() => {
    const event = { ...validBaseEvent };
    delete event.eventId;
    return event;
  })(),

  /**
   * Event missing the type field.
   * Should fail validation with a "required" constraint violation.
   */
  missingType: (() => {
    const event = { ...validBaseEvent };
    delete event.type;
    return event;
  })(),

  /**
   * Event missing the userId field.
   * Should fail validation with a "required" constraint violation.
   */
  missingUserId: (() => {
    const event = { ...validBaseEvent };
    delete event.userId;
    return event;
  })(),

  /**
   * Event missing the journey field.
   * Should fail validation with a "required" constraint violation.
   */
  missingJourney: (() => {
    const event = { ...validBaseEvent };
    delete event.journey;
    return event;
  })(),

  /**
   * Event missing the payload field.
   * Should fail validation with a "required" constraint violation.
   */
  missingPayload: (() => {
    const event = { ...validBaseEvent };
    delete event.payload;
    return event;
  })(),

  /**
   * Event missing the version field.
   * Should fail validation with a "required" constraint violation.
   */
  missingVersion: (() => {
    const event = { ...validBaseEvent };
    delete event.version;
    return event;
  })(),

  /**
   * Event missing the timestamp field in the payload.
   * Should fail validation with a "required" constraint violation.
   */
  missingTimestamp: (() => {
    const event = { ...validBaseEvent };
    delete event.payload.timestamp;
    return event;
  })(),

  /**
   * Event with empty payload object.
   * Should fail validation because payload requires at least a timestamp.
   */
  emptyPayload: (() => {
    const event = { ...validBaseEvent };
    event.payload = {};
    return event;
  })(),

  /**
   * Health metric event missing required metric type.
   * Should fail validation with a journey-specific constraint violation.
   */
  missingMetricType: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.HEALTH_METRIC_RECORDED;
    event.payload = {
      timestamp: new Date().toISOString(),
      value: 75,
      unit: 'bpm',
      source: 'manual'
      // Missing metricType
    };
    return event;
  })(),

  /**
   * Appointment event missing required appointmentId.
   * Should fail validation with a journey-specific constraint violation.
   */
  missingAppointmentId: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.APPOINTMENT_BOOKED;
    event.journey = EventJourney.CARE;
    event.payload = {
      timestamp: new Date().toISOString(),
      providerId: uuidv4(),
      // Missing appointmentId
    };
    return event;
  })(),

  /**
   * Claim event missing required amount.
   * Should fail validation with a journey-specific constraint violation.
   */
  missingClaimAmount: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.CLAIM_SUBMITTED;
    event.journey = EventJourney.PLAN;
    event.payload = {
      timestamp: new Date().toISOString(),
      claimId: uuidv4(),
      claimType: 'Consulta Médica',
      // Missing amount
    };
    return event;
  })()
};

// ===== INCORRECT DATA TYPES =====

/**
 * Collection of events with incorrect data types.
 * These events should fail validation because they contain fields with
 * incorrect data types (e.g., string instead of number).
 */
export const incorrectDataTypeEvents = {
  /**
   * Event with non-string eventId.
   * Should fail validation with a "string" constraint violation.
   */
  nonStringEventId: (() => {
    const event = { ...validBaseEvent };
    event.eventId = 12345 as any;
    return event;
  })(),

  /**
   * Event with non-string userId.
   * Should fail validation with a "string" constraint violation.
   */
  nonStringUserId: (() => {
    const event = { ...validBaseEvent };
    event.userId = 12345 as any;
    return event;
  })(),

  /**
   * Event with non-object payload.
   * Should fail validation with an "object" constraint violation.
   */
  nonObjectPayload: (() => {
    const event = { ...validBaseEvent };
    event.payload = 'invalid payload' as any;
    return event;
  })(),

  /**
   * Event with non-object version.
   * Should fail validation with an "object" constraint violation.
   */
  nonObjectVersion: (() => {
    const event = { ...validBaseEvent };
    event.version = '1.0.0' as any;
    return event;
  })(),

  /**
   * Event with non-string timestamp.
   * Should fail validation with a "string" constraint violation.
   */
  nonStringTimestamp: (() => {
    const event = { ...validBaseEvent };
    event.payload.timestamp = 12345 as any;
    return event;
  })(),

  /**
   * Health metric event with non-numeric value.
   * Should fail validation with a "number" constraint violation.
   */
  nonNumericMetricValue: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.HEALTH_METRIC_RECORDED;
    event.payload = {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 'seventy-five' as any, // Should be a number
      unit: 'bpm',
      source: 'manual'
    };
    return event;
  })(),

  /**
   * Appointment event with non-string providerId.
   * Should fail validation with a "string" constraint violation.
   */
  nonStringProviderId: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.APPOINTMENT_BOOKED;
    event.journey = EventJourney.CARE;
    event.payload = {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      providerId: 12345 as any, // Should be a string (UUID)
    };
    return event;
  })(),

  /**
   * Claim event with non-numeric amount.
   * Should fail validation with a "number" constraint violation.
   */
  nonNumericClaimAmount: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.CLAIM_SUBMITTED;
    event.journey = EventJourney.PLAN;
    event.payload = {
      timestamp: new Date().toISOString(),
      claimId: uuidv4(),
      claimType: 'Consulta Médica',
      amount: 'one-hundred-fifty' as any, // Should be a number
    };
    return event;
  })(),

  /**
   * Event with non-numeric version fields.
   * Should fail validation with a "number" constraint violation.
   */
  nonNumericVersionFields: (() => {
    const event = { ...validBaseEvent };
    event.version = {
      major: '1' as any, // Should be a number
      minor: '0' as any, // Should be a number
      patch: '0' as any, // Should be a number
    };
    return event;
  })()
};

// ===== INVALID VALUES =====

/**
 * Collection of events with invalid values.
 * These events should fail validation because they contain values that
 * don't meet specific validation criteria (e.g., out of range, malformed UUID).
 */
export const invalidValueEvents = {
  /**
   * Event with invalid UUID format for eventId.
   * Should fail validation with a "uuid" constraint violation.
   */
  invalidEventIdFormat: (() => {
    const event = { ...validBaseEvent };
    event.eventId = 'not-a-valid-uuid';
    return event;
  })(),

  /**
   * Event with invalid UUID format for userId.
   * Should fail validation with a "uuid" constraint violation.
   */
  invalidUserIdFormat: (() => {
    const event = { ...validBaseEvent };
    event.userId = 'not-a-valid-uuid';
    return event;
  })(),

  /**
   * Event with invalid timestamp format.
   * Should fail validation with a "isDateString" or similar constraint violation.
   */
  invalidTimestampFormat: (() => {
    const event = { ...validBaseEvent };
    event.payload.timestamp = 'not-a-valid-timestamp';
    return event;
  })(),

  /**
   * Event with invalid createdAt format.
   * Should fail validation with a "isDateString" or similar constraint violation.
   */
  invalidCreatedAtFormat: (() => {
    const event = { ...validBaseEvent };
    event.createdAt = 'not-a-valid-timestamp';
    return event;
  })(),

  /**
   * Event with negative version numbers.
   * Should fail validation with a "min" constraint violation.
   */
  negativeVersionNumbers: (() => {
    const event = { ...validBaseEvent };
    event.version = {
      major: -1, // Should be >= 0
      minor: -1, // Should be >= 0
      patch: -1, // Should be >= 0
    };
    return event;
  })(),

  /**
   * Health metric event with physiologically impossible value.
   * Should fail validation with a "max" constraint violation.
   */
  impossibleHeartRateValue: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.HEALTH_METRIC_RECORDED;
    event.payload = {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 500, // Impossible heart rate
      unit: 'bpm',
      source: 'manual'
    };
    return event;
  })(),

  /**
   * Health metric event with negative value.
   * Should fail validation with a "min" constraint violation.
   */
  negativeMetricValue: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.HEALTH_METRIC_RECORDED;
    event.payload = {
      timestamp: new Date().toISOString(),
      metricType: 'STEPS',
      value: -1000, // Negative steps
      unit: 'steps',
      source: 'manual'
    };
    return event;
  })(),

  /**
   * Claim event with negative amount.
   * Should fail validation with a "min" constraint violation.
   */
  negativeClaimAmount: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.CLAIM_SUBMITTED;
    event.journey = EventJourney.PLAN;
    event.payload = {
      timestamp: new Date().toISOString(),
      claimId: uuidv4(),
      claimType: 'Consulta Médica',
      amount: -150.00, // Negative amount
    };
    return event;
  })(),

  /**
   * Appointment event with past appointment date.
   * Should fail validation with a "isAfter" constraint violation.
   */
  pastAppointmentDate: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.APPOINTMENT_BOOKED;
    event.journey = EventJourney.CARE;
    event.payload = {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      providerId: uuidv4(),
      scheduledAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    };
    return event;
  })()
};

// ===== INVALID JOURNEY VALUES =====

/**
 * Collection of events with invalid journey values.
 * These events should fail validation because they contain journey values
 * that don't match the event type or are invalid.
 */
export const invalidJourneyEvents = {
  /**
   * Event with invalid journey value.
   * Should fail validation with an "enum" constraint violation.
   */
  invalidJourneyValue: (() => {
    const event = { ...validBaseEvent };
    event.journey = 'invalid-journey' as any;
    return event;
  })(),

  /**
   * Health event with mismatched journey.
   * Should fail validation with a journey-type mismatch constraint violation.
   */
  healthEventWithCareJourney: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.HEALTH_METRIC_RECORDED;
    event.journey = EventJourney.CARE; // Mismatch
    event.payload = {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      source: 'manual'
    };
    return event;
  })(),

  /**
   * Care event with mismatched journey.
   * Should fail validation with a journey-type mismatch constraint violation.
   */
  careEventWithPlanJourney: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.APPOINTMENT_BOOKED;
    event.journey = EventJourney.PLAN; // Mismatch
    event.payload = {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      providerId: uuidv4(),
    };
    return event;
  })(),

  /**
   * Plan event with mismatched journey.
   * Should fail validation with a journey-type mismatch constraint violation.
   */
  planEventWithHealthJourney: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.CLAIM_SUBMITTED;
    event.journey = EventJourney.HEALTH; // Mismatch
    event.payload = {
      timestamp: new Date().toISOString(),
      claimId: uuidv4(),
      claimType: 'Consulta Médica',
      amount: 150.00,
    };
    return event;
  })()
};

// ===== INVALID EVENT TYPES =====

/**
 * Collection of events with invalid event types.
 * These events should fail validation because they contain event types
 * that don't exist or don't match the payload structure.
 */
export const invalidEventTypeEvents = {
  /**
   * Event with non-existent event type.
   * Should fail validation with an "enum" constraint violation.
   */
  nonExistentEventType: (() => {
    const event = { ...validBaseEvent };
    event.type = 'NON_EXISTENT_EVENT_TYPE' as any;
    return event;
  })(),

  /**
   * Event with mismatched event type and payload.
   * Should fail validation with a type-payload mismatch constraint violation.
   */
  mismatchedTypeAndPayload: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.APPOINTMENT_BOOKED;
    event.journey = EventJourney.CARE;
    // Payload is for a health metric, not an appointment
    event.payload = {
      timestamp: new Date().toISOString(),
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      source: 'manual'
    };
    return event;
  })()
};

// ===== MALFORMED PAYLOADS =====

/**
 * Collection of events with malformed payloads.
 * These events should fail validation because their payloads don't match
 * the expected structure for the event type.
 */
export const malformedPayloadEvents = {
  /**
   * Health metric event with malformed blood pressure value.
   * Should fail validation because blood pressure requires systolic and diastolic values.
   */
  malformedBloodPressure: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.HEALTH_METRIC_RECORDED;
    event.payload = {
      timestamp: new Date().toISOString(),
      metricType: 'BLOOD_PRESSURE',
      value: 120, // Should be an object with systolic and diastolic
      unit: 'mmHg',
      source: 'manual'
    };
    return event;
  })(),

  /**
   * Appointment event with malformed location.
   * Should fail validation because location requires specific fields.
   */
  malformedAppointmentLocation: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.APPOINTMENT_BOOKED;
    event.journey = EventJourney.CARE;
    event.payload = {
      timestamp: new Date().toISOString(),
      appointmentId: uuidv4(),
      providerId: uuidv4(),
      location: 'São Paulo', // Should be an object with address fields
    };
    return event;
  })(),

  /**
   * Claim event with malformed documents array.
   * Should fail validation because documents should be an array of objects with specific fields.
   */
  malformedClaimDocuments: (() => {
    const event = { ...validBaseEvent };
    event.type = EventType.CLAIM_SUBMITTED;
    event.journey = EventJourney.PLAN;
    event.payload = {
      timestamp: new Date().toISOString(),
      claimId: uuidv4(),
      claimType: 'Consulta Médica',
      amount: 150.00,
      documents: ['receipt.pdf', 'invoice.pdf'], // Should be array of objects with id, type, url
    };
    return event;
  })()
};

// ===== COMBINED INVALID EVENTS =====

/**
 * Combined collection of all invalid events for easy import.
 */
export const invalidEvents = {
  ...missingRequiredFieldEvents,
  ...incorrectDataTypeEvents,
  ...invalidValueEvents,
  ...invalidJourneyEvents,
  ...invalidEventTypeEvents,
  ...malformedPayloadEvents
};

/**
 * Collection of events with multiple validation errors.
 * These events should fail validation with multiple constraint violations.
 */
export const multipleErrorEvents = {
  /**
   * Event with multiple missing fields.
   * Should fail validation with multiple "required" constraint violations.
   */
  multipleMissingFields: (() => {
    const event = { ...validBaseEvent };
    delete event.eventId;
    delete event.userId;
    delete event.payload.timestamp;
    return event;
  })(),

  /**
   * Event with multiple invalid values.
   * Should fail validation with multiple constraint violations.
   */
  multipleInvalidValues: (() => {
    const event = { ...validBaseEvent };
    event.userId = 'not-a-valid-uuid';
    event.journey = 'invalid-journey' as any;
    event.payload.timestamp = 'not-a-valid-timestamp';
    return event;
  })(),

  /**
   * Event with completely invalid structure.
   * Should fail validation with numerous constraint violations.
   */
  completelyInvalidEvent: (() => {
    return {
      type: 123, // Wrong type
      user: 'not-a-valid-uuid', // Wrong field name
      data: 'not-an-object', // Wrong field name and type
      timestamp: new Date() // Wrong field location and type
    };
  })()
};

/**
 * Collection of events for testing dead letter queue functionality.
 * These events represent different failure scenarios that should trigger
 * the dead letter queue mechanism.
 */
export const deadLetterQueueEvents = {
  /**
   * Event with validation errors that should be sent to DLQ.
   */
  validationFailure: invalidEvents.missingEventId,

  /**
   * Event with processing errors that should be sent to DLQ after retries.
   */
  processingFailure: (() => {
    const event = { ...validBaseEvent };
    // This is a valid event structure, but we'll simulate a processing failure
    // by adding a special flag that test processors can check for
    event.payload.metadata = {
      ...event.payload.metadata,
      simulateProcessingFailure: true
    };
    return event;
  })(),

  /**
   * Event with serialization errors that should be sent to DLQ.
   */
  serializationFailure: (() => {
    const event = { ...validBaseEvent };
    // Create a circular reference that can't be serialized to JSON
    const circular: any = {};
    circular.self = circular;
    event.payload.metadata = {
      ...event.payload.metadata,
      circular
    };
    return event;
  })()
};

/**
 * Collection of events for testing retry mechanisms.
 * These events represent different scenarios that should trigger
 * retry attempts before being sent to the dead letter queue.
 */
export const retryEvents = {
  /**
   * Event that should be retried due to temporary validation failure.
   */
  temporaryValidationFailure: (() => {
    const event = { ...validBaseEvent };
    event.payload.metadata = {
      ...event.payload.metadata,
      simulateTemporaryValidationFailure: true,
      retryCount: 0,
      maxRetries: 3
    };
    return event;
  })(),

  /**
   * Event that should be retried due to temporary processing failure.
   */
  temporaryProcessingFailure: (() => {
    const event = { ...validBaseEvent };
    event.payload.metadata = {
      ...event.payload.metadata,
      simulateTemporaryProcessingFailure: true,
      retryCount: 0,
      maxRetries: 3
    };
    return event;
  })(),

  /**
   * Event that should be retried with exponential backoff.
   */
  exponentialBackoffRetry: (() => {
    const event = { ...validBaseEvent };
    event.payload.metadata = {
      ...event.payload.metadata,
      simulateExponentialBackoff: true,
      retryCount: 0,
      maxRetries: 5
    };
    return event;
  })()
};

/**
 * Collection of events for testing monitoring and alerting.
 * These events represent different scenarios that should trigger
 * monitoring alerts or be logged for audit purposes.
 */
export const monitoringEvents = {
  /**
   * Event that should trigger a high-priority alert.
   */
  highPriorityAlert: (() => {
    const event = { ...validBaseEvent };
    event.payload.metadata = {
      ...event.payload.metadata,
      priority: 'high',
      alertThreshold: true
    };
    return event;
  })(),

  /**
   * Event that should be logged for audit purposes.
   */
  auditLogEvent: (() => {
    const event = { ...validBaseEvent };
    event.payload.metadata = {
      ...event.payload.metadata,
      auditRequired: true,
      securityRelevant: true
    };
    return event;
  })(),

  /**
   * Event that should trigger rate limiting.
   */
  rateLimitEvent: (() => {
    const event = { ...validBaseEvent };
    event.payload.metadata = {
      ...event.payload.metadata,
      highFrequency: true,
      burstProtection: true
    };
    return event;
  })()
};