/**
 * Interface representing a medical event in a user's health history.
 * 
 * This interface defines the structure for events such as doctor visits, diagnoses, procedures, and treatments,
 * providing a chronological view of a user's medical history as required by F-101-RQ-002.
 */
export interface IMedicalEvent {
  /**
   * Unique identifier for the medical event.
   */
  id: string;

  /**
   * Reference to the health record this event belongs to.
   */
  recordId: string;

  /**
   * The type of medical event (e.g., 'visit', 'diagnosis', 'procedure', 'medication').
   */
  type: string;

  /**
   * Detailed description of the medical event.
   */
  description?: string;

  /**
   * Date when the medical event occurred.
   */
  date: Date;

  /**
   * Healthcare provider associated with this medical event.
   */
  provider?: string;

  /**
   * References to documents associated with this medical event (e.g., medical reports, images).
   */
  documents?: string[];

  /**
   * Timestamp when the record was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the record was last updated.
   */
  updatedAt: Date;
}