/**
 * @file Barrel file that exports all tracing test utilities
 * 
 * This file provides a centralized import point for all test utilities related to tracing,
 * organized by functional category. It simplifies imports across unit, integration, and e2e tests
 * by exposing a clean, organized API for all tracing test utilities.
 * 
 * @module tracing/test/utils
 */

// Re-export all mocks for easy access
import * as mocks from '../mocks';
export { mocks };

// Re-export individual mock implementations for direct access
export { MockTracingService } from '../mocks/mock-tracing.service';
export { MockLoggerService } from '../mocks/mock-logger.service';
export { MockConfigService } from '../mocks/mock-config.service';
export { MockContext } from '../mocks/mock-context';
export { MockSpan } from '../mocks/mock-span';
export { MockTracer } from '../mocks/mock-tracer';

// Re-export fixtures for test data
export * from '../fixtures/error-scenarios';
export * from '../fixtures/span-attributes';
export * from '../fixtures/service-config';
export * from '../fixtures/tracing-headers';
export * from '../fixtures/trace-contexts';
export * from '../fixtures/mock-spans';

// Re-export test constants
export * from '../test-constants';

// Re-export utility functions by category

/**
 * Utilities for capturing and inspecting spans during tests
 * 
 * These utilities enable verification of span creation, attributes, events, and relationships
 * without requiring actual OpenTelemetry backends.
 */
export * from './span-capture.utils';

/**
 * Utilities for bootstrapping NestJS test modules with tracing
 * 
 * These utilities help create test modules with real or mock TracingService,
 * configure test-specific tracing options, and integrate with LoggerService.
 */
export * from './test-module.utils';

/**
 * Utilities for creating and manipulating trace contexts
 * 
 * These utilities generate Health, Care, and Plan journey trace contexts with
 * appropriate span attributes, user information, correlation IDs, and parent spans.
 */
export * from './trace-context.utils';

/**
 * Custom assertion utilities for verifying span content
 * 
 * These utilities help assert that spans contain expected attributes, follow the correct
 * hierarchy, include proper context information, and maintain parent-child relationships.
 */
export * from './span-assertion.utils';

/**
 * Configurable mock implementation of TracingService
 * 
 * These utilities provide a fully-featured mock tracer that simulates OpenTelemetry
 * span creation, context propagation, and span lifecycle management.
 */
export * from './mock-tracer.utils';

// Re-export test setup and teardown utilities

/**
 * Test setup utilities for configuring the testing environment
 * 
 * These utilities initialize OpenTelemetry with a no-op tracer, set up environment
 * variables, and establish mock implementations of external dependencies.
 */
export * from '../setup';

/**
 * Test teardown utilities for cleaning up the testing environment
 * 
 * These utilities reset the OpenTelemetry global tracer, clear cached trace context,
 * and shut down any mock spans or exporters after tests complete.
 */
export * from '../teardown';

/**
 * Journey-specific test utilities
 * 
 * These utilities provide specialized testing support for each journey type
 * (Health, Care, Plan) with appropriate context and attributes.
 */
export const journeyUtils = {
  /**
   * Health journey test utilities
   * 
   * Specialized utilities for testing Health journey tracing with appropriate
   * context, attributes, and span relationships.
   */
  health: {
    /**
     * Creates a Health journey trace context with appropriate attributes
     * @param userId User ID for the health journey context
     * @param deviceId Optional device ID for health metrics
     * @returns A configured trace context for Health journey testing
     */
    createTraceContext: (userId: string, deviceId?: string) => {
      // Import from trace-context.utils to avoid circular dependencies
      const { createJourneyTraceContext } = require('./trace-context.utils');
      return createJourneyTraceContext('health', { userId, deviceId });
    },
    
    /**
     * Asserts that a span contains Health journey-specific attributes
     * @param span The span to verify
     * @param expectedAttributes Expected Health journey attributes
     */
    assertHealthSpan: (span: any, expectedAttributes: Record<string, any>) => {
      // Import from span-assertion.utils to avoid circular dependencies
      const { assertSpanAttributes } = require('./span-assertion.utils');
      assertSpanAttributes(span, {
        'journey.type': 'health',
        ...expectedAttributes
      });
    }
  },
  
  /**
   * Care journey test utilities
   * 
   * Specialized utilities for testing Care journey tracing with appropriate
   * context, attributes, and span relationships.
   */
  care: {
    /**
     * Creates a Care journey trace context with appropriate attributes
     * @param userId User ID for the care journey context
     * @param providerId Optional provider ID for care interactions
     * @returns A configured trace context for Care journey testing
     */
    createTraceContext: (userId: string, providerId?: string) => {
      // Import from trace-context.utils to avoid circular dependencies
      const { createJourneyTraceContext } = require('./trace-context.utils');
      return createJourneyTraceContext('care', { userId, providerId });
    },
    
    /**
     * Asserts that a span contains Care journey-specific attributes
     * @param span The span to verify
     * @param expectedAttributes Expected Care journey attributes
     */
    assertCareSpan: (span: any, expectedAttributes: Record<string, any>) => {
      // Import from span-assertion.utils to avoid circular dependencies
      const { assertSpanAttributes } = require('./span-assertion.utils');
      assertSpanAttributes(span, {
        'journey.type': 'care',
        ...expectedAttributes
      });
    }
  },
  
  /**
   * Plan journey test utilities
   * 
   * Specialized utilities for testing Plan journey tracing with appropriate
   * context, attributes, and span relationships.
   */
  plan: {
    /**
     * Creates a Plan journey trace context with appropriate attributes
     * @param userId User ID for the plan journey context
     * @param planId Optional plan ID for plan interactions
     * @returns A configured trace context for Plan journey testing
     */
    createTraceContext: (userId: string, planId?: string) => {
      // Import from trace-context.utils to avoid circular dependencies
      const { createJourneyTraceContext } = require('./trace-context.utils');
      return createJourneyTraceContext('plan', { userId, planId });
    },
    
    /**
     * Asserts that a span contains Plan journey-specific attributes
     * @param span The span to verify
     * @param expectedAttributes Expected Plan journey attributes
     */
    assertPlanSpan: (span: any, expectedAttributes: Record<string, any>) => {
      // Import from span-assertion.utils to avoid circular dependencies
      const { assertSpanAttributes } = require('./span-assertion.utils');
      assertSpanAttributes(span, {
        'journey.type': 'plan',
        ...expectedAttributes
      });
    }
  }
};

/**
 * Common test utilities for all tracing tests
 * 
 * These utilities provide general-purpose functionality for testing tracing
 * across all journey types and services.
 */
export const commonUtils = {
  /**
   * Creates a test TracingService instance with appropriate mocks
   * @param serviceName Name of the service for the tracer
   * @returns A configured TracingService for testing
   */
  createTestTracingService: (serviceName: string) => {
    // Import from test-module.utils to avoid circular dependencies
    const { createTestTracingModule } = require('./test-module.utils');
    return createTestTracingModule(serviceName).get('TracingService');
  },
  
  /**
   * Captures all spans created during a test function execution
   * @param testFn The test function to execute and capture spans from
   * @returns All spans created during the function execution
   */
  captureSpans: async <T>(testFn: () => Promise<T>) => {
    // Import from span-capture.utils to avoid circular dependencies
    const { setupSpanCapture, getSpans } = require('./span-capture.utils');
    const cleanup = setupSpanCapture();
    try {
      await testFn();
      return getSpans();
    } finally {
      cleanup();
    }
  },
  
  /**
   * Asserts that a traced operation creates the expected spans
   * @param operation The operation to trace
   * @param expectedSpanNames Names of spans expected to be created
   * @returns The result of the operation
   */
  assertTracedOperation: async <T>(operation: () => Promise<T>, expectedSpanNames: string[]) => {
    // Import from span-capture.utils to avoid circular dependencies
    const { setupSpanCapture, getSpans } = require('./span-capture.utils');
    const cleanup = setupSpanCapture();
    try {
      const result = await operation();
      const spans = getSpans();
      const spanNames = spans.map(span => span.name);
      expect(spanNames).toEqual(expect.arrayContaining(expectedSpanNames));
      return result;
    } finally {
      cleanup();
    }
  }
};