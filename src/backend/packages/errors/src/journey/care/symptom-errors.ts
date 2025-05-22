/**
 * @file symptom-errors.ts
 * @description Specialized error classes for the Symptom Checker domain in the Care journey
 */

import { AppException, ErrorType } from '@app/shared/exceptions';

/**
 * Error code prefix for symptom checker errors
 */
const SYMPTOM_ERROR_PREFIX = 'CARE_SYMPTOM';

/**
 * Error thrown when a requested symptom is not found in the system
 */
export class SymptomNotFoundError extends AppException {
  /**
   * Creates a new SymptomNotFoundError instance
   * 
   * @param symptomId - The ID of the symptom that was not found
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    symptomId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Symptom with ID '${symptomId}' not found in the system`,
      ErrorType.BUSINESS,
      `${SYMPTOM_ERROR_PREFIX}_001`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a symptom assessment is incomplete or invalid
 */
export class SymptomAssessmentIncompleteError extends AppException {
  /**
   * Creates a new SymptomAssessmentIncompleteError instance
   * 
   * @param message - Specific validation error message
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    message: string = 'Symptom assessment is incomplete or invalid',
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      `${SYMPTOM_ERROR_PREFIX}_002`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when the symptom diagnosis engine encounters a functional error
 */
export class SymptomEngineFunctionError extends AppException {
  /**
   * Creates a new SymptomEngineFunctionError instance
   * 
   * @param message - Specific error message
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    message: string = 'Symptom diagnosis engine encountered an error',
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      `${SYMPTOM_ERROR_PREFIX}_003`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when urgent care is recommended based on symptom assessment
 * This is a business error that indicates the user should seek immediate medical attention
 */
export class UrgentCareRecommendationError extends AppException {
  /**
   * Creates a new UrgentCareRecommendationError instance
   * 
   * @param symptoms - List of critical symptoms that triggered the recommendation
   * @param emergencyNumber - Emergency contact number for the user's region
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    symptoms: string[],
    emergencyNumber?: string,
    details?: any,
    cause?: Error
  ) {
    super(
      'Urgent medical attention is recommended based on your symptoms',
      ErrorType.BUSINESS,
      `${SYMPTOM_ERROR_PREFIX}_004`,
      {
        criticalSymptoms: symptoms,
        emergencyNumber,
        ...details
      },
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in persisting symptom assessment data
 */
export class SymptomPersistenceError extends AppException {
  /**
   * Creates a new SymptomPersistenceError instance
   * 
   * @param operation - The database operation that failed
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    operation: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} symptom assessment data`,
      ErrorType.TECHNICAL,
      `${SYMPTOM_ERROR_PREFIX}_005`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in the integration with external medical knowledge base
 */
export class MedicalKnowledgeBaseError extends AppException {
  /**
   * Creates a new MedicalKnowledgeBaseError instance
   * 
   * @param provider - The name of the external knowledge base provider
   * @param details - Additional error details (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(
    provider: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to retrieve data from medical knowledge base: ${provider}`,
      ErrorType.EXTERNAL,
      `${SYMPTOM_ERROR_PREFIX}_006`,
      details,
      cause
    );
  }
}