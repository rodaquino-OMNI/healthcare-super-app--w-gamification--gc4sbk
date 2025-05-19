import { useQuery, ApolloError } from '@apollo/client'; // v3.8.10
import { 
  GameProfile, 
  Achievement, 
  Quest, 
  Reward 
} from '@austa/interfaces/gamification';
import { 
  GET_GAME_PROFILE, 
  GET_ACHIEVEMENTS, 
  GET_QUESTS, 
  GET_REWARDS 
} from 'src/web/shared/graphql/queries/gamification.queries';
import { useAuth, useJourney } from '@austa/journey-context';

/**
 * Custom hook that fetches and provides the game profile for the currently authenticated user.
 * Integrates with journey context to provide journey-aware error handling.
 * 
 * @returns The user's game profile, loading state, and error state
 */
export function useGameProfile(): { 
  gameProfile: GameProfile | undefined; 
  loading: boolean; 
  error: ApolloError | undefined 
} {
  const { userId } = useAuth();
  const { currentJourney } = useJourney();
  
  const { data, loading, error } = useQuery(GET_GAME_PROFILE, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      // Journey-aware error logging
      console.error(`[${currentJourney}] Error fetching game profile:`, error);
    }
  });
  
  return { 
    gameProfile: data?.gameProfile, 
    loading, 
    error 
  };
}

/**
 * Custom hook that fetches and provides the achievements for the currently authenticated user.
 * Can be filtered by journey when a journey parameter is provided.
 * 
 * @param journey Optional journey ID to filter achievements by journey
 * @returns The user's achievements, loading state, and error state
 */
export function useAchievements(journey?: string): { 
  achievements: Achievement[] | undefined; 
  loading: boolean; 
  error: ApolloError | undefined 
} {
  const { userId } = useAuth();
  const { currentJourney } = useJourney();
  
  const { data, loading, error } = useQuery(GET_ACHIEVEMENTS, {
    variables: { 
      userId,
      journey: journey || undefined
    },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      // Journey-aware error logging
      console.error(`[${currentJourney}] Error fetching achievements:`, error);
    }
  });
  
  return { 
    achievements: data?.achievements, 
    loading, 
    error 
  };
}

/**
 * Custom hook that fetches and provides the quests for the currently authenticated user.
 * Can be filtered by journey and completion status.
 * 
 * @param journey Optional journey ID to filter quests by journey
 * @param completed Optional boolean to filter quests by completion status
 * @returns The user's quests, loading state, and error state
 */
export function useQuests(journey?: string, completed?: boolean): { 
  quests: Quest[] | undefined; 
  loading: boolean; 
  error: ApolloError | undefined 
} {
  const { userId } = useAuth();
  const { currentJourney } = useJourney();
  
  const { data, loading, error } = useQuery(GET_QUESTS, {
    variables: { 
      userId,
      journey: journey || undefined,
      completed
    },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      // Journey-aware error logging
      console.error(`[${currentJourney}] Error fetching quests:`, error);
    }
  });
  
  return { 
    quests: data?.quests, 
    loading, 
    error 
  };
}

/**
 * Custom hook that fetches and provides the rewards for the currently authenticated user.
 * Can be filtered by journey when a journey parameter is provided.
 * 
 * @param journey Optional journey ID to filter rewards by journey
 * @returns The user's rewards, loading state, and error state
 */
export function useRewards(journey?: string): { 
  rewards: Reward[] | undefined; 
  loading: boolean; 
  error: ApolloError | undefined 
} {
  const { userId } = useAuth();
  const { currentJourney } = useJourney();
  
  const { data, loading, error } = useQuery(GET_REWARDS, {
    variables: { 
      userId,
      journey: journey || undefined
    },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      // Journey-aware error logging
      console.error(`[${currentJourney}] Error fetching rewards:`, error);
    }
  });
  
  return { 
    rewards: data?.rewards, 
    loading, 
    error 
  };
}