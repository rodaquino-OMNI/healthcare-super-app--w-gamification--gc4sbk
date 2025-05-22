/**
 * @file notification-event-versioning.interface.ts
 * @description Defines interfaces for versioning notification event schemas, enabling backward compatibility
 * and graceful evolution of event structures. This file provides utilities for version detection,
 * schema migration, and compatibility checking, which are essential for maintaining system stability
 * during deployments with changed event schemas.
 */

import { INotificationEvent } from './notification-event.interface';

/**
 * Represents the version information for a notification event schema.
 * Follows semantic versioning principles (major.minor.patch).
 */
export interface INotificationEventVersion {
  /**
   * Major version number. Incremented for breaking changes that require
   * migration or will cause incompatibility with previous versions.
   */
  major: number;

  /**
   * Minor version number. Incremented for backward-compatible feature additions.
   * Consumers on older versions can still process events with newer minor versions.
   */
  minor: number;

  /**
   * Patch version number. Incremented for backward-compatible bug fixes.
   * Does not affect schema structure or processing logic.
   */
  patch: number;

  /**
   * Optional string representation of the version in semver format (e.g., "1.2.3").
   * If not provided, it will be generated from major, minor, and patch values.
   */
  toString?: string;
}

/**
 * Extends the base notification event with versioning information.
 * All versioned notification events must implement this interface.
 */
export interface IVersionedNotificationEvent extends INotificationEvent {
  /**
   * Version information for the event schema.
   * Used to determine compatibility and apply transformations if needed.
   */
  version: INotificationEventVersion;

  /**
   * Optional flag indicating if this event schema version is deprecated.
   * Consumers should prepare to handle newer versions when this is true.
   */
  deprecated?: boolean;

  /**
   * Optional date when this version will be removed/unsupported.
   * Provides a timeline for consumers to update their implementations.
   */
  deprecationDate?: string;

  /**
   * Optional message providing additional context about the deprecation
   * and guidance for migration to newer versions.
   */
  deprecationMessage?: string;
}

/**
 * Defines the structure for a schema transformation function that converts
 * an event from one version to another.
 */
export interface INotificationEventTransformer<T extends IVersionedNotificationEvent, U extends IVersionedNotificationEvent> {
  /**
   * Source version that this transformer can process.
   */
  sourceVersion: INotificationEventVersion;

  /**
   * Target version that this transformer will produce.
   */
  targetVersion: INotificationEventVersion;

  /**
   * Transforms an event from the source version to the target version.
   * @param event The event to transform
   * @returns The transformed event
   */
  transform: (event: T) => U;

  /**
   * Validates that the transformation was successful and the resulting
   * event conforms to the target schema.
   * @param event The transformed event
   * @returns True if the event is valid, false otherwise
   */
  validate?: (event: U) => boolean;
}

/**
 * Defines the compatibility relationship between two event versions.
 */
export enum VersionCompatibility {
  /**
   * Versions are fully compatible, no transformation needed.
   */
  COMPATIBLE = 'compatible',

  /**
   * Versions are compatible with transformation (e.g., minor version change).
   */
  TRANSFORM_REQUIRED = 'transform_required',

  /**
   * Versions are incompatible, cannot be transformed (e.g., major version change).
   */
  INCOMPATIBLE = 'incompatible'
}

/**
 * Defines the strategy for handling versioned notification events.
 */
export interface INotificationEventVersioningStrategy {
  /**
   * Detects the version of an event based on its structure or explicit version field.
   * @param event The event to analyze
   * @returns The detected version information
   */
  detectVersion: (event: unknown) => INotificationEventVersion;

  /**
   * Checks compatibility between two event versions.
   * @param sourceVersion The source event version
   * @param targetVersion The target event version (usually the handler's expected version)
   * @returns The compatibility status between the versions
   */
  checkCompatibility: (sourceVersion: INotificationEventVersion, targetVersion: INotificationEventVersion) => VersionCompatibility;

  /**
   * Transforms an event from one version to another if possible.
   * @param event The event to transform
   * @param targetVersion The desired target version
   * @returns The transformed event or null if transformation is not possible
   */
  transformEvent: <T extends IVersionedNotificationEvent>(event: T, targetVersion: INotificationEventVersion) => IVersionedNotificationEvent | null;

  /**
   * Registers a transformer that can convert events between specific versions.
   * @param transformer The transformer implementation
   */
  registerTransformer: <T extends IVersionedNotificationEvent, U extends IVersionedNotificationEvent>(
    transformer: INotificationEventTransformer<T, U>
  ) => void;
}

/**
 * Configuration options for the notification event versioning system.
 */
export interface INotificationEventVersioningConfig {
  /**
   * The current latest version of notification events.
   * Used as the default target for transformations.
   */
  latestVersion: INotificationEventVersion;

  /**
   * The minimum supported version of notification events.
   * Events with versions older than this will be rejected.
   */
  minimumSupportedVersion: INotificationEventVersion;

  /**
   * Whether to automatically transform events to the latest version.
   * If false, events will be processed in their original version.
   */
  autoTransformToLatest?: boolean;

  /**
   * Whether to log deprecation warnings for deprecated event versions.
   */
  logDeprecationWarnings?: boolean;

  /**
   * Custom validation function for transformed events.
   */
  validateTransformedEvent?: (event: IVersionedNotificationEvent) => boolean;
}

/**
 * Utility type for creating a migration path between event versions.
 * Defines a sequence of transformers that can convert an event from
 * one version to another through intermediate versions if needed.
 */
export interface INotificationEventMigrationPath<T extends IVersionedNotificationEvent, U extends IVersionedNotificationEvent> {
  /**
   * Source version for this migration path.
   */
  sourceVersion: INotificationEventVersion;

  /**
   * Target version for this migration path.
   */
  targetVersion: INotificationEventVersion;

  /**
   * Ordered sequence of transformers to apply.
   * Each transformer's target version must match the next transformer's source version.
   */
  transformers: INotificationEventTransformer<any, any>[];

  /**
   * Executes the migration path, applying all transformers in sequence.
   * @param event The event to migrate
   * @returns The migrated event
   */
  execute: (event: T) => U;
}

/**
 * Interface for a service that manages notification event versioning.
 */
export interface INotificationEventVersioningService {
  /**
   * Gets the current configuration for the versioning service.
   */
  getConfig: () => INotificationEventVersioningConfig;

  /**
   * Updates the configuration for the versioning service.
   * @param config The new configuration
   */
  updateConfig: (config: Partial<INotificationEventVersioningConfig>) => void;

  /**
   * Processes an event, handling version detection and transformation if needed.
   * @param event The event to process
   * @param targetVersion Optional specific version to transform to
   * @returns The processed event, potentially transformed to a different version
   */
  processEvent: <T extends IVersionedNotificationEvent>(
    event: T,
    targetVersion?: INotificationEventVersion
  ) => IVersionedNotificationEvent;

  /**
   * Creates a new event with the specified version.
   * @param eventData The event data
   * @param version The version to use (defaults to latest)
   * @returns A new versioned notification event
   */
  createEvent: <T extends Omit<IVersionedNotificationEvent, 'version'>>(
    eventData: T,
    version?: INotificationEventVersion
  ) => IVersionedNotificationEvent;

  /**
   * Registers a new transformer for converting between event versions.
   * @param transformer The transformer to register
   */
  registerTransformer: <T extends IVersionedNotificationEvent, U extends IVersionedNotificationEvent>(
    transformer: INotificationEventTransformer<T, U>
  ) => void;

  /**
   * Creates a migration path between two versions, automatically determining
   * the necessary transformers to apply.
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns A migration path or null if no path exists
   */
  createMigrationPath: <T extends IVersionedNotificationEvent, U extends IVersionedNotificationEvent>(
    sourceVersion: INotificationEventVersion,
    targetVersion: INotificationEventVersion
  ) => INotificationEventMigrationPath<T, U> | null;

  /**
   * Marks an event version as deprecated, setting the deprecation metadata.
   * @param version The version to deprecate
   * @param deprecationDate When the version will be removed
   * @param message Additional context about the deprecation
   */
  deprecateVersion: (
    version: INotificationEventVersion,
    deprecationDate?: string,
    message?: string
  ) => void;
}