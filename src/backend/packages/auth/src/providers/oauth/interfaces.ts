/**
 * @file OAuth Provider Interfaces
 * @description TypeScript interfaces and types for OAuth authentication, including standardized
 * profile structures, token formats, and provider configurations. Ensures type safety across
 * all OAuth provider implementations and consumers.
 *
 * This file is part of the AUSTA SuperApp authentication system and provides a consistent
 * interface for all OAuth providers used across the platform. It standardizes the data models
 * between frontend and backend systems while ensuring proper serialization/deserialization
 * of OAuth-related data.
 */

/**
 * Standard OAuth 2.0 token response structure
 * Represents the response from an OAuth 2.0 token endpoint
 * 
 * This interface follows the standard OAuth 2.0 token response format as defined in RFC 6749,
 * with additional fields for AUSTA SuperApp specific requirements.
 */
export interface OAuthToken {
  /** The access token issued by the authorization server */
  access_token: string;
  
  /** The type of token issued, typically "Bearer" */
  token_type: string;
  
  /** The lifetime in seconds of the access token */
  expires_in: number;
  
  /** The refresh token, which can be used to obtain new access tokens */
  refresh_token?: string;
  
  /** The scope of the access token as a space-delimited string */
  scope?: string;
  
  /** ISO timestamp when the token was issued */
  issued_at?: string;
  
  /** ID token for OpenID Connect flows */
  id_token?: string;
  
  /** Token expiration timestamp calculated from expires_in */
  expires_at?: number;
}

/**
 * Standard OAuth 2.0 profile structure
 * Represents the normalized user profile data across different OAuth providers
 * 
 * This interface provides a consistent structure for user profile data regardless of the
 * OAuth provider, enabling seamless integration across the AUSTA SuperApp journeys.
 * Each provider's specific profile data is mapped to this standard format.
 */
export interface OAuthProfile {
  /** Unique identifier for the user within the OAuth provider */
  id: string;
  
  /** Provider name (e.g., 'google', 'facebook', 'apple') */
  provider: OAuthProviderType;
  
  /** User's display name or full name */
  displayName?: string;
  
  /** User's first name */
  firstName?: string;
  
  /** User's last name */
  lastName?: string;
  
  /** User's middle name */
  middleName?: string;
  
  /** User's email address */
  email?: string;
  
  /** Whether the email has been verified by the provider */
  emailVerified?: boolean;
  
  /** URL to the user's profile picture */
  picture?: string;
  
  /** User's gender */
  gender?: string;
  
  /** User's birth date */
  birthdate?: string;
  
  /** User's locale or language preference */
  locale?: string;
  
  /** User's timezone */
  timezone?: string;
  
  /** User's phone number */
  phoneNumber?: string;
  
  /** Whether the phone number has been verified by the provider */
  phoneNumberVerified?: boolean;
  
  /** Additional provider-specific profile information */
  _raw?: unknown;
  
  /** Original JSON response from the provider */
  _json?: Record<string, unknown>;
}

/**
 * Base OAuth provider configuration
 * Common configuration options for all OAuth providers
 * 
 * This interface defines the configuration options that are common to all OAuth providers
 * supported by the AUSTA SuperApp. Provider-specific configurations extend this interface
 * to add their own unique options.
 */
export interface OAuthConfig {
  /** OAuth client ID */
  clientId: string;
  
  /** OAuth client secret */
  clientSecret: string;
  
  /** Callback URL for the OAuth flow */
  callbackURL: string;
  
  /** Provider type */
  provider: OAuthProviderType;
  
  /** Optional state parameter for CSRF protection */
  state?: string;
  
  /** Optional PKCE code verifier */
  codeVerifier?: string;
  
  /** Optional PKCE code challenge */
  codeChallenge?: string;
  
  /** Optional PKCE code challenge method */
  codeChallengeMethod?: 'plain' | 'S256';
  
  /** Optional scopes to request from the provider */
  scope?: string | string[];
  
  /** Whether to force approval even if the user has already approved */
  prompt?: 'none' | 'consent' | 'select_account';
  
  /** Optional function to validate the token response */
  validateTokenResponse?: (response: OAuthToken) => boolean;
  
  /** Optional function to map the provider's profile to the standard profile */
  profileMapper?: (profile: unknown) => OAuthProfile;
}

/**
 * Google OAuth provider configuration
 * Extends the base OAuth configuration with Google-specific options
 */
export interface GoogleOAuthConfig extends OAuthConfig {
  /** Google API version */
  apiVersion?: string;
  
  /** Whether to include the granted scopes in the profile */
  includeGrantedScopes?: boolean;
  
  /** Access type (online or offline) */
  accessType?: 'online' | 'offline';
  
  /** Whether to force approval even if the user has already approved */
  approvalPrompt?: 'auto' | 'force';
  
  /** The G Suite domain to restrict sign-in */
  hostedDomain?: string;
  
  /** The user's preferred login hint */
  loginHint?: string;
}

/**
 * Facebook OAuth provider configuration
 * Extends the base OAuth configuration with Facebook-specific options
 */
export interface FacebookOAuthConfig extends OAuthConfig {
  /** Facebook Graph API version */
  graphAPIVersion?: string;
  
  /** Whether to enable profile picture size optimization */
  enableProof?: boolean;
  
  /** Profile fields to request from Facebook */
  profileFields?: string[];
  
  /** Display mode for the authorization dialog */
  display?: 'page' | 'popup' | 'touch' | 'wap';
  
  /** Whether the user can create an account or not */
  authType?: 'rerequest' | 'reauthenticate';
}

/**
 * Apple OAuth provider configuration
 * Extends the base OAuth configuration with Apple-specific options
 */
export interface AppleOAuthConfig extends OAuthConfig {
  /** Apple team ID */
  teamId: string;
  
  /** Apple key ID */
  keyId: string;
  
  /** Apple private key */
  privateKey: string;
  
  /** Whether to return only the email from Apple */
  emailOnly?: boolean;
  
  /** Whether to return only the name from Apple */
  nameOnly?: boolean;
}

/**
 * OAuth error response structure
 * Represents an error response from an OAuth 2.0 endpoint
 */
export interface OAuthError {
  /** Error code */
  error: string;
  
  /** Human-readable error description */
  error_description?: string;
  
  /** URI to a human-readable web page with information about the error */
  error_uri?: string;
  
  /** State parameter, if included in the request */
  state?: string;
}

/**
 * OAuth authorization code grant parameters
 * Parameters for the authorization code grant type
 */
export interface AuthorizationCodeGrantParams {
  /** The authorization code received from the authorization server */
  code: string;
  
  /** The client ID */
  client_id: string;
  
  /** The client secret */
  client_secret?: string;
  
  /** The redirect URI */
  redirect_uri: string;
  
  /** The grant type, must be "authorization_code" */
  grant_type: 'authorization_code';
  
  /** The PKCE code verifier */
  code_verifier?: string;
}

/**
 * OAuth refresh token grant parameters
 * Parameters for the refresh token grant type
 */
export interface RefreshTokenGrantParams {
  /** The refresh token */
  refresh_token: string;
  
  /** The client ID */
  client_id: string;
  
  /** The client secret */
  client_secret?: string;
  
  /** The grant type, must be "refresh_token" */
  grant_type: 'refresh_token';
  
  /** The scope of the access request */
  scope?: string;
}

/**
 * OAuth provider type
 * Supported OAuth providers in the AUSTA SuperApp
 * 
 * This type defines the OAuth providers officially supported by the AUSTA SuperApp.
 * When adding a new provider, extend this type and implement the corresponding interfaces.
 */
export type OAuthProviderType = 'google' | 'facebook' | 'apple';

/**
 * OAuth provider factory interface
 * Interface for creating OAuth provider instances
 * 
 * This factory pattern enables the dynamic creation of OAuth provider instances based on
 * configuration. It supports the dependency injection pattern used throughout the AUSTA SuperApp
 * and facilitates testing by allowing provider implementations to be easily mocked.
 */
export interface OAuthProviderFactory {
  /**
   * Creates an OAuth provider instance
   * @param config The provider configuration
   * @returns The OAuth provider instance
   */
  createProvider<T>(config: OAuthConfig): T;
  
  /**
   * Gets the provider type
   * @returns The provider type
   */
  getProviderType(): OAuthProviderType;
}