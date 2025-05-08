/**
 * @file Barrel file for profile-related DTOs in the gamification engine
 * 
 * This file centralizes exports for all profile-related DTOs, enabling cleaner imports
 * through a single entry point. It simplifies imports in controllers and services by
 * allowing destructured imports from a single path instead of requiring separate
 * import statements for each DTO.
 * 
 * @module profiles/dto
 */

// Export all profile-related DTOs
export { CreateProfileDto } from './create-profile.dto';
export { UpdateProfileDto } from './update-profile.dto';
export { ProfileResponseDto } from './profile-response.dto';
export { FilterProfilesDto } from './filter-profiles.dto';