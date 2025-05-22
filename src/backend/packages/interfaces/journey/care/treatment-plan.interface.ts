/**
 * @file Treatment Plan Interface
 * @description Defines the interface for treatment plans in the Care Journey.
 */

/**
 * Interface for treatment plan data in the Care Journey.
 * Represents prescribed treatment plans for patients with progress tracking.
 */
export interface ITreatmentPlan {
  /**
   * Unique identifier for the treatment plan.
   */
  id: string;

  /**
   * Name of the treatment plan.
   */
  name: string;

  /**
   * Description of the treatment plan.
   */
  description?: string;

  /**
   * Start date of the treatment plan.
   */
  startDate: Date;

  /**
   * End date of the treatment plan.
   */
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   */
  progress: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   */
  careActivityId: string;

  /**
   * Date and time when the treatment plan was created.
   */
  createdAt: Date;

  /**
   * Date and time when the treatment plan was last updated.
   */
  updatedAt: Date;
}