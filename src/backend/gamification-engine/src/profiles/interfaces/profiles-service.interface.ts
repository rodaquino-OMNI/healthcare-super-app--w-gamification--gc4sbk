import { NotFoundException } from '@nestjs/common';
import { GameProfile } from '@app/gamification-engine/profiles/entities/game-profile.entity';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Interface defining the contract for the ProfilesService.
 * This interface ensures consistent implementation across the application
 * and enables dependency injection with proper typing.
 *
 * The ProfilesService manages user game profiles, handling operations related to
 * creation, retrieval, and updating of game profile data with enhanced error handling
 * and retry mechanisms.
 */
export interface IProfilesService {
  /**
   * Creates a new game profile for a user.
   * Implements retry policies for database connection issues.
   *
   * @param userId - The user ID for whom to create the profile
   * @returns A promise that resolves to the created game profile
   * @throws {AppException} If profile creation fails due to database errors
   */
  create(userId: string): Promise<GameProfile>;

  /**
   * Finds a game profile by user ID.
   * Implements caching with Redis Sorted Sets for improved performance.
   *
   * @param userId - The user ID to find the profile for
   * @returns A promise that resolves to the game profile
   * @throws {NotFoundException} If the profile does not exist
   * @throws {AppException} If retrieval fails due to database errors
   */
  findById(userId: string): Promise<GameProfile>;

  /**
   * Updates an existing game profile.
   * Implements circuit breaker pattern for database resilience.
   *
   * @param userId - The user ID of the profile to update
   * @param data - The partial profile data to update
   * @returns A promise that resolves to the updated game profile
   * @throws {NotFoundException} If the profile does not exist
   * @throws {AppException} If update fails due to validation or database errors
   */
  update(userId: string, data: Partial<GameProfile>): Promise<GameProfile>;

  /**
   * Adds experience points to a user's profile and handles level progression.
   * Implements fallback strategies if the primary update fails.
   *
   * @param userId - The user ID of the profile to update
   * @param amount - The amount of XP to add (must be positive)
   * @returns A promise that resolves to a boolean indicating if the user leveled up
   * @throws {NotFoundException} If the profile does not exist
   * @throws {AppException} If the operation fails due to validation or database errors
   */
  addXp(userId: string, amount: number): Promise<boolean>;

  /**
   * Retrieves profiles for the leaderboard with optimized caching.
   * Uses Redis Sorted Sets for efficient leaderboard queries.
   *
   * @param limit - Maximum number of profiles to retrieve (default: 10)
   * @param offset - Number of profiles to skip (default: 0)
   * @returns A promise that resolves to an array of game profiles sorted by XP
   * @throws {AppException} If retrieval fails due to database or cache errors
   */
  getLeaderboard(limit?: number, offset?: number): Promise<GameProfile[]>;

  /**
   * Resets a user's progress to default values.
   * Used for testing or administrative purposes.
   *
   * @param userId - The user ID of the profile to reset
   * @returns A promise that resolves to the reset game profile
   * @throws {NotFoundException} If the profile does not exist
   * @throws {AppException} If reset fails due to database errors
   */
  resetProgress(userId: string): Promise<GameProfile>;
}