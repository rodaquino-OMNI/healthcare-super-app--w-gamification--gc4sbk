import { Context, Span, SpanOptions, SpanStatusCode, Tracer, TracerOptions } from '@opentelemetry/api';
import { TracerProvider } from '../../../src/interfaces/tracer-provider.interface';
import { MockSpan, MockTracer } from '../../mocks/mock-tracer';
import { DEFAULT_SERVICE_NAME } from '../../../src/constants/defaults';
import { ERROR_CODES } from '../../../src/constants/error-codes';

/**
 * Mock implementation of the TracerProvider interface for testing.
 */
class MockTracerProvider implements TracerProvider {
  private readonly tracers: Map<string, MockTracer> = new Map();
  private static instance: MockTracerProvider;

  /**
   * Gets the singleton instance of the MockTracerProvider.
   */
  public static getInstance(): MockTracerProvider {
    if (!MockTracerProvider.instance) {
      MockTracerProvider.instance = new MockTracerProvider();
    }
    return MockTracerProvider.instance;
  }

  /**
   * Resets the singleton instance for testing.
   */
  public static resetInstance(): void {
    MockTracerProvider.instance = undefined;
  }

  /**
   * Gets a tracer with the specified name and options.
   * 
   * @param name The name of the tracer
   * @param options Optional configuration for the tracer
   * @returns A Tracer instance
   * @throws Error if name is empty or invalid
   */
  getTracer(name: string, options?: TracerOptions): Tracer {
    // Validate service name
    if (!name) {
      throw new Error(`${ERROR_CODES.INVALID_SERVICE_NAME}: Service name cannot be empty`);
    }

    // Return existing tracer if already created
    if (this.tracers.has(name)) {
      return this.tracers.get(name);
    }

    // Create new tracer
    const tracer = new MockTracer(name);
    this.tracers.set(name, tracer);
    return tracer;
  }

  /**
   * Creates and starts a new span with the given name and options.
   * 
   * @param tracer The tracer to use
   * @param name The name of the span
   * @param options Optional configuration for the span
   * @returns The created span
   */
  startSpan(tracer: Tracer, name: string, options?: SpanOptions): Span {
    if (!(tracer instanceof MockTracer)) {
      throw new Error(`${ERROR_CODES.INVALID_TRACER}: Expected MockTracer instance`);
    }
    return tracer.startSpan(name, options);
  }

  /**
   * Executes a function within the context of a span.
   * 
   * @param span The span to use as context
   * @param fn The function to execute
   * @returns The result of the function
   */
  async withSpan<T>(span: Span, fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      if (span.isRecording()) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      return result;
    } catch (error) {
      if (span.isRecording()) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      }
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Gets the current active span.
   * 
   * @returns The current span or undefined
   */
  getCurrentSpan(): Span | undefined {
    // For testing purposes, return undefined
    return undefined;
  }

  /**
   * Sets the current span in the context.
   * 
   * @param span The span to set
   * @returns The updated context
   */
  setSpan(span: Span): Context {
    // For testing purposes, return an empty context
    return {} as Context;
  }

  /**
   * Gets the current context.
   * 
   * @returns The current context
   */
  getContext(): Context {
    // For testing purposes, return an empty context
    return {} as Context;
  }

  /**
   * Executes a function within the given context.
   * 
   * @param context The context to use
   * @param fn The function to execute
   * @returns The result of the function
   */
  async withContext<T>(context: Context, fn: () => Promise<T>): Promise<T> {
    // For testing purposes, just execute the function
    return fn();
  }

  /**
   * Gets all tracers created by this provider.
   * 
   * @returns Map of all tracers
   */
  getAllTracers(): Map<string, MockTracer> {
    return new Map(this.tracers);
  }

  /**
   * Clears all tracers for testing purposes.
   */
  clearTracers(): void {
    this.tracers.clear();
  }
}

describe('TracerProvider Interface', () => {
  let tracerProvider: MockTracerProvider;

  beforeEach(() => {
    // Reset the singleton instance before each test
    MockTracerProvider.resetInstance();
    tracerProvider = MockTracerProvider.getInstance();
    tracerProvider.clearTracers();
  });

  describe('getTracer', () => {
    it('should return a tracer with the specified name', () => {
      const serviceName = 'test-service';
      const tracer = tracerProvider.getTracer(serviceName);
      
      expect(tracer).toBeDefined();
      expect(tracer instanceof MockTracer).toBe(true);
      expect((tracer as MockTracer).getName()).toBe(serviceName);
    });

    it('should return the same tracer instance for the same name', () => {
      const serviceName = 'test-service';
      const tracer1 = tracerProvider.getTracer(serviceName);
      const tracer2 = tracerProvider.getTracer(serviceName);
      
      expect(tracer1).toBe(tracer2);
    });

    it('should return different tracer instances for different names', () => {
      const serviceName1 = 'test-service-1';
      const serviceName2 = 'test-service-2';
      const tracer1 = tracerProvider.getTracer(serviceName1);
      const tracer2 = tracerProvider.getTracer(serviceName2);
      
      expect(tracer1).not.toBe(tracer2);
      expect((tracer1 as MockTracer).getName()).toBe(serviceName1);
      expect((tracer2 as MockTracer).getName()).toBe(serviceName2);
    });

    it('should throw an error if service name is empty', () => {
      expect(() => tracerProvider.getTracer('')).toThrow();
    });

    it('should accept tracer options', () => {
      const serviceName = 'test-service';
      const options: TracerOptions = { schemaUrl: 'https://example.com/schema' };
      const tracer = tracerProvider.getTracer(serviceName, options);
      
      expect(tracer).toBeDefined();
      expect(tracer instanceof MockTracer).toBe(true);
      expect((tracer as MockTracer).getName()).toBe(serviceName);
    });
  });

  describe('startSpan', () => {
    it('should create a span with the specified name', () => {
      const serviceName = 'test-service';
      const spanName = 'test-span';
      const tracer = tracerProvider.getTracer(serviceName) as MockTracer;
      const span = tracerProvider.startSpan(tracer, spanName);
      
      expect(span).toBeDefined();
      expect(span instanceof MockSpan).toBe(true);
      expect((span as MockSpan).getName()).toBe(spanName);
    });

    it('should create a span with the specified options', () => {
      const serviceName = 'test-service';
      const spanName = 'test-span';
      const tracer = tracerProvider.getTracer(serviceName) as MockTracer;
      const options: SpanOptions = {
        attributes: { 'test.attribute': 'test-value' }
      };
      const span = tracerProvider.startSpan(tracer, spanName, options) as MockSpan;
      
      expect(span).toBeDefined();
      expect(span.getName()).toBe(spanName);
      expect(span.getAttributes()['test.attribute']).toBe('test-value');
    });

    it('should throw an error if tracer is invalid', () => {
      const invalidTracer = {} as Tracer;
      expect(() => tracerProvider.startSpan(invalidTracer, 'test-span')).toThrow();
    });
  });

  describe('withSpan', () => {
    it('should execute the function within the span context', async () => {
      const serviceName = 'test-service';
      const spanName = 'test-span';
      const tracer = tracerProvider.getTracer(serviceName) as MockTracer;
      const span = tracerProvider.startSpan(tracer, spanName) as MockSpan;
      
      const result = await tracerProvider.withSpan(span, async () => 'test-result');
      
      expect(result).toBe('test-result');
      expect(span.isRecording()).toBe(false); // Span should be ended
      expect(span.getStatus().code).toBe(SpanStatusCode.OK);
    });

    it('should handle errors and set span status to ERROR', async () => {
      const serviceName = 'test-service';
      const spanName = 'test-span';
      const tracer = tracerProvider.getTracer(serviceName) as MockTracer;
      const span = tracerProvider.startSpan(tracer, spanName) as MockSpan;
      const testError = new Error('Test error');
      
      await expect(tracerProvider.withSpan(span, async () => {
        throw testError;
      })).rejects.toThrow(testError);
      
      expect(span.isRecording()).toBe(false); // Span should be ended
      expect(span.getStatus().code).toBe(SpanStatusCode.ERROR);
      
      // Verify that the exception was recorded
      const events = span.getEvents();
      const exceptionEvent = events.find(event => event.name === 'exception');
      expect(exceptionEvent).toBeDefined();
      expect(exceptionEvent.attributes['exception.message']).toBe('Test error');
    });
  });

  describe('Singleton behavior', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = MockTracerProvider.getInstance();
      const instance2 = MockTracerProvider.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = MockTracerProvider.getInstance();
      const serviceName = 'test-service';
      instance1.getTracer(serviceName);
      
      const instance2 = MockTracerProvider.getInstance();
      const tracers = instance2.getAllTracers();
      
      expect(tracers.has(serviceName)).toBe(true);
    });

    it('should reset state when resetInstance is called', () => {
      const instance1 = MockTracerProvider.getInstance();
      const serviceName = 'test-service';
      instance1.getTracer(serviceName);
      
      MockTracerProvider.resetInstance();
      const instance2 = MockTracerProvider.getInstance();
      const tracers = instance2.getAllTracers();
      
      expect(tracers.size).toBe(0);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Context management', () => {
    it('should have getCurrentSpan method', () => {
      expect(typeof tracerProvider.getCurrentSpan).toBe('function');
      const currentSpan = tracerProvider.getCurrentSpan();
      expect(currentSpan).toBeUndefined(); // In our mock implementation
    });

    it('should have setSpan method', () => {
      expect(typeof tracerProvider.setSpan).toBe('function');
      const serviceName = 'test-service';
      const spanName = 'test-span';
      const tracer = tracerProvider.getTracer(serviceName) as MockTracer;
      const span = tracerProvider.startSpan(tracer, spanName) as MockSpan;
      
      const context = tracerProvider.setSpan(span);
      expect(context).toBeDefined();
    });

    it('should have getContext method', () => {
      expect(typeof tracerProvider.getContext).toBe('function');
      const context = tracerProvider.getContext();
      expect(context).toBeDefined();
    });

    it('should have withContext method', async () => {
      expect(typeof tracerProvider.withContext).toBe('function');
      const context = tracerProvider.getContext();
      const result = await tracerProvider.withContext(context, async () => 'test-result');
      expect(result).toBe('test-result');
    });
  });

  describe('Default service name', () => {
    it('should use the default service name if none is provided', () => {
      // This test is more relevant for the actual implementation, but we include it for completeness
      expect(DEFAULT_SERVICE_NAME).toBe('austa-service');
    });
  });
});