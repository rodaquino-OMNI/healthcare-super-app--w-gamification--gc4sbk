#!/usr/bin/env node

/**
 * AUSTA SuperApp Import Path Converter
 * 
 * This script automates the migration of import paths to use the new standardized
 * module resolution and path aliases. It scans specified directories, identifies
 * import statements, and rewrites them to use proper aliases like @austa/*, @app/*, etc.
 * 
 * Features:
 * - Supports new package structure and path aliases
 * - Handles refactored directory structure
 * - Provides workspace-aware path resolution
 * - Implements journey-specific import handling
 * - Validates path correctness after transformation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to exclude from scanning
  excludeDirs: ['node_modules', 'dist', '.next', 'build', 'coverage', '.yarn'],
  // File extensions to process
  fileExtensions: /\.(tsx?|jsx?)$/,
  // Dry run mode (don't actually modify files)
  dryRun: false,
  // Verbose logging
  verbose: false,
  // Validate imports after transformation
  validateImports: true,
};

// Find files matching pattern
const findFiles = (dir, pattern) => {
  let results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !CONFIG.excludeDirs.includes(file)) {
        results = results.concat(findFiles(filePath, pattern));
      } else if (pattern.test(file)) {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}: ${error.message}`);
  }
  
  return results;
};

// Detect workspace root based on package.json or git root
const detectWorkspaceRoot = (startDir) => {
  let currentDir = startDir;
  
  // Try to find package.json with workspaces field
  while (currentDir !== '/') {
    try {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces) {
          return currentDir;
        }
      }
      
      // Check for .git directory as fallback
      const gitDir = path.join(currentDir, '.git');
      if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
        return currentDir;
      }
    } catch (error) {
      // Continue to parent directory
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // If no workspace root found, return the starting directory
  return startDir;
};

// Detect which workspace a file belongs to
const detectWorkspace = (filePath, workspaceRoot) => {
  const relativePath = path.relative(workspaceRoot, filePath);
  const parts = relativePath.split(path.sep);
  
  if (parts[0] === 'src') {
    if (parts[1] === 'backend') {
      if (parts[2] === 'packages') {
        return { type: 'backend-package', name: parts[3] || '' };
      } else if (['api-gateway', 'auth-service', 'health-service', 'care-service', 'plan-service', 'gamification-engine', 'notification-service'].includes(parts[2])) {
        return { type: 'backend-service', name: parts[2] };
      } else if (parts[2] === 'shared') {
        return { type: 'backend-shared', name: 'shared' };
      }
      return { type: 'backend', name: '' };
    } else if (parts[1] === 'web') {
      if (['design-system', 'primitives', 'interfaces', 'journey-context', 'shared'].includes(parts[2])) {
        return { type: 'web-package', name: parts[2] };
      } else if (['web', 'mobile'].includes(parts[2])) {
        return { type: 'web-app', name: parts[2] };
      }
      return { type: 'web', name: '' };
    }
  }
  
  return { type: 'unknown', name: '' };
};

// Path mapping definitions
const createPathMappings = (workspaceRoot) => [
  // Backend shared packages
  { from: /src\/backend\/shared\/src\//g, to: '@shared/' },
  { from: /src\/backend\/shared\/prisma\//g, to: '@prisma/' },
  
  // Backend services
  { from: /src\/backend\/gamification-engine\/src\//g, to: '@gamification/' },
  { from: /src\/backend\/api-gateway\/src\//g, to: '@app/api-gateway/' },
  { from: /src\/backend\/auth-service\/src\//g, to: '@app/auth/' },
  { from: /src\/backend\/health-service\/src\//g, to: '@app/health/' },
  { from: /src\/backend\/care-service\/src\//g, to: '@app/care/' },
  { from: /src\/backend\/plan-service\/src\//g, to: '@app/plan/' },
  { from: /src\/backend\/notification-service\/src\//g, to: '@app/notification/' },
  
  // Backend packages
  { from: /src\/backend\/packages\/auth\/src\//g, to: '@austa/auth/' },
  { from: /src\/backend\/packages\/utils\/src\//g, to: '@austa/utils/' },
  { from: /src\/backend\/packages\/tracing\/src\//g, to: '@austa/tracing/' },
  { from: /src\/backend\/packages\/logging\/src\//g, to: '@austa/logging/' },
  { from: /src\/backend\/packages\/events\/src\//g, to: '@austa/events/' },
  { from: /src\/backend\/packages\/errors\/src\//g, to: '@austa/errors/' },
  { from: /src\/backend\/packages\/database\/src\//g, to: '@austa/database/' },
  { from: /src\/backend\/packages\/interfaces\/(.+)\//g, to: '@austa/interfaces/$1/' },
  
  // Web packages
  { from: /src\/web\/design-system\/src\//g, to: '@austa/design-system/' },
  { from: /src\/web\/primitives\/src\//g, to: '@design-system/primitives/' },
  { from: /src\/web\/interfaces\//g, to: '@austa/interfaces/' },
  { from: /src\/web\/journey-context\/src\//g, to: '@austa/journey-context/' },
  { from: /src\/web\/shared\//g, to: '@web/shared/' },
  
  // Web apps
  { from: /src\/web\/web\/src\//g, to: '@web/app/' },
  { from: /src\/web\/mobile\/src\//g, to: '@mobile/app/' },
  
  // Journey-specific imports
  { from: /src\/backend\/health-service\/prisma\//g, to: '@health/prisma/' },
  { from: /src\/backend\/plan-service\/prisma\//g, to: '@plan/prisma/' },
  { from: /src\/backend\/gamification-engine\/prisma\//g, to: '@gamification/prisma/' },
  
  // Relative imports that should be absolute
  { 
    from: /\.\.\/(\.\.\/)+(backend|web)\/([^/]+)\/src\//g, 
    to: (match, p1, p2, p3) => {
      if (p2 === 'backend') {
        if (p3 === 'shared') return '@shared/';
        if (p3 === 'gamification-engine') return '@gamification/';
        return `@app/${p3.replace('-service', '')}/`;
      } else if (p2 === 'web') {
        if (p3 === 'design-system') return '@austa/design-system/';
        if (p3 === 'primitives') return '@design-system/primitives/';
        if (p3 === 'interfaces') return '@austa/interfaces/';
        if (p3 === 'journey-context') return '@austa/journey-context/';
        if (p3 === 'shared') return '@web/shared/';
        if (p3 === 'web') return '@web/app/';
        if (p3 === 'mobile') return '@mobile/app/';
      }
      return match; // Keep original if no mapping found
    },
    isFunction: true
  }
];

// Validate if an import path exists
const validateImportPath = (importPath, filePath, workspaceRoot) => {
  // Skip validation for external packages
  if (!importPath.startsWith('@')) {
    return true;
  }
  
  try {
    // Try to resolve the import path relative to the workspace root
    const resolvedPath = require.resolve(importPath, { paths: [path.dirname(filePath), workspaceRoot] });
    return !!resolvedPath;
  } catch (error) {
    return false;
  }
};

// Process a file
const processFile = (filePath, pathMappings, workspaceRoot) => {
  if (CONFIG.verbose) {
    console.log(`Processing ${filePath}`);
  } else {
    process.stdout.write('.');
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changed = false;
    let invalidImports = [];
    
    // Get workspace info for this file
    const workspace = detectWorkspace(filePath, workspaceRoot);
    
    // Process each import statement
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const fullImport = match[0];
      const importPath = match[1] || match[2]; // Handle both import and require
      
      // Skip node built-ins and absolute package imports
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        continue;
      }
      
      // Apply each path mapping
      for (const mapping of pathMappings) {
        if (mapping.from.test(importPath)) {
          let newImportPath;
          
          if (mapping.isFunction) {
            newImportPath = importPath.replace(mapping.from, mapping.to);
          } else {
            newImportPath = importPath.replace(mapping.from, mapping.to);
          }
          
          // Skip if no change
          if (newImportPath === importPath) {
            continue;
          }
          
          const newFullImport = fullImport.replace(importPath, newImportPath);
          
          // Replace in the content
          newContent = newContent.replace(fullImport, newFullImport);
          changed = true;
          
          if (CONFIG.verbose) {
            console.log(`  ${importPath} -> ${newImportPath}`);
          }
          
          // Validate the new import path if enabled
          if (CONFIG.validateImports && !validateImportPath(newImportPath, filePath, workspaceRoot)) {
            invalidImports.push({ original: importPath, new: newImportPath });
          }
          
          // Reset the regex lastIndex to ensure we don't miss imports
          importRegex.lastIndex = 0;
          break;
        }
      }
    }
    
    // Report invalid imports
    if (invalidImports.length > 0) {
      console.warn(`\n⚠️ Warning: ${invalidImports.length} invalid imports in ${filePath}:`);
      for (const imp of invalidImports) {
        console.warn(`  ${imp.original} -> ${imp.new} (not resolvable)`);
      }
    }
    
    // Save changes if needed and not in dry run mode
    if (changed && !CONFIG.dryRun) {
      fs.writeFileSync(filePath, newContent);
      return { changed: true, invalidCount: invalidImports.length };
    }
    
    return { changed, invalidCount: invalidImports.length };
  } catch (error) {
    console.error(`\nError processing ${filePath}: ${error.message}`);
    return { changed: false, invalidCount: 0, error: true };
  }
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    targetDirs: [],
    dryRun: false,
    verbose: false,
    validateImports: true,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--no-validate') {
      options.validateImports = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      options.targetDirs.push(arg);
    }
  }
  
  return options;
};

// Print help message
const printHelp = () => {
  console.log(`
AUSTA SuperApp Import Path Converter

Usage: node convert-imports.js [options] [directories...]

Options:
  --dry-run, -d     Don't modify files, just show what would be changed
  --verbose, -v     Show detailed output for each file
  --no-validate     Skip validation of new import paths
  --help, -h        Show this help message

Examples:
  node convert-imports.js                     # Process src/backend (default)
  node convert-imports.js src/web             # Process src/web directory
  node convert-imports.js -d src              # Dry run for all src
  node convert-imports.js -v src/backend/api-gateway  # Verbose output for api-gateway
`);
};

// Main function
const main = () => {
  // Parse command line arguments
  const options = parseArgs();
  
  // Update config
  CONFIG.dryRun = options.dryRun;
  CONFIG.verbose = options.verbose;
  CONFIG.validateImports = options.validateImports;
  
  // Determine workspace root
  const workspaceRoot = detectWorkspaceRoot(process.cwd());
  console.log(`🔍 Workspace root detected at: ${workspaceRoot}`);
  
  // Create path mappings
  const pathMappings = createPathMappings(workspaceRoot);
  
  // Get target directories
  const targetDirs = options.targetDirs.length > 0 
    ? options.targetDirs.map(dir => path.resolve(dir))
    : [path.join(workspaceRoot, 'src/backend')];
  
  let totalFiles = 0;
  let totalChanged = 0;
  let totalInvalid = 0;
  let totalErrors = 0;
  
  // Process each target directory
  for (const targetDir of targetDirs) {
    console.log(`\n🔍 Scanning directory: ${targetDir}`);
    
    try {
      const files = findFiles(targetDir, CONFIG.fileExtensions);
      console.log(`Found ${files.length} files to process`);
      totalFiles += files.length;
      
      if (!CONFIG.verbose) {
        process.stdout.write('Processing: ');
      }
      
      // Process files
      for (const file of files) {
        const result = processFile(file, pathMappings, workspaceRoot);
        
        if (result.changed) totalChanged++;
        if (result.invalidCount) totalInvalid += result.invalidCount;
        if (result.error) totalErrors++;
      }
      
      if (!CONFIG.verbose) {
        process.stdout.write('\n');
      }
    } catch (error) {
      console.error(`Error processing directory ${targetDir}: ${error.message}`);
      totalErrors++;
    }
  }
  
  // Print summary
  console.log('\n📊 Summary:');
  console.log(`  Total files processed: ${totalFiles}`);
  console.log(`  Files with updated imports: ${totalChanged}`);
  if (totalInvalid > 0) {
    console.log(`  ⚠️ Invalid imports found: ${totalInvalid}`);
  }
  if (totalErrors > 0) {
    console.log(`  ❌ Errors encountered: ${totalErrors}`);
  }
  
  if (CONFIG.dryRun) {
    console.log('\n🔍 Dry run completed. No files were modified.');
  } else {
    console.log(`\n✅ Updated imports in ${totalChanged} files out of ${totalFiles}`);
  }
  
  // Restart TypeScript server
  console.log('\n🔄 Restarting TypeScript server...');
  console.log('To restart TypeScript server manually in VS Code:');
  console.log('1. Press Cmd+Shift+P or Ctrl+Shift+P');
  console.log('2. Type "TypeScript: Restart TS Server" and press Enter');
  
  // Suggest next steps
  console.log('\n📝 Next steps:');
  console.log('1. Run TypeScript compiler to verify no type errors were introduced');
  console.log('2. Check that imports are correctly resolved in your IDE');
  console.log('3. Run tests to ensure functionality is preserved');
  
  return totalErrors === 0 ? 0 : 1;
};

// Run the script
process.exit(main());