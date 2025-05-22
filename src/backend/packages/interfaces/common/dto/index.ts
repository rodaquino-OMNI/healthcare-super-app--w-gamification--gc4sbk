/**
 * @file Common DTO Interfaces Barrel Export
 * 
 * This file serves as the main entry point for all common DTO interfaces
 * used across the AUSTA SuperApp. It provides a centralized way to import
 * all DTO interfaces in a type-safe manner, ensuring consistent imports
 * across the application.
 *
 * @module @austa/interfaces/common/dto
 */

/**
 * Re-export all filter-related DTOs and types
 * These are used for standardized filtering in repository queries
 */
export * from './filter.dto';

/**
 * Re-export all pagination-related DTOs and types
 * These provide standardized pagination parameters for API endpoints
 */
export * from './pagination.dto';

/**
 * Re-export all sort-related DTOs and types
 * These provide standardized sorting capabilities across all services
 */
export * from './sort.dto';

/**
 * Namespace for organizing related DTOs by functional area
 * This helps prevent naming collisions and provides better organization
 */
export namespace CommonDto {
  /**
   * Filter-related types and interfaces
   */
  export * from './filter.dto';
  
  /**
   * Pagination-related types and interfaces
   */
  export * from './pagination.dto';
  
  /**
   * Sort-related types and interfaces
   */
  export * from './sort.dto';
}