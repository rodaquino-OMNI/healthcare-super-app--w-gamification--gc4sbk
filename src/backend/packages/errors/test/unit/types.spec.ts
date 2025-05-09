/**
 * @file types.spec.ts
 * @description Tests for error type definitions, interfaces, and type guards
 * in the error handling framework. Ensures type safety across the error system.
 */

import { describe, it, expect } from 'jest';
import { ErrorType, JourneyContext, BaseError, SerializedError } from '../../src/base';
import { BusinessError, ResourceNotFoundError } from '../../src/categories/business.errors';
import { Health } from '../../src/journey';
import { Care } from '../../src/journey';
import { Plan } from '../../src/journey';
import { HealthErrorType, HealthMetricType } from '../../src/journey/health/types';
import { ERROR_CODE_PREFIXES, HEALTH_ERROR_PREFIXES, CARE_ERROR_PREFIXES, PLAN_ERROR_PREFIXES } from '../../src/constants';

describe('Error Type Definitions', () => {
  describe('ErrorType Enum', () => {
    it('should define all required error types', () => {
      // Verify all expected error types are defined
      expect(ErrorType.VALIDATION).toBe('validation');
      expect(ErrorType.BUSINESS).toBe('business');
      expect(ErrorType.TECHNICAL).toBe('technical');
      expect(ErrorType.EXTERNAL).toBe('external');
      expect(ErrorType.AUTHENTICATION).toBe('authentication');
      expect(ErrorType.AUTHORIZATION).toBe('authorization');
      expect(ErrorType.NOT_FOUND).toBe('not_found');
      expect(ErrorType.CONFLICT).toBe('conflict');
      expect(ErrorType.RATE_LIMIT).toBe('rate_limit');
      expect(ErrorType.UNAVAILABLE).toBe('unavailable');
      expect(ErrorType.TIMEOUT).toBe('timeout');
    });

    it('should have string values that match the enum keys in lowercase', () => {
      // Verify the string values match the enum keys (in lowercase)
      Object.keys(ErrorType).forEach(key => {
        const enumKey = key as keyof typeof ErrorType;
        const enumValue = ErrorType[enumKey];
        expect(enumValue).toBe(enumKey.toLowerCase());
      });
    });
  });

  describe('JourneyContext Enum', () => {
    it('should define all journey contexts', () => {
      // Verify all expected journey contexts are defined
      expect(JourneyContext.HEALTH).toBe('health');
      expect(JourneyContext.CARE).toBe('care');
      expect(JourneyContext.PLAN).toBe('plan');
      expect(JourneyContext.GAMIFICATION).toBe('gamification');
      expect(JourneyContext.AUTH).toBe('auth');
      expect(JourneyContext.NOTIFICATION).toBe('notification');
      expect(JourneyContext.SYSTEM).toBe('system');
    });

    it('should have string values that match the enum keys in lowercase', () => {
      // Verify the string values match the enum keys (in lowercase)
      Object.keys(JourneyContext).forEach(key => {
        const enumKey = key as keyof typeof JourneyContext;
        const enumValue = JourneyContext[enumKey];
        expect(enumValue).toBe(enumKey.toLowerCase());
      });
    });
  });

  describe('Journey-specific Error Types', () => {
    it('should define all health error types', () => {
      // Verify all expected health error types are defined
      expect(HealthErrorType.METRIC).toBe('METRIC');
      expect(HealthErrorType.GOAL).toBe('GOAL');
      expect(HealthErrorType.DEVICE).toBe('DEVICE');
      expect(HealthErrorType.SYNC).toBe('SYNC');
      expect(HealthErrorType.INSIGHT).toBe('INSIGHT');
    });

    it('should define all health metric types', () => {
      // Verify all expected health metric types are defined
      expect(HealthMetricType.BLOOD_PRESSURE).toBe('blood_pressure');
      expect(HealthMetricType.HEART_RATE).toBe('heart_rate');
      expect(HealthMetricType.BLOOD_GLUCOSE).toBe('blood_glucose');
      expect(HealthMetricType.WEIGHT).toBe('weight');
      expect(HealthMetricType.STEPS).toBe('steps');
      expect(HealthMetricType.SLEEP).toBe('sleep');
      expect(HealthMetricType.OXYGEN_SATURATION).toBe('oxygen_saturation');
      expect(HealthMetricType.TEMPERATURE).toBe('temperature');
    });
  });

  describe('Error Code Prefixes', () => {
    it('should define all journey-specific error code prefixes', () => {
      // Verify all expected error code prefixes are defined
      expect(ERROR_CODE_PREFIXES.GENERAL).toBe('GEN');
      expect(ERROR_CODE_PREFIXES.HEALTH).toBe('HEALTH');
      expect(ERROR_CODE_PREFIXES.CARE).toBe('CARE');
      expect(ERROR_CODE_PREFIXES.PLAN).toBe('PLAN');
      expect(ERROR_CODE_PREFIXES.AUTH).toBe('AUTH');
      expect(ERROR_CODE_PREFIXES.GAMIFICATION).toBe('GAME');
      expect(ERROR_CODE_PREFIXES.NOTIFICATION).toBe('NOTIF');
    });

    it('should define all health-specific error code prefixes', () => {
      // Verify all expected health error code prefixes are defined
      expect(HEALTH_ERROR_PREFIXES.METRICS).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_METRICS`);
      expect(HEALTH_ERROR_PREFIXES.GOALS).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_GOALS`);
      expect(HEALTH_ERROR_PREFIXES.INSIGHTS).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_INSIGHTS`);
      expect(HEALTH_ERROR_PREFIXES.DEVICES).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_DEVICES`);
      expect(HEALTH_ERROR_PREFIXES.FHIR).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_FHIR`);
    });

    it('should define all care-specific error code prefixes', () => {
      // Verify all expected care error code prefixes are defined
      expect(CARE_ERROR_PREFIXES.APPOINTMENTS).toBe(`${ERROR_CODE_PREFIXES.CARE}_APPT`);
      expect(CARE_ERROR_PREFIXES.MEDICATIONS).toBe(`${ERROR_CODE_PREFIXES.CARE}_MED`);
      expect(CARE_ERROR_PREFIXES.PROVIDERS).toBe(`${ERROR_CODE_PREFIXES.CARE}_PROV`);
      expect(CARE_ERROR_PREFIXES.TELEMEDICINE).toBe(`${ERROR_CODE_PREFIXES.CARE}_TELE`);
      expect(CARE_ERROR_PREFIXES.TREATMENTS).toBe(`${ERROR_CODE_PREFIXES.CARE}_TREAT`);
      expect(CARE_ERROR_PREFIXES.SYMPTOM_CHECKER).toBe(`${ERROR_CODE_PREFIXES.CARE}_SYMPT`);
    });

    it('should define all plan-specific error code prefixes', () => {
      // Verify all expected plan error code prefixes are defined
      expect(PLAN_ERROR_PREFIXES.BENEFITS).toBe(`${ERROR_CODE_PREFIXES.PLAN}_BENEF`);
      expect(PLAN_ERROR_PREFIXES.CLAIMS).toBe(`${ERROR_CODE_PREFIXES.PLAN}_CLAIM`);
      expect(PLAN_ERROR_PREFIXES.COVERAGE).toBe(`${ERROR_CODE_PREFIXES.PLAN}_COVER`);
      expect(PLAN_ERROR_PREFIXES.DOCUMENTS).toBe(`${ERROR_CODE_PREFIXES.PLAN}_DOC`);
      expect(PLAN_ERROR_PREFIXES.PLANS).toBe(`${ERROR_CODE_PREFIXES.PLAN}_PLAN`);
    });
  });
});

describe('Error Interface Completeness', () => {
  describe('SerializedError Interface', () => {
    it('should define all required fields for serialized errors', () => {
      // Create a mock serialized error that conforms to the interface
      const serializedError: SerializedError = {
        error: {
          type: ErrorType.BUSINESS,
          code: 'TEST_ERROR',
          message: 'Test error message',
          journey: JourneyContext.HEALTH,
          requestId: '123456',
          timestamp: new Date().toISOString(),
          details: { test: 'value' },
          path: '/api/test',
          suggestion: 'Try again later'
        }
      };

      // Verify all expected fields are present
      expect(serializedError.error).toBeDefined();
      expect(serializedError.error.type).toBeDefined();
      expect(serializedError.error.code).toBeDefined();
      expect(serializedError.error.message).toBeDefined();
      
      // Optional fields should be allowed
      expect(serializedError.error.journey).toBeDefined();
      expect(serializedError.error.requestId).toBeDefined();
      expect(serializedError.error.timestamp).toBeDefined();
      expect(serializedError.error.details).toBeDefined();
      expect(serializedError.error.path).toBeDefined();
      expect(serializedError.error.suggestion).toBeDefined();
    });
  });

  describe('ErrorContext Interface', () => {
    it('should allow all required context fields', () => {
      // Create a BaseError with context that should conform to ErrorContext interface
      const error = new BaseError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        {
          journey: JourneyContext.HEALTH,
          userId: 'user123',
          requestId: 'req456',
          traceId: 'trace789',
          spanId: 'span012',
          timestamp: new Date(),
          // Custom field
          customField: 'custom value'
        }
      );

      // Verify all expected context fields are present
      expect(error.context.journey).toBe(JourneyContext.HEALTH);
      expect(error.context.userId).toBe('user123');
      expect(error.context.requestId).toBe('req456');
      expect(error.context.traceId).toBe('trace789');
      expect(error.context.spanId).toBe('span012');
      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.context.customField).toBe('custom value');
    });
  });
});

describe('Error Type Guards', () => {
  describe('isClientError and isServerError', () => {
    it('should correctly identify client errors', () => {
      // Create errors of different types that should be classified as client errors
      const validationError = new BaseError('Validation error', ErrorType.VALIDATION, 'VALIDATION_ERROR');
      const authError = new BaseError('Auth error', ErrorType.AUTHENTICATION, 'AUTH_ERROR');
      const notFoundError = new BaseError('Not found', ErrorType.NOT_FOUND, 'NOT_FOUND_ERROR');
      const businessError = new BaseError('Business error', ErrorType.BUSINESS, 'BUSINESS_ERROR');

      // Verify they are correctly identified as client errors
      expect(validationError.isClientError()).toBe(true);
      expect(validationError.isServerError()).toBe(false);
      
      expect(authError.isClientError()).toBe(true);
      expect(authError.isServerError()).toBe(false);
      
      expect(notFoundError.isClientError()).toBe(true);
      expect(notFoundError.isServerError()).toBe(false);
      
      expect(businessError.isClientError()).toBe(true);
      expect(businessError.isServerError()).toBe(false);
    });

    it('should correctly identify server errors', () => {
      // Create errors of different types that should be classified as server errors
      const technicalError = new BaseError('Technical error', ErrorType.TECHNICAL, 'TECHNICAL_ERROR');
      const externalError = new BaseError('External error', ErrorType.EXTERNAL, 'EXTERNAL_ERROR');
      const unavailableError = new BaseError('Unavailable', ErrorType.UNAVAILABLE, 'UNAVAILABLE_ERROR');

      // Verify they are correctly identified as server errors
      expect(technicalError.isClientError()).toBe(false);
      expect(technicalError.isServerError()).toBe(true);
      
      expect(externalError.isClientError()).toBe(false);
      expect(externalError.isServerError()).toBe(true);
      
      expect(unavailableError.isClientError()).toBe(false);
      expect(unavailableError.isServerError()).toBe(true);
    });
  });

  describe('isRetryable', () => {
    it('should correctly identify retryable errors', () => {
      // Create errors that should be retryable
      const technicalError = new BaseError('Technical error', ErrorType.TECHNICAL, 'TECHNICAL_ERROR');
      const externalError = new BaseError('External error', ErrorType.EXTERNAL, 'EXTERNAL_ERROR');
      const timeoutError = new BaseError('Timeout', ErrorType.TIMEOUT, 'TIMEOUT_ERROR');
      const rateLimitError = new BaseError('Rate limit', ErrorType.RATE_LIMIT, 'RATE_LIMIT_ERROR');

      // Verify they are correctly identified as retryable
      expect(technicalError.isRetryable()).toBe(true);
      expect(externalError.isRetryable()).toBe(true);
      expect(timeoutError.isRetryable()).toBe(true);
      expect(rateLimitError.isRetryable()).toBe(true);
    });

    it('should correctly identify non-retryable errors', () => {
      // Create errors that should not be retryable
      const validationError = new BaseError('Validation error', ErrorType.VALIDATION, 'VALIDATION_ERROR');
      const businessError = new BaseError('Business error', ErrorType.BUSINESS, 'BUSINESS_ERROR');
      const authError = new BaseError('Auth error', ErrorType.AUTHENTICATION, 'AUTH_ERROR');

      // Verify they are correctly identified as non-retryable
      expect(validationError.isRetryable()).toBe(false);
      expect(businessError.isRetryable()).toBe(false);
      expect(authError.isRetryable()).toBe(false);
    });
  });
});

describe('Error Serialization Format', () => {
  describe('BaseError.toJSON', () => {
    it('should serialize errors with the correct format', () => {
      // Create a BaseError with various properties
      const error = new BaseError(
        'Test error message',
        ErrorType.BUSINESS,
        'TEST_ERROR_CODE',
        {
          journey: JourneyContext.HEALTH,
          requestId: 'req123',
          timestamp: new Date('2023-01-01T12:00:00Z')
        },
        { additionalInfo: 'test details' },
        'Try again later'
      );

      // Serialize the error
      const serialized = error.toJSON();

      // Verify the serialized format
      expect(serialized).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'TEST_ERROR_CODE',
          message: 'Test error message',
          journey: JourneyContext.HEALTH,
          requestId: 'req123',
          timestamp: '2023-01-01T12:00:00.000Z',
          details: { additionalInfo: 'test details' },
          suggestion: 'Try again later'
        }
      });
    });

    it('should handle errors without optional fields', () => {
      // Create a BaseError with minimal properties
      const error = new BaseError(
        'Minimal error',
        ErrorType.VALIDATION,
        'MINIMAL_ERROR'
      );

      // Serialize the error
      const serialized = error.toJSON();

      // Verify the serialized format still has the required fields
      expect(serialized.error.type).toBe(ErrorType.VALIDATION);
      expect(serialized.error.code).toBe('MINIMAL_ERROR');
      expect(serialized.error.message).toBe('Minimal error');
      
      // Optional fields should be undefined or have default values
      expect(serialized.error.journey).toBeUndefined();
      expect(serialized.error.requestId).toBeUndefined();
      expect(serialized.error.details).toBeUndefined();
      expect(serialized.error.suggestion).toBeUndefined();
      // Timestamp should be set automatically
      expect(serialized.error.timestamp).toBeDefined();
    });
  });

  describe('BusinessError serialization', () => {
    it('should serialize business errors with the correct format', () => {
      // Create a BusinessError
      const error = new BusinessError(
        'Business rule violation',
        'BUSINESS_RULE_ERROR',
        { journey: JourneyContext.CARE },
        { rule: 'Cannot schedule appointments in the past' },
        'Choose a future date for your appointment'
      );

      // Serialize the error
      const serialized = error.toJSON();

      // Verify the serialized format
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.code).toBe('BUSINESS_RULE_ERROR');
      expect(serialized.error.message).toBe('Business rule violation');
      expect(serialized.error.journey).toBe(JourneyContext.CARE);
      expect(serialized.error.details).toEqual({ rule: 'Cannot schedule appointments in the past' });
      expect(serialized.error.suggestion).toBe('Choose a future date for your appointment');
    });
  });

  describe('ResourceNotFoundError serialization', () => {
    it('should serialize not found errors with the correct format', () => {
      // Create a ResourceNotFoundError
      const error = new ResourceNotFoundError(
        'appointment',
        '12345',
        JourneyContext.CARE
      );

      // Serialize the error
      const serialized = error.toJSON();

      // Verify the serialized format
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.code).toBe('GEN_NOT_FOUND');
      expect(serialized.error.message).toBe('The requested appointment was not found');
      expect(serialized.error.journey).toBe(JourneyContext.CARE);
      expect(serialized.error.suggestion).toContain('Check if the appointment exists');
    });
  });
});

describe('Journey-specific Error Mappings', () => {
  describe('Health Journey Errors', () => {
    it('should create health metric errors with correct properties', () => {
      // Create a HealthMetricError
      const error = new Health.HealthMetricError(
        'Invalid heart rate value',
        { value: 250, metricType: HealthMetricType.HEART_RATE }
      );

      // Verify error properties
      expect(error.name).toBe('HealthMetricError');
      expect(error.message).toBe('Invalid heart rate value');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_METRIC_ERROR');
      expect(error.details).toEqual({ value: 250, metricType: HealthMetricType.HEART_RATE });

      // Verify serialization
      const serialized = error.toJSON();
      expect(serialized.error.type).toBe(ErrorType.BUSINESS);
      expect(serialized.error.code).toBe('HEALTH_METRIC_ERROR');
      expect(serialized.error.message).toBe('Invalid heart rate value');
      expect(serialized.error.details).toEqual({ value: 250, metricType: HealthMetricType.HEART_RATE });
    });

    it('should create health goal errors with correct properties', () => {
      // Create a HealthGoalError
      const error = new Health.HealthGoalError(
        'Goal already completed',
        { goalId: '12345', goalType: 'steps' }
      );

      // Verify error properties
      expect(error.name).toBe('HealthGoalError');
      expect(error.message).toBe('Goal already completed');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_GOAL_ERROR');
      expect(error.details).toEqual({ goalId: '12345', goalType: 'steps' });
    });
  });

  describe('Care Journey Errors', () => {
    it('should import and use Care journey errors', () => {
      // Verify Care journey errors are properly exported
      expect(Care).toBeDefined();
      
      // This is just a type check to ensure the Care journey errors are properly exported
      // The actual implementation will depend on the Care journey error classes
      expect(typeof Care).toBe('object');
    });
  });

  describe('Plan Journey Errors', () => {
    it('should import and use Plan journey errors', () => {
      // Verify Plan journey errors are properly exported
      expect(Plan).toBeDefined();
      
      // This is just a type check to ensure the Plan journey errors are properly exported
      // The actual implementation will depend on the Plan journey error classes
      expect(typeof Plan).toBe('object');
    });
  });
});