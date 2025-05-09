import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Base class for all health insights related errors.
 * Provides common structure and behavior for insight generation errors.
 */
export abstract class HealthInsightError extends AppException {
  /**
   * Creates a new HealthInsightError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Specific error code with HEALTH_INSIGHTS_ prefix
   * @param details - Additional context about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, `HEALTH_INSIGHTS_${code}`, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthInsightError.prototype);
  }
}

/**
 * Error thrown when there is insufficient data to generate health insights.
 * This can occur when the user has too few data points or when the data
 * quality is too low for meaningful analysis.
 */
export class InsufficientDataError extends HealthInsightError {
  /**
   * Creates a new InsufficientDataError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the data requirements
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Insufficient data to generate health insights',
    details?: {
      requiredDataPoints?: number;
      availableDataPoints?: number;
      dataSource?: string;
      metricType?: string;
      minimumHistoryDays?: number;
      availableHistoryDays?: number;
    },
    cause?: Error
  ) {
    super(message, 'INSUFFICIENT_DATA', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InsufficientDataError.prototype);
  }
}

/**
 * Error thrown when the system fails to recognize patterns in health data.
 * This can occur due to high variability, inconsistent data collection,
 * or when patterns are too complex for the current algorithms.
 */
export class PatternRecognitionFailureError extends HealthInsightError {
  /**
   * Creates a new PatternRecognitionFailureError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the pattern recognition attempt
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to recognize patterns in health data',
    details?: {
      analysisMethod?: string;
      dataSource?: string;
      metricType?: string;
      timeRange?: { start: Date; end: Date };
      variabilityScore?: number;
      confidenceThreshold?: number;
      actualConfidence?: number;
    },
    cause?: Error
  ) {
    super(message, 'PATTERN_RECOGNITION_FAILURE', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PatternRecognitionFailureError.prototype);
  }
}

/**
 * Error thrown when the system generates contradictory health recommendations.
 * This can occur when different analysis methods produce conflicting advice
 * or when new data contradicts previously generated recommendations.
 */
export class ContradictoryAdviceError extends HealthInsightError {
  /**
   * Creates a new ContradictoryAdviceError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the contradictory recommendations
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Generated contradictory health recommendations',
    details?: {
      recommendationId?: string;
      conflictingRecommendationId?: string;
      insightType?: string;
      contradictionReason?: string;
      dataSource?: string;
      analysisMethod?: string;
    },
    cause?: Error
  ) {
    super(message, 'CONTRADICTORY_ADVICE', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ContradictoryAdviceError.prototype);
  }
}

/**
 * Error thrown when a health recommendation cannot be supported by available data.
 * This can occur when the system attempts to generate a recommendation
 * but lacks sufficient evidence or context to justify it.
 */
export class UnsupportedRecommendationError extends HealthInsightError {
  /**
   * Creates a new UnsupportedRecommendationError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the unsupported recommendation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Cannot generate recommendation with available data',
    details?: {
      recommendationType?: string;
      requiredDataTypes?: string[];
      missingDataTypes?: string[];
      confidenceThreshold?: number;
      actualConfidence?: number;
      insightType?: string;
    },
    cause?: Error
  ) {
    super(message, 'UNSUPPORTED_RECOMMENDATION', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnsupportedRecommendationError.prototype);
  }
}

/**
 * Error thrown when an insight generation algorithm fails to execute properly.
 * This is a technical error that indicates a problem with the algorithm itself
 * rather than with the input data.
 */
export class AlgorithmFailureError extends HealthInsightError {
  /**
   * Creates a new AlgorithmFailureError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the algorithm failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Health insight algorithm failed to execute',
    details?: {
      algorithmName?: string;
      algorithmVersion?: string;
      insightType?: string;
      parameters?: Record<string, any>;
      failurePoint?: string;
      errorCode?: string;
    },
    cause?: Error
  ) {
    super(message, 'ALGORITHM_FAILURE', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AlgorithmFailureError.prototype);
  }
}

/**
 * Error thrown when insight processing exceeds the allocated time limit.
 * This can occur due to complex calculations, large data volumes,
 * or resource constraints in the processing environment.
 */
export class ProcessingTimeoutError extends HealthInsightError {
  /**
   * Creates a new ProcessingTimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the processing timeout
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Health insight processing exceeded time limit',
    details?: {
      insightType?: string;
      processingTimeMs?: number;
      timeoutThresholdMs?: number;
      dataVolume?: number;
      processingStage?: string;
      resourceUtilization?: Record<string, number>;
    },
    cause?: Error
  ) {
    super(message, 'PROCESSING_TIMEOUT', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProcessingTimeoutError.prototype);
  }
}

/**
 * Error thrown when data quality issues prevent insight generation.
 * This can occur when data contains outliers, gaps, or inconsistencies
 * that make it unsuitable for analysis.
 */
export class DataQualityError extends HealthInsightError {
  /**
   * Creates a new DataQualityError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the data quality issues
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Data quality issues prevent insight generation',
    details?: {
      dataSource?: string;
      metricType?: string;
      qualityIssues?: string[];
      outlierCount?: number;
      gapCount?: number;
      inconsistencyDetails?: Record<string, any>;
      qualityScore?: number;
      minimumRequiredScore?: number;
    },
    cause?: Error
  ) {
    super(message, 'DATA_QUALITY', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DataQualityError.prototype);
  }
}

/**
 * Error thrown when insight generation fails due to external system integration issues.
 * This can occur when the system cannot access required external data sources
 * or when external APIs return unexpected responses.
 */
export class ExternalIntegrationError extends HealthInsightError {
  /**
   * Creates a new ExternalIntegrationError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing information about the external integration issue
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'External system integration failed during insight generation',
    details?: {
      externalSystem?: string;
      endpoint?: string;
      requestId?: string;
      statusCode?: number;
      errorResponse?: Record<string, any>;
      insightType?: string;
      requiredData?: string[];
    },
    cause?: Error
  ) {
    super(message, 'EXTERNAL_INTEGRATION', details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalIntegrationError.prototype);
  }
}