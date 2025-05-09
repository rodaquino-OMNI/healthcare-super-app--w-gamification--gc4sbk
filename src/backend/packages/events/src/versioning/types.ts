/**
 * @file Types for event versioning
 * @description Provides TypeScript types for event versioning operations, complementing the interfaces
 * defined in the event-versioning.interface.ts file. These types ensure strong typing throughout
 * the versioning module, improving developer experience and preventing type-related bugs.
 */

import { IVersionedEvent } from '../interfaces/event-versioning.interface';

/**
 * Represents a parsed semantic version with major, minor, and patch components
 */
export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
};

/**
 * Represents a version range with minimum and maximum versions
 */
export type VersionRange = {
  min: string;
  max?: string;
};

/**
 * Represents a version comparison result
 */
export type VersionComparisonResult = {
  isCompatible: boolean;
  reason?: string;
  breakingChanges?: string[];
};

/**
 * Represents a migration path between two versions
 */
export type MigrationPath = {
  sourceVersion: string;
  targetVersion: string;
  migrationFn: MigrationFunction;
  isUpgrade: boolean;
};

/**
 * Function type for migrating an event from one version to another
 */
export type MigrationFunction = <T extends IVersionedEvent>(event: T) => T;

/**
 * Options for event transformation operations
 */
export type TransformationOptions = {
  /** Whether to validate the transformed event against the target schema */
  validateResult?: boolean;
  /** Whether to throw an error if validation fails */
  throwOnValidationError?: boolean;
  /** Whether to preserve original fields not defined in the target schema */
  preserveExtraFields?: boolean;
  /** Custom field mappings for the transformation */
  fieldMappings?: Record<string, string>;
  /** Custom field transformers */
  fieldTransformers?: Record<string, FieldTransformer>;
};

/**
 * Function type for transforming a field value during event transformation
 */
export type FieldTransformer = (value: any, event: IVersionedEvent) => any;

/**
 * Discriminated union for version detection strategies
 */
export type VersionDetectionStrategy =
  | FieldBasedVersionDetection
  | HeaderBasedVersionDetection
  | SchemaBasedVersionDetection;

/**
 * Base type for all version detection strategies
 */
export type BaseVersionDetection = {
  priority: number;
};

/**
 * Strategy for detecting version from a specific field in the event
 */
export type FieldBasedVersionDetection = BaseVersionDetection & {
  type: 'field';
  /** The field name containing the version */
  field: string;
  /** Optional path to nested field (dot notation) */
  path?: string;
};

/**
 * Strategy for detecting version from event headers (e.g., Kafka message headers)
 */
export type HeaderBasedVersionDetection = BaseVersionDetection & {
  type: 'header';
  /** The header name containing the version */
  headerName: string;
};

/**
 * Strategy for detecting version based on event schema structure
 */
export type SchemaBasedVersionDetection = BaseVersionDetection & {
  type: 'schema';
  /** Schema fingerprints mapped to versions */
  schemaFingerprints: Record<string, string>;
};

/**
 * Options for version detection
 */
export type VersionDetectionOptions = {
  /** Strategies to use for detection, in priority order */
  strategies?: VersionDetectionStrategy[];
  /** Default version to use if detection fails */
  defaultVersion?: string;
  /** Whether to throw an error if version detection fails */
  throwOnFailure?: boolean;
};

/**
 * Result of version detection
 */
export type VersionDetectionResult = {
  /** The detected version */
  version: string;
  /** The strategy used to detect the version */
  detectionStrategy?: string;
  /** Whether the version was explicitly defined or inferred */
  isExplicit: boolean;
  /** The parsed version components */
  parsed?: ParsedVersion;
};

/**
 * Options for compatibility checking between versions
 */
export type CompatibilityCheckOptions = {
  /** Whether to use strict semantic versioning rules */
  strictSemver?: boolean;
  /** Whether to allow newer patch versions */
  allowNewerPatch?: boolean;
  /** Whether to allow newer minor versions */
  allowNewerMinor?: boolean;
  /** Custom compatibility rules */
  customRules?: CompatibilityRule[];
};

/**
 * Custom rule for determining compatibility between versions
 */
export type CompatibilityRule = {
  /** Name of the rule */
  name: string;
  /** Function to check compatibility */
  check: (source: ParsedVersion, target: ParsedVersion) => boolean;
  /** Message to include when rule fails */
  message: string;
};

/**
 * Options for schema migration
 */
export type MigrationOptions = {
  /** Whether to validate the migrated event */
  validateResult?: boolean;
  /** Whether to throw an error if validation fails */
  throwOnValidationError?: boolean;
  /** Whether to automatically find migration path */
  autoFindPath?: boolean;
  /** Maximum number of migration steps allowed */
  maxSteps?: number;
};

/**
 * Result of a migration operation
 */
export type MigrationResult<T extends IVersionedEvent> = {
  /** The migrated event */
  event: T;
  /** The original version */
  originalVersion: string;
  /** The new version */
  newVersion: string;
  /** The migration path that was used */
  path?: MigrationPath[];
  /** Whether the migration was successful */
  success: boolean;
  /** Error message if migration failed */
  error?: string;
};

/**
 * Registry of migration paths
 */
export type MigrationRegistry = {
  /** All registered migration paths */
  paths: MigrationPath[];
  /** Get all paths for a specific source version */
  getPathsForSource: (version: string) => MigrationPath[];
  /** Get all paths for a specific target version */
  getPathsForTarget: (version: string) => MigrationPath[];
  /** Find a direct path between two versions */
  findDirectPath: (source: string, target: string) => MigrationPath | undefined;
  /** Find a multi-step path between two versions */
  findPath: (source: string, target: string, maxSteps?: number) => MigrationPath[] | undefined;
};

/**
 * Type guard to check if an object is a versioned event
 */
export function isVersionedEvent(obj: any): obj is IVersionedEvent {
  return (
    obj &&
    typeof obj === 'object' &&
    'version' in obj &&
    typeof obj.version === 'string'
  );
}

/**
 * Type guard to check if a version detection strategy is field-based
 */
export function isFieldBasedStrategy(
  strategy: VersionDetectionStrategy
): strategy is FieldBasedVersionDetection {
  return strategy.type === 'field';
}

/**
 * Type guard to check if a version detection strategy is header-based
 */
export function isHeaderBasedStrategy(
  strategy: VersionDetectionStrategy
): strategy is HeaderBasedVersionDetection {
  return strategy.type === 'header';
}

/**
 * Type guard to check if a version detection strategy is schema-based
 */
export function isSchemaBasedStrategy(
  strategy: VersionDetectionStrategy
): strategy is SchemaBasedVersionDetection {
  return strategy.type === 'schema';
}