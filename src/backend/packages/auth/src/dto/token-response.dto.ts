import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object (DTO) for JWT authentication responses.
 * 
 * This class structures the response format for authentication operations that issue
 * JWT tokens, ensuring a consistent contract across all services that integrate with
 * the authentication system. It includes both access and refresh tokens along with
 * their expiration metadata.
 */
export class TokenResponseDto {
  /**
   * JWT access token used for authenticating API requests.
   * This token should be included in the Authorization header of subsequent requests.
   * 
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  /**
   * Expiration timestamp for the access token in ISO format.
   * Clients can use this to preemptively refresh tokens before they expire.
   * 
   * @example "2023-04-15T16:30:45.123Z"
   */
  @ApiProperty({
    description: 'Expiration timestamp for the access token in ISO format',
    example: '2023-04-15T16:30:45.123Z',
  })
  accessTokenExpires: string;

  /**
   * JWT refresh token used to obtain a new access token when the current one expires.
   * This token has a longer lifespan than the access token but should be stored securely.
   * 
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  /**
   * Expiration timestamp for the refresh token in ISO format.
   * Clients should request the user to re-authenticate once this token expires.
   * 
   * @example "2023-05-15T16:30:45.123Z"
   */
  @ApiProperty({
    description: 'Expiration timestamp for the refresh token in ISO format',
    example: '2023-05-15T16:30:45.123Z',
  })
  refreshTokenExpires: string;

  /**
   * Token type, always "Bearer" for JWT authentication.
   * This indicates how the token should be used in the Authorization header.
   * 
   * @example "Bearer"
   */
  @ApiProperty({
    description: 'Token type, always "Bearer" for JWT authentication',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';
}