/**
 * @file Achievements Interfaces Barrel File
 * @description Exports all interfaces and enums from the achievements interfaces directory.
 * This file simplifies imports throughout the application by providing a single import point
 * for all achievement-related interfaces. It improves code organization, reduces import
 * statements, and ensures consistent usage of interfaces across the module.
 */

// Achievement Type Definitions
export { AchievementType } from './achievement-types.enum';
export { AchievementStatus } from './achievement-status.enum';

// Core Achievement Interfaces
export { IAchievement } from './i-achievement.interface';
export { IUserAchievement } from './i-user-achievement.interface';

// Service Interfaces
export { IAchievementService } from './i-achievement-service.interface';

// Event Interfaces
export {
  IAchievementEvent,
  IAchievementUnlockedEvent,
  IAchievementProgressEvent,
  IAchievementResetEvent
} from './i-achievement-event.interface';