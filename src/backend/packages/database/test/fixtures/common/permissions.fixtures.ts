/**
 * Permission test fixtures for all journeys.
 * 
 * This module provides type-safe permission objects with consistent naming patterns
 * that mirror production permissions. Essential for testing authorization, access control,
 * and permission-checking across all services and journey components.
 */

/**
 * Interface representing a permission object.
 */
export interface Permission {
  name: string;
  description: string;
}

/**
 * Factory function to create a permission object.
 * 
 * @param name - The permission name following the format 'journey:resource:action'
 * @param description - Human-readable description of the permission
 * @returns A permission object
 */
export const createPermission = (name: string, description: string): Permission => ({
  name,
  description,
});

/**
 * Health journey permissions.
 */
export const healthPermissions = {
  readMetrics: createPermission('health:metrics:read', 'View health metrics'),
  writeMetrics: createPermission('health:metrics:write', 'Record health metrics'),
  readHistory: createPermission('health:history:read', 'View medical history'),
  writeHistory: createPermission('health:history:write', 'Update medical history'),
  readGoals: createPermission('health:goals:read', 'View health goals'),
  writeGoals: createPermission('health:goals:write', 'Set health goals'),
  readDevices: createPermission('health:devices:read', 'View connected devices'),
  writeDevices: createPermission('health:devices:write', 'Manage device connections'),
};

/**
 * Care journey permissions.
 */
export const carePermissions = {
  readAppointments: createPermission('care:appointments:read', 'View appointments'),
  writeAppointments: createPermission('care:appointments:write', 'Manage appointments'),
  readTelemedicine: createPermission('care:telemedicine:read', 'View telemedicine sessions'),
  writeTelemedicine: createPermission('care:telemedicine:write', 'Manage telemedicine sessions'),
  readMedications: createPermission('care:medications:read', 'View medications'),
  writeMedications: createPermission('care:medications:write', 'Manage medications'),
  readTreatments: createPermission('care:treatments:read', 'View treatment plans'),
  writeTreatments: createPermission('care:treatments:write', 'Manage treatment plans'),
};

/**
 * Plan journey permissions.
 */
export const planPermissions = {
  readCoverage: createPermission('plan:coverage:read', 'View coverage information'),
  readClaims: createPermission('plan:claims:read', 'View claims'),
  writeClaims: createPermission('plan:claims:write', 'Submit and manage claims'),
  readBenefits: createPermission('plan:benefits:read', 'View benefits'),
  readDocuments: createPermission('plan:documents:read', 'View insurance documents'),
  writeDocuments: createPermission('plan:documents:write', 'Upload insurance documents'),
  readPayments: createPermission('plan:payments:read', 'View payment information'),
  useSimulator: createPermission('plan:simulator:use', 'Use cost simulator'),
};

/**
 * Gamification permissions.
 */
export const gamificationPermissions = {
  readAchievements: createPermission('game:achievements:read', 'View achievements'),
  readProgress: createPermission('game:progress:read', 'View progress'),
  readRewards: createPermission('game:rewards:read', 'View rewards'),
  redeemRewards: createPermission('game:rewards:redeem', 'Redeem rewards'),
  readLeaderboard: createPermission('game:leaderboard:read', 'View leaderboards'),
};

/**
 * All permissions grouped by journey.
 */
export const allPermissions = {
  health: healthPermissions,
  care: carePermissions,
  plan: planPermissions,
  gamification: gamificationPermissions,
};

/**
 * Returns all permissions as a flat array.
 */
export const getAllPermissionsArray = (): Permission[] => [
  ...Object.values(healthPermissions),
  ...Object.values(carePermissions),
  ...Object.values(planPermissions),
  ...Object.values(gamificationPermissions),
];

/**
 * Returns permissions for a specific journey as an array.
 * 
 * @param journey - The journey name ('health', 'care', 'plan', or 'gamification')
 * @returns Array of permissions for the specified journey
 */
export const getJourneyPermissions = (journey: keyof typeof allPermissions): Permission[] => {
  return Object.values(allPermissions[journey]);
};

/**
 * Returns permissions by name.
 * 
 * @param permissionNames - Array of permission names to retrieve
 * @returns Array of matching permission objects
 */
export const getPermissionsByName = (permissionNames: string[]): Permission[] => {
  const allPerms = getAllPermissionsArray();
  return permissionNames.map(name => {
    const permission = allPerms.find(p => p.name === name);
    if (!permission) {
      throw new Error(`Permission not found: ${name}`);
    }
    return permission;
  });
};

/**
 * Predefined permission sets for common testing scenarios.
 */
export const permissionSets = {
  /**
   * Basic user permissions (read-only for most resources).
   */
  basicUser: [
    healthPermissions.readMetrics,
    healthPermissions.readGoals,
    healthPermissions.readDevices,
    carePermissions.readAppointments,
    carePermissions.readMedications,
    carePermissions.readTreatments,
    planPermissions.readCoverage,
    planPermissions.readBenefits,
    planPermissions.readClaims,
    gamificationPermissions.readAchievements,
    gamificationPermissions.readProgress,
    gamificationPermissions.readRewards,
  ],
  
  /**
   * Full user permissions (read/write for all resources).
   */
  fullUser: getAllPermissionsArray(),
  
  /**
   * Caregiver permissions (read-only for health and care data).
   */
  caregiver: [
    healthPermissions.readMetrics,
    healthPermissions.readHistory,
    healthPermissions.readGoals,
    carePermissions.readAppointments,
    carePermissions.writeAppointments,
    carePermissions.readMedications,
    carePermissions.readTreatments,
  ],
  
  /**
   * Healthcare provider permissions (full access to health and care data).
   */
  provider: [
    healthPermissions.readMetrics,
    healthPermissions.readHistory,
    healthPermissions.writeHistory,
    carePermissions.readAppointments,
    carePermissions.writeAppointments,
    carePermissions.readTelemedicine,
    carePermissions.writeTelemedicine,
    carePermissions.readMedications,
    carePermissions.writeMedications,
    carePermissions.readTreatments,
    carePermissions.writeTreatments,
  ],
};