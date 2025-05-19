/**
 * @file Tracing Test Utilities
 * @description Centralized export barrel for all tracing test utilities used across the AUSTA SuperApp.
 * This file provides a clean, organized API for accessing test utilities related to distributed tracing,
 * simplifying imports across unit, integration, and e2e tests.
 */

/**
 * Span Capture Utilities
 * @module SpanCapture
 */
export * from './span-capture.utils';

/**
 * Test Module Configuration Utilities
 * @module TestModule
 */
export * from './test-module.utils';

/**
 * Trace Context Manipulation Utilities
 * @module TraceContext
 */
export * from './trace-context.utils';

/**
 * Span Assertion Utilities
 * @module SpanAssertion
 */
export * from './span-assertion.utils';

/**
 * Mock Tracer Implementation
 * @module MockTracer
 */
export * from './mock-tracer.utils';

/**
 * Convenience re-exports of commonly used utilities grouped by functional category
 * to reduce the need for multiple imports and improve code organization.
 */

/**
 * Mocking utilities for tracing components
 * @namespace Mocks
 */
export namespace Mocks {
  /**
   * Re-export mock tracer utilities for easy access
   */
  export * from './mock-tracer.utils';

  /**
   * Re-export test module utilities for easy access
   */
  export * from './test-module.utils';
}

/**
 * Assertion utilities for verifying tracing behavior
 * @namespace Assertions
 */
export namespace Assertions {
  /**
   * Re-export span assertion utilities for easy access
   */
  export * from './span-assertion.utils';

  /**
   * Re-export span capture utilities for easy access
   */
  export * from './span-capture.utils';
}

/**
 * Context utilities for manipulating trace context in tests
 * @namespace Context
 */
export namespace Context {
  /**
   * Re-export trace context utilities for easy access
   */
  export * from './trace-context.utils';
}

/**
 * Journey-specific tracing utilities
 * @namespace Journey
 */
export namespace Journey {
  /**
   * Health journey tracing utilities
   * @namespace Health
   */
  export namespace Health {
    // Re-export health journey specific utilities from each module
    // This avoids the need to import from multiple files when testing health journey tracing
  }

  /**
   * Care journey tracing utilities
   * @namespace Care
   */
  export namespace Care {
    // Re-export care journey specific utilities from each module
    // This avoids the need to import from multiple files when testing care journey tracing
  }

  /**
   * Plan journey tracing utilities
   * @namespace Plan
   */
  export namespace Plan {
    // Re-export plan journey specific utilities from each module
    // This avoids the need to import from multiple files when testing plan journey tracing
  }
}

/**
 * Common test constants for tracing
 * @namespace Constants
 */
export namespace Constants {
  /**
   * Default test service name used in tracing tests
   */
  export const TEST_SERVICE_NAME = 'austa-test-service';

  /**
   * Default test trace ID used in tracing tests
   */
  export const TEST_TRACE_ID = '0af7651916cd43dd8448eb211c80319c';

  /**
   * Default test span ID used in tracing tests
   */
  export const TEST_SPAN_ID = 'b7ad6b7169203331';

  /**
   * Default test correlation ID used in tracing tests
   */
  export const TEST_CORRELATION_ID = 'corr-1234-5678-9abc-def0';

  /**
   * Default test user ID used in tracing tests
   */
  export const TEST_USER_ID = 'user-1234-5678-9abc-def0';
}