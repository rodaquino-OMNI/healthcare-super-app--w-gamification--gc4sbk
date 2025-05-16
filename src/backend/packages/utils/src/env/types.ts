/**
 * Environment Variable Type Definitions
 * 
 * This module provides TypeScript type definitions for the environment variables system,
 * including interfaces and types for strongly-typed environment variable access and validation.
 */

import { z } from 'zod';
import { JourneyType } from './journey';

/**
 * Represents the possible types of environment variables
 */
export type EnvVarType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'json'
  | 'url'
  | 'enum'
  | 'duration'
  | 'port'
  | 'host';

/**
 * Represents the mapping between environment variable types and their TypeScript types
 */
export interface EnvVarTypeMap {
  string: string;
  number: number;
  boolean: boolean;
  array: string[];
  json: Record<string, any>;
  url: URL;
  enum: string;
  duration: number;
  port: number;
  host: string;
}

/**
 * Generic type for environment variable accessor functions
 */
export type EnvAccessor<T> = () => T;

/**
 * Generic type for environment variable validator functions
 */
export type EnvValidator<T> = () => T;

/**
 * Generic type for environment variable transformer functions
 */
export type EnvTransformer<T> = (value: string) => T;

/**
 * Options for environment variable validation
 */
export interface EnvValidationOptions {
  required?: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

/**
 * Schema definition for an environment variable
 */
export interface EnvVarSchema<T = any> {
  type: EnvVarType;
  required?: boolean;
  defaultValue?: string;
  description?: string;
  validator?: (value: string) => boolean;
  transform?: (value: string) => T;
  options?: Record<string, any>;
}

/**
 * Schema definition for a service's environment configuration
 */
export interface EnvSchema {
  [key: string]: EnvVarSchema;
}

/**
 * Type for a resolved environment configuration based on a schema
 */
export type ResolvedEnvConfig<T extends EnvSchema> = {
  [K in keyof T]: ReturnType<EnvAccessor<InferEnvVarType<T[K]>>>
};

/**
 * Infers the TypeScript type from an environment variable schema
 */
export type InferEnvVarType<T extends EnvVarSchema> = 
  T extends EnvVarSchema<infer U> ? U : never;

/**
 * Type guard to check if a value is a string
 * 
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 * 
 * @param value - The value to check
 * @returns True if the value is a number, false otherwise
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 * 
 * @param value - The value to check
 * @returns True if the value is a boolean, false otherwise
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is an array
 * 
 * @param value - The value to check
 * @returns True if the value is an array, false otherwise
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a string array
 * 
 * @param value - The value to check
 * @returns True if the value is a string array, false otherwise
 */
export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

/**
 * Type guard to check if a value is a number array
 * 
 * @param value - The value to check
 * @returns True if the value is a number array, false otherwise
 */
export function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every(isNumber);
}

/**
 * Type guard to check if a value is a URL
 * 
 * @param value - The value to check
 * @returns True if the value is a URL, false otherwise
 */
export function isUrl(value: unknown): value is URL {
  return value instanceof URL;
}

/**
 * Type guard to check if a value is a record (object)
 * 
 * @param value - The value to check
 * @returns True if the value is a record, false otherwise
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !isArray(value) && !(value instanceof URL);
}

/**
 * Interface for environment variable accessor options
 */
export interface EnvAccessorOptions<T> {
  defaultValue?: T;
  required?: boolean;
  transform?: (value: string) => T;
  validate?: (value: T) => boolean;
  cache?: boolean;
}

/**
 * Interface for journey-specific environment configuration
 */
export interface JourneyEnvConfig {
  journeyType: JourneyType;
  variables: Record<string, EnvVarSchema>;
  features?: Record<string, boolean | number>;
}

/**
 * Interface for feature flag configuration
 */
export interface FeatureFlagConfig {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  journeyType?: JourneyType;
  description?: string;
}

/**
 * Interface for database connection configuration
 */
export interface DatabaseConfig {
  url: string;
  poolSize?: number;
  maxConnections?: number;
  minConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean;
  schema?: string;
}

/**
 * Interface for Redis connection configuration
 */
export interface RedisConfig {
  url: string;
  password?: string;
  database?: number;
  keyPrefix?: string;
  tls?: boolean;
  maxRetriesPerRequest?: number;
}

/**
 * Interface for Kafka configuration
 */
export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId?: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

/**
 * Interface for retry policy configuration
 */
export interface RetryPolicyConfig {
  attempts: number;
  delay: number;
  backoff: number;
  maxDelay?: number;
}

/**
 * Interface for logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  format?: 'json' | 'pretty';
  destination?: 'stdout' | 'file';
  filePath?: string;
  includeTimestamp?: boolean;
  includeRequestId?: boolean;
  includeJourneyContext?: boolean;
}

/**
 * Interface for CORS configuration
 */
export interface CorsConfig {
  origins: string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Interface for JWT configuration
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string | number;
  refreshExpiresIn?: string | number;
  issuer?: string;
  audience?: string;
}

/**
 * Interface for service health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean;
  path?: string;
  interval?: number;
  timeout?: number;
  startupDelay?: number;
}

/**
 * Interface for monitoring configuration
 */
export interface MonitoringConfig {
  metrics?: {
    enabled: boolean;
    path?: string;
    defaultLabels?: Record<string, string>;
  };
  tracing?: {
    enabled: boolean;
    serviceName: string;
    sampleRate?: number;
  };
}

/**
 * Interface for complete application environment configuration
 */
export interface AppEnvConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'test' | 'staging' | 'production';
    port: number;
    host: string;
    baseUrl?: string;
  };
  database?: DatabaseConfig;
  redis?: RedisConfig;
  kafka?: KafkaConfig;
  logging: LoggingConfig;
  cors?: CorsConfig;
  jwt?: JwtConfig;
  health?: HealthCheckConfig;
  monitoring?: MonitoringConfig;
  retryPolicy?: RetryPolicyConfig;
  journeys?: {
    health?: JourneyEnvConfig;
    care?: JourneyEnvConfig;
    plan?: JourneyEnvConfig;
  };
  features?: Record<string, FeatureFlagConfig>;
  [key: string]: any; // Allow for additional custom configuration
}

/**
 * Type for Zod schema validation of environment variables
 */
export type ZodEnvSchema<T> = z.ZodType<T>;

/**
 * Type for environment variable validation result
 */
export interface EnvValidationResult {
  valid: boolean;
  errors?: string[];
  value?: any;
}

/**
 * Type for environment variable validation function
 */
export type EnvValidationFn<T> = (value: string) => EnvValidationResult & { value: T };

/**
 * Type for environment variable schema validation function
 */
export type EnvSchemaValidationFn<T extends EnvSchema> = () => ResolvedEnvConfig<T>;

/**
 * Type for environment variable batch validation function
 */
export type EnvBatchValidationFn = () => void;

/**
 * Type for journey-specific environment variable accessor
 */
export type JourneyEnvAccessor<T> = (journeyType: JourneyType, variableName: string, defaultValue?: string) => T;

/**
 * Type for environment variable with metadata
 */
export interface EnvVarWithMetadata<T = any> {
  name: string;
  value: T;
  type: EnvVarType;
  required: boolean;
  description?: string;
  defaultValue?: string;
  journeyType?: JourneyType;
}

/**
 * Type for environment variable documentation
 */
export interface EnvVarDocumentation {
  name: string;
  type: EnvVarType;
  required: boolean;
  description?: string;
  defaultValue?: string;
  example?: string;
  journeyType?: JourneyType;
}

/**
 * Type for environment variable schema documentation
 */
export interface EnvSchemaDocumentation {
  serviceName: string;
  description?: string;
  variables: EnvVarDocumentation[];
}