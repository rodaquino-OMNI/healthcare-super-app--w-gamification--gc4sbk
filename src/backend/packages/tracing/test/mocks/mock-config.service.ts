import { ConfigService } from '@nestjs/config';

/**
 * Mock implementation of NestJS ConfigService for testing the tracing module.
 * This mock simulates configuration retrieval, particularly for service name
 * configuration which is critical for tracer initialization.
 */
export class MockConfigService implements Partial<ConfigService> {
  private configValues: Record<string, any> = {};

  /**
   * Creates a new instance of MockConfigService with optional preset configuration values.
   * @param initialValues Optional preset configuration values
   */
  constructor(initialValues: Record<string, any> = {}) {
    this.configValues = { ...initialValues };
  }

  /**
   * Retrieves a configuration value by key with support for default values.
   * Mimics the behavior of the real ConfigService.
   * 
   * @param propertyPath The configuration key to retrieve
   * @param defaultValue Optional default value if the key is not found
   * @returns The configuration value or the default value
   */
  get<T>(propertyPath: string, defaultValue?: T): T {
    const value = this.configValues[propertyPath];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Sets a configuration value for testing purposes.
   * 
   * @param propertyPath The configuration key to set
   * @param value The value to set
   */
  set<T>(propertyPath: string, value: T): void {
    this.configValues[propertyPath] = value;
  }

  /**
   * Clears all configuration values.
   */
  clear(): void {
    this.configValues = {};
  }

  /**
   * Sets multiple configuration values at once.
   * 
   * @param values Record of configuration key-value pairs
   */
  setAll(values: Record<string, any>): void {
    this.configValues = { ...this.configValues, ...values };
  }
}