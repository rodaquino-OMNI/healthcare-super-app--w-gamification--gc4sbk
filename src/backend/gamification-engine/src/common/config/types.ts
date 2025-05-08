/**
 * Common types used across configuration modules in the gamification engine.
 * This file centralizes type definitions to ensure consistency and reusability.
 */

/**
 * Environment type for configuration.
 * Used to determine environment-specific configuration settings.
 */
export type Environment = 'development' | 'test' | 'staging' | 'production';

/**
 * Configuration provider interface.
 * Defines the contract for configuration providers that can be registered
 * with the NestJS ConfigModule.
 */
export interface ConfigProvider<T> {
  /**
   * The configuration key used to register this provider.
   */
  KEY: string;
  
  /**
   * Factory function that returns the configuration object.
   */
  factory: () => T;
  
  /**
   * Validates the configuration object.
   * @param config The configuration object to validate
   * @returns The validated configuration object
   */
  validate: (config: Partial<T>) => T;
  
  /**
   * Creates a configuration object for a specific environment.
   * @param env The environment to create the configuration for
   * @param overrides Optional configuration overrides
   * @returns A configuration object for the specified environment
   */
  forEnvironment: (env: Environment, overrides?: Partial<T>) => T;
}

/**
 * Base configuration interface with common properties.
 * All configuration interfaces should extend this base interface.
 */
export interface BaseConfig {
  /**
   * Whether this configuration is enabled.
   */
  enabled?: boolean;
}

/**
 * Configuration for feature flags.
 * Used to enable or disable features in the application.
 */
export interface FeatureFlags {
  [key: string]: boolean;
}

/**
 * Configuration for environment variables.
 * Defines the structure of environment variables used in the application.
 */
export interface EnvironmentVariables {
  /**
   * The current environment (development, test, staging, production).
   */
  NODE_ENV?: string;
  
  /**
   * The port to listen on.
   */
  PORT?: string;
  
  /**
   * The API prefix for all routes.
   */
  API_PREFIX?: string;
  
  /**
   * Whether to enable debug mode.
   */
  DEBUG?: string;
  
  /**
   * The log level to use.
   */
  LOG_LEVEL?: string;
  
  /**
   * Whether to enable feature flags.
   */
  FEATURE_FLAGS?: string;
  
  /**
   * Whether to enable tracing.
   */
  TRACING_ENABLED?: string;
  
  /**
   * Whether to enable metrics.
   */
  METRICS_ENABLED?: string;
  
  /**
   * Whether to enable health checks.
   */
  HEALTH_CHECKS_ENABLED?: string;
}