/**
 * @file Possible Condition Interface
 * 
 * This file defines the IPossibleCondition interface which represents a potential
 * medical condition identified by the symptom checker algorithm. It is used in the
 * Care Now journey to provide structured information about possible diagnoses.
 */

// Import from shared interfaces package
import { PossibleCondition as IPossibleConditionBase } from '@austa/interfaces/journey/care';

/**
 * Interface representing a possible medical condition identified by the symptom checker.
 * This interface is used to provide structured information about potential diagnoses
 * based on the user's reported symptoms.
 *
 * @interface IPossibleCondition
 */
export interface IPossibleCondition extends IPossibleConditionBase {
  /**
   * The name of the possible medical condition.
   * This should be a recognized medical condition from the condition catalog.
   */
  name: string;
  
  /**
   * The confidence level for this diagnosis, represented as a number between 0 and 1.
   * Higher values indicate greater confidence in the diagnosis based on the symptoms provided.
   */
  confidence: number;
  
  /**
   * A brief description of the medical condition, including common characteristics
   * and general information to help users understand the potential diagnosis.
   */
  description: string;
}