/**
 * @file Avatar styled components
 * @description Defines styled components for the Avatar component with journey-specific theming
 */

import styled, { css } from 'styled-components'; // styled-components@6.1.8
import { JourneyType } from '@austa/interfaces/common';

// Define the props for the AvatarContainer component
interface AvatarContainerProps {
  size?: string;
  journey?: JourneyType;
}

/**
 * Container component for the Avatar
 * Supports journey-specific theming (health: green, care: orange, plan: blue)
 */
export const AvatarContainer = styled.div<AvatarContainerProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border-radius: 50%;
  overflow: hidden;
  
  /* Default neutral background color for backward compatibility */
  background-color: ${props => props.theme.colors.neutral.gray300};
  
  /* Journey-specific styling with higher specificity */
  ${props => props.journey && css`
    &&& {
      background-color: ${props.theme.colors.journeys[props.journey].primary};
    }
  `}
`;

/**
 * Image component for the Avatar
 */
export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/**
 * Fallback component for the Avatar when no image is available
 */
export const AvatarFallback = styled.span<{ size?: string }>`
  font-size: ${props => props.size ? `calc(${props.size} / 3)` : '1rem'};
  font-weight: 500;
  color: ${props => props.theme.colors.neutral.gray700};
`;