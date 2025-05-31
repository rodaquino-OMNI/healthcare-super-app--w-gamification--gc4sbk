/**
 * @file Auth Package Test Mocks Barrel File
 * 
 * This barrel file exports all mock implementations from the auth test/mocks folder,
 * providing a centralized access point for test utilities. It ensures that consuming
 * test files can import mocks using a single import statement, improving code
 * organization and preventing circular dependencies.
 * 
 * Mocks are organized by type:
 * - Database mocks: PrismaService, Redis, DatabaseAuthProvider
 * - JWT mocks: JwtProvider, TokenService
 * - OAuth mocks: Base OAuth provider and platform-specific implementations
 * - Service mocks: AuthService, ConfigService, LoggerService
 */

// Database Mocks
export * from './prisma.mock';
export * from './redis.mock';
export * from './database-auth-provider.mock';

// JWT Mocks
export * from './jwt-provider.mock';
export * from './token.service.mock';

// OAuth Provider Mocks
export * from './oauth-provider.mock';
export * from './google-provider.mock';
export * from './facebook-provider.mock';
export * from './apple-provider.mock';

// Service Mocks
export * from './auth.service.mock';
export * from './config.mock';
export * from './logger.mock';