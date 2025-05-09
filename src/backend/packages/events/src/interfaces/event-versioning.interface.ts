/**
 * @file event-versioning.interface.ts
 * @description Defines interfaces for event versioning to support evolution of event schemas over time.
 * These interfaces enable backward compatibility for events, ensuring that both old and new event
 * formats can be processed correctly during system upgrades.
 */

import { IBaseEvent } from './base-event.interface';

/**
 * Interface for versioned events that include a version identifier
 * Extends the base event interface with version information
 */
export interface IVersionedEvent extends IBaseEvent {
  /**
   * Semantic version of the event schema (e.g., "1.0.0")
   * - Major version: Breaking changes that require migration
   * - Minor version: Backward-compatible additions
   * - Patch version: Backward-compatible fixes
   */
  version: string;
}

/**
 * Interface for event version information
 */
export interface EventVersion {
  /**
   * Full version string (e.g., "1.0.0")
   */
  version: string;
  
  /**
   * Major version number (incremented for breaking changes)
   */
  major: number;
  
  /**
   * Minor version number (incremented for backward-compatible additions)
   */
  minor: number;
  
  /**
   * Patch version number (incremented for backward-compatible fixes)
   */
  patch: number;
}

/**
 * Interface for event versioning strategy
 * Defines how event versions are handled throughout the system
 */
export interface EventVersioningStrategy {
  /**
   * Detects the version of an event
   * @param event The event to detect the version for
   * @returns The detected version
   */
  detectVersion(event: unknown): string;
  
  /**
   * Checks if a source version is compatible with a target version
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns Whether the versions are compatible
   */
  isCompatible(sourceVersion: string, targetVersion: string): boolean;
  
  /**
   * Transforms an event from one version to another
   * @param event The event to transform
   * @param targetVersion The target version
   * @returns The transformed event
   */
  transform<T extends IVersionedEvent>(event: T, targetVersion: string): T;
}

/**
 * Interface for event schema registry
 * Provides access to event schemas for different versions
 */
export interface IEventSchemaRegistry {
  /**
   * Gets the schema for a specific event type and version
   * @param eventType The event type
   * @param version The event version
   * @returns The event schema
   */
  getSchema(eventType: string, version: string): unknown;
  
  /**
   * Registers a schema for a specific event type and version
   * @param eventType The event type
   * @param version The event version
   * @param schema The event schema
   */
  registerSchema(eventType: string, version: string, schema: unknown): void;
  
  /**
   * Validates an event against its schema
   * @param event The event to validate
   * @returns Whether the event is valid
   */
  validate<T extends IVersionedEvent>(event: T): boolean;
}

/**
 * Interface for event migration registry
 * Manages migrations between different event versions
 */
export interface IEventMigrationRegistry {
  /**
   * Registers a migration from one version to another
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param migrationFn The migration function
   */
  registerMigration<T extends IVersionedEvent>(
    sourceVersion: string,
    targetVersion: string,
    migrationFn: (event: T) => T
  ): void;
  
  /**
   * Gets a migration function for a specific source and target version
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The migration function
   */
  getMigration<T extends IVersionedEvent>(
    sourceVersion: string,
    targetVersion: string
  ): ((event: T) => T) | undefined;
  
  /**
   * Migrates an event from its current version to a target version
   * @param event The event to migrate
   * @param targetVersion The target version
   * @returns The migrated event
   */
  migrateEvent<T extends IVersionedEvent>(event: T, targetVersion: string): T;
}

/**
 * Interface for versioned event factory
 * Creates versioned events with proper version information
 */
export interface IVersionedEventFactory {
  /**
   * Creates a new versioned event
   * @param eventType The event type
   * @param payload The event payload
   * @param options Additional options
   * @returns The created event
   */
  createEvent<T extends Record<string, any>>(
    eventType: string,
    payload: T,
    options?: {
      version?: string;
      source?: string;
      correlationId?: string;
    }
  ): IVersionedEvent & { payload: T };
  
  /**
   * Gets the current version for an event type
   * @param eventType The event type
   * @returns The current version
   */
  getCurrentVersion(eventType: string): string;
}