/**
 * Type declarations for styled-components v6.1.8
 * 
 * This file extends the default theme interface from styled-components to integrate
 * with the AUSTA SuperApp design system's theming architecture. It imports theme types
 * from @design-system/primitives and @austa/interfaces to provide strongly-typed
 * theme access in styled-components.
 * 
 * The declaration file ensures that theme properties like colors, typography, spacing,
 * and journey-specific tokens are properly typed when accessed through the ThemeProvider
 * context. This enables autocomplete, type checking, and refactoring support for theme
 * values across the application.
 */

import { CSSProp } from 'styled-components';

import {
  ColorTokens,
  SpacingTokens,
  TypographyTokens,
  ShadowTokens,
  AnimationTokens,
  BreakpointTokens
} from '@design-system/primitives/tokens';

import {
  Theme,
  HealthTheme,
  CareTheme,
  PlanTheme
} from '@austa/interfaces/themes';

/**
 * Module augmentation for styled-components
 * 
 * This extends the DefaultTheme interface to include all theme properties
 * from our design system, ensuring proper typing when accessing theme values
 * through the ThemeProvider context.
 */
declare module 'styled-components' {
  /**
   * DefaultTheme interface extension
   * 
   * Extends the empty DefaultTheme interface from styled-components with our
   * application's theme structure, providing autocomplete and type checking
   * for theme properties in styled-components.
   */
  export interface DefaultTheme extends Theme {
    // Base design tokens
    colors: ColorTokens;
    spacing: SpacingTokens;
    typography: TypographyTokens;
    shadows: ShadowTokens;
    animation: AnimationTokens;
    breakpoints: BreakpointTokens;
    
    // Journey-specific theme extensions
    health?: HealthTheme;
    care?: CareTheme;
    plan?: PlanTheme;
    
    // Current active journey context
    activeJourney: 'health' | 'care' | 'plan' | 'none';
  }
}

/**
 * Module augmentation for React
 * 
 * This enables the use of the css prop with styled-components,
 * allowing for inline styling with full theme type support.
 */
declare module 'react' {
  interface DOMAttributes<T> {
    /**
     * The css prop lets you style elements with the full power of styled-components
     * directly in their JSX, without creating a separate component.
     * 
     * @example
     * <div css={`color: ${props => props.theme.colors.primary};`}>Styled content</div>
     */
    css?: CSSProp;
  }
}