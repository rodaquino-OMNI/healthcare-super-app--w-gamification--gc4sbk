/**
 * Barrel file that exports all DTO classes from the templates/dto directory.
 * Creates a clean public API for the module and simplifies imports throughout the codebase.
 * Enables importing multiple DTOs with a single import statement, reducing import clutter
 * and promoting code organization in accordance with the standardized module resolution architecture.
 */

// Export all DTOs from the templates/dto directory
export * from './create-notification-template.dto';
export * from './update-notification-template.dto';
export * from './find-template.dto';
export * from './format-template.dto';
export * from './template-response.dto';