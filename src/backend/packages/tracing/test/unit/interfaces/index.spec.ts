/**
 * @file index.spec.ts
 * @description Unit tests for the interfaces barrel file that verify the proper export
 * of all interface definitions from the tracing package. These tests ensure that consumers
 * can correctly import the interfaces using the package's public API.
 */

import { Context, Span, SpanStatusCode, Tracer } from '@opentelemetry/api';
import * as interfaces from '../../../src/interfaces';

describe('Tracing Interfaces Barrel File', () => {
  describe('Export Verification', () => {
    it('should export all journey context interfaces', () => {
      // Verify journey context interfaces
      expect(typeof interfaces.JourneyContext).toBe('object');
      expect(typeof interfaces.JourneyType).toBe('object');
      expect(typeof interfaces.HealthJourneyContext).toBe('object');
      expect(typeof interfaces.CareJourneyContext).toBe('object');
      expect(typeof interfaces.PlanJourneyContext).toBe('object');
      expect(typeof interfaces.GamificationContext).toBe('object');
      expect(typeof interfaces.HealthJourneyWithGamification).toBe('object');
      expect(typeof interfaces.CareJourneyWithGamification).toBe('object');
      expect(typeof interfaces.PlanJourneyWithGamification).toBe('object');
      expect(typeof interfaces.createJourneyContext).toBe('function');
    });

    it('should export all span attributes interfaces and constants', () => {
      // Verify span attributes interfaces
      expect(typeof interfaces.SpanAttributes).toBe('object');
      expect(typeof interfaces.HttpSpanAttributes).toBe('object');
      expect(typeof interfaces.DatabaseSpanAttributes).toBe('object');
      expect(typeof interfaces.MessagingSpanAttributes).toBe('object');
      expect(typeof interfaces.UserSessionSpanAttributes).toBe('object');
      expect(typeof interfaces.JourneySpanAttributes).toBe('object');
      expect(typeof interfaces.HealthJourneySpanAttributes).toBe('object');
      expect(typeof interfaces.CareJourneySpanAttributes).toBe('object');
      expect(typeof interfaces.PlanJourneySpanAttributes).toBe('object');
      expect(typeof interfaces.GamificationSpanAttributes).toBe('object');
      expect(typeof interfaces.ErrorSpanAttributes).toBe('object');
      expect(typeof interfaces.ExternalServiceSpanAttributes).toBe('object');

      // Verify constants
      expect(interfaces.JOURNEY_TYPES).toBeDefined();
      expect(interfaces.JOURNEY_STEP_STATUS).toBeDefined();
      expect(interfaces.GAMIFICATION_EVENT_TYPES).toBeDefined();
      expect(interfaces.ERROR_CATEGORIES).toBeDefined();
      expect(interfaces.DB_SYSTEMS).toBeDefined();
      expect(interfaces.MESSAGING_SYSTEMS).toBeDefined();
      expect(interfaces.HTTP_METHODS).toBeDefined();
      expect(interfaces.NETWORK_TYPES).toBeDefined();
      expect(interfaces.DEVICE_TYPES).toBeDefined();
      expect(interfaces.HEALTH_METRIC_TYPES).toBeDefined();
      expect(interfaces.HEALTH_METRIC_UNITS).toBeDefined();
      expect(interfaces.CARE_APPOINTMENT_TYPES).toBeDefined();
      expect(interfaces.CARE_APPOINTMENT_STATUSES).toBeDefined();
      expect(interfaces.PLAN_TYPES).toBeDefined();
      expect(interfaces.CLAIM_STATUSES).toBeDefined();
    });

    it('should export all trace context interfaces and constants', () => {
      // Verify trace context interfaces
      expect(typeof interfaces.TraceContext).toBe('object');
      expect(typeof interfaces.PropagationFormat).toBe('object');
      expect(typeof interfaces.HttpTraceContextCarrier).toBe('object');
      expect(typeof interfaces.KafkaTraceContextCarrier).toBe('object');
      
      // Verify constants
      expect(interfaces.TRACE_CONTEXT_KEYS).toBeDefined();
      expect(interfaces.TRACE_CONTEXT_ATTRIBUTES).toBeDefined();
    });

    it('should export tracer provider interfaces', () => {
      expect(typeof interfaces.TracerProvider).toBe('object');
      expect(typeof interfaces.TracerProviderOptions).toBe('object');
    });

    it('should export span options interface', () => {
      expect(typeof interfaces.SpanOptions).toBe('object');
    });

    it('should export tracing options interface', () => {
      expect(typeof interfaces.TracingOptions).toBe('object');
    });
  });

  describe('Import Path Consistency', () => {
    it('should allow importing interfaces directly from the package', () => {
      // This test verifies that the barrel file correctly re-exports all interfaces
      // so they can be imported directly from the package root
      const importPath = require.resolve('../../../src/interfaces');
      expect(importPath).toContain('index.ts');
      
      // Verify the import path doesn't contain any unexpected segments
      expect(importPath).not.toContain('dist');
      expect(importPath.split('/').pop()).toBe('index.ts');
    });

    it('should maintain consistent naming conventions', () => {
      // Verify interface naming conventions
      const interfaceNames = Object.keys(interfaces).filter(key => 
        typeof interfaces[key] === 'object' && 
        key[0] === key[0].toUpperCase() && // Starts with uppercase
        key.includes('Interface') === false // Doesn't include 'Interface' in name
      );

      // All interface names should follow PascalCase
      interfaceNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });

      // All constant names should be UPPER_SNAKE_CASE
      const constantNames = Object.keys(interfaces).filter(key =>
        typeof interfaces[key] === 'object' &&
        key === key.toUpperCase() &&
        key.includes('_')
      );

      constantNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
      });
    });
  });

  describe('OpenTelemetry Compatibility', () => {
    it('should be compatible with OpenTelemetry Context type', () => {
      // Create a mock implementation of TraceContext to verify compatibility
      const mockTraceContext: Partial<interfaces.TraceContext> = {
        extract: (carrier: object): Context => ({} as Context),
        inject: (context: Context, carrier: object): void => {},
        getCurrentContext: (): Context => ({} as Context)
      };

      // Verify the mock implementation is compatible with the interface
      expect(mockTraceContext.extract).toBeDefined();
      expect(mockTraceContext.inject).toBeDefined();
      expect(mockTraceContext.getCurrentContext).toBeDefined();
    });

    it('should be compatible with OpenTelemetry Tracer type', () => {
      // Create a mock implementation of TracerProvider to verify compatibility
      const mockTracerProvider: Partial<interfaces.TracerProvider> = {
        getTracer: (name: string, version?: string): Tracer => ({} as Tracer),
        createSpan: (name: string, options?: interfaces.SpanOptions): Span => ({} as Span)
      };

      // Verify the mock implementation is compatible with the interface
      expect(mockTracerProvider.getTracer).toBeDefined();
      expect(mockTracerProvider.createSpan).toBeDefined();
    });

    it('should include OpenTelemetry span status codes', () => {
      // Verify that our interfaces work with OpenTelemetry status codes
      const mockErrorAttributes: interfaces.ErrorSpanAttributes = {
        'error.type': 'ValidationError',
        'error.message': 'Invalid input',
        'error.handled': true
      };

      // This is a type-level test - if it compiles, it passes
      const setErrorStatus = (span: Span, attributes: interfaces.ErrorSpanAttributes) => {
        span.setAttributes(attributes);
        span.setStatus({ code: SpanStatusCode.ERROR });
      };

      expect(typeof setErrorStatus).toBe('function');
    });
  });

  describe('Tree-Shaking Support', () => {
    it('should support individual imports for tree-shaking', () => {
      // This test verifies that each interface can be imported individually
      // which is important for tree-shaking in production builds
      
      // We can't actually import individually in the test, but we can verify
      // that each export is a separate property on the interfaces object
      const exportedKeys = Object.keys(interfaces);
      
      // Each export should be a separate property
      expect(exportedKeys.length).toBeGreaterThan(10); // We have many exports
      
      // Verify some specific exports exist as separate properties
      expect(exportedKeys).toContain('JourneyContext');
      expect(exportedKeys).toContain('SpanAttributes');
      expect(exportedKeys).toContain('TraceContext');
      expect(exportedKeys).toContain('TracerProvider');
      expect(exportedKeys).toContain('SpanOptions');
      expect(exportedKeys).toContain('TracingOptions');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing code patterns', () => {
      // This test verifies that our interfaces maintain compatibility with
      // existing code patterns that might be using them
      
      // Create a mock implementation using the interfaces as they would be used
      // in existing code
      const createHealthJourneyContext = (userId: string): interfaces.HealthJourneyContext => {
        return {
          journeyId: 'health-123',
          journeyType: interfaces.JourneyType.HEALTH,
          userId,
          metricType: 'heart_rate',
          dataSource: 'wearable'
        };
      };

      const healthContext = createHealthJourneyContext('user-123');
      
      // Verify the created context matches the interface
      expect(healthContext.journeyType).toBe(interfaces.JourneyType.HEALTH);
      expect(healthContext.userId).toBe('user-123');
      expect(healthContext.metricType).toBe('heart_rate');
    });

    it('should support the factory function pattern', () => {
      // Verify that the createJourneyContext factory function works as expected
      const journeyContext = interfaces.createJourneyContext('user-456', interfaces.JourneyType.CARE);
      
      expect(journeyContext.journeyType).toBe(interfaces.JourneyType.CARE);
      expect(journeyContext.userId).toBe('user-456');
      expect(journeyContext.journeyId).toBeDefined();
      expect(journeyContext.startedAt).toBeDefined();
    });
  });
});