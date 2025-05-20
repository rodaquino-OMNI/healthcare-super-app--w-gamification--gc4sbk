/**
 * Unit tests for the main barrel file of the @austa/tracing package.
 * 
 * These tests verify that all public components are properly exported from the package,
 * ensuring that consumers can import and use them as expected. The tests cover:
 * 
 * 1. Core components (TracingModule, TracingService)
 * 2. Constants (CONFIG_KEYS, DEFAULT_*, ERROR_CODES)
 * 3. Interfaces (TraceContext, TracerProvider, TracingModuleOptions)
 * 4. Utility functions (correlation, span attributes, context propagation)
 * 5. Package structure (tree-shaking support, export patterns)
 * 6. Integration with AUSTA SuperApp architecture (journey-specific tracing, logging integration)
 * 
 * These tests are critical for maintaining the public API of the package and ensuring
 * backward compatibility for consumers. They also verify that the package follows the
 * standardized export patterns required by the AUSTA SuperApp refactoring project.
 * 
 * Key requirements addressed:
 * - Create proper export barrels for each service
 * - Define clear public API for each service
 * - Document exported components and utilities
 * - Implement standardized export patterns
 * 
 * @package @austa/tracing
 * @group unit
 * @category exports
 */

import { Test } from '@nestjs/testing';
import * as tracingPackage from '../../src';

describe('@austa/tracing package exports', () => {
  describe('Core components', () => {
    it('should export TracingModule', () => {
      // Verify TracingModule is exported
      expect(tracingPackage.TracingModule).toBeDefined();
      
      // Verify it's a NestJS module with the expected static methods
      expect(tracingPackage.TracingModule.register).toBeInstanceOf(Function);
      
      // Verify module metadata is preserved
      const moduleMetadata = Reflect.getMetadata('__module', tracingPackage.TracingModule);
      expect(moduleMetadata).toBeDefined();
      expect(moduleMetadata.exports).toContain(tracingPackage.TracingService);
    });

    it('should export TracingService', () => {
      // Verify TracingService is exported
      expect(tracingPackage.TracingService).toBeDefined();
      
      // Verify it has the expected methods
      const servicePrototype = tracingPackage.TracingService.prototype;
      expect(servicePrototype.createSpan).toBeInstanceOf(Function);
      expect(servicePrototype.createJourneySpan).toBeInstanceOf(Function);
      expect(servicePrototype.extractContextFromHeaders).toBeInstanceOf(Function);
      expect(servicePrototype.injectContextIntoHeaders).toBeInstanceOf(Function);
      
      // Verify it's injectable in a NestJS module
      const moduleRef = Test.createTestingModule({
        providers: [tracingPackage.TracingService],
      }).compile();
      expect(moduleRef).toBeDefined();
    });
  });

  describe('Constants', () => {
    it('should export CONFIG_KEYS', () => {
      // Verify CONFIG_KEYS is exported
      expect(tracingPackage.CONFIG_KEYS).toBeDefined();
      
      // Verify it contains the expected keys
      expect(tracingPackage.CONFIG_KEYS.SERVICE_NAME).toBeDefined();
      expect(typeof tracingPackage.CONFIG_KEYS.SERVICE_NAME).toBe('string');
    });

    it('should export DEFAULT constants', () => {
      // Verify default constants are exported
      expect(tracingPackage.DEFAULT_SERVICE_NAME).toBeDefined();
      expect(tracingPackage.DEFAULT_LOGGER_CONTEXT).toBeDefined();
      
      // Verify they have the expected types
      expect(typeof tracingPackage.DEFAULT_SERVICE_NAME).toBe('string');
      expect(typeof tracingPackage.DEFAULT_LOGGER_CONTEXT).toBe('string');
    });

    it('should export ERROR_CODES', () => {
      // Verify ERROR_CODES is exported
      expect(tracingPackage.ERROR_CODES).toBeDefined();
      
      // Verify it contains at least one error code
      expect(Object.keys(tracingPackage.ERROR_CODES).length).toBeGreaterThan(0);
      
      // Verify error codes follow the expected pattern (string values)
      Object.values(tracingPackage.ERROR_CODES).forEach(code => {
        expect(typeof code).toBe('string');
        expect(code).toMatch(/^TRACING_/); // Error codes should follow naming convention
      });
    });
  });

  describe('Interfaces', () => {
    it('should export all required interfaces', () => {
      // We can't directly test interfaces as they don't exist at runtime
      // But we can verify that the package exports the expected types by checking
      // if TypeScript recognizes them in a type context
      
      // This is a type-level test that will fail at compile time if the interfaces are not exported
      type TestTraceContext = tracingPackage.TraceContext;
      type TestTracerProvider = tracingPackage.TracerProvider;
      type TestTracingModuleOptions = tracingPackage.TracingModuleOptions;
      
      // This assertion just verifies the test runs without TypeScript errors
      expect(true).toBeTruthy();
    });
  });

  describe('Utility functions', () => {
    it('should export correlation utilities', () => {
      // Verify correlation utilities are exported
      expect(tracingPackage.enrichLogContextWithTraceInfo).toBeInstanceOf(Function);
      
      // Verify function signature (indirectly)
      const functionString = tracingPackage.enrichLogContextWithTraceInfo.toString();
      expect(functionString).toContain('span');
    });

    it('should export span attribute utilities', () => {
      // Verify span attribute utilities are exported
      expect(tracingPackage.addCommonAttributes).toBeInstanceOf(Function);
      expect(tracingPackage.addJourneyAttributes).toBeInstanceOf(Function);
      expect(tracingPackage.addErrorAttributes).toBeInstanceOf(Function);
      
      // Verify function signatures (indirectly)
      expect(tracingPackage.addCommonAttributes.toString()).toContain('span');
      expect(tracingPackage.addJourneyAttributes.toString()).toContain('journeyType');
      expect(tracingPackage.addErrorAttributes.toString()).toContain('error');
    });

    it('should export context propagation utilities', () => {
      // Verify context propagation utilities are exported
      expect(tracingPackage.extractContextFromHeaders).toBeInstanceOf(Function);
      expect(tracingPackage.injectContextIntoHeaders).toBeInstanceOf(Function);
      
      // Verify function signatures (indirectly)
      expect(tracingPackage.extractContextFromHeaders.toString()).toContain('headers');
      expect(tracingPackage.injectContextIntoHeaders.toString()).toContain('headers');
    });
  });

  describe('Package structure', () => {
    it('should support tree-shaking through proper exports', () => {
      // Verify that the package exports named exports (not default exports)
      // which is better for tree-shaking
      expect(tracingPackage.default).toBeUndefined();
      
      // Verify that the package exports at least the minimum required components
      const exportedKeys = Object.keys(tracingPackage);
      const requiredExports = [
        // Core components
        'TracingModule',
        'TracingService',
        
        // Constants
        'CONFIG_KEYS',
        'DEFAULT_SERVICE_NAME',
        'DEFAULT_LOGGER_CONTEXT',
        'ERROR_CODES',
        
        // Utility functions
        'enrichLogContextWithTraceInfo',
        'addCommonAttributes',
        'addJourneyAttributes',
        'addErrorAttributes',
        'extractContextFromHeaders',
        'injectContextIntoHeaders'
      ];
      
      requiredExports.forEach(requiredExport => {
        expect(exportedKeys).toContain(requiredExport);
      });
    });
    
    it('should maintain consistent export patterns', () => {
      // Verify that all exports follow consistent patterns
      const exportedKeys = Object.keys(tracingPackage);
      
      // Classes should be PascalCase
      const classExports = exportedKeys.filter(key => 
        typeof tracingPackage[key] === 'function' && 
        /^[A-Z]/.test(key) && 
        key !== 'Test' // Exclude the imported Test from @nestjs/testing
      );
      
      classExports.forEach(key => {
        expect(key).toMatch(/^[A-Z][a-zA-Z0-9]*$/); // PascalCase
      });
      
      // Constants should be UPPER_CASE
      const constantExports = exportedKeys.filter(key => 
        key === key.toUpperCase() && 
        key.includes('_')
      );
      
      constantExports.forEach(key => {
        expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/); // UPPER_CASE
      });
      
      // Functions should be camelCase
      const functionExports = exportedKeys.filter(key => 
        typeof tracingPackage[key] === 'function' && 
        /^[a-z]/.test(key)
      );
      
      functionExports.forEach(key => {
        expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/); // camelCase
      });
    });
    
    it('should export all required journey-specific utilities', () => {
      // Verify that journey-specific utilities are exported
      expect(tracingPackage.addJourneyAttributes).toBeInstanceOf(Function);
      
      // Verify the function accepts journey type parameters
      const functionString = tracingPackage.addJourneyAttributes.toString();
      ['health', 'care', 'plan'].forEach(journeyType => {
        expect(functionString).toContain(journeyType);
      });
    });
    
    it('should provide a clear and documented public API', () => {
      // This test verifies that the package exports are well-documented
      // by checking for JSDoc comments in the source code
      
      // Get the source code of the main barrel file
      const mainBarrelSource = require('fs').readFileSync(require.resolve('../../src/index'), 'utf8');
      
      // Check for documentation comments
      expect(mainBarrelSource).toContain('/**');
      expect(mainBarrelSource).toContain('@example');
      
      // Check for section headers in the documentation
      ['Core Module and Service', 'Constants', 'Interfaces', 'Utilities'].forEach(section => {
        expect(mainBarrelSource).toContain(section);
      });
      
      // Check for export statements for each category
      expect(mainBarrelSource).toContain('export { TracingModule }');
      expect(mainBarrelSource).toContain('export { TracingService }');
      expect(mainBarrelSource).toContain('export * from \'./constants\'');
      expect(mainBarrelSource).toContain('export * from \'./interfaces\'');
      expect(mainBarrelSource).toContain('export * from \'./utils\'');
    });
  });
  
  describe('Integration with AUSTA SuperApp architecture', () => {
    it('should support journey-specific tracing', () => {
      // Verify that the TracingService has journey-specific methods
      expect(tracingPackage.TracingService.prototype.createJourneySpan).toBeInstanceOf(Function);
      
      // Verify the method signature includes journey types
      const methodString = tracingPackage.TracingService.prototype.createJourneySpan.toString();
      expect(methodString).toContain('journeyType: \'health\' | \'care\' | \'plan\'');
    });
    
    it('should integrate with the logging system', () => {
      // Verify that correlation utilities are exported for log integration
      expect(tracingPackage.enrichLogContextWithTraceInfo).toBeInstanceOf(Function);
      
      // Check that the TracingService constructor accepts a logger
      const constructorString = tracingPackage.TracingService.toString();
      expect(constructorString).toContain('logger: LoggerService');
    });
    
    it('should support configuration through NestJS ConfigService', () => {
      // Verify that the TracingService constructor accepts ConfigService
      const constructorString = tracingPackage.TracingService.toString();
      expect(constructorString).toContain('configService: ConfigService');
      
      // Verify that the TracingModule imports ConfigModule
      const moduleMetadata = Reflect.getMetadata('__module', tracingPackage.TracingModule);
      expect(moduleMetadata.imports).toContain(expect.objectContaining({
        module: expect.any(Function),
        name: 'ConfigModule'
      }));
    });
  });
});