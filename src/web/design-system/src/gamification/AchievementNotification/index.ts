/**
 * @file Barrel file that exports the AchievementNotification component and its related types.
 * This file serves as the public API for the AchievementNotification feature in the design system.
 */

/**
 * The AchievementNotification component displays a modal notification when users unlock achievements.
 * It renders an AchievementBadge along with the achievement title and description, and provides
 * an OK button to dismiss the notification.
 * 
 * @example
 * ```tsx
 * import { AchievementNotification } from '@austa/design-system/gamification/AchievementNotification';
 * import { Achievement } from '@austa/interfaces/gamification';
 * 
 * const MyComponent = () => {
 *   const [showNotification, setShowNotification] = useState(false);
 *   const achievement = { ... } as Achievement;
 *   
 *   return showNotification ? (
 *     <AchievementNotification 
 *       achievement={achievement}
 *       onClose={() => setShowNotification(false)}
 *     />
 *   ) : null;
 * };
 * ```
 */
export { AchievementNotification } from './AchievementNotification';

/**
 * Props interface for the AchievementNotification component.
 * 
 * @property {Achievement} achievement - The achievement object to display in the notification.
 * @property {() => void} onClose - Callback function triggered when the user dismisses the notification.
 */
export type { AchievementNotificationProps } from './AchievementNotification';