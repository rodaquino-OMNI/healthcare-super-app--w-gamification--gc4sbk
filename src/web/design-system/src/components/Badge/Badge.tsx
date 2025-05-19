import React from 'react';
import { Text } from '@design-system/primitives/components/Text';
import { BadgeProps as BaseBadgeProps } from '@austa/interfaces/components/core.types';
import { BadgeContainer, BadgeIcon, BadgeSize, BadgeStatus } from './Badge.styles';

/**
 * Props interface for the Badge component
 * Extends the base BadgeProps from @austa/interfaces with additional properties
 */
export interface BadgeProps extends BaseBadgeProps {
  /**
   * The status of the badge for semantic coloring.
   * @default undefined
   */
  status?: BadgeStatus;
}

/**
 * Determines the size of the badge based on the provided size prop.
 * @param size The size of the badge: 'sm', 'md', or 'lg'
 * @returns The size of the badge in pixels.
 */
export function getBadgeSize(size: BadgeSize): number {
  switch (size) {
    case 'sm':
      return 24;
    case 'md':
      return 32;
    case 'lg':
      return 40;
    default:
      return 32;
  }
}

/**
 * A versatile Badge component for displaying status, notifications, or achievements.
 * It supports different sizes, styles, and theming based on the AUSTA SuperApp's design system.
 * 
 * @example
 * // Basic usage
 * <Badge>New</Badge>
 * 
 * @example
 * // With journey and status
 * <Badge journey="health" status="success" unlocked>
 *   Achievement Unlocked
 * </Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  size = 'md',
  unlocked = false,
  journey = 'health',
  status,
  children,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const badgeSize = getBadgeSize(size);

  return (
    <BadgeContainer
      size={size}
      unlocked={unlocked}
      journey={journey}
      status={status}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </BadgeContainer>
  );
};