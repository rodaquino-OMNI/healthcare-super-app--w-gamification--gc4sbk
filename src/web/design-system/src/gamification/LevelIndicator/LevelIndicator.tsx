import React from 'react';
// Import types from shared interfaces
import type { Achievement } from '@austa/interfaces/gamification';
import type { LevelIndicatorProps } from '@austa/interfaces/components/gamification.types';
// Import styled components from separate styles file
import {
  LevelContainer,
  LevelText,
  LevelProgress,
  LevelBadge,
  LevelInfo,
  LevelTitle
} from './LevelIndicator.styles';
// Import components
import { XPCounter } from '../XPCounter/XPCounter';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
// Import journey context hook
import { useJourney } from '@austa/journey-context';

/**
 * A component that displays the user's current level and progress towards the next level,
 * incorporating journey-specific theming.
 * 
 * @example
 * ```tsx
 * <LevelIndicator
 *   level={5}
 *   currentXP={1500}
 *   nextLevelXP={2000}
 *   journey="health"
 *   showXPValues={true}
 *   animate={true}
 *   size="md"
 *   recentAchievement={{
 *     id: 'daily-goal',
 *     title: 'Meta Diária Completa',
 *     description: 'Complete sua meta diária',
 *     icon: 'trophy',
 *     category: 'health',
 *     points: 100,
 *     rarity: 'common',
 *     imageUrl: '/images/achievements/daily-goal.png',
 *     badgeUrl: '/images/badges/daily-goal.png',
 *     tier: 1,
 *     progress: {
 *       current: 1,
 *       required: 1,
 *       percentage: 100,
 *       lastUpdated: new Date()
 *     },
 *     unlocked: true,
 *     unlockedAt: new Date(),
 *     journey: 'health'
 *   }}
 * />
 * ```
 */
export const LevelIndicator: React.FC<LevelIndicatorProps & { recentAchievement?: Achievement }> = ({
  level,
  currentXP,
  nextLevelXP,
  journey,
  showXPValues = true,
  animate = true,
  onPress,
  showLevelUpAnimation = false,
  levelLabel,
  recentAchievement,
  className,
  testID,
  size = 'md',
  animationState = 'idle',
}) => {
  // Use journey context to get theme information
  const { getJourneyTheme } = useJourney();
  
  // Get level title based on level
  const getLevelTitle = (level: number): string => {
    if (levelLabel) return levelLabel;
    if (level < 5) return 'Iniciante';
    if (level < 10) return 'Aventureiro';
    if (level < 15) return 'Explorador';
    if (level < 20) return 'Especialista';
    if (level < 25) return 'Mestre';
    return 'Lendário';
  };
  
  const levelTitle = getLevelTitle(level);
  
  // Calculate XP needed for next level, ensuring it's not negative
  const xpNeeded = Math.max(0, nextLevelXP - currentXP);
  
  // Handle click/press event
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <LevelContainer 
      journey={journey}
      onClick={handlePress}
      className={className}
      data-testid={testID}
      aria-label={`Nível ${level} - ${levelTitle}. ${currentXP} pontos de experiência atual. ${xpNeeded} pontos necessários para o próximo nível.`}
    >
      <LevelText journey={journey}>
        <LevelBadge journey={journey}>{level}</LevelBadge>
        <LevelInfo>
          <LevelTitle>Nível</LevelTitle>
          {levelTitle}
        </LevelInfo>
      </LevelText>
      
      <LevelProgress>
        <XPCounter
          currentXP={currentXP}
          nextLevelXP={nextLevelXP}
          journey={journey}
          showProgressBar={true}
          animate={animate}
          size={size}
        />
      </LevelProgress>
      
      {recentAchievement && showLevelUpAnimation && (
        <div 
          aria-live="polite" 
          role="status"
          className={`achievement-notification ${animationState === 'active' ? 'animate' : ''}`}
        >
          <AchievementBadge
            achievement={recentAchievement}
            size="sm"
            showNotification={true}
          />
          <span>
            Nova conquista: {recentAchievement.title}
          </span>
        </div>
      )}
    </LevelContainer>
  );
};

export default LevelIndicator;