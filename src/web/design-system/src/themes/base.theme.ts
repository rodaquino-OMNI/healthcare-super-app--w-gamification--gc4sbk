/**
 * Base Theme for the AUSTA SuperApp Design System
 * 
 * This file defines the foundational theme object that serves as the basis for all
 * journey-specific themes in the application. It imports design tokens from the
 * @design-system/primitives package and uses interfaces from @austa/interfaces/themes
 * to ensure type safety and consistency across the application.
 * 
 * @example
 * // Import the base theme
 * import { baseTheme } from '@austa/design-system/themes';
 * 
 * // Use with ThemeProvider
 * import { ThemeProvider } from 'styled-components';
 * 
 * function App() {
 *   return (
 *     <ThemeProvider theme={baseTheme}>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * 
 * @example
 * // Extend the base theme for journey-specific theming
 * import { baseTheme } from '@austa/design-system/themes';
 * import { HealthTheme } from '@austa/interfaces/themes';
 * 
 * export const healthTheme: HealthTheme = {
 *   ...baseTheme,
 *   // Override or extend with health journey specific values
 *   colors: {
 *     ...baseTheme.colors,
 *     primary: baseTheme.colors.journeys.health.primary,
 *   }
 * };
 */

import * as tokens from '@design-system/primitives/src/tokens';
import { Theme } from '@austa/interfaces/themes';

/**
 * Base theme for the design system
 * Contains all global styles and common values derived from design tokens
 * 
 * This theme serves as the foundation for all journey-specific themes and
 * provides consistent styling across the application. It consolidates all
 * design tokens into a default theme that can be extended or overridden
 * by journey-specific themes.
 */
export const baseTheme: Theme = {
  colors: {
    brand: {
      primary: tokens.colors.brand.primary,
      secondary: tokens.colors.brand.secondary,
      tertiary: tokens.colors.brand.tertiary,
    },
    journeys: {
      health: {
        primary: tokens.colors.journeys.health.primary,
        secondary: tokens.colors.journeys.health.secondary,
        accent: tokens.colors.journeys.health.accent,
        background: tokens.colors.journeys.health.background,
      },
      care: {
        primary: tokens.colors.journeys.care.primary,
        secondary: tokens.colors.journeys.care.secondary,
        accent: tokens.colors.journeys.care.accent,
        background: tokens.colors.journeys.care.background,
      },
      plan: {
        primary: tokens.colors.journeys.plan.primary,
        secondary: tokens.colors.journeys.plan.secondary,
        accent: tokens.colors.journeys.plan.accent,
        background: tokens.colors.journeys.plan.background,
      },
    },
    semantic: {
      success: tokens.colors.semantic.success,
      warning: tokens.colors.semantic.warning,
      error: tokens.colors.semantic.error,
      info: tokens.colors.semantic.info,
    },
    neutral: {
      white: tokens.colors.neutral.white,
      gray100: tokens.colors.neutral.gray100,
      gray200: tokens.colors.neutral.gray200,
      gray300: tokens.colors.neutral.gray300,
      gray400: tokens.colors.neutral.gray400,
      gray500: tokens.colors.neutral.gray500,
      gray600: tokens.colors.neutral.gray600,
      gray700: tokens.colors.neutral.gray700,
      gray800: tokens.colors.neutral.gray800,
      gray900: tokens.colors.neutral.gray900,
      black: tokens.colors.neutral.black,
    },
  },
  typography: {
    fontFamily: {
      base: tokens.typography.fontFamily.base,
      heading: tokens.typography.fontFamily.heading,
      mono: tokens.typography.fontFamily.mono,
    },
    fontWeight: {
      regular: tokens.typography.fontWeight.regular,
      medium: tokens.typography.fontWeight.medium,
      bold: tokens.typography.fontWeight.bold,
    },
    fontSize: {
      xs: tokens.typography.fontSize.xs,
      sm: tokens.typography.fontSize.sm,
      md: tokens.typography.fontSize.md,
      lg: tokens.typography.fontSize.lg,
      xl: tokens.typography.fontSize.xl,
      '2xl': tokens.typography.fontSize['2xl'],
      '3xl': tokens.typography.fontSize['3xl'],
      '4xl': tokens.typography.fontSize['4xl'],
    },
    lineHeight: {
      tight: tokens.typography.lineHeight.tight,
      base: tokens.typography.lineHeight.base,
      relaxed: tokens.typography.lineHeight.relaxed,
    },
  },
  spacing: {
    xs: tokens.spacing.xs,
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
    lg: tokens.spacing.lg,
    xl: tokens.spacing.xl,
    '2xl': tokens.spacing['2xl'],
    '3xl': tokens.spacing['3xl'],
    '4xl': tokens.spacing['4xl'],
  },
  borderRadius: {
    sm: tokens.borderRadius.sm,
    md: tokens.borderRadius.md,
    lg: tokens.borderRadius.lg,
    xl: tokens.borderRadius.xl,
    full: tokens.borderRadius.full,
  },
  shadows: {
    sm: tokens.shadows.sm,
    md: tokens.shadows.md,
    lg: tokens.shadows.lg,
    xl: tokens.shadows.xl,
  },
  animation: {
    duration: {
      fast: tokens.animation.duration.fast,
      normal: tokens.animation.duration.normal,
      slow: tokens.animation.duration.slow,
    },
    easing: {
      easeIn: tokens.animation.easing.easeIn,
      easeOut: tokens.animation.easing.easeOut,
      easeInOut: tokens.animation.easing.easeInOut,
    },
  },
};