/**
 * @austa/database
 * 
 * This package provides enhanced database functionality for the AUSTA SuperApp,
 * including an optimized PrismaService with connection pooling, journey-specific
 * database contexts, transaction management, and utility functions for database operations.
 * 
 * The package is designed to be used by all microservices in the AUSTA SuperApp
 * to ensure consistent database access patterns, error handling, and performance
 * optimizations across the application.
 */

// Core exports
export * from './src/database.module';
export * from './src/prisma.service';

// Journey-specific database contexts
export * from './src/contexts';

// Transaction management
export * from './src/transactions';

// Connection management
export * from './src/connection';

// Error handling
export * from './src/errors';

// Middleware
export * from './src/middleware';

// Utility functions
export * from './src/utils';

// Type definitions
export * from './src/types';