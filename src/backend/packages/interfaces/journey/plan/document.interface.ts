/**
 * Interface for document metadata associated with insurance claims in the Plan Journey.
 * This interface defines the structure for documents that can be attached to claims,
 * such as receipts, medical reports, and other supporting documentation.
 */

import { IClaim } from './claim.interface';

/**
 * Enum representing the possible upload statuses for a document.
 */
export enum DocumentUploadStatus {
  /**
   * Document is in the process of being uploaded
   */
  UPLOADING = 'uploading',
  
  /**
   * Document has been successfully uploaded
   */
  COMPLETED = 'completed',
  
  /**
   * Document upload has failed
   */
  FAILED = 'failed',
  
  /**
   * Document has been processed and verified
   */
  VERIFIED = 'verified',
  
  /**
   * Document has been rejected during verification
   */
  REJECTED = 'rejected'
}

/**
 * Enum representing the possible document types in the Plan Journey.
 */
export enum DocumentType {
  /**
   * Medical receipt or invoice
   */
  RECEIPT = 'receipt',
  
  /**
   * Medical report from a healthcare provider
   */
  MEDICAL_REPORT = 'medical_report',
  
  /**
   * Prescription from a healthcare provider
   */
  PRESCRIPTION = 'prescription',
  
  /**
   * Laboratory test results
   */
  LAB_RESULT = 'lab_result',
  
  /**
   * Imaging study results (X-ray, MRI, CT scan, etc.)
   */
  IMAGING = 'imaging',
  
  /**
   * Insurance policy documentation
   */
  POLICY = 'policy',
  
  /**
   * Other supporting documentation
   */
  OTHER = 'other'
}

/**
 * Interface for document metadata associated with insurance claims.
 */
export interface IDocument {
  /**
   * Unique identifier for the document
   */
  id: string;
  
  /**
   * ID of the entity this document is associated with (e.g., claim ID)
   */
  entityId: string;
  
  /**
   * Type of entity this document is associated with (e.g., 'claim', 'coverage')
   */
  entityType: string;
  
  /**
   * Type of document
   */
  type: DocumentType | string;
  
  /**
   * Name of the document file
   */
  fileName: string;
  
  /**
   * Size of the document file in bytes
   */
  fileSize: number;
  
  /**
   * MIME type of the document file
   */
  mimeType: string;
  
  /**
   * Path to the stored file
   */
  filePath: string;
  
  /**
   * Current upload status of the document
   */
  uploadStatus: DocumentUploadStatus;
  
  /**
   * Date when the document was created/uploaded
   */
  createdAt: Date;
  
  /**
   * Date when the document was last updated
   */
  updatedAt: Date;
  
  /**
   * Optional description of the document
   */
  description?: string;
  
  /**
   * Optional metadata for the document (stored as JSON)
   */
  metadata?: Record<string, any>;
  
  /**
   * Reference to the claim this document is associated with (if entityType is 'claim')
   * This is a type-safe relationship with the IClaim interface
   */
  claim?: IClaim;
}