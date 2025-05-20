/**
 * @file event-validators.ts
 * @description Provides validation utilities for testing event schema compliance, verifying required fields,
 * type-checking event data, and ensuring event integrity. This utility simplifies testing of event schema
 * validation with functions to validate events against expected formats, check for required properties,
 * and verify journey-specific event structures.
 *
 * @module events/test/utils
 */

import { validate, validateSync, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { EventMetadataDto, EventVersionDto } from '../../src/dto/event-metadata.dto';

/**
 * Interface representing the basic structure of an event.
 */
export interface BaseEvent {
  type: EventType | string;
  payload: Record<string, any>;
  metadata?: EventMetadataDto;
}

/**
 * Result of event validation containing validation status and any errors.
 */
export interface EventValidationResult {
  isValid: boolean;
  errors: ValidationError[] | string[];
}

/**
 * Options for event validation.
 */
export interface EventValidationOptions {
  /**
   * Whether to check for required fields in the event payload based on event type.
   * Default: true
   */
  checkRequiredFields?: boolean;
  
  /**
   * Whether to validate event metadata.
   * Default: true
   */
  validateMetadata?: boolean;
  
  /**
   * Whether to validate event type.
   * Default: true
   */
  validateEventType?: boolean;
  
  /**
   * Whether to validate event payload structure.
   * Default: true
   */
  validatePayload?: boolean;
  
  /**
   * Whether to validate event timestamp.
   * Default: false
   */
  validateTimestamp?: boolean;
  
  /**
   * Maximum age of event in milliseconds for timestamp validation.
   * Default: 60000 (1 minute)
   */
  maxEventAge?: number;
}

/**
 * Default validation options.
 */
const DEFAULT_VALIDATION_OPTIONS: EventValidationOptions = {
  checkRequiredFields: true,
  validateMetadata: true,
  validateEventType: true,
  validatePayload: true,
  validateTimestamp: false,
  maxEventAge: 60000, // 1 minute
};

/**
 * Map of required fields for each event type.
 */
const REQUIRED_FIELDS: Record<EventType, string[]> = {
  // Health Journey Events
  [EventType.HEALTH_METRIC_RECORDED]: ['metricType', 'value', 'unit', 'timestamp'],
  [EventType.HEALTH_GOAL_ACHIEVED]: ['goalId', 'goalType', 'targetValue', 'achievedValue', 'completedAt'],
  [EventType.HEALTH_GOAL_CREATED]: ['goalId', 'goalType', 'targetValue', 'startValue', 'createdAt'],
  [EventType.HEALTH_DEVICE_CONNECTED]: ['deviceId', 'deviceType', 'connectionMethod', 'connectedAt'],
  [EventType.HEALTH_INSIGHT_GENERATED]: ['insightId', 'insightType', 'metricType', 'description', 'severity', 'generatedAt'],
  [EventType.HEALTH_ASSESSMENT_COMPLETED]: ['assessmentId', 'assessmentType', 'score', 'completedAt'],
  
  // Care Journey Events
  [EventType.CARE_APPOINTMENT_BOOKED]: ['appointmentId', 'providerId', 'specialtyType', 'appointmentType', 'scheduledAt', 'bookedAt'],
  [EventType.CARE_APPOINTMENT_COMPLETED]: ['appointmentId', 'providerId', 'appointmentType', 'scheduledAt', 'completedAt'],
  [EventType.CARE_MEDICATION_TAKEN]: ['medicationId', 'medicationName', 'dosage', 'takenAt'],
  [EventType.CARE_TELEMEDICINE_STARTED]: ['sessionId', 'appointmentId', 'providerId', 'startedAt'],
  [EventType.CARE_TELEMEDICINE_COMPLETED]: ['sessionId', 'appointmentId', 'providerId', 'startedAt', 'endedAt', 'duration'],
  [EventType.CARE_PLAN_CREATED]: ['planId', 'providerId', 'planType', 'condition', 'startDate', 'createdAt'],
  [EventType.CARE_PLAN_TASK_COMPLETED]: ['taskId', 'planId', 'taskType', 'completedAt'],
  
  // Plan Journey Events
  [EventType.PLAN_CLAIM_SUBMITTED]: ['claimId', 'claimType', 'providerId', 'serviceDate', 'amount', 'submittedAt'],
  [EventType.PLAN_CLAIM_PROCESSED]: ['claimId', 'status', 'amount', 'coveredAmount', 'processedAt'],
  [EventType.PLAN_SELECTED]: ['planId', 'planType', 'coverageLevel', 'premium', 'startDate', 'selectedAt'],
  [EventType.PLAN_BENEFIT_UTILIZED]: ['benefitId', 'benefitType', 'utilizationDate'],
  [EventType.PLAN_REWARD_REDEEMED]: ['rewardId', 'rewardType', 'pointsRedeemed', 'value', 'redeemedAt'],
  [EventType.PLAN_DOCUMENT_COMPLETED]: ['documentId', 'documentType', 'completedAt'],
  
  // Cross-Journey Events
  [EventType.GAMIFICATION_POINTS_EARNED]: ['sourceType', 'sourceId', 'points', 'reason', 'earnedAt'],
  [EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED]: ['achievementId', 'achievementType', 'tier', 'points', 'unlockedAt'],
  [EventType.GAMIFICATION_LEVEL_UP]: ['previousLevel', 'newLevel', 'totalPoints', 'leveledUpAt'],
  [EventType.GAMIFICATION_QUEST_COMPLETED]: ['questId', 'questType', 'difficulty', 'points', 'completedAt'],
  
  // User Events
  [EventType.USER_PROFILE_COMPLETED]: ['completionPercentage', 'completedSections', 'completedAt'],
  [EventType.USER_LOGIN]: ['loginMethod', 'deviceType', 'loginAt'],
  [EventType.USER_ONBOARDING_COMPLETED]: ['completedSteps', 'selectedJourneys', 'completedAt'],
  [EventType.USER_FEEDBACK_SUBMITTED]: ['feedbackType', 'rating', 'submittedAt'],
};

/**
 * Type guards for checking if an object is a valid event.
 * 
 * @param obj Object to check
 * @returns True if the object is a valid event, false otherwise
 */
export function isEvent(obj: any): obj is BaseEvent {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'type' in obj &&
    typeof obj.type === 'string' &&
    'payload' in obj &&
    typeof obj.payload === 'object'
  );
}

/**
 * Type guard for checking if an event is of a specific type.
 * 
 * @param event Event to check
 * @param eventType Expected event type
 * @returns True if the event is of the specified type, false otherwise
 */
export function isEventOfType(event: BaseEvent, eventType: EventType): boolean {
  return event.type === eventType;
}

/**
 * Type guard for checking if an event belongs to the Health journey.
 * 
 * @param event Event to check
 * @returns True if the event belongs to the Health journey, false otherwise
 */
export function isHealthEvent(event: BaseEvent): boolean {
  return Object.values(JourneyEvents.Health).includes(event.type as any);
}

/**
 * Type guard for checking if an event belongs to the Care journey.
 * 
 * @param event Event to check
 * @returns True if the event belongs to the Care journey, false otherwise
 */
export function isCareEvent(event: BaseEvent): boolean {
  return Object.values(JourneyEvents.Care).includes(event.type as any);
}

/**
 * Type guard for checking if an event belongs to the Plan journey.
 * 
 * @param event Event to check
 * @returns True if the event belongs to the Plan journey, false otherwise
 */
export function isPlanEvent(event: BaseEvent): boolean {
  return Object.values(JourneyEvents.Plan).includes(event.type as any);
}

/**
 * Type guard for checking if an event is a Gamification event.
 * 
 * @param event Event to check
 * @returns True if the event is a Gamification event, false otherwise
 */
export function isGamificationEvent(event: BaseEvent): boolean {
  return Object.values(JourneyEvents.Gamification).includes(event.type as any);
}

/**
 * Type guard for checking if an event is a User event.
 * 
 * @param event Event to check
 * @returns True if the event is a User event, false otherwise
 */
export function isUserEvent(event: BaseEvent): boolean {
  return Object.values(JourneyEvents.User).includes(event.type as any);
}

/**
 * Validates an event against its expected schema.
 * 
 * @param event Event to validate
 * @param options Validation options
 * @returns Promise resolving to validation result
 */
export async function validateEvent(
  event: any,
  options: EventValidationOptions = {}
): Promise<EventValidationResult> {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: string[] = [];
  
  // Check if the object is an event
  if (!isEvent(event)) {
    return {
      isValid: false,
      errors: ['Invalid event structure: must have type and payload properties'],
    };
  }
  
  // Validate event type
  if (opts.validateEventType) {
    const validEventTypes = Object.values(EventType);
    if (!validEventTypes.includes(event.type as EventType)) {
      errors.push(`Invalid event type: ${event.type}`);
    }
  }
  
  // Validate required fields
  if (opts.checkRequiredFields && Object.values(EventType).includes(event.type as EventType)) {
    const requiredFields = REQUIRED_FIELDS[event.type as EventType] || [];
    for (const field of requiredFields) {
      if (!(field in event.payload)) {
        errors.push(`Missing required field in payload: ${field}`);
      }
    }
  }
  
  // Validate metadata
  if (opts.validateMetadata && event.metadata) {
    const metadataInstance = plainToInstance(EventMetadataDto, event.metadata);
    const metadataErrors = await validate(metadataInstance);
    
    if (metadataErrors.length > 0) {
      errors.push(
        ...metadataErrors.map(
          (error) => `Metadata validation error: ${formatValidationError(error)}`
        )
      );
    }
  }
  
  // Validate timestamp
  if (opts.validateTimestamp && event.metadata?.timestamp) {
    const timestamp = new Date(event.metadata.timestamp);
    const now = new Date();
    const maxAge = opts.maxEventAge || DEFAULT_VALIDATION_OPTIONS.maxEventAge;
    
    if (isNaN(timestamp.getTime())) {
      errors.push('Invalid timestamp format');
    } else if (timestamp > now) {
      errors.push('Timestamp is in the future');
    } else if (now.getTime() - timestamp.getTime() > maxAge) {
      errors.push(`Event is too old: ${now.getTime() - timestamp.getTime()}ms (max: ${maxAge}ms)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Synchronously validates an event against its expected schema.
 * 
 * @param event Event to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateEventSync(
  event: any,
  options: EventValidationOptions = {}
): EventValidationResult {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: string[] = [];
  
  // Check if the object is an event
  if (!isEvent(event)) {
    return {
      isValid: false,
      errors: ['Invalid event structure: must have type and payload properties'],
    };
  }
  
  // Validate event type
  if (opts.validateEventType) {
    const validEventTypes = Object.values(EventType);
    if (!validEventTypes.includes(event.type as EventType)) {
      errors.push(`Invalid event type: ${event.type}`);
    }
  }
  
  // Validate required fields
  if (opts.checkRequiredFields && Object.values(EventType).includes(event.type as EventType)) {
    const requiredFields = REQUIRED_FIELDS[event.type as EventType] || [];
    for (const field of requiredFields) {
      if (!(field in event.payload)) {
        errors.push(`Missing required field in payload: ${field}`);
      }
    }
  }
  
  // Validate metadata
  if (opts.validateMetadata && event.metadata) {
    const metadataInstance = plainToInstance(EventMetadataDto, event.metadata);
    const metadataErrors = validateSync(metadataInstance);
    
    if (metadataErrors.length > 0) {
      errors.push(
        ...metadataErrors.map(
          (error) => `Metadata validation error: ${formatValidationError(error)}`
        )
      );
    }
  }
  
  // Validate timestamp
  if (opts.validateTimestamp && event.metadata?.timestamp) {
    const timestamp = new Date(event.metadata.timestamp);
    const now = new Date();
    const maxAge = opts.maxEventAge || DEFAULT_VALIDATION_OPTIONS.maxEventAge;
    
    if (isNaN(timestamp.getTime())) {
      errors.push('Invalid timestamp format');
    } else if (timestamp > now) {
      errors.push('Timestamp is in the future');
    } else if (now.getTime() - timestamp.getTime() > maxAge) {
      errors.push(`Event is too old: ${now.getTime() - timestamp.getTime()}ms (max: ${maxAge}ms)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an event's version against expected version constraints.
 * 
 * @param event Event to validate
 * @param minVersion Minimum acceptable version (e.g., '1.0.0')
 * @param maxVersion Maximum acceptable version (e.g., '2.0.0')
 * @returns Validation result
 */
export function validateEventVersion(
  event: BaseEvent,
  minVersion: string,
  maxVersion?: string
): EventValidationResult {
  if (!event.metadata?.version) {
    return {
      isValid: false,
      errors: ['Event has no version information'],
    };
  }
  
  const eventVersion = event.metadata.version;
  let versionStr: string;
  
  if (typeof eventVersion === 'string') {
    versionStr = eventVersion;
  } else if (eventVersion instanceof EventVersionDto) {
    versionStr = eventVersion.toString();
  } else if (typeof eventVersion === 'object' && 'major' in eventVersion && 'minor' in eventVersion && 'patch' in eventVersion) {
    versionStr = `${eventVersion.major}.${eventVersion.minor}.${eventVersion.patch}`;
  } else {
    return {
      isValid: false,
      errors: ['Invalid version format'],
    };
  }
  
  // Parse versions
  const eventVersionParts = versionStr.split('.').map(Number);
  const minVersionParts = minVersion.split('.').map(Number);
  const maxVersionParts = maxVersion ? maxVersion.split('.').map(Number) : undefined;
  
  // Check minimum version
  for (let i = 0; i < 3; i++) {
    if (eventVersionParts[i] < minVersionParts[i]) {
      return {
        isValid: false,
        errors: [`Event version ${versionStr} is below minimum version ${minVersion}`],
      };
    } else if (eventVersionParts[i] > minVersionParts[i]) {
      break;
    }
  }
  
  // Check maximum version if specified
  if (maxVersionParts) {
    for (let i = 0; i < 3; i++) {
      if (eventVersionParts[i] > maxVersionParts[i]) {
        return {
          isValid: false,
          errors: [`Event version ${versionStr} exceeds maximum version ${maxVersion}`],
        };
      } else if (eventVersionParts[i] < maxVersionParts[i]) {
        break;
      }
    }
  }
  
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validates a health event against its expected schema.
 * 
 * @param event Event to validate
 * @returns Validation result
 */
export function validateHealthEvent(event: BaseEvent): EventValidationResult {
  if (!isHealthEvent(event)) {
    return {
      isValid: false,
      errors: [`Event type ${event.type} is not a Health journey event`],
    };
  }
  
  return validateEventSync(event);
}

/**
 * Validates a care event against its expected schema.
 * 
 * @param event Event to validate
 * @returns Validation result
 */
export function validateCareEvent(event: BaseEvent): EventValidationResult {
  if (!isCareEvent(event)) {
    return {
      isValid: false,
      errors: [`Event type ${event.type} is not a Care journey event`],
    };
  }
  
  return validateEventSync(event);
}

/**
 * Validates a plan event against its expected schema.
 * 
 * @param event Event to validate
 * @returns Validation result
 */
export function validatePlanEvent(event: BaseEvent): EventValidationResult {
  if (!isPlanEvent(event)) {
    return {
      isValid: false,
      errors: [`Event type ${event.type} is not a Plan journey event`],
    };
  }
  
  return validateEventSync(event);
}

/**
 * Validates a gamification event against its expected schema.
 * 
 * @param event Event to validate
 * @returns Validation result
 */
export function validateGamificationEvent(event: BaseEvent): EventValidationResult {
  if (!isGamificationEvent(event)) {
    return {
      isValid: false,
      errors: [`Event type ${event.type} is not a Gamification event`],
    };
  }
  
  return validateEventSync(event);
}

/**
 * Validates a user event against its expected schema.
 * 
 * @param event Event to validate
 * @returns Validation result
 */
export function validateUserEvent(event: BaseEvent): EventValidationResult {
  if (!isUserEvent(event)) {
    return {
      isValid: false,
      errors: [`Event type ${event.type} is not a User event`],
    };
  }
  
  return validateEventSync(event);
}

/**
 * Validates that an event has all required fields for its type.
 * 
 * @param event Event to validate
 * @returns Validation result
 */
export function validateRequiredFields(event: BaseEvent): EventValidationResult {
  if (!Object.values(EventType).includes(event.type as EventType)) {
    return {
      isValid: false,
      errors: [`Unknown event type: ${event.type}`],
    };
  }
  
  const requiredFields = REQUIRED_FIELDS[event.type as EventType] || [];
  const missingFields = requiredFields.filter((field) => !(field in event.payload));
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      errors: missingFields.map((field) => `Missing required field: ${field}`),
    };
  }
  
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validates that an event's timestamp is within acceptable bounds.
 * 
 * @param event Event to validate
 * @param maxAgeMs Maximum age of the event in milliseconds
 * @returns Validation result
 */
export function validateEventTimestamp(
  event: BaseEvent,
  maxAgeMs: number = 60000 // 1 minute
): EventValidationResult {
  if (!event.metadata?.timestamp) {
    return {
      isValid: false,
      errors: ['Event has no timestamp'],
    };
  }
  
  const timestamp = new Date(event.metadata.timestamp);
  const now = new Date();
  
  if (isNaN(timestamp.getTime())) {
    return {
      isValid: false,
      errors: ['Invalid timestamp format'],
    };
  }
  
  if (timestamp > now) {
    return {
      isValid: false,
      errors: ['Timestamp is in the future'],
    };
  }
  
  if (now.getTime() - timestamp.getTime() > maxAgeMs) {
    return {
      isValid: false,
      errors: [`Event is too old: ${now.getTime() - timestamp.getTime()}ms (max: ${maxAgeMs}ms)`],
    };
  }
  
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Creates an invalid event for testing validation failure scenarios.
 * 
 * @param eventType Type of event to create
 * @param invalidations Object specifying which parts of the event to invalidate
 * @returns An invalid event object
 */
export function createInvalidEvent(
  eventType: EventType,
  invalidations: {
    missingFields?: string[];
    invalidType?: boolean;
    invalidMetadata?: boolean;
    futureTimestamp?: boolean;
    oldTimestamp?: boolean;
  }
): BaseEvent {
  const event: BaseEvent = {
    type: invalidations.invalidType ? 'INVALID_TYPE' : eventType,
    payload: {},
    metadata: invalidations.invalidMetadata
      ? { invalid: 'metadata' } as any
      : new EventMetadataDto(),
  };
  
  // Add all required fields except those specified as missing
  const requiredFields = REQUIRED_FIELDS[eventType] || [];
  const missingFields = invalidations.missingFields || [];
  
  for (const field of requiredFields) {
    if (!missingFields.includes(field)) {
      // Add a dummy value based on field name
      if (field.includes('Id')) {
        event.payload[field] = 'test-id';
      } else if (field.includes('Type')) {
        event.payload[field] = 'test-type';
      } else if (field.includes('value') || field.includes('amount') || field.includes('percentage')) {
        event.payload[field] = 100;
      } else if (field.includes('At') || field.includes('Date')) {
        event.payload[field] = new Date().toISOString();
      } else {
        event.payload[field] = 'test-value';
      }
    }
  }
  
  // Set timestamp if needed
  if (invalidations.futureTimestamp) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    event.metadata.timestamp = futureDate;
  } else if (invalidations.oldTimestamp) {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 1);
    event.metadata.timestamp = oldDate;
  }
  
  return event;
}

/**
 * Formats a validation error for display.
 * 
 * @param error Validation error to format
 * @returns Formatted error string
 */
function formatValidationError(error: ValidationError): string {
  let result = `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
  
  if (error.children && error.children.length > 0) {
    result += ` (${error.children.map(formatValidationError).join(', ')})`;
  }
  
  return result;
}