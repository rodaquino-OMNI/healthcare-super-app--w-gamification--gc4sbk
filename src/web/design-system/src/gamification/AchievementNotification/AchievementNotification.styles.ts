import styled from 'styled-components';
import { Box } from '@design-system/primitives/src/components';
import { colors, shadows, spacing } from '@design-system/primitives/src/tokens';

export const ModalOverlay = styled(Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

export const ModalContent = styled(Box)<{ journeyColor: string }>`
  background-color: ${colors.neutral.white};
  border-radius: 8px;
  padding: ${spacing.xl};
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: ${shadows.lg};
  border-top: 4px solid ${props => props.journeyColor};
`;

export const ModalTitle = styled(Box)<{ journeyColor: string }>`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.journeyColor};
  margin-bottom: ${spacing.md};
  text-align: center;
`;

export const AchievementTitle = styled(Box)`
  font-size: 1.125rem;
  font-weight: bold;
  color: ${colors.neutral.gray900};
  margin-bottom: ${spacing.xs};
  text-align: center;
`;

export const AchievementDescription = styled(Box)`
  font-size: 1rem;
  color: ${colors.neutral.gray700};
  margin-bottom: ${spacing.lg};
  text-align: center;
`;

export const DismissButton = styled(Box)<{ journeyColor: string }>`
  background-color: ${props => props.journeyColor};
  color: ${colors.neutral.white};
  padding: ${spacing.sm} ${spacing.lg};
  border-radius: 4px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:active {
    opacity: 0.8;
  }
`;

export const BadgeContainer = styled(Box)`
  margin-bottom: ${spacing.md};
`;