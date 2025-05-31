import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

/**
 * Enum defining the supported OAuth providers for social login
 */
export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

/**
 * Data Transfer Object for handling OAuth-based social login requests
 * 
 * This DTO validates requests for authentication using external identity providers
 * (Google, Facebook, Apple) as part of the authentication system. It ensures that
 * all required fields are present and properly formatted before processing.
 */
export class SocialLoginDto {
  /**
   * The OAuth provider to use for authentication
   * 
   * Must be one of the supported providers: 'google', 'facebook', or 'apple'
   */
  @IsNotEmpty({ message: 'Provider is required' })
  @IsEnum(SocialProvider, { 
    message: 'Provider must be one of: google, facebook, apple' 
  })
  provider: SocialProvider;

  /**
   * The authorization code received from the OAuth provider
   * 
   * This code is obtained after the user authenticates with the provider and
   * grants permission to the application. It will be exchanged for access and
   * refresh tokens to complete the authentication process.
   */
  @IsNotEmpty({ message: 'Authorization code is required' })
  @IsString({ message: 'Authorization code must be a string' })
  authorizationCode: string;

  /**
   * Optional redirect URI for the OAuth flow
   * 
   * If provided, this URI must match one of the registered redirect URIs for the
   * application in the OAuth provider's configuration. This is used to ensure
   * the security of the OAuth flow by preventing authorization code interception.
   */
  @IsOptional()
  @IsUrl({ 
    require_tld: true,
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    protocols: ['http', 'https'],
  }, { 
    message: 'Redirect URI must be a valid URL with http or https protocol' 
  })
  @Matches(/^https?:\/\/[\w.-]+(:\d+)?(\/[\w\/-]*)*$/, {
    message: 'Redirect URI format is invalid'
  })
  redirectUri?: string;
}