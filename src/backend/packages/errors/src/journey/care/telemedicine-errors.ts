import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Error codes for the Telemedicine domain in the Care journey.
 * All codes are prefixed with 'TELE_' for easy identification.
 */
export enum TelemedicineErrorCode {
  SESSION_NOT_FOUND = 'TELE_001',
  CONNECTION_FAILED = 'TELE_002',
  DEVICE_UNSUPPORTED = 'TELE_003',
  PROVIDER_OFFLINE = 'TELE_004',
  RECORDING_FAILED = 'TELE_005',
  SERVICE_ERROR = 'TELE_006',
  SESSION_IN_PROGRESS = 'TELE_007',
  SESSION_EXPIRED = 'TELE_008',
  SIGNALING_ERROR = 'TELE_009',
  MEDIA_ACCESS_DENIED = 'TELE_010',
}

/**
 * Error thrown when a telemedicine session cannot be found.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class TelemedicineSessionNotFoundError extends AppException {
  constructor(sessionId: string, details?: any) {
    super(
      `Telemedicine session with ID ${sessionId} was not found. Please verify the session ID or schedule a new appointment.`,
      ErrorType.BUSINESS,
      TelemedicineErrorCode.SESSION_NOT_FOUND,
      details
    );
  }
}

/**
 * Error thrown when a WebRTC connection fails during a telemedicine session.
 * This is a technical error (500 Internal Server Error).
 */
export class TelemedicineConnectionError extends AppException {
  constructor(message: string, details?: any) {
    super(
      `Connection error during telemedicine session: ${message}. Please check your internet connection and try again. If the problem persists, try using a different browser or device.`,
      ErrorType.TECHNICAL,
      TelemedicineErrorCode.CONNECTION_FAILED,
      details
    );
  }
}

/**
 * Error thrown when a device is not compatible with telemedicine requirements.
 * This is a validation error (400 Bad Request).
 */
export class TelemedicineDeviceError extends AppException {
  constructor(deviceIssue: string, details?: any) {
    super(
      `Device compatibility issue: ${deviceIssue}. Please ensure your device meets the minimum requirements for video consultations and that camera and microphone permissions are granted.`,
      ErrorType.VALIDATION,
      TelemedicineErrorCode.DEVICE_UNSUPPORTED,
      details
    );
  }
}

/**
 * Error thrown when media access (camera/microphone) is denied.
 * This is a validation error (400 Bad Request).
 */
export class TelemedicineMediaAccessError extends AppException {
  constructor(mediaType: 'camera' | 'microphone' | 'both', details?: any) {
    let message: string;
    
    switch (mediaType) {
      case 'camera':
        message = 'Camera access was denied. Please grant camera permissions in your browser or device settings to join the telemedicine session.';
        break;
      case 'microphone':
        message = 'Microphone access was denied. Please grant microphone permissions in your browser or device settings to join the telemedicine session.';
        break;
      case 'both':
      default:
        message = 'Camera and microphone access were denied. Please grant both permissions in your browser or device settings to join the telemedicine session.';
        break;
    }
    
    super(
      message,
      ErrorType.VALIDATION,
      TelemedicineErrorCode.MEDIA_ACCESS_DENIED,
      details
    );
  }
}

/**
 * Error thrown when a healthcare provider is offline or unavailable.
 * This is an external system error (502 Bad Gateway).
 */
export class TelemedicineProviderOfflineError extends AppException {
  constructor(providerId: string, details?: any) {
    super(
      `Healthcare provider (ID: ${providerId}) is currently offline or unavailable. Please try again later or contact support to reschedule your appointment.`,
      ErrorType.EXTERNAL,
      TelemedicineErrorCode.PROVIDER_OFFLINE,
      details
    );
  }
}

/**
 * Error thrown when session recording fails.
 * This is a technical error (500 Internal Server Error).
 */
export class TelemedicineRecordingError extends AppException {
  constructor(sessionId: string, reason: string, details?: any) {
    super(
      `Failed to record telemedicine session (ID: ${sessionId}): ${reason}. The consultation will continue, but it may not be recorded for quality and training purposes.`,
      ErrorType.TECHNICAL,
      TelemedicineErrorCode.RECORDING_FAILED,
      details
    );
  }
}

/**
 * Error thrown when there's an issue with the external telemedicine service provider.
 * This is an external system error (502 Bad Gateway).
 */
export class TelemedicineServiceError extends AppException {
  constructor(providerName: string, errorDetails: string, details?: any) {
    super(
      `Error with telemedicine service provider ${providerName}: ${errorDetails}. Our team has been notified. Please try again later or contact support for assistance.`,
      ErrorType.EXTERNAL,
      TelemedicineErrorCode.SERVICE_ERROR,
      details
    );
  }
}

/**
 * Error thrown when attempting to start a session that is already in progress.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class TelemedicineSessionInProgressError extends AppException {
  constructor(sessionId: string, details?: any) {
    super(
      `Telemedicine session (ID: ${sessionId}) is already in progress. Please close any other browser tabs or devices where you might be connected to this session.`,
      ErrorType.BUSINESS,
      TelemedicineErrorCode.SESSION_IN_PROGRESS,
      details
    );
  }
}

/**
 * Error thrown when a session has expired or exceeded its scheduled time window.
 * This is a business logic error (422 Unprocessable Entity).
 */
export class TelemedicineSessionExpiredError extends AppException {
  constructor(sessionId: string, scheduledTime: string, details?: any) {
    super(
      `Telemedicine session (ID: ${sessionId}) has expired. The session was scheduled for ${scheduledTime} and is no longer available. Please contact support to reschedule if needed.`,
      ErrorType.BUSINESS,
      TelemedicineErrorCode.SESSION_EXPIRED,
      details
    );
  }
}

/**
 * Error thrown when there's an issue with the WebRTC signaling server.
 * This is a technical error (500 Internal Server Error).
 */
export class TelemedicineSignalingError extends AppException {
  constructor(message: string, details?: any) {
    super(
      `WebRTC signaling error: ${message}. This is a temporary technical issue. Please refresh the page and try again. If the problem persists, please try again in a few minutes.`,
      ErrorType.TECHNICAL,
      TelemedicineErrorCode.SIGNALING_ERROR,
      details
    );
  }
}