import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType } from '../../../../src/base';
import {
  ClaimNotFoundError,
  DuplicateClaimError,
  ClaimValidationError,
  ClaimDeniedError,
  ClaimPersistenceError,
  ClaimProcessingApiError,
  ClaimDocumentError,
  InvalidClaimStatusTransitionError,
  ClaimAdditionalInfoRequiredError
} from '../../../../src/journey/plan/claims-errors';

describe('Plan Journey Claim Errors', () => {
  describe('ClaimNotFoundError', () => {
    const claimId = 'claim-123';
    const details = { userId: 'user-456' };
    const cause = new Error('Original error');
    let error: ClaimNotFoundError;

    beforeEach(() => {
      error = new ClaimNotFoundError(claimId, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code', () => {
      expect(error.code).toBe('PLAN_CLAIMS_001');
    });

    it('should format the error message correctly', () => {
      expect(error.message).toBe(`Claim with ID ${claimId} not found`);
    });

    it('should store the claimId', () => {
      expect(error.claimId).toBe(claimId);
    });

    it('should store the details', () => {
      expect(error.details).toEqual(details);
    });

    it('should store the cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'PLAN_CLAIMS_001',
          message: `Claim with ID ${claimId} not found`,
          details: details,
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('DuplicateClaimError', () => {
    const claimId = 'claim-123';
    const originalClaimId = 'claim-456';
    const details = { userId: 'user-789' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new DuplicateClaimError(claimId);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      const error = new DuplicateClaimError(claimId);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code', () => {
      const error = new DuplicateClaimError(claimId);
      expect(error.code).toBe('PLAN_CLAIMS_002');
    });

    it('should format the error message correctly without originalClaimId', () => {
      const error = new DuplicateClaimError(claimId);
      expect(error.message).toBe(`Duplicate claim detected for claim ${claimId}`);
    });

    it('should format the error message correctly with originalClaimId', () => {
      const error = new DuplicateClaimError(claimId, originalClaimId);
      expect(error.message).toBe(
        `Duplicate claim detected. Claim ${claimId} is a duplicate of existing claim ${originalClaimId}`
      );
    });

    it('should store the claimId and originalClaimId', () => {
      const error = new DuplicateClaimError(claimId, originalClaimId, details, cause);
      expect(error.claimId).toBe(claimId);
      expect(error.originalClaimId).toBe(originalClaimId);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code', () => {
      const error = new DuplicateClaimError(claimId);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const error = new DuplicateClaimError(claimId, originalClaimId, details);
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'PLAN_CLAIMS_002',
          message: `Duplicate claim detected. Claim ${claimId} is a duplicate of existing claim ${originalClaimId}`,
          details: details,
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ClaimValidationError', () => {
    const message = 'Invalid claim data';
    const validationErrors = {
      serviceDate: 'Service date is required',
      providerId: 'Provider ID is invalid'
    };
    const details = { submissionId: 'sub-123' };
    const cause = new Error('Original error');
    let error: ClaimValidationError;

    beforeEach(() => {
      error = new ClaimValidationError(message, validationErrors, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have the correct error code', () => {
      expect(error.code).toBe('PLAN_CLAIMS_003');
    });

    it('should use the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should store the validation errors', () => {
      expect(error.validationErrors).toEqual(validationErrors);
    });

    it('should include validation errors in details', () => {
      expect(error.details).toEqual({
        validationErrors,
        ...details
      });
    });

    it('should return the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'PLAN_CLAIMS_003',
          message: message,
          details: {
            validationErrors,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ClaimDeniedError', () => {
    const claimId = 'claim-123';
    const reason = 'Service not covered by plan';
    const denialCode = 'INS-456';
    const details = { planId: 'plan-789' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.code).toBe('PLAN_CLAIMS_004');
    });

    it('should format the error message correctly without denialCode', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.message).toBe(`Claim ${claimId} was denied: ${reason}`);
    });

    it('should format the error message correctly with denialCode', () => {
      const error = new ClaimDeniedError(claimId, reason, denialCode);
      expect(error.message).toBe(`Claim ${claimId} was denied: ${reason} (Code: ${denialCode})`);
    });

    it('should store all properties', () => {
      const error = new ClaimDeniedError(claimId, reason, denialCode, details, cause);
      expect(error.claimId).toBe(claimId);
      expect(error.reason).toBe(reason);
      expect(error.denialCode).toBe(denialCode);
      expect(error.details).toEqual({
        reason,
        denialCode,
        ...details
      });
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code', () => {
      const error = new ClaimDeniedError(claimId, reason);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const error = new ClaimDeniedError(claimId, reason, denialCode, details);
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'PLAN_CLAIMS_004',
          message: `Claim ${claimId} was denied: ${reason} (Code: ${denialCode})`,
          details: {
            reason,
            denialCode,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ClaimPersistenceError', () => {
    const message = 'Failed to save claim';
    const operation = 'create';
    const details = { claimId: 'claim-123' };
    const cause = new Error('Database error');
    let error: ClaimPersistenceError;

    beforeEach(() => {
      error = new ClaimPersistenceError(message, operation, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have the correct error code', () => {
      expect(error.code).toBe('PLAN_CLAIMS_005');
    });

    it('should use the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should store the operation', () => {
      expect(error.operation).toBe(operation);
    });

    it('should include operation in details', () => {
      expect(error.details).toEqual({
        operation,
        ...details
      });
    });

    it('should store the cause', () => {
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'PLAN_CLAIMS_005',
          message: message,
          details: {
            operation,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ClaimProcessingApiError', () => {
    const message = 'Failed to submit claim to insurance provider';
    const apiName = 'InsuranceAPI';
    const statusCode = 503;
    const isRetryable = true;
    const details = { claimId: 'claim-123' };
    const cause = new Error('API error');
    
    it('should extend BaseError', () => {
      const error = new ClaimProcessingApiError(message, apiName);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      const error = new ClaimProcessingApiError(message, apiName);
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have the correct error code', () => {
      const error = new ClaimProcessingApiError(message, apiName);
      expect(error.code).toBe('PLAN_CLAIMS_006');
    });

    it('should format the error message correctly without statusCode', () => {
      const error = new ClaimProcessingApiError(message, apiName);
      expect(error.message).toBe(`External claims processing API error (${apiName}): ${message}`);
    });

    it('should format the error message correctly with statusCode', () => {
      const error = new ClaimProcessingApiError(message, apiName, statusCode);
      expect(error.message).toBe(
        `External claims processing API error (${apiName}): ${message} (Status: ${statusCode})`
      );
    });

    it('should store all properties', () => {
      const error = new ClaimProcessingApiError(message, apiName, statusCode, isRetryable, details, cause);
      expect(error.apiName).toBe(apiName);
      expect(error.statusCode).toBe(statusCode);
      expect(error.isRetryable).toBe(isRetryable);
      expect(error.details).toEqual({
        apiName,
        statusCode,
        isRetryable,
        ...details
      });
      expect(error.cause).toBe(cause);
    });

    it('should default isRetryable to false', () => {
      const error = new ClaimProcessingApiError(message, apiName);
      expect(error.isRetryable).toBe(false);
    });

    it('should return the correct HTTP status code', () => {
      const error = new ClaimProcessingApiError(message, apiName);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should serialize to JSON correctly', () => {
      const error = new ClaimProcessingApiError(message, apiName, statusCode, isRetryable, details);
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.EXTERNAL,
          code: 'PLAN_CLAIMS_006',
          message: `External claims processing API error (${apiName}): ${message} (Status: ${statusCode})`,
          details: {
            apiName,
            statusCode,
            isRetryable,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ClaimDocumentError', () => {
    const message = 'Invalid document format';
    const documentType = 'receipt';
    const details = { fileType: 'image/bmp' };
    const cause = new Error('Format error');
    
    it('should extend BaseError', () => {
      const error = new ClaimDocumentError(message, documentType);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should default to VALIDATION error type', () => {
      const error = new ClaimDocumentError(message, documentType);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('PLAN_CLAIMS_007');
    });

    it('should support TECHNICAL error type', () => {
      const error = new ClaimDocumentError(message, documentType, ErrorType.TECHNICAL);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('PLAN_CLAIMS_008');
    });

    it('should format the error message correctly', () => {
      const error = new ClaimDocumentError(message, documentType);
      expect(error.message).toBe(`Claim document error (${documentType}): ${message}`);
    });

    it('should store all properties', () => {
      const error = new ClaimDocumentError(message, documentType, ErrorType.VALIDATION, details, cause);
      expect(error.documentType).toBe(documentType);
      expect(error.errorType).toBe(ErrorType.VALIDATION);
      expect(error.details).toEqual({
        documentType,
        ...details
      });
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code for VALIDATION type', () => {
      const error = new ClaimDocumentError(message, documentType, ErrorType.VALIDATION);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return the correct HTTP status code for TECHNICAL type', () => {
      const error = new ClaimDocumentError(message, documentType, ErrorType.TECHNICAL);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON correctly', () => {
      const error = new ClaimDocumentError(message, documentType, ErrorType.VALIDATION, details);
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'PLAN_CLAIMS_007',
          message: `Claim document error (${documentType}): ${message}`,
          details: {
            documentType,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('InvalidClaimStatusTransitionError', () => {
    const claimId = 'claim-123';
    const currentStatus = 'SUBMITTED';
    const attemptedStatus = 'PAID';
    const details = { allowedTransitions: ['PROCESSING', 'DENIED'] };
    const cause = new Error('Workflow error');
    let error: InvalidClaimStatusTransitionError;

    beforeEach(() => {
      error = new InvalidClaimStatusTransitionError(claimId, currentStatus, attemptedStatus, details, cause);
    });

    it('should extend BaseError', () => {
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code', () => {
      expect(error.code).toBe('PLAN_CLAIMS_009');
    });

    it('should format the error message correctly', () => {
      expect(error.message).toBe(
        `Invalid claim status transition for claim ${claimId}: Cannot change from '${currentStatus}' to '${attemptedStatus}'`
      );
    });

    it('should store all properties', () => {
      expect(error.claimId).toBe(claimId);
      expect(error.currentStatus).toBe(currentStatus);
      expect(error.attemptedStatus).toBe(attemptedStatus);
      expect(error.details).toEqual({
        currentStatus,
        attemptedStatus,
        ...details
      });
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly', () => {
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'PLAN_CLAIMS_009',
          message: `Invalid claim status transition for claim ${claimId}: Cannot change from '${currentStatus}' to '${attemptedStatus}'`,
          details: {
            currentStatus,
            attemptedStatus,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('ClaimAdditionalInfoRequiredError', () => {
    const claimId = 'claim-123';
    const requiredFields = ['diagnosis', 'treatmentNotes'];
    const customMessage = 'Please provide additional medical information';
    const details = { urgency: 'high' };
    const cause = new Error('Validation error');
    
    it('should extend BaseError', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have the correct error type', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have the correct error code', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields);
      expect(error.code).toBe('PLAN_CLAIMS_010');
    });

    it('should generate a default error message if none provided', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields);
      expect(error.message).toBe(`Claim ${claimId} requires additional information: ${requiredFields.join(', ')}`);
    });

    it('should use the custom message if provided', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields, customMessage);
      expect(error.message).toBe(customMessage);
    });

    it('should store all properties', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields, customMessage, details, cause);
      expect(error.claimId).toBe(claimId);
      expect(error.requiredFields).toEqual(requiredFields);
      expect(error.details).toEqual({
        requiredFields,
        ...details
      });
      expect(error.cause).toBe(cause);
    });

    it('should return the correct HTTP status code', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON correctly with default message', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields, undefined, details);
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'PLAN_CLAIMS_010',
          message: `Claim ${claimId} requires additional information: ${requiredFields.join(', ')}`,
          details: {
            requiredFields,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should serialize to JSON correctly with custom message', () => {
      const error = new ClaimAdditionalInfoRequiredError(claimId, requiredFields, customMessage, details);
      const json = error.toJSON();
      expect(json).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'PLAN_CLAIMS_010',
          message: customMessage,
          details: {
            requiredFields,
            ...details
          },
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });
});