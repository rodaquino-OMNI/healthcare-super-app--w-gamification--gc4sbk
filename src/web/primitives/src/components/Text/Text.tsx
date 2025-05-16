/**
 * Text primitive component for the AUSTA SuperApp design system.
 * 
 * This component ensures consistent typography across the application with support for
 * font styling, journey-specific theming, accessibility attributes, and element type configuration.
 * It is used throughout the application for all text rendering, ensuring typography consistency
 * and theme compliance.
 */

import React from 'react';
import { StyledText, TextStyleProps } from './Text.styles';

/**
 * Props for the Text component
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
  role?: string;
  
  /**
   * Child elements (text content)
   */
  children: React.ReactNode;
  
  /**
   * Additional props to be spread to the underlying element
   */
  [key: string]: any;
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
 * // As a different HTML element
 * <Text as="h1">Heading</Text>
 * 
 * // With accessibility attributes
 * <Text aria-label="Important information" role="alert">Critical update</Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  as,
  children,
  testID,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  'aria-live': ariaLive,
  'aria-atomic': ariaAtomic,
  role,
  ...props
}) => {
  return (
    <StyledText 
      as={as}
      data-testid={testID}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      role={role}
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
};

export default Text;