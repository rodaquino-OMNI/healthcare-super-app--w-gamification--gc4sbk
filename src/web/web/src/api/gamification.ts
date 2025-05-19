/**
 * Gamification API
 * 
 * This module provides functions for interacting with the gamification engine
 * of the AUSTA SuperApp. It includes methods for retrieving user game profiles,
 * achievements, quests, and rewards.
 */

import axios from 'axios';
import { 
  GameProfile, 
  Achievement, 
  Quest, 
  Reward,
  GamificationEventType,
  GamificationEvent,
  GamificationEventResponse
} from '@austa/interfaces/api/gamification.api';
import { ApiErrorResponse } from '@austa/interfaces/api/error.types';
import { GAMIFICATION_API } from '@austa/interfaces/api/constants';

/**
 * Base URL for the gamification API endpoints
 */
const GAMIFICATION_API_URL = GAMIFICATION_API.BASE_PATH;

/**
 * Retrieves the user's game profile from the gamification engine.
 * 
 * @param userId - The unique identifier of the user
 * @returns A promise that resolves to the user's game profile
 */
export const getGameProfile = async (userId: string): Promise<GameProfile> => {
  try {
    const response = await axios.get<GameProfile>(`${GAMIFICATION_API_URL}${GAMIFICATION_API.ENDPOINTS.PROFILES}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch game profile:', error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || 'Failed to retrieve game profile. Please try again later.');
  }
};

/**
 * Retrieves all achievements for a user.
 * 
 * @param userId - The unique identifier of the user
 * @returns A promise that resolves to an array of achievements
 */
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const response = await axios.get<Achievement[]>(`${GAMIFICATION_API_URL}/users/${userId}${GAMIFICATION_API.ENDPOINTS.ACHIEVEMENTS}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user achievements:', error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || 'Failed to retrieve achievements. Please try again later.');
  }
};

/**
 * Retrieves all active and completed quests for a user.
 * 
 * @param userId - The unique identifier of the user
 * @returns A promise that resolves to an array of quests
 */
export const getUserQuests = async (userId: string): Promise<Quest[]> => {
  try {
    const response = await axios.get<Quest[]>(`${GAMIFICATION_API_URL}/users/${userId}${GAMIFICATION_API.ENDPOINTS.QUESTS}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user quests:', error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || 'Failed to retrieve quests. Please try again later.');
  }
};

/**
 * Retrieves all rewards earned by a user.
 * 
 * @param userId - The unique identifier of the user
 * @returns A promise that resolves to an array of rewards
 */
export const getUserRewards = async (userId: string): Promise<Reward[]> => {
  try {
    const response = await axios.get<Reward[]>(`${GAMIFICATION_API_URL}/users/${userId}${GAMIFICATION_API.ENDPOINTS.REWARDS}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user rewards:', error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || 'Failed to retrieve rewards. Please try again later.');
  }
};

/**
 * Retrieves journey-specific achievements for a user.
 * 
 * @param userId - The unique identifier of the user
 * @param journey - The journey identifier (health, care, plan)
 * @returns A promise that resolves to an array of journey-specific achievements
 */
export const getJourneyAchievements = async (userId: string, journey: string): Promise<Achievement[]> => {
  try {
    const response = await axios.get<Achievement[]>(`${GAMIFICATION_API_URL}/users/${userId}/journeys/${journey}${GAMIFICATION_API.ENDPOINTS.ACHIEVEMENTS}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${journey} journey achievements:`, error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || `Failed to retrieve ${journey} journey achievements. Please try again later.`);
  }
};

/**
 * Acknowledges an achievement notification as seen by the user.
 * 
 * @param userId - The unique identifier of the user
 * @param achievementId - The unique identifier of the achievement
 * @returns A promise that resolves when the achievement is acknowledged
 */
export const acknowledgeAchievement = async (userId: string, achievementId: string): Promise<void> => {
  try {
    await axios.post(`${GAMIFICATION_API_URL}/users/${userId}${GAMIFICATION_API.ENDPOINTS.ACHIEVEMENTS}/${achievementId}/acknowledge`);
  } catch (error) {
    console.error('Failed to acknowledge achievement:', error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || 'Failed to acknowledge achievement. Please try again later.');
  }
};

/**
 * Triggers a gamification event based on user action.
 * This is used to record user actions that may lead to achievements.
 * 
 * @param userId - The unique identifier of the user
 * @param eventType - The type of event that occurred
 * @param eventData - Additional data related to the event
 * @returns A promise that resolves to any new achievements or rewards triggered by the event
 */
export const triggerGamificationEvent = async (
  userId: string, 
  eventType: GamificationEventType, 
  eventData: Record<string, any>
): Promise<GamificationEventResponse> => {
  try {
    const event: GamificationEvent = {
      userId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      journeyId: eventData.journeyId // Include journey context if available
    };
    
    const response = await axios.post<GamificationEventResponse>(
      `${GAMIFICATION_API_URL}${GAMIFICATION_API.ENDPOINTS.EVENTS}`, 
      event
    );
    return response.data;
  } catch (error) {
    console.error('Failed to trigger gamification event:', error);
    const apiError = error as ApiErrorResponse;
    throw new Error(apiError.message || 'Failed to record your activity. Please try again later.');
  }
};

export default {
  getGameProfile,
  getUserAchievements,
  getUserQuests,
  getUserRewards,
  getJourneyAchievements,
  acknowledgeAchievement,
  triggerGamificationEvent
};