#!/usr/bin/env node

/**
 * test-build-order.js
 * 
 * A simple test script to verify the functionality of the build-order.js tool.
 * This script creates a mock project structure with dependencies and runs the
 * build-order tool to check if it correctly determines the build order.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { 
  buildDependencyGraph, 
  detectCycles, 
  topologicalSort 
} = require('./build-order');

// Create a temporary directory for testing
const tempDir = path.join(__dirname, 'temp-test');

// Clean up any existing temp directory
if (fs.existsSync(tempDir)) {
  console.log('Cleaning up existing temp directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Create the temp directory structure
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'src/backend'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'src/web'), { recursive: true });

// Create mock packages with dependencies
const mockPackages = {
  // Backend packages
  'src/backend/shared': {
    name: '@austa/shared',
    dependencies: {}
  },
  'src/backend/packages/utils': {
    name: '@austa/utils',
    dependencies: {
      '@austa/shared': '^1.0.0'
    }
  },
  'src/backend/packages/database': {
    name: '@austa/database',
    dependencies: {
      '@austa/shared': '^1.0.0',
      '@austa/utils': '^1.0.0'
    }
  },
  'src/backend/auth-service': {
    name: 'auth-service',
    dependencies: {
      '@austa/shared': '^1.0.0',
      '@austa/utils': '^1.0.0',
      '@austa/database': '^1.0.0'
    }
  },
  'src/backend/api-gateway': {
    name: 'api-gateway',
    dependencies: {
      '@austa/shared': '^1.0.0',
      'auth-service': '^1.0.0'
    }
  },
  
  // Web packages
  'src/web/primitives': {
    name: '@design-system/primitives',
    dependencies: {}
  },
  'src/web/design-system': {
    name: '@austa/design-system',
    dependencies: {
      '@design-system/primitives': '^1.0.0'
    }
  },
  'src/web/interfaces': {
    name: '@austa/interfaces',
    dependencies: {}
  },
  'src/web/shared': {
    name: '@austa/web-shared',
    dependencies: {
      '@austa/design-system': '^1.0.0',
      '@austa/interfaces': '^1.0.0'
    }
  },
  'src/web/mobile': {
    name: '@austa/mobile',
    dependencies: {
      '@austa/design-system': '^1.0.0',
      '@austa/web-shared': '^1.0.0',
      '@austa/interfaces': '^1.0.0'
    }
  },
  'src/web/web': {
    name: '@austa/web',
    dependencies: {
      '@austa/design-system': '^1.0.0',
      '@austa/web-shared': '^1.0.0',
      '@austa/interfaces': '^1.0.0'
    }
  }
};

// Create the mock package.json files
for (const [packagePath, packageData] of Object.entries(mockPackages)) {
  const fullPath = path.join(tempDir, packagePath);
  fs.mkdirSync(fullPath, { recursive: true });
  
  const packageJson = {
    name: packageData.name,
    version: '1.0.0',
    private: true,
    dependencies: packageData.dependencies
  };
  
  fs.writeFileSync(
    path.join(fullPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
  
  // Create a simple tsconfig.json for each package
  const tsconfig = {
    compilerOptions: {
      outDir: './dist',
      rootDir: './src',
      baseUrl: '.'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };
  
  fs.writeFileSync(
    path.join(fullPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2),
    'utf8'
  );
}

// Create a package with a circular dependency for testing cycle detection
const circularDir = path.join(tempDir, 'src/backend/circular-test');
fs.mkdirSync(circularDir, { recursive: true });

const circularPackages = {
  'package-a': {
    name: 'package-a',
    dependencies: {
      'package-b': '^1.0.0'
    }
  },
  'package-b': {
    name: 'package-b',
    dependencies: {
      'package-c': '^1.0.0'
    }
  },
  'package-c': {
    name: 'package-c',
    dependencies: {
      'package-a': '^1.0.0'
    }
  }
};

for (const [packageName, packageData] of Object.entries(circularPackages)) {
  const fullPath = path.join(circularDir, packageName);
  fs.mkdirSync(fullPath, { recursive: true });
  
  const packageJson = {
    name: packageData.name,
    version: '1.0.0',
    private: true,
    dependencies: packageData.dependencies
  };
  
  fs.writeFileSync(
    path.join(fullPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
}

// Run the tests
console.log('\n=== Testing build-order.js ===\n');

// Test 1: Build dependency graph and determine build order
console.log('Test 1: Building dependency graph and determining build order...');
try {
  const graph = buildDependencyGraph(tempDir);
  console.log(`Built dependency graph with ${Object.keys(graph).length} packages`);
  
  const cycles = detectCycles(graph);
  if (cycles.length > 0) {
    console.log(`Detected ${cycles.length} cycles in the main graph (expected: 0)`);
    for (const cycle of cycles) {
      console.log(`  Cycle: ${cycle.join(' -> ')}`);
    }
    console.log('Test 1 FAILED: Unexpected cycles detected');
  } else {
    console.log('No cycles detected in the main graph (expected)');
    
    const buildOrder = topologicalSort(graph);
    console.log(`Determined build order for ${buildOrder.length} packages:`);
    for (let i = 0; i < buildOrder.length; i++) {
      console.log(`  ${i + 1}. ${buildOrder[i]}`);
    }
    
    // Verify the build order is correct
    const backendPackages = buildOrder.filter(pkg => 
      graph[pkg].path.includes('src/backend')
    );
    
    const webPackages = buildOrder.filter(pkg => 
      graph[pkg].path.includes('src/web')
    );
    
    // Check if shared comes before utils, utils before database, etc.
    const backendExpectedOrder = [
      'shared',
      'utils',
      'database',
      'auth-service',
      'api-gateway'
    ];
    
    let backendOrderCorrect = true;
    for (let i = 1; i < backendExpectedOrder.length; i++) {
      const current = backendExpectedOrder[i];
      const previous = backendExpectedOrder[i - 1];
      
      const currentIndex = backendPackages.indexOf(current);
      const previousIndex = backendPackages.indexOf(previous);
      
      if (currentIndex !== -1 && previousIndex !== -1 && currentIndex < previousIndex) {
        backendOrderCorrect = false;
        console.log(`  ERROR: ${current} should come after ${previous}`);
      }
    }
    
    // Check if primitives comes before design-system, etc.
    const webExpectedOrder = [
      'primitives',
      'interfaces',
      'design-system',
      'shared',
      'mobile',
      'web'
    ];
    
    let webOrderCorrect = true;
    for (let i = 1; i < webExpectedOrder.length; i++) {
      const current = webExpectedOrder[i];
      const previous = webExpectedOrder[i - 1];
      
      const currentIndex = webPackages.indexOf(current);
      const previousIndex = webPackages.indexOf(previous);
      
      if (currentIndex !== -1 && previousIndex !== -1 && currentIndex < previousIndex) {
        webOrderCorrect = false;
        console.log(`  ERROR: ${current} should come after ${previous}`);
      }
    }
    
    if (backendOrderCorrect && webOrderCorrect) {
      console.log('Test 1 PASSED: Build order is correct');
    } else {
      console.log('Test 1 FAILED: Build order is incorrect');
    }
  }
} catch (error) {
  console.error(`Test 1 FAILED with error: ${error.message}`);
  console.error(error);
}

// Test 2: Detect circular dependencies
console.log('\nTest 2: Detecting circular dependencies...');
try {
  const circularGraph = buildDependencyGraph(path.join(tempDir, 'src/backend/circular-test'));
  console.log(`Built circular dependency graph with ${Object.keys(circularGraph).length} packages`);
  
  const cycles = detectCycles(circularGraph);
  if (cycles.length > 0) {
    console.log(`Detected ${cycles.length} cycles (expected)`);
    for (const cycle of cycles) {
      console.log(`  Cycle: ${cycle.join(' -> ')}`);
    }
    console.log('Test 2 PASSED: Circular dependencies detected correctly');
  } else {
    console.log('Test 2 FAILED: No cycles detected in the circular dependency graph');
  }
} catch (error) {
  console.error(`Test 2 FAILED with error: ${error.message}`);
  console.error(error);
}

// Test 3: Test CLI functionality
console.log('\nTest 3: Testing CLI functionality...');
try {
  const output = execSync(
    `node ${path.join(__dirname, 'build-order.js')} --root ${tempDir} --format json`,
    { encoding: 'utf8' }
  );
  
  const result = JSON.parse(output);
  if (result.buildOrder && Array.isArray(result.buildOrder) && result.buildOrder.length > 0) {
    console.log(`CLI returned build order with ${result.buildOrder.length} packages`);
    console.log('Test 3 PASSED: CLI functionality works correctly');
  } else {
    console.log('Test 3 FAILED: CLI did not return a valid build order');
  }
} catch (error) {
  console.error(`Test 3 FAILED with error: ${error.message}`);
  console.error(error);
}

// Clean up
console.log('\nCleaning up...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('\n=== Tests completed ===\n');