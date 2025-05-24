/**
 * @file Document Types
 * @description Defines TypeScript interfaces for documents associated with insurance claims within the Plan journey.
 * These interfaces establish the data structure for files uploaded as part of claim submissions, such as
 * receipts, prescriptions, or medical reports. They are used by claim submission forms and document display components.
 */

import { Claim } from './claims.types';

/**
 * Represents a document associated with an insurance claim.
 * 
 * Documents are files uploaded by users as supporting evidence for insurance claims,
 * such as receipts, medical reports, prescriptions, or other relevant documentation.
 * Each document has a unique identifier, type classification, file storage path, and timestamp.
 * 
 * @example
 * ```typescript
 * const receipt: Document = {
 *   id: 'doc-123',
 *   type: 'receipt',
 *   filePath: '/storage/claims/doc-123.pdf',
 *   uploadedAt: new Date('2023-05-15T10:30:00Z')
 * };
 * ```
 * 
 * @see Claim - Documents are typically associated with a specific insurance claim
 */
export interface Document {
  /**
   * Unique identifier for the document
   */
  id: string;
  
  /**
   * Classification of the document (e.g., 'receipt', 'prescription', 'medical_report', 'invoice')
   */
  type: string;
  
  /**
   * Storage path where the document file is located
   * This is typically a relative path within the application's storage system
   */
  filePath: string;
  
  /**
   * Timestamp when the document was uploaded to the system
   * Stored as an ISO date string in the database but typed as Date for frontend usage
   */
  uploadedAt: Date | string;
}

/**
 * Represents the type of document that can be uploaded for a claim
 * Used for validation and UI display purposes
 */
export type DocumentType = 
  | 'receipt'
  | 'prescription'
  | 'medical_report'
  | 'invoice'
  | 'referral'
  | 'explanation_of_benefits'
  | 'other';

/**
 * Represents metadata about a document without the actual file content
 * Used for document listings and previews
 */
export interface DocumentMetadata {
  /**
   * Unique identifier for the document
   */
  id: string;
  
  /**
   * Classification of the document
   */
  type: DocumentType;
  
  /**
   * Original filename as uploaded by the user
   */
  filename: string;
  
  /**
   * Size of the document file in bytes
   */
  fileSize: number;
  
  /**
   * MIME type of the document file
   */
  mimeType: string;
  
  /**
   * Timestamp when the document was uploaded
   */
  uploadedAt: Date | string;
}