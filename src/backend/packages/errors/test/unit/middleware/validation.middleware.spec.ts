import { Request, Response } from 'express';
import * as Joi from 'joi';
import { z as zod } from 'zod';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Min, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ValidationTarget,
  validateWithJoi,
  validateWithZod,
  validateWithClassValidator,
  createValidationMiddleware,
  validateMultiple
} from '../../../src/middleware/validation.middleware';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import {
  createMiddlewareMocks,
  assertErrorResponse,
  ResponseTracking
} from './express-mocks';

describe('Validation Middleware', () => {
  // Test data
  const validUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30
  };

  const invalidUser = {
    name: '',
    email: 'not-an-email',
    age: 17
  };

  // Test schemas
  // Joi schema
  const joiUserSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(18).required()
  });

  // Zod schema
  const zodUserSchema = zod.object({
    name: zod.string().min(1),
    email: zod.string().email(),
    age: zod.number().int().min(18)
  });

  // Class-validator schema
  class UserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsNumber()
    @Min(18)
    age: number;
  }

  describe('validateWithJoi', () => {
    it('should pass validation for valid data', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser
      });
      const middleware = validateWithJoi(joiUserSchema);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail validation for invalid data', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithJoi(joiUserSchema);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveProperty('errors');
      expect(error.details.errors).toHaveLength(3); // name, email, age errors
    });

    it('should validate query parameters', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        query: invalidUser
      });
      const middleware = validateWithJoi(joiUserSchema, ValidationTarget.QUERY);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.message).toContain('query');
    });

    it('should validate route parameters', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        params: { id: 'not-a-number' }
      });
      const paramsSchema = Joi.object({
        id: Joi.number().required()
      });
      const middleware = validateWithJoi(paramsSchema, ValidationTarget.PARAMS);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.message).toContain('params');
    });

    it('should support abortEarly option', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithJoi(joiUserSchema, ValidationTarget.BODY, {
        abortEarly: true
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.details.errors).toHaveLength(1); // Only the first error
    });

    it('should support stripUnknown option', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: { ...validUser, extraField: 'should be removed' }
      });
      const middleware = validateWithJoi(joiUserSchema, ValidationTarget.BODY, {
        stripUnknown: true
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.body).not.toHaveProperty('extraField');
    });

    it('should support custom error code', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithJoi(joiUserSchema, ValidationTarget.BODY, {
        errorCode: 'CUSTOM_VALIDATION_ERROR'
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.code).toBe('CUSTOM_VALIDATION_ERROR');
    });

    it('should support custom error message', async () => {
      // Arrange
      const customMessage = 'Custom validation error message';
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithJoi(joiUserSchema, ValidationTarget.BODY, {
        errorMessage: customMessage
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.message).toBe(customMessage);
    });

    it('should include journey context in error', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithJoi(joiUserSchema, ValidationTarget.BODY, {
        journeyContext: JourneyContext.HEALTH
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.context).toHaveProperty('journey', JourneyContext.HEALTH);
    });
  });

  describe('validateWithZod', () => {
    it('should pass validation for valid data', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser
      });
      const middleware = validateWithZod(zodUserSchema);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail validation for invalid data', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithZod(zodUserSchema);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveProperty('errors');
      expect(error.details.errors.length).toBeGreaterThan(0);
    });

    it('should validate query parameters', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        query: invalidUser
      });
      const middleware = validateWithZod(zodUserSchema, ValidationTarget.QUERY);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.message).toContain('query');
    });

    it('should validate route parameters', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        params: { id: 'not-a-number' }
      });
      const paramsSchema = zod.object({
        id: zod.number()
      });
      const middleware = validateWithZod(paramsSchema, ValidationTarget.PARAMS);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.message).toContain('params');
    });

    it('should support stripUnknown option', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: { ...validUser, extraField: 'should be removed' }
      });
      const middleware = validateWithZod(zodUserSchema, ValidationTarget.BODY, {
        stripUnknown: true
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.body).not.toHaveProperty('extraField');
    });

    it('should support custom error code', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithZod(zodUserSchema, ValidationTarget.BODY, {
        errorCode: 'CUSTOM_VALIDATION_ERROR'
      });

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.code).toBe('CUSTOM_VALIDATION_ERROR');
    });

    it('should pass non-ZodError errors to next middleware', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser
      });
      const customError = new Error('Custom error');
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw customError;
        })
      };
      const middleware = validateWithZod(mockSchema as any);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(customError);
    });
  });

  describe('validateWithClassValidator', () => {
    it('should pass validation for valid data', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser
      });
      const middleware = validateWithClassValidator(UserDto);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail validation for invalid data', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = validateWithClassValidator(UserDto);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveProperty('errors');
      expect(error.details.errors.length).toBeGreaterThan(0);
    });

    it('should validate query parameters', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        query: invalidUser
      });
      const middleware = validateWithClassValidator(UserDto, ValidationTarget.QUERY);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.message).toContain('query');
    });

    it('should validate nested objects', async () => {
      // Define a nested DTO
      class AddressDto {
        @IsString()
        @IsNotEmpty()
        street: string;

        @IsString()
        @IsNotEmpty()
        city: string;
      }

      class UserWithAddressDto extends UserDto {
        @IsNotEmpty()
        address: AddressDto;
      }

      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: {
          ...validUser,
          address: { street: '', city: '' }
        }
      });
      const middleware = validateWithClassValidator(UserWithAddressDto, ValidationTarget.BODY, {
        validateNested: true
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.details.errors.some((e: any) => e.path.includes('address'))).toBeTruthy();
    });

    it('should support whitelist option', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: { ...validUser, extraField: 'should be removed' }
      });
      const middleware = validateWithClassValidator(UserDto, ValidationTarget.BODY, {
        whitelist: true
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.body).not.toHaveProperty('extraField');
    });

    it('should support forbidNonWhitelisted option', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: { ...validUser, extraField: 'should cause error' }
      });
      const middleware = validateWithClassValidator(UserDto, ValidationTarget.BODY, {
        whitelist: true,
        forbidNonWhitelisted: true
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      
      const error = next.mock.calls[0][0] as BaseError;
      expect(error.details.errors.some((e: any) => e.message.includes('extraField'))).toBeTruthy();
    });
  });

  describe('createValidationMiddleware', () => {
    it('should detect and use Joi schema', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = createValidationMiddleware(joiUserSchema);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      expect(next.mock.calls[0][0].message).toContain('Validation failed for body');
    });

    it('should detect and use Zod schema', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = createValidationMiddleware(zodUserSchema);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      expect(next.mock.calls[0][0].message).toContain('Validation failed for body');
    });

    it('should detect and use class-validator schema', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: invalidUser
      });
      const middleware = createValidationMiddleware(UserDto);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      expect(next.mock.calls[0][0].message).toContain('Validation failed for body');
    });
  });

  describe('validateMultiple', () => {
    it('should validate multiple targets', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser,
        query: { filter: 'valid' },
        params: { id: '123' }
      });

      const schemas = {
        [ValidationTarget.BODY]: joiUserSchema,
        [ValidationTarget.QUERY]: Joi.object({
          filter: Joi.string().required()
        }),
        [ValidationTarget.PARAMS]: Joi.object({
          id: Joi.string().required()
        })
      };

      const middleware = validateMultiple(schemas);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail if any target fails validation', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser,
        query: { filter: '' }, // Invalid
        params: { id: '123' }
      });

      const schemas = {
        [ValidationTarget.BODY]: joiUserSchema,
        [ValidationTarget.QUERY]: Joi.object({
          filter: Joi.string().min(1).required()
        }),
        [ValidationTarget.PARAMS]: Joi.object({
          id: Joi.string().required()
        })
      };

      const middleware = validateMultiple(schemas);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BaseError);
      expect(next.mock.calls[0][0].message).toContain('query');
    });

    it('should support mixed schema types', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: validUser,
        query: { filter: 'valid' },
        params: { id: '123' }
      });

      const schemas = {
        [ValidationTarget.BODY]: joiUserSchema, // Joi
        [ValidationTarget.QUERY]: zod.object({ // Zod
          filter: zod.string().min(1)
        }),
        [ValidationTarget.PARAMS]: Joi.object({ // Joi
          id: Joi.string().required()
        })
      };

      const middleware = validateMultiple(schemas);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should apply options to all validators', async () => {
      // Arrange
      const { req, res, next } = createMiddlewareMocks({
        body: { ...validUser, extraField: 'should be removed' },
        query: { filter: 'valid', extraQuery: 'should be removed' }
      });

      const schemas = {
        [ValidationTarget.BODY]: joiUserSchema,
        [ValidationTarget.QUERY]: Joi.object({
          filter: Joi.string().required()
        })
      };

      const middleware = validateMultiple(schemas, {
        stripUnknown: true,
        journeyContext: JourneyContext.CARE
      });

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.body).not.toHaveProperty('extraField');
      expect(req.query).not.toHaveProperty('extraQuery');
    });
  });
});