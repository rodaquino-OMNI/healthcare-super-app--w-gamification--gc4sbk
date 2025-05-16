/* eslint-disable */
// @ts-nocheck
/**
 * AUSTA SuperApp Workspace Tools Plugin
 * 
 * This plugin enhances Yarn's workspace management capabilities for the AUSTA SuperApp monorepo.
 * It provides tools to work with workspaces, run commands across workspaces, and manage dependencies
 * between workspaces.
 * 
 * Key features:
 * - Enhanced workspace coordination for consistent builds
 * - Workspace-focused commands for dependency management
 * - Cross-workspace operations to ensure consistency
 * - Support for journey-specific workspace operations
 */

module.exports = {
  name: "@yarnpkg/plugin-workspace-tools",
  factory: function (require) {
    var plugin = (() => {
      // Object utility functions
      var objectCreate = Object.create,
          objectDefineProperty = Object.defineProperty,
          objectDefineProperties = Object.defineProperties,
          objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
          objectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors,
          objectGetOwnPropertyNames = Object.getOwnPropertyNames,
          objectGetOwnPropertySymbols = Object.getOwnPropertySymbols,
          objectGetPrototypeOf = Object.getPrototypeOf,
          objectHasOwnProperty = Object.prototype.hasOwnProperty,
          objectPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;

      // Helper functions for object manipulation
      var defineProperty = (obj, key, value) =>
        key in obj
          ? objectDefineProperty(obj, key, {
              enumerable: true,
              configurable: true,
              writable: true,
              value: value,
            })
          : (obj[key] = value);

      var spreadProps = (target, source) => {
        for (var key in source || (source = {})) {
          if (objectHasOwnProperty.call(source, key)) {
            defineProperty(target, key, source[key]);
          }
        }
        if (objectGetOwnPropertySymbols) {
          for (var key of objectGetOwnPropertySymbols(source)) {
            if (objectPropertyIsEnumerable.call(source, key)) {
              defineProperty(target, key, source[key]);
            }
          }
        }
        return target;
      };

      var spreadPropsDeep = (target, source) =>
        objectDefineProperties(target, objectGetOwnPropertyDescriptors(source));

      var markAsModule = (obj) =>
        objectDefineProperty(obj, "__esModule", { value: true });

      // Module handling utilities
      var moduleExports = (module, getOutput) => () =>
        getOutput || module((getOutput = { exports: {} }).exports, getOutput),
        getOutput.exports;

      var exportAll = (target, source) => {
        for (var key in source) {
          objectDefineProperty(target, key, {
            get: () => source[key],
            enumerable: true,
          });
        }
        return target;
      };

      var exportNamespace = (target, module, allowExtraProps) => {
        if (module && typeof module === "object" || typeof module === "function") {
          for (let key of objectGetOwnPropertyNames(module)) {
            if (!objectHasOwnProperty.call(target, key) && key !== "default") {
              objectDefineProperty(target, key, {
                get: () => module[key],
                enumerable: !(allowExtraProps = objectGetOwnPropertyDescriptor(module, key)) || allowExtraProps.enumerable,
              });
            }
          }
        }
        return target;
      };

      // Import required modules
      var { BaseCommand } = require("@yarnpkg/cli");
      var { Configuration, Project, StreamReport, Workspace, Cache, LocatorHash, miscUtils, structUtils, } = require("@yarnpkg/core");
      var { Option, UsageError } = require("clipanion");
      var { isEqual } = require("lodash");
      var os = require("os");
      var path = require("path");
      var { default: semver } = require("semver");
      var { suggestUtils } = require("@yarnpkg/plugin-essentials");
      var { default: micromatch } = require("micromatch");
      var { parseSyml } = require("@yarnpkg/parsers");
      var { cpus } = require("os");
      var { default: pLimit } = require("p-limit");

      // WorkspacesFocusCommand implementation
      class WorkspacesFocusCommand extends BaseCommand {
        constructor() {
          super();
          this.workspaces = Option.Rest();
          this.all = Option.Boolean("-A,--all", false, {
            description: "Focus on the entire project",
          });
          this.production = Option.Boolean("-P,--production", false, {
            description: "Only install regular dependencies",
          });
          this.json = Option.Boolean("-j,--json", false, {
            description: "Format the output as a JSON object",
          });
        }

        async execute() {
          const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
          const { project, workspace: cwdWorkspace } = await Project.find(configuration, this.context.cwd);
          const cache = await Cache.find(configuration);

          if (!this.all && this.workspaces.length === 0) {
            if (!cwdWorkspace) {
              throw new UsageError(
                `Workspaces focus requires a current workspace. Run from a workspace, or use -A,--all.`
              );
            }
            this.workspaces = [cwdWorkspace.locator.name];
          }

          const report = await StreamReport.start(
            {
              configuration,
              json: this.json,
              stdout: this.context.stdout,
            },
            async (report) => {
              const targetWorkspaces = new Set();

              if (this.all) {
                for (const workspace of project.workspaces) {
                  targetWorkspaces.add(workspace);
                }
              } else {
                for (const workspaceName of this.workspaces) {
                  const workspace = project.getWorkspaceByIdent(
                    structUtils.parseIdent(workspaceName)
                  );
                  targetWorkspaces.add(workspace);

                  // Also include all workspaces that are dependencies of the target workspace
                  const includeDependencies = (workspace) => {
                    for (const dependencyType of this.production
                      ? ["dependencies"]
                      : ["dependencies", "devDependencies"]) {
                      for (const descriptor of workspace.manifest[dependencyType].values()) {
                        const dependency = project.tryWorkspaceByDescriptor(descriptor);
                        if (dependency === null) continue;
                        if (targetWorkspaces.has(dependency)) continue;

                        targetWorkspaces.add(dependency);
                        includeDependencies(dependency);
                      }
                    }
                  };

                  includeDependencies(workspace);
                }
              }

              report.reportInfo(null, `Target workspaces: ${targetWorkspaces.size}`);

              // Remove all workspaces that aren't explicitly listed in the set
              for (const workspace of project.workspaces) {
                if (targetWorkspaces.has(workspace)) continue;

                workspace.manifest.dependencies.clear();
                workspace.manifest.devDependencies.clear();
                workspace.manifest.peerDependencies.clear();
                workspace.manifest.scripts.clear();
              }

              // Now that we've removed all the dependencies we don't care about, do a regular install
              await project.install({ cache, report });
            }
          );

          return report.exitCode();
        }
      }

      // WorkspacesForeachCommand implementation
      class WorkspacesForeachCommand extends BaseCommand {
        constructor() {
          super();
          this.args = Option.Proxy();
          this.all = Option.Boolean("-A,--all", false, {
            description: "Run the command on all workspaces of a project",
          });
          this.verbose = Option.Boolean("-v,--verbose", false, {
            description: "Show the full output of commands",
          });
          this.parallel = Option.Boolean("-p,--parallel", false, {
            description: "Run the commands in parallel",
          });
          this.interlaced = Option.Boolean("-i,--interlaced", false, {
            description: "Print the output of commands in real-time instead of buffering",
          });
          this.jobs = Option.String("-j,--jobs", {
            description: "The maximum number of parallel tasks that can be run",
          });
          this.topological = Option.Boolean("-t,--topological", false, {
            description: "Run the command after all workspaces it depends on have finished",
          });
          this.topologicalDev = Option.Boolean(false, {
            description: "Also consider dev dependencies for topological ordering",
          });
          this.include = Option.Array("--include", [], {
            description: "Workspaces to include in the execution (supports glob patterns)",
          });
          this.exclude = Option.Array("--exclude", [], {
            description: "Workspaces to exclude from the execution (supports glob patterns)",
          });
          this.since = Option.String("--since", {
            description: "Only include workspaces that have been changed since the specified ref",
          });
          this.recursive = Option.Boolean("-R,--recursive", false, {
            description: "Find workspaces by recursively traversing dependencies",
          });
          this.from = Option.Array("--from", [], {
            description: "Workspaces to use as the starting point for --recursive (supports glob patterns)",
          });
        }

        async execute() {
          const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
          const { project, workspace: cwdWorkspace } = await Project.find(configuration, this.context.cwd);

          if (!this.all && !cwdWorkspace) {
            throw new UsageError(
              `This command must be run from within a workspace or with the -A,--all flag`
            );
          }

          const command = this.cli.process([this.commandName, ...this.args]);
          const scriptName = command.path.slice(1).join(" ");

          const rootWorkspace = project.topLevelWorkspace;
          const candidates = this.all
            ? project.workspaces
            : [cwdWorkspace, ...this.recursive ? [] : project.getWorkspaceChildren(cwdWorkspace)];

          let workspaces = [];

          // Handle --recursive flag
          if (this.recursive) {
            const from = this.from.length > 0
              ? this.from.map(pattern => {
                  return project.workspaces.filter(workspace => {
                    return micromatch.isMatch(workspace.locator.name, pattern) ||
                           micromatch.isMatch(workspace.relativeCwd, pattern);
                  });
                }).flat()
              : [cwdWorkspace];

            const seen = new Set();
            const traverse = (workspace) => {
              if (seen.has(workspace.relativeCwd)) return;
              seen.add(workspace.relativeCwd);
              workspaces.push(workspace);

              for (const dependencyType of this.topologicalDev
                ? ["dependencies", "devDependencies"]
                : ["dependencies"]) {
                for (const descriptor of workspace.manifest[dependencyType].values()) {
                  const dependency = project.tryWorkspaceByDescriptor(descriptor);
                  if (dependency === null) continue;
                  traverse(dependency);
                }
              }
            };

            for (const workspace of from) {
              traverse(workspace);
            }
          } else {
            workspaces = candidates;
          }

          // Handle --include and --exclude flags
          if (this.include.length > 0) {
            workspaces = workspaces.filter(workspace => {
              return this.include.some(pattern => {
                return micromatch.isMatch(workspace.locator.name, pattern) ||
                       micromatch.isMatch(workspace.relativeCwd, pattern);
              });
            });
          }

          if (this.exclude.length > 0) {
            workspaces = workspaces.filter(workspace => {
              return !this.exclude.some(pattern => {
                return micromatch.isMatch(workspace.locator.name, pattern) ||
                       micromatch.isMatch(workspace.relativeCwd, pattern);
              });
            });
          }

          // Handle --since flag
          if (typeof this.since !== "undefined") {
            const gitPlugin = this.context.plugins.find(plugin => plugin.name === "GitPlugin");
            if (!gitPlugin) {
              throw new UsageError(
                `The --since flag requires the GitPlugin, which doesn't seem to be installed`
              );
            }

            const { getChangedWorkspaces } = gitPlugin.hooks;
            if (!getChangedWorkspaces) {
              throw new UsageError(
                `The --since flag requires the GitPlugin to implement the getChangedWorkspaces hook`
              );
            }

            const changedWorkspaces = await getChangedWorkspaces(project, this.since);
            workspaces = workspaces.filter(workspace => {
              return changedWorkspaces.has(workspace);
            });
          }

          // Sort workspaces topologically if requested
          if (this.topological) {
            workspaces = miscUtils.sortTopologically(workspaces, workspace => {
              const dependencies = [];

              for (const dependencyType of this.topologicalDev
                ? ["dependencies", "devDependencies"]
                : ["dependencies"]) {
                for (const descriptor of workspace.manifest[dependencyType].values()) {
                  const dependency = project.tryWorkspaceByDescriptor(descriptor);
                  if (dependency === null) continue;
                  if (workspaces.indexOf(dependency) === -1) continue;

                  dependencies.push(dependency);
                }
              }

              return dependencies;
            });
          }

          // Determine the number of jobs for parallel execution
          let concurrency;

          if (this.parallel) {
            if (typeof this.jobs === "undefined") {
              concurrency = Math.max(1, cpus().length / 2);
            } else if (this.jobs === "unlimited") {
              concurrency = Infinity;
            } else {
              const parsed = parseInt(this.jobs, 10);
              if (Number.isNaN(parsed) || parsed < 1) {
                throw new UsageError(`Invalid jobs count: ${this.jobs}`);
              }
              concurrency = parsed;
            }
          } else {
            concurrency = 1;
          }

          // Execute the command on each workspace
          const needsProcessing = new Map();
          const processing = new Map();
          const limit = pLimit(concurrency);

          let commandCount = 0;
          let failedCount = 0;

          const report = await StreamReport.start(
            {
              configuration,
              stdout: this.context.stdout,
            },
            async (report) => {
              for (const workspace of workspaces) {
                needsProcessing.set(workspace.anchoredLocator.locatorHash, workspace);
              }

              while (needsProcessing.size > 0) {
                if (failedCount > 0 && !this.parallel) {
                  break;
                }

                const commandPromises = [];

                for (const [identHash, workspace] of needsProcessing) {
                  // If we're in topological mode, check if all dependencies have been processed
                  if (this.topological) {
                    const dependencies = [];

                    for (const dependencyType of this.topologicalDev
                      ? ["dependencies", "devDependencies"]
                      : ["dependencies"]) {
                      for (const descriptor of workspace.manifest[dependencyType].values()) {
                        const dependency = project.tryWorkspaceByDescriptor(descriptor);
                        if (dependency === null) continue;
                        if (workspaces.indexOf(dependency) === -1) continue;

                        dependencies.push(dependency);
                      }
                    }

                    if (dependencies.some(dependency => {
                      return needsProcessing.has(dependency.anchoredLocator.locatorHash) ||
                             processing.has(dependency.anchoredLocator.locatorHash);
                    })) {
                      continue;
                    }
                  }

                  needsProcessing.delete(identHash);
                  processing.set(identHash, workspace);

                  commandPromises.push(limit(async () => {
                    const prefix = this.verbose
                      ? `[${workspace.locator.name}]:`
                      : workspace.locator.name;

                    try {
                      // Check if the script exists for "run" commands
                      if (scriptName.startsWith("run ")) {
                        const scriptRealName = scriptName.slice(4);
                        if (!workspace.manifest.scripts.has(scriptRealName)) {
                          return;
                        }
                      }

                      // Execute the command in the workspace
                      const exitCode = await this.cli.run([this.commandName, ...this.args], {
                        cwd: workspace.cwd,
                        stdout: this.interlaced
                          ? new miscUtils.PrefixedStream(prefix, this.context.stdout)
                          : new miscUtils.BufferStream(),
                        stderr: this.interlaced
                          ? new miscUtils.PrefixedStream(prefix, this.context.stderr)
                          : new miscUtils.BufferStream(),
                      });

                      if (exitCode !== 0) {
                        failedCount += 1;
                        report.reportError(MessageName.UNNAMED, `${prefix} Process exited with code ${exitCode}`);
                      }

                      // If not interlaced, print the buffered output
                      if (!this.interlaced) {
                        const stdout = this.context.stdout;
                        stdout.write(`${prefix} Process exited ${exitCode === 0 ? "successfully" : `with code ${exitCode}`}\n`);
                      }
                    } catch (error) {
                      failedCount += 1;
                      report.reportError(MessageName.UNNAMED, `${prefix} ${error.message}`);
                    } finally {
                      processing.delete(identHash);
                    }
                  }));

                  commandCount += 1;

                  if (!this.parallel) {
                    await Promise.all(commandPromises);
                    break;
                  }
                }

                if (commandPromises.length === 0) {
                  if (processing.size > 0) {
                    // Still processing some commands, wait for them to finish
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                  } else if (needsProcessing.size > 0) {
                    // We have workspaces that need processing but couldn't be processed (circular dependencies)
                    report.reportError(MessageName.UNNAMED, `Circular dependency detected in topological sort`);
                    break;
                  } else {
                    // All done!
                    break;
                  }
                }

                await Promise.all(commandPromises);
              }

              if (failedCount > 0) {
                report.reportError(MessageName.UNNAMED, `${failedCount}/${commandCount} command(s) failed`);
              } else {
                report.reportInfo(null, `${commandCount} command(s) executed successfully`);
              }
            }
          );

          return report.exitCode();
        }
      }

      // Define MessageName enum for error reporting
      const MessageName = {
        UNNAMED: 0,
        CYCLIC_DEPENDENCIES: 1,
        MISSING_DEPENDENCY: 2,
        INVALID_DEPENDENCY: 3,
        DUPLICATE_DEPENDENCY: 4,
        INCONSISTENT_VERSION: 5,
        MISSING_PEER_DEPENDENCY: 6,
      };

      // AUSTA SuperApp specific workspace validation
      class WorkspaceValidator {
        constructor(project) {
          this.project = project;
        }

        // Validate workspace dependencies for consistency
        async validateDependencies(report) {
          const workspaces = this.project.workspaces;
          const dependencyVersions = new Map();
          const errors = [];

          // First pass: collect all dependency versions
          for (const workspace of workspaces) {
            for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies']) {
              for (const [name, descriptor] of workspace.manifest[dependencyType].entries()) {
                if (!dependencyVersions.has(name)) {
                  dependencyVersions.set(name, new Map());
                }
                const versions = dependencyVersions.get(name);
                if (!versions.has(descriptor.range)) {
                  versions.set(descriptor.range, []);
                }
                versions.get(descriptor.range).push({
                  workspace,
                  dependencyType,
                });
              }
            }
          }

          // Second pass: check for inconsistencies
          for (const [name, versions] of dependencyVersions.entries()) {
            if (versions.size > 1) {
              // Check if this is a workspace dependency
              const isWorkspaceDependency = this.project.workspaces.some(ws => 
                structUtils.stringifyIdent(ws.locator) === name
              );

              // Skip workspace dependencies as they use workspace: protocol
              if (isWorkspaceDependency) continue;

              // Skip certain packages that are allowed to have multiple versions
              const allowMultipleVersions = [
                'react', 'react-dom', 'react-native', // React ecosystem
                '@types/react', '@types/react-dom', // React types
                'typescript', // TypeScript
              ];
              if (allowMultipleVersions.includes(name)) continue;

              // Report inconsistent versions
              const versionEntries = Array.from(versions.entries());
              report.reportWarning(
                MessageName.INCONSISTENT_VERSION,
                `Dependency "${name}" has inconsistent version requirements:\n${versionEntries
                  .map(([version, uses]) => 
                    `  ${version} required by:\n${uses
                      .map(use => `    - ${use.workspace.locator.name} (${use.dependencyType})`)
                      .join('\n')}`
                  )
                  .join('\n')}`
              );
            }
          }

          // Third pass: check for missing peer dependencies
          for (const workspace of workspaces) {
            const peerDependencies = workspace.manifest.peerDependencies;
            for (const [name, descriptor] of peerDependencies.entries()) {
              // Check if any workspace that depends on this one is missing the peer dependency
              for (const dependent of workspaces) {
                if (dependent === workspace) continue;
                
                // Check if the dependent workspace depends on this workspace
                const hasDependency = ['dependencies', 'devDependencies'].some(type => {
                  return Array.from(dependent.manifest[type].values()).some(dep => {
                    return this.project.tryWorkspaceByDescriptor(dep) === workspace;
                  });
                });

                if (hasDependency) {
                  // Check if the dependent workspace has the peer dependency
                  const hasPeerDep = ['dependencies', 'devDependencies', 'peerDependencies'].some(type => {
                    return dependent.manifest[type].has(name);
                  });

                  if (!hasPeerDep) {
                    report.reportWarning(
                      MessageName.MISSING_PEER_DEPENDENCY,
                      `Workspace "${dependent.locator.name}" depends on "${workspace.locator.name}" but is missing its peer dependency "${name}"`
                    );
                  }
                }
              }
            }
          }

          return errors;
        }

        // Check for circular dependencies
        async detectCircularDependencies(report) {
          const workspaces = this.project.workspaces;
          const visited = new Map();
          const recursionStack = new Set();

          const checkCircular = (workspace, path = []) => {
            const locatorHash = workspace.anchoredLocator.locatorHash;
            
            if (recursionStack.has(locatorHash)) {
              const cycle = [...path, workspace.locator.name];
              report.reportWarning(
                MessageName.CYCLIC_DEPENDENCIES,
                `Circular dependency detected: ${cycle.join(' -> ')}`
              );
              return true;
            }

            if (visited.has(locatorHash)) {
              return visited.get(locatorHash);
            }

            recursionStack.add(locatorHash);
            path.push(workspace.locator.name);

            let hasCircular = false;

            for (const dependencyType of ['dependencies', 'devDependencies']) {
              for (const descriptor of workspace.manifest[dependencyType].values()) {
                const dependency = this.project.tryWorkspaceByDescriptor(descriptor);
                if (dependency === null) continue;

                if (checkCircular(dependency, [...path])) {
                  hasCircular = true;
                }
              }
            }

            recursionStack.delete(locatorHash);
            visited.set(locatorHash, hasCircular);

            return hasCircular;
          };

          for (const workspace of workspaces) {
            checkCircular(workspace);
          }
        }

        // Validate the entire workspace structure
        async validate() {
          const report = await StreamReport.start(
            {
              configuration: this.project.configuration,
              stdout: process.stdout,
            },
            async (report) => {
              await this.validateDependencies(report);
              await this.detectCircularDependencies(report);
            }
          );

          return report.exitCode();
        }
      }

      // Add a command to validate workspaces
      class WorkspacesValidateCommand extends BaseCommand {
        constructor() {
          super();
          this.json = Option.Boolean("-j,--json", false, {
            description: "Format the output as a JSON object",
          });
        }

        async execute() {
          const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
          const { project } = await Project.find(configuration, this.context.cwd);

          const validator = new WorkspaceValidator(project);
          return await validator.validate();
        }
      }

      // Add a command to check for missing dependencies
      class WorkspacesDependencyCheckCommand extends BaseCommand {
        constructor() {
          super();
          this.json = Option.Boolean("-j,--json", false, {
            description: "Format the output as a JSON object",
          });
          this.fix = Option.Boolean("-f,--fix", false, {
            description: "Automatically fix issues by adding missing dependencies",
          });
          this.workspace = Option.String("-w,--workspace", {
            description: "Check only a specific workspace",
          });
        }

        async execute() {
          const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
          const { project, workspace: cwdWorkspace } = await Project.find(configuration, this.context.cwd);

          const targetWorkspace = this.workspace 
            ? project.getWorkspaceByIdent(structUtils.parseIdent(this.workspace))
            : cwdWorkspace;

          if (!targetWorkspace) {
            throw new UsageError(
              `This command must be run from within a workspace or with the -w,--workspace flag`
            );
          }

          const report = await StreamReport.start(
            {
              configuration,
              json: this.json,
              stdout: this.context.stdout,
            },
            async (report) => {
              const fs = require('fs');
              const path = require('path');
              
              // Get all JS/TS files in the workspace
              const getAllFiles = (dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) => {
                const files = [];
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                  const fullPath = path.join(dir, entry.name);
                  if (entry.isDirectory()) {
                    // Skip node_modules and other special directories
                    if (entry.name !== 'node_modules' && entry.name !== '.git' && !entry.name.startsWith('.')) {
                      files.push(...getAllFiles(fullPath, extensions));
                    }
                  } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                  }
                }
                
                return files;
              };
              
              const files = getAllFiles(targetWorkspace.cwd);
              report.reportInfo(null, `Analyzing ${files.length} files in ${targetWorkspace.locator.name}`);
              
              // Extract imports from files
              const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
              const usedPackages = new Set();
              
              for (const file of files) {
                try {
                  const content = fs.readFileSync(file, 'utf8');
                  let match;
                  while ((match = importRegex.exec(content)) !== null) {
                    const importPath = match[1];
                    // Only consider package imports (not relative imports)
                    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                      // Extract the package name (before any path segments)
                      const packageName = importPath.startsWith('@')
                        ? importPath.split('/').slice(0, 2).join('/')
                        : importPath.split('/')[0];
                      usedPackages.add(packageName);
                    }
                  }
                } catch (error) {
                  report.reportWarning(
                    MessageName.UNNAMED,
                    `Error reading file ${file}: ${error.message}`
                  );
                }
              }
              
              // Check if all used packages are in dependencies
              const declaredDependencies = new Set();
              for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies']) {
                for (const name of targetWorkspace.manifest[dependencyType].keys()) {
                  declaredDependencies.add(name);
                }
              }
              
              // Check for workspace dependencies
              for (const workspace of project.workspaces) {
                if (workspace !== targetWorkspace) {
                  declaredDependencies.add(workspace.locator.name);
                }
              }
              
              // Find missing dependencies
              const missingDependencies = [];
              for (const pkg of usedPackages) {
                if (!declaredDependencies.has(pkg)) {
                  // Check if it's a built-in Node.js module
                  try {
                    require.resolve(pkg, { paths: [process.cwd()] });
                    // If we get here, it's a valid module, but check if it's built-in
                    const builtinModules = require('module').builtinModules || [];
                    if (!builtinModules.includes(pkg)) {
                      missingDependencies.push(pkg);
                    }
                  } catch (error) {
                    // Not a built-in module, so it's missing
                    missingDependencies.push(pkg);
                  }
                }
              }
              
              if (missingDependencies.length > 0) {
                report.reportError(
                  MessageName.MISSING_DEPENDENCY,
                  `Found ${missingDependencies.length} missing dependencies in ${targetWorkspace.locator.name}:\n${missingDependencies.map(dep => `  - ${dep}`).join('\n')}`
                );
                
                if (this.fix) {
                  report.reportInfo(null, `Adding missing dependencies to ${targetWorkspace.locator.name}`);
                  
                  for (const dep of missingDependencies) {
                    // Add as a regular dependency
                    targetWorkspace.manifest.dependencies.set(dep, structUtils.makeDescriptor(structUtils.parseIdent(dep), '^1.0.0'));
                  }
                  
                  // Save the changes
                  const manifestPath = path.join(targetWorkspace.cwd, 'package.json');
                  const manifestContent = JSON.stringify(targetWorkspace.manifest.raw, null, 2) + '\n';
                  fs.writeFileSync(manifestPath, manifestContent);
                  
                  report.reportInfo(null, `Added ${missingDependencies.length} dependencies to ${targetWorkspace.locator.name}`);
                  report.reportInfo(null, `Run 'yarn install' to install the new dependencies`);
                } else {
                  report.reportInfo(null, `Run with --fix to automatically add these dependencies`);
                }
              } else {
                report.reportInfo(null, `No missing dependencies found in ${targetWorkspace.locator.name}`);
              }
            }
          );

          return report.exitCode();
        }
      }

      // Add a command to standardize workspace configurations
      class WorkspacesStandardizeCommand extends BaseCommand {
        constructor() {
          super();
          this.json = Option.Boolean("-j,--json", false, {
            description: "Format the output as a JSON object",
          });
          this.dryRun = Option.Boolean("-d,--dry-run", false, {
            description: "Don't actually make any changes",
          });
        }

        async execute() {
          const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
          const { project } = await Project.find(configuration, this.context.cwd);

          const report = await StreamReport.start(
            {
              configuration,
              json: this.json,
              stdout: this.context.stdout,
            },
            async (report) => {
              // Define standard fields for package.json
              const standardFields = {
                author: "AUSTA Health",
                license: "UNLICENSED",
                private: true,
                repository: {
                  type: "git",
                  url: "https://github.com/austa/superapp.git",
                  directory: "", // Will be filled in per workspace
                },
                engines: {
                  node: ">=16.0.0",
                },
                packageManager: "yarn@3.6.1",
              };

              // Process each workspace
              for (const workspace of project.workspaces) {
                const manifest = workspace.manifest;
                let changed = false;

                // Set standard fields if missing
                for (const [key, value] of Object.entries(standardFields)) {
                  if (key === "repository" && manifest.raw[key]) {
                    // Special handling for repository to preserve the directory
                    const repo = {...value, directory: workspace.relativeCwd};
                    if (!isEqual(manifest.raw[key], repo)) {
                      report.reportInfo(null, `Updating repository field in ${workspace.locator.name}`);
                      manifest.raw[key] = repo;
                      changed = true;
                    }
                  } else if (!manifest.raw[key]) {
                    if (key === "repository") {
                      // Set directory for repository
                      const repo = {...value, directory: workspace.relativeCwd};
                      report.reportInfo(null, `Setting ${key} in ${workspace.locator.name}`);
                      manifest.raw[key] = repo;
                    } else {
                      report.reportInfo(null, `Setting ${key} in ${workspace.locator.name}`);
                      manifest.raw[key] = value;
                    }
                    changed = true;
                  }
                }

                // Ensure scripts section exists
                if (!manifest.raw.scripts) {
                  manifest.raw.scripts = {};
                  changed = true;
                }

                // Save changes if needed
                if (changed && !this.dryRun) {
                  const path = require('path');
                  const fs = require('fs');
                  const manifestPath = path.join(workspace.cwd, 'package.json');
                  const manifestContent = JSON.stringify(manifest.raw, null, 2) + '\n';
                  fs.writeFileSync(manifestPath, manifestContent);
                }
              }

              if (this.dryRun) {
                report.reportInfo(null, `Dry run completed. No changes were made.`);
              } else {
                report.reportInfo(null, `Standardized ${project.workspaces.length} workspaces.`);
              }
            }
          );

          return report.exitCode();
        }
      }

      // Register the commands
      WorkspacesFocusCommand.paths = [[`workspaces`, `focus`]];
      WorkspacesFocusCommand.usage = {
        description: "Focus on a subset of the workspaces in the project",
        details: `
          This command will modify the current project to make it think that it only contains the specified workspaces and their dependencies. This is useful for development, as it allows you to focus on a specific set of workspaces without having to worry about the others.\n\n
          If no workspaces are explicitly listed, the active one will be assumed.\n\n
          Note that this command is only very moderately useful when using zero-installs, since the cache will contain all the packages anyway - meaning that the only difference between a full install and a focused install would just be a few extra lines in the `.pnp.cjs` file, at the cost of introducing an extra complexity.\n\n
          If the `-A,--all` flag is set, the entire project will be installed. Combine with `--production` to replicate the old `yarn install --production`.\n
        `,
        examples: [
          ["Focus on a specific workspace and its dependencies", "yarn workspaces focus @austa/design-system"],
          ["Focus on multiple workspaces", "yarn workspaces focus @austa/design-system @austa/interfaces"],
          ["Focus on the current workspace", "yarn workspaces focus"],
          ["Focus on the entire project", "yarn workspaces focus --all"],
          ["Focus on production dependencies only", "yarn workspaces focus --production"],
        ],
      };

      WorkspacesForeachCommand.paths = [[`workspaces`, `foreach`]];
      WorkspacesForeachCommand.usage = {
        description: "Run a command on all workspaces",
        details: `
          This command will run a given sub-command on current and all its descendant workspaces. Various flags can alter the exact behavior of the command:\n\n
          - If `-p,--parallel` is set, the commands will be ran in parallel; they'll by default be limited to a number of parallel tasks roughly equal to half your core number, but that can be overridden via `-j,--jobs`, or disabled by setting `-j unlimited`.\n\n
          - If `-p,--parallel` and `-i,--interlaced` are both set, Yarn will print the lines from the output as it receives them. If `-i,--interlaced` wasn't set, it would instead buffer the output from each process and print the resulting buffers only after their source processes have exited.\n\n
          - If `-t,--topological` is set, Yarn will only run the command after all workspaces that it depends on through the `dependencies` field have successfully finished executing. If `--topological-dev` is set, both the `dependencies` and `devDependencies` fields will be considered when figuring out the wait points.\n\n
          - If `-A,--all` is set, Yarn will run the command on all workspaces of the project, regardless of whether they're ancestors of the current workspace or not.\n\n
          - If `-R,--recursive` is set, Yarn will find workspaces to run the command on by recursively evaluating `dependencies` and `devDependencies` fields, instead of looking at the `workspaces` fields.\n\n
          - If `--from` is set, Yarn will use the packages matching the 'from' glob as the starting point for any recursive search.\n\n
          - If `--since` is set, Yarn will only run the command on workspaces that have been modified since the specified ref. By default Yarn will use the refs specified by the `changesetBaseRefs` configuration option.\n\n
          - The command may apply to only some workspaces through the use of `--include` which acts as a whitelist. The `--exclude` flag will do the opposite and will be a list of packages that mustn't execute the script.\n\n
          Both flags accept glob patterns (if valid Idents and supported by [micromatch](https://github.com/micromatch/micromatch)). Make sure to escape the patterns, to prevent your own shell from trying to expand them.\n\n
          Adding the `-v,--verbose` flag will cause Yarn to print more information; in particular the name of the workspace that generated the output will be printed at the front of each line.\n\n
          If the command is `run` and the script being run does not exist the child workspace will be skipped without error.\n
        `,
        examples: [
          ["Run build script on current and all descendant workspaces", "yarn workspaces foreach run build"],
          ["Run build script on current and all descendant workspaces in parallel, building package dependencies first", "yarn workspaces foreach -pt run build"],
          ["Run build script on all workspaces in parallel, building package dependencies first", "yarn workspaces foreach -ptA run build"],
          ["Run build script on all workspaces that have changed since main", "yarn workspaces foreach -ptA --since=main run build"],
          ["Run build script on all workspaces except design-system", "yarn workspaces foreach -ptA --exclude @austa/design-system run build"],
          ["Run build script on all workspaces in the @austa scope", "yarn workspaces foreach -ptA --include '@austa/*' run build"],
        ],
      };

      WorkspacesValidateCommand.paths = [[`workspaces`, `validate`]];
      WorkspacesValidateCommand.usage = {
        description: "Validate workspace dependencies and structure",
        details: `
          This command will analyze the workspace structure and dependencies to identify potential issues:\n\n
          - Circular dependencies between workspaces
          - Inconsistent dependency versions across workspaces
          - Missing peer dependencies
          - Duplicate dependencies
          - Other structural issues\n\n
          This is particularly useful for the AUSTA SuperApp monorepo to ensure consistency across all workspaces and journeys.\n
        `,
        examples: [
          ["Validate all workspaces", "yarn workspaces validate"],
          ["Output validation results as JSON", "yarn workspaces validate --json"],
        ],
      };

      WorkspacesStandardizeCommand.paths = [[`workspaces`, `standardize`]];
      WorkspacesStandardizeCommand.usage = {
        description: "Standardize workspace package.json configurations",
        details: `
          This command will standardize the package.json files across all workspaces to ensure consistency:\n\n
          - Set standard fields like author, license, repository, etc.
          - Ensure consistent engine requirements
          - Standardize script names and configurations\n\n
          This helps maintain consistency across the AUSTA SuperApp monorepo and prevents configuration drift between workspaces.\n\n
          Use the --dry-run flag to see what changes would be made without actually making them.\n
        `,
        examples: [
          ["Standardize all workspaces", "yarn workspaces standardize"],
          ["Preview standardization changes without applying them", "yarn workspaces standardize --dry-run"],
          ["Output standardization results as JSON", "yarn workspaces standardize --json"],
        ],
      };

      WorkspacesDependencyCheckCommand.paths = [[`workspaces`, `check-deps`]];
      WorkspacesDependencyCheckCommand.usage = {
        description: "Check for missing dependencies in workspaces",
        details: `
          This command analyzes the source code in a workspace to identify imports that don't have corresponding dependencies declared in package.json.\n\n
          It scans all JavaScript and TypeScript files in the workspace, extracts import statements, and compares them against the dependencies listed in package.json.\n\n
          This is particularly useful for the AUSTA SuperApp monorepo to ensure all dependencies are properly declared, addressing the issue of missing dependencies required by the mobile app and other services.\n\n
          Use the --fix flag to automatically add missing dependencies to package.json.\n
        `,
        examples: [
          ["Check dependencies in the current workspace", "yarn workspaces check-deps"],
          ["Check dependencies in a specific workspace", "yarn workspaces check-deps --workspace @austa/design-system"],
          ["Automatically add missing dependencies", "yarn workspaces check-deps --fix"],
          ["Output results as JSON", "yarn workspaces check-deps --json"],
        ],
      };

      // Export the plugin
      return {
        commands: [
          WorkspacesFocusCommand,
          WorkspacesForeachCommand,
          WorkspacesValidateCommand,
          WorkspacesStandardizeCommand,
          WorkspacesDependencyCheckCommand,
        ],
      };
    })();

    return plugin;
  },
};