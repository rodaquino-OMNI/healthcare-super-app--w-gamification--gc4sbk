import React from 'react';
import { Box, Text } from '@design-system/primitives';
import { Card } from '../../components/Card';
import { AchievementBadge } from '../AchievementBadge';
import { LeaderboardProps } from '@austa/interfaces/gamification';
import { useJourneyContext } from '@austa/journey-context/hooks';
import {
  LeaderboardContainer,
  LeaderboardHeader,
  LeaderboardTitle,
  LeaderboardList,
  LeaderboardItem,
  Rank,
  UserInfo,
  Username,
  Score
} from './Leaderboard.styles';

/**
 * A component that displays a leaderboard with user rankings.
 * This component is part of the gamification system and shows users ranked by score or XP.
 * Supports journey-specific theming and highlights the current user.
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboardData,
  journey: propJourney
}) => {
  // Use journey context to get current journey if not explicitly provided
  const { currentJourney } = useJourneyContext();
  const journey = propJourney || currentJourney;

  return (
    <Card journey={journey}>
      <LeaderboardHeader>
        <LeaderboardTitle>Classificação</LeaderboardTitle>
      </LeaderboardHeader>
      
      <LeaderboardList aria-label="Leaderboard rankings">
        {leaderboardData.map((item) => (
          <LeaderboardItem 
            key={item.userId}
            isCurrentUser={item.isCurrentUser}
            journey={journey}
            aria-label={`Rank ${item.rank}, ${item.username}, Score ${item.score}`}
          >
            <Rank aria-hidden="true">{item.rank}</Rank>
            
            <UserInfo>
              <Username>{item.username}</Username>
              
              {item.achievement && (
                <AchievementBadge 
                  achievement={{
                    ...item.achievement,
                    journey
                  }}
                  size="sm"
                  aria-label={`${item.username}'s achievement: ${item.achievement.title}`}
                />
              )}
            </UserInfo>
            
            <Score aria-label={`${item.score} XP`}>{item.score} XP</Score>
          </LeaderboardItem>
        ))}
      </LeaderboardList>
    </Card>
  );
};