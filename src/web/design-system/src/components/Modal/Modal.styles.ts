import styled from 'styled-components';
import { Box } from '@design-system/primitives/components/Box';
import { animation, spacing, shadows, breakpoints, colors } from '@design-system/primitives/tokens';
import { JourneyType } from '@austa/interfaces/common';

// Interface for journey-specific styling props
interface JourneyStyledProps {
  journeyType?: JourneyType;
  visible?: boolean;
}

// Styled component for the modal backdrop that covers the entire screen with a semi-transparent background
export const ModalBackdrop = styled(Box)<JourneyStyledProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity ${animation.duration.normal} ${animation.easing.easeInOut}, 
              visibility ${animation.duration.normal} ${animation.easing.easeInOut};
  
  ${({ visible }) => visible && `
    opacity: 1;
    visibility: visible;
  `}
`;

// Styled component for the modal container with appropriate styling and animations
export const ModalContainer = styled(Box)<JourneyStyledProps>`
  background-color: white;
  border-radius: md;
  box-shadow: ${shadows.lg};
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  transform: translateY(20px);
  opacity: 0;
  transition: transform ${animation.duration.normal} ${animation.easing.easeOut}, 
              opacity ${animation.duration.normal} ${animation.easing.easeOut};
  
  ${({ visible }) => visible && `
    transform: translateY(0);
    opacity: 1;
  `}
  
  @media ${breakpoints.mediaQueries.sm} {
    width: 80%;
  }
  
  @media ${breakpoints.mediaQueries.md} {
    width: 70%;
  }
  
  @media ${breakpoints.mediaQueries.lg} {
    width: 60%;
  }
`;

// Styled component for the modal header section containing the title
export const ModalHeader = styled(Box)<JourneyStyledProps>`
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid ${colors.neutral.gray200};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  ${({ journeyType, theme }) => {
    if (journeyType === 'health') {
      return `
        border-bottom-color: ${theme.colors.health.primary};
        color: ${theme.colors.health.text};
      `;
    } else if (journeyType === 'care') {
      return `
        border-bottom-color: ${theme.colors.care.primary};
        color: ${theme.colors.care.text};
      `;
    } else if (journeyType === 'plan') {
      return `
        border-bottom-color: ${theme.colors.plan.primary};
        color: ${theme.colors.plan.text};
      `;
    }
    return '';
  }}
`;

// Styled component for the modal content section
export const ModalContent = styled(Box)<JourneyStyledProps>`
  padding: ${spacing.lg};
  overflow-y: auto;
`;

// Styled component for the modal actions section containing buttons
export const ModalActions = styled(Box)<JourneyStyledProps>`
  padding: ${spacing.md} ${spacing.lg};
  border-top: 1px solid ${colors.neutral.gray200};
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.sm};
  
  ${({ journeyType, theme }) => {
    if (journeyType === 'health') {
      return `
        border-top-color: ${theme.colors.health.primary};
      `;
    } else if (journeyType === 'care') {
      return `
        border-top-color: ${theme.colors.care.primary};
      `;
    } else if (journeyType === 'plan') {
      return `
        border-top-color: ${theme.colors.plan.primary};
      `;
    }
    return '';
  }}
`;