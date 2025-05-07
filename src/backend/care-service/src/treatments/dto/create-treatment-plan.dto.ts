import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for creating a new treatment plan.
 * Validates the input data for creating a treatment plan in the Care Journey.
 */
export class CreateTreatmentPlanDto {
  /**
   * Name of the treatment plan.
   * @example "Physical Therapy Plan"
   */
  @IsNotEmpty({ message: 'Treatment plan name is required' })
  @IsString({ message: 'Treatment plan name must be a string' })
  name: string;

  /**
   * Description of the treatment plan.
   * @example "A comprehensive physical therapy plan for knee rehabilitation"
   */
  @IsOptional()
  @IsString({ message: 'Treatment plan description must be a string' })
  description?: string;

  /**
   * Start date of the treatment plan.
   * @example "2023-05-15T10:00:00Z"
   */
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDate({ message: 'Start date must be a valid date' })
  @Type(() => Date)
  startDate: Date;

  /**
   * End date of the treatment plan.
   * @example "2023-06-15T10:00:00Z"
   */
  @IsOptional()
  @IsDate({ message: 'End date must be a valid date' })
  @Type(() => Date)
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * @example 25
   */
  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  @Min(0, { message: 'Progress cannot be less than 0' })
  @Max(100, { message: 'Progress cannot be greater than 100' })
  progress?: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsNotEmpty({ message: 'Care activity ID is required' })
  @IsUUID('4', { message: 'Care activity ID must be a valid UUID' })
  careActivityId: string;
}