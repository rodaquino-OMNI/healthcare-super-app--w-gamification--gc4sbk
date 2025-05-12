/**
 * Custom test sequencer for event E2E tests.
 * 
 * This sequencer prioritizes tests based on:
 * 1. Previous failures (failed tests run first)
 * 2. Test execution time (longer tests run first to minimize worker idle time)
 * 3. Test path (alphabetical order for deterministic runs)
 * 
 * It also provides special handling for Kafka-dependent tests to ensure proper
 * test isolation and reduce flakiness.
 */

const Sequencer = require('@jest/test-sequencer').default;
const fs = require('fs');
const path = require('path');

// Constants
const CACHE_PATH = path.join(process.cwd(), '.jest-test-results.json');
const FAIL = 'failed';
const SUCCESS = 'success';

// Test categories by importance (higher index = higher priority)
const TEST_CATEGORIES = [
  { pattern: /kafka/i, priority: 3 }, // Kafka tests are most important
  { pattern: /producer/i, priority: 2 }, // Producer tests next
  { pattern: /consumer/i, priority: 2 }, // Consumer tests next
  { pattern: /event/i, priority: 1 }, // General event tests
];

/**
 * Custom test sequencer for event E2E tests.
 */
class CustomTestSequencer extends Sequencer {
  /**
   * Get the cached test results from previous runs.
   * 
   * @param {Object} test - Test object
   * @returns {Object} - Cached test results
   */
  _getCache(test) {
    if (!this._cache) {
      try {
        this._cache = fs.existsSync(CACHE_PATH)
          ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
          : {};
      } catch {
        this._cache = {};
      }
    }
    
    return this._cache;
  }
  
  /**
   * Select tests for shard requested via --shard=shardIndex/shardCount
   * Sharding is applied before sorting.
   * 
   * @param {Array<Object>} tests - Array of test objects
   * @param {Object} options - Sharding options
   * @param {number} options.shardIndex - Index of the current shard
   * @param {number} options.shardCount - Total number of shards
   * @returns {Array<Object>} - Tests for the current shard
   */
  shard(tests, { shardIndex, shardCount }) {
    const shardSize = Math.ceil(tests.length / shardCount);
    const shardStart = shardSize * (shardIndex - 1);
    const shardEnd = shardSize * shardIndex;
    
    // Sort tests by path for consistent sharding
    return [...tests]
      .sort((a, b) => (a.path > b.path ? 1 : -1))
      .slice(shardStart, shardEnd);
  }
  
  /**
   * Sort tests to determine order of execution.
   * Sorting is applied after sharding.
   * 
   * @param {Array<Object>} tests - Array of test objects
   * @returns {Array<Object>} - Sorted tests
   */
  sort(tests) {
    // Get file sizes for all tests
    const stats = {};
    const fileSize = ({ path: testPath }) => {
      if (!stats[testPath]) {
        try {
          stats[testPath] = fs.statSync(testPath).size;
        } catch {
          stats[testPath] = 0;
        }
      }
      return stats[testPath];
    };
    
    // Helper functions for test sorting
    const hasFailed = (cache, test) => cache[test.path] && cache[test.path][0] === FAIL;
    const getTime = (cache, test) => cache[test.path] && cache[test.path][1];
    const getCategory = (test) => {
      const testPath = test.path.toLowerCase();
      for (const { pattern, priority } of TEST_CATEGORIES) {
        if (pattern.test(testPath)) {
          return priority;
        }
      }
      return 0; // Default priority
    };
    
    // Add duration and category information to tests
    tests.forEach(test => {
      const cache = this._getCache(test);
      test.duration = getTime(cache, test);
      test.category = getCategory(test);
      test.failed = hasFailed(cache, test);
      test.size = fileSize(test);
    });
    
    // Sort tests by:
    // 1. Failed tests first
    // 2. Test category priority
    // 3. Test duration (longer tests first)
    // 4. File size (larger files first)
    // 5. Path (alphabetical for deterministic ordering)
    return [...tests].sort((testA, testB) => {
      // Failed tests first
      if (testA.failed !== testB.failed) {
        return testA.failed ? -1 : 1;
      }
      
      // Test category priority
      if (testA.category !== testB.category) {
        return testB.category - testA.category;
      }
      
      // Test duration (longer tests first)
      const hasTimeA = testA.duration != null;
      const hasTimeB = testB.duration != null;
      
      if (hasTimeA && hasTimeB) {
        return testB.duration - testA.duration;
      }
      
      // If only one test has timing information, run it first
      if (hasTimeA !== hasTimeB) {
        return hasTimeA ? -1 : 1;
      }
      
      // File size (larger files first)
      if (testA.size !== testB.size) {
        return testB.size - testA.size;
      }
      
      // Path (alphabetical for deterministic ordering)
      return testA.path > testB.path ? 1 : -1;
    });
  }
}

module.exports = CustomTestSequencer;