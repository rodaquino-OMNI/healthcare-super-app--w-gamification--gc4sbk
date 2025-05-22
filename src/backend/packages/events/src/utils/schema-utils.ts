/**
 * @file Schema utilities for event schema management, versioning, and validation
 * 
 * This module provides utilities for working with event schemas, including schema
 * registration, retrieval, versioning, and validation. It manages the schema registry
 * for all event types, providing functions to register schemas, retrieve schemas by
 * type and version, and handle schema compatibility checks.
 * 
 * It supports schema evolution while maintaining backward compatibility and provides
 * tools for generating documentation from schemas.
 */

import { z } from 'zod';
import { EventVersion } from '../interfaces/event-versioning.interface';
import { ValidationResult } from '../interfaces/event-validation.interface';
import { LATEST_VERSION, MIN_SUPPORTED_VERSION } from '../versioning/constants';
import { VersionDetectionError, SchemaCompatibilityError } from '../versioning/errors';
import { ParsedVersion } from '../versioning/types';

/**
 * Schema registry entry containing schema and metadata
 */
interface SchemaRegistryEntry {
  /** The Zod schema for validation */
  schema: z.ZodType<any>;
  /** Schema version information */
  version: EventVersion;
  /** Documentation for the schema */
  documentation?: string;
  /** When this schema version was added */
  addedAt: Date;
  /** When this schema version was deprecated (if applicable) */
  deprecatedAt?: Date;
}

/**
 * Schema registry mapping event types to their versioned schemas
 */
interface SchemaRegistry {
  [eventType: string]: {
    [version: string]: SchemaRegistryEntry;
  };
}

/**
 * Options for schema registration
 */
interface RegisterSchemaOptions {
  /** Documentation for the schema */
  documentation?: string;
  /** Whether this schema version deprecates previous versions */
  deprecatesPrevious?: boolean;
}

/**
 * Options for schema validation
 */
interface ValidateOptions {
  /** Whether to throw an error on validation failure (default: false) */
  throwOnError?: boolean;
  /** Whether to allow additional properties not defined in the schema (default: false) */
  allowAdditionalProperties?: boolean;
}

/**
 * Options for schema compatibility checking
 */
interface CompatibilityOptions {
  /** Whether to use strict compatibility checking (default: false) */
  strict?: boolean;
}

/**
 * Schema documentation generation options
 */
interface DocumentationOptions {
  /** Format of the documentation (default: 'markdown') */
  format?: 'markdown' | 'html' | 'json';
  /** Whether to include examples in the documentation (default: true) */
  includeExamples?: boolean;
  /** Whether to include deprecated schemas in the documentation (default: false) */
  includeDeprecated?: boolean;
}

// The global schema registry
const schemaRegistry: SchemaRegistry = {};

/**
 * Parses a version string into its components
 * 
 * @param version - Version string in format 'major.minor.patch'
 * @returns Parsed version with numeric components
 * @throws Error if version format is invalid
 */
export function parseVersion(version: string): ParsedVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new VersionDetectionError(
      `Invalid version format: ${version}. Expected format: major.minor.patch`,
      { version }
    );
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    raw: version
  };
}

/**
 * Formats a parsed version back to a string
 * 
 * @param version - Parsed version object
 * @returns Version string in format 'major.minor.patch'
 */
export function formatVersion(version: ParsedVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compares two versions for ordering
 * 
 * @param versionA - First version to compare
 * @param versionB - Second version to compare
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
export function compareVersions(versionA: string, versionB: string): number {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);
  
  if (parsedA.major !== parsedB.major) {
    return parsedA.major < parsedB.major ? -1 : 1;
  }
  
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor < parsedB.minor ? -1 : 1;
  }
  
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch < parsedB.patch ? -1 : 1;
  }
  
  return 0;
}

/**
 * Checks if two versions are compatible
 * 
 * @param requiredVersion - Version required by consumer
 * @param actualVersion - Actual version of the event
 * @param options - Compatibility checking options
 * @returns Whether the versions are compatible
 */
export function areVersionsCompatible(
  requiredVersion: string,
  actualVersion: string,
  options: CompatibilityOptions = {}
): boolean {
  const { strict = false } = options;
  const parsedRequired = parseVersion(requiredVersion);
  const parsedActual = parseVersion(actualVersion);
  
  // In strict mode, versions must match exactly
  if (strict) {
    return parsedRequired.major === parsedActual.major &&
           parsedRequired.minor === parsedActual.minor &&
           parsedRequired.patch === parsedActual.patch;
  }
  
  // Major versions must match for compatibility
  if (parsedRequired.major !== parsedActual.major) {
    return false;
  }
  
  // If actual minor version is greater, it should be backward compatible
  if (parsedActual.minor > parsedRequired.minor) {
    return true;
  }
  
  // If minor versions match, actual patch should be >= required patch
  if (parsedActual.minor === parsedRequired.minor) {
    return parsedActual.patch >= parsedRequired.patch;
  }
  
  // Actual minor version is less than required, not compatible
  return false;
}

/**
 * Registers a schema for a specific event type and version
 * 
 * @param eventType - Type of the event
 * @param version - Version of the schema
 * @param schema - Zod schema for validation
 * @param options - Registration options
 * @returns The registered schema entry
 */
export function registerSchema(
  eventType: string,
  version: string,
  schema: z.ZodType<any>,
  options: RegisterSchemaOptions = {}
): SchemaRegistryEntry {
  const { documentation, deprecatesPrevious = false } = options;
  
  // Initialize registry for this event type if it doesn't exist
  if (!schemaRegistry[eventType]) {
    schemaRegistry[eventType] = {};
  }
  
  // Create the schema entry
  const entry: SchemaRegistryEntry = {
    schema,
    version: { version },
    documentation,
    addedAt: new Date()
  };
  
  // Register the schema
  schemaRegistry[eventType][version] = entry;
  
  // Deprecate previous versions if specified
  if (deprecatesPrevious) {
    const parsedVersion = parseVersion(version);
    
    Object.keys(schemaRegistry[eventType]).forEach(existingVersion => {
      const parsedExisting = parseVersion(existingVersion);
      
      // Only deprecate older versions
      if (compareVersions(existingVersion, version) < 0) {
        schemaRegistry[eventType][existingVersion].deprecatedAt = new Date();
      }
    });
  }
  
  return entry;
}

/**
 * Gets a schema for a specific event type and version
 * 
 * @param eventType - Type of the event
 * @param version - Version of the schema (defaults to latest)
 * @returns The schema entry or undefined if not found
 */
export function getSchema(
  eventType: string,
  version?: string
): SchemaRegistryEntry | undefined {
  // If registry doesn't have this event type, return undefined
  if (!schemaRegistry[eventType]) {
    return undefined;
  }
  
  // If version is specified, return that specific version
  if (version) {
    return schemaRegistry[eventType][version];
  }
  
  // Otherwise, find the latest version
  const versions = Object.keys(schemaRegistry[eventType]);
  if (versions.length === 0) {
    return undefined;
  }
  
  // Sort versions in descending order and return the latest
  versions.sort((a, b) => compareVersions(b, a));
  return schemaRegistry[eventType][versions[0]];
}

/**
 * Gets all registered schemas for an event type
 * 
 * @param eventType - Type of the event
 * @param includeDeprecated - Whether to include deprecated schemas
 * @returns Array of schema entries
 */
export function getAllSchemas(
  eventType: string,
  includeDeprecated: boolean = false
): SchemaRegistryEntry[] {
  if (!schemaRegistry[eventType]) {
    return [];
  }
  
  return Object.values(schemaRegistry[eventType])
    .filter(entry => includeDeprecated || !entry.deprecatedAt)
    .sort((a, b) => compareVersions(b.version.version, a.version.version));
}

/**
 * Gets all registered event types
 * 
 * @returns Array of event types
 */
export function getAllEventTypes(): string[] {
  return Object.keys(schemaRegistry);
}

/**
 * Validates an event against its schema
 * 
 * @param eventType - Type of the event
 * @param data - Event data to validate
 * @param version - Version of the schema to validate against (defaults to latest)
 * @param options - Validation options
 * @returns Validation result
 * @throws Error if throwOnError is true and validation fails
 */
export function validateEvent(
  eventType: string,
  data: unknown,
  version?: string,
  options: ValidateOptions = {}
): ValidationResult {
  const { throwOnError = false, allowAdditionalProperties = false } = options;
  
  // Get the schema
  const schemaEntry = getSchema(eventType, version);
  if (!schemaEntry) {
    const error = new Error(`No schema found for event type '${eventType}'${version ? ` version ${version}` : ''}`);
    if (throwOnError) {
      throw error;
    }
    return { success: false, error };
  }
  
  try {
    // Validate the data against the schema
    let schema = schemaEntry.schema;
    
    // If additional properties are allowed, use passthrough
    if (allowAdditionalProperties && schema instanceof z.ZodObject) {
      schema = schema.passthrough();
    }
    
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const error = new Error(`Validation failed for event type '${eventType}': ${result.error.message}`);
      if (throwOnError) {
        throw error;
      }
      return { success: false, error, details: result.error.format() };
    }
  } catch (error) {
    if (throwOnError) {
      throw error;
    }
    return { success: false, error: error as Error };
  }
}

/**
 * Checks if a schema is compatible with another schema
 * 
 * @param sourceSchema - Source schema
 * @param targetSchema - Target schema to check compatibility with
 * @param options - Compatibility checking options
 * @returns Whether the schemas are compatible
 */
export function areSchemaCompatible(
  sourceSchema: z.ZodType<any>,
  targetSchema: z.ZodType<any>,
  options: CompatibilityOptions = {}
): boolean {
  // This is a simplified implementation
  // A real implementation would need to analyze the schema structures
  // and determine if they are compatible based on the changes
  
  // For now, we'll just check if the schemas are the same type
  return sourceSchema.constructor === targetSchema.constructor;
}

/**
 * Generates documentation for a schema
 * 
 * @param eventType - Type of the event
 * @param version - Version of the schema (defaults to latest)
 * @param options - Documentation generation options
 * @returns Generated documentation string
 */
export function generateSchemaDocumentation(
  eventType: string,
  version?: string,
  options: DocumentationOptions = {}
): string {
  const { format = 'markdown', includeExamples = true, includeDeprecated = false } = options;
  
  // Get the schema
  const schemaEntry = getSchema(eventType, version);
  if (!schemaEntry) {
    return `No schema found for event type '${eventType}'${version ? ` version ${version}` : ''}`;
  }
  
  // Generate documentation based on format
  switch (format) {
    case 'markdown':
      return generateMarkdownDocumentation(eventType, schemaEntry, includeExamples);
    case 'html':
      return generateHtmlDocumentation(eventType, schemaEntry, includeExamples);
    case 'json':
      return generateJsonDocumentation(eventType, schemaEntry, includeExamples);
    default:
      return `Unsupported documentation format: ${format}`;
  }
}

/**
 * Generates Markdown documentation for a schema
 * 
 * @param eventType - Type of the event
 * @param schemaEntry - Schema registry entry
 * @param includeExamples - Whether to include examples
 * @returns Markdown documentation string
 */
function generateMarkdownDocumentation(
  eventType: string,
  schemaEntry: SchemaRegistryEntry,
  includeExamples: boolean
): string {
  let doc = `# ${eventType} (v${schemaEntry.version.version})\n\n`;
  
  if (schemaEntry.documentation) {
    doc += `${schemaEntry.documentation}\n\n`;
  }
  
  doc += `**Added:** ${schemaEntry.addedAt.toISOString()}\n\n`;
  
  if (schemaEntry.deprecatedAt) {
    doc += `**Deprecated:** ${schemaEntry.deprecatedAt.toISOString()}\n\n`;
    doc += `> ⚠️ This schema version is deprecated. Please use the latest version.\n\n`;
  }
  
  // Add schema structure
  doc += `## Schema Structure\n\n`;
  doc += `\`\`\`typescript\n`;
  doc += generateTypeScriptDefinition(schemaEntry.schema);
  doc += `\n\`\`\`\n\n`;
  
  // Add examples if requested
  if (includeExamples) {
    doc += `## Example\n\n`;
    doc += `\`\`\`json\n`;
    doc += generateSchemaExample(schemaEntry.schema);
    doc += `\n\`\`\`\n\n`;
  }
  
  return doc;
}

/**
 * Generates HTML documentation for a schema
 * 
 * @param eventType - Type of the event
 * @param schemaEntry - Schema registry entry
 * @param includeExamples - Whether to include examples
 * @returns HTML documentation string
 */
function generateHtmlDocumentation(
  eventType: string,
  schemaEntry: SchemaRegistryEntry,
  includeExamples: boolean
): string {
  // Simplified implementation
  let doc = `<h1>${eventType} (v${schemaEntry.version.version})</h1>`;
  
  if (schemaEntry.documentation) {
    doc += `<p>${schemaEntry.documentation}</p>`;
  }
  
  doc += `<p><strong>Added:</strong> ${schemaEntry.addedAt.toISOString()}</p>`;
  
  if (schemaEntry.deprecatedAt) {
    doc += `<p><strong>Deprecated:</strong> ${schemaEntry.deprecatedAt.toISOString()}</p>`;
    doc += `<p class="warning">⚠️ This schema version is deprecated. Please use the latest version.</p>`;
  }
  
  // Add schema structure
  doc += `<h2>Schema Structure</h2>`;
  doc += `<pre><code class="language-typescript">`;
  doc += generateTypeScriptDefinition(schemaEntry.schema);
  doc += `</code></pre>`;
  
  // Add examples if requested
  if (includeExamples) {
    doc += `<h2>Example</h2>`;
    doc += `<pre><code class="language-json">`;
    doc += generateSchemaExample(schemaEntry.schema);
    doc += `</code></pre>`;
  }
  
  return doc;
}

/**
 * Generates JSON documentation for a schema
 * 
 * @param eventType - Type of the event
 * @param schemaEntry - Schema registry entry
 * @param includeExamples - Whether to include examples
 * @returns JSON documentation string
 */
function generateJsonDocumentation(
  eventType: string,
  schemaEntry: SchemaRegistryEntry,
  includeExamples: boolean
): string {
  const doc = {
    eventType,
    version: schemaEntry.version.version,
    documentation: schemaEntry.documentation,
    addedAt: schemaEntry.addedAt.toISOString(),
    deprecatedAt: schemaEntry.deprecatedAt?.toISOString(),
    schema: generateSchemaDescription(schemaEntry.schema),
    example: includeExamples ? JSON.parse(generateSchemaExample(schemaEntry.schema)) : undefined
  };
  
  return JSON.stringify(doc, null, 2);
}

/**
 * Generates a TypeScript definition from a Zod schema
 * 
 * @param schema - Zod schema
 * @returns TypeScript definition string
 */
function generateTypeScriptDefinition(schema: z.ZodType<any>): string {
  // This is a simplified implementation
  // A real implementation would need to analyze the schema structure
  // and generate a proper TypeScript definition
  
  // For now, we'll just return a placeholder
  return `type ${schema.constructor.name.replace('Zod', '')} = any; // TODO: Generate proper TypeScript definition`;
}

/**
 * Generates an example from a Zod schema
 * 
 * @param schema - Zod schema
 * @returns JSON example string
 */
function generateSchemaExample(schema: z.ZodType<any>): string {
  // This is a simplified implementation
  // A real implementation would need to analyze the schema structure
  // and generate a proper example based on the schema
  
  // For now, we'll just return a placeholder
  return `{ "example": "TODO: Generate proper example" }`;
}

/**
 * Generates a description of a Zod schema
 * 
 * @param schema - Zod schema
 * @returns Schema description object
 */
function generateSchemaDescription(schema: z.ZodType<any>): Record<string, any> {
  // This is a simplified implementation
  // A real implementation would need to analyze the schema structure
  // and generate a proper description based on the schema
  
  // For now, we'll just return a placeholder
  return { type: schema.constructor.name.replace('Zod', '').toLowerCase() };
}

/**
 * Checks if a schema version is supported
 * 
 * @param version - Version to check
 * @returns Whether the version is supported
 */
export function isVersionSupported(version: string): boolean {
  return compareVersions(version, MIN_SUPPORTED_VERSION) >= 0;
}

/**
 * Gets the latest version for an event type
 * 
 * @param eventType - Type of the event
 * @returns Latest version or undefined if no schemas are registered
 */
export function getLatestVersion(eventType: string): string | undefined {
  if (!schemaRegistry[eventType]) {
    return undefined;
  }
  
  const versions = Object.keys(schemaRegistry[eventType]);
  if (versions.length === 0) {
    return undefined;
  }
  
  // Sort versions in descending order and return the latest
  versions.sort((a, b) => compareVersions(b, a));
  return versions[0];
}

/**
 * Gets all versions for an event type
 * 
 * @param eventType - Type of the event
 * @param includeDeprecated - Whether to include deprecated versions
 * @returns Array of versions
 */
export function getAllVersions(
  eventType: string,
  includeDeprecated: boolean = false
): string[] {
  if (!schemaRegistry[eventType]) {
    return [];
  }
  
  return Object.entries(schemaRegistry[eventType])
    .filter(([_, entry]) => includeDeprecated || !entry.deprecatedAt)
    .map(([version]) => version)
    .sort((a, b) => compareVersions(b, a));
}

/**
 * Checks if a schema exists for an event type and version
 * 
 * @param eventType - Type of the event
 * @param version - Version to check (defaults to latest)
 * @returns Whether the schema exists
 */
export function schemaExists(
  eventType: string,
  version?: string
): boolean {
  return getSchema(eventType, version) !== undefined;
}

/**
 * Removes a schema from the registry
 * 
 * @param eventType - Type of the event
 * @param version - Version to remove
 * @returns Whether the schema was removed
 */
export function removeSchema(
  eventType: string,
  version: string
): boolean {
  if (!schemaRegistry[eventType] || !schemaRegistry[eventType][version]) {
    return false;
  }
  
  delete schemaRegistry[eventType][version];
  
  // If no more versions exist for this event type, remove the event type
  if (Object.keys(schemaRegistry[eventType]).length === 0) {
    delete schemaRegistry[eventType];
  }
  
  return true;
}

/**
 * Clears all schemas from the registry
 */
export function clearSchemaRegistry(): void {
  Object.keys(schemaRegistry).forEach(eventType => {
    delete schemaRegistry[eventType];
  });
}

/**
 * Gets the number of registered schemas
 * 
 * @returns Number of registered schemas
 */
export function getSchemaCount(): number {
  return Object.values(schemaRegistry)
    .reduce((count, versions) => count + Object.keys(versions).length, 0);
}

/**
 * Gets the number of registered event types
 * 
 * @returns Number of registered event types
 */
export function getEventTypeCount(): number {
  return Object.keys(schemaRegistry).length;
}