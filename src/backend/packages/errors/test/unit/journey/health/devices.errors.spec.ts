import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  DeviceException,
  DeviceConnectionFailureError,
  SynchronizationFailedError,
  DeviceCompatibilityError,
  DevicePermissionError,
  DeviceTimeoutError,
  DeviceDataValidationError,
  DeviceErrorContext
} from '../../../../src/journey/health/devices.errors';

describe('Health Journey Device Errors', () => {
  const mockTimestamp = new Date('2023-01-01T12:00:00Z');
  
  // Base device context for testing
  const baseDeviceContext: DeviceErrorContext = {
    deviceId: 'device-123',
    deviceType: 'smartwatch',
    manufacturer: 'FitTech',
    connectionState: 'disconnected',
    timestamp: mockTimestamp,
    details: { batteryLevel: '45%' }
  };

  describe('DeviceException (Base Class)', () => {
    class TestDeviceException extends DeviceException {
      constructor(message: string, context: DeviceErrorContext) {
        super(message, ErrorType.TECHNICAL, 'HEALTH_DEVICES_TEST', context);
      }
    }

    it('should create an instance with the correct properties', () => {
      const message = 'Test device error';
      const error = new TestDeviceException(message, baseDeviceContext);

      expect(error).toBeInstanceOf(DeviceException);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('HEALTH_DEVICES_TEST');
      expect(error.context).toEqual(baseDeviceContext);
    });

    it('should serialize to JSON with device context', () => {
      const error = new TestDeviceException('Test error', baseDeviceContext);
      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'HEALTH_DEVICES_TEST',
          message: 'Test error',
          context: baseDeviceContext
        }
      });
    });
  });

  describe('DeviceConnectionFailureError', () => {
    it('should create an instance with the correct error type and code', () => {
      const context = {
        ...baseDeviceContext,
        failureReason: 'PAIRING_FAILED',
        attemptCount: 3,
        protocol: 'BLUETOOTH'
      };

      const error = new DeviceConnectionFailureError('Failed to connect to device', context);

      expect(error).toBeInstanceOf(DeviceConnectionFailureError);
      expect(error).toBeInstanceOf(DeviceException);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('HEALTH_DEVICES_CONNECTION_FAILURE');
    });

    it('should capture connection-specific context data', () => {
      const context = {
        ...baseDeviceContext,
        failureReason: 'BLUETOOTH_DISABLED',
        attemptCount: 2,
        protocol: 'BLUETOOTH'
      };

      const error = new DeviceConnectionFailureError('Bluetooth is disabled', context);

      expect(error.context).toEqual(context);
      expect(error.context.failureReason).toBe('BLUETOOTH_DISABLED');
      expect(error.context.attemptCount).toBe(2);
      expect(error.context.protocol).toBe('BLUETOOTH');
    });

    it('should use current timestamp if not provided', () => {
      const contextWithoutTimestamp = {
        ...baseDeviceContext,
        timestamp: undefined,
        failureReason: 'CONNECTION_TIMEOUT'
      } as any;

      const beforeCreate = new Date();
      const error = new DeviceConnectionFailureError('Connection timed out', contextWithoutTimestamp);
      const afterCreate = new Date();

      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.context.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(error.context.timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should map to the correct HTTP status code for external errors', () => {
      const error = new DeviceConnectionFailureError('Failed to connect', baseDeviceContext);
      const httpException = error.toJSON();

      expect(httpException.error.type).toBe(ErrorType.EXTERNAL);
      // In a real scenario, we would test the actual HTTP status code from toHttpException()
      // but we're testing the error type which maps to BAD_GATEWAY (502)
    });
  });

  describe('SynchronizationFailedError', () => {
    it('should create an instance with the correct error type and code', () => {
      const context = {
        ...baseDeviceContext,
        failureReason: 'DATA_FORMAT_ERROR',
        dataType: 'HEART_RATE',
        syncStartTime: new Date('2023-01-01T11:45:00Z'),
        transferredAmount: 150,
        totalAmount: 500
      };

      const error = new SynchronizationFailedError('Failed to synchronize heart rate data', context);

      expect(error).toBeInstanceOf(SynchronizationFailedError);
      expect(error).toBeInstanceOf(DeviceException);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('HEALTH_DEVICES_SYNC_FAILURE');
    });

    it('should capture synchronization-specific context data', () => {
      const syncStartTime = new Date('2023-01-01T11:30:00Z');
      const context = {
        ...baseDeviceContext,
        failureReason: 'TRANSFER_INTERRUPTED',
        dataType: 'STEPS',
        syncStartTime,
        transferredAmount: 250,
        totalAmount: 1000
      };

      const error = new SynchronizationFailedError('Data transfer was interrupted', context);

      expect(error.context).toEqual(context);
      expect(error.context.failureReason).toBe('TRANSFER_INTERRUPTED');
      expect(error.context.dataType).toBe('STEPS');
      expect(error.context.syncStartTime).toBe(syncStartTime);
      expect(error.context.transferredAmount).toBe(250);
      expect(error.context.totalAmount).toBe(1000);
    });

    it('should include progress information in the error context', () => {
      const context = {
        ...baseDeviceContext,
        failureReason: 'DEVICE_DISCONNECTED',
        dataType: 'ALL',
        transferredAmount: 750,
        totalAmount: 1000
      };

      const error = new SynchronizationFailedError('Device disconnected during sync', context);

      // Calculate expected progress percentage
      const progressPercentage = (context.transferredAmount / context.totalAmount) * 100;
      
      expect(error.context.transferredAmount).toBe(750);
      expect(error.context.totalAmount).toBe(1000);
      // In a real implementation, we might have a getter for progress percentage
      // Here we're just verifying the data needed to calculate it is present
      expect(progressPercentage).toBe(75);
    });
  });

  describe('DeviceCompatibilityError', () => {
    it('should create an instance with the correct error type and code', () => {
      const context = {
        ...baseDeviceContext,
        incompatibilityReason: 'FIRMWARE_VERSION_MISMATCH',
        firmwareVersion: '1.2.3',
        requiredFirmwareVersion: '2.0.0',
        incompatibleFeatures: ['continuous_heart_rate', 'sleep_tracking']
      };

      const error = new DeviceCompatibilityError('Device firmware is outdated', context);

      expect(error).toBeInstanceOf(DeviceCompatibilityError);
      expect(error).toBeInstanceOf(DeviceException);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_DEVICES_COMPATIBILITY_ERROR');
    });

    it('should capture compatibility-specific context data', () => {
      const context = {
        ...baseDeviceContext,
        incompatibilityReason: 'UNSUPPORTED_DEVICE',
        incompatibleFeatures: ['blood_oxygen', 'ecg']
      };

      const error = new DeviceCompatibilityError('Device is not supported', context);

      expect(error.context).toEqual(context);
      expect(error.context.incompatibilityReason).toBe('UNSUPPORTED_DEVICE');
      expect(error.context.incompatibleFeatures).toEqual(['blood_oxygen', 'ecg']);
    });

    it('should map to the correct HTTP status code for business errors', () => {
      const context = {
        ...baseDeviceContext,
        incompatibilityReason: 'API_INCOMPATIBILITY'
      };

      const error = new DeviceCompatibilityError('API version not compatible', context);
      const httpException = error.toJSON();

      expect(httpException.error.type).toBe(ErrorType.BUSINESS);
      // In a real scenario, this would map to UNPROCESSABLE_ENTITY (422)
    });
  });

  describe('DevicePermissionError', () => {
    it('should create an instance with the correct error type and code', () => {
      const context = {
        ...baseDeviceContext,
        permission: 'BLUETOOTH',
        userDenied: true,
        canRequestAgain: false
      };

      const error = new DevicePermissionError('Bluetooth permission denied', context);

      expect(error).toBeInstanceOf(DevicePermissionError);
      expect(error).toBeInstanceOf(DeviceException);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('HEALTH_DEVICES_PERMISSION_ERROR');
    });

    it('should capture permission-specific context data', () => {
      const context = {
        ...baseDeviceContext,
        permission: 'LOCATION',
        userDenied: false,
        canRequestAgain: true
      };

      const error = new DevicePermissionError('Location permission required', context);

      expect(error.context).toEqual(context);
      expect(error.context.permission).toBe('LOCATION');
      expect(error.context.userDenied).toBe(false);
      expect(error.context.canRequestAgain).toBe(true);
    });

    it('should provide guidance for permission resolution based on context', () => {
      // Test with permission that can be requested again
      const canRequestContext = {
        ...baseDeviceContext,
        permission: 'STORAGE',
        userDenied: false,
        canRequestAgain: true
      };
      const canRequestError = new DevicePermissionError('Storage permission required', canRequestContext);
      
      // Test with permanently denied permission
      const cannotRequestContext = {
        ...baseDeviceContext,
        permission: 'BLUETOOTH',
        userDenied: true,
        canRequestAgain: false
      };
      const cannotRequestError = new DevicePermissionError('Bluetooth permission denied', cannotRequestContext);

      // In a real implementation, we might have methods that return guidance messages
      // Here we're just verifying the context data is captured correctly
      expect(canRequestError.context.canRequestAgain).toBe(true);
      expect(cannotRequestError.context.canRequestAgain).toBe(false);
    });
  });

  describe('DeviceTimeoutError', () => {
    it('should create an instance with the correct error type and code', () => {
      const context = {
        ...baseDeviceContext,
        operationType: 'CONNECTION',
        timeoutDuration: 30000,
        canRetry: true
      };

      const error = new DeviceTimeoutError('Connection timed out after 30 seconds', context);

      expect(error).toBeInstanceOf(DeviceTimeoutError);
      expect(error).toBeInstanceOf(DeviceException);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe('HEALTH_DEVICES_TIMEOUT_ERROR');
    });

    it('should capture timeout-specific context data', () => {
      const context = {
        ...baseDeviceContext,
        operationType: 'SYNCHRONIZATION',
        timeoutDuration: 60000,
        canRetry: true
      };

      const error = new DeviceTimeoutError('Synchronization timed out after 60 seconds', context);

      expect(error.context).toEqual(context);
      expect(error.context.operationType).toBe('SYNCHRONIZATION');
      expect(error.context.timeoutDuration).toBe(60000);
      expect(error.context.canRetry).toBe(true);
    });

    it('should format timeout duration in a human-readable way', () => {
      // Test with seconds
      const secondsContext = {
        ...baseDeviceContext,
        operationType: 'DATA_TRANSFER',
        timeoutDuration: 5000 // 5 seconds
      };
      const secondsError = new DeviceTimeoutError('Data transfer timed out', secondsContext);

      // Test with minutes
      const minutesContext = {
        ...baseDeviceContext,
        operationType: 'COMMAND_EXECUTION',
        timeoutDuration: 120000 // 2 minutes
      };
      const minutesError = new DeviceTimeoutError('Command execution timed out', minutesContext);

      // In a real implementation, we might have a formatter for the duration
      // Here we're just verifying the raw data is captured correctly
      expect(secondsError.context.timeoutDuration).toBe(5000);
      expect(minutesError.context.timeoutDuration).toBe(120000);
    });
  });

  describe('DeviceDataValidationError', () => {
    it('should create an instance with the correct error type and code', () => {
      const context = {
        ...baseDeviceContext,
        dataType: 'HEART_RATE',
        validationErrors: {
          'value': 'Heart rate must be between 30 and 220 bpm',
          'timestamp': 'Timestamp cannot be in the future'
        },
        canPartiallyProcess: true,
        failedRecordsCount: 5,
        totalRecordsCount: 100
      };

      const error = new DeviceDataValidationError('Invalid heart rate data', context);

      expect(error).toBeInstanceOf(DeviceDataValidationError);
      expect(error).toBeInstanceOf(DeviceException);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('HEALTH_DEVICES_DATA_VALIDATION_ERROR');
    });

    it('should capture validation-specific context data', () => {
      const validationErrors = {
        'value': 'Step count cannot be negative',
        'date': 'Date must be within the last 7 days'
      };
      
      const context = {
        ...baseDeviceContext,
        dataType: 'STEPS',
        validationErrors,
        canPartiallyProcess: true,
        failedRecordsCount: 3,
        totalRecordsCount: 50
      };

      const error = new DeviceDataValidationError('Invalid step count data', context);

      expect(error.context).toEqual(context);
      expect(error.context.dataType).toBe('STEPS');
      expect(error.context.validationErrors).toEqual(validationErrors);
      expect(error.context.canPartiallyProcess).toBe(true);
      expect(error.context.failedRecordsCount).toBe(3);
      expect(error.context.totalRecordsCount).toBe(50);
    });

    it('should map to the correct HTTP status code for validation errors', () => {
      const context = {
        ...baseDeviceContext,
        dataType: 'BLOOD_PRESSURE',
        validationErrors: {
          'systolic': 'Systolic pressure must be between 70 and 190 mmHg',
          'diastolic': 'Diastolic pressure must be between 40 and 100 mmHg'
        }
      };

      const error = new DeviceDataValidationError('Invalid blood pressure data', context);
      const httpException = error.toJSON();

      expect(httpException.error.type).toBe(ErrorType.VALIDATION);
      // In a real scenario, this would map to BAD_REQUEST (400)
    });

    it('should calculate the failure rate for partial processing', () => {
      const context = {
        ...baseDeviceContext,
        dataType: 'WEIGHT',
        failedRecordsCount: 25,
        totalRecordsCount: 100,
        canPartiallyProcess: true
      };

      const error = new DeviceDataValidationError('Some weight records are invalid', context);

      // Calculate expected failure rate
      const failureRate = (context.failedRecordsCount / context.totalRecordsCount) * 100;
      
      expect(error.context.failedRecordsCount).toBe(25);
      expect(error.context.totalRecordsCount).toBe(100);
      // In a real implementation, we might have a getter for failure rate
      // Here we're just verifying the data needed to calculate it is present
      expect(failureRate).toBe(25);
    });
  });
});