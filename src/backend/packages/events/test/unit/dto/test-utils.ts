/**
 * Test utilities for event DTOs
 * 
 * This file provides utility functions and fixtures for testing event DTOs, including:
 * - Factory functions for creating valid test events for each journey
 * - Validation helper functions for common test patterns
 * - Type-safe mock data generators for all event types
 * - Utilities for testing validation errors and edge cases
 */

import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

// Import all DTOs
import { BaseEventDto } from '../../../src/dto/base-event.dto';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { VersionDto } from '../../../src/dto/version.dto';
import { HealthEventDto } from '../../../src/dto/health-event.dto';
import { CareEventDto } from '../../../src/dto/care-event.dto';
import { PlanEventDto } from '../../../src/dto/plan-event.dto';
import { HealthMetricEventDto } from '../../../src/dto/health-metric-event.dto';
import { HealthGoalEventDto } from '../../../src/dto/health-goal-event.dto';
import { AppointmentEventDto } from '../../../src/dto/appointment-event.dto';
import { MedicationEventDto } from '../../../src/dto/medication-event.dto';
import { ClaimEventDto } from '../../../src/dto/claim-event.dto';
import { BenefitEventDto } from '../../../src/dto/benefit-event.dto';

// Import event types enum
import { EventTypes } from '../../../src/dto/event-types.enum';

// Types for test data
export type TestEventOptions = {
  userId?: string;
  journey?: 'health' | 'care' | 'plan';
  timestamp?: string;
  metadata?: Partial<EventMetadataDto>;
  version?: string;
  [key: string]: any; // Additional properties for specific event types
};

/**
 * Validation result interface for test assertions
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorMessages: string[];
  errorCount: number;
  hasErrorForProperty: (property: string) => boolean;
  getErrorsForProperty: (property: string) => ValidationError[];
}

/**
 * Validates a DTO instance and returns a structured validation result
 * 
 * @param instance - The DTO instance to validate
 * @returns A promise resolving to a ValidationResult object
 */
export async function validateDto<T extends object>(instance: T): Promise<ValidationResult> {
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  });

  const errorMessages = extractErrorMessages(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    errorMessages,
    errorCount: errors.length,
    hasErrorForProperty: (property: string) => {
      return errors.some(error => error.property === property);
    },
    getErrorsForProperty: (property: string) => {
      return errors.filter(error => error.property === property);
    }
  };
}

/**
 * Extracts human-readable error messages from ValidationError objects
 * 
 * @param errors - Array of ValidationError objects
 * @returns Array of error message strings
 */
export function extractErrorMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  
  function processError(error: ValidationError, prefix = '') {
    const property = prefix ? `${prefix}.${error.property}` : error.property;
    
    if (error.constraints) {
      Object.values(error.constraints).forEach(message => {
        messages.push(`${property}: ${message}`);
      });
    }
    
    if (error.children && error.children.length > 0) {
      error.children.forEach(childError => {
        processError(childError, property);
      });
    }
  }
  
  errors.forEach(error => processError(error));
  return messages;
}

/**
 * Creates a plain object with default values for a base event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with base event properties
 */
export function createBaseEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    eventId: options.eventId || uuidv4(),
    type: options.type || EventTypes.HEALTH.METRIC_RECORDED,
    userId: options.userId || uuidv4(),
    journey: options.journey || 'health',
    timestamp: options.timestamp || new Date().toISOString(),
    metadata: options.metadata || createEventMetadataData(),
    data: options.data || {},
    ...options
  };
}

/**
 * Creates a valid BaseEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A BaseEventDto instance
 */
export function createBaseEventDto(options: TestEventOptions = {}): BaseEventDto {
  const data = createBaseEventData(options);
  return plainToInstance(BaseEventDto, data);
}

/**
 * Creates a plain object with default values for event metadata
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with event metadata properties
 */
export function createEventMetadataData(options: Partial<EventMetadataDto> = {}): Record<string, any> {
  return {
    source: options.source || 'test-service',
    correlationId: options.correlationId || uuidv4(),
    version: options.version || '1.0.0',
    ...options
  };
}

/**
 * Creates a valid EventMetadataDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns An EventMetadataDto instance
 */
export function createEventMetadataDto(options: Partial<EventMetadataDto> = {}): EventMetadataDto {
  const data = createEventMetadataData(options);
  return plainToInstance(EventMetadataDto, data);
}

/**
 * Creates a plain object with default values for a version DTO
 * 
 * @param version - Optional version string (defaults to '1.0.0')
 * @returns A plain object with version properties
 */
export function createVersionData(version: string = '1.0.0'): Record<string, any> {
  return { version };
}

/**
 * Creates a valid VersionDto instance
 * 
 * @param version - Optional version string (defaults to '1.0.0')
 * @returns A VersionDto instance
 */
export function createVersionDto(version: string = '1.0.0'): VersionDto {
  const data = createVersionData(version);
  return plainToInstance(VersionDto, data);
}

// Health Journey Event Factories

/**
 * Creates a plain object with default values for a health event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with health event properties
 */
export function createHealthEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    ...createBaseEventData({
      journey: 'health',
      type: options.type || EventTypes.HEALTH.METRIC_RECORDED,
      ...options
    }),
    data: options.data || {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'manual',
      ...options.data
    }
  };
}

/**
 * Creates a valid HealthEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A HealthEventDto instance
 */
export function createHealthEventDto(options: TestEventOptions = {}): HealthEventDto {
  const data = createHealthEventData(options);
  return plainToInstance(HealthEventDto, data);
}

/**
 * Creates a plain object with default values for a health metric event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with health metric event properties
 */
export function createHealthMetricEventData(options: TestEventOptions = {}): Record<string, any> {
  const metricType = options.metricType || 'HEART_RATE';
  let defaultValue = 75;
  let defaultUnit = 'bpm';
  
  // Set appropriate defaults based on metric type
  switch (metricType) {
    case 'BLOOD_PRESSURE':
      defaultValue = { systolic: 120, diastolic: 80 };
      defaultUnit = 'mmHg';
      break;
    case 'BLOOD_GLUCOSE':
      defaultValue = 95;
      defaultUnit = 'mg/dL';
      break;
    case 'STEPS':
      defaultValue = 8000;
      defaultUnit = 'steps';
      break;
    case 'WEIGHT':
      defaultValue = 70.5;
      defaultUnit = 'kg';
      break;
    case 'SLEEP':
      defaultValue = 7.5;
      defaultUnit = 'hours';
      break;
  }
  
  return {
    ...createBaseEventData({
      journey: 'health',
      type: EventTypes.HEALTH.METRIC_RECORDED,
      ...options
    }),
    data: {
      metricType,
      value: options.value !== undefined ? options.value : defaultValue,
      unit: options.unit || defaultUnit,
      recordedAt: options.recordedAt || new Date().toISOString(),
      source: options.source || 'manual',
      deviceId: options.deviceId,
      notes: options.notes,
      ...options.data
    }
  };
}

/**
 * Creates a valid HealthMetricEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A HealthMetricEventDto instance
 */
export function createHealthMetricEventDto(options: TestEventOptions = {}): HealthMetricEventDto {
  const data = createHealthMetricEventData(options);
  return plainToInstance(HealthMetricEventDto, data);
}

/**
 * Creates a plain object with default values for a health goal event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with health goal event properties
 */
export function createHealthGoalEventData(options: TestEventOptions = {}): Record<string, any> {
  const goalType = options.goalType || 'STEPS';
  let defaultTarget = 10000;
  let defaultUnit = 'steps';
  let defaultCurrentValue = 8000;
  
  // Set appropriate defaults based on goal type
  switch (goalType) {
    case 'WEIGHT':
      defaultTarget = 70;
      defaultUnit = 'kg';
      defaultCurrentValue = 75;
      break;
    case 'SLEEP':
      defaultTarget = 8;
      defaultUnit = 'hours';
      defaultCurrentValue = 7;
      break;
    case 'HEART_RATE':
      defaultTarget = 60;
      defaultUnit = 'bpm';
      defaultCurrentValue = 65;
      break;
  }
  
  return {
    ...createBaseEventData({
      journey: 'health',
      type: options.type || EventTypes.HEALTH.GOAL_CREATED,
      ...options
    }),
    data: {
      goalId: options.goalId || uuidv4(),
      goalType,
      target: options.target !== undefined ? options.target : defaultTarget,
      unit: options.unit || defaultUnit,
      currentValue: options.currentValue !== undefined ? options.currentValue : defaultCurrentValue,
      startDate: options.startDate || new Date().toISOString(),
      endDate: options.endDate,
      status: options.status || 'active',
      progress: options.progress !== undefined ? options.progress : (defaultCurrentValue / defaultTarget * 100),
      ...options.data
    }
  };
}

/**
 * Creates a valid HealthGoalEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A HealthGoalEventDto instance
 */
export function createHealthGoalEventDto(options: TestEventOptions = {}): HealthGoalEventDto {
  const data = createHealthGoalEventData(options);
  return plainToInstance(HealthGoalEventDto, data);
}

// Care Journey Event Factories

/**
 * Creates a plain object with default values for a care event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with care event properties
 */
export function createCareEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    ...createBaseEventData({
      journey: 'care',
      type: options.type || EventTypes.CARE.APPOINTMENT_BOOKED,
      ...options
    }),
    data: options.data || {
      appointmentId: uuidv4(),
      providerId: uuidv4(),
      specialtyId: uuidv4(),
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      status: 'scheduled',
      ...options.data
    }
  };
}

/**
 * Creates a valid CareEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A CareEventDto instance
 */
export function createCareEventDto(options: TestEventOptions = {}): CareEventDto {
  const data = createCareEventData(options);
  return plainToInstance(CareEventDto, data);
}

/**
 * Creates a plain object with default values for an appointment event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with appointment event properties
 */
export function createAppointmentEventData(options: TestEventOptions = {}): Record<string, any> {
  const appointmentStatus = options.status || 'scheduled';
  const appointmentType = options.appointmentType || 'in-person';
  
  return {
    ...createBaseEventData({
      journey: 'care',
      type: options.type || EventTypes.CARE.APPOINTMENT_BOOKED,
      ...options
    }),
    data: {
      appointmentId: options.appointmentId || uuidv4(),
      providerId: options.providerId || uuidv4(),
      providerName: options.providerName || 'Dr. Test Provider',
      specialtyId: options.specialtyId || uuidv4(),
      specialtyName: options.specialtyName || 'Cardiologia',
      appointmentType,
      scheduledAt: options.scheduledAt || new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration: options.duration || 30, // minutes
      status: appointmentStatus,
      location: options.location || (appointmentType === 'in-person' ? {
        name: 'AUSTA Medical Center',
        address: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100'
      } : null),
      notes: options.notes,
      ...options.data
    }
  };
}

/**
 * Creates a valid AppointmentEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns An AppointmentEventDto instance
 */
export function createAppointmentEventDto(options: TestEventOptions = {}): AppointmentEventDto {
  const data = createAppointmentEventData(options);
  return plainToInstance(AppointmentEventDto, data);
}

/**
 * Creates a plain object with default values for a medication event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with medication event properties
 */
export function createMedicationEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    ...createBaseEventData({
      journey: 'care',
      type: options.type || EventTypes.CARE.MEDICATION_TAKEN,
      ...options
    }),
    data: {
      medicationId: options.medicationId || uuidv4(),
      medicationName: options.medicationName || 'Test Medication',
      dosage: options.dosage || '10mg',
      scheduledTime: options.scheduledTime || new Date().toISOString(),
      takenTime: options.takenTime || new Date().toISOString(),
      status: options.status || 'taken',
      adherence: options.adherence || 'on-time',
      notes: options.notes,
      ...options.data
    }
  };
}

/**
 * Creates a valid MedicationEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A MedicationEventDto instance
 */
export function createMedicationEventDto(options: TestEventOptions = {}): MedicationEventDto {
  const data = createMedicationEventData(options);
  return plainToInstance(MedicationEventDto, data);
}

// Plan Journey Event Factories

/**
 * Creates a plain object with default values for a plan event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with plan event properties
 */
export function createPlanEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    ...createBaseEventData({
      journey: 'plan',
      type: options.type || EventTypes.PLAN.CLAIM_SUBMITTED,
      ...options
    }),
    data: options.data || {
      claimId: uuidv4(),
      claimType: 'Consulta Médica',
      amount: 150.00,
      currency: 'BRL',
      status: 'submitted',
      ...options.data
    }
  };
}

/**
 * Creates a valid PlanEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A PlanEventDto instance
 */
export function createPlanEventDto(options: TestEventOptions = {}): PlanEventDto {
  const data = createPlanEventData(options);
  return plainToInstance(PlanEventDto, data);
}

/**
 * Creates a plain object with default values for a claim event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with claim event properties
 */
export function createClaimEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    ...createBaseEventData({
      journey: 'plan',
      type: options.type || EventTypes.PLAN.CLAIM_SUBMITTED,
      ...options
    }),
    data: {
      claimId: options.claimId || uuidv4(),
      claimType: options.claimType || 'Consulta Médica',
      claimTypeId: options.claimTypeId || uuidv4(),
      amount: options.amount !== undefined ? options.amount : 150.00,
      currency: options.currency || 'BRL',
      serviceDate: options.serviceDate || new Date().toISOString(),
      submissionDate: options.submissionDate || new Date().toISOString(),
      status: options.status || 'submitted',
      providerName: options.providerName || 'Dr. Test Provider',
      providerTaxId: options.providerTaxId || '12345678901',
      documents: options.documents || [
        { id: uuidv4(), type: 'receipt', url: 'https://example.com/receipt.pdf' }
      ],
      notes: options.notes,
      ...options.data
    }
  };
}

/**
 * Creates a valid ClaimEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A ClaimEventDto instance
 */
export function createClaimEventDto(options: TestEventOptions = {}): ClaimEventDto {
  const data = createClaimEventData(options);
  return plainToInstance(ClaimEventDto, data);
}

/**
 * Creates a plain object with default values for a benefit event
 * 
 * @param options - Optional overrides for the default values
 * @returns A plain object with benefit event properties
 */
export function createBenefitEventData(options: TestEventOptions = {}): Record<string, any> {
  return {
    ...createBaseEventData({
      journey: 'plan',
      type: options.type || EventTypes.PLAN.BENEFIT_UTILIZED,
      ...options
    }),
    data: {
      benefitId: options.benefitId || uuidv4(),
      benefitType: options.benefitType || 'discount',
      benefitName: options.benefitName || 'Pharmacy Discount',
      value: options.value !== undefined ? options.value : 15.00,
      valueType: options.valueType || 'percentage',
      utilizationDate: options.utilizationDate || new Date().toISOString(),
      expirationDate: options.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
      status: options.status || 'active',
      partnerName: options.partnerName || 'Test Pharmacy',
      partnerLocation: options.partnerLocation || 'São Paulo, SP',
      notes: options.notes,
      ...options.data
    }
  };
}

/**
 * Creates a valid BenefitEventDto instance
 * 
 * @param options - Optional overrides for the default values
 * @returns A BenefitEventDto instance
 */
export function createBenefitEventDto(options: TestEventOptions = {}): BenefitEventDto {
  const data = createBenefitEventData(options);
  return plainToInstance(BenefitEventDto, data);
}

// Validation Helpers

/**
 * Creates an invalid event by removing required properties
 * 
 * @param eventData - The valid event data to modify
 * @param propertiesToRemove - Array of property paths to remove
 * @returns A modified event object with properties removed
 */
export function createInvalidEvent(eventData: Record<string, any>, propertiesToRemove: string[]): Record<string, any> {
  const invalidEvent = { ...eventData };
  
  propertiesToRemove.forEach(propertyPath => {
    const parts = propertyPath.split('.');
    let current = invalidEvent;
    
    // Navigate to the parent object of the property to remove
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        return; // Property path doesn't exist, nothing to remove
      }
      current = current[parts[i]];
    }
    
    // Remove the property
    const lastPart = parts[parts.length - 1];
    if (current[lastPart] !== undefined) {
      delete current[lastPart];
    }
  });
  
  return invalidEvent;
}

/**
 * Creates an invalid event by setting properties to invalid values
 * 
 * @param eventData - The valid event data to modify
 * @param invalidProperties - Object mapping property paths to invalid values
 * @returns A modified event object with invalid property values
 */
export function createEventWithInvalidValues(
  eventData: Record<string, any>,
  invalidProperties: Record<string, any>
): Record<string, any> {
  const invalidEvent = { ...eventData };
  
  Object.entries(invalidProperties).forEach(([propertyPath, invalidValue]) => {
    const parts = propertyPath.split('.');
    let current = invalidEvent;
    
    // Navigate to the parent object of the property to modify
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        current[parts[i]] = {}; // Create the path if it doesn't exist
      }
      current = current[parts[i]];
    }
    
    // Set the invalid value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = invalidValue;
  });
  
  return invalidEvent;
}

/**
 * Tests if a validation error contains a specific constraint violation
 * 
 * @param errors - Array of ValidationError objects
 * @param property - The property name to check
 * @param constraint - The constraint name to check
 * @returns True if the error for the property contains the specified constraint
 */
export function hasConstraintViolation(
  errors: ValidationError[],
  property: string,
  constraint: string
): boolean {
  const propertyErrors = errors.filter(error => error.property === property);
  
  if (propertyErrors.length === 0) {
    return false;
  }
  
  return propertyErrors.some(error => 
    error.constraints !== undefined && 
    Object.keys(error.constraints).includes(constraint)
  );
}

/**
 * Creates a test event with a specific event type
 * 
 * @param eventType - The event type to use
 * @param options - Optional overrides for the default values
 * @returns A plain object with the specified event type
 */
export function createEventWithType(
  eventType: string,
  options: TestEventOptions = {}
): Record<string, any> {
  // Determine the journey based on the event type prefix
  let journey = 'health';
  if (eventType.startsWith('care.')) {
    journey = 'care';
  } else if (eventType.startsWith('plan.')) {
    journey = 'plan';
  }
  
  // Create the appropriate event based on the event type
  switch (eventType) {
    // Health journey events
    case EventTypes.HEALTH.METRIC_RECORDED:
      return createHealthMetricEventData({ type: eventType, ...options });
    case EventTypes.HEALTH.GOAL_CREATED:
    case EventTypes.HEALTH.GOAL_UPDATED:
    case EventTypes.HEALTH.GOAL_ACHIEVED:
      return createHealthGoalEventData({ type: eventType, ...options });
      
    // Care journey events
    case EventTypes.CARE.APPOINTMENT_BOOKED:
    case EventTypes.CARE.APPOINTMENT_COMPLETED:
    case EventTypes.CARE.APPOINTMENT_CANCELLED:
    case EventTypes.CARE.APPOINTMENT_RESCHEDULED:
      return createAppointmentEventData({ type: eventType, ...options });
    case EventTypes.CARE.MEDICATION_TAKEN:
    case EventTypes.CARE.MEDICATION_SKIPPED:
    case EventTypes.CARE.MEDICATION_SCHEDULED:
      return createMedicationEventData({ type: eventType, ...options });
      
    // Plan journey events
    case EventTypes.PLAN.CLAIM_SUBMITTED:
    case EventTypes.PLAN.CLAIM_APPROVED:
    case EventTypes.PLAN.CLAIM_REJECTED:
    case EventTypes.PLAN.CLAIM_UPDATED:
      return createClaimEventData({ type: eventType, ...options });
    case EventTypes.PLAN.BENEFIT_UTILIZED:
    case EventTypes.PLAN.BENEFIT_REDEEMED:
    case EventTypes.PLAN.BENEFIT_EXPIRED:
      return createBenefitEventData({ type: eventType, ...options });
      
    // Default case - use base event with the specified type
    default:
      return createBaseEventData({ type: eventType, journey, ...options });
  }
}

/**
 * Creates a DTO instance of the appropriate type based on the event type
 * 
 * @param eventType - The event type to use
 * @param options - Optional overrides for the default values
 * @returns A DTO instance for the specified event type
 */
export function createDtoWithType(
  eventType: string,
  options: TestEventOptions = {}
): BaseEventDto {
  const eventData = createEventWithType(eventType, options);
  
  // Determine the appropriate DTO class based on the event type
  switch (eventType) {
    // Health journey events
    case EventTypes.HEALTH.METRIC_RECORDED:
      return plainToInstance(HealthMetricEventDto, eventData);
    case EventTypes.HEALTH.GOAL_CREATED:
    case EventTypes.HEALTH.GOAL_UPDATED:
    case EventTypes.HEALTH.GOAL_ACHIEVED:
      return plainToInstance(HealthGoalEventDto, eventData);
      
    // Care journey events
    case EventTypes.CARE.APPOINTMENT_BOOKED:
    case EventTypes.CARE.APPOINTMENT_COMPLETED:
    case EventTypes.CARE.APPOINTMENT_CANCELLED:
    case EventTypes.CARE.APPOINTMENT_RESCHEDULED:
      return plainToInstance(AppointmentEventDto, eventData);
    case EventTypes.CARE.MEDICATION_TAKEN:
    case EventTypes.CARE.MEDICATION_SKIPPED:
    case EventTypes.CARE.MEDICATION_SCHEDULED:
      return plainToInstance(MedicationEventDto, eventData);
      
    // Plan journey events
    case EventTypes.PLAN.CLAIM_SUBMITTED:
    case EventTypes.PLAN.CLAIM_APPROVED:
    case EventTypes.PLAN.CLAIM_REJECTED:
    case EventTypes.PLAN.CLAIM_UPDATED:
      return plainToInstance(ClaimEventDto, eventData);
    case EventTypes.PLAN.BENEFIT_UTILIZED:
    case EventTypes.PLAN.BENEFIT_REDEEMED:
    case EventTypes.PLAN.BENEFIT_EXPIRED:
      return plainToInstance(BenefitEventDto, eventData);
      
    // Default case - use the journey-specific DTO or base DTO
    default:
      if (eventType.startsWith('health.')) {
        return plainToInstance(HealthEventDto, eventData);
      } else if (eventType.startsWith('care.')) {
        return plainToInstance(CareEventDto, eventData);
      } else if (eventType.startsWith('plan.')) {
        return plainToInstance(PlanEventDto, eventData);
      } else {
        return plainToInstance(BaseEventDto, eventData);
      }
  }
}

/**
 * Generates a batch of test events with different types
 * 
 * @param count - Number of events to generate
 * @param options - Optional overrides for the default values
 * @returns Array of event objects with different types
 */
export function generateEventBatch(
  count: number,
  options: TestEventOptions = {}
): Record<string, any>[] {
  const events: Record<string, any>[] = [];
  const userId = options.userId || uuidv4();
  
  // Define a list of event types to cycle through
  const eventTypes = [
    EventTypes.HEALTH.METRIC_RECORDED,
    EventTypes.HEALTH.GOAL_CREATED,
    EventTypes.HEALTH.GOAL_ACHIEVED,
    EventTypes.CARE.APPOINTMENT_BOOKED,
    EventTypes.CARE.APPOINTMENT_COMPLETED,
    EventTypes.CARE.MEDICATION_TAKEN,
    EventTypes.PLAN.CLAIM_SUBMITTED,
    EventTypes.PLAN.CLAIM_APPROVED,
    EventTypes.PLAN.BENEFIT_UTILIZED
  ];
  
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[i % eventTypes.length];
    events.push(createEventWithType(eventType, { userId, ...options }));
  }
  
  return events;
}

/**
 * Generates a batch of DTO instances with different types
 * 
 * @param count - Number of DTOs to generate
 * @param options - Optional overrides for the default values
 * @returns Array of DTO instances with different types
 */
export function generateDtoBatch(
  count: number,
  options: TestEventOptions = {}
): BaseEventDto[] {
  const events = generateEventBatch(count, options);
  return events.map(eventData => {
    return createDtoWithType(eventData.type, eventData);
  });
}