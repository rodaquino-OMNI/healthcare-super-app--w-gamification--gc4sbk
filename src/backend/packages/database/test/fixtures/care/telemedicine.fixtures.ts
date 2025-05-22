/**
 * @file Telemedicine Session Test Fixtures
 * @description Provides test fixtures for telemedicine sessions with different durations, connection states, and provider types.
 */

import { ITelemedicineSession } from '@austa/interfaces/journey/care';
import { User } from '@austa/interfaces/auth/user.interface';
import { IAppointment, AppointmentType } from '@austa/interfaces/journey/care';

/**
 * Enum representing possible telemedicine session statuses.
 */
export enum TelemedicineSessionStatus {
  SCHEDULED = 'scheduled',
  WAITING_ROOM = 'waiting_room',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  RECORDING = 'recording'
}

/**
 * Interface for connection details in telemedicine sessions.
 */
export interface TelemedicineConnectionDetails {
  /**
   * Room identifier for the video session.
   */
  roomId: string;
  
  /**
   * WebRTC connection token.
   */
  token: string;
  
  /**
   * Connection quality metrics (0-100).
   */
  connectionQuality?: number;
  
  /**
   * Whether video is enabled.
   */
  videoEnabled?: boolean;
  
  /**
   * Whether audio is enabled.
   */
  audioEnabled?: boolean;
  
  /**
   * Whether screen sharing is enabled.
   */
  screenShareEnabled?: boolean;
  
  /**
   * Whether recording is enabled.
   */
  recordingEnabled?: boolean;
  
  /**
   * URL to access the recording after the session.
   */
  recordingUrl?: string;
  
  /**
   * Error information if connection failed.
   */
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
}

/**
 * Interface for telemedicine session test fixtures.
 * Extends the base ITelemedicineSession interface with test-specific properties.
 */
export interface TelemedicineSessionFixture extends Omit<ITelemedicineSession, 'appointment' | 'patient' | 'provider'> {
  /**
   * The appointment associated with the telemedicine session.
   */
  appointment?: Partial<IAppointment>;
  
  /**
   * The patient participating in the telemedicine session.
   */
  patient?: Partial<User>;
  
  /**
   * The healthcare provider conducting the telemedicine session.
   */
  provider?: Partial<User>;
  
  /**
   * Connection details for the telemedicine session.
   */
  connectionDetails?: TelemedicineConnectionDetails;
}

/**
 * Options for creating a telemedicine session fixture.
 */
export interface CreateTelemedicineSessionOptions {
  /**
   * ID for the telemedicine session.
   */
  id?: string;
  
  /**
   * ID of the appointment associated with the session.
   */
  appointmentId?: string;
  
  /**
   * ID of the patient participating in the session.
   */
  patientId?: string;
  
  /**
   * ID of the provider conducting the session.
   */
  providerId?: string;
  
  /**
   * Start time of the session.
   */
  startTime?: Date;
  
  /**
   * End time of the session.
   */
  endTime?: Date | null;
  
  /**
   * Status of the session.
   */
  status?: TelemedicineSessionStatus;
  
  /**
   * Connection details for the session.
   */
  connectionDetails?: Partial<TelemedicineConnectionDetails>;
  
  /**
   * The appointment associated with the session.
   */
  appointment?: Partial<IAppointment>;
  
  /**
   * The patient participating in the session.
   */
  patient?: Partial<User>;
  
  /**
   * The provider conducting the session.
   */
  provider?: Partial<User>;
}

/**
 * Creates a telemedicine session fixture with the specified options.
 * 
 * @param options - Options for creating the telemedicine session fixture
 * @returns A telemedicine session fixture
 */
export function createTelemedicineSessionFixture(options: CreateTelemedicineSessionOptions = {}): TelemedicineSessionFixture {
  const now = new Date();
  const startTime = options.startTime || new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago by default
  const endTime = options.endTime === undefined ? 
    (options.status === TelemedicineSessionStatus.COMPLETED ? new Date() : null) : 
    options.endTime;
  
  // Default connection details based on status
  const defaultConnectionDetails: TelemedicineConnectionDetails = {
    roomId: `room-${options.id || '12345'}`,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tSWQiOiJyb29tLTEyMzQ1Iiwic3ViIjoiMTIzNDU2Nzg5MCJ9.jV8KkJKZ3HK4Qm4jUwQp3Hq1y9QwJFUU3JfBD4wYsxM',
    connectionQuality: 95,
    videoEnabled: true,
    audioEnabled: true,
    screenShareEnabled: false,
    recordingEnabled: options.status === TelemedicineSessionStatus.RECORDING,
    recordingUrl: options.status === TelemedicineSessionStatus.COMPLETED ? 'https://storage.austa.com.br/recordings/session-12345.mp4' : undefined
  };
  
  // Add error information for failed sessions
  if (options.status === TelemedicineSessionStatus.FAILED) {
    defaultConnectionDetails.error = {
      code: 'ICE_CONNECTION_FAILED',
      message: 'Failed to establish peer connection',
      timestamp: new Date().toISOString()
    };
  }
  
  // Merge default connection details with provided options
  const connectionDetails = options.connectionDetails ? 
    { ...defaultConnectionDetails, ...options.connectionDetails } : 
    defaultConnectionDetails;
  
  return {
    id: options.id || '12345678-1234-1234-1234-123456789012',
    appointmentId: options.appointmentId || 'appointment-12345',
    patientId: options.patientId || 'patient-12345',
    providerId: options.providerId || 'provider-12345',
    startTime,
    endTime: endTime as Date | undefined,
    status: options.status || TelemedicineSessionStatus.CONNECTED,
    connectionDetails,
    createdAt: new Date(startTime.getTime() - 5 * 60 * 1000), // 5 minutes before start time
    updatedAt: new Date(),
    appointment: options.appointment,
    patient: options.patient,
    provider: options.provider
  };
}

/**
 * Creates a collection of telemedicine session fixtures with different statuses.
 * 
 * @param baseOptions - Base options to apply to all fixtures
 * @returns An object containing telemedicine session fixtures with different statuses
 */
export function createTelemedicineSessionFixtures(baseOptions: Partial<CreateTelemedicineSessionOptions> = {}): Record<string, TelemedicineSessionFixture> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    // A scheduled session that hasn't started yet
    scheduled: createTelemedicineSessionFixture({
      id: 'telemedicine-scheduled',
      appointmentId: 'appointment-scheduled',
      startTime: tomorrow,
      endTime: null,
      status: TelemedicineSessionStatus.SCHEDULED,
      connectionDetails: {
        videoEnabled: false,
        audioEnabled: false
      },
      ...baseOptions
    }),
    
    // A session where the patient is in the waiting room
    waitingRoom: createTelemedicineSessionFixture({
      id: 'telemedicine-waiting',
      appointmentId: 'appointment-waiting',
      startTime: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      endTime: null,
      status: TelemedicineSessionStatus.WAITING_ROOM,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: false,
        connectionQuality: 100
      },
      ...baseOptions
    }),
    
    // An active session with both participants connected
    connected: createTelemedicineSessionFixture({
      id: 'telemedicine-connected',
      appointmentId: 'appointment-connected',
      startTime: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
      endTime: null,
      status: TelemedicineSessionStatus.CONNECTED,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: true,
        connectionQuality: 85
      },
      ...baseOptions
    }),
    
    // A session that was temporarily disconnected
    disconnected: createTelemedicineSessionFixture({
      id: 'telemedicine-disconnected',
      appointmentId: 'appointment-disconnected',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      endTime: null,
      status: TelemedicineSessionStatus.DISCONNECTED,
      connectionDetails: {
        videoEnabled: false,
        audioEnabled: false,
        connectionQuality: 0,
        error: {
          code: 'NETWORK_DISCONNECTED',
          message: 'Network connection lost',
          timestamp: new Date().toISOString()
        }
      },
      ...baseOptions
    }),
    
    // A completed session with recording
    completedWithRecording: createTelemedicineSessionFixture({
      id: 'telemedicine-completed-recording',
      appointmentId: 'appointment-completed-recording',
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 45 * 60 * 1000), // 45 minutes after start
      status: TelemedicineSessionStatus.COMPLETED,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: true,
        recordingEnabled: true,
        recordingUrl: 'https://storage.austa.com.br/recordings/session-completed-recording.mp4'
      },
      ...baseOptions
    }),
    
    // A session that's currently being recorded
    recording: createTelemedicineSessionFixture({
      id: 'telemedicine-recording',
      appointmentId: 'appointment-recording',
      startTime: new Date(now.getTime() - 20 * 60 * 1000), // 20 minutes ago
      endTime: null,
      status: TelemedicineSessionStatus.RECORDING,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: true,
        recordingEnabled: true,
        connectionQuality: 90
      },
      ...baseOptions
    }),
    
    // A session that failed to connect
    failed: createTelemedicineSessionFixture({
      id: 'telemedicine-failed',
      appointmentId: 'appointment-failed',
      startTime: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
      endTime: new Date(now.getTime() - 8 * 60 * 1000), // 8 minutes ago (2 minutes of trying)
      status: TelemedicineSessionStatus.FAILED,
      connectionDetails: {
        videoEnabled: false,
        audioEnabled: false,
        connectionQuality: 0,
        error: {
          code: 'ICE_CONNECTION_FAILED',
          message: 'Failed to establish peer connection',
          timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString()
        }
      },
      ...baseOptions
    }),
    
    // A cancelled session
    cancelled: createTelemedicineSessionFixture({
      id: 'telemedicine-cancelled',
      appointmentId: 'appointment-cancelled',
      startTime: tomorrow,
      endTime: null,
      status: TelemedicineSessionStatus.CANCELLED,
      connectionDetails: {
        videoEnabled: false,
        audioEnabled: false
      },
      ...baseOptions
    }),
    
    // A session with screen sharing enabled
    screenSharing: createTelemedicineSessionFixture({
      id: 'telemedicine-screen-sharing',
      appointmentId: 'appointment-screen-sharing',
      startTime: new Date(now.getTime() - 25 * 60 * 1000), // 25 minutes ago
      endTime: null,
      status: TelemedicineSessionStatus.CONNECTED,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: true,
        screenShareEnabled: true,
        connectionQuality: 75 // Lower quality due to screen sharing
      },
      ...baseOptions
    }),
    
    // A session with poor connection quality
    poorConnection: createTelemedicineSessionFixture({
      id: 'telemedicine-poor-connection',
      appointmentId: 'appointment-poor-connection',
      startTime: new Date(now.getTime() - 18 * 60 * 1000), // 18 minutes ago
      endTime: null,
      status: TelemedicineSessionStatus.CONNECTED,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: true,
        connectionQuality: 30 // Poor connection quality
      },
      ...baseOptions
    }),
    
    // A long session (over 1 hour)
    longSession: createTelemedicineSessionFixture({
      id: 'telemedicine-long-session',
      appointmentId: 'appointment-long-session',
      startTime: new Date(now.getTime() - 90 * 60 * 1000), // 90 minutes ago
      endTime: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago (80 minute session)
      status: TelemedicineSessionStatus.COMPLETED,
      connectionDetails: {
        videoEnabled: true,
        audioEnabled: true,
        recordingEnabled: true,
        recordingUrl: 'https://storage.austa.com.br/recordings/session-long-session.mp4'
      },
      ...baseOptions
    })
  };
}

/**
 * Default telemedicine session fixtures for testing.
 */
export const telemedicineSessionFixtures = createTelemedicineSessionFixtures();

/**
 * Creates a fixture for a telemedicine session with a specific provider specialty.
 * 
 * @param specialty - The specialty of the provider
 * @param options - Additional options for the telemedicine session
 * @returns A telemedicine session fixture with a provider of the specified specialty
 */
export function createSpecialtyTelemedicineSessionFixture(
  specialty: string,
  options: Partial<CreateTelemedicineSessionOptions> = {}
): TelemedicineSessionFixture {
  return createTelemedicineSessionFixture({
    provider: {
      id: options.providerId || `provider-${specialty.toLowerCase()}`,
      name: `Dr. ${specialty.charAt(0).toUpperCase() + specialty.slice(1)}`,
      specialty
    },
    ...options
  });
}

/**
 * Creates fixtures for telemedicine sessions with different provider specialties.
 * 
 * @returns An object containing telemedicine session fixtures with different provider specialties
 */
export function createSpecialtyTelemedicineSessionFixtures(): Record<string, TelemedicineSessionFixture> {
  return {
    cardiology: createSpecialtyTelemedicineSessionFixture('Cardiologia', {
      id: 'telemedicine-cardiology',
      appointmentId: 'appointment-cardiology'
    }),
    dermatology: createSpecialtyTelemedicineSessionFixture('Dermatologia', {
      id: 'telemedicine-dermatology',
      appointmentId: 'appointment-dermatology'
    }),
    orthopedics: createSpecialtyTelemedicineSessionFixture('Ortopedia', {
      id: 'telemedicine-orthopedics',
      appointmentId: 'appointment-orthopedics'
    }),
    pediatrics: createSpecialtyTelemedicineSessionFixture('Pediatria', {
      id: 'telemedicine-pediatrics',
      appointmentId: 'appointment-pediatrics'
    }),
    psychiatry: createSpecialtyTelemedicineSessionFixture('Psiquiatria', {
      id: 'telemedicine-psychiatry',
      appointmentId: 'appointment-psychiatry'
    })
  };
}

/**
 * Default specialty telemedicine session fixtures for testing.
 */
export const specialtyTelemedicineSessionFixtures = createSpecialtyTelemedicineSessionFixtures();

/**
 * Creates a fixture for a telemedicine session with appointment integration.
 * 
 * @param options - Options for the telemedicine session and appointment
 * @returns A telemedicine session fixture with appointment details
 */
export function createAppointmentTelemedicineSessionFixture(
  options: Partial<CreateTelemedicineSessionOptions & {
    appointmentType: AppointmentType;
    appointmentNotes: string;
    appointmentLocation: string;
  }> = {}
): TelemedicineSessionFixture {
  const appointmentId = options.appointmentId || 'appointment-telemedicine';
  
  return createTelemedicineSessionFixture({
    appointmentId,
    appointment: {
      id: appointmentId,
      type: options.appointmentType || AppointmentType.VIRTUAL,
      notes: options.appointmentNotes || 'Follow-up telemedicine consultation',
      location: options.appointmentLocation || 'Virtual',
      patientId: options.patientId || 'patient-12345',
      providerId: options.providerId || 'provider-12345'
    },
    ...options
  });
}

/**
 * All telemedicine session fixtures combined for easy access.
 * 
 * @returns An object containing all telemedicine session fixtures
 */
export function getAllTelemedicineSessionFixtures(): Record<string, TelemedicineSessionFixture> {
  return {
    ...telemedicineSessionFixtures,
    ...specialtyTelemedicineSessionFixtures,
    withAppointment: createAppointmentTelemedicineSessionFixture()
  };
}

/**
 * Default export of all telemedicine session fixtures.
 */
export default getAllTelemedicineSessionFixtures();