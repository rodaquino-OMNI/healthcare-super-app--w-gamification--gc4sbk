/**
 * @file test-module.utils.ts
 * @description Provides utilities for bootstrapping NestJS test modules with properly configured tracing
 * for different test scenarios. These utilities help create realistic test environments that accurately
 * represent production tracing behavior.
 */

import { DynamicModule, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { 
  TracingModule, 
  TracingService, 
  TracingOptions,
  JourneyType,
  JourneyContext,
  createJourneyContext
} from '../../src';

/**
 * Options for creating a test module with tracing capabilities
 */
export interface TracingTestModuleOptions {
  /**
   * Whether to use a real TracingService (true) or a mock (false)
   * @default false
   */
  useRealTracer?: boolean;

  /**
   * Custom tracing options to use for the test
   */
  tracingOptions?: TracingOptions;

  /**
   * Whether to include the LoggerService for trace-log correlation testing
   * @default false
   */
  includeLogger?: boolean;

  /**
   * Journey type for journey-specific testing
   */
  journeyType?: JourneyType;

  /**
   * Additional providers to include in the test module
   */
  providers?: Provider[];

  /**
   * Additional imports to include in the test module
   */
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;

  /**
   * Additional exports to include in the test module
   */
  exports?: Array<Type<any> | DynamicModule | Promise<DynamicModule>>;

  /**
   * Environment variables to set for the test
   */
  env?: Record<string, string>;
}

/**
 * Mock implementation of the TracingService for testing
 */
export class MockTracingService {
  // Store spans for verification in tests
  public readonly spans: Array<{ name: string, attributes: Record<string, any> }> = [];
  
  // Store the current span for context testing
  private currentSpan: { name: string, attributes: Record<string, any> } | null = null;

  // Mock trace and span IDs for consistent testing
  private readonly mockTraceId = '00000000000000000000000000000000';
  private readonly mockSpanId = '0000000000000000';

  /**
   * Creates a new span for testing
   * @param name The name of the span
   * @param fn The function to execute within the span
   * @param options Optional span options
   * @returns The result of the function execution
   */
  async createSpan<T>(name: string, fn: () => Promise<T>, options?: any): Promise<T> {
    const span = { 
      name, 
      attributes: { ...options?.attributes } 
    };
    
    this.spans.push(span);
    this.currentSpan = span;
    
    try {
      return await fn();
    } finally {
      this.currentSpan = null;
    }
  }

  /**
   * Gets the current active span
   * @returns The current span or undefined
   */
  getCurrentSpan() {
    return this.currentSpan ? { spanContext: () => this.createMockSpanContext() } : undefined;
  }

  /**
   * Starts a new span
   * @param name The name of the span
   * @param options Optional span options
   * @returns The newly created span
   */
  startSpan(name: string, options?: any) {
    const span = { 
      name, 
      attributes: { ...options?.attributes },
      isRecording: () => true,
      setAttribute: (key: string, value: any) => {
        span.attributes[key] = value;
        return span;
      },
      addEvent: (name: string, attributes?: Record<string, any>) => span,
      setStatus: (status: { code: number, message?: string }) => span,
      end: () => {},
      recordException: (exception: Error) => {},
      spanContext: () => this.createMockSpanContext()
    };
    
    this.spans.push(span);
    this.currentSpan = span;
    
    return span;
  }

  /**
   * Extracts trace context from carrier object
   * @param carrier The carrier object
   * @returns A mock context
   */
  extractContext(carrier: any) {
    return {};
  }

  /**
   * Injects the current trace context into a carrier object
   * @param carrier The carrier object
   */
  injectContext(carrier: any) {
    carrier['traceparent'] = `00-${this.mockTraceId}-${this.mockSpanId}-01`;
    return carrier;
  }

  /**
   * Gets a correlation ID for linking traces, logs, and metrics
   * @returns A mock correlation ID
   */
  getCorrelationId() {
    return this.mockTraceId;
  }

  /**
   * Gets correlation information from the current trace context
   * @returns A mock correlation info object
   */
  getCorrelationInfo() {
    return {
      'trace.id': this.mockTraceId,
      'span.id': this.mockSpanId,
      'trace.sampled': true
    };
  }

  /**
   * Sets journey context on the current span
   * @param journeyContext The journey context
   */
  setJourneyContext(journeyContext: JourneyContext) {
    if (this.currentSpan) {
      this.currentSpan.attributes['journey.type'] = journeyContext.journeyType;
      this.currentSpan.attributes['journey.id'] = journeyContext.journeyId;
    }
  }

  /**
   * Adds an event to the current span
   * @param name The name of the event
   * @param attributes Optional attributes for the event
   */
  addEvent(name: string, attributes?: Record<string, unknown>) {
    // Implementation not needed for most tests
  }

  /**
   * Sets attributes on the current span
   * @param attributes The attributes to add
   */
  setAttributes(attributes: Record<string, unknown>) {
    if (this.currentSpan) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.currentSpan!.attributes[key] = value;
      });
    }
  }

  /**
   * Creates a mock span context for testing
   * @returns A mock span context
   */
  private createMockSpanContext() {
    return {
      traceId: this.mockTraceId,
      spanId: this.mockSpanId,
      traceFlags: 1,
      isRemote: false
    };
  }

  /**
   * Resets all stored spans and current span
   * Useful for cleaning up between tests
   */
  reset() {
    this.spans.length = 0;
    this.currentSpan = null;
  }
}

/**
 * Creates a test module with tracing capabilities
 * @param options Configuration options for the test module
 * @returns A configured TestingModule
 */
export async function createTracingTestModule(options: TracingTestModuleOptions = {}): Promise<TestingModule> {
  // Set environment variables for the test
  if (options.env) {
    Object.entries(options.env).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }

  // Create module metadata
  const moduleMetadata: ModuleMetadata = {
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => ({
          tracing: options.tracingOptions || getDefaultTracingOptions(options.journeyType)
        })]
      }),
      ...(options.imports || [])
    ],
    providers: [
      ...(options.providers || [])
    ],
    exports: [
      ...(options.exports || [])
    ]
  };

  // Add TracingModule with appropriate configuration
  if (options.useRealTracer) {
    moduleMetadata.imports!.push(TracingModule.registerAsync());
  } else {
    // Use mock TracingService
    moduleMetadata.providers!.push({
      provide: TracingService,
      useClass: MockTracingService
    });
  }

  // Add LoggerService if requested
  if (options.includeLogger) {
    moduleMetadata.providers!.push({
      provide: LoggerService,
      useFactory: (tracingService: TracingService) => {
        return new LoggerService({
          serviceName: 'test-service',
          logLevel: 'DEBUG',
          transports: ['console'],
          formatter: 'json'
        }, tracingService);
      },
      inject: [TracingService]
    });
  }

  // Create and return the test module
  return Test.createTestingModule(moduleMetadata).compile();
}

/**
 * Creates a test module specifically for Health journey testing
 * @param options Configuration options for the test module
 * @returns A configured TestingModule
 */
export async function createHealthJourneyTestModule(options: Omit<TracingTestModuleOptions, 'journeyType'> = {}): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    journeyType: JourneyType.HEALTH
  });
}

/**
 * Creates a test module specifically for Care journey testing
 * @param options Configuration options for the test module
 * @returns A configured TestingModule
 */
export async function createCareJourneyTestModule(options: Omit<TracingTestModuleOptions, 'journeyType'> = {}): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    journeyType: JourneyType.CARE
  });
}

/**
 * Creates a test module specifically for Plan journey testing
 * @param options Configuration options for the test module
 * @returns A configured TestingModule
 */
export async function createPlanJourneyTestModule(options: Omit<TracingTestModuleOptions, 'journeyType'> = {}): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    journeyType: JourneyType.PLAN
  });
}

/**
 * Creates a test module for cross-journey testing
 * @param options Configuration options for the test module
 * @returns A configured TestingModule
 */
export async function createCrossJourneyTestModule(options: TracingTestModuleOptions = {}): Promise<TestingModule> {
  // For cross-journey testing, we use a special configuration that enables all journey types
  const crossJourneyOptions: TracingOptions = {
    service: {
      name: 'cross-journey-test-service',
      environment: 'test',
      journey: 'shared'
    },
    journeyConfig: {
      health: {
        includeMetrics: true,
        includeDeviceInfo: true
      },
      care: {
        includeAppointments: true,
        includeProviders: true
      },
      plan: {
        includeClaims: true,
        includeBenefits: true
      }
    },
    sampling: {
      rate: 1.0,
      alwaysSampleErrors: true
    },
    exporter: {
      type: 'console',
      console: {
        prettyPrint: true
      }
    },
    debug: true
  };

  return createTracingTestModule({
    ...options,
    tracingOptions: crossJourneyOptions
  });
}

/**
 * Creates a test module with trace-log correlation capabilities
 * @param options Configuration options for the test module
 * @returns A configured TestingModule
 */
export async function createTraceLogCorrelationTestModule(options: TracingTestModuleOptions = {}): Promise<TestingModule> {
  return createTracingTestModule({
    ...options,
    includeLogger: true
  });
}

/**
 * Gets default tracing options based on journey type
 * @param journeyType The journey type to configure for
 * @returns Default tracing options for the specified journey type
 */
function getDefaultTracingOptions(journeyType?: JourneyType): TracingOptions {
  const baseOptions: TracingOptions = {
    service: {
      name: 'test-service',
      environment: 'test'
    },
    sampling: {
      rate: 1.0,
      alwaysSampleErrors: true
    },
    exporter: {
      type: 'console',
      console: {
        prettyPrint: true
      }
    },
    debug: true
  };

  if (!journeyType) {
    return baseOptions;
  }

  // Add journey-specific configuration
  switch (journeyType) {
    case JourneyType.HEALTH:
      return {
        ...baseOptions,
        service: {
          ...baseOptions.service,
          journey: 'health'
        },
        journeyConfig: {
          health: {
            includeMetrics: true,
            includeDeviceInfo: true
          }
        }
      };
    case JourneyType.CARE:
      return {
        ...baseOptions,
        service: {
          ...baseOptions.service,
          journey: 'care'
        },
        journeyConfig: {
          care: {
            includeAppointments: true,
            includeProviders: true
          }
        }
      };
    case JourneyType.PLAN:
      return {
        ...baseOptions,
        service: {
          ...baseOptions.service,
          journey: 'plan'
        },
        journeyConfig: {
          plan: {
            includeClaims: true,
            includeBenefits: true
          }
        }
      };
    default:
      return baseOptions;
  }
}

/**
 * Creates a mock journey context for testing
 * @param journeyType The journey type
 * @param userId The user ID (defaults to 'test-user')
 * @returns A journey context for testing
 */
export function createTestJourneyContext(journeyType: JourneyType, userId: string = 'test-user'): JourneyContext {
  return createJourneyContext(userId, journeyType);
}

/**
 * Helper function to verify trace-log correlation in tests
 * @param tracingService The tracing service instance
 * @param loggerService The logger service instance
 * @returns An object with utility methods for verification
 */
export function createTraceLogCorrelationTester(tracingService: TracingService, loggerService: LoggerService) {
  return {
    /**
     * Verifies that a log message contains the correct trace context
     * @param logSpy A spy on the logger method
     * @param expectedMessage The expected log message
     */
    verifyLogHasTraceContext(logSpy: jest.SpyInstance, expectedMessage: string) {
      expect(logSpy).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = logSpy.mock.calls[0];
      const message = callArgs[0];
      
      // Verify the message matches
      expect(message).toBe(expectedMessage);
      
      // If we have a context object, verify it has trace information
      if (callArgs.length > 1 && typeof callArgs[1] === 'object') {
        const context = callArgs[1];
        expect(context).toHaveProperty('trace.id');
        expect(context).toHaveProperty('span.id');
      }
    },
    
    /**
     * Creates a span and logs within it to test correlation
     * @param spanName The name of the span to create
     * @param logMessage The message to log
     * @param logLevel The log level to use
     */
    async createSpanWithLog(spanName: string, logMessage: string, logLevel: 'debug' | 'log' | 'warn' | 'error' = 'log') {
      return tracingService.createSpan(spanName, async () => {
        loggerService[logLevel](logMessage, { testContext: true });
        return true;
      });
    }
  };
}

/**
 * Helper function to create a test controller with tracing
 * @param controller The controller class to create
 * @param options Configuration options for the test module
 * @returns The controller instance and test module
 */
export async function createTestController<T>(controller: Type<T>, options: TracingTestModuleOptions = {}): Promise<{ controller: T, module: TestingModule }> {
  const testModule = await createTracingTestModule({
    ...options,
    providers: [
      controller,
      ...(options.providers || [])
    ]
  });
  
  const controllerInstance = testModule.get<T>(controller);
  return { controller: controllerInstance, module: testModule };
}

/**
 * Helper function to create a test service with tracing
 * @param service The service class to create
 * @param options Configuration options for the test module
 * @returns The service instance and test module
 */
export async function createTestService<T>(service: Type<T>, options: TracingTestModuleOptions = {}): Promise<{ service: T, module: TestingModule }> {
  const testModule = await createTracingTestModule({
    ...options,
    providers: [
      service,
      ...(options.providers || [])
    ]
  });
  
  const serviceInstance = testModule.get<T>(service);
  return { service: serviceInstance, module: testModule };
}

/**
 * Helper function to reset the mock tracing service between tests
 * @param module The test module containing the mock tracing service
 */
export function resetMockTracingService(module: TestingModule): void {
  const tracingService = module.get<MockTracingService>(TracingService);
  if (tracingService instanceof MockTracingService) {
    tracingService.reset();
  }
}

/**
 * Helper function to get all spans recorded by the mock tracing service
 * @param module The test module containing the mock tracing service
 * @returns Array of recorded spans
 */
export function getRecordedSpans(module: TestingModule): Array<{ name: string, attributes: Record<string, any> }> {
  const tracingService = module.get<MockTracingService>(TracingService);
  if (tracingService instanceof MockTracingService) {
    return tracingService.spans;
  }
  return [];
}

/**
 * Helper function to find a specific span by name
 * @param module The test module containing the mock tracing service
 * @param spanName The name of the span to find
 * @returns The found span or undefined
 */
export function findSpanByName(module: TestingModule, spanName: string): { name: string, attributes: Record<string, any> } | undefined {
  const spans = getRecordedSpans(module);
  return spans.find(span => span.name === spanName);
}

/**
 * Helper function to verify a span has specific attributes
 * @param span The span to verify
 * @param attributes The attributes to check for
 */
export function verifySpanAttributes(span: { name: string, attributes: Record<string, any> }, attributes: Record<string, any>): void {
  Object.entries(attributes).forEach(([key, value]) => {
    expect(span.attributes).toHaveProperty(key);
    expect(span.attributes[key]).toEqual(value);
  });
}