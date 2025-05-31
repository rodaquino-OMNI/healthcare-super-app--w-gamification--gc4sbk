/**
 * Core Theme interface and related types for the AUSTA SuperApp design system.
 * 
 * This file defines the fundamental structure of theme objects, including color palettes,
 * typography scales, spacing system, breakpoints, and other design properties.
 * It serves as the foundation for journey-specific theme variations and ensures
 * consistent typing for theme consumers across both web and mobile platforms.
 * 
 * @module theme.types
 */

import { ReactNode } from 'react';
import {
  ColorToken,
  JourneyColorPalette,
  SemanticColorPalette,
} from '@design-system/primitives/src/tokens/colors';
import {
  TypographyTokens,
  FontFamilyTokens,
  FontWeightTokens,
  FontSizeTokens,
  LineHeightTokens,
  LetterSpacingTokens,
} from '@design-system/primitives/src/tokens/typography';
import { ResponsiveBreakpoint } from './tokens.types';

/**
 * Core Theme interface that defines the structure of all theme objects in the application.
 * This interface is implemented by the base theme and extended by journey-specific themes.
 */
export interface Theme {
  /**
   * Unique identifier for the theme
   */
  id: string;

  /**
   * Human-readable name of the theme
   */
  name: string;

  /**
   * Color palettes for the theme
   */
  colors: {
    /**
     * Brand colors that represent the AUSTA brand identity
     */
    brand: {
      primary: string;
      primary_token: ColorToken;
      secondary: string;
      secondary_token: ColorToken;
      tertiary: string;
      tertiary_token: ColorToken;
    };

    /**
     * Journey-specific color palettes
     */
    journeys: {
      health: JourneyColorPalette;
      care: JourneyColorPalette;
      plan: JourneyColorPalette;
    };

    /**
     * Semantic colors that convey specific meanings
     */
    semantic: SemanticColorPalette;

    /**
     * Neutral colors for text, backgrounds, borders, and other UI elements
     */
    neutral: {
      white: string;
      white_token: ColorToken;
      gray100: string;
      gray100_token: ColorToken;
      gray200: string;
      gray200_token: ColorToken;
      gray300: string;
      gray300_token: ColorToken;
      gray400: string;
      gray400_token: ColorToken;
      gray500: string;
      gray500_token: ColorToken;
      gray600: string;
      gray600_token: ColorToken;
      gray700: string;
      gray700_token: ColorToken;
      gray800: string;
      gray800_token: ColorToken;
      gray900: string;
      gray900_token: ColorToken;
      black: string;
      black_token: ColorToken;
    };

    /**
     * Contextual color mappings for journey-specific semantic colors
     */
    contextual: {
      health: {
        success: string;
        warning: string;
        error: string;
        info: string;
      };
      care: {
        success: string;
        warning: string;
        error: string;
        info: string;
      };
      plan: {
        success: string;
        warning: string;
        error: string;
        info: string;
      };
    };

    /**
     * Accessibility helpers for ensuring proper contrast ratios
     */
    accessibility: {
      /**
       * Returns the appropriate text color (black or white) for the given background color
       * to ensure WCAG AA compliance (4.5:1 contrast ratio for normal text)
       */
      getContrastText: (backgroundColor: string) => string;

      /**
       * Returns the appropriate text color for the given journey and element
       */
      getJourneyContrastText: (
        journey: 'health' | 'care' | 'plan',
        element: 'primary' | 'secondary' | 'accent' | 'background'
      ) => string;
    };
  };

  /**
   * Typography settings for the theme
   */
  typography: TypographyTokens;

  /**
   * Spacing scale for the theme based on an 8-point grid system
   */
  spacing: {
    /**
     * Extra small spacing (4px)
     */
    xs: string;

    /**
     * Small spacing (8px)
     */
    sm: string;

    /**
     * Medium spacing (16px)
     */
    md: string;

    /**
     * Large spacing (24px)
     */
    lg: string;

    /**
     * Extra large spacing (32px)
     */
    xl: string;

    /**
     * 2x extra large spacing (48px)
     */
    '2xl': string;

    /**
     * 3x extra large spacing (64px)
     */
    '3xl': string;

    /**
     * 4x extra large spacing (96px)
     */
    '4xl': string;

    /**
     * Negative extra small spacing (-4px)
     */
    'neg-xs': string;

    /**
     * Negative small spacing (-8px)
     */
    'neg-sm': string;

    /**
     * Negative medium spacing (-16px)
     */
    'neg-md': string;

    /**
     * Negative large spacing (-24px)
     */
    'neg-lg': string;

    /**
     * Negative extra large spacing (-32px)
     */
    'neg-xl': string;

    /**
     * Negative 2x extra large spacing (-48px)
     */
    'neg-2xl': string;

    /**
     * Negative 3x extra large spacing (-64px)
     */
    'neg-3xl': string;

    /**
     * Negative 4x extra large spacing (-96px)
     */
    'neg-4xl': string;

    /**
     * Helper function to get spacing value by key or direct pixel value
     */
    get: (value: keyof Theme['spacing'] | number | string) => string;
  };

  /**
   * Border radius settings for the theme
   */
  borderRadius: {
    /**
     * Small border radius (2px)
     */
    sm: string;

    /**
     * Medium border radius (4px)
     */
    md: string;

    /**
     * Large border radius (8px)
     */
    lg: string;

    /**
     * Extra large border radius (16px)
     */
    xl: string;

    /**
     * Full/circular border radius (9999px)
     */
    full: string;
  };

  /**
   * Shadow settings for the theme
   */
  shadows: {
    /**
     * Small shadow (subtle elevation)
     */
    sm: string;

    /**
     * Medium shadow (moderate elevation)
     */
    md: string;

    /**
     * Large shadow (significant elevation)
     */
    lg: string;

    /**
     * Extra large shadow (maximum elevation)
     */
    xl: string;

    /**
     * No shadow (flat)
     */
    none: string;

    /**
     * Platform-specific shadow implementations
     */
    platforms: {
      web: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        none: string;
      };
      native: {
        sm: object;
        md: object;
        lg: object;
        xl: object;
        none: object;
      };
    };
  };

  /**
   * Animation settings for the theme
   */
  animation: {
    /**
     * Animation durations
     */
    duration: {
      /**
       * Fast animation (150ms)
       */
      fast: string;

      /**
       * Normal animation (300ms)
       */
      normal: string;

      /**
       * Slow animation (500ms)
       */
      slow: string;
    };

    /**
     * Animation easing curves
     */
    easing: {
      /**
       * Ease-in animation curve
       */
      easeIn: string;

      /**
       * Ease-out animation curve
       */
      easeOut: string;

      /**
       * Ease-in-out animation curve
       */
      easeInOut: string;
    };
  };

  /**
   * Breakpoints for responsive design
   */
  breakpoints: {
    /**
     * Extra small breakpoint (0px)
     */
    xs: string;

    /**
     * Small breakpoint (576px)
     */
    sm: string;

    /**
     * Medium breakpoint (768px)
     */
    md: string;

    /**
     * Large breakpoint (992px)
     */
    lg: string;

    /**
     * Extra large breakpoint (1200px)
     */
    xl: string;

    /**
     * Media query helper for up breakpoints
     * @example theme.breakpoints.up('md') => '@media (min-width: 768px)'
     */
    up: (key: ResponsiveBreakpoint) => string;

    /**
     * Media query helper for down breakpoints
     * @example theme.breakpoints.down('md') => '@media (max-width: 767.98px)'
     */
    down: (key: ResponsiveBreakpoint) => string;

    /**
     * Media query helper for between breakpoints
     * @example theme.breakpoints.between('sm', 'md') => '@media (min-width: 576px) and (max-width: 767.98px)'
     */
    between: (start: ResponsiveBreakpoint, end: ResponsiveBreakpoint) => string;
  };

  /**
   * Component-specific theme overrides
   */
  components: {
    /**
     * Button component theme
     */
    Button: {
      borderRadius: string;
      fontSize: string;
      padding: {
        sm: string;
        md: string;
        lg: string;
      };
      variants: {
        primary: {
          backgroundColor: string;
          color: string;
          hoverBackgroundColor: string;
          activeBackgroundColor: string;
          disabledBackgroundColor: string;
          disabledColor: string;
        };
        secondary: {
          backgroundColor: string;
          color: string;
          hoverBackgroundColor: string;
          activeBackgroundColor: string;
          disabledBackgroundColor: string;
          disabledColor: string;
        };
        outline: {
          backgroundColor: string;
          color: string;
          borderColor: string;
          hoverBackgroundColor: string;
          hoverBorderColor: string;
          activeBackgroundColor: string;
          activeBorderColor: string;
          disabledBackgroundColor: string;
          disabledBorderColor: string;
          disabledColor: string;
        };
        text: {
          backgroundColor: string;
          color: string;
          hoverBackgroundColor: string;
          activeBackgroundColor: string;
          disabledBackgroundColor: string;
          disabledColor: string;
        };
      };
    };

    /**
     * Card component theme
     */
    Card: {
      backgroundColor: string;
      borderRadius: string;
      boxShadow: string;
      padding: string;
      header: {
        backgroundColor: string;
        padding: string;
      };
      body: {
        padding: string;
      };
      footer: {
        backgroundColor: string;
        padding: string;
      };
    };

    /**
     * Input component theme
     */
    Input: {
      backgroundColor: string;
      borderColor: string;
      borderRadius: string;
      color: string;
      fontSize: string;
      padding: string;
      placeholderColor: string;
      focusBorderColor: string;
      errorBorderColor: string;
      errorColor: string;
      disabledBackgroundColor: string;
      disabledBorderColor: string;
      disabledColor: string;
    };

    /**
     * ProgressBar component theme
     */
    ProgressBar: {
      backgroundColor: string;
      borderRadius: string;
      height: string;
      filledColor: string;
    };

    /**
     * ProgressCircle component theme
     */
    ProgressCircle: {
      backgroundColor: string;
      filledColor: string;
      size: {
        sm: string;
        md: string;
        lg: string;
      };
      strokeWidth: {
        sm: string;
        md: string;
        lg: string;
      };
    };

    /**
     * Additional component-specific theme overrides can be added here
     */
    [key: string]: any;
  };

  /**
   * Journey-specific theme properties
   */
  journey?: {
    /**
     * Current active journey key
     */
    key?: 'health' | 'care' | 'plan' | null;

    /**
     * Journey-specific color palette
     */
    palette?: JourneyColorPalette;
  };
}

/**
 * Health Journey Theme interface
 * Extends the base Theme with health-specific overrides
 */
export interface HealthTheme extends Theme {
  journey: {
    key: 'health';
    palette: JourneyColorPalette;
  };
}

/**
 * Care Journey Theme interface
 * Extends the base Theme with care-specific overrides
 */
export interface CareTheme extends Theme {
  journey: {
    key: 'care';
    palette: JourneyColorPalette;
  };
}

/**
 * Plan Journey Theme interface
 * Extends the base Theme with plan-specific overrides
 */
export interface PlanTheme extends Theme {
  journey: {
    key: 'plan';
    palette: JourneyColorPalette;
  };
}

/**
 * Union type of all possible theme types
 */
export type AustaTheme = Theme | HealthTheme | CareTheme | PlanTheme;

/**
 * Theme context properties for React context
 */
export interface ThemeContextProps {
  /**
   * Current theme object
   */
  theme: AustaTheme;

  /**
   * Function to set the current theme
   */
  setTheme: (theme: AustaTheme) => void;

  /**
   * Function to set the current journey
   */
  setJourney: (journey: 'health' | 'care' | 'plan' | null) => void;

  /**
   * Current journey key
   */
  journeyKey: 'health' | 'care' | 'plan' | null;
}

/**
 * Theme provider props for React context provider
 */
export interface ThemeProviderProps {
  /**
   * Initial theme to use
   */
  initialTheme?: AustaTheme;

  /**
   * Initial journey to use
   */
  initialJourney?: 'health' | 'care' | 'plan' | null;

  /**
   * Children components
   */
  children: ReactNode;
}

/**
 * Utility type to access theme properties in styled components
 * @example const StyledComponent = styled.div<ThemeProp>`
 *   color: ${props => props.theme.colors.brand.primary};
 * `;
 */
export interface ThemeProp {
  theme: AustaTheme;
}

/**
 * Utility type for theme-aware props in styled components
 * @example const StyledComponent = styled.div<ThemeAwareProps<{ color: string }>>`
 *   color: ${props => props.color || props.theme.colors.brand.primary};
 * `;
 */
export type ThemeAwareProps<P = {}> = P & ThemeProp;

/**
 * Utility type for responsive props in styled components
 * @example const StyledComponent = styled.div<ResponsiveProps<{ fontSize: string }>>`
 *   font-size: ${props => props.fontSize?.xs || props.theme.typography.fontSize.md};
 *   ${props => props.theme.breakpoints.up('md')} {
 *     font-size: ${props => props.fontSize?.md || props.theme.typography.fontSize.lg};
 *   }
 * `;
 */
export type ResponsiveProps<P = {}> = {
  [K in keyof P]?: P[K] | {
    xs?: P[K];
    sm?: P[K];
    md?: P[K];
    lg?: P[K];
    xl?: P[K];
  };
};

/**
 * Utility type for theme-aware responsive props in styled components
 * Combines ThemeAwareProps and ResponsiveProps
 */
export type ThemeAwareResponsiveProps<P = {}> = ThemeAwareProps<ResponsiveProps<P>>;

/**
 * Utility function type for accessing theme values
 * Used for theme-aware style functions
 */
export type ThemeValueFn<T> = (theme: AustaTheme) => T;

/**
 * Utility type for theme-aware style functions
 * @example const getColor = (props: ThemeAwareProps): string => {
 *   return props.color || props.theme.colors.brand.primary;
 * };
 */
export type ThemeStyleFn<P = {}, R = string> = (props: ThemeAwareProps<P>) => R;

/**
 * Utility type for responsive theme-aware style functions
 * @example const getFontSize = (props: ThemeAwareResponsiveProps<{ fontSize: string }>): string => {
 *   return props.fontSize?.xs || props.theme.typography.fontSize.md;
 * };
 */
export type ResponsiveThemeStyleFn<P = {}, R = string> = (props: ThemeAwareResponsiveProps<P>) => R;