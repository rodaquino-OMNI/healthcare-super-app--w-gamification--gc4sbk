import { IUser } from '@app/auth/users/interfaces/user.interface';
import { IPermissionContext } from '@app/auth/permissions/interfaces/permission-context.interface';
import { IJourneyContext } from '@austa/interfaces/journey';

/**
 * Simplified permission context type for basic permission validation scenarios
 * For more complex attribute-based access control, use the full IPermissionContext
 */
export interface IPermissionCheckContext {
  /**
   * The journey context (health, care, plan)
   * Aligns with the three distinct user journeys in the AUSTA SuperApp
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Resource information for attribute-based access control
   */
  resource?: {
    /**
     * The type of resource being accessed
     */
    type: string;
    
    /**
     * The identifier of the specific resource
     */
    id?: string;
    
    /**
     * The owner of the resource (typically a user ID)
     */
    ownerId?: string;
    
    /**
     * Additional metadata about the resource
     */
    metadata?: Record<string, unknown>;
  };
  
  /**
   * Action being performed
   */
  action?: {
    /**
     * The operation being performed (read, write, delete, etc.)
     */
    operation: string;
    
    /**
     * Additional data related to the action
     */
    data?: Record<string, unknown>;
  };
  
  /**
   * Journey-specific contextual data
   */
  journeyContext?: IJourneyContext;
  
  /**
   * Additional attributes for context-aware permission checking
   */
  attributes?: Record<string, unknown>;
}

/**
 * Result of a permission check operation
 */
export interface IPermissionCheckResult {
  /**
   * Whether the permission check was successful
   */
  granted: boolean;
  
  /**
   * Reason for denial if permission was not granted
   */
  reason?: string;
  
  /**
   * Error code for standardized error handling
   */
  errorCode?: string;
  
  /**
   * Additional details about the permission check result
   */
  details?: Record<string, unknown>;
}

/**
 * Interface for permission validation and authorization
 * 
 * Provides the contract for checking if a user has specific permissions
 * either through roles or direct permission assignment. Supports both
 * role-based and attribute-based access control patterns.
 * 
 * This interface is a critical component of the journey-centered architecture,
 * enabling secure access control across all three user journeys
 * ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 */
export interface IPermissionCheck {
  /**
   * Checks if a user has a specific permission
   * 
   * @param user The user to check permissions for
   * @param permissionName The name of the permission to check
   * @param context Optional context for journey-specific or attribute-based permission validation
   * @returns A promise resolving to the permission check result
   */
  hasPermission(user: IUser, permissionName: string, context?: IPermissionCheckContext): Promise<IPermissionCheckResult>;
  
  /**
   * Checks if a user has any of the specified permissions
   * 
   * @param user The user to check permissions for
   * @param permissionNames Array of permission names to check
   * @param context Optional context for journey-specific or attribute-based permission validation
   * @returns A promise resolving to the permission check result
   */
  hasAnyPermission(user: IUser, permissionNames: string[], context?: IPermissionCheckContext): Promise<IPermissionCheckResult>;
  
  /**
   * Checks if a user has all of the specified permissions
   * 
   * @param user The user to check permissions for
   * @param permissionNames Array of permission names to check
   * @param context Optional context for journey-specific or attribute-based permission validation
   * @returns A promise resolving to the permission check result
   */
  hasAllPermissions(user: IUser, permissionNames: string[], context?: IPermissionCheckContext): Promise<IPermissionCheckResult>;
  
  /**
   * Checks if a user has a specific role
   * 
   * @param user The user to check roles for
   * @param roleName The name of the role to check
   * @param context Optional context for journey-specific role validation
   * @returns A promise resolving to the permission check result
   */
  hasRole(user: IUser, roleName: string, context?: IPermissionCheckContext): Promise<IPermissionCheckResult>;
  
  /**
   * Checks if a user has any of the specified roles
   * 
   * @param user The user to check roles for
   * @param roleNames Array of role names to check
   * @param context Optional context for journey-specific role validation
   * @returns A promise resolving to the permission check result
   */
  hasAnyRole(user: IUser, roleNames: string[], context?: IPermissionCheckContext): Promise<IPermissionCheckResult>;
  
  /**
   * Validates access to a specific resource based on attribute-based rules
   * 
   * This method implements attribute-based access control (ABAC) by evaluating
   * permissions based on the attributes of the user, resource, action, and environment.
   * 
   * @param user The user requesting access
   * @param resourceType The type of resource being accessed
   * @param resourceId The identifier of the specific resource
   * @param action The action being performed (read, write, delete, etc.)
   * @param attributes Additional attributes for context-aware permission checking
   * @returns A promise resolving to the permission check result
   */
  validateResourceAccess(
    user: IUser,
    resourceType: string,
    resourceId: string,
    action: string,
    attributes?: Record<string, unknown>
  ): Promise<IPermissionCheckResult>;
  
  /**
   * Validates journey-specific permissions for a user
   * 
   * This method is specifically designed for the journey-centered architecture,
   * allowing permission checks to be contextualized within one of the three
   * user journeys ("Minha Saúde", "Cuidar-me Agora", or "Meu Plano & Benefícios").
   * 
   * @param user The user to check permissions for
   * @param journey The journey context (health, care, plan)
   * @param permissionName The name of the permission to check
   * @param attributes Additional attributes for context-aware permission checking
   * @returns A promise resolving to the permission check result
   */
  validateJourneyPermission(
    user: IUser,
    journey: 'health' | 'care' | 'plan',
    permissionName: string,
    attributes?: Record<string, unknown>
  ): Promise<IPermissionCheckResult>;
  
  /**
   * Performs a comprehensive permission check using the full permission context
   * 
   * This method provides the most flexible and powerful permission checking capability,
   * taking into account all aspects of the permission context including user information,
   * resource details, action being performed, and environmental factors.
   * 
   * @param context The comprehensive permission context containing all information needed for the check
   * @returns A promise resolving to the permission check result
   */
  evaluatePermission(context: IPermissionContext): Promise<IPermissionCheckResult>;
}