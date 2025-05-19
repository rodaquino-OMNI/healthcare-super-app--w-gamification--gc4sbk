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
import { colors } from './colors';
import { typography, fontSizeValues } from './typography';
import { spacing, spacingValues } from './spacing';
import { breakpoints, breakpointValues, mediaQueries } from './breakpoints';
import { shadows } from './shadows';
import { animation } from './animation';

// Import types from @austa/interfaces for proper typing
import type {
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  BreakpointTokens,
  ShadowTokens,
  AnimationTokens,
  DesignTokens
} from '@austa/interfaces/themes/tokens.types';

// Export individual token categories for granular imports
export { colors };
export { typography, fontSizeValues };
export { spacing, spacingValues };
export { breakpoints, breakpointValues, mediaQueries };
export { shadows };
export { animation };

/**
 * Journey-specific token groupings for easier theme creation.
 * These groupings combine tokens that are commonly used together in each journey.
 */
export const journeyTokens = {
  health: {
    colors: colors.journeys.health,
    typography: typography,
    spacing: spacing,
    shadows: shadows,
    animation: animation
  },
  care: {
    colors: colors.journeys.care,
    typography: typography,
    spacing: spacing,
    shadows: shadows,
    animation: animation
  },
  plan: {
    colors: colors.journeys.plan,
    typography: typography,
    spacing: spacing,
    shadows: shadows,
    animation: animation
  }
};

/**
 * Platform-specific token subsets for web optimization.
 * These tokens are specifically formatted for web usage with CSS-in-JS libraries.
 */
export const webTokens = {
  colors: colors,
  typography: typography,
  spacing: spacing,
  breakpoints: breakpoints,
  mediaQueries: mediaQueries,
  shadows: shadows,
  animation: animation
};

/**
 * Platform-specific token subsets for React Native optimization.
 * These tokens are specifically formatted for React Native StyleSheet usage.
 */
export const nativeTokens = {
  colors: colors,
  typography: {
    ...typography,
    // Remove web-specific properties for React Native
    fontFamily: {
      sans: 'System',
      serif: 'System',
      mono: 'System'
    }
  },
  spacing: spacingValues, // Use raw numeric values for React Native
  breakpoints: breakpointValues, // Use raw numeric values for React Native
  shadows: shadows,
  animation: animation
};

/**
 * Consolidated tokens object containing all design token categories.
 * This provides a convenient way to access all tokens through a single import.
 * 
 * @example Import and use in styled-components (Web)
 * ```tsx
 * import { tokens } from '@design-system/primitives/tokens';
 * 
 * const Component = styled.div`
 *   color: ${tokens.colors.journeys.health.primary};
 *   font-size: ${tokens.typography.fontSize.md};
 *   margin: ${tokens.spacing.md};
 * `;
 * ```
 * 
 * @example Import and use in React Native
 * ```tsx
 * import { nativeTokens } from '@design-system/primitives/tokens';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: nativeTokens.colors.journeys.health.primary,
 *     padding: nativeTokens.spacing.md,
 *   },
 *   text: {
 *     fontSize: nativeTokens.typography.fontSize.md,
 *     fontWeight: nativeTokens.typography.fontWeight.bold,
 *   }
 * });
 * ```
 * 
 * @example Import and use with journey-specific tokens
 * ```tsx
 * import { journeyTokens } from '@design-system/primitives/tokens';
 * 
 * // For Health journey components
 * const HealthComponent = styled.div`
 *   color: ${journeyTokens.health.colors.primary};
 *   background-color: ${journeyTokens.health.colors.background};
 * `;
 * 
 * // For Care journey components
 * const CareComponent = styled.div`
 *   color: ${journeyTokens.care.colors.primary};
 *   background-color: ${journeyTokens.care.colors.background};
 * `;
 * ```
 */
export const tokens: DesignTokens = {
  colors: colors as ColorTokens,
  typography: typography as TypographyTokens,
  spacing: spacing as SpacingTokens,
  breakpoints: breakpoints as BreakpointTokens,
  mediaQueries,
  shadows: shadows as ShadowTokens,
  animation: animation as AnimationTokens,
};

// Default export for convenient importing
export default tokens;