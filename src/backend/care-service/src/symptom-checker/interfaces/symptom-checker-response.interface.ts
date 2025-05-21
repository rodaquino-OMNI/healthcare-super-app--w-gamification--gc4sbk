/**
 * @file symptom-checker-response.interface.ts
 * @description Interface definition for symptom checker service responses
 */

import { AppointmentType } from '@austa/interfaces/journey/care/appointment.interface';

/**
 * Enum representing the severity levels of symptom analysis
 */
export enum SymptomSeverity {
  /**
   * Low severity - minimal or no medical attention needed
   */
  LOW = 'low',
  
  /**
   * Medium severity - medical attention recommended but not urgent
   */
  MEDIUM = 'medium',
  
  /**
   * High severity - urgent medical attention needed
   */
  HIGH = 'high'
}

/**
 * Represents a possible medical condition identified by the symptom checker
 */
export interface IPossibleCondition {
  /**
   * Name of the potential medical condition
   */
  name: string;

  /**
   * Confidence level (0.0 to 1.0) that the condition matches the symptoms
   */
  confidence: number;

  /**
   * Brief description of the condition
   */
  description: string;
}

/**
 * Represents care options recommended based on symptom analysis
 */
export interface ICareOptions {
  /**
   * Indicates if emergency care is recommended
   */
  emergency: boolean;

  /**
   * Indicates if an in-person appointment is recommended
   */
  appointmentRecommended: boolean;

  /**
   * Indicates if a telemedicine consultation is recommended
   */
  telemedicineRecommended: boolean;

  /**
   * Recommended appointment type if an appointment is suggested
   */
  recommendedAppointmentType?: AppointmentType;
}

/**
 * Interface representing journey context for the care journey
 */
export interface ICareJourneyContext {
  /**
   * The journey identifier
   */
  journeyId: string;
  
  /**
   * The journey type (always 'care' for symptom checker)
   */
  journeyType: 'care';
  
  /**
   * Additional journey-specific metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Interface representing the structured response from the symptom-checker service
 * This interface is used for communication between the backend service and frontend components
 */
export interface ISymptomCheckerResponse {
  /**
   * Unique identifier for the symptom checker response
   */
  id?: string;
  
  /**
   * User ID associated with this symptom check
   */
  userId: string;
  
  /**
   * Timestamp when the symptom check was performed
   */
  timestamp: Date;
  
  /**
   * Journey context information
   */
  journeyContext: ICareJourneyContext;
  
  /**
   * Severity assessment of the symptoms
   */
  severity: SymptomSeverity;

  /**
   * Guidance text providing recommendations based on symptom analysis
   */
  guidance: string;

  /**
   * Care options recommended based on symptom analysis
   */
  careOptions: ICareOptions;

  /**
   * List of possible medical conditions that match the symptoms
   * Optional as some basic checks may not provide condition analysis
   */
  possibleConditions?: IPossibleCondition[];

  /**
   * Emergency contact number for the user's region
   * Only provided when emergency care is recommended
   */
  emergencyNumber?: string;

  /**
   * Name of external provider if an external symptom checking service was used
   */
  externalProviderName?: string;
  
  /**
   * Original symptoms reported by the user
   */
  reportedSymptoms: string[];
  
  /**
   * Error information if symptom checking failed
   */
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}