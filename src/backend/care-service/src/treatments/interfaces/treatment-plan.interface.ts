import { IBaseEntity } from '@austa/interfaces/common';
import { ICareActivity } from '@austa/interfaces/journey/care';

/**
 * Interface representing a treatment plan for a patient.
 * This interface is part of the Care Journey and allows tracking and display
 * of prescribed treatment plans as specified in the Care Now journey requirements.
 * 
 * @interface ITreatmentPlan
 * @extends {IBaseEntity}
 */
export interface ITreatmentPlan extends IBaseEntity {
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
  careActivity: ICareActivity;

  /**
   * Date and time when the treatment plan was created.
   */
  createdAt: Date;

  /**
   * Date and time when the treatment plan was last updated.
   */
  updatedAt: Date;
}