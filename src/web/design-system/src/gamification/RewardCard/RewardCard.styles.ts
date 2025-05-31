/**
 * Styled components for the RewardCard component in the gamification system.
 * 
 * This file defines the styling and theming logic for the RewardCard component,
 * which displays available rewards and XP values in the gamification system.
 * It uses primitives from @design-system/primitives and journey context from
 * @austa/journey-context for journey-specific theming.
 */

import styled from 'styled-components';
import { Card, Icon, Text } from '@design-system/primitives';
import { colors, spacing, shadows, animation, typography } from '@design-system/primitives/tokens';
import { ThemeAwareProps } from '@austa/interfaces/themes';

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
 * Interface for XPBadge props to ensure type safety
 */
interface XPBadgeProps {
  /** Background color for the badge */
  color?: string;
  /** Text color for the badge */
  textColor?: string;
  /** Current journey ID for theming */
  journeyId?: 'health' | 'care' | 'plan';
}

/**
 * Styled component for displaying the XP value of the reward
 * Uses journey-specific colors when available
 */
export const XPBadge = styled.div<ThemeAwareProps<XPBadgeProps>>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => {
    // Use explicitly provided color if available
    if (props.color) return props.color;
    
    // Use journey-specific color if journeyId is provided
    if (props.journeyId && props.journeyId in colors.journeys) {
      return colors.journeys[props.journeyId].primary_20;
    }
    
    // Use theme journey color if available in theme
    if (props.theme?.journey?.key && props.theme.journey.key in colors.journeys) {
      return colors.journeys[props.theme.journey.key].primary_20;
    }
    
    // Default fallback
    return colors.neutral.gray200;
  }};
  color: ${props => {
    // Use explicitly provided text color if available
    if (props.textColor) return props.textColor;
    
    // Use journey-specific text color if journeyId is provided
    if (props.journeyId && props.journeyId in colors.journeys) {
      return colors.journeys[props.journeyId].primary;
    }
    
    // Use theme journey color if available in theme
    if (props.theme?.journey?.key && props.theme.journey.key in colors.journeys) {
      return colors.journeys[props.theme.journey.key].primary;
    }
    
    // Default fallback
    return colors.neutral.gray900;
  }};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${spacing.sm};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  align-self: flex-start;
  
  /* Ensure proper contrast for accessibility */
  @media (prefers-contrast: more) {
    border: 1px solid ${colors.neutral.gray900};
  }
`;