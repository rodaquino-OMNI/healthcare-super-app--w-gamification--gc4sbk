/**
 * Event Validators
 * 
 * Provides validation utilities for testing event schema compliance, verifying required fields,
 * type-checking event data, and ensuring event integrity. This utility simplifies testing of
 * event schema validation with functions to validate events against expected formats, check
 * for required properties, and verify journey-specific event structures.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { EventTypes } from '../../src/dto/event-types.enum';
import { HealthMetricEventDto } from '../../src/dto/health-metric-event.dto';
import { HealthGoalEventDto } from '../../src/dto/health-goal-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../../src/dto/medication-event.dto';
import { ClaimEventDto } from '../../src/dto/claim-event.dto';
import { BenefitEventDto } from '../../src/dto/benefit-event.dto';
import { HealthEventDto } from '../../src/dto/health-event.dto';
import { CareEventDto } from '../../src/dto/care-event.dto';
import { PlanEventDto } from '../../src/dto/plan-event.dto';

/**
 * Interface for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Interface for event type guard result
 */
export interface EventTypeGuardResult {
  isValid: boolean;
  expectedType: string;
  actualType: string;
  errors: string[];
}

/**
 * Base event validator
 * Validates that an event conforms to the BaseEventDto schema
 * 
 * @param event - The event to validate
 * @returns Validation result with isValid flag and any errors
 */
export async function validateBaseEvent(event: any): Promise<ValidationResult> {
  if (!event) {
    return { isValid: false, errors: ['Event is null or undefined'] };
  }

  // Convert plain object to class instance for validation
  const eventInstance = plainToInstance(BaseEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    // Format validation errors
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Check required fields
  const requiredFields = ['type', 'userId', 'data', 'timestamp'];
  const missingFields = requiredFields.filter(field => !event[field]);

  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      errors: [`Missing required fields: ${missingFields.join(', ')}`] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates that an event has the expected type
 * 
 * @param event - The event to validate
 * @param expectedType - The expected event type
 * @returns Event type guard result
 */
export function validateEventType(event: any, expectedType: EventTypes): EventTypeGuardResult {
  if (!event) {
    return { 
      isValid: false, 
      expectedType, 
      actualType: 'undefined', 
      errors: ['Event is null or undefined'] 
    };
  }

  if (!event.type) {
    return { 
      isValid: false, 
      expectedType, 
      actualType: 'undefined', 
      errors: ['Event type is missing'] 
    };
  }

  if (event.type !== expectedType) {
    return { 
      isValid: false, 
      expectedType, 
      actualType: event.type, 
      errors: [`Expected event type ${expectedType}, but got ${event.type}`] 
    };
  }

  return { 
    isValid: true, 
    expectedType, 
    actualType: event.type, 
    errors: [] 
  };
}

/**
 * Validates that an event belongs to the expected journey
 * 
 * @param event - The event to validate
 * @param expectedJourney - The expected journey ('health', 'care', or 'plan')
 * @returns Validation result
 */
export function validateEventJourney(event: any, expectedJourney: 'health' | 'care' | 'plan'): ValidationResult {
  if (!event) {
    return { isValid: false, errors: ['Event is null or undefined'] };
  }

  // If journey is explicitly set, check it
  if (event.journey && event.journey !== expectedJourney) {
    return { 
      isValid: false, 
      errors: [`Expected journey ${expectedJourney}, but got ${event.journey}`] 
    };
  }

  // If journey is not set, infer from event type
  if (!event.journey && event.type) {
    const eventType = event.type as string;
    
    // Check if event type matches expected journey
    const journeyPrefix = {
      'health': 'HEALTH_',
      'care': 'CARE_',
      'plan': 'PLAN_'
    }[expectedJourney];

    if (journeyPrefix && !eventType.startsWith(journeyPrefix)) {
      return { 
        isValid: false, 
        errors: [`Event type ${eventType} does not belong to ${expectedJourney} journey`] 
      };
    }
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates timestamp format and sequence
 * 
 * @param event - The event to validate
 * @param referenceTime - Optional reference time to compare against
 * @param shouldBeAfter - Whether the event timestamp should be after the reference time
 * @returns Validation result
 */
export function validateEventTimestamp(
  event: any, 
  referenceTime?: Date | string,
  shouldBeAfter: boolean = true
): ValidationResult {
  if (!event) {
    return { isValid: false, errors: ['Event is null or undefined'] };
  }

  if (!event.timestamp) {
    return { isValid: false, errors: ['Event timestamp is missing'] };
  }

  // Validate ISO format
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
  if (!timestampRegex.test(event.timestamp)) {
    return { 
      isValid: false, 
      errors: [`Event timestamp ${event.timestamp} is not in ISO format`] 
    };
  }

  // If reference time is provided, check sequence
  if (referenceTime) {
    const eventTime = new Date(event.timestamp).getTime();
    const reference = typeof referenceTime === 'string' 
      ? new Date(referenceTime).getTime() 
      : referenceTime.getTime();

    if (shouldBeAfter && eventTime <= reference) {
      return { 
        isValid: false, 
        errors: [`Event timestamp ${event.timestamp} should be after ${referenceTime}`] 
      };
    }

    if (!shouldBeAfter && eventTime >= reference) {
      return { 
        isValid: false, 
        errors: [`Event timestamp ${event.timestamp} should be before ${referenceTime}`] 
      };
    }
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates that an event has all required data fields
 * 
 * @param event - The event to validate
 * @param requiredFields - Array of required field names in the data object
 * @returns Validation result
 */
export function validateEventDataFields(event: any, requiredFields: string[]): ValidationResult {
  if (!event) {
    return { isValid: false, errors: ['Event is null or undefined'] };
  }

  if (!event.data) {
    return { isValid: false, errors: ['Event data is missing'] };
  }

  const missingFields = requiredFields.filter(field => {
    const value = event.data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      errors: [`Missing required data fields: ${missingFields.join(', ')}`] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates numeric field ranges
 * 
 * @param event - The event to validate
 * @param fieldPath - Path to the numeric field (e.g., 'data.value')
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns Validation result
 */
export function validateNumericRange(
  event: any, 
  fieldPath: string, 
  min?: number, 
  max?: number
): ValidationResult {
  if (!event) {
    return { isValid: false, errors: ['Event is null or undefined'] };
  }

  // Navigate to the field using the path
  const pathParts = fieldPath.split('.');
  let value = event;
  
  for (const part of pathParts) {
    if (value === undefined || value === null) {
      return { 
        isValid: false, 
        errors: [`Field path ${fieldPath} not found in event`] 
      };
    }
    value = value[part];
  }

  if (typeof value !== 'number') {
    return { 
      isValid: false, 
      errors: [`Field ${fieldPath} is not a number, got ${typeof value}`] 
    };
  }

  if (min !== undefined && value < min) {
    return { 
      isValid: false, 
      errors: [`Field ${fieldPath} value ${value} is less than minimum ${min}`] 
    };
  }

  if (max !== undefined && value > max) {
    return { 
      isValid: false, 
      errors: [`Field ${fieldPath} value ${value} is greater than maximum ${max}`] 
    };
  }

  return { isValid: true, errors: [] };
}

// =========================================================================
// HEALTH JOURNEY EVENT VALIDATORS
// =========================================================================

/**
 * Validates a health metric recorded event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateHealthMetricEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.HEALTH_METRIC_RECORDED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'health');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['metricType', 'value', 'unit', 'recordedAt'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(HealthMetricEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate metric value based on type
  const { metricType, value } = event.data;
  
  switch (metricType) {
    case 'HEART_RATE':
      return validateNumericRange(event, 'data.value', 30, 220); // bpm
    case 'BLOOD_PRESSURE_SYSTOLIC':
      return validateNumericRange(event, 'data.value', 70, 250); // mmHg
    case 'BLOOD_PRESSURE_DIASTOLIC':
      return validateNumericRange(event, 'data.value', 40, 150); // mmHg
    case 'BLOOD_GLUCOSE':
      return validateNumericRange(event, 'data.value', 20, 600); // mg/dL
    case 'WEIGHT':
      return validateNumericRange(event, 'data.value', 1, 500); // kg
    case 'STEPS':
      return validateNumericRange(event, 'data.value', 0, 100000); // steps
    case 'SLEEP':
      return validateNumericRange(event, 'data.value', 0, 24); // hours
    default:
      // For unknown metric types, just ensure it's a number
      if (typeof value !== 'number') {
        return { 
          isValid: false, 
          errors: [`Metric value must be a number, got ${typeof value}`] 
        };
      }
      return { isValid: true, errors: [] };
  }
}

/**
 * Validates a health goal achieved event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateHealthGoalEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.HEALTH_GOAL_ACHIEVED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'health');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['goalId', 'goalType', 'targetValue', 'achievedValue', 'achievedAt'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(HealthGoalEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate that achieved value meets or exceeds target value
  const { targetValue, achievedValue, goalType } = event.data;
  
  // For weight goals, achieved value should be less than or equal to target
  if (goalType === 'WEIGHT' && achievedValue > targetValue) {
    return { 
      isValid: false, 
      errors: [`For weight goals, achieved value (${achievedValue}) should be less than or equal to target value (${targetValue})`] 
    };
  }
  
  // For other goals, achieved value should be greater than or equal to target
  if (goalType !== 'WEIGHT' && achievedValue < targetValue) {
    return { 
      isValid: false, 
      errors: [`Achieved value (${achievedValue}) should be greater than or equal to target value (${targetValue})`] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a health device connected event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateHealthDeviceEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.HEALTH_DEVICE_CONNECTED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'health');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['deviceId', 'deviceType', 'manufacturer', 'model', 'connectedAt'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(HealthEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  return { isValid: true, errors: [] };
}

// =========================================================================
// CARE JOURNEY EVENT VALIDATORS
// =========================================================================

/**
 * Validates an appointment booked event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateAppointmentBookedEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.CARE_APPOINTMENT_BOOKED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'care');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['appointmentId', 'providerId', 'providerName', 'specialtyName', 'appointmentDate', 'appointmentType', 'status', 'bookedAt'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(AppointmentEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate that appointment date is in the future
  const appointmentDate = new Date(event.data.appointmentDate);
  const now = new Date();
  
  if (appointmentDate <= now) {
    return { 
      isValid: false, 
      errors: [`Appointment date (${event.data.appointmentDate}) must be in the future`] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a medication taken event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateMedicationTakenEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.CARE_MEDICATION_TAKEN);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'care');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['medicationId', 'medicationName', 'dosage', 'takenAt', 'scheduledFor', 'adherence'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(MedicationEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate adherence value
  const validAdherenceValues = ['ON_TIME', 'LATE', 'MISSED'];
  if (!validAdherenceValues.includes(event.data.adherence)) {
    return { 
      isValid: false, 
      errors: [`Invalid adherence value: ${event.data.adherence}. Must be one of: ${validAdherenceValues.join(', ')}`] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a telemedicine session event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateTelemedicineSessionEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type is one of the telemedicine event types
  const validTypes = [
    EventTypes.CARE_TELEMEDICINE_STARTED,
    EventTypes.CARE_TELEMEDICINE_COMPLETED,
    EventTypes.CARE_TELEMEDICINE_CANCELLED
  ];
  
  if (!event.type || !validTypes.includes(event.type)) {
    return { 
      isValid: false, 
      errors: [`Invalid telemedicine event type: ${event.type}. Must be one of: ${validTypes.join(', ')}`] 
    };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'care');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields based on event type
  let requiredFields = ['sessionId', 'providerId', 'status'];
  
  if (event.type === EventTypes.CARE_TELEMEDICINE_STARTED) {
    requiredFields = [...requiredFields, 'startedAt'];
  } else if (event.type === EventTypes.CARE_TELEMEDICINE_COMPLETED) {
    requiredFields = [...requiredFields, 'startedAt', 'endedAt', 'duration'];
  } else if (event.type === EventTypes.CARE_TELEMEDICINE_CANCELLED) {
    requiredFields = [...requiredFields, 'reason'];
  }
  
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(CareEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // For completed sessions, validate that endedAt is after startedAt
  if (event.type === EventTypes.CARE_TELEMEDICINE_COMPLETED) {
    const startedAt = new Date(event.data.startedAt).getTime();
    const endedAt = new Date(event.data.endedAt).getTime();
    
    if (endedAt <= startedAt) {
      return { 
        isValid: false, 
        errors: [`Session end time (${event.data.endedAt}) must be after start time (${event.data.startedAt})`] 
      };
    }
    
    // Validate that duration matches the difference between start and end times
    const durationMs = endedAt - startedAt;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    if (Math.abs(durationMinutes - event.data.duration) > 1) { // Allow 1 minute difference for rounding
      return { 
        isValid: false, 
        errors: [`Session duration (${event.data.duration} minutes) does not match the time difference between start and end (${durationMinutes} minutes)`] 
      };
    }
  }

  return { isValid: true, errors: [] };
}

// =========================================================================
// PLAN JOURNEY EVENT VALIDATORS
// =========================================================================

/**
 * Validates a claim submitted event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateClaimSubmittedEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.PLAN_CLAIM_SUBMITTED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'plan');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['claimId', 'claimType', 'amount', 'currency', 'serviceDate', 'submittedAt', 'status'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(ClaimEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate amount is positive
  const amountResult = validateNumericRange(event, 'data.amount', 0.01);
  if (!amountResult.isValid) {
    return amountResult;
  }

  // Validate currency
  const validCurrencies = ['BRL', 'USD', 'EUR'];
  if (!validCurrencies.includes(event.data.currency)) {
    return { 
      isValid: false, 
      errors: [`Invalid currency: ${event.data.currency}. Must be one of: ${validCurrencies.join(', ')}`] 
    };
  }

  // Validate status is 'SUBMITTED'
  if (event.data.status !== 'SUBMITTED') {
    return { 
      isValid: false, 
      errors: [`Initial claim status must be 'SUBMITTED', got '${event.data.status}'`] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a claim status updated event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateClaimStatusUpdatedEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.PLAN_CLAIM_STATUS_UPDATED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'plan');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['claimId', 'previousStatus', 'newStatus', 'updatedAt'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(ClaimEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate status transition
  const { previousStatus, newStatus } = event.data;
  
  // Validate statuses
  const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFORMATION', 'APPROVED', 'REJECTED'];
  
  if (!validStatuses.includes(previousStatus)) {
    return { 
      isValid: false, 
      errors: [`Invalid previous status: ${previousStatus}. Must be one of: ${validStatuses.join(', ')}`] 
    };
  }
  
  if (!validStatuses.includes(newStatus)) {
    return { 
      isValid: false, 
      errors: [`Invalid new status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`] 
    };
  }
  
  // Validate that status has actually changed
  if (previousStatus === newStatus) {
    return { 
      isValid: false, 
      errors: [`Status has not changed: ${previousStatus} -> ${newStatus}`] 
    };
  }
  
  // Validate required fields based on new status
  if (newStatus === 'APPROVED' && event.data.approvedAmount === undefined) {
    return { 
      isValid: false, 
      errors: ['approvedAmount is required when status is APPROVED'] 
    };
  }
  
  if (newStatus === 'REJECTED' && !event.data.rejectionReason) {
    return { 
      isValid: false, 
      errors: ['rejectionReason is required when status is REJECTED'] 
    };
  }
  
  if (newStatus === 'PENDING_INFORMATION' && (!event.data.requiredInformation || !Array.isArray(event.data.requiredInformation) || event.data.requiredInformation.length === 0)) {
    return { 
      isValid: false, 
      errors: ['requiredInformation array is required when status is PENDING_INFORMATION'] 
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates a benefit used event
 * 
 * @param event - The event to validate
 * @returns Validation result
 */
export async function validateBenefitUsedEvent(event: any): Promise<ValidationResult> {
  // Check base event structure
  const baseResult = await validateBaseEvent(event);
  if (!baseResult.isValid) {
    return baseResult;
  }

  // Check event type
  const typeResult = validateEventType(event, EventTypes.PLAN_BENEFIT_UTILIZED);
  if (!typeResult.isValid) {
    return { isValid: false, errors: typeResult.errors };
  }

  // Check journey
  const journeyResult = validateEventJourney(event, 'plan');
  if (!journeyResult.isValid) {
    return journeyResult;
  }

  // Check required data fields
  const requiredFields = ['benefitId', 'benefitType', 'usedAt', 'value'];
  const fieldsResult = validateEventDataFields(event, requiredFields);
  if (!fieldsResult.isValid) {
    return fieldsResult;
  }

  // Convert to DTO for class-validator validation
  const eventInstance = plainToInstance(BenefitEventDto, event);
  const errors = await validate(eventInstance);

  if (errors.length > 0) {
    const formattedErrors = errors.map(error => {
      const constraints = error.constraints || {};
      return Object.values(constraints).join(', ');
    });

    return { isValid: false, errors: formattedErrors };
  }

  // Validate value is positive
  const valueResult = validateNumericRange(event, 'data.value', 0);
  if (!valueResult.isValid) {
    return valueResult;
  }

  return { isValid: true, errors: [] };
}

// =========================================================================
// TYPE GUARDS
// =========================================================================

/**
 * Type guard for health metric events
 * 
 * @param event - The event to check
 * @returns True if the event is a valid health metric event
 */
export function isHealthMetricEvent(event: any): event is HealthMetricEventDto {
  return event?.type === EventTypes.HEALTH_METRIC_RECORDED;
}

/**
 * Type guard for health goal events
 * 
 * @param event - The event to check
 * @returns True if the event is a valid health goal event
 */
export function isHealthGoalEvent(event: any): event is HealthGoalEventDto {
  return event?.type === EventTypes.HEALTH_GOAL_ACHIEVED;
}

/**
 * Type guard for appointment events
 * 
 * @param event - The event to check
 * @returns True if the event is a valid appointment event
 */
export function isAppointmentEvent(event: any): event is AppointmentEventDto {
  return event?.type === EventTypes.CARE_APPOINTMENT_BOOKED ||
         event?.type === EventTypes.CARE_APPOINTMENT_COMPLETED ||
         event?.type === EventTypes.CARE_APPOINTMENT_CANCELLED;
}

/**
 * Type guard for medication events
 * 
 * @param event - The event to check
 * @returns True if the event is a valid medication event
 */
export function isMedicationEvent(event: any): event is MedicationEventDto {
  return event?.type === EventTypes.CARE_MEDICATION_TAKEN ||
         event?.type === EventTypes.CARE_MEDICATION_MISSED;
}

/**
 * Type guard for claim events
 * 
 * @param event - The event to check
 * @returns True if the event is a valid claim event
 */
export function isClaimEvent(event: any): event is ClaimEventDto {
  return event?.type === EventTypes.PLAN_CLAIM_SUBMITTED ||
         event?.type === EventTypes.PLAN_CLAIM_STATUS_UPDATED;
}

/**
 * Type guard for benefit events
 * 
 * @param event - The event to check
 * @returns True if the event is a valid benefit event
 */
export function isBenefitEvent(event: any): event is BenefitEventDto {
  return event?.type === EventTypes.PLAN_BENEFIT_UTILIZED;
}

/**
 * Type guard for health journey events
 * 
 * @param event - The event to check
 * @returns True if the event belongs to the health journey
 */
export function isHealthJourneyEvent(event: any): boolean {
  return event?.type?.startsWith('HEALTH_') || event?.journey === 'health';
}

/**
 * Type guard for care journey events
 * 
 * @param event - The event to check
 * @returns True if the event belongs to the care journey
 */
export function isCareJourneyEvent(event: any): boolean {
  return event?.type?.startsWith('CARE_') || event?.journey === 'care';
}

/**
 * Type guard for plan journey events
 * 
 * @param event - The event to check
 * @returns True if the event belongs to the plan journey
 */
export function isPlanJourneyEvent(event: any): boolean {
  return event?.type?.startsWith('PLAN_') || event?.journey === 'plan';
}

// =========================================================================
// UTILITY FUNCTIONS FOR TESTING INVALID SCENARIOS
// =========================================================================

/**
 * Creates an invalid event by removing required fields
 * 
 * @param event - The base event to modify
 * @param fieldsToRemove - Array of field paths to remove (e.g., 'data.value')
 * @returns A copy of the event with specified fields removed
 */
export function createInvalidEvent(event: any, fieldsToRemove: string[]): any {
  // Create a deep copy of the event
  const invalidEvent = JSON.parse(JSON.stringify(event));
  
  // Remove specified fields
  for (const fieldPath of fieldsToRemove) {
    const pathParts = fieldPath.split('.');
    let current = invalidEvent;
    
    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current[pathParts[i]] === undefined) {
        // Path doesn't exist, nothing to remove
        break;
      }
      current = current[pathParts[i]];
    }
    
    // Remove the field
    const lastPart = pathParts[pathParts.length - 1];
    if (current && current[lastPart] !== undefined) {
      delete current[lastPart];
    }
  }
  
  return invalidEvent;
}

/**
 * Creates an invalid event by modifying field values
 * 
 * @param event - The base event to modify
 * @param fieldModifications - Object mapping field paths to new values
 * @returns A copy of the event with specified fields modified
 */
export function createModifiedEvent(event: any, fieldModifications: Record<string, any>): any {
  // Create a deep copy of the event
  const modifiedEvent = JSON.parse(JSON.stringify(event));
  
  // Apply modifications
  for (const [fieldPath, newValue] of Object.entries(fieldModifications)) {
    const pathParts = fieldPath.split('.');
    let current = modifiedEvent;
    
    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current[pathParts[i]] === undefined) {
        // Create the path if it doesn't exist
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    // Set the new value
    const lastPart = pathParts[pathParts.length - 1];
    current[lastPart] = newValue;
  }
  
  return modifiedEvent;
}

/**
 * Creates an event with an invalid timestamp
 * 
 * @param event - The base event to modify
 * @param invalidTimestamp - The invalid timestamp to set
 * @returns A copy of the event with an invalid timestamp
 */
export function createEventWithInvalidTimestamp(event: any, invalidTimestamp: string): any {
  return createModifiedEvent(event, { timestamp: invalidTimestamp });
}

/**
 * Creates an event with an invalid type
 * 
 * @param event - The base event to modify
 * @param invalidType - The invalid type to set
 * @returns A copy of the event with an invalid type
 */
export function createEventWithInvalidType(event: any, invalidType: string): any {
  return createModifiedEvent(event, { type: invalidType });
}

/**
 * Creates an event with an invalid journey
 * 
 * @param event - The base event to modify
 * @param invalidJourney - The invalid journey to set
 * @returns A copy of the event with an invalid journey
 */
export function createEventWithInvalidJourney(event: any, invalidJourney: string): any {
  return createModifiedEvent(event, { journey: invalidJourney });
}

/**
 * Creates an event with an invalid user ID
 * 
 * @param event - The base event to modify
 * @param invalidUserId - The invalid user ID to set
 * @returns A copy of the event with an invalid user ID
 */
export function createEventWithInvalidUserId(event: any, invalidUserId: string): any {
  return createModifiedEvent(event, { userId: invalidUserId });
}

/**
 * Creates an event with invalid data
 * 
 * @param event - The base event to modify
 * @param invalidData - The invalid data to set
 * @returns A copy of the event with invalid data
 */
export function createEventWithInvalidData(event: any, invalidData: any): any {
  return createModifiedEvent(event, { data: invalidData });
}

// Export all validators and utilities
export const eventValidators = {
  // Base validators
  validateBaseEvent,
  validateEventType,
  validateEventJourney,
  validateEventTimestamp,
  validateEventDataFields,
  validateNumericRange,
  
  // Health journey validators
  validateHealthMetricEvent,
  validateHealthGoalEvent,
  validateHealthDeviceEvent,
  
  // Care journey validators
  validateAppointmentBookedEvent,
  validateMedicationTakenEvent,
  validateTelemedicineSessionEvent,
  
  // Plan journey validators
  validateClaimSubmittedEvent,
  validateClaimStatusUpdatedEvent,
  validateBenefitUsedEvent,
  
  // Type guards
  isHealthMetricEvent,
  isHealthGoalEvent,
  isAppointmentEvent,
  isMedicationEvent,
  isClaimEvent,
  isBenefitEvent,
  isHealthJourneyEvent,
  isCareJourneyEvent,
  isPlanJourneyEvent,
  
  // Utilities for testing invalid scenarios
  createInvalidEvent,
  createModifiedEvent,
  createEventWithInvalidTimestamp,
  createEventWithInvalidType,
  createEventWithInvalidJourney,
  createEventWithInvalidUserId,
  createEventWithInvalidData,
};

export default eventValidators;