import styled from 'styled-components';
import { Icon } from '@design-system/primitives/components/Icon';
import { Touchable } from '@design-system/primitives/components/Touchable';
import { colors } from '@design-system/primitives/tokens/colors';
import { JourneyType } from '@austa/interfaces/components/core.types';

/**
 * Status types for the Badge component
 */
export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | undefined;

/**
 * Size types for the Badge component
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Container for the badge.
 * Handles sizing, styling, and appearance based on unlocked state, journey, and status.
 */
export const BadgeContainer = styled(Touchable)<{
  size: BadgeSize;
  unlocked: boolean;
  journey: JourneyType;
  status?: BadgeStatus;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => {
    // If status is provided, use semantic status colors
    if (props.status) {
      if (props.unlocked) {
        switch (props.status) {
          case 'success':
            return colors.semantic.success;
          case 'warning':
            return colors.semantic.warning;
          case 'error':
            return colors.semantic.error;
          case 'info':
            return colors.semantic.info;
          default:
            return colors.journeys[props.journey].primary;
        }
      } else {
        return colors.neutral.gray200;
      }
    }
    
    // Default journey-based coloring
    return props.unlocked
      ? colors.journeys[props.journey].primary
      : colors.neutral.gray200;
  }};
  color: ${(props) =>
    props.unlocked ? colors.neutral.white : colors.neutral.gray700};
`;

/**
 * Icon component for the badge.
 * Displays the icon with appropriate color and size.
 */
export const BadgeIcon = styled(Icon)<{
  color: string;
  size: number;
}>`
  margin-right: ${(props) => props.theme.spacing.xs};
`;