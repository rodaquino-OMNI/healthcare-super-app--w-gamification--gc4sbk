/**
 * @file Auth Test Mocks Index
 * @description Barrel file that exports all mock implementations from the auth test/mocks folder,
 * providing a centralized access point for test utilities.
 */

// Database mocks
export * from './prisma.mock';
export * from './database-auth-provider.mock';

// JWT mocks
export * from './jwt-provider.mock';
export * from './token.service.mock';

// OAuth mocks
export * from './oauth-provider.mock';
export * from './apple-provider.mock';
export * from './facebook-provider.mock';
export * from './google-provider.mock';

// Service mocks
export * from './auth.service.mock';
export * from './config.mock';
export * from './logger.mock';
export * from './redis.mock';