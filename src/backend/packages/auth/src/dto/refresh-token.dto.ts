import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Data Transfer Object for token refresh operations.
 * 
 * This DTO is used when a client wants to obtain a new access token using a valid refresh token.
 * It enforces validation rules on the refresh token string to ensure it meets the required format
 * and security standards before processing.
 * 
 * The token refresh flow works as follows:
 * 1. Client sends a request with a valid refresh token to the token refresh endpoint
 * 2. Server validates the refresh token format using this DTO
 * 3. Server verifies the refresh token against the Redis-backed token store
 * 4. If valid, server issues a new access token and optionally a new refresh token (token rotation)
 * 5. The old refresh token may be blacklisted to prevent reuse (depending on security settings)
 * 
 * This implementation supports secure token rotation and enhanced session management
 * as specified in the updated security requirements.
 */
export class RefreshTokenDto {
  /**
   * The refresh token string used to obtain a new access token.
   * 
   * Must be a non-empty string that meets the minimum length requirement and
   * follows the expected JWT format (base64url-encoded segments separated by periods).
   * 
   * Invalid refresh tokens will be rejected with appropriate error messages.
   */
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  @MinLength(30, { message: 'Refresh token is invalid or malformed' })
  @Matches(/^[\w-]+\.[\w-]+\.[\w-]+$/, {
    message: 'Refresh token format is invalid. Expected JWT format with three segments'
  })
  refreshToken: string;
}