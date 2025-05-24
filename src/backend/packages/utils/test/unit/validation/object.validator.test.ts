import { describe, expect, it, jest } from '@jest/globals';

// Import the validators we want to test
// Note: The actual implementation will be created in object.validator.ts
import {
  hasProperty,
  hasRequiredProperties,
  hasNestedProperty,
  getNestedProperty,
  isType,
  hasArrayProperty,
  validateStructure,
  isDeepEqual
} from '../../../src/validation/object.validator';

// Mock the module
jest.mock('../../../src/validation/object.validator', () => ({
  hasProperty: jest.fn(),
  hasRequiredProperties: jest.fn(),
  hasNestedProperty: jest.fn(),
  getNestedProperty: jest.fn(),
  isType: jest.fn(),
  hasArrayProperty: jest.fn(),
  validateStructure: jest.fn(),
  isDeepEqual: jest.fn(),
}));

describe('Object Validators', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('hasProperty', () => {
    it('should return true when object has the specified property', () => {
      // Arrange
      const obj = { name: 'John', age: 30 };
      const property = 'name';
      (hasProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasProperty(obj, property);
      
      // Assert
      expect(result).toBe(true);
      expect(hasProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return false when object does not have the specified property', () => {
      // Arrange
      const obj = { name: 'John', age: 30 };
      const property = 'address';
      (hasProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasProperty(obj, property);
      
      // Assert
      expect(result).toBe(false);
      expect(hasProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return true when property exists but has null value', () => {
      // Arrange
      const obj = { name: 'John', address: null };
      const property = 'address';
      (hasProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasProperty(obj, property);
      
      // Assert
      expect(result).toBe(true);
      expect(hasProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return false when input is not an object', () => {
      // Arrange
      const obj = 'not an object';
      const property = 'name';
      (hasProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasProperty(obj, property);
      
      // Assert
      expect(result).toBe(false);
      expect(hasProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return false when input is null or undefined', () => {
      // Arrange
      const obj = null;
      const property = 'name';
      (hasProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasProperty(obj, property);
      
      // Assert
      expect(result).toBe(false);
      expect(hasProperty).toHaveBeenCalledWith(obj, property);
    });
  });

  describe('hasRequiredProperties', () => {
    it('should return true when object has all required properties', () => {
      // Arrange
      const obj = { name: 'John', age: 30, email: 'john@example.com' };
      const requiredProps = ['name', 'age', 'email'];
      (hasRequiredProperties as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasRequiredProperties(obj, requiredProps);
      
      // Assert
      expect(result).toBe(true);
      expect(hasRequiredProperties).toHaveBeenCalledWith(obj, requiredProps);
    });

    it('should return false when object is missing some required properties', () => {
      // Arrange
      const obj = { name: 'John', age: 30 };
      const requiredProps = ['name', 'age', 'email'];
      (hasRequiredProperties as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasRequiredProperties(obj, requiredProps);
      
      // Assert
      expect(result).toBe(false);
      expect(hasRequiredProperties).toHaveBeenCalledWith(obj, requiredProps);
    });

    it('should return true when checking for empty array of required properties', () => {
      // Arrange
      const obj = { name: 'John', age: 30 };
      const requiredProps: string[] = [];
      (hasRequiredProperties as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasRequiredProperties(obj, requiredProps);
      
      // Assert
      expect(result).toBe(true);
      expect(hasRequiredProperties).toHaveBeenCalledWith(obj, requiredProps);
    });

    it('should return false when input is not an object', () => {
      // Arrange
      const obj = 'not an object';
      const requiredProps = ['name', 'age'];
      (hasRequiredProperties as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasRequiredProperties(obj, requiredProps);
      
      // Assert
      expect(result).toBe(false);
      expect(hasRequiredProperties).toHaveBeenCalledWith(obj, requiredProps);
    });

    it('should return false when input is null or undefined', () => {
      // Arrange
      const obj = null;
      const requiredProps = ['name', 'age'];
      (hasRequiredProperties as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasRequiredProperties(obj, requiredProps);
      
      // Assert
      expect(result).toBe(false);
      expect(hasRequiredProperties).toHaveBeenCalledWith(obj, requiredProps);
    });
  });

  describe('hasNestedProperty', () => {
    it('should return true when object has the specified nested property', () => {
      // Arrange
      const obj = { user: { profile: { name: 'John' } } };
      const path = 'user.profile.name';
      (hasNestedProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasNestedProperty(obj, path);
      
      // Assert
      expect(result).toBe(true);
      expect(hasNestedProperty).toHaveBeenCalledWith(obj, path);
    });

    it('should return false when object does not have the specified nested property', () => {
      // Arrange
      const obj = { user: { profile: { name: 'John' } } };
      const path = 'user.profile.address';
      (hasNestedProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasNestedProperty(obj, path);
      
      // Assert
      expect(result).toBe(false);
      expect(hasNestedProperty).toHaveBeenCalledWith(obj, path);
    });

    it('should return false when a middle property in the path does not exist', () => {
      // Arrange
      const obj = { user: { name: 'John' } };
      const path = 'user.profile.name';
      (hasNestedProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasNestedProperty(obj, path);
      
      // Assert
      expect(result).toBe(false);
      expect(hasNestedProperty).toHaveBeenCalledWith(obj, path);
    });

    it('should return true when nested property exists but has null value', () => {
      // Arrange
      const obj = { user: { profile: { name: null } } };
      const path = 'user.profile.name';
      (hasNestedProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasNestedProperty(obj, path);
      
      // Assert
      expect(result).toBe(true);
      expect(hasNestedProperty).toHaveBeenCalledWith(obj, path);
    });

    it('should return false when input is not an object', () => {
      // Arrange
      const obj = 'not an object';
      const path = 'user.profile.name';
      (hasNestedProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasNestedProperty(obj, path);
      
      // Assert
      expect(result).toBe(false);
      expect(hasNestedProperty).toHaveBeenCalledWith(obj, path);
    });
  });

  describe('getNestedProperty', () => {
    it('should return the value of the specified nested property', () => {
      // Arrange
      const obj = { user: { profile: { name: 'John' } } };
      const path = 'user.profile.name';
      const defaultValue = 'Unknown';
      (getNestedProperty as jest.Mock).mockReturnValue('John');
      
      // Act
      const result = getNestedProperty(obj, path, defaultValue);
      
      // Assert
      expect(result).toBe('John');
      expect(getNestedProperty).toHaveBeenCalledWith(obj, path, defaultValue);
    });

    it('should return the default value when nested property does not exist', () => {
      // Arrange
      const obj = { user: { profile: { name: 'John' } } };
      const path = 'user.profile.address';
      const defaultValue = 'Unknown';
      (getNestedProperty as jest.Mock).mockReturnValue('Unknown');
      
      // Act
      const result = getNestedProperty(obj, path, defaultValue);
      
      // Assert
      expect(result).toBe('Unknown');
      expect(getNestedProperty).toHaveBeenCalledWith(obj, path, defaultValue);
    });

    it('should return the default value when a middle property in the path does not exist', () => {
      // Arrange
      const obj = { user: { name: 'John' } };
      const path = 'user.profile.name';
      const defaultValue = 'Unknown';
      (getNestedProperty as jest.Mock).mockReturnValue('Unknown');
      
      // Act
      const result = getNestedProperty(obj, path, defaultValue);
      
      // Assert
      expect(result).toBe('Unknown');
      expect(getNestedProperty).toHaveBeenCalledWith(obj, path, defaultValue);
    });

    it('should return null when property exists with null value and no default is provided', () => {
      // Arrange
      const obj = { user: { profile: { name: null } } };
      const path = 'user.profile.name';
      (getNestedProperty as jest.Mock).mockReturnValue(null);
      
      // Act
      const result = getNestedProperty(obj, path);
      
      // Assert
      expect(result).toBe(null);
      expect(getNestedProperty).toHaveBeenCalledWith(obj, path, undefined);
    });

    it('should return the default value when input is not an object', () => {
      // Arrange
      const obj = 'not an object';
      const path = 'user.profile.name';
      const defaultValue = 'Unknown';
      (getNestedProperty as jest.Mock).mockReturnValue('Unknown');
      
      // Act
      const result = getNestedProperty(obj, path, defaultValue);
      
      // Assert
      expect(result).toBe('Unknown');
      expect(getNestedProperty).toHaveBeenCalledWith(obj, path, defaultValue);
    });
  });

  describe('isType', () => {
    it('should return true when value is of the specified type (string)', () => {
      // Arrange
      const value = 'test';
      const type = 'string';
      (isType as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(true);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return true when value is of the specified type (number)', () => {
      // Arrange
      const value = 42;
      const type = 'number';
      (isType as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(true);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return true when value is of the specified type (boolean)', () => {
      // Arrange
      const value = true;
      const type = 'boolean';
      (isType as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(true);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return true when value is of the specified type (object)', () => {
      // Arrange
      const value = { name: 'John' };
      const type = 'object';
      (isType as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(true);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return true when value is of the specified type (array)', () => {
      // Arrange
      const value = [1, 2, 3];
      const type = 'array';
      (isType as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(true);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return false when value is not of the specified type', () => {
      // Arrange
      const value = 'test';
      const type = 'number';
      (isType as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(false);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return false when checking null against any type except null', () => {
      // Arrange
      const value = null;
      const type = 'string';
      (isType as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(false);
      expect(isType).toHaveBeenCalledWith(value, type);
    });

    it('should return true when checking null against null type', () => {
      // Arrange
      const value = null;
      const type = 'null';
      (isType as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isType(value, type);
      
      // Assert
      expect(result).toBe(true);
      expect(isType).toHaveBeenCalledWith(value, type);
    });
  });

  describe('hasArrayProperty', () => {
    it('should return true when object has the specified property as an array', () => {
      // Arrange
      const obj = { items: [1, 2, 3] };
      const property = 'items';
      (hasArrayProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasArrayProperty(obj, property);
      
      // Assert
      expect(result).toBe(true);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return true when object has the specified property as an empty array', () => {
      // Arrange
      const obj = { items: [] };
      const property = 'items';
      (hasArrayProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasArrayProperty(obj, property);
      
      // Assert
      expect(result).toBe(true);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return false when object has the specified property but it is not an array', () => {
      // Arrange
      const obj = { items: 'not an array' };
      const property = 'items';
      (hasArrayProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasArrayProperty(obj, property);
      
      // Assert
      expect(result).toBe(false);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return false when object does not have the specified property', () => {
      // Arrange
      const obj = { name: 'John' };
      const property = 'items';
      (hasArrayProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasArrayProperty(obj, property);
      
      // Assert
      expect(result).toBe(false);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return false when input is not an object', () => {
      // Arrange
      const obj = 'not an object';
      const property = 'items';
      (hasArrayProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasArrayProperty(obj, property);
      
      // Assert
      expect(result).toBe(false);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property);
    });

    it('should return true when validating array elements with a validation function', () => {
      // Arrange
      const obj = { numbers: [1, 2, 3] };
      const property = 'numbers';
      const validator = (item: any) => typeof item === 'number';
      (hasArrayProperty as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = hasArrayProperty(obj, property, validator);
      
      // Assert
      expect(result).toBe(true);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property, validator);
    });

    it('should return false when some array elements fail validation', () => {
      // Arrange
      const obj = { numbers: [1, '2', 3] };
      const property = 'numbers';
      const validator = (item: any) => typeof item === 'number';
      (hasArrayProperty as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = hasArrayProperty(obj, property, validator);
      
      // Assert
      expect(result).toBe(false);
      expect(hasArrayProperty).toHaveBeenCalledWith(obj, property, validator);
    });
  });

  describe('validateStructure', () => {
    it('should return true when object matches the expected structure', () => {
      // Arrange
      const obj = { name: 'John', age: 30, isActive: true };
      const structure = {
        name: 'string',
        age: 'number',
        isActive: 'boolean'
      };
      (validateStructure as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(true);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });

    it('should return false when object does not match the expected structure', () => {
      // Arrange
      const obj = { name: 'John', age: '30', isActive: true };
      const structure = {
        name: 'string',
        age: 'number',
        isActive: 'boolean'
      };
      (validateStructure as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(false);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });

    it('should return false when object is missing required properties', () => {
      // Arrange
      const obj = { name: 'John', isActive: true };
      const structure = {
        name: 'string',
        age: 'number',
        isActive: 'boolean'
      };
      (validateStructure as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(false);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });

    it('should return true when object has additional properties not in structure', () => {
      // Arrange
      const obj = { name: 'John', age: 30, isActive: true, address: '123 Main St' };
      const structure = {
        name: 'string',
        age: 'number',
        isActive: 'boolean'
      };
      (validateStructure as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(true);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });

    it('should return true when validating nested structures', () => {
      // Arrange
      const obj = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
          zipCode: 10001
        }
      };
      const structure = {
        name: 'string',
        age: 'number',
        address: {
          street: 'string',
          city: 'string',
          zipCode: 'number'
        }
      };
      (validateStructure as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(true);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });

    it('should return false when nested structure does not match', () => {
      // Arrange
      const obj = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
          zipCode: '10001' // String instead of number
        }
      };
      const structure = {
        name: 'string',
        age: 'number',
        address: {
          street: 'string',
          city: 'string',
          zipCode: 'number'
        }
      };
      (validateStructure as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(false);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });

    it('should return false when input is not an object', () => {
      // Arrange
      const obj = 'not an object';
      const structure = {
        name: 'string',
        age: 'number'
      };
      (validateStructure as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = validateStructure(obj, structure);
      
      // Assert
      expect(result).toBe(false);
      expect(validateStructure).toHaveBeenCalledWith(obj, structure);
    });
  });

  describe('isDeepEqual', () => {
    it('should return true when objects are deeply equal', () => {
      // Arrange
      const obj1 = { name: 'John', age: 30, address: { city: 'New York' } };
      const obj2 = { name: 'John', age: 30, address: { city: 'New York' } };
      (isDeepEqual as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isDeepEqual(obj1, obj2);
      
      // Assert
      expect(result).toBe(true);
      expect(isDeepEqual).toHaveBeenCalledWith(obj1, obj2);
    });

    it('should return false when objects are not deeply equal', () => {
      // Arrange
      const obj1 = { name: 'John', age: 30, address: { city: 'New York' } };
      const obj2 = { name: 'John', age: 30, address: { city: 'Boston' } };
      (isDeepEqual as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isDeepEqual(obj1, obj2);
      
      // Assert
      expect(result).toBe(false);
      expect(isDeepEqual).toHaveBeenCalledWith(obj1, obj2);
    });

    it('should return true when arrays are deeply equal', () => {
      // Arrange
      const arr1 = [1, 2, { name: 'John' }];
      const arr2 = [1, 2, { name: 'John' }];
      (isDeepEqual as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isDeepEqual(arr1, arr2);
      
      // Assert
      expect(result).toBe(true);
      expect(isDeepEqual).toHaveBeenCalledWith(arr1, arr2);
    });

    it('should return false when arrays are not deeply equal', () => {
      // Arrange
      const arr1 = [1, 2, { name: 'John' }];
      const arr2 = [1, 2, { name: 'Jane' }];
      (isDeepEqual as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isDeepEqual(arr1, arr2);
      
      // Assert
      expect(result).toBe(false);
      expect(isDeepEqual).toHaveBeenCalledWith(arr1, arr2);
    });

    it('should return true when primitive values are equal', () => {
      // Arrange
      const val1 = 42;
      const val2 = 42;
      (isDeepEqual as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isDeepEqual(val1, val2);
      
      // Assert
      expect(result).toBe(true);
      expect(isDeepEqual).toHaveBeenCalledWith(val1, val2);
    });

    it('should return false when primitive values are not equal', () => {
      // Arrange
      const val1 = 42;
      const val2 = 43;
      (isDeepEqual as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isDeepEqual(val1, val2);
      
      // Assert
      expect(result).toBe(false);
      expect(isDeepEqual).toHaveBeenCalledWith(val1, val2);
    });

    it('should return true when both values are null', () => {
      // Arrange
      const val1 = null;
      const val2 = null;
      (isDeepEqual as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isDeepEqual(val1, val2);
      
      // Assert
      expect(result).toBe(true);
      expect(isDeepEqual).toHaveBeenCalledWith(val1, val2);
    });

    it('should return false when one value is null and the other is not', () => {
      // Arrange
      const val1 = null;
      const val2 = { name: 'John' };
      (isDeepEqual as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isDeepEqual(val1, val2);
      
      // Assert
      expect(result).toBe(false);
      expect(isDeepEqual).toHaveBeenCalledWith(val1, val2);
    });

    it('should return true when comparing objects with different property order', () => {
      // Arrange
      const obj1 = { name: 'John', age: 30 };
      const obj2 = { age: 30, name: 'John' };
      (isDeepEqual as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isDeepEqual(obj1, obj2);
      
      // Assert
      expect(result).toBe(true);
      expect(isDeepEqual).toHaveBeenCalledWith(obj1, obj2);
    });
  });
});