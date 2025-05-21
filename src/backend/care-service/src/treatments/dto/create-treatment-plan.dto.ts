import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for creating a new treatment plan.
 * This DTO validates treatment plan creation requests in the Care service.
 * It ensures data integrity and type safety for treatment plan data passed to the TreatmentsService.
 */
export class CreateTreatmentPlanDto {
  /**
   * Name of the treatment plan.
   * Required field with maximum length of 255 characters.
   */
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name cannot exceed 255 characters' })
  name: string;

  /**
   * Description of the treatment plan.
   * Optional field providing details about the treatment plan.
   */
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  /**
   * Start date of the treatment plan.
   * Required field indicating when the treatment plan begins.
   */
  @IsDate({ message: 'Start date must be a valid date' })
  @IsNotEmpty({ message: 'Start date is required' })
  @Type(() => Date)
  startDate: Date;

  /**
   * End date of the treatment plan.
   * Optional field indicating when the treatment plan ends.
   */
  @IsDate({ message: 'End date must be a valid date' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * Optional field with default value of 0.
   */
  @IsNumber({}, { message: 'Progress must be a number' })
  @IsOptional()
  @Min(0, { message: 'Progress cannot be less than 0' })
  @Max(100, { message: 'Progress cannot exceed 100' })
  progress?: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   * Required field to establish relationship with a CareActivity.
   */
  @IsUUID('4', { message: 'Care activity ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Care activity ID is required' })
  careActivityId: string;
}