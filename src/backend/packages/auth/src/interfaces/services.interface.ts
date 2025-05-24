import { Service } from '@austa/interfaces/common';
import { FilterDto, PaginatedResponse, PaginationDto } from '@austa/interfaces/common/dto';
import { User } from '../dto/user.dto';
import { Role } from '../dto/role.dto';
import { Permission } from '../dto/permission.dto';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permission.dto';

/**
 * Interface for the Authentication Service
 * Extends the generic Service interface with auth-specific methods
 */
export interface IAuthService {
  /**
   * Validates user credentials for authentication
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns A promise resolving to the authenticated user if credentials are valid
   * @throws UnauthorizedException if credentials are invalid
   */
  validateCredentials(email: string, password: string): Promise<User>;
  
  /**
   * Generates a JWT access token for the authenticated user
   * 
   * @param user - The authenticated user
   * @returns A promise resolving to the JWT access token
   */
  generateAccessToken(user: User): Promise<string>;
  
  /**
   * Generates a refresh token for the authenticated user
   * 
   * @param user - The authenticated user
   * @returns A promise resolving to the refresh token
   */
  generateRefreshToken(user: User): Promise<string>;
  
  /**
   * Validates a refresh token and returns a new access token
   * 
   * @param refreshToken - The refresh token to validate
   * @returns A promise resolving to a new access token
   * @throws UnauthorizedException if the refresh token is invalid
   */
  refreshAccessToken(refreshToken: string): Promise<string>;
  
  /**
   * Invalidates all tokens for a user (logout)
   * 
   * @param userId - The ID of the user to logout
   * @returns A promise resolving to true if successful
   */
  logout(userId: string): Promise<boolean>;
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
   * @throws UnauthorizedException if credentials are invalid
   */
  validateCredentials(email: string, password: string): Promise<User>;
  
  /**
   * Assigns a role to a user
   * 
   * @param userId - The ID of the user
   * @param roleId - The ID of the role to assign
   * @returns A promise resolving to the updated user
   * @throws NotFoundException if the user or role is not found
   */
  assignRole(userId: string, roleId: string): Promise<User>;
  
  /**
   * Removes a role from a user
   * 
   * @param userId - The ID of the user
   * @param roleId - The ID of the role to remove
   * @returns A promise resolving to the updated user
   * @throws NotFoundException if the user or role is not found
   */
  removeRole(userId: string, roleId: string): Promise<User>;
  
  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - The ID of the user
   * @param permissionKey - The permission key to check
   * @returns A promise resolving to true if the user has the permission
   */
  hasPermission(userId: string, permissionKey: string): Promise<boolean>;
  
  /**
   * Gets all permissions for a user (from roles and direct assignments)
   * 
   * @param userId - The ID of the user
   * @returns A promise resolving to an array of permissions
   */
  getPermissions(userId: string): Promise<Permission[]>;
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
   * Assigns a permission to a role
   * 
   * @param roleId - The ID of the role
   * @param permissionId - The ID of the permission to assign
   * @returns A promise resolving to the updated role
   * @throws NotFoundException if the role or permission is not found
   */
  assignPermission(roleId: string, permissionId: string): Promise<Role>;
  
  /**
   * Removes a permission from a role
   * 
   * @param roleId - The ID of the role
   * @param permissionId - The ID of the permission to remove
   * @returns A promise resolving to the updated role
   * @throws NotFoundException if the role or permission is not found
   */
  removePermission(roleId: string, permissionId: string): Promise<Role>;
  
  /**
   * Gets all permissions for a role
   * 
   * @param roleId - The ID of the role
   * @returns A promise resolving to an array of permissions
   */
  getPermissions(roleId: string): Promise<Permission[]>;
  
  /**
   * Gets all users assigned to a role
   * 
   * @param roleId - The ID of the role
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of users
   */
  getUsers(roleId: string, pagination?: PaginationDto): Promise<PaginatedResponse<User>>;
}

/**
 * Interface for the Permission Service
 * Extends the generic Service interface with permission-specific methods
 */
export interface IPermissionService extends Service<Permission, CreatePermissionDto, UpdatePermissionDto> {
  /**
   * Finds a permission by its key
   * 
   * @param key - The permission key (e.g., 'health:metrics:read')
   * @returns A promise resolving to the permission if found
   * @throws NotFoundException if the permission is not found
   */
  findByKey(key: string): Promise<Permission>;
  
  /**
   * Gets all roles that have a specific permission
   * 
   * @param permissionId - The ID of the permission
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of roles
   */
  getRoles(permissionId: string, pagination?: PaginationDto): Promise<PaginatedResponse<Role>>;
  
  /**
   * Gets all users that have a specific permission (directly or via roles)
   * 
   * @param permissionId - The ID of the permission
   * @param pagination - Optional pagination parameters
   * @returns A promise resolving to a paginated response of users
   */
  getUsers(permissionId: string, pagination?: PaginationDto): Promise<PaginatedResponse<User>>;
  
  /**
   * Creates multiple permissions at once
   * 
   * @param permissions - Array of permission data to create
   * @returns A promise resolving to an array of created permissions
   */
  createMany(permissions: CreatePermissionDto[]): Promise<Permission[]>;
  
  /**
   * Checks if a permission exists by its key
   * 
   * @param key - The permission key to check
   * @returns A promise resolving to true if the permission exists
   */
  exists(key: string): Promise<boolean>;
}