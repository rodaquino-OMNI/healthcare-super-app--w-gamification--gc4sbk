import { describe, expect, it } from '@jest/globals';

// Import the types from the Health journey errors module
import {
  HealthErrorType,
  HealthMetricsErrorType,
  HealthGoalsErrorType,
  HealthInsightsErrorType,
  HealthDevicesErrorType,
  HealthFhirErrorType,
  isHealthError,
  isHealthMetricsError,
  isHealthGoalsError,
  isHealthInsightsError,
  isHealthDevicesError,
  isHealthFhirError,
  HEALTH_ERROR_CODE_PREFIX,
  HEALTH_METRICS_ERROR_CODE_PREFIX,
  HEALTH_GOALS_ERROR_CODE_PREFIX,
  HEALTH_INSIGHTS_ERROR_CODE_PREFIX,
  HEALTH_DEVICES_ERROR_CODE_PREFIX,
  HEALTH_FHIR_ERROR_CODE_PREFIX
} from '../../../../src/journey/health/types';

// Import the BaseError and ErrorType for testing
import { BaseError, ErrorType } from '../../../../src/base';

/**
 * Test suite for Health journey error type definitions
 * Verifies error enums, interfaces, and type guards for Health-specific errors
 */
describe('Health Journey Error Types', () => {
  describe('Error Type Enums', () => {
    it('should define the main HealthErrorType enum with all domains', () => {
      // Verify all domains are included in the main enum
      expect(HealthErrorType).toBeDefined();
      expect(HealthErrorType.METRICS).toBeDefined();
      expect(HealthErrorType.GOALS).toBeDefined();
      expect(HealthErrorType.INSIGHTS).toBeDefined();
      expect(HealthErrorType.DEVICES).toBeDefined();
      expect(HealthErrorType.FHIR).toBeDefined();
    });

    it('should define HealthMetricsErrorType with all metric-specific error types', () => {
      expect(HealthMetricsErrorType).toBeDefined();
      expect(HealthMetricsErrorType.INVALID_METRIC_VALUE).toBeDefined();
      expect(HealthMetricsErrorType.METRIC_NOT_FOUND).toBeDefined();
      expect(HealthMetricsErrorType.METRIC_THRESHOLD_EXCEEDED).toBeDefined();
      expect(HealthMetricsErrorType.METRIC_STORAGE_FAILED).toBeDefined();
      expect(HealthMetricsErrorType.METRIC_PROCESSING_FAILED).toBeDefined();
    });

    it('should define HealthGoalsErrorType with all goal-specific error types', () => {
      expect(HealthGoalsErrorType).toBeDefined();
      expect(HealthGoalsErrorType.INVALID_GOAL_PARAMETERS).toBeDefined();
      expect(HealthGoalsErrorType.GOAL_NOT_FOUND).toBeDefined();
      expect(HealthGoalsErrorType.CONFLICTING_GOALS).toBeDefined();
      expect(HealthGoalsErrorType.GOAL_TRACKING_FAILED).toBeDefined();
      expect(HealthGoalsErrorType.GOAL_ACHIEVEMENT_PROCESSING_FAILED).toBeDefined();
    });

    it('should define HealthInsightsErrorType with all insight-specific error types', () => {
      expect(HealthInsightsErrorType).toBeDefined();
      expect(HealthInsightsErrorType.INSUFFICIENT_DATA).toBeDefined();
      expect(HealthInsightsErrorType.PATTERN_RECOGNITION_FAILED).toBeDefined();
      expect(HealthInsightsErrorType.INSIGHT_GENERATION_FAILED).toBeDefined();
      expect(HealthInsightsErrorType.RECOMMENDATION_FAILED).toBeDefined();
      expect(HealthInsightsErrorType.INSIGHT_NOT_FOUND).toBeDefined();
    });

    it('should define HealthDevicesErrorType with all device-specific error types', () => {
      expect(HealthDevicesErrorType).toBeDefined();
      expect(HealthDevicesErrorType.DEVICE_CONNECTION_FAILED).toBeDefined();
      expect(HealthDevicesErrorType.DEVICE_NOT_FOUND).toBeDefined();
      expect(HealthDevicesErrorType.SYNCHRONIZATION_FAILED).toBeDefined();
      expect(HealthDevicesErrorType.DEVICE_COMPATIBILITY_ERROR).toBeDefined();
      expect(HealthDevicesErrorType.DEVICE_AUTHENTICATION_FAILED).toBeDefined();
    });

    it('should define HealthFhirErrorType with all FHIR-specific error types', () => {
      expect(HealthFhirErrorType).toBeDefined();
      expect(HealthFhirErrorType.FHIR_CONNECTION_FAILED).toBeDefined();
      expect(HealthFhirErrorType.INVALID_RESOURCE).toBeDefined();
      expect(HealthFhirErrorType.RESOURCE_NOT_FOUND).toBeDefined();
      expect(HealthFhirErrorType.OPERATION_NOT_SUPPORTED).toBeDefined();
      expect(HealthFhirErrorType.FHIR_PROCESSING_FAILED).toBeDefined();
    });
  });

  describe('Error Code Prefixes', () => {
    it('should define the main HEALTH error code prefix', () => {
      expect(HEALTH_ERROR_CODE_PREFIX).toBeDefined();
      expect(HEALTH_ERROR_CODE_PREFIX).toBe('HEALTH_');
    });

    it('should define domain-specific error code prefixes', () => {
      expect(HEALTH_METRICS_ERROR_CODE_PREFIX).toBeDefined();
      expect(HEALTH_GOALS_ERROR_CODE_PREFIX).toBeDefined();
      expect(HEALTH_INSIGHTS_ERROR_CODE_PREFIX).toBeDefined();
      expect(HEALTH_DEVICES_ERROR_CODE_PREFIX).toBeDefined();
      expect(HEALTH_FHIR_ERROR_CODE_PREFIX).toBeDefined();

      // Verify prefixes follow the pattern HEALTH_DOMAIN_
      expect(HEALTH_METRICS_ERROR_CODE_PREFIX).toBe('HEALTH_METRICS_');
      expect(HEALTH_GOALS_ERROR_CODE_PREFIX).toBe('HEALTH_GOALS_');
      expect(HEALTH_INSIGHTS_ERROR_CODE_PREFIX).toBe('HEALTH_INSIGHTS_');
      expect(HEALTH_DEVICES_ERROR_CODE_PREFIX).toBe('HEALTH_DEVICES_');
      expect(HEALTH_FHIR_ERROR_CODE_PREFIX).toBe('HEALTH_FHIR_');
    });
  });

  describe('Type Guards', () => {
    // Create sample errors for testing type guards
    const createHealthMetricsError = () => new BaseError({
      message: 'Invalid metric value',
      type: ErrorType.VALIDATION,
      code: 'HEALTH_METRICS_INVALID_VALUE',
      details: { healthErrorType: HealthErrorType.METRICS, metricErrorType: HealthMetricsErrorType.INVALID_METRIC_VALUE }
    });

    const createHealthGoalsError = () => new BaseError({
      message: 'Goal not found',
      type: ErrorType.BUSINESS,
      code: 'HEALTH_GOALS_NOT_FOUND',
      details: { healthErrorType: HealthErrorType.GOALS, goalErrorType: HealthGoalsErrorType.GOAL_NOT_FOUND }
    });

    const createHealthInsightsError = () => new BaseError({
      message: 'Insufficient data for insight',
      type: ErrorType.BUSINESS,
      code: 'HEALTH_INSIGHTS_INSUFFICIENT_DATA',
      details: { healthErrorType: HealthErrorType.INSIGHTS, insightErrorType: HealthInsightsErrorType.INSUFFICIENT_DATA }
    });

    const createHealthDevicesError = () => new BaseError({
      message: 'Device connection failed',
      type: ErrorType.EXTERNAL,
      code: 'HEALTH_DEVICES_CONNECTION_FAILED',
      details: { healthErrorType: HealthErrorType.DEVICES, deviceErrorType: HealthDevicesErrorType.DEVICE_CONNECTION_FAILED }
    });

    const createHealthFhirError = () => new BaseError({
      message: 'Invalid FHIR resource',
      type: ErrorType.VALIDATION,
      code: 'HEALTH_FHIR_INVALID_RESOURCE',
      details: { healthErrorType: HealthErrorType.FHIR, fhirErrorType: HealthFhirErrorType.INVALID_RESOURCE }
    });

    const createNonHealthError = () => new BaseError({
      message: 'Generic error',
      type: ErrorType.TECHNICAL,
      code: 'GENERIC_ERROR'
    });

    it('should correctly identify Health errors with isHealthError', () => {
      expect(isHealthError(createHealthMetricsError())).toBe(true);
      expect(isHealthError(createHealthGoalsError())).toBe(true);
      expect(isHealthError(createHealthInsightsError())).toBe(true);
      expect(isHealthError(createHealthDevicesError())).toBe(true);
      expect(isHealthError(createHealthFhirError())).toBe(true);
      expect(isHealthError(createNonHealthError())).toBe(false);
      expect(isHealthError(new Error('Standard error'))).toBe(false);
      expect(isHealthError(null)).toBe(false);
      expect(isHealthError(undefined)).toBe(false);
    });

    it('should correctly identify Health Metrics errors with isHealthMetricsError', () => {
      expect(isHealthMetricsError(createHealthMetricsError())).toBe(true);
      expect(isHealthMetricsError(createHealthGoalsError())).toBe(false);
      expect(isHealthMetricsError(createHealthInsightsError())).toBe(false);
      expect(isHealthMetricsError(createHealthDevicesError())).toBe(false);
      expect(isHealthMetricsError(createHealthFhirError())).toBe(false);
      expect(isHealthMetricsError(createNonHealthError())).toBe(false);
    });

    it('should correctly identify Health Goals errors with isHealthGoalsError', () => {
      expect(isHealthGoalsError(createHealthMetricsError())).toBe(false);
      expect(isHealthGoalsError(createHealthGoalsError())).toBe(true);
      expect(isHealthGoalsError(createHealthInsightsError())).toBe(false);
      expect(isHealthGoalsError(createHealthDevicesError())).toBe(false);
      expect(isHealthGoalsError(createHealthFhirError())).toBe(false);
      expect(isHealthGoalsError(createNonHealthError())).toBe(false);
    });

    it('should correctly identify Health Insights errors with isHealthInsightsError', () => {
      expect(isHealthInsightsError(createHealthMetricsError())).toBe(false);
      expect(isHealthInsightsError(createHealthGoalsError())).toBe(false);
      expect(isHealthInsightsError(createHealthInsightsError())).toBe(true);
      expect(isHealthInsightsError(createHealthDevicesError())).toBe(false);
      expect(isHealthInsightsError(createHealthFhirError())).toBe(false);
      expect(isHealthInsightsError(createNonHealthError())).toBe(false);
    });

    it('should correctly identify Health Devices errors with isHealthDevicesError', () => {
      expect(isHealthDevicesError(createHealthMetricsError())).toBe(false);
      expect(isHealthDevicesError(createHealthGoalsError())).toBe(false);
      expect(isHealthDevicesError(createHealthInsightsError())).toBe(false);
      expect(isHealthDevicesError(createHealthDevicesError())).toBe(true);
      expect(isHealthDevicesError(createHealthFhirError())).toBe(false);
      expect(isHealthDevicesError(createNonHealthError())).toBe(false);
    });

    it('should correctly identify Health FHIR errors with isHealthFhirError', () => {
      expect(isHealthFhirError(createHealthMetricsError())).toBe(false);
      expect(isHealthFhirError(createHealthGoalsError())).toBe(false);
      expect(isHealthFhirError(createHealthInsightsError())).toBe(false);
      expect(isHealthFhirError(createHealthDevicesError())).toBe(false);
      expect(isHealthFhirError(createHealthFhirError())).toBe(true);
      expect(isHealthFhirError(createNonHealthError())).toBe(false);
    });
  });

  describe('Error Code Pattern Validation', () => {
    it('should validate that error codes follow the correct pattern', () => {
      // Create a mock error with a valid Health error code
      const validHealthError = new BaseError({
        message: 'Valid health error',
        type: ErrorType.BUSINESS,
        code: 'HEALTH_METRICS_INVALID_VALUE'
      });

      // Create a mock error with an invalid Health error code
      const invalidHealthError = new BaseError({
        message: 'Invalid health error',
        type: ErrorType.BUSINESS,
        code: 'INVALID_CODE_FORMAT'
      });

      // Test the isHealthError function with these errors
      expect(isHealthError(validHealthError)).toBe(true);
      expect(isHealthError(invalidHealthError)).toBe(false);
    });

    it('should validate domain-specific error code patterns', () => {
      // Create mock errors with valid domain-specific error codes
      const validMetricsError = new BaseError({
        message: 'Valid metrics error',
        type: ErrorType.VALIDATION,
        code: 'HEALTH_METRICS_INVALID_VALUE'
      });

      const validGoalsError = new BaseError({
        message: 'Valid goals error',
        type: ErrorType.BUSINESS,
        code: 'HEALTH_GOALS_NOT_FOUND'
      });

      const validInsightsError = new BaseError({
        message: 'Valid insights error',
        type: ErrorType.BUSINESS,
        code: 'HEALTH_INSIGHTS_INSUFFICIENT_DATA'
      });

      const validDevicesError = new BaseError({
        message: 'Valid devices error',
        type: ErrorType.EXTERNAL,
        code: 'HEALTH_DEVICES_CONNECTION_FAILED'
      });

      const validFhirError = new BaseError({
        message: 'Valid FHIR error',
        type: ErrorType.VALIDATION,
        code: 'HEALTH_FHIR_INVALID_RESOURCE'
      });

      // Test the domain-specific type guards with these errors
      expect(isHealthMetricsError(validMetricsError)).toBe(true);
      expect(isHealthGoalsError(validGoalsError)).toBe(true);
      expect(isHealthInsightsError(validInsightsError)).toBe(true);
      expect(isHealthDevicesError(validDevicesError)).toBe(true);
      expect(isHealthFhirError(validFhirError)).toBe(true);

      // Cross-check to ensure domain-specific guards don't match other domains
      expect(isHealthMetricsError(validGoalsError)).toBe(false);
      expect(isHealthGoalsError(validInsightsError)).toBe(false);
      expect(isHealthInsightsError(validDevicesError)).toBe(false);
      expect(isHealthDevicesError(validFhirError)).toBe(false);
      expect(isHealthFhirError(validMetricsError)).toBe(false);
    });
  });
});