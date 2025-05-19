import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { TokenRefreshRequest } from '@austa/interfaces/auth';

/**
 * Data Transfer Object for token refresh requests.
 * 
 * This DTO validates refresh token requests to ensure they contain a valid refresh token string.
 * It integrates with Redis-backed token blacklisting and implements security checks to prevent
 * token reuse and replay attacks.
 * 
 * @implements {TokenRefreshRequest} from @austa/interfaces/auth
 */
export class RefreshTokenDto implements TokenRefreshRequest {
  /**
   * The refresh token string used to obtain a new access token.
   * 
   * Must be a non-empty string that matches the JWT format pattern.
   * The token will be validated against the Redis blacklist to prevent reuse.
   */
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  @MinLength(20, { message: 'Refresh token is invalid or malformed' })
  @MaxLength(2000, { message: 'Refresh token exceeds maximum length' })
  @Matches(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/, {
    message: 'Refresh token format is invalid',
  })
  refreshToken: string;
}