/**
 * @file ConfigService Mock
 * @description Mock implementation of NestJS ConfigService for testing logging components
 * that depend on configuration values. Provides a configurable key-value store that can be
 * preset with test values and allows configuration changes during tests.
 *
 * @module @austa/logging/test/mocks
 */

/**
 * Mock implementation of NestJS ConfigService for testing
 */
export class ConfigServiceMock {
  /**
   * Internal storage for configuration values
   */
  private config: Record<string, any> = {};

  /**
   * Creates a new ConfigServiceMock instance
   * @param initialConfig Optional initial configuration values
   */
  constructor(initialConfig: Record<string, any> = {}) {
    this.config = { ...initialConfig };
  }

  /**
   * Gets a configuration value by key with type safety
   * Supports nested keys using dot notation (e.g., 'database.host')
   * 
   * @param key The configuration key to retrieve
   * @param defaultValue Optional default value if the key is not found
   * @returns The configuration value with the specified type, or the default value if not found
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.getValueByPath(key);
    return value !== undefined ? value : defaultValue as T;
  }

  /**
   * Sets a configuration value for testing
   * Supports nested keys using dot notation (e.g., 'database.host')
   * 
   * @param key The configuration key to set
   * @param value The value to set
   */
  set(key: string, value: any): void {
    this.setValueByPath(key, value);
  }

  /**
   * Sets multiple configuration values at once
   * 
   * @param config The configuration object to merge with the current configuration
   */
  setAll(config: Record<string, any>): void {
    this.config = this.deepMerge(this.config, config);
  }

  /**
   * Resets all configuration values
   */
  reset(): void {
    this.config = {};
  }

  /**
   * Resets a specific configuration key
   * Supports nested keys using dot notation (e.g., 'database.host')
   * 
   * @param key The configuration key to reset
   */
  resetKey(key: string): void {
    const parts = key.split('.');
    
    if (parts.length === 1) {
      delete this.config[key];
      return;
    }

    let current = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || typeof current[part] !== 'object') {
        return; // Key path doesn't exist, nothing to reset
      }
      current = current[part];
    }

    delete current[parts[parts.length - 1]];
  }

  /**
   * Creates a namespaced ConfigServiceMock instance
   * All keys will be prefixed with the namespace
   * 
   * @param namespace The namespace to use as prefix
   * @returns A new ConfigServiceMock instance with namespaced keys
   */
  createNamespace(namespace: string): ConfigServiceMock {
    const namespacedConfig = new ConfigServiceMock();
    
    // Create a proxy to handle namespaced keys
    return new Proxy(namespacedConfig, {
      get: (target, prop: string) => {
        if (prop === 'get') {
          return <T>(key: string, defaultValue?: T): T => {
            return this.get<T>(`${namespace}.${key}`, defaultValue);
          };
        }
        if (prop === 'set') {
          return (key: string, value: any): void => {
            this.set(`${namespace}.${key}`, value);
          };
        }
        if (prop === 'resetKey') {
          return (key: string): void => {
            this.resetKey(`${namespace}.${key}`);
          };
        }
        
        return (target as any)[prop];
      }
    }) as ConfigServiceMock;
  }

  /**
   * Gets a value from the configuration using a dot-notation path
   * 
   * @param path The path to the value using dot notation
   * @returns The value at the specified path, or undefined if not found
   * @private
   */
  private getValueByPath(path: string): any {
    const parts = path.split('.');
    let current = this.config;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Sets a value in the configuration using a dot-notation path
   * Creates nested objects as needed
   * 
   * @param path The path to set using dot notation
   * @param value The value to set at the specified path
   * @private
   */
  private setValueByPath(path: string, value: any): void {
    const parts = path.split('.');
    let current = this.config;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      } else if (typeof current[part] !== 'object') {
        // If the current part is not an object, convert it to an object
        // This allows overriding primitive values with nested objects
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Deep merges two objects
   * 
   * @param target The target object
   * @param source The source object to merge into the target
   * @returns The merged object
   * @private
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const output = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (isObject(source[key]) && isObject(target[key])) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }

    return output;
  }
}

/**
 * Checks if a value is an object
 * 
 * @param item The value to check
 * @returns True if the value is an object, false otherwise
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}