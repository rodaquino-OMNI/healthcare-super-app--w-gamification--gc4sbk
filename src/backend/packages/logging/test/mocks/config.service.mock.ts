/**
 * @file config.service.mock.ts
 * @description Mock implementation of NestJS ConfigService for testing logging components
 * that depend on configuration values. Provides a configurable key-value store that can be
 * preset with test values and allows configuration changes during tests.
 */

import { Injectable } from '@nestjs/common';

/**
 * Mock implementation of the NestJS ConfigService for testing.
 * Provides a configurable store for test configuration values and methods
 * to retrieve, set, and reset those values.
 *
 * @example
 * ```typescript
 * // In your test file
 * const configService = new MockConfigService();
 * configService.set('logging.level', 'debug');
 * configService.set('logging.transports', ['console']);
 *
 * // Use in your test
 * const level = configService.get<string>('logging.level');
 * expect(level).toBe('debug');
 * ```
 */
@Injectable()
export class MockConfigService {
  private configStore: Record<string, any> = {};

  /**
   * Creates a new MockConfigService with optional initial configuration.
   *
   * @param initialConfig - Initial configuration values
   */
  constructor(initialConfig: Record<string, any> = {}) {
    this.configStore = { ...initialConfig };
  }

  /**
   * Gets a configuration value at the specified path.
   * Supports nested paths using dot notation (e.g., 'database.host').
   *
   * @param propertyPath - Path to the configuration value
   * @param defaultValue - Default value to return if the path doesn't exist
   * @returns The configuration value or the default value
   *
   * @example
   * ```typescript
   * // Get a string value with a default
   * const host = configService.get<string>('database.host', 'localhost');
   *
   * // Get a number value
   * const port = configService.get<number>('database.port');
   *
   * // Get a complex object
   * const dbConfig = configService.get<DbConfig>('database');
   * ```
   */
  get<T = any>(propertyPath: string, defaultValue?: T): T {
    const value = this.getValueFromPath(propertyPath);
    return value !== undefined ? value : defaultValue as T;
  }

  /**
   * Sets a configuration value at the specified path.
   * Supports nested paths using dot notation (e.g., 'database.host').
   * Creates intermediate objects if they don't exist.
   *
   * @param propertyPath - Path to set the configuration value
   * @param value - Value to set
   *
   * @example
   * ```typescript
   * // Set a simple value
   * configService.set('logging.level', 'debug');
   *
   * // Set a complex object
   * configService.set('database', { host: 'localhost', port: 5432 });
   * ```
   */
  set(propertyPath: string, value: any): void {
    if (!propertyPath) {
      throw new Error('Property path cannot be empty');
    }

    const pathParts = propertyPath.split('.');
    let current = this.configStore;

    // Navigate to the parent object of the property to set
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    // Set the value on the last part
    current[pathParts[pathParts.length - 1]] = value;
  }

  /**
   * Sets multiple configuration values at once.
   *
   * @param config - Configuration object with values to set
   *
   * @example
   * ```typescript
   * configService.setAll({
   *   'logging.level': 'debug',
   *   'logging.transports': ['console'],
   *   'database.host': 'localhost',
   * });
   * ```
   */
  setAll(config: Record<string, any>): void {
    Object.entries(config).forEach(([path, value]) => {
      this.set(path, value);
    });
  }

  /**
   * Checks if a configuration value exists at the specified path.
   *
   * @param propertyPath - Path to check
   * @returns True if the path exists, false otherwise
   *
   * @example
   * ```typescript
   * if (configService.has('database.host')) {
   *   // Use the database host
   * }
   * ```
   */
  has(propertyPath: string): boolean {
    return this.getValueFromPath(propertyPath) !== undefined;
  }

  /**
   * Removes a configuration value at the specified path.
   *
   * @param propertyPath - Path to remove
   *
   * @example
   * ```typescript
   * configService.remove('logging.transports');
   * ```
   */
  remove(propertyPath: string): void {
    if (!propertyPath) {
      return;
    }

    const pathParts = propertyPath.split('.');
    let current = this.configStore;

    // Navigate to the parent object of the property to remove
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        return; // Path doesn't exist, nothing to remove
      }
      current = current[part];
    }

    // Remove the property
    delete current[pathParts[pathParts.length - 1]];
  }

  /**
   * Resets all configuration values to an empty state or to the provided initial values.
   *
   * @param initialConfig - Optional initial configuration to reset to
   *
   * @example
   * ```typescript
   * // Reset to empty configuration
   * configService.reset();
   *
   * // Reset to specific configuration
   * configService.reset({
   *   'logging.level': 'info',
   *   'database.host': 'localhost',
   * });
   * ```
   */
  reset(initialConfig: Record<string, any> = {}): void {
    this.configStore = { ...initialConfig };
  }

  /**
   * Gets the entire configuration store.
   * Useful for debugging or saving the current state.
   *
   * @returns The current configuration store
   */
  getConfigStore(): Record<string, any> {
    return { ...this.configStore };
  }

  /**
   * Internal helper to get a value from a nested path.
   *
   * @param propertyPath - Path to the value
   * @returns The value at the path or undefined if not found
   * @private
   */
  private getValueFromPath(propertyPath: string): any {
    if (!propertyPath) {
      return undefined;
    }

    const pathParts = propertyPath.split('.');
    let current: any = this.configStore;

    for (const part of pathParts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }
}