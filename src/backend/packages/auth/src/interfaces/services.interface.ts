import { Service } from '@austa/interfaces/common';
import { FilterDto, PaginatedResponse, PaginationDto } from '@austa/interfaces/common/dto';

// Import types from @austa/interfaces to ensure consistency across services
import { User, CreateUserDto, UpdateUserDto } from '@austa/interfaces/auth';
import { Role, CreateRoleDto, UpdateRoleDto } from '@austa/interfaces/auth';
import { Permission, CreatePermissionDto, UpdatePermissionDto } from '@austa/interfaces/auth';
import { TokenResponseDto } from '../dto/token-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

/**
 * Interface for the Authentication Service
 * Provides authentication-specific methods for user authentication, token generation,
 * and session management across the AUSTA SuperApp.
 */
export interface IAuthService {
  /**
   * Validates user credentials for authentication
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns A promise resolving to the authenticated user if credentials are valid
   * @throws Unauthorized exception if credentials are invalid
   */
  validateCredentials(email: string, password: string): Promise<User>;
  
  /**
   * Generates authentication tokens for the authenticated user
   * 
   * @param user - The authenticated user
   * @returns A promise resolving to the token response containing access and refresh tokens
   */
  generateTokens(user: User): Promise<TokenResponseDto>;
  
  /**
   * Validates a refresh token and issues new access and refresh tokens
   * 
   * @param refreshTokenDto - The refresh token DTO containing the token to validate
   * @returns A promise resolving to a new token response containing access and refresh tokens
   * @throws UnauthorizedException if the refresh token is invalid or expired
   */
  refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto>;
  
  /**
   * Invalidates all tokens for a user (logout)
   * 
   * @param userId - The ID of the user to logout
   * @param refreshToken - Optional refresh token to invalidate specifically
   * @returns A promise resolving to true if successful
   * @throws NotFoundException if the user is not found
   */
  logout(userId: string, refreshToken?: string): Promise<boolean>;
  
  /**
   * Validates a JWT access token
   * 
   * @param token - The JWT access token to validate
   * @returns A promise resolving to the decoded user data if valid
   * @throws UnauthorizedException if the token is invalid or expired
   */
  validateToken(token: string): Promise<User>;
}

/**
 * Interface for the User Service
 * Extends the generic Service interface with user-specific methods
 */
export interface IUserService extends Service<User, CreateUserDto, UpdateUserDto> {
  /**
   * Finds a user by their email address
   * 
   * @param email - The email address to search for
   * @returns A promise resolving to the user if found
   * @throws NotFoundException if the user is not found
   */
  findByEmail(email: string): Promise<User>;
  
  /**
   * Validates user credentials for authentication
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns A promise resolving to the authenticated user if credentials are valid
   * @throws Unauthorized exception if credentials are invalid
   */
  validateCredentials(email: string, password: string): Promise<User>;
  
  /**
   * Assigns a role to a user
   * 
   * @param userId - The ID of the user
   * @param roleId - The ID of the role to assign
   * @returns A promise resolving to the updated user
   */
  assignRole(userId: string, roleId: string): Promise<User>;
  
  /**
   * Removes a role from a user
   * 
   * @param userId - The ID of the user
   * @param roleId - The ID of the role to remove
   * @returns A promise resolving to the updated user
   */
  removeRole(userId: string, roleId: string): Promise<User>;
  
  /**
   * Gets all permissions for a user (including those from roles)
   * 
   * @param userId - The ID of the user
   * @returns A promise resolving to an array of permissions
   * @throws NotFoundException if the user is not found
   */
  getUserPermissions(userId: string): Promise<Permission[]>;
  
  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - The ID of the user
   * @param permissionCode - The permission code to check
   * @returns A promise resolving to true if the user has the permission
   * @throws NotFoundException if the user is not found
   */
  hasPermission(userId: string, permissionCode: string): Promise<boolean>;
}

/**
 * Interface for the Role Service
 * Extends the generic Service interface with role-specific methods
 */
export interface IRoleService extends Service<Role, CreateRoleDto, UpdateRoleDto> {
  /**
   * Finds a role by its name
   * 
   * @param name - The name of the role
   * @returns A promise resolving to the role if found
   * @throws NotFoundException if the role is not found
   */
  findByName(name: string): Promise<Role>;
  
  /**
   * Gets the default role for new users
   * 
   * @returns A promise resolving to the default role
   * @throws NotFoundException if no default role is configured
   */
  getDefaultRole(): Promise<Role>;
  
  /**
   * Assigns a permission to a role
   * 
   * @param roleId - The ID of the role
   * @param permissionId - The ID of the permission to assign
   * @returns A promise resolving to the updated role
   */
  assignPermission(roleId: string, permissionId: string): Promise<Role>;
  
  /**
   * Removes a permission from a role
   * 
   * @param roleId - The ID of the role
   * @param permissionId - The ID of the permission to remove
   * @returns A promise resolving to the updated role
   */
  removePermission(roleId: string, permissionId: string): Promise<Role>;
  
  /**
   * Gets all permissions for a role
   * 
   * @param roleId - The ID of the role
   * @returns A promise resolving to an array of permissions
   */
  getRolePermissions(roleId: string): Promise<Permission[]>;
}

/**
 * Interface for the Permission Service
 * Extends the generic Service interface with permission-specific methods
 */
export interface IPermissionService extends Service<Permission, CreatePermissionDto, UpdatePermissionDto> {
  /**
   * Finds a permission by its code
   * 
   * @param code - The permission code (e.g., 'health:metrics:read')
   * @returns A promise resolving to the permission if found
   * @throws NotFoundException if the permission is not found
   */
  findByCode(code: string): Promise<Permission>;
  
  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - The ID of the user
   * @param permissionCode - The permission code to check
   * @returns A promise resolving to true if the user has the permission
   */
  hasPermission(userId: string, permissionCode: string): Promise<boolean>;
  
  /**
   * Gets all permissions for a journey
   * 
   * @param journey - The journey name (e.g., 'health', 'care', 'plan')
   * @returns A promise resolving to an array of permissions for the journey
   */
  getJourneyPermissions(journey: string): Promise<Permission[]>;
  
  /**
   * Creates default journey permissions if they don't exist
   * 
   * @param journey - The journey name (e.g., 'health', 'care', 'plan')
   * @returns A promise resolving to an array of created permissions
   */
  createDefaultJourneyPermissions(journey: string): Promise<Permission[]>;
  
  /**
   * Assigns a permission directly to a user (not through a role)
   * 
   * @param userId - The ID of the user
   * @param permissionId - The ID of the permission to assign
   * @returns A promise resolving to true if successful
   */
  assignToUser(userId: string, permissionId: string): Promise<boolean>;
  
  /**
   * Removes a permission directly from a user (not through a role)
   * 
   * @param userId - The ID of the user
   * @param permissionId - The ID of the permission to remove
   * @returns A promise resolving to true if successful
   */
  removeFromUser(userId: string, permissionId: string): Promise<boolean>;
}