/**
 * Common interfaces used across all services in the AUSTA SuperApp
 * 
 * This module provides shared utility interfaces that are used by multiple services
 * regardless of their specific journey context.
 *
 * @packageDocumentation
 */

// Export repository interface
export { Repository } from './repository.interface';

// Export all DTOs
export * as DTO from './dto';

// Direct exports for backward compatibility
export * from './dto';