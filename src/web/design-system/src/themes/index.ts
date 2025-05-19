/**
 * Aggregates and exports all theme definitions for the AUSTA SuperApp design system.
 * This module provides a single entry point for accessing the base theme and journey-specific themes
 * (Health, Care, and Plan), enabling consistent styling and theming across the application.
 *
 * @module themes
 */

// Import all themes
import { baseTheme } from './base.theme';
import { healthTheme } from './health.theme';
import { careTheme } from './care.theme';
import { planTheme } from './plan.theme';

// Import theme types from @austa/interfaces/themes
import {
  Theme,
  HealthTheme,
  CareTheme,
  PlanTheme,
  ThemeContext,
  JourneyKey
} from '@austa/interfaces/themes';

// Import React hooks
import { useContext } from 'react';
import { ThemeContext as StyledThemeContext } from 'styled-components';

/**
 * Custom hook to access the current theme from the ThemeProvider.
 * This hook provides type-safe access to the theme object within any component.
 *
 * @returns {Theme} The current theme object
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const theme = useTheme();
 *   return <div style={{ color: theme.colors.primary }}>Themed Text</div>;
 * };
 * ```
 */
export const useTheme = (): Theme => {
  const theme = useContext(StyledThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme as Theme;
};

/**
 * Custom hook to access the journey-specific theme based on the current journey context.
 * This hook determines which journey the user is currently in and returns the appropriate theme.
 *
 * @param {JourneyKey} journeyKey - The current journey key ('health', 'care', or 'plan')
 * @returns {Theme} The journey-specific theme
 * @example
 * ```tsx
 * const MyJourneyComponent = () => {
 *   const journeyTheme = useJourneyTheme('health');
 *   return <div style={{ color: journeyTheme.colors.primary }}>Health Journey</div>;
 * };
 * ```
 */
export const useJourneyTheme = (journeyKey: JourneyKey): Theme => {
  switch (journeyKey) {
    case 'health':
      return healthTheme;
    case 'care':
      return careTheme;
    case 'plan':
      return planTheme;
    default:
      return baseTheme;
  }
};

// Export all themes
export { 
  baseTheme,    // Base theme with common styles
  healthTheme,  // Health Journey theme (green)
  careTheme,    // Care Now Journey theme (orange)
  planTheme     // My Plan & Benefits Journey theme (blue)
};

// Export theme types
export type {
  Theme,        // Base theme interface
  HealthTheme,  // Health journey theme interface
  CareTheme,    // Care journey theme interface
  PlanTheme,    // Plan journey theme interface
  ThemeContext, // Theme context interface
  JourneyKey    // Journey key type ('health', 'care', 'plan')
};