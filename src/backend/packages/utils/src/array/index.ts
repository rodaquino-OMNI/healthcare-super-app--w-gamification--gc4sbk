/**
 * Main entry point that exports all array utility functions for consistent, centralized access.
 * This file provides a clean public API for all array manipulation utilities,
 * enabling standardized import patterns across all journey services.
 */

// Export all array utility functions
export * from './chunk.util';
export * from './filter.util';
export * from './group.util';
export * from './transform.util';

// Export types for better developer experience
export type { PropertyMatcher, FilterProperties } from './filter.util';