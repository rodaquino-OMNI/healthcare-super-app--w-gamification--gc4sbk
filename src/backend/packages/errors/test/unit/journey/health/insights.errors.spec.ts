import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  AlgorithmFailureError,
  ContradictoryAdviceError,
  DataQualityError,
  ExternalIntegrationError,
  HealthInsightError,
  InsufficientDataError,
  PatternRecognitionFailureError,
  ProcessingTimeoutError,
  UnsupportedRecommendationError
} from '../../../../src/journey/health/insights.errors';

describe('Health Insights Error Classes', () => {
  describe('Base HealthInsightError', () => {
    it('should extend AppException with correct error type', () => {
      // Create a concrete instance of the abstract class for testing
      class TestHealthInsightError extends HealthInsightError {
        constructor() {
          super('Test error message', 'TEST_CODE');
        }
      }
      
      const error = new TestHealthInsightError();
      
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_INSIGHTS_TEST_CODE');
      expect(error.message).toBe('Test error message');
    });
    
    it('should include error details when provided', () => {
      const details = { testKey: 'testValue' };
      
      class TestHealthInsightError extends HealthInsightError {
        constructor() {
          super('Test error message', 'TEST_CODE', details);
        }
      }
      
      const error = new TestHealthInsightError();
      
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
    
    it('should include original cause when provided', () => {
      const cause = new Error('Original error');
      
      class TestHealthInsightError extends HealthInsightError {
        constructor() {
          super('Test error message', 'TEST_CODE', undefined, cause);
        }
      }
      
      const error = new TestHealthInsightError();
      
      expect(error.cause).toBe(cause);
    });
  });
  
  describe('InsufficientDataError', () => {
    it('should be properly initialized with default message', () => {
      const error = new InsufficientDataError();
      
      expect(error).toBeInstanceOf(InsufficientDataError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Insufficient data to generate health insights');
      expect(error.code).toBe('HEALTH_INSIGHTS_INSUFFICIENT_DATA');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include data availability context in details', () => {
      const details = {
        requiredDataPoints: 30,
        availableDataPoints: 15,
        dataSource: 'wearable',
        metricType: 'heart_rate',
        minimumHistoryDays: 7,
        availableHistoryDays: 3
      };
      
      const error = new InsufficientDataError('Not enough heart rate data', details);
      
      expect(error.message).toBe('Not enough heart rate data');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
    
    it('should serialize to JSON with correct structure', () => {
      const error = new InsufficientDataError();
      const json = error.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', 'HEALTH_INSIGHTS_INSUFFICIENT_DATA');
      expect(json.error).toHaveProperty('message', 'Insufficient data to generate health insights');
    });
  });
  
  describe('PatternRecognitionFailureError', () => {
    it('should be properly initialized with default message', () => {
      const error = new PatternRecognitionFailureError();
      
      expect(error).toBeInstanceOf(PatternRecognitionFailureError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Failed to recognize patterns in health data');
      expect(error.code).toBe('HEALTH_INSIGHTS_PATTERN_RECOGNITION_FAILURE');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include pattern recognition context in details', () => {
      const timeRange = { start: new Date('2023-01-01'), end: new Date('2023-01-31') };
      const details = {
        analysisMethod: 'time_series_decomposition',
        dataSource: 'glucose_monitor',
        metricType: 'blood_glucose',
        timeRange,
        variabilityScore: 0.85,
        confidenceThreshold: 0.7,
        actualConfidence: 0.65
      };
      
      const error = new PatternRecognitionFailureError('Could not identify glucose patterns', details);
      
      expect(error.message).toBe('Could not identify glucose patterns');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('ContradictoryAdviceError', () => {
    it('should be properly initialized with default message', () => {
      const error = new ContradictoryAdviceError();
      
      expect(error).toBeInstanceOf(ContradictoryAdviceError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Generated contradictory health recommendations');
      expect(error.code).toBe('HEALTH_INSIGHTS_CONTRADICTORY_ADVICE');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include contradictory advice context in details', () => {
      const details = {
        recommendationId: 'rec-123',
        conflictingRecommendationId: 'rec-456',
        insightType: 'activity_recommendation',
        contradictionReason: 'conflicting_intensity_levels',
        dataSource: 'activity_tracker',
        analysisMethod: 'trend_analysis'
      };
      
      const error = new ContradictoryAdviceError('Conflicting activity recommendations detected', details);
      
      expect(error.message).toBe('Conflicting activity recommendations detected');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('UnsupportedRecommendationError', () => {
    it('should be properly initialized with default message', () => {
      const error = new UnsupportedRecommendationError();
      
      expect(error).toBeInstanceOf(UnsupportedRecommendationError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Cannot generate recommendation with available data');
      expect(error.code).toBe('HEALTH_INSIGHTS_UNSUPPORTED_RECOMMENDATION');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include recommendation support context in details', () => {
      const details = {
        recommendationType: 'sleep_improvement',
        requiredDataTypes: ['sleep_duration', 'sleep_quality', 'activity_level'],
        missingDataTypes: ['sleep_quality'],
        confidenceThreshold: 0.8,
        actualConfidence: 0.6,
        insightType: 'sleep_pattern'
      };
      
      const error = new UnsupportedRecommendationError('Cannot provide sleep recommendations', details);
      
      expect(error.message).toBe('Cannot provide sleep recommendations');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('AlgorithmFailureError', () => {
    it('should be properly initialized with default message', () => {
      const error = new AlgorithmFailureError();
      
      expect(error).toBeInstanceOf(AlgorithmFailureError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Health insight algorithm failed to execute');
      expect(error.code).toBe('HEALTH_INSIGHTS_ALGORITHM_FAILURE');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include algorithm failure context in details', () => {
      const details = {
        algorithmName: 'nutritional_analysis',
        algorithmVersion: '2.3.1',
        insightType: 'dietary_recommendation',
        parameters: { timeframe: '30d', dataPoints: 90 },
        failurePoint: 'nutrient_correlation_calculation',
        errorCode: 'MATRIX_SINGULAR'
      };
      
      const error = new AlgorithmFailureError('Nutritional analysis algorithm failed', details);
      
      expect(error.message).toBe('Nutritional analysis algorithm failed');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('ProcessingTimeoutError', () => {
    it('should be properly initialized with default message', () => {
      const error = new ProcessingTimeoutError();
      
      expect(error).toBeInstanceOf(ProcessingTimeoutError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Health insight processing exceeded time limit');
      expect(error.code).toBe('HEALTH_INSIGHTS_PROCESSING_TIMEOUT');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include processing timeout context in details', () => {
      const details = {
        insightType: 'longitudinal_health_trend',
        processingTimeMs: 12500,
        timeoutThresholdMs: 10000,
        dataVolume: 5280,
        processingStage: 'trend_correlation',
        resourceUtilization: { cpu: 0.92, memory: 0.78 }
      };
      
      const error = new ProcessingTimeoutError('Trend analysis timed out', details);
      
      expect(error.message).toBe('Trend analysis timed out');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('DataQualityError', () => {
    it('should be properly initialized with default message', () => {
      const error = new DataQualityError();
      
      expect(error).toBeInstanceOf(DataQualityError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('Data quality issues prevent insight generation');
      expect(error.code).toBe('HEALTH_INSIGHTS_DATA_QUALITY');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include data quality context in details', () => {
      const details = {
        dataSource: 'blood_pressure_monitor',
        metricType: 'blood_pressure',
        qualityIssues: ['inconsistent_readings', 'large_gaps', 'outliers'],
        outlierCount: 7,
        gapCount: 3,
        inconsistencyDetails: { variance: 'high', standard_deviation: 15.2 },
        qualityScore: 0.65,
        minimumRequiredScore: 0.8
      };
      
      const error = new DataQualityError('Blood pressure data quality too low', details);
      
      expect(error.message).toBe('Blood pressure data quality too low');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('ExternalIntegrationError', () => {
    it('should be properly initialized with default message', () => {
      const error = new ExternalIntegrationError();
      
      expect(error).toBeInstanceOf(ExternalIntegrationError);
      expect(error).toBeInstanceOf(HealthInsightError);
      expect(error.message).toBe('External system integration failed during insight generation');
      expect(error.code).toBe('HEALTH_INSIGHTS_EXTERNAL_INTEGRATION');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should include external integration context in details', () => {
      const details = {
        externalSystem: 'medical_records_api',
        endpoint: '/api/v2/patient/history',
        requestId: 'req-789',
        statusCode: 503,
        errorResponse: { error: 'service_unavailable', message: 'System maintenance in progress' },
        insightType: 'medication_adherence',
        requiredData: ['prescription_history', 'medication_schedule']
      };
      
      const error = new ExternalIntegrationError('Failed to retrieve medical records', details);
      
      expect(error.message).toBe('Failed to retrieve medical records');
      expect(error.details).toEqual(details);
      expect(error.toJSON().error.details).toEqual(details);
    });
  });
  
  describe('Error classification and recovery guidance', () => {
    it('should classify InsufficientDataError as a business error with recovery options', () => {
      const error = new InsufficientDataError();
      const httpException = error.toHttpException();
      
      // Business errors map to 422 Unprocessable Entity
      expect(httpException.getStatus()).toBe(422);
      
      // Verify the error is properly classified for graceful degradation
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should classify AlgorithmFailureError as a business error despite technical nature', () => {
      // Even though algorithm failures are technical in nature,
      // they're classified as business errors to enable graceful degradation
      const error = new AlgorithmFailureError();
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(422);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should classify ExternalIntegrationError as a business error for consistent handling', () => {
      // External integration errors are classified as business errors
      // to maintain consistent handling within the health insights domain
      const error = new ExternalIntegrationError();
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(422);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
  });
});