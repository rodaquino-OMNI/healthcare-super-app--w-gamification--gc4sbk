/**
 * @austa/interfaces/api/care.api
 * 
 * Defines Care journey API interfaces for the AUSTA SuperApp, covering appointments,
 * medications, telemedicine sessions, and treatment plans. Contains request/response
 * types for all Care journey endpoints with proper validation patterns.
 */

// Import types from care interfaces
import { Appointment, AppointmentType, AppointmentStatus } from '../care/appointment';
import { Medication } from '../care/medication';
import { TelemedicineSession } from '../care/telemedicine-session';
import { TreatmentPlan } from '../care/treatment-plan';
import { Provider } from '../care/provider';

// Import common API types
import { PaginationParams, FilterParams, SortParams } from './request.types';
import { PaginatedResponse, ApiResponse } from './response.types';

/**
 * Base Care Journey API Interfaces
 */

/**
 * Common parameters for Care journey API requests
 */
export interface CareApiParams {
  /**
   * User ID for the request
   */
  userId: string;

  /**
   * Journey context identifier
   */
  journeyContext?: string;
}

/**
 * Common fields for Care journey API responses
 */
export interface CareApiResponse<T> extends ApiResponse<T> {
  /**
   * Journey-specific metadata for the response
   */
  journeyMeta?: {
    /**
     * Care journey context identifier
     */
    contextId: string;
    
    /**
     * Related gamification events triggered by this operation
     */
    gamificationEvents?: string[];
  };
}

/**
 * Appointment API Interfaces
 */

/**
 * Request parameters for retrieving a single appointment
 */
export interface GetAppointmentParams extends CareApiParams {
  /**
   * Unique identifier for the appointment
   */
  appointmentId: string;
}

/**
 * Response for a single appointment request
 */
export interface GetAppointmentResponse extends CareApiResponse<Appointment> {}

/**
 * Parameters for retrieving a list of appointments
 */
export interface GetAppointmentsParams extends CareApiParams, PaginationParams {
  /**
   * Filter appointments by status
   */
  status?: AppointmentStatus;

  /**
   * Filter appointments by type
   */
  type?: AppointmentType;

  /**
   * Filter appointments by provider ID
   */
  providerId?: string;

  /**
   * Filter appointments by date range (start)
   */
  startDate?: string;

  /**
   * Filter appointments by date range (end)
   */
  endDate?: string;

  /**
   * Include cancelled appointments
   * @default false
   */
  includeCancelled?: boolean;
}

/**
 * Response for appointments list request
 */
export interface GetAppointmentsResponse extends CareApiResponse<PaginatedResponse<Appointment>> {}

/**
 * Request body for creating a new appointment
 */
export interface CreateAppointmentRequest extends CareApiParams {
  /**
   * Type of appointment (in-person or virtual)
   */
  type: AppointmentType;

  /**
   * Provider ID for the appointment
   */
  providerId: string;

  /**
   * Scheduled date and time (ISO format)
   */
  scheduledAt: string;

  /**
   * Expected duration in minutes
   */
  durationMinutes: number;

  /**
   * Reason for the appointment
   */
  reason: string;

  /**
   * Additional notes for the provider
   */
  notes?: string;

  /**
   * For virtual appointments, preferred platform
   */
  virtualPlatform?: string;

  /**
   * For in-person appointments, location ID
   */
  locationId?: string;
}

/**
 * Response for appointment creation
 */
export interface CreateAppointmentResponse extends CareApiResponse<Appointment> {}

/**
 * Request body for updating an existing appointment
 */
export interface UpdateAppointmentRequest extends CareApiParams {
  /**
   * Appointment ID to update
   */
  appointmentId: string;

  /**
   * Updated scheduled date and time (ISO format)
   */
  scheduledAt?: string;

  /**
   * Updated reason for the appointment
   */
  reason?: string;

  /**
   * Updated notes for the provider
   */
  notes?: string;
}

/**
 * Response for appointment update
 */
export interface UpdateAppointmentResponse extends CareApiResponse<Appointment> {}

/**
 * Request for cancelling an appointment
 */
export interface CancelAppointmentRequest extends CareApiParams {
  /**
   * Appointment ID to cancel
   */
  appointmentId: string;

  /**
   * Reason for cancellation
   */
  cancellationReason: string;
}

/**
 * Response for appointment cancellation
 */
export interface CancelAppointmentResponse extends CareApiResponse<{
  /**
   * Cancelled appointment ID
   */
  appointmentId: string;

  /**
   * Cancellation timestamp
   */
  cancelledAt: string;

  /**
   * Whether a cancellation fee applies
   */
  cancellationFeeApplied: boolean;
}> {}

/**
 * Medication API Interfaces
 */

/**
 * Request parameters for retrieving a single medication
 */
export interface GetMedicationParams extends CareApiParams {
  /**
   * Unique identifier for the medication
   */
  medicationId: string;
}

/**
 * Response for a single medication request
 */
export interface GetMedicationResponse extends CareApiResponse<Medication> {}

/**
 * Parameters for retrieving a list of medications
 */
export interface GetMedicationsParams extends CareApiParams, PaginationParams {
  /**
   * Filter by active medications only
   * @default true
   */
  activeOnly?: boolean;

  /**
   * Filter by medication name (partial match)
   */
  nameSearch?: string;

  /**
   * Filter by medication type
   */
  medicationType?: string;

  /**
   * Include medications that require refill
   */
  needsRefill?: boolean;
}

/**
 * Response for medications list request
 */
export interface GetMedicationsResponse extends CareApiResponse<PaginatedResponse<Medication>> {}

/**
 * Request body for adding a new medication
 */
export interface AddMedicationRequest extends CareApiParams {
  /**
   * Medication name
   */
  name: string;

  /**
   * Dosage information
   */
  dosage: string;

  /**
   * Frequency of intake
   */
  frequency: string;

  /**
   * Start date for medication (ISO format)
   */
  startDate: string;

  /**
   * End date for medication (ISO format), if applicable
   */
  endDate?: string;

  /**
   * Prescribing provider ID, if applicable
   */
  prescribedBy?: string;

  /**
   * Instructions for taking the medication
   */
  instructions?: string;

  /**
   * Whether to set up reminders
   * @default false
   */
  enableReminders?: boolean;

  /**
   * Reminder times (24-hour format, e.g., "08:00", "20:00")
   */
  reminderTimes?: string[];
}

/**
 * Response for medication addition
 */
export interface AddMedicationResponse extends CareApiResponse<Medication> {}

/**
 * Request body for updating an existing medication
 */
export interface UpdateMedicationRequest extends CareApiParams {
  /**
   * Medication ID to update
   */
  medicationId: string;

  /**
   * Updated dosage information
   */
  dosage?: string;

  /**
   * Updated frequency of intake
   */
  frequency?: string;

  /**
   * Updated end date (ISO format)
   */
  endDate?: string;

  /**
   * Updated instructions
   */
  instructions?: string;

  /**
   * Updated reminder settings
   */
  enableReminders?: boolean;

  /**
   * Updated reminder times
   */
  reminderTimes?: string[];
}

/**
 * Response for medication update
 */
export interface UpdateMedicationResponse extends CareApiResponse<Medication> {}

/**
 * Request for recording medication adherence
 */
export interface RecordMedicationAdherenceRequest extends CareApiParams {
  /**
   * Medication ID
   */
  medicationId: string;

  /**
   * Whether the medication was taken
   */
  taken: boolean;

  /**
   * Timestamp when medication was taken (ISO format)
   */
  timestamp: string;

  /**
   * Notes about adherence (e.g., side effects, reason for skipping)
   */
  notes?: string;
}

/**
 * Response for medication adherence recording
 */
export interface RecordMedicationAdherenceResponse extends CareApiResponse<{
  /**
   * Medication ID
   */
  medicationId: string;

  /**
   * Adherence record ID
   */
  adherenceId: string;

  /**
   * Whether the medication was taken
   */
  taken: boolean;

  /**
   * Timestamp when recorded
   */
  recordedAt: string;

  /**
   * Current adherence rate (percentage)
   */
  adherenceRate: number;
}> {}

/**
 * Telemedicine API Interfaces
 */

/**
 * Request parameters for retrieving a telemedicine session
 */
export interface GetTelemedicineSessionParams extends CareApiParams {
  /**
   * Unique identifier for the telemedicine session
   */
  sessionId: string;
}

/**
 * Response for a telemedicine session request
 */
export interface GetTelemedicineSessionResponse extends CareApiResponse<TelemedicineSession> {}

/**
 * Request for initiating a telemedicine session
 */
export interface InitiateTelemedicineSessionRequest extends CareApiParams {
  /**
   * Associated appointment ID
   */
  appointmentId: string;

  /**
   * Preferred platform for the session
   */
  platform: string;

  /**
   * Device information for the session
   */
  deviceInfo: {
    /**
     * Device type (mobile, tablet, desktop)
     */
    type: string;

    /**
     * Operating system
     */
    os: string;

    /**
     * Browser information
     */
    browser?: string;

    /**
     * Network connection type
     */
    connectionType?: string;
  };
}

/**
 * Response for telemedicine session initiation
 */
export interface InitiateTelemedicineSessionResponse extends CareApiResponse<{
  /**
   * Session ID
   */
  sessionId: string;

  /**
   * Connection details for the session
   */
  connectionDetails: {
    /**
     * URL for joining the session
     */
    joinUrl: string;

    /**
     * Authentication token for the session
     */
    token: string;

    /**
     * Session room ID
     */
    roomId: string;

    /**
     * Expiration time for the session token
     */
    expiresAt: string;
  };

  /**
   * Provider information
   */
  provider: {
    /**
     * Provider ID
     */
    id: string;

    /**
     * Provider name
     */
    name: string;

    /**
     * Provider status (online, offline, busy)
     */
    status: string;
  };
}> {}

/**
 * Request for ending a telemedicine session
 */
export interface EndTelemedicineSessionRequest extends CareApiParams {
  /**
   * Session ID to end
   */
  sessionId: string;

  /**
   * Reason for ending the session
   */
  reason?: string;

  /**
   * Session duration in seconds
   */
  durationSeconds: number;
}

/**
 * Response for ending a telemedicine session
 */
export interface EndTelemedicineSessionResponse extends CareApiResponse<{
  /**
   * Session ID
   */
  sessionId: string;

  /**
   * End timestamp
   */
  endedAt: string;

  /**
   * Session duration in seconds
   */
  durationSeconds: number;

  /**
   * Whether follow-up is recommended
   */
  followUpRecommended: boolean;
}> {}

/**
 * Treatment Plan API Interfaces
 */

/**
 * Request parameters for retrieving a treatment plan
 */
export interface GetTreatmentPlanParams extends CareApiParams {
  /**
   * Unique identifier for the treatment plan
   */
  planId: string;
}

/**
 * Response for a treatment plan request
 */
export interface GetTreatmentPlanResponse extends CareApiResponse<TreatmentPlan> {}

/**
 * Parameters for retrieving a list of treatment plans
 */
export interface GetTreatmentPlansParams extends CareApiParams, PaginationParams {
  /**
   * Filter by active plans only
   * @default true
   */
  activeOnly?: boolean;

  /**
   * Filter by provider ID
   */
  providerId?: string;

  /**
   * Filter by treatment type
   */
  treatmentType?: string;
}

/**
 * Response for treatment plans list request
 */
export interface GetTreatmentPlansResponse extends CareApiResponse<PaginatedResponse<TreatmentPlan>> {}

/**
 * Request for updating treatment plan progress
 */
export interface UpdateTreatmentProgressRequest extends CareApiParams {
  /**
   * Treatment plan ID
   */
  planId: string;

  /**
   * Treatment step ID
   */
  stepId: string;

  /**
   * Completion status (0-100)
   */
  completionPercentage: number;

  /**
   * Notes on progress
   */
  notes?: string;

  /**
   * Timestamp of the update (ISO format)
   */
  timestamp: string;
}

/**
 * Response for treatment progress update
 */
export interface UpdateTreatmentProgressResponse extends CareApiResponse<{
  /**
   * Treatment plan ID
   */
  planId: string;

  /**
   * Treatment step ID
   */
  stepId: string;

  /**
   * Updated completion percentage
   */
  completionPercentage: number;

  /**
   * Overall plan completion percentage
   */
  overallCompletion: number;

  /**
   * Update timestamp
   */
  updatedAt: string;
}> {}

/**
 * Provider API Interfaces
 */

/**
 * Request parameters for retrieving a provider
 */
export interface GetProviderParams extends CareApiParams {
  /**
   * Unique identifier for the provider
   */
  providerId: string;
}

/**
 * Response for a provider request
 */
export interface GetProviderResponse extends CareApiResponse<Provider> {}

/**
 * Parameters for searching providers
 */
export interface SearchProvidersParams extends CareApiParams, PaginationParams, SortParams, FilterParams {
  /**
   * Search query for provider name or specialty
   */
  query?: string;

  /**
   * Filter by specialty
   */
  specialty?: string[];

  /**
   * Filter by location (latitude,longitude)
   */
  location?: string;

  /**
   * Radius in kilometers from location
   */
  radius?: number;

  /**
   * Filter by available appointment slots
   */
  hasAvailability?: boolean;

  /**
   * Filter by telemedicine support
   */
  supportsTelemedicine?: boolean;

  /**
   * Filter by language
   */
  languages?: string[];

  /**
   * Filter by gender
   */
  gender?: string;

  /**
   * Filter by rating (minimum)
   */
  minRating?: number;
}

/**
 * Response for provider search
 */
export interface SearchProvidersResponse extends CareApiResponse<PaginatedResponse<Provider>> {}

/**
 * Request for checking provider availability
 */
export interface CheckProviderAvailabilityRequest extends CareApiParams {
  /**
   * Provider ID
   */
  providerId: string;

  /**
   * Start date for availability check (ISO format)
   */
  startDate: string;

  /**
   * End date for availability check (ISO format)
   */
  endDate: string;

  /**
   * Appointment type to check availability for
   */
  appointmentType: AppointmentType;
}

/**
 * Response for provider availability check
 */
export interface CheckProviderAvailabilityResponse extends CareApiResponse<{
  /**
   * Provider ID
   */
  providerId: string;

  /**
   * Available time slots
   */
  availableSlots: Array<{
    /**
     * Start time (ISO format)
     */
    startTime: string;

    /**
     * End time (ISO format)
     */
    endTime: string;

    /**
     * Duration in minutes
     */
    durationMinutes: number;

    /**
     * Location ID for in-person appointments
     */
    locationId?: string;
  }>;
}> {}