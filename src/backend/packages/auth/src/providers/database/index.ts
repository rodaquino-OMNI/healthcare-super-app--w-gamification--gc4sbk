/**
 * Database Authentication Provider Barrel Export
 * 
 * This file exports all components related to database authentication,
 * providing a centralized access point for consumers of this package.
 * 
 * @module auth/providers/database
 */

// Export the database authentication provider interface
export * from './database-auth-provider.interface';

// Export the database authentication provider implementation
export * from './database-auth-provider';

// Export password utilities
export * from './password-utils';

// Export the database authentication module
export * from './database-auth.module';