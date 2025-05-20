import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import {
  Tracer,
  SpanStatusCode,
  Span,
  SpanKind,
  Context,
  trace,
  context,
  SpanContext,
  SpanStatus,
  ROOT_CONTEXT,
  createNoopMeter,
  propagation,
  TraceFlags,
} from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  ReadableSpan,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Mock implementation of NestJS ConfigService for testing.
 * Provides default configuration values for tracing tests.
 */
export class MockConfigService implements Partial<ConfigService> {
  private readonly configValues: Record<string, any>;

  constructor(configOverrides: Record<string, any> = {}) {
    this.configValues = {
      'service.name': 'test-service',
      ...configOverrides,
    };
  }

  get<T>(propertyPath: string, defaultValue?: T): T {
    return (this.configValues[propertyPath] as T) ?? defaultValue;
  }
}

/**
 * Mock implementation of NestJS LoggerService for testing.
 * Captures log messages for verification in tests.
 */
export class MockLoggerService implements LoggerService {
  logs: { level: string; message: string; context?: string; meta?: any }[] = [];

  log(message: any, context?: string, meta?: any): void {
    this.logs.push({ level: 'log', message, context, meta });
  }

  error(message: any, trace?: string, context?: string, meta?: any): void {
    this.logs.push({ level: 'error', message, context, meta });
  }

  warn(message: any, context?: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, context, meta });
  }

  debug(message: any, context?: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, context, meta });
  }

  verbose(message: any, context?: string, meta?: any): void {
    this.logs.push({ level: 'verbose', message, context, meta });
  }

  /**
   * Clears all captured logs.
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Finds logs matching the given criteria.
   * @param level Log level to match
   * @param messagePattern String or RegExp to match against log messages
   * @param context Optional context to match
   */
  findLogs(level: string, messagePattern: string | RegExp, context?: string): any[] {
    return this.logs.filter(log => {
      const messageMatches = typeof messagePattern === 'string'
        ? log.message.includes(messagePattern)
        : messagePattern.test(log.message);
      
      return log.level === level && 
             messageMatches && 
             (context === undefined || log.context === context);
    });
  }
}

/**
 * Test utility for capturing OpenTelemetry spans during tests.
 */
export class TestTraceExporter {
  private readonly memoryExporter: InMemorySpanExporter;
  private readonly provider: NodeTracerProvider;
  private readonly tracer: Tracer;

  constructor(serviceName: string = 'test-service') {
    // Create an in-memory exporter for capturing spans
    this.memoryExporter = new InMemorySpanExporter();
    
    // Create a tracer provider with the in-memory exporter
    this.provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      }),
    });
    
    // Use SimpleSpanProcessor for immediate processing in tests
    this.provider.addSpanProcessor(new SimpleSpanProcessor(this.memoryExporter));
    
    // Register the provider
    this.provider.register();
    
    // Get a tracer instance
    this.tracer = trace.getTracer(serviceName);
  }

  /**
   * Gets the tracer instance.
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Gets all captured spans.
   */
  getSpans(): ReadableSpan[] {
    return this.memoryExporter.getFinishedSpans();
  }

  /**
   * Finds spans matching the given name.
   * @param name Span name to match
   */
  findSpans(name: string): ReadableSpan[] {
    return this.memoryExporter.getFinishedSpans().filter(span => span.name === name);
  }

  /**
   * Clears all captured spans.
   */
  clearSpans(): void {
    this.memoryExporter.reset();
  }

  /**
   * Shuts down the tracer provider.
   */
  async shutdown(): Promise<void> {
    await this.provider.shutdown();
  }
}

/**
 * Creates a test NestJS module with TracingModule and mocked dependencies.
 * @param configOverrides Optional configuration overrides for the mock ConfigService
 * @returns A testing module factory with TracingModule and mocked dependencies
 */
export async function createTestingTracingModule(
  configOverrides: Record<string, any> = {}
): Promise<TestingModule> {
  const mockConfigService = new MockConfigService(configOverrides);
  const mockLoggerService = new MockLoggerService();

  return Test.createTestingModule({
    imports: [TracingModule],
  })
    .overrideProvider(ConfigService)
    .useValue(mockConfigService)
    .overrideProvider(LoggerService)
    .useValue(mockLoggerService)
    .compile();
}

/**
 * Creates a test NestJS module with TracingService and mocked dependencies.
 * @param configOverrides Optional configuration overrides for the mock ConfigService
 * @returns A testing module factory with TracingService and mocked dependencies
 */
export async function createTestingTracingServiceModule(
  configOverrides: Record<string, any> = {}
): Promise<TestingModule> {
  const mockConfigService = new MockConfigService(configOverrides);
  const mockLoggerService = new MockLoggerService();

  return Test.createTestingModule({
    providers: [TracingService],
  })
    .overrideProvider(ConfigService)
    .useValue(mockConfigService)
    .overrideProvider(LoggerService)
    .useValue(mockLoggerService)
    .compile();
}

/**
 * Creates a mock span context for testing trace context propagation.
 * @param traceId Optional trace ID (generated if not provided)
 * @param spanId Optional span ID (generated if not provided)
 * @param traceFlags Optional trace flags
 * @param isRemote Whether the context is remote
 * @returns A SpanContext object
 */
export function createMockSpanContext(
  traceId?: string,
  spanId?: string,
  traceFlags: TraceFlags = TraceFlags.SAMPLED,
  isRemote: boolean = false
): SpanContext {
  // Generate random trace and span IDs if not provided
  const generatedTraceId = traceId || '0af7651916cd43dd8448eb211c80319c';
  const generatedSpanId = spanId || 'b7ad6b7169203331';

  return {
    traceId: generatedTraceId,
    spanId: generatedSpanId,
    traceFlags,
    isRemote,
    traceState: undefined,
  };
}

/**
 * Creates a mock active span context for testing.
 * @param spanContext Optional span context (generated if not provided)
 * @returns A Context object with the active span
 */
export function createMockActiveSpanContext(spanContext?: SpanContext): Context {
  const mockContext = spanContext || createMockSpanContext();
  return trace.setSpanContext(ROOT_CONTEXT, mockContext);
}

/**
 * Simulates HTTP headers with trace context for testing context propagation.
 * @param spanContext Optional span context to inject (generated if not provided)
 * @returns HTTP headers with trace context
 */
export function createMockHttpHeadersWithTraceContext(spanContext?: SpanContext): Record<string, string> {
  const mockContext = spanContext || createMockSpanContext();
  const carrier: Record<string, string> = {};
  
  propagation.inject(trace.setSpanContext(ROOT_CONTEXT, mockContext), carrier);
  return carrier;
}

/**
 * Simulates Kafka message headers with trace context for testing context propagation.
 * @param spanContext Optional span context to inject (generated if not provided)
 * @returns Kafka message headers with trace context
 */
export function createMockKafkaHeadersWithTraceContext(spanContext?: SpanContext): Record<string, Buffer> {
  const mockContext = spanContext || createMockSpanContext();
  const httpHeaders: Record<string, string> = {};
  
  propagation.inject(trace.setSpanContext(ROOT_CONTEXT, mockContext), httpHeaders);
  
  // Convert string headers to Buffer for Kafka
  const kafkaHeaders: Record<string, Buffer> = {};
  for (const [key, value] of Object.entries(httpHeaders)) {
    kafkaHeaders[key] = Buffer.from(value);
  }
  
  return kafkaHeaders;
}

/**
 * Assertion helpers for verifying span properties.
 */
export const SpanAssertions = {
  /**
   * Asserts that a span has the expected name.
   * @param span The span to check
   * @param expectedName The expected span name
   */
  hasName(span: ReadableSpan, expectedName: string): void {
    if (span.name !== expectedName) {
      throw new Error(`Expected span name to be "${expectedName}", but got "${span.name}"`);
    }
  },

  /**
   * Asserts that a span has the expected kind.
   * @param span The span to check
   * @param expectedKind The expected span kind
   */
  hasKind(span: ReadableSpan, expectedKind: SpanKind): void {
    if (span.kind !== expectedKind) {
      throw new Error(`Expected span kind to be ${SpanKind[expectedKind]}, but got ${SpanKind[span.kind]}`);
    }
  },

  /**
   * Asserts that a span has the expected status.
   * @param span The span to check
   * @param expectedStatus The expected span status
   */
  hasStatus(span: ReadableSpan, expectedStatus: SpanStatusCode): void {
    if (span.status.code !== expectedStatus) {
      throw new Error(`Expected span status to be ${SpanStatusCode[expectedStatus]}, but got ${SpanStatusCode[span.status.code]}`);
    }
  },

  /**
   * Asserts that a span has an attribute with the expected value.
   * @param span The span to check
   * @param key The attribute key
   * @param expectedValue The expected attribute value
   */
  hasAttribute(span: ReadableSpan, key: string, expectedValue: any): void {
    const value = span.attributes[key];
    if (value === undefined) {
      throw new Error(`Expected span to have attribute "${key}", but it was not found`);
    }
    
    if (value !== expectedValue) {
      throw new Error(`Expected span attribute "${key}" to be ${expectedValue}, but got ${value}`);
    }
  },

  /**
   * Asserts that a span has recorded an exception.
   * @param span The span to check
   * @param errorNameOrMessage Optional error name or message to match
   */
  hasRecordedException(span: ReadableSpan, errorNameOrMessage?: string): void {
    const events = span.events;
    const exceptionEvent = events.find(event => event.name === 'exception');
    
    if (!exceptionEvent) {
      throw new Error('Expected span to have recorded an exception, but none was found');
    }
    
    if (errorNameOrMessage) {
      const errorType = exceptionEvent.attributes?.['exception.type'];
      const errorMessage = exceptionEvent.attributes?.['exception.message'];
      
      if (errorType !== errorNameOrMessage && errorMessage !== errorNameOrMessage) {
        throw new Error(`Expected exception to have name or message "${errorNameOrMessage}", but got type "${errorType}" and message "${errorMessage}"`);
      }
    }
  },

  /**
   * Asserts that a span has a parent with the expected span ID.
   * @param span The span to check
   * @param expectedParentSpanId The expected parent span ID
   */
  hasParent(span: ReadableSpan, expectedParentSpanId: string): void {
    const parentSpanId = span.parentSpanId;
    if (!parentSpanId) {
      throw new Error('Expected span to have a parent, but it does not');
    }
    
    if (parentSpanId !== expectedParentSpanId) {
      throw new Error(`Expected parent span ID to be "${expectedParentSpanId}", but got "${parentSpanId}"`);
    }
  },
};

/**
 * Runs a function within a traced context for testing.
 * @param name The name of the span to create
 * @param fn The function to execute within the span context
 * @param tracer The tracer to use (creates a new one if not provided)
 * @returns The result of the function execution
 */
export async function runWithTestSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  tracer?: Tracer
): Promise<T> {
  const testTracer = tracer || new TestTraceExporter().getTracer();
  let result: T;
  
  await testTracer.startActiveSpan(name, async (span) => {
    try {
      result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
  
  return result!;
}

/**
 * Creates a test service that uses TracingService for integration testing.
 * @param tracingService The TracingService instance to use
 * @returns A test service with traced methods
 */
export function createTestTracedService(tracingService: TracingService) {
  return {
    /**
     * A test method that uses TracingService to create a span.
     * @param input The input to process
     * @returns The processed input
     */
    async processWithTracing(input: string): Promise<string> {
      return tracingService.createSpan('process-operation', async () => {
        // Simulate some processing
        await new Promise(resolve => setTimeout(resolve, 10));
        return `Processed: ${input}`;
      });
    },

    /**
     * A test method that uses TracingService and throws an error.
     * @param input The input to process
     */
    async processWithError(input: string): Promise<string> {
      return tracingService.createSpan('error-operation', async () => {
        // Simulate some processing that fails
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error(`Failed to process: ${input}`);
      });
    },

    /**
     * A test method that creates nested spans using TracingService.
     * @param input The input to process
     * @returns The processed input
     */
    async processWithNestedSpans(input: string): Promise<string> {
      return tracingService.createSpan('parent-operation', async () => {
        // First nested operation
        const result1 = await tracingService.createSpan('child-operation-1', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `First: ${input}`;
        });
        
        // Second nested operation
        const result2 = await tracingService.createSpan('child-operation-2', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `Second: ${result1}`;
        });
        
        return result2;
      });
    },
  };
}