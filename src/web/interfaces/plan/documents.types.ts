/**
 * @file Plan Document Types
 * @description Defines TypeScript interfaces for documents associated with insurance claims within the Plan journey.
 * These interfaces establish the data structure for files uploaded as part of claim submissions, such as receipts,
 * prescriptions, or medical reports.
 */

import { Claim } from '@austa/interfaces/plan/claims.types';

/**
 * Document types supported by the Plan journey for claim submissions
 */
export type DocumentType = 
  | 'receipt' 
  | 'prescription' 
  | 'medical_report' 
  | 'referral' 
  | 'invoice' 
  | 'explanation_of_benefits' 
  | 'other';

/**
 * Represents a document associated with an insurance claim.
 * 
 * Documents are files uploaded by users as supporting evidence for their insurance claims,
 * such as receipts, medical reports, or prescriptions. Each document has a unique identifier,
 * a type classification, a file path pointing to the stored file, and metadata about when it was uploaded.
 * 
 * @see Claim - Documents are typically associated with a Claim through the Claim.documents property
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  
  /** Classification of the document (e.g., receipt, prescription, medical report) */
  type: DocumentType;
  
  /** Path to the stored file in the system */
  filePath: string;
  
  /** ISO 8601 timestamp when the document was uploaded */
  uploadedAt: string;
  
  /** Optional description provided by the user */
  description?: string;
  
  /** File size in bytes */
  fileSize?: number;
  
  /** MIME type of the document */
  mimeType?: string;
}

/**
 * Represents the response from the document upload API
 */
export interface DocumentUploadResponse {
  /** The created document object */
  document: Document;
  
  /** Whether the upload was successful */
  success: boolean;
  
  /** Any error message if the upload failed */
  error?: string;
}

/**
 * Represents the request to upload a new document
 */
export interface DocumentUploadRequest {
  /** The type of document being uploaded */
  type: DocumentType;
  
  /** The claim ID this document is associated with */
  claimId: string;
  
  /** Optional description of the document */
  description?: string;
}