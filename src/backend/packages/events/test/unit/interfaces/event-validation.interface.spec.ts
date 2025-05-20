import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { validate } from 'class-validator';

// Import validation utilities
import {
  ValidationError,
  formatValidationErrors,
  validateObject,
  isUUID,
  isISODate,
  isValidJourney,
  isValidEventType
} from '../../../src/dto/validation';

import { ERROR_CODES, ERROR_MESSAGES } from '../../../src/constants/errors.constants';

// Define the IEventValidator interface for testing
interface IEventValidator<T extends BaseEvent = BaseEvent> {
  /**
   * Validates an event asynchronously
   * 
   * @param event The event to validate
   * @returns A promise resolving to the validation result
   */
  validate(event: T): Promise<ValidationResult>;
  
  /**
   * Validates an event synchronously
   * 
   * @param event The event to validate
   * @returns The validation result
   */
  validateSync(event: T): ValidationResult;
  
  /**
   * Gets the event type this validator can validate
   * 
   * @returns The event type string
   */
  getEventType(): string;
  
  /**
   * Checks if this validator can validate the given event
   * 
   * @param event The event to check
   * @returns True if this validator can validate the event, false otherwise
   */
  canValidate(event: BaseEvent): boolean;
}

// Define the ValidationResult interface
interface ValidationResult {
  /**
   * Whether the validation passed
   */
  valid: boolean;
  
  /**
   * The event ID that was validated
   */
  eventId: string;
  
  /**
   * Validation errors, if any
   */
  errors?: ValidationError[];
  
  /**
   * Additional metadata about the validation
   */
  metadata?: Record<string, any>;
}

// Define a basic event interface for testing
interface BaseEvent {
  eventId: string;
  type: string;
  journey: string;
  timestamp: string;
  userId: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

// Define journey-specific event interfaces for testing
interface HealthEvent extends BaseEvent {
  journey: 'health';
  type: 'HEALTH_METRIC_RECORDED' | 'HEALTH_GOAL_ACHIEVED' | 'DEVICE_SYNCHRONIZED';
  payload: {
    metricType?: string;
    metricValue?: number;
    metricUnit?: string;
    goalId?: string;
    deviceId?: string;
    [key: string]: any;
  };
}

interface CareEvent extends BaseEvent {
  journey: 'care';
  type: 'APPOINTMENT_BOOKED' | 'APPOINTMENT_COMPLETED' | 'MEDICATION_ADHERENCE';
  payload: {
    appointmentId?: string;
    providerId?: string;
    medicationId?: string;
    [key: string]: any;
  };
}

interface PlanEvent extends BaseEvent {
  journey: 'plan';
  type: 'CLAIM_SUBMITTED' | 'BENEFIT_UTILIZED' | 'PLAN_SELECTED';
  payload: {
    claimId?: string;
    benefitId?: string;
    planId?: string;
    [key: string]: any;
  };
}

// Mock implementations
class MockSchemaValidator implements IEventValidator<BaseEvent> {
  public validate = jest.fn().mockImplementation(async (event: BaseEvent) => {
    return this.validateSync(event);
  });

  public validateSync = jest.fn().mockImplementation((event: BaseEvent) => {
    // Basic schema validation
    const errors: ValidationError[] = [];
    
    if (!event.eventId || !isUUID(event.eventId)) {
      errors.push({
        property: 'eventId',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Event ID must be a valid UUID'
      });
    }
    
    if (!event.type || typeof event.type !== 'string' || event.type.trim() === '') {
      errors.push({
        property: 'type',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Event type is required'
      });
    }
    
    if (!event.journey || !isValidJourney(event.journey)) {
      errors.push({
        property: 'journey',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Journey must be a valid journey name'
      });
    }
    
    if (!event.timestamp || !isISODate(event.timestamp)) {
      errors.push({
        property: 'timestamp',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Timestamp must be a valid ISO date string'
      });
    }
    
    if (!event.userId || !isUUID(event.userId)) {
      errors.push({
        property: 'userId',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'User ID must be a valid UUID'
      });
    }
    
    if (!event.payload || typeof event.payload !== 'object') {
      errors.push({
        property: 'payload',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'Payload must be an object'
      });
    }
    
    return {
      valid: errors.length === 0,
      eventId: event.eventId || 'unknown',
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        validatorName: this.constructor.name,
        validationType: 'schema'
      }
    };
  });

  public getEventType = jest.fn().mockReturnValue('ANY');

  public canValidate = jest.fn().mockReturnValue(true);
}

class MockBusinessRuleValidator implements IEventValidator<HealthEvent> {
  public validate = jest.fn().mockImplementation(async (event: HealthEvent) => {
    return this.validateSync(event);
  });

  public validateSync = jest.fn().mockImplementation((event: HealthEvent) => {
    // Business rule validation for health metrics
    const errors: ValidationError[] = [];
    
    if (event.type === 'HEALTH_METRIC_RECORDED') {
      const { metricType, metricValue, metricUnit } = event.payload;
      
      if (!metricType) {
        errors.push({
          property: 'payload.metricType',
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: 'Metric type is required for HEALTH_METRIC_RECORDED events'
        });
      }
      
      if (metricValue === undefined) {
        errors.push({
          property: 'payload.metricValue',
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: 'Metric value is required for HEALTH_METRIC_RECORDED events'
        });
      } else if (typeof metricValue !== 'number') {
        errors.push({
          property: 'payload.metricValue',
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: 'Metric value must be a number'
        });
      } else {
        // Validate metric value based on metric type
        switch (metricType) {
          case 'HEART_RATE':
            if (metricValue < 30 || metricValue > 220) {
              errors.push({
                property: 'payload.metricValue',
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: 'Heart rate must be between 30 and 220 bpm'
              });
            }
            break;
          case 'BLOOD_GLUCOSE':
            if (metricValue < 20 || metricValue > 600) {
              errors.push({
                property: 'payload.metricValue',
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: 'Blood glucose must be between 20 and 600 mg/dL'
              });
            }
            break;
          case 'STEPS':
            if (metricValue < 0 || metricValue > 100000) {
              errors.push({
                property: 'payload.metricValue',
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: 'Steps must be between 0 and 100,000'
              });
            }
            break;
          // Add more metric type validations as needed
        }
      }
      
      if (!metricUnit) {
        errors.push({
          property: 'payload.metricUnit',
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: 'Metric unit is required for HEALTH_METRIC_RECORDED events'
        });
      } else if (typeof metricUnit !== 'string') {
        errors.push({
          property: 'payload.metricUnit',
          errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          message: 'Metric unit must be a string'
        });
      } else {
        // Validate metric unit based on metric type
        switch (metricType) {
          case 'HEART_RATE':
            if (metricUnit !== 'bpm') {
              errors.push({
                property: 'payload.metricUnit',
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: "Heart rate unit must be 'bpm'"
              });
            }
            break;
          case 'BLOOD_GLUCOSE':
            if (metricUnit !== 'mg/dL' && metricUnit !== 'mmol/L') {
              errors.push({
                property: 'payload.metricUnit',
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: "Blood glucose unit must be 'mg/dL' or 'mmol/L'"
              });
            }
            break;
          case 'STEPS':
            if (metricUnit !== 'steps') {
              errors.push({
                property: 'payload.metricUnit',
                errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
                message: "Steps unit must be 'steps'"
              });
            }
            break;
          // Add more metric type validations as needed
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      eventId: event.eventId || 'unknown',
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        validatorName: this.constructor.name,
        validationType: 'business-rule',
        journey: 'health'
      }
    };
  });

  public getEventType = jest.fn().mockReturnValue('HEALTH_METRIC_RECORDED');

  public canValidate = jest.fn().mockImplementation((event: BaseEvent) => {
    return event.journey === 'health' && event.type === 'HEALTH_METRIC_RECORDED';
  });
}

class MockAsyncValidator implements IEventValidator<BaseEvent> {
  public validate = jest.fn().mockImplementation(async (event: BaseEvent) => {
    // Simulate async validation (e.g., database lookup)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const errors: ValidationError[] = [];
    
    // Simulate validation that requires async operations
    if (event.userId === '00000000-0000-0000-0000-000000000000') {
      errors.push({
        property: 'userId',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: 'User does not exist'
      });
    }
    
    return {
      valid: errors.length === 0,
      eventId: event.eventId,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        validatorName: this.constructor.name,
        validationType: 'async',
        validationTimeMs: 50
      }
    };
  });

  public validateSync = jest.fn().mockImplementation(() => {
    throw new Error('This validator only supports async validation');
  });

  public getEventType = jest.fn().mockReturnValue('ANY');

  public canValidate = jest.fn().mockReturnValue(true);
}

class MockCompositeValidator implements IEventValidator<BaseEvent> {
  private validators: IEventValidator[];
  
  constructor(validators: IEventValidator[]) {
    this.validators = validators;
  }
  
  public validate = jest.fn().mockImplementation(async (event: BaseEvent) => {
    const results: ValidationResult[] = [];
    
    // Run all validators
    for (const validator of this.validators) {
      if (validator.canValidate(event)) {
        results.push(await validator.validate(event));
      }
    }
    
    // Combine results
    const allErrors: ValidationError[] = [];
    results.forEach(result => {
      if (result.errors) {
        allErrors.push(...result.errors);
      }
    });
    
    return {
      valid: allErrors.length === 0,
      eventId: event.eventId,
      errors: allErrors.length > 0 ? allErrors : undefined,
      metadata: {
        validatorName: this.constructor.name,
        validationType: 'composite',
        validatorCount: this.validators.length,
        validatorsRun: results.length
      }
    };
  });

  public validateSync = jest.fn().mockImplementation((event: BaseEvent) => {
    const results: ValidationResult[] = [];
    
    // Run all validators that support sync validation
    for (const validator of this.validators) {
      if (validator.canValidate(event)) {
        try {
          results.push(validator.validateSync(event));
        } catch (error) {
          // Skip validators that don't support sync validation
        }
      }
    }
    
    // Combine results
    const allErrors: ValidationError[] = [];
    results.forEach(result => {
      if (result.errors) {
        allErrors.push(...result.errors);
      }
    });
    
    return {
      valid: allErrors.length === 0,
      eventId: event.eventId,
      errors: allErrors.length > 0 ? allErrors : undefined,
      metadata: {
        validatorName: this.constructor.name,
        validationType: 'composite',
        validatorCount: this.validators.length,
        validatorsRun: results.length
      }
    };
  });

  public getEventType = jest.fn().mockReturnValue('ANY');

  public canValidate = jest.fn().mockReturnValue(true);
}

// Test data
const validBaseEvent: BaseEvent = {
  eventId: uuidv4(),
  type: 'TEST_EVENT',
  journey: 'health',
  timestamp: new Date().toISOString(),
  userId: uuidv4(),
  payload: {}
};

const validHealthEvent: HealthEvent = {
  eventId: uuidv4(),
  type: 'HEALTH_METRIC_RECORDED',
  journey: 'health',
  timestamp: new Date().toISOString(),
  userId: uuidv4(),
  payload: {
    metricType: 'HEART_RATE',
    metricValue: 75,
    metricUnit: 'bpm'
  }
};

const invalidHealthEvent: HealthEvent = {
  eventId: uuidv4(),
  type: 'HEALTH_METRIC_RECORDED',
  journey: 'health',
  timestamp: new Date().toISOString(),
  userId: uuidv4(),
  payload: {
    metricType: 'HEART_RATE',
    metricValue: 300, // Invalid value (too high)
    metricUnit: 'bpm'
  }
};

const invalidBaseEvent: Partial<BaseEvent> = {
  eventId: 'not-a-uuid',
  type: '',
  journey: 'invalid-journey',
  timestamp: 'not-a-date',
  userId: 'not-a-uuid',
  payload: null as any
};

describe('IEventValidator Interface', () => {
  let schemaValidator: MockSchemaValidator;
  let businessRuleValidator: MockBusinessRuleValidator;
  let asyncValidator: MockAsyncValidator;
  let compositeValidator: MockCompositeValidator;

  beforeEach(() => {
    schemaValidator = new MockSchemaValidator();
    businessRuleValidator = new MockBusinessRuleValidator();
    asyncValidator = new MockAsyncValidator();
    compositeValidator = new MockCompositeValidator([
      schemaValidator,
      businessRuleValidator,
      asyncValidator
    ]);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Interface Contract', () => {
    it('should require validate, validateSync, getEventType, and canValidate methods', () => {
      // Verify that the validator implements all required methods
      expect(schemaValidator.validate).toBeDefined();
      expect(schemaValidator.validateSync).toBeDefined();
      expect(schemaValidator.getEventType).toBeDefined();
      expect(schemaValidator.canValidate).toBeDefined();
      
      // Verify method types
      expect(typeof schemaValidator.validate).toBe('function');
      expect(typeof schemaValidator.validateSync).toBe('function');
      expect(typeof schemaValidator.getEventType).toBe('function');
      expect(typeof schemaValidator.canValidate).toBe('function');
    });

    it('should return a Promise<ValidationResult> from validate method', async () => {
      const result = await schemaValidator.validate(validBaseEvent);
      
      // Verify result structure
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('eventId');
      expect(typeof result.valid).toBe('boolean');
      expect(result.eventId).toBe(validBaseEvent.eventId);
    });

    it('should return a ValidationResult from validateSync method', () => {
      const result = schemaValidator.validateSync(validBaseEvent);
      
      // Verify result structure
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('eventId');
      expect(typeof result.valid).toBe('boolean');
      expect(result.eventId).toBe(validBaseEvent.eventId);
    });

    it('should return a boolean from canValidate method', () => {
      const result = schemaValidator.canValidate(validBaseEvent);
      
      expect(typeof result).toBe('boolean');
    });

    it('should return a string from getEventType method', () => {
      const eventType = schemaValidator.getEventType();
      
      expect(typeof eventType).toBe('string');
    });
  });

  describe('Validation Result Structure', () => {
    it('should include valid flag in the result', async () => {
      const validResult = await schemaValidator.validate(validBaseEvent);
      const invalidResult = await schemaValidator.validate(invalidBaseEvent as BaseEvent);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    it('should include eventId in the result', async () => {
      const result = await schemaValidator.validate(validBaseEvent);
      
      expect(result.eventId).toBe(validBaseEvent.eventId);
    });

    it('should include errors array only when validation fails', async () => {
      const validResult = await schemaValidator.validate(validBaseEvent);
      const invalidResult = await schemaValidator.validate(invalidBaseEvent as BaseEvent);
      
      expect(validResult.errors).toBeUndefined();
      expect(invalidResult.errors).toBeDefined();
      expect(Array.isArray(invalidResult.errors)).toBe(true);
      expect(invalidResult.errors!.length).toBeGreaterThan(0);
    });

    it('should include metadata in the result', async () => {
      const result = await schemaValidator.validate(validBaseEvent);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.validatorName).toBe('MockSchemaValidator');
      expect(result.metadata!.validationType).toBe('schema');
    });
  });

  describe('Error Structure', () => {
    it('should include property name in each error', async () => {
      const result = await schemaValidator.validate(invalidBaseEvent as BaseEvent);
      
      expect(result.errors).toBeDefined();
      result.errors!.forEach(error => {
        expect(error.property).toBeDefined();
        expect(typeof error.property).toBe('string');
      });
    });

    it('should include error code in each error', async () => {
      const result = await schemaValidator.validate(invalidBaseEvent as BaseEvent);
      
      expect(result.errors).toBeDefined();
      result.errors!.forEach(error => {
        expect(error.errorCode).toBeDefined();
        expect(typeof error.errorCode).toBe('string');
        expect(error.errorCode).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      });
    });

    it('should include error message in each error', async () => {
      const result = await schemaValidator.validate(invalidBaseEvent as BaseEvent);
      
      expect(result.errors).toBeDefined();
      result.errors!.forEach(error => {
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      });
    });

    it('should optionally include constraints in errors', async () => {
      // Create a validator that includes constraints
      const validatorWithConstraints = {
        validate: async () => ({
          valid: false,
          eventId: 'test',
          errors: [{
            property: 'test',
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: 'Test error',
            constraints: {
              isString: 'must be a string',
              isNotEmpty: 'should not be empty'
            }
          }],
          metadata: {}
        }),
        validateSync: () => ({
          valid: false,
          eventId: 'test',
          errors: [{
            property: 'test',
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: 'Test error',
            constraints: {
              isString: 'must be a string',
              isNotEmpty: 'should not be empty'
            }
          }],
          metadata: {}
        }),
        getEventType: () => 'TEST',
        canValidate: () => true
      };
      
      const result = await validatorWithConstraints.validate();
      
      expect(result.errors![0].constraints).toBeDefined();
      expect(result.errors![0].constraints!.isString).toBe('must be a string');
      expect(result.errors![0].constraints!.isNotEmpty).toBe('should not be empty');
    });

    it('should optionally include nested children errors', async () => {
      // Create a validator that includes nested errors
      const validatorWithNestedErrors = {
        validate: async () => ({
          valid: false,
          eventId: 'test',
          errors: [{
            property: 'payload',
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: 'Invalid payload',
            children: [{
              property: 'metricValue',
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: 'Invalid metric value'
            }]
          }],
          metadata: {}
        }),
        validateSync: () => ({
          valid: false,
          eventId: 'test',
          errors: [{
            property: 'payload',
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: 'Invalid payload',
            children: [{
              property: 'metricValue',
              errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
              message: 'Invalid metric value'
            }]
          }],
          metadata: {}
        }),
        getEventType: () => 'TEST',
        canValidate: () => true
      };
      
      const result = await validatorWithNestedErrors.validate();
      
      expect(result.errors![0].children).toBeDefined();
      expect(result.errors![0].children!.length).toBe(1);
      expect(result.errors![0].children![0].property).toBe('metricValue');
      expect(result.errors![0].children![0].message).toBe('Invalid metric value');
    });
  });

  describe('Schema Validation', () => {
    it('should validate basic event schema', async () => {
      const result = await schemaValidator.validate(validBaseEvent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect invalid event ID', async () => {
      const event = { ...validBaseEvent, eventId: 'not-a-uuid' };
      const result = await schemaValidator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'eventId')).toBe(true);
    });

    it('should detect invalid journey', async () => {
      const event = { ...validBaseEvent, journey: 'invalid-journey' };
      const result = await schemaValidator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'journey')).toBe(true);
    });

    it('should detect invalid timestamp', async () => {
      const event = { ...validBaseEvent, timestamp: 'not-a-date' };
      const result = await schemaValidator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'timestamp')).toBe(true);
    });

    it('should detect invalid user ID', async () => {
      const event = { ...validBaseEvent, userId: 'not-a-uuid' };
      const result = await schemaValidator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'userId')).toBe(true);
    });

    it('should detect missing or invalid payload', async () => {
      const event = { ...validBaseEvent, payload: null as any };
      const result = await schemaValidator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'payload')).toBe(true);
    });
  });

  describe('Business Rule Validation', () => {
    it('should validate business rules for valid events', async () => {
      const result = await businessRuleValidator.validate(validHealthEvent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect business rule violations', async () => {
      const result = await businessRuleValidator.validate(invalidHealthEvent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'payload.metricValue')).toBe(true);
    });

    it('should validate metric type-specific rules', async () => {
      // Test different metric types
      const glucoseEvent: HealthEvent = {
        ...validHealthEvent,
        payload: {
          metricType: 'BLOOD_GLUCOSE',
          metricValue: 700, // Invalid (too high)
          metricUnit: 'mg/dL'
        }
      };
      
      const result = await businessRuleValidator.validate(glucoseEvent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'payload.metricValue')).toBe(true);
    });

    it('should validate metric unit based on metric type', async () => {
      // Test invalid unit for metric type
      const invalidUnitEvent: HealthEvent = {
        ...validHealthEvent,
        payload: {
          metricType: 'HEART_RATE',
          metricValue: 75,
          metricUnit: 'kg' // Invalid unit for heart rate
        }
      };
      
      const result = await businessRuleValidator.validate(invalidUnitEvent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'payload.metricUnit')).toBe(true);
    });
  });

  describe('Async Validation', () => {
    it('should support asynchronous validation', async () => {
      const result = await asyncValidator.validate(validBaseEvent);
      
      expect(result.valid).toBe(true);
      expect(result.metadata!.validationType).toBe('async');
      expect(result.metadata!.validationTimeMs).toBe(50);
    });

    it('should handle async validation failures', async () => {
      const event = { ...validBaseEvent, userId: '00000000-0000-0000-0000-000000000000' };
      const result = await asyncValidator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.property === 'userId')).toBe(true);
    });

    it('should throw error when calling validateSync on async-only validator', () => {
      expect(() => {
        asyncValidator.validateSync(validBaseEvent);
      }).toThrow('This validator only supports async validation');
    });
  });

  describe('Validator Capability Detection', () => {
    it('should correctly identify events it can validate', () => {
      // Business rule validator should validate health metric events
      expect(businessRuleValidator.canValidate(validHealthEvent)).toBe(true);
      
      // Business rule validator should not validate other event types
      const otherEvent: BaseEvent = {
        ...validBaseEvent,
        type: 'OTHER_EVENT'
      };
      expect(businessRuleValidator.canValidate(otherEvent)).toBe(false);
    });

    it('should check both event type and journey for capability detection', () => {
      // Create a modified event with correct type but wrong journey
      const wrongJourneyEvent = {
        ...validHealthEvent,
        journey: 'care' // Changed from 'health'
      };
      
      // Validator should reject event with wrong journey
      expect(businessRuleValidator.canValidate(wrongJourneyEvent as BaseEvent)).toBe(false);
    });
  });

  describe('Composite Validation', () => {
    it('should run multiple validators', async () => {
      const result = await compositeValidator.validate(validHealthEvent);
      
      expect(result.metadata!.validatorCount).toBe(3);
      expect(result.metadata!.validatorsRun).toBe(3);
    });

    it('should combine errors from multiple validators', async () => {
      // Create an event that will fail both schema and business rule validation
      const multiErrorEvent = {
        ...invalidHealthEvent,
        userId: 'not-a-uuid' // Schema error
        // Already has business rule error (metric value too high)
      };
      
      const result = await compositeValidator.validate(multiErrorEvent as HealthEvent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      
      // Should have both schema and business rule errors
      const hasSchemaError = result.errors!.some(e => e.property === 'userId');
      const hasBusinessRuleError = result.errors!.some(e => e.property === 'payload.metricValue');
      
      expect(hasSchemaError).toBe(true);
      expect(hasBusinessRuleError).toBe(true);
    });

    it('should skip validators that cannot validate the event', async () => {
      // Create an event that business rule validator cannot validate
      const otherEvent: BaseEvent = {
        ...validBaseEvent,
        type: 'OTHER_EVENT'
      };
      
      const result = await compositeValidator.validate(otherEvent);
      
      // Only 2 validators should run (schema and async, not business rule)
      expect(result.metadata!.validatorCount).toBe(3);
      expect(result.metadata!.validatorsRun).toBe(2);
    });

    it('should handle sync validation with mixed validator types', () => {
      // Sync validation should skip async-only validators
      const result = compositeValidator.validateSync(validHealthEvent);
      
      // Only 2 validators should run (schema and business rule, not async)
      expect(result.metadata!.validatorCount).toBe(3);
      expect(result.metadata!.validatorsRun).toBe(2);
    });
  });

  describe('Validation Utility Functions', () => {
    it('should format validation errors correctly', () => {
      // Create raw class-validator errors
      const rawErrors = [
        {
          property: 'eventId',
          constraints: {
            isUuid: 'eventId must be a UUID'
          }
        },
        {
          property: 'payload',
          children: [
            {
              property: 'metricValue',
              constraints: {
                isNumber: 'metricValue must be a number'
              }
            }
          ]
        }
      ];
      
      // Format the errors
      const formattedErrors = formatValidationErrors(rawErrors as any);
      
      // Check structure
      expect(formattedErrors.length).toBe(2);
      expect(formattedErrors[0].property).toBe('eventId');
      expect(formattedErrors[0].errorCode).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(formattedErrors[0].message).toBe(ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]);
      expect(formattedErrors[0].constraints!.isUuid).toBe('eventId must be a UUID');
      
      // Check nested errors
      expect(formattedErrors[1].property).toBe('payload');
      expect(formattedErrors[1].children!.length).toBe(1);
      expect(formattedErrors[1].children![0].property).toBe('metricValue');
      expect(formattedErrors[1].children![0].constraints!.isNumber).toBe('metricValue must be a number');
    });

    it('should validate objects using class-validator', async () => {
      // Create a simple class with validation decorators
      class TestEvent {
        @IsUUID(4)
        eventId!: string;
      }
      
      // Test valid object
      const validObject = new TestEvent();
      validObject.eventId = uuidv4();
      
      const validResult = await validateObject(validObject);
      expect(validResult).toBeNull();
      
      // Test invalid object
      const invalidObject = new TestEvent();
      invalidObject.eventId = 'not-a-uuid';
      
      const invalidResult = await validateObject(invalidObject);
      expect(invalidResult).not.toBeNull();
      expect(Array.isArray(invalidResult)).toBe(true);
      expect(invalidResult!.length).toBe(1);
      expect(invalidResult![0].property).toBe('eventId');
    });
  });
});