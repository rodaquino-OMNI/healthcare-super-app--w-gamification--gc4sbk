/**
 * @file event-validation.spec.ts
 * @description Unit tests for event validation utilities
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  IsValidJourney,
  IsValidEventType,
  IsValidUUID,
  IsValidISODate,
  IsRequiredWhen,
  IsProhibitedWhen,
  IsValidHealthMetricValue,
  IsValidHealthMetricUnit,
  IsValidDeviceType,
  IsValidAppointmentStatus,
  IsValidClaimStatus,
  HasValidEventMetadata,
  formatValidationErrors,
  validateObject,
  isUUID,
  isISODate,
  isValidJourney,
  isValidEventType,
  ValidationError
} from '../../../src/dto/validation';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../../src/dto/event-metadata.dto';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { ERROR_CODES } from '../../../src/constants/errors.constants';
import { HealthMetricRecordedEventDto, HealthMetricType } from '../../../src/dto/health-event.dto';

// Test class for decorator validation
class TestEventDto {
  @IsValidUUID()
  id: string;

  @IsValidJourney()
  journey: string;

  @IsValidEventType('@journey')
  type: string;

  @IsValidISODate()
  timestamp: string;

  @IsRequiredWhen('type', [EventType.HEALTH_METRIC_RECORDED])
  metricValue: number;

  @IsProhibitedWhen('type', [EventType.USER_LOGIN])
  appointmentId: string;

  constructor(data: Partial<TestEventDto>) {
    Object.assign(this, data);
  }
}

// Test class for health metric validation
class TestHealthMetricDto {
  @IsValidHealthMetricValue()
  value: number;

  @IsValidHealthMetricUnit()
  unit: string;

  metricType: string;

  constructor(data: Partial<TestHealthMetricDto>) {
    Object.assign(this, data);
  }
}

// Test class for device type validation
class TestDeviceDto {
  @IsValidDeviceType()
  deviceType: string;

  constructor(data: Partial<TestDeviceDto>) {
    Object.assign(this, data);
  }
}

// Test class for appointment status validation
class TestAppointmentDto {
  @IsValidAppointmentStatus()
  status: string;

  constructor(data: Partial<TestAppointmentDto>) {
    Object.assign(this, data);
  }
}

// Test class for claim status validation
class TestClaimDto {
  @IsValidClaimStatus()
  status: string;

  constructor(data: Partial<TestClaimDto>) {
    Object.assign(this, data);
  }
}

// Test class for event metadata validation
class TestEventWithMetadataDto {
  @HasValidEventMetadata()
  metadata: EventMetadataDto;

  constructor(data: Partial<TestEventWithMetadataDto>) {
    Object.assign(this, data);
  }
}

describe('Event Validation Utilities', () => {
  describe('Basic Validation Functions', () => {
    describe('isUUID', () => {
      it('should return true for valid UUIDs', () => {
        expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      });

      it('should return false for invalid UUIDs', () => {
        expect(isUUID('not-a-uuid')).toBe(false);
        expect(isUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // Too short
        expect(isUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false); // Too long
        expect(isUUID(null)).toBe(false);
        expect(isUUID(undefined)).toBe(false);
        expect(isUUID(123)).toBe(false);
      });
    });

    describe('isISODate', () => {
      it('should return true for valid ISO date strings', () => {
        expect(isISODate('2023-01-01T00:00:00.000Z')).toBe(true);
        expect(isISODate(new Date().toISOString())).toBe(true);
      });

      it('should return false for invalid ISO date strings', () => {
        expect(isISODate('2023-01-01')).toBe(false); // Not a full ISO string
        expect(isISODate('not-a-date')).toBe(false);
        expect(isISODate(null)).toBe(false);
        expect(isISODate(undefined)).toBe(false);
        expect(isISODate(new Date())).toBe(false); // Date object, not string
      });
    });

    describe('isValidJourney', () => {
      it('should return true for valid journey names', () => {
        expect(isValidJourney('health')).toBe(true);
        expect(isValidJourney('care')).toBe(true);
        expect(isValidJourney('plan')).toBe(true);
        expect(isValidJourney('user')).toBe(true);
        expect(isValidJourney('gamification')).toBe(true);
        // Case insensitive
        expect(isValidJourney('HEALTH')).toBe(true);
      });

      it('should return false for invalid journey names', () => {
        expect(isValidJourney('invalid')).toBe(false);
        expect(isValidJourney('')).toBe(false);
        expect(isValidJourney(null)).toBe(false);
        expect(isValidJourney(undefined)).toBe(false);
        expect(isValidJourney(123)).toBe(false);
      });
    });

    describe('isValidEventType', () => {
      it('should return true for valid health event types', () => {
        expect(isValidEventType('HEALTH_METRIC_RECORDED', 'health')).toBe(true);
        expect(isValidEventType('HEALTH_GOAL_ACHIEVED', 'health')).toBe(true);
        expect(isValidEventType('HEALTH_GOAL_CREATED', 'health')).toBe(true);
        expect(isValidEventType('HEALTH_GOAL_UPDATED', 'health')).toBe(true);
        expect(isValidEventType('DEVICE_SYNCHRONIZED', 'health')).toBe(true);
        expect(isValidEventType('HEALTH_INSIGHT_GENERATED', 'health')).toBe(true);
      });

      it('should return true for valid care event types', () => {
        expect(isValidEventType('APPOINTMENT_BOOKED', 'care')).toBe(true);
        expect(isValidEventType('APPOINTMENT_COMPLETED', 'care')).toBe(true);
        expect(isValidEventType('APPOINTMENT_CANCELLED', 'care')).toBe(true);
        expect(isValidEventType('MEDICATION_ADHERENCE', 'care')).toBe(true);
        expect(isValidEventType('TELEMEDICINE_SESSION_STARTED', 'care')).toBe(true);
        expect(isValidEventType('TELEMEDICINE_SESSION_ENDED', 'care')).toBe(true);
        expect(isValidEventType('CARE_PLAN_UPDATED', 'care')).toBe(true);
      });

      it('should return true for valid plan event types', () => {
        expect(isValidEventType('CLAIM_SUBMITTED', 'plan')).toBe(true);
        expect(isValidEventType('CLAIM_UPDATED', 'plan')).toBe(true);
        expect(isValidEventType('CLAIM_APPROVED', 'plan')).toBe(true);
        expect(isValidEventType('CLAIM_REJECTED', 'plan')).toBe(true);
        expect(isValidEventType('BENEFIT_UTILIZED', 'plan')).toBe(true);
        expect(isValidEventType('PLAN_SELECTED', 'plan')).toBe(true);
        expect(isValidEventType('PLAN_COMPARED', 'plan')).toBe(true);
      });

      it('should return true for valid user event types', () => {
        expect(isValidEventType('USER_REGISTERED', 'user')).toBe(true);
        expect(isValidEventType('USER_LOGGED_IN', 'user')).toBe(true);
        expect(isValidEventType('USER_PROFILE_UPDATED', 'user')).toBe(true);
        expect(isValidEventType('USER_PREFERENCES_UPDATED', 'user')).toBe(true);
      });

      it('should return true for valid gamification event types', () => {
        expect(isValidEventType('ACHIEVEMENT_UNLOCKED', 'gamification')).toBe(true);
        expect(isValidEventType('REWARD_EARNED', 'gamification')).toBe(true);
        expect(isValidEventType('REWARD_REDEEMED', 'gamification')).toBe(true);
        expect(isValidEventType('LEADERBOARD_UPDATED', 'gamification')).toBe(true);
        expect(isValidEventType('LEVEL_UP', 'gamification')).toBe(true);
      });

      it('should return false for invalid event types', () => {
        expect(isValidEventType('INVALID_EVENT', 'health')).toBe(false);
        expect(isValidEventType('HEALTH_METRIC_RECORDED', 'care')).toBe(false); // Valid type but wrong journey
        expect(isValidEventType('', 'health')).toBe(false);
        expect(isValidEventType(null, 'health')).toBe(false);
        expect(isValidEventType(undefined, 'health')).toBe(false);
        expect(isValidEventType('HEALTH_METRIC_RECORDED', null)).toBe(false);
        expect(isValidEventType('HEALTH_METRIC_RECORDED', undefined)).toBe(false);
        expect(isValidEventType('HEALTH_METRIC_RECORDED', 'invalid')).toBe(false);
      });
    });
  });

  describe('Decorator-based Validation', () => {
    describe('IsValidUUID', () => {
      it('should validate valid UUIDs', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent, { property: 'id' });
        expect(errors.length).toBe(0);
      });

      it('should reject invalid UUIDs', async () => {
        const testEvent = new TestEventDto({
          id: 'not-a-uuid',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent, { property: 'id' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidUUID');
      });
    });

    describe('IsValidJourney', () => {
      it('should validate valid journey names', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent, { property: 'journey' });
        expect(errors.length).toBe(0);
      });

      it('should reject invalid journey names', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'invalid',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent, { property: 'journey' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidJourney');
      });
    });

    describe('IsValidEventType', () => {
      it('should validate valid event types for the specified journey', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent);
        expect(errors.length).toBe(0);
      });

      it('should reject invalid event types for the specified journey', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'APPOINTMENT_BOOKED', // Care journey event type
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidEventType');
      });
    });

    describe('IsValidISODate', () => {
      it('should validate valid ISO date strings', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validate(testEvent, { property: 'timestamp' });
        expect(errors.length).toBe(0);
      });

      it('should reject invalid ISO date strings', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: '2023-01-01', // Not a full ISO string
          metricValue: 75
        });

        const errors = await validate(testEvent, { property: 'timestamp' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isValidISODate');
      });
    });

    describe('IsRequiredWhen', () => {
      it('should require a field when the condition is met', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          // metricValue is missing but required for HEALTH_METRIC_RECORDED
        });

        const errors = await validate(testEvent);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isRequiredWhen');
      });

      it('should not require a field when the condition is not met', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'user',
          type: 'USER_LOGGED_IN',
          timestamp: new Date().toISOString(),
          // metricValue is missing but not required for USER_LOGGED_IN
        });

        const errors = await validate(testEvent);
        expect(errors.length).toBe(0);
      });
    });

    describe('IsProhibitedWhen', () => {
      it('should prohibit a field when the condition is met', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'user',
          type: 'USER_LOGIN',
          timestamp: new Date().toISOString(),
          appointmentId: '123e4567-e89b-12d3-a456-426614174000' // Prohibited for USER_LOGIN
        });

        const errors = await validate(testEvent);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isProhibitedWhen');
      });

      it('should allow a field when the condition is not met', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'care',
          type: 'APPOINTMENT_BOOKED',
          timestamp: new Date().toISOString(),
          appointmentId: '123e4567-e89b-12d3-a456-426614174000' // Allowed for APPOINTMENT_BOOKED
        });

        const errors = await validate(testEvent);
        expect(errors.length).toBe(0);
      });
    });

    describe('IsValidHealthMetricValue', () => {
      it('should validate valid health metric values', async () => {
        const testCases = [
          { metricType: 'HEART_RATE', value: 75, unit: 'bpm' },
          { metricType: 'BLOOD_GLUCOSE', value: 100, unit: 'mg/dL' },
          { metricType: 'STEPS', value: 10000, unit: 'steps' },
          { metricType: 'SLEEP', value: 8, unit: 'hours' },
          { metricType: 'WEIGHT', value: 70, unit: 'kg' },
          { metricType: 'TEMPERATURE', value: 37, unit: '°C' },
          { metricType: 'OXYGEN_SATURATION', value: 98, unit: '%' },
          { metricType: 'RESPIRATORY_RATE', value: 16, unit: 'breaths/min' },
          { metricType: 'WATER_INTAKE', value: 2000, unit: 'ml' },
          { metricType: 'CALORIES', value: 2000, unit: 'kcal' }
        ];

        for (const testCase of testCases) {
          const testMetric = new TestHealthMetricDto(testCase);
          const errors = await validate(testMetric);
          expect(errors.length).toBe(0);
        }
      });

      it('should reject invalid health metric values', async () => {
        const testCases = [
          { metricType: 'HEART_RATE', value: 300, unit: 'bpm' }, // Too high
          { metricType: 'BLOOD_GLUCOSE', value: 1000, unit: 'mg/dL' }, // Too high
          { metricType: 'STEPS', value: -100, unit: 'steps' }, // Negative
          { metricType: 'SLEEP', value: 30, unit: 'hours' }, // Too high
          { metricType: 'WEIGHT', value: 1000, unit: 'kg' }, // Too high
          { metricType: 'TEMPERATURE', value: 50, unit: '°C' }, // Too high
          { metricType: 'OXYGEN_SATURATION', value: 120, unit: '%' }, // Over 100%
          { metricType: 'RESPIRATORY_RATE', value: 200, unit: 'breaths/min' }, // Too high
          { metricType: 'WATER_INTAKE', value: 20000, unit: 'ml' }, // Too high
          { metricType: 'CALORIES', value: 50000, unit: 'kcal' } // Too high
        ];

        for (const testCase of testCases) {
          const testMetric = new TestHealthMetricDto(testCase);
          const errors = await validate(testMetric);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].constraints).toHaveProperty('isValidHealthMetricValue');
        }
      });
    });

    describe('IsValidHealthMetricUnit', () => {
      it('should validate valid health metric units', async () => {
        const testCases = [
          { metricType: 'HEART_RATE', value: 75, unit: 'bpm' },
          { metricType: 'BLOOD_GLUCOSE', value: 100, unit: 'mg/dL' },
          { metricType: 'BLOOD_GLUCOSE', value: 5.5, unit: 'mmol/L' },
          { metricType: 'STEPS', value: 10000, unit: 'steps' },
          { metricType: 'SLEEP', value: 8, unit: 'hours' },
          { metricType: 'SLEEP', value: 480, unit: 'minutes' },
          { metricType: 'WEIGHT', value: 70, unit: 'kg' },
          { metricType: 'WEIGHT', value: 154, unit: 'lb' },
          { metricType: 'TEMPERATURE', value: 37, unit: '°C' },
          { metricType: 'TEMPERATURE', value: 98.6, unit: '°F' },
          { metricType: 'OXYGEN_SATURATION', value: 98, unit: '%' },
          { metricType: 'RESPIRATORY_RATE', value: 16, unit: 'breaths/min' },
          { metricType: 'WATER_INTAKE', value: 2000, unit: 'ml' },
          { metricType: 'WATER_INTAKE', value: 68, unit: 'oz' },
          { metricType: 'CALORIES', value: 2000, unit: 'kcal' }
        ];

        for (const testCase of testCases) {
          const testMetric = new TestHealthMetricDto(testCase);
          const errors = await validate(testMetric);
          expect(errors.length).toBe(0);
        }
      });

      it('should reject invalid health metric units', async () => {
        const testCases = [
          { metricType: 'HEART_RATE', value: 75, unit: 'beats' }, // Invalid unit
          { metricType: 'BLOOD_GLUCOSE', value: 100, unit: 'units' }, // Invalid unit
          { metricType: 'STEPS', value: 10000, unit: 'count' }, // Invalid unit
          { metricType: 'SLEEP', value: 8, unit: 'hrs' }, // Invalid unit
          { metricType: 'WEIGHT', value: 70, unit: 'kilos' }, // Invalid unit
          { metricType: 'TEMPERATURE', value: 37, unit: 'celsius' }, // Invalid unit
          { metricType: 'OXYGEN_SATURATION', value: 98, unit: 'percent' }, // Invalid unit
          { metricType: 'RESPIRATORY_RATE', value: 16, unit: 'bpm' }, // Invalid unit
          { metricType: 'WATER_INTAKE', value: 2000, unit: 'liters' }, // Invalid unit
          { metricType: 'CALORIES', value: 2000, unit: 'calories' } // Invalid unit
        ];

        for (const testCase of testCases) {
          const testMetric = new TestHealthMetricDto(testCase);
          const errors = await validate(testMetric);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].constraints).toHaveProperty('isValidHealthMetricUnit');
        }
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
          const testDevice = new TestDeviceDto({ deviceType });
          const errors = await validate(testDevice);
          expect(errors.length).toBe(0);
        }
      });

      it('should reject invalid device types', async () => {
        const invalidDeviceTypes = [
          'INVALID_DEVICE',
          '',
          null,
          undefined
        ];

        for (const deviceType of invalidDeviceTypes) {
          const testDevice = new TestDeviceDto({ deviceType });
          const errors = await validate(testDevice);
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
          const testAppointment = new TestAppointmentDto({ status });
          const errors = await validate(testAppointment);
          expect(errors.length).toBe(0);
        }
      });

      it('should reject invalid appointment statuses', async () => {
        const invalidStatuses = [
          'INVALID_STATUS',
          '',
          null,
          undefined
        ];

        for (const status of invalidStatuses) {
          const testAppointment = new TestAppointmentDto({ status });
          const errors = await validate(testAppointment);
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
          const testClaim = new TestClaimDto({ status });
          const errors = await validate(testClaim);
          expect(errors.length).toBe(0);
        }
      });

      it('should reject invalid claim statuses', async () => {
        const invalidStatuses = [
          'INVALID_STATUS',
          '',
          null,
          undefined
        ];

        for (const status of invalidStatuses) {
          const testClaim = new TestClaimDto({ status });
          const errors = await validate(testClaim);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].constraints).toHaveProperty('isValidClaimStatus');
        }
      });
    });

    describe('HasValidEventMetadata', () => {
      it('should validate valid event metadata', async () => {
        const origin = new EventOriginDto();
        origin.service = 'test-service';
        origin.instance = 'test-instance';
        origin.component = 'test-component';

        const metadata = new EventMetadataDto();
        metadata.eventId = '123e4567-e89b-12d3-a456-426614174000';
        metadata.correlationId = '550e8400-e29b-41d4-a716-446655440000';
        metadata.timestamp = new Date();
        metadata.origin = origin;

        const testEvent = new TestEventWithMetadataDto({ metadata });
        const errors = await validate(testEvent);
        expect(errors.length).toBe(0);
      });

      it('should reject invalid event metadata', async () => {
        // Missing required service in origin
        const origin = new EventOriginDto();
        origin.instance = 'test-instance';

        const metadata = new EventMetadataDto();
        metadata.eventId = '123e4567-e89b-12d3-a456-426614174000';
        metadata.correlationId = '550e8400-e29b-41d4-a716-446655440000';
        metadata.timestamp = new Date();
        metadata.origin = origin;

        const testEvent = new TestEventWithMetadataDto({ metadata });
        const errors = await validate(testEvent);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject non-object metadata', async () => {
        const testEvent = new TestEventWithMetadataDto({ metadata: 'not-an-object' as any });
        const errors = await validate(testEvent);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('hasValidEventMetadata');
      });
    });
  });

  describe('Utility Functions', () => {
    describe('formatValidationErrors', () => {
      it('should format validation errors correctly', async () => {
        const testEvent = new TestEventDto({
          id: 'not-a-uuid',
          journey: 'invalid',
          type: 'INVALID_TYPE',
          timestamp: '2023-01-01', // Not a full ISO string
          metricValue: null
        });

        const errors = await validate(testEvent);
        const formattedErrors = formatValidationErrors(errors);

        expect(formattedErrors.length).toBeGreaterThan(0);
        expect(formattedErrors[0]).toHaveProperty('property');
        expect(formattedErrors[0]).toHaveProperty('errorCode');
        expect(formattedErrors[0]).toHaveProperty('message');
        expect(formattedErrors[0]).toHaveProperty('constraints');
        expect(formattedErrors[0].errorCode).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      });

      it('should handle nested validation errors', async () => {
        // Create a complex object with nested validation errors
        // This would typically come from validating a complex DTO with nested objects
        const mockErrors = [
          {
            property: 'data',
            children: [
              {
                property: 'metricType',
                constraints: {
                  isEnum: 'metricType must be a valid enum value'
                }
              }
            ]
          }
        ];

        const formattedErrors = formatValidationErrors(mockErrors);

        expect(formattedErrors.length).toBe(1);
        expect(formattedErrors[0]).toHaveProperty('property', 'data');
        expect(formattedErrors[0]).toHaveProperty('children');
        expect(formattedErrors[0].children.length).toBe(1);
        expect(formattedErrors[0].children[0]).toHaveProperty('property', 'metricType');
        expect(formattedErrors[0].children[0]).toHaveProperty('constraints');
      });
    });

    describe('validateObject', () => {
      it('should return null for valid objects', async () => {
        const testEvent = new TestEventDto({
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          type: 'HEALTH_METRIC_RECORDED',
          timestamp: new Date().toISOString(),
          metricValue: 75
        });

        const errors = await validateObject(testEvent);
        expect(errors).toBeNull();
      });

      it('should return formatted validation errors for invalid objects', async () => {
        const testEvent = new TestEventDto({
          id: 'not-a-uuid',
          journey: 'invalid',
          type: 'INVALID_TYPE',
          timestamp: '2023-01-01', // Not a full ISO string
          metricValue: null
        });

        const errors = await validateObject(testEvent);
        expect(errors).not.toBeNull();
        expect(Array.isArray(errors)).toBe(true);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toHaveProperty('property');
        expect(errors[0]).toHaveProperty('errorCode');
        expect(errors[0]).toHaveProperty('message');
        expect(errors[0]).toHaveProperty('constraints');
      });
    });
  });

  describe('Complex Validation Scenarios', () => {
    describe('Health Metric Recorded Event Validation', () => {
      it('should validate a valid health metric recorded event', async () => {
        const origin = new EventOriginDto();
        origin.service = 'health-service';
        origin.instance = 'health-service-1';

        const metadata = new EventMetadataDto();
        metadata.eventId = '123e4567-e89b-12d3-a456-426614174000';
        metadata.timestamp = new Date();
        metadata.origin = origin;

        const event = {
          type: 'HEALTH_METRIC_RECORDED',
          journey: 'health',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: new Date().toISOString(),
          metadata,
          data: {
            metricType: HealthMetricType.HEART_RATE,
            value: 75,
            unit: 'bpm',
            recordedAt: new Date().toISOString(),
            deviceId: '123e4567-e89b-12d3-a456-426614174000'
          }
        };

        const healthEvent = plainToInstance(HealthMetricRecordedEventDto, event);
        const errors = await validate(healthEvent);
        expect(errors.length).toBe(0);
      });

      it('should reject an invalid health metric recorded event', async () => {
        const event = {
          type: 'HEALTH_METRIC_RECORDED',
          journey: 'health',
          userId: 'not-a-uuid', // Invalid UUID
          timestamp: '2023-01-01', // Not a full ISO string
          // Missing metadata
          data: {
            metricType: 'INVALID_TYPE', // Invalid metric type
            value: 1000, // Invalid value for heart rate
            unit: 'invalid', // Invalid unit
            recordedAt: '2023-01-01' // Not a full ISO string
          }
        };

        const healthEvent = plainToInstance(HealthMetricRecordedEventDto, event);
        const errors = await validate(healthEvent);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('Cross-Journey Event Validation', () => {
      it('should validate events from different journeys', async () => {
        // Define test events for each journey
        const journeyEvents = [
          {
            type: 'HEALTH_METRIC_RECORDED',
            journey: 'health',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            timestamp: new Date().toISOString(),
            data: {
              metricType: HealthMetricType.HEART_RATE,
              value: 75,
              unit: 'bpm'
            }
          },
          {
            type: 'APPOINTMENT_BOOKED',
            journey: 'care',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            timestamp: new Date().toISOString(),
            data: {
              appointmentId: '123e4567-e89b-12d3-a456-426614174000',
              providerId: '550e8400-e29b-41d4-a716-446655440000',
              appointmentType: 'in_person',
              scheduledAt: new Date().toISOString()
            }
          },
          {
            type: 'CLAIM_SUBMITTED',
            journey: 'plan',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            timestamp: new Date().toISOString(),
            data: {
              claimId: '123e4567-e89b-12d3-a456-426614174000',
              providerId: '550e8400-e29b-41d4-a716-446655440000',
              amount: 100.50,
              serviceDate: new Date().toISOString()
            }
          }
        ];

        // Validate each event type
        for (const event of journeyEvents) {
          const testEvent = new TestEventDto({
            id: '123e4567-e89b-12d3-a456-426614174000',
            journey: event.journey,
            type: event.type,
            timestamp: event.timestamp,
            metricValue: event.journey === 'health' ? 75 : undefined,
            appointmentId: event.journey === 'care' ? '123e4567-e89b-12d3-a456-426614174000' : undefined
          });

          const errors = await validate(testEvent);
          expect(errors.length).toBe(0);
        }
      });
    });

    describe('Validation Error Classification', () => {
      it('should classify validation errors by type', async () => {
        const testEvent = new TestEventDto({
          id: 'not-a-uuid', // Format error
          journey: 'invalid', // Value error
          type: 'INVALID_TYPE', // Value error
          timestamp: '2023-01-01', // Format error
          metricValue: null // Required field error
        });

        const errors = await validate(testEvent);
        const formattedErrors = formatValidationErrors(errors);

        // Group errors by property
        const errorsByProperty = formattedErrors.reduce((acc, error) => {
          acc[error.property] = error;
          return acc;
        }, {});

        // Check for different error types
        expect(errorsByProperty).toHaveProperty('id'); // Format error
        expect(errorsByProperty).toHaveProperty('journey'); // Value error
        expect(errorsByProperty).toHaveProperty('type'); // Value error
        expect(errorsByProperty).toHaveProperty('timestamp'); // Format error

        // All errors should have the same error code
        formattedErrors.forEach(error => {
          expect(error.errorCode).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
        });
      });
    });
  });
});