/**
 * Storage Module Entry Point
 * 
 * This file serves as the main entry point for the storage module, exporting the
 * createJourneyStorage factory function, the IJourneyStorage interface, and related types.
 * It provides a clean, unified public API that hides implementation details of
 * platform-specific storage mechanisms.
 * 
 * The storage module enables persistent storage of journey-related data across both
 * web and mobile platforms through a consistent interface, abstracting away the
 * differences between localStorage (web) and AsyncStorage (mobile).
 */

// Export the main storage interface
import { IJourneyStorage, StorageOptions } from './interface';

// Export the factory function that creates the appropriate storage implementation
import { createJourneyStorage } from './factory';

// Export storage-related types
import {
  StorageItem,
  StorageResult,
  StorageError,
  JourneyPreferences,
  AuthSession,
  UserSettings
} from './types';

// Export storage key constants and utilities
import {
  STORAGE_KEYS,
  createStorageKey,
  createJourneyStorageKey
} from './keys';

// Re-export everything for public consumption
export {
  // Main interface and factory
  IJourneyStorage,
  StorageOptions,
  createJourneyStorage,
  
  // Types
  StorageItem,
  StorageResult,
  StorageError,
  JourneyPreferences,
  AuthSession,
  UserSettings,
  
  // Keys and utilities
  STORAGE_KEYS,
  createStorageKey,
  createJourneyStorageKey
};