import { describe, expect, it } from '@jest/globals';
import * as HealthErrors from '../../../../../../src/journey/health';
import { Health } from '../../../../../../src/journey/health';

describe('Health Journey Errors Barrel File', () => {
  describe('Direct exports', () => {
    it('should export all metrics error classes', () => {
      expect(HealthErrors.InvalidMetricValueError).toBeDefined();
      expect(HealthErrors.MetricNotFoundError).toBeDefined();
      expect(HealthErrors.MetricTypeNotSupportedError).toBeDefined();
      expect(HealthErrors.MetricValidationError).toBeDefined();
      expect(HealthErrors.MetricPersistenceError).toBeDefined();
    });

    it('should export all goals error classes', () => {
      expect(HealthErrors.GoalNotFoundError).toBeDefined();
      expect(HealthErrors.GoalValidationError).toBeDefined();
      expect(HealthErrors.GoalProgressUpdateError).toBeDefined();
      expect(HealthErrors.GoalCompletionError).toBeDefined();
      expect(HealthErrors.GoalPersistenceError).toBeDefined();
    });

    it('should export all insights error classes', () => {
      expect(HealthErrors.InsightGenerationError).toBeDefined();
      expect(HealthErrors.InsightNotFoundError).toBeDefined();
      expect(HealthErrors.InsightDataInsufficientError).toBeDefined();
      expect(HealthErrors.InsightPersistenceError).toBeDefined();
    });

    it('should export all devices error classes', () => {
      expect(HealthErrors.DeviceConnectionError).toBeDefined();
      expect(HealthErrors.DeviceNotFoundError).toBeDefined();
      expect(HealthErrors.DeviceSyncError).toBeDefined();
      expect(HealthErrors.DeviceAuthenticationError).toBeDefined();
      expect(HealthErrors.DeviceTypeNotSupportedError).toBeDefined();
      expect(HealthErrors.DevicePersistenceError).toBeDefined();
    });

    it('should export all FHIR error classes', () => {
      expect(HealthErrors.FHIRIntegrationError).toBeDefined();
      expect(HealthErrors.FHIRResourceNotFoundError).toBeDefined();
      expect(HealthErrors.FHIRAuthenticationError).toBeDefined();
      expect(HealthErrors.FHIRResponseFormatError).toBeDefined();
      expect(HealthErrors.FHIRRequestValidationError).toBeDefined();
    });
  });

  describe('Namespace exports', () => {
    it('should export the Health namespace', () => {
      expect(Health).toBeDefined();
    });

    it('should export the Metrics namespace with all metrics error classes', () => {
      expect(Health.Metrics).toBeDefined();
      expect(Health.Metrics.InvalidMetricValueError).toBeDefined();
      expect(Health.Metrics.MetricNotFoundError).toBeDefined();
      expect(Health.Metrics.MetricTypeNotSupportedError).toBeDefined();
      expect(Health.Metrics.MetricValidationError).toBeDefined();
      expect(Health.Metrics.MetricPersistenceError).toBeDefined();
    });

    it('should export the Goals namespace with all goals error classes', () => {
      expect(Health.Goals).toBeDefined();
      expect(Health.Goals.GoalNotFoundError).toBeDefined();
      expect(Health.Goals.GoalValidationError).toBeDefined();
      expect(Health.Goals.GoalProgressUpdateError).toBeDefined();
      expect(Health.Goals.GoalCompletionError).toBeDefined();
      expect(Health.Goals.GoalPersistenceError).toBeDefined();
    });

    it('should export the Insights namespace with all insights error classes', () => {
      expect(Health.Insights).toBeDefined();
      expect(Health.Insights.InsightGenerationError).toBeDefined();
      expect(Health.Insights.InsightNotFoundError).toBeDefined();
      expect(Health.Insights.InsightDataInsufficientError).toBeDefined();
      expect(Health.Insights.InsightPersistenceError).toBeDefined();
    });

    it('should export the Devices namespace with all devices error classes', () => {
      expect(Health.Devices).toBeDefined();
      expect(Health.Devices.DeviceConnectionError).toBeDefined();
      expect(Health.Devices.DeviceNotFoundError).toBeDefined();
      expect(Health.Devices.DeviceSyncError).toBeDefined();
      expect(Health.Devices.DeviceAuthenticationError).toBeDefined();
      expect(Health.Devices.DeviceTypeNotSupportedError).toBeDefined();
      expect(Health.Devices.DevicePersistenceError).toBeDefined();
    });

    it('should export the FHIR namespace with all FHIR error classes', () => {
      expect(Health.FHIR).toBeDefined();
      expect(Health.FHIR.FHIRIntegrationError).toBeDefined();
      expect(Health.FHIR.FHIRResourceNotFoundError).toBeDefined();
      expect(Health.FHIR.FHIRAuthenticationError).toBeDefined();
      expect(Health.FHIR.FHIRResponseFormatError).toBeDefined();
      expect(Health.FHIR.FHIRRequestValidationError).toBeDefined();
    });

    it('should export the ErrorCodes namespace', () => {
      expect(Health.ErrorCodes).toBeDefined();
    });
  });

  describe('Error codes', () => {
    it('should export all metrics error codes', () => {
      expect(HealthErrors.ErrorCodes.HEALTH_METRICS_INVALID_VALUE).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_METRICS_NOT_FOUND).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_METRICS_TYPE_NOT_SUPPORTED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_METRICS_VALIDATION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_METRICS_PERSISTENCE_FAILED).toBeDefined();
    });

    it('should export all goals error codes', () => {
      expect(HealthErrors.ErrorCodes.HEALTH_GOALS_NOT_FOUND).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_GOALS_VALIDATION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_GOALS_PROGRESS_UPDATE_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_GOALS_COMPLETION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_GOALS_PERSISTENCE_FAILED).toBeDefined();
    });

    it('should export all insights error codes', () => {
      expect(HealthErrors.ErrorCodes.HEALTH_INSIGHTS_GENERATION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_INSIGHTS_NOT_FOUND).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_INSIGHTS_DATA_INSUFFICIENT).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_INSIGHTS_PERSISTENCE_FAILED).toBeDefined();
    });

    it('should export all devices error codes', () => {
      expect(HealthErrors.ErrorCodes.HEALTH_DEVICES_CONNECTION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_DEVICES_NOT_FOUND).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_DEVICES_SYNC_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_DEVICES_AUTHENTICATION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_DEVICES_TYPE_NOT_SUPPORTED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_DEVICES_PERSISTENCE_FAILED).toBeDefined();
    });

    it('should export all FHIR error codes', () => {
      expect(HealthErrors.ErrorCodes.HEALTH_FHIR_INTEGRATION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_FHIR_RESOURCE_NOT_FOUND).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_FHIR_AUTHENTICATION_FAILED).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_FHIR_RESPONSE_FORMAT_INVALID).toBeDefined();
      expect(HealthErrors.ErrorCodes.HEALTH_FHIR_REQUEST_VALIDATION_FAILED).toBeDefined();
    });
  });

  describe('Error class instantiation', () => {
    it('should be able to instantiate metrics error classes', () => {
      const error = new HealthErrors.InvalidMetricValueError('heart_rate', 250, '30-220 bpm');
      expect(error).toBeInstanceOf(HealthErrors.InvalidMetricValueError);
      expect(error.message).toContain('heart_rate');
      expect(error.message).toContain('250');
    });

    it('should be able to instantiate goals error classes', () => {
      const error = new HealthErrors.GoalNotFoundError('goal-123');
      expect(error).toBeInstanceOf(HealthErrors.GoalNotFoundError);
      expect(error.message).toContain('goal-123');
    });

    it('should be able to instantiate insights error classes', () => {
      const error = new HealthErrors.InsightNotFoundError('insight-123');
      expect(error).toBeInstanceOf(HealthErrors.InsightNotFoundError);
      expect(error.message).toContain('insight-123');
    });

    it('should be able to instantiate devices error classes', () => {
      const error = new HealthErrors.DeviceNotFoundError('device-123');
      expect(error).toBeInstanceOf(HealthErrors.DeviceNotFoundError);
      expect(error.message).toContain('device-123');
    });

    it('should be able to instantiate FHIR error classes', () => {
      const error = new HealthErrors.FHIRResourceNotFoundError('Patient/123');
      expect(error).toBeInstanceOf(HealthErrors.FHIRResourceNotFoundError);
      expect(error.message).toContain('Patient/123');
    });
  });

  describe('Namespace error class instantiation', () => {
    it('should be able to instantiate metrics error classes from namespace', () => {
      const error = new Health.Metrics.InvalidMetricValueError('heart_rate', 250, '30-220 bpm');
      expect(error).toBeInstanceOf(HealthErrors.InvalidMetricValueError);
      expect(error.message).toContain('heart_rate');
      expect(error.message).toContain('250');
    });

    it('should be able to instantiate goals error classes from namespace', () => {
      const error = new Health.Goals.GoalNotFoundError('goal-123');
      expect(error).toBeInstanceOf(HealthErrors.GoalNotFoundError);
      expect(error.message).toContain('goal-123');
    });

    it('should be able to instantiate insights error classes from namespace', () => {
      const error = new Health.Insights.InsightNotFoundError('insight-123');
      expect(error).toBeInstanceOf(HealthErrors.InsightNotFoundError);
      expect(error.message).toContain('insight-123');
    });

    it('should be able to instantiate devices error classes from namespace', () => {
      const error = new Health.Devices.DeviceNotFoundError('device-123');
      expect(error).toBeInstanceOf(HealthErrors.DeviceNotFoundError);
      expect(error.message).toContain('device-123');
    });

    it('should be able to instantiate FHIR error classes from namespace', () => {
      const error = new Health.FHIR.FHIRResourceNotFoundError('Patient/123');
      expect(error).toBeInstanceOf(HealthErrors.FHIRResourceNotFoundError);
      expect(error.message).toContain('Patient/123');
    });
  });
});