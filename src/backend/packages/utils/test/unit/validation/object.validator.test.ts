/**
 * Unit tests for object validation utilities.
 * 
 * These tests verify the functionality of object structure validation utilities that check
 * property existence, nested property access, and complex object validation. The tests ensure
 * proper data integrity validation for API payloads, event messages, and complex data structures
 * used throughout the journey services.
 */

import {
  hasRequiredProperties,
  validateProperties,
  hasPropertyOfType,
  hasValidProperty,
  getNestedProperty,
  hasNestedProperty,
  hasValidNestedProperty,
  validateArrayProperty,
  validateObjectSchema,
  isValidType,
  isDeepEqual,
  validateInterface,
  createPartialSchema,
  hasAtLeastOneProperty,
  validatePropertyGroups,
  validateObjectShape,
  PropertyDefinition
} from '../../../src/validation/object.validator';

describe('Object Validator', () => {
  // Test data
  const validUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    profile: {
      bio: 'Software developer',
      social: {
        twitter: '@johndoe',
        github: 'johndoe'
      }
    },
    tags: ['developer', 'javascript', 'typescript'],
    active: true
  };

  const invalidUser = {
    name: 'Jane Doe',
    profile: 'Not an object'
  };

  describe('hasRequiredProperties', () => {
    it('should return true when object has all required properties', () => {
      const result = hasRequiredProperties(validUser, ['id', 'name', 'email']);
      expect(result).toBe(true);
    });

    it('should return false when object is missing required properties', () => {
      const result = hasRequiredProperties(validUser, ['id', 'name', 'nonExistent']);
      expect(result).toBe(false);
    });

    it('should return false when input is not an object', () => {
      const result = hasRequiredProperties('not an object', ['id']);
      expect(result).toBe(false);
    });

    it('should throw error when throwOnError is true and object is missing properties', () => {
      expect(() => {
        hasRequiredProperties(validUser, ['id', 'nonExistent'], { throwOnError: true });
      }).toThrow();
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      expect(() => {
        hasRequiredProperties(validUser, ['nonExistent'], {
          throwOnError: true,
          errorMessage: customMessage
        });
      }).toThrow(customMessage);
    });
  });

  describe('validateProperties', () => {
    it('should return success when object has all required properties', () => {
      const result = validateProperties(validUser, ['id', 'name', 'email']);
      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.data).toBe(validUser);
    });

    it('should return errors when object is missing required properties', () => {
      const result = validateProperties(validUser, ['id', 'nonExistent']);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].field).toBe('nonExistent');
      expect(result.errors![0].code).toBe('REQUIRED');
    });

    it('should return error when input is not an object', () => {
      const result = validateProperties('not an object');
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });

    it('should validate optional properties if present', () => {
      const result = validateProperties(validUser, ['id'], ['age', 'active']);
      expect(result.success).toBe(true);
    });

    it('should detect additional properties when not allowed', () => {
      const result = validateProperties(
        validUser,
        ['id', 'name'],
        ['email', 'age'],
        { allowAdditionalProperties: false }
      );
      expect(result.success).toBe(false);
      expect(result.errors!.some(e => e.code === 'ADDITIONAL_PROPERTY')).toBe(true);
    });

    it('should include context in errors when provided', () => {
      const context = { source: 'API', operation: 'create' };
      const result = validateProperties(validUser, ['nonExistent'], [], { context });
      expect(result.success).toBe(false);
      expect(result.errors![0].context).toBe(context);
    });
  });

  describe('hasPropertyOfType', () => {
    it('should return true when property exists and is of correct type', () => {
      expect(hasPropertyOfType(validUser, 'name', 'string')).toBe(true);
      expect(hasPropertyOfType(validUser, 'age', 'number')).toBe(true);
      expect(hasPropertyOfType(validUser, 'active', 'boolean')).toBe(true);
      expect(hasPropertyOfType(validUser, 'profile', 'object')).toBe(true);
      expect(hasPropertyOfType(validUser, 'tags', 'array')).toBe(true);
    });

    it('should return false when property exists but is of wrong type', () => {
      expect(hasPropertyOfType(validUser, 'name', 'number')).toBe(false);
      expect(hasPropertyOfType(invalidUser, 'profile', 'object')).toBe(false);
    });

    it('should return false when property does not exist', () => {
      expect(hasPropertyOfType(validUser, 'nonExistent', 'string')).toBe(false);
    });

    it('should return false when input is not an object', () => {
      expect(hasPropertyOfType('not an object', 'length', 'number')).toBe(false);
    });

    it('should throw error when throwOnError is true and validation fails', () => {
      expect(() => {
        hasPropertyOfType(validUser, 'name', 'number', { throwOnError: true });
      }).toThrow();
    });
  });

  describe('hasValidProperty', () => {
    it('should return true when property exists and passes validation', () => {
      const result = hasValidProperty(validUser, 'age', value => value > 18);
      expect(result).toBe(true);
    });

    it('should return false when property exists but fails validation', () => {
      const result = hasValidProperty(validUser, 'age', value => value > 40);
      expect(result).toBe(false);
    });

    it('should return false when property does not exist', () => {
      const result = hasValidProperty(validUser, 'nonExistent', () => true);
      expect(result).toBe(false);
    });

    it('should return false when input is not an object', () => {
      const result = hasValidProperty('not an object', 'length', () => true);
      expect(result).toBe(false);
    });

    it('should throw error when throwOnError is true and validation fails', () => {
      expect(() => {
        hasValidProperty(validUser, 'age', value => value > 40, { throwOnError: true });
      }).toThrow();
    });
  });

  describe('getNestedProperty', () => {
    it('should return value when nested property exists (string path)', () => {
      const result = getNestedProperty(validUser, 'profile.bio');
      expect(result).toBe('Software developer');
    });

    it('should return value when nested property exists (array path)', () => {
      const result = getNestedProperty(validUser, ['profile', 'bio']);
      expect(result).toBe('Software developer');
    });

    it('should return value for deeply nested property', () => {
      const result = getNestedProperty(validUser, 'profile.social.twitter');
      expect(result).toBe('@johndoe');
    });

    it('should return undefined when nested property does not exist', () => {
      const result = getNestedProperty(validUser, 'profile.nonExistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined when path is invalid', () => {
      const result = getNestedProperty(validUser, 'profile.social.nonExistent.prop');
      expect(result).toBeUndefined();
    });

    it('should return undefined when input is not an object', () => {
      const result = getNestedProperty('not an object', 'length');
      expect(result).toBeUndefined();
    });
  });

  describe('hasNestedProperty', () => {
    it('should return true when nested property exists (string path)', () => {
      const result = hasNestedProperty(validUser, 'profile.bio');
      expect(result).toBe(true);
    });

    it('should return true when nested property exists (array path)', () => {
      const result = hasNestedProperty(validUser, ['profile', 'bio']);
      expect(result).toBe(true);
    });

    it('should return false when nested property does not exist', () => {
      const result = hasNestedProperty(validUser, 'profile.nonExistent');
      expect(result).toBe(false);
    });

    it('should return false when path is invalid', () => {
      const result = hasNestedProperty(validUser, 'profile.social.nonExistent.prop');
      expect(result).toBe(false);
    });

    it('should return false when input is not an object', () => {
      const result = hasNestedProperty('not an object', 'length');
      expect(result).toBe(false);
    });

    it('should throw error when throwOnError is true and property does not exist', () => {
      expect(() => {
        hasNestedProperty(validUser, 'profile.nonExistent', { throwOnError: true });
      }).toThrow();
    });
  });

  describe('hasValidNestedProperty', () => {
    it('should return true when nested property exists and passes validation', () => {
      const result = hasValidNestedProperty(
        validUser,
        'profile.bio',
        value => typeof value === 'string' && value.length > 0
      );
      expect(result).toBe(true);
    });

    it('should return false when nested property exists but fails validation', () => {
      const result = hasValidNestedProperty(
        validUser,
        'profile.bio',
        value => typeof value === 'string' && value.length > 50
      );
      expect(result).toBe(false);
    });

    it('should return false when nested property does not exist', () => {
      const result = hasValidNestedProperty(validUser, 'profile.nonExistent', () => true);
      expect(result).toBe(false);
    });

    it('should return false when input is not an object', () => {
      const result = hasValidNestedProperty('not an object', 'length', () => true);
      expect(result).toBe(false);
    });

    it('should throw error when throwOnError is true and validation fails', () => {
      expect(() => {
        hasValidNestedProperty(
          validUser,
          'profile.bio',
          value => typeof value === 'string' && value.length > 50,
          { throwOnError: true }
        );
      }).toThrow();
    });
  });

  describe('validateArrayProperty', () => {
    it('should return success when array property exists and all elements pass validation', () => {
      const result = validateArrayProperty(
        validUser,
        'tags',
        value => typeof value === 'string' && value.length > 0
      );
      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors when array property exists but some elements fail validation', () => {
      const result = validateArrayProperty(
        validUser,
        'tags',
        value => typeof value === 'string' && value.length > 10
      );
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should return error when property is not an array', () => {
      const result = validateArrayProperty(
        validUser,
        'name',
        () => true
      );
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });

    it('should return error when property does not exist', () => {
      const result = validateArrayProperty(
        validUser,
        'nonExistent',
        () => true
      );
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('MISSING_PROPERTY');
    });

    it('should return error when input is not an object', () => {
      const result = validateArrayProperty(
        'not an object',
        'length',
        () => true
      );
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });

    it('should include index in error field for failed elements', () => {
      const result = validateArrayProperty(
        validUser,
        'tags',
        (value, index) => index !== 1 // Fail the second element
      );
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('tags[1]');
    });
  });

  describe('validateObjectSchema', () => {
    it('should return success when object matches schema', () => {
      const schema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'name', required: true },
        { name: 'email', required: true },
        { name: 'age', required: false, validator: value => typeof value === 'number' && value >= 18 }
      ];

      const result = validateObjectSchema(validUser, schema);
      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors when required properties are missing', () => {
      const schema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'nonExistent', required: true }
      ];

      const result = validateObjectSchema(validUser, schema);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].field).toBe('nonExistent');
      expect(result.errors![0].code).toBe('REQUIRED');
    });

    it('should return errors when properties fail validation', () => {
      const schema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'age', required: true, validator: value => value > 40 }
      ];

      const result = validateObjectSchema(validUser, schema);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].field).toBe('age');
      expect(result.errors![0].code).toBe('INVALID_VALUE');
    });

    it('should use custom error messages when provided', () => {
      const customMessage = 'Age must be over 40';
      const schema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'age', required: true, validator: value => value > 40, errorMessage: customMessage }
      ];

      const result = validateObjectSchema(validUser, schema);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toBe(customMessage);
    });

    it('should detect additional properties when not allowed', () => {
      const schema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'name', required: true }
      ];

      const result = validateObjectSchema(validUser, schema, { allowAdditionalProperties: false });
      expect(result.success).toBe(false);
      expect(result.errors!.some(e => e.code === 'ADDITIONAL_PROPERTY')).toBe(true);
    });

    it('should return error when input is not an object', () => {
      const schema: PropertyDefinition[] = [
        { name: 'id', required: true }
      ];

      const result = validateObjectSchema('not an object', schema);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });
  });

  describe('isValidType', () => {
    it('should return true for primitive types', () => {
      expect(isValidType('test', 'string')).toBe(true);
      expect(isValidType(123, 'number')).toBe(true);
      expect(isValidType(true, 'boolean')).toBe(true);
      expect(isValidType({}, 'object')).toBe(true);
      expect(isValidType([], 'array')).toBe(true);
      expect(isValidType(() => {}, 'function')).toBe(true);
      expect(isValidType(null, 'null')).toBe(true);
      expect(isValidType(undefined, 'undefined')).toBe(true);
    });

    it('should return true for Date objects', () => {
      expect(isValidType(new Date(), 'date')).toBe(true);
    });

    it('should return false for invalid Date objects', () => {
      const invalidDate = new Date('invalid date');
      expect(isValidType(invalidDate, 'date')).toBe(false);
    });

    it('should return false for incorrect types', () => {
      expect(isValidType('test', 'number')).toBe(false);
      expect(isValidType(123, 'string')).toBe(false);
      expect(isValidType({}, 'array')).toBe(false);
      expect(isValidType([], 'object')).toBe(false);
    });

    it('should throw error when throwOnError is true and type is incorrect', () => {
      expect(() => {
        isValidType('test', 'number', { throwOnError: true });
      }).toThrow();
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      expect(() => {
        isValidType('test', 'number', { throwOnError: true, errorMessage: customMessage });
      }).toThrow(customMessage);
    });
  });

  describe('isDeepEqual', () => {
    it('should return true for identical primitive values', () => {
      expect(isDeepEqual('test', 'test')).toBe(true);
      expect(isDeepEqual(123, 123)).toBe(true);
      expect(isDeepEqual(true, true)).toBe(true);
      expect(isDeepEqual(null, null)).toBe(true);
      expect(isDeepEqual(undefined, undefined)).toBe(true);
    });

    it('should return true for identical objects', () => {
      const obj1 = { a: 1, b: 'test', c: true };
      const obj2 = { a: 1, b: 'test', c: true };
      expect(isDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should return true for identical nested objects', () => {
      const obj1 = { a: 1, b: { c: 'test', d: [1, 2, 3] } };
      const obj2 = { a: 1, b: { c: 'test', d: [1, 2, 3] } };
      expect(isDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should return true for identical arrays', () => {
      const arr1 = [1, 'test', true];
      const arr2 = [1, 'test', true];
      expect(isDeepEqual(arr1, arr2)).toBe(true);
    });

    it('should return true for identical dates', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      expect(isDeepEqual(date1, date2)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(isDeepEqual('test', 'different')).toBe(false);
      expect(isDeepEqual(123, 456)).toBe(false);
      expect(isDeepEqual(true, false)).toBe(false);
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, b: 'different' };
      expect(isDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for objects with different properties', () => {
      const obj1 = { a: 1, b: 'test' };
      const obj2 = { a: 1, c: 'test' };
      expect(isDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for arrays with different elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 4];
      expect(isDeepEqual(arr1, arr2)).toBe(false);
    });

    it('should return false for arrays with different lengths', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2];
      expect(isDeepEqual(arr1, arr2)).toBe(false);
    });

    it('should ignore undefined values when ignoreUndefined is true', () => {
      const obj1 = { a: 1, b: 'test', c: undefined };
      const obj2 = { a: 1, b: 'test' };
      expect(isDeepEqual(obj1, obj2, { ignoreUndefined: true })).toBe(true);
    });

    it('should ignore property order when ignoreOrder is true', () => {
      const obj1 = { a: 1, b: 'test', c: true };
      const obj2 = { c: true, a: 1, b: 'test' };
      expect(isDeepEqual(obj1, obj2, { ignoreOrder: true })).toBe(true);
    });

    it('should ignore array order when ignoreOrder is true', () => {
      const arr1 = [3, 1, 2];
      const arr2 = [1, 2, 3];
      expect(isDeepEqual(arr1, arr2, { ignoreOrder: true })).toBe(true);
    });
  });

  describe('validateInterface', () => {
    // Define a type guard function for testing
    const isUserInterface = (obj: unknown): obj is { id: string; name: string } => {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'name' in obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string'
      );
    };

    it('should return success when object matches interface', () => {
      const result = validateInterface(validUser, isUserInterface);
      expect(result.success).toBe(true);
      expect(result.data).toBe(validUser);
    });

    it('should return error when object does not match interface', () => {
      const invalidObj = { id: 123, name: 'John' };
      const result = validateInterface(invalidObj, isUserInterface);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_INTERFACE');
    });

    it('should return error when input is not an object', () => {
      const result = validateInterface('not an object', isUserInterface);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      const result = validateInterface(
        { id: 123, name: 'John' },
        isUserInterface,
        { errorMessage: customMessage }
      );
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toBe(customMessage);
    });
  });

  describe('createPartialSchema', () => {
    it('should create a partial schema with only specified properties', () => {
      const fullSchema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'name', required: true },
        { name: 'email', required: true },
        { name: 'age', required: false }
      ];

      const partialSchema = createPartialSchema(fullSchema, ['name', 'email']);
      expect(partialSchema).toHaveLength(2);
      expect(partialSchema[0].name).toBe('name');
      expect(partialSchema[1].name).toBe('email');
    });

    it('should preserve property definitions in the partial schema', () => {
      const validator = (value: any) => typeof value === 'string';
      const errorMessage = 'Custom error message';
      const fullSchema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'name', required: true, validator, errorMessage }
      ];

      const partialSchema = createPartialSchema(fullSchema, ['name']);
      expect(partialSchema).toHaveLength(1);
      expect(partialSchema[0].name).toBe('name');
      expect(partialSchema[0].required).toBe(true);
      expect(partialSchema[0].validator).toBe(validator);
      expect(partialSchema[0].errorMessage).toBe(errorMessage);
    });

    it('should return empty array when no properties match', () => {
      const fullSchema: PropertyDefinition[] = [
        { name: 'id', required: true },
        { name: 'name', required: true }
      ];

      const partialSchema = createPartialSchema(fullSchema, ['nonExistent']);
      expect(partialSchema).toHaveLength(0);
    });
  });

  describe('hasAtLeastOneProperty', () => {
    it('should return true when object has at least one of the specified properties', () => {
      const result = hasAtLeastOneProperty(validUser, ['id', 'nonExistent']);
      expect(result).toBe(true);
    });

    it('should return true when object has all specified properties', () => {
      const result = hasAtLeastOneProperty(validUser, ['id', 'name', 'email']);
      expect(result).toBe(true);
    });

    it('should return false when object has none of the specified properties', () => {
      const result = hasAtLeastOneProperty(validUser, ['nonExistent1', 'nonExistent2']);
      expect(result).toBe(false);
    });

    it('should return false when input is not an object', () => {
      const result = hasAtLeastOneProperty('not an object', ['length']);
      expect(result).toBe(false);
    });

    it('should throw error when throwOnError is true and no properties exist', () => {
      expect(() => {
        hasAtLeastOneProperty(validUser, ['nonExistent1', 'nonExistent2'], { throwOnError: true });
      }).toThrow();
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      expect(() => {
        hasAtLeastOneProperty(
          validUser,
          ['nonExistent1', 'nonExistent2'],
          { throwOnError: true, errorMessage: customMessage }
        );
      }).toThrow(customMessage);
    });
  });

  describe('validatePropertyGroups', () => {
    const paymentGroups = {
      creditCard: ['cardNumber', 'expiryDate', 'cvv'],
      bankTransfer: ['accountNumber', 'routingNumber', 'accountName'],
      paypal: ['paypalEmail']
    };

    it('should return success with matched group when object matches one group', () => {
      const creditCardPayment = {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123'
      };

      const result = validatePropertyGroups(creditCardPayment, paymentGroups);
      expect(result.success).toBe(true);
      expect(result.matchedGroup).toBe('creditCard');
    });

    it('should return error when object has properties from multiple groups', () => {
      const mixedPayment = {
        cardNumber: '4111111111111111',
        paypalEmail: 'user@example.com'
      };

      const result = validatePropertyGroups(mixedPayment, paymentGroups);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('MIXED_GROUPS');
    });

    it('should return error when object does not match any group', () => {
      const invalidPayment = {
        someProperty: 'value'
      };

      const result = validatePropertyGroups(invalidPayment, paymentGroups);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('NO_GROUP_MATCH');
    });

    it('should return error when requireAllGroupProperties is true and properties are missing', () => {
      const incompletePayment = {
        cardNumber: '4111111111111111',
        expiryDate: '12/25'
        // Missing cvv
      };

      const result = validatePropertyGroups(incompletePayment, paymentGroups, {
        requireAllGroupProperties: true
      });
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('MISSING_GROUP_PROPERTY');
    });

    it('should return error when input is not an object', () => {
      const result = validatePropertyGroups('not an object', paymentGroups);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });

    it('should use custom error message when provided', () => {
      const customMessage = 'Custom error message';
      const result = validatePropertyGroups(
        { someProperty: 'value' },
        paymentGroups,
        { errorMessage: customMessage }
      );
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toBe(customMessage);
    });
  });

  describe('validateObjectShape', () => {
    const userTemplate = {
      id: '',
      name: '',
      age: 0,
      active: true,
      profile: {
        bio: ''
      }
    };

    it('should return success when object matches template shape', () => {
      const result = validateObjectShape(validUser, userTemplate);
      expect(result.success).toBe(true);
    });

    it('should return error when object is missing properties from template', () => {
      const incompleteUser = {
        id: '123',
        name: 'John'
        // Missing age, active, profile
      };

      const result = validateObjectShape(incompleteUser, userTemplate);
      expect(result.success).toBe(false);
      expect(result.errors!.some(e => e.field === 'age')).toBe(true);
      expect(result.errors!.some(e => e.field === 'active')).toBe(true);
      expect(result.errors!.some(e => e.field === 'profile')).toBe(true);
    });

    it('should return error when property types do not match template', () => {
      const wrongTypeUser = {
        id: 123, // Should be string
        name: 'John',
        age: 30,
        active: true,
        profile: {
          bio: 'Software developer'
        }
      };

      const result = validateObjectShape(wrongTypeUser, userTemplate);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('TYPE_MISMATCH');
      expect(result.errors![0].field).toBe('id');
    });

    it('should validate nested objects when validateNested is true', () => {
      const userWithWrongProfile = {
        id: '123',
        name: 'John',
        age: 30,
        active: true,
        profile: {
          // Missing bio
        }
      };

      const result = validateObjectShape(userWithWrongProfile, userTemplate, {
        validateNested: true
      });
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('profile.bio');
    });

    it('should detect additional properties when not allowed', () => {
      const userWithExtra = {
        id: '123',
        name: 'John',
        age: 30,
        active: true,
        profile: {
          bio: 'Software developer'
        },
        extra: 'Additional property'
      };

      const result = validateObjectShape(userWithExtra, userTemplate, {
        allowAdditionalProperties: false
      });
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('ADDITIONAL_PROPERTY');
      expect(result.errors![0].field).toBe('extra');
    });

    it('should return error when input is not an object', () => {
      const result = validateObjectShape('not an object', userTemplate);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TYPE');
    });

    it('should return error when template is not an object', () => {
      const result = validateObjectShape(validUser, 'not an object' as any);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_TEMPLATE');
    });
  });
});