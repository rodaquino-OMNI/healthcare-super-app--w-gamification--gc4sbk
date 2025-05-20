/**
 * @file Barrel file that exports all tracing test utilities
 * 
 * This file provides a centralized import point for all tracing test utilities,
 * organized by functional category. It simplifies imports across unit, integration,
 * and e2e tests by exposing a clean, organized API for all tracing test utilities.
 * 
 * The AUSTA SuperApp uses distributed tracing to track requests as they flow through
 * different journey services (Health, Care, and Plan). These utilities facilitate testing
 * of tracing functionality across all levels of the test pyramid:
 * 
 * - Unit tests: Mock tracing services and span verification
 * - Integration tests: Trace context propagation between components
 * - E2E tests: Full trace verification across service boundaries
 * 
 * @module tracing/test/utils
 */

/**
 * Module setup utilities for configuring NestJS test modules with tracing
 * 
 * These utilities help bootstrap NestJS test modules with properly configured tracing
 * for different test scenarios. They provide functions to create test modules with
 * real or mock TracingService, configure test-specific tracing options, and integrate
 * with LoggerService for correlation testing.
 * 
 * Common usage:
 * ```typescript
 * // Create a test module with mock tracing
 * const moduleRef = await createTestingModuleWithTracing({
 *   imports: [YourModule],
 *   mockTracing: true
 * });
 * 
 * // Create a test module with journey-specific tracing
 * const healthModuleRef = await createHealthJourneyTestingModule({
 *   imports: [HealthMetricsModule]
 * });
 * ```
 * 
 * @category Module Setup
 */
export * from './test-module.utils';

/**
 * Span assertion utilities for verifying span content and structure
 * 
 * These utilities provide custom assertions for verifying span content, attributes,
 * and structure in tests. They include functions to assert that spans contain expected
 * attributes, follow the correct hierarchy, include proper context information, and
 * maintain parent-child relationships.
 * 
 * Common usage:
 * ```typescript
 * // Assert span contains expected attributes
 * assertSpanAttributes(span, {
 *   'journey.type': 'health',
 *   'operation.name': 'fetchMetrics'
 * });
 * 
 * // Verify parent-child relationship
 * assertTraceHierarchy(parentSpan, childSpan);
 * 
 * // Verify span timing meets performance requirements
 * assertSpanTiming(span, { maxDuration: 100 });
 * ```
 * 
 * @category Assertions
 */
export * from './span-assertion.utils';

/**
 * Mock tracer utilities for unit testing with simulated tracing
 * 
 * These utilities provide a configurable mock implementation of TracingService for
 * isolated unit testing. They include a fully-featured mock tracer that simulates
 * OpenTelemetry span creation, context propagation, and span lifecycle management
 * without requiring actual OpenTelemetry infrastructure.
 * 
 * The mock tracer captures spans and provides inspection capabilities for verifying
 * traced operations, making it ideal for unit testing components that depend on
 * TracingService without external dependencies.
 * 
 * Common usage:
 * ```typescript
 * // Create a mock tracing service
 * const mockTracingService = createMockTracingService();
 * 
 * // Get captured spans after test execution
 * const spans = mockTracingService.getRecordedSpans();
 * 
 * // Create a journey-specific mock tracer
 * const careJourneyTracer = createCareJourneyMockTracer();
 * ```
 * 
 * @category Mocks
 */
export * from './mock-tracer.utils';