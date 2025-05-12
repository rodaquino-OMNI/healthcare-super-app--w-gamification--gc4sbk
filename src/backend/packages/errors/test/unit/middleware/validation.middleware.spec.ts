import { Request, Response, NextFunction } from 'express';
import { createValidationMiddleware } from '../../../src/middleware/validation.middleware';
import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';
import { mockRequest, mockResponse, mockNext } from './express-mocks';
import * as Joi from 'joi';
import { z } from 'zod';
import { IsString, IsEmail, IsNotEmpty, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('Validation Middleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('Joi Validation', () => {
    it('should pass validation when data is valid', () => {
      // Arrange
      const joiSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      req.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should throw AppException when data is invalid', () => {
      // Arrange
      const joiSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      req.body = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('email');
      expect(error.details).toBeDefined();
    });

    it('should validate query parameters', () => {
      // Arrange
      const joiSchema = Joi.object({
        page: Joi.number().integer().min(1).required(),
        limit: Joi.number().integer().min(1).max(100).required()
      });

      req.query = {
        page: '-1', // Invalid page number
        limit: '20'
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema,
        source: 'query'
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('page');
    });

    it('should validate path parameters', () => {
      // Arrange
      const joiSchema = Joi.object({
        id: Joi.string().uuid().required()
      });

      req.params = {
        id: 'not-a-uuid'
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema,
        source: 'params'
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('id');
    });

    it('should support custom validation options', () => {
      // Arrange
      const joiSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(18).required()
      });

      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 16 // Also invalid
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema,
        options: {
          abortEarly: true // Stop after first error
        }
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      // Should only contain the first error (email)
      expect(error.message).toContain('email');
      expect(error.message).not.toContain('age');
    });
  });

  describe('Zod Validation', () => {
    it('should pass validation when data is valid', () => {
      // Arrange
      const zodSchema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      req.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const validateWithZod = createValidationMiddleware({
        type: 'zod',
        schema: zodSchema
      });

      // Act
      validateWithZod(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should throw AppException when data is invalid', () => {
      // Arrange
      const zodSchema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      req.body = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const validateWithZod = createValidationMiddleware({
        type: 'zod',
        schema: zodSchema
      });

      // Act
      validateWithZod(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('email');
      expect(error.details).toBeDefined();
    });

    it('should validate query parameters', () => {
      // Arrange
      const zodSchema = z.object({
        page: z.coerce.number().int().min(1),
        limit: z.coerce.number().int().min(1).max(100)
      });

      req.query = {
        page: '-1', // Invalid page number
        limit: '20'
      };

      const validateWithZod = createValidationMiddleware({
        type: 'zod',
        schema: zodSchema,
        source: 'query'
      });

      // Act
      validateWithZod(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('page');
    });

    it('should validate nested objects', () => {
      // Arrange
      const zodSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          contact: z.object({
            email: z.string().email()
          })
        })
      });

      req.body = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'invalid-email'
          }
        }
      };

      const validateWithZod = createValidationMiddleware({
        type: 'zod',
        schema: zodSchema
      });

      // Act
      validateWithZod(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('user.contact.email');
    });
  });

  describe('Class Validator', () => {
    class UserDto {
      @IsNotEmpty()
      @IsString()
      name: string;

      @IsEmail()
      email: string;
    }

    it('should pass validation when data is valid', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const validateWithClassValidator = createValidationMiddleware({
        type: 'class-validator',
        schema: UserDto
      });

      // Act
      await validateWithClassValidator(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should throw AppException when data is invalid', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const validateWithClassValidator = createValidationMiddleware({
        type: 'class-validator',
        schema: UserDto
      });

      // Act
      await validateWithClassValidator(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('email');
      expect(error.details).toBeDefined();
    });

    it('should support custom validation options', async () => {
      // Arrange
      class UserWithOptionsDto {
        @IsNotEmpty({ message: 'Custom name error message' })
        @IsString()
        name: string;

        @IsEmail({}, { message: 'Custom email error message' })
        email: string;
      }

      req.body = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const validateWithClassValidator = createValidationMiddleware({
        type: 'class-validator',
        schema: UserWithOptionsDto,
        options: {
          validationError: { target: false, value: false }
        }
      });

      // Act
      await validateWithClassValidator(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('Custom email error message');
      expect(error.details).toBeDefined();
      // Should not include target or value in details
      expect(error.details[0]).not.toHaveProperty('target');
      expect(error.details[0]).not.toHaveProperty('value');
    });

    it('should validate nested objects', async () => {
      // Arrange
      class ContactDto {
        @IsEmail()
        email: string;
      }

      class NestedUserDto {
        @IsNotEmpty()
        @IsString()
        name: string;

        @IsNotEmpty()
        contact: ContactDto;
      }

      req.body = {
        name: 'John Doe',
        contact: {
          email: 'invalid-email'
        }
      };

      const validateWithClassValidator = createValidationMiddleware({
        type: 'class-validator',
        schema: NestedUserDto
      });

      // Act
      await validateWithClassValidator(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toContain('contact.email');
    });
  });

  describe('Error Handling', () => {
    it('should include detailed error information in the AppException', () => {
      // Arrange
      const joiSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(18).required()
      });

      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 16
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.details).toBeInstanceOf(Array);
      expect(error.details.length).toBeGreaterThan(0);
      expect(error.details[0]).toHaveProperty('path');
      expect(error.details[0]).toHaveProperty('message');
    });

    it('should handle unexpected errors during validation', () => {
      // Arrange
      const validateWithBrokenSchema = createValidationMiddleware({
        type: 'joi',
        schema: null as any // This will cause an error in the middleware
      });

      // Act
      validateWithBrokenSchema(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe('VALIDATION_SYSTEM_ERROR');
    });

    it('should use custom error code if provided', () => {
      // Arrange
      const joiSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      req.body = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const validateWithJoi = createValidationMiddleware({
        type: 'joi',
        schema: joiSchema,
        errorCode: 'CUSTOM_VALIDATION_ERROR'
      });

      // Act
      validateWithJoi(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppException));
      const error = next.mock.calls[0][0] as AppException;
      expect(error.code).toBe('CUSTOM_VALIDATION_ERROR');
    });
  });
});