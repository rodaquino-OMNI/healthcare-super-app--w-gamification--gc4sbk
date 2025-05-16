/**
 * Journey-specific Environment Testing Utilities
 * 
 * This module provides specialized utilities for testing journey-specific environment variables
 * across Health, Care, and Plan journeys. These utilities enable testing of the journey-centered
 * architecture's environment configuration, ensuring proper isolation and sharing between journeys.
 */

import { JourneyType } from '../../../../src/env/journey';
import { mockMultipleEnv, EnvSnapshot } from './mock-env';
import { MissingEnvironmentVariableError } from '../../../../src/env/error';

/**
 * Configuration options for journey environment testing.
 */
export interface JourneyEnvOptions {
  /**
   * Whether to preserve existing environment variables
   * @default false
   */
  preserveExisting?: boolean;

  /**
   * Whether to include shared journey variables
   * @default false
   */
  includeShared?: boolean;

  /**
   * Default values to use for variables not explicitly set
   */
  defaults?: Record<string, string>;
}

/**
 * Mock journey-specific environment variables for testing.
 * 
 * This function automatically applies the correct journey prefix to all variables,
 * making it easier to set up journey-specific test environments.
 * 
 * @param journey - The journey type to mock variables for
 * @param variables - Object containing journey-specific variables to mock (without prefix)
 * @param options - Optional configuration for the mocking behavior
 * 
 * @example
 * ```typescript
 * // Mock health journey environment variables
 * mockJourneyEnv(JourneyType.HEALTH, {
 *   API_URL: 'https://health-api.example.com',
 *   FEATURE_WEARABLES_SYNC: 'true'
 * });
 * ```
 * 
 * @returns An EnvSnapshot that can be used to restore the original environment
 */
export function mockJourneyEnv(
  journey: JourneyType,
  variables: Record<string, string>,
  options: JourneyEnvOptions = {}
): EnvSnapshot {
  const prefix = journey.toUpperCase();
  const prefixedVars: Record<string, string> = {};
  
  // Apply journey prefix to all variables
  Object.entries(variables).forEach(([key, value]) => {
    prefixedVars[`${prefix}_${key}`] = value;
  });
  
  // Add shared variables if requested
  if (options.includeShared && journey !== JourneyType.SHARED) {
    Object.entries(variables).forEach(([key, value]) => {
      prefixedVars[`SHARED_${key}`] = value;
    });
  }
  
  // Add default values if provided
  if (options.defaults) {
    Object.entries(options.defaults).forEach(([key, value]) => {
      if (!variables[key]) {
        prefixedVars[`${prefix}_${key}`] = value;
      }
    });
  }
  
  return mockMultipleEnv(prefixedVars, { overwrite: !options.preserveExisting });
}

/**
 * Test that journey-specific environment variables are properly prefixed.
 * 
 * This function verifies that environment variables are correctly prefixed with the
 * journey type, ensuring proper namespace isolation between journeys.
 * 
 * @param journey - The journey type to test
 * @param variables - Object containing variables that should be prefixed
 * 
 * @example
 * ```typescript
 * // Test that health journey variables are properly prefixed
 * testJourneyPrefixing(JourneyType.HEALTH, {
 *   API_URL: 'https://health-api.example.com',
 *   FEATURE_WEARABLES_SYNC: 'true'
 * });
 * ```
 * 
 * @throws Error if any variables are not properly prefixed
 */
export function testJourneyPrefixing(
  journey: JourneyType,
  variables: Record<string, string>
): void {
  const prefix = journey.toUpperCase();
  const snapshot = mockJourneyEnv(journey, variables);
  
  try {
    // Verify that all variables are properly prefixed
    Object.keys(variables).forEach(key => {
      const prefixedKey = `${prefix}_${key}`;
      const value = process.env[prefixedKey];
      
      if (value !== variables[key]) {
        throw new Error(
          `Journey prefixing failed for ${journey}: ${prefixedKey} should be ${variables[key]} but got ${value}`
        );
      }
      
      // Also verify that unprefixed variables don't exist
      if (process.env[key] === variables[key]) {
        throw new Error(
          `Journey prefixing failed for ${journey}: ${key} should not be directly accessible without prefix`
        );
      }
    });
  } finally {
    // Restore original environment
    snapshot.restore();
  }
}

/**
 * Test that journey namespaces are properly isolated from each other.
 * 
 * This function verifies that environment variables from one journey do not
 * leak into or affect other journeys, ensuring proper isolation.
 * 
 * @param journeys - Array of journey types to test isolation between
 * 
 * @example
 * ```typescript
 * // Test isolation between health and care journeys
 * testJourneyNamespaceIsolation([JourneyType.HEALTH, JourneyType.CARE]);
 * ```
 * 
 * @throws Error if journey namespaces are not properly isolated
 */
export function testJourneyNamespaceIsolation(
  journeys: JourneyType[]
): void {
  if (journeys.length < 2) {
    throw new Error('At least two journeys are required to test namespace isolation');
  }
  
  // Create test variables for each journey
  const journeyVars: Record<JourneyType, Record<string, string>> = {} as any;
  const snapshots: EnvSnapshot[] = [];
  
  try {
    // Set up test variables for each journey
    journeys.forEach((journey, index) => {
      // Create unique variables for this journey
      const variables = {
        TEST_VAR: `${journey}-value`,
        COMMON_VAR: `${journey}-common-value`,
        UNIQUE_VAR_${index}: `${journey}-unique-value-${index}`
      };
      
      journeyVars[journey] = variables;
      snapshots.push(mockJourneyEnv(journey, variables));
    });
    
    // Verify isolation between journeys
    journeys.forEach((journey, i) => {
      const prefix = journey.toUpperCase();
      
      // Check that this journey's variables are set correctly
      Object.entries(journeyVars[journey]).forEach(([key, expectedValue]) => {
        const prefixedKey = `${prefix}_${key}`;
        const actualValue = process.env[prefixedKey];
        
        if (actualValue !== expectedValue) {
          throw new Error(
            `Journey isolation failed: ${prefixedKey} should be ${expectedValue} but got ${actualValue}`
          );
        }
      });
      
      // Check that this journey's variables don't leak into other journeys
      journeys.forEach((otherJourney, j) => {
        if (i === j) return; // Skip self-comparison
        
        const otherPrefix = otherJourney.toUpperCase();
        
        Object.keys(journeyVars[journey]).forEach(key => {
          const otherPrefixedKey = `${otherPrefix}_${key}`;
          const thisValue = journeyVars[journey][key];
          const otherValue = process.env[otherPrefixedKey];
          
          // If the other journey has this variable, it should have its own value, not this journey's value
          if (otherValue === thisValue && journeyVars[otherJourney][key] !== thisValue) {
            throw new Error(
              `Journey isolation failed: ${journey} value leaked into ${otherJourney} for ${key}`
            );
          }
        });
      });
    });
  } finally {
    // Restore original environment
    snapshots.forEach(snapshot => snapshot.restore());
  }
}

/**
 * Test that cross-journey shared configuration works correctly.
 * 
 * This function verifies that shared configuration variables are properly accessible
 * across multiple journeys, ensuring consistent configuration where needed.
 * 
 * @param sharedConfig - Object containing shared configuration variables
 * @param journeys - Array of journey types that should share the configuration
 * 
 * @example
 * ```typescript
 * // Test shared configuration across all journeys
 * testCrossJourneyConfig(
 *   { LOG_LEVEL: 'info', TELEMETRY_ENABLED: 'true' },
 *   [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN]
 * );
 * ```
 * 
 * @throws Error if shared configuration is not properly accessible across journeys
 */
export function testCrossJourneyConfig(
  sharedConfig: Record<string, string>,
  journeys: JourneyType[]
): void {
  const snapshots: EnvSnapshot[] = [];
  
  try {
    // Set up shared variables
    snapshots.push(mockJourneyEnv(JourneyType.SHARED, sharedConfig));
    
    // Set up journey-specific variables that should override shared ones
    const overrideVar = 'OVERRIDE_VAR';
    const sharedValue = 'shared-value';
    const updatedSharedConfig = { ...sharedConfig, [overrideVar]: sharedValue };
    
    // Update shared config
    snapshots[0].restore();
    snapshots[0] = mockJourneyEnv(JourneyType.SHARED, updatedSharedConfig);
    
    // Set journey-specific overrides for the last journey
    if (journeys.length > 0) {
      const lastJourney = journeys[journeys.length - 1];
      const journeyValue = `${lastJourney}-override-value`;
      snapshots.push(mockJourneyEnv(lastJourney, { [overrideVar]: journeyValue }));
    }
    
    // Verify shared configuration is accessible from all journeys
    journeys.forEach((journey, index) => {
      const prefix = journey.toUpperCase();
      
      // Check that shared variables are accessible
      Object.entries(sharedConfig).forEach(([key, expectedValue]) => {
        const journeyKey = `${prefix}_${key}`;
        const sharedKey = `SHARED_${key}`;
        
        // Journey-specific value should take precedence if set
        if (key === overrideVar && index === journeys.length - 1) {
          const journeyValue = process.env[journeyKey];
          const expectedJourneyValue = `${journey}-override-value`;
          
          if (journeyValue !== expectedJourneyValue) {
            throw new Error(
              `Journey override failed: ${journeyKey} should be ${expectedJourneyValue} but got ${journeyValue}`
            );
          }
        } else {
          // Otherwise, shared value should be used
          const sharedValue = process.env[sharedKey];
          
          if (sharedValue !== expectedValue) {
            throw new Error(
              `Shared configuration failed: ${sharedKey} should be ${expectedValue} but got ${sharedValue}`
            );
          }
        }
      });
    });
  } finally {
    // Restore original environment
    snapshots.forEach(snapshot => snapshot.restore());
  }
}

/**
 * Test that journey-specific default values are applied correctly.
 * 
 * This function verifies that default values are properly applied when
 * environment variables are not explicitly set, ensuring resilient configuration.
 * 
 * @param journey - The journey type to test
 * @param defaults - Object containing expected default values
 * 
 * @example
 * ```typescript
 * // Test default values for health journey
 * testJourneyDefaults(JourneyType.HEALTH, {
 *   METRICS_RETENTION_DAYS: '90',
 *   SYNC_INTERVAL: '15'
 * });
 * ```
 * 
 * @throws Error if default values are not properly applied
 */
export function testJourneyDefaults(
  journey: JourneyType,
  defaults: Record<string, string>
): void {
  const snapshot = mockJourneyEnv(journey, {}, { defaults });
  
  try {
    const prefix = journey.toUpperCase();
    
    // Verify that default values are applied
    Object.entries(defaults).forEach(([key, expectedValue]) => {
      const prefixedKey = `${prefix}_${key}`;
      const actualValue = process.env[prefixedKey];
      
      if (actualValue !== expectedValue) {
        throw new Error(
          `Default value not applied: ${prefixedKey} should be ${expectedValue} but got ${actualValue}`
        );
      }
    });
  } finally {
    // Restore original environment
    snapshot.restore();
  }
}

/**
 * Test that journey feature flags are properly isolated.
 * 
 * This function verifies that feature flags are properly isolated between journeys,
 * ensuring that enabling a feature in one journey doesn't affect others.
 * 
 * @param featureFlags - Object mapping feature names to their enabled state
 * @param journeys - Array of journey types to test feature flag isolation between
 * 
 * @example
 * ```typescript
 * // Test feature flag isolation between journeys
 * testFeatureFlagIsolation(
 *   { WEARABLES_SYNC: true, TELEMEDICINE: false },
 *   [JourneyType.HEALTH, JourneyType.CARE]
 * );
 * ```
 * 
 * @throws Error if feature flags are not properly isolated between journeys
 */
export function testFeatureFlagIsolation(
  featureFlags: Record<string, boolean>,
  journeys: JourneyType[]
): void {
  if (journeys.length < 2) {
    throw new Error('At least two journeys are required to test feature flag isolation');
  }
  
  const snapshots: EnvSnapshot[] = [];
  
  try {
    // Set up feature flags with opposite values for each journey
    journeys.forEach((journey, index) => {
      const journeyFlags: Record<string, string> = {};
      
      // Set opposite values for each feature flag based on journey index
      Object.entries(featureFlags).forEach(([feature, enabled]) => {
        const shouldEnable = index % 2 === 0 ? enabled : !enabled;
        journeyFlags[`FEATURE_${feature}`] = shouldEnable ? 'true' : 'false';
      });
      
      snapshots.push(mockJourneyEnv(journey, journeyFlags));
    });
    
    // Verify feature flags are isolated between journeys
    journeys.forEach((journey, index) => {
      const prefix = journey.toUpperCase();
      
      Object.entries(featureFlags).forEach(([feature, enabled]) => {
        const expectedEnabled = index % 2 === 0 ? enabled : !enabled;
        const prefixedKey = `${prefix}_FEATURE_${feature}`;
        const actualValue = process.env[prefixedKey];
        const expectedValue = expectedEnabled ? 'true' : 'false';
        
        if (actualValue !== expectedValue) {
          throw new Error(
            `Feature flag isolation failed: ${prefixedKey} should be ${expectedValue} but got ${actualValue}`
          );
        }
      });
    });
  } finally {
    // Restore original environment
    snapshots.forEach(snapshot => snapshot.restore());
  }
}

/**
 * Test that journey-specific environment variables can be accessed with fallbacks.
 * 
 * This function verifies that environment variables can be accessed with fallbacks
 * to default values when not explicitly set, ensuring resilient configuration.
 * 
 * @param journey - The journey type to test
 * @param variables - Object containing variables to test
 * @param defaults - Object containing default values for variables
 * 
 * @example
 * ```typescript
 * // Test fallback values for health journey
 * testJourneyEnvFallbacks(
 *   JourneyType.HEALTH,
 *   { API_URL: 'https://health-api.example.com' },
 *   { TIMEOUT: '30000', RETRY_COUNT: '3' }
 * );
 * ```
 * 
 * @throws Error if fallback values are not properly applied
 */
export function testJourneyEnvFallbacks(
  journey: JourneyType,
  variables: Record<string, string>,
  defaults: Record<string, string>
): void {
  // First set only the explicit variables
  const snapshot1 = mockJourneyEnv(journey, variables);
  
  try {
    const prefix = journey.toUpperCase();
    
    // Verify that explicit variables are set
    Object.entries(variables).forEach(([key, expectedValue]) => {
      const prefixedKey = `${prefix}_${key}`;
      const actualValue = process.env[prefixedKey];
      
      if (actualValue !== expectedValue) {
        throw new Error(
          `Explicit variable not set: ${prefixedKey} should be ${expectedValue} but got ${actualValue}`
        );
      }
    });
    
    // Verify that default variables are not set yet
    Object.keys(defaults).forEach(key => {
      const prefixedKey = `${prefix}_${key}`;
      if (process.env[prefixedKey] !== undefined && !variables[key]) {
        throw new Error(
          `Default variable should not be set yet: ${prefixedKey} is ${process.env[prefixedKey]}`
        );
      }
    });
  } finally {
    // Restore original environment
    snapshot1.restore();
  }
  
  // Now set both explicit and default variables
  const snapshot2 = mockJourneyEnv(journey, variables, { defaults });
  
  try {
    const prefix = journey.toUpperCase();
    
    // Verify that explicit variables are still set correctly
    Object.entries(variables).forEach(([key, expectedValue]) => {
      const prefixedKey = `${prefix}_${key}`;
      const actualValue = process.env[prefixedKey];
      
      if (actualValue !== expectedValue) {
        throw new Error(
          `Explicit variable not preserved: ${prefixedKey} should be ${expectedValue} but got ${actualValue}`
        );
      }
    });
    
    // Verify that default variables are now set
    Object.entries(defaults).forEach(([key, expectedValue]) => {
      // Skip if this variable was explicitly set
      if (variables[key]) return;
      
      const prefixedKey = `${prefix}_${key}`;
      const actualValue = process.env[prefixedKey];
      
      if (actualValue !== expectedValue) {
        throw new Error(
          `Default variable not applied: ${prefixedKey} should be ${expectedValue} but got ${actualValue}`
        );
      }
    });
  } finally {
    // Restore original environment
    snapshot2.restore();
  }
}

/**
 * Test that required journey-specific environment variables throw appropriate errors when missing.
 * 
 * This function verifies that attempts to access required journey-specific environment
 * variables throw appropriate errors when the variables are not set.
 * 
 * @param journey - The journey type to test
 * @param requiredVars - Array of required variable names
 * @param accessorFn - Function that attempts to access the required variables
 * 
 * @example
 * ```typescript
 * // Test required variables for health journey
 * testRequiredJourneyEnvErrors(
 *   JourneyType.HEALTH,
 *   ['API_URL', 'API_KEY'],
 *   (varName) => getRequiredJourneyEnv(JourneyType.HEALTH, varName)
 * );
 * ```
 * 
 * @throws Error if required variables don't throw appropriate errors when missing
 */
export function testRequiredJourneyEnvErrors(
  journey: JourneyType,
  requiredVars: string[],
  accessorFn: (varName: string) => string
): void {
  const snapshot = createEnvSnapshot();
  
  try {
    const prefix = journey.toUpperCase();
    
    // Clear any existing values for the required variables
    requiredVars.forEach(varName => {
      const prefixedKey = `${prefix}_${varName}`;
      delete process.env[prefixedKey];
    });
    
    // Verify that accessing each required variable throws an appropriate error
    requiredVars.forEach(varName => {
      try {
        accessorFn(varName);
        throw new Error(
          `Required variable check failed: accessing ${varName} should throw an error but didn't`
        );
      } catch (error) {
        // Verify that the error is the expected type
        if (!(error instanceof MissingEnvironmentVariableError)) {
          throw new Error(
            `Required variable check failed: expected MissingEnvironmentVariableError but got ${error}`
          );
        }
        
        // Verify that the error message mentions the variable name
        const prefixedKey = `${prefix}_${varName}`;
        if (!error.message.includes(prefixedKey)) {
          throw new Error(
            `Required variable check failed: error message should mention ${prefixedKey} but was: ${error.message}`
          );
        }
      }
    });
  } finally {
    // Restore original environment
    snapshot.restore();
  }
}

/**
 * Create a snapshot of the current environment variables for later restoration.
 * 
 * @returns An EnvSnapshot object with methods to restore the environment
 */
function createEnvSnapshot(): EnvSnapshot {
  const snapshot: Record<string, string | undefined> = {};
  
  // Save current environment
  Object.keys(process.env).forEach(key => {
    snapshot[key] = process.env[key];
  });
  
  return {
    restore: () => {
      // Clear current environment
      Object.keys(process.env).forEach(key => {
        delete process.env[key];
      });
      
      // Restore saved environment
      Object.entries(snapshot).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = value;
        }
      });
    }
  };
}