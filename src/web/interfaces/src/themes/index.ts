/**
 * Theme interfaces for the design system
 */

/**
 * Color palette definition
 */
export interface ColorPalette {
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
 * Semantic colors for UI states
 */
export interface SemanticColors {
  primary: ColorPalette;
  secondary: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
  neutral: ColorPalette;
}

/**
 * Typography scale definition
 */
export interface TypographyScale {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

/**
 * Typography variants
 */
export interface Typography {
  h1: TypographyScale;
  h2: TypographyScale;
  h3: TypographyScale;
  h4: TypographyScale;
  h5: TypographyScale;
  h6: TypographyScale;
  subtitle1: TypographyScale;
  subtitle2: TypographyScale;
  body1: TypographyScale;
  body2: TypographyScale;
  button: TypographyScale;
  caption: TypographyScale;
  overline: TypographyScale;
}

/**
 * Spacing scale
 */
export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * Shadow levels
 */
export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Animation timing
 */
export interface Animation {
  fast: string;
  normal: string;
  slow: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
}

/**
 * Breakpoints for responsive design
 */
export interface Breakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Border radius values
 */
export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  pill: string;
  circle: string;
}

/**
 * Base theme interface
 */
export interface BaseTheme {
  colors: SemanticColors;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  animation: Animation;
  breakpoints: Breakpoints;
  borderRadius: BorderRadius;
}

/**
 * Journey-specific theme extensions
 */
export interface HealthTheme extends BaseTheme {
  journeyName: 'health';
  journeyColor: ColorPalette;
}

export interface CareTheme extends BaseTheme {
  journeyName: 'care';
  journeyColor: ColorPalette;
}

export interface PlanTheme extends BaseTheme {
  journeyName: 'plan';
  journeyColor: ColorPalette;
}

/**
 * Union type of all possible themes
 */
export type Theme = BaseTheme | HealthTheme | CareTheme | PlanTheme;

/**
 * Theme context interface
 */
export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}