import { SymptomSeverity } from '@austa/interfaces/journey/care';

/**
 * Interface for symptom checker request data structure.
 * Provides a type-safe contract for the symptom checker API without validation concerns.
 * 
 * This interface is aligned with CheckSymptomsDto but separated from validation logic,
 * following the principle of separation between validation (DTOs) and type definitions (interfaces).
 * 
 * @see CheckSymptomsDto for the validation-enabled version of this interface
 */
export interface ISymptomCheckerRequest {
  /**
   * Array of symptom identifiers to be checked.
   * These identifiers should match the symptom catalog in the system.
   */
  symptoms: string[];
  
  /**
   * Optional severity level for each symptom.
   * If provided, the array length should match the symptoms array.
   */
  severityLevels?: SymptomSeverity[];
}