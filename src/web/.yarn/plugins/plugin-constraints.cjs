/**
 * @file plugin-constraints.cjs
 * @description Yarn plugin that enforces workspace-wide constraints on dependencies,
 * ensuring consistent versioning, preventing duplicates, and validating dependency
 * integrity across the monorepo.
 */

// @ts-check

/**
 * @typedef {import('@yarnpkg/core').Plugin} Plugin
 * @typedef {import('@yarnpkg/core').Workspace} Workspace
 * @typedef {import('@yarnpkg/core').Descriptor} Descriptor
 * @typedef {import('@yarnpkg/core').Ident} Ident
 * @typedef {import('@yarnpkg/core').Project} Project
 * @typedef {import('@yarnpkg/core').Manifest} Manifest
 * @typedef {import('@yarnpkg/core').MessageName} MessageName
 * @typedef {import('@yarnpkg/core').Configuration} Configuration
 */

/** @type {Plugin} */
const plugin = {
  hooks: {
    // This hook is called when the constraints command is run
    // It allows us to define our own constraints
    constraints: async (project, constraints) => {
      // Define core dependencies that must have specific versions
      const CORE_DEPENDENCIES = {
        // Backend
        'nestjs': '10.3.0',
        'express': '4.18.2',
        'graphql': '16.9.0',
        'socket.io': '4.7.4',
        
        // Frontend Web
        'next': '14.2.0',
        'react': '18.2.0',
        'react-dom': '18.2.0',
        
        // Frontend Mobile
        'react-native': '0.73.4',
        
        // UI & Design
        'styled-components': '6.1.8',
        '@mui/material': '5.15.12',
        'framer-motion': '11.0.8',
        '@design-system/primitives': '1.0.0',
        '@austa/design-system': '1.0.0',
        
        // State Management & Data Fetching
        '@reduxjs/toolkit': '2.1.0',
        '@tanstack/react-query': '5.25.0',
        '@apollo/client': '3.8.10',
        '@austa/journey-context': '1.0.0',
        
        // Forms & Validation
        'react-hook-form': '7.51.0',
        'yup': '1.3.3',
        'zod': '3.22.4',
        'joi': '17.12.2',
        
        // Utilities & Tools
        'i18next': '23.8.2',
        'date-fns': '3.3.1',
        '@austa/interfaces': '1.0.0',
        
        // Development Tools
        'typescript': '5.3.3',
        'eslint': '8.57.0',
        'prettier': '3.2.5',
        
        // Testing Framework
        'jest': '29.7.0',
      };
      
      // Define problematic dependencies that need specific version resolutions
      const RESOLUTION_DEPENDENCIES = {
        'minimatch': '9.0.3',
        'semver': '7.5.4',
        'ws': '8.16.0',
      };

      /**
       * Enforce consistent dependency versions across all workspaces
       */
      for (const workspace of project.workspaces) {
        // Enforce core dependencies to have the specified versions
        for (const [name, version] of Object.entries(CORE_DEPENDENCIES)) {
          for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies']) {
            const dependency = workspace.manifest.getForScope(dependencyType).get(name);
            if (dependency) {
              constraints.set(workspace.anchoredLocator.locatorHash, dependencyType, name, version, {
                userProvided: true,
              });
            }
          }
        }

        // Enforce resolution dependencies to have the specified versions
        for (const [name, version] of Object.entries(RESOLUTION_DEPENDENCIES)) {
          constraints.set(workspace.anchoredLocator.locatorHash, 'resolutions', name, version, {
            userProvided: true,
          });
        }
      }

      /**
       * Enforce consistent dependency versions across workspaces
       * This ensures that if multiple workspaces use the same dependency,
       * they all use the same version
       */
      const allDependencies = new Map();

      // First pass: collect all dependencies and their versions
      for (const workspace of project.workspaces) {
        for (const dependencyType of ['dependencies', 'devDependencies']) {
          for (const [name, descriptor] of workspace.manifest.getForScope(dependencyType).entries()) {
            // Skip core dependencies as they are already enforced
            if (CORE_DEPENDENCIES[name]) continue;
            
            // Skip resolution dependencies as they are already enforced
            if (RESOLUTION_DEPENDENCIES[name]) continue;

            if (!allDependencies.has(name)) {
              allDependencies.set(name, { version: descriptor.range, workspaces: new Set() });
            }
            
            allDependencies.get(name).workspaces.add(workspace.anchoredLocator.locatorHash);
          }
        }
      }

      // Second pass: enforce consistent versions
      for (const [name, { version, workspaces }] of allDependencies.entries()) {
        // Only enforce if the dependency is used in multiple workspaces
        if (workspaces.size > 1) {
          for (const workspaceHash of workspaces) {
            const workspace = project.workspacesByLocator.get(workspaceHash);
            if (!workspace) continue;

            for (const dependencyType of ['dependencies', 'devDependencies']) {
              const dependency = workspace.manifest.getForScope(dependencyType).get(name);
              if (dependency) {
                constraints.set(workspaceHash, dependencyType, name, version, {
                  userProvided: true,
                });
              }
            }
          }
        }
      }

      /**
       * Enforce proper workspace references
       * This ensures that workspace references use the correct protocol
       */
      for (const workspace of project.workspaces) {
        for (const dependencyType of ['dependencies', 'devDependencies']) {
          for (const [name, descriptor] of workspace.manifest.getForScope(dependencyType).entries()) {
            // Check if this is a workspace reference
            if (descriptor.range.startsWith('workspace:')) {
              // Ensure it's a valid workspace reference
              const targetWorkspace = project.tryWorkspaceByIdent({ scope: descriptor.scope, name });
              if (!targetWorkspace) {
                constraints.reportError(
                  workspace.anchoredLocator.locatorHash,
                  `${dependencyType}.${name}`,
                  `References non-existent workspace`
                );
              }
            }
          }
        }
      }

      /**
       * Enforce proper package naming conventions
       * This ensures that package names follow the organization's conventions
       */
      for (const workspace of project.workspaces) {
        const name = workspace.manifest.name;
        if (!name) continue;

        // Enforce that internal packages follow the @austa/ or @design-system/ naming convention
        if (name.scope && !['austa', 'design-system'].includes(name.scope)) {
          constraints.reportError(
            workspace.anchoredLocator.locatorHash,
            'name',
            `Package scope must be @austa/ or @design-system/`
          );
        }
      }
    },
  },
};

module.exports = plugin;