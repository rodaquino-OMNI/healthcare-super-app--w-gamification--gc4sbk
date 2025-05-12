/**
 * @file validation.helper.ts
 * @description Helper utilities for testing event validation logic across all event types.
 * This file provides functions to validate event DTOs, test validation rules, check error
 * handling, and verify schema compliance. These utilities ensure consistent validation
 * testing across the event system and simplify test implementation for validation-related
 * functionality.
 */

import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, validateSync, ValidationError } from 'class-validator';
import { ZodSchema } from 'zod';

import { BaseEventDto } from '../../../src/dto/base-event.dto';
import { EventMetadataDto } from '../../../src/dto/event-metadata.dto';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { HealthEventDto } from '../../../src/dto/health-event.dto';
import { CareEventDto } from '../../../src/dto/care-event.dto';
import { PlanEventDto } from '../../../src/dto/plan-event.dto';
import { VersionDto } from '../../../src/dto/version.dto';

import { 
  validateObject, 
  validateObjectSync, 
  validateWithZod,
  validateEventOrThrow,
  validateEventOrThrowSync,
  HealthValidation,
  CareValidation,
  PlanValidation
} from '../../../src/dto/validation';

import {
  ValidationIssue,
  ValidationResult,
  ValidationResultFactory,
  ValidationSeverity
} from '../../../src/interfaces/event-validation.interface';

import { EventError, EventValidationError } from '../../../src/errors/event-errors';

// ===================================================================
// Test Data Generation Utilities
// ===================================================================

/**
 * Journey types supported by the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Options for generating test events
 */
export interface TestEventOptions {
  /**
   * Whether to include invalid data to trigger validation errors
   * @default false
   */
  invalid?: boolean;
  
  /**
   * Specific fields to make invalid (if invalid is true)
   */
  invalidFields?: string[];
  
  /**
   * Whether to include metadata
   * @default true
   */
  includeMetadata?: boolean;
  
  /**
   * Whether to include version information
   * @default true
   */
  includeVersion?: boolean;
  
  /**
   * Custom data to override default test data
   */
  customData?: Record<string, any>;
}

/**
 * Generates a test event for the specified journey and event type
 * 
 * @param journey The journey type (health, care, plan)
 * @param eventType The specific event type
 * @param options Options for customizing the test event
 * @returns A test event object
 */
export function generateTestEvent(
  journey: JourneyType,
  eventType: string,
  options: TestEventOptions = {}
): Record<string, any> {
  // Set default options
  const {
    invalid = false,
    invalidFields = [],
    includeMetadata = true,
    includeVersion = true,
    customData = {}
  } = options;
  
  // Generate base event
  const baseEvent = {
    eventId: `test-${journey}-${Date.now()}`,
    type: eventType,
    userId: 'test-user-id',
    journey,
    timestamp: new Date().toISOString(),
    data: {}
  };
  
  // Add journey-specific data
  switch (journey) {
    case JourneyType.HEALTH:
      baseEvent.data = generateHealthEventData(eventType, invalid, invalidFields);
      break;
    case JourneyType.CARE:
      baseEvent.data = generateCareEventData(eventType, invalid, invalidFields);
      break;
    case JourneyType.PLAN:
      baseEvent.data = generatePlanEventData(eventType, invalid, invalidFields);
      break;
  }
  
  // Override with custom data if provided
  if (customData) {
    baseEvent.data = { ...baseEvent.data, ...customData };
  }
  
  // Add metadata if requested
  if (includeMetadata) {
    baseEvent['metadata'] = {
      correlationId: `corr-${Date.now()}`,
      source: 'test-service',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }
  
  // Wrap with version if requested
  if (includeVersion) {
    return {
      version: {
        major: 1,
        minor: 0,
        patch: 0
      },
      payload: baseEvent
    };
  }
  
  return baseEvent;
}

/**
 * Generates test data for health journey events
 * 
 * @param eventType The specific health event type
 * @param invalid Whether to include invalid data
 * @param invalidFields Specific fields to make invalid
 * @returns Health event data
 */
function generateHealthEventData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Generate data based on event type
  if (eventType.startsWith('health.metric.')) {
    return generateHealthMetricData(eventType, invalid, invalidFields);
  } else if (eventType.startsWith('health.goal.')) {
    return generateHealthGoalData(eventType, invalid, invalidFields);
  } else if (eventType.startsWith('health.device.')) {
    return generateDeviceConnectionData(eventType, invalid, invalidFields);
  }
  
  // Default empty data for unknown event types
  return {};
}

/**
 * Generates test data for health metric events
 */
function generateHealthMetricData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid metric data
  const metricData: Record<string, any> = {
    type: 'heartRate',
    value: 75,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    source: 'manual'
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('type')) {
      metricData.type = 'invalidMetricType';
    }
    if (invalidFields.length === 0 || invalidFields.includes('value')) {
      metricData.value = 'not-a-number';
    }
    if (invalidFields.length === 0 || invalidFields.includes('timestamp')) {
      metricData.timestamp = 'invalid-date';
    }
  }
  
  return metricData;
}

/**
 * Generates test data for health goal events
 */
function generateHealthGoalData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid goal data
  const goalData: Record<string, any> = {
    type: 'steps',
    target: 10000,
    current: 2500,
    unit: 'steps',
    startDate: new Date().toISOString(),
    frequency: 'daily',
    reminderEnabled: true
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('type')) {
      goalData.type = 'invalidGoalType';
    }
    if (invalidFields.length === 0 || invalidFields.includes('target')) {
      goalData.target = -100; // Negative value
    }
    if (invalidFields.length === 0 || invalidFields.includes('startDate')) {
      goalData.startDate = 'invalid-date';
    }
  }
  
  return goalData;
}

/**
 * Generates test data for device connection events
 */
function generateDeviceConnectionData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid device data
  const deviceData: Record<string, any> = {
    deviceId: `device-${Date.now()}`,
    deviceType: 'smartwatch',
    manufacturer: 'TestManufacturer',
    model: 'TestModel',
    connectionStatus: 'connected',
    lastSyncTimestamp: new Date().toISOString(),
    permissions: ['read_heart_rate', 'read_steps']
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('deviceType')) {
      deviceData.deviceType = 'invalidDeviceType';
    }
    if (invalidFields.length === 0 || invalidFields.includes('connectionStatus')) {
      deviceData.connectionStatus = 'invalid-status';
    }
    if (invalidFields.length === 0 || invalidFields.includes('lastSyncTimestamp')) {
      deviceData.lastSyncTimestamp = 'invalid-date';
    }
  }
  
  return deviceData;
}

/**
 * Generates test data for care journey events
 * 
 * @param eventType The specific care event type
 * @param invalid Whether to include invalid data
 * @param invalidFields Specific fields to make invalid
 * @returns Care event data
 */
function generateCareEventData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Generate data based on event type
  if (eventType.startsWith('care.appointment.')) {
    return generateAppointmentData(eventType, invalid, invalidFields);
  } else if (eventType.startsWith('care.medication.')) {
    return generateMedicationData(eventType, invalid, invalidFields);
  } else if (eventType.startsWith('care.telemedicine.')) {
    return generateTelemedicineSessionData(eventType, invalid, invalidFields);
  }
  
  // Default empty data for unknown event types
  return {};
}

/**
 * Generates test data for appointment events
 */
function generateAppointmentData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Create a future date for the appointment (tomorrow at 10:00 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  // Base valid appointment data
  const appointmentData: Record<string, any> = {
    providerId: `provider-${Date.now()}`,
    specialization: 'Cardiologia',
    appointmentType: 'in-person',
    dateTime: tomorrow.toISOString(),
    duration: 30, // 30 minutes
    reason: 'Regular check-up',
    location: {
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brazil'
    },
    status: 'scheduled'
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('appointmentType')) {
      appointmentData.appointmentType = 'invalid-type';
    }
    if (invalidFields.length === 0 || invalidFields.includes('dateTime')) {
      appointmentData.dateTime = 'invalid-date';
    }
    if (invalidFields.length === 0 || invalidFields.includes('status')) {
      appointmentData.status = 'invalid-status';
    }
  }
  
  return appointmentData;
}

/**
 * Generates test data for medication events
 */
function generateMedicationData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid medication data
  const medicationData: Record<string, any> = {
    medicationId: `med-${Date.now()}`,
    name: 'Test Medication',
    dosage: {
      amount: 10,
      unit: 'mg'
    },
    frequency: {
      times: 2,
      period: 'day'
    },
    schedule: [
      {
        time: '08:00',
        taken: true,
        takenAt: new Date().toISOString()
      },
      {
        time: '20:00',
        taken: false
      }
    ],
    startDate: new Date().toISOString(),
    instructions: 'Take with food',
    prescribedBy: 'Dr. Test Doctor'
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('dosage')) {
      medicationData.dosage = { amount: 'not-a-number', unit: 'invalid-unit' };
    }
    if (invalidFields.length === 0 || invalidFields.includes('frequency')) {
      medicationData.frequency = { times: -1, period: 'invalid-period' };
    }
    if (invalidFields.length === 0 || invalidFields.includes('startDate')) {
      medicationData.startDate = 'invalid-date';
    }
  }
  
  return medicationData;
}

/**
 * Generates test data for telemedicine session events
 */
function generateTelemedicineSessionData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid telemedicine session data
  const sessionData: Record<string, any> = {
    sessionId: `session-${Date.now()}`,
    providerId: `provider-${Date.now()}`,
    appointmentId: `appointment-${Date.now()}`,
    startTime: new Date().toISOString(),
    status: 'scheduled',
    sessionType: 'video',
    technicalDetails: {
      platform: 'web',
      browserInfo: 'Chrome 98.0.4758.102',
      deviceInfo: 'Windows 10',
      connectionQuality: 'good'
    }
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('status')) {
      sessionData.status = 'invalid-status';
    }
    if (invalidFields.length === 0 || invalidFields.includes('sessionType')) {
      sessionData.sessionType = 'invalid-type';
    }
    if (invalidFields.length === 0 || invalidFields.includes('startTime')) {
      sessionData.startTime = 'invalid-date';
    }
  }
  
  return sessionData;
}

/**
 * Generates test data for plan journey events
 * 
 * @param eventType The specific plan event type
 * @param invalid Whether to include invalid data
 * @param invalidFields Specific fields to make invalid
 * @returns Plan event data
 */
function generatePlanEventData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Generate data based on event type
  if (eventType.startsWith('plan.claim.')) {
    return generateClaimData(eventType, invalid, invalidFields);
  } else if (eventType.startsWith('plan.benefit.')) {
    return generateBenefitData(eventType, invalid, invalidFields);
  } else if (eventType.startsWith('plan.plan.')) {
    return generatePlanSelectionData(eventType, invalid, invalidFields);
  }
  
  // Default empty data for unknown event types
  return {};
}

/**
 * Generates test data for claim events
 */
function generateClaimData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid claim data
  const claimData: Record<string, any> = {
    claimId: `claim-${Date.now()}`,
    serviceDate: new Date().toISOString(),
    providerName: 'Test Provider',
    providerId: `provider-${Date.now()}`,
    serviceType: 'Consulta Médica',
    diagnosisCodes: ['A00.0', 'B01.1'],
    procedureCodes: ['99201', '99202'],
    amount: {
      total: 150.00,
      covered: 120.00,
      patientResponsibility: 30.00,
      currency: 'BRL'
    },
    status: 'submitted',
    documents: [
      {
        documentId: `doc-${Date.now()}`,
        documentType: 'receipt',
        uploadDate: new Date().toISOString()
      }
    ],
    notes: 'Test claim for validation'
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('amount')) {
      claimData.amount = { total: 'not-a-number', currency: 'INVALID' };
    }
    if (invalidFields.length === 0 || invalidFields.includes('status')) {
      claimData.status = 'invalid-status';
    }
    if (invalidFields.length === 0 || invalidFields.includes('serviceDate')) {
      claimData.serviceDate = 'invalid-date';
    }
  }
  
  return claimData;
}

/**
 * Generates test data for benefit events
 */
function generateBenefitData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid benefit data
  const benefitData: Record<string, any> = {
    benefitId: `benefit-${Date.now()}`,
    category: 'medical',
    type: 'consultation',
    description: 'Medical consultation benefit',
    coverage: {
      coinsurance: 20, // 20%
      copay: 30.00,
      deductible: 100.00,
      outOfPocketMax: 1000.00,
      currency: 'BRL'
    },
    limits: {
      visitsPerYear: 12,
      amountPerYear: 5000.00
    },
    network: 'in-network',
    requiresPreauthorization: false,
    effectiveDate: new Date().toISOString()
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('category')) {
      benefitData.category = 'invalid-category';
    }
    if (invalidFields.length === 0 || invalidFields.includes('coverage')) {
      benefitData.coverage = { coinsurance: 120, currency: 'INVALID' }; // Over 100%
    }
    if (invalidFields.length === 0 || invalidFields.includes('network')) {
      benefitData.network = 'invalid-network';
    }
  }
  
  return benefitData;
}

/**
 * Generates test data for plan selection events
 */
function generatePlanSelectionData(
  eventType: string,
  invalid: boolean = false,
  invalidFields: string[] = []
): Record<string, any> {
  // Base valid plan selection data
  const planData: Record<string, any> = {
    planId: `plan-${Date.now()}`,
    planName: 'Test Plan',
    planType: 'PPO',
    premium: {
      amount: 500.00,
      frequency: 'monthly',
      currency: 'BRL'
    },
    coverage: {
      individual: true,
      family: false,
      dependents: []
    },
    effectiveDate: new Date().toISOString(),
    selectionDate: new Date().toISOString(),
    reason: 'Better coverage'
  };
  
  // Make data invalid if requested
  if (invalid) {
    if (invalidFields.length === 0 || invalidFields.includes('planType')) {
      planData.planType = 'invalid-type';
    }
    if (invalidFields.length === 0 || invalidFields.includes('premium')) {
      planData.premium = { amount: -100, frequency: 'invalid-frequency' };
    }
    if (invalidFields.length === 0 || invalidFields.includes('effectiveDate')) {
      planData.effectiveDate = 'invalid-date';
    }
  }
  
  return planData;
}

// ===================================================================
// Validation Testing Utilities
// ===================================================================

/**
 * Options for testing validation
 */
export interface ValidationTestOptions {
  /**
   * Whether to expect validation to pass
   * @default true
   */
  expectValid?: boolean;
  
  /**
   * Expected error codes if validation fails
   */
  expectedErrorCodes?: string[];
  
  /**
   * Expected error fields if validation fails
   */
  expectedErrorFields?: string[];
  
  /**
   * Whether to use async validation
   * @default false
   */
  async?: boolean;
  
  /**
   * Whether to throw on validation failure
   * @default false
   */
  throwOnFailure?: boolean;
}

/**
 * Tests validation of an event against a DTO class
 * 
 * @param event The event to validate
 * @param dtoClass The DTO class to validate against
 * @param options Validation test options
 * @returns Promise resolving to the validation result
 */
export async function testEventValidation<T extends object>(
  event: Record<string, any>,
  dtoClass: ClassConstructor<T>,
  options: ValidationTestOptions = {}
): Promise<ValidationResult> {
  // Set default options
  const {
    expectValid = true,
    expectedErrorCodes = [],
    expectedErrorFields = [],
    async = false,
    throwOnFailure = false
  } = options;
  
  try {
    let result: ValidationResult;
    
    // Perform validation based on options
    if (throwOnFailure) {
      if (async) {
        await validateEventOrThrow(event, dtoClass, {
          journey: event.journey,
          eventType: event.type
        });
        result = ValidationResultFactory.valid(event.journey);
      } else {
        validateEventOrThrowSync(event, dtoClass, {
          journey: event.journey,
          eventType: event.type
        });
        result = ValidationResultFactory.valid(event.journey);
      }
    } else {
      if (async) {
        result = await validateObject(event, dtoClass, {
          journey: event.journey,
          eventType: event.type
        });
      } else {
        result = validateObjectSync(event, dtoClass, {
          journey: event.journey,
          eventType: event.type
        });
      }
    }
    
    // Verify validation result
    if (expectValid) {
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    } else {
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Check expected error codes
      if (expectedErrorCodes.length > 0) {
        const actualErrorCodes = result.issues.map(issue => issue.code);
        expectedErrorCodes.forEach(code => {
          expect(actualErrorCodes).toContain(code);
        });
      }
      
      // Check expected error fields
      if (expectedErrorFields.length > 0) {
        const actualErrorFields = result.issues
          .filter(issue => issue.field)
          .map(issue => issue.field);
        
        expectedErrorFields.forEach(field => {
          expect(actualErrorFields).toContain(field);
        });
      }
    }
    
    return result;
  } catch (error) {
    if (throwOnFailure && !expectValid) {
      // Expected to throw, verify error type and details
      expect(error).toBeInstanceOf(EventValidationError);
      
      if (expectedErrorCodes.length > 0) {
        const validationError = error as EventValidationError;
        const issues = validationError.context?.details?.validationIssues || [];
        const actualErrorCodes = issues.map((issue: ValidationIssue) => issue.code);
        
        expectedErrorCodes.forEach(code => {
          expect(actualErrorCodes).toContain(code);
        });
      }
      
      // Return a synthetic validation result for consistency
      return ValidationResultFactory.invalid(
        (error as EventValidationError).context?.details?.validationIssues || [],
        event.journey
      );
    }
    
    // Unexpected error
    throw error;
  }
}

/**
 * Tests validation of an event against a Zod schema
 * 
 * @param event The event to validate
 * @param schema The Zod schema to validate against
 * @param options Validation test options
 * @returns The validation result
 */
export function testZodValidation<T extends ZodSchema>(
  event: unknown,
  schema: T,
  options: ValidationTestOptions = {}
): ValidationResult {
  // Set default options
  const {
    expectValid = true,
    expectedErrorCodes = [],
    expectedErrorFields = []
  } = options;
  
  // Perform validation
  const result = validateWithZod(event, schema, {
    journey: (event as any)?.journey,
    eventType: (event as any)?.type
  });
  
  // Verify validation result
  if (expectValid) {
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  } else {
    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    
    // Check expected error codes
    if (expectedErrorCodes.length > 0) {
      const actualErrorCodes = result.issues.map(issue => issue.code);
      expectedErrorCodes.forEach(code => {
        expect(actualErrorCodes).toContain(code);
      });
    }
    
    // Check expected error fields
    if (expectedErrorFields.length > 0) {
      const actualErrorFields = result.issues
        .filter(issue => issue.field)
        .map(issue => issue.field);
      
      expectedErrorFields.forEach(field => {
        expect(actualErrorFields).toContain(field);
      });
    }
  }
  
  return result;
}

/**
 * Tests journey-specific validation functions
 * 
 * @param journey The journey type
 * @param eventType The event type
 * @param data The data to validate
 * @param options Validation test options
 * @returns The validation result
 */
export function testJourneyValidation(
  journey: JourneyType,
  eventType: string,
  data: Record<string, any>,
  options: ValidationTestOptions = {}
): ValidationResult {
  // Set default options
  const {
    expectValid = true,
    expectedErrorCodes = [],
    expectedErrorFields = []
  } = options;
  
  let result: ValidationResult;
  
  // Call the appropriate journey validation function
  switch (journey) {
    case JourneyType.HEALTH:
      if (eventType.startsWith('health.metric.')) {
        result = HealthValidation.validateHealthMetric(data);
      } else if (eventType.startsWith('health.goal.')) {
        result = HealthValidation.validateHealthGoal(data);
      } else if (eventType.startsWith('health.device.')) {
        result = HealthValidation.validateDeviceConnection(data);
      } else {
        throw new Error(`Unsupported health event type: ${eventType}`);
      }
      break;
      
    case JourneyType.CARE:
      if (eventType.startsWith('care.appointment.')) {
        result = CareValidation.validateAppointment(data);
      } else if (eventType.startsWith('care.medication.')) {
        result = CareValidation.validateMedication(data);
      } else if (eventType.startsWith('care.telemedicine.')) {
        result = CareValidation.validateTelemedicineSession(data);
      } else {
        throw new Error(`Unsupported care event type: ${eventType}`);
      }
      break;
      
    case JourneyType.PLAN:
      if (eventType.startsWith('plan.claim.')) {
        result = PlanValidation.validateClaim(data);
      } else if (eventType.startsWith('plan.benefit.')) {
        result = PlanValidation.validateBenefit(data);
      } else if (eventType.startsWith('plan.plan.')) {
        result = PlanValidation.validatePlanSelection(data);
      } else {
        throw new Error(`Unsupported plan event type: ${eventType}`);
      }
      break;
      
    default:
      throw new Error(`Unsupported journey: ${journey}`);
  }
  
  // Verify validation result
  if (expectValid) {
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  } else {
    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    
    // Check expected error codes
    if (expectedErrorCodes.length > 0) {
      const actualErrorCodes = result.issues.map(issue => issue.code);
      expectedErrorCodes.forEach(code => {
        expect(actualErrorCodes).toContain(code);
      });
    }
    
    // Check expected error fields
    if (expectedErrorFields.length > 0) {
      const actualErrorFields = result.issues
        .filter(issue => issue.field)
        .map(issue => issue.field);
      
      expectedErrorFields.forEach(field => {
        expect(actualErrorFields).toContain(field);
      });
    }
  }
  
  return result;
}

// ===================================================================
// Custom Validator Testing Utilities
// ===================================================================

/**
 * Tests a custom validator decorator
 * 
 * @param decorator The decorator function to test
 * @param validValues Array of values that should pass validation
 * @param invalidValues Array of values that should fail validation
 * @param decoratorArgs Arguments to pass to the decorator
 */
export function testValidatorDecorator(
  decorator: Function,
  validValues: any[],
  invalidValues: any[],
  decoratorArgs: any[] = []
): void {
  // Create a test class with the decorator
  class TestClass {
    @(decorator as any)(...decoratorArgs)
    testProperty: any;
  }
  
  // Test valid values
  for (const value of validValues) {
    const instance = new TestClass();
    instance.testProperty = value;
    
    const errors = validateSync(instance);
    expect(errors.length).toBe(0);
  }
  
  // Test invalid values
  for (const value of invalidValues) {
    const instance = new TestClass();
    instance.testProperty = value;
    
    const errors = validateSync(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('testProperty');
  }
}

/**
 * Tests a custom validator constraint
 * 
 * @param constraintClass The validator constraint class to test
 * @param validValues Array of values that should pass validation
 * @param invalidValues Array of values that should fail validation
 * @param constraintArgs Arguments to pass to the constraint
 */
export function testValidatorConstraint(
  constraintClass: new () => any,
  validValues: any[],
  invalidValues: any[],
  constraintArgs: any[] = []
): void {
  const constraint = new constraintClass();
  
  // Test valid values
  for (const value of validValues) {
    const isValid = constraint.validate(value, { constraints: constraintArgs } as any);
    expect(isValid).toBe(true);
  }
  
  // Test invalid values
  for (const value of invalidValues) {
    const isValid = constraint.validate(value, { constraints: constraintArgs } as any);
    expect(isValid).toBe(false);
  }
  
  // Test error message
  expect(typeof constraint.defaultMessage({ property: 'testProperty', constraints: constraintArgs } as any)).toBe('string');
}

// ===================================================================
// Schema Evolution Testing Utilities
// ===================================================================

/**
 * Options for testing schema evolution
 */
export interface SchemaEvolutionTestOptions {
  /**
   * The old version of the schema
   */
  oldVersion: { major: number; minor: number; patch: number };
  
  /**
   * The new version of the schema
   */
  newVersion: { major: number; minor: number; patch: number };
  
  /**
   * Whether backward compatibility is expected
   * @default true for minor and patch versions, false for major versions
   */
  expectBackwardCompatible?: boolean;
  
  /**
   * Fields that are expected to be added in the new version
   */
  expectedAddedFields?: string[];
  
  /**
   * Fields that are expected to be removed in the new version
   */
  expectedRemovedFields?: string[];
  
  /**
   * Fields that are expected to be modified in the new version
   */
  expectedModifiedFields?: string[];
}

/**
 * Tests schema evolution between versions
 * 
 * @param oldSchema The old schema (DTO class or Zod schema)
 * @param newSchema The new schema (DTO class or Zod schema)
 * @param testData Test data that conforms to the old schema
 * @param options Schema evolution test options
 */
export function testSchemaEvolution(
  oldSchema: any,
  newSchema: any,
  testData: Record<string, any>,
  options: SchemaEvolutionTestOptions
): void {
  const { oldVersion, newVersion } = options;
  
  // Determine if backward compatibility is expected based on version changes
  const isMajorChange = newVersion.major > oldVersion.major;
  const expectBackwardCompatible = options.expectBackwardCompatible ?? !isMajorChange;
  
  // Create versioned test data
  const versionedTestData = {
    version: oldVersion,
    payload: testData
  };
  
  // Test backward compatibility
  if (expectBackwardCompatible) {
    // Data that conforms to the old schema should be valid with the new schema
    if (oldSchema.prototype && newSchema.prototype) {
      // Class-validator schemas (DTO classes)
      const oldInstance = plainToInstance(oldSchema, testData);
      const oldErrors = validateSync(oldInstance);
      
      const newInstance = plainToInstance(newSchema, testData);
      const newErrors = validateSync(newInstance);
      
      // If data is valid with old schema, it should be valid with new schema
      if (oldErrors.length === 0) {
        expect(newErrors.length).toBe(0);
      }
    } else {
      // Zod schemas
      const oldResult = oldSchema.safeParse(testData);
      const newResult = newSchema.safeParse(testData);
      
      // If data is valid with old schema, it should be valid with new schema
      if (oldResult.success) {
        expect(newResult.success).toBe(true);
      }
    }
  }
  
  // Test field changes
  if (options.expectedAddedFields || options.expectedRemovedFields || options.expectedModifiedFields) {
    // Get schema properties
    const oldProperties = getSchemaProperties(oldSchema);
    const newProperties = getSchemaProperties(newSchema);
    
    // Check added fields
    if (options.expectedAddedFields) {
      options.expectedAddedFields.forEach(field => {
        expect(oldProperties).not.toContain(field);
        expect(newProperties).toContain(field);
      });
    }
    
    // Check removed fields
    if (options.expectedRemovedFields) {
      options.expectedRemovedFields.forEach(field => {
        expect(oldProperties).toContain(field);
        expect(newProperties).not.toContain(field);
      });
    }
    
    // Check modified fields (present in both but with different validation rules)
    if (options.expectedModifiedFields) {
      options.expectedModifiedFields.forEach(field => {
        expect(oldProperties).toContain(field);
        expect(newProperties).toContain(field);
        
        // Additional checks for modified fields could be added here
        // This would require more detailed schema introspection
      });
    }
  }
}

/**
 * Gets the property names from a schema
 * 
 * @param schema The schema (DTO class or Zod schema)
 * @returns Array of property names
 */
function getSchemaProperties(schema: any): string[] {
  if (schema.prototype) {
    // Class-validator schema (DTO class)
    // Get metadata or use reflection to get properties
    return Object.getOwnPropertyNames(schema.prototype)
      .filter(prop => prop !== 'constructor');
  } else {
    // Zod schema
    // This is a simplified approach; actual Zod schema introspection is more complex
    try {
      const shape = (schema as any)._def?.shape;
      return shape ? Object.keys(shape) : [];
    } catch (error) {
      return [];
    }
  }
}

// ===================================================================
// Error Handling Testing Utilities
// ===================================================================

/**
 * Tests error handling for validation failures
 * 
 * @param journey The journey type
 * @param eventType The event type
 * @param invalidData Invalid event data that should fail validation
 * @param expectedErrorType Expected error type
 * @param expectedErrorProperties Expected properties on the error object
 */
export function testValidationErrorHandling(
  journey: JourneyType,
  eventType: string,
  invalidData: Record<string, any>,
  expectedErrorType: new (...args: any[]) => Error = EventValidationError,
  expectedErrorProperties: string[] = []
): void {
  // Create an invalid event
  const invalidEvent = generateTestEvent(journey, eventType, {
    invalid: true,
    customData: invalidData
  });
  
  // Determine the appropriate DTO class based on journey
  let dtoClass: ClassConstructor<any>;
  switch (journey) {
    case JourneyType.HEALTH:
      dtoClass = HealthEventDto;
      break;
    case JourneyType.CARE:
      dtoClass = CareEventDto;
      break;
    case JourneyType.PLAN:
      dtoClass = PlanEventDto;
      break;
    default:
      dtoClass = BaseEventDto;
  }
  
  // Test that validation throws the expected error
  expect(() => {
    validateEventOrThrowSync(invalidEvent, dtoClass, {
      journey: journey,
      eventType: eventType
    });
  }).toThrow(expectedErrorType);
  
  // Test that the error has the expected properties
  try {
    validateEventOrThrowSync(invalidEvent, dtoClass, {
      journey: journey,
      eventType: eventType
    });
  } catch (error) {
    expect(error).toBeInstanceOf(expectedErrorType);
    
    // Check expected error properties
    expectedErrorProperties.forEach(prop => {
      expect(error).toHaveProperty(prop);
    });
    
    // Check that error context contains validation issues
    if (error instanceof EventValidationError) {
      expect(error.context).toBeDefined();
      expect(error.context.details).toBeDefined();
      expect(error.context.details.validationIssues).toBeDefined();
      expect(error.context.details.validationIssues.length).toBeGreaterThan(0);
    }
  }
}

/**
 * Tests that validation errors are properly propagated through the event processing pipeline
 * 
 * @param journey The journey type
 * @param eventType The event type
 * @param invalidData Invalid event data that should fail validation
 * @param processingFunction Function that processes the event (should propagate validation errors)
 */
export function testValidationErrorPropagation(
  journey: JourneyType,
  eventType: string,
  invalidData: Record<string, any>,
  processingFunction: (event: any) => any
): void {
  // Create an invalid event
  const invalidEvent = generateTestEvent(journey, eventType, {
    invalid: true,
    customData: invalidData
  });
  
  // Test that the processing function propagates validation errors
  expect(() => {
    processingFunction(invalidEvent);
  }).toThrow(EventValidationError);
}