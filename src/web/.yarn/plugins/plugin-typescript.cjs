/**
 * AUSTA SuperApp TypeScript Plugin
 * 
 * This plugin provides enhanced TypeScript integration for the AUSTA SuperApp monorepo:
 * - Resolves module path aliases (@app/auth, @app/shared, @austa/*)
 * - Coordinates TypeScript project references for proper build ordering
 * - Enables automatic type declaration generation for design system packages
 */

module.exports = {
  name: 'plugin-typescript',
  factory: (require) => {
    const { BaseCommand } = require('@yarnpkg/cli');
    const { Configuration, Project } = require('@yarnpkg/core');
    const { Command, Option } = require('clipanion');
    const { existsSync, readFileSync, writeFileSync } = require('fs');
    const { join, dirname, relative, resolve } = require('path');
    
    /**
     * Command to synchronize TypeScript project references based on workspace dependencies
     */
    class SyncProjectReferencesCommand extends BaseCommand {
      static paths = [['typescript', 'sync-references']];
      
      static usage = Command.Usage({
        description: 'Synchronize TypeScript project references based on workspace dependencies',
        details: 'This command analyzes workspace dependencies and updates tsconfig.json files with proper project references',
        examples: [['Synchronize all project references', 'yarn typescript sync-references']],
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.cwd);
        const workspaces = project.workspaces;
        
        this.context.stdout.write(`Synchronizing TypeScript project references for ${workspaces.length} workspaces\n`);
        
        // Build dependency map
        const dependencyMap = new Map();
        for (const workspace of workspaces) {
          const dependencies = [
            ...Object.keys(workspace.manifest.dependencies || {}),
            ...Object.keys(workspace.manifest.devDependencies || {}),
          ];
          
          dependencyMap.set(workspace.manifest.name, {
            workspace,
            dependencies,
          });
        }
        
        // Update project references in each workspace
        for (const [name, { workspace, dependencies }] of dependencyMap.entries()) {
          const tsconfigPath = join(workspace.cwd, 'tsconfig.json');
          if (!existsSync(tsconfigPath)) continue;
          
          try {
            const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
            
            // Initialize references array if it doesn't exist
            if (!tsconfig.references) tsconfig.references = [];
            
            // Clear existing references
            tsconfig.references = [];
            
            // Add references for each workspace dependency
            for (const dep of dependencies) {
              const depInfo = dependencyMap.get(dep);
              if (!depInfo) continue; // Skip external dependencies
              
              const depTsconfigPath = join(depInfo.workspace.cwd, 'tsconfig.json');
              if (!existsSync(depTsconfigPath)) continue;
              
              const relativePath = relative(dirname(tsconfigPath), depInfo.workspace.cwd);
              tsconfig.references.push({ path: relativePath });
            }
            
            // Write updated tsconfig
            writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
            this.context.stdout.write(`Updated references for ${name}\n`);
          } catch (error) {
            this.context.stdout.write(`Error updating references for ${name}: ${error.message}\n`);
          }
        }
        
        // Update root tsconfig.json with references to all workspaces
        const rootTsconfigPath = join(project.cwd, 'tsconfig.json');
        if (existsSync(rootTsconfigPath)) {
          try {
            const rootTsconfig = JSON.parse(readFileSync(rootTsconfigPath, 'utf8'));
            
            // Initialize references array if it doesn't exist
            if (!rootTsconfig.references) rootTsconfig.references = [];
            
            // Clear existing references
            rootTsconfig.references = [];
            
            // Add references for each workspace
            for (const workspace of workspaces) {
              const workspaceTsconfigPath = join(workspace.cwd, 'tsconfig.json');
              if (!existsSync(workspaceTsconfigPath)) continue;
              
              const relativePath = relative(dirname(rootTsconfigPath), workspace.cwd);
              rootTsconfig.references.push({ path: relativePath });
            }
            
            // Write updated root tsconfig
            writeFileSync(rootTsconfigPath, JSON.stringify(rootTsconfig, null, 2));
            this.context.stdout.write(`Updated root tsconfig.json with ${rootTsconfig.references.length} references\n`);
          } catch (error) {
            this.context.stdout.write(`Error updating root tsconfig.json: ${error.message}\n`);
          }
        }
        
        this.context.stdout.write('TypeScript project references synchronized successfully\n');
      }
    }
    
    /**
     * Command to configure path aliases in TypeScript configuration
     */
    class ConfigurePathAliasesCommand extends BaseCommand {
      static paths = [['typescript', 'configure-aliases']];
      
      static usage = Command.Usage({
        description: 'Configure TypeScript path aliases for the monorepo',
        details: 'This command sets up path aliases (@app/*, @austa/*) in tsconfig.json files',
        examples: [['Configure path aliases', 'yarn typescript configure-aliases']],
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.cwd);
        const workspaces = project.workspaces;
        
        this.context.stdout.write(`Configuring TypeScript path aliases for ${workspaces.length} workspaces\n`);
        
        // Update root tsconfig.json with path aliases
        const rootTsconfigPath = join(project.cwd, 'tsconfig.json');
        if (existsSync(rootTsconfigPath)) {
          try {
            const rootTsconfig = JSON.parse(readFileSync(rootTsconfigPath, 'utf8'));
            
            // Ensure compilerOptions exists
            if (!rootTsconfig.compilerOptions) rootTsconfig.compilerOptions = {};
            
            // Ensure baseUrl is set
            rootTsconfig.compilerOptions.baseUrl = '.';
            
            // Configure path aliases
            rootTsconfig.compilerOptions.paths = {
              '@app/*': ['src/web/web/src/*'],
              '@app/auth/*': ['src/web/web/src/auth/*'],
              '@app/shared/*': ['src/web/shared/*'],
              '@austa/*': ['src/web/*'],
              '@austa/design-system/*': ['src/web/design-system/src/*'],
              '@design-system/primitives/*': ['src/web/primitives/src/*'],
              '@austa/interfaces/*': ['src/web/interfaces/*'],
              '@austa/journey-context/*': ['src/web/journey-context/src/*']
            };
            
            // Write updated root tsconfig
            writeFileSync(rootTsconfigPath, JSON.stringify(rootTsconfig, null, 2));
            this.context.stdout.write(`Updated path aliases in root tsconfig.json\n`);
          } catch (error) {
            this.context.stdout.write(`Error updating path aliases in root tsconfig.json: ${error.message}\n`);
          }
        }
        
        // Update each workspace's tsconfig.json to extend from root
        for (const workspace of workspaces) {
          const tsconfigPath = join(workspace.cwd, 'tsconfig.json');
          if (!existsSync(tsconfigPath)) continue;
          
          try {
            const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
            
            // Set extends to reference root tsconfig if not already set
            if (!tsconfig.extends) {
              const relativePath = relative(workspace.cwd, rootTsconfigPath);
              tsconfig.extends = relativePath;
              
              // Write updated tsconfig
              writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
              this.context.stdout.write(`Updated ${workspace.manifest.name} to extend from root tsconfig\n`);
            }
          } catch (error) {
            this.context.stdout.write(`Error updating ${workspace.manifest.name}: ${error.message}\n`);
          }
        }
        
        this.context.stdout.write('TypeScript path aliases configured successfully\n');
      }
    }
    
    /**
     * Command to enable declaration generation for design system packages
     */
    class EnableDeclarationGenerationCommand extends BaseCommand {
      static paths = [['typescript', 'enable-declarations']];
      
      static usage = Command.Usage({
        description: 'Enable TypeScript declaration generation for design system packages',
        details: 'This command configures automatic type declaration generation for design system packages',
        examples: [['Enable declaration generation', 'yarn typescript enable-declarations']],
      });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { project } = await Project.find(configuration, this.context.cwd);
        const workspaces = project.workspaces;
        
        // Design system package patterns
        const designSystemPatterns = [
          '@austa/design-system',
          '@design-system/primitives',
          '@austa/interfaces',
          '@austa/journey-context'
        ];
        
        this.context.stdout.write(`Configuring declaration generation for design system packages\n`);
        
        // Update tsconfig.json for design system packages
        for (const workspace of workspaces) {
          const isDesignSystemPackage = designSystemPatterns.some(pattern => 
            workspace.manifest.name.startsWith(pattern));
          
          if (!isDesignSystemPackage) continue;
          
          const tsconfigPath = join(workspace.cwd, 'tsconfig.json');
          if (!existsSync(tsconfigPath)) continue;
          
          try {
            const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
            
            // Ensure compilerOptions exists
            if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
            
            // Configure declaration generation
            tsconfig.compilerOptions.declaration = true;
            tsconfig.compilerOptions.declarationMap = true;
            tsconfig.compilerOptions.sourceMap = true;
            
            // Set composite to true for project references
            tsconfig.compilerOptions.composite = true;
            
            // Set outDir for declarations
            tsconfig.compilerOptions.outDir = './dist';
            
            // Write updated tsconfig
            writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
            
            // Update package.json to include types field
            const packageJsonPath = join(workspace.cwd, 'package.json');
            if (existsSync(packageJsonPath)) {
              const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
              
              // Add types field if not present
              if (!packageJson.types) {
                packageJson.types = './dist/index.d.ts';
                writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
              }
            }
            
            this.context.stdout.write(`Configured declaration generation for ${workspace.manifest.name}\n`);
          } catch (error) {
            this.context.stdout.write(`Error configuring ${workspace.manifest.name}: ${error.message}\n`);
          }
        }
        
        this.context.stdout.write('Declaration generation configured successfully\n');
      }
    }
    
    /**
     * Hook that runs after package installation to ensure TypeScript configuration is correct
     */
    const afterAllInstalled = async (project, opts) => {
      // Check if any TypeScript-related packages were installed
      const hasTypeScriptChanges = project.workspaces.some(workspace => {
        const deps = [
          ...Object.keys(workspace.manifest.dependencies || {}),
          ...Object.keys(workspace.manifest.devDependencies || {}),
        ];
        
        return deps.some(dep => 
          dep === 'typescript' || 
          dep.startsWith('@types/') || 
          dep.startsWith('@austa/') ||
          dep.startsWith('@design-system/'));
      });
      
      if (hasTypeScriptChanges) {
        // Auto-configure TypeScript after installation
        const configuration = await Configuration.find(project.cwd, opts.plugins);
        const { project: refreshedProject } = await Project.find(configuration, project.cwd);
        
        // Create a context for command execution
        const context = {
          cwd: project.cwd,
          plugins: opts.plugins,
          stdout: {
            write: (msg) => console.log(msg),
          },
        };
        
        // Run commands to configure TypeScript
        const syncReferences = new SyncProjectReferencesCommand();
        await syncReferences.execute().catch(error => {
          console.error(`Error synchronizing project references: ${error.message}`);
        });
        
        const configureAliases = new ConfigurePathAliasesCommand();
        await configureAliases.execute().catch(error => {
          console.error(`Error configuring path aliases: ${error.message}`);
        });
        
        const enableDeclarations = new EnableDeclarationGenerationCommand();
        await enableDeclarations.execute().catch(error => {
          console.error(`Error enabling declaration generation: ${error.message}`);
        });
      }
    };
    
    return {
      hooks: {
        afterAllInstalled,
      },
      commands: [
        SyncProjectReferencesCommand,
        ConfigurePathAliasesCommand,
        EnableDeclarationGenerationCommand,
      ],
    };
  },
};