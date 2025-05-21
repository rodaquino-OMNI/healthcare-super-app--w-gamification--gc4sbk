import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTreatmentPlanDto } from './create-treatment-plan.dto';

/**
 * Data Transfer Object for updating an existing treatment plan.
 * Extends CreateTreatmentPlanDto but makes all fields optional.
 * This allows for partial updates where only the fields that need to be changed are provided.
 */
export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {
  /**
   * All fields from CreateTreatmentPlanDto are inherited but made optional.
   * This includes:
   * - name: string (optional)
   * - description: string (optional)
   * - startDate: Date (optional)
   * - endDate: Date (optional)
   * - progress: number (optional)
   * - careActivityId: string (optional)
   */
  @ApiProperty({
    description: 'All fields are optional for updates',
    required: false,
  })
  _placeholder?: never;
}