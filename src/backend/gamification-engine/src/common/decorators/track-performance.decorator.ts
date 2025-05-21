import { Histogram, register } from 'prom-client';
import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
import { TraceService } from 'src/backend/packages/tracing/src/trace.service';

/**
 * Configuration options for the TrackPerformance decorator
 * Used to customize the behavior of performance tracking
 */
export interface TrackPerformanceOptions {
  /**
   * Name of the metric to be created in Prometheus
   * If not provided, it will be auto-generated based on class and method names
   */
  metricName?: string;

  /**
   * Description of the metric for Prometheus
   */
  metricDescription?: string;

  /**
   * Custom buckets for the histogram (in milliseconds)
   * Default buckets are: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
   */
  buckets?: number[];

  /**
   * Labels to be added to the metric
   * These will be combined with the default labels (className, methodName)
   */
  labels?: Record<string, string>;

  /**
   * Journey context to be added to the metric
   * Possible values: 'health', 'care', 'plan', or undefined for cross-journey
   */
  journey?: 'health' | 'care' | 'plan';

  /**
   * Whether to log the execution time
   * Default is true
   */
  logExecutionTime?: boolean;

  /**
   * Log level to use when logging execution time
   * Default is 'debug'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default histogram buckets in milliseconds
 * These buckets are designed to capture the typical range of method execution times
 * in the gamification engine, from very fast operations (5ms) to slower ones (10s)
 */
const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * Cache for histograms to avoid recreating them on each method call
 * This improves performance by reusing histogram instances
 */
const histogramCache = new Map<string, Histogram<string>>();

/**
 * Decorator that tracks the execution time of a method and reports metrics to Prometheus.
 * 
 * This decorator creates a histogram metric in Prometheus to track the execution time
 * of the decorated method. It automatically adds labels for the class name, method name,
 * and optionally the journey context. It also supports custom labels and buckets.
 * 
 * The metrics are exposed via the /metrics endpoint and can be scraped by Prometheus.
 * These metrics can then be visualized in Grafana dashboards for monitoring and alerting.
 * 
 * The decorator also logs the execution time using the LoggerService if available,
 * and includes trace and span IDs for correlation with distributed tracing systems.
 * 
 * @param options Configuration options for the decorator
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
 *   metricName: 'gamification_rule_evaluation_duration',
 *   metricDescription: 'Duration of rule evaluation in milliseconds',
 *   buckets: [10, 50, 100, 500, 1000],
 *   journey: 'health',
 *   labels: { priority: 'high' }
 * })
 * async evaluateRule(event: ProcessEventDto, profile: GameProfile): Promise<boolean> {
 *   // Method implementation
 * }
 */
export function TrackPerformance(options: TrackPerformanceOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store the original method
    const originalMethod = descriptor.value;
    
    // Get class name for metric naming and labels
    const className = target.constructor.name;
    
    // Generate metric name if not provided
    const metricName = options.metricName || 
      `gamification_${className.toLowerCase()}_${propertyKey.toLowerCase()}_duration_ms`;
    
    // Generate metric description if not provided
    const metricDescription = options.metricDescription || 
      `Duration of ${className}.${propertyKey} execution in milliseconds`;
    
    // Set up buckets for the histogram
    const buckets = options.buckets || DEFAULT_BUCKETS;
    
    // Set up default labels
    const defaultLabels = {
      className,
      methodName: propertyKey,
      ...(options.journey ? { journey: options.journey } : {})
    };
    
    // Combine default labels with custom labels
    const labels = { ...defaultLabels, ...options.labels };
    
    // Set up logging options
    const logExecutionTime = options.logExecutionTime !== undefined ? options.logExecutionTime : true;
    const logLevel = options.logLevel || 'debug';
    
    /**
     * Creates a new histogram or retrieves an existing one from the cache
     * This ensures we don't create duplicate metrics with the same name
     */
    const getHistogram = () => {
      if (!histogramCache.has(metricName)) {
        const histogram = new Histogram({
          name: metricName,
          help: metricDescription,
          labelNames: Object.keys(labels),
          buckets
        });
        
        // Register the histogram with Prometheus
        register.registerMetric(histogram);
        
        // Cache the histogram
        histogramCache.set(metricName, histogram);
      }
      
      return histogramCache.get(metricName);
    };
    
    // Replace the original method with the instrumented version
    descriptor.value = async function (...args: any[]) {
      // Get the histogram
      const histogram = getHistogram();
      
      // Start the timer
      const startTime = process.hrtime();
      
      // Get the logger if available in the instance
      const logger = (this as any).logger as LoggerService;
      
      // Get the trace service if available in the instance for correlation
      const traceService = (this as any).traceService as TraceService;
      const traceId = traceService?.getCurrentTraceId() || 'unknown';
      const spanId = traceService?.getCurrentSpanId() || 'unknown';
      
      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        
        // Calculate the execution time
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = (seconds * 1000) + (nanoseconds / 1000000);
        
        // Record the execution time in the histogram with all configured labels
        histogram.observe(labels, durationMs);
        
        // Log the execution time if enabled
        if (logExecutionTime && logger) {
          const logContext = {
            className,
            methodName: propertyKey,
            durationMs,
            traceId,
            spanId,
            ...(options.journey ? { journey: options.journey } : {})
          };
          
          switch (logLevel) {
            case 'debug':
              logger.debug(`${className}.${propertyKey} executed in ${durationMs.toFixed(2)}ms`, logContext);
              break;
            case 'info':
              logger.log(`${className}.${propertyKey} executed in ${durationMs.toFixed(2)}ms`, logContext);
              break;
            case 'warn':
              logger.warn(`${className}.${propertyKey} executed in ${durationMs.toFixed(2)}ms`, logContext);
              break;
            case 'error':
              logger.error(`${className}.${propertyKey} executed in ${durationMs.toFixed(2)}ms`, logContext);
              break;
          }
        }
        
        return result;
      } catch (error) {
        // Calculate the execution time even for failed executions to track error performance
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = (seconds * 1000) + (nanoseconds / 1000000);
        
        // Record the execution time with an error label
        histogram.observe({ ...labels, error: 'true' }, durationMs);
        
        // Log the error if a logger is available
        if (logger) {
          logger.error(
            `Error in ${className}.${propertyKey}: ${error.message}`,
            error.stack,
            {
              className,
              methodName: propertyKey,
              durationMs,
              traceId,
              spanId,
              error: error.message,
              ...(options.journey ? { journey: options.journey } : {})
            }
          );
        }
        
        // Re-throw the error
        throw error;
      }
    };
    
    return descriptor;
  };
}