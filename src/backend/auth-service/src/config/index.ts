/**
 * Auth Service Configuration Module
 * 
 * This barrel file exports all configuration components from the Auth Service config module,
 * providing a clean public API for importing configuration throughout the service.
 * 
 * @module config
 */

// Export configuration provider and type
export { default as configuration } from './configuration';
export { configuration as authServiceConfiguration } from './configuration';
export type { AuthServiceConfig } from './configuration';

// Export validation schema
export { AuthServiceConfigValidation } from './validation.schema';

// Re-export any configuration constants or interfaces

/**
 * Configuration module provides centralized access to all Auth Service configuration
 * components, including environment variables, validation schemas, and configuration types.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Import the configuration provider
 * import { configuration } from '@app/config';
 * 
 * // Import the configuration type
 * import { AuthServiceConfig } from '@app/config';
 * 
 * // Import the validation schema
 * import { AuthServiceConfigValidation } from '@app/config';
 * ```
 */