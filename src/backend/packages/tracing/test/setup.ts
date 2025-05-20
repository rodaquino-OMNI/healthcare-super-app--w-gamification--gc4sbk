/**
 * Test setup file for the tracing package
 * 
 * This file configures the testing environment before running tests, including:
 * - Initializing OpenTelemetry with a no-op tracer
 * - Setting up environment variables
 * - Establishing mock implementations of external dependencies
 * 
 * This ensures consistent test conditions and prevents tests from generating actual telemetry data.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { NoopTracerProvider } from '@opentelemetry/api';
import { trace, context } from '@opentelemetry/api';
import { MockLoggerService } from './mocks/mock-logger.service';
import { MockTracer } from './mocks/mock-tracer';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load test environment variables
dotenv.config({ path: join(__dirname, '.env.test') });

// Set default test environment variables if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.OTEL_SDK_DISABLED = 'true';
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318';
process.env.SERVICE_NAME = 'test-service';

// Create a global mock logger that can be used across tests
global.__mockLogger = new MockLoggerService();

// Initialize OpenTelemetry with a no-op tracer to prevent actual telemetry data generation
trace.setGlobalTracerProvider(new NoopTracerProvider());

// Create a mock tracer that can be used for verification in tests
const mockTracer = new MockTracer();
global.__mockTracer = mockTracer;

// Mock the NestJS module system for testing
const mockModuleRef = {
  get: jest.fn().mockImplementation((token) => {
    if (token === 'LoggerService') {
      return global.__mockLogger;
    }
    return null;
  }),
};

global.__moduleRef = mockModuleRef;

// Create a test SDK that doesn't actually export spans
const testSdk = new NodeSDK({
  traceExporter: {
    export: jest.fn().mockResolvedValue({ code: 0 }),
    shutdown: jest.fn().mockResolvedValue(undefined),
  },
});

// Initialize the SDK but don't actually start it
global.__testSdk = testSdk;

// Setup test utilities for tracing verification
global.__traceUtils = {
  // Helper to create a test span context
  createTestSpanContext: () => {
    return mockTracer.startSpan('test-span').spanContext();
  },
  // Helper to set active span for testing
  setActiveSpan: (span) => {
    return context.with(trace.setSpan(context.active(), span), () => {});
  },
  // Helper to verify span attributes
  verifySpanAttributes: (span, expectedAttributes) => {
    Object.entries(expectedAttributes).forEach(([key, value]) => {
      expect(span.attributes[key]).toEqual(value);
    });
  },
};

// Clean up resources after all tests
afterAll(async () => {
  await testSdk.shutdown();
});