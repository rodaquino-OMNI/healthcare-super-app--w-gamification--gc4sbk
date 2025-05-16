/**
 * @file Theme Interfaces Package Entry Point
 * 
 * This file serves as the central export point for all theme-related interfaces
 * in the AUSTA SuperApp. It provides a consolidated entry point for importing
 * any theme interfaces throughout the application, simplifying import statements
 * and improving code organization.
 * 
 * The theme interfaces define the contract between UI components and the theming
 * system, ensuring consistent typing across both web (Next.js) and mobile
 * (React Native) platforms.
 * 
 * @module @austa/interfaces/themes
 */

// Core theme interfaces
export type { 
  Theme,
  ThemeContext,
  ThemeProviderProps,
  ThemeMode,
  ThemeName,
  UseThemeResult
} from './theme.types';

// Design token interfaces
export type {
  ColorTokens,
  SpacingTokens,
  TypographyTokens,
  BorderTokens,
  ShadowTokens,
  ZIndexTokens,
  OpacityTokens,
  RadiiTokens,
  TransitionTokens,
  BreakpointTokens,
  MediaQueryTokens
} from './tokens.types';

// Style prop interfaces
export type {
  SpacingProps,
  LayoutProps,
  TypographyProps,
  ColorProps,
  BorderProps,
  ShadowProps,
  PositionProps,
  FlexboxProps,
  GridProps,
  ResponsiveValue,
  PseudoProps,
  VariantProps,
  StyleProps
} from './style-props.types';

// Journey-specific theme interfaces
export type {
  HealthTheme,
  CareTheme,
  PlanTheme,
  JourneyTheme,
  JourneyThemeProviderProps
} from './journey-themes.types';