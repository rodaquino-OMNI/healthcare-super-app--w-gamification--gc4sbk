/* eslint-disable */

/**
 * @license
 * MIT License
 *
 * Copyright (c) 2023 AUSTA SuperApp
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

module.exports = {
  name: '@yarnpkg/plugin-version',
  factory: require => {
    const {BaseCommand} = require('@yarnpkg/cli');
    const {Option, Command, UsageError} = require('clipanion');
    const {Configuration, Project, StreamReport, MessageName, formatUtils, structUtils, semverUtils} = require('@yarnpkg/core');
    const {execUtils, scriptUtils, formatUtils: miscFormatUtils, httpUtils} = require('@yarnpkg/core');
    const {ppath, xfs, Filename} = require('@yarnpkg/fslib');
    const {parseSyml, stringifySyml} = require('@yarnpkg/parsers');
    const {Hooks: CoreHooks} = require('@yarnpkg/plugin-essentials');
    const {Hooks: PackHooks} = require('@yarnpkg/plugin-pack');
    const {Hooks: PatchHooks} = require('@yarnpkg/plugin-patch');
    const {Hooks: StageHooks} = require('@yarnpkg/plugin-stage');
    const {Hooks: WorkspacesHooks} = require('@yarnpkg/plugin-workspace-tools');
    
    const {promises: {writeFile}} = require('fs');
    const {EOL} = require('os');
    const {resolve, dirname, relative, posix: {join: posixJoin, dirname: posixDirname}} = require('path');
    const semver = require('semver');
    
    // Constants for version management
    const VERSIONING_FOLDER = '.yarn/versions';
    const CHANGELOG_FILENAME = 'CHANGELOG.md';
    const CORE_PACKAGES_WITH_CONFLICTS = ['minimatch', 'semver', 'ws'];
    const REACT_NATIVE_PACKAGES = [
      'react-native',
      '@react-native-community/cli',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'react-native-screens',
      'react-native-safe-area-context',
      '@react-navigation/native',
      '@react-navigation/stack'
    ];
    
    /**
     * Utility to get all workspaces in the project
     */
    const getAllWorkspaces = (project) => {
      const workspaces = [];
      for (const workspace of project.workspaces) {
        workspaces.push(workspace);
      }
      return workspaces;
    };
    
    /**
     * Utility to get the version file path for a workspace
     */
    const getVersionFilePath = (project, workspace) => {
      const ident = structUtils.stringifyIdent(workspace.manifest.name);
      const hash = miscFormatUtils.hash(ident).slice(0, 8);
      const versionFile = `${hash}.yml`;
      return ppath.join(project.cwd, VERSIONING_FOLDER, versionFile);
    };
    
    /**
     * Utility to parse a version file
     */
    const parseVersionFile = async (path) => {
      try {
        const content = await xfs.readFilePromise(path, 'utf8');
        return parseSyml(content);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {};
        } else {
          throw error;
        }
      }
    };
    
    /**
     * Utility to write a version file
     */
    const writeVersionFile = async (path, data) => {
      await xfs.mkdirpPromise(ppath.dirname(path));
      await xfs.writeFilePromise(path, stringifySyml(data));
    };
    
    /**
     * Utility to generate a changelog entry
     */
    const generateChangelogEntry = (version, changes) => {
      const date = new Date().toISOString().slice(0, 10);
      let entry = `## ${version} (${date})\n\n`;
      
      if (changes.features && changes.features.length > 0) {
        entry += '### Features\n\n';
        for (const feature of changes.features) {
          entry += `- ${feature}\n`;
        }
        entry += '\n';
      }
      
      if (changes.fixes && changes.fixes.length > 0) {
        entry += '### Bug Fixes\n\n';
        for (const fix of changes.fixes) {
          entry += `- ${fix}\n`;
        }
        entry += '\n';
      }
      
      if (changes.dependencies && changes.dependencies.length > 0) {
        entry += '### Dependencies\n\n';
        for (const dep of changes.dependencies) {
          entry += `- ${dep}\n`;
        }
        entry += '\n';
      }
      
      return entry;
    };
    
    /**
     * Utility to update a changelog file
     */
    const updateChangelog = async (workspacePath, version, changes) => {
      const changelogPath = ppath.join(workspacePath, CHANGELOG_FILENAME);
      let content = '';
      
      try {
        content = await xfs.readFilePromise(changelogPath, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // If the file doesn't exist, create it with a header
        content = '# Changelog\n\n';
      }
      
      const entry = generateChangelogEntry(version, changes);
      const [header, ...rest] = content.split('## ');
      content = header + entry + (rest.length > 0 ? '## ' + rest.join('## ') : '');
      
      await xfs.writeFilePromise(changelogPath, content);
    };
    
    /**
     * Utility to check for version conflicts in dependencies
     */
    const checkVersionConflicts = (project, report) => {
      const dependencyVersions = new Map();
      const conflicts = new Map();
      
      // Collect all dependency versions across workspaces
      for (const workspace of project.workspaces) {
        const dependencies = new Map([
          ...workspace.manifest.dependencies,
          ...workspace.manifest.devDependencies
        ]);
        
        for (const [identHash, descriptor] of dependencies) {
          const stringifiedIdent = structUtils.stringifyIdent(structUtils.parseIdent(identHash));
          
          if (!dependencyVersions.has(stringifiedIdent)) {
            dependencyVersions.set(stringifiedIdent, new Map());
          }
          
          const versions = dependencyVersions.get(stringifiedIdent);
          const range = descriptor.range;
          
          if (!versions.has(range)) {
            versions.set(range, []);
          }
          
          versions.get(range).push(workspace);
        }
      }
      
      // Check for conflicts
      for (const [dependency, versions] of dependencyVersions) {
        if (versions.size > 1) {
          conflicts.set(dependency, versions);
        }
      }
      
      // Report conflicts
      if (conflicts.size > 0) {
        report.reportInfo(MessageName.UNNAMED, `Found ${conflicts.size} dependencies with version conflicts`);
        
        for (const [dependency, versions] of conflicts) {
          report.reportInfo(MessageName.UNNAMED, `${formatUtils.pretty(report.configuration, dependency, 'magenta')} has ${versions.size} different version requirements:`);
          
          for (const [range, workspaces] of versions) {
            const workspaceNames = workspaces.map(workspace => 
              formatUtils.pretty(report.configuration, structUtils.stringifyIdent(workspace.manifest.name), 'cyan')
            ).join(', ');
            
            report.reportInfo(MessageName.UNNAMED, `  ${formatUtils.pretty(report.configuration, range, 'yellow')} required by ${workspaceNames}`);
          }
        }
      } else {
        report.reportInfo(MessageName.UNNAMED, 'No version conflicts found');
      }
      
      return conflicts;
    };
    
    /**
     * Utility to enforce consistent versions for specific packages
     */
    const enforceConsistentVersions = async (project, report, specificPackages = []) => {
      const conflicts = checkVersionConflicts(project, report);
      let fixedConflicts = 0;
      
      for (const [dependency, versions] of conflicts) {
        // Only process specific packages if provided
        if (specificPackages.length > 0 && !specificPackages.includes(dependency)) {
          continue;
        }
        
        // Find the highest version range
        let highestRange = null;
        let highestVersion = null;
        
        for (const range of versions.keys()) {
          // Skip workspace: protocol
          if (range.startsWith('workspace:')) {
            continue;
          }
          
          // Parse the range to get the version
          const parsedRange = semverUtils.parseRange(range);
          if (!parsedRange) continue;
          
          const version = parsedRange.selector;
          if (!version) continue;
          
          if (!highestVersion || semver.gt(version, highestVersion)) {
            highestVersion = version;
            highestRange = range;
          }
        }
        
        if (highestRange) {
          report.reportInfo(MessageName.UNNAMED, `Enforcing ${formatUtils.pretty(report.configuration, dependency, 'magenta')} to use version ${formatUtils.pretty(report.configuration, highestRange, 'green')}`);
          
          // Update all workspaces to use the highest version
          for (const [range, workspaces] of versions) {
            if (range !== highestRange) {
              for (const workspace of workspaces) {
                const stringifiedIdent = structUtils.stringifyIdent(structUtils.parseIdent(dependency));
                const descriptor = structUtils.makeDescriptor(structUtils.parseIdent(dependency), highestRange);
                
                // Update dependencies
                if (workspace.manifest.dependencies.has(dependency)) {
                  workspace.manifest.dependencies.set(dependency, descriptor);
                }
                
                // Update devDependencies
                if (workspace.manifest.devDependencies.has(dependency)) {
                  workspace.manifest.devDependencies.set(dependency, descriptor);
                }
                
                fixedConflicts++;
              }
            }
          }
        }
      }
      
      if (fixedConflicts > 0) {
        report.reportInfo(MessageName.UNNAMED, `Fixed ${fixedConflicts} version conflicts`);
      }
      
      return fixedConflicts;
    };
    
    /**
     * Command to check for version conflicts
     */
    class VersionCheckCommand extends BaseCommand {
      static paths = [['version', 'check']];
      
      static usage = Command.Usage({
        description: 'Check for version conflicts across workspaces',
        details: 'This command analyzes all workspaces and reports any dependency version conflicts.',
        examples: [['Check for version conflicts', 'yarn version check']],
      });
      
      interactive = Option.Boolean('-i,--interactive', false, {
        description: 'Run in interactive mode to select version changes',
      });
      
      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project} = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
          includeLogs: true,
        }, async (report) => {
          if (this.interactive) {
            // Interactive mode implementation would go here
            // This would involve showing a UI to select version changes
            report.reportInfo(MessageName.UNNAMED, 'Interactive mode not fully implemented yet');
          } else {
            checkVersionConflicts(project, report);
          }
        });
        
        return report.exitCode();
      }
    }
    
    /**
     * Command to fix version conflicts
     */
    class VersionFixCommand extends BaseCommand {
      static paths = [['version', 'fix']];
      
      static usage = Command.Usage({
        description: 'Fix version conflicts across workspaces',
        details: 'This command analyzes all workspaces and fixes any dependency version conflicts by enforcing consistent versions.',
        examples: [['Fix all version conflicts', 'yarn version fix']],
      });
      
      coreOnly = Option.Boolean('--core-only', false, {
        description: 'Only fix conflicts in core packages (minimatch, semver, ws)',
      });
      
      reactNativeOnly = Option.Boolean('--react-native-only', false, {
        description: 'Only fix conflicts in React Native packages',
      });
      
      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project} = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
          includeLogs: true,
        }, async (report) => {
          let packagesToFix = [];
          
          if (this.coreOnly) {
            packagesToFix = CORE_PACKAGES_WITH_CONFLICTS;
            report.reportInfo(MessageName.UNNAMED, 'Fixing conflicts in core packages only');
          } else if (this.reactNativeOnly) {
            packagesToFix = REACT_NATIVE_PACKAGES;
            report.reportInfo(MessageName.UNNAMED, 'Fixing conflicts in React Native packages only');
          }
          
          const fixedConflicts = await enforceConsistentVersions(project, report, packagesToFix);
          
          if (fixedConflicts > 0) {
            await project.persistManifest();
          }
        });
        
        return report.exitCode();
      }
    }
    
    /**
     * Command to bump versions and generate changelogs
     */
    class VersionBumpCommand extends BaseCommand {
      static paths = [['version', 'bump']];
      
      static usage = Command.Usage({
        description: 'Bump package versions and generate changelogs',
        details: 'This command bumps the version of the specified workspaces and generates changelog entries.',
        examples: [['Bump the version of the current workspace', 'yarn version bump patch']],
      });
      
      workspaces = Option.Rest();
      
      releaseType = Option.String({
        required: true,
        description: 'Release type (patch, minor, major, or specific version)',
      });
      
      message = Option.String('-m,--message', {
        description: 'Message to use for the changelog entry',
      });
      
      deferred = Option.Boolean('-d,--deferred', false, {
        description: 'Defer the version bump until the next release',
      });
      
      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project, workspace: cwdWorkspace} = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
          includeLogs: true,
        }, async (report) => {
          // Determine which workspaces to bump
          let targetWorkspaces = [];
          
          if (this.workspaces.length === 0) {
            // If no workspaces specified, use the current one
            targetWorkspaces = [cwdWorkspace];
          } else {
            // Find the specified workspaces
            for (const workspaceName of this.workspaces) {
              const workspace = project.getWorkspaceByIdent(structUtils.parseIdent(workspaceName));
              if (workspace) {
                targetWorkspaces.push(workspace);
              } else {
                report.reportError(MessageName.UNNAMED, `Workspace ${workspaceName} not found`);
              }
            }
          }
          
          if (targetWorkspaces.length === 0) {
            report.reportError(MessageName.UNNAMED, 'No workspaces to bump');
            return;
          }
          
          // Process each workspace
          for (const workspace of targetWorkspaces) {
            const currentVersion = workspace.manifest.version || '0.0.0';
            let newVersion;
            
            // Determine the new version
            if (semver.valid(this.releaseType)) {
              newVersion = this.releaseType;
            } else {
              newVersion = semver.inc(currentVersion, this.releaseType);
              if (!newVersion) {
                report.reportError(MessageName.UNNAMED, `Invalid release type: ${this.releaseType}`);
                continue;
              }
            }
            
            const workspaceName = structUtils.stringifyIdent(workspace.manifest.name);
            
            if (this.deferred) {
              // Store the version bump for later
              const versionFile = getVersionFilePath(project, workspace);
              const versionData = await parseVersionFile(versionFile);
              
              versionData.version = newVersion;
              if (this.message) {
                if (!versionData.changes) {
                  versionData.changes = {};
                }
                if (!versionData.changes.features) {
                  versionData.changes.features = [];
                }
                versionData.changes.features.push(this.message);
              }
              
              await writeVersionFile(versionFile, versionData);
              report.reportInfo(MessageName.UNNAMED, `Deferred version bump for ${formatUtils.pretty(configuration, workspaceName, 'cyan')} from ${formatUtils.pretty(configuration, currentVersion, 'yellow')} to ${formatUtils.pretty(configuration, newVersion, 'green')}`);
            } else {
              // Apply the version bump immediately
              workspace.manifest.version = newVersion;
              
              // Update the changelog
              const changes = {
                features: this.message ? [this.message] : [],
              };
              
              await updateChangelog(workspace.cwd, newVersion, changes);
              report.reportInfo(MessageName.UNNAMED, `Bumped ${formatUtils.pretty(configuration, workspaceName, 'cyan')} from ${formatUtils.pretty(configuration, currentVersion, 'yellow')} to ${formatUtils.pretty(configuration, newVersion, 'green')}`);
              
              // Update dependent workspaces
              for (const dependent of project.workspaces) {
                if (dependent === workspace) continue;
                
                const dependencies = new Map([
                  ...dependent.manifest.dependencies,
                  ...dependent.manifest.devDependencies
                ]);
                
                let updated = false;
                
                for (const [identHash, descriptor] of dependencies) {
                  const stringifiedIdent = structUtils.stringifyIdent(structUtils.parseIdent(identHash));
                  
                  if (stringifiedIdent === workspaceName) {
                    const range = descriptor.range;
                    
                    // Only update semver ranges, not workspace: protocol
                    if (!range.startsWith('workspace:')) {
                      const parsedRange = semverUtils.parseRange(range);
                      if (parsedRange && semver.satisfies(newVersion, range)) {
                        // The new version still satisfies the range, no need to update
                        continue;
                      }
                      
                      // Create a new range based on the old one
                      let newRange;
                      if (range.startsWith('^')) {
                        newRange = `^${newVersion}`;
                      } else if (range.startsWith('~')) {
                        newRange = `~${newVersion}`;
                      } else {
                        newRange = newVersion;
                      }
                      
                      const newDescriptor = structUtils.makeDescriptor(structUtils.parseIdent(identHash), newRange);
                      
                      // Update the dependency
                      if (dependent.manifest.dependencies.has(identHash)) {
                        dependent.manifest.dependencies.set(identHash, newDescriptor);
                        updated = true;
                      }
                      
                      if (dependent.manifest.devDependencies.has(identHash)) {
                        dependent.manifest.devDependencies.set(identHash, newDescriptor);
                        updated = true;
                      }
                    }
                  }
                }
                
                if (updated) {
                  const dependentName = structUtils.stringifyIdent(dependent.manifest.name);
                  report.reportInfo(MessageName.UNNAMED, `Updated ${formatUtils.pretty(configuration, dependentName, 'cyan')} to use the new version of ${formatUtils.pretty(configuration, workspaceName, 'magenta')}`);
                }
              }
            }
          }
          
          // Persist changes
          await project.persistManifest();
        });
        
        return report.exitCode();
      }
    }
    
    /**
     * Command to apply deferred version changes
     */
    class VersionApplyCommand extends BaseCommand {
      static paths = [['version', 'apply']];
      
      static usage = Command.Usage({
        description: 'Apply deferred version changes',
        details: 'This command applies all deferred version changes and generates changelogs.',
        examples: [['Apply all deferred version changes', 'yarn version apply']],
      });
      
      prerelease = Option.String('-p,--prerelease', {
        description: 'Prerelease identifier (e.g., alpha, beta)',
      });
      
      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project} = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
          includeLogs: true,
        }, async (report) => {
          const versioningFolder = ppath.join(project.cwd, VERSIONING_FOLDER);
          
          try {
            await xfs.mkdirpPromise(versioningFolder);
            const entries = await xfs.readdirPromise(versioningFolder);
            
            if (entries.length === 0) {
              report.reportInfo(MessageName.UNNAMED, 'No deferred version changes to apply');
              return;
            }
            
            // Process each version file
            for (const entry of entries) {
              if (!entry.endsWith('.yml')) continue;
              
              const versionFile = ppath.join(versioningFolder, entry);
              const versionData = await parseVersionFile(versionFile);
              
              if (!versionData.version) {
                report.reportWarning(MessageName.UNNAMED, `Version file ${entry} does not contain a version field`);
                continue;
              }
              
              // Find the workspace for this version file
              let targetWorkspace = null;
              
              for (const workspace of project.workspaces) {
                const workspaceVersionFile = getVersionFilePath(project, workspace);
                if (ppath.normalize(workspaceVersionFile) === ppath.normalize(versionFile)) {
                  targetWorkspace = workspace;
                  break;
                }
              }
              
              if (!targetWorkspace) {
                report.reportWarning(MessageName.UNNAMED, `Could not find workspace for version file ${entry}`);
                continue;
              }
              
              const workspaceName = structUtils.stringifyIdent(targetWorkspace.manifest.name);
              const currentVersion = targetWorkspace.manifest.version || '0.0.0';
              let newVersion = versionData.version;
              
              // Apply prerelease identifier if specified
              if (this.prerelease) {
                const parsed = semver.parse(newVersion);
                if (parsed) {
                  newVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}-${this.prerelease}.0`;
                }
              }
              
              // Apply the version change
              targetWorkspace.manifest.version = newVersion;
              
              // Update the changelog
              await updateChangelog(targetWorkspace.cwd, newVersion, versionData.changes || {});
              
              report.reportInfo(MessageName.UNNAMED, `Applied version bump for ${formatUtils.pretty(configuration, workspaceName, 'cyan')} from ${formatUtils.pretty(configuration, currentVersion, 'yellow')} to ${formatUtils.pretty(configuration, newVersion, 'green')}`);
              
              // Update dependent workspaces
              for (const dependent of project.workspaces) {
                if (dependent === targetWorkspace) continue;
                
                const dependencies = new Map([
                  ...dependent.manifest.dependencies,
                  ...dependent.manifest.devDependencies
                ]);
                
                let updated = false;
                
                for (const [identHash, descriptor] of dependencies) {
                  const stringifiedIdent = structUtils.stringifyIdent(structUtils.parseIdent(identHash));
                  
                  if (stringifiedIdent === workspaceName) {
                    const range = descriptor.range;
                    
                    // Only update semver ranges, not workspace: protocol
                    if (!range.startsWith('workspace:')) {
                      const parsedRange = semverUtils.parseRange(range);
                      if (parsedRange && semver.satisfies(newVersion, range)) {
                        // The new version still satisfies the range, no need to update
                        continue;
                      }
                      
                      // Create a new range based on the old one
                      let newRange;
                      if (range.startsWith('^')) {
                        newRange = `^${newVersion}`;
                      } else if (range.startsWith('~')) {
                        newRange = `~${newVersion}`;
                      } else {
                        newRange = newVersion;
                      }
                      
                      const newDescriptor = structUtils.makeDescriptor(structUtils.parseIdent(identHash), newRange);
                      
                      // Update the dependency
                      if (dependent.manifest.dependencies.has(identHash)) {
                        dependent.manifest.dependencies.set(identHash, newDescriptor);
                        updated = true;
                      }
                      
                      if (dependent.manifest.devDependencies.has(identHash)) {
                        dependent.manifest.devDependencies.set(identHash, newDescriptor);
                        updated = true;
                      }
                    }
                  }
                }
                
                if (updated) {
                  const dependentName = structUtils.stringifyIdent(dependent.manifest.name);
                  report.reportInfo(MessageName.UNNAMED, `Updated ${formatUtils.pretty(configuration, dependentName, 'cyan')} to use the new version of ${formatUtils.pretty(configuration, workspaceName, 'magenta')}`);
                }
              }
              
              // Delete the version file
              await xfs.unlinkPromise(versionFile);
            }
            
            // Persist changes
            await project.persistManifest();
          } catch (error) {
            report.reportError(MessageName.UNNAMED, `Error applying version changes: ${error.message}`);
          }
        });
        
        return report.exitCode();
      }
    }
    
    /**
     * Command to generate a changelog entry
     */
    class VersionChangelogCommand extends BaseCommand {
      static paths = [['version', 'changelog']];
      
      static usage = Command.Usage({
        description: 'Generate a changelog entry',
        details: 'This command generates a changelog entry for the specified version.',
        examples: [['Generate a changelog entry', 'yarn version changelog --feature "Added new feature"']],
      });
      
      version = Option.String('-v,--version', {
        description: 'Version to generate the changelog for (defaults to current version)',
      });
      
      feature = Option.Array('--feature', [], {
        description: 'Feature to add to the changelog',
      });
      
      fix = Option.Array('--fix', [], {
        description: 'Fix to add to the changelog',
      });
      
      dependency = Option.Array('--dependency', [], {
        description: 'Dependency update to add to the changelog',
      });
      
      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const {project, workspace} = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
          includeLogs: true,
        }, async (report) => {
          if (!workspace) {
            report.reportError(MessageName.UNNAMED, 'This command must be run within a workspace');
            return;
          }
          
          const version = this.version || workspace.manifest.version;
          if (!version) {
            report.reportError(MessageName.UNNAMED, 'No version specified and workspace does not have a version');
            return;
          }
          
          const changes = {
            features: this.feature,
            fixes: this.fix,
            dependencies: this.dependency,
          };
          
          await updateChangelog(workspace.cwd, version, changes);
          report.reportInfo(MessageName.UNNAMED, `Generated changelog entry for version ${formatUtils.pretty(configuration, version, 'green')}`);
        });
        
        return report.exitCode();
      }
    }
    
    /**
     * Hook to enforce consistent versions during install
     */
    const afterAllInstalled = async (project, opts) => {
      const configuration = project.configuration;
      
      const report = await StreamReport.start({
        configuration,
        stdout: opts.stdout || process.stdout,
        includeLogs: true,
      }, async (report) => {
        // Enforce consistent versions for core packages with conflicts
        await enforceConsistentVersions(project, report, CORE_PACKAGES_WITH_CONFLICTS);
        
        // Enforce consistent versions for React Native packages
        await enforceConsistentVersions(project, report, REACT_NATIVE_PACKAGES);
        
        // Persist changes
        await project.persistManifest();
      });
      
      return report.exitCode();
    };
    
    return {
      commands: [
        VersionCheckCommand,
        VersionFixCommand,
        VersionBumpCommand,
        VersionApplyCommand,
        VersionChangelogCommand,
      ],
      hooks: {
        afterAllInstalled,
      },
    };
  },
};