/**
 * @file event-validators.ts
 * @description Provides validation utilities for testing event schema compliance, verifying required fields,
 * type-checking event data, and ensuring event integrity. This utility simplifies testing of event schema
 * validation with functions to validate events against expected formats, check for required properties,
 * and verify journey-specific event structures.
 */

import { BaseEvent, EventValidationResult, validateEvent } from '../../src/interfaces/base-event.interface';
import {
  JourneyType,
  HealthEventType,
  CareEventType,
  PlanEventType,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  isHealthEvent,
  isCareEvent,
  isPlanEvent
} from '../../src/interfaces/journey-events.interface';

/**
 * Options for event validation
 */
export interface EventValidationOptions {
  /**
   * Whether to validate event metadata
   * @default false
   */
  validateMetadata?: boolean;

  /**
   * Whether to validate event payload structure
   * @default true
   */
  validatePayload?: boolean;

  /**
   * Additional required fields beyond the standard ones
   */
  additionalRequiredFields?: string[];

  /**
   * Whether to validate event type against known types
   * @default true
   */
  validateEventType?: boolean;

  /**
   * Whether to validate event version format
   * @default true
   */
  validateVersion?: boolean;

  /**
   * Whether to validate timestamp format
   * @default true
   */
  validateTimestamp?: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_VALIDATION_OPTIONS: EventValidationOptions = {
  validateMetadata: false,
  validatePayload: true,
  validateEventType: true,
  validateVersion: true,
  validateTimestamp: true,
};

/**
 * Result of event validation with detailed information
 */
export interface DetailedEventValidationResult extends EventValidationResult {
  /**
   * Validation errors grouped by field
   */
  fieldErrors?: Record<string, string[]>;

  /**
   * Missing required fields
   */
  missingFields?: string[];

  /**
   * Fields with incorrect types
   */
  typeErrors?: Record<string, { expected: string; actual: string }>;

  /**
   * The event that was validated
   */
  event?: BaseEvent;
}

/**
 * Validates an event against the base event schema
 * 
 * @param event The event to validate
 * @param options Validation options
 * @returns Detailed validation result
 */
export function validateEventSchema(
  event: any,
  options: EventValidationOptions = {}
): DetailedEventValidationResult {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const result: DetailedEventValidationResult = {
    isValid: true,
    event,
  };

  // Check if the event is an object
  if (!event || typeof event !== 'object') {
    result.isValid = false;
    result.errors = ['Event is not an object'];
    return result;
  }

  const fieldErrors: Record<string, string[]> = {};
  const missingFields: string[] = [];
  const typeErrors: Record<string, { expected: string; actual: string }> = {};

  // Check required fields
  const requiredFields = ['eventId', 'type', 'timestamp', 'version', 'source', 'payload'];
  if (opts.additionalRequiredFields) {
    requiredFields.push(...opts.additionalRequiredFields);
  }

  for (const field of requiredFields) {
    if (event[field] === undefined) {
      missingFields.push(field);
      result.isValid = false;
    }
  }

  // Check field types
  const fieldTypes: Record<string, string> = {
    eventId: 'string',
    type: 'string',
    timestamp: 'string',
    version: 'string',
    source: 'string',
    payload: 'object',
    userId: 'string',
    journey: 'string',
    metadata: 'object',
  };

  for (const [field, expectedType] of Object.entries(fieldTypes)) {
    if (event[field] !== undefined && typeof event[field] !== expectedType) {
      typeErrors[field] = {
        expected: expectedType,
        actual: typeof event[field],
      };
      result.isValid = false;
    }
  }

  // Validate timestamp format if present and option is enabled
  if (opts.validateTimestamp && event.timestamp !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(event.timestamp)) {
      if (!fieldErrors.timestamp) {
        fieldErrors.timestamp = [];
      }
      fieldErrors.timestamp.push('Invalid ISO timestamp format');
      result.isValid = false;
    }
  }

  // Validate version format if present and option is enabled
  if (opts.validateVersion && event.version !== undefined) {
    if (!/^\d+\.\d+\.\d+$/.test(event.version)) {
      if (!fieldErrors.version) {
        fieldErrors.version = [];
      }
      fieldErrors.version.push('Invalid semantic version format (major.minor.patch)');
      result.isValid = false;
    }
  }

  // Validate event type if option is enabled
  if (opts.validateEventType && event.type !== undefined) {
    const validEventTypes = [
      ...Object.values(HealthEventType),
      ...Object.values(CareEventType),
      ...Object.values(PlanEventType),
    ];

    if (!validEventTypes.includes(event.type)) {
      if (!fieldErrors.type) {
        fieldErrors.type = [];
      }
      fieldErrors.type.push(`Unknown event type: ${event.type}`);
      result.isValid = false;
    }
  }

  // Validate payload if option is enabled
  if (opts.validatePayload && event.payload !== undefined) {
    if (typeof event.payload !== 'object' || event.payload === null) {
      if (!fieldErrors.payload) {
        fieldErrors.payload = [];
      }
      fieldErrors.payload.push('Payload must be an object');
      result.isValid = false;
    }
  }

  // Validate metadata if present and option is enabled
  if (opts.validateMetadata && event.metadata !== undefined) {
    if (typeof event.metadata !== 'object' || event.metadata === null) {
      if (!fieldErrors.metadata) {
        fieldErrors.metadata = [];
      }
      fieldErrors.metadata.push('Metadata must be an object');
      result.isValid = false;
    }
  }

  // Compile errors
  const errors: string[] = [];

  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  for (const [field, fieldTypeError] of Object.entries(typeErrors)) {
    errors.push(`Field ${field} has incorrect type: expected ${fieldTypeError.expected}, got ${fieldTypeError.actual}`);
  }

  for (const [field, fieldErrorMessages] of Object.entries(fieldErrors)) {
    for (const errorMessage of fieldErrorMessages) {
      errors.push(`Field ${field}: ${errorMessage}`);
    }
  }

  // Set result properties
  if (!result.isValid) {
    result.errors = errors;
    result.fieldErrors = Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
    result.missingFields = missingFields.length > 0 ? missingFields : undefined;
    result.typeErrors = Object.keys(typeErrors).length > 0 ? typeErrors : undefined;
  }

  return result;
}

/**
 * Validates a health event against the health event schema
 * 
 * @param event The health event to validate
 * @param options Validation options
 * @returns Detailed validation result
 */
export function validateHealthEvent(
  event: any,
  options: EventValidationOptions = {}
): DetailedEventValidationResult {
  // First validate against base schema
  const baseResult = validateEventSchema(event, options);
  if (!baseResult.isValid) {
    return baseResult;
  }

  const result: DetailedEventValidationResult = {
    isValid: true,
    event,
  };

  const fieldErrors: Record<string, string[]> = {};

  // Check if journey is HEALTH
  if (event.journey !== JourneyType.HEALTH) {
    result.isValid = false;
    if (!fieldErrors.journey) {
      fieldErrors.journey = [];
    }
    fieldErrors.journey.push(`Expected journey to be ${JourneyType.HEALTH}, got ${event.journey}`);
  }

  // Check if type is a valid health event type
  const validHealthEventTypes = Object.values(HealthEventType);
  if (!validHealthEventTypes.includes(event.type)) {
    result.isValid = false;
    if (!fieldErrors.type) {
      fieldErrors.type = [];
    }
    fieldErrors.type.push(`Invalid health event type: ${event.type}`);
  }

  // Validate payload based on event type
  if (options.validatePayload !== false && event.payload) {
    const payloadErrors = validateHealthEventPayload(event.type, event.payload);
    if (payloadErrors.length > 0) {
      result.isValid = false;
      fieldErrors.payload = payloadErrors;
    }
  }

  // Compile errors
  if (!result.isValid) {
    const errors: string[] = [];
    for (const [field, errorMessages] of Object.entries(fieldErrors)) {
      for (const errorMessage of errorMessages) {
        errors.push(`Field ${field}: ${errorMessage}`);
      }
    }
    result.errors = errors;
    result.fieldErrors = fieldErrors;
  }

  return result;
}

/**
 * Validates a care event against the care event schema
 * 
 * @param event The care event to validate
 * @param options Validation options
 * @returns Detailed validation result
 */
export function validateCareEvent(
  event: any,
  options: EventValidationOptions = {}
): DetailedEventValidationResult {
  // First validate against base schema
  const baseResult = validateEventSchema(event, options);
  if (!baseResult.isValid) {
    return baseResult;
  }

  const result: DetailedEventValidationResult = {
    isValid: true,
    event,
  };

  const fieldErrors: Record<string, string[]> = {};

  // Check if journey is CARE
  if (event.journey !== JourneyType.CARE) {
    result.isValid = false;
    if (!fieldErrors.journey) {
      fieldErrors.journey = [];
    }
    fieldErrors.journey.push(`Expected journey to be ${JourneyType.CARE}, got ${event.journey}`);
  }

  // Check if type is a valid care event type
  const validCareEventTypes = Object.values(CareEventType);
  if (!validCareEventTypes.includes(event.type)) {
    result.isValid = false;
    if (!fieldErrors.type) {
      fieldErrors.type = [];
    }
    fieldErrors.type.push(`Invalid care event type: ${event.type}`);
  }

  // Validate payload based on event type
  if (options.validatePayload !== false && event.payload) {
    const payloadErrors = validateCareEventPayload(event.type, event.payload);
    if (payloadErrors.length > 0) {
      result.isValid = false;
      fieldErrors.payload = payloadErrors;
    }
  }

  // Compile errors
  if (!result.isValid) {
    const errors: string[] = [];
    for (const [field, errorMessages] of Object.entries(fieldErrors)) {
      for (const errorMessage of errorMessages) {
        errors.push(`Field ${field}: ${errorMessage}`);
      }
    }
    result.errors = errors;
    result.fieldErrors = fieldErrors;
  }

  return result;
}

/**
 * Validates a plan event against the plan event schema
 * 
 * @param event The plan event to validate
 * @param options Validation options
 * @returns Detailed validation result
 */
export function validatePlanEvent(
  event: any,
  options: EventValidationOptions = {}
): DetailedEventValidationResult {
  // First validate against base schema
  const baseResult = validateEventSchema(event, options);
  if (!baseResult.isValid) {
    return baseResult;
  }

  const result: DetailedEventValidationResult = {
    isValid: true,
    event,
  };

  const fieldErrors: Record<string, string[]> = {};

  // Check if journey is PLAN
  if (event.journey !== JourneyType.PLAN) {
    result.isValid = false;
    if (!fieldErrors.journey) {
      fieldErrors.journey = [];
    }
    fieldErrors.journey.push(`Expected journey to be ${JourneyType.PLAN}, got ${event.journey}`);
  }

  // Check if type is a valid plan event type
  const validPlanEventTypes = Object.values(PlanEventType);
  if (!validPlanEventTypes.includes(event.type)) {
    result.isValid = false;
    if (!fieldErrors.type) {
      fieldErrors.type = [];
    }
    fieldErrors.type.push(`Invalid plan event type: ${event.type}`);
  }

  // Validate payload based on event type
  if (options.validatePayload !== false && event.payload) {
    const payloadErrors = validatePlanEventPayload(event.type, event.payload);
    if (payloadErrors.length > 0) {
      result.isValid = false;
      fieldErrors.payload = payloadErrors;
    }
  }

  // Compile errors
  if (!result.isValid) {
    const errors: string[] = [];
    for (const [field, errorMessages] of Object.entries(fieldErrors)) {
      for (const errorMessage of errorMessages) {
        errors.push(`Field ${field}: ${errorMessage}`);
      }
    }
    result.errors = errors;
    result.fieldErrors = fieldErrors;
  }

  return result;
}

/**
 * Validates a journey event based on its journey type
 * 
 * @param event The journey event to validate
 * @param options Validation options
 * @returns Detailed validation result
 */
export function validateJourneyEvent(
  event: any,
  options: EventValidationOptions = {}
): DetailedEventValidationResult {
  // First validate against base schema
  const baseResult = validateEventSchema(event, options);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Determine the journey type and use the appropriate validation function
  if (event.journey === JourneyType.HEALTH) {
    return validateHealthEvent(event, options);
  } else if (event.journey === JourneyType.CARE) {
    return validateCareEvent(event, options);
  } else if (event.journey === JourneyType.PLAN) {
    return validatePlanEvent(event, options);
  } else {
    // If journey type isn't recognized, return an error
    return {
      isValid: false,
      errors: [`Unknown journey type: ${event.journey}`],
      event,
    };
  }
}

/**
 * Validates a health event payload based on the event type
 * 
 * @param eventType The health event type
 * @param payload The event payload to validate
 * @returns Array of validation error messages
 */
function validateHealthEventPayload(eventType: string, payload: any): string[] {
  const errors: string[] = [];

  if (!payload) {
    return ['Payload is required'];
  }

  switch (eventType) {
    case HealthEventType.METRIC_RECORDED:
      if (!payload.metric) errors.push('Missing required field: metric');
      if (!payload.metricType) errors.push('Missing required field: metricType');
      if (payload.value === undefined) errors.push('Missing required field: value');
      if (!payload.unit) errors.push('Missing required field: unit');
      if (!payload.timestamp) errors.push('Missing required field: timestamp');
      break;

    case HealthEventType.GOAL_ACHIEVED:
      if (!payload.goal) errors.push('Missing required field: goal');
      if (!payload.goalType) errors.push('Missing required field: goalType');
      if (payload.targetValue === undefined) errors.push('Missing required field: targetValue');
      if (payload.achievedValue === undefined) errors.push('Missing required field: achievedValue');
      if (payload.daysToAchieve === undefined) errors.push('Missing required field: daysToAchieve');
      break;

    case HealthEventType.DEVICE_CONNECTED:
      if (!payload.deviceConnection) errors.push('Missing required field: deviceConnection');
      if (!payload.deviceId) errors.push('Missing required field: deviceId');
      if (!payload.deviceType) errors.push('Missing required field: deviceType');
      if (!payload.connectionDate) errors.push('Missing required field: connectionDate');
      if (payload.isFirstConnection === undefined) errors.push('Missing required field: isFirstConnection');
      break;

    // Add validation for other health event types as needed
  }

  return errors;
}

/**
 * Validates a care event payload based on the event type
 * 
 * @param eventType The care event type
 * @param payload The event payload to validate
 * @returns Array of validation error messages
 */
function validateCareEventPayload(eventType: string, payload: any): string[] {
  const errors: string[] = [];

  if (!payload) {
    return ['Payload is required'];
  }

  switch (eventType) {
    case CareEventType.APPOINTMENT_BOOKED:
      if (!payload.appointment) errors.push('Missing required field: appointment');
      if (!payload.appointmentType) errors.push('Missing required field: appointmentType');
      if (!payload.providerId) errors.push('Missing required field: providerId');
      if (!payload.scheduledDate) errors.push('Missing required field: scheduledDate');
      break;

    case CareEventType.MEDICATION_TAKEN:
      if (!payload.medicationId) errors.push('Missing required field: medicationId');
      if (!payload.medicationName) errors.push('Missing required field: medicationName');
      if (!payload.takenDate) errors.push('Missing required field: takenDate');
      if (payload.takenOnTime === undefined) errors.push('Missing required field: takenOnTime');
      if (!payload.dosage) errors.push('Missing required field: dosage');
      break;

    case CareEventType.TELEMEDICINE_SESSION_COMPLETED:
      if (!payload.session) errors.push('Missing required field: session');
      if (!payload.sessionId) errors.push('Missing required field: sessionId');
      if (!payload.providerId) errors.push('Missing required field: providerId');
      if (!payload.startTime) errors.push('Missing required field: startTime');
      if (!payload.endTime) errors.push('Missing required field: endTime');
      if (payload.duration === undefined) errors.push('Missing required field: duration');
      break;

    // Add validation for other care event types as needed
  }

  return errors;
}

/**
 * Validates a plan event payload based on the event type
 * 
 * @param eventType The plan event type
 * @param payload The event payload to validate
 * @returns Array of validation error messages
 */
function validatePlanEventPayload(eventType: string, payload: any): string[] {
  const errors: string[] = [];

  if (!payload) {
    return ['Payload is required'];
  }

  switch (eventType) {
    case PlanEventType.CLAIM_SUBMITTED:
      if (!payload.claim) errors.push('Missing required field: claim');
      if (!payload.submissionDate) errors.push('Missing required field: submissionDate');
      if (payload.amount === undefined) errors.push('Missing required field: amount');
      if (!payload.claimType) errors.push('Missing required field: claimType');
      if (payload.hasDocuments === undefined) errors.push('Missing required field: hasDocuments');
      if (payload.isComplete === undefined) errors.push('Missing required field: isComplete');
      break;

    case PlanEventType.BENEFIT_UTILIZED:
      if (!payload.benefit) errors.push('Missing required field: benefit');
      if (!payload.utilizationDate) errors.push('Missing required field: utilizationDate');
      if (payload.isFirstUtilization === undefined) errors.push('Missing required field: isFirstUtilization');
      break;

    case PlanEventType.REWARD_REDEEMED:
      if (!payload.rewardId) errors.push('Missing required field: rewardId');
      if (!payload.rewardName) errors.push('Missing required field: rewardName');
      if (!payload.redemptionDate) errors.push('Missing required field: redemptionDate');
      if (payload.pointValue === undefined) errors.push('Missing required field: pointValue');
      if (!payload.rewardType) errors.push('Missing required field: rewardType');
      if (payload.isPremiumReward === undefined) errors.push('Missing required field: isPremiumReward');
      break;

    // Add validation for other plan event types as needed
  }

  return errors;
}

/**
 * Type guard to check if an object is a valid BaseEvent
 * 
 * @param obj The object to check
 * @returns True if the object is a valid BaseEvent, false otherwise
 */
export function isValidBaseEvent(obj: any): obj is BaseEvent {
  const result = validateEventSchema(obj);
  return result.isValid;
}

/**
 * Type guard to check if an object is a valid health event
 * 
 * @param obj The object to check
 * @returns True if the object is a valid health event, false otherwise
 */
export function isValidHealthEvent(obj: any): obj is IHealthEvent {
  if (!isHealthEvent(obj)) {
    return false;
  }

  const result = validateHealthEvent(obj);
  return result.isValid;
}

/**
 * Type guard to check if an object is a valid care event
 * 
 * @param obj The object to check
 * @returns True if the object is a valid care event, false otherwise
 */
export function isValidCareEvent(obj: any): obj is ICareEvent {
  if (!isCareEvent(obj)) {
    return false;
  }

  const result = validateCareEvent(obj);
  return result.isValid;
}

/**
 * Type guard to check if an object is a valid plan event
 * 
 * @param obj The object to check
 * @returns True if the object is a valid plan event, false otherwise
 */
export function isValidPlanEvent(obj: any): obj is IPlanEvent {
  if (!isPlanEvent(obj)) {
    return false;
  }

  const result = validatePlanEvent(obj);
  return result.isValid;
}