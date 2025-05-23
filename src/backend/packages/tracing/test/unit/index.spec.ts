/**
 * Unit tests for the main barrel file of the @austa/tracing package.
 * 
 * These tests verify that all public components, interfaces, constants, and utilities
 * are properly exported from the package, ensuring a consistent and reliable API
 * for consumers of the package.
 */

describe('@austa/tracing package exports', () => {
  // Import the entire package to test exports
  const tracing = require('../../src');

  describe('Main components', () => {
    it('should export TracingModule', () => {
      expect(tracing.TracingModule).toBeDefined();
      // Verify it's a NestJS module
      expect(tracing.TracingModule.toString()).toContain('class TracingModule');
    });

    it('should export TracingService', () => {
      expect(tracing.TracingService).toBeDefined();
      // Verify it's a NestJS injectable service
      expect(tracing.TracingService.toString()).toContain('class TracingService');
    });
  });

  describe('Interfaces', () => {
    // We can't directly test interfaces as they are removed during compilation,
    // but we can verify the interface barrel file is being exported
    
    // Import the interfaces barrel directly to compare
    const interfaces = require('../../src/interfaces');

    it('should export all interfaces from the interfaces directory', () => {
      // Check that all exports from the interfaces barrel are available in the main export
      const interfaceExports = Object.keys(interfaces);
      expect(interfaceExports.length).toBeGreaterThan(0);
      
      interfaceExports.forEach(exportName => {
        expect(tracing[exportName]).toBeDefined();
        expect(tracing[exportName]).toBe(interfaces[exportName]);
      });
    });

    it('should export specific key interfaces', () => {
      // Test for specific interfaces that are critical to the package
      // These should be exported from the interfaces barrel
      const expectedInterfaces = [
        'TraceContext',
        'TracerProvider',
        'SpanOptions',
        'TracingOptions',
        'JourneyContext',
        'SpanAttributes'
      ];

      expectedInterfaces.forEach(interfaceName => {
        // For TypeScript interfaces, we can only check if they're exported as types
        // by checking if they're mentioned in the TypeScript declaration files
        // In runtime tests, we can only verify the interface is exported by name
        expect(Object.keys(interfaces)).toContain(interfaceName);
      });
    });
  });

  describe('Constants', () => {
    // Import the constants barrel directly to compare
    const constants = require('../../src/constants');

    it('should export all constants from the constants directory', () => {
      // Check that all exports from the constants barrel are available in the main export
      const constantExports = Object.keys(constants);
      expect(constantExports.length).toBeGreaterThan(0);
      
      constantExports.forEach(exportName => {
        expect(tracing[exportName]).toBeDefined();
        expect(tracing[exportName]).toBe(constants[exportName]);
      });
    });

    it('should export specific key constants', () => {
      // Test for specific constants that are critical to the package
      const expectedConstants = [
        'DEFAULT_SERVICE_NAME',
        'DEFAULT_SPAN_NAME',
        'LOGGER_CONTEXT',
        'ERROR_CODES',
        'SPAN_ATTRIBUTE_KEYS',
        'CONFIG_KEYS'
      ];

      expectedConstants.forEach(constantName => {
        expect(constants[constantName]).toBeDefined();
        expect(tracing[constantName]).toBe(constants[constantName]);
      });
    });
  });

  describe('Utilities', () => {
    // Import the utils barrel directly to compare
    const utils = require('../../src/utils');

    it('should export all utility functions from the utils directory', () => {
      // Check that all exports from the utils barrel are available in the main export
      const utilExports = Object.keys(utils);
      expect(utilExports.length).toBeGreaterThan(0);
      
      utilExports.forEach(exportName => {
        expect(tracing[exportName]).toBeDefined();
        expect(tracing[exportName]).toBe(utils[exportName]);
      });
    });

    it('should export specific key utility functions', () => {
      // Test for specific utility functions that are critical to the package
      const expectedUtils = [
        'extractTraceContext',
        'injectTraceContext',
        'correlateWithLogs',
        'addCommonAttributes',
        'addJourneyAttributes',
        'addErrorAttributes'
      ];

      expectedUtils.forEach(utilName => {
        expect(typeof utils[utilName]).toBe('function');
        expect(tracing[utilName]).toBe(utils[utilName]);
      });
    });
  });

  describe('Tree-shaking support', () => {
    it('should use named exports for better tree-shaking', () => {
      // Verify that the package uses named exports rather than default exports
      // This is important for proper tree-shaking support
      expect(tracing.default).toBeUndefined();
    });
  });
});