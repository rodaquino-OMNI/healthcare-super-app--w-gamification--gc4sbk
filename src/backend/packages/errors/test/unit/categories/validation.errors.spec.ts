import { HttpStatus } from '@nestjs/common';
import {
  MissingParameterError,
  InvalidParameterError,
  MalformedRequestError,
  InvalidCredentialsError,
  SchemaValidationError,
  FieldValidationError,
  InvalidDateError,
  InvalidNumericValueError,
  InvalidEnumValueError,
  InvalidFormatError
} from '../../../src/categories/validation.errors';
import { BaseError, ErrorType, JourneyType } from '../../../src/base';
import { COMMON_ERROR_CODES, ERROR_CODE_PREFIXES } from '../../../src/constants';

describe('Validation Error Classes', () => {
  describe('MissingParameterError', () => {
    it('should create an error with the correct message and type', () => {
      const paramName = 'userId';
      const error = new MissingParameterError(paramName);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(MissingParameterError);
      expect(error.message).toBe(`Missing required parameter: ${paramName}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_MISSING_PARAMETER`);
    });

    it('should include journey type when provided', () => {
      const paramName = 'appointmentId';
      const journeyType = JourneyType.CARE;
      const error = new MissingParameterError(paramName, journeyType);
      
      expect(error.context.journey).toBe(journeyType);
    });

    it('should include parameter name in metadata', () => {
      const paramName = 'metricId';
      const error = new MissingParameterError(paramName);
      
      expect(error.context.metadata).toEqual(expect.objectContaining({
        paramName
      }));
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new MissingParameterError('testParam');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to the correct format', () => {
      const paramName = 'userId';
      const error = new MissingParameterError(paramName);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: `${COMMON_ERROR_CODES.VALIDATION_ERROR}_MISSING_PARAMETER`,
          message: `Missing required parameter: ${paramName}`,
          details: undefined,
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('InvalidParameterError', () => {
    it('should create an error with the correct message and type', () => {
      const paramName = 'email';
      const error = new InvalidParameterError(paramName);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidParameterError);
      expect(error.message).toBe(`Invalid parameter: ${paramName}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`);
    });

    it('should include reason when provided', () => {
      const paramName = 'email';
      const reason = 'must be a valid email address';
      const error = new InvalidParameterError(paramName, reason);
      
      expect(error.message).toBe(`Invalid parameter '${paramName}': ${reason}`);
      expect(error.context.metadata).toEqual(expect.objectContaining({
        paramName,
        reason
      }));
    });

    it('should include journey type when provided', () => {
      const paramName = 'claimAmount';
      const reason = 'must be a positive number';
      const journeyType = JourneyType.PLAN;
      const error = new InvalidParameterError(paramName, reason, journeyType);
      
      expect(error.context.journey).toBe(journeyType);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new InvalidParameterError('testParam');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to the correct format', () => {
      const paramName = 'email';
      const reason = 'must be a valid email address';
      const error = new InvalidParameterError(paramName, reason);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: `${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`,
          message: `Invalid parameter '${paramName}': ${reason}`,
          details: undefined,
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('MalformedRequestError', () => {
    it('should create an error with the correct message and type', () => {
      const error = new MalformedRequestError();
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(MalformedRequestError);
      expect(error.message).toBe('Malformed request');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_MALFORMED_REQUEST`);
    });

    it('should include reason when provided', () => {
      const reason = 'Invalid JSON format';
      const error = new MalformedRequestError(reason);
      
      expect(error.message).toBe(`Malformed request: ${reason}`);
      expect(error.context.metadata).toEqual(expect.objectContaining({
        reason
      }));
    });

    it('should include journey type when provided', () => {
      const reason = 'Invalid request body';
      const journeyType = JourneyType.HEALTH;
      const error = new MalformedRequestError(reason, journeyType);
      
      expect(error.context.journey).toBe(journeyType);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new MalformedRequestError();
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to the correct format', () => {
      const reason = 'Invalid JSON format';
      const error = new MalformedRequestError(reason);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: `${COMMON_ERROR_CODES.VALIDATION_ERROR}_MALFORMED_REQUEST`,
          message: `Malformed request: ${reason}`,
          details: undefined,
          journey: undefined,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('InvalidCredentialsError', () => {
    it('should create an error with the default message and type', () => {
      const error = new InvalidCredentialsError();
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidCredentialsError);
      expect(error.message).toBe('Invalid credentials provided');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${ERROR_CODE_PREFIXES.AUTH}${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_CREDENTIALS`);
    });

    it('should use custom message when provided', () => {
      const message = 'Username or password is incorrect';
      const error = new InvalidCredentialsError(message);
      
      expect(error.message).toBe(message);
    });

    it('should always set journey type to AUTH', () => {
      const error = new InvalidCredentialsError();
      
      expect(error.context.journey).toBe(JourneyType.AUTH);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new InvalidCredentialsError();
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to the correct format', () => {
      const message = 'Username or password is incorrect';
      const error = new InvalidCredentialsError(message);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: `${ERROR_CODE_PREFIXES.AUTH}${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_CREDENTIALS`,
          message,
          details: undefined,
          journey: JourneyType.AUTH,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('SchemaValidationError', () => {
    const fieldErrors: FieldValidationError[] = [
      {
        field: 'email',
        message: 'must be a valid email address',
        constraint: 'isEmail',
        expected: 'valid email',
        received: 'invalid-email'
      },
      {
        field: 'age',
        message: 'must be a positive number',
        constraint: 'min',
        expected: 1,
        received: -5
      }
    ];

    it('should create an error with the correct message and type', () => {
      const error = new SchemaValidationError(fieldErrors);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect(error.message).toBe('Schema validation failed');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_SCHEMA_VALIDATION`);
    });

    it('should include schema name when provided', () => {
      const schemaName = 'UserRegistrationDto';
      const error = new SchemaValidationError(fieldErrors, schemaName);
      
      expect(error.message).toBe(`Validation failed for schema: ${schemaName}`);
      expect(error.context.metadata).toEqual(expect.objectContaining({
        schemaName
      }));
    });

    it('should include journey type when provided', () => {
      const schemaName = 'HealthMetricDto';
      const journeyType = JourneyType.HEALTH;
      const error = new SchemaValidationError(fieldErrors, schemaName, journeyType);
      
      expect(error.context.journey).toBe(journeyType);
    });

    it('should include field errors in details', () => {
      const error = new SchemaValidationError(fieldErrors);
      
      expect(error.details).toEqual({
        fieldErrors: fieldErrors.map(error => ({
          field: error.field,
          message: error.message,
          constraint: error.constraint,
          expected: error.expected,
          received: error.received
        }))
      });
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new SchemaValidationError(fieldErrors);
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should serialize to the correct format', () => {
      const schemaName = 'UserRegistrationDto';
      const journeyType = JourneyType.AUTH;
      const error = new SchemaValidationError(fieldErrors, schemaName, journeyType);
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.VALIDATION,
          code: `${COMMON_ERROR_CODES.VALIDATION_ERROR}_SCHEMA_VALIDATION`,
          message: `Validation failed for schema: ${schemaName}`,
          details: {
            fieldErrors: fieldErrors.map(error => ({
              field: error.field,
              message: error.message,
              constraint: error.constraint,
              expected: error.expected,
              received: error.received
            }))
          },
          journey: journeyType,
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    describe('fromClassValidator', () => {
      it('should create a SchemaValidationError from class-validator errors', () => {
        const classValidatorErrors = [
          {
            property: 'email',
            constraints: {
              isEmail: 'email must be a valid email address'
            },
            target: { email: 'test@example.com' },
            value: 'invalid-email'
          },
          {
            property: 'age',
            constraints: {
              min: 'age must be a positive number',
              isInt: 'age must be an integer'
            },
            target: { age: 18 },
            value: -5
          }
        ];

        const error = SchemaValidationError.fromClassValidator(classValidatorErrors, 'UserDto');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: UserDto');
        expect(error.fieldErrors).toHaveLength(3); // 1 for email + 2 for age (min, isInt)
        
        // Check that field errors are correctly mapped
        const emailError = error.fieldErrors.find(e => e.field === 'email' && e.constraint === 'isEmail');
        expect(emailError).toBeDefined();
        expect(emailError?.message).toBe('email must be a valid email address');
        
        const ageMinError = error.fieldErrors.find(e => e.field === 'age' && e.constraint === 'min');
        expect(ageMinError).toBeDefined();
        expect(ageMinError?.message).toBe('age must be a positive number');
        
        const ageIntError = error.fieldErrors.find(e => e.field === 'age' && e.constraint === 'isInt');
        expect(ageIntError).toBeDefined();
        expect(ageIntError?.message).toBe('age must be an integer');
      });
    });

    describe('fromZod', () => {
      it('should create a SchemaValidationError from Zod errors', () => {
        const zodError = {
          errors: [
            {
              path: ['email'],
              message: 'Invalid email',
              code: 'invalid_string',
              expected: 'valid email',
              received: 'invalid-email'
            },
            {
              path: ['age'],
              message: 'Expected number, received string',
              code: 'invalid_type',
              expected: 'number',
              received: 'string'
            }
          ]
        };

        const error = SchemaValidationError.fromZod(zodError, 'UserSchema');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: UserSchema');
        expect(error.fieldErrors).toHaveLength(2);
        
        // Check that field errors are correctly mapped
        const emailError = error.fieldErrors.find(e => e.field === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.message).toBe('Invalid email');
        expect(emailError?.constraint).toBe('invalid_string');
        
        const ageError = error.fieldErrors.find(e => e.field === 'age');
        expect(ageError).toBeDefined();
        expect(ageError?.message).toBe('Expected number, received string');
        expect(ageError?.constraint).toBe('invalid_type');
      });

      it('should handle empty or undefined Zod errors', () => {
        const error = SchemaValidationError.fromZod({}, 'EmptySchema');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: EmptySchema');
        expect(error.fieldErrors).toHaveLength(0);
      });
    });

    describe('fromJoi', () => {
      it('should create a SchemaValidationError from Joi errors', () => {
        const joiError = {
          details: [
            {
              path: ['email'],
              message: '"email" must be a valid email',
              type: 'string.email',
              context: {
                value: 'invalid-email',
                limit: 'valid email'
              }
            },
            {
              path: ['age'],
              message: '"age" must be greater than or equal to 1',
              type: 'number.min',
              context: {
                value: 0,
                limit: 1
              }
            }
          ]
        };

        const error = SchemaValidationError.fromJoi(joiError, 'UserSchema');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: UserSchema');
        expect(error.fieldErrors).toHaveLength(2);
        
        // Check that field errors are correctly mapped
        const emailError = error.fieldErrors.find(e => e.field === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.message).toBe('"email" must be a valid email');
        expect(emailError?.constraint).toBe('string.email');
        
        const ageError = error.fieldErrors.find(e => e.field === 'age');
        expect(ageError).toBeDefined();
        expect(ageError?.message).toBe('"age" must be greater than or equal to 1');
        expect(ageError?.constraint).toBe('number.min');
      });

      it('should handle empty or undefined Joi errors', () => {
        const error = SchemaValidationError.fromJoi({}, 'EmptySchema');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: EmptySchema');
        expect(error.fieldErrors).toHaveLength(0);
      });
    });

    describe('fromYup', () => {
      it('should create a SchemaValidationError from Yup errors', () => {
        const yupError = {
          inner: [
            {
              path: 'email',
              message: 'email must be a valid email',
              type: 'email',
              params: {
                value: 'invalid-email',
                expected: 'valid email'
              }
            },
            {
              path: 'age',
              message: 'age must be at least 1',
              type: 'min',
              params: {
                value: 0,
                expected: 1
              }
            }
          ]
        };

        const error = SchemaValidationError.fromYup(yupError, 'UserSchema');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: UserSchema');
        expect(error.fieldErrors).toHaveLength(2);
        
        // Check that field errors are correctly mapped
        const emailError = error.fieldErrors.find(e => e.field === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.message).toBe('email must be a valid email');
        expect(emailError?.constraint).toBe('email');
        
        const ageError = error.fieldErrors.find(e => e.field === 'age');
        expect(ageError).toBeDefined();
        expect(ageError?.message).toBe('age must be at least 1');
        expect(ageError?.constraint).toBe('min');
      });

      it('should handle empty or undefined Yup errors', () => {
        const error = SchemaValidationError.fromYup({}, 'EmptySchema');
        
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect(error.message).toBe('Validation failed for schema: EmptySchema');
        expect(error.fieldErrors).toHaveLength(0);
      });
    });
  });

  describe('InvalidDateError', () => {
    it('should create an error with the correct message and type', () => {
      const paramName = 'birthDate';
      const error = new InvalidDateError(paramName);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidParameterError);
      expect(error).toBeInstanceOf(InvalidDateError);
      expect(error.message).toBe(`Invalid parameter '${paramName}': Invalid date format or value`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`);
      expect(error.name).toBe('InvalidDateError');
    });

    it('should include custom reason when provided', () => {
      const paramName = 'appointmentDate';
      const reason = 'must be a future date';
      const error = new InvalidDateError(paramName, reason);
      
      expect(error.message).toBe(`Invalid parameter '${paramName}': ${reason}`);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new InvalidDateError('testDate');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('InvalidNumericValueError', () => {
    it('should create an error with the correct message and type', () => {
      const paramName = 'quantity';
      const error = new InvalidNumericValueError(paramName);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidParameterError);
      expect(error).toBeInstanceOf(InvalidNumericValueError);
      expect(error.message).toBe(`Invalid parameter '${paramName}': Invalid numeric value`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`);
      expect(error.name).toBe('InvalidNumericValueError');
    });

    it('should include custom reason when provided', () => {
      const paramName = 'price';
      const reason = 'must be a positive number';
      const error = new InvalidNumericValueError(paramName, reason);
      
      expect(error.message).toBe(`Invalid parameter '${paramName}': ${reason}`);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new InvalidNumericValueError('testNumber');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('InvalidEnumValueError', () => {
    it('should create an error with the correct message and type', () => {
      const paramName = 'status';
      const allowedValues = ['ACTIVE', 'INACTIVE', 'PENDING'];
      const receivedValue = 'UNKNOWN';
      const error = new InvalidEnumValueError(paramName, allowedValues, receivedValue);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidParameterError);
      expect(error).toBeInstanceOf(InvalidEnumValueError);
      expect(error.message).toBe(`Invalid parameter '${paramName}': Expected one of [${allowedValues.join(', ')}], but received: ${receivedValue}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`);
      expect(error.name).toBe('InvalidEnumValueError');
    });

    it('should include journey type when provided', () => {
      const paramName = 'appointmentStatus';
      const allowedValues = ['SCHEDULED', 'CANCELLED', 'COMPLETED'];
      const receivedValue = 'UNKNOWN';
      const journeyType = JourneyType.CARE;
      const error = new InvalidEnumValueError(paramName, allowedValues, receivedValue, journeyType);
      
      expect(error.context.journey).toBe(journeyType);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new InvalidEnumValueError('testEnum', ['A', 'B'], 'C');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('InvalidFormatError', () => {
    it('should create an error with the correct message and type', () => {
      const paramName = 'phoneNumber';
      const expectedFormat = 'XXX-XXX-XXXX';
      const error = new InvalidFormatError(paramName, expectedFormat);
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidParameterError);
      expect(error).toBeInstanceOf(InvalidFormatError);
      expect(error.message).toBe(`Invalid parameter '${paramName}': Expected format: ${expectedFormat}`);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(`${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`);
      expect(error.name).toBe('InvalidFormatError');
    });

    it('should include journey type when provided', () => {
      const paramName = 'policyNumber';
      const expectedFormat = 'ABC-XXXXXXX';
      const journeyType = JourneyType.PLAN;
      const error = new InvalidFormatError(paramName, expectedFormat, journeyType);
      
      expect(error.context.journey).toBe(journeyType);
    });

    it('should map to HTTP 400 Bad Request', () => {
      const error = new InvalidFormatError('testFormat', 'expected format');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});