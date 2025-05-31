/**
 * Animation design tokens for the AUSTA SuperApp
 * Provides consistent animation timing and easing functions across all platforms
 * Used in transitions, micro-interactions, and gamification elements
 * 
 * @version 2.0.0
 */

/**
 * Animation duration interface
 * Defines the standard animation durations used throughout the application
 */
export interface AnimationDuration {
  /** Quick micro-interactions and feedback animations (150ms) */
  fast: string;
  /** Standard transitions between states (300ms) */
  normal: string;
  /** Emphasis animations and celebrations (500ms) */
  slow: string;
}

/**
 * Animation easing interface
 * Defines the standard easing functions used throughout the application
 */
export interface AnimationEasing {
  /** Acceleration from zero velocity - cubic-bezier(0.4, 0, 1, 1) */
  easeIn: string;
  /** Deceleration to zero velocity - cubic-bezier(0, 0, 0.2, 1) */
  easeOut: string;
  /** Acceleration until halfway, then deceleration - cubic-bezier(0.4, 0, 0.2, 1) */
  easeInOut: string;
}

/**
 * Animation tokens interface
 * Defines the structure of animation tokens used throughout the application
 */
export interface AnimationTokens {
  /** Standard animation durations */
  duration: AnimationDuration;
  /** Standard animation easing functions */
  easing: AnimationEasing;
}

/**
 * Duration tokens for animations
 * - fast: Quick micro-interactions and feedback animations (150ms)
 * - normal: Standard transitions between states (300ms)
 * - slow: Emphasis animations and celebrations (500ms)
 */
const duration: AnimationDuration = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

/**
 * Easing function tokens for animations
 * - easeIn: Acceleration from zero velocity
 * - easeOut: Deceleration to zero velocity
 * - easeInOut: Acceleration until halfway, then deceleration
 */
const easing: AnimationEasing = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Animation tokens for consistent animation behavior throughout the application
 * Used in journey transitions, feedback animations, and gamification elements
 */
export const animation: AnimationTokens = {
  duration,
  easing,
};

/**
 * Helper functions for platform-specific animation implementations
 */

/**
 * Converts a CSS time string (e.g., '150ms' or '0.3s') to milliseconds
 * @param timeString - CSS time string
 * @returns Time in milliseconds
 * 
 * @example
 * // Returns 150
 * timeStringToMs('150ms');
 * 
 * @example
 * // Returns 300
 * timeStringToMs('0.3s');
 */
export function timeStringToMs(timeString: string): number {
  if (timeString.endsWith('ms')) {
    return parseInt(timeString, 10);
  }
  if (timeString.endsWith('s')) {
    return parseFloat(timeString) * 1000;
  }
  return parseInt(timeString, 10);
}

/**
 * Scales animation duration based on device performance capabilities
 * Can be used to adjust animation speed for lower-end devices
 * 
 * @param duration - Original duration in milliseconds
 * @param performanceScale - Scale factor based on device performance (0.5 to 1.5)
 * @returns Adjusted duration in milliseconds
 * 
 * @example
 * // For a low-performance device (scale: 0.8)
 * // Returns 240 (slower animation to prevent frame drops)
 * scaleDuration(300, 0.8);
 * 
 * @example
 * // For a high-performance device (scale: 1.2)
 * // Returns 360 (can handle more complex animations)
 * scaleDuration(300, 1.2);
 */
export function scaleDuration(duration: number, performanceScale: number = 1): number {
  // Ensure scale is within reasonable bounds
  const boundedScale = Math.max(0.5, Math.min(1.5, performanceScale));
  return Math.round(duration * boundedScale);
}

/**
 * React Native specific animation utilities
 */
export const reactNative = {
  /**
   * Gets animation duration in milliseconds for React Native
   * @param durationKey - Key of the duration to retrieve ('fast', 'normal', 'slow')
   * @param performanceScale - Optional scale factor for device performance
   * @returns Duration in milliseconds
   * 
   * @example
   * // Returns 300 (or scaled value based on device performance)
   * reactNative.getDuration('normal');
   */
  getDuration: (durationKey: keyof AnimationDuration, performanceScale?: number): number => {
    const durationMs = timeStringToMs(duration[durationKey]);
    return performanceScale !== undefined ? scaleDuration(durationMs, performanceScale) : durationMs;
  },

  /**
   * Gets animation configuration for React Native Animated API
   * @param durationKey - Key of the duration to use ('fast', 'normal', 'slow')
   * @param easingKey - Key of the easing to use ('easeIn', 'easeOut', 'easeInOut')
   * @param performanceScale - Optional scale factor for device performance
   * @returns Animation configuration object with duration and easing
   * 
   * @example
   * // Usage with React Native Animated API
   * Animated.timing(animatedValue, {
   *   toValue: 1,
   *   ...reactNative.getAnimationConfig('normal', 'easeOut'),
   *   useNativeDriver: true,
   * }).start();
   */
  getAnimationConfig: (durationKey: keyof AnimationDuration, easingKey: keyof AnimationEasing, performanceScale?: number) => {
    // This function returns a configuration object compatible with React Native's Animated API
    // The actual Easing functions would be imported from 'react-native'
    return {
      duration: reactNative.getDuration(durationKey, performanceScale),
      // Note: In actual implementation, you would use the React Native Easing functions
      // This is just a placeholder for the token structure
      easing: easing[easingKey],
    };
  },
};

/**
 * Web specific animation utilities
 */
export const web = {
  /**
   * Gets CSS transition string for web applications
   * @param properties - CSS properties to animate
   * @param durationKey - Key of the duration to use ('fast', 'normal', 'slow')
   * @param easingKey - Key of the easing to use ('easeIn', 'easeOut', 'easeInOut')
   * @returns CSS transition string
   * 
   * @example
   * // Returns 'transform 300ms cubic-bezier(0, 0, 0.2, 1), opacity 300ms cubic-bezier(0, 0, 0.2, 1)'
   * web.getTransition(['transform', 'opacity'], 'normal', 'easeOut');
   */
  getTransition: (properties: string[], durationKey: keyof AnimationDuration, easingKey: keyof AnimationEasing): string => {
    return properties
      .map(property => `${property} ${duration[durationKey]} ${easing[easingKey]}`)
      .join(', ');
  },

  /**
   * Gets CSS animation string for web applications
   * @param animationName - Name of the CSS keyframe animation
   * @param durationKey - Key of the duration to use ('fast', 'normal', 'slow')
   * @param easingKey - Key of the easing to use ('easeIn', 'easeOut', 'easeInOut')
   * @param iterations - Number of iterations (default: 1, 'infinite' for infinite loop)
   * @returns CSS animation string
   * 
   * @example
   * // Returns 'fadeIn 500ms cubic-bezier(0.4, 0, 0.2, 1) 1 forwards'
   * web.getAnimation('fadeIn', 'slow', 'easeInOut');
   */
  getAnimation: (
    animationName: string,
    durationKey: keyof AnimationDuration,
    easingKey: keyof AnimationEasing,
    iterations: number | 'infinite' = 1
  ): string => {
    return `${animationName} ${duration[durationKey]} ${easing[easingKey]} ${iterations} forwards`;
  },
};

export default animation;