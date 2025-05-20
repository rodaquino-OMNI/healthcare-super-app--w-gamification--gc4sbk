/**
 * @file validation.helper.ts
 * @description Helper utilities for testing event validation logic across all event types.
 * This file provides functions to validate event DTOs, test validation rules, check error handling,
 * and verify schema compliance. These utilities ensure consistent validation testing across the
 * event system and simplify test implementation for validation-related functionality.
 *
 * @module events/test/unit/helpers
 */

import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PrismaClient } from '@prisma/client';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { ValidationError, formatValidationErrors, validateObject } from '../../../src/dto/validation';
import { EventMetadataDto, EventVersionDto } from '../../../src/dto/event-metadata.dto';
import { VersionedEventDto, compareVersions, isVersionCompatible } from '../../../src/dto/version.dto';
import { ERROR_CODES } from '../../../src/constants/errors.constants';

/**
 * Interface for test case definition
 */
export interface ValidationTestCase<T> {
  description: string;
  data: Partial<T>;
  expectedErrors?: string[];
  shouldPass: boolean;
}

/**
 * Interface for validation test result
 */
export interface ValidationTestResult {
  passed: boolean;
  errors: ValidationError[] | null;
  errorProperties?: string[];
  errorCodes?: string[];
}

/**
 * Creates a valid event metadata object for testing
 * 
 * @param overrides Optional properties to override in the metadata
 * @returns A valid EventMetadataDto instance
 */
export function createTestEventMetadata(overrides: Partial<EventMetadataDto> = {}): EventMetadataDto {
  const metadata = new EventMetadataDto({
    correlationId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: new Date(),
    origin: {
      service: 'test-service',
      instance: 'test-instance',
      component: 'test-component'
    },
    version: new EventVersionDto()
  });

  return { ...metadata, ...overrides };
}

/**
 * Creates a test event with the specified type and data
 * 
 * @param eventType The type of event to create
 * @param data The event data
 * @param metadata Optional event metadata
 * @returns A test event object
 */
export function createTestEvent<T>(eventType: EventType | string, data: T, metadata?: EventMetadataDto): any {
  return {
    type: eventType,
    data,
    metadata: metadata || createTestEventMetadata()
  };
}

/**
 * Creates a versioned test event with the specified type, data, and version
 * 
 * @param eventType The type of event to create
 * @param data The event data
 * @param version The event version
 * @returns A VersionedEventDto instance
 */
export function createVersionedTestEvent<T>(
  eventType: EventType | string,
  data: T,
  version?: string
): VersionedEventDto<T> {
  let versionObj: EventVersionDto | undefined;
  
  if (version) {
    const parts = version.split('.');
    versionObj = new EventVersionDto();
    versionObj.major = parts[0] || '1';
    versionObj.minor = parts[1] || '0';
    versionObj.patch = parts[2] || '0';
  }
  
  return new VersionedEventDto<T>(eventType.toString(), data, versionObj);
}

/**
 * Validates a DTO instance against its class-validator decorators
 * 
 * @param dto The DTO instance to validate
 * @param dtoClass The class of the DTO
 * @returns Promise resolving to validation result
 */
export async function validateDto<T extends object>(
  dto: T,
  dtoClass: new () => T
): Promise<ValidationTestResult> {
  // Convert plain object to class instance if needed
  const instance = dto instanceof dtoClass ? dto : plainToInstance(dtoClass, dto);
  
  // Validate the instance
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false }
  });
  
  if (errors.length === 0) {
    return { passed: true, errors: null };
  }
  
  // Format the errors
  const formattedErrors = formatValidationErrors(errors as any[]);
  
  // Extract error properties and codes
  const errorProperties = formattedErrors.map(error => error.property);
  const errorCodes = formattedErrors.map(error => error.errorCode);
  
  return {
    passed: false,
    errors: formattedErrors,
    errorProperties,
    errorCodes
  };
}

/**
 * Runs a series of validation test cases against a DTO class
 * 
 * @param testCases Array of test cases
 * @param dtoClass The class of the DTO to test
 * @returns Promise resolving to an array of test results
 */
export async function runValidationTestCases<T extends object>(
  testCases: ValidationTestCase<T>[],
  dtoClass: new () => T
): Promise<Array<ValidationTestCase<T> & ValidationTestResult>> {
  const results: Array<ValidationTestCase<T> & ValidationTestResult> = [];
  
  for (const testCase of testCases) {
    const instance = plainToInstance(dtoClass, testCase.data);
    const result = await validateDto(instance, dtoClass);
    
    // Check if the test passed as expected
    const expectedResult = testCase.shouldPass ? result.passed : !result.passed;
    
    // Check if the expected error properties are present
    let expectedErrorsFound = true;
    if (testCase.expectedErrors && testCase.expectedErrors.length > 0 && result.errorProperties) {
      expectedErrorsFound = testCase.expectedErrors.every(prop => result.errorProperties!.includes(prop));
    }
    
    results.push({
      ...testCase,
      ...result,
      passed: expectedResult && (testCase.shouldPass || expectedErrorsFound)
    });
  }
  
  return results;
}

/**
 * Creates test data for health journey events based on seed data patterns
 * 
 * @param eventType The type of health event
 * @returns Test data for the specified event type
 */
export function createHealthEventTestData(eventType: JourneyEvents.Health | string): any {
  switch (eventType) {
    case JourneyEvents.Health.METRIC_RECORDED:
      return {
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        deviceId: '550e8400-e29b-41d4-a716-446655440000'
      };
    case JourneyEvents.Health.GOAL_ACHIEVED:
      return {
        goalId: '550e8400-e29b-41d4-a716-446655440000',
        goalType: 'STEPS_TARGET',
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        achievedAt: new Date().toISOString(),
        progressPercentage: 100
      };
    case JourneyEvents.Health.DEVICE_CONNECTED:
      return {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        deviceType: 'SMARTWATCH',
        deviceName: 'Apple Watch Series 7',
        syncedAt: new Date().toISOString(),
        syncSuccessful: true,
        dataPointsCount: 150,
        metricTypes: ['HEART_RATE', 'STEPS']
      };
    case JourneyEvents.Health.INSIGHT_GENERATED:
      return {
        insightId: '550e8400-e29b-41d4-a716-446655440000',
        insightType: 'TREND_ANALYSIS',
        title: 'Improving Sleep Pattern',
        description: 'Your sleep duration has improved by 15% over the last week.',
        relatedMetricTypes: ['SLEEP'],
        confidenceScore: 85,
        generatedAt: new Date().toISOString(),
        userAcknowledged: false
      };
    default:
      return {};
  }
}

/**
 * Creates test data for care journey events based on seed data patterns
 * 
 * @param eventType The type of care event
 * @returns Test data for the specified event type
 */
export function createCareEventTestData(eventType: JourneyEvents.Care | string): any {
  switch (eventType) {
    case JourneyEvents.Care.APPOINTMENT_BOOKED:
      return {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        providerId: '550e8400-e29b-41d4-a716-446655440001',
        specialtyType: 'Cardiologia',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        bookedAt: new Date().toISOString()
      };
    case JourneyEvents.Care.APPOINTMENT_COMPLETED:
      return {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        providerId: '550e8400-e29b-41d4-a716-446655440001',
        appointmentType: 'in_person',
        scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        completedAt: new Date().toISOString(),
        duration: 30 // 30 minutes
      };
    case JourneyEvents.Care.MEDICATION_TAKEN:
      return {
        medicationId: '550e8400-e29b-41d4-a716-446655440000',
        medicationName: 'Atorvastatina',
        dosage: '20mg',
        takenAt: new Date().toISOString(),
        adherence: 'on_time'
      };
    case JourneyEvents.Care.TELEMEDICINE_STARTED:
      return {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        appointmentId: '550e8400-e29b-41d4-a716-446655440001',
        providerId: '550e8400-e29b-41d4-a716-446655440002',
        startedAt: new Date().toISOString(),
        deviceType: 'mobile'
      };
    default:
      return {};
  }
}

/**
 * Creates test data for plan journey events based on seed data patterns
 * 
 * @param eventType The type of plan event
 * @returns Test data for the specified event type
 */
export function createPlanEventTestData(eventType: JourneyEvents.Plan | string): any {
  switch (eventType) {
    case JourneyEvents.Plan.CLAIM_SUBMITTED:
      return {
        claimId: '550e8400-e29b-41d4-a716-446655440000',
        claimType: 'Consulta Médica',
        providerId: '550e8400-e29b-41d4-a716-446655440001',
        serviceDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        amount: 250.00,
        submittedAt: new Date().toISOString()
      };
    case JourneyEvents.Plan.CLAIM_PROCESSED:
      return {
        claimId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
        amount: 250.00,
        coveredAmount: 200.00,
        processedAt: new Date().toISOString()
      };
    case JourneyEvents.Plan.PLAN_SELECTED:
      return {
        planId: '550e8400-e29b-41d4-a716-446655440000',
        planType: 'Premium',
        coverageLevel: 'family',
        premium: 850.00,
        startDate: new Date(Date.now() + 15 * 86400000).toISOString(), // 15 days from now
        selectedAt: new Date().toISOString()
      };
    case JourneyEvents.Plan.BENEFIT_UTILIZED:
      return {
        benefitId: '550e8400-e29b-41d4-a716-446655440000',
        benefitType: 'wellness',
        providerId: '550e8400-e29b-41d4-a716-446655440001',
        utilizationDate: new Date().toISOString(),
        savingsAmount: 150.00
      };
    default:
      return {};
  }
}

/**
 * Creates test data for gamification events based on seed data patterns
 * 
 * @param eventType The type of gamification event
 * @returns Test data for the specified event type
 */
export function createGamificationEventTestData(eventType: JourneyEvents.Gamification | string): any {
  switch (eventType) {
    case JourneyEvents.Gamification.POINTS_EARNED:
      return {
        sourceType: 'health',
        sourceId: '550e8400-e29b-41d4-a716-446655440000',
        points: 50,
        reason: 'Completed daily step goal',
        earnedAt: new Date().toISOString()
      };
    case JourneyEvents.Gamification.ACHIEVEMENT_UNLOCKED:
      return {
        achievementId: '550e8400-e29b-41d4-a716-446655440000',
        achievementType: 'health-check-streak',
        tier: 'silver',
        points: 100,
        unlockedAt: new Date().toISOString()
      };
    case JourneyEvents.Gamification.LEVEL_UP:
      return {
        previousLevel: 2,
        newLevel: 3,
        totalPoints: 500,
        leveledUpAt: new Date().toISOString()
      };
    case JourneyEvents.Gamification.QUEST_COMPLETED:
      return {
        questId: '550e8400-e29b-41d4-a716-446655440000',
        questType: 'weekly_challenge',
        difficulty: 'medium',
        points: 75,
        completedAt: new Date().toISOString()
      };
    default:
      return {};
  }
}

/**
 * Creates test data for user events based on seed data patterns
 * 
 * @param eventType The type of user event
 * @returns Test data for the specified event type
 */
export function createUserEventTestData(eventType: JourneyEvents.User | string): any {
  switch (eventType) {
    case JourneyEvents.User.PROFILE_COMPLETED:
      return {
        completionPercentage: 100,
        completedSections: ['personal', 'medical', 'insurance', 'preferences'],
        completedAt: new Date().toISOString()
      };
    case JourneyEvents.User.LOGIN:
      return {
        loginMethod: 'password',
        deviceType: 'mobile',
        loginAt: new Date().toISOString()
      };
    case JourneyEvents.User.ONBOARDING_COMPLETED:
      return {
        completedSteps: ['welcome', 'profile', 'journeys', 'notifications'],
        selectedJourneys: ['health', 'care', 'plan'],
        duration: 300, // 5 minutes
        completedAt: new Date().toISOString()
      };
    case JourneyEvents.User.FEEDBACK_SUBMITTED:
      return {
        feedbackType: 'app',
        rating: 4,
        comments: 'Great app, very useful for managing my health!',
        submittedAt: new Date().toISOString()
      };
    default:
      return {};
  }
}

/**
 * Creates test data for any event type based on journey and event type
 * 
 * @param eventType The type of event
 * @returns Test data for the specified event type
 */
export function createEventTestData(eventType: EventType | string): any {
  const eventTypeStr = eventType.toString();
  
  if (eventTypeStr.startsWith('HEALTH_')) {
    return createHealthEventTestData(eventTypeStr);
  } else if (eventTypeStr.startsWith('CARE_')) {
    return createCareEventTestData(eventTypeStr);
  } else if (eventTypeStr.startsWith('PLAN_')) {
    return createPlanEventTestData(eventTypeStr);
  } else if (eventTypeStr.startsWith('GAMIFICATION_')) {
    return createGamificationEventTestData(eventTypeStr);
  } else if (eventTypeStr.startsWith('USER_')) {
    return createUserEventTestData(eventTypeStr);
  }
  
  return {};
}

/**
 * Creates an invalid test case by modifying a valid event data object
 * 
 * @param eventType The type of event
 * @param fieldToInvalidate The field to make invalid
 * @param invalidValue The invalid value to set
 * @returns An object with invalid test data
 */
export function createInvalidEventTestData(
  eventType: EventType | string,
  fieldToInvalidate: string,
  invalidValue: any
): any {
  const validData = createEventTestData(eventType);
  
  // Create a deep copy to avoid modifying the original
  const invalidData = JSON.parse(JSON.stringify(validData));
  
  // Set the invalid value
  if (fieldToInvalidate.includes('.')) {
    // Handle nested fields
    const parts = fieldToInvalidate.split('.');
    let current = invalidData;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = invalidValue;
  } else {
    // Handle top-level fields
    invalidData[fieldToInvalidate] = invalidValue;
  }
  
  return invalidData;
}

/**
 * Tests a custom validator function with various inputs
 * 
 * @param validatorFn The validator function to test
 * @param testCases Array of test cases with input and expected result
 * @returns Array of test results
 */
export function testCustomValidator(
  validatorFn: (value: any) => boolean,
  testCases: Array<{ input: any; expected: boolean; description: string }>
): Array<{ input: any; expected: boolean; actual: boolean; passed: boolean; description: string }> {
  return testCases.map(testCase => {
    const actual = validatorFn(testCase.input);
    return {
      ...testCase,
      actual,
      passed: actual === testCase.expected
    };
  });
}

/**
 * Tests version compatibility between different event schema versions
 * 
 * @param testCases Array of test cases with versions and expected compatibility
 * @returns Array of test results
 */
export function testVersionCompatibility(
  testCases: Array<{ currentVersion: string; requiredVersion: string; expected: boolean; description: string }>
): Array<{ currentVersion: string; requiredVersion: string; expected: boolean; actual: boolean; passed: boolean; description: string }> {
  return testCases.map(testCase => {
    const actual = isVersionCompatible(testCase.currentVersion, testCase.requiredVersion);
    return {
      ...testCase,
      actual,
      passed: actual === testCase.expected
    };
  });
}

/**
 * Tests version comparison between different event schema versions
 * 
 * @param testCases Array of test cases with versions and expected comparison result
 * @returns Array of test results
 */
export function testVersionComparison(
  testCases: Array<{ version1: string; version2: string; expected: number; description: string }>
): Array<{ version1: string; version2: string; expected: number; actual: number; passed: boolean; description: string }> {
  return testCases.map(testCase => {
    const actual = compareVersions(testCase.version1, testCase.version2);
    return {
      ...testCase,
      actual,
      passed: actual === testCase.expected
    };
  });
}

/**
 * Creates a set of validation test cases for an event type
 * 
 * @param eventType The type of event
 * @param dtoClass The class of the DTO to test
 * @returns Array of test cases
 */
export function createEventValidationTestCases<T>(
  eventType: EventType | string,
  dtoClass: new () => T
): ValidationTestCase<T>[] {
  const validData = createEventTestData(eventType);
  
  // Create a basic set of test cases
  const testCases: ValidationTestCase<T>[] = [
    {
      description: 'Valid event data should pass validation',
      data: validData as any,
      shouldPass: true
    }
  ];
  
  // Add test cases for required fields
  Object.keys(validData).forEach(field => {
    testCases.push({
      description: `Missing required field '${field}' should fail validation`,
      data: { ...validData, [field]: undefined } as any,
      expectedErrors: [field],
      shouldPass: false
    });
  });
  
  return testCases;
}

/**
 * Loads test data from the database using Prisma
 * 
 * @param prisma PrismaClient instance
 * @param modelName Name of the Prisma model to query
 * @param where Optional filter conditions
 * @returns Promise resolving to an array of records
 */
export async function loadTestDataFromDb<T>(
  prisma: PrismaClient,
  modelName: string,
  where: any = {}
): Promise<T[]> {
  const model = prisma[modelName as keyof PrismaClient] as any;
  
  if (!model || typeof model.findMany !== 'function') {
    throw new Error(`Invalid model name: ${modelName}`);
  }
  
  return model.findMany({ where }) as Promise<T[]>;
}

/**
 * Creates a validation error object for testing
 * 
 * @param property The property that failed validation
 * @param message The error message
 * @param constraints Optional validation constraints
 * @returns A ValidationError object
 */
export function createValidationError(
  property: string,
  message: string = 'Message failed schema validation',
  constraints: Record<string, string> = {}
): ValidationError {
  return {
    property,
    errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
    message,
    constraints
  };
}

/**
 * Asserts that a validation result contains errors for specific properties
 * 
 * @param result The validation result to check
 * @param expectedErrorProperties Array of property names that should have errors
 * @returns Boolean indicating if the assertion passed
 */
export function assertValidationErrorsForProperties(
  result: ValidationTestResult,
  expectedErrorProperties: string[]
): boolean {
  if (result.passed) {
    return false;
  }
  
  if (!result.errorProperties) {
    return false;
  }
  
  return expectedErrorProperties.every(prop => result.errorProperties!.includes(prop));
}

/**
 * Asserts that a validation result contains specific error codes
 * 
 * @param result The validation result to check
 * @param expectedErrorCodes Array of error codes that should be present
 * @returns Boolean indicating if the assertion passed
 */
export function assertValidationErrorCodes(
  result: ValidationTestResult,
  expectedErrorCodes: string[]
): boolean {
  if (result.passed) {
    return false;
  }
  
  if (!result.errorCodes) {
    return false;
  }
  
  return expectedErrorCodes.every(code => result.errorCodes!.includes(code));
}

/**
 * Generates a set of test cases for testing a custom validator decorator
 * 
 * @param decorator The decorator function to test
 * @param validValues Array of values that should pass validation
 * @param invalidValues Array of values that should fail validation
 * @param propertyName The name of the property being validated
 * @returns Array of test cases
 */
export function generateDecoratorTestCases<T>(
  decorator: Function,
  validValues: any[],
  invalidValues: any[],
  propertyName: string = 'testProperty'
): ValidationTestCase<T>[] {
  const testCases: ValidationTestCase<T>[] = [];
  
  // Create a test class with the decorator
  class TestClass {
    @decorator()
    [propertyName]: any;
  }
  
  // Add test cases for valid values
  validValues.forEach((value, index) => {
    testCases.push({
      description: `Valid value #${index + 1} should pass validation`,
      data: { [propertyName]: value } as any,
      shouldPass: true
    });
  });
  
  // Add test cases for invalid values
  invalidValues.forEach((value, index) => {
    testCases.push({
      description: `Invalid value #${index + 1} should fail validation`,
      data: { [propertyName]: value } as any,
      expectedErrors: [propertyName],
      shouldPass: false
    });
  });
  
  return testCases;
}

/**
 * Generates a set of test cases for testing conditional validation
 * 
 * @param conditionProperty The property that controls the condition
 * @param conditionValues The values of the condition property that trigger validation
 * @param targetProperty The property being conditionally validated
 * @param validValues Values for the target property that should pass validation
 * @param invalidValues Values for the target property that should fail validation
 * @returns Array of test cases
 */
export function generateConditionalValidationTestCases<T>(
  conditionProperty: string,
  conditionValues: any[],
  targetProperty: string,
  validValues: any[],
  invalidValues: any[]
): ValidationTestCase<T>[] {
  const testCases: ValidationTestCase<T>[] = [];
  
  // Test cases where the condition is met and validation should occur
  conditionValues.forEach(conditionValue => {
    // Valid values should pass
    validValues.forEach((validValue, index) => {
      testCases.push({
        description: `When ${conditionProperty}=${JSON.stringify(conditionValue)}, valid ${targetProperty} #${index + 1} should pass`,
        data: { [conditionProperty]: conditionValue, [targetProperty]: validValue } as any,
        shouldPass: true
      });
    });
    
    // Invalid values should fail
    invalidValues.forEach((invalidValue, index) => {
      testCases.push({
        description: `When ${conditionProperty}=${JSON.stringify(conditionValue)}, invalid ${targetProperty} #${index + 1} should fail`,
        data: { [conditionProperty]: conditionValue, [targetProperty]: invalidValue } as any,
        expectedErrors: [targetProperty],
        shouldPass: false
      });
    });
  });
  
  return testCases;
}

/**
 * Generates test data for all event types in a journey
 * 
 * @param journey The journey to generate test data for
 * @returns Object mapping event types to test data
 */
export function generateJourneyTestData(journey: 'health' | 'care' | 'plan' | 'user' | 'gamification'): Record<string, any> {
  const result: Record<string, any> = {};
  let eventTypes: string[] = [];
  
  switch (journey) {
    case 'health':
      eventTypes = Object.values(JourneyEvents.Health);
      break;
    case 'care':
      eventTypes = Object.values(JourneyEvents.Care);
      break;
    case 'plan':
      eventTypes = Object.values(JourneyEvents.Plan);
      break;
    case 'user':
      eventTypes = Object.values(JourneyEvents.User);
      break;
    case 'gamification':
      eventTypes = Object.values(JourneyEvents.Gamification);
      break;
  }
  
  for (const eventType of eventTypes) {
    result[eventType] = createEventTestData(eventType);
  }
  
  return result;
}