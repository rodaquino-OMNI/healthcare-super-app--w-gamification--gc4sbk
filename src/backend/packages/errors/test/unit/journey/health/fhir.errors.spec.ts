import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../../shared/src/exceptions/exceptions.types';
import {
  FhirError,
  FhirErrorContext,
  FhirConnectionFailureError,
  FhirAuthenticationError,
  InvalidResourceError,
  UnsupportedResourceTypeError,
  ResourceParsingError,
  FhirOperationTimeoutError,
  ResourceNotFoundError,
  FhirOperationNotPermittedError,
  UnexpectedFhirResponseError,
  createFhirErrorFromStatusCode
} from '../../../../src/journey/health/fhir.errors';

/**
 * Test suite for Health journey FHIR integration error classes.
 * Validates that FHIR-specific errors use proper HEALTH_FHIR_ prefixed error codes,
 * include appropriate FHIR context data, follow the error classification system,
 * and correctly serialize for client responses.
 */
describe('Health Journey FHIR Errors', () => {
  /**
   * Helper function to check if an error code starts with the expected prefix
   */
  const hasCorrectPrefix = (errorCode: string): boolean => {
    return errorCode.startsWith('HEALTH_FHIR_');
  };

  /**
   * Helper function to get the expected HTTP status based on error type
   */
  const getExpectedHttpStatus = (errorType: ErrorType): HttpStatus => {
    switch (errorType) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.BUSINESS:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  };

  /**
   * Sample FHIR context for testing
   */
  const sampleContext: FhirErrorContext = {
    resourceType: 'Patient',
    operation: 'read',
    endpoint: 'https://fhir.example.org/api/fhir/r4',
    resourceId: 'patient-123',
    additionalInfo: {
      requestId: 'req-456',
      timestamp: '2023-05-15T14:30:00Z'
    }
  };

  describe('FhirError (Base Class)', () => {
    // Create a concrete implementation of the abstract base class for testing
    class TestFhirError extends FhirError {
      constructor(
        message: string,
        context: FhirErrorContext,
        cause?: Error
      ) {
        super(message, ErrorType.TECHNICAL, 'HEALTH_FHIR_TEST', context, cause);
        Object.setPrototypeOf(this, TestFhirError.prototype);
      }
    }

    const message = 'Test FHIR error';
    const cause = new Error('Original error');
    const error = new TestFhirError(message, sampleContext, cause);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TestFhirError');
    });

    it('should store the provided context', () => {
      expect(error.context).toEqual(sampleContext);
    });

    it('should include FHIR context in JSON representation', () => {
      const json = error.toJSON();
      expect(json.error.details).toBeDefined();
      expect(json.error.details.fhir).toBeDefined();
      expect(json.error.details.fhir.resourceType).toBe(sampleContext.resourceType);
      expect(json.error.details.fhir.operation).toBe(sampleContext.operation);
      expect(json.error.details.fhir.endpoint).toBe(sampleContext.endpoint);
      expect(json.error.details.fhir.resourceId).toBe(sampleContext.resourceId);
      expect(json.error.details.additionalInfo).toEqual(sampleContext.additionalInfo);
    });

    it('should preserve the cause in the error chain', () => {
      expect(error.cause).toBe(cause);
    });
  });

  describe('FhirConnectionFailureError', () => {
    const message = 'Failed to connect to FHIR server';
    const error = new FhirConnectionFailureError(message, sampleContext);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('FhirConnectionFailureError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.EXTERNAL));
    });

    it('should include cause when provided', () => {
      const cause = new Error('Network error');
      const errorWithCause = new FhirConnectionFailureError(message, sampleContext, cause);
      expect(errorWithCause.cause).toBe(cause);
    });
  });

  describe('FhirAuthenticationError', () => {
    const message = 'Authentication failed with FHIR server';
    const error = new FhirAuthenticationError(message, sampleContext);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('FhirAuthenticationError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.EXTERNAL));
    });
  });

  describe('InvalidResourceError', () => {
    const message = 'Invalid FHIR resource format';
    const error = new InvalidResourceError(message, sampleContext);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('InvalidResourceError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.VALIDATION));
    });
  });

  describe('UnsupportedResourceTypeError', () => {
    const unsupportedType = 'DeviceDefinition';
    const context: FhirErrorContext = {
      ...sampleContext,
      resourceType: unsupportedType
    };
    const message = `Resource type '${unsupportedType}' is not supported`;
    const error = new UnsupportedResourceTypeError(message, context);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('UnsupportedResourceTypeError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the resource type in the error message', () => {
      expect(error.message).toContain(unsupportedType);
    });

    it('should include the resource type in the context', () => {
      expect(error.context.resourceType).toBe(unsupportedType);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.VALIDATION));
    });
  });

  describe('ResourceParsingError', () => {
    const message = 'Failed to parse FHIR resource';
    const error = new ResourceParsingError(message, sampleContext);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('ResourceParsingError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.TECHNICAL));
    });

    it('should include cause when provided', () => {
      const cause = new SyntaxError('Invalid JSON');
      const errorWithCause = new ResourceParsingError(message, sampleContext, cause);
      expect(errorWithCause.cause).toBe(cause);
    });
  });

  describe('FhirOperationTimeoutError', () => {
    const message = 'FHIR operation timed out';
    const error = new FhirOperationTimeoutError(message, sampleContext);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('FhirOperationTimeoutError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided message', () => {
      expect(error.message).toBe(message);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.EXTERNAL));
    });
  });

  describe('ResourceNotFoundError', () => {
    const resourceId = 'patient-456';
    const context: FhirErrorContext = {
      ...sampleContext,
      resourceId
    };
    const message = `FHIR resource with ID '${resourceId}' not found`;
    const error = new ResourceNotFoundError(message, context);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('ResourceNotFoundError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the resource ID in the error message', () => {
      expect(error.message).toContain(resourceId);
    });

    it('should include the resource ID in the context', () => {
      expect(error.context.resourceId).toBe(resourceId);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.BUSINESS));
    });
  });

  describe('FhirOperationNotPermittedError', () => {
    const operation = 'create';
    const context: FhirErrorContext = {
      ...sampleContext,
      operation
    };
    const message = `FHIR operation '${operation}' not permitted for resource type '${sampleContext.resourceType}'`;
    const error = new FhirOperationNotPermittedError(message, context);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('FhirOperationNotPermittedError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the operation in the error message', () => {
      expect(error.message).toContain(operation);
    });

    it('should include the resource type in the error message', () => {
      expect(error.message).toContain(sampleContext.resourceType);
    });

    it('should include the operation in the context', () => {
      expect(error.context.operation).toBe(operation);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.BUSINESS));
    });
  });

  describe('UnexpectedFhirResponseError', () => {
    const statusCode = 503;
    const message = `FHIR server returned unexpected status code: ${statusCode}`;
    const error = new UnexpectedFhirResponseError(message, sampleContext, statusCode);

    it('should extend FhirError', () => {
      expect(error).toBeInstanceOf(FhirError);
      expect(error.name).toBe('UnexpectedFhirResponseError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the status code in the error message', () => {
      expect(error.message).toContain(statusCode.toString());
    });

    it('should include the status code in the context additionalInfo', () => {
      expect(error.context.additionalInfo.statusCode).toBe(statusCode);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.EXTERNAL));
    });

    it('should include cause when provided', () => {
      const cause = new Error('Server error');
      const errorWithCause = new UnexpectedFhirResponseError(message, sampleContext, statusCode, cause);
      expect(errorWithCause.cause).toBe(cause);
    });
  });

  describe('createFhirErrorFromStatusCode', () => {
    const message = 'FHIR operation failed';

    it('should create FhirAuthenticationError for 401 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 401);
      expect(error).toBeInstanceOf(FhirAuthenticationError);
    });

    it('should create FhirAuthenticationError for 403 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 403);
      expect(error).toBeInstanceOf(FhirAuthenticationError);
    });

    it('should create ResourceNotFoundError for 404 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 404);
      expect(error).toBeInstanceOf(ResourceNotFoundError);
    });

    it('should create FhirOperationTimeoutError for 408 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 408);
      expect(error).toBeInstanceOf(FhirOperationTimeoutError);
    });

    it('should create FhirOperationTimeoutError for 504 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 504);
      expect(error).toBeInstanceOf(FhirOperationTimeoutError);
    });

    it('should create InvalidResourceError for 422 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 422);
      expect(error).toBeInstanceOf(InvalidResourceError);
    });

    it('should create InvalidResourceError for 400 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 400);
      expect(error).toBeInstanceOf(InvalidResourceError);
    });

    it('should create FhirOperationNotPermittedError for 405 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 405);
      expect(error).toBeInstanceOf(FhirOperationNotPermittedError);
    });

    it('should create FhirOperationNotPermittedError for 409 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 409);
      expect(error).toBeInstanceOf(FhirOperationNotPermittedError);
    });

    it('should create UnexpectedFhirResponseError for 500 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 500);
      expect(error).toBeInstanceOf(UnexpectedFhirResponseError);
    });

    it('should create UnexpectedFhirResponseError for 502 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 502);
      expect(error).toBeInstanceOf(UnexpectedFhirResponseError);
    });

    it('should create UnexpectedFhirResponseError for 503 status code', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 503);
      expect(error).toBeInstanceOf(UnexpectedFhirResponseError);
    });

    it('should create UnexpectedFhirResponseError for unhandled status codes', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 418); // I'm a teapot
      expect(error).toBeInstanceOf(UnexpectedFhirResponseError);
    });

    it('should preserve the cause when provided', () => {
      const cause = new Error('Original error');
      const error = createFhirErrorFromStatusCode(message, sampleContext, 500, cause);
      expect(error.cause).toBe(cause);
    });

    it('should preserve the context in created errors', () => {
      const error = createFhirErrorFromStatusCode(message, sampleContext, 404);
      expect(error.context).toEqual(sampleContext);
    });
  });
});