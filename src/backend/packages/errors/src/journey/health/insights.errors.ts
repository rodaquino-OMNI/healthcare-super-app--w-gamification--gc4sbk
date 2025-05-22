import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

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
   * @param type - Type of error from ErrorType enum
   * @param details - Additional context about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    type: ErrorType,
    details?: any,
    cause?: Error
  ) {
    super(message, type, code, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthInsightError.prototype);
  }
}

/**
 * Error thrown when there is insufficient data to generate health insights.
 * This typically occurs when the user has not provided enough health metrics
 * or when the available data points are too sparse for meaningful analysis.
 */
export class InsufficientDataError extends HealthInsightError {
  /**
   * Creates a new InsufficientDataError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the insufficient data
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Insufficient data to generate health insights',
    details?: {
      requiredDataPoints?: number;
      availableDataPoints?: number;
      dataType?: string;
      timeRange?: { start: Date; end: Date };
      userId?: string;
      metricTypes?: string[];
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_INSUFFICIENT_DATA',
      ErrorType.BUSINESS,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InsufficientDataError.prototype);
  }
}

/**
 * Error thrown when the system fails to recognize patterns in health data.
 * This can occur due to inconsistent data, conflicting metrics, or when
 * patterns are too subtle to be detected by the current algorithms.
 */
export class PatternRecognitionFailureError extends HealthInsightError {
  /**
   * Creates a new PatternRecognitionFailureError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the pattern recognition failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to recognize patterns in health data',
    details?: {
      analysisMethod?: string;
      dataQualityIssues?: string[];
      metricTypes?: string[];
      timeRange?: { start: Date; end: Date };
      userId?: string;
      confidenceScore?: number;
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_PATTERN_RECOGNITION_FAILURE',
      ErrorType.TECHNICAL,
      details,
      cause
    );
    
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
   * @param details - Object containing context about the contradictory advice
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Generated contradictory health recommendations',
    details?: {
      recommendationTypes?: string[];
      conflictingRecommendations?: { id: string; advice: string }[];
      analysisMethod?: string;
      dataSourceIds?: string[];
      userId?: string;
      severity?: 'low' | 'medium' | 'high';
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_CONTRADICTORY_ADVICE',
      ErrorType.BUSINESS,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ContradictoryAdviceError.prototype);
  }
}

/**
 * Error thrown when a health recommendation cannot be supported by available data.
 * This occurs when the system attempts to generate a recommendation but lacks
 * sufficient evidence or when the recommendation type is not applicable to the user.
 */
export class UnsupportedRecommendationError extends HealthInsightError {
  /**
   * Creates a new UnsupportedRecommendationError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the unsupported recommendation
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Cannot generate recommendation with available data',
    details?: {
      recommendationType?: string;
      requiredDataTypes?: string[];
      availableDataTypes?: string[];
      userId?: string;
      reasonCode?: string;
      alternativeRecommendationTypes?: string[];
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_UNSUPPORTED_RECOMMENDATION',
      ErrorType.BUSINESS,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnsupportedRecommendationError.prototype);
  }
}

/**
 * Error thrown when insight generation algorithms fail to process health data.
 * This can occur due to algorithm implementation issues, unexpected data formats,
 * or when the algorithm encounters edge cases it cannot handle.
 */
export class AlgorithmFailureError extends HealthInsightError {
  /**
   * Creates a new AlgorithmFailureError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the algorithm failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Health insight algorithm failed to process data',
    details?: {
      algorithmName?: string;
      algorithmVersion?: string;
      inputDataTypes?: string[];
      processingStage?: string;
      errorCode?: string;
      userId?: string;
      technicalDetails?: Record<string, any>;
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_ALGORITHM_FAILURE',
      ErrorType.TECHNICAL,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AlgorithmFailureError.prototype);
  }
}

/**
 * Error thrown when insight processing takes too long and exceeds timeout thresholds.
 * This can occur due to complex data analysis, system overload, or inefficient algorithms.
 */
export class ProcessingTimeoutError extends HealthInsightError {
  /**
   * Creates a new ProcessingTimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the processing timeout
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Health insight processing timed out',
    details?: {
      processingStage?: string;
      timeoutThreshold?: number; // in milliseconds
      actualDuration?: number; // in milliseconds
      insightType?: string;
      dataVolume?: number; // number of data points being processed
      userId?: string;
      operationId?: string;
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_PROCESSING_TIMEOUT',
      ErrorType.TECHNICAL,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ProcessingTimeoutError.prototype);
  }
}

/**
 * Error thrown when data quality issues prevent reliable insight generation.
 * This can occur due to inconsistent measurements, corrupted data, or
 * when data from different sources cannot be reliably correlated.
 */
export class DataQualityError extends HealthInsightError {
  /**
   * Creates a new DataQualityError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the data quality issues
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Data quality issues prevent reliable insight generation',
    details?: {
      qualityIssues?: string[];
      affectedDataTypes?: string[];
      dataSourceIds?: string[];
      timeRange?: { start: Date; end: Date };
      userId?: string;
      recommendedAction?: string;
      severity?: 'low' | 'medium' | 'high';
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_DATA_QUALITY',
      ErrorType.BUSINESS,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DataQualityError.prototype);
  }
}

/**
 * Error thrown when external health data integration fails during insight generation.
 * This can occur when FHIR systems, wearable device APIs, or other external
 * health data sources are unavailable or return invalid data.
 */
export class ExternalIntegrationError extends HealthInsightError {
  /**
   * Creates a new ExternalIntegrationError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Object containing context about the external integration failure
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'External health data integration failed during insight generation',
    details?: {
      integrationSource?: string;
      sourceSystem?: string;
      errorResponse?: any;
      requestId?: string;
      endpoint?: string;
      userId?: string;
      retryable?: boolean;
      retryAttempts?: number;
    },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_INSIGHTS_EXTERNAL_INTEGRATION',
      ErrorType.EXTERNAL,
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalIntegrationError.prototype);
  }
}

/**
 * Utility functions for working with health insight errors
 */
export const HealthInsightErrorUtils = {
  /**
   * Determines if an error is a health insight error
   * 
   * @param error - The error to check
   * @returns True if the error is a health insight error, false otherwise
   */
  isHealthInsightError(error: any): error is HealthInsightError {
    return error instanceof HealthInsightError;
  },

  /**
   * Creates a user-friendly error message from a health insight error
   * 
   * @param error - The health insight error
   * @returns A user-friendly error message
   */
  createUserFriendlyMessage(error: HealthInsightError): string {
    // Default message if we can't create a more specific one
    let message = 'Unable to generate health insights at this time.';

    if (error instanceof InsufficientDataError) {
      message = 'We need more health data to generate accurate insights. Please sync your devices or add more health metrics.';
    } else if (error instanceof PatternRecognitionFailureError) {
      message = 'We couldn\'t identify clear patterns in your health data. This might be due to inconsistent measurements or gaps in data.';
    } else if (error instanceof ContradictoryAdviceError) {
      message = 'We found conflicting patterns in your health data. Please consult with a healthcare professional for personalized advice.';
    } else if (error instanceof UnsupportedRecommendationError) {
      message = 'We don\'t have enough information to provide this type of health recommendation yet.';
    } else if (error instanceof DataQualityError) {
      message = 'There may be issues with the quality of your health data. Please check your device connections and measurement consistency.';
    } else if (error instanceof ExternalIntegrationError) {
      message = 'We couldn\'t connect to an external health system needed for this insight. Please try again later.';
    } else if (error instanceof AlgorithmFailureError || error instanceof ProcessingTimeoutError) {
      message = 'We encountered a technical issue while analyzing your health data. Our team has been notified and is working on a solution.';
    }

    return message;
  },

  /**
   * Determines if a health insight error is retryable
   * 
   * @param error - The health insight error
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(error: HealthInsightError): boolean {
    // Technical and external errors are generally retryable
    if (error.type === ErrorType.TECHNICAL || error.type === ErrorType.EXTERNAL) {
      // Processing timeouts and external integration errors are retryable
      return error instanceof ProcessingTimeoutError || 
             error instanceof ExternalIntegrationError ||
             error instanceof AlgorithmFailureError;
    }
    
    // Business logic errors are generally not retryable without changing inputs
    return false;
  }
};