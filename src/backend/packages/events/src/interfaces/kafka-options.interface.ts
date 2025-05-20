/**
 * Options for configuring the Kafka module.
 */
export interface KafkaModuleOptions {
  /**
   * The name of the service using Kafka.
   * Used for client ID and consumer group ID generation.
   */
  serviceName?: string;

  /**
   * The configuration namespace to use for retrieving Kafka settings.
   * Defaults to the service name if not provided.
   * 
   * Example: If configNamespace is 'health-service', then the config key
   * 'health-service.kafka.brokers' will be used instead of 'kafka.brokers'.
   */
  configNamespace?: string;

  /**
   * Whether to enable schema validation for messages.
   * Requires the EventSchemaRegistry to be available.
   */
  enableSchemaValidation?: boolean;

  /**
   * Whether to enable dead-letter queue for failed messages.
   */
  enableDeadLetterQueue?: boolean;

  /**
   * Custom dead-letter queue topic name.
   * Defaults to 'dead-letter'.
   */
  deadLetterTopic?: string;

  /**
   * Default consumer group ID to use when not specified in consume() options.
   * Defaults to '{serviceName}-consumer-group'.
   */
  defaultConsumerGroup?: string;

  /**
   * Default retry options for failed message processing.
   */
  retry?: {
    /**
     * Maximum number of retries before sending to dead-letter queue.
     * Defaults to 3.
     */
    maxRetries?: number;

    /**
     * Initial retry delay in milliseconds.
     * Defaults to 300.
     */
    initialRetryTime?: number;

    /**
     * Multiplier for exponential backoff.
     * Defaults to 2.
     */
    factor?: number;

    /**
     * Maximum retry delay in milliseconds.
     * Defaults to 30000 (30 seconds).
     */
    maxRetryTime?: number;
  };
}