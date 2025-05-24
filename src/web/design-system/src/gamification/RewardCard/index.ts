/**
 * @file RewardCard Barrel File
 * 
 * This barrel file exports the RewardCard component and its associated types from the design system,
 * providing a centralized entry point for importing the RewardCard component throughout the application.
 * It re-exports the component's props interface and also imports the standardized Reward interface
 * from the shared interfaces package.
 *
 * @example Import with default export
 * ```typescript
 * import RewardCard from '@austa/design-system/gamification/RewardCard';
 * ```
 *
 * @example Import with named exports
 * ```typescript
 * import { RewardCard, type RewardCardProps } from '@austa/design-system/gamification/RewardCard';
 * ```
 *
 * @example Import with type from interfaces package
 * ```typescript
 * import { RewardCard } from '@austa/design-system/gamification/RewardCard';
 * import { Reward } from '@austa/interfaces/gamification';
 * ```
 */

// Re-export the component and its props
export { RewardCard, type RewardCardProps } from './RewardCard';

// Re-export the Reward interface from the shared interfaces package
export type { Reward } from '@austa/interfaces/gamification';

// Default export for backward compatibility
export { default } from './RewardCard';