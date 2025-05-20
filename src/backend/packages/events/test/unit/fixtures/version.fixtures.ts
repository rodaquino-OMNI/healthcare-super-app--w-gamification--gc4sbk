/**
 * @file version.fixtures.ts
 * @description Provides test fixtures for event schema versioning, including events with different
 * schema versions, compatibility test cases, and version migration scenarios. These fixtures are
 * essential for testing the event versioning system, ensuring backward compatibility, and validating
 * version evolution strategies across the events package.
 *
 * @module events/test/unit/fixtures
 */

import { EventType } from '../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../../src/dto/event-metadata.dto';
import {
  VersionedEventDto,
  VersionMigrationFn,
  createVersionedEvent,
  createVersionFromString,
  compareVersions,
  isVersionCompatible,
  registerVersionMigration,
  canMigrate,
  getLatestVersion,
  upgradeEventPayload,
  registerMigrationChain
} from '../../../src/dto/version.dto';

// ===== BASIC VERSION OBJECTS =====

/**
 * Collection of EventVersionDto objects for testing version comparison and compatibility.
 */
export const versionObjects = {
  v1_0_0: createVersionFromString('1.0.0'),
  v1_0_1: createVersionFromString('1.0.1'),
  v1_1_0: createVersionFromString('1.1.0'),
  v1_1_1: createVersionFromString('1.1.1'),
  v1_2_0: createVersionFromString('1.2.0'),
  v2_0_0: createVersionFromString('2.0.0'),
  v2_1_0: createVersionFromString('2.1.0'),
  v3_0_0: createVersionFromString('3.0.0'),
};

/**
 * Collection of version strings for testing version parsing and formatting.
 */
export const versionStrings = {
  valid: [
    '1.0.0',
    '1.0.1',
    '1.1.0',
    '2.0.0',
    '10.20.30',
  ],
  invalid: [
    '1.0',       // Missing patch version
    '1',          // Missing minor and patch versions
    'a.b.c',      // Non-numeric components
    '1.0.0.0',    // Too many components
    '',           // Empty string
    '1.0.0-beta',  // Pre-release not supported
    '1.0.0+build', // Build metadata not supported
  ],
  malformed: [
    '01.02.03',   // Leading zeros
    ' 1.0.0 ',     // Extra whitespace
    '1..0',        // Missing component
    '.1.0',        // Missing component
    '1.0.',        // Missing component
  ],
};

// ===== VERSION COMPARISON TEST CASES =====

/**
 * Test cases for the compareVersions function.
 * Each case includes two versions and the expected comparison result.
 */
export const versionComparisonTestCases = [
  // Equal versions
  { version1: '1.0.0', version2: '1.0.0', expected: 0 },
  
  // First version is less than second
  { version1: '1.0.0', version2: '1.0.1', expected: -1 },
  { version1: '1.0.0', version2: '1.1.0', expected: -1 },
  { version1: '1.0.0', version2: '2.0.0', expected: -1 },
  { version1: '1.1.0', version2: '1.2.0', expected: -1 },
  { version1: '1.9.9', version2: '2.0.0', expected: -1 },
  
  // First version is greater than second
  { version1: '1.0.1', version2: '1.0.0', expected: 1 },
  { version1: '1.1.0', version2: '1.0.0', expected: 1 },
  { version1: '2.0.0', version2: '1.0.0', expected: 1 },
  { version1: '1.2.0', version2: '1.1.0', expected: 1 },
  { version1: '2.0.0', version2: '1.9.9', expected: 1 },
  
  // Complex comparisons
  { version1: '2.1.0', version2: '2.0.1', expected: 1 },
  { version1: '2.0.1', version2: '2.1.0', expected: -1 },
  { version1: '10.0.0', version2: '2.0.0', expected: 1 },
  { version1: '1.10.0', version2: '1.2.0', expected: 1 },
  { version1: '1.0.10', version2: '1.0.2', expected: 1 },
];

// ===== VERSION COMPATIBILITY TEST CASES =====

/**
 * Test cases for the isVersionCompatible function.
 * Each case includes current and required versions and the expected compatibility result.
 */
export const versionCompatibilityTestCases = [
  // Same version is always compatible
  { currentVersion: '1.0.0', requiredVersion: '1.0.0', compatible: true },
  
  // Higher minor version is compatible with lower minor version
  { currentVersion: '1.1.0', requiredVersion: '1.0.0', compatible: true },
  { currentVersion: '1.2.0', requiredVersion: '1.0.0', compatible: true },
  { currentVersion: '1.2.0', requiredVersion: '1.1.0', compatible: true },
  
  // Higher patch version is compatible with lower patch version
  { currentVersion: '1.0.1', requiredVersion: '1.0.0', compatible: true },
  { currentVersion: '1.1.2', requiredVersion: '1.1.0', compatible: true },
  { currentVersion: '1.1.2', requiredVersion: '1.1.1', compatible: true },
  
  // Different major versions are not compatible
  { currentVersion: '2.0.0', requiredVersion: '1.0.0', compatible: false },
  { currentVersion: '1.0.0', requiredVersion: '2.0.0', compatible: false },
  { currentVersion: '3.0.0', requiredVersion: '2.0.0', compatible: false },
  
  // Lower minor version is not compatible with higher minor version
  { currentVersion: '1.0.0', requiredVersion: '1.1.0', compatible: false },
  { currentVersion: '1.1.0', requiredVersion: '1.2.0', compatible: false },
  
  // Lower patch version is not compatible with higher patch version
  { currentVersion: '1.0.0', requiredVersion: '1.0.1', compatible: false },
  { currentVersion: '1.1.0', requiredVersion: '1.1.1', compatible: false },
  
  // Edge cases
  { currentVersion: '1.0.0', requiredVersion: '1.0.0-beta', compatible: false }, // Pre-release not supported
  { currentVersion: '1.0.0-beta', requiredVersion: '1.0.0', compatible: false }, // Pre-release not supported
];

// ===== GENERIC EVENT FIXTURES =====

/**
 * Generic event type for testing versioning without specific event schemas.
 */
export interface GenericEvent {
  id: string;
  name: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Creates a generic event with the specified version.
 * 
 * @param version Version string in 'major.minor.patch' format
 * @param data Optional custom data to include in the event
 * @returns A versioned generic event
 */
export function createGenericEvent(
  version: string,
  data: Partial<GenericEvent> = {}
): VersionedEventDto<GenericEvent> {
  return createVersionedEvent<GenericEvent>(
    'GENERIC_EVENT',
    {
      id: data.id || `event-${Date.now()}`,
      name: data.name || 'Generic Event',
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.data || {},
    },
    createVersionFromString(version)
  );
}

/**
 * Collection of generic events with different versions for testing.
 */
export const genericEvents = {
  v1_0_0: createGenericEvent('1.0.0', {
    data: { version: '1.0.0', features: ['basic'] },
  }),
  v1_1_0: createGenericEvent('1.1.0', {
    data: { version: '1.1.0', features: ['basic', 'enhanced'] },
  }),
  v2_0_0: createGenericEvent('2.0.0', {
    data: { version: '2.0.0', features: ['basic', 'enhanced', 'advanced'] },
  }),
};

// ===== VERSION MIGRATION FIXTURES =====

/**
 * Migration function from v1.0.0 to v1.1.0 for generic events.
 * Adds the 'enhanced' feature to the features array.
 */
export const genericEventV1_0_0_to_V1_1_0: VersionMigrationFn<GenericEvent> = (oldData) => ({
  ...oldData,
  data: {
    ...oldData.data,
    version: '1.1.0',
    features: [...(oldData.data.features || []), 'enhanced'],
  },
});

/**
 * Migration function from v1.1.0 to v2.0.0 for generic events.
 * Adds the 'advanced' feature to the features array and restructures some fields.
 */
export const genericEventV1_1_0_to_V2_0_0: VersionMigrationFn<GenericEvent> = (oldData) => ({
  ...oldData,
  data: {
    ...oldData.data,
    version: '2.0.0',
    features: [...(oldData.data.features || []), 'advanced'],
    metadata: {
      originalVersion: oldData.data.version,
      migrated: true,
      migratedAt: new Date().toISOString(),
    },
  },
});

/**
 * Migration function from v2.0.0 to v3.0.0 for generic events.
 * Completely restructures the event format with breaking changes.
 */
export const genericEventV2_0_0_to_V3_0_0: VersionMigrationFn<GenericEvent> = (oldData) => {
  // Extract features from old data
  const features = oldData.data.features || [];
  
  // Create a completely new structure
  return {
    id: oldData.id,
    name: `${oldData.name} (Migrated to v3)`,
    timestamp: oldData.timestamp,
    data: {
      version: '3.0.0',
      capabilities: features.map(f => ({ name: f, enabled: true })),
      config: {
        settings: {
          advanced: features.includes('advanced'),
          enhanced: features.includes('enhanced'),
          basic: features.includes('basic'),
        },
      },
      history: [
        {
          previousVersion: oldData.data.version,
          migratedAt: new Date().toISOString(),
        },
      ],
    },
  };
};

// ===== MIGRATION PATH TEST CASES =====

/**
 * Test cases for finding migration paths between versions.
 * Each case includes event type, source and target versions, and expected migration steps.
 */
export const migrationPathTestCases = [
  // Direct migrations
  {
    eventType: 'GENERIC_EVENT',
    source: '1.0.0',
    target: '1.1.0',
    expectedPath: ['1.0.0->1.1.0'],
  },
  {
    eventType: 'GENERIC_EVENT',
    source: '1.1.0',
    target: '2.0.0',
    expectedPath: ['1.1.0->2.0.0'],
  },
  {
    eventType: 'GENERIC_EVENT',
    source: '2.0.0',
    target: '3.0.0',
    expectedPath: ['2.0.0->3.0.0'],
  },
  
  // Multi-step migrations
  {
    eventType: 'GENERIC_EVENT',
    source: '1.0.0',
    target: '2.0.0',
    expectedPath: ['1.0.0->1.1.0', '1.1.0->2.0.0'],
  },
  {
    eventType: 'GENERIC_EVENT',
    source: '1.0.0',
    target: '3.0.0',
    expectedPath: ['1.0.0->1.1.0', '1.1.0->2.0.0', '2.0.0->3.0.0'],
  },
  
  // No migration path
  {
    eventType: 'UNKNOWN_EVENT_TYPE',
    source: '1.0.0',
    target: '2.0.0',
    expectedPath: null,
  },
  {
    eventType: 'GENERIC_EVENT',
    source: '1.0.0',
    target: '4.0.0', // No path to this version
    expectedPath: null,
  },
];

// ===== EDGE CASES =====

/**
 * Edge cases for version handling.
 */
export const versionEdgeCases = {
  // Events with invalid versions
  invalidVersions: [
    // Missing version
    createVersionedEvent('GENERIC_EVENT', { id: 'no-version' }, undefined),
    
    // Invalid version format
    (() => {
      const event = createVersionedEvent('GENERIC_EVENT', { id: 'invalid-format' });
      event.version.major = 'a'; // Non-numeric major version
      return event;
    })(),
    
    // Zero major version
    createVersionedEvent(
      'GENERIC_EVENT',
      { id: 'zero-major' },
      createVersionFromString('0.1.0')
    ),
  ],
  
  // Events with extreme versions
  extremeVersions: [
    // Very high version numbers
    createVersionedEvent(
      'GENERIC_EVENT',
      { id: 'high-version' },
      createVersionFromString('999.999.999')
    ),
    
    // Very low version numbers
    createVersionedEvent(
      'GENERIC_EVENT',
      { id: 'low-version' },
      createVersionFromString('1.0.0')
    ),
  ],
  
  // Events with missing migration paths
  missingMigrationPaths: [
    // Gap in migration path
    {
      source: createGenericEvent('1.0.0'),
      target: '3.0.0',
      missingStep: '2.0.0->3.0.0', // If this migration is removed
    },
    
    // No migrations registered
    {
      source: createVersionedEvent('UNKNOWN_EVENT', { id: 'unknown' }),
      target: '2.0.0',
    },
  ],
};

// ===== CIRCULAR MIGRATION TEST CASES =====

/**
 * Test cases for circular migration paths (which should be detected and prevented).
 */
export const circularMigrationTestCases = [
  // Simple circular reference
  {
    eventType: 'CIRCULAR_EVENT',
    migrations: [
      { from: '1.0.0', to: '1.1.0' },
      { from: '1.1.0', to: '1.0.0' }, // Creates a cycle
    ],
  },
  
  // Complex circular reference
  {
    eventType: 'COMPLEX_CIRCULAR_EVENT',
    migrations: [
      { from: '1.0.0', to: '1.1.0' },
      { from: '1.1.0', to: '1.2.0' },
      { from: '1.2.0', to: '1.3.0' },
      { from: '1.3.0', to: '1.1.0' }, // Creates a cycle
    ],
  },
];

// ===== MIGRATION CHAIN TEST CASES =====

/**
 * Test cases for migration chains (multiple migrations registered at once).
 */
export const migrationChainTestCases = [
  // Simple chain
  {
    eventType: 'CHAIN_EVENT',
    chain: [
      { fromVersion: '1.0.0', toVersion: '1.1.0', migrationFn: (data: any) => ({ ...data, version: '1.1.0' }) },
      { fromVersion: '1.1.0', toVersion: '1.2.0', migrationFn: (data: any) => ({ ...data, version: '1.2.0' }) },
      { fromVersion: '1.2.0', toVersion: '2.0.0', migrationFn: (data: any) => ({ ...data, version: '2.0.0' }) },
    ],
    testCases: [
      { source: '1.0.0', target: '2.0.0', expectedPath: ['1.0.0->1.1.0', '1.1.0->1.2.0', '1.2.0->2.0.0'] },
      { source: '1.1.0', target: '2.0.0', expectedPath: ['1.1.0->1.2.0', '1.2.0->2.0.0'] },
    ],
  },
  
  // Branched chain
  {
    eventType: 'BRANCHED_CHAIN_EVENT',
    chain: [
      // Main path
      { fromVersion: '1.0.0', toVersion: '2.0.0', migrationFn: (data: any) => ({ ...data, version: '2.0.0' }) },
      
      // Alternative path
      { fromVersion: '1.0.0', toVersion: '1.5.0', migrationFn: (data: any) => ({ ...data, version: '1.5.0' }) },
      { fromVersion: '1.5.0', toVersion: '2.0.0', migrationFn: (data: any) => ({ ...data, version: '2.0.0' }) },
    ],
    testCases: [
      { source: '1.0.0', target: '2.0.0', expectedPath: ['1.0.0->2.0.0'] }, // Should choose shortest path
    ],
  },
];

// ===== REGISTER TEST MIGRATIONS =====

/**
 * Registers all test migrations for the generic event type.
 */
export function registerGenericEventMigrations(): void {
  // Register migrations for GENERIC_EVENT
  registerVersionMigration(
    'GENERIC_EVENT',
    '1.0.0',
    '1.1.0',
    genericEventV1_0_0_to_V1_1_0
  );
  
  registerVersionMigration(
    'GENERIC_EVENT',
    '1.1.0',
    '2.0.0',
    genericEventV1_1_0_to_V2_0_0
  );
  
  registerVersionMigration(
    'GENERIC_EVENT',
    '2.0.0',
    '3.0.0',
    genericEventV2_0_0_to_V3_0_0
  );
}

/**
 * Registers circular migrations for testing cycle detection.
 */
export function registerCircularMigrations(): void {
  // Simple circular reference
  registerVersionMigration(
    'CIRCULAR_EVENT',
    '1.0.0',
    '1.1.0',
    (data) => ({ ...data, version: '1.1.0' })
  );
  
  registerVersionMigration(
    'CIRCULAR_EVENT',
    '1.1.0',
    '1.0.0',
    (data) => ({ ...data, version: '1.0.0' })
  );
  
  // Complex circular reference
  registerVersionMigration(
    'COMPLEX_CIRCULAR_EVENT',
    '1.0.0',
    '1.1.0',
    (data) => ({ ...data, version: '1.1.0' })
  );
  
  registerVersionMigration(
    'COMPLEX_CIRCULAR_EVENT',
    '1.1.0',
    '1.2.0',
    (data) => ({ ...data, version: '1.2.0' })
  );
  
  registerVersionMigration(
    'COMPLEX_CIRCULAR_EVENT',
    '1.2.0',
    '1.3.0',
    (data) => ({ ...data, version: '1.3.0' })
  );
  
  registerVersionMigration(
    'COMPLEX_CIRCULAR_EVENT',
    '1.3.0',
    '1.1.0',
    (data) => ({ ...data, version: '1.1.0' })
  );
}

/**
 * Registers migration chains for testing the registerMigrationChain function.
 */
export function registerMigrationChains(): void {
  // Simple chain
  registerMigrationChain(
    'CHAIN_EVENT',
    migrationChainTestCases[0].chain
  );
  
  // Branched chain
  registerMigrationChain(
    'BRANCHED_CHAIN_EVENT',
    migrationChainTestCases[1].chain
  );
}

// ===== EXPORT ALL FIXTURES =====

export default {
  // Version objects and strings
  versionObjects,
  versionStrings,
  
  // Test cases
  versionComparisonTestCases,
  versionCompatibilityTestCases,
  migrationPathTestCases,
  circularMigrationTestCases,
  migrationChainTestCases,
  
  // Generic events
  genericEvents,
  createGenericEvent,
  
  // Migration functions
  genericEventV1_0_0_to_V1_1_0,
  genericEventV1_1_0_to_V2_0_0,
  genericEventV2_0_0_to_V3_0_0,
  
  // Edge cases
  versionEdgeCases,
  
  // Registration functions
  registerGenericEventMigrations,
  registerCircularMigrations,
  registerMigrationChains,
};