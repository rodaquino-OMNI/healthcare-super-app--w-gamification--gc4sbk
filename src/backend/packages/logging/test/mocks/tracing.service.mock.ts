import { SpanStatusCode } from '@opentelemetry/api';

/**
 * Mock implementation of the TracingService for testing logging components.
 * 
 * This mock allows testing of components that depend on distributed tracing
 * without requiring the actual OpenTelemetry implementation. It records calls
 * to createSpan and provides methods to simulate success and error scenarios.
 */
export class MockTracingService {
  /**
   * Records of calls to createSpan for verification in tests
   */
  public spanCalls: Array<{
    name: string;
    fn: () => Promise<any>;
  }> = [];

  /**
   * Mock trace ID to return from getCurrentTraceId
   */
  private mockTraceId: string = '0123456789abcdef0123456789abcdef';

  /**
   * Mock span ID to return from getCurrentSpanId
   */
  private mockSpanId: string = '0123456789abcdef';

  /**
   * Flag to simulate errors in createSpan
   */
  private simulateError: boolean = false;

  /**
   * Error to throw when simulateError is true
   */
  private errorToSimulate: Error = new Error('Simulated tracing error');

  /**
   * Creates and starts a new span for tracing a specific operation.
   * Records the call for later verification and returns the result of the function.
   * 
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   * @throws The error passed to setErrorSimulation if simulateError is true
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Record the call for verification in tests
    this.spanCalls.push({ name, fn });

    // Simulate error if configured
    if (this.simulateError) {
      throw this.errorToSimulate;
    }

    // Execute the function and return its result
    try {
      return await fn();
    } catch (error) {
      // Re-throw any errors from the function
      throw error;
    }
  }

  /**
   * Gets the current trace ID.
   * Returns a mock trace ID for testing purposes.
   * 
   * @returns The mock trace ID
   */
  getCurrentTraceId(): string {
    return this.mockTraceId;
  }

  /**
   * Gets the current span ID.
   * Returns a mock span ID for testing purposes.
   * 
   * @returns The mock span ID
   */
  getCurrentSpanId(): string {
    return this.mockSpanId;
  }

  /**
   * Sets the mock trace ID to return from getCurrentTraceId.
   * 
   * @param traceId The mock trace ID to return
   */
  setMockTraceId(traceId: string): void {
    this.mockTraceId = traceId;
  }

  /**
   * Sets the mock span ID to return from getCurrentSpanId.
   * 
   * @param spanId The mock span ID to return
   */
  setMockSpanId(spanId: string): void {
    this.mockSpanId = spanId;
  }

  /**
   * Configures the mock to simulate an error when createSpan is called.
   * 
   * @param simulate Whether to simulate an error
   * @param error The error to throw (defaults to a generic error)
   */
  setErrorSimulation(simulate: boolean, error?: Error): void {
    this.simulateError = simulate;
    if (error) {
      this.errorToSimulate = error;
    }
  }

  /**
   * Resets all recorded calls and configurations.
   * Should be called between tests to ensure a clean state.
   */
  reset(): void {
    this.spanCalls = [];
    this.mockTraceId = '0123456789abcdef0123456789abcdef';
    this.mockSpanId = '0123456789abcdef';
    this.simulateError = false;
    this.errorToSimulate = new Error('Simulated tracing error');
  }

  /**
   * Checks if a span with the given name was created.
   * 
   * @param name The name of the span to check for
   * @returns True if a span with the given name was created, false otherwise
   */
  wasSpanCreated(name: string): boolean {
    return this.spanCalls.some(call => call.name === name);
  }

  /**
   * Gets the number of spans created with the given name.
   * 
   * @param name The name of the spans to count
   * @returns The number of spans created with the given name
   */
  getSpanCount(name: string): number {
    return this.spanCalls.filter(call => call.name === name).length;
  }

  /**
   * Gets all spans created with the given name.
   * 
   * @param name The name of the spans to get
   * @returns An array of spans created with the given name
   */
  getSpansByName(name: string): Array<{
    name: string;
    fn: () => Promise<any>;
  }> {
    return this.spanCalls.filter(call => call.name === name);
  }
}