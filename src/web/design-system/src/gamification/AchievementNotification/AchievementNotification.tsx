import React from 'react';
import { Box, Text } from '@design-system/primitives/components';
import { Achievement } from '@austa/interfaces/gamification/achievements';
import { AchievementBadge } from '../AchievementBadge';
import { useJourney } from '@austa/journey-context/src/hooks/useJourney';
import { Modal } from '../../components/Modal/Modal';
import { 
  AchievementContent, 
  BadgeContainer, 
  TextContainer, 
  DismissButton 
} from './AchievementNotification.styles';

/**
 * Props for the AchievementNotification component
 */
export interface AchievementNotificationProps {
  /**
   * The achievement to display in the notification
   */
  achievement: Achievement;
  
  /**
   * Whether the notification is visible
   */
  visible: boolean;
  
  /**
   * Callback function when the notification is closed
   */
  onClose: () => void;
  
  /**
   * Optional test ID for component testing
   */
  testID?: string;
}

/**
 * AchievementNotification component displays a modal notification when users unlock achievements.
 * It renders an AchievementBadge along with the achievement title and description,
 * and provides an OK button to dismiss the notification.
 *
 * @example
 * ```tsx
 * <AchievementNotification
 *   achievement={achievementData}
 *   visible={showNotification}
 *   onClose={() => setShowNotification(false)}
 * />
 * ```
 */
export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onClose,
  testID = 'achievement-notification',
}) => {
  // Get journey theme from the achievement's journey property
  const { getJourneyTheme } = useJourney();
  const journeyTheme = achievement.journey || 'health';
  
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      journeyTheme={journeyTheme}
      showCloseButton={false}
      closeOnClickOutside={false}
      aria-labelledby="achievement-title"
      aria-describedby="achievement-description"
      testID={testID}
    >
      <AchievementContent>
        <Box 
          marginBottom="md"
          aria-hidden="true"
        >
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color={theme => theme.colors.journeys[journeyTheme].primary}
          >
            Achievement Unlocked!
          </Text>
        </Box>
        
        <BadgeContainer>
          <AchievementBadge
            size="lg"
            unlocked={true}
            journey={journeyTheme}
            icon={achievement.icon}
            accessibilityLabel={`${achievement.title} achievement badge`}
          />
        </BadgeContainer>
        
        <TextContainer>
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            marginBottom="xs"
            id="achievement-title"
          >
            {achievement.title}
          </Text>
          <Text 
            fontSize="md" 
            color="gray.600"
            id="achievement-description"
          >
            {achievement.description}
          </Text>
          
          <Box marginTop="md">
            <Text 
              fontSize="md" 
              fontWeight="bold" 
              color={theme => theme.colors.journeys[journeyTheme].primary}
            >
              +{achievement.points} XP
            </Text>
          </Box>
        </TextContainer>
        
        <DismissButton
          journey={journeyTheme}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close achievement notification"
        >
          <Text color="white" fontWeight="medium">
            OK
          </Text>
        </DismissButton>
      </AchievementContent>
    </Modal>
  );
};

export default AchievementNotification;