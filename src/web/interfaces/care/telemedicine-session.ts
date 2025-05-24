/**
 * TelemedicineSession interface for the AUSTA SuperApp Care journey
 * 
 * Represents virtual healthcare consultations, including properties for session
 * identification, connection details, participants, timing, and status tracking.
 */

import { AppointmentType } from './types';
import { Provider } from './provider';

/**
 * Represents the current connection status of a telemedicine session
 */
export enum TelemedicineConnectionStatus {
  /** Session has not been connected yet */
  NOT_CONNECTED = 'NOT_CONNECTED',
  /** Session is currently connecting */
  CONNECTING = 'CONNECTING',
  /** Session is fully connected with audio and video */
  CONNECTED = 'CONNECTED',
  /** Session has connection issues (poor quality, intermittent) */
  UNSTABLE = 'UNSTABLE',
  /** Session has been disconnected */
  DISCONNECTED = 'DISCONNECTED',
  /** Session failed to connect */
  FAILED = 'FAILED'
}

/**
 * Represents the current stage of a telemedicine session
 */
export enum TelemedicineSessionStage {
  /** Session is scheduled but not started */
  SCHEDULED = 'SCHEDULED',
  /** Waiting room before the session starts */
  WAITING_ROOM = 'WAITING_ROOM',
  /** Session is in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Session has been completed */
  COMPLETED = 'COMPLETED',
  /** Session was cancelled */
  CANCELLED = 'CANCELLED',
  /** Session was missed/no-show */
  MISSED = 'MISSED'
}

/**
 * Represents a telemedicine session in the Care journey
 */
export interface TelemedicineSession {
  /** Unique identifier for the telemedicine session */
  id: string;
  
  /** Reference to the appointment ID this session is associated with */
  appointmentId: string;
  
  /** Type of appointment (should be VIRTUAL for telemedicine) */
  appointmentType: AppointmentType;
  
  /** Healthcare provider participating in the session */
  provider: Provider;
  
  /** Patient user ID participating in the session */
  patientId: string;
  
  /** Current connection status of the session */
  connectionStatus: TelemedicineConnectionStatus;
  
  /** Current stage of the telemedicine session */
  sessionStage: TelemedicineSessionStage;
  
  /** Scheduled start time of the session */
  scheduledStartTime: Date;
  
  /** Actual start time when the session began */
  actualStartTime?: Date;
  
  /** End time when the session was completed */
  endTime?: Date;
  
  /** Duration of the session in minutes */
  durationMinutes?: number;
  
  /** WebRTC session ID for the connection */
  webRtcSessionId?: string;
  
  /** ICE servers configuration for WebRTC */
  iceServers?: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  
  /** Whether the patient's camera is enabled */
  patientCameraEnabled: boolean;
  
  /** Whether the patient's microphone is enabled */
  patientMicrophoneEnabled: boolean;
  
  /** Whether the provider's camera is enabled */
  providerCameraEnabled: boolean;
  
  /** Whether the provider's microphone is enabled */
  providerMicrophoneEnabled: boolean;
  
  /** Whether screen sharing is currently active */
  screenSharingActive: boolean;
  
  /** ID of the user who is sharing their screen (if active) */
  screenSharingUserId?: string;
  
  /** Whether the session has chat enabled */
  chatEnabled: boolean;
  
  /** Whether the session supports file sharing */
  fileSharingEnabled: boolean;
  
  /** Notes taken during the session */
  sessionNotes?: string;
  
  /** Technical issues encountered during the session */
  technicalIssues?: string[];
  
  /** Quality rating of the session (1-5) */
  qualityRating?: number;
  
  /** Timestamp when the session was created */
  createdAt: Date;
  
  /** Timestamp when the session was last updated */
  updatedAt: Date;
}