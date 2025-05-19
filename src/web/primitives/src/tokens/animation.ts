/**
 * Animation design tokens for the AUSTA SuperApp
 * Provides consistent animation timing and easing functions across the application
 * Used in transitions, micro-interactions, and gamification elements
 * 
 * @package @design-system/primitives
 * @version 2.0.0
 */

import { AnimationTokens } from '@austa/interfaces/themes';

/**
 * Duration tokens for animations (in milliseconds)
 * - fast: Quick micro-interactions and feedback animations (150ms)
 * - normal: Standard transitions between states (300ms)
 * - slow: Emphasis animations and celebrations (500ms)
 */
export const duration = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Easing function tokens for animations
 * - easeIn: Acceleration from zero velocity
 * - easeOut: Deceleration to zero velocity
 * - easeInOut: Acceleration until halfway, then deceleration
 */
export const easing = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Performance scaling factors for animations
 * Used to adjust animation durations based on device performance capabilities
 * - low: For low-performance devices (slower animations)
 * - medium: For medium-performance devices (standard animations)
 * - high: For high-performance devices (faster animations)
 */
export const performanceScaling = {
  low: 1.5,
  medium: 1.0,
  high: 0.8,
} as const;

/**
 * Animation tokens for consistent animation behavior throughout the application
 * Used in journey transitions, feedback animations, and gamification elements
 * 
 * @example Web usage
 * ```tsx
 * import { animation } from '@design-system/primitives/tokens/animation';
 * import styled from 'styled-components';
 * 
 * const FadeIn = styled.div`
 *   opacity: 0;
 *   transition: opacity ${animation.duration.normal}ms ${animation.easing.easeIn};
 *   &.visible {
 *     opacity: 1;
 *   }
 * `;
 * ```
 * 
 * @example React Native usage
 * ```tsx
 * import { animation } from '@design-system/primitives/tokens/animation';
 * import { Animated } from 'react-native';
 * 
 * const fadeAnim = useRef(new Animated.Value(0)).current;
 * 
 * const fadeIn = () => {
 *   Animated.timing(fadeAnim, {
 *     toValue: 1,
 *     duration: animation.duration.normal,
 *     easing: Animated.Easing.cubic, // Approximation of easeInOut
 *     useNativeDriver: true,
 *   }).start();
 * };
 * ```
 * 
 * @example With performance scaling
 * ```tsx
 * import { animation, getScaledDuration } from '@design-system/primitives/tokens/animation';
 * 
 * // For a device with medium performance
 * const scaledDuration = getScaledDuration(animation.duration.normal, 'medium');
 * // Result: 300ms (unchanged)
 * 
 * // For a device with low performance
 * const slowDeviceDuration = getScaledDuration(animation.duration.normal, 'low');
 * // Result: 450ms (scaled up by 1.5x)
 * ```
 */
export const animation: AnimationTokens = {
  duration,
  easing,
  performanceScaling,
};

/**
 * Helper function to scale animation durations based on device performance
 * 
 * @param baseDuration - The base animation duration in milliseconds
 * @param performanceLevel - The performance level of the device ('low', 'medium', 'high')
 * @returns The scaled animation duration in milliseconds
 */
export const getScaledDuration = (
  baseDuration: number,
  performanceLevel: keyof typeof performanceScaling = 'medium'
): number => {
  return Math.round(baseDuration * performanceScaling[performanceLevel]);
};

/**
 * Helper function to get animation duration in string format with 'ms' suffix
 * Useful for CSS-in-JS libraries like styled-components
 * 
 * @param duration - The animation duration in milliseconds
 * @returns The animation duration as a string with 'ms' suffix
 */
export const getDurationString = (duration: number): string => `${duration}ms`;

export default animation;