/**
 * @file utils.ts
 * @description Utility functions for test data seeding operations.
 * 
 * This module provides a comprehensive set of utilities for generating test data,
 * managing database transactions during seeding, handling errors, and verifying
 * data integrity. It ensures reliable and consistent test environments across
 * all journey services.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@austa/logging';
import { 
  TransactionIsolationLevel,
  executeInTransaction,
  executeWithRetry,
  TransactionOptions,
  generateTransactionId
} from '../../../src/transactions';
import {
  DatabaseException,
  DatabaseErrorType,
  DatabaseErrorSeverity,
  JourneyContext,
  formatDatabaseErrorMessage,
  isTransientDatabaseError
} from '../../../src/errors';
import * as crypto from 'crypto';

// Create a logger instance for seed utilities
const logger = new Logger('SeedUtils');

/**
 * Seed operation types for metrics and logging
 */
export enum SeedOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  TRUNCATE = 'TRUNCATE',
  VERIFY = 'VERIFY',
  GENERATE = 'GENERATE'
}

/**
 * Interface for seed data generation options
 */
export interface SeedGenerationOptions {
  // Whether to generate deterministic data (same input produces same output)
  deterministic?: boolean;
  
  // Seed value for deterministic data generation
  seed?: string;
  
  // Locale for localized data (e.g., 'pt-BR')
  locale?: string;
  
  // Journey context for journey-specific data
  journeyContext?: JourneyContext;
  
  // Whether to include sensitive data (e.g., PII)
  includeSensitiveData?: boolean;
  
  // Minimum and maximum values for numeric data
  minValue?: number;
  maxValue?: number;
  
  // Length constraints for string data
  minLength?: number;
  maxLength?: number;
  
  // Date range for temporal data
  startDate?: Date;
  endDate?: Date;
}

/**
 * Interface for seed operation options
 */
export interface SeedOperationOptions {
  // Whether to execute the operation in a transaction
  useTransaction?: boolean;
  
  // Transaction isolation level
  isolationLevel?: TransactionIsolationLevel;
  
  // Whether to retry failed operations
  retry?: boolean;
  
  // Maximum number of retry attempts
  maxRetries?: number;
  
  // Whether to clean up data after tests
  cleanupAfterTest?: boolean;
  
  // Whether to validate data after seeding
  validateAfterSeed?: boolean;
  
  // Whether to log operations
  logging?: boolean;
  
  // Journey context for the operation
  journeyContext?: JourneyContext;
}

/**
 * Default options for seed operations
 */
export const DEFAULT_SEED_OPTIONS: SeedOperationOptions = {
  useTransaction: true,
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  retry: true,
  maxRetries: 3,
  cleanupAfterTest: true,
  validateAfterSeed: true,
  logging: true,
  journeyContext: JourneyContext.NONE
};

/**
 * Default options for seed data generation
 */
export const DEFAULT_GENERATION_OPTIONS: SeedGenerationOptions = {
  deterministic: true,
  seed: 'austa-test-seed',
  locale: 'pt-BR',
  journeyContext: JourneyContext.NONE,
  includeSensitiveData: false,
  minValue: 1,
  maxValue: 1000,
  minLength: 3,
  maxLength: 50,
  startDate: new Date(2023, 0, 1), // Jan 1, 2023
  endDate: new Date(2023, 11, 31)  // Dec 31, 2023
};

/**
 * Interface for tracking created test data for cleanup
 */
export interface SeedDataTracker {
  // Map of entity names to arrays of created entity IDs
  entities: Map<string, string[]>;
  
  // Add an entity to the tracker
  addEntity(entityName: string, id: string): void;
  
  // Get all entities of a specific type
  getEntities(entityName: string): string[];
  
  // Clear all tracked entities
  clear(): void;
  
  // Get all tracked entity names
  getEntityNames(): string[];
  
  // Get total count of tracked entities
  getTotalCount(): number;
}

/**
 * Creates a new seed data tracker for managing created test data
 * 
 * @returns A new seed data tracker instance
 */
export function createSeedDataTracker(): SeedDataTracker {
  const entities = new Map<string, string[]>();
  
  return {
    entities,
    
    addEntity(entityName: string, id: string): void {
      if (!entities.has(entityName)) {
        entities.set(entityName, []);
      }
      entities.get(entityName)?.push(id);
    },
    
    getEntities(entityName: string): string[] {
      return entities.get(entityName) || [];
    },
    
    clear(): void {
      entities.clear();
    },
    
    getEntityNames(): string[] {
      return Array.from(entities.keys());
    },
    
    getTotalCount(): number {
      let count = 0;
      for (const ids of entities.values()) {
        count += ids.length;
      }
      return count;
    }
  };
}

/**
 * Global seed data tracker instance for the current test run
 */
export const globalSeedDataTracker = createSeedDataTracker();

/**
 * Executes a seed operation within a transaction with error handling
 * 
 * @param prisma - PrismaClient instance
 * @param operation - Function to execute
 * @param options - Seed operation options
 * @returns The result of the operation
 */
export async function executeSeedOperation<T>(
  prisma: PrismaClient,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: Partial<SeedOperationOptions> = {}
): Promise<T> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  const operationId = generateTransactionId();
  
  if (seedOptions.logging) {
    logger.debug(`Starting seed operation ${operationId}`, {
      operationId,
      journeyContext: seedOptions.journeyContext,
      useTransaction: seedOptions.useTransaction,
      isolationLevel: seedOptions.isolationLevel
    });
  }
  
  try {
    let result: T;
    
    if (seedOptions.useTransaction) {
      // Execute in transaction with retry if enabled
      if (seedOptions.retry) {
        result = await executeWithRetry(prisma, operation, {
          isolationLevel: seedOptions.isolationLevel,
          maxRetries: seedOptions.maxRetries,
          operationType: 'seed-operation',
          enableLogging: seedOptions.logging,
          journeyContext: {
            journeyType: mapJourneyContextToType(seedOptions.journeyContext),
          }
        });
      } else {
        result = await executeInTransaction(prisma, operation, {
          isolationLevel: seedOptions.isolationLevel,
          operationType: 'seed-operation',
          enableLogging: seedOptions.logging,
          journeyContext: {
            journeyType: mapJourneyContextToType(seedOptions.journeyContext),
          }
        });
      }
    } else {
      // Execute without transaction
      result = await operation(prisma as unknown as Prisma.TransactionClient);
    }
    
    if (seedOptions.logging) {
      logger.debug(`Seed operation ${operationId} completed successfully`, {
        operationId,
        journeyContext: seedOptions.journeyContext
      });
    }
    
    return result;
  } catch (error) {
    if (seedOptions.logging) {
      logger.error(`Seed operation ${operationId} failed: ${(error as Error).message}`, {
        operationId,
        journeyContext: seedOptions.journeyContext,
        error
      });
    }
    
    // Transform error to a database exception if it's not already one
    if (!(error instanceof DatabaseException)) {
      throw new DatabaseException(
        formatDatabaseErrorMessage(
          'seed',
          'test-data',
          (error as Error).message,
          seedOptions.journeyContext?.toString()
        ),
        {
          type: DatabaseErrorType.QUERY_EXECUTION_FAILED,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverable: isTransientDatabaseError(error),
          originalError: error as Error
        }
      );
    }
    
    throw error;
  }
}

/**
 * Maps JourneyContext enum to journey type string
 * 
 * @param context - Journey context enum value
 * @returns Journey type string
 */
function mapJourneyContextToType(context?: JourneyContext): 'health' | 'care' | 'plan' | undefined {
  if (!context || context === JourneyContext.NONE) {
    return undefined;
  }
  
  switch (context) {
    case JourneyContext.HEALTH:
      return 'health';
    case JourneyContext.CARE:
      return 'care';
    case JourneyContext.PLAN:
      return 'plan';
    default:
      return undefined;
  }
}

/**
 * Cleans up test data created during seeding
 * 
 * @param prisma - PrismaClient instance
 * @param tracker - Seed data tracker containing entities to clean up
 * @param options - Seed operation options
 */
export async function cleanupSeedData(
  prisma: PrismaClient,
  tracker: SeedDataTracker = globalSeedDataTracker,
  options: Partial<SeedOperationOptions> = {}
): Promise<void> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  const operationId = generateTransactionId();
  
  if (seedOptions.logging) {
    logger.debug(`Starting seed data cleanup ${operationId}`, {
      operationId,
      entityCount: tracker.getTotalCount(),
      entityTypes: tracker.getEntityNames()
    });
  }
  
  try {
    await executeSeedOperation(prisma, async (tx) => {
      // Delete entities in reverse order of creation (to respect foreign key constraints)
      for (const entityName of tracker.getEntityNames()) {
        const ids = tracker.getEntities(entityName);
        
        if (ids.length > 0) {
          if (seedOptions.logging) {
            logger.debug(`Cleaning up ${ids.length} ${entityName} entities`, {
              operationId,
              entityName,
              count: ids.length
            });
          }
          
          // Use dynamic property access to get the model from Prisma client
          const model = tx[entityName as keyof typeof tx] as any;
          
          if (!model) {
            logger.warn(`Model ${entityName} not found in Prisma client, skipping cleanup`, {
              operationId,
              entityName
            });
            continue;
          }
          
          // Delete entities in batches to avoid query size limits
          const batchSize = 100;
          for (let i = 0; i < ids.length; i += batchSize) {
            const batchIds = ids.slice(i, i + batchSize);
            await model.deleteMany({
              where: {
                id: {
                  in: batchIds
                }
              }
            });
          }
        }
      }
      
      // Clear the tracker after successful cleanup
      tracker.clear();
    }, {
      ...seedOptions,
      // Override some options for cleanup
      isolationLevel: TransactionIsolationLevel.SERIALIZABLE, // Use serializable to ensure consistency
      retry: true, // Always retry cleanup operations
    });
    
    if (seedOptions.logging) {
      logger.debug(`Seed data cleanup ${operationId} completed successfully`, {
        operationId
      });
    }
  } catch (error) {
    if (seedOptions.logging) {
      logger.error(`Seed data cleanup ${operationId} failed: ${(error as Error).message}`, {
        operationId,
        error
      });
    }
    throw error;
  }
}

/**
 * Verifies that seeded data exists and matches expected values
 * 
 * @param prisma - PrismaClient instance
 * @param entityName - Name of the entity to verify
 * @param criteria - Criteria to find the entity
 * @param expectedValues - Expected values to verify
 * @param options - Seed operation options
 * @returns The verified entity if successful
 */
export async function verifySeedData<T>(
  prisma: PrismaClient,
  entityName: string,
  criteria: Record<string, any>,
  expectedValues: Partial<T>,
  options: Partial<SeedOperationOptions> = {}
): Promise<T> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  
  return executeSeedOperation(prisma, async (tx) => {
    // Use dynamic property access to get the model from Prisma client
    const model = tx[entityName as keyof typeof tx] as any;
    
    if (!model) {
      throw new Error(`Model ${entityName} not found in Prisma client`);
    }
    
    // Find the entity
    const entity = await model.findFirst({
      where: criteria
    });
    
    if (!entity) {
      throw new Error(`Entity ${entityName} not found with criteria: ${JSON.stringify(criteria)}`);
    }
    
    // Verify expected values
    for (const [key, value] of Object.entries(expectedValues)) {
      if (entity[key] !== value) {
        throw new Error(
          `Entity ${entityName} field ${key} has value ${entity[key]} but expected ${value}`
        );
      }
    }
    
    return entity as T;
  }, {
    ...seedOptions,
    // Override some options for verification
    useTransaction: true,
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    retry: false, // No need to retry read operations
  });
}

/**
 * Generates a deterministic random number based on a seed string
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param seed - Seed string for deterministic generation
 * @returns A random number between min and max
 */
export function generateDeterministicNumber(
  min: number,
  max: number,
  seed: string
): number {
  // Create a deterministic hash from the seed
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Convert first 8 characters of hash to a number between 0 and 1
  const randomValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  // Scale to the desired range
  return Math.floor(randomValue * (max - min + 1)) + min;
}

/**
 * Generates a deterministic random string based on a seed string
 * 
 * @param length - Length of the string to generate
 * @param seed - Seed string for deterministic generation
 * @param charset - Character set to use (default: alphanumeric)
 * @returns A random string of the specified length
 */
export function generateDeterministicString(
  length: number,
  seed: string,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  // Create a deterministic hash from the seed
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  let result = '';
  
  // Generate characters based on the hash
  for (let i = 0; i < length; i++) {
    // Use a different part of the hash for each character
    const subHash = crypto.createHash('sha256')
      .update(`${hash}-${i}`)
      .digest('hex');
    
    // Convert first 8 characters of hash to a number between 0 and 1
    const randomValue = parseInt(subHash.substring(0, 8), 16) / 0xffffffff;
    // Use the random value to select a character from the charset
    const charIndex = Math.floor(randomValue * charset.length);
    result += charset.charAt(charIndex);
  }
  
  return result;
}

/**
 * Generates a deterministic random date based on a seed string
 * 
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param seed - Seed string for deterministic generation
 * @returns A random date between startDate and endDate
 */
export function generateDeterministicDate(
  startDate: Date,
  endDate: Date,
  seed: string
): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = generateDeterministicNumber(startTime, endTime, seed);
  return new Date(randomTime);
}

/**
 * Generates a deterministic random boolean based on a seed string
 * 
 * @param probability - Probability of returning true (0-1)
 * @param seed - Seed string for deterministic generation
 * @returns A random boolean
 */
export function generateDeterministicBoolean(
  probability: number = 0.5,
  seed: string
): boolean {
  // Create a deterministic hash from the seed
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Convert first 8 characters of hash to a number between 0 and 1
  const randomValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  // Return true if the random value is less than the probability
  return randomValue < probability;
}

/**
 * Generates a deterministic random element from an array based on a seed string
 * 
 * @param array - Array to select from
 * @param seed - Seed string for deterministic generation
 * @returns A random element from the array
 */
export function generateDeterministicArrayElement<T>(
  array: T[],
  seed: string
): T {
  if (array.length === 0) {
    throw new Error('Cannot select from an empty array');
  }
  
  const index = generateDeterministicNumber(0, array.length - 1, seed);
  return array[index];
}

/**
 * Generates a deterministic random subset of an array based on a seed string
 * 
 * @param array - Array to select from
 * @param count - Number of elements to select
 * @param seed - Seed string for deterministic generation
 * @returns A random subset of the array
 */
export function generateDeterministicArraySubset<T>(
  array: T[],
  count: number,
  seed: string
): T[] {
  if (count > array.length) {
    throw new Error(`Cannot select ${count} elements from an array of length ${array.length}`);
  }
  
  // Create a copy of the array to avoid modifying the original
  const arrayCopy = [...array];
  const result: T[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a deterministic index for each selection
    const index = generateDeterministicNumber(
      0,
      arrayCopy.length - 1,
      `${seed}-${i}`
    );
    
    // Add the selected element to the result and remove it from the copy
    result.push(arrayCopy[index]);
    arrayCopy.splice(index, 1);
  }
  
  return result;
}

/**
 * Generates a deterministic UUID based on a seed string
 * 
 * @param seed - Seed string for deterministic generation
 * @returns A deterministic UUID
 */
export function generateDeterministicUuid(seed: string): string {
  // Create a deterministic hash from the seed
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  
  // Format the hash as a UUID (version 4)
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    // Version 4 UUID has specific bits set
    '4' + hash.substring(13, 16),
    // Variant bits
    (parseInt(hash.substring(16, 18), 16) & 0x3 | 0x8).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

/**
 * Generates a deterministic email address based on a seed string
 * 
 * @param seed - Seed string for deterministic generation
 * @param domain - Email domain (default: example.com)
 * @returns A deterministic email address
 */
export function generateDeterministicEmail(
  seed: string,
  domain: string = 'example.com'
): string {
  const username = generateDeterministicString(8, seed, 'abcdefghijklmnopqrstuvwxyz0123456789');
  return `${username}@${domain}`;
}

/**
 * Generates a deterministic phone number based on a seed string
 * 
 * @param seed - Seed string for deterministic generation
 * @param countryCode - Country code (default: +55 for Brazil)
 * @returns A deterministic phone number
 */
export function generateDeterministicPhone(
  seed: string,
  countryCode: string = '+55'
): string {
  // Generate a 9-digit number for Brazil
  const number = generateDeterministicString(9, seed, '0123456789');
  // Format as +55 11 9XXXXXXXX (Brazilian mobile number format)
  return `${countryCode}11${number}`;
}

/**
 * Generates a deterministic CPF (Brazilian tax ID) based on a seed string
 * 
 * @param seed - Seed string for deterministic generation
 * @returns A deterministic CPF
 */
export function generateDeterministicCpf(seed: string): string {
  // Generate 9 digits
  const digits = generateDeterministicString(9, seed, '0123456789');
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  sum += firstDigit * 2;
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Format as XXX.XXX.XXX-XX
  return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${firstDigit}${secondDigit}`;
}

/**
 * Creates an idempotent seed operation that only executes if the entity doesn't exist
 * 
 * @param prisma - PrismaClient instance
 * @param entityName - Name of the entity to create
 * @param findCriteria - Criteria to check if the entity already exists
 * @param createData - Data to create the entity if it doesn't exist
 * @param options - Seed operation options
 * @returns The created or existing entity
 */
export async function createIdempotentEntity<T>(
  prisma: PrismaClient,
  entityName: string,
  findCriteria: Record<string, any>,
  createData: Record<string, any>,
  options: Partial<SeedOperationOptions> = {}
): Promise<T> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  
  return executeSeedOperation(prisma, async (tx) => {
    // Use dynamic property access to get the model from Prisma client
    const model = tx[entityName as keyof typeof tx] as any;
    
    if (!model) {
      throw new Error(`Model ${entityName} not found in Prisma client`);
    }
    
    // Check if the entity already exists
    const existingEntity = await model.findFirst({
      where: findCriteria
    });
    
    if (existingEntity) {
      if (seedOptions.logging) {
        logger.debug(`Entity ${entityName} already exists, skipping creation`, {
          entityName,
          criteria: findCriteria
        });
      }
      return existingEntity;
    }
    
    // Create the entity if it doesn't exist
    const createdEntity = await model.create({
      data: createData
    });
    
    // Track the created entity for cleanup
    if (createdEntity.id && seedOptions.cleanupAfterTest) {
      globalSeedDataTracker.addEntity(entityName, createdEntity.id);
    }
    
    if (seedOptions.logging) {
      logger.debug(`Created entity ${entityName}`, {
        entityName,
        entityId: createdEntity.id
      });
    }
    
    return createdEntity;
  }, seedOptions);
}

/**
 * Creates multiple entities in a batch operation
 * 
 * @param prisma - PrismaClient instance
 * @param entityName - Name of the entity to create
 * @param dataArray - Array of data objects to create entities
 * @param options - Seed operation options
 * @returns Array of created entities
 */
export async function createBatchEntities<T>(
  prisma: PrismaClient,
  entityName: string,
  dataArray: Record<string, any>[],
  options: Partial<SeedOperationOptions> = {}
): Promise<T[]> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  
  return executeSeedOperation(prisma, async (tx) => {
    // Use dynamic property access to get the model from Prisma client
    const model = tx[entityName as keyof typeof tx] as any;
    
    if (!model) {
      throw new Error(`Model ${entityName} not found in Prisma client`);
    }
    
    // Create entities in batches to avoid query size limits
    const batchSize = 100;
    const createdEntities: T[] = [];
    
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      
      // Create entities in the current batch
      const batchResults = await Promise.all(
        batch.map(data => model.create({ data }))
      );
      
      // Track created entities for cleanup
      if (seedOptions.cleanupAfterTest) {
        for (const entity of batchResults) {
          if (entity.id) {
            globalSeedDataTracker.addEntity(entityName, entity.id);
          }
        }
      }
      
      createdEntities.push(...batchResults);
    }
    
    if (seedOptions.logging) {
      logger.debug(`Created ${createdEntities.length} ${entityName} entities`, {
        entityName,
        count: createdEntities.length
      });
    }
    
    return createdEntities;
  }, seedOptions);
}

/**
 * Truncates a table, removing all data
 * 
 * @param prisma - PrismaClient instance
 * @param entityName - Name of the entity to truncate
 * @param options - Seed operation options
 */
export async function truncateTable(
  prisma: PrismaClient,
  entityName: string,
  options: Partial<SeedOperationOptions> = {}
): Promise<void> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  
  await executeSeedOperation(prisma, async (tx) => {
    // Use dynamic property access to get the model from Prisma client
    const model = tx[entityName as keyof typeof tx] as any;
    
    if (!model) {
      throw new Error(`Model ${entityName} not found in Prisma client`);
    }
    
    // Delete all records
    await model.deleteMany({});
    
    if (seedOptions.logging) {
      logger.debug(`Truncated table ${entityName}`, {
        entityName
      });
    }
  }, {
    ...seedOptions,
    // Override some options for truncation
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE, // Use serializable to ensure consistency
  });
}

/**
 * Executes raw SQL for advanced seeding operations
 * 
 * @param prisma - PrismaClient instance
 * @param sql - SQL query to execute
 * @param params - Parameters for the SQL query
 * @param options - Seed operation options
 * @returns Result of the SQL query
 */
export async function executeRawSql<T>(
  prisma: PrismaClient,
  sql: string,
  params: any[] = [],
  options: Partial<SeedOperationOptions> = {}
): Promise<T> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  
  return executeSeedOperation(prisma, async (tx) => {
    // Execute raw SQL query
    const result = await tx.$executeRaw.apply(tx, [Prisma.sql([sql, ...params])]);
    
    if (seedOptions.logging) {
      logger.debug(`Executed raw SQL`, {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        paramCount: params.length
      });
    }
    
    return result as unknown as T;
  }, seedOptions);
}

/**
 * Generates a consistent hash for a value, useful for creating deterministic test data
 * 
 * @param value - Value to hash
 * @returns Hexadecimal hash string
 */
export function generateConsistentHash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Validates that a seeded entity matches expected schema and constraints
 * 
 * @param entity - Entity to validate
 * @param schema - Schema definition with field types and constraints
 * @returns Validation result with success flag and error messages
 */
export function validateEntitySchema<T>(
  entity: T,
  schema: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: RegExp;
    enum?: any[];
    nullable?: boolean;
  }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check each field against the schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = (entity as any)[field];
    
    // Check if required field is missing
    if (rules.required && (value === undefined || value === null) && !rules.nullable) {
      errors.push(`Field '${field}' is required but missing`);
      continue;
    }
    
    // Skip validation for null/undefined values if they're allowed
    if ((value === undefined || value === null) && (rules.nullable || !rules.required)) {
      continue;
    }
    
    // Validate based on type
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${field}' should be a string but got ${typeof value}`);
        } else {
          // Check string constraints
          if (rules.minLength !== undefined && value.length < rules.minLength) {
            errors.push(`Field '${field}' length ${value.length} is less than minimum ${rules.minLength}`);
          }
          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors.push(`Field '${field}' length ${value.length} exceeds maximum ${rules.maxLength}`);
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`Field '${field}' does not match required pattern`);
          }
          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`Field '${field}' value '${value}' is not in allowed values: ${rules.enum.join(', ')}`);
          }
        }
        break;
        
      case 'number':
        if (typeof value !== 'number') {
          errors.push(`Field '${field}' should be a number but got ${typeof value}`);
        } else {
          // Check number constraints
          if (rules.minValue !== undefined && value < rules.minValue) {
            errors.push(`Field '${field}' value ${value} is less than minimum ${rules.minValue}`);
          }
          if (rules.maxValue !== undefined && value > rules.maxValue) {
            errors.push(`Field '${field}' value ${value} exceeds maximum ${rules.maxValue}`);
          }
          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`Field '${field}' value ${value} is not in allowed values: ${rules.enum.join(', ')}`);
          }
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${field}' should be a boolean but got ${typeof value}`);
        }
        break;
        
      case 'date':
        if (!(value instanceof Date) && !(typeof value === 'string' && !isNaN(Date.parse(value)))) {
          errors.push(`Field '${field}' should be a valid date but got ${typeof value}`);
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field '${field}' should be an array but got ${typeof value}`);
        } else if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`Field '${field}' array length ${value.length} is less than minimum ${rules.minLength}`);
        } else if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`Field '${field}' array length ${value.length} exceeds maximum ${rules.maxLength}`);
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`Field '${field}' should be an object but got ${typeof value}`);
        }
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates a test data factory for creating entities with consistent defaults
 * 
 * @param entityName - Name of the entity
 * @param defaultData - Default data for the entity
 * @returns A factory function for creating entities
 */
export function createTestDataFactory<T>(
  entityName: string,
  defaultData: Partial<T>
): (prisma: PrismaClient, overrides?: Partial<T>, options?: Partial<SeedOperationOptions>) => Promise<T> {
  return async (prisma: PrismaClient, overrides: Partial<T> = {}, options: Partial<SeedOperationOptions> = {}) => {
    const data = { ...defaultData, ...overrides } as Record<string, any>;
    
    return createIdempotentEntity<T>(
      prisma,
      entityName,
      // Use the first unique field as the find criteria, or id if available
      'id' in data ? { id: data.id } : 
        'email' in data ? { email: data.email } : 
        'name' in data ? { name: data.name } : 
        Object.entries(data).reduce((acc, [key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            acc[key] = value;
            return acc;
          }
          return acc;
        }, {} as Record<string, any>),
      data,
      options
    );
  };
}

/**
 * Creates a relationship between two entities
 * 
 * @param prisma - PrismaClient instance
 * @param entityName - Name of the entity to update
 * @param entityId - ID of the entity to update
 * @param relationField - Name of the relation field
 * @param relatedEntityIds - ID or IDs of related entities
 * @param options - Seed operation options
 * @returns The updated entity
 */
export async function createEntityRelation<T>(
  prisma: PrismaClient,
  entityName: string,
  entityId: string,
  relationField: string,
  relatedEntityIds: string | string[],
  options: Partial<SeedOperationOptions> = {}
): Promise<T> {
  const seedOptions: SeedOperationOptions = { ...DEFAULT_SEED_OPTIONS, ...options };
  
  return executeSeedOperation(prisma, async (tx) => {
    // Use dynamic property access to get the model from Prisma client
    const model = tx[entityName as keyof typeof tx] as any;
    
    if (!model) {
      throw new Error(`Model ${entityName} not found in Prisma client`);
    }
    
    // Prepare the relation data
    const relationData = {
      [relationField]: {
        connect: Array.isArray(relatedEntityIds)
          ? relatedEntityIds.map(id => ({ id }))
          : { id: relatedEntityIds }
      }
    };
    
    // Update the entity with the relation
    const updatedEntity = await model.update({
      where: { id: entityId },
      data: relationData,
      include: {
        [relationField]: true
      }
    });
    
    if (seedOptions.logging) {
      logger.debug(`Created relation for ${entityName}.${relationField}`, {
        entityName,
        entityId,
        relationField,
        relatedCount: Array.isArray(relatedEntityIds) ? relatedEntityIds.length : 1
      });
    }
    
    return updatedEntity;
  }, seedOptions);
}