import * as React from 'react';
import {
  BadgeContainer,
  BadgeIcon,
  ProgressRing,
  UnlockedIndicator,
  getBadgeSize
} from './AchievementBadge.styles';
import { useJourneyTheme } from '@austa/journey-context';
import type { Achievement } from '@austa/interfaces/gamification';

/**
 * Props for the AchievementBadge component
 */
interface AchievementBadgeProps {
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
}

/**
 * A component that displays an achievement badge with appropriate styling based on its state (locked/unlocked) and journey.
 * Uses journey-specific theming from the journey context.
 */
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  showProgress = true,
  onPress
}) => {
  const { title, description, icon, journey } = achievement;
  const { progress, required } = achievement.progress;
  const { unlocked } = achievement;
  
  // Use the journey theme hook to get journey-specific colors
  const journeyTheme = useJourneyTheme();
  
  // Calculate progress percentage for accessibility
  const progressPercentage = required > 0 ? Math.round((progress / required) * 100) : 0;
  
  return (
    <BadgeContainer
      size={size}
      unlocked={unlocked}
      journey={journey}
      onPress={onPress}
      accessibilityLabel={`${title} achievement. ${description}. ${
        unlocked ? 'Unlocked' : `Progress: ${progress} of ${required}, ${progressPercentage}%`
      }`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress, checked: unlocked }}
      testID="achievement-badge-container"
    >
      <BadgeIcon
        name={icon}
        color={unlocked ? journeyTheme.primary : journeyTheme.getColorWithOpacity('primary', 30)}
        size={getBadgeSize(size) * 0.6}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
        testID="achievement-badge-icon"
      />
      
      {showProgress && !unlocked && (
        <ProgressRing
          progress={progress}
          total={required}
          color={journeyTheme.primary}
          size={getBadgeSize(size)}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
          testID="achievement-badge-progress"
        />
      )}
      
      {unlocked && (
        <UnlockedIndicator
          color={journeyTheme.primary}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
          testID="achievement-badge-unlocked"
        />
      )}
    </BadgeContainer>
  );
};