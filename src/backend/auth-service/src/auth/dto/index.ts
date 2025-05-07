/**
 * @file Authentication DTOs barrel file
 * @description Exports all authentication-related Data Transfer Objects (DTOs) from the auth module
 * for simplified imports throughout the auth-service.
 */

// Login DTO for user authentication requests
export * from './login.dto';

// Refresh Token DTO for token refresh operations
export * from './refresh-token.dto';

// Multi-Factor Authentication verification DTO
export * from './mfa-verify.dto';