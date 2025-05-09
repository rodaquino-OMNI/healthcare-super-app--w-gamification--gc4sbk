/**
 * @file Telemedicine Session Test Fixtures
 * 
 * This file provides test fixtures for telemedicine sessions with different durations,
 * connection states, and provider types. These fixtures are essential for testing
 * telemedicine session creation, connection management, recording functionality,
 * and integration with appointments in the Care journey.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Enum defining the possible statuses of telemedicine sessions.
 */
export enum TelemedicineSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

/**
 * Enum defining the possible connection states of telemedicine sessions.
 */
export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  UNSTABLE = 'UNSTABLE',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING'
}

/**
 * Enum defining the possible recording states of telemedicine sessions.
 */
export enum RecordingState {
  NOT_RECORDING = 'NOT_RECORDING',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Interface for telemedicine session test fixtures.
 */
export interface TelemedicineSessionFixture {
  /** Unique identifier for the telemedicine session */
  id: string;
  /** ID of the appointment associated with the telemedicine session */
  appointmentId: string;
  /** ID of the patient participating in the telemedicine session */
  userId: string;
  /** ID of the healthcare provider conducting the telemedicine session */
  providerId: string;
  /** Start time of the telemedicine session */
  startTime: Date;
  /** End time of the telemedicine session (optional if the session is ongoing) */
  endTime?: Date;
  /** Status of the telemedicine session */
  status: TelemedicineSessionStatus;
  /** Connection state of the telemedicine session */
  connectionState?: ConnectionState;
  /** Recording state of the telemedicine session */
  recordingState?: RecordingState;
  /** URL of the recorded session (if available) */
  recordingUrl?: string;
  /** Technical details about the connection */
  connectionDetails?: {
    /** WebRTC connection quality (0-100) */
    quality?: number;
    /** Connection latency in milliseconds */
    latency?: number;
    /** Whether video is enabled */
    videoEnabled?: boolean;
    /** Whether audio is enabled */
    audioEnabled?: boolean;
    /** Whether screen sharing is enabled */
    screenShareEnabled?: boolean;
  };
  /** Timestamp of when the telemedicine session was created */
  createdAt: Date;
  /** Timestamp of when the telemedicine session was last updated */
  updatedAt: Date;
}

// Base date for consistent relative timing in fixtures
const BASE_DATE = new Date('2023-06-15T10:00:00Z');

// Sample user IDs
const USER_IDS = {
  patient1: 'user-123456',
  patient2: 'user-234567',
  patient3: 'user-345678'
};

// Sample provider IDs
const PROVIDER_IDS = {
  cardiologist: 'provider-123456',
  dermatologist: 'provider-234567',
  psychiatrist: 'provider-345678'
};

// Sample appointment IDs
const APPOINTMENT_IDS = {
  cardiology: 'appointment-123456',
  dermatology: 'appointment-234567',
  psychiatry: 'appointment-345678',
  followUp: 'appointment-456789',
  emergency: 'appointment-567890'
};

/**
 * Creates a base telemedicine session fixture with default values.
 * 
 * @returns A base telemedicine session fixture
 */
export function createBaseSessionFixture(): TelemedicineSessionFixture {
  return {
    id: uuidv4(),
    appointmentId: APPOINTMENT_IDS.cardiology,
    userId: USER_IDS.patient1,
    providerId: PROVIDER_IDS.cardiologist,
    startTime: new Date(BASE_DATE),
    status: TelemedicineSessionStatus.SCHEDULED,
    connectionState: ConnectionState.CONNECTING,
    recordingState: RecordingState.NOT_RECORDING,
    connectionDetails: {
      quality: 100,
      latency: 50,
      videoEnabled: true,
      audioEnabled: true,
      screenShareEnabled: false
    },
    createdAt: new Date(BASE_DATE.getTime() - 86400000), // 1 day before
    updatedAt: new Date(BASE_DATE.getTime() - 86400000)
  };
}

/**
 * Creates a scheduled telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A scheduled telemedicine session fixture
 */
export function createScheduledSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createBaseSessionFixture();
  base.status = TelemedicineSessionStatus.SCHEDULED;
  base.connectionState = undefined;
  base.recordingState = undefined;
  base.startTime = new Date(BASE_DATE.getTime() + 3600000); // 1 hour in the future
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates an in-progress telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns An in-progress telemedicine session fixture
 */
export function createInProgressSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createBaseSessionFixture();
  base.status = TelemedicineSessionStatus.IN_PROGRESS;
  base.connectionState = ConnectionState.CONNECTED;
  base.recordingState = RecordingState.RECORDING;
  base.startTime = new Date(BASE_DATE.getTime() - 600000); // 10 minutes ago
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a completed telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A completed telemedicine session fixture
 */
export function createCompletedSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createBaseSessionFixture();
  base.status = TelemedicineSessionStatus.COMPLETED;
  base.connectionState = ConnectionState.DISCONNECTED;
  base.recordingState = RecordingState.COMPLETED;
  base.startTime = new Date(BASE_DATE.getTime() - 3600000); // 1 hour ago
  base.endTime = new Date(BASE_DATE.getTime() - 1800000); // 30 minutes ago
  base.recordingUrl = 'https://storage.austa.com.br/telemedicine-recordings/session-123456.mp4';
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a cancelled telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A cancelled telemedicine session fixture
 */
export function createCancelledSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createBaseSessionFixture();
  base.status = TelemedicineSessionStatus.CANCELLED;
  base.connectionState = undefined;
  base.recordingState = undefined;
  base.startTime = new Date(BASE_DATE.getTime() + 7200000); // 2 hours in the future
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a failed telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A failed telemedicine session fixture
 */
export function createFailedSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createBaseSessionFixture();
  base.status = TelemedicineSessionStatus.FAILED;
  base.connectionState = ConnectionState.DISCONNECTED;
  base.recordingState = RecordingState.FAILED;
  base.startTime = new Date(BASE_DATE.getTime() - 1800000); // 30 minutes ago
  base.endTime = new Date(BASE_DATE.getTime() - 1790000); // 29:50 minutes ago (10 seconds duration)
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a telemedicine session fixture with unstable connection.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A telemedicine session fixture with unstable connection
 */
export function createUnstableConnectionSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createInProgressSessionFixture();
  base.connectionState = ConnectionState.UNSTABLE;
  base.connectionDetails = {
    quality: 35,
    latency: 250,
    videoEnabled: true,
    audioEnabled: true,
    screenShareEnabled: false
  };
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a telemedicine session fixture with reconnecting state.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A telemedicine session fixture with reconnecting state
 */
export function createReconnectingSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createInProgressSessionFixture();
  base.connectionState = ConnectionState.RECONNECTING;
  base.connectionDetails = {
    quality: 0,
    latency: 500,
    videoEnabled: false,
    audioEnabled: false,
    screenShareEnabled: false
  };
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a telemedicine session fixture with screen sharing enabled.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A telemedicine session fixture with screen sharing enabled
 */
export function createScreenSharingSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createInProgressSessionFixture();
  base.connectionDetails = {
    ...base.connectionDetails,
    screenShareEnabled: true
  };
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a telemedicine session fixture with recording paused.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A telemedicine session fixture with recording paused
 */
export function createPausedRecordingSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createInProgressSessionFixture();
  base.recordingState = RecordingState.PAUSED;
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a long duration telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A long duration telemedicine session fixture
 */
export function createLongSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createCompletedSessionFixture();
  base.startTime = new Date(BASE_DATE.getTime() - 7200000); // 2 hours ago
  base.endTime = new Date(BASE_DATE.getTime() - 1800000); // 30 minutes ago (90 minute duration)
  
  return {
    ...base,
    ...overrides
  };
}

/**
 * Creates a short duration telemedicine session fixture.
 * 
 * @param overrides Optional properties to override in the fixture
 * @returns A short duration telemedicine session fixture
 */
export function createShortSessionFixture(overrides?: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createCompletedSessionFixture();
  base.startTime = new Date(BASE_DATE.getTime() - 1830000); // 30:30 minutes ago
  base.endTime = new Date(BASE_DATE.getTime() - 1800000); // 30 minutes ago (30 second duration)
  
  return {
    ...base,
    ...overrides
  };
}

// Predefined telemedicine session fixtures
const TELEMEDICINE_SESSIONS: TelemedicineSessionFixture[] = [
  // Scheduled sessions
  createScheduledSessionFixture({
    id: 'session-scheduled-1',
    appointmentId: APPOINTMENT_IDS.cardiology,
    userId: USER_IDS.patient1,
    providerId: PROVIDER_IDS.cardiologist
  }),
  createScheduledSessionFixture({
    id: 'session-scheduled-2',
    appointmentId: APPOINTMENT_IDS.dermatology,
    userId: USER_IDS.patient2,
    providerId: PROVIDER_IDS.dermatologist,
    startTime: new Date(BASE_DATE.getTime() + 7200000) // 2 hours in the future
  }),
  
  // In-progress sessions
  createInProgressSessionFixture({
    id: 'session-in-progress-1',
    appointmentId: APPOINTMENT_IDS.psychiatry,
    userId: USER_IDS.patient3,
    providerId: PROVIDER_IDS.psychiatrist
  }),
  createUnstableConnectionSessionFixture({
    id: 'session-in-progress-unstable',
    appointmentId: APPOINTMENT_IDS.followUp,
    userId: USER_IDS.patient1,
    providerId: PROVIDER_IDS.cardiologist
  }),
  createScreenSharingSessionFixture({
    id: 'session-in-progress-screen-sharing',
    appointmentId: APPOINTMENT_IDS.emergency,
    userId: USER_IDS.patient2,
    providerId: PROVIDER_IDS.dermatologist
  }),
  
  // Completed sessions
  createCompletedSessionFixture({
    id: 'session-completed-1',
    appointmentId: 'appointment-completed-1',
    userId: USER_IDS.patient1,
    providerId: PROVIDER_IDS.cardiologist,
    recordingUrl: 'https://storage.austa.com.br/telemedicine-recordings/session-completed-1.mp4'
  }),
  createLongSessionFixture({
    id: 'session-completed-long',
    appointmentId: 'appointment-completed-2',
    userId: USER_IDS.patient2,
    providerId: PROVIDER_IDS.dermatologist,
    recordingUrl: 'https://storage.austa.com.br/telemedicine-recordings/session-completed-long.mp4'
  }),
  createShortSessionFixture({
    id: 'session-completed-short',
    appointmentId: 'appointment-completed-3',
    userId: USER_IDS.patient3,
    providerId: PROVIDER_IDS.psychiatrist,
    recordingUrl: 'https://storage.austa.com.br/telemedicine-recordings/session-completed-short.mp4'
  }),
  
  // Cancelled sessions
  createCancelledSessionFixture({
    id: 'session-cancelled-1',
    appointmentId: 'appointment-cancelled-1',
    userId: USER_IDS.patient1,
    providerId: PROVIDER_IDS.cardiologist
  }),
  createCancelledSessionFixture({
    id: 'session-cancelled-2',
    appointmentId: 'appointment-cancelled-2',
    userId: USER_IDS.patient2,
    providerId: PROVIDER_IDS.dermatologist
  }),
  
  // Failed sessions
  createFailedSessionFixture({
    id: 'session-failed-1',
    appointmentId: 'appointment-failed-1',
    userId: USER_IDS.patient3,
    providerId: PROVIDER_IDS.psychiatrist
  }),
  createFailedSessionFixture({
    id: 'session-failed-2',
    appointmentId: 'appointment-failed-2',
    userId: USER_IDS.patient1,
    providerId: PROVIDER_IDS.cardiologist
  })
];

/**
 * Gets all telemedicine session fixtures.
 * 
 * @returns All telemedicine session fixtures
 */
export function getAllSessions(): TelemedicineSessionFixture[] {
  return [...TELEMEDICINE_SESSIONS];
}

/**
 * Gets telemedicine session fixtures by status.
 * 
 * @param status The status to filter by
 * @returns Telemedicine session fixtures with the specified status
 */
export function getSessionsByStatus(status: TelemedicineSessionStatus): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => session.status === status);
}

/**
 * Gets a telemedicine session fixture by ID.
 * 
 * @param id The ID of the session to retrieve
 * @returns The telemedicine session fixture with the specified ID, or undefined if not found
 */
export function getSessionById(id: string): TelemedicineSessionFixture | undefined {
  return TELEMEDICINE_SESSIONS.find(session => session.id === id);
}

/**
 * Gets telemedicine session fixtures by appointment ID.
 * 
 * @param appointmentId The appointment ID to filter by
 * @returns Telemedicine session fixtures with the specified appointment ID
 */
export function getSessionByAppointmentId(appointmentId: string): TelemedicineSessionFixture | undefined {
  return TELEMEDICINE_SESSIONS.find(session => session.appointmentId === appointmentId);
}

/**
 * Gets telemedicine session fixtures by provider ID.
 * 
 * @param providerId The provider ID to filter by
 * @returns Telemedicine session fixtures with the specified provider ID
 */
export function getSessionsByProviderId(providerId: string): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => session.providerId === providerId);
}

/**
 * Gets telemedicine session fixtures by user ID.
 * 
 * @param userId The user ID to filter by
 * @returns Telemedicine session fixtures with the specified user ID
 */
export function getSessionsByUserId(userId: string): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => session.userId === userId);
}

/**
 * Gets telemedicine session fixtures by connection state.
 * 
 * @param connectionState The connection state to filter by
 * @returns Telemedicine session fixtures with the specified connection state
 */
export function getSessionsByConnectionState(connectionState: ConnectionState): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => session.connectionState === connectionState);
}

/**
 * Gets telemedicine session fixtures by recording state.
 * 
 * @param recordingState The recording state to filter by
 * @returns Telemedicine session fixtures with the specified recording state
 */
export function getSessionsByRecordingState(recordingState: RecordingState): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => session.recordingState === recordingState);
}

/**
 * Gets telemedicine session fixtures with recording URL.
 * 
 * @returns Telemedicine session fixtures with a recording URL
 */
export function getSessionsWithRecording(): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => !!session.recordingUrl);
}

/**
 * Gets telemedicine session fixtures with screen sharing enabled.
 * 
 * @returns Telemedicine session fixtures with screen sharing enabled
 */
export function getSessionsWithScreenSharing(): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => session.connectionDetails?.screenShareEnabled === true);
}

/**
 * Gets telemedicine session fixtures by date range.
 * 
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns Telemedicine session fixtures within the specified date range
 */
export function getSessionsByDateRange(startDate: Date, endDate: Date): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => {
    return session.startTime >= startDate && session.startTime <= endDate;
  });
}

/**
 * Gets telemedicine session fixtures by duration range (in minutes).
 * Only includes completed sessions with an end time.
 * 
 * @param minDuration The minimum duration in minutes
 * @param maxDuration The maximum duration in minutes
 * @returns Telemedicine session fixtures within the specified duration range
 */
export function getSessionsByDurationRange(minDuration: number, maxDuration: number): TelemedicineSessionFixture[] {
  return TELEMEDICINE_SESSIONS.filter(session => {
    if (!session.endTime) return false;
    
    const durationMs = session.endTime.getTime() - session.startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    return durationMinutes >= minDuration && durationMinutes <= maxDuration;
  });
}

/**
 * Creates a custom telemedicine session fixture with the specified properties.
 * 
 * @param properties Properties for the custom telemedicine session fixture
 * @returns A custom telemedicine session fixture
 */
export function createCustomSessionFixture(properties: Partial<TelemedicineSessionFixture>): TelemedicineSessionFixture {
  const base = createBaseSessionFixture();
  
  return {
    ...base,
    ...properties,
    id: properties.id || uuidv4()
  };
}

/**
 * Creates a batch of telemedicine session fixtures with the specified properties.
 * 
 * @param count The number of fixtures to create
 * @param baseProperties Base properties for all fixtures in the batch
 * @param customizer Optional function to customize each fixture
 * @returns An array of telemedicine session fixtures
 */
export function createSessionFixtureBatch(
  count: number,
  baseProperties: Partial<TelemedicineSessionFixture>,
  customizer?: (index: number) => Partial<TelemedicineSessionFixture>
): TelemedicineSessionFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const custom = customizer ? customizer(index) : {};
    return createCustomSessionFixture({
      ...baseProperties,
      ...custom
    });
  });
}