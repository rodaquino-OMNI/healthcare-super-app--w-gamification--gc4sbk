import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@austa/interfaces/common/exceptions';
import {
  SymptomNotFoundError,
  SymptomAssessmentIncompleteError,
  SymptomEngineFunctionError,
  UrgentCareRecommendationError,
  SymptomPersistenceError,
  MedicalKnowledgeBaseError,
  ExternalSymptomApiError,
  SymptomAnalysisInconclusiveError,
  SYMPTOM_ERROR_CODES
} from '../../../../src/journey/care/symptom-errors';

describe('Care Journey Symptom Errors', () => {
  // Test error code constants
  describe('SYMPTOM_ERROR_CODES', () => {
    it('should define all required error codes with CARE_SYMPTOM_ prefix', () => {
      // Check that all codes exist and have the correct prefix
      Object.values(SYMPTOM_ERROR_CODES).forEach(code => {
        expect(code).toMatch(/^CARE_SYMPTOM_\d+$/);
      });

      // Check specific error codes
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_NOT_FOUND).toBe('CARE_SYMPTOM_101');
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_ASSESSMENT_INCOMPLETE).toBe('CARE_SYMPTOM_001');
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_ENGINE_FUNCTION).toBe('CARE_SYMPTOM_201');
      expect(SYMPTOM_ERROR_CODES.URGENT_CARE_RECOMMENDATION).toBe('CARE_SYMPTOM_102');
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_PERSISTENCE).toBe('CARE_SYMPTOM_202');
      expect(SYMPTOM_ERROR_CODES.MEDICAL_KNOWLEDGE_BASE).toBe('CARE_SYMPTOM_301');
      expect(SYMPTOM_ERROR_CODES.EXTERNAL_SYMPTOM_API).toBe('CARE_SYMPTOM_302');
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_ANALYSIS_INCONCLUSIVE).toBe('CARE_SYMPTOM_103');
    });

    it('should group error codes by type based on numbering convention', () => {
      // Validation errors (000-099)
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_ASSESSMENT_INCOMPLETE).toMatch(/CARE_SYMPTOM_0\d{2}/);
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_INVALID_FORMAT).toMatch(/CARE_SYMPTOM_0\d{2}/);
      
      // Business errors (100-199)
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_NOT_FOUND).toMatch(/CARE_SYMPTOM_1\d{2}/);
      expect(SYMPTOM_ERROR_CODES.URGENT_CARE_RECOMMENDATION).toMatch(/CARE_SYMPTOM_1\d{2}/);
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_ANALYSIS_INCONCLUSIVE).toMatch(/CARE_SYMPTOM_1\d{2}/);
      
      // Technical errors (200-299)
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_ENGINE_FUNCTION).toMatch(/CARE_SYMPTOM_2\d{2}/);
      expect(SYMPTOM_ERROR_CODES.SYMPTOM_PERSISTENCE).toMatch(/CARE_SYMPTOM_2\d{2}/);
      
      // External errors (300-399)
      expect(SYMPTOM_ERROR_CODES.MEDICAL_KNOWLEDGE_BASE).toMatch(/CARE_SYMPTOM_3\d{2}/);
      expect(SYMPTOM_ERROR_CODES.EXTERNAL_SYMPTOM_API).toMatch(/CARE_SYMPTOM_3\d{2}/);
    });
  });

  // Test SymptomNotFoundError
  describe('SymptomNotFoundError', () => {
    it('should extend AppException', () => {
      const error = new SymptomNotFoundError('SYMPTOM-123');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use BUSINESS error type', () => {
      const error = new SymptomNotFoundError('SYMPTOM-123');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use SYMPTOM_NOT_FOUND error code', () => {
      const error = new SymptomNotFoundError('SYMPTOM-123');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.SYMPTOM_NOT_FOUND);
    });

    it('should include symptom ID in error message', () => {
      const symptomId = 'SYMPTOM-123';
      const error = new SymptomNotFoundError(symptomId);
      expect(error.message).toContain(symptomId);
    });

    it('should include additional details when provided', () => {
      const details = { searchCriteria: { name: 'headache' } };
      const error = new SymptomNotFoundError('SYMPTOM-123', details);
      expect(error.details).toEqual(details);
    });
  });

  // Test SymptomAssessmentIncompleteError
  describe('SymptomAssessmentIncompleteError', () => {
    it('should extend AppException', () => {
      const error = new SymptomAssessmentIncompleteError('Missing severity rating');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use VALIDATION error type', () => {
      const error = new SymptomAssessmentIncompleteError('Missing severity rating');
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should use SYMPTOM_ASSESSMENT_INCOMPLETE error code', () => {
      const error = new SymptomAssessmentIncompleteError('Missing severity rating');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.SYMPTOM_ASSESSMENT_INCOMPLETE);
    });

    it('should use provided message', () => {
      const message = 'Missing severity rating';
      const error = new SymptomAssessmentIncompleteError(message);
      expect(error.message).toBe(message);
    });

    it('should use default message if none provided', () => {
      const error = new SymptomAssessmentIncompleteError('');
      expect(error.message).toBe('Symptom assessment is incomplete or missing required data');
    });

    it('should include additional details when provided', () => {
      const details = { missingFields: ['severity', 'duration'] };
      const error = new SymptomAssessmentIncompleteError('Missing required fields', details);
      expect(error.details).toEqual(details);
    });
  });

  // Test SymptomEngineFunctionError
  describe('SymptomEngineFunctionError', () => {
    it('should extend AppException', () => {
      const error = new SymptomEngineFunctionError('Engine processing failed');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use TECHNICAL error type', () => {
      const error = new SymptomEngineFunctionError('Engine processing failed');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should use SYMPTOM_ENGINE_FUNCTION error code', () => {
      const error = new SymptomEngineFunctionError('Engine processing failed');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.SYMPTOM_ENGINE_FUNCTION);
    });

    it('should use provided message', () => {
      const message = 'Engine processing failed';
      const error = new SymptomEngineFunctionError(message);
      expect(error.message).toBe(message);
    });

    it('should use default message if none provided', () => {
      const error = new SymptomEngineFunctionError('');
      expect(error.message).toBe('Symptom analysis engine encountered an error');
    });

    it('should include additional details when provided', () => {
      const details = { engineVersion: '2.1.0', processingStage: 'analysis' };
      const error = new SymptomEngineFunctionError('Engine processing failed', details);
      expect(error.details).toEqual(details);
    });

    it('should capture original error cause when provided', () => {
      const cause = new Error('Original error');
      const error = new SymptomEngineFunctionError('Engine processing failed', {}, cause);
      expect(error.cause).toBe(cause);
    });
  });

  // Test UrgentCareRecommendationError
  describe('UrgentCareRecommendationError', () => {
    it('should extend AppException', () => {
      const error = new UrgentCareRecommendationError(['chest pain', 'shortness of breath'], '911');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use BUSINESS error type', () => {
      const error = new UrgentCareRecommendationError(['chest pain', 'shortness of breath'], '911');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use URGENT_CARE_RECOMMENDATION error code', () => {
      const error = new UrgentCareRecommendationError(['chest pain', 'shortness of breath'], '911');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.URGENT_CARE_RECOMMENDATION);
    });

    it('should include symptoms and emergency number in details', () => {
      const symptoms = ['chest pain', 'shortness of breath'];
      const emergencyNumber = '911';
      const error = new UrgentCareRecommendationError(symptoms, emergencyNumber);
      
      expect(error.details).toEqual(expect.objectContaining({
        symptoms,
        emergencyNumber
      }));
    });

    it('should include additional details when provided', () => {
      const symptoms = ['chest pain', 'shortness of breath'];
      const emergencyNumber = '911';
      const additionalDetails = { urgencyLevel: 'high', nearestHospital: 'General Hospital' };
      
      const error = new UrgentCareRecommendationError(symptoms, emergencyNumber, additionalDetails);
      
      expect(error.details).toEqual(expect.objectContaining({
        symptoms,
        emergencyNumber,
        urgencyLevel: 'high',
        nearestHospital: 'General Hospital'
      }));
    });
  });

  // Test SymptomPersistenceError
  describe('SymptomPersistenceError', () => {
    it('should extend AppException', () => {
      const error = new SymptomPersistenceError('create');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use TECHNICAL error type', () => {
      const error = new SymptomPersistenceError('create');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should use SYMPTOM_PERSISTENCE error code', () => {
      const error = new SymptomPersistenceError('create');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.SYMPTOM_PERSISTENCE);
    });

    it('should include operation in error message', () => {
      const operation = 'create';
      const error = new SymptomPersistenceError(operation);
      expect(error.message).toBe(`Failed to ${operation} symptom assessment data`);
    });

    it('should include additional details when provided', () => {
      const details = { assessmentId: '12345', userId: 'user-789' };
      const error = new SymptomPersistenceError('update', details);
      expect(error.details).toEqual(details);
    });

    it('should capture original error cause when provided', () => {
      const cause = new Error('Database connection error');
      const error = new SymptomPersistenceError('read', {}, cause);
      expect(error.cause).toBe(cause);
    });
  });

  // Test MedicalKnowledgeBaseError
  describe('MedicalKnowledgeBaseError', () => {
    it('should extend AppException', () => {
      const error = new MedicalKnowledgeBaseError('SNOMED-CT', 'connect');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use EXTERNAL error type', () => {
      const error = new MedicalKnowledgeBaseError('SNOMED-CT', 'connect');
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should use MEDICAL_KNOWLEDGE_BASE error code', () => {
      const error = new MedicalKnowledgeBaseError('SNOMED-CT', 'connect');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.MEDICAL_KNOWLEDGE_BASE);
    });

    it('should include knowledge base ID and operation in error message', () => {
      const knowledgeBaseId = 'SNOMED-CT';
      const operation = 'query';
      const error = new MedicalKnowledgeBaseError(knowledgeBaseId, operation);
      expect(error.message).toBe(`Failed to ${operation} medical knowledge base '${knowledgeBaseId}'`);
    });

    it('should include additional details when provided', () => {
      const details = { query: 'headache symptoms', timeout: 5000 };
      const error = new MedicalKnowledgeBaseError('ICD-10', 'query', details);
      expect(error.details).toEqual(details);
    });

    it('should capture original error cause when provided', () => {
      const cause = new Error('Connection timeout');
      const error = new MedicalKnowledgeBaseError('SNOMED-CT', 'connect', {}, cause);
      expect(error.cause).toBe(cause);
    });
  });

  // Test ExternalSymptomApiError
  describe('ExternalSymptomApiError', () => {
    it('should extend AppException', () => {
      const error = new ExternalSymptomApiError('SymptomChecker API', 'Connection failed');
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use EXTERNAL error type', () => {
      const error = new ExternalSymptomApiError('SymptomChecker API', 'Connection failed');
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should use EXTERNAL_SYMPTOM_API error code', () => {
      const error = new ExternalSymptomApiError('SymptomChecker API', 'Connection failed');
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.EXTERNAL_SYMPTOM_API);
    });

    it('should include API name and message in error message', () => {
      const apiName = 'SymptomChecker API';
      const message = 'Connection failed';
      const error = new ExternalSymptomApiError(apiName, message);
      expect(error.message).toBe(`External symptom API '${apiName}' error: ${message}`);
    });

    it('should include additional details when provided', () => {
      const details = { endpoint: '/api/symptoms/check', statusCode: 503 };
      const error = new ExternalSymptomApiError('SymptomChecker API', 'Service unavailable', details);
      expect(error.details).toEqual(details);
    });

    it('should capture original error cause when provided', () => {
      const cause = new Error('Network error');
      const error = new ExternalSymptomApiError('SymptomChecker API', 'Connection failed', {}, cause);
      expect(error.cause).toBe(cause);
    });
  });

  // Test SymptomAnalysisInconclusiveError
  describe('SymptomAnalysisInconclusiveError', () => {
    it('should extend AppException', () => {
      const error = new SymptomAnalysisInconclusiveError(['headache', 'fatigue']);
      expect(error).toBeInstanceOf(AppException);
    });

    it('should use BUSINESS error type', () => {
      const error = new SymptomAnalysisInconclusiveError(['headache', 'fatigue']);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should use SYMPTOM_ANALYSIS_INCONCLUSIVE error code', () => {
      const error = new SymptomAnalysisInconclusiveError(['headache', 'fatigue']);
      expect(error.code).toBe(SYMPTOM_ERROR_CODES.SYMPTOM_ANALYSIS_INCONCLUSIVE);
    });

    it('should include symptoms in details', () => {
      const symptoms = ['headache', 'fatigue'];
      const error = new SymptomAnalysisInconclusiveError(symptoms);
      
      expect(error.details).toEqual(expect.objectContaining({
        symptoms
      }));
    });

    it('should include additional details when provided', () => {
      const symptoms = ['headache', 'fatigue'];
      const additionalDetails = { confidenceScore: 0.3, possibleConditions: [] };
      
      const error = new SymptomAnalysisInconclusiveError(symptoms, additionalDetails);
      
      expect(error.details).toEqual(expect.objectContaining({
        symptoms,
        confidenceScore: 0.3,
        possibleConditions: []
      }));
    });
  });

  // Test HTTP status code mapping
  describe('HTTP status code mapping', () => {
    it('should map validation errors to 400 Bad Request', () => {
      const error = new SymptomAssessmentIncompleteError('Missing required fields');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should map business errors to 422 Unprocessable Entity', () => {
      const error = new SymptomNotFoundError('SYMPTOM-123');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should map technical errors to 500 Internal Server Error', () => {
      const error = new SymptomEngineFunctionError('Engine processing failed');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should map external errors to 502 Bad Gateway', () => {
      const error = new MedicalKnowledgeBaseError('SNOMED-CT', 'connect');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });
});