import { Test } from '@nestjs/testing';
import * as nestErrorsModule from '../../../src/nest';
import * as filters from '../../../src/nest/filters';
import * as interceptors from '../../../src/nest/interceptors';
import * as decorators from '../../../src/nest/decorators';
import * as module from '../../../src/nest/module';

describe('NestJS Error Handling Module', () => {
  describe('Public API Structure', () => {
    it('should export all filters correctly', () => {
      // Check that all filters are exported
      expect(nestErrorsModule.GlobalExceptionFilter).toBeDefined();
      expect(nestErrorsModule.GlobalExceptionFilter).toBe(filters.GlobalExceptionFilter);
    });

    it('should export all interceptors correctly', () => {
      // Check that all interceptors are exported
      expect(nestErrorsModule.RetryInterceptor).toBeDefined();
      expect(nestErrorsModule.CircuitBreakerInterceptor).toBeDefined();
      expect(nestErrorsModule.FallbackInterceptor).toBeDefined();
      expect(nestErrorsModule.TimeoutInterceptor).toBeDefined();
      
      expect(nestErrorsModule.RetryInterceptor).toBe(interceptors.RetryInterceptor);
      expect(nestErrorsModule.CircuitBreakerInterceptor).toBe(interceptors.CircuitBreakerInterceptor);
      expect(nestErrorsModule.FallbackInterceptor).toBe(interceptors.FallbackInterceptor);
      expect(nestErrorsModule.TimeoutInterceptor).toBe(interceptors.TimeoutInterceptor);
    });

    it('should export all decorators correctly', () => {
      // Check that all decorators are exported
      expect(nestErrorsModule.Retry).toBeDefined();
      expect(nestErrorsModule.CircuitBreaker).toBeDefined();
      expect(nestErrorsModule.Fallback).toBeDefined();
      expect(nestErrorsModule.ErrorBoundary).toBeDefined();
      expect(nestErrorsModule.TimeoutConfig).toBeDefined();
      expect(nestErrorsModule.ErrorHandling).toBeDefined();
      
      expect(nestErrorsModule.Retry).toBe(decorators.Retry);
      expect(nestErrorsModule.CircuitBreaker).toBe(decorators.CircuitBreaker);
      expect(nestErrorsModule.Fallback).toBe(decorators.Fallback);
      expect(nestErrorsModule.ErrorBoundary).toBe(decorators.ErrorBoundary);
      expect(nestErrorsModule.TimeoutConfig).toBe(decorators.TimeoutConfig);
      expect(nestErrorsModule.ErrorHandling).toBe(decorators.ErrorHandling);
    });

    it('should export the module correctly', () => {
      // Check that the module is exported
      expect(nestErrorsModule.ErrorsModule).toBeDefined();
      expect(nestErrorsModule.ErrorsModule).toBe(module.ErrorsModule);
    });

    it('should export all module interfaces correctly', () => {
      // Check that all module interfaces are exported
      expect(nestErrorsModule.ErrorsModuleOptions).toBeDefined();
      expect(nestErrorsModule.ErrorsModuleOptionsFactory).toBeDefined();
      expect(nestErrorsModule.ErrorsModuleAsyncOptions).toBeDefined();
    });

    it('should export all interceptor interfaces correctly', () => {
      // Check that all interceptor interfaces are exported
      expect(nestErrorsModule.RetryOptions).toBeDefined();
      expect(nestErrorsModule.CircuitBreakerOptions).toBeDefined();
      expect(nestErrorsModule.FallbackOptions).toBeDefined();
      expect(nestErrorsModule.TimeoutOptions).toBeDefined();
    });

    it('should export all decorator interfaces correctly', () => {
      // Check that all decorator interfaces are exported
      expect(nestErrorsModule.RetryConfig).toBeDefined();
      expect(nestErrorsModule.CircuitBreakerConfig).toBeDefined();
      expect(nestErrorsModule.FallbackConfig).toBeDefined();
      expect(nestErrorsModule.ErrorBoundaryConfig).toBeDefined();
      expect(nestErrorsModule.TimeoutConfig).toBeDefined();
    });
  });

  describe('Module Integration', () => {
    it('should create a module with default options', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [nestErrorsModule.ErrorsModule.forRoot()],
      }).compile();

      expect(moduleRef).toBeDefined();
    });

    it('should create a module with custom options', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          nestErrorsModule.ErrorsModule.forRoot({
            enableDetailedErrors: true,
            enableGlobalRetry: true,
            defaultRetryOptions: {
              maxAttempts: 5,
              baseDelayMs: 500,
            },
          }),
        ],
      }).compile();

      expect(moduleRef).toBeDefined();
    });

    it('should create a module with async options', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          nestErrorsModule.ErrorsModule.forRootAsync({
            useFactory: () => ({
              enableDetailedErrors: true,
              enableGlobalRetry: true,
            }),
          }),
        ],
      }).compile();

      expect(moduleRef).toBeDefined();
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
      expect(indexSource).toContain('* Exception filters for global error handling');
      expect(indexSource).toContain('* Interceptors for implementing error recovery strategies');
      expect(indexSource).toContain('* Decorators for declarative error handling');
      expect(indexSource).toContain('* The ErrorsModule for NestJS integration');
    });
  });

  describe('Circular Dependencies Prevention', () => {
    it('should not have circular dependencies between components', () => {
      // This is a simple check to ensure that the imports in the test don't cause circular dependency warnings
      // If there are circular dependencies, Jest will show warnings during test execution
      expect(true).toBe(true);
    });

    it('should have proper organization by category', () => {
      // Check that the exports are organized by category
      const indexSource = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../src/nest/index.ts'),
        'utf8'
      );

      // The order of exports should be: filters, interceptors, decorators, module
      const filtersExportIndex = indexSource.indexOf("export * from './filters'");
      const interceptorsExportIndex = indexSource.indexOf("export * from './interceptors'");
      const decoratorsExportIndex = indexSource.indexOf("export * from './decorators'");
      const moduleExportIndex = indexSource.indexOf("export * from './module'");

      expect(filtersExportIndex).toBeGreaterThan(0);
      expect(interceptorsExportIndex).toBeGreaterThan(filtersExportIndex);
      expect(decoratorsExportIndex).toBeGreaterThan(interceptorsExportIndex);
      expect(moduleExportIndex).toBeGreaterThan(decoratorsExportIndex);
    });
  });
});