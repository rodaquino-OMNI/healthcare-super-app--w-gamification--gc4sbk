import { LoggingContext } from './context.interface';

/**
 * Interface representing HTTP request-specific context information for structured logging.
 * Extends the base LoggingContext to include properties specific to HTTP requests.
 */
export interface RequestContext extends LoggingContext {
  /**
   * Unique identifier for the request
   */
  requestId: string;

  /**
   * IP address of the client making the request
   */
  ip?: string;

  /**
   * HTTP method used for the request (GET, POST, PUT, DELETE, etc.)
   */
  method?: string;

  /**
   * Full URL of the request including query parameters
   */
  url?: string;

  /**
   * Path portion of the URL without query parameters
   */
  path?: string;

  /**
   * User agent string from the request headers
   */
  userAgent?: string;

  /**
   * Sanitized request parameters (query parameters for GET, body for POST/PUT)
   * Sensitive information should be redacted before logging
   */
  parameters?: Record<string, any>;

  /**
   * Sanitized request headers
   * Sensitive headers (Authorization, Cookie, etc.) should be redacted before logging
   */
  headers?: Record<string, string>;

  /**
   * HTTP status code of the response
   */
  statusCode?: number;

  /**
   * Response time in milliseconds
   */
  responseTime?: number;

  /**
   * Size of the response in bytes
   */
  responseSize?: number;

  /**
   * Referrer URL if available
   */
  referrer?: string;

  /**
   * Journey identifier associated with this request
   */
  journeyId?: string;
}