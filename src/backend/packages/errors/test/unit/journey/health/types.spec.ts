/**
 * @file Unit tests for Health journey error type definitions
 * 
 * Tests ensure that Health-specific error enums, interfaces, and type guards
 * are correctly defined and function as expected. Validates type compatibility,
 * error code prefixing patterns, and type guard behavior for error classification.
 */

import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  // Error type enums
  HealthMetricsErrorType,
  HealthGoalsErrorType,
  HealthInsightsErrorType,
  DeviceConnectionErrorType,
  FHIRIntegrationErrorType,
  
  // Error code constants
  HEALTH_METRICS_ERROR_CODES,
  HEALTH_GOALS_ERROR_CODES,
  HEALTH_INSIGHTS_ERROR_CODES,
  HEALTH_DEVICE_ERROR_CODES,
  HEALTH_FHIR_ERROR_CODES,
  
  // Error code types
  HealthMetricsErrorCode,
  HealthGoalsErrorCode,
  HealthInsightsErrorCode,
  HealthDeviceErrorCode,
  HealthFHIRErrorCode,
  HealthErrorCode,
  
  // Type guards
  isHealthMetricsErrorCode,
  isHealthGoalsErrorCode,
  isHealthInsightsErrorCode,
  isHealthDeviceErrorCode,
  isHealthFHIRErrorCode,
  isHealthErrorCode,
  
  // Error code mapping functions
  getHealthMetricsErrorCode,
  getHealthGoalsErrorCode,
  getHealthInsightsErrorCode,
  getHealthDeviceErrorCode,
  getHealthFHIRErrorCode,
  
  // Error type mapping
  getErrorTypeFromHealthCode
} from '../../../../src/journey/health/types';

describe('Health Journey Error Types', () => {
  describe('Error Type Enums', () => {
    it('should define all required HealthMetricsErrorType values', () => {
      expect(Object.keys(HealthMetricsErrorType)).toHaveLength(8);
      expect(HealthMetricsErrorType.INVALID_METRIC_DATA).toBe('invalid_metric_data');
      expect(HealthMetricsErrorType.UNSUPPORTED_METRIC_TYPE).toBe('unsupported_metric_type');
      expect(HealthMetricsErrorType.DUPLICATE_METRIC).toBe('duplicate_metric');
      expect(HealthMetricsErrorType.METRIC_NOT_FOUND).toBe('metric_not_found');
      expect(HealthMetricsErrorType.INVALID_DATE_RANGE).toBe('invalid_date_range');
      expect(HealthMetricsErrorType.THRESHOLD_EXCEEDED).toBe('threshold_exceeded');
      expect(HealthMetricsErrorType.THRESHOLD_NOT_MET).toBe('threshold_not_met');
      expect(HealthMetricsErrorType.PROCESSING_FAILED).toBe('processing_failed');
    });

    it('should define all required HealthGoalsErrorType values', () => {
      expect(Object.keys(HealthGoalsErrorType)).toHaveLength(8);
      expect(HealthGoalsErrorType.INVALID_GOAL).toBe('invalid_goal');
      expect(HealthGoalsErrorType.DUPLICATE_GOAL).toBe('duplicate_goal');
      expect(HealthGoalsErrorType.GOAL_NOT_FOUND).toBe('goal_not_found');
      expect(HealthGoalsErrorType.INVALID_TARGET).toBe('invalid_target');
      expect(HealthGoalsErrorType.INVALID_DEADLINE).toBe('invalid_deadline');
      expect(HealthGoalsErrorType.PROGRESS_CALCULATION_FAILED).toBe('progress_calculation_failed');
      expect(HealthGoalsErrorType.UPDATE_FAILED).toBe('update_failed');
      expect(HealthGoalsErrorType.MAX_GOALS_REACHED).toBe('max_goals_reached');
    });

    it('should define all required HealthInsightsErrorType values', () => {
      expect(Object.keys(HealthInsightsErrorType)).toHaveLength(6);
      expect(HealthInsightsErrorType.GENERATION_FAILED).toBe('generation_failed');
      expect(HealthInsightsErrorType.INSUFFICIENT_DATA).toBe('insufficient_data');
      expect(HealthInsightsErrorType.INSIGHT_NOT_FOUND).toBe('insight_not_found');
      expect(HealthInsightsErrorType.UNSUPPORTED_TYPE).toBe('unsupported_type');
      expect(HealthInsightsErrorType.PROCESSING_TIMEOUT).toBe('processing_timeout');
      expect(HealthInsightsErrorType.ALGORITHM_ERROR).toBe('algorithm_error');
    });

    it('should define all required DeviceConnectionErrorType values', () => {
      expect(Object.keys(DeviceConnectionErrorType)).toHaveLength(8);
      expect(DeviceConnectionErrorType.CONNECTION_FAILED).toBe('connection_failed');
      expect(DeviceConnectionErrorType.DEVICE_NOT_FOUND).toBe('device_not_found');
      expect(DeviceConnectionErrorType.UNSUPPORTED_DEVICE).toBe('unsupported_device');
      expect(DeviceConnectionErrorType.AUTHENTICATION_FAILED).toBe('authentication_failed');
      expect(DeviceConnectionErrorType.SYNC_FAILED).toBe('sync_failed');
      expect(DeviceConnectionErrorType.ALREADY_CONNECTED).toBe('already_connected');
      expect(DeviceConnectionErrorType.UNEXPECTED_DISCONNECT).toBe('unexpected_disconnect');
      expect(DeviceConnectionErrorType.MAX_DEVICES_REACHED).toBe('max_devices_reached');
    });

    it('should define all required FHIRIntegrationErrorType values', () => {
      expect(Object.keys(FHIRIntegrationErrorType)).toHaveLength(8);
      expect(FHIRIntegrationErrorType.RESOURCE_VALIDATION_FAILED).toBe('resource_validation_failed');
      expect(FHIRIntegrationErrorType.RESOURCE_NOT_FOUND).toBe('resource_not_found');
      expect(FHIRIntegrationErrorType.CONNECTION_FAILED).toBe('connection_failed');
      expect(FHIRIntegrationErrorType.UNSUPPORTED_OPERATION).toBe('unsupported_operation');
      expect(FHIRIntegrationErrorType.AUTHENTICATION_FAILED).toBe('authentication_failed');
      expect(FHIRIntegrationErrorType.MAPPING_FAILED).toBe('mapping_failed');
      expect(FHIRIntegrationErrorType.REQUEST_TIMEOUT).toBe('request_timeout');
      expect(FHIRIntegrationErrorType.SERVER_ERROR).toBe('server_error');
    });
  });

  describe('Error Code Constants', () => {
    it('should define all Health Metrics error codes with correct prefix', () => {
      const errorCodes = Object.values(HEALTH_METRICS_ERROR_CODES);
      expect(errorCodes).toHaveLength(8);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^HEALTH_METRICS_\d{3}$/);
      });
    });

    it('should define all Health Goals error codes with correct prefix', () => {
      const errorCodes = Object.values(HEALTH_GOALS_ERROR_CODES);
      expect(errorCodes).toHaveLength(8);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^HEALTH_GOALS_\d{3}$/);
      });
    });

    it('should define all Health Insights error codes with correct prefix', () => {
      const errorCodes = Object.values(HEALTH_INSIGHTS_ERROR_CODES);
      expect(errorCodes).toHaveLength(6);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^HEALTH_INSIGHTS_\d{3}$/);
      });
    });

    it('should define all Health Device error codes with correct prefix', () => {
      const errorCodes = Object.values(HEALTH_DEVICE_ERROR_CODES);
      expect(errorCodes).toHaveLength(8);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^HEALTH_DEVICE_\d{3}$/);
      });
    });

    it('should define all Health FHIR error codes with correct prefix', () => {
      const errorCodes = Object.values(HEALTH_FHIR_ERROR_CODES);
      expect(errorCodes).toHaveLength(8);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^HEALTH_FHIR_\d{3}$/);
      });
    });

    it('should have unique error codes across all Health domains', () => {
      const allCodes = [
        ...Object.values(HEALTH_METRICS_ERROR_CODES),
        ...Object.values(HEALTH_GOALS_ERROR_CODES),
        ...Object.values(HEALTH_INSIGHTS_ERROR_CODES),
        ...Object.values(HEALTH_DEVICE_ERROR_CODES),
        ...Object.values(HEALTH_FHIR_ERROR_CODES)
      ];
      
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBe(allCodes.length);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify Health Metrics error codes', () => {
      Object.values(HEALTH_METRICS_ERROR_CODES).forEach(code => {
        expect(isHealthMetricsErrorCode(code)).toBe(true);
        expect(isHealthGoalsErrorCode(code)).toBe(false);
        expect(isHealthInsightsErrorCode(code)).toBe(false);
        expect(isHealthDeviceErrorCode(code)).toBe(false);
        expect(isHealthFHIRErrorCode(code)).toBe(false);
        expect(isHealthErrorCode(code)).toBe(true);
      });
    });

    it('should correctly identify Health Goals error codes', () => {
      Object.values(HEALTH_GOALS_ERROR_CODES).forEach(code => {
        expect(isHealthMetricsErrorCode(code)).toBe(false);
        expect(isHealthGoalsErrorCode(code)).toBe(true);
        expect(isHealthInsightsErrorCode(code)).toBe(false);
        expect(isHealthDeviceErrorCode(code)).toBe(false);
        expect(isHealthFHIRErrorCode(code)).toBe(false);
        expect(isHealthErrorCode(code)).toBe(true);
      });
    });

    it('should correctly identify Health Insights error codes', () => {
      Object.values(HEALTH_INSIGHTS_ERROR_CODES).forEach(code => {
        expect(isHealthMetricsErrorCode(code)).toBe(false);
        expect(isHealthGoalsErrorCode(code)).toBe(false);
        expect(isHealthInsightsErrorCode(code)).toBe(true);
        expect(isHealthDeviceErrorCode(code)).toBe(false);
        expect(isHealthFHIRErrorCode(code)).toBe(false);
        expect(isHealthErrorCode(code)).toBe(true);
      });
    });

    it('should correctly identify Health Device error codes', () => {
      Object.values(HEALTH_DEVICE_ERROR_CODES).forEach(code => {
        expect(isHealthMetricsErrorCode(code)).toBe(false);
        expect(isHealthGoalsErrorCode(code)).toBe(false);
        expect(isHealthInsightsErrorCode(code)).toBe(false);
        expect(isHealthDeviceErrorCode(code)).toBe(true);
        expect(isHealthFHIRErrorCode(code)).toBe(false);
        expect(isHealthErrorCode(code)).toBe(true);
      });
    });

    it('should correctly identify Health FHIR error codes', () => {
      Object.values(HEALTH_FHIR_ERROR_CODES).forEach(code => {
        expect(isHealthMetricsErrorCode(code)).toBe(false);
        expect(isHealthGoalsErrorCode(code)).toBe(false);
        expect(isHealthInsightsErrorCode(code)).toBe(false);
        expect(isHealthDeviceErrorCode(code)).toBe(false);
        expect(isHealthFHIRErrorCode(code)).toBe(true);
        expect(isHealthErrorCode(code)).toBe(true);
      });
    });

    it('should reject non-Health error codes', () => {
      const nonHealthCodes = [
        'CARE_APPOINTMENT_001',
        'PLAN_BENEFITS_002',
        'AUTH_003',
        'UNKNOWN_CODE',
        '',
        null,
        undefined
      ];

      nonHealthCodes.forEach(code => {
        expect(isHealthMetricsErrorCode(code as any)).toBe(false);
        expect(isHealthGoalsErrorCode(code as any)).toBe(false);
        expect(isHealthInsightsErrorCode(code as any)).toBe(false);
        expect(isHealthDeviceErrorCode(code as any)).toBe(false);
        expect(isHealthFHIRErrorCode(code as any)).toBe(false);
        expect(isHealthErrorCode(code as any)).toBe(false);
      });
    });
  });

  describe('Error Code Mapping Functions', () => {
    it('should map Health Metrics error types to correct error codes', () => {
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.INVALID_METRIC_DATA))
        .toBe(HEALTH_METRICS_ERROR_CODES.INVALID_METRIC_DATA);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.UNSUPPORTED_METRIC_TYPE))
        .toBe(HEALTH_METRICS_ERROR_CODES.UNSUPPORTED_METRIC_TYPE);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.DUPLICATE_METRIC))
        .toBe(HEALTH_METRICS_ERROR_CODES.DUPLICATE_METRIC);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.METRIC_NOT_FOUND))
        .toBe(HEALTH_METRICS_ERROR_CODES.METRIC_NOT_FOUND);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.INVALID_DATE_RANGE))
        .toBe(HEALTH_METRICS_ERROR_CODES.INVALID_DATE_RANGE);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.THRESHOLD_EXCEEDED))
        .toBe(HEALTH_METRICS_ERROR_CODES.THRESHOLD_EXCEEDED);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.THRESHOLD_NOT_MET))
        .toBe(HEALTH_METRICS_ERROR_CODES.THRESHOLD_NOT_MET);
      expect(getHealthMetricsErrorCode(HealthMetricsErrorType.PROCESSING_FAILED))
        .toBe(HEALTH_METRICS_ERROR_CODES.PROCESSING_FAILED);
    });

    it('should throw for unknown Health Metrics error types', () => {
      expect(() => getHealthMetricsErrorCode('unknown_type' as any))
        .toThrow('Unknown Health Metrics error type: unknown_type');
    });

    it('should map Health Goals error types to correct error codes', () => {
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.INVALID_GOAL))
        .toBe(HEALTH_GOALS_ERROR_CODES.INVALID_GOAL);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.DUPLICATE_GOAL))
        .toBe(HEALTH_GOALS_ERROR_CODES.DUPLICATE_GOAL);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.GOAL_NOT_FOUND))
        .toBe(HEALTH_GOALS_ERROR_CODES.GOAL_NOT_FOUND);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.INVALID_TARGET))
        .toBe(HEALTH_GOALS_ERROR_CODES.INVALID_TARGET);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.INVALID_DEADLINE))
        .toBe(HEALTH_GOALS_ERROR_CODES.INVALID_DEADLINE);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.PROGRESS_CALCULATION_FAILED))
        .toBe(HEALTH_GOALS_ERROR_CODES.PROGRESS_CALCULATION_FAILED);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.UPDATE_FAILED))
        .toBe(HEALTH_GOALS_ERROR_CODES.UPDATE_FAILED);
      expect(getHealthGoalsErrorCode(HealthGoalsErrorType.MAX_GOALS_REACHED))
        .toBe(HEALTH_GOALS_ERROR_CODES.MAX_GOALS_REACHED);
    });

    it('should map Health Insights error types to correct error codes', () => {
      expect(getHealthInsightsErrorCode(HealthInsightsErrorType.GENERATION_FAILED))
        .toBe(HEALTH_INSIGHTS_ERROR_CODES.GENERATION_FAILED);
      expect(getHealthInsightsErrorCode(HealthInsightsErrorType.INSUFFICIENT_DATA))
        .toBe(HEALTH_INSIGHTS_ERROR_CODES.INSUFFICIENT_DATA);
      expect(getHealthInsightsErrorCode(HealthInsightsErrorType.INSIGHT_NOT_FOUND))
        .toBe(HEALTH_INSIGHTS_ERROR_CODES.INSIGHT_NOT_FOUND);
      expect(getHealthInsightsErrorCode(HealthInsightsErrorType.UNSUPPORTED_TYPE))
        .toBe(HEALTH_INSIGHTS_ERROR_CODES.UNSUPPORTED_TYPE);
      expect(getHealthInsightsErrorCode(HealthInsightsErrorType.PROCESSING_TIMEOUT))
        .toBe(HEALTH_INSIGHTS_ERROR_CODES.PROCESSING_TIMEOUT);
      expect(getHealthInsightsErrorCode(HealthInsightsErrorType.ALGORITHM_ERROR))
        .toBe(HEALTH_INSIGHTS_ERROR_CODES.ALGORITHM_ERROR);
    });

    it('should map Device Connection error types to correct error codes', () => {
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.CONNECTION_FAILED))
        .toBe(HEALTH_DEVICE_ERROR_CODES.CONNECTION_FAILED);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.DEVICE_NOT_FOUND))
        .toBe(HEALTH_DEVICE_ERROR_CODES.DEVICE_NOT_FOUND);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.UNSUPPORTED_DEVICE))
        .toBe(HEALTH_DEVICE_ERROR_CODES.UNSUPPORTED_DEVICE);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.AUTHENTICATION_FAILED))
        .toBe(HEALTH_DEVICE_ERROR_CODES.AUTHENTICATION_FAILED);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.SYNC_FAILED))
        .toBe(HEALTH_DEVICE_ERROR_CODES.SYNC_FAILED);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.ALREADY_CONNECTED))
        .toBe(HEALTH_DEVICE_ERROR_CODES.ALREADY_CONNECTED);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.UNEXPECTED_DISCONNECT))
        .toBe(HEALTH_DEVICE_ERROR_CODES.UNEXPECTED_DISCONNECT);
      expect(getHealthDeviceErrorCode(DeviceConnectionErrorType.MAX_DEVICES_REACHED))
        .toBe(HEALTH_DEVICE_ERROR_CODES.MAX_DEVICES_REACHED);
    });

    it('should map FHIR Integration error types to correct error codes', () => {
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.RESOURCE_VALIDATION_FAILED))
        .toBe(HEALTH_FHIR_ERROR_CODES.RESOURCE_VALIDATION_FAILED);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.RESOURCE_NOT_FOUND))
        .toBe(HEALTH_FHIR_ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.CONNECTION_FAILED))
        .toBe(HEALTH_FHIR_ERROR_CODES.CONNECTION_FAILED);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.UNSUPPORTED_OPERATION))
        .toBe(HEALTH_FHIR_ERROR_CODES.UNSUPPORTED_OPERATION);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.AUTHENTICATION_FAILED))
        .toBe(HEALTH_FHIR_ERROR_CODES.AUTHENTICATION_FAILED);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.MAPPING_FAILED))
        .toBe(HEALTH_FHIR_ERROR_CODES.MAPPING_FAILED);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.REQUEST_TIMEOUT))
        .toBe(HEALTH_FHIR_ERROR_CODES.REQUEST_TIMEOUT);
      expect(getHealthFHIRErrorCode(FHIRIntegrationErrorType.SERVER_ERROR))
        .toBe(HEALTH_FHIR_ERROR_CODES.SERVER_ERROR);
    });
  });

  describe('Error Type Mapping', () => {
    it('should map validation error codes to VALIDATION error type', () => {
      const validationErrorCodes = [
        HEALTH_METRICS_ERROR_CODES.INVALID_METRIC_DATA,
        HEALTH_METRICS_ERROR_CODES.INVALID_DATE_RANGE,
        HEALTH_GOALS_ERROR_CODES.INVALID_GOAL,
        HEALTH_GOALS_ERROR_CODES.INVALID_TARGET,
        HEALTH_GOALS_ERROR_CODES.INVALID_DEADLINE,
        HEALTH_FHIR_ERROR_CODES.RESOURCE_VALIDATION_FAILED
      ];

      validationErrorCodes.forEach(code => {
        expect(getErrorTypeFromHealthCode(code)).toBe(ErrorType.VALIDATION);
      });
    });

    it('should map business error codes to BUSINESS error type', () => {
      const businessErrorCodes = [
        HEALTH_METRICS_ERROR_CODES.DUPLICATE_METRIC,
        HEALTH_METRICS_ERROR_CODES.METRIC_NOT_FOUND,
        HEALTH_METRICS_ERROR_CODES.THRESHOLD_EXCEEDED,
        HEALTH_METRICS_ERROR_CODES.THRESHOLD_NOT_MET,
        HEALTH_GOALS_ERROR_CODES.DUPLICATE_GOAL,
        HEALTH_GOALS_ERROR_CODES.GOAL_NOT_FOUND,
        HEALTH_GOALS_ERROR_CODES.MAX_GOALS_REACHED,
        HEALTH_INSIGHTS_ERROR_CODES.INSUFFICIENT_DATA,
        HEALTH_INSIGHTS_ERROR_CODES.INSIGHT_NOT_FOUND,
        HEALTH_DEVICE_ERROR_CODES.DEVICE_NOT_FOUND,
        HEALTH_DEVICE_ERROR_CODES.ALREADY_CONNECTED,
        HEALTH_DEVICE_ERROR_CODES.MAX_DEVICES_REACHED,
        HEALTH_FHIR_ERROR_CODES.RESOURCE_NOT_FOUND
      ];

      businessErrorCodes.forEach(code => {
        expect(getErrorTypeFromHealthCode(code)).toBe(ErrorType.BUSINESS);
      });
    });

    it('should map external system error codes to EXTERNAL error type', () => {
      const externalErrorCodes = [
        HEALTH_DEVICE_ERROR_CODES.CONNECTION_FAILED,
        HEALTH_DEVICE_ERROR_CODES.AUTHENTICATION_FAILED,
        HEALTH_DEVICE_ERROR_CODES.SYNC_FAILED,
        HEALTH_DEVICE_ERROR_CODES.UNEXPECTED_DISCONNECT,
        HEALTH_FHIR_ERROR_CODES.CONNECTION_FAILED,
        HEALTH_FHIR_ERROR_CODES.AUTHENTICATION_FAILED,
        HEALTH_FHIR_ERROR_CODES.REQUEST_TIMEOUT,
        HEALTH_FHIR_ERROR_CODES.SERVER_ERROR
      ];

      externalErrorCodes.forEach(code => {
        expect(getErrorTypeFromHealthCode(code)).toBe(ErrorType.EXTERNAL);
      });
    });

    it('should map technical error codes to TECHNICAL error type', () => {
      const technicalErrorCodes = [
        HEALTH_METRICS_ERROR_CODES.UNSUPPORTED_METRIC_TYPE,
        HEALTH_METRICS_ERROR_CODES.PROCESSING_FAILED,
        HEALTH_GOALS_ERROR_CODES.PROGRESS_CALCULATION_FAILED,
        HEALTH_GOALS_ERROR_CODES.UPDATE_FAILED,
        HEALTH_INSIGHTS_ERROR_CODES.GENERATION_FAILED,
        HEALTH_INSIGHTS_ERROR_CODES.UNSUPPORTED_TYPE,
        HEALTH_INSIGHTS_ERROR_CODES.PROCESSING_TIMEOUT,
        HEALTH_INSIGHTS_ERROR_CODES.ALGORITHM_ERROR,
        HEALTH_DEVICE_ERROR_CODES.UNSUPPORTED_DEVICE,
        HEALTH_FHIR_ERROR_CODES.UNSUPPORTED_OPERATION,
        HEALTH_FHIR_ERROR_CODES.MAPPING_FAILED
      ];

      technicalErrorCodes.forEach(code => {
        expect(getErrorTypeFromHealthCode(code)).toBe(ErrorType.TECHNICAL);
      });
    });
  });
});