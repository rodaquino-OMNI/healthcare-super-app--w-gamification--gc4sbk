import React from 'react';
import { useTheme } from 'styled-components';
import { useJourney } from '@austa/journey-context';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { XPCounter } from '../XPCounter/XPCounter';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
import { LevelIndicatorProps } from '@austa/interfaces/gamification';
import { Journey } from '@austa/interfaces/common';
import {
  LevelContainer,
  LevelText,
  LevelBadge,
  LevelInfo,
  LevelTitle,
  LevelProgress,
} from './LevelIndicator.styles';

/**
 * Helper function to get level title based on level number
 */
const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Iniciante';
  if (level < 10) return 'Aventureiro';
  if (level < 15) return 'Explorador';
  if (level < 20) return 'Especialista';
  if (level < 25) return 'Mestre';
  return 'Lendário';
};

/**
 * A component that displays the user's current level and progress towards the next level,
 * incorporating journey-specific theming.
 * 
 * @example
 * ```tsx
 * <LevelIndicator
 *   level={5}
 *   currentXp={1500}
 *   nextLevelXp={2000}
 *   journey="health"
 *   recentAchievement={{
 *     id: 'daily-goal',
 *     title: 'Meta Diária Completa',
 *     description: 'Complete sua meta diária',
 *     icon: 'trophy',
 *     progress: 1,
 *     total: 1,
 *     unlocked: true,
 *     journey: 'health'
 *   }}
 * />
 * ```
 */
export const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  level,
  currentXp,
  nextLevelXp,
  journey,
  recentAchievement,
}) => {
  // Get the current journey context if not explicitly provided
  const { currentJourney } = useJourney();
  const activeJourney = journey || currentJourney as Journey;
  
  const levelTitle = getLevelTitle(level);
  
  // Calculate XP needed for next level, ensuring it's not negative
  const xpNeeded = Math.max(0, nextLevelXp - currentXp);
  
  return (
    <LevelContainer 
      journey={activeJourney}
      aria-label={`Nível ${level} - ${levelTitle}. ${currentXp} de experiência atual. ${xpNeeded} pontos para o próximo nível.`}
    >
      <LevelText journey={activeJourney}>
        <LevelBadge journey={activeJourney}>{level}</LevelBadge>
        <LevelInfo>
          <LevelTitle>Nível</LevelTitle>
          {levelTitle}
        </LevelInfo>
      </LevelText>
      
      <LevelProgress>
        <XPCounter
          currentXP={currentXp}
          nextLevelXP={nextLevelXp}
          levelXP={0} // Assuming the start of the current level is 0 XP
          journey={activeJourney}
        />
      </LevelProgress>
      
      {recentAchievement && (
        <div role="status" aria-live="polite">
          <AchievementBadge
            achievement={recentAchievement}
            size="sm"
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