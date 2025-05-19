/**
 * Test setup file for the tracing package
 * 
 * This file configures the testing environment before running tests, including:
 * - Initializing OpenTelemetry with a no-op tracer
 * - Setting up environment variables
 * - Establishing mock implementations of external dependencies
 * - Providing utilities for verifying trace context and attributes
 */

import { trace, context, SpanStatusCode, Context, Span, Tracer, TracerProvider } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { MockLogger } from './mocks/mock-logger';

// Set test environment variables
process.env.SERVICE_NAME = 'test-service';
process.env.NODE_ENV = 'test';
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318';
process.env.OTEL_EXPORTER_OTLP_PROTOCOL = 'http/protobuf';
process.env.OTEL_TRACES_SAMPLER = 'always_on';
process.env.OTEL_RESOURCE_ATTRIBUTES = 'service.name=test-service,environment=test';

// Create a global object to store test-specific data
declare global {
  // eslint-disable-next-line no-var
  var __TRACE_TEST_CONTEXT__: {
    spanExporter: InMemorySpanExporter;
    tracerProvider: NodeTracerProvider;
    mockLogger: MockLogger;
    spans: Span[];
    originalTracerProvider?: TracerProvider;
    originalMeterProvider?: any;
    originalContextManager?: any;
  };
}

/**
 * Initialize the OpenTelemetry test tracer for testing
 * 
 * This setup ensures that tests don't generate actual telemetry data to external systems
 * but still allows for verification of trace context and attributes within tests.
 * It uses an in-memory exporter to capture spans for verification.
 */
function setupTestTracing() {
  // Create an in-memory span exporter for test verification
  const spanExporter = new InMemorySpanExporter();
  
  // Create a tracer provider for testing
  const tracerProvider = new NodeTracerProvider({
    // Configure with test-specific sampling (always sample in tests)
    sampler: {
      shouldSample: () => ({ decision: 1, attributes: {} }), // Always sample
    },
    resource: {
      attributes: {
        'service.name': process.env.SERVICE_NAME || 'test-service',
        'environment': 'test',
        'library.name': '@austa/tracing',
      },
    },
  });
  
  // Use SimpleSpanProcessor for immediate processing in tests
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(spanExporter));
  
  // Register the tracer provider
  tracerProvider.register();
  
  // Create a mock logger for testing
  const mockLogger = new MockLogger();
  
  // Store original providers to restore after tests if needed
  const originalTracerProvider = trace.getTracerProvider();
  
  // Store test context in global object for access in tests
  global.__TRACE_TEST_CONTEXT__ = {
    spanExporter,
    tracerProvider,
    mockLogger,
    spans: [],
    originalTracerProvider,
  };
  
  // Set up a hook to collect spans for verification
  spanExporter.export = (spans, resultCallback) => {
    global.__TRACE_TEST_CONTEXT__.spans.push(...spans);
    resultCallback({ code: 0 });
    return Promise.resolve();
  };
}

/**
 * Mock the NestJS dependency injection container
 * 
 * This provides mock implementations of services that the TracingService depends on
 */
function setupMockDependencies() {
  // Mock ConfigService implementation
  jest.mock('@nestjs/config', () => {
    return {
      ConfigService: jest.fn().mockImplementation(() => {
        return {
          get: jest.fn((key, defaultValue) => {
            if (key === 'service.name') {
              return process.env.SERVICE_NAME || defaultValue;
            }
            return defaultValue;
          }),
        };
      }),
    };
  });
  
  // Mock LoggerService implementation
  jest.mock('@nestjs/common', () => {
    const original = jest.requireActual('@nestjs/common');
    return {
      ...original,
      Logger: jest.fn().mockImplementation(() => {
        return global.__TRACE_TEST_CONTEXT__.mockLogger;
      }),
      LoggerService: jest.fn().mockImplementation(() => {
        return global.__TRACE_TEST_CONTEXT__.mockLogger;
      }),
      Injectable: () => (target: any) => target,
    };
  });
}

/**
 * Set up test utilities for trace verification
 */
function setupTestUtilities() {
  // Add utility to get all collected spans
  global.getTestSpans = () => {
    return global.__TRACE_TEST_CONTEXT__.spans;
  };
  
  // Add utility to clear collected spans
  global.clearTestSpans = () => {
    global.__TRACE_TEST_CONTEXT__.spans = [];
  };
  
  // Add utility to get active span
  global.getActiveSpan = () => {
    return trace.getSpan(context.active());
  };
  
  // Add utility to create a test span
  global.createTestSpan = (name, fn) => {
    const tracer = trace.getTracer('test-tracer');
    return tracer.startActiveSpan(name, (span) => {
      try {
        const result = fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  };
  
  // Add utility to find a span by name
  global.getSpanByName = (name) => {
    return global.__TRACE_TEST_CONTEXT__.spans.find(span => span.name === name);
  };
  
  // Add utility to find spans by attribute
  global.getSpansByAttribute = (key, value) => {
    return global.__TRACE_TEST_CONTEXT__.spans.filter(span => {
      const attributes = span.attributes || {};
      return attributes[key] === value;
    });
  };
  
  // Add utility to create a mock trace context
  global.mockTraceContext = (spanContext) => {
    const activeContext = context.active();
    if (!spanContext) {
      return activeContext;
    }
    
    const mockSpan = {
      spanContext: () => spanContext,
    };
    
    return trace.setSpan(activeContext, mockSpan as unknown as Span);
  };
}

// Set up Jest hooks for before/after tests
beforeAll(() => {
  // Initialize the test environment
  setupTestTracing();
  setupMockDependencies();
  setupTestUtilities();
  
  // Ensure spans are cleared before tests start
  global.clearTestSpans();
});

// Clean up after all tests
afterAll(() => {
  // Shutdown the tracer provider
  if (global.__TRACE_TEST_CONTEXT__?.tracerProvider) {
    global.__TRACE_TEST_CONTEXT__.tracerProvider.shutdown();
  }
  
  // Restore original providers if needed
  if (global.__TRACE_TEST_CONTEXT__?.originalTracerProvider) {
    trace.setGlobalTracerProvider(global.__TRACE_TEST_CONTEXT__.originalTracerProvider);
  }
});

// Clear spans between tests
afterEach(() => {
  global.clearTestSpans();
});

// Add global type definitions for test utilities
declare global {
  function getTestSpans(): any[];
  function clearTestSpans(): void;
  function getActiveSpan(): Span | undefined;
  function createTestSpan<T>(name: string, fn: (span: Span) => T): T;
  
  // Additional test utilities
  function getSpanByName(name: string): Span | undefined;
  function getSpansByAttribute(key: string, value: string | number | boolean): Span[];
  function mockTraceContext(spanContext?: any): Context;
}