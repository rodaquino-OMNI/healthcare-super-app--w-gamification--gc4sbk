/**
 * @file Auth Package Test Mocks Barrel File
 * @description Centralized export point for all auth package test mocks.
 * This file provides a single import source for all mock implementations
 * used in auth package tests, organized by mock type.
 */

// Database-related mocks
export * from './prisma.mock';
export * from './redis.mock';
export * from './database-auth-provider.mock';

// JWT-related mocks
export * from './jwt-provider.mock';
export * from './token.service.mock';

// OAuth-related mocks
export * from './oauth-provider.mock';
export * from './apple-provider.mock';
export * from './facebook-provider.mock';
export * from './google-provider.mock';

// Service-related mocks
export * from './auth.service.mock';
export * from './config.mock';
export * from './logger.mock';