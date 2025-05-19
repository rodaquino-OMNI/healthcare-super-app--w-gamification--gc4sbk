import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * Enum representing supported OAuth providers for social login
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

/**
 * Data Transfer Object for handling social login requests via OAuth providers.
 * 
 * This DTO validates requests for authentication using external identity providers
 * (Google, Facebook, Apple) as part of the AUSTA SuperApp authentication system.
 * It ensures that all required fields for OAuth-based authentication are present
 * and properly formatted.
 */
export class SocialLoginDto {
  /**
   * The OAuth provider to use for authentication.
   * Must be one of the supported providers: Google, Facebook, or Apple.
   */
  @IsNotEmpty({ message: 'OAuth provider is required' })
  @IsEnum(OAuthProvider, { message: 'Invalid OAuth provider. Must be one of: google, facebook, apple' })
  provider: OAuthProvider;

  /**
   * The authorization code received from the OAuth provider.
   * This code is exchanged for access and ID tokens to authenticate the user.
   */
  @IsNotEmpty({ message: 'Authorization code is required' })
  @IsString({ message: 'Authorization code must be a string' })
  @MaxLength(2048, { message: 'Authorization code exceeds maximum length' })
  code: string;

  /**
   * Optional redirect URI for the OAuth flow.
   * If provided, must be a valid URL and match the redirect URI registered with the OAuth provider.
   */
  @IsOptional()
  @IsString({ message: 'Redirect URI must be a string' })
  @IsUrl({}, { message: 'Invalid redirect URI format' })
  @MaxLength(1024, { message: 'Redirect URI exceeds maximum length' })
  redirectUri?: string;
}