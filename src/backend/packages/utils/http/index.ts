/**
 * @austa/utils/http
 * 
 * This module provides a comprehensive set of HTTP utilities for making secure
 * and reliable HTTP requests across the AUSTA SuperApp microservices architecture.
 * 
 * @module @austa/utils/http
 */

// Core HTTP client functionality
export * from '../src/http/client';

// Security utilities for SSRF protection
export * from '../src/http/security';

// Internal service-to-service communication
export * from '../src/http/internal';

// Retry mechanisms for failed requests
export * from '../src/http/retry';

// Circuit breaker pattern implementation
export * from '../src/http/circuit-breaker';

// Request helpers (headers, params, etc.)
export * from '../src/http/request-helpers';

// Response helpers (parsing, validation, etc.)
export * from '../src/http/response-helpers';

/**
 * Re-exports all HTTP utilities with a clean, organized interface.
 * This barrel file enables importing multiple utilities with a single import statement:
 * 
 * ```typescript
 * import { createHttpClient, createSecureHttpClient, withRetry } from '@austa/utils/http';
 * ```
 * 
 * @example
 * // Create a secure HTTP client with retry logic
 * const client = withRetry(createSecureHttpClient('https://api.example.com'));
 * 
 * // Make a request with the client
 * const response = await client.get('/users');
 */