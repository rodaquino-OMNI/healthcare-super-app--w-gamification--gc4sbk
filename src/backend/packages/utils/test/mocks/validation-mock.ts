/**
 * Validation Mock Library
 * 
 * Provides mock implementations of validation libraries (class-validator, Yup, Zod, Joi)
 * used across the application. Enables testing of validation-dependent code without the
 * actual validation libraries.
 * 
 * Features:
 * - Configurable validation results
 * - Customizable error messages
 * - Type transformations for comprehensive validation testing
 * - Journey-specific validation rule testing
 */

// ===== Configuration Types =====

/**
 * Global configuration for all validation mocks
 */
export interface ValidationMockConfig {
  /**
   * Whether validation should pass by default
   * @default true
   */
  shouldPassByDefault: boolean;

  /**
   * Default error message when validation fails
   * @default 'Validation failed'
   */
  defaultErrorMessage: string;

  /**
   * Whether to log validation calls for debugging
   * @default false
   */
  debug: boolean;
}

/**
 * Configuration for a specific validation rule
 */
export interface ValidationRuleConfig {
  /**
   * Property name this rule applies to
   */
  property?: string;

  /**
   * Whether validation should pass
   */
  shouldPass: boolean;

  /**
   * Error message when validation fails
   */
  errorMessage?: string;

  /**
   * Journey context for journey-specific validation
   */
  journeyContext?: 'health' | 'care' | 'plan' | 'all';
}

// ===== Global Configuration =====

/**
 * Global validation mock configuration
 */
let globalConfig: ValidationMockConfig = {
  shouldPassByDefault: true,
  defaultErrorMessage: 'Validation failed',
  debug: false,
};

/**
 * Map of validation rules by property name
 */
const validationRules = new Map<string, ValidationRuleConfig>();

/**
 * Configure global validation mock behavior
 */
export function configureValidationMock(config: Partial<ValidationMockConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Configure validation behavior for a specific property
 */
export function configureValidationRule(config: ValidationRuleConfig): void {
  const key = config.property || '*';
  validationRules.set(key, config);
}

/**
 * Reset all validation configurations to defaults
 */
export function resetValidationMock(): void {
  globalConfig = {
    shouldPassByDefault: true,
    defaultErrorMessage: 'Validation failed',
    debug: false,
  };
  validationRules.clear();
}

/**
 * Determine if validation should pass for a property
 */
function shouldValidationPass(property?: string, value?: any): boolean {
  if (property && validationRules.has(property)) {
    return validationRules.get(property)!.shouldPass;
  }
  
  // Check for wildcard rule
  if (validationRules.has('*')) {
    return validationRules.get('*')!.shouldPass;
  }
  
  return globalConfig.shouldPassByDefault;
}

/**
 * Get error message for a failed validation
 */
function getErrorMessage(property?: string): string {
  if (property && validationRules.has(property)) {
    return validationRules.get(property)!.errorMessage || globalConfig.defaultErrorMessage;
  }
  
  // Check for wildcard rule
  if (validationRules.has('*') && validationRules.get('*')!.errorMessage) {
    return validationRules.get('*')!.errorMessage!;
  }
  
  return globalConfig.defaultErrorMessage;
}

// ===== class-validator Mock =====

/**
 * Mock implementation of class-validator's ValidationError
 */
export class ValidationError {
  constructor(
    public property: string,
    public constraints: Record<string, string>,
    public children: ValidationError[] = []
  ) {}
}

/**
 * Create a decorator factory function
 */
function createValidatorDecorator(name: string) {
  return function(...args: any[]) {
    return function(target: any, propertyKey: string) {
      if (globalConfig.debug) {
        console.log(`@${name} applied to ${propertyKey}`, args);
      }
      // This is just a mock decorator that doesn't do anything at runtime
      // The actual validation happens when validate() is called
    };
  };
}

/**
 * Mock implementation of class-validator's validate function
 */
export function validate(object: any, options?: any): Promise<ValidationError[]> {
  if (globalConfig.debug) {
    console.log('validate() called with:', object, options);
  }
  
  const errors: ValidationError[] = [];
  
  // Check each property in the object
  for (const prop in object) {
    if (!shouldValidationPass(prop, object[prop])) {
      const errorMessage = getErrorMessage(prop);
      errors.push(new ValidationError(prop, { [prop]: errorMessage }));
    }
  }
  
  return Promise.resolve(errors);
}

/**
 * Mock implementation of class-validator's validateOrReject function
 */
export function validateOrReject(object: any, options?: any): Promise<void> {
  return validate(object, options).then(errors => {
    if (errors.length > 0) {
      return Promise.reject(errors);
    }
    return Promise.resolve();
  });
}

/**
 * Mock implementation of class-validator's validateSync function
 */
export function validateSync(object: any, options?: any): ValidationError[] {
  if (globalConfig.debug) {
    console.log('validateSync() called with:', object, options);
  }
  
  const errors: ValidationError[] = [];
  
  // Check each property in the object
  for (const prop in object) {
    if (!shouldValidationPass(prop, object[prop])) {
      const errorMessage = getErrorMessage(prop);
      errors.push(new ValidationError(prop, { [prop]: errorMessage }));
    }
  }
  
  return errors;
}

// Common class-validator decorators
export const IsString = createValidatorDecorator('IsString');
export const IsEmail = createValidatorDecorator('IsEmail');
export const IsNumber = createValidatorDecorator('IsNumber');
export const IsBoolean = createValidatorDecorator('IsBoolean');
export const IsDate = createValidatorDecorator('IsDate');
export const IsOptional = createValidatorDecorator('IsOptional');
export const IsNotEmpty = createValidatorDecorator('IsNotEmpty');
export const MinLength = createValidatorDecorator('MinLength');
export const MaxLength = createValidatorDecorator('MaxLength');
export const Min = createValidatorDecorator('Min');
export const Max = createValidatorDecorator('Max');
export const IsPositive = createValidatorDecorator('IsPositive');
export const IsNegative = createValidatorDecorator('IsNegative');
export const Contains = createValidatorDecorator('Contains');
export const IsInt = createValidatorDecorator('IsInt');
export const IsArray = createValidatorDecorator('IsArray');
export const ArrayMinSize = createValidatorDecorator('ArrayMinSize');
export const ArrayMaxSize = createValidatorDecorator('ArrayMaxSize');
export const IsEnum = createValidatorDecorator('IsEnum');
export const IsFQDN = createValidatorDecorator('IsFQDN');
export const IsUrl = createValidatorDecorator('IsUrl');
export const IsUUID = createValidatorDecorator('IsUUID');
export const Length = createValidatorDecorator('Length');
export const Matches = createValidatorDecorator('Matches');
export const IsDefined = createValidatorDecorator('IsDefined');
export const ValidateNested = createValidatorDecorator('ValidateNested');

// ===== Zod Mock =====

/**
 * Mock implementation of Zod's ZodError
 */
export class ZodError extends Error {
  issues: Array<{ path: string[]; message: string; code: string }>;
  
  constructor(issues: Array<{ path: string[]; message: string; code: string }>) {
    super('Validation failed');
    this.name = 'ZodError';
    this.issues = issues;
  }
  
  static create(issues: Array<{ path: string[]; message: string; code: string }>): ZodError {
    return new ZodError(issues);
  }
}

/**
 * Base class for all Zod schema types
 */
class ZodType<T> {
  _type!: T;
  
  constructor(private typeName: string) {}
  
  parse(data: unknown): T {
    if (globalConfig.debug) {
      console.log(`Zod ${this.typeName}.parse() called with:`, data);
    }
    
    const property = typeof data === 'object' && data !== null ? Object.keys(data)[0] : undefined;
    
    if (!shouldValidationPass(property, data)) {
      const errorMessage = getErrorMessage(property);
      throw ZodError.create([{ 
        path: property ? [property] : [], 
        message: errorMessage, 
        code: 'invalid_type' 
      }]);
    }
    
    return data as T;
  }
  
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: ZodError } {
    try {
      const result = this.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, error };
      }
      throw error;
    }
  }
  
  optional(): ZodType<T | undefined> {
    return new ZodType<T | undefined>(`${this.typeName} | undefined`);
  }
  
  nullable(): ZodType<T | null> {
    return new ZodType<T | null>(`${this.typeName} | null`);
  }
  
  array(): ZodType<T[]> {
    return new ZodType<T[]>(`${this.typeName}[]`);
  }
  
  // Common validation methods
  min(value: number, message?: string): this { return this; }
  max(value: number, message?: string): this { return this; }
  length(value: number, message?: string): this { return this; }
  email(message?: string): this { return this; }
  url(message?: string): this { return this; }
  uuid(message?: string): this { return this; }
  regex(pattern: RegExp, message?: string): this { return this; }
  startsWith(value: string, message?: string): this { return this; }
  endsWith(value: string, message?: string): this { return this; }
  transform<U>(fn: (arg: T) => U): ZodType<U> {
    return new ZodType<U>('transformed');
  }
}

/**
 * Mock implementation of Zod
 */
export const z = {
  string: () => new ZodType<string>('string'),
  number: () => new ZodType<number>('number'),
  boolean: () => new ZodType<boolean>('boolean'),
  date: () => new ZodType<Date>('date'),
  null: () => new ZodType<null>('null'),
  undefined: () => new ZodType<undefined>('undefined'),
  any: () => new ZodType<any>('any'),
  unknown: () => new ZodType<unknown>('unknown'),
  void: () => new ZodType<void>('void'),
  never: () => new ZodType<never>('never'),
  
  array: <T>(schema?: ZodType<T>) => new ZodType<T[]>('array'),
  
  object: <T extends Record<string, any>>(shape?: Record<string, ZodType<any>>) => {
    const obj = new ZodType<T>('object');
    
    // Add additional methods specific to object schemas
    Object.assign(obj, {
      shape: <S extends Record<string, ZodType<any>>>(shape: S) => obj,
      extend: <U extends Record<string, ZodType<any>>>(extension: U) => obj,
      pick: <K extends keyof T>(keys: K[]) => obj,
      omit: <K extends keyof T>(keys: K[]) => obj,
      partial: () => obj,
      deepPartial: () => obj,
      required: () => obj,
      strict: () => obj,
      passthrough: () => obj,
      catchall: (schema: ZodType<any>) => obj,
    });
    
    return obj;
  },
  
  union: <T extends [ZodType<any>, ...ZodType<any>[]]>(types: T) => {
    return new ZodType<T[number]['_type']>('union');
  },
  
  intersection: <T extends ZodType<any>, U extends ZodType<any>>(a: T, b: U) => {
    return new ZodType<T['_type'] & U['_type']>('intersection');
  },
  
  literal: <T extends string | number | boolean | null | undefined>(value: T) => {
    return new ZodType<T>('literal');
  },
  
  enum: <T extends [string, ...string[]]>(values: T) => {
    return new ZodType<T[number]>('enum');
  },
  
  record: <K extends ZodType<string | number | symbol>, V extends ZodType<any>>(
    key: K,
    value: V
  ) => {
    return new ZodType<Record<K['_type'], V['_type']>>('record');
  },
  
  function: <Args extends any[], Return>() => {
    return new ZodType<(...args: Args) => Return>('function');
  },
  
  lazy: <T>(getter: () => ZodType<T>) => {
    return new ZodType<T>('lazy');
  },
  
  promise: <T>(schema: ZodType<T>) => {
    return new ZodType<Promise<T>>('promise');
  },
  
  ZodError,
};

// ===== Joi Mock =====

/**
 * Mock implementation of Joi's ValidationError
 */
export class JoiValidationError extends Error {
  details: Array<{ message: string; path: string[]; type: string }>;
  
  constructor(message: string, details: Array<{ message: string; path: string[]; type: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Base class for all Joi schema types
 */
class JoiSchema<T> {
  constructor(private typeName: string) {}
  
  validate(value: any, options?: any): { value: T; error?: JoiValidationError } {
    if (globalConfig.debug) {
      console.log(`Joi ${this.typeName}.validate() called with:`, value, options);
    }
    
    const property = typeof value === 'object' && value !== null ? Object.keys(value)[0] : undefined;
    
    if (!shouldValidationPass(property, value)) {
      const errorMessage = getErrorMessage(property);
      const error = new JoiValidationError(errorMessage, [
        { message: errorMessage, path: property ? [property] : [], type: 'any.invalid' }
      ]);
      return { value, error };
    }
    
    return { value: value as T };
  }
  
  // Common validation methods
  required(): this { return this; }
  optional(): this { return this; }
  allow(...values: any[]): this { return this; }
  valid(...values: any[]): this { return this; }
  invalid(...values: any[]): this { return this; }
  default(value: any): this { return this; }
  description(desc: string): this { return this; }
  notes(notes: string | string[]): this { return this; }
  tags(tags: string | string[]): this { return this; }
  meta(meta: object): this { return this; }
  example(example: any): this { return this; }
  unit(name: string): this { return this; }
  options(options: object): this { return this; }
  strict(isStrict?: boolean): this { return this; }
  concat(schema: JoiSchema<any>): this { return this; }
  when(ref: string | object, options: object): this { return this; }
  label(name: string): this { return this; }
  raw(isRaw?: boolean): this { return this; }
  warning(code: string, context?: object): this { return this; }
  error(err: Error): this { return this; }
  extend(...extensions: object[]): this { return this; }
}

/**
 * Mock implementation of Joi's string schema
 */
class JoiStringSchema extends JoiSchema<string> {
  constructor() {
    super('string');
  }
  
  // String-specific validation methods
  min(limit: number): this { return this; }
  max(limit: number): this { return this; }
  length(limit: number): this { return this; }
  pattern(regex: RegExp, name?: string): this { return this; }
  regex(pattern: RegExp, name?: string): this { return this; }
  alphanum(): this { return this; }
  token(): this { return this; }
  email(options?: object): this { return this; }
  ip(options?: object): this { return this; }
  uri(options?: object): this { return this; }
  guid(options?: object): this { return this; }
  hex(options?: object): this { return this; }
  base64(options?: object): this { return this; }
  dataUri(options?: object): this { return this; }
  hostname(): this { return this; }
  normalize(form?: string): this { return this; }
  lowercase(): this { return this; }
  uppercase(): this { return this; }
  trim(): this { return this; }
  replace(pattern: RegExp, replacement: string): this { return this; }
n  truncate(enabled?: boolean): this { return this; }
  isoDate(): this { return this; }
  isoDuration(): this { return this; }
}

/**
 * Mock implementation of Joi's number schema
 */
class JoiNumberSchema extends JoiSchema<number> {
  constructor() {
    super('number');
  }
  
  // Number-specific validation methods
  min(limit: number): this { return this; }
  max(limit: number): this { return this; }
  greater(limit: number): this { return this; }
  less(limit: number): this { return this; }
  integer(): this { return this; }
  precision(limit: number): this { return this; }
  multiple(base: number): this { return this; }
  positive(): this { return this; }
  negative(): this { return this; }
  port(): this { return this; }
}

/**
 * Mock implementation of Joi's boolean schema
 */
class JoiBooleanSchema extends JoiSchema<boolean> {
  constructor() {
    super('boolean');
  }
  
  // Boolean-specific validation methods
  truthy(...values: any[]): this { return this; }
  falsy(...values: any[]): this { return this; }
  sensitive(enabled?: boolean): this { return this; }
}

/**
 * Mock implementation of Joi's date schema
 */
class JoiDateSchema extends JoiSchema<Date> {
  constructor() {
    super('date');
  }
  
  // Date-specific validation methods
  min(date: Date | string): this { return this; }
  max(date: Date | string): this { return this; }
  greater(date: Date | string): this { return this; }
  less(date: Date | string): this { return this; }
  iso(): this { return this; }
  timestamp(type?: 'javascript' | 'unix'): this { return this; }
}

/**
 * Mock implementation of Joi's array schema
 */
class JoiArraySchema<T> extends JoiSchema<T[]> {
  constructor() {
    super('array');
  }
  
  // Array-specific validation methods
  items(...types: JoiSchema<any>[]): this { return this; }
  min(limit: number): this { return this; }
  max(limit: number): this { return this; }
  length(limit: number): this { return this; }
  unique(comparator?: string | Function): this { return this; }
  has(schema: JoiSchema<any>): this { return this; }
  sparse(enabled?: boolean): this { return this; }
  single(enabled?: boolean): this { return this; }
  ordered(...types: JoiSchema<any>[]): this { return this; }
}

/**
 * Mock implementation of Joi's object schema
 */
class JoiObjectSchema<T extends object> extends JoiSchema<T> {
  constructor() {
    super('object');
  }
  
  // Object-specific validation methods
  keys(schema?: object): this { return this; }
  append(schema?: object): this { return this; }
  min(limit: number): this { return this; }
  max(limit: number): this { return this; }
  length(limit: number): this { return this; }
  pattern(pattern: RegExp | JoiSchema<any>, schema: JoiSchema<any>): this { return this; }
  and(...peers: string[]): this { return this; }
  nand(...peers: string[]): this { return this; }
  or(...peers: string[]): this { return this; }
  xor(...peers: string[]): this { return this; }
  oxor(...peers: string[]): this { return this; }
  with(key: string, peers: string | string[]): this { return this; }
  without(key: string, peers: string | string[]): this { return this; }
  rename(from: string, to: string, options?: object): this { return this; }
  assert(ref: string | object, schema: JoiSchema<any>, message?: string): this { return this; }
  unknown(allow?: boolean): this { return this; }
  type(constructor: Function, name?: string): this { return this; }
  schema(): this { return this; }
  requiredKeys(...children: string[]): this { return this; }
  optionalKeys(...children: string[]): this { return this; }
  forbiddenKeys(...children: string[]): this { return this; }
}

/**
 * Mock implementation of Joi
 */
export const Joi = {
  string: () => new JoiStringSchema(),
  number: () => new JoiNumberSchema(),
  boolean: () => new JoiBooleanSchema(),
  date: () => new JoiDateSchema(),
  array: () => new JoiArraySchema(),
  object: <T extends object>() => new JoiObjectSchema<T>(),
  
  any: () => new JoiSchema<any>('any'),
  alternatives: (...alts: JoiSchema<any>[]) => new JoiSchema<any>('alternatives'),
  ref: (key: string, options?: object) => ({ key, options }),
  validate: <T>(value: any, schema: JoiSchema<T>, options?: object) => schema.validate(value, options),
  
  ValidationError: JoiValidationError,
};

// ===== Yup Mock =====

/**
 * Mock implementation of Yup's ValidationError
 */
export class YupValidationError extends Error {
  path?: string;
  errors: string[];
  inner: YupValidationError[];
  params: Record<string, any>;
  value: any;
  
  constructor(message: string, errors: string[] = [], path?: string, inner: YupValidationError[] = [], params: Record<string, any> = {}, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.path = path;
    this.errors = errors;
    this.inner = inner;
    this.params = params;
    this.value = value;
  }
}

/**
 * Base class for all Yup schema types
 */
class YupSchema<T> {
  constructor(private typeName: string) {}
  
  validate(value: any, options?: any): Promise<T> {
    if (globalConfig.debug) {
      console.log(`Yup ${this.typeName}.validate() called with:`, value, options);
    }
    
    const property = typeof value === 'object' && value !== null ? Object.keys(value)[0] : undefined;
    
    if (!shouldValidationPass(property, value)) {
      const errorMessage = getErrorMessage(property);
      const error = new YupValidationError(
        errorMessage,
        [errorMessage],
        property,
        [],
        {},
        value
      );
      return Promise.reject(error);
    }
    
    return Promise.resolve(value as T);
  }
  
  validateSync(value: any, options?: any): T {
    if (globalConfig.debug) {
      console.log(`Yup ${this.typeName}.validateSync() called with:`, value, options);
    }
    
    const property = typeof value === 'object' && value !== null ? Object.keys(value)[0] : undefined;
    
    if (!shouldValidationPass(property, value)) {
      const errorMessage = getErrorMessage(property);
      const error = new YupValidationError(
        errorMessage,
        [errorMessage],
        property,
        [],
        {},
        value
      );
      throw error;
    }
    
    return value as T;
  }
  
  isValid(value: any, options?: any): Promise<boolean> {
    return this.validate(value, options)
      .then(() => true)
      .catch(() => false);
  }
  
  isValidSync(value: any, options?: any): boolean {
    try {
      this.validateSync(value, options);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  cast(value: any, options?: any): T {
    return value as T;
  }
  
  // Common validation methods
  required(message?: string): this { return this; }
  notRequired(): this { return this; }
  nullable(isNullable?: boolean): this { return this; }
  default(value: any): this { return this; }
  oneOf(values: any[], message?: string): this { return this; }
  notOneOf(values: any[], message?: string): this { return this; }
  when(keys: string | string[], builder: Function): this { return this; }
  typeError(message: string): this { return this; }
  defined(message?: string): this { return this; }
  strict(isStrict?: boolean): this { return this; }
  strip(strip?: boolean): this { return this; }
  test(name: string, message: string, test: Function): this { return this; }
  transform(fn: Function): this { return this; }
}

/**
 * Mock implementation of Yup's string schema
 */
class YupStringSchema extends YupSchema<string> {
  constructor() {
    super('string');
  }
  
  // String-specific validation methods
  min(limit: number, message?: string): this { return this; }
  max(limit: number, message?: string): this { return this; }
  length(limit: number, message?: string): this { return this; }
  matches(regex: RegExp, message?: string): this { return this; }
  email(message?: string): this { return this; }
  url(message?: string): this { return this; }
  uuid(message?: string): this { return this; }
  ensure(): this { return this; }
  trim(message?: string): this { return this; }
  lowercase(message?: string): this { return this; }
  uppercase(message?: string): this { return this; }
}

/**
 * Mock implementation of Yup's number schema
 */
class YupNumberSchema extends YupSchema<number> {
  constructor() {
    super('number');
  }
  
  // Number-specific validation methods
  min(limit: number, message?: string): this { return this; }
  max(limit: number, message?: string): this { return this; }
  lessThan(max: number, message?: string): this { return this; }
  moreThan(min: number, message?: string): this { return this; }
  positive(message?: string): this { return this; }
  negative(message?: string): this { return this; }
  integer(message?: string): this { return this; }
  round(type: 'floor' | 'ceil' | 'trunc' | 'round'): this { return this; }
}

/**
 * Mock implementation of Yup's boolean schema
 */
class YupBooleanSchema extends YupSchema<boolean> {
  constructor() {
    super('boolean');
  }
  
  // Boolean-specific validation methods
  isTrue(message?: string): this { return this; }
  isFalse(message?: string): this { return this; }
}

/**
 * Mock implementation of Yup's date schema
 */
class YupDateSchema extends YupSchema<Date> {
  constructor() {
    super('date');
  }
  
  // Date-specific validation methods
  min(limit: Date | string, message?: string): this { return this; }
  max(limit: Date | string, message?: string): this { return this; }
}

/**
 * Mock implementation of Yup's array schema
 */
class YupArraySchema<T> extends YupSchema<T[]> {
  constructor() {
    super('array');
  }
  
  // Array-specific validation methods
  of<U>(schema: YupSchema<U>): YupArraySchema<U> { return this as unknown as YupArraySchema<U>; }
  min(limit: number, message?: string): this { return this; }
  max(limit: number, message?: string): this { return this; }
  length(limit: number, message?: string): this { return this; }
  ensure(): this { return this; }
  compact(rejector?: (value: any) => boolean): this { return this; }
}

/**
 * Mock implementation of Yup's object schema
 */
class YupObjectSchema<T extends object> extends YupSchema<T> {
  constructor() {
    super('object');
  }
  
  // Object-specific validation methods
  shape<U extends object>(schema: Record<string, YupSchema<any>>, noSortEdges?: Array<[string, string]>): YupObjectSchema<U> { 
    return this as unknown as YupObjectSchema<U>; 
  }
  
  pick<U extends keyof T>(keys: U[]): YupObjectSchema<Pick<T, U>> { 
    return this as unknown as YupObjectSchema<Pick<T, U>>; 
  }
  
  omit<U extends keyof T>(keys: U[]): YupObjectSchema<Omit<T, U>> { 
    return this as unknown as YupObjectSchema<Omit<T, U>>; 
  }
  
  from(fromKey: string, toKey: string, alias?: boolean): this { return this; }
  noUnknown(noAllow?: boolean, message?: string): this { return this; }
  camelCase(): this { return this; }
  constantCase(): this { return this; }
}

/**
 * Mock implementation of Yup
 */
export const yup = {
  string: () => new YupStringSchema(),
  number: () => new YupNumberSchema(),
  boolean: () => new YupBooleanSchema(),
  date: () => new YupDateSchema(),
  array: <T>() => new YupArraySchema<T>(),
  object: <T extends object>() => new YupObjectSchema<T>(),
  
  mixed: <T>() => new YupSchema<T>('mixed'),
  ref: (path: string, options?: object) => ({ path, options }),
  lazy: (fn: (value: any) => YupSchema<any>) => new YupSchema<any>('lazy'),
  
  setLocale: (locale: object) => {},
  ValidationError: YupValidationError,
};

// Export all mocks
export default {
  // class-validator
  validate,
  validateOrReject,
  validateSync,
  ValidationError,
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsDate,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsPositive,
  IsNegative,
  Contains,
  IsInt,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsFQDN,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  IsDefined,
  ValidateNested,
  
  // Zod
  z,
  ZodError,
  
  // Joi
  Joi,
  JoiValidationError,
  
  // Yup
  yup,
  YupValidationError,
  
  // Configuration
  configureValidationMock,
  configureValidationRule,
  resetValidationMock,
};