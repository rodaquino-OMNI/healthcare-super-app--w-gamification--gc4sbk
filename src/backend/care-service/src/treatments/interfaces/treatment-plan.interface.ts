import { IAppointment } from '@austa/interfaces/journey/care/appointment.interface';
import { ITreatmentPlan as BaseTreatmentPlan } from '@austa/interfaces/journey/care/treatment-plan.interface';

/**
 * Interface representing a treatment plan for a patient.
 * This interface extends the base ITreatmentPlan from @austa/interfaces
 * to ensure consistent typing between frontend and backend.
 * 
 * Treatment plans are part of the Care Journey and allow tracking and display
 * of prescribed treatment plans as specified in the Care Now journey requirements.
 */
export interface ITreatmentPlan extends BaseTreatmentPlan {
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
   * Reference to the appointment this treatment plan is associated with.
   * In the original entity, this was a reference to CareActivity, but we're using
   * IAppointment as the closest equivalent in the new interface structure.
   */
  careActivity: IAppointment;

  /**
   * Date and time when the treatment plan was created.
   */
  createdAt: Date;

  /**
   * Date and time when the treatment plan was last updated.
   */
  updatedAt: Date;
}