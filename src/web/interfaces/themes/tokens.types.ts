/**
 * Design Token Type Definitions
 * 
 * This file defines TypeScript interfaces for all design tokens in the AUSTA SuperApp design system.
 * These interfaces establish the atomic design elements and ensure proper typing for theme objects
 * and style functions.
 * 
 * The token interfaces define the valid values for theme properties and component styles,
 * creating a controlled vocabulary for the design system.
 */

/**
 * Color Scale Interface
 * Defines the standard color scale with 10 steps from 50 to 900
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // Base color
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Brand Color Tokens
 * Primary brand colors used across the application
 */
export interface BrandColors {
  primary: ColorScale;
  secondary: ColorScale;
  tertiary: ColorScale;
}

/**
 * Journey-Specific Color Tokens
 * Colors specific to each journey in the application
 */
export interface JourneyColors {
  health: ColorScale; // Green-based palette
  care: ColorScale;   // Orange-based palette
  plan: ColorScale;   // Blue-based palette
}

/**
 * Semantic Color Tokens
 * Colors that convey specific meanings or states
 */
export interface SemanticColors {
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

/**
 * Neutral Color Tokens
 * Grayscale colors for text, backgrounds, and borders
 */
export interface NeutralColors {
  white: string;
  black: string;
  gray: ColorScale;
}

/**
 * All Color Tokens
 * Comprehensive collection of all color tokens
 */
export interface ColorTokens {
  brand: BrandColors;
  journey: JourneyColors;
  semantic: SemanticColors;
  neutral: NeutralColors;
}

/**
 * Semantic Color Aliases
 * Semantic names for colors that map to specific color tokens
 */
export interface SemanticColorAliases {
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;
  textLink: string;
  textSuccess: string;
  textWarning: string;
  textError: string;
  textInfo: string;
  
  // Background colors
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundSuccess: string;
  backgroundWarning: string;
  backgroundError: string;
  backgroundInfo: string;
  backgroundDisabled: string;
  backgroundOverlay: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderTertiary: string;
  borderFocus: string;
  borderSuccess: string;
  borderWarning: string;
  borderError: string;
  borderInfo: string;
  
  // Journey-specific colors
  healthPrimary: string;
  healthSecondary: string;
  carePrimary: string;
  careSecondary: string;
  planPrimary: string;
  planSecondary: string;
}

/**
 * Font Family Tokens
 * Defines available font families
 */
export interface FontFamilyTokens {
  base: string;       // Primary font family
  heading: string;    // Font for headings
  mono: string;       // Monospace font
  numeric: string;    // Font optimized for numbers
}

/**
 * Font Size Tokens
 * Defines available font sizes in pixels
 */
export interface FontSizeTokens {
  xs: string;  // Extra small (e.g., "12px")
  sm: string;  // Small (e.g., "14px")
  md: string;  // Medium (e.g., "16px")
  lg: string;  // Large (e.g., "18px")
  xl: string;  // Extra large (e.g., "20px")
  '2xl': string; // 2X large (e.g., "24px")
  '3xl': string; // 3X large (e.g., "30px")
  '4xl': string; // 4X large (e.g., "36px")
  '5xl': string; // 5X large (e.g., "48px")
  '6xl': string; // 6X large (e.g., "60px")
}

/**
 * Font Weight Tokens
 * Defines available font weights
 */
export interface FontWeightTokens {
  thin: number;       // 100
  extralight: number; // 200
  light: number;      // 300
  regular: number;    // 400
  medium: number;     // 500
  semibold: number;   // 600
  bold: number;       // 700
  extrabold: number;  // 800
  black: number;      // 900
}

/**
 * Line Height Tokens
 * Defines available line heights
 */
export interface LineHeightTokens {
  none: number;   // 1 (no additional line height)
  tight: number;  // 1.25
  snug: number;   // 1.375
  normal: number; // 1.5
  relaxed: number; // 1.625
  loose: number;  // 2
}

/**
 * Letter Spacing Tokens
 * Defines available letter spacing values
 */
export interface LetterSpacingTokens {
  tighter: string; // -0.05em
  tight: string;   // -0.025em
  normal: string;  // 0em
  wide: string;    // 0.025em
  wider: string;   // 0.05em
  widest: string;  // 0.1em
}

/**
 * Typography Tokens
 * Comprehensive collection of all typography tokens
 */
export interface TypographyTokens {
  fontFamily: FontFamilyTokens;
  fontSize: FontSizeTokens;
  fontWeight: FontWeightTokens;
  lineHeight: LineHeightTokens;
  letterSpacing: LetterSpacingTokens;
}

/**
 * Spacing Tokens
 * Defines available spacing values based on 8-point grid
 */
export interface SpacingTokens {
  0: string;  // 0px
  px: string; // 1px
  0.5: string; // 2px
  1: string;  // 4px
  1.5: string; // 6px
  2: string;  // 8px
  2.5: string; // 10px
  3: string;  // 12px
  3.5: string; // 14px
  4: string;  // 16px
  5: string;  // 20px
  6: string;  // 24px
  7: string;  // 28px
  8: string;  // 32px
  9: string;  // 36px
  10: string; // 40px
  12: string; // 48px
  14: string; // 56px
  16: string; // 64px
  20: string; // 80px
  24: string; // 96px
  28: string; // 112px
  32: string; // 128px
  36: string; // 144px
  40: string; // 160px
  44: string; // 176px
  48: string; // 192px
  52: string; // 208px
  56: string; // 224px
  60: string; // 240px
  64: string; // 256px
  72: string; // 288px
  80: string; // 320px
  96: string; // 384px
}

/**
 * Border Width Tokens
 * Defines available border widths
 */
export interface BorderWidthTokens {
  0: string;  // 0px
  1: string;  // 1px
  2: string;  // 2px
  4: string;  // 4px
  8: string;  // 8px
}

/**
 * Border Style Tokens
 * Defines available border styles
 */
export interface BorderStyleTokens {
  none: string;
  solid: string;
  dashed: string;
  dotted: string;
  double: string;
}

/**
 * Border Radius Tokens
 * Defines available border radius values
 */
export interface BorderRadiusTokens {
  none: string;   // 0px
  sm: string;     // 2px
  md: string;     // 4px
  lg: string;     // 8px
  xl: string;     // 12px
  '2xl': string;  // 16px
  '3xl': string;  // 24px
  full: string;   // 9999px (fully rounded)
}

/**
 * Border Tokens
 * Comprehensive collection of all border tokens
 */
export interface BorderTokens {
  width: BorderWidthTokens;
  style: BorderStyleTokens;
  radius: BorderRadiusTokens;
}

/**
 * Shadow Tokens
 * Defines available shadow values for elevation
 */
export interface ShadowTokens {
  none: string;
  xs: string;    // Extra small shadow
  sm: string;    // Small shadow
  md: string;    // Medium shadow
  lg: string;    // Large shadow
  xl: string;    // Extra large shadow
  '2xl': string; // 2X large shadow
  inner: string; // Inner shadow
}

/**
 * Animation Duration Tokens
 * Defines available animation durations in milliseconds
 */
export interface AnimationDurationTokens {
  fastest: string; // 100ms
  faster: string;  // 150ms
  fast: string;    // 200ms
  normal: string;  // 300ms
  slow: string;    // 400ms
  slower: string;  // 500ms
  slowest: string; // 700ms
}

/**
 * Animation Easing Tokens
 * Defines available animation easing functions
 */
export interface AnimationEasingTokens {
  linear: string;           // cubic-bezier(0, 0, 1, 1)
  easeIn: string;           // cubic-bezier(0.4, 0, 1, 1)
  easeOut: string;          // cubic-bezier(0, 0, 0.2, 1)
  easeInOut: string;        // cubic-bezier(0.4, 0, 0.2, 1)
  easeInBack: string;       // cubic-bezier(0.6, -0.28, 0.735, 0.045)
  easeOutBack: string;      // cubic-bezier(0.175, 0.885, 0.32, 1.275)
  easeInOutBack: string;    // cubic-bezier(0.68, -0.55, 0.265, 1.55)
}

/**
 * Animation Tokens
 * Comprehensive collection of all animation tokens
 */
export interface AnimationTokens {
  duration: AnimationDurationTokens;
  easing: AnimationEasingTokens;
}

/**
 * Breakpoint Tokens
 * Defines available breakpoints for responsive design
 */
export interface BreakpointTokens {
  xs: string;  // 320px
  sm: string;  // 576px
  md: string;  // 768px
  lg: string;  // 992px
  xl: string;  // 1200px
  '2xl': string; // 1400px
}

/**
 * Z-Index Tokens
 * Defines available z-index values for layering
 */
export interface ZIndexTokens {
  hide: number;    // -1 (below the content)
  base: number;    // 0 (default)
  raised: number;  // 1 (slightly raised)
  dropdown: number; // 1000 (dropdowns)
  sticky: number;  // 1100 (sticky elements)
  overlay: number; // 1200 (overlays)
  modal: number;   // 1300 (modals)
  popover: number; // 1400 (popovers/tooltips)
  toast: number;   // 1500 (toasts/notifications)
  highest: number; // 9999 (highest possible)
}

/**
 * Opacity Tokens
 * Defines available opacity values
 */
export interface OpacityTokens {
  0: string;   // 0
  5: string;   // 0.05
  10: string;  // 0.1
  20: string;  // 0.2
  25: string;  // 0.25
  30: string;  // 0.3
  40: string;  // 0.4
  50: string;  // 0.5
  60: string;  // 0.6
  70: string;  // 0.7
  75: string;  // 0.75
  80: string;  // 0.8
  90: string;  // 0.9
  95: string;  // 0.95
  100: string; // 1
}

/**
 * Responsive Token
 * Generic type for responsive token values
 */
export type ResponsiveToken<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
};

/**
 * All Design Tokens
 * Comprehensive collection of all design tokens
 */
export interface DesignTokens {
  colors: ColorTokens & SemanticColorAliases;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  borders: BorderTokens;
  shadows: ShadowTokens;
  animation: AnimationTokens;
  breakpoints: BreakpointTokens;
  zIndices: ZIndexTokens;
  opacity: OpacityTokens;
}