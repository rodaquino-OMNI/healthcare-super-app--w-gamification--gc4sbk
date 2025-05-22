import { AppException, ErrorType } from '@austa/interfaces/common/exceptions';

/**
 * Error code prefix for Plan journey document-related errors.
 * Used to categorize and identify errors related to document management.
 */
const ERROR_CODE_PREFIX = 'PLAN_DOC_';

/**
 * Error thrown when a requested document cannot be found.
 * This typically occurs when a document ID is invalid or the document has been deleted.
 */
export class DocumentNotFoundError extends AppException {
  constructor(documentId: string, details?: any, cause?: Error) {
    super(
      `Document with ID ${documentId} not found`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}001`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a document's format is invalid or unsupported.
 * This occurs during document validation when the file type doesn't match
 * the expected formats (e.g., PDF, JPG, PNG).
 */
export class DocumentFormatError extends AppException {
  constructor(format: string, supportedFormats: string[], details?: any, cause?: Error) {
    super(
      `Invalid document format: ${format}. Supported formats: ${supportedFormats.join(', ')}`,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}002`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a document exceeds the maximum allowed file size.
 * This occurs during document upload when the file size is larger than
 * the configured limit.
 */
export class DocumentSizeExceededError extends AppException {
  constructor(size: number, maxSize: number, details?: any, cause?: Error) {
    super(
      `Document size of ${size} bytes exceeds the maximum allowed size of ${maxSize} bytes`,
      ErrorType.VALIDATION,
      `${ERROR_CODE_PREFIX}003`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a document has expired or is outside its validity period.
 * This occurs when a document's expiration date has passed or when it's not
 * yet valid (e.g., insurance cards, medical certificates).
 */
export class DocumentExpirationError extends AppException {
  constructor(documentId: string, expirationDate: Date, details?: any, cause?: Error) {
    super(
      `Document with ID ${documentId} has expired on ${expirationDate.toISOString().split('T')[0]}`,
      ErrorType.BUSINESS,
      `${ERROR_CODE_PREFIX}004`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in storing or retrieving a document from
 * the storage system (e.g., S3, file system).
 * This represents a technical issue with the document persistence layer.
 */
export class DocumentStorageError extends AppException {
  constructor(operation: string, documentId?: string, details?: any, cause?: Error) {
    super(
      `Failed to ${operation} document${documentId ? ` with ID ${documentId}` : ''}`,
      ErrorType.TECHNICAL,
      `${ERROR_CODE_PREFIX}005`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when document verification with an external system fails.
 * This occurs when authenticating documents with third-party verification
 * services or when validating digital signatures.
 */
export class DocumentVerificationError extends AppException {
  constructor(documentId: string, verificationService: string, details?: any, cause?: Error) {
    super(
      `Verification failed for document with ID ${documentId} using service ${verificationService}`,
      ErrorType.EXTERNAL,
      `${ERROR_CODE_PREFIX}006`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when processing a document's content fails.
 * This occurs during content extraction, OCR, or other document
 * processing operations.
 */
export class DocumentProcessingError extends AppException {
  constructor(documentId: string, operation: string, details?: any, cause?: Error) {
    super(
      `Failed to process document with ID ${documentId} during ${operation}`,
      ErrorType.TECHNICAL,
      `${ERROR_CODE_PREFIX}007`,
      details,
      cause
    );
  }
}