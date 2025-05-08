import { ICareActivity } from '../../../interfaces/journey/care/care-activity.interface';

/**
 * Interface representing a treatment plan in the Care Journey.
 * This interface defines the structure for prescribed treatment plans as specified
 * in the Care Now journey requirements, allowing tracking and display of treatment progress.
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
   * Reference to the care activity this treatment plan is associated with.
   */
  careActivity?: ICareActivity;

  /**
   * Date and time when the treatment plan was created.
   */
  createdAt: Date;

  /**
   * Date and time when the treatment plan was last updated.
   */
  updatedAt: Date;
}