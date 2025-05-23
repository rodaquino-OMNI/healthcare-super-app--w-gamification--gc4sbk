/**
 * Integration test utilities for the tracing package.
 * 
 * This file provides helper functions and mock implementations for testing the tracing
 * functionality in integration tests. It includes test module factories, mock services,
 * and assertion helpers for verifying trace creation and context propagation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingModule } from '../../src';
import { TracingService } from '../../src';
import { Context, Span, SpanKind, SpanStatusCode, trace, Tracer } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import * as http from 'http';
import * as https from 'https';
import { AddressInfo } from 'net';

/**
 * Mock implementation of the ConfigService for testing.
 * Provides default configuration values for tracing.
 */
export class MockConfigService implements Partial<ConfigService> {
  private config: Record<string, any> = {
    'service.name': 'test-service',
    'tracing.enabled': true,
    'tracing.exporter': 'console',
    'tracing.sampler.type': 'always-on',
  };

  constructor(customConfig?: Record<string, any>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  get<T>(propertyPath: string, defaultValue?: T): T {
    return propertyPath in this.config 
      ? this.config[propertyPath] 
      : (defaultValue as T);
  }
}

/**
 * Mock implementation of the LoggerService for testing.
 * Captures log messages for verification in tests.
 */
export class MockLoggerService implements LoggerService {
  logs: { level: string; message: string; context?: string; trace?: string }[] = [];

  log(message: any, context?: string): void {
    this.logs.push({ level: 'log', message, context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logs.push({ level: 'error', message, trace, context });
  }

  warn(message: any, context?: string): void {
    this.logs.push({ level: 'warn', message, context });
  }

  debug(message: any, context?: string): void {
    this.logs.push({ level: 'debug', message, context });
  }

  verbose(message: any, context?: string): void {
    this.logs.push({ level: 'verbose', message, context });
  }

  /**
   * Clears all captured logs.
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Finds logs matching the given criteria.
   */
  findLogs(options: { level?: string; message?: string | RegExp; context?: string }): any[] {
    return this.logs.filter(log => {
      if (options.level && log.level !== options.level) return false;
      if (options.context && log.context !== options.context) return false;
      if (options.message) {
        if (options.message instanceof RegExp) {
          return options.message.test(log.message);
        } else {
          return log.message.includes(options.message);
        }
      }
      return true;
    });
  }
}

/**
 * In-memory span collector for capturing and analyzing spans in tests.
 */
export class TestSpanCollector {
  private exporter: InMemorySpanExporter;
  private provider: NodeTracerProvider;

  constructor(serviceName: string = 'test-service') {
    this.exporter = new InMemorySpanExporter();
    this.provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      }),
    });
    this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter));
    this.provider.register();
  }

  /**
   * Gets the tracer from the provider.
   */
  getTracer(name: string = 'test-tracer'): Tracer {
    return this.provider.getTracer(name);
  }

  /**
   * Gets all collected spans.
   */
  getSpans(): ReadableSpan[] {
    return this.exporter.getFinishedSpans();
  }

  /**
   * Clears all collected spans.
   */
  clearSpans(): void {
    this.exporter.reset();
  }

  /**
   * Finds spans matching the given criteria.
   */
  findSpans(options: { name?: string | RegExp; kind?: SpanKind; attributes?: Record<string, any> }): ReadableSpan[] {
    return this.getSpans().filter(span => {
      if (options.name) {
        if (options.name instanceof RegExp) {
          if (!options.name.test(span.name)) return false;
        } else if (span.name !== options.name) {
          return false;
        }
      }

      if (options.kind !== undefined && span.kind !== options.kind) {
        return false;
      }

      if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
          if (span.attributes[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Shuts down the tracer provider.
   */
  shutdown(): Promise<void> {
    return this.provider.shutdown();
  }
}

/**
 * Options for creating a test module with tracing.
 */
export interface TracingTestModuleOptions {
  /**
   * Custom configuration for the ConfigService.
   */
  config?: Record<string, any>;

  /**
   * Additional providers to include in the test module.
   */
  providers?: any[];

  /**
   * Additional imports to include in the test module.
   */
  imports?: any[];
}

/**
 * Creates a NestJS test module with tracing enabled.
 */
export async function createTracingTestModule(options: TracingTestModuleOptions = {}): Promise<TestingModule> {
  const mockConfigService = new MockConfigService(options.config);
  const mockLoggerService = new MockLoggerService();

  const moduleBuilder = Test.createTestingModule({
    imports: [TracingModule, ...(options.imports || [])],
    providers: [
      ...(options.providers || []),
      {
        provide: ConfigService,
        useValue: mockConfigService,
      },
      {
        provide: LoggerService,
        useValue: mockLoggerService,
      },
    ],
  });

  return moduleBuilder.compile();
}

/**
 * Creates a test server for simulating HTTP requests with trace context propagation.
 */
export async function createTestServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<{ server: http.Server; url: string }> {
  const server = http.createServer(handler);
  
  await new Promise<void>(resolve => server.listen(0, resolve));
  
  const address = server.address() as AddressInfo;
  const url = `http://localhost:${address.port}`;
  
  return { server, url };
}

/**
 * Makes an HTTP request with trace context propagation.
 */
export function makeTracedRequest(
  url: string,
  options: http.RequestOptions = {},
  parentContext?: Context
): Promise<{ response: http.IncomingMessage; body: string }> {
  return new Promise((resolve, reject) => {
    const currentContext = parentContext || trace.getActiveSpan()?.context || trace.context();
    const headers = options.headers || {};
    
    // Inject trace context into headers
    trace.propagation.inject(currentContext, headers);
    
    const requestOptions = {
      ...options,
      headers,
    };
    
    const req = http.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ response: res, body: data });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.method === 'POST' && options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Assertion helpers for verifying spans.
 */
export const spanAssertions = {
  /**
   * Asserts that a span with the given name exists.
   */
  assertSpanExists(spans: ReadableSpan[], name: string | RegExp): ReadableSpan {
    const span = spans.find(s => {
      if (name instanceof RegExp) {
        return name.test(s.name);
      }
      return s.name === name;
    });
    
    if (!span) {
      const availableSpans = spans.map(s => s.name).join(', ');
      throw new Error(`Span with name ${name} not found. Available spans: ${availableSpans}`);
    }
    
    return span;
  },

  /**
   * Asserts that a span has the expected attributes.
   */
  assertSpanHasAttributes(span: ReadableSpan, attributes: Record<string, any>): void {
    for (const [key, value] of Object.entries(attributes)) {
      if (span.attributes[key] !== value) {
        throw new Error(`Span attribute ${key} expected to be ${value} but was ${span.attributes[key]}`);
      }
    }
  },

  /**
   * Asserts that a span has the expected status.
   */
  assertSpanStatus(span: ReadableSpan, code: SpanStatusCode, message?: string): void {
    if (span.status.code !== code) {
      throw new Error(`Span status code expected to be ${code} but was ${span.status.code}`);
    }
    
    if (message !== undefined && span.status.message !== message) {
      throw new Error(`Span status message expected to be ${message} but was ${span.status.message}`);
    }
  },

  /**
   * Asserts that a span is a child of another span.
   */
  assertSpanIsChildOf(childSpan: ReadableSpan, parentSpan: ReadableSpan): void {
    const childParentSpanId = childSpan.parentSpanId;
    const parentSpanId = parentSpan.spanContext().spanId;
    
    if (childParentSpanId !== parentSpanId) {
      throw new Error(
        `Expected span ${childSpan.name} to be a child of ${parentSpan.name}, ` +
        `but parent span ID was ${childParentSpanId} instead of ${parentSpanId}`
      );
    }
  },
};

/**
 * Creates a mock span for testing.
 */
export function createMockSpan(name: string = 'test-span'): Span {
  return {
    name,
    spanContext: () => ({
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: 'abcdef1234567890',
      traceFlags: 1,
      isRemote: false,
    }),
    setAttribute: jest.fn().mockReturnThis(),
    setAttributes: jest.fn().mockReturnThis(),
    addEvent: jest.fn().mockReturnThis(),
    setStatus: jest.fn().mockReturnThis(),
    updateName: jest.fn().mockReturnThis(),
    end: jest.fn(),
    isRecording: jest.fn().mockReturnValue(true),
    recordException: jest.fn(),
  } as unknown as Span;
}

/**
 * Creates a mock tracer for testing.
 */
export function createMockTracer(): Tracer {
  return {
    startSpan: jest.fn().mockImplementation((name) => createMockSpan(name)),
    startActiveSpan: jest.fn().mockImplementation((name, options, context, fn) => {
      const span = createMockSpan(name);
      try {
        return fn(span);
      } finally {
        span.end();
      }
    }),
  } as unknown as Tracer;
}

/**
 * Creates a mock TracingService for testing.
 */
export function createMockTracingService(): TracingService {
  const mockTracer = createMockTracer();
  
  return {
    createSpan: jest.fn().mockImplementation(async (name, fn) => {
      const span = mockTracer.startSpan(name);
      try {
        return await fn();
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    }),
  } as unknown as TracingService;
}