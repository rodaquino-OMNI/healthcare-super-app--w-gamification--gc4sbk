import { IsArray, IsString, ArrayNotEmpty } from '@app/utils/validation'; // v0.14.0
import { SymptomCheckerResponse } from '@austa/interfaces/journey/care/symptom-checker.interface';

/**
 * Data Transfer Object for checking symptoms.
 * Used as input for the symptom checker feature in the Care Now journey.
 * 
 * @see SymptomCheckerResponse - The response interface returned by the symptom checker service
 */
export class CheckSymptomsDto {
  /**
   * Array of symptom identifiers to be checked.
   * These identifiers should match the symptom catalog in the system.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true }) // Validates each element in the array is a string
  symptoms: string[];
}