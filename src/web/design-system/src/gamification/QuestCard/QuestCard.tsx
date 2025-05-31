import React from 'react';
import { Text, Icon } from '@design-system/primitives';
import { Card } from '../../../components/Card';
import { ProgressBar } from '../../../components/ProgressBar';
import { Quest, QuestStatus } from '@austa/interfaces/gamification';
import { useTheme } from 'styled-components';

/**
 * Props for the QuestCard component
 */
interface QuestCardProps {
  /** Quest data to display */
  quest: Quest;
  /** Optional click handler for the card */
  onPress?: () => void;
  /** Optional additional CSS class name */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Custom hook to get journey-specific theme values
 */
const useJourneyTheme = (journey: string) => {
  const theme = useTheme();
  
  // Get journey-specific colors from theme
  const journeyTheme = theme.colors.journeys[journey] || theme.colors.journeys.health;
  
  return {
    primaryColor: journeyTheme.primary,
    secondaryColor: journeyTheme.secondary,
    backgroundColor: journeyTheme.background,
    textColor: journeyTheme.text
  };
};

/**
 * QuestCard component for displaying gamification quests with progress tracking
 * and journey-specific styling.
 * 
 * @example
 * ```tsx
 * <QuestCard 
 *   quest={{
 *     id: '123',
 *     title: 'Daily Steps',
 *     description: 'Walk 10,000 steps today',
 *     journey: 'health',
 *     icon: 'steps',
 *     progress: 7500,
 *     total: 10000,
 *     category: QuestCategory.DAILY,
 *     status: QuestStatus.ACTIVE,
 *     deadline: new Date('2025-06-01'),
 *     xpReward: 100
 *   }}
 *   onPress={() => console.log('Quest card clicked')}
 * />
 * ```
 */
export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onPress,
  className,
  testId,
}) => {
  const { 
    id, 
    title, 
    description, 
    journey, 
    icon, 
    progress, 
    total, 
    status 
  } = quest;
  
  const isCompleted = status === QuestStatus.COMPLETED;
  const journeyTheme = useJourneyTheme(journey);
  
  // Calculate progress percentage for accessibility label
  const progressPercentage = Math.round((progress / total) * 100);
  const accessibilityLabel = `${title}. ${description}. Progress: ${progressPercentage}%. ${isCompleted ? 'Completed' : ''}`;
  
  return (
    <Card
      journey={journey}
      onPress={onPress}
      interactive={!!onPress}
      elevation={isCompleted ? 'md' : 'sm'}
      padding="md"
      className={className}
      data-testid={testId || 'quest-card'}
      accessibilityLabel={accessibilityLabel}
      aria-busy={status === QuestStatus.ACTIVE}
      aria-disabled={status === QuestStatus.LOCKED}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: journeyTheme.backgroundColor,
            marginRight: '12px'
          }}
          aria-hidden="true"
        >
          <Icon 
            name={icon} 
            size="24px" 
            color={journeyTheme.primaryColor} 
            aria-hidden="true"
          />
        </div>
        
        <div style={{ flex: 1 }}>
          <Text 
            as="h3" 
            fontSize="md" 
            fontWeight="bold"
            color={journeyTheme.textColor}
            aria-label={title}
          >
            {title}
          </Text>
          
          <Text 
            fontSize="sm" 
            color="neutral.gray600"
            aria-label={description}
          >
            {description}
          </Text>
        </div>
        
        {isCompleted && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: journeyTheme.primaryColor,
              marginLeft: '8px'
            }}
            aria-label="Achievement completed"
            role="img"
          >
            <Icon 
              name="check" 
              size="20px" 
              color="#FFFFFF" 
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      
      <ProgressBar 
        current={progress} 
        total={total} 
        journey={journey} 
        size="sm"
        ariaLabel={`Quest progress: ${progressPercentage}%`}
        testId={`quest-progress-${id}`}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <Text 
          fontSize="xs" 
          color="neutral.gray500"
          aria-label={`${progress} of ${total} completed`}
        >
          {progress} / {total}
        </Text>
        
        <Text 
          fontSize="xs" 
          fontWeight="bold" 
          color={journeyTheme.primaryColor}
          aria-label={`Reward: ${quest.xpReward} XP`}
        >
          +{quest.xpReward} XP
        </Text>
      </div>
    </Card>
  );
};

export default QuestCard;