/**
 * @file Barrel file that exports all common DTOs for clean and consistent imports
 * throughout the gamification engine.
 */

// Base response and error handling DTOs
export * from './base-response.dto';
export * from './error-response.dto';

// Query parameter DTOs
export * from './api-query.dto';
export * from './filter.dto';
export * from './sort.dto';
export * from './pagination.dto';

// Re-export from @austa/interfaces for consistent type definitions
// These will be available once the @austa/interfaces package is implemented
// export * from '@austa/interfaces/common/dto';

/**
 * Utility type for creating partial DTOs for update operations
 * Makes all properties optional except for the ID
 */
export type PartialWithId<T> = { id: string } & Partial<Omit<T, 'id'>>;

/**
 * Utility type for creating DTOs without system-managed fields
 * Removes id, createdAt, and updatedAt from the type
 */
export type CreateDto<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Utility type for creating DTOs for update operations
 * Makes all properties optional and removes system-managed fields
 */
export type UpdateDto<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;