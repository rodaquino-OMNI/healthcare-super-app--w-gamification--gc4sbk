/**
 * Touchable.styles.ts
 * 
 * Defines the styled component for the Touchable primitive, one of the five foundational
 * primitives in the AUSTA SuperApp design system. This component provides consistent
 * touch behavior across web and mobile platforms with appropriate visual feedback.
 * 
 * @version 2.0.0
 */

import styled, { css } from 'styled-components';
import { TouchableOpacity, Platform } from 'react-native';
import { animation } from '../../tokens/animation';
import { TouchableProps } from '@austa/interfaces/components/primitives.types';

/**
 * StyledTouchableOpacity provides a consistent touchable component that works across platforms
 * with appropriate visual feedback and styling.
 * 
 * @component
 * @param {TouchableProps} props - Component props
 * @param {boolean} props.fullWidth - Makes the touchable expand to fill its container width
 * @param {boolean} props.disabled - Disables the touchable and applies a visual indication
 * 
 * @example
 * // Basic usage
 * <StyledTouchableOpacity onPress={() => console.log('Pressed')}>
 *   <Text>Press me</Text>
 * </StyledTouchableOpacity>
 * 
 * @example
 * // Full width button with disabled state
 * <StyledTouchableOpacity 
 *   fullWidth 
 *   disabled={isLoading}
 *   onPress={handleSubmit}
 * >
 *   <Text>{isLoading ? 'Loading...' : 'Submit'}</Text>
 * </StyledTouchableOpacity>
 */
export const StyledTouchableOpacity = styled(TouchableOpacity)<TouchableProps>`
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
    transition: opacity ${animation.duration.normal} ${animation.easing.easeOut};
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

    /* High contrast mode support for better accessibility */
    @media (forced-colors: active) {
      &:focus-visible {
        outline: 2px solid CanvasText;
      }
    }
  `}
`;

export default StyledTouchableOpacity;