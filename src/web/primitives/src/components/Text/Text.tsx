import React from 'react';
import { StyledText, TextStyleProps } from './Text.styles';

/**
 * Props for the Text component
 * Extends TextStyleProps from Text.styles.ts and adds additional props
 */
export interface TextProps extends TextStyleProps {
  /**
   * HTML element to render as
   */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'div';
  
  /**
   * Test ID for component testing
   */
  testID?: string;
  
  /**
   * Accessibility props
   */
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  'role'?: string;
  
  /**
   * Child elements (text content)
   */
  children: React.ReactNode;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  
  /**
   * Number of lines to show before truncating (for multiline truncation)
   * Only works on web platform
   */
  numberOfLines?: number;
}

/**
 * Text component for displaying text with consistent styling across the AUSTA SuperApp.
 * Provides support for design system typography tokens, responsiveness, and accessibility.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Text>Hello world</Text>
 * 
 * // With typography tokens
 * <Text fontSize="lg" fontWeight="bold">Large bold text</Text>
 * 
 * // With journey-specific theming
 * <Text journey="health">Health journey text</Text>
 * 
 * // With accessibility attributes
 * <Text aria-label="Important information" role="alert">Critical update</Text>
 * 
 * // As a different HTML element
 * <Text as="h1">Page title</Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  as,
  children,
  testID,
  numberOfLines,
  className,
  onClick,
  ...props
}) => {
  // Handle multiline truncation
  const style = numberOfLines ? {
    display: '-webkit-box',
    WebkitLineClamp: numberOfLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } : undefined;
  
  return (
    <StyledText 
      as={as}
      data-testid={testID}
      className={className}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </StyledText>
  );
};

// Default props
Text.defaultProps = {
  as: 'span',
  fontFamily: 'base',
  fontSize: 'md',
  fontWeight: 'regular',
  lineHeight: 'base',
  textAlign: 'left',
  truncate: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  uppercase: false,
};

export default Text;