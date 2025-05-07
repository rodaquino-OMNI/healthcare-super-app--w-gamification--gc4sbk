/**
 * Role interface that represents the structure of role objects used throughout the auth service.
 * This interface ensures type safety when working with roles by defining the required properties
 * and optional properties that correspond to the Role entity.
 */

import { IRole } from '@austa/interfaces/auth';

/**
 * Re-export the IRole interface from @austa/interfaces/auth package.
 * This interface defines the structure of role objects used throughout the auth service.
 * 
 * @property id - Unique identifier for the role
 * @property name - Unique name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator')
 * @property description - Description of the role and its purpose
 * @property journey - The journey this role is associated with (health, care, plan, or null for global roles)
 * @property isDefault - Indicates if this is a default role assigned to new users
 */
export { IRole };

/**
 * Type alias for role journey types to ensure consistent journey values across the application.
 * This helps maintain type safety when assigning journeys to roles.
 */
export type RoleJourney = 'health' | 'care' | 'plan' | null;