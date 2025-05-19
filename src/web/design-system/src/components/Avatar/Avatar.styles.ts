import styled from 'styled-components'; // styled-components@6.1.8
import { JourneyType } from '@austa/interfaces/components';

/**
 * Container for the Avatar component with journey-specific theming
 */
export const AvatarContainer = styled.div<{ size?: string; journey?: JourneyType }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border-radius: 50%;
  background-color: ${props => {
    // Apply journey-specific background color if journey prop is provided
    if (props.journey) {
      return props.theme.colors.journeys[props.journey].background;
    }
    // Fall back to neutral gray
    return props.theme.colors.neutral.gray300;
  }};
  overflow: hidden;
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
 * Fallback component for when the image is not available
 */
export const AvatarFallback = styled.span<{ size?: string }>`
  font-size: ${props => props.size ? `calc(${props.size} / 3)` : '1rem'};
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;