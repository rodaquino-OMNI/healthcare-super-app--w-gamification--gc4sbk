import * as HealthErrors from '../../../../src/journey/health';
import * as FhirErrors from '../../../../src/journey/health/fhir.errors';
import * as DevicesErrors from '../../../../src/journey/health/devices.errors';
import * as InsightsErrors from '../../../../src/journey/health/insights.errors';
import * as GoalsErrors from '../../../../src/journey/health/goals.errors';
import * as MetricsErrors from '../../../../src/journey/health/metrics.errors';
import * as Types from '../../../../src/journey/health/types';

describe('Health Journey Errors Barrel File', () => {
  describe('Export Structure', () => {
    it('should export all FHIR errors', () => {
      // Get all exported members from fhir.errors.ts
      const fhirErrorNames = Object.keys(FhirErrors);
      
      // Verify each error is exported through the barrel file
      fhirErrorNames.forEach(errorName => {
        expect(HealthErrors).toHaveProperty(errorName);
        expect(HealthErrors[errorName]).toBe(FhirErrors[errorName]);
      });
    });

    it('should export all devices errors', () => {
      const devicesErrorNames = Object.keys(DevicesErrors);
      
      devicesErrorNames.forEach(errorName => {
        expect(HealthErrors).toHaveProperty(errorName);
        expect(HealthErrors[errorName]).toBe(DevicesErrors[errorName]);
      });
    });

    it('should export all insights errors', () => {
      const insightsErrorNames = Object.keys(InsightsErrors);
      
      insightsErrorNames.forEach(errorName => {
        expect(HealthErrors).toHaveProperty(errorName);
        expect(HealthErrors[errorName]).toBe(InsightsErrors[errorName]);
      });
    });

    it('should export all goals errors', () => {
      const goalsErrorNames = Object.keys(GoalsErrors);
      
      goalsErrorNames.forEach(errorName => {
        expect(HealthErrors).toHaveProperty(errorName);
        expect(HealthErrors[errorName]).toBe(GoalsErrors[errorName]);
      });
    });

    it('should export all metrics errors', () => {
      const metricsErrorNames = Object.keys(MetricsErrors);
      
      metricsErrorNames.forEach(errorName => {
        expect(HealthErrors).toHaveProperty(errorName);
        expect(HealthErrors[errorName]).toBe(MetricsErrors[errorName]);
      });
    });

    it('should export all types', () => {
      const typeNames = Object.keys(Types);
      
      typeNames.forEach(typeName => {
        expect(HealthErrors).toHaveProperty(typeName);
        expect(HealthErrors[typeName]).toBe(Types[typeName]);
      });
    });
  });

  describe('Namespaced Exports', () => {
    it('should provide namespaced access to FHIR errors', () => {
      expect(HealthErrors.FHIR).toBeDefined();
      
      const fhirErrorNames = Object.keys(FhirErrors);
      fhirErrorNames.forEach(errorName => {
        expect(HealthErrors.FHIR).toHaveProperty(errorName);
        expect(HealthErrors.FHIR[errorName]).toBe(FhirErrors[errorName]);
      });
    });

    it('should provide namespaced access to devices errors', () => {
      expect(HealthErrors.Devices).toBeDefined();
      
      const devicesErrorNames = Object.keys(DevicesErrors);
      devicesErrorNames.forEach(errorName => {
        expect(HealthErrors.Devices).toHaveProperty(errorName);
        expect(HealthErrors.Devices[errorName]).toBe(DevicesErrors[errorName]);
      });
    });

    it('should provide namespaced access to insights errors', () => {
      expect(HealthErrors.Insights).toBeDefined();
      
      const insightsErrorNames = Object.keys(InsightsErrors);
      insightsErrorNames.forEach(errorName => {
        expect(HealthErrors.Insights).toHaveProperty(errorName);
        expect(HealthErrors.Insights[errorName]).toBe(InsightsErrors[errorName]);
      });
    });

    it('should provide namespaced access to goals errors', () => {
      expect(HealthErrors.Goals).toBeDefined();
      
      const goalsErrorNames = Object.keys(GoalsErrors);
      goalsErrorNames.forEach(errorName => {
        expect(HealthErrors.Goals).toHaveProperty(errorName);
        expect(HealthErrors.Goals[errorName]).toBe(GoalsErrors[errorName]);
      });
    });

    it('should provide namespaced access to metrics errors', () => {
      expect(HealthErrors.Metrics).toBeDefined();
      
      const metricsErrorNames = Object.keys(MetricsErrors);
      metricsErrorNames.forEach(errorName => {
        expect(HealthErrors.Metrics).toHaveProperty(errorName);
        expect(HealthErrors.Metrics[errorName]).toBe(MetricsErrors[errorName]);
      });
    });
  });

  describe('Error Class Verification', () => {
    it('should export specific FHIR error classes', () => {
      expect(HealthErrors.FhirConnectionFailureError).toBeDefined();
      expect(HealthErrors.InvalidResourceError).toBeDefined();
      expect(HealthErrors.FhirAuthenticationError).toBeDefined();
      expect(HealthErrors.ResourceNotFoundError).toBeDefined();
      expect(HealthErrors.UnsupportedResourceTypeError).toBeDefined();
      expect(HealthErrors.FhirParsingError).toBeDefined();
    });

    it('should export specific devices error classes', () => {
      expect(HealthErrors.DeviceConnectionFailureError).toBeDefined();
      expect(HealthErrors.DeviceAuthenticationError).toBeDefined();
      expect(HealthErrors.SynchronizationFailedError).toBeDefined();
      expect(HealthErrors.UnsupportedDeviceError).toBeDefined();
      expect(HealthErrors.DeviceDataFormatError).toBeDefined();
      expect(HealthErrors.DeviceTimeoutError).toBeDefined();
    });

    it('should export specific insights error classes', () => {
      expect(HealthErrors.InsufficientDataError).toBeDefined();
      expect(HealthErrors.PatternRecognitionFailureError).toBeDefined();
      expect(HealthErrors.ContradictoryRecommendationError).toBeDefined();
      expect(HealthErrors.InsightGenerationTimeoutError).toBeDefined();
      expect(HealthErrors.UnsupportedInsightTypeError).toBeDefined();
      expect(HealthErrors.InsightAlgorithmError).toBeDefined();
    });

    it('should export specific goals error classes', () => {
      expect(HealthErrors.InvalidGoalParametersError).toBeDefined();
      expect(HealthErrors.ConflictingGoalsError).toBeDefined();
      expect(HealthErrors.GoalNotFoundError).toBeDefined();
      expect(HealthErrors.GoalTrackingError).toBeDefined();
      expect(HealthErrors.UnachievableGoalError).toBeDefined();
      expect(HealthErrors.GoalPersistenceError).toBeDefined();
    });

    it('should export specific metrics error classes', () => {
      expect(HealthErrors.InvalidMetricValueError).toBeDefined();
      expect(HealthErrors.MetricNotFoundError).toBeDefined();
      expect(HealthErrors.MetricThresholdExceededError).toBeDefined();
      expect(HealthErrors.MetricPersistenceError).toBeDefined();
      expect(HealthErrors.ConflictingMetricsError).toBeDefined();
      expect(HealthErrors.MetricSourceUnavailableError).toBeDefined();
    });
  });

  describe('Import Pattern Consistency', () => {
    it('should allow importing specific errors directly', () => {
      const { FhirConnectionFailureError, DeviceConnectionFailureError } = HealthErrors;
      expect(FhirConnectionFailureError).toBe(FhirErrors.FhirConnectionFailureError);
      expect(DeviceConnectionFailureError).toBe(DevicesErrors.DeviceConnectionFailureError);
    });

    it('should allow importing errors through namespaces', () => {
      const { FHIR, Devices, Insights, Goals, Metrics } = HealthErrors;
      
      expect(FHIR.FhirConnectionFailureError).toBe(FhirErrors.FhirConnectionFailureError);
      expect(Devices.DeviceConnectionFailureError).toBe(DevicesErrors.DeviceConnectionFailureError);
      expect(Insights.InsufficientDataError).toBe(InsightsErrors.InsufficientDataError);
      expect(Goals.InvalidGoalParametersError).toBe(GoalsErrors.InvalidGoalParametersError);
      expect(Metrics.InvalidMetricValueError).toBe(MetricsErrors.InvalidMetricValueError);
    });
  });

  describe('Type Definitions', () => {
    it('should export error type enums', () => {
      expect(HealthErrors.HealthMetricsErrorType).toBeDefined();
      expect(HealthErrors.HealthGoalsErrorType).toBeDefined();
      expect(HealthErrors.HealthInsightsErrorType).toBeDefined();
      expect(HealthErrors.HealthDevicesErrorType).toBeDefined();
      expect(HealthErrors.HealthFhirErrorType).toBeDefined();
    });

    it('should export error code constants', () => {
      // Metrics error codes
      expect(HealthErrors.HEALTH_METRICS_INVALID_VALUE).toBeDefined();
      expect(HealthErrors.HEALTH_METRICS_NOT_FOUND).toBeDefined();
      expect(HealthErrors.HEALTH_METRICS_THRESHOLD_EXCEEDED).toBeDefined();
      
      // Goals error codes
      expect(HealthErrors.HEALTH_GOALS_INVALID_PARAMETERS).toBeDefined();
      expect(HealthErrors.HEALTH_GOALS_CONFLICTING).toBeDefined();
      expect(HealthErrors.HEALTH_GOALS_NOT_FOUND).toBeDefined();
      
      // FHIR error codes
      expect(HealthErrors.HEALTH_FHIR_CONNECTION_FAILURE).toBeDefined();
      expect(HealthErrors.HEALTH_FHIR_INVALID_RESOURCE).toBeDefined();
      expect(HealthErrors.HEALTH_FHIR_AUTHENTICATION_ERROR).toBeDefined();
    });
  });
});