import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../src/types';
import { BaseError } from '../../../src/base';
import {
  MissingParameterError,
  InvalidParameterError,
  MalformedRequestError,
  InvalidCredentialsError,
  SchemaValidationError
} from '../../../src/categories/validation.errors';

describe('Validation Errors', () => {
  describe('MissingParameterError', () => {
    it('should create an error with the correct type and status code', () => {
      const error = new MissingParameterError('userId');
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create an error with the correct message', () => {
      const error = new MissingParameterError('userId');
      
      expect(error.message).toBe('Missing required parameter: userId');
    });

    it('should create an error with the correct code', () => {
      const error = new MissingParameterError('userId');
      
      expect(error.code).toBe('MISSING_PARAMETER');
    });

    it('should serialize to the correct format', () => {
      const error = new MissingParameterError('userId');
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'MISSING_PARAMETER',
          message: 'Missing required parameter: userId',
          details: { parameter: 'userId' }
        }
      });
    });
  });

  describe('InvalidParameterError', () => {
    it('should create an error with the correct type and status code', () => {
      const error = new InvalidParameterError('age', 'must be a positive number');
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create an error with the correct message', () => {
      const error = new InvalidParameterError('age', 'must be a positive number');
      
      expect(error.message).toBe('Invalid parameter: age must be a positive number');
    });

    it('should create an error with the correct code', () => {
      const error = new InvalidParameterError('age', 'must be a positive number');
      
      expect(error.code).toBe('INVALID_PARAMETER');
    });

    it('should serialize to the correct format', () => {
      const error = new InvalidParameterError('age', 'must be a positive number');
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'INVALID_PARAMETER',
          message: 'Invalid parameter: age must be a positive number',
          details: { 
            parameter: 'age',
            reason: 'must be a positive number'
          }
        }
      });
    });
  });

  describe('MalformedRequestError', () => {
    it('should create an error with the correct type and status code', () => {
      const error = new MalformedRequestError('Invalid JSON format');
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create an error with the correct message', () => {
      const error = new MalformedRequestError('Invalid JSON format');
      
      expect(error.message).toBe('Malformed request: Invalid JSON format');
    });

    it('should create an error with the correct code', () => {
      const error = new MalformedRequestError('Invalid JSON format');
      
      expect(error.code).toBe('MALFORMED_REQUEST');
    });

    it('should serialize to the correct format', () => {
      const error = new MalformedRequestError('Invalid JSON format');
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'MALFORMED_REQUEST',
          message: 'Malformed request: Invalid JSON format',
          details: { reason: 'Invalid JSON format' }
        }
      });
    });
  });

  describe('InvalidCredentialsError', () => {
    it('should create an error with the correct type and status code', () => {
      const error = new InvalidCredentialsError();
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create an error with the correct message', () => {
      const error = new InvalidCredentialsError();
      
      expect(error.message).toBe('Invalid username or password');
    });

    it('should create an error with a custom message when provided', () => {
      const error = new InvalidCredentialsError('Invalid API key');
      
      expect(error.message).toBe('Invalid API key');
    });

    it('should create an error with the correct code', () => {
      const error = new InvalidCredentialsError();
      
      expect(error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should serialize to the correct format', () => {
      const error = new InvalidCredentialsError();
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          details: undefined
        }
      });
    });
  });

  describe('SchemaValidationError', () => {
    it('should create an error with the correct type and status code', () => {
      const validationErrors = [
        { field: 'email', message: 'must be a valid email' },
        { field: 'password', message: 'must be at least 8 characters' }
      ];
      const error = new SchemaValidationError('User', validationErrors);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create an error with the correct message', () => {
      const validationErrors = [
        { field: 'email', message: 'must be a valid email' },
        { field: 'password', message: 'must be at least 8 characters' }
      ];
      const error = new SchemaValidationError('User', validationErrors);
      
      expect(error.message).toBe('Validation failed for User schema');
    });

    it('should create an error with the correct code', () => {
      const validationErrors = [
        { field: 'email', message: 'must be a valid email' },
        { field: 'password', message: 'must be at least 8 characters' }
      ];
      const error = new SchemaValidationError('User', validationErrors);
      
      expect(error.code).toBe('SCHEMA_VALIDATION_ERROR');
    });

    it('should serialize to the correct format with field-level validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'must be a valid email' },
        { field: 'password', message: 'must be at least 8 characters' }
      ];
      const error = new SchemaValidationError('User', validationErrors);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'SCHEMA_VALIDATION_ERROR',
          message: 'Validation failed for User schema',
          details: {
            schema: 'User',
            errors: [
              { field: 'email', message: 'must be a valid email' },
              { field: 'password', message: 'must be at least 8 characters' }
            ]
          }
        }
      });
    });

    it('should handle empty validation errors array', () => {
      const error = new SchemaValidationError('User', []);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: 'SCHEMA_VALIDATION_ERROR',
          message: 'Validation failed for User schema',
          details: {
            schema: 'User',
            errors: []
          }
        }
      });
    });
  });
});