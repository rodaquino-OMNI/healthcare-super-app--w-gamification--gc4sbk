/**
 * Telemedicine Error Classes
 * 
 * This module defines specialized error classes for the Telemedicine domain in the Care journey.
 * These errors ensure consistent error handling for telemedicine operations with proper
 * HTTP status codes and structured error responses.
 */

import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Error code prefix for all telemedicine-related errors
 */
const ERROR_PREFIX = 'CARE_TELEMEDICINE';

/**
 * Error thrown when a requested telemedicine session cannot be found
 */
export class TelemedicineSessionNotFoundError extends AppException {
  constructor(sessionId: string, additionalDetails?: Record<string, any>) {
    super(
      `Telemedicine session with ID ${sessionId} was not found. Please verify the session ID and try again.`,
      ErrorType.BUSINESS,
      `${ERROR_PREFIX}_SESSION_NOT_FOUND`,
      {
        sessionId,
        troubleshooting: 'Check if the session ID is correct or if the session has expired.',
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when there are issues with WebRTC connection during a telemedicine session
 */
export class TelemedicineConnectionError extends AppException {
  constructor(sessionId: string, connectionIssue: string, additionalDetails?: Record<string, any>) {
    super(
      `Connection error during telemedicine session ${sessionId}: ${connectionIssue}`,
      ErrorType.TECHNICAL,
      `${ERROR_PREFIX}_CONNECTION_FAILURE`,
      {
        sessionId,
        connectionIssue,
        troubleshooting: [
          'Check your internet connection and try again.',
          'Ensure your firewall is not blocking WebRTC connections.',
          'Try using a different browser or device if the issue persists.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when a user's device does not meet the requirements for telemedicine
 */
export class TelemedicineDeviceError extends AppException {
  constructor(deviceIssue: string, additionalDetails?: Record<string, any>) {
    super(
      `Device compatibility issue: ${deviceIssue}`,
      ErrorType.VALIDATION,
      `${ERROR_PREFIX}_DEVICE_INCOMPATIBLE`,
      {
        deviceIssue,
        troubleshooting: [
          'Ensure camera and microphone permissions are granted to the application.',
          'Check if your device meets the minimum requirements for video calls.',
          'Try using a different device if available.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when a healthcare provider is offline or unavailable for a telemedicine session
 */
export class TelemedicineProviderOfflineError extends AppException {
  constructor(providerId: string, additionalDetails?: Record<string, any>) {
    super(
      `Healthcare provider (ID: ${providerId}) is currently offline or unavailable.`,
      ErrorType.BUSINESS,
      `${ERROR_PREFIX}_PROVIDER_OFFLINE`,
      {
        providerId,
        troubleshooting: [
          'The provider may be temporarily unavailable. Try again in a few minutes.',
          'Check if your appointment time is correct.',
          'Contact support if the issue persists during your scheduled appointment time.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when there are issues with recording a telemedicine session
 */
export class TelemedicineRecordingError extends AppException {
  constructor(sessionId: string, recordingIssue: string, additionalDetails?: Record<string, any>) {
    super(
      `Failed to record telemedicine session ${sessionId}: ${recordingIssue}`,
      ErrorType.TECHNICAL,
      `${ERROR_PREFIX}_RECORDING_FAILURE`,
      {
        sessionId,
        recordingIssue,
        troubleshooting: [
          'The system will automatically retry recording. No action is required.',
          'If recording is essential, please contact technical support.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when there are issues with the external telemedicine service provider
 */
export class TelemedicineServiceError extends AppException {
  constructor(providerName: string, serviceIssue: string, additionalDetails?: Record<string, any>) {
    super(
      `External telemedicine service error with provider ${providerName}: ${serviceIssue}`,
      ErrorType.EXTERNAL,
      `${ERROR_PREFIX}_SERVICE_FAILURE`,
      {
        providerName,
        serviceIssue,
        troubleshooting: [
          'The system will automatically retry connecting to the service.',
          'This may be a temporary issue with the external provider.',
          'If the problem persists, please try again later or contact support.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when a user attempts to join a telemedicine session that is already in progress
 */
export class TelemedicineSessionInProgressError extends AppException {
  constructor(sessionId: string, additionalDetails?: Record<string, any>) {
    super(
      `Telemedicine session ${sessionId} is already in progress.`,
      ErrorType.BUSINESS,
      `${ERROR_PREFIX}_SESSION_IN_PROGRESS`,
      {
        sessionId,
        troubleshooting: [
          'You may have accidentally opened the session in multiple tabs or devices.',
          'If you were disconnected, wait a moment for the previous connection to time out.',
          'Contact support if you cannot access your scheduled session.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when there are bandwidth or network quality issues during a telemedicine session
 */
export class TelemedicineBandwidthError extends AppException {
  constructor(sessionId: string, bandwidthIssue: string, additionalDetails?: Record<string, any>) {
    super(
      `Network quality issues in telemedicine session ${sessionId}: ${bandwidthIssue}`,
      ErrorType.TECHNICAL,
      `${ERROR_PREFIX}_BANDWIDTH_ISSUE`,
      {
        sessionId,
        bandwidthIssue,
        troubleshooting: [
          'Try moving closer to your WiFi router or use a wired connection if possible.',
          'Close other applications that may be using your internet connection.',
          'Reducing video quality in the settings may help with limited bandwidth.',
          'If on mobile, try switching to a WiFi connection instead of cellular data.'
        ],
        ...additionalDetails
      }
    );
  }
}

/**
 * Error thrown when a telemedicine session exceeds its scheduled duration
 */
export class TelemedicineSessionTimeoutError extends AppException {
  constructor(sessionId: string, scheduledDuration: number, additionalDetails?: Record<string, any>) {
    super(
      `Telemedicine session ${sessionId} has exceeded its scheduled duration of ${scheduledDuration} minutes.`,
      ErrorType.BUSINESS,
      `${ERROR_PREFIX}_SESSION_TIMEOUT`,
      {
        sessionId,
        scheduledDuration,
        troubleshooting: [
          'The session has reached its scheduled end time.',
          'If you need more time, please schedule a follow-up appointment.',
          'Your provider may extend the session if their schedule permits.'
        ],
        ...additionalDetails
      }
    );
  }
}