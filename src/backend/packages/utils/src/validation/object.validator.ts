/**
 * Object Validator
 * 
 * Provides utilities for validating object structures, checking property existence,
 * validating nested properties, and performing type checking. These validators are
 * essential for ensuring data integrity in complex API payloads, event messages,
 * and data structures used throughout the application.
 */

import { ValidationOptions, ValidationResult } from './index';

/**
 * Options for object validation
 */
export interface ObjectValidationOptions extends ValidationOptions {
  /** Whether to validate nested properties */
  validateNested?: boolean;
  /** Whether to allow additional properties not specified in the schema */
  allowAdditionalProperties?: boolean;
  /** Whether to check property types */
  checkTypes?: boolean;
  /** Custom error message format function */
  formatError?: (property: string, message: string) => string;
}

/**
 * Property validation schema
 */
export interface PropertySchema {
  /** Whether the property is required */
  required?: boolean;
  /** Type of the property */
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'function' | 'any';
  /** Validator function for the property */
  validator?: (value: any) => boolean;
  /** Error message if validation fails */
  message?: string;
  /** Nested schema for object properties */
  properties?: Record<string, PropertySchema>;
  /** Schema for array elements */
  items?: PropertySchema;
}

/**
 * Object schema for validation
 */
export type ObjectSchema = Record<string, PropertySchema>;

/**
 * Result of object validation
 */
export interface ObjectValidationResult extends ValidationResult {
  /** Invalid properties with error messages */
  invalidProperties?: Record<string, string>;
  /** Missing required properties */
  missingProperties?: string[];
}

/**
 * Checks if an object has all required properties
 * 
 * @param obj - The object to check
 * @param requiredProps - Array of required property names
 * @param options - Validation options
 * @returns True if the object has all required properties, false otherwise
 * 
 * @example
 * const user = { id: 1, name: 'John' };
 * const valid = hasRequiredProperties(user, ['id', 'name', 'email']);
 * // Returns false because 'email' is missing
 */
export function hasRequiredProperties(
  obj: Record<string, any>,
  requiredProps: string[],
  options: ValidationOptions = {}
): boolean {
  if (obj === null || obj === undefined) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Object is null or undefined');
    }
    return false;
  }

  const missingProps = requiredProps.filter(prop => !(prop in obj));
  
  if (missingProps.length > 0) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Missing required properties: ${missingProps.join(', ')}`
      );
    }
    return false;
  }
  
  return true;
}

/**
 * Checks if an object has any of the optional properties
 * 
 * @param obj - The object to check
 * @param optionalProps - Array of optional property names
 * @param options - Validation options
 * @returns True if the object has at least one of the optional properties, false otherwise
 * 
 * @example
 * const user = { id: 1, name: 'John' };
 * const valid = hasOptionalProperties(user, ['email', 'phone']);
 * // Returns false because neither 'email' nor 'phone' is present
 */
export function hasOptionalProperties(
  obj: Record<string, any>,
  optionalProps: string[],
  options: ValidationOptions = {}
): boolean {
  if (obj === null || obj === undefined) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Object is null or undefined');
    }
    return false;
  }

  const hasAnyProp = optionalProps.some(prop => prop in obj);
  
  if (!hasAnyProp && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Object should have at least one of these properties: ${optionalProps.join(', ')}`
    );
  }
  
  return hasAnyProp;
}

/**
 * Checks if an object has a nested property using a path expression
 * 
 * @param obj - The object to check
 * @param path - Path to the property (e.g., 'user.address.street')
 * @param options - Validation options
 * @returns True if the nested property exists, false otherwise
 * 
 * @example
 * const user = { profile: { address: { city: 'New York' } } };
 * const hasCity = hasNestedProperty(user, 'profile.address.city');
 * // Returns true
 */
export function hasNestedProperty(
  obj: Record<string, any>,
  path: string,
  options: ValidationOptions = {}
): boolean {
  if (obj === null || obj === undefined) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Object is null or undefined');
    }
    return false;
  }

  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || !(part in current)) {
      if (options.throwOnError) {
        throw new Error(
          options.errorMessage || 
          `Property path '${path}' does not exist on object`
        );
      }
      return false;
    }
    current = current[part];
  }
  
  return true;
}

/**
 * Gets a nested property value using a path expression
 * 
 * @param obj - The object to get the property from
 * @param path - Path to the property (e.g., 'user.address.street')
 * @param defaultValue - Default value to return if the property doesn't exist
 * @returns The property value or the default value if not found
 * 
 * @example
 * const user = { profile: { address: { city: 'New York' } } };
 * const city = getNestedProperty(user, 'profile.address.city', 'Unknown');
 * // Returns 'New York'
 */
export function getNestedProperty<T>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T
): T | undefined {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || !(part in current)) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current as T;
}

/**
 * Validates a nested property using a custom validator function
 * 
 * @param obj - The object to validate
 * @param path - Path to the property (e.g., 'user.address.street')
 * @param validator - Validation function that returns true for valid values
 * @param options - Validation options
 * @returns True if the property is valid, false otherwise
 * 
 * @example
 * const user = { profile: { age: 25 } };
 * const isValidAge = validateNestedProperty(
 *   user, 
 *   'profile.age', 
 *   age => typeof age === 'number' && age >= 18
 * );
 * // Returns true
 */
export function validateNestedProperty(
  obj: Record<string, any>,
  path: string,
  validator: (value: any) => boolean,
  options: ValidationOptions = {}
): boolean {
  if (obj === null || obj === undefined) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Object is null or undefined');
    }
    return false;
  }

  if (!hasNestedProperty(obj, path, { throwOnError: false })) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Property path '${path}' does not exist on object`
      );
    }
    return false;
  }
  
  const value = getNestedProperty(obj, path);
  const isValid = validator(value);
  
  if (!isValid && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Property at path '${path}' failed validation`
    );
  }
  
  return isValid;
}

/**
 * Checks if a value is of a specific type
 * 
 * @param value - The value to check
 * @param type - Expected type of the value
 * @param options - Validation options
 * @returns True if the value is of the specified type, false otherwise
 * 
 * @example
 * const isNum = isOfType(42, 'number');
 * // Returns true
 */
export function isOfType(
  value: any,
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'function' | 'null' | 'undefined',
  options: ValidationOptions = {}
): boolean {
  if (value === null) {
    const isValid = type === 'null';
    if (!isValid && options.throwOnError) {
      throw new Error(options.errorMessage || `Expected ${type}, got null`);
    }
    return isValid;
  }
  
  if (value === undefined) {
    const isValid = type === 'undefined';
    if (!isValid && options.throwOnError) {
      throw new Error(options.errorMessage || `Expected ${type}, got undefined`);
    }
    return isValid;
  }
  
  let isValid = false;
  
  switch (type) {
    case 'string':
      isValid = typeof value === 'string';
      break;
    case 'number':
      isValid = typeof value === 'number' && !isNaN(value);
      break;
    case 'boolean':
      isValid = typeof value === 'boolean';
      break;
    case 'object':
      isValid = typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
      break;
    case 'array':
      isValid = Array.isArray(value);
      break;
    case 'date':
      isValid = value instanceof Date && !isNaN(value.getTime());
      break;
    case 'function':
      isValid = typeof value === 'function';
      break;
    default:
      isValid = false;
  }
  
  if (!isValid && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Expected ${type}, got ${Array.isArray(value) ? 'array' : typeof value}`
    );
  }
  
  return isValid;
}

/**
 * Checks if a value is an instance of a specific class
 * 
 * @param value - The value to check
 * @param constructor - Constructor function to check against
 * @param options - Validation options
 * @returns True if the value is an instance of the specified class, false otherwise
 * 
 * @example
 * class User { name: string; }
 * const user = new User();
 * const isUser = isInstanceOf(user, User);
 * // Returns true
 */
export function isInstanceOf<T>(
  value: any,
  constructor: new (...args: any[]) => T,
  options: ValidationOptions = {}
): value is T {
  const isValid = value instanceof constructor;
  
  if (!isValid && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Expected instance of ${constructor.name}, got ${value?.constructor?.name || typeof value}`
    );
  }
  
  return isValid;
}

/**
 * Checks if an object has a specific shape (properties and types)
 * 
 * @param obj - The object to check
 * @param schema - Schema describing the expected shape
 * @param options - Validation options
 * @returns True if the object matches the schema, false otherwise
 * 
 * @example
 * const user = { id: 1, name: 'John', active: true };
 * const schema = {
 *   id: { type: 'number', required: true },
 *   name: { type: 'string', required: true },
 *   active: { type: 'boolean' }
 * };
 * const isValid = isObjectWithShape(user, schema);
 * // Returns true
 */
export function isObjectWithShape(
  obj: Record<string, any>,
  schema: ObjectSchema,
  options: ObjectValidationOptions = {}
): boolean {
  if (obj === null || obj === undefined) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Object is null or undefined');
    }
    return false;
  }

  // Check required properties
  const requiredProps = Object.entries(schema)
    .filter(([_, propSchema]) => propSchema.required)
    .map(([prop]) => prop);
  
  if (!hasRequiredProperties(obj, requiredProps, { throwOnError: false })) {
    if (options.throwOnError) {
      const missingProps = requiredProps.filter(prop => !(prop in obj));
      throw new Error(
        options.errorMessage || 
        `Missing required properties: ${missingProps.join(', ')}`
      );
    }
    return false;
  }
  
  // Check property types and run validators
  for (const [prop, propSchema] of Object.entries(schema)) {
    if (prop in obj) {
      const value = obj[prop];
      
      // Check type if specified and checkTypes is enabled
      if (propSchema.type && options.checkTypes !== false) {
        if (!isOfType(value, propSchema.type, { throwOnError: false })) {
          if (options.throwOnError) {
            const errorMsg = propSchema.message || 
              `Property '${prop}' should be of type '${propSchema.type}'`;
            throw new Error(options.formatError?.(prop, errorMsg) || errorMsg);
          }
          return false;
        }
      }
      
      // Run custom validator if provided
      if (propSchema.validator && !propSchema.validator(value)) {
        if (options.throwOnError) {
          const errorMsg = propSchema.message || 
            `Property '${prop}' failed validation`;
          throw new Error(options.formatError?.(prop, errorMsg) || errorMsg);
        }
        return false;
      }
      
      // Validate nested object properties if specified
      if (propSchema.properties && 
          options.validateNested !== false && 
          isOfType(value, 'object', { throwOnError: false })) {
        if (!isObjectWithShape(value, propSchema.properties, {
          ...options,
          throwOnError: false
        })) {
          if (options.throwOnError) {
            const errorMsg = propSchema.message || 
              `Nested object at '${prop}' has invalid structure`;
            throw new Error(options.formatError?.(prop, errorMsg) || errorMsg);
          }
          return false;
        }
      }
      
      // Validate array items if specified
      if (propSchema.items && 
          isOfType(value, 'array', { throwOnError: false })) {
        const array = value as any[];
        const invalidItem = array.findIndex(item => {
          if (propSchema.items?.type && options.checkTypes !== false) {
            if (!isOfType(item, propSchema.items.type, { throwOnError: false })) {
              return true;
            }
          }
          
          if (propSchema.items?.validator && !propSchema.items.validator(item)) {
            return true;
          }
          
          if (propSchema.items?.properties && 
              options.validateNested !== false && 
              isOfType(item, 'object', { throwOnError: false })) {
            return !isObjectWithShape(item, propSchema.items.properties, {
              ...options,
              throwOnError: false
            });
          }
          
          return false;
        });
        
        if (invalidItem !== -1) {
          if (options.throwOnError) {
            const errorMsg = propSchema.message || 
              `Array item at index ${invalidItem} in '${prop}' is invalid`;
            throw new Error(options.formatError?.(prop, errorMsg) || errorMsg);
          }
          return false;
        }
      }
    }
  }
  
  // Check for additional properties if not allowed
  if (options.allowAdditionalProperties === false) {
    const schemaProps = Object.keys(schema);
    const additionalProps = Object.keys(obj).filter(prop => !schemaProps.includes(prop));
    
    if (additionalProps.length > 0) {
      if (options.throwOnError) {
        throw new Error(
          options.errorMessage || 
          `Object contains additional properties: ${additionalProps.join(', ')}`
        );
      }
      return false;
    }
  }
  
  return true;
}

/**
 * Validates each element in an array property
 * 
 * @param obj - The object containing the array property
 * @param property - Name of the array property
 * @param validator - Validation function for array elements
 * @param options - Validation options
 * @returns True if all array elements are valid, false otherwise
 * 
 * @example
 * const data = { tags: ['javascript', 'typescript', 'node'] };
 * const isValid = validateArrayProperty(
 *   data,
 *   'tags',
 *   tag => typeof tag === 'string' && tag.length > 0
 * );
 * // Returns true
 */
export function validateArrayProperty(
  obj: Record<string, any>,
  property: string,
  validator: (item: any, index: number) => boolean,
  options: ValidationOptions = {}
): boolean {
  if (obj === null || obj === undefined) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Object is null or undefined');
    }
    return false;
  }

  if (!(property in obj)) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Property '${property}' does not exist on object`
      );
    }
    return false;
  }
  
  const value = obj[property];
  
  if (!Array.isArray(value)) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Property '${property}' is not an array`
      );
    }
    return false;
  }
  
  const invalidIndex = value.findIndex((item, index) => !validator(item, index));
  
  if (invalidIndex !== -1) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Array element at index ${invalidIndex} in property '${property}' failed validation`
      );
    }
    return false;
  }
  
  return true;
}

/**
 * Checks if a property is an array of a specific type
 * 
 * @param obj - The object containing the array property
 * @param property - Name of the array property
 * @param itemType - Expected type of array elements
 * @param options - Validation options
 * @returns True if the property is an array of the specified type, false otherwise
 * 
 * @example
 * const data = { scores: [85, 90, 78] };
 * const isValid = hasArrayOfType(data, 'scores', 'number');
 * // Returns true
 */
export function hasArrayOfType(
  obj: Record<string, any>,
  property: string,
  itemType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'function',
  options: ValidationOptions = {}
): boolean {
  return validateArrayProperty(
    obj,
    property,
    item => isOfType(item, itemType, { throwOnError: false }),
    options
  );
}

/**
 * Validates an object against a schema
 * 
 * @param obj - The object to validate
 * @param schema - Schema describing the expected structure
 * @param options - Validation options
 * @returns Validation result with details about invalid properties
 * 
 * @example
 * const user = { id: 1, name: 'John', email: 'invalid' };
 * const schema = {
 *   id: { type: 'number', required: true },
 *   name: { type: 'string', required: true },
 *   email: { 
 *     type: 'string', 
 *     required: true,
 *     validator: email => /^[^@]+@[^@]+\.[^@]+$/.test(email),
 *     message: 'Invalid email format'
 *   }
 * };
 * const result = validateObjectStructure(user, schema);
 * // Returns { valid: false, invalidProperties: { email: 'Invalid email format' } }
 */
export function validateObjectStructure(
  obj: Record<string, any>,
  schema: ObjectSchema,
  options: ObjectValidationOptions = {}
): ObjectValidationResult {
  if (obj === null || obj === undefined) {
    return {
      valid: false,
      message: options.errorMessage || 'Object is null or undefined',
      value: obj
    };
  }

  const result: ObjectValidationResult = {
    valid: true,
    value: obj,
    invalidProperties: {},
    missingProperties: []
  };
  
  // Check required properties
  const requiredProps = Object.entries(schema)
    .filter(([_, propSchema]) => propSchema.required)
    .map(([prop]) => prop);
  
  const missingProps = requiredProps.filter(prop => !(prop in obj));
  
  if (missingProps.length > 0) {
    result.valid = false;
    result.missingProperties = missingProps;
    result.message = options.errorMessage || 
      `Missing required properties: ${missingProps.join(', ')}`;
  }
  
  // Check property types and run validators
  for (const [prop, propSchema] of Object.entries(schema)) {
    if (prop in obj) {
      const value = obj[prop];
      let propValid = true;
      let errorMsg = '';
      
      // Check type if specified and checkTypes is enabled
      if (propSchema.type && options.checkTypes !== false) {
        if (!isOfType(value, propSchema.type, { throwOnError: false })) {
          propValid = false;
          errorMsg = propSchema.message || 
            `Property '${prop}' should be of type '${propSchema.type}'`;
        }
      }
      
      // Run custom validator if provided
      if (propValid && propSchema.validator && !propSchema.validator(value)) {
        propValid = false;
        errorMsg = propSchema.message || 
          `Property '${prop}' failed validation`;
      }
      
      // Validate nested object properties if specified
      if (propValid && 
          propSchema.properties && 
          options.validateNested !== false && 
          isOfType(value, 'object', { throwOnError: false })) {
        const nestedResult = validateObjectStructure(value, propSchema.properties, {
          ...options,
          throwOnError: false
        });
        
        if (!nestedResult.valid) {
          propValid = false;
          errorMsg = propSchema.message || 
            `Nested object at '${prop}' has invalid structure`;
          
          // Add nested invalid properties with prefixed keys
          if (nestedResult.invalidProperties) {
            for (const [nestedProp, nestedMsg] of Object.entries(nestedResult.invalidProperties)) {
              result.invalidProperties![`${prop}.${nestedProp}`] = nestedMsg;
            }
          }
        }
      }
      
      // Validate array items if specified
      if (propValid && 
          propSchema.items && 
          isOfType(value, 'array', { throwOnError: false })) {
        const array = value as any[];
        const invalidItems: number[] = [];
        
        array.forEach((item, index) => {
          let itemValid = true;
          
          if (propSchema.items?.type && options.checkTypes !== false) {
            if (!isOfType(item, propSchema.items.type, { throwOnError: false })) {
              itemValid = false;
            }
          }
          
          if (itemValid && propSchema.items?.validator && !propSchema.items.validator(item)) {
            itemValid = false;
          }
          
          if (itemValid && 
              propSchema.items?.properties && 
              options.validateNested !== false && 
              isOfType(item, 'object', { throwOnError: false })) {
            const itemResult = validateObjectStructure(item, propSchema.items.properties, {
              ...options,
              throwOnError: false
            });
            
            if (!itemResult.valid) {
              itemValid = false;
              
              // Add nested invalid properties with array index
              if (itemResult.invalidProperties) {
                for (const [itemProp, itemMsg] of Object.entries(itemResult.invalidProperties)) {
                  result.invalidProperties![`${prop}[${index}].${itemProp}`] = itemMsg;
                }
              }
            }
          }
          
          if (!itemValid) {
            invalidItems.push(index);
          }
        });
        
        if (invalidItems.length > 0) {
          propValid = false;
          errorMsg = propSchema.message || 
            `Array items at indices [${invalidItems.join(', ')}] in '${prop}' are invalid`;
        }
      }
      
      if (!propValid) {
        result.valid = false;
        result.invalidProperties![prop] = options.formatError?.(prop, errorMsg) || errorMsg;
      }
    }
  }
  
  // Check for additional properties if not allowed
  if (options.allowAdditionalProperties === false) {
    const schemaProps = Object.keys(schema);
    const additionalProps = Object.keys(obj).filter(prop => !schemaProps.includes(prop));
    
    if (additionalProps.length > 0) {
      result.valid = false;
      result.message = options.errorMessage || 
        `Object contains additional properties: ${additionalProps.join(', ')}`;
    }
  }
  
  if (!result.valid && !result.message) {
    result.message = options.errorMessage || 'Object validation failed';
  }
  
  return result;
}

/**
 * Validates specific properties of an object
 * 
 * @param obj - The object to validate
 * @param propertyValidators - Map of property names to validator functions
 * @param options - Validation options
 * @returns Validation result with details about invalid properties
 * 
 * @example
 * const user = { name: 'John', age: 17 };
 * const result = validateObjectProperties(user, {
 *   name: value => typeof value === 'string' && value.length > 0,
 *   age: value => typeof value === 'number' && value >= 18
 * });
 * // Returns { valid: false, invalidProperties: { age: 'Property \'age\' failed validation' } }
 */
export function validateObjectProperties(
  obj: Record<string, any>,
  propertyValidators: Record<string, (value: any) => boolean>,
  options: ObjectValidationOptions = {}
): ObjectValidationResult {
  if (obj === null || obj === undefined) {
    return {
      valid: false,
      message: options.errorMessage || 'Object is null or undefined',
      value: obj
    };
  }

  const result: ObjectValidationResult = {
    valid: true,
    value: obj,
    invalidProperties: {}
  };
  
  for (const [prop, validator] of Object.entries(propertyValidators)) {
    if (prop in obj) {
      const value = obj[prop];
      
      if (!validator(value)) {
        result.valid = false;
        const errorMsg = `Property '${prop}' failed validation`;
        result.invalidProperties![prop] = options.formatError?.(prop, errorMsg) || errorMsg;
      }
    } else {
      result.valid = false;
      const errorMsg = `Property '${prop}' does not exist on object`;
      result.invalidProperties![prop] = options.formatError?.(prop, errorMsg) || errorMsg;
    }
  }
  
  if (!result.valid && !result.message) {
    result.message = options.errorMessage || 'Object validation failed';
  }
  
  return result;
}

/**
 * Checks if two objects are deeply equal
 * 
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @param options - Comparison options
 * @returns True if the objects are deeply equal, false otherwise
 * 
 * @example
 * const user1 = { id: 1, profile: { name: 'John' } };
 * const user2 = { id: 1, profile: { name: 'John' } };
 * const equal = areObjectsEqual(user1, user2);
 * // Returns true
 */
export function areObjectsEqual(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
  options: {
    /** Properties to ignore during comparison */
    ignoreProperties?: string[];
    /** Whether to ignore property order */
    ignoreOrder?: boolean;
  } = {}
): boolean {
  if (obj1 === obj2) {
    return true;
  }
  
  if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
    return false;
  }
  
  const ignoreProps = options.ignoreProperties || [];
  
  const keys1 = Object.keys(obj1).filter(key => !ignoreProps.includes(key));
  const keys2 = Object.keys(obj2).filter(key => !ignoreProps.includes(key));
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  if (!options.ignoreOrder && keys1.join(',') !== keys2.join(',')) {
    return false;
  }
  
  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }
    
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    if (isOfType(val1, 'object', { throwOnError: false }) && 
        isOfType(val2, 'object', { throwOnError: false })) {
      if (!areObjectsEqual(val1, val2, options)) {
        return false;
      }
    } else if (Array.isArray(val1) && Array.isArray(val2)) {
      if (!areArraysEqual(val1, val2, options)) {
        return false;
      }
    } else if (val1 instanceof Date && val2 instanceof Date) {
      if (val1.getTime() !== val2.getTime()) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if two arrays are deeply equal
 * 
 * @param arr1 - First array to compare
 * @param arr2 - Second array to compare
 * @param options - Comparison options
 * @returns True if the arrays are deeply equal, false otherwise
 * 
 * @example
 * const tags1 = ['javascript', { version: 'ES6' }];
 * const tags2 = ['javascript', { version: 'ES6' }];
 * const equal = areArraysEqual(tags1, tags2);
 * // Returns true
 */
export function areArraysEqual(
  arr1: any[],
  arr2: any[],
  options: {
    /** Whether to ignore element order */
    ignoreOrder?: boolean;
    /** Properties to ignore during object comparison */
    ignoreProperties?: string[];
  } = {}
): boolean {
  if (arr1 === arr2) {
    return true;
  }
  
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return false;
  }
  
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  if (options.ignoreOrder) {
    // For primitive arrays, sort and compare
    if (arr1.every(item => typeof item !== 'object' || item === null)) {
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      
      for (let i = 0; i < sorted1.length; i++) {
        if (sorted1[i] !== sorted2[i]) {
          return false;
        }
      }
      
      return true;
    }
    
    // For arrays with objects, check if each item in arr1 has a matching item in arr2
    return arr1.every(item1 => {
      return arr2.some(item2 => {
        if (isOfType(item1, 'object', { throwOnError: false }) && 
            isOfType(item2, 'object', { throwOnError: false })) {
          return areObjectsEqual(item1, item2, options);
        }
        if (Array.isArray(item1) && Array.isArray(item2)) {
          return areArraysEqual(item1, item2, options);
        }
        if (item1 instanceof Date && item2 instanceof Date) {
          return item1.getTime() === item2.getTime();
        }
        return item1 === item2;
      });
    });
  }
  
  // If order matters, compare elements in order
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];
    
    if (isOfType(item1, 'object', { throwOnError: false }) && 
        isOfType(item2, 'object', { throwOnError: false })) {
      if (!areObjectsEqual(item1, item2, options)) {
        return false;
      }
    } else if (Array.isArray(item1) && Array.isArray(item2)) {
      if (!areArraysEqual(item1, item2, options)) {
        return false;
      }
    } else if (item1 instanceof Date && item2 instanceof Date) {
      if (item1.getTime() !== item2.getTime()) {
        return false;
      }
    } else if (item1 !== item2) {
      return false;
    }
  }
  
  return true;
}

/**
 * Creates a validator function for objects based on a schema
 * 
 * @param schema - Schema describing the expected structure
 * @param options - Validation options
 * @returns A validator function that checks objects against the schema
 * 
 * @example
 * const userValidator = createObjectValidator({
 *   id: { type: 'number', required: true },
 *   name: { type: 'string', required: true },
 *   email: { type: 'string', validator: email => /^[^@]+@[^@]+\.[^@]+$/.test(email) }
 * });
 * 
 * const isValid = userValidator({ id: 1, name: 'John', email: 'john@example.com' });
 * // Returns true
 */
export function createObjectValidator(
  schema: ObjectSchema,
  options: ObjectValidationOptions = {}
): (obj: Record<string, any>) => boolean {
  return (obj: Record<string, any>) => {
    return isObjectWithShape(obj, schema, { ...options, throwOnError: false });
  };
}

/**
 * Creates a detailed validator function for objects based on a schema
 * 
 * @param schema - Schema describing the expected structure
 * @param options - Validation options
 * @returns A validator function that returns detailed validation results
 * 
 * @example
 * const validateUser = createDetailedObjectValidator({
 *   id: { type: 'number', required: true },
 *   name: { type: 'string', required: true },
 *   email: { type: 'string', validator: email => /^[^@]+@[^@]+\.[^@]+$/.test(email) }
 * });
 * 
 * const result = validateUser({ id: 1, name: 'John', email: 'invalid' });
 * // Returns detailed validation result with information about the invalid email
 */
export function createDetailedObjectValidator(
  schema: ObjectSchema,
  options: ObjectValidationOptions = {}
): (obj: Record<string, any>) => ObjectValidationResult {
  return (obj: Record<string, any>) => {
    return validateObjectStructure(obj, schema, options);
  };
}