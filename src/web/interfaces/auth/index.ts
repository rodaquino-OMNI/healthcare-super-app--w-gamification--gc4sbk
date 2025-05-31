/**
 * Authentication Interfaces for the AUSTA SuperApp
 * 
 * This barrel file aggregates and re-exports all authentication-related TypeScript interfaces
 * from the AUSTA SuperApp's auth module. It provides a single entry point for importing
 * auth interfaces, simplifying imports and ensuring consistency across the codebase.
 *
 * @packageDocumentation
 */

// Export session-related interfaces
export * from './session.types';

// Export authentication state interfaces
export * from './state.types';

// Export token-related interfaces
export * from './token.types';

// Export user profile interfaces
export * from './user.types';

// Export API response interfaces
export * from './responses.types';