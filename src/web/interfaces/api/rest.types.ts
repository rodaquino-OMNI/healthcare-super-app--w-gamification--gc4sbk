/**
 * REST API TypeScript interfaces for the AUSTA SuperApp
 *
 * This file defines REST-specific TypeScript interfaces for the AUSTA SuperApp,
 * covering endpoint configurations, request options, file uploads, and response parsing.
 * These interfaces are used primarily for file uploads and specialized API calls that
 * aren't handled by GraphQL.
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
 * HTTP method-specific request options
 */
export interface GetRequestOptions extends RestRequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
  cache?: RequestCache;
}

export interface PostRequestOptions extends RestRequestOptions {
  body?: any;
  contentType?: 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded' | string;
}

export interface PutRequestOptions extends PostRequestOptions {}

export interface PatchRequestOptions extends PostRequestOptions {}

export interface DeleteRequestOptions extends RestRequestOptions {
  body?: any;
}

/**
 * File upload specific types
 */
export interface FileUploadOptions extends PostRequestOptions {
  onProgress?: (progress: number) => void;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[]; // e.g. ['image/jpeg', 'image/png']
}

export interface FileUploadResponse {
  fileUrl: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  journeyContext?: string; // Optional journey context for the file
}

/**
 * REST endpoint configuration
 */
export interface RestEndpointConfig {
  baseUrl: string;
  endpoints: Record<string, string>;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

/**
 * Journey-specific REST endpoint configurations
 */
export interface JourneyRestEndpoints {
  health: RestEndpointConfig;
  care: RestEndpointConfig;
  plan: RestEndpointConfig;
  auth: RestEndpointConfig;
  gamification: RestEndpointConfig;
  notification: RestEndpointConfig;
}

/**
 * REST client configuration
 */
export interface RestClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
  retryConfig?: RetryConfig;
  interceptors?: RestClientInterceptors;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  retryStatusCodes: number[];
  exponentialBackoff?: boolean;
  onRetry?: (retryCount: number, error: Error) => void;
}

/**
 * REST client interceptors for request/response processing
 */
export interface RestClientInterceptors {
  request?: Array<(config: any) => any | Promise<any>>;
  response?: Array<(response: any) => any | Promise<any>>;
  error?: Array<(error: any) => any | Promise<any>>;
}

/**
 * REST API error response
 */
export interface RestErrorResponse {
  status: number;
  statusText: string;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  timestamp?: string;
  path?: string;
  journeyContext?: string;
}

/**
 * REST API response with pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded';
  version: string;
  timestamp: string;
  services: Record<string, {
    status: 'ok' | 'error' | 'degraded';
    message?: string;
    latency?: number;
  }>;
}

/**
 * File download options
 */
export interface FileDownloadOptions extends GetRequestOptions {
  fileName?: string; // Override the default file name
  onProgress?: (progress: number) => void;
}

/**
 * Multipart form data helper types
 */
export interface MultipartFormField {
  name: string;
  value: string | Blob;
  fileName?: string; // Only applicable for Blob values
}

/**
 * REST client interface for journey-specific implementations
 */
export interface JourneyRestClient {
  get<T>(endpoint: string, options?: GetRequestOptions): Promise<T>;
  post<T>(endpoint: string, options?: PostRequestOptions): Promise<T>;
  put<T>(endpoint: string, options?: PutRequestOptions): Promise<T>;
  patch<T>(endpoint: string, options?: PatchRequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: DeleteRequestOptions): Promise<T>;
  uploadFile(endpoint: string, file: File | Blob, options?: FileUploadOptions): Promise<FileUploadResponse>;
  uploadFiles(endpoint: string, files: File[] | Blob[], options?: FileUploadOptions): Promise<FileUploadResponse[]>;
  downloadFile(endpoint: string, options?: FileDownloadOptions): Promise<Blob>;
}