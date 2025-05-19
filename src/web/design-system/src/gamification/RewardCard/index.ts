/**
 * @file RewardCard barrel file
 * @description Exports the RewardCard component and related types from the design system.
 * This file provides a centralized entry point for importing the RewardCard component
 * and its associated types throughout the application, ensuring consistent usage patterns
 * and proper type checking.
 *
 * @example
 * // Import the component and types
 * import { RewardCard, RewardCardProps, Reward } from '@austa/design-system/gamification/RewardCard';
 * 
 * // Or import the default export
 * import RewardCard from '@austa/design-system/gamification/RewardCard';
 */

// Re-export the component and its props from the implementation file
export { RewardCard, type RewardCardProps } from './RewardCard';

// Re-export the Reward interface from the interfaces package for consumers
export { Reward, RewardCategory, RewardStatus } from '@austa/interfaces/gamification/rewards';

// Export the default for backward compatibility
export { default } from './RewardCard';