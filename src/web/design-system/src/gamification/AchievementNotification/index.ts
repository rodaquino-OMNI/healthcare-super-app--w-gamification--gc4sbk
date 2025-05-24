/**
 * @file Barrel file that exports the AchievementNotification component and its related types.
 * This file serves as the public API for the AchievementNotification feature, allowing
 * consumers to import the component and its types from a single, consistent path.
 */

import { AchievementNotification } from './AchievementNotification';
import type { AchievementNotificationProps } from './AchievementNotification';

/**
 * A notification component that displays when a user unlocks an achievement.
 * Renders an achievement badge, title, description, and a dismiss button.
 * 
 * @example
 * ```tsx
 * import { AchievementNotification } from '@austa/design-system';
 * import { Achievement } from '@austa/interfaces/gamification';
 * 
 * const achievement: Achievement = {
 *   // achievement properties
 * };
 * 
 * <AchievementNotification 
 *   achievement={achievement}
 *   onClose={() => console.log('Notification closed')}
 * />
 * ```
 */
export { AchievementNotification };

/**
 * Props for the AchievementNotification component.
 * 
 * @property achievement - The achievement object containing details to display
 * @property onClose - Callback function triggered when the notification is dismissed
 */
export type { AchievementNotificationProps };