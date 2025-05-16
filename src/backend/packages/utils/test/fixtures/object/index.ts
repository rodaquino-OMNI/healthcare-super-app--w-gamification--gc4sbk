/**
 * @file Object Test Fixtures Barrel File
 * 
 * This barrel file exports all object test fixtures from a single point, providing
 * a clean and consistent way to import object test data throughout the test suite.
 * 
 * Fixtures are organized by their primary use case (basic objects, nested objects,
 * transformation fixtures, etc.) and exported with namespaces to prevent naming collisions.
 * 
 * @example
 * // Import all object fixtures
 * import * as objectFixtures from '@austa/utils/test/fixtures/object';
 * 
 * // Use specific fixture categories
 * const { basicObjects, nestedObjects } = objectFixtures;
 * 
 * @example
 * // Import specific fixture categories directly
 * import { transformObjects } from '@austa/utils/test/fixtures/object';
 */

// Re-export all object fixture files
// These will be implemented as separate files in the same directory

/**
 * Basic object fixtures for general testing purposes
 * @example
 * import { basicObjects } from '@austa/utils/test/fixtures/object';
 * const { emptyObject, simpleObject } = basicObjects;
 */
export * as basicObjects from './basic-objects';

/**
 * Nested object fixtures with complex hierarchical structures
 * @example
 * import { nestedObjects } from '@austa/utils/test/fixtures/object';
 * const { deeplyNested, multiLevel } = nestedObjects;
 */
export * as nestedObjects from './nested-objects';

/**
 * Edge case object fixtures for boundary testing
 * @example
 * import { edgeCaseObjects } from '@austa/utils/test/fixtures/object';
 * const { nullProperties, circularReference } = edgeCaseObjects;
 */
export * as edgeCaseObjects from './edge-case-objects';

/**
 * Object fixtures specifically designed for testing transform operations
 * @example
 * import { transformObjects } from '@austa/utils/test/fixtures/object';
 * const { pickSource, omitSource } = transformObjects;
 */
export * as transformObjects from './transform-objects';

/**
 * Object fixtures for testing comparison operations
 * @example
 * import { comparisonObjects } from '@austa/utils/test/fixtures/object';
 * const { identicalPair, differentPair } = comparisonObjects;
 */
export * as comparisonObjects from './comparison-objects';

/**
 * Object fixtures for testing merge operations
 * @example
 * import { mergeObjects } from '@austa/utils/test/fixtures/object';
 * const { mergeSource, mergeTarget } = mergeObjects;
 */
export * as mergeObjects from './merge-objects';

/**
 * Object fixtures for testing clone operations
 * @example
 * import { cloneObjects } from '@austa/utils/test/fixtures/object';
 * const { complexObject, objectWithSpecialTypes } = cloneObjects;
 */
export * as cloneObjects from './clone-objects';