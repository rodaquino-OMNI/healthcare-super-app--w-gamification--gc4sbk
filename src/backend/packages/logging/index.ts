/**
 * @austa/logging
 * 
 * Centralized logging package for the AUSTA SuperApp backend services.
 * Provides structured, context-enriched logging with support for multiple
 * formatters and transports, including AWS CloudWatch integration.
 * 
 * This package enables consistent logging patterns across all microservices
 * with journey-specific context, user information, and distributed tracing
 * correlation.
 */

// Core components
export * from './src/logger.module';
export * from './src/logger.service';

// Interfaces
export * from './src/interfaces';

// Context utilities
export * from './src/context';

// Formatters
export * from './src/formatters';

// Transports
export * from './src/transports';

// Utility functions
export * from './src/utils';