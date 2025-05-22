import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Base class for health metrics-related errors.
 * Extends the AppException class with health metrics-specific context.
 */
export abstract class HealthMetricsError extends AppException {
  /**
   * Creates a new HealthMetricsError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code with HEALTH_METRICS_ prefix
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, type, code, details, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthMetricsError.prototype);
  }
}

/**
 * Error thrown when a metric value is invalid (out of range, wrong format, etc.)
 */
export class InvalidMetricValueError extends HealthMetricsError {
  /**
   * Creates a new InvalidMetricValueError instance.
   * 
   * @param metricType - Type of health metric (e.g., 'blood_pressure', 'heart_rate')
   * @param value - The invalid value that was provided
   * @param expectedFormat - Description of the expected format or range
   * @param details - Additional details about the validation failure (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly metricType: string,
    public readonly value: any,
    public readonly expectedFormat: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Invalid value for ${metricType}: ${value}. Expected: ${expectedFormat}`,
      ErrorType.VALIDATION,
      'HEALTH_METRICS_INVALID_VALUE',
      { metricType, value, expectedFormat, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidMetricValueError.prototype);
  }
}

/**
 * Error thrown when a metric value exceeds defined thresholds
 */
export class MetricThresholdExceededError extends HealthMetricsError {
  /**
   * Creates a new MetricThresholdExceededError instance.
   * 
   * @param metricType - Type of health metric (e.g., 'blood_pressure', 'heart_rate')
   * @param value - The value that exceeded the threshold
   * @param threshold - The threshold that was exceeded
   * @param thresholdType - Type of threshold ('upper', 'lower', 'critical')
   * @param details - Additional details about the threshold violation (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly metricType: string,
    public readonly value: any,
    public readonly threshold: any,
    public readonly thresholdType: 'upper' | 'lower' | 'critical',
    details?: any,
    cause?: Error
  ) {
    super(
      `${metricType} value ${value} exceeds ${thresholdType} threshold of ${threshold}`,
      ErrorType.BUSINESS,
      'HEALTH_METRICS_THRESHOLD_EXCEEDED',
      { metricType, value, threshold, thresholdType, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MetricThresholdExceededError.prototype);
  }
}

/**
 * Error thrown when conflicting metrics are detected
 */
export class ConflictingMetricsError extends HealthMetricsError {
  /**
   * Creates a new ConflictingMetricsError instance.
   * 
   * @param metricType - Type of health metric (e.g., 'blood_pressure', 'heart_rate')
   * @param conflictReason - Description of why the metrics conflict
   * @param conflictingMetrics - Array of conflicting metric objects
   * @param details - Additional details about the conflict (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly metricType: string,
    public readonly conflictReason: string,
    public readonly conflictingMetrics: any[],
    details?: any,
    cause?: Error
  ) {
    super(
      `Conflicting ${metricType} metrics detected: ${conflictReason}`,
      ErrorType.BUSINESS,
      'HEALTH_METRICS_CONFLICT',
      { metricType, conflictReason, conflictingMetrics, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConflictingMetricsError.prototype);
  }
}

/**
 * Error thrown when a metric cannot be stored or processed
 */
export class MetricProcessingError extends HealthMetricsError {
  /**
   * Creates a new MetricProcessingError instance.
   * 
   * @param metricType - Type of health metric (e.g., 'blood_pressure', 'heart_rate')
   * @param operation - The operation that failed (e.g., 'store', 'update', 'delete')
   * @param reason - Description of why the operation failed
   * @param details - Additional details about the processing failure (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly metricType: string,
    public readonly operation: string,
    public readonly reason: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} ${metricType} metric: ${reason}`,
      ErrorType.TECHNICAL,
      'HEALTH_METRICS_PROCESSING_FAILED',
      { metricType, operation, reason, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MetricProcessingError.prototype);
  }
}

/**
 * Error thrown when a metric source (device, API) fails
 */
export class MetricSourceError extends HealthMetricsError {
  /**
   * Creates a new MetricSourceError instance.
   * 
   * @param source - The source of the metric (e.g., 'fitbit', 'apple_health', 'manual')
   * @param metricType - Type of health metric (e.g., 'blood_pressure', 'heart_rate')
   * @param errorCode - Error code from the external system, if available
   * @param reason - Description of why the source failed
   * @param details - Additional details about the source failure (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly source: string,
    public readonly metricType: string,
    public readonly errorCode: string | null,
    public readonly reason: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to retrieve ${metricType} from ${source}: ${reason}`,
      ErrorType.EXTERNAL,
      'HEALTH_METRICS_SOURCE_FAILED',
      { source, metricType, errorCode, reason, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MetricSourceError.prototype);
  }
}

/**
 * Error thrown when a metric cannot be synchronized
 */
export class MetricSynchronizationError extends HealthMetricsError {
  /**
   * Creates a new MetricSynchronizationError instance.
   * 
   * @param source - The source of the metric (e.g., 'fitbit', 'apple_health')
   * @param metricType - Type of health metric (e.g., 'blood_pressure', 'heart_rate')
   * @param syncDirection - Direction of synchronization ('import', 'export', 'bidirectional')
   * @param reason - Description of why the synchronization failed
   * @param details - Additional details about the synchronization failure (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly source: string,
    public readonly metricType: string,
    public readonly syncDirection: 'import' | 'export' | 'bidirectional',
    public readonly reason: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to ${syncDirection === 'import' ? 'import' : syncDirection === 'export' ? 'export' : 'sync'} ${metricType} ${syncDirection === 'import' ? 'from' : syncDirection === 'export' ? 'to' : 'with'} ${source}: ${reason}`,
      ErrorType.EXTERNAL,
      'HEALTH_METRICS_SYNC_FAILED',
      { source, metricType, syncDirection, reason, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MetricSynchronizationError.prototype);
  }
}

/**
 * Error thrown when a metric goal validation fails
 */
export class MetricGoalValidationError extends HealthMetricsError {
  /**
   * Creates a new MetricGoalValidationError instance.
   * 
   * @param metricType - Type of health metric (e.g., 'steps', 'calories')
   * @param goalValue - The invalid goal value
   * @param validationIssue - Description of the validation issue
   * @param details - Additional details about the validation failure (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly metricType: string,
    public readonly goalValue: any,
    public readonly validationIssue: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Invalid goal for ${metricType}: ${goalValue}. Issue: ${validationIssue}`,
      ErrorType.VALIDATION,
      'HEALTH_METRICS_GOAL_INVALID',
      { metricType, goalValue, validationIssue, ...details },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MetricGoalValidationError.prototype);
  }
}