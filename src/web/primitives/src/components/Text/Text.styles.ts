/**
 * Text Component Styles
 * 
 * This file defines the styled component and interfaces for the Text primitive component,
 * which is a foundational element for typography in the AUSTA SuperApp design system.
 * 
 * The Text component supports:
 * - Journey-specific theming for the three distinct user journeys (health, care, plan)
 * - Responsive font sizing for different viewports
 * - Text truncation with ellipsis
 * - Comprehensive typography styling with design tokens
 * 
 * @packageDocumentation
 */

import styled from 'styled-components';
import { typography, colors, mediaQueries } from '../../tokens';

/**
 * Interface defining the props for the StyledText component
 * This interface ensures type safety for all text styling properties
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
   * Whether to apply text transformation
   * @default undefined
   */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';

  /**
   * Whether the text should be bold
   * This is a shorthand for fontWeight={typography.fontWeight.bold}
   * @default false
   */
  bold?: boolean;

  /**
   * Whether the text should be italic
   * @default false
   */
  italic?: boolean;
}

/**
 * Helper function to calculate responsive font sizes based on breakpoint
 * @param size Original font size with unit
 * @param breakpoint Breakpoint name (sm, md, lg)
 * @returns Calculated size with unit
 */
const calculateResponsiveSize = (size: string, breakpoint: string): string => {
  // Extract numeric value and unit
  const matches = size.match(/^([\d.]+)(\w+)$/);
  if (!matches) return size;
  
  const [, valueStr, unit] = matches;
  const value = parseFloat(valueStr);
  
  // Apply scaling factor based on breakpoint and typography.responsiveScaling
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
      scaleFactor = typography.responsiveScaling.largeDesktop;
      break;
    default:
      scaleFactor = 1;
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
  if (!props.color) {
    return colors.neutral.gray900;
  }

  // If journey is specified and color references journey
  if (props.journey) {
    // Direct journey color reference (e.g., 'journey')
    if (props.color === 'journey') {
      return colors.journeys[props.journey].primary;
    }
    
    // Specific journey property reference (e.g., 'journey.secondary')
    if (props.color.startsWith('journey.')) {
      const journeyProperty = props.color.split('.')[1];
      // Check if the property exists in the journey colors
      if (journeyProperty in colors.journeys[props.journey]) {
        return colors.journeys[props.journey][journeyProperty as keyof typeof colors.journeys[typeof props.journey]];
      }
      // Fallback to neutral color if property doesn't exist
      return colors.neutral.gray900;
    }
  }
  
  // Direct color value
  return props.color;
};

/**
 * Styled component for the Text primitive with configurable typography styling
 * This component provides all necessary typography styling with support for
 * journey-specific theming and accessibility features.
 */
export const StyledText = styled.span<TextStyleProps>`
  /* Base typography styling */
  font-family: ${props => props.fontFamily || typography.fontFamily.base};
  font-weight: ${props => props.bold ? typography.fontWeight.bold : (props.fontWeight || typography.fontWeight.regular)};
  font-size: ${props => props.fontSize || typography.fontSize.md};
  line-height: ${props => props.lineHeight || typography.lineHeight.base};
  letter-spacing: ${props => props.letterSpacing || typography.letterSpacing.normal};
  font-style: ${props => props.italic ? 'italic' : 'normal'};
  
  /* Color handling with journey-specific theming */
  color: ${resolveJourneyColor};
  
  /* Text alignment */
  text-align: ${props => props.align || 'left'};
  
  /* Text transformation */
  ${props => props.textTransform && `text-transform: ${props.textTransform};`}
  
  /* Text truncation */
  ${props => props.truncate && props.maxLines === 1 && `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  
  /* Multi-line truncation */
  ${props => props.truncate && props.maxLines && props.maxLines > 1 && `
    display: -webkit-box;
    -webkit-line-clamp: ${props.maxLines};
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  
  /* Responsive font sizing */
  ${props => props.responsive && `
    @media ${mediaQueries.xs} {
      font-size: ${props.fontSize ? calculateResponsiveSize(props.fontSize, 'sm') : calculateResponsiveSize(typography.fontSize.md, 'sm')};
    }
    @media ${mediaQueries.sm} {
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