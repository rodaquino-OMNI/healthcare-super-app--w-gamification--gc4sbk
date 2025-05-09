import { BusinessError } from '../../../../src/categories/business.errors';
import * as HealthErrors from '../../../../src/journey/health';
import { HealthErrorType, HealthMetricType, HealthGoalStatus, DeviceConnectionStatus } from '../../../../src/journey/health/types';

describe('Health Journey Errors', () => {
  describe('Base Health Journey Errors', () => {
    it('should export HealthMetricError', () => {
      expect(HealthErrors.HealthMetricError).toBeDefined();
      const error = new HealthErrors.HealthMetricError('Test error');
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('HealthMetricError');
      expect(error.code).toBe('HEALTH_METRIC_ERROR');
    });

    it('should export HealthGoalError', () => {
      expect(HealthErrors.HealthGoalError).toBeDefined();
      const error = new HealthErrors.HealthGoalError('Test error');
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('HealthGoalError');
      expect(error.code).toBe('HEALTH_GOAL_ERROR');
    });

    it('should export DeviceConnectionError', () => {
      expect(HealthErrors.DeviceConnectionError).toBeDefined();
      const error = new HealthErrors.DeviceConnectionError('Test error');
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('DeviceConnectionError');
      expect(error.code).toBe('DEVICE_CONNECTION_ERROR');
    });

    it('should export HealthSyncError', () => {
      expect(HealthErrors.HealthSyncError).toBeDefined();
      const error = new HealthErrors.HealthSyncError('Test error');
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('HealthSyncError');
      expect(error.code).toBe('HEALTH_SYNC_ERROR');
    });

    it('should export HealthInsightError', () => {
      expect(HealthErrors.HealthInsightError).toBeDefined();
      const error = new HealthErrors.HealthInsightError('Test error');
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('HealthInsightError');
      expect(error.code).toBe('HEALTH_INSIGHT_ERROR');
    });
  });

  describe('Health Journey Error Types', () => {
    it('should export HealthErrorType enum', () => {
      expect(HealthErrors.HealthErrorType).toBeDefined();
      expect(HealthErrors.HealthErrorType.METRIC).toBe('METRIC');
      expect(HealthErrors.HealthErrorType.GOAL).toBe('GOAL');
      expect(HealthErrors.HealthErrorType.DEVICE).toBe('DEVICE');
      expect(HealthErrors.HealthErrorType.SYNC).toBe('SYNC');
      expect(HealthErrors.HealthErrorType.INSIGHT).toBe('INSIGHT');
    });

    it('should export HealthMetricType enum', () => {
      expect(HealthErrors.HealthMetricType).toBeDefined();
      expect(HealthErrors.HealthMetricType.BLOOD_PRESSURE).toBe('blood_pressure');
      expect(HealthErrors.HealthMetricType.HEART_RATE).toBe('heart_rate');
      expect(HealthErrors.HealthMetricType.BLOOD_GLUCOSE).toBe('blood_glucose');
      expect(HealthErrors.HealthMetricType.WEIGHT).toBe('weight');
      expect(HealthErrors.HealthMetricType.STEPS).toBe('steps');
      expect(HealthErrors.HealthMetricType.SLEEP).toBe('sleep');
      expect(HealthErrors.HealthMetricType.OXYGEN_SATURATION).toBe('oxygen_saturation');
      expect(HealthErrors.HealthMetricType.TEMPERATURE).toBe('temperature');
    });

    it('should export HealthGoalStatus enum', () => {
      expect(HealthErrors.HealthGoalStatus).toBeDefined();
      expect(HealthErrors.HealthGoalStatus.NOT_STARTED).toBe('not_started');
      expect(HealthErrors.HealthGoalStatus.IN_PROGRESS).toBe('in_progress');
      expect(HealthErrors.HealthGoalStatus.COMPLETED).toBe('completed');
      expect(HealthErrors.HealthGoalStatus.FAILED).toBe('failed');
    });

    it('should export DeviceConnectionStatus enum', () => {
      expect(HealthErrors.DeviceConnectionStatus).toBeDefined();
      expect(HealthErrors.DeviceConnectionStatus.CONNECTED).toBe('connected');
      expect(HealthErrors.DeviceConnectionStatus.DISCONNECTED).toBe('disconnected');
      expect(HealthErrors.DeviceConnectionStatus.PAIRING).toBe('pairing');
      expect(HealthErrors.DeviceConnectionStatus.ERROR).toBe('error');
    });
  });

  describe('Health Metrics Errors', () => {
    // Import metrics errors from the barrel file
    const {
      InvalidMetricValueError,
      InvalidMetricUnitError,
      InvalidMetricTimestampError,
      InvalidMetricSourceError,
      InvalidMetricTypeError,
      MetricThresholdExceededError,
      ConflictingMetricError,
      MetricStorageError,
      MetricProcessingError,
      MetricRetrievalError,
      WearableDeviceSyncError,
      ExternalDataSourceError,
      FHIRResourceProcessingError
    } = HealthErrors;

    it('should export InvalidMetricValueError', () => {
      expect(InvalidMetricValueError).toBeDefined();
      const error = new InvalidMetricValueError('Invalid value', { metricType: 'heart_rate', metricValue: -10 });
      expect(error.code).toBe('HEALTH_METRICS_INVALID_VALUE');
    });

    it('should export InvalidMetricUnitError', () => {
      expect(InvalidMetricUnitError).toBeDefined();
      const error = new InvalidMetricUnitError('Invalid unit', { metricType: 'blood_pressure', metricUnit: 'invalid' });
      expect(error.code).toBe('HEALTH_METRICS_INVALID_UNIT');
    });

    it('should export InvalidMetricTimestampError', () => {
      expect(InvalidMetricTimestampError).toBeDefined();
      const error = new InvalidMetricTimestampError('Invalid timestamp', { metricType: 'steps', timestamp: '2099-01-01' });
      expect(error.code).toBe('HEALTH_METRICS_INVALID_TIMESTAMP');
    });

    it('should export InvalidMetricSourceError', () => {
      expect(InvalidMetricSourceError).toBeDefined();
      const error = new InvalidMetricSourceError('Invalid source', { metricType: 'weight', source: 'unknown' });
      expect(error.code).toBe('HEALTH_METRICS_INVALID_SOURCE');
    });

    it('should export InvalidMetricTypeError', () => {
      expect(InvalidMetricTypeError).toBeDefined();
      const error = new InvalidMetricTypeError('Invalid type', { metricType: 'unknown' });
      expect(error.code).toBe('HEALTH_METRICS_INVALID_TYPE');
    });

    it('should export MetricThresholdExceededError', () => {
      expect(MetricThresholdExceededError).toBeDefined();
      const error = new MetricThresholdExceededError('Threshold exceeded', {
        metricType: 'blood_glucose',
        metricValue: 300,
        threshold: 200,
        thresholdType: 'upper'
      });
      expect(error.code).toBe('HEALTH_METRICS_THRESHOLD_EXCEEDED');
    });

    it('should export ConflictingMetricError', () => {
      expect(ConflictingMetricError).toBeDefined();
      const error = new ConflictingMetricError('Conflicting metric', {
        metricType: 'weight',
        conflictingMetricId: '123'
      });
      expect(error.code).toBe('HEALTH_METRICS_CONFLICT');
    });

    it('should export MetricStorageError', () => {
      expect(MetricStorageError).toBeDefined();
      const error = new MetricStorageError('Storage error', { metricType: 'steps' });
      expect(error.code).toBe('HEALTH_METRICS_STORAGE_FAILURE');
    });

    it('should export MetricProcessingError', () => {
      expect(MetricProcessingError).toBeDefined();
      const error = new MetricProcessingError('Processing error', {
        metricType: 'heart_rate',
        operation: 'aggregate'
      });
      expect(error.code).toBe('HEALTH_METRICS_PROCESSING_FAILURE');
    });

    it('should export MetricRetrievalError', () => {
      expect(MetricRetrievalError).toBeDefined();
      const error = new MetricRetrievalError('Retrieval error', {
        metricType: 'sleep',
        metricId: '456'
      });
      expect(error.code).toBe('HEALTH_METRICS_RETRIEVAL_FAILURE');
    });

    it('should export WearableDeviceSyncError', () => {
      expect(WearableDeviceSyncError).toBeDefined();
      const error = new WearableDeviceSyncError('Sync error', {
        metricType: 'steps',
        deviceId: 'fitbit-123',
        deviceType: 'fitbit'
      });
      expect(error.code).toBe('HEALTH_METRICS_DEVICE_SYNC_FAILURE');
    });

    it('should export ExternalDataSourceError', () => {
      expect(ExternalDataSourceError).toBeDefined();
      const error = new ExternalDataSourceError('External source error', {
        metricType: 'blood_pressure',
        source: 'apple_health',
        sourceId: 'apple-123'
      });
      expect(error.code).toBe('HEALTH_METRICS_EXTERNAL_SOURCE_FAILURE');
    });

    it('should export FHIRResourceProcessingError', () => {
      expect(FHIRResourceProcessingError).toBeDefined();
      const error = new FHIRResourceProcessingError('FHIR processing error', {
        metricType: 'blood_glucose',
        resourceType: 'Observation',
        resourceId: 'obs-123'
      });
      expect(error.code).toBe('HEALTH_METRICS_FHIR_PROCESSING_FAILURE');
    });
  });

  describe('Health Goals Errors', () => {
    // Import goals errors from the barrel file
    const {
      InvalidGoalParametersError,
      ConflictingGoalsError,
      UnachievableGoalError,
      GoalLimitExceededError,
      GoalTrackingFailureError,
      GoalSynchronizationError,
      GoalAchievementProcessingError
    } = HealthErrors;

    it('should export InvalidGoalParametersError', () => {
      expect(InvalidGoalParametersError).toBeDefined();
      const error = new InvalidGoalParametersError('Invalid parameters', {
        goalType: 'steps',
        targetValue: -100
      });
      expect(error.code).toBe('HEALTH_GOALS_INVALID_PARAMETERS');
    });

    it('should export ConflictingGoalsError', () => {
      expect(ConflictingGoalsError).toBeDefined();
      const error = new ConflictingGoalsError('Conflicting goals', {
        goalType: 'weight',
        goalId: '123'
      });
      expect(error.code).toBe('HEALTH_GOALS_CONFLICT');
    });

    it('should export UnachievableGoalError', () => {
      expect(UnachievableGoalError).toBeDefined();
      const error = new UnachievableGoalError('Unachievable goal', {
        goalType: 'steps',
        targetValue: 50000
      });
      expect(error.code).toBe('HEALTH_GOALS_UNACHIEVABLE');
    });

    it('should export GoalLimitExceededError', () => {
      expect(GoalLimitExceededError).toBeDefined();
      const error = new GoalLimitExceededError('Limit exceeded', {
        currentCount: 10,
        maxAllowed: 5
      });
      expect(error.code).toBe('HEALTH_GOALS_LIMIT_EXCEEDED');
    });

    it('should export GoalTrackingFailureError', () => {
      expect(GoalTrackingFailureError).toBeDefined();
      const error = new GoalTrackingFailureError('Tracking failure', {
        goalId: '123',
        goalType: 'sleep'
      });
      expect(error.code).toBe('HEALTH_GOALS_TRACKING_FAILURE');
    });

    it('should export GoalSynchronizationError', () => {
      expect(GoalSynchronizationError).toBeDefined();
      const error = new GoalSynchronizationError('Sync error', {
        goalId: '123',
        externalSystem: 'google_fit',
        operationType: 'update'
      });
      expect(error.code).toBe('HEALTH_GOALS_SYNC_FAILURE');
    });

    it('should export GoalAchievementProcessingError', () => {
      expect(GoalAchievementProcessingError).toBeDefined();
      const error = new GoalAchievementProcessingError('Achievement processing error', {
        goalId: '123',
        achievementId: 'ach-456',
        eventId: 'evt-789'
      });
      expect(error.code).toBe('HEALTH_GOALS_ACHIEVEMENT_PROCESSING_FAILURE');
    });
  });

  describe('Health Devices Errors', () => {
    // Import devices errors from the barrel file
    const {
      DeviceConnectionFailureError,
      DevicePairingFailureError,
      DeviceAuthenticationError,
      SynchronizationFailedError,
      DataFormatError,
      DataTransferError,
      UnsupportedDeviceError,
      DeviceVersionMismatchError,
      DeviceConnectionLostError,
      MaxConnectionAttemptsError
    } = HealthErrors;

    it('should export DeviceConnectionFailureError', () => {
      expect(DeviceConnectionFailureError).toBeDefined();
      const error = new DeviceConnectionFailureError('Connection failure', {
        deviceId: 'dev-123',
        deviceType: 'fitbit'
      });
      expect(error.code).toBe('HEALTH_DEVICES_CONNECTION_FAILURE');
    });

    it('should export DevicePairingFailureError', () => {
      expect(DevicePairingFailureError).toBeDefined();
      const error = new DevicePairingFailureError('Pairing failure', {
        deviceId: 'dev-123',
        deviceType: 'garmin'
      });
      expect(error.code).toBe('HEALTH_DEVICES_PAIRING_FAILURE');
    });

    it('should export DeviceAuthenticationError', () => {
      expect(DeviceAuthenticationError).toBeDefined();
      const error = new DeviceAuthenticationError('Authentication error', {
        deviceId: 'dev-123',
        deviceType: 'apple_watch'
      });
      expect(error.code).toBe('HEALTH_DEVICES_AUTHENTICATION_FAILURE');
    });

    it('should export SynchronizationFailedError', () => {
      expect(SynchronizationFailedError).toBeDefined();
      const error = new SynchronizationFailedError('Sync failed', {
        deviceId: 'dev-123',
        deviceType: 'fitbit',
        lastSuccessfulSync: new Date(),
        syncAttemptTimestamp: new Date(),
        dataPoints: 100
      });
      expect(error.code).toBe('HEALTH_DEVICES_SYNC_FAILURE');
    });

    it('should export DataFormatError', () => {
      expect(DataFormatError).toBeDefined();
      const error = new DataFormatError('Invalid data format', {
        deviceId: 'dev-123',
        deviceType: 'samsung_health',
        errorDetails: 'Invalid JSON format'
      });
      expect(error.code).toBe('HEALTH_DEVICES_DATA_FORMAT_ERROR');
    });

    it('should export DataTransferError', () => {
      expect(DataTransferError).toBeDefined();
      const error = new DataTransferError('Data transfer error', {
        deviceId: 'dev-123',
        deviceType: 'fitbit',
        dataPoints: 50,
        errorDetails: 'Connection reset'
      });
      expect(error.code).toBe('HEALTH_DEVICES_DATA_TRANSFER_ERROR');
    });

    it('should export UnsupportedDeviceError', () => {
      expect(UnsupportedDeviceError).toBeDefined();
      const error = new UnsupportedDeviceError('Unsupported device', {
        deviceId: 'dev-123',
        deviceType: 'unknown_device'
      });
      expect(error.code).toBe('HEALTH_DEVICES_UNSUPPORTED_DEVICE');
    });

    it('should export DeviceVersionMismatchError', () => {
      expect(DeviceVersionMismatchError).toBeDefined();
      const error = new DeviceVersionMismatchError('Version mismatch', {
        deviceId: 'dev-123',
        deviceType: 'fitbit',
        currentVersion: '1.0.0',
        requiredVersion: '2.0.0'
      });
      expect(error.code).toBe('HEALTH_DEVICES_VERSION_MISMATCH');
    });

    it('should export DeviceConnectionLostError', () => {
      expect(DeviceConnectionLostError).toBeDefined();
      const error = new DeviceConnectionLostError('Connection lost', {
        deviceId: 'dev-123',
        deviceType: 'garmin',
        lastActiveTimestamp: new Date()
      });
      expect(error.code).toBe('HEALTH_DEVICES_CONNECTION_LOST');
    });

    it('should export MaxConnectionAttemptsError', () => {
      expect(MaxConnectionAttemptsError).toBeDefined();
      const error = new MaxConnectionAttemptsError('Max attempts reached', {
        deviceId: 'dev-123',
        deviceType: 'fitbit',
        attempts: 5,
        maxAttempts: 3
      });
      expect(error.code).toBe('HEALTH_DEVICES_MAX_ATTEMPTS_REACHED');
    });
  });

  describe('Health Insights Errors', () => {
    // Import insights errors from the barrel file
    const {
      InsufficientDataError,
      PatternRecognitionFailureError,
      ContradictoryAdviceError,
      UnsupportedRecommendationError,
      AlgorithmFailureError,
      ProcessingTimeoutError,
      DataQualityError,
      ExternalIntegrationError
    } = HealthErrors;

    it('should export InsufficientDataError', () => {
      expect(InsufficientDataError).toBeDefined();
      const error = new InsufficientDataError('Insufficient data', {
        requiredDataPoints: 30,
        availableDataPoints: 5,
        metricType: 'heart_rate'
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_INSUFFICIENT_DATA');
    });

    it('should export PatternRecognitionFailureError', () => {
      expect(PatternRecognitionFailureError).toBeDefined();
      const error = new PatternRecognitionFailureError('Pattern recognition failed', {
        analysisMethod: 'time_series',
        metricType: 'blood_pressure',
        confidenceThreshold: 0.8,
        actualConfidence: 0.6
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_PATTERN_RECOGNITION_FAILURE');
    });

    it('should export ContradictoryAdviceError', () => {
      expect(ContradictoryAdviceError).toBeDefined();
      const error = new ContradictoryAdviceError('Contradictory advice', {
        recommendationId: 'rec-123',
        conflictingRecommendationId: 'rec-456',
        insightType: 'activity_level'
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_CONTRADICTORY_ADVICE');
    });

    it('should export UnsupportedRecommendationError', () => {
      expect(UnsupportedRecommendationError).toBeDefined();
      const error = new UnsupportedRecommendationError('Unsupported recommendation', {
        recommendationType: 'sleep_improvement',
        requiredDataTypes: ['sleep', 'activity'],
        missingDataTypes: ['sleep']
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_UNSUPPORTED_RECOMMENDATION');
    });

    it('should export AlgorithmFailureError', () => {
      expect(AlgorithmFailureError).toBeDefined();
      const error = new AlgorithmFailureError('Algorithm failure', {
        algorithmName: 'sleep_pattern_analysis',
        algorithmVersion: '1.2.0',
        failurePoint: 'data_normalization'
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_ALGORITHM_FAILURE');
    });

    it('should export ProcessingTimeoutError', () => {
      expect(ProcessingTimeoutError).toBeDefined();
      const error = new ProcessingTimeoutError('Processing timeout', {
        insightType: 'activity_correlation',
        processingTimeMs: 15000,
        timeoutThresholdMs: 10000
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_PROCESSING_TIMEOUT');
    });

    it('should export DataQualityError', () => {
      expect(DataQualityError).toBeDefined();
      const error = new DataQualityError('Data quality issues', {
        dataSource: 'fitbit',
        metricType: 'heart_rate',
        qualityIssues: ['gaps', 'outliers'],
        qualityScore: 0.6,
        minimumRequiredScore: 0.8
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_DATA_QUALITY');
    });

    it('should export ExternalIntegrationError', () => {
      expect(ExternalIntegrationError).toBeDefined();
      const error = new ExternalIntegrationError('External integration error', {
        externalSystem: 'nutrition_api',
        endpoint: '/api/v1/nutrients',
        statusCode: 503
      });
      expect(error.code).toBe('HEALTH_INSIGHTS_EXTERNAL_INTEGRATION');
    });
  });

  describe('FHIR Errors', () => {
    // Import FHIR errors from the barrel file
    const {
      FhirConnectionFailureError,
      FhirAuthenticationError,
      InvalidResourceError,
      UnsupportedResourceTypeError,
      ResourceParsingError,
      FhirOperationTimeoutError,
      ResourceNotFoundError,
      FhirOperationNotPermittedError,
      UnexpectedFhirResponseError,
      createFhirErrorFromStatusCode
    } = HealthErrors;

    it('should export FhirConnectionFailureError', () => {
      expect(FhirConnectionFailureError).toBeDefined();
      const error = new FhirConnectionFailureError('Connection failure', {
        endpoint: 'https://fhir.example.com/api/v4',
        operation: 'read'
      });
      expect(error.code).toBe('HEALTH_FHIR_CONNECTION_FAILURE');
    });

    it('should export FhirAuthenticationError', () => {
      expect(FhirAuthenticationError).toBeDefined();
      const error = new FhirAuthenticationError('Authentication error', {
        endpoint: 'https://fhir.example.com/api/v4',
        operation: 'search'
      });
      expect(error.code).toBe('HEALTH_FHIR_AUTHENTICATION_FAILURE');
    });

    it('should export InvalidResourceError', () => {
      expect(InvalidResourceError).toBeDefined();
      const error = new InvalidResourceError('Invalid resource', {
        resourceType: 'Patient',
        operation: 'create'
      });
      expect(error.code).toBe('HEALTH_FHIR_INVALID_RESOURCE');
    });

    it('should export UnsupportedResourceTypeError', () => {
      expect(UnsupportedResourceTypeError).toBeDefined();
      const error = new UnsupportedResourceTypeError('Unsupported resource type', {
        resourceType: 'DeviceDefinition',
        operation: 'read'
      });
      expect(error.code).toBe('HEALTH_FHIR_UNSUPPORTED_RESOURCE_TYPE');
    });

    it('should export ResourceParsingError', () => {
      expect(ResourceParsingError).toBeDefined();
      const error = new ResourceParsingError('Parsing error', {
        resourceType: 'Observation',
        operation: 'read',
        resourceId: 'obs-123'
      });
      expect(error.code).toBe('HEALTH_FHIR_PARSING_FAILURE');
    });

    it('should export FhirOperationTimeoutError', () => {
      expect(FhirOperationTimeoutError).toBeDefined();
      const error = new FhirOperationTimeoutError('Operation timeout', {
        resourceType: 'Patient',
        operation: 'search',
        endpoint: 'https://fhir.example.com/api/v4'
      });
      expect(error.code).toBe('HEALTH_FHIR_OPERATION_TIMEOUT');
    });

    it('should export ResourceNotFoundError', () => {
      expect(ResourceNotFoundError).toBeDefined();
      const error = new ResourceNotFoundError('Resource not found', {
        resourceType: 'Observation',
        operation: 'read',
        resourceId: 'obs-123'
      });
      expect(error.code).toBe('HEALTH_FHIR_RESOURCE_NOT_FOUND');
    });

    it('should export FhirOperationNotPermittedError', () => {
      expect(FhirOperationNotPermittedError).toBeDefined();
      const error = new FhirOperationNotPermittedError('Operation not permitted', {
        resourceType: 'Patient',
        operation: 'delete',
        resourceId: 'pat-123'
      });
      expect(error.code).toBe('HEALTH_FHIR_OPERATION_NOT_PERMITTED');
    });

    it('should export UnexpectedFhirResponseError', () => {
      expect(UnexpectedFhirResponseError).toBeDefined();
      const error = new UnexpectedFhirResponseError('Unexpected response', {
        resourceType: 'Observation',
        operation: 'search',
        endpoint: 'https://fhir.example.com/api/v4'
      }, 500);
      expect(error.code).toBe('HEALTH_FHIR_UNEXPECTED_RESPONSE');
    });

    it('should export createFhirErrorFromStatusCode utility', () => {
      expect(createFhirErrorFromStatusCode).toBeDefined();
      expect(typeof createFhirErrorFromStatusCode).toBe('function');
      
      // Test the utility function with different status codes
      const context = {
        resourceType: 'Patient',
        operation: 'read',
        endpoint: 'https://fhir.example.com/api/v4'
      };
      
      expect(createFhirErrorFromStatusCode('Error 401', context, 401)).toBeInstanceOf(FhirAuthenticationError);
      expect(createFhirErrorFromStatusCode('Error 404', context, 404)).toBeInstanceOf(ResourceNotFoundError);
      expect(createFhirErrorFromStatusCode('Error 408', context, 408)).toBeInstanceOf(FhirOperationTimeoutError);
      expect(createFhirErrorFromStatusCode('Error 422', context, 422)).toBeInstanceOf(InvalidResourceError);
      expect(createFhirErrorFromStatusCode('Error 400', context, 400)).toBeInstanceOf(InvalidResourceError);
      expect(createFhirErrorFromStatusCode('Error 409', context, 409)).toBeInstanceOf(FhirOperationNotPermittedError);
      expect(createFhirErrorFromStatusCode('Error 500', context, 500)).toBeInstanceOf(UnexpectedFhirResponseError);
    });
  });
});