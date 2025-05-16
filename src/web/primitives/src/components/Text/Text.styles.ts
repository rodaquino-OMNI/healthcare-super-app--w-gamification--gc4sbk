/**
 * Styled component implementation for the Text primitive.
 * 
 * This file defines the StyledText component and its TextStyleProps interface,
 * centralizing typography styling with support for design tokens, journey-specific
 * theming, responsive font sizing, and text truncation.
 */

import styled from 'styled-components';
import { Platform } from 'react-native';
import { typography } from '../../../tokens/typography';
import { colors } from '../../../tokens/colors';

/**
 * Props for styling the Text component
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
}

/**
 * Resolves typography token values based on provided token name
 */
export const getTypographyToken = <T extends Record<string, any>>(
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
 */
export const getTextColor = (props: Pick<TextStyleProps, 'color' | 'journey'>): string => {
  if (props.color) {
    return props.color;
  }
  
  if (props.journey && props.journey in colors.journeys) {
    return colors.journeys[props.journey].text;
  }
  
  return colors.neutral.gray900;
};

/**
 * Gets the appropriate font family based on platform and props
 */
export const getFontFamily = (props: Pick<TextStyleProps, 'fontFamily'>): string => {
  const isNative = typeof Platform !== 'undefined';
  const fontFamilyValue = getTypographyToken(typography.fontFamily, props.fontFamily, 'base');
  
  // For React Native, we need to handle font family differently
  if (isNative) {
    // Return just the font name without fallbacks for React Native
    return typeof fontFamilyValue === 'string' 
      ? fontFamilyValue.split(',')[0].trim().replace(/['"]*/g, '')
      : String(fontFamilyValue);
  }
  
  return String(fontFamilyValue);
};

/**
 * Gets the appropriate line height based on platform and props
 */
export const getLineHeight = (props: Pick<TextStyleProps, 'lineHeight'>): string | number => {
  const isNative = typeof Platform !== 'undefined';
  const lineHeightValue = getTypographyToken(typography.lineHeight, props.lineHeight, 'base');
  
  // For React Native, we need to return a unitless number
  if (isNative) {
    return typeof lineHeightValue === 'number' ? lineHeightValue : parseFloat(String(lineHeightValue));
  }
  
  // For web, we can return the value directly
  return lineHeightValue;
};

/**
 * StyledText component that handles all text styling
 */
export const StyledText = styled.span<TextStyleProps>`
  /* Font styles */
  font-family: ${props => getFontFamily(props)};
  font-size: ${props => getTypographyToken(typography.fontSize, props.fontSize, 'md')};
  font-weight: ${props => getTypographyToken(typography.fontWeight, props.fontWeight, 'regular')};
  line-height: ${props => getLineHeight(props)};
  
  /* Text color */
  color: ${props => getTextColor(props)};
  
  /* Text alignment */
  text-align: ${props => props.textAlign || 'left'};
  
  /* Text truncation */
  ${props => props.truncate && `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  
  /* Ensure smooth font rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;