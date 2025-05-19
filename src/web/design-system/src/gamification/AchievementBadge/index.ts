/**
 * @file AchievementBadge component export file
 * @description Exports the AchievementBadge component and its TypeScript interfaces
 */

import { AchievementBadge } from './AchievementBadge';
import type { AchievementBadgeProps } from './AchievementBadge';

// Re-export the Achievement interface from the centralized interfaces package
// This helps consumers transition to the new interfaces package
export type { Achievement } from '@austa/interfaces/gamification/achievements';

// Re-export the component and its props for better IDE integration
export { AchievementBadge };
export type { AchievementBadgeProps };

// Default export for flexibility
export default AchievementBadge;