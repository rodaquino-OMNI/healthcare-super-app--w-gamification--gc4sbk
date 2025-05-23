/**
 * @file Unit tests for the tracing utilities barrel file
 * 
 * These tests verify that all utility functions are properly exported from the barrel file,
 * ensuring that consumers of the package can import utility functions using the correct paths
 * and that the public API remains consistent.
 */

import * as correlationUtils from '../../../src/utils/correlation';
import * as spanAttributesUtils from '../../../src/utils/span-attributes';
import * as contextPropagationUtils from '../../../src/utils/context-propagation';
import * as barrelExports from '../../../src/utils';

describe('Tracing Utils Barrel File', () => {
  describe('Correlation Utilities', () => {
    it('should export all correlation utility functions', () => {
      // Get all exported keys from the correlation module
      const correlationExports = Object.keys(correlationUtils);
      
      // Verify each function is exported from the barrel file
      correlationExports.forEach(exportName => {
        expect(barrelExports).toHaveProperty(exportName);
        expect(barrelExports[exportName]).toBe(correlationUtils[exportName]);
      });
    });

    it('should export specific correlation functions correctly', () => {
      // Test specific important functions to ensure they're exported correctly
      expect(barrelExports.extractCurrentTraceInfo).toBeDefined();
      expect(barrelExports.enrichLogWithTraceInfo).toBeDefined();
      expect(barrelExports.createExternalCorrelationContext).toBeDefined();
      expect(barrelExports.addJourneyAttributesToSpan).toBeDefined();
      expect(barrelExports.generateCorrelationId).toBeDefined();
      expect(barrelExports.formatTraceId).toBeDefined();
    });

    it('should export correlation interfaces correctly', () => {
      // Verify that TypeScript interfaces are properly exported
      // Note: This is a type-level check that will be verified at compile time
      const traceLogContext: barrelExports.TraceLogContext = {
        'trace.id': 'test-trace-id',
        'span.id': 'test-span-id',
        'trace.sampled': true,
      };
      
      expect(traceLogContext).toBeDefined();
      expect(traceLogContext['trace.id']).toBe('test-trace-id');
    });
  });

  describe('Span Attributes Utilities', () => {
    it('should export the SpanAttributes namespace', () => {
      expect(barrelExports.SpanAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes).toBe(spanAttributesUtils.SpanAttributes);
    });

    it('should export all enum types from SpanAttributes', () => {
      // Verify that all enums are exported
      expect(barrelExports.SpanAttributes.CommonAttributeKeys).toBeDefined();
      expect(barrelExports.SpanAttributes.HealthJourneyAttributeKeys).toBeDefined();
      expect(barrelExports.SpanAttributes.CareJourneyAttributeKeys).toBeDefined();
      expect(barrelExports.SpanAttributes.PlanJourneyAttributeKeys).toBeDefined();
      expect(barrelExports.SpanAttributes.ErrorAttributeKeys).toBeDefined();
      expect(barrelExports.SpanAttributes.PerformanceAttributeKeys).toBeDefined();
    });

    it('should export all utility functions from SpanAttributes', () => {
      // Verify that all utility functions are exported
      expect(barrelExports.SpanAttributes.addCommonAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addHealthJourneyAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addCareJourneyAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addPlanJourneyAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addErrorAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addPerformanceAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addGamificationAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addHttpAttributes).toBeDefined();
      expect(barrelExports.SpanAttributes.addDatabaseAttributes).toBeDefined();
    });
  });

  describe('Context Propagation Utilities', () => {
    it('should export all context propagation utility functions', () => {
      // Get all exported keys from the context propagation module
      const contextPropagationExports = Object.keys(contextPropagationUtils);
      
      // Verify each function is exported from the barrel file
      contextPropagationExports.forEach(exportName => {
        expect(barrelExports).toHaveProperty(exportName);
        expect(barrelExports[exportName]).toBe(contextPropagationUtils[exportName]);
      });
    });

    it('should export specific context propagation functions correctly', () => {
      // Test specific important functions to ensure they're exported correctly
      expect(barrelExports.extractContextFromHttpHeaders).toBeDefined();
      expect(barrelExports.injectContextIntoHttpHeaders).toBeDefined();
      expect(barrelExports.extractContextFromKafkaMessage).toBeDefined();
      expect(barrelExports.injectContextIntoKafkaMessage).toBeDefined();
      expect(barrelExports.serializeContext).toBeDefined();
      expect(barrelExports.deserializeContext).toBeDefined();
      expect(barrelExports.createJourneyContext).toBeDefined();
      expect(barrelExports.extractJourneyContext).toBeDefined();
      expect(barrelExports.getCurrentTraceId).toBeDefined();
      expect(barrelExports.getCurrentSpanId).toBeDefined();
      expect(barrelExports.getCorrelationId).toBeDefined();
    });

    it('should export context propagation classes and interfaces correctly', () => {
      // Verify that classes are properly exported
      expect(barrelExports.KafkaMessageCarrier).toBeDefined();
      expect(barrelExports.KafkaMessageCarrier).toBe(contextPropagationUtils.KafkaMessageCarrier);
      
      // Verify that enums are properly exported
      expect(barrelExports.JourneyType).toBeDefined();
      expect(barrelExports.JourneyType.HEALTH).toBe(contextPropagationUtils.JourneyType.HEALTH);
      expect(barrelExports.JourneyType.CARE).toBe(contextPropagationUtils.JourneyType.CARE);
      expect(barrelExports.JourneyType.PLAN).toBe(contextPropagationUtils.JourneyType.PLAN);
      
      // Verify that constants are properly exported
      expect(barrelExports.TRACE_HEADER_NAMES).toBeDefined();
      expect(barrelExports.TRACE_HEADER_NAMES.TRACE_PARENT).toBe(contextPropagationUtils.TRACE_HEADER_NAMES.TRACE_PARENT);
    });
  });

  describe('Tree-shaking Support', () => {
    it('should support importing individual functions directly', () => {
      // Import specific functions directly to verify tree-shaking support
      const { extractCurrentTraceInfo } = barrelExports;
      const { addCommonAttributes } = barrelExports.SpanAttributes;
      const { extractContextFromHttpHeaders } = barrelExports;
      
      // Verify the functions are correctly imported
      expect(extractCurrentTraceInfo).toBeDefined();
      expect(extractCurrentTraceInfo).toBe(correlationUtils.extractCurrentTraceInfo);
      
      expect(addCommonAttributes).toBeDefined();
      expect(addCommonAttributes).toBe(spanAttributesUtils.SpanAttributes.addCommonAttributes);
      
      expect(extractContextFromHttpHeaders).toBeDefined();
      expect(extractContextFromHttpHeaders).toBe(contextPropagationUtils.extractContextFromHttpHeaders);
    });
  });

  describe('API Consistency', () => {
    it('should maintain consistent function signatures', () => {
      // Verify that function signatures are maintained
      expect(typeof barrelExports.extractCurrentTraceInfo).toBe('function');
      expect(typeof barrelExports.SpanAttributes.addCommonAttributes).toBe('function');
      expect(typeof barrelExports.extractContextFromHttpHeaders).toBe('function');
    });

    it('should maintain consistent naming conventions', () => {
      // Check that naming conventions are consistent
      const correlationFunctions = Object.keys(correlationUtils);
      const spanAttributesFunctions = Object.keys(spanAttributesUtils.SpanAttributes).filter(
        key => typeof spanAttributesUtils.SpanAttributes[key] === 'function'
      );
      const contextPropagationFunctions = Object.keys(contextPropagationUtils).filter(
        key => typeof contextPropagationUtils[key] === 'function'
      );
      
      // Verify correlation function naming pattern
      correlationFunctions.forEach(funcName => {
        if (typeof correlationUtils[funcName] === 'function') {
          // Most correlation functions should follow camelCase naming
          expect(funcName[0]).toMatch(/[a-z]/);
        }
      });
      
      // Verify span attributes function naming pattern
      spanAttributesFunctions.forEach(funcName => {
        // All span attribute functions should start with 'add'
        expect(funcName.startsWith('add')).toBe(true);
      });
      
      // Verify context propagation function naming patterns
      const extractFunctions = contextPropagationFunctions.filter(name => name.startsWith('extract'));
      const injectFunctions = contextPropagationFunctions.filter(name => name.startsWith('inject'));
      
      expect(extractFunctions.length).toBeGreaterThan(0);
      expect(injectFunctions.length).toBeGreaterThan(0);
    });
  });
});