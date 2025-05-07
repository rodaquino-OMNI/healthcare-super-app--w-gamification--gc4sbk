/**
 * Interfaces for event schema versioning and evolution.
 * 
 * This file defines interfaces for event schema versioning, enabling backward
 * compatibility for events across different versions. It provides utilities for
 * version detection, schema migration, and handling of deprecated fields or structures.
 */

import { IEvent } from './event.interface';

/**
 * Interface for event version metadata
 */
export interface IEventVersion {
  /**
   * The major version number
   */
  major: number;

  /**
   * The minor version number
   */
  minor: number;

  /**
   * The patch version number
   */
  patch: number;

  /**
   * The full version string (e.g., "1.2.3")
   */
  toString(): string;
}

/**
 * Interface for events with version support
 */
export interface IVersionedEvent extends IEvent {
  /**
   * The version of the event schema
   */
  version: string;
}

/**
 * Interface for event schema transformation
 */
export interface IEventTransformer<T extends IEvent = IEvent> {
  /**
   * Transforms an event from one version to another
   * @param event The event to transform
   * @param targetVersion The target version to transform to
   * @returns The transformed event
   */
  transform(event: T, targetVersion: IEventVersion): T;

  /**
   * Gets the source version of an event
   * @param event The event to get the version from
   * @returns The event version
   */
  getVersion(event: T): IEventVersion;

  /**
   * Checks if the transformer can handle the given event
   * @param event The event to check
   * @returns True if the transformer can handle the event
   */
  canHandle(event: T): boolean;
}

/**
 * Interface for event schema migration
 */
export interface IEventMigration<T extends IEvent = IEvent> {
  /**
   * The source version of the migration
   */
  sourceVersion: IEventVersion;

  /**
   * The target version of the migration
   */
  targetVersion: IEventVersion;

  /**
   * Migrates an event from the source version to the target version
   * @param event The event to migrate
   * @returns The migrated event
   */
  migrate(event: T): T;
}

/**
 * Interface for event schema registry
 */
export interface IEventSchemaRegistry {
  /**
   * Registers a schema for an event type
   * @param eventType The event type
   * @param version The schema version
   * @param schema The schema definition
   */
  registerSchema(eventType: string, version: string, schema: any): void;

  /**
   * Gets a schema for an event type and version
   * @param eventType The event type
   * @param version The schema version
   * @returns The schema definition or undefined if not found
   */
  getSchema(eventType: string, version: string): any;

  /**
   * Gets all versions of a schema for an event type
   * @param eventType The event type
   * @returns An array of schema versions
   */
  getSchemaVersions(eventType: string): string[];

  /**
   * Validates an event against its schema
   * @param event The event to validate
   * @returns True if the event is valid
   */
  validateEvent(event: IVersionedEvent): boolean;
}

/**
 * Parses a version string into an IEventVersion object
 * @param versionStr The version string to parse
 * @returns The parsed version object
 */
export function parseVersion(versionStr: string): IEventVersion {
  const parts = versionStr.split('.');
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parseInt(parts[2], 10) || 0,
    toString: () => versionStr
  };
}

/**
 * Compares two version objects
 * @param v1 The first version
 * @param v2 The second version
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: IEventVersion, v2: IEventVersion): number {
  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1;
  }
  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1;
  }
  return 0;
}