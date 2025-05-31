/**
 * Shadow tokens for the AUSTA SuperApp design system
 * 
 * These shadow styles provide consistent elevation and depth across the application,
 * with each level representing a different elevation from the surface.
 * 
 * - sm: Subtle shadows for slightly elevated components (cards, buttons)
 * - md: Medium shadows for floating elements (dropdowns, popovers)
 * - lg: Large shadows for modal dialogs and prominent UI elements
 * - xl: Extra large shadows for elements that need maximum elevation
 *
 * @accessibility Shadows should be combined with borders or outlines for elements
 * that need to maintain visibility in high-contrast mode or when shadows are disabled.
 */

import { Platform } from 'react-native';

/**
 * Shadow token interface for web platform (CSS box-shadow)
 */
export interface WebShadowToken {
  boxShadow: string;
}

/**
 * Shadow token interface for React Native platform
 */
export interface NativeShadowToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation?: number; // Android-specific
}

/**
 * Combined shadow token interface for cross-platform usage
 */
export interface ShadowToken {
  web: WebShadowToken;
  native: NativeShadowToken;
}

/**
 * Shadow intensity configuration for light/dark themes
 */
export interface ShadowIntensity {
  light: {
    opacity: number;
    color: string;
  };
  dark: {
    opacity: number;
    color: string;
  };
}

// Default shadow intensity configuration
const defaultIntensity: ShadowIntensity = {
  light: {
    opacity: 1,
    color: 'rgba(0, 0, 0, %opacity%)'
  },
  dark: {
    opacity: 0.85, // Slightly reduced opacity for dark mode
    color: 'rgba(0, 0, 0, %opacity%)'
  }
};

/**
 * Creates a shadow token with platform-specific implementations
 */
const createShadowToken = (
  elevation: number,
  offsetY: number,
  blurRadius: number,
  spreadRadius: number,
  opacity: number,
  intensity: ShadowIntensity = defaultIntensity
): ShadowToken => {
  // Calculate opacities for light/dark modes
  const lightOpacity = opacity * intensity.light.opacity;
  const darkOpacity = opacity * intensity.dark.opacity;
  
  // Create color strings with correct opacity values
  const lightColor = intensity.light.color.replace('%opacity%', lightOpacity.toString());
  const darkColor = intensity.dark.color.replace('%opacity%', darkOpacity.toString());
  
  return {
    web: {
      boxShadow: `0 ${offsetY}px ${blurRadius}px ${spreadRadius > 0 ? spreadRadius + 'px ' : ''}${lightColor}`,
    },
    native: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blurRadius / 2, // React Native shadow radius is approximately half of CSS blur radius
      ...(Platform.OS === 'android' ? { elevation } : {}),
    },
  };
};

/**
 * Shadow tokens with platform-specific implementations
 */
export const shadows = {
  /**
   * Small shadow - subtle elevation (1px)
   * Used for buttons, cards, and other slightly elevated components
   */
  sm: createShadowToken(1, 1, 2, 0, 0.05),

  /**
   * Medium shadow - moderate elevation (4px)
   * Used for dropdowns, popovers, and components that float above the interface
   */
  md: createShadowToken(4, 4, 6, 1, 0.1),

  /**
   * Large shadow - significant elevation (10px)
   * Used for modal dialogs, sidebars, and other prominent UI elements
   */
  lg: createShadowToken(10, 10, 15, 2, 0.1),

  /**
   * Extra large shadow - maximum elevation (20px)
   * Used for onboarding spotlights, notifications, and elements requiring maximum emphasis
   */
  xl: createShadowToken(20, 20, 25, 3, 0.15),
};

/**
 * Helper function to get platform-specific shadow styles
 * 
 * @example
 * // In a styled-component
 * const StyledCard = styled.div`
 *   ${getShadow(shadows.md)}
 * `;
 * 
 * // In a React Native component
 * const styles = StyleSheet.create({
 *   card: {
 *     ...getShadow(shadows.md)
 *   }
 * });
 */
export const getShadow = (shadowToken: ShadowToken): WebShadowToken | NativeShadowToken => {
  return Platform.OS === 'web' ? shadowToken.web : shadowToken.native;
};

/**
 * Creates a shadow with custom intensity for light/dark themes
 * 
 * @example
 * // Create a custom shadow with higher intensity for dark mode
 * const customIntensity = {
 *   light: { opacity: 1, color: 'rgba(0, 0, 0, %opacity%)' },
 *   dark: { opacity: 1.2, color: 'rgba(0, 0, 0, %opacity%)' }
 * };
 * 
 * const customShadow = createCustomShadow(shadows.md, customIntensity);
 */
export const createCustomShadow = (
  baseShadow: keyof typeof shadows,
  intensity: ShadowIntensity
): ShadowToken => {
  const shadow = shadows[baseShadow];
  const baseElevation = baseShadow === 'sm' ? 1 : baseShadow === 'md' ? 4 : baseShadow === 'lg' ? 10 : 20;
  const baseOffsetY = baseElevation;
  const baseBlurRadius = baseShadow === 'sm' ? 2 : baseShadow === 'md' ? 6 : baseShadow === 'lg' ? 15 : 25;
  const baseSpreadRadius = baseShadow === 'sm' ? 0 : baseShadow === 'md' ? 1 : baseShadow === 'lg' ? 2 : 3;
  const baseOpacity = baseShadow === 'sm' ? 0.05 : baseShadow === 'md' ? 0.1 : baseShadow === 'lg' ? 0.1 : 0.15;
  
  return createShadowToken(
    baseElevation,
    baseOffsetY,
    baseBlurRadius,
    baseSpreadRadius,
    baseOpacity,
    intensity
  );
};

export default shadows;