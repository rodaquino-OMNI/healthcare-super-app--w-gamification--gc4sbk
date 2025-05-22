import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { DatabaseMiddleware, MiddlewareContext } from './middleware.interface';
import { JourneyType } from '../types/journey.types';

/**
 * Configuration options for the performance middleware
 */
export interface PerformanceMiddlewareOptions {
  /**
   * Threshold in milliseconds for slow query detection
   * Queries taking longer than this will be logged as slow
   */
  slowQueryThreshold?: number;

  /**
   * Journey-specific thresholds for slow query detection
   */
  journeyThresholds?: Record<JourneyType, number>;

  /**
   * Whether to enable query optimization suggestions
   */
  enableOptimizationSuggestions?: boolean;

  /**
   * Whether to collect metrics for monitoring
   */
  collectMetrics?: boolean;

  /**
   * Number of slow queries to track for pattern detection
   */
  patternDetectionSampleSize?: number;

  /**
   * Whether to log all queries (not just slow ones)
   */
  logAllQueries?: boolean;
}

/**
 * Default configuration options for the performance middleware
 */
const DEFAULT_OPTIONS: PerformanceMiddlewareOptions = {
  slowQueryThreshold: 100, // 100ms
  journeyThresholds: {
    [JourneyType.HEALTH]: 150, // Health journey has more complex queries
    [JourneyType.CARE]: 100,
    [JourneyType.PLAN]: 120,
  },
  enableOptimizationSuggestions: true,
  collectMetrics: true,
  patternDetectionSampleSize: 50,
  logAllQueries: false,
};

/**
 * Performance data for a single query execution
 */
interface QueryPerformanceData {
  /**
   * Model being queried
   */
  model: string;

  /**
   * Type of operation (findMany, findUnique, etc.)
   */
  operation: string;

  /**
   * Execution time in milliseconds
   */
  executionTime: number;

  /**
   * Timestamp when the query was executed
   */
  timestamp: number;

  /**
   * Journey type for journey-specific operations
   */
  journeyType?: JourneyType;

  /**
   * Query parameters (for pattern detection)
   */
  queryParams?: any;

  /**
   * Whether this was identified as a slow query
   */
  isSlowQuery: boolean;
}

/**
 * Implements performance monitoring middleware that tracks query execution times,
 * identifies slow queries, and collects metrics for observability dashboards.
 * 
 * This middleware automatically detects performance degradation patterns and
 * provides query optimization suggestions. It integrates with the application's
 * metrics collection system to expose database performance data for monitoring
 * and alerting.
 */
@Injectable()
export class PerformanceMiddleware implements DatabaseMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);
  private readonly options: PerformanceMiddlewareOptions;
  private readonly queryHistory: QueryPerformanceData[] = [];
  private readonly modelPerformanceMap: Map<string, number[]> = new Map();
  private readonly operationPerformanceMap: Map<string, number[]> = new Map();
  private readonly journeyPerformanceMap: Map<JourneyType, number[]> = new Map();

  /**
   * Creates a new instance of PerformanceMiddleware
   * @param options Configuration options for the middleware
   */
  constructor(options?: Partial<PerformanceMiddlewareOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logger.log('Initializing performance monitoring middleware');
    
    // Initialize journey performance maps
    Object.values(JourneyType).forEach(journeyType => {
      this.journeyPerformanceMap.set(journeyType, []);
    });
  }

  /**
   * Executes before the database operation
   * Captures the start time for performance measurement
   */
  async beforeExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
  }): Promise<any> {
    // Store start time in high-resolution
    params.context.performanceStartTime = performance.now();
    params.context.performanceStartHrTime = process.hrtime();
    
    return params;
  }

  /**
   * Executes after the database operation
   * Measures execution time and performs analysis
   */
  async afterExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
    result: any;
  }): Promise<any> {
    const { context, args, result } = params;
    const startTime = context.performanceStartTime;
    const startHrTime = context.performanceStartHrTime;
    
    if (!startTime || !startHrTime) {
      return params;
    }

    // Calculate execution time with high precision
    const hrTime = process.hrtime(startHrTime);
    const executionTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    // Get relevant context information
    const { model, operation, journeyType } = context;
    
    // Determine if this is a slow query based on thresholds
    const threshold = this.getSlowQueryThreshold(journeyType);
    const isSlowQuery = executionTimeMs > threshold;
    
    // Create performance data record
    const performanceData: QueryPerformanceData = {
      model,
      operation,
      executionTime: executionTimeMs,
      timestamp: Date.now(),
      journeyType,
      queryParams: this.sanitizeQueryParams(args),
      isSlowQuery,
    };
    
    // Store performance data for pattern detection
    this.storePerformanceData(performanceData);
    
    // Log slow queries or all queries if configured
    if (isSlowQuery || this.options.logAllQueries) {
      this.logQueryPerformance(performanceData, threshold);
    }
    
    // Collect metrics if enabled
    if (this.options.collectMetrics) {
      this.collectMetrics(performanceData);
    }
    
    // Generate optimization suggestions if enabled and it's a slow query
    if (isSlowQuery && this.options.enableOptimizationSuggestions) {
      this.suggestOptimizations(performanceData);
    }
    
    // Detect performance degradation patterns
    this.detectPerformanceDegradation(model, operation, journeyType);
    
    return params;
  }

  /**
   * Gets the appropriate slow query threshold based on journey type
   */
  private getSlowQueryThreshold(journeyType?: JourneyType): number {
    if (journeyType && this.options.journeyThresholds?.[journeyType]) {
      return this.options.journeyThresholds[journeyType];
    }
    return this.options.slowQueryThreshold || DEFAULT_OPTIONS.slowQueryThreshold;
  }

  /**
   * Sanitizes query parameters to remove sensitive information and reduce size
   */
  private sanitizeQueryParams(args: any): any {
    if (!args) return {};
    
    // Create a deep copy to avoid modifying the original args
    const sanitized = JSON.parse(JSON.stringify(args));
    
    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    this.removeSensitiveFields(sanitized, sensitiveFields);
    
    // Truncate large objects/arrays to reduce size
    return this.truncateLargeObjects(sanitized);
  }

  /**
   * Recursively removes sensitive fields from an object
   */
  private removeSensitiveFields(obj: any, sensitiveFields: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        this.removeSensitiveFields(obj[key], sensitiveFields);
      }
    });
  }

  /**
   * Truncates large objects/arrays to reduce size
   */
  private truncateLargeObjects(obj: any, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth) return '[Truncated]';
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: any = Array.isArray(obj) ? [] : {};
    
    // Limit the number of items in arrays
    if (Array.isArray(obj) && obj.length > 10) {
      for (let i = 0; i < 5; i++) {
        result[i] = this.truncateLargeObjects(obj[i], maxDepth, currentDepth + 1);
      }
      result.push(`[...${obj.length - 5} more items]`);
      return result;
    }
    
    // Process object properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.truncateLargeObjects(obj[key], maxDepth, currentDepth + 1);
      }
    }
    
    return result;
  }

  /**
   * Stores performance data for pattern detection and analysis
   */
  private storePerformanceData(data: QueryPerformanceData): void {
    // Add to query history, maintaining maximum sample size
    this.queryHistory.push(data);
    if (this.queryHistory.length > this.options.patternDetectionSampleSize) {
      this.queryHistory.shift();
    }
    
    // Update model performance map
    if (!this.modelPerformanceMap.has(data.model)) {
      this.modelPerformanceMap.set(data.model, []);
    }
    this.modelPerformanceMap.get(data.model).push(data.executionTime);
    
    // Update operation performance map
    const operationKey = `${data.model}.${data.operation}`;
    if (!this.operationPerformanceMap.has(operationKey)) {
      this.operationPerformanceMap.set(operationKey, []);
    }
    this.operationPerformanceMap.get(operationKey).push(data.executionTime);
    
    // Update journey performance map if journey type is available
    if (data.journeyType) {
      this.journeyPerformanceMap.get(data.journeyType).push(data.executionTime);
    }
  }

  /**
   * Logs query performance information
   */
  private logQueryPerformance(data: QueryPerformanceData, threshold: number): void {
    const logMethod = data.isSlowQuery ? 'warn' : 'debug';
    const journeyInfo = data.journeyType ? `[Journey: ${data.journeyType}]` : '';
    
    this.logger[logMethod](
      `${data.isSlowQuery ? 'SLOW QUERY' : 'Query'}: ${data.model}.${data.operation} ${journeyInfo} - ${data.executionTime.toFixed(2)}ms (threshold: ${threshold}ms)`,
      {
        model: data.model,
        operation: data.operation,
        executionTime: data.executionTime,
        threshold,
        journeyType: data.journeyType,
        timestamp: new Date(data.timestamp).toISOString(),
      }
    );
  }

  /**
   * Collects metrics for monitoring systems
   */
  private collectMetrics(data: QueryPerformanceData): void {
    // This would integrate with the application's metrics collection system
    // For example, sending metrics to Prometheus, Datadog, or other monitoring systems
    // Implementation depends on the specific metrics collection system used
    
    // Example metrics to collect:
    // 1. Query execution time by model and operation
    // 2. Slow query count by model and operation
    // 3. Average execution time by journey
    // 4. 95th percentile execution time by journey
    
    // For now, we'll just log that metrics would be collected
    this.logger.debug(
      `Collecting metrics for ${data.model}.${data.operation}`,
      {
        metric: 'database_query_execution_time',
        value: data.executionTime,
        tags: {
          model: data.model,
          operation: data.operation,
          journeyType: data.journeyType || 'unknown',
          isSlowQuery: data.isSlowQuery,
        },
      }
    );
  }

  /**
   * Suggests optimizations for slow queries
   */
  private suggestOptimizations(data: QueryPerformanceData): void {
    const suggestions: string[] = [];
    
    // Check for common optimization opportunities based on the model and operation
    if (data.operation === 'findMany') {
      suggestions.push('Consider adding pagination to limit result set size');
      suggestions.push('Ensure proper indexes are in place for filter conditions');
      suggestions.push('Consider using select to limit returned fields');
    }
    
    if (data.operation === 'count' || data.operation === 'aggregate') {
      suggestions.push('Consider caching aggregation results');
      suggestions.push('Ensure proper indexes for aggregation fields');
    }
    
    if (data.queryParams?.include) {
      suggestions.push('Review included relations for optimization opportunities');
      suggestions.push('Consider fetching related data in separate queries if not always needed');
    }
    
    if (data.queryParams?.where) {
      suggestions.push('Review where conditions for index utilization');
      suggestions.push('Consider using compound indexes for multiple filter conditions');
    }
    
    // Log suggestions if any were generated
    if (suggestions.length > 0) {
      this.logger.warn(
        `Optimization suggestions for slow query ${data.model}.${data.operation}:`,
        { suggestions, executionTime: data.executionTime }
      );
    }
  }

  /**
   * Detects performance degradation patterns
   */
  private detectPerformanceDegradation(
    model: string,
    operation: string,
    journeyType?: JourneyType
  ): void {
    // Check for degradation in model performance
    this.checkPerformanceDegradation(
      this.modelPerformanceMap.get(model),
      `model ${model}`
    );
    
    // Check for degradation in operation performance
    const operationKey = `${model}.${operation}`;
    this.checkPerformanceDegradation(
      this.operationPerformanceMap.get(operationKey),
      `operation ${operationKey}`
    );
    
    // Check for degradation in journey performance if journey type is available
    if (journeyType) {
      this.checkPerformanceDegradation(
        this.journeyPerformanceMap.get(journeyType),
        `journey ${journeyType}`
      );
    }
  }

  /**
   * Checks for performance degradation in a series of execution times
   */
  private checkPerformanceDegradation(times: number[], context: string): void {
    if (!times || times.length < 10) return;
    
    // Get the last 10 execution times
    const recentTimes = times.slice(-10);
    
    // Calculate the average of the first 5 and last 5 execution times
    const firstHalfAvg = this.calculateAverage(recentTimes.slice(0, 5));
    const secondHalfAvg = this.calculateAverage(recentTimes.slice(5));
    
    // Calculate the percentage increase
    const percentageIncrease = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    // Log a warning if there's a significant degradation (>20%)
    if (percentageIncrease > 20) {
      this.logger.warn(
        `Performance degradation detected for ${context}: ${percentageIncrease.toFixed(2)}% increase in execution time`,
        {
          context,
          firstHalfAvg,
          secondHalfAvg,
          percentageIncrease,
          recentTimes,
        }
      );
    }
  }

  /**
   * Calculates the average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Gets performance statistics for a specific model and operation
   */
  public getPerformanceStats(
    model: string,
    operation?: string,
    journeyType?: JourneyType
  ): {
    avgExecutionTime: number;
    maxExecutionTime: number;
    p95ExecutionTime: number;
    slowQueryCount: number;
    totalQueries: number;
  } {
    // Filter query history based on parameters
    const filteredHistory = this.queryHistory.filter(data => {
      let match = data.model === model;
      if (operation) match = match && data.operation === operation;
      if (journeyType) match = match && data.journeyType === journeyType;
      return match;
    });
    
    if (filteredHistory.length === 0) {
      return {
        avgExecutionTime: 0,
        maxExecutionTime: 0,
        p95ExecutionTime: 0,
        slowQueryCount: 0,
        totalQueries: 0,
      };
    }
    
    // Calculate statistics
    const executionTimes = filteredHistory.map(data => data.executionTime);
    const avgExecutionTime = this.calculateAverage(executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const slowQueryCount = filteredHistory.filter(data => data.isSlowQuery).length;
    
    // Calculate 95th percentile
    const sortedTimes = [...executionTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95ExecutionTime = sortedTimes[p95Index] || maxExecutionTime;
    
    return {
      avgExecutionTime,
      maxExecutionTime,
      p95ExecutionTime,
      slowQueryCount,
      totalQueries: filteredHistory.length,
    };
  }

  /**
   * Gets journey-specific performance statistics
   */
  public getJourneyPerformanceStats(
    journeyType: JourneyType
  ): {
    avgExecutionTime: number;
    maxExecutionTime: number;
    p95ExecutionTime: number;
    slowQueryCount: number;
    totalQueries: number;
    modelsBreakdown: Record<string, number>;
  } {
    // Filter query history for the specified journey
    const journeyHistory = this.queryHistory.filter(
      data => data.journeyType === journeyType
    );
    
    if (journeyHistory.length === 0) {
      return {
        avgExecutionTime: 0,
        maxExecutionTime: 0,
        p95ExecutionTime: 0,
        slowQueryCount: 0,
        totalQueries: 0,
        modelsBreakdown: {},
      };
    }
    
    // Calculate statistics
    const executionTimes = journeyHistory.map(data => data.executionTime);
    const avgExecutionTime = this.calculateAverage(executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const slowQueryCount = journeyHistory.filter(data => data.isSlowQuery).length;
    
    // Calculate 95th percentile
    const sortedTimes = [...executionTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95ExecutionTime = sortedTimes[p95Index] || maxExecutionTime;
    
    // Calculate model breakdown
    const modelsBreakdown: Record<string, number> = {};
    journeyHistory.forEach(data => {
      if (!modelsBreakdown[data.model]) {
        modelsBreakdown[data.model] = 0;
      }
      modelsBreakdown[data.model] += data.executionTime;
    });
    
    return {
      avgExecutionTime,
      maxExecutionTime,
      p95ExecutionTime,
      slowQueryCount,
      totalQueries: journeyHistory.length,
      modelsBreakdown,
    };
  }

  /**
   * Resets performance statistics
   */
  public resetStats(): void {
    this.queryHistory.length = 0;
    this.modelPerformanceMap.clear();
    this.operationPerformanceMap.clear();
    
    // Reset journey performance maps
    Object.values(JourneyType).forEach(journeyType => {
      this.journeyPerformanceMap.set(journeyType, []);
    });
    
    this.logger.log('Performance statistics have been reset');
  }
}