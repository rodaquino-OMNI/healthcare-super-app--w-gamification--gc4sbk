import { useJourney } from './useJourney';
import { colors } from '@design-system/primitives';

/**
 * Return type for the useJourneyTheme hook
 */
export interface UseJourneyThemeReturn {
  /**
   * Primary color for the current journey
   */
  primary: string;
  
  /**
   * Secondary color for the current journey
   */
  secondary: string;
  
  /**
   * Accent color for the current journey
   */
  accent: string;
  
  /**
   * Background color for the current journey
   */
  background: string;
  
  /**
   * Text color for the current journey
   */
  text: string;
  
  /**
   * Get a color with specific opacity
   * @param colorKey The color key (primary, secondary, accent, background, text)
   * @param opacity The opacity value (10, 20, 30, 50, 70, 90)
   */
  getColorWithOpacity: (colorKey: keyof Omit<UseJourneyThemeReturn, 'getColorWithOpacity'>, opacity: 10 | 20 | 30 | 50 | 70 | 90) => string;
}

/**
 * Custom hook that provides journey-specific theme colors.
 * Uses the current journey context to determine the appropriate color palette.
 * 
 * @returns An object containing journey-specific theme colors
 */
export const useJourneyTheme = (): UseJourneyThemeReturn => {
  const { journeyId } = useJourney();
  
  // Default to health journey if no journey is selected
  const journeyKey = (journeyId || 'health') as 'health' | 'care' | 'plan';
  
  // Get the journey-specific color palette
  const journeyColors = colors.journeys[journeyKey];
  
  /**
   * Get a color with specific opacity
   * @param colorKey The color key (primary, secondary, accent, background, text)
   * @param opacity The opacity value (10, 20, 30, 50, 70, 90)
   * @returns The color with the specified opacity
   */
  const getColorWithOpacity = (colorKey: keyof Omit<UseJourneyThemeReturn, 'getColorWithOpacity'>, opacity: 10 | 20 | 30 | 50 | 70 | 90): string => {
    if (colorKey === 'primary') {
      return journeyColors[`primary_${opacity}`];
    }
    
    // For other colors, use the token's opacity value
    const tokenKey = `${colorKey}_token` as keyof typeof journeyColors;
    const token = journeyColors[tokenKey];
    
    if (token) {
      return token[`_${opacity}`];
    }
    
    // Fallback to the base color
    return journeyColors[colorKey];
  };
  
  return {
    primary: journeyColors.primary,
    secondary: journeyColors.secondary,
    accent: journeyColors.accent,
    background: journeyColors.background,
    text: journeyColors.text,
    getColorWithOpacity
  };
};