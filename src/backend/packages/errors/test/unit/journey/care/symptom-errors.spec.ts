import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/categories';
import {
  SymptomNotFoundError,
  SymptomAssessmentIncompleteError,
  SymptomEngineFunctionError,
  UrgentCareRecommendationError,
  SymptomPersistenceError,
  MedicalKnowledgeBaseError,
} from '../../../../src/journey/care/symptom-errors';
import { toBeErrorType, toHaveErrorCode, toHaveHttpStatus } from '../../../helpers/test-matchers';

// Extend Jest matchers with custom error matchers
expect.extend({ toBeErrorType, toHaveErrorCode, toHaveHttpStatus });

describe('Care Journey Symptom Errors', () => {
  describe('SymptomNotFoundError', () => {
    const symptomId = 'symptom-123';
    const error = new SymptomNotFoundError(symptomId);

    it('should be a business error type', () => {
      expect(error).toBeErrorType(ErrorType.BUSINESS);
    });

    it('should have CARE_SYMPTOM_ prefixed error code', () => {
      expect(error).toHaveErrorCode(/^CARE_SYMPTOM_/);
    });

    it('should have NOT_FOUND (404) HTTP status', () => {
      expect(error).toHaveHttpStatus(HttpStatus.NOT_FOUND);
    });

    it('should include symptom ID in error context', () => {
      expect(error.context).toHaveProperty('symptomId', symptomId);
    });

    it('should have a descriptive error message', () => {
      expect(error.message).toContain(symptomId);
    });
  });

  describe('SymptomAssessmentIncompleteError', () => {
    const assessmentId = 'assessment-456';
    const missingFields = ['severity', 'duration'];
    const error = new SymptomAssessmentIncompleteError(assessmentId, missingFields);

    it('should be a validation error type', () => {
      expect(error).toBeErrorType(ErrorType.VALIDATION);
    });

    it('should have CARE_SYMPTOM_ prefixed error code', () => {
      expect(error).toHaveErrorCode(/^CARE_SYMPTOM_/);
    });

    it('should have BAD_REQUEST (400) HTTP status', () => {
      expect(error).toHaveHttpStatus(HttpStatus.BAD_REQUEST);
    });

    it('should include assessment ID in error context', () => {
      expect(error.context).toHaveProperty('assessmentId', assessmentId);
    });

    it('should include missing fields in error context', () => {
      expect(error.context).toHaveProperty('missingFields');
      expect(error.context.missingFields).toEqual(missingFields);
    });

    it('should have a descriptive error message mentioning missing fields', () => {
      expect(error.message).toContain(assessmentId);
      missingFields.forEach(field => {
        expect(error.message).toContain(field);
      });
    });
  });

  describe('SymptomEngineFunctionError', () => {
    const functionName = 'calculateRiskScore';
    const assessmentId = 'assessment-789';
    const technicalDetails = 'Division by zero in risk calculation';
    const error = new SymptomEngineFunctionError(functionName, assessmentId, technicalDetails);

    it('should be a technical error type', () => {
      expect(error).toBeErrorType(ErrorType.TECHNICAL);
    });

    it('should have CARE_SYMPTOM_ prefixed error code', () => {
      expect(error).toHaveErrorCode(/^CARE_SYMPTOM_/);
    });

    it('should have INTERNAL_SERVER_ERROR (500) HTTP status', () => {
      expect(error).toHaveHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include function name in error context', () => {
      expect(error.context).toHaveProperty('functionName', functionName);
    });

    it('should include assessment ID in error context', () => {
      expect(error.context).toHaveProperty('assessmentId', assessmentId);
    });

    it('should include technical details in error context', () => {
      expect(error.context).toHaveProperty('technicalDetails', technicalDetails);
    });

    it('should have a descriptive error message', () => {
      expect(error.message).toContain(functionName);
      expect(error.message).toContain(assessmentId);
    });
  });

  describe('UrgentCareRecommendationError', () => {
    const assessmentId = 'assessment-101';
    const symptomIds = ['symptom-123', 'symptom-456'];
    const severityLevel = 'HIGH';
    const recommendedAction = 'SEEK_EMERGENCY_CARE';
    const error = new UrgentCareRecommendationError(
      assessmentId,
      symptomIds,
      severityLevel,
      recommendedAction
    );

    it('should be a business error type', () => {
      expect(error).toBeErrorType(ErrorType.BUSINESS);
    });

    it('should have CARE_SYMPTOM_ prefixed error code', () => {
      expect(error).toHaveErrorCode(/^CARE_SYMPTOM_/);
    });

    it('should have OK (200) HTTP status despite being an error', () => {
      // This is a special case where we return a 200 status with an error object
      // because it's a valid business outcome, not a technical failure
      expect(error).toHaveHttpStatus(HttpStatus.OK);
    });

    it('should include assessment ID in error context', () => {
      expect(error.context).toHaveProperty('assessmentId', assessmentId);
    });

    it('should include symptom IDs in error context', () => {
      expect(error.context).toHaveProperty('symptomIds');
      expect(error.context.symptomIds).toEqual(symptomIds);
    });

    it('should include severity level in error context', () => {
      expect(error.context).toHaveProperty('severityLevel', severityLevel);
    });

    it('should include recommended action in error context', () => {
      expect(error.context).toHaveProperty('recommendedAction', recommendedAction);
    });

    it('should have a descriptive error message with urgency indication', () => {
      expect(error.message).toContain('urgent');
      expect(error.message).toContain(recommendedAction);
    });
  });

  describe('SymptomPersistenceError', () => {
    const assessmentId = 'assessment-202';
    const operation = 'save';
    const databaseError = new Error('Database connection failed');
    const error = new SymptomPersistenceError(assessmentId, operation, databaseError);

    it('should be a technical error type', () => {
      expect(error).toBeErrorType(ErrorType.TECHNICAL);
    });

    it('should have CARE_SYMPTOM_ prefixed error code', () => {
      expect(error).toHaveErrorCode(/^CARE_SYMPTOM_/);
    });

    it('should have INTERNAL_SERVER_ERROR (500) HTTP status', () => {
      expect(error).toHaveHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include assessment ID in error context', () => {
      expect(error.context).toHaveProperty('assessmentId', assessmentId);
    });

    it('should include operation in error context', () => {
      expect(error.context).toHaveProperty('operation', operation);
    });

    it('should set the original error as cause', () => {
      expect(error.cause).toBe(databaseError);
    });

    it('should have a descriptive error message', () => {
      expect(error.message).toContain(assessmentId);
      expect(error.message).toContain(operation);
    });
  });

  describe('MedicalKnowledgeBaseError', () => {
    const knowledgeBaseId = 'snomed-ct';
    const operation = 'lookupSymptomCode';
    const symptomCode = 'R07.0';
    const externalError = new Error('External API timeout');
    const error = new MedicalKnowledgeBaseError(knowledgeBaseId, operation, symptomCode, externalError);

    it('should be an external error type', () => {
      expect(error).toBeErrorType(ErrorType.EXTERNAL);
    });

    it('should have CARE_SYMPTOM_ prefixed error code', () => {
      expect(error).toHaveErrorCode(/^CARE_SYMPTOM_/);
    });

    it('should have SERVICE_UNAVAILABLE (503) HTTP status', () => {
      expect(error).toHaveHttpStatus(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should include knowledge base ID in error context', () => {
      expect(error.context).toHaveProperty('knowledgeBaseId', knowledgeBaseId);
    });

    it('should include operation in error context', () => {
      expect(error.context).toHaveProperty('operation', operation);
    });

    it('should include symptom code in error context', () => {
      expect(error.context).toHaveProperty('symptomCode', symptomCode);
    });

    it('should set the external error as cause', () => {
      expect(error.cause).toBe(externalError);
    });

    it('should have a descriptive error message', () => {
      expect(error.message).toContain(knowledgeBaseId);
      expect(error.message).toContain(operation);
      expect(error.message).toContain(symptomCode);
    });

    it('should include retry information when provided', () => {
      const retryAfter = 30; // seconds
      const errorWithRetry = new MedicalKnowledgeBaseError(
        knowledgeBaseId,
        operation,
        symptomCode,
        externalError,
        retryAfter
      );
      
      expect(errorWithRetry.context).toHaveProperty('retryAfter', retryAfter);
      expect(errorWithRetry.message).toContain(`retry after ${retryAfter} seconds`);
    });
  });
});