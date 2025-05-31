import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * Data Transfer Object for token refresh requests.
 * 
 * This DTO validates refresh token requests to ensure they contain a valid refresh token string.
 * It is used in the token refresh endpoint to obtain new access tokens using a valid refresh token.
 * 
 * The validation rules enforce:
 * - Non-empty string value
 * - Proper JWT format with three segments separated by periods
 * - Minimum and maximum length constraints for security
 * 
 * This implementation supports Redis-backed token blacklisting to prevent token reuse
 * and implements secure token rotation as part of the enhanced session management requirements.
 */
export class RefreshTokenDto {
  /**
   * The refresh token string used to obtain a new access token.
   * 
   * Must be a valid JWT format token that was previously issued by the authentication service.
   * The token will be validated against the Redis blacklist to prevent replay attacks.
   * 
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
   */
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  @Length(30, 1024, { message: 'Refresh token length is invalid' })
  @Matches(/^[\w-]+\.[\w-]+\.[\w-]+$/, {
    message: 'Refresh token format is invalid',
  })
  refreshToken: string;
}