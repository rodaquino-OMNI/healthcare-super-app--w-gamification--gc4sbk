/**
 * Barrel file for medication-related DTOs
 * 
 * This file exports all Data Transfer Objects (DTOs) related to medications,
 * providing a single import point for consumers. This approach simplifies imports
 * throughout the application and follows the module organization pattern used
 * across the AUSTA SuperApp codebase.
 * 
 * @module medications/dto
 */

export * from './create-medication.dto';
export * from './update-medication.dto';