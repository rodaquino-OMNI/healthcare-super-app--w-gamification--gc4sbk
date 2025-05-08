import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
import { TracingService } from 'src/backend/shared/src/tracing/tracing.service';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

/**
 * Log level enum for the LogMethod decorator
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'error', // Using error since LoggerService doesn't have a fatal level
}

/**
 * Options for the LogMethod decorator
 */
export interface LogMethodOptions {
  /** Log level for method entry (default: DEBUG) */
  entryLevel?: LogLevel;
  /** Log level for method exit (default: DEBUG) */
  exitLevel?: LogLevel;
  /** Log level for method errors (default: ERROR) */
  errorLevel?: LogLevel;
  /** Whether to log method parameters (default: true) */
  logParams?: boolean;
  /** Whether to log method return value (default: true) */
  logResult?: boolean;
  /** Array of parameter names or indices to redact from logs */
  sensitiveParams?: (string | number)[];
  /** Custom context name (default: class and method name) */
  context?: string;
  /** Maximum length for logged result (default: 1000) */
  maxResultLength?: number;
  /** Whether to include execution time in logs (default: true) */
  logExecutionTime?: boolean;
  /** Whether to include journey context in logs (default: true) */
  includeJourneyContext?: boolean;
}

/**
 * Default options for the LogMethod decorator
 */
const defaultOptions: LogMethodOptions = {
  entryLevel: LogLevel.DEBUG,
  exitLevel: LogLevel.DEBUG,
  errorLevel: LogLevel.ERROR,
  logParams: true,
  logResult: true,
  sensitiveParams: [],
  maxResultLength: 1000,
  logExecutionTime: true,
  includeJourneyContext: true,
};

/**
 * Sanitizes parameters by redacting sensitive information
 * @param params Parameters to sanitize
 * @param sensitiveParams Array of parameter names or indices to redact
 * @returns Sanitized parameters object
 */
function sanitizeParams(params: any, sensitiveParams: (string | number)[] = []): any {
  if (!params) return params;
  
  // Handle array parameters
  if (Array.isArray(params)) {
    return params.map((param, index) => {
      if (sensitiveParams.includes(index)) {
        return '[REDACTED]';
      }
      
      // Recursively sanitize nested objects
      if (param && typeof param === 'object') {
        return sanitizeParams(param, sensitiveParams);
      }
      
      return param;
    });
  }
  
  // Handle object parameters
  if (typeof params === 'object' && params !== null) {
    const sanitized = { ...params };
    
    // First pass: redact sensitive top-level properties
    sensitiveParams.forEach(param => {
      if (typeof param === 'string' && param in sanitized) {
        sanitized[param] = '[REDACTED]';
      }
    });
    
    // Second pass: recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (
        !sensitiveParams.includes(key) && 
        sanitized[key] && 
        typeof sanitized[key] === 'object'
      ) {
        sanitized[key] = sanitizeParams(sanitized[key], sensitiveParams);
      }
    });
    
    return sanitized;
  }
  
  return params;
}

/**
 * Extracts context information from the execution context if available
 * @param instance The class instance
 * @param methodName The method name
 * @returns Context information object
 */
function extractContextInfo(instance: any, methodName: string): Record<string, any> {
  const contextInfo: Record<string, any> = {};
  
  // Try to extract request context if available
  if (instance.request) {
    contextInfo.requestId = instance.request.id || instance.request.headers?.['x-request-id'];
    contextInfo.userId = instance.request.user?.id;
    contextInfo.journey = instance.request.headers?.['x-journey'];
    contextInfo.ip = instance.request.ip || instance.request.headers?.['x-forwarded-for'];
  }
  
  // Try to extract from event context if available (for event handlers)
  if (instance.event) {
    contextInfo.eventId = instance.event.id;
    contextInfo.userId = instance.event.userId || contextInfo.userId;
    contextInfo.journey = instance.event.journey || contextInfo.journey;
    contextInfo.eventType = instance.event.type;
    contextInfo.eventSource = instance.event.source;
  }
  
  // Try to extract from controller/service context
  if (instance.userId && !contextInfo.userId) {
    contextInfo.userId = instance.userId;
  }
  
  if (instance.journey && !contextInfo.journey) {
    contextInfo.journey = instance.journey;
  }
  
  // Add correlation ID if available (for distributed tracing)
  if (instance.correlationId) {
    contextInfo.correlationId = instance.correlationId;
  }
  
  return contextInfo;
}

/**
 * Decorator that logs method execution details including parameters, return values, and execution time.
 * Enhances observability by providing consistent, structured logging across the gamification engine.
 * 
 * @param options Configuration options for the decorator
 * @returns Method decorator function
 * 
 * @example
 * // Basic usage
 * @LogMethod()
 * async findAll(): Promise<Rule[]> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With custom options
 * @LogMethod({
 *   entryLevel: LogLevel.INFO,
 *   sensitiveParams: ['password', 'token'],
 *   context: 'AuthService'
 * })
 * async login(username: string, password: string): Promise<LoginResult> {
 *   // Method implementation
 * }
 */
export function LogMethod(options: LogMethodOptions = {}): MethodDecorator {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey.toString();
    const context = mergedOptions.context || `${className}.${methodName}`;
    
    descriptor.value = async function (...args: any[]) {
      // Get logger and tracer instances
      // We need to get them here rather than importing directly to avoid circular dependencies
      const logger: LoggerService = this.logger || 
                                   (this.loggerService as LoggerService) || 
                                   new LoggerService();
      
      const tracer: TracingService | undefined = this.tracer || this.tracingService;
      
      // Extract context information
      const contextInfo = extractContextInfo(this, methodName);
      
      // Format context string if journey context is enabled
      let fullContext = context;
      if (mergedOptions.includeJourneyContext) {
        const contextStr = Object.entries(contextInfo)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ');
        
        fullContext = contextStr ? `${context} [${contextStr}]` : context;
      }
      
      // Log method entry
      if (mergedOptions.logParams) {
        const sanitizedParams = sanitizeParams(args, mergedOptions.sensitiveParams);
        logger[mergedOptions.entryLevel](
          `→ ${methodName}(${JSON.stringify(sanitizedParams)})`,
          fullContext
        );
      } else {
        logger[mergedOptions.entryLevel](`→ ${methodName}()`, fullContext);
      }
      
      const startTime = Date.now();
      
      try {
        // Execute the original method, optionally within a tracing span
        let result;
        if (tracer) {
          // Use the tracing service if available
          result = await tracer.createSpan(`${className}.${methodName}`, () => 
            originalMethod.apply(this, args)
          );
        } else if (trace && context) {
          // Fallback to direct OpenTelemetry API if available
          const tracer = trace.getTracer('gamification-engine');
          const span = tracer.startSpan(`${className}.${methodName}`);
          
          try {
            // Add context information to span
            Object.entries(contextInfo).forEach(([key, value]) => {
              if (value !== undefined) {
                span.setAttribute(key, String(value));
              }
            });
            
            // Execute method within span context
            result = await trace.with(trace.setSpan(context.active(), span), () => 
              originalMethod.apply(this, args)
            );
            
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (error) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
          } finally {
            span.end();
          }
        } else {
          // No tracing available, just execute the method
          result = await originalMethod.apply(this, args);
        }
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        // Log method exit
        let logMessage = `← ${methodName}`;
        
        // Add execution time if enabled
        if (mergedOptions.logExecutionTime) {
          logMessage += ` (${executionTime}ms)`;
        }
        
        // Add result if enabled
        if (mergedOptions.logResult) {
          // For large results, limit what we log
          const maxLength = mergedOptions.maxResultLength || 1000;
          
          let resultStr;
          if (result === null) {
            resultStr = 'null';
          } else if (result === undefined) {
            resultStr = 'undefined';
          } else if (typeof result === 'object') {
            try {
              const jsonStr = JSON.stringify(result);
              resultStr = jsonStr.length > maxLength ? 
                jsonStr.substring(0, maxLength) + '... [truncated]' : 
                jsonStr;
            } catch (error) {
              resultStr = '[Object - Unable to stringify]';
            }
          } else {
            resultStr = String(result);
            if (resultStr.length > maxLength) {
              resultStr = resultStr.substring(0, maxLength) + '... [truncated]';
            }
          }
          
          logMessage += ` => ${resultStr}`;
        }
        
        logger[mergedOptions.exitLevel](logMessage, fullContext);
        
        return result;
      } catch (error) {
        // Calculate execution time until error
        const executionTime = Date.now() - startTime;
        
        // Log error with stack trace
        let errorMessage = `✖ ${methodName} failed`;
        
        // Add execution time if enabled
        if (mergedOptions.logExecutionTime) {
          errorMessage += ` after ${executionTime}ms`;
        }
        
        // Add error details
        errorMessage += `: ${error.message}`;
        
        // Add journey context to error if available
        if (contextInfo.journey) {
          errorMessage += ` [journey=${contextInfo.journey}]`;
        }
        
        // Add user context to error if available
        if (contextInfo.userId) {
          errorMessage += ` [userId=${contextInfo.userId}]`;
        }
        
        logger[mergedOptions.errorLevel](
          errorMessage,
          error.stack,
          fullContext
        );
        
        // Re-throw the error to maintain the original behavior
        throw error;
      }
    };
    
    return descriptor;
  };
}