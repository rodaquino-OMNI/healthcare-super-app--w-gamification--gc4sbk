import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Data transfer object for updating a user's password.
 * Contains the current password for verification and the new password to set.
 */
export class UpdatePasswordDto {
  /**
   * The current password of the user.
   * Required for verification before updating the password.
   */
  @IsString()
  @MaxLength(255)
  currentPassword: string;

  /**
   * The new password to set for the user.
   * Must be at least 8 characters long for security.
   */
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  newPassword: string;
}