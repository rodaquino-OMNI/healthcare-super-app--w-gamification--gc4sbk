/**
 * Design Token Type Definitions
 * 
 * This file defines TypeScript interfaces for all design tokens in the AUSTA SuperApp design system.
 * These interfaces establish the atomic design elements and ensure proper typing for theme objects
 * and style functions. The token interfaces define the valid values for theme properties and
 * component styles, creating a controlled vocabulary for the design system.
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
 * Alpha Color Scale Interface
 * Defines colors with alpha transparency values
 */
export interface AlphaColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Semantic Color Interface
 * Defines colors with semantic meaning (success, error, warning, info)
 */
export interface SemanticColors {
  success: ColorScale;
  error: ColorScale;
  warning: ColorScale;
  info: ColorScale;
}

/**
 * Journey Color Interface
 * Defines colors specific to each journey
 */
export interface JourneyColors {
  health: ColorScale; // Green-based palette
  care: ColorScale;   // Orange-based palette
  plan: ColorScale;   // Blue-based palette
}

/**
 * Brand Color Interface
 * Defines the brand color palette
 */
export interface BrandColors {
  primary: ColorScale;
  secondary: ColorScale;
  tertiary: ColorScale;
}

/**
 * Neutral Color Interface
 * Defines grayscale colors from white to black
 */
export interface NeutralColors {
  white: string;
  black: string;
  gray: ColorScale;
}

/**
 * Color Tokens Interface
 * Comprehensive collection of all color tokens
 */
export interface ColorTokens {
  brand: BrandColors;
  journey: JourneyColors;
  semantic: SemanticColors;
  neutral: NeutralColors;
  alpha: {
    black: AlphaColorScale;
    white: AlphaColorScale;
  };
}

/**
 * Font Family Interface
 * Defines available font families
 */
export interface FontFamilyTokens {
  heading: string;
  body: string;
  mono: string;
}

/**
 * Font Size Interface
 * Defines available font sizes using the t-shirt size scale
 */
export interface FontSizeTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

/**
 * Font Weight Interface
 * Defines available font weights
 */
export interface FontWeightTokens {
  thin: number;
  extralight: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  black: number;
}

/**
 * Line Height Interface
 * Defines available line heights
 */
export interface LineHeightTokens {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

/**
 * Letter Spacing Interface
 * Defines available letter spacing values
 */
export interface LetterSpacingTokens {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

/**
 * Typography Tokens Interface
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
 * Spacing Tokens Interface
 * Defines spacing values based on 8-point grid system
 */
export interface SpacingTokens {
  0: string; // 0px
  0.5: string; // 2px
  1: string; // 4px
  1.5: string; // 6px
  2: string; // 8px
  2.5: string; // 10px
  3: string; // 12px
  3.5: string; // 14px
  4: string; // 16px
  5: string; // 20px
  6: string; // 24px
  7: string; // 28px
  8: string; // 32px
  9: string; // 36px
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
 * Border Width Tokens Interface
 * Defines available border widths
 */
export interface BorderWidthTokens {
  none: string;
  thin: string;
  normal: string;
  thick: string;
  heavy: string;
}

/**
 * Border Style Tokens Interface
 * Defines available border styles
 */
export interface BorderStyleTokens {
  none: string;
  solid: string;
  dashed: string;
  dotted: string;
}

/**
 * Border Radius Tokens Interface
 * Defines available border radius values
 */
export interface BorderRadiusTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

/**
 * Border Tokens Interface
 * Comprehensive collection of all border tokens
 */
export interface BorderTokens {
  width: BorderWidthTokens;
  style: BorderStyleTokens;
  radius: BorderRadiusTokens;
}

/**
 * Shadow Tokens Interface
 * Defines elevation shadows with precise RGBA values
 */
export interface ShadowTokens {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

/**
 * Animation Duration Tokens Interface
 * Defines standardized animation durations
 */
export interface AnimationDurationTokens {
  fastest: string;
  faster: string;
  fast: string;
  normal: string;
  slow: string;
  slower: string;
  slowest: string;
}

/**
 * Animation Easing Tokens Interface
 * Defines standardized animation easing curves
 */
export interface AnimationEasingTokens {
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  linear: string;
  bounce: string;
}

/**
 * Animation Tokens Interface
 * Comprehensive collection of all animation tokens
 */
export interface AnimationTokens {
  duration: AnimationDurationTokens;
  easing: AnimationEasingTokens;
}

/**
 * Breakpoint Tokens Interface
 * Defines responsive breakpoints for adapting layouts across device sizes
 */
export interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

/**
 * Z-Index Tokens Interface
 * Defines z-index values for controlling element stacking
 */
export interface ZIndexTokens {
  hide: number;
  base: number;
  raised: number;
  dropdown: number;
  sticky: number;
  overlay: number;
  modal: number;
  popover: number;
  toast: number;
  tooltip: number;
}

/**
 * Opacity Tokens Interface
 * Defines opacity values
 */
export interface OpacityTokens {
  0: string;
  5: string;
  10: string;
  20: string;
  25: string;
  30: string;
  40: string;
  50: string;
  60: string;
  70: string;
  75: string;
  80: string;
  90: string;
  95: string;
  100: string;
}

/**
 * Semantic Token Names
 * Defines semantic names for tokens that have theme-aware meanings
 */
export interface SemanticTokenNames {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgInverse: string;
  bgHighlight: string;
  bgDisabled: string;
  bgSuccess: string;
  bgError: string;
  bgWarning: string;
  bgInfo: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textDisabled: string;
  textSuccess: string;
  textError: string;
  textWarning: string;
  textInfo: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderTertiary: string;
  borderInverse: string;
  borderHighlight: string;
  borderDisabled: string;
  borderSuccess: string;
  borderError: string;
  borderWarning: string;
  borderInfo: string;
  
  // Journey-specific colors
  journeyHealth: string;
  journeyCare: string;
  journeyPlan: string;
}

/**
 * Responsive Token Interface
 * Defines a token that can have different values at different breakpoints
 */
export interface ResponsiveToken<T> {
  base: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

/**
 * Design Tokens Interface
 * Comprehensive collection of all design tokens
 */
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  borders: BorderTokens;
  shadows: ShadowTokens;
  animation: AnimationTokens;
  breakpoints: BreakpointTokens;
  zIndices: ZIndexTokens;
  opacity: OpacityTokens;
}

/**
 * Theme Interface
 * Defines the structure of a theme object that applies design tokens
 */
export interface Theme extends DesignTokens {
  name: string;
  semantic: SemanticTokenNames;
}

/**
 * Journey Theme Interface
 * Extends the base theme with journey-specific properties
 */
export interface JourneyTheme extends Theme {
  journey: 'health' | 'care' | 'plan';
  accentColor: string;
}