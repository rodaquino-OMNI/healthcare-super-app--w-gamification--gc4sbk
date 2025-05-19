/**
 * @file User Interfaces Barrel Export
 * 
 * This file centralizes and exports all user-related interface definitions from the auth-service.
 * It provides a single import point for consumers to access user data structures,
 * improving code organization and reducing import complexity.
 * 
 * Part of the AUSTA SuperApp refactoring to address critical build failures and architectural issues
 * while preserving its journey-centered approach and gamification core.
 */

// Export the main user interface
export { IUser } from './user.interface';

// Export user profile related interfaces
export { UserProfile } from './user-profile.interface';

// Export user credentials related interfaces and utilities
export { 
  UserCredentials, 
  isUserCredentials, 
  toUserCredentials 
} from './user-credentials.interface';

// Export user settings related interfaces
export { UserSettings } from './user-settings.interface';