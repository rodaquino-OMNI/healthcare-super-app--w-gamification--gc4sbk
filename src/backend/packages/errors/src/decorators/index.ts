/**
 * @file Barrel file exporting all error handling decorators from the @austa/errors package.
 * This file provides a central export point for all decorators, organized by resilience pattern category.
 */

// Re-export all types used by decorators
export * from './types';

/**
 * Retry Pattern Decorators
 * These decorators implement automatic retry logic for transient errors.
 */

/**
 * Decorator that retries a method a specified number of times when it throws an error.
 * Uses a configurable delay between retries and supports filtering which errors trigger retries.
 * 
 * @example
 * ```typescript
 * @Retry({ maxAttempts: 3 })
 * async fetchUserData(userId: string): Promise<UserData> {
 *   // This method will be retried up to 3 times if it throws an error
 *   return this.userService.getData(userId);
 * }
 * ```
 */
export { Retry } from './retry.decorator';

/**
 * Decorator that retries a method with exponential backoff when it throws an error.
 * Increases delay between retries exponentially to prevent overwhelming the system.
 * 
 * @example
 * ```typescript
 * @RetryWithBackoff({
 *   maxAttempts: 5,
 *   baseDelay: 1000,
 *   maxDelay: 30000,
 *   retryableErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 * })
 * async processPayment(paymentId: string): Promise<PaymentResult> {
 *   // This method will be retried with increasing delays if it throws specific errors
 *   return this.paymentGateway.process(paymentId);
 * }
 * ```
 */
export { RetryWithBackoff } from './retry.decorator';

/**
 * Circuit Breaker Pattern Decorators
 * These decorators implement the circuit breaker pattern to prevent cascading failures.
 */

/**
 * Decorator that implements the Circuit Breaker pattern to prevent repeated calls to failing services.
 * Tracks failure rates and automatically stops calling the underlying method when it fails too often.
 * 
 * @example
 * ```typescript
 * @CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 *   failureErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 * })
 * async getExternalServiceData(id: string): Promise<ExternalData> {
 *   // This method will be blocked from execution if it fails too many times
 *   return this.externalService.fetchData(id);
 * }
 * ```
 */
export { 
  CircuitBreaker, 
  WithCircuitBreaker, 
  ExternalServiceCircuitBreaker, 
  DatabaseCircuitBreaker,
  CircuitOpenError,
  getCircuitBreakerState,
  resetCircuitBreaker,
  openCircuitBreaker,
  getAllCircuitBreakerStates
} from './circuit-breaker.decorator';

/**
 * Fallback Pattern Decorators
 * These decorators implement fallback strategies when method calls fail.
 */

/**
 * Decorator that provides a fallback function to execute when the original method fails.
 * Allows graceful degradation by executing alternative logic when the primary method fails.
 * 
 * @example
 * ```typescript
 * @WithFallback({
 *   fallbackFn: (error, userId) => ({ name: 'Unknown User', id: userId }),
 *   fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 * })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // If this method fails, the fallback function will be called instead
 *   return this.userService.getProfile(userId);
 * }
 * ```
 */
export { WithFallback } from './fallback.decorator';

/**
 * Decorator that returns cached results when a method fails.
 * Useful for maintaining service availability during dependency failures.
 * 
 * @example
 * ```typescript
 * @CachedFallback({
 *   ttl: 300000, // 5 minutes
 *   defaultValue: [],
 *   fallbackErrors: [ErrorType.EXTERNAL]
 * })
 * async getRecommendations(userId: string): Promise<Recommendation[]> {
 *   // If this method fails, the last successful result will be returned
 *   return this.recommendationService.getForUser(userId);
 * }
 * ```
 */
export { CachedFallback } from './fallback.decorator';

/**
 * Decorator that returns a default value when a method fails.
 * Simplest fallback strategy for non-critical operations.
 * 
 * @example
 * ```typescript
 * @DefaultFallback({
 *   defaultValue: [],
 *   fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 * })
 * async getNotifications(): Promise<Notification[]> {
 *   // If this method fails, an empty array will be returned
 *   return this.notificationService.getActiveNotifications();
 * }
 * ```
 */
export { DefaultFallback } from './fallback.decorator';

/**
 * Error Context and Classification Decorators
 * These decorators enhance errors with additional context and classification.
 */

/**
 * Decorator that adds execution context to errors thrown by a method.
 * Enriches errors with journey context, user ID, operation name, and other metadata.
 * 
 * @example
 * ```typescript
 * @WithErrorContext({
 *   journey: 'health',
 *   operation: 'recordMetric',
 *   resource: 'HealthMetric',
 *   getUserId: (userId) => userId
 * })
 * async recordHealthMetric(userId: string, metric: HealthMetric): Promise<void> {
 *   // Errors thrown by this method will include the specified context
 *   await this.healthService.saveMetric(userId, metric);
 * }
 * ```
 */
export { WithErrorContext } from './error-context.decorator';

/**
 * Decorator that automatically classifies uncaught errors into appropriate ErrorTypes.
 * Helps maintain consistent error categorization across the application.
 * 
 * @example
 * ```typescript
 * @ClassifyError({
 *   defaultType: ErrorType.TECHNICAL,
 *   errorTypeMappings: {
 *     'NotFoundException': ErrorType.NOT_FOUND,
 *     'ValidationError': ErrorType.VALIDATION
 *   }
 * })
 * async getUserById(id: string): Promise<User> {
 *   // Errors thrown by this method will be classified based on their type
 *   return this.userRepository.findById(id);
 * }
 * ```
 */
export { ClassifyError } from './error-context.decorator';

/**
 * Decorator that transforms errors thrown by a method into different error types.
 * Useful for converting low-level errors into domain-specific exceptions.
 * 
 * @example
 * ```typescript
 * @TransformError({
 *   transformFn: (error) => new UserNotFoundException('User not found', { cause: error }),
 *   transformErrors: [ErrorType.NOT_FOUND]
 * })
 * async getUserById(id: string): Promise<User> {
 *   // NotFoundExceptions will be transformed into UserNotFoundExceptions
 *   return this.userRepository.findById(id);
 * }
 * ```
 */
export { TransformError } from './error-context.decorator';

/**
 * Composite Resilience Pattern Decorators
 * These decorators combine multiple resilience patterns into a single decorator.
 */

/**
 * Composite decorator that combines retry, circuit breaker, and fallback patterns.
 * Provides a comprehensive solution for making method calls resilient against various failure modes.
 * 
 * @example
 * ```typescript
 * @Resilient({
 *   retry: { maxAttempts: 3, backoffStrategy: BackoffStrategy.EXPONENTIAL },
 *   circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 },
 *   fallback: { fallbackFn: (error, id) => ({ id, status: 'unavailable' }) },
 *   errorContext: { journey: 'care', operation: 'getAppointment' }
 * })
 * async getAppointment(id: string): Promise<Appointment> {
 *   // This method has comprehensive resilience against failures
 *   return this.appointmentService.findById(id);
 * }
 * ```
 */
export { Resilient } from './resilient.decorator';