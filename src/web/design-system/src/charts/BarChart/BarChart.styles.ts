import styled from 'styled-components';
import { colors, typography, breakpoints } from '@design-system/primitives/tokens';

/**
 * Main container for the BarChart component
 * Controls the overall dimensions and layout of the chart
 */
export const BarChartContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: ${props => props.theme.typography?.fontFamily?.base || typography.fontFamily.base};
`;

/**
 * Container for grouping bars together
 * Used in scenarios where multiple bars are shown side by side
 */
export const BarGroup = styled.div`
  display: flex;
  align-items: flex-end;
  height: 100%;
  margin: 0 5px;
  position: relative;
`;

/**
 * Individual bar element in the chart
 * The bar's height represents the data value
 */
export const Bar = styled.div<{ 
  height: string; 
  color?: string;
  journey?: 'health' | 'care' | 'plan';
}>`
  flex: 1;
  min-width: 20px;
  height: ${props => props.height};
  background-color: ${props => {
    if (props.color) return props.color;
    if (props.journey && props.theme.colors?.journeys?.[props.journey]?.primary) {
      return props.theme.colors.journeys[props.journey].primary;
    }
    // Use journey-specific color from primitives if theme is not available
    if (props.journey) {
      return colors.journeys[props.journey].primary;
    }
    // Default to health journey green if no color or journey is specified
    return colors.journeys.health.primary;
  }};
  margin: 0 5px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease, background-color 0.3s ease;
  
  &:hover {
    opacity: 0.8;
    cursor: pointer;
  }
`;

/**
 * Label for the X-axis
 * Used to display category names or time periods
 */
export const XAxisLabel = styled.div`
  font-size: ${props => props.theme.typography?.fontSize?.xs || typography.fontSize.xs};
  color: ${props => props.theme.colors?.text?.secondary || colors.neutral.gray600};
  text-align: center;
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (min-width: ${props => props.theme.breakpoints?.md || breakpoints.md}) {
    font-size: ${props => props.theme.typography?.fontSize?.sm || typography.fontSize.sm};
  }
`;

/**
 * Label for the Y-axis
 * Used to display the measurement unit or value scale
 */
export const YAxisLabel = styled.div`
  font-size: ${props => props.theme.typography?.fontSize?.xs || typography.fontSize.xs};
  color: ${props => props.theme.colors?.text?.secondary || colors.neutral.gray600};
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  margin-right: 8px;
  
  @media (min-width: ${props => props.theme.breakpoints?.md || breakpoints.md}) {
    font-size: ${props => props.theme.typography?.fontSize?.sm || typography.fontSize.sm};
  }
`;}}
]