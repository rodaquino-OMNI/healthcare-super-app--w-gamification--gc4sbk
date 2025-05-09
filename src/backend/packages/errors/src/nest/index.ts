/**
 * @module @austa/errors/nest
 * 
 * This module provides NestJS-specific error handling components for the AUSTA SuperApp.
 * It includes filters, interceptors, decorators, and a module for integrating the error
 * handling framework with NestJS applications.
 * 
 * The components are organized by category for better discoverability and usage:
 * - Filters: For global exception handling
 * - Interceptors: For request pipeline error handling
 * - Decorators: For declarative error handling configuration
 * - Module: For NestJS integration
 */

/**
 * Re-export all filters from the filters module
 * @example
 * // Import the GlobalExceptionFilter
 * import { GlobalExceptionFilter } from '@austa/errors/nest';
 * 
 * // Use in your NestJS application
 * app.useGlobalFilters(new GlobalExceptionFilter());
 */
export * from './filters';

/**
 * Re-export all interceptors from the interceptors module
 * @example
 * // Import specific interceptors
 * import { RetryInterceptor, CircuitBreakerInterceptor } from '@austa/errors/nest';
 * 
 * // Use in your NestJS controller
 * @UseInterceptors(RetryInterceptor)
 * export class MyController {}
 */
export * from './interceptors';

/**
 * Re-export all decorators from the decorators module
 * @example
 * // Import decorators
 * import { Retry, CircuitBreaker, Fallback } from '@austa/errors/nest';
 * 
 * // Use in your NestJS controller method
 * @Retry({ attempts: 3, delay: 1000 })
 * @CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
 * @Fallback(fallbackMethod)
 * async getDataFromExternalService() {}
 */
export * from './decorators';

/**
 * Re-export the ErrorsModule for NestJS integration
 * @example
 * // Import the ErrorsModule
 * import { ErrorsModule } from '@austa/errors/nest';
 * 
 * // Use in your NestJS application module
 * @Module({
 *   imports: [
 *     ErrorsModule.forRoot({
 *       logErrors: true,
 *       includeStacktrace: process.env.NODE_ENV !== 'production',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
export * from './module';

/**
 * Convenience export of commonly used components
 * This allows importing multiple components with a single import statement
 */
import { GlobalExceptionFilter } from './filters';
import { RetryInterceptor, CircuitBreakerInterceptor, FallbackInterceptor, TimeoutInterceptor } from './interceptors';
import { Retry, CircuitBreaker, Fallback, ErrorBoundary, TimeoutConfig } from './decorators';
import { ErrorsModule } from './module';

/**
 * Pre-configured error handling bundle for quick setup
 * @example
 * // Import the error handling bundle
 * import { ErrorHandlingBundle } from '@austa/errors/nest';
 * 
 * // Use in your NestJS application
 * const app = await NestFactory.create(AppModule);
 * ErrorHandlingBundle.applyToApp(app);
 */
export const ErrorHandlingBundle = {
  filters: {
    GlobalExceptionFilter,
  },
  interceptors: {
    RetryInterceptor,
    CircuitBreakerInterceptor,
    FallbackInterceptor,
    TimeoutInterceptor,
  },
  decorators: {
    Retry,
    CircuitBreaker,
    Fallback,
    ErrorBoundary,
    TimeoutConfig,
  },
  module: ErrorsModule,
  
  /**
   * Apply all error handling components to a NestJS application
   * @param app - The NestJS application instance
   * @param options - Configuration options
   */
  applyToApp: (app, options = {}) => {
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(
      new TimeoutInterceptor(),
      new RetryInterceptor(),
      new CircuitBreakerInterceptor(),
      new FallbackInterceptor()
    );
    return app;
  },
};