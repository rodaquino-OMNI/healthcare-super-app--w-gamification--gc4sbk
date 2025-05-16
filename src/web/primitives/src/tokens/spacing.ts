/**
 * Spacing Tokens
 * 
 * Defines the canonical spacing scale for the AUSTA SuperApp design system.
 * This file provides a consistent set of spacing values used throughout
 * the application for margins, paddings, and layout spacing.
 * 
 * The spacing system follows an 8-point grid system with additional 
 * values for finer control.
 * 
 * @example Usage with styled-components
 * ```tsx
 * import { spacing } from '@design-system/primitives';
 * 
 * const Card = styled.div`
 *   padding: ${spacing.md};
 *   margin-bottom: ${spacing.lg};
 * `;
 * ```
 * 
 * @example Usage with React Native
 * ```tsx
 * import { spacingValues } from '@design-system/primitives';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: spacingValues.md,
 *     marginBottom: spacingValues.lg,
 *   }
 * });
 * ```
 * 
 * @example Usage with compound spacing helpers
 * ```tsx
 * import { inset, squish, stretch } from '@design-system/primitives';
 * 
 * const Card = styled.div`
 *   ${inset.md}; // applies equal padding on all sides
 *   ${squish.sm}; // applies horizontal padding > vertical padding
 * `;
 * ```
 */

/**
 * SpacingToken interface for type-safe spacing values
 * This interface is used by @austa/interfaces for theme typing
 */
export interface SpacingToken {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly '2xl': number;
  readonly '3xl': number;
  readonly '4xl': number;
}

/**
 * SpacingTokenWithUnits interface for type-safe spacing values with CSS units
 * This interface is used by @austa/interfaces for theme typing
 */
export interface SpacingTokenWithUnits {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly '2xl': string;
  readonly '3xl': string;
  readonly '4xl': string;
}

/**
 * SpacingTokenWithNegatives interface for type-safe spacing values with negative values
 * This interface is used by @austa/interfaces for theme typing
 */
export interface SpacingTokenWithNegatives extends SpacingToken {
  readonly '-xs': number;
  readonly '-sm': number;
  readonly '-md': number;
  readonly '-lg': number;
  readonly '-xl': number;
  readonly '-2xl': number;
  readonly '-3xl': number;
  readonly '-4xl': number;
}

/**
 * SpacingTokenWithNegativesAndUnits interface for type-safe spacing values with negative values and CSS units
 * This interface is used by @austa/interfaces for theme typing
 */
export interface SpacingTokenWithNegativesAndUnits extends SpacingTokenWithUnits {
  readonly '-xs': string;
  readonly '-sm': string;
  readonly '-md': string;
  readonly '-lg': string;
  readonly '-xl': string;
  readonly '-2xl': string;
  readonly '-3xl': string;
  readonly '-4xl': string;
}

/**
 * Raw numeric spacing values in pixels
 * Used for programmatic calculations and manipulations
 */
export const spacingValues: SpacingToken = {
  xs: 4,   // Extra small spacing
  sm: 8,   // Small spacing
  md: 16,  // Medium spacing
  lg: 24,  // Large spacing
  xl: 32,  // Extra large spacing
  '2xl': 48,  // 2x Extra large spacing
  '3xl': 64,  // 3x Extra large spacing
  '4xl': 96,  // 4x Extra large spacing
};

/**
 * Raw numeric spacing values with negative values in pixels
 * Used for programmatic calculations and margin adjustments
 */
export const spacingValuesWithNegatives: SpacingTokenWithNegatives = {
  ...spacingValues,
  '-xs': -4,   // Negative extra small spacing
  '-sm': -8,   // Negative small spacing
  '-md': -16,  // Negative medium spacing
  '-lg': -24,  // Negative large spacing
  '-xl': -32,  // Negative extra large spacing
  '-2xl': -48, // Negative 2x extra large spacing
  '-3xl': -64, // Negative 3x extra large spacing
  '-4xl': -96, // Negative 4x extra large spacing
};

/**
 * Spacing values with pixel units
 * For direct use in styled-components and CSS
 */
export const spacing: SpacingTokenWithUnits = {
  xs: '4px',    // Extra small spacing
  sm: '8px',    // Small spacing
  md: '16px',   // Medium spacing
  lg: '24px',   // Large spacing
  xl: '32px',   // Extra large spacing
  '2xl': '48px', // 2x Extra large spacing
  '3xl': '64px', // 3x Extra large spacing
  '4xl': '96px', // 4x Extra large spacing
};

/**
 * Spacing values with negative pixel units
 * For direct use in styled-components and CSS for negative margins
 */
export const spacingWithNegatives: SpacingTokenWithNegativesAndUnits = {
  ...spacing,
  '-xs': '-4px',    // Negative extra small spacing
  '-sm': '-8px',    // Negative small spacing
  '-md': '-16px',   // Negative medium spacing
  '-lg': '-24px',   // Negative large spacing
  '-xl': '-32px',   // Negative extra large spacing
  '-2xl': '-48px',  // Negative 2x extra large spacing
  '-3xl': '-64px',  // Negative 3x extra large spacing
  '-4xl': '-96px',  // Negative 4x extra large spacing
};

/**
 * Responsive spacing multipliers for different viewport sizes
 * Used to adjust spacing based on screen size
 */
export const spacingMultipliers = {
  xs: 0.75,  // Extra small screens (mobile)
  sm: 1,     // Small screens (mobile landscape)
  md: 1.25,  // Medium screens (tablet)
  lg: 1.5,   // Large screens (desktop)
  xl: 2,     // Extra large screens (large desktop)
};

/**
 * Helper function to calculate responsive spacing
 * @param baseSize - Base spacing value in pixels
 * @param multiplier - Responsive multiplier
 * @returns Calculated spacing value in pixels
 */
export const getResponsiveSpacing = (baseSize: number, multiplier: number): number => {
  return Math.round(baseSize * multiplier);
};

/**
 * Compound spacing helpers for common padding patterns
 * 
 * inset: Equal padding on all sides
 * squish: Horizontal padding > vertical padding
 * stretch: Vertical padding > horizontal padding
 */

/**
 * Inset spacing - equal padding on all sides
 * Useful for containers, cards, and buttons
 */
export const inset = {
  xs: `padding: ${spacing.xs};`,
  sm: `padding: ${spacing.sm};`,
  md: `padding: ${spacing.md};`,
  lg: `padding: ${spacing.lg};`,
  xl: `padding: ${spacing.xl};`,
  '2xl': `padding: ${spacing['2xl']};`,
  '3xl': `padding: ${spacing['3xl']};`,
  '4xl': `padding: ${spacing['4xl']};`,
};

/**
 * Squish spacing - horizontal padding > vertical padding
 * Useful for buttons, tabs, and chips
 */
export const squish = {
  xs: `padding: ${spacing.xs} ${spacing.sm};`,
  sm: `padding: ${spacing.sm} ${spacing.md};`,
  md: `padding: ${spacing.md} ${spacing.lg};`,
  lg: `padding: ${spacing.lg} ${spacing.xl};`,
  xl: `padding: ${spacing.xl} ${spacing['2xl']};`,
};

/**
 * Stretch spacing - vertical padding > horizontal padding
 * Useful for inputs, dropdowns, and menu items
 */
export const stretch = {
  xs: `padding: ${spacing.sm} ${spacing.xs};`,
  sm: `padding: ${spacing.md} ${spacing.sm};`,
  md: `padding: ${spacing.lg} ${spacing.md};`,
  lg: `padding: ${spacing.xl} ${spacing.lg};`,
  xl: `padding: ${spacing['2xl']} ${spacing.xl};`,
};