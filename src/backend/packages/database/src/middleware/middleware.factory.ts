/**
 * Factory for creating and configuring middleware instances for database operations.
 * 
 * This factory provides methods for creating standard middleware chains optimized for
 * different journey services and operation types. It implements smart middleware selection
 * based on operation context and configuration, allowing for performance optimizations.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DatabaseMiddleware,
  LoggingMiddleware,
  PerformanceMiddleware,
  TransformationMiddleware,
  CircuitBreakerMiddleware,
  MiddlewareContext,
  TransformationRule,
} from './middleware.interface';

import {
  MiddlewareRegistry,
  JourneyContext,
  MiddlewareConfig,
  EnvironmentProfile,
} from './middleware.registry';

/**
 * Factory for creating middleware instances and chains
 */
@Injectable()
export class MiddlewareFactory {
  private readonly logger = new Logger(MiddlewareFactory.name);
  
  /**
   * Creates a new middleware factory
   * 
   * @param registry Middleware registry for managing middleware instances
   * @param configService Configuration service for environment settings
   */
  constructor(
    private readonly registry: MiddlewareRegistry,
    private readonly configService: ConfigService,
  ) {}
  
  /**
   * Create a logging middleware instance
   * 
   * @param config Configuration for the middleware
   * @returns Logging middleware instance
   */
  createLoggingMiddleware(config: Partial<MiddlewareConfig> = {}): LoggingMiddleware {
    const loggingMiddleware: LoggingMiddleware = {
      beforeExecute: async <T>(params: T, context: MiddlewareContext): Promise<T> => {
        // Log the operation start
        this.logger.debug(
          `[${context.journeyContext}] Starting ${context.operationType} operation on ${context.entityName}`,
          { params, context },
        );
        return params;
      },
      
      afterExecute: async <T>(result: T, context: MiddlewareContext): Promise<T> => {
        // Log the operation completion
        this.logger.debug(
          `[${context.journeyContext}] Completed ${context.operationType} operation on ${context.entityName}`,
          { resultType: result ? typeof result : 'null', context },
        );
        return result;
      },
      
      onError: async (error: Error, context: MiddlewareContext): Promise<Error> => {
        // Log the operation error
        this.logger.error(
          `[${context.journeyContext}] Error in ${context.operationType} operation on ${context.entityName}: ${error.message}`,
          error.stack,
          { context },
        );
        return error;
      },
      
      setLogLevel: (level: string): void => {
        // Set the log level
        this.logger.debug(`Setting log level to ${level}`);
      },
      
      setSensitiveFields: (fields: string[]): void => {
        // Set sensitive fields to be redacted
        this.logger.debug(`Setting sensitive fields: ${fields.join(', ')}`);
      },
    };
    
    // Register the middleware with the registry
    const id = config.id || `logging-${Date.now()}`;
    this.registry.registerLoggingMiddleware(loggingMiddleware, {
      id,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 100, // High priority for logging
      journeyContexts: config.journeyContexts ?? ['global'],
      environmentProfiles: config.environmentProfiles ?? ['development', 'test', 'production'],
      options: config.options,
    });
    
    return loggingMiddleware;
  }
  
  /**
   * Create a performance middleware instance
   * 
   * @param config Configuration for the middleware
   * @returns Performance middleware instance
   */
  createPerformanceMiddleware(config: Partial<MiddlewareConfig> = {}): PerformanceMiddleware {
    const metrics: Record<string, any> = {};
    let slowQueryThreshold = 100; // Default 100ms
    
    const performanceMiddleware: PerformanceMiddleware = {
      beforeExecute: async <T>(params: T, context: MiddlewareContext): Promise<T> => {
        // Start timing the operation
        context.metadata = context.metadata || {};
        context.metadata.startTime = Date.now();
        return params;
      },
      
      afterExecute: async <T>(result: T, context: MiddlewareContext): Promise<T> => {
        // Calculate execution time
        const startTime = context.metadata?.startTime || Date.now();
        const executionTime = Date.now() - startTime;
        
        // Track metrics
        const metricKey = `${context.journeyContext || 'unknown'}.${context.operationType || 'unknown'}`;
        if (!metrics[metricKey]) {
          metrics[metricKey] = {
            count: 0,
            totalTime: 0,
            avgTime: 0,
            maxTime: 0,
            slowQueries: 0,
          };
        }
        
        metrics[metricKey].count += 1;
        metrics[metricKey].totalTime += executionTime;
        metrics[metricKey].avgTime = metrics[metricKey].totalTime / metrics[metricKey].count;
        metrics[metricKey].maxTime = Math.max(metrics[metricKey].maxTime, executionTime);
        
        // Check for slow queries
        if (executionTime > slowQueryThreshold) {
          metrics[metricKey].slowQueries += 1;
          this.logger.warn(
            `Slow query detected: ${context.operationType} on ${context.entityName} took ${executionTime}ms`,
            { context, executionTime, threshold: slowQueryThreshold },
          );
        }
        
        return result;
      },
      
      setSlowQueryThreshold: (thresholdMs: number): void => {
        slowQueryThreshold = thresholdMs;
      },
      
      getMetrics: (): Record<string, any> => {
        return { ...metrics };
      },
    };
    
    // Register the middleware with the registry
    const id = config.id || `performance-${Date.now()}`;
    this.registry.registerPerformanceMiddleware(performanceMiddleware, {
      id,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 90, // High priority but after logging
      journeyContexts: config.journeyContexts ?? ['global'],
      environmentProfiles: config.environmentProfiles ?? ['development', 'test', 'production'],
      options: config.options,
    });
    
    return performanceMiddleware;
  }
  
  /**
   * Create a transformation middleware instance
   * 
   * @param config Configuration for the middleware
   * @returns Transformation middleware instance
   */
  createTransformationMiddleware(config: Partial<MiddlewareConfig> = {}): TransformationMiddleware {
    const rules: TransformationRule[] = [];
    
    const transformationMiddleware: TransformationMiddleware = {
      beforeExecute: async <T>(params: T, context: MiddlewareContext): Promise<T> => {
        // Apply transformation rules
        let transformedParams = params;
        
        // Filter rules that apply to this operation
        const applicableRules = rules.filter(rule => 
          rule.operationTypes.includes(context.operationType) &&
          (!rule.entityTypes.length || rule.entityTypes.includes(context.entityName || '')) &&
          (!rule.journeyContexts?.length || 
            rule.journeyContexts.includes('*') || 
            rule.journeyContexts.includes(context.journeyContext || ''))
        );
        
        // Sort rules by priority
        applicableRules.sort((a, b) => b.priority - a.priority);
        
        // Apply rules
        for (const rule of applicableRules) {
          try {
            transformedParams = await Promise.resolve(rule.transform(transformedParams, context));
          } catch (error) {
            this.logger.error(
              `Error applying transformation rule ${rule.id}: ${error.message}`,
              error.stack,
            );
          }
        }
        
        return transformedParams;
      },
      
      addTransformation: (rule: TransformationRule): void => {
        rules.push(rule);
        rules.sort((a, b) => b.priority - a.priority);
      },
      
      removeTransformation: (ruleId: string): void => {
        const index = rules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
          rules.splice(index, 1);
        }
      },
    };
    
    // Register the middleware with the registry
    const id = config.id || `transformation-${Date.now()}`;
    this.registry.registerTransformationMiddleware(transformationMiddleware, {
      id,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 80, // Medium-high priority
      journeyContexts: config.journeyContexts ?? ['global'],
      environmentProfiles: config.environmentProfiles ?? ['development', 'test', 'production'],
      options: config.options,
    });
    
    return transformationMiddleware;
  }
  
  /**
   * Create a circuit breaker middleware instance
   * 
   * @param config Configuration for the middleware
   * @returns Circuit breaker middleware instance
   */
  createCircuitBreakerMiddleware(config: Partial<MiddlewareConfig> = {}): CircuitBreakerMiddleware {
    // Circuit breaker state
    type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    let state: CircuitState = 'CLOSED';
    const failures: Record<string, number> = {};
    const lastFailure: Record<string, number> = {};
    const failureThreshold = config.options?.failureThreshold || 5;
    const resetTimeout = config.options?.resetTimeout || 30000; // 30 seconds
    
    const circuitBreakerMiddleware: CircuitBreakerMiddleware = {
      beforeExecute: async <T>(params: T, context: MiddlewareContext): Promise<T> => {
        const operationType = context.operationType;
        const journeyContext = context.journeyContext || 'global';
        const circuitKey = `${journeyContext}.${operationType}`;
        
        // Check if circuit is open
        if (state === 'OPEN') {
          const now = Date.now();
          const lastFailureTime = lastFailure[circuitKey] || 0;
          
          // Check if it's time to try again
          if (now - lastFailureTime > resetTimeout) {
            // Move to half-open state
            state = 'HALF_OPEN';
            this.logger.log(`Circuit breaker for ${circuitKey} moved to HALF_OPEN state`);
          } else {
            // Circuit is still open
            throw new Error(`Circuit breaker is open for ${operationType} operations`);
          }
        }
        
        return params;
      },
      
      afterExecute: async <T>(result: T, context: MiddlewareContext): Promise<T> => {
        const operationType = context.operationType;
        const journeyContext = context.journeyContext || 'global';
        const circuitKey = `${journeyContext}.${operationType}`;
        
        // If we're in half-open state and the operation succeeded, close the circuit
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures[circuitKey] = 0;
          this.logger.log(`Circuit breaker for ${circuitKey} moved to CLOSED state`);
        }
        
        return result;
      },
      
      onError: async (error: Error, context: MiddlewareContext): Promise<Error> => {
        const operationType = context.operationType;
        const journeyContext = context.journeyContext || 'global';
        const circuitKey = `${journeyContext}.${operationType}`;
        
        // Increment failure count
        failures[circuitKey] = (failures[circuitKey] || 0) + 1;
        lastFailure[circuitKey] = Date.now();
        
        // Check if we need to open the circuit
        if (failures[circuitKey] >= failureThreshold) {
          state = 'OPEN';
          this.logger.warn(
            `Circuit breaker for ${circuitKey} moved to OPEN state after ${failures[circuitKey]} failures`,
          );
        }
        
        return error;
      },
      
      executeWithCircuitBreaker: async <T>(
        operation: () => Promise<T>,
        operationType: string,
        journeyContext?: string,
      ): Promise<T> => {
        const context: MiddlewareContext = {
          operationType,
          journeyContext: journeyContext || 'global',
        };
        
        // Check circuit state
        await circuitBreakerMiddleware.beforeExecute({}, context);
        
        try {
          // Execute operation
          const result = await operation();
          
          // Update circuit state
          await circuitBreakerMiddleware.afterExecute(result, context);
          
          return result;
        } catch (error) {
          // Handle error and update circuit state
          const transformedError = await circuitBreakerMiddleware.onError!(error, context);
          throw transformedError;
        }
      },
      
      getState: (): string => {
        return state;
      },
      
      reset: (): void => {
        state = 'CLOSED';
        Object.keys(failures).forEach(key => {
          failures[key] = 0;
        });
        this.logger.log('Circuit breaker reset to CLOSED state');
      },
    };
    
    // Register the middleware with the registry
    const id = config.id || `circuit-breaker-${Date.now()}`;
    this.registry.registerCircuitBreakerMiddleware(circuitBreakerMiddleware, {
      id,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 70, // Medium priority
      journeyContexts: config.journeyContexts ?? ['global'],
      environmentProfiles: config.environmentProfiles ?? ['development', 'test', 'production'],
      options: {
        failureThreshold,
        resetTimeout,
        ...config.options,
      },
    });
    
    return circuitBreakerMiddleware;
  }
  
  /**
   * Create a standard middleware chain for a journey
   * 
   * @param journeyContext Journey context to create middleware for
   * @returns Array of middleware instances
   */
  createStandardMiddlewareChain(journeyContext: JourneyContext): DatabaseMiddleware[] {
    // Create standard middleware instances
    const logging = this.createLoggingMiddleware({
      id: `${journeyContext}-logging`,
      journeyContexts: [journeyContext, 'global'],
    });
    
    const performance = this.createPerformanceMiddleware({
      id: `${journeyContext}-performance`,
      journeyContexts: [journeyContext, 'global'],
    });
    
    const transformation = this.createTransformationMiddleware({
      id: `${journeyContext}-transformation`,
      journeyContexts: [journeyContext, 'global'],
    });
    
    const circuitBreaker = this.createCircuitBreakerMiddleware({
      id: `${journeyContext}-circuit-breaker`,
      journeyContexts: [journeyContext, 'global'],
    });
    
    // Add journey-specific transformations
    if (journeyContext === 'health') {
      // Add health-specific transformations
      transformation.addTransformation({
        id: 'health-metrics-optimization',
        entityTypes: ['HealthMetric'],
        operationTypes: ['findMany', 'groupBy', 'aggregate'],
        priority: 100,
        journeyContexts: ['health'],
        transform: <T>(params: T, context: MiddlewareContext): T => {
          // Add TimescaleDB-specific optimizations
          return params;
        },
      });
    } else if (journeyContext === 'care') {
      // Add care-specific transformations
      transformation.addTransformation({
        id: 'care-appointment-optimization',
        entityTypes: ['Appointment'],
        operationTypes: ['findMany', 'findUnique'],
        priority: 100,
        journeyContexts: ['care'],
        transform: <T>(params: T, context: MiddlewareContext): T => {
          // Add appointment-specific optimizations
          return params;
        },
      });
    } else if (journeyContext === 'plan') {
      // Add plan-specific transformations
      transformation.addTransformation({
        id: 'plan-claim-optimization',
        entityTypes: ['Claim'],
        operationTypes: ['findMany', 'findUnique'],
        priority: 100,
        journeyContexts: ['plan'],
        transform: <T>(params: T, context: MiddlewareContext): T => {
          // Add claim-specific optimizations
          return params;
        },
      });
    }
    
    // Return middleware chain
    return [logging, performance, transformation, circuitBreaker];
  }
  
  /**
   * Create a middleware chain optimized for a specific operation type
   * 
   * @param journeyContext Journey context to create middleware for
   * @param operationType Type of operation to optimize for
   * @returns Array of middleware instances
   */
  createOptimizedMiddlewareChain(
    journeyContext: JourneyContext,
    operationType: string,
  ): DatabaseMiddleware[] {
    // Start with standard middleware chain
    const standardChain = this.createStandardMiddlewareChain(journeyContext);
    
    // Optimize based on operation type
    if (operationType === 'findUnique' || operationType === 'findFirst') {
      // For single-record lookups, we can skip some middleware for performance
      return standardChain.filter(mw => 
        mw instanceof LoggingMiddleware || mw instanceof CircuitBreakerMiddleware
      );
    } else if (operationType === 'create' || operationType === 'update' || operationType === 'delete') {
      // For write operations, we need all middleware
      return standardChain;
    } else if (operationType === 'findMany' || operationType === 'groupBy' || operationType === 'aggregate') {
      // For read operations with potentially large result sets, optimize transformations
      const transformationMiddleware = standardChain.find(
        mw => mw instanceof TransformationMiddleware
      ) as TransformationMiddleware;
      
      if (transformationMiddleware) {
        // Add optimization for large result sets
        transformationMiddleware.addTransformation({
          id: `${journeyContext}-large-result-optimization`,
          entityTypes: [],
          operationTypes: [operationType],
          priority: 200, // Higher priority than standard transformations
          journeyContexts: [journeyContext],
          transform: <T>(params: T, context: MiddlewareContext): T => {
            // Add pagination or limit if not present
            if (params && typeof params === 'object') {
              const paramsObj = params as Record<string, any>;
              if (!paramsObj.take && !paramsObj.first && !paramsObj.limit) {
                paramsObj.take = 100; // Default limit
              }
            }
            return params;
          },
        });
      }
      
      return standardChain;
    }
    
    // Default to standard chain
    return standardChain;
  }
  
  /**
   * Initialize standard middleware for all journeys
   */
  initializeStandardMiddleware(): void {
    // Create standard middleware for each journey
    this.createStandardMiddlewareChain('global');
    this.createStandardMiddlewareChain('health');
    this.createStandardMiddlewareChain('care');
    this.createStandardMiddlewareChain('plan');
    
    this.logger.log('Initialized standard middleware for all journeys');
  }
}