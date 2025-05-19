import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for creating a new treatment plan.
 * This DTO validates treatment plan creation requests in the Care service.
 * It ensures data integrity and type safety for treatment plan data passed to the TreatmentsService.
 */
export class CreateTreatmentPlanDto {
  /**
   * Name of the treatment plan.
   * @example "Physical Therapy Plan"
   */
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  /**
   * Description of the treatment plan.
   * @example "Weekly physical therapy sessions focusing on lower back rehabilitation"
   */
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  /**
   * Start date of the treatment plan.
   * @example "2023-04-15T00:00:00.000Z"
   */
  @IsDate({ message: 'Start date must be a valid date' })
  @Type(() => Date)
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: Date;

  /**
   * End date of the treatment plan.
   * @example "2023-07-15T00:00:00.000Z"
   */
  @IsDate({ message: 'End date must be a valid date' })
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * @example 25
   */
  @IsNumber({}, { message: 'Progress must be a number' })
  @Min(0, { message: 'Progress cannot be less than 0' })
  @Max(100, { message: 'Progress cannot be greater than 100' })
  @IsOptional()
  progress?: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID('4', { message: 'Care activity ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Care activity ID is required' })
  careActivityId: string;
}