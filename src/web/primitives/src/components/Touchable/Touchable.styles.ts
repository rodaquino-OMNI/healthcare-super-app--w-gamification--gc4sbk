import styled, { css } from 'styled-components';
import { TouchableOpacity, Platform } from 'react-native';

/**
 * Props interface for the styled TouchableOpacity component
 */
interface StyledTouchableOpacityProps {
  /** Whether the touchable should take up the full width of its container */
  fullWidth?: boolean;
  /** Whether the touchable is disabled */
  disabled?: boolean;
}

/**
 * StyledTouchableOpacity provides a consistent touchable component that works across platforms
 * with appropriate visual feedback and styling.
 * 
 * This styled component handles platform-specific styling differences between web and mobile,
 * ensuring consistent interaction patterns while respecting platform conventions.
 */
export const StyledTouchableOpacity = styled(TouchableOpacity)<StyledTouchableOpacityProps>`
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
    transition: opacity 0.2s ease;
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
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.5);
    }
  `}
`;