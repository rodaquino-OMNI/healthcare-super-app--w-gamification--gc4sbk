/**
 * @file gamification.ts
 * @description API client for interacting with the gamification service.
 * Provides functions to retrieve and update user gamification profiles.
 */

import { AxiosResponse } from 'axios'; // Version 1.6.8 with security enhancements
import { restClient } from './client';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  withErrorHandling,
  logError,
  withRetry,
  parseError
} from './errors';

/**
 * Validates user ID before making API requests
 * @param userId - The user ID to validate
 * @throws ValidationError if the user ID is invalid
 */
function validateUserId(userId: string): void {
  if (!userId) {
    throw new ValidationError({
      message: 'User ID is required',
      validationErrors: {
        userId: ['User ID is required']
      }
    });
  }

  if (typeof userId !== 'string') {
    throw new ValidationError({
      message: 'User ID must be a string',
      validationErrors: {
        userId: ['User ID must be a string']
      }
    });
  }
}

/**
 * Validates profile data before making update requests
 * @param profileData - The profile data to validate
 * @throws ValidationError if the profile data is invalid
 */
function validateProfileData(profileData: Partial<GameProfile>): void {
  if (!profileData || Object.keys(profileData).length === 0) {
    throw new ValidationError({
      message: 'Profile data is required',
      validationErrors: {
        profileData: ['Profile data cannot be empty']
      }
    });
  }

  // Validate specific fields if present
  if (profileData.level !== undefined && (typeof profileData.level !== 'number' || profileData.level < 0)) {
    throw new ValidationError({
      message: 'Invalid level value',
      validationErrors: {
        level: ['Level must be a non-negative number']
      }
    });
  }

  if (profileData.points !== undefined && (typeof profileData.points !== 'number' || profileData.points < 0)) {
    throw new ValidationError({
      message: 'Invalid points value',
      validationErrors: {
        points: ['Points must be a non-negative number']
      }
    });
  }

  if (profileData.streak !== undefined && (typeof profileData.streak !== 'number' || profileData.streak < 0)) {
    throw new ValidationError({
      message: 'Invalid streak value',
      validationErrors: {
        streak: ['Streak must be a non-negative number']
      }
    });
  }

  if (profileData.achievements !== undefined && !Array.isArray(profileData.achievements)) {
    throw new ValidationError({
      message: 'Invalid achievements value',
      validationErrors: {
        achievements: ['Achievements must be an array']
      }
    });
  }

  if (profileData.badges !== undefined && !Array.isArray(profileData.badges)) {
    throw new ValidationError({
      message: 'Invalid badges value',
      validationErrors: {
        badges: ['Badges must be an array']
      }
    });
  }
}

/**
 * Fetches the gamification profile for a given user ID.
 * Implements retry logic for transient errors and proper error handling.
 * 
 * @param userId - The ID of the user whose gamification profile to fetch
 * @returns A promise that resolves with the user's gamification profile
 * @throws ApiError with appropriate category and code based on the error type
 */
export const getGameProfile = withErrorHandling(
  async (userId: string): Promise<GameProfile> => {
    try {
      // Validate input
      validateUserId(userId);

      const endpoint = `/api/gamification/profiles/${userId}`;
      const response: AxiosResponse<GameProfile> = await restClient.get(endpoint);
      return response.data;
    } catch (error) {
      // Log the error with context
      logError(error, { userId, operation: 'getGameProfile' });

      // Parse and rethrow with appropriate type
      const parsedError = parseError(error);

      // Add specific handling for 404 errors
      if (parsedError instanceof NotFoundError) {
        throw new NotFoundError({
          message: `Gamification profile not found for user: ${userId}`,
          context: { userId },
          originalError: error instanceof Error ? error : undefined
        });
      }

      throw parsedError;
    }
  },
  // Use default circuit breaker
  undefined,
  // Custom retry options
  {
    maxRetries: 2,
    initialDelayMs: 200,
    backoffFactor: 1.5
  }
);

/**
 * Updates the gamification profile for a given user ID with the provided data.
 * Implements retry logic for transient errors and proper error handling.
 * 
 * @param userId - The ID of the user whose gamification profile to update
 * @param profileData - The partial gamification profile data to update
 * @returns A promise that resolves with the updated user's gamification profile
 * @throws ApiError with appropriate category and code based on the error type
 */
export const updateGameProfile = withErrorHandling(
  async (
    userId: string,
    profileData: Partial<GameProfile>
  ): Promise<GameProfile> => {
    try {
      // Validate input
      validateUserId(userId);
      validateProfileData(profileData);

      const endpoint = `/api/gamification/profiles/${userId}`;
      const response: AxiosResponse<GameProfile> = await restClient.patch(endpoint, profileData);
      return response.data;
    } catch (error) {
      // Log the error with context
      logError(error, { userId, profileData, operation: 'updateGameProfile' });

      // Parse and rethrow with appropriate type
      const parsedError = parseError(error);

      // Add specific handling for 404 errors
      if (parsedError instanceof NotFoundError) {
        throw new NotFoundError({
          message: `Gamification profile not found for user: ${userId}`,
          context: { userId, profileData },
          originalError: error instanceof Error ? error : undefined
        });
      }

      throw parsedError;
    }
  },
  // Use default circuit breaker
  undefined,
  // Custom retry options for updates (fewer retries to prevent duplicate updates)
  {
    maxRetries: 1,
    initialDelayMs: 300,
    backoffFactor: 2,
    // Only retry network errors, not validation or other client errors
    shouldRetry: (error) => {
      const parsedError = error instanceof ApiError ? error : parseError(error);
      return parsedError.isRetryable() && !parsedError.message.includes('validation');
    }
  }
);