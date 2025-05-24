import styled from 'styled-components';
import { colors } from '@design-system/primitives';
import { spacing } from '@design-system/primitives';
import { typography } from '@design-system/primitives';
import { Theme, ThemeProp } from '@austa/interfaces/themes';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';

/**
 * Returns the appropriate color for the specified journey.
 * @param journey The journey identifier (health, care, plan)
 * @returns The color hex code for the specified journey.
 */
export const getJourneyColor = (journey?: string): string => {
  if (journey === 'health') {
    return colors.journeys.health.primary;
  } else if (journey === 'care') {
    return colors.journeys.care.primary;
  } else if (journey === 'plan') {
    return colors.journeys.plan.primary;
  }
  
  // Default fallback to brand primary color
  return colors.brand.primary;
};

/**
 * Styled Card component specifically for QuestCard with journey-specific styling
 */
export const QuestCardContainer = styled(Card)<ThemeProp>`
  margin-bottom: ${props => props.theme.spacing.md};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

/**
 * Styled component for the quest title with appropriate typography
 */
export const QuestTitle = styled.h3<ThemeProp>`
  font-family: ${props => props.theme.typography.fontFamily.heading};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.neutral.gray900};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  line-height: ${props => props.theme.typography.lineHeight.tight};
`;

/**
 * Styled component for the quest description with appropriate typography
 */
export const QuestDescription = styled.p<ThemeProp>`
  font-family: ${props => props.theme.typography.fontFamily.base};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.regular};
  color: ${props => props.theme.colors.neutral.gray700};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  line-height: ${props => props.theme.typography.lineHeight.base};
`;

/**
 * Styled component for the quest progress indicator, extending the ProgressBar component
 */
export const QuestProgress = styled(ProgressBar)<ThemeProp>`
  margin: ${props => props.theme.spacing.sm} 0;
`;

/**
 * Styled component for displaying the progress text (e.g., '5/10 completed')
 */
export const QuestProgressText = styled.span<ThemeProp>`
  font-family: ${props => props.theme.typography.fontFamily.base};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.neutral.gray600};
  margin-top: ${props => props.theme.spacing.xs};
  display: block;
`;

/**
 * Styled component for the quest icon with journey-specific coloring
 */
export const QuestIcon = styled.div<{ journey?: string } & ThemeProp>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ journey, theme }) => journey ? 
    `${theme.colors.journeys[journey as 'health' | 'care' | 'plan'].primary}20` : // Using 20 as hex opacity (12.5%)
    theme.colors.neutral.gray200
  };
  margin-bottom: ${props => props.theme.spacing.sm};

  svg {
    color: ${({ journey, theme }) => 
      journey ? theme.colors.journeys[journey as 'health' | 'care' | 'plan'].primary : theme.colors.neutral.gray700
    };
    width: 16px;
    height: 16px;
  }
`;