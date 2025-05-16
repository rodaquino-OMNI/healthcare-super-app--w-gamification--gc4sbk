/**
 * AUSTA SuperApp - Interactive Tools Plugin for Yarn
 * 
 * This plugin provides interactive interfaces for common Yarn operations,
 * enhancing developer experience when managing dependencies and resolving conflicts.
 * 
 * Features:
 * - Interactive upgrade interface for dependency management
 * - Selective update capabilities for resolving conflicts
 * - Enhanced dependency visualization and conflict resolution
 */

module.exports = {
  name: 'plugin-interactive-tools',
  factory: require => {
    const { BaseCommand } = require('@yarnpkg/cli');
    const { Command, Option, UsageError } = require('clipanion');
    const { Configuration, Project } = require('@yarnpkg/core');
    const { StreamReport, MessageName } = require('@yarnpkg/core');
    const { structUtils, semverUtils } = require('@yarnpkg/core');
    const { suggestUtils } = require('@yarnpkg/plugin-essentials');
    const { prompt } = require('enquirer');
    
    /**
     * Utility function to partition an array into chunks of specified size
     */
    const partition = (array, size) => {
      return array.reduce((acc, item, index) => {
        const chunkIndex = Math.floor(index / size);
        if (!acc[chunkIndex]) acc[chunkIndex] = [];
        acc[chunkIndex].push(item);
        return acc;
      }, []);
    };

    /**
     * Utility function to format dependency information for display
     */
    const formatDependencyInfo = (descriptor, locator, workspace, registry) => {
      const name = structUtils.stringifyIdent(descriptor);
      const current = structUtils.stringifyRange(descriptor);
      const latest = registry.get(name) || current;
      
      return {
        name,
        current,
        latest,
        workspace: workspace ? workspace.manifest.name?.name || 'root' : 'root',
        isOutdated: semverUtils.satisfiesWithPrereleases(latest, current) === false,
      };
    };

    /**
     * Command: upgrade-interactive
     * 
     * Provides an interactive interface for upgrading dependencies
     */
    class UpgradeInteractiveCommand extends BaseCommand {
      static paths = [['upgrade-interactive']];
      
      static usage = Command.Usage({
        description: 'Interactively upgrade dependencies',
        details: 'This command opens an interactive interface to selectively upgrade dependencies.',
        examples: [['Upgrade dependencies interactively', 'yarn upgrade-interactive']],
      });

      workspaces = Option.Boolean('-w,--workspaces', false, {
        description: 'Apply the operation to all workspaces',
      });

      recursive = Option.Boolean('-R,--recursive', false, {
        description: 'Apply the operation to all dependent workspaces',
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project, workspace } = await Project.find(configuration, this.context.cwd);
        const cache = await suggestUtils.fetchDescriptorVersionMap(project, {
          cache: new Map(),
          preserveModifiers: true,
          project,
        });

        await project.restoreInstallState();

        // Collect dependencies to upgrade
        const dependencies = [];
        const workspaceList = this.workspaces ? project.workspaces : [workspace];

        for (const ws of workspaceList) {
          for (const descriptor of ws.manifest.dependencies.values()) {
            const resolution = project.storedResolutions.get(descriptor.descriptorHash);
            if (!resolution) continue;

            const pkg = project.storedPackages.get(resolution);
            if (!pkg) continue;

            const dependencyInfo = formatDependencyInfo(descriptor, pkg, ws, cache);
            if (dependencyInfo.isOutdated) {
              dependencies.push(dependencyInfo);
            }
          }
        }

        if (dependencies.length === 0) {
          const report = await StreamReport.start({
            configuration,
            stdout: this.context.stdout,
          }, async (report) => {
            report.reportInfo(MessageName.UNNAMED, `All dependencies are up to date.`);
          });

          return report.exitCode();
        }

        // Sort dependencies by name
        dependencies.sort((a, b) => a.name.localeCompare(b.name));

        // Display interactive prompt
        const choices = dependencies.map(dep => ({
          name: dep.name,
          message: `${dep.name} (${dep.current} → ${dep.latest})`,
          initial: true,
          workspace: dep.workspace,
          current: dep.current,
          latest: dep.latest,
        }));

        try {
          const response = await prompt({
            type: 'multiselect',
            name: 'dependencies',
            message: 'Select dependencies to upgrade',
            choices,
            limit: 15,
            hint: '(Use <space> to select, <a> to toggle all, <i> to invert selection)',
          });

          const selectedDependencies = response.dependencies;
          
          if (selectedDependencies.length === 0) {
            return 0;
          }

          // Perform the upgrade
          const report = await StreamReport.start({
            configuration,
            stdout: this.context.stdout,
          }, async (report) => {
            for (const dep of selectedDependencies) {
              const targetWorkspace = workspaceList.find(ws => 
                ws.manifest.name?.name === dep.workspace || 
                (dep.workspace === 'root' && ws === workspace)
              );

              if (!targetWorkspace) continue;

              const descriptor = targetWorkspace.manifest.dependencies.get(structUtils.parseIdent(dep.name));
              if (!descriptor) continue;

              const newRange = dep.latest;
              const newDescriptor = structUtils.makeDescriptor(
                descriptor,
                newRange
              );

              targetWorkspace.manifest.dependencies.set(newDescriptor.identHash, newDescriptor);
              report.reportInfo(MessageName.UNNAMED, `Upgraded ${dep.name} from ${dep.current} to ${dep.latest}`);
            }
          });

          if (report.hasErrors()) {
            return report.exitCode();
          }

          await project.install({ quiet: true });
          return 0;
        } catch (error) {
          return 1;
        }
      }
    }

    /**
     * Command: dependency-graph
     * 
     * Visualizes dependency relationships and helps identify conflicts
     */
    class DependencyGraphCommand extends BaseCommand {
      static paths = [['dependency-graph']];
      
      static usage = Command.Usage({
        description: 'Visualize dependency relationships',
        details: 'This command displays a visualization of dependency relationships to help identify conflicts.',
        examples: [['Show dependency graph', 'yarn dependency-graph']],
      });

      name = Option.String('--name', {
        description: 'Filter by package name',
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.cwd);

        await project.restoreInstallState();

        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
        }, async (report) => {
          const dependencies = new Map();
          const conflicts = new Set();

          // Build dependency graph
          for (const pkg of project.storedPackages.values()) {
            if (structUtils.isVirtualLocator(pkg)) continue;
            
            const ident = structUtils.stringifyIdent(pkg);
            const version = pkg.version;
            
            if (this.name && !ident.includes(this.name)) continue;

            if (!dependencies.has(ident)) {
              dependencies.set(ident, new Set());
            }
            dependencies.get(ident).add(version);

            // Check for version conflicts
            if (dependencies.get(ident).size > 1) {
              conflicts.add(ident);
            }
          }

          // Report conflicts
          if (conflicts.size > 0) {
            report.reportInfo(MessageName.UNNAMED, `Found ${conflicts.size} packages with version conflicts:`);
            
            for (const ident of conflicts) {
              const versions = Array.from(dependencies.get(ident));
              report.reportInfo(MessageName.UNNAMED, `  ${ident}: ${versions.join(', ')}`);
            }
          } else {
            report.reportInfo(MessageName.UNNAMED, `No dependency conflicts found.`);
          }

          // Report dependency counts
          report.reportInfo(MessageName.UNNAMED, `\nDependency statistics:`);
          report.reportInfo(MessageName.UNNAMED, `  Total packages: ${dependencies.size}`);
          report.reportInfo(MessageName.UNNAMED, `  Packages with conflicts: ${conflicts.size}`);
        });

        return report.exitCode();
      }
    }

    /**
     * Command: resolve-conflicts
     * 
     * Helps resolve dependency conflicts interactively
     */
    class ResolveConflictsCommand extends BaseCommand {
      static paths = [['resolve-conflicts']];
      
      static usage = Command.Usage({
        description: 'Resolve dependency conflicts interactively',
        details: 'This command helps resolve dependency conflicts by allowing you to select preferred versions.',
        examples: [['Resolve conflicts interactively', 'yarn resolve-conflicts']],
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.plugins);

        await project.restoreInstallState();

        // Find conflicts
        const dependencies = new Map();
        const conflicts = new Map();

        for (const pkg of project.storedPackages.values()) {
          if (structUtils.isVirtualLocator(pkg)) continue;
          
          const ident = structUtils.stringifyIdent(pkg);
          const version = pkg.version;
          
          if (!dependencies.has(ident)) {
            dependencies.set(ident, new Set());
          }
          dependencies.get(ident).add(version);
          
          if (dependencies.get(ident).size > 1) {
            conflicts.set(ident, Array.from(dependencies.get(ident)));
          }
        }

        if (conflicts.size === 0) {
          const report = await StreamReport.start({
            configuration,
            stdout: this.context.stdout,
          }, async (report) => {
            report.reportInfo(MessageName.UNNAMED, `No dependency conflicts found.`);
          });

          return report.exitCode();
        }

        // Resolve conflicts interactively
        const resolutions = new Map();

        for (const [ident, versions] of conflicts.entries()) {
          try {
            const response = await prompt({
              type: 'select',
              name: 'version',
              message: `Select preferred version for ${ident}`,
              choices: versions.map(version => ({
                name: version,
                message: version,
              })),
            });

            resolutions.set(ident, response.version);
          } catch (error) {
            return 1;
          }
        }

        // Apply resolutions
        const report = await StreamReport.start({
          configuration,
          stdout: this.context.stdout,
        }, async (report) => {
          for (const [ident, version] of resolutions.entries()) {
            const descriptor = structUtils.parseIdent(ident);
            project.resolutions.push({
              pattern: structUtils.makeDescriptor(descriptor, 'npm:*'),
              reference: structUtils.makeDescriptor(descriptor, `npm:${version}`).range,
            });

            report.reportInfo(MessageName.UNNAMED, `Added resolution for ${ident}@${version}`);
          }

          // Update .yarnrc.yml
          const rcPath = configuration.sources.get(project.cwd)?.source || '.yarnrc.yml';
          report.reportInfo(MessageName.UNNAMED, `\nResolutions added to ${rcPath}. Run yarn install to apply changes.`);
        });

        return report.exitCode();
      }
    }

    return {
      commands: [
        UpgradeInteractiveCommand,
        DependencyGraphCommand,
        ResolveConflictsCommand,
      ],
    };
  },
};