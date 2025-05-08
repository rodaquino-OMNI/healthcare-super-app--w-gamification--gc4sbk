#!/usr/bin/env node

/**
 * AUSTA SuperApp Build Tools Suite
 * 
 * This is the main entry point for the build tools suite that provides a unified interface
 * for executing dependency validation, path resolution, TypeScript configuration, build ordering,
 * and cache optimization. It offers both CLI commands for individual tools and a complete
 * build preparation workflow that runs all tools in the optimal sequence.
 * 
 * Usage:
 *   - Run a specific tool: node index.js <tool-name> [options]
 *   - Run all tools in sequence: node index.js all [options]
 *   - Get help: node index.js --help
 * 
 * Available tools:
 *   - validate-deps: Analyzes dependency issues across the monorepo
 *   - typescript-config: Manages TypeScript configuration
 *   - fix-paths: Standardizes module path resolution
 *   - build-order: Determines optimal build order
 *   - optimize-cache: Manages caching strategies
 *   - all: Runs all tools in the optimal sequence
 * 
 * Options:
 *   --verbose, -v: Enable verbose logging
 *   --ci: Run in CI mode (optimized for GitHub Actions)
 *   --fix: Automatically fix issues when possible
 *   --watch: Run in watch mode for development
 *   --report: Generate detailed reports
 *   --help, -h: Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import individual build tools
const validateDeps = require('./validate-deps');
const typescriptConfig = require('./typescript-config');
const fixPaths = require('./fix-paths');
const buildOrder = require('./build-order');
const optimizeCache = require('./optimize-cache');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Logger utility for consistent output formatting
 */
class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.ci = options.ci || false;
    this.startTime = Date.now();
    this.stepStartTime = this.startTime;
  }

  /**
   * Log a message with timestamp
   * @param {string} message - Message to log
   * @param {string} level - Log level (info, success, warning, error, debug)
   */
  log(message, level = 'info') {
    if (level === 'debug' && !this.verbose) return;

    const timestamp = new Date().toISOString();
    let prefix = '';
    
    switch (level) {
      case 'success':
        prefix = `${colors.green}✓${colors.reset} `;
        break;
      case 'warning':
        prefix = `${colors.yellow}⚠${colors.reset} `;
        break;
      case 'error':
        prefix = `${colors.red}✗${colors.reset} `;
        break;
      case 'debug':
        prefix = `${colors.dim}🔍${colors.reset} `;
        break;
      case 'info':
      default:
        prefix = `${colors.blue}ℹ${colors.reset} `;
        break;
    }

    // Format for CI or regular console
    if (this.ci) {
      // GitHub Actions workflow commands format
      if (level === 'error') {
        console.error(`::error::${message}`);
      } else if (level === 'warning') {
        console.warn(`::warning::${message}`);
      } else {
        console.log(`::${level}::${message}`);
      }
    } else {
      console.log(`${prefix}${colors.dim}[${timestamp}]${colors.reset} ${message}`);
    }
  }

  /**
   * Log a success message
   * @param {string} message - Success message
   */
  success(message) {
    this.log(message, 'success');
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   */
  warning(message) {
    this.log(message, 'warning');
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   */
  error(message) {
    this.log(message, 'error');
  }

  /**
   * Log a debug message (only shown in verbose mode)
   * @param {string} message - Debug message
   */
  debug(message) {
    this.log(message, 'debug');
  }

  /**
   * Start a new step and log it
   * @param {string} stepName - Name of the step
   */
  startStep(stepName) {
    this.stepStartTime = Date.now();
    this.log(`${colors.bright}Starting: ${stepName}${colors.reset}`);
    
    // Add group in GitHub Actions
    if (this.ci) {
      console.log(`::group::${stepName}`);
    }
  }

  /**
   * End the current step and log the time taken
   * @param {string} stepName - Name of the step
   * @param {boolean} success - Whether the step was successful
   */
  endStep(stepName, success = true) {
    const duration = ((Date.now() - this.stepStartTime) / 1000).toFixed(2);
    const status = success ? 'completed successfully' : 'failed';
    
    if (success) {
      this.success(`${colors.bright}${stepName}${colors.reset} ${status} in ${duration}s`);
    } else {
      this.error(`${colors.bright}${stepName}${colors.reset} ${status} after ${duration}s`);
    }
    
    // End group in GitHub Actions
    if (this.ci) {
      console.log('::endgroup::');
    }
  }

  /**
   * Log the total execution time
   */
  logTotalTime() {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.log(`${colors.bright}Total execution time: ${totalDuration}s${colors.reset}`);
  }
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {
    tool: 'all',
    verbose: false,
    ci: false,
    fix: false,
    watch: false,
    report: false,
    help: false,
  };

  // Check for help flag first
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    parsedArgs.help = true;
    return parsedArgs;
  }

  // Parse tool name (first non-flag argument)
  const toolArg = args.find(arg => !arg.startsWith('-'));
  if (toolArg) {
    parsedArgs.tool = toolArg;
  }

  // Parse flags
  parsedArgs.verbose = args.includes('--verbose') || args.includes('-v');
  parsedArgs.ci = args.includes('--ci');
  parsedArgs.fix = args.includes('--fix');
  parsedArgs.watch = args.includes('--watch');
  parsedArgs.report = args.includes('--report');

  return parsedArgs;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bright}AUSTA SuperApp Build Tools Suite${colors.reset}

Usage:
  node index.js <tool-name> [options]

Available tools:
  ${colors.cyan}validate-deps${colors.reset}      Analyzes dependency issues across the monorepo
  ${colors.cyan}typescript-config${colors.reset}  Manages TypeScript configuration
  ${colors.cyan}fix-paths${colors.reset}          Standardizes module path resolution
  ${colors.cyan}build-order${colors.reset}        Determines optimal build order
  ${colors.cyan}optimize-cache${colors.reset}     Manages caching strategies
  ${colors.cyan}all${colors.reset}                Runs all tools in the optimal sequence

Options:
  ${colors.yellow}--verbose, -v${colors.reset}    Enable verbose logging
  ${colors.yellow}--ci${colors.reset}             Run in CI mode (optimized for GitHub Actions)
  ${colors.yellow}--fix${colors.reset}            Automatically fix issues when possible
  ${colors.yellow}--watch${colors.reset}          Run in watch mode for development
  ${colors.yellow}--report${colors.reset}         Generate detailed reports
  ${colors.yellow}--help, -h${colors.reset}       Show this help message

Examples:
  node index.js validate-deps --verbose
  node index.js typescript-config --fix
  node index.js all --ci --report
  `);
}

/**
 * Get the root directory of the monorepo
 * @returns {string} Absolute path to the monorepo root
 */
function getMonorepoRoot() {
  try {
    // Start from the current directory and traverse up until we find a package.json with workspaces
    let currentDir = process.cwd();
    while (currentDir !== '/') {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces) {
          return currentDir;
        }
      }
      currentDir = path.dirname(currentDir);
    }
    throw new Error('Could not find monorepo root with workspaces in package.json');
  } catch (error) {
    // Fallback to assuming we're in the tools directory
    return path.resolve(__dirname, '../../../..');
  }
}

/**
 * Run a specific build tool
 * @param {string} toolName - Name of the tool to run
 * @param {Object} options - Tool options
 * @param {Logger} logger - Logger instance
 * @returns {Promise<boolean>} Success status
 */
async function runTool(toolName, options, logger) {
  logger.startStep(`Running ${toolName}`);
  
  try {
    let success = false;
    
    switch (toolName) {
      case 'validate-deps':
        success = await validateDeps.run(options, logger);
        break;
      case 'typescript-config':
        success = await typescriptConfig.run(options, logger);
        break;
      case 'fix-paths':
        success = await fixPaths.run(options, logger);
        break;
      case 'build-order':
        success = await buildOrder.run(options, logger);
        break;
      case 'optimize-cache':
        success = await optimizeCache.run(options, logger);
        break;
      default:
        logger.error(`Unknown tool: ${toolName}`);
        success = false;
        break;
    }
    
    logger.endStep(`Running ${toolName}`, success);
    return success;
  } catch (error) {
    logger.error(`Error running ${toolName}: ${error.message}`);
    if (options.verbose) {
      logger.debug(error.stack);
    }
    logger.endStep(`Running ${toolName}`, false);
    return false;
  }
}

/**
 * Run all build tools in the optimal sequence
 * @param {Object} options - Tool options
 * @param {Logger} logger - Logger instance
 * @returns {Promise<boolean>} Success status
 */
async function runAllTools(options, logger) {
  logger.startStep('Running all build tools in sequence');
  
  try {
    // Step 1: Validate dependencies
    const depsSuccess = await runTool('validate-deps', options, logger);
    if (!depsSuccess && !options.fix) {
      logger.error('Dependency validation failed. Use --fix to attempt automatic resolution.');
      logger.endStep('Running all build tools in sequence', false);
      return false;
    }
    
    // Step 2: Configure TypeScript
    const tsConfigSuccess = await runTool('typescript-config', options, logger);
    if (!tsConfigSuccess) {
      logger.error('TypeScript configuration failed.');
      logger.endStep('Running all build tools in sequence', false);
      return false;
    }
    
    // Step 3: Fix path resolution
    const pathsSuccess = await runTool('fix-paths', options, logger);
    if (!pathsSuccess) {
      logger.error('Path resolution standardization failed.');
      logger.endStep('Running all build tools in sequence', false);
      return false;
    }
    
    // Step 4: Determine build order
    const buildOrderSuccess = await runTool('build-order', options, logger);
    if (!buildOrderSuccess) {
      logger.error('Build order determination failed.');
      logger.endStep('Running all build tools in sequence', false);
      return false;
    }
    
    // Step 5: Optimize caching
    const cacheSuccess = await runTool('optimize-cache', options, logger);
    if (!cacheSuccess) {
      logger.warning('Cache optimization failed, but continuing with build.');
    }
    
    // Final validation: Run TypeScript compiler to verify everything works
    if (options.fix) {
      logger.startStep('Final validation with TypeScript compiler');
      try {
        execSync('npx tsc --build --verbose', { stdio: options.verbose ? 'inherit' : 'pipe' });
        logger.success('TypeScript compilation successful!');
        logger.endStep('Final validation with TypeScript compiler', true);
      } catch (error) {
        logger.error('TypeScript compilation failed after all fixes.');
        if (options.verbose) {
          logger.debug(error.toString());
        }
        logger.endStep('Final validation with TypeScript compiler', false);
        logger.endStep('Running all build tools in sequence', false);
        return false;
      }
    }
    
    logger.success('All build tools completed successfully!');
    logger.endStep('Running all build tools in sequence', true);
    return true;
  } catch (error) {
    logger.error(`Error running build tools: ${error.message}`);
    if (options.verbose) {
      logger.debug(error.stack);
    }
    logger.endStep('Running all build tools in sequence', false);
    return false;
  }
}

/**
 * Generate GitHub Actions workflow matrix based on build order
 * @param {Object} options - Tool options
 * @param {Logger} logger - Logger instance
 * @returns {Promise<boolean>} Success status
 */
async function generateWorkflowMatrix(options, logger) {
  logger.startStep('Generating GitHub Actions workflow matrix');
  
  try {
    // Get the build order
    const buildOrderResult = await buildOrder.getBuildOrder(options);
    if (!buildOrderResult.success) {
      logger.error('Failed to determine build order for workflow matrix.');
      logger.endStep('Generating GitHub Actions workflow matrix', false);
      return false;
    }
    
    // Generate the matrix
    const matrix = {
      workspace: buildOrderResult.order.map(pkg => pkg.path),
      include: buildOrderResult.order.map(pkg => ({
        workspace: pkg.path,
        name: pkg.name,
        dependencies: pkg.dependencies,
      })),
    };
    
    // Output the matrix
    if (options.ci) {
      // Set output for GitHub Actions
      console.log(`::set-output name=matrix::${JSON.stringify(matrix)}`);
    } else {
      // Write to file for local use
      const outputPath = path.join(process.cwd(), 'build-matrix.json');
      fs.writeFileSync(outputPath, JSON.stringify(matrix, null, 2));
      logger.success(`Workflow matrix written to ${outputPath}`);
    }
    
    logger.endStep('Generating GitHub Actions workflow matrix', true);
    return true;
  } catch (error) {
    logger.error(`Error generating workflow matrix: ${error.message}`);
    if (options.verbose) {
      logger.debug(error.stack);
    }
    logger.endStep('Generating GitHub Actions workflow matrix', false);
    return false;
  }
}

/**
 * Generate a detailed report of the build configuration
 * @param {Object} options - Tool options
 * @param {Logger} logger - Logger instance
 * @returns {Promise<boolean>} Success status
 */
async function generateReport(options, logger) {
  logger.startStep('Generating build configuration report');
  
  try {
    const reportData = {
      timestamp: new Date().toISOString(),
      monorepoRoot: getMonorepoRoot(),
      nodeVersion: process.version,
      dependencies: {},
      typescript: {},
      paths: {},
      buildOrder: {},
      cache: {},
    };
    
    // Collect dependency information
    const depsResult = await validateDeps.analyze(options);
    reportData.dependencies = depsResult;
    
    // Collect TypeScript configuration
    const tsConfigResult = await typescriptConfig.analyze(options);
    reportData.typescript = tsConfigResult;
    
    // Collect path resolution information
    const pathsResult = await fixPaths.analyze(options);
    reportData.paths = pathsResult;
    
    // Collect build order information
    const buildOrderResult = await buildOrder.getBuildOrder(options);
    reportData.buildOrder = buildOrderResult;
    
    // Collect cache configuration
    const cacheResult = await optimizeCache.analyze(options);
    reportData.cache = cacheResult;
    
    // Write the report
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `build-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    logger.success(`Build configuration report written to ${reportPath}`);
    logger.endStep('Generating build configuration report', true);
    return true;
  } catch (error) {
    logger.error(`Error generating report: ${error.message}`);
    if (options.verbose) {
      logger.debug(error.stack);
    }
    logger.endStep('Generating build configuration report', false);
    return false;
  }
}

/**
 * Set up watch mode for development
 * @param {Object} options - Tool options
 * @param {Logger} logger - Logger instance
 */
function setupWatchMode(options, logger) {
  logger.startStep('Setting up watch mode');
  
  try {
    // Get the monorepo root
    const monorepoRoot = getMonorepoRoot();
    
    // Determine directories to watch
    const dirsToWatch = [
      path.join(monorepoRoot, 'src/backend/packages'),
      path.join(monorepoRoot, 'src/backend/shared'),
      path.join(monorepoRoot, 'src/web/primitives'),
      path.join(monorepoRoot, 'src/web/interfaces'),
      path.join(monorepoRoot, 'src/web/journey-context'),
      path.join(monorepoRoot, 'src/web/design-system'),
    ];
    
    // Filter out directories that don't exist
    const validDirs = dirsToWatch.filter(dir => fs.existsSync(dir));
    
    if (validDirs.length === 0) {
      logger.error('No valid directories to watch.');
      logger.endStep('Setting up watch mode', false);
      return;
    }
    
    logger.success(`Watching ${validDirs.length} directories for changes...`);
    logger.debug(`Watched directories: ${validDirs.join(', ')}`);
    
    // Set up file watchers
    validDirs.forEach(dir => {
      fs.watch(dir, { recursive: true }, async (eventType, filename) => {
        // Only trigger on relevant file changes
        if (filename && (
          filename.endsWith('.ts') ||
          filename.endsWith('.tsx') ||
          filename.endsWith('.js') ||
          filename.endsWith('.jsx') ||
          filename === 'package.json' ||
          filename === 'tsconfig.json'
        )) {
          logger.log(`File changed: ${path.join(dir, filename)}`);
          
          // Run the appropriate tools based on the file type
          if (filename === 'package.json') {
            await runTool('validate-deps', options, logger);
          } else if (filename === 'tsconfig.json') {
            await runTool('typescript-config', options, logger);
          } else if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
            // For TypeScript files, check imports
            await runTool('fix-paths', options, logger);
          }
        }
      });
    });
    
    logger.endStep('Setting up watch mode', true);
    logger.log('Press Ctrl+C to exit watch mode.');
    
    // Keep the process running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.log('Exiting watch mode...');
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Error setting up watch mode: ${error.message}`);
    if (options.verbose) {
      logger.debug(error.stack);
    }
    logger.endStep('Setting up watch mode', false);
  }
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = parseArgs();
  
  // Show help if requested
  if (args.help) {
    showHelp();
    return;
  }
  
  // Create logger
  const logger = new Logger({
    verbose: args.verbose,
    ci: args.ci,
  });
  
  // Log startup information
  logger.log(`${colors.bright}AUSTA SuperApp Build Tools Suite${colors.reset}`);
  logger.debug(`Running in ${process.cwd()}`);
  logger.debug(`Node.js version: ${process.version}`);
  logger.debug(`Tool: ${args.tool}`);
  logger.debug(`Options: ${JSON.stringify({
    verbose: args.verbose,
    ci: args.ci,
    fix: args.fix,
    watch: args.watch,
    report: args.report,
  })}`);
  
  // Create options object
  const options = {
    verbose: args.verbose,
    ci: args.ci,
    fix: args.fix,
    monorepoRoot: getMonorepoRoot(),
  };
  
  // Run the requested tool or all tools
  let success = false;
  
  if (args.tool === 'all') {
    success = await runAllTools(options, logger);
  } else if (args.tool === 'workflow-matrix') {
    success = await generateWorkflowMatrix(options, logger);
  } else {
    success = await runTool(args.tool, options, logger);
  }
  
  // Generate report if requested
  if (args.report) {
    await generateReport(options, logger);
  }
  
  // Set up watch mode if requested
  if (args.watch && success) {
    setupWatchMode(options, logger);
  } else {
    // Log total execution time
    logger.logTotalTime();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});