/**
 * Database Authentication Provider
 * 
 * This module provides components for authenticating users against database records.
 * It includes interfaces, implementations, and utilities for secure password handling
 * and user credential validation.
 * 
 * @module auth/providers/database
 */

// Interfaces
export * from './database-auth-provider.interface';

// Implementations
export * from './database-auth-provider';

// Modules
export * from './database-auth.module';

// Utilities
export * from './password-utils';