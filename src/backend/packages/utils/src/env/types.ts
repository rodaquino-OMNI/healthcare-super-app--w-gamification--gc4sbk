/**
 * Type definitions for the environment variables system.
 * This file defines interfaces and types for strongly-typed environment variable access and validation.
 */

/**
 * Represents the possible primitive types that can be stored in environment variables
 * after transformation from their original string format.
 */
export type EnvVarPrimitiveType = string | number | boolean | string[] | number[] | Record<string, any>;

/**
 * Represents a validation schema for an environment variable.
 * This is used to define the expected type, validation rules, and transformation logic.
 */
export interface EnvVarSchema<T extends EnvVarPrimitiveType = string> {
  /** The name of the environment variable */
  name: string;
  /** Optional description of what this environment variable is used for */
  description?: string;
  /** Whether this environment variable is required or optional */
  required: boolean;
  /** The default value to use if the environment variable is not set and not required */
  defaultValue?: T;
  /** Function to transform the string value from process.env to the expected type */
  transform?: (value: string) => T;
  /** Function to validate the transformed value */
  validate?: (value: T) => boolean | string;
  /** The journey this environment variable belongs to, if applicable */
  journey?: JourneyType;
  /** Whether this environment variable should be masked in logs */
  sensitive?: boolean;
}

/**
 * Represents a collection of environment variable schemas grouped by category.
 */
export interface EnvVarSchemaMap {
  [category: string]: {
    [key: string]: EnvVarSchema<any>;
  };
}

/**
 * Represents the available journey types in the application.
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'common';

/**
 * Configuration for journey-specific environment variables.
 */
export interface JourneyConfig {
  /** The journey identifier */
  journey: JourneyType;
  /** The prefix to use for journey-specific environment variables */
  prefix: string;
  /** Default values for journey-specific environment variables */
  defaults?: Record<string, EnvVarPrimitiveType>;
}

/**
 * Type guard to check if a value is a string.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is an array of strings.
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Type guard to check if a value is an array of numbers.
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number' && !isNaN(item));
}

/**
 * Type guard to check if a value is a plain object.
 */
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Utility type to extract the value type from an environment variable schema.
 */
export type EnvVarType<T extends EnvVarSchema<any>> = T extends EnvVarSchema<infer U> ? U : never;

/**
 * Represents the result of validating an environment variable.
 */
export interface ValidationResult {
  /** Whether the validation was successful */
  valid: boolean;
  /** Error message if validation failed */
  message?: string;
  /** The name of the environment variable that failed validation */
  name?: string;
}

/**
 * Represents a collection of validation results for multiple environment variables.
 */
export interface ValidationResults {
  /** Whether all validations were successful */
  valid: boolean;
  /** Array of validation results for individual environment variables */
  results: ValidationResult[];
}

/**
 * Options for environment variable access functions.
 */
export interface EnvAccessOptions {
  /** Whether to cache the result */
  cache?: boolean;
  /** Whether to throw an error if the environment variable is not set */
  required?: boolean;
  /** The default value to use if the environment variable is not set */
  defaultValue?: EnvVarPrimitiveType;
  /** Function to transform the string value from process.env to the expected type */
  transform?: (value: string) => EnvVarPrimitiveType;
  /** Function to validate the transformed value */
  validate?: (value: EnvVarPrimitiveType) => boolean | string;
}

/**
 * Represents a strongly-typed environment configuration for a specific domain.
 */
export interface EnvConfig<T extends Record<string, EnvVarPrimitiveType>> {
  /** Get a typed environment variable value */
  get<K extends keyof T>(key: K): T[K];
  /** Get all environment variables as a typed object */
  getAll(): T;
  /** Validate all environment variables against their schemas */
  validate(): ValidationResults;
}

/**
 * Type for a function that creates a typed environment configuration.
 */
export type EnvConfigFactory = <T extends Record<string, EnvVarPrimitiveType>>(
  schemas: Record<keyof T, EnvVarSchema<any>>
) => EnvConfig<T>;

/**
 * Represents the structure of journey-specific environment variables.
 */
export interface JourneyEnvVars {
  health: Record<string, EnvVarPrimitiveType>;
  care: Record<string, EnvVarPrimitiveType>;
  plan: Record<string, EnvVarPrimitiveType>;
  common: Record<string, EnvVarPrimitiveType>;
}

/**
 * Type for environment variable transformation functions.
 */
export type EnvTransformer<T extends EnvVarPrimitiveType> = (value: string) => T;

/**
 * Type for environment variable validation functions.
 */
export type EnvValidator<T extends EnvVarPrimitiveType> = (value: T) => boolean | string;

/**
 * Represents a range constraint for numeric environment variables.
 */
export interface NumericRange {
  min?: number;
  max?: number;
}

/**
 * Options for parsing numeric environment variables.
 */
export interface ParseNumberOptions extends NumericRange {
  /** Whether to allow floating point numbers */
  allowFloat?: boolean;
  /** Whether to allow negative numbers */
  allowNegative?: boolean;
}

/**
 * Options for parsing array environment variables.
 */
export interface ParseArrayOptions {
  /** The delimiter to use when splitting the string */
  delimiter?: string;
  /** Whether to trim whitespace from array items */
  trim?: boolean;
  /** Whether to filter out empty items */
  filterEmpty?: boolean;
  /** Function to transform each item in the array */
  itemTransform?: (item: string) => any;
}

/**
 * Options for parsing JSON environment variables.
 */
export interface ParseJsonOptions {
  /** JSON schema for validation */
  schema?: Record<string, any>;
  /** Whether to allow partial matches against the schema */
  allowPartial?: boolean;
}

/**
 * Represents a cached environment variable.
 */
export interface CachedEnvVar<T extends EnvVarPrimitiveType> {
  /** The cached value */
  value: T;
  /** When the value was cached */
  timestamp: number;
  /** The TTL in milliseconds */
  ttl: number;
}

/**
 * Options for environment variable caching.
 */
export interface CacheOptions {
  /** Whether to enable caching */
  enabled: boolean;
  /** The TTL in milliseconds */
  ttl: number;
}

/**
 * Represents the environment variable cache.
 */
export interface EnvVarCache {
  [key: string]: CachedEnvVar<any>;
}