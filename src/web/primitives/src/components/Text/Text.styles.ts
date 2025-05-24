import styled, { css } from 'styled-components';
import { typography } from '../../../tokens/typography';
import { colors } from '../../../tokens/colors';

/**
 * Interface for Text component style props
 * These props are used by the StyledText component to apply styling
 */
export interface TextStyleProps {
  /**
   * Font family to use (from design system or custom value)
   */
  fontFamily?: string;
  
  /**
   * Font size to use (from design system or custom value)
   */
  fontSize?: string;
  
  /**
   * Font weight to use (from design system or custom value)
   */
  fontWeight?: string;
  
  /**
   * Line height to use (from design system or custom value)
   */
  lineHeight?: string;
  
  /**
   * Text color to use (from design system or custom value)
   */
  color?: string;
  
  /**
   * Text alignment (left, right, center, justify)
   */
  textAlign?: string;
  
  /**
   * Journey identifier for journey-specific theming
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Determines if text should be truncated with ellipsis when overflowing
   */
  truncate?: boolean;
  
  /**
   * Determines if text should be italic
   */
  italic?: boolean;
  
  /**
   * Determines if text should be underlined
   */
  underline?: boolean;
  
  /**
   * Determines if text should have a strike-through
   */
  strikeThrough?: boolean;
  
  /**
   * Determines if text should be uppercase
   */
  uppercase?: boolean;
}

/**
 * Resolves typography token values based on provided token name
 * @param category - The typography category (fontSize, fontWeight, etc.)
 * @param value - The token name or custom value
 * @param defaultValue - The default token to use if value is undefined
 * @returns The resolved typography value
 */
const getTypographyToken = <T extends Record<string, any>>(
  category: T,
  value: string | undefined,
  defaultValue: keyof T
): string | number => {
  if (value === undefined) {
    return category[defaultValue];
  }
  
  if (value in category) {
    return category[value as keyof T];
  }
  
  return value;
};

/**
 * Gets the appropriate text color based on props
 * @param props - The component props containing color and journey
 * @returns The resolved text color
 */
const getTextColor = (props: Pick<TextStyleProps, 'color' | 'journey'>): string => {
  if (props.color) {
    return props.color;
  }
  
  if (props.journey && props.journey in colors.journeys) {
    return colors.journeys[props.journey].text;
  }
  
  return colors.neutral.gray900;
};

/**
 * StyledText component that applies typography styling based on props
 * This is the base styled component used by the Text component
 */
export const StyledText = styled.span<TextStyleProps>`
  /* Font styles */
  font-family: ${props => getTypographyToken(typography.fontFamily, props.fontFamily, 'base')};
  font-size: ${props => getTypographyToken(typography.fontSize, props.fontSize, 'md')};
  font-weight: ${props => getTypographyToken(typography.fontWeight, props.fontWeight, 'regular')};
  line-height: ${props => getTypographyToken(typography.lineHeight, props.lineHeight, 'base')};
  
  /* Text color */
  color: ${props => getTextColor(props)};
  
  /* Text alignment */
  text-align: ${props => props.textAlign || 'left'};
  
  /* Text truncation */
  ${props => props.truncate && css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  
  /* Text decoration */
  ${props => props.italic && css`font-style: italic;`}
  ${props => props.underline && css`text-decoration: underline;`}
  ${props => props.strikeThrough && css`text-decoration: line-through;`}
  ${props => props.uppercase && css`text-transform: uppercase;`}
  
  /* Ensure smooth font rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Responsive font sizing based on viewport */
  @media (min-width: 768px) {
    font-size: ${props => {
      const size = getTypographyToken(typography.fontSize, props.fontSize, 'md');
      if (typeof size === 'string' && size.endsWith('px')) {
        const numericSize = parseFloat(size);
        const scaleFactor = typography.responsiveScaling.tablet;
        return `${numericSize * scaleFactor}px`;
      }
      return size;
    }};
  }
  
  @media (min-width: 1200px) {
    font-size: ${props => {
      const size = getTypographyToken(typography.fontSize, props.fontSize, 'md');
      if (typeof size === 'string' && size.endsWith('px')) {
        const numericSize = parseFloat(size);
        const scaleFactor = typography.responsiveScaling.desktop;
        return `${numericSize * scaleFactor}px`;
      }
      return size;
    }};
  }
`;