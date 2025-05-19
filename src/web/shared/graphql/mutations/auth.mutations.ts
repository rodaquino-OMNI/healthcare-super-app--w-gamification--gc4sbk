import { gql } from '@apollo/client'; // @apollo/client v3.8.10 - Used to define GraphQL queries and mutations

/**
 * GraphQL mutation for user login with email and password.
 * 
 * @remarks
 * This mutation authenticates a user with their email and password credentials.
 * Upon successful authentication, it returns JWT tokens for maintaining the user session.
 * 
 * @returns An object containing accessToken, refreshToken, and expiresAt timestamp
 */
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/**
 * GraphQL mutation for user registration with name, email, and password.
 * 
 * @remarks
 * This mutation creates a new user account with the provided information.
 * Upon successful registration, it automatically logs the user in and returns JWT tokens.
 * 
 * @returns An object containing accessToken, refreshToken, and expiresAt timestamp
 */
export const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/**
 * GraphQL mutation for user logout.
 * 
 * @remarks
 * This mutation invalidates the current user session and blacklists active tokens.
 * It should be called when a user explicitly logs out of the application.
 * 
 * @returns A boolean indicating successful logout
 */
export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

/**
 * GraphQL mutation for refreshing authentication tokens.
 * 
 * @remarks
 * This mutation uses the current refreshToken to generate a new pair of access and refresh tokens.
 * It should be called when the access token is about to expire or has expired.
 * 
 * @returns An object containing new accessToken, refreshToken, and expiresAt timestamp
 */
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/**
 * GraphQL mutation for verifying Multi-Factor Authentication (MFA) code.
 * 
 * @remarks
 * This mutation validates the MFA code provided by the user during the authentication process.
 * It should be called after a successful login when MFA is enabled for the user account.
 * 
 * @returns An object containing accessToken, refreshToken, and expiresAt timestamp
 */
export const VERIFY_MFA_MUTATION = gql`
  mutation VerifyMFA($code: String!) {
    verifyMFA(code: $code) {
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/**
 * GraphQL mutation for requesting a password reset.
 * 
 * @remarks
 * This mutation initiates the password reset process by sending a reset link to the user's email.
 * It should be called from the forgot password screen when a user cannot remember their password.
 * 
 * @returns A boolean indicating successful request processing
 */
export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

/**
 * GraphQL mutation for resetting a user's password using a reset token.
 * 
 * @remarks
 * This mutation completes the password reset process by validating the token and setting a new password.
 * It should be called from the password reset screen after the user clicks the link in their email.
 * 
 * @returns A boolean indicating successful password reset
 */
export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password)
  }
`;

/**
 * GraphQL mutation for updating user profile information.
 * 
 * @remarks
 * This mutation allows users to update their profile details such as name and email.
 * It requires authentication and should be called from the profile management screen.
 * 
 * @returns The updated user object with id, name, and email
 */
export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($name: String, $email: String) {
    updateUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

/**
 * GraphQL mutation for changing a user's password.
 * 
 * @remarks
 * This mutation allows authenticated users to change their password by providing their current password.
 * It should be called from the account settings or profile management screen.
 * 
 * @returns A boolean indicating successful password change
 */
export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

/**
 * GraphQL mutation for setting up Multi-Factor Authentication (MFA).
 * 
 * @remarks
 * This mutation initiates the MFA setup process by generating a secret and QR code for the user.
 * It requires authentication and should be called from the security settings screen.
 * 
 * @returns A string containing the MFA setup information (typically a URI for QR code generation)
 */
export const SETUP_MFA_MUTATION = gql`
  mutation SetupMFA {
    setupMFA
  }
`;

/**
 * GraphQL mutation for disabling Multi-Factor Authentication (MFA).
 * 
 * @remarks
 * This mutation disables MFA for the authenticated user's account.
 * It should be called from the security settings screen when a user wants to turn off MFA.
 * 
 * @returns A boolean indicating successful MFA disabling
 */
export const DISABLE_MFA_MUTATION = gql`
  mutation DisableMFA {
    disableMFA
  }
`;

/**
 * GraphQL mutation for social login (OAuth) authentication.
 * 
 * @remarks
 * This mutation authenticates a user using a token obtained from a social provider (Google, Facebook, etc.).
 * It should be called after receiving the OAuth token from the social login provider.
 * 
 * @returns An object containing accessToken, refreshToken, and expiresAt timestamp
 */
export const SOCIAL_LOGIN_MUTATION = gql`
  mutation SocialLogin($provider: String!, $token: String!) {
    socialLogin(provider: $provider, token: $token) {
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/**
 * GraphQL mutation for biometric authentication (fingerprint, face ID, etc.).
 * 
 * @remarks
 * This mutation authenticates a user using biometric data from their device.
 * It should be called when a user chooses to log in using biometric authentication.
 * The biometricData parameter contains a secure token generated by the device's biometric system.
 * 
 * @returns An object containing accessToken, refreshToken, and expiresAt timestamp
 */
export const BIOMETRIC_LOGIN_MUTATION = gql`
  mutation BiometricLogin($biometricData: String!) {
    biometricLogin(biometricData: $biometricData) {
      accessToken
      refreshToken
      expiresAt
    }
  }
`;