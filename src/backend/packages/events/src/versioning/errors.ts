/**
 * @file errors.ts
 * @description Defines custom error classes for versioning-related failures with structured error information
 * for improved debugging and error handling. These error classes integrate with the global error handling
 * framework and provide detailed context for troubleshooting versioning issues.
 */

import { BaseError, ErrorCategory, ErrorType } from '@austa/errors';

/**
 * Error codes specific to event versioning operations
 */
export enum VersioningErrorCode {
  // Version detection errors
  VERSION_DETECTION_FAILED = 'EVT_VER_001',
  VERSION_FIELD_MISSING = 'EVT_VER_002',
  VERSION_FORMAT_INVALID = 'EVT_VER_003',
  
  // Version compatibility errors
  VERSION_INCOMPATIBLE = 'EVT_VER_101',
  VERSION_UNSUPPORTED = 'EVT_VER_102',
  VERSION_TOO_OLD = 'EVT_VER_103',
  VERSION_TOO_NEW = 'EVT_VER_104',
  
  // Migration errors
  MIGRATION_PATH_NOT_FOUND = 'EVT_VER_201',
  MIGRATION_FAILED = 'EVT_VER_202',
  MIGRATION_VALIDATION_FAILED = 'EVT_VER_203',
  
  // Transformation errors
  TRANSFORMATION_FAILED = 'EVT_VER_301',
  TRANSFORMATION_SCHEMA_INVALID = 'EVT_VER_302',
  TRANSFORMATION_FIELD_MISSING = 'EVT_VER_303',
}

/**
 * Context data specific to versioning errors
 */
export interface VersioningErrorContext {
  eventId?: string;
  eventType?: string;
  sourceVersion?: string;
  targetVersion?: string;
  journeyType?: 'health' | 'care' | 'plan' | 'common';
  fieldName?: string;
  schemaPath?: string;
  migrationPath?: string;
  transformationStep?: string;
  [key: string]: any; // Additional context data
}

/**
 * Base class for all versioning-related errors
 */
export class VersioningError extends BaseError {
  constructor(
    code: VersioningErrorCode,
    message: string,
    context?: VersioningErrorContext,
    cause?: Error,
  ) {
    super({
      code,
      message,
      type: ErrorType.TECHNICAL,
      category: ErrorCategory.VERSIONING,
      context,
      cause,
      statusCode: 400, // Default status code for versioning errors
    });
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersioningError.prototype);
    this.name = 'VersioningError';
  }
}

/**
 * Error thrown when version detection fails
 */
export class VersionDetectionError extends VersioningError {
  constructor(
    message: string,
    context?: VersioningErrorContext,
    cause?: Error,
    code: VersioningErrorCode = VersioningErrorCode.VERSION_DETECTION_FAILED,
  ) {
    super(code, message, context, cause);
    Object.setPrototypeOf(this, VersionDetectionError.prototype);
    this.name = 'VersionDetectionError';
  }
  
  /**
   * Creates an error for missing version field
   */
  static fieldMissing(fieldName: string, eventId?: string, eventType?: string): VersionDetectionError {
    return new VersionDetectionError(
      `Version field '${fieldName}' is missing from event`,
      { fieldName, eventId, eventType },
      undefined,
      VersioningErrorCode.VERSION_FIELD_MISSING
    );
  }
  
  /**
   * Creates an error for invalid version format
   */
  static invalidFormat(version: string, eventId?: string, eventType?: string): VersionDetectionError {
    return new VersionDetectionError(
      `Invalid version format: '${version}'. Expected format: major.minor.patch`,
      { sourceVersion: version, eventId, eventType },
      undefined,
      VersioningErrorCode.VERSION_FORMAT_INVALID
    );
  }
}

/**
 * Error thrown when versions are incompatible
 */
export class VersionCompatibilityError extends VersioningError {
  constructor(
    message: string,
    context?: VersioningErrorContext,
    cause?: Error,
    code: VersioningErrorCode = VersioningErrorCode.VERSION_INCOMPATIBLE,
  ) {
    super(code, message, context, cause);
    Object.setPrototypeOf(this, VersionCompatibilityError.prototype);
    this.name = 'VersionCompatibilityError';
  }
  
  /**
   * Creates an error for unsupported version
   */
  static unsupported(version: string, supportedVersions: string[], eventId?: string): VersionCompatibilityError {
    return new VersionCompatibilityError(
      `Version '${version}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
      { sourceVersion: version, eventId },
      undefined,
      VersioningErrorCode.VERSION_UNSUPPORTED
    );
  }
  
  /**
   * Creates an error for version too old
   */
  static tooOld(version: string, minVersion: string, eventId?: string): VersionCompatibilityError {
    return new VersionCompatibilityError(
      `Version '${version}' is too old. Minimum supported version is '${minVersion}'`,
      { sourceVersion: version, targetVersion: minVersion, eventId },
      undefined,
      VersioningErrorCode.VERSION_TOO_OLD
    );
  }
  
  /**
   * Creates an error for version too new
   */
  static tooNew(version: string, maxVersion: string, eventId?: string): VersionCompatibilityError {
    return new VersionCompatibilityError(
      `Version '${version}' is too new. Maximum supported version is '${maxVersion}'`,
      { sourceVersion: version, targetVersion: maxVersion, eventId },
      undefined,
      VersioningErrorCode.VERSION_TOO_NEW
    );
  }
}

/**
 * Error thrown when migration between versions fails
 */
export class MigrationError extends VersioningError {
  constructor(
    message: string,
    context?: VersioningErrorContext,
    cause?: Error,
    code: VersioningErrorCode = VersioningErrorCode.MIGRATION_FAILED,
  ) {
    super(code, message, context, cause);
    Object.setPrototypeOf(this, MigrationError.prototype);
    this.name = 'MigrationError';
  }
  
  /**
   * Creates an error for missing migration path
   */
  static pathNotFound(sourceVersion: string, targetVersion: string, eventType?: string): MigrationError {
    return new MigrationError(
      `No migration path found from version '${sourceVersion}' to '${targetVersion}' for event type '${eventType || 'unknown'}'`,
      { sourceVersion, targetVersion, eventType },
      undefined,
      VersioningErrorCode.MIGRATION_PATH_NOT_FOUND
    );
  }
  
  /**
   * Creates an error for failed validation after migration
   */
  static validationFailed(sourceVersion: string, targetVersion: string, errors: string[], eventId?: string): MigrationError {
    return new MigrationError(
      `Validation failed after migrating from version '${sourceVersion}' to '${targetVersion}': ${errors.join('; ')}`,
      { sourceVersion, targetVersion, eventId, validationErrors: errors },
      undefined,
      VersioningErrorCode.MIGRATION_VALIDATION_FAILED
    );
  }
}

/**
 * Error thrown when transformation between versions fails
 */
export class TransformationError extends VersioningError {
  constructor(
    message: string,
    context?: VersioningErrorContext,
    cause?: Error,
    code: VersioningErrorCode = VersioningErrorCode.TRANSFORMATION_FAILED,
  ) {
    super(code, message, context, cause);
    Object.setPrototypeOf(this, TransformationError.prototype);
    this.name = 'TransformationError';
  }
  
  /**
   * Creates an error for invalid schema during transformation
   */
  static schemaInvalid(schemaPath: string, reason: string, eventId?: string): TransformationError {
    return new TransformationError(
      `Invalid schema at path '${schemaPath}': ${reason}`,
      { schemaPath, eventId },
      undefined,
      VersioningErrorCode.TRANSFORMATION_SCHEMA_INVALID
    );
  }
  
  /**
   * Creates an error for missing required field during transformation
   */
  static fieldMissing(fieldName: string, sourceVersion: string, targetVersion: string, eventId?: string): TransformationError {
    return new TransformationError(
      `Required field '${fieldName}' is missing during transformation from version '${sourceVersion}' to '${targetVersion}'`,
      { fieldName, sourceVersion, targetVersion, eventId },
      undefined,
      VersioningErrorCode.TRANSFORMATION_FIELD_MISSING
    );
  }
  
  /**
   * Creates an error for a specific transformation step failure
   */
  static stepFailed(step: string, sourceVersion: string, targetVersion: string, reason: string, eventId?: string): TransformationError {
    return new TransformationError(
      `Transformation step '${step}' failed when converting from version '${sourceVersion}' to '${targetVersion}': ${reason}`,
      { transformationStep: step, sourceVersion, targetVersion, eventId },
      undefined,
      VersioningErrorCode.TRANSFORMATION_FAILED
    );
  }
}

/**
 * Helper function to create the appropriate versioning error based on the error code
 */
export function createVersioningError(
  code: VersioningErrorCode,
  message: string,
  context?: VersioningErrorContext,
  cause?: Error,
): VersioningError {
  switch (code) {
    case VersioningErrorCode.VERSION_DETECTION_FAILED:
    case VersioningErrorCode.VERSION_FIELD_MISSING:
    case VersioningErrorCode.VERSION_FORMAT_INVALID:
      return new VersionDetectionError(message, context, cause, code);
      
    case VersioningErrorCode.VERSION_INCOMPATIBLE:
    case VersioningErrorCode.VERSION_UNSUPPORTED:
    case VersioningErrorCode.VERSION_TOO_OLD:
    case VersioningErrorCode.VERSION_TOO_NEW:
      return new VersionCompatibilityError(message, context, cause, code);
      
    case VersioningErrorCode.MIGRATION_PATH_NOT_FOUND:
    case VersioningErrorCode.MIGRATION_FAILED:
    case VersioningErrorCode.MIGRATION_VALIDATION_FAILED:
      return new MigrationError(message, context, cause, code);
      
    case VersioningErrorCode.TRANSFORMATION_FAILED:
    case VersioningErrorCode.TRANSFORMATION_SCHEMA_INVALID:
    case VersioningErrorCode.TRANSFORMATION_FIELD_MISSING:
      return new TransformationError(message, context, cause, code);
      
    default:
      return new VersioningError(code, message, context, cause);
  }
}