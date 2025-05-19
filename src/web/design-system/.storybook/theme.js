import { create } from '@storybook/theming/create';

// Import design tokens from primitives package
// These are the same tokens used in the actual components
import { colors, typography } from '@design-system/primitives';

/**
 * Custom AUSTA theme for Storybook UI
 * This theme applies to the Storybook manager UI (navigation, panels, etc.)
 * and not to the components themselves.
 */
export default create({
  // Base theme (light or dark)
  base: 'light',

  // Brand information
  brandTitle: 'AUSTA Design System',
  brandUrl: '/',
  brandImage: '/austa-logo.svg',
  brandTarget: '_self',

  // UI colors
  colorPrimary: colors.brand.primary,
  colorSecondary: colors.brand.secondary,

  // UI
  appBg: colors.neutral[100],
  appContentBg: colors.neutral.white,
  appBorderColor: colors.neutral[300],
  appBorderRadius: 4,

  // Typography
  fontBase: typography.fonts.base,
  fontCode: typography.fonts.mono,

  // Text colors
  textColor: colors.neutral[900],
  textInverseColor: colors.neutral.white,

  // Toolbar default and active colors
  barTextColor: colors.neutral[600],
  barSelectedColor: colors.brand.primary,
  barBg: colors.neutral.white,

  // Form colors
  inputBg: colors.neutral.white,
  inputBorder: colors.neutral[300],
  inputTextColor: colors.neutral[900],
  inputBorderRadius: 4,
});