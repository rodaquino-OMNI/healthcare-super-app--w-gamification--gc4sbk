import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Base interface for device error context information.
 * Provides common properties for all device-related errors.
 */
export interface DeviceErrorContext {
  /** Unique identifier of the device */
  deviceId?: string;
  /** Type or model of the device */
  deviceType?: string;
  /** Manufacturer of the device */
  manufacturer?: string;
  /** Current connection state of the device */
  connectionState?: string;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** Additional device-specific details */
  details?: Record<string, any>;
}

/**
 * Base class for all device-related errors in the Health journey.
 * Extends AppException with device-specific context information.
 */
export abstract class DeviceException extends AppException {
  /**
   * Creates a new DeviceException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code with HEALTH_DEVICES_ prefix
   * @param context - Device-specific context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly context: DeviceErrorContext,
    cause?: Error
  ) {
    super(message, type, code, context, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DeviceException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with device context.
   * Overrides the base toJSON method to include device-specific information.
   * 
   * @returns JSON object with standardized error structure and device context
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        context: this.context
      }
    };
  }
}

/**
 * Error thrown when a device connection attempt fails.
 * Covers pairing failures, connection timeouts, and authentication issues.
 */
export class DeviceConnectionFailureError extends DeviceException {
  /**
   * Creates a new DeviceConnectionFailureError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Device connection context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: DeviceErrorContext & {
      /** Reason for the connection failure */
      failureReason?: 'PAIRING_FAILED' | 'CONNECTION_TIMEOUT' | 'AUTHENTICATION_FAILED' | 'DEVICE_UNREACHABLE' | 'BLUETOOTH_DISABLED' | string;
      /** Number of connection attempts made */
      attemptCount?: number;
      /** Connection protocol being used */
      protocol?: 'BLUETOOTH' | 'WIFI' | 'USB' | string;
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_DEVICES_CONNECTION_FAILURE',
      {
        timestamp: context.timestamp || new Date(),
        ...context
      },
      cause
    );
  }
}

/**
 * Error thrown when device synchronization fails.
 * Covers data transfer problems, format inconsistencies, and sync interruptions.
 */
export class SynchronizationFailedError extends DeviceException {
  /**
   * Creates a new SynchronizationFailedError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Synchronization context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: DeviceErrorContext & {
      /** Reason for the synchronization failure */
      failureReason?: 'DATA_FORMAT_ERROR' | 'TRANSFER_INTERRUPTED' | 'INSUFFICIENT_STORAGE' | 'DEVICE_DISCONNECTED' | string;
      /** Type of data being synchronized */
      dataType?: 'STEPS' | 'HEART_RATE' | 'SLEEP' | 'BLOOD_PRESSURE' | 'WEIGHT' | 'ALL' | string;
      /** Timestamp when synchronization started */
      syncStartTime?: Date;
      /** Amount of data transferred before failure (in bytes or records) */
      transferredAmount?: number;
      /** Total amount of data to be transferred (in bytes or records) */
      totalAmount?: number;
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_DEVICES_SYNC_FAILURE',
      {
        timestamp: context.timestamp || new Date(),
        ...context
      },
      cause
    );
  }
}

/**
 * Error thrown when a device is not compatible with the system.
 * Covers unsupported devices, firmware version mismatches, and API incompatibilities.
 */
export class DeviceCompatibilityError extends DeviceException {
  /**
   * Creates a new DeviceCompatibilityError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Compatibility context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: DeviceErrorContext & {
      /** Reason for the compatibility issue */
      incompatibilityReason?: 'UNSUPPORTED_DEVICE' | 'FIRMWARE_VERSION_MISMATCH' | 'API_INCOMPATIBILITY' | 'MISSING_CAPABILITY' | string;
      /** Current firmware version of the device */
      firmwareVersion?: string;
      /** Minimum required firmware version */
      requiredFirmwareVersion?: string;
      /** Features or capabilities that are incompatible */
      incompatibleFeatures?: string[];
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_DEVICES_COMPATIBILITY_ERROR',
      {
        timestamp: context.timestamp || new Date(),
        ...context
      },
      cause
    );
  }
}

/**
 * Error thrown when a device operation fails due to permission issues.
 * Covers missing permissions, revoked access, and insufficient privileges.
 */
export class DevicePermissionError extends DeviceException {
  /**
   * Creates a new DevicePermissionError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Permission context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: DeviceErrorContext & {
      /** Specific permission that is missing or denied */
      permission?: 'BLUETOOTH' | 'LOCATION' | 'STORAGE' | 'BACKGROUND_PROCESSING' | string;
      /** Whether the user explicitly denied the permission */
      userDenied?: boolean;
      /** Whether the permission can be requested again */
      canRequestAgain?: boolean;
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_DEVICES_PERMISSION_ERROR',
      {
        timestamp: context.timestamp || new Date(),
        ...context
      },
      cause
    );
  }
}

/**
 * Error thrown when a device operation times out.
 * Covers connection timeouts, synchronization timeouts, and operation timeouts.
 */
export class DeviceTimeoutError extends DeviceException {
  /**
   * Creates a new DeviceTimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Timeout context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: DeviceErrorContext & {
      /** Type of operation that timed out */
      operationType?: 'CONNECTION' | 'SYNCHRONIZATION' | 'DATA_TRANSFER' | 'COMMAND_EXECUTION' | string;
      /** Duration after which the operation timed out (in milliseconds) */
      timeoutDuration?: number;
      /** Whether the operation can be retried */
      canRetry?: boolean;
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_DEVICES_TIMEOUT_ERROR',
      {
        timestamp: context.timestamp || new Date(),
        ...context
      },
      cause
    );
  }
}

/**
 * Error thrown when device data validation fails.
 * Covers data format errors, invalid values, and missing required fields.
 */
export class DeviceDataValidationError extends DeviceException {
  /**
   * Creates a new DeviceDataValidationError instance.
   * 
   * @param message - Human-readable error message
   * @param context - Data validation context information
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: DeviceErrorContext & {
      /** Type of data that failed validation */
      dataType?: 'STEPS' | 'HEART_RATE' | 'SLEEP' | 'BLOOD_PRESSURE' | 'WEIGHT' | string;
      /** Specific validation errors by field */
      validationErrors?: Record<string, string>;
      /** Whether the data can be partially processed */
      canPartiallyProcess?: boolean;
      /** Number of records that failed validation */
      failedRecordsCount?: number;
      /** Total number of records processed */
      totalRecordsCount?: number;
    },
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_DEVICES_DATA_VALIDATION_ERROR',
      {
        timestamp: context.timestamp || new Date(),
        ...context
      },
      cause
    );
  }
}