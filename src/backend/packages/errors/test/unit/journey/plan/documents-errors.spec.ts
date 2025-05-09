import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../src/base';
import {
  DocumentNotFoundError,
  DocumentFormatError,
  DocumentSizeExceededError,
  DocumentExpirationError,
  DocumentStorageError,
  DocumentVerificationError,
  DocumentProcessingError,
  BaseDocumentError
} from '../../../../../../src/journey/plan/documents-errors';
import {
  PLAN_DOC_VALIDATION_ERRORS,
  PLAN_DOC_BUSINESS_ERRORS,
  PLAN_DOC_TECHNICAL_ERRORS,
  PLAN_DOC_EXTERNAL_ERRORS
} from '../../../../../../src/journey/plan/error-codes';
import { PlanErrorType } from '../../../../../../src/journey/plan/types';

describe('Plan Journey Document Errors', () => {
  describe('BaseDocumentError', () => {
    it('should create a base document error with correct properties', () => {
      // Arrange
      const message = 'Test document error';
      const code = 'TEST_CODE';
      const type = ErrorType.BUSINESS;
      const context = { documentId: '123' };
      const cause = new Error('Original error');

      // Act
      const error = new BaseDocumentError(message, code, type, context, cause);

      // Assert
      expect(error).toBeDefined();
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.type).toBe(type);
      expect(error.details).toEqual(expect.objectContaining({
        documentId: '123',
        planErrorType: PlanErrorType.DOCUMENTS
      }));
      expect(error.exception).toBeDefined();
    });

    it('should properly serialize to JSON', () => {
      // Arrange
      const error = new BaseDocumentError(
        'Test document error',
        'TEST_CODE',
        ErrorType.BUSINESS,
        { documentId: '123' }
      );

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', 'TEST_CODE');
      expect(json.error).toHaveProperty('message', 'Test document error');
      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toHaveProperty('documentId', '123');
      expect(json.error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should convert to HttpException with correct status code', () => {
      // Arrange
      const error = new BaseDocumentError(
        'Test document error',
        'TEST_CODE',
        ErrorType.BUSINESS,
        { documentId: '123' }
      );

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException).toBeDefined();
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });
  });

  describe('DocumentNotFoundError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const error = new DocumentNotFoundError(documentId);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(PLAN_DOC_BUSINESS_ERRORS.DOCUMENT_NOT_FOUND);
      expect(error.message).toBe(`Document with ID ${documentId} not found`);
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const customMessage = 'Custom document not found message';
      const context = { userId: 'user-456' };
      const error = new DocumentNotFoundError(documentId, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('userId', 'user-456');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentNotFoundError('doc-123');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });
  });

  describe('DocumentFormatError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const documentType = 'image/bmp';
      const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const error = new DocumentFormatError(documentType, supportedTypes);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(PLAN_DOC_VALIDATION_ERRORS.INVALID_DOCUMENT_FORMAT);
      expect(error.message).toBe(
        `Document format '${documentType}' is not supported. Supported formats: ${supportedTypes.join(', ')}`
      );
      expect(error.details).toHaveProperty('documentType', documentType);
      expect(error.details).toHaveProperty('supportedTypes', supportedTypes);
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const documentType = 'image/bmp';
      const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const customMessage = 'Custom format error message';
      const context = { fileName: 'document.bmp' };
      const error = new DocumentFormatError(documentType, supportedTypes, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('documentType', documentType);
      expect(error.details).toHaveProperty('supportedTypes', supportedTypes);
      expect(error.details).toHaveProperty('fileName', 'document.bmp');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentFormatError('image/bmp', ['image/jpeg', 'image/png']);

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST); // 400 for VALIDATION errors
    });
  });

  describe('DocumentSizeExceededError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const fileSize = 15000000; // 15MB
      const maxFileSize = 10000000; // 10MB
      const error = new DocumentSizeExceededError(fileSize, maxFileSize);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(PLAN_DOC_VALIDATION_ERRORS.DOCUMENT_TOO_LARGE);
      expect(error.message).toBe(
        `Document size of ${fileSize} bytes exceeds the maximum allowed size of ${maxFileSize} bytes`
      );
      expect(error.details).toHaveProperty('fileSize', fileSize);
      expect(error.details).toHaveProperty('maxFileSize', maxFileSize);
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const fileSize = 15000000; // 15MB
      const maxFileSize = 10000000; // 10MB
      const customMessage = 'Custom size exceeded message';
      const context = { fileName: 'large-document.pdf' };
      const error = new DocumentSizeExceededError(fileSize, maxFileSize, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('fileSize', fileSize);
      expect(error.details).toHaveProperty('maxFileSize', maxFileSize);
      expect(error.details).toHaveProperty('fileName', 'large-document.pdf');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentSizeExceededError(15000000, 10000000);

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST); // 400 for VALIDATION errors
    });
  });

  describe('DocumentExpirationError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const expirationDate = new Date('2023-01-01');
      const error = new DocumentExpirationError(documentId, expirationDate);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(PLAN_DOC_BUSINESS_ERRORS.DOCUMENT_EXPIRED);
      expect(error.message).toBe(
        `Document with ID ${documentId} expired on ${expirationDate.toISOString()}`
      );
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('expirationDate', expirationDate.toISOString());
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const expirationDate = new Date('2023-01-01');
      const customMessage = 'Custom expiration message';
      const context = { documentType: 'Insurance Card' };
      const error = new DocumentExpirationError(documentId, expirationDate, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('expirationDate', expirationDate.toISOString());
      expect(error.details).toHaveProperty('documentType', 'Insurance Card');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentExpirationError('doc-123', new Date('2023-01-01'));

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY); // 422 for BUSINESS errors
    });
  });

  describe('DocumentStorageError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const operation = 'upload';
      const storageProvider = 'S3';
      const error = new DocumentStorageError(operation, storageProvider);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(PLAN_DOC_TECHNICAL_ERRORS.STORAGE_ERROR);
      expect(error.message).toBe(
        `Failed to ${operation} document using storage provider ${storageProvider}`
      );
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('storageProvider', storageProvider);
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const operation = 'upload';
      const storageProvider = 'S3';
      const customMessage = 'Custom storage error message';
      const context = { bucketName: 'documents-bucket' };
      const error = new DocumentStorageError(operation, storageProvider, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('operation', operation);
      expect(error.details).toHaveProperty('storageProvider', storageProvider);
      expect(error.details).toHaveProperty('bucketName', 'documents-bucket');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentStorageError('upload', 'S3');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR); // 500 for TECHNICAL errors
    });
  });

  describe('DocumentVerificationError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const verificationService = 'IDVerify';
      const reason = 'Document appears to be altered';
      const error = new DocumentVerificationError(documentId, verificationService, reason);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(PLAN_DOC_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR);
      expect(error.message).toBe(
        `Document verification failed for document ID ${documentId} using service ${verificationService}: ${reason}`
      );
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('verificationService', verificationService);
      expect(error.details).toHaveProperty('reason', reason);
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const verificationService = 'IDVerify';
      const reason = 'Document appears to be altered';
      const customMessage = 'Custom verification error message';
      const context = { attemptCount: 2 };
      const error = new DocumentVerificationError(
        documentId,
        verificationService,
        reason,
        customMessage,
        context
      );

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('verificationService', verificationService);
      expect(error.details).toHaveProperty('reason', reason);
      expect(error.details).toHaveProperty('attemptCount', 2);
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentVerificationError('doc-123', 'IDVerify', 'Verification failed');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY); // 502 for EXTERNAL errors
    });
  });

  describe('DocumentProcessingError', () => {
    it('should create error with correct type and code', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const processingType = 'OCR';
      const error = new DocumentProcessingError(documentId, processingType);

      // Assert
      expect(error).toBeInstanceOf(BaseDocumentError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(PLAN_DOC_TECHNICAL_ERRORS.PROCESSING_PIPELINE_ERROR);
      expect(error.message).toBe(
        `Failed to process document ID ${documentId} with processing type ${processingType}`
      );
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('processingType', processingType);
      expect(error.details).toHaveProperty('planErrorType', PlanErrorType.DOCUMENTS);
    });

    it('should accept custom message and context', () => {
      // Arrange & Act
      const documentId = 'doc-123';
      const processingType = 'OCR';
      const customMessage = 'Custom processing error message';
      const context = { processorVersion: '2.1.0' };
      const error = new DocumentProcessingError(documentId, processingType, customMessage, context);

      // Assert
      expect(error.message).toBe(customMessage);
      expect(error.details).toHaveProperty('documentId', documentId);
      expect(error.details).toHaveProperty('processingType', processingType);
      expect(error.details).toHaveProperty('processorVersion', '2.1.0');
    });

    it('should map to correct HTTP status code', () => {
      // Arrange
      const error = new DocumentProcessingError('doc-123', 'OCR');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR); // 500 for TECHNICAL errors
    });
  });

  describe('Documents namespace', () => {
    it('should export all document error classes', () => {
      // Import the Documents namespace
      const { Documents } = require('../../../../../../src/journey/plan/documents-errors');

      // Assert that all error classes are exported
      expect(Documents.DocumentNotFoundError).toBeDefined();
      expect(Documents.DocumentFormatError).toBeDefined();
      expect(Documents.DocumentSizeExceededError).toBeDefined();
      expect(Documents.DocumentExpirationError).toBeDefined();
      expect(Documents.DocumentStorageError).toBeDefined();
      expect(Documents.DocumentVerificationError).toBeDefined();
      expect(Documents.DocumentProcessingError).toBeDefined();
    });
  });
});