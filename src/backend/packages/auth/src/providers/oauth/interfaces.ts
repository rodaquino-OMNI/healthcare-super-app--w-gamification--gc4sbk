/**
 * @file OAuth Provider Interfaces
 * 
 * This file contains TypeScript interfaces and types for OAuth authentication,
 * including standardized profile structures, token formats, and provider configurations.
 * These interfaces ensure type safety across all OAuth provider implementations and consumers.
 */

/**
 * Base OAuth profile interface that all provider-specific profiles extend.
 * Contains common fields present in most OAuth provider profiles.
 */
export interface OAuthProfile {
  /** Unique identifier from the OAuth provider */
  id: string;
  /** Provider name (e.g., 'google', 'facebook', 'apple') */
  provider: string;
  /** User's display name */
  displayName?: string;
  /** User's email address */
  email?: string;
  /** Whether the email has been verified by the provider */
  emailVerified?: boolean;
  /** URL to the user's profile picture */
  picture?: string;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** Raw profile data as returned by the provider */
  _raw?: any;
  /** JSON representation of the profile as returned by the provider */
  _json?: any;
}

/**
 * OAuth token interface representing the tokens returned by OAuth providers.
 */
export interface OAuthToken {
  /** Access token for making authenticated requests to the provider's API */
  accessToken: string;
  /** Token type (usually 'Bearer') */
  tokenType?: string;
  /** Refresh token for obtaining a new access token when it expires */
  refreshToken?: string;
  /** Access token expiration timestamp in seconds */
  expiresIn?: number;
  /** Scope of access granted by the token */
  scope?: string | string[];
  /** ID token for OpenID Connect providers */
  idToken?: string;
}

/**
 * Base OAuth configuration interface that all provider-specific configurations extend.
 */
export interface OAuthConfig {
  /** OAuth client ID */
  clientID: string;
  /** OAuth client secret */
  clientSecret: string;
  /** Callback URL for the OAuth flow */
  callbackURL: string;
  /** Optional state parameter for CSRF protection */
  state?: boolean | string;
  /** Optional scope of access to request from the provider */
  scope?: string | string[];
  /** Whether to include the granted scopes in the profile */
  includeGrantedScopes?: boolean;
  /** Whether to enable proof key for code exchange (PKCE) */
  enablePKCE?: boolean;
}

/**
 * Google OAuth profile interface extending the base OAuthProfile.
 */
export interface GoogleProfile extends OAuthProfile {
  provider: 'google';
  /** Google-specific profile fields */
  emails?: Array<{ value: string; verified: boolean }>;
  /** Google profile photos */
  photos?: Array<{ value: string }>;
  /** Google account locale */
  locale?: string;
  /** Gender information if available */
  gender?: string;
}

/**
 * Google OAuth configuration interface extending the base OAuthConfig.
 */
export interface GoogleOAuthConfig extends OAuthConfig {
  /** Google-specific configuration options */
  hostedDomain?: string;
  /** Whether to include the user's profile in the ID token */
  includeProfile?: boolean;
}

/**
 * Facebook OAuth profile interface extending the base OAuthProfile.
 */
export interface FacebookProfile extends OAuthProfile {
  provider: 'facebook';
  /** Facebook-specific profile fields */
  emails?: Array<{ value: string }>;
  /** Facebook profile photos */
  photos?: Array<{ value: string }>;
  /** Facebook profile URL */
  profileUrl?: string;
  /** User's birthday if available */
  birthday?: string;
  /** User's gender if available */
  gender?: string;
}

/**
 * Facebook OAuth configuration interface extending the base OAuthConfig.
 */
export interface FacebookOAuthConfig extends OAuthConfig {
  /** Facebook-specific configuration options */
  profileFields?: string[];
  /** Whether to enable profile photo access */
  enableProof?: boolean;
  /** Display mode for the authorization dialog */
  display?: 'page' | 'popup' | 'touch' | 'wap';
}

/**
 * Apple OAuth profile interface extending the base OAuthProfile.
 */
export interface AppleProfile extends OAuthProfile {
  provider: 'apple';
  /** Apple-specific profile fields */
  emails?: Array<{ value: string; verified: boolean }>;
  /** Apple user's name components */
  name?: {
    firstName?: string;
    lastName?: string;
  };
  /** Whether this is a private email relay */
  isPrivateEmail?: boolean;
}

/**
 * Apple OAuth configuration interface extending the base OAuthConfig.
 */
export interface AppleOAuthConfig extends OAuthConfig {
  /** Apple-specific configuration options */
  teamID: string;
  /** Key ID from Apple Developer account */
  keyID: string;
  /** Private key for client authentication */
  privateKeyLocation: string;
  /** Whether to disable PKCE (not recommended) */
  disablePKCE?: boolean;
}

/**
 * Microsoft OAuth profile interface extending the base OAuthProfile.
 */
export interface MicrosoftProfile extends OAuthProfile {
  provider: 'microsoft';
  /** Microsoft-specific profile fields */
  emails?: Array<{ value: string; type?: string }>;
  /** Microsoft profile photos */
  photos?: Array<{ value: string }>;
  /** Microsoft account business phone */
  businessPhones?: string[];
  /** Microsoft account display name */
  displayName?: string;
  /** Microsoft account given name */
  givenName?: string;
  /** Microsoft account job title */
  jobTitle?: string;
  /** Microsoft account mail */
  mail?: string;
  /** Microsoft account mobile phone */
  mobilePhone?: string;
  /** Microsoft account office location */
  officeLocation?: string;
  /** Microsoft account preferred language */
  preferredLanguage?: string;
  /** Microsoft account surname */
  surname?: string;
  /** Microsoft account user principal name */
  userPrincipalName?: string;
}

/**
 * Microsoft OAuth configuration interface extending the base OAuthConfig.
 */
export interface MicrosoftOAuthConfig extends OAuthConfig {
  /** Microsoft-specific configuration options */
  tenant?: string;
  /** Microsoft Graph API version */
  authorizationURL?: string;
  /** Microsoft token URL */
  tokenURL?: string;
}

/**
 * AWS Cognito OAuth profile interface extending the base OAuthProfile.
 */
export interface CognitoProfile extends OAuthProfile {
  provider: 'cognito';
  /** Cognito-specific profile fields */
  username?: string;
  /** Cognito user attributes */
  attributes?: Record<string, string>;
  /** Cognito user groups */
  groups?: string[];
}

/**
 * AWS Cognito OAuth configuration interface extending the base OAuthConfig.
 */
export interface CognitoOAuthConfig extends OAuthConfig {
  /** Cognito-specific configuration options */
  region: string;
  /** Cognito user pool ID */
  userPoolID: string;
  /** Cognito domain prefix */
  domainPrefix?: string;
}

/**
 * Union type of all supported OAuth provider profiles.
 */
export type SupportedOAuthProfile =
  | GoogleProfile
  | FacebookProfile
  | AppleProfile
  | MicrosoftProfile
  | CognitoProfile;

/**
 * Union type of all supported OAuth provider configurations.
 */
export type SupportedOAuthConfig =
  | GoogleOAuthConfig
  | FacebookOAuthConfig
  | AppleOAuthConfig
  | MicrosoftOAuthConfig
  | CognitoOAuthConfig;

/**
 * OAuth provider type - string literal union of supported providers.
 */
export type OAuthProviderType = 
  | 'google'
  | 'facebook'
  | 'apple'
  | 'microsoft'
  | 'cognito';

/**
 * OAuth verification callback function type.
 * This is the function signature for the callback used in OAuth strategies.
 */
export type OAuthVerifyCallback = (
  accessToken: string,
  refreshToken: string,
  profile: SupportedOAuthProfile,
  done: (error: Error | null, user?: any, info?: any) => void
) => void;

/**
 * OAuth user data interface for internal user representation.
 * This is used when validating OAuth users in the authentication service.
 */
export interface OAuthUserData {
  /** OAuth provider name */
  provider: OAuthProviderType;
  /** Provider-specific user ID */
  providerId: string;
  /** User's email address */
  email?: string;
  /** User's display name */
  name?: string;
  /** User's profile picture URL */
  picture?: string;
  /** Additional provider-specific data */
  providerData?: Record<string, any>;
}