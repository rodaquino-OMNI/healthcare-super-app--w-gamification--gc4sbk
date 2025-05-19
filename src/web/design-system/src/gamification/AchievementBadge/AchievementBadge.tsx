import * as React from 'react';
import { Box, Icon, Touchable } from '@design-system/primitives/components';
import { useJourneyTheme } from '@austa/journey-context';
import { colors, spacing } from '@design-system/primitives/tokens';
import type { Achievement, JourneyType } from '@austa/interfaces/gamification';

/**
 * Props for the AchievementBadge component
 */
export interface AchievementBadgeProps {
  /**
   * The achievement object containing details like id, title, description, icon, progress, total, unlocked, and journey.
   */
  achievement: Achievement;
  
  /**
   * The size of the badge.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether to show the progress indicator for locked achievements.
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Callback function to execute when the badge is pressed.
   */
  onPress?: () => void;

  /**
   * Whether to show a tooltip with the achievement description on hover.
   * @default false
   */
  showTooltip?: boolean;

  /**
   * Additional test ID for testing purposes.
   */
  testID?: string;
}

/**
 * Determines the size of the badge based on the provided size prop.
 * @param size The size of the badge: 'sm', 'md', or 'lg'
 * @returns The size in pixels
 */
const getBadgeSize = (size: 'sm' | 'md' | 'lg'): number => {
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
};

/**
 * A component that displays an achievement badge with appropriate styling based on its state (locked/unlocked) and journey.
 */
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  showProgress = true,
  onPress,
  showTooltip = false,
  testID = 'badge-container'
}) => {
  const { title, description, icon, progress, total, unlocked, journey } = achievement;
  const { colors: themeColors } = useJourneyTheme(journey as JourneyType);
  
  // Calculate progress percentage for accessibility
  const progressPercentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={`${title} achievement. ${description}. ${
        unlocked ? 'Unlocked' : `Progress: ${progress} of ${total}`
      }`}
      accessibilityRole="img"
      testID={testID}
      style={{
        position: 'relative',
        width: getBadgeSize(size),
        height: getBadgeSize(size),
        borderRadius: getBadgeSize(size) / 2,
        backgroundColor: unlocked ? colors.neutral.white : colors.neutral.gray200,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: unlocked ? themeColors.primary : colors.neutral.gray400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: unlocked ? 1 : 0.8,
        margin: spacing.xs
      }}
    >
      <Icon
        name={icon}
        color={unlocked ? themeColors.primary : colors.neutral.gray400}
        size={getBadgeSize(size) * 0.5}
        aria-hidden="true"
        testID="badge-icon"
      />
      
      {showProgress && !unlocked && (
        <Box
          testID="progress-ring"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercentage}
          aria-label="Achievement progress"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: getBadgeSize(size) / 2,
            overflow: 'hidden',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: themeColors.primary,
            opacity: 0.6
          }}
        />
      )}
      
      {unlocked && (
        <Box
          testID="unlocked-indicator"
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: themeColors.primary,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: colors.neutral.white,
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)'
          }}
        />
      )}

      {showTooltip && (
        <Box
          testID="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: spacing.xs,
            padding: spacing.xs,
            backgroundColor: colors.neutral.gray800,
            color: colors.neutral.white,
            borderRadius: 4,
            maxWidth: 200,
            zIndex: 10,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Box
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              backgroundColor: colors.neutral.gray800
            }}
          />
          {description}
        </Box>
      )}
    </Touchable>
  );
};