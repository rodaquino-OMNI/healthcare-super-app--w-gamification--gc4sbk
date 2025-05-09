import { BaseError, ErrorContext, ErrorType, JourneyContext } from '../base';
import { ErrorClassification, ErrorRecoveryStrategy } from '../types';
import { ClassifyErrorOptions, ErrorContextOptions, TransformErrorOptions } from './types';

/**
 * Decorator that adds error context to any errors thrown by the decorated method.
 * This ensures that all errors have consistent context information for better
 * tracking, logging, and client-friendly error responses.
 * 
 * @param options - Configuration options for the error context
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @WithErrorContext({
 *   journey: 'health',
 *   operation: 'recordHealthMetric',
 *   resource: 'HealthMetric',
 *   getUserId: (userId: string) => userId
 * })
 * async recordHealthMetric(userId: string, metric: HealthMetricDto): Promise<HealthMetric> {
 *   // Method implementation
 * }
 * ```
 */
export function WithErrorContext(options: ErrorContextOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Execute the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Create context object
        const context: ErrorContext = {};
        
        // Add journey context if provided
        if (options.journey) {
          context.journey = options.journey as JourneyContext;
        }
        
        // Add operation name (use method name if not provided)
        context.operation = options.operation || String(propertyKey);
        
        // Add resource if provided
        if (options.resource) {
          context.resource = options.resource;
        }
        
        // Add user ID if extraction function is provided
        if (options.getUserId) {
          const userId = options.getUserId(...args);
          if (userId) {
            context.userId = userId;
          }
        }
        
        // Add additional data if provided
        if (options.data) {
          Object.assign(context, options.data);
        }
        
        // Try to get request ID and trace ID from the current execution context
        try {
          // This assumes a tracing system is in place that provides these values
          // The actual implementation would depend on the tracing library used
          const traceContext = getTraceContext();
          if (traceContext) {
            context.requestId = traceContext.requestId;
            context.traceId = traceContext.traceId;
            context.spanId = traceContext.spanId;
          }
        } catch (traceError) {
          // Ignore errors from trace context extraction
        }
        
        // Set timestamp
        context.timestamp = new Date();
        
        // If the error is already a BaseError, add the context
        if (error instanceof BaseError) {
          throw error.withContext(context);
        }
        
        // Otherwise, create a new BaseError with the context
        throw BaseError.from(
          error,
          ErrorType.TECHNICAL, // Default to technical error
          `${context.journey?.toUpperCase() || 'SYSTEM'}_ERROR`,
          context
        );
      }
    };

    return descriptor;
  };
}

/**
 * Helper function to get the current trace context.
 * This is a placeholder implementation that should be replaced with
 * actual integration with the tracing system used in the application.
 */
function getTraceContext(): { requestId: string; traceId: string; spanId: string } | undefined {
  // In a real implementation, this would retrieve the trace context from
  // the current execution context, possibly using a library like OpenTelemetry
  // or a custom context storage mechanism.
  
  // For now, return undefined to indicate no trace context is available
  return undefined;
}

/**
 * Decorator that automatically classifies errors thrown by the decorated method
 * into appropriate error types. This ensures consistent error classification
 * across the application.
 * 
 * @param options - Configuration options for error classification
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @ClassifyError({
 *   defaultType: ErrorType.BUSINESS,
 *   errorTypeMappings: {
 *     'ValidationError': ErrorType.VALIDATION,
 *     'NotFoundException': ErrorType.NOT_FOUND
 *   },
 *   recoveryStrategy: ErrorRecoveryStrategy.RETRY
 * })
 * async getHealthMetrics(userId: string): Promise<HealthMetric[]> {
 *   // Method implementation
 * }
 * ```
 */
export function ClassifyError(options: ClassifyErrorOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const defaultType = options.defaultType || ErrorType.TECHNICAL;
    const rethrow = options.rethrow !== false; // Default to true

    descriptor.value = async function (...args: any[]) {
      try {
        // Execute the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Determine the error type
        let errorType = defaultType;
        
        if (options.errorTypeMappings) {
          if (options.errorTypeMappings instanceof Map) {
            // Check against Map entries
            for (const [key, type] of options.errorTypeMappings.entries()) {
              if (typeof key === 'function' && error instanceof key) {
                errorType = type;
                break;
              } else if (typeof key === 'function' && key(error)) {
                errorType = type;
                break;
              }
            }
          } else {
            // Check against object entries
            const errorName = error.constructor.name;
            if (options.errorTypeMappings[errorName]) {
              errorType = options.errorTypeMappings[errorName];
            }
          }
        }
        
        // Create a classification object
        const classification: Partial<ErrorClassification> = {
          type: errorType
        };
        
        // Add recovery strategy if provided
        if (options.recoveryStrategy) {
          classification.recoveryStrategy = options.recoveryStrategy;
        }
        
        // If the error is already a BaseError, update its type
        if (error instanceof BaseError) {
          // Create a new error with the updated type
          const classifiedError = new BaseError(
            error.message,
            errorType,
            error.code,
            error.context,
            error.details,
            error.suggestion,
            error.cause
          );
          
          if (rethrow) {
            throw classifiedError;
          }
          
          return classifiedError;
        }
        
        // Otherwise, create a new BaseError with the determined type
        const classifiedError = BaseError.from(
          error,
          errorType,
          `${errorType.toUpperCase()}_ERROR`
        );
        
        if (rethrow) {
          throw classifiedError;
        }
        
        return classifiedError;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator that transforms errors thrown by the decorated method
 * into different error types based on the provided transformation function.
 * This is useful for converting low-level errors into more meaningful
 * domain-specific errors.
 * 
 * @param options - Configuration options for error transformation
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @TransformError({
 *   transformFn: (error) => {
 *     if (error.message.includes('database connection')) {
 *       return new DatabaseConnectionError('Failed to connect to database', error);
 *     }
 *     return error;
 *   },
 *   transformErrors: [ErrorType.TECHNICAL, ErrorType.EXTERNAL]
 * })
 * async getHealthMetrics(userId: string): Promise<HealthMetric[]> {
 *   // Method implementation
 * }
 * ```
 */
export function TransformError(options: TransformErrorOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Execute the original method
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Determine if the error should be transformed
        let shouldTransform = true;
        
        if (options.shouldTransform) {
          // Use custom function if provided
          shouldTransform = options.shouldTransform(error);
        } else if (options.transformErrors) {
          // Check against provided error types
          shouldTransform = false;
          
          if (error instanceof BaseError) {
            // For BaseError, check against ErrorType
            shouldTransform = options.transformErrors.includes(error.type);
          } else {
            // For other errors, check against error constructor name
            shouldTransform = options.transformErrors.includes(error.constructor.name);
          }
        }
        
        if (shouldTransform) {
          // Transform the error
          const transformedError = options.transformFn(error, ...args);
          throw transformedError;
        }
        
        // If not transformed, rethrow the original error
        throw error;
      }
    };

    return descriptor;
  };
}