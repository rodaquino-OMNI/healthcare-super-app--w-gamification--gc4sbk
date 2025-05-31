/**
 * Barrel file that exports all string test fixtures.
 * This provides a single import point for test suites using string fixtures.
 */

// Export all validation fixtures
export {
  CPFFixture,
  validCPFFixtures,
  invalidCPFFixtures,
  cpfFixtures
} from './validation.fixtures';

// Export all formatting fixtures
export {
  CapitalizeFixture,
  capitalizeFixtures,
  TruncateFixture,
  truncateFixtures
} from './formatting.fixtures';