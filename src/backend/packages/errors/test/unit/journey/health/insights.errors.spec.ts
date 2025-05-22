import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  HealthInsightError,
  InsufficientDataError,
  PatternRecognitionFailureError,
  ContradictoryAdviceError,
  UnsupportedRecommendationError,
  AlgorithmFailureError,
  ProcessingTimeoutError,
  DataQualityError,
  ExternalIntegrationError,
  HealthInsightErrorUtils
} from '../../../../src/journey/health/insights.errors';

describe('Health Insights Error Classes', () => {
  describe('HealthInsightError', () => {
    it('should be defined', () => {
      expect(HealthInsightError).toBeDefined();
    });

    it('should set name to the constructor name', () => {
      // Create a concrete implementation for testing
      class TestHealthInsightError extends HealthInsightError {
        constructor() {
          super('Test error', 'HEALTH_INSIGHTS_TEST', ErrorType.VALIDATION, {});
        }
      }
      
      const error = new TestHealthInsightError();
      expect(error.name).toBe('TestHealthInsightError');
    });

    it('should ensure proper prototype chain for instanceof checks', () => {
      // Create a concrete implementation for testing
      class TestHealthInsightError extends HealthInsightError {
        constructor() {
          super('Test error', 'HEALTH_INSIGHTS_TEST', ErrorType.VALIDATION, {});
        }
      }
      
      const error = new TestHealthInsightError();
      expect(error instanceof HealthInsightError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('InsufficientDataError', () => {
    const message = 'Not enough data points for analysis';
    const details = {
      requiredDataPoints: 30,
      availableDataPoints: 5,
      dataType: 'heart_rate',
      timeRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
      userId: '123',
      metricTypes: ['heart_rate', 'steps']
    };
    const cause = new Error('Original error');
    
    let error: InsufficientDataError;
    
    beforeEach(() => {
      error = new InsufficientDataError(message, details, cause);
    });
    
    it('should be defined', () => {
      expect(InsufficientDataError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_INSUFFICIENT_DATA');
    });
    
    it('should include data availability context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new InsufficientDataError();
      expect(defaultError.message).toBe('Insufficient data to generate health insights');
    });
    
    it('should preserve the original cause', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('PatternRecognitionFailureError', () => {
    const message = 'Failed to identify patterns in sleep data';
    const details = {
      analysisMethod: 'time_series_clustering',
      dataQualityIssues: ['inconsistent_sampling', 'missing_data_points'],
      metricTypes: ['sleep_duration', 'sleep_quality'],
      timeRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
      userId: '123',
      confidenceScore: 0.35
    };
    const cause = new Error('Algorithm error');
    
    let error: PatternRecognitionFailureError;
    
    beforeEach(() => {
      error = new PatternRecognitionFailureError(message, details, cause);
    });
    
    it('should be defined', () => {
      expect(PatternRecognitionFailureError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_PATTERN_RECOGNITION_FAILURE');
    });
    
    it('should include analysis context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new PatternRecognitionFailureError();
      expect(defaultError.message).toBe('Failed to recognize patterns in health data');
    });
    
    it('should preserve the original cause', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('ContradictoryAdviceError', () => {
    const message = 'Conflicting recommendations detected';
    const details = {
      recommendationTypes: ['exercise', 'rest'],
      conflictingRecommendations: [
        { id: 'rec1', advice: 'Increase daily steps to 10,000' },
        { id: 'rec2', advice: 'Rest for 48 hours to recover from injury' }
      ],
      analysisMethod: 'rule_based_inference',
      dataSourceIds: ['activity_log', 'medical_records'],
      userId: '123',
      severity: 'medium' as const
    };
    
    let error: ContradictoryAdviceError;
    
    beforeEach(() => {
      error = new ContradictoryAdviceError(message, details);
    });
    
    it('should be defined', () => {
      expect(ContradictoryAdviceError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_CONTRADICTORY_ADVICE');
    });
    
    it('should include recommendation context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new ContradictoryAdviceError();
      expect(defaultError.message).toBe('Generated contradictory health recommendations');
    });
  });

  describe('UnsupportedRecommendationError', () => {
    const message = 'Cannot provide nutrition recommendations with available data';
    const details = {
      recommendationType: 'nutrition',
      requiredDataTypes: ['food_log', 'metabolic_rate'],
      availableDataTypes: ['weight', 'activity'],
      userId: '123',
      reasonCode: 'MISSING_FOOD_LOG',
      alternativeRecommendationTypes: ['activity', 'hydration']
    };
    
    let error: UnsupportedRecommendationError;
    
    beforeEach(() => {
      error = new UnsupportedRecommendationError(message, details);
    });
    
    it('should be defined', () => {
      expect(UnsupportedRecommendationError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_UNSUPPORTED_RECOMMENDATION');
    });
    
    it('should include recommendation context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new UnsupportedRecommendationError();
      expect(defaultError.message).toBe('Cannot generate recommendation with available data');
    });
  });

  describe('AlgorithmFailureError', () => {
    const message = 'Machine learning model failed to process health data';
    const details = {
      algorithmName: 'health_trend_predictor',
      algorithmVersion: '1.2.3',
      inputDataTypes: ['heart_rate', 'sleep', 'activity'],
      processingStage: 'feature_extraction',
      errorCode: 'INVALID_FEATURE_MATRIX',
      userId: '123',
      technicalDetails: { matrix_shape: [0, 10], expected_shape: [5, 10] }
    };
    const cause = new Error('Matrix dimension error');
    
    let error: AlgorithmFailureError;
    
    beforeEach(() => {
      error = new AlgorithmFailureError(message, details, cause);
    });
    
    it('should be defined', () => {
      expect(AlgorithmFailureError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_ALGORITHM_FAILURE');
    });
    
    it('should include algorithm context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new AlgorithmFailureError();
      expect(defaultError.message).toBe('Health insight algorithm failed to process data');
    });
    
    it('should preserve the original cause', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('ProcessingTimeoutError', () => {
    const message = 'Health trend analysis timed out';
    const details = {
      processingStage: 'time_series_analysis',
      timeoutThreshold: 30000, // 30 seconds
      actualDuration: 45000, // 45 seconds
      insightType: 'sleep_pattern',
      dataVolume: 90, // 90 data points
      userId: '123',
      operationId: 'op-123456'
    };
    
    let error: ProcessingTimeoutError;
    
    beforeEach(() => {
      error = new ProcessingTimeoutError(message, details);
    });
    
    it('should be defined', () => {
      expect(ProcessingTimeoutError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_PROCESSING_TIMEOUT');
    });
    
    it('should include timeout context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new ProcessingTimeoutError();
      expect(defaultError.message).toBe('Health insight processing timed out');
    });
  });

  describe('DataQualityError', () => {
    const message = 'Poor quality sleep data prevents reliable analysis';
    const details = {
      qualityIssues: ['inconsistent_sampling', 'outliers', 'missing_segments'],
      affectedDataTypes: ['sleep_duration', 'sleep_quality'],
      dataSourceIds: ['fitbit', 'manual_entry'],
      timeRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
      userId: '123',
      recommendedAction: 'Ensure consistent sleep tracking',
      severity: 'high' as const
    };
    
    let error: DataQualityError;
    
    beforeEach(() => {
      error = new DataQualityError(message, details);
    });
    
    it('should be defined', () => {
      expect(DataQualityError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_DATA_QUALITY');
    });
    
    it('should include data quality context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new DataQualityError();
      expect(defaultError.message).toBe('Data quality issues prevent reliable insight generation');
    });
  });

  describe('ExternalIntegrationError', () => {
    const message = 'Failed to retrieve data from FHIR server';
    const details = {
      integrationSource: 'FHIR',
      sourceSystem: 'hospital_ehr',
      errorResponse: { status: 429, message: 'Too Many Requests' },
      requestId: 'req-789012',
      endpoint: 'https://fhir.hospital.org/api/Patient/123',
      userId: '123',
      retryable: true,
      retryAttempts: 2
    };
    const cause = new Error('HTTP 429 error');
    
    let error: ExternalIntegrationError;
    
    beforeEach(() => {
      error = new ExternalIntegrationError(message, details, cause);
    });
    
    it('should be defined', () => {
      expect(ExternalIntegrationError).toBeDefined();
    });
    
    it('should extend HealthInsightError', () => {
      expect(error instanceof HealthInsightError).toBe(true);
    });
    
    it('should use EXTERNAL error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });
    
    it('should use HEALTH_INSIGHTS_ prefixed error code', () => {
      expect(error.code).toMatch(/^HEALTH_INSIGHTS_/);
      expect(error.code).toBe('HEALTH_INSIGHTS_EXTERNAL_INTEGRATION');
    });
    
    it('should include integration context in error details', () => {
      expect(error.details).toEqual(details);
    });
    
    it('should use provided message or default message', () => {
      expect(error.message).toBe(message);
      
      const defaultError = new ExternalIntegrationError();
      expect(defaultError.message).toBe('External health data integration failed during insight generation');
    });
    
    it('should preserve the original cause', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('HealthInsightErrorUtils', () => {
    describe('isHealthInsightError', () => {
      it('should return true for health insight errors', () => {
        const error = new InsufficientDataError();
        expect(HealthInsightErrorUtils.isHealthInsightError(error)).toBe(true);
      });
      
      it('should return false for other errors', () => {
        const error = new Error('Generic error');
        expect(HealthInsightErrorUtils.isHealthInsightError(error)).toBe(false);
      });
      
      it('should return false for null or undefined', () => {
        expect(HealthInsightErrorUtils.isHealthInsightError(null)).toBe(false);
        expect(HealthInsightErrorUtils.isHealthInsightError(undefined)).toBe(false);
      });
    });
    
    describe('createUserFriendlyMessage', () => {
      it('should create user-friendly message for InsufficientDataError', () => {
        const error = new InsufficientDataError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('more health data');
      });
      
      it('should create user-friendly message for PatternRecognitionFailureError', () => {
        const error = new PatternRecognitionFailureError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('couldn\'t identify clear patterns');
      });
      
      it('should create user-friendly message for ContradictoryAdviceError', () => {
        const error = new ContradictoryAdviceError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('conflicting patterns');
      });
      
      it('should create user-friendly message for UnsupportedRecommendationError', () => {
        const error = new UnsupportedRecommendationError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('don\'t have enough information');
      });
      
      it('should create user-friendly message for DataQualityError', () => {
        const error = new DataQualityError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('issues with the quality');
      });
      
      it('should create user-friendly message for ExternalIntegrationError', () => {
        const error = new ExternalIntegrationError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('couldn\'t connect to an external health system');
      });
      
      it('should create user-friendly message for technical errors', () => {
        const error = new AlgorithmFailureError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toContain('technical issue');
        
        const timeoutError = new ProcessingTimeoutError();
        const timeoutMessage = HealthInsightErrorUtils.createUserFriendlyMessage(timeoutError);
        expect(timeoutMessage).toContain('technical issue');
      });
      
      it('should provide a default message for unknown error types', () => {
        // Create a custom error that extends HealthInsightError
        class CustomHealthInsightError extends HealthInsightError {
          constructor() {
            super('Custom error', 'HEALTH_INSIGHTS_CUSTOM', ErrorType.VALIDATION, {});
          }
        }
        
        const error = new CustomHealthInsightError();
        const message = HealthInsightErrorUtils.createUserFriendlyMessage(error);
        expect(message).toBe('Unable to generate health insights at this time.');
      });
    });
    
    describe('isRetryable', () => {
      it('should identify technical errors as retryable', () => {
        const algorithmError = new AlgorithmFailureError();
        expect(HealthInsightErrorUtils.isRetryable(algorithmError)).toBe(true);
        
        const timeoutError = new ProcessingTimeoutError();
        expect(HealthInsightErrorUtils.isRetryable(timeoutError)).toBe(true);
      });
      
      it('should identify external integration errors as retryable', () => {
        const integrationError = new ExternalIntegrationError();
        expect(HealthInsightErrorUtils.isRetryable(integrationError)).toBe(true);
      });
      
      it('should identify business errors as non-retryable', () => {
        const insufficientDataError = new InsufficientDataError();
        expect(HealthInsightErrorUtils.isRetryable(insufficientDataError)).toBe(false);
        
        const contradictoryAdviceError = new ContradictoryAdviceError();
        expect(HealthInsightErrorUtils.isRetryable(contradictoryAdviceError)).toBe(false);
        
        const unsupportedRecommendationError = new UnsupportedRecommendationError();
        expect(HealthInsightErrorUtils.isRetryable(unsupportedRecommendationError)).toBe(false);
        
        const dataQualityError = new DataQualityError();
        expect(HealthInsightErrorUtils.isRetryable(dataQualityError)).toBe(false);
      });
    });
  });
});