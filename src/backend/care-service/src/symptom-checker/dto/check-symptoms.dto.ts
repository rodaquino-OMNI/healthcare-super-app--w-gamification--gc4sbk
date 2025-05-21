import { IsArray, IsString, ArrayNotEmpty } from '@app/validation'; // v0.14.0
import { ISymptom } from '@austa/interfaces/journey/care';

/**
 * Data Transfer Object for checking symptoms.
 * Used as input for the symptom checker feature in the Care Now journey.
 * Validates that the request contains a non-empty array of symptom identifiers.
 */
export class CheckSymptomsDto {
  /**
   * Array of symptom identifiers to be checked.
   * These identifiers should match the symptom catalog in the system.
   * Each symptom is represented as a string identifier that maps to a known condition.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true }) // Validates each element in the array is a string
  symptoms: string[];
}