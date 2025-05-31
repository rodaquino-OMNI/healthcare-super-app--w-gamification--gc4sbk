/* eslint-disable */
// @ts-nocheck

/**
 * AUSTA SuperApp Yarn Workspace Tools Plugin
 * 
 * This plugin enhances Yarn's workspace management capabilities for the AUSTA SuperApp monorepo,
 * providing tools to work with workspaces, run commands across workspaces, and manage dependencies
 * between workspaces.
 * 
 * Key features:
 * - Workspace-focused commands for dependency management
 * - Cross-workspace operations for consistent builds
 * - Enhanced monorepo workspace coordination
 * - Standardized package.json configurations across workspaces
 * 
 * This plugin addresses the following requirements from the technical specification:
 * - Inconsistent workspace paths and duplicate packages in Monorepo Structure
 * - Missing dependencies required by mobile app and other services
 * - Standard package.json configurations across workspaces
 */

module.exports = {
  name: "@yarnpkg/plugin-workspace-tools",
  factory: function (require) {
    const { BaseCommand } = require('@yarnpkg/cli');
    const { Option, Command } = require('clipanion');
    const { Configuration, Project, StreamReport, Workspace } = require('@yarnpkg/core');
    const { structUtils, formatUtils, semverUtils, miscUtils } = require('@yarnpkg/core');
    const { execUtils, scriptUtils, formatUtils: { Type, Style } } = require('@yarnpkg/core');
    const { npath, ppath, xfs, Filename } = require('@yarnpkg/fslib');
    const { getPluginConfiguration } = require('@yarnpkg/plugin-git');
    const { isCI } = require('@yarnpkg/core/lib/misc/ci');
    const os = require('os');
    const cp = require('child_process');
    const t = require('typanion');

    /**
     * WorkspacesForeachCommand
     * 
     * Runs a command in each workspace of a project, respecting inter-workspace dependencies
     */
    class WorkspacesForeachCommand extends BaseCommand {
      constructor() {
        super();
        
        this.recursive = Option.Boolean('-R,--recursive', false, {
          description: 'Find packages via dependencies/devDependencies instead of using the workspaces field',
        });

        this.all = Option.Boolean('-A,--all', false, {
          description: 'Run the command on all workspaces of a project',
        });

        this.verbose = Option.Boolean('-v,--verbose', false, {
          description: 'Verbose output',
        });

        this.parallel = Option.Boolean('-p,--parallel', false, {
          description: 'Run the commands in parallel',
        });

        this.interlaced = Option.Boolean('-i,--interlaced', false, {
          description: 'Print the output of commands in real-time instead of buffering it',
        });

        this.topological = Option.Boolean('-t,--topological', false, {
          description: 'Run the command after all workspaces it depends on have finished',
        });

        this.topologicalDev = Option.Boolean('--topological-dev', false, {
          description: 'Run the command after all workspaces it depends on, including dev dependencies, have finished',
        });

        this.jobs = Option.String('-j,--jobs', {
          description: 'The maximum number of parallel tasks that can be run (or "unlimited")',
          validator: t.isOneOf([t.isString(), t.isNumber()]),
        });

        this.include = Option.Array('--include', [], {
          description: 'An array of glob pattern of workspaces to include',
        });

        this.exclude = Option.Array('--exclude', [], {
          description: 'An array of glob pattern of workspaces to exclude',
        });

        this.since = Option.String('--since', {
          description: 'Only include workspaces that have been changed since the specified ref',
        });

        this.commandName = Option.String({
          name: 'commandName',
          required: true,
        });

        this.args = Option.Proxy();
      }

      static usage = Command.Usage({
        category: 'Workspace-related commands',
        description: 'Run a command on all workspaces',
        details: `
          This command will run a given sub-command on current and all its descendant workspaces. Various flags can alter the exact behavior of the command:

          - If `-A,--all` is set, the command will be run on all workspaces in the project, regardless of their location in the workspace tree.

          - If `-p,--parallel` is set, the commands will be run in parallel; they'll by default be limited to a number of parallel tasks roughly equal to half your core number, but that can be overridden via `-j,--jobs`.

          - If `-p,--parallel` and `-i,--interlaced` are both set, Yarn will print the lines from the output as it receives them. If `-i,--interlaced` wasn't set, it would instead buffer the output from each process and print the resulting buffers only after their source processes have exited.

          - If `-t,--topological` is set, Yarn will only run the command after all workspaces that it depends on through the `dependencies` field have successfully finished executing. If `--topological-dev` is set, both the `dependencies` and `devDependencies` fields will be considered when figuring out the wait points.

          - If `-R,--recursive` is set, Yarn will find workspaces to run the command on by recursively evaluating `dependencies` and `devDependencies` fields, instead of looking at the `workspaces` fields.

          - The command may apply to only some workspaces through the use of `--include` which acts as a whitelist. The `--exclude` flag will do the opposite and will be a list of packages that mustn't execute the script.

          - If `--since` is set, Yarn will only run the command on workspaces that have been changed since the specified ref. By default Yarn will use the git HEAD.
        `,
        examples: [[
          'Run build script on all workspaces',
          'yarn workspaces foreach run build',
        ], [
          'Run build script on all workspaces in parallel, with up to 3 processes at the same time',
          'yarn workspaces foreach -p -j 3 run build',
        ], [
          'Run build script on all workspaces that have been changed since the main branch',
          'yarn workspaces foreach --since main run build',
        ]],
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project, workspace: cwdWorkspace } = await Project.find(configuration, this.context.cwd);
        const cache = await miscUtils.fetchWithCache(project.configuration, async () => {
          return {};
        });

        if (!this.all && !cwdWorkspace) {
          throw new Error(`Workspaces can only be found within a workspace`)
        }

        const command = this.commandName;
        const args = this.args;

        const scriptName = command === 'run' 
          ? args[0] 
          : null;

        const workspaces = await this.getWorkspaces(project, cwdWorkspace);

        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
        }, async (report) => {
          if (workspaces.length === 0) {
            report.reportInfo(null, `No workspaces match the specified criteria`);
            return;
          }

          const needsProcessing = new Map();
          const processing = new Set();
          const workspaceMap = new Map(workspaces.map(workspace => [workspace.anchoredLocator.locatorHash, workspace]));

          for (const workspace of workspaces) {
            needsProcessing.set(workspace.anchoredLocator.locatorHash, new Set());
          }

          const runCommand = async (workspace, { commandIndex = 0 }) => {
            if (!this.parallel && commandIndex > 0) {
              return;
            }

            const ident = structUtils.convertToIdent(workspace.anchoredLocator);
            const title = structUtils.stringifyIdent(ident);

            report.reportInfo(null, `Processing workspace ${formatUtils.pretty(configuration, title, formatUtils.Type.IDENT)}`);

            try {
              await scriptUtils.executePackageScript(workspace, command, args, {
                cwd: workspace.cwd,
                project,
                stdin: this.context.stdin,
                stdout: this.context.stdout,
                stderr: this.context.stderr,
              });

              processing.delete(workspace.anchoredLocator.locatorHash);

              for (const [workspaceHash, dependencies] of needsProcessing) {
                dependencies.delete(workspace.anchoredLocator.locatorHash);
                if (dependencies.size === 0) {
                  const dependentWorkspace = workspaceMap.get(workspaceHash);
                  processing.add(workspaceHash);
                  runCommand(dependentWorkspace, { commandIndex: commandIndex + 1 });
                }
              }
            } catch (error) {
              report.reportError(null, `Workspace ${formatUtils.pretty(configuration, title, formatUtils.Type.IDENT)} failed with error: ${error.message}`);
              throw error;
            }
          };

          // If topological, build the dependency graph and execute in order
          if (this.topological || this.topologicalDev) {
            for (const workspace of workspaces) {
              const dependencies = needsProcessing.get(workspace.anchoredLocator.locatorHash);
              
              for (const dependencyType of this.topologicalDev ? ['dependencies', 'devDependencies'] : ['dependencies']) {
                const dependencySet = workspace.manifest.getForScope(dependencyType);
                
                for (const [identHash, reference] of dependencySet.values()) {
                  const depLocatorHash = structUtils.makeLocator(identHash, reference).locatorHash;
                  
                  if (workspaceMap.has(depLocatorHash)) {
                    dependencies.add(depLocatorHash);
                  }
                }
              }

              if (dependencies.size === 0) {
                processing.add(workspace.anchoredLocator.locatorHash);
                runCommand(workspace, { commandIndex: 0 });
              }
            }
          } else if (this.parallel) {
            // If parallel, run all commands at once
            const limit = this.jobs 
              ? this.jobs === 'unlimited' 
                ? Infinity 
                : parseInt(this.jobs) 
              : Math.max(1, Math.ceil(os.cpus().length / 2));

            const promises = [];
            let commandIndex = 0;

            for (const workspace of workspaces) {
              if (promises.length < limit) {
                processing.add(workspace.anchoredLocator.locatorHash);
                promises.push(runCommand(workspace, { commandIndex: commandIndex++ }));
              } else {
                await Promise.race(promises);
                processing.add(workspace.anchoredLocator.locatorHash);
                promises.push(runCommand(workspace, { commandIndex: commandIndex++ }));
              }
            }

            await Promise.all(promises);
          } else {
            // Otherwise, run commands sequentially
            for (const workspace of workspaces) {
              processing.add(workspace.anchoredLocator.locatorHash);
              await runCommand(workspace, { commandIndex: 0 });
            }
          }
        });

        return report.exitCode();
      }

      async getWorkspaces(project, cwdWorkspace) {
        const workspaces = [];

        // Get all workspaces in the project
        const allWorkspaces = project.workspaces;

        // If --since is set, filter workspaces by git changes
        if (this.since) {
          const gitWorkspaces = new Set();
          const pluginConfiguration = getPluginConfiguration();
          const git = await pluginConfiguration.gitUtils;

          const changedFiles = await git.fetchChangedFilesSince(this.since, {
            cwd: project.cwd,
            project,
          });

          for (const workspace of allWorkspaces) {
            const relativeCwd = ppath.relative(project.cwd, workspace.cwd);
            const prefix = relativeCwd === '' ? '' : `${relativeCwd}/`;

            if (changedFiles.some(file => file.startsWith(prefix))) {
              gitWorkspaces.add(workspace);
            }
          }

          // Only include workspaces that have changed
          for (const workspace of allWorkspaces) {
            if (gitWorkspaces.has(workspace)) {
              workspaces.push(workspace);
            }
          }
        } else if (this.recursive) {
          // If --recursive is set, find workspaces by dependencies
          const seen = new Set();
          const process = (workspace) => {
            if (seen.has(workspace.anchoredLocator.locatorHash)) {
              return;
            }

            seen.add(workspace.anchoredLocator.locatorHash);
            workspaces.push(workspace);

            const dependencies = workspace.manifest.getForScope('dependencies');
            const devDependencies = workspace.manifest.getForScope('devDependencies');

            for (const [identHash, reference] of [...dependencies.values(), ...devDependencies.values()]) {
              const locatorHash = structUtils.makeLocator(identHash, reference).locatorHash;
              const dependency = project.workspacesByLocator.get(locatorHash);

              if (dependency) {
                process(dependency);
              }
            }
          };

          if (this.all) {
            for (const workspace of allWorkspaces) {
              process(workspace);
            }
          } else {
            process(cwdWorkspace);
          }
        } else if (this.all) {
          // If --all is set, include all workspaces
          workspaces.push(...allWorkspaces);
        } else {
          // Otherwise, include the current workspace and its descendants
          const seen = new Set();
          const process = (workspace) => {
            if (seen.has(workspace.anchoredLocator.locatorHash)) {
              return;
            }

            seen.add(workspace.anchoredLocator.locatorHash);
            workspaces.push(workspace);

            for (const child of project.workspaces) {
              const relativePath = ppath.relative(workspace.cwd, child.cwd);
              if (!relativePath.startsWith('..') && relativePath !== '') {
                process(child);
              }
            }
          };

          process(cwdWorkspace);
        }

        // Apply include/exclude filters
        let filteredWorkspaces = workspaces;

        if (this.include.length > 0) {
          const patterns = this.include.map(pattern => new RegExp(pattern));
          filteredWorkspaces = filteredWorkspaces.filter(workspace => {
            const ident = structUtils.stringifyIdent(structUtils.convertToIdent(workspace.anchoredLocator));
            return patterns.some(pattern => pattern.test(ident));
          });
        }

        if (this.exclude.length > 0) {
          const patterns = this.exclude.map(pattern => new RegExp(pattern));
          filteredWorkspaces = filteredWorkspaces.filter(workspace => {
            const ident = structUtils.stringifyIdent(structUtils.convertToIdent(workspace.anchoredLocator));
            return !patterns.some(pattern => pattern.test(ident));
          });
        }

        return filteredWorkspaces;
      }
    }

    /**
     * WorkspacesFocusCommand
     * 
     * Installs only the dependencies required for specific workspaces
     */
    class WorkspacesFocusCommand extends BaseCommand {
      constructor() {
        super();

        this.production = Option.Boolean('--production', false, {
          description: 'Only install regular dependencies, not dev dependencies',
        });

        this.all = Option.Boolean('-A,--all', false, {
          description: 'Install the entire project',
        });

        this.json = Option.Boolean('--json', false, {
          description: 'Format the output as an NDJSON stream',
        });

        this.workspaces = Option.Rest();
      }

      static usage = Command.Usage({
        category: 'Workspace-related commands',
        description: 'Install a single workspace and its dependencies',
        details: `
          This command will run an install that will only focus on a single workspace and its dependencies.

          This command is meant to be used during development, to quickly iterate over a specific workspace without having to install the whole project each time.

          If no workspaces are explicitly listed, the active one will be assumed.

          Note that this command is only very moderately useful when using zero-installs, since the cache will contain all the packages anyway - meaning that the only difference between a full install and a focused install would just be a few extra lines in the .pnp.cjs file, at the cost of introducing an extra complexity.

          If the -A,--all flag is set, the entire project will be installed. Combine with --production to replicate the old yarn install --production.
        `,
        examples: [[
          'Install only the current workspace and its dependencies',
          'yarn workspaces focus',
        ], [
          'Install only the current workspace in production mode (no dev dependencies)',
          'yarn workspaces focus --production',
        ], [
          'Install only the specified workspaces and their dependencies',
          'yarn workspaces focus @austa/design-system @austa/interfaces',
        ]],
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project, workspace: cwdWorkspace } = await Project.find(configuration, this.context.cwd);

        if (!this.all && !cwdWorkspace) {
          throw new Error(`Workspaces can only be found within a workspace`);
        }

        const report = await StreamReport.start({
          configuration,
          json: this.json,
          stdout: this.context.stdout,
        }, async (report) => {
          const rootWorkspace = project.topLevelWorkspace;
          const targetWorkspaces = new Set();

          if (this.all) {
            // Install all workspaces
            for (const workspace of project.workspaces) {
              targetWorkspaces.add(workspace.anchoredLocator.locatorHash);
            }
          } else if (this.workspaces.length === 0) {
            // If no workspaces specified, use the current one
            targetWorkspaces.add(cwdWorkspace.anchoredLocator.locatorHash);
          } else {
            // Otherwise, find the specified workspaces
            for (const workspaceName of this.workspaces) {
              const workspace = project.getWorkspaceByIdent(structUtils.parseIdent(workspaceName));
              if (workspace) {
                targetWorkspaces.add(workspace.anchoredLocator.locatorHash);
              } else {
                report.reportError(null, `Workspace ${workspaceName} not found`);
              }
            }
          }

          // Collect all dependencies of the target workspaces
          const requiredWorkspaces = new Set(targetWorkspaces);
          const processWorkspace = (workspace) => {
            const dependencies = workspace.manifest.getForScope('dependencies');
            const devDependencies = !this.production ? workspace.manifest.getForScope('devDependencies') : new Map();

            for (const [identHash, reference] of [...dependencies.values(), ...devDependencies.values()]) {
              const locatorHash = structUtils.makeLocator(identHash, reference).locatorHash;
              const dependency = project.workspacesByLocator.get(locatorHash);

              if (dependency && !requiredWorkspaces.has(dependency.anchoredLocator.locatorHash)) {
                requiredWorkspaces.add(dependency.anchoredLocator.locatorHash);
                processWorkspace(dependency);
              }
            }
          };

          for (const workspaceHash of targetWorkspaces) {
            const workspace = project.workspacesByLocator.get(workspaceHash);
            if (workspace) {
              processWorkspace(workspace);
            }
          }

          // Filter the project to only include the required workspaces
          const requiredPackages = new Set();

          for (const locatorHash of requiredWorkspaces) {
            const workspace = project.workspacesByLocator.get(locatorHash);
            if (workspace) {
              const ident = structUtils.convertToIdent(workspace.anchoredLocator);
              const identString = structUtils.stringifyIdent(ident);
              report.reportInfo(null, `Including workspace ${formatUtils.pretty(configuration, identString, formatUtils.Type.IDENT)}`);

              // Add all dependencies of the workspace
              const dependencies = workspace.manifest.getForScope('dependencies');
              const devDependencies = !this.production ? workspace.manifest.getForScope('devDependencies') : new Map();

              for (const [identHash, reference] of [...dependencies.values(), ...devDependencies.values()]) {
                const locator = structUtils.makeLocator(identHash, reference);
                requiredPackages.add(locator.locatorHash);
              }
            }
          }

          // Install only the required packages
          await project.install({
            cache: {
              immutable: false,
            },
            report,
            persistProject: true,
            requiredPackages,
          });
        });

        return report.exitCode();
      }
    }

    return {
      commands: [
        WorkspacesForeachCommand,
        WorkspacesFocusCommand,
      ],
    };
  },
};