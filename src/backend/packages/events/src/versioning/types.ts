/**
 * @file types.ts
 * @description Type definitions for event versioning in the AUSTA SuperApp.
 * This module provides the core types used for semantic versioning of event schemas,
 * enabling backward compatibility and graceful schema evolution.
 */

/**
 * Represents a semantic version for event schemas
 */
export interface EventVersion {
  /** Major version - incremented for breaking changes */
  major: number;
  /** Minor version - incremented for backward-compatible feature additions */
  minor: number;
  /** Patch version - incremented for backward-compatible bug fixes */
  patch: number;
}

/**
 * Represents a versioned event with explicit version information
 */
export interface VersionedEvent<T = any> {
  /** The event type identifier */
  type: string;
  /** The schema version in semantic versioning format */
  version: EventVersion;
  /** The event payload */
  payload: T;
  /** Optional metadata for the event */
  metadata?: Record<string, any>;
}

/**
 * Represents a strategy for handling version compatibility
 */
export interface VersionCompatibilityStrategy {
  /** Check if two versions are compatible */
  isCompatible(version1: EventVersion, version2: EventVersion): boolean;
  /** Find the best compatible version from a list of available versions */
  findBestCompatibleVersion(targetVersion: EventVersion, availableVersions: EventVersion[]): EventVersion | undefined;
  /** Get compatibility level between two versions */
  getCompatibilityLevel(version1: EventVersion, version2: EventVersion): VersionCompatibilityLevel;
}

/**
 * Compatibility level between two event versions
 */
export enum VersionCompatibilityLevel {
  /** Versions are incompatible */
  INCOMPATIBLE = 'INCOMPATIBLE',
  /** Versions are backward compatible (new schema can read old data) */
  BACKWARD = 'BACKWARD',
  /** Versions are forward compatible (old schema can read new data) */
  FORWARD = 'FORWARD',
  /** Versions are fully compatible (both backward and forward) */
  FULL = 'FULL',
  /** Versions are identical */
  IDENTICAL = 'IDENTICAL'
}

/**
 * Options for version migration
 */
export interface VersionMigrationOptions {
  /** Whether to validate the migrated event */
  validate?: boolean;
  /** Whether to throw an error if migration fails */
  throwOnError?: boolean;
  /** Custom error handler for migration errors */
  errorHandler?: (error: Error, event: any, sourceVersion: EventVersion, targetVersion: EventVersion) => any;
}

/**
 * Result of a version migration operation
 */
export interface VersionMigrationResult<T = any> {
  /** Whether the migration was successful */
  success: boolean;
  /** The migrated event (only present if migration was successful) */
  event?: T;
  /** Migration errors (only present if migration failed) */
  errors?: string[];
  /** The source version */
  sourceVersion: EventVersion;
  /** The target version */
  targetVersion: EventVersion;
  /** Whether the event was already compatible and didn't need migration */
  alreadyCompatible?: boolean;
}

/**
 * Function signature for event migration between versions
 */
export type VersionMigrationFn<T = any, U = any> = (
  event: T,
  sourceVersion: EventVersion,
  targetVersion: EventVersion
) => U;

/**
 * Registry entry for a version migration function
 */
export interface VersionMigrationEntry<T = any, U = any> {
  /** The source version range */
  sourceVersionRange: VersionRange;
  /** The target version range */
  targetVersionRange: VersionRange;
  /** The migration function */
  migrationFn: VersionMigrationFn<T, U>;
  /** Optional description of the migration */
  description?: string;
}

/**
 * Represents a version range for compatibility checking
 */
export interface VersionRange {
  /** Minimum version (inclusive) */
  min: EventVersion;
  /** Maximum version (inclusive) */
  max: EventVersion;
}

/**
 * Options for creating a versioned event
 */
export interface CreateVersionedEventOptions {
  /** Whether to include metadata in the event */
  includeMetadata?: boolean;
  /** Additional metadata to include */
  metadata?: Record<string, any>;
  /** Whether to validate the event against its schema */
  validate?: boolean;
}

/**
 * Options for extracting a payload from a versioned event
 */
export interface ExtractPayloadOptions {
  /** Whether to validate the payload against its schema */
  validate?: boolean;
  /** Whether to migrate the payload to the latest version */
  migrateToLatest?: boolean;
  /** Target version to migrate to (if not latest) */
  targetVersion?: EventVersion;
}