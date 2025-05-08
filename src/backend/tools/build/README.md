# Build Order Tool

A critical utility for determining the optimal build order of packages and services across the AUSTA SuperApp monorepo based on their interdependencies. It analyzes package.json files and TypeScript project references to generate a directed acyclic graph (DAG) of dependencies, validates the graph for cycles, and outputs a topologically sorted build sequence.

## Features

- **Dependency Analysis**: Scans package.json files and TypeScript project references to identify dependencies between packages
- **Cycle Detection**: Identifies circular dependencies that would cause build failures
- **Topological Sorting**: Determines the optimal build order based on dependencies
- **GitHub Actions Integration**: Generates build matrices for parallel CI/CD workflows
- **Visualization**: Creates graphical representations of the dependency graph (requires Graphviz)
- **Multiple Output Formats**: Supports text, JSON, and GitHub Actions matrix formats

## Installation

The tool is included in the AUSTA SuperApp monorepo and doesn't require separate installation. Just ensure you have Node.js ≥18.0.0 installed.

## Usage

### Command Line

```bash
node src/backend/tools/build/build-order.js [options]
```

### Options

- `--format, -f`: Output format: text, json, github-actions (default: text)
- `--root, -r`: Root directory to scan (default: process.cwd())
- `--output, -o`: Output file (default: stdout)
- `--include, -i`: Comma-separated list of directories to include (default: all)
- `--exclude, -e`: Comma-separated list of directories to exclude (default: none)
- `--visualize, -v`: Generate a visualization of the dependency graph (default: false)
  - Optionally specify output path: `--visualize path/to/output.png`
- `--help, -h`: Show help message

### Examples

#### Generate a text-based build order

```bash
node src/backend/tools/build/build-order.js
```

#### Generate a GitHub Actions matrix for CI/CD

```bash
node src/backend/tools/build/build-order.js --format github-actions --output .github/build-matrix.json
```

#### Generate a visualization of the dependency graph

```bash
node src/backend/tools/build/build-order.js --visualize docs/dependency-graph.png
```

#### Focus on specific packages

```bash
node src/backend/tools/build/build-order.js --include src/backend/packages,src/backend/shared
```

### Programmatic Usage

You can also use the tool programmatically in your Node.js scripts:

```javascript
const { 
  buildDependencyGraph, 
  detectCycles, 
  topologicalSort,
  generateGitHubActionsMatrix
} = require('./src/backend/tools/build/build-order');

// Build the dependency graph
const graph = buildDependencyGraph(process.cwd());

// Detect cycles
const cycles = detectCycles(graph);
if (cycles.length > 0) {
  console.error('Circular dependencies detected!');
  process.exit(1);
}

// Get the build order
const buildOrder = topologicalSort(graph);

// Generate a GitHub Actions matrix
const matrix = generateGitHubActionsMatrix(buildOrder, graph);
```

## Integration with CI/CD

### GitHub Actions

To use the build order tool in GitHub Actions workflows, add a step to generate the build matrix:

```yaml
jobs:
  determine-build-order:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - id: set-matrix
        run: |
          MATRIX=$(node src/backend/tools/build/build-order.js --format github-actions)
          echo "matrix=$MATRIX" >> $GITHUB_OUTPUT

  build:
    needs: determine-build-order
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.determine-build-order.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build ${{ matrix.package }}
        run: |
          cd ${{ matrix.path }}
          npm install
          npm run build
```

## Troubleshooting

### Circular Dependencies

If the tool detects circular dependencies, it will output the cycles and exit with a non-zero status code. To resolve circular dependencies:

1. Identify the packages involved in the cycle
2. Refactor the code to break the cycle:
   - Extract shared code into a common dependency
   - Use dependency injection or other design patterns to invert dependencies
   - Consider if the circular dependency indicates a design issue

### Visualization Issues

To generate visualizations, you need Graphviz installed:

- **Ubuntu/Debian**: `apt-get install graphviz`
- **macOS**: `brew install graphviz`
- **Windows**: Install from [Graphviz website](https://graphviz.org/download/)

If visualization fails, the tool will save a .dot file that you can manually convert using the Graphviz `dot` command.

## How It Works

1. **Dependency Discovery**: The tool scans package.json files to find direct dependencies between packages and analyzes TypeScript project references and path aliases to identify implicit dependencies.

2. **Graph Construction**: It builds a directed graph where nodes are packages and edges represent dependencies.

3. **Cycle Detection**: Using depth-first search, it identifies any circular dependencies in the graph.

4. **Topological Sorting**: For a valid (acyclic) graph, it performs a topological sort to determine the build order.

5. **Output Generation**: The sorted list is formatted according to the specified output format.

## Contributing

To contribute to the build order tool:

1. Make your changes to `src/backend/tools/build/build-order.js`
2. Test thoroughly with various package configurations
3. Update this README if you add new features or change existing behavior
4. Submit a pull request with a clear description of your changes