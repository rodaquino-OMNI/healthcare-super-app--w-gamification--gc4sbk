/**
 * @file errors.ts
 * @description Defines custom error classes for versioning-related failures
 * 
 * This file provides specialized error classes for handling versioning-related
 * errors in the event system, including version detection, compatibility,
 * migration, and transformation errors. These errors integrate with the global
 * error handling framework and provide detailed context for troubleshooting.
 */

import { BaseError, ErrorType, JourneyType } from '@austa/errors';

/**
 * Error code prefix for versioning-related errors
 */
const VERSIONING_ERROR_PREFIX = 'EVENT_VERSION_';

/**
 * Error codes for versioning-related errors
 */
export const VERSIONING_ERROR_CODES = {
  /** Failed to detect the version of an event */
  DETECTION_FAILED: `${VERSIONING_ERROR_PREFIX}DETECTION_FAILED`,
  /** Event version is not compatible with the expected version */
  INCOMPATIBLE_VERSION: `${VERSIONING_ERROR_PREFIX}INCOMPATIBLE_VERSION`,
  /** Failed to migrate an event from one version to another */
  MIGRATION_FAILED: `${VERSIONING_ERROR_PREFIX}MIGRATION_FAILED`,
  /** Failed to transform an event between versions */
  TRANSFORMATION_FAILED: `${VERSIONING_ERROR_PREFIX}TRANSFORMATION_FAILED`,
  /** Event version is not supported */
  UNSUPPORTED_VERSION: `${VERSIONING_ERROR_PREFIX}UNSUPPORTED_VERSION`,
  /** Missing version information in the event */
  MISSING_VERSION: `${VERSIONING_ERROR_PREFIX}MISSING_VERSION`,
  /** Invalid version format */
  INVALID_VERSION_FORMAT: `${VERSIONING_ERROR_PREFIX}INVALID_VERSION_FORMAT`,
  /** Version downgrade is not allowed */
  DOWNGRADE_NOT_ALLOWED: `${VERSIONING_ERROR_PREFIX}DOWNGRADE_NOT_ALLOWED`,
};

/**
 * Default error messages for versioning-related errors
 */
const DEFAULT_ERROR_MESSAGES = {
  [VERSIONING_ERROR_CODES.DETECTION_FAILED]: 'Failed to detect event version',
  [VERSIONING_ERROR_CODES.INCOMPATIBLE_VERSION]: 'Event version is not compatible with the expected version',
  [VERSIONING_ERROR_CODES.MIGRATION_FAILED]: 'Failed to migrate event between versions',
  [VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED]: 'Failed to transform event between versions',
  [VERSIONING_ERROR_CODES.UNSUPPORTED_VERSION]: 'Event version is not supported',
  [VERSIONING_ERROR_CODES.MISSING_VERSION]: 'Missing version information in the event',
  [VERSIONING_ERROR_CODES.INVALID_VERSION_FORMAT]: 'Invalid version format',
  [VERSIONING_ERROR_CODES.DOWNGRADE_NOT_ALLOWED]: 'Version downgrade is not allowed',
};

/**
 * Base class for all versioning-related errors
 */
export class VersioningError extends BaseError {
  /**
   * Creates a new VersioningError instance
   * 
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    journey?: JourneyType,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      code,
      {
        component: 'event-versioning',
        journey,
        isTransient: false,
      },
      details,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersioningError.prototype);
  }
}

/**
 * Error thrown when version detection fails
 */
export class VersionDetectionError extends VersioningError {
  /**
   * Creates a new VersionDetectionError instance
   * 
   * @param message - Custom error message (optional)
   * @param details - Additional error details
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   */
  constructor(
    message = DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.DETECTION_FAILED],
    details?: any,
    journey?: JourneyType,
    cause?: Error
  ) {
    super(
      message,
      VERSIONING_ERROR_CODES.DETECTION_FAILED,
      details,
      journey,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersionDetectionError.prototype);
  }

  /**
   * Creates a VersionDetectionError for missing version information
   * 
   * @param eventId - ID of the event with missing version
   * @param journey - Journey type where the error occurred
   * @returns A new VersionDetectionError instance
   */
  static missingVersion(eventId: string, journey?: JourneyType): VersionDetectionError {
    return new VersionDetectionError(
      DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.MISSING_VERSION],
      { eventId },
      journey
    );
  }

  /**
   * Creates a VersionDetectionError for invalid version format
   * 
   * @param version - The invalid version string
   * @param expectedFormat - The expected version format
   * @param journey - Journey type where the error occurred
   * @returns A new VersionDetectionError instance
   */
  static invalidFormat(
    version: string,
    expectedFormat: string,
    journey?: JourneyType
  ): VersionDetectionError {
    return new VersionDetectionError(
      DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.INVALID_VERSION_FORMAT],
      { version, expectedFormat },
      journey
    );
  }
}

/**
 * Error thrown when event versions are incompatible
 */
export class IncompatibleVersionError extends VersioningError {
  /**
   * Creates a new IncompatibleVersionError instance
   * 
   * @param message - Custom error message (optional)
   * @param details - Additional error details
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   */
  constructor(
    message = DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.INCOMPATIBLE_VERSION],
    details?: any,
    journey?: JourneyType,
    cause?: Error
  ) {
    super(
      message,
      VERSIONING_ERROR_CODES.INCOMPATIBLE_VERSION,
      details,
      journey,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IncompatibleVersionError.prototype);
  }

  /**
   * Creates an IncompatibleVersionError for unsupported versions
   * 
   * @param version - The unsupported version
   * @param supportedVersions - List of supported versions
   * @param journey - Journey type where the error occurred
   * @returns A new IncompatibleVersionError instance
   */
  static unsupportedVersion(
    version: string,
    supportedVersions: string[],
    journey?: JourneyType
  ): IncompatibleVersionError {
    return new IncompatibleVersionError(
      DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.UNSUPPORTED_VERSION],
      { version, supportedVersions },
      journey
    );
  }

  /**
   * Creates an IncompatibleVersionError for version mismatch
   * 
   * @param actualVersion - The actual version of the event
   * @param expectedVersion - The expected version
   * @param eventType - The type of event
   * @param journey - Journey type where the error occurred
   * @returns A new IncompatibleVersionError instance
   */
  static versionMismatch(
    actualVersion: string,
    expectedVersion: string,
    eventType: string,
    journey?: JourneyType
  ): IncompatibleVersionError {
    return new IncompatibleVersionError(
      `Event version mismatch: expected ${expectedVersion} but got ${actualVersion} for event type ${eventType}`,
      { actualVersion, expectedVersion, eventType },
      journey
    );
  }
}

/**
 * Error thrown when event migration between versions fails
 */
export class VersionMigrationError extends VersioningError {
  /**
   * Creates a new VersionMigrationError instance
   * 
   * @param message - Custom error message (optional)
   * @param details - Additional error details
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   */
  constructor(
    message = DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.MIGRATION_FAILED],
    details?: any,
    journey?: JourneyType,
    cause?: Error
  ) {
    super(
      message,
      VERSIONING_ERROR_CODES.MIGRATION_FAILED,
      details,
      journey,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersionMigrationError.prototype);
  }

  /**
   * Creates a VersionMigrationError for missing migration path
   * 
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param eventType - The type of event
   * @param journey - Journey type where the error occurred
   * @returns A new VersionMigrationError instance
   */
  static noMigrationPath(
    fromVersion: string,
    toVersion: string,
    eventType: string,
    journey?: JourneyType
  ): VersionMigrationError {
    return new VersionMigrationError(
      `No migration path found from version ${fromVersion} to ${toVersion} for event type ${eventType}`,
      { fromVersion, toVersion, eventType },
      journey
    );
  }

  /**
   * Creates a VersionMigrationError for validation failure after migration
   * 
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param validationErrors - Validation errors
   * @param journey - Journey type where the error occurred
   * @returns A new VersionMigrationError instance
   */
  static validationFailed(
    fromVersion: string,
    toVersion: string,
    validationErrors: any[],
    journey?: JourneyType
  ): VersionMigrationError {
    return new VersionMigrationError(
      `Validation failed after migrating from version ${fromVersion} to ${toVersion}`,
      { fromVersion, toVersion, validationErrors },
      journey
    );
  }

  /**
   * Creates a VersionMigrationError for downgrade not allowed
   * 
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param eventType - The type of event
   * @param journey - Journey type where the error occurred
   * @returns A new VersionMigrationError instance
   */
  static downgradeNotAllowed(
    fromVersion: string,
    toVersion: string,
    eventType: string,
    journey?: JourneyType
  ): VersionMigrationError {
    return new VersionMigrationError(
      DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.DOWNGRADE_NOT_ALLOWED],
      { fromVersion, toVersion, eventType },
      journey
    );
  }
}

/**
 * Error thrown when event transformation between versions fails
 */
export class VersionTransformationError extends VersioningError {
  /**
   * Creates a new VersionTransformationError instance
   * 
   * @param message - Custom error message (optional)
   * @param details - Additional error details
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   */
  constructor(
    message = DEFAULT_ERROR_MESSAGES[VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED],
    details?: any,
    journey?: JourneyType,
    cause?: Error
  ) {
    super(
      message,
      VERSIONING_ERROR_CODES.TRANSFORMATION_FAILED,
      details,
      journey,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VersionTransformationError.prototype);
  }

  /**
   * Creates a VersionTransformationError for field transformation failure
   * 
   * @param field - The field that failed to transform
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   * @returns A new VersionTransformationError instance
   */
  static fieldTransformationFailed(
    field: string,
    fromVersion: string,
    toVersion: string,
    journey?: JourneyType,
    cause?: Error
  ): VersionTransformationError {
    return new VersionTransformationError(
      `Failed to transform field '${field}' from version ${fromVersion} to ${toVersion}`,
      { field, fromVersion, toVersion },
      journey,
      cause
    );
  }

  /**
   * Creates a VersionTransformationError for schema transformation failure
   * 
   * @param schemaName - The name of the schema
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param journey - Journey type where the error occurred
   * @param cause - Original error that caused this exception
   * @returns A new VersionTransformationError instance
   */
  static schemaTransformationFailed(
    schemaName: string,
    fromVersion: string,
    toVersion: string,
    journey?: JourneyType,
    cause?: Error
  ): VersionTransformationError {
    return new VersionTransformationError(
      `Failed to transform schema '${schemaName}' from version ${fromVersion} to ${toVersion}`,
      { schemaName, fromVersion, toVersion },
      journey,
      cause
    );
  }

  /**
   * Creates a VersionTransformationError for missing transformer
   * 
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param eventType - The type of event
   * @param journey - Journey type where the error occurred
   * @returns A new VersionTransformationError instance
   */
  static missingTransformer(
    fromVersion: string,
    toVersion: string,
    eventType: string,
    journey?: JourneyType
  ): VersionTransformationError {
    return new VersionTransformationError(
      `No transformer found for converting from version ${fromVersion} to ${toVersion} for event type ${eventType}`,
      { fromVersion, toVersion, eventType },
      journey
    );
  }
}