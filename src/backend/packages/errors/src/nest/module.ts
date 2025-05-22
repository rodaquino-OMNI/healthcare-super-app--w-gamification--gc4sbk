import { DynamicModule, Global, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from '@austa/logging';

import { GlobalExceptionFilter } from './filters';
import { 
  CircuitBreakerInterceptor, 
  FallbackInterceptor, 
  RetryInterceptor, 
  TimeoutInterceptor 
} from './interceptors';

/**
 * Configuration options for the ErrorsModule.
 */
export interface ErrorsModuleOptions {
  /**
   * Whether to enable detailed error responses in development mode.
   * When true, error responses will include stack traces and detailed error information.
   * @default process.env.NODE_ENV !== 'production'
   */
  enableDetailedErrors?: boolean;

  /**
   * Whether to enable the global exception filter.
   * @default true
   */
  enableGlobalFilter?: boolean;

  /**
   * Whether to enable the retry interceptor globally.
   * @default false
   */
  enableGlobalRetry?: boolean;

  /**
   * Whether to enable the circuit breaker interceptor globally.
   * @default false
   */
  enableGlobalCircuitBreaker?: boolean;

  /**
   * Whether to enable the fallback interceptor globally.
   * @default false
   */
  enableGlobalFallback?: boolean;

  /**
   * Whether to enable the timeout interceptor globally.
   * @default false
   */
  enableGlobalTimeout?: boolean;

  /**
   * Default timeout in milliseconds for the timeout interceptor.
   * @default 30000 (30 seconds)
   */
  defaultTimeoutMs?: number;

  /**
   * Default retry options for the retry interceptor.
   */
  defaultRetryOptions?: {
    /**
     * Maximum number of retry attempts.
     * @default 3
     */
    maxAttempts?: number;

    /**
     * Base delay in milliseconds between retry attempts.
     * @default 1000 (1 second)
     */
    baseDelayMs?: number;

    /**
     * Whether to use exponential backoff for retries.
     * @default true
     */
    useExponentialBackoff?: boolean;
  };

  /**
   * Default circuit breaker options for the circuit breaker interceptor.
   */
  defaultCircuitBreakerOptions?: {
    /**
     * Failure threshold percentage to trip the circuit.
     * @default 50 (50%)
     */
    failureThresholdPercentage?: number;

    /**
     * Number of requests to consider for the failure threshold.
     * @default 20
     */
    requestVolumeThreshold?: number;

    /**
     * Time in milliseconds to wait before attempting to close the circuit.
     * @default 30000 (30 seconds)
     */
    resetTimeoutMs?: number;
  };
}

/**
 * Interface for the factory that creates ErrorsModuleOptions.
 */
export interface ErrorsModuleOptionsFactory {
  createErrorsOptions(): Promise<ErrorsModuleOptions> | ErrorsModuleOptions;
}

/**
 * Async options for configuring the ErrorsModule.
 */
export interface ErrorsModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Factory function to create the options.
   */
  useFactory?: (...args: any[]) => Promise<ErrorsModuleOptions> | ErrorsModuleOptions;

  /**
   * Dependencies to inject into the factory function.
   */
  inject?: any[];

  /**
   * Class that implements ErrorsModuleOptionsFactory.
   */
  useClass?: Type<ErrorsModuleOptionsFactory>;

  /**
   * Existing provider that implements ErrorsModuleOptionsFactory.
   */
  useExisting?: Type<ErrorsModuleOptionsFactory>;
}

/**
 * Global module that provides error handling capabilities throughout the application.
 * 
 * This module registers the GlobalExceptionFilter and various error handling interceptors,
 * providing a consistent error handling experience across all services.
 * 
 * @example
 * // Basic usage with default options
 * @Module({
 *   imports: [ErrorsModule.forRoot()],
 * })
 * export class AppModule {}
 * 
 * @example
 * // With custom options
 * @Module({
 *   imports: [
 *     ErrorsModule.forRoot({
 *       enableDetailedErrors: true,
 *       enableGlobalRetry: true,
 *       defaultRetryOptions: {
 *         maxAttempts: 5,
 *         baseDelayMs: 500,
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * 
 * @example
 * // With async configuration
 * @Module({
 *   imports: [
 *     ErrorsModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         enableDetailedErrors: configService.get('NODE_ENV') !== 'production',
 *         enableGlobalRetry: configService.get('ENABLE_RETRY') === 'true',
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Global()
@Module({
  imports: [LoggerModule],
  providers: [GlobalExceptionFilter],
  exports: [GlobalExceptionFilter],
})
export class ErrorsModule {
  /**
   * Creates a dynamically configured ErrorsModule with the provided options.
   * 
   * @param options - Configuration options for the ErrorsModule
   * @returns A dynamically configured ErrorsModule
   */
  static forRoot(options: ErrorsModuleOptions = {}): DynamicModule {
    const providers = this.createProviders(options);

    return {
      module: ErrorsModule,
      providers,
      exports: providers,
    };
  }

  /**
   * Creates a dynamically configured ErrorsModule with options provided asynchronously.
   * 
   * @param options - Async configuration options for the ErrorsModule
   * @returns A dynamically configured ErrorsModule
   */
  static forRootAsync(options: ErrorsModuleAsyncOptions): DynamicModule {
    const providers = this.createAsyncProviders(options);

    return {
      module: ErrorsModule,
      imports: options.imports || [],
      providers,
      exports: providers,
    };
  }

  /**
   * Creates providers based on the provided options.
   * 
   * @private
   * @param options - Configuration options for the ErrorsModule
   * @returns An array of providers
   */
  private static createProviders(options: ErrorsModuleOptions): Provider[] {
    const providers: Provider[] = [
      {
        provide: 'ERRORS_MODULE_OPTIONS',
        useValue: this.getDefaultOptions(options),
      },
    ];

    // Always add the GlobalExceptionFilter
    if (options.enableGlobalFilter !== false) {
      providers.push({
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      });
    }

    // Add interceptors based on options
    if (options.enableGlobalRetry) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: RetryInterceptor,
      });
    }

    if (options.enableGlobalCircuitBreaker) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: CircuitBreakerInterceptor,
      });
    }

    if (options.enableGlobalFallback) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: FallbackInterceptor,
      });
    }

    if (options.enableGlobalTimeout) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: TimeoutInterceptor,
      });
    }

    return providers;
  }

  /**
   * Creates providers for async configuration.
   * 
   * @private
   * @param options - Async configuration options for the ErrorsModule
   * @returns An array of providers
   */
  private static createAsyncProviders(options: ErrorsModuleAsyncOptions): Provider[] {
    const providers: Provider[] = [
      ...this.createAsyncOptionsProviders(options),
    ];

    // Add base providers that depend on the options
    providers.push({
      provide: APP_FILTER,
      useFactory: (moduleOptions: ErrorsModuleOptions) => {
        if (moduleOptions.enableGlobalFilter === false) {
          return { catch: () => {} }; // No-op filter
        }
        return new GlobalExceptionFilter(moduleOptions);
      },
      inject: ['ERRORS_MODULE_OPTIONS'],
    });

    // Add conditional interceptors
    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (moduleOptions: ErrorsModuleOptions) => {
        if (moduleOptions.enableGlobalRetry) {
          return new RetryInterceptor(moduleOptions.defaultRetryOptions);
        }
        return { intercept: (context, next) => next.handle() }; // No-op interceptor
      },
      inject: ['ERRORS_MODULE_OPTIONS'],
    });

    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (moduleOptions: ErrorsModuleOptions) => {
        if (moduleOptions.enableGlobalCircuitBreaker) {
          return new CircuitBreakerInterceptor(moduleOptions.defaultCircuitBreakerOptions);
        }
        return { intercept: (context, next) => next.handle() }; // No-op interceptor
      },
      inject: ['ERRORS_MODULE_OPTIONS'],
    });

    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (moduleOptions: ErrorsModuleOptions) => {
        if (moduleOptions.enableGlobalFallback) {
          return new FallbackInterceptor();
        }
        return { intercept: (context, next) => next.handle() }; // No-op interceptor
      },
      inject: ['ERRORS_MODULE_OPTIONS'],
    });

    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (moduleOptions: ErrorsModuleOptions) => {
        if (moduleOptions.enableGlobalTimeout) {
          return new TimeoutInterceptor(moduleOptions.defaultTimeoutMs);
        }
        return { intercept: (context, next) => next.handle() }; // No-op interceptor
      },
      inject: ['ERRORS_MODULE_OPTIONS'],
    });

    return providers;
  }

  /**
   * Creates providers for async options.
   * 
   * @private
   * @param options - Async configuration options for the ErrorsModule
   * @returns An array of providers
   */
  private static createAsyncOptionsProviders(options: ErrorsModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: 'ERRORS_MODULE_OPTIONS',
          useFactory: async (...args: any[]) => {
            const userOptions = await options.useFactory(...args);
            return this.getDefaultOptions(userOptions);
          },
          inject: options.inject || [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
        {
          provide: 'ERRORS_MODULE_OPTIONS',
          useFactory: async (optionsFactory: ErrorsModuleOptionsFactory) => {
            const userOptions = await optionsFactory.createErrorsOptions();
            return this.getDefaultOptions(userOptions);
          },
          inject: [options.useClass],
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: 'ERRORS_MODULE_OPTIONS',
          useFactory: async (optionsFactory: ErrorsModuleOptionsFactory) => {
            const userOptions = await optionsFactory.createErrorsOptions();
            return this.getDefaultOptions(userOptions);
          },
          inject: [options.useExisting],
        },
      ];
    }

    return [];
  }

  /**
   * Merges user options with default options.
   * 
   * @private
   * @param options - User-provided options
   * @returns Merged options with defaults
   */
  private static getDefaultOptions(options: ErrorsModuleOptions): ErrorsModuleOptions {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return {
      enableDetailedErrors: options.enableDetailedErrors ?? isDevelopment,
      enableGlobalFilter: options.enableGlobalFilter ?? true,
      enableGlobalRetry: options.enableGlobalRetry ?? false,
      enableGlobalCircuitBreaker: options.enableGlobalCircuitBreaker ?? false,
      enableGlobalFallback: options.enableGlobalFallback ?? false,
      enableGlobalTimeout: options.enableGlobalTimeout ?? false,
      defaultTimeoutMs: options.defaultTimeoutMs ?? 30000,
      defaultRetryOptions: {
        maxAttempts: options.defaultRetryOptions?.maxAttempts ?? 3,
        baseDelayMs: options.defaultRetryOptions?.baseDelayMs ?? 1000,
        useExponentialBackoff: options.defaultRetryOptions?.useExponentialBackoff ?? true,
      },
      defaultCircuitBreakerOptions: {
        failureThresholdPercentage: options.defaultCircuitBreakerOptions?.failureThresholdPercentage ?? 50,
        requestVolumeThreshold: options.defaultCircuitBreakerOptions?.requestVolumeThreshold ?? 20,
        resetTimeoutMs: options.defaultCircuitBreakerOptions?.resetTimeoutMs ?? 30000,
      },
    };
  }
}