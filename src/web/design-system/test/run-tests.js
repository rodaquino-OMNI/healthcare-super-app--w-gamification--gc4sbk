/**
 * Helper script to run tests for specific platforms
 * 
 * This script allows running tests for specific platforms by setting the PLATFORM
 * environment variable before running Jest.
 */

const { execSync } = require('child_process');
const { argv } = process;

// Get the platform from command line arguments
const platformArg = argv.find(arg => arg.startsWith('--platform='));
const platform = platformArg ? platformArg.split('=')[1] : 'all';

// Get other Jest arguments
const jestArgs = argv
  .slice(2)
  .filter(arg => !arg.startsWith('--platform='))
  .join(' ');

const runForPlatform = (platformName) => {
  console.log(`\n\n🧪 Running tests for ${platformName.toUpperCase()} platform...\n`);
  try {
    execSync(`cross-env PLATFORM=${platformName} jest ${jestArgs}`, {
      stdio: 'inherit',
      env: { ...process.env, PLATFORM: platformName }
    });
    return true;
  } catch (error) {
    console.error(`❌ Tests failed for ${platformName.toUpperCase()} platform`);
    return false;
  }
};

// Run tests for the specified platform or all platforms
let success = true;

if (platform === 'all') {
  // Run tests for all platforms
  const platforms = ['web', 'ios', 'android'];
  for (const platformName of platforms) {
    const platformSuccess = runForPlatform(platformName);
    success = success && platformSuccess;
  }
} else {
  // Run tests for the specified platform
  success = runForPlatform(platform);
}

// Exit with appropriate code
process.exit(success ? 0 : 1);