import { create } from '@storybook/theming/create';

/**
 * AUSTA SuperApp Storybook Theme
 * 
 * This theme customizes the Storybook UI to match AUSTA's brand guidelines
 * and design system. It applies brand colors, typography, and branding elements
 * to create a cohesive documentation experience.
 */
export default create({
  // Base theme (light or dark)
  base: 'light',

  // Brand information
  brandTitle: 'AUSTA Design System',
  brandUrl: 'https://austa.health',
  brandImage: '/austa-logo.png', // Logo should be placed in the public folder
  brandTarget: '_self',

  // Typography
  fontBase: '"Open Sans", "Roboto", sans-serif',
  fontCode: '"Roboto Mono", monospace',

  // Colors
  // Primary brand color used for active elements, buttons, etc.
  colorPrimary: '#0066CC', // AUSTA brand primary blue
  // Secondary color for highlights and secondary actions
  colorSecondary: '#34C759', // Health journey green as accent

  // UI colors
  appBg: '#FFFFFF', // White background
  appContentBg: '#FAFAFA', // Slightly off-white for content areas
  appBorderColor: '#E6E6E6', // Light gray for borders
  appBorderRadius: 4, // Rounded corners for UI elements

  // Text colors
  textColor: '#333333', // Dark gray for primary text
  textInverseColor: '#FFFFFF', // White for text on dark backgrounds
  textMutedColor: '#666666', // Medium gray for secondary text

  // Toolbar colors
  barTextColor: '#666666', // Medium gray for toolbar text
  barSelectedColor: '#0066CC', // Primary blue for selected items
  barHoverColor: '#34C759', // Health green for hover states
  barBg: '#FFFFFF', // White background for toolbar

  // Form colors
  inputBg: '#FFFFFF', // White background for inputs
  inputBorder: '#CCCCCC', // Light gray for input borders
  inputTextColor: '#333333', // Dark gray for input text
  inputBorderRadius: 4, // Rounded corners for inputs

  // Journey-specific accent colors (used in custom components)
  journeyColors: {
    health: '#34C759', // Green for health journey
    care: '#FF8C42', // Orange for care journey
    plan: '#007AFF', // Blue for plan journey
  },

  // Button appearance
  buttonBg: '#0066CC',
  buttonTextColor: '#FFFFFF',

  // Addon panel appearance
  addonActionsTheme: {
    // Customize the Actions addon appearance
    BASE_FONT_FAMILY: '"Roboto Mono", monospace',
    BASE_BACKGROUND_COLOR: 'transparent',
  },
});