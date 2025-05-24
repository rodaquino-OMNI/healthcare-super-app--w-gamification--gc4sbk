import styled from 'styled-components';
import { Box, Touchable } from '@design-system/primitives/components';

/**
 * Styled container for the achievement content
 */
export const AchievementContent = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${props => props.theme.spacing.md};
`;

/**
 * Styled container for the badge
 */
export const BadgeContainer = styled(Box)`
  margin-bottom: ${props => props.theme.spacing.md};
`;

/**
 * Styled container for the achievement text content
 */
export const TextContainer = styled(Box)`
  margin-top: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

/**
 * Styled button for dismissing the notification
 */
export const DismissButton = styled(Touchable)<{ journey: string }>`
  background-color: ${props => props.theme.colors.journeys[props.journey].primary};
  color: ${props => props.theme.colors.neutral.white};
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.lg}`};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  min-width: 120px;
  text-align: center;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.journeys[props.journey].primary};
    outline-offset: 2px;
  }
`;