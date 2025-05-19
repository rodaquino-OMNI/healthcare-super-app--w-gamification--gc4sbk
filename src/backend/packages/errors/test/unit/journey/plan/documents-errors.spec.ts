import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the BaseError class and related types
import { BaseError, ErrorType } from '../../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';

// Import the document-specific error classes
import {
  DocumentNotFoundError,
  DocumentFormatError,
  DocumentSizeExceededError,
  DocumentExpirationError,
  DocumentStorageError,
  DocumentVerificationError,
  DocumentProcessingError
} from '../../../../src/journey/plan/documents-errors';

/**
 * Test suite for Plan journey's document-specific error classes
 * Verifies error inheritance, classification, HTTP status code mapping, and context handling
 */
describe('Plan Journey Document Errors', () => {
  // Common test data
  const documentId = 'doc-123';
  const userId = 'user-456';
  const planId = 'plan-789';
  const claimId = 'claim-101';
  
  describe('DocumentNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new DocumentNotFoundError(documentId);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new DocumentNotFoundError(documentId);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include document ID in error details', () => {
      const error = new DocumentNotFoundError(documentId);
      expect(error.details).toBeDefined();
      expect(error.details.documentId).toBe(documentId);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentNotFoundError(documentId);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentNotFoundError(documentId, {
        userId,
        planId
      });

      const json = error.toJSON();
      expect(json.error.details.documentId).toBe(documentId);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.planId).toBe(planId);
    });
  });

  describe('DocumentFormatError', () => {
    const format = 'PDF';
    const supportedFormats = ['PDF', 'JPG', 'PNG'];
    const providedFormat = 'TIFF';

    it('should extend BaseError', () => {
      const error = new DocumentFormatError(providedFormat, supportedFormats);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have VALIDATION error type', () => {
      const error = new DocumentFormatError(providedFormat, supportedFormats);
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should include format details in error details', () => {
      const error = new DocumentFormatError(providedFormat, supportedFormats);
      expect(error.details).toBeDefined();
      expect(error.details.providedFormat).toBe(providedFormat);
      expect(error.details.supportedFormats).toEqual(supportedFormats);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentFormatError(providedFormat, supportedFormats);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.VALIDATION);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentFormatError(providedFormat, supportedFormats, {
        userId,
        documentId
      });

      const json = error.toJSON();
      expect(json.error.details.providedFormat).toBe(providedFormat);
      expect(json.error.details.supportedFormats).toEqual(supportedFormats);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.documentId).toBe(documentId);
    });
  });

  describe('DocumentSizeExceededError', () => {
    const providedSize = 15000000; // 15MB
    const maxSize = 10000000; // 10MB

    it('should extend BaseError', () => {
      const error = new DocumentSizeExceededError(providedSize, maxSize);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have VALIDATION error type', () => {
      const error = new DocumentSizeExceededError(providedSize, maxSize);
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should include size details in error details', () => {
      const error = new DocumentSizeExceededError(providedSize, maxSize);
      expect(error.details).toBeDefined();
      expect(error.details.providedSize).toBe(providedSize);
      expect(error.details.maxSize).toBe(maxSize);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentSizeExceededError(providedSize, maxSize);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.VALIDATION);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentSizeExceededError(providedSize, maxSize, {
        userId,
        documentId,
        fileName: 'large-document.pdf'
      });

      const json = error.toJSON();
      expect(json.error.details.providedSize).toBe(providedSize);
      expect(json.error.details.maxSize).toBe(maxSize);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.documentId).toBe(documentId);
      expect(json.error.context.fileName).toBe('large-document.pdf');
    });
  });

  describe('DocumentExpirationError', () => {
    const expirationDate = new Date('2023-01-01');
    const currentDate = new Date('2023-02-15');

    it('should extend BaseError', () => {
      const error = new DocumentExpirationError(documentId, expirationDate, currentDate);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have BUSINESS error type', () => {
      const error = new DocumentExpirationError(documentId, expirationDate, currentDate);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include expiration details in error details', () => {
      const error = new DocumentExpirationError(documentId, expirationDate, currentDate);
      expect(error.details).toBeDefined();
      expect(error.details.documentId).toBe(documentId);
      expect(error.details.expirationDate).toEqual(expirationDate);
      expect(error.details.currentDate).toEqual(currentDate);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentExpirationError(documentId, expirationDate, currentDate);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentExpirationError(documentId, expirationDate, currentDate, {
        userId,
        documentType: 'insurance-card'
      });

      const json = error.toJSON();
      expect(json.error.details.documentId).toBe(documentId);
      expect(new Date(json.error.details.expirationDate)).toEqual(expirationDate);
      expect(new Date(json.error.details.currentDate)).toEqual(currentDate);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.documentType).toBe('insurance-card');
    });
  });

  describe('DocumentStorageError', () => {
    const originalError = new Error('Storage service unavailable');

    it('should extend BaseError', () => {
      const error = new DocumentStorageError(documentId, originalError);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have TECHNICAL error type', () => {
      const error = new DocumentStorageError(documentId, originalError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include document ID in error details', () => {
      const error = new DocumentStorageError(documentId, originalError);
      expect(error.details).toBeDefined();
      expect(error.details.documentId).toBe(documentId);
    });

    it('should preserve original error as cause', () => {
      const error = new DocumentStorageError(documentId, originalError);
      expect(error.cause).toBe(originalError);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentStorageError(documentId, originalError);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentStorageError(documentId, originalError, {
        userId,
        operation: 'upload',
        storageProvider: 's3'
      });

      const json = error.toJSON();
      expect(json.error.details.documentId).toBe(documentId);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.operation).toBe('upload');
      expect(json.error.context.storageProvider).toBe('s3');
    });
  });

  describe('DocumentVerificationError', () => {
    const verificationService = 'external-verification-api';
    const originalError = new Error('Verification service unavailable');

    it('should extend BaseError', () => {
      const error = new DocumentVerificationError(documentId, verificationService, originalError);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have EXTERNAL error type', () => {
      const error = new DocumentVerificationError(documentId, verificationService, originalError);
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include verification details in error details', () => {
      const error = new DocumentVerificationError(documentId, verificationService, originalError);
      expect(error.details).toBeDefined();
      expect(error.details.documentId).toBe(documentId);
      expect(error.details.verificationService).toBe(verificationService);
    });

    it('should preserve original error as cause', () => {
      const error = new DocumentVerificationError(documentId, verificationService, originalError);
      expect(error.cause).toBe(originalError);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentVerificationError(documentId, verificationService, originalError);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentVerificationError(documentId, verificationService, originalError, {
        userId,
        documentType: 'insurance-card',
        verificationAttempt: 2
      });

      const json = error.toJSON();
      expect(json.error.details.documentId).toBe(documentId);
      expect(json.error.details.verificationService).toBe(verificationService);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.documentType).toBe('insurance-card');
      expect(json.error.context.verificationAttempt).toBe(2);
    });
  });

  describe('DocumentProcessingError', () => {
    const processingStage = 'text-extraction';
    const originalError = new Error('OCR service failed');

    it('should extend BaseError', () => {
      const error = new DocumentProcessingError(documentId, processingStage, originalError);
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should have TECHNICAL error type', () => {
      const error = new DocumentProcessingError(documentId, processingStage, originalError);
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include processing details in error details', () => {
      const error = new DocumentProcessingError(documentId, processingStage, originalError);
      expect(error.details).toBeDefined();
      expect(error.details.documentId).toBe(documentId);
      expect(error.details.processingStage).toBe(processingStage);
    });

    it('should preserve original error as cause', () => {
      const error = new DocumentProcessingError(documentId, processingStage, originalError);
      expect(error.cause).toBe(originalError);
    });

    it('should map to correct HTTP status code', () => {
      const error = new DocumentProcessingError(documentId, processingStage, originalError);
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should serialize with proper context', () => {
      const error = new DocumentProcessingError(documentId, processingStage, originalError, {
        userId,
        claimId,
        documentType: 'medical-receipt',
        processingService: 'ocr-service'
      });

      const json = error.toJSON();
      expect(json.error.details.documentId).toBe(documentId);
      expect(json.error.details.processingStage).toBe(processingStage);
      expect(json.error.context.userId).toBe(userId);
      expect(json.error.context.claimId).toBe(claimId);
      expect(json.error.context.documentType).toBe('medical-receipt');
      expect(json.error.context.processingService).toBe('ocr-service');
    });
  });

  describe('Error Integration', () => {
    it('should support error chaining for document processing workflow', () => {
      // Simulate a chain of errors in document processing
      const storageError = new Error('Failed to retrieve from storage');
      const documentStorageError = new DocumentStorageError('doc-123', storageError, {
        operation: 'download',
        storageProvider: 's3'
      });
      
      const processingError = new DocumentProcessingError(
        'doc-123',
        'text-extraction',
        documentStorageError,
        { processingService: 'ocr-service' }
      );

      // Verify error chain
      expect(processingError.cause).toBe(documentStorageError);
      expect(documentStorageError.cause).toBe(storageError);
      
      // Verify root cause extraction
      expect(processingError.getRootCause()).toBe(storageError);
      
      // Verify error chain formatting
      const chainString = processingError.formatErrorChain();
      expect(chainString).toContain('text-extraction');
      expect(chainString).toContain('Failed to retrieve from storage');
    });

    it('should support context propagation through error chain', () => {
      // Create a chain of errors with context
      const verificationError = new DocumentVerificationError(
        'doc-123',
        'external-verification-api',
        new Error('API timeout'),
        { requestId: 'req-123', documentType: 'insurance-card' }
      );
      
      const processingError = new DocumentProcessingError(
        'doc-123',
        'verification',
        verificationError,
        { userId: 'user-456', claimId: 'claim-789' }
      );

      // Context from both errors should be merged
      expect(processingError.context.requestId).toBe('req-123');
      expect(processingError.context.documentType).toBe('insurance-card');
      expect(processingError.context.userId).toBe('user-456');
      expect(processingError.context.claimId).toBe('claim-789');
    });
  });
});