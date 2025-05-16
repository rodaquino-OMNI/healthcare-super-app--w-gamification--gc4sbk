/**
 * Object validation utilities for validating object structures, checking property existence,
 * validating nested properties, and performing type checking.
 * 
 * These validators are essential for ensuring data integrity in complex API payloads,
 * event messages, and data structures used throughout the application.
 * 
 * @packageDocumentation
 */

import { isArray, isFunction, isObject, isString } from '../type/guard';
import { hasProperty, hasPropertyOfType } from '../type/predicate';
import { ValidationError, ValidationOptions, ValidationResult } from './index';

/**
 * Options for property validation.
 */
export interface PropertyValidationOptions extends ValidationOptions {
  /** Whether to allow additional properties not specified in the required or optional lists */
  allowAdditionalProperties?: boolean;
  /** Custom error message for missing required properties */
  missingPropertyMessage?: string;
  /** Custom error message for invalid property types */
  invalidPropertyMessage?: string;
}

/**
 * Property definition for object structure validation.
 */
export interface PropertyDefinition {
  /** Property name */
  name: string;
  /** Whether the property is required */
  required: boolean;
  /** Validator function for the property */
  validator?: (value: any) => boolean;
  /** Custom error message for validation failure */
  errorMessage?: string;
}

/**
 * Type definition for nested property path.
 * Can be a dot-notation string (e.g., 'user.profile.email') or an array of property names.
 */
export type PropertyPath = string | string[];

/**
 * Checks if an object has all the required properties.
 * 
 * @param obj - The object to validate
 * @param requiredProps - Array of required property names
 * @param options - Validation options
 * @returns True if the object has all required properties, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if user object has required properties
 * if (hasRequiredProperties(user, ['id', 'name', 'email'])) {
 *   // Process user
 * } else {
 *   // Handle validation error
 * }
 * ```
 */
export function hasRequiredProperties(
  obj: unknown,
  requiredProps: string[],
  options: ValidationOptions = {}
): boolean {
  if (!isObject(obj)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Value is not an object');
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
 * Validates an object against a set of required and optional properties.
 * 
 * @param obj - The object to validate
 * @param requiredProps - Array of required property names
 * @param optionalProps - Array of optional property names
 * @param options - Property validation options
 * @returns Validation result with success status and any errors
 * 
 * @example
 * ```typescript
 * // Validate user object
 * const result = validateProperties(
 *   user,
 *   ['id', 'name', 'email'], // required
 *   ['phone', 'address'],    // optional
 *   { allowAdditionalProperties: false }
 * );
 * 
 * if (result.success) {
 *   // Process valid user
 * } else {
 *   // Handle validation errors
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateProperties(
  obj: unknown,
  requiredProps: string[] = [],
  optionalProps: string[] = [],
  options: PropertyValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isObject(obj)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Value is not an object',
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  // Check required properties
  const missingProps = requiredProps.filter(prop => !(prop in obj));
  if (missingProps.length > 0) {
    missingProps.forEach(prop => {
      errors.push({
        field: prop,
        message: options.missingPropertyMessage || `Property is required`,
        code: 'REQUIRED',
        context: options.context
      });
    });
  }
  
  // Check for additional properties if not allowed
  if (options.allowAdditionalProperties === false) {
    const allowedProps = [...requiredProps, ...optionalProps];
    const additionalProps = Object.keys(obj).filter(
      prop => !allowedProps.includes(prop)
    );
    
    if (additionalProps.length > 0) {
      additionalProps.forEach(prop => {
        errors.push({
          field: prop,
          message: `Property is not allowed`,
          code: 'ADDITIONAL_PROPERTY',
          context: options.context
        });
      });
    }
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: obj
  };
}

/**
 * Validates that an object has a property of a specific type.
 * 
 * @param obj - The object to validate
 * @param prop - The property name to check
 * @param type - The expected type ('string', 'number', 'boolean', 'object', 'array', 'function')
 * @param options - Validation options
 * @returns True if the property exists and is of the expected type, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if user has a string email property
 * if (hasPropertyOfType(user, 'email', 'string')) {
 *   // Process user email
 * } else {
 *   // Handle validation error
 * }
 * ```
 */
export function hasPropertyOfType(
  obj: unknown,
  prop: string,
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function',
  options: ValidationOptions = {}
): boolean {
  if (!isObject(obj)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Value is not an object');
    }
    return false;
  }
  
  if (!(prop in obj)) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Property '${prop}' does not exist on object`
      );
    }
    return false;
  }
  
  const value = obj[prop];
  let isValidType = false;
  
  switch (type) {
    case 'string':
      isValidType = typeof value === 'string';
      break;
    case 'number':
      isValidType = typeof value === 'number';
      break;
    case 'boolean':
      isValidType = typeof value === 'boolean';
      break;
    case 'object':
      isValidType = isObject(value);
      break;
    case 'array':
      isValidType = isArray(value);
      break;
    case 'function':
      isValidType = isFunction(value);
      break;
  }
  
  if (!isValidType && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Property '${prop}' is not of type '${type}'`
    );
  }
  
  return isValidType;
}

/**
 * Validates that an object property satisfies a custom validator function.
 * 
 * @param obj - The object to validate
 * @param prop - The property name to check
 * @param validator - The validator function to apply to the property value
 * @param options - Validation options
 * @returns True if the property exists and passes validation, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if user has a valid email
 * if (hasValidProperty(user, 'email', value => isValidEmail(value))) {
 *   // Process user with valid email
 * } else {
 *   // Handle validation error
 * }
 * ```
 */
export function hasValidProperty(
  obj: unknown,
  prop: string,
  validator: (value: any) => boolean,
  options: ValidationOptions = {}
): boolean {
  if (!isObject(obj)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Value is not an object');
    }
    return false;
  }
  
  if (!(prop in obj)) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Property '${prop}' does not exist on object`
      );
    }
    return false;
  }
  
  const value = obj[prop];
  const isValid = validator(value);
  
  if (!isValid && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Property '${prop}' failed validation`
    );
  }
  
  return isValid;
}

/**
 * Gets a nested property value from an object using a path expression.
 * 
 * @param obj - The object to get the property from
 * @param path - The property path (dot notation string or array of property names)
 * @returns The property value or undefined if not found
 * 
 * @example
 * ```typescript
 * // Get nested property using dot notation
 * const email = getNestedProperty(user, 'profile.contact.email');
 * 
 * // Get nested property using array path
 * const email = getNestedProperty(user, ['profile', 'contact', 'email']);
 * ```
 */
export function getNestedProperty(
  obj: unknown,
  path: PropertyPath
): any {
  if (!isObject(obj)) {
    return undefined;
  }
  
  const parts = isArray(path) ? path : path.split('.');
  let current: any = obj;
  
  for (const part of parts) {
    if (!isObject(current) || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Checks if a nested property exists in an object.
 * 
 * @param obj - The object to check
 * @param path - The property path (dot notation string or array of property names)
 * @param options - Validation options
 * @returns True if the nested property exists, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if nested property exists using dot notation
 * if (hasNestedProperty(user, 'profile.contact.email')) {
 *   // Process user with email
 * }
 * ```
 */
export function hasNestedProperty(
  obj: unknown,
  path: PropertyPath,
  options: ValidationOptions = {}
): boolean {
  if (!isObject(obj)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Value is not an object');
    }
    return false;
  }
  
  const parts = isArray(path) ? path : path.split('.');
  let current: any = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (!isObject(current) || !(part in current)) {
      if (options.throwOnError) {
        throw new Error(
          options.errorMessage || 
          `Nested property '${parts.slice(0, i + 1).join('.')}' does not exist`
        );
      }
      return false;
    }
    
    current = current[part];
  }
  
  return true;
}

/**
 * Validates that a nested property satisfies a custom validator function.
 * 
 * @param obj - The object to validate
 * @param path - The property path (dot notation string or array of property names)
 * @param validator - The validator function to apply to the property value
 * @param options - Validation options
 * @returns True if the nested property exists and passes validation, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if user has a valid email in nested property
 * if (hasValidNestedProperty(
 *   user,
 *   'profile.contact.email',
 *   value => isValidEmail(value)
 * )) {
 *   // Process user with valid email
 * }
 * ```
 */
export function hasValidNestedProperty(
  obj: unknown,
  path: PropertyPath,
  validator: (value: any) => boolean,
  options: ValidationOptions = {}
): boolean {
  if (!isObject(obj)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Value is not an object');
    }
    return false;
  }
  
  const parts = isArray(path) ? path : path.split('.');
  let current: any = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (!isObject(current) || !(part in current)) {
      if (options.throwOnError) {
        throw new Error(
          options.errorMessage || 
          `Nested property '${parts.slice(0, i + 1).join('.')}' does not exist`
        );
      }
      return false;
    }
    
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  
  if (!isObject(current) || !(lastPart in current)) {
    if (options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Nested property '${parts.join('.')}' does not exist`
      );
    }
    return false;
  }
  
  const value = current[lastPart];
  const isValid = validator(value);
  
  if (!isValid && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Nested property '${parts.join('.')}' failed validation`
    );
  }
  
  return isValid;
}

/**
 * Validates an array property where each element must satisfy a validator function.
 * 
 * @param obj - The object to validate
 * @param prop - The property name of the array
 * @param elementValidator - The validator function to apply to each array element
 * @param options - Validation options
 * @returns Validation result with success status and any errors
 * 
 * @example
 * ```typescript
 * // Validate that all items in the 'tags' array are non-empty strings
 * const result = validateArrayProperty(
 *   post,
 *   'tags',
 *   tag => typeof tag === 'string' && tag.trim().length > 0
 * );
 * 
 * if (result.success) {
 *   // Process post with valid tags
 * } else {
 *   // Handle validation errors
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateArrayProperty(
  obj: unknown,
  prop: string,
  elementValidator: (value: any, index: number) => boolean,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isObject(obj)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Value is not an object',
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  if (!(prop in obj)) {
    return {
      success: false,
      errors: [{
        field: prop,
        message: options.errorMessage || `Property '${prop}' does not exist`,
        code: 'MISSING_PROPERTY',
        context: options.context
      }]
    };
  }
  
  const value = obj[prop];
  
  if (!isArray(value)) {
    return {
      success: false,
      errors: [{
        field: prop,
        message: options.errorMessage || `Property '${prop}' is not an array`,
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  value.forEach((item, index) => {
    if (!elementValidator(item, index)) {
      errors.push({
        field: `${prop}[${index}]`,
        message: options.errorMessage || `Array element at index ${index} failed validation`,
        code: 'INVALID_ELEMENT',
        context: options.context
      });
    }
  });
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: obj
  };
}

/**
 * Validates an object against a schema of property definitions.
 * 
 * @param obj - The object to validate
 * @param schema - Array of property definitions
 * @param options - Property validation options
 * @returns Validation result with success status and any errors
 * 
 * @example
 * ```typescript
 * // Define schema for user object
 * const userSchema: PropertyDefinition[] = [
 *   { name: 'id', required: true },
 *   { name: 'name', required: true, validator: value => typeof value === 'string' && value.length > 0 },
 *   { name: 'email', required: true, validator: isValidEmail, errorMessage: 'Invalid email format' },
 *   { name: 'age', required: false, validator: value => typeof value === 'number' && value >= 18 }
 * ];
 * 
 * // Validate user against schema
 * const result = validateObjectSchema(user, userSchema);
 * 
 * if (result.success) {
 *   // Process valid user
 * } else {
 *   // Handle validation errors
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateObjectSchema(
  obj: unknown,
  schema: PropertyDefinition[],
  options: PropertyValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isObject(obj)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Value is not an object',
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  // Check required properties and validate all properties
  for (const propDef of schema) {
    const { name, required, validator, errorMessage } = propDef;
    
    // Check if required property exists
    if (required && !(name in obj)) {
      errors.push({
        field: name,
        message: options.missingPropertyMessage || errorMessage || `Property is required`,
        code: 'REQUIRED',
        context: options.context
      });
      continue;
    }
    
    // Skip validation if property doesn't exist and is not required
    if (!(name in obj)) {
      continue;
    }
    
    // Validate property if validator is provided
    if (validator && !validator(obj[name])) {
      errors.push({
        field: name,
        message: errorMessage || options.invalidPropertyMessage || `Property failed validation`,
        code: 'INVALID_VALUE',
        context: options.context
      });
    }
  }
  
  // Check for additional properties if not allowed
  if (options.allowAdditionalProperties === false) {
    const schemaProps = schema.map(prop => prop.name);
    const additionalProps = Object.keys(obj).filter(
      prop => !schemaProps.includes(prop)
    );
    
    if (additionalProps.length > 0) {
      additionalProps.forEach(prop => {
        errors.push({
          field: prop,
          message: `Property is not allowed`,
          code: 'ADDITIONAL_PROPERTY',
          context: options.context
        });
      });
    }
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: obj
  };
}

/**
 * Checks if a value is of a specific type using TypeScript integration.
 * 
 * @param value - The value to check
 * @param type - The expected type name
 * @param options - Validation options
 * @returns True if the value is of the expected type, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if value is a string
 * if (isValidType(value, 'string')) {
 *   // Process string value
 * }
 * 
 * // Check if value is a Date
 * if (isValidType(value, 'Date')) {
 *   // Process Date value
 * }
 * ```
 */
export function isValidType(
  value: unknown,
  type: string,
  options: ValidationOptions = {}
): boolean {
  let isValid = false;
  
  switch (type.toLowerCase()) {
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
      isValid = isObject(value);
      break;
    case 'array':
      isValid = isArray(value);
      break;
    case 'function':
      isValid = isFunction(value);
      break;
    case 'date':
      isValid = value instanceof Date && !isNaN(value.getTime());
      break;
    case 'null':
      isValid = value === null;
      break;
    case 'undefined':
      isValid = value === undefined;
      break;
    default:
      // For custom classes, check instanceof if available in global scope
      try {
        const globalObj = typeof window !== 'undefined' ? window : global;
        const constructor = globalObj[type];
        if (isFunction(constructor)) {
          isValid = value instanceof constructor;
        } else {
          isValid = false;
        }
      } catch {
        isValid = false;
      }
  }
  
  if (!isValid && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Value is not of type '${type}'`
    );
  }
  
  return isValid;
}

/**
 * Performs a deep equality check between two objects.
 * 
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @param options - Additional comparison options
 * @returns True if objects are deeply equal, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if two objects are deeply equal
 * if (isDeepEqual(obj1, obj2)) {
 *   console.log('Objects are equal');
 * } else {
 *   console.log('Objects are different');
 * }
 * 
 * // Check with custom options
 * if (isDeepEqual(obj1, obj2, { ignoreUndefined: true })) {
 *   console.log('Objects are equal (ignoring undefined values)');
 * }
 * ```
 */
export function isDeepEqual(
  obj1: unknown,
  obj2: unknown,
  options: {
    /** Whether to ignore undefined values when comparing */
    ignoreUndefined?: boolean;
    /** Whether to ignore object property order when comparing */
    ignoreOrder?: boolean;
  } = {}
): boolean {
  // Handle simple cases
  if (obj1 === obj2) {
    return true;
  }
  
  // If either is null/undefined (and they're not equal), they're not equal
  if (obj1 == null || obj2 == null) {
    return false;
  }
  
  // If types don't match, they're not equal
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  
  // Handle dates
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  // Handle arrays
  if (isArray(obj1) && isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    
    if (options.ignoreOrder) {
      // Sort arrays and compare (only works for primitive values)
      try {
        const sorted1 = [...obj1].sort();
        const sorted2 = [...obj2].sort();
        
        for (let i = 0; i < sorted1.length; i++) {
          if (!isDeepEqual(sorted1[i], sorted2[i], options)) {
            return false;
          }
        }
        
        return true;
      } catch {
        // Fall back to ordered comparison if sorting fails
      }
    }
    
    // Compare arrays in order
    for (let i = 0; i < obj1.length; i++) {
      if (!isDeepEqual(obj1[i], obj2[i], options)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Handle objects
  if (isObject(obj1) && isObject(obj2)) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // Filter out undefined values if ignoreUndefined is true
    const filteredKeys1 = options.ignoreUndefined
      ? keys1.filter(key => obj1[key] !== undefined)
      : keys1;
    
    const filteredKeys2 = options.ignoreUndefined
      ? keys2.filter(key => obj2[key] !== undefined)
      : keys2;
    
    if (filteredKeys1.length !== filteredKeys2.length) {
      return false;
    }
    
    if (options.ignoreOrder) {
      // Sort keys for consistent comparison
      filteredKeys1.sort();
      filteredKeys2.sort();
    }
    
    // Check if all keys match
    for (let i = 0; i < filteredKeys1.length; i++) {
      const key = filteredKeys1[i];
      
      if (!filteredKeys2.includes(key)) {
        return false;
      }
      
      if (!isDeepEqual(obj1[key], obj2[key], options)) {
        return false;
      }
    }
    
    return true;
  }
  
  // For all other types, use strict equality
  return obj1 === obj2;
}

/**
 * Validates that an object matches a specific interface or type.
 * This is a runtime type checking utility that works with TypeScript interfaces.
 * 
 * @param obj - The object to validate
 * @param interfaceValidator - A function that validates if the object matches the interface
 * @param options - Validation options
 * @returns Validation result with success status and any errors
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   age?: number;
 * }
 * 
 * // Create a validator function for the User interface
 * const isUser = (obj: unknown): obj is User => {
 *   return validateObjectSchema(obj, [
 *     { name: 'id', required: true, validator: isString },
 *     { name: 'name', required: true, validator: isString },
 *     { name: 'email', required: true, validator: isValidEmail },
 *     { name: 'age', required: false, validator: isNumber }
 *   ]).success;
 * };
 * 
 * // Validate object against User interface
 * const result = validateInterface(obj, isUser);
 * 
 * if (result.success) {
 *   // Process valid user
 *   const user = result.data as User;
 *   console.log(user.name);
 * }
 * ```
 */
export function validateInterface<T>(
  obj: unknown,
  interfaceValidator: (obj: unknown) => obj is T,
  options: ValidationOptions = {}
): ValidationResult {
  if (!isObject(obj)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Value is not an object',
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  const isValid = interfaceValidator(obj);
  
  if (!isValid) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Object does not match interface',
        code: 'INVALID_INTERFACE',
        context: options.context
      }]
    };
  }
  
  return {
    success: true,
    data: obj as T
  };
}

/**
 * Creates a partial validator for an object schema that only validates specified properties.
 * 
 * @param schema - The full object schema
 * @param propertiesToValidate - Array of property names to include in validation
 * @returns A new schema containing only the specified properties
 * 
 * @example
 * ```typescript
 * // Define full user schema
 * const userSchema: PropertyDefinition[] = [
 *   { name: 'id', required: true },
 *   { name: 'name', required: true },
 *   { name: 'email', required: true, validator: isValidEmail },
 *   { name: 'age', required: false, validator: isNumber },
 *   { name: 'address', required: false }
 * ];
 * 
 * // Create a partial schema for updating just name and email
 * const updateSchema = createPartialSchema(userSchema, ['name', 'email']);
 * 
 * // Validate update payload against partial schema
 * const result = validateObjectSchema(updatePayload, updateSchema);
 * ```
 */
export function createPartialSchema(
  schema: PropertyDefinition[],
  propertiesToValidate: string[]
): PropertyDefinition[] {
  return schema.filter(prop => propertiesToValidate.includes(prop.name));
}

/**
 * Validates that an object has at least one of the specified properties.
 * 
 * @param obj - The object to validate
 * @param props - Array of property names, at least one of which must exist
 * @param options - Validation options
 * @returns True if the object has at least one of the properties, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if contact info has at least one contact method
 * if (hasAtLeastOneProperty(contact, ['email', 'phone', 'address'])) {
 *   // Process contact
 * } else {
 *   // Handle validation error
 *   console.error('At least one contact method is required');
 * }
 * ```
 */
export function hasAtLeastOneProperty(
  obj: unknown,
  props: string[],
  options: ValidationOptions = {}
): boolean {
  if (!isObject(obj)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Value is not an object');
    }
    return false;
  }
  
  const hasAnyProp = props.some(prop => prop in obj);
  
  if (!hasAnyProp && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Object must have at least one of these properties: ${props.join(', ')}`
    );
  }
  
  return hasAnyProp;
}

/**
 * Validates that an object has all properties in a specific group and none from other groups.
 * Useful for validating objects that must conform to one of several possible shapes.
 * 
 * @param obj - The object to validate
 * @param propertyGroups - Map of group names to arrays of property names
 * @param options - Validation options with additional group validation options
 * @returns Validation result with success status, any errors, and the matched group name
 * 
 * @example
 * ```typescript
 * // Define property groups for different payment methods
 * const paymentGroups = {
 *   creditCard: ['cardNumber', 'expiryDate', 'cvv'],
 *   bankTransfer: ['accountNumber', 'routingNumber', 'accountName'],
 *   paypal: ['paypalEmail']
 * };
 * 
 * // Validate payment object against these groups
 * const result = validatePropertyGroups(payment, paymentGroups);
 * 
 * if (result.success) {
 *   // Process payment based on matched group
 *   const paymentType = result.matchedGroup;
 *   console.log(`Processing ${paymentType} payment`);
 * }
 * ```
 */
export function validatePropertyGroups(
  obj: unknown,
  propertyGroups: Record<string, string[]>,
  options: ValidationOptions & {
    /** Whether to allow properties not in any group */
    allowAdditionalProperties?: boolean;
    /** Whether to require all properties in the matched group */
    requireAllGroupProperties?: boolean;
  } = {}
): ValidationResult & { matchedGroup?: string } {
  if (!isObject(obj)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Value is not an object',
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  const objProps = Object.keys(obj);
  const errors: ValidationError[] = [];
  let matchedGroup: string | undefined;
  
  // Check each group
  for (const [groupName, groupProps] of Object.entries(propertyGroups)) {
    // Check if object has any properties from this group
    const hasGroupProps = groupProps.some(prop => objProps.includes(prop));
    
    if (hasGroupProps) {
      // If we already matched a group, this is an error (mixed groups)
      if (matchedGroup) {
        errors.push({
          field: '',
          message: `Object contains properties from multiple groups: ${matchedGroup} and ${groupName}`,
          code: 'MIXED_GROUPS',
          context: options.context
        });
        break;
      }
      
      matchedGroup = groupName;
      
      // If we require all properties in the group, check for missing ones
      if (options.requireAllGroupProperties) {
        const missingProps = groupProps.filter(prop => !objProps.includes(prop));
        
        if (missingProps.length > 0) {
          missingProps.forEach(prop => {
            errors.push({
              field: prop,
              message: `Missing required property for group ${groupName}`,
              code: 'MISSING_GROUP_PROPERTY',
              context: options.context
            });
          });
        }
      }
    }
  }
  
  // If no group matched, that's an error
  if (!matchedGroup) {
    errors.push({
      field: '',
      message: options.errorMessage || 'Object does not match any property group',
      code: 'NO_GROUP_MATCH',
      context: options.context
    });
  } else if (!options.allowAdditionalProperties) {
    // Check for properties not in the matched group
    const allGroupProps = Object.values(propertyGroups).flat();
    const additionalProps = objProps.filter(
      prop => !propertyGroups[matchedGroup!].includes(prop) && allGroupProps.includes(prop)
    );
    
    if (additionalProps.length > 0) {
      additionalProps.forEach(prop => {
        errors.push({
          field: prop,
          message: `Property belongs to a different group than ${matchedGroup}`,
          code: 'PROPERTY_GROUP_MISMATCH',
          context: options.context
        });
      });
    }
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: obj,
    matchedGroup
  };
}

/**
 * Validates that an object has a specific shape based on a template object.
 * The template object defines the expected structure and types.
 * 
 * @param obj - The object to validate
 * @param template - Template object defining the expected structure
 * @param options - Validation options
 * @returns Validation result with success status and any errors
 * 
 * @example
 * ```typescript
 * // Define template for user object
 * const userTemplate = {
 *   id: '',           // Expect string
 *   name: '',         // Expect string
 *   age: 0,           // Expect number
 *   active: true,     // Expect boolean
 *   tags: [],         // Expect array
 *   profile: {}       // Expect object
 * };
 * 
 * // Validate user against template
 * const result = validateObjectShape(user, userTemplate);
 * 
 * if (result.success) {
 *   // Process valid user
 * } else {
 *   // Handle validation errors
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateObjectShape(
  obj: unknown,
  template: Record<string, any>,
  options: ValidationOptions & {
    /** Whether to allow properties not in the template */
    allowAdditionalProperties?: boolean;
    /** Whether to validate nested objects recursively */
    validateNested?: boolean;
  } = {}
): ValidationResult {
  if (!isObject(obj)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: options.errorMessage || 'Value is not an object',
        code: 'INVALID_TYPE',
        context: options.context
      }]
    };
  }
  
  if (!isObject(template)) {
    return {
      success: false,
      errors: [{
        field: '',
        message: 'Template is not an object',
        code: 'INVALID_TEMPLATE',
        context: options.context
      }]
    };
  }
  
  const errors: ValidationError[] = [];
  const templateKeys = Object.keys(template);
  
  // Check each template property
  for (const key of templateKeys) {
    if (!(key in obj)) {
      errors.push({
        field: key,
        message: `Missing required property`,
        code: 'REQUIRED',
        context: options.context
      });
      continue;
    }
    
    const templateValue = template[key];
    const objValue = obj[key];
    
    // Check type match
    if (typeof objValue !== typeof templateValue) {
      errors.push({
        field: key,
        message: `Expected type '${typeof templateValue}', got '${typeof objValue}'`,
        code: 'TYPE_MISMATCH',
        context: options.context
      });
      continue;
    }
    
    // Special handling for arrays
    if (isArray(templateValue) && isArray(objValue)) {
      // We only check that it's an array, not the contents
      continue;
    }
    
    // Recursive validation for nested objects
    if (options.validateNested && isObject(templateValue) && isObject(objValue)) {
      const nestedResult = validateObjectShape(objValue, templateValue, options);
      
      if (!nestedResult.success && nestedResult.errors) {
        // Add parent property path to nested errors
        nestedResult.errors.forEach(error => {
          errors.push({
            field: `${key}.${error.field}`,
            message: error.message,
            code: error.code,
            context: error.context
          });
        });
      }
    }
  }
  
  // Check for additional properties if not allowed
  if (options.allowAdditionalProperties === false) {
    const objKeys = Object.keys(obj);
    const additionalProps = objKeys.filter(key => !templateKeys.includes(key));
    
    if (additionalProps.length > 0) {
      additionalProps.forEach(prop => {
        errors.push({
          field: prop,
          message: `Property is not allowed`,
          code: 'ADDITIONAL_PROPERTY',
          context: options.context
        });
      });
    }
  }
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: obj
  };
}