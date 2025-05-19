/**
 * Theme Types
 * 
 * This file defines the core Theme interface and related types used by the design system
 * and UI components throughout the AUSTA SuperApp. It establishes the fundamental structure
 * of theme objects, including color palettes, typography scales, spacing system, breakpoints,
 * and other design properties.
 * 
 * These interfaces serve as the foundation for journey-specific theme variations and ensure
 * consistent typing for theme consumers across both web and mobile platforms.
 */

import { ReactNode } from 'react';

/**
 * Color Palette
 * Defines the color system for the application with brand, journey-specific,
 * semantic, and neutral color scales.
 */
export interface ColorPalette {
  // Brand Colors
  brand: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // Journey-specific Colors
  journey: {
    health: {
      primary: string;
      secondary: string;
    };
    care: {
      primary: string;
      secondary: string;
    };
    plan: {
      primary: string;
      secondary: string;
    };
  };

  // Semantic Colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Neutral Colors
  neutral: {
    white: string;
    black: string;
    gray: {
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };

  // Opacity variants for colors
  opacity: {
    light: number;
    medium: number;
    high: number;
  };
}

/**
 * Typography Scale
 * Defines the typography system including font families, sizes, weights,
 * line heights, and letter spacing.
 */
export interface TypographyScale {
  // Font Families
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };

  // Font Sizes (in pixels)
  fontSize: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
    micro: number;
  };

  // Line Heights (unitless multipliers)
  lineHeight: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
    micro: number;
  };

  // Font Weights
  fontWeight: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };

  // Letter Spacing
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

/**
 * Spacing Scale
 * Implements an 8-point grid system for consistent layout spacing.
 */
export interface SpacingScale {
  // Base unit in pixels (typically 8)
  baseUnit: number;

  // Named spacing values
  xxs: number; // 4px (half base unit)
  xs: number;  // 8px (1x base unit)
  sm: number;  // 16px (2x base unit)
  md: number;  // 24px (3x base unit)
  lg: number;  // 32px (4x base unit)
  xl: number;  // 48px (6x base unit)
  xxl: number; // 64px (8x base unit)

  // Function to calculate custom spacing
  // This is a placeholder for the actual implementation
  // which would be provided by the theme object
  calc: (multiplier: number) => number;
}

/**
 * Breakpoints
 * Defines responsive breakpoints for adapting layouts across device sizes.
 */
export interface Breakpoints {
  xs: number; // 0px
  sm: number; // 576px
  md: number; // 768px
  lg: number; // 992px
  xl: number; // 1200px

  // Function to generate media queries
  // This is a placeholder for the actual implementation
  // which would be provided by the theme object
  up: (breakpoint: keyof Omit<Breakpoints, 'up' | 'down' | 'between'>) => string;
  down: (breakpoint: keyof Omit<Breakpoints, 'up' | 'down' | 'between'>) => string;
  between: (start: keyof Omit<Breakpoints, 'up' | 'down' | 'between'>, end: keyof Omit<Breakpoints, 'up' | 'down' | 'between'>) => string;
}

/**
 * Shadow Scale
 * Provides elevation tokens with precise RGBA values for shadows.
 */
export interface ShadowScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Animation Scale
 * Defines standardized animation durations and easing curves.
 */
export interface AnimationScale {
  duration: {
    fast: number; // 150ms
    normal: number; // 300ms
    slow: number; // 500ms
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    linear: string;
  };
}

/**
 * Border Scale
 * Defines border widths, radii, and styles.
 */
export interface BorderScale {
  width: {
    thin: number;
    normal: number;
    thick: number;
  };
  radius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    pill: number;
    circle: string;
  };
  style: {
    solid: string;
    dashed: string;
    dotted: string;
  };
}

/**
 * Z-Index Scale
 * Defines z-index values for layering elements.
 */
export interface ZIndexScale {
  base: number;
  elevated: number;
  dropdown: number;
  sticky: number;
  drawer: number;
  modal: number;
  popover: number;
  toast: number;
  tooltip: number;
}

/**
 * Core Theme Interface
 * Consolidates all design tokens into a comprehensive theme object.
 */
export interface Theme {
  name: string;
  type: 'light' | 'dark';
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  breakpoints: Breakpoints;
  shadows: ShadowScale;
  animation: AnimationScale;
  borders: BorderScale;
  zIndex: ZIndexScale;

  // Journey-specific theme indicator
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Theme Context Interface
 * Defines the shape of the React context for theme management.
 */
export interface ThemeContextType {
  theme: Theme;
  setTheme?: (theme: Theme) => void;
  toggleTheme?: () => void;
}

/**
 * Theme Provider Props
 * Props for the theme provider component.
 */
export interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

/**
 * Utility Types for Styled Components
 */

/**
 * ThemeProps
 * Helper type for components that receive the theme via props.
 */
export type ThemeProps = {
  theme: Theme;
};

/**
 * WithTheme
 * Higher-order type to add theme prop to a component's props.
 */
export type WithTheme<P> = P & ThemeProps;

/**
 * Themed
 * Utility type for creating theme-aware props.
 */
export type Themed<P> = (props: WithTheme<P>) => any;

/**
 * ResponsiveValue
 * Utility type for responsive prop values based on breakpoints.
 */
export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

/**
 * ColorToken
 * Utility type for accessing color values from the theme.
 * Allows dot notation path to any color in the theme.
 */
export type ColorToken = 
  | 'brand.primary'
  | 'brand.secondary'
  | 'brand.tertiary'
  | 'journey.health.primary'
  | 'journey.health.secondary'
  | 'journey.care.primary'
  | 'journey.care.secondary'
  | 'journey.plan.primary'
  | 'journey.plan.secondary'
  | 'semantic.success'
  | 'semantic.warning'
  | 'semantic.error'
  | 'semantic.info'
  | 'neutral.white'
  | 'neutral.black'
  | `neutral.gray.${100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`;

/**
 * SpacingToken
 * Utility type for accessing spacing values from the theme.
 */
export type SpacingToken = keyof Omit<SpacingScale, 'baseUnit' | 'calc'>;

/**
 * FontSizeToken
 * Utility type for accessing font size values from the theme.
 */
export type FontSizeToken = keyof TypographyScale['fontSize'];

/**
 * FontWeightToken
 * Utility type for accessing font weight values from the theme.
 */
export type FontWeightToken = keyof TypographyScale['fontWeight'];

/**
 * LineHeightToken
 * Utility type for accessing line height values from the theme.
 */
export type LineHeightToken = keyof TypographyScale['lineHeight'];

/**
 * BorderRadiusToken
 * Utility type for accessing border radius values from the theme.
 */
export type BorderRadiusToken = keyof BorderScale['radius'];

/**
 * ShadowToken
 * Utility type for accessing shadow values from the theme.
 */
export type ShadowToken = keyof ShadowScale;

/**
 * ZIndexToken
 * Utility type for accessing z-index values from the theme.
 */
export type ZIndexToken = keyof ZIndexScale;