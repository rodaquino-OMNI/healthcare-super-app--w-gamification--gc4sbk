import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../src/base';
import {
  TelemedicineSessionNotFoundError,
  TelemedicineConnectionError,
  TelemedicineDeviceError,
  TelemedicineProviderOfflineError,
  TelemedicineRecordingError,
  TelemedicineServiceError,
  TelemedicineSessionInProgressError,
  TelemedicineBandwidthError,
  TelemedicineSessionTimeoutError
} from '../../../../src/journey/care/telemedicine-errors';

describe('Care Journey Telemedicine Errors', () => {
  const ERROR_PREFIX = 'CARE_TELEMEDICINE';

  describe('TelemedicineSessionNotFoundError', () => {
    it('should create error with correct properties', () => {
      const sessionId = 'session-123';
      const additionalDetails = { userId: 'user-456', providerId: 'provider-789' };
      
      const error = new TelemedicineSessionNotFoundError(sessionId, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Telemedicine session with ID ${sessionId} was not found. Please verify the session ID and try again.`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_PREFIX}_SESSION_NOT_FOUND`);
      expect(error.details).toEqual({
        sessionId,
        troubleshooting: 'Check if the session ID is correct or if the session has expired.',
        ...additionalDetails
      });
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineSessionNotFoundError('session-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should serialize to JSON with correct structure', () => {
      const sessionId = 'session-123';
      const error = new TelemedicineSessionNotFoundError(sessionId);
      
      const json = error.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(json.error).toHaveProperty('code', `${ERROR_PREFIX}_SESSION_NOT_FOUND`);
      expect(json.error).toHaveProperty('message', `Telemedicine session with ID ${sessionId} was not found. Please verify the session ID and try again.`);
      expect(json.error.details).toHaveProperty('sessionId', sessionId);
      expect(json.error.details).toHaveProperty('troubleshooting');
    });
  });

  describe('TelemedicineConnectionError', () => {
    it('should create error with correct properties', () => {
      const sessionId = 'session-123';
      const connectionIssue = 'WebRTC signaling failed';
      const additionalDetails = { iceServers: ['stun:stun.example.com'] };
      
      const error = new TelemedicineConnectionError(sessionId, connectionIssue, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Connection error during telemedicine session ${sessionId}: ${connectionIssue}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(`${ERROR_PREFIX}_CONNECTION_FAILURE`);
      expect(error.details).toEqual({
        sessionId,
        connectionIssue,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(3);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineConnectionError('session-123', 'Connection failed');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('TelemedicineDeviceError', () => {
    it('should create error with correct properties', () => {
      const deviceIssue = 'Camera not available';
      const additionalDetails = { deviceId: 'camera-123', permissions: false };
      
      const error = new TelemedicineDeviceError(deviceIssue, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Device compatibility issue: ${deviceIssue}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${ERROR_PREFIX}_DEVICE_INCOMPATIBLE`);
      expect(error.details).toEqual({
        deviceIssue,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(3);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineDeviceError('Microphone not available');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('TelemedicineProviderOfflineError', () => {
    it('should create error with correct properties', () => {
      const providerId = 'provider-123';
      const additionalDetails = { appointmentId: 'appointment-456', scheduledTime: new Date() };
      
      const error = new TelemedicineProviderOfflineError(providerId, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Healthcare provider (ID: ${providerId}) is currently offline or unavailable.`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_PREFIX}_PROVIDER_OFFLINE`);
      expect(error.details).toEqual({
        providerId,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(3);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineProviderOfflineError('provider-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TelemedicineRecordingError', () => {
    it('should create error with correct properties', () => {
      const sessionId = 'session-123';
      const recordingIssue = 'Storage quota exceeded';
      const additionalDetails = { recordingDuration: 1800, maxDuration: 3600 };
      
      const error = new TelemedicineRecordingError(sessionId, recordingIssue, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Failed to record telemedicine session ${sessionId}: ${recordingIssue}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(`${ERROR_PREFIX}_RECORDING_FAILURE`);
      expect(error.details).toEqual({
        sessionId,
        recordingIssue,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(2);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineRecordingError('session-123', 'Recording failed');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('TelemedicineServiceError', () => {
    it('should create error with correct properties', () => {
      const providerName = 'ExampleRTC';
      const serviceIssue = 'API rate limit exceeded';
      const additionalDetails = { retryAfter: 60, requestId: 'req-123' };
      
      const error = new TelemedicineServiceError(providerName, serviceIssue, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`External telemedicine service error with provider ${providerName}: ${serviceIssue}`);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(`${ERROR_PREFIX}_SERVICE_FAILURE`);
      expect(error.details).toEqual({
        providerName,
        serviceIssue,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(3);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineServiceError('ExampleRTC', 'Service unavailable');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('TelemedicineSessionInProgressError', () => {
    it('should create error with correct properties', () => {
      const sessionId = 'session-123';
      const additionalDetails = { activeDevices: 2, maxDevices: 1 };
      
      const error = new TelemedicineSessionInProgressError(sessionId, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Telemedicine session ${sessionId} is already in progress.`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_PREFIX}_SESSION_IN_PROGRESS`);
      expect(error.details).toEqual({
        sessionId,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(3);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineSessionInProgressError('session-123');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TelemedicineBandwidthError', () => {
    it('should create error with correct properties', () => {
      const sessionId = 'session-123';
      const bandwidthIssue = 'Insufficient upload bandwidth';
      const additionalDetails = { currentBandwidth: '0.5 Mbps', requiredBandwidth: '1.5 Mbps' };
      
      const error = new TelemedicineBandwidthError(sessionId, bandwidthIssue, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Network quality issues in telemedicine session ${sessionId}: ${bandwidthIssue}`);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(`${ERROR_PREFIX}_BANDWIDTH_ISSUE`);
      expect(error.details).toEqual({
        sessionId,
        bandwidthIssue,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(4);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineBandwidthError('session-123', 'Low bandwidth');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('TelemedicineSessionTimeoutError', () => {
    it('should create error with correct properties', () => {
      const sessionId = 'session-123';
      const scheduledDuration = 30;
      const additionalDetails = { startTime: new Date(Date.now() - 35 * 60 * 1000) };
      
      const error = new TelemedicineSessionTimeoutError(sessionId, scheduledDuration, additionalDetails);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(`Telemedicine session ${sessionId} has exceeded its scheduled duration of ${scheduledDuration} minutes.`);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(`${ERROR_PREFIX}_SESSION_TIMEOUT`);
      expect(error.details).toEqual({
        sessionId,
        scheduledDuration,
        troubleshooting: expect.any(Array),
        ...additionalDetails
      });
      expect(error.details.troubleshooting).toHaveLength(3);
    });

    it('should return correct HTTP status code', () => {
      const error = new TelemedicineSessionTimeoutError('session-123', 30);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Error code prefixing', () => {
    it('should use CARE_TELEMEDICINE prefix for all error codes', () => {
      const errors = [
        new TelemedicineSessionNotFoundError('session-123'),
        new TelemedicineConnectionError('session-123', 'Connection failed'),
        new TelemedicineDeviceError('Camera not available'),
        new TelemedicineProviderOfflineError('provider-123'),
        new TelemedicineRecordingError('session-123', 'Recording failed'),
        new TelemedicineServiceError('ExampleRTC', 'Service unavailable'),
        new TelemedicineSessionInProgressError('session-123'),
        new TelemedicineBandwidthError('session-123', 'Low bandwidth'),
        new TelemedicineSessionTimeoutError('session-123', 30)
      ];

      errors.forEach(error => {
        expect(error.code).toMatch(new RegExp(`^${ERROR_PREFIX}_`));
      });
    });
  });

  describe('Error classification', () => {
    it('should classify validation errors correctly', () => {
      const validationErrors = [
        new TelemedicineDeviceError('Camera not available')
      ];

      validationErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    it('should classify business errors correctly', () => {
      const businessErrors = [
        new TelemedicineSessionNotFoundError('session-123'),
        new TelemedicineProviderOfflineError('provider-123'),
        new TelemedicineSessionInProgressError('session-123'),
        new TelemedicineSessionTimeoutError('session-123', 30)
      ];

      businessErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });

    it('should classify technical errors correctly', () => {
      const technicalErrors = [
        new TelemedicineConnectionError('session-123', 'Connection failed'),
        new TelemedicineRecordingError('session-123', 'Recording failed'),
        new TelemedicineBandwidthError('session-123', 'Low bandwidth')
      ];

      technicalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });

    it('should classify external errors correctly', () => {
      const externalErrors = [
        new TelemedicineServiceError('ExampleRTC', 'Service unavailable')
      ];

      externalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });
  });

  describe('Session context data', () => {
    it('should include session ID in error details when applicable', () => {
      const sessionId = 'session-123';
      const sessionErrors = [
        new TelemedicineSessionNotFoundError(sessionId),
        new TelemedicineConnectionError(sessionId, 'Connection failed'),
        new TelemedicineRecordingError(sessionId, 'Recording failed'),
        new TelemedicineSessionInProgressError(sessionId),
        new TelemedicineBandwidthError(sessionId, 'Low bandwidth'),
        new TelemedicineSessionTimeoutError(sessionId, 30)
      ];

      sessionErrors.forEach(error => {
        expect(error.details).toHaveProperty('sessionId', sessionId);
      });
    });

    it('should include troubleshooting steps in all error details', () => {
      const errors = [
        new TelemedicineSessionNotFoundError('session-123'),
        new TelemedicineConnectionError('session-123', 'Connection failed'),
        new TelemedicineDeviceError('Camera not available'),
        new TelemedicineProviderOfflineError('provider-123'),
        new TelemedicineRecordingError('session-123', 'Recording failed'),
        new TelemedicineServiceError('ExampleRTC', 'Service unavailable'),
        new TelemedicineSessionInProgressError('session-123'),
        new TelemedicineBandwidthError('session-123', 'Low bandwidth'),
        new TelemedicineSessionTimeoutError('session-123', 30)
      ];

      errors.forEach(error => {
        expect(error.details).toHaveProperty('troubleshooting');
        expect(Array.isArray(error.details.troubleshooting) || typeof error.details.troubleshooting === 'string').toBeTruthy();
      });
    });

    it('should preserve additional details in error objects', () => {
      const additionalDetails = { testKey: 'testValue', metadata: { foo: 'bar' } };
      
      const errors = [
        new TelemedicineSessionNotFoundError('session-123', additionalDetails),
        new TelemedicineConnectionError('session-123', 'Connection failed', additionalDetails),
        new TelemedicineDeviceError('Camera not available', additionalDetails),
        new TelemedicineProviderOfflineError('provider-123', additionalDetails),
        new TelemedicineRecordingError('session-123', 'Recording failed', additionalDetails),
        new TelemedicineServiceError('ExampleRTC', 'Service unavailable', additionalDetails),
        new TelemedicineSessionInProgressError('session-123', additionalDetails),
        new TelemedicineBandwidthError('session-123', 'Low bandwidth', additionalDetails),
        new TelemedicineSessionTimeoutError('session-123', 30, additionalDetails)
      ];

      errors.forEach(error => {
        expect(error.details).toHaveProperty('testKey', 'testValue');
        expect(error.details).toHaveProperty('metadata');
        expect(error.details.metadata).toEqual({ foo: 'bar' });
      });
    });
  });
});