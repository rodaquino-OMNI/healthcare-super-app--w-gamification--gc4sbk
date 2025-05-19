import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for JWT authentication responses.
 * Contains access and refresh tokens along with their expiration metadata.
 * Used to establish a consistent contract for token-based authentication responses
 * across all services that integrate with the authentication system.
 */
export class TokenResponseDto {
  /**
   * JWT access token for API authorization.
   * Used for authenticating requests to protected endpoints.
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @ApiProperty({
    description: 'JWT access token for API authorization',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  /**
   * JWT refresh token used to obtain a new access token when expired.
   * Should be stored securely and only used for token refresh operations.
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @ApiProperty({
    description: 'JWT refresh token used to obtain a new access token when expired',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  /**
   * ISO 8601 timestamp when the access token expires.
   * Client applications should use this to determine when to refresh tokens.
   * @example "2023-12-31T23:59:59.999Z"
   */
  @ApiProperty({
    description: 'ISO 8601 timestamp when the access token expires',
    example: '2023-12-31T23:59:59.999Z',
  })
  expiresAt: string;

  /**
   * Duration in seconds until the access token expires.
   * Useful for countdown timers or progress indicators in client applications.
   * @example 3600
   */
  @ApiProperty({
    description: 'Duration in seconds until the access token expires',
    example: 3600,
  })
  expiresIn: number;

  /**
   * Token type, always "Bearer" for JWT authentication.
   * Used in the Authorization header format: "Bearer {accessToken}"
   * @example "Bearer"
   */
  @ApiProperty({
    description: 'Token type, always "Bearer" for JWT authentication',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';

  /**
   * Creates a new TokenResponseDto instance.
   * @param partial Partial TokenResponseDto properties to initialize the instance
   */
  constructor(partial?: Partial<TokenResponseDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Creates a TokenResponseDto from raw token data.
   * Converts numeric timestamp to ISO string format for expiresAt.
   * 
   * @param accessToken JWT access token
   * @param refreshToken JWT refresh token
   * @param expiresIn Expiration time in seconds
   * @returns A new TokenResponseDto instance
   */
  static fromTokenData(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): TokenResponseDto {
    const expiresAtMs = Date.now() + expiresIn * 1000;
    const expiresAt = new Date(expiresAtMs).toISOString();

    return new TokenResponseDto({
      accessToken,
      refreshToken,
      expiresAt,
      expiresIn,
    });
  }

  /**
   * Converts the DTO to a format compatible with the AuthSession interface
   * used in frontend applications.
   * 
   * @returns An object compatible with the AuthSession interface
   */
  toAuthSession(): { accessToken: string; refreshToken: string; expiresAt: number } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: new Date(this.expiresAt).getTime(),
    };
  }
}