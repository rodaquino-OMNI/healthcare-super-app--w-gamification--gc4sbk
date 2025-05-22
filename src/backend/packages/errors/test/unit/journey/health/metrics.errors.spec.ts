import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  HealthMetricsError,
  InvalidMetricValueError,
  MetricThresholdExceededError,
  ConflictingMetricsError,
  MetricProcessingError,
  MetricSourceError,
  MetricSynchronizationError,
  MetricGoalValidationError
} from '../../../../src/journey/health/metrics.errors';

describe('Health Metrics Error Classes', () => {
  describe('HealthMetricsError', () => {
    it('should be defined', () => {
      expect(HealthMetricsError).toBeDefined();
    });

    it('should set name to the constructor name', () => {
      // Create a concrete implementation for testing
      class TestHealthMetricsError extends HealthMetricsError {
        constructor() {
          super('Test error', ErrorType.VALIDATION, 'HEALTH_METRICS_TEST', {});
        }
      }
      
      const error = new TestHealthMetricsError();
      expect(error.name).toBe('TestHealthMetricsError');
    });

    it('should ensure proper prototype chain for instanceof checks', () => {
      // Create a concrete implementation for testing
      class TestHealthMetricsError extends HealthMetricsError {
        constructor() {
          super('Test error', ErrorType.VALIDATION, 'HEALTH_METRICS_TEST', {});
        }
      }
      
      const error = new TestHealthMetricsError();
      expect(error instanceof HealthMetricsError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('InvalidMetricValueError', () => {
    const metricType = 'heart_rate';
    const value = 'not a number';
    const expectedFormat = 'numeric value between 40-200';
    const details = { userId: '123' };
    const cause = new Error('Original error');
    
    let error: InvalidMetricValueError;
    
    beforeEach(() => {
      error = new InvalidMetricValueError(metricType, value, expectedFormat, details, cause);
    });
    
    it('should be defined', () => {
      expect(InvalidMetricValueError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use VALIDATION error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_INVALID_VALUE');
    });
    
    it('should include metric context in error details', () => {
      expect(error.details).toEqual({
        metricType,
        value,
        expectedFormat,
        userId: '123'
      });
    });
    
    it('should format error message with context information', () => {
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(String(value));
      expect(error.message).toContain(expectedFormat);
    });
    
    it('should store metric-specific properties', () => {
      expect(error.metricType).toBe(metricType);
      expect(error.value).toBe(value);
      expect(error.expectedFormat).toBe(expectedFormat);
    });
    
    it('should map to HTTP 400 Bad Request status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
    
    it('should preserve the original cause', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('MetricThresholdExceededError', () => {
    const metricType = 'blood_pressure';
    const value = '180/110';
    const threshold = '140/90';
    const thresholdType = 'upper' as const;
    const details = { severity: 'high' };
    const cause = new Error('Original error');
    
    let error: MetricThresholdExceededError;
    
    beforeEach(() => {
      error = new MetricThresholdExceededError(metricType, value, threshold, thresholdType, details, cause);
    });
    
    it('should be defined', () => {
      expect(MetricThresholdExceededError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_THRESHOLD_EXCEEDED');
    });
    
    it('should include threshold context in error details', () => {
      expect(error.details).toEqual({
        metricType,
        value,
        threshold,
        thresholdType,
        severity: 'high'
      });
    });
    
    it('should format error message with threshold information', () => {
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(String(value));
      expect(error.message).toContain(String(threshold));
      expect(error.message).toContain(thresholdType);
    });
    
    it('should store threshold-specific properties', () => {
      expect(error.metricType).toBe(metricType);
      expect(error.value).toBe(value);
      expect(error.threshold).toBe(threshold);
      expect(error.thresholdType).toBe(thresholdType);
    });
    
    it('should map to HTTP 422 Unprocessable Entity status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('ConflictingMetricsError', () => {
    const metricType = 'weight';
    const conflictReason = 'Multiple weight entries for the same timestamp';
    const conflictingMetrics = [
      { value: 70.5, timestamp: '2023-01-01T10:00:00Z', source: 'manual' },
      { value: 71.2, timestamp: '2023-01-01T10:00:00Z', source: 'fitbit' }
    ];
    const details = { userId: '123' };
    
    let error: ConflictingMetricsError;
    
    beforeEach(() => {
      error = new ConflictingMetricsError(metricType, conflictReason, conflictingMetrics, details);
    });
    
    it('should be defined', () => {
      expect(ConflictingMetricsError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_CONFLICT');
    });
    
    it('should include conflict context in error details', () => {
      expect(error.details).toEqual({
        metricType,
        conflictReason,
        conflictingMetrics,
        userId: '123'
      });
    });
    
    it('should format error message with conflict information', () => {
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(conflictReason);
    });
    
    it('should store conflict-specific properties', () => {
      expect(error.metricType).toBe(metricType);
      expect(error.conflictReason).toBe(conflictReason);
      expect(error.conflictingMetrics).toBe(conflictingMetrics);
    });
    
    it('should map to HTTP 422 Unprocessable Entity status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('MetricProcessingError', () => {
    const metricType = 'steps';
    const operation = 'store';
    const reason = 'Database connection failed';
    const details = { attemptCount: 3 };
    const cause = new Error('Database error');
    
    let error: MetricProcessingError;
    
    beforeEach(() => {
      error = new MetricProcessingError(metricType, operation, reason, details, cause);
    });
    
    it('should be defined', () => {
      expect(MetricProcessingError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_PROCESSING_FAILED');
    });
    
    it('should include processing context in error details', () => {
      expect(error.details).toEqual({
        metricType,
        operation,
        reason,
        attemptCount: 3
      });
    });
    
    it('should format error message with processing information', () => {
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(operation);
      expect(error.message).toContain(reason);
    });
    
    it('should store processing-specific properties', () => {
      expect(error.metricType).toBe(metricType);
      expect(error.operation).toBe(operation);
      expect(error.reason).toBe(reason);
    });
    
    it('should map to HTTP 500 Internal Server Error status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
    
    it('should preserve the original cause', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('MetricSourceError', () => {
    const source = 'fitbit';
    const metricType = 'heart_rate';
    const errorCode = 'API_RATE_LIMIT_EXCEEDED';
    const reason = 'Too many requests to Fitbit API';
    const details = { retryAfter: 3600 };
    const cause = new Error('API error');
    
    let error: MetricSourceError;
    
    beforeEach(() => {
      error = new MetricSourceError(source, metricType, errorCode, reason, details, cause);
    });
    
    it('should be defined', () => {
      expect(MetricSourceError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use EXTERNAL error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_SOURCE_FAILED');
    });
    
    it('should include source context in error details', () => {
      expect(error.details).toEqual({
        source,
        metricType,
        errorCode,
        reason,
        retryAfter: 3600
      });
    });
    
    it('should format error message with source information', () => {
      expect(error.message).toContain(source);
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(reason);
    });
    
    it('should store source-specific properties', () => {
      expect(error.source).toBe(source);
      expect(error.metricType).toBe(metricType);
      expect(error.errorCode).toBe(errorCode);
      expect(error.reason).toBe(reason);
    });
    
    it('should map to HTTP 502 Bad Gateway status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
    
    it('should handle null errorCode', () => {
      const errorWithNullCode = new MetricSourceError(source, metricType, null, reason);
      expect(errorWithNullCode.errorCode).toBeNull();
      expect(errorWithNullCode.details.errorCode).toBeNull();
    });
  });

  describe('MetricSynchronizationError', () => {
    const source = 'apple_health';
    const metricType = 'steps';
    const syncDirection = 'import' as const;
    const reason = 'Permission denied by user';
    const details = { lastSyncAttempt: '2023-01-01T10:00:00Z' };
    
    let error: MetricSynchronizationError;
    
    beforeEach(() => {
      error = new MetricSynchronizationError(source, metricType, syncDirection, reason, details);
    });
    
    it('should be defined', () => {
      expect(MetricSynchronizationError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use EXTERNAL error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_SYNC_FAILED');
    });
    
    it('should include synchronization context in error details', () => {
      expect(error.details).toEqual({
        source,
        metricType,
        syncDirection,
        reason,
        lastSyncAttempt: '2023-01-01T10:00:00Z'
      });
    });
    
    it('should format error message with synchronization information', () => {
      expect(error.message).toContain(source);
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(reason);
      expect(error.message).toContain('import');
      expect(error.message).toContain('from');
    });
    
    it('should store synchronization-specific properties', () => {
      expect(error.source).toBe(source);
      expect(error.metricType).toBe(metricType);
      expect(error.syncDirection).toBe(syncDirection);
      expect(error.reason).toBe(reason);
    });
    
    it('should map to HTTP 502 Bad Gateway status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
    
    it('should format message correctly for export direction', () => {
      const exportError = new MetricSynchronizationError(source, metricType, 'export', reason);
      expect(exportError.message).toContain('export');
      expect(exportError.message).toContain('to');
    });
    
    it('should format message correctly for bidirectional sync', () => {
      const bidirectionalError = new MetricSynchronizationError(source, metricType, 'bidirectional', reason);
      expect(bidirectionalError.message).toContain('sync');
      expect(bidirectionalError.message).toContain('with');
    });
  });

  describe('MetricGoalValidationError', () => {
    const metricType = 'steps';
    const goalValue = -1000;
    const validationIssue = 'Goal value must be positive';
    const details = { recommendedRange: '1000-10000' };
    
    let error: MetricGoalValidationError;
    
    beforeEach(() => {
      error = new MetricGoalValidationError(metricType, goalValue, validationIssue, details);
    });
    
    it('should be defined', () => {
      expect(MetricGoalValidationError).toBeDefined();
    });
    
    it('should extend HealthMetricsError', () => {
      expect(error instanceof HealthMetricsError).toBe(true);
    });
    
    it('should use VALIDATION error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });
    
    it('should use HEALTH_METRICS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error.code).toBe('HEALTH_METRICS_GOAL_INVALID');
    });
    
    it('should include goal validation context in error details', () => {
      expect(error.details).toEqual({
        metricType,
        goalValue,
        validationIssue,
        recommendedRange: '1000-10000'
      });
    });
    
    it('should format error message with goal validation information', () => {
      expect(error.message).toContain(metricType);
      expect(error.message).toContain(String(goalValue));
      expect(error.message).toContain(validationIssue);
    });
    
    it('should store goal validation-specific properties', () => {
      expect(error.metricType).toBe(metricType);
      expect(error.goalValue).toBe(goalValue);
      expect(error.validationIssue).toBe(validationIssue);
    });
    
    it('should map to HTTP 400 Bad Request status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});