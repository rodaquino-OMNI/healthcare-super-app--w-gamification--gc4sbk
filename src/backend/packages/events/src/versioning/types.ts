/**
 * @file types.ts
 * @description TypeScript types for event versioning that complement the interfaces defined in the interfaces folder.
 * Includes utility types for version manipulation, migration path definitions, transformation options, and version comparison.
 */

import { IVersionedEvent } from '../interfaces';

/**
 * Represents a parsed semantic version with major, minor, and patch components.
 */
export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
};

/**
 * Defines a version range with minimum and maximum versions.
 */
export type VersionRange = {
  min: string;
  max: string;
};

/**
 * Represents a version compatibility result.
 */
export type VersionCompatibilityResult = {
  compatible: boolean;
  reason?: string;
  breakingChanges?: string[];
};

/**
 * Defines the direction of version transformation.
 */
export enum TransformDirection {
  UPGRADE = 'upgrade',   // Transform from older to newer version
  DOWNGRADE = 'downgrade' // Transform from newer to older version
}

/**
 * Options for event transformation between versions.
 */
export type TransformOptions = {
  direction: TransformDirection;
  validateResult?: boolean;
  strict?: boolean;
};

/**
 * Function signature for event transformers that convert events between versions.
 */
export type EventTransformer<T extends IVersionedEvent = IVersionedEvent> = (
  event: T,
  options?: TransformOptions
) => T;

/**
 * Defines a migration path between two specific versions.
 */
export type MigrationPath = {
  sourceVersion: string;
  targetVersion: string;
  transformer: EventTransformer;
};

/**
 * Configuration for the migration registry.
 */
export type MigrationRegistryConfig = {
  strict?: boolean;
  validateResults?: boolean;
  allowDowngrade?: boolean;
};

/**
 * Result of a migration operation.
 */
export type MigrationResult<T extends IVersionedEvent = IVersionedEvent> = {
  success: boolean;
  event?: T;
  error?: Error;
  migrationPath?: string[];
};

/**
 * Base interface for version detection strategies.
 */
export interface VersionDetectionStrategy {
  type: string;
  detect(event: unknown): string | null;
}

/**
 * Strategy for detecting version from an explicit version field.
 */
export interface ExplicitVersionStrategy extends VersionDetectionStrategy {
  type: 'explicit';
  field: string;
}

/**
 * Strategy for detecting version from event structure.
 */
export interface StructureBasedStrategy extends VersionDetectionStrategy {
  type: 'structure';
  versionMap: Record<string, (event: unknown) => boolean>;
}

/**
 * Strategy for detecting version from headers or metadata.
 */
export interface HeaderBasedStrategy extends VersionDetectionStrategy {
  type: 'header';
  headerField: string;
}

/**
 * Strategy for detecting version using a custom function.
 */
export interface CustomStrategy extends VersionDetectionStrategy {
  type: 'custom';
  detector: (event: unknown) => string | null;
}

/**
 * Union type of all version detection strategies.
 */
export type VersionDetectionStrategyType =
  | ExplicitVersionStrategy
  | StructureBasedStrategy
  | HeaderBasedStrategy
  | CustomStrategy;

/**
 * Configuration for the version detector.
 */
export type VersionDetectorConfig = {
  strategies: VersionDetectionStrategyType[];
  defaultVersion?: string;
  throwOnUndetected?: boolean;
};

/**
 * Result of a version detection operation.
 */
export type VersionDetectionResult = {
  detected: boolean;
  version: string | null;
  strategy?: string;
  confidence?: number;
};

/**
 * Configuration for the compatibility checker.
 */
export type CompatibilityCheckerConfig = {
  strict?: boolean;
  allowMajorUpgrade?: boolean;
  allowDowngrade?: boolean;
};

/**
 * Represents a schema difference between two versions.
 */
export type SchemaDifference = {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'type_changed';
  sourceType?: string;
  targetType?: string;
  breaking: boolean;
};

/**
 * Result of a schema comparison operation.
 */
export type SchemaComparisonResult = {
  compatible: boolean;
  differences: SchemaDifference[];
  breakingChanges: SchemaDifference[];
};

/**
 * Type guard to check if an object is a versioned event.
 */
export function isVersionedEvent(obj: unknown): obj is IVersionedEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    typeof (obj as IVersionedEvent).version === 'string'
  );
}

/**
 * Type for a function that validates an event against a schema.
 */
export type SchemaValidator = (event: unknown, version: string) => boolean;

/**
 * Configuration for schema validation.
 */
export type SchemaValidationConfig = {
  strict?: boolean;
  throwOnInvalid?: boolean;
};

/**
 * Result of a schema validation operation.
 */
export type SchemaValidationResult = {
  valid: boolean;
  errors?: string[];
  version: string;
};