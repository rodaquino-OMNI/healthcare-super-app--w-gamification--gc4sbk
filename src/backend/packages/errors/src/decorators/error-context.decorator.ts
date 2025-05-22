/**
 * @file Error context decorators for enhancing errors with contextual information
 * 
 * This file provides decorators for enhancing errors with contextual information,
 * automatically classifying errors, and transforming between error types.
 * These decorators ensure all errors have consistent structure and classification,
 * enabling better error tracking, reporting, and user feedback across the system.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Add execution context to errors
 * @WithErrorContext({
 *   component: 'HealthMetricsService',
 *   journey: JourneyType.HEALTH
 * })
 * async recordMetric(userId: string, metric: HealthMetric): Promise<void> { ... }
 * 
 * // Automatically classify uncaught errors
 * @ClassifyError({
 *   defaultType: ErrorType.TECHNICAL,
 *   defaultCode: 'HEALTH_METRIC_001'
 * })
 * async processHealthData(data: HealthData): Promise<ProcessedData> { ... }
 * 
 * // Transform between error types
 * @TransformError({
 *   transformer: (error) => {
 *     if (error instanceof DatabaseError) {
 *       return new BaseError('Database operation failed', ErrorType.TECHNICAL, 'DB_001', { isTransient: true });
 *     }
 *     return error;
 *   }
 * })
 * async fetchUserProfile(userId: string): Promise<UserProfile> { ... }
 * ```
 */

import { context, trace } from '@opentelemetry/api';
import { BaseError, ErrorContext, ErrorType, JourneyType } from '../base';
import { ErrorTransformConfig } from './types';

/**
 * Interface for WithErrorContext decorator configuration
 */
export interface ErrorContextConfig extends Partial<ErrorContext> {
  /**
   * Component or service where the error occurred
   */
  component?: string;
  
  /**
   * Journey context where the error occurred
   */
  journey?: JourneyType;
  
  /**
   * Operation being performed when the error occurred
   */
  operation?: string;
  
  /**
   * Additional metadata relevant to the error
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether to extract request context from NestJS execution context
   * @default true
   */
  extractRequestContext?: boolean;
  
  /**
   * Whether to extract user context from request
   * @default true
   */
  extractUserContext?: boolean;
}

/**
 * Interface for ClassifyError decorator configuration
 */
export interface ErrorClassificationConfig {
  /**
   * Default error type to use for uncaught errors
   * @default ErrorType.TECHNICAL
   */
  defaultType?: ErrorType;
  
  /**
   * Default error code to use for uncaught errors
   */
  defaultCode: string;
  
  /**
   * Default error message to use for uncaught errors
   * @default 'An unexpected error occurred'
   */
  defaultMessage?: string;
  
  /**
   * Custom error classifier function
   * @param error - The error to classify
   * @returns Classified error type or undefined to use default
   */
  classifier?: (error: Error) => ErrorType | undefined;
  
  /**
   * Whether to include stack trace in error
   * @default true in development, false in production
   */
  includeStack?: boolean;
  
  /**
   * Whether to rethrow the error after classification
   * @default true
   */
  rethrow?: boolean;
}

/**
 * Extracts request context from the current execution context if available
 * @returns Request context information or empty object if not available
 */
function extractRequestContext(): Pick<ErrorContext, 'requestId'> {
  const result: Pick<ErrorContext, 'requestId'> = {};
  
  // Try to get the current trace context
  const activeSpan = trace.getSpan(context.active());
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    // Use trace ID as request ID if available
    result.requestId = spanContext.traceId;
  }
  
  return result;
}

/**
 * Extracts user context from the request if available
 * This is a placeholder implementation that should be customized based on the actual
 * authentication mechanism used in the application
 * @returns User context information or empty object if not available
 */
function extractUserContext(): Pick<ErrorContext, 'userId'> {
  const result: Pick<ErrorContext, 'userId'> = {};
  
  // This is a placeholder implementation
  // In a real application, this would extract user information from the request
  // For example, from JWT token or session
  
  return result;
}

/**
 * Decorator that adds execution context to errors thrown by the decorated method
 * Enhances errors with information such as component, journey, operation, user ID,
 * request ID, and other contextual data to facilitate debugging and monitoring
 * 
 * @param config - Configuration for the error context
 * @returns Method decorator
 */
export function WithErrorContext(config: ErrorContextConfig = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Build error context
        const errorContext: ErrorContext = {
          ...config,
          // Extract component name from class if not provided
          component: config.component || this.constructor.name,
          // Extract operation name from method if not provided
          operation: config.operation || propertyKey.toString(),
          // Add timestamp
          timestamp: new Date()
        };
        
        // Extract request context if enabled
        if (config.extractRequestContext !== false) {
          Object.assign(errorContext, extractRequestContext());
        }
        
        // Extract user context if enabled
        if (config.extractUserContext !== false) {
          Object.assign(errorContext, extractUserContext());
        }
        
        // If error is already a BaseError, enhance it with additional context
        if (error instanceof BaseError) {
          // Merge the new context with the existing context
          Object.assign(error.context, errorContext);
          throw error;
        }
        
        // Otherwise, wrap the error in a BaseError with the context
        throw BaseError.from(
          error,
          error instanceof Error ? error.message : 'An unexpected error occurred',
          ErrorType.TECHNICAL,
          'UNEXPECTED_ERROR',
          errorContext
        );
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that automatically classifies uncaught errors into appropriate ErrorTypes
 * Ensures all errors thrown by the decorated method have consistent structure and classification
 * 
 * @param config - Configuration for error classification
 * @returns Method decorator
 */
export function ClassifyError(config: ErrorClassificationConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // If error is already a BaseError, just rethrow it
        if (error instanceof BaseError) {
          if (config.rethrow !== false) {
            throw error;
          }
          return;
        }
        
        // Determine error type using custom classifier or default
        let errorType = config.defaultType || ErrorType.TECHNICAL;
        if (config.classifier) {
          const classifiedType = config.classifier(error);
          if (classifiedType) {
            errorType = classifiedType;
          }
        }
        
        // Create error context
        const errorContext: ErrorContext = {
          component: this.constructor.name,
          operation: propertyKey.toString(),
          timestamp: new Date()
        };
        
        // Extract request context
        Object.assign(errorContext, extractRequestContext());
        
        // Create a new BaseError with the classified type
        const classifiedError = new BaseError(
          error instanceof Error ? error.message : config.defaultMessage || 'An unexpected error occurred',
          errorType,
          config.defaultCode,
          errorContext,
          undefined,
          error instanceof Error ? error : undefined
        );
        
        if (config.rethrow !== false) {
          throw classifiedError;
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that transforms errors from one type to another
 * Useful for converting low-level errors to domain-specific errors
 * or standardizing error formats across different services
 * 
 * @param config - Configuration for error transformation
 * @returns Method decorator
 */
export function TransformError(config: ErrorTransformConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Check if the error should be transformed
        let shouldTransform = true;
        
        if (config.condition && !config.condition(error)) {
          shouldTransform = false;
        }
        
        if (config.errorTypes && config.errorTypes.length > 0) {
          const matchesType = config.errorTypes.some(type => error instanceof type);
          if (!matchesType) {
            shouldTransform = false;
          }
        }
        
        if (shouldTransform) {
          // Transform the error
          const transformedError = config.transformer(error, ...args);
          throw transformedError;
        }
        
        // If not transformed, rethrow the original error
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator that combines WithErrorContext and ClassifyError
 * Provides a convenient way to add both context and classification in one decorator
 * 
 * @param contextConfig - Configuration for error context
 * @param classificationConfig - Configuration for error classification
 * @returns Method decorator
 */
export function WithErrorHandling(
  contextConfig: ErrorContextConfig = {},
  classificationConfig: ErrorClassificationConfig
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Apply ClassifyError first, then WithErrorContext
    // This ensures errors are classified before context is added
    let newDescriptor = descriptor;
    
    // Apply ClassifyError
    newDescriptor = ClassifyError(classificationConfig)(target, propertyKey, newDescriptor) || newDescriptor;
    
    // Apply WithErrorContext
    newDescriptor = WithErrorContext(contextConfig)(target, propertyKey, newDescriptor) || newDescriptor;
    
    return newDescriptor;
  };
}

/**
 * This module is part of the AUSTA SuperApp error handling framework.
 * It provides decorators for enhancing errors with contextual information,
 * automatically classifying errors, and transforming between error types.
 * 
 * These decorators implement the error handling patterns described in the technical specification:
 * - Error classification into client, system, transient, and external dependency errors
 * - Structured error responses with codes and messages
 * - Error aggregation and trend analysis
 * - Integration with tracing for correlation between errors and request context
 * 
 * The decorators ensure all errors have consistent structure and classification,
 * enabling better error tracking, reporting, and user feedback across the system.
 */