import React from 'react';
import { useTheme } from 'styled-components';
import { XPCounterProps } from '@austa/interfaces/gamification/xp';
import { useJourney } from '@austa/journey-context';
import { XPContainer, XPLabel, XPRemaining } from './XPCounter.styles';
import { ProgressBar } from '../../components/ProgressBar';

/**
 * Calculates the remaining XP needed to reach the next level
 * @param currentXP Current XP value
 * @param nextLevelXP XP threshold for the next level
 * @returns The amount of XP remaining to reach the next level
 */
export const calculateRemainingXP = (currentXP: number, nextLevelXP: number): number => {
  const remaining = nextLevelXP - currentXP;
  return remaining > 0 ? remaining : 0;
};

/**
 * Calculates the progress percentage towards the next level
 * @param currentXP Current XP value
 * @param levelXP XP threshold for the current level
 * @param nextLevelXP XP threshold for the next level
 * @returns Percentage of progress towards the next level (0-100)
 */
export const calculateProgress = (currentXP: number, levelXP: number, nextLevelXP: number): number => {
  const totalXPForLevel = nextLevelXP - levelXP;
  if (totalXPForLevel <= 0) return 100; // Avoid division by zero
  
  const progressInLevel = currentXP - levelXP;
  let percentage = (progressInLevel / totalXPForLevel) * 100;
  
  // Clamp the value between 0 and 100
  percentage = Math.min(Math.max(percentage, 0), 100);
  
  return percentage;
};

/**
 * A component that displays the user's XP progress with journey-specific theming
 */
export const XPCounter: React.FC<XPCounterProps> = ({
  currentXP,
  nextLevelXP,
  levelXP = 0,
  level,
  journey,
  className,
  testId,
}) => {
  const theme = useTheme();
  // Use journey context when journey prop is not explicitly provided
  const { journeyId } = useJourney();
  
  // Use provided journey or fallback to current journey from context
  const activeJourney = journey || journeyId;
  
  // Calculate remaining XP and progress percentage
  const remainingXP = calculateRemainingXP(currentXP, nextLevelXP);
  const progress = calculateProgress(currentXP, levelXP, nextLevelXP);
  
  return (
    <XPContainer 
      className={className} 
      data-testid={testId}
      aria-label={level ? `Level ${level}: ${currentXP} XP, ${remainingXP} XP to next level` : `${currentXP} XP, ${remainingXP} XP to next level`}
    >
      <XPLabel journey={activeJourney as 'health' | 'care' | 'plan'}>
        {currentXP} XP
      </XPLabel>
      
      <XPRemaining>
        {remainingXP} XP para o próximo nível
      </XPRemaining>
      
      <ProgressBar 
        current={currentXP - levelXP}
        total={nextLevelXP - levelXP}
        journey={activeJourney as 'health' | 'care' | 'plan'}
        ariaLabel={`${Math.round(progress)}% progress to next level. ${remainingXP} XP remaining.`}
        size="md"
        testId={testId ? `${testId}-progress` : undefined}
      />
    </XPContainer>
  );
};

export default XPCounter;