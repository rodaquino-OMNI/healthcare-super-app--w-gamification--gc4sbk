/**
 * @file Export file for the AchievementBadge component
 * 
 * This file defines the public API for the AchievementBadge module,
 * exporting both the component and its TypeScript interface to ensure
 * proper type checking when imported by other modules in the application.
 */

// Import the component and its props interface
import { AchievementBadge } from './AchievementBadge';
import type { AchievementBadgeProps } from './AchievementBadge';

// Import the Achievement interface from the centralized interfaces package
import type { Achievement } from '@austa/interfaces/gamification';

// Re-export the component's props interface and related types for consumers
export type { AchievementBadgeProps, Achievement };

// Named export for the component
export { AchievementBadge };

// Default export for flexibility
export default AchievementBadge;