/**
 * Interface representing recommended care actions based on symptom analysis.
 * This interface is used to provide structured guidance for users in the Care Now journey.
 * It specifies flags for different types of care recommendations that can be made
 * based on the severity and nature of reported symptoms.
 */
import { ICareRecommendation } from '@austa/interfaces/care';

/**
 * Defines the structure for care options recommended after symptom analysis.
 * Used to guide users toward appropriate healthcare resources based on their symptoms.
 */
export interface ICareOptions extends ICareRecommendation {
  /**
   * Indicates if emergency medical services are recommended based on symptom severity.
   * When true, the user should be directed to seek immediate medical attention.
   */
  emergency: boolean;

  /**
   * Indicates if scheduling an in-person appointment with a healthcare provider is recommended.
   * When true, the user should be prompted to book an appointment through the Care journey.
   */
  appointmentRecommended: boolean;

  /**
   * Indicates if a telemedicine consultation is recommended based on symptom analysis.
   * When true, the user should be prompted to schedule a virtual consultation.
   */
  telemedicineRecommended: boolean;
}