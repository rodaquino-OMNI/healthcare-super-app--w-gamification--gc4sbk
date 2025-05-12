import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the error classes and types
import { ErrorType } from '../../../../src/types';
import { BaseError } from '../../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';
import {
  InvalidMetricValueError,
  MetricThresholdExceededError,
  MetricNotFoundError,
  ConflictingMetricsError,
  MetricProcessingError,
  MetricSyncError
} from '../../../../src/journey/health/metrics.errors';

/**
 * Test suite for Health Metrics error classes
 * Validates that metric-specific errors properly implement HEALTH_METRICS_ prefixed error codes,
 * include metrics context (types, values, thresholds), and follow the error classification system
 * with appropriate error handling and recovery strategies.
 */
describe('Health Metrics Errors', () => {
  // Sample metric data for testing
  const metricType = 'bloodPressure';
  const metricValue = '180/110';
  const metricThreshold = '140/90';
  const metricId = 'metric-123';
  const userId = 'user-456';
  
  describe('InvalidMetricValueError', () => {
    it('should create error with HEALTH_METRICS_ prefixed error code', () => {
      const error = new InvalidMetricValueError({
        metricType,
        value: metricValue,
        expectedFormat: 'systolic/diastolic'
      });

      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof InvalidMetricValueError).toBe(true);
    });

    it('should include metric context in error details', () => {
      const error = new InvalidMetricValueError({
        metricType,
        value: metricValue,
        expectedFormat: 'systolic/diastolic'
      });

      expect(error.details).toBeDefined();
      expect(error.details.metricType).toBe(metricType);
      expect(error.details.value).toBe(metricValue);
      expect(error.details.expectedFormat).toBe('systolic/diastolic');
    });

    it('should be classified as a VALIDATION error type', () => {
      const error = new InvalidMetricValueError({
        metricType,
        value: metricValue,
        expectedFormat: 'systolic/diastolic'
      });

      expect(error.type).toBe(ErrorType.VALIDATION);
      
      // Should map to appropriate HTTP status code for validation errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.VALIDATION);
    });

    it('should generate appropriate error message with context', () => {
      const error = new InvalidMetricValueError({
        metricType,
        value: metricValue,
        expectedFormat: 'systolic/diastolic'
      });

      expect(error.message).toContain(metricType);
      expect(error.message).toContain(metricValue);
    });
  });

  describe('MetricThresholdExceededError', () => {
    it('should create error with HEALTH_METRICS_ prefixed error code', () => {
      const error = new MetricThresholdExceededError({
        metricType,
        value: metricValue,
        threshold: metricThreshold,
        userId
      });

      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof MetricThresholdExceededError).toBe(true);
    });

    it('should include threshold context in error details', () => {
      const error = new MetricThresholdExceededError({
        metricType,
        value: metricValue,
        threshold: metricThreshold,
        userId
      });

      expect(error.details).toBeDefined();
      expect(error.details.metricType).toBe(metricType);
      expect(error.details.value).toBe(metricValue);
      expect(error.details.threshold).toBe(metricThreshold);
      expect(error.details.userId).toBe(userId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new MetricThresholdExceededError({
        metricType,
        value: metricValue,
        threshold: metricThreshold,
        userId
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Should map to appropriate HTTP status code for business errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should include user context in error context', () => {
      const error = new MetricThresholdExceededError({
        metricType,
        value: metricValue,
        threshold: metricThreshold,
        userId
      });

      expect(error.context).toBeDefined();
      expect(error.context.userId).toBe(userId);
      expect(error.context.journeyContext).toBe('health');
    });
  });

  describe('MetricNotFoundError', () => {
    it('should create error with HEALTH_METRICS_ prefixed error code', () => {
      const error = new MetricNotFoundError({
        metricId,
        metricType,
        userId
      });

      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof MetricNotFoundError).toBe(true);
    });

    it('should include metric identifier context in error details', () => {
      const error = new MetricNotFoundError({
        metricId,
        metricType,
        userId
      });

      expect(error.details).toBeDefined();
      expect(error.details.metricId).toBe(metricId);
      expect(error.details.metricType).toBe(metricType);
      expect(error.details.userId).toBe(userId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new MetricNotFoundError({
        metricId,
        metricType,
        userId
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Should map to appropriate HTTP status code for business errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
  });

  describe('ConflictingMetricsError', () => {
    it('should create error with HEALTH_METRICS_ prefixed error code', () => {
      const error = new ConflictingMetricsError({
        metricType,
        conflictingMetricIds: ['metric-123', 'metric-456'],
        userId
      });

      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ConflictingMetricsError).toBe(true);
    });

    it('should include conflict context in error details', () => {
      const conflictingMetricIds = ['metric-123', 'metric-456'];
      const error = new ConflictingMetricsError({
        metricType,
        conflictingMetricIds,
        userId
      });

      expect(error.details).toBeDefined();
      expect(error.details.metricType).toBe(metricType);
      expect(error.details.conflictingMetricIds).toEqual(conflictingMetricIds);
      expect(error.details.userId).toBe(userId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new ConflictingMetricsError({
        metricType,
        conflictingMetricIds: ['metric-123', 'metric-456'],
        userId
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Should map to appropriate HTTP status code for business errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
  });

  describe('MetricProcessingError', () => {
    it('should create error with HEALTH_METRICS_ prefixed error code', () => {
      const error = new MetricProcessingError({
        metricType,
        operation: 'aggregation',
        reason: 'Insufficient data points'
      });

      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof MetricProcessingError).toBe(true);
    });

    it('should include processing context in error details', () => {
      const error = new MetricProcessingError({
        metricType,
        operation: 'aggregation',
        reason: 'Insufficient data points'
      });

      expect(error.details).toBeDefined();
      expect(error.details.metricType).toBe(metricType);
      expect(error.details.operation).toBe('aggregation');
      expect(error.details.reason).toBe('Insufficient data points');
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new MetricProcessingError({
        metricType,
        operation: 'aggregation',
        reason: 'Insufficient data points'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should propagate cause error when provided', () => {
      const causeError = new Error('Database query failed');
      const error = new MetricProcessingError({
        metricType,
        operation: 'storage',
        reason: 'Database error',
        cause: causeError
      });

      expect(error.cause).toBe(causeError);
      
      // Root cause should be the original error
      expect(error.getRootCause()).toBe(causeError);
    });
  });

  describe('MetricSyncError', () => {
    it('should create error with HEALTH_METRICS_ prefixed error code', () => {
      const error = new MetricSyncError({
        metricType,
        source: 'fitbit',
        userId,
        reason: 'API rate limit exceeded'
      });

      expect(error.code).toMatch(/^HEALTH_METRICS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof MetricSyncError).toBe(true);
    });

    it('should include sync context in error details', () => {
      const error = new MetricSyncError({
        metricType,
        source: 'fitbit',
        userId,
        reason: 'API rate limit exceeded'
      });

      expect(error.details).toBeDefined();
      expect(error.details.metricType).toBe(metricType);
      expect(error.details.source).toBe('fitbit');
      expect(error.details.userId).toBe(userId);
      expect(error.details.reason).toBe('API rate limit exceeded');
    });

    it('should be classified as an EXTERNAL error type', () => {
      const error = new MetricSyncError({
        metricType,
        source: 'fitbit',
        userId,
        reason: 'API rate limit exceeded'
      });

      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Should map to appropriate HTTP status code for external errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
    });

    it('should include retry information when available', () => {
      const error = new MetricSyncError({
        metricType,
        source: 'fitbit',
        userId,
        reason: 'API rate limit exceeded',
        retryAfter: 60 // seconds
      });

      expect(error.details.retryAfter).toBe(60);
      
      // Serialized error should include retry information
      const json = error.toJSON();
      expect(json.error.details.retryAfter).toBe(60);
    });
  });

  describe('Error Recovery and Handling', () => {
    it('should provide appropriate recovery strategies for validation errors', () => {
      const error = new InvalidMetricValueError({
        metricType,
        value: metricValue,
        expectedFormat: 'systolic/diastolic'
      });

      // Validation errors should be client-friendly
      const json = error.toJSON();
      expect(json.error.message).toBeDefined();
      expect(typeof json.error.message).toBe('string');
      expect(json.error.message.length).toBeGreaterThan(0);
      
      // Should include expected format to guide the user
      expect(json.error.details.expectedFormat).toBeDefined();
    });

    it('should provide appropriate recovery strategies for threshold errors', () => {
      const error = new MetricThresholdExceededError({
        metricType,
        value: metricValue,
        threshold: metricThreshold,
        userId
      });

      // Threshold errors should include both the value and threshold for comparison
      const json = error.toJSON();
      expect(json.error.details.value).toBe(metricValue);
      expect(json.error.details.threshold).toBe(metricThreshold);
    });

    it('should provide appropriate recovery strategies for sync errors', () => {
      const error = new MetricSyncError({
        metricType,
        source: 'fitbit',
        userId,
        reason: 'API rate limit exceeded',
        retryAfter: 60 // seconds
      });

      // Sync errors should include retry information when available
      const json = error.toJSON();
      expect(json.error.details.retryAfter).toBe(60);
      
      // Should include source information for troubleshooting
      expect(json.error.details.source).toBe('fitbit');
    });
  });
});