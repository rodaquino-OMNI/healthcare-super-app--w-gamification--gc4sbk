/**
 * @file event-validators.ts
 * @description Provides validation utilities for testing event schema compliance, verifying required fields,
 * type-checking event data, and ensuring event integrity. This utility simplifies testing of event schema
 * validation with functions to validate events against expected formats, check for required properties,
 * and verify journey-specific event structures.
 */

import { BaseEvent, EventMetadata, isBaseEvent } from '../../src/interfaces/base-event.interface';
import {
  JourneyType,
  IJourneyEvent,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  HealthEventType,
  CareEventType,
  PlanEventType,
  isHealthEvent,
  isCareEvent,
  isPlanEvent,
} from '../../src/interfaces/journey-events.interface';
import { ValidationResult, ValidationError } from '../../src/interfaces/event-validation.interface';

/**
 * Validates that an event has all required base fields
 * @param event The event to validate
 * @returns Validation result with success flag and any errors
 */
export function validateBaseEventStructure(event: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!event) {
    return {
      isValid: false,
      errors: [{ code: 'EVENT_NULL', message: 'Event is null or undefined' }],
    };
  }

  if (typeof event !== 'object') {
    return {
      isValid: false,
      errors: [{ code: 'EVENT_NOT_OBJECT', message: 'Event is not an object' }],
    };
  }

  // Check required fields
  const requiredFields = ['eventId', 'type', 'timestamp', 'version', 'source', 'payload'];
  for (const field of requiredFields) {
    if (event[field] === undefined) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Missing required field: ${field}`,
        path: field,
      });
    }
  }

  // Validate field types
  if (event.eventId !== undefined && typeof event.eventId !== 'string') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'eventId must be a string',
      path: 'eventId',
    });
  }

  if (event.type !== undefined && typeof event.type !== 'string') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'type must be a string',
      path: 'type',
    });
  }

  if (event.timestamp !== undefined && typeof event.timestamp !== 'string') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'timestamp must be a string',
      path: 'timestamp',
    });
  }

  if (event.version !== undefined && typeof event.version !== 'string') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'version must be a string',
      path: 'version',
    });
  }

  if (event.source !== undefined && typeof event.source !== 'string') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'source must be a string',
      path: 'source',
    });
  }

  if (event.payload !== undefined && typeof event.payload !== 'object') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'payload must be an object',
      path: 'payload',
    });
  }

  if (event.userId !== undefined && typeof event.userId !== 'string') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'userId must be a string',
      path: 'userId',
    });
  }

  if (event.journey !== undefined && !Object.values(JourneyType).includes(event.journey)) {
    errors.push({
      code: 'INVALID_JOURNEY_TYPE',
      message: `journey must be one of: ${Object.values(JourneyType).join(', ')}`,
      path: 'journey',
    });
  }

  if (event.metadata !== undefined && typeof event.metadata !== 'object') {
    errors.push({
      code: 'INVALID_FIELD_TYPE',
      message: 'metadata must be an object',
      path: 'metadata',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a timestamp is in ISO format and within a valid range
 * @param timestamp The timestamp to validate
 * @param options Options for validation (maxAge, minAge)
 * @returns Validation result with success flag and any errors
 */
export function validateTimestamp(
  timestamp: string,
  options: { maxAge?: number; minAge?: number } = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!timestamp) {
    return {
      isValid: false,
      errors: [{ code: 'TIMESTAMP_NULL', message: 'Timestamp is null or undefined' }],
    };
  }

  // Check if timestamp is a valid ISO string
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    errors.push({
      code: 'INVALID_TIMESTAMP_FORMAT',
      message: 'Timestamp is not a valid ISO date string',
      path: 'timestamp',
    });
  } else {
    // Check if timestamp is within valid range
    const now = new Date();
    const timestampDate = new Date(timestamp);

    if (options.maxAge !== undefined) {
      const minDate = new Date(now.getTime() - options.maxAge);
      if (timestampDate < minDate) {
        errors.push({
          code: 'TIMESTAMP_TOO_OLD',
          message: `Timestamp is older than ${options.maxAge}ms`,
          path: 'timestamp',
          context: { maxAge: options.maxAge, timestamp, minDate: minDate.toISOString() },
        });
      }
    }

    if (options.minAge !== undefined) {
      const maxDate = new Date(now.getTime() - options.minAge);
      if (timestampDate > maxDate) {
        errors.push({
          code: 'TIMESTAMP_TOO_NEW',
          message: `Timestamp is newer than ${options.minAge}ms`,
          path: 'timestamp',
          context: { minAge: options.minAge, timestamp, maxDate: maxDate.toISOString() },
        });
      }
    }

    // Check if timestamp is in the future
    if (timestampDate > now) {
      errors.push({
        code: 'TIMESTAMP_IN_FUTURE',
        message: 'Timestamp is in the future',
        path: 'timestamp',
        context: { timestamp, now: now.toISOString() },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that an event has a valid version string (semver format)
 * @param version The version string to validate
 * @returns Validation result with success flag and any errors
 */
export function validateEventVersion(version: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!version) {
    return {
      isValid: false,
      errors: [{ code: 'VERSION_NULL', message: 'Version is null or undefined' }],
    };
  }

  // Check if version follows semver format (major.minor.patch)
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
  if (!semverRegex.test(version)) {
    errors.push({
      code: 'INVALID_VERSION_FORMAT',
      message: 'Version must follow semantic versioning format (major.minor.patch)',
      path: 'version',
      context: { version, expectedFormat: 'major.minor.patch' },
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that an event has a valid event type for its journey
 * @param event The event to validate
 * @returns Validation result with success flag and any errors
 */
export function validateEventType(event: BaseEvent): ValidationResult {
  const errors: ValidationError[] = [];

  if (!event.type) {
    return {
      isValid: false,
      errors: [{ code: 'EVENT_TYPE_NULL', message: 'Event type is null or undefined' }],
    };
  }

  // If journey is specified, validate that the event type is valid for that journey
  if (event.journey) {
    let validTypes: string[] = [];

    switch (event.journey) {
      case JourneyType.HEALTH:
        validTypes = Object.values(HealthEventType);
        break;
      case JourneyType.CARE:
        validTypes = Object.values(CareEventType);
        break;
      case JourneyType.PLAN:
        validTypes = Object.values(PlanEventType);
        break;
      default:
        errors.push({
          code: 'INVALID_JOURNEY_TYPE',
          message: `Unknown journey type: ${event.journey}`,
          path: 'journey',
        });
        return { isValid: false, errors };
    }

    if (!validTypes.includes(event.type)) {
      errors.push({
        code: 'INVALID_EVENT_TYPE_FOR_JOURNEY',
        message: `Event type '${event.type}' is not valid for journey '${event.journey}'`,
        path: 'type',
        context: { journey: event.journey, validTypes },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a health journey event
 * @param event The health event to validate
 * @returns Validation result with success flag and any errors
 */
export function validateHealthEvent(event: any): ValidationResult {
  const errors: ValidationError[] = [];

  // First validate base structure
  const baseValidation = validateBaseEventStructure(event);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Check journey type
  if (event.journey !== JourneyType.HEALTH) {
    errors.push({
      code: 'INVALID_JOURNEY_TYPE',
      message: `Expected journey type '${JourneyType.HEALTH}', got '${event.journey}'`,
      path: 'journey',
    });
  }

  // Validate event type
  const eventTypeValidation = validateEventType(event as BaseEvent);
  if (!eventTypeValidation.isValid) {
    errors.push(...eventTypeValidation.errors);
  }

  // Validate payload based on event type
  if (event.type && event.payload) {
    switch (event.type) {
      case HealthEventType.METRIC_RECORDED:
        if (!event.payload.metric || !event.payload.metricType || event.payload.value === undefined) {
          errors.push({
            code: 'INVALID_HEALTH_METRIC_PAYLOAD',
            message: 'Health metric event must include metric, metricType, and value',
            path: 'payload',
          });
        }
        break;

      case HealthEventType.GOAL_CREATED:
      case HealthEventType.GOAL_UPDATED:
      case HealthEventType.GOAL_ACHIEVED:
        if (!event.payload.goal || !event.payload.goalType) {
          errors.push({
            code: 'INVALID_HEALTH_GOAL_PAYLOAD',
            message: 'Health goal event must include goal and goalType',
            path: 'payload',
          });
        }
        break;

      case HealthEventType.DEVICE_CONNECTED:
      case HealthEventType.DEVICE_SYNCED:
        if (!event.payload.deviceConnection || !event.payload.deviceId || !event.payload.deviceType) {
          errors.push({
            code: 'INVALID_HEALTH_DEVICE_PAYLOAD',
            message: 'Health device event must include deviceConnection, deviceId, and deviceType',
            path: 'payload',
          });
        }
        break;

      // Add validation for other health event types as needed
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a care journey event
 * @param event The care event to validate
 * @returns Validation result with success flag and any errors
 */
export function validateCareEvent(event: any): ValidationResult {
  const errors: ValidationError[] = [];

  // First validate base structure
  const baseValidation = validateBaseEventStructure(event);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Check journey type
  if (event.journey !== JourneyType.CARE) {
    errors.push({
      code: 'INVALID_JOURNEY_TYPE',
      message: `Expected journey type '${JourneyType.CARE}', got '${event.journey}'`,
      path: 'journey',
    });
  }

  // Validate event type
  const eventTypeValidation = validateEventType(event as BaseEvent);
  if (!eventTypeValidation.isValid) {
    errors.push(...eventTypeValidation.errors);
  }

  // Validate payload based on event type
  if (event.type && event.payload) {
    switch (event.type) {
      case CareEventType.APPOINTMENT_BOOKED:
      case CareEventType.APPOINTMENT_COMPLETED:
        if (!event.payload.appointment || !event.payload.appointmentType || !event.payload.providerId) {
          errors.push({
            code: 'INVALID_CARE_APPOINTMENT_PAYLOAD',
            message: 'Care appointment event must include appointment, appointmentType, and providerId',
            path: 'payload',
          });
        }
        break;

      case CareEventType.MEDICATION_ADDED:
      case CareEventType.MEDICATION_TAKEN:
      case CareEventType.MEDICATION_ADHERENCE_STREAK:
        if (!event.payload.medicationId || !event.payload.medicationName) {
          errors.push({
            code: 'INVALID_CARE_MEDICATION_PAYLOAD',
            message: 'Care medication event must include medicationId and medicationName',
            path: 'payload',
          });
        }
        break;

      case CareEventType.TELEMEDICINE_SESSION_STARTED:
      case CareEventType.TELEMEDICINE_SESSION_COMPLETED:
        if (!event.payload.session || !event.payload.sessionId || !event.payload.providerId) {
          errors.push({
            code: 'INVALID_CARE_TELEMEDICINE_PAYLOAD',
            message: 'Care telemedicine event must include session, sessionId, and providerId',
            path: 'payload',
          });
        }
        break;

      // Add validation for other care event types as needed
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a plan journey event
 * @param event The plan event to validate
 * @returns Validation result with success flag and any errors
 */
export function validatePlanEvent(event: any): ValidationResult {
  const errors: ValidationError[] = [];

  // First validate base structure
  const baseValidation = validateBaseEventStructure(event);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Check journey type
  if (event.journey !== JourneyType.PLAN) {
    errors.push({
      code: 'INVALID_JOURNEY_TYPE',
      message: `Expected journey type '${JourneyType.PLAN}', got '${event.journey}'`,
      path: 'journey',
    });
  }

  // Validate event type
  const eventTypeValidation = validateEventType(event as BaseEvent);
  if (!eventTypeValidation.isValid) {
    errors.push(...eventTypeValidation.errors);
  }

  // Validate payload based on event type
  if (event.type && event.payload) {
    switch (event.type) {
      case PlanEventType.CLAIM_SUBMITTED:
        if (!event.payload.claim || !event.payload.submissionDate || event.payload.amount === undefined) {
          errors.push({
            code: 'INVALID_PLAN_CLAIM_PAYLOAD',
            message: 'Plan claim event must include claim, submissionDate, and amount',
            path: 'payload',
          });
        }
        break;

      case PlanEventType.BENEFIT_UTILIZED:
        if (!event.payload.benefit || !event.payload.utilizationDate) {
          errors.push({
            code: 'INVALID_PLAN_BENEFIT_PAYLOAD',
            message: 'Plan benefit event must include benefit and utilizationDate',
            path: 'payload',
          });
        }
        break;

      case PlanEventType.PLAN_SELECTED:
      case PlanEventType.PLAN_RENEWED:
        if (!event.payload.plan || !event.payload.planId || !event.payload.planName) {
          errors.push({
            code: 'INVALID_PLAN_SELECTION_PAYLOAD',
            message: 'Plan selection event must include plan, planId, and planName',
            path: 'payload',
          });
        }
        break;

      // Add validation for other plan event types as needed
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates any journey event based on its journey type
 * @param event The journey event to validate
 * @returns Validation result with success flag and any errors
 */
export function validateJourneyEvent(event: any): ValidationResult {
  // First validate base structure
  const baseValidation = validateBaseEventStructure(event);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Validate based on journey type
  if (event.journey) {
    switch (event.journey) {
      case JourneyType.HEALTH:
        return validateHealthEvent(event);
      case JourneyType.CARE:
        return validateCareEvent(event);
      case JourneyType.PLAN:
        return validatePlanEvent(event);
      default:
        return {
          isValid: false,
          errors: [
            {
              code: 'INVALID_JOURNEY_TYPE',
              message: `Unknown journey type: ${event.journey}`,
              path: 'journey',
            },
          ],
        };
    }
  }

  // If no journey type is specified, just validate as a base event
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validates that events are in chronological order
 * @param events Array of events to validate
 * @returns Validation result with success flag and any errors
 */
export function validateEventSequence(events: BaseEvent[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!events || events.length < 2) {
    return {
      isValid: true,
      errors: [],
    };
  }

  for (let i = 1; i < events.length; i++) {
    const prevEvent = events[i - 1];
    const currEvent = events[i];

    const prevTime = new Date(prevEvent.timestamp).getTime();
    const currTime = new Date(currEvent.timestamp).getTime();

    if (isNaN(prevTime) || isNaN(currTime)) {
      errors.push({
        code: 'INVALID_TIMESTAMP_FORMAT',
        message: 'One or more events have invalid timestamp format',
        context: { prevTimestamp: prevEvent.timestamp, currTimestamp: currEvent.timestamp },
      });
      continue;
    }

    if (currTime < prevTime) {
      errors.push({
        code: 'EVENTS_OUT_OF_ORDER',
        message: 'Events are not in chronological order',
        context: {
          prevEvent: { id: prevEvent.eventId, time: prevEvent.timestamp },
          currEvent: { id: currEvent.eventId, time: currEvent.timestamp },
        },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates an invalid event by removing or corrupting required fields
 * @param baseEvent A valid base event to corrupt
 * @param invalidationType Type of invalidation to apply
 * @returns An invalid event for testing validation
 */
export function createInvalidEvent(
  baseEvent: BaseEvent,
  invalidationType: 'missing_field' | 'invalid_type' | 'invalid_journey' | 'invalid_timestamp' | 'invalid_version'
): any {
  const event = { ...baseEvent };

  switch (invalidationType) {
    case 'missing_field':
      // Remove a required field
      const fieldsToRemove = ['eventId', 'type', 'timestamp', 'version', 'source', 'payload'];
      const fieldToRemove = fieldsToRemove[Math.floor(Math.random() * fieldsToRemove.length)];
      delete event[fieldToRemove as keyof BaseEvent];
      break;

    case 'invalid_type':
      // Change a field to an invalid type
      const fieldsToInvalidate = [
        { field: 'eventId', value: 123 },
        { field: 'type', value: {} },
        { field: 'timestamp', value: true },
        { field: 'version', value: [] },
        { field: 'source', value: 456 },
        { field: 'payload', value: 'not an object' },
      ];
      const fieldToInvalidate =
        fieldsToInvalidate[Math.floor(Math.random() * fieldsToInvalidate.length)];
      (event as any)[fieldToInvalidate.field] = fieldToInvalidate.value;
      break;

    case 'invalid_journey':
      // Set an invalid journey type
      (event as any).journey = 'invalid_journey';
      break;

    case 'invalid_timestamp':
      // Set an invalid timestamp
      event.timestamp = 'not-a-timestamp';
      break;

    case 'invalid_version':
      // Set an invalid version
      event.version = 'not-semver';
      break;
  }

  return event;
}

/**
 * Creates a set of test events for a specific journey
 * @param journey The journey type
 * @param count Number of events to create
 * @param userId User ID for the events
 * @returns Array of test events
 */
export function createTestEvents(
  journey: JourneyType,
  count: number = 5,
  userId: string = 'test-user-id'
): BaseEvent[] {
  const events: BaseEvent[] = [];
  const now = new Date();

  let eventTypes: string[] = [];
  let source = '';

  switch (journey) {
    case JourneyType.HEALTH:
      eventTypes = Object.values(HealthEventType);
      source = 'health-service';
      break;
    case JourneyType.CARE:
      eventTypes = Object.values(CareEventType);
      source = 'care-service';
      break;
    case JourneyType.PLAN:
      eventTypes = Object.values(PlanEventType);
      source = 'plan-service';
      break;
  }

  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const timestamp = new Date(now.getTime() - i * 60000).toISOString(); // Events 1 minute apart

    let payload: Record<string, any> = {};

    // Create journey-specific payloads
    switch (journey) {
      case JourneyType.HEALTH:
        if (eventType === HealthEventType.METRIC_RECORDED) {
          payload = {
            metric: { id: `metric-${i}`, userId },
            metricType: 'HEART_RATE',
            value: 70 + Math.floor(Math.random() * 20),
            unit: 'bpm',
            timestamp,
          };
        } else if (eventType === HealthEventType.GOAL_ACHIEVED) {
          payload = {
            goal: { id: `goal-${i}`, userId, type: 'STEPS' },
            goalType: 'STEPS',
            achievedValue: 10000,
            targetValue: 10000,
            daysToAchieve: 7,
          };
        }
        break;

      case JourneyType.CARE:
        if (eventType === CareEventType.APPOINTMENT_BOOKED) {
          payload = {
            appointment: { id: `appointment-${i}`, userId },
            appointmentType: 'CONSULTATION',
            providerId: `provider-${i}`,
            scheduledDate: new Date(now.getTime() + 86400000).toISOString(), // Tomorrow
          };
        } else if (eventType === CareEventType.MEDICATION_TAKEN) {
          payload = {
            medicationId: `medication-${i}`,
            medicationName: 'Test Medication',
            takenDate: timestamp,
            takenOnTime: true,
            dosage: '10mg',
          };
        }
        break;

      case JourneyType.PLAN:
        if (eventType === PlanEventType.CLAIM_SUBMITTED) {
          payload = {
            claim: { id: `claim-${i}`, userId },
            submissionDate: timestamp,
            amount: 100 + Math.floor(Math.random() * 900),
            claimType: 'MEDICAL',
            hasDocuments: true,
            isComplete: true,
          };
        } else if (eventType === PlanEventType.BENEFIT_UTILIZED) {
          payload = {
            benefit: { id: `benefit-${i}`, userId },
            utilizationDate: timestamp,
            serviceProvider: 'Test Provider',
            amount: 50 + Math.floor(Math.random() * 200),
            isFirstUtilization: i === 0,
          };
        }
        break;
    }

    events.push({
      eventId: `event-${journey}-${i}`,
      type: eventType,
      timestamp,
      version: '1.0.0',
      source,
      journey,
      userId,
      payload,
      metadata: {
        correlationId: `corr-test-${i}`,
        priority: 'medium',
      },
    });
  }

  return events;
}

/**
 * Type guard to check if an object is a valid journey event
 * @param obj The object to check
 * @returns True if the object is a valid journey event, false otherwise
 */
export function isJourneyEvent(obj: any): obj is IJourneyEvent {
  return (
    isBaseEvent(obj) &&
    obj.journey !== undefined &&
    Object.values(JourneyType).includes(obj.journey as JourneyType)
  );
}

/**
 * Validates that an event's metadata is properly structured
 * @param metadata The metadata to validate
 * @returns Validation result with success flag and any errors
 */
export function validateEventMetadata(metadata: EventMetadata | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (!metadata) {
    return {
      isValid: true,
      errors: [],
    };
  }

  if (typeof metadata !== 'object') {
    return {
      isValid: false,
      errors: [{ code: 'METADATA_NOT_OBJECT', message: 'Metadata is not an object' }],
    };
  }

  // Validate correlation ID format if present
  if (metadata.correlationId !== undefined && typeof metadata.correlationId !== 'string') {
    errors.push({
      code: 'INVALID_CORRELATION_ID',
      message: 'correlationId must be a string',
      path: 'metadata.correlationId',
    });
  }

  // Validate trace ID format if present
  if (metadata.traceId !== undefined && typeof metadata.traceId !== 'string') {
    errors.push({
      code: 'INVALID_TRACE_ID',
      message: 'traceId must be a string',
      path: 'metadata.traceId',
    });
  }

  // Validate priority if present
  if (
    metadata.priority !== undefined &&
    !['high', 'medium', 'low'].includes(metadata.priority)
  ) {
    errors.push({
      code: 'INVALID_PRIORITY',
      message: "priority must be one of: 'high', 'medium', 'low'",
      path: 'metadata.priority',
    });
  }

  // Validate retry count if present
  if (metadata.retryCount !== undefined && typeof metadata.retryCount !== 'number') {
    errors.push({
      code: 'INVALID_RETRY_COUNT',
      message: 'retryCount must be a number',
      path: 'metadata.retryCount',
    });
  }

  // Validate original timestamp if present
  if (metadata.originalTimestamp !== undefined) {
    const timestampValidation = validateTimestamp(metadata.originalTimestamp);
    if (!timestampValidation.isValid) {
      errors.push({
        code: 'INVALID_ORIGINAL_TIMESTAMP',
        message: 'originalTimestamp is not a valid ISO date string',
        path: 'metadata.originalTimestamp',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that events with the same correlation ID form a valid sequence
 * @param events Array of events to validate
 * @returns Validation result with success flag and any errors
 */
export function validateCorrelatedEvents(events: BaseEvent[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!events || events.length === 0) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // Group events by correlation ID
  const eventsByCorrelationId: Record<string, BaseEvent[]> = {};

  for (const event of events) {
    const correlationId = event.metadata?.correlationId;
    if (correlationId) {
      if (!eventsByCorrelationId[correlationId]) {
        eventsByCorrelationId[correlationId] = [];
      }
      eventsByCorrelationId[correlationId].push(event);
    }
  }

  // Validate each group of correlated events
  for (const correlationId in eventsByCorrelationId) {
    const correlatedEvents = eventsByCorrelationId[correlationId];

    // Check if events are in chronological order
    const sequenceValidation = validateEventSequence(correlatedEvents);
    if (!sequenceValidation.isValid) {
      errors.push({
        code: 'INVALID_CORRELATED_SEQUENCE',
        message: `Events with correlation ID ${correlationId} are not in valid sequence`,
        context: { correlationId, errors: sequenceValidation.errors },
      });
    }

    // Check if all events have the same user ID (if present)
    const userIds = new Set(correlatedEvents.map((e) => e.userId).filter(Boolean));
    if (userIds.size > 1) {
      errors.push({
        code: 'INCONSISTENT_USER_ID',
        message: `Events with correlation ID ${correlationId} have inconsistent user IDs`,
        context: { correlationId, userIds: Array.from(userIds) },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that an event's version is compatible with a required version
 * @param eventVersion The event version to check
 * @param requiredVersion The required version
 * @returns Validation result with success flag and any errors
 */
export function validateVersionCompatibility(
  eventVersion: string,
  requiredVersion: string
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate both versions are in semver format
  const eventVersionValidation = validateEventVersion(eventVersion);
  if (!eventVersionValidation.isValid) {
    return eventVersionValidation;
  }

  const requiredVersionValidation = validateEventVersion(requiredVersion);
  if (!requiredVersionValidation.isValid) {
    return {
      isValid: false,
      errors: [
        {
          code: 'INVALID_REQUIRED_VERSION',
          message: 'Required version is not in valid semver format',
          context: { requiredVersion },
        },
      ],
    };
  }

  // Parse versions
  const [eventMajor, eventMinor, eventPatch] = eventVersion.split('.').map(Number);
  const [reqMajor, reqMinor, reqPatch] = requiredVersion.split('.').map(Number);

  // Check compatibility (major version must match, event minor/patch must be >= required)
  if (eventMajor !== reqMajor) {
    errors.push({
      code: 'INCOMPATIBLE_MAJOR_VERSION',
      message: `Event major version ${eventMajor} is not compatible with required version ${reqMajor}`,
      context: { eventVersion, requiredVersion },
    });
  } else if (eventMinor < reqMinor) {
    errors.push({
      code: 'INCOMPATIBLE_MINOR_VERSION',
      message: `Event minor version ${eventMinor} is less than required version ${reqMinor}`,
      context: { eventVersion, requiredVersion },
    });
  } else if (eventMinor === reqMinor && eventPatch < reqPatch) {
    errors.push({
      code: 'INCOMPATIBLE_PATCH_VERSION',
      message: `Event patch version ${eventPatch} is less than required version ${reqPatch}`,
      context: { eventVersion, requiredVersion },
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Exports all validation functions for use in tests
 */
export const eventValidators = {
  validateBaseEventStructure,
  validateTimestamp,
  validateEventVersion,
  validateEventType,
  validateHealthEvent,
  validateCareEvent,
  validatePlanEvent,
  validateJourneyEvent,
  validateEventSequence,
  validateEventMetadata,
  validateCorrelatedEvents,
  validateVersionCompatibility,
  createInvalidEvent,
  createTestEvents,
  isBaseEvent,
  isJourneyEvent,
  isHealthEvent,
  isCareEvent,
  isPlanEvent,
};

export default eventValidators;