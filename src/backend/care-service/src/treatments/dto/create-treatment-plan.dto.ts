import { IsString, IsOptional, IsDate, IsNumber, IsUUID, Min, Max, Length, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating a new treatment plan.
 * Validates input data for treatment plan creation.
 */
export class CreateTreatmentPlanDto {
  /**
   * Name of the treatment plan.
   * Must be between 3 and 255 characters.
   */
  @ApiProperty({
    description: 'Name of the treatment plan',
    example: 'Physical Therapy Plan',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  /**
   * Description of the treatment plan.
   * Optional field that can contain detailed information.
   */
  @ApiProperty({
    description: 'Description of the treatment plan',
    example: 'A comprehensive physical therapy plan for post-surgery recovery',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Start date of the treatment plan.
   * Must be a valid date.
   */
  @ApiProperty({
    description: 'Start date of the treatment plan',
    example: '2023-01-01T00:00:00Z',
    type: Date,
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  /**
   * End date of the treatment plan.
   * Optional field that must be a valid date if provided.
   */
  @ApiProperty({
    description: 'End date of the treatment plan',
    example: '2023-03-01T00:00:00Z',
    required: false,
    type: Date,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * Optional field with default value of 0.
   */
  @ApiProperty({
    description: 'Progress of the treatment plan (percentage from 0 to 100)',
    example: 25,
    required: false,
    minimum: 0,
    maximum: 100,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  /**
   * ID of the care activity this treatment plan is associated with.
   * Must be a valid UUID.
   */
  @ApiProperty({
    description: 'ID of the care activity this treatment plan is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  careActivityId: string;
}