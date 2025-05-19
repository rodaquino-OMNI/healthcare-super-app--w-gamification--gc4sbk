/**
 * Gamification API client module
 * 
 * This module provides typed HTTP wrapper functions for interacting with the AUSTA SuperApp
 * gamification engine. It handles fetching user gamification data and submitting events
 * for processing by the gamification system.
 */

// Import types from the centralized @austa/interfaces package
import { Achievement } from '@austa/interfaces/gamification/achievements';
import { Quest } from '@austa/interfaces/gamification/quests';
import { Reward } from '@austa/interfaces/gamification/rewards';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { GamificationEvent } from '@austa/interfaces/gamification/events';

// Base API URL for gamification endpoints
const GAMIFICATION_API_BASE = '/api/gamification';

/**
 * Fetches the user's game profile containing level, XP, and other gamification data
 * 
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the user's GameProfile
 */
export async function getGameProfile(userId: string): Promise<GameProfile> {
  const response = await fetch(`${GAMIFICATION_API_BASE}/profiles/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch game profile: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Retrieves all achievements for a specific user
 * 
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to an array of Achievement objects
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const response = await fetch(`${GAMIFICATION_API_BASE}/achievements/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user achievements: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Retrieves all quests (active and completed) for a specific user
 * 
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to an array of Quest objects
 */
export async function getUserQuests(userId: string): Promise<Quest[]> {
  const response = await fetch(`${GAMIFICATION_API_BASE}/quests/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user quests: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Retrieves all rewards (available and redeemed) for a specific user
 * 
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to an array of Reward objects
 */
export async function getUserRewards(userId: string): Promise<Reward[]> {
  const response = await fetch(`${GAMIFICATION_API_BASE}/rewards/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user rewards: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Submits a gamification event to be processed by the gamification engine
 * Events can trigger achievements, quest progress, rewards, and XP gains
 * 
 * @param event - The gamification event to submit
 * @returns Promise resolving to the processing result
 */
export async function submitGamificationEvent(event: GamificationEvent): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${GAMIFICATION_API_BASE}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to submit gamification event: ${response.statusText}`);
  }
  
  return response.json();
}