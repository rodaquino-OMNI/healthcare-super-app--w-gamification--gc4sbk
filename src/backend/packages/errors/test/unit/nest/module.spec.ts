import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule, LoggerService } from '@austa/logging';
import { TracingModule, TracingService } from '@austa/tracing';

import { ErrorsModule, ErrorsModuleOptions } from '../../../src/nest/module';
import { GlobalExceptionFilter } from '../../../src/nest/filters';
import {
  RetryInterceptor,
  CircuitBreakerInterceptor,
  FallbackInterceptor,
  TimeoutInterceptor
} from '../../../src/nest/interceptors';

// Mock the LoggerService and TracingService
class MockLoggerService {
  log() {}
  error() {}
  warn() {}
  debug() {}
}

class MockTracingService {
  startSpan() {
    return {
      setAttributes: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn()
    };
  }
}

// Mock the NestJS modules
jest.mock('@austa/logging', () => ({
  LoggerModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class LoggerModule {}
    }),
  },
  LoggerService: MockLoggerService,
}));

jest.mock('@austa/tracing', () => ({
  TracingModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class TracingModule {}
    }),
  },
  TracingService: MockTracingService,
}));

describe('ErrorsModule', () => {
  describe('register', () => {
    it('should register the module with default options', async () => {
      // Arrange & Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
      }).compile();

      // Assert
      expect(moduleRef).toBeDefined();
      
      // Verify that the module imports LoggerModule and TracingModule
      const imports = Reflect.getMetadata('imports', ErrorsModule);
      expect(imports).toContain(LoggerModule);
      expect(imports).toContain(TracingModule);
    });

    it('should provide the GlobalExceptionFilter with default options', async () => {
      // Arrange & Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const filterProvider = providers.find(provider => provider.provide === APP_FILTER);
      
      expect(filterProvider).toBeDefined();
      expect(filterProvider.useFactory).toBeInstanceOf(Function);
      
      // Verify that the factory creates a GlobalExceptionFilter
      const options = { enableDetailedErrors: true };
      const logger = new MockLoggerService();
      const tracer = new MockTracingService();
      const filter = filterProvider.useFactory(options, logger, tracer);
      
      expect(filter).toBeInstanceOf(GlobalExceptionFilter);
    });

    it('should provide all interceptors with default options', async () => {
      // Arrange & Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const interceptorProviders = providers.filter(provider => provider.provide === APP_INTERCEPTOR);
      
      // Should have 4 interceptors: Retry, CircuitBreaker, Fallback, and Timeout
      expect(interceptorProviders).toHaveLength(4);
      
      // Verify that the factories create the correct interceptors
      const options = { 
        enableRetry: true,
        enableCircuitBreaker: true,
        enableFallback: true,
        enableTimeout: true
      };
      const logger = new MockLoggerService();
      const tracer = new MockTracingService();
      
      // Test each interceptor factory
      const interceptors = interceptorProviders.map(provider => 
        provider.useFactory(options, logger, tracer)
      );
      
      // Filter out null values (in case some interceptors are disabled)
      const validInterceptors = interceptors.filter(i => i !== null);
      
      // Verify we have all 4 interceptors
      expect(validInterceptors).toHaveLength(4);
      
      // Verify the types of interceptors
      expect(validInterceptors.some(i => i instanceof RetryInterceptor)).toBe(true);
      expect(validInterceptors.some(i => i instanceof CircuitBreakerInterceptor)).toBe(true);
      expect(validInterceptors.some(i => i instanceof FallbackInterceptor)).toBe(true);
      expect(validInterceptors.some(i => i instanceof TimeoutInterceptor)).toBe(true);
    });
  });

  describe('forRoot', () => {
    it('should register the module with custom options', async () => {
      // Arrange
      const customOptions: ErrorsModuleOptions = {
        enableDetailedErrors: false,
        enableRetry: true,
        enableCircuitBreaker: false,
        enableFallback: true,
        enableTimeout: false,
        defaultTimeoutMs: 15000,
        journeyContext: 'health',
        maxRetries: 5,
        retryDelayMs: 500,
        circuitBreakerFailureThreshold: 10,
        circuitBreakerResetTimeoutMs: 60000
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot(customOptions)],
      }).compile();

      // Assert
      expect(moduleRef).toBeDefined();
      
      // Verify that the module uses the custom options
      const providers = moduleRef.get(ErrorsModule).providers;
      const optionsProvider = providers.find(provider => provider.provide === 'ERRORS_MODULE_OPTIONS');
      
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider.useFactory()).toEqual(expect.objectContaining(customOptions));
    });

    it('should only enable specified interceptors based on options', async () => {
      // Arrange
      const customOptions: ErrorsModuleOptions = {
        enableRetry: true,
        enableCircuitBreaker: false,
        enableFallback: true,
        enableTimeout: false
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot(customOptions)],
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const interceptorProviders = providers.filter(provider => provider.provide === APP_INTERCEPTOR);
      
      // Should still have 4 providers, but some will return null
      expect(interceptorProviders).toHaveLength(4);
      
      // Verify that only the enabled interceptors are created
      const logger = new MockLoggerService();
      const tracer = new MockTracingService();
      
      // Test each interceptor factory
      const interceptors = interceptorProviders.map(provider => 
        provider.useFactory(customOptions, logger, tracer)
      );
      
      // Filter out null values (disabled interceptors)
      const validInterceptors = interceptors.filter(i => i !== null);
      
      // Verify we have only 2 interceptors (Retry and Fallback)
      expect(validInterceptors).toHaveLength(2);
      
      // Verify the types of interceptors
      expect(validInterceptors.some(i => i instanceof RetryInterceptor)).toBe(true);
      expect(validInterceptors.some(i => i instanceof FallbackInterceptor)).toBe(true);
      expect(validInterceptors.some(i => i instanceof CircuitBreakerInterceptor)).toBe(false);
      expect(validInterceptors.some(i => i instanceof TimeoutInterceptor)).toBe(false);
    });
  });

  describe('registerAsync', () => {
    it('should register the module with async options', async () => {
      // Arrange
      const asyncOptions = {
        useFactory: () => ({
          enableDetailedErrors: false,
          journeyContext: 'care'
        }),
        inject: []
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.registerAsync(asyncOptions)],
      }).compile();

      // Assert
      expect(moduleRef).toBeDefined();
      
      // Verify that the module uses the async options
      const providers = moduleRef.get(ErrorsModule).providers;
      const optionsProvider = providers.find(provider => provider.provide === 'ERRORS_MODULE_OPTIONS');
      
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider.useFactory).toBe(asyncOptions.useFactory);
      expect(optionsProvider.inject).toBe(asyncOptions.inject);
    });

    it('should inject dependencies into the async factory', async () => {
      // Arrange
      const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'errors.detailedErrors') return false;
          if (key === 'errors.journeyContext') return 'plan';
          return null;
        })
      };

      const asyncOptions = {
        useFactory: (configService: any) => ({
          enableDetailedErrors: configService.get('errors.detailedErrors'),
          journeyContext: configService.get('errors.journeyContext')
        }),
        inject: ['ConfigService']
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.registerAsync(asyncOptions)],
        providers: [
          {
            provide: 'ConfigService',
            useValue: mockConfigService
          }
        ]
      }).compile();

      // Assert
      expect(moduleRef).toBeDefined();
      
      // Verify that the module uses the async options with injected dependencies
      const providers = moduleRef.get(ErrorsModule).providers;
      const optionsProvider = providers.find(provider => provider.provide === 'ERRORS_MODULE_OPTIONS');
      
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider.useFactory).toBe(asyncOptions.useFactory);
      expect(optionsProvider.inject).toEqual(['ConfigService']);
    });
  });

  describe('Environment-specific behavior', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      // Restore the original NODE_ENV after each test
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should enable detailed errors in development environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const optionsProvider = providers.find(provider => provider.provide === 'ERRORS_MODULE_OPTIONS');
      
      expect(optionsProvider).toBeDefined();
      const options = optionsProvider.useFactory();
      expect(options.enableDetailedErrors).toBe(true);
    });

    it('should disable detailed errors in production environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const optionsProvider = providers.find(provider => provider.provide === 'ERRORS_MODULE_OPTIONS');
      
      expect(optionsProvider).toBeDefined();
      const options = optionsProvider.useFactory();
      expect(options.enableDetailedErrors).toBe(false);
    });

    it('should allow overriding environment-specific defaults', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const customOptions: ErrorsModuleOptions = {
        enableDetailedErrors: true // Override the production default
      };

      // Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot(customOptions)],
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const optionsProvider = providers.find(provider => provider.provide === 'ERRORS_MODULE_OPTIONS');
      
      expect(optionsProvider).toBeDefined();
      const options = optionsProvider.useFactory();
      expect(options.enableDetailedErrors).toBe(true);
    });
  });

  describe('Integration with logging and tracing', () => {
    it('should inject LoggerService and TracingService into the GlobalExceptionFilter', async () => {
      // Arrange & Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
        providers: [
          { provide: LoggerService, useClass: MockLoggerService },
          { provide: TracingService, useClass: MockTracingService }
        ]
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const filterProvider = providers.find(provider => provider.provide === APP_FILTER);
      
      expect(filterProvider).toBeDefined();
      expect(filterProvider.inject).toContain(LoggerService);
      expect(filterProvider.inject).toContain(TracingService);
    });

    it('should inject LoggerService and TracingService into all interceptors', async () => {
      // Arrange & Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
        providers: [
          { provide: LoggerService, useClass: MockLoggerService },
          { provide: TracingService, useClass: MockTracingService }
        ]
      }).compile();

      // Assert
      const providers = moduleRef.get(ErrorsModule).providers;
      const interceptorProviders = providers.filter(provider => provider.provide === APP_INTERCEPTOR);
      
      // Verify that all interceptors inject LoggerService and TracingService
      interceptorProviders.forEach(provider => {
        expect(provider.inject).toContain(LoggerService);
        expect(provider.inject).toContain(TracingService);
      });
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain compatibility with the original ExceptionsModule', async () => {
      // Arrange & Act
      const moduleRef = await Test.createTestingModule({
        imports: [ErrorsModule.register()],
      }).compile();

      // Assert
      expect(moduleRef).toBeDefined();
      
      // Verify that the module is global
      const isGlobal = Reflect.getMetadata('__global__', ErrorsModule);
      expect(isGlobal).toBe(true);
      
      // Verify that the module exports the GlobalExceptionFilter
      const providers = moduleRef.get(ErrorsModule).providers;
      const exports = moduleRef.get(ErrorsModule).exports;
      
      // The exports should include all providers
      expect(exports).toEqual(providers);
    });
  });
});