import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';
import { z } from 'zod';
import { validate, validateSync, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Interface for assertion options
 */
export interface AssertionOptions {
  /** Whether to throw an error on assertion failure */
  throwOnFailure?: boolean;
  /** Custom error message for assertion failures */
  message?: string;
  /** Whether to include detailed error information */
  detailed?: boolean;
  /** Journey context for journey-specific assertions */
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification';
}

/**
 * Interface for assertion result
 */
export interface AssertionResult {
  /** Whether the assertion passed */
  passed: boolean;
  /** Error message if the assertion failed */
  message?: string;
  /** Detailed error information if available */
  details?: any;
  /** Path to the property that failed validation */
  path?: string;
  /** Expected value in case of comparison failure */
  expected?: any;
  /** Actual value in case of comparison failure */
  actual?: any;
}

/**
 * Interface for entity comparison options
 */
export interface EntityComparisonOptions extends AssertionOptions {
  /** Properties to exclude from comparison */
  exclude?: string[];
  /** Properties to include in comparison (if specified, only these will be compared) */
  include?: string[];
  /** Whether to ignore undefined properties */
  ignoreUndefined?: boolean;
  /** Whether to ignore null properties */
  ignoreNull?: boolean;
  /** Whether to perform deep comparison of nested objects */
  deep?: boolean;
  /** Custom comparator functions for specific properties */
  comparators?: Record<string, (a: any, b: any) => boolean>;
}

/**
 * Interface for relationship assertion options
 */
export interface RelationshipAssertionOptions extends AssertionOptions {
  /** The relation property name */
  relationProperty: string;
  /** The foreign key property name */
  foreignKeyProperty?: string;
  /** Whether to check for bidirectional relationship */
  bidirectional?: boolean;
  /** The reverse relation property name (for bidirectional relationships) */
  reverseRelationProperty?: string;
}

/**
 * Interface for schema validation options
 */
export interface SchemaValidationOptions extends AssertionOptions {
  /** Whether to abort validation on the first error */
  abortEarly?: boolean;
  /** Whether to strip unknown properties */
  stripUnknown?: boolean;
  /** Custom error map for Zod validation */
  errorMap?: z.ZodErrorMap;
}

/**
 * Utility class for database assertions in tests
 */
export class AssertionTestUtils {
  /**
   * Creates a new instance of AssertionTestUtils
   * 
   * @param prisma The PrismaService or PrismaClient instance to use for assertions
   */
  constructor(private readonly prisma: PrismaService | PrismaClient) {}

  /**
   * Asserts that a condition is true
   * 
   * @param condition The condition to check
   * @param options Assertion options
   * @returns Assertion result
   */
  assert(condition: boolean, options: AssertionOptions = {}): AssertionResult {
    const { throwOnFailure = false, message = 'Assertion failed', detailed = false } = options;
    
    if (condition) {
      return { passed: true };
    }
    
    const result: AssertionResult = {
      passed: false,
      message,
    };
    
    if (throwOnFailure) {
      throw new Error(message);
    }
    
    return result;
  }

  /**
   * Asserts that two values are equal
   * 
   * @param actual The actual value
   * @param expected The expected value
   * @param options Assertion options
   * @returns Assertion result
   */
  assertEqual(actual: any, expected: any, options: AssertionOptions = {}): AssertionResult {
    const { throwOnFailure = false, message = 'Values are not equal', detailed = false } = options;
    
    const isEqual = this.deepEqual(actual, expected);
    
    if (isEqual) {
      return { passed: true };
    }
    
    const result: AssertionResult = {
      passed: false,
      message,
      expected,
      actual,
    };
    
    if (detailed) {
      result.details = this.findDifferences(actual, expected);
    }
    
    if (throwOnFailure) {
      throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
    
    return result;
  }

  /**
   * Performs a deep equality check between two values
   * 
   * @param a First value
   * @param b Second value
   * @returns Whether the values are deeply equal
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a === null || b === null) return a === b;
    if (a === undefined || b === undefined) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    if (Array.isArray(a) || Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }

  /**
   * Finds differences between two objects
   * 
   * @param actual The actual object
   * @param expected The expected object
   * @param path Current property path (for nested objects)
   * @returns Object containing differences
   */
  private findDifferences(actual: any, expected: any, path: string = ''): any {
    if (actual === expected) return {};
    
    if (actual === null || expected === null || actual === undefined || expected === undefined) {
      return { [path || 'value']: { actual, expected } };
    }
    
    if (typeof actual !== typeof expected) {
      return { [path || 'value']: { actual: `${actual} (${typeof actual})`, expected: `${expected} (${typeof expected})` } };
    }
    
    if (typeof actual !== 'object') {
      return { [path || 'value']: { actual, expected } };
    }
    
    const differences: Record<string, any> = {};
    
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) {
        differences[`${path || 'array'}.length`] = { actual: actual.length, expected: expected.length };
      }
      
      const minLength = Math.min(actual.length, expected.length);
      for (let i = 0; i < minLength; i++) {
        const itemDiffs = this.findDifferences(actual[i], expected[i], path ? `${path}[${i}]` : `[${i}]`);
        Object.assign(differences, itemDiffs);
      }
      
      return differences;
    }
    
    if (Array.isArray(actual) || Array.isArray(expected)) {
      return { [path || 'value']: { actual, expected, message: 'Type mismatch: one is array, other is not' } };
    }
    
    const keysA = Object.keys(actual);
    const keysB = Object.keys(expected);
    
    // Find keys in expected but not in actual
    for (const key of keysB) {
      if (!keysA.includes(key)) {
        differences[path ? `${path}.${key}` : key] = { actual: undefined, expected: expected[key], message: 'Missing property' };
      }
    }
    
    // Find keys in actual but not in expected
    for (const key of keysA) {
      if (!keysB.includes(key)) {
        differences[path ? `${path}.${key}` : key] = { actual: actual[key], expected: undefined, message: 'Unexpected property' };
      }
    }
    
    // Compare values for keys in both objects
    for (const key of keysA) {
      if (keysB.includes(key)) {
        const valueDiffs = this.findDifferences(actual[key], expected[key], path ? `${path}.${key}` : key);
        Object.assign(differences, valueDiffs);
      }
    }
    
    return differences;
  }

  /**
   * Asserts that an entity matches the expected properties
   * 
   * @param actual The actual entity
   * @param expected The expected properties
   * @param options Comparison options
   * @returns Assertion result
   */
  assertEntityEquals(actual: any, expected: any, options: EntityComparisonOptions = {}): AssertionResult {
    const {
      throwOnFailure = false,
      message = 'Entity does not match expected properties',
      detailed = false,
      exclude = [],
      include,
      ignoreUndefined = true,
      ignoreNull = false,
      deep = true,
      comparators = {},
    } = options;
    
    if (!actual) {
      const result: AssertionResult = {
        passed: false,
        message: 'Actual entity is null or undefined',
        expected,
        actual,
      };
      
      if (throwOnFailure) {
        throw new Error(result.message);
      }
      
      return result;
    }
    
    // Create a filtered copy of the expected object
    const filteredExpected: Record<string, any> = {};
    const propertiesToCompare = include || Object.keys(expected);
    
    for (const key of propertiesToCompare) {
      if (!exclude.includes(key) && expected[key] !== undefined) {
        filteredExpected[key] = expected[key];
      }
    }
    
    // Create a filtered copy of the actual object
    const filteredActual: Record<string, any> = {};
    
    for (const key of Object.keys(filteredExpected)) {
      if (actual[key] !== undefined || !ignoreUndefined) {
        if (actual[key] !== null || !ignoreNull) {
          filteredActual[key] = actual[key];
        }
      }
    }
    
    // Compare properties using custom comparators if provided
    const differences: Record<string, { actual: any; expected: any }> = {};
    
    for (const key of Object.keys(filteredExpected)) {
      if (key in filteredActual) {
        const actualValue = filteredActual[key];
        const expectedValue = filteredExpected[key];
        
        let isEqual: boolean;
        
        if (key in comparators) {
          // Use custom comparator
          isEqual = comparators[key](actualValue, expectedValue);
        } else if (deep && typeof actualValue === 'object' && typeof expectedValue === 'object' && actualValue !== null && expectedValue !== null) {
          // Deep comparison for objects
          isEqual = this.deepEqual(actualValue, expectedValue);
        } else {
          // Simple equality for primitives
          isEqual = actualValue === expectedValue;
        }
        
        if (!isEqual) {
          differences[key] = { actual: actualValue, expected: expectedValue };
        }
      } else {
        differences[key] = { actual: undefined, expected: filteredExpected[key] };
      }
    }
    
    const hasDifferences = Object.keys(differences).length > 0;
    
    if (!hasDifferences) {
      return { passed: true };
    }
    
    const result: AssertionResult = {
      passed: false,
      message,
      details: differences,
      expected: filteredExpected,
      actual: filteredActual,
    };
    
    if (throwOnFailure) {
      throw new Error(`${message}\nDifferences: ${JSON.stringify(differences, null, 2)}`);
    }
    
    return result;
  }

  /**
   * Asserts that an entity exists in the database
   * 
   * @param model The Prisma model name
   * @param id The entity ID
   * @param options Assertion options
   * @returns Assertion result with the entity if found
   */
  async assertEntityExists(model: string, id: string | number, options: AssertionOptions = {}): Promise<AssertionResult & { entity?: any }> {
    const { throwOnFailure = false, message = `Entity ${model} with ID ${id} does not exist`, detailed = false } = options;
    
    try {
      const entity = await this.prisma[model].findUnique({
        where: { id },
      });
      
      if (entity) {
        return { passed: true, entity };
      }
      
      const result: AssertionResult & { entity?: any } = {
        passed: false,
        message,
      };
      
      if (throwOnFailure) {
        throw new Error(message);
      }
      
      return result;
    } catch (error) {
      const result: AssertionResult & { entity?: any } = {
        passed: false,
        message: `Error checking if entity exists: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  /**
   * Asserts that an entity does not exist in the database
   * 
   * @param model The Prisma model name
   * @param id The entity ID
   * @param options Assertion options
   * @returns Assertion result
   */
  async assertEntityNotExists(model: string, id: string | number, options: AssertionOptions = {}): Promise<AssertionResult> {
    const { throwOnFailure = false, message = `Entity ${model} with ID ${id} exists but should not`, detailed = false } = options;
    
    try {
      const entity = await this.prisma[model].findUnique({
        where: { id },
      });
      
      if (!entity) {
        return { passed: true };
      }
      
      const result: AssertionResult = {
        passed: false,
        message,
        actual: entity,
      };
      
      if (throwOnFailure) {
        throw new Error(message);
      }
      
      return result;
    } catch (error) {
      const result: AssertionResult = {
        passed: false,
        message: `Error checking if entity does not exist: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  /**
   * Asserts that entities matching a filter exist in the database
   * 
   * @param model The Prisma model name
   * @param where The filter criteria
   * @param expectedCount The expected number of matching entities (if specified)
   * @param options Assertion options
   * @returns Assertion result with the matching entities
   */
  async assertEntitiesExist(
    model: string,
    where: Record<string, any>,
    expectedCount?: number,
    options: AssertionOptions = {},
  ): Promise<AssertionResult & { entities?: any[] }> {
    const {
      throwOnFailure = false,
      message = `No entities of type ${model} match the criteria`,
      detailed = false,
    } = options;
    
    try {
      const entities = await this.prisma[model].findMany({
        where,
      });
      
      if (entities.length === 0) {
        const result: AssertionResult & { entities?: any[] } = {
          passed: false,
          message,
          details: { where },
        };
        
        if (throwOnFailure) {
          throw new Error(message);
        }
        
        return result;
      }
      
      if (expectedCount !== undefined && entities.length !== expectedCount) {
        const countMessage = `Expected ${expectedCount} entities but found ${entities.length}`;
        const result: AssertionResult & { entities?: any[] } = {
          passed: false,
          message: countMessage,
          details: { where, expectedCount, actualCount: entities.length },
          entities,
        };
        
        if (throwOnFailure) {
          throw new Error(countMessage);
        }
        
        return result;
      }
      
      return { passed: true, entities };
    } catch (error) {
      const result: AssertionResult & { entities?: any[] } = {
        passed: false,
        message: `Error checking if entities exist: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  /**
   * Asserts that a relationship exists between two entities
   * 
   * @param model The Prisma model name for the parent entity
   * @param id The parent entity ID
   * @param relatedModel The Prisma model name for the related entity
   * @param relatedId The related entity ID
   * @param options Relationship assertion options
   * @returns Assertion result
   */
  async assertRelationshipExists(
    model: string,
    id: string | number,
    relatedModel: string,
    relatedId: string | number,
    options: RelationshipAssertionOptions,
  ): Promise<AssertionResult> {
    const {
      throwOnFailure = false,
      message = `Relationship between ${model}:${id} and ${relatedModel}:${relatedId} does not exist`,
      detailed = false,
      relationProperty,
      foreignKeyProperty,
      bidirectional = false,
      reverseRelationProperty,
    } = options;
    
    try {
      // Check if the parent entity has the related entity
      const parentEntity = await this.prisma[model].findUnique({
        where: { id },
        include: {
          [relationProperty]: true,
        },
      });
      
      if (!parentEntity) {
        const result: AssertionResult = {
          passed: false,
          message: `Parent entity ${model}:${id} does not exist`,
        };
        
        if (throwOnFailure) {
          throw new Error(result.message);
        }
        
        return result;
      }
      
      const relatedEntity = parentEntity[relationProperty];
      let relationExists = false;
      
      if (Array.isArray(relatedEntity)) {
        // One-to-many or many-to-many relationship
        relationExists = relatedEntity.some(entity => entity.id === relatedId);
      } else if (relatedEntity) {
        // One-to-one relationship
        relationExists = relatedEntity.id === relatedId;
      }
      
      if (!relationExists) {
        const result: AssertionResult = {
          passed: false,
          message,
          details: {
            parentEntity: { id: parentEntity.id },
            relationProperty,
            relatedEntity: relatedEntity,
            expectedRelatedId: relatedId,
          },
        };
        
        if (throwOnFailure) {
          throw new Error(message);
        }
        
        return result;
      }
      
      // If bidirectional, check the reverse relationship
      if (bidirectional && reverseRelationProperty) {
        const relatedEntityWithParent = await this.prisma[relatedModel].findUnique({
          where: { id: relatedId },
          include: {
            [reverseRelationProperty]: true,
          },
        });
        
        if (!relatedEntityWithParent) {
          const result: AssertionResult = {
            passed: false,
            message: `Related entity ${relatedModel}:${relatedId} does not exist`,
          };
          
          if (throwOnFailure) {
            throw new Error(result.message);
          }
          
          return result;
        }
        
        const reverseRelation = relatedEntityWithParent[reverseRelationProperty];
        let reverseRelationExists = false;
        
        if (Array.isArray(reverseRelation)) {
          // One-to-many or many-to-many relationship
          reverseRelationExists = reverseRelation.some(entity => entity.id === id);
        } else if (reverseRelation) {
          // One-to-one relationship
          reverseRelationExists = reverseRelation.id === id;
        }
        
        if (!reverseRelationExists) {
          const result: AssertionResult = {
            passed: false,
            message: `Reverse relationship from ${relatedModel}:${relatedId} to ${model}:${id} does not exist`,
            details: {
              relatedEntity: { id: relatedEntityWithParent.id },
              reverseRelationProperty,
              parentEntity: reverseRelation,
              expectedParentId: id,
            },
          };
          
          if (throwOnFailure) {
            throw new Error(result.message);
          }
          
          return result;
        }
      }
      
      return { passed: true };
    } catch (error) {
      const result: AssertionResult = {
        passed: false,
        message: `Error checking relationship: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  /**
   * Validates an entity against a Zod schema
   * 
   * @param entity The entity to validate
   * @param schema The Zod schema to validate against
   * @param options Schema validation options
   * @returns Assertion result
   */
  validateWithZod<T>(entity: any, schema: z.ZodType<T>, options: SchemaValidationOptions = {}): AssertionResult {
    const {
      throwOnFailure = false,
      message = 'Entity does not match schema',
      detailed = true,
      abortEarly = false,
      stripUnknown = false,
      errorMap,
    } = options;
    
    try {
      const result = schema.safeParse(entity, { errorMap });
      
      if (result.success) {
        return { passed: true };
      }
      
      const formattedErrors = result.error.format();
      
      const assertionResult: AssertionResult = {
        passed: false,
        message,
        details: formattedErrors,
      };
      
      if (throwOnFailure) {
        throw new Error(`${message}\n${result.error.message}`);
      }
      
      return assertionResult;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const assertionResult: AssertionResult = {
          passed: false,
          message,
          details: error.format(),
        };
        
        if (throwOnFailure) {
          throw new Error(`${message}\n${error.message}`);
        }
        
        return assertionResult;
      }
      
      const assertionResult: AssertionResult = {
        passed: false,
        message: `Error during schema validation: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return assertionResult;
    }
  }

  /**
   * Validates an entity against a class-validator decorated class
   * 
   * @param entity The entity to validate
   * @param validationClass The class with validation decorators
   * @param options Schema validation options
   * @returns Assertion result
   */
  async validateWithClassValidator<T>(entity: any, validationClass: new () => T, options: SchemaValidationOptions = {}): Promise<AssertionResult> {
    const {
      throwOnFailure = false,
      message = 'Entity does not match validation rules',
      detailed = true,
      abortEarly = false,
      stripUnknown = false,
    } = options;
    
    try {
      // Transform plain object to class instance
      const instance = plainToInstance(validationClass, entity);
      
      // Validate the instance
      const errors = await validate(instance, {
        skipMissingProperties: false,
        whitelist: stripUnknown,
        forbidNonWhitelisted: stripUnknown,
      });
      
      if (errors.length === 0) {
        return { passed: true };
      }
      
      const formattedErrors = this.formatValidationErrors(errors);
      
      const assertionResult: AssertionResult = {
        passed: false,
        message,
        details: formattedErrors,
      };
      
      if (throwOnFailure) {
        throw new Error(`${message}\n${JSON.stringify(formattedErrors, null, 2)}`);
      }
      
      return assertionResult;
    } catch (error) {
      if (Array.isArray(error) && error.length > 0 && error[0] instanceof ValidationError) {
        const formattedErrors = this.formatValidationErrors(error as ValidationError[]);
        
        const assertionResult: AssertionResult = {
          passed: false,
          message,
          details: formattedErrors,
        };
        
        if (throwOnFailure) {
          throw new Error(`${message}\n${JSON.stringify(formattedErrors, null, 2)}`);
        }
        
        return assertionResult;
      }
      
      const assertionResult: AssertionResult = {
        passed: false,
        message: `Error during validation: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return assertionResult;
    }
  }

  /**
   * Formats class-validator validation errors into a more readable structure
   * 
   * @param errors Array of ValidationError objects
   * @returns Formatted error object
   */
  private formatValidationErrors(errors: ValidationError[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const error of errors) {
      const constraints = error.constraints || {};
      const messages = Object.values(constraints);
      
      result[error.property] = {
        messages,
        constraints: error.constraints,
        value: error.value,
      };
      
      if (error.children && error.children.length > 0) {
        result[error.property].children = this.formatValidationErrors(error.children);
      }
    }
    
    return result;
  }

  /**
   * Asserts that a database transaction was committed successfully
   * 
   * @param transactionFn Function that performs the transaction
   * @param options Assertion options
   * @returns Assertion result with the transaction result
   */
  async assertTransactionCommitted<T>(
    transactionFn: (prisma: PrismaClient) => Promise<T>,
    options: AssertionOptions = {},
  ): Promise<AssertionResult & { result?: T }> {
    const {
      throwOnFailure = false,
      message = 'Transaction failed to commit',
      detailed = false,
    } = options;
    
    try {
      // Execute the transaction
      const result = await this.prisma.$transaction(async (tx) => {
        return await transactionFn(tx as unknown as PrismaClient);
      });
      
      return { passed: true, result };
    } catch (error) {
      const result: AssertionResult & { result?: T } = {
        passed: false,
        message: `${message}: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  /**
   * Asserts that a database transaction was rolled back
   * 
   * @param transactionFn Function that performs the transaction (should throw an error)
   * @param verificationFn Function to verify that the transaction was rolled back
   * @param options Assertion options
   * @returns Assertion result
   */
  async assertTransactionRolledBack(
    transactionFn: (prisma: PrismaClient) => Promise<any>,
    verificationFn: () => Promise<boolean>,
    options: AssertionOptions = {},
  ): Promise<AssertionResult> {
    const {
      throwOnFailure = false,
      message = 'Transaction was not rolled back',
      detailed = false,
    } = options;
    
    try {
      // Execute the transaction (should fail)
      await this.prisma.$transaction(async (tx) => {
        return await transactionFn(tx as unknown as PrismaClient);
      });
      
      // If we get here, the transaction did not throw an error
      const result: AssertionResult = {
        passed: false,
        message: 'Transaction did not throw an error as expected',
      };
      
      if (throwOnFailure) {
        throw new Error(result.message);
      }
      
      return result;
    } catch (error) {
      // Transaction failed as expected, now verify it was rolled back
      try {
        const wasRolledBack = await verificationFn();
        
        if (wasRolledBack) {
          return { passed: true };
        }
        
        const result: AssertionResult = {
          passed: false,
          message,
          details: { error },
        };
        
        if (throwOnFailure) {
          throw new Error(message);
        }
        
        return result;
      } catch (verificationError) {
        const result: AssertionResult = {
          passed: false,
          message: `Error verifying transaction rollback: ${verificationError.message}`,
          details: { transactionError: error, verificationError },
        };
        
        if (throwOnFailure) {
          throw verificationError;
        }
        
        return result;
      }
    }
  }

  /**
   * Asserts that a database migration was successful
   * 
   * @param migrationFn Function that performs the migration
   * @param verificationFn Function to verify that the migration was successful
   * @param options Assertion options
   * @returns Assertion result
   */
  async assertMigrationSuccessful(
    migrationFn: () => Promise<any>,
    verificationFn: () => Promise<boolean>,
    options: AssertionOptions = {},
  ): Promise<AssertionResult> {
    const {
      throwOnFailure = false,
      message = 'Migration was not successful',
      detailed = false,
    } = options;
    
    try {
      // Execute the migration
      await migrationFn();
      
      // Verify the migration
      const wasSuccessful = await verificationFn();
      
      if (wasSuccessful) {
        return { passed: true };
      }
      
      const result: AssertionResult = {
        passed: false,
        message,
      };
      
      if (throwOnFailure) {
        throw new Error(message);
      }
      
      return result;
    } catch (error) {
      const result: AssertionResult = {
        passed: false,
        message: `Error during migration: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  /**
   * Asserts that a database is in the expected state
   * 
   * @param expectedState Object describing the expected database state
   * @param options Assertion options
   * @returns Assertion result
   */
  async assertDatabaseState(
    expectedState: Record<string, any[]>,
    options: AssertionOptions = {},
  ): Promise<AssertionResult> {
    const {
      throwOnFailure = false,
      message = 'Database state does not match expected state',
      detailed = true,
    } = options;
    
    try {
      const differences: Record<string, any> = {};
      
      // Check each model in the expected state
      for (const [model, expectedRecords] of Object.entries(expectedState)) {
        // Get actual records from the database
        const actualRecords = await this.prisma[model].findMany();
        
        // Compare record counts
        if (actualRecords.length !== expectedRecords.length) {
          differences[`${model}.length`] = {
            expected: expectedRecords.length,
            actual: actualRecords.length,
            message: `Expected ${expectedRecords.length} records but found ${actualRecords.length}`,
          };
          continue;
        }
        
        // Compare each record by ID
        const actualById = new Map(actualRecords.map(record => [record.id, record]));
        
        for (const expectedRecord of expectedRecords) {
          const { id } = expectedRecord;
          const actualRecord = actualById.get(id);
          
          if (!actualRecord) {
            differences[`${model}.${id}`] = {
              expected: expectedRecord,
              actual: null,
              message: `Record with ID ${id} not found`,
            };
            continue;
          }
          
          // Compare record properties
          const recordDiffs = this.findDifferences(actualRecord, expectedRecord, `${model}.${id}`);
          
          if (Object.keys(recordDiffs).length > 0) {
            Object.assign(differences, recordDiffs);
          }
        }
      }
      
      if (Object.keys(differences).length === 0) {
        return { passed: true };
      }
      
      const result: AssertionResult = {
        passed: false,
        message,
        details: differences,
      };
      
      if (throwOnFailure) {
        throw new Error(`${message}\n${JSON.stringify(differences, null, 2)}`);
      }
      
      return result;
    } catch (error) {
      const result: AssertionResult = {
        passed: false,
        message: `Error checking database state: ${error.message}`,
        details: error,
      };
      
      if (throwOnFailure) {
        throw error;
      }
      
      return result;
    }
  }

  // Journey-specific assertion helpers

  /**
   * Health Journey: Asserts that health metrics are valid
   * 
   * @param metrics The health metrics to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateHealthMetrics(metrics: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'health', ...restOptions } = options;
    
    // Define Zod schema for health metrics
    const healthMetricSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      type: z.string(),
      value: z.number(),
      unit: z.string(),
      recordedAt: z.date(),
      source: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });
    
    if (Array.isArray(metrics)) {
      return this.validateWithZod(metrics, z.array(healthMetricSchema), restOptions);
    }
    
    return this.validateWithZod(metrics, healthMetricSchema, restOptions);
  }

  /**
   * Health Journey: Asserts that health goals are valid
   * 
   * @param goals The health goals to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateHealthGoals(goals: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'health', ...restOptions } = options;
    
    // Define Zod schema for health goals
    const healthGoalSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      metricType: z.string(),
      targetValue: z.number(),
      currentValue: z.number().optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
      status: z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED']),
      progress: z.number().min(0).max(100).optional(),
    });
    
    if (Array.isArray(goals)) {
      return this.validateWithZod(goals, z.array(healthGoalSchema), restOptions);
    }
    
    return this.validateWithZod(goals, healthGoalSchema, restOptions);
  }

  /**
   * Health Journey: Asserts that device connections are valid
   * 
   * @param connections The device connections to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateDeviceConnections(connections: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'health', ...restOptions } = options;
    
    // Define Zod schema for device connections
    const deviceConnectionSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      deviceId: z.string(),
      deviceType: z.string(),
      status: z.enum(['CONNECTED', 'DISCONNECTED', 'PENDING']),
      lastSyncedAt: z.date().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });
    
    if (Array.isArray(connections)) {
      return this.validateWithZod(connections, z.array(deviceConnectionSchema), restOptions);
    }
    
    return this.validateWithZod(connections, deviceConnectionSchema, restOptions);
  }

  /**
   * Care Journey: Asserts that appointments are valid
   * 
   * @param appointments The appointments to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateAppointments(appointments: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'care', ...restOptions } = options;
    
    // Define Zod schema for appointments
    const appointmentSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      providerId: z.string().uuid(),
      status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED']),
      type: z.string(),
      scheduledAt: z.date(),
      endedAt: z.date().optional(),
      notes: z.string().optional(),
      location: z.string().optional(),
      isTelemedicine: z.boolean().default(false),
    });
    
    if (Array.isArray(appointments)) {
      return this.validateWithZod(appointments, z.array(appointmentSchema), restOptions);
    }
    
    return this.validateWithZod(appointments, appointmentSchema, restOptions);
  }

  /**
   * Care Journey: Asserts that medications are valid
   * 
   * @param medications The medications to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateMedications(medications: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'care', ...restOptions } = options;
    
    // Define Zod schema for medications
    const medicationSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      startDate: z.date(),
      endDate: z.date().optional(),
      status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
      instructions: z.string().optional(),
      prescribedBy: z.string().optional(),
    });
    
    if (Array.isArray(medications)) {
      return this.validateWithZod(medications, z.array(medicationSchema), restOptions);
    }
    
    return this.validateWithZod(medications, medicationSchema, restOptions);
  }

  /**
   * Plan Journey: Asserts that insurance claims are valid
   * 
   * @param claims The insurance claims to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateInsuranceClaims(claims: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'plan', ...restOptions } = options;
    
    // Define Zod schema for insurance claims
    const claimSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      claimNumber: z.string().optional(),
      claimTypeId: z.string(),
      status: z.enum(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PAID']),
      amount: z.number().positive(),
      serviceDate: z.date(),
      submittedAt: z.date(),
      providerName: z.string(),
      description: z.string().optional(),
      documents: z.array(z.string()).optional(),
    });
    
    if (Array.isArray(claims)) {
      return this.validateWithZod(claims, z.array(claimSchema), restOptions);
    }
    
    return this.validateWithZod(claims, claimSchema, restOptions);
  }

  /**
   * Plan Journey: Asserts that insurance benefits are valid
   * 
   * @param benefits The insurance benefits to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateInsuranceBenefits(benefits: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'plan', ...restOptions } = options;
    
    // Define Zod schema for insurance benefits
    const benefitSchema = z.object({
      id: z.string().uuid().optional(),
      planId: z.string().uuid(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      coveragePercentage: z.number().min(0).max(100),
      annualLimit: z.number().optional(),
      lifetimeLimit: z.number().optional(),
      waitingPeriod: z.number().optional(),
      isActive: z.boolean().default(true),
    });
    
    if (Array.isArray(benefits)) {
      return this.validateWithZod(benefits, z.array(benefitSchema), restOptions);
    }
    
    return this.validateWithZod(benefits, benefitSchema, restOptions);
  }

  /**
   * Gamification Journey: Asserts that achievements are valid
   * 
   * @param achievements The achievements to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateAchievements(achievements: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'gamification', ...restOptions } = options;
    
    // Define Zod schema for achievements
    const achievementSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid(),
      achievementTypeId: z.string(),
      level: z.number().int().positive(),
      progress: z.number().min(0).max(100),
      completedAt: z.date().optional(),
      journey: z.enum(['health', 'care', 'plan']),
      metadata: z.record(z.string(), z.any()).optional(),
    });
    
    if (Array.isArray(achievements)) {
      return this.validateWithZod(achievements, z.array(achievementSchema), restOptions);
    }
    
    return this.validateWithZod(achievements, achievementSchema, restOptions);
  }

  /**
   * Gamification Journey: Asserts that rewards are valid
   * 
   * @param rewards The rewards to validate
   * @param options Assertion options
   * @returns Assertion result
   */
  validateRewards(rewards: any | any[], options: SchemaValidationOptions = {}): AssertionResult {
    const { journeyContext = 'gamification', ...restOptions } = options;
    
    // Define Zod schema for rewards
    const rewardSchema = z.object({
      id: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      name: z.string(),
      description: z.string(),
      pointCost: z.number().int().positive(),
      category: z.string(),
      expiresAt: z.date().optional(),
      isRedeemed: z.boolean().default(false),
      redeemedAt: z.date().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });
    
    if (Array.isArray(rewards)) {
      return this.validateWithZod(rewards, z.array(rewardSchema), restOptions);
    }
    
    return this.validateWithZod(rewards, rewardSchema, restOptions);
  }
}

/**
 * Creates a new AssertionTestUtils instance with the provided PrismaService or PrismaClient
 * 
 * @param prisma The PrismaService or PrismaClient instance
 * @returns A new AssertionTestUtils instance
 */
export function createAssertionTestUtils(
  prisma: PrismaService | PrismaClient,
): AssertionTestUtils {
  return new AssertionTestUtils(prisma);
}

/**
 * Creates a Zod schema for validating database entities with common fields
 * 
 * @param additionalFields Additional fields to add to the schema
 * @returns A Zod schema for database entities
 */
export function createEntitySchema<T extends z.ZodRawShape>(
  additionalFields: T,
): z.ZodObject<T & {
  id: z.ZodString;
  createdAt: z.ZodDate;
  updatedAt: z.ZodDate;
}> {
  return z.object({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    ...additionalFields,
  });
}

/**
 * Creates a Zod schema for validating database entities with optional ID and timestamps
 * 
 * @param additionalFields Additional fields to add to the schema
 * @returns A Zod schema for database entities with optional common fields
 */
export function createPartialEntitySchema<T extends z.ZodRawShape>(
  additionalFields: T,
): z.ZodObject<T & {
  id?: z.ZodOptional<z.ZodString>;
  createdAt?: z.ZodOptional<z.ZodDate>;
  updatedAt?: z.ZodOptional<z.ZodDate>;
}> {
  return z.object({
    id: z.string().uuid().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    ...additionalFields,
  });
}