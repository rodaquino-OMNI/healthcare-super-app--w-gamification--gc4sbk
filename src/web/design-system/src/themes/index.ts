/**
 * Theme Exports
 * 
 * This file aggregates and re-exports all theme definitions for the AUSTA SuperApp design system,
 * providing a single entry point for consistent styling across all application journeys.
 * 
 * It exports:
 * - Individual themes (baseTheme, healthTheme, careTheme, planTheme)
 * - Theme types from @austa/interfaces/themes
 * - Utility hooks for accessing the current theme in components
 */

// Import themes
import { baseTheme, Theme } from './base.theme';
import { healthTheme } from './health.theme';
import { careTheme } from './care.theme';
import { planTheme } from './plan.theme';

// Import theme types from @austa/interfaces/themes
import {
  ThemeContext,
  ThemeProviderProps,
  JourneyTheme,
  HealthTheme,
  CareTheme,
  PlanTheme,
  ThemeProps,
  WithThemeProps
} from '@austa/interfaces/themes';

// Re-export themes
export { baseTheme, healthTheme, careTheme, planTheme };

// Re-export theme types
export type {
  Theme,
  ThemeContext,
  ThemeProviderProps,
  JourneyTheme,
  HealthTheme,
  CareTheme,
  PlanTheme,
  ThemeProps,
  WithThemeProps
};

/**
 * Map of journey keys to their corresponding themes
 */
export const journeyThemes = {
  health: healthTheme,
  care: careTheme,
  plan: planTheme,
  base: baseTheme
};

/**
 * Type for journey keys
 */
export type JourneyKey = keyof typeof journeyThemes;

/**
 * Hook to access the current theme in a component
 * @returns The current theme object
 */
export function useTheme<T extends Theme = Theme>(): T {
  // This is a placeholder that will be implemented in the ThemeProvider
  // The actual implementation will use React's useContext hook
  throw new Error('useTheme must be used within a ThemeProvider');
}

/**
 * Hook to access a specific journey theme
 * @param journeyKey - The key of the journey theme to use
 * @returns The journey-specific theme
 */
export function useJourneyTheme<T extends JourneyTheme = JourneyTheme>(journeyKey: JourneyKey): T {
  // This is a placeholder that will be implemented in the ThemeProvider
  // The actual implementation will use the journeyThemes map
  throw new Error('useJourneyTheme must be used within a ThemeProvider');
}

/**
 * Utility function to get a theme by journey key
 * @param journeyKey - The key of the journey theme to get
 * @returns The journey-specific theme
 */
export function getThemeByJourney(journeyKey: JourneyKey): Theme {
  return journeyThemes[journeyKey] || baseTheme;
}