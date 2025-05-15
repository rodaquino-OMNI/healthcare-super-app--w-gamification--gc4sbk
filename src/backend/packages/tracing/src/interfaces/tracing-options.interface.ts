/**
 * Interface defining configuration options for the OpenTelemetry tracing system.
 * This interface provides a standardized way to configure tracing across all services
 * and supports journey-specific configuration parameters.
 */
export interface TracingOptions {
  /**
   * The name of the service. This is used to identify the service in traces.
   * Required for proper trace attribution.
   */
  serviceName: string;

  /**
   * Optional version of the service. Used for tracking traces across different
   * versions of the same service.
   */
  serviceVersion?: string;

  /**
   * Optional sampling rate between 0 and 1. Determines what percentage of traces
   * will be sampled. Default is 1 (all traces are sampled).
   */
  samplingRatio?: number;

  /**
   * Optional journey identifier. When specified, adds journey context to all traces
   * from this service. Useful for tracking operations across journey boundaries.
   */
  journeyContext?: 'health' | 'care' | 'plan' | string;

  /**
   * Optional configuration for the OpenTelemetry exporter.
   */
  exporter?: ExporterOptions;

  /**
   * Optional additional resource attributes to add to all spans.
   * These can be used to add metadata to traces for better filtering and analysis.
   */
  resourceAttributes?: Record<string, string | number | boolean | Array<string>>;

  /**
   * Optional configuration for span processors.
   */
  spanProcessor?: SpanProcessorOptions;

  /**
   * Optional flag to enable or disable debug logging for the tracing system.
   * Default is false.
   */
  enableDebug?: boolean;
}

/**
 * Configuration options for OpenTelemetry exporters.
 */
export interface ExporterOptions {
  /**
   * The type of exporter to use.
   */
  type: 'console' | 'otlp' | 'jaeger' | 'zipkin' | 'datadog' | string;

  /**
   * Optional endpoint URL for the exporter.
   * Not applicable for console exporter.
   */
  endpoint?: string;

  /**
   * Optional headers to include with exporter requests.
   * Useful for authentication and other metadata.
   */
  headers?: Record<string, string>;

  /**
   * Optional timeout in milliseconds for exporter requests.
   */
  timeoutMillis?: number;

  /**
   * Optional secure connection flag. Default is true.
   */
  secure?: boolean;

  /**
   * Optional certificate path for secure connections.
   */
  certPath?: string;

  /**
   * Optional protocol to use with the OTLP exporter.
   * Only applicable when type is 'otlp'.
   */
  protocol?: 'http/json' | 'http/protobuf' | 'grpc';
}

/**
 * Configuration options for OpenTelemetry span processors.
 */
export interface SpanProcessorOptions {
  /**
   * The type of span processor to use.
   */
  type: 'simple' | 'batch' | string;

  /**
   * Optional batch size for the batch span processor.
   * Only applicable when type is 'batch'.
   */
  batchSize?: number;

  /**
   * Optional maximum queue size for the batch span processor.
   * Only applicable when type is 'batch'.
   */
  maxQueueSize?: number;

  /**
   * Optional scheduling delay in milliseconds for the batch span processor.
   * Only applicable when type is 'batch'.
   */
  scheduledDelayMillis?: number;

  /**
   * Optional export timeout in milliseconds for the batch span processor.
   * Only applicable when type is 'batch'.
   */
  exportTimeoutMillis?: number;
}