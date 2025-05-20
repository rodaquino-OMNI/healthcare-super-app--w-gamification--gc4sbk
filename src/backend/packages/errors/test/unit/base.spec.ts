import { describe, expect, it, jest } from '@jest/globals';
import { BaseError } from '../../src/base';
import { ErrorType } from '../../src/types';
import { HttpStatus } from '@nestjs/common';

describe('BaseError', () => {
  describe('constructor', () => {
    it('should create an error with the correct message', () => {
      const message = 'Test error message';
      const error = new BaseError(message, ErrorType.TECHNICAL, 'TEST_001');
      
      expect(error.message).toBe(message);
      expect(error.name).toBe('BaseError');
    });

    it('should create an error with the correct type', () => {
      const error = new BaseError('Test error', ErrorType.VALIDATION, 'TEST_002');
      
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should create an error with the correct code', () => {
      const error = new BaseError('Test error', ErrorType.BUSINESS, 'BIZ_001');
      
      expect(error.code).toBe('BIZ_001');
    });

    it('should create an error with optional details', () => {
      const details = { field: 'username', constraint: 'required' };
      const error = new BaseError('Test error', ErrorType.VALIDATION, 'VAL_001', details);
      
      expect(error.details).toEqual(details);
    });

    it('should create an error with an optional cause', () => {
      const cause = new Error('Original error');
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TECH_001', undefined, cause);
      
      expect(error.cause).toBe(cause);
    });

    it('should create an error with both details and cause', () => {
      const details = { field: 'email', constraint: 'format' };
      const cause = new Error('Original error');
      const error = new BaseError('Test error', ErrorType.VALIDATION, 'VAL_002', details, cause);
      
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it('should capture stack trace', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TECH_002');
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('Test error');
    });

    it('should set the correct prototype for instanceof checks', () => {
      const error = new BaseError('Test error', ErrorType.TECHNICAL, 'TECH_003');
      
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize the error to a JSON object with all properties', () => {
      const message = 'Validation failed';
      const type = ErrorType.VALIDATION;
      const code = 'VAL_003';
      const details = { field: 'password', constraint: 'minLength' };
      
      const error = new BaseError(message, type, code, details);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type,
          code,
          message,
          details
        }
      });
    });

    it('should serialize the error without details if not provided', () => {
      const message = 'Internal error';
      const type = ErrorType.TECHNICAL;
      const code = 'TECH_004';
      
      const error = new BaseError(message, type, code);
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          type,
          code,
          message,
          details: undefined
        }
      });
    });

    it('should not include cause in the serialized output', () => {
      const cause = new Error('Original error');
      const error = new BaseError('Test error', ErrorType.EXTERNAL, 'EXT_001', undefined, cause);
      const json = error.toJSON();
      
      expect(json.error.cause).toBeUndefined();
    });
  });

  describe('toHttpException', () => {
    it('should convert VALIDATION error to BAD_REQUEST status', () => {
      const error = new BaseError('Validation error', ErrorType.VALIDATION, 'VAL_004');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should convert BUSINESS error to UNPROCESSABLE_ENTITY status', () => {
      const error = new BaseError('Business rule violation', ErrorType.BUSINESS, 'BIZ_002');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should convert TECHNICAL error to INTERNAL_SERVER_ERROR status', () => {
      const error = new BaseError('System error', ErrorType.TECHNICAL, 'TECH_005');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should convert EXTERNAL error to BAD_GATEWAY status', () => {
      const error = new BaseError('External service error', ErrorType.EXTERNAL, 'EXT_002');
      const httpException = error.toHttpException();
      
      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });
  });

  describe('context handling', () => {
    it('should create an error with context information', () => {
      const context = { userId: '123', requestId: 'abc-123', journey: 'health' };
      const error = new BaseError(
        'Test error', 
        ErrorType.TECHNICAL, 
        'TECH_006', 
        undefined, 
        undefined, 
        context
      );
      
      expect(error.context).toEqual(context);
    });

    it('should include context in serialized output when includeContext is true', () => {
      const context = { userId: '123', requestId: 'abc-123', journey: 'health' };
      const error = new BaseError(
        'Test error', 
        ErrorType.TECHNICAL, 
        'TECH_007', 
        undefined, 
        undefined, 
        context
      );
      
      const json = error.toJSON(true);
      
      expect(json.error.context).toEqual(context);
    });

    it('should not include context in serialized output by default', () => {
      const context = { userId: '123', requestId: 'abc-123', journey: 'health' };
      const error = new BaseError(
        'Test error', 
        ErrorType.TECHNICAL, 
        'TECH_008', 
        undefined, 
        undefined, 
        context
      );
      
      const json = error.toJSON();
      
      expect(json.error.context).toBeUndefined();
    });
  });

  describe('error cause chain', () => {
    it('should support error cause chains with multiple levels', () => {
      const rootCause = new Error('Root cause');
      const intermediateCause = new BaseError(
        'Intermediate error', 
        ErrorType.EXTERNAL, 
        'EXT_003', 
        undefined, 
        rootCause
      );
      const topError = new BaseError(
        'Top level error', 
        ErrorType.TECHNICAL, 
        'TECH_009', 
        undefined, 
        intermediateCause
      );
      
      expect(topError.cause).toBe(intermediateCause);
      expect(intermediateCause.cause).toBe(rootCause);
    });

    it('should provide a method to get the root cause of an error chain', () => {
      const rootCause = new Error('Root cause');
      const intermediateCause = new BaseError(
        'Intermediate error', 
        ErrorType.EXTERNAL, 
        'EXT_004', 
        undefined, 
        rootCause
      );
      const topError = new BaseError(
        'Top level error', 
        ErrorType.TECHNICAL, 
        'TECH_010', 
        undefined, 
        intermediateCause
      );
      
      expect(topError.getRootCause()).toBe(rootCause);
    });

    it('should return self as root cause if no cause is present', () => {
      const error = new BaseError('No cause error', ErrorType.BUSINESS, 'BIZ_003');
      
      expect(error.getRootCause()).toBe(error);
    });
  });

  describe('observability integration', () => {
    it('should provide a method to format error for logging', () => {
      const error = new BaseError('Log this error', ErrorType.TECHNICAL, 'TECH_011');
      const logFormat = error.toLogFormat();
      
      expect(logFormat).toHaveProperty('message', 'Log this error');
      expect(logFormat).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(logFormat).toHaveProperty('code', 'TECH_011');
      expect(logFormat).toHaveProperty('stack');
    });

    it('should include context in log format when available', () => {
      const context = { userId: '123', requestId: 'abc-123' };
      const error = new BaseError(
        'Contextual error', 
        ErrorType.BUSINESS, 
        'BIZ_004', 
        undefined, 
        undefined, 
        context
      );
      
      const logFormat = error.toLogFormat();
      
      expect(logFormat).toHaveProperty('context', context);
    });

    it('should include cause information in log format', () => {
      const cause = new Error('Original error');
      const error = new BaseError(
        'Caused error', 
        ErrorType.EXTERNAL, 
        'EXT_005', 
        undefined, 
        cause
      );
      
      const logFormat = error.toLogFormat();
      
      expect(logFormat).toHaveProperty('cause');
      expect(logFormat.cause).toHaveProperty('message', 'Original error');
      expect(logFormat.cause).toHaveProperty('stack');
    });
  });
});