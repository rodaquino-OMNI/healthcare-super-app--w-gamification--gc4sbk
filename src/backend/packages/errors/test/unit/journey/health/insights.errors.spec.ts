import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the error classes and types
import { ErrorType } from '../../../../src/types';
import { BaseError } from '../../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';
import {
  InsufficientDataError,
  PatternRecognitionFailureError,
  InsightGenerationError,
  InsightRecommendationError,
  InsightAlgorithmError,
  InsightProcessingTimeoutError
} from '../../../../src/journey/health/insights.errors';

/**
 * Test suite for Health Insights error classes
 * Validates that insight-specific errors properly implement HEALTH_INSIGHTS_ prefixed error codes,
 * include relevant context data about insights processing, and follow the standardized error
 * classification and serialization patterns.
 */
describe('Health Insights Errors', () => {
  // Sample insight data for testing
  const insightType = 'sleepPattern';
  const userId = 'user-123';
  const dataPoints = 3;
  const requiredDataPoints = 7;
  const algorithm = 'timeSeriesAnalysis';
  const recommendationType = 'sleepSchedule';
  
  describe('InsufficientDataError', () => {
    it('should create error with HEALTH_INSIGHTS_ prefixed error code', () => {
      const error = new InsufficientDataError({
        insightType,
        userId,
        dataPoints,
        requiredDataPoints
      });

      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof InsufficientDataError).toBe(true);
    });

    it('should include data availability context in error details', () => {
      const error = new InsufficientDataError({
        insightType,
        userId,
        dataPoints,
        requiredDataPoints
      });

      expect(error.details).toBeDefined();
      expect(error.details.insightType).toBe(insightType);
      expect(error.details.dataPoints).toBe(dataPoints);
      expect(error.details.requiredDataPoints).toBe(requiredDataPoints);
      expect(error.details.userId).toBe(userId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new InsufficientDataError({
        insightType,
        userId,
        dataPoints,
        requiredDataPoints
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Should map to appropriate HTTP status code for business errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should generate appropriate error message with context', () => {
      const error = new InsufficientDataError({
        insightType,
        userId,
        dataPoints,
        requiredDataPoints
      });

      expect(error.message).toContain(insightType);
      expect(error.message).toContain(String(dataPoints));
      expect(error.message).toContain(String(requiredDataPoints));
    });
  });

  describe('PatternRecognitionFailureError', () => {
    it('should create error with HEALTH_INSIGHTS_ prefixed error code', () => {
      const error = new PatternRecognitionFailureError({
        insightType,
        userId,
        algorithm,
        reason: 'Inconsistent data patterns'
      });

      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof PatternRecognitionFailureError).toBe(true);
    });

    it('should include pattern recognition context in error details', () => {
      const error = new PatternRecognitionFailureError({
        insightType,
        userId,
        algorithm,
        reason: 'Inconsistent data patterns'
      });

      expect(error.details).toBeDefined();
      expect(error.details.insightType).toBe(insightType);
      expect(error.details.algorithm).toBe(algorithm);
      expect(error.details.reason).toBe('Inconsistent data patterns');
      expect(error.details.userId).toBe(userId);
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new PatternRecognitionFailureError({
        insightType,
        userId,
        algorithm,
        reason: 'Inconsistent data patterns'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should include user context in error context', () => {
      const error = new PatternRecognitionFailureError({
        insightType,
        userId,
        algorithm,
        reason: 'Inconsistent data patterns'
      });

      expect(error.context).toBeDefined();
      expect(error.context.userId).toBe(userId);
      expect(error.context.journeyContext).toBe('health');
    });
  });

  describe('InsightGenerationError', () => {
    it('should create error with HEALTH_INSIGHTS_ prefixed error code', () => {
      const error = new InsightGenerationError({
        insightType,
        userId,
        reason: 'Failed to generate insight'
      });

      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof InsightGenerationError).toBe(true);
    });

    it('should include insight generation context in error details', () => {
      const error = new InsightGenerationError({
        insightType,
        userId,
        reason: 'Failed to generate insight'
      });

      expect(error.details).toBeDefined();
      expect(error.details.insightType).toBe(insightType);
      expect(error.details.userId).toBe(userId);
      expect(error.details.reason).toBe('Failed to generate insight');
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new InsightGenerationError({
        insightType,
        userId,
        reason: 'Failed to generate insight'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should propagate cause error when provided', () => {
      const causeError = new Error('Algorithm execution failed');
      const error = new InsightGenerationError({
        insightType,
        userId,
        reason: 'Failed to generate insight',
        cause: causeError
      });

      expect(error.cause).toBe(causeError);
      
      // Root cause should be the original error
      expect(error.getRootCause()).toBe(causeError);
    });
  });

  describe('InsightRecommendationError', () => {
    it('should create error with HEALTH_INSIGHTS_ prefixed error code', () => {
      const error = new InsightRecommendationError({
        insightType,
        recommendationType,
        userId,
        reason: 'Contradictory recommendations'
      });

      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof InsightRecommendationError).toBe(true);
    });

    it('should include recommendation context in error details', () => {
      const error = new InsightRecommendationError({
        insightType,
        recommendationType,
        userId,
        reason: 'Contradictory recommendations'
      });

      expect(error.details).toBeDefined();
      expect(error.details.insightType).toBe(insightType);
      expect(error.details.recommendationType).toBe(recommendationType);
      expect(error.details.userId).toBe(userId);
      expect(error.details.reason).toBe('Contradictory recommendations');
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new InsightRecommendationError({
        insightType,
        recommendationType,
        userId,
        reason: 'Contradictory recommendations'
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Should map to appropriate HTTP status code for business errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
  });

  describe('InsightAlgorithmError', () => {
    it('should create error with HEALTH_INSIGHTS_ prefixed error code', () => {
      const error = new InsightAlgorithmError({
        insightType,
        algorithm,
        userId,
        reason: 'Algorithm execution failed'
      });

      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof InsightAlgorithmError).toBe(true);
    });

    it('should include algorithm context in error details', () => {
      const error = new InsightAlgorithmError({
        insightType,
        algorithm,
        userId,
        reason: 'Algorithm execution failed'
      });

      expect(error.details).toBeDefined();
      expect(error.details.insightType).toBe(insightType);
      expect(error.details.algorithm).toBe(algorithm);
      expect(error.details.userId).toBe(userId);
      expect(error.details.reason).toBe('Algorithm execution failed');
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new InsightAlgorithmError({
        insightType,
        algorithm,
        userId,
        reason: 'Algorithm execution failed'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should propagate cause error when provided', () => {
      const causeError = new Error('Division by zero');
      const error = new InsightAlgorithmError({
        insightType,
        algorithm,
        userId,
        reason: 'Algorithm execution failed',
        cause: causeError
      });

      expect(error.cause).toBe(causeError);
      
      // Root cause should be the original error
      expect(error.getRootCause()).toBe(causeError);
    });
  });

  describe('InsightProcessingTimeoutError', () => {
    it('should create error with HEALTH_INSIGHTS_ prefixed error code', () => {
      const error = new InsightProcessingTimeoutError({
        insightType,
        userId,
        timeoutMs: 30000,
        operation: 'data analysis'
      });

      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof InsightProcessingTimeoutError).toBe(true);
    });

    it('should include timeout context in error details', () => {
      const error = new InsightProcessingTimeoutError({
        insightType,
        userId,
        timeoutMs: 30000,
        operation: 'data analysis'
      });

      expect(error.details).toBeDefined();
      expect(error.details.insightType).toBe(insightType);
      expect(error.details.userId).toBe(userId);
      expect(error.details.timeoutMs).toBe(30000);
      expect(error.details.operation).toBe('data analysis');
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new InsightProcessingTimeoutError({
        insightType,
        userId,
        timeoutMs: 30000,
        operation: 'data analysis'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });
  });

  describe('Error Recovery and Handling', () => {
    it('should provide appropriate recovery strategies for insufficient data errors', () => {
      const error = new InsufficientDataError({
        insightType,
        userId,
        dataPoints,
        requiredDataPoints
      });

      // Should include data points information to guide the user
      const json = error.toJSON();
      expect(json.error.details.dataPoints).toBe(dataPoints);
      expect(json.error.details.requiredDataPoints).toBe(requiredDataPoints);
      
      // Message should be user-friendly
      expect(json.error.message).toBeDefined();
      expect(typeof json.error.message).toBe('string');
      expect(json.error.message.length).toBeGreaterThan(0);
    });

    it('should provide appropriate recovery strategies for algorithm errors', () => {
      const error = new InsightAlgorithmError({
        insightType,
        algorithm,
        userId,
        reason: 'Algorithm execution failed'
      });

      // Should include algorithm information for troubleshooting
      const json = error.toJSON();
      expect(json.error.details.algorithm).toBe(algorithm);
      expect(json.error.details.reason).toBe('Algorithm execution failed');
    });

    it('should support graceful degradation for insight features', () => {
      const error = new InsufficientDataError({
        insightType,
        userId,
        dataPoints,
        requiredDataPoints,
        alternativeInsights: ['basicSleepDuration', 'simpleTrend']
      });

      // Should include alternative insights when available
      const json = error.toJSON();
      expect(json.error.details.alternativeInsights).toEqual(['basicSleepDuration', 'simpleTrend']);
    });

    it('should provide clear guidance for recommendation errors', () => {
      const error = new InsightRecommendationError({
        insightType,
        recommendationType,
        userId,
        reason: 'Contradictory recommendations',
        alternativeRecommendations: ['generalSleepGuidelines']
      });

      // Should include alternative recommendations when available
      const json = error.toJSON();
      expect(json.error.details.alternativeRecommendations).toEqual(['generalSleepGuidelines']);
    });
  });
});