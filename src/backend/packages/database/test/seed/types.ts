/**
 * @file Shared Types and Utilities
 * 
 * Contains shared types and utility functions used across the database test seed module.
 */

/**
 * Configuration options for test database seeding
 */
export interface TestSeedOptions {
  /**
   * The volume of test data to generate
   * - 'small': Minimal data for basic tests (default)
   * - 'medium': Moderate amount of data for more complex tests
   * - 'large': Large dataset for performance testing
   */
  dataVolume?: 'small' | 'medium' | 'large';
  
  /**
   * Whether to isolate this test run from others
   * When true, generates unique identifiers for test data
   */
  isolate?: boolean;
  
  /**
   * Specific journeys to seed
   * If not provided, all journeys will be seeded
   */
  journeys?: ('health' | 'care' | 'plan' | 'gamification')[];
  
  /**
   * Test-specific prefix for data isolation
   * Automatically generated if isolate is true and no prefix is provided
   */
  testPrefix?: string;
  
  /**
   * Whether to log seeding operations
   */
  logging?: boolean;

  /**
   * Custom PrismaService instance to use
   * If not provided, a new instance will be created
   */
  prismaService?: any; // Using any to avoid circular imports

  /**
   * Custom PrismaClient instance to use
   * If not provided, a new instance will be created
   */
  prismaClient?: any; // Using any to avoid circular imports

  /**
   * Whether to clean the database before seeding
   * Default: true
   */
  cleanBeforeSeeding?: boolean;

  /**
   * Whether to disconnect from the database after seeding
   * Default: true
   */
  disconnectAfterSeeding?: boolean;

  /**
   * Error handling strategy
   * - 'throw': Throw errors (default)
   * - 'log': Log errors but continue
   * - 'ignore': Ignore errors silently
   */
  errorHandling?: 'throw' | 'log' | 'ignore';
}

/**
 * Default seed options
 */
export const defaultSeedOptions: TestSeedOptions = {
  dataVolume: 'small',
  isolate: true,
  journeys: ['health', 'care', 'plan', 'gamification'],
  logging: false,
  cleanBeforeSeeding: true,
  disconnectAfterSeeding: true,
  errorHandling: 'throw'
};

/**
 * Utility function to prefix test data with the test prefix if isolation is enabled.
 * 
 * @param value - The value to prefix
 * @param options - Test seed options
 * @returns The prefixed value if isolation is enabled, otherwise the original value
 */
export function prefixTestData(value: string, options: TestSeedOptions): string {
  if (options.isolate && options.testPrefix) {
    return `${options.testPrefix}_${value}`;
  }
  return value;
}

/**
 * Gets the number of items to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @param small - The number for small volume
 * @param medium - The number for medium volume
 * @param large - The number for large volume
 * @returns The number of items to create
 */
export function getCountByVolume(
  dataVolume: 'small' | 'medium' | 'large',
  small: number = 0,
  medium: number = 10,
  large: number = 50
): number {
  switch (dataVolume) {
    case 'small':
      return small;
    case 'medium':
      return medium;
    case 'large':
      return large;
    default:
      return small;
  }
}

/**
 * Handles errors during seeding based on the error handling strategy.
 * 
 * @param error - The error that occurred
 * @param options - Test seed options
 */
export function handleSeedError(error: any, options: TestSeedOptions): void {
  switch (options.errorHandling) {
    case 'log':
      console.error('Error during database seeding:', error);
      break;
    case 'ignore':
      // Do nothing
      break;
    case 'throw':
    default:
      console.error('Error seeding database:', error);
      throw error;
  }
}