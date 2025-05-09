/**
 * @file types.spec.ts
 * @description Tests for Health journey error type definitions, enums, and type guards.
 * Ensures that Health-specific error types are correctly defined and function as expected.
 */

import { describe, it, expect } from 'jest';
import { ErrorType, BaseError, isHealthError } from '../../../../src/base';
import { 
  HealthErrorType, 
  HealthMetricType, 
  HealthGoalStatus, 
  DeviceConnectionStatus 
} from '../../../../src/journey/health/types';
import { 
  InvalidMetricValueError,
  InvalidMetricUnitError,
  MetricThresholdExceededError,
  ConflictingMetricError,
  MetricStorageError,
  MetricProcessingError,
  MetricRetrievalError,
  WearableDeviceSyncError,
  ExternalDataSourceError,
  FHIRResourceProcessingError,
  HealthMetricError
} from '../../../../src/journey/health/metrics.errors';
import {
  InvalidGoalParametersError,
  ConflictingGoalsError,
  GoalTrackingError,
  GoalAchievementError,
  HealthGoalError
} from '../../../../src/journey/health/goals.errors';
import {
  DeviceConnectionError,
  DeviceAuthenticationError,
  DeviceNotSupportedError,
  DeviceSyncError
} from '../../../../src/journey/health/devices.errors';
import {
  InsufficientDataError,
  PatternRecognitionFailureError,
  InsightGenerationError,
  InsightRecommendationError
} from '../../../../src/journey/health/insights.errors';
import { ERROR_CODE_PREFIXES, HEALTH_ERROR_PREFIXES } from '../../../../src/constants';

describe('Health Journey Error Types', () => {
  describe('HealthErrorType Enum', () => {
    it('should define all required health error types', () => {
      // Verify all expected health error types are defined
      expect(HealthErrorType.METRIC).toBe('METRIC');
      expect(HealthErrorType.GOAL).toBe('GOAL');
      expect(HealthErrorType.DEVICE).toBe('DEVICE');
      expect(HealthErrorType.SYNC).toBe('SYNC');
      expect(HealthErrorType.INSIGHT).toBe('INSIGHT');
    });

    it('should have all enum values as uppercase strings', () => {
      // Verify all enum values are uppercase strings
      Object.values(HealthErrorType).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toUpperCase());
      });
    });
  });

  describe('HealthMetricType Enum', () => {
    it('should define all required health metric types', () => {
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

    it('should have all enum values as lowercase snake_case strings', () => {
      // Verify all enum values are lowercase snake_case strings
      Object.values(HealthMetricType).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toLowerCase());
        expect(value).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('HealthGoalStatus Enum', () => {
    it('should define all required health goal statuses', () => {
      // Verify all expected health goal statuses are defined
      expect(HealthGoalStatus.NOT_STARTED).toBe('not_started');
      expect(HealthGoalStatus.IN_PROGRESS).toBe('in_progress');
      expect(HealthGoalStatus.COMPLETED).toBe('completed');
      expect(HealthGoalStatus.FAILED).toBe('failed');
    });

    it('should have all enum values as lowercase snake_case strings', () => {
      // Verify all enum values are lowercase snake_case strings
      Object.values(HealthGoalStatus).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toLowerCase());
        expect(value).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('DeviceConnectionStatus Enum', () => {
    it('should define all required device connection statuses', () => {
      // Verify all expected device connection statuses are defined
      expect(DeviceConnectionStatus.CONNECTED).toBe('connected');
      expect(DeviceConnectionStatus.DISCONNECTED).toBe('disconnected');
      expect(DeviceConnectionStatus.PAIRING).toBe('pairing');
      expect(DeviceConnectionStatus.ERROR).toBe('error');
    });

    it('should have all enum values as lowercase strings', () => {
      // Verify all enum values are lowercase strings
      Object.values(DeviceConnectionStatus).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toLowerCase());
      });
    });
  });
});

describe('Health Journey Error Code Prefixes', () => {
  it('should define the main HEALTH error code prefix', () => {
    // Verify the HEALTH error code prefix is defined
    expect(ERROR_CODE_PREFIXES.HEALTH).toBe('HEALTH');
  });

  it('should define all health-specific error code prefixes', () => {
    // Verify all expected health error code prefixes are defined
    expect(HEALTH_ERROR_PREFIXES.METRICS).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_METRICS`);
    expect(HEALTH_ERROR_PREFIXES.GOALS).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_GOALS`);
    expect(HEALTH_ERROR_PREFIXES.INSIGHTS).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_INSIGHTS`);
    expect(HEALTH_ERROR_PREFIXES.DEVICES).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_DEVICES`);
    expect(HEALTH_ERROR_PREFIXES.FHIR).toBe(`${ERROR_CODE_PREFIXES.HEALTH}_FHIR`);
  });

  it('should follow the standardized format for all health error code prefixes', () => {
    // Verify all health error code prefixes follow the standardized format
    Object.values(HEALTH_ERROR_PREFIXES).forEach(prefix => {
      expect(prefix).toMatch(/^HEALTH_[A-Z]+$/);
      expect(prefix.startsWith(ERROR_CODE_PREFIXES.HEALTH + '_')).toBe(true);
    });
  });
});

describe('Health Journey Error Type Guards', () => {
  it('should correctly identify Health journey errors', () => {
    // Create errors from different journeys
    const healthError = new InvalidMetricValueError(
      'Invalid heart rate value',
      { metricType: 'heart_rate', metricValue: 250 }
    );
    const nonHealthError = new BaseError(
      'Generic error',
      ErrorType.TECHNICAL,
      'GEN_ERROR'
    );

    // Verify the type guard correctly identifies Health journey errors
    expect(isHealthError(healthError)).toBe(true);
    expect(isHealthError(nonHealthError)).toBe(false);
  });

  it('should correctly identify specific Health error types', () => {
    // Create errors of different Health error types
    const metricError = new InvalidMetricValueError(
      'Invalid heart rate value',
      { metricType: 'heart_rate', metricValue: 250 }
    );
    const goalError = new InvalidGoalParametersError(
      'Invalid goal parameters',
      { goalType: 'steps', targetValue: -100 }
    );
    const deviceError = new DeviceConnectionError(
      'Failed to connect to device',
      { deviceId: '12345', deviceType: 'fitbit' }
    );
    const insightError = new InsufficientDataError(
      'Insufficient data for insight generation',
      { metricType: 'sleep', requiredDays: 7, availableDays: 2 }
    );

    // Verify the errors are correctly identified by their specific types
    expect(metricError instanceof HealthMetricError).toBe(true);
    expect(goalError instanceof HealthGoalError).toBe(true);
    expect(deviceError instanceof DeviceConnectionError).toBe(true);
    expect(insightError instanceof InsufficientDataError).toBe(true);

    // Verify cross-type checks
    expect(metricError instanceof HealthGoalError).toBe(false);
    expect(goalError instanceof HealthMetricError).toBe(false);
  });
});

describe('Health Metrics Error Classes', () => {
  describe('Error Code Prefixes', () => {
    it('should use the correct error code prefix for all metric errors', () => {
      // Create instances of each metric error class
      const invalidValueError = new InvalidMetricValueError(
        'Invalid heart rate value',
        { metricType: 'heart_rate', metricValue: 250 }
      );
      const invalidUnitError = new InvalidMetricUnitError(
        'Invalid unit for blood pressure',
        { metricType: 'blood_pressure', metricUnit: 'invalid_unit' }
      );
      const thresholdError = new MetricThresholdExceededError(
        'Heart rate exceeds threshold',
        { metricType: 'heart_rate', metricValue: 180, threshold: 150 }
      );
      const conflictError = new ConflictingMetricError(
        'Conflicting metric data',
        { metricType: 'weight', conflictingMetricId: '12345' }
      );
      const storageError = new MetricStorageError(
        'Failed to store metric',
        { metricType: 'steps' }
      );
      const processingError = new MetricProcessingError(
        'Failed to process metric',
        { metricType: 'sleep', operation: 'aggregate' }
      );
      const retrievalError = new MetricRetrievalError(
        'Failed to retrieve metric',
        { metricId: '12345' }
      );
      const syncError = new WearableDeviceSyncError(
        'Failed to sync with device',
        { deviceId: '12345', deviceType: 'fitbit' }
      );
      const externalError = new ExternalDataSourceError(
        'Failed to retrieve from external source',
        { source: 'apple_health' }
      );
      const fhirError = new FHIRResourceProcessingError(
        'Failed to process FHIR resource',
        { resourceType: 'Observation', resourceId: '12345' }
      );

      // Verify all error codes use the correct prefix
      expect(invalidValueError.code).toMatch(/^HEALTH_METRICS_/);
      expect(invalidUnitError.code).toMatch(/^HEALTH_METRICS_/);
      expect(thresholdError.code).toMatch(/^HEALTH_METRICS_/);
      expect(conflictError.code).toMatch(/^HEALTH_METRICS_/);
      expect(storageError.code).toMatch(/^HEALTH_METRICS_/);
      expect(processingError.code).toMatch(/^HEALTH_METRICS_/);
      expect(retrievalError.code).toMatch(/^HEALTH_METRICS_/);
      expect(syncError.code).toMatch(/^HEALTH_METRICS_/);
      expect(externalError.code).toMatch(/^HEALTH_METRICS_/);
      expect(fhirError.code).toMatch(/^HEALTH_METRICS_/);
    });
  });

  describe('Error Type Classification', () => {
    it('should classify validation errors correctly', () => {
      // Create validation errors
      const invalidValueError = new InvalidMetricValueError(
        'Invalid heart rate value',
        { metricType: 'heart_rate', metricValue: 250 }
      );
      const invalidUnitError = new InvalidMetricUnitError(
        'Invalid unit for blood pressure',
        { metricType: 'blood_pressure', metricUnit: 'invalid_unit' }
      );

      // Verify they are classified as validation errors
      expect(invalidValueError.type).toBe(ErrorType.VALIDATION);
      expect(invalidUnitError.type).toBe(ErrorType.VALIDATION);
    });

    it('should classify business errors correctly', () => {
      // Create business errors
      const thresholdError = new MetricThresholdExceededError(
        'Heart rate exceeds threshold',
        { metricType: 'heart_rate', metricValue: 180, threshold: 150 }
      );
      const conflictError = new ConflictingMetricError(
        'Conflicting metric data',
        { metricType: 'weight', conflictingMetricId: '12345' }
      );

      // Verify they are classified as business errors
      expect(thresholdError.type).toBe(ErrorType.BUSINESS);
      expect(conflictError.type).toBe(ErrorType.BUSINESS);
    });

    it('should classify technical errors correctly', () => {
      // Create technical errors
      const storageError = new MetricStorageError(
        'Failed to store metric',
        { metricType: 'steps' }
      );
      const processingError = new MetricProcessingError(
        'Failed to process metric',
        { metricType: 'sleep', operation: 'aggregate' }
      );
      const retrievalError = new MetricRetrievalError(
        'Failed to retrieve metric',
        { metricId: '12345' }
      );

      // Verify they are classified as technical errors
      expect(storageError.type).toBe(ErrorType.TECHNICAL);
      expect(processingError.type).toBe(ErrorType.TECHNICAL);
      expect(retrievalError.type).toBe(ErrorType.TECHNICAL);
    });

    it('should classify external errors correctly', () => {
      // Create external errors
      const syncError = new WearableDeviceSyncError(
        'Failed to sync with device',
        { deviceId: '12345', deviceType: 'fitbit' }
      );
      const externalError = new ExternalDataSourceError(
        'Failed to retrieve from external source',
        { source: 'apple_health' }
      );
      const fhirError = new FHIRResourceProcessingError(
        'Failed to process FHIR resource',
        { resourceType: 'Observation', resourceId: '12345' }
      );

      // Verify they are classified as external errors
      expect(syncError.type).toBe(ErrorType.EXTERNAL);
      expect(externalError.type).toBe(ErrorType.EXTERNAL);
      expect(fhirError.type).toBe(ErrorType.EXTERNAL);
    });
  });

  describe('Error Details', () => {
    it('should include all required details in metric errors', () => {
      // Create an error with details
      const error = new InvalidMetricValueError(
        'Invalid heart rate value',
        { 
          metricType: 'heart_rate', 
          metricValue: 250,
          metricUnit: 'bpm',
          userId: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          source: 'manual_entry'
        }
      );

      // Verify all details are included
      expect(error.details).toBeDefined();
      expect(error.details.metricType).toBe('heart_rate');
      expect(error.details.metricValue).toBe(250);
      expect(error.details.metricUnit).toBe('bpm');
      expect(error.details.userId).toBe('user123');
      expect(error.details.timestamp).toBe('2023-01-01T12:00:00Z');
      expect(error.details.source).toBe('manual_entry');
    });

    it('should include extended details for specific error types', () => {
      // Create errors with extended details
      const thresholdError = new MetricThresholdExceededError(
        'Heart rate exceeds threshold',
        { 
          metricType: 'heart_rate', 
          metricValue: 180, 
          threshold: 150,
          thresholdType: 'maximum'
        }
      );

      const conflictError = new ConflictingMetricError(
        'Conflicting metric data',
        { 
          metricType: 'weight', 
          conflictingMetricId: '12345'
        }
      );

      // Verify extended details are included
      expect(thresholdError.details.threshold).toBe(150);
      expect(thresholdError.details.thresholdType).toBe('maximum');
      
      expect(conflictError.details.conflictingMetricId).toBe('12345');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize metric errors with the correct format', () => {
      // Create a metric error with various properties
      const error = new InvalidMetricValueError(
        'Invalid heart rate value',
        { 
          metricType: 'heart_rate', 
          metricValue: 250,
          metricUnit: 'bpm'
        }
      );

      // Serialize the error
      const serialized = error.toJSON();

      // Verify the serialized format
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(serialized.error).toHaveProperty('code', 'HEALTH_METRICS_INVALID_VALUE');
      expect(serialized.error).toHaveProperty('message', 'Invalid heart rate value');
      expect(serialized.error).toHaveProperty('details');
      expect(serialized.error.details).toHaveProperty('metricType', 'heart_rate');
      expect(serialized.error.details).toHaveProperty('metricValue', 250);
      expect(serialized.error.details).toHaveProperty('metricUnit', 'bpm');
    });
  });
});

describe('Health Goals Error Classes', () => {
  describe('Error Code Prefixes', () => {
    it('should use the correct error code prefix for all goal errors', () => {
      // Create instances of each goal error class
      const invalidParamsError = new InvalidGoalParametersError(
        'Invalid goal parameters',
        { goalType: 'steps', targetValue: -100 }
      );
      const conflictingGoalsError = new ConflictingGoalsError(
        'Conflicting goals detected',
        { goalId: '12345', conflictingGoalId: '67890' }
      );
      const trackingError = new GoalTrackingError(
        'Failed to track goal progress',
        { goalId: '12345', metricType: 'steps' }
      );
      const achievementError = new GoalAchievementError(
        'Failed to process goal achievement',
        { goalId: '12345', achievementId: '67890' }
      );

      // Verify all error codes use the correct prefix
      expect(invalidParamsError.code).toMatch(/^HEALTH_GOALS_/);
      expect(conflictingGoalsError.code).toMatch(/^HEALTH_GOALS_/);
      expect(trackingError.code).toMatch(/^HEALTH_GOALS_/);
      expect(achievementError.code).toMatch(/^HEALTH_GOALS_/);
    });
  });

  describe('Error Type Classification', () => {
    it('should classify goal errors with the correct error types', () => {
      // Create errors of different types
      const invalidParamsError = new InvalidGoalParametersError(
        'Invalid goal parameters',
        { goalType: 'steps', targetValue: -100 }
      );
      const conflictingGoalsError = new ConflictingGoalsError(
        'Conflicting goals detected',
        { goalId: '12345', conflictingGoalId: '67890' }
      );
      const trackingError = new GoalTrackingError(
        'Failed to track goal progress',
        { goalId: '12345', metricType: 'steps' }
      );
      const achievementError = new GoalAchievementError(
        'Failed to process goal achievement',
        { goalId: '12345', achievementId: '67890' }
      );

      // Verify error types
      expect(invalidParamsError.type).toBe(ErrorType.VALIDATION);
      expect(conflictingGoalsError.type).toBe(ErrorType.BUSINESS);
      expect(trackingError.type).toBe(ErrorType.TECHNICAL);
      expect(achievementError.type).toBe(ErrorType.TECHNICAL);
    });
  });
});

describe('Health Devices Error Classes', () => {
  describe('Error Code Prefixes', () => {
    it('should use the correct error code prefix for all device errors', () => {
      // Create instances of each device error class
      const connectionError = new DeviceConnectionError(
        'Failed to connect to device',
        { deviceId: '12345', deviceType: 'fitbit' }
      );
      const authError = new DeviceAuthenticationError(
        'Failed to authenticate with device',
        { deviceId: '12345', deviceType: 'fitbit' }
      );
      const notSupportedError = new DeviceNotSupportedError(
        'Device not supported',
        { deviceType: 'unsupported_device' }
      );
      const syncError = new DeviceSyncError(
        'Failed to sync with device',
        { deviceId: '12345', deviceType: 'fitbit', lastSyncTime: '2023-01-01T12:00:00Z' }
      );

      // Verify all error codes use the correct prefix
      expect(connectionError.code).toMatch(/^HEALTH_DEVICES_/);
      expect(authError.code).toMatch(/^HEALTH_DEVICES_/);
      expect(notSupportedError.code).toMatch(/^HEALTH_DEVICES_/);
      expect(syncError.code).toMatch(/^HEALTH_DEVICES_/);
    });
  });

  describe('Error Type Classification', () => {
    it('should classify device errors with the correct error types', () => {
      // Create errors of different types
      const connectionError = new DeviceConnectionError(
        'Failed to connect to device',
        { deviceId: '12345', deviceType: 'fitbit' }
      );
      const authError = new DeviceAuthenticationError(
        'Failed to authenticate with device',
        { deviceId: '12345', deviceType: 'fitbit' }
      );
      const notSupportedError = new DeviceNotSupportedError(
        'Device not supported',
        { deviceType: 'unsupported_device' }
      );
      const syncError = new DeviceSyncError(
        'Failed to sync with device',
        { deviceId: '12345', deviceType: 'fitbit', lastSyncTime: '2023-01-01T12:00:00Z' }
      );

      // Verify error types
      expect(connectionError.type).toBe(ErrorType.EXTERNAL);
      expect(authError.type).toBe(ErrorType.EXTERNAL);
      expect(notSupportedError.type).toBe(ErrorType.VALIDATION);
      expect(syncError.type).toBe(ErrorType.EXTERNAL);
    });
  });
});

describe('Health Insights Error Classes', () => {
  describe('Error Code Prefixes', () => {
    it('should use the correct error code prefix for all insight errors', () => {
      // Create instances of each insight error class
      const insufficientDataError = new InsufficientDataError(
        'Insufficient data for insight generation',
        { metricType: 'sleep', requiredDays: 7, availableDays: 2 }
      );
      const patternRecognitionError = new PatternRecognitionFailureError(
        'Failed to recognize patterns in data',
        { metricType: 'heart_rate', algorithm: 'trend_analysis' }
      );
      const generationError = new InsightGenerationError(
        'Failed to generate insight',
        { insightType: 'sleep_quality', userId: 'user123' }
      );
      const recommendationError = new InsightRecommendationError(
        'Failed to generate recommendation',
        { insightId: '12345', recommendationType: 'activity' }
      );

      // Verify all error codes use the correct prefix
      expect(insufficientDataError.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(patternRecognitionError.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(generationError.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(recommendationError.code).toMatch(/^HEALTH_INSIGHTS_/);
    });
  });

  describe('Error Type Classification', () => {
    it('should classify insight errors with the correct error types', () => {
      // Create errors of different types
      const insufficientDataError = new InsufficientDataError(
        'Insufficient data for insight generation',
        { metricType: 'sleep', requiredDays: 7, availableDays: 2 }
      );
      const patternRecognitionError = new PatternRecognitionFailureError(
        'Failed to recognize patterns in data',
        { metricType: 'heart_rate', algorithm: 'trend_analysis' }
      );
      const generationError = new InsightGenerationError(
        'Failed to generate insight',
        { insightType: 'sleep_quality', userId: 'user123' }
      );
      const recommendationError = new InsightRecommendationError(
        'Failed to generate recommendation',
        { insightId: '12345', recommendationType: 'activity' }
      );

      // Verify error types
      expect(insufficientDataError.type).toBe(ErrorType.BUSINESS);
      expect(patternRecognitionError.type).toBe(ErrorType.TECHNICAL);
      expect(generationError.type).toBe(ErrorType.TECHNICAL);
      expect(recommendationError.type).toBe(ErrorType.TECHNICAL);
    });
  });
});