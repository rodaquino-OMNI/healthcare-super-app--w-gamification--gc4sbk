import { ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { ErrorType } from '../../src/types';
import { BaseError } from '../../src/base';

/**
 * Interface for recorded error information
 */
export interface RecordedError {
  error: Error;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for mock filter configuration
 */
export interface MockFilterConfig {
  shouldRethrow?: boolean;
  transformError?: (error: Error) => Error;
  statusCodeOverride?: Record<string, HttpStatus>;
  journeyContext?: string;
}

/**
 * Interface for mock interceptor configuration
 */
export interface MockInterceptorConfig {
  shouldRetry?: boolean;
  maxRetries?: number;
  shouldFallback?: boolean;
  fallbackValue?: any;
  shouldBreakCircuit?: boolean;
  circuitOpenDuration?: number;
  shouldTimeout?: boolean;
  timeoutMs?: number;
}

/**
 * Mock implementation of a NestJS exception filter for testing
 * Captures errors and provides methods to inspect them
 */
export class MockExceptionFilter implements ExceptionFilter {
  private errors: RecordedError[] = [];
  private config: MockFilterConfig;

  constructor(config: MockFilterConfig = {}) {
    this.config = {
      shouldRethrow: false,
      ...config
    };
  }

  catch(exception: Error, host: ArgumentsHost): any {
    // Record the error
    this.errors.push({
      error: exception,
      timestamp: new Date(),
      context: this.config.journeyContext,
      metadata: {
        hostType: host.getType()
      }
    });

    // Create response object for HTTP context
    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errorResponse: any;

      // Handle different types of exceptions
      if (exception instanceof BaseError) {
        errorResponse = exception.toJSON();
        statusCode = this.getStatusCodeFromErrorType(exception.type);
      } 
      else if (exception instanceof HttpException) {
        statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        
        errorResponse = {
          error: {
            ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
            type: this.getErrorTypeFromStatus(statusCode)
          }
        };
      } 
      else {
        errorResponse = {
          error: {
            type: ErrorType.TECHNICAL,
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            details: {
              name: exception.name,
              message: exception.message
            }
          }
        };
      }

      // Apply status code overrides if configured
      if (this.config.statusCodeOverride && errorResponse.error?.code) {
        const code = errorResponse.error.code;
        if (this.config.statusCodeOverride[code]) {
          statusCode = this.config.statusCodeOverride[code];
        }
      }

      // Transform error if configured
      if (this.config.transformError) {
        const transformedError = this.config.transformError(exception);
        if (transformedError !== exception) {
          errorResponse = transformedError instanceof BaseError 
            ? transformedError.toJSON() 
            : { error: { message: transformedError.message } };
        }
      }

      // Rethrow if configured
      if (this.config.shouldRethrow) {
        throw exception;
      }

      // Send the response
      return response.status(statusCode).json(errorResponse);
    }

    // For non-HTTP contexts, just rethrow
    throw exception;
  }

  /**
   * Maps error types to HTTP status codes
   */
  private getStatusCodeFromErrorType(type: ErrorType): HttpStatus {
    switch (type) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.BUSINESS:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Maps HTTP status codes to error types
   */
  private getErrorTypeFromStatus(status: HttpStatus): ErrorType {
    if (status >= 400 && status < 500) {
      if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
        return ErrorType.BUSINESS;
      }
      return ErrorType.VALIDATION;
    } else if (status >= 500) {
      if (status === HttpStatus.BAD_GATEWAY || 
          status === HttpStatus.SERVICE_UNAVAILABLE || 
          status === HttpStatus.GATEWAY_TIMEOUT) {
        return ErrorType.EXTERNAL;
      }
      return ErrorType.TECHNICAL;
    }
    return ErrorType.TECHNICAL;
  }

  /**
   * Get all recorded errors
   */
  getErrors(): RecordedError[] {
    return [...this.errors];
  }

  /**
   * Get the most recent error
   */
  getLastError(): RecordedError | undefined {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : undefined;
  }

  /**
   * Clear all recorded errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Update the filter configuration
   */
  updateConfig(config: Partial<MockFilterConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

/**
 * Mock implementation of a retry interceptor for testing
 */
export class MockRetryInterceptor implements NestInterceptor {
  private errors: RecordedError[] = [];
  private retryAttempts: Record<string, number> = {};
  private config: MockInterceptorConfig;

  constructor(config: MockInterceptorConfig = {}) {
    this.config = {
      shouldRetry: true,
      maxRetries: 3,
      ...config
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestId = this.getRequestId(context);
    
    // Initialize retry counter for this request
    if (!this.retryAttempts[requestId]) {
      this.retryAttempts[requestId] = 0;
    }

    return next.handle().pipe(
      // Catch errors and apply retry logic
      (source) => new Observable(observer => {
        const subscription = source.subscribe({
          next: (value) => {
            // Reset retry counter on success
            delete this.retryAttempts[requestId];
            observer.next(value);
            observer.complete();
          },
          error: (err) => {
            // Record the error
            this.errors.push({
              error: err,
              timestamp: new Date(),
              context: context.getClass().name,
              metadata: {
                requestId,
                retryAttempt: this.retryAttempts[requestId]
              }
            });

            // Check if we should retry
            if (this.config.shouldRetry && this.retryAttempts[requestId] < this.config.maxRetries) {
              this.retryAttempts[requestId]++;
              // In a real implementation, we would add delay with exponential backoff
              // For testing, we just retry immediately
              const retrySubscription = next.handle().subscribe({
                next: (value) => {
                  observer.next(value);
                  observer.complete();
                },
                error: (retryErr) => {
                  // If retry also fails, propagate the error
                  observer.error(retryErr);
                }
              });

              return () => {
                retrySubscription.unsubscribe();
              };
            } else {
              // Max retries reached or retry disabled, propagate the error
              observer.error(err);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      })
    );
  }

  private getRequestId(context: ExecutionContext): string {
    // Generate a unique ID for the request based on context
    const req = context.switchToHttp().getRequest();
    return req.id || `${context.getClass().name}-${context.getHandler().name}-${Date.now()}`;
  }

  /**
   * Get all recorded errors
   */
  getErrors(): RecordedError[] {
    return [...this.errors];
  }

  /**
   * Clear all recorded errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Update the interceptor configuration
   */
  updateConfig(config: Partial<MockInterceptorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

/**
 * Mock implementation of a circuit breaker interceptor for testing
 */
export class MockCircuitBreakerInterceptor implements NestInterceptor {
  private errors: RecordedError[] = [];
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private config: MockInterceptorConfig;

  constructor(config: MockInterceptorConfig = {}) {
    this.config = {
      shouldBreakCircuit: true,
      circuitOpenDuration: 30000, // 30 seconds
      ...config
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if circuit is open
    if (this.circuitState === 'OPEN') {
      // Check if circuit open duration has elapsed
      if (this.lastFailureTime && 
          (new Date().getTime() - this.lastFailureTime.getTime() > this.config.circuitOpenDuration)) {
        // Transition to half-open state
        this.circuitState = 'HALF_OPEN';
      } else {
        // Circuit is open, fail fast
        const error = new Error('Circuit is open');
        this.errors.push({
          error,
          timestamp: new Date(),
          context: context.getClass().name,
          metadata: {
            circuitState: this.circuitState,
            failureCount: this.failureCount
          }
        });
        return throwError(() => error);
      }
    }

    return next.handle().pipe(
      // Catch errors and apply circuit breaker logic
      (source) => new Observable(observer => {
        const subscription = source.subscribe({
          next: (value) => {
            // Success, reset failure count if in half-open state
            if (this.circuitState === 'HALF_OPEN') {
              this.circuitState = 'CLOSED';
              this.failureCount = 0;
            }
            observer.next(value);
            observer.complete();
          },
          error: (err) => {
            // Record the error
            this.errors.push({
              error: err,
              timestamp: new Date(),
              context: context.getClass().name,
              metadata: {
                circuitState: this.circuitState,
                failureCount: this.failureCount
              }
            });

            // Increment failure count
            this.failureCount++;
            this.lastFailureTime = new Date();

            // Check if we should open the circuit
            if (this.config.shouldBreakCircuit && 
                (this.circuitState === 'CLOSED' && this.failureCount >= 5) || 
                this.circuitState === 'HALF_OPEN') {
              this.circuitState = 'OPEN';
            }

            // Propagate the error
            observer.error(err);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      })
    );
  }

  /**
   * Get all recorded errors
   */
  getErrors(): RecordedError[] {
    return [...this.errors];
  }

  /**
   * Get the current circuit state
   */
  getCircuitState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.circuitState;
  }

  /**
   * Manually set the circuit state (for testing)
   */
  setCircuitState(state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    this.circuitState = state;
  }

  /**
   * Clear all recorded errors and reset the circuit
   */
  reset(): void {
    this.errors = [];
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Update the interceptor configuration
   */
  updateConfig(config: Partial<MockInterceptorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

/**
 * Mock implementation of a fallback interceptor for testing
 */
export class MockFallbackInterceptor implements NestInterceptor {
  private errors: RecordedError[] = [];
  private config: MockInterceptorConfig;

  constructor(config: MockInterceptorConfig = {}) {
    this.config = {
      shouldFallback: true,
      fallbackValue: null,
      ...config
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // Catch errors and apply fallback logic
      (source) => new Observable(observer => {
        const subscription = source.subscribe({
          next: (value) => {
            observer.next(value);
            observer.complete();
          },
          error: (err) => {
            // Record the error
            this.errors.push({
              error: err,
              timestamp: new Date(),
              context: context.getClass().name,
              metadata: {
                fallbackApplied: this.config.shouldFallback
              }
            });

            // Check if we should apply fallback
            if (this.config.shouldFallback) {
              // Return fallback value
              observer.next(this.config.fallbackValue);
              observer.complete();
            } else {
              // Propagate the error
              observer.error(err);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      })
    );
  }

  /**
   * Get all recorded errors
   */
  getErrors(): RecordedError[] {
    return [...this.errors];
  }

  /**
   * Clear all recorded errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Update the interceptor configuration
   */
  updateConfig(config: Partial<MockInterceptorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

/**
 * Mock implementation of a timeout interceptor for testing
 */
export class MockTimeoutInterceptor implements NestInterceptor {
  private errors: RecordedError[] = [];
  private config: MockInterceptorConfig;

  constructor(config: MockInterceptorConfig = {}) {
    this.config = {
      shouldTimeout: false,
      timeoutMs: 5000,
      ...config
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // If timeout is enabled, simulate a timeout
    if (this.config.shouldTimeout) {
      const timeoutError = new Error(`Request timed out after ${this.config.timeoutMs}ms`);
      this.errors.push({
        error: timeoutError,
        timestamp: new Date(),
        context: context.getClass().name,
        metadata: {
          timeoutMs: this.config.timeoutMs
        }
      });
      return throwError(() => timeoutError);
    }

    // Otherwise, pass through
    return next.handle();
  }

  /**
   * Get all recorded errors
   */
  getErrors(): RecordedError[] {
    return [...this.errors];
  }

  /**
   * Clear all recorded errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Update the interceptor configuration
   */
  updateConfig(config: Partial<MockInterceptorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

/**
 * Mock implementation of a journey-specific error handler for testing
 */
export class MockJourneyErrorHandler {
  private errors: RecordedError[] = [];
  private journeyType: 'HEALTH' | 'CARE' | 'PLAN';
  private shouldRethrow: boolean;

  constructor(journeyType: 'HEALTH' | 'CARE' | 'PLAN', shouldRethrow = false) {
    this.journeyType = journeyType;
    this.shouldRethrow = shouldRethrow;
  }

  /**
   * Handle an error in the context of this journey
   */
  handleError(error: Error, context?: string): void {
    // Record the error
    this.errors.push({
      error,
      timestamp: new Date(),
      context: context || `${this.journeyType}_JOURNEY`,
      metadata: {
        journeyType: this.journeyType
      }
    });

    // Rethrow if configured
    if (this.shouldRethrow) {
      throw error;
    }
  }

  /**
   * Get all recorded errors
   */
  getErrors(): RecordedError[] {
    return [...this.errors];
  }

  /**
   * Get errors filtered by context
   */
  getErrorsByContext(context: string): RecordedError[] {
    return this.errors.filter(e => e.context === context);
  }

  /**
   * Clear all recorded errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Set whether errors should be rethrown
   */
  setShouldRethrow(shouldRethrow: boolean): void {
    this.shouldRethrow = shouldRethrow;
  }
}

/**
 * Factory function to create a mock exception filter
 */
export function createMockExceptionFilter(config?: MockFilterConfig): MockExceptionFilter {
  return new MockExceptionFilter(config);
}

/**
 * Factory function to create a mock retry interceptor
 */
export function createMockRetryInterceptor(config?: MockInterceptorConfig): MockRetryInterceptor {
  return new MockRetryInterceptor(config);
}

/**
 * Factory function to create a mock circuit breaker interceptor
 */
export function createMockCircuitBreakerInterceptor(config?: MockInterceptorConfig): MockCircuitBreakerInterceptor {
  return new MockCircuitBreakerInterceptor(config);
}

/**
 * Factory function to create a mock fallback interceptor
 */
export function createMockFallbackInterceptor(config?: MockInterceptorConfig): MockFallbackInterceptor {
  return new MockFallbackInterceptor(config);
}

/**
 * Factory function to create a mock timeout interceptor
 */
export function createMockTimeoutInterceptor(config?: MockInterceptorConfig): MockTimeoutInterceptor {
  return new MockTimeoutInterceptor(config);
}

/**
 * Factory function to create a mock journey error handler
 */
export function createMockJourneyErrorHandler(
  journeyType: 'HEALTH' | 'CARE' | 'PLAN', 
  shouldRethrow = false
): MockJourneyErrorHandler {
  return new MockJourneyErrorHandler(journeyType, shouldRethrow);
}

/**
 * Create a complete mock error handling suite for testing
 */
export function createMockErrorHandlingSuite() {
  return {
    exceptionFilter: createMockExceptionFilter(),
    retryInterceptor: createMockRetryInterceptor(),
    circuitBreakerInterceptor: createMockCircuitBreakerInterceptor(),
    fallbackInterceptor: createMockFallbackInterceptor(),
    timeoutInterceptor: createMockTimeoutInterceptor(),
    healthErrorHandler: createMockJourneyErrorHandler('HEALTH'),
    careErrorHandler: createMockJourneyErrorHandler('CARE'),
    planErrorHandler: createMockJourneyErrorHandler('PLAN')
  };
}