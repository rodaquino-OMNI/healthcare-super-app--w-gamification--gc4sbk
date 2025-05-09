/**
 * @file Health Journey Device Integration Error Classes
 * @description Specialized error classes for device synchronization and integration within the Health journey
 */

import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';
import { ConnectionStatus, DeviceType } from '../../../../interfaces/journey/health/device-connection.interface';

/**
 * Base interface for device error context
 */
export interface DeviceErrorContext {
  deviceId?: string;
  deviceType?: DeviceType;
  connectionStatus?: ConnectionStatus;
  recordId?: string;
  timestamp?: Date;
}

/**
 * Extended context for synchronization errors
 */
export interface SyncErrorContext extends DeviceErrorContext {
  lastSuccessfulSync?: Date;
  syncAttemptTimestamp?: Date;
  dataPoints?: number;
  errorDetails?: string;
}

/**
 * Base class for all device-related errors in the Health journey
 */
export abstract class HealthDeviceError extends AppException {
  /**
   * Creates a new HealthDeviceError instance
   * 
   * @param message - Human-readable error message
   * @param code - Specific error code with HEALTH_DEVICES_ prefix
   * @param type - Type of error from ErrorType enum
   * @param context - Device-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    type: ErrorType,
    public readonly context: DeviceErrorContext,
    cause?: Error
  ) {
    super(message, type, code, context, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HealthDeviceError.prototype);
  }

  /**
   * Returns a JSON representation of the exception with device context
   * @returns JSON object with standardized error structure including device context
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        details: this.context
      }
    };
  }
}

/**
 * Error thrown when a device connection attempt fails
 */
export class DeviceConnectionFailureError extends HealthDeviceError {
  /**
   * Creates a new DeviceConnectionFailureError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to connect to device',
    context: DeviceErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_CONNECTION_FAILURE',
      ErrorType.EXTERNAL,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device pairing process fails
 */
export class DevicePairingFailureError extends HealthDeviceError {
  /**
   * Creates a new DevicePairingFailureError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to pair with device',
    context: DeviceErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_PAIRING_FAILURE',
      ErrorType.EXTERNAL,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device authentication fails
 */
export class DeviceAuthenticationError extends HealthDeviceError {
  /**
   * Creates a new DeviceAuthenticationError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Device authentication failed',
    context: DeviceErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_AUTHENTICATION_FAILURE',
      ErrorType.EXTERNAL,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device synchronization fails
 */
export class SynchronizationFailedError extends HealthDeviceError {
  /**
   * Creates a new SynchronizationFailedError instance
   * 
   * @param message - Human-readable error message
   * @param context - Synchronization-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Failed to synchronize device data',
    context: SyncErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_SYNC_FAILURE',
      ErrorType.EXTERNAL,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device data format is invalid or incompatible
 */
export class DataFormatError extends HealthDeviceError {
  /**
   * Creates a new DataFormatError instance
   * 
   * @param message - Human-readable error message
   * @param context - Synchronization-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Invalid data format received from device',
    context: SyncErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_DATA_FORMAT_ERROR',
      ErrorType.VALIDATION,
      context,
      cause
    );
  }
}

/**
 * Error thrown when data transfer from device fails
 */
export class DataTransferError extends HealthDeviceError {
  /**
   * Creates a new DataTransferError instance
   * 
   * @param message - Human-readable error message
   * @param context - Synchronization-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Data transfer from device failed',
    context: SyncErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_DATA_TRANSFER_ERROR',
      ErrorType.EXTERNAL,
      context,
      cause
    );
  }
}

/**
 * Error thrown when an unsupported device is detected
 */
export class UnsupportedDeviceError extends HealthDeviceError {
  /**
   * Creates a new UnsupportedDeviceError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Device type is not supported',
    context: DeviceErrorContext,
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_UNSUPPORTED_DEVICE',
      ErrorType.BUSINESS,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device firmware/software version is incompatible
 */
export class DeviceVersionMismatchError extends HealthDeviceError {
  /**
   * Creates a new DeviceVersionMismatchError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context with version information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Device version is incompatible',
    context: DeviceErrorContext & { currentVersion?: string, requiredVersion?: string },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_VERSION_MISMATCH',
      ErrorType.BUSINESS,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device connection is lost during operation
 */
export class DeviceConnectionLostError extends HealthDeviceError {
  /**
   * Creates a new DeviceConnectionLostError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Connection to device was lost',
    context: DeviceErrorContext & { lastActiveTimestamp?: Date },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_CONNECTION_LOST',
      ErrorType.EXTERNAL,
      context,
      cause
    );
  }
}

/**
 * Error thrown when device has reached maximum connection attempts
 */
export class MaxConnectionAttemptsError extends HealthDeviceError {
  /**
   * Creates a new MaxConnectionAttemptsError instance
   * 
   * @param message - Human-readable error message
   * @param context - Device-specific error context with attempt information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string = 'Maximum connection attempts reached',
    context: DeviceErrorContext & { attempts?: number, maxAttempts?: number },
    cause?: Error
  ) {
    super(
      message,
      'HEALTH_DEVICES_MAX_ATTEMPTS_REACHED',
      ErrorType.BUSINESS,
      context,
      cause
    );
  }
}