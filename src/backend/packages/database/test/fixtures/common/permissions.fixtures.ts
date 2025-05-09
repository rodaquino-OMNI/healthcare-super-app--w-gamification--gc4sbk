/**
 * @file Permission test fixtures for all journeys (health, care, plan, gamification).
 * 
 * This file provides type-safe permission objects with consistent naming patterns that mirror
 * production permissions. These fixtures are essential for testing authorization, access control,
 * and permission-checking across all services and journey components.
 */

/**
 * Interface representing a permission fixture for testing.
 */
export interface PermissionFixture {
  /** Unique identifier for the permission */
  id?: string;
  /** Name of the permission in format 'journey:resource:action' */
  name: string;
  /** Human-readable description of what the permission allows */
  description: string;
  /** Optional journey this permission belongs to */
  journey?: 'health' | 'care' | 'plan' | 'gamification' | null;
}

/**
 * Factory function to create a permission fixture with default values.
 * 
 * @param overrides - Optional properties to override default values
 * @returns A permission fixture object
 */
export function createPermissionFixture(overrides?: Partial<PermissionFixture>): PermissionFixture {
  return {
    id: `permission-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: 'test:resource:action',
    description: 'Test permission for testing purposes',
    journey: null,
    ...overrides,
  };
}

/**
 * Health journey permissions for testing.
 */
export const healthPermissions = {
  /** Permission to view health metrics */
  viewMetrics: createPermissionFixture({
    id: 'health-metrics-read',
    name: 'health:metrics:read',
    description: 'View health metrics',
    journey: 'health',
  }),
  
  /** Permission to record health metrics */
  recordMetrics: createPermissionFixture({
    id: 'health-metrics-write',
    name: 'health:metrics:write',
    description: 'Record health metrics',
    journey: 'health',
  }),
  
  /** Permission to view medical history */
  viewHistory: createPermissionFixture({
    id: 'health-history-read',
    name: 'health:history:read',
    description: 'View medical history',
    journey: 'health',
  }),
  
  /** Permission to update medical history */
  updateHistory: createPermissionFixture({
    id: 'health-history-write',
    name: 'health:history:write',
    description: 'Update medical history',
    journey: 'health',
  }),
  
  /** Permission to view health goals */
  viewGoals: createPermissionFixture({
    id: 'health-goals-read',
    name: 'health:goals:read',
    description: 'View health goals',
    journey: 'health',
  }),
  
  /** Permission to set health goals */
  setGoals: createPermissionFixture({
    id: 'health-goals-write',
    name: 'health:goals:write',
    description: 'Set health goals',
    journey: 'health',
  }),
  
  /** Permission to view connected devices */
  viewDevices: createPermissionFixture({
    id: 'health-devices-read',
    name: 'health:devices:read',
    description: 'View connected devices',
    journey: 'health',
  }),
  
  /** Permission to manage device connections */
  manageDevices: createPermissionFixture({
    id: 'health-devices-write',
    name: 'health:devices:write',
    description: 'Manage device connections',
    journey: 'health',
  }),
};

/**
 * Care journey permissions for testing.
 */
export const carePermissions = {
  /** Permission to view appointments */
  viewAppointments: createPermissionFixture({
    id: 'care-appointments-read',
    name: 'care:appointments:read',
    description: 'View appointments',
    journey: 'care',
  }),
  
  /** Permission to manage appointments */
  manageAppointments: createPermissionFixture({
    id: 'care-appointments-write',
    name: 'care:appointments:write',
    description: 'Manage appointments',
    journey: 'care',
  }),
  
  /** Permission to view telemedicine sessions */
  viewTelemedicine: createPermissionFixture({
    id: 'care-telemedicine-read',
    name: 'care:telemedicine:read',
    description: 'View telemedicine sessions',
    journey: 'care',
  }),
  
  /** Permission to manage telemedicine sessions */
  manageTelemedicine: createPermissionFixture({
    id: 'care-telemedicine-write',
    name: 'care:telemedicine:write',
    description: 'Manage telemedicine sessions',
    journey: 'care',
  }),
  
  /** Permission to view medications */
  viewMedications: createPermissionFixture({
    id: 'care-medications-read',
    name: 'care:medications:read',
    description: 'View medications',
    journey: 'care',
  }),
  
  /** Permission to manage medications */
  manageMedications: createPermissionFixture({
    id: 'care-medications-write',
    name: 'care:medications:write',
    description: 'Manage medications',
    journey: 'care',
  }),
  
  /** Permission to view treatment plans */
  viewTreatments: createPermissionFixture({
    id: 'care-treatments-read',
    name: 'care:treatments:read',
    description: 'View treatment plans',
    journey: 'care',
  }),
  
  /** Permission to manage treatment plans */
  manageTreatments: createPermissionFixture({
    id: 'care-treatments-write',
    name: 'care:treatments:write',
    description: 'Manage treatment plans',
    journey: 'care',
  }),
};

/**
 * Plan journey permissions for testing.
 */
export const planPermissions = {
  /** Permission to view coverage information */
  viewCoverage: createPermissionFixture({
    id: 'plan-coverage-read',
    name: 'plan:coverage:read',
    description: 'View coverage information',
    journey: 'plan',
  }),
  
  /** Permission to view claims */
  viewClaims: createPermissionFixture({
    id: 'plan-claims-read',
    name: 'plan:claims:read',
    description: 'View claims',
    journey: 'plan',
  }),
  
  /** Permission to submit and manage claims */
  manageClaims: createPermissionFixture({
    id: 'plan-claims-write',
    name: 'plan:claims:write',
    description: 'Submit and manage claims',
    journey: 'plan',
  }),
  
  /** Permission to view benefits */
  viewBenefits: createPermissionFixture({
    id: 'plan-benefits-read',
    name: 'plan:benefits:read',
    description: 'View benefits',
    journey: 'plan',
  }),
  
  /** Permission to view insurance documents */
  viewDocuments: createPermissionFixture({
    id: 'plan-documents-read',
    name: 'plan:documents:read',
    description: 'View insurance documents',
    journey: 'plan',
  }),
  
  /** Permission to upload insurance documents */
  uploadDocuments: createPermissionFixture({
    id: 'plan-documents-write',
    name: 'plan:documents:write',
    description: 'Upload insurance documents',
    journey: 'plan',
  }),
  
  /** Permission to view payment information */
  viewPayments: createPermissionFixture({
    id: 'plan-payments-read',
    name: 'plan:payments:read',
    description: 'View payment information',
    journey: 'plan',
  }),
  
  /** Permission to use cost simulator */
  useSimulator: createPermissionFixture({
    id: 'plan-simulator-use',
    name: 'plan:simulator:use',
    description: 'Use cost simulator',
    journey: 'plan',
  }),
};

/**
 * Gamification permissions for testing.
 */
export const gamificationPermissions = {
  /** Permission to view achievements */
  viewAchievements: createPermissionFixture({
    id: 'game-achievements-read',
    name: 'game:achievements:read',
    description: 'View achievements',
    journey: 'gamification',
  }),
  
  /** Permission to view progress */
  viewProgress: createPermissionFixture({
    id: 'game-progress-read',
    name: 'game:progress:read',
    description: 'View progress',
    journey: 'gamification',
  }),
  
  /** Permission to view rewards */
  viewRewards: createPermissionFixture({
    id: 'game-rewards-read',
    name: 'game:rewards:read',
    description: 'View rewards',
    journey: 'gamification',
  }),
  
  /** Permission to redeem rewards */
  redeemRewards: createPermissionFixture({
    id: 'game-rewards-redeem',
    name: 'game:rewards:redeem',
    description: 'Redeem rewards',
    journey: 'gamification',
  }),
  
  /** Permission to view leaderboards */
  viewLeaderboard: createPermissionFixture({
    id: 'game-leaderboard-read',
    name: 'game:leaderboard:read',
    description: 'View leaderboards',
    journey: 'gamification',
  }),
};

/**
 * All permissions grouped by journey for easier test setup.
 */
export const allPermissions = {
  health: healthPermissions,
  care: carePermissions,
  plan: planPermissions,
  gamification: gamificationPermissions,
};

/**
 * Returns all permissions as a flat array for bulk operations.
 */
export function getAllPermissionsArray(): PermissionFixture[] {
  return [
    ...Object.values(healthPermissions),
    ...Object.values(carePermissions),
    ...Object.values(planPermissions),
    ...Object.values(gamificationPermissions),
  ];
}

/**
 * Returns permissions for a specific journey.
 * 
 * @param journey - The journey to get permissions for
 * @returns An array of permission fixtures for the specified journey
 */
export function getJourneyPermissions(journey: 'health' | 'care' | 'plan' | 'gamification'): PermissionFixture[] {
  return Object.values(allPermissions[journey]);
}

/**
 * Returns permissions for a specific resource within a journey.
 * 
 * @param journey - The journey containing the resource
 * @param resource - The resource to get permissions for (e.g., 'metrics', 'appointments')
 * @returns An array of permission fixtures for the specified resource
 */
export function getResourcePermissions(journey: string, resource: string): PermissionFixture[] {
  const journeyPermissions = journey === 'game' ? 
    Object.values(gamificationPermissions) : 
    Object.values(allPermissions[journey as keyof typeof allPermissions] || {});
  
  return journeyPermissions.filter(permission => {
    const parts = permission.name.split(':');
    return parts.length > 1 && parts[1] === resource;
  });
}

/**
 * Returns permissions with a specific action across all journeys.
 * 
 * @param action - The action to filter by (e.g., 'read', 'write')
 * @returns An array of permission fixtures with the specified action
 */
export function getActionPermissions(action: string): PermissionFixture[] {
  return getAllPermissionsArray().filter(permission => {
    const parts = permission.name.split(':');
    return parts.length > 2 && parts[2] === action;
  });
}

/**
 * Creates a custom permission with the specified journey, resource, and action.
 * 
 * @param journey - The journey for the permission (e.g., 'health', 'care')
 * @param resource - The resource the permission applies to (e.g., 'metrics', 'appointments')
 * @param action - The action allowed by the permission (e.g., 'read', 'write')
 * @param description - Optional description for the permission
 * @returns A permission fixture with the specified properties
 */
export function createCustomPermission(
  journey: string,
  resource: string,
  action: string,
  description?: string
): PermissionFixture {
  const name = `${journey}:${resource}:${action}`;
  const id = `${journey}-${resource}-${action}`;
  
  return createPermissionFixture({
    id,
    name,
    description: description || `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
    journey: journey === 'game' ? 'gamification' : journey as any,
  });
}

/**
 * Default export for easier importing.
 */
export default {
  createPermissionFixture,
  healthPermissions,
  carePermissions,
  planPermissions,
  gamificationPermissions,
  allPermissions,
  getAllPermissionsArray,
  getJourneyPermissions,
  getResourcePermissions,
  getActionPermissions,
  createCustomPermission,
};