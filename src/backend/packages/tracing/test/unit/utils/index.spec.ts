/**
 * @file Unit tests for tracing utilities barrel file
 * @description Verifies that all utility functions are properly exported from the barrel file
 */

import * as correlationUtils from '../../../src/utils/correlation';
import * as spanAttributesUtils from '../../../src/utils/span-attributes';
import * as contextPropagationUtils from '../../../src/utils/context-propagation';
import * as barrelExports from '../../../src/utils';

describe('Tracing Utilities Barrel File', () => {
  describe('Correlation Utilities', () => {
    it('should export all correlation utility functions', () => {
      // Get all exported functions from the correlation module
      const correlationExports = Object.keys(correlationUtils);
      
      // Verify each function is exported from the barrel file
      correlationExports.forEach(exportName => {
        expect(barrelExports).toHaveProperty(exportName);
        expect(barrelExports[exportName]).toBe(correlationUtils[exportName]);
      });
    });
  });

  describe('Span Attributes Utilities', () => {
    it('should export all span attribute utility functions and enums', () => {
      // Get all exported functions and enums from the span-attributes module
      const spanAttributesExports = Object.keys(spanAttributesUtils);
      
      // Verify each function and enum is exported from the barrel file
      spanAttributesExports.forEach(exportName => {
        expect(barrelExports).toHaveProperty(exportName);
        expect(barrelExports[exportName]).toBe(spanAttributesUtils[exportName]);
      });
    });
  });

  describe('Context Propagation Utilities', () => {
    it('should export all context propagation utility functions and interfaces', () => {
      // Get all exported functions and interfaces from the context-propagation module
      const contextPropagationExports = Object.keys(contextPropagationUtils);
      
      // Verify each function and interface is exported from the barrel file
      contextPropagationExports.forEach(exportName => {
        expect(barrelExports).toHaveProperty(exportName);
        expect(barrelExports[exportName]).toBe(contextPropagationUtils[exportName]);
      });
    });
  });

  describe('Export Structure', () => {
    it('should maintain proper export structure for tree-shaking support', () => {
      // Verify that the barrel file is using named exports (not default exports)
      // This ensures proper tree-shaking support
      expect(barrelExports).not.toHaveProperty('default');
    });

    it('should not have any unexpected exports', () => {
      // Get all exports from the barrel file
      const allBarrelExports = Object.keys(barrelExports);
      
      // Get all exports from the individual modules
      const allModuleExports = [
        ...Object.keys(correlationUtils),
        ...Object.keys(spanAttributesUtils),
        ...Object.keys(contextPropagationUtils)
      ];
      
      // Verify that the barrel file doesn't export anything not in the individual modules
      allBarrelExports.forEach(exportName => {
        expect(allModuleExports).toContain(exportName);
      });
    });
  });

  describe('Public API Consistency', () => {
    // Test specific important functions to ensure they're properly exported
    
    it('should export correlation utility functions', () => {
      // Key correlation functions that must be exported
      const keyCorrelationFunctions = [
        'getTraceCorrelation',
        'enrichLogWithTraceInfo',
        'createExternalCorrelationHeaders',
        'createMetricsCorrelation',
        'hasActiveTrace'
      ];
      
      keyCorrelationFunctions.forEach(functionName => {
        expect(barrelExports).toHaveProperty(functionName);
        expect(typeof barrelExports[functionName]).toBe('function');
      });
    });

    it('should export span attribute utility functions', () => {
      // Key span attribute functions that must be exported
      const keySpanAttributeFunctions = [
        'addUserAttributes',
        'addRequestAttributes',
        'addServiceAttributes',
        'addHealthJourneyAttributes',
        'addCareJourneyAttributes',
        'addPlanJourneyAttributes',
        'addErrorAttributes',
        'classifyHttpError'
      ];
      
      keySpanAttributeFunctions.forEach(functionName => {
        expect(barrelExports).toHaveProperty(functionName);
        expect(typeof barrelExports[functionName]).toBe('function');
      });
    });

    it('should export context propagation utility functions', () => {
      // Key context propagation functions that must be exported
      const keyContextPropagationFunctions = [
        'extractContextFromHttpHeaders',
        'injectContextIntoHttpHeaders',
        'extractContextFromKafkaMessage',
        'injectContextIntoKafkaMessage',
        'serializeContext',
        'deserializeContext',
        'createHealthJourneyContext',
        'createCareJourneyContext',
        'createPlanJourneyContext'
      ];
      
      keyContextPropagationFunctions.forEach(functionName => {
        expect(barrelExports).toHaveProperty(functionName);
        expect(typeof barrelExports[functionName]).toBe('function');
      });
    });

    it('should export important enums and interfaces', () => {
      // Key enums that must be exported
      expect(barrelExports).toHaveProperty('AttributeNamespace');
      expect(barrelExports).toHaveProperty('JourneyType');
      expect(barrelExports).toHaveProperty('ErrorType');
      
      // Verify enum values
      expect(barrelExports.JourneyType).toHaveProperty('HEALTH');
      expect(barrelExports.JourneyType).toHaveProperty('CARE');
      expect(barrelExports.JourneyType).toHaveProperty('PLAN');
      
      expect(barrelExports.ErrorType).toHaveProperty('CLIENT');
      expect(barrelExports.ErrorType).toHaveProperty('SYSTEM');
      expect(barrelExports.ErrorType).toHaveProperty('TRANSIENT');
      expect(barrelExports.ErrorType).toHaveProperty('EXTERNAL');
    });
  });
});