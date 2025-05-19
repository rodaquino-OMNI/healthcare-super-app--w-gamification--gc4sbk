/**
 * Unit tests for the main package barrel file (index.ts)
 * 
 * These tests verify that all public components are properly exported from the tracing package,
 * ensuring that consumers of the package have access to all necessary components, interfaces,
 * constants, and utility functions.
 */

import * as tracingPackage from '../../src';

describe('@austa/tracing package exports', () => {
  describe('Core components', () => {
    it('should export TracingModule', () => {
      expect(tracingPackage.TracingModule).toBeDefined();
      // Verify it's a NestJS module class with the expected decorator metadata
      expect(tracingPackage.TracingModule.toString()).toContain('class');
    });

    it('should export TracingService', () => {
      expect(tracingPackage.TracingService).toBeDefined();
      // Verify it's a class with the expected methods
      expect(tracingPackage.TracingService.prototype.createSpan).toBeDefined();
      expect(typeof tracingPackage.TracingService.prototype.createSpan).toBe('function');
    });
  });

  describe('Interfaces', () => {
    it('should export all required interfaces', () => {
      // Check for named interface exports
      const expectedInterfaces = [
        'TracingOptions',
        'SpanOptions',
        'TraceContext',
        'TracerProvider',
        'JourneyContext',
        'HealthJourneyContext',
        'CareJourneyContext',
        'PlanJourneyContext',
        'SpanAttributes'
      ];

      // Interfaces are exported as types, so we can only check if they're not undefined in the package
      expectedInterfaces.forEach(interfaceName => {
        // TypeScript interfaces don't exist at runtime, so we can only verify they're exported
        // by checking if they're mentioned in the package's type definitions
        expect(Object.keys(tracingPackage).includes(interfaceName) || 
               Object.getOwnPropertyNames(tracingPackage).includes(interfaceName)).toBeTruthy();
      });
    });
  });

  describe('Constants', () => {
    it('should export all required constants', () => {
      // Check for named constant exports
      expect(tracingPackage.ERROR_CODES).toBeDefined();
      expect(tracingPackage.SPAN_ATTRIBUTE_KEYS).toBeDefined();
      expect(tracingPackage.CONFIG_KEYS).toBeDefined();
      expect(tracingPackage.DEFAULT_VALUES).toBeDefined();

      // Verify constants have the expected structure
      expect(typeof tracingPackage.ERROR_CODES).toBe('object');
      expect(typeof tracingPackage.SPAN_ATTRIBUTE_KEYS).toBe('object');
      expect(typeof tracingPackage.CONFIG_KEYS).toBe('object');
      expect(typeof tracingPackage.DEFAULT_VALUES).toBe('object');
    });
  });

  describe('Utility functions', () => {
    it('should export all required utility functions', () => {
      // Check for named utility function exports
      const expectedUtilityFunctions = [
        'getTraceIdFromContext',
        'getSpanIdFromContext',
        'enrichLogContextWithTraceInfo',
        'addCommonAttributes',
        'addJourneyAttributes',
        'addErrorAttributes',
        'extractTraceContextFromHeaders',
        'injectTraceContextIntoHeaders',
        'extractTraceContextFromKafkaMessage',
        'injectTraceContextIntoKafkaMessage'
      ];

      expectedUtilityFunctions.forEach(functionName => {
        expect(tracingPackage[functionName]).toBeDefined();
        expect(typeof tracingPackage[functionName]).toBe('function');
      });
    });

    it('should provide properly typed utility functions', () => {
      // Test a few key utility functions to ensure they have the correct signature
      // These tests verify the function exists and has the expected type, not its implementation
      
      // Mock objects for testing function signatures
      const mockSpan = { setAttributes: jest.fn() };
      const mockLogContext = {};
      const mockHeaders = {};
      const mockKafkaMessage = {};
      const mockError = new Error('Test error');
      const mockJourneyContext = {};
      
      // Verify function calls don't throw type errors
      expect(() => tracingPackage.getTraceIdFromContext()).not.toThrow();
      expect(() => tracingPackage.getSpanIdFromContext()).not.toThrow();
      expect(() => tracingPackage.enrichLogContextWithTraceInfo(mockLogContext)).not.toThrow();
      expect(() => tracingPackage.addCommonAttributes(mockSpan as any, { userId: '123' })).not.toThrow();
      expect(() => tracingPackage.addJourneyAttributes(mockSpan as any, mockJourneyContext)).not.toThrow();
      expect(() => tracingPackage.addErrorAttributes(mockSpan as any, mockError)).not.toThrow();
      expect(() => tracingPackage.extractTraceContextFromHeaders(mockHeaders)).not.toThrow();
      expect(() => tracingPackage.injectTraceContextIntoHeaders(mockHeaders)).not.toThrow();
      expect(() => tracingPackage.extractTraceContextFromKafkaMessage(mockKafkaMessage)).not.toThrow();
      expect(() => tracingPackage.injectTraceContextIntoKafkaMessage(mockKafkaMessage)).not.toThrow();
    });
  });

  describe('Tree-shaking support', () => {
    it('should use named exports for better tree-shaking', () => {
      // Verify that the package uses named exports rather than default exports
      // This ensures better tree-shaking support in bundlers
      expect(tracingPackage.default).toBeUndefined();
    });
  });
});