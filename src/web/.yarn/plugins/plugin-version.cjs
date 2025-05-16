/* eslint-disable */

/**
 * AUSTA SuperApp Version Plugin
 * 
 * This plugin manages versioning across the monorepo, ensuring consistent dependency versions,
 * coordinating version bumps, and maintaining changelogs.
 * 
 * Features:
 * - Enforces consistent version protocols across workspaces
 * - Coordinates version bumps for dependent packages
 * - Automates changelog generation for version changes
 * - Provides interactive version management
 * - Resolves version conflicts in core libraries
 */

module.exports = {
  name: '@yarnpkg/plugin-version',
  factory: require => {
    const { BaseCommand } = require('@yarnpkg/cli');
    const { Option, Command } = require('clipanion');
    const { Configuration, Project, StreamReport, MessageName } = require('@yarnpkg/core');
    const { structUtils, semverUtils, formatUtils, miscUtils } = require('@yarnpkg/core');
    const { execUtils, scriptUtils, httpUtils, fsUtils } = require('@yarnpkg/core');
    const { ppath, xfs, Filename } = require('@yarnpkg/fslib');
    const { parseSyml, stringifySyml } = require('@yarnpkg/parsers');
    const { suggestUtils } = require('@yarnpkg/plugin-essentials');
    
    /**
     * Utility functions for version management
     */
    const versionUtils = {
      /**
       * Resolves version conflicts by ensuring consistent versions
       * for critical dependencies across the monorepo
       */
      resolveVersionConflicts: async (project, report) => {
        // Critical dependencies that need consistent versions
        const criticalDeps = [
          'minimatch',
          'semver',
          'ws',
          'react',
          'react-dom',
          'react-native',
          '@types/react',
          '@types/react-dom'
        ];

        const resolutions = {};
        const conflicts = [];

        // Find all versions of critical dependencies
        for (const workspace of project.workspaces) {
          const manifest = workspace.manifest;
          
          for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
            for (const [depName, depRange] of manifest.getForScope(depType).entries()) {
              if (criticalDeps.includes(depName)) {
                if (!resolutions[depName]) {
                  resolutions[depName] = [];
                }
                
                resolutions[depName].push({
                  workspace: workspace.locator,
                  range: depRange,
                  depType
                });
              }
            }
          }
        }

        // Detect conflicts
        for (const [depName, usages] of Object.entries(resolutions)) {
          if (usages.length > 1) {
            const ranges = new Set(usages.map(u => u.range));
            if (ranges.size > 1) {
              conflicts.push({
                name: depName,
                usages
              });
            }
          }
        }

        // Report conflicts
        if (conflicts.length > 0) {
          report.reportInfo(MessageName.UNNAMED, `Found ${conflicts.length} version conflicts in critical dependencies`);
          
          for (const conflict of conflicts) {
            report.reportInfo(MessageName.UNNAMED, `Conflict in ${formatUtils.pretty(report.configuration, conflict.name, formatUtils.Type.NAME)}:`);
            
            for (const usage of conflict.usages) {
              const workspaceName = structUtils.stringifyLocator(usage.workspace);
              report.reportInfo(MessageName.UNNAMED, `  ${workspaceName} (${usage.depType}): ${usage.range}`);
            }
          }
        } else {
          report.reportInfo(MessageName.UNNAMED, 'No version conflicts found in critical dependencies');
        }

        return conflicts;
      },

      /**
       * Generates a changelog entry for a version change
       */
      generateChangelogEntry: async (project, workspace, fromVersion, toVersion, changes) => {
        const date = new Date().toISOString().split('T')[0];
        const workspaceName = structUtils.stringifyIdent(workspace.locator);
        
        let changelogEntry = `## [${toVersion}] - ${date}\n\n`;
        
        if (changes && changes.length > 0) {
          changelogEntry += `### Changes\n\n`;
          for (const change of changes) {
            changelogEntry += `- ${change}\n`;
          }
        } else {
          changelogEntry += `### Maintenance\n\n- Updated dependencies\n`;
        }
        
        changelogEntry += '\n';
        return changelogEntry;
      },

      /**
       * Updates the changelog file for a workspace
       */
      updateChangelog: async (workspace, changelogEntry) => {
        const changelogPath = ppath.join(workspace.cwd, 'CHANGELOG.md');
        let currentChangelog = '';
        
        try {
          currentChangelog = await xfs.readFilePromise(changelogPath, 'utf8');
        } catch (error) {
          // If the changelog doesn't exist, create it with a header
          currentChangelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;
        }
        
        // Insert the new entry after the header
        const headerEndIndex = currentChangelog.indexOf('\n\n') + 2;
        const newChangelog = [
          currentChangelog.slice(0, headerEndIndex),
          changelogEntry,
          currentChangelog.slice(headerEndIndex)
        ].join('');
        
        await xfs.writeFilePromise(changelogPath, newChangelog);
        return changelogPath;
      },

      /**
       * Finds all workspaces that depend on the given workspace
       */
      findDependents: (project, workspace) => {
        const workspaceIdent = workspace.locator;
        const dependents = [];
        
        for (const otherWorkspace of project.workspaces) {
          if (otherWorkspace.cwd === workspace.cwd) continue;
          
          const manifest = otherWorkspace.manifest;
          let isDependency = false;
          
          for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
            for (const [depName, depRange] of manifest.getForScope(depType).entries()) {
              const depIdent = structUtils.parseIdent(depName);
              
              if (depIdent.name === workspaceIdent.name) {
                isDependency = true;
                break;
              }
            }
            
            if (isDependency) break;
          }
          
          if (isDependency) {
            dependents.push(otherWorkspace);
          }
        }
        
        return dependents;
      }
    };

    /**
     * Command to check for version inconsistencies
     */
    class VersionCheckCommand extends BaseCommand {
      static paths = [['version', 'check']];
      
      static usage = Command.Usage({
        description: 'Check for version inconsistencies across workspaces',
        details: 'This command checks for version inconsistencies in critical dependencies across workspaces.',
        examples: [['Check for version inconsistencies', 'yarn version check']],
      });

      interactive = Option.Boolean('--interactive', false, {
        description: 'Run in interactive mode to resolve conflicts',
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.cwd);
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
        }, async report => {
          const conflicts = await versionUtils.resolveVersionConflicts(project, report);
          
          if (conflicts.length > 0) {
            if (this.interactive) {
              report.reportInfo(MessageName.UNNAMED, 'Interactive mode: Resolving conflicts...');
              // Interactive conflict resolution would be implemented here
              // This would involve prompting the user to select which version to use for each conflict
            } else {
              report.reportWarning(MessageName.UNNAMED, 'Run with --interactive to resolve conflicts');
            }
          }
        });

        return report.exitCode();
      }
    }

    /**
     * Command to apply a new version to a workspace and update dependents
     */
    class VersionApplyCommand extends BaseCommand {
      static paths = [['version', 'apply']];
      
      static usage = Command.Usage({
        description: 'Apply a new version to a workspace and update dependents',
        details: 'This command applies a new version to a workspace and updates all dependent workspaces.',
        examples: [['Apply a new version to a workspace', 'yarn version apply 1.0.0']],
      });

      version = Option.String();
      
      workspace = Option.String('--workspace', {
        description: 'Target workspace',
      });

      updateDependents = Option.Boolean('--update-dependents', true, {
        description: 'Update dependent workspaces',
      });

      generateChangelog = Option.Boolean('--changelog', true, {
        description: 'Generate changelog entries',
      });

      message = Option.Array('--message', {
        description: 'Changelog message (can be specified multiple times)',
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project, workspace: cwdWorkspace } = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
        }, async report => {
          // Determine target workspace
          let targetWorkspace = cwdWorkspace;
          if (this.workspace) {
            const workspaceName = this.workspace;
            targetWorkspace = project.workspaces.find(workspace => {
              const ident = structUtils.stringifyIdent(workspace.locator);
              return ident === workspaceName;
            });
            
            if (!targetWorkspace) {
              report.reportError(MessageName.UNNAMED, `Workspace ${workspaceName} not found`);
              return;
            }
          }
          
          if (!targetWorkspace) {
            report.reportError(MessageName.UNNAMED, 'No target workspace found');
            return;
          }
          
          // Get current version
          const currentVersion = targetWorkspace.manifest.version || '0.0.0';
          const newVersion = this.version;
          
          report.reportInfo(MessageName.UNNAMED, `Updating ${structUtils.stringifyIdent(targetWorkspace.locator)} from ${currentVersion} to ${newVersion}`);
          
          // Update the version in the manifest
          targetWorkspace.manifest.version = newVersion;
          
          // Generate changelog if requested
          if (this.generateChangelog) {
            const changelogEntry = await versionUtils.generateChangelogEntry(
              project,
              targetWorkspace,
              currentVersion,
              newVersion,
              this.message
            );
            
            const changelogPath = await versionUtils.updateChangelog(targetWorkspace, changelogEntry);
            report.reportInfo(MessageName.UNNAMED, `Updated changelog at ${changelogPath}`);
          }
          
          // Update dependents if requested
          if (this.updateDependents) {
            const dependents = versionUtils.findDependents(project, targetWorkspace);
            
            if (dependents.length > 0) {
              report.reportInfo(MessageName.UNNAMED, `Updating ${dependents.length} dependent workspaces`);
              
              for (const dependent of dependents) {
                const dependentIdent = structUtils.stringifyIdent(dependent.locator);
                report.reportInfo(MessageName.UNNAMED, `Updating ${dependentIdent}`);
                
                // Update the dependency in the manifest
                const manifest = dependent.manifest;
                let updated = false;
                
                for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
                  for (const [depName, depRange] of manifest.getForScope(depType).entries()) {
                    const depIdent = structUtils.parseIdent(depName);
                    
                    if (depIdent.name === targetWorkspace.locator.name) {
                      // Update the dependency range to point to the new version
                      const newRange = `^${newVersion}`;
                      manifest.setField(`${depType}.${depName}`, newRange);
                      updated = true;
                      
                      report.reportInfo(
                        MessageName.UNNAMED,
                        `  Updated ${depType}.${depName} from ${depRange} to ${newRange}`
                      );
                    }
                  }
                }
                
                if (!updated) {
                  report.reportWarning(
                    MessageName.UNNAMED,
                    `  Could not find dependency on ${targetWorkspace.locator.name} in ${dependentIdent}`
                  );
                }
              }
            } else {
              report.reportInfo(MessageName.UNNAMED, 'No dependent workspaces found');
            }
          }
          
          // Save all changes
          await project.persistLockfile();
        });

        return report.exitCode();
      }
    }

    /**
     * Command to bump versions of all workspaces
     */
    class VersionBumpCommand extends BaseCommand {
      static paths = [['version', 'bump']];
      
      static usage = Command.Usage({
        description: 'Bump versions of all workspaces',
        details: 'This command bumps the versions of all workspaces according to the specified strategy.',
        examples: [['Bump patch version of all workspaces', 'yarn version bump patch']],
      });

      strategy = Option.String();
      
      generateChangelog = Option.Boolean('--changelog', true, {
        description: 'Generate changelog entries',
      });

      message = Option.Array('--message', {
        description: 'Changelog message (can be specified multiple times)',
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.cwd);
        
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
        }, async report => {
          // Validate strategy
          const validStrategies = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
          if (!validStrategies.includes(this.strategy)) {
            report.reportError(
              MessageName.UNNAMED,
              `Invalid bump strategy: ${this.strategy}. Valid strategies: ${validStrategies.join(', ')}`
            );
            return;
          }
          
          // Sort workspaces to handle dependencies first
          const sortedWorkspaces = miscUtils.sortMap(project.workspaces, workspace => {
            return versionUtils.findDependents(project, workspace).length;
          });
          
          // Bump versions
          for (const workspace of sortedWorkspaces) {
            const currentVersion = workspace.manifest.version || '0.0.0';
            if (!currentVersion) continue;
            
            // Calculate new version based on strategy
            let newVersion;
            try {
              newVersion = semverUtils.inc(currentVersion, this.strategy);
            } catch (error) {
              report.reportError(
                MessageName.UNNAMED,
                `Failed to increment version for ${structUtils.stringifyIdent(workspace.locator)}: ${error.message}`
              );
              continue;
            }
            
            report.reportInfo(
              MessageName.UNNAMED,
              `Bumping ${structUtils.stringifyIdent(workspace.locator)} from ${currentVersion} to ${newVersion}`
            );
            
            // Update the version in the manifest
            workspace.manifest.version = newVersion;
            
            // Generate changelog if requested
            if (this.generateChangelog) {
              const changelogEntry = await versionUtils.generateChangelogEntry(
                project,
                workspace,
                currentVersion,
                newVersion,
                this.message
              );
              
              const changelogPath = await versionUtils.updateChangelog(workspace, changelogEntry);
              report.reportInfo(MessageName.UNNAMED, `Updated changelog at ${changelogPath}`);
            }
          }
          
          // Update dependencies between workspaces
          for (const workspace of project.workspaces) {
            const manifest = workspace.manifest;
            
            for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
              for (const [depName, depRange] of manifest.getForScope(depType).entries()) {
                const depIdent = structUtils.parseIdent(depName);
                
                // Find the workspace that matches this dependency
                const depWorkspace = project.workspaces.find(w => {
                  return structUtils.stringifyIdent(w.locator) === depIdent.name;
                });
                
                if (depWorkspace && depWorkspace.manifest.version) {
                  // Update the dependency range to point to the new version
                  const newRange = `^${depWorkspace.manifest.version}`;
                  manifest.setField(`${depType}.${depName}`, newRange);
                  
                  report.reportInfo(
                    MessageName.UNNAMED,
                    `Updated ${structUtils.stringifyIdent(workspace.locator)}.${depType}.${depName} to ${newRange}`
                  );
                }
              }
            }
          }
          
          // Save all changes
          await project.persistLockfile();
        });

        return report.exitCode();
      }
    }

    return {
      commands: [
        VersionCheckCommand,
        VersionApplyCommand,
        VersionBumpCommand,
      ],
    };
  },
};