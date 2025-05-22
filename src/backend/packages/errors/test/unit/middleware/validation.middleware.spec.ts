import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';
import { z as zod } from 'zod';
import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { validate, validateBody, validateQuery, validateParams, validateHeaders, validateRequest, ValidationTarget } from '../../../src/middleware/validation.middleware';
import { BaseError, ErrorType } from '../../../src/base';

// Mock Express request, response, and next function
const mockRequest = () => {
  const req: Partial<Request> = {
    body: {},
    query: {},
    params: {},
    headers: {}
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Class for class-validator tests
class UserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  age: number;
}

describe('Validation Middleware', () => {
  describe('Joi Validation', () => {
    const joiSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().integer().min(18).max(120).required()
    });

    it('should pass validation with valid data', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const middleware = validate(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });

    it('should fail validation with invalid data', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 15
      };

      const middleware = validate(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('Validation failed');
      expect(error.message).toContain('email');
      expect(error.message).toContain('age');
    });

    it('should respect abortEarly option', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 15
      };

      // With abortEarly: true (default)
      const middlewareAbortEarly = validate(joiSchema, { abortEarly: true });
      middlewareAbortEarly(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      
      // Reset for next test
      jest.clearAllMocks();
      
      // With abortEarly: false
      const middlewareNoAbortEarly = validate(joiSchema, { abortEarly: false });
      middlewareNoAbortEarly(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const errorNoAbort = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      
      // The error with abortEarly: false should contain more details
      expect(errorNoAbort.details.length).toBeGreaterThanOrEqual(error.details.length);
    });

    it('should respect stripUnknown option', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        extraField: 'should be removed'
      };

      // With stripUnknown: true
      const middlewareStrip = validate(joiSchema, { stripUnknown: true });
      middlewareStrip(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).not.toHaveProperty('extraField');
      
      // Reset for next test
      jest.clearAllMocks();
      req.body.extraField = 'should be kept';
      
      // With stripUnknown: false (default)
      const middlewareNoStrip = validate(joiSchema, { stripUnknown: false });
      middlewareNoStrip(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toHaveProperty('extraField');
    });

    it('should use custom error code and message', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 15
      };

      const customErrorCode = 'CUSTOM_VALIDATION_ERROR';
      const customErrorMessage = 'Custom validation failed: {details}';

      const middleware = validate(joiSchema, {
        errorCode: customErrorCode,
        errorMessage: customErrorMessage
      });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.code).toBe(customErrorCode);
      expect(error.message).toContain('Custom validation failed');
    });
  });

  describe('Zod Validation', () => {
    const zodSchema = zod.object({
      name: zod.string(),
      email: zod.string().email(),
      age: zod.number().int().min(18).max(120)
    });

    it('should pass validation with valid data', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const middleware = validate(zodSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });

    it('should fail validation with invalid data', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 15
      };

      const middleware = validate(zodSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('Validation failed');
      expect(error.message).toContain('email');
      expect(error.message).toContain('age');
    });

    it('should handle unexpected errors during validation', () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      // Create a schema that will throw an error during validation
      const badSchema = {
        safeParse: () => { throw new Error('Unexpected error'); }
      } as any;

      const middleware = validate(badSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('VALIDATION_INTERNAL_ERROR');
      expect(error.message).toContain('Unexpected error during validation');
    });
  });

  describe('Class Validator', () => {
    it('should pass validation with valid data', async () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const middleware = validate(UserDto);
      await middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toBeInstanceOf(UserDto);
      expect(req.body.name).toBe('John Doe');
      expect(req.body.email).toBe('john@example.com');
      expect(req.body.age).toBe(30);
    });

    it('should fail validation with invalid data', async () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 15
      };

      const middleware = validate(UserDto);
      await middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('Validation failed');
      expect(error.details).toContainEqual(expect.objectContaining({
        field: 'email'
      }));
      expect(error.details).toContainEqual(expect.objectContaining({
        field: 'age'
      }));
    });

    it('should handle unexpected errors during validation', async () => {
      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      // Mock class-validator to throw an error
      jest.mock('class-validator', () => ({
        validate: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        })
      }));

      const middleware = validate(UserDto);
      await middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('VALIDATION_INTERNAL_ERROR');
      expect(error.message).toContain('Unexpected error during validation');
    });
  });

  describe('Validation Target', () => {
    const joiSchema = Joi.object({
      id: Joi.string().required(),
      value: Joi.string().required()
    });

    it('should validate body by default', () => {
      const req = mockRequest();
      req.body = { id: '123', value: 'test' };

      const middleware = validate(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate query parameters', () => {
      const req = mockRequest();
      req.query = { id: '123', value: 'test' };

      const middleware = validate(joiSchema, { target: ValidationTarget.QUERY });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate path parameters', () => {
      const req = mockRequest();
      req.params = { id: '123', value: 'test' };

      const middleware = validate(joiSchema, { target: ValidationTarget.PARAMS });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate headers', () => {
      const req = mockRequest();
      req.headers = { id: '123', value: 'test' };

      const middleware = validate(joiSchema, { target: ValidationTarget.HEADERS });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate all request parts', () => {
      const req = mockRequest();
      req.body = { id: '123', value: 'test' };
      req.query = { id: '123', value: 'test' };
      req.params = { id: '123', value: 'test' };
      req.headers = { id: '123', value: 'test' };

      const middleware = validate(joiSchema, { target: ValidationTarget.ALL });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Convenience Functions', () => {
    const joiSchema = Joi.object({
      id: Joi.string().required(),
      value: Joi.string().required()
    });

    it('should validate body with validateBody', () => {
      const req = mockRequest();
      req.body = { id: '123', value: 'test' };

      const middleware = validateBody(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate query with validateQuery', () => {
      const req = mockRequest();
      req.query = { id: '123', value: 'test' };

      const middleware = validateQuery(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate params with validateParams', () => {
      const req = mockRequest();
      req.params = { id: '123', value: 'test' };

      const middleware = validateParams(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate headers with validateHeaders', () => {
      const req = mockRequest();
      req.headers = { id: '123', value: 'test' };

      const middleware = validateHeaders(joiSchema);
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate multiple parts with validateRequest', () => {
      const req = mockRequest();
      req.body = { id: '123', value: 'test' };
      req.query = { id: '123', value: 'test' };

      const middleware = validateRequest({
        body: joiSchema,
        query: joiSchema
      });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail validation with validateRequest if any part fails', () => {
      const req = mockRequest();
      req.body = { id: '123', value: 'test' };
      req.query = { id: '123' }; // Missing 'value' field

      const middleware = validateRequest({
        body: joiSchema,
        query: joiSchema
      });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('value');
    });
  });

  describe('Error Handling', () => {
    it('should throw an error for unsupported schema type', () => {
      // Using an object that doesn't match any of the supported schema types
      const invalidSchema = { foo: 'bar' };
      
      expect(() => {
        validate(invalidSchema as any);
      }).toThrow('Unsupported schema type');
    });

    it('should include detailed validation errors in the error object', () => {
      const joiSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(18).max(120).required()
      });

      const req = mockRequest();
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 15
      };

      const middleware = validate(joiSchema, { abortEarly: false });
      middleware(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BaseError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as BaseError;
      
      // Check that details contains information about both validation errors
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.arrayContaining(['email']),
            message: expect.stringContaining('email')
          }),
          expect.objectContaining({
            path: expect.arrayContaining(['age']),
            message: expect.stringContaining('18')
          })
        ])
      );
    });
  });
});