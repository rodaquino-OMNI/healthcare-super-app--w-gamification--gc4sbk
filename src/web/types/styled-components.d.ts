/**
 * Declaration file for styled-components theme types
 * 
 * This file extends the default theme interface from styled-components
 * to integrate with the AUSTA SuperApp design system's theming architecture.
 * It imports theme types from @design-system/primitives and @austa/interfaces
 * to provide strongly-typed theme access in styled-components.
 */

import 'styled-components';
import { ColorTokens } from '@design-system/primitives/src/tokens/colors';
import { SpacingTokens } from '@design-system/primitives/src/tokens/spacing';
import { TypographyTokens } from '@design-system/primitives/src/tokens/typography';
import { BreakpointTokens } from '@design-system/primitives/src/tokens/breakpoints';
import { ShadowTokens } from '@design-system/primitives/src/tokens/shadows';
import { AnimationTokens } from '@design-system/primitives/src/tokens/animation';
import { Theme } from '@austa/interfaces/themes/theme.types';
import { HealthTheme } from '@austa/interfaces/themes/journey-themes.types';
import { CareTheme } from '@austa/interfaces/themes/journey-themes.types';
import { PlanTheme } from '@austa/interfaces/themes/journey-themes.types';

/**
 * Module augmentation for styled-components
 * 
 * This extends the DefaultTheme interface from styled-components to include
 * all theme properties from the AUSTA SuperApp design system.
 */
declare module 'styled-components' {
  /**
   * DefaultTheme interface extension
   * 
   * Extends the default theme interface from styled-components with the
   * AUSTA SuperApp theme properties, including colors, typography, spacing,
   * and journey-specific tokens.
   */
  export interface DefaultTheme extends Theme {
    /**
     * Color tokens for the theme
     */
    colors: ColorTokens;

    /**
     * Typography tokens for the theme
     */
    typography: TypographyTokens;

    /**
     * Spacing tokens for the theme
     */
    spacing: SpacingTokens;

    /**
     * Breakpoint tokens for the theme
     */
    breakpoints: BreakpointTokens;

    /**
     * Shadow tokens for the theme
     */
    shadows: ShadowTokens;

    /**
     * Animation tokens for the theme
     */
    animation: AnimationTokens;

    /**
     * Journey-specific theme properties
     * 
     * These properties are only available when using a journey-specific theme
     * through the ThemeProvider context.
     */
    health?: HealthTheme;
    care?: CareTheme;
    plan?: PlanTheme;

    /**
     * Current active journey
     * 
     * Indicates which journey is currently active in the application.
     * This is used to apply journey-specific styling to components.
     */
    activeJourney?: 'health' | 'care' | 'plan' | null;
  }
}