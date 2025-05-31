import React from 'react';
import { Card } from '../../components/Card/Card';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
import { LeaderboardProps } from '@austa/interfaces/gamification';
import { useJourney } from '@austa/journey-context/hooks';
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
 * It supports journey-specific theming and highlights the current user.
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboardData,
  journey: journeyProp
}) => {
  // Use journey context to get current journey if not explicitly provided
  const { journeyId } = useJourney();
  const journey = journeyProp || journeyId;

  return (
    <Card 
      journey={journey}
      accessibilityLabel="Leaderboard showing user rankings"
    >
      <LeaderboardHeader>
        <LeaderboardTitle journey={journey}>Classificação</LeaderboardTitle>
      </LeaderboardHeader>
      
      <LeaderboardList aria-label="Leaderboard rankings">
        {leaderboardData.map((item) => (
          <LeaderboardItem 
            key={item.userId}
            isCurrentUser={item.isCurrentUser}
            rank={item.rank}
            aria-label={`Rank ${item.rank}, ${item.username}, Score ${item.score}`}
          >
            <Rank 
              rank={item.rank} 
              aria-hidden="true"
            >
              {item.rank}
            </Rank>
            
            <UserInfo>
              <Username>{item.username}</Username>
              
              {item.achievement && (
                <AchievementBadge 
                  achievement={{
                    ...item.achievement,
                    journey
                  }}
                  size="sm"
                />
              )}
            </UserInfo>
            
            <Score 
              journey={journey}
              aria-label={`${item.score} experience points`}
            >
              {item.score} XP
            </Score>
          </LeaderboardItem>
        ))}
      </LeaderboardList>
    </Card>
  );
};