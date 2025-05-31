/**
 * Design Tokens for the AUSTA SuperApp Design System
 * 
 * This file serves as the single entry point for all design tokens used throughout the
 * AUSTA SuperApp, providing a consistent visual language across all user journeys.
 * 
 * The design token system supports:
 * - Journey-specific theming with unique color schemes for each journey:
 *   - My Health (Minha Saúde): Green palette
 *   - Care Now (Cuidar-me Agora): Orange palette
 *   - My Plan (Meu Plano & Benefícios): Blue palette
 * - Consistent spacing based on an 8-point grid system
 * - Typography system optimized for readability in both Portuguese and English
 * - Responsive breakpoints for all device sizes
 * - Elevation system through consistent shadows
 * - Animation tokens for consistent motion design
 * 
 * These tokens form the foundation of the design system and should be used
 * for all visual styling to maintain consistency across the application.
 * 
 * @packageDocumentation
 */

// Import all token categories
import { colors, ColorTokens } from './colors';
import { typography, fontSizeValues, TypographyTokens } from './typography';
import { spacing, spacingValues, SpacingTokens } from './spacing';
import { breakpoints, breakpointValues, mediaQueries, BreakpointTokens } from './breakpoints';
import { shadows, ShadowTokens } from './shadows';
import { animation, AnimationTokens } from './animation';

// Export individual token categories for granular imports
export { colors, ColorTokens };
export { typography, fontSizeValues, TypographyTokens };
export { spacing, spacingValues, SpacingTokens };
export { breakpoints, breakpointValues, mediaQueries, BreakpointTokens };
export { shadows, ShadowTokens };
export { animation, AnimationTokens };

/**
 * Interface defining the complete token structure for the design system.
 * This provides type safety when consuming tokens in components and themes.
 */
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  breakpoints: BreakpointTokens;
  mediaQueries: typeof mediaQueries;
  shadows: ShadowTokens;
  animation: AnimationTokens;
}

/**
 * Consolidated tokens object containing all design token categories.
 * This provides a convenient way to access all tokens through a single import.
 * 
 * @example Web usage with styled-components
 * ```tsx
 * import { tokens } from '@design-system/primitives';
 * 
 * const Component = styled.div`
 *   color: ${tokens.colors.journeys.health.primary};
 *   font-size: ${tokens.typography.fontSize.md};
 *   margin: ${tokens.spacing.md};
 * `;
 * ```
 * 
 * @example React Native usage
 * ```tsx
 * import { tokens } from '@design-system/primitives';
 * import { StyleSheet } from 'react-native';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: tokens.colors.journeys.care.background,
 *     padding: tokens.spacingValues.md,
 *   },
 *   text: {
 *     color: tokens.colors.journeys.care.text,
 *     fontSize: tokens.fontSizeValues.md,
 *   }
 * });
 * ```
 */
export const tokens: DesignTokens = {
  colors,
  typography,
  spacing,
  breakpoints,
  mediaQueries,
  shadows,
  animation,
};

/**
 * Journey-specific token groupings for easier theme creation.
 * These groupings combine all tokens relevant to a specific journey.
 */
export const journeyTokens = {
  health: {
    colors: colors.journeys.health,
    typography,
    spacing,
    breakpoints,
    mediaQueries,
    shadows,
    animation,
  },
  care: {
    colors: colors.journeys.care,
    typography,
    spacing,
    breakpoints,
    mediaQueries,
    shadows,
    animation,
  },
  plan: {
    colors: colors.journeys.plan,
    typography,
    spacing,
    breakpoints,
    mediaQueries,
    shadows,
    animation,
  },
};

/**
 * Platform-specific token subsets optimized for web applications.
 * Includes all tokens with web-specific optimizations.
 */
export const webTokens = {
  ...tokens,
  // Web-specific overrides or additions can be added here
};

/**
 * Platform-specific token subsets optimized for native mobile applications.
 * Includes all tokens with React Native-specific optimizations.
 */
export const nativeTokens = {
  ...tokens,
  // Convert spacing to numeric values for React Native
  spacing: spacingValues,
  // Provide numeric breakpoint values
  breakpoints: breakpointValues,
  // Remove web-specific mediaQueries
  mediaQueries: undefined,
};

/**
 * Default export for convenient importing.
 * 
 * @example
 * ```tsx
 * import tokens from '@design-system/primitives';
 * ```
 */
export default tokens;