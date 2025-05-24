import {
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  EnvironmentVariableError,
  EnvironmentValidationError,
} from '../../../src/env/error';
import { ErrorType } from '@austa/errors';

describe('Environment Error Classes', () => {
  describe('EnvironmentVariableError', () => {
    it('should be instantiated with correct base properties', () => {
      const error = new EnvironmentVariableError('TEST_ERROR', 'Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('EnvironmentVariableError');
      expect(error.message).toBe('Test error message');
      expect(error.variableName).toBe('TEST_ERROR');
      expect(error.errorType).toBe(ErrorType.TECHNICAL);
      expect(error.errorCode).toContain('ENV_');
    });

    it('should include variable name in serialized error', () => {
      const error = new EnvironmentVariableError('DATABASE_URL', 'Invalid database URL');
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('variableName', 'DATABASE_URL');
      expect(serialized).toHaveProperty('message', 'Invalid database URL');
      expect(serialized).toHaveProperty('errorType', ErrorType.TECHNICAL);
    });
  });

  describe('MissingEnvironmentVariableError', () => {
    it('should be instantiated with correct properties', () => {
      const error = new MissingEnvironmentVariableError('API_KEY');
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('MissingEnvironmentVariableError');
      expect(error.message).toContain('API_KEY');
      expect(error.message).toContain('missing');
      expect(error.variableName).toBe('API_KEY');
      expect(error.errorCode).toBe('ENV_MISSING_VARIABLE');
    });

    it('should allow custom message override', () => {
      const customMessage = 'API_KEY is required for external service authentication';
      const error = new MissingEnvironmentVariableError('API_KEY', customMessage);
      
      expect(error.message).toBe(customMessage);
    });

    it('should be properly categorized as a technical error', () => {
      const error = new MissingEnvironmentVariableError('DATABASE_URL');
      
      expect(error.errorType).toBe(ErrorType.TECHNICAL);
      expect(error.isTechnicalError()).toBe(true);
      expect(error.isValidationError()).toBe(false);
    });

    it('should include variable name in serialized error', () => {
      const error = new MissingEnvironmentVariableError('JWT_SECRET');
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('variableName', 'JWT_SECRET');
      expect(serialized).toHaveProperty('errorCode', 'ENV_MISSING_VARIABLE');
    });
  });

  describe('InvalidEnvironmentVariableError', () => {
    it('should be instantiated with correct properties', () => {
      const error = new InvalidEnvironmentVariableError(
        'PORT', 
        'Expected number, got string', 
        '8080'
      );
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('InvalidEnvironmentVariableError');
      expect(error.message).toContain('PORT');
      expect(error.message).toContain('invalid');
      expect(error.variableName).toBe('PORT');
      expect(error.errorCode).toBe('ENV_INVALID_VARIABLE');
      expect(error.actualValue).toBe('8080');
      expect(error.reason).toBe('Expected number, got string');
    });

    it('should handle undefined actual value', () => {
      const error = new InvalidEnvironmentVariableError(
        'DEBUG_MODE', 
        'Expected boolean', 
        undefined
      );
      
      expect(error.actualValue).toBeUndefined();
      expect(error.message).toContain('DEBUG_MODE');
      expect(error.message).toContain('invalid');
      expect(error.message).toContain('Expected boolean');
    });

    it('should allow custom message override', () => {
      const customMessage = 'PORT must be a valid number between 1024 and 65535';
      const error = new InvalidEnvironmentVariableError(
        'PORT', 
        'Out of range', 
        '80000', 
        customMessage
      );
      
      expect(error.message).toBe(customMessage);
    });

    it('should include detailed context in serialized error', () => {
      const error = new InvalidEnvironmentVariableError(
        'MAX_CONNECTIONS', 
        'Expected positive integer', 
        '-10'
      );
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('variableName', 'MAX_CONNECTIONS');
      expect(serialized).toHaveProperty('reason', 'Expected positive integer');
      expect(serialized).toHaveProperty('actualValue', '-10');
      expect(serialized).toHaveProperty('errorCode', 'ENV_INVALID_VARIABLE');
    });

    it('should be properly categorized as a technical error', () => {
      const error = new InvalidEnvironmentVariableError(
        'LOG_LEVEL', 
        'Invalid log level', 
        'EXTREME'
      );
      
      expect(error.errorType).toBe(ErrorType.TECHNICAL);
      expect(error.isTechnicalError()).toBe(true);
      expect(error.isValidationError()).toBe(false);
    });
  });

  describe('EnvironmentValidationError', () => {
    it('should aggregate multiple environment errors', () => {
      const errors = [
        new MissingEnvironmentVariableError('API_KEY'),
        new InvalidEnvironmentVariableError('PORT', 'Expected number', 'abc'),
        new InvalidEnvironmentVariableError('DEBUG', 'Expected boolean', 'maybe')
      ];
      
      const error = new EnvironmentValidationError('Multiple environment configuration errors', errors);
      
      expect(error).toBeInstanceOf(EnvironmentVariableError);
      expect(error.name).toBe('EnvironmentValidationError');
      expect(error.message).toBe('Multiple environment configuration errors');
      expect(error.errors).toHaveLength(3);
      expect(error.errors[0]).toBeInstanceOf(MissingEnvironmentVariableError);
      expect(error.errors[1]).toBeInstanceOf(InvalidEnvironmentVariableError);
      expect(error.errorCode).toBe('ENV_VALIDATION_FAILED');
    });

    it('should generate default message when not provided', () => {
      const errors = [
        new MissingEnvironmentVariableError('API_KEY'),
        new InvalidEnvironmentVariableError('PORT', 'Expected number', 'abc')
      ];
      
      const error = new EnvironmentValidationError(undefined, errors);
      
      expect(error.message).toContain('environment validation');
      expect(error.message).toContain('2 errors');
    });

    it('should include all nested errors in serialized output', () => {
      const errors = [
        new MissingEnvironmentVariableError('API_KEY'),
        new InvalidEnvironmentVariableError('PORT', 'Expected number', 'abc')
      ];
      
      const error = new EnvironmentValidationError('Configuration validation failed', errors);
      const serialized = error.serialize();
      
      expect(serialized).toHaveProperty('errors');
      expect(serialized.errors).toHaveLength(2);
      expect(serialized.errors[0]).toHaveProperty('variableName', 'API_KEY');
      expect(serialized.errors[1]).toHaveProperty('variableName', 'PORT');
      expect(serialized.errors[1]).toHaveProperty('actualValue', 'abc');
    });

    it('should handle empty errors array', () => {
      const error = new EnvironmentValidationError('No errors found', []);
      
      expect(error.errors).toHaveLength(0);
      expect(error.message).toBe('No errors found');
      
      const serialized = error.serialize();
      expect(serialized.errors).toHaveLength(0);
    });
  });

  describe('Error integration', () => {
    it('should be catchable as EnvironmentVariableError base class', () => {
      const throwError = () => {
        throw new MissingEnvironmentVariableError('DATABASE_URL');
      };
      
      expect(() => {
        try {
          throwError();
        } catch (error) {
          if (error instanceof EnvironmentVariableError) {
            // This is the expected path
            expect(error.variableName).toBe('DATABASE_URL');
            throw error;
          }
          throw new Error('Wrong error type caught');
        }
      }).toThrow(EnvironmentVariableError);
    });

    it('should support error discrimination by specific type', () => {
      const error1 = new MissingEnvironmentVariableError('API_KEY');
      const error2 = new InvalidEnvironmentVariableError('PORT', 'Invalid number', 'abc');
      
      expect(error1 instanceof MissingEnvironmentVariableError).toBe(true);
      expect(error2 instanceof MissingEnvironmentVariableError).toBe(false);
      expect(error2 instanceof InvalidEnvironmentVariableError).toBe(true);
      expect(error1 instanceof InvalidEnvironmentVariableError).toBe(false);
    });

    it('should support fail-fast validation pattern', () => {
      const validateEnv = () => {
        const errors = [];
        
        if (!process.env.API_KEY) {
          errors.push(new MissingEnvironmentVariableError('API_KEY'));
        }
        
        if (process.env.PORT && isNaN(Number(process.env.PORT))) {
          errors.push(new InvalidEnvironmentVariableError(
            'PORT', 
            'Not a number', 
            process.env.PORT
          ));
        }
        
        if (errors.length > 0) {
          throw new EnvironmentValidationError('Environment validation failed', errors);
        }
      };
      
      // Mock process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, PORT: 'abc' };
      
      expect(validateEnv).toThrow(EnvironmentValidationError);
      
      try {
        validateEnv();
      } catch (error) {
        if (error instanceof EnvironmentValidationError) {
          expect(error.errors.length).toBe(2);
          expect(error.errors[0]).toBeInstanceOf(MissingEnvironmentVariableError);
          expect(error.errors[1]).toBeInstanceOf(InvalidEnvironmentVariableError);
        } else {
          fail('Expected EnvironmentValidationError');
        }
      }
      
      // Restore process.env
      process.env = originalEnv;
    });
  });
});