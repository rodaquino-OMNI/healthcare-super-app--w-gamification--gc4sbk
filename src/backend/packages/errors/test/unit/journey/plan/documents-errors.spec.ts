import { HttpStatus } from '@nestjs/common';
import {
  DocumentNotFoundError,
  DocumentFormatError,
  DocumentSizeExceededError,
  DocumentExpirationError,
  DocumentStorageError,
  DocumentVerificationError,
  DocumentProcessingError
} from '../../../../src/journey/plan/documents-errors';
import { ErrorType } from '@austa/interfaces/common/exceptions';
import { PlanErrorDomain } from '../../../../src/journey/plan/types';

describe('Plan Journey Document Errors', () => {
  describe('DocumentNotFoundError', () => {
    it('should create an error with the correct properties', () => {
      const documentId = 'doc-123';
      const details = { userId: 'user-456', claimId: 'claim-789' };
      const cause = new Error('Original error');
      
      const error = new DocumentNotFoundError(documentId, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Document with ID ${documentId} not found`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('PLAN_DOC_001');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentNotFoundError('doc-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON with correct structure', () => {
      const documentId = 'doc-123';
      const details = { userId: 'user-456' };
      
      const error = new DocumentNotFoundError(documentId, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_001');
      expect(jsonResult.error).toHaveProperty('message', `Document with ID ${documentId} not found`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('DocumentFormatError', () => {
    it('should create an error with the correct properties', () => {
      const format = 'txt';
      const supportedFormats = ['pdf', 'jpg', 'png'];
      const details = { documentId: 'doc-123', size: 1024 };
      const cause = new Error('Original error');
      
      const error = new DocumentFormatError(format, supportedFormats, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Invalid document format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('PLAN_DOC_002');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentFormatError('txt', ['pdf', 'jpg', 'png']);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to JSON with correct structure', () => {
      const format = 'txt';
      const supportedFormats = ['pdf', 'jpg', 'png'];
      const details = { documentId: 'doc-123' };
      
      const error = new DocumentFormatError(format, supportedFormats, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_002');
      expect(jsonResult.error).toHaveProperty('message', `Invalid document format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('DocumentSizeExceededError', () => {
    it('should create an error with the correct properties', () => {
      const size = 15000000; // 15MB
      const maxSize = 10000000; // 10MB
      const details = { documentId: 'doc-123', format: 'pdf' };
      const cause = new Error('Original error');
      
      const error = new DocumentSizeExceededError(size, maxSize, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Document size of ${size} bytes exceeds the maximum allowed size of ${maxSize} bytes`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('PLAN_DOC_003');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentSizeExceededError(15000000, 10000000);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to JSON with correct structure', () => {
      const size = 15000000; // 15MB
      const maxSize = 10000000; // 10MB
      const details = { documentId: 'doc-123', format: 'pdf' };
      
      const error = new DocumentSizeExceededError(size, maxSize, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_003');
      expect(jsonResult.error).toHaveProperty('message', `Document size of ${size} bytes exceeds the maximum allowed size of ${maxSize} bytes`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('DocumentExpirationError', () => {
    it('should create an error with the correct properties', () => {
      const documentId = 'doc-123';
      const expirationDate = new Date('2023-01-01');
      const details = { documentType: 'insurance-card', userId: 'user-456' };
      const cause = new Error('Original error');
      
      const error = new DocumentExpirationError(documentId, expirationDate, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Document with ID ${documentId} has expired on ${expirationDate.toISOString().split('T')[0]}`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('PLAN_DOC_004');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentExpirationError('doc-123', new Date('2023-01-01'));
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON with correct structure', () => {
      const documentId = 'doc-123';
      const expirationDate = new Date('2023-01-01');
      const details = { documentType: 'insurance-card' };
      
      const error = new DocumentExpirationError(documentId, expirationDate, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_004');
      expect(jsonResult.error).toHaveProperty('message', `Document with ID ${documentId} has expired on ${expirationDate.toISOString().split('T')[0]}`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('DocumentStorageError', () => {
    it('should create an error with the correct properties', () => {
      const operation = 'upload';
      const documentId = 'doc-123';
      const details = { storageProvider: 's3', bucket: 'documents-bucket' };
      const cause = new Error('Original error');
      
      const error = new DocumentStorageError(operation, documentId, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to ${operation} document with ID ${documentId}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('PLAN_DOC_005');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should handle missing documentId', () => {
      const operation = 'upload';
      const details = { storageProvider: 's3', bucket: 'documents-bucket' };
      
      const error = new DocumentStorageError(operation, undefined, details);
      
      expect(error.message).toBe(`Failed to ${operation} document`);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentStorageError('upload', 'doc-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON with correct structure', () => {
      const operation = 'upload';
      const documentId = 'doc-123';
      const details = { storageProvider: 's3', bucket: 'documents-bucket' };
      
      const error = new DocumentStorageError(operation, documentId, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_005');
      expect(jsonResult.error).toHaveProperty('message', `Failed to ${operation} document with ID ${documentId}`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('DocumentVerificationError', () => {
    it('should create an error with the correct properties', () => {
      const documentId = 'doc-123';
      const verificationService = 'digital-signature-verifier';
      const details = { reason: 'invalid signature', userId: 'user-456' };
      const cause = new Error('Original error');
      
      const error = new DocumentVerificationError(documentId, verificationService, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Verification failed for document with ID ${documentId} using service ${verificationService}`);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('PLAN_DOC_006');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentVerificationError('doc-123', 'digital-signature-verifier');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should serialize to JSON with correct structure', () => {
      const documentId = 'doc-123';
      const verificationService = 'digital-signature-verifier';
      const details = { reason: 'invalid signature' };
      
      const error = new DocumentVerificationError(documentId, verificationService, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.EXTERNAL);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_006');
      expect(jsonResult.error).toHaveProperty('message', `Verification failed for document with ID ${documentId} using service ${verificationService}`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('DocumentProcessingError', () => {
    it('should create an error with the correct properties', () => {
      const documentId = 'doc-123';
      const operation = 'OCR';
      const details = { format: 'pdf', pages: 5 };
      const cause = new Error('Original error');
      
      const error = new DocumentProcessingError(documentId, operation, details, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to process document with ID ${documentId} during ${operation}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('PLAN_DOC_007');
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should map to the correct HTTP status code', () => {
      const error = new DocumentProcessingError('doc-123', 'OCR');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should serialize to JSON with correct structure', () => {
      const documentId = 'doc-123';
      const operation = 'OCR';
      const details = { format: 'pdf', pages: 5 };
      
      const error = new DocumentProcessingError(documentId, operation, details);
      const jsonResult = error.toJSON();
      
      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(jsonResult.error).toHaveProperty('code', 'PLAN_DOC_007');
      expect(jsonResult.error).toHaveProperty('message', `Failed to process document with ID ${documentId} during ${operation}`);
      expect(jsonResult.error).toHaveProperty('details', details);
    });
  });

  describe('Error Domain Classification', () => {
    it('should classify DocumentNotFoundError as a Plan Document domain error', () => {
      const error = new DocumentNotFoundError('doc-123');
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });

    it('should classify DocumentFormatError as a Plan Document domain error', () => {
      const error = new DocumentFormatError('txt', ['pdf', 'jpg']);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });

    it('should classify DocumentSizeExceededError as a Plan Document domain error', () => {
      const error = new DocumentSizeExceededError(15000000, 10000000);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });

    it('should classify DocumentExpirationError as a Plan Document domain error', () => {
      const error = new DocumentExpirationError('doc-123', new Date('2023-01-01'));
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });

    it('should classify DocumentStorageError as a Plan Document domain error', () => {
      const error = new DocumentStorageError('upload', 'doc-123');
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });

    it('should classify DocumentVerificationError as a Plan Document domain error', () => {
      const error = new DocumentVerificationError('doc-123', 'digital-signature-verifier');
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });

    it('should classify DocumentProcessingError as a Plan Document domain error', () => {
      const error = new DocumentProcessingError('doc-123', 'OCR');
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('journey', 'plan');
      expect(detailedJson.context).toHaveProperty('domain', PlanErrorDomain.DOCUMENTS);
    });
  });

  describe('Error Context Data', () => {
    it('should include document-specific context in DocumentNotFoundError', () => {
      const documentId = 'doc-123';
      const details = { userId: 'user-456', claimId: 'claim-789' };
      
      const error = new DocumentNotFoundError(documentId, details);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('documentId', documentId);
    });

    it('should include format-specific context in DocumentFormatError', () => {
      const format = 'txt';
      const supportedFormats = ['pdf', 'jpg', 'png'];
      
      const error = new DocumentFormatError(format, supportedFormats);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('format', format);
      expect(detailedJson.context.metadata).toHaveProperty('supportedFormats', supportedFormats);
    });

    it('should include size-specific context in DocumentSizeExceededError', () => {
      const size = 15000000; // 15MB
      const maxSize = 10000000; // 10MB
      
      const error = new DocumentSizeExceededError(size, maxSize);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('size', size);
      expect(detailedJson.context.metadata).toHaveProperty('maxSize', maxSize);
      expect(detailedJson.context.metadata).toHaveProperty('sizeExceededBy', size - maxSize);
    });

    it('should include expiration-specific context in DocumentExpirationError', () => {
      const documentId = 'doc-123';
      const expirationDate = new Date('2023-01-01');
      
      const error = new DocumentExpirationError(documentId, expirationDate);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('documentId', documentId);
      expect(detailedJson.context.metadata).toHaveProperty('expirationDate');
      expect(new Date(detailedJson.context.metadata.expirationDate)).toEqual(expirationDate);
    });

    it('should include storage-specific context in DocumentStorageError', () => {
      const operation = 'upload';
      const documentId = 'doc-123';
      
      const error = new DocumentStorageError(operation, documentId);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('operation', operation);
      expect(detailedJson.context.metadata).toHaveProperty('documentId', documentId);
    });

    it('should include verification-specific context in DocumentVerificationError', () => {
      const documentId = 'doc-123';
      const verificationService = 'digital-signature-verifier';
      
      const error = new DocumentVerificationError(documentId, verificationService);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('documentId', documentId);
      expect(detailedJson.context.metadata).toHaveProperty('verificationService', verificationService);
    });

    it('should include processing-specific context in DocumentProcessingError', () => {
      const documentId = 'doc-123';
      const operation = 'OCR';
      
      const error = new DocumentProcessingError(documentId, operation);
      const detailedJson = error.toDetailedJSON();
      
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('metadata');
      expect(detailedJson.context.metadata).toHaveProperty('documentId', documentId);
      expect(detailedJson.context.metadata).toHaveProperty('operation', operation);
    });
  });
});