import { Context, Span, SpanOptions, Tracer } from '@opentelemetry/api';
import { TracerProvider, TracerProviderOptions } from '../../../src/interfaces/tracer-provider.interface';
import { TRACER_SERVICE_NAME_MISSING, TRACER_INITIALIZATION_FAILED } from '../../../src/constants/error-codes';

/**
 * Mock implementation of the TracerProvider interface for testing
 */
class MockTracerProvider implements TracerProvider {
  private static instance: MockTracerProvider | null = null;
  private tracers: Map<string, Tracer> = new Map();
  private options: TracerProviderOptions | null = null;
  private initialized = false;

  /**
   * Get the singleton instance of the MockTracerProvider
   */
  public static getInstance(): MockTracerProvider {
    if (!MockTracerProvider.instance) {
      MockTracerProvider.instance = new MockTracerProvider();
    }
    return MockTracerProvider.instance;
  }

  /**
   * Reset the singleton instance for testing
   */
  public static resetInstance(): void {
    MockTracerProvider.instance = null;
  }

  /**
   * Configure the tracer provider with options
   */
  public configure(options: TracerProviderOptions): void {
    if (!options.serviceName) {
      throw new Error(`${TRACER_SERVICE_NAME_MISSING}: Service name is required`);
    }

    this.options = options;
    this.initialized = true;
  }

  /**
   * Get a tracer instance for the specified service
   */
  public getTracer(name: string, version?: string): Tracer {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    const key = version ? `${name}@${version}` : name;
    
    if (!this.tracers.has(key)) {
      this.tracers.set(key, this.createMockTracer(name, version));
    }
    
    return this.tracers.get(key)!;
  }

  /**
   * Create a new span
   */
  public createSpan(name: string, options?: SpanOptions, context?: Context): Span {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would create a span with the given options
    return {} as Span;
  }

  /**
   * Execute a function within a span
   */
  public async withSpan<T>(name: string, fn: () => Promise<T>, options?: SpanOptions): Promise<T> {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would create a span and execute the function within it
    return fn();
  }

  /**
   * Get the current context
   */
  public getCurrentContext(): Context {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would return the current context
    return {} as Context;
  }

  /**
   * Set the current context
   */
  public setCurrentContext(context: Context): () => void {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would set the current context and return a function to restore it
    return () => {};
  }

  /**
   * Execute a function with a context
   */
  public withContext<T>(context: Context, fn: () => T): T {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would execute the function with the given context
    return fn();
  }

  /**
   * Inject context into a carrier
   */
  public inject(carrier: Record<string, string>, context?: Context): void {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would inject the context into the carrier
  }

  /**
   * Extract context from a carrier
   */
  public extract(carrier: Record<string, string>): Context {
    if (!this.initialized) {
      throw new Error(`${TRACER_INITIALIZATION_FAILED}: Provider not initialized`);
    }

    // In a real implementation, this would extract the context from the carrier
    return {} as Context;
  }

  /**
   * Create a mock tracer
   */
  private createMockTracer(name: string, version?: string): Tracer {
    // In a real implementation, this would create a real tracer
    return {
      startSpan: jest.fn(),
      startActiveSpan: jest.fn(),
      name,
      version
    } as unknown as Tracer;
  }

  /**
   * Get the configured options for testing
   */
  public getOptions(): TracerProviderOptions | null {
    return this.options;
  }

  /**
   * Check if the provider is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

describe('TracerProvider Interface', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    MockTracerProvider.resetInstance();
  });

  describe('Configuration', () => {
    it('should require a service name in configuration', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.configure({} as TracerProviderOptions);
      }).toThrow(TRACER_SERVICE_NAME_MISSING);
    });

    it('should accept valid configuration options', () => {
      const provider = MockTracerProvider.getInstance();
      const options: TracerProviderOptions = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        enabled: true,
        samplingRatio: 0.5,
        defaultAttributes: { env: 'test' },
        exporterConfig: {
          type: 'console'
        },
        journeyConfig: {
          journeyId: 'health',
          attributes: { journeyName: 'Health Journey' }
        }
      };

      provider.configure(options);
      
      expect(provider.isInitialized()).toBe(true);
      expect(provider.getOptions()).toEqual(options);
    });

    it('should accept minimal configuration with only service name', () => {
      const provider = MockTracerProvider.getInstance();
      const options: TracerProviderOptions = {
        serviceName: 'minimal-service'
      };

      provider.configure(options);
      
      expect(provider.isInitialized()).toBe(true);
      expect(provider.getOptions()).toEqual(options);
    });
  });

  describe('Tracer Acquisition', () => {
    it('should throw an error if getTracer is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.getTracer('test-service');
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should return a tracer when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const tracer = provider.getTracer('component-name');
      
      expect(tracer).toBeDefined();
      expect(tracer.name).toBe('component-name');
    });

    it('should return the same tracer instance for the same name', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const tracer1 = provider.getTracer('component-name');
      const tracer2 = provider.getTracer('component-name');
      
      expect(tracer1).toBe(tracer2);
    });

    it('should return different tracer instances for different names', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const tracer1 = provider.getTracer('component-1');
      const tracer2 = provider.getTracer('component-2');
      
      expect(tracer1).not.toBe(tracer2);
    });

    it('should include version in tracer when provided', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const tracer = provider.getTracer('component-name', '1.0.0');
      
      expect(tracer).toBeDefined();
      expect(tracer.name).toBe('component-name');
      expect(tracer.version).toBe('1.0.0');
    });

    it('should return different tracers for same name but different versions', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const tracer1 = provider.getTracer('component-name', '1.0.0');
      const tracer2 = provider.getTracer('component-name', '2.0.0');
      
      expect(tracer1).not.toBe(tracer2);
      expect(tracer1.version).toBe('1.0.0');
      expect(tracer2.version).toBe('2.0.0');
    });
  });

  describe('Span Operations', () => {
    it('should throw an error if createSpan is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.createSpan('test-span');
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should create a span when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const span = provider.createSpan('test-span');
      
      expect(span).toBeDefined();
    });

    it('should throw an error if withSpan is called before initialization', async () => {
      const provider = MockTracerProvider.getInstance();
      
      await expect(async () => {
        await provider.withSpan('test-span', async () => 'result');
      }).rejects.toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should execute a function within a span when properly initialized', async () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const result = await provider.withSpan('test-span', async () => 'result');
      
      expect(result).toBe('result');
    });
  });

  describe('Context Operations', () => {
    it('should throw an error if getCurrentContext is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.getCurrentContext();
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should get the current context when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const context = provider.getCurrentContext();
      
      expect(context).toBeDefined();
    });

    it('should throw an error if setCurrentContext is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.setCurrentContext({} as Context);
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should set the current context when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const restore = provider.setCurrentContext({} as Context);
      
      expect(restore).toBeDefined();
      expect(typeof restore).toBe('function');
    });

    it('should throw an error if withContext is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.withContext({} as Context, () => 'result');
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should execute a function with context when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const result = provider.withContext({} as Context, () => 'result');
      
      expect(result).toBe('result');
    });
  });

  describe('Context Propagation', () => {
    it('should throw an error if inject is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.inject({});
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should inject context when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const carrier = {};
      provider.inject(carrier);
      
      // In a real test, we would verify that the carrier was modified correctly
      expect(carrier).toBeDefined();
    });

    it('should throw an error if extract is called before initialization', () => {
      const provider = MockTracerProvider.getInstance();
      
      expect(() => {
        provider.extract({});
      }).toThrow(TRACER_INITIALIZATION_FAILED);
    });

    it('should extract context when properly initialized', () => {
      const provider = MockTracerProvider.getInstance();
      provider.configure({ serviceName: 'test-service' });
      
      const context = provider.extract({});
      
      expect(context).toBeDefined();
    });
  });

  describe('Singleton Behavior', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const provider1 = MockTracerProvider.getInstance();
      const provider2 = MockTracerProvider.getInstance();
      
      expect(provider1).toBe(provider2);
    });

    it('should maintain state across getInstance calls', () => {
      const provider1 = MockTracerProvider.getInstance();
      provider1.configure({ serviceName: 'test-service' });
      
      const provider2 = MockTracerProvider.getInstance();
      
      expect(provider2.isInitialized()).toBe(true);
      expect(provider2.getOptions()?.serviceName).toBe('test-service');
    });

    it('should reset state when resetInstance is called', () => {
      const provider1 = MockTracerProvider.getInstance();
      provider1.configure({ serviceName: 'test-service' });
      
      MockTracerProvider.resetInstance();
      const provider2 = MockTracerProvider.getInstance();
      
      expect(provider2.isInitialized()).toBe(false);
      expect(provider2.getOptions()).toBeNull();
    });
  });
});