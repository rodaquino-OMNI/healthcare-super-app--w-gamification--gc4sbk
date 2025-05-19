/**
 * @file schema-utils.ts
 * @description Provides utilities for working with event schemas, including schema registration, retrieval, and versioning.
 * This module manages the schema registry for all event types, providing functions to register schemas, retrieve schemas
 * by type and version, and handle schema compatibility checks. It supports schema evolution while maintaining backward
 * compatibility and provides tools for generating documentation from schemas.
 */

import { z } from 'zod';
import { EventVersion } from '../interfaces/event-versioning.interface';

/**
 * Schema registry to store schemas by type and version
 * @internal
 */
const schemaRegistry = new Map<string, Map<EventVersion, z.ZodType<any>>>();

/**
 * Schema metadata registry to store additional information about schemas
 * @internal
 */
const schemaMetadataRegistry = new Map<string, Map<EventVersion, SchemaMetadata>>();

/**
 * Metadata for a schema version
 * @interface SchemaMetadata
 */
export interface SchemaMetadata {
  /**
   * Description of the schema
   */
  description?: string;
  
  /**
   * When this schema version was introduced
   */
  introducedAt: Date;
  
  /**
   * Whether this schema version is deprecated
   */
  deprecated?: boolean;
  
  /**
   * When this schema version was deprecated
   */
  deprecatedAt?: Date;
  
  /**
   * The journey this schema is associated with (health, care, plan)
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Additional tags for categorizing the schema
   */
  tags?: string[];
  
  /**
   * Example data that conforms to this schema
   */
  examples?: any[];
}

/**
 * Options for registering a schema
 * @interface RegisterSchemaOptions
 */
export interface RegisterSchemaOptions {
  /**
   * The type of the event
   */
  type: string;
  
  /**
   * The version of the schema
   */
  version: EventVersion;
  
  /**
   * The schema to register
   */
  schema: z.ZodType<any>;
  
  /**
   * Metadata for the schema
   */
  metadata?: Partial<SchemaMetadata>;
}

/**
 * Options for retrieving a schema
 * @interface GetSchemaOptions
 */
export interface GetSchemaOptions {
  /**
   * The type of the event
   */
  type: string;
  
  /**
   * The version of the schema (optional, defaults to latest)
   */
  version?: EventVersion;
}

/**
 * Result of a compatibility check between schema versions
 * @interface CompatibilityCheckResult
 */
export interface CompatibilityCheckResult {
  /**
   * Whether the schemas are compatible
   */
  compatible: boolean;
  
  /**
   * The type of compatibility
   */
  compatibilityType?: 'backward' | 'forward' | 'full' | 'none';
  
  /**
   * Reasons for incompatibility, if any
   */
  incompatibilityReasons?: string[];
}

/**
 * Registers a schema in the schema registry
 * @param options Options for registering the schema
 * @returns void
 * @throws Error if a schema with the same type and version already exists
 */
export function registerSchema(options: RegisterSchemaOptions): void {
  const { type, version, schema, metadata = {} } = options;
  
  // Initialize type map if it doesn't exist
  if (!schemaRegistry.has(type)) {
    schemaRegistry.set(type, new Map<EventVersion, z.ZodType<any>>());
    schemaMetadataRegistry.set(type, new Map<EventVersion, SchemaMetadata>());
  }
  
  const typeMap = schemaRegistry.get(type)!;
  const metadataMap = schemaMetadataRegistry.get(type)!;
  
  // Check if schema already exists
  if (typeMap.has(version)) {
    throw new Error(`Schema for type '${type}' and version '${version}' already exists`);
  }
  
  // Register schema
  typeMap.set(version, schema);
  
  // Register metadata
  metadataMap.set(version, {
    introducedAt: new Date(),
    ...metadata,
  });
}

/**
 * Retrieves a schema from the schema registry
 * @param options Options for retrieving the schema
 * @returns The schema, or undefined if not found
 */
export function getSchema(options: GetSchemaOptions): z.ZodType<any> | undefined {
  const { type, version } = options;
  
  // Check if type exists
  if (!schemaRegistry.has(type)) {
    return undefined;
  }
  
  const typeMap = schemaRegistry.get(type)!;
  
  // If version is specified, return that version
  if (version !== undefined) {
    return typeMap.get(version);
  }
  
  // Otherwise, return the latest version
  const versions = Array.from(typeMap.keys()).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);
    
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });
  
  if (versions.length === 0) {
    return undefined;
  }
  
  return typeMap.get(versions[0]);
}

/**
 * Retrieves schema metadata from the schema registry
 * @param options Options for retrieving the schema
 * @returns The schema metadata, or undefined if not found
 */
export function getSchemaMetadata(options: GetSchemaOptions): SchemaMetadata | undefined {
  const { type, version } = options;
  
  // Check if type exists
  if (!schemaMetadataRegistry.has(type)) {
    return undefined;
  }
  
  const metadataMap = schemaMetadataRegistry.get(type)!;
  
  // If version is specified, return that version
  if (version !== undefined) {
    return metadataMap.get(version);
  }
  
  // Otherwise, return the latest version
  const versions = Array.from(metadataMap.keys()).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);
    
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });
  
  if (versions.length === 0) {
    return undefined;
  }
  
  return metadataMap.get(versions[0]);
}

/**
 * Lists all registered schema types
 * @returns Array of schema types
 */
export function listSchemaTypes(): string[] {
  return Array.from(schemaRegistry.keys());
}

/**
 * Lists all versions for a given schema type
 * @param type The schema type
 * @returns Array of versions, or empty array if type not found
 */
export function listSchemaVersions(type: string): EventVersion[] {
  if (!schemaRegistry.has(type)) {
    return [];
  }
  
  const typeMap = schemaRegistry.get(type)!;
  return Array.from(typeMap.keys()).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);
    
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  });
}

/**
 * Checks if a schema exists in the registry
 * @param options Options for checking the schema
 * @returns True if the schema exists, false otherwise
 */
export function hasSchema(options: GetSchemaOptions): boolean {
  const { type, version } = options;
  
  // Check if type exists
  if (!schemaRegistry.has(type)) {
    return false;
  }
  
  const typeMap = schemaRegistry.get(type)!;
  
  // If version is specified, check that version
  if (version !== undefined) {
    return typeMap.has(version);
  }
  
  // Otherwise, check if any version exists
  return typeMap.size > 0;
}

/**
 * Checks compatibility between two schema versions
 * @param sourceType The source schema type
 * @param sourceVersion The source schema version
 * @param targetType The target schema type
 * @param targetVersion The target schema version
 * @returns Result of the compatibility check
 */
export function checkSchemaCompatibility(
  sourceType: string,
  sourceVersion: EventVersion,
  targetType: string,
  targetVersion: EventVersion
): CompatibilityCheckResult {
  // Check if schemas exist
  const sourceSchema = getSchema({ type: sourceType, version: sourceVersion });
  const targetSchema = getSchema({ type: targetType, version: targetVersion });
  
  if (!sourceSchema || !targetSchema) {
    return {
      compatible: false,
      compatibilityType: 'none',
      incompatibilityReasons: ['One or both schemas do not exist'],
    };
  }
  
  // If types are different, they are not compatible
  if (sourceType !== targetType) {
    return {
      compatible: false,
      compatibilityType: 'none',
      incompatibilityReasons: ['Schema types are different'],
    };
  }
  
  // Parse versions
  const [sourceMajor] = parseVersion(sourceVersion);
  const [targetMajor] = parseVersion(targetVersion);
  
  // If major versions are different, they are not compatible
  if (sourceMajor !== targetMajor) {
    return {
      compatible: false,
      compatibilityType: 'none',
      incompatibilityReasons: ['Major versions are different'],
    };
  }
  
  // For same major version, check backward compatibility
  try {
    // Check if target schema can parse data from source schema
    // This is a basic check and may not catch all incompatibilities
    const sampleData = generateSampleData(sourceSchema);
    targetSchema.parse(sampleData);
    
    // Check if source schema can parse data from target schema
    const targetSampleData = generateSampleData(targetSchema);
    sourceSchema.parse(targetSampleData);
    
    return {
      compatible: true,
      compatibilityType: 'full',
    };
  } catch (error) {
    try {
      // Check backward compatibility (target can parse source)
      const sampleData = generateSampleData(sourceSchema);
      targetSchema.parse(sampleData);
      
      return {
        compatible: true,
        compatibilityType: 'backward',
      };
    } catch (backwardError) {
      try {
        // Check forward compatibility (source can parse target)
        const targetSampleData = generateSampleData(targetSchema);
        sourceSchema.parse(targetSampleData);
        
        return {
          compatible: true,
          compatibilityType: 'forward',
        };
      } catch (forwardError) {
        return {
          compatible: false,
          compatibilityType: 'none',
          incompatibilityReasons: [
            error instanceof Error ? error.message : String(error),
          ],
        };
      }
    }
  }
}

/**
 * Generates documentation for a schema
 * @param options Options for retrieving the schema
 * @returns Documentation object, or undefined if schema not found
 */
export function generateSchemaDocumentation(options: GetSchemaOptions): Record<string, any> | undefined {
  const { type, version } = options;
  
  const schema = getSchema(options);
  const metadata = getSchemaMetadata(options);
  
  if (!schema || !metadata) {
    return undefined;
  }
  
  // Generate documentation
  const documentation: Record<string, any> = {
    type,
    version,
    description: metadata.description || '',
    introducedAt: metadata.introducedAt.toISOString(),
    deprecated: metadata.deprecated || false,
  };
  
  if (metadata.deprecatedAt) {
    documentation.deprecatedAt = metadata.deprecatedAt.toISOString();
  }
  
  if (metadata.journey) {
    documentation.journey = metadata.journey;
  }
  
  if (metadata.tags && metadata.tags.length > 0) {
    documentation.tags = metadata.tags;
  }
  
  if (metadata.examples && metadata.examples.length > 0) {
    documentation.examples = metadata.examples;
  }
  
  // Add schema structure
  documentation.schema = describeZodSchema(schema);
  
  return documentation;
}

/**
 * Generates a sample data object that conforms to the given schema
 * This is a simplified implementation and may not work for all schema types
 * @param schema The schema to generate sample data for
 * @returns Sample data object
 * @internal
 */
function generateSampleData(schema: z.ZodType<any>): any {
  // This is a simplified implementation
  // In a real-world scenario, you would use a more robust approach
  // such as zod-fast-check or a similar library
  
  if (schema instanceof z.ZodObject) {
    const shape = (schema as any)._def.shape();
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(shape)) {
      result[key] = generateSampleData(value);
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodArray) {
    const elementSchema = (schema as any)._def.type;
    return [generateSampleData(elementSchema)];
  }
  
  if (schema instanceof z.ZodString) {
    return 'sample';
  }
  
  if (schema instanceof z.ZodNumber) {
    return 0;
  }
  
  if (schema instanceof z.ZodBoolean) {
    return false;
  }
  
  if (schema instanceof z.ZodEnum) {
    const values = (schema as any)._def.values;
    return values[0];
  }
  
  if (schema instanceof z.ZodLiteral) {
    return (schema as any)._def.value;
  }
  
  if (schema instanceof z.ZodUnion) {
    const options = (schema as any)._def.options;
    return generateSampleData(options[0]);
  }
  
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return generateSampleData((schema as any)._def.innerType);
  }
  
  // Default fallback
  return {};
}

/**
 * Describes a Zod schema in a human-readable format
 * @param schema The schema to describe
 * @returns Description object
 * @internal
 */
function describeZodSchema(schema: z.ZodType<any>): Record<string, any> {
  if (schema instanceof z.ZodObject) {
    const shape = (schema as any)._def.shape();
    const result: Record<string, any> = {
      type: 'object',
      properties: {},
    };
    
    for (const [key, value] of Object.entries(shape)) {
      result.properties[key] = describeZodSchema(value);
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodArray) {
    const elementSchema = (schema as any)._def.type;
    return {
      type: 'array',
      items: describeZodSchema(elementSchema),
    };
  }
  
  if (schema instanceof z.ZodString) {
    const result: Record<string, any> = { type: 'string' };
    
    // Add string constraints if available
    const def = (schema as any)._def;
    if (def.minLength !== null) result.minLength = def.minLength;
    if (def.maxLength !== null) result.maxLength = def.maxLength;
    
    // Check for string patterns
    const checks = def.checks || [];
    for (const check of checks) {
      if (check.kind === 'regex') result.pattern = check.regex.source;
      if (check.kind === 'email') result.format = 'email';
      if (check.kind === 'url') result.format = 'uri';
      if (check.kind === 'uuid') result.format = 'uuid';
      if (check.kind === 'datetime') result.format = 'date-time';
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodNumber) {
    const result: Record<string, any> = { type: 'number' };
    
    // Add number constraints if available
    const def = (schema as any)._def;
    const checks = def.checks || [];
    for (const check of checks) {
      if (check.kind === 'min') result.minimum = check.value;
      if (check.kind === 'max') result.maximum = check.value;
      if (check.kind === 'int') result.type = 'integer';
    }
    
    return result;
  }
  
  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }
  
  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: (schema as any)._def.values,
    };
  }
  
  if (schema instanceof z.ZodLiteral) {
    const value = (schema as any)._def.value;
    return {
      type: typeof value,
      const: value,
    };
  }
  
  if (schema instanceof z.ZodUnion) {
    const options = (schema as any)._def.options;
    return {
      oneOf: options.map((option: z.ZodType<any>) => describeZodSchema(option)),
    };
  }
  
  if (schema instanceof z.ZodOptional) {
    const innerType = (schema as any)._def.innerType;
    return {
      ...describeZodSchema(innerType),
      nullable: true,
    };
  }
  
  if (schema instanceof z.ZodNullable) {
    const innerType = (schema as any)._def.innerType;
    return {
      ...describeZodSchema(innerType),
      nullable: true,
    };
  }
  
  // Default fallback
  return { type: 'unknown' };
}

/**
 * Parses a version string into its components
 * @param version The version string to parse
 * @returns Array of [major, minor, patch] as numbers
 * @internal
 */
function parseVersion(version: EventVersion): [number, number, number] {
  const parts = version.split('.');
  const major = parseInt(parts[0], 10) || 0;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;
  
  return [major, minor, patch];
}