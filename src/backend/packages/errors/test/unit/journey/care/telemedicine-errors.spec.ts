import { BaseError } from '../../../../src/base';
import { ErrorType, ErrorCategory } from '../../../../src/types';
import {
  TelemedicineSessionNotFoundError,
  TelemedicineConnectionError,
  TelemedicineDeviceError,
  TelemedicineProviderOfflineError,
  TelemedicineRecordingError,
  TelemedicineServiceError
} from '../../../../src/journey/care/telemedicine-errors';

describe('Care Journey Telemedicine Errors', () => {
  describe('TelemedicineSessionNotFoundError', () => {
    it('should extend BaseError', () => {
      const error = new TelemedicineSessionNotFoundError('Session not found', { sessionId: 'session-123' });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should use CARE_TELEMEDICINE_ prefixed error code', () => {
      const error = new TelemedicineSessionNotFoundError('Session not found', { sessionId: 'session-123' });
      expect(error.code).toMatch(/^CARE_TELEMEDICINE_/);
    });

    it('should include session context in error object', () => {
      const sessionId = 'session-123';
      const error = new TelemedicineSessionNotFoundError('Session not found', { sessionId });
      
      expect(error.context).toBeDefined();
      expect(error.context.sessionId).toBe(sessionId);
    });

    it('should be classified as a business error', () => {
      const error = new TelemedicineSessionNotFoundError('Session not found', { sessionId: 'session-123' });
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.category).toBe(ErrorCategory.CLIENT);
    });

    it('should map to 404 HTTP status code', () => {
      const error = new TelemedicineSessionNotFoundError('Session not found', { sessionId: 'session-123' });
      const serialized = error.toJSON();
      
      expect(serialized.statusCode).toBe(404);
    });
  });

  describe('TelemedicineConnectionError', () => {
    it('should extend BaseError', () => {
      const error = new TelemedicineConnectionError('Connection failed', { 
        sessionId: 'session-123',
        connectionState: 'failed',
        iceConnectionState: 'disconnected'
      });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should use CARE_TELEMEDICINE_ prefixed error code', () => {
      const error = new TelemedicineConnectionError('Connection failed', { 
        sessionId: 'session-123',
        connectionState: 'failed',
        iceConnectionState: 'disconnected'
      });
      expect(error.code).toMatch(/^CARE_TELEMEDICINE_/);
    });

    it('should include WebRTC connection context in error object', () => {
      const sessionId = 'session-123';
      const connectionState = 'failed';
      const iceConnectionState = 'disconnected';
      
      const error = new TelemedicineConnectionError('Connection failed', { 
        sessionId,
        connectionState,
        iceConnectionState
      });
      
      expect(error.context).toBeDefined();
      expect(error.context.sessionId).toBe(sessionId);
      expect(error.context.connectionState).toBe(connectionState);
      expect(error.context.iceConnectionState).toBe(iceConnectionState);
    });

    it('should be classified as a technical error', () => {
      const error = new TelemedicineConnectionError('Connection failed', { 
        sessionId: 'session-123',
        connectionState: 'failed',
        iceConnectionState: 'disconnected'
      });
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.category).toBe(ErrorCategory.TRANSIENT);
    });

    it('should map to 503 HTTP status code', () => {
      const error = new TelemedicineConnectionError('Connection failed', { 
        sessionId: 'session-123',
        connectionState: 'failed',
        iceConnectionState: 'disconnected'
      });
      const serialized = error.toJSON();
      
      expect(serialized.statusCode).toBe(503);
    });

    it('should support wrapping original WebRTC errors', () => {
      const originalError = new Error('ICE connection failed');
      const error = TelemedicineConnectionError.fromError(originalError, { 
        sessionId: 'session-123',
        connectionState: 'failed',
        iceConnectionState: 'disconnected'
      });
      
      expect(error.cause).toBe(originalError);
      expect(error.message).toContain('ICE connection failed');
    });
  });

  describe('TelemedicineDeviceError', () => {
    it('should extend BaseError', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera',
        deviceId: 'default'
      });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should use CARE_TELEMEDICINE_ prefixed error code', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera',
        deviceId: 'default'
      });
      expect(error.code).toMatch(/^CARE_TELEMEDICINE_/);
    });

    it('should include device context in error object', () => {
      const sessionId = 'session-123';
      const deviceType = 'camera';
      const deviceId = 'default';
      
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId,
        deviceType,
        deviceId
      });
      
      expect(error.context).toBeDefined();
      expect(error.context.sessionId).toBe(sessionId);
      expect(error.context.deviceType).toBe(deviceType);
      expect(error.context.deviceId).toBe(deviceId);
    });

    it('should be classified as a validation error', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera',
        deviceId: 'default'
      });
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.category).toBe(ErrorCategory.CLIENT);
    });

    it('should map to 400 HTTP status code', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera',
        deviceId: 'default'
      });
      const serialized = error.toJSON();
      
      expect(serialized.statusCode).toBe(400);
    });

    it('should include troubleshooting steps in the error message', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera',
        deviceId: 'default'
      });
      
      expect(error.message).toContain('Camera access denied');
      expect(error.message).toContain('troubleshoot');
    });
  });

  describe('TelemedicineProviderOfflineError', () => {
    it('should extend BaseError', () => {
      const error = new TelemedicineProviderOfflineError('Provider is offline', { 
        sessionId: 'session-123',
        providerId: 'provider-456',
        lastSeen: new Date()
      });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should use CARE_TELEMEDICINE_ prefixed error code', () => {
      const error = new TelemedicineProviderOfflineError('Provider is offline', { 
        sessionId: 'session-123',
        providerId: 'provider-456',
        lastSeen: new Date()
      });
      expect(error.code).toMatch(/^CARE_TELEMEDICINE_/);
    });

    it('should include provider context in error object', () => {
      const sessionId = 'session-123';
      const providerId = 'provider-456';
      const lastSeen = new Date();
      
      const error = new TelemedicineProviderOfflineError('Provider is offline', { 
        sessionId,
        providerId,
        lastSeen
      });
      
      expect(error.context).toBeDefined();
      expect(error.context.sessionId).toBe(sessionId);
      expect(error.context.providerId).toBe(providerId);
      expect(error.context.lastSeen).toBe(lastSeen);
    });

    it('should be classified as a business error', () => {
      const error = new TelemedicineProviderOfflineError('Provider is offline', { 
        sessionId: 'session-123',
        providerId: 'provider-456',
        lastSeen: new Date()
      });
      
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.category).toBe(ErrorCategory.CLIENT);
    });

    it('should map to 409 HTTP status code', () => {
      const error = new TelemedicineProviderOfflineError('Provider is offline', { 
        sessionId: 'session-123',
        providerId: 'provider-456',
        lastSeen: new Date()
      });
      const serialized = error.toJSON();
      
      expect(serialized.statusCode).toBe(409);
    });
  });

  describe('TelemedicineRecordingError', () => {
    it('should extend BaseError', () => {
      const error = new TelemedicineRecordingError('Failed to start recording', { 
        sessionId: 'session-123',
        recordingId: 'rec-789',
        storageError: 'Insufficient permissions'
      });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should use CARE_TELEMEDICINE_ prefixed error code', () => {
      const error = new TelemedicineRecordingError('Failed to start recording', { 
        sessionId: 'session-123',
        recordingId: 'rec-789',
        storageError: 'Insufficient permissions'
      });
      expect(error.code).toMatch(/^CARE_TELEMEDICINE_/);
    });

    it('should include recording context in error object', () => {
      const sessionId = 'session-123';
      const recordingId = 'rec-789';
      const storageError = 'Insufficient permissions';
      
      const error = new TelemedicineRecordingError('Failed to start recording', { 
        sessionId,
        recordingId,
        storageError
      });
      
      expect(error.context).toBeDefined();
      expect(error.context.sessionId).toBe(sessionId);
      expect(error.context.recordingId).toBe(recordingId);
      expect(error.context.storageError).toBe(storageError);
    });

    it('should be classified as a technical error', () => {
      const error = new TelemedicineRecordingError('Failed to start recording', { 
        sessionId: 'session-123',
        recordingId: 'rec-789',
        storageError: 'Insufficient permissions'
      });
      
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.category).toBe(ErrorCategory.SERVER);
    });

    it('should map to 500 HTTP status code', () => {
      const error = new TelemedicineRecordingError('Failed to start recording', { 
        sessionId: 'session-123',
        recordingId: 'rec-789',
        storageError: 'Insufficient permissions'
      });
      const serialized = error.toJSON();
      
      expect(serialized.statusCode).toBe(500);
    });
  });

  describe('TelemedicineServiceError', () => {
    it('should extend BaseError', () => {
      const error = new TelemedicineServiceError('External telemedicine service unavailable', { 
        sessionId: 'session-123',
        provider: 'external-provider',
        statusCode: 503
      });
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should use CARE_TELEMEDICINE_ prefixed error code', () => {
      const error = new TelemedicineServiceError('External telemedicine service unavailable', { 
        sessionId: 'session-123',
        provider: 'external-provider',
        statusCode: 503
      });
      expect(error.code).toMatch(/^CARE_TELEMEDICINE_/);
    });

    it('should include external service context in error object', () => {
      const sessionId = 'session-123';
      const provider = 'external-provider';
      const statusCode = 503;
      
      const error = new TelemedicineServiceError('External telemedicine service unavailable', { 
        sessionId,
        provider,
        statusCode
      });
      
      expect(error.context).toBeDefined();
      expect(error.context.sessionId).toBe(sessionId);
      expect(error.context.provider).toBe(provider);
      expect(error.context.statusCode).toBe(statusCode);
    });

    it('should be classified as an external error', () => {
      const error = new TelemedicineServiceError('External telemedicine service unavailable', { 
        sessionId: 'session-123',
        provider: 'external-provider',
        statusCode: 503
      });
      
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.category).toBe(ErrorCategory.EXTERNAL);
    });

    it('should map to 502 HTTP status code', () => {
      const error = new TelemedicineServiceError('External telemedicine service unavailable', { 
        sessionId: 'session-123',
        provider: 'external-provider',
        statusCode: 503
      });
      const serialized = error.toJSON();
      
      expect(serialized.statusCode).toBe(502);
    });

    it('should support circuit breaker integration', () => {
      const error = new TelemedicineServiceError('External telemedicine service unavailable', { 
        sessionId: 'session-123',
        provider: 'external-provider',
        statusCode: 503,
        circuitBreaker: {
          isOpen: true,
          failureCount: 5,
          lastFailure: new Date()
        }
      });
      
      expect(error.context.circuitBreaker).toBeDefined();
      expect(error.context.circuitBreaker.isOpen).toBe(true);
      expect(error.context.circuitBreaker.failureCount).toBe(5);
      expect(error.context.circuitBreaker.lastFailure).toBeInstanceOf(Date);
    });
  });

  describe('Error Context Enrichment', () => {
    it('should allow enriching context after creation', () => {
      const error = new TelemedicineConnectionError('Connection failed', { 
        sessionId: 'session-123',
        connectionState: 'failed'
      });

      error.enrichContext({
        iceConnectionState: 'disconnected',
        networkType: 'wifi',
        bandwidth: '2.5 Mbps'
      });

      expect(error.context.sessionId).toBe('session-123');
      expect(error.context.connectionState).toBe('failed');
      expect(error.context.iceConnectionState).toBe('disconnected');
      expect(error.context.networkType).toBe('wifi');
      expect(error.context.bandwidth).toBe('2.5 Mbps');
    });

    it('should merge context when enriching', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera'
      });

      error.enrichContext({
        deviceId: 'default',
        browserPermissions: 'denied'
      });

      expect(error.context.sessionId).toBe('session-123');
      expect(error.context.deviceType).toBe('camera');
      expect(error.context.deviceId).toBe('default');
      expect(error.context.browserPermissions).toBe('denied');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to a structured format with telemedicine context', () => {
      const sessionId = 'session-123';
      const providerId = 'provider-456';
      const lastSeen = new Date();
      
      const error = new TelemedicineProviderOfflineError('Provider is offline', { 
        sessionId,
        providerId,
        lastSeen
      });

      const serialized = error.toJSON();

      expect(serialized).toHaveProperty('message', 'Provider is offline');
      expect(serialized).toHaveProperty('code');
      expect(serialized.code).toMatch(/^CARE_TELEMEDICINE_/);
      expect(serialized).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized).toHaveProperty('category', ErrorCategory.CLIENT);
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('sessionId', sessionId);
      expect(serialized.context).toHaveProperty('providerId', providerId);
      expect(serialized.context).toHaveProperty('lastSeen', lastSeen);
    });

    it('should include troubleshooting information in serialized output', () => {
      const error = new TelemedicineDeviceError('Camera access denied', { 
        sessionId: 'session-123',
        deviceType: 'camera',
        deviceId: 'default',
        troubleshooting: [
          'Check browser permissions',
          'Ensure no other application is using the camera',
          'Try a different browser'
        ]
      });

      const serialized = error.toJSON();

      expect(serialized.context).toHaveProperty('troubleshooting');
      expect(serialized.context.troubleshooting).toBeInstanceOf(Array);
      expect(serialized.context.troubleshooting).toHaveLength(3);
      expect(serialized.context.troubleshooting[0]).toBe('Check browser permissions');
    });
  });
});