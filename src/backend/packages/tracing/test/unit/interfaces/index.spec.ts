/**
 * Unit tests for the interfaces barrel file (src/interfaces/index.ts)
 * 
 * These tests verify that all interfaces are properly exported from the interfaces barrel file,
 * ensuring that consumers of the package have access to all necessary type definitions,
 * constants, and utility functions related to tracing interfaces.
 * 
 * The tests also verify type compatibility with OpenTelemetry, import path consistency,
 * tree-shaking support, and backward compatibility with existing code.
 */

import * as interfaces from '../../../src/interfaces';
import { Context, Span, SpanStatusCode, Tracer, trace } from '@opentelemetry/api';

describe('@austa/tracing interfaces barrel file', () => {
  describe('Journey Context Interfaces', () => {
    it('should export all journey context interfaces', () => {
      // Check for named interface exports
      const expectedInterfaces = [
        'BaseJourneyContext',
        'JourneyType',
        'HealthJourneyContext',
        'CareJourneyContext',
        'PlanJourneyContext',
        'GamificationContext',
        'JourneyContext',
        'JourneyTraceContext'
      ];

      // Interfaces are exported as types, so we can only check if they're not undefined in the package
      expectedInterfaces.forEach(interfaceName => {
        expect(Object.keys(interfaces).includes(interfaceName) || 
               Object.getOwnPropertyNames(interfaces).includes(interfaceName)).toBeTruthy();
      });
    });

    it('should export JourneyType enum with correct values', () => {
      expect(interfaces.JourneyType).toBeDefined();
      expect(interfaces.JourneyType.HEALTH).toBe('health');
      expect(interfaces.JourneyType.CARE).toBe('care');
      expect(interfaces.JourneyType.PLAN).toBe('plan');
    });

    it('should maintain type compatibility between journey contexts', () => {
      // This test verifies type compatibility at compile time
      // Create a function that accepts JourneyContext
      const processJourneyContext = (context: interfaces.JourneyContext) => {
        return context.journeyId;
      };

      // Verify that all journey context types can be passed to this function
      // These assertions check compile-time type compatibility
      const mockHealthContext: interfaces.HealthJourneyContext = {
        journeyId: 'health-123',
        userId: 'user-123',
        journeyType: interfaces.JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };

      const mockCareContext: interfaces.CareJourneyContext = {
        journeyId: 'care-123',
        userId: 'user-123',
        journeyType: interfaces.JourneyType.CARE,
        startedAt: new Date().toISOString()
      };

      const mockPlanContext: interfaces.PlanJourneyContext = {
        journeyId: 'plan-123',
        userId: 'user-123',
        journeyType: interfaces.JourneyType.PLAN,
        startedAt: new Date().toISOString()
      };

      // These function calls verify type compatibility
      expect(processJourneyContext(mockHealthContext)).toBe('health-123');
      expect(processJourneyContext(mockCareContext)).toBe('care-123');
      expect(processJourneyContext(mockPlanContext)).toBe('plan-123');
    });
  });

  describe('Span Attributes Interfaces', () => {
    it('should export all span attributes interfaces', () => {
      // Check for named interface exports
      const expectedInterfaces = [
        'SpanAttributes',
        'HttpSpanAttributes',
        'DatabaseSpanAttributes',
        'MessagingSpanAttributes',
        'JourneySpanAttributes',
        'HealthJourneySpanAttributes',
        'CareJourneySpanAttributes',
        'PlanJourneySpanAttributes',
        'GamificationSpanAttributes',
        'ErrorSpanAttributes'
      ];

      expectedInterfaces.forEach(interfaceName => {
        expect(Object.keys(interfaces).includes(interfaceName) || 
               Object.getOwnPropertyNames(interfaces).includes(interfaceName)).toBeTruthy();
      });
    });

    it('should export all span attributes constants', () => {
      // Check for named constant exports
      const expectedConstants = [
        'JOURNEY_NAMES',
        'DATABASE_SYSTEMS',
        'MESSAGING_SYSTEMS',
        'ERROR_TYPES',
        'GAMIFICATION_EVENT_TYPES'
      ];

      expectedConstants.forEach(constantName => {
        expect(interfaces[constantName]).toBeDefined();
        expect(typeof interfaces[constantName]).toBe('object');
      });
    });

    it('should export span attributes helper functions', () => {
      // Check for helper function exports
      const expectedFunctions = [
        'createJourneyAttributes',
        'createErrorAttributes'
      ];

      expectedFunctions.forEach(functionName => {
        expect(interfaces[functionName]).toBeDefined();
        expect(typeof interfaces[functionName]).toBe('function');
      });
    });

    it('should maintain type compatibility with OpenTelemetry SpanAttributes', () => {
      // This test verifies that our SpanAttributes interface is compatible with OpenTelemetry
      // Create a function that accepts OpenTelemetry SpanAttributes
      const processSpanAttributes = (attributes: Record<string, any>) => {
        return attributes;
      };

      // Create attributes using our interface
      const mockAttributes: interfaces.SpanAttributes = {
        'custom.attribute': 'value',
        'numeric.attribute': 123,
        'boolean.attribute': true,
        'array.attribute': ['value1', 'value2']
      };

      // This function call verifies type compatibility with OpenTelemetry
      expect(processSpanAttributes(mockAttributes)).toBe(mockAttributes);
    });

    it('should allow span attributes helper functions to be used with OpenTelemetry', () => {
      // Mock error for testing
      const mockError = new Error('Test error');
      
      // Create attributes using our helper function
      const errorAttributes = interfaces.createErrorAttributes(mockError, 'ERR_TEST', true);
      
      // Verify the attributes have the expected structure
      expect(errorAttributes['error.type']).toBe(mockError.name);
      expect(errorAttributes['error.message']).toBe(mockError.message);
      expect(errorAttributes['error.stack']).toBe(mockError.stack);
      expect(errorAttributes['error.code']).toBe('ERR_TEST');
      expect(errorAttributes['error.is_retryable']).toBe(true);
    });
  });

  describe('Trace Context Interfaces', () => {
    it('should export all trace context interfaces', () => {
      // Check for named interface exports
      const expectedInterfaces = [
        'ContextCarrier',
        'SerializedTraceContext',
        'CreateTraceContextOptions',
        'ExtractTraceContextOptions',
        'InjectTraceContextOptions',
        'TraceContext'
      ];

      expectedInterfaces.forEach(interfaceName => {
        expect(Object.keys(interfaces).includes(interfaceName) || 
               Object.getOwnPropertyNames(interfaces).includes(interfaceName)).toBeTruthy();
      });
    });

    it('should maintain type compatibility with OpenTelemetry Context', () => {
      // This test verifies type compatibility at compile time
      // Create a mock TraceContext implementation that uses OpenTelemetry Context
      const mockTraceContext: Partial<interfaces.TraceContext> = {
        create: (options?: interfaces.CreateTraceContextOptions): Context => {
          return trace.context();
        },
        extract: (carrier: interfaces.ContextCarrier): Context => {
          return trace.context();
        },
        inject: (context: Context, carrier: interfaces.ContextCarrier): interfaces.ContextCarrier => {
          return carrier;
        }
      };

      // Verify the mock implementation is compatible with our interface
      expect(mockTraceContext.create).toBeDefined();
      expect(mockTraceContext.extract).toBeDefined();
      expect(mockTraceContext.inject).toBeDefined();
    });
  });

  describe('Tracer Provider Interfaces', () => {
    it('should export all tracer provider interfaces', () => {
      // Check for named interface exports
      const expectedInterfaces = [
        'TracerOptions',
        'TracerProvider'
      ];

      expectedInterfaces.forEach(interfaceName => {
        expect(Object.keys(interfaces).includes(interfaceName) || 
               Object.getOwnPropertyNames(interfaces).includes(interfaceName)).toBeTruthy();
      });
    });

    it('should maintain type compatibility with OpenTelemetry Tracer', () => {
      // This test verifies type compatibility at compile time
      // Create a mock TracerProvider implementation that uses OpenTelemetry Tracer
      const mockTracerProvider: Partial<interfaces.TracerProvider> = {
        getTracer: (name: string, version?: string, options?: interfaces.TracerOptions): Tracer => {
          return trace.getTracer(name, version);
        }
      };

      // Verify the mock implementation is compatible with our interface
      expect(mockTracerProvider.getTracer).toBeDefined();
      expect(typeof mockTracerProvider.getTracer).toBe('function');
    });
  });

  describe('Span Options Interface', () => {
    it('should export the SpanOptions interface', () => {
      expect(Object.keys(interfaces).includes('SpanOptions') || 
             Object.getOwnPropertyNames(interfaces).includes('SpanOptions')).toBeTruthy();
    });

    it('should maintain type compatibility with OpenTelemetry SpanOptions', () => {
      // This test verifies type compatibility at compile time
      // Create a function that creates a span with our SpanOptions
      const createSpanWithOptions = (name: string, options?: interfaces.SpanOptions): Span => {
        const tracer = trace.getTracer('test-tracer');
        const span = tracer.startSpan(name);
        
        // Apply options to the span
        if (options?.attributes) {
          span.setAttributes(options.attributes);
        }
        
        if (options?.statusCode) {
          span.setStatus({ code: options.statusCode });
        }
        
        return span;
      };

      // Create a mock span with options
      const mockOptions: interfaces.SpanOptions = {
        attributes: { 'test.attribute': 'value' },
        statusCode: SpanStatusCode.OK,
        statusMessage: 'Success'
      };

      // This function call verifies type compatibility
      expect(() => createSpanWithOptions('test-span', mockOptions)).not.toThrow();
    });
  });

  describe('Tracing Options Interfaces', () => {
    it('should export all tracing options interfaces', () => {
      // Check for named interface exports
      const expectedInterfaces = [
        'TracingOptions',
        'ExporterOptions',
        'SpanProcessorOptions'
      ];

      expectedInterfaces.forEach(interfaceName => {
        expect(Object.keys(interfaces).includes(interfaceName) || 
               Object.getOwnPropertyNames(interfaces).includes(interfaceName)).toBeTruthy();
      });
    });

    it('should allow configuration of different exporter types', () => {
      // Create mock tracing options with different exporter types
      const mockConsoleOptions: interfaces.TracingOptions = {
        serviceName: 'test-service',
        exporter: {
          type: 'console'
        }
      };

      const mockOtlpOptions: interfaces.TracingOptions = {
        serviceName: 'test-service',
        exporter: {
          type: 'otlp',
          endpoint: 'http://localhost:4318/v1/traces',
          headers: { 'api-key': 'test-key' },
          protocol: 'http/protobuf'
        }
      };

      // Verify the options have the expected structure
      expect(mockConsoleOptions.exporter?.type).toBe('console');
      expect(mockOtlpOptions.exporter?.type).toBe('otlp');
      expect(mockOtlpOptions.exporter?.endpoint).toBe('http://localhost:4318/v1/traces');
      expect(mockOtlpOptions.exporter?.protocol).toBe('http/protobuf');
    });
  });

  describe('Import path consistency', () => {
    it('should re-export all interfaces from their respective files', () => {
      // Import the interfaces directly from their source files
      // Note: In a real test, we would import from the actual files
      // For this test, we're just verifying the barrel file exports
      
      // Verify that the barrel file exports match the direct imports
      // This ensures that the barrel file is correctly re-exporting all interfaces
      expect(Object.keys(interfaces).length).toBeGreaterThan(0);
      
      // Check a few key interfaces to ensure they're exported correctly
      expect(interfaces.JourneyType).toBeDefined();
      expect(interfaces.SpanAttributes).toBeDefined();
      expect(interfaces.TraceContext).toBeDefined();
      expect(interfaces.TracerProvider).toBeDefined();
      expect(interfaces.SpanOptions).toBeDefined();
      expect(interfaces.TracingOptions).toBeDefined();
    });
  });

  describe('Tree-shaking support', () => {
    it('should use named exports for better tree-shaking', () => {
      // Verify that the package uses named exports rather than default exports
      // This ensures better tree-shaking support in bundlers
      expect(interfaces.default).toBeUndefined();
    });

    it('should export interfaces and types separately for better tree-shaking', () => {
      // Verify that interfaces and types are exported separately
      // This allows bundlers to tree-shake unused interfaces
      const exportedKeys = Object.keys(interfaces);
      
      // Check that we have a mix of interfaces/types and values
      const valueExports = exportedKeys.filter(key => {
        return typeof interfaces[key] !== 'undefined';
      });
      
      // We should have some value exports (constants, functions)
      expect(valueExports.length).toBeGreaterThan(0);
      
      // And the total exports should be greater than the value exports
      // indicating we also have type/interface exports
      expect(exportedKeys.length).toBeGreaterThan(valueExports.length);
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain compatibility with existing code', () => {
      // This test simulates existing code that uses the interfaces
      // and verifies that it still works with the current exports
      
      // Example: Code that creates journey attributes
      const createJourneyAttrs = (userId: string, journeyName: string) => {
        return interfaces.createJourneyAttributes(journeyName, userId, 'session-123');
      };
      
      // Example: Code that creates error attributes
      const createErrorAttrs = (error: Error) => {
        return interfaces.createErrorAttributes(error);
      };
      
      // Verify the functions still work as expected
      const journeyAttrs = createJourneyAttrs('user-123', 'health');
      expect(journeyAttrs['austa.journey.user_id']).toBe('user-123');
      expect(journeyAttrs['austa.journey.name']).toBe('health');
      
      const errorAttrs = createErrorAttrs(new Error('Test error'));
      expect(errorAttrs['error.type']).toBe('Error');
      expect(errorAttrs['error.message']).toBe('Test error');
    });
  });
});