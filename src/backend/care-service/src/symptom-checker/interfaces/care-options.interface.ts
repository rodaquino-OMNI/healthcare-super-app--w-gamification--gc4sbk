/**
 * @file Care Options Interface
 * 
 * This file defines the ICareOptions interface which represents recommended care actions
 * based on symptom analysis. It is used in the Care Now journey to provide structured
 * guidance to users after symptom assessment.
 */

// Import from shared interfaces package
import { CareOptions as ICareOptionsBase } from '@austa/interfaces/journey/care';

/**
 * Interface representing care options recommended based on symptom analysis.
 * This interface is used to provide structured guidance on what type of
 * medical attention is recommended based on the user's symptoms.
 *
 * @interface ICareOptions
 */
export interface ICareOptions extends ICareOptionsBase {
  /**
   * Indicates if emergency care is recommended.
   * When true, the user should seek immediate medical attention or call emergency services.
   */
  emergency: boolean;
  
  /**
   * Indicates if an in-person appointment is recommended.
   * When true, the user should schedule a regular appointment with a healthcare provider.
   */
  appointmentRecommended: boolean;
  
  /**
   * Indicates if a telemedicine consultation is recommended.
   * When true, the user should consider scheduling a virtual consultation.
   */
  telemedicineRecommended: boolean;
}