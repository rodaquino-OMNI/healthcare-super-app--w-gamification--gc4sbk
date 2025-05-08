import { GameProfile } from '@app/gamification-engine/profiles/entities/game-profile.entity';
import { AppException } from '@austa/interfaces/common';
import { NotFoundException } from '@nestjs/common';

/**
 * Interface defining the contract for the ProfilesService.
 * This interface ensures consistent implementation of profile management operations
 * across the gamification engine and enables proper dependency injection with type safety.
 *
 * The ProfilesService is responsible for managing user game profiles, including creation,
 * retrieval, and updating of profile data. It integrates with the centralized error handling
 * framework to provide consistent error responses and retry mechanisms.
 *
 * @remarks
 * This interface is part of the enhanced error handling architecture that implements
 * centralized retry policies, fallback strategies, and circuit breakers. It also
 * supports the standardized module resolution across the monorepo using root tsconfig
 * path aliases and integrates with Redis Sorted Sets for improved leaderboard caching resilience.
 */
export interface IProfilesService {
  /**
   * Creates a new game profile for a user.
   * If a profile already exists for the user, returns the existing profile.
   *
   * @param userId - The unique identifier of the user for whom to create the profile
   * @returns A Promise resolving to the created or existing GameProfile
   * @throws AppException with type TECHNICAL if database operations fail
   * @throws AppException with type VALIDATION if userId is invalid
   */
  create(userId: string): Promise<GameProfile>;

  /**
   * Finds a game profile by user ID.
   * Includes related achievements and quests in the returned profile.
   *
   * @param userId - The unique identifier of the user whose profile to retrieve
   * @returns A Promise resolving to the GameProfile if found
   * @throws NotFoundException if no profile exists for the given userId
   * @throws AppException with type TECHNICAL if database operations fail
   */
  findById(userId: string): Promise<GameProfile>;
  
  /**
   * Finds multiple game profiles by an array of user IDs.
   * Useful for batch operations and leaderboard generation.
   * Includes related achievements and quests in the returned profiles.
   *
   * @param userIds - Array of user IDs to retrieve profiles for
   * @returns A Promise resolving to an array of GameProfiles
   * @throws AppException with type TECHNICAL if database operations fail
   */
  findByIds(userIds: string[]): Promise<GameProfile[]>;

  /**
   * Updates an existing game profile with the provided data.
   * Verifies the profile exists before attempting the update.
   *
   * @param userId - The unique identifier of the user whose profile to update
   * @param data - Partial GameProfile containing only the fields to update
   * @returns A Promise resolving to the updated GameProfile
   * @throws NotFoundException if no profile exists for the given userId
   * @throws AppException with type VALIDATION if the update data is invalid
   * @throws AppException with type TECHNICAL if database operations fail
   */
  update(userId: string, data: Partial<GameProfile>): Promise<GameProfile>;

  /**
   * Adds experience points to a user's profile and handles level progression.
   * This is a convenience method that builds on the update method.
   *
   * @param userId - The unique identifier of the user whose profile to update
   * @param xpAmount - The amount of experience points to add
   * @returns A Promise resolving to the updated GameProfile
   * @throws NotFoundException if no profile exists for the given userId
   * @throws AppException with type VALIDATION if xpAmount is negative
   * @throws AppException with type TECHNICAL if database operations fail
   */
  addExperiencePoints(userId: string, xpAmount: number): Promise<GameProfile>;

  /**
   * Resets a user's profile to a specified level and XP amount.
   * Useful for testing, seasonal resets, or administrative actions.
   *
   * @param userId - The unique identifier of the user whose profile to reset
   * @param newLevel - The new level to set (defaults to 1)
   * @param newXp - The new XP amount to set (defaults to 0)
   * @returns A Promise resolving to the reset GameProfile
   * @throws NotFoundException if no profile exists for the given userId
   * @throws AppException with type VALIDATION if newLevel is less than 1
   * @throws AppException with type TECHNICAL if database operations fail
   */
  resetProfile(userId: string, newLevel?: number, newXp?: number): Promise<GameProfile>;

  /**
   * Updates the metadata for a user's profile.
   * Merges the provided metadata with any existing metadata.
   *
   * @param userId - The unique identifier of the user whose profile to update
   * @param metadata - The metadata object to merge with existing metadata
   * @returns A Promise resolving to the updated GameProfile
   * @throws NotFoundException if no profile exists for the given userId
   * @throws AppException with type VALIDATION if metadata is invalid
   * @throws AppException with type TECHNICAL if database operations fail
   */
  updateMetadata(userId: string, metadata: Record<string, any>): Promise<GameProfile>;
}