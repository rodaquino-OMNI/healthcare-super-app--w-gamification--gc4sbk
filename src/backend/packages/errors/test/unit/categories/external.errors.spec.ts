import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the external error classes and related types
import {
  ExternalApiError,
  IntegrationError,
  ExternalDependencyUnavailableError,
  ExternalAuthenticationError,
  ExternalResponseFormatError,
  ExternalRateLimitError
} from '../../../src/categories/external.errors';
import { BaseError, ErrorType } from '../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../src/constants';

/**
 * Test suite for external system integration error classes
 * Verifies that external error classes correctly instantiate with appropriate
 * error messages, HTTP status codes, and integration context details
 */
describe('External Error Classes', () => {
  // Common test data
  const errorMessage = 'External system error';
  const errorCode = 'EXT_001';
  const serviceId = 'payment-gateway';
  const originalError = new Error('Original error from external system');
  
  describe('ExternalApiError', () => {
    it('should create an ExternalApiError with all properties', () => {
      const responseStatus = 500;
      const responseBody = { error: 'Internal server error' };
      const requestDetails = { method: 'POST', url: '/api/payments' };
      
      const error = new ExternalApiError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        responseStatus,
        responseBody,
        requestDetails,
        cause: originalError
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.cause).toBe(originalError);
      
      // Verify external API specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.responseStatus).toBe(responseStatus);
      expect(error.responseBody).toEqual(responseBody);
      expect(error.requestDetails).toEqual(requestDetails);
      
      // Verify inheritance
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ExternalApiError).toBe(true);
    });

    it('should create an ExternalApiError with minimal properties', () => {
      const error = new ExternalApiError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify external API specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.responseStatus).toBeUndefined();
      expect(error.responseBody).toBeUndefined();
      expect(error.requestDetails).toBeUndefined();
    });

    it('should convert to HttpException with BAD_GATEWAY status code', () => {
      const error = new ExternalApiError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include external API details in serialized output', () => {
      const responseStatus = 500;
      const responseBody = { error: 'Internal server error' };
      const requestDetails = { method: 'POST', url: '/api/payments' };
      
      const error = new ExternalApiError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        responseStatus,
        responseBody,
        requestDetails
      });

      const json = error.toJSON();
      
      // Verify serialized output includes external API details
      expect(json.error.type).toBe(ErrorType.EXTERNAL);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeDefined();
      expect(json.error.details.serviceId).toBe(serviceId);
      expect(json.error.details.responseStatus).toBe(responseStatus);
      expect(json.error.details.responseBody).toEqual(responseBody);
      expect(json.error.details.requestDetails).toEqual(requestDetails);
    });
  });

  describe('IntegrationError', () => {
    it('should create an IntegrationError with all properties', () => {
      const integrationPoint = 'payment-processing';
      const operationName = 'processPayment';
      
      const error = new IntegrationError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        integrationPoint,
        operationName,
        cause: originalError
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.cause).toBe(originalError);
      
      // Verify integration specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.integrationPoint).toBe(integrationPoint);
      expect(error.operationName).toBe(operationName);
      
      // Verify inheritance
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof IntegrationError).toBe(true);
    });

    it('should create an IntegrationError with minimal properties', () => {
      const error = new IntegrationError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify integration specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.integrationPoint).toBeUndefined();
      expect(error.operationName).toBeUndefined();
    });

    it('should convert to HttpException with BAD_GATEWAY status code', () => {
      const error = new IntegrationError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include integration details in serialized output', () => {
      const integrationPoint = 'payment-processing';
      const operationName = 'processPayment';
      
      const error = new IntegrationError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        integrationPoint,
        operationName
      });

      const json = error.toJSON();
      
      // Verify serialized output includes integration details
      expect(json.error.type).toBe(ErrorType.EXTERNAL);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeDefined();
      expect(json.error.details.serviceId).toBe(serviceId);
      expect(json.error.details.integrationPoint).toBe(integrationPoint);
      expect(json.error.details.operationName).toBe(operationName);
    });
  });

  describe('ExternalDependencyUnavailableError', () => {
    it('should create an ExternalDependencyUnavailableError with all properties', () => {
      const dependencyName = 'payment-gateway';
      const lastChecked = new Date();
      const retryAfter = 30; // seconds
      
      const error = new ExternalDependencyUnavailableError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        dependencyName,
        lastChecked,
        retryAfter,
        cause: originalError
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.cause).toBe(originalError);
      
      // Verify dependency specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.dependencyName).toBe(dependencyName);
      expect(error.lastChecked).toBe(lastChecked);
      expect(error.retryAfter).toBe(retryAfter);
      
      // Verify inheritance
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ExternalDependencyUnavailableError).toBe(true);
    });

    it('should create an ExternalDependencyUnavailableError with minimal properties', () => {
      const error = new ExternalDependencyUnavailableError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify dependency specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.dependencyName).toBeUndefined();
      expect(error.lastChecked).toBeUndefined();
      expect(error.retryAfter).toBeUndefined();
    });

    it('should convert to HttpException with GATEWAY_TIMEOUT status code', () => {
      const error = new ExternalDependencyUnavailableError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT);
    });

    it('should include dependency details in serialized output', () => {
      const dependencyName = 'payment-gateway';
      const lastChecked = new Date('2023-01-01T12:00:00Z');
      const retryAfter = 30; // seconds
      
      const error = new ExternalDependencyUnavailableError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        dependencyName,
        lastChecked,
        retryAfter
      });

      const json = error.toJSON();
      
      // Verify serialized output includes dependency details
      expect(json.error.type).toBe(ErrorType.EXTERNAL);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeDefined();
      expect(json.error.details.serviceId).toBe(serviceId);
      expect(json.error.details.dependencyName).toBe(dependencyName);
      expect(json.error.details.lastChecked).toBe(lastChecked.toISOString());
      expect(json.error.details.retryAfter).toBe(retryAfter);
    });
  });

  describe('ExternalAuthenticationError', () => {
    it('should create an ExternalAuthenticationError with all properties', () => {
      const authMethod = 'oauth2';
      const authErrorCode = 'invalid_token';
      
      const error = new ExternalAuthenticationError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        authMethod,
        authErrorCode,
        cause: originalError
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.cause).toBe(originalError);
      
      // Verify authentication specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.authMethod).toBe(authMethod);
      expect(error.authErrorCode).toBe(authErrorCode);
      
      // Verify inheritance
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ExternalAuthenticationError).toBe(true);
    });

    it('should create an ExternalAuthenticationError with minimal properties', () => {
      const error = new ExternalAuthenticationError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify authentication specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.authMethod).toBeUndefined();
      expect(error.authErrorCode).toBeUndefined();
    });

    it('should convert to HttpException with BAD_GATEWAY status code', () => {
      const error = new ExternalAuthenticationError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include authentication details in serialized output', () => {
      const authMethod = 'oauth2';
      const authErrorCode = 'invalid_token';
      
      const error = new ExternalAuthenticationError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        authMethod,
        authErrorCode
      });

      const json = error.toJSON();
      
      // Verify serialized output includes authentication details
      expect(json.error.type).toBe(ErrorType.EXTERNAL);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeDefined();
      expect(json.error.details.serviceId).toBe(serviceId);
      expect(json.error.details.authMethod).toBe(authMethod);
      expect(json.error.details.authErrorCode).toBe(authErrorCode);
    });
  });

  describe('ExternalResponseFormatError', () => {
    it('should create an ExternalResponseFormatError with all properties', () => {
      const expectedFormat = 'JSON';
      const receivedFormat = 'XML';
      const responseData = '<xml>Invalid format</xml>';
      
      const error = new ExternalResponseFormatError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        expectedFormat,
        receivedFormat,
        responseData,
        cause: originalError
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.cause).toBe(originalError);
      
      // Verify format specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.expectedFormat).toBe(expectedFormat);
      expect(error.receivedFormat).toBe(receivedFormat);
      expect(error.responseData).toBe(responseData);
      
      // Verify inheritance
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ExternalResponseFormatError).toBe(true);
    });

    it('should create an ExternalResponseFormatError with minimal properties', () => {
      const error = new ExternalResponseFormatError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify format specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.expectedFormat).toBeUndefined();
      expect(error.receivedFormat).toBeUndefined();
      expect(error.responseData).toBeUndefined();
    });

    it('should convert to HttpException with BAD_GATEWAY status code', () => {
      const error = new ExternalResponseFormatError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.EXTERNAL);
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });

    it('should include format details in serialized output', () => {
      const expectedFormat = 'JSON';
      const receivedFormat = 'XML';
      const responseData = '<xml>Invalid format</xml>';
      
      const error = new ExternalResponseFormatError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        expectedFormat,
        receivedFormat,
        responseData
      });

      const json = error.toJSON();
      
      // Verify serialized output includes format details
      expect(json.error.type).toBe(ErrorType.EXTERNAL);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeDefined();
      expect(json.error.details.serviceId).toBe(serviceId);
      expect(json.error.details.expectedFormat).toBe(expectedFormat);
      expect(json.error.details.receivedFormat).toBe(receivedFormat);
      expect(json.error.details.responseData).toBe(responseData);
    });
  });

  describe('ExternalRateLimitError', () => {
    it('should create an ExternalRateLimitError with all properties', () => {
      const retryAfter = 60; // seconds
      const limitType = 'requests_per_minute';
      const limitValue = 100;
      
      const error = new ExternalRateLimitError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        retryAfter,
        limitType,
        limitValue,
        cause: originalError
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.cause).toBe(originalError);
      
      // Verify rate limit specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.retryAfter).toBe(retryAfter);
      expect(error.limitType).toBe(limitType);
      expect(error.limitValue).toBe(limitValue);
      
      // Verify inheritance
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof ExternalRateLimitError).toBe(true);
    });

    it('should create an ExternalRateLimitError with minimal properties', () => {
      const error = new ExternalRateLimitError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      // Verify basic properties
      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe(errorCode);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      
      // Verify rate limit specific properties
      expect(error.serviceId).toBe(serviceId);
      expect(error.retryAfter).toBeUndefined();
      expect(error.limitType).toBeUndefined();
      expect(error.limitValue).toBeUndefined();
    });

    it('should convert to HttpException with TOO_MANY_REQUESTS status code', () => {
      const error = new ExternalRateLimitError({
        message: errorMessage,
        code: errorCode,
        serviceId
      });

      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should include rate limit details in serialized output', () => {
      const retryAfter = 60; // seconds
      const limitType = 'requests_per_minute';
      const limitValue = 100;
      
      const error = new ExternalRateLimitError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        retryAfter,
        limitType,
        limitValue
      });

      const json = error.toJSON();
      
      // Verify serialized output includes rate limit details
      expect(json.error.type).toBe(ErrorType.EXTERNAL);
      expect(json.error.code).toBe(errorCode);
      expect(json.error.message).toBe(errorMessage);
      expect(json.error.details).toBeDefined();
      expect(json.error.details.serviceId).toBe(serviceId);
      expect(json.error.details.retryAfter).toBe(retryAfter);
      expect(json.error.details.limitType).toBe(limitType);
      expect(json.error.details.limitValue).toBe(limitValue);
    });

    it('should include Retry-After header in HTTP response', () => {
      const retryAfter = 60; // seconds
      
      const error = new ExternalRateLimitError({
        message: errorMessage,
        code: errorCode,
        serviceId,
        retryAfter
      });

      const httpException = error.toHttpException();
      const response = httpException.getResponse() as any;
      
      // Verify HTTP response includes Retry-After header
      expect(response.headers).toBeDefined();
      expect(response.headers['Retry-After']).toBe(retryAfter.toString());
    });
  });
});