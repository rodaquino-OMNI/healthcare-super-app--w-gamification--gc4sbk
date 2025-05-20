/**
 * @file validation.spec.ts
 * @description Unit tests for the custom validation utilities and decorators used for event validation.
 * Tests verify that custom validators work correctly for journey-specific fields, complex object validation,
 * conditional validation logic, and more.
 */

import { plainToInstance } from 'class-transformer';
import { validate, validateSync, ValidationError as ClassValidatorError } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import * as validators from '../../../src/dto/validation';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../../src/dto/event-metadata.dto';

// Test classes for validation decorators
class JourneyTest {
  @validators.IsValidJourney()
  journey: string;

  constructor(journey: string) {
    this.journey = journey;
  }
}

class EventTypeTest {
  @validators.IsValidJourney()
  journey: string;

  @validators.IsValidEventType('@journey')
  eventType: string;

  constructor(journey: string, eventType: string) {
    this.journey = journey;
    this.eventType = eventType;
  }
}

class UUIDTest {
  @validators.IsValidUUID()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

class ConditionalTest {
  type: string;

  @validators.IsRequiredWhen('type', ['TYPE_A', 'TYPE_B'])
  requiredForTypeAB: string;

  @validators.IsProhibitedWhen('type', ['TYPE_C', 'TYPE_D'])
  prohibitedForTypeCD: string;

  constructor(type: string, requiredForTypeAB?: string, prohibitedForTypeCD?: string) {
    this.type = type;
    this.requiredForTypeAB = requiredForTypeAB;
    this.prohibitedForTypeCD = prohibitedForTypeCD;
  }
}

class ISODateTest {
  @validators.IsValidISODate()
  date: string;

  constructor(date: string) {
    this.date = date;
  }
}

class HealthMetricTest {
  metricType: string;

  @validators.IsValidHealthMetricValue()
  value: number;

  @validators.IsValidHealthMetricUnit()
  unit: string;

  constructor(metricType: string, value: number, unit: string) {
    this.metricType = metricType;
    this.value = value;
    this.unit = unit;
  }
}

class DeviceTypeTest {
  @validators.IsValidDeviceType()
  deviceType: string;

  constructor(deviceType: string) {
    this.deviceType = deviceType;
  }
}

class AppointmentStatusTest {
  @validators.IsValidAppointmentStatus()
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}

class ClaimStatusTest {
  @validators.IsValidClaimStatus()
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}

class EventMetadataTest {
  @validators.HasValidEventMetadata()
  metadata: EventMetadataDto;

  constructor(metadata: EventMetadataDto) {
    this.metadata = metadata;
  }
}

describe('Validation Decorators', () => {
  describe('IsValidJourney', () => {
    it('should validate valid journey names', async () => {
      const validJourneys = ['health', 'care', 'plan', 'user', 'gamification'];
      
      for (const journey of validJourneys) {
        const test = new JourneyTest(journey);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid journey names', async () => {
      const invalidJourneys = ['invalid', 'unknown', '', null, undefined];
      
      for (const journey of invalidJourneys) {
        const test = new JourneyTest(journey as string);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidJourney');
      }
    });

    it('should be case insensitive', async () => {
      const test = new JourneyTest('HEALTH');
      const errors = await validate(test);
      expect(errors.length).toBe(0);
    });
  });

  describe('IsValidEventType', () => {
    it('should validate valid health event types', async () => {
      const validEventTypes = [
        'HEALTH_METRIC_RECORDED',
        'HEALTH_GOAL_ACHIEVED',
        'HEALTH_GOAL_CREATED',
        'HEALTH_GOAL_UPDATED',
        'DEVICE_SYNCHRONIZED',
        'HEALTH_INSIGHT_GENERATED'
      ];
      
      for (const eventType of validEventTypes) {
        const test = new EventTypeTest('health', eventType);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should validate valid care event types', async () => {
      const validEventTypes = [
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_COMPLETED',
        'APPOINTMENT_CANCELLED',
        'MEDICATION_ADHERENCE',
        'TELEMEDICINE_SESSION_STARTED',
        'TELEMEDICINE_SESSION_ENDED',
        'CARE_PLAN_UPDATED'
      ];
      
      for (const eventType of validEventTypes) {
        const test = new EventTypeTest('care', eventType);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should validate valid plan event types', async () => {
      const validEventTypes = [
        'CLAIM_SUBMITTED',
        'CLAIM_UPDATED',
        'CLAIM_APPROVED',
        'CLAIM_REJECTED',
        'BENEFIT_UTILIZED',
        'PLAN_SELECTED',
        'PLAN_COMPARED'
      ];
      
      for (const eventType of validEventTypes) {
        const test = new EventTypeTest('plan', eventType);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject event types from different journeys', async () => {
      // Health journey with care event type
      const test = new EventTypeTest('health', 'APPOINTMENT_BOOKED');
      const errors = await validate(test);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidEventType');
    });

    it('should reject invalid event types', async () => {
      const test = new EventTypeTest('health', 'INVALID_EVENT');
      const errors = await validate(test);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidEventType');
    });

    it('should handle invalid journey values', async () => {
      const test = new EventTypeTest('invalid', 'HEALTH_METRIC_RECORDED');
      const errors = await validate(test);
      // Should have at least two errors: one for invalid journey and one for invalid event type
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('IsValidUUID', () => {
    it('should validate valid UUIDs', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '00000000-0000-4000-a000-000000000000'
      ];
      
      for (const uuid of validUUIDs) {
        const test = new UUIDTest(uuid);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid UUIDs', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // Incomplete
        '123e4567-e89b-12d3-a456-4266141740zz', // Invalid characters
        '', // Empty string
        null, // Null
        undefined // Undefined
      ];
      
      for (const uuid of invalidUUIDs) {
        const test = new UUIDTest(uuid as string);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidUUID');
      }
    });
  });

  describe('IsRequiredWhen and IsProhibitedWhen', () => {
    it('should require a field when the condition is met', async () => {
      // TYPE_A requires requiredForTypeAB
      const testA = new ConditionalTest('TYPE_A', undefined);
      const errorsA = await validate(testA);
      expect(errorsA.length).toBeGreaterThan(0);
      expect(errorsA[0].constraints).toHaveProperty('isRequiredWhen');

      // TYPE_A with value should pass
      const testAWithValue = new ConditionalTest('TYPE_A', 'value');
      const errorsAWithValue = await validate(testAWithValue);
      expect(errorsAWithValue.length).toBe(0);

      // TYPE_C doesn't require requiredForTypeAB
      const testC = new ConditionalTest('TYPE_C', undefined);
      const errorsC = await validate(testC);
      expect(errorsC.length).toBe(0);
    });

    it('should prohibit a field when the condition is met', async () => {
      // TYPE_C prohibits prohibitedForTypeCD
      const testC = new ConditionalTest('TYPE_C', undefined, 'value');
      const errorsC = await validate(testC);
      expect(errorsC.length).toBeGreaterThan(0);
      expect(errorsC[0].constraints).toHaveProperty('isProhibitedWhen');

      // TYPE_C without prohibited value should pass
      const testCWithoutValue = new ConditionalTest('TYPE_C', undefined, undefined);
      const errorsCWithoutValue = await validate(testCWithoutValue);
      expect(errorsCWithoutValue.length).toBe(0);

      // TYPE_A allows prohibitedForTypeCD
      const testA = new ConditionalTest('TYPE_A', 'value', 'value');
      const errorsA = await validate(testA);
      expect(errorsA.length).toBe(0);
    });

    it('should handle complex conditional validation scenarios', async () => {
      // TYPE_A requires requiredForTypeAB and allows prohibitedForTypeCD
      const testA = new ConditionalTest('TYPE_A', 'value', 'value');
      const errorsA = await validate(testA);
      expect(errorsA.length).toBe(0);

      // TYPE_C doesn't require requiredForTypeAB but prohibits prohibitedForTypeCD
      const testC = new ConditionalTest('TYPE_C', undefined, undefined);
      const errorsC = await validate(testC);
      expect(errorsC.length).toBe(0);

      // TYPE_C with both fields - should fail on prohibited
      const testCBoth = new ConditionalTest('TYPE_C', 'value', 'value');
      const errorsCBoth = await validate(testCBoth);
      expect(errorsCBoth.length).toBeGreaterThan(0);
      expect(errorsCBoth[0].constraints).toHaveProperty('isProhibitedWhen');
    });
  });

  describe('IsValidISODate', () => {
    it('should validate valid ISO date strings', async () => {
      const validDates = [
        '2023-01-01T00:00:00.000Z',
        '2023-12-31T23:59:59.999Z',
        new Date().toISOString()
      ];
      
      for (const date of validDates) {
        const test = new ISODateTest(date);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid ISO date strings', async () => {
      const invalidDates = [
        '2023-01-01', // Missing time component
        '2023/01/01', // Wrong format
        'not a date',
        '',
        null,
        undefined
      ];
      
      for (const date of invalidDates) {
        const test = new ISODateTest(date as string);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidISODate');
      }
    });
  });

  describe('IsValidHealthMetricValue', () => {
    it('should validate valid health metric values based on metric type', async () => {
      const validMetrics = [
        { type: 'HEART_RATE', value: 75, unit: 'bpm' },
        { type: 'BLOOD_GLUCOSE', value: 100, unit: 'mg/dL' },
        { type: 'STEPS', value: 10000, unit: 'steps' },
        { type: 'SLEEP', value: 8, unit: 'hours' },
        { type: 'WEIGHT', value: 70, unit: 'kg' },
        { type: 'TEMPERATURE', value: 37, unit: '°C' },
        { type: 'OXYGEN_SATURATION', value: 98, unit: '%' },
        { type: 'RESPIRATORY_RATE', value: 16, unit: 'breaths/min' },
        { type: 'WATER_INTAKE', value: 2000, unit: 'ml' },
        { type: 'CALORIES', value: 2500, unit: 'kcal' }
      ];
      
      for (const metric of validMetrics) {
        const test = new HealthMetricTest(metric.type, metric.value, metric.unit);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid health metric values based on metric type', async () => {
      const invalidMetrics = [
        { type: 'HEART_RATE', value: 300, unit: 'bpm' }, // Too high
        { type: 'BLOOD_GLUCOSE', value: 10, unit: 'mg/dL' }, // Too low
        { type: 'STEPS', value: -100, unit: 'steps' }, // Negative
        { type: 'SLEEP', value: 30, unit: 'hours' }, // Too many hours
        { type: 'WEIGHT', value: -10, unit: 'kg' }, // Negative
        { type: 'TEMPERATURE', value: 50, unit: '°C' }, // Too high
        { type: 'OXYGEN_SATURATION', value: 120, unit: '%' }, // Over 100%
        { type: 'RESPIRATORY_RATE', value: -5, unit: 'breaths/min' } // Negative
      ];
      
      for (const metric of invalidMetrics) {
        const test = new HealthMetricTest(metric.type, metric.value, metric.unit);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidHealthMetricValue');
      }
    });

    it('should reject non-numeric values', async () => {
      const test = new HealthMetricTest('HEART_RATE', 'not-a-number' as any, 'bpm');
      const errors = await validate(test);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidHealthMetricValue');
    });
  });

  describe('IsValidHealthMetricUnit', () => {
    it('should validate valid health metric units based on metric type', async () => {
      const validMetrics = [
        { type: 'HEART_RATE', value: 75, unit: 'bpm' },
        { type: 'BLOOD_GLUCOSE', value: 100, unit: 'mg/dL' },
        { type: 'BLOOD_GLUCOSE', value: 5.5, unit: 'mmol/L' },
        { type: 'STEPS', value: 10000, unit: 'steps' },
        { type: 'SLEEP', value: 8, unit: 'hours' },
        { type: 'SLEEP', value: 480, unit: 'minutes' },
        { type: 'WEIGHT', value: 70, unit: 'kg' },
        { type: 'WEIGHT', value: 154, unit: 'lb' },
        { type: 'TEMPERATURE', value: 37, unit: '°C' },
        { type: 'TEMPERATURE', value: 98.6, unit: '°F' },
        { type: 'OXYGEN_SATURATION', value: 98, unit: '%' },
        { type: 'RESPIRATORY_RATE', value: 16, unit: 'breaths/min' },
        { type: 'WATER_INTAKE', value: 2000, unit: 'ml' },
        { type: 'WATER_INTAKE', value: 68, unit: 'oz' },
        { type: 'CALORIES', value: 2500, unit: 'kcal' }
      ];
      
      for (const metric of validMetrics) {
        const test = new HealthMetricTest(metric.type, metric.value, metric.unit);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid health metric units based on metric type', async () => {
      const invalidMetrics = [
        { type: 'HEART_RATE', value: 75, unit: 'kg' }, // Wrong unit
        { type: 'BLOOD_GLUCOSE', value: 100, unit: 'bpm' }, // Wrong unit
        { type: 'STEPS', value: 10000, unit: 'meters' }, // Wrong unit
        { type: 'SLEEP', value: 8, unit: 'days' }, // Wrong unit
        { type: 'WEIGHT', value: 70, unit: 'tons' }, // Wrong unit
        { type: 'TEMPERATURE', value: 37, unit: 'K' }, // Wrong unit
        { type: 'OXYGEN_SATURATION', value: 98, unit: 'ppm' }, // Wrong unit
        { type: 'RESPIRATORY_RATE', value: 16, unit: 'per hour' } // Wrong unit
      ];
      
      for (const metric of invalidMetrics) {
        const test = new HealthMetricTest(metric.type, metric.value, metric.unit);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidHealthMetricUnit');
      }
    });

    it('should reject non-string units', async () => {
      const test = new HealthMetricTest('HEART_RATE', 75, 123 as any);
      const errors = await validate(test);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidHealthMetricUnit');
    });
  });

  describe('IsValidDeviceType', () => {
    it('should validate valid device types', async () => {
      const validDeviceTypes = [
        'FITNESS_TRACKER',
        'SMARTWATCH',
        'BLOOD_PRESSURE_MONITOR',
        'GLUCOSE_MONITOR',
        'SCALE',
        'SLEEP_TRACKER',
        'THERMOMETER',
        'PULSE_OXIMETER'
      ];
      
      for (const deviceType of validDeviceTypes) {
        const test = new DeviceTypeTest(deviceType);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid device types', async () => {
      const invalidDeviceTypes = [
        'UNKNOWN_DEVICE',
        'SMARTPHONE', // Not in the list
        '',
        null,
        undefined
      ];
      
      for (const deviceType of invalidDeviceTypes) {
        const test = new DeviceTypeTest(deviceType as string);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidDeviceType');
      }
    });
  });

  describe('IsValidAppointmentStatus', () => {
    it('should validate valid appointment statuses', async () => {
      const validStatuses = [
        'SCHEDULED',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'RESCHEDULED'
      ];
      
      for (const status of validStatuses) {
        const test = new AppointmentStatusTest(status);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid appointment statuses', async () => {
      const invalidStatuses = [
        'PENDING', // Not in the list
        'UNKNOWN',
        '',
        null,
        undefined
      ];
      
      for (const status of invalidStatuses) {
        const test = new AppointmentStatusTest(status as string);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidAppointmentStatus');
      }
    });
  });

  describe('IsValidClaimStatus', () => {
    it('should validate valid claim statuses', async () => {
      const validStatuses = [
        'SUBMITTED',
        'UNDER_REVIEW',
        'ADDITIONAL_INFO_REQUIRED',
        'APPROVED',
        'PARTIALLY_APPROVED',
        'REJECTED',
        'PAYMENT_PENDING',
        'PAYMENT_PROCESSED',
        'APPEALED'
      ];
      
      for (const status of validStatuses) {
        const test = new ClaimStatusTest(status);
        const errors = await validate(test);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid claim statuses', async () => {
      const invalidStatuses = [
        'PENDING', // Not in the list
        'UNKNOWN',
        '',
        null,
        undefined
      ];
      
      for (const status of invalidStatuses) {
        const test = new ClaimStatusTest(status as string);
        const errors = await validate(test);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidClaimStatus');
      }
    });
  });

  describe('HasValidEventMetadata', () => {
    it('should validate valid event metadata', async () => {
      const validMetadata = new EventMetadataDto();
      validMetadata.correlationId = '123e4567-e89b-12d3-a456-426614174000';
      validMetadata.timestamp = new Date();
      validMetadata.origin = { service: 'test-service' };
      
      const test = new EventMetadataTest(validMetadata);
      const errors = await validate(test);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid event metadata', async () => {
      // Invalid origin (missing required service)
      const invalidMetadata = new EventMetadataDto();
      invalidMetadata.correlationId = '123e4567-e89b-12d3-a456-426614174000';
      invalidMetadata.timestamp = new Date();
      invalidMetadata.origin = {} as EventOriginDto; // Missing required service
      
      const test = new EventMetadataTest(invalidMetadata);
      const errors = await validate(test);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-object metadata', async () => {
      const test = new EventMetadataTest('not-an-object' as any);
      const errors = await validate(test);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('hasValidEventMetadata');
    });

    it('should reject null or undefined metadata', async () => {
      const testNull = new EventMetadataTest(null as any);
      const errorsNull = await validate(testNull);
      expect(errorsNull.length).toBeGreaterThan(0);
      expect(errorsNull[0].constraints).toHaveProperty('hasValidEventMetadata');

      const testUndefined = new EventMetadataTest(undefined as any);
      const errorsUndefined = await validate(testUndefined);
      expect(errorsUndefined.length).toBeGreaterThan(0);
      expect(errorsUndefined[0].constraints).toHaveProperty('hasValidEventMetadata');
    });
  });
});

describe('Validation Utility Functions', () => {
  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      // Create a mock validation error
      const mockError: ClassValidatorError = {
        property: 'testProperty',
        constraints: {
          isString: 'testProperty must be a string',
          isNotEmpty: 'testProperty should not be empty'
        },
        children: [],
        target: {},
        value: null,
        contexts: {},
      };

      const formattedErrors = validators.formatValidationErrors([mockError]);
      
      expect(formattedErrors.length).toBe(1);
      expect(formattedErrors[0].property).toBe('testProperty');
      expect(formattedErrors[0].errorCode).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(formattedErrors[0].constraints).toEqual(mockError.constraints);
    });

    it('should handle nested validation errors', () => {
      // Create a mock validation error with children
      const childError: ClassValidatorError = {
        property: 'childProperty',
        constraints: {
          isNumber: 'childProperty must be a number'
        },
        children: [],
        target: {},
        value: null,
        contexts: {},
      };

      const parentError: ClassValidatorError = {
        property: 'parentProperty',
        constraints: {
          isObject: 'parentProperty must be an object'
        },
        children: [childError],
        target: {},
        value: null,
        contexts: {},
      };

      const formattedErrors = validators.formatValidationErrors([parentError]);
      
      expect(formattedErrors.length).toBe(1);
      expect(formattedErrors[0].property).toBe('parentProperty');
      expect(formattedErrors[0].children.length).toBe(1);
      expect(formattedErrors[0].children[0].property).toBe('childProperty');
      expect(formattedErrors[0].children[0].constraints).toEqual(childError.constraints);
    });
  });

  describe('validateObject', () => {
    it('should return null for valid objects', async () => {
      const validObject = new JourneyTest('health');
      const errors = await validators.validateObject(validObject);
      expect(errors).toBeNull();
    });

    it('should return formatted errors for invalid objects', async () => {
      const invalidObject = new JourneyTest('invalid');
      const errors = await validators.validateObject(invalidObject);
      expect(errors).not.toBeNull();
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('journey');
      expect(errors[0].errorCode).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
    });

    it('should respect validation options', async () => {
      // Create an object with multiple validation errors
      const invalidObject = new EventTypeTest('invalid', 'invalid');
      
      // Validate with skipMissingProperties option
      const errors = await validators.validateObject(invalidObject, { skipMissingProperties: true });
      expect(errors).not.toBeNull();
    });
  });

  describe('isUUID', () => {
    it('should return true for valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '00000000-0000-4000-a000-000000000000'
      ];
      
      for (const uuid of validUUIDs) {
        expect(validators.isUUID(uuid)).toBe(true);
      }
    });

    it('should return false for invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // Incomplete
        '123e4567-e89b-12d3-a456-4266141740zz', // Invalid characters
        '', // Empty string
        null, // Null
        undefined, // Undefined
        123, // Number
        {}, // Object
        [] // Array
      ];
      
      for (const uuid of invalidUUIDs) {
        expect(validators.isUUID(uuid)).toBe(false);
      }
    });
  });

  describe('isISODate', () => {
    it('should return true for valid ISO date strings', () => {
      const validDates = [
        '2023-01-01T00:00:00.000Z',
        '2023-12-31T23:59:59.999Z',
        new Date().toISOString()
      ];
      
      for (const date of validDates) {
        expect(validators.isISODate(date)).toBe(true);
      }
    });

    it('should return false for invalid ISO date strings', () => {
      const invalidDates = [
        '2023-01-01', // Missing time component
        '2023/01/01', // Wrong format
        'not a date',
        '', // Empty string
        null, // Null
        undefined, // Undefined
        123, // Number
        {}, // Object
        [] // Array
      ];
      
      for (const date of invalidDates) {
        expect(validators.isISODate(date)).toBe(false);
      }
    });
  });

  describe('isValidJourney', () => {
    it('should return true for valid journey names', () => {
      const validJourneys = ['health', 'care', 'plan', 'user', 'gamification'];
      
      for (const journey of validJourneys) {
        expect(validators.isValidJourney(journey)).toBe(true);
      }
    });

    it('should return false for invalid journey names', () => {
      const invalidJourneys = [
        'invalid',
        'unknown',
        '', // Empty string
        null, // Null
        undefined, // Undefined
        123, // Number
        {}, // Object
        [] // Array
      ];
      
      for (const journey of invalidJourneys) {
        expect(validators.isValidJourney(journey)).toBe(false);
      }
    });

    it('should be case insensitive', () => {
      expect(validators.isValidJourney('HEALTH')).toBe(true);
      expect(validators.isValidJourney('Care')).toBe(true);
      expect(validators.isValidJourney('PLAN')).toBe(true);
    });
  });

  describe('isValidEventType', () => {
    it('should return true for valid event types in the correct journey', () => {
      // Health journey event types
      expect(validators.isValidEventType('HEALTH_METRIC_RECORDED', 'health')).toBe(true);
      expect(validators.isValidEventType('HEALTH_GOAL_ACHIEVED', 'health')).toBe(true);
      
      // Care journey event types
      expect(validators.isValidEventType('APPOINTMENT_BOOKED', 'care')).toBe(true);
      expect(validators.isValidEventType('MEDICATION_ADHERENCE', 'care')).toBe(true);
      
      // Plan journey event types
      expect(validators.isValidEventType('CLAIM_SUBMITTED', 'plan')).toBe(true);
      expect(validators.isValidEventType('BENEFIT_UTILIZED', 'plan')).toBe(true);
    });

    it('should return false for invalid event types', () => {
      expect(validators.isValidEventType('INVALID_EVENT', 'health')).toBe(false);
      expect(validators.isValidEventType('UNKNOWN_EVENT', 'care')).toBe(false);
      expect(validators.isValidEventType('NOT_A_REAL_EVENT', 'plan')).toBe(false);
    });

    it('should return false for event types from the wrong journey', () => {
      // Health event in care journey
      expect(validators.isValidEventType('HEALTH_METRIC_RECORDED', 'care')).toBe(false);
      
      // Care event in plan journey
      expect(validators.isValidEventType('APPOINTMENT_BOOKED', 'plan')).toBe(false);
      
      // Plan event in health journey
      expect(validators.isValidEventType('CLAIM_SUBMITTED', 'health')).toBe(false);
    });

    it('should return false for invalid input types', () => {
      // Invalid event type
      expect(validators.isValidEventType(null, 'health')).toBe(false);
      expect(validators.isValidEventType(undefined, 'health')).toBe(false);
      expect(validators.isValidEventType(123 as any, 'health')).toBe(false);
      
      // Invalid journey
      expect(validators.isValidEventType('HEALTH_METRIC_RECORDED', null)).toBe(false);
      expect(validators.isValidEventType('HEALTH_METRIC_RECORDED', undefined)).toBe(false);
      expect(validators.isValidEventType('HEALTH_METRIC_RECORDED', 123 as any)).toBe(false);
      
      // Both invalid
      expect(validators.isValidEventType(null, null)).toBe(false);
    });

    it('should be case sensitive for event types', () => {
      // Event types should be case sensitive (all caps)
      expect(validators.isValidEventType('health_metric_recorded', 'health')).toBe(false);
      expect(validators.isValidEventType('Health_Metric_Recorded', 'health')).toBe(false);
    });

    it('should be case insensitive for journey names', () => {
      // Journey names should be case insensitive
      expect(validators.isValidEventType('HEALTH_METRIC_RECORDED', 'HEALTH')).toBe(true);
      expect(validators.isValidEventType('APPOINTMENT_BOOKED', 'CARE')).toBe(true);
    });
  });
});

describe('Integration with class-validator', () => {
  it('should work with class-validator validate function', async () => {
    const validObject = new JourneyTest('health');
    const errors = await validate(validObject);
    expect(errors.length).toBe(0);

    const invalidObject = new JourneyTest('invalid');
    const invalidErrors = await validate(invalidObject);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });

  it('should work with class-validator validateSync function', () => {
    const validObject = new JourneyTest('health');
    const errors = validateSync(validObject);
    expect(errors.length).toBe(0);

    const invalidObject = new JourneyTest('invalid');
    const invalidErrors = validateSync(invalidObject);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });

  it('should work with plainToInstance transformation', async () => {
    const plainObject = { journey: 'health' };
    const instance = plainToInstance(JourneyTest, plainObject);
    const errors = await validate(instance);
    expect(errors.length).toBe(0);

    const invalidPlainObject = { journey: 'invalid' };
    const invalidInstance = plainToInstance(JourneyTest, invalidPlainObject);
    const invalidErrors = await validate(invalidInstance);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });

  it('should handle complex validation scenarios with multiple decorators', async () => {
    // Create a class with multiple validation decorators
    class ComplexValidationTest {
      @validators.IsValidJourney()
      journey: string;

      @validators.IsValidEventType('@journey')
      eventType: string;

      @validators.IsValidUUID()
      id: string;

      @validators.IsValidISODate()
      timestamp: string;

      @validators.IsRequiredWhen('journey', ['health'])
      healthSpecificField?: string;

      constructor(data: Partial<ComplexValidationTest>) {
        Object.assign(this, data);
      }
    }

    // Valid object with all required fields
    const validObject = new ComplexValidationTest({
      journey: 'health',
      eventType: 'HEALTH_METRIC_RECORDED',
      id: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: new Date().toISOString(),
      healthSpecificField: 'value'
    });

    const errors = await validate(validObject);
    expect(errors.length).toBe(0);

    // Invalid object with multiple validation errors
    const invalidObject = new ComplexValidationTest({
      journey: 'health',
      eventType: 'APPOINTMENT_BOOKED', // Wrong event type for journey
      id: 'not-a-uuid', // Invalid UUID
      timestamp: '2023-01-01', // Invalid ISO date
      // Missing healthSpecificField which is required for health journey
    });

    const invalidErrors = await validate(invalidObject);
    expect(invalidErrors.length).toBeGreaterThan(0);
    // Should have at least 4 validation errors
    expect(invalidErrors.length).toBeGreaterThanOrEqual(4);
  });
});