/**
 * Database Test Seed Module
 * 
 * @file index.ts
 * @description Main entry point for the database test seed module that exports all journey-specific
 * and core seed functions. This file enables selective seeding of test data for specific journeys
 * or comprehensive initialization of a full test database. It provides a unified API for all test
 * seeding operations while allowing for flexible, modular usage in different test scenarios.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';

// Import seed types and utilities
import {
  SeedFunctionParams,
  SeedOptions,
  SeedResult,
  SeedStats,
  JourneyType,
  MainSeedFunction,
  CompleteSeedData,
  PartialSeedData
} from './types';
import {
  seedLogger,
  withTransaction,
  withRetry,
  executeSeedOperation
} from './utils';

// Import journey-specific seed modules
import coreSeed, {
  seedPermissions,
  seedRoles,
  seedUsers,
  seedCoreEntities,
  createTestUser,
  getOrCreateTestUser,
  getOrCreateAdminUser,
  getOrCreateStandardUser,
  CoreSeedOptions
} from './core-seed';

import { seedHealthJourney } from './health-seed';
import { seedCareJourney } from './care-seed';
import { seedPlanJourney } from './plan-seed';
import { seedGamificationJourney } from './gamification-seed';

/**
 * Default seed options for the main seed function
 */
export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  cleanDatabase: false,
  logging: true,
  journeys: ['health', 'care', 'plan'],
  includeTestData: true,
  testDataCount: 10,
  randomSeed: 42
};

/**
 * Main seed function that orchestrates seeding of all journeys
 * 
 * @param options - Configuration options for seeding
 * @returns A promise that resolves with the seed result
 */
export async function seed(options: SeedOptions = DEFAULT_SEED_OPTIONS): Promise<SeedResult> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  const stats: SeedStats = {
    created: {},
    updated: {},
    skipped: {},
    timeTakenMs: 0
  };
  
  logger.info('Starting database seeding...');
  const startTime = Date.now();
  
  // Create an instance of PrismaService for database operations
  const prismaService = new PrismaService();
  const prisma = prismaService as unknown as PrismaClient;
  
  try {
    // Clean the database first if requested
    if (opts.cleanDatabase) {
      logger.info('Cleaning database...');
      await prismaService.cleanDatabase();
    }
    
    // Create journey-specific database contexts
    const healthContext = new HealthContext(prismaService);
    const careContext = new CareContext(prismaService);
    const planContext = new PlanContext(prismaService);
    
    // Seed core entities (permissions, roles, users)
    logger.info('Seeding core entities...');
    const coreResult = await seedCoreEntities({ prisma, options: opts });
    mergeStats(stats, coreResult.stats);
    
    // Determine which journeys to seed
    const seedJourneys = opts.journeys || ['health', 'care', 'plan'];
    
    // Seed journey-specific data
    for (const journey of seedJourneys) {
      try {
        switch (journey) {
          case 'health':
            logger.info('Seeding Health journey data...');
            await seedHealthJourney(
              {
                volume: getVolumeFromOptions(opts),
                scenarios: ['basic', opts.includeTestData ? 'all' : 'basic'],
                clean: false, // Already cleaned if requested
                verbose: opts.logging
              },
              healthContext
            );
            stats.created['health_journey'] = 1;
            break;
            
          case 'care':
            logger.info('Seeding Care journey data...');
            await seedCareJourney(
              {
                volume: getVolumeFromOptions(opts),
                scenarios: ['basic', opts.includeTestData ? 'all' : 'basic'],
                clean: false, // Already cleaned if requested
                verbose: opts.logging
              },
              careContext
            );
            stats.created['care_journey'] = 1;
            break;
            
          case 'plan':
            logger.info('Seeding Plan journey data...');
            await seedPlanJourney(
              {
                volume: getVolumeFromOptions(opts),
                scenarios: ['basic', opts.includeTestData ? 'all' : 'basic'],
                clean: false, // Already cleaned if requested
                verbose: opts.logging
              },
              planContext
            );
            stats.created['plan_journey'] = 1;
            break;
            
          case null:
            // Seed gamification data (cross-journey)
            logger.info('Seeding Gamification data...');
            await seedGamificationJourney(
              {
                volume: getVolumeFromOptions(opts),
                scenarios: ['basic', opts.includeTestData ? 'all' : 'basic'],
                clean: false, // Already cleaned if requested
                verbose: opts.logging
              },
              prismaService
            );
            stats.created['gamification'] = 1;
            break;
            
          default:
            logger.warn(`Unknown journey type: ${journey}, skipping...`);
            stats.skipped[`${journey}_journey`] = 1;
        }
      } catch (error) {
        logger.error(`Error seeding ${journey} journey:`, error);
        stats.skipped[`${journey}_journey`] = 1;
        
        // Continue with other journeys even if one fails
        continue;
      }
    }
    
    const endTime = Date.now();
    stats.timeTakenMs = endTime - startTime;
    
    logger.info(`Database seeding completed in ${stats.timeTakenMs}ms`);
    
    return {
      success: true,
      stats
    };
  } catch (error) {
    const endTime = Date.now();
    stats.timeTakenMs = endTime - startTime;
    
    logger.error('Error seeding database:', error);
    
    return {
      success: false,
      error: error.message,
      stats
    };
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

/**
 * Helper function to determine volume setting from options
 */
function getVolumeFromOptions(options: SeedOptions): 'low' | 'medium' | 'high' {
  if (!options.testDataCount) return 'low';
  
  if (options.testDataCount <= 10) return 'low';
  if (options.testDataCount <= 100) return 'medium';
  return 'high';
}

/**
 * Helper function to merge stats from multiple seed operations
 */
function mergeStats(target: SeedStats, source: SeedStats): void {
  // Merge created counts
  for (const key in source.created) {
    target.created[key] = (target.created[key] || 0) + source.created[key];
  }
  
  // Merge updated counts
  for (const key in source.updated) {
    target.updated[key] = (target.updated[key] || 0) + source.updated[key];
  }
  
  // Merge skipped counts
  for (const key in source.skipped) {
    target.skipped[key] = (target.skipped[key] || 0) + source.skipped[key];
  }
}

/**
 * Seeds a test database with minimal data for unit tests
 * 
 * @param options - Configuration options for seeding
 * @returns A promise that resolves with the seed result
 */
export async function seedMinimal(options: SeedOptions = { ...DEFAULT_SEED_OPTIONS, includeTestData: false }): Promise<SeedResult> {
  return seed({
    ...DEFAULT_SEED_OPTIONS,
    ...options,
    cleanDatabase: true,
    includeTestData: false,
    journeys: [] // Only seed core entities
  });
}

/**
 * Seeds a test database with data for a specific journey
 * 
 * @param journey - The journey to seed
 * @param options - Configuration options for seeding
 * @returns A promise that resolves with the seed result
 */
export async function seedJourney(journey: JourneyType, options: SeedOptions = DEFAULT_SEED_OPTIONS): Promise<SeedResult> {
  return seed({
    ...DEFAULT_SEED_OPTIONS,
    ...options,
    journeys: journey ? [journey] : []
  });
}

/**
 * Seeds a test database with data for integration tests
 * 
 * @param options - Configuration options for seeding
 * @returns A promise that resolves with the seed result
 */
export async function seedIntegration(options: SeedOptions = DEFAULT_SEED_OPTIONS): Promise<SeedResult> {
  return seed({
    ...DEFAULT_SEED_OPTIONS,
    ...options,
    cleanDatabase: true,
    includeTestData: true,
    testDataCount: 50 // Medium volume
  });
}

/**
 * Seeds a test database with data for performance tests
 * 
 * @param options - Configuration options for seeding
 * @returns A promise that resolves with the seed result
 */
export async function seedPerformance(options: SeedOptions = DEFAULT_SEED_OPTIONS): Promise<SeedResult> {
  return seed({
    ...DEFAULT_SEED_OPTIONS,
    ...options,
    cleanDatabase: true,
    includeTestData: true,
    testDataCount: 500 // High volume
  });
}

/**
 * Creates a test database with the specified seed data
 * 
 * @param seedData - Complete or partial seed data to use
 * @param options - Configuration options for seeding
 * @returns A promise that resolves with the seed result
 */
export async function seedWithData(
  seedData: PartialSeedData<CompleteSeedData>,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<SeedResult> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  const stats: SeedStats = {
    created: {},
    updated: {},
    skipped: {},
    timeTakenMs: 0
  };
  
  logger.info('Starting database seeding with custom data...');
  const startTime = Date.now();
  
  // Create an instance of PrismaService for database operations
  const prismaService = new PrismaService();
  const prisma = prismaService as unknown as PrismaClient;
  
  try {
    // Clean the database first if requested
    if (opts.cleanDatabase) {
      logger.info('Cleaning database...');
      await prismaService.cleanDatabase();
    }
    
    // Seed permissions if provided
    if (seedData.permissions) {
      logger.info(`Seeding ${seedData.permissions.length} permissions...`);
      const permissionsResult = await seedPermissions({ prisma, options: opts }, seedData.permissions);
      mergeStats(stats, permissionsResult.stats);
    }
    
    // Seed roles if provided
    if (seedData.roles) {
      logger.info(`Seeding ${seedData.roles.length} roles...`);
      const rolesResult = await seedRoles({ prisma, options: opts }, seedData.roles);
      mergeStats(stats, rolesResult.stats);
    }
    
    // Seed users if provided
    if (seedData.users) {
      logger.info(`Seeding ${seedData.users.length} users...`);
      const usersResult = await seedUsers({ prisma, options: opts }, seedData.users);
      mergeStats(stats, usersResult.stats);
    }
    
    // Seed health journey data if provided
    if (seedData.health) {
      logger.info('Seeding custom Health journey data...');
      const healthContext = new HealthContext(prismaService);
      await seedHealthJourney(
        {
          volume: getVolumeFromOptions(opts),
          scenarios: ['basic'],
          clean: false,
          verbose: opts.logging
        },
        healthContext
      );
      stats.created['health_journey'] = 1;
    }
    
    // Seed care journey data if provided
    if (seedData.care) {
      logger.info('Seeding custom Care journey data...');
      const careContext = new CareContext(prismaService);
      await seedCareJourney(
        {
          volume: getVolumeFromOptions(opts),
          scenarios: ['basic'],
          clean: false,
          verbose: opts.logging
        },
        careContext
      );
      stats.created['care_journey'] = 1;
    }
    
    // Seed plan journey data if provided
    if (seedData.plan) {
      logger.info('Seeding custom Plan journey data...');
      const planContext = new PlanContext(prismaService);
      await seedPlanJourney(
        {
          volume: getVolumeFromOptions(opts),
          scenarios: ['basic'],
          clean: false,
          verbose: opts.logging
        },
        planContext
      );
      stats.created['plan_journey'] = 1;
    }
    
    // Seed gamification data if provided
    if (seedData.gamification) {
      logger.info('Seeding custom Gamification data...');
      await seedGamificationJourney(
        {
          volume: getVolumeFromOptions(opts),
          scenarios: ['basic'],
          clean: false,
          verbose: opts.logging
        },
        prismaService
      );
      stats.created['gamification'] = 1;
    }
    
    const endTime = Date.now();
    stats.timeTakenMs = endTime - startTime;
    
    logger.info(`Custom database seeding completed in ${stats.timeTakenMs}ms`);
    
    return {
      success: true,
      stats
    };
  } catch (error) {
    const endTime = Date.now();
    stats.timeTakenMs = endTime - startTime;
    
    logger.error('Error seeding database with custom data:', error);
    
    return {
      success: false,
      error: error.message,
      stats
    };
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

/**
 * Cleans the test database, removing all data
 * 
 * @param options - Configuration options for cleaning
 * @returns A promise that resolves when cleaning is complete
 */
export async function cleanDatabase(options: { logging?: boolean } = { logging: true }): Promise<void> {
  const logger = seedLogger;
  logger.setEnabled(options.logging);
  
  logger.info('Cleaning database...');
  
  // Create an instance of PrismaService for database operations
  const prismaService = new PrismaService();
  
  try {
    await prismaService.cleanDatabase();
    logger.info('Database cleaned successfully');
  } catch (error) {
    logger.error('Error cleaning database:', error);
    throw error;
  } finally {
    // Close the database connection
    await (prismaService as unknown as PrismaClient).$disconnect();
  }
}

// Export all seed functions and types
export {
  // Core seed functions
  seedPermissions,
  seedRoles,
  seedUsers,
  seedCoreEntities,
  createTestUser,
  getOrCreateTestUser,
  getOrCreateAdminUser,
  getOrCreateStandardUser,
  
  // Journey-specific seed functions
  seedHealthJourney,
  seedCareJourney,
  seedPlanJourney,
  seedGamificationJourney,
  
  // Types and interfaces
  SeedOptions,
  SeedResult,
  SeedStats,
  JourneyType,
  CoreSeedOptions,
  
  // Constants
  DEFAULT_SEED_OPTIONS
};

// Default export for direct imports
export default {
  seed,
  seedMinimal,
  seedJourney,
  seedIntegration,
  seedPerformance,
  seedWithData,
  cleanDatabase,
  
  // Re-export core seed functions
  ...coreSeed,
  
  // Journey-specific seed functions
  seedHealthJourney,
  seedCareJourney,
  seedPlanJourney,
  seedGamificationJourney,
};