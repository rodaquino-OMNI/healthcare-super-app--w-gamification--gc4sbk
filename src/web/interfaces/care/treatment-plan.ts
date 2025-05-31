/**
 * @file treatment-plan.ts
 * @description Defines the TreatmentPlan interface for the AUSTA SuperApp Care journey.
 * This interface represents structured healthcare treatment plans prescribed to users.
 */

import { BaseEntity, StatusEntity, UserOwnedEntity } from '../common/model';
import { ProgressStatus, ProgressStatusType } from '../common/status';

/**
 * Represents a treatment step within a treatment plan.
 * Each step is a specific action or milestone in the treatment process.
 */
export interface TreatmentStep {
  /**
   * Unique identifier for the treatment step
   */
  id: string;

  /**
   * Title or name of the treatment step
   */
  title: string;

  /**
   * Detailed description of what this step involves
   */
  description: string;

  /**
   * Order/sequence number of this step within the treatment plan
   */
  order: number;

  /**
   * Current status of this treatment step
   */
  status: ProgressStatus;

  /**
   * Estimated duration of this step in days
   */
  estimatedDurationDays?: number;

  /**
   * Scheduled date for this step (if applicable)
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  scheduledDate?: string;

  /**
   * Date when this step was completed (if applicable)
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  completedDate?: string;

  /**
   * Additional notes or instructions for this step
   */
  notes?: string;

  /**
   * IDs of related appointments associated with this step
   */
  relatedAppointmentIds?: string[];
}

/**
 * Represents a medication prescribed as part of a treatment plan.
 * References the full Medication record while including treatment-specific details.
 */
export interface TreatmentMedication {
  /**
   * ID of the referenced medication
   */
  medicationId: string;

  /**
   * Name of the medication
   */
  medicationName: string;

  /**
   * Dosage instructions specific to this treatment
   */
  dosage: string;

  /**
   * Frequency of administration
   * (e.g., "once daily", "twice daily", "every 8 hours")
   */
  frequency: string;

  /**
   * Duration for which this medication should be taken
   * (e.g., "7 days", "2 weeks", "until finished")
   */
  duration: string;

  /**
   * Special instructions for taking this medication
   */
  instructions?: string;

  /**
   * Start date for this medication
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  startDate: string;

  /**
   * End date for this medication (if applicable)
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  endDate?: string;
}

/**
 * Represents a comprehensive healthcare treatment plan prescribed to a user.
 * Treatment plans include structured steps, medications, timeline, and progress tracking.
 */
export interface TreatmentPlan extends BaseEntity, UserOwnedEntity, StatusEntity<ProgressStatusType> {
  /**
   * Title or name of the treatment plan
   * @example "Post-Surgery Recovery Plan", "Diabetes Management Plan"
   */
  title: string;

  /**
   * Detailed description of the treatment plan
   */
  description: string;

  /**
   * Medical condition being treated
   * @example "Type 2 Diabetes", "Hypertension", "Post-operative care"
   */
  condition: string;

  /**
   * ID of the healthcare provider who created this plan
   */
  providerId: string;

  /**
   * Name of the healthcare provider who created this plan
   */
  providerName: string;

  /**
   * Specialty of the healthcare provider
   * @example "Cardiology", "Orthopedics", "Endocrinology"
   */
  providerSpecialty?: string;

  /**
   * Start date of the treatment plan
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  startDate: string;

  /**
   * Expected end date of the treatment plan (if applicable)
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  endDate?: string;

  /**
   * Total duration of the treatment plan in days
   */
  durationDays: number;

  /**
   * Overall progress percentage of the treatment plan (0-100)
   */
  progressPercentage: number;

  /**
   * Ordered list of treatment steps
   */
  steps: TreatmentStep[];

  /**
   * List of medications prescribed as part of this treatment plan
   */
  medications: TreatmentMedication[];

  /**
   * IDs of appointments associated with this treatment plan
   */
  appointmentIds: string[];

  /**
   * Date of the next scheduled appointment (if any)
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  nextAppointmentDate?: string;

  /**
   * General instructions for the patient
   */
  patientInstructions?: string;

  /**
   * Date when this plan was last reviewed by a healthcare provider
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  lastReviewedDate?: string;

  /**
   * Whether this treatment plan is currently active
   */
  isActive: boolean;

  /**
   * Additional notes or comments about this treatment plan
   */
  notes?: string;

  /**
   * Tags or categories for this treatment plan
   * @example ["chronic", "preventive", "post-surgical"]
   */
  tags?: string[];
}