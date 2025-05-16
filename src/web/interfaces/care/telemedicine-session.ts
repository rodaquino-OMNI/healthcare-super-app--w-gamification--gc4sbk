/**
 * TelemedicineSession Interface
 * 
 * Defines the structure for telemedicine sessions in the AUSTA SuperApp Care journey.
 * This interface represents virtual healthcare consultations, including properties
 * for session identification, connection details, participants, timing, and status tracking.
 */

import { AppointmentType } from './types';

/**
 * Connection status for telemedicine sessions
 */
export enum TelemedicineConnectionStatus {
  /** Session not yet started */
  NOT_CONNECTED = 'NOT_CONNECTED',
  /** Connection in progress */
  CONNECTING = 'CONNECTING',
  /** Successfully connected */
  CONNECTED = 'CONNECTED',
  /** Connection temporarily interrupted */
  RECONNECTING = 'RECONNECTING',
  /** Connection ended normally */
  DISCONNECTED = 'DISCONNECTED',
  /** Connection failed due to error */
  FAILED = 'FAILED'
}

/**
 * Stage of the telemedicine session
 */
export enum TelemedicineSessionStage {
  /** Waiting for participants to join */
  WAITING_ROOM = 'WAITING_ROOM',
  /** Session in progress */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Session completed normally */
  COMPLETED = 'COMPLETED',
  /** Session ended prematurely */
  ENDED_EARLY = 'ENDED_EARLY',
  /** Session cancelled before starting */
  CANCELLED = 'CANCELLED',
  /** Session rescheduled */
  RESCHEDULED = 'RESCHEDULED'
}

/**
 * Participant in a telemedicine session
 */
export interface TelemedicineParticipant {
  /** Unique identifier for the participant */
  id: string;
  /** Full name of the participant */
  name: string;
  /** Role of the participant (provider, patient, guest) */
  role: 'provider' | 'patient' | 'guest';
  /** Connection status of this participant */
  connectionStatus: TelemedicineConnectionStatus;
  /** Whether participant has camera enabled */
  videoEnabled: boolean;
  /** Whether participant has microphone enabled */
  audioEnabled: boolean;
  /** Whether participant is sharing their screen */
  screenSharing: boolean;
  /** Time when participant joined the session */
  joinedAt?: Date;
  /** Time when participant left the session */
  leftAt?: Date;
}

/**
 * TelemedicineSession interface representing a virtual healthcare consultation
 */
export interface TelemedicineSession {
  /** Unique identifier for the telemedicine session */
  id: string;
  
  /** Reference to the associated appointment ID */
  appointmentId: string;
  
  /** Type of appointment (should be VIRTUAL for telemedicine) */
  appointmentType: AppointmentType;
  
  /** Current stage of the telemedicine session */
  stage: TelemedicineSessionStage;
  
  /** Connection status of the overall session */
  connectionStatus: TelemedicineConnectionStatus;
  
  /** Secure URL for joining the telemedicine session */
  sessionUrl: string;
  
  /** Optional session access code for additional security */
  accessCode?: string;
  
  /** List of participants in the session */
  participants: TelemedicineParticipant[];
  
  /** Scheduled start time for the session */
  scheduledStartTime: Date;
  
  /** Actual time when the session started */
  actualStartTime?: Date;
  
  /** Time when the session ended */
  endTime?: Date;
  
  /** Duration of the session in minutes */
  durationMinutes?: number;
  
  /** Whether the session is being recorded */
  isRecorded: boolean;
  
  /** URL to access the recording after the session */
  recordingUrl?: string;
  
  /** Technical details about the connection */
  connectionDetails?: {
    /** Connection quality (excellent, good, fair, poor) */
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
    /** Bandwidth in Kbps */
    bandwidth?: number;
    /** Latency in milliseconds */
    latency?: number;
    /** Packet loss percentage */
    packetLoss?: number;
  };
  
  /** Notes taken during the session */
  sessionNotes?: string;
  
  /** Files shared during the session */
  sharedFiles?: Array<{
    /** File identifier */
    id: string;
    /** Name of the file */
    name: string;
    /** Type of file */
    type: string;
    /** URL to access the file */
    url: string;
    /** Time when the file was shared */
    sharedAt: Date;
    /** User who shared the file */
    sharedBy: string;
  }>;
  
  /** Time when the session was created */
  createdAt: Date;
  
  /** Time when the session was last updated */
  updatedAt: Date;
}