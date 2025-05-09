import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  DeviceConnectionFailureError,
  DevicePairingFailureError,
  DeviceAuthenticationError,
  SynchronizationFailedError,
  DataFormatError,
  DataTransferError,
  UnsupportedDeviceError,
  DeviceVersionMismatchError,
  DeviceConnectionLostError,
  MaxConnectionAttemptsError,
  HealthDeviceError,
  DeviceErrorContext,
  SyncErrorContext
} from '../../../../src/journey/health/devices.errors';
import { ConnectionStatus, DeviceType } from '../../../../../interfaces/journey/health/device-connection.interface';

describe('Health Journey Device Errors', () => {
  // Common test context objects
  const deviceContext: DeviceErrorContext = {
    deviceId: 'device-123',
    deviceType: DeviceType.SMARTWATCH,
    connectionStatus: ConnectionStatus.ERROR,
    recordId: 'record-456',
    timestamp: new Date()
  };

  const syncContext: SyncErrorContext = {
    ...deviceContext,
    lastSuccessfulSync: new Date(Date.now() - 86400000), // 1 day ago
    syncAttemptTimestamp: new Date(),
    dataPoints: 150,
    errorDetails: 'Connection timeout during data transfer'
  };

  describe('HealthDeviceError Base Class', () => {
    // Create a concrete implementation for testing the abstract base class
    class TestDeviceError extends HealthDeviceError {
      constructor(message: string, context: DeviceErrorContext) {
        super(message, 'HEALTH_DEVICES_TEST', ErrorType.TECHNICAL, context);
      }
    }

    it('should create an instance with the correct properties', () => {
      const error = new TestDeviceError('Test error message', deviceContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('HEALTH_DEVICES_TEST');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.context).toEqual(deviceContext);
    });

    it('should serialize to JSON with device context', () => {
      const error = new TestDeviceError('Test error message', deviceContext);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'HEALTH_DEVICES_TEST',
          message: 'Test error message',
          details: deviceContext
        }
      });
    });

    it('should convert to HttpException with correct status code', () => {
      const error = new TestDeviceError('Test error message', deviceContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });
  });

  describe('DeviceConnectionFailureError', () => {
    it('should create an instance with default message', () => {
      const error = new DeviceConnectionFailureError(undefined, deviceContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Failed to connect to device');
      expect(error.code).toBe('HEALTH_DEVICES_CONNECTION_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.context).toEqual(deviceContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Unable to establish connection with smartwatch';
      const error = new DeviceConnectionFailureError(customMessage, deviceContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should convert to HttpException with BAD_GATEWAY status', () => {
      const error = new DeviceConnectionFailureError(undefined, deviceContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('DevicePairingFailureError', () => {
    it('should create an instance with default message', () => {
      const error = new DevicePairingFailureError(undefined, deviceContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Failed to pair with device');
      expect(error.code).toBe('HEALTH_DEVICES_PAIRING_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.context).toEqual(deviceContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Pairing process timed out';
      const error = new DevicePairingFailureError(customMessage, deviceContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should convert to HttpException with BAD_GATEWAY status', () => {
      const error = new DevicePairingFailureError(undefined, deviceContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('DeviceAuthenticationError', () => {
    it('should create an instance with default message', () => {
      const error = new DeviceAuthenticationError(undefined, deviceContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Device authentication failed');
      expect(error.code).toBe('HEALTH_DEVICES_AUTHENTICATION_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.context).toEqual(deviceContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Invalid credentials for device authentication';
      const error = new DeviceAuthenticationError(customMessage, deviceContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should convert to HttpException with BAD_GATEWAY status', () => {
      const error = new DeviceAuthenticationError(undefined, deviceContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('SynchronizationFailedError', () => {
    it('should create an instance with default message', () => {
      const error = new SynchronizationFailedError(undefined, syncContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Failed to synchronize device data');
      expect(error.code).toBe('HEALTH_DEVICES_SYNC_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.context).toEqual(syncContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Synchronization process interrupted';
      const error = new SynchronizationFailedError(customMessage, syncContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should include sync-specific context data', () => {
      const error = new SynchronizationFailedError(undefined, syncContext);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('lastSuccessfulSync');
      expect(json.error.details).toHaveProperty('syncAttemptTimestamp');
      expect(json.error.details).toHaveProperty('dataPoints');
      expect(json.error.details).toHaveProperty('errorDetails');
    });

    it('should convert to HttpException with BAD_GATEWAY status', () => {
      const error = new SynchronizationFailedError(undefined, syncContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('DataFormatError', () => {
    it('should create an instance with default message', () => {
      const error = new DataFormatError(undefined, syncContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Invalid data format received from device');
      expect(error.code).toBe('HEALTH_DEVICES_DATA_FORMAT_ERROR');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.context).toEqual(syncContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Malformed data structure in device payload';
      const error = new DataFormatError(customMessage, syncContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should convert to HttpException with BAD_REQUEST status', () => {
      const error = new DataFormatError(undefined, syncContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DataTransferError', () => {
    it('should create an instance with default message', () => {
      const error = new DataTransferError(undefined, syncContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Data transfer from device failed');
      expect(error.code).toBe('HEALTH_DEVICES_DATA_TRANSFER_ERROR');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.context).toEqual(syncContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Connection dropped during data transfer';
      const error = new DataTransferError(customMessage, syncContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should convert to HttpException with BAD_GATEWAY status', () => {
      const error = new DataTransferError(undefined, syncContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('UnsupportedDeviceError', () => {
    it('should create an instance with default message', () => {
      const error = new UnsupportedDeviceError(undefined, deviceContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Device type is not supported');
      expect(error.code).toBe('HEALTH_DEVICES_UNSUPPORTED_DEVICE');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toEqual(deviceContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'This device model is not compatible with the application';
      const error = new UnsupportedDeviceError(customMessage, deviceContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should convert to HttpException with UNPROCESSABLE_ENTITY status', () => {
      const error = new UnsupportedDeviceError(undefined, deviceContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('DeviceVersionMismatchError', () => {
    const versionContext = {
      ...deviceContext,
      currentVersion: '1.2.3',
      requiredVersion: '2.0.0'
    };

    it('should create an instance with default message', () => {
      const error = new DeviceVersionMismatchError(undefined, versionContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Device version is incompatible');
      expect(error.code).toBe('HEALTH_DEVICES_VERSION_MISMATCH');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toEqual(versionContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Device firmware needs to be updated';
      const error = new DeviceVersionMismatchError(customMessage, versionContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should include version-specific context data', () => {
      const error = new DeviceVersionMismatchError(undefined, versionContext);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('currentVersion', '1.2.3');
      expect(json.error.details).toHaveProperty('requiredVersion', '2.0.0');
    });

    it('should convert to HttpException with UNPROCESSABLE_ENTITY status', () => {
      const error = new DeviceVersionMismatchError(undefined, versionContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('DeviceConnectionLostError', () => {
    const connectionLostContext = {
      ...deviceContext,
      lastActiveTimestamp: new Date(Date.now() - 300000) // 5 minutes ago
    };

    it('should create an instance with default message', () => {
      const error = new DeviceConnectionLostError(undefined, connectionLostContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Connection to device was lost');
      expect(error.code).toBe('HEALTH_DEVICES_CONNECTION_LOST');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.context).toEqual(connectionLostContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Device disconnected unexpectedly';
      const error = new DeviceConnectionLostError(customMessage, connectionLostContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should include connection-specific context data', () => {
      const error = new DeviceConnectionLostError(undefined, connectionLostContext);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('lastActiveTimestamp');
    });

    it('should convert to HttpException with BAD_GATEWAY status', () => {
      const error = new DeviceConnectionLostError(undefined, connectionLostContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('MaxConnectionAttemptsError', () => {
    const attemptsContext = {
      ...deviceContext,
      attempts: 5,
      maxAttempts: 3
    };

    it('should create an instance with default message', () => {
      const error = new MaxConnectionAttemptsError(undefined, attemptsContext);
      
      expect(error).toBeInstanceOf(HealthDeviceError);
      expect(error.message).toBe('Maximum connection attempts reached');
      expect(error.code).toBe('HEALTH_DEVICES_MAX_ATTEMPTS_REACHED');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.context).toEqual(attemptsContext);
    });

    it('should create an instance with custom message', () => {
      const customMessage = 'Too many failed connection attempts';
      const error = new MaxConnectionAttemptsError(customMessage, attemptsContext);
      
      expect(error.message).toBe(customMessage);
    });

    it('should include attempts-specific context data', () => {
      const error = new MaxConnectionAttemptsError(undefined, attemptsContext);
      const json = error.toJSON();
      
      expect(json.error.details).toHaveProperty('attempts', 5);
      expect(json.error.details).toHaveProperty('maxAttempts', 3);
    });

    it('should convert to HttpException with UNPROCESSABLE_ENTITY status', () => {
      const error = new MaxConnectionAttemptsError(undefined, attemptsContext);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Error code prefixing', () => {
    it('should ensure all error codes are prefixed with HEALTH_DEVICES_', () => {
      const errors = [
        new DeviceConnectionFailureError(undefined, deviceContext),
        new DevicePairingFailureError(undefined, deviceContext),
        new DeviceAuthenticationError(undefined, deviceContext),
        new SynchronizationFailedError(undefined, syncContext),
        new DataFormatError(undefined, syncContext),
        new DataTransferError(undefined, syncContext),
        new UnsupportedDeviceError(undefined, deviceContext),
        new DeviceVersionMismatchError(undefined, { ...deviceContext, currentVersion: '1.0', requiredVersion: '2.0' }),
        new DeviceConnectionLostError(undefined, { ...deviceContext, lastActiveTimestamp: new Date() }),
        new MaxConnectionAttemptsError(undefined, { ...deviceContext, attempts: 5, maxAttempts: 3 })
      ];

      errors.forEach(error => {
        expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      });
    });
  });

  describe('Error classification', () => {
    it('should classify external system errors correctly', () => {
      const externalErrors = [
        new DeviceConnectionFailureError(undefined, deviceContext),
        new DevicePairingFailureError(undefined, deviceContext),
        new DeviceAuthenticationError(undefined, deviceContext),
        new SynchronizationFailedError(undefined, syncContext),
        new DataTransferError(undefined, syncContext),
        new DeviceConnectionLostError(undefined, { ...deviceContext, lastActiveTimestamp: new Date() })
      ];

      externalErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.EXTERNAL);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      });
    });

    it('should classify validation errors correctly', () => {
      const validationErrors = [
        new DataFormatError(undefined, syncContext)
      ];

      validationErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    it('should classify business errors correctly', () => {
      const businessErrors = [
        new UnsupportedDeviceError(undefined, deviceContext),
        new DeviceVersionMismatchError(undefined, { ...deviceContext, currentVersion: '1.0', requiredVersion: '2.0' }),
        new MaxConnectionAttemptsError(undefined, { ...deviceContext, attempts: 5, maxAttempts: 3 })
      ];

      businessErrors.forEach(error => {
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toHttpException().getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });
  });
});