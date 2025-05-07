/**
 * Gamification Resolvers
 * 
 * This file implements GraphQL resolvers for the cross-journey gamification engine,
 * including achievements, quests, rewards, leaderboards, and profiles.
 * 
 * Unlike other resolvers, this module exports a resolver map directly, not a factory function.
 */

// Import standardized interfaces for type safety
import {
  Achievement,
  UserAchievement,
  Quest,
  UserQuest,
  Reward,
  UserReward,
  GameProfile,
  LeaderboardEntry,
  GamificationEvent,
  EventType
} from '@austa/interfaces/gamification';

// Import journey-specific interfaces
import {
  HealthEventPayload,
  CareEventPayload,
  PlanEventPayload
} from '@austa/interfaces/gamification/events';

// Import GraphQL scalars and types
import { GraphQLError } from 'graphql';

// Import services using standardized path resolution
import { GamificationService } from '@app/gamification';
import { EventProcessingService } from '@app/gamification/events';
import { DeadLetterService } from '@app/gamification/events/dlq';

// Initialize services
const gamificationService = new GamificationService();
const eventProcessingService = new EventProcessingService();
const deadLetterService = new DeadLetterService();

/**
 * Error handling wrapper for resolvers
 * Implements retry logic for event processing failures
 */
const withErrorHandling = async <T>(resolver: () => Promise<T>, context: any): Promise<T> => {
  try {
    return await resolver();
  } catch (error) {
    console.error('Gamification resolver error:', error);
    
    // Check if this is an event processing error that can be retried
    if (error.name === 'EventProcessingError' && context.event) {
      try {
        // Attempt to retry the event processing with exponential backoff
        await eventProcessingService.retryEventProcessing(context.event, {
          maxRetries: 3,
          backoffFactor: 2,
          initialDelayMs: 1000
        });
        
        // If retry succeeds, return the result
        return await resolver();
      } catch (retryError) {
        // If retry fails, send to dead letter queue
        await deadLetterService.sendToDeadLetterQueue(context.event, retryError);
        throw new GraphQLError('Event processing failed after retries', {
          extensions: {
            code: 'EVENT_PROCESSING_FAILED',
            retryError
          }
        });
      }
    }
    
    // For other errors, throw a GraphQL error
    throw new GraphQLError(error.message || 'An unexpected error occurred', {
      extensions: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        originalError: error
      }
    });
  }
};

/**
 * Gamification Resolvers
 * Static resolver object that implements all GraphQL queries and mutations
 * for the cross-journey gamification engine
 */
export const gamificationResolvers = {
  Query: {
    // Achievement queries
    achievements: async (_: any, args: { journeyType?: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getAchievements(args.journeyType);
      }, context);
    },
    
    achievement: async (_: any, args: { id: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getAchievementById(args.id);
      }, context);
    },
    
    userAchievements: async (_: any, args: { userId: string, journeyType?: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserAchievements(args.userId, args.journeyType);
      }, context);
    },
    
    // Quest queries
    quests: async (_: any, args: { journeyType?: string, status?: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getQuests(args.journeyType, args.status);
      }, context);
    },
    
    quest: async (_: any, args: { id: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getQuestById(args.id);
      }, context);
    },
    
    userQuests: async (_: any, args: { userId: string, status?: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserQuests(args.userId, args.status);
      }, context);
    },
    
    // Reward queries
    rewards: async (_: any, args: { journeyType?: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getRewards(args.journeyType);
      }, context);
    },
    
    reward: async (_: any, args: { id: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getRewardById(args.id);
      }, context);
    },
    
    userRewards: async (_: any, args: { userId: string, claimed?: boolean }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserRewards(args.userId, args.claimed);
      }, context);
    },
    
    // Leaderboard queries
    leaderboard: async (_: any, args: { journeyType?: string, limit?: number, offset?: number }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getLeaderboard({
          journeyType: args.journeyType,
          limit: args.limit || 10,
          offset: args.offset || 0
        });
      }, context);
    },
    
    userRank: async (_: any, args: { userId: string, journeyType?: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserRank(args.userId, args.journeyType);
      }, context);
    },
    
    // Profile queries
    gameProfile: async (_: any, args: { userId: string }, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getGameProfile(args.userId);
      }, context);
    },
    
    // Dead letter queue queries
    failedEvents: async (_: any, args: { limit?: number, offset?: number }, context: any) => {
      // Admin-only query for monitoring failed events
      if (!context.user || !context.user.roles.includes('ADMIN')) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' }
        });
      }
      
      return withErrorHandling(async () => {
        return deadLetterService.getFailedEvents(args.limit || 10, args.offset || 0);
      }, context);
    }
  },
  
  Mutation: {
    // Process gamification event
    processEvent: async (_: any, args: { event: GamificationEvent }, context: any) => {
      // Add event to context for retry handling
      context.event = args.event;
      
      return withErrorHandling(async () => {
        // Validate event using type-safe interfaces
        if (!args.event.type || !Object.values(EventType).includes(args.event.type as EventType)) {
          throw new GraphQLError('Invalid event type', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        
        // Process the event with retry capability
        const result = await eventProcessingService.processEvent(args.event);
        
        return {
          success: true,
          message: 'Event processed successfully',
          achievements: result.achievements,
          quests: result.quests,
          rewards: result.rewards,
          xpEarned: result.xpEarned
        };
      }, context);
    },
    
    // Claim a reward
    claimReward: async (_: any, args: { userId: string, rewardId: string }, context: any) => {
      return withErrorHandling(async () => {
        const result = await gamificationService.claimReward(args.userId, args.rewardId);
        
        return {
          success: result.success,
          message: result.message,
          reward: result.reward
        };
      }, context);
    },
    
    // Retry a failed event from the dead letter queue
    retryFailedEvent: async (_: any, args: { eventId: string }, context: any) => {
      // Admin-only mutation for managing failed events
      if (!context.user || !context.user.roles.includes('ADMIN')) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' }
        });
      }
      
      return withErrorHandling(async () => {
        const result = await deadLetterService.retryFailedEvent(args.eventId);
        
        return {
          success: result.success,
          message: result.message
        };
      }, context);
    },
    
    // Purge a failed event from the dead letter queue
    purgeFailedEvent: async (_: any, args: { eventId: string }, context: any) => {
      // Admin-only mutation for managing failed events
      if (!context.user || !context.user.roles.includes('ADMIN')) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' }
        });
      }
      
      return withErrorHandling(async () => {
        const result = await deadLetterService.purgeFailedEvent(args.eventId);
        
        return {
          success: result.success,
          message: result.message
        };
      }, context);
    }
  },
  
  // Type resolvers
  Achievement: {
    // Resolve related quests for an achievement
    relatedQuests: async (parent: Achievement, _: any, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getQuestsByAchievementId(parent.id);
      }, context);
    }
  },
  
  Quest: {
    // Resolve related achievements for a quest
    relatedAchievements: async (parent: Quest, _: any, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getAchievementsByQuestId(parent.id);
      }, context);
    }
  },
  
  GameProfile: {
    // Resolve achievements for a game profile
    achievements: async (parent: GameProfile, _: any, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserAchievements(parent.userId);
      }, context);
    },
    
    // Resolve quests for a game profile
    quests: async (parent: GameProfile, _: any, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserQuests(parent.userId);
      }, context);
    },
    
    // Resolve rewards for a game profile
    rewards: async (parent: GameProfile, _: any, context: any) => {
      return withErrorHandling(async () => {
        return gamificationService.getUserRewards(parent.userId);
      }, context);
    }
  },
  
  // Union type resolvers for event payloads
  EventPayload: {
    __resolveType(obj: any) {
      if (obj.healthMetricId) return 'HealthEventPayload';
      if (obj.appointmentId) return 'CareEventPayload';
      if (obj.claimId) return 'PlanEventPayload';
      return null;
    }
  }
};