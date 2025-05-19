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
 * @packageDocumentation
 */

/**
 * Interface for CSS shadow values used in web applications
 */
export interface CssShadowToken {
  /** Small shadow - subtle elevation (1px) */
  sm: string;
  /** Medium shadow - moderate elevation (4px) */
  md: string;
  /** Large shadow - significant elevation (10px) */
  lg: string;
  /** Extra large shadow - maximum elevation (20px) */
  xl: string;
}

/**
 * Interface for React Native shadow values
 * React Native requires separate shadow properties for iOS and Android
 */
export interface ReactNativeShadowToken {
  /** Small shadow - subtle elevation (1px) */
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  /** Medium shadow - moderate elevation (4px) */
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  /** Large shadow - significant elevation (10px) */
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  /** Extra large shadow - maximum elevation (20px) */
  xl: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/**
 * Interface for theme-aware shadow values
 * Allows for different shadow intensities based on theme (light/dark)
 */
export interface ThemeAwareShadowToken {
  /** Light theme shadows (higher opacity) */
  light: CssShadowToken;
  /** Dark theme shadows (lower opacity) */
  dark: CssShadowToken;
}

/**
 * Combined shadow token interface that includes all shadow token types
 * This is the main export type that should be used by the @austa/interfaces package
 */
export interface ShadowTokens {
  /** CSS shadow values for web applications */
  css: CssShadowToken;
  /** React Native shadow values for mobile applications */
  native: ReactNativeShadowToken;
  /** Theme-aware shadow values for dynamic theming */
  themed: ThemeAwareShadowToken;
}

/**
 * CSS shadow tokens for web applications
 * 
 * These shadow styles use the CSS box-shadow property with RGBA values
 * for consistent rendering across browsers.
 */
export const cssShadows: CssShadowToken = {
  /**
   * Small shadow - subtle elevation (1px)
   * Used for buttons, cards, and other slightly elevated components
   */
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',

  /**
   * Medium shadow - moderate elevation (4px)
   * Used for dropdowns, popovers, and components that float above the interface
   */
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',

  /**
   * Large shadow - significant elevation (10px)
   * Used for modal dialogs, sidebars, and other prominent UI elements
   */
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',

  /**
   * Extra large shadow - maximum elevation (20px)
   * Used for onboarding spotlights, notifications, and elements requiring maximum emphasis
   */
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
};

/**
 * React Native shadow tokens for mobile applications
 * 
 * These shadow styles use platform-specific properties:
 * - iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * - Android: elevation
 * 
 * Note: React Native handles shadows differently on iOS and Android.
 * These values are calibrated to provide consistent visual appearance across platforms.
 */
export const nativeShadows: ReactNativeShadowToken = {
  /**
   * Small shadow - subtle elevation (1px)
   * Used for buttons, cards, and other slightly elevated components
   */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  /**
   * Medium shadow - moderate elevation (4px)
   * Used for dropdowns, popovers, and components that float above the interface
   */
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  /**
   * Large shadow - significant elevation (10px)
   * Used for modal dialogs, sidebars, and other prominent UI elements
   */
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },

  /**
   * Extra large shadow - maximum elevation (20px)
   * Used for onboarding spotlights, notifications, and elements requiring maximum emphasis
   */
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 20,
  },
};

/**
 * Theme-aware shadow tokens for dynamic theming
 * 
 * These shadow styles adjust opacity based on theme:
 * - Light theme: Higher opacity for better visibility on light backgrounds
 * - Dark theme: Lower opacity to avoid harsh shadows on dark backgrounds
 */
export const themedShadows: ThemeAwareShadowToken = {
  light: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  dark: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.03)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.07)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Combined shadow tokens for the AUSTA SuperApp design system
 * 
 * This is the main export that includes all shadow token types:
 * - css: For web applications using CSS
 * - native: For mobile applications using React Native
 * - themed: For dynamic theming based on light/dark mode
 */
export const shadows: ShadowTokens = {
  css: cssShadows,
  native: nativeShadows,
  themed: themedShadows,
};

/**
 * Accessibility guidance for shadows
 * 
 * When using shadows to indicate elevation, consider the following:
 * 
 * 1. Always ensure sufficient contrast between elements with different elevations
 * 2. Don't rely solely on shadows to communicate important information
 * 3. Consider combining shadows with borders or outlines for better visibility
 * 4. For users with reduced vision or high contrast mode, provide alternative visual cues
 * 5. Test shadow visibility across different devices and lighting conditions
 */

/**
 * Default export for backwards compatibility
 * This maintains the same API as the original shadows implementation
 */
export default cssShadows;