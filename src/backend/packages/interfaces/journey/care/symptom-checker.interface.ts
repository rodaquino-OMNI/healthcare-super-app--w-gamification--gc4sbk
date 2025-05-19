/**
 * Enum representing the severity levels of symptoms.
 */
export enum SymptomSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Interface representing care options recommended based on symptom analysis.
 */
export interface CareOptions {
  /**
   * Indicates if emergency care is recommended.
   */
  emergency: boolean;
  
  /**
   * Indicates if an in-person appointment is recommended.
   */
  appointmentRecommended: boolean;
  
  /**
   * Indicates if a telemedicine consultation is recommended.
   */
  telemedicineRecommended: boolean;
}

/**
 * Interface representing a possible medical condition based on symptom analysis.
 */
export interface PossibleCondition {
  /**
   * Name of the possible condition.
   */
  name: string;
  
  /**
   * Confidence level for this condition (0.0 to 1.0).
   */
  confidence: number;
  
  /**
   * Brief description of the condition.
   */
  description: string;
}

/**
 * Interface representing the response from the symptom checker service.
 * Part of the F-111 Symptom Checker feature for the Care Now journey.
 */
export interface SymptomCheckerResponse {
  /**
   * Assessed severity of the symptoms.
   */
  severity: SymptomSeverity;
  
  /**
   * Guidance text based on the symptom analysis.
   */
  guidance: string;
  
  /**
   * Recommended care options based on the symptom analysis.
   */
  careOptions: CareOptions;
  
  /**
   * List of possible conditions that match the symptoms.
   * Optional as not all analyses will provide possible conditions.
   */
  possibleConditions?: PossibleCondition[];
  
  /**
   * Emergency contact number to call if symptoms are severe.
   * Only provided for high severity cases.
   */
  emergencyNumber?: string;
  
  /**
   * Name of the external provider that performed the analysis.
   * Only provided when using an external symptom checking service.
   */
  externalProviderName?: string;
}