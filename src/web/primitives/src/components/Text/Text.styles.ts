/**
 * Text component styles for the AUSTA SuperApp design system.
 * 
 * This file defines the styled-component for the Text primitive with configurable typography styling.
 * It provides all necessary typography styling with support for journey-specific theming and
 * accessibility features.
 * 
 * @packageDocumentation
 */

import styled from 'styled-components';
import { typography, colors, breakpoints, mediaQueries } from '../../../tokens';

/**
 * Defines the props interface for the StyledText component.
 * This interface provides all styling options for the Text component.
 * 
 * @remarks
 * In the future, this interface should be imported from @austa/interfaces package
 * once it's fully implemented.
 */
export interface TextStyleProps {
  /**
   * Font family for the text
   * @default typography.fontFamily.base
   */
  fontFamily?: string;
  
  /**
   * Font weight for the text
   * @default typography.fontWeight.regular
   */
  fontWeight?: number;
  
  /**
   * Font size for the text
   * @default typography.fontSize.md
   */
  fontSize?: string;
  
  /**
   * Line height for the text
   * @default typography.lineHeight.base
   */
  lineHeight?: number;
  
  /**
   * Letter spacing for the text
   * @default typography.letterSpacing.normal
   */
  letterSpacing?: string;
  
  /**
   * Text color
   * Can be a direct color value or 'journey' to use journey-specific primary color
   * Can also be 'journey.secondary', 'journey.accent', etc. to use specific journey colors
   * @default colors.neutral.gray900
   */
  color?: string;
  
  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right' | 'justify';
  
  /**
   * Journey context for theming
   * Corresponds to 'health', 'care', or 'plan'
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Whether to truncate text with ellipsis
   * @default false
   */
  truncate?: boolean;
  
  /**
   * Whether to apply responsive font sizing
   * @default false
   */
  responsive?: boolean;
  
  /**
   * Maximum number of lines before truncating with ellipsis
   * Only applies when truncate is true
   * @default 1
   */
  maxLines?: number;
  
  /**
   * Whether to apply bold styling
   * Shorthand for fontWeight={typography.fontWeight.bold}
   * @default false
   */
  bold?: boolean;
  
  /**
   * Whether to apply italic styling
   * @default false
   */
  italic?: boolean;
  
  /**
   * Text transform property
   * @default undefined
   */
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

/**
 * Helper function to calculate responsive font sizes based on breakpoint
 * @param size Original font size with unit
 * @param breakpoint Breakpoint name (sm, md, lg, xl)
 * @returns Calculated size with unit
 */
const calculateResponsiveSize = (size: string, breakpoint: 'sm' | 'md' | 'lg' | 'xl'): string => {
  // Extract numeric value and unit
  const matches = size.match(/^([\d.]+)(\w+)$/);
  if (!matches) return size;
  
  const [, valueStr, unit] = matches;
  const value = parseFloat(valueStr);
  
  // Apply scaling factor based on breakpoint
  let scaleFactor = 1;
  switch (breakpoint) {
    case 'sm':
      scaleFactor = typography.responsiveScaling.mobile;
      break;
    case 'md':
      scaleFactor = typography.responsiveScaling.tablet;
      break;
    case 'lg':
      scaleFactor = typography.responsiveScaling.desktop;
      break;
    case 'xl':
      scaleFactor = typography.responsiveScaling.large;
      break;
    default:
      scaleFactor = typography.responsiveScaling.base;
  }
  
  // Return new size with original unit
  return `${(value * scaleFactor).toFixed(2)}${unit}`;
};

/**
 * Helper function to resolve journey-specific colors
 * @param props Component props containing color and journey
 * @returns Resolved color value
 */
const resolveJourneyColor = (props: TextStyleProps): string => {
  if (!props.color) return colors.neutral.gray900;
  
  // If color doesn't reference journey, return it directly
  if (!props.color.includes('journey') || !props.journey) {
    return props.color;
  }
  
  // Handle 'journey' as shorthand for journey primary color
  if (props.color === 'journey') {
    return colors.journeys[props.journey].primary;
  }
  
  // Handle 'journey.property' format
  if (props.color.startsWith('journey.')) {
    const journeyProperty = props.color.split('.')[1];
    return colors.journeys[props.journey][journeyProperty] || colors.neutral.gray900;
  }
  
  return colors.neutral.gray900;
};

/**
 * Styled component for the Text primitive with configurable typography styling.
 * This component provides all necessary typography styling with support for
 * journey-specific theming and accessibility features.
 */
export const StyledText = styled.span<TextStyleProps>`
  /* Base typography styles */
  font-family: ${props => props.fontFamily || typography.fontFamily.base};
  font-weight: ${props => props.bold ? typography.fontWeight.bold : (props.fontWeight || typography.fontWeight.regular)};
  font-size: ${props => props.fontSize || typography.fontSize.md};
  line-height: ${props => props.lineHeight || typography.lineHeight.base};
  letter-spacing: ${props => props.letterSpacing || typography.letterSpacing.normal};
  
  /* Text styling */
  color: ${resolveJourneyColor};
  text-align: ${props => props.align || 'left'};
  font-style: ${props => props.italic ? 'italic' : 'normal'};
  text-transform: ${props => props.textTransform || 'none'};
  
  /* Truncation */
  ${props => props.truncate && `
    ${props.maxLines && props.maxLines > 1 ? `
      display: -webkit-box;
      -webkit-line-clamp: ${props.maxLines};
      -webkit-box-orient: vertical;
      overflow: hidden;
    ` : `
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}
  `}
  
  /* Responsive font sizing */
  ${props => props.responsive && `
    @media ${mediaQueries.sm} {
      font-size: ${props.fontSize ? calculateResponsiveSize(props.fontSize, 'sm') : calculateResponsiveSize(typography.fontSize.md, 'sm')};
    }
    @media ${mediaQueries.md} {
      font-size: ${props.fontSize ? calculateResponsiveSize(props.fontSize, 'md') : calculateResponsiveSize(typography.fontSize.md, 'md')};
    }
    @media ${mediaQueries.lg} {
      font-size: ${props.fontSize ? calculateResponsiveSize(props.fontSize, 'lg') : calculateResponsiveSize(typography.fontSize.md, 'lg')};
    }
    @media ${mediaQueries.xl} {
      font-size: ${props.fontSize ? calculateResponsiveSize(props.fontSize, 'xl') : calculateResponsiveSize(typography.fontSize.md, 'xl')};
    }
  `}
`;