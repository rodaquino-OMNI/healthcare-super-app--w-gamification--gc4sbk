/**
 * Interface representing a document associated with a plan-related entity such as a claim.
 * Used for storing document metadata and file references for insurance claims.
 * This standardized interface is used across services for consistent document handling.
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
   * Type of document (e.g., 'receipt', 'medical_report', 'prescription')
   */
  type: string;

  /**
   * Path to the file in storage (e.g., S3 path)
   */
  filePath: string;

  /**
   * Original filename as uploaded by the user
   */
  fileName?: string;

  /**
   * MIME type of the document (e.g., 'application/pdf', 'image/jpeg')
   */
  mimeType?: string;

  /**
   * Size of the file in bytes
   */
  fileSize?: number;

  /**
   * Upload status of the document
   * Possible values: 'pending', 'processing', 'completed', 'failed'
   */
  uploadStatus?: string;

  /**
   * Timestamp when the document was created
   */
  createdAt: Date;

  /**
   * Timestamp when the document was last updated
   */
  updatedAt: Date;

  /**
   * Optional reference to the claim this document is associated with
   * Only populated when the entityType is 'claim'
   */
  claim?: any; // Will be IClaim when properly imported
}