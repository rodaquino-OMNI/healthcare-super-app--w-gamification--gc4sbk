import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Base interface for health metrics error details
 */
export interface HealthMetricErrorDetails {
  metricType?: string;
  metricValue?: number;
  metricUnit?: string;
  userId?: string;
  timestamp?: string;
  source?: string;
}

/**
 * Base class for all health metrics related errors
 */
export abstract class HealthMetricError extends AppException {
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(message, type, code, details, cause);
    Object.setPrototypeOf(this, HealthMetricError.prototype);
  }
}

/**
 * Error thrown when a metric value is invalid (out of range, wrong format, etc.)
 */
export class InvalidMetricValueError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(
      message || 'Invalid health metric value',
      ErrorType.VALIDATION,
      'HEALTH_METRICS_INVALID_VALUE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, InvalidMetricValueError.prototype);
  }
}

/**
 * Error thrown when a metric unit is invalid or incompatible with the metric type
 */
export class InvalidMetricUnitError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(
      message || 'Invalid or incompatible health metric unit',
      ErrorType.VALIDATION,
      'HEALTH_METRICS_INVALID_UNIT',
      details,
      cause,
    );
    Object.setPrototypeOf(this, InvalidMetricUnitError.prototype);
  }
}

/**
 * Error thrown when a metric timestamp is invalid (future date, too old, etc.)
 */
export class InvalidMetricTimestampError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(
      message || 'Invalid health metric timestamp',
      ErrorType.VALIDATION,
      'HEALTH_METRICS_INVALID_TIMESTAMP',
      details,
      cause,
    );
    Object.setPrototypeOf(this, InvalidMetricTimestampError.prototype);
  }
}

/**
 * Error thrown when a metric source is invalid or unsupported
 */
export class InvalidMetricSourceError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(
      message || 'Invalid or unsupported health metric source',
      ErrorType.VALIDATION,
      'HEALTH_METRICS_INVALID_SOURCE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, InvalidMetricSourceError.prototype);
  }
}

/**
 * Error thrown when a metric type is invalid or unsupported
 */
export class InvalidMetricTypeError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(
      message || 'Invalid or unsupported health metric type',
      ErrorType.VALIDATION,
      'HEALTH_METRICS_INVALID_TYPE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, InvalidMetricTypeError.prototype);
  }
}

/**
 * Error thrown when a metric exceeds a defined threshold
 */
export class MetricThresholdExceededError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { threshold?: number; thresholdType?: string },
    cause?: Error,
  ) {
    super(
      message || 'Health metric exceeds defined threshold',
      ErrorType.BUSINESS,
      'HEALTH_METRICS_THRESHOLD_EXCEEDED',
      details,
      cause,
    );
    Object.setPrototypeOf(this, MetricThresholdExceededError.prototype);
  }
}

/**
 * Error thrown when a metric conflicts with existing metrics
 */
export class ConflictingMetricError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { conflictingMetricId?: string },
    cause?: Error,
  ) {
    super(
      message || 'Health metric conflicts with existing data',
      ErrorType.BUSINESS,
      'HEALTH_METRICS_CONFLICT',
      details,
      cause,
    );
    Object.setPrototypeOf(this, ConflictingMetricError.prototype);
  }
}

/**
 * Error thrown when a metric cannot be stored due to technical issues
 */
export class MetricStorageError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails,
    cause?: Error,
  ) {
    super(
      message || 'Failed to store health metric',
      ErrorType.TECHNICAL,
      'HEALTH_METRICS_STORAGE_FAILURE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, MetricStorageError.prototype);
  }
}

/**
 * Error thrown when a metric cannot be processed due to technical issues
 */
export class MetricProcessingError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { operation?: string },
    cause?: Error,
  ) {
    super(
      message || 'Failed to process health metric',
      ErrorType.TECHNICAL,
      'HEALTH_METRICS_PROCESSING_FAILURE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, MetricProcessingError.prototype);
  }
}

/**
 * Error thrown when a metric cannot be retrieved due to technical issues
 */
export class MetricRetrievalError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { metricId?: string },
    cause?: Error,
  ) {
    super(
      message || 'Failed to retrieve health metric',
      ErrorType.TECHNICAL,
      'HEALTH_METRICS_RETRIEVAL_FAILURE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, MetricRetrievalError.prototype);
  }
}

/**
 * Error thrown when a wearable device fails to sync metrics
 */
export class WearableDeviceSyncError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { deviceId?: string; deviceType?: string },
    cause?: Error,
  ) {
    super(
      message || 'Failed to sync health metrics from wearable device',
      ErrorType.EXTERNAL,
      'HEALTH_METRICS_DEVICE_SYNC_FAILURE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, WearableDeviceSyncError.prototype);
  }
}

/**
 * Error thrown when an external health data source fails
 */
export class ExternalDataSourceError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { source?: string; sourceId?: string },
    cause?: Error,
  ) {
    super(
      message || 'Failed to retrieve health metrics from external data source',
      ErrorType.EXTERNAL,
      'HEALTH_METRICS_EXTERNAL_SOURCE_FAILURE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, ExternalDataSourceError.prototype);
  }
}

/**
 * Error thrown when a FHIR resource cannot be processed for health metrics
 */
export class FHIRResourceProcessingError extends HealthMetricError {
  constructor(
    message: string,
    details: HealthMetricErrorDetails & { resourceType?: string; resourceId?: string },
    cause?: Error,
  ) {
    super(
      message || 'Failed to process FHIR resource for health metrics',
      ErrorType.EXTERNAL,
      'HEALTH_METRICS_FHIR_PROCESSING_FAILURE',
      details,
      cause,
    );
    Object.setPrototypeOf(this, FHIRResourceProcessingError.prototype);
  }
}