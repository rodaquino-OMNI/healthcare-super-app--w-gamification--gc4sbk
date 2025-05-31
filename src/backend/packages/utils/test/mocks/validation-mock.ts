/**
 * Validation Mock
 * 
 * Provides mock implementations of validation libraries (class-validator, Yup, Zod, Joi) used across the application.
 * Enables testing of validation-dependent code without the actual validation libraries.
 * Includes configurable validation results, error messages, and type transformations for comprehensive validation testing.
 */

// ===== Mock Configuration Types =====

/**
 * Global configuration for all validation mocks
 */
export interface ValidationMockConfig {
  /** Default validation result if not specified at the validator level */
  defaultResult?: boolean;
  /** Whether to track validation calls */
  trackCalls?: boolean;
  /** Journey-specific validation behavior */
  journeyBehavior?: {
    health?: { defaultResult?: boolean };
    care?: { defaultResult?: boolean };
    plan?: { defaultResult?: boolean };
  };
}

/**
 * Configuration for a specific validator
 */
export interface ValidatorConfig {
  /** Whether validation should pass or fail */
  result?: boolean;
  /** Custom error message when validation fails */
  message?: string;
  /** Custom validation function */
  validate?: (value: any) => boolean;
  /** Journey-specific validation behavior */
  journeyBehavior?: {
    health?: { result?: boolean; message?: string };
    care?: { result?: boolean; message?: string };
    plan?: { result?: boolean; message?: string };
  };
}

/**
 * Validation call tracking information
 */
export interface ValidationCall {
  /** Name of the validator */
  validator: string;
  /** Value that was validated */
  value: any;
  /** Whether validation passed */
  result: boolean;
  /** Validation context (e.g., journey ID) */
  context?: Record<string, any>;
  /** Timestamp of the validation call */
  timestamp: number;
}

// ===== Mock State =====

/**
 * Global configuration for all validation mocks
 */
const globalConfig: ValidationMockConfig = {
  defaultResult: true,
  trackCalls: true,
  journeyBehavior: {
    health: { defaultResult: true },
    care: { defaultResult: true },
    plan: { defaultResult: true },
  },
};

/**
 * Configuration for specific validators
 */
const validatorConfigs: Record<string, ValidatorConfig> = {};

/**
 * History of validation calls
 */
const validationCalls: ValidationCall[] = [];

/**
 * Current journey context
 */
let currentJourney: 'health' | 'care' | 'plan' | null = null;

// ===== Mock Control Functions =====

/**
 * Configures the global validation mock behavior
 * 
 * @param config - Global configuration options
 */
export function configureValidationMock(config: ValidationMockConfig): void {
  Object.assign(globalConfig, config);
}

/**
 * Configures a specific validator's behavior
 * 
 * @param validatorName - Name of the validator (e.g., 'IsString', 'z.string', 'Joi.string')
 * @param config - Validator configuration
 */
export function configureValidator(validatorName: string, config: ValidatorConfig): void {
  validatorConfigs[validatorName] = config;
}

/**
 * Sets the current journey context for validation
 * 
 * @param journey - Journey identifier or null to clear
 */
export function setValidationJourney(journey: 'health' | 'care' | 'plan' | null): void {
  currentJourney = journey;
}

/**
 * Resets all validation mock configurations to defaults
 */
export function resetValidationMock(): void {
  Object.keys(validatorConfigs).forEach(key => delete validatorConfigs[key]);
  validationCalls.length = 0;
  currentJourney = null;
  
  // Reset global config to defaults
  globalConfig.defaultResult = true;
  globalConfig.trackCalls = true;
  globalConfig.journeyBehavior = {
    health: { defaultResult: true },
    care: { defaultResult: true },
    plan: { defaultResult: true },
  };
}

/**
 * Gets the history of validation calls
 * 
 * @returns Array of validation call records
 */
export function getValidationCalls(): ValidationCall[] {
  return [...validationCalls];
}

/**
 * Gets validation calls for a specific validator
 * 
 * @param validatorName - Name of the validator
 * @returns Array of validation call records for the specified validator
 */
export function getValidatorCalls(validatorName: string): ValidationCall[] {
  return validationCalls.filter(call => call.validator === validatorName);
}

/**
 * Clears the validation call history
 */
export function clearValidationCalls(): void {
  validationCalls.length = 0;
}

/**
 * Determines if a validation should pass based on configuration
 * 
 * @param validatorName - Name of the validator
 * @param value - Value being validated
 * @param context - Additional validation context
 * @returns Whether validation should pass
 */
function shouldValidationPass(
  validatorName: string,
  value: any,
  context: Record<string, any> = {}
): boolean {
  const config = validatorConfigs[validatorName];
  
  // If there's a custom validation function, use it
  if (config?.validate) {
    return config.validate(value);
  }
  
  // Check journey-specific behavior
  if (currentJourney && config?.journeyBehavior?.[currentJourney]?.result !== undefined) {
    return config.journeyBehavior[currentJourney].result!;
  }
  
  // Check validator-specific result
  if (config?.result !== undefined) {
    return config.result;
  }
  
  // Check journey-specific global default
  if (currentJourney && globalConfig.journeyBehavior?.[currentJourney]?.defaultResult !== undefined) {
    return globalConfig.journeyBehavior[currentJourney].defaultResult!;
  }
  
  // Fall back to global default
  return globalConfig.defaultResult ?? true;
}

/**
 * Gets the error message for a failed validation
 * 
 * @param validatorName - Name of the validator
 * @returns Error message
 */
function getErrorMessage(validatorName: string): string {
  const config = validatorConfigs[validatorName];
  
  // Check journey-specific message
  if (currentJourney && config?.journeyBehavior?.[currentJourney]?.message) {
    return config.journeyBehavior[currentJourney].message!;
  }
  
  // Check validator-specific message
  if (config?.message) {
    return config.message;
  }
  
  // Default error message
  return `Validation failed for ${validatorName}`;
}

/**
 * Records a validation call if tracking is enabled
 * 
 * @param validatorName - Name of the validator
 * @param value - Value that was validated
 * @param result - Whether validation passed
 * @param context - Additional validation context
 */
function trackValidation(
  validatorName: string,
  value: any,
  result: boolean,
  context: Record<string, any> = {}
): void {
  if (globalConfig.trackCalls) {
    validationCalls.push({
      validator: validatorName,
      value,
      result,
      context: { ...context, journey: currentJourney },
      timestamp: Date.now(),
    });
  }
}

// ===== class-validator Mocks =====

/**
 * Creates a mock class-validator decorator
 * 
 * @param name - Name of the decorator
 * @returns Mock decorator function
 */
function createDecoratorMock(name: string) {
  return function(...args: any[]) {
    return function(target: any, propertyKey: string) {
      // Store metadata about the decoration if needed
      const existingValidations = Reflect.getMetadata('validations', target.constructor) || {};
      existingValidations[propertyKey] = existingValidations[propertyKey] || [];
      existingValidations[propertyKey].push({ decorator: name, args });
      Reflect.defineMetadata('validations', existingValidations, target.constructor);
      
      // Return the actual decorator function (no-op in mock)
      return target;
    };
  };
}

/**
 * Mock implementation of class-validator's validate function
 * 
 * @param object - Object to validate
 * @param options - Validation options
 * @returns Promise resolving to validation errors
 */
export async function validate(object: object, options?: any): Promise<any[]> {
  return validateSync(object, options);
}

/**
 * Mock implementation of class-validator's validateSync function
 * 
 * @param object - Object to validate
 * @param options - Validation options
 * @returns Validation errors
 */
export function validateSync(object: object, options?: any): any[] {
  const result = shouldValidationPass('validateSync', object, { options });
  trackValidation('validateSync', object, result, { options });
  
  if (result) {
    return [];
  }
  
  // Create mock validation errors
  const errors: any[] = [];
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const validatorName = `validateSync:${key}`;
      const propertyResult = shouldValidationPass(validatorName, (object as any)[key]);
      
      if (!propertyResult) {
        errors.push({
          target: object,
          property: key,
          value: (object as any)[key],
          constraints: {
            [validatorName]: getErrorMessage(validatorName),
          },
          children: [],
        });
      }
    }
  }
  
  return errors;
}

// Common class-validator decorators
export const IsString = createDecoratorMock('IsString');
export const IsNumber = createDecoratorMock('IsNumber');
export const IsBoolean = createDecoratorMock('IsBoolean');
export const IsDate = createDecoratorMock('IsDate');
export const IsEmail = createDecoratorMock('IsEmail');
export const IsOptional = createDecoratorMock('IsOptional');
export const IsNotEmpty = createDecoratorMock('IsNotEmpty');
export const MinLength = createDecoratorMock('MinLength');
export const MaxLength = createDecoratorMock('MaxLength');
export const Min = createDecoratorMock('Min');
export const Max = createDecoratorMock('Max');
export const IsEnum = createDecoratorMock('IsEnum');
export const IsArray = createDecoratorMock('IsArray');
export const ArrayMinSize = createDecoratorMock('ArrayMinSize');
export const ArrayMaxSize = createDecoratorMock('ArrayMaxSize');
export const IsObject = createDecoratorMock('IsObject');
export const ValidateNested = createDecoratorMock('ValidateNested');
export const IsPositive = createDecoratorMock('IsPositive');
export const IsNegative = createDecoratorMock('IsNegative');
export const IsInt = createDecoratorMock('IsInt');
export const IsUrl = createDecoratorMock('IsUrl');

// ===== Zod Mocks =====

/**
 * Creates a mock Zod schema
 * 
 * @param schemaType - Type of schema
 * @returns Mock Zod schema
 */
function createZodSchemaMock(schemaType: string) {
  const schema = {
    _type: schemaType,
    
    // Common schema methods
    optional: () => createZodSchemaMock(`${schemaType}.optional`),
    nullable: () => createZodSchemaMock(`${schemaType}.nullable`),
    nullish: () => createZodSchemaMock(`${schemaType}.nullish`),
    array: () => createZodSchemaMock(`${schemaType}.array`),
    or: (schema: any) => createZodSchemaMock(`${schemaType}.or`),
    and: (schema: any) => createZodSchemaMock(`${schemaType}.and`),
    
    // Refinement methods
    refine: (check: any, message?: any) => createZodSchemaMock(`${schemaType}.refine`),
    superRefine: (check: any) => createZodSchemaMock(`${schemaType}.superRefine`),
    transform: (fn: any) => createZodSchemaMock(`${schemaType}.transform`),
    
    // Validation methods
    parse: (data: any) => {
      const result = shouldValidationPass(`${schemaType}.parse`, data);
      trackValidation(`${schemaType}.parse`, data, result);
      
      if (!result) {
        throw createZodError(schemaType, data);
      }
      
      return data;
    },
    safeParse: (data: any) => {
      const result = shouldValidationPass(`${schemaType}.safeParse`, data);
      trackValidation(`${schemaType}.safeParse`, data, result);
      
      if (result) {
        return { success: true, data };
      } else {
        return { success: false, error: createZodError(schemaType, data) };
      }
    },
    parseAsync: async (data: any) => {
      return schema.parse(data);
    },
    safeParseAsync: async (data: any) => {
      return schema.safeParse(data);
    },
    
    // Type-specific methods
    ...(schemaType === 'string' ? {
      min: (min: number, message?: string) => createZodSchemaMock(`${schemaType}.min`),
      max: (max: number, message?: string) => createZodSchemaMock(`${schemaType}.max`),
      length: (len: number, message?: string) => createZodSchemaMock(`${schemaType}.length`),
      email: (message?: string) => createZodSchemaMock(`${schemaType}.email`),
      url: (message?: string) => createZodSchemaMock(`${schemaType}.url`),
      uuid: (message?: string) => createZodSchemaMock(`${schemaType}.uuid`),
      regex: (regex: RegExp, message?: string) => createZodSchemaMock(`${schemaType}.regex`),
    } : {}),
    
    ...(schemaType === 'number' ? {
      min: (min: number, message?: string) => createZodSchemaMock(`${schemaType}.min`),
      max: (max: number, message?: string) => createZodSchemaMock(`${schemaType}.max`),
      int: (message?: string) => createZodSchemaMock(`${schemaType}.int`),
      positive: (message?: string) => createZodSchemaMock(`${schemaType}.positive`),
      negative: (message?: string) => createZodSchemaMock(`${schemaType}.negative`),
    } : {}),
    
    ...(schemaType === 'array' ? {
      min: (min: number, message?: string) => createZodSchemaMock(`${schemaType}.min`),
      max: (max: number, message?: string) => createZodSchemaMock(`${schemaType}.max`),
      length: (len: number, message?: string) => createZodSchemaMock(`${schemaType}.length`),
      nonempty: (message?: string) => createZodSchemaMock(`${schemaType}.nonempty`),
    } : {}),
    
    ...(schemaType === 'object' ? {
      shape: (shape: any) => createZodSchemaMock(`${schemaType}.shape`),
      extend: (shape: any) => createZodSchemaMock(`${schemaType}.extend`),
      merge: (schema: any) => createZodSchemaMock(`${schemaType}.merge`),
      pick: (keys: any) => createZodSchemaMock(`${schemaType}.pick`),
      omit: (keys: any) => createZodSchemaMock(`${schemaType}.omit`),
      partial: () => createZodSchemaMock(`${schemaType}.partial`),
      deepPartial: () => createZodSchemaMock(`${schemaType}.deepPartial`),
    } : {}),
    
    // Error handling
    catch: (defaultValue: any) => defaultValue,
    default: (defaultValue: any) => defaultValue,
    
    // Metadata
    describe: (description: string) => schema,
    pipe: (schema: any) => createZodSchemaMock(`${schemaType}.pipe`),
    brand: () => createZodSchemaMock(`${schemaType}.brand`),
    withErrorMap: (errorMap: any) => schema,
  };
  
  return schema;
}

/**
 * Creates a mock Zod error
 * 
 * @param schemaType - Type of schema that produced the error
 * @param value - Value that failed validation
 * @returns Mock Zod error
 */
function createZodError(schemaType: string, value: any) {
  const errorMessage = getErrorMessage(`${schemaType}`);
  
  return {
    name: 'ZodError',
    message: errorMessage,
    errors: [
      {
        code: 'custom',
        path: [],
        message: errorMessage,
      },
    ],
    format: () => ({
      _errors: [errorMessage],
    }),
    flatten: () => ({
      formErrors: [errorMessage],
      fieldErrors: {},
    }),
  };
}

/**
 * Mock implementation of Zod
 */
export const z = {
  string: (options?: any) => createZodSchemaMock('string'),
  number: (options?: any) => createZodSchemaMock('number'),
  boolean: (options?: any) => createZodSchemaMock('boolean'),
  date: (options?: any) => createZodSchemaMock('date'),
  array: (schema?: any) => createZodSchemaMock('array'),
  object: (shape?: any) => createZodSchemaMock('object'),
  enum: (values: any) => createZodSchemaMock('enum'),
  union: (schemas: any[]) => createZodSchemaMock('union'),
  intersection: (schemas: any[]) => createZodSchemaMock('intersection'),
  literal: (value: any) => createZodSchemaMock('literal'),
  record: (schema?: any) => createZodSchemaMock('record'),
  map: (keySchema?: any, valueSchema?: any) => createZodSchemaMock('map'),
  set: (schema?: any) => createZodSchemaMock('set'),
  function: () => createZodSchemaMock('function'),
  lazy: (fn: any) => createZodSchemaMock('lazy'),
  promise: (schema?: any) => createZodSchemaMock('promise'),
  any: () => createZodSchemaMock('any'),
  unknown: () => createZodSchemaMock('unknown'),
  void: () => createZodSchemaMock('void'),
  null: () => createZodSchemaMock('null'),
  undefined: () => createZodSchemaMock('undefined'),
  never: () => createZodSchemaMock('never'),
  custom: (validator?: any) => createZodSchemaMock('custom'),
  
  // Type aliases
  optional: (schema: any) => schema.optional(),
  nullable: (schema: any) => schema.nullable(),
  
  // Enums for error codes
  ZodIssueCode: {
    invalid_type: 'invalid_type',
    invalid_literal: 'invalid_literal',
    custom: 'custom',
    invalid_union: 'invalid_union',
    invalid_union_discriminator: 'invalid_union_discriminator',
    invalid_enum_value: 'invalid_enum_value',
    unrecognized_keys: 'unrecognized_keys',
    invalid_arguments: 'invalid_arguments',
    invalid_return_type: 'invalid_return_type',
    invalid_date: 'invalid_date',
    invalid_string: 'invalid_string',
    too_small: 'too_small',
    too_big: 'too_big',
    invalid_intersection_types: 'invalid_intersection_types',
    not_multiple_of: 'not_multiple_of',
    not_finite: 'not_finite',
  },
  
  // Utility functions
  NEVER: Symbol('z.NEVER'),
};

// ===== Yup Mocks =====

/**
 * Creates a mock Yup schema
 * 
 * @param schemaType - Type of schema
 * @returns Mock Yup schema
 */
function createYupSchemaMock(schemaType: string) {
  const schema = {
    _type: schemaType,
    
    // Common schema methods
    optional: () => createYupSchemaMock(`${schemaType}.optional`),
    required: (message?: string) => createYupSchemaMock(`${schemaType}.required`),
    nullable: () => createYupSchemaMock(`${schemaType}.nullable`),
    default: (value: any) => createYupSchemaMock(`${schemaType}.default`),
    defined: () => createYupSchemaMock(`${schemaType}.defined`),
    typeError: (message: string) => createYupSchemaMock(`${schemaType}.typeError`),
    oneOf: (values: any[], message?: string) => createYupSchemaMock(`${schemaType}.oneOf`),
    notOneOf: (values: any[], message?: string) => createYupSchemaMock(`${schemaType}.notOneOf`),
    when: (key: string, options: any) => createYupSchemaMock(`${schemaType}.when`),
    test: (name: string, message: string, test: any) => createYupSchemaMock(`${schemaType}.test`),
    transform: (fn: any) => createYupSchemaMock(`${schemaType}.transform`),
    
    // Validation methods
    validate: async (value: any, options?: any) => {
      const result = shouldValidationPass(`${schemaType}.validate`, value, { options });
      trackValidation(`${schemaType}.validate`, value, result, { options });
      
      if (!result) {
        throw createYupError(schemaType, value);
      }
      
      return value;
    },
    validateSync: (value: any, options?: any) => {
      const result = shouldValidationPass(`${schemaType}.validateSync`, value, { options });
      trackValidation(`${schemaType}.validateSync`, value, result, { options });
      
      if (!result) {
        throw createYupError(schemaType, value);
      }
      
      return value;
    },
    isValid: async (value: any, options?: any) => {
      const result = shouldValidationPass(`${schemaType}.isValid`, value, { options });
      trackValidation(`${schemaType}.isValid`, value, result, { options });
      return result;
    },
    isValidSync: (value: any, options?: any) => {
      const result = shouldValidationPass(`${schemaType}.isValidSync`, value, { options });
      trackValidation(`${schemaType}.isValidSync`, value, result, { options });
      return result;
    },
    cast: (value: any, options?: any) => value,
    
    // Type-specific methods
    ...(schemaType === 'string' ? {
      min: (min: number, message?: string) => createYupSchemaMock(`${schemaType}.min`),
      max: (max: number, message?: string) => createYupSchemaMock(`${schemaType}.max`),
      length: (length: number, message?: string) => createYupSchemaMock(`${schemaType}.length`),
      email: (message?: string) => createYupSchemaMock(`${schemaType}.email`),
      url: (message?: string) => createYupSchemaMock(`${schemaType}.url`),
      uuid: (message?: string) => createYupSchemaMock(`${schemaType}.uuid`),
      matches: (regex: RegExp, message?: string) => createYupSchemaMock(`${schemaType}.matches`),
      trim: (message?: string) => createYupSchemaMock(`${schemaType}.trim`),
      lowercase: (message?: string) => createYupSchemaMock(`${schemaType}.lowercase`),
      uppercase: (message?: string) => createYupSchemaMock(`${schemaType}.uppercase`),
    } : {}),
    
    ...(schemaType === 'number' ? {
      min: (min: number, message?: string) => createYupSchemaMock(`${schemaType}.min`),
      max: (max: number, message?: string) => createYupSchemaMock(`${schemaType}.max`),
      lessThan: (less: number, message?: string) => createYupSchemaMock(`${schemaType}.lessThan`),
      moreThan: (more: number, message?: string) => createYupSchemaMock(`${schemaType}.moreThan`),
      positive: (message?: string) => createYupSchemaMock(`${schemaType}.positive`),
      negative: (message?: string) => createYupSchemaMock(`${schemaType}.negative`),
      integer: (message?: string) => createYupSchemaMock(`${schemaType}.integer`),
    } : {}),
    
    ...(schemaType === 'array' ? {
      min: (min: number, message?: string) => createYupSchemaMock(`${schemaType}.min`),
      max: (max: number, message?: string) => createYupSchemaMock(`${schemaType}.max`),
      length: (length: number, message?: string) => createYupSchemaMock(`${schemaType}.length`),
      of: (schema: any) => createYupSchemaMock(`${schemaType}.of`),
    } : {}),
    
    ...(schemaType === 'object' ? {
      shape: (shape: any) => createYupSchemaMock(`${schemaType}.shape`),
      pick: (keys: string[]) => createYupSchemaMock(`${schemaType}.pick`),
      omit: (keys: string[]) => createYupSchemaMock(`${schemaType}.omit`),
      from: (fromKey: string, toKey: string, alias: boolean) => createYupSchemaMock(`${schemaType}.from`),
      noUnknown: (onlyKnownKeys?: boolean, message?: string) => createYupSchemaMock(`${schemaType}.noUnknown`),
      camelCase: () => createYupSchemaMock(`${schemaType}.camelCase`),
      constantCase: () => createYupSchemaMock(`${schemaType}.constantCase`),
    } : {}),
    
    ...(schemaType === 'date' ? {
      min: (min: Date, message?: string) => createYupSchemaMock(`${schemaType}.min`),
      max: (max: Date, message?: string) => createYupSchemaMock(`${schemaType}.max`),
    } : {}),
  };
  
  return schema;
}

/**
 * Creates a mock Yup error
 * 
 * @param schemaType - Type of schema that produced the error
 * @param value - Value that failed validation
 * @returns Mock Yup error
 */
function createYupError(schemaType: string, value: any) {
  const errorMessage = getErrorMessage(`${schemaType}`);
  
  return {
    name: 'ValidationError',
    message: errorMessage,
    value,
    path: '',
    type: 'validation',
    errors: [errorMessage],
    inner: [],
  };
}

/**
 * Mock implementation of Yup
 */
export const yup = {
  string: () => createYupSchemaMock('string'),
  number: () => createYupSchemaMock('number'),
  boolean: () => createYupSchemaMock('boolean'),
  date: () => createYupSchemaMock('date'),
  array: (schema?: any) => createYupSchemaMock('array'),
  object: (shape?: any) => createYupSchemaMock('object'),
  mixed: () => createYupSchemaMock('mixed'),
  ref: (path: string, options?: any) => ({ __isYupRef: true, path }),
  lazy: (fn: any) => createYupSchemaMock('lazy'),
  
  // Validation methods
  reach: (schema: any, path: string) => createYupSchemaMock('reach'),
  addMethod: (schemaType: any, name: string, method: any) => {},
  setLocale: (locale: any) => {},
  isSchema: (obj: any) => true,
  ValidationError: function(errors: any, value: any, path: string) {
    return createYupError('ValidationError', value);
  },
};

// ===== Joi Mocks =====

/**
 * Creates a mock Joi schema
 * 
 * @param schemaType - Type of schema
 * @returns Mock Joi schema
 */
function createJoiSchemaMock(schemaType: string) {
  const schema = {
    _type: schemaType,
    
    // Common schema methods
    optional: () => createJoiSchemaMock(`${schemaType}.optional`),
    required: () => createJoiSchemaMock(`${schemaType}.required`),
    allow: (...values: any[]) => createJoiSchemaMock(`${schemaType}.allow`),
    valid: (...values: any[]) => createJoiSchemaMock(`${schemaType}.valid`),
    invalid: (...values: any[]) => createJoiSchemaMock(`${schemaType}.invalid`),
    default: (value: any) => createJoiSchemaMock(`${schemaType}.default`),
    description: (desc: string) => createJoiSchemaMock(`${schemaType}.description`),
    notes: (notes: string | string[]) => createJoiSchemaMock(`${schemaType}.notes`),
    tags: (tags: string | string[]) => createJoiSchemaMock(`${schemaType}.tags`),
    example: (example: any) => createJoiSchemaMock(`${schemaType}.example`),
    unit: (name: string) => createJoiSchemaMock(`${schemaType}.unit`),
    when: (ref: any, options: any) => createJoiSchemaMock(`${schemaType}.when`),
    label: (name: string) => createJoiSchemaMock(`${schemaType}.label`),
    raw: () => createJoiSchemaMock(`${schemaType}.raw`),
    
    // Validation methods
    validate: (value: any, options?: any) => {
      const result = shouldValidationPass(`${schemaType}.validate`, value, { options });
      trackValidation(`${schemaType}.validate`, value, result, { options });
      
      if (result) {
        return { value, error: null };
      } else {
        return { value, error: createJoiError(schemaType, value) };
      }
    },
    validateAsync: async (value: any, options?: any) => {
      const result = shouldValidationPass(`${schemaType}.validateAsync`, value, { options });
      trackValidation(`${schemaType}.validateAsync`, value, result, { options });
      
      if (result) {
        return value;
      } else {
        throw createJoiError(schemaType, value);
      }
    },
    
    // Type-specific methods
    ...(schemaType === 'string' ? {
      min: (limit: number) => createJoiSchemaMock(`${schemaType}.min`),
      max: (limit: number) => createJoiSchemaMock(`${schemaType}.max`),
      length: (limit: number) => createJoiSchemaMock(`${schemaType}.length`),
      email: (options?: any) => createJoiSchemaMock(`${schemaType}.email`),
      uri: (options?: any) => createJoiSchemaMock(`${schemaType}.uri`),
      uuid: (options?: any) => createJoiSchemaMock(`${schemaType}.uuid`),
      pattern: (regex: RegExp, name?: string) => createJoiSchemaMock(`${schemaType}.pattern`),
      alphanum: () => createJoiSchemaMock(`${schemaType}.alphanum`),
      token: () => createJoiSchemaMock(`${schemaType}.token`),
      trim: () => createJoiSchemaMock(`${schemaType}.trim`),
      lowercase: () => createJoiSchemaMock(`${schemaType}.lowercase`),
      uppercase: () => createJoiSchemaMock(`${schemaType}.uppercase`),
    } : {}),
    
    ...(schemaType === 'number' ? {
      min: (limit: number) => createJoiSchemaMock(`${schemaType}.min`),
      max: (limit: number) => createJoiSchemaMock(`${schemaType}.max`),
      greater: (limit: number) => createJoiSchemaMock(`${schemaType}.greater`),
      less: (limit: number) => createJoiSchemaMock(`${schemaType}.less`),
      integer: () => createJoiSchemaMock(`${schemaType}.integer`),
      precision: (limit: number) => createJoiSchemaMock(`${schemaType}.precision`),
      multiple: (base: number) => createJoiSchemaMock(`${schemaType}.multiple`),
      positive: () => createJoiSchemaMock(`${schemaType}.positive`),
      negative: () => createJoiSchemaMock(`${schemaType}.negative`),
      port: () => createJoiSchemaMock(`${schemaType}.port`),
    } : {}),
    
    ...(schemaType === 'array' ? {
      min: (limit: number) => createJoiSchemaMock(`${schemaType}.min`),
      max: (limit: number) => createJoiSchemaMock(`${schemaType}.max`),
      length: (limit: number) => createJoiSchemaMock(`${schemaType}.length`),
      items: (...types: any[]) => createJoiSchemaMock(`${schemaType}.items`),
      ordered: (...types: any[]) => createJoiSchemaMock(`${schemaType}.ordered`),
      single: () => createJoiSchemaMock(`${schemaType}.single`),
      sparse: (enabled?: boolean) => createJoiSchemaMock(`${schemaType}.sparse`),
      unique: (comparator?: any) => createJoiSchemaMock(`${schemaType}.unique`),
    } : {}),
    
    ...(schemaType === 'object' ? {
      keys: (schema?: any) => createJoiSchemaMock(`${schemaType}.keys`),
      append: (schema?: any) => createJoiSchemaMock(`${schemaType}.append`),
      min: (limit: number) => createJoiSchemaMock(`${schemaType}.min`),
      max: (limit: number) => createJoiSchemaMock(`${schemaType}.max`),
      length: (limit: number) => createJoiSchemaMock(`${schemaType}.length`),
      pattern: (pattern: RegExp, schema: any) => createJoiSchemaMock(`${schemaType}.pattern`),
      and: (...peers: string[]) => createJoiSchemaMock(`${schemaType}.and`),
      or: (...peers: string[]) => createJoiSchemaMock(`${schemaType}.or`),
      xor: (...peers: string[]) => createJoiSchemaMock(`${schemaType}.xor`),
      unknown: (allow?: boolean) => createJoiSchemaMock(`${schemaType}.unknown`),
      rename: (from: string, to: string, options?: any) => createJoiSchemaMock(`${schemaType}.rename`),
      assert: (ref: any, schema: any, message?: string) => createJoiSchemaMock(`${schemaType}.assert`),
      instance: (constructor: any) => createJoiSchemaMock(`${schemaType}.instance`),
    } : {}),
    
    ...(schemaType === 'date' ? {
      min: (date: string | number | Date) => createJoiSchemaMock(`${schemaType}.min`),
      max: (date: string | number | Date) => createJoiSchemaMock(`${schemaType}.max`),
      greater: (date: string | number | Date) => createJoiSchemaMock(`${schemaType}.greater`),
      less: (date: string | number | Date) => createJoiSchemaMock(`${schemaType}.less`),
      iso: () => createJoiSchemaMock(`${schemaType}.iso`),
      timestamp: (type?: 'javascript' | 'unix') => createJoiSchemaMock(`${schemaType}.timestamp`),
    } : {}),
  };
  
  return schema;
}

/**
 * Creates a mock Joi error
 * 
 * @param schemaType - Type of schema that produced the error
 * @param value - Value that failed validation
 * @returns Mock Joi error
 */
function createJoiError(schemaType: string, value: any) {
  const errorMessage = getErrorMessage(`${schemaType}`);
  
  return {
    name: 'ValidationError',
    isJoi: true,
    details: [
      {
        message: errorMessage,
        path: [],
        type: 'any.invalid',
        context: { value },
      },
    ],
    _object: value,
    message: errorMessage,
    annotate: () => errorMessage,
  };
}

/**
 * Mock implementation of Joi
 */
export const Joi = {
  string: () => createJoiSchemaMock('string'),
  number: () => createJoiSchemaMock('number'),
  boolean: () => createJoiSchemaMock('boolean'),
  date: () => createJoiSchemaMock('date'),
  array: () => createJoiSchemaMock('array'),
  object: (schema?: any) => createJoiSchemaMock('object'),
  alternatives: (...alts: any[]) => createJoiSchemaMock('alternatives'),
  any: () => createJoiSchemaMock('any'),
  binary: () => createJoiSchemaMock('binary'),
  func: () => createJoiSchemaMock('function'),
  symbol: () => createJoiSchemaMock('symbol'),
  
  // Validation methods
  validate: (value: any, schema: any, options?: any) => {
    const result = shouldValidationPass('Joi.validate', value, { schema, options });
    trackValidation('Joi.validate', value, result, { schema, options });
    
    if (result) {
      return { value, error: null };
    } else {
      return { value, error: createJoiError('Joi.validate', value) };
    }
  },
  assert: (value: any, schema: any, message?: string) => {
    const result = shouldValidationPass('Joi.assert', value, { schema, message });
    trackValidation('Joi.assert', value, result, { schema, message });
    
    if (!result) {
      throw createJoiError('Joi.assert', value);
    }
  },
  attempt: (value: any, schema: any, message?: string) => {
    const result = shouldValidationPass('Joi.attempt', value, { schema, message });
    trackValidation('Joi.attempt', value, result, { schema, message });
    
    if (!result) {
      throw createJoiError('Joi.attempt', value);
    }
    
    return value;
  },
  
  // Utility methods
  ref: (path: string, options?: any) => ({ isJoiRef: true, path }),
  isRef: (ref: any) => ref && ref.isJoiRef === true,
  isSchema: (schema: any) => schema && schema._type !== undefined,
  expression: (template: string) => ({ isJoiExpression: true, template }),
  reach: (schema: any, path: string) => createJoiSchemaMock('reach'),
};

// ===== Journey-Specific Validation Mocks =====

/**
 * Creates journey-specific validation mocks
 * 
 * @param journey - Journey identifier
 * @returns Journey-specific validation utilities
 */
export function createJourneyValidation(journey: 'health' | 'care' | 'plan') {
  return {
    /**
     * Sets the current journey context for validation
     */
    setContext: () => {
      setValidationJourney(journey);
    },
    
    /**
     * Clears the current journey context
     */
    clearContext: () => {
      setValidationJourney(null);
    },
    
    /**
     * Configures journey-specific validation behavior
     * 
     * @param config - Journey validation configuration
     */
    configure: (config: { defaultResult?: boolean }) => {
      if (!globalConfig.journeyBehavior) {
        globalConfig.journeyBehavior = {};
      }
      globalConfig.journeyBehavior[journey] = config;
    },
    
    /**
     * Configures a specific validator for this journey
     * 
     * @param validatorName - Name of the validator
     * @param config - Validator configuration for this journey
     */
    configureValidator: (validatorName: string, config: { result?: boolean; message?: string }) => {
      if (!validatorConfigs[validatorName]) {
        validatorConfigs[validatorName] = { journeyBehavior: {} };
      }
      if (!validatorConfigs[validatorName].journeyBehavior) {
        validatorConfigs[validatorName].journeyBehavior = {};
      }
      validatorConfigs[validatorName].journeyBehavior![journey] = config;
    },
    
    /**
     * Gets validation calls for this journey
     * 
     * @returns Array of validation calls for this journey
     */
    getValidationCalls: () => {
      return validationCalls.filter(call => call.context?.journey === journey);
    },
  };
}

/**
 * Journey-specific validation mocks
 */
export const healthValidation = createJourneyValidation('health');
export const careValidation = createJourneyValidation('care');
export const planValidation = createJourneyValidation('plan');