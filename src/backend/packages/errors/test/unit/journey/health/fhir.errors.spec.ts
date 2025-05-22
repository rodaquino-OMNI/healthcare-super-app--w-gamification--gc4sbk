import { ErrorType } from '../../../../../../shared/src/exceptions/exceptions.types';
import {
  FhirError,
  FhirConnectionFailureError,
  FhirAuthenticationError,
  InvalidFhirResourceError,
  FhirSchemaViolationError,
  FhirParsingError,
  UnsupportedFhirResourceTypeError,
  FhirOperationError,
  FhirRateLimitExceededError,
  FhirTransactionError,
  FhirResourceErrorContext,
  FhirEndpointErrorContext
} from '../../../../src/journey/health/fhir.errors';

describe('FHIR Error Classes', () => {
  describe('FhirError (Base Class)', () => {
    it('should be instantiable with required parameters', () => {
      // Create a concrete implementation of the abstract class for testing
      class TestFhirError extends FhirError {
        constructor(message: string, details?: any) {
          super(message, ErrorType.TECHNICAL, 'HEALTH_FHIR_TEST', details);
          Object.setPrototypeOf(this, TestFhirError.prototype);
        }
      }

      const error = new TestFhirError('Test FHIR error');
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error.message).toBe('Test FHIR error');
      expect(error.code).toBe('HEALTH_FHIR_TEST');
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should sanitize details in toJSON method', () => {
      class TestFhirError extends FhirError {
        constructor(message: string, details?: any) {
          super(message, ErrorType.TECHNICAL, 'HEALTH_FHIR_TEST', details);
          Object.setPrototypeOf(this, TestFhirError.prototype);
        }

        protected override sanitizeDetails(): Record<string, any> {
          return { sanitized: true };
        }
      }

      const error = new TestFhirError('Test FHIR error', { sensitive: 'data' });
      const json = error.toJSON();
      
      expect(json.error.details).toEqual({ sanitized: true });
      expect(json.error.details).not.toEqual({ sensitive: 'data' });
    });
  });

  describe('FhirConnectionFailureError', () => {
    const endpointContext: FhirEndpointErrorContext = {
      endpoint: 'https://fhir.example.com/api/v1',
      method: 'GET'
    };

    it('should be instantiable with required parameters', () => {
      const error = new FhirConnectionFailureError(
        'Failed to connect to FHIR server',
        endpointContext
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirConnectionFailureError);
      expect(error.message).toBe('Failed to connect to FHIR server');
      expect(error.code).toBe('HEALTH_FHIR_CONNECTION_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.endpointContext).toBe(endpointContext);
    });

    it('should include endpoint context in error details', () => {
      const error = new FhirConnectionFailureError(
        'Failed to connect to FHIR server',
        endpointContext
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('endpoint');
      expect(json.error.details.endpoint).toEqual(endpointContext);
    });

    it('should sanitize sensitive information in endpoint URLs', () => {
      const endpointWithAuth: FhirEndpointErrorContext = {
        endpoint: 'https://username:password@fhir.example.com/api/v1?token=secret123',
        method: 'GET'
      };

      const error = new FhirConnectionFailureError(
        'Failed to connect to FHIR server',
        endpointWithAuth
      );
      
      const json = error.toJSON();
      const sanitizedEndpoint = json.error.details.endpoint.endpoint;
      
      expect(sanitizedEndpoint).not.toContain('password');
      expect(sanitizedEndpoint).not.toContain('secret123');
      expect(sanitizedEndpoint).toContain('*****');
    });
  });

  describe('FhirAuthenticationError', () => {
    const endpointContext: FhirEndpointErrorContext = {
      endpoint: 'https://fhir.example.com/api/v1',
      method: 'GET',
      context: {
        authorization: 'Bearer token123',
        apiKey: 'api-key-123'
      }
    };

    it('should be instantiable with required parameters', () => {
      const error = new FhirAuthenticationError(
        'Authentication failed with FHIR server',
        endpointContext
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirAuthenticationError);
      expect(error.message).toBe('Authentication failed with FHIR server');
      expect(error.code).toBe('HEALTH_FHIR_AUTHENTICATION_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.endpointContext).toBe(endpointContext);
    });

    it('should sanitize authentication details in error response', () => {
      const error = new FhirAuthenticationError(
        'Authentication failed with FHIR server',
        endpointContext
      );
      
      const json = error.toJSON();
      
      // Check that auth tokens are removed from context
      expect(json.error.details.endpoint.context).not.toHaveProperty('authorization');
      expect(json.error.details.endpoint.context).not.toHaveProperty('token');
      expect(json.error.details.endpoint.context).not.toHaveProperty('apiKey');
    });
  });

  describe('InvalidFhirResourceError', () => {
    const resourceContext: FhirResourceErrorContext = {
      resourceType: 'Patient',
      resourceId: '123',
      operation: 'create'
    };

    const validationErrors = [
      'Missing required field: name',
      'Invalid format for field: birthDate'
    ];

    it('should be instantiable with required parameters', () => {
      const error = new InvalidFhirResourceError(
        'Invalid FHIR Patient resource',
        resourceContext,
        validationErrors
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(InvalidFhirResourceError);
      expect(error.message).toBe('Invalid FHIR Patient resource');
      expect(error.code).toBe('HEALTH_FHIR_INVALID_RESOURCE');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.resourceContext).toBe(resourceContext);
      expect(error.validationErrors).toBe(validationErrors);
    });

    it('should include resource context and validation errors in error details', () => {
      const error = new InvalidFhirResourceError(
        'Invalid FHIR Patient resource',
        resourceContext,
        validationErrors
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('resource');
      expect(json.error.details).toHaveProperty('validationErrors');
      expect(json.error.details.resource).toEqual(resourceContext);
      expect(json.error.details.validationErrors).toEqual(validationErrors);
    });

    it('should sanitize PHI in validation error messages', () => {
      const errorsWithPhi = [
        'Invalid value "John Doe" for field: name',
        'Invalid format for birthDate: "1980-01-01"'
      ];

      const error = new InvalidFhirResourceError(
        'Invalid FHIR Patient resource',
        resourceContext,
        errorsWithPhi
      );
      
      const json = error.toJSON();
      const sanitizedErrors = json.error.details.validationErrors;
      
      expect(sanitizedErrors[0]).not.toContain('John Doe');
      expect(sanitizedErrors[1]).not.toContain('1980-01-01');
      expect(sanitizedErrors[0]).toContain('[REDACTED]');
    });
  });

  describe('FhirSchemaViolationError', () => {
    const resourceContext: FhirResourceErrorContext = {
      resourceType: 'Observation',
      resourceId: '456',
      operation: 'create'
    };

    const schemaErrors = [
      { path: 'code', message: 'Required property missing', keyword: 'required' },
      { path: 'value[x]', message: 'Invalid type', keyword: 'type', value: '98.6F' }
    ];

    it('should be instantiable with required parameters', () => {
      const error = new FhirSchemaViolationError(
        'FHIR Observation resource violates schema',
        resourceContext,
        schemaErrors
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirSchemaViolationError);
      expect(error.message).toBe('FHIR Observation resource violates schema');
      expect(error.code).toBe('HEALTH_FHIR_SCHEMA_VIOLATION');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.resourceContext).toBe(resourceContext);
      expect(error.schemaErrors).toBe(schemaErrors);
    });

    it('should include resource context and schema errors in error details', () => {
      const error = new FhirSchemaViolationError(
        'FHIR Observation resource violates schema',
        resourceContext,
        schemaErrors
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('resource');
      expect(json.error.details).toHaveProperty('schemaErrors');
      expect(json.error.details.resource).toEqual(resourceContext);
    });

    it('should sanitize PHI in schema error details', () => {
      const errorsWithPhi = [
        { path: 'name', message: 'Invalid value', keyword: 'type', value: 'John Doe' },
        { path: 'birthDate', message: 'Invalid format', keyword: 'format', value: '1980-01-01' },
        { path: 'identifier', message: 'Duplicate', keyword: 'uniqueItems', value: '123-45-6789' }
      ];

      const error = new FhirSchemaViolationError(
        'FHIR Patient resource violates schema',
        resourceContext,
        errorsWithPhi
      );
      
      const json = error.toJSON();
      const sanitizedErrors = json.error.details.schemaErrors;
      
      // Should only include safe fields
      sanitizedErrors.forEach((error: any) => {
        expect(error).toHaveProperty('path');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('keyword');
        expect(error).not.toHaveProperty('value');
      });
    });
  });

  describe('FhirParsingError', () => {
    const resourceContext: FhirResourceErrorContext = {
      resourceType: 'MedicationRequest',
      operation: 'read'
    };

    const parsingDetails = {
      rawData: '<malformed>xml</data>',
      contentType: 'application/fhir+xml',
      position: 10,
      errorType: 'syntax'
    };

    it('should be instantiable with required parameters', () => {
      const error = new FhirParsingError(
        'Failed to parse FHIR MedicationRequest resource',
        resourceContext,
        parsingDetails
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirParsingError);
      expect(error.message).toBe('Failed to parse FHIR MedicationRequest resource');
      expect(error.code).toBe('HEALTH_FHIR_PARSING_FAILURE');
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.resourceContext).toBe(resourceContext);
      expect(error.parsingDetails).toBe(parsingDetails);
    });

    it('should include resource context and parsing details in error details', () => {
      const error = new FhirParsingError(
        'Failed to parse FHIR MedicationRequest resource',
        resourceContext,
        parsingDetails
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('resource');
      expect(json.error.details).toHaveProperty('parsingDetails');
      expect(json.error.details.resource).toEqual(resourceContext);
    });

    it('should remove raw data from parsing details to protect PHI', () => {
      const error = new FhirParsingError(
        'Failed to parse FHIR MedicationRequest resource',
        resourceContext,
        parsingDetails
      );
      
      const json = error.toJSON();
      const sanitizedDetails = json.error.details.parsingDetails;
      
      expect(sanitizedDetails).not.toHaveProperty('rawData');
      expect(sanitizedDetails).not.toHaveProperty('content');
      expect(sanitizedDetails).not.toHaveProperty('body');
      expect(sanitizedDetails).toHaveProperty('contentType');
      expect(sanitizedDetails).toHaveProperty('position');
      expect(sanitizedDetails).toHaveProperty('errorType');
    });
  });

  describe('UnsupportedFhirResourceTypeError', () => {
    const resourceType = 'DeviceDefinition';
    const supportedTypes = ['Patient', 'Observation', 'MedicationRequest'];
    const operationContext = { action: 'create', source: 'external-system' };

    it('should be instantiable with required parameters', () => {
      const error = new UnsupportedFhirResourceTypeError(
        'Unsupported FHIR resource type: DeviceDefinition',
        resourceType,
        supportedTypes,
        operationContext
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(UnsupportedFhirResourceTypeError);
      expect(error.message).toBe('Unsupported FHIR resource type: DeviceDefinition');
      expect(error.code).toBe('HEALTH_FHIR_UNSUPPORTED_RESOURCE_TYPE');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.resourceType).toBe(resourceType);
      expect(error.supportedTypes).toBe(supportedTypes);
      expect(error.operationContext).toBe(operationContext);
    });

    it('should include resource type, supported types, and operation context in error details', () => {
      const error = new UnsupportedFhirResourceTypeError(
        'Unsupported FHIR resource type: DeviceDefinition',
        resourceType,
        supportedTypes,
        operationContext
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('resourceType');
      expect(json.error.details).toHaveProperty('supportedTypes');
      expect(json.error.details).toHaveProperty('operationContext');
      expect(json.error.details.resourceType).toBe(resourceType);
      expect(json.error.details.supportedTypes).toEqual(supportedTypes);
      expect(json.error.details.operationContext).toEqual(operationContext);
    });
  });

  describe('FhirOperationError', () => {
    const resourceContext: FhirResourceErrorContext = {
      resourceType: 'Immunization',
      resourceId: '789',
      operation: 'update'
    };

    const operationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'invalid',
          details: {
            text: 'The status must be one of: completed | entered-in-error | not-done'
          },
          diagnostics: 'Patient John Doe (MRN: 123456) has invalid status value'
        }
      ]
    };

    it('should be instantiable with required parameters', () => {
      const error = new FhirOperationError(
        'FHIR operation failed: update Immunization',
        resourceContext,
        operationOutcome
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirOperationError);
      expect(error.message).toBe('FHIR operation failed: update Immunization');
      expect(error.code).toBe('HEALTH_FHIR_OPERATION_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.resourceContext).toBe(resourceContext);
      expect(error.operationOutcome).toBe(operationOutcome);
    });

    it('should include resource context and operation outcome in error details', () => {
      const error = new FhirOperationError(
        'FHIR operation failed: update Immunization',
        resourceContext,
        operationOutcome
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('resource');
      expect(json.error.details).toHaveProperty('operationOutcome');
      expect(json.error.details.resource).toEqual(resourceContext);
    });

    it('should sanitize PHI from operation outcome', () => {
      const error = new FhirOperationError(
        'FHIR operation failed: update Immunization',
        resourceContext,
        operationOutcome
      );
      
      const json = error.toJSON();
      const sanitizedOutcome = json.error.details.operationOutcome;
      
      // Should preserve structure but remove diagnostics with PHI
      expect(sanitizedOutcome).toHaveProperty('resourceType');
      expect(sanitizedOutcome).toHaveProperty('issue');
      expect(sanitizedOutcome.issue[0]).toHaveProperty('severity');
      expect(sanitizedOutcome.issue[0]).toHaveProperty('code');
      expect(sanitizedOutcome.issue[0]).toHaveProperty('details');
      expect(sanitizedOutcome.issue[0].details).toHaveProperty('text');
      expect(sanitizedOutcome.issue[0]).not.toHaveProperty('diagnostics');
    });
  });

  describe('FhirRateLimitExceededError', () => {
    const endpointContext: FhirEndpointErrorContext = {
      endpoint: 'https://fhir.example.com/api/v1',
      method: 'GET',
      statusCode: 429
    };

    const retryAfterSeconds = 60;

    it('should be instantiable with required parameters', () => {
      const error = new FhirRateLimitExceededError(
        'FHIR rate limit exceeded',
        endpointContext,
        retryAfterSeconds
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirRateLimitExceededError);
      expect(error.message).toBe('FHIR rate limit exceeded');
      expect(error.code).toBe('HEALTH_FHIR_RATE_LIMIT_EXCEEDED');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.endpointContext).toBe(endpointContext);
      expect(error.retryAfterSeconds).toBe(retryAfterSeconds);
    });

    it('should include endpoint context and retry information in error details', () => {
      const error = new FhirRateLimitExceededError(
        'FHIR rate limit exceeded',
        endpointContext,
        retryAfterSeconds
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('endpoint');
      expect(json.error.details).toHaveProperty('retryAfter');
      expect(json.error.details.endpoint).toEqual(endpointContext);
      expect(json.error.details.retryAfter).toBe(retryAfterSeconds);
    });

    it('should sanitize sensitive information in endpoint URLs', () => {
      const endpointWithAuth: FhirEndpointErrorContext = {
        endpoint: 'https://username:password@fhir.example.com/api/v1?token=secret123',
        method: 'GET',
        statusCode: 429
      };

      const error = new FhirRateLimitExceededError(
        'FHIR rate limit exceeded',
        endpointWithAuth,
        retryAfterSeconds
      );
      
      const json = error.toJSON();
      const sanitizedEndpoint = json.error.details.endpoint.endpoint;
      
      expect(sanitizedEndpoint).not.toContain('password');
      expect(sanitizedEndpoint).not.toContain('secret123');
      expect(sanitizedEndpoint).toContain('*****');
    });
  });

  describe('FhirTransactionError', () => {
    const transactionDetails = {
      transactionId: 'tx-123',
      requestMethod: 'POST',
      endpoint: '/fhir/Bundle',
      timestamp: '2023-05-15T10:30:00Z',
      bundle: {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          { resource: { resourceType: 'Patient', id: 'p1' } },
          { resource: { resourceType: 'Observation', id: 'o1' } }
        ]
      }
    };

    const failedResources: FhirResourceErrorContext[] = [
      { resourceType: 'Patient', resourceId: 'p1', operation: 'create' },
      { resourceType: 'Observation', resourceId: 'o1', operation: 'create' }
    ];

    it('should be instantiable with required parameters', () => {
      const error = new FhirTransactionError(
        'FHIR transaction failed',
        transactionDetails,
        failedResources
      );
      
      expect(error).toBeInstanceOf(FhirError);
      expect(error).toBeInstanceOf(FhirTransactionError);
      expect(error.message).toBe('FHIR transaction failed');
      expect(error.code).toBe('HEALTH_FHIR_TRANSACTION_FAILURE');
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.transactionDetails).toBe(transactionDetails);
      expect(error.failedResources).toBe(failedResources);
    });

    it('should include transaction details and failed resources in error details', () => {
      const error = new FhirTransactionError(
        'FHIR transaction failed',
        transactionDetails,
        failedResources
      );
      
      const json = error.toJSON();
      expect(json.error.details).toHaveProperty('transaction');
      expect(json.error.details).toHaveProperty('failedResources');
      expect(json.error.details.failedResources).toEqual(failedResources);
    });

    it('should sanitize transaction details to protect PHI', () => {
      const error = new FhirTransactionError(
        'FHIR transaction failed',
        transactionDetails,
        failedResources
      );
      
      const json = error.toJSON();
      const sanitizedTransaction = json.error.details.transaction;
      
      // Should not include the actual bundle resources
      expect(sanitizedTransaction).not.toHaveProperty('bundle');
      expect(sanitizedTransaction).not.toHaveProperty('rawData');
      expect(sanitizedTransaction).not.toHaveProperty('content');
      expect(sanitizedTransaction).not.toHaveProperty('body');
      
      // Should include resource count instead of actual resources
      expect(sanitizedTransaction).toHaveProperty('resourceCount');
      expect(sanitizedTransaction.resourceCount).toBe(2);
      
      // Should preserve non-PHI transaction metadata
      expect(sanitizedTransaction).toHaveProperty('transactionId');
      expect(sanitizedTransaction).toHaveProperty('requestMethod');
      expect(sanitizedTransaction).toHaveProperty('endpoint');
      expect(sanitizedTransaction).toHaveProperty('timestamp');
    });
  });
});