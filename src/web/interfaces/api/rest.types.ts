/**
 * REST API TypeScript interfaces for the AUSTA SuperApp
 * 
 * This file defines REST-specific interfaces for endpoint configurations,
 * request options, file uploads, and response parsing. These interfaces
 * ensure type safety for REST operations across all journeys.
 * 
 * Part of the @austa/interfaces package that centralizes cross-journey
 * TypeScript interfaces for data models consumed by both frontend and backend.
 * 
 * @package @austa/interfaces
 * @module api/rest
 */

/**
 * HTTP methods supported by the REST client
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

/**
 * Base interface for all REST request options
 */
export interface RestRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  signal?: AbortSignal;
}

/**
 * GET request options
 */
export interface GetRequestOptions extends RestRequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
  cache?: RequestCache;
}

/**
 * POST request options with body
 */
export interface PostRequestOptions<T = unknown> extends RestRequestOptions {
  body?: T;
  params?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * PUT request options with body
 */
export interface PutRequestOptions<T = unknown> extends RestRequestOptions {
  body: T;
  params?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * DELETE request options
 */
export interface DeleteRequestOptions extends RestRequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * PATCH request options with body
 */
export interface PatchRequestOptions<T = unknown> extends RestRequestOptions {
  body: T;
  params?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * File upload request options
 */
export interface FileUploadOptions extends RestRequestOptions {
  onProgress?: (progress: number) => void;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[];
}

/**
 * File upload request data
 */
export interface FileUploadRequest {
  file: File | Blob;
  fileName?: string;
  contentType?: string;
  metadata?: Record<string, string | number | boolean>;
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  expiresAt?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * REST endpoint configuration
 */
export interface RestEndpointConfig {
  baseUrl: string;
  path: string;
  method: HttpMethod;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  journeyContext?: 'health' | 'care' | 'plan' | 'all';
  requiresAuth?: boolean;
}

/**
 * REST client configuration
 */
export interface RestClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
  withCredentials?: boolean;
  interceptors?: RestClientInterceptors;
  errorHandler?: (error: Error) => Promise<never>;
  retryConfig?: RestRetryConfig;
  journeyContext?: 'health' | 'care' | 'plan' | 'all';
}

/**
 * REST client interceptors
 */
export interface RestClientInterceptors {
  request?: Array<(config: RestRequestOptions) => RestRequestOptions | Promise<RestRequestOptions>>;
  response?: Array<(response: Response) => Response | Promise<Response>>;
  error?: Array<(error: Error) => Promise<any> | Error | Response>;
}

/**
 * REST retry configuration
 */
export interface RestRetryConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  retryStatusCodes: number[];
  exponentialBackoff?: boolean;
  onRetry?: (retryCount: number, error: Error) => void;
}

/**
 * REST error response
 */
export interface RestErrorResponse {
  status: number;
  statusText: string;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  timestamp?: string;
  path?: string;
  requestId?: string;
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * REST pagination parameters
 */
export interface RestPaginationParams {
  page: number;
  size: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * REST paginated response
 */
export interface RestPaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sort?: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

/**
 * REST batch operation request
 */
export interface RestBatchOperationRequest<T> {
  operations: Array<{
    id: string;
    method: HttpMethod;
    path: string;
    body?: T;
    headers?: Record<string, string>;
    journeyContext?: 'health' | 'care' | 'plan';
  }>;
}

/**
 * REST batch operation response
 */
export interface RestBatchOperationResponse {
  results: Array<{
    id: string;
    status: number;
    body?: unknown;
    error?: RestErrorResponse;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}