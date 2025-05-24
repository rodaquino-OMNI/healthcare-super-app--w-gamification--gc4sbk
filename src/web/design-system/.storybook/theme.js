/**
 * Custom Storybook theme for AUSTA SuperApp design system
 * 
 * This file defines the visual appearance of the Storybook UI (not the components)
 * to ensure consistent branding and visual identity across all documentation.
 * 
 * The theme uses the same color tokens and typography as the AUSTA design system
 * to create a cohesive experience between the components and their documentation.
 */

import { create } from '@storybook/theming/create';

// Import our design tokens
// Note: We're not directly importing from the primitives package to avoid circular dependencies
// These values should be kept in sync with src/web/primitives/src/tokens/colors.ts
const colors = {
  brand: {
    primary: '#0066CC',    // Primary brand color
    secondary: '#00A3E0',  // Secondary brand color
    tertiary: '#6D2077',   // Tertiary brand color for accents
  },
  neutral: {
    white: '#FFFFFF',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
    black: '#000000',
  },
  journeys: {
    health: '#0ACF83',    // Health journey color (Green)
    care: '#FF8C42',      // Care journey color (Orange)
    plan: '#3A86FF',      // Plan journey color (Blue)
  },
  semantic: {
    success: '#00C853',  // Success color
    warning: '#FFD600',  // Warning color
    error: '#FF3B30',    // Error color
    info: '#0066CC',     // Info color (same as brand.primary)
  }
};

/**
 * Custom AUSTA Storybook theme
 * 
 * This theme customizes the Storybook UI to match AUSTA brand guidelines
 * and creates visual consistency with the design system components.
 */
export default create({
  // Base theme
  base: 'light',
  
  // Brand information
  brandTitle: 'AUSTA SuperApp Design System',
  brandUrl: '/',
  // Note: In a production environment, this would be replaced with an actual logo path
  // such as '/images/austa-logo.svg' or a direct import of an SVG file
  brandImage: 'https://place-hold.it/350x150?text=AUSTA%20SuperApp&fontsize=23',
  brandTarget: '_self',
  
  // UI colors
  colorPrimary: colors.brand.primary,
  colorSecondary: colors.brand.secondary,
  
  // UI Application colors
  appBg: colors.neutral.white,
  appContentBg: colors.neutral.white,
  appBorderColor: colors.neutral.gray300,
  appBorderRadius: 4,
  
  // Typography
  fontBase: '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontCode: 'monospace',
  
  // Text colors
  textColor: colors.neutral.gray900,
  textInverseColor: colors.neutral.white,
  textMutedColor: colors.neutral.gray600,
  
  // Toolbar colors
  barTextColor: colors.neutral.gray700,
  barSelectedColor: colors.brand.primary,
  barBg: colors.neutral.white,
  
  // Form colors
  inputBg: colors.neutral.white,
  inputBorder: colors.neutral.gray400,
  inputTextColor: colors.neutral.gray900,
  inputBorderRadius: 4,
  
  // Journey-specific accent colors for UI elements
  // These are used in custom addons and UI elements
  journeyColors: {
    health: colors.journeys.health,
    care: colors.journeys.care,
    plan: colors.journeys.plan,
  },
  
  // Button appearance
  buttonBg: colors.brand.primary,
  buttonBorder: colors.brand.primary,
  
  // Additional customizations for specific Storybook UI elements
  gridCellSize: 12,
});