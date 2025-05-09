/**
 * @file index.spec.ts
 * @description Tests for the main entry point barrel file of the NestJS-specific error handling components.
 * Verifies that all components (filters, interceptors, decorators, module) are correctly exported
 * and organized by category.
 */

import * as nestExports from '../../../src/nest';
import { GlobalExceptionFilter, createGlobalExceptionFilter } from '../../../src/nest/filters';
import {
  TimeoutInterceptor,
  RetryInterceptor,
  CircuitBreakerInterceptor,
  FallbackInterceptor
} from '../../../src/nest/interceptors';
import {
  Retry,
  CircuitBreaker,
  Fallback,
  ErrorBoundary,
  TimeoutConfig,
  ResilientOperation,
  RetryConfigs,
  ResilientConfigs
} from '../../../src/nest/decorators';
import { ErrorsModule } from '../../../src/nest/module';

describe('NestJS Error Handling Exports', () => {
  describe('Filters', () => {
    it('should export all filter components', () => {
      expect(nestExports.GlobalExceptionFilter).toBeDefined();
      expect(nestExports.createGlobalExceptionFilter).toBeDefined();
      
      // Verify they are the correct components
      expect(nestExports.GlobalExceptionFilter).toBe(GlobalExceptionFilter);
      expect(nestExports.createGlobalExceptionFilter).toBe(createGlobalExceptionFilter);
    });
  });

  describe('Interceptors', () => {
    it('should export all interceptor components', () => {
      expect(nestExports.TimeoutInterceptor).toBeDefined();
      expect(nestExports.RetryInterceptor).toBeDefined();
      expect(nestExports.CircuitBreakerInterceptor).toBeDefined();
      expect(nestExports.FallbackInterceptor).toBeDefined();
      
      // Verify they are the correct components
      expect(nestExports.TimeoutInterceptor).toBe(TimeoutInterceptor);
      expect(nestExports.RetryInterceptor).toBe(RetryInterceptor);
      expect(nestExports.CircuitBreakerInterceptor).toBe(CircuitBreakerInterceptor);
      expect(nestExports.FallbackInterceptor).toBe(FallbackInterceptor);
    });
  });

  describe('Decorators', () => {
    it('should export all decorator components', () => {
      expect(nestExports.Retry).toBeDefined();
      expect(nestExports.CircuitBreaker).toBeDefined();
      expect(nestExports.Fallback).toBeDefined();
      expect(nestExports.ErrorBoundary).toBeDefined();
      expect(nestExports.TimeoutConfig).toBeDefined();
      expect(nestExports.ResilientOperation).toBeDefined();
      expect(nestExports.RetryConfigs).toBeDefined();
      expect(nestExports.ResilientConfigs).toBeDefined();
      
      // Verify they are the correct components
      expect(nestExports.Retry).toBe(Retry);
      expect(nestExports.CircuitBreaker).toBe(CircuitBreaker);
      expect(nestExports.Fallback).toBe(Fallback);
      expect(nestExports.ErrorBoundary).toBe(ErrorBoundary);
      expect(nestExports.TimeoutConfig).toBe(TimeoutConfig);
      expect(nestExports.ResilientOperation).toBe(ResilientOperation);
      expect(nestExports.RetryConfigs).toBe(RetryConfigs);
      expect(nestExports.ResilientConfigs).toBe(ResilientConfigs);
    });
  });

  describe('Module', () => {
    it('should export the ErrorsModule', () => {
      expect(nestExports.ErrorsModule).toBeDefined();
      expect(nestExports.ErrorsModule).toBe(ErrorsModule);
    });
  });

  describe('ErrorHandlingBundle', () => {
    it('should export the ErrorHandlingBundle with all components', () => {
      expect(nestExports.ErrorHandlingBundle).toBeDefined();
      
      // Check filters in bundle
      expect(nestExports.ErrorHandlingBundle.filters).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.filters.GlobalExceptionFilter).toBe(GlobalExceptionFilter);
      
      // Check interceptors in bundle
      expect(nestExports.ErrorHandlingBundle.interceptors).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.interceptors.RetryInterceptor).toBe(RetryInterceptor);
      expect(nestExports.ErrorHandlingBundle.interceptors.CircuitBreakerInterceptor).toBe(CircuitBreakerInterceptor);
      expect(nestExports.ErrorHandlingBundle.interceptors.FallbackInterceptor).toBe(FallbackInterceptor);
      expect(nestExports.ErrorHandlingBundle.interceptors.TimeoutInterceptor).toBe(TimeoutInterceptor);
      
      // Check decorators in bundle
      expect(nestExports.ErrorHandlingBundle.decorators).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.decorators.Retry).toBe(Retry);
      expect(nestExports.ErrorHandlingBundle.decorators.CircuitBreaker).toBe(CircuitBreaker);
      expect(nestExports.ErrorHandlingBundle.decorators.Fallback).toBe(Fallback);
      expect(nestExports.ErrorHandlingBundle.decorators.ErrorBoundary).toBe(ErrorBoundary);
      expect(nestExports.ErrorHandlingBundle.decorators.TimeoutConfig).toBe(TimeoutConfig);
      
      // Check module in bundle
      expect(nestExports.ErrorHandlingBundle.module).toBe(ErrorsModule);
      
      // Check applyToApp method
      expect(nestExports.ErrorHandlingBundle.applyToApp).toBeInstanceOf(Function);
    });

    it('should have a working applyToApp method', () => {
      // Mock NestJS app
      const mockApp = {
        useGlobalFilters: jest.fn().mockReturnThis(),
        useGlobalInterceptors: jest.fn().mockReturnThis(),
      };
      
      // Call the applyToApp method
      const result = nestExports.ErrorHandlingBundle.applyToApp(mockApp);
      
      // Verify the app methods were called with the correct arguments
      expect(mockApp.useGlobalFilters).toHaveBeenCalledTimes(1);
      expect(mockApp.useGlobalFilters).toHaveBeenCalledWith(expect.any(GlobalExceptionFilter));
      
      expect(mockApp.useGlobalInterceptors).toHaveBeenCalledTimes(1);
      expect(mockApp.useGlobalInterceptors).toHaveBeenCalledWith(
        expect.any(TimeoutInterceptor),
        expect.any(RetryInterceptor),
        expect.any(CircuitBreakerInterceptor),
        expect.any(FallbackInterceptor)
      );
      
      // Verify the method returns the app
      expect(result).toBe(mockApp);
    });
  });

  describe('Documentation', () => {
    it('should have JSDoc comments for all exported components', () => {
      // Get the source code of the index.ts file
      const indexSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/index.ts'),
        'utf8'
      );
      
      // Check for JSDoc comments for each category
      expect(indexSource).toContain('@module @austa/errors/nest');
      expect(indexSource).toContain('Re-export all filters');
      expect(indexSource).toContain('Re-export all interceptors');
      expect(indexSource).toContain('Re-export all decorators');
      expect(indexSource).toContain('Re-export the ErrorsModule');
      
      // Check for examples in the documentation
      expect(indexSource).toContain('@example');
      
      // Check for documentation of the ErrorHandlingBundle
      expect(indexSource).toContain('Pre-configured error handling bundle');
    });

    it('should have usage examples for each component category', () => {
      // Get the source code of the index.ts file
      const indexSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/index.ts'),
        'utf8'
      );
      
      // Check for examples for each component category
      expect(indexSource).toMatch(/\/\/ Import the GlobalExceptionFilter[\s\S]*?from '@austa\/errors\/nest'/); 
      expect(indexSource).toMatch(/\/\/ Import specific interceptors[\s\S]*?from '@austa\/errors\/nest'/); 
      expect(indexSource).toMatch(/\/\/ Import decorators[\s\S]*?from '@austa\/errors\/nest'/); 
      expect(indexSource).toMatch(/\/\/ Import the ErrorsModule[\s\S]*?from '@austa\/errors\/nest'/); 
      expect(indexSource).toMatch(/\/\/ Import the error handling bundle[\s\S]*?from '@austa\/errors\/nest'/); 
      
      // Check for practical usage examples
      expect(indexSource).toMatch(/\/\/ Use in your NestJS application[\s\S]*?app\.useGlobalFilters/); 
      expect(indexSource).toMatch(/\/\/ Use in your NestJS controller[\s\S]*?@UseInterceptors/); 
      expect(indexSource).toMatch(/\/\/ Use in your NestJS controller method[\s\S]*?@Retry/); 
      expect(indexSource).toMatch(/\/\/ Use in your NestJS application module[\s\S]*?@Module/); 
      expect(indexSource).toMatch(/ErrorHandlingBundle\.applyToApp\(app\)/); 
    });
  });

  describe('Circular Dependencies Prevention', () => {
    it('should not have circular dependencies between components', () => {
      // This test verifies that the barrel file correctly prevents circular dependencies
      // by checking that all components can be imported directly from their source files
      // and that the barrel file only re-exports them without creating new dependencies
      
      // If there were circular dependencies, the imports at the top of this test file
      // would fail or cause runtime errors
      
      // Additional verification that the exports match the direct imports
      expect(Object.keys(nestExports).sort()).toEqual(
        [
          // Filters
          'GlobalExceptionFilter',
          'createGlobalExceptionFilter',
          
          // Interceptors
          'TimeoutInterceptor',
          'RetryInterceptor',
          'CircuitBreakerInterceptor',
          'FallbackInterceptor',
          
          // Decorators
          'Retry',
          'CircuitBreaker',
          'Fallback',
          'ErrorBoundary',
          'TimeoutConfig',
          'ResilientOperation',
          'RetryConfigs',
          'ResilientConfigs',
          
          // Module
          'ErrorsModule',
          
          // Bundle
          'ErrorHandlingBundle'
        ].sort()
      );
    });

    it('should use proper re-export patterns to prevent circular dependencies', () => {
      // Get the source code of the index.ts file
      const indexSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/index.ts'),
        'utf8'
      );
      
      // Check that the file uses proper export patterns
      expect(indexSource).toContain('export * from \'./filters\'');
      expect(indexSource).toContain('export * from \'./interceptors\'');
      expect(indexSource).toContain('export * from \'./decorators\'');
      expect(indexSource).toContain('export * from \'./module\'');
      
      // Check that imports for the bundle are done separately from exports
      // This pattern prevents circular dependencies
      expect(indexSource).toMatch(/import\s+{\s*GlobalExceptionFilter\s*}\s+from\s+'\.\/(filters|filters\.js|filters\.ts)'/i);
      expect(indexSource).toMatch(/import\s+{[^}]*RetryInterceptor[^}]*}\s+from\s+'\.\/(interceptors|interceptors\.js|interceptors\.ts)'/i);
      expect(indexSource).toMatch(/import\s+{[^}]*Retry[^}]*}\s+from\s+'\.\/(decorators|decorators\.js|decorators\.ts)'/i);
      expect(indexSource).toMatch(/import\s+{\s*ErrorsModule\s*}\s+from\s+'\.\/(module|module\.js|module\.ts)'/i);
    });
  });

  describe('Integration with Error Framework', () => {
    it('should integrate with the core error handling framework', () => {
      // This test verifies that the NestJS components properly integrate with the core error framework
      // by checking that they reference the core types and constants
      
      // Get the source code of the filter file
      const filterSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/filters.ts'),
        'utf8'
      );
      
      // Check that the filter imports core error types
      expect(filterSource).toContain('import { BaseError, ErrorType');
      expect(filterSource).toContain('SerializedError');
      expect(filterSource).toContain('ERROR_TYPE_TO_HTTP_STATUS');
      
      // Get the source code of the interceptor file
      const interceptorSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/interceptors.ts'),
        'utf8'
      );
      
      // Check that interceptors use core error types
      expect(interceptorSource).toContain('import { ErrorType }');
      expect(interceptorSource).toContain('DEFAULT_RETRY_CONFIG');
      expect(interceptorSource).toContain('RETRYABLE_HTTP_STATUS_CODES');
      
      // Get the source code of the decorator file
      const decoratorSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/decorators.ts'),
        'utf8'
      );
      
      // Check that decorators use core error types
      expect(decoratorSource).toContain('import { ErrorType }');
      expect(decoratorSource).toContain('DEFAULT_RETRY_CONFIG');
    });
  });

  describe('Export Organization', () => {
    it('should organize exports by functional category', () => {
      // Get the source code of the index.ts file
      const indexSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/index.ts'),
        'utf8'
      );
      
      // Check that exports are organized by category with clear separation
      const filterSection = indexSource.indexOf('Re-export all filters');
      const interceptorSection = indexSource.indexOf('Re-export all interceptors');
      const decoratorSection = indexSource.indexOf('Re-export all decorators');
      const moduleSection = indexSource.indexOf('Re-export the ErrorsModule');
      const bundleSection = indexSource.indexOf('Convenience export of commonly used components');
      
      // Verify sections appear in a logical order
      expect(filterSection).toBeLessThan(interceptorSection);
      expect(interceptorSection).toBeLessThan(decoratorSection);
      expect(decoratorSection).toBeLessThan(moduleSection);
      expect(moduleSection).toBeLessThan(bundleSection);
      
      // Verify each section has proper documentation
      expect(indexSource.substring(filterSection - 50, filterSection + 50)).toContain('/**');
      expect(indexSource.substring(interceptorSection - 50, interceptorSection + 50)).toContain('/**');
      expect(indexSource.substring(decoratorSection - 50, decoratorSection + 50)).toContain('/**');
      expect(indexSource.substring(moduleSection - 50, moduleSection + 50)).toContain('/**');
      expect(indexSource.substring(bundleSection - 50, bundleSection + 50)).toContain('/**');
    });
  });
  describe('Completeness Check', () => {
    it('should export all required components for a complete error handling solution', () => {
      // This test verifies that all components required for a complete error handling solution are exported
      
      // Check for essential filter components
      expect(nestExports.GlobalExceptionFilter).toBeDefined();
      expect(nestExports.GlobalExceptionFilter.prototype.catch).toBeDefined();
      
      // Check for essential interceptor components
      expect(nestExports.RetryInterceptor).toBeDefined();
      expect(nestExports.RetryInterceptor.prototype.intercept).toBeDefined();
      expect(nestExports.CircuitBreakerInterceptor).toBeDefined();
      expect(nestExports.CircuitBreakerInterceptor.prototype.intercept).toBeDefined();
      expect(nestExports.FallbackInterceptor).toBeDefined();
      expect(nestExports.FallbackInterceptor.prototype.intercept).toBeDefined();
      expect(nestExports.TimeoutInterceptor).toBeDefined();
      expect(nestExports.TimeoutInterceptor.prototype.intercept).toBeDefined();
      
      // Check for essential decorator components
      expect(nestExports.Retry).toBeDefined();
      expect(nestExports.Retry).toBeInstanceOf(Function);
      expect(nestExports.CircuitBreaker).toBeDefined();
      expect(nestExports.CircuitBreaker).toBeInstanceOf(Function);
      expect(nestExports.Fallback).toBeDefined();
      expect(nestExports.Fallback).toBeInstanceOf(Function);
      expect(nestExports.ErrorBoundary).toBeDefined();
      expect(nestExports.ErrorBoundary).toBeInstanceOf(Function);
      expect(nestExports.TimeoutConfig).toBeDefined();
      expect(nestExports.TimeoutConfig).toBeInstanceOf(Function);
      
      // Check for essential module components
      expect(nestExports.ErrorsModule).toBeDefined();
      expect(nestExports.ErrorsModule.register).toBeDefined();
      expect(nestExports.ErrorsModule.forRoot).toBeDefined();
      expect(nestExports.ErrorsModule.registerAsync).toBeDefined();
      
      // Check for essential bundle components
      expect(nestExports.ErrorHandlingBundle).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.applyToApp).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.filters).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.interceptors).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.decorators).toBeDefined();
      expect(nestExports.ErrorHandlingBundle.module).toBeDefined();
    });
  });
});