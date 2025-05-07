/**
 * Response Assertion Utilities
 * 
 * This module provides specialized assertion utilities for validating API Gateway responses,
 * including functions for checking authentication errors, validating GraphQL responses,
 * and verifying journey-specific data structures.
 * 
 * @module response-assertions
 */

import { HttpStatus } from '@nestjs/common';
import { Response } from 'supertest';
import { ErrorType } from '@austa/interfaces/common/error';

/**
 * Error response structure returned by the API Gateway
 */
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  errorType?: ErrorType;
  code?: string;
  timestamp?: string;
  path?: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * GraphQL error response structure
 */
interface GraphQLErrorResponse {
  errors: {
    message: string;
    extensions?: {
      code: string;
      errorType?: ErrorType;
      response?: ErrorResponse;
      exception?: {
        name?: string;
        [key: string]: any;
      };
    };
    locations?: { line: number; column: number }[];
    path?: string[];
  }[];
  data?: Record<string, any> | null;
}

/**
 * Asserts that the response contains a valid error structure
 * @param response - The supertest response object
 * @param expectedStatus - The expected HTTP status code
 * @param expectedErrorType - The expected error type
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertErrorResponse(
  response: Response,
  expectedStatus: HttpStatus,
  expectedErrorType: ErrorType,
  messageContains?: string
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  
  const errorResponse = response.body as ErrorResponse;
  expect(errorResponse.statusCode).toBe(expectedStatus);
  expect(errorResponse.errorType).toBe(expectedErrorType);
  
  if (messageContains) {
    if (Array.isArray(errorResponse.message)) {
      expect(errorResponse.message.some(msg => msg.includes(messageContains))).toBeTruthy();
    } else {
      expect(errorResponse.message).toContain(messageContains);
    }
  }
  
  // Common error response structure validation
  expect(errorResponse.timestamp).toBeDefined();
  expect(errorResponse.path).toBeDefined();
  
  // Ensure stack trace is not exposed in non-development environments
  if (process.env.NODE_ENV !== 'development') {
    expect(errorResponse.stack).toBeUndefined();
  }
}

/**
 * Asserts that the response contains a valid authentication error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertAuthenticationError(
  response: Response,
  messageContains?: string
): void {
  assertErrorResponse(
    response,
    HttpStatus.UNAUTHORIZED,
    ErrorType.VALIDATION,
    messageContains || 'authentication'
  );
}

/**
 * Asserts that the response contains a valid authorization error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertAuthorizationError(
  response: Response,
  messageContains?: string
): void {
  assertErrorResponse(
    response,
    HttpStatus.FORBIDDEN,
    ErrorType.VALIDATION,
    messageContains || 'permission'
  );
}

/**
 * Asserts that the response contains a valid validation error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertValidationError(
  response: Response,
  messageContains?: string
): void {
  assertErrorResponse(
    response,
    HttpStatus.BAD_REQUEST,
    ErrorType.VALIDATION,
    messageContains
  );
}

/**
 * Asserts that the response contains a valid business error
 * @param response - The supertest response object
 * @param expectedStatus - The expected HTTP status code (default: 400 BAD_REQUEST)
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertBusinessError(
  response: Response,
  expectedStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  messageContains?: string
): void {
  assertErrorResponse(
    response,
    expectedStatus,
    ErrorType.BUSINESS,
    messageContains
  );
}

/**
 * Asserts that the response contains a valid technical error
 * @param response - The supertest response object
 * @param expectedStatus - The expected HTTP status code (default: 500 INTERNAL_SERVER_ERROR)
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertTechnicalError(
  response: Response,
  expectedStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  messageContains?: string
): void {
  assertErrorResponse(
    response,
    expectedStatus,
    ErrorType.TECHNICAL,
    messageContains
  );
}

/**
 * Asserts that the response contains a valid external error
 * @param response - The supertest response object
 * @param expectedStatus - The expected HTTP status code (default: 502 BAD_GATEWAY)
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertExternalError(
  response: Response,
  expectedStatus: HttpStatus = HttpStatus.BAD_GATEWAY,
  messageContains?: string
): void {
  assertErrorResponse(
    response,
    expectedStatus,
    ErrorType.EXTERNAL,
    messageContains
  );
}

/**
 * Asserts that the response contains a valid resource not found error
 * @param response - The supertest response object
 * @param resourceType - The type of resource that was not found
 * @param resourceId - Optional ID of the resource that was not found
 */
export function assertResourceNotFoundError(
  response: Response,
  resourceType: string,
  resourceId?: string | number
): void {
  const messageContains = resourceId
    ? `${resourceType} with ID ${resourceId} not found`
    : `${resourceType} not found`;
  
  assertErrorResponse(
    response,
    HttpStatus.NOT_FOUND,
    ErrorType.BUSINESS,
    messageContains
  );
}

/**
 * Asserts that the GraphQL response contains a valid error
 * @param response - The supertest response object
 * @param expectedErrorType - The expected error type
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLError(
  response: Response,
  expectedErrorType: ErrorType,
  messageContains?: string
): void {
  expect(response.status).toBe(HttpStatus.OK); // GraphQL always returns 200 OK
  expect(response.body).toBeDefined();
  
  const graphqlResponse = response.body as GraphQLErrorResponse;
  expect(graphqlResponse.errors).toBeDefined();
  expect(graphqlResponse.errors.length).toBeGreaterThan(0);
  
  const firstError = graphqlResponse.errors[0];
  expect(firstError.extensions).toBeDefined();
  expect(firstError.extensions?.errorType).toBe(expectedErrorType);
  
  if (messageContains) {
    expect(firstError.message).toContain(messageContains);
  }
}

/**
 * Asserts that the GraphQL response contains a valid authentication error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLAuthenticationError(
  response: Response,
  messageContains?: string
): void {
  assertGraphQLError(
    response,
    ErrorType.VALIDATION,
    messageContains || 'authentication'
  );
  
  const graphqlResponse = response.body as GraphQLErrorResponse;
  const firstError = graphqlResponse.errors[0];
  expect(firstError.extensions?.code).toBe('UNAUTHENTICATED');
}

/**
 * Asserts that the GraphQL response contains a valid authorization error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLAuthorizationError(
  response: Response,
  messageContains?: string
): void {
  assertGraphQLError(
    response,
    ErrorType.VALIDATION,
    messageContains || 'permission'
  );
  
  const graphqlResponse = response.body as GraphQLErrorResponse;
  const firstError = graphqlResponse.errors[0];
  expect(firstError.extensions?.code).toBe('FORBIDDEN');
}

/**
 * Asserts that the GraphQL response contains a valid validation error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLValidationError(
  response: Response,
  messageContains?: string
): void {
  assertGraphQLError(
    response,
    ErrorType.VALIDATION,
    messageContains
  );
  
  const graphqlResponse = response.body as GraphQLErrorResponse;
  const firstError = graphqlResponse.errors[0];
  expect(firstError.extensions?.code).toBe('BAD_USER_INPUT');
}

/**
 * Asserts that the GraphQL response contains a valid business error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLBusinessError(
  response: Response,
  messageContains?: string
): void {
  assertGraphQLError(
    response,
    ErrorType.BUSINESS,
    messageContains
  );
}

/**
 * Asserts that the GraphQL response contains a valid technical error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLTechnicalError(
  response: Response,
  messageContains?: string
): void {
  assertGraphQLError(
    response,
    ErrorType.TECHNICAL,
    messageContains
  );
  
  const graphqlResponse = response.body as GraphQLErrorResponse;
  const firstError = graphqlResponse.errors[0];
  expect(firstError.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
}

/**
 * Asserts that the GraphQL response contains a valid external error
 * @param response - The supertest response object
 * @param messageContains - Optional substring that should be present in the error message
 */
export function assertGraphQLExternalError(
  response: Response,
  messageContains?: string
): void {
  assertGraphQLError(
    response,
    ErrorType.EXTERNAL,
    messageContains
  );
}

/**
 * Asserts that the GraphQL response contains a valid resource not found error
 * @param response - The supertest response object
 * @param resourceType - The type of resource that was not found
 * @param resourceId - Optional ID of the resource that was not found
 */
export function assertGraphQLResourceNotFoundError(
  response: Response,
  resourceType: string,
  resourceId?: string | number
): void {
  const messageContains = resourceId
    ? `${resourceType} with ID ${resourceId} not found`
    : `${resourceType} not found`;
  
  assertGraphQLError(
    response,
    ErrorType.BUSINESS,
    messageContains
  );
}

/**
 * Asserts that the GraphQL response contains valid data
 * @param response - The supertest response object
 * @param dataPath - Optional path to the data to validate (e.g., 'user', 'user.profile')
 */
export function assertGraphQLData(
  response: Response,
  dataPath?: string
): Record<string, any> {
  expect(response.status).toBe(HttpStatus.OK);
  expect(response.body).toBeDefined();
  
  const graphqlResponse = response.body as { data: Record<string, any> };
  expect(graphqlResponse.data).toBeDefined();
  
  if (dataPath) {
    const pathParts = dataPath.split('.');
    let data = graphqlResponse.data;
    
    for (const part of pathParts) {
      expect(data[part]).toBeDefined();
      data = data[part];
    }
    
    return data;
  }
  
  return graphqlResponse.data;
}

/**
 * Asserts that the response contains valid journey-specific health data
 * @param response - The supertest response object
 * @param dataPath - Path to the health data to validate
 */
export function assertHealthJourneyData(
  response: Response,
  dataPath: string
): Record<string, any> {
  const data = assertGraphQLData(response, dataPath);
  
  // Validate common health journey data structure
  expect(data).toHaveProperty('userId');
  
  return data;
}

/**
 * Asserts that the response contains valid journey-specific care data
 * @param response - The supertest response object
 * @param dataPath - Path to the care data to validate
 */
export function assertCareJourneyData(
  response: Response,
  dataPath: string
): Record<string, any> {
  const data = assertGraphQLData(response, dataPath);
  
  // Validate common care journey data structure
  expect(data).toHaveProperty('userId');
  
  return data;
}

/**
 * Asserts that the response contains valid journey-specific plan data
 * @param response - The supertest response object
 * @param dataPath - Path to the plan data to validate
 */
export function assertPlanJourneyData(
  response: Response,
  dataPath: string
): Record<string, any> {
  const data = assertGraphQLData(response, dataPath);
  
  // Validate common plan journey data structure
  expect(data).toHaveProperty('userId');
  
  return data;
}

/**
 * Asserts that the response contains valid pagination metadata
 * @param response - The supertest response object
 * @param dataPath - Path to the paginated data to validate
 * @param expectedTotalItems - Optional expected total number of items
 * @param expectedPageSize - Optional expected page size
 */
export function assertPaginatedResponse(
  response: Response,
  dataPath: string,
  expectedTotalItems?: number,
  expectedPageSize?: number
): Record<string, any> {
  const data = assertGraphQLData(response, dataPath);
  
  // Validate pagination structure
  expect(data).toHaveProperty('items');
  expect(data).toHaveProperty('meta');
  expect(data.meta).toHaveProperty('totalItems');
  expect(data.meta).toHaveProperty('itemsPerPage');
  expect(data.meta).toHaveProperty('currentPage');
  expect(data.meta).toHaveProperty('totalPages');
  
  if (expectedTotalItems !== undefined) {
    expect(data.meta.totalItems).toBe(expectedTotalItems);
  }
  
  if (expectedPageSize !== undefined) {
    expect(data.meta.itemsPerPage).toBe(expectedPageSize);
  }
  
  return data;
}

/**
 * Asserts that the response contains a valid cursor-based paginated response
 * @param response - The supertest response object
 * @param dataPath - Path to the paginated data to validate
 * @param expectedHasNextPage - Optional expected value for hasNextPage
 */
export function assertCursorPaginatedResponse(
  response: Response,
  dataPath: string,
  expectedHasNextPage?: boolean
): Record<string, any> {
  const data = assertGraphQLData(response, dataPath);
  
  // Validate cursor pagination structure
  expect(data).toHaveProperty('edges');
  expect(data).toHaveProperty('pageInfo');
  expect(data.pageInfo).toHaveProperty('hasNextPage');
  expect(data.pageInfo).toHaveProperty('endCursor');
  
  if (expectedHasNextPage !== undefined) {
    expect(data.pageInfo.hasNextPage).toBe(expectedHasNextPage);
  }
  
  return data;
}