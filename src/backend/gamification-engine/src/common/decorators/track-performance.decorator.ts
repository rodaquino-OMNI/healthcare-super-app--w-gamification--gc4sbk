import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

/**
 * Interface for TrackPerformance decorator options
 */
export interface TrackPerformanceOptions {
  /**
   * Custom name for the metric. If not provided, it will use className_methodName
   */
  metricName?: string;

  /**
   * Description for the metric
   */
  description?: string;

  /**
   * Custom histogram buckets for latency measurement (in milliseconds)
   * Default: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
   */
  buckets?: number[];

  /**
   * Journey context for the metric (health, care, plan)
   * Used for journey-specific monitoring
   */
  journey?: 'health' | 'care' | 'plan' | 'all';

  /**
   * Log level for performance tracking
   * Default: 'debug'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Whether to include this metric in critical path monitoring
   * Default: false
   */
  criticalPath?: boolean;
}

// Cache for histograms to avoid creating duplicates
const histogramCache = new Map<string, Histogram<string>>();

// Cache for counters to track errors
const errorCounterCache = new Map<string, Counter<string>>();

// Default histogram buckets (in milliseconds)
const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * Method decorator that tracks execution time of methods and reports metrics to the monitoring system.
 * Enables performance tracking across the gamification engine services for identifying bottlenecks.
 * 
 * @param options Configuration options for performance tracking
 * @returns Method decorator
 * 
 * @example
 * // Basic usage
 * @TrackPerformance()
 * async processEvent(event: ProcessEventDto): Promise<any> {
 *   // Method implementation
 * }
 * 
 * @example
 * // With custom options
 * @TrackPerformance({
 *   metricName: 'custom_event_processing',
 *   description: 'Time taken to process gamification events',
 *   buckets: [10, 50, 100, 500, 1000],
 *   journey: 'health',
 *   logLevel: 'info',
 *   criticalPath: true
 * })
 * async processHealthEvent(event: HealthEventDto): Promise<any> {
 *   // Method implementation
 * }
 */
export function TrackPerformance(options: TrackPerformanceOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Get the original method
    const originalMethod = descriptor.value;
    
    // Get class name for metric naming
    const className = target.constructor.name;
    
    // Set default options
    const metricName = options.metricName || `${className}_${propertyKey}`;
    const description = options.description || `Execution time of ${className}.${propertyKey}`;
    const buckets = options.buckets || DEFAULT_BUCKETS;
    const journey = options.journey || 'all';
    const logLevel = options.logLevel || 'debug';
    const criticalPath = options.criticalPath || false;
    
    // Create a unique metric name with proper format for Prometheus
    const prometheusMetricName = `gamification_${metricName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_duration_seconds`;
    
    // Create or get histogram from cache
    if (!histogramCache.has(prometheusMetricName)) {
      const histogram = new Histogram({
        name: prometheusMetricName,
        help: description,
        labelNames: ['class', 'method', 'journey', 'success', 'critical_path'],
        buckets: buckets.map(ms => ms / 1000), // Convert ms to seconds for Prometheus
      });
      
      histogramCache.set(prometheusMetricName, histogram);
      register.registerMetric(histogram);
    }
    
    // Create or get error counter from cache
    const errorCounterName = `gamification_${metricName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_errors_total`;
    if (!errorCounterCache.has(errorCounterName)) {
      const errorCounter = new Counter({
        name: errorCounterName,
        help: `Error count for ${className}.${propertyKey}`,
        labelNames: ['class', 'method', 'journey', 'error_type', 'critical_path'],
      });
      
      errorCounterCache.set(errorCounterName, errorCounter);
      register.registerMetric(errorCounter);
    }
    
    // Replace the original method with our instrumented version
    descriptor.value = async function (...args: any[]) {
      // Get the histogram and error counter
      const histogram = histogramCache.get(prometheusMetricName);
      const errorCounter = errorCounterCache.get(errorCounterName);
      
      // Get logger and tracer from DI container if available
      let logger: LoggerService;
      let tracer: TracingService;
      
      try {
        // Try to get logger and tracer from the instance if it's a NestJS service
        if (this.logger && typeof this.logger.log === 'function') {
          logger = this.logger;
        }
        
        if (this.tracer && typeof this.tracer.getTraceId === 'function') {
          tracer = this.tracer;
        }
      } catch (error) {
        // If we can't get the logger or tracer, we'll continue without them
      }
      
      // Start timing
      const startTime = process.hrtime();
      let success = false;
      let errorType = null;
      
      try {
        // Create a span for this operation if tracing is available
        let span;
        if (tracer) {
          span = tracer.startSpan(`${className}.${propertyKey}`);
          span.setAttributes({
            'method.class': className,
            'method.name': propertyKey,
            'journey': journey,
            'critical_path': criticalPath,
          });
        }
        
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        success = true;
        
        // End the span if it exists
        if (span) {
          span.end();
        }
        
        return result;
      } catch (error) {
        // Handle errors
        success = false;
        errorType = error.name || 'UnknownError';
        
        // Increment error counter
        errorCounter.inc({
          class: className,
          method: propertyKey,
          journey,
          error_type: errorType,
          critical_path: criticalPath.toString(),
        });
        
        // Log error with trace ID if available
        if (logger) {
          const traceId = tracer ? tracer.getTraceId() : 'unknown';
          logger.error(
            `Performance error in ${className}.${propertyKey}`,
            error.stack,
            {
              traceId,
              journey,
              method: propertyKey,
              class: className,
              criticalPath,
            }
          );
        }
        
        // Re-throw the error
        throw error;
      } finally {
        // Calculate duration
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds + nanoseconds / 1e9; // Convert to seconds
        
        // Record the duration in the histogram
        histogram.observe(
          {
            class: className,
            method: propertyKey,
            journey,
            success: success.toString(),
            critical_path: criticalPath.toString(),
          },
          duration
        );
        
        // Log performance metrics if logger is available
        if (logger) {
          const durationMs = duration * 1000; // Convert to milliseconds for logging
          const traceId = tracer ? tracer.getTraceId() : 'unknown';
          
          const logMessage = `Performance: ${className}.${propertyKey} took ${durationMs.toFixed(2)}ms`;
          const logContext = {
            durationMs,
            class: className,
            method: propertyKey,
            journey,
            success,
            criticalPath,
            traceId,
          };
          
          // Log at the appropriate level
          switch (logLevel) {
            case 'debug':
              logger.debug(logMessage, logContext);
              break;
            case 'info':
              logger.log(logMessage, logContext);
              break;
            case 'warn':
              logger.warn(logMessage, logContext);
              break;
            case 'error':
              logger.error(logMessage, null, logContext);
              break;
            default:
              logger.debug(logMessage, logContext);
          }
          
          // Additional logging for critical path methods that exceed thresholds
          if (criticalPath && durationMs > 50) { // 50ms threshold for critical paths
            logger.warn(
              `Critical path performance warning: ${className}.${propertyKey} exceeded threshold (${durationMs.toFixed(2)}ms > 50ms)`,
              {
                durationMs,
                class: className,
                method: propertyKey,
                journey,
                traceId,
              }
            );
          }
        }
      }
    };
    
    return descriptor;
  };
}