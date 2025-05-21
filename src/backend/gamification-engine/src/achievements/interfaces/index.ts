/**
 * @file Achievement Interfaces Barrel File
 * @description Exports all interfaces and enums related to achievements in the gamification system.
 * This file simplifies imports throughout the application by providing a single import point
 * for all achievement-related interfaces and types.
 * 
 * @module achievements/interfaces
 */

// Achievement Type Definitions
export * from './i-achievement.interface';
export * from './i-user-achievement.interface';

// Achievement Service Definitions
export * from './i-achievement-service.interface';

// Achievement Event Definitions
export * from './i-achievement-event.interface';

// Achievement Enums
export * from './achievement-types.enum';
export * from './achievement-status.enum';