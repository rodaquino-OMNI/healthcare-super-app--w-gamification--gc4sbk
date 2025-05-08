import { Injectable, Logger } from '@nestjs/common';
import { MiddlewareContext, PerformanceMiddleware } from './middleware.interface';
import { JourneyType } from '../types/journey.types';
import { DatabaseErrorType } from '../errors/database-error.types';
import { DatabaseException } from '../errors/database-error.exception';

/**
 * Configuration options for PerformanceMiddleware
 */
export interface PerformanceMiddlewareOptions {
  /**
   * Threshold in milliseconds for identifying slow queries
   * @default 1000 (1 second)
   */
  slowQueryThreshold?: number;

  /**
   * Whether to enable metrics collection
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Whether to track stack traces for slow queries
   * @default true in development, false in production
   */
  trackStackTrace?: boolean;

  /**
   * Maximum number of slow queries to store in memory
   * @default 100
   */
  maxSlowQueries?: number;

  /**
   * Whether to automatically suggest query optimizations
   * @default true
   */
  suggestOptimizations?: boolean;

  /**
   * Interval in milliseconds for detecting performance degradation patterns
   * @default 60000 (1 minute)
   */
  degradationDetectionInterval?: number;

  /**
   * Journey type for journey-specific performance tracking
   */
  journeyType?: JourneyType;

  /**
   * Whether to log slow queries
   * @default true
   */
  logSlowQueries?: boolean;

  /**
   * Whether to emit metrics to the metrics collection system
   * @default true
   */
  emitMetrics?: boolean;
}

/**
 * Represents a slow query with its execution context and performance metrics
 */
interface SlowQuery {
  /**
   * Query parameters
   */
  params: any;

  /**
   * Execution time in milliseconds
   */
  executionTime: number;

  /**
   * Timestamp when the query was executed
   */
  timestamp: number;

  /**
   * Stack trace if tracking is enabled
   */
  stackTrace?: string;

  /**
   * Entity name being queried
   */
  entityName?: string;

  /**
   * Operation type (findMany, findUnique, create, update, etc.)
   */
  operationType?: string;

  /**
   * Journey context for the query
   */
  journeyContext?: string;

  /**
   * Optimization suggestions if available
   */
  optimizationSuggestions?: string[];
}

/**
 * Performance metrics collected by the middleware
 */
interface PerformanceMetrics {
  /**
   * Total number of queries executed
   */
  totalQueries: number;

  /**
   * Total number of slow queries detected
   */
  slowQueries: number;

  /**
   * Average execution time in milliseconds
   */
  averageExecutionTime: number;

  /**
   * Maximum execution time in milliseconds
   */
  maxExecutionTime: number;

  /**
   * Metrics by entity type
   */
  entityMetrics: Record<string, {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
  }>;

  /**
   * Metrics by operation type
   */
  operationMetrics: Record<string, {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
  }>;

  /**
   * Metrics by journey context
   */
  journeyMetrics: Record<string, {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
  }>;

  /**
   * Performance degradation patterns detected
   */
  degradationPatterns: {
    entity: string;
    operation: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: number;
  }[];
}

/**
 * Optimization suggestion for a specific query pattern
 */
interface OptimizationSuggestion {
  /**
   * Pattern to match for this suggestion
   */
  pattern: RegExp | string;

  /**
   * Entity types this suggestion applies to
   */
  entityTypes?: string[];

  /**
   * Operation types this suggestion applies to
   */
  operationTypes?: string[];

  /**
   * Suggestion message
   */
  suggestion: string;

  /**
   * Priority of the suggestion (higher is more important)
   */
  priority: number;
}

/**
 * Implements performance monitoring middleware that tracks query execution times,
 * identifies slow queries, and collects metrics for observability dashboards.
 * It automatically detects performance degradation patterns and provides query
 * optimization suggestions.
 *
 * This middleware integrates with the application's metrics collection system to
 * expose database performance data for monitoring and alerting.
 *
 * @example
 * // Register the middleware in a NestJS module
 * @Module({
 *   providers: [
 *     {
 *       provide: 'DATABASE_MIDDLEWARE',
 *       useFactory: () => {
 *         const performanceMiddleware = new PerformanceMiddleware({
 *           slowQueryThreshold: 500,
 *           enableMetrics: true,
 *           journeyType: JourneyType.HEALTH,
 *         });
 *         return [performanceMiddleware];
 *       },
 *     },
 *   ],
 * })
 * export class DatabaseModule {}
 */
@Injectable()
export class PerformanceMiddleware implements PerformanceMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);
  private slowQueryThreshold: number;
  private enableMetrics: boolean;
  private trackStackTrace: boolean;
  private maxSlowQueries: number;
  private suggestOptimizations: boolean;
  private degradationDetectionInterval: number;
  private journeyType?: JourneyType;
  private logSlowQueries: boolean;
  private emitMetrics: boolean;

  // Performance tracking data
  private slowQueries: SlowQuery[] = [];
  private metrics: PerformanceMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageExecutionTime: 0,
    maxExecutionTime: 0,
    entityMetrics: {},
    operationMetrics: {},
    journeyMetrics: {},
    degradationPatterns: [],
  };

  // Running totals for calculating averages
  private totalExecutionTime = 0;

  // Optimization suggestions
  private optimizationSuggestions: OptimizationSuggestion[] = [
    {
      pattern: /findMany.*where.*OR.*OR/,
      operationTypes: ['findMany'],
      suggestion: 'Consider adding an index for the fields used in OR conditions',
      priority: 8,
    },
    {
      pattern: /orderBy.*createdAt/,
      suggestion: 'Ensure you have an index on createdAt field for sorting operations',
      priority: 7,
    },
    {
      pattern: /findMany.*skip.*take/,
      operationTypes: ['findMany'],
      suggestion: 'For large offsets, consider using cursor-based pagination instead of offset pagination',
      priority: 9,
    },
    {
      pattern: /include.*include.*include/,
      suggestion: 'Deep nested includes can cause performance issues. Consider splitting into separate queries',
      priority: 10,
    },
    {
      pattern: /where.*contains/,
      suggestion: 'Text search with contains is not using indexes efficiently. Consider using full-text search for better performance',
      priority: 8,
    },
    {
      pattern: /findMany.*where.*NOT/,
      operationTypes: ['findMany'],
      suggestion: 'Queries with NOT conditions often cannot use indexes efficiently. Consider restructuring the query',
      priority: 7,
    },
    {
      pattern: /count.*where/,
      operationTypes: ['count'],
      suggestion: 'For frequent count operations, consider maintaining a counter in a separate table or cache',
      priority: 6,
    },
    {
      pattern: /findMany.*where.*in.*\[.*\]/,
      operationTypes: ['findMany'],
      suggestion: 'Large IN clauses can cause performance issues. Consider batching or using a JOIN instead',
      priority: 8,
    },
    {
      pattern: /update.*data.*connect/,
      operationTypes: ['update'],
      suggestion: 'Connecting relations in updates can be slow for multiple records. Consider batching updates',
      priority: 7,
    },
    {
      pattern: /create.*data.*connect.*connect/,
      operationTypes: ['create'],
      suggestion: 'Creating records with multiple relations can be slow. Consider creating the record first, then updating relations',
      priority: 7,
    },
  ];

  // Degradation detection timer
  private degradationDetectionTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new instance of PerformanceMiddleware
   * @param options Configuration options
   */
  constructor(options: PerformanceMiddlewareOptions = {}) {
    this.slowQueryThreshold = options.slowQueryThreshold ?? 1000;
    this.enableMetrics = options.enableMetrics ?? true;
    this.trackStackTrace = options.trackStackTrace ?? process.env.NODE_ENV !== 'production';
    this.maxSlowQueries = options.maxSlowQueries ?? 100;
    this.suggestOptimizations = options.suggestOptimizations ?? true;
    this.degradationDetectionInterval = options.degradationDetectionInterval ?? 60000;
    this.journeyType = options.journeyType;
    this.logSlowQueries = options.logSlowQueries ?? true;
    this.emitMetrics = options.emitMetrics ?? true;

    // Start degradation detection if enabled
    if (this.enableMetrics && this.degradationDetectionInterval > 0) {
      this.startDegradationDetection();
    }

    this.logger.log(`Performance middleware initialized with slow query threshold: ${this.slowQueryThreshold}ms`);
  }

  /**
   * Hook executed before a database operation
   * Initializes timing for the operation
   * 
   * @param params Operation parameters
   * @param context Operation context
   * @returns Original parameters unchanged
   */
  beforeExecute<T>(params: T, context: MiddlewareContext): T {
    // Add start time to context for tracking execution time
    context.metadata = context.metadata || {};
    context.metadata.performanceTracking = {
      startTime: Date.now(),
    };

    return params;
  }

  /**
   * Hook executed after a database operation
   * Calculates execution time and tracks performance metrics
   * 
   * @param result Operation result
   * @param context Operation context
   * @returns Original result unchanged
   */
  afterExecute<T>(result: T, context: MiddlewareContext): T {
    if (!context.metadata?.performanceTracking?.startTime) {
      return result;
    }

    const startTime = context.metadata.performanceTracking.startTime;
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Track metrics if enabled
    if (this.enableMetrics) {
      this.trackQueryPerformance(executionTime, context, result);
    }

    // Check for slow queries
    if (executionTime > this.slowQueryThreshold) {
      this.handleSlowQuery(executionTime, context, result);
    }

    return result;
  }

  /**
   * Hook executed when a database operation fails
   * Tracks performance-related errors
   * 
   * @param error Error that occurred
   * @param context Operation context
   * @returns Original error or enhanced error with performance context
   */
  onError(error: Error, context: MiddlewareContext): Error {
    if (!context.metadata?.performanceTracking?.startTime) {
      return error;
    }

    const startTime = context.metadata.performanceTracking.startTime;
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Add performance context to the error
    if (error instanceof DatabaseException) {
      error.metadata = error.metadata || {};
      error.metadata.executionTime = executionTime;
      error.metadata.slowQuery = executionTime > this.slowQueryThreshold;

      // Add optimization suggestions if it's a performance-related error
      if (error.type === DatabaseErrorType.PERFORMANCE) {
        error.metadata.optimizationSuggestions = this.generateOptimizationSuggestions(context);
      }
    }

    return error;
  }

  /**
   * Configure slow query threshold
   * @param thresholdMs Threshold in milliseconds
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
    this.logger.log(`Slow query threshold updated to ${thresholdMs}ms`);
  }

  /**
   * Get performance metrics
   * @returns Current performance metrics
   */
  getMetrics(): Record<string, any> {
    return {
      ...this.metrics,
      slowQueries: this.slowQueries.length,
      currentSlowQueryThreshold: this.slowQueryThreshold,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get the most recent slow queries
   * @param limit Maximum number of queries to return
   * @returns Array of slow queries
   */
  getSlowQueries(limit: number = 10): SlowQuery[] {
    return this.slowQueries.slice(0, limit);
  }

  /**
   * Clear all collected metrics and slow queries
   */
  clearMetrics(): void {
    this.slowQueries = [];
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      entityMetrics: {},
      operationMetrics: {},
      journeyMetrics: {},
      degradationPatterns: [],
    };
    this.totalExecutionTime = 0;
    this.logger.log('Performance metrics cleared');
  }

  /**
   * Enable or disable metrics collection
   * @param enabled Whether metrics collection should be enabled
   */
  setMetricsEnabled(enabled: boolean): void {
    this.enableMetrics = enabled;
    this.logger.log(`Metrics collection ${enabled ? 'enabled' : 'disabled'}`);

    // Start or stop degradation detection based on metrics setting
    if (enabled && this.degradationDetectionInterval > 0) {
      this.startDegradationDetection();
    } else if (!enabled && this.degradationDetectionTimer) {
      this.stopDegradationDetection();
    }
  }

  /**
   * Add a custom optimization suggestion
   * @param suggestion Optimization suggestion to add
   */
  addOptimizationSuggestion(suggestion: OptimizationSuggestion): void {
    this.optimizationSuggestions.push(suggestion);
  }

  /**
   * Remove an optimization suggestion by pattern
   * @param pattern Pattern to remove
   */
  removeOptimizationSuggestion(pattern: string | RegExp): void {
    this.optimizationSuggestions = this.optimizationSuggestions.filter(s => {
      if (typeof s.pattern === 'string' && typeof pattern === 'string') {
        return s.pattern !== pattern;
      }
      if (s.pattern instanceof RegExp && pattern instanceof RegExp) {
        return s.pattern.toString() !== pattern.toString();
      }
      return true;
    });
  }

  /**
   * Tracks query performance metrics
   * @param executionTime Execution time in milliseconds
   * @param context Operation context
   * @param result Query result
   */
  private trackQueryPerformance(
    executionTime: number,
    context: MiddlewareContext,
    result: any,
  ): void {
    const { operationType, entityName, journeyContext } = context;

    // Update global metrics
    this.metrics.totalQueries++;
    this.totalExecutionTime += executionTime;
    this.metrics.averageExecutionTime = this.totalExecutionTime / this.metrics.totalQueries;
    this.metrics.maxExecutionTime = Math.max(this.metrics.maxExecutionTime, executionTime);

    // Update entity metrics
    if (entityName) {
      if (!this.metrics.entityMetrics[entityName]) {
        this.metrics.entityMetrics[entityName] = {
          totalQueries: 0,
          slowQueries: 0,
          averageExecutionTime: 0,
          maxExecutionTime: 0,
        };
      }

      const entityMetrics = this.metrics.entityMetrics[entityName];
      entityMetrics.totalQueries++;
      entityMetrics.averageExecutionTime = 
        (entityMetrics.averageExecutionTime * (entityMetrics.totalQueries - 1) + executionTime) / 
        entityMetrics.totalQueries;
      entityMetrics.maxExecutionTime = Math.max(entityMetrics.maxExecutionTime, executionTime);

      if (executionTime > this.slowQueryThreshold) {
        entityMetrics.slowQueries++;
      }
    }

    // Update operation metrics
    if (operationType) {
      if (!this.metrics.operationMetrics[operationType]) {
        this.metrics.operationMetrics[operationType] = {
          totalQueries: 0,
          slowQueries: 0,
          averageExecutionTime: 0,
          maxExecutionTime: 0,
        };
      }

      const opMetrics = this.metrics.operationMetrics[operationType];
      opMetrics.totalQueries++;
      opMetrics.averageExecutionTime = 
        (opMetrics.averageExecutionTime * (opMetrics.totalQueries - 1) + executionTime) / 
        opMetrics.totalQueries;
      opMetrics.maxExecutionTime = Math.max(opMetrics.maxExecutionTime, executionTime);

      if (executionTime > this.slowQueryThreshold) {
        opMetrics.slowQueries++;
      }
    }

    // Update journey metrics
    if (journeyContext) {
      if (!this.metrics.journeyMetrics[journeyContext]) {
        this.metrics.journeyMetrics[journeyContext] = {
          totalQueries: 0,
          slowQueries: 0,
          averageExecutionTime: 0,
          maxExecutionTime: 0,
        };
      }

      const journeyMetrics = this.metrics.journeyMetrics[journeyContext];
      journeyMetrics.totalQueries++;
      journeyMetrics.averageExecutionTime = 
        (journeyMetrics.averageExecutionTime * (journeyMetrics.totalQueries - 1) + executionTime) / 
        journeyMetrics.totalQueries;
      journeyMetrics.maxExecutionTime = Math.max(journeyMetrics.maxExecutionTime, executionTime);

      if (executionTime > this.slowQueryThreshold) {
        journeyMetrics.slowQueries++;
      }
    }

    // Emit metrics if enabled
    if (this.emitMetrics) {
      this.emitPerformanceMetrics(executionTime, context);
    }
  }

  /**
   * Handles a detected slow query
   * @param executionTime Execution time in milliseconds
   * @param context Operation context
   * @param result Query result
   */
  private handleSlowQuery(
    executionTime: number,
    context: MiddlewareContext,
    result: any,
  ): void {
    const { operationType, entityName, journeyContext } = context;

    // Create slow query record
    const slowQuery: SlowQuery = {
      params: context.params,
      executionTime,
      timestamp: Date.now(),
      entityName,
      operationType,
      journeyContext,
    };

    // Add stack trace if enabled
    if (this.trackStackTrace) {
      const stackTrace = new Error().stack;
      slowQuery.stackTrace = stackTrace;
    }

    // Generate optimization suggestions if enabled
    if (this.suggestOptimizations) {
      slowQuery.optimizationSuggestions = this.generateOptimizationSuggestions(context);
    }

    // Add to slow queries list (maintain max size)
    this.slowQueries.unshift(slowQuery);
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries.pop();
    }

    // Update slow query count
    this.metrics.slowQueries++;

    // Log slow query if enabled
    if (this.logSlowQueries) {
      this.logSlowQuery(slowQuery);
    }
  }

  /**
   * Logs a slow query with relevant details
   * @param slowQuery Slow query to log
   */
  private logSlowQuery(slowQuery: SlowQuery): void {
    const { entityName, operationType, executionTime, journeyContext } = slowQuery;
    
    let message = `Slow query detected: ${executionTime}ms`;
    
    if (entityName) {
      message += ` | Entity: ${entityName}`;
    }
    
    if (operationType) {
      message += ` | Operation: ${operationType}`;
    }
    
    if (journeyContext) {
      message += ` | Journey: ${journeyContext}`;
    }
    
    if (slowQuery.optimizationSuggestions?.length) {
      message += ` | Suggestions: ${slowQuery.optimizationSuggestions.length}`;
    }
    
    this.logger.warn(message, {
      executionTime,
      entityName,
      operationType,
      journeyContext,
      timestamp: new Date(slowQuery.timestamp).toISOString(),
      suggestions: slowQuery.optimizationSuggestions,
    });
  }

  /**
   * Generates optimization suggestions for a query
   * @param context Operation context
   * @returns Array of optimization suggestions
   */
  private generateOptimizationSuggestions(context: MiddlewareContext): string[] {
    const { operationType, entityName, params } = context;
    const suggestions: string[] = [];
    
    // Skip if no params or operation type
    if (!params || !operationType) {
      return suggestions;
    }
    
    // Convert params to string for pattern matching
    const paramsString = JSON.stringify(params);
    
    // Check each optimization suggestion
    for (const suggestion of this.optimizationSuggestions) {
      // Skip if entity type doesn't match
      if (suggestion.entityTypes && entityName && 
          !suggestion.entityTypes.includes(entityName)) {
        continue;
      }
      
      // Skip if operation type doesn't match
      if (suggestion.operationTypes && 
          !suggestion.operationTypes.includes(operationType)) {
        continue;
      }
      
      // Check if pattern matches
      let matches = false;
      if (typeof suggestion.pattern === 'string') {
        matches = paramsString.includes(suggestion.pattern);
      } else if (suggestion.pattern instanceof RegExp) {
        matches = suggestion.pattern.test(paramsString);
      }
      
      if (matches) {
        suggestions.push(suggestion.suggestion);
      }
    }
    
    // Sort suggestions by priority (highest first)
    return suggestions.sort((a, b) => {
      const suggestionA = this.optimizationSuggestions.find(s => s.suggestion === a);
      const suggestionB = this.optimizationSuggestions.find(s => s.suggestion === b);
      
      return (suggestionB?.priority || 0) - (suggestionA?.priority || 0);
    });
  }

  /**
   * Starts the degradation detection timer
   */
  private startDegradationDetection(): void {
    if (this.degradationDetectionTimer) {
      clearInterval(this.degradationDetectionTimer);
    }
    
    this.degradationDetectionTimer = setInterval(() => {
      this.detectPerformanceDegradation();
    }, this.degradationDetectionInterval);
    
    this.logger.log(`Performance degradation detection started with interval: ${this.degradationDetectionInterval}ms`);
  }

  /**
   * Stops the degradation detection timer
   */
  private stopDegradationDetection(): void {
    if (this.degradationDetectionTimer) {
      clearInterval(this.degradationDetectionTimer);
      this.degradationDetectionTimer = null;
      this.logger.log('Performance degradation detection stopped');
    }
  }

  /**
   * Detects performance degradation patterns
   */
  private detectPerformanceDegradation(): void {
    // Skip if not enough data
    if (this.metrics.totalQueries < 10) {
      return;
    }
    
    const now = Date.now();
    const patterns: {
      entity: string;
      operation: string;
      pattern: string;
      severity: 'low' | 'medium' | 'high';
      detectedAt: number;
    }[] = [];
    
    // Check entity metrics for degradation
    for (const [entity, metrics] of Object.entries(this.metrics.entityMetrics)) {
      // High slow query ratio
      if (metrics.totalQueries > 5 && metrics.slowQueries / metrics.totalQueries > 0.2) {
        patterns.push({
          entity,
          operation: '*',
          pattern: 'High slow query ratio',
          severity: 'high',
          detectedAt: now,
        });
      }
      
      // Increasing average execution time
      if (metrics.totalQueries > 10 && metrics.averageExecutionTime > this.slowQueryThreshold * 0.7) {
        patterns.push({
          entity,
          operation: '*',
          pattern: 'Increasing average execution time',
          severity: 'medium',
          detectedAt: now,
        });
      }
    }
    
    // Check operation metrics for degradation
    for (const [operation, metrics] of Object.entries(this.metrics.operationMetrics)) {
      // High slow query ratio for specific operations
      if (metrics.totalQueries > 5 && metrics.slowQueries / metrics.totalQueries > 0.2) {
        patterns.push({
          entity: '*',
          operation,
          pattern: 'High slow query ratio for operation',
          severity: 'high',
          detectedAt: now,
        });
      }
    }
    
    // Check journey metrics for degradation
    for (const [journey, metrics] of Object.entries(this.metrics.journeyMetrics)) {
      // High slow query ratio for specific journey
      if (metrics.totalQueries > 5 && metrics.slowQueries / metrics.totalQueries > 0.2) {
        patterns.push({
          entity: '*',
          operation: '*',
          pattern: `High slow query ratio for ${journey} journey`,
          severity: 'high',
          detectedAt: now,
        });
      }
    }
    
    // Add new patterns to metrics
    if (patterns.length > 0) {
      this.metrics.degradationPatterns = [
        ...patterns,
        ...this.metrics.degradationPatterns,
      ].slice(0, 20); // Keep only the 20 most recent patterns
      
      // Log degradation patterns
      for (const pattern of patterns) {
        this.logger.warn(
          `Performance degradation detected: ${pattern.pattern} | ` +
          `Entity: ${pattern.entity} | Operation: ${pattern.operation} | ` +
          `Severity: ${pattern.severity}`,
          { pattern }
        );
      }
    }
  }

  /**
   * Emits performance metrics to the metrics collection system
   * @param executionTime Execution time in milliseconds
   * @param context Operation context
   */
  private emitPerformanceMetrics(
    executionTime: number,
    context: MiddlewareContext,
  ): void {
    const { operationType, entityName, journeyContext } = context;
    
    try {
      // This would typically integrate with a metrics system like Prometheus, Datadog, etc.
      // For now, we'll just log that metrics would be emitted
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          'Emitting performance metrics',
          {
            executionTime,
            operationType,
            entityName,
            journeyContext,
            isSlowQuery: executionTime > this.slowQueryThreshold,
          }
        );
      }
      
      // In a real implementation, you would emit metrics to your metrics system here
      // Example with Prometheus (pseudo-code):
      /*
      if (global.metrics?.databaseQueryDuration) {
        global.metrics.databaseQueryDuration
          .labels({
            operation: operationType || 'unknown',
            entity: entityName || 'unknown',
            journey: journeyContext || 'unknown',
          })
          .observe(executionTime / 1000); // Convert to seconds for Prometheus
      }
      
      if (global.metrics?.databaseSlowQueries && executionTime > this.slowQueryThreshold) {
        global.metrics.databaseSlowQueries
          .labels({
            operation: operationType || 'unknown',
            entity: entityName || 'unknown',
            journey: journeyContext || 'unknown',
          })
          .inc();
      }
      */
    } catch (error) {
      // Don't let metrics emission failures affect the application
      this.logger.error('Failed to emit performance metrics', error);
    }
  }
}