/**
 * Database Test Seed Utilities
 * 
 * This module provides utility functions and helpers for test data seeding operations.
 * It contains reusable logic for generating random but consistent test data,
 * handling database operations safely, and managing seed transactions.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { TransactionService } from '../../src/transactions/transaction.service';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { DatabaseException, QueryException, TransactionException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { v4 as uuidv4 } from 'uuid';
import * as faker from 'faker';
import * as bcrypt from 'bcrypt';

// Set locale for consistent test data generation
faker.locale = 'pt_BR';

/**
 * Configuration options for seed operations
 */
export interface SeedOptions {
  /** Whether to use transactions for seed operations */
  useTransaction?: boolean;
  /** Isolation level for transactions */
  isolationLevel?: TransactionIsolationLevel;
  /** Whether to log seed operations */
  logging?: boolean;
  /** Number of retry attempts for failed operations */
  retryAttempts?: number;
  /** Whether to throw errors or just log them */
  throwOnError?: boolean;
  /** Journey context for the seed operation */
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification' | 'core';
}

/**
 * Default seed options
 */
const DEFAULT_SEED_OPTIONS: SeedOptions = {
  useTransaction: true,
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  logging: true,
  retryAttempts: 3,
  throwOnError: true,
  journeyContext: 'core',
};

/**
 * Logger for seed operations
 */
export class SeedLogger {
  private static instance: SeedLogger;
  private enabled: boolean = true;
  
  private constructor() {}
  
  /**
   * Get the singleton instance of SeedLogger
   */
  public static getInstance(): SeedLogger {
    if (!SeedLogger.instance) {
      SeedLogger.instance = new SeedLogger();
    }
    return SeedLogger.instance;
  }
  
  /**
   * Enable or disable logging
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Log an informational message
   */
  public info(message: string, context?: Record<string, any>): void {
    if (!this.enabled) return;
    console.log(`[SEED INFO] ${message}`, context || '');
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    if (!this.enabled) return;
    console.warn(`[SEED WARN] ${message}`, context || '');
  }
  
  /**
   * Log an error message
   */
  public error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.enabled) return;
    console.error(`[SEED ERROR] ${message}`, error || '', context || '');
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    if (!this.enabled || process.env.NODE_ENV !== 'development') return;
    console.debug(`[SEED DEBUG] ${message}`, context || '');
  }
  
  /**
   * Log the start of a seed operation
   */
  public startOperation(operation: string, context?: Record<string, any>): void {
    this.info(`Starting operation: ${operation}`, context);
  }
  
  /**
   * Log the completion of a seed operation
   */
  public completeOperation(operation: string, timeMs?: number, context?: Record<string, any>): void {
    const timeInfo = timeMs ? ` (${timeMs}ms)` : '';
    this.info(`Completed operation: ${operation}${timeInfo}`, context);
  }
}

/**
 * Get a singleton instance of the seed logger
 */
export const seedLogger = SeedLogger.getInstance();

/**
 * Wraps a seed operation in a transaction if enabled in options
 * 
 * @param prisma PrismaClient or PrismaService instance
 * @param operation Function containing the seed operation
 * @param options Seed operation options
 * @returns Result of the operation
 */
export async function withTransaction<T>(
  prisma: PrismaClient | PrismaService,
  operation: (tx: any) => Promise<T>,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  // If transactions are disabled, run the operation directly
  if (!opts.useTransaction) {
    return operation(prisma);
  }
  
  // Use TransactionService if available (PrismaService)
  if (prisma instanceof PrismaService && 'getTransactionService' in prisma) {
    const txService = prisma.getTransactionService();
    try {
      return await txService.withTransaction(
        (tx) => operation(tx),
        { isolationLevel: opts.isolationLevel }
      );
    } catch (error) {
      logger.error('Transaction failed', error);
      if (opts.throwOnError) {
        throw new TransactionException(
          'Failed to execute seed operation in transaction',
          { cause: error, type: DatabaseErrorType.TRANSACTION }
        );
      }
      return null as unknown as T;
    }
  }
  
  // Fallback to Prisma's built-in transaction
  try {
    return await (prisma as PrismaClient).$transaction(
      (tx) => operation(tx),
      { isolationLevel: opts.isolationLevel as Prisma.TransactionIsolationLevel }
    );
  } catch (error) {
    logger.error('Transaction failed', error);
    if (opts.throwOnError) {
      throw new TransactionException(
        'Failed to execute seed operation in transaction',
        { cause: error, type: DatabaseErrorType.TRANSACTION }
      );
    }
    return null as unknown as T;
  }
}

/**
 * Executes a database operation with retry logic for transient errors
 * 
 * @param operation Function to execute
 * @param options Seed operation options
 * @returns Result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= opts.retryAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is transient and retryable
      const isTransient = isTransientError(error);
      
      if (!isTransient || attempt >= opts.retryAttempts) {
        logger.error(
          `Operation failed after ${attempt} attempts`,
          error
        );
        
        if (opts.throwOnError) {
          throw new DatabaseException(
            'Failed to execute seed operation after retries',
            { cause: error, type: DatabaseErrorType.QUERY }
          );
        }
        
        return null as unknown as T;
      }
      
      // Calculate backoff delay with exponential backoff and jitter
      const baseDelay = 100; // 100ms base delay
      const maxDelay = 2000; // 2 seconds max delay
      const exponentialDelay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt - 1)
      );
      const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
      const delay = exponentialDelay + jitter;
      
      logger.warn(
        `Transient error detected, retrying in ${Math.round(delay)}ms (attempt ${attempt}/${opts.retryAttempts})`,
        { error: error.message }
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the loop structure, but TypeScript needs it
  throw lastError;
}

/**
 * Checks if an error is likely transient and can be retried
 * 
 * @param error Error to check
 * @returns True if the error is transient
 */
export function isTransientError(error: any): boolean {
  // Check for Prisma-specific connection errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Connection errors (P1000s) are typically transient
    if (error.code.startsWith('P1')) {
      return true;
    }
    
    // Specific error codes that are typically transient
    const transientErrorCodes = [
      'P2024', // Connection pool timeout
      'P2028', // Transaction API error
      'P2034', // Transaction timeout
      'P2035', // Deadlock
    ];
    
    return transientErrorCodes.includes(error.code);
  }
  
  // Check for generic database connection errors
  if (error instanceof DatabaseException) {
    return error.type === DatabaseErrorType.CONNECTION;
  }
  
  // Check error message for common transient error patterns
  const errorMessage = error.message?.toLowerCase() || '';
  const transientPatterns = [
    'connection',
    'timeout',
    'deadlock',
    'too many connections',
    'connection reset',
    'connection refused',
    'temporarily unavailable',
  ];
  
  return transientPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Safely performs an upsert operation with proper error handling
 * 
 * @param prisma Prisma client or transaction
 * @param model Prisma model name
 * @param where Unique identifier for the record
 * @param create Data for creating a new record
 * @param update Data for updating an existing record
 * @param options Seed operation options
 * @returns The created or updated record
 */
export async function safeUpsert<T>(
  prisma: any,
  model: string,
  where: any,
  create: any,
  update: any = {},
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  try {
    // Check if the model exists on the prisma client
    if (!(model in prisma)) {
      throw new Error(`Model ${model} not found on Prisma client`);
    }
    
    logger.debug(`Upserting ${model}`, { where });
    
    // Perform the upsert operation
    return await prisma[model].upsert({
      where,
      create,
      update,
    });
  } catch (error) {
    logger.error(`Failed to upsert ${model}`, error, { where, create, update });
    
    if (opts.throwOnError) {
      throw new QueryException(
        `Failed to upsert ${model}`,
        { cause: error, type: DatabaseErrorType.QUERY }
      );
    }
    
    return null as unknown as T;
  }
}

/**
 * Safely creates a record if it doesn't exist
 * 
 * @param prisma Prisma client or transaction
 * @param model Prisma model name
 * @param where Unique identifier for the record
 * @param data Data for creating the record
 * @param options Seed operation options
 * @returns The created record or null if it already exists
 */
export async function safeCreate<T>(
  prisma: any,
  model: string,
  where: any,
  data: any,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<T | null> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  try {
    // Check if the model exists on the prisma client
    if (!(model in prisma)) {
      throw new Error(`Model ${model} not found on Prisma client`);
    }
    
    // Check if the record already exists
    const existing = await prisma[model].findUnique({ where });
    
    if (existing) {
      logger.debug(`${model} already exists, skipping creation`, { where });
      return existing;
    }
    
    logger.debug(`Creating ${model}`, { data });
    
    // Create the record
    return await prisma[model].create({ data });
  } catch (error) {
    // Handle unique constraint violations gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      logger.warn(`${model} already exists (concurrent creation)`, { where });
      return await prisma[model].findUnique({ where });
    }
    
    logger.error(`Failed to create ${model}`, error, { where, data });
    
    if (opts.throwOnError) {
      throw new QueryException(
        `Failed to create ${model}`,
        { cause: error, type: DatabaseErrorType.QUERY }
      );
    }
    
    return null;
  }
}

/**
 * Safely connects related records with proper error handling
 * 
 * @param prisma Prisma client or transaction
 * @param model Prisma model name
 * @param id ID of the record to update
 * @param relation Name of the relation to connect
 * @param connectIds IDs to connect to the relation
 * @param options Seed operation options
 * @returns The updated record
 */
export async function safeConnect<T>(
  prisma: any,
  model: string,
  id: string | number,
  relation: string,
  connectIds: Array<string | number>,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  try {
    // Check if the model exists on the prisma client
    if (!(model in prisma)) {
      throw new Error(`Model ${model} not found on Prisma client`);
    }
    
    logger.debug(`Connecting ${connectIds.length} IDs to ${model}.${relation}`, { id, connectIds });
    
    // Create the connection data structure
    const data = {
      [relation]: {
        connect: connectIds.map(connectId => ({ id: connectId })),
      },
    };
    
    // Update the record with the connections
    return await prisma[model].update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Failed to connect relations to ${model}.${relation}`, error, { id, connectIds });
    
    if (opts.throwOnError) {
      throw new QueryException(
        `Failed to connect relations to ${model}.${relation}`,
        { cause: error, type: DatabaseErrorType.QUERY }
      );
    }
    
    return null as unknown as T;
  }
}

/**
 * Safely deletes test data with proper error handling
 * 
 * @param prisma Prisma client or transaction
 * @param model Prisma model name
 * @param where Filter for records to delete
 * @param options Seed operation options
 * @returns Count of deleted records
 */
export async function safeDelete(
  prisma: any,
  model: string,
  where: any,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<number> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  try {
    // Check if the model exists on the prisma client
    if (!(model in prisma)) {
      throw new Error(`Model ${model} not found on Prisma client`);
    }
    
    logger.debug(`Deleting ${model} records`, { where });
    
    // Delete the records
    const result = await prisma[model].deleteMany({ where });
    return result.count;
  } catch (error) {
    logger.error(`Failed to delete ${model} records`, error, { where });
    
    if (opts.throwOnError) {
      throw new QueryException(
        `Failed to delete ${model} records`,
        { cause: error, type: DatabaseErrorType.QUERY }
      );
    }
    
    return 0;
  }
}

/**
 * Generates a deterministic UUID based on a seed string
 * This is useful for creating consistent test data across runs
 * 
 * @param seed Seed string to generate UUID from
 * @param namespace Optional namespace for the UUID
 * @returns Deterministic UUID
 */
export function deterministicUuid(seed: string, namespace?: string): string {
  const nsPrefix = namespace ? `${namespace}:` : '';
  const combinedSeed = `${nsPrefix}${seed}`;
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < combinedSeed.length; i++) {
    const char = combinedSeed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to seed a UUID
  const seedUuid = uuidv4({ random: [hash & 0xff, (hash >> 8) & 0xff, (hash >> 16) & 0xff, (hash >> 24) & 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
  
  return seedUuid;
}

/**
 * Generates a random but consistent value based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random number between min and max
 */
export function seededRandom(seed: string, min: number, max: number): number {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to generate a value between 0 and 1
  const random = Math.abs(hash) / 2147483647; // Max 32bit integer
  
  // Scale to the desired range
  return Math.floor(random * (max - min + 1)) + min;
}

/**
 * Generates a random date within a range based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @param startDate Start of date range
 * @param endDate End of date range
 * @returns Random date between startDate and endDate
 */
export function seededDate(seed: string, startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = seededRandom(seed, startTime, endTime);
  return new Date(randomTime);
}

/**
 * Generates a random boolean based on a seed and probability
 * 
 * @param seed Seed string for consistent generation
 * @param probability Probability of returning true (0-1)
 * @returns Random boolean
 */
export function seededBoolean(seed: string, probability: number = 0.5): boolean {
  const random = seededRandom(seed, 0, 1000) / 1000;
  return random < probability;
}

/**
 * Generates a random item from an array based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @param array Array to select from
 * @returns Random item from the array
 */
export function seededArrayItem<T>(seed: string, array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot select from an empty array');
  }
  const index = seededRandom(seed, 0, array.length - 1);
  return array[index];
}

/**
 * Generates a random subset of an array based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @param array Array to select from
 * @param count Number of items to select
 * @returns Random subset of the array
 */
export function seededArraySubset<T>(seed: string, array: T[], count: number): T[] {
  if (array.length === 0) {
    return [];
  }
  
  if (count >= array.length) {
    return [...array]; // Return a copy of the entire array
  }
  
  // Fisher-Yates shuffle with seeded random
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = seededRandom(`${seed}:${i}`, 0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

/**
 * Generates a random string based on a seed and pattern
 * 
 * @param seed Seed string for consistent generation
 * @param length Length of the string to generate
 * @param pattern Pattern of characters to use (default: alphanumeric)
 * @returns Random string
 */
export function seededString(seed: string, length: number, pattern: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = seededRandom(`${seed}:${i}`, 0, pattern.length - 1);
    result += pattern.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Generates a random Brazilian CPF number based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @returns Valid CPF number
 */
export function generateCPF(seed: string): string {
  // Generate 9 random digits
  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += seededRandom(`${seed}:cpf:${i}`, 0, 9).toString();
  }
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Add first verification digit
  cpf += digit1;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Add second verification digit
  cpf += digit2;
  
  return cpf;
}

/**
 * Generates a random Brazilian phone number based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @returns Valid Brazilian phone number
 */
export function generatePhoneNumber(seed: string): string {
  // Generate area code (11-99)
  const areaCode = seededRandom(`${seed}:phone:area`, 11, 99).toString();
  
  // Generate 9-digit mobile number (9XXXXXXXX)
  let number = '9';
  for (let i = 0; i < 8; i++) {
    number += seededRandom(`${seed}:phone:${i}`, 0, 9).toString();
  }
  
  return `+55${areaCode}${number}`;
}

/**
 * Generates a random email address based on a seed
 * 
 * @param seed Seed string for consistent generation
 * @returns Valid email address
 */
export function generateEmail(seed: string): string {
  const username = seededString(`${seed}:email:username`, 8).toLowerCase();
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'austa.com.br', 'example.com'];
  const domain = seededArrayItem(`${seed}:email:domain`, domains);
  
  return `${username}@${domain}`;
}

/**
 * Generates a hashed password for testing
 * 
 * @param password Plain text password
 * @returns Hashed password
 */
export async function generateHashedPassword(password: string = 'Password123!'): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Generates test user data with consistent values based on a seed
 * 
 * @param seed Seed for consistent generation
 * @param overrides Properties to override in the generated data
 * @returns User data object
 */
export function generateUserData(seed: string, overrides: Record<string, any> = {}): Record<string, any> {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  
  const userData = {
    name: `${firstName} ${lastName}`,
    email: generateEmail(`${seed}:${firstName}${lastName}`),
    cpf: generateCPF(`${seed}:${firstName}`),
    phone: generatePhoneNumber(`${seed}:${firstName}`),
    ...overrides,
  };
  
  return userData;
}

/**
 * Measures the execution time of a function
 * 
 * @param fn Function to measure
 * @returns Tuple of [result, executionTimeMs]
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<[T, number]> {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  
  return [result, executionTime];
}

/**
 * Executes a seed operation with timing and logging
 * 
 * @param name Name of the operation for logging
 * @param fn Function to execute
 * @param options Seed operation options
 * @returns Result of the operation
 */
export async function executeSeedOperation<T>(
  name: string,
  fn: () => Promise<T>,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  logger.startOperation(name);
  
  try {
    const [result, executionTime] = await measureExecutionTime(fn);
    logger.completeOperation(name, executionTime);
    return result;
  } catch (error) {
    logger.error(`Failed to execute operation: ${name}`, error);
    
    if (opts.throwOnError) {
      throw error;
    }
    
    return null as unknown as T;
  }
}

/**
 * Cleans up test data for a specific journey
 * 
 * @param prisma PrismaClient or PrismaService instance
 * @param journeyContext Journey context to clean up
 * @param options Seed operation options
 * @returns Count of deleted records
 */
export async function cleanupJourneyData(
  prisma: PrismaClient | PrismaService,
  journeyContext: 'health' | 'care' | 'plan' | 'gamification' | 'core',
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<number> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options, journeyContext };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  logger.info(`Cleaning up test data for journey: ${journeyContext}`);
  
  let deletedCount = 0;
  
  // Use transaction for atomic cleanup
  await withTransaction(prisma, async (tx) => {
    // Journey-specific cleanup logic
    switch (journeyContext) {
      case 'health':
        deletedCount += await safeDelete(tx, 'healthMetric', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'healthGoal', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'deviceConnection', { isTestData: true }, opts);
        break;
        
      case 'care':
        deletedCount += await safeDelete(tx, 'appointment', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'medication', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'telemedicineSession', { isTestData: true }, opts);
        break;
        
      case 'plan':
        deletedCount += await safeDelete(tx, 'claim', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'benefit', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'insurancePlan', { isTestData: true }, opts);
        break;
        
      case 'gamification':
        deletedCount += await safeDelete(tx, 'achievement', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'reward', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'quest', { isTestData: true }, opts);
        deletedCount += await safeDelete(tx, 'gameEvent', { isTestData: true }, opts);
        break;
        
      case 'core':
        // Be careful with core data - only delete test-specific records
        deletedCount += await safeDelete(tx, 'user', { email: { contains: 'test-' } }, opts);
        break;
    }
    
    return deletedCount;
  }, opts);
  
  logger.info(`Cleaned up ${deletedCount} test records for journey: ${journeyContext}`);
  
  return deletedCount;
}

/**
 * Verifies data integrity between related entities
 * 
 * @param prisma PrismaClient or PrismaService instance
 * @param sourceModel Source model name
 * @param sourceId Source record ID
 * @param targetModel Target model name
 * @param relationField Field name for the relation
 * @param options Seed operation options
 * @returns True if integrity is verified, false otherwise
 */
export async function verifyDataIntegrity(
  prisma: any,
  sourceModel: string,
  sourceId: string | number,
  targetModel: string,
  relationField: string,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<boolean> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  try {
    // Check if the models exist on the prisma client
    if (!(sourceModel in prisma) || !(targetModel in prisma)) {
      throw new Error(`Model not found on Prisma client`);
    }
    
    // Get the source record
    const source = await prisma[sourceModel].findUnique({
      where: { id: sourceId },
      include: { [relationField]: true },
    });
    
    if (!source) {
      logger.error(`Source record not found: ${sourceModel} with ID ${sourceId}`);
      return false;
    }
    
    // Check if the relation exists
    if (!source[relationField]) {
      logger.error(`Relation ${relationField} not found on ${sourceModel}`);
      return false;
    }
    
    // For to-many relations, check if the array is not empty
    if (Array.isArray(source[relationField])) {
      const isValid = source[relationField].length > 0;
      
      if (!isValid) {
        logger.error(`Relation ${relationField} is empty on ${sourceModel} with ID ${sourceId}`);
      } else {
        logger.debug(`Verified ${source[relationField].length} related records for ${sourceModel}.${relationField}`);
      }
      
      return isValid;
    }
    
    // For to-one relations, check if the object exists
    const isValid = !!source[relationField];
    
    if (!isValid) {
      logger.error(`Relation ${relationField} is null on ${sourceModel} with ID ${sourceId}`);
    } else {
      logger.debug(`Verified relation ${sourceModel}.${relationField} exists`);
    }
    
    return isValid;
  } catch (error) {
    logger.error(`Failed to verify data integrity`, error, {
      sourceModel,
      sourceId,
      targetModel,
      relationField,
    });
    
    if (opts.throwOnError) {
      throw new QueryException(
        `Failed to verify data integrity`,
        { cause: error, type: DatabaseErrorType.QUERY }
      );
    }
    
    return false;
  }
}