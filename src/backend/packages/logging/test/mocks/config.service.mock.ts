import { Injectable } from '@nestjs/common';
import { get, set, has as lodashHas } from 'lodash';

/**
 * Mock implementation of NestJS ConfigService for testing logging components.
 * Provides a configurable key-value store that can be preset with test values
 * and allows configuration changes during tests.
 *
 * This mock is critical for testing configuration-dependent behavior of the
 * logging system without relying on environment variables or config files.
 *
 * @example
 * // Create a mock with initial configuration
 * const configServiceMock = new ConfigServiceMock({
 *   logger: {
 *     level: 'debug',
 *     format: 'json',
 *     transports: ['console']
 *   }
 * });
 *
 * // Get a configuration value
 * const logLevel = configServiceMock.get<string>('logger.level');
 *
 * // Set a configuration value
 * configServiceMock.set('logger.level', 'info');
 *
 * // Reset the configuration
 * configServiceMock.reset();
 */
@Injectable()
export class ConfigServiceMock {
  private configStore: Record<string, any> = {};
  private accessedPaths: Set<string> = new Set();

  /**
   * Creates a new ConfigServiceMock instance with optional initial configuration.
   * 
   * @param initialConfig - Optional initial configuration object
   */
  constructor(initialConfig: Record<string, any> = {}) {
    this.configStore = { ...initialConfig };
  }

  /**
   * Gets a configuration value at the specified path.
   * Supports dot notation for accessing nested properties (e.g., 'database.host').
   * Returns the default value if the property doesn't exist.
   * 
   * Compatible with NestJS ConfigService interface, including support for the
   * 'infer' option for type inference.
   * 
   * @param propertyPath - Path to the configuration property
   * @param defaultValueOrOptions - Optional default value or options object
   * @param options - Optional configuration options when defaultValue is provided separately
   * @returns The configuration value or the default value
   */
  get<T = any>(propertyPath: string, defaultValueOrOptions?: T | Record<string, any>, options?: Record<string, any>): T {
    this.accessedPaths.add(propertyPath);
    
    // Handle case where second parameter is options object
    let defaultValue: T | undefined;
    let configOptions: Record<string, any> | undefined;
    
    if (defaultValueOrOptions !== undefined && typeof defaultValueOrOptions === 'object' && 
        defaultValueOrOptions !== null && 'infer' in defaultValueOrOptions) {
      configOptions = defaultValueOrOptions as Record<string, any>;
    } else {
      defaultValue = defaultValueOrOptions as T;
      configOptions = options;
    }
    
    const value = get(this.configStore, propertyPath, defaultValue);
    return value as T;
  }

  /**
   * Gets a configuration value at the specified path or throws an error if not found.
   * Supports dot notation for accessing nested properties (e.g., 'database.host').
   * 
   * Compatible with NestJS ConfigService interface, including support for the
   * 'infer' option for type inference.
   * 
   * @param propertyPath - Path to the configuration property
   * @param defaultValueOrOptions - Optional default value or options object
   * @param options - Optional configuration options when defaultValue is provided separately
   * @returns The configuration value
   * @throws Error if the property doesn't exist and no default value is provided
   */
  getOrThrow<T = any>(propertyPath: string, defaultValueOrOptions?: T | Record<string, any>, options?: Record<string, any>): T {
    this.accessedPaths.add(propertyPath);
    
    // Handle case where second parameter is options object
    let defaultValue: T | undefined;
    let configOptions: Record<string, any> | undefined;
    
    if (defaultValueOrOptions !== undefined && typeof defaultValueOrOptions === 'object' && 
        defaultValueOrOptions !== null && 'infer' in defaultValueOrOptions) {
      configOptions = defaultValueOrOptions as Record<string, any>;
    } else {
      defaultValue = defaultValueOrOptions as T;
      configOptions = options;
    }
    
    const value = this.get(propertyPath, defaultValue, configOptions);
    if (value === undefined) {
      throw new Error(`Configuration property '${propertyPath}' not found and no default value provided`);
    }
    return value as T;
  }

  /**
   * Sets a configuration value at the specified path.
   * Supports dot notation for setting nested properties (e.g., 'database.host').
   * 
   * @param propertyPath - Path to the configuration property
   * @param value - Value to set
   * @returns The ConfigServiceMock instance for chaining
   */
  set<T = any>(propertyPath: string, value: T): this {
    set(this.configStore, propertyPath, value);
    return this;
  }

  /**
   * Sets multiple configuration values at once.
   * 
   * @param config - Configuration object to merge with the current configuration
   * @returns The ConfigServiceMock instance for chaining
   */
  setAll(config: Record<string, any>): this {
    this.configStore = { ...this.configStore, ...config };
    return this;
  }

  /**
   * Resets the configuration store to an empty object or to the provided initial configuration.
   * Also clears the list of accessed paths.
   * 
   * @param initialConfig - Optional initial configuration to set after reset
   * @returns The ConfigServiceMock instance for chaining
   */
  reset(initialConfig: Record<string, any> = {}): this {
    this.configStore = { ...initialConfig };
    this.accessedPaths.clear();
    return this;
  }

  /**
   * Gets the entire configuration store.
   * 
   * @returns The current configuration store
   */
  getAll(): Record<string, any> {
    return { ...this.configStore };
  }

  /**
   * Checks if a configuration property exists.
   * 
   * @param propertyPath - Path to the configuration property
   * @returns True if the property exists, false otherwise
   */
  has(propertyPath: string): boolean {
    return lodashHas(this.configStore, propertyPath);
  }
  
  /**
   * Gets the list of configuration paths that have been accessed via get() or getOrThrow().
   * Useful for verifying which configuration values were used during tests.
   * 
   * @returns Array of accessed property paths
   */
  getAccessedPaths(): string[] {
    return Array.from(this.accessedPaths);
  }
  
  /**
   * Checks if a specific configuration path was accessed during tests.
   * 
   * @param propertyPath - Path to check
   * @returns True if the path was accessed, false otherwise
   */
  wasAccessed(propertyPath: string): boolean {
    return this.accessedPaths.has(propertyPath);
  }
  
  /**
   * Clears the list of accessed paths without resetting the configuration.
   * 
   * @returns The ConfigServiceMock instance for chaining
   */
  clearAccessedPaths(): this {
    this.accessedPaths.clear();
    return this;
  }
}