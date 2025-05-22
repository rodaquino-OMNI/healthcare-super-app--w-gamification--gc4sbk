/**
 * @austa/errors
 * 
 * Comprehensive error handling framework for the AUSTA SuperApp, providing
 * standardized error classes, journey-specific error types, utility functions,
 * and integration with NestJS and Express applications.
 * 
 * This package implements a robust error classification system with support for
 * retry policies, circuit breakers, fallback strategies, and consistent error
 * formatting across all services.
 */

// Core error types and base classes
export * from './base';
export * from './types';
export * from './constants';

/**
 * Category-specific error classes organized by error type.
 * 
 * @example
 * // Import validation errors
 * import { MissingParameterError, InvalidParameterError } from '@austa/errors';
 * 
 * // Use in your code
 * throw new MissingParameterError('userId');
 */
export * from './categories';

/**
 * Journey-specific error classes organized by journey type.
 * 
 * These errors provide specialized error handling for each journey's unique domains
 * and can be imported directly or through their respective namespaces.
 * 
 * @example
 * // Direct import
 * import { AppointmentNotFoundError } from '@austa/errors';
 * 
 * // Namespace import
 * import { Care, Health, Plan } from '@austa/errors';
 * throw new Care.AppointmentNotFoundError('123');
 */
export * from './journey';

/**
 * Error handling decorators for implementing resilience patterns.
 * 
 * @example
 * import { Retry, CircuitBreaker } from '@austa/errors/decorators';
 * 
 * class UserService {
 *   @Retry({ attempts: 3, delay: 1000 })
 *   async getUser(id: string) {
 *     // Method implementation
 *   }
 * }
 */
export * as decorators from './decorators';

/**
 * Express middleware for error handling outside of NestJS.
 * 
 * @example
 * import { errorHandler } from '@austa/errors/middleware';
 * 
 * const app = express();
 * app.use(errorHandler());
 */
export * as middleware from './middleware';

/**
 * NestJS integration components including filters, interceptors, and module.
 * 
 * @example
 * import { ErrorsModule } from '@austa/errors/nest';
 * 
 * @Module({
 *   imports: [ErrorsModule.forRoot()],
 * })
 * export class AppModule {}
 */
export * as nest from './nest';

/**
 * Utility functions for error handling, formatting, and resilience patterns.
 * 
 * @example
 * import { retryWithBackoff } from '@austa/errors/utils';
 * 
 * await retryWithBackoff(async () => {
 *   // Operation that might fail
 * }, { attempts: 3, initialDelay: 1000 });
 */
export * as utils from './utils';

// Namespace exports for journey-specific errors
import * as Health from './journey/health';
import * as Care from './journey/care';
import * as Plan from './journey/plan';

// Re-export journey namespaces
export { Health, Care, Plan };