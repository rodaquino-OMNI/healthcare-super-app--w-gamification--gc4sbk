/**
 * Mock implementation of NestJS ConfigService for testing the tracing module.
 * This mock simulates configuration retrieval, particularly for service name
 * configuration which is critical for tracer initialization.
 */
export class MockConfigService {
  private configValues: Record<string, any> = {};

  /**
   * Constructor that allows setting initial configuration values
   * @param initialValues Optional initial configuration values
   */
  constructor(initialValues: Record<string, any> = {}) {
    this.configValues = { ...initialValues };
  }

  /**
   * Simulates the ConfigService.get method to retrieve configuration values
   * @param key The configuration key to retrieve
   * @param defaultValue Optional default value if the key is not found
   * @returns The configuration value or the default value
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.getValueFromPath(key);
    return value !== undefined ? (value as T) : (defaultValue as T);
  }

  /**
   * Sets a configuration value for testing
   * @param key The configuration key to set
   * @param value The value to set
   */
  set(key: string, value: any): void {
    this.setValueAtPath(key, value);
  }

  /**
   * Resets all configuration values
   */
  reset(): void {
    this.configValues = {};
  }

  /**
   * Gets a nested value using dot notation path
   * @param path The dot notation path (e.g., 'service.name')
   * @returns The value at the path or undefined
   */
  private getValueFromPath(path: string): any {
    const parts = path.split('.');
    let current: any = this.configValues;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Sets a value at a nested path using dot notation
   * @param path The dot notation path (e.g., 'service.name')
   * @param value The value to set
   */
  private setValueAtPath(path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop();
    
    if (!lastPart) {
      return;
    }

    let current = this.configValues;

    // Create nested objects if they don't exist
    for (const part of parts) {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[lastPart] = value;
  }
}