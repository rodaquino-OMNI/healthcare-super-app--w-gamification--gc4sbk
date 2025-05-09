/**
 * @file documents-errors.ts
 * @description Defines specialized error classes for the Documents domain in the Plan journey.
 * These error classes ensure consistent error handling for document-related operations
 * with proper HTTP status codes and structured error responses.
 */

import { ErrorType } from '../../../../shared/src/exceptions/exceptions.types';
import {
  createPlanException,
  DocumentsErrorContext,
  PlanErrorType
} from './types';
import {
  PLAN_DOC_VALIDATION_ERRORS,
  PLAN_DOC_BUSINESS_ERRORS,
  PLAN_DOC_TECHNICAL_ERRORS,
  PLAN_DOC_EXTERNAL_ERRORS
} from './error-codes';

/**
 * Base class for all document-related errors in the Plan journey.
 * Provides common functionality and ensures consistent error structure.
 */
export class BaseDocumentError extends Error {
  /**
   * Creates a new BaseDocumentError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code from error-codes.ts
   * @param type - Type of error from ErrorType enum
   * @param context - Additional context about the document error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    type: ErrorType,
    context?: DocumentsErrorContext,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Create the underlying AppException
    this.exception = createPlanException(
      message,
      code,
      {
        ...context,
        planErrorType: PlanErrorType.DOCUMENTS
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseDocumentError.prototype);
  }
  
  /**
   * The underlying AppException instance.
   */
  public readonly exception: ReturnType<typeof createPlanException>;
  
  /**
   * Returns the error code.
   */
  get code(): string {
    return this.exception.code;
  }
  
  /**
   * Returns the error type.
   */
  get type(): ErrorType {
    return this.exception.type;
  }
  
  /**
   * Returns the error details.
   */
  get details(): any {
    return this.exception.details;
  }
  
  /**
   * Returns a JSON representation of the exception.
   */
  toJSON(): Record<string, any> {
    return this.exception.toJSON();
  }
  
  /**
   * Converts the error to an HttpException for NestJS.
   */
  toHttpException() {
    return this.exception.toHttpException();
  }
}

/**
 * Error thrown when a document is not found in the system.
 * This is a business logic error that occurs when a document ID is valid
 * but the document does not exist or has been deleted.
 */
export class DocumentNotFoundError extends BaseDocumentError {
  /**
   * Creates a new DocumentNotFoundError instance.
   * 
   * @param documentId - ID of the document that was not found
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    documentId: string,
    message: string = `Document with ID ${documentId} not found`,
    context?: Omit<DocumentsErrorContext, 'documentId'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_BUSINESS_ERRORS.DOCUMENT_NOT_FOUND,
      ErrorType.BUSINESS,
      { ...context, documentId },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentNotFoundError.prototype);
  }
}

/**
 * Error thrown when a document has an invalid format.
 * This is a validation error that occurs when a document's format
 * does not meet the required specifications.
 */
export class DocumentFormatError extends BaseDocumentError {
  /**
   * Creates a new DocumentFormatError instance.
   * 
   * @param documentType - Type of the document with invalid format
   * @param supportedTypes - List of supported document types
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    documentType: string,
    supportedTypes: string[],
    message: string = `Document format '${documentType}' is not supported. Supported formats: ${supportedTypes.join(', ')}`,
    context?: Omit<DocumentsErrorContext, 'documentType' | 'supportedTypes'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_VALIDATION_ERRORS.INVALID_DOCUMENT_FORMAT,
      ErrorType.VALIDATION,
      { ...context, documentType, supportedTypes },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentFormatError.prototype);
  }
}

/**
 * Error thrown when a document exceeds the maximum allowed size.
 * This is a validation error that occurs when a document's file size
 * is larger than the system allows.
 */
export class DocumentSizeExceededError extends BaseDocumentError {
  /**
   * Creates a new DocumentSizeExceededError instance.
   * 
   * @param fileSize - Size of the document in bytes
   * @param maxFileSize - Maximum allowed file size in bytes
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    fileSize: number,
    maxFileSize: number,
    message: string = `Document size of ${fileSize} bytes exceeds the maximum allowed size of ${maxFileSize} bytes`,
    context?: Omit<DocumentsErrorContext, 'fileSize' | 'maxFileSize'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_VALIDATION_ERRORS.DOCUMENT_TOO_LARGE,
      ErrorType.VALIDATION,
      { ...context, fileSize, maxFileSize },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentSizeExceededError.prototype);
  }
}

/**
 * Error thrown when a document has expired.
 * This is a business logic error that occurs when a document's
 * validity period has ended.
 */
export class DocumentExpirationError extends BaseDocumentError {
  /**
   * Creates a new DocumentExpirationError instance.
   * 
   * @param documentId - ID of the expired document
   * @param expirationDate - Date when the document expired
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    documentId: string,
    expirationDate: Date,
    message: string = `Document with ID ${documentId} expired on ${expirationDate.toISOString()}`,
    context?: Omit<DocumentsErrorContext, 'documentId'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_BUSINESS_ERRORS.DOCUMENT_EXPIRED,
      ErrorType.BUSINESS,
      { 
        ...context, 
        documentId, 
        expirationDate: expirationDate.toISOString() 
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentExpirationError.prototype);
  }
}

/**
 * Error thrown when there is an issue with document storage.
 * This is a technical error that occurs when the system fails
 * to store, retrieve, or manage a document in the storage system.
 */
export class DocumentStorageError extends BaseDocumentError {
  /**
   * Creates a new DocumentStorageError instance.
   * 
   * @param operation - Storage operation that failed (e.g., 'upload', 'download', 'delete')
   * @param storageProvider - Name of the storage provider (e.g., 'S3', 'Azure Blob')
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    operation: string,
    storageProvider: string,
    message: string = `Failed to ${operation} document using storage provider ${storageProvider}`,
    context?: Omit<DocumentsErrorContext, 'storageProvider'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_TECHNICAL_ERRORS.STORAGE_ERROR,
      ErrorType.TECHNICAL,
      { ...context, operation, storageProvider },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentStorageError.prototype);
  }
}

/**
 * Error thrown when document verification fails.
 * This is an external system error that occurs when the system
 * fails to verify the authenticity or validity of a document
 * through an external verification service.
 */
export class DocumentVerificationError extends BaseDocumentError {
  /**
   * Creates a new DocumentVerificationError instance.
   * 
   * @param documentId - ID of the document that failed verification
   * @param verificationService - Name of the verification service
   * @param reason - Reason for verification failure
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    documentId: string,
    verificationService: string,
    reason: string,
    message: string = `Document verification failed for document ID ${documentId} using service ${verificationService}: ${reason}`,
    context?: Omit<DocumentsErrorContext, 'documentId'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_EXTERNAL_ERRORS.VERIFICATION_SERVICE_ERROR,
      ErrorType.EXTERNAL,
      { ...context, documentId, verificationService, reason },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentVerificationError.prototype);
  }
}

/**
 * Error thrown when document processing fails.
 * This is a technical error that occurs when the system fails
 * to process a document, such as extracting text or metadata.
 */
export class DocumentProcessingError extends BaseDocumentError {
  /**
   * Creates a new DocumentProcessingError instance.
   * 
   * @param documentId - ID of the document that failed processing
   * @param processingType - Type of processing that failed (e.g., 'OCR', 'metadata extraction')
   * @param message - Custom error message (optional)
   * @param context - Additional context about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    documentId: string,
    processingType: string,
    message: string = `Failed to process document ID ${documentId} with processing type ${processingType}`,
    context?: Omit<DocumentsErrorContext, 'documentId'>,
    cause?: Error
  ) {
    super(
      message,
      PLAN_DOC_TECHNICAL_ERRORS.PROCESSING_PIPELINE_ERROR,
      ErrorType.TECHNICAL,
      { ...context, documentId, processingType },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DocumentProcessingError.prototype);
  }
}

/**
 * Namespace containing all document-related errors for the Plan journey.
 * This allows for organized imports in consuming code.
 */
export const Documents = {
  DocumentNotFoundError,
  DocumentFormatError,
  DocumentSizeExceededError,
  DocumentExpirationError,
  DocumentStorageError,
  DocumentVerificationError,
  DocumentProcessingError
};