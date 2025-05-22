/**
 * Error handling utilities for event processing.
 * 
 * This module exports all error-related functionality for event processing,
 * including error classes, retry policies, DLQ utilities, and error handling functions.
 * 
 * @module errors
 */

// Export error classes
export * from './validation.error';
export * from './event-errors';

// Export retry and DLQ utilities
export * from './retry-policies';
export * from './dlq';

// Export error handling utilities
export * from './handling';