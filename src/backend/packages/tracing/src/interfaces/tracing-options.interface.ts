/**
 * TracingOptions interface for configuring the OpenTelemetry tracing system.
 * This interface provides comprehensive configuration options for initializing
 * the tracing module with appropriate service information, sampling rates,
 * and exporter configurations.
 */
export interface TracingOptions {
  /**
   * Service information for identifying the source of telemetry data
   */
  service: {
    /**
     * Name of the service generating telemetry data
     * @default 'austa-service'
     */
    name: string;

    /**
     * Version of the service
     * @default '1.0.0'
     */
    version?: string;

    /**
     * Environment the service is running in (e.g., 'production', 'staging', 'development')
     * @default 'development'
     */
    environment?: string;

    /**
     * Journey context for the service (e.g., 'health', 'care', 'plan')
     * Used for journey-specific trace configuration
     */
    journey?: 'health' | 'care' | 'plan' | 'shared';
  };

  /**
   * Sampling configuration for controlling trace data volume
   */
  sampling?: {
    /**
     * Sampling rate between 0.0 and 1.0
     * 1.0 means 100% of traces are sampled
     * 0.0 means 0% of traces are sampled
     * @default 1.0
     */
    rate?: number;

    /**
     * Whether to always sample errors regardless of sampling rate
     * @default true
     */
    alwaysSampleErrors?: boolean;

    /**
     * List of paths or operations that should always be sampled
     * regardless of sampling rate
     */
    alwaysSamplePaths?: string[];
  };

  /**
   * Exporter configuration for sending telemetry data to backends
   */
  exporter?: {
    /**
     * Type of exporter to use
     * @default 'otlp'
     */
    type?: 'otlp' | 'prometheus' | 'console' | 'jaeger' | 'zipkin' | 'none';

    /**
     * OTLP exporter specific configuration
     * Used when type is 'otlp'
     */
    otlp?: {
      /**
       * Protocol to use for OTLP exporter
       * @default 'http/protobuf'
       */
      protocol?: 'grpc' | 'http/protobuf';

      /**
       * Endpoint URL for the OTLP exporter
       * For OTLP/HTTP, defaults to 'http://localhost:4318/v1/traces'
       * For OTLP/gRPC, defaults to 'http://localhost:4317'
       */
      endpoint?: string;

      /**
       * Headers to include with OTLP requests
       * Useful for authentication or other metadata
       */
      headers?: Record<string, string>;

      /**
       * Timeout in milliseconds for OTLP requests
       * @default 10000
       */
      timeoutMillis?: number;

      /**
       * Compression method to use for OTLP requests
       * @default 'none'
       */
      compression?: 'gzip' | 'none';

      /**
       * Maximum number of retry attempts for failed exports
       * @default 5
       */
      maxRetries?: number;

      /**
       * Initial backoff delay in milliseconds for retries
       * @default 1000
       */
      initialBackoffMillis?: number;

      /**
       * Maximum backoff delay in milliseconds for retries
       * @default 5000
       */
      maxBackoffMillis?: number;

      /**
       * Maximum concurrent exports
       * @default 2
       */
      maxConcurrentExports?: number;
    };

    /**
     * Prometheus exporter specific configuration
     * Used when type is 'prometheus'
     */
    prometheus?: {
      /**
       * Host to bind the Prometheus metrics server to
       * @default 'localhost'
       */
      host?: string;

      /**
       * Port to bind the Prometheus metrics server to
       * @default 9464
       */
      port?: number;

      /**
       * Path to expose metrics on
       * @default '/metrics'
       */
      path?: string;

      /**
       * Whether to add resource attributes as metric labels
       * @default false
       */
      withResourceAttributes?: boolean;

      /**
       * Whether to include unit suffixes in metric names
       * @default true
       */
      withUnits?: boolean;
    };

    /**
     * Console exporter specific configuration
     * Used when type is 'console'
     */
    console?: {
      /**
       * Whether to pretty print the output
       * @default true
       */
      prettyPrint?: boolean;
    };
  };

  /**
   * Batch processing configuration for optimizing telemetry export
   */
  batch?: {
    /**
     * Maximum batch size for exporting spans
     * @default 512
     */
    maxExportBatchSize?: number;

    /**
     * Schedule delay in milliseconds between two consecutive exports
     * @default 5000
     */
    scheduledDelayMillis?: number;

    /**
     * Maximum queue size. After the size is reached spans are dropped
     * @default 2048
     */
    maxQueueSize?: number;
  };

  /**
   * Resource attributes to add to all telemetry data
   * These attributes help identify and categorize the source of telemetry
   */
  resourceAttributes?: Record<string, string>;

  /**
   * Whether to enable debug logging for the tracing system
   * @default false
   */
  debug?: boolean;

  /**
   * Whether to disable the tracing system entirely
   * @default false
   */
  disabled?: boolean;

  /**
   * Journey-specific configuration options
   * These options are applied only when the service.journey matches
   */
  journeyConfig?: {
    /**
     * Health journey specific configuration
     */
    health?: {
      /**
       * Whether to include health metrics in traces
       * @default true
       */
      includeMetrics?: boolean;

      /**
       * Whether to include device information in traces
       * @default true
       */
      includeDeviceInfo?: boolean;
    };

    /**
     * Care journey specific configuration
     */
    care?: {
      /**
       * Whether to include appointment information in traces
       * @default true
       */
      includeAppointments?: boolean;

      /**
       * Whether to include provider information in traces
       * @default true
       */
      includeProviders?: boolean;
    };

    /**
     * Plan journey specific configuration
     */
    plan?: {
      /**
       * Whether to include claim information in traces
       * @default true
       */
      includeClaims?: boolean;

      /**
       * Whether to include benefit information in traces
       * @default true
       */
      includeBenefits?: boolean;
    };
  };
}