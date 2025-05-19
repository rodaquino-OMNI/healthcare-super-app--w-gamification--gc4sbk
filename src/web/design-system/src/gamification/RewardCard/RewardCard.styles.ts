import styled from 'styled-components';
import { useJourneyContext } from '@austa/journey-context';
import { Card, Text, Icon } from '@design-system/primitives/components';
import { spacing, shadows, animation, typography } from '@design-system/primitives/tokens';
import { colors } from '@design-system/primitives/tokens/colors';
import { JourneyTheme } from '@austa/interfaces/themes';

/**
 * Hook that provides journey-specific colors for theming components
 * 
 * @returns The color palette for the current journey, with improved contrast for accessibility
 */
export const useJourneyTheme = (): JourneyTheme => {
  const { currentJourney } = useJourneyContext();
  
  if (currentJourney && currentJourney in colors.journeys) {
    const journeyColors = colors.journeys[currentJourney as keyof typeof colors.journeys];
    return {
      primary: journeyColors.primary,
      secondary: journeyColors.secondary,
      accent: journeyColors.accent,
      background: journeyColors.background,
      text: journeyColors.text,
      // Improved contrast for accessibility
      contrastText: colors.neutral.white,
      contrastBackground: journeyColors.primary
    };
  }
  
  // Default to neutral colors if journey is not recognized
  return {
    primary: colors.neutral.gray700,
    secondary: colors.neutral.gray600,
    accent: colors.neutral.gray800,
    background: colors.neutral.white,
    text: colors.neutral.gray900,
    contrastText: colors.neutral.white,
    contrastBackground: colors.neutral.gray800
  };
};

/**
 * Styled container for the reward card, extending the Card component
 * with reward-specific styling
 */
export const RewardCardContainer = styled(Card)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${spacing.md};
  margin-bottom: ${spacing.md};
  transition: transform ${animation.duration.fast} ${animation.easing.easeOut};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${shadows.md};
  }
`;

/**
 * Styled icon component for displaying the reward icon
 * with appropriate sizing and colors
 */
export const RewardIcon = styled(Icon)`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  margin-right: ${spacing.md};
`;

/**
 * Styled container for the reward content (title, description, XP)
 */
export const RewardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

/**
 * Styled text component for the reward title with appropriate typography
 */
export const RewardTitle = styled(Text)`
  font-weight: ${typography.fontWeight.medium};
  margin-bottom: ${spacing.xs};
`;

/**
 * Styled text component for the reward description with appropriate typography
 */
export const RewardDescription = styled(Text)`
  font-size: ${typography.fontSize.sm};
  color: ${colors.neutral.gray700};
  margin-bottom: ${spacing.xs};
`;

/**
 * Styled component for displaying the XP value of the reward
 * with improved contrast for accessibility
 */
export const XPBadge = styled.div<{ color?: string; textColor?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color || colors.neutral.gray200};
  color: ${props => props.textColor || colors.neutral.gray900};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.sm};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  align-self: flex-start;
  
  /* Ensure minimum contrast ratio for accessibility */
  @media (prefers-contrast: more) {
    border: 1px solid ${colors.neutral.gray900};
  }
`;