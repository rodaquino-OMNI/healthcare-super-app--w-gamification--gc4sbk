/**
 * @file Request Context Interface
 * @description Defines the RequestContext interface that extends the base LoggingContext
 * to capture HTTP request-specific information for structured logging.
 */

import { LoggingContext } from './context.interface';

/**
 * Enum representing HTTP methods for requests.
 */
export enum HttpMethod {
  /** HTTP GET method */
  GET = 'GET',
  /** HTTP POST method */
  POST = 'POST',
  /** HTTP PUT method */
  PUT = 'PUT',
  /** HTTP DELETE method */
  DELETE = 'DELETE',
  /** HTTP PATCH method */
  PATCH = 'PATCH',
  /** HTTP HEAD method */
  HEAD = 'HEAD',
  /** HTTP OPTIONS method */
  OPTIONS = 'OPTIONS',
  /** HTTP TRACE method */
  TRACE = 'TRACE',
  /** HTTP CONNECT method */
  CONNECT = 'CONNECT',
}

/**
 * Interface for HTTP request headers with sanitization.
 * Sensitive headers like Authorization are redacted by default.
 */
export interface SanitizedHeaders {
  /** Content type of the request */
  'content-type'?: string;
  /** Accept header specifying expected response format */
  accept?: string;
  /** User agent string identifying the client */
  'user-agent'?: string;
  /** Referer header indicating the origin of the request */
  referer?: string;
  /** Origin header for CORS requests */
  origin?: string;
  /** Host header specifying the domain name of the server */
  host?: string;
  /** Authorization header (redacted for security) */
  authorization?: string;
  /** Other headers */
  [key: string]: string | undefined;
}

/**
 * Interface for HTTP response information.
 */
export interface ResponseInfo {
  /** HTTP status code of the response */
  statusCode: number;
  /** Status message corresponding to the status code */
  statusMessage?: string;
  /** Content type of the response */
  contentType?: string;
  /** Size of the response in bytes */
  contentLength?: number;
  /** Time taken to generate the response (in milliseconds) */
  responseTime?: number;
}

/**
 * RequestContext interface that extends the base LoggingContext to capture
 * HTTP request-specific information for structured logging.
 * 
 * This interface provides critical context for request-related logs, enabling
 * proper debugging, monitoring, and analysis of API usage and performance.
 */
export interface RequestContext extends LoggingContext {
  /** Unique identifier for the request */
  requestId: string;
  
  /** IP address of the client making the request */
  ipAddress?: string;
  
  /** HTTP method of the request */
  method: HttpMethod | string;
  
  /** Full URL of the request */
  url?: string;
  
  /** Path component of the URL */
  path?: string;
  
  /** Query parameters as key-value pairs */
  query?: Record<string, string | string[]>;
  
  /** Route parameters from path variables */
  params?: Record<string, string>;
  
  /** User agent string identifying the client */
  userAgent?: string;
  
  /** Sanitized request headers with sensitive information redacted */
  headers?: SanitizedHeaders;
  
  /** Sanitized request body with sensitive information redacted */
  body?: Record<string, any>;
  
  /** Information about the response to this request */
  response?: ResponseInfo;
  
  /** API version being accessed */
  apiVersion?: string;
  
  /** Name of the API endpoint or controller handling the request */
  endpoint?: string;
  
  /** Name of the specific operation being performed */
  operation?: string;
  
  /** Rate limiting information */
  rateLimit?: {
    /** Current rate limit for the client */
    limit?: number;
    /** Remaining requests allowed in the current window */
    remaining?: number;
    /** Time when the rate limit resets */
    reset?: number;
  };
  
  /** Request timing information */
  timing?: {
    /** Timestamp when the request was received */
    receivedAt: string;
    /** Time spent in middleware (in milliseconds) */
    middlewareDuration?: number;
    /** Time spent in the handler (in milliseconds) */
    handlerDuration?: number;
    /** Total request processing time (in milliseconds) */
    totalDuration?: number;
  };
  
  /** Information about the client making the request */
  client?: {
    /** Type of client (browser, mobile app, API client) */
    type?: string;
    /** Client application identifier */
    appId?: string;
    /** Client version */
    version?: string;
    /** Device information */
    device?: {
      /** Type of device (mobile, tablet, desktop) */
      type?: string;
      /** Operating system of the device */
      os?: string;
      /** Browser information if applicable */
      browser?: string;
    };
  };
  
  /** Information about the journey context of this request */
  journeyInfo?: {
    /** The journey type related to this request */
    journeyType?: string;
    /** The specific journey action being performed */
    journeyAction?: string;
    /** Journey-specific context for this request */
    journeyContext?: Record<string, any>;
  };
  
  /** Business transaction information for this request */
  transaction?: {
    /** Unique identifier for the business transaction */
    transactionId?: string;
    /** Type of business transaction */
    transactionType?: string;
    /** Current step in a multi-step transaction */
    transactionStep?: string;
  };
}