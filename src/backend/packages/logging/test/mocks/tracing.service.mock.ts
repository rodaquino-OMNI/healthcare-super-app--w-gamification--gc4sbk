/**
 * Mock implementation of the TracingService for testing logging components
 * that depend on distributed tracing. Provides simplified span creation with
 * controllable behavior, allowing tests to verify trace correlation and error
 * handling without depending on OpenTelemetry.
 */
export class MockTracingService {
  /**
   * Records of all calls to createSpan for verification in tests
   */
  public spanCalls: { name: string; fn: () => Promise<any> }[] = [];

  /**
   * Flag to simulate errors in span creation
   */
  public shouldThrowError = false;

  /**
   * Custom error to throw when shouldThrowError is true
   */
  public errorToThrow: Error = new Error('Mock tracing error');

  /**
   * Creates and records a mock span for testing
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Record this call for later verification
    this.spanCalls.push({ name, fn });

    // Simulate error if configured to do so
    if (this.shouldThrowError) {
      throw this.errorToThrow;
    }

    try {
      // Execute the provided function
      return await fn();
    } catch (error) {
      // Re-throw any errors from the function
      throw error;
    }
  }

  /**
   * Resets all recorded calls and error simulation settings
   * Used to clean state between tests
   */
  reset(): void {
    this.spanCalls = [];
    this.shouldThrowError = false;
    this.errorToThrow = new Error('Mock tracing error');
  }

  /**
   * Configures the mock to throw an error on the next createSpan call
   * @param error Optional custom error to throw
   */
  simulateError(error?: Error): void {
    this.shouldThrowError = true;
    if (error) {
      this.errorToThrow = error;
    }
  }

  /**
   * Gets the number of times createSpan was called with a specific name
   * @param name The span name to check
   * @returns The count of matching spans
   */
  getSpanCallCount(name?: string): number {
    if (!name) {
      return this.spanCalls.length;
    }
    return this.spanCalls.filter(call => call.name === name).length;
  }

  /**
   * Checks if createSpan was called with a specific name
   * @param name The span name to check
   * @returns True if a matching span was created
   */
  wasSpanCreated(name: string): boolean {
    return this.spanCalls.some(call => call.name === name);
  }
}