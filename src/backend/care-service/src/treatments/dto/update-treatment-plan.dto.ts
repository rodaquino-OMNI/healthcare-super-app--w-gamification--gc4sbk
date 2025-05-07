import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentPlanDto } from './create-treatment-plan.dto';

/**
 * Data Transfer Object for updating an existing treatment plan.
 * Extends CreateTreatmentPlanDto but makes all fields optional for partial updates.
 * Preserves all validation rules from the CreateTreatmentPlanDto.
 */
export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {}