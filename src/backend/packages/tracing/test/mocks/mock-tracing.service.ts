import { Injectable } from '@nestjs/common';

/**
 * Interface representing a mock span for testing purposes
 */
export interface MockSpan {
  name: string;
  status: 'OK' | 'ERROR';
  startTime: Date;
  endTime?: Date;
  error?: Error;
  isRecording: boolean;
}

/**
 * Mock implementation of the TracingService for testing purposes.
 * This mock simulates the behavior of the actual TracingService without requiring
 * actual telemetry infrastructure.
 */
@Injectable()
export class MockTracingService {
  /**
   * Collection of spans created during testing
   */
  public spans: MockSpan[] = [];

  /**
   * Flag to simulate recording state
   */
  private isRecording = true;

  /**
   * Creates and simulates a new span for tracing a specific operation.
   * @param name The name of the span to create
   * @param fn The function to execute within the span context
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Create a mock span
    const span: MockSpan = {
      name,
      status: 'OK',
      startTime: new Date(),
      isRecording: this.isRecording,
    };
    
    // Add the span to our collection for later verification
    this.spans.push(span);
    
    try {
      // Execute the provided function
      const result = await fn();
      
      // If the function completes successfully, set the span status to OK
      if (span.isRecording) {
        span.status = 'OK';
      }
      
      return result;
    } catch (error) {
      // If the function throws an error, set the span status to ERROR and record the exception
      if (span.isRecording) {
        span.status = 'ERROR';
        span.error = error;
      }
      
      // Re-throw the error to maintain the same behavior as the real service
      throw error;
    } finally {
      // Always end the span regardless of success or failure
      span.endTime = new Date();
    }
  }

  /**
   * Clears all recorded spans
   */
  reset(): void {
    this.spans = [];
  }

  /**
   * Sets whether spans should record or not
   * @param recording Whether spans should record
   */
  setRecording(recording: boolean): void {
    this.isRecording = recording;
  }

  /**
   * Gets spans by name
   * @param name The name of spans to retrieve
   * @returns Array of spans with the given name
   */
  getSpansByName(name: string): MockSpan[] {
    return this.spans.filter(span => span.name === name);
  }

  /**
   * Gets spans by status
   * @param status The status of spans to retrieve
   * @returns Array of spans with the given status
   */
  getSpansByStatus(status: 'OK' | 'ERROR'): MockSpan[] {
    return this.spans.filter(span => span.status === status);
  }

  /**
   * Gets spans that have errors
   * @returns Array of spans with errors
   */
  getErrorSpans(): MockSpan[] {
    return this.spans.filter(span => span.error !== undefined);
  }

  /**
   * Gets the duration of a span in milliseconds
   * @param span The span to get the duration for
   * @returns The duration in milliseconds, or undefined if the span hasn't ended
   */
  getSpanDuration(span: MockSpan): number | undefined {
    if (!span.endTime) return undefined;
    return span.endTime.getTime() - span.startTime.getTime();
  }
}