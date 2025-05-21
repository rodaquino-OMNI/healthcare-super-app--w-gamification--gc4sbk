import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTreatmentPlanDto } from './create-treatment-plan.dto';

/**
 * Data Transfer Object for updating an existing treatment plan.
 * Extends CreateTreatmentPlanDto but makes all fields optional for partial updates.
 * 
 * This DTO allows clients to submit only the fields they want to update without
 * requiring all fields, while preserving validation rules from the original DTO.
 * 
 * Part of the Care Journey's treatment management system, this DTO ensures data
 * integrity during partial updates by maintaining validation constraints:
 * - String length validations remain enforced for text fields
 * - Date validations ensure proper formatting and validity
 * - Numeric range validations (e.g., progress 0-100) are preserved
 * - UUID validations for relationship fields remain intact
 * 
 * By using PartialType, we maintain a consistent validation pattern across
 * the Care service while supporting flexible update operations.
 */
export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {
  /**
   * All properties from CreateTreatmentPlanDto are inherited and made optional.
   * Validation rules from the original DTO are preserved.
   * 
   * This approach ensures that even partial updates maintain data integrity
   * through consistent validation rules. For example:
   * - If 'name' is provided, it must still be 3-255 characters
   * - If 'progress' is provided, it must still be between 0-100
   * - If 'startDate' is provided, it must still be a valid date
   * 
   * @example
   * // Partial update with only name and progress
   * {
   *   "name": "Updated Physical Therapy Plan",
   *   "progress": 50
   * }
   * 
   * @example
   * // Partial update with only dates
   * {
   *   "startDate": "2023-02-01T00:00:00Z",
   *   "endDate": "2023-04-01T00:00:00Z"
   * }
   */
  @ApiProperty({
    description: 'All fields from CreateTreatmentPlanDto are optional for partial updates',
    required: false,
  })
  _example?: never; // This property is never used, just for documentation purposes
}