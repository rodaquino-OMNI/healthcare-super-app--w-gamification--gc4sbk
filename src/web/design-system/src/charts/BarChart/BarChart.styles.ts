import styled from 'styled-components';
import { colors, typography, breakpoints, animation } from '@design-system/primitives/tokens';

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
    if (props.journey) {
      // Use journey-specific colors from the primitives package
      return props.theme.colors?.journeys?.[props.journey]?.primary || 
        colors.journeys[props.journey].primary;
    }
    // Default to health journey green if no color is specified
    return colors.journeys.health.primary;
  }};
  margin: 0 5px;
  border-radius: 4px 4px 0 0;
  transition: height ${animation.duration.normal} ${animation.easing.easeInOut}, 
              background-color ${animation.duration.normal} ${animation.easing.easeInOut};
  
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
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.regular};
  color: ${props => props.theme.colors?.text?.secondary || colors.text.secondary};
  text-align: center;
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (min-width: ${breakpoints.md}) {
    font-size: ${typography.fontSize.sm};
  }
`;

/**
 * Label for the Y-axis
 * Used to display the measurement unit or value scale
 */
export const YAxisLabel = styled.div`
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.regular};
  color: ${props => props.theme.colors?.text?.secondary || colors.text.secondary};
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  margin-right: 8px;
  
  @media (min-width: ${breakpoints.md}) {
    font-size: ${typography.fontSize.sm};
  }
`;