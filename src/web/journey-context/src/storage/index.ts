/**
 * Journey Storage Module
 * 
 * This module provides a platform-agnostic storage solution for the journey context,
 * enabling consistent data persistence across both web and mobile applications.
 * 
 * It exports a factory function that creates the appropriate storage implementation
 * based on the runtime platform, along with interfaces and types for type-safe usage.
 */

// Export the factory function for creating platform-specific storage implementations
export { createJourneyStorage } from './factory';

// Export the core interface that defines the storage operations
export { IJourneyStorage, StorageOptions } from './interface';

// Export types for storage operations and data structures
export {
  StorageResult,
  StorageError,
  JourneyPreferences,
  AuthSession,
  UserSettings,
  StorageValue
} from './types';

// Export key utilities for generating standardized storage keys
export {
  STORAGE_KEYS,
  generateJourneyKey,
  generateNamespacedKey
} from './keys';