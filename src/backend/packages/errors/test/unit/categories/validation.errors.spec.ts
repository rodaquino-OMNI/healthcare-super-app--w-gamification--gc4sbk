import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import {
  ValidationError,
  MissingParameterError,
  InvalidParameterError,
  MalformedRequestError,
  InvalidCredentialsError,
  SchemaValidationError
} from '../../../src/categories/validation.errors';

describe('Validation Errors', () => {
  describe('ValidationError', () => {
    it('should extend BaseError', () => {
      const error = new ValidationError('Test validation error', 'TEST_CODE');
      expect(error).toBeInstanceOf(BaseError);
    });

    it('should set the correct error type', () => {
      const error = new ValidationError('Test validation error', 'TEST_CODE');
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should set the correct HTTP status code', () => {
      const error = new ValidationError('Test validation error', 'TEST_CODE');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to the correct format', () => {
      const error = new ValidationError(
        'Test validation error',
        'TEST_CODE',
        { field: 'value' },
        { journey: JourneyContext.HEALTH },
        'Try this instead'
      );

      const serialized = error.toJSON();
      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.VALIDATION);
      expect(serialized.error).toHaveProperty('code', 'TEST_CODE');
      expect(serialized.error).toHaveProperty('message', 'Test validation error');
      expect(serialized.error).toHaveProperty('journey', JourneyContext.HEALTH);
      expect(serialized.error).toHaveProperty('details', { field: 'value' });
      expect(serialized.error).toHaveProperty('suggestion', 'Try this instead');
    });

    it('should convert to HttpException with correct status', () => {
      const error = new ValidationError('Test validation error', 'TEST_CODE');
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('MissingParameterError', () => {
    it('should extend ValidationError', () => {
      const error = new MissingParameterError('testParam');
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should set the correct error message', () => {
      const error = new MissingParameterError('testParam');
      expect(error.message).toBe('Missing required parameter: testParam');
    });

    it('should set the correct error code', () => {
      const error = new MissingParameterError('testParam');
      expect(error.code).toBe('MISSING_PARAMETER');
    });

    it('should include parameter name in details', () => {
      const error = new MissingParameterError('testParam');
      expect(error.details).toEqual({ paramName: 'testParam' });
    });

    it('should include a helpful suggestion', () => {
      const error = new MissingParameterError('testParam');
      expect(error.suggestion).toBe('Please provide the required parameter: testParam');
    });

    it('should include journey context when provided', () => {
      const error = new MissingParameterError('testParam', { journey: JourneyContext.CARE });
      expect(error.context.journey).toBe(JourneyContext.CARE);
    });
  });

  describe('InvalidParameterError', () => {
    it('should extend ValidationError', () => {
      const error = new InvalidParameterError('testParam', 'invalid', 'Must be a number');
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should set the correct error message', () => {
      const error = new InvalidParameterError('testParam', 'invalid', 'Must be a number');
      expect(error.message).toBe('Invalid parameter testParam: Must be a number');
    });

    it('should set the correct error code', () => {
      const error = new InvalidParameterError('testParam', 'invalid', 'Must be a number');
      expect(error.code).toBe('INVALID_PARAMETER');
    });

    it('should include parameter details in error details', () => {
      const error = new InvalidParameterError('testParam', 'invalid', 'Must be a number');
      expect(error.details).toEqual({
        paramName: 'testParam',
        value: 'invalid',
        reason: 'Must be a number'
      });
    });

    it('should include a helpful suggestion', () => {
      const error = new InvalidParameterError('testParam', 'invalid', 'Must be a number');
      expect(error.suggestion).toBe('Please provide a valid value for testParam');
    });

    it('should include journey context when provided', () => {
      const error = new InvalidParameterError(
        'testParam',
        'invalid',
        'Must be a number',
        { journey: JourneyContext.PLAN }
      );
      expect(error.context.journey).toBe(JourneyContext.PLAN);
    });
  });

  describe('MalformedRequestError', () => {
    it('should extend ValidationError', () => {
      const error = new MalformedRequestError('Malformed JSON in request body');
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should set the correct error message', () => {
      const error = new MalformedRequestError('Malformed JSON in request body');
      expect(error.message).toBe('Malformed JSON in request body');
    });

    it('should set the correct error code', () => {
      const error = new MalformedRequestError('Malformed JSON in request body');
      expect(error.code).toBe('MALFORMED_REQUEST');
    });

    it('should include details when provided', () => {
      const details = { line: 10, column: 15, snippet: '{"key":}' };
      const error = new MalformedRequestError('Malformed JSON in request body', details);
      expect(error.details).toEqual(details);
    });

    it('should include a helpful suggestion', () => {
      const error = new MalformedRequestError('Malformed JSON in request body');
      expect(error.suggestion).toBe('Please check the request format and try again');
    });

    it('should include journey context when provided', () => {
      const error = new MalformedRequestError(
        'Malformed JSON in request body',
        undefined,
        { journey: JourneyContext.GAMIFICATION }
      );
      expect(error.context.journey).toBe(JourneyContext.GAMIFICATION);
    });
  });

  describe('InvalidCredentialsError', () => {
    it('should extend ValidationError', () => {
      const error = new InvalidCredentialsError();
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should set the default error message when not provided', () => {
      const error = new InvalidCredentialsError();
      expect(error.message).toBe('Invalid credentials provided');
    });

    it('should set the custom error message when provided', () => {
      const error = new InvalidCredentialsError('Username or password is incorrect');
      expect(error.message).toBe('Username or password is incorrect');
    });

    it('should set the correct error code', () => {
      const error = new InvalidCredentialsError();
      expect(error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should include details when provided', () => {
      const details = { attemptCount: 3, maxAttempts: 5 };
      const error = new InvalidCredentialsError('Too many failed attempts', details);
      expect(error.details).toEqual(details);
    });

    it('should include a helpful suggestion', () => {
      const error = new InvalidCredentialsError();
      expect(error.suggestion).toBe('Please check your credentials and try again');
    });

    it('should include journey context when provided', () => {
      const error = new InvalidCredentialsError(
        'Invalid credentials provided',
        undefined,
        { journey: JourneyContext.AUTH }
      );
      expect(error.context.journey).toBe(JourneyContext.AUTH);
    });
  });

  describe('SchemaValidationError', () => {
    it('should extend ValidationError', () => {
      const error = new SchemaValidationError([{ field: 'email', message: 'Invalid email format' }]);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should set the correct error message', () => {
      const error = new SchemaValidationError([{ field: 'email', message: 'Invalid email format' }]);
      expect(error.message).toBe('Schema validation failed');
    });

    it('should set the correct error code', () => {
      const error = new SchemaValidationError([{ field: 'email', message: 'Invalid email format' }]);
      expect(error.code).toBe('SCHEMA_VALIDATION');
    });

    it('should include validation errors in details', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be a positive number' }
      ];
      const error = new SchemaValidationError(validationErrors);
      expect(error.details).toEqual({ errors: validationErrors });
    });

    it('should include a helpful suggestion', () => {
      const error = new SchemaValidationError([{ field: 'email', message: 'Invalid email format' }]);
      expect(error.suggestion).toBe('Please check the input data against the schema requirements');
    });

    it('should include journey context when provided', () => {
      const error = new SchemaValidationError(
        [{ field: 'email', message: 'Invalid email format' }],
        { journey: JourneyContext.HEALTH }
      );
      expect(error.context.journey).toBe(JourneyContext.HEALTH);
    });

    it('should properly serialize field-level validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be a positive number' }
      ];
      const error = new SchemaValidationError(validationErrors);
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toHaveProperty('errors');
      expect(serialized.error.details.errors).toEqual(validationErrors);
    });
  });
});