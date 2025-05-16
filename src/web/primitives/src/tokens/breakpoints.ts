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

import { Dimensions } from 'react-native';

/**
 * Breakpoint key type
 * Used for type-safe access to breakpoint values
 */
export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Orientation type for orientation-specific breakpoints
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Interface for numeric breakpoint values
 */
export interface BreakpointValues {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Interface for string breakpoint values with units
 */
export interface BreakpointStrings {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Interface for media query strings
 */
export interface MediaQueryStrings {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  portrait: string;
  landscape: string;
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
export const breakpoints: BreakpointStrings = {
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
 * `;
 * ```
 */
export const mediaQueries: MediaQueryStrings = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)'
};

/**
 * Media query strings for max-width queries
 * Useful for mobile-first design where you need to target smaller screens
 * 
 * Usage example with styled-components:
 * ```
 * const MobileComponent = styled.div`
 *   font-size: 18px; // Default for larger screens
 *   
 *   @media ${maxWidthQueries.sm} {
 *     font-size: 16px; // Override for smaller screens
 *   }
 * `;
 * ```
 */
export const maxWidthQueries: BreakpointStrings = {
  xs: `(max-width: ${breakpointValues.xs - 1}px)`,
  sm: `(max-width: ${breakpointValues.sm - 1}px)`,
  md: `(max-width: ${breakpointValues.md - 1}px)`,
  lg: `(max-width: ${breakpointValues.lg - 1}px)`,
  xl: `(max-width: ${breakpointValues.xl - 1}px)`
};

/**
 * Range media queries for targeting specific breakpoint ranges
 * 
 * Usage example with styled-components:
 * ```
 * const TabletComponent = styled.div`
 *   // This style only applies to tablet-sized screens
 *   @media ${rangeQueries.md} {
 *     padding: 24px;
 *   }
 * `;
 * ```
 */
export const rangeQueries: BreakpointStrings = {
  xs: `(max-width: ${breakpointValues.sm - 1}px)`,
  sm: `(min-width: ${breakpoints.xs}) and (max-width: ${breakpointValues.md - 1}px)`,
  md: `(min-width: ${breakpoints.md}) and (max-width: ${breakpointValues.lg - 1}px)`,
  lg: `(min-width: ${breakpoints.lg}) and (max-width: ${breakpointValues.xl - 1}px)`,
  xl: `(min-width: ${breakpoints.xl})`
};

/**
 * Helper function to get current viewport dimensions
 * Useful for dynamic layout calculations
 * 
 * @returns Object containing width and height of the current viewport
 */
export const getViewportDimensions = (): { width: number; height: number } => {
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  
  // React Native fallback
  return Dimensions.get('window');
};

/**
 * Helper function to determine if the current viewport matches a breakpoint
 * 
 * @param breakpoint - The breakpoint to check against
 * @returns Boolean indicating if the viewport width is at least the specified breakpoint
 * 
 * Usage example:
 * ```
 * const isDesktop = useCallback(() => matchesBreakpoint('lg'), []);
 * 
 * return (
 *   <div>
 *     {isDesktop() ? <DesktopComponent /> : <MobileComponent />}
 *   </div>
 * );
 * ```
 */
export const matchesBreakpoint = (breakpoint: BreakpointKey): boolean => {
  const { width } = getViewportDimensions();
  return width >= breakpointValues[breakpoint];
};

/**
 * Helper function to determine the current breakpoint based on viewport width
 * 
 * @returns The current breakpoint key
 * 
 * Usage example:
 * ```
 * const currentBreakpoint = getCurrentBreakpoint();
 * console.log(`Current device size: ${currentBreakpoint}`); // e.g. "Current device size: md"
 * ```
 */
export const getCurrentBreakpoint = (): BreakpointKey => {
  const { width } = getViewportDimensions();
  
  if (width >= breakpointValues.xl) return 'xl';
  if (width >= breakpointValues.lg) return 'lg';
  if (width >= breakpointValues.md) return 'md';
  if (width >= breakpointValues.sm) return 'sm';
  return 'xs';
};

/**
 * Helper function to determine the current orientation
 * 
 * @returns The current orientation ('portrait' or 'landscape')
 */
export const getCurrentOrientation = (): Orientation => {
  const { width, height } = getViewportDimensions();
  return width < height ? 'portrait' : 'landscape';
};

/**
 * React Native specific media query helpers
 * These functions help implement responsive design in React Native
 * 
 * Usage example:
 * ```
 * import { StyleSheet } from 'react-native';
 * import { isTablet, isLargePhone } from '@design-system/primitives';
 * 
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: isTablet() ? 24 : 16,
 *     flexDirection: isLargePhone() ? 'row' : 'column',
 *   }
 * });
 * ```
 */

/**
 * Checks if the current device is a small phone (xs breakpoint)
 */
export const isSmallPhone = (): boolean => {
  const { width } = getViewportDimensions();
  return width < breakpointValues.xs;
};

/**
 * Checks if the current device is a large phone (sm breakpoint)
 */
export const isLargePhone = (): boolean => {
  const { width } = getViewportDimensions();
  return width >= breakpointValues.xs && width < breakpointValues.md;
};

/**
 * Checks if the current device is a tablet (md breakpoint)
 */
export const isTablet = (): boolean => {
  const { width } = getViewportDimensions();
  return width >= breakpointValues.md && width < breakpointValues.lg;
};

/**
 * Checks if the current device is a desktop (lg or xl breakpoint)
 */
export const isDesktop = (): boolean => {
  const { width } = getViewportDimensions();
  return width >= breakpointValues.lg;
};

/**
 * Checks if the device is in portrait orientation
 */
export const isPortrait = (): boolean => {
  return getCurrentOrientation() === 'portrait';
};

/**
 * Checks if the device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  return getCurrentOrientation() === 'landscape';
};