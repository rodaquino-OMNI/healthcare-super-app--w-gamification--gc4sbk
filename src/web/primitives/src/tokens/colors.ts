/**
 * Color tokens for the AUSTA SuperApp design system.
 * 
 * This file defines the complete color palette used throughout the application to ensure
 * visual consistency and support journey-based theming. The color system is organized into:
 * 
 * - Brand colors: Core brand identity colors
 * - Journeys: Colors specific to each user journey (Health, Care, Plan)
 * - Semantic: Colors that convey meaning (success, error, etc.)
 * - Neutral: Grayscale colors for text, backgrounds, and UI elements
 * 
 * Each color includes opacity variations (10%, 20%, 50%, etc.) and contrast ratio
 * calculations to ensure accessibility compliance.
 * 
 * @example Usage with styled-components
 * ```tsx
 * import { colors } from '@design-system/primitives';
 * import styled from 'styled-components';
 * 
 * const HealthButton = styled.button`
 *   background-color: ${colors.journeys.health.primary};
 *   color: ${colors.neutral.white};
 *   
 *   &:hover {
 *     background-color: ${colors.journeys.health.primary_dark};
 *   }
 *   
 *   &:disabled {
 *     background-color: ${colors.journeys.health.primary_alpha.a50};
 *   }
 * `;
 * ```
 * 
 * @example Usage with React Native StyleSheet
 * ```tsx
 * import { colors } from '@design-system/primitives';
 * import { StyleSheet } from 'react-native';
 * 
 * const styles = StyleSheet.create({
 *   careButton: {
 *     backgroundColor: colors.journeys.care.primary,
 *     color: colors.neutral.white,
 *   },
 *   disabledButton: {
 *     backgroundColor: colors.journeys.care.primary_alpha.a50,
 *   }
 * });
 * ```
 */

import { ColorToken, JourneyColorToken, SemanticColorToken, NeutralColorToken } from '@austa/interfaces/themes/tokens.types';

/**
 * Calculates the relative luminance of a color for accessibility calculations
 * Based on WCAG 2.1 specifications
 * 
 * @param hexColor - Hex color code (e.g., '#FFFFFF')
 * @returns Relative luminance value between 0 and 1
 */
export function calculateLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calculate RGB values
  const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the contrast ratio between two colors
 * Based on WCAG 2.1 specifications
 * 
 * @param color1 - First hex color code
 * @param color2 - Second hex color code
 * @returns Contrast ratio between 1:1 and 21:1
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = calculateLuminance(color1);
  const luminance2 = calculateLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG accessibility standards
 * 
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether the text is large (>=18pt or >=14pt bold)
 * @returns Whether the combination passes the specified accessibility level
 */
export function meetsAccessibilityStandards(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * Creates color variations with different opacity levels
 * 
 * @param hexColor - Base hex color
 * @returns Object with alpha variations
 */
function createAlphaVariations(hexColor: string): Record<string, string> {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    a10: `rgba(${r}, ${g}, ${b}, 0.1)`,
    a20: `rgba(${r}, ${g}, ${b}, 0.2)`,
    a30: `rgba(${r}, ${g}, ${b}, 0.3)`,
    a40: `rgba(${r}, ${g}, ${b}, 0.4)`,
    a50: `rgba(${r}, ${g}, ${b}, 0.5)`,
    a60: `rgba(${r}, ${g}, ${b}, 0.6)`,
    a70: `rgba(${r}, ${g}, ${b}, 0.7)`,
    a80: `rgba(${r}, ${g}, ${b}, 0.8)`,
    a90: `rgba(${r}, ${g}, ${b}, 0.9)`,
  };
}

/**
 * Creates lighter and darker variations of a color
 * 
 * @param hexColor - Base hex color
 * @returns Object with light and dark variations
 */
function createColorVariations(hexColor: string): { light: string; dark: string } {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Create lighter variation (15% lighter)
  const lighterR = Math.min(255, Math.round(r * 1.15));
  const lighterG = Math.min(255, Math.round(g * 1.15));
  const lighterB = Math.min(255, Math.round(b * 1.15));
  
  // Create darker variation (15% darker)
  const darkerR = Math.round(r * 0.85);
  const darkerG = Math.round(g * 0.85);
  const darkerB = Math.round(b * 0.85);
  
  // Convert back to hex
  const lighterHex = `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  const darkerHex = `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  
  return {
    light: lighterHex,
    dark: darkerHex,
  };
}

/**
 * Complete color palette for the AUSTA SuperApp
 */
export const colors = {
  /**
   * Primary brand colors that represent the AUSTA brand identity
   */
  brand: {
    primary: '#0066CC',    // Primary brand color
    primary_light: '#0077EF', // Lighter variation of primary
    primary_dark: '#0055AD',  // Darker variation of primary
    primary_alpha: createAlphaVariations('#0066CC'),
    
    secondary: '#00A3E0',  // Secondary brand color
    secondary_light: '#00BCFF', // Lighter variation of secondary
    secondary_dark: '#008BBE',  // Darker variation of secondary
    secondary_alpha: createAlphaVariations('#00A3E0'),
    
    tertiary: '#6D2077',   // Tertiary brand color for accents
    tertiary_light: '#7D258A', // Lighter variation of tertiary
    tertiary_dark: '#5D1B65',  // Darker variation of tertiary
    tertiary_alpha: createAlphaVariations('#6D2077'),
  } as ColorToken,

  /**
   * Journey-specific color palettes.
   * Each journey has its own color scheme to help users identify which journey they're in:
   * - My Health (Minha Saúde): Green palette
   * - Care Now (Cuidar-me Agora): Orange palette
   * - My Plan (Meu Plano & Benefícios): Blue palette
   */
  journeys: {
    health: {
      primary: '#0ACF83',    // Main health journey color (Green)
      primary_light: '#0CE89A', // Lighter variation
      primary_dark: '#09B06F',  // Darker variation
      primary_alpha: createAlphaVariations('#0ACF83'),
      
      secondary: '#05A66A',  // Secondary health color for buttons, accents
      secondary_light: '#06C07A', // Lighter variation
      secondary_dark: '#048D5A',  // Darker variation
      secondary_alpha: createAlphaVariations('#05A66A'),
      
      accent: '#00875A',     // Strong accent color for highlights, important elements
      accent_light: '#009C68', // Lighter variation
      accent_dark: '#00724C',  // Darker variation
      accent_alpha: createAlphaVariations('#00875A'),
      
      background: '#F0FFF4', // Light background color for health journey screens
      background_light: '#FFFFFF', // Lighter variation
      background_dark: '#E1F0E5',  // Darker variation
      background_alpha: createAlphaVariations('#F0FFF4'),
      
      text: '#1A1A1A',       // Text color to use on health journey backgrounds
      text_light: '#333333', // Lighter variation
      text_dark: '#000000',  // Darker variation
      text_alpha: createAlphaVariations('#1A1A1A'),
    } as JourneyColorToken,
    
    care: {
      primary: '#FF8C42',    // Main care journey color (Orange)
      primary_light: '#FFA05C', // Lighter variation
      primary_dark: '#E57C39',  // Darker variation
      primary_alpha: createAlphaVariations('#FF8C42'),
      
      secondary: '#F17C3A',  // Secondary care color for buttons, accents
      secondary_light: '#FF8F43', // Lighter variation
      secondary_dark: '#D06A31',  // Darker variation
      secondary_alpha: createAlphaVariations('#F17C3A'),
      
      accent: '#E55A00',     // Strong accent color for highlights, important elements
      accent_light: '#FF6700', // Lighter variation
      accent_dark: '#C24D00',  // Darker variation
      accent_alpha: createAlphaVariations('#E55A00'),
      
      background: '#FFF8F0', // Light background color for care journey screens
      background_light: '#FFFFFF', // Lighter variation
      background_dark: '#F0E9E1',  // Darker variation
      background_alpha: createAlphaVariations('#FFF8F0'),
      
      text: '#1A1A1A',       // Text color to use on care journey backgrounds
      text_light: '#333333', // Lighter variation
      text_dark: '#000000',  // Darker variation
      text_alpha: createAlphaVariations('#1A1A1A'),
    } as JourneyColorToken,
    
    plan: {
      primary: '#3A86FF',    // Main plan journey color (Blue)
      primary_light: '#5C9CFF', // Lighter variation
      primary_dark: '#3172D9',  // Darker variation
      primary_alpha: createAlphaVariations('#3A86FF'),
      
      secondary: '#2D6FD9',  // Secondary plan color for buttons, accents
      secondary_light: '#3480F7', // Lighter variation
      secondary_dark: '#265EB8',  // Darker variation
      secondary_alpha: createAlphaVariations('#2D6FD9'),
      
      accent: '#0057E7',     // Strong accent color for highlights, important elements
      accent_light: '#0064FF', // Lighter variation
      accent_dark: '#004AC5',  // Darker variation
      accent_alpha: createAlphaVariations('#0057E7'),
      
      background: '#F0F8FF', // Light background color for plan journey screens
      background_light: '#FFFFFF', // Lighter variation
      background_dark: '#E1E9F0',  // Darker variation
      background_alpha: createAlphaVariations('#F0F8FF'),
      
      text: '#1A1A1A',       // Text color to use on plan journey backgrounds
      text_light: '#333333', // Lighter variation
      text_dark: '#000000',  // Darker variation
      text_alpha: createAlphaVariations('#1A1A1A'),
    } as JourneyColorToken,
  },

  /**
   * Semantic colors that convey specific meanings
   */
  semantic: {
    success: '#00C853', // Positive actions, confirmations, completed states
    success_light: '#00E561', // Lighter variation
    success_dark: '#00AA46',  // Darker variation
    success_alpha: createAlphaVariations('#00C853'),
    
    warning: '#FFD600', // Alerts, warnings, actions requiring attention
    warning_light: '#FFF000', // Lighter variation
    warning_dark: '#D9B600',  // Darker variation
    warning_alpha: createAlphaVariations('#FFD600'),
    
    error: '#FF3B30',   // Errors, destructive actions, critical alerts
    error_light: '#FF5449', // Lighter variation
    error_dark: '#D93228',  // Darker variation
    error_alpha: createAlphaVariations('#FF3B30'),
    
    info: '#0066CC',    // Informational messages, help text
    info_light: '#0077EF', // Lighter variation
    info_dark: '#0055AD',  // Darker variation
    info_alpha: createAlphaVariations('#0066CC'),
  } as SemanticColorToken,

  /**
   * Neutral colors for text, backgrounds, borders, and other UI elements
   */
  neutral: {
    white: '#FFFFFF',   // Pure white for backgrounds, cards
    white_alpha: createAlphaVariations('#FFFFFF'),
    
    gray100: '#F5F5F5', // Very light gray for subtle backgrounds, hover states
    gray100_alpha: createAlphaVariations('#F5F5F5'),
    
    gray200: '#EEEEEE', // Light gray for dividers, disabled buttons
    gray200_alpha: createAlphaVariations('#EEEEEE'),
    
    gray300: '#E0E0E0', // Light gray for borders, dividers
    gray300_alpha: createAlphaVariations('#E0E0E0'),
    
    gray400: '#BDBDBD', // Medium gray for disabled text, icons
    gray400_alpha: createAlphaVariations('#BDBDBD'),
    
    gray500: '#9E9E9E', // Medium gray for placeholder text
    gray500_alpha: createAlphaVariations('#9E9E9E'),
    
    gray600: '#757575', // Medium-dark gray for secondary text
    gray600_alpha: createAlphaVariations('#757575'),
    
    gray700: '#616161', // Dark gray for body text
    gray700_alpha: createAlphaVariations('#616161'),
    
    gray800: '#424242', // Very dark gray for headings
    gray800_alpha: createAlphaVariations('#424242'),
    
    gray900: '#212121', // Nearly black for primary text
    gray900_alpha: createAlphaVariations('#212121'),
    
    black: '#000000',   // Pure black for high contrast elements
    black_alpha: createAlphaVariations('#000000'),
  } as NeutralColorToken,
  
  /**
   * Semantic color mappings to journey-specific contexts
   * These provide consistent semantic meaning across journeys while using journey-specific colors
   */
  contextual: {
    health: {
      primary: '#0ACF83',    // Maps to health.primary
      secondary: '#05A66A',  // Maps to health.secondary
      success: '#00C853',    // Maps to semantic.success
      warning: '#FFD600',    // Maps to semantic.warning
      error: '#FF3B30',      // Maps to semantic.error
      info: '#0066CC',       // Maps to semantic.info
      background: '#F0FFF4',  // Maps to health.background
      text: '#1A1A1A',        // Maps to health.text
      border: '#E0E0E0',      // Maps to neutral.gray300
      disabled: '#BDBDBD',    // Maps to neutral.gray400
    },
    care: {
      primary: '#FF8C42',    // Maps to care.primary
      secondary: '#F17C3A',  // Maps to care.secondary
      success: '#00C853',    // Maps to semantic.success
      warning: '#FFD600',    // Maps to semantic.warning
      error: '#FF3B30',      // Maps to semantic.error
      info: '#0066CC',       // Maps to semantic.info
      background: '#FFF8F0',  // Maps to care.background
      text: '#1A1A1A',        // Maps to care.text
      border: '#E0E0E0',      // Maps to neutral.gray300
      disabled: '#BDBDBD',    // Maps to neutral.gray400
    },
    plan: {
      primary: '#3A86FF',    // Maps to plan.primary
      secondary: '#2D6FD9',  // Maps to plan.secondary
      success: '#00C853',    // Maps to semantic.success
      warning: '#FFD600',    // Maps to semantic.warning
      error: '#FF3B30',      // Maps to semantic.error
      info: '#0066CC',       // Maps to semantic.info
      background: '#F0F8FF',  // Maps to plan.background
      text: '#1A1A1A',        // Maps to plan.text
      border: '#E0E0E0',      // Maps to neutral.gray300
      disabled: '#BDBDBD',    // Maps to neutral.gray400
    },
  },
};

/**
 * Accessibility helper to check if text on a background meets WCAG standards
 * 
 * @example
 * ```tsx
 * import { isAccessible } from '@design-system/primitives';
 * 
 * // Check if black text on white background meets AA standards
 * const passes = isAccessible(colors.neutral.black, colors.neutral.white);
 * ```
 */
export function isAccessible(
  textColor: string,
  backgroundColor: string,
  options?: { level?: 'AA' | 'AAA'; isLargeText?: boolean }
): boolean {
  const { level = 'AA', isLargeText = false } = options || {};
  return meetsAccessibilityStandards(textColor, backgroundColor, level, isLargeText);
}

export default colors;