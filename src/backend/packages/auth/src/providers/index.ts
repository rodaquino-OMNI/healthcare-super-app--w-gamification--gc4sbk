/**
 * @file Centralized export file for all authentication providers
 * 
 * This barrel file exports all authentication providers and related interfaces
 * organized by provider type (database, JWT, OAuth). It serves as the main entry
 * point for consuming applications to access authentication functionality.
 *
 * @module @austa/auth/providers
 */

// Core provider interface
export * from './auth-provider.interface';

// Provider module for dependency injection
export * from './providers.module';

/**
 * Database Authentication Providers
 * 
 * Includes providers for username/password authentication against database records,
 * along with utilities for password handling and validation.
 */
export * from './database';

/**
 * JWT Authentication Providers
 * 
 * Includes providers for JWT token generation, validation, and blacklisting,
 * along with configuration options and interfaces.
 */
export * from './jwt';

/**
 * OAuth Authentication Providers
 * 
 * Includes providers for third-party authentication services like Google,
 * Facebook, and Apple, along with interfaces and utilities for OAuth flows.
 */
export * from './oauth';

// Re-export relevant interfaces from @austa/interfaces for convenience
import {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
} from '@austa/interfaces/auth/request.interface';

import {
  LoginResponseDto,
  RegisterResponseDto,
  TokenValidationResponseDto,
} from '@austa/interfaces/auth/response.interface';

import {
  JwtPayload,
  AuthSession,
  AuthState,
} from '@austa/interfaces/auth/auth.interface';

import {
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto,
} from '@austa/interfaces/auth/user.interface';

import {
  RoleResponseDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '@austa/interfaces/auth/role.interface';

import {
  PermissionResponseDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '@austa/interfaces/auth/permission.interface';

/**
 * Authentication Request DTOs
 * 
 * Data Transfer Objects for authentication requests including login,
 * registration, and token refresh operations.
 */
export {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
};

/**
 * Authentication Response DTOs
 * 
 * Data Transfer Objects for authentication responses including login,
 * registration, and token validation results.
 */
export {
  LoginResponseDto,
  RegisterResponseDto,
  TokenValidationResponseDto,
};

/**
 * Authentication Core Interfaces
 * 
 * Core interfaces for authentication state, sessions, and JWT payloads
 * used across the authentication system.
 */
export {
  JwtPayload,
  AuthSession,
  AuthState,
};

/**
 * User Management DTOs
 * 
 * Data Transfer Objects for user management operations including
 * creation, updating, and response formatting.
 */
export {
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto,
};

/**
 * Role Management DTOs
 * 
 * Data Transfer Objects for role management operations including
 * creation, updating, and response formatting.
 */
export {
  RoleResponseDto,
  CreateRoleDto,
  UpdateRoleDto,
};

/**
 * Permission Management DTOs
 * 
 * Data Transfer Objects for permission management operations including
 * creation, updating, and response formatting.
 */
export {
  PermissionResponseDto,
  CreatePermissionDto,
  UpdatePermissionDto,
};