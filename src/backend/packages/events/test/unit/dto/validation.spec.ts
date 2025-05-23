/**
 * @file Unit tests for event validation utilities and decorators
 * @description Tests the custom validation utilities and decorators used for event validation
 */

import { plainToInstance } from 'class-transformer';
import {
  validate,
  validateSync,
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  IsISO8601,
  ValidationError
} from 'class-validator';
import { ZodSchema, z } from 'zod';

import {
  IsRequiredForEventType,
  IsRequiredForJourney,
  ValidateWithZod,
  IsConditionallyRequired,
  IsPhysiologicallyPlausible,
  IsBrazilianCurrency,
  HasRequiredEventFields,
  ValidateEventPayload,
  ZodSchemaValidator,
  createEventSchema,
  validateEvent,
  validateEventPayloadStructure
} from '../../../src/dto/validation';

// Mock interfaces that would normally be imported from event.interface.ts
interface IBaseEvent {
  type: string;
  userId: string;
  journey?: string;
  timestamp?: string;
  data: IEventPayload;
  source?: string;
  version?: string;
}

interface IEventPayload {
  [key: string]: any;
}

describe('Event Validation Decorators', () => {
  // Test classes for decorator validation
  class TestEventDto implements IBaseEvent {
    @IsString()
    type: string;

    @IsUUID()
    userId: string;

    @IsString()
    @IsOptional()
    journey?: string;

    @IsISO8601()
    @IsOptional()
    timestamp?: string;

    @IsObject()
    data: IEventPayload;

    @IsString()
    @IsOptional()
    source?: string;

    @IsString()
    @IsOptional()
    version?: string;
  }

  describe('IsRequiredForEventType', () => {
    class EventTypeTestDto {
      @IsString()
      type: string;

      @IsRequiredForEventType('TEST_EVENT')
      @IsString()
      requiredField: string;

      @IsRequiredForEventType('OTHER_EVENT')
      @IsString()
      @IsOptional()
      otherField?: string;
    }

    it('should validate when required field is present for the specified event type', async () => {
      const dto = plainToInstance(EventTypeTestDto, {
        type: 'TEST_EVENT',
        requiredField: 'value'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required field is missing for the specified event type', async () => {
      const dto = plainToInstance(EventTypeTestDto, {
        type: 'TEST_EVENT'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isRequiredForEventType');
    });

    it('should pass validation when field is missing but event type does not match', async () => {
      const dto = plainToInstance(EventTypeTestDto, {
        type: 'DIFFERENT_EVENT'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate multiple event type conditions correctly', async () => {
      // Should require otherField for OTHER_EVENT
      const dto1 = plainToInstance(EventTypeTestDto, {
        type: 'OTHER_EVENT'
      });

      const errors1 = await validate(dto1);
      expect(errors1.length).toBeGreaterThan(0);
      expect(errors1[0].constraints).toHaveProperty('isRequiredForEventType');

      // Should pass with otherField for OTHER_EVENT
      const dto2 = plainToInstance(EventTypeTestDto, {
        type: 'OTHER_EVENT',
        otherField: 'value'
      });

      const errors2 = await validate(dto2);
      expect(errors2.length).toBe(0);
    });
  });

  describe('IsRequiredForJourney', () => {
    class JourneyTestDto {
      @IsString()
      journey: string;

      @IsRequiredForJourney('health')
      @IsString()
      healthField: string;

      @IsRequiredForJourney('care')
      @IsString()
      @IsOptional()
      careField?: string;
    }

    it('should validate when required field is present for the specified journey', async () => {
      const dto = plainToInstance(JourneyTestDto, {
        journey: 'health',
        healthField: 'value'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required field is missing for the specified journey', async () => {
      const dto = plainToInstance(JourneyTestDto, {
        journey: 'health'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isRequiredForJourney');
    });

    it('should pass validation when field is missing but journey does not match', async () => {
      const dto = plainToInstance(JourneyTestDto, {
        journey: 'plan'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate multiple journey conditions correctly', async () => {
      // Should require careField for care journey
      const dto1 = plainToInstance(JourneyTestDto, {
        journey: 'care'
      });

      const errors1 = await validate(dto1);
      expect(errors1.length).toBeGreaterThan(0);
      expect(errors1[0].constraints).toHaveProperty('isRequiredForJourney');

      // Should pass with careField for care journey
      const dto2 = plainToInstance(JourneyTestDto, {
        journey: 'care',
        careField: 'value'
      });

      const errors2 = await validate(dto2);
      expect(errors2.length).toBe(0);
    });
  });

  describe('ValidateWithZod', () => {
    const TestSchema = z.object({
      name: z.string().min(3),
      age: z.number().int().positive().max(120)
    });

    class ZodTestDto {
      @ValidateWithZod(TestSchema)
      data: { name: string; age: number };
    }

    it('should validate when data matches the Zod schema', async () => {
      const dto = plainToInstance(ZodTestDto, {
        data: { name: 'John', age: 30 }
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when data does not match the Zod schema', async () => {
      const dto = plainToInstance(ZodTestDto, {
        data: { name: 'Jo', age: 150 }
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('validateWithZod');
    });

    it('should provide detailed error messages from Zod validation', async () => {
      const dto = plainToInstance(ZodTestDto, {
        data: { name: 'Jo', age: -5 }
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.validateWithZod).toContain('name');
      expect(errors[0].constraints?.validateWithZod).toContain('age');
    });
  });

  describe('IsConditionallyRequired', () => {
    class ConditionalTestDto {
      @IsString()
      type: string;

      @IsString()
      @IsOptional()
      status?: string;

      @IsConditionallyRequired(
        (obj) => obj.type === 'APPOINTMENT' && obj.status === 'BOOKED'
      )
      @IsString()
      appointmentDate?: string;
    }

    it('should validate when condition is true and field is present', async () => {
      const dto = plainToInstance(ConditionalTestDto, {
        type: 'APPOINTMENT',
        status: 'BOOKED',
        appointmentDate: '2023-01-01'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when condition is true and field is missing', async () => {
      const dto = plainToInstance(ConditionalTestDto, {
        type: 'APPOINTMENT',
        status: 'BOOKED'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isConditionallyRequired');
    });

    it('should pass validation when condition is false and field is missing', async () => {
      const dto = plainToInstance(ConditionalTestDto, {
        type: 'APPOINTMENT',
        status: 'CANCELLED'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle complex conditions correctly', async () => {
      class ComplexConditionDto {
        @IsString()
        type: string;

        @IsNumber()
        @IsOptional()
        value?: number;

        @IsConditionallyRequired(
          (obj) => obj.type === 'METRIC' && (obj.value === undefined || obj.value > 100)
        )
        @IsString()
        warning?: string;
      }

      // Should require warning when type is METRIC and value > 100
      const dto1 = plainToInstance(ComplexConditionDto, {
        type: 'METRIC',
        value: 150
      });

      const errors1 = await validate(dto1);
      expect(errors1.length).toBeGreaterThan(0);

      // Should require warning when type is METRIC and value is undefined
      const dto2 = plainToInstance(ComplexConditionDto, {
        type: 'METRIC'
      });

      const errors2 = await validate(dto2);
      expect(errors2.length).toBeGreaterThan(0);

      // Should not require warning when type is METRIC and value <= 100
      const dto3 = plainToInstance(ComplexConditionDto, {
        type: 'METRIC',
        value: 50
      });

      const errors3 = await validate(dto3);
      expect(errors3.length).toBe(0);
    });
  });

  describe('IsPhysiologicallyPlausible', () => {
    class PhysiologicalTestDto {
      @IsString()
      metricType: string;

      @IsPhysiologicallyPlausible('HEART_RATE')
      @IsNumber()
      heartRate: number;

      @IsPhysiologicallyPlausible('BLOOD_PRESSURE_SYSTOLIC')
      @IsNumber()
      systolic: number;

      @IsPhysiologicallyPlausible('WEIGHT')
      @IsNumber()
      weight: number;
    }

    it('should validate when values are within physiologically plausible ranges', async () => {
      const dto = plainToInstance(PhysiologicalTestDto, {
        metricType: 'HEART_RATE',
        heartRate: 75,
        systolic: 120,
        weight: 70
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when heart rate is outside plausible range', async () => {
      const dto = plainToInstance(PhysiologicalTestDto, {
        metricType: 'HEART_RATE',
        heartRate: 300, // Too high
        systolic: 120,
        weight: 70
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isPhysiologicallyPlausible');
    });

    it('should fail validation when blood pressure is outside plausible range', async () => {
      const dto = plainToInstance(PhysiologicalTestDto, {
        metricType: 'BLOOD_PRESSURE',
        heartRate: 75,
        systolic: 300, // Too high
        weight: 70
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isPhysiologicallyPlausible');
    });

    it('should fail validation when weight is outside plausible range', async () => {
      const dto = plainToInstance(PhysiologicalTestDto, {
        metricType: 'WEIGHT',
        heartRate: 75,
        systolic: 120,
        weight: 600 // Too high
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isPhysiologicallyPlausible');
    });

    it('should handle edge cases correctly', async () => {
      // Test minimum values
      const minDto = plainToInstance(PhysiologicalTestDto, {
        metricType: 'HEART_RATE',
        heartRate: 30, // Minimum allowed
        systolic: 70, // Minimum allowed
        weight: 1 // Minimum allowed
      });

      const minErrors = await validate(minDto);
      expect(minErrors.length).toBe(0);

      // Test maximum values
      const maxDto = plainToInstance(PhysiologicalTestDto, {
        metricType: 'HEART_RATE',
        heartRate: 220, // Maximum allowed
        systolic: 250, // Maximum allowed
        weight: 500 // Maximum allowed
      });

      const maxErrors = await validate(maxDto);
      expect(maxErrors.length).toBe(0);
    });
  });

  describe('IsBrazilianCurrency', () => {
    class CurrencyTestDto {
      @IsBrazilianCurrency()
      numericAmount: number;

      @IsBrazilianCurrency()
      stringAmount: string;
    }

    it('should validate valid numeric currency values', async () => {
      const dto = plainToInstance(CurrencyTestDto, {
        numericAmount: 123.45,
        stringAmount: 'R$ 123,45'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate valid string currency values with thousands separator', async () => {
      const dto = plainToInstance(CurrencyTestDto, {
        numericAmount: 1234.56,
        stringAmount: 'R$ 1.234,56'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid numeric currency values', async () => {
      const dto = plainToInstance(CurrencyTestDto, {
        numericAmount: -123.45, // Negative value
        stringAmount: 'R$ 123,45'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isBrazilianCurrency');
    });

    it('should fail validation for numeric values with too many decimal places', async () => {
      const dto = plainToInstance(CurrencyTestDto, {
        numericAmount: 123.456, // More than 2 decimal places
        stringAmount: 'R$ 123,45'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isBrazilianCurrency');
    });

    it('should fail validation for invalid string currency format', async () => {
      const dto = plainToInstance(CurrencyTestDto, {
        numericAmount: 123.45,
        stringAmount: '123.45' // Not in Brazilian format
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isBrazilianCurrency');
    });

    it('should fail validation for non-numeric and non-string values', async () => {
      const dto = plainToInstance(CurrencyTestDto, {
        numericAmount: true as any, // Boolean instead of number
        stringAmount: 'R$ 123,45'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isBrazilianCurrency');
    });
  });

  describe('HasRequiredEventFields', () => {
    class RequiredFieldsTestDto {
      @HasRequiredEventFields(['id', 'name', 'value'])
      data: IEventPayload;
    }

    it('should validate when all required fields are present', async () => {
      const dto = plainToInstance(RequiredFieldsTestDto, {
        data: { id: '123', name: 'Test', value: 42, extra: 'field' }
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when some required fields are missing', async () => {
      const dto = plainToInstance(RequiredFieldsTestDto, {
        data: { id: '123', name: 'Test' } // Missing 'value'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('hasRequiredEventFields');
    });

    it('should fail validation when required fields are null or undefined', async () => {
      const dto = plainToInstance(RequiredFieldsTestDto, {
        data: { id: '123', name: null, value: undefined }
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('hasRequiredEventFields');
    });

    it('should fail validation when data is not an object', async () => {
      const dto = plainToInstance(RequiredFieldsTestDto, {
        data: 'not an object'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('hasRequiredEventFields');
    });

    it('should handle empty required fields array', async () => {
      class EmptyRequiredFieldsTestDto {
        @HasRequiredEventFields([])
        data: IEventPayload;
      }

      const dto = plainToInstance(EmptyRequiredFieldsTestDto, {
        data: {}
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('ValidateEventPayload', () => {
    class EventPayloadTestDto implements IBaseEvent {
      @IsString()
      type: string;

      @IsString()
      userId: string;

      @IsString()
      journey: string;

      @ValidateEventPayload('health', 'HEALTH_METRIC_RECORDED')
      data: IEventPayload;

      @IsString()
      @IsOptional()
      source?: string;

      @IsString()
      @IsOptional()
      version?: string;

      @IsString()
      @IsOptional()
      timestamp?: string;
    }

    it('should validate valid health metric event payload', async () => {
      const dto = plainToInstance(EventPayloadTestDto, {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        journey: 'health',
        data: {
          metricType: 'HEART_RATE',
          metricValue: 75,
          unit: 'bpm'
        }
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid health metric event payload', async () => {
      const dto = plainToInstance(EventPayloadTestDto, {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        journey: 'health',
        data: {
          metricType: 'HEART_RATE',
          // Missing metricValue
          unit: 'bpm'
        }
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('validateEventPayload');
    });

    it('should skip validation for different event types', async () => {
      const dto = plainToInstance(EventPayloadTestDto, {
        type: 'DIFFERENT_EVENT',
        userId: 'user-123',
        journey: 'health',
        data: {} // Empty data should be fine for different event type
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should skip validation for different journeys', async () => {
      const dto = plainToInstance(EventPayloadTestDto, {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        journey: 'care', // Different journey
        data: {} // Empty data should be fine for different journey
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate care journey events correctly', async () => {
      class CareEventPayloadTestDto implements IBaseEvent {
        @IsString()
        type: string;

        @IsString()
        userId: string;

        @IsString()
        journey: string;

        @ValidateEventPayload('care', 'APPOINTMENT_BOOKED')
        data: IEventPayload;

        @IsString()
        @IsOptional()
        source?: string;

        @IsString()
        @IsOptional()
        version?: string;

        @IsString()
        @IsOptional()
        timestamp?: string;
      }

      // Valid appointment event
      const validDto = plainToInstance(CareEventPayloadTestDto, {
        type: 'APPOINTMENT_BOOKED',
        userId: 'user-123',
        journey: 'care',
        data: {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          appointmentDate: new Date()
        }
      });

      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);

      // Invalid appointment event (missing providerId)
      const invalidDto = plainToInstance(CareEventPayloadTestDto, {
        type: 'APPOINTMENT_BOOKED',
        userId: 'user-123',
        journey: 'care',
        data: {
          appointmentId: 'appt-123',
          // Missing providerId
          appointmentDate: new Date()
        }
      });

      const invalidErrors = await validate(invalidDto);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });

    it('should validate plan journey events correctly', async () => {
      class PlanEventPayloadTestDto implements IBaseEvent {
        @IsString()
        type: string;

        @IsString()
        userId: string;

        @IsString()
        journey: string;

        @ValidateEventPayload('plan', 'CLAIM_SUBMITTED')
        data: IEventPayload;

        @IsString()
        @IsOptional()
        source?: string;

        @IsString()
        @IsOptional()
        version?: string;

        @IsString()
        @IsOptional()
        timestamp?: string;
      }

      // Valid claim event
      const validDto = plainToInstance(PlanEventPayloadTestDto, {
        type: 'CLAIM_SUBMITTED',
        userId: 'user-123',
        journey: 'plan',
        data: {
          claimId: 'claim-123',
          amount: 100.50,
          claimType: 'MEDICAL'
        }
      });

      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);

      // Invalid claim event (missing amount)
      const invalidDto = plainToInstance(PlanEventPayloadTestDto, {
        type: 'CLAIM_SUBMITTED',
        userId: 'user-123',
        journey: 'plan',
        data: {
          claimId: 'claim-123',
          // Missing amount
          claimType: 'MEDICAL'
        }
      });

      const invalidErrors = await validate(invalidDto);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });
  });
});

describe('Event Validation Utilities', () => {
  describe('createEventSchema', () => {
    it('should create a valid Zod schema for events', () => {
      const dataSchema = z.object({
        metricType: z.string(),
        metricValue: z.number().positive(),
        unit: z.string()
      });

      const eventSchema = createEventSchema('health', 'HEALTH_METRIC_RECORDED', dataSchema);

      // Valid event
      const validEvent = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123e4567-e89b-12d3-a456-426614174000', // UUID format
        journey: 'health',
        timestamp: '2023-01-01T12:00:00Z', // ISO date
        data: {
          metricType: 'HEART_RATE',
          metricValue: 75,
          unit: 'bpm'
        }
      };

      const validResult = eventSchema.safeParse(validEvent);
      expect(validResult.success).toBe(true);

      // Invalid event (wrong type)
      const invalidTypeEvent = {
        ...validEvent,
        type: 'WRONG_TYPE'
      };

      const invalidTypeResult = eventSchema.safeParse(invalidTypeEvent);
      expect(invalidTypeResult.success).toBe(false);

      // Invalid event (wrong journey)
      const invalidJourneyEvent = {
        ...validEvent,
        journey: 'care'
      };

      const invalidJourneyResult = eventSchema.safeParse(invalidJourneyEvent);
      expect(invalidJourneyResult.success).toBe(false);

      // Invalid event (invalid data)
      const invalidDataEvent = {
        ...validEvent,
        data: {
          metricType: 'HEART_RATE',
          metricValue: -10, // Negative value
          unit: 'bpm'
        }
      };

      const invalidDataResult = eventSchema.safeParse(invalidDataEvent);
      expect(invalidDataResult.success).toBe(false);
    });

    it('should handle optional fields correctly', () => {
      const dataSchema = z.object({
        id: z.string(),
        value: z.number().optional()
      });

      const eventSchema = createEventSchema('health', 'TEST_EVENT', dataSchema);

      // Event with optional fields
      const event = {
        type: 'TEST_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: '2023-01-01T12:00:00Z',
        data: {
          id: '123'
          // value is optional
        },
        source: 'test-source', // Optional
        version: '1.0.0' // Optional
      };

      const result = eventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('validateEvent', () => {
    it('should validate events using class-validator', async () => {
      class TestEventDto implements IBaseEvent {
        @IsString()
        type: string;

        @IsString()
        userId: string;

        @IsString()
        @IsOptional()
        journey?: string;

        @IsObject()
        data: IEventPayload;

        @IsString()
        @IsOptional()
        source?: string;

        @IsString()
        @IsOptional()
        version?: string;

        @IsString()
        @IsOptional()
        timestamp?: string;
      }

      const validEvent = plainToInstance(TestEventDto, {
        type: 'TEST_EVENT',
        userId: 'user-123',
        data: { field: 'value' }
      });

      const validResult = await validateEvent(validEvent);
      expect(validResult.isValid).toBe(true);

      const invalidEvent = plainToInstance(TestEventDto, {
        // Missing type
        userId: 'user-123',
        data: { field: 'value' }
      });

      const invalidResult = await validateEvent(invalidEvent);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });

    it('should validate events using Zod schema', async () => {
      const dataSchema = z.object({
        field: z.string()
      });

      const eventSchema = createEventSchema('test', 'TEST_EVENT', dataSchema);

      const validEvent = {
        type: 'TEST_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'test',
        timestamp: '2023-01-01T12:00:00Z',
        data: {
          field: 'value'
        }
      };

      const validResult = await validateEvent(validEvent, eventSchema);
      expect(validResult.isValid).toBe(true);

      const invalidEvent = {
        ...validEvent,
        data: {
          field: 123 // Should be string
        }
      };

      const invalidResult = await validateEvent(invalidEvent, eventSchema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });

    it('should validate using both class-validator and Zod', async () => {
      class TestEventDto implements IBaseEvent {
        @IsString()
        type: string;

        @IsString()
        userId: string;

        @IsString()
        journey: string;

        @IsObject()
        data: IEventPayload;

        @IsString()
        @IsOptional()
        timestamp?: string;
      }

      const dataSchema = z.object({
        field: z.string().min(3)
      });

      const eventSchema = createEventSchema('test', 'TEST_EVENT', dataSchema);

      const validEvent = plainToInstance(TestEventDto, {
        type: 'TEST_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'test',
        timestamp: '2023-01-01T12:00:00Z',
        data: {
          field: 'value'
        }
      });

      const validResult = await validateEvent(validEvent, eventSchema);
      expect(validResult.isValid).toBe(true);

      // Invalid according to class-validator (missing userId)
      const invalidClassEvent = plainToInstance(TestEventDto, {
        type: 'TEST_EVENT',
        // Missing userId
        journey: 'test',
        data: {
          field: 'value'
        }
      });

      const invalidClassResult = await validateEvent(invalidClassEvent, eventSchema);
      expect(invalidClassResult.isValid).toBe(false);

      // Invalid according to Zod (field too short)
      const invalidZodEvent = plainToInstance(TestEventDto, {
        type: 'TEST_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'test',
        data: {
          field: 'va' // Too short
        }
      });

      const invalidZodResult = await validateEvent(invalidZodEvent, eventSchema);
      expect(invalidZodResult.isValid).toBe(false);
    });
  });

  describe('validateEventPayloadStructure', () => {
    it('should validate health event structures correctly', () => {
      // Valid health metric event
      const validHealthEvent = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        journey: 'health',
        data: {
          metricType: 'HEART_RATE',
          metricValue: 75,
          unit: 'bpm'
        }
      };

      const validResult = validateEventPayloadStructure(validHealthEvent);
      expect(validResult.isValid).toBe(true);

      // Invalid health metric event (missing metricValue)
      const invalidHealthEvent = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: 'user-123',
        journey: 'health',
        data: {
          metricType: 'HEART_RATE',
          // Missing metricValue
          unit: 'bpm'
        }
      };

      const invalidResult = validateEventPayloadStructure(invalidHealthEvent);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });

    it('should validate care event structures correctly', () => {
      // Valid appointment event
      const validCareEvent = {
        type: 'APPOINTMENT_BOOKED',
        userId: 'user-123',
        journey: 'care',
        data: {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          appointmentDate: '2023-01-01'
        }
      };

      const validResult = validateEventPayloadStructure(validCareEvent);
      expect(validResult.isValid).toBe(true);

      // Invalid appointment event (missing appointmentDate)
      const invalidCareEvent = {
        type: 'APPOINTMENT_BOOKED',
        userId: 'user-123',
        journey: 'care',
        data: {
          appointmentId: 'appt-123',
          providerId: 'provider-123',
          // Missing appointmentDate
        }
      };

      const invalidResult = validateEventPayloadStructure(invalidCareEvent);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });

    it('should validate plan event structures correctly', () => {
      // Valid claim event
      const validPlanEvent = {
        type: 'CLAIM_SUBMITTED',
        userId: 'user-123',
        journey: 'plan',
        data: {
          claimId: 'claim-123',
          amount: 100.50,
          claimType: 'MEDICAL'
        }
      };

      const validResult = validateEventPayloadStructure(validPlanEvent);
      expect(validResult.isValid).toBe(true);

      // Invalid claim event (missing claimType)
      const invalidPlanEvent = {
        type: 'CLAIM_SUBMITTED',
        userId: 'user-123',
        journey: 'plan',
        data: {
          claimId: 'claim-123',
          amount: 100.50,
          // Missing claimType
        }
      };

      const invalidResult = validateEventPayloadStructure(invalidPlanEvent);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });

    it('should handle events without journey specified', () => {
      const eventWithoutJourney = {
        type: 'GENERIC_EVENT',
        userId: 'user-123',
        // No journey specified
        data: {
          field: 'value'
        }
      };

      const result = validateEventPayloadStructure(eventWithoutJourney);
      expect(result.isValid).toBe(true); // Should pass as we can't do journey-specific validation
    });

    it('should handle invalid event objects', () => {
      // Not an object
      const notObjectResult = validateEventPayloadStructure('not an object' as any);
      expect(notObjectResult.isValid).toBe(false);

      // Missing type
      const missingTypeResult = validateEventPayloadStructure({
        userId: 'user-123',
        data: {}
      } as any);
      expect(missingTypeResult.isValid).toBe(false);

      // Missing userId
      const missingUserIdResult = validateEventPayloadStructure({
        type: 'EVENT',
        data: {}
      } as any);
      expect(missingUserIdResult.isValid).toBe(false);

      // Missing data
      const missingDataResult = validateEventPayloadStructure({
        type: 'EVENT',
        userId: 'user-123'
      } as any);
      expect(missingDataResult.isValid).toBe(false);

      // Data not an object
      const dataNotObjectResult = validateEventPayloadStructure({
        type: 'EVENT',
        userId: 'user-123',
        data: 'not an object'
      } as any);
      expect(dataNotObjectResult.isValid).toBe(false);
    });
  });

  describe('ZodSchemaValidator', () => {
    it('should validate values against a Zod schema', () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().int().positive()
      });

      const validator = new ZodSchemaValidator(schema);

      // Valid value
      expect(validator.validate({ name: 'John', age: 30 }, {} as any)).toBe(true);

      // Invalid value (name too short)
      expect(validator.validate({ name: 'Jo', age: 30 }, {} as any)).toBe(false);

      // Invalid value (age negative)
      expect(validator.validate({ name: 'John', age: -5 }, {} as any)).toBe(false);

      // Invalid value (not an object)
      expect(validator.validate('not an object', {} as any)).toBe(false);
    });

    it('should provide detailed error messages', () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().int().positive()
      });

      const validator = new ZodSchemaValidator(schema);

      // Invalid value with multiple errors
      const errorMessage = validator.defaultMessage({
        value: { name: 'Jo', age: -5 },
        constraints: [],
        property: 'test',
        target: {},
        targetName: 'Test',
        object: {},
        value: { name: 'Jo', age: -5 }
      } as any);

      expect(errorMessage).toContain('name');
      expect(errorMessage).toContain('age');
    });
  });
});