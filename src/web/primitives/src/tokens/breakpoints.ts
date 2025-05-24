/**
 * Breakpoint tokens for the AUSTA SuperApp design system
 * 
 * These tokens define the responsive breakpoints used throughout the application
 * to ensure consistent behavior across different screen sizes and devices.
 * 
 * The breakpoint system follows these target devices:
 * - xs: Small phones (<576px)
 * - sm: Large phones (576px-767px)
 * - md: Tablets (768px-991px)
 * - lg: Small desktops/laptops (992px-1199px)
 * - xl: Large desktops (≥1200px)
 */

/**
 * Interface for breakpoint values without units
 * Used for calculations and when raw numbers are needed
 */
export interface BreakpointValues {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Interface for breakpoint values with px units
 * Used directly in CSS properties
 */
export interface Breakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Interface for media query strings
 * Used for responsive styling in CSS-in-JS libraries
 */
export interface MediaQueries {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  // Orientation-based breakpoints
  portrait: string;
  landscape: string;
  // Device-specific breakpoints
  mobile: string;
  tablet: string;
  desktop: string;
}

/**
 * Interface for React Native platform-specific breakpoint helpers
 * Used for conditional rendering based on screen dimensions
 */
export interface ReactNativeBreakpoints {
  isXs: (width: number) => boolean;
  isSm: (width: number) => boolean;
  isMd: (width: number) => boolean;
  isLg: (width: number) => boolean;
  isXl: (width: number) => boolean;
  isMobile: (width: number) => boolean;
  isTablet: (width: number) => boolean;
  isDesktop: (width: number) => boolean;
  isPortrait: (width: number, height: number) => boolean;
  isLandscape: (width: number, height: number) => boolean;
}

/**
 * Interface for viewport dimension helpers
 * Used for dynamic layout calculations
 */
export interface ViewportHelpers {
  getBreakpointFromWidth: (width: number) => keyof BreakpointValues;
  getNextBreakpoint: (breakpoint: keyof BreakpointValues) => keyof BreakpointValues | null;
  getPreviousBreakpoint: (breakpoint: keyof BreakpointValues) => keyof BreakpointValues | null;
  isWidthBetweenBreakpoints: (width: number, min: keyof BreakpointValues, max: keyof BreakpointValues) => boolean;
}

/**
 * Numerical values for breakpoints (without units)
 * These can be used in calculations or when raw numbers are needed
 */
export const breakpointValues: BreakpointValues = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1440
};

/**
 * String values for breakpoints (with px units)
 * These can be used directly in CSS properties
 */
export const breakpoints: Breakpoints = {
  xs: '576px',
  sm: '768px',
  md: '992px',
  lg: '1200px',
  xl: '1440px'
};

/**
 * Media query strings for responsive styling
 * 
 * Usage example with styled-components:
 * ```
 * const ResponsiveComponent = styled.div`
 *   font-size: 16px;
 *   
 *   @media ${mediaQueries.md} {
 *     font-size: 18px;
 *   }
 *   
 *   @media ${mediaQueries.lg} {
 *     font-size: 20px;
 *   }
 *   
 *   // Orientation-based styling
 *   @media ${mediaQueries.portrait} {
 *     flex-direction: column;
 *   }
 *   
 *   @media ${mediaQueries.landscape} {
 *     flex-direction: row;
 *   }
 *   
 *   // Device-specific styling
 *   @media ${mediaQueries.mobile} {
 *     padding: 8px;
 *   }
 *   
 *   @media ${mediaQueries.tablet} {
 *     padding: 16px;
 *   }
 *   
 *   @media ${mediaQueries.desktop} {
 *     padding: 24px;
 *   }
 * `;
 * ```
 */
export const mediaQueries: MediaQueries = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  // Orientation-based breakpoints
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  // Device-specific breakpoints
  mobile: `(max-width: ${breakpointValues.sm - 1}px)`,
  tablet: `(min-width: ${breakpoints.sm}) and (max-width: ${breakpointValues.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg})`
};

/**
 * React Native platform-specific breakpoint helpers
 * 
 * Usage example:
 * ```
 * import { Dimensions } from 'react-native';
 * import { reactNativeBreakpoints } from '@design-system/primitives';
 * 
 * const MyComponent = () => {
 *   const { width, height } = Dimensions.get('window');
 *   
 *   return (
 *     <View>
 *       {reactNativeBreakpoints.isTablet(width) && (
 *         <TabletLayout />
 *       )}
 *       {reactNativeBreakpoints.isMobile(width) && (
 *         <MobileLayout />
 *       )}
 *       {reactNativeBreakpoints.isPortrait(width, height) && (
 *         <PortraitContent />
 *       )}
 *     </View>
 *   );
 * };
 * ```
 */
export const reactNativeBreakpoints: ReactNativeBreakpoints = {
  isXs: (width: number) => width < breakpointValues.sm,
  isSm: (width: number) => width >= breakpointValues.sm && width < breakpointValues.md,
  isMd: (width: number) => width >= breakpointValues.md && width < breakpointValues.lg,
  isLg: (width: number) => width >= breakpointValues.lg && width < breakpointValues.xl,
  isXl: (width: number) => width >= breakpointValues.xl,
  isMobile: (width: number) => width < breakpointValues.sm,
  isTablet: (width: number) => width >= breakpointValues.sm && width < breakpointValues.lg,
  isDesktop: (width: number) => width >= breakpointValues.lg,
  isPortrait: (width: number, height: number) => height > width,
  isLandscape: (width: number, height: number) => width >= height
};

/**
 * Viewport dimension helpers for dynamic layout calculations
 * 
 * Usage example:
 * ```
 * import { useEffect, useState } from 'react';
 * import { viewportHelpers } from '@design-system/primitives';
 * 
 * const ResponsiveLayout = () => {
 *   const [windowWidth, setWindowWidth] = useState(window.innerWidth);
 *   const currentBreakpoint = viewportHelpers.getBreakpointFromWidth(windowWidth);
 *   
 *   useEffect(() => {
 *     const handleResize = () => setWindowWidth(window.innerWidth);
 *     window.addEventListener('resize', handleResize);
 *     return () => window.removeEventListener('resize', handleResize);
 *   }, []);
 *   
 *   return (
 *     <div>
 *       <p>Current breakpoint: {currentBreakpoint}</p>
 *       {viewportHelpers.isWidthBetweenBreakpoints(windowWidth, 'sm', 'lg') && (
 *         <p>This content only appears on tablet devices</p>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export const viewportHelpers: ViewportHelpers = {
  getBreakpointFromWidth: (width: number): keyof BreakpointValues => {
    if (width < breakpointValues.xs) return 'xs';
    if (width < breakpointValues.sm) return 'sm';
    if (width < breakpointValues.md) return 'md';
    if (width < breakpointValues.lg) return 'lg';
    return 'xl';
  },
  getNextBreakpoint: (breakpoint: keyof BreakpointValues): keyof BreakpointValues | null => {
    const breakpoints: Array<keyof BreakpointValues> = ['xs', 'sm', 'md', 'lg', 'xl'];
    const index = breakpoints.indexOf(breakpoint);
    return index < breakpoints.length - 1 ? breakpoints[index + 1] : null;
  },
  getPreviousBreakpoint: (breakpoint: keyof BreakpointValues): keyof BreakpointValues | null => {
    const breakpoints: Array<keyof BreakpointValues> = ['xs', 'sm', 'md', 'lg', 'xl'];
    const index = breakpoints.indexOf(breakpoint);
    return index > 0 ? breakpoints[index - 1] : null;
  },
  isWidthBetweenBreakpoints: (width: number, min: keyof BreakpointValues, max: keyof BreakpointValues): boolean => {
    const minValue = breakpointValues[min];
    const maxValue = breakpointValues[max];
    return width >= minValue && width < maxValue;
  }
};