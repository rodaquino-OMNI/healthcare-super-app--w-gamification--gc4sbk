#!/usr/bin/env node

/**
 * build-order.js
 * 
 * A critical utility for determining the optimal build order of packages and services
 * across the monorepo based on their interdependencies. It analyzes package.json files
 * and TypeScript project references to generate a directed acyclic graph (DAG) of
 * dependencies, validates the graph for cycles, and outputs a topologically sorted
 * build sequence.
 * 
 * Usage:
 *   node build-order.js [options]
 * 
 * Options:
 *   --format=<format>     Output format: json, yaml, github-matrix, dot (default: json)
 *   --output=<file>       Write output to file instead of stdout
 *   --root=<dir>          Root directory of the monorepo (default: current directory)
 *   --include=<pattern>   Glob pattern to include packages (can be used multiple times)
 *   --exclude=<pattern>   Glob pattern to exclude packages (can be used multiple times)
 *   --detect-cycles       Only check for circular dependencies without generating build order
 *   --visualize           Generate a visualization of the dependency graph (requires --output)
 *   --verbose             Enable verbose logging
 *   --help                Show this help message
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const glob = util.promisify(require('glob'));
const minimist = require('minimist');
const chalk = require('chalk');

// Constants
const PACKAGE_JSON = 'package.json';
const TSCONFIG_JSON = 'tsconfig.json';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = minimist(process.argv.slice(2), {
    string: ['format', 'output', 'root', 'include', 'exclude'],
    boolean: ['detect-cycles', 'visualize', 'verbose', 'help'],
    default: {
      format: 'json',
      root: process.cwd(),
      'detect-cycles': false,
      visualize: false,
      verbose: false,
      help: false
    },
    alias: {
      h: 'help',
      f: 'format',
      o: 'output',
      r: 'root',
      v: 'verbose'
    }
  });

  // Convert single patterns to arrays
  if (args.include && !Array.isArray(args.include)) {
    args.include = [args.include];
  }
  if (args.exclude && !Array.isArray(args.exclude)) {
    args.exclude = [args.exclude];
  }

  return args;
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
${chalk.bold('build-order.js')} - Determine optimal build order for monorepo packages

${chalk.bold('Usage:')}
  node build-order.js [options]

${chalk.bold('Options:')}
  --format=<format>     Output format: json, yaml, github-matrix, dot (default: json)
  --output=<file>       Write output to file instead of stdout
  --root=<dir>          Root directory of the monorepo (default: current directory)
  --include=<pattern>   Glob pattern to include packages (can be used multiple times)
  --exclude=<pattern>   Glob pattern to exclude packages (can be used multiple times)
  --detect-cycles       Only check for circular dependencies without generating build order
  --visualize           Generate a visualization of the dependency graph (requires --output)
  --verbose, -v         Enable verbose logging
  --help, -h            Show this help message

${chalk.bold('Examples:')}
  # Generate JSON build order for all packages
  node build-order.js

  # Generate GitHub Actions matrix for backend packages
  node build-order.js --format=github-matrix --include="src/backend/**" --output=matrix.json

  # Check for circular dependencies
  node build-order.js --detect-cycles --verbose

  # Generate a visualization of the dependency graph
  node build-order.js --visualize --output=dependency-graph.dot --format=dot
  `);
}

/**
 * Find all package.json files in the monorepo
 * @param {string} rootDir - Root directory of the monorepo
 * @param {string[]} includePatterns - Glob patterns to include
 * @param {string[]} excludePatterns - Glob patterns to exclude
 * @returns {Promise<string[]>} - Array of package.json file paths
 */
async function findPackageJsonFiles(rootDir, includePatterns = [], excludePatterns = []) {
  // Default include pattern if none provided
  if (!includePatterns || includePatterns.length === 0) {
    includePatterns = ['**/package.json'];
  } else {
    // Ensure patterns end with package.json
    includePatterns = includePatterns.map(pattern => {
      if (pattern.endsWith('/')) {
        return `${pattern}${PACKAGE_JSON}`;
      } else if (!pattern.endsWith(PACKAGE_JSON)) {
        return `${pattern}/**/${PACKAGE_JSON}`;
      }
      return pattern;
    });
  }

  // Build exclude patterns
  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**'
  ];

  if (excludePatterns && excludePatterns.length > 0) {
    excludePatterns.forEach(pattern => {
      if (pattern.endsWith('/')) {
        ignorePatterns.push(`${pattern}**`);
      } else if (!pattern.includes('*')) {
        ignorePatterns.push(`${pattern}/**`);
      } else {
        ignorePatterns.push(pattern);
      }
    });
  }

  // Find all package.json files
  let packageJsonFiles = [];
  for (const pattern of includePatterns) {
    const files = await glob(pattern, {
      cwd: rootDir,
      ignore: ignorePatterns,
      absolute: true
    });
    packageJsonFiles = [...packageJsonFiles, ...files];
  }

  return packageJsonFiles;
}

/**
 * Parse a package.json file and extract relevant information
 * @param {string} packageJsonPath - Path to package.json file
 * @returns {Object} - Package information
 */
function parsePackageJson(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageDir = path.dirname(packageJsonPath);
    const packageName = packageJson.name || path.relative(process.cwd(), packageDir);
    
    // Extract dependencies
    const dependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
      ...packageJson.peerDependencies || {}
    };

    // Extract workspace information
    const workspaces = packageJson.workspaces || [];
    
    return {
      name: packageName,
      path: packageDir,
      dependencies,
      workspaces,
      packageJson
    };
  } catch (error) {
    console.error(`Error parsing ${packageJsonPath}: ${error.message}`);
    return null;
  }
}

/**
 * Parse a tsconfig.json file and extract project references
 * @param {string} packageDir - Package directory
 * @returns {string[]} - Array of referenced project paths
 */
function parseTsConfig(packageDir) {
  const tsconfigPath = path.join(packageDir, TSCONFIG_JSON);
  if (!fs.existsSync(tsconfigPath)) {
    return [];
  }

  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    const references = tsconfig.references || [];
    return references.map(ref => {
      // Convert relative path to absolute
      const refPath = ref.path;
      if (path.isAbsolute(refPath)) {
        return refPath;
      }
      return path.resolve(packageDir, refPath);
    });
  } catch (error) {
    console.error(`Error parsing ${tsconfigPath}: ${error.message}`);
    return [];
  }
}

/**
 * Build a dependency graph from package.json files and tsconfig.json references
 * @param {Object[]} packages - Array of package information objects
 * @returns {Object} - Dependency graph
 */
function buildDependencyGraph(packages) {
  const graph = {};
  const packagesByName = {};
  const packagesByPath = {};

  // First pass: index packages by name and path
  packages.forEach(pkg => {
    if (!pkg) return;
    
    graph[pkg.name] = [];
    packagesByName[pkg.name] = pkg;
    packagesByPath[pkg.path] = pkg;
  });

  // Second pass: build dependency graph
  packages.forEach(pkg => {
    if (!pkg) return;

    // Add dependencies from package.json
    Object.keys(pkg.dependencies).forEach(depName => {
      if (packagesByName[depName]) {
        if (!graph[pkg.name].includes(depName)) {
          graph[pkg.name].push(depName);
        }
      }
    });

    // Add dependencies from tsconfig.json references
    const tsReferences = parseTsConfig(pkg.path);
    tsReferences.forEach(refPath => {
      const refPkg = packagesByPath[refPath];
      if (refPkg && refPkg.name !== pkg.name) {
        if (!graph[pkg.name].includes(refPkg.name)) {
          graph[pkg.name].push(refPkg.name);
        }
      }
    });
  });

  return { graph, packagesByName, packagesByPath };
}

/**
 * Detect cycles in the dependency graph using DFS
 * @param {Object} graph - Dependency graph
 * @returns {Array} - Array of detected cycles
 */
function detectCycles(graph) {
  const cycles = [];
  const visited = {};
  const recursionStack = {};
  const pathStack = {};

  function dfs(node, path = []) {
    // Mark the current node as visited and add to recursion stack
    visited[node] = true;
    recursionStack[node] = true;
    pathStack[node] = [...path, node];

    // Visit all adjacent vertices
    for (const neighbor of graph[node] || []) {
      // If not visited, recursively visit
      if (!visited[neighbor]) {
        if (dfs(neighbor, pathStack[node])) {
          return true;
        }
      } 
      // If the neighbor is in the recursion stack, we found a cycle
      else if (recursionStack[neighbor]) {
        // Extract the cycle from the path
        const cycleStart = pathStack[node].indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = [...pathStack[node].slice(cycleStart), node];
          cycles.push(cycle);
        }
        return true;
      }
    }

    // Remove the node from recursion stack
    recursionStack[node] = false;
    return false;
  }

  // Visit all nodes
  for (const node in graph) {
    if (!visited[node]) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Perform topological sorting on the dependency graph
 * @param {Object} graph - Dependency graph
 * @returns {string[]} - Topologically sorted array of package names
 */
function topologicalSort(graph) {
  const result = [];
  const visited = {};
  const temp = {}; // Temporary mark for cycle detection

  function visit(node) {
    // If node is temporarily marked, we have a cycle
    if (temp[node]) {
      throw new Error(`Circular dependency detected involving ${node}`);
    }

    // If node hasn't been visited yet
    if (!visited[node]) {
      // Mark node temporarily
      temp[node] = true;

      // Visit all dependencies
      for (const dependency of graph[node] || []) {
        visit(dependency);
      }

      // Mark node as visited and add to result
      visited[node] = true;
      temp[node] = false;
      result.push(node);
    }
  }

  // Visit all nodes
  for (const node in graph) {
    if (!visited[node]) {
      visit(node);
    }
  }

  // Reverse the result to get the correct build order
  return result.reverse();
}

/**
 * Format the build order based on the specified format
 * @param {string[]} buildOrder - Topologically sorted array of package names
 * @param {Object} packagesByName - Map of package names to package information
 * @param {string} format - Output format (json, yaml, github-matrix, dot)
 * @returns {string} - Formatted build order
 */
function formatBuildOrder(buildOrder, packagesByName, format) {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(buildOrder, null, 2);

    case 'yaml':
      return buildOrder.map(pkg => `- ${pkg}`).join('\n');

    case 'github-matrix':
      // Format for GitHub Actions matrix
      const matrix = {
        include: buildOrder.map(pkg => ({
          package: pkg,
          path: packagesByName[pkg].path
        }))
      };
      return JSON.stringify(matrix, null, 2);

    case 'dot':
      // Generate DOT format for visualization
      const lines = ['digraph DependencyGraph {'];
      lines.push('  rankdir=LR;');
      lines.push('  node [shape=box, style=filled, fillcolor=lightblue];');
      
      // Add nodes
      for (const pkg of buildOrder) {
        lines.push(`  "${pkg}" [label="${pkg}"];`);
      }
      
      // Add edges
      for (const pkg of buildOrder) {
        for (const dep of packagesByName[pkg].dependencies) {
          if (buildOrder.includes(dep)) {
            lines.push(`  "${pkg}" -> "${dep}";`);
          }
        }
      }
      
      lines.push('}');
      return lines.join('\n');

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate a visualization of the dependency graph
 * @param {string} dotContent - DOT format content
 * @param {string} outputPath - Output file path
 */
async function generateVisualization(dotContent, outputPath) {
  try {
    // Check if graphviz is available
    const { execSync } = require('child_process');
    try {
      execSync('dot -V', { stdio: 'ignore' });
    } catch (error) {
      console.error(chalk.red('Error: Graphviz is not installed. Please install it to generate visualizations.'));
      console.error('See https://graphviz.org/download/ for installation instructions.');
      return;
    }

    // Write DOT file
    const dotFile = outputPath.replace(/\.[^.]+$/, '') + '.dot';
    fs.writeFileSync(dotFile, dotContent, 'utf8');
    console.log(chalk.green(`DOT file written to ${dotFile}`));

    // Generate visualization
    const outputFormat = path.extname(outputPath).slice(1) || 'png';
    const validFormats = ['png', 'svg', 'pdf'];
    if (!validFormats.includes(outputFormat)) {
      console.warn(chalk.yellow(`Warning: Unsupported output format '${outputFormat}'. Using 'png' instead.`));
      outputPath = outputPath.replace(/\.[^.]+$/, '') + '.png';
    }

    execSync(`dot -T${outputFormat} -o "${outputPath}" "${dotFile}"`);
    console.log(chalk.green(`Visualization generated at ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`Error generating visualization: ${error.message}`));
  }
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();

  // Show help if requested
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Validate arguments
  if (args.visualize && !args.output) {
    console.error(chalk.red('Error: --visualize requires --output to be specified'));
    process.exit(1);
  }

  if (args.format && !['json', 'yaml', 'github-matrix', 'dot'].includes(args.format.toLowerCase())) {
    console.error(chalk.red(`Error: Unsupported format: ${args.format}`));
    console.error('Supported formats: json, yaml, github-matrix, dot');
    process.exit(1);
  }

  try {
    // Find all package.json files
    if (args.verbose) {
      console.log(chalk.blue('Finding package.json files...'));
    }
    const packageJsonFiles = await findPackageJsonFiles(
      args.root,
      args.include,
      args.exclude
    );

    if (packageJsonFiles.length === 0) {
      console.error(chalk.red('Error: No package.json files found'));
      process.exit(1);
    }

    if (args.verbose) {
      console.log(chalk.green(`Found ${packageJsonFiles.length} package.json files`));
    }

    // Parse package.json files
    if (args.verbose) {
      console.log(chalk.blue('Parsing package.json files...'));
    }
    const packages = packageJsonFiles.map(parsePackageJson).filter(Boolean);

    // Build dependency graph
    if (args.verbose) {
      console.log(chalk.blue('Building dependency graph...'));
    }
    const { graph, packagesByName, packagesByPath } = buildDependencyGraph(packages);

    // Detect cycles
    if (args.verbose) {
      console.log(chalk.blue('Detecting cycles...'));
    }
    const cycles = detectCycles(graph);

    if (cycles.length > 0) {
      console.error(chalk.red('Circular dependencies detected:'));
      cycles.forEach((cycle, index) => {
        console.error(chalk.red(`Cycle ${index + 1}: ${cycle.join(' -> ')} -> ${cycle[0]}`));
      });

      if (args['detect-cycles']) {
        process.exit(1);
      }
    } else if (args.verbose) {
      console.log(chalk.green('No circular dependencies detected'));
    }

    // If only checking for cycles, exit
    if (args['detect-cycles']) {
      process.exit(cycles.length > 0 ? 1 : 0);
    }

    // Perform topological sort
    if (args.verbose) {
      console.log(chalk.blue('Determining build order...'));
    }
    let buildOrder;
    try {
      buildOrder = topologicalSort(graph);
    } catch (error) {
      console.error(chalk.red(`Error during topological sort: ${error.message}`));
      process.exit(1);
    }

    if (args.verbose) {
      console.log(chalk.green(`Build order determined for ${buildOrder.length} packages`));
    }

    // Format the build order
    const formattedOutput = formatBuildOrder(buildOrder, packagesByName, args.format);

    // Output the result
    if (args.output) {
      fs.writeFileSync(args.output, formattedOutput, 'utf8');
      console.log(chalk.green(`Output written to ${args.output}`));
    } else {
      console.log(formattedOutput);
    }

    // Generate visualization if requested
    if (args.visualize) {
      if (args.format.toLowerCase() !== 'dot') {
        // Generate DOT format for visualization
        const dotOutput = formatBuildOrder(buildOrder, packagesByName, 'dot');
        await generateVisualization(dotOutput, args.output);
      } else {
        await generateVisualization(formattedOutput, args.output);
      }
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Unhandled error: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});