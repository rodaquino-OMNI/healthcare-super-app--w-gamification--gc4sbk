import styled from 'styled-components';
import { Box, Touchable, Icon } from '@design-system/primitives';
import type { ComponentSize, ComponentStatus, JourneyTheme } from '@austa/interfaces/components';

/**
 * Determines the size of the badge based on the provided size prop.
 * @param size The size of the badge: 'xs', 'sm', 'md', 'lg', or 'xl'
 * @returns The size of the badge in pixels.
 */
export function getBadgeSize(size: ComponentSize): number {
  switch (size) {
    case 'xs':
      return 16;
    case 'sm':
      return 24;
    case 'md':
      return 32;
    case 'lg':
      return 40;
    case 'xl':
      return 48;
    default:
      return 32;
  }
}

/**
 * Gets the appropriate color for a badge based on its status
 * @param status The status of the badge
 * @param theme The current theme
 * @returns The color code for the badge
 */
export function getBadgeStatusColor(status: ComponentStatus, theme: any): string {
  switch (status) {
    case 'success':
      return theme.colors.semantic.success;
    case 'warning':
      return theme.colors.semantic.warning;
    case 'error':
      return theme.colors.semantic.error;
    case 'info':
      return theme.colors.semantic.info;
    default:
      return theme.colors.neutral.gray200;
  }
}

/**
 * Gets the appropriate text color for a badge based on its status
 * @param status The status of the badge
 * @param theme The current theme
 * @returns The text color code for the badge
 */
export function getBadgeTextColor(status: ComponentStatus, theme: any): string {
  switch (status) {
    case 'success':
    case 'warning':
    case 'error':
    case 'info':
      return theme.colors.neutral.white;
    default:
      return theme.colors.neutral.gray700;
  }
}

/**
 * Container for the badge.
 * Handles sizing, styling, and appearance based on unlocked state, journey, and status.
 */
export const BadgeContainer = styled(Touchable)<{
  size: ComponentSize;
  unlocked: boolean;
  journeyTheme: JourneyTheme;
  status: ComponentStatus;
  standalone: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) =>
    props.unlocked
      ? props.status !== 'default'
        ? getBadgeStatusColor(props.status, props.theme)
        : props.theme.colors.journeys[props.journeyTheme].primary
      : props.theme.colors.neutral.gray200};
  color: ${(props) =>
    props.unlocked
      ? props.status !== 'default'
        ? getBadgeTextColor(props.status, props.theme)
        : props.theme.colors.neutral.white
      : props.theme.colors.neutral.gray700};
  min-width: ${(props) => (props.standalone ? `${getBadgeSize(props.size)}px` : 'auto')};
  min-height: ${(props) => (props.standalone ? `${getBadgeSize(props.size)}px` : 'auto')};
  max-width: ${(props) => (props.standalone ? `${getBadgeSize(props.size) * 2}px` : 'none')};
`;

/**
 * Icon component for the badge.
 * Displays the badge icon with appropriate color and size.
 */
export const BadgeIcon = styled(Icon)<{
  color: string;
  size: number;
}>`
  margin-right: ${(props) => props.theme.spacing.xs};
`;

/**
 * Wrapper for the badge content
 */
export const BadgeContent = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
`;