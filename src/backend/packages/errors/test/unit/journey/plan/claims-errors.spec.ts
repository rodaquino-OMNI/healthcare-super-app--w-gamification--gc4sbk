import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../../src/base';
import {
  ClaimNotFoundError,
  DuplicateClaimError,
  ClaimValidationError,
  ClaimDeniedError,
  ClaimPersistenceError,
  ClaimProcessingApiError,
  ClaimDocumentError
} from '../../../../src/journey/plan/claims-errors';
import { PLAN_ERROR_PREFIXES } from '../../../../src/constants';

describe('Plan Journey Claim Errors', () => {
  describe('ClaimNotFoundError', () => {
    const claimId = 'claim-123';
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new ClaimNotFoundError(claimId);
      expect(error).toBeInstanceOf(BaseError);
    });
    
    it('should set the correct error type', () => {
      const error = new ClaimNotFoundError(claimId);
      expect(error.type).toBe(ErrorType.NOT_FOUND);
    });
    
    it('should set the correct error code', () => {
      const error = new ClaimNotFoundError(claimId);
      expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_001`);
    });
    
    it('should include the claim ID in the context', () => {
      const error = new ClaimNotFoundError(claimId);
      expect(error.context).toHaveProperty('claimId', claimId);
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new ClaimNotFoundError(claimId, details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ClaimNotFoundError(claimId);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.NOT_FOUND);
    });
    
    it('should serialize to the correct format', () => {
      const error = new ClaimNotFoundError(claimId, details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.NOT_FOUND);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_001`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
  });
  
  describe('DuplicateClaimError', () => {
    const existingClaimId = 'claim-456';
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new DuplicateClaimError(existingClaimId);
      expect(error).toBeInstanceOf(BaseError);
    });
    
    it('should set the correct error type', () => {
      const error = new DuplicateClaimError(existingClaimId);
      expect(error.type).toBe(ErrorType.CONFLICT);
    });
    
    it('should set the correct error code', () => {
      const error = new DuplicateClaimError(existingClaimId);
      expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_002`);
    });
    
    it('should include the existing claim ID in the context', () => {
      const error = new DuplicateClaimError(existingClaimId);
      expect(error.context).toHaveProperty('existingClaimId', existingClaimId);
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new DuplicateClaimError(existingClaimId, details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new DuplicateClaimError(existingClaimId);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.CONFLICT);
    });
    
    it('should serialize to the correct format', () => {
      const error = new DuplicateClaimError(existingClaimId, details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.CONFLICT);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_002`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
  });
  
  describe('ClaimValidationError', () => {
    const validationErrors = {
      serviceDate: 'Service date is required',
      amount: 'Amount must be greater than zero'
    };
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new ClaimValidationError(validationErrors);
      expect(error).toBeInstanceOf(BaseError);
    });
    
    it('should set the correct error type', () => {
      const error = new ClaimValidationError(validationErrors);
      expect(error.type).toBe(ErrorType.VALIDATION);
    });
    
    it('should set the correct error code', () => {
      const error = new ClaimValidationError(validationErrors);
      expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_003`);
    });
    
    it('should include the validation errors in the context', () => {
      const error = new ClaimValidationError(validationErrors);
      expect(error.context).toHaveProperty('validationErrors', validationErrors);
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
    });
    
    it('should include validation error details in the message', () => {
      const error = new ClaimValidationError(validationErrors);
      expect(error.message).toContain('Service date is required');
      expect(error.message).toContain('Amount must be greater than zero');
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new ClaimValidationError(validationErrors, details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ClaimValidationError(validationErrors);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });
    
    it('should serialize to the correct format', () => {
      const error = new ClaimValidationError(validationErrors, details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_003`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
  });
  
  describe('ClaimDeniedError', () => {
    const claimId = 'claim-789';
    const reason = 'Service not covered by plan';
    const denialCode = 'PLAN-NC-001';
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error).toBeInstanceOf(BaseError);
    });
    
    it('should set the correct error type', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });
    
    it('should set the correct error code', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_004`);
    });
    
    it('should include the claim ID and reason in the context', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.context).toHaveProperty('claimId', claimId);
      expect(error.context).toHaveProperty('reason', reason);
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
    });
    
    it('should include the denial code in the context when provided', () => {
      const error = new ClaimDeniedError(claimId, reason, denialCode);
      expect(error.context).toHaveProperty('denialCode', denialCode);
    });
    
    it('should include the reason in the message', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.message).toContain(reason);
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new ClaimDeniedError(claimId, reason, denialCode, details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
    
    it('should serialize to the correct format', () => {
      const error = new ClaimDeniedError(claimId, reason, denialCode, details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_004`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
  });
  
  describe('ClaimPersistenceError', () => {
    const operation = 'create';
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new ClaimPersistenceError(operation);
      expect(error).toBeInstanceOf(BaseError);
    });
    
    it('should set the correct error type', () => {
      const error = new ClaimPersistenceError(operation);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });
    
    it('should set the correct error code', () => {
      const error = new ClaimPersistenceError(operation);
      expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_005`);
    });
    
    it('should include the operation in the context', () => {
      const error = new ClaimPersistenceError(operation);
      expect(error.context).toHaveProperty('operation', operation);
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
    });
    
    it('should include the operation in the message', () => {
      const error = new ClaimPersistenceError(operation);
      expect(error.message).toContain(operation);
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new ClaimPersistenceError(operation, details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ClaimPersistenceError(operation);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
    
    it('should serialize to the correct format', () => {
      const error = new ClaimPersistenceError(operation, details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_005`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
  });
  
  describe('ClaimProcessingApiError', () => {
    const apiOperation = 'submit';
    const statusCode = 503;
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    it('should extend BaseError', () => {
      const error = new ClaimProcessingApiError(apiOperation);
      expect(error).toBeInstanceOf(BaseError);
    });
    
    it('should set the correct error type', () => {
      const error = new ClaimProcessingApiError(apiOperation);
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });
    
    it('should set the correct error code', () => {
      const error = new ClaimProcessingApiError(apiOperation);
      expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_006`);
    });
    
    it('should include the API operation in the context', () => {
      const error = new ClaimProcessingApiError(apiOperation);
      expect(error.context).toHaveProperty('apiOperation', apiOperation);
      expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
    });
    
    it('should include the status code in the context when provided', () => {
      const error = new ClaimProcessingApiError(apiOperation, statusCode);
      expect(error.context).toHaveProperty('statusCode', statusCode);
    });
    
    it('should include the API operation in the message', () => {
      const error = new ClaimProcessingApiError(apiOperation);
      expect(error.message).toContain(apiOperation);
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new ClaimProcessingApiError(apiOperation, statusCode, details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should map to the correct HTTP status code', () => {
      const error = new ClaimProcessingApiError(apiOperation);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_GATEWAY);
    });
    
    it('should serialize to the correct format', () => {
      const error = new ClaimProcessingApiError(apiOperation, statusCode, details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_006`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
    
    describe('isRetryable method', () => {
      it('should return true for server errors (5xx)', () => {
        const error = new ClaimProcessingApiError(apiOperation, 500);
        expect(error.isRetryable()).toBe(true);
        
        const error2 = new ClaimProcessingApiError(apiOperation, 503);
        expect(error2.isRetryable()).toBe(true);
      });
      
      it('should return true for specific client errors (429, 408)', () => {
        const error = new ClaimProcessingApiError(apiOperation, 429);
        expect(error.isRetryable()).toBe(true);
        
        const error2 = new ClaimProcessingApiError(apiOperation, 408);
        expect(error2.isRetryable()).toBe(true);
      });
      
      it('should return false for other client errors', () => {
        const error = new ClaimProcessingApiError(apiOperation, 400);
        expect(error.isRetryable()).toBe(false);
        
        const error2 = new ClaimProcessingApiError(apiOperation, 404);
        expect(error2.isRetryable()).toBe(false);
      });
      
      it('should return true when no status code is provided', () => {
        const error = new ClaimProcessingApiError(apiOperation);
        expect(error.isRetryable()).toBe(true);
      });
    });
  });
  
  describe('ClaimDocumentError', () => {
    const documentType = 'receipt';
    const details = { additionalInfo: 'test details' };
    const cause = new Error('Original error');
    
    describe('with missing issue', () => {
      const issue = 'missing' as const;
      
      it('should extend BaseError', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error).toBeInstanceOf(BaseError);
      });
      
      it('should set the correct error type', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.type).toBe(ErrorType.VALIDATION);
      });
      
      it('should set the correct error code', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.code).toBe(`${PLAN_ERROR_PREFIXES.CLAIMS}_007`);
      });
      
      it('should include the document type and issue in the context', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.context).toHaveProperty('documentType', documentType);
        expect(error.context).toHaveProperty('issue', issue);
        expect(error.context).toHaveProperty('journey', JourneyContext.PLAN);
      });
      
      it('should include the document type in the message', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.message).toContain(documentType);
        expect(error.message).toContain('missing');
      });
      
      it('should include appropriate suggestion', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.suggestion).toContain('attach all required documents');
      });
      
      it('should map to the correct HTTP status code', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
      });
    });
    
    describe('with invalid issue', () => {
      const issue = 'invalid' as const;
      
      it('should set the correct error type', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.type).toBe(ErrorType.VALIDATION);
      });
      
      it('should include appropriate suggestion', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.suggestion).toContain('supported format');
      });
    });
    
    describe('with upload_failed issue', () => {
      const issue = 'upload_failed' as const;
      
      it('should set the correct error type', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.type).toBe(ErrorType.EXTERNAL);
      });
      
      it('should include appropriate suggestion', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.suggestion).toContain('try uploading');
      });
      
      it('should map to the correct HTTP status code', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });
    
    describe('with too_large issue', () => {
      const issue = 'too_large' as const;
      
      it('should set the correct error type', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.type).toBe(ErrorType.VALIDATION);
      });
      
      it('should include appropriate suggestion', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.suggestion).toContain('reduce the file size');
      });
    });
    
    describe('with processing_failed issue', () => {
      const issue = 'processing_failed' as const;
      
      it('should set the correct error type', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.type).toBe(ErrorType.TECHNICAL);
      });
      
      it('should include appropriate suggestion', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.suggestion).toContain('trouble processing');
      });
      
      it('should map to the correct HTTP status code', () => {
        const error = new ClaimDocumentError(documentType, issue);
        expect(error.getHttpStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });
    
    it('should include optional details and cause when provided', () => {
      const error = new ClaimDocumentError(documentType, 'missing', details, cause);
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });
    
    it('should serialize to the correct format', () => {
      const error = new ClaimDocumentError(documentType, 'missing', details);
      const serialized = error.toJSON();
      
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(serialized.error).toHaveProperty('code', `${PLAN_ERROR_PREFIXES.CLAIMS}_007`);
      expect(serialized.error).toHaveProperty('journey', JourneyContext.PLAN);
      expect(serialized.error).toHaveProperty('details', details);
    });
  });
});