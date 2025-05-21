/**
 * @file index.ts
 * @description Barrel file that exports all interface definitions from the treatments domain.
 * This file enables cleaner imports throughout the codebase by providing a single import point
 * for all treatment-related interfaces.
 */

// Export the core treatment plan interface
export * from './treatment-plan.interface';

// Export DTO interfaces for creating and updating treatment plans
export * from './treatment-plan-dto.interface';

// Export response interfaces and factory functions
export * from './treatment-plan-response.interface';