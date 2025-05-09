/**
 * @file errors.ts
 * @description Custom error classes for versioning-related failures in the AUSTA SuperApp.
 * This module provides structured error information for improved debugging and error handling
 * of versioning issues across all journeys.
 */

import { BaseError, ErrorType, ErrorRecoveryStrategy } from '@austa/errors';
import { EventVersion, VersionCompatibilityLevel } from './types';

/**
 * Error codes for versioning-related errors
 */
export enum VersioningErrorCode {
  // Version detection errors
  VERSION_DETECTION_FAILED = 'EVENTS-VERSION-001',
  MISSING_VERSION_FIELD = 'EVENTS-VERSION-002',
  INVALID_VERSION_FORMAT = 'EVENTS-VERSION-003',
  UNSUPPORTED_VERSION = 'EVENTS-VERSION-004',
  
  // Version compatibility errors
  INCOMPATIBLE_VERSIONS = 'EVENTS-VERSION-101',
  VERSION_MISMATCH = 'EVENTS-VERSION-102',
  VERSION_TOO_OLD = 'EVENTS-VERSION-103',
  VERSION_TOO_NEW = 'EVENTS-VERSION-104',
  
  // Migration errors
  MIGRATION_FAILED = 'EVENTS-VERSION-201',
  MIGRATION_PATH_NOT_FOUND = 'EVENTS-VERSION-202',
  MIGRATION_VALIDATION_FAILED = 'EVENTS-VERSION-203',
  MIGRATION_ROLLBACK_FAILED = 'EVENTS-VERSION-204',
  
  // Transformation errors
  TRANSFORMATION_FAILED = 'EVENTS-VERSION-301',
  FIELD_TRANSFORMATION_FAILED = 'EVENTS-VERSION-302',
  SCHEMA_VALIDATION_FAILED = 'EVENTS-VERSION-303',
  TRANSFORMATION_NOT_IMPLEMENTED = 'EVENTS-VERSION-304'
}

/**
 * Base class for all versioning-related errors
 */
export abstract class VersioningError extends BaseError {
  constructor(
    message: string,
    code: VersioningErrorCode,
    details?: Record<string, any>
  ) {
    super(message, ErrorType.TECHNICAL, code, details);
  }
}

/**
 * Error thrown when version detection fails
 */
export class VersionDetectionError extends VersioningError {
  constructor(
    message: string = 'Failed to detect event version',
    code: VersioningErrorCode = VersioningErrorCode.VERSION_DETECTION_FAILED,
    details?: Record<string, any>
  ) {
    super(message, code, details);
  }

  /**
   * Create an error for missing version field
   */
  static missingVersionField(fieldName: string, eventType?: string): VersionDetectionError {
    return new VersionDetectionError(
      `Missing required version field '${fieldName}'${eventType ? ` for event type '${eventType}'` : ''}`,
      VersioningErrorCode.MISSING_VERSION_FIELD,
      { fieldName, eventType }
    );
  }

  /**
   * Create an error for invalid version format
   */
  static invalidVersionFormat(version: string, expectedFormat: string): VersionDetectionError {
    return new VersionDetectionError(
      `Invalid version format '${version}', expected format: ${expectedFormat}`,
      VersioningErrorCode.INVALID_VERSION_FORMAT,
      { version, expectedFormat }
    );
  }

  /**
   * Create an error for unsupported version
   */
  static unsupportedVersion(version: EventVersion, supportedVersions: EventVersion[]): VersionDetectionError {
    const versionStr = `${version.major}.${version.minor}.${version.patch}`;
    const supportedVersionsStr = supportedVersions.map(v => `${v.major}.${v.minor}.${v.patch}`).join(', ');
    
    return new VersionDetectionError(
      `Unsupported version ${versionStr}. Supported versions: ${supportedVersionsStr}`,
      VersioningErrorCode.UNSUPPORTED_VERSION,
      { version, supportedVersions }
    );
  }
}

/**
 * Error thrown when versions are incompatible
 */
export class VersionCompatibilityError extends VersioningError {
  constructor(
    message: string = 'Incompatible event versions',
    code: VersioningErrorCode = VersioningErrorCode.INCOMPATIBLE_VERSIONS,
    details?: Record<string, any>
  ) {
    super(message, code, details);
  }

  /**
   * Create an error for version mismatch
   */
  static versionMismatch(
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    compatibilityLevel: VersionCompatibilityLevel
  ): VersionCompatibilityError {
    const sourceVersionStr = `${sourceVersion.major}.${sourceVersion.minor}.${sourceVersion.patch}`;
    const targetVersionStr = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
    
    return new VersionCompatibilityError(
      `Version mismatch: source version ${sourceVersionStr} is ${compatibilityLevel.toLowerCase()} with target version ${targetVersionStr}`,
      VersioningErrorCode.VERSION_MISMATCH,
      { sourceVersion, targetVersion, compatibilityLevel }
    );
  }

  /**
   * Create an error for version too old
   */
  static versionTooOld(
    version: EventVersion,
    minimumVersion: EventVersion
  ): VersionCompatibilityError {
    const versionStr = `${version.major}.${version.minor}.${version.patch}`;
    const minimumVersionStr = `${minimumVersion.major}.${minimumVersion.minor}.${minimumVersion.patch}`;
    
    return new VersionCompatibilityError(
      `Version ${versionStr} is too old. Minimum supported version is ${minimumVersionStr}`,
      VersioningErrorCode.VERSION_TOO_OLD,
      { version, minimumVersion }
    );
  }

  /**
   * Create an error for version too new
   */
  static versionTooNew(
    version: EventVersion,
    maximumVersion: EventVersion
  ): VersionCompatibilityError {
    const versionStr = `${version.major}.${version.minor}.${version.patch}`;
    const maximumVersionStr = `${maximumVersion.major}.${maximumVersion.minor}.${maximumVersion.patch}`;
    
    return new VersionCompatibilityError(
      `Version ${versionStr} is too new. Maximum supported version is ${maximumVersionStr}`,
      VersioningErrorCode.VERSION_TOO_NEW,
      { version, maximumVersion }
    );
  }
}

/**
 * Error thrown when event migration fails
 */
export class MigrationError extends VersioningError {
  constructor(
    message: string = 'Event migration failed',
    code: VersioningErrorCode = VersioningErrorCode.MIGRATION_FAILED,
    details?: Record<string, any>
  ) {
    super(message, code, details);
  }

  /**
   * Create an error for migration path not found
   */
  static migrationPathNotFound(
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    eventType?: string
  ): MigrationError {
    const sourceVersionStr = `${sourceVersion.major}.${sourceVersion.minor}.${sourceVersion.patch}`;
    const targetVersionStr = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
    
    return new MigrationError(
      `No migration path found from version ${sourceVersionStr} to ${targetVersionStr}${eventType ? ` for event type '${eventType}'` : ''}`,
      VersioningErrorCode.MIGRATION_PATH_NOT_FOUND,
      { sourceVersion, targetVersion, eventType }
    );
  }

  /**
   * Create an error for migration validation failure
   */
  static validationFailed(
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    validationErrors: string[],
    eventType?: string
  ): MigrationError {
    const sourceVersionStr = `${sourceVersion.major}.${sourceVersion.minor}.${sourceVersion.patch}`;
    const targetVersionStr = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
    
    return new MigrationError(
      `Migration validation failed from version ${sourceVersionStr} to ${targetVersionStr}${eventType ? ` for event type '${eventType}'` : ''}`,
      VersioningErrorCode.MIGRATION_VALIDATION_FAILED,
      { sourceVersion, targetVersion, validationErrors, eventType }
    );
  }

  /**
   * Create an error for migration rollback failure
   */
  static rollbackFailed(
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    originalError: Error,
    rollbackError: Error
  ): MigrationError {
    const sourceVersionStr = `${sourceVersion.major}.${sourceVersion.minor}.${sourceVersion.patch}`;
    const targetVersionStr = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
    
    return new MigrationError(
      `Migration rollback failed from version ${sourceVersionStr} to ${targetVersionStr}. Original error: ${originalError.message}. Rollback error: ${rollbackError.message}`,
      VersioningErrorCode.MIGRATION_ROLLBACK_FAILED,
      { sourceVersion, targetVersion, originalError, rollbackError }
    );
  }
}

/**
 * Error thrown when event transformation fails
 */
export class TransformationError extends VersioningError {
  constructor(
    message: string = 'Event transformation failed',
    code: VersioningErrorCode = VersioningErrorCode.TRANSFORMATION_FAILED,
    details?: Record<string, any>
  ) {
    super(message, code, details);
  }

  /**
   * Create an error for field transformation failure
   */
  static fieldTransformationFailed(
    fieldName: string,
    sourceValue: any,
    targetType: string,
    error: Error
  ): TransformationError {
    return new TransformationError(
      `Failed to transform field '${fieldName}' from ${typeof sourceValue} to ${targetType}: ${error.message}`,
      VersioningErrorCode.FIELD_TRANSFORMATION_FAILED,
      { fieldName, sourceValue, targetType, error }
    );
  }

  /**
   * Create an error for schema validation failure
   */
  static schemaValidationFailed(
    validationErrors: string[],
    eventType?: string,
    version?: EventVersion
  ): TransformationError {
    const versionStr = version ? `${version.major}.${version.minor}.${version.patch}` : 'unknown';
    
    return new TransformationError(
      `Schema validation failed${eventType ? ` for event type '${eventType}'` : ''} (version ${versionStr})`,
      VersioningErrorCode.SCHEMA_VALIDATION_FAILED,
      { validationErrors, eventType, version }
    );
  }

  /**
   * Create an error for transformation not implemented
   */
  static transformationNotImplemented(
    sourceVersion: EventVersion,
    targetVersion: EventVersion,
    eventType: string
  ): TransformationError {
    const sourceVersionStr = `${sourceVersion.major}.${sourceVersion.minor}.${sourceVersion.patch}`;
    const targetVersionStr = `${targetVersion.major}.${targetVersion.minor}.${targetVersion.patch}`;
    
    return new TransformationError(
      `Transformation not implemented from version ${sourceVersionStr} to ${targetVersionStr} for event type '${eventType}'`,
      VersioningErrorCode.TRANSFORMATION_NOT_IMPLEMENTED,
      { sourceVersion, targetVersion, eventType }
    );
  }
}

/**
 * Helper function to format a version object as a string
 */
export function formatVersion(version: EventVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Helper function to get error recovery strategy for versioning errors
 */
export function getVersioningErrorRecoveryStrategy(error: VersioningError): ErrorRecoveryStrategy {
  // Determine recovery strategy based on error code
  switch (error.code) {
    // Retryable errors
    case VersioningErrorCode.TRANSFORMATION_FAILED:
    case VersioningErrorCode.FIELD_TRANSFORMATION_FAILED:
      return ErrorRecoveryStrategy.RETRY;
    
    // Fallback errors (can use default or previous version)
    case VersioningErrorCode.VERSION_TOO_NEW:
    case VersioningErrorCode.UNSUPPORTED_VERSION:
      return ErrorRecoveryStrategy.FALLBACK;
    
    // Circuit breaker errors (prevent cascading failures)
    case VersioningErrorCode.MIGRATION_FAILED:
    case VersioningErrorCode.MIGRATION_VALIDATION_FAILED:
      return ErrorRecoveryStrategy.CIRCUIT_BREAKER;
    
    // Non-recoverable errors
    case VersioningErrorCode.VERSION_DETECTION_FAILED:
    case VersioningErrorCode.MISSING_VERSION_FIELD:
    case VersioningErrorCode.INVALID_VERSION_FORMAT:
    case VersioningErrorCode.INCOMPATIBLE_VERSIONS:
    case VersioningErrorCode.VERSION_MISMATCH:
    case VersioningErrorCode.VERSION_TOO_OLD:
    case VersioningErrorCode.MIGRATION_PATH_NOT_FOUND:
    case VersioningErrorCode.MIGRATION_ROLLBACK_FAILED:
    case VersioningErrorCode.SCHEMA_VALIDATION_FAILED:
    case VersioningErrorCode.TRANSFORMATION_NOT_IMPLEMENTED:
    default:
      return ErrorRecoveryStrategy.NONE;
  }
}