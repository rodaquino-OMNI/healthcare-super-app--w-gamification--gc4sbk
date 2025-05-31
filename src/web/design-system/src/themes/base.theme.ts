/**
 * Base Theme for the AUSTA SuperApp Design System
 * 
 * This file defines the baseTheme object that serves as the foundation for all
 * journey-specific themes in the AUSTA SuperApp. It consolidates all design tokens
 * from @design-system/primitives into a default theme that provides consistent
 * styling across the application.
 * 
 * The baseTheme implements the Theme interface from @austa/interfaces/themes,
 * ensuring type safety and consistent theme structure throughout the application.
 * 
 * @example Usage with styled-components
 * ```tsx
 * import { baseTheme } from '@austa/design-system/themes';
 * import { ThemeProvider } from 'styled-components';
 * import { Button } from '@austa/design-system';
 * 
 * const App = () => (
 *   <ThemeProvider theme={baseTheme}>
 *     <Button variant="primary">Click Me</Button>
 *   </ThemeProvider>
 * );
 * ```
 * 
 * @example Usage with React Native
 * ```tsx
 * import { baseTheme } from '@austa/design-system/themes';
 * import { ThemeProvider } from '@austa/design-system/providers';
 * import { Button } from '@austa/design-system';
 * 
 * const App = () => (
 *   <ThemeProvider theme={baseTheme}>
 *     <Button variant="primary">Click Me</Button>
 *   </ThemeProvider>
 * );
 * ```
 * 
 * @example Extending the base theme for journey-specific themes
 * ```tsx
 * import { baseTheme } from '@austa/design-system/themes';
 * import { tokens } from '@design-system/primitives';
 * 
 * export const healthTheme = {
 *   ...baseTheme,
 *   journey: {
 *     key: 'health',
 *     palette: tokens.colors.journeys.health,
 *   },
 *   // Override specific theme properties for the health journey
 *   colors: {
 *     ...baseTheme.colors,
 *     brand: {
 *       ...baseTheme.colors.brand,
 *       primary: tokens.colors.journeys.health.primary,
 *     },
 *   },
 * };
 * ```
 */

import { tokens } from '@design-system/primitives/src/tokens';
import { Theme } from '@austa/interfaces/themes/theme.types';
import { ColorToken } from '@design-system/primitives/src/tokens/colors';

/**
 * Base theme for the design system
 * Contains all global styles and common values derived from design tokens
 */
export const baseTheme: Theme = {
  id: 'base',
  name: 'AUSTA Base Theme',
  
  colors: {
    brand: {
      primary: tokens.colors.brand.primary,
      primary_token: tokens.colors.brand.primary_token,
      secondary: tokens.colors.brand.secondary,
      secondary_token: tokens.colors.brand.secondary_token,
      tertiary: tokens.colors.brand.tertiary,
      tertiary_token: tokens.colors.brand.tertiary_token,
    },
    journeys: {
      health: tokens.colors.journeys.health,
      care: tokens.colors.journeys.care,
      plan: tokens.colors.journeys.plan,
    },
    semantic: tokens.colors.semantic,
    neutral: {
      white: tokens.colors.neutral.white,
      white_token: tokens.colors.neutral.white_token,
      gray100: tokens.colors.neutral.gray100,
      gray100_token: tokens.colors.neutral.gray100_token,
      gray200: tokens.colors.neutral.gray200,
      gray200_token: tokens.colors.neutral.gray200_token,
      gray300: tokens.colors.neutral.gray300,
      gray300_token: tokens.colors.neutral.gray300_token,
      gray400: tokens.colors.neutral.gray400,
      gray400_token: tokens.colors.neutral.gray400_token,
      gray500: tokens.colors.neutral.gray500,
      gray500_token: tokens.colors.neutral.gray500_token,
      gray600: tokens.colors.neutral.gray600,
      gray600_token: tokens.colors.neutral.gray600_token,
      gray700: tokens.colors.neutral.gray700,
      gray700_token: tokens.colors.neutral.gray700_token,
      gray800: tokens.colors.neutral.gray800,
      gray800_token: tokens.colors.neutral.gray800_token,
      gray900: tokens.colors.neutral.gray900,
      gray900_token: tokens.colors.neutral.gray900_token,
      black: tokens.colors.neutral.black,
      black_token: tokens.colors.neutral.black_token,
    },
    contextual: tokens.colors.contextual,
    accessibility: tokens.colors.accessibility,
  },
  
  typography: tokens.typography,
  
  spacing: {
    xs: tokens.spacing.xs,
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
    lg: tokens.spacing.lg,
    xl: tokens.spacing.xl,
    '2xl': tokens.spacing['2xl'],
    '3xl': tokens.spacing['3xl'],
    '4xl': tokens.spacing['4xl'],
    'neg-xs': tokens.spacing['neg-xs'],
    'neg-sm': tokens.spacing['neg-sm'],
    'neg-md': tokens.spacing['neg-md'],
    'neg-lg': tokens.spacing['neg-lg'],
    'neg-xl': tokens.spacing['neg-xl'],
    'neg-2xl': tokens.spacing['neg-2xl'],
    'neg-3xl': tokens.spacing['neg-3xl'],
    'neg-4xl': tokens.spacing['neg-4xl'],
    get: tokens.spacing.get,
  },
  
  borderRadius: {
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
    lg: tokens.spacing.lg,
    xl: tokens.spacing.xl,
    full: '9999px',
  },
  
  shadows: {
    sm: tokens.shadows.sm,
    md: tokens.shadows.md,
    lg: tokens.shadows.lg,
    xl: tokens.shadows.xl,
    none: 'none',
    platforms: tokens.shadows.platforms,
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
  
  breakpoints: {
    xs: tokens.breakpoints.xs,
    sm: tokens.breakpoints.sm,
    md: tokens.breakpoints.md,
    lg: tokens.breakpoints.lg,
    xl: tokens.breakpoints.xl,
    up: tokens.mediaQueries.up,
    down: tokens.mediaQueries.down,
    between: tokens.mediaQueries.between,
  },
  
  components: {
    Button: {
      borderRadius: tokens.spacing.sm,
      fontSize: tokens.typography.fontSize.md,
      padding: {
        sm: tokens.spacing.xs,
        md: tokens.spacing.sm,
        lg: tokens.spacing.md,
      },
      variants: {
        primary: {
          backgroundColor: tokens.colors.brand.primary,
          color: tokens.colors.neutral.white,
          hoverBackgroundColor: tokens.colors.brand.primary_token._dark,
          activeBackgroundColor: tokens.colors.brand.primary_token._light,
          disabledBackgroundColor: tokens.colors.brand.primary_token._30,
          disabledColor: tokens.colors.neutral.white,
        },
        secondary: {
          backgroundColor: tokens.colors.brand.secondary,
          color: tokens.colors.neutral.white,
          hoverBackgroundColor: tokens.colors.brand.secondary_token._dark,
          activeBackgroundColor: tokens.colors.brand.secondary_token._light,
          disabledBackgroundColor: tokens.colors.brand.secondary_token._30,
          disabledColor: tokens.colors.neutral.white,
        },
        outline: {
          backgroundColor: 'transparent',
          color: tokens.colors.brand.primary,
          borderColor: tokens.colors.brand.primary,
          hoverBackgroundColor: tokens.colors.brand.primary_token._10,
          hoverBorderColor: tokens.colors.brand.primary_token._dark,
          activeBackgroundColor: tokens.colors.brand.primary_token._20,
          activeBorderColor: tokens.colors.brand.primary,
          disabledBackgroundColor: 'transparent',
          disabledBorderColor: tokens.colors.neutral.gray300,
          disabledColor: tokens.colors.neutral.gray400,
        },
        text: {
          backgroundColor: 'transparent',
          color: tokens.colors.brand.primary,
          hoverBackgroundColor: tokens.colors.brand.primary_token._10,
          activeBackgroundColor: tokens.colors.brand.primary_token._20,
          disabledBackgroundColor: 'transparent',
          disabledColor: tokens.colors.neutral.gray400,
        },
      },
    },
    Card: {
      backgroundColor: tokens.colors.neutral.white,
      borderRadius: tokens.spacing.md,
      boxShadow: tokens.shadows.sm,
      padding: tokens.spacing.md,
      header: {
        backgroundColor: 'transparent',
        padding: tokens.spacing.md,
      },
      body: {
        padding: tokens.spacing.md,
      },
      footer: {
        backgroundColor: 'transparent',
        padding: tokens.spacing.md,
      },
    },
    Input: {
      backgroundColor: tokens.colors.neutral.white,
      borderColor: tokens.colors.neutral.gray300,
      borderRadius: tokens.spacing.sm,
      color: tokens.colors.neutral.gray900,
      fontSize: tokens.typography.fontSize.md,
      padding: tokens.spacing.sm,
      placeholderColor: tokens.colors.neutral.gray500,
      focusBorderColor: tokens.colors.brand.primary,
      errorBorderColor: tokens.colors.semantic.error,
      errorColor: tokens.colors.semantic.error,
      disabledBackgroundColor: tokens.colors.neutral.gray100,
      disabledBorderColor: tokens.colors.neutral.gray200,
      disabledColor: tokens.colors.neutral.gray500,
    },
    ProgressBar: {
      backgroundColor: tokens.colors.neutral.gray200,
      borderRadius: tokens.spacing.xs,
      height: '8px',
      filledColor: tokens.colors.brand.primary,
    },
    ProgressCircle: {
      backgroundColor: tokens.colors.neutral.gray200,
      filledColor: tokens.colors.brand.primary,
      size: {
        sm: '24px',
        md: '48px',
        lg: '64px',
      },
      strokeWidth: {
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
    },
  },
};

/**
 * Export the baseTheme as the default export for convenient importing
 * 
 * @example
 * ```tsx
 * import baseTheme from '@austa/design-system/themes/base.theme';
 * ```
 */
export default baseTheme;