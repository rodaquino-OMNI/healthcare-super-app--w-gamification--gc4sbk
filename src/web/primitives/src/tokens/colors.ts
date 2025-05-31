/**
 * Color tokens for the AUSTA SuperApp design system.
 * This file defines the color palette used throughout the application to ensure
 * visual consistency and support journey-based theming.
 * 
 * The color system is organized into:
 * - Brand colors: Core brand identity colors
 * - Journeys: Colors specific to each user journey (Health, Care, Plan)
 * - Semantic: Colors that convey meaning (success, error, etc.)
 * - Neutral: Grayscale colors for text, backgrounds, and UI elements
 * 
 * @example Usage with styled-components
 * ```tsx
 * import { colors } from '@design-system/primitives';
 * import styled from 'styled-components';
 * 
 * const HealthButton = styled.button`
 *   background-color: ${colors.journeys.health.primary};
 *   color: ${colors.neutral.white};
 *   &:hover {
 *     background-color: ${colors.journeys.health.primary_dark};
 *   }
 *   &:disabled {
 *     background-color: ${colors.journeys.health.primary_20};
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
 *   careContainer: {
 *     backgroundColor: colors.journeys.care.background,
 *     borderColor: colors.journeys.care.primary,
 *   },
 *   errorText: {
 *     color: colors.semantic.error,
 *   }
 * });
 * ```
 */

/**
 * Interface for color token with opacity variations
 * This interface is compatible with @austa/interfaces color token definitions
 */
export interface ColorToken {
  /** Base color value */
  readonly value: string;
  /** Color with 10% opacity */
  readonly _10: string;
  /** Color with 20% opacity */
  readonly _20: string;
  /** Color with 30% opacity */
  readonly _30: string;
  /** Color with 50% opacity */
  readonly _50: string;
  /** Color with 70% opacity */
  readonly _70: string;
  /** Color with 90% opacity */
  readonly _90: string;
  /** Darker shade of the color (for hover states) */
  readonly _dark: string;
  /** Lighter shade of the color (for active states) */
  readonly _light: string;
  /** Contrast text color that meets WCAG AA standards on this background */
  readonly _contrast: string;
}

/**
 * Interface for journey color palette
 */
export interface JourneyColorPalette {
  /** Main journey color */
  readonly primary: string;
  /** Primary color with opacity variations and contrast */
  readonly primary_token: ColorToken;
  /** Secondary journey color for buttons, accents */
  readonly secondary: string;
  /** Secondary color with opacity variations and contrast */
  readonly secondary_token: ColorToken;
  /** Strong accent color for highlights, important elements */
  readonly accent: string;
  /** Accent color with opacity variations and contrast */
  readonly accent_token: ColorToken;
  /** Light background color for journey screens */
  readonly background: string;
  /** Background color with opacity variations and contrast */
  readonly background_token: ColorToken;
  /** Text color to use on journey backgrounds */
  readonly text: string;
  /** Text color with opacity variations and contrast */
  readonly text_token: ColorToken;
  /** Color with 10% opacity - shorthand for primary_token._10 */
  readonly primary_10: string;
  /** Color with 20% opacity - shorthand for primary_token._20 */
  readonly primary_20: string;
  /** Color with 30% opacity - shorthand for primary_token._30 */
  readonly primary_30: string;
  /** Color with 50% opacity - shorthand for primary_token._50 */
  readonly primary_50: string;
  /** Color with 70% opacity - shorthand for primary_token._70 */
  readonly primary_70: string;
  /** Color with 90% opacity - shorthand for primary_token._90 */
  readonly primary_90: string;
  /** Darker shade of primary color - shorthand for primary_token._dark */
  readonly primary_dark: string;
  /** Lighter shade of primary color - shorthand for primary_token._light */
  readonly primary_light: string;
}

/**
 * Interface for semantic color palette
 */
export interface SemanticColorPalette {
  /** Success color for positive actions, confirmations, completed states */
  readonly success: string;
  /** Success color with opacity variations and contrast */
  readonly success_token: ColorToken;
  /** Warning color for alerts, warnings, actions requiring attention */
  readonly warning: string;
  /** Warning color with opacity variations and contrast */
  readonly warning_token: ColorToken;
  /** Error color for errors, destructive actions, critical alerts */
  readonly error: string;
  /** Error color with opacity variations and contrast */
  readonly error_token: ColorToken;
  /** Info color for informational messages, help text */
  readonly info: string;
  /** Info color with opacity variations and contrast */
  readonly info_token: ColorToken;
}

/**
 * Helper function to create a color token with opacity variations
 * @param hexColor - The base color in hex format (e.g., '#FF0000')
 * @returns A ColorToken object with opacity variations and contrast color
 */
const createColorToken = (hexColor: string): ColorToken => {
  // Convert hex to RGB for opacity calculations
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance for contrast ratio
  // Using the formula from WCAG 2.0
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  
  // Determine contrast color based on luminance
  // If luminance > 0.5, use black text, otherwise use white text
  const contrastColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
  
  // Calculate darker and lighter shades
  const darken = (hex: string): string => {
    const factor = 0.2; // 20% darker
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(factor * 255);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };
  
  const lighten = (hex: string): string => {
    const factor = 0.2; // 20% lighter
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(factor * 255);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };
  
  return {
    value: hexColor,
    _10: `rgba(${r}, ${g}, ${b}, 0.1)`,
    _20: `rgba(${r}, ${g}, ${b}, 0.2)`,
    _30: `rgba(${r}, ${g}, ${b}, 0.3)`,
    _50: `rgba(${r}, ${g}, ${b}, 0.5)`,
    _70: `rgba(${r}, ${g}, ${b}, 0.7)`,
    _90: `rgba(${r}, ${g}, ${b}, 0.9)`,
    _dark: darken(hexColor),
    _light: lighten(hexColor),
    _contrast: contrastColor
  };
};

/**
 * Helper function to create a journey color palette with all variations
 */
const createJourneyPalette = (primary: string, secondary: string, accent: string, background: string, text: string): JourneyColorPalette => {
  const primaryToken = createColorToken(primary);
  const secondaryToken = createColorToken(secondary);
  const accentToken = createColorToken(accent);
  const backgroundToken = createColorToken(background);
  const textToken = createColorToken(text);
  
  return {
    primary,
    primary_token: primaryToken,
    secondary,
    secondary_token: secondaryToken,
    accent,
    accent_token: accentToken,
    background,
    background_token: backgroundToken,
    text,
    text_token: textToken,
    // Shorthand properties for common use cases
    primary_10: primaryToken._10,
    primary_20: primaryToken._20,
    primary_30: primaryToken._30,
    primary_50: primaryToken._50,
    primary_70: primaryToken._70,
    primary_90: primaryToken._90,
    primary_dark: primaryToken._dark,
    primary_light: primaryToken._light
  };
};

/**
 * Helper function to create a semantic color palette with all variations
 */
const createSemanticPalette = (success: string, warning: string, error: string, info: string): SemanticColorPalette => {
  return {
    success,
    success_token: createColorToken(success),
    warning,
    warning_token: createColorToken(warning),
    error,
    error_token: createColorToken(error),
    info,
    info_token: createColorToken(info)
  };
};

/**
 * Complete color palette for the AUSTA SuperApp
 */
export const colors = {
  /**
   * Primary brand colors that represent the AUSTA brand identity
   */
  brand: {
    primary: '#0066CC',    // Primary brand color
    primary_token: createColorToken('#0066CC'),
    secondary: '#00A3E0',  // Secondary brand color
    secondary_token: createColorToken('#00A3E0'),
    tertiary: '#6D2077',   // Tertiary brand color for accents
    tertiary_token: createColorToken('#6D2077'),
  },

  /**
   * Journey-specific color palettes.
   * Each journey has its own color scheme to help users identify which journey they're in:
   * - My Health (Minha Saúde): Green palette
   * - Care Now (Cuidar-me Agora): Orange palette
   * - My Plan (Meu Plano & Benefícios): Blue palette
   */
  journeys: {
    health: createJourneyPalette(
      '#0ACF83',    // Main health journey color (Green)
      '#05A66A',    // Secondary health color for buttons, accents
      '#00875A',    // Strong accent color for highlights, important elements
      '#F0FFF4',    // Light background color for health journey screens
      '#1A1A1A'     // Text color to use on health journey backgrounds
    ),
    care: createJourneyPalette(
      '#FF8C42',    // Main care journey color (Orange)
      '#F17C3A',    // Secondary care color for buttons, accents
      '#E55A00',    // Strong accent color for highlights, important elements
      '#FFF8F0',    // Light background color for care journey screens
      '#1A1A1A'     // Text color to use on care journey backgrounds
    ),
    plan: createJourneyPalette(
      '#3A86FF',    // Main plan journey color (Blue)
      '#2D6FD9',    // Secondary plan color for buttons, accents
      '#0057E7',    // Strong accent color for highlights, important elements
      '#F0F8FF',    // Light background color for plan journey screens
      '#1A1A1A'     // Text color to use on plan journey backgrounds
    ),
  },

  /**
   * Semantic colors that convey specific meanings
   */
  semantic: createSemanticPalette(
    '#00C853',  // Success: Positive actions, confirmations, completed states
    '#FFD600',  // Warning: Alerts, warnings, actions requiring attention
    '#FF3B30',  // Error: Errors, destructive actions, critical alerts
    '#0066CC'   // Info: Informational messages, help text
  ),

  /**
   * Neutral colors for text, backgrounds, borders, and other UI elements
   */
  neutral: {
    white: '#FFFFFF',   // Pure white for backgrounds, cards
    white_token: createColorToken('#FFFFFF'),
    gray100: '#F5F5F5', // Very light gray for subtle backgrounds, hover states
    gray100_token: createColorToken('#F5F5F5'),
    gray200: '#EEEEEE', // Light gray for dividers, disabled buttons
    gray200_token: createColorToken('#EEEEEE'),
    gray300: '#E0E0E0', // Light gray for borders, dividers
    gray300_token: createColorToken('#E0E0E0'),
    gray400: '#BDBDBD', // Medium gray for disabled text, icons
    gray400_token: createColorToken('#BDBDBD'),
    gray500: '#9E9E9E', // Medium gray for placeholder text
    gray500_token: createColorToken('#9E9E9E'),
    gray600: '#757575', // Medium-dark gray for secondary text
    gray600_token: createColorToken('#757575'),
    gray700: '#616161', // Dark gray for body text
    gray700_token: createColorToken('#616161'),
    gray800: '#424242', // Very dark gray for headings
    gray800_token: createColorToken('#424242'),
    gray900: '#212121', // Nearly black for primary text
    gray900_token: createColorToken('#212121'),
    black: '#000000',   // Pure black for high contrast elements
    black_token: createColorToken('#000000'),
  },
  
  /**
   * Semantic color mappings to journey-specific contexts
   * These mappings help maintain consistent meaning across different journeys
   */
  contextual: {
    health: {
      success: '#00C853',  // Success in health context (completed goal)
      warning: '#FFD600',  // Warning in health context (approaching limit)
      error: '#FF3B30',    // Error in health context (missed target)
      info: '#0ACF83',     // Info in health context (uses journey primary)
    },
    care: {
      success: '#00C853',  // Success in care context (confirmed appointment)
      warning: '#FFD600',  // Warning in care context (upcoming deadline)
      error: '#FF3B30',    // Error in care context (missed medication)
      info: '#FF8C42',     // Info in care context (uses journey primary)
    },
    plan: {
      success: '#00C853',  // Success in plan context (approved claim)
      warning: '#FFD600',  // Warning in plan context (pending review)
      error: '#FF3B30',    // Error in plan context (rejected claim)
      info: '#3A86FF',     // Info in plan context (uses journey primary)
    }
  },
  
  /**
   * Accessibility helpers for ensuring proper contrast ratios
   * These functions can be used to get the appropriate contrast color for any background
   */
  accessibility: {
    /**
     * Returns the appropriate text color (black or white) for the given background color
     * to ensure WCAG AA compliance (4.5:1 contrast ratio for normal text)
     * @param backgroundColor - The background color in hex format
     * @returns The appropriate text color (#000000 or #FFFFFF)
     */
    getContrastText: (backgroundColor: string): string => {
      const token = createColorToken(backgroundColor);
      return token._contrast;
    },
    
    /**
     * Returns the appropriate text color for the given journey and element
     * @param journey - The journey context ('health', 'care', or 'plan')
     * @param element - The element type ('primary', 'secondary', 'accent', 'background')
     * @returns The appropriate text color for WCAG AA compliance
     */
    getJourneyContrastText: (journey: 'health' | 'care' | 'plan', element: 'primary' | 'secondary' | 'accent' | 'background'): string => {
      const journeyColors = colors.journeys[journey];
      const backgroundColor = journeyColors[element];
      return createColorToken(backgroundColor)._contrast;
    }
  }
};