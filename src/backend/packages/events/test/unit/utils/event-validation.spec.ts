import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  validateEvent,
  validateJourneyEvent,
  validateHealthEvent,
  validateCareEvent,
  validatePlanEvent,
  validateWithSchema,
  validateWithSchemaAsync,
  createValidationPipeline,
  createFieldValidator,
  createCustomValidator,
  createEnumValidator,
  clearValidationCache,
  ValidationResult
} from '../../../src/utils/event-validator';
import * as schemaUtils from '../../../src/utils/schema-utils';
import { JourneyType } from '../../../src/interfaces/journey-events.interface';

// Mock the schema registry
jest.mock('../../../src/utils/schema-utils', () => {
  const originalModule = jest.requireActual('../../../src/utils/schema-utils');
  return {
    ...originalModule,
    hasSchema: jest.fn(),
    getSchema: jest.fn(),
  };
});

describe('Event Validation Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidationCache();
  });

  // Define common test data
  const validEventId = uuidv4();
  const validUserId = uuidv4();
  const validTimestamp = new Date().toISOString();

  // Define test schemas
  const baseEventSchema = z.object({
    eventId: z.string().uuid(),
    timestamp: z.string().datetime(),
    version: z.string(),
    source: z.string(),
    type: z.string(),
    userId: z.string().uuid(),
    journeyType: z.enum(['health', 'care', 'plan']),
    payload: z.object({
      // Base payload fields
    }).passthrough(),
  });

  const healthMetricSchema = baseEventSchema.extend({
    journeyType: z.literal('health'),
    type: z.literal('health.metric.recorded'),
    payload: z.object({
      metricType: z.string(),
      value: z.number(),
      unit: z.string(),
      timestamp: z.string().datetime(),
      source: z.enum(['manual', 'device', 'integration']),
      deviceId: z.string().optional(),
    }),
  });

  const careAppointmentSchema = baseEventSchema.extend({
    journeyType: z.literal('care'),
    type: z.literal('care.appointment.booked'),
    payload: z.object({
      provider: z.string(),
      appointmentDate: z.string().datetime(),
      appointmentType: z.string(),
      isFirstAppointment: z.boolean(),
      isUrgent: z.boolean(),
    }),
  });

  const planClaimSchema = baseEventSchema.extend({
    journeyType: z.literal('plan'),
    type: z.literal('plan.claim.submitted'),
    payload: z.object({
      submissionDate: z.string().datetime(),
      amount: z.number().positive(),
      serviceDate: z.string().datetime(),
      provider: z.string(),
      hasDocuments: z.boolean(),
      documentCount: z.number().int().min(0),
      isFirstClaim: z.boolean(),
    }),
  });

  // Mock schema registry responses
  const setupSchemaRegistry = () => {
    (schemaUtils.hasSchema as jest.Mock).mockImplementation((options) => {
      const { type } = options;
      return [
        'health.metric.recorded',
        'care.appointment.booked',
        'plan.claim.submitted',
        'HEALTH_METRIC_RECORDED',
        'CARE_APPOINTMENT_BOOKED',
        'PLAN_CLAIM_SUBMITTED'
      ].includes(type);
    });

    (schemaUtils.getSchema as jest.Mock).mockImplementation((options) => {
      const { type } = options;
      switch (type) {
        case 'health.metric.recorded':
        case 'HEALTH_METRIC_RECORDED':
          return healthMetricSchema;
        case 'care.appointment.booked':
        case 'CARE_APPOINTMENT_BOOKED':
          return careAppointmentSchema;
        case 'plan.claim.submitted':
        case 'PLAN_CLAIM_SUBMITTED':
          return planClaimSchema;
        default:
          return undefined;
      }
    });
  };

  describe('validateEvent', () => {
    beforeEach(() => {
      setupSchemaRegistry();
    });

    it('should validate a valid health metric event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'health.metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateEvent('health.metric.recorded', event);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should validate a valid care appointment event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'care-service',
        type: 'care.appointment.booked',
        userId: validUserId,
        journeyType: 'care',
        payload: {
          provider: 'Dr. Smith',
          appointmentDate: validTimestamp,
          appointmentType: 'Consultation',
          isFirstAppointment: true,
          isUrgent: false,
        },
      };

      const result = validateEvent('care.appointment.booked', event);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should validate a valid plan claim event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'plan-service',
        type: 'plan.claim.submitted',
        userId: validUserId,
        journeyType: 'plan',
        payload: {
          submissionDate: validTimestamp,
          amount: 150.75,
          serviceDate: validTimestamp,
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 3,
          isFirstClaim: false,
        },
      };

      const result = validateEvent('plan.claim.submitted', event);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should reject an event with missing required fields', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'health.metric.recorded',
        // Missing userId
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateEvent('health.metric.recorded', event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].path).toContain('userId');
    });

    it('should reject an event with invalid field types', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'health.metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 'not-a-number', // Should be a number
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateEvent('health.metric.recorded', event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].path).toContain('payload');
      expect(result.errors![0].path).toContain('value');
    });

    it('should reject an event with invalid UUID format', () => {
      const event = {
        eventId: 'not-a-uuid',
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'health.metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateEvent('health.metric.recorded', event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].path).toContain('eventId');
    });

    it('should reject an event with invalid nested data', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'care-service',
        type: 'care.appointment.booked',
        userId: validUserId,
        journeyType: 'care',
        payload: {
          provider: 'Dr. Smith',
          appointmentDate: 'not-a-date', // Invalid date format
          appointmentType: 'Consultation',
          isFirstAppointment: true,
          isUrgent: false,
        },
      };

      const result = validateEvent('care.appointment.booked', event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].path).toContain('payload');
      expect(result.errors![0].path).toContain('appointmentDate');
    });

    it('should return an error when schema is not found', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'unknown-service',
        type: 'unknown.event.type',
        userId: validUserId,
        journeyType: 'health',
        payload: {},
      };

      const result = validateEvent('unknown.event.type', event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].code).toBe('SCHEMA_NOT_FOUND');
    });

    it('should throw an error when schema is not found and throwOnMissingSchema is true', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'unknown-service',
        type: 'unknown.event.type',
        userId: validUserId,
        journeyType: 'health',
        payload: {},
      };

      expect(() => {
        validateEvent('unknown.event.type', event, undefined, { throwOnMissingSchema: true });
      }).toThrow('Schema not found');
    });
  });

  describe('validateJourneyEvent', () => {
    beforeEach(() => {
      setupSchemaRegistry();
    });

    it('should validate a health journey event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateJourneyEvent('health', 'metric.recorded', event);
      expect(result.valid).toBe(true);
      expect(schemaUtils.hasSchema).toHaveBeenCalledWith({ type: 'HEALTH_METRIC_RECORDED' });
    });

    it('should validate a care journey event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'care-service',
        type: 'appointment.booked',
        userId: validUserId,
        journeyType: 'care',
        payload: {
          provider: 'Dr. Smith',
          appointmentDate: validTimestamp,
          appointmentType: 'Consultation',
          isFirstAppointment: true,
          isUrgent: false,
        },
      };

      const result = validateJourneyEvent('care', 'appointment.booked', event);
      expect(result.valid).toBe(true);
      expect(schemaUtils.hasSchema).toHaveBeenCalledWith({ type: 'CARE_APPOINTMENT_BOOKED' });
    });

    it('should validate a plan journey event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'plan-service',
        type: 'claim.submitted',
        userId: validUserId,
        journeyType: 'plan',
        payload: {
          submissionDate: validTimestamp,
          amount: 150.75,
          serviceDate: validTimestamp,
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 3,
          isFirstClaim: false,
        },
      };

      const result = validateJourneyEvent('plan', 'claim.submitted', event);
      expect(result.valid).toBe(true);
      expect(schemaUtils.hasSchema).toHaveBeenCalledWith({ type: 'PLAN_CLAIM_SUBMITTED' });
    });

    it('should add journey-specific error message prefix', () => {
      const event = {
        eventId: 'not-a-uuid',
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateJourneyEvent('health', 'metric.recorded', event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain('Health Journey:');
    });
  });

  describe('Journey-specific validation functions', () => {
    beforeEach(() => {
      setupSchemaRegistry();
    });

    it('should validate a health event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      const result = validateHealthEvent('metric.recorded', event);
      expect(result.valid).toBe(true);
      expect(schemaUtils.hasSchema).toHaveBeenCalledWith({ type: 'HEALTH_METRIC_RECORDED' });
    });

    it('should validate a care event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'care-service',
        type: 'appointment.booked',
        userId: validUserId,
        journeyType: 'care',
        payload: {
          provider: 'Dr. Smith',
          appointmentDate: validTimestamp,
          appointmentType: 'Consultation',
          isFirstAppointment: true,
          isUrgent: false,
        },
      };

      const result = validateCareEvent('appointment.booked', event);
      expect(result.valid).toBe(true);
      expect(schemaUtils.hasSchema).toHaveBeenCalledWith({ type: 'CARE_APPOINTMENT_BOOKED' });
    });

    it('should validate a plan event', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'plan-service',
        type: 'claim.submitted',
        userId: validUserId,
        journeyType: 'plan',
        payload: {
          submissionDate: validTimestamp,
          amount: 150.75,
          serviceDate: validTimestamp,
          provider: 'Medical Center',
          hasDocuments: true,
          documentCount: 3,
          isFirstClaim: false,
        },
      };

      const result = validatePlanEvent('claim.submitted', event);
      expect(result.valid).toBe(true);
      expect(schemaUtils.hasSchema).toHaveBeenCalledWith({ type: 'PLAN_CLAIM_SUBMITTED' });
    });
  });

  describe('validateWithSchema', () => {
    it('should validate data against a schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
      });

      const validData = { name: 'John', age: 30 };
      const result = validateWithSchema(schema, validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
      });

      const invalidData = { name: 'John', age: -5 };
      const result = validateWithSchema(schema, invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].path).toContain('age');
    });

    it('should add error message prefix', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
      });

      const invalidData = { name: 'John', age: -5 };
      const result = validateWithSchema(schema, invalidData, 'Validation Error: ');
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain('Validation Error: ');
    });
  });

  describe('validateWithSchemaAsync', () => {
    it('should validate data against a schema asynchronously', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
      });

      const validData = { name: 'John', age: 30 };
      const result = await validateWithSchemaAsync(schema, validData);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid data asynchronously', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
      });

      const invalidData = { name: 'John', age: -5 };
      const result = await validateWithSchemaAsync(schema, invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].path).toContain('age');
    });
  });

  describe('createValidationPipeline', () => {
    it('should apply multiple validators in sequence', () => {
      // Create validators
      const nameValidator = (data: any): ValidationResult => {
        if (!data.name || typeof data.name !== 'string') {
          return {
            valid: false,
            errors: [{ path: ['name'], message: 'Name is required and must be a string', code: 'INVALID_TYPE' }],
          };
        }
        return { valid: true, data };
      };

      const ageValidator = (data: any): ValidationResult => {
        if (!data.age || typeof data.age !== 'number' || data.age <= 0) {
          return {
            valid: false,
            errors: [{ path: ['age'], message: 'Age is required and must be a positive number', code: 'INVALID_TYPE' }],
          };
        }
        return { valid: true, data };
      };

      // Create pipeline
      const pipeline = createValidationPipeline([nameValidator, ageValidator]);

      // Test with valid data
      const validData = { name: 'John', age: 30 };
      const validResult = pipeline(validData);
      expect(validResult.valid).toBe(true);

      // Test with invalid name
      const invalidName = { name: '', age: 30 };
      const nameResult = pipeline(invalidName);
      expect(nameResult.valid).toBe(false);
      expect(nameResult.errors![0].path).toContain('name');

      // Test with invalid age
      const invalidAge = { name: 'John', age: -5 };
      const ageResult = pipeline(invalidAge);
      expect(ageResult.valid).toBe(false);
      expect(ageResult.errors![0].path).toContain('age');
    });
  });

  describe('createFieldValidator', () => {
    it('should validate a specific field in an object', () => {
      const ageSchema = z.number().int().positive();
      const ageValidator = createFieldValidator('age', ageSchema);

      // Test with valid data
      const validData = { name: 'John', age: 30 };
      const validResult = ageValidator(validData);
      expect(validResult.valid).toBe(true);

      // Test with invalid age
      const invalidAge = { name: 'John', age: -5 };
      const invalidResult = ageValidator(invalidAge);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors![0].path).toEqual(['age']);

      // Test with missing field
      const missingAge = { name: 'John' };
      const missingResult = ageValidator(missingAge);
      expect(missingResult.valid).toBe(false);
      expect(missingResult.errors![0].path).toEqual(['age']);
      expect(missingResult.errors![0].code).toBe('MISSING_FIELD');

      // Test with non-object
      const nonObject = 'not an object';
      const nonObjectResult = ageValidator(nonObject as any);
      expect(nonObjectResult.valid).toBe(false);
      expect(nonObjectResult.errors![0].path).toEqual([]);
      expect(nonObjectResult.errors![0].code).toBe('INVALID_TYPE');
    });
  });

  describe('createCustomValidator', () => {
    it('should apply custom validation logic after schema validation', () => {
      const userSchema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
      });

      // Custom validator that checks if user is an adult
      const adultValidator = (data: { name: string; age: number }): ValidationResult => {
        if (data.age < 18) {
          return {
            valid: false,
            errors: [{ path: ['age'], message: 'User must be at least 18 years old', code: 'UNDERAGE' }],
          };
        }
        return { valid: true, data };
      };

      const validator = createCustomValidator(userSchema, adultValidator);

      // Test with valid adult
      const validAdult = { name: 'John', age: 30 };
      const validResult = validator(validAdult);
      expect(validResult.valid).toBe(true);

      // Test with underage user
      const underage = { name: 'John', age: 16 };
      const underageResult = validator(underage);
      expect(underageResult.valid).toBe(false);
      expect(underageResult.errors![0].path).toEqual(['age']);
      expect(underageResult.errors![0].code).toBe('UNDERAGE');

      // Test with invalid schema (should fail before custom validation)
      const invalidSchema = { name: 'John', age: -5 };
      const invalidResult = validator(invalidSchema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors![0].path).toContain('age');
      // Should not have the custom error code
      expect(invalidResult.errors![0].code).not.toBe('UNDERAGE');
    });
  });

  describe('createEnumValidator', () => {
    it('should validate that a value is one of the allowed values', () => {
      const statusValidator = createEnumValidator(['pending', 'approved', 'rejected']);

      // Test with valid status
      const validResult = statusValidator('approved');
      expect(validResult.valid).toBe(true);
      expect(validResult.data).toBe('approved');

      // Test with invalid status
      const invalidResult = statusValidator('unknown');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors![0].code).toBe('INVALID_ENUM_VALUE');
      expect(invalidResult.errors![0].message).toContain('Expected one of [pending, approved, rejected]');

      // Test with custom error message
      const customValidator = createEnumValidator(['pending', 'approved', 'rejected'], 'Invalid status value');
      const customResult = customValidator('unknown');
      expect(customResult.valid).toBe(false);
      expect(customResult.errors![0].message).toBe('Invalid status value');
    });
  });

  describe('Validation cache', () => {
    beforeEach(() => {
      setupSchemaRegistry();
    });

    it('should cache validation results', () => {
      const event = {
        eventId: validEventId,
        timestamp: validTimestamp,
        version: '1.0.0',
        source: 'health-service',
        type: 'health.metric.recorded',
        userId: validUserId,
        journeyType: 'health',
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: validTimestamp,
          source: 'manual',
        },
      };

      // First validation should call getSchema
      validateEvent('health.metric.recorded', event);
      expect(schemaUtils.getSchema).toHaveBeenCalledTimes(1);

      // Second validation of the same event should use cache
      validateEvent('health.metric.recorded', event);
      expect(schemaUtils.getSchema).toHaveBeenCalledTimes(1); // Still 1

      // Validation with useCache: false should call getSchema again
      validateEvent('health.metric.recorded', event, undefined, { useCache: false });
      expect(schemaUtils.getSchema).toHaveBeenCalledTimes(2);

      // Clear cache and validate again
      clearValidationCache();
      validateEvent('health.metric.recorded', event);
      expect(schemaUtils.getSchema).toHaveBeenCalledTimes(3);
    });
  });
});