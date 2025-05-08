/**
 * @file Common DTO Interfaces Barrel Export
 * 
 * This file serves as the main entry point for all common Data Transfer Object (DTO) interfaces
 * used across the AUSTA SuperApp. It provides a centralized, type-safe way to import
 * all DTO interfaces, preventing circular dependencies and ensuring consistent import patterns.
 *
 * @module @austa/interfaces/common/dto
 */

/**
 * Re-export all types and interfaces from filter.dto.ts
 * These interfaces provide standardized filtering capabilities for repository queries
 */
export * from './filter.dto';

/**
 * Re-export all types and interfaces from pagination.dto.ts
 * These interfaces handle standardized pagination for API requests and responses
 */
export * from './pagination.dto';

/**
 * Re-export all types and interfaces from sort.dto.ts
 * These interfaces provide standardized sorting capabilities for repository queries
 */
export * from './sort.dto';

/**
 * Namespace for grouping related DTO interfaces by functionality
 * This helps organize imports and prevents naming collisions
 */
export namespace CommonDTOs {
  /**
   * Filter-related DTOs
   */
  export * from './filter.dto';
  
  /**
   * Pagination-related DTOs
   */
  export * from './pagination.dto';
  
  /**
   * Sort-related DTOs
   */
  export * from './sort.dto';
}