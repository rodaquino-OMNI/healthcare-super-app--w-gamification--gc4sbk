import { BaseError } from '../../../../src/base';
import {
  ClaimNotFoundError,
  DuplicateClaimError,
  ClaimValidationError,
  ClaimDeniedError,
  ClaimPersistenceError,
  ClaimProcessingApiError,
  ClaimDocumentError
} from '../../../../src/journey/plan/claims-errors';
import { ErrorType } from '../../../../src/types';

describe('Plan Journey Claim Errors', () => {
  describe('ClaimNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new ClaimNotFoundError('CLAIM123');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new ClaimNotFoundError('CLAIM123');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include claim ID in error message', () => {
      const claimId = 'CLAIM123';
      const error = new ClaimNotFoundError(claimId);
      expect(error.message).toContain(claimId);
    });

    it('should map to 404 HTTP status code', () => {
      const error = new ClaimNotFoundError('CLAIM123');
      expect(error.statusCode).toBe(404);
    });

    it('should serialize with claim context', () => {
      const claimId = 'CLAIM123';
      const error = new ClaimNotFoundError(claimId);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('message');
      expect(serialized).toHaveProperty('code');
      expect(serialized).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', claimId);
    });
  });

  describe('DuplicateClaimError', () => {
    it('should extend BaseError', () => {
      const error = new DuplicateClaimError('CLAIM123', 'CLAIM456');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new DuplicateClaimError('CLAIM123', 'CLAIM456');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include both claim IDs in error message', () => {
      const newClaimId = 'CLAIM123';
      const existingClaimId = 'CLAIM456';
      const error = new DuplicateClaimError(newClaimId, existingClaimId);
      expect(error.message).toContain(newClaimId);
      expect(error.message).toContain(existingClaimId);
    });

    it('should map to 409 HTTP status code', () => {
      const error = new DuplicateClaimError('CLAIM123', 'CLAIM456');
      expect(error.statusCode).toBe(409);
    });

    it('should serialize with both claim IDs in context', () => {
      const newClaimId = 'CLAIM123';
      const existingClaimId = 'CLAIM456';
      const error = new DuplicateClaimError(newClaimId, existingClaimId);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('newClaimId', newClaimId);
      expect(serialized.context).toHaveProperty('existingClaimId', existingClaimId);
    });
  });

  describe('ClaimValidationError', () => {
    it('should extend BaseError', () => {
      const error = new ClaimValidationError('CLAIM123', { field: 'serviceDate', message: 'Invalid date format' });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have VALIDATION error type', () => {
      const error = new ClaimValidationError('CLAIM123', { field: 'serviceDate', message: 'Invalid date format' });
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should include validation details in error message', () => {
      const claimId = 'CLAIM123';
      const validationErrors = { field: 'serviceDate', message: 'Invalid date format' };
      const error = new ClaimValidationError(claimId, validationErrors);
      expect(error.message).toContain(claimId);
      expect(error.message).toContain('validation');
    });

    it('should map to 400 HTTP status code', () => {
      const error = new ClaimValidationError('CLAIM123', { field: 'serviceDate', message: 'Invalid date format' });
      expect(error.statusCode).toBe(400);
    });

    it('should serialize with validation errors in context', () => {
      const claimId = 'CLAIM123';
      const validationErrors = { field: 'serviceDate', message: 'Invalid date format' };
      const error = new ClaimValidationError(claimId, validationErrors);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', claimId);
      expect(serialized.context).toHaveProperty('validationErrors', validationErrors);
    });

    it('should handle multiple validation errors', () => {
      const claimId = 'CLAIM123';
      const validationErrors = [
        { field: 'serviceDate', message: 'Invalid date format' },
        { field: 'amount', message: 'Amount must be positive' }
      ];
      const error = new ClaimValidationError(claimId, validationErrors);
      const serialized = error.serialize();
      
      expect(serialized.context.validationErrors).toHaveLength(2);
      expect(serialized.context.validationErrors[0]).toHaveProperty('field', 'serviceDate');
      expect(serialized.context.validationErrors[1]).toHaveProperty('field', 'amount');
    });
  });

  describe('ClaimDeniedError', () => {
    it('should extend BaseError', () => {
      const error = new ClaimDeniedError('CLAIM123', 'Service not covered');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new ClaimDeniedError('CLAIM123', 'Service not covered');
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include denial reason in error message', () => {
      const claimId = 'CLAIM123';
      const reason = 'Service not covered';
      const error = new ClaimDeniedError(claimId, reason);
      expect(error.message).toContain(claimId);
      expect(error.message).toContain(reason);
    });

    it('should map to 422 HTTP status code', () => {
      const error = new ClaimDeniedError('CLAIM123', 'Service not covered');
      expect(error.statusCode).toBe(422);
    });

    it('should serialize with denial reason in context', () => {
      const claimId = 'CLAIM123';
      const reason = 'Service not covered';
      const error = new ClaimDeniedError(claimId, reason);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', claimId);
      expect(serialized.context).toHaveProperty('denialReason', reason);
    });

    it('should handle additional denial details', () => {
      const claimId = 'CLAIM123';
      const reason = 'Service not covered';
      const details = { policyReference: 'POL-123', appealDeadline: '2023-12-31' };
      const error = new ClaimDeniedError(claimId, reason, details);
      const serialized = error.serialize();
      
      expect(serialized.context).toHaveProperty('denialDetails');
      expect(serialized.context.denialDetails).toHaveProperty('policyReference', 'POL-123');
      expect(serialized.context.denialDetails).toHaveProperty('appealDeadline', '2023-12-31');
    });
  });

  describe('ClaimPersistenceError', () => {
    it('should extend BaseError', () => {
      const error = new ClaimPersistenceError('CLAIM123', 'Database connection failed');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have TECHNICAL error type', () => {
      const error = new ClaimPersistenceError('CLAIM123', 'Database connection failed');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include technical error details in message', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'Database connection failed';
      const error = new ClaimPersistenceError(claimId, errorMessage);
      expect(error.message).toContain(claimId);
      expect(error.message).toContain(errorMessage);
    });

    it('should map to 500 HTTP status code', () => {
      const error = new ClaimPersistenceError('CLAIM123', 'Database connection failed');
      expect(error.statusCode).toBe(500);
    });

    it('should serialize with technical error details in context', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'Database connection failed';
      const error = new ClaimPersistenceError(claimId, errorMessage);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', claimId);
      expect(serialized.context).toHaveProperty('technicalError', errorMessage);
    });

    it('should include original error when provided', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'Database connection failed';
      const originalError = new Error('Connection timeout');
      const error = new ClaimPersistenceError(claimId, errorMessage, originalError);
      
      expect(error.cause).toBe(originalError);
      
      const serialized = error.serialize();
      expect(serialized.context).toHaveProperty('originalError');
      expect(serialized.context.originalError).toContain('Connection timeout');
    });
  });

  describe('ClaimProcessingApiError', () => {
    it('should extend BaseError', () => {
      const error = new ClaimProcessingApiError('CLAIM123', 'External API failure');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have EXTERNAL error type', () => {
      const error = new ClaimProcessingApiError('CLAIM123', 'External API failure');
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include API error details in message', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'External API failure';
      const error = new ClaimProcessingApiError(claimId, errorMessage);
      expect(error.message).toContain(claimId);
      expect(error.message).toContain(errorMessage);
    });

    it('should map to 502 HTTP status code', () => {
      const error = new ClaimProcessingApiError('CLAIM123', 'External API failure');
      expect(error.statusCode).toBe(502);
    });

    it('should serialize with API error details in context', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'External API failure';
      const error = new ClaimProcessingApiError(claimId, errorMessage);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', claimId);
      expect(serialized.context).toHaveProperty('apiError', errorMessage);
    });

    it('should include API response details when provided', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'External API failure';
      const apiResponse = { status: 429, data: { error: 'Rate limit exceeded' } };
      const error = new ClaimProcessingApiError(claimId, errorMessage, apiResponse);
      const serialized = error.serialize();
      
      expect(serialized.context).toHaveProperty('apiResponse');
      expect(serialized.context.apiResponse).toHaveProperty('status', 429);
      expect(serialized.context.apiResponse.data).toHaveProperty('error', 'Rate limit exceeded');
    });

    it('should support retry information', () => {
      const claimId = 'CLAIM123';
      const errorMessage = 'External API failure';
      const apiResponse = { status: 429, headers: { 'retry-after': '60' } };
      const error = new ClaimProcessingApiError(claimId, errorMessage, apiResponse);
      const serialized = error.serialize();
      
      expect(serialized.context).toHaveProperty('retryAfter', 60);
    });
  });

  describe('ClaimDocumentError', () => {
    it('should extend BaseError', () => {
      const error = new ClaimDocumentError('CLAIM123', 'DOC456', 'Invalid document format');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have VALIDATION error type', () => {
      const error = new ClaimDocumentError('CLAIM123', 'DOC456', 'Invalid document format');
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should include document error details in message', () => {
      const claimId = 'CLAIM123';
      const documentId = 'DOC456';
      const errorMessage = 'Invalid document format';
      const error = new ClaimDocumentError(claimId, documentId, errorMessage);
      expect(error.message).toContain(claimId);
      expect(error.message).toContain(documentId);
      expect(error.message).toContain(errorMessage);
    });

    it('should map to 400 HTTP status code', () => {
      const error = new ClaimDocumentError('CLAIM123', 'DOC456', 'Invalid document format');
      expect(error.statusCode).toBe(400);
    });

    it('should serialize with document error details in context', () => {
      const claimId = 'CLAIM123';
      const documentId = 'DOC456';
      const errorMessage = 'Invalid document format';
      const error = new ClaimDocumentError(claimId, documentId, errorMessage);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('claimId', claimId);
      expect(serialized.context).toHaveProperty('documentId', documentId);
      expect(serialized.context).toHaveProperty('documentError', errorMessage);
    });

    it('should include document requirements when provided', () => {
      const claimId = 'CLAIM123';
      const documentId = 'DOC456';
      const errorMessage = 'Invalid document format';
      const requirements = { allowedFormats: ['PDF', 'JPG'], maxSizeKb: 5000 };
      const error = new ClaimDocumentError(claimId, documentId, errorMessage, requirements);
      const serialized = error.serialize();
      
      expect(serialized.context).toHaveProperty('documentRequirements');
      expect(serialized.context.documentRequirements).toHaveProperty('allowedFormats');
      expect(serialized.context.documentRequirements.allowedFormats).toContain('PDF');
      expect(serialized.context.documentRequirements).toHaveProperty('maxSizeKb', 5000);
    });
  });
});