/**
 * Test setup file for the tracing package
 * 
 * This file configures the testing environment before running tests, including:
 * - Initializing OpenTelemetry with a no-op tracer
 * - Setting up environment variables
 * - Establishing mock implementations of external dependencies
 * 
 * Note: This setup assumes Jest is being used as the testing framework.
 * If you're using a different testing framework, you may need to adapt
 * the mocking and assertion utilities.
 */

import { trace, context, SpanStatusCode, SpanKind, TraceFlags } from '@opentelemetry/api';
import { NoopTracerProvider } from '@opentelemetry/api/build/src/trace/NoopTracerProvider';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

/**
 * Initialize OpenTelemetry with a no-op tracer provider for tests
 * This prevents tests from generating actual telemetry data
 */
export function setupTestTracing() {
  // Set up the global tracer provider as a no-op implementation
  const noopTracerProvider = new NoopTracerProvider();
  trace.setGlobalTracerProvider(noopTracerProvider);
  
  // Set up test environment variables
  process.env.OTEL_SERVICE_NAME = 'test-service';
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4317';
  process.env.OTEL_EXPORTER_OTLP_PROTOCOL = 'grpc';
  process.env.OTEL_TRACES_SAMPLER = 'always_on';
  process.env.OTEL_LOG_LEVEL = 'error';
  
  // Return the no-op tracer provider for test verification
  return noopTracerProvider;
}

/**
 * Create a test tracer provider that captures spans in memory
 * This allows tests to verify span creation without sending data to backends
 */
export function createTestTracerProvider() {
  const tracerProvider = new BasicTracerProvider();
  const spanProcessor = new BatchSpanProcessor(new ConsoleSpanExporter());
  tracerProvider.addSpanProcessor(spanProcessor);
  
  return tracerProvider;
}

/**
 * Create a mock ConfigService for testing
 * This provides test-specific configuration values
 */
export function createMockConfigService() {
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const configMap: Record<string, any> = {
        'service.name': 'test-service',
        'tracing.enabled': true,
        'tracing.exporter': 'console',
        'tracing.sampler': 'always_on',
      };
      
      return configMap[key] !== undefined ? configMap[key] : defaultValue;
    }),
  };
  
  return mockConfigService as unknown as ConfigService;
}

/**
 * Create a mock LoggerService for testing
 * This captures log messages for verification in tests
 */
export function createMockLoggerService() {
  const logMessages: Array<{level: string, message: string, context?: string}> = [];
  
  const mockLoggerService = {
    log: jest.fn((message: string, context?: string) => {
      logMessages.push({ level: 'log', message, context });
    }),
    error: jest.fn((message: string, trace?: string, context?: string) => {
      logMessages.push({ level: 'error', message, context });
    }),
    warn: jest.fn((message: string, context?: string) => {
      logMessages.push({ level: 'warn', message, context });
    }),
    debug: jest.fn((message: string, context?: string) => {
      logMessages.push({ level: 'debug', message, context });
    }),
    verbose: jest.fn((message: string, context?: string) => {
      logMessages.push({ level: 'verbose', message, context });
    }),
    getLogMessages: () => logMessages,
    clearLogMessages: () => {
      logMessages.length = 0;
    },
  };
  
  return mockLoggerService as unknown as LoggerService & {
    getLogMessages: () => Array<{level: string, message: string, context?: string}>,
    clearLogMessages: () => void
  };
}

/**
 * Create a test span for verification in tests
 * This provides a controlled span for testing span operations
 */
export function createTestSpan(name: string, attributes: Record<string, any> = {}) {
  const tracer = trace.getTracer('test-tracer');
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes,
  });
  
  return span;
}

/**
 * Create a test context with an active span
 * This allows testing context propagation
 */
export function createTestContextWithSpan(name: string) {
  const span = createTestSpan(name);
  const ctx = trace.setSpan(context.active(), span);
  
  return { span, ctx };
}

/**
 * Initialize the test environment
 * This should be called before running tests
 */
export function initTestEnvironment() {
  setupTestTracing();
  
  // Set up global Jest matchers for OpenTelemetry
  expect.extend({
    toHaveSpanAttribute(span: any, key: string, value: any) {
      const attributes = span.attributes || {};
      const hasAttribute = attributes[key] !== undefined;
      const attributeMatches = attributes[key] === value;
      
      if (hasAttribute && attributeMatches) {
        return {
          message: () => `Expected span not to have attribute ${key}=${value}`,
          pass: true,
        };
      } else if (hasAttribute) {
        return {
          message: () => `Expected span attribute ${key} to be ${value} but got ${attributes[key]}`,
          pass: false,
        };
      } else {
        return {
          message: () => `Expected span to have attribute ${key} but it was not found`,
          pass: false,
        };
      }
    },
    toHaveSpanStatus(span: any, statusCode: SpanStatusCode) {
      const status = span.status || { code: SpanStatusCode.UNSET };
      const statusMatches = status.code === statusCode;
      
      return {
        message: () => statusMatches
          ? `Expected span not to have status ${statusCode}`
          : `Expected span to have status ${statusCode} but got ${status.code}`,
        pass: statusMatches,
      };
    },
  });
}

// Initialize the test environment when this module is imported
initTestEnvironment();