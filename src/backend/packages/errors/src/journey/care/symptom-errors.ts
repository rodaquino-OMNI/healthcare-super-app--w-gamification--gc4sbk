import { AppException, ErrorType } from '@austa/interfaces/common/exceptions';

/**
 * Error code constants for symptom checker errors.
 * These codes provide a consistent error identification system.
 */
export const SYMPTOM_ERROR_CODES = {
  // Validation errors (400 Bad Request)
  SYMPTOM_ASSESSMENT_INCOMPLETE: 'CARE_SYMPTOM_001',
  SYMPTOM_INVALID_FORMAT: 'CARE_SYMPTOM_002',
  
  // Business errors (422 Unprocessable Entity)
  SYMPTOM_NOT_FOUND: 'CARE_SYMPTOM_101',
  URGENT_CARE_RECOMMENDATION: 'CARE_SYMPTOM_102',
  SYMPTOM_ANALYSIS_INCONCLUSIVE: 'CARE_SYMPTOM_103',
  
  // Technical errors (500 Internal Server Error)
  SYMPTOM_ENGINE_FUNCTION: 'CARE_SYMPTOM_201',
  SYMPTOM_PERSISTENCE: 'CARE_SYMPTOM_202',
  
  // External errors (502 Bad Gateway)
  MEDICAL_KNOWLEDGE_BASE: 'CARE_SYMPTOM_301',
  EXTERNAL_SYMPTOM_API: 'CARE_SYMPTOM_302'
};

/**
 * Error thrown when a symptom identifier is not found in the system.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class SymptomNotFoundError extends AppException {
  /**
   * Creates a new SymptomNotFoundError instance.
   * 
   * @param symptomId - The symptom identifier that was not found
   * @param details - Additional details about the error (optional)
   */
  constructor(symptomId: string, details?: any) {
    super(
      `Symptom identifier '${symptomId}' not found in the system`,
      ErrorType.BUSINESS,
      SYMPTOM_ERROR_CODES.SYMPTOM_NOT_FOUND,
      details
    );
  }
}

/**
 * Error thrown when a symptom assessment is incomplete or missing required data.
 * This is a validation error (400 Bad Request).
 */
export class SymptomAssessmentIncompleteError extends AppException {
  /**
   * Creates a new SymptomAssessmentIncompleteError instance.
   * 
   * @param message - Specific message about what data is missing
   * @param details - Additional details about the error (optional)
   */
  constructor(message: string, details?: any) {
    super(
      message || 'Symptom assessment is incomplete or missing required data',
      ErrorType.VALIDATION,
      SYMPTOM_ERROR_CODES.SYMPTOM_ASSESSMENT_INCOMPLETE,
      details
    );
  }
}

/**
 * Error thrown when the symptom analysis engine encounters a functional error.
 * This is a technical error (500 Internal Server Error).
 */
export class SymptomEngineFunctionError extends AppException {
  /**
   * Creates a new SymptomEngineFunctionError instance.
   * 
   * @param message - Specific message about the engine failure
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(message: string, details?: any, cause?: Error) {
    super(
      message || 'Symptom analysis engine encountered an error',
      ErrorType.TECHNICAL,
      SYMPTOM_ERROR_CODES.SYMPTOM_ENGINE_FUNCTION,
      details,
      cause
    );
  }
}

/**
 * Error thrown when symptoms indicate an urgent medical situation requiring immediate attention.
 * This is a business logic error (422 Unprocessable Entity) that should trigger special handling.
 */
export class UrgentCareRecommendationError extends AppException {
  /**
   * Creates a new UrgentCareRecommendationError instance.
   * 
   * @param symptoms - Array of symptoms that triggered the urgent care recommendation
   * @param emergencyNumber - Emergency contact number to provide to the user
   * @param details - Additional details about the error (optional)
   */
  constructor(symptoms: string[], emergencyNumber: string, details?: any) {
    super(
      'Symptoms indicate a potentially urgent medical situation requiring immediate attention',
      ErrorType.BUSINESS,
      SYMPTOM_ERROR_CODES.URGENT_CARE_RECOMMENDATION,
      {
        symptoms,
        emergencyNumber,
        ...details
      }
    );
  }
}

/**
 * Error thrown when there's a failure in persisting symptom assessment data.
 * This is a technical error (500 Internal Server Error).
 */
export class SymptomPersistenceError extends AppException {
  /**
   * Creates a new SymptomPersistenceError instance.
   * 
   * @param operation - The database operation that failed (e.g., 'create', 'update', 'read')
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(operation: string, details?: any, cause?: Error) {
    super(
      `Failed to ${operation} symptom assessment data`,
      ErrorType.TECHNICAL,
      SYMPTOM_ERROR_CODES.SYMPTOM_PERSISTENCE,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in connecting to or retrieving data from a medical knowledge base.
 * This is an external system error (502 Bad Gateway).
 */
export class MedicalKnowledgeBaseError extends AppException {
  /**
   * Creates a new MedicalKnowledgeBaseError instance.
   * 
   * @param knowledgeBaseId - Identifier of the medical knowledge base
   * @param operation - The operation that failed (e.g., 'connect', 'query', 'retrieve')
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(knowledgeBaseId: string, operation: string, details?: any, cause?: Error) {
    super(
      `Failed to ${operation} medical knowledge base '${knowledgeBaseId}'`,
      ErrorType.EXTERNAL,
      SYMPTOM_ERROR_CODES.MEDICAL_KNOWLEDGE_BASE,
      details,
      cause
    );
  }
}

/**
 * Error thrown when the external symptom analysis API fails or returns invalid data.
 * This is an external system error (502 Bad Gateway).
 */
export class ExternalSymptomApiError extends AppException {
  /**
   * Creates a new ExternalSymptomApiError instance.
   * 
   * @param apiName - Name of the external API
   * @param message - Specific message about the API failure
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception (optional)
   */
  constructor(apiName: string, message: string, details?: any, cause?: Error) {
    super(
      `External symptom API '${apiName}' error: ${message}`,
      ErrorType.EXTERNAL,
      SYMPTOM_ERROR_CODES.EXTERNAL_SYMPTOM_API,
      details,
      cause
    );
  }
}

/**
 * Error thrown when symptom analysis is inconclusive or cannot determine possible conditions.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class SymptomAnalysisInconclusiveError extends AppException {
  /**
   * Creates a new SymptomAnalysisInconclusiveError instance.
   * 
   * @param symptoms - Array of symptoms that were analyzed
   * @param details - Additional details about the error (optional)
   */
  constructor(symptoms: string[], details?: any) {
    super(
      'Symptom analysis is inconclusive based on the provided information',
      ErrorType.BUSINESS,
      SYMPTOM_ERROR_CODES.SYMPTOM_ANALYSIS_INCONCLUSIVE,
      {
        symptoms,
        ...details
      }
    );
  }
}