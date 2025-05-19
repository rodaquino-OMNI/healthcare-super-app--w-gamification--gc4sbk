import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { Context, Span, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';
import { TracingModule } from '../../src';
import { TracingService } from '../../src';

/**
 * Mock implementation of the OpenTelemetry Span interface for testing.
 */
export class MockSpan implements Span {
  private _attributes: Record<string, unknown> = {};
  private _events: Array<{ name: string; attributes?: Record<string, unknown> }> = [];
  private _status: { code: SpanStatusCode; message?: string } = { code: SpanStatusCode.UNSET };
  private _isRecording = true;
  private _name: string;
  private _endCalled = false;
  private _exceptions: Error[] = [];

  constructor(name: string) {
    this._name = name;
  }

  spanContext() {
    return {
      traceId: 'mock-trace-id',
      spanId: 'mock-span-id',
      traceFlags: 1,
      isRemote: false,
    };
  }

  setAttribute(key: string, value: unknown): this {
    this._attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, unknown>): this {
    Object.entries(attributes).forEach(([key, value]) => {
      this._attributes[key] = value;
    });
    return this;
  }

  addEvent(name: string, attributes?: Record<string, unknown>): this {
    this._events.push({ name, attributes });
    return this;
  }

  setStatus(status: { code: SpanStatusCode; message?: string }): this {
    this._status = status;
    return this;
  }

  updateName(name: string): this {
    this._name = name;
    return this;
  }

  end(): void {
    this._endCalled = true;
    this._isRecording = false;
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  recordException(exception: Error, time?: number): void {
    this._exceptions.push(exception);
    this.addEvent('exception', {
      'exception.type': exception.name,
      'exception.message': exception.message,
      'exception.stacktrace': exception.stack,
    });
  }

  // Test helper methods
  get attributes(): Record<string, unknown> {
    return { ...this._attributes };
  }

  get events(): Array<{ name: string; attributes?: Record<string, unknown> }> {
    return [...this._events];
  }

  get status(): { code: SpanStatusCode; message?: string } {
    return { ...this._status };
  }

  get name(): string {
    return this._name;
  }

  get endCalled(): boolean {
    return this._endCalled;
  }

  get exceptions(): Error[] {
    return [...this._exceptions];
  }
}

/**
 * Mock implementation of the OpenTelemetry Tracer interface for testing.
 */
export class MockTracer implements Tracer {
  private _spans: MockSpan[] = [];
  private _activeSpans: Map<Context, MockSpan> = new Map();

  startSpan(name: string, options?: any): MockSpan {
    const span = new MockSpan(name);
    this._spans.push(span);
    
    if (options?.root) {
      // Create a new root span
    } else if (options?.context) {
      // Use the provided context
      this._activeSpans.set(options.context, span);
    } else {
      // Use the current context
      const currentSpan = trace.getSpan(trace.context());
      if (currentSpan) {
        // This would be a child span in a real implementation
      }
    }
    
    return span;
  }

  startActiveSpan<T>(name: string, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(name: string, options: any, fn: (span: MockSpan) => T): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: any | ((span: MockSpan) => T),
    maybeFn?: (span: MockSpan) => T
  ): T {
    const fn = typeof optionsOrFn === 'function' ? optionsOrFn : maybeFn;
    const options = typeof optionsOrFn === 'function' ? {} : optionsOrFn;
    
    const span = this.startSpan(name, options);
    try {
      return fn!(span);
    } finally {
      span.end();
    }
  }

  // Test helper methods
  get spans(): MockSpan[] {
    return [...this._spans];
  }

  reset(): void {
    this._spans = [];
    this._activeSpans.clear();
  }

  findSpanByName(name: string): MockSpan | undefined {
    return this._spans.find(span => span.name === name);
  }

  findSpansByAttribute(key: string, value: unknown): MockSpan[] {
    return this._spans.filter(span => span.attributes[key] === value);
  }
}

/**
 * Mock implementation of the NestJS ConfigService for testing.
 */
export class MockConfigService implements Partial<ConfigService> {
  private _config: Record<string, any> = {
    'service.name': 'test-service',
    'tracing.enabled': true,
    'tracing.exporter': 'console',
  };

  constructor(config?: Record<string, any>) {
    if (config) {
      this._config = { ...this._config, ...config };
    }
  }

  get<T>(propertyPath: string, defaultValue?: T): T {
    return propertyPath in this._config
      ? this._config[propertyPath]
      : defaultValue as T;
  }

  // Test helper methods
  set(propertyPath: string, value: any): void {
    this._config[propertyPath] = value;
  }
}

/**
 * Mock implementation of the NestJS LoggerService for testing.
 */
export class MockLoggerService implements LoggerService {
  private _logs: Array<{ level: string; message: string; context?: string; trace?: string }> = [];

  log(message: string, context?: string): void {
    this._logs.push({ level: 'log', message, context });
  }

  error(message: string, trace?: string, context?: string): void {
    this._logs.push({ level: 'error', message, trace, context });
  }

  warn(message: string, context?: string): void {
    this._logs.push({ level: 'warn', message, context });
  }

  debug(message: string, context?: string): void {
    this._logs.push({ level: 'debug', message, context });
  }

  verbose(message: string, context?: string): void {
    this._logs.push({ level: 'verbose', message, context });
  }

  // Test helper methods
  get logs(): Array<{ level: string; message: string; context?: string; trace?: string }> {
    return [...this._logs];
  }

  reset(): void {
    this._logs = [];
  }

  findLogsByLevel(level: string): Array<{ level: string; message: string; context?: string; trace?: string }> {
    return this._logs.filter(log => log.level === level);
  }

  findLogsByMessage(substring: string): Array<{ level: string; message: string; context?: string; trace?: string }> {
    return this._logs.filter(log => log.message.includes(substring));
  }

  findLogsByContext(context: string): Array<{ level: string; message: string; context?: string; trace?: string }> {
    return this._logs.filter(log => log.context === context);
  }
}

/**
 * Options for creating a test module with tracing capabilities.
 */
export interface CreateTestingModuleOptions {
  /** Custom configuration for the ConfigService */
  config?: Record<string, any>;
  /** Custom tracer implementation */
  tracer?: MockTracer;
  /** Additional providers to include in the test module */
  providers?: any[];
  /** Additional imports to include in the test module */
  imports?: any[];
}

/**
 * Creates a NestJS testing module with TracingModule and mocked dependencies.
 * @param options Configuration options for the test module
 * @returns A promise that resolves to the compiled test module
 */
export async function createTestingModule(options: CreateTestingModuleOptions = {}): Promise<TestingModule> {
  const mockConfigService = new MockConfigService(options.config);
  const mockLoggerService = new MockLoggerService();
  const mockTracer = options.tracer || new MockTracer();

  // Create a spy on the trace.getTracer method to return our mock tracer
  const getTracerSpy = jest.spyOn(trace, 'getTracer').mockReturnValue(mockTracer);

  const moduleRef = await Test.createTestingModule({
    imports: [TracingModule, ...(options.imports || [])],
    providers: [
      {
        provide: ConfigService,
        useValue: mockConfigService,
      },
      {
        provide: LoggerService,
        useValue: mockLoggerService,
      },
      ...(options.providers || []),
    ],
  }).compile();

  // Store the mocks on the module for easy access in tests
  const testModule = moduleRef as TestingModule & {
    mockConfigService: MockConfigService;
    mockLoggerService: MockLoggerService;
    mockTracer: MockTracer;
    cleanupMocks: () => void;
  };
  
  testModule.mockConfigService = mockConfigService;
  testModule.mockLoggerService = mockLoggerService;
  testModule.mockTracer = mockTracer;
  testModule.cleanupMocks = () => {
    getTracerSpy.mockRestore();
  };

  return testModule;
}

/**
 * Creates a mock HTTP request with trace context headers.
 * @param traceId Optional trace ID to include in the headers
 * @param spanId Optional span ID to include in the headers
 * @returns A mock HTTP request object with trace context headers
 */
export function createMockRequestWithTraceContext(traceId = 'test-trace-id', spanId = 'test-span-id'): any {
  return {
    headers: {
      'traceparent': `00-${traceId}-${spanId}-01`,
      'tracestate': 'austa=journey-health',
    },
  };
}

/**
 * Creates a mock Kafka message with trace context.
 * @param traceId Optional trace ID to include in the headers
 * @param spanId Optional span ID to include in the headers
 * @returns A mock Kafka message object with trace context in headers
 */
export function createMockKafkaMessageWithTraceContext(traceId = 'test-trace-id', spanId = 'test-span-id'): any {
  return {
    headers: {
      'traceparent': Buffer.from(`00-${traceId}-${spanId}-01`),
      'tracestate': Buffer.from('austa=journey-health'),
    },
    value: Buffer.from(JSON.stringify({ eventType: 'test-event' })),
  };
}

/**
 * Assertion helpers for verifying span attributes and properties.
 */
export const SpanAssertions = {
  /**
   * Verifies that a span has the expected attributes.
   * @param span The span to check
   * @param expectedAttributes The expected attributes as key-value pairs
   * @throws Error if any expected attribute is missing or has an incorrect value
   */
  hasAttributes(span: MockSpan, expectedAttributes: Record<string, unknown>): void {
    Object.entries(expectedAttributes).forEach(([key, value]) => {
      expect(span.attributes).toHaveProperty(key);
      expect(span.attributes[key]).toEqual(value);
    });
  },

  /**
   * Verifies that a span has an event with the expected name and attributes.
   * @param span The span to check
   * @param eventName The expected event name
   * @param expectedAttributes Optional expected attributes for the event
   * @throws Error if the event is not found or has incorrect attributes
   */
  hasEvent(span: MockSpan, eventName: string, expectedAttributes?: Record<string, unknown>): void {
    const event = span.events.find(e => e.name === eventName);
    expect(event).toBeDefined();
    
    if (expectedAttributes && event) {
      Object.entries(expectedAttributes).forEach(([key, value]) => {
        expect(event.attributes).toBeDefined();
        expect(event.attributes).toHaveProperty(key);
        expect(event.attributes![key]).toEqual(value);
      });
    }
  },

  /**
   * Verifies that a span has recorded an exception.
   * @param span The span to check
   * @param errorType Optional expected error type (class name)
   * @param errorMessageSubstring Optional substring that should be present in the error message
   * @throws Error if no exception is recorded or it doesn't match the expected type/message
   */
  hasRecordedException(span: MockSpan, errorType?: string, errorMessageSubstring?: string): void {
    expect(span.exceptions.length).toBeGreaterThan(0);
    
    if (errorType) {
      expect(span.exceptions[0].name).toEqual(errorType);
    }
    
    if (errorMessageSubstring) {
      expect(span.exceptions[0].message).toContain(errorMessageSubstring);
    }
    
    // Also check for the exception event
    const exceptionEvent = span.events.find(e => e.name === 'exception');
    expect(exceptionEvent).toBeDefined();
  },

  /**
   * Verifies that a span has the expected status.
   * @param span The span to check
   * @param expectedCode The expected status code
   * @param expectedMessage Optional expected status message
   * @throws Error if the status doesn't match the expected values
   */
  hasStatus(span: MockSpan, expectedCode: SpanStatusCode, expectedMessage?: string): void {
    expect(span.status.code).toEqual(expectedCode);
    
    if (expectedMessage) {
      expect(span.status.message).toEqual(expectedMessage);
    }
  },

  /**
   * Verifies that a span has been ended.
   * @param span The span to check
   * @throws Error if the span has not been ended
   */
  hasBeenEnded(span: MockSpan): void {
    expect(span.endCalled).toBe(true);
    expect(span.isRecording()).toBe(false);
  },
};

/**
 * Assertion helpers for verifying trace context propagation.
 */
export const ContextPropagationAssertions = {
  /**
   * Verifies that HTTP headers contain valid trace context.
   * @param headers The HTTP headers to check
   * @throws Error if the headers don't contain valid trace context
   */
  httpHeadersHaveTraceContext(headers: Record<string, string>): void {
    expect(headers).toHaveProperty('traceparent');
    const traceparent = headers['traceparent'];
    expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
  },

  /**
   * Verifies that Kafka message headers contain valid trace context.
   * @param headers The Kafka message headers to check
   * @throws Error if the headers don't contain valid trace context
   */
  kafkaHeadersHaveTraceContext(headers: Record<string, Buffer>): void {
    expect(headers).toHaveProperty('traceparent');
    const traceparent = headers['traceparent'].toString();
    expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
  },

  /**
   * Verifies that a trace context contains journey-specific information.
   * @param headers The headers containing trace context
   * @param journeyType The expected journey type (health, care, plan)
   * @throws Error if the headers don't contain the expected journey information
   */
  traceContextHasJourneyInfo(headers: Record<string, string | Buffer>, journeyType: 'health' | 'care' | 'plan'): void {
    expect(headers).toHaveProperty('tracestate');
    const tracestate = headers['tracestate'] instanceof Buffer 
      ? headers['tracestate'].toString() 
      : headers['tracestate'];
    
    expect(tracestate).toContain(`journey-${journeyType}`);
  },
};

/**
 * Utility for testing the TracingService in isolation.
 */
export class TracingServiceTestUtil {
  private tracingService: TracingService;
  private mockTracer: MockTracer;

  /**
   * Creates a new TracingServiceTestUtil instance.
   * @param moduleRef The test module containing the TracingService
   */
  constructor(moduleRef: TestingModule & { mockTracer: MockTracer }) {
    this.tracingService = moduleRef.get<TracingService>(TracingService);
    this.mockTracer = moduleRef.mockTracer;
  }

  /**
   * Executes a function within a traced span and returns the created span for assertions.
   * @param spanName The name of the span to create
   * @param fn The function to execute within the span
   * @returns A promise that resolves to the created span
   */
  async executeInSpan<T>(spanName: string, fn: () => Promise<T>): Promise<{ result: T; span: MockSpan }> {
    const result = await this.tracingService.createSpan(spanName, fn);
    const span = this.mockTracer.findSpanByName(spanName);
    
    if (!span) {
      throw new Error(`No span found with name: ${spanName}`);
    }
    
    return { result, span };
  }

  /**
   * Executes a function that throws an error within a traced span and returns the created span for assertions.
   * @param spanName The name of the span to create
   * @param error The error to throw
   * @returns A promise that resolves to the created span
   */
  async executeErrorInSpan(spanName: string, error: Error): Promise<MockSpan> {
    try {
      await this.tracingService.createSpan(spanName, async () => {
        throw error;
      });
      throw new Error('Expected function to throw an error');
    } catch (e) {
      const span = this.mockTracer.findSpanByName(spanName);
      
      if (!span) {
        throw new Error(`No span found with name: ${spanName}`);
      }
      
      return span;
    }
  }

  /**
   * Resets the mock tracer, clearing all recorded spans.
   */
  resetTracer(): void {
    this.mockTracer.reset();
  }

  /**
   * Gets all spans recorded by the mock tracer.
   * @returns An array of all recorded spans
   */
  getAllSpans(): MockSpan[] {
    return this.mockTracer.spans;
  }

  /**
   * Finds a span by name.
   * @param name The name of the span to find
   * @returns The found span or undefined if not found
   */
  findSpanByName(name: string): MockSpan | undefined {
    return this.mockTracer.findSpanByName(name);
  }

  /**
   * Finds spans by attribute.
   * @param key The attribute key to search for
   * @param value The attribute value to match
   * @returns An array of spans with matching attributes
   */
  findSpansByAttribute(key: string, value: unknown): MockSpan[] {
    return this.mockTracer.findSpansByAttribute(key, value);
  }
}