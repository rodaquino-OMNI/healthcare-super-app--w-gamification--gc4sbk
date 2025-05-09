/**
 * @file schema-utils.ts
 * @description Utilities for working with event schemas, including schema registration, retrieval, and versioning.
 * This module manages the schema registry for all event types, providing functions to register schemas,
 * retrieve schemas by type and version, and handle schema compatibility checks.
 */

import { z } from 'zod';
import { EventVersion } from '../versioning/types';
import { EventSchemaRegistrationError, EventSchemaVersionError, EventSchemaNotFoundError } from '../versioning/errors';

/**
 * Interface for schema registry entries
 */
export interface SchemaRegistryEntry<T = any> {
  /** The event type identifier */
  type: string;
  /** The schema version in semantic versioning format (major.minor.patch) */
  version: EventVersion;
  /** The Zod schema for validating events of this type */
  schema: z.ZodType<T>;
  /** Optional description of the schema for documentation purposes */
  description?: string;
  /** Optional metadata for the schema */
  metadata?: Record<string, any>;
  /** The date when this schema version was registered */
  registeredAt: Date;
}

/**
 * Options for registering a schema
 */
export interface SchemaRegistrationOptions {
  /** Whether to overwrite an existing schema with the same type and version */
  overwrite?: boolean;
  /** Description of the schema for documentation purposes */
  description?: string;
  /** Additional metadata for the schema */
  metadata?: Record<string, any>;
  /** Whether to validate the schema against existing versions for compatibility */
  validateCompatibility?: boolean;
}

/**
 * Options for retrieving a schema
 */
export interface SchemaRetrievalOptions {
  /** Whether to return the latest compatible version if the exact version is not found */
  findCompatible?: boolean;
  /** Whether to throw an error if the schema is not found */
  throwIfNotFound?: boolean;
}

/**
 * Schema compatibility level
 */
export enum SchemaCompatibilityLevel {
  /** No compatibility checks */
  NONE = 'NONE',
  /** Backward compatible - new schema can read old data */
  BACKWARD = 'BACKWARD',
  /** Forward compatible - old schema can read new data */
  FORWARD = 'FORWARD',
  /** Full compatibility - both backward and forward */
  FULL = 'FULL',
}

/**
 * Result of a schema compatibility check
 */
export interface SchemaCompatibilityResult {
  /** Whether the schemas are compatible */
  compatible: boolean;
  /** The compatibility level achieved */
  level: SchemaCompatibilityLevel;
  /** Any incompatibilities found */
  incompatibilities?: string[];
}

/**
 * Schema documentation options
 */
export interface SchemaDocumentationOptions {
  /** Whether to include examples in the documentation */
  includeExamples?: boolean;
  /** Whether to include validation rules in the documentation */
  includeValidationRules?: boolean;
  /** Format of the documentation */
  format?: 'markdown' | 'html' | 'json';
  /** Whether to include version history in the documentation */
  includeVersionHistory?: boolean;
}

/**
 * Schema registry for storing and retrieving event schemas
 */
class SchemaRegistry {
  private schemas: Map<string, Map<string, SchemaRegistryEntry>> = new Map();
  private defaultCompatibilityLevel: SchemaCompatibilityLevel = SchemaCompatibilityLevel.BACKWARD;

  /**
   * Register a schema for an event type
   * @param type The event type identifier
   * @param version The schema version in semantic versioning format
   * @param schema The Zod schema for validating events of this type
   * @param options Registration options
   * @returns The registered schema entry
   * @throws {EventSchemaRegistrationError} If registration fails
   */
  registerSchema<T = any>(
    type: string,
    version: EventVersion,
    schema: z.ZodType<T>,
    options: SchemaRegistrationOptions = {}
  ): SchemaRegistryEntry<T> {
    const {
      overwrite = false,
      description = '',
      metadata = {},
      validateCompatibility = true,
    } = options;

    // Validate inputs
    if (!type) {
      throw new EventSchemaRegistrationError('Event type is required', { type, version });
    }

    if (!this.isValidVersion(version)) {
      throw new EventSchemaRegistrationError(
        'Invalid version format. Must be in format major.minor.patch',
        { type, version }
      );
    }

    if (!schema) {
      throw new EventSchemaRegistrationError('Schema is required', { type, version });
    }

    // Get or create the version map for this type
    if (!this.schemas.has(type)) {
      this.schemas.set(type, new Map());
    }

    const versionMap = this.schemas.get(type)!;
    const versionKey = this.versionToString(version);

    // Check if schema already exists
    if (versionMap.has(versionKey) && !overwrite) {
      throw new EventSchemaRegistrationError(
        `Schema for type '${type}' with version '${versionKey}' already exists`,
        { type, version }
      );
    }

    // Check compatibility with existing versions if required
    if (validateCompatibility && versionMap.size > 0) {
      const latestVersion = this.getLatestVersion(type);
      if (latestVersion) {
        const latestSchema = this.getSchema(type, latestVersion);
        if (latestSchema) {
          const compatibility = this.checkCompatibility(
            latestSchema.schema,
            schema,
            this.compareVersions(latestVersion, version) < 0 
              ? SchemaCompatibilityLevel.BACKWARD 
              : SchemaCompatibilityLevel.FORWARD
          );

          if (!compatibility.compatible) {
            throw new EventSchemaRegistrationError(
              `Schema for type '${type}' with version '${versionKey}' is not compatible with version '${this.versionToString(latestVersion)}'`,
              { 
                type, 
                version,
                latestVersion,
                incompatibilities: compatibility.incompatibilities 
              }
            );
          }
        }
      }
    }

    // Create the schema entry
    const entry: SchemaRegistryEntry<T> = {
      type,
      version,
      schema,
      description,
      metadata,
      registeredAt: new Date(),
    };

    // Store the schema
    versionMap.set(versionKey, entry);

    return entry;
  }

  /**
   * Get a schema for an event type and version
   * @param type The event type identifier
   * @param version The schema version (or 'latest' for the latest version)
   * @param options Retrieval options
   * @returns The schema entry or undefined if not found
   * @throws {EventSchemaNotFoundError} If throwIfNotFound is true and schema is not found
   */
  getSchema<T = any>(
    type: string,
    version: EventVersion | 'latest' = 'latest',
    options: SchemaRetrievalOptions = {}
  ): SchemaRegistryEntry<T> | undefined {
    const {
      findCompatible = true,
      throwIfNotFound = false,
    } = options;

    // Check if type exists
    if (!this.schemas.has(type)) {
      if (throwIfNotFound) {
        throw new EventSchemaNotFoundError(`No schemas found for type '${type}'`, { type });
      }
      return undefined;
    }

    const versionMap = this.schemas.get(type)!;

    // Handle 'latest' version
    if (version === 'latest') {
      const latestVersion = this.getLatestVersion(type);
      if (!latestVersion) {
        if (throwIfNotFound) {
          throw new EventSchemaNotFoundError(`No versions found for type '${type}'`, { type });
        }
        return undefined;
      }
      return this.getSchema<T>(type, latestVersion, options);
    }

    // Get the exact version
    const versionKey = this.versionToString(version);
    if (versionMap.has(versionKey)) {
      return versionMap.get(versionKey) as SchemaRegistryEntry<T>;
    }

    // Find compatible version if requested
    if (findCompatible) {
      const compatibleVersion = this.findCompatibleVersion(type, version);
      if (compatibleVersion) {
        return versionMap.get(this.versionToString(compatibleVersion)) as SchemaRegistryEntry<T>;
      }
    }

    // Not found
    if (throwIfNotFound) {
      throw new EventSchemaNotFoundError(
        `Schema for type '${type}' with version '${versionKey}' not found`,
        { type, version }
      );
    }

    return undefined;
  }

  /**
   * Get all schemas for an event type
   * @param type The event type identifier
   * @returns Array of schema entries sorted by version (newest first)
   */
  getAllSchemas<T = any>(type: string): SchemaRegistryEntry<T>[] {
    if (!this.schemas.has(type)) {
      return [];
    }

    const versionMap = this.schemas.get(type)!;
    return Array.from(versionMap.values())
      .sort((a, b) => this.compareVersions(b.version, a.version)) as SchemaRegistryEntry<T>[];
  }

  /**
   * Get all registered event types
   * @returns Array of event type identifiers
   */
  getAllTypes(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Get the latest version for an event type
   * @param type The event type identifier
   * @returns The latest version or undefined if no versions exist
   */
  getLatestVersion(type: string): EventVersion | undefined {
    if (!this.schemas.has(type)) {
      return undefined;
    }

    const versionMap = this.schemas.get(type)!;
    if (versionMap.size === 0) {
      return undefined;
    }

    const versions = Array.from(versionMap.keys())
      .map(v => this.parseVersion(v))
      .sort((a, b) => this.compareVersions(b, a));

    return versions[0];
  }

  /**
   * Find a compatible version for an event type and target version
   * @param type The event type identifier
   * @param targetVersion The target version to find compatibility with
   * @returns The compatible version or undefined if none found
   */
  findCompatibleVersion(type: string, targetVersion: EventVersion): EventVersion | undefined {
    if (!this.schemas.has(type)) {
      return undefined;
    }

    const versionMap = this.schemas.get(type)!;
    if (versionMap.size === 0) {
      return undefined;
    }

    // Get all versions sorted by compatibility preference
    // 1. Same major version, higher minor/patch (backward compatible)
    // 2. Same major version, lower minor/patch (forward compatible)
    // 3. Lower major version (potentially forward compatible)
    // 4. Higher major version (likely incompatible)
    const versions = Array.from(versionMap.keys())
      .map(v => this.parseVersion(v))
      .sort((a, b) => {
        // If target major matches a major but not b major, prefer a
        if (targetVersion.major === a.major && targetVersion.major !== b.major) {
          return -1;
        }
        // If target major matches b major but not a major, prefer b
        if (targetVersion.major !== a.major && targetVersion.major === b.major) {
          return 1;
        }
        // If both match target major, prefer the one with closest minor/patch
        if (targetVersion.major === a.major && targetVersion.major === b.major) {
          // If a minor/patch is higher than target, it's backward compatible
          const aHigher = a.minor > targetVersion.minor || 
            (a.minor === targetVersion.minor && a.patch > targetVersion.patch);
          const bHigher = b.minor > targetVersion.minor || 
            (b.minor === targetVersion.minor && b.patch > targetVersion.patch);
          
          // Prefer backward compatible versions (higher minor/patch)
          if (aHigher && !bHigher) return -1;
          if (!aHigher && bHigher) return 1;
          
          // Both are either higher or lower, prefer closest to target
          return Math.abs(this.compareVersions(a, targetVersion)) - 
                 Math.abs(this.compareVersions(b, targetVersion));
        }
        // Neither matches target major, prefer closest major
        return Math.abs(a.major - targetVersion.major) - 
               Math.abs(b.major - targetVersion.major);
      });

    // Check compatibility of each version
    for (const version of versions) {
      const versionKey = this.versionToString(version);
      const schema = versionMap.get(versionKey);
      if (!schema) continue;

      const targetSchema = this.getSchema(type, targetVersion);
      if (!targetSchema) continue;

      // Determine compatibility direction based on version comparison
      const compatibilityLevel = this.compareVersions(version, targetVersion) < 0
        ? SchemaCompatibilityLevel.FORWARD  // version is older than target
        : SchemaCompatibilityLevel.BACKWARD; // version is newer than target

      const compatibility = this.checkCompatibility(
        schema.schema,
        targetSchema.schema,
        compatibilityLevel
      );

      if (compatibility.compatible) {
        return version;
      }
    }

    return undefined;
  }

  /**
   * Check compatibility between two schemas
   * @param oldSchema The old schema
   * @param newSchema The new schema
   * @param level The compatibility level to check
   * @returns The compatibility result
   */
  checkCompatibility(
    oldSchema: z.ZodType<any>,
    newSchema: z.ZodType<any>,
    level: SchemaCompatibilityLevel = this.defaultCompatibilityLevel
  ): SchemaCompatibilityResult {
    const incompatibilities: string[] = [];

    // Extract schema definitions
    const oldDef = this.extractSchemaDefinition(oldSchema);
    const newDef = this.extractSchemaDefinition(newSchema);

    // Check compatibility based on level
    let compatible = true;

    switch (level) {
      case SchemaCompatibilityLevel.BACKWARD:
        // New schema can read old data
        compatible = this.isBackwardCompatible(oldDef, newDef, incompatibilities);
        break;
      case SchemaCompatibilityLevel.FORWARD:
        // Old schema can read new data
        compatible = this.isForwardCompatible(oldDef, newDef, incompatibilities);
        break;
      case SchemaCompatibilityLevel.FULL:
        // Both backward and forward compatible
        compatible = this.isBackwardCompatible(oldDef, newDef, incompatibilities) &&
                     this.isForwardCompatible(oldDef, newDef, incompatibilities);
        break;
      case SchemaCompatibilityLevel.NONE:
        // No compatibility check
        compatible = true;
        break;
    }

    return {
      compatible,
      level,
      incompatibilities: incompatibilities.length > 0 ? incompatibilities : undefined,
    };
  }

  /**
   * Generate documentation for a schema
   * @param type The event type identifier
   * @param version The schema version (or 'latest' for the latest version)
   * @param options Documentation options
   * @returns The generated documentation
   * @throws {EventSchemaNotFoundError} If schema is not found
   */
  generateDocumentation(
    type: string,
    version: EventVersion | 'latest' = 'latest',
    options: SchemaDocumentationOptions = {}
  ): string {
    const {
      includeExamples = true,
      includeValidationRules = true,
      format = 'markdown',
      includeVersionHistory = true,
    } = options;

    // Get the schema
    const schema = this.getSchema(type, version, { throwIfNotFound: true });
    if (!schema) {
      throw new EventSchemaNotFoundError(
        `Schema for type '${type}' with version '${version}' not found`,
        { type, version }
      );
    }

    // Generate documentation based on format
    switch (format) {
      case 'markdown':
        return this.generateMarkdownDocumentation(schema, {
          includeExamples,
          includeValidationRules,
          includeVersionHistory,
        });
      case 'html':
        return this.generateHtmlDocumentation(schema, {
          includeExamples,
          includeValidationRules,
          includeVersionHistory,
        });
      case 'json':
        return JSON.stringify(
          this.generateJsonDocumentation(schema, {
            includeExamples,
            includeValidationRules,
            includeVersionHistory,
          }),
          null,
          2
        );
      default:
        throw new Error(`Unsupported documentation format: ${format}`);
    }
  }

  /**
   * Set the default compatibility level for schema checks
   * @param level The compatibility level
   */
  setDefaultCompatibilityLevel(level: SchemaCompatibilityLevel): void {
    this.defaultCompatibilityLevel = level;
  }

  /**
   * Get the default compatibility level for schema checks
   * @returns The default compatibility level
   */
  getDefaultCompatibilityLevel(): SchemaCompatibilityLevel {
    return this.defaultCompatibilityLevel;
  }

  /**
   * Clear all schemas from the registry
   */
  clear(): void {
    this.schemas.clear();
  }

  /**
   * Remove a schema from the registry
   * @param type The event type identifier
   * @param version The schema version (or undefined to remove all versions)
   * @returns True if the schema was removed, false otherwise
   */
  removeSchema(type: string, version?: EventVersion): boolean {
    if (!this.schemas.has(type)) {
      return false;
    }

    // Remove all versions if version is undefined
    if (!version) {
      this.schemas.delete(type);
      return true;
    }

    // Remove specific version
    const versionMap = this.schemas.get(type)!;
    const versionKey = this.versionToString(version);
    const removed = versionMap.delete(versionKey);

    // Remove type if no versions left
    if (versionMap.size === 0) {
      this.schemas.delete(type);
    }

    return removed;
  }

  /**
   * Check if a schema exists
   * @param type The event type identifier
   * @param version The schema version (or undefined to check if any version exists)
   * @returns True if the schema exists, false otherwise
   */
  hasSchema(type: string, version?: EventVersion): boolean {
    if (!this.schemas.has(type)) {
      return false;
    }

    // Check if any version exists if version is undefined
    if (!version) {
      return this.schemas.get(type)!.size > 0;
    }

    // Check specific version
    const versionMap = this.schemas.get(type)!;
    const versionKey = this.versionToString(version);
    return versionMap.has(versionKey);
  }

  /**
   * Get the number of schemas in the registry
   * @returns The number of schemas
   */
  size(): number {
    let count = 0;
    for (const versionMap of this.schemas.values()) {
      count += versionMap.size;
    }
    return count;
  }

  // Private helper methods

  /**
   * Check if a version string is valid
   * @param version The version to check
   * @returns True if valid, false otherwise
   */
  private isValidVersion(version: EventVersion): boolean {
    return (
      typeof version === 'object' &&
      typeof version.major === 'number' &&
      typeof version.minor === 'number' &&
      typeof version.patch === 'number' &&
      version.major >= 0 &&
      version.minor >= 0 &&
      version.patch >= 0
    );
  }

  /**
   * Convert a version object to a string
   * @param version The version object
   * @returns The version string
   */
  private versionToString(version: EventVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * Parse a version string to a version object
   * @param version The version string
   * @returns The version object
   * @throws {EventSchemaVersionError} If the version string is invalid
   */
  private parseVersion(version: string): EventVersion {
    const parts = version.split('.');
    if (parts.length !== 3) {
      throw new EventSchemaVersionError(
        `Invalid version format: ${version}. Must be in format major.minor.patch`,
        { version }
      );
    }

    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patch = parseInt(parts[2], 10);

    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
      throw new EventSchemaVersionError(
        `Invalid version format: ${version}. Must contain only numbers`,
        { version }
      );
    }

    return { major, minor, patch };
  }

  /**
   * Compare two versions
   * @param a First version
   * @param b Second version
   * @returns -1 if a < b, 0 if a === b, 1 if a > b
   */
  private compareVersions(a: EventVersion, b: EventVersion): number {
    if (a.major !== b.major) {
      return a.major - b.major;
    }
    if (a.minor !== b.minor) {
      return a.minor - b.minor;
    }
    return a.patch - b.patch;
  }

  /**
   * Extract a simplified schema definition from a Zod schema
   * @param schema The Zod schema
   * @returns A simplified schema definition
   */
  private extractSchemaDefinition(schema: z.ZodType<any>): Record<string, any> {
    // This is a simplified implementation
    // In a real-world scenario, you would use Zod's internal API or reflection
    // to extract the schema definition
    try {
      // Try to extract schema from Zod's internal structure
      const schemaObj = schema as any;
      if (schemaObj._def && schemaObj._def.shape) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(schemaObj._def.shape)) {
          result[key] = {
            type: this.getZodTypeString(value),
            optional: value.isOptional?.() || false,
            nullable: value.isNullable?.() || false,
          };
        }
        return result;
      }
      
      // Fallback: create a sample object and validate it to infer schema
      return { _schemaType: this.getZodTypeString(schema) };
    } catch (error) {
      // If extraction fails, return a minimal definition
      return { _schemaType: 'unknown' };
    }
  }

  /**
   * Get a string representation of a Zod type
   * @param zodType The Zod type
   * @returns A string representation of the type
   */
  private getZodTypeString(zodType: z.ZodType<any>): string {
    const type = zodType as any;
    if (!type._def) return 'unknown';
    
    switch (type._def.typeName) {
      case 'ZodString': return 'string';
      case 'ZodNumber': return 'number';
      case 'ZodBoolean': return 'boolean';
      case 'ZodDate': return 'date';
      case 'ZodArray': return 'array';
      case 'ZodObject': return 'object';
      case 'ZodEnum': return 'enum';
      case 'ZodUnion': return 'union';
      case 'ZodIntersection': return 'intersection';
      case 'ZodTuple': return 'tuple';
      case 'ZodRecord': return 'record';
      case 'ZodMap': return 'map';
      case 'ZodSet': return 'set';
      case 'ZodNull': return 'null';
      case 'ZodUndefined': return 'undefined';
      case 'ZodAny': return 'any';
      case 'ZodUnknown': return 'unknown';
      case 'ZodNever': return 'never';
      case 'ZodVoid': return 'void';
      case 'ZodLiteral': return `literal:${String(type._def.value)}`;
      case 'ZodOptional': return `optional:${this.getZodTypeString(type._def.innerType)}`;
      case 'ZodNullable': return `nullable:${this.getZodTypeString(type._def.innerType)}`;
      case 'ZodDefault': return `default:${this.getZodTypeString(type._def.innerType)}`;
      case 'ZodPromise': return `promise:${this.getZodTypeString(type._def.type)}`;
      case 'ZodFunction': return 'function';
      default: return 'unknown';
    }
  }

  /**
   * Check if newDef is backward compatible with oldDef
   * @param oldDef The old schema definition
   * @param newDef The new schema definition
   * @param incompatibilities Array to collect incompatibilities
   * @returns True if backward compatible, false otherwise
   */
  private isBackwardCompatible(
    oldDef: Record<string, any>,
    newDef: Record<string, any>,
    incompatibilities: string[]
  ): boolean {
    // Backward compatibility rules:
    // 1. New schema must accept all fields from old schema
    // 2. Required fields in old schema must be required in new schema
    // 3. Field types must be compatible

    let compatible = true;

    // Check each field in old schema
    for (const [key, oldField] of Object.entries(oldDef)) {
      // Skip special fields
      if (key.startsWith('_')) continue;

      // Check if field exists in new schema
      if (!(key in newDef)) {
        incompatibilities.push(`Field '${key}' exists in old schema but not in new schema`);
        compatible = false;
        continue;
      }

      const newField = newDef[key];

      // Check if required field became optional
      if (!oldField.optional && newField.optional) {
        incompatibilities.push(`Field '${key}' was required in old schema but is optional in new schema`);
        compatible = false;
      }

      // Check type compatibility
      if (!this.areTypesCompatible(oldField.type, newField.type)) {
        incompatibilities.push(`Field '${key}' changed type from '${oldField.type}' to '${newField.type}'`);
        compatible = false;
      }
    }

    return compatible;
  }

  /**
   * Check if newDef is forward compatible with oldDef
   * @param oldDef The old schema definition
   * @param newDef The new schema definition
   * @param incompatibilities Array to collect incompatibilities
   * @returns True if forward compatible, false otherwise
   */
  private isForwardCompatible(
    oldDef: Record<string, any>,
    newDef: Record<string, any>,
    incompatibilities: string[]
  ): boolean {
    // Forward compatibility rules:
    // 1. New schema cannot add required fields
    // 2. Field types must be compatible

    let compatible = true;

    // Check each field in new schema
    for (const [key, newField] of Object.entries(newDef)) {
      // Skip special fields
      if (key.startsWith('_')) continue;

      // Check if new required field was added
      if (!(key in oldDef) && !newField.optional) {
        incompatibilities.push(`New required field '${key}' added in new schema`);
        compatible = false;
        continue;
      }

      // If field exists in both, check type compatibility
      if (key in oldDef) {
        const oldField = oldDef[key];
        if (!this.areTypesCompatible(oldField.type, newField.type)) {
          incompatibilities.push(`Field '${key}' changed type from '${oldField.type}' to '${newField.type}'`);
          compatible = false;
        }
      }
    }

    return compatible;
  }

  /**
   * Check if two types are compatible
   * @param oldType The old type
   * @param newType The new type
   * @returns True if compatible, false otherwise
   */
  private areTypesCompatible(oldType: string, newType: string): boolean {
    // Simple implementation - in a real-world scenario, you would have more complex rules
    if (oldType === newType) return true;
    
    // Handle optional and nullable types
    if (oldType.startsWith('optional:') || oldType.startsWith('nullable:')) {
      const baseOldType = oldType.split(':')[1];
      if (newType.startsWith('optional:') || newType.startsWith('nullable:')) {
        const baseNewType = newType.split(':')[1];
        return this.areTypesCompatible(baseOldType, baseNewType);
      }
      return this.areTypesCompatible(baseOldType, newType);
    }
    
    if (newType.startsWith('optional:') || newType.startsWith('nullable:')) {
      const baseNewType = newType.split(':')[1];
      return this.areTypesCompatible(oldType, baseNewType);
    }
    
    // Some basic type compatibility rules
    if (oldType === 'any' || newType === 'any') return true;
    if (oldType === 'unknown' || newType === 'unknown') return true;
    if (oldType === 'number' && newType === 'integer') return true;
    if (oldType === 'integer' && newType === 'number') return true;
    
    // Union types would need special handling
    if (oldType === 'union' || newType === 'union') {
      // Simplified - in reality, would need to check union members
      return true;
    }
    
    return false;
  }

  /**
   * Generate Markdown documentation for a schema
   * @param schema The schema entry
   * @param options Documentation options
   * @returns Markdown documentation
   */
  private generateMarkdownDocumentation(
    schema: SchemaRegistryEntry,
    options: SchemaDocumentationOptions
  ): string {
    const { includeExamples, includeValidationRules, includeVersionHistory } = options;
    const { type, version, description, registeredAt } = schema;
    
    let markdown = `# Event Schema: ${type}\n\n`;
    markdown += `**Version:** ${this.versionToString(version)}\n\n`;
    markdown += `**Registered:** ${registeredAt.toISOString()}\n\n`;
    
    if (description) {
      markdown += `## Description\n\n${description}\n\n`;
    }
    
    markdown += `## Schema Definition\n\n`;
    markdown += this.generateSchemaDefinitionMarkdown(schema.schema);
    
    if (includeValidationRules) {
      markdown += `\n## Validation Rules\n\n`;
      markdown += this.generateValidationRulesMarkdown(schema.schema);
    }
    
    if (includeExamples) {
      markdown += `\n## Examples\n\n`;
      markdown += this.generateExamplesMarkdown(schema.schema);
    }
    
    if (includeVersionHistory) {
      markdown += `\n## Version History\n\n`;
      markdown += this.generateVersionHistoryMarkdown(type);
    }
    
    return markdown;
  }

  /**
   * Generate HTML documentation for a schema
   * @param schema The schema entry
   * @param options Documentation options
   * @returns HTML documentation
   */
  private generateHtmlDocumentation(
    schema: SchemaRegistryEntry,
    options: SchemaDocumentationOptions
  ): string {
    // Simplified implementation - convert markdown to HTML
    const markdown = this.generateMarkdownDocumentation(schema, options);
    return `<!DOCTYPE html>
<html>
<head>
  <title>Event Schema: ${schema.type}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #444; margin-top: 30px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { font-family: monospace; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  ${this.markdownToHtml(markdown)}
</body>
</html>`;
  }

  /**
   * Generate JSON documentation for a schema
   * @param schema The schema entry
   * @param options Documentation options
   * @returns JSON documentation object
   */
  private generateJsonDocumentation(
    schema: SchemaRegistryEntry,
    options: SchemaDocumentationOptions
  ): Record<string, any> {
    const { includeExamples, includeValidationRules, includeVersionHistory } = options;
    const { type, version, description, registeredAt, metadata } = schema;
    
    const doc: Record<string, any> = {
      type,
      version: this.versionToString(version),
      registeredAt: registeredAt.toISOString(),
      description,
      schema: this.extractSchemaDefinition(schema.schema),
    };
    
    if (metadata) {
      doc.metadata = metadata;
    }
    
    if (includeValidationRules) {
      doc.validationRules = this.extractValidationRules(schema.schema);
    }
    
    if (includeExamples) {
      doc.examples = this.generateExamples(schema.schema);
    }
    
    if (includeVersionHistory) {
      doc.versionHistory = this.getAllSchemas(type).map(s => ({
        version: this.versionToString(s.version),
        registeredAt: s.registeredAt.toISOString(),
        description: s.description,
      }));
    }
    
    return doc;
  }

  /**
   * Generate schema definition markdown
   * @param schema The Zod schema
   * @returns Markdown representation of the schema
   */
  private generateSchemaDefinitionMarkdown(schema: z.ZodType<any>): string {
    const def = this.extractSchemaDefinition(schema);
    let markdown = '```typescript\n';
    
    // If it's an object with properties
    if (Object.keys(def).length > 0 && !Object.keys(def)[0].startsWith('_')) {
      markdown += 'interface EventSchema {\n';
      
      for (const [key, value] of Object.entries(def)) {
        const optional = value.optional ? '?' : '';
        markdown += `  ${key}${optional}: ${value.type};\n`;
      }
      
      markdown += '}\n';
    } else {
      // Simple type
      markdown += `type EventSchema = ${def._schemaType || 'unknown'};\n`;
    }
    
    markdown += '```\n';
    return markdown;
  }

  /**
   * Generate validation rules markdown
   * @param schema The Zod schema
   * @returns Markdown representation of validation rules
   */
  private generateValidationRulesMarkdown(schema: z.ZodType<any>): string {
    // Simplified implementation
    return 'This schema uses Zod for validation. Refer to the schema definition for details.\n';
  }

  /**
   * Generate examples markdown
   * @param schema The Zod schema
   * @returns Markdown representation of examples
   */
  private generateExamplesMarkdown(schema: z.ZodType<any>): string {
    const examples = this.generateExamples(schema);
    if (examples.length === 0) {
      return 'No examples available.\n';
    }
    
    let markdown = '';
    for (let i = 0; i < examples.length; i++) {
      markdown += `### Example ${i + 1}\n\n`;
      markdown += '```json\n';
      markdown += JSON.stringify(examples[i], null, 2);
      markdown += '\n```\n\n';
    }
    
    return markdown;
  }

  /**
   * Generate version history markdown
   * @param type The event type
   * @returns Markdown representation of version history
   */
  private generateVersionHistoryMarkdown(type: string): string {
    const schemas = this.getAllSchemas(type);
    if (schemas.length === 0) {
      return 'No version history available.\n';
    }
    
    let markdown = '| Version | Registered | Description |\n';
    markdown += '|---------|------------|-------------|\n';
    
    for (const schema of schemas) {
      const version = this.versionToString(schema.version);
      const registered = schema.registeredAt.toISOString().split('T')[0];
      const desc = schema.description || '';
      
      markdown += `| ${version} | ${registered} | ${desc} |\n`;
    }
    
    return markdown;
  }

  /**
   * Extract validation rules from a schema
   * @param schema The Zod schema
   * @returns Validation rules object
   */
  private extractValidationRules(schema: z.ZodType<any>): Record<string, any> {
    // Simplified implementation
    return {};
  }

  /**
   * Generate examples for a schema
   * @param schema The Zod schema
   * @returns Array of example objects
   */
  private generateExamples(schema: z.ZodType<any>): any[] {
    // Simplified implementation
    return [];
  }

  /**
   * Convert markdown to HTML
   * @param markdown Markdown string
   * @returns HTML string
   */
  private markdownToHtml(markdown: string): string {
    // Very simplified markdown to HTML conversion
    // In a real implementation, you would use a proper markdown parser
    let html = markdown
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^\*\*(.*)\*\*$/gm, '<strong>$1</strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^```([a-z]*)\n([\s\S]*?)\n```$/gm, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/^\| (.*)$/gm, '<tr><td>' + '$1'.replace(/\|/g, '</td><td>') + '</td></tr>')
      .replace(/<\/td><td>\s*\|\s*<\/tr>/g, '</td></tr>')
      .replace(/^\|[-|]*\|$/gm, '')
      .replace(/<tr>\s*<\/tr>/g, '');
    
    // Convert tables
    html = html.replace(/<tr><td>(.*?)<\/td><\/tr>\s*<tr><td>[-|]*<\/td><\/tr>\s*(<tr><td>.*?<\/td><\/tr>)+/g, (match) => {
      const rows = match.match(/<tr><td>.*?<\/td><\/tr>/g) || [];
      if (rows.length < 2) return match;
      
      const headerRow = rows[0].replace(/<tr><td>/g, '<tr><th>').replace(/<\/td><\/tr>/g, '</th></tr>');
      const bodyRows = rows.slice(2).join('');
      
      return `<table>${headerRow}${bodyRows}</table>`;
    });
    
    // Convert paragraphs
    html = html.replace(/^([^<].*?)$/gm, '<p>$1</p>');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }
}

// Create a singleton instance
const schemaRegistry = new SchemaRegistry();

/**
 * Register a schema for an event type
 * @param type The event type identifier
 * @param version The schema version in semantic versioning format
 * @param schema The Zod schema for validating events of this type
 * @param options Registration options
 * @returns The registered schema entry
 */
export const registerSchema = <T = any>(
  type: string,
  version: EventVersion,
  schema: z.ZodType<T>,
  options?: SchemaRegistrationOptions
): SchemaRegistryEntry<T> => {
  return schemaRegistry.registerSchema(type, version, schema, options);
};

/**
 * Get a schema for an event type and version
 * @param type The event type identifier
 * @param version The schema version (or 'latest' for the latest version)
 * @param options Retrieval options
 * @returns The schema entry or undefined if not found
 */
export const getSchema = <T = any>(
  type: string,
  version?: EventVersion | 'latest',
  options?: SchemaRetrievalOptions
): SchemaRegistryEntry<T> | undefined => {
  return schemaRegistry.getSchema(type, version, options);
};

/**
 * Get all schemas for an event type
 * @param type The event type identifier
 * @returns Array of schema entries sorted by version (newest first)
 */
export const getAllSchemas = <T = any>(type: string): SchemaRegistryEntry<T>[] => {
  return schemaRegistry.getAllSchemas(type);
};

/**
 * Get all registered event types
 * @returns Array of event type identifiers
 */
export const getAllTypes = (): string[] => {
  return schemaRegistry.getAllTypes();
};

/**
 * Get the latest version for an event type
 * @param type The event type identifier
 * @returns The latest version or undefined if no versions exist
 */
export const getLatestVersion = (type: string): EventVersion | undefined => {
  return schemaRegistry.getLatestVersion(type);
};

/**
 * Find a compatible version for an event type and target version
 * @param type The event type identifier
 * @param targetVersion The target version to find compatibility with
 * @returns The compatible version or undefined if none found
 */
export const findCompatibleVersion = (
  type: string,
  targetVersion: EventVersion
): EventVersion | undefined => {
  return schemaRegistry.findCompatibleVersion(type, targetVersion);
};

/**
 * Check compatibility between two schemas
 * @param oldSchema The old schema
 * @param newSchema The new schema
 * @param level The compatibility level to check
 * @returns The compatibility result
 */
export const checkCompatibility = (
  oldSchema: z.ZodType<any>,
  newSchema: z.ZodType<any>,
  level?: SchemaCompatibilityLevel
): SchemaCompatibilityResult => {
  return schemaRegistry.checkCompatibility(oldSchema, newSchema, level);
};

/**
 * Generate documentation for a schema
 * @param type The event type identifier
 * @param version The schema version (or 'latest' for the latest version)
 * @param options Documentation options
 * @returns The generated documentation
 */
export const generateDocumentation = (
  type: string,
  version?: EventVersion | 'latest',
  options?: SchemaDocumentationOptions
): string => {
  return schemaRegistry.generateDocumentation(type, version, options);
};

/**
 * Set the default compatibility level for schema checks
 * @param level The compatibility level
 */
export const setDefaultCompatibilityLevel = (level: SchemaCompatibilityLevel): void => {
  schemaRegistry.setDefaultCompatibilityLevel(level);
};

/**
 * Get the default compatibility level for schema checks
 * @returns The default compatibility level
 */
export const getDefaultCompatibilityLevel = (): SchemaCompatibilityLevel => {
  return schemaRegistry.getDefaultCompatibilityLevel();
};

/**
 * Clear all schemas from the registry
 */
export const clearSchemaRegistry = (): void => {
  schemaRegistry.clear();
};

/**
 * Remove a schema from the registry
 * @param type The event type identifier
 * @param version The schema version (or undefined to remove all versions)
 * @returns True if the schema was removed, false otherwise
 */
export const removeSchema = (type: string, version?: EventVersion): boolean => {
  return schemaRegistry.removeSchema(type, version);
};

/**
 * Check if a schema exists
 * @param type The event type identifier
 * @param version The schema version (or undefined to check if any version exists)
 * @returns True if the schema exists, false otherwise
 */
export const hasSchema = (type: string, version?: EventVersion): boolean => {
  return schemaRegistry.hasSchema(type, version);
};

/**
 * Get the number of schemas in the registry
 * @returns The number of schemas
 */
export const getSchemaCount = (): number => {
  return schemaRegistry.size();
};

/**
 * Validate an event against its schema
 * @param event The event to validate
 * @param type The event type (if not provided, extracted from event)
 * @param version The schema version (if not provided, uses latest)
 * @returns The validated event (with proper typing) or throws an error
 */
export const validateEvent = <T = any>(
  event: any,
  type?: string,
  version?: EventVersion | 'latest'
): T => {
  // Extract type from event if not provided
  const eventType = type || event?.type;
  if (!eventType) {
    throw new Error('Event type is required for validation');
  }

  // Get the schema
  const schema = getSchema<T>(eventType, version, { throwIfNotFound: true });
  if (!schema) {
    throw new Error(`Schema for type '${eventType}' not found`);
  }

  // Validate the event
  try {
    return schema.schema.parse(event) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Event validation failed for type '${eventType}': ${error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
};

/**
 * Create a schema for an event type with version
 * @param type The event type identifier
 * @param version The schema version
 * @param schema The Zod schema for the event
 * @param options Registration options
 * @returns A function that creates and validates events of this type
 */
export const createEventFactory = <T extends { type: string }>(
  type: string,
  version: EventVersion,
  schema: z.ZodType<T>,
  options?: SchemaRegistrationOptions
): ((data: Omit<T, 'type'>) => T) => {
  // Register the schema
  registerSchema(type, version, schema, options);

  // Return a factory function
  return (data: Omit<T, 'type'>): T => {
    const event = { ...data as object, type } as T;
    return validateEvent<T>(event, type, version);
  };
};

/**
 * Create a versioned schema for an event type
 * @param type The event type identifier
 * @param version The schema version
 * @param schema The Zod schema for the event
 * @param options Registration options
 * @returns The registered schema entry
 */
export const createVersionedSchema = <T = any>(
  type: string,
  version: EventVersion,
  schema: z.ZodType<T>,
  options?: SchemaRegistrationOptions
): SchemaRegistryEntry<T> => {
  // Create a versioned schema that includes version information
  const versionedSchema = z.object({
    type: z.literal(type),
    version: z.object({
      major: z.number().int().nonnegative(),
      minor: z.number().int().nonnegative(),
      patch: z.number().int().nonnegative(),
    }).optional(),
    payload: schema,
  });

  // Register the schema
  return registerSchema(
    type,
    version,
    versionedSchema as unknown as z.ZodType<T>,
    options
  );
};

/**
 * Export all schema-related utilities
 */
export default {
  registerSchema,
  getSchema,
  getAllSchemas,
  getAllTypes,
  getLatestVersion,
  findCompatibleVersion,
  checkCompatibility,
  generateDocumentation,
  setDefaultCompatibilityLevel,
  getDefaultCompatibilityLevel,
  clearSchemaRegistry,
  removeSchema,
  hasSchema,
  getSchemaCount,
  validateEvent,
  createEventFactory,
  createVersionedSchema,
  SchemaCompatibilityLevel,
};