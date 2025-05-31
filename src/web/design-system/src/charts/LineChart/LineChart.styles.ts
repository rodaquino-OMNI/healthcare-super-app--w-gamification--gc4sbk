/**
 * Styling for the LineChart component
 * 
 * This file defines the CSS-in-JS styling layer for the LineChart component using styled-components.
 * It exports ChartContainer and ChartWrapper components that provide responsive, themed containers
 * with proper spacing, shadows, and layout properties.
 */

import styled from 'styled-components';
import { DesignTokens } from '@design-system/primitives';

// Type for the theme provided by styled-components
type ThemeType = { tokens: DesignTokens };

/**
 * Container for the chart with proper spacing, background, and elevation
 */
export const ChartContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }: { theme: ThemeType }) => theme.tokens.colors.neutral.white};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.tokens.spacing.md};
  box-shadow: ${({ theme }: { theme: ThemeType }) => theme.tokens.shadows.sm.web.boxShadow};
  padding: ${({ theme }: { theme: ThemeType }) => theme.tokens.spacing.md};
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.tokens.spacing.md};
  overflow: hidden;

  @media ${({ theme }: { theme: ThemeType }) => theme.tokens.mediaQueries.md} {
    padding: ${({ theme }: { theme: ThemeType }) => theme.tokens.spacing.lg};
  }
`;

/**
 * Wrapper for the chart content with responsive height and styling for chart elements
 */
export const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;

  @media ${({ theme }: { theme: ThemeType }) => theme.tokens.mediaQueries.md} {
    min-height: 250px;
  }

  @media ${({ theme }: { theme: ThemeType }) => theme.tokens.mediaQueries.lg} {
    min-height: 300px;
  }

  /* Ensure SVG fills the container */
  svg {
    width: 100%;
    height: 100%;
  }

  /* Style for the chart lines */
  .chart-line {
    stroke-width: 2px;
    fill: none;
  }

  /* Style for the data points */
  .chart-point {
    fill: ${({ theme }: { theme: ThemeType }) => theme.tokens.colors.neutral.white};
    stroke-width: 2px;
    
    &:hover {
      r: 6;
    }
  }

  /* Style for the axis labels */
  .chart-axis {
    font-family: ${({ theme }: { theme: ThemeType }) => theme.tokens.typography.fontFamily};
    font-size: ${({ theme }: { theme: ThemeType }) => theme.tokens.typography.fontSize.sm};
    fill: ${({ theme }: { theme: ThemeType }) => theme.tokens.colors.neutral.gray600};
  }

  /* Style for the grid lines */
  .chart-grid {
    stroke: ${({ theme }: { theme: ThemeType }) => theme.tokens.colors.neutral.gray200};
    stroke-dasharray: 4;
    stroke-width: 1;
  }
`;