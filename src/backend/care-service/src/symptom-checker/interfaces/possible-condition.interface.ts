/**
 * Interface representing a possible medical condition identified by the symptom checker.
 * This interface is used to structure diagnostic possibilities based on user-reported symptoms.
 * Part of the Care journey's symptom checker module.
 */

/**
 * Represents a potential medical condition identified by the symptom checker algorithm.
 * Each condition includes a name, confidence level (0-1), and descriptive information.
 * 
 * This interface is extracted from the nested structure in SymptomCheckerService for better
 * modularity and reusability across the Care journey.
 * 
 * @example
 * {
 *   name: 'Common Cold',
 *   confidence: 0.7,
 *   description: 'A viral infection of the upper respiratory tract.'
 * }
 */
export interface IPossibleCondition {
  /**
   * The name or title of the medical condition
   */
  name: string;

  /**
   * Confidence level that this condition matches the reported symptoms
   * Represented as a number between 0 and 1, where 1 is highest confidence
   */
  confidence: number;

  /**
   * A brief description of the condition, its symptoms, and general information
   */
  description: string;

  /**
   * Optional reference ID to a standardized medical condition from the health journey
   * Allows for cross-journey data consistency when the condition exists in the medical database
   */
  medicalConditionId?: string;

  /**
   * Optional severity level of the condition
   * Typically 'low', 'medium', or 'high'
   */
  severity?: string;

  /**
   * Optional recommended actions for this condition
   */
  recommendations?: string[];
}