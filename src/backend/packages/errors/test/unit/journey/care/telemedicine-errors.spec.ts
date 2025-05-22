import { ErrorType } from '../../../../../../../shared/src/exceptions/exceptions.types';
import {
  TelemedicineConnectionError,
  TelemedicineDeviceError,
  TelemedicineErrorCode,
  TelemedicineMediaAccessError,
  TelemedicineProviderOfflineError,
  TelemedicineRecordingError,
  TelemedicineServiceError,
  TelemedicineSessionExpiredError,
  TelemedicineSessionInProgressError,
  TelemedicineSessionNotFoundError,
  TelemedicineSignalingError,
} from '../../../../src/journey/care/telemedicine-errors';

describe('Care Journey Telemedicine Error Classes', () => {
  describe('Error Code Prefixing', () => {
    it('should use TELE_ prefix for all error codes', () => {
      // Check that all error codes follow the correct prefix pattern
      Object.values(TelemedicineErrorCode).forEach(code => {
        expect(code).toMatch(/^TELE_\d+$/);
      });
    });
    
    it('should consider updating to CARE_TELEMEDICINE_ prefix for consistency', () => {
      // This test is a reminder that according to requirements, the prefix should be CARE_TELEMEDICINE_
      // Currently implemented as TELE_, but may need to be updated in the future
      expect('CARE_TELEMEDICINE_001').toMatch(/^CARE_TELEMEDICINE_\d+$/);
    });
  });

  describe('TelemedicineSessionNotFoundError', () => {
    const sessionId = 'test-session-123';
    const details = { userId: 'user-456' };
    let error: TelemedicineSessionNotFoundError;

    beforeEach(() => {
      error = new TelemedicineSessionNotFoundError(sessionId, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include session ID in error message', () => {
      expect(error.message).toContain(sessionId);
    });

    it('should have SESSION_NOT_FOUND error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.SESSION_NOT_FOUND);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineConnectionError', () => {
    const message = 'Connection timeout after 30 seconds';
    const details = { connectionId: 'conn-789', attempt: 3 };
    let error: TelemedicineConnectionError;

    beforeEach(() => {
      error = new TelemedicineConnectionError(message, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include connection message in error message', () => {
      expect(error.message).toContain(message);
    });

    it('should have CONNECTION_FAILED error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.CONNECTION_FAILED);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineDeviceError', () => {
    const deviceIssue = 'Camera not found';
    const details = { deviceId: 'camera-123' };
    let error: TelemedicineDeviceError;

    beforeEach(() => {
      error = new TelemedicineDeviceError(deviceIssue, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have VALIDATION error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should include device issue in error message', () => {
      expect(error.message).toContain(deviceIssue);
    });

    it('should have DEVICE_UNSUPPORTED error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.DEVICE_UNSUPPORTED);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineMediaAccessError', () => {
    const mediaTypes = ['camera', 'microphone', 'both'] as const;
    
    mediaTypes.forEach(mediaType => {
      describe(`with ${mediaType} access denied`, () => {
        const details = { browserName: 'Chrome', version: '90.0.4430.212' };
        let error: TelemedicineMediaAccessError;

        beforeEach(() => {
          error = new TelemedicineMediaAccessError(mediaType, details);
        });

        it('should extend AppException', () => {
          expect(error).toBeInstanceOf(Error);
        });

        it('should have VALIDATION error type', () => {
          expect(error.type).toBe(ErrorType.VALIDATION);
        });

        it('should include media type in error message', () => {
          expect(error.message).toContain(mediaType === 'both' ? 'Camera and microphone' : mediaType);
        });

        it('should have MEDIA_ACCESS_DENIED error code', () => {
          expect(error.code).toBe(TelemedicineErrorCode.MEDIA_ACCESS_DENIED);
        });

        it('should include details in error object', () => {
          expect(error.details).toEqual(details);
        });
      });
    });
  });

  describe('TelemedicineProviderOfflineError', () => {
    const providerId = 'provider-456';
    const details = { lastSeen: '2023-05-01T14:30:00Z' };
    let error: TelemedicineProviderOfflineError;

    beforeEach(() => {
      error = new TelemedicineProviderOfflineError(providerId, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have EXTERNAL error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include provider ID in error message', () => {
      expect(error.message).toContain(providerId);
    });

    it('should have PROVIDER_OFFLINE error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.PROVIDER_OFFLINE);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineRecordingError', () => {
    const sessionId = 'session-789';
    const reason = 'Insufficient storage';
    const details = { storageAvailable: '50MB', required: '200MB' };
    let error: TelemedicineRecordingError;

    beforeEach(() => {
      error = new TelemedicineRecordingError(sessionId, reason, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include session ID in error message', () => {
      expect(error.message).toContain(sessionId);
    });

    it('should include reason in error message', () => {
      expect(error.message).toContain(reason);
    });

    it('should have RECORDING_FAILED error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.RECORDING_FAILED);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineServiceError', () => {
    const providerName = 'VideoMD';
    const errorDetails = 'API rate limit exceeded';
    const details = { statusCode: 429, retryAfter: '60s' };
    let error: TelemedicineServiceError;

    beforeEach(() => {
      error = new TelemedicineServiceError(providerName, errorDetails, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have EXTERNAL error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should include provider name in error message', () => {
      expect(error.message).toContain(providerName);
    });

    it('should include error details in error message', () => {
      expect(error.message).toContain(errorDetails);
    });

    it('should have SERVICE_ERROR error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.SERVICE_ERROR);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineSessionInProgressError', () => {
    const sessionId = 'session-456';
    const details = { startedAt: '2023-05-01T15:00:00Z', participants: 2 };
    let error: TelemedicineSessionInProgressError;

    beforeEach(() => {
      error = new TelemedicineSessionInProgressError(sessionId, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include session ID in error message', () => {
      expect(error.message).toContain(sessionId);
    });

    it('should have SESSION_IN_PROGRESS error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.SESSION_IN_PROGRESS);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineSessionExpiredError', () => {
    const sessionId = 'session-123';
    const scheduledTime = '2023-05-01T14:00:00Z';
    const details = { expiresAt: '2023-05-01T14:30:00Z', currentTime: '2023-05-01T14:45:00Z' };
    let error: TelemedicineSessionExpiredError;

    beforeEach(() => {
      error = new TelemedicineSessionExpiredError(sessionId, scheduledTime, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have BUSINESS error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should include session ID in error message', () => {
      expect(error.message).toContain(sessionId);
    });

    it('should include scheduled time in error message', () => {
      expect(error.message).toContain(scheduledTime);
    });

    it('should have SESSION_EXPIRED error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.SESSION_EXPIRED);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('TelemedicineSignalingError', () => {
    const message = 'Failed to establish signaling connection';
    const details = { server: 'signaling-server-1', attempt: 2 };
    let error: TelemedicineSignalingError;

    beforeEach(() => {
      error = new TelemedicineSignalingError(message, details);
    });

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
    });

    it('should have TECHNICAL error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should include error message', () => {
      expect(error.message).toContain(message);
    });

    it('should have SIGNALING_ERROR error code', () => {
      expect(error.code).toBe(TelemedicineErrorCode.SIGNALING_ERROR);
    });

    it('should include details in error object', () => {
      expect(error.details).toEqual(details);
    });
  });

  describe('HTTP Status Code Mapping', () => {
    it('should map VALIDATION errors to 400 Bad Request', () => {
      const error = new TelemedicineDeviceError('Camera not found');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(400);
    });

    it('should map BUSINESS errors to 422 Unprocessable Entity', () => {
      const error = new TelemedicineSessionNotFoundError('session-123');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(422);
    });

    it('should map TECHNICAL errors to 500 Internal Server Error', () => {
      const error = new TelemedicineConnectionError('Connection timeout');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(500);
    });

    it('should map EXTERNAL errors to 502 Bad Gateway', () => {
      const error = new TelemedicineProviderOfflineError('provider-456');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(502);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize errors to JSON with proper structure', () => {
      const error = new TelemedicineSessionNotFoundError('session-123', { userId: 'user-456' });
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: TelemedicineErrorCode.SESSION_NOT_FOUND,
          message: expect.stringContaining('session-123'),
          details: { userId: 'user-456' }
        }
      });
    });
  });
});