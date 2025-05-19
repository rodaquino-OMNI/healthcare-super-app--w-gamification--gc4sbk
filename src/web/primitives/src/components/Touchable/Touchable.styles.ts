/**
 * Touchable component styles for the AUSTA SuperApp
 * Provides consistent touchable behavior across web and mobile platforms
 * with appropriate visual feedback and accessibility features
 * 
 * @package @design-system/primitives
 * @version 2.0.0
 */

import styled, { css } from 'styled-components';
import { TouchableOpacity, Platform } from 'react-native';
import { TouchableStyleProps } from '@austa/interfaces/components';
import { animation } from '../../../tokens/animation';

/**
 * StyledTouchableOpacity provides a consistent touchable component that works across platforms
 * with appropriate visual feedback and styling.
 * 
 * Features:
 * - Cross-platform compatibility (web and mobile)
 * - Consistent visual feedback for all interactive states
 * - Accessibility-friendly focus styles for keyboard navigation
 * - Support for disabled state with visual indication
 * - Configurable width behavior
 * 
 * @example
 * ```tsx
 * import { StyledTouchableOpacity } from '@design-system/primitives/components/Touchable';
 * 
 * <StyledTouchableOpacity 
 *   fullWidth 
 *   activeOpacity={0.7} 
 *   onPress={() => console.log('Pressed!')}
 * >
 *   <Text>Press me</Text>
 * </StyledTouchableOpacity>
 * ```
 */
export const StyledTouchableOpacity = styled(TouchableOpacity)<TouchableStyleProps>`
  /* Base styles */
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  /* Handle width */
  width: ${props => (props.fullWidth ? '100%' : 'auto')};
  
  /* Disabled state styling */
  opacity: ${props => (props.disabled ? 0.5 : 1)};
  
  /* Platform-specific styles */
  ${props => Platform.OS === 'web' && css`
    cursor: ${props.disabled ? 'not-allowed' : 'pointer'};
    transition: opacity ${animation.duration.fast}ms ${animation.easing.easeOut};
    outline: none;
    
    ${!props.disabled && css`
      &:hover {
        opacity: 0.8;
      }
      
      &:active {
        opacity: 0.6;
      }
    `}
    
    /* Enhanced focus state for accessibility */
    &:focus-visible {
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.5);
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
    
    /* Ensure keyboard focus is visible even when using high contrast mode */
    @media (forced-colors: active) {
      &:focus-visible {
        outline: 2px solid HighlightText;
      }
    }
  `}
`;