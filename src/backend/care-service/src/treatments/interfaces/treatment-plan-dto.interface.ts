import { IJourneyDto } from '@austa/interfaces/journey';
import { ICareJourneyDto } from '@austa/interfaces/journey/care';

/**
 * Interface for creating a new treatment plan.
 * Defines the required and optional fields for treatment plan creation.
 */
export interface ICreateTreatmentPlanDto extends IJourneyDto {
  /**
   * Name of the treatment plan.
   * @example "Physical Therapy Plan"
   */
  name: string;

  /**
   * Detailed description of the treatment plan.
   * @example "A 12-week physical therapy program focusing on lower back rehabilitation."
   */
  description?: string;

  /**
   * Start date of the treatment plan.
   * @example "2023-04-15T00:00:00.000Z"
   */
  startDate: Date;

  /**
   * Optional end date of the treatment plan.
   * @example "2023-07-15T00:00:00.000Z"
   */
  endDate?: Date;

  /**
   * Progress percentage of the treatment plan (0-100).
   * Defaults to 0 if not provided.
   * @example 25
   */
  progress?: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  careActivityId: string;
}

/**
 * Interface for updating an existing treatment plan.
 * All fields are optional since updates may be partial.
 */
export interface IUpdateTreatmentPlanDto extends ICareJourneyDto {
  /**
   * Updated name of the treatment plan.
   * @example "Updated Physical Therapy Plan"
   */
  name?: string;

  /**
   * Updated description of the treatment plan.
   * @example "An updated 12-week physical therapy program with additional exercises."
   */
  description?: string;

  /**
   * Updated start date of the treatment plan.
   * @example "2023-04-20T00:00:00.000Z"
   */
  startDate?: Date;

  /**
   * Updated end date of the treatment plan.
   * @example "2023-07-20T00:00:00.000Z"
   */
  endDate?: Date;

  /**
   * Updated progress percentage of the treatment plan (0-100).
   * @example 35
   */
  progress?: number;
}