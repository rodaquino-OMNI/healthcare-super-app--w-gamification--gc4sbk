import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import {
  HealthMetricError,
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
  FHIRResourceProcessingError,
  HealthMetricErrorDetails
} from '../../../../src/journey/health/metrics.errors';

describe('Health Metrics Error Classes', () => {
  // Common test data
  const testMessage = 'Test error message';
  const testDetails: HealthMetricErrorDetails = {
    metricType: 'bloodPressure',
    metricValue: 120,
    metricUnit: 'mmHg',
    userId: 'user123',
    timestamp: '2023-05-15T10:30:00Z',
    source: 'manual'
  };
  const testCause = new Error('Original error');

  // Helper function to test common error properties
  const testErrorProperties = (
    error: HealthMetricError,
    expectedType: ErrorType,
    expectedCodePrefix: string,
    expectedDetails: any
  ) => {
    expect(error).toBeInstanceOf(HealthMetricError);
    expect(error.message).toBe(testMessage);
    expect(error.type).toBe(expectedType);
    expect(error.code).toContain(expectedCodePrefix);
    expect(error.details).toEqual(expectedDetails);
    expect(error.cause).toBe(testCause);
  };

  // Helper function to test HTTP status code mapping
  const testHttpStatusCode = (
    error: HealthMetricError,
    expectedStatus: HttpStatus
  ) => {
    const httpException = error.toHttpException();
    expect(httpException.getStatus()).toBe(expectedStatus);
  };

  describe('Validation Errors', () => {
    it('should create InvalidMetricValueError with correct properties', () => {
      const error = new InvalidMetricValueError(testMessage, testDetails, testCause);
      
      testErrorProperties(error, ErrorType.VALIDATION, 'HEALTH_METRICS_INVALID_VALUE', testDetails);
      testHttpStatusCode(error, HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidMetricUnitError with correct properties', () => {
      const error = new InvalidMetricUnitError(testMessage, testDetails, testCause);
      
      testErrorProperties(error, ErrorType.VALIDATION, 'HEALTH_METRICS_INVALID_UNIT', testDetails);
      testHttpStatusCode(error, HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidMetricTimestampError with correct properties', () => {
      const error = new InvalidMetricTimestampError(testMessage, testDetails, testCause);
      
      testErrorProperties(error, ErrorType.VALIDATION, 'HEALTH_METRICS_INVALID_TIMESTAMP', testDetails);
      testHttpStatusCode(error, HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidMetricSourceError with correct properties', () => {
      const error = new InvalidMetricSourceError(testMessage, testDetails, testCause);
      
      testErrorProperties(error, ErrorType.VALIDATION, 'HEALTH_METRICS_INVALID_SOURCE', testDetails);
      testHttpStatusCode(error, HttpStatus.BAD_REQUEST);
    });

    it('should create InvalidMetricTypeError with correct properties', () => {
      const error = new InvalidMetricTypeError(testMessage, testDetails, testCause);
      
      testErrorProperties(error, ErrorType.VALIDATION, 'HEALTH_METRICS_INVALID_TYPE', testDetails);
      testHttpStatusCode(error, HttpStatus.BAD_REQUEST);
    });
  });

  describe('Business Logic Errors', () => {
    it('should create MetricThresholdExceededError with correct properties', () => {
      const thresholdDetails = {
        ...testDetails,
        threshold: 140,
        thresholdType: 'upper'
      };
      const error = new MetricThresholdExceededError(testMessage, thresholdDetails, testCause);
      
      testErrorProperties(error, ErrorType.BUSINESS, 'HEALTH_METRICS_THRESHOLD_EXCEEDED', thresholdDetails);
      testHttpStatusCode(error, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create ConflictingMetricError with correct properties', () => {
      const conflictDetails = {
        ...testDetails,
        conflictingMetricId: 'metric456'
      };
      const error = new ConflictingMetricError(testMessage, conflictDetails, testCause);
      
      testErrorProperties(error, ErrorType.BUSINESS, 'HEALTH_METRICS_CONFLICT', conflictDetails);
      testHttpStatusCode(error, HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Technical Errors', () => {
    it('should create MetricStorageError with correct properties', () => {
      const error = new MetricStorageError(testMessage, testDetails, testCause);
      
      testErrorProperties(error, ErrorType.TECHNICAL, 'HEALTH_METRICS_STORAGE_FAILURE', testDetails);
      testHttpStatusCode(error, HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should create MetricProcessingError with correct properties', () => {
      const processingDetails = {
        ...testDetails,
        operation: 'aggregation'
      };
      const error = new MetricProcessingError(testMessage, processingDetails, testCause);
      
      testErrorProperties(error, ErrorType.TECHNICAL, 'HEALTH_METRICS_PROCESSING_FAILURE', processingDetails);
      testHttpStatusCode(error, HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should create MetricRetrievalError with correct properties', () => {
      const retrievalDetails = {
        ...testDetails,
        metricId: 'metric789'
      };
      const error = new MetricRetrievalError(testMessage, retrievalDetails, testCause);
      
      testErrorProperties(error, ErrorType.TECHNICAL, 'HEALTH_METRICS_RETRIEVAL_FAILURE', retrievalDetails);
      testHttpStatusCode(error, HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('External System Errors', () => {
    it('should create WearableDeviceSyncError with correct properties', () => {
      const deviceDetails = {
        ...testDetails,
        deviceId: 'device123',
        deviceType: 'fitbit'
      };
      const error = new WearableDeviceSyncError(testMessage, deviceDetails, testCause);
      
      testErrorProperties(error, ErrorType.EXTERNAL, 'HEALTH_METRICS_DEVICE_SYNC_FAILURE', deviceDetails);
      testHttpStatusCode(error, HttpStatus.BAD_GATEWAY);
    });

    it('should create ExternalDataSourceError with correct properties', () => {
      const sourceDetails = {
        ...testDetails,
        source: 'healthKit',
        sourceId: 'source123'
      };
      const error = new ExternalDataSourceError(testMessage, sourceDetails, testCause);
      
      testErrorProperties(error, ErrorType.EXTERNAL, 'HEALTH_METRICS_EXTERNAL_SOURCE_FAILURE', sourceDetails);
      testHttpStatusCode(error, HttpStatus.BAD_GATEWAY);
    });

    it('should create FHIRResourceProcessingError with correct properties', () => {
      const fhirDetails = {
        ...testDetails,
        resourceType: 'Observation',
        resourceId: 'obs123'
      };
      const error = new FHIRResourceProcessingError(testMessage, fhirDetails, testCause);
      
      testErrorProperties(error, ErrorType.EXTERNAL, 'HEALTH_METRICS_FHIR_PROCESSING_FAILURE', fhirDetails);
      testHttpStatusCode(error, HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize error to JSON with all details', () => {
      const error = new InvalidMetricValueError(testMessage, testDetails, testCause);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'HEALTH_METRICS_INVALID_VALUE',
          message: testMessage,
          details: testDetails
        }
      });
    });

    it('should include extended details in serialized error', () => {
      const thresholdDetails = {
        ...testDetails,
        threshold: 140,
        thresholdType: 'upper'
      };
      const error = new MetricThresholdExceededError(testMessage, thresholdDetails, testCause);
      const json = error.toJSON();
      
      expect(json.error.details).toEqual(thresholdDetails);
      expect(json.error.details.threshold).toBe(140);
      expect(json.error.details.thresholdType).toBe('upper');
    });
  });

  describe('Default Error Messages', () => {
    it('should use default message when no message is provided', () => {
      const error = new InvalidMetricValueError('', testDetails);
      expect(error.message).toBe('Invalid health metric value');
    });

    it('should use default message for MetricThresholdExceededError', () => {
      const thresholdDetails = {
        ...testDetails,
        threshold: 140,
        thresholdType: 'upper'
      };
      const error = new MetricThresholdExceededError('', thresholdDetails);
      expect(error.message).toBe('Health metric exceeds defined threshold');
    });

    it('should use default message for WearableDeviceSyncError', () => {
      const deviceDetails = {
        ...testDetails,
        deviceId: 'device123',
        deviceType: 'fitbit'
      };
      const error = new WearableDeviceSyncError('', deviceDetails);
      expect(error.message).toBe('Failed to sync health metrics from wearable device');
    });
  });

  describe('Error Classification', () => {
    it('should classify validation errors correctly', () => {
      const errors = [
        new InvalidMetricValueError(testMessage, testDetails),
        new InvalidMetricUnitError(testMessage, testDetails),
        new InvalidMetricTimestampError(testMessage, testDetails),
        new InvalidMetricSourceError(testMessage, testDetails),
        new InvalidMetricTypeError(testMessage, testDetails)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    it('should classify business errors correctly', () => {
      const thresholdDetails = { ...testDetails, threshold: 140, thresholdType: 'upper' };
      const conflictDetails = { ...testDetails, conflictingMetricId: 'metric456' };
      
      const errors = [
        new MetricThresholdExceededError(testMessage, thresholdDetails),
        new ConflictingMetricError(testMessage, conflictDetails)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });

    it('should classify technical errors correctly', () => {
      const processingDetails = { ...testDetails, operation: 'aggregation' };
      const retrievalDetails = { ...testDetails, metricId: 'metric789' };
      
      const errors = [
        new MetricStorageError(testMessage, testDetails),
        new MetricProcessingError(testMessage, processingDetails),
        new MetricRetrievalError(testMessage, retrievalDetails)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });

    it('should classify external system errors correctly', () => {
      const deviceDetails = { ...testDetails, deviceId: 'device123', deviceType: 'fitbit' };
      const sourceDetails = { ...testDetails, source: 'healthKit', sourceId: 'source123' };
      const fhirDetails = { ...testDetails, resourceType: 'Observation', resourceId: 'obs123' };
      
      const errors = [
        new WearableDeviceSyncError(testMessage, deviceDetails),
        new ExternalDataSourceError(testMessage, sourceDetails),
        new FHIRResourceProcessingError(testMessage, fhirDetails)
      ];
      
      errors.forEach(error => {
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });
  });
});