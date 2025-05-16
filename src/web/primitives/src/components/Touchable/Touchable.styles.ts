import styled, { css } from 'styled-components';
import { TouchableOpacity, Platform } from 'react-native';
import { animation } from '../../../tokens';

interface StyledTouchableOpacityProps {
  fullWidth?: boolean;
  disabled?: boolean;
  journey?: 'health' | 'care' | 'plan';
}

/**
 * StyledTouchableOpacity provides a consistent touchable component that works across platforms
 * with appropriate visual feedback and styling.
 * 
 * It handles platform-specific styling differences between web and mobile, ensuring
 * consistent behavior and appearance across all platforms while respecting
 * accessibility requirements.
 * 
 * @param fullWidth - Makes the touchable expand to fill its container width
 * @param disabled - Disables the touchable and applies a visual indication
 * @param journey - Optional journey identifier for journey-specific styling
 * 
 * Note: The native activeOpacity prop is passed through to the underlying TouchableOpacity
 * component and controls the opacity when pressed on mobile platforms.
 */
export const StyledTouchableOpacity = styled(TouchableOpacity)<StyledTouchableOpacityProps>`
  /* Base styles */
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  
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
    
    &:focus-visible {
      outline: 2px solid ${props.journey ? 
        `var(--journey-${props.journey}-accent, rgba(0, 102, 204, 0.5))` : 
        'rgba(0, 102, 204, 0.5)'};
      outline-offset: 2px;
    }
  `}
`;