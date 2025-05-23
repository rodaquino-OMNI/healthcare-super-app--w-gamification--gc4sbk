import { LoggerService } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';

/**
 * Mock implementation of TracingService for testing purposes.
 * Simulates the behavior of the actual TracingService without requiring
 * telemetry infrastructure.
 */
export class MockTracingService {
  // Track created spans for verification in tests
  public createdSpans: { name: string; status: SpanStatusCode; error?: Error }[] = [];

  /**
   * Creates a mock TracingService instance for testing
   * @param logger Optional logger service for logging messages
   */
  constructor(private logger?: LoggerService) {}

  /**
   * Creates and simulates a span for tracing a specific operation.
   * Records the span information for test verification.
   * 
   * @param name The name of the span to create
   * @param fn The function to execute within the simulated span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Create a span entry with initial status
    const spanEntry = { name, status: SpanStatusCode.UNSET };
    this.createdSpans.push(spanEntry);
    
    try {
      // Execute the provided function
      const result = await fn();
      
      // Update span status to OK on success
      spanEntry.status = SpanStatusCode.OK;
      
      return result;
    } catch (error) {
      // Update span status to ERROR and record the exception
      spanEntry.status = SpanStatusCode.ERROR;
      spanEntry.error = error;
      
      // Log the error if a logger is provided
      if (this.logger) {
        this.logger.error(`Error in span ${name}: ${error.message}`, error.stack, 'MockTracing');
      }
      
      throw error;
    }
  }

  /**
   * Clears the recorded spans history.
   * Useful for resetting the mock between tests.
   */
  clearSpans(): void {
    this.createdSpans = [];
  }

  /**
   * Utility method to find spans by name
   * @param name The name of the span to find
   * @returns Array of spans matching the name
   */
  findSpansByName(name: string): { name: string; status: SpanStatusCode; error?: Error }[] {
    return this.createdSpans.filter(span => span.name === name);
  }

  /**
   * Utility method to check if a span with a specific name exists
   * @param name The name of the span to check
   * @returns Boolean indicating if the span exists
   */
  hasSpan(name: string): boolean {
    return this.createdSpans.some(span => span.name === name);
  }

  /**
   * Utility method to check if a span with a specific name has an error
   * @param name The name of the span to check
   * @returns Boolean indicating if the span has an error
   */
  hasErrorInSpan(name: string): boolean {
    return this.createdSpans.some(span => span.name === name && span.status === SpanStatusCode.ERROR);
  }
}