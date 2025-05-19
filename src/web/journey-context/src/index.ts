/**
 * AUSTA Journey Context
 * 
 * This package provides context providers and hooks for managing journey state
 * across the AUSTA SuperApp. It abstracts platform-specific implementations
 * to provide a consistent API for both web and mobile applications.
 */

// Initialize auth adapter
import './adapters';

// Export hooks
export { default as useAuth } from './hooks/useAuth';
export { default as useStorage } from './hooks/useStorage';

// Export types
export * from './types';