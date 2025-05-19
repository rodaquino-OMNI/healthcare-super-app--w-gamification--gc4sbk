import styled from 'styled-components';
import { colors } from '@design-system/primitives/tokens/colors';
import { typography } from '@design-system/primitives/tokens/typography';
import { spacing } from '@design-system/primitives/tokens/spacing';
import { breakpoints } from '@design-system/primitives/tokens/breakpoints';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Container for the entire LevelIndicator component.
 * Applies journey-specific styling via border color.
 */
export const LevelContainer = styled.div<{ journey?: JourneyType }>`
  display: flex;
  flex-direction: column;
  padding: ${spacing.md};
  border-radius: 8px;
  background-color: ${props => 
    props.journey ? colors.journeys[props.journey].background : colors.neutral.white};
  border-left: 4px solid ${props => 
    props.journey ? colors.journeys[props.journey].primary : colors.neutral.gray400};
  margin-bottom: ${spacing.md};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media ${breakpoints.md} {
    padding: ${spacing.lg};
  }
`;

/**
 * Displays the current level of the user with journey-specific styling.
 * Combines level badge and level title in a horizontal layout.
 */
export const LevelText = styled.div<{ journey?: JourneyType }>`
  display: flex;
  align-items: center;
  margin-bottom: ${spacing.md};
  font-size: ${typography.fontSize.xl};
  font-weight: ${typography.fontWeight.bold};
  color: ${props => 
    props.journey ? colors.journeys[props.journey].primary : colors.neutral.gray800};

  @media ${breakpoints.sm} {
    margin-bottom: ${spacing.sm};
  }
`;

/**
 * Container for the progress bar and XP counter components.
 */
export const LevelProgress = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${spacing.sm};

  @media ${breakpoints.md} {
    margin-top: ${spacing.md};
  }
`;

/**
 * Circular badge displaying the user's current level number with journey-specific styling.
 */
export const LevelBadge = styled.div<{ journey?: JourneyType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => 
    props.journey ? colors.journeys[props.journey].primary : colors.neutral.gray400};
  color: ${colors.neutral.white};
  font-weight: ${typography.fontWeight.bold};
  font-size: ${typography.fontSize.lg};
  margin-right: ${spacing.sm};
  flex-shrink: 0;

  @media ${breakpoints.md} {
    width: 48px;
    height: 48px;
    font-size: ${typography.fontSize.xl};
  }
`;

/**
 * Container for level text and title information.
 */
export const LevelInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Displays the 'Level' title text.
 */
export const LevelTitle = styled.span`
  font-size: ${typography.fontSize.sm};
  color: ${colors.neutral.gray600};
  margin-bottom: ${spacing.xs};

  @media ${breakpoints.md} {
    font-size: ${typography.fontSize.md};
  }
`;