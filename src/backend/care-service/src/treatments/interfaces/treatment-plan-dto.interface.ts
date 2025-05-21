import { ICareActivity } from '@austa/interfaces/journey/care/appointment.interface';

/**
 * Interface for creating a new treatment plan.
 * Defines the structure and validation requirements for treatment plan creation
 * requests in the Care Journey.
 */
export interface ICreateTreatmentPlanDto {
  /**
   * Name of the treatment plan.
   */
  name: string;

  /**
   * Description of the treatment plan.
   */
  description: string;

  /**
   * Start date of the treatment plan.
   */
  startDate: Date;

  /**
   * End date of the treatment plan.
   */
  endDate: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * Optional, defaults to 0 if not provided.
   */
  progress?: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   */
  careActivityId: string;
}

/**
 * Interface for updating an existing treatment plan.
 * All fields are optional to allow partial updates.
 */
export interface IUpdateTreatmentPlanDto {
  /**
   * Updated name of the treatment plan.
   */
  name?: string;

  /**
   * Updated description of the treatment plan.
   */
  description?: string;

  /**
   * Updated start date of the treatment plan.
   */
  startDate?: Date;

  /**
   * Updated end date of the treatment plan.
   */
  endDate?: Date;

  /**
   * Updated progress of the treatment plan (percentage from 0 to 100).
   */
  progress?: number;
}