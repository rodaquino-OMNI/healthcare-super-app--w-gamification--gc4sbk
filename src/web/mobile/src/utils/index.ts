/**
 * Centralized utility exports for the AUSTA SuperApp mobile application.
 * 
 * This file aggregates and re-exports all utility functions from various utility modules
 * to provide a single import point for consumers, improving developer experience and
 * promoting clean code organization.
 * 
 * The utilities are organized by category:
 * - analytics: Tracking and monitoring functions for user behavior and app performance
 * - date: Date formatting and manipulation utilities
 * - format: Data formatting utilities for numbers, currency, text, etc.
 * - permissions: Mobile device permission handling
 * - validation: Form and data validation utilities
 * 
 * @module utils
 * @packageDocumentation
 */

// Export all analytics utilities for tracking user behavior and app performance
// Includes functions for event tracking, screen views, and performance monitoring
export * from './analytics';

// Export all date formatting utilities
// Provides functions for formatting dates in Brazilian Portuguese
export * from './date';

// Export all data formatting utilities
// Re-exports shared formatting functions for numbers, currency, etc.
export * from './format';

// Export all permission handling utilities
// Functions for checking and requesting Android permissions
export * from './permissions';

// Export all validation utilities
// Includes form validation, file validation, and data validation functions
export * from './validation';