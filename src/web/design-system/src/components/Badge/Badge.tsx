import React from 'react';
import { Text } from '@design-system/primitives';
import type { BadgeProps as InterfaceBadgeProps, ComponentSize, ComponentStatus, JourneyTheme } from '@austa/interfaces/components';
import { BadgeContainer, BadgeIcon, BadgeContent, getBadgeSize } from './Badge.styles';

/**
 * Props interface for the Badge component
 * Extends the standard BadgeProps interface from @austa/interfaces/components
 * while maintaining backward compatibility with existing usage patterns
 */
export interface BadgeProps extends Partial<InterfaceBadgeProps> {
  /**
   * The size of the badge.
   * @default 'md'
   */
  size?: ComponentSize;

  /**
   * Whether the badge is unlocked.
   * @default false
   */
  unlocked?: boolean;

  /**
   * The journey to which the badge belongs (health, care, or plan).
   * @default 'health'
   */
  journey?: JourneyTheme;

  /**
   * The status of the badge for semantic styling.
   * @default 'default'
   */
  status?: ComponentStatus;

  /**
   * The content of the badge.
   */
  children?: React.ReactNode;

  /**
   * Function called when the badge is pressed
   */
  onPress?: () => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Test ID for testing purposes
   */
  testID?: string;

  /**
   * Whether the badge is standalone (not attached to children)
   * @default true
   */
  standalone?: boolean;

  /**
   * Icon to display in the badge
   */
  icon?: React.ReactNode;
}

/**
 * A versatile Badge component for displaying status, notifications, or achievements.
 * It supports different sizes, styles, and theming based on the AUSTA SuperApp's design system.
 * 
 * @example
 * // Basic usage
 * <Badge>3</Badge>
 * 
 * @example
 * // Journey-specific badge
 * <Badge journey="care" unlocked>
 *   New
 * </Badge>
 * 
 * @example
 * // Status badge
 * <Badge status="success">
 *   Success
 * </Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  size = 'md',
  unlocked = false,
  journey = 'health',
  status = 'default',
  children,
  onPress,
  accessibilityLabel,
  testID,
  standalone = true,
  icon,
  // Support for new InterfaceBadgeProps properties with defaults
  content,
  visible = true,
  maxCount,
  showZero = false,
  dot = false,
  color,
  textColor,
  position,
  offset,
  pulse = false,
  outlined = false,
  shape = 'rounded',
}) => {
  // Don't render if not visible
  if (!visible) return null;

  // Handle content formatting
  const displayContent = () => {
    // If dot is true, don't show content
    if (dot) return null;

    // Use children or content prop
    const contentValue = children || content;

    // Format number content with maxCount
    if (typeof contentValue === 'number' && maxCount && contentValue > maxCount) {
      return `${maxCount}+`;
    }

    // Don't show zero unless showZero is true
    if (contentValue === 0 && !showZero) {
      return null;
    }

    return contentValue;
  };

  const badgeSize = getBadgeSize(size);
  const displayedContent = displayContent();

  return (
    <BadgeContainer
      size={size}
      unlocked={unlocked}
      journeyTheme={journey}
      status={status}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      standalone={standalone}
    >
      <BadgeContent>
        {icon && (
          <BadgeIcon 
            name={typeof icon === 'string' ? icon : undefined}
            size={badgeSize / 2}
            color="currentColor"
          >
            {typeof icon !== 'string' ? icon : null}
          </BadgeIcon>
        )}
        {displayedContent && (
          <Text 
            size={size === 'xs' || size === 'sm' ? 'xs' : 'sm'}
            weight="medium"
            color="inherit"
          >
            {displayedContent}
          </Text>
        )}
      </BadgeContent>
    </BadgeContainer>
  );
};

export default Badge;