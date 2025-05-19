import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicationDto } from '@app/medications/dto/create-medication.dto';

/**
 * Data Transfer Object for updating an existing medication.
 * 
 * This DTO extends CreateMedicationDto but makes all properties optional,
 * following NestJS best practices for PATCH operations. It maintains the same
 * validation rules when fields are provided, but doesn't require all fields
 * to be present in the request.
 *
 * @example
 * // Partial update with only the fields that need to change
 * {
 *   "dosage": 250,
 *   "frequency": "Three times daily"
 * }
 */
export class UpdateMedicationDto extends PartialType(CreateMedicationDto) {}