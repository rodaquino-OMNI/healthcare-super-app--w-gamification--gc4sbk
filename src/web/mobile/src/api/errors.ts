/**
 * @file errors.ts
 * @description Comprehensive error handling framework for the mobile API layer.
 * Provides error classification, standardized error responses, retry strategies
 * with exponential backoff, circuit breaker patterns, and structured error logging.
 */

import { AxiosError } from 'axios';
import { ApolloError } from '@apollo/client';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Import shared error interfaces
import { ErrorCode, ErrorResponse } from '@austa/interfaces/common/error';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  CLIENT = 'CLIENT',     // Client-side errors (invalid input, etc.)
  SYSTEM = 'SYSTEM',     // Internal system errors
  TRANSIENT = 'TRANSIENT', // Temporary errors that may resolve with retry
  EXTERNAL = 'EXTERNAL'  // External dependency errors
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: ErrorCode;
  public readonly status?: number;
  public readonly timestamp: number;
  public readonly context: Record<string, any>;
  public readonly originalError?: Error;

  constructor({
    message,
    category = ErrorCategory.SYSTEM,
    code = ErrorCode.UNKNOWN_ERROR,
    status,
    context = {},
    originalError
  }: {
    message: string;
    category?: ErrorCategory;
    code?: ErrorCode;
    status?: number;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.code = code;
    this.status = status;
    this.timestamp = Date.now();
    this.context = {
      ...context,
      platform: Platform.OS,
      version: Platform.Version,
    };
    this.originalError = originalError;

    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Serialize the error to a standard format for logging and reporting
   */
  public serialize(): ErrorResponse {
    return {
      message: this.message,
      code: this.code,
      status: this.status,
      category: this.category,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Create a user-friendly error message
   */
  public getUserMessage(): string {
    // Default user-friendly messages based on category
    switch (this.category) {
      case ErrorCategory.CLIENT:
        return 'Não foi possível processar sua solicitação. Por favor, verifique os dados informados.';
      case ErrorCategory.SYSTEM:
        return 'Ocorreu um erro no sistema. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.';
      case ErrorCategory.TRANSIENT:
        return 'Estamos enfrentando instabilidade temporária. Por favor, tente novamente em alguns instantes.';
      case ErrorCategory.EXTERNAL:
        return 'Um serviço externo está indisponível no momento. Por favor, tente novamente mais tarde.';
      default:
        return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
    }
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(): boolean {
    return this.category === ErrorCategory.TRANSIENT;
  }
}

/**
 * Client Error - represents errors caused by invalid client input or state
 */
export class ClientError extends ApiError {
  constructor({
    message,
    code = ErrorCode.INVALID_INPUT,
    status = 400,
    context = {},
    originalError
  }: {
    message: string;
    code?: ErrorCode;
    status?: number;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      category: ErrorCategory.CLIENT,
      code,
      status,
      context,
      originalError
    });
  }
}

/**
 * System Error - represents internal system errors
 */
export class SystemError extends ApiError {
  constructor({
    message,
    code = ErrorCode.INTERNAL_ERROR,
    status = 500,
    context = {},
    originalError
  }: {
    message: string;
    code?: ErrorCode;
    status?: number;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      category: ErrorCategory.SYSTEM,
      code,
      status,
      context,
      originalError
    });
  }
}

/**
 * Transient Error - represents temporary errors that may resolve with retry
 */
export class TransientError extends ApiError {
  constructor({
    message,
    code = ErrorCode.SERVICE_UNAVAILABLE,
    status = 503,
    context = {},
    originalError
  }: {
    message: string;
    code?: ErrorCode;
    status?: number;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      category: ErrorCategory.TRANSIENT,
      code,
      status,
      context,
      originalError
    });
  }
}

/**
 * External Error - represents errors from external dependencies
 */
export class ExternalError extends ApiError {
  constructor({
    message,
    code = ErrorCode.EXTERNAL_SERVICE_ERROR,
    status = 502,
    context = {},
    originalError
  }: {
    message: string;
    code?: ErrorCode;
    status?: number;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      category: ErrorCategory.EXTERNAL,
      code,
      status,
      context,
      originalError
    });
  }
}

/**
 * Network Error - represents network connectivity issues
 */
export class NetworkError extends TransientError {
  constructor({
    message = 'Network connection unavailable',
    context = {},
    originalError
  }: {
    message?: string;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      code: ErrorCode.NETWORK_ERROR,
      status: 0, // No HTTP status for network errors
      context,
      originalError
    });
  }

  /**
   * Check if the device is currently connected to the internet
   */
  public static async isConnected(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }
}

/**
 * Timeout Error - represents request timeout issues
 */
export class TimeoutError extends TransientError {
  constructor({
    message = 'Request timed out',
    context = {},
    originalError
  }: {
    message?: string;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      code: ErrorCode.TIMEOUT,
      status: 408,
      context,
      originalError
    });
  }
}

/**
 * Authentication Error - represents authentication failures
 */
export class AuthenticationError extends ClientError {
  constructor({
    message = 'Authentication failed',
    context = {},
    originalError
  }: {
    message?: string;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      code: ErrorCode.UNAUTHORIZED,
      status: 401,
      context,
      originalError
    });
  }
}

/**
 * Authorization Error - represents authorization failures
 */
export class AuthorizationError extends ClientError {
  constructor({
    message = 'Not authorized to perform this action',
    context = {},
    originalError
  }: {
    message?: string;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      code: ErrorCode.FORBIDDEN,
      status: 403,
      context,
      originalError
    });
  }
}

/**
 * Not Found Error - represents resource not found errors
 */
export class NotFoundError extends ClientError {
  constructor({
    message = 'Resource not found',
    context = {},
    originalError
  }: {
    message?: string;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      code: ErrorCode.NOT_FOUND,
      status: 404,
      context,
      originalError
    });
  }
}

/**
 * Validation Error - represents input validation failures
 */
export class ValidationError extends ClientError {
  public readonly validationErrors: Record<string, string[]>;

  constructor({
    message = 'Validation failed',
    validationErrors = {},
    context = {},
    originalError
  }: {
    message?: string;
    validationErrors?: Record<string, string[]>;
    context?: Record<string, any>;
    originalError?: Error;
  }) {
    super({
      message,
      code: ErrorCode.VALIDATION_ERROR,
      status: 422,
      context: { ...context, validationErrors },
      originalError
    });
    this.validationErrors = validationErrors;
  }

  /**
   * Get user-friendly validation error messages
   */
  public getFieldErrors(): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    
    for (const [field, errors] of Object.entries(this.validationErrors)) {
      fieldErrors[field] = errors[0] || 'Campo inválido';
    }
    
    return fieldErrors;
  }
}

/**
 * Options for retry mechanism
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error, retryCount: number) => boolean;
  onRetry?: (error: Error, retryCount: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 10000,
  backoffFactor: 2,
  shouldRetry: (error: Error) => {
    if (error instanceof ApiError) {
      return error.isRetryable();
    }
    // Default retry behavior for non-ApiError instances
    return error instanceof Error && (
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('connection')
    );
  },
  onRetry: (error: Error, retryCount: number) => {
    console.warn(`Retrying request (${retryCount}) after error:`, error.message);
  }
};

/**
 * Sleep utility for async delay
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Add jitter to backoff delay to prevent synchronized retries
 */
const addJitter = (delay: number): number => {
  // Add random jitter of ±20%
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(delay + jitter));
};

/**
 * Calculate exponential backoff delay with jitter
 */
const calculateBackoffDelay = (
  retryCount: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffFactor: number
): number => {
  // Calculate exponential backoff: initialDelay * (backoffFactor ^ retryCount)
  const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, retryCount);
  // Cap the delay at maxDelayMs
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  // Add jitter to prevent synchronized retries
  return addJitter(cappedDelay);
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffFactor,
    shouldRetry,
    onRetry
  } = { ...DEFAULT_RETRY_OPTIONS, ...options };

  let retryCount = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      // Convert to Error if it's not already
      const err = error instanceof Error ? error : new Error(String(error));

      // Check if we've reached max retries or if we shouldn't retry this error
      if (retryCount >= maxRetries || !shouldRetry(err, retryCount)) {
        throw err;
      }

      // Calculate delay with exponential backoff
      const delayMs = calculateBackoffDelay(
        retryCount,
        initialDelayMs,
        maxDelayMs,
        backoffFactor
      );

      // Call onRetry callback
      onRetry(err, retryCount + 1);

      // Wait before retrying
      await sleep(delayMs);

      // Increment retry counter
      retryCount++;
    }
  }
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  resetTimeoutMs?: number;
  monitorIntervalMs?: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

/**
 * Default circuit breaker options
 */
const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,        // Number of failures before opening circuit
  successThreshold: 2,        // Number of successes needed to close circuit
  resetTimeoutMs: 30000,      // Time before attempting to close circuit (30s)
  monitorIntervalMs: 5000,    // Health check interval when half-open (5s)
  onStateChange: (from, to) => {
    console.info(`Circuit breaker state changed from ${from} to ${to}`);
  },
  onSuccess: () => {},
  onFailure: (error) => {
    console.warn('Circuit breaker recorded failure:', error.message);
  }
};

/**
 * Circuit Breaker implementation
 * Prevents cascading failures by failing fast when a service is unavailable
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private monitorTimeout: NodeJS.Timeout | null = null;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
  }

  /**
   * Get current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset the circuit breaker to closed state
   */
  public reset(): void {
    this.changeState(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.clearMonitorTimeout();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is OPEN
    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has elapsed
      const now = Date.now();
      if (now - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.changeState(CircuitState.HALF_OPEN);
      } else {
        // Circuit is open, fail fast
        throw new TransientError({
          message: 'Circuit breaker is open',
          code: ErrorCode.CIRCUIT_OPEN,
          context: {
            circuitState: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            remainingTimeMs: this.options.resetTimeoutMs - (now - this.lastFailureTime)
          }
        });
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // Record success
      this.recordSuccess();
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(): void {
    this.options.onSuccess();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.changeState(CircuitState.CLOSED);
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(error: Error): void {
    this.options.onFailure(error);
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN state should open the circuit again
      this.changeState(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.changeState(CircuitState.OPEN);
      }
    }
  }

  /**
   * Change circuit breaker state
   */
  private changeState(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.options.onStateChange(oldState, newState);

      // Reset counters on state change
      if (newState === CircuitState.CLOSED) {
        this.failureCount = 0;
        this.successCount = 0;
        this.clearMonitorTimeout();
      } else if (newState === CircuitState.OPEN) {
        this.successCount = 0;
        this.startMonitorTimeout();
      } else if (newState === CircuitState.HALF_OPEN) {
        this.successCount = 0;
      }
    }
  }

  /**
   * Start monitoring timeout to check if circuit should be half-open
   */
  private startMonitorTimeout(): void {
    this.clearMonitorTimeout();
    this.monitorTimeout = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        const now = Date.now();
        if (now - this.lastFailureTime >= this.options.resetTimeoutMs) {
          this.changeState(CircuitState.HALF_OPEN);
        } else {
          // Check again after some time
          this.startMonitorTimeout();
        }
      }
    }, this.options.monitorIntervalMs);
  }

  /**
   * Clear monitoring timeout
   */
  private clearMonitorTimeout(): void {
    if (this.monitorTimeout) {
      clearTimeout(this.monitorTimeout);
      this.monitorTimeout = null;
    }
  }
}

/**
 * Error parser to convert various error types to ApiError
 */
export function parseError(error: any): ApiError {
  // Already an ApiError instance
  if (error instanceof ApiError) {
    return error;
  }

  // Check for network connectivity
  if (
    error.message?.includes('Network Error') ||
    error.message?.includes('network request failed') ||
    error.message?.includes('No Internet Connection')
  ) {
    return new NetworkError({
      originalError: error instanceof Error ? error : undefined
    });
  }

  // Handle Axios errors
  if (error.isAxiosError || error instanceof AxiosError) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as any;

    // Handle specific HTTP status codes
    if (status) {
      if (status === 401) {
        return new AuthenticationError({
          message: data?.message || 'Authentication failed',
          context: { data },
          originalError: error
        });
      }

      if (status === 403) {
        return new AuthorizationError({
          message: data?.message || 'Not authorized to perform this action',
          context: { data },
          originalError: error
        });
      }

      if (status === 404) {
        return new NotFoundError({
          message: data?.message || 'Resource not found',
          context: { data },
          originalError: error
        });
      }

      if (status === 422) {
        return new ValidationError({
          message: data?.message || 'Validation failed',
          validationErrors: data?.errors || {},
          context: { data },
          originalError: error
        });
      }

      if (status >= 500) {
        return new TransientError({
          message: data?.message || 'Server error',
          status,
          context: { data },
          originalError: error
        });
      }

      // Generic client error
      if (status >= 400 && status < 500) {
        return new ClientError({
          message: data?.message || 'Client error',
          status,
          context: { data },
          originalError: error
        });
      }
    }

    // Timeout errors
    if (axiosError.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new TimeoutError({
        originalError: error
      });
    }

    // Network errors
    if (!axiosError.response) {
      return new NetworkError({
        originalError: error
      });
    }
  }

  // Handle Apollo GraphQL errors
  if (error.networkError || error instanceof ApolloError) {
    const apolloError = error as ApolloError;

    // Network errors
    if (apolloError.networkError) {
      if (apolloError.networkError.message?.includes('timeout')) {
        return new TimeoutError({
          originalError: error
        });
      }

      return new NetworkError({
        originalError: error
      });
    }

    // GraphQL errors
    if (apolloError.graphQLErrors?.length) {
      const graphQLError = apolloError.graphQLErrors[0];
      const extensions = graphQLError.extensions || {};
      const code = extensions.code as string;
      const status = extensions.status as number;

      if (code === 'UNAUTHENTICATED' || status === 401) {
        return new AuthenticationError({
          message: graphQLError.message,
          context: { extensions },
          originalError: error
        });
      }

      if (code === 'FORBIDDEN' || status === 403) {
        return new AuthorizationError({
          message: graphQLError.message,
          context: { extensions },
          originalError: error
        });
      }

      if (code === 'NOT_FOUND' || status === 404) {
        return new NotFoundError({
          message: graphQLError.message,
          context: { extensions },
          originalError: error
        });
      }

      if (code === 'BAD_USER_INPUT' || status === 422) {
        return new ValidationError({
          message: graphQLError.message,
          validationErrors: extensions.validationErrors || {},
          context: { extensions },
          originalError: error
        });
      }

      if (code === 'INTERNAL_SERVER_ERROR' || (status && status >= 500)) {
        return new TransientError({
          message: graphQLError.message,
          status,
          context: { extensions },
          originalError: error
        });
      }

      // Default to client error for other GraphQL errors
      return new ClientError({
        message: graphQLError.message,
        context: { extensions },
        originalError: error
      });
    }
  }

  // Default to system error for unknown error types
  return new SystemError({
    message: error.message || 'Unknown error occurred',
    originalError: error instanceof Error ? error : undefined,
    context: { rawError: error }
  });
}

/**
 * Create a protected API client that handles errors and implements retry and circuit breaker patterns
 */
export function createProtectedApiClient<T>(
  apiClient: T,
  circuitBreaker: CircuitBreaker = new CircuitBreaker(),
  retryOptions: RetryOptions = {}
): T {
  // Create a proxy to intercept function calls
  return new Proxy(apiClient, {
    get(target: any, prop: string | symbol) {
      const value = target[prop];

      // If the property is a function, wrap it with error handling
      if (typeof value === 'function') {
        return async function(...args: any[]) {
          try {
            // Execute the function with circuit breaker and retry
            return await circuitBreaker.execute(() => 
              withRetry(() => value.apply(target, args), retryOptions)
            );
          } catch (error) {
            // Parse and rethrow the error
            throw parseError(error);
          }
        };
      }

      // Return the original value for non-function properties
      return value;
    }
  });
}

/**
 * Wrap a function with error handling, retry, and circuit breaker
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  circuitBreaker: CircuitBreaker = new CircuitBreaker(),
  retryOptions: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      // Execute the function with circuit breaker and retry
      return await circuitBreaker.execute(() => 
        withRetry(() => fn(...args), retryOptions)
      );
    } catch (error) {
      // Parse and rethrow the error
      throw parseError(error);
    }
  }) as T;
}

/**
 * Log an error with structured format
 */
export function logError(error: Error, context: Record<string, any> = {}): void {
  const apiError = error instanceof ApiError 
    ? error 
    : parseError(error);
  
  const errorData = {
    ...apiError.serialize(),
    additionalContext: context
  };

  // Log to console in development
  if (__DEV__) {
    console.error('API Error:', errorData);
  } else {
    // In production, we would send this to a logging service
    // This is a placeholder for actual implementation
    console.error(
      JSON.stringify(errorData)
    );
    
    // Here you would typically send to a logging service like:
    // Analytics.logError(errorData);
  }
}

/**
 * Check if an error is a specific type
 */
export function isErrorType<T extends ApiError>(
  error: Error, 
  errorType: new (...args: any[]) => T
): error is T {
  return error instanceof errorType;
}

/**
 * Export a singleton circuit breaker for global use
 */
export const globalCircuitBreaker = new CircuitBreaker();