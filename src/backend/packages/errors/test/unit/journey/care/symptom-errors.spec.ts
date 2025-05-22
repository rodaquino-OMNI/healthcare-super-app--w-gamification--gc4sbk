/**
 * @file symptom-errors.spec.ts
 * @description Unit tests for Care journey symptom checker error classes
 */

import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '@app/shared/exceptions';
import {
  SymptomNotFoundError,
  SymptomAssessmentIncompleteError,
  SymptomEngineFunctionError,
  UrgentCareRecommendationError,
  SymptomPersistenceError,
  MedicalKnowledgeBaseError
} from '../../../../src/journey/care/symptom-errors';

describe('Care Journey Symptom Checker Error Classes', () => {
  const SYMPTOM_ERROR_PREFIX = 'CARE_SYMPTOM';

  describe('SymptomNotFoundError', () => {
    const symptomId = 'SYMP_123';
    const details = { userId: 'user123', requestedAt: '2023-01-01T12:00:00Z' };
    const cause = new Error('Database lookup failed');
    
    it('should create an error with the correct type and code prefix', () => {
      const error = new SymptomNotFoundError(symptomId);
      
      expect(error).toBeInstanceOf(SymptomNotFoundError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toMatch(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`));
    });
    
    it('should include symptom ID in the error message', () => {
      const error = new SymptomNotFoundError(symptomId);
      
      expect(error.message).toContain(symptomId);
    });
    
    it('should properly handle optional details and cause parameters', () => {
      const error = new SymptomNotFoundError(symptomId, details, cause);
      
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should convert to HTTP exception with correct status code', () => {
      const error = new SymptomNotFoundError(symptomId);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
    
    it('should serialize to JSON with the correct structure', () => {
      const error = new SymptomNotFoundError(symptomId, details);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: expect.stringMatching(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`)),
          message: expect.stringContaining(symptomId),
          details
        }
      });
    });
  });
  
  describe('SymptomAssessmentIncompleteError', () => {
    const customMessage = 'Assessment missing required pain level data';
    const details = { missingFields: ['painLevel', 'duration'] };
    const cause = new Error('Validation failed');
    
    it('should create an error with the correct type and code prefix', () => {
      const error = new SymptomAssessmentIncompleteError();
      
      expect(error).toBeInstanceOf(SymptomAssessmentIncompleteError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toMatch(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`));
    });
    
    it('should use default message when none is provided', () => {
      const error = new SymptomAssessmentIncompleteError();
      
      expect(error.message).toBe('Symptom assessment is incomplete or invalid');
    });
    
    it('should use custom message when provided', () => {
      const error = new SymptomAssessmentIncompleteError(customMessage);
      
      expect(error.message).toBe(customMessage);
    });
    
    it('should properly handle optional details and cause parameters', () => {
      const error = new SymptomAssessmentIncompleteError(customMessage, details, cause);
      
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should convert to HTTP exception with correct status code', () => {
      const error = new SymptomAssessmentIncompleteError();
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
    
    it('should serialize to JSON with the correct structure', () => {
      const error = new SymptomAssessmentIncompleteError(customMessage, details);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: expect.stringMatching(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`)),
          message: customMessage,
          details
        }
      });
    });
  });
  
  describe('SymptomEngineFunctionError', () => {
    const customMessage = 'Diagnosis algorithm failed to process input data';
    const details = { algorithmVersion: '2.3.1', inputData: { symptoms: ['fever', 'cough'] } };
    const cause = new Error('Algorithm exception');
    
    it('should create an error with the correct type and code prefix', () => {
      const error = new SymptomEngineFunctionError();
      
      expect(error).toBeInstanceOf(SymptomEngineFunctionError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toMatch(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`));
    });
    
    it('should use default message when none is provided', () => {
      const error = new SymptomEngineFunctionError();
      
      expect(error.message).toBe('Symptom diagnosis engine encountered an error');
    });
    
    it('should use custom message when provided', () => {
      const error = new SymptomEngineFunctionError(customMessage);
      
      expect(error.message).toBe(customMessage);
    });
    
    it('should properly handle optional details and cause parameters', () => {
      const error = new SymptomEngineFunctionError(customMessage, details, cause);
      
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should convert to HTTP exception with correct status code', () => {
      const error = new SymptomEngineFunctionError();
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
    
    it('should serialize to JSON with the correct structure', () => {
      const error = new SymptomEngineFunctionError(customMessage, details);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: expect.stringMatching(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`)),
          message: customMessage,
          details
        }
      });
    });
  });
  
  describe('UrgentCareRecommendationError', () => {
    const criticalSymptoms = ['chest pain', 'difficulty breathing', 'severe headache'];
    const emergencyNumber = '911';
    const details = { severity: 'high', recommendedAction: 'seek immediate medical attention' };
    const cause = new Error('Critical symptom detected');
    
    it('should create an error with the correct type and code prefix', () => {
      const error = new UrgentCareRecommendationError(criticalSymptoms);
      
      expect(error).toBeInstanceOf(UrgentCareRecommendationError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toMatch(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`));
    });
    
    it('should include critical symptoms in the details', () => {
      const error = new UrgentCareRecommendationError(criticalSymptoms);
      
      expect(error.details).toHaveProperty('criticalSymptoms');
      expect(error.details.criticalSymptoms).toEqual(criticalSymptoms);
    });
    
    it('should include emergency number when provided', () => {
      const error = new UrgentCareRecommendationError(criticalSymptoms, emergencyNumber);
      
      expect(error.details).toHaveProperty('emergencyNumber');
      expect(error.details.emergencyNumber).toBe(emergencyNumber);
    });
    
    it('should properly merge additional details with critical symptoms', () => {
      const error = new UrgentCareRecommendationError(criticalSymptoms, emergencyNumber, details, cause);
      
      expect(error.details).toHaveProperty('criticalSymptoms');
      expect(error.details).toHaveProperty('emergencyNumber');
      expect(error.details).toHaveProperty('severity');
      expect(error.details).toHaveProperty('recommendedAction');
      expect(error.cause).toBe(cause);
    });
    
    it('should convert to HTTP exception with correct status code', () => {
      const error = new UrgentCareRecommendationError(criticalSymptoms);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
    
    it('should serialize to JSON with the correct structure', () => {
      const error = new UrgentCareRecommendationError(criticalSymptoms, emergencyNumber);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: expect.stringMatching(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`)),
          message: 'Urgent medical attention is recommended based on your symptoms',
          details: {
            criticalSymptoms,
            emergencyNumber
          }
        }
      });
    });
  });
  
  describe('SymptomPersistenceError', () => {
    const operation = 'save';
    const details = { userId: 'user123', assessmentId: 'assessment456' };
    const cause = new Error('Database connection failed');
    
    it('should create an error with the correct type and code prefix', () => {
      const error = new SymptomPersistenceError(operation);
      
      expect(error).toBeInstanceOf(SymptomPersistenceError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toMatch(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`));
    });
    
    it('should include operation in the error message', () => {
      const error = new SymptomPersistenceError(operation);
      
      expect(error.message).toContain(operation);
    });
    
    it('should properly handle optional details and cause parameters', () => {
      const error = new SymptomPersistenceError(operation, details, cause);
      
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should convert to HTTP exception with correct status code', () => {
      const error = new SymptomPersistenceError(operation);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
    
    it('should serialize to JSON with the correct structure', () => {
      const error = new SymptomPersistenceError(operation, details);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: expect.stringMatching(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`)),
          message: expect.stringContaining(operation),
          details
        }
      });
    });
  });
  
  describe('MedicalKnowledgeBaseError', () => {
    const provider = 'MedicalAPI';
    const details = { endpoint: '/api/conditions', requestId: 'req123' };
    const cause = new Error('API request failed');
    
    it('should create an error with the correct type and code prefix', () => {
      const error = new MedicalKnowledgeBaseError(provider);
      
      expect(error).toBeInstanceOf(MedicalKnowledgeBaseError);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toMatch(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`));
    });
    
    it('should include provider name in the error message', () => {
      const error = new MedicalKnowledgeBaseError(provider);
      
      expect(error.message).toContain(provider);
    });
    
    it('should properly handle optional details and cause parameters', () => {
      const error = new MedicalKnowledgeBaseError(provider, details, cause);
      
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should convert to HTTP exception with correct status code', () => {
      const error = new MedicalKnowledgeBaseError(provider);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
    
    it('should serialize to JSON with the correct structure', () => {
      const error = new MedicalKnowledgeBaseError(provider, details);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: expect.stringMatching(new RegExp(`^${SYMPTOM_ERROR_PREFIX}_\d+$`)),
          message: expect.stringContaining(provider),
          details
        }
      });
    });
  });
});