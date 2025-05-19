import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentPlanDto } from '@app/care/treatments/dto/create-treatment-plan.dto';

/**
 * Data Transfer Object for updating an existing treatment plan.
 * Extends CreateTreatmentPlanDto but makes all fields optional for partial updates.
 * This allows clients to submit only the fields they want to update without requiring all fields.
 * All validation rules from CreateTreatmentPlanDto are preserved.
 */
export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {}