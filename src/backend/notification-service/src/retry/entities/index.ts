/**
 * Barrel file for retry entities
 * 
 * This file exports all entity classes from the retry/entities directory,
 * providing a clean, unified import interface for consumers.
 * 
 * By using this barrel file, consumers can import multiple entities from a single path:
 * import { RetryOperation } from '@app/notification/retry/entities';
 * 
 * This approach simplifies imports throughout the application and establishes
 * a clear public API boundary for the retry module's entities.
 */

// Export all entities from this directory
export * from './retry-operation.entity';