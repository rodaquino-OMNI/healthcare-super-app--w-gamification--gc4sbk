/**
 * @file Authentication Interfaces Index
 * @description Central barrel file that exports all authentication interfaces from the auth package.
 * This file provides a single import point for all auth-related interfaces, enabling clean and
 * organized imports in consuming services without requiring knowledge of the internal file structure.
 *
 * @example
 * // Import all auth interfaces
 * import * as AuthInterfaces from '@austa/interfaces/auth';
 *
 * // Import specific interfaces
 * import { IUser, IRole, IPermission } from '@austa/interfaces/auth';
 */

/**
 * Core Authentication Interfaces
 * These interfaces define the structures for authentication operations, including
 * JWT tokens, authentication responses, and user authentication data.
 */
export interface IJwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  journeys?: string[];
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IAuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions?: string[];
  journeys?: string[];
  isActive: boolean;
}

export interface IUserCredentials {
  email: string;
  password: string;
}

export interface IMfaVerification {
  userId: string;
  code: string;
  method: 'sms' | 'email' | 'app';
}

export interface ISessionInfo {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface ILoginResponse {
  user: IAuthenticatedUser;
  tokens: ITokenPair;
  expiresIn: number;
}

export interface IRegisterResponse {
  user: IAuthenticatedUser;
  tokens: ITokenPair;
  expiresIn: number;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * User Interfaces
 * These interfaces define the structures for user data, including core user properties,
 * user profiles, credentials, and settings.
 */
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profile?: IUserProfile;
  settings?: IUserSettings;
  roles?: IRole[];
}

export interface IUserProfile {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  birthDate?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  bio?: string;
  journeyPreferences?: Record<string, unknown>;
}

export interface IUserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  privacy: {
    shareProfile: boolean;
    shareActivity: boolean;
    shareAchievements: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
  };
  journeySettings?: Record<string, unknown>;
}

/**
 * Role Interfaces
 * These interfaces define the structures for role-based access control, including
 * role definitions, role-permission relationships, and role queries.
 */
export interface IRole {
  id: string;
  name: string;
  description: string;
  journey?: string;
  isDefault?: boolean;
  permissions?: IPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRolePermission {
  roleId: string;
  permissionId: string;
  journey?: string;
  createdAt: Date;
}

export interface IRoleQuery {
  name?: string;
  journey?: string;
  isDefault?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IRoleService {
  findAll(query?: IRoleQuery): Promise<IRole[]>;
  findById(id: string): Promise<IRole>;
  create(role: Partial<IRole>): Promise<IRole>;
  update(id: string, role: Partial<IRole>): Promise<IRole>;
  delete(id: string): Promise<boolean>;
  assignPermission(roleId: string, permissionId: string): Promise<boolean>;
  revokePermission(roleId: string, permissionId: string): Promise<boolean>;
  getPermissions(roleId: string): Promise<IPermission[]>;
}

/**
 * Permission Interfaces
 * These interfaces define the structures for permission management, including
 * permission definitions, permission checks, and context-based authorization.
 */
export interface IPermission {
  id: string;
  name: string;
  description: string;
  journey?: string;
  resource?: string;
  action?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionContext {
  user: {
    id: string;
    roles: string[];
    permissions?: string[];
    journeys?: string[];
  };
  resource: {
    id?: string;
    type: string;
    journey?: string;
    ownerId?: string;
    metadata?: Record<string, unknown>;
  };
  action: string;
  environment: {
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    journeyContext?: string;
  };
}

export interface IPermissionCheck {
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
  checkPermission(context: IPermissionContext): Promise<boolean>;
  validateAccess(userId: string, resource: string, action: string): Promise<boolean>;
}

export interface IPermissionService {
  findAll(query?: any): Promise<IPermission[]>;
  findById(id: string): Promise<IPermission>;
  create(permission: Partial<IPermission>): Promise<IPermission>;
  update(id: string, permission: Partial<IPermission>): Promise<IPermission>;
  delete(id: string): Promise<boolean>;
  checkPermission(context: IPermissionContext): Promise<boolean>;
  getUserPermissions(userId: string): Promise<IPermission[]>;
}

export interface IPermissionRepository {
  findAll(query?: any): Promise<IPermission[]>;
  findById(id: string): Promise<IPermission>;
  findByName(name: string): Promise<IPermission>;
  findByJourney(journey: string): Promise<IPermission[]>;
  findByResourceAction(resource: string, action: string): Promise<IPermission[]>;
  create(permission: Partial<IPermission>): Promise<IPermission>;
  update(id: string, permission: Partial<IPermission>): Promise<IPermission>;
  delete(id: string): Promise<boolean>;
}