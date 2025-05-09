import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule, LoggerService } from '@austa/logging';
import { TracingModule, TracingService } from '@austa/tracing';

// Import filters and interceptors
import { GlobalExceptionFilter } from './filters';
import {
  RetryInterceptor,
  CircuitBreakerInterceptor,
  FallbackInterceptor,
  TimeoutInterceptor
} from './interceptors';

/**
 * Configuration options for the ErrorsModule
 */
export interface ErrorsModuleOptions {
  /**
   * Enable detailed error messages in responses (defaults to false in production)
   */
  enableDetailedErrors?: boolean;
  
  /**
   * Enable automatic retry for transient errors (defaults to true)
   */
  enableRetry?: boolean;
  
  /**
   * Enable circuit breaker for external dependencies (defaults to true)
   */
  enableCircuitBreaker?: boolean;
  
  /**
   * Enable fallback strategies for recoverable errors (defaults to true)
   */
  enableFallback?: boolean;
  
  /**
   * Enable request timeout handling (defaults to true)
   */
  enableTimeout?: boolean;
  
  /**
   * Default timeout in milliseconds for requests (defaults to 30000)
   */
  defaultTimeoutMs?: number;
  
  /**
   * Journey context to include in error responses
   */
  journeyContext?: 'health' | 'care' | 'plan' | 'all';
  
  /**
   * Maximum number of retries for transient errors (defaults to 3)
   */
  maxRetries?: number;
  
  /**
   * Base delay in milliseconds for exponential backoff (defaults to 300)
   */
  retryDelayMs?: number;
  
  /**
   * Circuit breaker failure threshold percentage (defaults to 50)
   */
  circuitBreakerFailureThreshold?: number;
  
  /**
   * Circuit breaker reset timeout in milliseconds (defaults to 30000)
   */
  circuitBreakerResetTimeoutMs?: number;
}

/**
 * Default configuration for the ErrorsModule
 */
const defaultOptions: ErrorsModuleOptions = {
  enableDetailedErrors: process.env.NODE_ENV !== 'production',
  enableRetry: true,
  enableCircuitBreaker: true,
  enableFallback: true,
  enableTimeout: true,
  defaultTimeoutMs: 30000,
  journeyContext: 'all',
  maxRetries: 3,
  retryDelayMs: 300,
  circuitBreakerFailureThreshold: 50,
  circuitBreakerResetTimeoutMs: 30000
};

/**
 * Global module that provides error handling capabilities across the application.
 * 
 * This module registers the GlobalExceptionFilter and various error interceptors
 * to provide consistent error handling, retry policies, circuit breaking, and
 * fallback strategies throughout the AUSTA SuperApp.
 * 
 * @example
 * // Register with default options
 * @Module({
 *   imports: [ErrorsModule.register()]
 * })
 * export class AppModule {}
 * 
 * @example
 * // Register with custom options
 * @Module({
 *   imports: [
 *     ErrorsModule.register({
 *       enableDetailedErrors: true,
 *       journeyContext: 'health'
 *     })
 *   ]
 * })
 * export class AppModule {}
 */
@Global()
@Module({
  imports: [LoggerModule, TracingModule],
})
export class ErrorsModule {
  /**
   * Register the ErrorsModule with default options
   */
  static register(): DynamicModule {
    return this.registerAsync({
      useFactory: () => defaultOptions,
    });
  }

  /**
   * Register the ErrorsModule with custom options
   * 
   * @param options Configuration options for the ErrorsModule
   */
  static forRoot(options: ErrorsModuleOptions = {}): DynamicModule {
    return this.registerAsync({
      useFactory: () => ({ ...defaultOptions, ...options }),
    });
  }

  /**
   * Register the ErrorsModule with async options
   * 
   * @param asyncOptions Async configuration options for the ErrorsModule
   */
  static registerAsync(asyncOptions: {
    useFactory: (...args: any[]) => ErrorsModuleOptions | Promise<ErrorsModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'ERRORS_MODULE_OPTIONS',
        useFactory: asyncOptions.useFactory,
        inject: asyncOptions.inject || [],
      },
      {
        provide: APP_FILTER,
        useFactory: (options: ErrorsModuleOptions, logger: LoggerService, tracer: TracingService) => {
          return new GlobalExceptionFilter(options, logger, tracer);
        },
        inject: ['ERRORS_MODULE_OPTIONS', LoggerService, TracingService],
      },
    ];

    // Add interceptors based on configuration
    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (options: ErrorsModuleOptions, logger: LoggerService, tracer: TracingService) => {
        if (options.enableRetry !== false) {
          return new RetryInterceptor(options, logger, tracer);
        }
        return null;
      },
      inject: ['ERRORS_MODULE_OPTIONS', LoggerService, TracingService],
    });

    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (options: ErrorsModuleOptions, logger: LoggerService, tracer: TracingService) => {
        if (options.enableCircuitBreaker !== false) {
          return new CircuitBreakerInterceptor(options, logger, tracer);
        }
        return null;
      },
      inject: ['ERRORS_MODULE_OPTIONS', LoggerService, TracingService],
    });

    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (options: ErrorsModuleOptions, logger: LoggerService, tracer: TracingService) => {
        if (options.enableFallback !== false) {
          return new FallbackInterceptor(options, logger, tracer);
        }
        return null;
      },
      inject: ['ERRORS_MODULE_OPTIONS', LoggerService, TracingService],
    });

    providers.push({
      provide: APP_INTERCEPTOR,
      useFactory: (options: ErrorsModuleOptions, logger: LoggerService, tracer: TracingService) => {
        if (options.enableTimeout !== false) {
          return new TimeoutInterceptor(options, logger, tracer);
        }
        return null;
      },
      inject: ['ERRORS_MODULE_OPTIONS', LoggerService, TracingService],
    })
    }

    return {
      module: ErrorsModule,
      providers,
      exports: providers,
    };
  }
}