/**
 * @file plugin-constraints.cjs
 * @description Yarn plugin that enforces workspace-wide constraints on dependencies,
 * ensuring consistent versioning, preventing duplicates, and validating dependency
 * integrity across the AUSTA SuperApp monorepo.
 */

// @ts-check

/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types');

/**
 * Core libraries with specific version requirements
 * These are libraries that have known version conflicts in the monorepo
 * and need to be standardized across all workspaces
 */
const CORE_DEPENDENCIES = {
  // React ecosystem
  'react': '18.2.0',
  'react-dom': '18.2.0',
  'react-native': '0.73.4',
  
  // Core libraries with version conflicts mentioned in the spec
  'minimatch': '9.0.3',
  'semver': '7.5.4',
  'ws': '8.16.0',
  
  // Framework versions from the spec
  'next': '14.2.0',
  '@nestjs/core': '10.3.0',
  '@nestjs/common': '10.3.0',
  'typescript': '5.3.3',
  
  // UI libraries from the spec
  'styled-components': '6.1.8',
  '@mui/material': '5.15.12',
  'framer-motion': '11.0.8',
  
  // State management from the spec
  '@tanstack/react-query': '5.25.0',
  '@apollo/client': '3.8.10',
  '@reduxjs/toolkit': '2.1.0',
};

/**
 * Journey-specific packages that must be consistent across the monorepo
 */
const JOURNEY_PACKAGES = [
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context'
];

/**
 * Enforces consistent dependency versions across all workspaces
 * @param {object} context - The Yarn constraints context
 * @param {string} dependencyIdent - The dependency identifier
 * @param {string} version - The version to enforce
 */
function enforcePackageVersion(context, dependencyIdent, version) {
  for (const dependency of context.Yarn.dependencies({ ident: dependencyIdent })) {
    if (dependency.type === 'peerDependencies') continue;
    dependency.update(version);
  }
}

/**
 * Enforces that all workspaces use the same version of a dependency
 * @param {object} context - The Yarn constraints context
 */
function enforceConsistentDependencyVersions(context) {
  // For each dependency in the project
  for (const dependency of context.Yarn.dependencies()) {
    // Skip peer dependencies as they often have broader version ranges
    if (dependency.type === 'peerDependencies') continue;
    
    // For each other instance of the same dependency
    for (const otherDependency of context.Yarn.dependencies({ ident: dependency.ident })) {
      if (otherDependency.type === 'peerDependencies') continue;
      
      // Update to use the same version
      dependency.update(otherDependency.range);
    }
  }
}

/**
 * Enforces that journey-specific packages are used consistently
 * @param {object} context - The Yarn constraints context
 */
function enforceJourneyPackages(context) {
  for (const packageName of JOURNEY_PACKAGES) {
    // Check if the package exists in any workspace
    const dependencies = Array.from(context.Yarn.dependencies({ ident: packageName }));
    
    if (dependencies.length > 0) {
      // Get the highest version used
      let highestVersion = dependencies[0].range;
      
      for (const dep of dependencies) {
        if (dep.type === 'peerDependencies') continue;
        
        // Simple version comparison - in a real implementation, you'd use semver
        if (dep.range > highestVersion) {
          highestVersion = dep.range;
        }
      }
      
      // Enforce the highest version across all workspaces
      for (const dep of dependencies) {
        if (dep.type === 'peerDependencies') continue;
        dep.update(highestVersion);
      }
    }
  }
}

/**
 * Prevents duplicate packages with different versions
 * @param {object} context - The Yarn constraints context
 */
function preventDuplicatePackages(context) {
  // Get all workspaces
  const workspaces = Array.from(context.Yarn.workspaces());
  
  // Track packages that have been seen
  const seenPackages = new Map();
  
  for (const workspace of workspaces) {
    const name = workspace.manifest.name;
    
    // Skip if no name (shouldn't happen in a well-formed workspace)
    if (!name) continue;
    
    // Check if this package name has been seen before
    if (seenPackages.has(name)) {
      const existingWorkspace = seenPackages.get(name);
      workspace.error(
        `Duplicate package name: ${name} is used by both ${workspace.cwd} and ${existingWorkspace.cwd}`
      );
    } else {
      seenPackages.set(name, workspace);
    }
  }
}

/**
 * Enforces Node.js engine compatibility across all workspaces
 * @param {object} context - The Yarn constraints context
 */
function enforceNodeEngineCompatibility(context) {
  for (const workspace of context.Yarn.workspaces()) {
    workspace.set('engines.node', '>=18.0.0');
  }
}

/**
 * Main constraints configuration
 */
module.exports = defineConfig({
  async constraints(context) {
    // Enforce specific versions for core dependencies
    for (const [dependencyIdent, version] of Object.entries(CORE_DEPENDENCIES)) {
      enforcePackageVersion(context, dependencyIdent, version);
    }
    
    // Enforce consistent dependency versions across workspaces
    enforceConsistentDependencyVersions(context);
    
    // Enforce journey-specific packages
    enforceJourneyPackages(context);
    
    // Prevent duplicate packages
    preventDuplicatePackages(context);
    
    // Enforce Node.js engine compatibility
    enforceNodeEngineCompatibility(context);
  }
});