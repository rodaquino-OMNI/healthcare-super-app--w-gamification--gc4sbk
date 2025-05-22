/**
 * @module @austa/errors/nest
 * @description
 * This module provides NestJS-specific error handling components for the AUSTA SuperApp.
 * It includes exception filters, interceptors, decorators, and a module for easy integration
 * with NestJS applications.
 *
 * The error handling framework implements comprehensive strategies for different error types:
 * - Client errors (4xx): Invalid input, authentication issues
 * - System errors (5xx): Internal failures, database errors
 * - Transient errors: Network timeouts, temporary unavailability
 * - External dependency errors: Third-party system failures
 *
 * @example
 * // Import and register the ErrorsModule in your NestJS application
 * import { ErrorsModule } from '@austa/errors/nest';
 *
 * @Module({
 *   imports: [ErrorsModule.forRoot()],
 * })
 * export class AppModule {}
 */

/**
 * Exception filters for global error handling in NestJS applications.
 * These filters capture unhandled exceptions, map them to appropriate HTTP responses,
 * and provide structured logging and error reporting.
 *
 * @example
 * // Apply the GlobalExceptionFilter to your entire application
 * import { GlobalExceptionFilter } from '@austa/errors/nest';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalFilters(new GlobalExceptionFilter());
 *   await app.listen(3000);
 * }
 */
export * from './filters';

/**
 * Interceptors for implementing error recovery strategies in NestJS applications.
 * These interceptors provide capabilities such as retry with exponential backoff,
 * circuit breaking for failing dependencies, fallback execution, and request timeout management.
 *
 * @example
 * // Apply the RetryInterceptor to a controller or handler
 * import { RetryInterceptor } from '@austa/errors/nest';
 *
 * @Controller('users')
 * @UseInterceptors(RetryInterceptor)
 * export class UsersController {}
 */
export * from './interceptors';

/**
 * Decorators for declarative error handling in NestJS applications.
 * These decorators enable developers to define retry policies, circuit breaker configurations,
 * fallback strategies, and error boundaries directly on controller methods or classes.
 *
 * @example
 * // Apply the Retry decorator to a controller method
 * import { Retry } from '@austa/errors/nest';
 *
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   @Retry({ attempts: 3, delay: 1000 })
 *   findAll() {
 *     return this.usersService.findAll();
 *   }
 * }
 */
export * from './decorators';

/**
 * The ErrorsModule for NestJS integration that registers all error handling components
 * globally throughout the application. This module serves as the entry point for the
 * error handling framework in NestJS applications.
 *
 * @example
 * // Register the ErrorsModule with custom configuration
 * import { ErrorsModule } from '@austa/errors/nest';
 *
 * @Module({
 *   imports: [
 *     ErrorsModule.forRoot({
 *       enableGlobalFilters: true,
 *       defaultRetryAttempts: 3,
 *       defaultTimeout: 5000,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
export * from './module';