import { HttpStatus, INestApplication } from '@nestjs/common'; // @nestjs/common v10.3.0
import { Test } from '@nestjs/testing'; // @nestjs/testing v10.3.0
import * as request from 'supertest'; // supertest v6.3.4
import { AppModule } from '@app/api-gateway/src/app.module'; // Using path alias
import { describe, it, expect, beforeEach, afterAll } from '@jest/globals'; // @jest/globals v29.0.0
import { ApiErrorResponse } from '@austa/interfaces/common/dto/error-response.dto'; // Using standardized error interface

/**
 * API Gateway E2E Tests
 * 
 * This suite tests the API Gateway's core functionality, including:
 * - Proper routing of requests to the /graphql endpoint
 * - Authentication of protected endpoints
 * - Handling of valid GraphQL queries
 * - Error handling and response validation
 */
describe('API Gateway E2E Tests', () => {
  let app: INestApplication;

  /**
   * Sets up the testing environment before each test case.
   * This includes creating a testing module and initializing the NestJS application.
   */
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /**
   * Cleans up the testing environment after all test cases are executed.
   * This includes closing the NestJS application to release resources.
   */
  afterAll(async () => {
    await app.close();
  });

  /**
   * Test case: should return 200 OK for /graphql endpoint
   * 
   * Verifies that the /graphql endpoint is accessible and returns a 200 OK status code.
   * This ensures that the API Gateway is properly routing requests to the GraphQL handler.
   */
  it('should return 200 OK for /graphql endpoint', () => {
    return request(app.getHttpServer())
      .get('/graphql')
      .expect(HttpStatus.OK)
      .expect((res) => {
        // Enhanced error handling with improved assertions
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body).toBeDefined();
      });
  });

  /**
   * Test case: should return a valid response for a simple GraphQL query
   * 
   * Verifies that the API Gateway can handle a simple GraphQL query and returns a valid response.
   * This ensures that the GraphQL handler is correctly configured and can process queries.
   * Updated to ensure compatibility with standardized event schemas.
   */
  it('should return a valid response for a simple GraphQL query', () => {
    const query = `
      query {
        __typename
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(HttpStatus.OK)
      .expect((res) => {
        // Enhanced error handling with improved assertions
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body).toBeDefined();
        expect(res.body.data).toBeDefined();
        expect(res.body.data.__typename).toBeDefined();
        expect(res.body.errors).toBeUndefined();
      });
  });

  /**
   * Test case: should return 401 Unauthorized for a protected endpoint without a valid token
   * 
   * Verifies that the API Gateway correctly protects endpoints that require authentication.
   * This ensures that only authorized users with a valid JWT token can access protected resources.
   * Enhanced with standardized error response validation.
   */
  it('should return 401 Unauthorized for a protected endpoint without a valid token', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        // Enhanced error handling with improved assertions
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        
        // Validate the error response structure using the standardized ApiErrorResponse interface
        const errorResponse = res.body as ApiErrorResponse;
        expect(errorResponse).toBeDefined();
        expect(errorResponse.statusCode).toBe(HttpStatus.UNAUTHORIZED);
        expect(errorResponse.message).toBeDefined();
        expect(errorResponse.errorCode).toBeDefined();
        expect(errorResponse.errorTime).toBeDefined();
      });
  });

  /**
   * Test case: should handle GraphQL validation errors properly
   * 
   * Verifies that the API Gateway correctly handles and returns validation errors for invalid GraphQL queries.
   * This ensures proper validation for API requests and responses.
   */
  it('should handle GraphQL validation errors properly', () => {
    const invalidQuery = `
      query {
        nonExistentField
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: invalidQuery })
      .expect(HttpStatus.OK) // GraphQL returns 200 even for validation errors
      .expect((res) => {
        // Enhanced error handling with improved assertions
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body).toBeDefined();
        expect(res.body.errors).toBeDefined();
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
        expect(res.body.errors[0].message).toBeDefined();
      });
  });
});