import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for refresh token requests.
 * Used to validate the refresh token in token refresh operations.
 */
export class RefreshTokenDto {
  /**
   * The refresh token string.
   * Must be a non-empty string.
   */
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}