/**
 * @file validation.helper.ts
 * @description Helper utilities for testing event validation logic across all event types.
 * This file provides functions to validate event DTOs, test validation rules, check error handling,
 * and verify schema compliance. These utilities ensure consistent validation testing across the
 * event system and simplify test implementation for validation-related functionality.
 */

import { validate, ValidationError } from 'class-validator';
import { ZodSchema, z } from 'zod';
import { BaseEvent } from '../../../src/interfaces/base-event.interface';
import { ValidationResult, ValidationError as EventValidationError } from '../../../src/interfaces/event-validation.interface';
import { JourneyType } from '../../../src/interfaces/journey-events.interface';
import { validateEvent, validateEventPayloadStructure } from '../../../src/dto/validation';

/**
 * Creates a valid test event for the specified journey and type.
 * Useful for testing validation rules with valid data.
 * 
 * @param journey The journey type for the event
 * @param type The event type
 * @param payload The event payload data
 * @param userId Optional user ID (defaults to a test UUID)
 * @returns A valid event object for testing
 */
export function createValidTestEvent<T = any>(
  journey: JourneyType | string,
  type: string,
  payload: T,
  userId: string = '550e8400-e29b-41d4-a716-446655440000'
): BaseEvent<T> {
  return {
    eventId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test-helper',
    journey: journey as JourneyType,
    userId,
    payload,
    metadata: {
      correlationId: `corr-test-${Date.now()}`,
      isTest: true
    }
  };
}

/**
 * Creates an invalid test event with specific validation errors.
 * Useful for testing error handling and validation failure scenarios.
 * 
 * @param journey The journey type for the event
 * @param type The event type
 * @param payload The event payload data (can be intentionally invalid)
 * @param invalidFields Object specifying which fields to make invalid and how
 * @returns An invalid event object for testing
 */
export function createInvalidTestEvent<T = any>(
  journey: JourneyType | string,
  type: string,
  payload: T,
  invalidFields: {
    missingEventId?: boolean;
    emptyType?: boolean;
    invalidTimestamp?: boolean;
    missingVersion?: boolean;
    missingSource?: boolean;
    invalidJourney?: boolean;
    missingUserId?: boolean;
    nullPayload?: boolean;
  } = {}
): Partial<BaseEvent<T>> {
  const event: Partial<BaseEvent<T>> = {
    eventId: invalidFields.missingEventId ? undefined : `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: invalidFields.emptyType ? '' : type,
    timestamp: invalidFields.invalidTimestamp ? 'not-a-date' : new Date().toISOString(),
    version: invalidFields.missingVersion ? undefined : '1.0.0',
    source: invalidFields.missingSource ? undefined : 'test-helper',
    journey: invalidFields.invalidJourney ? 'invalid-journey' as JourneyType : journey as JourneyType,
    userId: invalidFields.missingUserId ? undefined : '550e8400-e29b-41d4-a716-446655440000',
    payload: invalidFields.nullPayload ? null : payload,
    metadata: {
      correlationId: `corr-test-${Date.now()}`,
      isTest: true
    }
  };

  return event;
}

/**
 * Creates a set of test events for a specific journey.
 * Useful for testing journey-specific validation rules.
 * 
 * @param journey The journey type for the events
 * @param count Number of test events to create
 * @param eventTypes Array of event types to use (will cycle through them)
 * @returns Array of test events
 */
export function createJourneyTestEvents(
  journey: JourneyType,
  count: number = 5,
  eventTypes: string[] = []
): BaseEvent[] {
  const events: BaseEvent[] = [];
  
  // Default event types if none provided
  if (eventTypes.length === 0) {
    switch (journey) {
      case JourneyType.HEALTH:
        eventTypes = ['HEALTH_METRIC_RECORDED', 'GOAL_ACHIEVED', 'DEVICE_CONNECTED'];
        break;
      case JourneyType.CARE:
        eventTypes = ['APPOINTMENT_BOOKED', 'MEDICATION_TAKEN', 'TELEMEDICINE_SESSION_COMPLETED'];
        break;
      case JourneyType.PLAN:
        eventTypes = ['CLAIM_SUBMITTED', 'BENEFIT_UTILIZED', 'PLAN_SELECTED'];
        break;
      default:
        eventTypes = ['TEST_EVENT_TYPE'];
    }
  }
  
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[i % eventTypes.length];
    const payload = createTestPayloadForEventType(journey, eventType);
    
    events.push(createValidTestEvent(journey, eventType, payload));
  }
  
  return events;
}

/**
 * Creates a test payload for a specific event type.
 * Generates appropriate test data based on the journey and event type.
 * 
 * @param journey The journey type for the event
 * @param eventType The specific event type
 * @returns A test payload appropriate for the event type
 */
export function createTestPayloadForEventType(
  journey: JourneyType | string,
  eventType: string
): any {
  switch (journey) {
    case JourneyType.HEALTH:
      return createHealthEventPayload(eventType);
    case JourneyType.CARE:
      return createCareEventPayload(eventType);
    case JourneyType.PLAN:
      return createPlanEventPayload(eventType);
    default:
      return { testField: 'test-value' };
  }
}

/**
 * Creates a test payload for health journey events.
 * 
 * @param eventType The specific health event type
 * @returns A test payload for the health event type
 */
function createHealthEventPayload(eventType: string): any {
  switch (eventType) {
    case 'HEALTH_METRIC_RECORDED':
      return {
        metricType: 'HEART_RATE',
        metricValue: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual-entry'
      };
    case 'GOAL_ACHIEVED':
      return {
        goalId: `goal-${Date.now()}`,
        goalType: 'STEPS',
        targetValue: 10000,
        achievedValue: 10500,
        daysToAchieve: 5
      };
    case 'DEVICE_CONNECTED':
      return {
        deviceId: `device-${Date.now()}`,
        deviceType: 'Smartwatch',
        connectionDate: new Date().toISOString(),
        isFirstConnection: true
      };
    case 'HEALTH_CHECK_COMPLETED':
      return {
        checkId: `check-${Date.now()}`,
        completionDate: new Date().toISOString(),
        score: 85,
        recommendations: ['Increase water intake', 'Improve sleep schedule']
      };
    default:
      return { healthData: 'generic-health-data' };
  }
}

/**
 * Creates a test payload for care journey events.
 * 
 * @param eventType The specific care event type
 * @returns A test payload for the care event type
 */
function createCareEventPayload(eventType: string): any {
  switch (eventType) {
    case 'APPOINTMENT_BOOKED':
      return {
        appointmentId: `appt-${Date.now()}`,
        providerId: `provider-${Math.floor(Math.random() * 1000)}`,
        appointmentType: 'CONSULTATION',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        isFirstAppointment: false
      };
    case 'MEDICATION_TAKEN':
      return {
        medicationId: `med-${Date.now()}`,
        medicationName: 'Test Medication',
        dosage: '10mg',
        takenDate: new Date().toISOString(),
        takenOnTime: true
      };
    case 'TELEMEDICINE_SESSION_COMPLETED':
      return {
        sessionId: `session-${Date.now()}`,
        providerId: `provider-${Math.floor(Math.random() * 1000)}`,
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date().toISOString(),
        duration: 60
      };
    case 'CARE_PLAN_CREATED':
      return {
        planId: `plan-${Date.now()}`,
        planType: 'RECOVERY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days later
        activitiesCount: 5
      };
    default:
      return { careData: 'generic-care-data' };
  }
}

/**
 * Creates a test payload for plan journey events.
 * 
 * @param eventType The specific plan event type
 * @returns A test payload for the plan event type
 */
function createPlanEventPayload(eventType: string): any {
  switch (eventType) {
    case 'CLAIM_SUBMITTED':
      return {
        claimId: `claim-${Date.now()}`,
        amount: 150.75,
        claimType: 'MEDICAL_CONSULTATION',
        submissionDate: new Date().toISOString(),
        hasDocuments: true,
        isComplete: true
      };
    case 'BENEFIT_UTILIZED':
      return {
        benefitId: `benefit-${Date.now()}`,
        benefitType: 'ANNUAL_CHECKUP',
        utilizationDate: new Date().toISOString(),
        serviceProvider: 'Test Provider',
        isFirstUtilization: false
      };
    case 'PLAN_SELECTED':
      return {
        planId: `plan-${Date.now()}`,
        planName: 'Premium Health Plan',
        planType: 'PREMIUM',
        selectionDate: new Date().toISOString(),
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        premium: 299.99
      };
    case 'PLAN_DOCUMENT_UPLOADED':
      return {
        documentId: `doc-${Date.now()}`,
        documentType: 'MEDICAL_RECEIPT',
        uploadDate: new Date().toISOString(),
        fileSize: 1024 * 1024, // 1MB
        fileName: 'receipt.pdf'
      };
    default:
      return { planData: 'generic-plan-data' };
  }
}

/**
 * Tests validation rules against an event object using class-validator.
 * Useful for testing DTO validation rules in isolation.
 * 
 * @param eventObject The event object to validate
 * @returns Promise resolving to validation errors (empty array if valid)
 */
export async function testValidationRules<T extends object>(eventObject: T): Promise<ValidationError[]> {
  return validate(eventObject, {
    validationError: { target: false },
    forbidUnknownValues: true
  });
}

/**
 * Extracts validation error messages from class-validator errors.
 * Simplifies assertion testing by providing just the error messages.
 * 
 * @param errors Array of ValidationError objects from class-validator
 * @returns Array of error message strings
 */
export function extractValidationErrorMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  
  function extractFromError(error: ValidationError) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    
    if (error.children && error.children.length > 0) {
      error.children.forEach(child => extractFromError(child));
    }
  }
  
  errors.forEach(error => extractFromError(error));
  
  return messages;
}

/**
 * Tests a Zod schema against an event object.
 * Useful for testing schema validation in isolation.
 * 
 * @param schema The Zod schema to test
 * @param eventObject The event object to validate
 * @returns Object with validation result and any error messages
 */
export function testZodSchema<T>(schema: ZodSchema, eventObject: T): {
  isValid: boolean;
  errors?: string[];
} {
  const result = schema.safeParse(eventObject);
  
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
  }
  
  return { isValid: true };
}

/**
 * Creates a test validation result object.
 * Useful for mocking validation results in tests.
 * 
 * @param isValid Whether the validation is successful
 * @param errors Optional array of validation errors
 * @returns A ValidationResult object
 */
export function createTestValidationResult(isValid: boolean, errors: string[] = []): ValidationResult {
  const validationErrors: EventValidationError[] = errors.map((message, index) => ({
    code: `TEST_ERROR_${index + 1}`,
    message,
    path: `test.path.${index}`,
    context: { testContext: true }
  }));
  
  return {
    isValid,
    errors: validationErrors,
    metadata: { testMetadata: true }
  };
}

/**
 * Tests event validation with both class-validator and Zod.
 * Combines multiple validation approaches for comprehensive testing.
 * 
 * @param event The event object to validate
 * @param schema Optional Zod schema for additional validation
 * @returns Promise resolving to a validation result object
 */
export async function testEventValidation<T extends object>(
  event: T,
  schema?: ZodSchema
): Promise<{ isValid: boolean; errors?: string[] }> {
  // First validate with class-validator
  const classValidatorErrors = await testValidationRules(event);
  if (classValidatorErrors.length > 0) {
    return {
      isValid: false,
      errors: extractValidationErrorMessages(classValidatorErrors)
    };
  }
  
  // Then validate with Zod if a schema is provided
  if (schema) {
    const zodResult = testZodSchema(schema, event);
    if (!zodResult.isValid) {
      return zodResult;
    }
  }
  
  // Finally, validate the event structure
  if ('type' in event && 'data' in event) {
    const structureResult = validateEventPayloadStructure(event as any);
    if (!structureResult.isValid) {
      return structureResult;
    }
  }
  
  return { isValid: true };
}

/**
 * Creates a test schema for validating events.
 * Useful for testing schema evolution and versioning.
 * 
 * @param journeyType The journey type for the schema
 * @param eventType The event type for the schema
 * @param version The schema version
 * @returns A Zod schema for validating events
 */
export function createTestEventSchema(
  journeyType: JourneyType | string,
  eventType: string,
  version: string = '1.0.0'
): ZodSchema {
  // Create a base event schema
  const baseSchema = z.object({
    eventId: z.string().uuid(),
    type: z.literal(eventType),
    timestamp: z.string().datetime(),
    version: z.literal(version),
    source: z.string(),
    journey: z.literal(journeyType),
    userId: z.string().uuid(),
    metadata: z.object({
      correlationId: z.string().optional(),
      isTest: z.boolean().optional()
    }).optional()
  });
  
  // Add payload schema based on journey and event type
  let payloadSchema: ZodSchema;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      payloadSchema = createHealthPayloadSchema(eventType, version);
      break;
    case JourneyType.CARE:
      payloadSchema = createCarePayloadSchema(eventType, version);
      break;
    case JourneyType.PLAN:
      payloadSchema = createPlanPayloadSchema(eventType, version);
      break;
    default:
      payloadSchema = z.object({}).passthrough();
  }
  
  // Combine base schema with payload schema
  return baseSchema.extend({
    payload: payloadSchema
  });
}

/**
 * Creates a schema for health journey event payloads.
 * 
 * @param eventType The specific health event type
 * @param version The schema version
 * @returns A Zod schema for the health event payload
 */
function createHealthPayloadSchema(eventType: string, version: string): ZodSchema {
  switch (eventType) {
    case 'HEALTH_METRIC_RECORDED':
      return z.object({
        metricType: z.string(),
        metricValue: z.number().positive(),
        unit: z.string(),
        timestamp: z.string().datetime(),
        source: z.string().optional()
      });
    case 'GOAL_ACHIEVED':
      return z.object({
        goalId: z.string(),
        goalType: z.string(),
        targetValue: z.number().positive(),
        achievedValue: z.number().positive(),
        daysToAchieve: z.number().int().positive()
      });
    case 'DEVICE_CONNECTED':
      return z.object({
        deviceId: z.string(),
        deviceType: z.string(),
        connectionDate: z.string().datetime(),
        isFirstConnection: z.boolean()
      });
    default:
      return z.object({}).passthrough();
  }
}

/**
 * Creates a schema for care journey event payloads.
 * 
 * @param eventType The specific care event type
 * @param version The schema version
 * @returns A Zod schema for the care event payload
 */
function createCarePayloadSchema(eventType: string, version: string): ZodSchema {
  switch (eventType) {
    case 'APPOINTMENT_BOOKED':
      return z.object({
        appointmentId: z.string(),
        providerId: z.string(),
        appointmentType: z.string(),
        scheduledDate: z.string().datetime(),
        isFirstAppointment: z.boolean().optional()
      });
    case 'MEDICATION_TAKEN':
      return z.object({
        medicationId: z.string(),
        medicationName: z.string(),
        dosage: z.string(),
        takenDate: z.string().datetime(),
        takenOnTime: z.boolean()
      });
    case 'TELEMEDICINE_SESSION_COMPLETED':
      return z.object({
        sessionId: z.string(),
        providerId: z.string(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        duration: z.number().int().positive()
      });
    default:
      return z.object({}).passthrough();
  }
}

/**
 * Creates a schema for plan journey event payloads.
 * 
 * @param eventType The specific plan event type
 * @param version The schema version
 * @returns A Zod schema for the plan event payload
 */
function createPlanPayloadSchema(eventType: string, version: string): ZodSchema {
  switch (eventType) {
    case 'CLAIM_SUBMITTED':
      return z.object({
        claimId: z.string(),
        amount: z.number().positive(),
        claimType: z.string(),
        submissionDate: z.string().datetime(),
        hasDocuments: z.boolean(),
        isComplete: z.boolean()
      });
    case 'BENEFIT_UTILIZED':
      return z.object({
        benefitId: z.string(),
        benefitType: z.string(),
        utilizationDate: z.string().datetime(),
        serviceProvider: z.string().optional(),
        isFirstUtilization: z.boolean()
      });
    case 'PLAN_SELECTED':
      return z.object({
        planId: z.string(),
        planName: z.string(),
        planType: z.string(),
        selectionDate: z.string().datetime(),
        startDate: z.string().datetime(),
        premium: z.number().positive()
      });
    default:
      return z.object({}).passthrough();
  }
}

/**
 * Tests schema evolution by validating an event against multiple schema versions.
 * Useful for testing backward compatibility of event schemas.
 * 
 * @param event The event object to validate
 * @param versions Array of schema versions to test against
 * @returns Object with validation results for each version
 */
export function testSchemaEvolution<T extends object>(
  event: T,
  versions: string[] = ['1.0.0', '1.1.0', '2.0.0']
): Record<string, { isValid: boolean; errors?: string[] }> {
  if (!('type' in event) || !('journey' in event)) {
    throw new Error('Event must have type and journey properties for schema evolution testing');
  }
  
  const type = (event as any).type;
  const journey = (event as any).journey;
  
  const results: Record<string, { isValid: boolean; errors?: string[] }> = {};
  
  for (const version of versions) {
    const schema = createTestEventSchema(journey, type, version);
    results[version] = testZodSchema(schema, event);
  }
  
  return results;
}

/**
 * Creates a test event with a specific schema version.
 * Useful for testing schema versioning and compatibility.
 * 
 * @param journey The journey type for the event
 * @param type The event type
 * @param version The schema version to use
 * @param payload The event payload data
 * @returns A versioned event object for testing
 */
export function createVersionedTestEvent<T = any>(
  journey: JourneyType | string,
  type: string,
  version: string,
  payload: T
): BaseEvent<T> {
  return {
    eventId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    version,
    source: 'test-helper',
    journey: journey as JourneyType,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    payload,
    metadata: {
      correlationId: `corr-test-${Date.now()}`,
      isTest: true,
      schemaVersion: version
    }
  };
}

/**
 * Tests custom validators and decorators against an event object.
 * Useful for testing specialized validation logic.
 * 
 * @param validator The validator function to test
 * @param event The event object to validate
 * @returns Validation result from the custom validator
 */
export function testCustomValidator<T>(
  validator: (event: T) => ValidationResult | Promise<ValidationResult>,
  event: T
): Promise<ValidationResult> {
  return Promise.resolve(validator(event));
}

/**
 * Creates a set of test events with varying validation issues.
 * Useful for comprehensive testing of validation error handling.
 * 
 * @param journey The journey type for the events
 * @param type The event type
 * @returns Array of test events with various validation issues
 */
export function createValidationTestSuite(
  journey: JourneyType | string,
  type: string
): Array<{ event: Partial<BaseEvent>; expectedErrors: string[] }> {
  const validPayload = createTestPayloadForEventType(journey, type);
  
  return [
    // Valid event (should have no errors)
    {
      event: createValidTestEvent(journey, type, validPayload),
      expectedErrors: []
    },
    // Missing eventId
    {
      event: createInvalidTestEvent(journey, type, validPayload, { missingEventId: true }),
      expectedErrors: ['Missing required field: eventId']
    },
    // Empty type
    {
      event: createInvalidTestEvent(journey, type, validPayload, { emptyType: true }),
      expectedErrors: ['Missing required field: type']
    },
    // Invalid timestamp
    {
      event: createInvalidTestEvent(journey, type, validPayload, { invalidTimestamp: true }),
      expectedErrors: ['timestamp must be a valid ISO date string']
    },
    // Missing version
    {
      event: createInvalidTestEvent(journey, type, validPayload, { missingVersion: true }),
      expectedErrors: ['Missing required field: version']
    },
    // Missing source
    {
      event: createInvalidTestEvent(journey, type, validPayload, { missingSource: true }),
      expectedErrors: ['Missing required field: source']
    },
    // Invalid journey
    {
      event: createInvalidTestEvent(journey, type, validPayload, { invalidJourney: true }),
      expectedErrors: ['journey must be one of the following values: health, care, plan']
    },
    // Missing userId
    {
      event: createInvalidTestEvent(journey, type, validPayload, { missingUserId: true }),
      expectedErrors: ['Missing required field: userId']
    },
    // Null payload
    {
      event: createInvalidTestEvent(journey, type, validPayload, { nullPayload: true }),
      expectedErrors: ['Missing required field: payload', 'payload must be an object']
    }
  ];
}

/**
 * Tests validation error handling by validating a set of events and comparing results.
 * Useful for verifying that validation errors are properly detected and reported.
 * 
 * @param validationFn The validation function to test
 * @param testSuite Array of test events with expected errors
 * @returns Promise resolving to an array of test results
 */
export async function testValidationErrorHandling<T>(
  validationFn: (event: T) => Promise<{ isValid: boolean; errors?: string[] }>,
  testSuite: Array<{ event: T; expectedErrors: string[] }>
): Promise<Array<{ passed: boolean; actual: string[]; expected: string[] }>> {
  const results = [];
  
  for (const testCase of testSuite) {
    const validationResult = await validationFn(testCase.event);
    const actualErrors = validationResult.errors || [];
    
    // Check if all expected errors are present
    const allExpectedErrorsPresent = testCase.expectedErrors.every(expected =>
      actualErrors.some(actual => actual.includes(expected))
    );
    
    // For valid events, check that there are no errors
    const isValidAsExpected = 
      testCase.expectedErrors.length === 0 && actualErrors.length === 0;
    
    results.push({
      passed: allExpectedErrorsPresent || isValidAsExpected,
      actual: actualErrors,
      expected: testCase.expectedErrors
    });
  }
  
  return results;
}

/**
 * Creates a test event based on seed data patterns.
 * Useful for testing validation against realistic data patterns.
 * 
 * @param journey The journey type for the event
 * @param type The event type
 * @param seedDataIndex Index in the seed data to use (for variety)
 * @returns A test event based on seed data patterns
 */
export function createSeedBasedTestEvent(
  journey: JourneyType | string,
  type: string,
  seedDataIndex: number = 0
): BaseEvent {
  // Create payload based on seed data patterns
  let payload: any;
  
  switch (journey) {
    case JourneyType.HEALTH:
      payload = createHealthSeedPayload(type, seedDataIndex);
      break;
    case JourneyType.CARE:
      payload = createCareSeedPayload(type, seedDataIndex);
      break;
    case JourneyType.PLAN:
      payload = createPlanSeedPayload(type, seedDataIndex);
      break;
    default:
      payload = { seedIndex: seedDataIndex };
  }
  
  return createValidTestEvent(journey, type, payload);
}

/**
 * Creates a health event payload based on seed data patterns.
 * 
 * @param eventType The specific health event type
 * @param seedIndex Index in the seed data to use
 * @returns A health event payload based on seed data
 */
function createHealthSeedPayload(eventType: string, seedIndex: number): any {
  // Sample health metric types from seed data
  const metricTypes = ['HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'STEPS', 'WEIGHT', 'SLEEP'];
  const metricType = metricTypes[seedIndex % metricTypes.length];
  
  switch (eventType) {
    case 'HEALTH_METRIC_RECORDED':
      // Generate values based on the metric type
      let value: number;
      let unit: string;
      
      switch (metricType) {
        case 'HEART_RATE':
          value = 60 + Math.floor(Math.random() * 40); // 60-100 bpm
          unit = 'bpm';
          break;
        case 'BLOOD_PRESSURE':
          // For blood pressure, we'd typically have systolic/diastolic
          // but for simplicity, we'll just use a single value
          value = 120 + Math.floor(Math.random() * 40); // 120-160 mmHg (systolic)
          unit = 'mmHg';
          break;
        case 'BLOOD_GLUCOSE':
          value = 70 + Math.floor(Math.random() * 30); // 70-100 mg/dL
          unit = 'mg/dL';
          break;
        case 'STEPS':
          value = 5000 + Math.floor(Math.random() * 5000); // 5000-10000 steps
          unit = 'steps';
          break;
        case 'WEIGHT':
          value = 50 + Math.floor(Math.random() * 50); // 50-100 kg
          unit = 'kg';
          break;
        case 'SLEEP':
          value = 5 + Math.floor(Math.random() * 4); // 5-9 hours
          unit = 'hours';
          break;
        default:
          value = 100;
          unit = 'units';
      }
      
      return {
        metricType,
        metricValue: value,
        unit,
        timestamp: new Date().toISOString(),
        source: seedIndex % 2 === 0 ? 'manual-entry' : 'device-sync'
      };
    
    case 'GOAL_ACHIEVED':
      return {
        goalId: `goal-${seedIndex}-${Date.now()}`,
        goalType: metricType,
        targetValue: metricType === 'STEPS' ? 10000 : 100,
        achievedValue: metricType === 'STEPS' ? 10500 : 105,
        daysToAchieve: 1 + seedIndex % 7 // 1-7 days
      };
      
    case 'DEVICE_CONNECTED':
      // Sample device types from seed data
      const deviceTypes = ['Smartwatch', 'Blood Pressure Monitor', 'Glucose Monitor', 'Smart Scale'];
      const deviceType = deviceTypes[seedIndex % deviceTypes.length];
      
      return {
        deviceId: `device-${seedIndex}-${Date.now()}`,
        deviceType,
        connectionDate: new Date().toISOString(),
        isFirstConnection: seedIndex % 3 === 0 // Every 3rd is a first connection
      };
      
    default:
      return { healthData: `seed-based-health-data-${seedIndex}` };
  }
}

/**
 * Creates a care event payload based on seed data patterns.
 * 
 * @param eventType The specific care event type
 * @param seedIndex Index in the seed data to use
 * @returns A care event payload based on seed data
 */
function createCareSeedPayload(eventType: string, seedIndex: number): any {
  // Sample provider specialties from seed data
  const specialties = ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Pediatria', 'Psiquiatria'];
  const specialty = specialties[seedIndex % specialties.length];
  
  switch (eventType) {
    case 'APPOINTMENT_BOOKED':
      return {
        appointmentId: `appt-${seedIndex}-${Date.now()}`,
        providerId: `provider-${seedIndex % 5 + 1}`,
        appointmentType: seedIndex % 2 === 0 ? 'CONSULTATION' : 'FOLLOW_UP',
        scheduledDate: new Date(Date.now() + (86400000 * (seedIndex % 14 + 1))).toISOString(), // 1-14 days in future
        isFirstAppointment: seedIndex % 5 === 0, // Every 5th is a first appointment
        specialty
      };
      
    case 'MEDICATION_TAKEN':
      return {
        medicationId: `med-${seedIndex}-${Date.now()}`,
        medicationName: `Test Medication ${seedIndex % 3 + 1}`,
        dosage: `${(seedIndex % 5 + 1) * 5}mg`,
        takenDate: new Date().toISOString(),
        takenOnTime: seedIndex % 4 !== 0 // 75% taken on time
      };
      
    case 'TELEMEDICINE_SESSION_COMPLETED':
      const duration = (seedIndex % 4 + 1) * 15; // 15, 30, 45, or 60 minutes
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (duration * 60000));
      
      return {
        sessionId: `session-${seedIndex}-${Date.now()}`,
        providerId: `provider-${seedIndex % 5 + 1}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        specialty,
        technicalIssues: seedIndex % 7 === 0 // Occasional technical issues
      };
      
    default:
      return { careData: `seed-based-care-data-${seedIndex}` };
  }
}

/**
 * Creates a plan event payload based on seed data patterns.
 * 
 * @param eventType The specific plan event type
 * @param seedIndex Index in the seed data to use
 * @returns A plan event payload based on seed data
 */
function createPlanSeedPayload(eventType: string, seedIndex: number): any {
  // Sample plan types from seed data
  const planTypes = ['Básico', 'Standard', 'Premium'];
  const planType = planTypes[seedIndex % planTypes.length];
  
  // Sample claim types from seed data
  const claimTypes = ['Consulta Médica', 'Exame', 'Terapia', 'Internação', 'Medicamento'];
  const claimType = claimTypes[seedIndex % claimTypes.length];
  
  switch (eventType) {
    case 'CLAIM_SUBMITTED':
      // Generate amount based on claim type
      let amount: number;
      switch (claimType) {
        case 'Consulta Médica':
          amount = 150 + (seedIndex % 10) * 10; // 150-240
          break;
        case 'Exame':
          amount = 200 + (seedIndex % 20) * 15; // 200-485
          break;
        case 'Terapia':
          amount = 100 + (seedIndex % 10) * 10; // 100-190
          break;
        case 'Internação':
          amount = 1000 + (seedIndex % 10) * 500; // 1000-5500
          break;
        case 'Medicamento':
          amount = 50 + (seedIndex % 10) * 5; // 50-95
          break;
        default:
          amount = 100;
      }
      
      return {
        claimId: `claim-${seedIndex}-${Date.now()}`,
        amount,
        claimType,
        submissionDate: new Date().toISOString(),
        hasDocuments: seedIndex % 3 !== 0, // Most have documents
        isComplete: seedIndex % 5 !== 0 // Most are complete
      };
      
    case 'BENEFIT_UTILIZED':
      return {
        benefitId: `benefit-${seedIndex}-${Date.now()}`,
        benefitType: seedIndex % 3 === 0 ? 'ANNUAL_CHECKUP' : 
                     seedIndex % 3 === 1 ? 'SPECIALIST_VISIT' : 'PREVENTIVE_CARE',
        utilizationDate: new Date().toISOString(),
        serviceProvider: `Provider ${seedIndex % 5 + 1}`,
        isFirstUtilization: seedIndex % 7 === 0 // Occasional first utilization
      };
      
    case 'PLAN_SELECTED':
      // Premium amount based on plan type
      let premium: number;
      switch (planType) {
        case 'Básico':
          premium = 199.99;
          break;
        case 'Standard':
          premium = 299.99;
          break;
        case 'Premium':
          premium = 499.99;
          break;
        default:
          premium = 199.99;
      }
      
      return {
        planId: `plan-${seedIndex}-${Date.now()}`,
        planName: `${planType} Health Plan`,
        planType,
        selectionDate: new Date().toISOString(),
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        premium,
        isUpgrade: seedIndex % 2 === 0 // 50% are upgrades
      };
      
    default:
      return { planData: `seed-based-plan-data-${seedIndex}` };
  }
}