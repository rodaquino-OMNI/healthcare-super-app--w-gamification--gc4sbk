/**
 * @file Database Test Seed Module
 * 
 * Main entry point for the database test seed module that exports all journey-specific
 * and core seed functions. This module enables selective seeding of test data for specific
 * journeys or comprehensive initialization of a full test database.
 * 
 * It provides a unified API for all test seeding operations while allowing for flexible,
 * modular usage in different test scenarios.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { 
  TestSeedOptions, 
  defaultSeedOptions, 
  prefixTestData, 
  getCountByVolume,
  handleSeedError 
} from './types';

// Re-export shared types and utilities
export * from './types';

// Re-export journey-specific seed functions
export * from './core';
export * from './health';
export * from './care';
export * from './plan';
export * from './gamification';

/**
 * Seeds the test database with configurable test data.
 * 
 * This is the main entry point for seeding test data. It provides a unified API
 * for all test seeding operations while allowing for flexible, modular usage in
 * different test scenarios.
 * 
 * @example
 * // Seed all journeys with default options
 * await seedTestDatabase();
 * 
 * @example
 * // Seed only health and care journeys with medium data volume
 * await seedTestDatabase({
 *   journeys: ['health', 'care'],
 *   dataVolume: 'medium',
 *   logging: true
 * });
 * 
 * @param options - Configuration options for test seeding
 * @returns A promise that resolves when the database is seeded
 */
export async function seedTestDatabase(options: TestSeedOptions = {}): Promise<void> {
  // Merge provided options with defaults
  const seedOptions = { ...defaultSeedOptions, ...options };
  
  // Generate a test prefix if isolation is enabled and no prefix is provided
  if (seedOptions.isolate && !seedOptions.testPrefix) {
    seedOptions.testPrefix = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  // Create or use provided PrismaService
  const prismaService = seedOptions.prismaService || new PrismaService();
  // Create or use provided PrismaClient
  const prisma = seedOptions.prismaClient || new PrismaClient();
  
  try {
    if (seedOptions.logging) {
      console.log(`Starting test database seeding with options:`, seedOptions);
    }
    
    // Clean the database first to ensure a consistent state
    if (seedOptions.cleanBeforeSeeding) {
      if (seedOptions.logging) {
        console.log('Cleaning test database...');
      }
      await cleanTestDatabase(prismaService, seedOptions);
    }
    
    // Import and use journey-specific seed functions
    const { seedCoreData } = await import('./core');
    
    // Seed core data (permissions, roles, users)
    if (seedOptions.logging) {
      console.log('Seeding core data...');
    }
    await seedCoreData(prisma, seedOptions);
    
    // Seed journey-specific data
    if (seedOptions.logging) {
      console.log(`Seeding journey-specific data for: ${seedOptions.journeys.join(', ')}`);
    }
    await seedJourneyData(prisma, seedOptions);
    
    if (seedOptions.logging) {
      console.log('Test database seeding completed successfully!');
    }
    
    return;
  } catch (error) {
    handleSeedError(error, seedOptions);
  } finally {
    // Close the database connection if requested
    if (seedOptions.disconnectAfterSeeding && !seedOptions.prismaClient) {
      await prisma.$disconnect();
    }
  }
}

/**
 * Seeds journey-specific test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
async function seedJourneyData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Dynamically import journey-specific seed functions
    const journeyModules = await Promise.all([
      options.journeys?.includes('health') ? import('./health') : Promise.resolve(null),
      options.journeys?.includes('care') ? import('./care') : Promise.resolve(null),
      options.journeys?.includes('plan') ? import('./plan') : Promise.resolve(null),
      options.journeys?.includes('gamification') ? import('./gamification') : Promise.resolve(null),
    ]);
    
    // Create journey-specific contexts if needed
    const healthContext = options.journeys?.includes('health') ? new HealthContext(prisma) : null;
    const careContext = options.journeys?.includes('care') ? new CareContext(prisma) : null;
    const planContext = options.journeys?.includes('plan') ? new PlanContext(prisma) : null;
    
    // Seed health journey data
    if (options.journeys?.includes('health') && journeyModules[0]) {
      const { seedHealthJourneyData } = journeyModules[0];
      if (options.logging) {
        console.log('Seeding health journey data...');
      }
      await seedHealthJourneyData(prisma, options, healthContext);
    }
    
    // Seed care journey data
    if (options.journeys?.includes('care') && journeyModules[1]) {
      const { seedCareJourneyData } = journeyModules[1];
      if (options.logging) {
        console.log('Seeding care journey data...');
      }
      await seedCareJourneyData(prisma, options, careContext);
    }
    
    // Seed plan journey data
    if (options.journeys?.includes('plan') && journeyModules[2]) {
      const { seedPlanJourneyData } = journeyModules[2];
      if (options.logging) {
        console.log('Seeding plan journey data...');
      }
      await seedPlanJourneyData(prisma, options, planContext);
    }
    
    // Seed gamification data
    if (options.journeys?.includes('gamification') && journeyModules[3]) {
      const { seedGamificationData } = journeyModules[3];
      if (options.logging) {
        console.log('Seeding gamification data...');
      }
      await seedGamificationData(prisma, options);
    }
  } catch (error) {
    handleSeedError(error, options);
  }
}

/**
 * Cleans the test database to ensure a consistent state for tests.
 * 
 * @param prismaService - The PrismaService instance
 * @param options - Test seed options
 */
export async function cleanTestDatabase(prismaService: PrismaService, options: TestSeedOptions): Promise<void> {
  try {
    // If isolation is enabled, only clean data with the test prefix
    if (options.isolate && options.testPrefix) {
      // Clean only data with the specific test prefix
      await prismaService.cleanDatabaseByPrefix(options.testPrefix);
    } else {
      // Clean all test data
      await prismaService.cleanDatabase();
    }
  } catch (error) {
    handleSeedError(error, options);
  }
}