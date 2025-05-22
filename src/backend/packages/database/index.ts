/**
 * @austa/database
 * 
 * This package provides enhanced database functionality for the AUSTA SuperApp,
 * including an optimized PrismaService with connection pooling, journey-specific
 * database contexts, transaction management utilities, and data validation tools.
 * 
 * The package is designed to be used by all microservices in the AUSTA SuperApp
 * to ensure consistent database access patterns, error handling, and performance
 * optimizations across the application.
 */

// Re-export the main database module for NestJS integration
export * from './src/database.module';
export { PrismaService } from './src/prisma.service';

// Export journey-specific database contexts
export * from './src/contexts';

// Export connection management utilities
export * from './src/connection';

// Export transaction management utilities
export * from './src/transactions';

// Export database error handling utilities
export * from './src/errors';

// Export database middleware
export * from './src/middleware';

// Export database utility functions
export * from './src/utils';

// Export database types
export * from './src/types';