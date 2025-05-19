/**
 * Journey-specific color definitions for the AUSTA SuperApp.
 * 
 * This file centralizes all color constants used for journey-based theming
 * across both web and mobile platforms. It provides semantic color mappings
 * and theme variants (light/dark) for each journey.
 * 
 * The color system is organized into:
 * - Base colors: Core hex values for each journey
 * - Semantic mappings: Functional color assignments (primary, secondary, etc.)
 * - Theme variants: Light and dark mode color schemes
 */

/**
 * Base color hex values for each journey
 */
export const BASE_COLORS = {
  // Health Journey (Green palette)
  health: {
    green50: '#F0FFF4',   // Lightest green - backgrounds
    green100: '#DCFCE7',  // Very light green - hover states
    green200: '#BBF7D0',  // Light green - borders, dividers
    green300: '#86EFAC',  // Medium-light green - secondary elements
    green400: '#4ADE80',  // Medium green - active states
    green500: '#0ACF83',  // Primary green - main brand color
    green600: '#05A66A',  // Medium-dark green - secondary brand color
    green700: '#00875A',  // Dark green - accent color
    green800: '#005C3E',  // Very dark green - text on light backgrounds
    green900: '#004D34',  // Darkest green - text on light backgrounds
  },
  
  // Care Journey (Orange palette)
  care: {
    orange50: '#FFF8F0',  // Lightest orange - backgrounds
    orange100: '#FFEDD5',  // Very light orange - hover states
    orange200: '#FED7AA',  // Light orange - borders, dividers
    orange300: '#FDBA74',  // Medium-light orange - secondary elements
    orange400: '#FB923C',  // Medium orange - active states
    orange500: '#FF8C42',  // Primary orange - main brand color
    orange600: '#F17C3A',  // Medium-dark orange - secondary brand color
    orange700: '#E55A00',  // Dark orange - accent color
    orange800: '#C2410C',  // Very dark orange - text on light backgrounds
    orange900: '#9A3412',  // Darkest orange - text on light backgrounds
  },
  
  // Plan Journey (Blue palette)
  plan: {
    blue50: '#F0F8FF',    // Lightest blue - backgrounds
    blue100: '#E0F2FE',   // Very light blue - hover states
    blue200: '#BAE6FD',   // Light blue - borders, dividers
    blue300: '#7DD3FC',   // Medium-light blue - secondary elements
    blue400: '#38BDF8',   // Medium blue - active states
    blue500: '#3A86FF',   // Primary blue - main brand color
    blue600: '#2D6FD9',   // Medium-dark blue - secondary brand color
    blue700: '#0057E7',   // Dark blue - accent color
    blue800: '#1E40AF',   // Very dark blue - text on light backgrounds
    blue900: '#1E3A8A',   // Darkest blue - text on light backgrounds
  },
  
  // Neutral colors (shared across journeys)
  neutral: {
    white: '#FFFFFF',      // Pure white
    gray50: '#F9FAFB',     // Nearly white
    gray100: '#F5F5F5',    // Very light gray
    gray200: '#EEEEEE',    // Light gray
    gray300: '#E0E0E0',    // Light-medium gray
    gray400: '#BDBDBD',    // Medium gray
    gray500: '#9E9E9E',    // Medium gray
    gray600: '#757575',    // Medium-dark gray
    gray700: '#616161',    // Dark gray
    gray800: '#424242',    // Very dark gray
    gray900: '#212121',    // Nearly black
    black: '#000000',      // Pure black
  },
  
  // Semantic colors (shared across journeys)
  semantic: {
    success: '#00C853',    // Success states, confirmations
    warning: '#FFD600',    // Warning states, alerts
    error: '#FF3B30',      // Error states, destructive actions
    info: '#0066CC',       // Informational states
  }
};

/**
 * Journey IDs used for referencing journeys throughout the application
 */
export const JOURNEY_IDS = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan'
};

/**
 * Type definition for journey IDs
 */
export type JourneyId = typeof JOURNEY_IDS[keyof typeof JOURNEY_IDS];

/**
 * Type definition for theme modes
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Type definition for semantic color mapping
 */
export interface SemanticColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: string;
  divider: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Type definition for journey theme colors
 */
export interface JourneyThemeColors {
  light: SemanticColors;
  dark: SemanticColors;
}

/**
 * Type definition for all journey themes
 */
export interface JourneyThemes {
  [JOURNEY_IDS.HEALTH]: JourneyThemeColors;
  [JOURNEY_IDS.CARE]: JourneyThemeColors;
  [JOURNEY_IDS.PLAN]: JourneyThemeColors;
}

/**
 * Semantic color mappings for each journey and theme mode
 */
export const JOURNEY_THEMES: JourneyThemes = {
  // Health Journey Theme
  [JOURNEY_IDS.HEALTH]: {
    // Light theme for Health Journey
    light: {
      primary: BASE_COLORS.health.green500,
      secondary: BASE_COLORS.health.green600,
      accent: BASE_COLORS.health.green700,
      background: BASE_COLORS.health.green50,
      surface: BASE_COLORS.neutral.white,
      text: {
        primary: BASE_COLORS.neutral.gray900,
        secondary: BASE_COLORS.neutral.gray700,
        disabled: BASE_COLORS.neutral.gray400,
        inverse: BASE_COLORS.neutral.white,
      },
      border: BASE_COLORS.health.green200,
      divider: BASE_COLORS.neutral.gray200,
      success: BASE_COLORS.semantic.success,
      warning: BASE_COLORS.semantic.warning,
      error: BASE_COLORS.semantic.error,
      info: BASE_COLORS.semantic.info,
    },
    // Dark theme for Health Journey
    dark: {
      primary: BASE_COLORS.health.green500,
      secondary: BASE_COLORS.health.green400,
      accent: BASE_COLORS.health.green300,
      background: BASE_COLORS.neutral.gray900,
      surface: BASE_COLORS.neutral.gray800,
      text: {
        primary: BASE_COLORS.neutral.white,
        secondary: BASE_COLORS.neutral.gray300,
        disabled: BASE_COLORS.neutral.gray600,
        inverse: BASE_COLORS.neutral.gray900,
      },
      border: BASE_COLORS.health.green700,
      divider: BASE_COLORS.neutral.gray700,
      success: BASE_COLORS.semantic.success,
      warning: BASE_COLORS.semantic.warning,
      error: BASE_COLORS.semantic.error,
      info: BASE_COLORS.semantic.info,
    },
  },
  
  // Care Journey Theme
  [JOURNEY_IDS.CARE]: {
    // Light theme for Care Journey
    light: {
      primary: BASE_COLORS.care.orange500,
      secondary: BASE_COLORS.care.orange600,
      accent: BASE_COLORS.care.orange700,
      background: BASE_COLORS.care.orange50,
      surface: BASE_COLORS.neutral.white,
      text: {
        primary: BASE_COLORS.neutral.gray900,
        secondary: BASE_COLORS.neutral.gray700,
        disabled: BASE_COLORS.neutral.gray400,
        inverse: BASE_COLORS.neutral.white,
      },
      border: BASE_COLORS.care.orange200,
      divider: BASE_COLORS.neutral.gray200,
      success: BASE_COLORS.semantic.success,
      warning: BASE_COLORS.semantic.warning,
      error: BASE_COLORS.semantic.error,
      info: BASE_COLORS.semantic.info,
    },
    // Dark theme for Care Journey
    dark: {
      primary: BASE_COLORS.care.orange500,
      secondary: BASE_COLORS.care.orange400,
      accent: BASE_COLORS.care.orange300,
      background: BASE_COLORS.neutral.gray900,
      surface: BASE_COLORS.neutral.gray800,
      text: {
        primary: BASE_COLORS.neutral.white,
        secondary: BASE_COLORS.neutral.gray300,
        disabled: BASE_COLORS.neutral.gray600,
        inverse: BASE_COLORS.neutral.gray900,
      },
      border: BASE_COLORS.care.orange700,
      divider: BASE_COLORS.neutral.gray700,
      success: BASE_COLORS.semantic.success,
      warning: BASE_COLORS.semantic.warning,
      error: BASE_COLORS.semantic.error,
      info: BASE_COLORS.semantic.info,
    },
  },
  
  // Plan Journey Theme
  [JOURNEY_IDS.PLAN]: {
    // Light theme for Plan Journey
    light: {
      primary: BASE_COLORS.plan.blue500,
      secondary: BASE_COLORS.plan.blue600,
      accent: BASE_COLORS.plan.blue700,
      background: BASE_COLORS.plan.blue50,
      surface: BASE_COLORS.neutral.white,
      text: {
        primary: BASE_COLORS.neutral.gray900,
        secondary: BASE_COLORS.neutral.gray700,
        disabled: BASE_COLORS.neutral.gray400,
        inverse: BASE_COLORS.neutral.white,
      },
      border: BASE_COLORS.plan.blue200,
      divider: BASE_COLORS.neutral.gray200,
      success: BASE_COLORS.semantic.success,
      warning: BASE_COLORS.semantic.warning,
      error: BASE_COLORS.semantic.error,
      info: BASE_COLORS.semantic.info,
    },
    // Dark theme for Plan Journey
    dark: {
      primary: BASE_COLORS.plan.blue500,
      secondary: BASE_COLORS.plan.blue400,
      accent: BASE_COLORS.plan.blue300,
      background: BASE_COLORS.neutral.gray900,
      surface: BASE_COLORS.neutral.gray800,
      text: {
        primary: BASE_COLORS.neutral.white,
        secondary: BASE_COLORS.neutral.gray300,
        disabled: BASE_COLORS.neutral.gray600,
        inverse: BASE_COLORS.neutral.gray900,
      },
      border: BASE_COLORS.plan.blue700,
      divider: BASE_COLORS.neutral.gray700,
      success: BASE_COLORS.semantic.success,
      warning: BASE_COLORS.semantic.warning,
      error: BASE_COLORS.semantic.error,
      info: BASE_COLORS.semantic.info,
    },
  },
};

/**
 * Helper function to get journey colors based on journey ID and theme mode
 * @param journeyId - The ID of the journey
 * @param mode - The theme mode (light or dark)
 * @returns The semantic colors for the specified journey and theme mode
 */
export const getJourneyColors = (journeyId: JourneyId, mode: ThemeMode = 'light'): SemanticColors => {
  return JOURNEY_THEMES[journeyId][mode];
};

/**
 * Simple color mapping for backward compatibility with existing code
 * Maps to the primary colors of each journey in light mode
 */
export const JOURNEY_COLORS = {
  [JOURNEY_IDS.HEALTH]: BASE_COLORS.health.green500, // #0ACF83
  [JOURNEY_IDS.CARE]: BASE_COLORS.care.orange500,   // #FF8C42
  [JOURNEY_IDS.PLAN]: BASE_COLORS.plan.blue500,     // #3A86FF
};