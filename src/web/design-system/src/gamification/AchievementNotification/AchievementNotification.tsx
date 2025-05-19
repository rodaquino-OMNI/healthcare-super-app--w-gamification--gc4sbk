import React from 'react';
import { Text } from '@design-system/primitives/src/components';
import { AchievementBadge } from '../AchievementBadge';
import { Achievement } from '@austa/interfaces/gamification/achievements';
import { useJourney } from '@austa/journey-context/src/hooks';
import { colors } from '@design-system/primitives/src/tokens';
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  AchievementTitle,
  AchievementDescription,
  DismissButton,
  BadgeContainer
} from './AchievementNotification.styles';

export interface AchievementNotificationProps {
  /**
   * The achievement to display in the notification
   */
  achievement: Achievement;
  /**
   * Callback function called when the notification is dismissed
   */
  onDismiss: () => void;
  /**
   * Whether the notification is visible
   * @default true
   */
  isVisible?: boolean;
}

/**
 * AchievementNotification component
 * 
 * Displays a modal notification when users unlock achievements.
 * Shows the achievement badge, title, and description with journey-specific theming.
 * 
 * @example
 * ```tsx
 * <AchievementNotification 
 *   achievement={achievement}
 *   onDismiss={() => setShowNotification(false)}
 * />
 * ```
 */
export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  isVisible = true,
}) => {
  const { activeJourney } = useJourney();
  const journeyKey = achievement.journey || activeJourney;
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  // Get journey-specific color
  const getJourneyColor = () => {
    switch (journeyKey) {
      case 'health':
        return colors.journeys.health.primary;
      case 'care':
        return colors.journeys.care.primary;
      case 'plan':
        return colors.journeys.plan.primary;
      default:
        return colors.journeys.health.primary;
    }
  };

  const journeyColor = getJourneyColor();

  return (
    <ModalOverlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-title"
      aria-describedby="achievement-description"
    >
      <ModalContent journeyColor={journeyColor}>
        <ModalTitle as="h2" journeyColor={journeyColor}>
          Achievement Unlocked!
        </ModalTitle>
        
        <BadgeContainer>
          <AchievementBadge
            size="lg"
            unlocked={true}
            journey={journeyKey}
            icon={achievement.icon}
          />
        </BadgeContainer>
        
        <AchievementTitle as="h3" id="achievement-title">
          {achievement.title}
        </AchievementTitle>
        
        <AchievementDescription as="p" id="achievement-description">
          {achievement.description}
        </AchievementDescription>
        
        <DismissButton
          as="button"
          journeyColor={journeyColor}
          onClick={onDismiss}
          aria-label="Close achievement notification"
        >
          OK
        </DismissButton>
      </ModalContent>
    </ModalOverlay>
  );
};