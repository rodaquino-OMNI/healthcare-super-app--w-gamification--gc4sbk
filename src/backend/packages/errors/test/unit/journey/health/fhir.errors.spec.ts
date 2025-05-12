import {
  FhirConnectionFailureError,
  InvalidResourceError,
  ResourceNotFoundError,
  UnsupportedOperationError,
  FhirAuthenticationError,
  FhirProcessingError
} from '../../../../src/journey/health/fhir.errors';
import { ErrorCategory } from '../../../../src/categories';
import { HealthFhirErrorCode } from '../../../../src/journey/health/types';
import {
  assertErrorHasCode,
  assertErrorHasCategory,
  assertErrorHasStatusCode,
  assertErrorSerializesWithContext
} from '../../../helpers/assertion-helpers';

describe('Health Journey FHIR Error Classes', () => {
  describe('FhirConnectionFailureError', () => {
    it('should have the correct error code prefix', () => {
      const error = new FhirConnectionFailureError('Failed to connect to FHIR server', {
        endpoint: 'https://fhir.example.org/api/v4',
        operation: 'GET'
      });

      assertErrorHasCode(error, HealthFhirErrorCode.CONNECTION_FAILURE);
      expect(error.code).toMatch(/^HEALTH_FHIR_/);
    });

    it('should include FHIR endpoint context', () => {
      const endpoint = 'https://fhir.example.org/api/v4';
      const error = new FhirConnectionFailureError('Failed to connect to FHIR server', {
        endpoint,
        operation: 'GET'
      });

      expect(error.context).toHaveProperty('endpoint', endpoint);
      assertErrorSerializesWithContext(error, { endpoint });
    });

    it('should be categorized as an external dependency error', () => {
      const error = new FhirConnectionFailureError('Failed to connect to FHIR server', {
        endpoint: 'https://fhir.example.org/api/v4',
        operation: 'GET'
      });

      assertErrorHasCategory(error, ErrorCategory.EXTERNAL_DEPENDENCY);
    });

    it('should map to HTTP 503 status code', () => {
      const error = new FhirConnectionFailureError('Failed to connect to FHIR server', {
        endpoint: 'https://fhir.example.org/api/v4',
        operation: 'GET'
      });

      assertErrorHasStatusCode(error, 503);
    });
  });

  describe('InvalidResourceError', () => {
    it('should have the correct error code prefix', () => {
      const error = new InvalidResourceError('Invalid FHIR resource format', {
        resourceType: 'Patient',
        validationErrors: ['Missing required field: name']
      });

      assertErrorHasCode(error, HealthFhirErrorCode.INVALID_RESOURCE);
      expect(error.code).toMatch(/^HEALTH_FHIR_/);
    });

    it('should include resource type and validation errors in context', () => {
      const resourceType = 'Patient';
      const validationErrors = ['Missing required field: name'];
      const error = new InvalidResourceError('Invalid FHIR resource format', {
        resourceType,
        validationErrors
      });

      expect(error.context).toHaveProperty('resourceType', resourceType);
      expect(error.context).toHaveProperty('validationErrors', validationErrors);
      assertErrorSerializesWithContext(error, { resourceType, validationErrors });
    });

    it('should be categorized as a validation error', () => {
      const error = new InvalidResourceError('Invalid FHIR resource format', {
        resourceType: 'Patient',
        validationErrors: ['Missing required field: name']
      });

      assertErrorHasCategory(error, ErrorCategory.VALIDATION);
    });

    it('should map to HTTP 400 status code', () => {
      const error = new InvalidResourceError('Invalid FHIR resource format', {
        resourceType: 'Patient',
        validationErrors: ['Missing required field: name']
      });

      assertErrorHasStatusCode(error, 400);
    });
  });

  describe('ResourceNotFoundError', () => {
    it('should have the correct error code prefix', () => {
      const error = new ResourceNotFoundError('FHIR resource not found', {
        resourceType: 'Observation',
        resourceId: '12345'
      });

      assertErrorHasCode(error, HealthFhirErrorCode.RESOURCE_NOT_FOUND);
      expect(error.code).toMatch(/^HEALTH_FHIR_/);
    });

    it('should include resource type and ID in context', () => {
      const resourceType = 'Observation';
      const resourceId = '12345';
      const error = new ResourceNotFoundError('FHIR resource not found', {
        resourceType,
        resourceId
      });

      expect(error.context).toHaveProperty('resourceType', resourceType);
      expect(error.context).toHaveProperty('resourceId', resourceId);
      assertErrorSerializesWithContext(error, { resourceType, resourceId });
    });

    it('should be categorized as a not found error', () => {
      const error = new ResourceNotFoundError('FHIR resource not found', {
        resourceType: 'Observation',
        resourceId: '12345'
      });

      assertErrorHasCategory(error, ErrorCategory.NOT_FOUND);
    });

    it('should map to HTTP 404 status code', () => {
      const error = new ResourceNotFoundError('FHIR resource not found', {
        resourceType: 'Observation',
        resourceId: '12345'
      });

      assertErrorHasStatusCode(error, 404);
    });
  });

  describe('UnsupportedOperationError', () => {
    it('should have the correct error code prefix', () => {
      const error = new UnsupportedOperationError('Unsupported FHIR operation', {
        operation: '$everything',
        resourceType: 'MedicationRequest'
      });

      assertErrorHasCode(error, HealthFhirErrorCode.UNSUPPORTED_OPERATION);
      expect(error.code).toMatch(/^HEALTH_FHIR_/);
    });

    it('should include operation and resource type in context', () => {
      const operation = '$everything';
      const resourceType = 'MedicationRequest';
      const error = new UnsupportedOperationError('Unsupported FHIR operation', {
        operation,
        resourceType
      });

      expect(error.context).toHaveProperty('operation', operation);
      expect(error.context).toHaveProperty('resourceType', resourceType);
      assertErrorSerializesWithContext(error, { operation, resourceType });
    });

    it('should be categorized as a not implemented error', () => {
      const error = new UnsupportedOperationError('Unsupported FHIR operation', {
        operation: '$everything',
        resourceType: 'MedicationRequest'
      });

      assertErrorHasCategory(error, ErrorCategory.NOT_IMPLEMENTED);
    });

    it('should map to HTTP 501 status code', () => {
      const error = new UnsupportedOperationError('Unsupported FHIR operation', {
        operation: '$everything',
        resourceType: 'MedicationRequest'
      });

      assertErrorHasStatusCode(error, 501);
    });
  });

  describe('FhirAuthenticationError', () => {
    it('should have the correct error code prefix', () => {
      const error = new FhirAuthenticationError('FHIR authentication failed', {
        endpoint: 'https://fhir.example.org/api/v4',
        authMethod: 'bearer-token'
      });

      assertErrorHasCode(error, HealthFhirErrorCode.AUTHENTICATION_FAILURE);
      expect(error.code).toMatch(/^HEALTH_FHIR_/);
    });

    it('should include endpoint and authentication method in context', () => {
      const endpoint = 'https://fhir.example.org/api/v4';
      const authMethod = 'bearer-token';
      const error = new FhirAuthenticationError('FHIR authentication failed', {
        endpoint,
        authMethod
      });

      expect(error.context).toHaveProperty('endpoint', endpoint);
      expect(error.context).toHaveProperty('authMethod', authMethod);
      assertErrorSerializesWithContext(error, { endpoint, authMethod });
    });

    it('should be categorized as an authentication error', () => {
      const error = new FhirAuthenticationError('FHIR authentication failed', {
        endpoint: 'https://fhir.example.org/api/v4',
        authMethod: 'bearer-token'
      });

      assertErrorHasCategory(error, ErrorCategory.AUTHENTICATION);
    });

    it('should map to HTTP 401 status code', () => {
      const error = new FhirAuthenticationError('FHIR authentication failed', {
        endpoint: 'https://fhir.example.org/api/v4',
        authMethod: 'bearer-token'
      });

      assertErrorHasStatusCode(error, 401);
    });
  });

  describe('FhirProcessingError', () => {
    it('should have the correct error code prefix', () => {
      const error = new FhirProcessingError('Failed to process FHIR resource', {
        resourceType: 'Patient',
        operation: 'parse'
      });

      assertErrorHasCode(error, HealthFhirErrorCode.PROCESSING_FAILURE);
      expect(error.code).toMatch(/^HEALTH_FHIR_/);
    });

    it('should include resource type and operation in context', () => {
      const resourceType = 'Patient';
      const operation = 'parse';
      const error = new FhirProcessingError('Failed to process FHIR resource', {
        resourceType,
        operation
      });

      expect(error.context).toHaveProperty('resourceType', resourceType);
      expect(error.context).toHaveProperty('operation', operation);
      assertErrorSerializesWithContext(error, { resourceType, operation });
    });

    it('should be categorized as a processing error', () => {
      const error = new FhirProcessingError('Failed to process FHIR resource', {
        resourceType: 'Patient',
        operation: 'parse'
      });

      assertErrorHasCategory(error, ErrorCategory.PROCESSING);
    });

    it('should map to HTTP 500 status code', () => {
      const error = new FhirProcessingError('Failed to process FHIR resource', {
        resourceType: 'Patient',
        operation: 'parse'
      });

      assertErrorHasStatusCode(error, 500);
    });
  });

  describe('Error context sanitization', () => {
    it('should sanitize sensitive information from error context when serialized', () => {
      const error = new FhirConnectionFailureError('Failed to connect to FHIR server', {
        endpoint: 'https://fhir.example.org/api/v4',
        operation: 'GET',
        headers: {
          'Authorization': 'Bearer secret-token-123',
          'Content-Type': 'application/fhir+json'
        }
      });

      const serialized = error.toJSON();
      expect(serialized.context).toHaveProperty('endpoint');
      expect(serialized.context).toHaveProperty('operation');
      expect(serialized.context).toHaveProperty('headers');
      expect(serialized.context.headers).toHaveProperty('Content-Type');
      
      // Authorization header should be redacted
      expect(serialized.context.headers).toHaveProperty('Authorization');
      expect(serialized.context.headers.Authorization).not.toEqual('Bearer secret-token-123');
      expect(serialized.context.headers.Authorization).toEqual('[REDACTED]');
    });

    it('should not include PHI/PII in error context', () => {
      const error = new InvalidResourceError('Invalid FHIR resource format', {
        resourceType: 'Patient',
        validationErrors: ['Missing required field: name'],
        resource: {
          resourceType: 'Patient',
          id: '12345',
          name: [{ family: 'Smith', given: ['John'] }],
          birthDate: '1970-01-01',
          identifier: [{ system: 'http://example.org/fhir/mrn', value: '123456789' }]
        }
      });

      const serialized = error.toJSON();
      
      // Should include resourceType and validationErrors
      expect(serialized.context).toHaveProperty('resourceType');
      expect(serialized.context).toHaveProperty('validationErrors');
      
      // Should not include the full resource with PHI/PII
      expect(serialized.context).not.toHaveProperty('resource');
      
      // Or should redact sensitive fields if resource is included
      if (serialized.context.resource) {
        expect(serialized.context.resource.id).toBeDefined();
        expect(serialized.context.resource.resourceType).toBeDefined();
        expect(serialized.context.resource.name).toBeUndefined();
        expect(serialized.context.resource.birthDate).toBeUndefined();
        expect(serialized.context.resource.identifier).toBeUndefined();
      }
    });
  });
});