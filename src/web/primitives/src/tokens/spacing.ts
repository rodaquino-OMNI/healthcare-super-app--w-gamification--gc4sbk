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
 * @example
 * // Import in styled-components
 * import { spacing, spacingValues } from '@design-system/primitives';
 * 
 * const Container = styled.div`
 *   margin: ${spacing.md};
 *   padding: ${spacing.sm} ${spacing.lg};
 * `;
 * 
 * @example
 * // Import in React Native
 * import { spacingValues } from '@design-system/primitives';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     margin: spacingValues.md,
 *     padding: spacingValues.sm,
 *   }
 * });
 */

/**
 * SpacingToken interface for type-safe spacing values
 * This interface is compatible with @austa/interfaces theme types
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
 * SpacingTokenString interface for CSS string values
 * This interface is compatible with @austa/interfaces theme types
 */
export interface SpacingTokenString {
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
 * NegativeSpacingToken interface for negative margin values
 * This interface is compatible with @austa/interfaces theme types
 */
export interface NegativeSpacingToken {
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
 * NegativeSpacingTokenString interface for negative CSS string values
 * This interface is compatible with @austa/interfaces theme types
 */
export interface NegativeSpacingTokenString {
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
 * CompoundSpacingToken interface for inset, squish, and stretch patterns
 * This interface is compatible with @austa/interfaces theme types
 */
export interface CompoundSpacingToken {
  readonly inset: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
  };
  readonly squish: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
  };
  readonly stretch: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
  };
}

/**
 * ResponsiveSpacingMultiplier interface for responsive spacing adjustments
 * This interface is compatible with @austa/interfaces theme types
 */
export interface ResponsiveSpacingMultiplier {
  readonly xs: number; // Extra small screens (mobile)
  readonly sm: number; // Small screens (large mobile)
  readonly md: number; // Medium screens (tablet)
  readonly lg: number; // Large screens (desktop)
  readonly xl: number; // Extra large screens (large desktop)
}

/**
 * Raw numeric spacing values in pixels
 * Used for programmatic calculations and manipulations
 * 
 * @type {SpacingToken}
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
 * Spacing values with pixel units
 * For direct use in styled-components and CSS
 * 
 * @type {SpacingTokenString}
 */
export const spacing: SpacingTokenString = {
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
 * Negative spacing values in pixels
 * Used for negative margins and position adjustments
 * 
 * @type {NegativeSpacingToken}
 */
export const negativeSpacingValues: NegativeSpacingToken = {
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
 * Negative spacing values with pixel units
 * For direct use in styled-components and CSS
 * 
 * @type {NegativeSpacingTokenString}
 */
export const negativeSpacing: NegativeSpacingTokenString = {
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
 * Responsive spacing multipliers
 * Used to adjust spacing based on viewport size
 * 
 * @type {ResponsiveSpacingMultiplier}
 */
export const responsiveSpacingMultiplier: ResponsiveSpacingMultiplier = {
  xs: 0.75, // Reduce spacing on extra small screens
  sm: 0.875, // Slightly reduce spacing on small screens
  md: 1,    // Base spacing for medium screens
  lg: 1.125, // Slightly increase spacing on large screens
  xl: 1.25, // Increase spacing on extra large screens
};

/**
 * Compound spacing patterns
 * Provides predefined spacing combinations for common layout patterns
 * 
 * - inset: Equal spacing on all sides (padding)
 * - squish: More horizontal than vertical spacing (buttons, chips)
 * - stretch: More vertical than horizontal spacing (stacked elements)
 * 
 * @type {CompoundSpacingToken}
 */
export const compoundSpacing: CompoundSpacingToken = {
  // Equal spacing on all sides
  inset: {
    xs: `${spacing.xs}`,
    sm: `${spacing.sm}`,
    md: `${spacing.md}`,
    lg: `${spacing.lg}`,
    xl: `${spacing.xl}`,
  },
  // More horizontal spacing than vertical (for buttons, chips, etc.)
  squish: {
    xs: `${spacing.xs} ${spacing.sm}`,
    sm: `${spacing.sm} ${spacing.md}`,
    md: `${spacing.md} ${spacing.lg}`,
    lg: `${spacing.lg} ${spacing.xl}`,
    xl: `${spacing.xl} ${spacing['2xl']}`,
  },
  // More vertical spacing than horizontal (for stacked elements)
  stretch: {
    xs: `${spacing.sm} ${spacing.xs}`,
    sm: `${spacing.md} ${spacing.sm}`,
    md: `${spacing.lg} ${spacing.md}`,
    lg: `${spacing.xl} ${spacing.lg}`,
    xl: `${spacing['2xl']} ${spacing.xl}`,
  },
};

/**
 * Helper function to apply responsive spacing
 * Adjusts spacing values based on the current viewport size
 * 
 * @param {keyof SpacingToken} size - The base spacing size
 * @param {keyof ResponsiveSpacingMultiplier} viewport - The viewport size
 * @returns {number} - The adjusted spacing value
 * 
 * @example
 * // In a responsive component
 * import { getResponsiveSpacing, spacingValues } from '@design-system/primitives';
 * 
 * const responsiveMargin = getResponsiveSpacing('md', 'sm');
 * // Returns 14 (16 * 0.875) for small viewport
 */
export const getResponsiveSpacing = (
  size: keyof SpacingToken,
  viewport: keyof ResponsiveSpacingMultiplier
): number => {
  return Math.round(spacingValues[size] * responsiveSpacingMultiplier[viewport]);
};

/**
 * Helper function to get spacing value as a number
 * Useful for calculations and manipulations
 * 
 * @param {keyof SpacingToken} size - The spacing size
 * @returns {number} - The spacing value in pixels
 * 
 * @example
 * // For calculations
 * import { getSpacing } from '@design-system/primitives';
 * 
 * const doubleSpacing = getSpacing('md') * 2; // 32
 */
export const getSpacing = (size: keyof SpacingToken): number => {
  return spacingValues[size];
};

/**
 * Helper function to get spacing value as a string with px units
 * Useful for styled-components and CSS
 * 
 * @param {keyof SpacingToken} size - The spacing size
 * @returns {string} - The spacing value with px units
 * 
 * @example
 * // In styled-components
 * import { getSpacingString } from '@design-system/primitives';
 * 
 * const Container = styled.div`
 *   margin: ${getSpacingString('md')};
 * `;
 */
export const getSpacingString = (size: keyof SpacingToken): string => {
  return spacing[size];
};