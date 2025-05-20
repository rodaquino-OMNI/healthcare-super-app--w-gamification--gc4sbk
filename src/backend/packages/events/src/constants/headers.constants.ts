/**
 * Kafka message header keys used across the AUSTA SuperApp.
 * 
 * This provides a centralized definition of all header keys to ensure
 * consistency in event metadata across services.
 */
export const HEADERS = {
  /**
   * Headers for distributed tracing.
   * 
   * These headers enable tracking of requests across multiple services
   * and are compatible with OpenTelemetry standards.
   */
  TRACING: {
    /**
     * Correlation ID for linking related events.
     */
    CORRELATION_ID: 'austa-correlation-id',
    
    /**
     * Trace ID for distributed tracing.
     */
    TRACE_ID: 'austa-trace-id',
    
    /**
     * Span ID for distributed tracing.
     */
    SPAN_ID: 'austa-span-id',
    
    /**
     * Parent span ID for distributed tracing.
     */
    PARENT_SPAN_ID: 'austa-parent-span-id',
  },
  
  /**
   * Headers for versioning and backward compatibility.
   * 
   * These headers enable services to handle different versions of events
   * and maintain backward compatibility.
   */
  VERSIONING: {
    /**
     * Schema version for event payload validation.
     */
    SCHEMA_VERSION: 'austa-schema-version',
    
    /**
     * API version for backward compatibility.
     */
    API_VERSION: 'austa-api-version',
  },
  
  /**
   * Headers for event metadata.
   * 
   * These headers provide context about the event source, timing,
   * and classification.
   */
  METADATA: {
    /**
     * Source service that produced the event.
     */
    SOURCE_SERVICE: 'austa-source-service',
    
    /**
     * Timestamp when the event was produced.
     */
    TIMESTAMP: 'austa-timestamp',
    
    /**
     * Type of event for message classification.
     */
    EVENT_TYPE: 'austa-event-type',
    
    /**
     * Unique ID for the event, used for deduplication.
     */
    EVENT_ID: 'austa-event-id',
  },
  
  /**
   * Headers for message delivery guarantees.
   * 
   * These headers control how messages are processed, retried,
   * and prioritized.
   */
  DELIVERY: {
    /**
     * Priority level for message processing.
     */
    PRIORITY: 'austa-priority',
    
    /**
     * Number of retry attempts made so far.
     */
    RETRY_COUNT: 'austa-retry-count',
    
    /**
     * Maximum number of retry attempts allowed.
     */
    MAX_RETRIES: 'austa-max-retries',
    
    /**
     * Backoff duration for retry attempts (in milliseconds).
     */
    RETRY_BACKOFF: 'austa-retry-backoff',
    
    /**
     * Deadline for message delivery (ISO timestamp).
     */
    DELIVERY_DEADLINE: 'austa-delivery-deadline',
  },
  
  /**
   * Headers for journey context.
   * 
   * These headers provide context about the user journey
   * for appropriate event routing and processing.
   */
  JOURNEY: {
    /**
     * Journey context for event routing.
     */
    CONTEXT: 'austa-journey-context',
    
    /**
     * User ID for user-specific events.
     */
    USER_ID: 'austa-user-id',
    
    /**
     * Journey type for journey-specific processing.
     */
    TYPE: 'austa-journey-type',
  },
};