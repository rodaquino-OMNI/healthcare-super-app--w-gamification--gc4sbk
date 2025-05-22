import { Test, TestingModule } from '@nestjs/testing';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from '@austa/logging';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ErrorsModule, ErrorsModuleOptions } from '../../../src/nest/module';
import { GlobalExceptionFilter } from '../../../src/nest/filters';
import {
  CircuitBreakerInterceptor,
  FallbackInterceptor,
  RetryInterceptor,
  TimeoutInterceptor
} from '../../../src/nest/interceptors';

// Mock implementation of LoggerModule
jest.mock('@austa/logging', () => ({
  LoggerModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class MockLoggerModule {},
      providers: [],
      exports: [],
    }),
  },
}));

// Mock implementation of the interceptors
jest.mock('../../../src/nest/interceptors', () => ({
  RetryInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn(),
  })),
  CircuitBreakerInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn(),
  })),
  FallbackInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn(),
  })),
  TimeoutInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn(),
  })),
}));

// Mock implementation of the filter
jest.mock('../../../src/nest/filters', () => ({
  GlobalExceptionFilter: jest.fn().mockImplementation(() => ({
    catch: jest.fn(),
  })),
}));

// Helper class for testing async options
class TestErrorsOptionsFactory {
  createErrorsOptions(): ErrorsModuleOptions {
    return {
      enableDetailedErrors: true,
      enableGlobalRetry: true,
      defaultRetryOptions: {
        maxAttempts: 5,
      },
    };
  }
}

describe('ErrorsModule', () => {
  // Store original environment
  const originalEnv = process.env.NODE_ENV;

  // Reset mocks and environment after each test
  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('forRoot', () => {
    it('should register the module with default options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot()],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Verify the GlobalExceptionFilter was registered
      const appFilter = module.get<any>(APP_FILTER);
      expect(appFilter).toBeDefined();
      expect(GlobalExceptionFilter).toHaveBeenCalled();

      // Verify no interceptors were registered by default
      expect(() => module.get(APP_INTERCEPTOR)).toThrow();
    });

    it('should register the module with custom options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot({
          enableDetailedErrors: true,
          enableGlobalRetry: true,
          enableGlobalCircuitBreaker: true,
          enableGlobalFallback: true,
          enableGlobalTimeout: true,
          defaultTimeoutMs: 5000,
          defaultRetryOptions: {
            maxAttempts: 5,
            baseDelayMs: 500,
          },
          defaultCircuitBreakerOptions: {
            failureThresholdPercentage: 30,
            requestVolumeThreshold: 10,
          },
        })],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Verify the GlobalExceptionFilter was registered
      const appFilter = module.get<any>(APP_FILTER);
      expect(appFilter).toBeDefined();
      expect(GlobalExceptionFilter).toHaveBeenCalled();

      // Verify all interceptors were registered
      const interceptors = module.get<any[]>(APP_INTERCEPTOR, { isNotFoundError: false });
      expect(interceptors).toHaveLength(4); // All 4 interceptors should be registered

      // Verify each interceptor was called with the correct options
      expect(RetryInterceptor).toHaveBeenCalledWith(expect.objectContaining({
        maxAttempts: 5,
        baseDelayMs: 500,
      }));

      expect(CircuitBreakerInterceptor).toHaveBeenCalledWith(expect.objectContaining({
        failureThresholdPercentage: 30,
        requestVolumeThreshold: 10,
      }));

      expect(FallbackInterceptor).toHaveBeenCalled();
      expect(TimeoutInterceptor).toHaveBeenCalledWith(5000);
    });

    it('should disable the global filter when enableGlobalFilter is false', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot({
          enableGlobalFilter: false,
        })],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Verify the GlobalExceptionFilter was not registered
      expect(() => module.get(APP_FILTER)).toThrow();
    });

    it('should use development settings in non-production environment', async () => {
      // Set environment to development
      process.env.NODE_ENV = 'development';

      const module: TestingModule = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot()],
      }).compile();

      // Get the options provider
      const optionsProvider = module.get('ERRORS_MODULE_OPTIONS');
      
      // Verify detailed errors are enabled in development
      expect(optionsProvider.enableDetailedErrors).toBe(true);
    });

    it('should use production settings in production environment', async () => {
      // Set environment to production
      process.env.NODE_ENV = 'production';

      const module: TestingModule = await Test.createTestingModule({
        imports: [ErrorsModule.forRoot()],
      }).compile();

      // Get the options provider
      const optionsProvider = module.get('ERRORS_MODULE_OPTIONS');
      
      // Verify detailed errors are disabled in production
      expect(optionsProvider.enableDetailedErrors).toBe(false);
    });
  });

  describe('forRootAsync', () => {
    it('should register the module with useFactory', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          ErrorsModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              enableDetailedErrors: true,
              enableGlobalRetry: true,
            }),
            inject: [ConfigService],
          }),
        ],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Get the options provider
      const optionsProvider = module.get('ERRORS_MODULE_OPTIONS');
      
      // Verify options were set correctly
      expect(optionsProvider.enableDetailedErrors).toBe(true);
      expect(optionsProvider.enableGlobalRetry).toBe(true);
    });

    it('should register the module with useClass', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ErrorsModule.forRootAsync({
            useClass: TestErrorsOptionsFactory,
          }),
        ],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Get the options provider
      const optionsProvider = module.get('ERRORS_MODULE_OPTIONS');
      
      // Verify options were set correctly
      expect(optionsProvider.enableDetailedErrors).toBe(true);
      expect(optionsProvider.enableGlobalRetry).toBe(true);
      expect(optionsProvider.defaultRetryOptions.maxAttempts).toBe(5);
    });

    it('should register the module with useExisting', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TestErrorsOptionsFactory],
        imports: [
          ErrorsModule.forRootAsync({
            useExisting: TestErrorsOptionsFactory,
          }),
        ],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Get the options provider
      const optionsProvider = module.get('ERRORS_MODULE_OPTIONS');
      
      // Verify options were set correctly
      expect(optionsProvider.enableDetailedErrors).toBe(true);
      expect(optionsProvider.enableGlobalRetry).toBe(true);
      expect(optionsProvider.defaultRetryOptions.maxAttempts).toBe(5);
    });

    it('should register conditional providers based on options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ErrorsModule.forRootAsync({
            useFactory: () => ({
              enableGlobalFilter: true,
              enableGlobalRetry: true,
              enableGlobalCircuitBreaker: false,
              enableGlobalFallback: true,
              enableGlobalTimeout: false,
            }),
          }),
        ],
      }).compile();

      // Verify the module was created
      expect(module).toBeDefined();

      // Get all APP_INTERCEPTOR providers
      const interceptors = module.get<any[]>(APP_INTERCEPTOR, { isNotFoundError: false });
      
      // Should have 3 interceptors (no-op ones for circuit breaker and timeout, and real one for retry)
      expect(interceptors).toHaveLength(3);

      // Verify the filter was registered
      const filter = module.get<any>(APP_FILTER);
      expect(filter).toBeDefined();
    });
  });

  describe('Integration with LoggerModule', () => {
    it('should import LoggerModule', async () => {
      // Create the module
      await Test.createTestingModule({
        imports: [ErrorsModule.forRoot()],
      }).compile();

      // Verify LoggerModule.forRoot was called
      expect(LoggerModule.forRoot).toHaveBeenCalled();
    });
  });
});