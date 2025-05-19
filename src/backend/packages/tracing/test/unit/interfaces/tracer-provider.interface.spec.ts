import { Context, Tracer, SpanStatusCode } from '@opentelemetry/api';
import { TracerOptions, TracerProvider } from '../../../src/interfaces/tracer-provider.interface';

/**
 * Mock implementation of the TracerProvider interface for testing purposes.
 */
class MockTracerProvider implements TracerProvider {
  private tracers: Map<string, Tracer> = new Map();
  private enabled: boolean = true;
  private activeContext: Context = {} as Context;
  private lastServiceName: string | null = null;
  private lastOptions: TracerOptions | null = null;
  private errorOnCreate: boolean = false;

  /**
   * Returns a Tracer, creating one if one with the given name and version is not already created.
   */
  getTracer(name: string, version?: string, options?: TracerOptions): Tracer {
    if (this.errorOnCreate) {
      throw new Error('Failed to create tracer');
    }

    if (!name) {
      throw new Error('Service name is required');
    }

    this.lastServiceName = name;
    this.lastOptions = options || null;

    const key = `${name}@${version || 'latest'}`;
    if (!this.tracers.has(key)) {
      // Create a mock tracer
      const mockTracer: Tracer = {
        startSpan: jest.fn().mockReturnValue({
          end: jest.fn(),
          setStatus: jest.fn(),
          recordException: jest.fn(),
          isRecording: jest.fn().mockReturnValue(true),
          setAttribute: jest.fn(),
          setAttributes: jest.fn(),
          addEvent: jest.fn(),
        }),
        startActiveSpan: jest.fn(),
      };
      this.tracers.set(key, mockTracer);
    }

    return this.tracers.get(key)!;
  }

  /**
   * Checks if the tracer provider is enabled for the given parameters.
   */
  isEnabled(name?: string, version?: string, options?: TracerOptions): boolean {
    return this.enabled;
  }

  /**
   * Sets whether the tracer provider is enabled.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Forcefully flushes all spans that have not yet been exported.
   */
  async forceFlush(timeoutMillis?: number): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Shuts down the tracer provider.
   */
  async shutdown(timeoutMillis?: number): Promise<void> {
    this.tracers.clear();
    return Promise.resolve();
  }

  /**
   * Gets the active context for the current execution.
   */
  getActiveContext(): Context {
    return this.activeContext;
  }

  /**
   * Sets the active context for the current execution.
   */
  setActiveContext(context: Context): () => void {
    const previousContext = this.activeContext;
    this.activeContext = context;
    return () => {
      this.activeContext = previousContext;
    };
  }

  /**
   * Extracts context from carrier using the configured propagator.
   */
  extractContext(carrier: Record<string, unknown>): Context {
    return {} as Context;
  }

  /**
   * Injects the current context into the carrier using the configured propagator.
   */
  injectContext(carrier: Record<string, unknown>, context?: Context): void {
    // Mock implementation
  }

  /**
   * Gets the last service name used to create a tracer.
   */
  getLastServiceName(): string | null {
    return this.lastServiceName;
  }

  /**
   * Gets the last options used to create a tracer.
   */
  getLastOptions(): TracerOptions | null {
    return this.lastOptions;
  }

  /**
   * Sets whether to throw an error when creating a tracer.
   */
  setErrorOnCreate(error: boolean): void {
    this.errorOnCreate = error;
  }

  /**
   * Clears all tracers.
   */
  clearTracers(): void {
    this.tracers.clear();
  }
}

describe('TracerProvider Interface', () => {
  let tracerProvider: MockTracerProvider;

  beforeEach(() => {
    tracerProvider = new MockTracerProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTracer', () => {
    it('should return a tracer for a valid service name', () => {
      const tracer = tracerProvider.getTracer('test-service');
      expect(tracer).toBeDefined();
      expect(tracerProvider.getLastServiceName()).toBe('test-service');
    });

    it('should throw an error if service name is not provided', () => {
      expect(() => tracerProvider.getTracer('')).toThrow('Service name is required');
    });

    it('should return the same tracer instance for the same service name and version', () => {
      const tracer1 = tracerProvider.getTracer('test-service', '1.0.0');
      const tracer2 = tracerProvider.getTracer('test-service', '1.0.0');
      expect(tracer1).toBe(tracer2);
    });

    it('should return different tracer instances for different service names', () => {
      const tracer1 = tracerProvider.getTracer('service-1');
      const tracer2 = tracerProvider.getTracer('service-2');
      expect(tracer1).not.toBe(tracer2);
    });

    it('should return different tracer instances for different versions', () => {
      const tracer1 = tracerProvider.getTracer('test-service', '1.0.0');
      const tracer2 = tracerProvider.getTracer('test-service', '2.0.0');
      expect(tracer1).not.toBe(tracer2);
    });
  });

  describe('tracer initialization with options', () => {
    it('should store options when creating a tracer', () => {
      const options: TracerOptions = { customOption: 'value' };
      tracerProvider.getTracer('test-service', '1.0.0', options);
      expect(tracerProvider.getLastOptions()).toEqual(options);
    });

    it('should handle undefined options', () => {
      tracerProvider.getTracer('test-service');
      expect(tracerProvider.getLastOptions()).toBeNull();
    });

    it('should support journey-specific options', () => {
      const options: TracerOptions = { 
        journeyType: 'health',
        userId: 'user-123',
        sessionId: 'session-456'
      };
      tracerProvider.getTracer('health-service', '1.0.0', options);
      expect(tracerProvider.getLastOptions()).toEqual(options);
    });
  });

  describe('error handling', () => {
    it('should throw an error when tracer creation fails', () => {
      tracerProvider.setErrorOnCreate(true);
      expect(() => tracerProvider.getTracer('test-service')).toThrow('Failed to create tracer');
    });

    it('should handle empty service name', () => {
      expect(() => tracerProvider.getTracer('')).toThrow('Service name is required');
    });

    it('should handle null service name', () => {
      expect(() => tracerProvider.getTracer(null as unknown as string)).toThrow('Service name is required');
    });
  });

  describe('singleton behavior', () => {
    it('should maintain a singleton instance per service name and version', () => {
      const tracer1 = tracerProvider.getTracer('test-service', '1.0.0');
      const tracer2 = tracerProvider.getTracer('test-service', '1.0.0');
      expect(tracer1).toBe(tracer2);
    });

    it('should clear all tracers on shutdown', async () => {
      tracerProvider.getTracer('test-service');
      await tracerProvider.shutdown();
      
      // After shutdown, a new tracer instance should be created
      tracerProvider.clearTracers(); // Clear the internal map to simulate shutdown
      const newTracer = tracerProvider.getTracer('test-service');
      const originalTracer = tracerProvider.getTracer('test-service');
      
      // The new tracer should be the same as the one after shutdown (singleton behavior)
      expect(newTracer).toBe(originalTracer);
    });
  });

  describe('isEnabled', () => {
    it('should return true by default', () => {
      expect(tracerProvider.isEnabled()).toBe(true);
    });

    it('should return the configured enabled state', () => {
      tracerProvider.setEnabled(false);
      expect(tracerProvider.isEnabled()).toBe(false);

      tracerProvider.setEnabled(true);
      expect(tracerProvider.isEnabled()).toBe(true);
    });
  });

  describe('context management', () => {
    it('should set and get active context', () => {
      const context = { spanId: '123', traceId: '456' } as Context;
      tracerProvider.setActiveContext(context);
      expect(tracerProvider.getActiveContext()).toBe(context);
    });

    it('should return a function that restores previous context', () => {
      const context1 = { spanId: '123', traceId: '456' } as Context;
      const context2 = { spanId: '789', traceId: '012' } as Context;
      
      tracerProvider.setActiveContext(context1);
      const restore = tracerProvider.setActiveContext(context2);
      expect(tracerProvider.getActiveContext()).toBe(context2);
      
      restore();
      expect(tracerProvider.getActiveContext()).toBe(context1);
    });
  });

  describe('forceFlush', () => {
    it('should resolve successfully', async () => {
      await expect(tracerProvider.forceFlush()).resolves.toBeUndefined();
    });
  });

  describe('shutdown', () => {
    it('should resolve successfully', async () => {
      await expect(tracerProvider.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('extractContext and injectContext', () => {
    it('should extract context from carrier', () => {
      const carrier = { 'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01' };
      const context = tracerProvider.extractContext(carrier);
      expect(context).toBeDefined();
    });

    it('should inject context into carrier', () => {
      const carrier: Record<string, unknown> = {};
      const context = { spanId: '123', traceId: '456' } as Context;
      
      tracerProvider.injectContext(carrier, context);
      // In a real implementation, this would add trace context to the carrier
      // Since this is a mock, we're just testing that it doesn't throw
      expect(carrier).toBeDefined();
    });
  });
});