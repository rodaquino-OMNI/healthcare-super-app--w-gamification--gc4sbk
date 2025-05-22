import { ArgumentsHost, CallHandler, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';

/**
 * Records errors that are processed by mock error handlers for later assertion
 */
export class ErrorRecorder {
  private errors: Error[] = [];
  private responses: any[] = [];
  private contexts: any[] = [];

  /**
   * Records an error and its associated context
   */
  recordError(error: Error, context?: any): void {
    this.errors.push(error);
    this.contexts.push(context || {});
  }

  /**
   * Records a response generated for an error
   */
  recordResponse(response: any): void {
    this.responses.push(response);
  }

  /**
   * Gets all recorded errors
   */
  getErrors(): Error[] {
    return [...this.errors];
  }

  /**
   * Gets all recorded responses
   */
  getResponses(): any[] {
    return [...this.responses];
  }

  /**
   * Gets all recorded contexts
   */
  getContexts(): any[] {
    return [...this.contexts];
  }

  /**
   * Gets the last recorded error
   */
  getLastError(): Error | undefined {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : undefined;
  }

  /**
   * Gets the last recorded response
   */
  getLastResponse(): any | undefined {
    return this.responses.length > 0 ? this.responses[this.responses.length - 1] : undefined;
  }

  /**
   * Clears all recorded data
   */
  clear(): void {
    this.errors = [];
    this.responses = [];
    this.contexts = [];
  }

  /**
   * Gets the count of recorded errors
   */
  get errorCount(): number {
    return this.errors.length;
  }

  /**
   * Gets the count of recorded responses
   */
  get responseCount(): number {
    return this.responses.length;
  }
}

/**
 * Configuration options for the MockExceptionFilter
 */
export interface MockExceptionFilterOptions {
  /**
   * Custom response to return for specific error types
   */
  customResponses?: Map<ErrorType | string, any>;
  
  /**
   * Whether to throw errors instead of handling them
   */
  throwErrors?: boolean;
  
  /**
   * Custom status code mapping function
   */
  statusCodeMapper?: (error: Error) => HttpStatus;
  
  /**
   * Error recorder instance to use
   */
  recorder?: ErrorRecorder;
}

/**
 * Mock implementation of NestJS ExceptionFilter for testing error handling
 */
export class MockExceptionFilter {
  private recorder: ErrorRecorder;
  private customResponses: Map<ErrorType | string, any>;
  private throwErrors: boolean;
  private statusCodeMapper?: (error: Error) => HttpStatus;

  constructor(options: MockExceptionFilterOptions = {}) {
    this.recorder = options.recorder || new ErrorRecorder();
    this.customResponses = options.customResponses || new Map();
    this.throwErrors = options.throwErrors || false;
    this.statusCodeMapper = options.statusCodeMapper;
  }

  /**
   * Handles an exception in the same way as a NestJS ExceptionFilter
   */
  catch(exception: Error, host: ArgumentsHost): any {
    this.recorder.recordError(exception, host);

    if (this.throwErrors) {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any;

    // Determine status code
    if (this.statusCodeMapper) {
      statusCode = this.statusCodeMapper(exception);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
    } else if (exception instanceof BaseError) {
      statusCode = this.getStatusCodeFromErrorType(exception.type);
    }

    // Generate error response
    if (exception instanceof BaseError && this.customResponses.has(exception.type)) {
      errorResponse = this.customResponses.get(exception.type);
    } else if (exception instanceof Error && this.customResponses.has(exception.constructor.name)) {
      errorResponse = this.customResponses.get(exception.constructor.name);
    } else if (exception instanceof BaseError) {
      errorResponse = {
        error: {
          type: exception.type,
          code: exception.code,
          message: exception.message,
          details: exception.details
        }
      };
    } else if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      errorResponse = {
        error: {
          ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
          type: this.getErrorTypeFromStatus(statusCode)
        }
      };
    } else {
      errorResponse = {
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: exception.message || 'An unexpected error occurred',
          details: {
            name: exception.name
          }
        }
      };
    }

    this.recorder.recordResponse(errorResponse);
    return response.status(statusCode).json(errorResponse);
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
   * Gets the error recorder instance
   */
  getRecorder(): ErrorRecorder {
    return this.recorder;
  }

  /**
   * Sets a custom response for a specific error type
   */
  setCustomResponse(errorType: ErrorType | string, response: any): void {
    this.customResponses.set(errorType, response);
  }

  /**
   * Clears all custom responses
   */
  clearCustomResponses(): void {
    this.customResponses.clear();
  }

  /**
   * Sets whether to throw errors instead of handling them
   */
  setThrowErrors(throwErrors: boolean): void {
    this.throwErrors = throwErrors;
  }
}

/**
 * Configuration options for the MockErrorInterceptor
 */
export interface MockErrorInterceptorOptions {
  /**
   * Whether to rethrow errors after processing
   */
  rethrowErrors?: boolean;
  
  /**
   * Custom error transformation function
   */
  errorTransformer?: (error: Error) => Error;
  
  /**
   * Error recorder instance to use
   */
  recorder?: ErrorRecorder;
  
  /**
   * Whether to apply fallback strategy for errors
   */
  useFallback?: boolean;
  
  /**
   * Fallback value to return when an error occurs
   */
  fallbackValue?: any;
}

/**
 * Mock implementation of NestJS error interceptor for testing
 */
export class MockErrorInterceptor {
  private recorder: ErrorRecorder;
  private rethrowErrors: boolean;
  private errorTransformer?: (error: Error) => Error;
  private useFallback: boolean;
  private fallbackValue: any;

  constructor(options: MockErrorInterceptorOptions = {}) {
    this.recorder = options.recorder || new ErrorRecorder();
    this.rethrowErrors = options.rethrowErrors || false;
    this.errorTransformer = options.errorTransformer;
    this.useFallback = options.useFallback || false;
    this.fallbackValue = options.fallbackValue;
  }

  /**
   * Intercepts errors in the same way as a NestJS interceptor
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // Catch and process errors
      (source) => new Observable((subscriber) => {
        const subscription = source.subscribe({
          next: (value) => subscriber.next(value),
          error: (error: Error) => {
            this.recorder.recordError(error, context);
            
            // Transform error if transformer is provided
            let processedError = error;
            if (this.errorTransformer) {
              try {
                processedError = this.errorTransformer(error);
              } catch (transformError) {
                // If transformer throws, use original error
                console.error('Error in error transformer:', transformError);
              }
            }

            // Apply fallback or rethrow
            if (this.useFallback) {
              const fallbackResponse = this.fallbackValue !== undefined 
                ? this.fallbackValue 
                : { _fallback: true, originalError: error.message };
              
              this.recorder.recordResponse(fallbackResponse);
              subscriber.next(fallbackResponse);
              subscriber.complete();
            } else if (this.rethrowErrors) {
              subscriber.error(processedError);
            } else {
              // Complete without error for testing
              subscriber.complete();
            }
          },
          complete: () => subscriber.complete()
        });

        return () => subscription.unsubscribe();
      })
    );
  }

  /**
   * Gets the error recorder instance
   */
  getRecorder(): ErrorRecorder {
    return this.recorder;
  }

  /**
   * Sets whether to rethrow errors after processing
   */
  setRethrowErrors(rethrow: boolean): void {
    this.rethrowErrors = rethrow;
  }

  /**
   * Sets a custom error transformer function
   */
  setErrorTransformer(transformer: (error: Error) => Error): void {
    this.errorTransformer = transformer;
  }

  /**
   * Sets whether to use fallback strategy
   */
  setUseFallback(useFallback: boolean, fallbackValue?: any): void {
    this.useFallback = useFallback;
    if (fallbackValue !== undefined) {
      this.fallbackValue = fallbackValue;
    }
  }
}

/**
 * Configuration options for journey-specific error handlers
 */
export interface JourneyErrorHandlerOptions {
  /**
   * Journey identifier (health, care, plan)
   */
  journey: 'health' | 'care' | 'plan';
  
  /**
   * Custom error transformation for journey-specific errors
   */
  errorTransformer?: (error: Error, context?: any) => Error;
  
  /**
   * Error recorder instance to use
   */
  recorder?: ErrorRecorder;
  
  /**
   * Whether to apply journey-specific fallback strategies
   */
  useFallback?: boolean;
}

/**
 * Mock implementation of journey-specific error handler for testing
 */
export class MockJourneyErrorHandler {
  private journey: string;
  private recorder: ErrorRecorder;
  private errorTransformer?: (error: Error, context?: any) => Error;
  private useFallback: boolean;
  private fallbackStrategies: Map<string, (error: Error, context?: any) => any>;

  constructor(options: JourneyErrorHandlerOptions) {
    this.journey = options.journey;
    this.recorder = options.recorder || new ErrorRecorder();
    this.errorTransformer = options.errorTransformer;
    this.useFallback = options.useFallback || false;
    this.fallbackStrategies = new Map();
    
    // Initialize with some default fallback strategies
    this.initDefaultFallbacks();
  }

  /**
   * Initializes default fallback strategies based on journey type
   */
  private initDefaultFallbacks(): void {
    // Common fallbacks
    this.fallbackStrategies.set('default', () => ({ status: 'degraded', message: `${this.journey} service is operating in degraded mode` }));
    
    // Journey-specific fallbacks
    switch (this.journey) {
      case 'health':
        this.fallbackStrategies.set('metrics', () => ({ metrics: [], lastUpdated: new Date().toISOString() }));
        this.fallbackStrategies.set('goals', () => ({ goals: [], message: 'Unable to retrieve goals' }));
        break;
      case 'care':
        this.fallbackStrategies.set('appointments', () => ({ appointments: [], message: 'Unable to retrieve appointments' }));
        this.fallbackStrategies.set('providers', () => ({ providers: [], message: 'Unable to retrieve providers' }));
        break;
      case 'plan':
        this.fallbackStrategies.set('benefits', () => ({ benefits: [], message: 'Unable to retrieve benefits' }));
        this.fallbackStrategies.set('claims', () => ({ claims: [], message: 'Unable to retrieve claims' }));
        break;
    }
  }

  /**
   * Handles an error with journey-specific logic
   */
  handleError(error: Error, errorType?: string, context?: any): any {
    this.recorder.recordError(error, { journey: this.journey, errorType, context });
    
    // Transform error if transformer is provided
    let processedError = error;
    if (this.errorTransformer) {
      try {
        processedError = this.errorTransformer(error, context);
      } catch (transformError) {
        // If transformer throws, use original error
        console.error(`Error in ${this.journey} error transformer:`, transformError);
      }
    }

    // Apply fallback if enabled
    if (this.useFallback) {
      const fallbackStrategy = errorType && this.fallbackStrategies.has(errorType)
        ? this.fallbackStrategies.get(errorType)
        : this.fallbackStrategies.get('default');
      
      if (fallbackStrategy) {
        const fallbackResponse = fallbackStrategy(processedError, context);
        this.recorder.recordResponse(fallbackResponse);
        return fallbackResponse;
      }
    }

    // If no fallback or fallback disabled, return the processed error
    return processedError;
  }

  /**
   * Gets the error recorder instance
   */
  getRecorder(): ErrorRecorder {
    return this.recorder;
  }

  /**
   * Sets a custom fallback strategy for a specific error type
   */
  setFallbackStrategy(errorType: string, strategy: (error: Error, context?: any) => any): void {
    this.fallbackStrategies.set(errorType, strategy);
  }

  /**
   * Sets whether to use fallback strategies
   */
  setUseFallback(useFallback: boolean): void {
    this.useFallback = useFallback;
  }

  /**
   * Sets a custom error transformer
   */
  setErrorTransformer(transformer: (error: Error, context?: any) => Error): void {
    this.errorTransformer = transformer;
  }
}

/**
 * Configuration options for the MockErrorClassifier
 */
export interface MockErrorClassifierOptions {
  /**
   * Default error type to return
   */
  defaultErrorType?: ErrorType;
  
  /**
   * Custom classification rules
   */
  classificationRules?: Map<string, ErrorType>;
  
  /**
   * Error recorder instance to use
   */
  recorder?: ErrorRecorder;
}

/**
 * Mock implementation of error classifier for testing
 */
export class MockErrorClassifier {
  private defaultErrorType: ErrorType;
  private classificationRules: Map<string, ErrorType>;
  private recorder: ErrorRecorder;

  constructor(options: MockErrorClassifierOptions = {}) {
    this.defaultErrorType = options.defaultErrorType || ErrorType.TECHNICAL;
    this.classificationRules = options.classificationRules || new Map();
    this.recorder = options.recorder || new ErrorRecorder();
  }

  /**
   * Classifies an error into a specific ErrorType
   */
  classify(error: Error): ErrorType {
    this.recorder.recordError(error);
    
    // Check if error is already a BaseError with a type
    if (error instanceof BaseError) {
      return error.type;
    }
    
    // Check if we have a rule for this error constructor
    if (this.classificationRules.has(error.constructor.name)) {
      return this.classificationRules.get(error.constructor.name)!;
    }
    
    // Check if we have a rule based on error message pattern
    for (const [pattern, errorType] of this.classificationRules.entries()) {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // This is a regex pattern
        const regex = new RegExp(pattern.slice(1, -1));
        if (regex.test(error.message)) {
          return errorType;
        }
      } else if (error.message.includes(pattern)) {
        // Simple string match
        return errorType;
      }
    }
    
    // Default classification
    return this.defaultErrorType;
  }

  /**
   * Gets the error recorder instance
   */
  getRecorder(): ErrorRecorder {
    return this.recorder;
  }

  /**
   * Sets the default error type
   */
  setDefaultErrorType(errorType: ErrorType): void {
    this.defaultErrorType = errorType;
  }

  /**
   * Adds a classification rule
   */
  addClassificationRule(pattern: string, errorType: ErrorType): void {
    this.classificationRules.set(pattern, errorType);
  }

  /**
   * Clears all classification rules
   */
  clearClassificationRules(): void {
    this.classificationRules.clear();
  }
}

/**
 * Creates a mock exception filter for testing
 */
export function createMockExceptionFilter(options: MockExceptionFilterOptions = {}): MockExceptionFilter {
  return new MockExceptionFilter(options);
}

/**
 * Creates a mock error interceptor for testing
 */
export function createMockErrorInterceptor(options: MockErrorInterceptorOptions = {}): MockErrorInterceptor {
  return new MockErrorInterceptor(options);
}

/**
 * Creates a mock journey error handler for testing
 */
export function createMockJourneyErrorHandler(journey: 'health' | 'care' | 'plan', options: Partial<JourneyErrorHandlerOptions> = {}): MockJourneyErrorHandler {
  return new MockJourneyErrorHandler({ journey, ...options });
}

/**
 * Creates a mock error classifier for testing
 */
export function createMockErrorClassifier(options: MockErrorClassifierOptions = {}): MockErrorClassifier {
  return new MockErrorClassifier(options);
}

/**
 * Creates a shared error recorder that can be used across multiple mock components
 */
export function createSharedErrorRecorder(): ErrorRecorder {
  return new ErrorRecorder();
}