/**
 * @file colors.ts
 * @description Defines journey-specific color schemes and theming values for consistent UI rendering
 * across the AUSTA SuperApp. Contains color hex codes, semantic color mappings, and theme
 * configurations for each journey (Health, Care, Plan).
 */

import { JourneyId, JOURNEY_IDS, JourneyTheme } from '../types';

/**
 * Base color constants
 * Raw hex values for all colors used in the application
 */
export const BASE_COLORS = {
  // Brand colors
  brandPrimary: '#3772FF',
  brandSecondary: '#5096FF',
  brandTertiary: '#A9C4FF',
  
  // Journey-specific colors
  healthPrimary: '#00B383',
  healthSecondary: '#4DDBBA',
  healthTertiary: '#B3F0E0',
  
  carePrimary: '#FF8C42',
  careSecondary: '#FFAD75',
  careTertiary: '#FFD1AD',
  
  planPrimary: '#3772FF',
  planSecondary: '#5096FF',
  planTertiary: '#A9C4FF',
  
  // Semantic colors
  success: '#00B383',
  warning: '#FFB054',
  error: '#FF5454',
  info: '#5096FF',
  
  // Neutral colors
  white: '#FFFFFF',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  black: '#000000',
};

/**
 * Extended theme interface with additional properties for the design system
 */
export interface ThemeColors extends JourneyTheme {
  tertiary: string;
  surface: string;
  textSecondary: string;
  border: string;
  divider: string;
  disabled: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Light theme color definitions
 */
export const LIGHT_THEME_COLORS: Record<JourneyId, ThemeColors> = {
  [JOURNEY_IDS.HEALTH]: {
    primary: BASE_COLORS.healthPrimary,
    secondary: BASE_COLORS.healthSecondary,
    tertiary: BASE_COLORS.healthTertiary,
    accent: BASE_COLORS.healthSecondary,
    background: BASE_COLORS.white,
    surface: BASE_COLORS.gray100,
    text: BASE_COLORS.gray900,
    textSecondary: BASE_COLORS.gray700,
    border: BASE_COLORS.gray300,
    divider: BASE_COLORS.gray200,
    disabled: BASE_COLORS.gray400,
    success: BASE_COLORS.success,
    warning: BASE_COLORS.warning,
    error: BASE_COLORS.error,
    info: BASE_COLORS.info,
  },
  [JOURNEY_IDS.CARE]: {
    primary: BASE_COLORS.carePrimary,
    secondary: BASE_COLORS.careSecondary,
    tertiary: BASE_COLORS.careTertiary,
    accent: BASE_COLORS.careSecondary,
    background: BASE_COLORS.white,
    surface: BASE_COLORS.gray100,
    text: BASE_COLORS.gray900,
    textSecondary: BASE_COLORS.gray700,
    border: BASE_COLORS.gray300,
    divider: BASE_COLORS.gray200,
    disabled: BASE_COLORS.gray400,
    success: BASE_COLORS.success,
    warning: BASE_COLORS.warning,
    error: BASE_COLORS.error,
    info: BASE_COLORS.info,
  },
  [JOURNEY_IDS.PLAN]: {
    primary: BASE_COLORS.planPrimary,
    secondary: BASE_COLORS.planSecondary,
    tertiary: BASE_COLORS.planTertiary,
    accent: BASE_COLORS.planSecondary,
    background: BASE_COLORS.white,
    surface: BASE_COLORS.gray100,
    text: BASE_COLORS.gray900,
    textSecondary: BASE_COLORS.gray700,
    border: BASE_COLORS.gray300,
    divider: BASE_COLORS.gray200,
    disabled: BASE_COLORS.gray400,
    success: BASE_COLORS.success,
    warning: BASE_COLORS.warning,
    error: BASE_COLORS.error,
    info: BASE_COLORS.info,
  },
};

/**
 * Dark theme color definitions
 */
export const DARK_THEME_COLORS: Record<JourneyId, ThemeColors> = {
  [JOURNEY_IDS.HEALTH]: {
    primary: BASE_COLORS.healthPrimary,
    secondary: BASE_COLORS.healthSecondary,
    tertiary: BASE_COLORS.healthTertiary,
    accent: BASE_COLORS.healthSecondary,
    background: BASE_COLORS.gray900,
    surface: BASE_COLORS.gray800,
    text: BASE_COLORS.gray100,
    textSecondary: BASE_COLORS.gray400,
    border: BASE_COLORS.gray700,
    divider: BASE_COLORS.gray800,
    disabled: BASE_COLORS.gray600,
    success: BASE_COLORS.success,
    warning: BASE_COLORS.warning,
    error: BASE_COLORS.error,
    info: BASE_COLORS.info,
  },
  [JOURNEY_IDS.CARE]: {
    primary: BASE_COLORS.carePrimary,
    secondary: BASE_COLORS.careSecondary,
    tertiary: BASE_COLORS.careTertiary,
    accent: BASE_COLORS.careSecondary,
    background: BASE_COLORS.gray900,
    surface: BASE_COLORS.gray800,
    text: BASE_COLORS.gray100,
    textSecondary: BASE_COLORS.gray400,
    border: BASE_COLORS.gray700,
    divider: BASE_COLORS.gray800,
    disabled: BASE_COLORS.gray600,
    success: BASE_COLORS.success,
    warning: BASE_COLORS.warning,
    error: BASE_COLORS.error,
    info: BASE_COLORS.info,
  },
  [JOURNEY_IDS.PLAN]: {
    primary: BASE_COLORS.planPrimary,
    secondary: BASE_COLORS.planSecondary,
    tertiary: BASE_COLORS.planTertiary,
    accent: BASE_COLORS.planSecondary,
    background: BASE_COLORS.gray900,
    surface: BASE_COLORS.gray800,
    text: BASE_COLORS.gray100,
    textSecondary: BASE_COLORS.gray400,
    border: BASE_COLORS.gray700,
    divider: BASE_COLORS.gray800,
    disabled: BASE_COLORS.gray600,
    success: BASE_COLORS.success,
    warning: BASE_COLORS.warning,
    error: BASE_COLORS.error,
    info: BASE_COLORS.info,
  },
};

/**
 * Opacity values for consistent transparency across the application
 */
export const OPACITY = {
  disabled: 0.5,
  hover: 0.8,
  active: 0.6,
  overlay: 0.5,
  subtle: 0.1,
  medium: 0.3,
  high: 0.7,
};

/**
 * Helper function to get theme colors based on journey ID and theme mode
 * @param journeyId - The ID of the current journey
 * @param isDarkMode - Whether dark mode is enabled
 * @returns Theme colors for the specified journey and theme mode
 */
export const getJourneyColors = (
  journeyId: JourneyId,
  isDarkMode = false
): ThemeColors => {
  const themeColors = isDarkMode ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
  return themeColors[journeyId];
};

/**
 * Helper function to get a color with opacity
 * @param color - The base color (hex)
 * @param opacity - The opacity value (0-1)
 * @returns The color with opacity applied
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Semantic color mapping for consistent usage across the application
 */
export const SEMANTIC_COLORS = {
  success: BASE_COLORS.success,
  warning: BASE_COLORS.warning,
  error: BASE_COLORS.error,
  info: BASE_COLORS.info,
};

/**
 * Brand colors for non-journey-specific UI elements
 */
export const BRAND_COLORS = {
  primary: BASE_COLORS.brandPrimary,
  secondary: BASE_COLORS.brandSecondary,
  tertiary: BASE_COLORS.brandTertiary,
};

/**
 * Journey-specific primary colors for quick access
 */
export const JOURNEY_PRIMARY_COLORS: Record<JourneyId, string> = {
  [JOURNEY_IDS.HEALTH]: BASE_COLORS.healthPrimary,
  [JOURNEY_IDS.CARE]: BASE_COLORS.carePrimary,
  [JOURNEY_IDS.PLAN]: BASE_COLORS.planPrimary,
};

/**
 * Journey-specific secondary colors for quick access
 */
export const JOURNEY_SECONDARY_COLORS: Record<JourneyId, string> = {
  [JOURNEY_IDS.HEALTH]: BASE_COLORS.healthSecondary,
  [JOURNEY_IDS.CARE]: BASE_COLORS.careSecondary,
  [JOURNEY_IDS.PLAN]: BASE_COLORS.planSecondary,
};

/**
 * Journey-specific tertiary colors for quick access
 */
export const JOURNEY_TERTIARY_COLORS: Record<JourneyId, string> = {
  [JOURNEY_IDS.HEALTH]: BASE_COLORS.healthTertiary,
  [JOURNEY_IDS.CARE]: BASE_COLORS.careTertiary,
  [JOURNEY_IDS.PLAN]: BASE_COLORS.planTertiary,
};

/**
 * Neutral colors for UI elements
 */
export const NEUTRAL_COLORS = {
  white: BASE_COLORS.white,
  gray100: BASE_COLORS.gray100,
  gray200: BASE_COLORS.gray200,
  gray300: BASE_COLORS.gray300,
  gray400: BASE_COLORS.gray400,
  gray500: BASE_COLORS.gray500,
  gray600: BASE_COLORS.gray600,
  gray700: BASE_COLORS.gray700,
  gray800: BASE_COLORS.gray800,
  gray900: BASE_COLORS.gray900,
  black: BASE_COLORS.black,
};