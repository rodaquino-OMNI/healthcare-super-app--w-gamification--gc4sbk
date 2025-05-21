import { ISymptom } from '@austa/interfaces/care';

/**
 * Interface representing the request structure for the symptom checker API.
 * This interface provides a pure type definition without validation concerns,
 * complementing the CheckSymptomsDto used for request validation.
 */
export interface ISymptomCheckerRequest {
  /**
   * Array of symptom identifiers to be checked.
   * These identifiers should match the symptom catalog in the system.
   * Uses the ISymptom interface from the shared interfaces package.
   */
  symptoms: string[];
}