/**
 * @file event-validation.interface.spec.ts
 * @description Unit tests for event validation interfaces that verify proper implementation
 * of validation logic and result structures.
 */

import { ZodSchema, z } from 'zod';
import {
  IEventValidator,
  ValidationResult,
  ValidationError,
  IZodEventValidator,
  IClassValidatorEventValidator,
  ValidationOptions
} from '../../../src/interfaces/event-validation.interface';

// Mock event data for testing
interface TestEvent {
  id: string;
  type: string;
  payload: Record<string, any>;
  timestamp: string;
}

// Mock implementation of IEventValidator for testing
class MockEventValidator implements IEventValidator<TestEvent> {
  private _isValid: boolean;
  private _errors: ValidationError[];
  private _schema: any;

  constructor(isValid: boolean = true, errors: ValidationError[] = [], schema: any = {}) {
    this._isValid = isValid;
    this._errors = errors;
    this._schema = schema;
  }

  validate(data: TestEvent): ValidationResult {
    return {
      isValid: this._isValid,
      errors: this._errors,
      metadata: { validator: 'MockEventValidator', synchronous: true }
    };
  }

  async validateAsync(data: TestEvent): Promise<ValidationResult> {
    return {
      isValid: this._isValid,
      errors: this._errors,
      metadata: { validator: 'MockEventValidator', synchronous: false }
    };
  }

  getSchema(): any {
    return this._schema;
  }
}

// Mock implementation of IZodEventValidator for testing
class MockZodEventValidator implements IZodEventValidator<TestEvent> {
  private _schema: ZodSchema;

  constructor(schema: ZodSchema) {
    this._schema = schema;
  }

  validate(data: TestEvent): ValidationResult {
    const result = this._schema.safeParse(data);
    
    if (result.success) {
      return {
        isValid: true,
        errors: [],
        metadata: { validator: 'MockZodEventValidator', zodResult: 'success' }
      };
    } else {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        code: 'INVALID_SCHEMA',
        message: err.message,
        path: err.path.join('.'),
        context: { zodError: err }
      }));
      
      return {
        isValid: false,
        errors,
        metadata: { validator: 'MockZodEventValidator', zodResult: 'error' }
      };
    }
  }

  async validateAsync(data: TestEvent): Promise<ValidationResult> {
    return this.validate(data);
  }

  getSchema(): ZodSchema {
    return this._schema;
  }
}

// Mock implementation of IClassValidatorEventValidator for testing
class MockClassValidatorEventValidator implements IClassValidatorEventValidator<TestEvent> {
  private _validationFn: (data: TestEvent) => ValidationError[];
  private _schema: any;

  constructor(validationFn: (data: TestEvent) => ValidationError[], schema: any = {}) {
    this._validationFn = validationFn;
    this._schema = schema;
  }

  validate(data: TestEvent): ValidationResult {
    const errors = this._validationFn(data);
    return {
      isValid: errors.length === 0,
      errors,
      metadata: { validator: 'MockClassValidatorEventValidator', synchronous: true }
    };
  }

  async validateAsync(data: TestEvent): Promise<ValidationResult> {
    // Simulate async validation with a small delay
    return new Promise(resolve => {
      setTimeout(() => {
        const errors = this._validationFn(data);
        resolve({
          isValid: errors.length === 0,
          errors,
          metadata: { validator: 'MockClassValidatorEventValidator', synchronous: false }
        });
      }, 10);
    });
  }

  getSchema(): any {
    return this._schema;
  }
}

describe('IEventValidator Interface', () => {
  describe('Basic Implementation', () => {
    it('should correctly identify valid events', () => {
      // Arrange
      const validator = new MockEventValidator(true, []);
      const validEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
    });

    it('should correctly identify invalid events', () => {
      // Arrange
      const errors: ValidationError[] = [
        { code: 'INVALID_TYPE', message: 'Invalid event type' }
      ];
      const validator = new MockEventValidator(false, errors);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'INVALID_TYPE',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
      expect(result.metadata).toBeDefined();
    });

    it('should support asynchronous validation', async () => {
      // Arrange
      const validator = new MockEventValidator(true, []);
      const validEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = await validator.validateAsync(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.synchronous).toBe(false);
    });

    it('should return the schema used for validation', () => {
      // Arrange
      const schema = { type: 'object', properties: { id: { type: 'string' } } };
      const validator = new MockEventValidator(true, [], schema);

      // Act
      const result = validator.getSchema();

      // Assert
      expect(result).toEqual(schema);
    });
  });

  describe('Zod Implementation', () => {
    // Define a Zod schema for testing
    const testEventSchema = z.object({
      id: z.string().uuid(),
      type: z.string(),
      payload: z.record(z.any()),
      timestamp: z.string().datetime()
    });

    it('should validate events against a Zod schema', () => {
      // Arrange
      const validator = new MockZodEventValidator(testEventSchema);
      const validEvent: TestEvent = {
        id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should identify schema violations with detailed error messages', () => {
      // Arrange
      const validator = new MockZodEventValidator(testEventSchema);
      const invalidEvent: TestEvent = {
        id: 'not-a-uuid', // Invalid UUID
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_SCHEMA');
      expect(result.errors[0].path).toBe('id');
      expect(result.errors[0].message).toContain('uuid');
    });

    it('should return the Zod schema used for validation', () => {
      // Arrange
      const validator = new MockZodEventValidator(testEventSchema);

      // Act
      const schema = validator.getSchema();

      // Assert
      expect(schema).toBe(testEventSchema);
    });
  });

  describe('Class Validator Implementation', () => {
    it('should validate events using custom validation functions', () => {
      // Arrange
      const validationFn = (data: TestEvent): ValidationError[] => {
        const errors: ValidationError[] = [];
        
        if (!data.id) {
          errors.push({
            code: 'REQUIRED',
            message: 'ID is required',
            path: 'id'
          });
        }
        
        if (data.type !== 'TEST_EVENT') {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Expected event type 'TEST_EVENT', got '${data.type}'`,
            path: 'type'
          });
        }
        
        return errors;
      };
      
      const validator = new MockClassValidatorEventValidator(validationFn);
      const validEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should identify validation errors with detailed messages', () => {
      // Arrange
      const validationFn = (data: TestEvent): ValidationError[] => {
        const errors: ValidationError[] = [];
        
        if (!data.id) {
          errors.push({
            code: 'REQUIRED',
            message: 'ID is required',
            path: 'id'
          });
        }
        
        if (data.type !== 'TEST_EVENT') {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Expected event type 'TEST_EVENT', got '${data.type}'`,
            path: 'type'
          });
        }
        
        return errors;
      };
      
      const validator = new MockClassValidatorEventValidator(validationFn);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'WRONG_TYPE', // Invalid type
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
      expect(result.errors[0].path).toBe('type');
      expect(result.errors[0].message).toContain('WRONG_TYPE');
    });

    it('should support asynchronous validation with class validator', async () => {
      // Arrange
      const validationFn = (data: TestEvent): ValidationError[] => {
        return data.id ? [] : [{ code: 'REQUIRED', message: 'ID is required', path: 'id' }];
      };
      
      const validator = new MockClassValidatorEventValidator(validationFn);
      const validEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = await validator.validateAsync(validEvent);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.synchronous).toBe(false);
    });
  });

  describe('ValidationResult Structure', () => {
    it('should have the correct structure for valid results', () => {
      // Arrange
      const validator = new MockEventValidator(true, []);
      const validEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(validEvent);

      // Assert
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('metadata');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have the correct structure for invalid results', () => {
      // Arrange
      const errors: ValidationError[] = [
        { 
          code: 'INVALID_TYPE', 
          message: 'Invalid event type',
          path: 'type',
          context: { expected: 'TEST_EVENT', received: 'WRONG_TYPE' }
        }
      ];
      const validator = new MockEventValidator(false, errors);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'WRONG_TYPE',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('metadata');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toHaveProperty('code');
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0]).toHaveProperty('path');
      expect(result.errors[0]).toHaveProperty('context');
    });

    it('should include optional metadata in the validation result', () => {
      // Arrange
      const validator = new MockEventValidator(true, []);
      const validEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(validEvent);

      // Assert
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.validator).toBe('MockEventValidator');
      expect(result.metadata?.synchronous).toBe(true);
    });
  });

  describe('ValidationError Structure', () => {
    it('should have the correct structure for validation errors', () => {
      // Arrange
      const error: ValidationError = {
        code: 'INVALID_FORMAT',
        message: 'Invalid date format',
        path: 'timestamp',
        context: { expected: 'ISO8601', received: 'DD/MM/YYYY' }
      };
      const validator = new MockEventValidator(false, [error]);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        timestamp: '01/01/2023' // Invalid format
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
      expect(result.errors[0].message).toBe('Invalid date format');
      expect(result.errors[0].path).toBe('timestamp');
      expect(result.errors[0].context).toEqual({ expected: 'ISO8601', received: 'DD/MM/YYYY' });
    });

    it('should support multiple validation errors', () => {
      // Arrange
      const errors: ValidationError[] = [
        { code: 'INVALID_TYPE', message: 'Invalid event type', path: 'type' },
        { code: 'INVALID_FORMAT', message: 'Invalid date format', path: 'timestamp' }
      ];
      const validator = new MockEventValidator(false, errors);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'WRONG_TYPE',
        payload: { test: 'data' },
        timestamp: '01/01/2023' // Invalid format
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].path).toBe('type');
      expect(result.errors[1].path).toBe('timestamp');
    });

    it('should support nested property paths in validation errors', () => {
      // Arrange
      const error: ValidationError = {
        code: 'REQUIRED',
        message: 'Required field missing',
        path: 'payload.requiredField'
      };
      const validator = new MockEventValidator(false, [error]);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'TEST_EVENT',
        payload: { test: 'data' }, // Missing requiredField
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('payload.requiredField');
    });
  });

  describe('Business Rule Validation', () => {
    it('should support custom business rule validation', () => {
      // Arrange
      const validationFn = (data: TestEvent): ValidationError[] => {
        const errors: ValidationError[] = [];
        
        // Business rule: Events with type 'SPECIAL_EVENT' must have a special payload field
        if (data.type === 'SPECIAL_EVENT' && !data.payload.specialField) {
          errors.push({
            code: 'BUSINESS_RULE',
            message: "Events of type 'SPECIAL_EVENT' must have a 'specialField' in the payload",
            path: 'payload.specialField',
            context: { rule: 'SPECIAL_EVENT_REQUIRES_SPECIAL_FIELD' }
          });
        }
        
        return errors;
      };
      
      const validator = new MockClassValidatorEventValidator(validationFn);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'SPECIAL_EVENT',
        payload: { test: 'data' }, // Missing specialField
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('BUSINESS_RULE');
      expect(result.errors[0].context?.rule).toBe('SPECIAL_EVENT_REQUIRES_SPECIAL_FIELD');
    });

    it('should support complex business rules involving multiple fields', () => {
      // Arrange
      const validationFn = (data: TestEvent): ValidationError[] => {
        const errors: ValidationError[] = [];
        
        // Business rule: If payload has startDate and endDate, endDate must be after startDate
        if (data.payload.startDate && data.payload.endDate) {
          const startDate = new Date(data.payload.startDate);
          const endDate = new Date(data.payload.endDate);
          
          if (endDate <= startDate) {
            errors.push({
              code: 'BUSINESS_RULE',
              message: 'End date must be after start date',
              path: 'payload.endDate',
              context: { 
                rule: 'END_DATE_AFTER_START_DATE',
                startDate: data.payload.startDate,
                endDate: data.payload.endDate
              }
            });
          }
        }
        
        return errors;
      };
      
      const validator = new MockClassValidatorEventValidator(validationFn);
      const invalidEvent: TestEvent = {
        id: '123',
        type: 'DATE_RANGE_EVENT',
        payload: { 
          startDate: '2023-01-10T00:00:00Z',
          endDate: '2023-01-01T00:00:00Z' // Before startDate
        },
        timestamp: '2023-01-01T00:00:00Z'
      };

      // Act
      const result = validator.validate(invalidEvent);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('BUSINESS_RULE');
      expect(result.errors[0].message).toContain('End date must be after start date');
    });
  });
});