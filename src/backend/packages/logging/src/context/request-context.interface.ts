/**
 * Interface for HTTP request-specific logging context in the AUSTA SuperApp.
 * Extends the base LoggingContext to capture request-specific information
 * for structured logging and request monitoring.
 */

import { LoggingContext } from './context.interface';

/**
 * Interface representing HTTP request-specific context information for logging.
 * This interface captures request details such as request ID, IP address, HTTP method,
 * URL, path, and user agent that provide critical context for request-related logs.
 */
export interface RequestContext extends LoggingContext {
  /**
   * Unique identifier for the request
   * Used to correlate logs from the same request
   * Note: This overrides the requestId in the base LoggingContext
   * to make it a required field in RequestContext
   */
  requestId: string;

  /**
   * IP address of the client making the request
   * Used for geolocation and security analysis
   */
  ipAddress?: string;

  /**
   * HTTP method of the request (GET, POST, PUT, DELETE, etc.)
   * Indicates the type of operation being performed
   */
  method?: string;

  /**
   * Full URL of the request
   * Provides the complete context of the requested resource
   */
  url?: string;

  /**
   * Path portion of the URL
   * More concise than the full URL when query parameters aren't relevant
   */
  path?: string;

  /**
   * Query parameters from the URL
   * Parsed and sanitized for sensitive information
   */
  query?: Record<string, any>;

  /**
   * User agent string from the request headers
   * Provides information about the client's browser or application
   */
  userAgent?: string;

  /**
   * HTTP status code of the response
   * Indicates the outcome of the request
   */
  statusCode?: number;

  /**
   * Duration of the request processing in milliseconds
   * Used for performance monitoring and optimization
   */
  duration?: number;

  /**
   * Size of the request body in bytes
   * Useful for monitoring data transfer and detecting anomalies
   */
  requestSize?: number;

  /**
   * Size of the response body in bytes
   * Useful for monitoring data transfer and detecting anomalies
   */
  responseSize?: number;

  /**
   * Request body parameters (for POST, PUT, etc.)
   * Sanitized to remove sensitive information
   */
  body?: Record<string, any>;

  /**
   * HTTP headers from the request
   * Sanitized to remove sensitive information
   */
  headers?: Record<string, string>;

  /**
   * Route pattern that matched the request
   * More generic than the path, shows the route template
   * Example: '/users/:id' instead of '/users/123'
   */
  routePattern?: string;

  /**
   * Route parameters extracted from the URL
   * Example: { id: '123' } for route '/users/:id' and path '/users/123'
   */
  routeParams?: Record<string, string>;

  /**
   * Name of the controller handling the request
   * Useful for identifying the responsible component
   */
  controller?: string;

  /**
   * Name of the action/method handling the request
   * Identifies the specific handler within the controller
   */
  action?: string;

  /**
   * Indicates if the request is an API call
   * Distinguishes between API requests and page views
   */
  isApi?: boolean;

  /**
   * Indicates if the request is from a mobile device
   * Useful for analyzing mobile vs. desktop usage patterns
   */
  isMobile?: boolean;

  /**
   * Referrer URL if available
   * Indicates where the request originated from
   */
  referrer?: string;

  /**
   * Information about rate limiting for the request
   * Useful for monitoring API usage and preventing abuse
   */
  rateLimit?: {
    /**
     * Maximum number of requests allowed in the time window
     */
    limit?: number;
    
    /**
     * Number of requests remaining in the current time window
     */
    remaining?: number;
    
    /**
     * Time in seconds until the rate limit resets
     */
    reset?: number;
  };

  /**
   * Error information if the request resulted in an error
   * Provides context for troubleshooting failed requests
   */
  error?: {
    /**
     * Error message
     */
    message?: string;
    
    /**
     * Error code or type
     */
    code?: string;
    
    /**
     * Error stack trace (sanitized for production)
     */
    stack?: string;
    
    /**
     * Additional error details
     */
    details?: Record<string, any>;
  };

  /**
   * Journey context for the request
   * Indicates which journey (Health, Care, Plan) the request belongs to
   */
  journey?: {
    /**
     * Journey type (Health, Care, Plan)
     */
    type?: string;
    
    /**
     * Specific section or feature within the journey
     */
    section?: string;
    
    /**
     * Action being performed within the journey
     */
    action?: string;
  };

  /**
   * Performance metrics for the request
   * Detailed timing information for performance analysis
   */
  performance?: {
    /**
     * Time spent in database operations
     */
    dbTime?: number;
    
    /**
     * Time spent in external API calls
     */
    externalApiTime?: number;
    
    /**
     * Time spent in rendering templates
     */
    renderTime?: number;
    
    /**
     * Time spent in business logic
     */
    processingTime?: number;
    
    /**
     * Additional performance metrics
     */
    [key: string]: number | undefined;
  };

  /**
   * Additional request-specific data as key-value pairs
   * Can contain any request-specific context that doesn't fit in other properties
   */
  requestData?: Record<string, any>;
}