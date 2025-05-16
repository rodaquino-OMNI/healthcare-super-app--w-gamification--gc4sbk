/**
 * Care Journey API Interfaces
 * 
 * This file defines the API interfaces for the Care journey in the AUSTA SuperApp,
 * covering appointments, medications, telemedicine sessions, and treatment plans.
 * It provides type-safe request and response interfaces for all Care journey endpoints.
 */

import { z } from 'zod';

// Import base types from care interfaces
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  Medication,
  TelemedicineSession,
  TreatmentPlan,
  Provider
} from '../care';

// Import common request/response types
import {
  PaginationParams,
  FilterParams,
  SortParams
} from './request.types';

import {
  ApiResponse,
  PaginatedResponse
} from './response.types';

/**
 * ===========================
 * Appointment API Interfaces
 * ===========================
 */

/**
 * Appointment creation request payload
 */
export interface CreateAppointmentRequest {
  /** Type of appointment (in-person or virtual) */
  type: AppointmentType;
  /** Date and time of the appointment in ISO format */
  scheduledAt: string;
  /** Expected duration in minutes */
  durationMinutes: number;
  /** ID of the healthcare provider */
  providerId: string;
  /** Reason for the appointment */
  reason: string;
  /** Additional notes for the provider (optional) */
  notes?: string;
  /** Whether the patient has been to this provider before */
  isFirstVisit: boolean;
  /** Insurance information to be used for this appointment (optional) */
  insuranceInfo?: {
    planId: string;
    memberId: string;
    groupNumber?: string;
  };
}

/**
 * Appointment update request payload
 */
export interface UpdateAppointmentRequest {
  /** Appointment ID to update */
  id: string;
  /** Updated appointment status (optional) */
  status?: AppointmentStatus;
  /** Updated scheduled time in ISO format (optional) */
  scheduledAt?: string;
  /** Updated duration in minutes (optional) */
  durationMinutes?: number;
  /** Updated notes (optional) */
  notes?: string;
  /** Updated reason (optional) */
  reason?: string;
}

/**
 * Appointment cancellation request payload
 */
export interface CancelAppointmentRequest {
  /** Appointment ID to cancel */
  id: string;
  /** Reason for cancellation */
  cancellationReason: string;
  /** Whether to attempt rescheduling */
  requestReschedule?: boolean;
}

/**
 * Appointment search/filter parameters
 */
export interface AppointmentFilterParams extends FilterParams {
  /** Filter by appointment status */
  status?: AppointmentStatus | AppointmentStatus[];
  /** Filter by appointment type */
  type?: AppointmentType;
  /** Filter by provider ID */
  providerId?: string;
  /** Filter by date range start (ISO string) */
  startDate?: string;
  /** Filter by date range end (ISO string) */
  endDate?: string;
}

/**
 * Appointment list request parameters
 */
export interface ListAppointmentsRequest extends PaginationParams {
  /** Filtering parameters */
  filters?: AppointmentFilterParams;
  /** Sorting parameters */
  sort?: SortParams<Appointment>;
}

/**
 * Appointment response interfaces
 */
export type AppointmentResponse = ApiResponse<Appointment>;
export type AppointmentsListResponse = PaginatedResponse<Appointment>;

/**
 * Appointment validation schemas
 */
export const createAppointmentSchema = z.object({
  type: z.enum(['IN_PERSON', 'VIRTUAL']),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(240),
  providerId: z.string().uuid(),
  reason: z.string().min(5).max(500),
  notes: z.string().max(1000).optional(),
  isFirstVisit: z.boolean(),
  insuranceInfo: z.object({
    planId: z.string(),
    memberId: z.string(),
    groupNumber: z.string().optional()
  }).optional()
});

/**
 * ===========================
 * Medication API Interfaces
 * ===========================
 */

/**
 * Medication creation request payload
 */
export interface CreateMedicationRequest {
  /** Name of the medication */
  name: string;
  /** Dosage information (e.g., "10mg") */
  dosage: string;
  /** Frequency of intake (e.g., "twice daily") */
  frequency: string;
  /** Start date in ISO format */
  startDate: string;
  /** End date in ISO format (optional for ongoing medications) */
  endDate?: string;
  /** Instructions for taking the medication */
  instructions: string;
  /** Whether to set reminders for this medication */
  enableReminders: boolean;
  /** Reminder times in 24-hour format (HH:MM) */
  reminderTimes?: string[];
  /** ID of the prescribing provider (optional) */
  prescribedBy?: string;
  /** Prescription identifier (optional) */
  prescriptionId?: string;
  /** Whether this is a prescription or over-the-counter medication */
  isPrescription: boolean;
}

/**
 * Medication update request payload
 */
export interface UpdateMedicationRequest {
  /** Medication ID to update */
  id: string;
  /** Updated dosage information (optional) */
  dosage?: string;
  /** Updated frequency (optional) */
  frequency?: string;
  /** Updated end date (optional) */
  endDate?: string;
  /** Updated instructions (optional) */
  instructions?: string;
  /** Updated reminder settings (optional) */
  enableReminders?: boolean;
  /** Updated reminder times (optional) */
  reminderTimes?: string[];
  /** Whether the medication is active or discontinued */
  isActive?: boolean;
}

/**
 * Medication adherence tracking request
 */
export interface TrackMedicationAdherenceRequest {
  /** Medication ID */
  id: string;
  /** Whether the medication was taken */
  taken: boolean;
  /** Timestamp when the medication was taken (ISO string) */
  takenAt: string;
  /** Optional notes about adherence (e.g., side effects, reasons for skipping) */
  notes?: string;
}

/**
 * Medication filter parameters
 */
export interface MedicationFilterParams extends FilterParams {
  /** Filter by active/inactive status */
  isActive?: boolean;
  /** Filter by prescription status */
  isPrescription?: boolean;
  /** Filter by prescribing provider */
  prescribedBy?: string;
}

/**
 * Medication list request parameters
 */
export interface ListMedicationsRequest extends PaginationParams {
  /** Filtering parameters */
  filters?: MedicationFilterParams;
  /** Sorting parameters */
  sort?: SortParams<Medication>;
}

/**
 * Medication response interfaces
 */
export type MedicationResponse = ApiResponse<Medication>;
export type MedicationsListResponse = PaginatedResponse<Medication>;

/**
 * Medication validation schemas
 */
export const createMedicationSchema = z.object({
  name: z.string().min(2).max(100),
  dosage: z.string().min(1).max(50),
  frequency: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  instructions: z.string().min(5).max(500),
  enableReminders: z.boolean(),
  reminderTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)).optional(),
  prescribedBy: z.string().uuid().optional(),
  prescriptionId: z.string().optional(),
  isPrescription: z.boolean()
});

/**
 * ===================================
 * Telemedicine Session API Interfaces
 * ===================================
 */

/**
 * Telemedicine session creation request payload
 */
export interface CreateTelemedicineSessionRequest {
  /** Associated appointment ID */
  appointmentId: string;
  /** Session configuration options */
  config?: {
    /** Enable video */
    enableVideo: boolean;
    /** Enable audio */
    enableAudio: boolean;
    /** Enable screen sharing */
    enableScreenSharing: boolean;
    /** Enable chat */
    enableChat: boolean;
    /** Maximum session duration in minutes */
    maxDurationMinutes: number;
  };
  /** Additional participants (e.g., family members, specialists) */
  additionalParticipants?: {
    /** Participant email */
    email: string;
    /** Participant name */
    name: string;
    /** Participant role */
    role: 'FAMILY_MEMBER' | 'CAREGIVER' | 'SPECIALIST' | 'OTHER';
  }[];
}

/**
 * Telemedicine session join request
 */
export interface JoinTelemedicineSessionRequest {
  /** Session ID to join */
  sessionId: string;
  /** User's display name */
  displayName: string;
  /** Device capabilities */
  deviceCapabilities: {
    /** Has camera */
    hasCamera: boolean;
    /** Has microphone */
    hasMicrophone: boolean;
    /** Has speakers */
    hasSpeakers: boolean;
    /** Connection type (wifi, cellular, etc.) */
    connectionType: 'WIFI' | 'CELLULAR' | 'WIRED' | 'UNKNOWN';
  };
}

/**
 * Telemedicine session update request
 */
export interface UpdateTelemedicineSessionRequest {
  /** Session ID to update */
  sessionId: string;
  /** Updated session status */
  status?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  /** Updated configuration */
  config?: {
    enableVideo?: boolean;
    enableAudio?: boolean;
    enableScreenSharing?: boolean;
    enableChat?: boolean;
  };
}

/**
 * Telemedicine session end request
 */
export interface EndTelemedicineSessionRequest {
  /** Session ID to end */
  sessionId: string;
  /** Reason for ending the session */
  endReason: 'COMPLETED' | 'TECHNICAL_ISSUES' | 'PATIENT_LEFT' | 'PROVIDER_LEFT' | 'OTHER';
  /** Additional notes about the session */
  notes?: string;
  /** Session duration in seconds (calculated by client) */
  durationSeconds?: number;
}

/**
 * Telemedicine session response interfaces
 */
export type TelemedicineSessionResponse = ApiResponse<TelemedicineSession>;
export type TelemedicineSessionTokenResponse = ApiResponse<{
  /** Session ID */
  sessionId: string;
  /** Access token for the telemedicine platform */
  accessToken: string;
  /** Token expiration timestamp */
  expiresAt: string;
  /** Session configuration */
  config: Record<string, any>;
}>;

/**
 * Telemedicine validation schemas
 */
export const createTelemedicineSessionSchema = z.object({
  appointmentId: z.string().uuid(),
  config: z.object({
    enableVideo: z.boolean(),
    enableAudio: z.boolean(),
    enableScreenSharing: z.boolean(),
    enableChat: z.boolean(),
    maxDurationMinutes: z.number().int().min(5).max(120)
  }).optional(),
  additionalParticipants: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().min(2).max(100),
      role: z.enum(['FAMILY_MEMBER', 'CAREGIVER', 'SPECIALIST', 'OTHER'])
    })
  ).optional()
});

/**
 * ===========================
 * Treatment Plan API Interfaces
 * ===========================
 */

/**
 * Treatment plan creation request payload
 */
export interface CreateTreatmentPlanRequest {
  /** Title of the treatment plan */
  title: string;
  /** Detailed description of the treatment plan */
  description: string;
  /** Start date in ISO format */
  startDate: string;
  /** End date in ISO format (optional for ongoing plans) */
  endDate?: string;
  /** ID of the provider creating the plan */
  providerId: string;
  /** Primary condition being treated */
  condition: string;
  /** Treatment goals */
  goals: {
    /** Goal description */
    description: string;
    /** Target date for goal achievement */
    targetDate?: string;
    /** Metrics to track for this goal (optional) */
    metrics?: {
      /** Metric name */
      name: string;
      /** Initial value */
      initialValue: number;
      /** Target value */
      targetValue: number;
      /** Unit of measurement */
      unit: string;
    }[];
  }[];
  /** Treatment activities */
  activities: {
    /** Activity type */
    type: 'MEDICATION' | 'EXERCISE' | 'DIET' | 'THERAPY' | 'OTHER';
    /** Activity description */
    description: string;
    /** Frequency of the activity */
    frequency: string;
    /** Duration of each activity session (if applicable) */
    durationMinutes?: number;
    /** Additional instructions */
    instructions?: string;
  }[];
}

/**
 * Treatment plan update request payload
 */
export interface UpdateTreatmentPlanRequest {
  /** Treatment plan ID to update */
  id: string;
  /** Updated description (optional) */
  description?: string;
  /** Updated end date (optional) */
  endDate?: string;
  /** Updated goals (optional) */
  goals?: {
    /** Goal ID (if existing goal) */
    id?: string;
    /** Goal description */
    description: string;
    /** Target date */
    targetDate?: string;
    /** Whether this goal is completed */
    isCompleted?: boolean;
  }[];
  /** Updated activities (optional) */
  activities?: {
    /** Activity ID (if existing activity) */
    id?: string;
    /** Activity description */
    description: string;
    /** Frequency */
    frequency?: string;
    /** Instructions */
    instructions?: string;
  }[];
  /** Overall plan status */
  status?: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';
}

/**
 * Treatment plan progress update request
 */
export interface UpdateTreatmentPlanProgressRequest {
  /** Treatment plan ID */
  planId: string;
  /** Goal updates */
  goalUpdates?: {
    /** Goal ID */
    goalId: string;
    /** Whether the goal is completed */
    isCompleted?: boolean;
    /** Progress notes */
    notes?: string;
    /** Metric updates */
    metricUpdates?: {
      /** Metric ID */
      metricId: string;
      /** Current value */
      currentValue: number;
      /** Measurement date */
      measuredAt: string;
    }[];
  }[];
  /** Activity tracking */
  activityTracking?: {
    /** Activity ID */
    activityId: string;
    /** Whether the activity was completed */
    completed: boolean;
    /** When the activity was performed */
    performedAt: string;
    /** Duration in minutes (if applicable) */
    durationMinutes?: number;
    /** Notes about the activity */
    notes?: string;
  }[];
}

/**
 * Treatment plan filter parameters
 */
export interface TreatmentPlanFilterParams extends FilterParams {
  /** Filter by status */
  status?: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';
  /** Filter by provider */
  providerId?: string;
  /** Filter by condition */
  condition?: string;
}

/**
 * Treatment plan list request parameters
 */
export interface ListTreatmentPlansRequest extends PaginationParams {
  /** Filtering parameters */
  filters?: TreatmentPlanFilterParams;
  /** Sorting parameters */
  sort?: SortParams<TreatmentPlan>;
}

/**
 * Treatment plan response interfaces
 */
export type TreatmentPlanResponse = ApiResponse<TreatmentPlan>;
export type TreatmentPlansListResponse = PaginatedResponse<TreatmentPlan>;

/**
 * Treatment plan validation schemas
 */
export const createTreatmentPlanSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  providerId: z.string().uuid(),
  condition: z.string().min(2).max(100),
  goals: z.array(
    z.object({
      description: z.string().min(5).max(200),
      targetDate: z.string().datetime().optional(),
      metrics: z.array(
        z.object({
          name: z.string().min(2).max(50),
          initialValue: z.number(),
          targetValue: z.number(),
          unit: z.string().min(1).max(20)
        })
      ).optional()
    })
  ),
  activities: z.array(
    z.object({
      type: z.enum(['MEDICATION', 'EXERCISE', 'DIET', 'THERAPY', 'OTHER']),
      description: z.string().min(5).max(200),
      frequency: z.string().min(2).max(100),
      durationMinutes: z.number().int().min(1).optional(),
      instructions: z.string().max(500).optional()
    })
  )
});

/**
 * ===========================
 * Provider API Interfaces
 * ===========================
 */

/**
 * Provider search request parameters
 */
export interface SearchProvidersRequest extends PaginationParams {
  /** Search query (name, specialty, etc.) */
  query?: string;
  /** Filter by specialty */
  specialty?: string | string[];
  /** Filter by location */
  location?: {
    /** Latitude */
    latitude: number;
    /** Longitude */
    longitude: number;
    /** Radius in kilometers */
    radiusKm: number;
  };
  /** Filter by insurance acceptance */
  acceptsInsurance?: string | string[];
  /** Filter by availability for new patients */
  acceptingNewPatients?: boolean;
  /** Filter by telemedicine availability */
  offersTelemedicine?: boolean;
  /** Filter by languages spoken */
  languages?: string | string[];
  /** Filter by gender */
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  /** Filter by rating (minimum) */
  minRating?: number;
}

/**
 * Provider availability request
 */
export interface GetProviderAvailabilityRequest {
  /** Provider ID */
  providerId: string;
  /** Start date for availability window (ISO string) */
  startDate: string;
  /** End date for availability window (ISO string) */
  endDate: string;
  /** Appointment type filter */
  appointmentType?: AppointmentType;
  /** Appointment reason (may affect duration/availability) */
  reason?: string;
}

/**
 * Provider availability response
 */
export type ProviderAvailabilityResponse = ApiResponse<{
  /** Provider ID */
  providerId: string;
  /** Available time slots */
  availableSlots: {
    /** Start time (ISO string) */
    startTime: string;
    /** End time (ISO string) */
    endTime: string;
    /** Duration in minutes */
    durationMinutes: number;
    /** Appointment type available for this slot */
    appointmentType: AppointmentType;
  }[];
}>;

/**
 * Provider response interfaces
 */
export type ProviderResponse = ApiResponse<Provider>;
export type ProvidersListResponse = PaginatedResponse<Provider>;

/**
 * Provider validation schemas
 */
export const searchProvidersSchema = z.object({
  query: z.string().max(100).optional(),
  specialty: z.union([z.string(), z.array(z.string())]).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusKm: z.number().min(0.1).max(100)
  }).optional(),
  acceptsInsurance: z.union([z.string(), z.array(z.string())]).optional(),
  acceptingNewPatients: z.boolean().optional(),
  offersTelemedicine: z.boolean().optional(),
  languages: z.union([z.string(), z.array(z.string())]).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  minRating: z.number().min(0).max(5).optional()
});