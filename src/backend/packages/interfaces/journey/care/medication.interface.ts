/**
 * Interface representing a medication in the Care Journey.
 * This interface is used for tracking medications as part of the Care Now journey,
 * supporting medication tracking with reminders and adherence monitoring.
 */
export interface IMedication {
  /**
   * Unique identifier for the medication
   */
  id: string;

  /**
   * ID of the user who owns this medication record
   */
  userId: string;

  /**
   * Name of the medication
   */
  name: string;

  /**
   * Dosage amount (e.g., 500 for 500mg)
   */
  dosage: number;

  /**
   * Frequency of medication (e.g., "daily", "twice daily", "every 8 hours")
   */
  frequency: string;

  /**
   * Date when the medication regimen starts
   */
  startDate: Date;

  /**
   * Optional end date for the medication regimen
   */
  endDate?: Date;

  /**
   * Whether reminders are enabled for this medication
   */
  reminderEnabled: boolean;

  /**
   * Any additional notes or instructions
   */
  notes?: string;

  /**
   * Whether the medication is currently active
   */
  active: boolean;

  /**
   * Record creation timestamp
   */
  createdAt: Date;

  /**
   * Record update timestamp
   */
  updatedAt: Date;
}