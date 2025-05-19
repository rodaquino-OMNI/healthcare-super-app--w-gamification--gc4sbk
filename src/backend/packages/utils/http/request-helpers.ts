/**
 * @file request-helpers.ts
 * @description Utility functions for standardizing HTTP request operations across the AUSTA SuperApp backend services.
 * Provides functions for authentication, journey context propagation, request security, validation, and logging.
 */

import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Logger } from '@nestjs/common';
import { JourneyType } from '@austa/interfaces/common';
import { isValidUrl } from '../validation/url-validation';
import { isObject } from '../object/type-guards';

// Constants
const JOURNEY_HEADER = 'X-Journey-Context';
const AUTH_HEADER = 'Authorization';
const CORRELATION_ID_HEADER = 'X-Correlation-ID';

// Types
export interface JourneyContext {
  journeyType: JourneyType;
  journeyId?: string;
  sessionId?: string;
  userId?: string;
}

export interface RequestValidationOptions {
  required?: string[];
  optional?: string[];
  allowEmpty?: boolean;
  maxSize?: number; // in bytes
}

/**
 * Adds authentication header to request config
 * @param config - Axios request configuration
 * @param token - JWT token (without Bearer prefix)
 * @returns Updated Axios request configuration with auth header
 */
export function addAuthHeader(config: AxiosRequestConfig, token: string): AxiosRequestConfig {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  return {
    ...config,
    headers: {
      ...config.headers,
      [AUTH_HEADER]: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
  };
}

/**
 * Adds journey context information to request headers
 * @param config - Axios request configuration
 * @param journeyContext - Journey context information
 * @returns Updated Axios request configuration with journey context header
 */
export function addJourneyContext(
  config: AxiosRequestConfig,
  journeyContext: JourneyContext
): AxiosRequestConfig {
  if (!journeyContext || !journeyContext.journeyType) {
    throw new Error('Journey context with journeyType is required');
  }

  return {
    ...config,
    headers: {
      ...config.headers,
      [JOURNEY_HEADER]: JSON.stringify(journeyContext),
    },
  };
}

/**
 * Sanitizes request URL to prevent path traversal and other URL-based attacks
 * @param url - URL to sanitize
 * @returns Sanitized URL
 * @throws Error if URL is invalid or contains potentially malicious patterns
 */
export function sanitizeRequestUrl(url: string): string {
  if (!url) {
    throw new Error('URL is required');
  }

  // Check if URL is valid
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format');
  }

  // Prevent path traversal attacks
  if (url.includes('../') || url.includes('./') || url.includes('..\\') || url.includes('.\\')) {
    throw new Error('URL contains potentially malicious path traversal patterns');
  }

  // Prevent protocol-relative URLs
  if (url.startsWith('//')) {
    throw new Error('Protocol-relative URLs are not allowed');
  }

  // Ensure URL has a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('URL must start with http:// or https://');
  }

  return url;
}

/**
 * Validates request parameters against defined requirements
 * @param params - Request parameters to validate
 * @param options - Validation options
 * @returns Validated parameters (same as input if valid)
 * @throws Error if validation fails
 */
export function validateRequestParams<T extends Record<string, any>>(
  params: T,
  options: RequestValidationOptions
): T {
  if (!isObject(params)) {
    throw new Error('Request parameters must be an object');
  }

  // Check required parameters
  if (options.required && options.required.length > 0) {
    for (const requiredParam of options.required) {
      if (params[requiredParam] === undefined) {
        throw new Error(`Required parameter '${requiredParam}' is missing`);
      }

      if (!options.allowEmpty && params[requiredParam] === '') {
        throw new Error(`Required parameter '${requiredParam}' cannot be empty`);
      }
    }
  }

  // Check max size if specified
  if (options.maxSize && options.maxSize > 0) {
    const size = JSON.stringify(params).length;
    if (size > options.maxSize) {
      throw new Error(`Request parameters exceed maximum size of ${options.maxSize} bytes`);
    }
  }

  return params;
}

/**
 * Logs HTTP request details in a standardized format
 * @param logger - NestJS logger instance
 * @param config - Axios request configuration
 * @param response - Optional Axios response (for completed requests)
 * @param error - Optional Axios error (for failed requests)
 */
export function logRequest(
  logger: Logger,
  config: AxiosRequestConfig,
  response?: AxiosResponse,
  error?: AxiosError
): void {
  try {
    const method = config.method?.toUpperCase() || 'UNKNOWN';
    const url = config.url || 'UNKNOWN';
    const journeyContext = config.headers?.[JOURNEY_HEADER] 
      ? JSON.parse(config.headers[JOURNEY_HEADER] as string)
      : null;
    const correlationId = config.headers?.[CORRELATION_ID_HEADER] || 'UNKNOWN';

    // Basic request info
    const logData = {
      method,
      url,
      journeyType: journeyContext?.journeyType || 'UNKNOWN',
      correlationId,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      // Log error details
      logger.error(
        `HTTP Request Failed: ${method} ${url}`,
        {
          ...logData,
          status: error.response?.status || 'UNKNOWN',
          errorMessage: error.message,
          errorCode: error.code,
          responseData: error.response?.data,
        },
        error.stack
      );
    } else if (response) {
      // Log successful response
      logger.log(
        `HTTP Request Completed: ${method} ${url}`,
        {
          ...logData,
          status: response.status,
          responseTime: response.headers['x-response-time'] || 'UNKNOWN',
          contentLength: response.headers['content-length'] || 'UNKNOWN',
        }
      );
    } else {
      // Log outgoing request
      logger.log(
        `HTTP Request Initiated: ${method} ${url}`,
        {
          ...logData,
          params: config.params,
          timeout: config.timeout || 'default',
        }
      );
    }
  } catch (loggingError) {
    // Fallback logging if structured logging fails
    logger.warn(
      `Failed to log HTTP request: ${loggingError.message}`,
      loggingError.stack
    );
  }
}

// Internal helper functions not exported in index.ts

/**
 * Adds correlation ID to request headers for distributed tracing
 * @internal
 * @param config - Axios request configuration
 * @param correlationId - Correlation ID for request tracing
 * @returns Updated Axios request configuration with correlation ID header
 */
export function addCorrelationId(
  config: AxiosRequestConfig,
  correlationId: string
): AxiosRequestConfig {
  if (!correlationId) {
    throw new Error('Correlation ID is required');
  }

  return {
    ...config,
    headers: {
      ...config.headers,
      [CORRELATION_ID_HEADER]: correlationId,
    },
  };
}

/**
 * Creates a standardized error message from an Axios error
 * @internal
 * @param error - Axios error
 * @returns Formatted error message with relevant details
 */
export function formatRequestError(error: AxiosError): string {
  const status = error.response?.status || 'UNKNOWN';
  const url = error.config?.url || 'UNKNOWN';
  const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
  const responseData = error.response?.data 
    ? JSON.stringify(error.response.data).substring(0, 200) 
    : 'No response data';

  return `HTTP ${method} request to ${url} failed with status ${status}: ${error.message}. Response: ${responseData}`;
}